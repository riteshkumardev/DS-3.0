import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, TrendingUp, Leaf, MapPin, 
  Sparkles, Mail, Landmark, Package, Binary, 
  Cpu, Award, PhoneCall, Globe
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Service = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1200, once: false, easing: 'ease-out-expo' });
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const products = [
    { title: "Corn Grit (Standard)", desc: "Premium grade maize grit for versatile industrial applications.", img: "https://cpimg.tistatic.com/08893808/b/4/Yellow-Corn-Grit.jpg", tag: "Top Seller", icon: <Package size={24}/>, size: "large" },
    { title: "Corn Grit (3mm)", desc: "Triple-filtered 3mm precision grit for specialized poultry feed.", img: "https://eishaindustries.com/wp-content/uploads/2023/03/CORN-GRIT-BROKEN-MAIZE-3MM-2048x2048.png", tag: "Precision", icon: <Binary size={24}/>, size: "small" },
    { title: "Optimized Cattle Feed", desc: "High-protein formulation for maximum dairy milk yield.", img: "https://5.imimg.com/data5/SELLER/Default/2022/2/QZ/GX/OS/14204024/makka-choker-feed-1000x1000.jpg", tag: "Dairy Gold", icon: <ShieldCheck size={24}/>, size: "small" },
    { title: "Processed Rice Grit", desc: "Perfectly sorted broken rice for snacks and processing.", img: "https://cpimg.tistatic.com/09989613/b/4/White-Rice-Grit..jpg", tag: "Sorted", icon: <TrendingUp size={24}/>, size: "small" },
    { title: "Fine Rice Flour", desc: "Ultra-fine white rice flour for food manufacturing.", img: "https://m.media-amazon.com/images/I/51GswgOU9ZL.jpg", tag: "Food Grade", icon: <Sparkles size={24}/>, size: "small" },
    { title: "Yellow Corn Flour", desc: "Degerminated yellow corn meal for superior baking.", img: "https://cpimg.tistatic.com/11528883/b/4/corn-flour..jpg", tag: "Pure Maize", icon: <Leaf size={24}/>, size: "large" }
  ];

  return (
    // 🎨 MAIN WRAPPER: Light (zinc-50) to Dark (#050505)
    <div className="bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden min-h-screen transition-colors duration-500">
      
      {/* 🧭 NAVIGATION */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ${isScrolled ? 'w-[95%] md:w-[700px] opacity-100' : 'w-[80%] opacity-0 pointer-events-none translate-y-[-20px]'}`}>
        <div className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl px-6 py-4 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Leaf className="text-white" size={16} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Dhara Shakti</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest items-center">
            <a href="#products" className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Products</a>
            <Link to="/login" className="bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all">Portal</Link>
          </div>
        </div>
      </nav>

      {/* 🎬 HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-gradient-to-b from-white to-zinc-100 dark:from-zinc-900 dark:to-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover opacity-20 dark:opacity-10 scale-110 animate-slow-zoom blur-[1px]"
            alt="Agro Field"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent dark:from-[#050505] dark:via-transparent"></div>
        </div>

        <div className="relative z-10 text-center max-w-7xl">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-600/10 border border-emerald-600/20 rounded-full text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-10" data-aos="fade-down">
            <Award size={14} /> Quality Standards Since 2011
          </div>
          
          <h1 className="text-[15vw] md:text-[13rem] font-black tracking-tighter uppercase italic leading-[0.75] mb-16 select-none" data-aos="zoom-out">
            Pure <span className="text-emerald-600 drop-shadow-[0_0_20px_rgba(5,150,105,0.2)]">Grains</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto px-4" data-aos="fade-up" data-aos-delay="400">
            <HeroStat icon={<Cpu size={28}/>} label="Innovation" text="ISO 9001:2015" />
            <HeroStat icon={<Globe size={28}/>} label="Reach" text="Pan India Supply" />
            <HeroStat icon={<PhoneCall size={28}/>} label="Support" text="24/7 Response" />
          </div>
        </div>
      </header>

      {/* 📦 PRODUCTS GRID */}
      <section id="products" className="py-40 px-6 max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10" data-aos="fade-up">
          <div className="text-left">
            <span className="text-emerald-600 font-black text-[12px] uppercase tracking-[0.6em] mb-5 block">Catalog</span>
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-none text-zinc-200 dark:text-zinc-800">Quality <br/><span className="text-zinc-900 dark:text-zinc-100">Range</span></h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {products.map((p, i) => (
            <div key={i} data-aos="fade-up" className={`group relative rounded-[3.5rem] overflow-hidden border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/20 transition-all duration-700 hover:shadow-2xl ${p.size === 'large' ? 'md:col-span-2' : 'md:col-span-1'}`}>
              <div className="h-[450px] relative overflow-hidden">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 dark:from-[#050505] dark:via-[#050505]/20"></div>
                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                  <div className="mb-6 w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-[360deg] transition-all duration-700">{p.icon}</div>
                  <h4 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-white mb-2">{p.title}</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📞 CONTACT SECTION */}
      <section id="contact" className="py-40 px-6">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gradient-to-br dark:from-zinc-900/50 dark:to-[#020202] rounded-[5rem] p-10 md:p-24 border border-zinc-200 dark:border-white/5 relative shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
            <div data-aos="fade-right">
              <h3 className="text-6xl md:text-8xl font-black uppercase italic mb-14 text-zinc-900 dark:text-white leading-tight">Let's <span className="text-emerald-600">Talk</span></h3>
              <div className="space-y-10">
                <ContactInfo icon={<MapPin/>} title="Location" detail="Khanpur, Samastipur, Bihar" />
                <ContactInfo icon={<Mail/>} title="Support" detail="dharashaktiagroproducts@gmail.com" />
              </div>
            </div>

            <div data-aos="fade-left" className="bg-zinc-100 dark:bg-zinc-950/50 p-12 rounded-[4rem] border border-zinc-200 dark:border-white/10 shadow-xl">
               <div className="flex items-center gap-5 mb-10">
                  <div className="p-4 bg-emerald-600 rounded-2xl text-white"><Landmark size={28} /></div>
                  <h4 className="text-2xl font-black uppercase italic text-zinc-800 dark:text-white">PNB Banking</h4>
               </div>
               <div className="space-y-4 mb-10">
                  <BankDetail label="A/C No." value="3504008700005079" />
                  <BankDetail label="IFSC" value="PUNB0350400" />
               </div>
               <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-white/5">
                  <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white">SK</div>
                  <div>
                    <h5 className="font-black text-zinc-900 dark:text-white uppercase italic">S.K. Mishra</h5>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Managing Director</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 FOOTER */}
      <footer className="py-20 px-12 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#030303] text-center md:text-left transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <Leaf className="text-emerald-600" size={28} />
              <h2 className="text-2xl font-black uppercase italic text-zinc-900 dark:text-white">Dhara Shakti</h2>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Engineered Purity • Bihar • India</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase text-zinc-400">
            <Link to="/login" className="hover:text-emerald-600">Employee Portal</Link>
            <p>© 2026 DS Agro Products</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slow-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .animate-slow-zoom { animation: slow-zoom 30s infinite alternate ease-in-out; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

// --- HELPERS ---

const HeroStat = ({ icon, label, text }) => (
  <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 flex flex-col items-center group transition-all shadow-sm dark:shadow-none">
    <div className="text-emerald-600 dark:text-emerald-500 mb-4 transform group-hover:scale-110 transition-transform">{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">{label}</p>
    <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase italic text-sm">{text}</p>
  </div>
);

const ContactInfo = ({ icon, title, detail }) => (
  <div className="flex gap-6 group items-center">
    <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-emerald-600 border border-zinc-200 dark:border-white/5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <div>
      <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-zinc-900 dark:text-white font-black uppercase italic text-lg leading-tight">{detail}</p>
    </div>
  </div>
);

const BankDetail = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-zinc-200 dark:border-white/5">
    <span className="text-[9px] font-black uppercase text-zinc-500">{label}</span>
    <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-500 tracking-wider">{value}</span>
  </div>
);

export default Service;