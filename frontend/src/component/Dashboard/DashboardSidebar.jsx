import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  ChevronDown, ChevronUp, LayoutDashboard, 
  ShoppingCart, Package, Users, 
  Wallet, ShieldCheck, ArrowRight,
  TrendingUp, Activity, Boxes, ReceiptIndianRupee
} from "lucide-react";

const DashboardSidebar = ({ closeSidebar, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isManager = userRole === "MANAGER";
  const isBoss = isAdmin || isManager;

  const handleNavigate = (path) => {
    navigate(path);
    if (closeSidebar) closeSidebar();
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  // Grouped Menu Items
  const menuItems = [
    {
      id: "operations",
      section: "CORE OPERATIONS",
      items: [
        {
          id: "sales",
          label: "Sales & Billing",
          icon: <TrendingUp size={18} />,
          visible: isBoss,
          subItems: [{ label: "Sales Manager", path: "/sales-table" }],
        },
        {
          id: "purchase",
          label: "Procurement",
          icon: <ShoppingCart size={18} />,
          visible: isBoss,
          subItems: [{ label: "Purchase Manager", path: "/purchase-table" }],
        },
      ]
    },
    {
      id: "logistics",
      section: "INVENTORY & PARTIES",
      items: [
        {
          id: "stock",
          label: "Inventory Master",
          icon: <Package size={18} />,
          visible: isBoss,
          subItems: [
            { label: "Live Stock View", path: "/stock-management" },
            { label: "Manual Stock Add", path: "/stock-add" },
            { label: "Party/Supplier Manager", path: "/suppliers" },
          ],
        },
      ]
    },
    {
      id: "human_resource",
      section: "HUMAN RESOURCE",
      items: [
        {
          id: "staff",
          label: "Staff Control",
          icon: <Users size={18} />,
          visible: true,
          subItems: [
            { label: "Employee Directory", path: "/employee-table", restricted: !isBoss },
            { label: "Recruit Staff", path: "/employee-add", restricted: !isAdmin },
            { label: "Daily Attendance", path: "/attendance", restricted: !isBoss },
            { label: "Salary Ledger", path: "/staff-ledger", restricted: false },
          ].filter(item => !item.restricted),
        },
      ]
    },
    {
      id: "accounts",
      section: "ACCOUNTS & FINANCE",
      items: [
        {
          id: "finance",
          label: "Finance Hub",
          icon: <Wallet size={18} />,
          visible: isBoss,
          subItems: [
            { label: "Business Expenses", path: "/expenses" },
            { label: "Profit & Loss Account", path: "/profit-loss" },
            { label: "Master Reports", path: "/Reports_Printing" },
            { label: "Txn History", path: "/transaction-history", restricted: !isAdmin },
            { label: "Data Analysis", path: "/analysis-page", restricted: !isAdmin },
          ].filter(item => !item.restricted),
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 px-4 py-6 font-sans border-r dark:border-zinc-900 overflow-hidden">
      
      {/* 🚀 Brand/Main Link */}
      <div 
        onClick={() => handleNavigate("/dashboard")}
        className={`flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
          location.pathname === "/dashboard" 
          ? "bg-zinc-900 dark:bg-emerald-600 text-white shadow-xl shadow-zinc-500/20" 
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
        }`}
      >
        <LayoutDashboard size={20} className={location.pathname === "/dashboard" ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
        <span className="font-black text-xs uppercase tracking-widest">Main Overview</span>
      </div>

      {/* 🛠 Dynamic Sections */}
      <div className="flex-1 mt-8 space-y-8 overflow-y-auto custom-scrollbar pr-1">
        {menuItems.map((group) => (
          <div key={group.id} className="space-y-3">
            {/* Section Label */}
            <p className="px-4 text-[9px] font-black text-zinc-400 dark:text-zinc-600 tracking-[0.2em] uppercase">
              {group.section}
            </p>

            <div className="space-y-1.5">
              {group.items.filter(i => i.visible).map((item) => (
                <div key={item.id} className="sidebar-section">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                      openMenu === item.id 
                        ? "bg-emerald-50/50 dark:bg-emerald-900/5" 
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-all ${
                        openMenu === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}>
                        {item.icon}
                      </div>
                      <span className={`text-[13px] font-bold tracking-tight ${
                        openMenu === item.id ? "text-zinc-900 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {openMenu === item.id ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-zinc-300" />}
                  </button>

                  {/* Sub-menu with connected line effect */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    openMenu === item.id ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}>
                    <ul className="ml-7 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-1">
                      {item.subItems.map((sub, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleNavigate(sub.path)}
                          className={`flex items-center gap-3 py-2.5 px-4 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            location.pathname === sub.path
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                            : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          {sub.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 🔒 Footer Actions */}
      <div className="pt-6 border-t dark:border-zinc-900 space-y-2">
        {isAdmin && (
          <div 
            onClick={() => handleNavigate("/audit-trail")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 text-zinc-500 hover:text-amber-600 transition-all group"
          >
            <Activity size={16} className="text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Audit Activity</span>
          </div>
        )}

        {isAdmin && (
          <Link
            to="/master-panel"
            onClick={closeSidebar}
            className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-zinc-900 dark:bg-emerald-600 text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <ShieldCheck size={18} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">System Security</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white">Master Panel</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardSidebar;