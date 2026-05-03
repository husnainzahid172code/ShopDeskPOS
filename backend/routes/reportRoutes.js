// backend/routes/reportRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/reportController');
r.get('/sales',    c.getSalesReport);
r.get('/expenses', c.getExpensesReport);
r.get('/profit',   c.getProfitReport);
module.exports = r;
