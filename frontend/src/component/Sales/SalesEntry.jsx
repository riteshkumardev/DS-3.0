import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Trash2, Save, RotateCcw, 
  Truck, User, Receipt, CreditCard, MapPin, Phone, Hash, Calendar
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesEntry = ({ user }) => {
  const role = user.role;
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    gstin: "",
    mobile: "",
    address: "",
    items: [{ productName: "", quantity: "", rate: "" }],
    billNo: "", // Ye auto-fill hoga fetch ke baad
    vehicleNo: "",
    travelingCost: "",
    cashDiscount: "",
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    deliveryNote: "",
    deliveryNoteDate: "", 
    paymentMode: "BY BANK",
    buyerOrderNo: "",
    buyerOrderDate: "",
    dispatchDocNo: "",
    dispatchDate: "",
    dispatchedThrough: "", 
    destination: "",
    lrRrNo: "",
    termsOfDelivery: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- Naya Bill Number Generation Helper ---
  const generateBillID = (lastBillNo) => {
    const now = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    // Financial Year Logic
    const finYear = now.getMonth() >= 3 
      ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` 
      : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

    let nextSerial = 1;

    // Agar database mein pichla bill hai toh usse increment karo
    if (lastBillNo && lastBillNo.includes('/')) {
      const parts = lastBillNo.split('/');
      const lastMonth = parts[2];
      const lastSerial = parseInt(parts[3]);

      // Agar mahina same hai toh increment, warna reset to 1
      if (currentMonth === lastMonth) {
        nextSerial = lastSerial + 1;
      }
    }

    return `DS/${finYear}/${currentMonth}/${String(nextSerial).padStart(3, '0')}`;
  };

  // --- Data Fetching Logic ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const supRes = await axios.get(`${API_URL}/api/suppliers/list`); 
      if (supRes.data && supRes.data.success) setSuppliers(supRes.data.data);

      const salesRes = await axios.get(`${API_URL}/api/sales`);
      if (salesRes.data.success && salesRes.data.data.length > 0) {
        const salesData = salesRes.data.data;
        
        // 1. SI Number Logic (Purana)
        const lastSi = Math.max(...salesData.map((s) => s.si || 0));
        setNextSi(lastSi + 1);

        // 2. Bill No Logic (Naya)
        const lastBillNo = salesData[salesData.length - 1].billNo;
        const newBillNo = generateBillID(lastBillNo);
        setFormData(prev => ({ ...prev, billNo: newBillNo }));
      } else {
        // Agar koi sales nahi hai toh pehla bill generate karo
        setFormData(prev => ({ ...prev, billNo: generateBillID("") }));
      }
    } catch (err) { 
      showMsg("Database connection error", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  // --- Purane handlers bina kisi badlav ke ---
  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    if (selectedName === "Local customer") {
      const customName = window.prompt("Please enter Local Customer Name for the Bill:");
      if (customName && customName.trim() !== "") {
        setFormData((prev) => ({
          ...prev,
          customerName: customName.trim().toUpperCase(),
          gstin: "URD (Local)",
          mobile: "",
          address: "Local Market",
        }));
      } else {
        setFormData((prev) => ({ ...prev, customerName: "" }));
      }
      return; 
    }
    const customer = suppliers.find((s) => s.name === selectedName);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name,
        gstin: customer.gstin || "",
        mobile: customer.phone || "",
        address: customer.address || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerName: selectedName, gstin: "", mobile: "", address: "" }));
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index][name] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: "", rate: "" }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  // --- Calculation Logic (Wahi Purana) ---
  useEffect(() => {
    let subTotal = 0;
    formData.items.forEach(item => {
      subTotal += toSafeNumber(item.quantity) * toSafeNumber(item.rate);
    });

    const freight = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const received = toSafeNumber(formData.amountReceived);
    
    const discountAmt = (subTotal * cdPercent) / 100;
    const total = subTotal - freight - discountAmt;
    const due = total - received;

    setFormData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
  }, [formData.items, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Submit Logic (Updated for next bill sequence) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { 
      showMsg("Unauthorized access!", "error"); 
      return; 
    }

    setLoading(true);
    try {
      const freightValue = toSafeNumber(formData.travelingCost);
      
      const goods = formData.items.map(item => {
        const qty = toSafeNumber(item.quantity);
        const rate = toSafeNumber(item.rate);
        const taxable = qty * rate;
        
        return {
          product: item.productName,
          quantity: qty,
          rate: rate,
          taxableAmount: taxable,
          hsn: item.productName.includes("Corn Grit") ? "11031300" :
               item.productName.includes("Rice Grit") ? "10064000" :
               item.productName.includes("Cattle Feed") ? "23099010" :
               "11022000"
        };
      });

      const totalTaxable = goods.reduce((sum, g) => sum + g.taxableAmount, 0);

      const payload = {
        ...formData,
        travelingCost: freightValue * -1, 
        si: nextSi,
        taxableValue: totalTaxable,
        totalAmount: formData.totalPrice,
        paymentDue: formData.paymentDue,
        goods: goods
      };

      const res = await axios.post(`${API_URL}/api/sales`, payload);
      if (res.data.success) {
        showMsg("Sale saved successfully!", "success");
        
        // Save ke baad next sequential bill number set karein
        const nextBill = generateBillID(formData.billNo);
        setFormData({ ...initialState, billNo: nextBill });
        setNextSi(prev => prev + 1);
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Server Error", "error");
    } finally {
      setLoading(false);
    }
  };

//   return (
//     <div>
//       {loading && <Loader />}
//       {/* Yahan aapka baki ka JSX/Form UI aayega */}
//       <CustomSnackbar snackbar={snackbar} setSnackbar={setSnackbar} />
//     </div>
//   );
// };

// export default SalesEntry;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 font-sans">
      {loading && <Loader />}
      
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header Bar */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 flex justify-between items-center">
          <h2 className="text-lg font-black text-emerald-600 flex items-center gap-2 tracking-tight">
            <Receipt size={20}/> Professional Sales & Multi-Item Entry
          </h2>
          <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-500">SI: #{nextSi}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* Main Form Grid - 4 Columns as per your request */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Invoice Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Invoice No</label>
              <input name="billNo" value={formData.billNo} onChange={handleChange} required className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Customer Name</label>
              <select onChange={handleCustomerSelect} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500" required>
                <option value="">-- Select Customer --</option>
                <option value="Local customer">Local customer</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">GSTIN</label>
              <input value={formData.gstin} readOnly className="w-full bg-slate-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-500" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Mobile</label>
              <input value={formData.mobile} readOnly className="w-full bg-slate-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Vehicle No</label>
              <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR01..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Delivery Note (Bags)</label>
              <input name="deliveryNote" value={formData.deliveryNote} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Delivery Note Date</label>
              <input type="date" name="deliveryNoteDate" value={formData.deliveryNoteDate} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Buyer Order No</label>
              <input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Buyer Order Date</label>
              <input type="date" name="buyerOrderDate" value={formData.buyerOrderDate} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Dispatch Doc No</label>
              <input name="dispatchDocNo" value={formData.dispatchDocNo} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Dispatch Date</label>
              <input type="date" name="dispatchDate" value={formData.dispatchDate} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Dispatched Through</label>
              <select name="dispatchedThrough" value={formData.dispatchedThrough} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none">
                <option value="">-- Select Vehicle --</option>
                <option value="Truck">Truck</option><option value="Pick-up">Pick-up</option><option value="Tractor">Tractor</option><option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">LR/RR No</label>
              <input name="lrRrNo" value={formData.lrRrNo} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none">
                <option value="BY BANK">BY BANK</option><option value="CASH">CASH</option><option value="CREDIT">CREDIT</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Address</label>
              <input value={formData.address} readOnly className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-zinc-500" />
            </div>
          </div>

          {/* Product Multi-Item Section */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
              Product Details <span>Multi-Item Support</span>
            </div>
            <div className="p-4 space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-end border-b border-zinc-50 dark:border-zinc-800 pb-3">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Product {index+1}</label>
                    <select name="productName" value={item.productName} onChange={(e) => handleItemChange(index, e)} required className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs outline-none">
                      <option value="">-- Choose --</option>
                      <option value="Corn Grit">Corn Grit</option>
                      <option value="Corn Grit (3mm)">Corn Grit (3mm)</option>
                      
                    <option value="Cattle Feed">Cattle Feed</option>
                    <option value="Rice Grit">Rice Grit</option>
                      <option value="Corn Flour">Corn Flour</option>
                      <option value="Rice Flour">Rice Flour</option>
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Qty (KG)</label>
                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Rate (₹)</label>
                    <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} required className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs" />
                  </div>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all">+ ADD ITEM</button>
            </div>
          </div>

          {/* Billing & Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Discount %</label>
                <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Freight Charge (Deductable)</label>
                <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm text-red-500 font-bold" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Terms of Delivery</label>
                <textarea name="termsOfDelivery" value={formData.termsOfDelivery} onChange={handleChange} rows="2" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none" />
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/20 space-y-4">
               <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500">Final Bill</span><span className="text-sm font-black text-emerald-600">₹{formData.totalPrice.toFixed(2)}</span></div>
               <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500">Received (₹)</span><input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} className="w-24 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 p-1 text-right text-sm rounded outline-none" /></div>
               <div className="flex justify-between items-center pt-2 border-t border-emerald-100 dark:border-emerald-900/20"><span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase">Balance Due</span><span className={`text-sm font-black ${formData.paymentDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{formData.paymentDue.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={() => setFormData(initialState)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-xs hover:bg-zinc-200 transition-all uppercase tracking-tighter"><RotateCcw size={14}/> Clear All</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-tighter">
              {loading ? "Saving..." : <><Save size={14}/> Save Entry</>}
            </button>
          </div>
        </form>
      </div>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default SalesEntry;