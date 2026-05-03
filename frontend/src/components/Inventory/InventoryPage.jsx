// frontend/src/components/Inventory/InventoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const EMPTY = { name:'', sku:'', barcode:'', description:'', category_id:'', selling_price:'',
                purchase_price:'', tax_rate:0, stock:0, min_stock:5, unit:'pcs' };

export default function InventoryPage() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [modal,      setModal]      = useState(null);   // null | 'add' | 'edit'
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [page,       setPage]       = useState(1);
  const [meta,       setMeta]       = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ search, category_id: catFilter, page, limit: 25 });
      setProducts(data.data);
      setMeta(data.meta);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    productAPI.getCategories().then(({ data }) => setCategories(data.data));
  }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal('add'); };
  const openEdit = (p) => { setForm({ ...p, category_id: p.category_id || '' }); setEditing(p); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await productAPI.create(form);
        toast.success('Product added');
      } else {
        await productAPI.update(editing.id, form);
        toast.success('Product updated');
      }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await productAPI.remove(id);
    toast.success('Product deactivated');
    load();
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <input className="form-control" placeholder="Search name, SKU, barcode…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <select className="form-control" value={catFilter}
              onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th><th>SKU</th><th>Category</th>
                <th>Buy Price</th><th>Sell Price</th><th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} className="tbl-empty">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.barcode}</div></td>
                  <td style={{ fontFamily: 'monospace' }}>{p.sku || '—'}</td>
                  <td>{p.categories?.name || '—'}</td>
                  <td>PKR {Number(p.purchase_price).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>PKR {Number(p.selling_price).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.stock <= p.min_stock ? 'badge-red' : 'badge-green'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(p.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span>Page {page} of {Math.ceil((meta.total || 0) / 25) || 1} · {meta.total || 0} total</span>
        <button className="btn btn-ghost btn-sm" disabled={page * 25 >= (meta.total || 0)} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? 'Add Product' : 'Edit Product'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Name *</label>
                    <input className="form-control" required value={form.name} onChange={set('name')} /></div>
                  <div className="form-group"><label>SKU</label>
                    <input className="form-control" value={form.sku} onChange={set('sku')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Barcode</label>
                    <input className="form-control" value={form.barcode} onChange={set('barcode')} /></div>
                  <div className="form-group"><label>Category</label>
                    <select className="form-control" value={form.category_id} onChange={set('category_id')}>
                      <option value="">Select…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Purchase Price</label>
                    <input className="form-control" type="number" min="0" step="0.01"
                      value={form.purchase_price} onChange={set('purchase_price')} /></div>
                  <div className="form-group"><label>Selling Price *</label>
                    <input className="form-control" type="number" min="0" step="0.01" required
                      value={form.selling_price} onChange={set('selling_price')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Tax Rate (%)</label>
                    <input className="form-control" type="number" min="0" max="100"
                      value={form.tax_rate} onChange={set('tax_rate')} /></div>
                  <div className="form-group"><label>Stock</label>
                    <input className="form-control" type="number" min="0"
                      value={form.stock} onChange={set('stock')} /></div>
                  <div className="form-group"><label>Min Stock</label>
                    <input className="form-control" type="number" min="0"
                      value={form.min_stock} onChange={set('min_stock')} /></div>
                  <div className="form-group"><label>Unit</label>
                    <input className="form-control" value={form.unit} onChange={set('unit')} /></div>
                </div>
                <div className="form-group"><label>Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={set('description')} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {modal === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
