package handlers

import (
	"POSWEB/config"
	"POSWEB/models"
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
)

type ReceiptRequest struct {
	CustomerName string `json:"customer_name"`
	Items        []struct {
		CakeCategory string `json:"cake_category"`
		CakeSize     string `json:"cake_size"`
		Quantity     int    `json:"quantity"`
	} `json:"items"`
}

func GenerateReceipt(c *fiber.Ctx) error {
	var req ReceiptRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No items provided",
		})
	}

	var total float64
	var receiptItems []models.ReceiptItem

	for _, item := range req.Items {
		var cake models.Cake
		if err := config.DB.
			Where("category = ? AND size = ?", item.CakeCategory, item.CakeSize).
			First(&cake).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Cake not found: " + item.CakeCategory + " (" + item.CakeSize + ")",
			})
		}

		subtotal := float64(cake.Price) * float64(item.Quantity)
		total += subtotal

		receiptItems = append(receiptItems, models.ReceiptItem{
			CakeCategory: cake.Category,
			CakeSize:     cake.Size,
			Quantity:     item.Quantity,
			Price:        float64(cake.Price),
			Subtotal:     subtotal,
		})
	}

	receipt := models.Receipt{
		CustomerName: req.CustomerName,
		TotalAmount:  total,
		Items:        receiptItems,
	}

	if err := config.DB.Create(&receipt).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to save receipt",
			"details": err.Error(),
		})
	}

	pdfDir := "receipts"
	if _, err := os.Stat(pdfDir); os.IsNotExist(err) {
		os.Mkdir(pdfDir, 0755)
	}

	filePath := fmt.Sprintf("%s/receipt_%d.pdf", pdfDir, receipt.ID)
	err := generateReceiptPDF(filePath, receipt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to generate PDF",
			"details": err.Error(),
		})
	}

	receipt.PDFPath = filePath
	config.DB.Save(&receipt)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Receipt generated successfully",
		"receipt": receipt,
	})
}

func generateReceiptPDF(filePath string, receipt models.Receipt) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(190, 10, "Bakery Sales Receipt")
	pdf.Ln(12)

	pdf.SetFont("Arial", "", 12)
	pdf.Cell(190, 8, fmt.Sprintf("Customer: %s", receipt.CustomerName))
	pdf.Ln(8)
	pdf.Cell(190, 8, fmt.Sprintf("Date: %s", time.Now().Format("02 Jan 2006 15:04")))
	pdf.Ln(10)

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(60, 8, "Cake Category")
	pdf.Cell(40, 8, "Size")
	pdf.Cell(25, 8, "Qty")
	pdf.Cell(30, 8, "Price")
	pdf.Cell(30, 8, "Subtotal")
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 12)
	for _, item := range receipt.Items {
		pdf.Cell(60, 8, item.CakeCategory)
		pdf.Cell(40, 8, item.CakeSize)
		pdf.Cell(25, 8, fmt.Sprintf("%d", item.Quantity))
		pdf.Cell(30, 8, fmt.Sprintf("%.2f", item.Price))
		pdf.Cell(30, 8, fmt.Sprintf("%.2f", item.Subtotal))
		pdf.Ln(8)
	}

	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 13)
	pdf.Cell(155, 10, "Total:")
	pdf.Cell(30, 10, fmt.Sprintf("Ksh %.2f", receipt.TotalAmount))

	return pdf.OutputFileAndClose(filePath)
}
