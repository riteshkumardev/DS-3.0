import React, { useState, useEffect } from "react";
import { MemoryRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import Navbar from "./component/Navhtml"; 
import Login from "./component/Login";
import Home from "./component/Home";
import LandingPage from "./component/LandingPage"; 
import SalesManager from "./component/Sales/SalesManager";
import PurchaseManager from "./component/Purchase/PurchaseManager";
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
import StaffManagementDashboard from "./component/Employee/StaffManagementDashboard";
import { useParams } from "react-router-dom";
import FollowUpDashboard from "./component/Supplier/FollowUp/FollowUpDashboard";

function App() {
  // ✅ 1. Dark Mode State Management
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true";
  });

  // ✅ 2. Session Management (Using 'userInfo' key for consistency)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("userInfo");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLocked, setIsLocked] = useState(false);

  // ✅ Dark Mode Effect Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // 🔒 AUTO-LOCK TIMER (5 min inactivity)
  useEffect(() => {
    if (!user) return;
    
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 300,000ms = 5 Minutes
      timeoutId = setTimeout(() => setIsLocked(true), 300000); 
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Start timer

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  // 🚪 Standard Logout Logic
  const logoutUser = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("user"); // Clear legacy keys
    setUser(null);
  };

  // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
  const ProtectedRoute = ({ children, adminOnly = false, managerAllowed = false }) => {
    if (!user) return <Navigate to="/login" replace />;
    
    // Normalize role string to uppercase for comparison
    const userRole = user.role?.toUpperCase();
    const isAdmin = userRole === "ADMIN";
    const isManager = userRole === "MANAGER";
    const isBoss = isAdmin || isManager;
    
    if (adminOnly && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    
    if (managerAllowed && !isBoss) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };
  const { id } = useParams();

  return (
    <Router>
      <div className={`app-container min-h-screen transition-all duration-500 
        ${darkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#f8fafc] text-zinc-900'}`}
        style={{
          backgroundImage: darkMode 
            ? `radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%),
               radial-gradient(at 100% 100%, rgba(77, 71, 243, 0.05) 0px, transparent 50%)`
            : `radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.03) 0px, transparent 50%),
               radial-gradient(at 100% 0%, rgba(77, 71, 243, 0.03) 0px, transparent 50%)`
        }}>
        
        {/* Screen Lock Overlay */}
        {isLocked && user && <ScreenLock user={user} setIsLocked={setIsLocked} />}

        {/* Global Navigation */}
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
            {/* 🌍 PUBLIC ROUTES */}
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />

            {/* 📊 STAFF LEVEL (Basic Access) */}
            <Route path="/dashboard" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
         // 🎯 Enforce parameters mapping to support specific target employee directory paths
<Route path="/staff-ledger/:id" element={<ProtectedRoute><EmployeeLedger user={user} /></ProtectedRoute>} />
            <Route path="/invoice" element={<ProtectedRoute><InvoicePage user={user} /></ProtectedRoute>} />

            {/* 💼 MANAGEMENT LEVEL (Manager & Admin Only) */}
            <Route path="/profit-loss" element={<ProtectedRoute managerAllowed><ProfitLoss /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute managerAllowed><ExpenseManager user={user} /></ProtectedRoute>} />
      
            <Route path="/sales-table" element={<ProtectedRoute managerAllowed><SalesManager user={user} /></ProtectedRoute>} />

            <Route path="/purchase-table" element={<ProtectedRoute managerAllowed><PurchaseManager user={user} /></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute managerAllowed><StockManagement user={user} /></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute managerAllowed><StockAddForm user={user} /></ProtectedRoute>} />
            {/* <Route path="/employee-table" element={<ProtectedRoute managerAllowed><EmployeeTable user={user} /></ProtectedRoute>} /> */}
            <Route path="/Reports_Printing" element={<ProtectedRoute managerAllowed><ReportsPrinting user={user}/></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute managerAllowed><SupplierManager user={user}/></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute managerAllowed><Attendance user={user} /></ProtectedRoute>} />

            {/* 🛡️ SYSTEM ADMIN LEVEL (Strict Security) */}
            <Route path="/master-panel" element={<ProtectedRoute adminOnly><MasterPanel user={user} /></ProtectedRoute>} />
            <Route path="/audit-trail" element={<ProtectedRoute adminOnly><AuditPage /></ProtectedRoute>} />
            <Route path="/employee-management" element={<ProtectedRoute adminOnly><StaffManagementDashboard user={user} /></ProtectedRoute>} />
            <Route path="/add-transaction" element={<ProtectedRoute adminOnly><AddTransaction user={user}/></ProtectedRoute>} />
            <Route path="/transaction-history" element={<ProtectedRoute adminOnly><TransactionHistory user={user}/></ProtectedRoute>} />
            <Route path="/analysis-page" element={<ProtectedRoute adminOnly><AnalysisPage  user={user} /></ProtectedRoute>} />
            <Route path="/service" element={<ProtectedRoute adminOnly><Service/></ProtectedRoute>} />
            <Route path="/createFollowUp" element={<ProtectedRoute adminOnly><FollowUpDashboard/></ProtectedRoute>} />

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;