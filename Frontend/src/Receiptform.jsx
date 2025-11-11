import React, { useState } from "react";

export default function Receiptform() {
  const [receipt, setReceipt] = useState({
    number: "",
    date: "",
    receivedFrom: "",
    amountWords: "",
    paymentFor: "",
    amount: "",
    method: "Cash",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReceipt({ ...receipt, [name]: value });
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 border-2 border-pink-500 rounded-md text-pink-700 bg-white font-serif">
      <h1 className="text-center text-2xl font-bold text-pink-700">
        JOSKA CAKES & SNACKS
      </h1>
      <p className="text-center text-sm italic">
        For: Birthday Cakes, Wedding and all types of Occasions
      </p>

      <div className="flex justify-between text-sm mt-2">
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

      <div className="flex justify-between items-center mt-4">
        <p>
          <strong>No.</strong>{" "}
          <input
            type="text"
            name="number"
            value={receipt.number}
            onChange={handleChange}
            className="border-b border-pink-400 w-16 text-center focus:outline-none"
          />
        </p>
        <p>
          <strong>Date:</strong>{" "}
          <input
            type="date"
            name="date"
            value={receipt.date}
            onChange={handleChange}
            className="border-b border-pink-400 text-center focus:outline-none"
          />
        </p>
      </div>

      <p className="mt-4">
        <strong>Received from:</strong>{" "}
        <input
          type="text"
          name="receivedFrom"
          value={receipt.receivedFrom}
          onChange={handleChange}
          className="border-b border-pink-400 w-3/4 focus:outline-none"
        />
      </p>

      <p className="mt-4">
        <strong>The Sum of Shillings:</strong>{" "}
        <input
          type="text"
          name="amountWords"
          value={receipt.amountWords}
          onChange={handleChange}
          className="border-b border-pink-400 w-3/4 focus:outline-none"
        />
      </p>

      <p className="mt-4">
        <strong>Being Payment of:</strong>{" "}
        <input
          type="text"
          name="paymentFor"
          value={receipt.paymentFor}
          onChange={handleChange}
          className="border-b border-pink-400 w-3/4 focus:outline-none"
        />
      </p>

      <div className="flex justify-between mt-4">
        <div>
          <p>
            <strong>Kshs.</strong>{" "}
            <input
              type="number"
              name="amount"
              value={receipt.amount}
              onChange={handleChange}
              className="border-b border-pink-400 w-32 focus:outline-none"
            />
          </p>
          <p className="italic mt-1">Cash/Cheque</p>
        </div>
        <div className="text-right">
          <p className="italic">With Thanks</p>
          <p className="font-semibold">For Joska Cakes</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => window.print()}
          className="bg-pink-600 text-white px-4 py-1 rounded hover:bg-pink-700"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}
