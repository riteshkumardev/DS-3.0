import React from "react";
import { 
  Receipt, Save, RotateCcw, Trash2, User, 
  Calendar, Truck, MapPin, CreditCard, ShoppingBag, 
  Plus
} from "lucide-react";

const SalesEntryForm = ({ 
  formData, 
  nextSi, 
  loading, 
  suppliers, 
  handleChange, 
  handleCustomerSelect, 
  handleItemChange, 
  addItem, 
  removeItem, 
  handleSubmit, 
  resetForm, 
  initialState,
  products
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 font-sans">
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Bar */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 p-4 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-black text-emerald-600 flex items-center gap-2 tracking-tight uppercase">
            <Receipt size={20}/> Professional Sales Entry
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serial Index</span>
            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              #{nextSi}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* Section 1: Basic Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="label-style">Invoice Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Invoice No</label>
              <input name="billNo" value={formData.billNo} onChange={handleChange} required className="form-input font-bold text-emerald-600" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Customer Name</label>
              <select onChange={handleCustomerSelect} className="form-input" required>
                <option value="">-- Select Customer --</option>
                <option value="Local customer">Local customer</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-style">GSTIN</label>
              <input value={formData.gstin} readOnly className="form-input-readonly" placeholder="Auto-filled" />
            </div>

            <div className="space-y-1">
              <label className="label-style">Mobile</label>
              <input value={formData.mobile} readOnly className="form-input-readonly" placeholder="Auto-filled" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Vehicle No</label>
              <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="e.g. BR01..." className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Delivery Note (Bags)</label>
              <input name="deliveryNote" value={formData.deliveryNote} onChange={handleChange} placeholder="No. of Bags" className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Delivery Note Date</label>
              <input type="date" name="deliveryNoteDate" value={formData.deliveryNoteDate} onChange={handleChange} className="form-input" />
            </div>

            <div className="space-y-1">
              <label className="label-style">Buyer Order No</label>
              <input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Buyer Order Date</label>
              <input type="date" name="buyerOrderDate" value={formData.buyerOrderDate} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Dispatch Doc No</label>
              <input name="dispatchDocNo" value={formData.dispatchDocNo} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Dispatch Date</label>
              <input type="date" name="dispatchDate" value={formData.dispatchDate} onChange={handleChange} className="form-input" />
            </div>

            <div className="space-y-1">
              <label className="label-style">Dispatched Through</label>
              <select name="dispatchedThrough" value={formData.dispatchedThrough} onChange={handleChange} className="form-input">
                <option value="">-- Select Vehicle --</option>
                <option value="Truck">Truck</option><option value="Pick-up">Pick-up</option><option value="Tractor">Tractor</option><option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-style">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">LR/RR No</label>
              <input name="lrRrNo" value={formData.lrRrNo} onChange={handleChange} className="form-input" />
            </div>
            <div className="space-y-1">
              <label className="label-style">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="form-input">
                <option value="BY BANK">BY BANK</option><option value="CASH">CASH</option><option value="CREDIT">CREDIT</option>
              </select>
            </div>

            {/* Address Preview - Full Width */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-1">
              <label className="label-style text-emerald-600">Complete Address Preview</label>
              <input 
                value={
                  (formData.street || formData.city) 
                    ? `${formData.street || ""}${formData.street && formData.city ? ", " : ""}${formData.city || ""}, Bihar`
                    : "Address details not provided"
                } 
                readOnly 
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-500 font-medium italic cursor-not-allowed" 
              />
            </div>
          </div>

          {/* Section 2: Multi-Item Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
              Product Details <span>Multi-Item Entry</span>
            </div>
            <div className="p-4 space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end border-b border-zinc-50 dark:border-zinc-800 pb-3 animate-in fade-in slide-in-from-left-2">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Product {index+1}</label>
                  <select
  name="productId" // 👈 productName ki jagah productId
  value={item.productId}
  onChange={(e) => handleItemChange(index, e)}
  className="..."
>
  <option value="">-- Choose Product --</option>
  {products.map((p) => (
    <option key={p._id} value={p._id}>
      {p.name} (HSN: {p.hsnCode})
    </option>
  ))}
</select>
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Qty (KG)</label>
                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required className="form-input text-xs" />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400">Rate (₹)</label>
                    <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} required className="form-input text-xs" />
                  </div>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors mb-0.5"><Trash2 size={18}/></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-[10px] font-black flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/20 uppercase tracking-tighter">
                <Plus size={14}/> Add Another Item
              </button>
            </div>
          </div>

          {/* Section 3: Billing & Calculations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label-style">Discount (%)</label>
                <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} className="form-input" />
              </div>
              <div className="space-y-1">
                <label className="label-style text-rose-500">Freight Charge (Deduction)</label>
                <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} className="form-input border-rose-100 dark:border-rose-900/20 text-rose-600 font-bold" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="label-style">Terms of Delivery & Remarks</label>
                <textarea name="termsOfDelivery" value={formData.termsOfDelivery} onChange={handleChange} rows="2" className="form-input resize-none" placeholder="Any special instructions..." />
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-zinc-500 uppercase">Sub Total</span>
                 <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">₹{(formData.totalPrice + (Number(formData.travelingCost) || 0)).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-zinc-500 uppercase">Net Amount</span>
                 <span className="text-lg font-black text-emerald-600 tracking-tighter">₹{formData.totalPrice.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-zinc-500 uppercase">Amount Paid</span>
                 <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} className="w-28 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 p-2 text-right text-sm rounded-xl outline-none font-bold text-emerald-600" />
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50 dark:border-emerald-900/30">
                 <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase">Balance Due</span>
                 <span className={`text-base font-black ${formData.paymentDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{formData.paymentDue.toFixed(2)}
                 </span>
               </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={() => resetForm(initialState)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-xs hover:bg-zinc-200 transition-all uppercase tracking-widest">
              <RotateCcw size={14}/> Reset Form
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest active:scale-95 disabled:opacity-50">
              {loading ? "Processing..." : <><Save size={16}/> Save Invoice</>}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .label-style { font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .form-input { width: 100%; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.875rem; font-size: 0.875rem; outline: none; transition: all 0.2s; color: #374151; font-weight: 500; }
        .dark .form-input { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); background: #ffffff; }
        .dark .form-input:focus { background: #09090b; }
        .form-input-readonly { width: 100%; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.875rem; font-size: 0.875rem; color: #9ca3af; font-weight: 600; cursor: not-allowed; }
        .dark .form-input-readonly { background: #27272a; border-color: #3f3f46; color: #71717a; }
      `}</style>
    </div>
  );
};

export default SalesEntryForm;