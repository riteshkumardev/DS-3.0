import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, User as UserIcon, Lock, 
  RefreshCcw, LogIn, Hash, UserPlus, Mail, Briefcase
} from "lucide-react";

// API Imports
import { login as loginUser, register as registerUser } from "../api/authApi"; 

import Loader from "./Core_Component/Loader/Loader";
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar";

function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState(""); // For Registration
  const [employeeId, setEmployeeId] = useState(""); // For Login
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");

  // Security States
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const navigate = useNavigate();

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
    const savedUser = localStorage.getItem("userInfo");
    if (savedUser) navigate("/", { replace: true });
  }, [navigate]);
const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseInt(userCaptcha) !== captcha.total) {
      showMsg("❌ Invalid Captcha. Try again.");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const rawId = employeeId.trim().toUpperCase();
        const finalId = rawId.startsWith("DS-") ? rawId : `DS-${rawId}`;
        
        const response = await loginUser({ email: finalId, password });
        
        // Axios response handling: response.data is the actual JSON from backend
        const userData = response.data.data; 
        
        const finalUser = { ...userData, loginTime: new Date().toISOString() };
        localStorage.setItem("userInfo", JSON.stringify(finalUser));
        setUser(finalUser);
        
        showMsg("✅ Welcome back to Dharashakti!", "success");
        setTimeout(() => navigate("/", { replace: true }), 800);

      } else {
        // --- REGISTER LOGIC ---
        if (name.length < 3) throw new Error("Name is too short");
        
        const response = await registerUser({ name, email, password, role });
        
        // 🚨 FIX: Extracting the ID from the correct nested path
        // Your backend returns { success: true, data: { generatedId: "DS-XXXX", ... } }
        const newEmployeeId = response.data?.data?.generatedId;

        if (newEmployeeId) {
          showMsg(`🎉 Account Created! Your Login ID is: ${newEmployeeId}`, "success");
          
          // Switch to Login Mode & Prefill the new ID
          setIsLogin(true);
          setEmployeeId(newEmployeeId);
          setPassword(""); 
          refreshCaptcha();
        } else {
          showMsg("Account created, but ID generation failed. Contact Admin.", "warning");
        }
      }
    } catch (err) {
      console.error("Auth Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Server Error";
      showMsg(errMsg, "error");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-500">
        
        {/* --- HEADER --- */}
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/30">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Dharashakti Agro</h2>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 opacity-80">
            {isLogin ? "Employee ID Login" : "Register New Account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          
          {/* 1. Name Field (Register Only) */}
          {!isLogin && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  placeholder="Rahul Kumar"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* 2. Identity Field (Email for Register / ID for Login) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              {isLogin ? "Employee ID (DS-XXXX)" : "Corporate Email"}
            </label>
            <div className="relative">
              {isLogin ? <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />}
              <input
                type={isLogin ? "text" : "email"}
                value={isLogin ? employeeId : email}
                onChange={(e) => isLogin ? setEmployeeId(e.target.value) : setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder={isLogin ? "DS-1001" : "rahul@dharashakti.com"}
                required
              />
            </div>
          </div>

          {/* 3. Role Select (Register Only) */}
          {!isLogin && (
            <div className="space-y-1 animate-in fade-in duration-300">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Initial Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="STAFF">Staff / Worker</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            </div>
          )}

          {/* 4. Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* 5. Captcha */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border dark:border-zinc-700 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase">
              <span>Human Verification</span>
              <RefreshCcw size={14} className="cursor-pointer hover:text-emerald-500" onClick={refreshCaptcha} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl text-center text-lg font-black tracking-widest">
                {captcha.num1} + {captcha.num2}
              </div>
              <div className="text-zinc-400 font-bold">=</div>
              <input
                type="number"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
                className="w-20 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl text-center text-lg font-black text-emerald-600 outline-none focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 active:scale-95 transition-all mt-4"
          >
            {isLogin ? <><LogIn size={18} /> Login Now</> : <><UserPlus size={18} /> Register & Generate ID</>}
          </button>
        </form>

        {/* --- TOGGLE --- */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/20 text-center border-t dark:border-zinc-800">
          <button 
            onClick={() => { setIsLogin(!isLogin); refreshCaptcha(); }}
            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
          >
            {isLogin ? "Need an account? Register Here" : "Back to Employee Login"}
          </button>
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

export default Auth;