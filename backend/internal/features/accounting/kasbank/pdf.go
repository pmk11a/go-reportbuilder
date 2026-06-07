// Package kasbank — PDF generator for Kas/Bank vouchers.
//
// The PDF is laid out as a single A4 page with:
//   - Header band: company name (placeholder), voucher type, NoBukti, date.
//   - Detail table: rows of [No, Uraian, Perkiraan, Debet, Kredit].
//   - Footer band: three signature boxes (Dibuat oleh, Otorisasi 1, Otorisasi 2).
//
// We do NOT use the generic export.PDFTableWriter because the footer
// band needs custom layout (three labelled boxes side by side) and we
// want to embed signature date+user below each name.
package kasbank

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
)

// pdfCompanyName is the placeholder company name in the header. Real
// deployments would read this from the perusahaan config table.
const pdfCompanyName = "DANA PENSIUN"

const (
	pdfFontSizeTitle    = 14.0
	pdfFontSizeSubtitle = 10.0
	pdfFontSizeBody     = 9.0
	pdfFontSizeSmall    = 8.0
	pdfPageMargin       = 15.0
	pdfTableHeaderH     = 7.0
	pdfTableRowH        = 6.0
)

// GenerateKasBankPDF returns an io.Reader over the rendered PDF bytes.
// The caller is expected to set Content-Type: application/pdf and stream
// the reader back to the client.
func GenerateKasBankPDF(header *SKasBankHeader, details []SDbTransaksi) (*bytes.Reader, error) {
	if header == nil {
		return nil, fmt.Errorf("pdf: header is nil")
	}

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(pdfPageMargin, pdfPageMargin, pdfPageMargin)
	pdf.SetAutoPageBreak(false, pdfPageMargin)
	pdf.AddPage()

	drawPDFHeader(pdf, header)
	drawPDFDetailTable(pdf, details)
	drawPDFFooterSignatures(pdf, header)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("writing pdf: %w", err)
	}
	return bytes.NewReader(buf.Bytes()), nil
}

// drawPDFHeader renders the top band: company name (centered, bold) +
// "Bukti Kas/Bank {TIPE}" + NoBukti | Tanggal | PerkiraanHd on a second
// line. The header sits in the top 30mm of the page.
func drawPDFHeader(pdf *fpdf.Fpdf, h *SKasBankHeader) {
	pdf.SetFont("Helvetica", "B", pdfFontSizeTitle)
	pdf.CellFormat(0, 8, pdfCompanyName, "", 1, "C", false, 0, "")

	tipe := ""
	if h.TipeTransHd != nil {
		tipe = *h.TipeTransHd
	}
	pdf.SetFont("Helvetica", "B", pdfFontSizeSubtitle)
	title := fmt.Sprintf("Bukti %s", tipeLabel(tipe))
	pdf.CellFormat(0, 6, title, "", 1, "C", false, 0, "")

	// NoBukti | Tanggal | PerkiraanHd
	pdf.SetFont("Helvetica", "", pdfFontSizeBody)
	tanggalStr := ""
	if h.Tanggal != nil {
		tanggalStr = h.Tanggal.Format("02 Jan 2006")
	}
	perkiraan := ""
	if h.PerkiraanHd != nil {
		perkiraan = *h.PerkiraanHd
	}
	pdf.CellFormat(0, 5, fmt.Sprintf("No: %s    Tanggal: %s    Akun: %s", h.NoBukti, tanggalStr, perkiraan), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("Catatan: %s", truncateForPDF(h.Note, 100)), "", 1, "L", false, 0, "")
	pdf.Ln(4)
}

// drawPDFDetailTable renders the body table with 5 columns:
// [No, Uraian, Perkiraan, Debet, Kredit]. We use a custom layout instead
// of export.PDFTableWriter so the totals row can sit at the bottom.
func drawPDFDetailTable(pdf *fpdf.Fpdf, details []SDbTransaksi) {
	// Column widths in mm. Page width is 210mm, margin 15mm each side,
	// printable area is 180mm.
	widths := []float64{10, 70, 35, 32, 33}
	headers := []string{"No", "Uraian", "Perkiraan", "Debet (Rp)", "Kredit (Rp)"}

	// Header row
	pdf.SetFont("Helvetica", "B", pdfFontSizeBody)
	pdf.SetFillColor(220, 220, 220)
	for i, hdr := range headers {
		pdf.CellFormat(widths[i], pdfTableHeaderH, hdr, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(pdfTableHeaderH)

	var totalD, totalK float64
	pdf.SetFont("Helvetica", "", pdfFontSizeBody)
	for _, d := range details {
		noStr := fmt.Sprintf("%d", d.Urut)
		uraian := truncateForPDF(d.Keterangan, 60)
		pdf.CellFormat(widths[0], pdfTableRowH, noStr, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[1], pdfTableRowH, uraian, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[2], pdfTableRowH, d.Perkiraan, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[3], pdfTableRowH, formatRupiah(d.Debet), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[4], pdfTableRowH, formatRupiah(d.Kredit), "1", 0, "R", false, 0, "")
		pdf.Ln(pdfTableRowH)
		totalD += d.Debet
		totalK += d.Kredit
	}
	// Totals row
	pdf.SetFont("Helvetica", "B", pdfFontSizeBody)
	pdf.CellFormat(widths[0]+widths[1]+widths[2], pdfTableRowH, "TOTAL", "1", 0, "R", false, 0, "")
	pdf.CellFormat(widths[3], pdfTableRowH, formatRupiah(totalD), "1", 0, "R", false, 0, "")
	pdf.CellFormat(widths[4], pdfTableRowH, formatRupiah(totalK), "1", 0, "R", false, 0, "")
	pdf.Ln(pdfTableRowH + 6)
}

// drawPDFFooterSignatures draws three labelled signature boxes at the
// bottom of the page. Each box has a label, a name placeholder line,
// and a date line.
func drawPDFFooterSignatures(pdf *fpdf.Fpdf, h *SKasBankHeader) {
	pdf.Ln(8)
	pdf.SetFont("Helvetica", "", pdfFontSizeSmall)
	boxW := 55.0
	boxH := 30.0
	startY := pdf.GetY()
	gapX := 7.5
	startX := pdfPageMargin

	labels := []string{"Dibuat oleh", "Otorisasi 1", "Otorisasi 2"}
	for i, lbl := range labels {
		x := startX + float64(i)*(boxW+gapX)
		pdf.SetXY(x, startY)
		pdf.CellFormat(boxW, 6, lbl, "", 0, "C", false, 0, "")
		// signature line
		pdf.SetXY(x, startY+boxH-2)
		pdf.CellFormat(boxW, 4, "( ............................. )", "", 0, "C", false, 0, "")
		// date line
		pdf.SetXY(x, startY+boxH+4)
		pdf.SetFont("Helvetica", "", 7)
		pdf.CellFormat(boxW, 4, "Tgl: .............................", "", 0, "C", false, 0, "")
		pdf.SetFont("Helvetica", "", pdfFontSizeSmall)
	}
	// Hint to silence the "unused parameter" warning when the header has
	// no otorisator names yet.
	_ = h
}

// tipeLabel returns the human-readable label for a voucher type code.
func tipeLabel(tipe string) string {
	switch strings.ToUpper(tipe) {
	case TipeBKM:
		return "Kas Masuk"
	case TipeBKK:
		return "Kas Keluar"
	case TipeBBM:
		return "Bank Masuk"
	case TipeBBK:
		return "Bank Keluar"
	}
	return "Transaksi"
}

// formatRupiah renders a float as "1.234.567,89". The format is fixed
// (Indonesian thousand-separator dot, decimal comma) so the output is
// stable across locales.
func formatRupiah(n float64) string {
	negative := n < 0
	if negative {
		n = -n
	}
	// Split into integer + decimal parts.
	intPart := int64(n)
	decPart := int64((n - float64(intPart)) * 100)
	if decPart < 0 {
		decPart = -decPart
	}
	// Insert thousand separators every 3 digits from the right.
	intStr := fmt.Sprintf("%d", intPart)
	var b strings.Builder
	if negative {
		b.WriteByte('-')
	}
	for i, c := range intStr {
		if i > 0 && (len(intStr)-i)%3 == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(c)
	}
	if decPart > 0 {
		return fmt.Sprintf("%s,%02d", b.String(), decPart)
	}
	return b.String()
}

// truncateForPDF returns s clipped to maxLen runes with an ellipsis.
func truncateForPDF(s string, maxLen int) string {
	if maxLen < 1 {
		return ""
	}
	if len(s) <= maxLen {
		return s
	}
	if maxLen == 1 {
		return "…"
	}
	return s[:maxLen-1] + "…"
}

// Compile-time guard: enforce the layout doesn't break if time is
// imported (it is referenced through h.Tanggal formatting above).
var _ = time.Now
