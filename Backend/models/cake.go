package models

type Cake struct {
	ID       uint    `json:"id" gorm:"primaryKey"`
	Category string  `json:"category"`
	Size     string  `json:"size"`
	Weight   float64 `json:"weight"`
	Unit     string  `json:"unit"`
	Price    int     `json:"price"`
}
