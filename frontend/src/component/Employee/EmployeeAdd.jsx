import React, { useState, useEffect } from "react";
import {
  User, Phone, CreditCard, Landmark, Banknote,
  CalendarDays, Briefcase, MapPin, Lock, Camera, Rocket, X, FileImage, Save, ArrowLeft
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import { addStaff, updateStaff, uploadProfileImage } from "../../api/staffApi";

const EmployeeAdd = ({ editData, viewData, onCancel, onEntrySaved }) => {
  // 🎯 DYNAMIC MODAL LAYER RESOLUTION MODE DETECTORS
  const isViewMode = !!viewData;
  const isEditMode = !!editData;
  const activeStaff = viewData || editData;

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

  // 🎯 POPULATE FIELDS DYNAMICALLY ACROSS MODES
  useEffect(() => {
    if (activeStaff) {
      setFormData({
        name: activeStaff.name || "",
        fatherName: activeStaff.fatherName || "",
        phone: activeStaff.phone || "",
        emergencyPhone: activeStaff.emergencyPhone || "",
        aadhar: activeStaff.kycDetails?.aadharNumber || "",
        address: activeStaff.address || "",
        designation: activeStaff.role || "WORKER",
        joiningDate: activeStaff.joiningDate ? activeStaff.joiningDate.split("T")[0] : new Date().toISOString().split("T")[0],
        salary: activeStaff.baseSalary || activeStaff.salary || "",
        bankName: activeStaff.bankDetails?.bankName || "",
        accountNo: activeStaff.bankDetails?.accountNumber || "",
        ifscCode: activeStaff.bankDetails?.ifscCode || "",
        password: "", // Kept empty for edit context as a security constraint protocol
        photo: null
      });

      if (activeStaff.photo) {
        setPreview(getImageUrl(activeStaff.photo));
      } else {
        setPreview(null);
      }
    } else {
      setFormData(initialState);
      setPreview(null);
    }
  }, [editData, viewData]);

  useEffect(() => {
    return () => { if (preview && !preview.startsWith("http")) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleChange = (e) => {
    if (isViewMode) return; // Freeze inputs inside structural view layer execution
    const { name, value } = e.target;
    if ((name === "phone" || name === "emergencyPhone") && value.length > 10) return;
    if (name === "aadhar" && value.length > 12) return;
    setFormData({ ...formData, [name]: value });
  };

  // 🖼️ FIXED & UPDATED: DYNAMIC IMAGE UPLOAD & INTERACTIVE CLOUD SYNC
  const handlePhotoChange = async (e) => {
    if (isViewMode) return;
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(file.name)) {
      return showMsg("Invalid file format. Only JPG, JPEG, and PNG are allowed.", "warning");
    }

    if (file.size > 2 * 1024 * 1024) {
      return showMsg("File size too large (Max 2MB)", "warning");
    }

    // 🎯 HOT UPDATE PATCH: If in Edit Mode, push photo directly to cloud cluster registry immediately
    if (isEditMode && activeStaff?._id) {
      const imgFormData = new FormData();
      imgFormData.append("photo", file); // Strictly bound to 'photo' key identifier
      imgFormData.append("employeeId", activeStaff._id); // Point target profile structure ID token

      try {
        setLoading(true);
        const res = await uploadProfileImage(imgFormData);

        if (res.data.success) {
          const newPhotoPath = res.data.photo;
          setPreview(getImageUrl(newPhotoPath));
          showMsg("✅ Profile photo updated successfully in registry node!", "success");
        }
      } catch (err) {
        showMsg(err.response?.data?.message || "Upload failed inside cloud node pipelines.", "error");
      } finally {
        setLoading(false);
        e.target.value = null; // Flush input stream channel node safely out of try block parameters
      }
    } else {
      // Standard registration mode handling: Hold local blob preview sequence until submit
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedPhoto = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isViewMode) return;
    if (preview && !preview.startsWith("http")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFormData({ ...formData, photo: null });
  };

  const getImageUrl = (path) => {
    const API_BASE = "https://dharashakti30backend.vercel.app";
    if (!path || path === "null") return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE}/${path.replace(/\\/g, '/')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return;

    // 🛑 FORM MATRIX CRITERIA VALIDATIONS
    if (formData.phone.length !== 10) return showMsg("Mobile number must be 10 digits", "error");
    if (!isEditMode && (!formData.password || formData.password.length < 4)) {
       return showMsg("Password (Access PIN) is required (min 4 digits)", "error");
    }

    setLoading(true);

    try {
      // 📦 BUILDING DYNAMIC MULTIPART FORMDATA
      const data = new FormData();
      
      data.append("name", formData.name.toUpperCase());
      if (formData.password) data.append("password", formData.password); 
      data.append("role", formData.designation.toUpperCase());
      data.append("phone", formData.phone);
      data.append("fatherName", formData.fatherName.toUpperCase());
      data.append("emergencyPhone", formData.emergencyPhone || "");
      data.append("address", formData.address || "");
      data.append("joiningDate", formData.joiningDate);
      data.append("baseSalary", Number(formData.salary));

      // 🚀 HISTORICAL BUG FIX TRIGGER: 
      // Agar edit mode hai aur salary pichli bachi hui database salary se alag hai toh metadata flag bhejein
      if (isEditMode) {
        const originalSalary = Number(activeStaff.baseSalary || activeStaff.salary || 0);
        const currentFormSalary = Number(formData.salary);
        if (originalSalary !== currentFormSalary) {
          data.append("isSalaryModified", "true");
          data.append("oldSalarySnapshot", originalSalary);
        }
      }

      // Nested KYC details parameters
      data.append("kycDetails[aadharNumber]", formData.aadhar || "");

      // Nested Bank components
      data.append("bankDetails[accountNumber]", formData.accountNo || "");
      data.append("bankDetails[ifscCode]", formData.ifscCode.toUpperCase() || "");
      data.append("bankDetails[bankName]", formData.bankName.toUpperCase() || "");

      // Only append on registration mode since edit photo is handled instantly above
      if (!isEditMode && formData.photo) {
        data.append("image", formData.photo); 
      }

      let response;
      if (isEditMode) {
        // Trigger dynamic database atomic write for edit mutation channel
        response = await updateStaff(activeStaff._id, data);
      } else {
        // Trigger addition operations channel
        response = await addStaff(data);
      }

      if (response.data.success) {
        showMsg(isEditMode ? "✅ Staff Details Mutated Safely Complete!" : `✅ Staff Registered! ID: ${response.data.data.employeeId}`, "success");
        if (!isEditMode) {
          setFormData(initialState);
          setPreview(null);
        }
        setTimeout(() => {
          if (onEntrySaved) onEntrySaved();
        }, 1000);
      }
    } catch (error) {
      console.error("Staff Save Error Framework Trace:", error.response?.data);
      const errorMsg = error.response?.data?.message || "ValidationError: Structural integrity unmapped.";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 font-sans text-left relative animate-in fade-in duration-200">
      {loading && <Loader />}
      
      {/* 🔙 Dynamic Navigation Cancel Override Floating Hook Header */}
      {onCancel && (
        <button type="button" onClick={onCancel} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-black uppercase tracking-widest bg-white dark:bg-zinc-900 border dark:border-zinc-800 px-4 py-2.5 rounded-xl transition-all">
          <ArrowLeft size={14}/> Back to active directory
        </button>
      )}

      <div className="max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Banner Section Context Render Layer */}
        <div className={`p-10 flex flex-col md:flex-row justify-between items-center text-white gap-6 transition-colors duration-300 ${isViewMode ? 'bg-zinc-800 dark:bg-zinc-800' : isEditMode ? 'bg-amber-600' : 'bg-emerald-600'}`}>
          <div className="flex items-center gap-6">
            {preview ? (
               <div className="relative">
                 <img src={preview} className="w-20 h-20 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" alt="Preview" />
                 {!isViewMode && (
                   <button type="button" onClick={removeSelectedPhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg transition-transform active:scale-95 z-20">
                     <X size={12} />
                   </button>
                 )}
               </div>
            ) : (
               <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md"><Rocket size={40} /></div>
            )}
            <div>
              <h2 className="text-3xl font-black uppercase italic leading-none">
                {isViewMode ? "View Context" : isEditMode ? "Mutation Registry" : "Enrollment"}
              </h2>
              <p className="text-zinc-100 text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-70">
                {isViewMode ? `Employee Entry Node: ${activeStaff?.employeeId}` : isEditMode ? `Update details target code: ${activeStaff?.employeeId}` : "Staff Master Deployment Operations Panel"}
              </p>
            </div>
          </div>
          <div className="bg-zinc-900/30 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest">
             {formData.designation} PROFILE
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-12">
          
          {/* Identity Block */}
          <div className="space-y-8">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-4">
              <User size={18} className={isViewMode ? "text-zinc-500" : isEditMode ? "text-amber-500" : "text-emerald-500"} /> Identity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="form-label">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isViewMode} className="form-input-zinc font-bold disabled:opacity-60" placeholder="NAME" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Aadhaar (12 Digits) *</label>
                <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required disabled={isViewMode} className="form-input-zinc font-black tracking-widest disabled:opacity-60" placeholder="Aadhaar Card Number" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} disabled={isViewMode} className="form-input-zinc disabled:opacity-60" placeholder="GUARDIAN" />
              </div>
            </div>
          </div>

          {/* Employment Config */}
          <div className="space-y-8">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-4">
              <Briefcase size={18} className={isViewMode ? "text-zinc-500" : isEditMode ? "text-amber-500" : "text-emerald-500"} /> Employment Config
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="form-label">Role</label>
                <select name="designation" value={formData.designation} onChange={handleChange} disabled={isViewMode} className="form-input-zinc font-bold appearance-none cursor-pointer disabled:opacity-60">
                  {['MANAGER', 'ACCOUNTANT', 'OPERATOR', 'DRIVER', 'LOADER', 'SALES_MAN', 'WORKER'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="form-label flex items-center gap-1.5 text-zinc-400"><Lock size={12}/> Login Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode && !isViewMode} disabled={isViewMode} className="form-input-zinc font-black text-lg disabled:opacity-60" placeholder={isViewMode ? "••••••" : isEditMode ? "BLANK TO SKIP" : "REQUIRED PIN"} />
              </div>
              <div className="space-y-2">
                <label className="form-label">Base Salary *</label>
                <input type="number" name="salary" value={formData.salary} onChange={handleChange} required disabled={isViewMode} className="form-input-zinc font-black text-emerald-600 text-xl disabled:opacity-60" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="form-label">Joining Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} disabled={isViewMode} className="form-input-zinc font-bold disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* Contacts & Bank Info Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
             <div className="lg:col-span-1 space-y-6 bg-zinc-50 dark:bg-zinc-800/40 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Phone size={14}/> Contacts</h4>
                <div className="space-y-4 text-left">
                  <input type="number" name="phone" value={formData.phone} onChange={handleChange} required disabled={isViewMode} className="form-input-zinc disabled:opacity-60" placeholder="PRIMARY MOBILE" />
                  <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} disabled={isViewMode} className="form-input-zinc disabled:opacity-60" placeholder="EMERGENCY CONTACT" />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={isViewMode} className="form-input-zinc disabled:opacity-60" placeholder="FULL ADDRESS DETAILS" />
                </div>
             </div>

             <div className={`lg:col-span-2 space-y-6 p-8 rounded-[2.5rem] border ${isViewMode ? 'bg-zinc-500/5 border-zinc-500/10' : isEditMode ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest border-b pb-3 flex items-center gap-2 ${isViewMode ? 'text-zinc-500' : isEditMode ? 'text-amber-600' : 'text-emerald-600'}`}><Landmark size={14}/> Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                   <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} disabled={isViewMode} className="form-input-zinc disabled:opacity-60" placeholder="BANK NAME TITLE" />
                   <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} disabled={isViewMode} className="form-input-zinc uppercase disabled:opacity-60" placeholder="IFSC CODE ROUTE" />
                   <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} disabled={isViewMode} className="form-input-zinc md:col-span-2 font-black tracking-widest disabled:opacity-60" placeholder="ACCOUNT BANK NUMBER" />
                </div>
             </div>
          </div>

          {/* Image Selection Area Zone */}
          {!isViewMode && (
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
                  
                  {preview ? (
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <FileImage size={24} />
                      <span className="truncate max-w-[200px] font-mono">
                        {formData.photo ? formData.photo.name : "Cloud Asset Linked"}
                      </span>
                      {!isEditMode && (
                        <button type="button" onClick={removeSelectedPhoto} className="p-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Camera size={28} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">Drag & drop or Click to browse image file</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger Row */}
          <div className="flex justify-center pt-4">
            {!isViewMode ? (
              <button 
                type="submit" 
                disabled={loading}
                className={`group relative flex items-center gap-4 px-24 py-6 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 ${isEditMode ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10' : 'bg-zinc-900 dark:bg-emerald-600 shadow-emerald-500/10'}`}
              >
                {loading ? "MUTATING..." : isEditMode ? <><Save size={20}/> Update Entry details</> : <><Rocket size={20} className="group-hover:animate-bounce" /> Dispatch Staff Data</>}
              </button>
            ) : (
              onCancel && (
                <button 
                  type="button" 
                  onClick={onCancel}
                  className="px-24 py-6 bg-zinc-800 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:opacity-90 active:scale-95 transition-all"
                >
                  Close View Profile
                </button>
              )
            )}
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
        .form-input-zinc:disabled { background: #f1f5f9; border-color: #e2e8f0; color: #64748b; cursor: not-allowed; }
        .dark .form-input-zinc:disabled { background: #202024; border-color: #27272a; color: #a1a1aa; }
      `}</style>
    </div>
  );
};

export default EmployeeAdd;