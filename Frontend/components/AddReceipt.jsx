import React, { useEffect, useState } from "react";

function AddReceipt() {
  const [cakes, setCakes] = useState([]);
  const [formData, setFormData] = useState({
    receiptNo: "",
    date: new Date().toISOString().split("T")[0],
    receivedFrom: "",
    paymentFor: "",
    amount: "",
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
    const selectedCake = cakes.find((cake) => cake.category === e.target.value);
    setFormData({
      ...formData,
      paymentFor: e.target.value,
      amount: selectedCake ? selectedCake.price : "",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-md w-[600px] border border-pink-400">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
          JOSKA CAKES & SNACKS
        </h1>
        <p className="text-center text-pink-600 mb-4">
          For: Birthday Cakes, Wedding and all types of Occasions.
        </p>

        {/* Address Section */}
        <div className="flex justify-between mb-4 text-sm">
          <div>
            <p>Mwimuto Kabete</p>
            <p>P.O. Box 8143 - 00300</p>
            <p>Nairobi</p>
          </div>
          <div className="text-right">
            <p>Tel: 0714 740 930</p>
            <p>0715 209 728</p>
          </div>
        </div>

        {}
        <div className="flex justify-between mb-4">
          <div>
            <label className="font-semibold text-pink-600">No. </label>
            <input
              type="text"
              name="receiptNo"
              value={formData.receiptNo}
              onChange={handleChange}
              className="border-b border-pink-400 w-20 outline-none text-center"
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

        {}
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

        {}
        <div className="mb-3">
          <label className="font-semibold text-pink-600">Being payment for: </label>
          <select
            name="paymentFor"
            value={formData.paymentFor}
            onChange={handleCakeChange}
            className="border-b border-pink-400 w-full outline-none"
          >
            <option value="">Select Cake Type</option>
            {cakes.map((cake) => (
              <option key={cake.id} value={cake.category}>
                {cake.category} ({cake.size})
              </option>
            ))}
          </select>
        </div>

        {}
        <div className="flex justify-between items-center mt-6">
          <div>
            <p>
              <span className="font-semibold text-pink-600">Kshs. </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="border-b border-pink-400 w-24 outline-none"
              />
            </p>
            <p className="text-sm italic text-gray-600 mt-1">Cash/Cheque</p>
          </div>

          {}
          <div className="border border-pink-400 rounded-lg px-4 py-2 text-center">
            <p className="font-bold text-pink-600">KSH</p>
            <p className="text-lg font-semibold">{formData.amount}</p>
          </div>
        </div>

        {}
        <div className="text-right mt-6">
          <p className="text-sm italic text-gray-600">With Thanks</p>
          <p className="font-semibold text-pink-600 mt-2">For. Joska Cakes</p>
        </div>

        {}
        <div className="text-center mt-8 no-print">
          <button
            onClick={handlePrint}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-600"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddReceipt;
