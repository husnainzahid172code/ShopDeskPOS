// backend/controllers/customerController.js
const { supabaseAdmin: db } = require('../utils/supabase');

exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    let q = db.from('customers').select('*', { count: 'exact' }).order('name');
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { data, error } = await db.from('customers').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { data, error } = await db.from('customers').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await db.from('customers').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.from('customers').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.getPurchaseHistory = async (req, res, next) => {
  try {
    const { data, error } = await db.from('invoices')
      .select('*, invoice_items(*)').eq('customer_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
