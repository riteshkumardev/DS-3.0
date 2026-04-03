import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, User as UserIcon, Lock, 
  RefreshCcw, LogIn, Hash 
} from "lucide-react";
import Loader from "./Core_Component/Loader/Loader";
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar";

const generateSessionId = () =>
  "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔢 Captcha State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");

  // 🔔 Notification State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "error") =>
    setSnackbar({ open: true, message: msg, severity: type });

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, total: n1 + n2 });
    setUserCaptcha("");
  };

  useEffect(() => {
    refreshCaptcha();
    const savedUser = localStorage.getItem("user");
    if (savedUser) navigate("/", { replace: true });
  }, [navigate]);

  // ✅ SMART VALIDATION: Handles DS-XXXX format
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Captcha Validation
    if (parseInt(userCaptcha) !== captcha.total) {
      showMsg("❌ Invalid Captcha. Try again.");
      refreshCaptcha();
      return;
    }

    // 2. Employee ID Validation (DS-XXXX format support)
    const rawId = employeeId.trim().toUpperCase();
    
    // Regex allows "DS-1234" or just "1234" (will auto-fix to DS-1234)
    const idPattern = /^(DS-)?\d{4,7}$/; 
    
    if (!idPattern.test(rawId)) {
      showMsg("Please enter a valid Employee ID (e.g., DS-1553)", "warning");
      return;
    }

    // Final ID ensure kar rha hai ki "DS-" prefixed ho
    const finalId = rawId.startsWith("DS-") ? rawId : `DS-${rawId}`;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: finalId, // Sending DS-XXXX
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg(data.message || "Login failed", "error");
        refreshCaptcha();
        setLoading(false);
        return;
      }

      const sessionId = generateSessionId();
      const finalUser = { ...data.data, currentSessionId: sessionId };

      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      setTimeout(() => {
        setLoading(false);
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      showMsg("Server error. Please check your connection.");
      refreshCaptcha();
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/30">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Dharashakti Agro</h2>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 opacity-80">Secure Employee Access</p>
        </div>

        {/* --- FORM SECTION --- */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <UserIcon size={12}/> Employee Identity (DS-XXXX)
            </label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
                placeholder="DS-1553"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <Lock size={12}/> Security Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* --- CAPTCHA --- */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-700 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bot Verification</label>
              <button type="button" onClick={refreshCaptcha} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all text-zinc-400">
                <RefreshCcw size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-lg font-black text-zinc-800 dark:text-zinc-200 tracking-widest shadow-sm">
                {captcha.num1} + {captcha.num2}
              </div>
              <div className="text-zinc-400 font-bold">=</div>
              <input
                type="number"
                placeholder="Sum"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
                className="w-24 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-lg font-black text-emerald-600 outline-none focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <LogIn size={18} /> Login Now
          </button>
        </form>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/20 text-center border-t dark:border-zinc-800">
           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
             Protected by Dhara Shakti Agro Internal Security
           </p>
        </div>
      </div>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
}

export default Login;