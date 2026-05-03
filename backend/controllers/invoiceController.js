// backend/controllers/invoiceController.js
const { supabaseAdmin: db } = require('../utils/supabase');

exports.create = async (req, res, next) => {
  try {
    const { customer_id, items, discount_amount = 0, payment_method = 'cash', notes = '' } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'Items required' });

    let subtotal = 0, tax_amount = 0;
    const processedItems = items.map(item => {
      const base = item.unit_price * item.qty;
      const disc = item.discount || 0;
      const tax  = (base - disc) * (item.tax_rate || 0) / 100;
      subtotal   += base;
      tax_amount += tax;
      return { product_id: item.product_id || null, name: item.name, sku: item.sku || null,
               qty: item.qty, unit_price: item.unit_price, tax_rate: item.tax_rate || 0, discount: disc };
    });

    const grand_total = subtotal - discount_amount + tax_amount;

    const { data: invoice, error: invErr } = await db.from('invoices').insert({
      customer_id, cashier_id: req.user.id, status: 'paid',
      subtotal: +subtotal.toFixed(2), discount_amount: +discount_amount.toFixed(2),
      tax_amount: +tax_amount.toFixed(2), grand_total: +grand_total.toFixed(2),
      payment_method, notes,
    }).select().single();
    if (invErr) throw invErr;

    const { error: itemErr } = await db.from('invoice_items')
      .insert(processedItems.map(i => ({ ...i, invoice_id: invoice.id })));
    if (itemErr) throw itemErr;

    // Decrement stock
    for (const item of items) {
      if (item.product_id) {
        const { data: p } = await db.from('products').select('stock').eq('id', item.product_id).single();
        if (p) await db.from('products').update({ stock: Math.max(0, p.stock - item.qty) }).eq('id', item.product_id);
      }
    }

    const { data: full } = await db.from('invoices')
      .select('*, customers(*), invoice_items(*), profiles(full_name)')
      .eq('id', invoice.id).single();

    res.status(201).json({ success: true, data: full });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, from, to, search } = req.query;
    const offset = (page - 1) * limit;
    let q = db.from('invoices')
      .select('*, customers(name, phone), profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + +limit - 1);
    if (status) q = q.eq('status', status);
    if (from)   q = q.gte('created_at', from);
    if (to)     q = q.lte('created_at', to + 'T23:59:59');
    if (search) q = q.ilike('invoice_number', `%${search}%`);
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: +page, limit: +limit, pages: Math.ceil(count / +limit) } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { data, error } = await db.from('invoices')
      .select('*, customers(*), invoice_items(*), profiles(full_name)')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { data, error } = await db.from('invoices').update({ status })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });
    await db.from('invoices').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
