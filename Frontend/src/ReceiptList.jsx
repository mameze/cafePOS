import React, { useState, useEffect, useRef } from "react";

const ReceiptList = () => {
  const [cakes, setCakes] = useState([]);
  const [receipt, setReceipt] = useState({
    receipt_number: "",
    customer_name: "",
    being_paid_for: "",
    price: "",
    total: "",
  });
  const receiptRef = useRef();

  useEffect(() => {
    fetch("http://localhost:8080/api/cakes")
      .then((res) => res.json())
      .then((data) => setCakes(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/api/receipts")
      .then((res) => res.json())
      .then((data) => {
        const nextNumber = data.length > 0 ? data[data.length - 1].id + 1 : 1;
        setReceipt((prev) => ({ ...prev, receipt_number: nextNumber }));
      })
      .catch((err) => console.error(err));
  }, []);

 const handleCakeChange = (e) => {
  const selectedCake = cakes.find((cake) => cake.name === e.target.value);
  if (!selectedCake) return;

  setReceipt((prev) => ({
    ...prev,
    being_paid_for: selectedCake.name,
    price: selectedCake.price,
    total: selectedCake.price,
  }));
};


  const handleInputChange = (e) => {
    setReceipt({ ...receipt, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
  try {
    const requestBody = {
      customer_name: receipt.customer_name,
      items: [
        {
          cake_category: receipt.being_paid_for, // if you use cake name as category
          cake_size: "Default", // add a real size if you have one
          quantity: 1,
        },
      ],
    };

    const response = await fetch("http://localhost:8080/api/receipt/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(`❌ Error: ${result.error}`);
      return;
    }

    alert("✅ Receipt saved successfully!");
    console.log("Saved receipt:", result);
  } catch (err) {
    console.error("Error saving receipt:", err);
    alert("🚫 Could not connect to backend.");
  }
};


  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${receipt.receipt_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
            .receipt-box {
              width: 300px;
              border: 1px solid #000;
              padding: 15px;
              margin: auto;
            }
            h2 { text-align: center; }
            .total {
              text-align: right;
              margin-top: 20px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      {}
      <div ref={receiptRef} className="receipt-box" style={{ display: "inline-block", textAlign: "left" }}>
        <h2>🍰 Bakery Receipt</h2>
        <p><b>Receipt No:</b> {receipt.receipt_number}</p>
        <p><b>Customer Name:</b> {receipt.customer_name}</p>
        <p><b>Being Paid For:</b> {receipt.being_paid_for}</p>
        <p><b>Price (KSH):</b> {receipt.price}</p>

        <div className="total">
          Total: KSH {receipt.total}
        </div>
      </div>

      {}
      <div style={{ marginTop: "30px" }}>
        <h3>Generate Receipt</h3>
        <input
          type="text"
          name="customer_name"
          placeholder="Customer Name"
          value={receipt.customer_name}
          onChange={handleInputChange}
          style={{ margin: "10px", padding: "8px" }}
        />

        <select
          onChange={handleCakeChange}
          value={receipt.being_paid_for}
          style={{ margin: "10px", padding: "8px" }}
        >
          <option value="">Select Cake</option>
          {cakes.map((cake) => (
            <option key={cake.id} value={cake.name}>
              {cake.name} - KSH {cake.price}
            </option>
          ))}
        </select>

        <button
          onClick={handlePrint}
          style={{
            margin: "10px",
            padding: "10px 20px",
            backgroundColor: "black",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🖨️ Print Receipt
        </button>
        <button
  onClick={handleSave}
  style={{
    margin: "10px",
    padding: "10px 20px",
    backgroundColor: "green",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
  💾 Save Receipt
</button>

      </div>
    </div>
  );
};

export default ReceiptList;
