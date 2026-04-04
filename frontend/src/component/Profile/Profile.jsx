import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Camera, User, Phone, Lock, LogOut, 
  ShieldCheck, RefreshCw, Save, ChevronRight
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

export default function Profile({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  
  // 🖼️ URL Formatter Helper - Fixes path issues once and for all
  const getImageUrl = (path) => {
    if (!path) return "https://i.imgur.com/6VBx3io.png";
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/'); 
    return `${API_URL}/${cleanPath}`;
  };

  const [photoURL, setPhotoURL] = useState(getImageUrl(user?.photo));
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 👤 Update Profile Details
  const updateProfile = async () => {
    if (!name.trim() || !phone.trim()) return showMsg("Name and Phone are required", "warning");
    
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/profile/update`, {
        employeeId: user.employeeId, 
        name, 
        phone,
      });
      
      if (res.data.success) {
        const updatedData = res.data.data;
        localStorage.setItem("user", JSON.stringify(updatedData));
        setUser(updatedData);
        setLoading(false); 
        setTimeout(() => showMsg("✅ प्रोफाइल सफलतापूर्वक अपडेट हो गई", "success"), 100);
      }
    } catch (err) {
      setLoading(false);
      showMsg(err.response?.data?.message || "❌ प्रोफाइल अपडेट विफल", "error");
    }
  };

  // 🔐 Change Password
  const changePassword = async () => {
    if (newPassword.length < 4) return showMsg("Password minimum 4 digits long hona chahiye", "warning");
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/profile/change-password`, {
        employeeId: user.employeeId, 
        password: newPassword,
      });
      
      if (res.data.success) {
        setLoading(false);
        setNewPassword("");
        setTimeout(() => showMsg("🔐 पासवर्ड सफलतापूर्वक बदल दिया गया है", "success"), 100);
      }
    } catch (err) {
      setLoading(false);
      showMsg(err.response?.data?.message || "❌ पासवर्ड अपडेट विफल", "error");
    }
  };

  // 🖼️ Handle Image Upload
// 🖼️ Handle Image Upload
const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validation
  if (file.size > 2 * 1024 * 1024) {
    return showMsg("File size too large (Max 2MB)", "warning");
  }

  const formData = new FormData();
  
  // 🔴 FIX: Yahan "image" ki jagah "photo" hona chahiye 
  // kyunki backend upload.single("photo") ka intezar kar raha hai
  formData.append("photo", file); 
  formData.append("employeeId", user.employeeId);

  try {
    setLoading(true);
    const res = await axios.post(
      `${API_URL}/api/profile/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    if (res.data.success) {
      const newPhotoPath = res.data.photo; // Cloudinary URL milega
      const updatedUser = { ...user, photo: newPhotoPath };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoURL(newPhotoPath); // Direct Cloudinary URL set karein

      showMsg("✅ Profile photo updated successfully");
    }
  } catch (err) {
    console.error("Upload Error Details:", err.response?.data);
    showMsg(err.response?.data?.message || "Upload failed", "error");
  } finally {
    setLoading(false);
    e.target.value = null; // Taaki same file dobara select ho sake
  }
};
  // 🚪 Logout logic cleaned up
  const logout = async () => {
    try {
      setLoading(true);
      // Backend ko notify karein (Optional)
      await axios.post(`${API_URL}/api/profile/logout`, { employeeId: user.employeeId });
    } catch (err) {
      console.warn("Logout notification failed, clearing local data anyway.");
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      navigate("/login", { replace: true });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] p-4 md:p-12 font-sans transition-colors duration-500">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: Profile Card --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all duration-500 shadow-2xl">
                <img src={photoURL} alt="profile" className="w-full h-full object-cover" />
              </div>
              <label className="absolute -bottom-2 -right-2 p-2.5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-xl cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <Camera size={18} />
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            
            <h2 className="mt-6 text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{user?.name}</h2>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">ID: {user?.employeeId}</p>
            
            <div className="mt-6 w-full pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-left p-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl">
                <div>
                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Role Access</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{user?.role || "Staff"}</p>
                </div>
                <ShieldCheck className="text-emerald-500" size={20} />
              </div>
            </div>
          </div>

          <button onClick={logout} className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800 hover:bg-rose-500 hover:text-white transition-all group shadow-sm">
            <span className="flex items-center gap-3"><LogOut size={16}/> Logout Session</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>

        {/* --- RIGHT COLUMN: Settings --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><User size={16}/></span>
              Personal Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="label-style">Full Name</label>
                  <div className="relative group">
                    <User className="input-icon" size={18} />
                    <input value={name} onChange={(e) => setName(e.target.value)} className="form-input-zinc" placeholder="Your Name" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="label-style">Contact Number</label>
                  <div className="relative group">
                    <Phone className="input-icon" size={18} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input-zinc" placeholder="Phone" />
                  </div>
               </div>
            </div>

            <button onClick={updateProfile} className="mt-8 w-full md:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Save size={16}/> Save Changes
            </button>

            <div className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-zinc-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-white"><Lock size={16}/></span>
                Security Settings
              </h3>
              
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <label className="label-style">New Security Password</label>
                  <div className="relative group">
                    <Lock className="input-icon" size={18} />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input-zinc" placeholder="••••••••" />
                  </div>
                </div>
                
                <button onClick={changePassword} disabled={!newPassword} className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-30 transition-all hover:bg-black">
                  <RefreshCw size={16}/> Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />

      <style>{`
        .label-style { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-left: 4px; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #d4d4d8; transition: color 0.3s; }
        .form-input-zinc { width: 100%; background: #fdfdfd; border: 1px solid #e4e4e7; border-radius: 1.25rem; padding: 1rem 1rem 1rem 3rem; font-size: 0.875rem; outline: none; font-weight: 700; color: #18181b; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; background: white; }
        .dark .form-input-zinc:focus { background: #09090b; border-color: #10b981; }
      `}</style>
    </div>
  );
}