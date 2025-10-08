package handlers

import (
	"POSWEB/config"
	"POSWEB/models"
	"POSWEB/utils"

	"github.com/gofiber/fiber/v2"
)

type ReceiptRequest struct {
	CustomerName string `json:"customer_name"`
	CakeCategory string `json:"cake_category"`
	CakeSize     string `json:"cake_size"`
}

func GenerateReceipt(c *fiber.Ctx) error {
	var req ReceiptRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	var cake models.Cake
	result := config.DB.Where("category = ? AND size = ?", req.CakeCategory, req.CakeSize).First(&cake)
	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Cake not found"})
	}

	displaySize := req.CakeSize

	filePath, err := utils.GenerateReceiptPDF(req.CustomerName, cake.Category, displaySize, cake.Price)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate PDF"})
	}

	receipt := models.Receipt{
		CustomerName: req.CustomerName,
		CakeCategory: cake.Category,
		CakeSize:     displaySize,
		Price:        cake.Price,
		TotalAmount:  cake.Price,
		PDFPath:      filePath,
	}
	config.DB.Create(&receipt)

	return c.JSON(fiber.Map{
		"message":  "Receipt generated successfully",
		"pdf_path": filePath,
	})
}
