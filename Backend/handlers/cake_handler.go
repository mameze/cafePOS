package handlers

import (
	"POSWEB/config"
	"POSWEB/models"

	"github.com/gofiber/fiber/v2"
)

func GetCakes(c *fiber.Ctx) error {
	var cakes []models.Cake
	result := config.DB.Find(&cakes)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	return c.JSON(cakes)
}

func CreateCake(c *fiber.Ctx) error {
	cake := new(models.Cake)
	if err := c.BodyParser(cake); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := config.DB.Create(&cake).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(cake)
}

func UpdateCake(c *fiber.Ctx) error {
	id := c.Params("id")
	var cake models.Cake

	if err := config.DB.First(&cake, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Cake not found"})
	}

	if err := c.BodyParser(&cake); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	config.DB.Save(&cake)
	return c.JSON(cake)
}

func DeleteCake(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := config.DB.Delete(&models.Cake{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Cake deleted"})
}
