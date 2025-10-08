package models

import "time"

type Receipt struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	CustomerName string    `json:"customer_name"`
	CakeCategory string    `json:"cake_category"`
	CakeSize     string    `json:"cake_size"`
	Price        int       `json:"price"`
	TotalAmount  int       `json:"total_amount"`
	PDFPath      string    `json:"pdf_path"`
	CreatedAt    time.Time `json:"created_at"`
}
