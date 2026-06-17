import React from 'react';
import { Phone, Calendar, MapPin, MessageSquare, CheckCircle, Truck } from 'lucide-react';

const FollowUpCard = ({ lead, isExpanded, toggleCardExpansion, handleResolveStatus }) => {
  return (
    <div 
      onClick={() => !isExpanded && toggleCardExpansion(lead._id)}
      className={`p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group ${
        isExpanded 
          ? 'border-amber-500 ring-2 ring-amber-500/10 scale-[1.01]' 
          : 'border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-amber-500/60'
      }`}
    >
      <div>
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
};

export default FollowUpCard;