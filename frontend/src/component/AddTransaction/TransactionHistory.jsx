import React, { useState, useEffect, useCallback } from "react";
import { fetchParties } from "../../api/partyApi";
import { getPartyStatement } from "../../api/ledgerApi";

import {
  BookOpen,
  Search,
  Printer,
  Layers,
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalDr: 0,
    totalCr: 0,
    balance: 0,
  });

  // ✅ LOAD PARTIES
  const loadParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchParties();
      if (res.data?.success) setParties(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // ✅ FETCH LEDGER
  const fetchLedger = useCallback(async () => {
    if (!selectedParty) return;

    try {
      setLoading(true);
      const res = await getPartyStatement(
        selectedParty,
        startDate,
        endDate
      );

      if (res.data?.success) {
        let raw = res.data.data || [];

        // ❌ REMOVE EMPTY ENTRIES (0 debit & credit)
        raw = raw.filter(
          (item) => item.debit !== 0 || item.credit !== 0
        );

        // ✅ SORT OLDEST FIRST
        const sorted = [...raw].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // ✅ TOTAL CALCULATION
        const totals = sorted.reduce(
          (acc, cur) => {
            acc.dr += cur.debit || 0;
            acc.cr += cur.credit || 0;
            return acc;
          },
          { dr: 0, cr: 0 }
        );

        // ✅ FINAL UI DATA (LATEST FIRST)
        setHistory([...sorted].reverse());

        const last = sorted[sorted.length - 1];

        setSummary({
          totalDr: totals.dr,
          totalCr: totals.cr,
          balance: last?.runningBalance || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedParty, startDate, endDate]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // ✅ PRINT
  const handlePrint = () => {
    const content = document.getElementById("printable-area").innerHTML;
    const partyName =
      parties.find((p) => p._id === selectedParty)?.name || "Party";

    const win = window.open("", "", "width=1000,height=800");

    win.document.write(`
      <html>
        <head>
          <title>${partyName} Statement</title>
          <style>
            body { font-family: Arial; padding:20px }
            table { width:100%; border-collapse: collapse }
            th, td { border:1px solid #ccc; padding:8px; font-size:12px }
            th { background:#eee }
            .right { text-align:right }
          </style>
        </head>
        <body>
          <h2>${partyName}</h2>
          <p>Total Dr: ₹${summary.totalDr}</p>
          <p>Total Cr: ₹${summary.totalCr}</p>
          <p>Balance: ₹${Math.abs(summary.balance)} ${
      summary.balance >= 0 ? "Cr" : "Dr"
    }</p>
          ${content}
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  if (loading && !parties.length) return <Loader />;

  // ✅ ROW COLOR LOGIC
  const getRowColor = (type) => {
    switch (type) {
      case "SALE":
        return "text-rose-600";
      case "PURCHASE":
        return "text-emerald-600";
      case "PAYMENT_IN":
        return "text-emerald-500";
      case "PAYMENT_OUT":
        return "text-rose-500";
      case "ADJUSTMENT":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedParty}
          onChange={(e) => setSelectedParty(e.target.value)}
          className="border p-2"
        >
          <option value="">Select Party</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={handlePrint}>
          <Printer />
        </button>
      </div>

      {/* SUMMARY */}
      {selectedParty && (
        <div className="flex gap-6 mb-4">
          <div>Total Dr: ₹{summary.totalDr}</div>
          <div>Total Cr: ₹{summary.totalCr}</div>
          <div>
            Balance: ₹{Math.abs(summary.balance)}{" "}
            {summary.balance >= 0 ? "Cr" : "Dr"}
          </div>
        </div>
      )}

      {/* TABLE */}
      {selectedParty ? (
        <table
          id="printable-area"
          className="w-full border text-sm"
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Dr</th>
              <th>Cr</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item) => (
              <tr key={item._id} className="border">
                <td>
                  {new Date(item.date).toLocaleDateString()}
                  <br />
                  <span className="text-xs">
                    {item.type}
                  </span>
                </td>

                <td>
                  <b>{item.description}</b>

                  {/* ✅ BILL */}
                  {item.billNo && item.billNo !== "-" && (
                    <div>Bill: {item.billNo}</div>
                  )}

                  {/* ✅ GOODS */}
                  {item.goods?.length > 0 && (
                    <div className="text-xs">
                      {item.goods.map((g, i) => (
                        <div key={i}>
                          {g.productName} ({g.quantity} {g.unit} × ₹
                          {g.rate})
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-gray-400 text-xs">
                    {item.paymentMode}
                  </div>
                </td>

                <td className={`text-right ${getRowColor(item.type)}`}>
                  {item.debit ? `₹${item.debit}` : "-"}
                </td>

                <td className={`text-right ${getRowColor(item.type)}`}>
                  {item.credit ? `₹${item.credit}` : "-"}
                </td>

                <td className="text-right font-bold">
                  ₹{Math.abs(item.runningBalance)}{" "}
                  {item.runningBalance >= 0 ? "Cr" : "Dr"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center mt-20 opacity-40">
          <Layers size={60} />
          <p>Select party</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;