// backend/routes/dashboardRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/dashboardController');
r.get('/summary',      c.getSummary);
r.get('/sales-chart',  c.getSalesChart);
r.get('/top-products', c.getTopProducts);
module.exports = r;
