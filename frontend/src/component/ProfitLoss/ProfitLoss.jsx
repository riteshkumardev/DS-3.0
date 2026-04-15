import React, { useState, useEffect, useMemo } from "react";
// 1. New API Helper Imports
// import { getProfitLossReport } from "../../api/reportsApi"; 
import { 
  TrendingUp, TrendingDown, Wallet, Users, 
  Receipt, ArrowRightLeft, Info, AlertCircle, 
  CheckCircle2, Calculator, BarChart3, CalendarDays,
  Filter
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, RadialBarChart, RadialBar 
} from 'recharts';
import Loader from "../Core_Component/Loader/Loader";
import { getProfitLossReport } from "../../api/reportApi";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ProfitLoss = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filtering States
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // 2. Fetch Data using reportsApi
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Backend se consolidated report mangwa rahe hain
      const res = await getProfitLossReport(startDate, endDate);

      if (res.data?.success) {
        setReportData(res.data.data);
      } else {
        setError("रिपोर्ट डेटा प्राप्त करने में विफल।");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("सर्वर से कनेक्ट करने में त्रुटि। कृपया बाद में प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]); // Jab bhi date badlegi, report refresh hogi

  // 3. Transform Data for Charts
  const stats = useMemo(() => {
    if (!reportData) return null;

    const { 
      totalSales = 0, 
      totalPurchases = 0, 
      totalSalaries = 0, 
      totalExpenses = 0,
      netProfit = 0,
      monthlyTrend = []
    } = reportData;

    const totalOut = totalPurchases + totalExpenses + totalSalaries;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    const expenseMix = [
      { name: 'Payroll', value: totalSalaries, fill: '#6366f1' },
      { name: 'Stock', value: totalPurchases, fill: '#f59e0b' },
      { name: 'Misc', value: totalExpenses, fill: '#ef4444' },
    ].filter(item => item.value > 0);

    return { totalSales, totalPurchases, totalSalaries, totalExpenses, totalOut, netProfit, expenseMix, monthlyTrend, profitMargin };
  }, [reportData]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* --- SMART HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
              <Calculator className="text-emerald-500" size={32} /> P&L Intelligence
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reports Engine: v3.0</span>
              <div className="w-1 h-1 bg-zinc-400 rounded-full" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={10} /> Real-time Analytics
              </span>
            </div>
          </div>
          
          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase">From</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] font-black rounded-lg p-1 dark:text-white"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase">To</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] font-black rounded-lg p-1 dark:text-white"
                />
             </div>
             <button onClick={fetchReport} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all">
                <Filter size={14} />
             </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {stats && (
          <>
            {/* --- CHARTS SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 relative">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-8">
                     <TrendingUp size={16} className="text-emerald-500"/> Growth Trajectory
                  </h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a10" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#71717a'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#71717a'}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-between relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-red-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 self-start">Margin Efficiency</h4>
                  
                  <div className="relative h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={12} data={stats.expenseMix}>
                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                       <p className="text-3xl font-black text-white">{Math.round(stats.profitMargin)}%</p>
                       <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Net Margin</p>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                     {stats.expenseMix.map(item => (
                       <div key={item.name} className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: item.fill}} />
                            <span className="text-[9px] font-black text-zinc-400 uppercase">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-white">₹{Math.round(item.value/1000)}k</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* --- KPI GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" amount={stats.totalSales} icon={<TrendingUp size={18}/>} color="emerald" />
              <StatCard title="Inventory Expense" amount={stats.totalPurchases} icon={<TrendingDown size={18}/>} color="red" />
              
              <div className={`p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between border-2 transition-transform hover:scale-[1.02] duration-500 ${stats.netProfit >= 0 ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                 <div className="flex justify-between items-center opacity-70">
                    <span className="text-[9px] font-black uppercase tracking-widest">Period Surplus</span>
                    <Wallet size={20} />
                 </div>
                 <div className="mt-4">
                    <h3 className="text-2xl font-black tracking-tighter leading-none">₹{Math.abs(stats.netProfit).toLocaleString('en-IN')}</h3>
                    <p className="text-[8px] font-black uppercase mt-1 opacity-80 tracking-widest">Net Bottom Line</p>
                 </div>
              </div>

              <StatCard title="Other Overheads" amount={stats.totalExpenses + stats.totalSalaries} icon={<BarChart3 size={18}/>} color="indigo" />
            </div>

            {/* --- TRANSACTIONAL BREAKDOWN --- */}
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="p-8 border-b dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em]">Verified Ledger Summary</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    <LedgerRow label="Gross Sales" type="Income" amount={stats.totalSales} impact="Positive" source="Invoices" />
                    <LedgerRow label="Stock Purchases" type="Direct Cost" amount={stats.totalPurchases} impact="Negative" source="Inventory" />
                    <LedgerRow label="Operating Expenses" type="Overheads" amount={stats.totalExpenses} impact="Negative" source="General Ledger" />
                    <LedgerRow label="Staff Payroll" type="Wages" amount={stats.totalSalaries} impact="Negative" source="Payroll" />
                  </tbody>
                </table>
              </div>
              
              <div className="bg-zinc-950 p-10 flex flex-col md:flex-row justify-between items-center text-white border-t border-zinc-800">
                 <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${stats.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <p className="text-xl font-black uppercase tracking-tighter">Verified Outcome</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 italic">Consolidated from all Modules</p>
                    </div>
                 </div>
                 <div className="text-right mt-6 md:mt-0">
                    <p className={`text-4xl font-black tracking-tighter ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                       ₹{stats.netProfit.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-2 flex items-center justify-end gap-2">
                       <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${stats.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                          Audit Ready
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const StatCard = ({ title, amount, icon, color }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between hover:translate-y-[-4px] transition-all group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : color === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">₹{amount.toLocaleString('en-IN')}</h3>
    </div>
  </div>
);

const LedgerRow = ({ label, type, amount, impact, source }) => (
  <tr className="group transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/10">
    <td className="px-10 py-5">
      <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{label}</p>
      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{source}</p>
    </td>
    <td className="px-10 py-5">
      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border border-zinc-200 dark:border-zinc-700 text-zinc-500">
        {type}
      </span>
    </td>
    <td className={`px-10 py-5 text-right font-black text-xs tracking-tighter ${impact === 'Positive' ? 'text-emerald-500' : 'text-red-500'}`}>
        {impact === 'Positive' ? '+' : '-'} ₹{amount.toLocaleString("en-IN")}
    </td>
    <td className="px-10 py-5 text-center">
       <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold ${impact === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {impact === 'Positive' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {impact}
       </div>
    </td>
  </tr>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md p-3 rounded-xl border border-zinc-800 shadow-2xl">
        <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-3 rounded-full" style={{backgroundColor: entry.color}} />
              <p className="text-xs font-black text-white">₹{entry.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default ProfitLoss;