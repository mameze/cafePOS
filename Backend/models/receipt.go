package models

import "time"

type Receipt struct {
	ID            uint          `json:"id" gorm:"primaryKey"`
	ReceiptNo     string        `json:"receipt_no" gorm:"size:20;index"`
	CustomerName  string        `json:"customer_name"`
	Description   string        `json:"description"`                   // "Being payment for"
	TotalAmount   float64       `json:"total_amount"`                  // full price of the order
	AmountPaid    float64       `json:"amount_paid"`                   // paid on this receipt
	Balance       float64       `json:"balance"`                       // still owed after this receipt
	PaymentStatus string        `json:"payment_status" gorm:"size:10"` // "paid" or "balance"
	PaymentMethod string        `json:"payment_method" gorm:"size:20"` // cash, cheque, mpesa
	PDFPath       string        `json:"pdf_path"`
	Items         []ReceiptItem `json:"items" gorm:"foreignKey:ReceiptID;constraint:OnDelete:CASCADE;"`
	CreatedAt     time.Time     `json:"created_at"`
}
