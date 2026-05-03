// backend/controllers/productController.js
const { supabaseAdmin } = require('../utils/supabase');
const db = supabaseAdmin;

exports.getAll = async (req, res, next) => {
  try {
    const { search, category_id, low_stock, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let q = db.from('products')
      .select('*, categories(name), suppliers(name)', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + +limit - 1);

    if (search)      q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    if (category_id) q = q.eq('category_id', category_id);
    if (low_stock === 'true') q = q.filter('stock', 'lte', db.raw('min_stock'));

    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { data, error } = await db.from('products')
      .select('*, categories(name), suppliers(name)')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const { data, error } = await db.from('products')
      .select('*').eq('barcode', req.params.barcode).single();
    if (error) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { data, error } = await db.from('products').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await db.from('products')
      .update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.from('products').update({ is_active: false }).eq('id', req.params.id);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const { data, error } = await db.from('products')
      .select('*').filter('stock', 'lte', db.raw('min_stock')).eq('is_active', true);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { data, error } = await db.from('categories').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
