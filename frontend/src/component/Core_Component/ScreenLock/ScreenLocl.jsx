import React, { useState } from "react";
import { Lock, Unlock, Key, AlertCircle, ShieldCheck } from "lucide-react";

const ScreenLock = ({ user, setIsLocked }) => {
  const [passInput, setPassInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live Backend URL dynamic logic
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employeeId,
          password: passInput,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsLocked(false);
        setError(false);
      } else {
        setError(true);
        setPassInput("");
      }
    } catch (err) {
      console.error("Unlock error:", err);
      alert("❌ Server connection error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl font-sans">
      <div className={`w-full max-w-md mx-4 p-8 bg-white/10 dark:bg-zinc-900/50 border border-white/20 dark:border-zinc-800 rounded-[3rem] shadow-2xl text-center space-y-6 transition-all ${error ? 'animate-shake' : ''}`}>
        
        {/* User Identity Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-emerald-500/20 shadow-2xl">
              <img 
                src={user.photo || "https://i.imgur.com/6VBx3io.png"} 
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" 
                alt="User"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-zinc-900">
               <ShieldCheck size={16} />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Session Locked</h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Hi {user.name}, verify your identity</p>
          </div>
        </div>

        {/* Input Field Area */}
        <div className="space-y-4">
          <div className="relative group">
            <Key className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-500' : 'text-emerald-500/50 group-focus-within:text-emerald-500'}`} size={18} />
            <input
              type="password"
              placeholder="Enter your security PIN"
              value={passInput}
              onChange={(e) => {setPassInput(e.target.value); setError(false);}}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              className={`w-full pl-12 pr-4 py-4 bg-white/5 border-2 rounded-2xl text-sm font-black tracking-[0.5em] text-white outline-none transition-all placeholder:tracking-normal placeholder:text-zinc-600 ${error ? 'border-rose-500/50 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'}`}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Incorrect Security PIN</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl ${loading ? 'bg-zinc-800 text-emerald-500' : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'}`}
          onClick={handleUnlock}
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><Unlock size={18} /> Unlock Session</>
          )}
        </button>

        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
           Protected by Dhara Shakti Agro Security Layer
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default ScreenLock;