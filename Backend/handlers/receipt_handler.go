package handlers

import (
	"POSWEB/config"
	"POSWEB/models"
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// What the receipt form sends. "items" is optional: leave it out for a normal
// hand-written receipt, or send it to price the receipt from the cakes table.
type ReceiptRequest struct {
	CustomerName  string  `json:"customer_name"`
	Description   string  `json:"description"`
	TotalAmount   float64 `json:"total_amount"`
	AmountPaid    float64 `json:"amount_paid"`
	PaymentStatus string  `json:"payment_status"` // "paid" or "balance"
	PaymentMethod string  `json:"payment_method"` // "cash", "cheque" or "mpesa"
	Items         []struct {
		CakeCategory string `json:"cake_category"`
		CakeSize     string `json:"cake_size"`
		Quantity     int    `json:"quantity"`
	} `json:"items"`
}

func receiptError(c *fiber.Ctx, status int, msg string) error {
	return c.Status(status).JSON(fiber.Map{"error": msg})
}

func CreateReceipt(c *fiber.Ctx) error {
	var req ReceiptRequest
	if err := c.BodyParser(&req); err != nil {
		return receiptError(c, fiber.StatusBadRequest, "Invalid request. Amounts must be numbers.")
	}

	name := strings.TrimSpace(req.CustomerName)
	if name == "" {
		return receiptError(c, fiber.StatusBadRequest, "Enter who the payment was received from")
	}
	description := strings.TrimSpace(req.Description)

	method, err := NormalizeMethod(req.PaymentMethod)
	if err != nil {
		return receiptError(c, fiber.StatusBadRequest, err.Error())
	}

	total := req.TotalAmount
	var receiptItems []models.ReceiptItem

	if len(req.Items) > 0 {
		total = 0
		var parts []string
		for _, item := range req.Items {
			if item.Quantity <= 0 {
				return receiptError(c, fiber.StatusBadRequest, "Quantity must be at least 1")
			}
			var cake models.Cake
			if err := config.DB.
				Where("category = ? AND size = ?", item.CakeCategory, item.CakeSize).
				First(&cake).Error; err != nil {
				return receiptError(c, fiber.StatusNotFound,
					"Cake not found: "+item.CakeCategory+" ("+item.CakeSize+")")
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
			parts = append(parts, fmt.Sprintf("%dx %s (%s)", item.Quantity, cake.Category, cake.Size))
		}
		if description == "" {
			description = strings.Join(parts, ", ")
		}
	} else if description == "" {
		return receiptError(c, fiber.StatusBadRequest, "Enter what the payment is for")
	}

	pay, err := ResolvePayment(total, req.AmountPaid, req.PaymentStatus)
	if err != nil {
		return receiptError(c, fiber.StatusBadRequest, err.Error())
	}

	receipt := models.Receipt{
		CustomerName:  name,
		Description:   description,
		TotalAmount:   pay.Total,
		AmountPaid:    pay.Paid,
		Balance:       pay.Balance,
		PaymentStatus: pay.Status,
		PaymentMethod: method,
		Items:         receiptItems,
	}

	// Save and number the receipt together, so a number is never left blank.
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&receipt).Error; err != nil {
			return err
		}
		receipt.ReceiptNo = FormatReceiptNo(receipt.ID)
		return tx.Model(&receipt).Update("receipt_no", receipt.ReceiptNo).Error
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to save receipt",
			"details": err.Error(),
		})
	}

	pdfDir := "receipts"
	if err := os.MkdirAll(pdfDir, 0755); err != nil {
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message": "Receipt saved, but the receipts folder could not be created",
			"warning": err.Error(),
			"receipt": receipt,
		})
	}

	filePath := fmt.Sprintf("%s/%s.pdf", pdfDir, receipt.ReceiptNo)
	if err := generateReceiptPDF(filePath, receipt); err != nil {
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message": "Receipt saved, but the PDF could not be created",
			"warning": err.Error(),
			"receipt": receipt,
		})
	}

	receipt.PDFPath = filePath
	config.DB.Model(&receipt).Update("pdf_path", filePath)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Receipt generated successfully",
		"receipt": receipt,
	})
}

// GetNextReceiptNo lets the form show "Next receipt: JC-0008" before saving.
func GetNextReceiptNo(c *fiber.Ctx) error {
	var maxID uint
	if err := config.DB.Model(&models.Receipt{}).Select("COALESCE(MAX(id), 0)").Scan(&maxID).Error; err != nil {
		return receiptError(c, fiber.StatusInternalServerError, "Could not work out the next receipt number")
	}
	return c.JSON(fiber.Map{"next_receipt_no": FormatReceiptNo(maxID + 1)})
}

func GetReceipts(c *fiber.Ctx) error {
	var receipts []models.Receipt
	if err := config.DB.Preload("Items").Order("id DESC").Find(&receipts).Error; err != nil {
		return receiptError(c, fiber.StatusInternalServerError, "Failed to fetch receipts")
	}
	return c.JSON(receipts)
}

func GetReceiptByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var receipt models.Receipt
	if err := config.DB.Preload("Items").First(&receipt, id).Error; err != nil {
		return receiptError(c, fiber.StatusNotFound, "Receipt not found")
	}
	return c.JSON(receipt)
}
