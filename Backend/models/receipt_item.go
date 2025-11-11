package models

type ReceiptItem struct {
	ID           uint    `json:"id" gorm:"primaryKey"`
	ReceiptID    uint    `json:"receipt_id"`
	CakeCategory string  `json:"cake_category" gorm:"column:cake_category"`
	CakeSize     string  `json:"cake_size" gorm:"column:cake_size"`
	Quantity     int     `json:"quantity" gorm:"column:quantity"`
	Price        float64 `json:"price" gorm:"column:price"`
	Subtotal     float64 `json:"subtotal" gorm:"column:subtotal"`
}
