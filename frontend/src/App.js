import React, { useState, useEffect } from "react";
import { MemoryRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import Navbar from "./component/Navhtml"; 
import Login from "./component/Login";
import Home from "./component/Home";
import LandingPage from "./component/LandingPage"; 
import SalesEntry from "./component/Sales/SalesEntry";
import SalesTable from "./component/Sales/SalesTable";
import PurchaseTable from "./component/Purchase/PurchaseTable";
import PurchaseForm from "./component/Purchase/PurchaseForm";
import EmployeeTable from "./component/Employee/EmployeeTable";
import EmployeeAdd from "./component/Employee/EmployeeAdd";
import EmployeeLedger from "./component/Employee/EmployeeLedger/EmployeeLedger";
import StockManagement from "./component/Stocks/StockManagement";
import StockAddForm from "./component/Stocks/StockAddForm";
import Attendance from "./component/Employee/Attendance/Attendance";
import ExpenseManager from "./component/Employee/ExpenseManager/ExpenseManager";
import MasterPanel from "./component/MasterPanel/MasterPanel";
import ProfitLoss from "./component/ProfitLoss/ProfitLoss";
import Profile from "./component/Profile/Profile";
import ScreenLock from "./component/Core_Component/ScreenLock/ScreenLocl";
import ReportsPrinting from "./component/Reports_Printing/Reports_Printing"; 

import InvoicePage from "./component/Invoice/InvoicePage";
import SupplierManager from "./component/Supplier/SupplierManager";
import AddTransaction from "./component/AddTransaction/AddTransaction";
import TransactionHistory from "./component/AddTransaction/TransactionHistory";
import AuditPage from "./component/MasterPanel/AuditPage";
import AnalysisPage from "./component/ProfitLoss/AnalysisPage";
import Service from "./component/Service";


function App() {
  // ✅ 1. Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true";
  });

  // ✅ SAFE localStorage read
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isLocked, setIsLocked] = useState(false);

  // ✅ 2. Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // 🔒 AUTO-LOCK TIMER (5 min)
  useEffect(() => {
    if (!user) return;
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsLocked(true), 300000); 
    };
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const logoutUser = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // 🛡️ PROTECTED ROUTE LOGIC
  const ProtectedRoute = ({ children, adminOnly = false, managerAllowed = false }) => {
    if (!user) return <Navigate to="/login" replace />;
    const isBoss = user.role === "Admin" || user.role === "Manager";
    
    if (adminOnly && user.role !== "Admin") {
      alert("⚠️ Restricted: Admin Access Only.");
      return <Navigate to="/dashboard" replace />;
    }
    if (managerAllowed && !isBoss) {
      alert("⚠️ Restricted: Management Access Only.");
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className={`app-container min-h-screen transition-all duration-500 
        ${darkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#f0f2f5] text-zinc-900'}`}
        style={{
          backgroundImage: darkMode 
            ? `radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%),
               radial-gradient(at 100% 100%, rgba(77, 71, 243, 0.05) 0px, transparent 50%)`
            : `radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.03) 0px, transparent 50%),
               radial-gradient(at 100% 0%, rgba(77, 71, 243, 0.03) 0px, transparent 50%)`
        }}>
        
        {isLocked && user && <ScreenLock user={user} setIsLocked={setIsLocked} />}

        {user && (
          <Navbar 
            user={user} 
            setUser={setUser} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            logoutUser={logoutUser}
          />
        )}

        <div className="page-content relative z-10">
          <Routes>
            {/* 🌍 PUBLIC */}
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />

            {/* 📊 BASIC DASHBOARD (All Staff) */}
            <Route path="/dashboard" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger user={user} /></ProtectedRoute>} />
            <Route path="/invoice" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />

            {/* 💼 MANAGEMENT (Manager & Admin) */}
            <Route path="/profit-loss" element={<ProtectedRoute managerAllowed><ProfitLoss /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute managerAllowed><ExpenseManager user={user} /></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute managerAllowed><SalesEntry user={user} /></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute managerAllowed><SalesTable user={user} /></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute managerAllowed><PurchaseForm user={user} /></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute managerAllowed><PurchaseTable user={user} /></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute managerAllowed><StockManagement user={user} /></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute managerAllowed><StockAddForm user={user} /></ProtectedRoute>} />
            <Route path="/employee-table" element={<ProtectedRoute managerAllowed><EmployeeTable user={user} /></ProtectedRoute>} />
            <Route path="/Reports_Printing" element={<ProtectedRoute managerAllowed><ReportsPrinting/></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute managerAllowed><SupplierManager /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute managerAllowed><Attendance /></ProtectedRoute>} />

            {/* 🛡️ ADMIN ONLY (Secure Operations) */}
            <Route path="/master-panel" element={<ProtectedRoute adminOnly><MasterPanel user={user} /></ProtectedRoute>} />
            <Route path="/audit-trail" element={<ProtectedRoute adminOnly><AuditPage /></ProtectedRoute>} /> {/* ✅ Naya Audit Route */}
            <Route path="/employee-add" element={<ProtectedRoute adminOnly><EmployeeAdd user={user} /></ProtectedRoute>} />
            <Route path="/add-transaction" element={<ProtectedRoute adminOnly><AddTransaction /></ProtectedRoute>} />
            <Route path="/transaction-history" element={<ProtectedRoute adminOnly><TransactionHistory/></ProtectedRoute>} />
            <Route path="/analysis-page" element={<ProtectedRoute adminOnly><AnalysisPage /></ProtectedRoute>} />
            <Route path="/service" element={<ProtectedRoute adminOnly><Service/></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;