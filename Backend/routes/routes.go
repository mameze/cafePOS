package routes

import (
	"github.com/gofiber/fiber/v2"
)

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
