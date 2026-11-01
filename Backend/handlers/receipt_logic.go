package handlers

import (
	"POSWEB/models"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/jung-kurt/gofpdf"
)

const (
	StatusPaid    = "paid"
	StatusBalance = "balance"
)

// Edit these to change what prints at the top of every receipt PDF.
var (
	businessName    = "JOSKA CAKES & SNACKS"
	businessTagline = "For: Birthday Cakes, Wedding and all types of Occasions."
	businessAddress = []string{"Mwimuto Kabete", "P.O. Box 8143 - 00300", "Nairobi"}
	businessPhones  = []string{"Tel: 0758 059 963", "0729 750 659"}
)

type PaymentResult struct {
	Total   float64
	Paid    float64
	Balance float64
	Status  string
}

func round2(x float64) float64 { return math.Round(x*100) / 100 }

// FormatReceiptNo turns the database ID into the number printed on the receipt, e.g. JC-0007.
func FormatReceiptNo(id uint) string { return fmt.Sprintf("JC-%04d", id) }

func NormalizeStatus(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "paid", "full", "fully_paid", "fully paid":
		return StatusPaid
	case "balance", "part", "partial", "deposit", "part_payment":
		return StatusBalance
	}
	return ""
}

func NormalizeMethod(m string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(m)) {
	case "", "cash":
		return "cash", nil
	case "cheque", "check":
		return "cheque", nil
	case "mpesa", "m-pesa", "m_pesa":
		return "mpesa", nil
	}
	return "", errors.New("Payment method must be cash, cheque or mpesa")
}

func methodLabel(m string) string {
	switch m {
	case "cheque":
		return "Cheque"
	case "mpesa":
		return "M-Pesa"
	}
	return "Cash"
}

// ResolvePayment decides the final total, amount paid and balance for a receipt.
func ResolvePayment(total, paid float64, status string) (PaymentResult, error) {
	st := NormalizeStatus(status)
	if st == "" {
		return PaymentResult{}, errors.New("Choose whether the order is fully paid or has a balance")
	}
	if total < 0 || paid < 0 {
		return PaymentResult{}, errors.New("Amounts cannot be negative")
	}
	total, paid = round2(total), round2(paid)

	if st == StatusPaid {
		amount := total
		if amount == 0 {
			amount = paid
		}
		if amount <= 0 {
			return PaymentResult{}, errors.New("Enter the amount received")
		}
		if total > 0 && paid > 0 && total != paid {
			return PaymentResult{}, errors.New("For a fully paid receipt, the amount paid must equal the total")
		}
		return PaymentResult{Total: amount, Paid: amount, Balance: 0, Status: StatusPaid}, nil
	}

	if total <= 0 {
		return PaymentResult{}, errors.New("Enter the full price of the order")
	}
	if paid <= 0 {
		return PaymentResult{}, errors.New("Enter the amount paid now")
	}
	if paid >= total {
		return PaymentResult{}, errors.New("Amount paid must be less than the total. Choose Fully paid instead")
	}
	return PaymentResult{Total: total, Paid: paid, Balance: round2(total - paid), Status: StatusBalance}, nil
}

func formatNumber(x float64) string {
	neg := x < 0
	if neg {
		x = -x
	}
	s := fmt.Sprintf("%.2f", x)
	intPart, dec := s[:len(s)-3], s[len(s)-2:]
	var b strings.Builder
	for i, ch := range intPart {
		if i > 0 && (len(intPart)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(ch)
	}
	out := b.String()
	if dec != "00" {
		out += "." + dec
	}
	if neg {
		out = "-" + out
	}
	return out
}

func formatKsh(x float64) string { return "Ksh " + formatNumber(x) }

func generateReceiptPDF(filePath string, r models.Receipt) error {
	const left, width = 12.0, 124.0
	rose := [3]int{166, 95, 97}
	ink := [3]int{45, 32, 33}

	pdf := gofpdf.New("P", "mm", "A5", "")
	pdf.SetMargins(left, 12, left)
	pdf.SetCellMargin(0)
	pdf.SetAutoPageBreak(true, 12)
	pdf.AddPage()
	tr := pdf.UnicodeTranslatorFromDescriptor("")

	setRose := func() { pdf.SetTextColor(rose[0], rose[1], rose[2]) }
	setInk := func() { pdf.SetTextColor(ink[0], ink[1], ink[2]) }
	pdf.SetDrawColor(rose[0], rose[1], rose[2])

	// Header
	setRose()
	pdf.SetFont("Arial", "B", 17)
	pdf.CellFormat(width, 9, tr(businessName), "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "I", 8.5)
	pdf.CellFormat(width, 5, tr(businessTagline), "", 1, "C", false, 0, "")
	pdf.Ln(2)
	pdf.SetLineWidth(0.4)
	pdf.Line(left, pdf.GetY(), left+width, pdf.GetY())
	pdf.Ln(3)

	// Address (left) and phones (right)
	y0 := pdf.GetY()
	setInk()
	pdf.SetFont("Arial", "", 9)
	for i, l := range businessAddress {
		pdf.SetXY(left, y0+float64(i)*4.5)
		pdf.CellFormat(70, 4.5, tr(l), "", 0, "L", false, 0, "")
	}
	for i, l := range businessPhones {
		pdf.SetXY(left+width-70, y0+float64(i)*4.5)
		pdf.CellFormat(70, 4.5, tr(l), "", 0, "R", false, 0, "")
	}
	rows := len(businessAddress)
	if len(businessPhones) > rows {
		rows = len(businessPhones)
	}
	pdf.SetY(y0 + float64(rows)*4.5 + 4)

	// Receipt number and date
	y := pdf.GetY()
	pdf.SetXY(left, y)
	setRose()
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(25, 6, "Receipt No:", "", 0, "L", false, 0, "")
	setInk()
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(40, 6, r.ReceiptNo, "", 0, "L", false, 0, "")

	dateStr := r.CreatedAt.Format("02 Jan 2006")
	pdf.SetFont("Arial", "B", 10)
	wLabel := pdf.GetStringWidth("Date: ")
	pdf.SetFont("Arial", "", 10)
	wVal := pdf.GetStringWidth(dateStr)
	pdf.SetXY(left+width-wLabel-wVal, y)
	setRose()
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(wLabel, 6, "Date: ", "", 0, "L", false, 0, "")
	setInk()
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(wVal, 6, dateStr, "", 0, "L", false, 0, "")
	pdf.SetY(y + 10)

	// Received from / Being payment for
	field := func(label, value string) {
		pdf.SetX(left)
		setRose()
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(width, 6, label, "", 1, "L", false, 0, "")
		setInk()
		pdf.SetFont("Arial", "", 11)
		if strings.TrimSpace(value) == "" {
			value = " "
		}
		pdf.SetLineWidth(0.2)
		pdf.MultiCell(width, 6, tr(value), "B", "L", false)
		pdf.Ln(3)
	}
	field("Received from:", r.CustomerName)
	field("Being payment for:", r.Description)

	// Optional itemised table (only when the receipt was made from the cake list)
	if len(r.Items) > 0 {
		w := []float64{50, 26, 14, 17, 17}
		heads := []string{"Cake", "Size", "Qty", "Price", "Subtotal"}
		setRose()
		pdf.SetFont("Arial", "B", 9)
		for i, h := range heads {
			align := "L"
			if i >= 2 {
				align = "R"
			}
			pdf.CellFormat(w[i], 6, h, "B", 0, align, false, 0, "")
		}
		pdf.Ln(6)
		setInk()
		pdf.SetFont("Arial", "", 9)
		for _, it := range r.Items {
			cells := []string{it.CakeCategory, it.CakeSize, fmt.Sprintf("%d", it.Quantity), formatNumber(it.Price), formatNumber(it.Subtotal)}
			for i, c := range cells {
				align := "L"
				if i >= 2 {
					align = "R"
				}
				pdf.CellFormat(w[i], 6, tr(c), "", 0, align, false, 0, "")
			}
			pdf.Ln(6)
		}
		pdf.Ln(3)
	}

	// Payment summary
	row := func(label, value string, bold bool) {
		pdf.SetX(left)
		setRose()
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(34, 6.5, label, "", 0, "L", false, 0, "")
		if bold {
			setRose()
			pdf.SetFont("Arial", "B", 11)
		} else {
			setInk()
			pdf.SetFont("Arial", "", 11)
		}
		pdf.CellFormat(width-34, 6.5, value, "", 1, "L", false, 0, "")
	}
	if r.PaymentStatus == StatusBalance {
		row("Total price:", formatKsh(r.TotalAmount), false)
		row("Amount paid:", formatKsh(r.AmountPaid), false)
		row("Balance due:", formatKsh(r.Balance), true)
	} else {
		row("Amount paid:", formatKsh(r.AmountPaid), false)
		row("Status:", "PAID IN FULL", true)
	}
	row("Paid by:", methodLabel(r.PaymentMethod), false)
	pdf.Ln(4)

	// Thanks and total box
	setInk()
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(width, 5.5, "With Thanks", "", 1, "R", false, 0, "")
	setRose()
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(width, 6, "For. Joska Cakes", "", 1, "R", false, 0, "")
	pdf.Ln(3)

	boxW, boxH := 56.0, 16.0
	pdf.SetLineWidth(0.7)
	pdf.Rect(left+width-boxW, pdf.GetY(), boxW, boxH, "D")
	pdf.SetFont("Arial", "B", 15)
	pdf.SetXY(left+width-boxW, pdf.GetY())
	pdf.CellFormat(boxW, boxH, formatKsh(r.AmountPaid), "", 1, "C", false, 0, "")

	return pdf.OutputFileAndClose(filePath)
}
