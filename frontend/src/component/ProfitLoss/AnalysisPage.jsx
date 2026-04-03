import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Sparkles,
  AlertCircle,
  Users,
  Package,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";

const AnalysisPage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    profitLoss: null,
    forecast: [],
    efficiency: [],
    trends: [],
    insights: []
  });

  // ===============================
  // Fetch Analytics (Bug-Free Data Handling)
  // ===============================
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [pl, forecast, efficiency, trends, insights] = await Promise.all([
          axios.get(`${API_URL}/api/analytics/profit-loss`).catch(() => ({ data: null })),
          axios.get(`${API_URL}/api/analytics/product-forecast`).catch(() => ({ data: { forecast: [] } })),
          axios.get(`${API_URL}/api/analytics/employee-efficiency`).catch(() => ({ data: { employees: [] } })),
          axios.get(`${API_URL}/api/analytics/trends`).catch(() => ({ data: { trend: [] } })),
          axios.get(`${API_URL}/api/analytics/insights`).catch(() => ({ data: { insights: [] } }))
        ]);

        setAnalytics({
          profitLoss: pl?.data || null,
          forecast: forecast.data?.forecast || [],
          efficiency: efficiency.data?.employees || [],
          trends: trends.data?.trend || [],
          insights: insights.data?.insights || []
        });
      } catch (err) {
        console.error("Critical Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [API_URL]);

  // ===============================
  // AI Projection Engine (Safe Math)
  // ===============================
  const aiProjection = useMemo(() => {
    if (!analytics.profitLoss)
      return { nextRevenue: 0, burnRate: 0, margin: "0%", status: "Offline" };

    const sales = Number(analytics.profitLoss.totalSales || 0);
    const expense = Number(analytics.profitLoss.totalExpenses || 0);
    const netProfit = Number(analytics.profitLoss.netProfit || 0);

    return {
      nextRevenue: sales * 1.15,
      burnRate: (expense / 30).toFixed(2),
      margin: analytics.profitLoss.metrics?.margin || "0%",
      status: netProfit > 0 ? "Growth Mode" : "Optimization Required"
    };
  }, [analytics]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#02040a] text-zinc-400 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ================================================= */}
        {/* HEADER - Futuristic Sync */}
        {/* ================================================= */}
        <div className="p-10 rounded-[40px] bg-zinc-900/20 border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full group-hover:bg-cyan-500/10 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <Sparkles size={18} className="text-cyan-400 animate-pulse"/>
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">
                  AI Business Intelligence • एआई इंटेलिजेंस
                </span>
              </div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter">
                STRATOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">SYNC</span>
              </h1>
              <p className="text-sm text-zinc-500 mt-2 font-medium">
                Predictive Forecasting & Neural Analytics • भविष्यवाणियां और विश्लेषण
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <MetricCard
                label="Net Profit • शुद्ध लाभ"
                value={`₹${Number(analytics.profitLoss?.netProfit || 0).toLocaleString()}`}
                color={analytics.profitLoss?.netProfit < 0 ? "text-rose-500" : "text-cyan-400"}
              />
              <MetricCard
                label="System Status • स्थिति"
                value={aiProjection.status}
                color="text-amber-400"
              />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SUMMARY NODES */}
        {/* ================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Total Sales" sub="कुल बिक्री" value={analytics.profitLoss?.totalSales} icon={<TrendingUp/>} />
          <SummaryCard title="Purchases" sub="कुल खरीदारी" value={analytics.profitLoss?.totalPurchases} icon={<Package/>} />
          <SummaryCard title="Expenses" sub="कुल खर्च" value={analytics.profitLoss?.totalExpenses} icon={<Activity/>} />
          <SummaryCard title="Avg Sale" sub="औसत बिक्री" value={analytics.profitLoss?.metrics?.averageSaleValue} icon={<BarChart3/>} />
        </div>

        {/* ================================================= */}
        {/* REVENUE TREND VISUALIZER */}
        {/* ================================================= */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                <BarChart3 className="text-cyan-400"/> Revenue Momentum • राजस्व की गति
             </h3>
             <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500">
                LAST 12 MONTHS
             </div>
          </div>

          <div className="h-64 flex items-end gap-3 md:gap-6 px-4">
            {analytics.trends.length > 0 ? (
              analytics.trends.map((item, i) => {
                const height = Math.min((Number(item.revenue || 0) / 10000000) * 100, 100);
                return (
                  <div key={i} className="flex flex-col items-center w-full group/bar">
                    <div className="relative w-full flex flex-col justify-end items-center h-48">
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xl group-hover/bar:from-cyan-400 group-hover/bar:to-white transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                          style={{ height: `${height || 5}%` }}
                        />
                        <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all text-[10px] font-black text-white bg-zinc-800 px-2 py-1 rounded border border-white/10">
                           ₹{(item.revenue / 100000).toFixed(1)}L
                        </div>
                    </div>
                    <p className="text-[10px] mt-4 font-black text-zinc-600 uppercase group-hover/bar:text-cyan-400">
                      M{item._id?.month}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center py-20 text-zinc-600 italic">No trend data synchronized...</div>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* AI & PERFORMANCE GRID */}
        {/* ================================================= */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* AI Insights */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10">
            <h3 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-3">
              <ShieldCheck className="text-amber-400"/> AI Critical Insights • महत्वपूर्ण जानकारी
            </h3>
            <div className="space-y-4">
              {analytics.insights.length > 0 ? (
                analytics.insights.map((text, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex gap-4 items-start group hover:border-amber-500/30 transition-all">
                    <div className="mt-1 p-1 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500">
                      <AlertCircle size={14}/>
                    </div>
                    <p className="text-[11px] font-black uppercase text-zinc-300 leading-relaxed tracking-wide">
                      {text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs italic text-zinc-600">Scanning for new insights...</p>
              )}
            </div>
          </div>

          {/* Efficiency Radar */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10">
            <h3 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-3">
              <Users className="text-indigo-400"/> Talent Efficiency • कार्यक्षमता
            </h3>
            <div className="space-y-8">
              {analytics.efficiency.slice(0, 5).map((emp, i) => (
                <div key={i} className="group/emp">
                  <div className="flex justify-between mb-2">
                    <p className="text-[10px] font-black uppercase text-zinc-400 group-hover/emp:text-white transition-colors">{emp.name}</p>
                    <p className="text-[10px] font-black text-indigo-400">{emp.efficiency || 0}%</p>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-400 shadow-[0_0_10px_rgba(129,140,248,0.3)] transition-all duration-1000"
                      style={{ width: `${emp.efficiency || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* PRODUCT FORECAST (DATA TABLE) */}
        {/* ================================================= */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10 overflow-hidden relative">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                <Package className="text-cyan-400"/> Inventory Forecast • स्टॉक पूर्वानुमान
             </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-600 tracking-widest border-b border-white/5">
                  <th className="pb-6 px-4 text-white italic">Product • उत्पाद</th>
                  <th className="pb-6 px-4 text-center">Daily Demand • दैनिक मांग</th>
                  <th className="pb-6 px-4 text-center">30D Projection • ३० दिन</th>
                  <th className="pb-6 px-4 text-center">AI Suggestion • सुझाव</th>
                  <th className="pb-6 px-4 text-right">System Health • स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.forecast.length > 0 ? (
                  analytics.forecast.map((p, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition-all duration-300">
                      <td className="py-6 px-4 font-black text-sm text-white italic group-hover:text-cyan-400 transition-colors">
                        {p.product || "Unknown Unit"}
                      </td>
                      <td className="py-6 px-4 text-center text-xs font-bold text-zinc-400">
                        ₹{Number(p.dailyDemand || 0).toLocaleString()}
                      </td>
                      <td className="py-6 px-4 text-center text-xs font-bold text-zinc-300">
                        ₹{Number(p.forecast30Days || 0).toLocaleString()}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20 uppercase tracking-tighter">
                          REORDER: {p.reorderSuggestion || 0}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          p.health === "Critical" 
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {p.health || "Stable"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-20 text-center text-zinc-600 italic">No forecast vectors detected...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// ======================================
// ATOMIC UI COMPONENTS (Bug-Free & Refined)
// ======================================

const MetricCard = ({ label, value, color }) => (
  <div className="px-8 py-5 rounded-[25px] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:border-white/20 transition-all">
    <p className="text-[9px] uppercase text-zinc-500 font-black tracking-widest mb-1 group-hover:text-zinc-300 transition-colors">
      {label}
    </p>
    <p className={`text-3xl font-black italic tracking-tighter ${color}`}>
      {value}
    </p>
  </div>
);

const SummaryCard = ({ title, sub, value, icon }) => (
  <div className="p-8 rounded-[35px] bg-zinc-900/40 border border-white/5 hover:border-white/20 hover:bg-zinc-800/40 transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
       {React.cloneElement(icon, { size: 60 })}
    </div>
    <div className="mb-6 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/5 group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-black transition-all">
      {icon}
    </div>
    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
      {title} • <span className="text-zinc-600">{sub}</span>
    </p>
    <h4 className="text-2xl font-black text-white italic tracking-tighter mt-1 group-hover:translate-x-1 transition-transform">
      ₹{Number(value || 0).toLocaleString()}
    </h4>
  </div>
);

export default AnalysisPage;