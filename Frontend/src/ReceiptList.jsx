import React, { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:8080/api";

// Change BRAND to recolour the whole receipt (e.g. "#db2777" for the old hot pink).
const BRAND = "#a65f61";
const INK = "#2d2021";
const MUTED = "#7a6162";

const BUSINESS = {
  name: "JOSKA CAKES & SNACKS",
  tagline: "For: Birthday Cakes, Wedding and all types of Occasions.",
  address: ["Mwimuto Kabete", "P.O. Box 8143 - 00300", "Nairobi"],
  phones: ["Tel: 0758 059 963", "0729 750 659"],
};

const fmtDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const money = (n) =>
  "Ksh " + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const METHODS = { cash: "Cash", cheque: "Cheque", mpesa: "M-Pesa" };

const emptyForm = {
  customer: "",
  description: "",
  mode: "paid", // "paid" = fully paid, "balance" = part payment
  total: "",
  paid: "",
  method: "cash",
};

const printCss = `
@media print {
  body * { visibility: hidden !important; }
  .receipt-sheet, .receipt-sheet * { visibility: visible !important; }
  .receipt-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
  .no-print { display: none !important; }
}
`;

const underline = {
  border: 0,
  borderBottom: `1px solid ${BRAND}`,
  background: "transparent",
  font: "inherit",
  color: INK,
  width: "100%",
  padding: "4px 0",
  outline: "none",
  boxSizing: "border-box",
};

const ReceiptList = () => {
  const [cakes, setCakes] = useState([]);
  const [nextNo, setNextNo] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const printAfterSave = useRef(false);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const locked = !!saved;

  const loadNextNo = async () => {
    try {
      const res = await fetch(`${API_URL}/receipts/next-number`);
      const data = res.ok ? await res.json() : null;
      if (data && data.next_receipt_no) {
        setNextNo(data.next_receipt_no);
        return;
      }
      throw new Error("next-number route not available");
    } catch {
      // Fallback for a backend without the next-number route: highest saved id + 1.
      try {
        const res = await fetch(`${API_URL}/receipts`);
        const list = res.ok ? await res.json() : [];
        const maxId = Array.isArray(list)
          ? list.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0)
          : 0;
        setNextNo(`JC-${String(maxId + 1).padStart(4, "0")}`);
      } catch {
        setNextNo("");
      }
    }
  };

  useEffect(() => {
    // Optional: cakes list is only used to quick-fill the form.
    fetch(`${API_URL}/cakes`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCakes(Array.isArray(data) ? data : []))
      .catch(() => setCakes([]));
    loadNextNo();
  }, []);

  // Save & Print: print only after the saved receipt (with its number) is on screen.
  useEffect(() => {
    if (saved && printAfterSave.current) {
      printAfterSave.current = false;
      setTimeout(() => window.print(), 250);
    }
  }, [saved]);

  const total = Number(form.total) || 0;
  const paidNow = form.mode === "paid" ? total : Number(form.paid) || 0;
  const balance = form.mode === "balance" ? Math.max(0, total - paidNow) : 0;

  const shown = saved
    ? {
        total: saved.total_amount,
        paid: saved.amount_paid,
        balance: saved.balance,
        status: saved.payment_status,
        method: saved.payment_method,
      }
    : { total, paid: paidNow, balance, status: form.mode, method: form.method };

  const handleCake = (e) => {
    const cake = cakes.find((c) => String(c.id) === e.target.value);
    if (!cake) return;
    setForm((prev) => ({
      ...prev,
      description: `${cake.category} (${cake.size})`,
      total: String(cake.price),
    }));
  };

  const validate = () => {
    const issues = [];
    if (!form.customer.trim()) issues.push("Enter who the payment was received from.");
    if (!form.description.trim()) issues.push("Enter what the payment is for.");
    if (!(total > 0))
      issues.push(
        form.mode === "paid" ? "Enter the amount received." : "Enter the total price of the order."
      );
    if (form.mode === "balance") {
      if (!(paidNow > 0)) issues.push("Enter the amount paid now.");
      else if (total > 0 && paidNow >= total)
        issues.push("Amount paid must be less than the total. Choose Fully paid instead.");
    }
    return issues;
  };

  const save = async (andPrint = false) => {
    if (saving || saved) return;
    const issues = validate();
    if (issues.length) {
      setError(issues.join(" "));
      window.alert(
        "Receipt NOT saved. Please fix the following:\n\n" +
          issues.map((i) => "\u2022 " + i).join("\n")
      );
      return;
    }
    setError("");
    setWarning("");
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.customer.trim(),
          description: form.description.trim(),
          total_amount: total,
          amount_paid: paidNow,
          payment_status: form.mode,
          payment_method: form.method,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        /* no JSON body */
      }

      if (!res.ok) throw new Error(data.error || `Could not save (error ${res.status}).`);
      if (!data.receipt) throw new Error("The server did not return the saved receipt.");

      if (data.warning) setWarning(data.warning);
      printAfterSave.current = andPrint;
      setSaved(data.receipt);
      // Alert after the saved receipt is on screen.
      setTimeout(
        () =>
          window.alert(
            `Receipt ${data.receipt.receipt_no} saved successfully!` +
              (data.warning ? `\n\nNote: ${data.warning}` : "")
          ),
        50
      );
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? "Could not reach the server. Is the backend running on port 8080?"
          : err.message;
      setError(msg);
      window.alert("Receipt NOT saved.\n\n" + msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!saved) {
      setError("Save the receipt first so it gets its number.");
      window.alert("Save the receipt first so it gets its number.");
      return;
    }
    window.print();
  };

  const newReceipt = () => {
    setForm(emptyForm);
    setSaved(null);
    setError("");
    setWarning("");
    loadNextNo();
  };

  const row = { display: "flex", gap: "8px", alignItems: "baseline", margin: "6px 0" };
  const label = { color: BRAND, fontWeight: 700, minWidth: "130px" };
  const btn = (bg, color = "#fff") => ({
    margin: "6px",
    padding: "10px 20px",
    background: bg,
    color,
    border: `1.5px solid ${bg}`,
    borderRadius: "8px",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 600,
  });

  return (
    <div style={{ padding: "24px 12px", fontFamily: "Georgia, serif", color: INK }}>
      <style>{printCss}</style>

      <div
        className="receipt-sheet"
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "28px 32px",
          background: "#fff",
          border: `1.5px solid ${BRAND}`,
          borderRadius: "14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ textAlign: "center", color: BRAND, margin: 0, fontSize: "26px" }}>
          {BUSINESS.name}
        </h1>
        <p style={{ textAlign: "center", color: BRAND, fontStyle: "italic", margin: "4px 0 14px" }}>
          {BUSINESS.tagline}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
          <div>{BUSINESS.address.map((l) => <div key={l}>{l}</div>)}</div>
          <div style={{ textAlign: "right" }}>{BUSINESS.phones.map((l) => <div key={l}>{l}</div>)}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", margin: "18px 0 8px" }}>
          <div>
            <span style={{ color: BRAND, fontWeight: 700 }}>Receipt No: </span>
            <strong data-testid="receipt-no">
              {saved ? saved.receipt_no : nextNo ? `${nextNo} (next)` : "Assigned when saved"}
            </strong>
          </div>
          <div>
            <span style={{ color: BRAND, fontWeight: 700 }}>Date: </span>
            {saved ? fmtDate(new Date(saved.created_at)) : fmtDate(new Date())}
          </div>
        </div>

        <div style={{ margin: "14px 0" }}>
          <div style={{ color: BRAND, fontWeight: 700 }}>Received from:</div>
          <input
            aria-label="Received from"
            style={underline}
            value={form.customer}
            readOnly={locked}
            onChange={(e) => set("customer", e.target.value)}
          />
        </div>

        <div style={{ margin: "14px 0" }}>
          <div style={{ color: BRAND, fontWeight: 700 }}>Being payment for:</div>
          <input
            aria-label="Being payment for"
            style={underline}
            value={form.description}
            readOnly={locked}
            onChange={(e) => set("description", e.target.value)}
          />
          {cakes.length > 0 && !locked && (
            <select
              className="no-print"
              aria-label="Quick fill from cake list"
              defaultValue=""
              onChange={handleCake}
              style={{ marginTop: "8px", padding: "6px", font: "inherit", maxWidth: "100%" }}
            >
              <option value="">Quick fill from cake list (optional)</option>
              {cakes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.category} - {c.size} - KES {c.price}
                </option>
              ))}
            </select>
          )}
        </div>

        <fieldset
          className="no-print"
          disabled={locked}
          style={{ border: `1px dashed ${BRAND}`, borderRadius: "8px", margin: "16px 0", padding: "10px 14px" }}
        >
          <legend style={{ color: BRAND, fontWeight: 700, padding: "0 6px" }}>Payment</legend>
          <label style={{ marginRight: "18px" }}>
            <input
              type="radio"
              name="mode"
              checked={form.mode === "paid"}
              onChange={() => set("mode", "paid")}
            />{" "}
            Fully paid
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={form.mode === "balance"}
              onChange={() => set("mode", "balance")}
            />{" "}
            Part payment (balance)
          </label>

          <div style={row}>
            <span style={{ ...label, fontWeight: 600 }}>
              {form.mode === "paid" ? "Amount received (Kshs.)" : "Total price (Kshs.)"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label="Total"
              style={{ ...underline, width: "140px" }}
              value={form.total}
              onChange={(e) => set("total", e.target.value)}
            />
          </div>

          {form.mode === "balance" && (
            <div style={row}>
              <span style={{ ...label, fontWeight: 600 }}>Amount paid now (Kshs.)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                aria-label="Paid now"
                style={{ ...underline, width: "140px" }}
                value={form.paid}
                onChange={(e) => set("paid", e.target.value)}
              />
            </div>
          )}

          <div style={row}>
            <span style={{ ...label, fontWeight: 600 }}>Paid by</span>
            <select
              aria-label="Payment method"
              value={form.method}
              onChange={(e) => set("method", e.target.value)}
              style={{ padding: "4px", font: "inherit" }}
            >
              {Object.entries(METHODS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <div style={{ margin: "10px 0" }}>
          {shown.status === "balance" ? (
            <>
              <div style={row}><span style={label}>Total price:</span>{money(shown.total)}</div>
              <div style={row}><span style={label}>Amount paid:</span>{money(shown.paid)}</div>
              <div style={row}>
                <span style={label}>Balance due:</span>
                <strong style={{ color: BRAND }} data-testid="balance">{money(shown.balance)}</strong>
              </div>
            </>
          ) : (
            <>
              <div style={row}><span style={label}>Amount paid:</span>{money(shown.paid)}</div>
              <div style={row}>
                <span style={label}>Status:</span>
                <strong style={{ color: BRAND }}>PAID IN FULL</strong>
              </div>
            </>
          )}
          <div style={row}><span style={label}>Paid by:</span>{METHODS[shown.method] || "Cash"}</div>
        </div>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <div style={{ fontStyle: "italic" }}>With Thanks</div>
          <div style={{ color: BRAND, fontWeight: 700 }}>For. Joska Cakes</div>
          <div
            style={{
              display: "inline-block",
              marginTop: "12px",
              minWidth: "180px",
              padding: "14px 18px",
              border: `2px solid ${BRAND}`,
              textAlign: "center",
              color: BRAND,
              fontWeight: 700,
              fontSize: "20px",
            }}
          >
            {money(shown.paid)}
          </div>
        </div>
      </div>

      <div className="no-print" style={{ textAlign: "center", marginTop: "18px" }}>
        {error && (
          <p role="alert" style={{ color: "#b00020", margin: "6px 0" }}>{error}</p>
        )}
        {warning && <p style={{ color: "#8a5a00", margin: "6px 0" }}>{warning}</p>}
        {saved && (
          <p style={{ color: "#1b6e2d", margin: "6px 0" }}>
            Saved as {saved.receipt_no}. A PDF copy is in the backend's receipts folder.
          </p>
        )}

        {!saved ? (
          <>
            <button style={btn(BRAND)} onClick={() => save(false)} disabled={saving}>
              {saving ? "Saving..." : "Save Receipt"}
            </button>
            <button style={btn("#222")} onClick={() => save(true)} disabled={saving}>
              Save &amp; Print
            </button>
          </>
        ) : (
          <>
            <button style={btn("#222")} onClick={handlePrint}>Print Receipt</button>
            <button style={btn("#fff", BRAND)} onClick={newReceipt}>New Receipt</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceiptList;