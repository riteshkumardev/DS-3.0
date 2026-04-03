import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, MessageSquare, Mic, MicOff, X, 
  Sparkles, Send, ChevronDown, Trash2
} from "lucide-react";

const MasterSmartBot = () => {
  const [showChat, setShowChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      sender: 'bot',
      text: 'Namaste! Main Dharashakti AI hoon. Ledger, Stock, Expenses ya Attendance—kuch bhi poochiye.'
    }
  ]);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // --- Voice Synthesis (Bot Bolkar Batayega) ---
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }, []);

  const addChat = useCallback((sender, text) => {
    setChatLog((prev) => [...prev, { sender, text }]);
  }, []);

  // --- AI Processing Logic ---
  const processCommand = useCallback(async (cmd) => {
    const lower = cmd.toLowerCase();
    let reply = '';

    try {
      if (lower.includes('hisab') || lower.includes('sale') || lower.includes('bikri')) {
        const res = await axios.get(`${API_BASE_URL}/api/sales`);
        const total = (res.data.data || []).reduce((acc, s) => acc + (s.totalAmount || 0), 0);
        reply = `Ab tak ki kul bikri ₹${total.toLocaleString()} hai.`;
      } 
      else if (lower.includes('udhari') || lower.includes('due')) {
        const res = await axios.get(`${API_BASE_URL}/api/sales`);
        const pending = (res.data.data || []).filter(s => (s.totalAmount - (s.amountReceived || 0)) > 0);
        const totalDue = pending.reduce((a, b) => a + (b.totalAmount - (b.amountReceived || 0)), 0);
        reply = totalDue > 0 ? `Total udhaari ₹${totalDue.toLocaleString()} hai.` : 'Sab clear hai, koi udhaari nahi hai.';
      }
      else if (lower.includes('stock') || lower.includes('maal')) {
        const res = await axios.get(`${API_BASE_URL}/api/stocks`);
        const lowStock = (res.data.data || []).filter(i => i.quantity < 5).length;
        reply = lowStock > 0 ? `${lowStock} items ka stock khatam hone wala hai.` : 'Stock full hai, koi dikkat nahi.';
      }
      else {
        // Fallback to General AI
        const res = await axios.post(`${API_BASE_URL}/api/ai/ask`, { prompt: cmd });
        reply = res.data.answer || 'Maaf kijiye, mujhe iski jankari nahi mili.';
      }
    } catch (err) {
      reply = "Server se connect nahi ho pa raha hoon.";
    }

    addChat('bot', reply);
    speak(reply);
  }, [API_BASE_URL, speak, addChat]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    addChat('user', inputText);
    processCommand(inputText);
    setInputText("");
  };

  // --- Voice Recognition (User Bolega) ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = 'hi-IN';
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        addChat('user', transcript);
        processCommand(transcript);
      };
      recognitionRef.current = rec;
    }
    isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans">
      
      {/* --- Chat Window --- */}
      {showChat && (
        <div className="w-[350px] md:w-[400px] h-[550px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="bg-emerald-600 p-6 flex justify-between items-center text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Sparkles size={20} /></div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Dharashakti AI</h3>
                <span className="text-[9px] font-bold opacity-80 uppercase tracking-tighter">Online & Ready</span>
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setChatLog([{ sender: 'bot', text: 'Chat cleared. Poochiye kya janna hai?' }])} className="p-2 hover:bg-white/10 rounded-full transition-all"><Trash2 size={16}/></button>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><ChevronDown size={20}/></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] font-bold shadow-sm leading-relaxed ${
                  chat.sender === 'user' 
                  ? 'bg-zinc-900 text-white rounded-br-none' 
                  : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-100 dark:border-zinc-700'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-zinc-900">
            {['📒 Bikri?', '💰 Udhari?', '📦 Stock?'].map(label => (
              <button 
                key={label}
                onClick={() => { addChat('user', label); processCommand(label); }}
                className="whitespace-nowrap px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase text-zinc-500 hover:bg-emerald-600 hover:text-white transition-all border dark:border-zinc-700"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-2xl border dark:border-zinc-700 focus-within:ring-2 ring-emerald-500/30 transition-all">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Poochiye (Hisaab, Stock...)" 
                className="flex-1 bg-transparent border-none outline-none px-3 text-[13px] font-bold dark:text-white"
              />
              <button 
                onClick={startListening}
                className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white'}`}
              >
                {isListening ? <MicOff size={18}/> : <Mic size={18}/>}
              </button>
              <button 
                onClick={handleSend}
                className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Floating Toggle Button --- */}
      <button 
        onClick={() => setShowChat(!showChat)}
        className={`group relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-500 transform hover:scale-110 active:scale-90 ${
          showChat ? 'bg-zinc-900 rotate-180' : 'bg-emerald-600 hover:bg-emerald-500'
        }`}
      >
        {showChat ? <X size={30} /> : (
          <>
            <MessageSquare size={30} className="group-hover:scale-0 transition-all duration-300" />
            <Bot size={30} className="absolute scale-0 group-hover:scale-100 transition-all duration-300" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white dark:border-zinc-950 rounded-full" />
          </>
        )}
      </button>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MasterSmartBot;