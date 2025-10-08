package main

import (
	"POSWEB/config"
	"POSWEB/handlers"
	"POSWEB/models"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.ConnectDB()
	config.DB.AutoMigrate(&models.Cake{}, &models.Receipt{})

	app := fiber.New()

	RegisterRoutes(app)

	app.Post("/api/receipt/generate", handlers.GenerateReceipt)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on http://127.0.0.1:%s 🚀", port)
	app.Listen(":" + port)
}

func RegisterRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server running 🚀")
	})

	app.Get("/api/receipts", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "All receipts",
		})
	})
}
