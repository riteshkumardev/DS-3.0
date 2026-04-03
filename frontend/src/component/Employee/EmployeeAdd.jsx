import React, { useState, useEffect } from "react";
import {
  User, Phone, CreditCard, Landmark, Banknote,
  CalendarDays, Briefcase, MapPin, Lock, Camera, Rocket, X
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const EmployeeAdd = ({ onEntrySaved }) => {

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    phone: "",
    emergencyPhone: "",
    aadhar: "",
    address: "",
    designation: "Worker",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    photo: null,
    password: ""
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({
      open: true,
      message: msg,
      severity: type
    });
  };

  // cleanup preview
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {

    const { name, value } = e.target;

    if ((name === "phone" || name === "emergencyPhone") && value.length > 10) return;
    if (name === "aadhar" && value.length > 12) return;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePhotoChange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return showMsg("Only image files allowed", "error");
    }

    if (file.size > 2 * 1024 * 1024) {
      return showMsg("Image must be less than 2MB", "error");
    }

    setFormData({
      ...formData,
      photo: file
    });

    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setFormData({
      ...formData,
      photo: null
    });
    setPreview(null);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (formData.phone.length !== 10)
      return showMsg("Mobile number must be 10 digits", "error");

    if (formData.aadhar.length !== 12)
      return showMsg("Aadhar must be 12 digits", "error");

    setLoading(true);

    try {

      const data = new FormData();

      Object.keys(formData).forEach((key) => {

        if (key === "photo" && formData[key]) {
          data.append("image", formData[key]); // backend multer key
        } else {
          data.append(key, formData[key]);
        }

      });

      data.append("role", formData.designation);

      const res = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        body: data
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Registration failed");
      }

      showMsg(`Employee Registered! ID: ${result.data.employeeId}`);

      setFormData({
        name: "",
        fatherName: "",
        phone: "",
        emergencyPhone: "",
        aadhar: "",
        address: "",
        designation: "Worker",
        joiningDate: new Date().toISOString().split("T")[0],
        salary: "",
        bankName: "",
        accountNo: "",
        ifscCode: "",
        photo: null,
        password: ""
      });

      setPreview(null);

      if (onEntrySaved) onEntrySaved();

    } catch (error) {

      showMsg(error.message, "error");

    } finally {

      setLoading(false);

    }

  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      {loading && <Loader />}
      
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-600 p-8 flex flex-col md:flex-row justify-between items-center text-white gap-4">
          <div className="flex items-center gap-4">
            {preview ? (
               <img src={preview} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50 shadow-lg" alt="Preview" />
            ) : (
               <div className="bg-white/20 p-4 rounded-2xl"><Rocket size={32} /></div>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Staff Enrollment</h2>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest opacity-80">Identity & Payroll Setup</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/30 text-[10px] font-black uppercase tracking-widest">
            {formData.designation} Mode
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-12">
          
          {/* Section 1: Personal Information */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-3">
              <User size={18} className="text-emerald-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-input-zinc" placeholder="Rahul Kumar" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><CreditCard size={12}/> Aadhar Number *</label>
                <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required className="form-input-zinc font-bold tracking-widest" placeholder="12 Digits" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><Camera size={12}/> Profile Photo</label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`form-input-zinc flex items-center justify-between ${formData.photo ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                    <span className="text-zinc-500 text-xs truncate font-bold">
                      {formData.photo ? formData.photo.name : "Choose JPG/PNG..."}
                    </span>
                    {formData.photo ? <X size={14} className="text-red-500 cursor-pointer" onClick={(e) => { e.preventDefault(); setFormData({...formData, photo: null}); setPreview(null); }}/> : <Camera size={14} className="text-zinc-400" />}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><Phone size={12}/> Contact Number *</label>
                <input type="number" name="phone" value={formData.phone} onChange={handleChange} required className="form-input-zinc font-bold" placeholder="10 Digits" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="form-input-zinc" placeholder="Guardian Name" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Emergency Contact</label>
                <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="form-input-zinc" placeholder="Family #" />
              </div>
            </div>
          </div>

          {/* Section 2: Employment & Security */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-3">
              <Briefcase size={18} className="text-emerald-500" /> Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Designation</label>
                <select name="designation" value={formData.designation} onChange={handleChange} className="form-input-zinc appearance-none cursor-pointer">
                  <option value="Manager">Manager</option><option value="Operator">Operator</option>
                  <option value="Worker">Worker</option><option value="Driver">Driver</option>
                  <option value="Helper">Helper</option><option value="Admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><CalendarDays size={12}/> Joining Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="form-input-zinc" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><Banknote size={12}/> Monthly Wage *</label>
                <input type="number" name="salary" value={formData.salary} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600" placeholder="₹" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-600 uppercase ml-1 flex items-center gap-1.5"><Lock size={12}/> Access Password *</label>
                <input type="text" name="password" value={formData.password} onChange={handleChange} required className="form-input-zinc border-amber-200 dark:border-amber-900/50 focus:border-amber-500 font-bold" placeholder="PIN" />
              </div>
            </div>
          </div>

          {/* Section 3: Financials */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 border-b dark:border-zinc-800 pb-3">
              <Landmark size={18} className="text-emerald-500" /> Bank & Residency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="form-input-zinc" placeholder="SBI/PNB/HDFC" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">A/C Number</label>
                <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} className="form-input-zinc font-bold tracking-wider" placeholder="Digits only" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="form-input-zinc uppercase tracking-widest" placeholder="IFSC" />
              </div>
              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1.5"><MapPin size={12}/> Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input-zinc" placeholder="Full Address" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="group relative flex items-center gap-4 px-20 py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : <><Rocket size={20} className="group-hover:animate-bounce" /> Submit Registration</>}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-input-zinc {
          width: 100%;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 1.25rem;
          padding: 0.85rem 1.25rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .dark .form-input-zinc {
          background: #18181b;
          border-color: #27272a;
          color: #f4f4f5;
        }
        .form-input-zinc:focus {
          border-color: #10b981;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .dark .form-input-zinc:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default EmployeeAdd;