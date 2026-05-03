// frontend/src/components/POS/POSPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { productAPI, invoiceAPI, customerAPI } from '../../utils/api';
import InvoiceView from '../Invoice/InvoiceView';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/library';
import './POS.css';

const EMPTY_CART = [];

export default function POSPage() {
  const [search,     setSearch]     = useState('');
  const [searchRes,  setSearchRes]  = useState([]);
  const [cart,       setCart]       = useState(EMPTY_CART);
  const [discount,   setDiscount]   = useState(0);
  const [payment,    setPayment]    = useState('cash');
  const [customer,   setCustomer]   = useState({ name: 'Walk-in Customer', id: null });
  const [custSearch, setCustSearch] = useState('');
  const [custRes,    setCustRes]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [invoice,    setInvoice]    = useState(null);
  const [scanOpen,   setScanOpen]   = useState(false);
  const [scanError,  setScanError]  = useState('');
  const searchRef = useRef();
  const scannerRef = useRef(null);

  // ── Product search ──
  const handleSearch = async (val) => {
    setSearch(val);
    if (!val.trim()) { setSearchRes([]); return; }
    const { data } = await productAPI.getAll({ search: val, limit: 8 });
    setSearchRes(data.data || []);
  };

  const lookupBarcode = async (code) => {
    if (!code?.trim()) return;
    try {
      const { data } = await productAPI.getByBarcode(code.trim());
      addToCart(data.data);
      setSearch(''); setSearchRes([]);
    } catch { toast.error('Product not found'); }
  };

  const handleBarcode = async (e) => {
    if (e.key !== 'Enter') return;
    lookupBarcode(search);
  };

  // ── Cart operations ──
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        product_id: product.id, name: product.name, sku: product.sku,
        unit_price: product.selling_price, qty: 1,
        tax_rate: product.tax_rate || 0, discount: 0,
      }];
    });
    setSearch(''); setSearchRes([]);
  };

  const updateQty = (pid, qty) => {
    if (qty <= 0) { removeItem(pid); return; }
    setCart(prev => prev.map(i => i.product_id === pid ? { ...i, qty: +qty } : i));
  };

  const removeItem = (pid) => setCart(prev => prev.filter(i => i.product_id !== pid));

  const clearCart = () => { setCart(EMPTY_CART); setDiscount(0); };

  // ── Totals ──
  const subtotal   = cart.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const taxTotal   = cart.reduce((s, i) => s + (i.unit_price * i.qty) * (i.tax_rate / 100), 0);
  const grandTotal = subtotal + taxTotal - discount;

  // ── Customer search ──
  const handleCustSearch = async (val) => {
    setCustSearch(val);
    if (!val.trim()) { setCustRes([]); return; }
    const { data } = await customerAPI.getAll({ search: val });
    setCustRes(data.data || []);
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setLoading(true);
    try {
      const { data } = await invoiceAPI.create({
        customer_id: customer.id, items: cart,
        discount_amount: +discount, payment_method: payment,
      });
      const inv = data.data;
      // Fetch full invoice with items
      const full = await invoiceAPI.getById(inv.id);
      setInvoice(full.data.data);
      clearCart();
      setCustomer({ name: 'Walk-in Customer', id: null });
      toast.success(`Invoice ${inv.invoice_number} created!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Checkout failed'); }
    finally { setLoading(false); }
  };

  const fmt = (n) => `PKR ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

  // ── Camera barcode scanner ──
  useEffect(() => {
    if (!scanOpen) {
      if (scannerRef.current) {
        scannerRef.current.reset();
        scannerRef.current = null;
      }
      return;
    }

    const reader = new BrowserMultiFormatReader();
    scannerRef.current = reader;
    setScanError('');

    reader.decodeFromVideoDevice(null, 'shopdesk-barcode-video', (result, err) => {
      if (result) {
        const code = result.getText();
        lookupBarcode(code);
        setScanOpen(false);
      }
    }).catch(() => {
      setScanError('Unable to access camera. Please check permissions.');
    });

    return () => {
      reader.reset();
    };
  }, [scanOpen]);

  return (
    <div className="pos">
      {/* ── Left: Products ── */}
      <div className="pos__left">
        <div className="pos__header">
          <h2 className="pos__title">POS Billing</h2>
        </div>

        {/* Search bar */}
        <div className="pos__search-wrap">
          <input
            ref={searchRef}
            className="pos__search"
            placeholder="Search product or scan barcode & press Enter…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleBarcode}
            autoFocus
          />
          <button
            type="button"
            className="pos__scan-btn"
            onClick={() => setScanOpen(true)}
          >
            📷 Scan
          </button>
          {searchRes.length > 0 && (
            <div className="pos__search-dropdown">
              {searchRes.map(p => (
                <div key={p.id} className="pos__search-item" onClick={() => addToCart(p)}>
                  <div>
                    <div className="pos__search-name">{p.name}</div>
                    <div className="pos__search-meta">{p.sku} · Stock: {p.stock}</div>
                  </div>
                  <div className="pos__search-price">{fmt(p.selling_price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="pos__cart">
          {cart.length === 0 ? (
            <div className="pos__empty">🛒 Cart is empty. Search or scan a product to begin.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Tax</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.sku}</div>
                    </td>
                    <td>{fmt(item.unit_price)}</td>
                    <td>
                      <div className="pos__qty-ctrl">
                        <button onClick={() => updateQty(item.product_id, item.qty - 1)}>−</button>
                        <input type="number" min="1" value={item.qty}
                          onChange={e => updateQty(item.product_id, e.target.value)} />
                        <button onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                      </div>
                    </td>
                    <td>{item.tax_rate}%</td>
                    <td style={{ fontWeight: 700 }}>{fmt(item.unit_price * item.qty)}</td>
                    <td><button className="btn btn-danger btn-xs" onClick={() => removeItem(item.product_id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Right: Checkout ── */}
      <div className="pos__right">
        <div className="pos__checkout">
          {/* Customer */}
          <div className="pos__section">
            <div className="pos__section-title">Customer</div>
            <div style={{ position: 'relative' }}>
              <input className="form-control" placeholder="Search customer…"
                value={custSearch} onChange={e => handleCustSearch(e.target.value)} />
              {custRes.length > 0 && (
                <div className="pos__search-dropdown">
                  {custRes.map(c => (
                    <div key={c.id} className="pos__search-item"
                      onClick={() => { setCustomer({ name: c.name, id: c.id }); setCustSearch(c.name); setCustRes([]); }}>
                      <div>
                        <div className="pos__search-name">{c.name}</div>
                        <div className="pos__search-meta">{c.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pos__customer-name">👤 {customer.name}</div>
          </div>

          {/* Payment */}
          <div className="pos__section">
            <div className="pos__section-title">Payment Method</div>
            <div className="pos__pay-btns">
              {['cash','card','online','other'].map(m => (
                <button key={m} className={`pos__pay-btn ${payment === m ? 'pos__pay-btn--active' : ''}`}
                  onClick={() => setPayment(m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="pos__totals">
            <div className="pos__total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="pos__total-row"><span>Tax</span><span>{fmt(taxTotal)}</span></div>
            <div className="pos__total-row">
              <span>Discount</span>
              <input type="number" min="0" className="pos__discount-input"
                value={discount} onChange={e => setDiscount(+e.target.value)} />
            </div>
            <div className="pos__total-row pos__total-row--grand">
              <span>Grand Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <button className="btn btn-primary btn-full" style={{ fontSize: 15, padding: 14 }}
            onClick={handleCheckout} disabled={loading || cart.length === 0}>
            {loading ? 'Processing…' : `✓ Checkout · ${fmt(grandTotal)}`}
          </button>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop: 8 }} onClick={clearCart}>
              🗑 Clear Cart
            </button>
          )}
        </div>
      </div>

      {invoice && <InvoiceView invoice={invoice} onClose={() => setInvoice(null)} />}

      {scanOpen && (
        <div className="modal-overlay" onClick={() => setScanOpen(false)}>
          <div className="modal pos-scan-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Scan Barcode</span>
              <button className="modal-close" onClick={() => setScanOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 8 }}>
                Point your camera at the product barcode. Detected codes will be added to the cart automatically.
              </p>
              {scanError && (
                <p style={{ fontSize: 12, color: 'var(--red)' }}>{scanError}</p>
              )}
              <div className="pos-scan-video-wrap">
                <video id="shopdesk-barcode-video" className="pos-scan-video" autoPlay muted playsInline />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
