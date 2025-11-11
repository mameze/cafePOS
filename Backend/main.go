package main

import (
	"POSWEB/config"
	"POSWEB/handlers"
	"POSWEB/models"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	RegisterRoutes(app)

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
	app.Get("/api/cakes", handlers.GetCakes)
	app.Post("/api/cakes", handlers.CreateCake)

	app.Get("/api/receipts", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "All receipts",
		})
	})
	app.Post("/api/receipts", handlers.CreateReceipt)
}
