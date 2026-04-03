import React, { useState, useEffect } from "react";
import axios from "axios"; 
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, ShoppingCart, Package, ShieldCheck, 
  ChevronRight, LayoutDashboard, BellRing, User as UserIcon,
  ArrowUpRight, Clock, PlusCircle, History, Zap
} from "lucide-react";
import Loader from "./Core_Component/Loader/Loader";
import OverdueAlerts from "./Core_Component/Alert/OverdueAlerts";
import MasterSmartBot from "./Bot/MasterSmartBot";

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ salesCount: 0, purchaseCount: 0, stockCount: 0 });
  const [allSales, setAllSales] = useState([]); 
  const [allPurchases, setAllPurchases] = useState([]); 
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [salesRes, purchaseRes, stockRes] = await Promise.all([
          axios.get(`${API_URL}/api/sales`),
          axios.get(`${API_URL}/api/purchases`),
          axios.get(`${API_URL}/api/stocks`)
        ]);

        const salesData = salesRes.data.data || [];
        const purchaseData = purchaseRes.data.data || [];
        
        setAllSales(salesData);
        setAllPurchases(purchaseData);
        setStats({
          salesCount: salesData.length,
          purchaseCount: purchaseData.length,
          stockCount: stockRes.data.data?.length || 0
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    fetchDashboardData();
  }, [API_URL]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-zinc-950 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 🚀 HEADER & PROFILE SECTION */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6 animate-in fade-in slide-in-from-top-5 duration-700">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-600/20 transform hover:rotate-12 transition-transform">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic">
              Dhara <span className="text-emerald-600">Shakti</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                System Active • {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2.5 pr-8 rounded-full shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/20 p-0.5">
              {user?.photo ? (
                <img src={user.photo} className="w-full h-full object-cover rounded-full" alt="User" />
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-white font-black">{user?.name?.charAt(0)}</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight leading-none mb-1">{user?.name}</h4>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-500" /> {user?.role}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* ⚡ QUICK ACTIONS BAR */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ActionButton label="New Sale" icon={<PlusCircle size={18}/>} onClick={() => navigate("/sales-entry")} color="emerald" />
          <ActionButton label="Add Stock" icon={<Package size={18}/>} onClick={() => navigate("/stock-management")} color="sky" />
          <ActionButton label="Reports" icon={<History size={18}/>} onClick={() => navigate("/Reports_Printing")} color="zinc" />
          <ActionButton label="Insights" icon={<Zap size={18}/>}onClick={() => navigate("/analysis-page")} color="amber" />
        </section>

        🚩 CRITICAL ALERTS
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 ml-2">
            <div className="p-2 bg-rose-500/10 rounded-lg"><BellRing size={18} className="text-rose-500" /></div>
            <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Payment Watchlist</h3>
          </div>
          <OverdueAlerts 
            salesData={allSales} 
            purchaseData={allPurchases} 
            daysLimit={10} 
            onViewDetails={(item, type) => navigate(type === 'SALE' ? "/invoices" : "/purchase-list")} 
          />
        </section>

        {/* 📈 ANALYTICS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Sales" 
            count={stats.salesCount} 
            icon={<TrendingUp size={24}/>} 
            color="emerald" 
            onClick={() => navigate("/sales-table")}
            subText="Orders completed"
          />
          <StatCard 
            title="Purchases" 
            count={stats.purchaseCount} 
            icon={<ShoppingCart size={24}/>} 
            color="amber" 
            onClick={() => navigate("/purchase-table")}
            subText="Stock procured"
          />
          <StatCard 
            title="Inventory" 
            count={stats.stockCount} 
            icon={<Package size={24}/>} 
            color="sky" 
            onClick={() => navigate("/stock-management")}
            subText="Active items"
          />
          <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-800 dark:to-zinc-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-all" />
            <UserIcon className="text-zinc-700 mb-4" size={28} />
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">{user?.role}</h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-[0.2em]">Authorized Personnel</p>
            <div className="mt-6 flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck size={12} /> System Master
            </div>
          </div>
        </section>
      </main>

    
        <MasterSmartBot />
    </div>
  );
};

// --- MODERN SUB-COMPONENTS ---

const ActionButton = ({ label, icon, onClick, color }) => {
  const colors = {
    emerald: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
    sky: "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20",
    zinc: "bg-zinc-800 hover:bg-black shadow-zinc-800/20",
    amber: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
  };
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center gap-3 p-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
};

const StatCard = ({ title, count, icon, color, onClick, subText }) => {
  const colorMap = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-500/50 dark:bg-emerald-950/20 dark:border-emerald-900/50",
    amber: "text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-500/50 dark:bg-amber-950/20 dark:border-amber-900/50",
    sky: "text-sky-600 bg-sky-50 border-sky-100 hover:border-sky-500/50 dark:bg-sky-950/20 dark:border-sky-900/50"
  };

  return (
    <div 
      onClick={onClick}
      className={`p-8 rounded-[2.5rem] border bg-white dark:bg-zinc-900 shadow-xl cursor-pointer transition-all duration-300 group ${colorMap[color]}`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={20} className="text-zinc-400" />
        </div>
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{count}</h3>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{subText}</span>
        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <ChevronRight size={14} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default Home;