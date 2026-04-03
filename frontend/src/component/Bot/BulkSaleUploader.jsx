import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, X, Database } from "lucide-react";

const BulkSaleUploader = ({ jsonData, isAuthorized, API_URL, onClose, showMsg, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('idle'); // idle, processing, completed

  const startUpload = async () => {
    if (!isAuthorized) return showMsg("Unauthorized access!", "error");
    if (!jsonData || !Array.isArray(jsonData)) return showMsg("Invalid JSON data", "error");

    setLoading(true);
    setStatus('processing');
    const total = jsonData.length;
    setProgress({ current: 0, total });

    // ✅ Sequential Loop: Ek data success hone par hi dusra start hoga
    for (let i = 0; i < total; i++) {
      const entry = jsonData[i];
      try {
        // Aapke naye JSON structure (entry.goods) ke mutabiq mapping
        const goodsArray = (entry.goods || []).map(item => ({
          product: item.product,
          hsn: item.hsn,
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          taxableAmount: Number(item.taxableAmount || 0)
        }));

        // Pura payload taiyar karna
        const payload = {
          billNo: entry.billNo,
          date: entry.date,
          customerName: entry.customerName,
          gstin: entry.gstin,
          mobile: entry.mobile,
          address: entry.address,
          vehicleNo: entry.vehicleNo,
          deliveryNote: entry.deliveryNote,
          paymentMode: entry.paymentMode,
          buyerOrderNo: entry.buyerOrderNo,
          buyerOrderDate: entry.buyerOrderDate,
          dispatchDocNo: entry.dispatchDocNo,
          dispatchDate: entry.dispatchDate,
          dispatchedThrough: entry.dispatchedThrough,
          destination: entry.destination,
          lrRrNo: entry.lrRrNo,
          termsOfDelivery: entry.termsOfDelivery,
          goods: goodsArray, // Poora array ek sath jayega
          freight: Number(entry.freight || 0),
          taxableValue: Number(entry.taxableValue || 0),
          cgst: Number(entry.cgst || 0),
          sgst: Number(entry.sgst || 0),
          igst: Number(entry.igst || 0),
          totalAmount: Number(entry.totalAmount || 0),
          amountReceived: entry.amountReceived || 0,
          paymentDue: Number(entry.paymentDue || 0),
          remarks: entry.remarks || "",
          adminAction: true 
        };

        // ✅ Await yaha ensure karega ki agla loop tabhi chale jab ye record save ho jaye
        await axios.post(`${API_URL}/api/sales`, payload);
        
        // Progress update karein
        setProgress({ current: i + 1, total });
      } catch (err) {
        console.error(`Error saving Bill No ${entry.billNo}:`, err.response?.data || err.message);
        // Error hone par bhi loop chalta rahega, lekin console pe error dikhayega
      }
    }

    setLoading(false);
    setStatus('completed');
    showMsg("Bulk Data Processed Successfully!");
    if(fetchData) fetchData(); 
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <UploadCloud size={18} className="text-emerald-500" /> Bulk Sale Importer
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-8 text-center">
          {status === 'idle' && (
            <div className="animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Database className="text-emerald-500" size={32} />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Ready to Import</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                Found {jsonData?.length || 0} sale records.<br/>Click below to start sequential injection.
              </p>
              <button 
                onClick={startUpload}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 border border-emerald-400/20"
              >
                Confirm & Start Upload
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                 <svg className="w-full h-full rotate-[-90deg]">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * progress.current) / progress.total}
                      className="text-emerald-500 transition-all duration-500" 
                      strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">
                    {Math.round((progress.current / progress.total) * 100)}%
                 </div>
              </div>
              <p className="text-zinc-300 text-[10px] font-black uppercase tracking-widest animate-pulse">
                Processing {progress.current} of {progress.total}
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="animate-in zoom-in duration-300">
               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="text-white" size={32} />
               </div>
               <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Sync Complete</h3>
               <p className="text-zinc-500 text-[10px] mt-2 mb-6 uppercase tracking-widest">Database injection successful.</p>
               <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Close Window</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkSaleUploader;