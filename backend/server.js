// ================================================================
//  ShopDesk POS — Backend Server
//  Node.js + Express + Supabase
// ================================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes      = require('./routes/authRoutes');
const productRoutes   = require('./routes/productRoutes');
const invoiceRoutes   = require('./routes/invoiceRoutes');
const expenseRoutes   = require('./routes/expenseRoutes');
const customerRoutes  = require('./routes/customerRoutes');
const reportRoutes    = require('./routes/reportRoutes');
const userRoutes      = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authMiddleware  = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// Public
app.get('/', (req, res) => {
  // root path to avoid "Cannot GET /" when visiting the backend directly
  res.send('ShopDesk POS API running');
});
app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'ShopDesk POS' }));
app.use('/api/auth', authRoutes);

// Protected
app.use('/api/products',  authMiddleware, productRoutes);
app.use('/api/invoices',  authMiddleware, invoiceRoutes);
app.use('/api/expenses',  authMiddleware, expenseRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/reports',   authMiddleware, reportRoutes);
app.use('/api/users',     authMiddleware, userRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`🚀  ShopDesk API → http://localhost:${PORT}`));
