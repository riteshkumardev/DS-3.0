import React from 'react';
import { Users, HelpCircle } from 'lucide-react';

const FollowUpTable = ({ leads, handleResolveStatus }) => {
  return (
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
  );
};

export default FollowUpTable;