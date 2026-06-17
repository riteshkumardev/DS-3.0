import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, Calendar, MapPin, CheckCircle, AlertTriangle, 
  MessageSquare, Truck, Plus, FileText, User, Users, HelpCircle 
} from 'lucide-react';
import { getActiveFollowUps, createFollowUp, updateLeadStatus } from '../../api/leadApi';
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import { fetchPartiesList } from '../../api/partyApi';

const FollowUpDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 🚀 NEW STATE FOR DYNAMIC COLLAPSE ACCORDION CARDS VIEW
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const initialFormState = {
    partyName: "",
    mobileNumber: "",
    address: "",
    remarks: "",
    status: "PENDING",
    followUpDate: new Date().toISOString().split('T')[0],
    actionTrigger: "DATE_BASED",
    routeLocation: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- DATA LOADING ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, supRes] = await Promise.all([
        getActiveFollowUps(),
        fetchPartiesList('SUPPLIER')
      ]);

      if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      if (supRes.data?.success) setSuppliers(supRes.data.data || []);
    } catch (err) {
      showMsg("Master synchronization pipelines failed to execute.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (e) => {
    const val = e.target.value;
    if (!val) {
      setFormData(prev => ({ ...prev, partyName: "", mobileNumber: "", address: "" }));
      return;
    }

    if (val === "Local customer") {
      setFormData(prev => ({
        ...prev,
        partyName: "LOCAL CUSTOMER",
        mobileNumber: "N/A",
        address: "LOCAL TRANSIT MARKET"
      }));
      return;
    }

    const matchedParty = suppliers.find(s => s.name === val);
    if (matchedParty) {
      let formattedAddress = "N/A";
      if (matchedParty.address) {
        if (typeof matchedParty.address === 'object') {
          const { street, city, state, pincode } = matchedParty.address;
          formattedAddress = [street, city, state, pincode].filter(Boolean).join(", ");
        } else {
          formattedAddress = String(matchedParty.address);
        }
      }

      setFormData(prev => ({
        ...prev,
        partyName: matchedParty.name,
        mobileNumber: matchedParty.phone || matchedParty.mobile || "N/A",
        address: formattedAddress.toUpperCase()
      }));
    }
  };

  // --- API SUBMITS ---
  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.partyName || !formData.remarks) {
      return showMsg("Party Name and Conversation remarks are mandatory.", "warning");
    }

    try {
      setSubmitLoading(true);
      const res = await createFollowUp(formData);
      if (res.data?.success) {
        showMsg("✅ Lead Action Registry Saved Complete!", "success");
        setFormData(initialFormState);
        setShowAddForm(false);
        
        const leadsRes = await getActiveFollowUps();
        if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to commit CRM payload record", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🚀 FIXED RESOLVE FUNCTION INTERNAL PAYLOAD MAPPING BUG
  const handleResolveStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const targetStatus = currentStatus === "PENDING" ? "ORDER_RECEIVED" : "COMPLAINT_RESOLVED";
      
      // Strict parameter structuring passing exact JSON payload object mapping
      const res = await updateLeadStatus(id, { status: targetStatus });
      if (res.data?.success) {
        showMsg(`✅ Transaction resolved as: ${targetStatus}`, "success");
        
        // Dynamic collapse cleanup if resolved card is open
        if (expandedLeadId === id) setExpandedLeadId(null);

        const leadsRes = await getActiveFollowUps();
        if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      console.error("Resolve error tracing:", err.response?.data);
      showMsg(err.response?.data?.message || "Failed to execute status change operational patch.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Accordion Toggle Engine Control Hook
  const toggleCardExpansion = (id) => {
    setExpandedLeadId(prevId => (prevId === id ? null : id));
  };

  if (loading && leads.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-3 md:p-8 font-sans text-left transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- MAIN HEADER CONTROLLER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight uppercase italic">
              <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md">
                <AlertTriangle size={22} className="animate-pulse" />
              </div>
              CRM Lead & Order Tracker
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1.5 ml-1">Automated dispatch reminders, client complaints & sales routing triggers</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 ${showAddForm ? 'bg-zinc-700' : 'bg-emerald-600'} hover:opacity-90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95`}
          >
            <Plus size={16} strokeWidth={3} /> {showAddForm ? "Close Input Panel" : "Create Follow-up Log"}
          </button>
        </div>

        {/* --- DYNAMIC ERP CRM REGISTRATION INPUT FORM --- */}
        {showAddForm && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b dark:border-zinc-800 pb-4 mb-6">
              <FileText size={16} className="text-emerald-500" /> New Customer Engagement Matrix Entry
            </h3>
            <form onSubmit={handleSubmitLead} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="form-label-crm">Master Corporate Account Lookup *</label>
                <select onChange={handleCustomerSelect} className="form-input-crm font-bold text-xs" required>
                  <option value="">-- Select Customer Account --</option>
                  <option value="Local customer">Local customer</option>
                  {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Verified Account Entity Name</label>
                <input type="text" name="partyName" value={formData.partyName} onChange={handleInputChange} className="form-input-crm font-black uppercase" placeholder="AUTO-LOAD METRIC NAME" required readOnly />
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Reference Mobile Number</label>
                <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="form-input-crm font-mono tracking-wider font-bold" placeholder="CONTACT REFERENCE" required />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="form-label-crm">Operational Plant Location / Target Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input-crm uppercase" placeholder="FULL DESTINATION ADDR MAP FIELD" />
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Target Action/Call Reminder Timeline</label>
                <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleInputChange} className="form-input-crm font-bold" required />
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Action Matrix Processing Rule</label>
                <select name="actionTrigger" value={formData.actionTrigger} onChange={handleInputChange} className="form-input-crm font-black text-xs">
                  <option value="DATE_BASED">DATE TIMELINE DISPATCH REMINDER</option>
                  <option value="VEHICLE_ROUTE_BASED">ON TRANSIT FLEET REACH GATE ALERT</option>
                  <option value="IMMEDIATE">CRITICAL TOP SPEED RUNTIME EVENT</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Target Fleet Route Intersection (Location)</label>
                <input type="text" name="routeLocation" value={formData.routeLocation} onChange={handleInputChange} className="form-input-crm uppercase font-black" placeholder="E.G. LAKHISARAI / DUMKA" />
              </div>

              <div className="space-y-2">
                <label className="form-label-crm">Engagement Mode Status Map</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="form-input-crm font-black text-xs">
                  <option value="PENDING">PENDING ENGAGEMENT SYSTEM LOG</option>
                  <option value="CALLBACK_REQUIRED">CALLBACK REQUIRED MONITOR</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="form-label-crm">Log Conversation Instruction Details / Action Items *</label>
                <textarea rows="2" name="remarks" value={formData.remarks} onChange={handleInputChange} className="form-input-crm uppercase text-xs" placeholder="SPECIFY DETAILED REMARKS..." required />
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={submitLoading} 
                  className="px-14 py-4 bg-zinc-950 dark:bg-emerald-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                >
                  {submitLoading ? "DEPLOYING PARAMETERS..." : "Deploy Active Follow-Up"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- CARDS GRID ALERTS VIEW WITH COLLAPSIBLE MECHANICS --- */}
        <div className="space-y-4 text-left">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" /> Critical Pending Client Reminders Checklist ({leads.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => {
              const isExpanded = expandedLeadId === lead._id;
              
              return (
                <div 
                  key={lead._id} 
                  onClick={() => !isExpanded && toggleCardExpansion(lead._id)}
                  className={`p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group ${
                    isExpanded 
                      ? 'border-amber-500 ring-2 ring-amber-500/10 lg:col-span-1 scale-[1.01]' 
                      : 'border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-amber-500/60'
                  }`}
                >
                  <div>
                    {/* Collapsed/Header Header row always visible */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex flex-col truncate max-w-[70%]">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate italic">
                          {lead.partyName}
                        </h4>
                        {!isExpanded && (
                          <span className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-wider animate-pulse">
                            ➔ Click to open info
                          </span>
                        )}
                      </div>
                      {lead.actionTrigger === "VEHICLE_ROUTE_BASED" ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 rounded-lg shrink-0">
                          <Truck size={10}/> Route: {lead.routeLocation || "ANY"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-lg shrink-0">
                          <Calendar size={10}/> Date: {lead.followUpDate ? String(lead.followUpDate).split('T')[0] : '—'}
                        </span>
                      )}
                    </div>

                    {/* 🚀 EXPANDED SECTION DATA: Only displays if card is opened */}
                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase text-zinc-400">Action Conversation Log:</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleCardExpansion(lead._id); }}
                          className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          ✕ Collapse
                        </button>
                      </div>

                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800 mb-4 uppercase whitespace-pre-wrap">
                        {lead.remarks}
                      </p>

                      <div className="space-y-2 text-[11px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border dark:border-zinc-800 mb-4">
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-emerald-500" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-mono">{lead.mobileNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-red-500 shrink-0" />
                          <span className="uppercase text-zinc-700 dark:text-zinc-300 whitespace-normal leading-tight">{lead.address}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t dark:border-zinc-800/60">
                        <a 
                          href={`https://wa.me/${String(lead.mobileNumber).replace(/[^0-9]/g, '')}?text=Dhara%20Shakti%20Agro%20Products%20Follow-up%20Update.`}
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all text-center"
                        >
                          <MessageSquare size={12}/> WhatsApp Client
                        </a>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleResolveStatus(lead._id, lead.status); }}
                          className="flex items-center justify-center gap-1.5 py-3 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
                        >
                          <CheckCircle size={12}/> Resolve Log
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SYSTEM REGISTRY DATATABLE SECTION --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-left">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 border-b dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Users size={16} className="text-amber-500" /> Active System Verification & CRM Activity Register
            </span>
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-3 py-1 font-black rounded-lg uppercase dark:text-white">Active Logs: {leads.length}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4">S.No.</th>
                  <th className="px-6 py-4">Party Account Details</th>
                  <th className="px-6 py-4">Destination Mapping / Route</th>
                  <th className="px-6 py-4">Action Item Conversation Logs</th>
                  <th className="px-6 py-4">Timeline / Trigger</th>
                  <th className="px-6 py-4 text-center">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-xs font-bold">
                {leads.length > 0 ? (
                  leads.map((lead, idx) => (
                    <tr key={lead._id} className="hover:bg-amber-500/5 transition-all text-zinc-700 dark:text-zinc-300">
                      <td className="px-6 py-5 font-mono text-zinc-400">{idx + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{lead.partyName}</span>
                          <span className="text-[10px] font-mono text-zinc-400 mt-0.5">{lead.mobileNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-[200px]">
                        <div className="flex flex-col text-left truncate">
                          <span className="truncate uppercase text-zinc-600 dark:text-zinc-400">{lead.address}</span>
                          {lead.routeLocation && (
                            <span className="text-[9px] bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded w-max mt-1 uppercase font-black">
                              Route: {lead.routeLocation}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-[320px]">
                        <p className="text-zinc-800 dark:text-zinc-200 font-bold uppercase whitespace-pre-line tracking-tight bg-zinc-100/60 dark:bg-zinc-800/40 p-2.5 rounded-xl border dark:border-zinc-800 text-left">
                          {lead.remarks}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black uppercase text-zinc-500">{lead.actionTrigger}</span>
                          <span className="text-[9px] font-bold text-amber-600 mt-0.5">
                            Target: {lead.followUpDate ? String(lead.followUpDate).split('T')[0] : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleResolveStatus(lead._id, lead.status)}
                          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                        <HelpCircle size={48} className="text-zinc-300 dark:text-zinc-700" />
                        <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">No active unassigned reminders present inside node</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label-crm { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.4rem; display: block; margin-bottom: 4px; }
        .form-input-crm { width: 100%; background: #f8fafc; border: 2px solid transparent; border-radius: 1.25rem; padding: 1rem 1.25rem; font-size: 0.85rem; outline: none; transition: all 0.3s; color: #1e293b; }
        .dark .form-input-crm { background: #18181b; color: white; border-color: #27272a; }
        .form-input-crm:focus { border-color: #f59e0b; background: white; }
        .dark .form-input-crm:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default FollowUpDashboard;