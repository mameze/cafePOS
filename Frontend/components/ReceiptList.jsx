import React, { useState, useEffect } from "react";

function ReceiptList() {
  const [cakes, setCakes] = useState([]);
  const [formData, setFormData] = useState({
    receiptNo: "",
    date: "",
    receivedFrom: "",
    paymentFor: "",
    amount: "",
    paymentMode: "Cash",
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/cakes") 
      .then((res) => res.json())
      .then((data) => setCakes(data))
      .catch((err) => console.error("Error fetching cakes:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCakeChange = (e) => {
    const selectedCake = cakes.find((cake) => cake.id === parseInt(e.target.value));
    if (selectedCake) {
      setFormData({
        ...formData,
        paymentFor: selectedCake.name,
        amount: selectedCake.price,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:8080/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Receipt saved successfully!");
      setFormData({
        receiptNo: "",
        date: "",
        receivedFrom: "",
        paymentFor: "",
        amount: "",
        paymentMode: "Cash",
      });
    } else {
      alert(result.error || " Failed to save receipt");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("⚠️ Could not reach server");
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      <div
        id="receipt"
        className="bg-white p-8 rounded-2xl shadow-md w-[600px] border border-pink-400 print:border-none"
      >
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
          JOSKA CAKES & SNACKS
        </h1>
        <p className="text-center text-pink-600 mb-4">
          For: Birthday Cakes, Wedding and all types of Occasions.
        </p>

        <div className="flex justify-between mb-4 text-sm">
          <div>
            <p>Mwimuto Kabete</p>
            <p>P.O. Box 8143 - 00300</p>
            <p>Nairobi</p>
          </div>
          <div className="text-right">
            <p>Tel: 0714 740 930</p>
            <p>0758 059 963</p>
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <label className="font-semibold text-pink-600">Receipt No: </label>
            <input
              type="text"
              name="receiptNo"
              value={formData.receiptNo}
              onChange={handleChange}
              className="border-b border-pink-400 w-24 outline-none text-center"
            />
          </div>
          <div>
            <label className="font-semibold text-pink-600">Date: </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="border-b border-pink-400 outline-none"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="font-semibold text-pink-600">Received from: </label>
          <input
            type="text"
            name="receivedFrom"
            value={formData.receivedFrom}
            onChange={handleChange}
            className="border-b border-pink-400 w-full outline-none"
          />
        </div>

        <div className="mb-3">
          <label className="font-semibold text-pink-600">Being payment for:</label>
<input
  list="cakeOptions"
  name="paymentFor"
  value={formData.paymentFor}
  onChange={handleChange}
  className="border-b border-pink-400 w-full outline-none"
/>

<datalist id="cakeOptions">
  {cakes.map((cake) => (
    <option key={cake.id} value={`${cake.category} (${cake.size})`} />
  ))}
</datalist>

        </div>

        <div className="flex justify-between items-center mt-6">
          <div>
            <p>
              <span className="font-semibold text-pink-600">Kshs. </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="border-b border-pink-400 w-24 outline-none text-center"
              />
            </p>
            <p className="text-sm italic text-gray-600 mt-1">Cash/Cheque</p>
          </div>

          <div className="text-right">
            <p className="text-sm italic text-gray-600">With Thanks</p>
            <p className="font-semibold text-pink-600 mt-2">
              For. Joska Cakes
            </p>
          </div>
        </div>

        {}
        <div className="flex justify-end mt-6">
          <div className="border-2 border-pink-500 w-40 h-16 flex items-center justify-center text-xl font-bold text-pink-600">
            Ksh {formData.amount || 0}
          </div>
        </div>
      </div>

      {}
        <div className="mt-6 no-print flex gap-4">
      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-6 py-2 rounded-lg shadow hover:bg-green-600"
      >
        Save Receipt
      </button>

      <button
        onClick={handlePrint}
        className="bg-pink-500 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-600"
      >
        Print Receipt
      </button>
    </div>

      {}
      <style>
        {`
          @media print {
            .no-print {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
}

export default ReceiptList;
