import React, { useState } from "react";
import SalesTable from "./SalesTable";
import SalesEntryForm from "./SalesEntryForm"; // Maan ke chal rahe hain aapka SalesForm ready hai
import { Plus, LayoutList } from "lucide-react";

/**
 * 🚀 SALES MANAGER (v3)
 * Yeh component Table aur Form ke beech ka bridge hai.
 */
const SalesManager = ({ user }) => {
  const [view, setView] = useState("TABLE"); // Views: "TABLE" or "FORM"
  const [editingSale, setEditingSale] = useState(null);

  // ✅ Edit Mode Trigger
  const handleEdit = (sale) => {
    setEditingSale(sale);
    setView("FORM");
  };

  // ✅ Add Mode Trigger
  const handleAddNew = () => {
    setEditingSale(null);
    setView("FORM");
  };

  // ✅ Success/Cancel Callback
  const handleCloseForm = () => {
    setEditingSale(null);
    setView("TABLE");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        
        {/* Navigation / Mode Switcher */}
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-2">
            <button 
              onClick={() => setView("TABLE")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                view === "TABLE" 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <LayoutList size={16} /> Sales History
            </button>
          </div>

          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus size={16} /> New Sale Invoice
          </button>
        </div>

        {/* Dynamic Content Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {view === "FORM" ? (
            <SalesEntryForm 
              user={user} 
              editData={editingSale} 
              onCancel={handleCloseForm} 
              onSuccess={handleCloseForm} 
            />
          ) : (
            <SalesTable 
              user={user} 
              onEdit={handleEdit} 
            />
          )}
        </div>
      </div>

      <style>{`
        .animate-in {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default SalesManager;