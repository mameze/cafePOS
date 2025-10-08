package handlers

import "github.com/gofiber/fiber/v2"

func GetCakes(c *fiber.Ctx) error {
	return c.SendString("List of cakes")
}
