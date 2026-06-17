import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Download } from 'lucide-react';
import { getActiveFollowUps, createFollowUp, updateLeadStatus } from '../../../api/leadApi';
import { fetchPartiesList } from '../../../api/partyApi';

// Sub Components Imports
import FollowUpForm from './FollowUpForm';
import FollowUpCard from './FollowUpCard';
import FollowUpTable from './FollowUpTable';

import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const FollowUpDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
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
      setFormData(prev => ({ ...prev, partyName: "LOCAL CUSTOMER", mobileNumber: "N/A", address: "LOCAL TRANSIT MARKET" }));
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

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.partyName || !formData.remarks) return showMsg("Party Name and remarks are mandatory.", "warning");
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
      showMsg("Failed to commit CRM payload record", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResolveStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const targetStatus = currentStatus === "PENDING" ? "ORDER_RECEIVED" : "COMPLAINT_RESOLVED";
      const res = await updateLeadStatus(id, { status: targetStatus });
      if (res.data?.success) {
        showMsg(`✅ Transaction resolved as: ${targetStatus}`, "success");
        if (expandedLeadId === id) setExpandedLeadId(null);
        const leadsRes = await getActiveFollowUps();
        if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      showMsg("Failed to execute status change operational patch.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIXED PRINT ENGINE OVERRIDE LOGIC
  const handleDownloadPDF = () => {
    if (leads.length === 0) {
      return showMsg("No actionable follow-up dataset logs present to generate report.", "warning");
    }
    showMsg("Initializing print preview layout...", "success");
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading && leads.length === 0) return <Loader />;

  return (
    <div className="crm-dashboard-root min-h-screen bg-zinc-50 dark:bg-zinc-950 p-3 md:p-8 font-sans text-left transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8 crm-print-container">
        
        {/* --- MAIN HEADER CONTROLLER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border dark:border-zinc-800 crm-print-hide">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight uppercase italic">
              <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md">
                <AlertTriangle size={22} className="animate-pulse" />
              </div>
              CRM Lead & Order Tracker
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1.5 ml-1">Automated dispatch reminders, client complaints & sales routing triggers</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Download size={15} strokeWidth={3} /> Save PDF Report
            </button>
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 ${showAddForm ? 'bg-zinc-700' : 'bg-emerald-600'} hover:opacity-90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95`}
            >
              <Plus size={16} strokeWidth={3} /> {showAddForm ? "Close Input Panel" : "Create Follow-up"}
            </button>
          </div>
        </div>

        {/* 🚀 PRINTING EXCLUSIVE STATEMENT HEADER */}
        <div className="crm-print-header hidden border-b-4 border-zinc-950 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">DHARA SHAKTI AGRO PRODUCTS</h1>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">CRM Follow-Up Ledger & Actionable Distribution Summary Report</p>
            </div>
            <div className="text-right text-xs font-mono font-bold text-zinc-500">
              <div>Generated Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
              <div>Active Reminders Count: {leads.length}</div>
            </div>
          </div>
        </div>

        {/* --- FORM SUB-COMPONENT --- */}
        {showAddForm && (
          <div className="crm-print-hide">
            <FollowUpForm 
              formData={formData}
              handleInputChange={handleInputChange}
              handleCustomerSelect={handleCustomerSelect}
              suppliers={suppliers}
              handleSubmitLead={handleSubmitLead}
              submitLoading={submitLoading}
            />
          </div>
        )}

        {/* --- CARDS GRID ALERTS SUB-COMPONENT --- */}
        <div className="space-y-4 text-left crm-print-hide">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" /> Critical Pending Client Reminders Checklist ({leads.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <FollowUpCard 
                key={lead._id}
                lead={lead}
                isExpanded={expandedLeadId === lead._id}
                toggleCardExpansion={setExpandedLeadId}
                handleResolveStatus={handleResolveStatus}
              />
            ))}
          </div>
        </div>

        {/* --- SYSTEM REGISTRY DATATABLE SUB-COMPONENT --- */}
        <div className="crm-table-print-wrapper">
          <FollowUpTable leads={leads} handleResolveStatus={handleResolveStatus} />
        </div>

      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      {/* 🚀 ADVANCED ANTI-BLANK ENGINE STYLES */}
      <style>{`
        .form-label-crm { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.4rem; display: block; margin-bottom: 4px; }
        .form-input-crm { width: 100%; background: #f8fafc; border: 2px solid transparent; border-radius: 1.25rem; padding: 1rem 1.25rem; font-size: 0.85rem; outline: none; transition: all 0.3s; color: #1e293b; }
        .dark .form-input-crm { background: #18181b; color: white; border-color: #27272a; }
        .form-input-crm:focus { border-color: #f59e0b; background: white; }
        .dark .form-input-crm:focus { background: #09090b; }

        @media print {
          /* Force block visibility on all layout roots */
          html, body, #root, .crm-dashboard-root {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            visibility: visible !important;
          }
          
          /* Hide unnecessary dashboard UI blocks */
          .crm-print-hide, button, nav, header, sidebar, .bg-zinc-900\\/50 {
            display: none !important;
          }
          
          /* Force display print items */
          .crm-print-header {
            display: block !important;
          }

          .crm-print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-w-full !important;
            width: 100% !important;
          }

          /* Reset table layout constraints */
          .crm-table-print-wrapper, table {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            display: table !important;
          }

          table {
            border: 1px solid #000000 !important;
            border-collapse: collapse !important;
          }

          th {
            background: #f4f4f5 !important;
            color: #000000 !important;
            font-weight: bold !important;
            border: 1px solid #000000 !important;
            padding: 8px !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
          }

          td {
            border: 1px solid #e4e4e7 !important;
            padding: 8px !important;
            color: #000000 !important;
            font-size: 10px !important;
          }
          
          /* Hide resolve buttons inside tabular body */
          td button, td :text-center {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FollowUpDashboard;