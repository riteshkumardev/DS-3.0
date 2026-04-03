import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ChevronDown, ChevronUp, LayoutDashboard, 
  ShoppingCart, Package, Users, 
  Wallet, ShieldCheck, ArrowRight,
  TrendingUp, CreditCard, Receipt
} from "lucide-react";

const DashboardSidebar = ({ closeSidebar, user }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleNavigate = (path) => {
    navigate(path);
    if (closeSidebar) closeSidebar();
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const menuItems = [
    {
      id: "sales",
      label: "Sales & Billing",
      icon: <TrendingUp size={18} />,
      color: "emerald",
      subItems: [
        { label: "Sales Entry", path: "/sales-entry" },
        { label: "Sales Table", path: "/sales-table" },
      ],
    },
    {
      id: "purchase",
      label: "Purchase & Billing",
      icon: <ShoppingCart size={18} />,
      color: "teal",
      subItems: [
        { label: "Purchase Entry", path: "/purchase-form" },
        { label: "Purchase Table", path: "/purchase-table" },
      ],
    },
    {
      id: "stock",
      label: "Inventory",
      icon: <Package size={18} />,
      color: "sky",
      subItems: [
        { label: "Stock View", path: "/stock-management" },
        { label: "Add New Stock", path: "/stock-add" },
        { label: "Supplier Manager", path: "/suppliers" },
        { label: "Bill Print", path: "/invoice" },
      ],
    },
    {
      id: "staff",
      label: "Staff Control",
      icon: <Users size={18} />,
      color: "indigo",
      subItems: [
        { label: "Employee List", path: "/employee-table" },
        { label: "Add Employee", path: "/employee-add" },
        { label: "Attendance", path: "/attendance" },
        { label: "Employee Ledger", path: "/staff-ledger" },
      ],
    },
    {
      id: "finance",
      label: "Finance Reports",
      icon: <Wallet size={18} />,
      color: "amber",
      subItems: [
        { label: "Expenses", path: "/expenses" },
        { label: "Profit & Loss", path: "/profit-loss" },
        { label: "Reports & Printing", path: "/Reports_Printing" },
        { label: "Transaction History", path: "/transaction-history" },
        { label: "Add Transaction", path: "/add-transaction" },
        { label: "Analysis", path: "/analysis-page" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 px-3 py-4 space-y-1.5 font-sans">
      
      {/* Quick Dashboard Link */}
      <div 
        onClick={() => handleNavigate("/dashboard")}
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
      >
        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-bold text-sm tracking-tight">Main Overview</span>
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3 mx-2" />

      {/* Dynamic Menu Groups */}
      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
        {menuItems.map((item) => (
          <div key={item.id} className="sidebar-section">
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ${
                openMenu === item.id 
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 shadow-sm" 
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm transition-colors ${
                  openMenu === item.id ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[13px] font-bold tracking-wide transition-colors ${
                  openMenu === item.id ? "text-emerald-900 dark:text-emerald-100" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {item.label}
                </span>
              </div>
              {openMenu === item.id ? (
                <ChevronUp size={16} className="text-emerald-500" />
              ) : (
                <ChevronDown size={16} className="text-zinc-300" />
              )}
            </button>

            {/* Sub-menu Items */}
            <div className={`transition-all duration-300 ease-in-out ${
              openMenu === item.id ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden"
            }`}>
              <ul className="ml-6 pl-4 border-l-2 border-emerald-100 dark:border-emerald-900/30 space-y-1">
                {item.subItems.map((sub, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleNavigate(sub.path)}
                    className="relative flex items-center gap-3 py-2.5 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                  >
                    <div className="absolute left-[-18px] w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                    {sub.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Master Control - Shield UI */}
      {user?.role === "Admin" && (
        <div className="pt-4 mt-auto">
          <Link
            to="/master-panel"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-500/10 hover:scale-[1.02] transition-transform active:scale-95 group"
          >
            <div className="p-2 bg-emerald-500 rounded-lg text-white group-hover:rotate-12 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-80">
                Security Panel
              </span>
              <span className="text-xs font-bold">Master Control</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar;