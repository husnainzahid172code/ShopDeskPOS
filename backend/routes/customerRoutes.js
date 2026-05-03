// backend/routes/customerRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/customerController');
r.get('/',                    c.getAll);
r.get('/:id',                 c.getById);
r.get('/:id/purchases',       c.getPurchaseHistory);
r.post('/',                   c.create);
r.put('/:id',                 c.update);
r.delete('/:id',              c.remove);
module.exports = r;
