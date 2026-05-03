// frontend/src/components/Invoice/InvoiceList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { invoiceAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import './Invoice.css';

const STATUS_BADGE = { paid:'badge-green', draft:'badge-yellow', refunded:'badge-purple', cancelled:'badge-red' };

export default function InvoiceList({ onView }) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [meta,     setMeta]     = useState({});
  const [filters,  setFilters]  = useState({ status: '', search: '', from: '', to: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.getAll({ ...filters, page, limit: 20 });
      setInvoices(data.data);
      setMeta(data.meta);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const handleView = async (id) => {
    const { data } = await invoiceAPI.getById(id);
    onView?.(data.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    await invoiceAPI.remove(id);
    toast.success('Invoice deleted');
    load();
  };

  const fmt  = (n)   => `PKR ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  const fdate= (iso) => new Date(iso).toLocaleDateString('en-PK');
  const setF = (k)   => (e) => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row">
          <div className="form-group">
            <input className="form-control" placeholder="Search invoice #…" value={filters.search} onChange={setF('search')} />
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <select className="form-control" value={filters.status} onChange={setF('status')}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 150 }}>
            <input className="form-control" type="date" value={filters.from} onChange={setF('from')} />
          </div>
          <div className="form-group" style={{ maxWidth: 150 }}>
            <input className="form-control" type="date" value={filters.to} onChange={setF('to')} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Cashier</th><th>Date</th><th>Payment</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} className="tbl-empty">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_number}</td>
                  <td>{inv.customers?.name || 'Walk-in'}</td>
                  <td>{inv.profiles?.full_name}</td>
                  <td>{fdate(inv.created_at)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{inv.payment_method}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(inv.grand_total)}</td>
                  <td><span className={`badge ${STATUS_BADGE[inv.status]}`}>{inv.status}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleView(inv.id)}>View</button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(inv.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span>Page {page} of {meta.pages || 1} · {meta.total || 0} total</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= (meta.pages || 1)} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
