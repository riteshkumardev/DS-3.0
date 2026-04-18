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
    password: "" 
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
    if ((name === "phone" || name === "emergencyPhone") && value.length > 10) return;
    if (name === "aadhar" && value.length > 12) return;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData({ ...formData, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 VALIDATIONS
    if (formData.phone.length !== 10) return showMsg("Mobile number must be 10 digits", "error");
    if (!formData.password || formData.password.length < 4) {
       return showMsg("Password (Access PIN) is required (min 4 digits)", "error");
    }

    setLoading(true);

    try {
      // 📦 BUILDING NESTED MULTIPART DATA
      const data = new FormData();
      
      // 1. Root Level Fields
      data.append("name", formData.name.toUpperCase());
      data.append("password", formData.password); 
      data.append("role", formData.designation.toUpperCase());
      data.append("phone", formData.phone);
      data.append("fatherName", formData.fatherName.toUpperCase());
      data.append("emergencyPhone", formData.emergencyPhone);
      data.append("address", formData.address);
      data.append("joiningDate", formData.joiningDate);
      
      // 2. Base Salary (Backend key is baseSalary)
      data.append("baseSalary", Number(formData.salary));

      // 3. Nested KYC Details (Mapping to Schema)
      // Note: Aadhaar redacted as per privacy guidelines in output, but handled by logic.
      data.append("kycDetails[aadharNumber]", formData.aadhar);

      // 4. Nested Bank Details (Mapping to Schema)
      data.append("bankDetails[accountNumber]", formData.accountNo);
      data.append("bankDetails[ifscCode]", formData.ifscCode.toUpperCase());
      data.append("bankDetails[bankName]", formData.bankName.toUpperCase());

      // 5. Image/Photo
      if (formData.photo) {
        data.append("image", formData.photo); 
      }

      const response = await addStaff(data);

      if (response.data.success) {
        showMsg(`✅ Staff Registered! ID: ${response.data.data.employeeId}`, "success");
        setFormData(initialState);
        setPreview(null);
        if (onEntrySaved) onEntrySaved();
      }
    } catch (error) {
      console.error("Staff Save Error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "ValidationError: Check password or required fields.";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        <div className="bg-emerald-600 p-10 flex flex-col md:flex-row justify-between items-center text-white gap-6">
          <div className="flex items-center gap-6">
            {preview ? (
               <img src={preview} className="w-20 h-20 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" alt="Preview" />
            ) : (
               <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md"><Rocket size={40} /></div>
            )}
            <div>
              <h2 className="text-3xl font-black uppercase italic leading-none">Enrollment</h2>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-70">Staff Master Deployment</p>
            </div>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest">
             {formData.designation} ACCESS
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-12">
          
          <div className="space-y-8">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-4">
              <User size={18} className="text-emerald-500" /> Identity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="form-label">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input-zinc font-bold" placeholder="NAME" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Aadhaar (12 Digits) *</label>
                <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required className="form-input-zinc font-black tracking-widest" placeholder="0000 0000 0000" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="form-input-zinc" placeholder="GUARDIAN" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-4">
              <Briefcase size={18} className="text-emerald-500" /> Employment Config
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="form-label">Role</label>
                <select name="designation" value={formData.designation} onChange={handleChange} className="form-input-zinc font-bold appearance-none cursor-pointer">
                  {['MANAGER', 'ACCOUNTANT', 'OPERATOR', 'DRIVER', 'LOADER', 'SALES_MAN', 'WORKER'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="form-label text-amber-600 flex items-center gap-1.5"><Lock size={12}/> Login Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="form-input-zinc border-amber-200 dark:border-amber-900/50 font-black text-lg" placeholder="REQUIRED" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Base Salary *</label>
                <input type="number" name="salary" value={formData.salary} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-xl" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Joining Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="form-input-zinc font-bold" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-1 space-y-6 bg-zinc-50 dark:bg-zinc-800/40 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Phone size={14}/> Contacts</h4>
                <div className="space-y-4">
                  <input type="number" name="phone" value={formData.phone} onChange={handleChange} required className="form-input-zinc" placeholder="PRIMARY MOBILE" />
                  <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="form-input-zinc" placeholder="EMERGENCY" />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input-zinc" placeholder="FULL ADDRESS" />
                </div>
             </div>

             <div className="lg:col-span-2 space-y-6 bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-500/10 pb-3 flex items-center gap-2"><Landmark size={14}/> Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="form-input-zinc" placeholder="BANK NAME" />
                   <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="form-input-zinc uppercase" placeholder="IFSC CODE" />
                   <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} className="form-input-zinc md:col-span-2 font-black tracking-widest" placeholder="ACCOUNT NUMBER" />
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-8">
            <div className="space-y-4">
              <label className="form-label flex items-center justify-center gap-2"><Camera size={14} className="text-emerald-500"/> Profile Photo</label>
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="px-10 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500 transition-all">
                  {formData.photo ? formData.photo.name : "Select Image File"}
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-12 group relative flex items-center gap-4 px-24 py-6 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : <><Rocket size={20} className="group-hover:animate-bounce" /> Dispatch Staff Data</>}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .form-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.5rem; display: block; margin-bottom: 4px; }
        .form-input-zinc { width: 100%; background: #f8fafc; border: 2px solid transparent; border-radius: 1.5rem; padding: 1.1rem 1.5rem; font-size: 0.9rem; outline: none; transition: all 0.3s; color: #1e293b; }
        .dark .form-input-zinc { background: #18181b; color: white; border-color: #27272a; }
        .form-input-zinc:focus { border-color: #10b981; background: white; }
        .dark .form-input-zinc:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default EmployeeAdd;