// backend/routes/productRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/productController');
const guard = require('../middleware/roleGuard');

r.get('/',                    c.getAll);
r.get('/low-stock',           c.getLowStock);
r.get('/categories',          c.getCategories);
r.get('/barcode/:barcode',    c.getByBarcode);
r.get('/:id',                 c.getById);
r.post('/',   guard('admin','manager'), c.create);
r.put('/:id', guard('admin','manager'), c.update);
r.delete('/:id', guard('admin'),        c.remove);

module.exports = r;
