import React from 'react'; 
import SinghImage from '../rkSig.png';

const ReportTable = ({ category, filteredData }) => {
  
  if (!filteredData || filteredData.length === 0) return null;

  // तारीख को DD/MM/YYYY में बदलने का फंक्शन
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // HSN Code निकालने का लॉजिक
  const getHSNCode = (productName) => {
    const name = productName?.toUpperCase() || "";
    if (name.includes("CATTLE FEED")) return "23099010";
    if (name.includes("CORN") || name.includes("MAIZE")) return "10059000";
    if (name.includes("RICE")) return "10063010";
    return "1008";
  };

  const getPaidVal = (item) => category === "sales" ? Number(item.amountReceived || 0) : Number(item.paidAmount || 0);
  const getDueVal = (item) => category === "sales" ? Number(item.paymentDue || 0) : Number(item.balanceAmount || 0);
  const getFreightVal = (item) => category === "sales" ? Number(item.freight || 0) : Number(item.travelingCost || 0);

  const calculateTotalQty = () => {
    if (category === "stock") return filteredData.reduce((acc, item) => acc + (Number(item.totalQuantity) || 0), 0);
    return filteredData.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  };

  const calculateGrandTotalVal = () => filteredData.reduce((acc, item) => acc + (Number(item.totalAmount) || 0), 0);
  const calculatePaidTotal = () => filteredData.reduce((acc, item) => acc + getPaidVal(item), 0);
  const calculateDueTotal = () => filteredData.reduce((acc, item) => acc + getDueVal(item), 0);
  const calculateFreightTotal = () => filteredData.reduce((acc, item) => acc + getFreightVal(item), 0);

  return (
    <div className="max-w-7xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-zinc-100 print:shadow-none print:border-none print:p-2 font-sans text-left print:text-black">
      
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-4 border-zinc-900 pb-6 mb-8 print:border-zinc-900">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase print:text-black">DHARA SHAKTI AGRO PRODUCTS</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] print:text-zinc-600">Premium Quality Seeds & Agro Commodities</p>
          <p className="text-[9px] text-zinc-400 mt-1 italic print:text-zinc-500 font-bold">Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs font-black bg-zinc-900 text-white px-3 py-1 rounded-md uppercase tracking-tighter print:bg-black print:text-white">GSTIN: 10DZTPM1457E1ZE</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest print:text-black text-right">Report: {category?.toUpperCase()} Ledger</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase print:text-black text-right">Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse print:table border border-zinc-200">
          <thead>
            <tr className="bg-zinc-100 border-y-2 border-zinc-900 text-zinc-900 text-[10px] font-black uppercase tracking-widest print:bg-zinc-100">
              {category === "stock" ? (
                <>
                  <th className="px-3 py-3 border-r border-zinc-200">Product Identity</th>
                  <th className="px-3 py-3 border-r border-zinc-200">HSN Code</th>
                  <th className="px-3 py-3 border-r border-zinc-200">Properties</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200">Weight (KG)</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200 font-bold text-emerald-700">Est. Bags (W/50)</th>
                  <th className="px-3 py-3">Remarks</th>
                </>
              ) : (
                <>
                  <th className="px-2 py-3 border-r border-zinc-200 italic">Date</th>
                  <th className="px-2 py-3 border-r border-zinc-200 italic">Bill #</th>
                  <th className="px-2 py-3 border-r border-zinc-200">Party Name</th>
                  <th className="px-2 py-3 border-r border-zinc-200">Product</th>
                  <th className="px-2 py-3 border-r border-zinc-200 italic">HSN</th>
                  <th className="px-2 py-3 border-r border-zinc-200">Rate</th>
                  <th className="px-2 py-3 border-r border-zinc-200">Qty</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200 italic">Freight</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200">Total</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200 italic">Paid</th>
                  <th className="px-3 py-3 text-right border-r border-zinc-200">Due</th>
                  <th className="px-2 py-3 italic">Remarks</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="text-[10px] font-medium text-zinc-800 uppercase italic print:text-black">
            {filteredData.map((item, idx) => (
              <React.Fragment key={item._id || idx}>
                {category === "sales" && item.goods && item.goods.map((g, gIdx) => (
                  <tr key={`${item._id}-${gIdx}`} className="border-b border-zinc-100 print:border-zinc-300">
                    <td className="px-2 py-2 whitespace-nowrap border-r border-zinc-50">{gIdx === 0 ? formatDate(item.date) : ""}</td>
                    <td className="px-2 py-2 font-bold border-r border-zinc-50">{gIdx === 0 ? item.billNo : ""}</td>
                    <td className="px-2 py-2 uppercase font-black text-zinc-600 border-r border-zinc-50">{gIdx === 0 ? item.customerName : ""}</td>
                    <td className="px-2 py-2 italic text-emerald-700 border-r border-zinc-50">{g.product}</td>
                    <td className="px-2 py-2 border-r border-zinc-50 opacity-60 font-bold">{getHSNCode(g.product)}</td>
                    <td className="px-2 py-2 border-r border-zinc-50">₹{Number(g.rate || 0).toLocaleString()}</td>
                    <td className="px-2 py-2 font-bold border-r border-zinc-50">{g.quantity}</td>
                    <td className="px-3 py-2 text-right border-r border-zinc-50">{gIdx === 0 ? `₹${Number(item.freight || 0).toLocaleString()}` : ""}</td>
                    <td className="px-3 py-2 text-right font-black border-r border-zinc-50">₹{gIdx === 0 ? Number(item.totalAmount || 0).toLocaleString() : ""}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 border-r border-zinc-50">₹{gIdx === 0 ? Number(item.amountReceived || 0).toLocaleString() : ""}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-bold border-r border-zinc-50">₹{gIdx === 0 ? Number(item.paymentDue || 0).toLocaleString() : ""}</td>
                    <td className="px-2 py-2 text-[8px] opacity-60 italic lowercase border-r border-zinc-50">{gIdx === 0 ? (item.remarks || "-") : ""}</td>
                  </tr>
                ))}

                {category === "purchases" && (
                  <tr className="border-b border-zinc-100 print:border-zinc-300">
                    <td className="px-2 py-2 border-r border-zinc-50">{formatDate(item.date)}</td>
                    <td className="px-2 py-2 font-bold border-r border-zinc-50">{item.billNo || "-"}</td>
                    <td className="px-2 py-2 uppercase font-black text-zinc-600 border-r border-zinc-50">{item.supplierName}</td>
                    <td className="px-2 py-2 italic text-emerald-700 border-r border-zinc-50">{item.productName}</td>
                    <td className="px-2 py-2 border-r border-zinc-50 opacity-60 font-bold">{getHSNCode(item.productName)}</td>
                    <td className="px-2 py-2 border-r border-zinc-50">₹{Number(item.rate || 0).toLocaleString()}</td>
                    <td className="px-2 py-2 font-bold border-r border-zinc-50">{item.quantity}</td>
                    <td className="px-3 py-2 text-right border-r border-zinc-50">₹{Number(item.travelingCost || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-black border-r border-zinc-50">₹{Number(item.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 border-r border-zinc-50">₹{Number(item.paidAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-bold border-r border-zinc-50">₹{Number(item.balanceAmount || 0).toLocaleString()}</td>
                    <td className="px-2 py-2 text-[8px] opacity-60 italic lowercase border-r border-zinc-50">{item.remarks || "-"}</td>
                  </tr>
                )}

                {category === "stock" && (
                  <tr className="border-b border-zinc-100 print:border-zinc-300 hover:bg-zinc-50">
                    <td className="px-3 py-3 font-black text-zinc-700 uppercase italic tracking-tighter border-r border-zinc-100">{item.productName}</td>
                    <td className="px-3 py-3 border-r border-zinc-100 font-bold opacity-60">{getHSNCode(item.productName)}</td>
                    <td className="px-3 py-3 border-r border-zinc-100">
                      {item.bagType ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-50 rounded border print:bg-transparent">
                          {item.bagType} / {item.bagCondition}
                        </span>
                      ) : "BULK GRAIN"}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-zinc-900 border-r border-zinc-100">{Number(item.totalQuantity).toLocaleString()} KG</td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-700 border-r border-zinc-100">
                      {(Number(item.totalQuantity || 0) / 50).toFixed(2)} BAGS
                    </td>
                    <td className="px-3 py-3 text-[9px] italic opacity-60 lowercase border-r border-zinc-100">{item.remarks || "-"}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-zinc-900 bg-zinc-50 print:bg-zinc-100 font-black text-zinc-900 text-[10px]">
            {category === "stock" ? (
              <tr>
                <td colSpan="3" className="px-3 py-4 text-right uppercase border-r border-zinc-200 italic">Grand Total Inventory Weight:</td>
                <td className="px-3 py-4 text-right underline decoration-double border-r border-zinc-200">
                  {calculateTotalQty().toLocaleString()} KG
                </td>
                <td className="px-3 py-4 text-right text-emerald-700 font-black border-r border-zinc-200">
                  {(calculateTotalQty() / 50).toFixed(2)} TOTAL BAGS
                </td>
                <td></td>
              </tr>
            ) : (
              <tr>
                <td colSpan="6" className="px-2 py-4 text-right uppercase tracking-widest border-r border-zinc-200 italic">Grand Total Ledger Summary:</td>
                <td className="px-2 py-4 border-r border-zinc-200 font-black">{calculateTotalQty().toLocaleString()}</td>
                <td className="px-3 py-4 text-right border-r border-zinc-200">₹{calculateFreightTotal().toLocaleString()}</td>
                <td className="px-3 py-4 text-right underline font-black border-r border-zinc-200">₹{calculateGrandTotalVal().toLocaleString()}</td>
                <td className="px-3 py-4 text-right text-emerald-700 border-r border-zinc-200">₹{calculatePaidTotal().toLocaleString()}</td>
                <td className="px-3 py-4 text-right text-red-600 border-r border-zinc-200">₹{calculateDueTotal().toLocaleString()}</td>
                <td></td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-12 pt-10 border-t border-zinc-100 print:border-zinc-300">
        <div className="text-center w-48 space-y-4">
          <div className="h-px bg-zinc-400 w-full mb-1 print:bg-zinc-600"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 print:text-black">Prepared By</p>
        </div>
        <div className="text-center w-64 space-y-2 relative">
          <img 
            src={SinghImage} 
            alt="Signature" 
            className="w-24 h-auto mx-auto -mb-6 opacity-95 relative z-10 print:w-20 print:h-8" 
            style={{ maxWidth: '80px', maxHeight: '35px', objectFit: 'contain' }}
          />
          <div className="h-px bg-zinc-900 w-full print:bg-black"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 print:text-black">Authorized Signatory</p>
          <span className="text-[8px] font-bold text-zinc-300 block italic print:text-zinc-500">(For Dhara Shakti Agro Products)</span>
        </div>
      </div>
    </div>
  );
};

export default ReportTable;