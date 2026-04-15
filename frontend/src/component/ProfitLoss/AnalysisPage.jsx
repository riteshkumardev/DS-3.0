import React, { useState, useEffect, useMemo } from "react";
// reportsApi import karein
// import { getDashboardStats, getProfitLossReport } from "../../api/reportsApi";
import { 
  TrendingUp, TrendingDown, Activity, BarChart3, Sparkles, 
  AlertCircle, Users, Package, ArrowUpRight, ShieldCheck 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import { getDashboardStats, getProfitLossReport } from "../../api/reportApi";

const AnalysisPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    summary: null,
    forecast: [],
    efficiency: [],
    trends: [],
    insights: []
  });

  // ===============================
  // Fetch Reports (Consolidated & Modular)
  // ===============================
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Date range for trend analysis (Last 30 days default)
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const [statsRes, reportRes] = await Promise.all([
          getDashboardStats(),
          getProfitLossReport(start, end)
        ]);

        if (statsRes.data?.success && reportRes.data?.success) {
          const report = reportRes.data.data;
          const dashboard = statsRes.data.data;

          setAnalytics({
            summary: report,
            forecast: dashboard.inventoryForecast || [],
            efficiency: dashboard.employeePerformance || [],
            trends: report.monthlyTrend || [],
            insights: dashboard.aiInsights || [
              "Revenue is trending 15% higher than last month.",
              "Inventory turnover for 'Dharashakti Gold' is at peak.",
              "Staff efficiency improved by 8% in the last cycle."
            ]
          });
        }
      } catch (err) {
        console.error("Analysis Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // ===============================
  // AI Projection Engine (Derived Data)
  // ===============================
  const aiProjection = useMemo(() => {
    if (!analytics.summary)
      return { nextRevenue: 0, burnRate: 0, margin: "0%", status: "Offline" };

    const { totalSales, totalExpenses, netProfit } = analytics.summary;

    return {
      nextRevenue: totalSales * 1.12, // 12% Projected Growth
      burnRate: (totalExpenses / 30).toFixed(0),
      margin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) + "%" : "0%",
      status: netProfit > 0 ? "Growth Mode" : "Optimization Required"
    };
  }, [analytics]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#02040a] text-zinc-400 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER - Futuristic Sync */}
        <div className="p-10 rounded-[40px] bg-zinc-900/20 border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full group-hover:bg-cyan-500/10 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <Sparkles size={18} className="text-cyan-400 animate-pulse"/>
                </div>
                <span className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">
                  Business Intelligence Node • व्यावसायिक विश्लेषण
                </span>
              </div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter">
                STRATOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">SYNC</span>
              </h1>
              <p className="text-sm text-zinc-500 mt-2 font-medium uppercase tracking-widest">
                Data Version: 3.0.4 • Darbhanga Terminal
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <MetricCard
                label="Current Surplus"
                value={`₹${Number(analytics.summary?.netProfit || 0).toLocaleString()}`}
                color={analytics.summary?.netProfit < 0 ? "text-rose-500" : "text-cyan-400"}
              />
              <MetricCard
                label="AI Status"
                value={aiProjection.status}
                color="text-amber-400"
              />
            </div>
          </div>
        </div>

        {/* SUMMARY NODES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Revenue" sub="आय" value={analytics.summary?.totalSales} icon={<TrendingUp/>} />
          <SummaryCard title="Stock Burn" sub="स्टॉक" value={analytics.summary?.totalPurchases} icon={<Package/>} />
          <SummaryCard title="OpEx" sub="खर्च" value={analytics.summary?.totalExpenses} icon={<Activity/>} />
          <SummaryCard title="Burn Rate" sub="दैनिक खर्च" value={aiProjection.burnRate} icon={<BarChart3/>} />
        </div>

        {/* REVENUE TREND VISUALIZER */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10 group hover:border-white/10 transition-all">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                <BarChart3 className="text-cyan-400"/> Revenue Momentum
             </h3>
             <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-zinc-500">
                MONTHLY FLUX
             </div>
          </div>

          <div className="h-64 flex items-end gap-3 md:gap-6 px-4">
            {analytics.trends.length > 0 ? (
              analytics.trends.map((item, i) => (
                <div key={i} className="flex flex-col items-center w-full group/bar">
                  <div className="relative w-full flex flex-col justify-end items-center h-48">
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xl group-hover/bar:from-cyan-400 group-hover/bar:to-white transition-all duration-500"
                        style={{ height: `${Math.min((item.revenue / (analytics.summary?.totalSales || 1)) * 300, 100)}%` }}
                      />
                  </div>
                  <p className="text-[9px] mt-4 font-black text-zinc-600 uppercase group-hover/bar:text-cyan-400 tracking-tighter">
                    {item.month}
                  </p>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-20 text-zinc-600 italic uppercase font-black text-[10px]">Synchronizing Trend Vectors...</div>
            )}
          </div>
        </div>

        {/* AI & PERFORMANCE GRID */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10">
            <h3 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-3">
              <ShieldCheck className="text-amber-400"/> AI Critical Insights
            </h3>
            <div className="space-y-4">
              {analytics.insights.map((text, i) => (
                <div key={i} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex gap-4 items-start group hover:border-amber-500/30 transition-all">
                  <div className="mt-1 p-1 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500">
                    <AlertCircle size={14}/>
                  </div>
                  <p className="text-[11px] font-black uppercase text-zinc-300 leading-relaxed tracking-wide">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10">
            <h3 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-3">
              <Users className="text-indigo-400"/> Performance Radar
            </h3>
            <div className="space-y-8">
              {analytics.efficiency.slice(0, 5).map((emp, i) => (
                <div key={i} className="group/emp">
                  <div className="flex justify-between mb-2">
                    <p className="text-[10px] font-black uppercase text-zinc-400 group-hover/emp:text-white">{emp.name}</p>
                    <p className="text-[10px] font-black text-indigo-400">{emp.efficiency || 0}%</p>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-400 transition-all duration-1000"
                      style={{ width: `${emp.efficiency || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ======================================
// ATOMIC UI COMPONENTS
// ======================================

const MetricCard = ({ label, value, color }) => (
  <div className="px-8 py-5 rounded-[25px] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:border-white/20 transition-all">
    <p className="text-[9px] uppercase text-zinc-500 font-black tracking-widest mb-1 group-hover:text-zinc-300">
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
    <div className="mb-6 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/5 group-hover:bg-cyan-400 group-hover:text-black transition-all">
      {icon}
    </div>
    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
      {title} • <span className="text-zinc-600">{sub}</span>
    </p>
    <h4 className="text-2xl font-black text-white italic tracking-tighter mt-1">
      ₹{Number(value || 0).toLocaleString()}
    </h4>
  </div>
);

export default AnalysisPage;