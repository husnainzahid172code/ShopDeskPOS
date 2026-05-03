// frontend/src/components/Expenses/ExpensePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const EMPTY = { title: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function ExpensePage() {
  const [expenses,  setExpenses]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [filters,   setFilters]   = useState({ from: '', to: '', category_id: '' });
  const [page,      setPage]      = useState(1);
  const [meta,      setMeta]      = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await expenseAPI.getAll({ ...filters, page, limit: 20 });
      setExpenses(data.data); setMeta(data.meta);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { expenseAPI.getCategories().then(({ data }) => setCats(data.data)); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (e) => { setForm({ ...e, category_id: e.category_id || '' }); setEditing(e); setModal(true); };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    try {
      if (editing) { await expenseAPI.update(editing.id, form); toast.success('Updated'); }
      else         { await expenseAPI.create(form);             toast.success('Expense added'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete expense?')) return;
    await expenseAPI.remove(id); toast.success('Deleted'); load();
  };

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK')}`;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setF= (k) => (e) => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); };
  const totalAmt = expenses.reduce((s, e) => s + +e.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Total (filtered)</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{fmt(totalAmt)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Records</div>
          <div className="stat-value">{meta.total || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row">
          <div className="form-group"><input className="form-control" type="date" value={filters.from} onChange={setF('from')} /></div>
          <div className="form-group"><input className="form-control" type="date" value={filters.to}   onChange={setF('to')} /></div>
          <div className="form-group" style={{ maxWidth: 180 }}>
            <select className="form-control" value={filters.category_id} onChange={setF('category_id')}>
              <option value="">All Categories</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Paid By</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="tbl-empty"><div className="spinner" style={{ margin: '20px auto' }} /></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={7} className="tbl-empty">No expenses found</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td style={{ fontWeight: 600 }}>{e.title}</td>
                <td><span className="badge badge-blue">{e.expense_categories?.name}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(e.amount)}</td>
                <td>{e.profiles?.full_name}</td>
                <td style={{ color: 'var(--ink-2)', fontSize: 12 }}>{e.notes || '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => openEdit(e)}>Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDelete(e.id)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
        <span>Page {page} · {meta.total || 0} total</span>
        <button className="btn btn-ghost btn-sm" disabled={expenses.length < 20} onClick={() => setPage(p => p+1)}>Next →</button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit' : 'Add'} Expense</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Title *</label>
                  <input className="form-control" required value={form.title} onChange={set('title')} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Amount *</label>
                    <input className="form-control" type="number" min="0" step="0.01" required
                      value={form.amount} onChange={set('amount')} /></div>
                  <div className="form-group"><label>Date *</label>
                    <input className="form-control" type="date" required value={form.date} onChange={set('date')} /></div>
                </div>
                <div className="form-group"><label>Category</label>
                  <select className="form-control" value={form.category_id} onChange={set('category_id')}>
                    <option value="">Select…</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div className="form-group"><label>Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
