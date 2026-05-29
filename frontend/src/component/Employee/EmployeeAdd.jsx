import React, { useState, useEffect } from "react";
import {
  User, Phone, CreditCard, Landmark, Banknote,
  CalendarDays, Briefcase, MapPin, Lock, Camera, Rocket, X, FileImage
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

  // ☁️ CLOUDINARY FILE ACCEPTANCE & PREVIEW LOGIC
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed Formats matching backend cloudinaryConfig: ['jpg', 'png', 'jpeg']
    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(file.name)) {
      showMsg("Invalid file format. Only JPG, JPEG, and PNG are allowed.", "error");
      e.target.value = ""; // Form tracking clear
      return;
    }

    setFormData({ ...formData, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const removeSelectedPhoto = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFormData({ ...formData, photo: null });
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
      // 📦 BUILDING MULTIPART FORMDATA FOR CLOUDINARY STORAGE INTERFACE
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
      
      // 2. Base Salary
      data.append("baseSalary", Number(formData.salary));

      // 3. Nested KYC Details
      data.append("kycDetails[aadharNumber]", formData.aadhar);

      // 4. Nested Bank Details
      data.append("bankDetails[accountNumber]", formData.accountNo);
      data.append("bankDetails[ifscCode]", formData.ifscCode.toUpperCase());
      data.append("bankDetails[bankName]", formData.bankName.toUpperCase());

      // 5. Cloudinary Image File Append (Key passes as 'image' to sync multer memory storage)
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
      const errorMsg = error.response?.data?.message || "ValidationError: Check input fields.";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Banner Section */}
        <div className="bg-emerald-600 p-10 flex flex-col md:flex-row justify-between items-center text-white gap-6">
          <div className="flex items-center gap-6">
            {preview ? (
               <div className="relative">
                 <img src={preview} className="w-20 h-20 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" alt="Preview" />
                 <button type="button" onClick={removeSelectedPhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg transition-transform active:scale-95 z-20">
                   <X size={12} />
                 </button>
               </div>
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
          
          {/* Identity Block */}
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

          {/* Employment Config */}
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

          {/* Contacts & Bank Info Panels */}
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

          {/* ☁️ DYNAMIC IMAGE UPLOAD PANEL ZONE */}
          <div className="flex flex-col items-center justify-center pt-4 border-t dark:border-zinc-800">
            <div className="w-full max-w-md space-y-4 text-center">
              <label className="form-label flex items-center justify-center gap-2 text-zinc-500">
                <Camera size={14} className="text-emerald-500"/> Profile Photo Configuration
              </label>
              
              <div className="relative group border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-[2rem] p-6 bg-zinc-50 dark:bg-zinc-800/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/jpg" 
                  onChange={handlePhotoChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                
                {formData.photo ? (
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <FileImage size={24} />
                    <span className="truncate max-w-[200px] font-mono">{formData.photo.name}</span>
                    <button type="button" onClick={removeSelectedPhoto} className="p-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera size={28} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">Drag & drop or Click to browse</p>
                    <p className="text-[9px] font-bold text-zinc-400/70 uppercase">Supported: JPG, JPEG, PNG</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Submit Engine */}
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