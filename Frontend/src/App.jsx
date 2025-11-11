import React, { useState, useEffect } from "react";
import ReceiptList from "../components/ReceiptList";

function App() {
  const [cakes, setCakes] = useState([]);

  useEffect(() => {
fetch("http://127.0.0.1:8080/api/cakes")
      .then((res) => res.json())
      .then((data) => setCakes(data))
      .catch((err) => console.error("Error fetching cakes:", err));
  }, []);

  return (
    <div>
      <ReceiptList cakes={cakes} />
    </div>
  );
}

export default App;
