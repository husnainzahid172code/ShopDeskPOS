// backend/routes/invoiceRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/invoiceController');
r.get('/',           c.getAll);
r.post('/',          c.create);
r.get('/:id',        c.getById);
r.put('/:id/status', c.updateStatus);
r.delete('/:id',     c.remove);
module.exports = r;
