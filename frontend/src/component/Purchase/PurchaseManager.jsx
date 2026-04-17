import React, { useState } from "react";
import PurchaseForm from "./PurchaseForm";
import PurchaseTable from "./PurchaseTable";
import { Plus, LayoutList, ShoppingBag } from "lucide-react";

/**
 * 🚀 PURCHASE MANAGER (v3)
 * Handles switching between Procurement History and Data Entry.
 */
const PurchaseManager = ({ user }) => {
  const [view, setView] = useState("TABLE"); // Views: "TABLE" or "FORM"
  const [editingPurchase, setEditingPurchase] = useState(null);

  // ✅ Trigger Edit Mode
  const handleEdit = (purchase) => {
    setEditingPurchase(purchase); // Pre-fill ke liye poora object pass hoga
    setView("FORM");
  };

  // ✅ Trigger New Entry Mode
  const handleAddNew = () => {
    setEditingPurchase(null);
    setView("FORM");
  };

  // ✅ Close Form (Success ya Cancel par)
  const handleCloseForm = () => {
    setEditingPurchase(null);
    setView("TABLE");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        
        {/* 🧭 Top Navigation / Mode Switcher */}
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-2">
            <button 
              onClick={() => setView("TABLE")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                view === "TABLE" 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <LayoutList size={16} /> Purchase History
            </button>
          </div>

          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus size={16} /> New Purchase Entry
          </button>
        </div>

        {/* 🔄 Dynamic Content Area with Animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
          {view === "FORM" ? (
            <div className="space-y-4">
               {/* Context Header for Form */}
               <div className="flex items-center gap-3 px-6 py-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-700">
                  <ShoppingBag size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {editingPurchase ? `Editing Bill: ${editingPurchase.billNo}` : "Create New Procurement Record"}
                  </span>
               </div>
               
               <PurchaseForm 
                 user={user} 
                 editData={editingPurchase} 
                 onCancel={handleCloseForm} 
                 onSuccess={handleCloseForm} 
               />
            </div>
          ) : (
            <PurchaseTable 
              user={user} 
              onEdit={handleEdit} 
            />
          )}
        </div>
      </div>

      {/* Internal CSS for Animations */}
      <style>{`
        .animate-in {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PurchaseManager;