import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  ChevronDown, ChevronUp, LayoutDashboard, 
  ShoppingCart, Package, Users, 
  Wallet, ShieldCheck, 
  TrendingUp, Activity
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

  const menuItems = [
    {
      id: "operations",
      section: "OPERATIONS",
      items: [
        {
          id: "sales",
          label: "Sales & Billing",
          icon: <TrendingUp size={16} />,
          visible: isBoss,
          subItems: [{ label: "Sales Manager", path: "/sales-table" }],
        },
        {
          id: "purchase",
          label: "Procurement",
          icon: <ShoppingCart size={16} />,
          visible: isBoss,
          subItems: [{ label: "Purchase Manager", path: "/purchase-table" }],
        },
      ]
    },
    {
      id: "logistics",
      section: "INVENTORY",
      items: [
        {
          id: "stock",
          label: "Inventory Master",
          icon: <Package size={16} />,
          visible: isBoss,
          subItems: [
            { label: "Stock View", path: "/stock-management" },
            { label: "Manual Add", path: "/stock-add" },
            { label: "Parties", path: "/suppliers" },
          ],
        },
      ]
    },
    {
      id: "hr",
      section: "HUMAN RESOURCE",
      items: [
        {
          id: "staff",
          label: "Staff Control",
          icon: <Users size={16} />,
          visible: true,
          subItems: [
            // { label: "Directory", path: "/employee-table", restricted: !isBoss },
            { label: "Employee Management", path: "/employee-management", restricted: !isAdmin },
            { label: "Attendance", path: "/attendance", restricted: !isBoss },
            { label: "Ledger", path: "/staff-ledger", restricted: false },
          ].filter(item => !item.restricted),
        },
      ]
    },
    {
      id: "accounts",
      section: "FINANCE",
      items: [
        {
          id: "finance",
          label: "Finance Hub",
          icon: <Wallet size={16} />,
          visible: isBoss,
          subItems: [
            { label: "Expenses", path: "/expenses" },
            { label: "P & L", path: "/profit-loss" },
            { label: "Reports", path: "/Reports_Printing" },
            { label: "Invoice", path: "/invoice" },
            { label: "Transaction", path: "/add-transaction", restricted: !isAdmin },
            { label: "Txn History", path: "/transaction-history", restricted: !isAdmin },
          ].filter(item => !item.restricted),
        },
      ]
    }
  ];

  return (
    // 🔥 FIX 1: Parent height and overflow
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-sans border-r dark:border-zinc-900 overflow-hidden select-none">
      
      {/* 🚀 Top Brand - Header Fixed */}
      <div className="p-4 flex-shrink-0">
        <div 
          onClick={() => handleNavigate("/dashboard")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
            location.pathname === "/dashboard" 
            ? "bg-zinc-900 dark:bg-emerald-600 text-white shadow-lg" 
            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-black text-[10px] uppercase tracking-widest text-left">Main Overview</span>
        </div>
      </div>

      {/* 🛠 Internal Scrollable Section - Only this will scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 custom-sidebar-scroll">
        {menuItems.map((group) => (
          <div key={group.id} className="mb-4 text-left">
            <p className="px-3 text-[8px] font-black text-zinc-400 dark:text-zinc-600 tracking-[0.2em] uppercase mb-2">
              {group.section}
            </p>

            <div className="space-y-1">
              {group.items.filter(i => i.visible).map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      openMenu === item.id ? "bg-emerald-50/50 dark:bg-emerald-900/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md transition-all ${
                        openMenu === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}>
                        {item.icon}
                      </div>
                      <span className={`text-[12px] font-bold ${
                        openMenu === item.id ? "text-zinc-900 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {openMenu === item.id ? <ChevronUp size={12} className="text-emerald-500" /> : <ChevronDown size={12} className="text-zinc-300" />}
                  </button>

                  <div className={`transition-all duration-300 overflow-hidden ${
                    openMenu === item.id ? "max-h-60 opacity-100 mt-0.5" : "max-h-0 opacity-0"
                  }`}>
                    <ul className="ml-5 pl-3 border-l border-zinc-100 dark:border-zinc-800 space-y-0.5">
                      {item.subItems.map((sub, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleNavigate(sub.path)}
                          className={`py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer text-left ${
                            location.pathname === sub.path
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
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

      {/* 🔒 Footer Actions - Fixed Bottom */}
      <div className="p-4 border-t dark:border-zinc-900 bg-white dark:bg-zinc-950 flex-shrink-0 space-y-2">
        {isAdmin && (
          <div 
            onClick={() => handleNavigate("/audit-trail")}
            className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 text-zinc-500 hover:text-amber-600 transition-all group"
          >
            <Activity size={14} className="text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest text-left">Audit Activity</span>
          </div>
        )}

        {isAdmin && (
          <Link
            to="/master-panel"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-emerald-600 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="p-1.5 bg-white/20 rounded-lg"><ShieldCheck size={16} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Master Panel</span>
          </Link>
        )}
      </div>

      {/* 🔥 FIX 2: Global CSS to hide ANY other scrollbar in this component */}
      <style>{`
        .custom-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: #d4d4d8 transparent;
        }
        .custom-sidebar-scroll::-webkit-scrollbar {
            width: 3px;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb {
            background: #d4d4d8;
            border-radius: 10px;
        }
        .dark .custom-sidebar-scroll::-webkit-scrollbar-thumb {
            background: #3f3f46;
        }
        /* Extra safety to ensure only the inner div scrolls */
        .flex-col { overflow: hidden !important; }
        .custom-sidebar-scroll { overflow-y: auto !important; }
      `}</style>
    </div>
  );
};

export default DashboardSidebar;