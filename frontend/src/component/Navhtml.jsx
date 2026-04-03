import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Sun, Moon, LayoutDashboard, Leaf } from "lucide-react"; 
import dharasakti from "./dharasakti.png"; 
import DashboardSidebar from "./Dashboard/DashboardSidebar";

export default function Navbar({ user, setUser, darkMode, setDarkMode }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();


  const getProfileImage = () => {
    if (user && user.photo) return user.photo;
    return "https://i.imgur.com/6VBx3io.png";
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Left Section: Logo & Sidebar Trigger */}
          <div className="flex items-center gap-6">
            {user ? (
              <button
                onClick={() => setShowSidebar(true)}
                className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline font-bold text-sm tracking-wide">Menu</span>
              </button>
            ) : (
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate("/")}
              >
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Leaf size={24} className="text-emerald-600" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tighter">
                  Dharashakti
                </span>
              </div>
            )}
          </div>

          {/* Middle Section: Nav Links */}
          <ul className="hidden lg:flex items-center gap-12">
            <li>
              <Link to="/" className="text-xs font-black text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">
                Home
              </Link>
            </li>
            <li>
              <Link to="/service" className="text-xs font-black text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">
                Services
              </Link>
            </li>
          </ul>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div
                className="flex items-center gap-3 pl-5 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer group"
                onClick={() => navigate("/profile")}
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-emerald-600 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {user.role}
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={user.photo} 
                    alt="profile"
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-800 group-hover:ring-emerald-500 transition-all"
                    onError={(e) => { e.target.src = "https://i.imgur.com/6VBx3io.png"; }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-zinc-950 rounded-full"></div>
                </div>
              </div>
            ) : (
              <button 
                className="px-7 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-bold text-sm shadow-xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-zinc-950/40 backdrop-blur-md transition-all duration-500 ${showSidebar ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setShowSidebar(false)}
      >
        <aside 
          className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                 <Leaf size={20} />
               </div>
               <h3 className="text-xl font-black tracking-tighter dark:text-white">Dharashakti</h3>
            </div>
            <button 
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-red-500 transition-colors"
              onClick={() => setShowSidebar(false)}
            >
              <X size={22} />
            </button>
          </div>
          
          <div className="px-4 py-2 h-[calc(100%-120px)] overflow-y-auto">
             <DashboardSidebar closeSidebar={() => setShowSidebar(false)} user={user} />
          </div>
        </aside>
      </div>
    </>
  );
}