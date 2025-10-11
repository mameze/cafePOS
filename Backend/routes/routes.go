package routes

import (
	"POSWEB/handlers"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server running 🚀")
	})

	app.Get("/api/cakes", handlers.GetCakes)
	app.Post("/api/cakes", handlers.CreateCake)
	app.Put("/api/cakes/:id", handlers.UpdateCake)
	app.Delete("/api/cakes/:id", handlers.DeleteCake)

	app.Get("/api/receipts", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "All receipts"})
	})
}
