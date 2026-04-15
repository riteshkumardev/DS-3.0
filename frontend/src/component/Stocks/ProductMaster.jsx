import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Package, Tag, 
  BarChart3, Filter, X, ChevronRight, Save, Info 
} from 'lucide-react';
import { 
  getAllProducts, createProduct, updateProduct, deleteProduct 
} from '../../api/productApi'; // Path check kar lein
import Loader from '../Core_Component/Loader/Loader';

const ProductMaster = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Initial Form State matching your Schema
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

  // 1. Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProducts({ 
        name: searchTerm, 
        category: filterCategory 
      });
      if (res.data?.success) setProducts(res.data.data);
    } catch (err) {
      console.error("Product Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 2. Handle Form Submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
      } else {
        await createProduct(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchProducts();
    } catch (err) {
      alert("Error saving product: " + (err.response?.data?.message || err.message));
    }
  };

  // 3. Handle Edit
  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setIsModalOpen(true);
  };

  // 4. Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Kiya aap is product ko delete karna chahte hain?")) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (err) { console.error(err); }
    }
  };

  if (loading && products.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl"><Package size={24}/></div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Product Master</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dharashakti Inventory Management</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData(initialFormState); }}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={18}/> ADD NEW PRODUCT
          </button>
        </div>

        {/* --- FILTERS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Name or HSN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 text-sm font-bold dark:text-white"
            />
          </div>
          <select 
            className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm font-bold dark:text-white outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">ALL CATEGORIES</option>
            {['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* --- PRODUCT GRID/TABLE --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-8 py-5">Category & HSN</th>
                  <th className="px-8 py-5">Stock Info</th>
                  <th className="px-8 py-5 text-right">Pricing (₹)</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {products.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="px-8 py-5">
                      <p className="font-black text-zinc-800 dark:text-zinc-100 text-sm">{item.name}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase">{item.unit}</span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-black text-emerald-600 uppercase">{item.category}</p>
                      <p className="text-[10px] text-zinc-400 font-bold tracking-tighter">HSN: {item.hsnCode}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`text-sm font-black ${item.currentStock <= item.minStockLevel ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {item.currentStock} {item.unit}
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Min Limit: {item.minStockLevel}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">Sale: ₹{item.salesPrice}</p>
                      <p className="text-[9px] text-zinc-400 font-bold">GST: {item.gstRate}%</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16}/></button>
                        <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16}/></button>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border border-white/20">
              <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-8 border-b dark:border-zinc-800 flex justify-between items-center z-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">
                  {editingId ? 'Update Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:rotate-90 transition-all"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Product Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Product Name</label>
                    <input 
                      required 
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-sm font-bold dark:text-white"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      placeholder="E.G. CORN GRIT (A GRADE)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Category</label>
                      <select 
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none text-sm font-bold dark:text-white appearance-none"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">HSN Code</label>
                      <input 
                        required 
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none text-sm font-bold dark:text-white"
                        value={formData.hsnCode}
                        onChange={e => setFormData({...formData, hsnCode: e.target.value})}
                        placeholder="8 Digit HSN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Unit</label>
                      <select 
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                      >
                        {['KG', 'QUINTAL', 'TON', 'BAG', 'PACKET', 'LTR', 'PCS'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">GST Rate (%)</label>
                      <select 
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white"
                        value={formData.gstRate}
                        onChange={e => setFormData({...formData, gstRate: Number(e.target.value)})}
                      >
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Purchase Price (₹)</label>
                      <input 
                        type="number"
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white"
                        value={formData.purchasePrice}
                        onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Sales Price (₹)</label>
                      <input 
                        type="number"
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white"
                        value={formData.salesPrice}
                        onChange={e => setFormData({...formData, salesPrice: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Min Stock Alert Level</label>
                    <input 
                      type="number"
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white"
                      value={formData.minStockLevel}
                      onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Description / Remarks</label>
                    <textarea 
                      rows="3"
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-bold dark:text-white outline-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 mt-4 pt-6 border-t dark:border-zinc-800 flex gap-3">
                  <button type="submit" className="flex-1 p-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl">
                    <Save size={20}/> {editingId ? 'Update Product Details' : 'Save Product to Master'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-[1.5rem] font-black uppercase text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMaster;