import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Package, Tag, 
  BarChart3, Filter, X, ChevronRight, Save, Info, RefreshCcw 
} from 'lucide-react';
import { 
  getAllProducts, createProduct, updateProduct, deleteProduct 
} from '../../api/productApi'; 
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const ProductMaster = ({ isSidebarMode = false, onProductCreated }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const initialFormState = {
    name: '',
    productType: 'BOTH',
    category: 'GRAINS',
    hsnCode: '',
    unit: 'KG',
    purchasePrice: 0,
    salesPrice: 0,
    gstRate: 5,
    minStockLevel: 10,
    description: '',
    isActive: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProducts({ 
        name: searchTerm, 
        category: filterCategory 
      });
      if (res.data?.success) setProducts(res.data.data);
    } catch (err) {
      showMsg("Product Load Error", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
        showMsg("Product Updated Successfully!");
      } else {
        await createProduct(formData);
        showMsg("New Product Added to Master!");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchProducts();
      if (onProductCreated) onProductCreated(); // Callback for Sidebar usage
    } catch (err) {
      showMsg(err.response?.data?.message || "Error saving product", "error");
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Kiya aap is product ko master se delete karna chahte hain?")) {
      try {
        await deleteProduct(id);
        showMsg("Product Deleted", "success");
        fetchProducts();
      } catch (err) { showMsg("Delete failed", "error"); }
    }
  };

  if (loading && products.length === 0) return <Loader />;

  return (
    <div className={`font-sans ${isSidebarMode ? 'p-0' : 'min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8'}`}>
      <div className={`max-w-7xl mx-auto ${isSidebarMode ? 'space-y-4' : 'space-y-6'}`}>
        
        {/* --- HEADER (Hidden in Sidebar Mode as Sidebar has its own header) --- */}
        {!isSidebarMode && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><Package size={24}/></div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter dark:text-white italic">Product Master</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Master Inventory Ecosystem</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData(initialFormState); }}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <Plus size={18}/> Add New Product
            </button>
          </div>
        )}

        {/* --- FILTERS & ADD BUTTON (For Sidebar Mode) --- */}
        <div className={`grid grid-cols-1 ${isSidebarMode ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800`}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Name or HSN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500/20 text-sm font-bold dark:text-white"
            />
          </div>
          <select 
            className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-black uppercase dark:text-white outline-none cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">ALL CATEGORIES</option>
            {['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {isSidebarMode && (
             <button 
                onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData(initialFormState); }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
             >
               + Create New Product
             </button>
          )}
        </div>

        {/* --- PRODUCT TABLE --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                  <th className="px-8 py-6">Identity</th>
                  <th className="px-8 py-6">Category</th>
                  {!isSidebarMode && <th className="px-8 py-6">Stock Status</th>}
                  <th className="px-8 py-6 text-right">Pricing</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {products.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all group">
                    <td className="px-8 py-5">
                      <p className="font-black text-zinc-800 dark:text-zinc-100 text-sm uppercase italic tracking-tight">{item.name}</p>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase tracking-widest">{item.unit}</span>
                    </td>
                    <td className="px-8 py-5 text-left">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.category}</p>
                      <p className="text-[9px] text-zinc-400 font-bold">HSN: {item.hsnCode}</p>
                    </td>
                    {!isSidebarMode && (
                      <td className="px-8 py-5">
                        <div className={`text-sm font-black ${item.currentStock <= item.minStockLevel ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {item.currentStock.toLocaleString()} <span className="text-[10px] opacity-40">{item.unit}</span>
                        </div>
                        <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full ${item.currentStock <= item.minStockLevel ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: '60%'}}></div>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 tracking-tighter">₹{item.salesPrice.toLocaleString()}</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Tax: {item.gstRate}%</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl transition-all border dark:border-zinc-700"><Edit3 size={15}/></button>
                        <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-xl transition-all border dark:border-zinc-700"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CREATE/EDIT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <div className="text-left">
                  <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white italic">
                    {editingId ? 'Edit Product' : 'Create Product'}
                  </h2>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Master Data Definition</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:rotate-90 transition-all"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="modal-label">Product Full Name</label>
                    <input 
                      required 
                      className="modal-input"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      placeholder="E.G. YELLOW CORN (DRY)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="modal-label">Category</label>
                    <select className="modal-input appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="modal-label">HSN Code (8 Digit)</label>
                    <input required className="modal-input" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} placeholder="10051900" />
                  </div>

                  <div className="space-y-2">
                    <label className="modal-label">Base Unit</label>
                    <select className="modal-input appearance-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      {['KG', 'QUINTAL', 'TON', 'BAG', 'PACKET', 'LTR', 'PCS'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="modal-label">GST Tax Rate (%)</label>
                    <select className="modal-input appearance-none" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: Number(e.target.value)})}>
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="modal-label">Purchase Rate (₹)</label>
                    <input type="number" className="modal-input" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
                  </div>

                  <div className="space-y-2">
                    <label className="modal-label">Sales Rate (₹)</label>
                    <input type="number" className="modal-input" value={formData.salesPrice} onChange={e => setFormData({...formData, salesPrice: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="pt-8 border-t dark:border-zinc-800 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                    <Save size={18}/> {editingId ? 'Update Master' : 'Confirm & Save'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .modal-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.5rem; display: block; }
        .modal-input { width: 100%; background: #f4f4f5; border: 2px solid transparent; border-radius: 1.25rem; padding: 1.1rem; font-size: 0.9rem; font-weight: 700; outline: none; transition: all 0.3s; }
        .dark .modal-input { background: #18181b; color: white; border-color: #27272a; }
        .modal-input:focus { border-color: #10b981; background: white; }
        .dark .modal-input:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default ProductMaster;