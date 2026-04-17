import React from "react";
import { 
  Receipt, Save, RotateCcw, Trash2, User, 
  Calendar, Truck, MapPin, CreditCard, ShoppingBag, 
  Plus, Hash, Tag, Info
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
  products,
  editMode // Optional: Add/Edit mode check
}) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Bar */}
        <div className={`p-6 flex justify-between items-center ${editMode ? 'bg-amber-600' : 'bg-emerald-600'} text-white transition-colors`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Receipt size={24}/>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight italic">
                {editMode ? "Modify Sales Invoice" : "Professional Sales Entry"}
              </h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em]">Dhara Shakti Agro Products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black opacity-60 uppercase tracking-widest text-white">System Serial</p>
              <p className="text-sm font-black">#{nextSi}</p>
            </div>
            <div className="h-10 w-px bg-white/20 mx-2" />
            <span className="text-xs font-black bg-white/20 px-4 py-2 rounded-xl border border-white/30">
              {formData?.billNo || "NEW BILL"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Section 1: Party & Logistics */}
          <div className="relative p-8 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="absolute -top-3 left-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              1. Customer & Dispatch Details
            </div>

            <div className="space-y-1.5">
              <label className="label-style flex items-center gap-1"><Calendar size={12}/> Invoice Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input font-bold" />
            </div>

            <div className="space-y-1.5">
              <label className="label-style flex items-center gap-1"><Hash size={12}/> Invoice Number</label>
              <input name="billNo" value={formData.billNo} onChange={handleChange} required className="form-input font-black text-emerald-600 dark:text-emerald-400" placeholder="DS/2026-27/..." />
            </div>

            <div className="space-y-1.5">
              <label className="label-style flex items-center gap-1"><User size={12}/> Customer Name</label>
              <select 
                value={formData.customerName === "" ? "" : (suppliers.find(s => s.name === formData.customerName) ? formData.customerName : "Local customer")}
                onChange={handleCustomerSelect} 
                className="form-input cursor-pointer font-bold" 
                required
              >
                <option value="">-- Choose Customer --</option>
                <option value="Local customer">Local customer</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="label-style">GSTIN / URD</label>
              <input value={formData.gstin || "URD"} readOnly className="form-input-readonly" />
            </div>

            <div className="space-y-1.5">
              <label className="label-style flex items-center gap-1"><Truck size={12}/> Vehicle Number</label>
              <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR-01-XXXX" className="form-input uppercase" />
            </div>

            <div className="space-y-1.5">
              <label className="label-style">Dispatch Through</label>
              <select name="dispatchedThrough" value={formData.dispatchedThrough} onChange={handleChange} className="form-input">
                <option value="">-- Mode --</option>
                <option value="Truck">Truck</option><option value="Pick-up">Pick-up</option><option value="Tractor">Tractor</option><option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="label-style">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} placeholder="City/State" className="form-input" />
            </div>

            <div className="space-y-1.5">
              <label className="label-style">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="form-input font-bold">
                <option value="CREDIT">CREDIT</option>
                <option value="CASH">CASH</option>
                <option value="BANK">BANK</option>
              </select>
            </div>

            {/* Buyer Order Details */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="label-style text-[9px]">Buyer Order No</label>
                 <input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} className="form-input" />
               </div>
               <div className="space-y-1.5">
                 <label className="label-style text-[9px]">Buyer Order Date</label>
                 <input type="date" name="buyerOrderDate" value={formData.buyerOrderDate} onChange={handleChange} className="form-input" />
               </div>
            </div>

            <div className="lg:col-span-2 space-y-1.5">
              <label className="label-style flex items-center gap-1"><MapPin size={12}/> Address Preview</label>
              <input 
                value={(formData.street || formData.city) ? `${formData.street || ""}, ${formData.city || ""}` : "Select a party to see address"} 
                readOnly 
                className="form-input-readonly italic" 
              />
            </div>
          </div>

          {/* Section 2: Goods Table (Multi-Item) */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 text-[11px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2"><ShoppingBag size={14} className="text-emerald-500"/> Product & Inventory Sync</div>
              <span className="bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-[9px] border dark:border-zinc-700">Total Items: {formData.items?.length || 0}</span>
            </div>
            
            <div className="p-6 space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-zinc-50/30 dark:bg-zinc-900/40 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-left-2">
                  <div className="flex-1 min-w-[250px] space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Product</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <select
                        name="productId"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, e)}
                        className="form-input pl-10 font-bold"
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name.toUpperCase()} (HSN: {p.hsnCode})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-32 space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Quantity</label>
                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required className="form-input font-black text-center" placeholder="0" />
                  </div>

                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Rate (₹)</label>
                    <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} required className="form-input font-black text-emerald-600 dark:text-emerald-400 text-center" placeholder="0.00" />
                  </div>

                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-right">Taxable</label>
                    <div className="form-input-readonly text-right font-black">₹{(item.quantity * item.rate).toLocaleString()}</div>
                  </div>

                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all border border-transparent hover:border-rose-100 mb-0.5"><Trash2 size={20}/></button>
                  )}
                </div>
              ))}
              
              <button type="button" onClick={addItem} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/20">
                <Plus size={16}/> Add New Row
              </button>
            </div>
          </div>

          {/* Section 3: Billing Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-4">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 relative">
               <div className="absolute -top-3 left-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                2. Discounts & Freight
              </div>
              <div className="space-y-1.5">
                <label className="label-style">Cash Discount (%)</label>
                <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} className="form-input font-bold" placeholder="0%" />
              </div>
              <div className="space-y-1.5">
                <label className="label-style text-rose-500 font-black">Freight Deduction (₹)</label>
                <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} className="form-input border-rose-200 dark:border-rose-900/30 text-rose-600 font-black" placeholder="0.00" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="label-style flex items-center gap-1"><Info size={12}/> Remarks & Delivery Terms</label>
                <textarea name="termsOfDelivery" value={formData.termsOfDelivery} onChange={handleChange} rows="3" className="form-input resize-none" placeholder="Enter terms of delivery or internal remarks..." />
              </div>
            </div>

            {/* Final Calculation Card */}
            <div className="bg-zinc-900 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-white sticky top-4">
               <div className="space-y-1 border-b border-white/10 pb-4">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sub Total</p>
                 <p className="text-xl font-black">₹{(formData.totalPrice + (Number(formData.travelingCost) || 0)).toLocaleString()}</p>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Grand Net Total</p>
                 <p className="text-4xl font-black tracking-tighter text-emerald-500">₹{formData.totalPrice.toLocaleString()}</p>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount Received</label>
                 <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} className="w-full bg-white/10 border border-white/20 pl-12 pr-4 py-4 text-xl rounded-2xl outline-none font-black text-white focus:border-emerald-500 transition-all" />
                 </div>
               </div>

               <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-xs font-black text-zinc-400 uppercase">Balance Due</span>
                 <span className={`text-2xl font-black ${formData.paymentDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{formData.paymentDue.toLocaleString()}
                 </span>
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={() => resetForm(initialState)} 
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] hover:bg-zinc-200 transition-all uppercase tracking-widest"
            >
              <RotateCcw size={16}/> Reset
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={`flex items-center gap-3 px-12 py-4 rounded-2xl ${editMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black text-[11px] transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] active:scale-95 disabled:opacity-50`}
            >
              {loading ? "Syncing..." : <><Save size={18}/> {editMode ? "Update Invoice" : "Generate Invoice"}</>}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .label-style { font-size: 10px; font-weight: 900; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px; margin-left: 4px; }
        .form-input { width: 100%; background: #ffffff; border: 2px solid #f4f4f5; border-radius: 1rem; padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; transition: all 0.2s; color: #18181b; font-weight: 600; }
        .dark .form-input { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input:focus { border-color: #10b981; background: #ffffff; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1); }
        .dark .form-input:focus { background: #09090b; border-color: #10b981; }
        .form-input-readonly { width: 100%; background: #f4f4f5; border: 2px solid #f4f4f5; border-radius: 1rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: #71717a; font-weight: 700; cursor: not-allowed; }
        .dark .form-input-readonly { background: #27272a; border-color: #27272a; color: #52525b; }
      `}</style>
    </div>
  );
};

export default SalesEntryForm;