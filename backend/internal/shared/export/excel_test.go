package export

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestExcelStreamWriter_MinimalRows creates a writer with 3 columns,
// adds 5 primitive-typed rows, and asserts the resulting bytes are
// non-empty and look like a real .xlsx file (ZIP magic 0x50 0x4B 0x03
// 0x04).
func TestExcelStreamWriter_MinimalRows(t *testing.T) {
	cols := []ExcelColumn{
		{Header: "ID", Width: 8},
		{Header: "Name", Width: 16},
		{Header: "Active", Width: 10},
	}

	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)
	assert.NotNil(t, writer)

	rows := [][]interface{}{
		{1, "Alice", true},
		{2, "Bob", false},
		{3, "Carol", true},
		{4, "Dave", false},
		{5, "Erin", true},
	}
	assert.NoError(t, writer.AddRows(rows))
	assert.NoError(t, writer.Close())

	data := buf.Bytes()
	assert.NotEmpty(t, data, "xlsx output should not be empty")
	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, data[:4], "xlsx output should start with ZIP magic")
}

// TestExcelStreamWriter_EmptyBody exercises the "no data rows" edge
// case: the writer should still produce a valid (header-only) xlsx.
func TestExcelStreamWriter_EmptyBody(t *testing.T) {
	cols := []ExcelColumn{
		{Header: "A", Width: 10},
		{Header: "B", Width: 10},
	}

	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)
	assert.NoError(t, writer.Close())

	data := buf.Bytes()
	assert.NotEmpty(t, data)
	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, data[:4])
}

// TestExcelStreamWriter_NoColumns exercises the "no columns" edge case:
// the writer should still produce a valid empty xlsx workbook.
func TestExcelStreamWriter_NoColumns(t *testing.T) {
	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", nil)
	assert.NoError(t, err)
	assert.NoError(t, writer.Close())

	data := buf.Bytes()
	assert.NotEmpty(t, data)
	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, data[:4])
}

// TestExcelStreamWriter_NilWriterReturnsError ensures the constructor
// rejects a nil io.Writer.
func TestExcelStreamWriter_NilWriterReturnsError(t *testing.T) {
	_, err := NewExcelStreamWriter(nil, "Sheet1", nil)
	assert.Error(t, err)
}

// TestExcelStreamWriter_FlushIsIdempotent ensures Flush can be called
// repeatedly without errors and AddRow still works afterwards.
func TestExcelStreamWriter_FlushIsIdempotent(t *testing.T) {
	cols := []ExcelColumn{{Header: "V", Width: 10}}
	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)
	assert.NoError(t, writer.AddRow([]interface{}{"x"}))
	assert.NoError(t, writer.Flush())
	assert.NoError(t, writer.Flush())
	assert.NoError(t, writer.AddRow([]interface{}{"y"}))
	assert.NoError(t, writer.Close())

	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, buf.Bytes()[:4])
}

// TestExcelStreamWriter_DoubleCloseReturnsError ensures Close can only
// be called once.
func TestExcelStreamWriter_DoubleCloseReturnsError(t *testing.T) {
	cols := []ExcelColumn{{Header: "V", Width: 10}}
	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)
	assert.NoError(t, writer.Close())
	assert.Error(t, writer.Close())
}

// TestExcelStreamWriter_Large exercises the periodic flush path
// inside ExcelStreamWriter (every 1000 rows). With 1500 rows the
// inner Flush() at rowIdx=1000 is reached.
func TestExcelStreamWriter_Large(t *testing.T) {
	cols := []ExcelColumn{
		{Header: "ID", Width: 8},
		{Header: "Value", Width: 16},
	}
	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)

	rows := make([][]interface{}, 1500)
	for i := 0; i < 1500; i++ {
		rows[i] = []interface{}{i, "row-" + itoa(i)}
	}
	assert.NoError(t, writer.AddRows(rows))
	assert.NoError(t, writer.Close())

	data := buf.Bytes()
	assert.NotEmpty(t, data)
	assert.Equal(t, []byte{0x50, 0x4B, 0x03, 0x04}, data[:4])
}

// TestExcelStreamWriter_PrimitiveTypes exercises all the supported
// primitive value types in a single workbook: string, int, int64,
// float64, bool, and nil.
func TestExcelStreamWriter_PrimitiveTypes(t *testing.T) {
	cols := []ExcelColumn{
		{Header: "S", Width: 8},
		{Header: "I", Width: 8},
		{Header: "I64", Width: 10},
		{Header: "F", Width: 10},
		{Header: "B", Width: 8},
		{Header: "N", Width: 8},
	}
	var buf bytes.Buffer
	writer, err := NewExcelStreamWriter(&buf, "Sheet1", cols)
	assert.NoError(t, err)
	assert.NoError(t, writer.AddRow([]interface{}{"hello", 42, int64(9_000_000_000), 3.14, true, nil}))
	assert.NoError(t, writer.Close())

	assert.NotEmpty(t, buf.Bytes())
}

// itoa is a tiny helper that avoids importing strconv into a test
// file. We only need positive integers < 10000 for the Large test.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}
