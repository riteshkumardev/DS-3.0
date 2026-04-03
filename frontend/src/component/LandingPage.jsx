import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Users, 
  TrendingUp, Leaf, Award, MapPin, 
  Target, BarChart4, ChevronDown, 
  Sparkles, Mail, Landmark, Package, Binary, Phone, Globe
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const LandingPage = (user) => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: 'ease-out-quart' });
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const products = [
    { title: "Corn Grit (Standard)", desc: "Premium grade maize grit for versatile industrial applications.", img: "https://cpimg.tistatic.com/08893808/b/4/Yellow-Corn-Grit.jpg", tag: "Top Seller", icon: <Package size={20}/> },
    { title: "Corn Grit (3mm)", desc: "Triple-filtered 3mm precision grit for specialized poultry feed.", img: "https://eishaindustries.com/wp-content/uploads/2023/03/CORN-GRIT-BROKEN-MAIZE-3MM-2048x2048.png", tag: "Industrial Grade", icon: <Binary size={20}/> },
    { title: "Optimized Cattle Feed", desc: "High-protein formulation for maximum dairy milk yield.", img: "https://5.imimg.com/data5/SELLER/Default/2022/2/QZ/GX/OS/14204024/makka-choker-feed-1000x1000.jpg", tag: "Dairy Specialist", icon: <ShieldCheck size={20}/> },
    { title: "Processed Rice Grit", desc: "Perfectly sorted broken rice for snacks and processing.", img: "https://cpimg.tistatic.com/09989613/b/4/White-Rice-Grit..jpg", tag: "Premium Quality", icon: <TrendingUp size={20}/> },
    { title: "Fine Rice Flour", desc: "Ultra-fine white rice flour for food manufacturing.", img: "https://m.media-amazon.com/images/I/51GswgOU9ZL.jpg", tag: "Food Grade", icon: <Sparkles size={20}/> },
    { title: "Yellow Corn Flour", desc: "Degerminated yellow corn meal for superior baking.", img: "https://cpimg.tistatic.com/11528883/b/4/corn-flour..jpg", tag: "Pure Maize", icon: <Leaf size={20}/> }
  ];

  return (
    <div className="bg-[#f8fafc] text-zinc-900 font-sans selection:bg-emerald-600 selection:text-white overflow-x-hidden">
             <nav className="fixed top-6 left-0 right-0 z-[100] px-6">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-10 py-4 rounded-[2rem] flex justify-between items-center transition-all duration-500">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20 group-hover:rotate-6 transition-transform">
              <Leaf size={22} fill="currentColor" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black uppercase tracking-tighter italic leading-none text-zinc-900">
                Dhara Shakti <span className="text-emerald-600">Agro</span>
              </span>
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-1">Industrial Excellence</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <button onClick={() => scrollToSection('products')} className="hover:text-emerald-600 transition-colors">Product Range</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-600 transition-colors">Contact Hub</button>
          </div>

          <Link to="/login" className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
              Staff Portal
          </Link>
        </div>
      </nav>
      {/* 1. NAVIGATION (Glassmorphism Enhanced) */}
   

      {/* 2. HERO SECTION (Dynamic Visuals) */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-emerald-600/10 mix-blend-overlay z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover opacity-30 scale-105 animate-slow-zoom"
            alt="Field"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-[#f8fafc] z-10"></div>
        </div>

        <div className="relative z-20 text-center px-6 max-w-7xl pt-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-[0.5em] mb-10 backdrop-blur-md" data-aos="fade-down">
            <Target size={14} /> Bihar's Trusted Agro Processor Since 2011
          </div>
          <h1 className="text-[12vw] md:text-[9rem] font-black text-white tracking-tighter uppercase italic leading-[0.75] mb-8 select-none" data-aos="zoom-out">
            Pure <span className="text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">Processing</span> <br />
            <span className="text-zinc-500 font-light not-italic text-[4vw] md:text-5xl tracking-[0.4em] lowercase block mt-4 opacity-50">legacy in every grain</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12" data-aos="fade-up">
            <button onClick={() => scrollToSection('products')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3 group">
              Explore Catalog <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px] text-left border-l border-zinc-800 pl-4 hidden md:block">
              Supplying high-quality maize & rice derivatives nationwide.
            </p>
          </div>
        </div>
      </header>

      {/* 3. PRODUCT CATALOG (Card Redesign) */}
      <section id="products" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8" data-aos="fade-up">
            <div className="text-left">
              <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.5em] mb-4 block">Industrial Grade Output</span>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic text-zinc-900 leading-none">Our Premium <br/><span className="text-zinc-300">Output Range</span></h2>
            </div>
            <p className="text-zinc-400 text-sm font-medium max-w-sm border-l-2 border-emerald-500 pl-6 text-left">
              Advanced milling processes ensuring consistency in texture and nutritional value for industrial feed and food sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((p, i) => (
              <div key={i} data-aos="fade-up" data-aos-delay={i * 100} className="group bg-white rounded-[3rem] overflow-hidden border border-zinc-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-4">
                <div className="h-72 overflow-hidden relative">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-6 right-6">
                     <span className="px-4 py-2 bg-zinc-900/80 backdrop-blur-md rounded-xl text-[8px] font-black uppercase tracking-widest text-white">{p.tag}</span>
                  </div>
                </div>
                <div className="p-10 relative text-left">
                  <div className="absolute -top-8 left-10 w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                    {p.icon}
                  </div>
                  <h4 className="text-2xl font-black tracking-tight mb-4 uppercase italic text-zinc-900 mt-4 leading-none">{p.title}</h4>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed mb-6">{p.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Inquiry Now <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. IDENTITY & CONTACT (Premium Dark UI) */}
      <section id="contact" className="py-32 bg-zinc-950 text-white rounded-[4rem] mx-6 mb-20 relative overflow-hidden shadow-2xl shadow-emerald-950/20">
        <div className="max-w-7xl mx-auto px-10 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div data-aos="fade-right" className="text-left">
            <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-12 leading-tight">Secure Your <br /> <span className="text-emerald-500">Agro-Supply</span></h3>
            <div className="space-y-10">
              <div className="flex gap-6 group">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 border border-white/10 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <MapPin size={24}/>
                </div>
                <div>
                  <p className="font-black uppercase italic text-lg mb-1">Processing Hub</p>
                  <p className="text-zinc-500 text-xs font-medium">Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 border border-white/10 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Mail size={24}/>
                </div>
                <div>
                  <p className="font-black uppercase italic text-lg mb-1">Official Email</p>
                  <p className="text-zinc-500 text-xs font-bold tracking-wide">dharashaktiagroproducts@gmail.com</p>
                </div>
              </div>
              <div className="flex gap-10 text-zinc-500 text-[9px] font-black uppercase tracking-widest pt-8 border-t border-white/5">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> GST Certified</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> FSSAI Licensed</div>
              </div>
            </div>
          </div>

          <div data-aos="fade-left" className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 text-left relative">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-600 rounded-full blur-[50px] opacity-20 animate-pulse"></div>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4 text-emerald-500">
                  <Landmark size={20} />
                  <p className="font-black uppercase tracking-[0.3em] text-[9px]">Settlement Partner</p>
                </div>
                <div className="pl-8 border-l-2 border-emerald-500/30">
                  <p className="font-black uppercase italic tracking-tight text-xl mb-1">Punjab National Bank</p>
                  <p className="text-zinc-500 text-xs font-mono mb-1">A/c: 3504008700005079</p>
                  <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">IFSC: PUNB0350400</p>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-900/40">SK</div>
                <div>
                   <p className="font-black uppercase tracking-tight text-xl italic leading-none mb-1">Suman Kumar Mishra</p>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">Managing Director</p>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER (Minimalist) */}
      <footer className="pb-16 px-12">
        <div className="max-w-7xl mx-auto border-t border-zinc-200 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start opacity-40">
                <Leaf className="text-emerald-600" size={24} />
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Dhara Shakti Agro</h2>
              </div>
              <p className="text-zinc-400 text-xs font-semibold max-w-xs mx-auto md:mx-0 uppercase tracking-widest leading-loose">
                Sri Pur Gahar • Khanpur • Samastipur • Bihar
              </p>
            </div>
            <div className="flex flex-wrap gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 justify-center md:justify-end">
              <Link to="/login" className="hover:text-emerald-600 transition-all">Employee Login</Link>
              <a href="mailto:dharashaktiagroproducts@gmail.com" className="hover:text-emerald-600 transition-all">Business Inquiry</a>
              <span className="text-zinc-200 select-none">|</span>
              <p>© 2026 Dhara Shakti Agro Products</p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate ease-in-out;
        }
        .backdrop-blur-xl { backdrop-filter: blur(24px); }
      `}</style>
    </div>
  );
};

export default LandingPage;