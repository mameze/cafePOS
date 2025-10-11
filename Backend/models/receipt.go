package models

import "time"

type Receipt struct {
	ID           uint          `json:"id" gorm:"primaryKey"`
	CustomerName string        `json:"customer_name"`
	TotalAmount  float64       `json:"total_amount"`
	PDFPath      string        `json:"pdf_path"`
	Items        []ReceiptItem `json:"items" gorm:"foreignKey:ReceiptID;constraint:OnDelete:CASCADE;"`
	CreatedAt    time.Time     `json:"created_at"`
}
