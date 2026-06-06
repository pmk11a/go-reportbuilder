package export

import (
	"fmt"
	"io"

	"github.com/xuri/excelize/v2"
)

// excelStreamFlushInterval is the default number of rows the streaming
// Excel writer accumulates in its in-memory buffer before forcing a flush
// to the underlying io.Writer. Smaller values use less memory but cost
// extra system calls; 1000 is a reasonable balance for reports of any size.
const excelStreamFlushInterval = 1000

// ExcelColumn describes a single column of an Excel worksheet written by
// ExcelStreamWriter. The struct holds only display metadata — no domain
// knowledge — so it can be reused by any feature that needs to render
// tabular data as .xlsx.
type ExcelColumn struct {
	// Header is the text rendered in the header row.
	Header string
	// Width is the column width in characters (the same unit excelize uses
	// for SetColWidth). A value of 0 leaves the column at the library
	// default width.
	Width float64
}

// ExcelStreamWriter streams a tabular report to an underlying io.Writer as
// a real .xlsx workbook. Memory usage stays bounded for any number of rows
// because rows are written through excelize's StreamWriter API which spills
// to disk once the row count exceeds the library's in-memory threshold.
//
// The writer has no opinion about what the rows mean; the caller decides
// the column layout via ExcelColumn and converts each domain object into a
// slice of primitive values before calling AddRow. This keeps the utils
// package free of feature-specific knowledge.
type ExcelStreamWriter struct {
	out    io.Writer
	file   *excelize.File
	stream *excelize.StreamWriter
	sheet  string
	cols   []ExcelColumn
	row    int    // last row written; the next AddRow increments it
	header int    // style id for the header row
	closed bool   // guards against double-Close
}

// NewExcelStreamWriter creates a streaming Excel writer that emits a
// single sheet named sheetName to w. The first call to AddRow writes the
// styled header (one cell per ExcelColumn) and subsequent AddRow calls
// append data rows. Call Close exactly once to finalize the workbook.
//
// cols may be empty, in which case the writer still produces a valid
// (empty-body) workbook — useful for the "no rows" edge case.
func NewExcelStreamWriter(w io.Writer, sheetName string, cols []ExcelColumn) (*ExcelStreamWriter, error) {
	if w == nil {
		return nil, fmt.Errorf("excel stream writer: nil io.Writer")
	}
	if sheetName == "" {
		sheetName = "Sheet1"
	}

	f := excelize.NewFile()
	// The library always creates "Sheet1" up-front. Repurpose it as the
	// requested sheet so we never end up with two tabs.
	if sheetName != "Sheet1" {
		if _, err := f.NewSheet(sheetName); err != nil {
			_ = f.Close()
			return nil, fmt.Errorf("create sheet %q: %w", sheetName, err)
		}
		if err := f.DeleteSheet("Sheet1"); err != nil {
			// non-fatal — defensive: DeleteSheet may fail if "Sheet1"
			// was never created, which is harmless here.
		}
	}

	// Apply column widths (only for columns with a non-zero width).
	for i, c := range cols {
		if c.Width <= 0 {
			continue
		}
		colLetter, err := excelize.ColumnNumberToName(i + 1)
		if err != nil {
			_ = f.Close()
			return nil, fmt.Errorf("resolve column %d name: %w", i+1, err)
		}
		if err := f.SetColWidth(sheetName, colLetter, colLetter, c.Width); err != nil {
			_ = f.Close()
			return nil, fmt.Errorf("set col width %s: %w", colLetter, err)
		}
	}

	// Reusable header style: bold + white text on indigo background.
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"4F46E5"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	if err != nil {
		_ = f.Close()
		return nil, fmt.Errorf("create header style: %w", err)
	}

	stream, err := f.NewStreamWriter(sheetName)
	if err != nil {
		_ = f.Close()
		return nil, fmt.Errorf("new stream writer: %w", err)
	}

	// Freeze the header row so it stays visible while the user scrolls.
	// SetPanes MUST be called before any SetRow per the excelize
	// StreamWriter contract.
	if len(cols) > 0 {
		if err := stream.SetPanes(&excelize.Panes{
			Freeze:      true,
			Split:       false,
			XSplit:      0,
			YSplit:      1,
			TopLeftCell: "A2",
			ActivePane:  "bottomLeft",
		}); err != nil {
			_ = f.Close()
			return nil, fmt.Errorf("set freeze panes: %w", err)
		}
	}

	e := &ExcelStreamWriter{
		out:    w,
		file:   f,
		stream: stream,
		sheet:  sheetName,
		cols:   cols,
		row:    0,
		header: headerStyle,
	}

	// Emit the header row (row 1) immediately so the stream is in a
	// consistent state when the caller starts adding data.
	if len(cols) > 0 {
		headers := make([]interface{}, len(cols))
		for i, c := range cols {
			headers[i] = c.Header
		}
		if err := stream.SetRow("A1", headers, excelize.RowOpts{StyleID: headerStyle}); err != nil {
			_ = f.Close()
			return nil, fmt.Errorf("set header row: %w", err)
		}
		e.row = 1
	}

	return e, nil
}

// AddRow appends a single row of values to the worksheet. Supported value
// types are string, bool, all int/uint variants, float32, float64, and
// nil. Other types are converted via fmt.Sprintf("%v", v) by the
// underlying excelize library. The number of values does not have to
// match the column count; the writer will pad with empty cells.
func (e *ExcelStreamWriter) AddRow(values []interface{}) error {
	if e == nil || e.stream == nil {
		return fmt.Errorf("excel stream writer: not initialized")
	}
	if e.closed {
		return fmt.Errorf("excel stream writer: already closed")
	}
	rowIdx := e.row + 1
	cell := fmt.Sprintf("A%d", rowIdx)
	if err := e.stream.SetRow(cell, values); err != nil {
		return fmt.Errorf("set row %d: %w", rowIdx, err)
	}
	e.row = rowIdx

	// Periodic flush keeps memory low on large reports.
	if rowIdx%excelStreamFlushInterval == 0 {
		return e.Flush()
	}
	return nil
}

// AddRows is a convenience wrapper that calls AddRow for each element of
// rows. It returns the first error encountered, after which subsequent
// rows are not written.
func (e *ExcelStreamWriter) AddRows(rows [][]interface{}) error {
	for i, r := range rows {
		if err := e.AddRow(r); err != nil {
			return fmt.Errorf("add row %d: %w", i, err)
		}
	}
	return nil
}

// Flush forces the in-memory stream to be written to the underlying
// io.Writer. Callers working with very large datasets may invoke this
// periodically, but it is also called automatically by AddRow every
// excelStreamFlushInterval rows.
func (e *ExcelStreamWriter) Flush() error {
	if e == nil || e.stream == nil {
		return fmt.Errorf("excel stream writer: not initialized")
	}
	if e.closed {
		return nil // flushing after Close is a no-op
	}
	if err := e.stream.Flush(); err != nil {
		return fmt.Errorf("flush stream: %w", err)
	}
	return nil
}

// Close finalizes the workbook and writes the .xlsx trailer to the
// underlying io.Writer. It must be called exactly once; calling it more
// than once returns an error.
func (e *ExcelStreamWriter) Close() error {
	if e == nil || e.file == nil {
		return fmt.Errorf("excel stream writer: not initialized")
	}
	if e.closed {
		return fmt.Errorf("excel stream writer: already closed")
	}
	e.closed = true
	defer func() {
		_ = e.file.Close()
		e.file = nil
		e.stream = nil
	}()
	// Best-effort final flush; ignore errors so Close is safe to call
	// after periodic Flush() invocations.
	if e.stream != nil {
		_ = e.stream.Flush()
	}
	if err := e.file.Write(e.out); err != nil {
		return fmt.Errorf("write xlsx: %w", err)
	}
	return nil
}
