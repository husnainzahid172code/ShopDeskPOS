// frontend/src/components/Invoice/InvoiceView.jsx
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { invoiceAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import './Invoice.css';

const STATUS_COLOR = { paid: '#059669', draft: '#d97706', refunded: '#6d28d9', cancelled: '#dc2626' };

export default function InvoiceView({ invoice, onClose, onStatusChange }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const handleShare = () => {
    const msg = encodeURIComponent(
      `Invoice: ${invoice.invoice_number}\nAmount: PKR ${invoice.grand_total}\nDate: ${new Date(invoice.created_at).toLocaleDateString()}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleStatusChange = async (status) => {
    try {
      await invoiceAPI.updateStatus(invoice.id, status);
      toast.success(`Marked as ${status}`);
      onStatusChange?.(status);
    } catch { toast.error('Update failed'); }
  };

  if (!invoice) return null;
  const fmt  = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  const date = new Date(invoice.created_at).toLocaleString('en-PK');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="inv-view" onClick={e => e.stopPropagation()}>
        {/* Actions */}
        <div className="inv-actions">
          <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨 Print</button>
          <button className="btn btn-ghost btn-sm inv-share" onClick={handleShare}>💬 WhatsApp</button>
          <select className="form-control" style={{ maxWidth: 140, padding: '5px 10px', fontSize: 12 }}
            value={invoice.status} onChange={e => handleStatusChange(e.target.value)}>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-danger btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        {/* Printable area */}
        <div className="inv-doc" ref={printRef}>
          <div className="inv-doc__head">
            <div className="inv-doc__brand">
              <div className="inv-doc__logo">SD</div>
              <div>
                <div className="inv-doc__store">ShopDesk POS</div>
                <div className="inv-doc__sub">Smart Retail Management</div>
              </div>
            </div>
            <div className="inv-doc__meta">
              <div className="inv-doc__num">{invoice.invoice_number}</div>
              <div className="inv-doc__date">{date}</div>
              <span className="badge" style={{ background: STATUS_COLOR[invoice.status], color: '#fff', marginTop: 4 }}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '16px 0' }} />

          <div className="inv-doc__parties">
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.customers?.name || 'Walk-in Customer'}</div>
              {invoice.customers?.phone && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{invoice.customers.phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>Cashier</div>
              <div style={{ fontWeight: 600 }}>{invoice.profiles?.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', textTransform: 'capitalize' }}>{invoice.payment_method}</div>
            </div>
          </div>

          <table className="tbl" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Tax</th><th>Total</th></tr>
            </thead>
            <tbody>
              {(invoice.invoice_items || []).map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td><div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.sku}</div></td>
                  <td>{item.qty}</td>
                  <td>{fmt(item.unit_price)}</td>
                  <td>{item.tax_rate}%</td>
                  <td style={{ fontWeight: 700 }}>{fmt(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-doc__totals">
            <div className="inv-doc__total-row"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
            {invoice.discount_amount > 0 && (
              <div className="inv-doc__total-row" style={{ color: 'var(--red)' }}>
                <span>Discount</span><span>−{fmt(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="inv-doc__total-row"><span>Tax</span><span>{fmt(invoice.tax_amount)}</span></div>
            <div className="inv-doc__total-row inv-doc__total-grand">
              <span>Grand Total</span><span>{fmt(invoice.grand_total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface-2)',
              borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--ink-2)' }}>
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-3)',
            borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            Thank you for your business! • Generated by ShopDesk POS
          </div>
        </div>
      </div>
    </div>
  );
}
