package utils

import (
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
)

func GenerateReceiptPDF(customer, category, size string, price int) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)

	pdf.Cell(40, 10, "SweetBite Bakery")
	pdf.Ln(12)

	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 10, fmt.Sprintf("Customer: %s", customer))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("Date: %s", time.Now().Format("02-Jan-2006")))
	pdf.Ln(10)
	pdf.Cell(40, 10, fmt.Sprintf("Cake: %s", category))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("Size: %s", size))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("Price: KES %d", price))
	pdf.Ln(12)
	pdf.Cell(40, 10, "Thank you for your purchase!")

	fileName := fmt.Sprintf("pdfs/receipt_%d.pdf", time.Now().Unix())
	err := pdf.OutputFileAndClose(fileName)
	if err != nil {
		return "", err
	}
	return fileName, nil
}
