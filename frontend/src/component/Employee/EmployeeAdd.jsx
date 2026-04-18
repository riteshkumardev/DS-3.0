import React, { useState, useEffect } from "react";
import {
  User, Phone, CreditCard, Landmark, Banknote,
  CalendarDays, Briefcase, MapPin, Lock, Camera, Rocket, X
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import { addStaff } from "../../api/staffApi";

const EmployeeAdd = ({ onEntrySaved }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const initialState = {
    name: "",
    fatherName: "",
    phone: "",
    emergencyPhone: "",
    aadhar: "",
    address: "",
    designation: "WORKER", 
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    photo: null,
    password: "" // 🔑 Added explicitly in state
  };

  const [formData, setFormData] = useState(initialState);

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Input Length Constraints
    if ((name === "phone" || name === "emergencyPhone") && value.length > 10) return;
    if (name === "aadhar" && value.length > 12) return;
    
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showMsg("Only image files allowed", "error");
    if (file.size > 2 * 1024 * 1024) return showMsg("Image must be less than 2MB", "error");

    setFormData({ ...formData, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 STRICT VALIDATIONS
    if (formData.phone.length !== 10) return showMsg("Mobile number must be 10 digits", "error");
    if (formData.aadhar.length !== 12) return showMsg("Aadhaar must be 12 digits", "error");
    if (!formData.password || formData.password.length < 4) {
       return showMsg("Password (Access PIN) is mandatory and must be 4+ digits", "error");
    }

    setLoading(true);

    try {
      // 📦 BUILDING MULTIPART DATA (For Photo Support)
      const data = new FormData();
      
      // ✅ Essential Backend Schema Mapping
      data.append("name", formData.name);
      data.append("password", formData.password); // 🔥 Ensure this key matches Backend Model
      data.append("role", formData.designation.toUpperCase());
      data.append("phone", formData.phone);
      data.append("aadhar", formData.aadhar);
      data.append("salary", formData.salary);
      data.append("joiningDate", formData.joiningDate);
      
      // Secondary Fields
      data.append("fatherName", formData.fatherName || "");
      data.append("emergencyPhone", formData.emergencyPhone || "");
      data.append("address", formData.address || "");
      data.append("bankName", formData.bankName || "");
      data.append("accountNo", formData.accountNo || "");
      data.append("ifscCode", formData.ifscCode || "");

      if (formData.photo) {
        data.append("photo", formData.photo); // Using 'photo' as standard key
      }

      // API Call using imported staffApi
      const response = await addStaff(data);

      if (response.data.success) {
        const empId = response.data?.data?.employeeId || "NEW";
        showMsg(`✅ Staff Registered Successfully! ID: ${empId}`, "success");
        
        // Full Reset
        setFormData(initialState);
        setPreview(null);
        if (onEntrySaved) onEntrySaved();
      }
    } catch (error) {
      console.error("Staff Save Error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Registration failed. Path `password` error.";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- HEADER COMMAND --- */}
        <div className="bg-emerald-600 p-10 flex flex-col md:flex-row justify-between items-center text-white gap-6">
          <div className="flex items-center gap-6">
            {preview ? (
               <img src={preview} className="w-20 h-20 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" alt="P" />
            ) : (
               <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md shadow-inner"><Rocket size={40} /></div>
            )}
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Recruit Force</h2>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Staff Master Deployment</p>
            </div>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest">
             {formData.designation} PROFILE
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-14">
          
          {/* Section 1: Identification */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
               <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <User size={18} className="text-emerald-500" /> Primary Identity
               </h3>
               <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="form-label">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input-zinc font-bold" placeholder="RAHUL MISHRA" />
              </div>
              
              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5"><CreditCard size={14} className="text-emerald-500"/> Aadhaar Number *</label>
                <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required className="form-input-zinc font-black tracking-[0.2em]" placeholder="XXXX XXXX XXXX" />
              </div>

              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5"><Camera size={14} className="text-emerald-500"/> Profile Image</label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  <div className={`form-input-zinc flex items-center justify-between transition-all ${formData.photo ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                    <span className="text-zinc-500 text-xs truncate font-bold">
                      {formData.photo ? formData.photo.name : "Attach Photo (Max 2MB)"}
                    </span>
                    {formData.photo ? <X size={16} className="text-rose-500 cursor-pointer z-30" onClick={(e) => { e.preventDefault(); setFormData({...formData, photo: null}); setPreview(null); }}/> : <Camera size={16} className="text-zinc-400" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Pay */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
               <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <Briefcase size={18} className="text-emerald-500" /> Operational Config
               </h3>
               <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="form-label">Designation</label>
                <select name="designation" value={formData.designation} onChange={handleChange} className="form-input-zinc font-bold cursor-pointer appearance-none">
                  <option value="MANAGER">MANAGER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="LOADER">LOADER</option>
                  <option value="WORKER">WORKER</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5"><Lock size={14} className="text-amber-500"/> Access PIN *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="form-input-zinc border-amber-200 dark:border-amber-900/50 focus:border-amber-500 font-black text-center text-lg" placeholder="0000" />
              </div>

              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5"><Banknote size={14} className="text-emerald-500"/> Fixed Salary *</label>
                <input type="number" name="salary" value={formData.salary} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-xl" placeholder="₹ 0.00" />
              </div>

              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5"><CalendarDays size={14}/> Effective Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="form-input-zinc font-bold" />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Bank */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-1 space-y-6 bg-zinc-50 dark:bg-zinc-800/40 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-3">Contact Nodes</h4>
                <div className="space-y-4">
                  <input type="number" name="phone" value={formData.phone} onChange={handleChange} required className="form-input-zinc" placeholder="Primary Mobile" />
                  <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="form-input-zinc" placeholder="Emergency Mobile" />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input-zinc" placeholder="Current Address" />
                </div>
             </div>

             <div className="lg:col-span-2 space-y-6 bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-500/10 pb-3">Financial Settlement (Bank)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="form-input-zinc" placeholder="BANK NAME (SBI/HDFC)" />
                   <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="form-input-zinc uppercase" placeholder="IFSC CODE" />
                   <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} className="form-input-zinc md:col-span-2 font-black tracking-widest" placeholder="ACCOUNT NUMBER" />
                </div>
             </div>
          </div>

          <div className="flex justify-center pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="group relative flex items-center gap-4 px-24 py-6 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : <><Rocket size={20} className="group-hover:animate-bounce" /> Dispatch Staff Data</>}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />

      <style>{`
        .form-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.5rem; display: block; margin-bottom: 4px; letter-spacing: 0.05em; }
        .form-input-zinc { width: 100%; background: #f8fafc; border: 2px solid transparent; border-radius: 1.5rem; padding: 1.1rem 1.5rem; font-size: 0.9rem; outline: none; transition: all 0.3s ease; color: #1e293b; }
        .dark .form-input-zinc { background: #18181b; color: white; border-color: #27272a; }
        .form-input-zinc:focus { border-color: #10b981; background: white; box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.2); }
        .dark .form-input-zinc:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default EmployeeAdd;