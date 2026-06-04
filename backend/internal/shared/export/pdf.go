package export

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
)

// PDFOrientation is the page orientation passed to fpdf.New. Use
// PDFPortrait for tall tables and PDFLandscape for wide ones.
type PDFOrientation string

const (
	// PDFPortrait is the "P" orientation in fpdf (tall).
	PDFPortrait PDFOrientation = "P"
	// PDFLandscape is the "L" orientation in fpdf (wide).
	PDFLandscape PDFOrientation = "L"
)

// pdfFont is the only font used by the table writer. fpdf ships
// Helvetica + Helvetica-Bold + Helvetica-Italic + Helvetica-BoldItalic
// built-in, so we never need to embed a TTF.
const pdfFont = "Helvetica"

// pdfDefaultMargin is the page margin (in mm) applied to all four sides
// of every page. The same value is used for the header, footer, and
// table area for consistent layout.
const pdfDefaultMargin = 10.0

// pdfFooterHeight is the vertical space reserved at the bottom of every
// page for the page-number footer.
const pdfFooterHeight = 12.0

// pdfRowHeight is the height (in mm) of a single body row at 7pt.
const pdfRowHeight = 5.0

// pdfRowsPerPage is the soft cap on body rows per page. The writer also
// checks the current Y position and breaks the page early if the body
// runs off the bottom margin. The cap protects the layout from a
// pathological colWidths configuration.
const pdfRowsPerPage = 30

// pdfHeaderBgColor is the indigo-600 background colour used for the
// table header row. Each component is 0-255.
const (
	pdfHeaderBgR = 79
	pdfHeaderBgG = 70
	pdfHeaderBgB = 229
)

// PDFTableWriter streams a paginated, tabular report to an underlying
// io.Writer as a real PDF file. It knows about page layout, fonts, and
// pagination, but has no opinion about what the rows mean: each row is
// a []string and each column width is a number in millimetres. This
// keeps the utils package free of feature-specific knowledge.
type PDFTableWriter struct {
	out         io.Writer
	pdf         *fpdf.Fpdf
	cols        []string
	colWidths   []float64 // in mm
	pageH       float64
	rowsPerPage int
	rowCount    int
	title       string
	subtitle    string
	closed      bool
}

// NewPDFTableWriter creates a table PDF writer. orientation is one of
// PDFPortrait or PDFLandscape; cols and colWidths must have the same
// length and their widths (in mm) should fit within the printable area
// (page width minus 2 × margin).
//
// title appears at the top of every page. subtitle is rendered on a
// second line under the title (pass "" to skip).
//
// NewPDFTableWriter does NOT call AddPage internally. AddRow will
// start the first page the first time it runs, and the column header
// row is rendered automatically on every page break.
func NewPDFTableWriter(w io.Writer, orientation PDFOrientation, cols []string, colWidths []float64, title, subtitle string) (*PDFTableWriter, error) {
	if w == nil {
		return nil, fmt.Errorf("pdf table writer: nil io.Writer")
	}
	if len(cols) != len(colWidths) {
		return nil, fmt.Errorf("pdf table writer: cols and colWidths length mismatch (%d vs %d)", len(cols), len(colWidths))
	}

	pdf := fpdf.New(string(orientation), "mm", "A4", "")
	pdf.SetMargins(pdfDefaultMargin, pdfDefaultMargin, pdfDefaultMargin)
	pdf.SetAutoPageBreak(false, pdfDefaultMargin) // we manage breaks manually

	// Capture writer state in a closure so the SetHeaderFunc / SetFooterFunc
	// callbacks can render the table header and page number without
	// holding a pointer to the partially-constructed PDFTableWriter.
	p := &PDFTableWriter{
		out:         w,
		pdf:         pdf,
		cols:        cols,
		colWidths:   colWidths,
		pageH:       pageSizeFor(orientation, false),
		rowsPerPage: pdfRowsPerPage,
		title:       title,
		subtitle:    subtitle,
	}

	pdf.SetHeaderFuncMode(func() {
		pdf.SetFont(pdfFont, "B", 14)
		pdf.SetY(8)
		pdf.CellFormat(0, 8, title, "", 0, "L", false, 0, "")
		pdf.Ln(6)

		pdf.SetFont(pdfFont, "", 8)
		pdf.CellFormat(0, 4, fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04:05")), "", 0, "L", false, 0, "")
		pdf.Ln(4)
		if subtitle != "" {
			pdf.CellFormat(0, 4, subtitle, "", 0, "L", false, 0, "")
			pdf.Ln(4)
		}
		pdf.Ln(2)
		renderPDFColumnHeader(pdf, cols, colWidths)
	}, true)

	pdf.SetFooterFunc(func() {
		pdf.SetY(-pdfFooterHeight)
		pdf.SetFont(pdfFont, "I", 7)
		pdf.CellFormat(0, 6, fmt.Sprintf("Page %d", pdf.PageNo()), "", 0, "C", false, 0, "")
	})

	return p, nil
}

// pageSizeFor returns the page dimension (in mm) for A4 in the given
// orientation. width=true returns the long edge, false the short edge.
func pageSizeFor(o PDFOrientation, width bool) float64 {
	if o == PDFLandscape {
		if width {
			return 297.0
		}
		return 210.0
	}
	if width {
		return 210.0
	}
	return 297.0
}

// AddRow appends a single row to the table. The row is rendered
// immediately; if the new row would overflow the page (either by
// hitting rowsPerPage or by running off the bottom margin), a new page
// is started automatically and the column header is repeated.
//
// The first AddRow call also triggers the first AddPage, which in
// turn invokes the header function set up in NewPDFTableWriter.
func (p *PDFTableWriter) AddRow(values []string) error {
	if p == nil || p.pdf == nil {
		return fmt.Errorf("pdf table writer: not initialized")
	}
	if p.closed {
		return fmt.Errorf("pdf table writer: already closed")
	}
	if len(values) != len(p.cols) {
		return fmt.Errorf("pdf table writer: row has %d values, expected %d", len(values), len(p.cols))
	}

	// First row? Start a page (which will fire the header function).
	if p.rowCount == 0 {
		p.pdf.AddPage()
	}
	// Break BEFORE writing if the row would overflow.
	if p.rowCount >= p.rowsPerPage || p.pdf.GetY() > p.pageH-pdfDefaultMargin-pdfRowHeight {
		p.pdf.AddPage()
		p.rowCount = 0
	}
	renderPDFBodyRow(p.pdf, p.colWidths, values)
	p.rowCount++
	return nil
}

// AddRows is a convenience wrapper that calls AddRow for each element
// of rows. It returns the first error encountered, after which
// subsequent rows are not written.
func (p *PDFTableWriter) AddRows(rows [][]string) error {
	for i, r := range rows {
		if err := p.AddRow(r); err != nil {
			return fmt.Errorf("add row %d: %w", i, err)
		}
	}
	return nil
}

// Close finalizes the PDF and writes the trailer to the underlying
// io.Writer. It must be called exactly once; calling it more than once
// returns an error.
//
// If AddRow was never called (i.e. the table is empty), Close still
// emits a page with just the header so the output is a valid PDF.
func (p *PDFTableWriter) Close() error {
	if p == nil || p.pdf == nil {
		return fmt.Errorf("pdf table writer: not initialized")
	}
	if p.closed {
		return fmt.Errorf("pdf table writer: already closed")
	}
	p.closed = true

	// Edge case: caller asked for an empty report -> AddPage() was
	// never called by AddRow, so do it now to emit a header.
	if p.rowCount == 0 {
		p.pdf.AddPage()
	}

	if err := p.pdf.Output(p.out); err != nil {
		return fmt.Errorf("write pdf: %w", err)
	}
	p.pdf = nil
	return nil
}

// renderPDFColumnHeader writes the table header row (one cell per
// column) at the current Y. Cells share the indigo background defined
// by pdfHeaderBg*.
func renderPDFColumnHeader(pdf *fpdf.Fpdf, cols []string, widths []float64) {
	pdf.SetFont(pdfFont, "B", 7)
	pdf.SetFillColor(pdfHeaderBgR, pdfHeaderBgG, pdfHeaderBgB)
	pdf.SetTextColor(255, 255, 255)
	for i, h := range cols {
		pdf.CellFormat(widths[i], 6, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(6)
	pdf.SetTextColor(0, 0, 0)
}

// renderPDFBodyRow writes a single body row at the current Y position.
// widths and values are assumed to have the same length.
func renderPDFBodyRow(pdf *fpdf.Fpdf, widths []float64, values []string) {
	pdf.SetFont(pdfFont, "", 7)
	for i, v := range values {
		pdf.CellFormat(widths[i], pdfRowHeight, truncateCell(v, int(widths[i])), "1", 0, "L", false, 0, "")
	}
	pdf.Ln(pdfRowHeight)
}

// truncateCell shortens a string so it visually fits inside a cell of
// the given width (in mm). The rule of thumb is one character per mm
// at 7pt, so we cap the visible run count to that value and append
// "…" when truncation occurred. Returns the input unchanged when it
// already fits.
func truncateCell(s string, maxRunes int) string {
	s = strings.TrimSpace(s)
	if maxRunes < 1 {
		maxRunes = 1
	}
	if len(s) <= maxRunes {
		return s
	}
	if maxRunes == 1 {
		return "…"
	}
	return s[:maxRunes-1] + "…"
}
