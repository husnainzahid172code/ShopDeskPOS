# ShopDesk POS — Full Stack Application

Complete Point-of-Sale system built with React + Node.js/Express + Supabase PostgreSQL.

---

## 📁 Project Structure

```
shopdesk/
├── database/
│   └── schema.sql              ← Run first in Supabase SQL Editor
│
├── backend/
│   ├── server.js               ← Express app
│   ├── package.json
│   ├── .env.example
│   ├── middleware/
│   │   ├── authMiddleware.js   ← JWT verification
│   │   └── roleGuard.js        ← Role-based access
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── invoiceController.js
│   │   ├── expenseController.js
│   │   ├── customerController.js
│   │   ├── dashboardController.js
│   │   ├── reportController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── reportRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       └── supabase.js         ← Supabase clients
│
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx             ← Router + protected routes
        ├── index.js
        ├── context/
        │   └── AuthContext.jsx ← Global auth state
        ├── utils/
        │   └── api.js          ← All API calls (axios)
        ├── styles/
        │   └── global.css      ← Design tokens & shared components
        └── components/
            ├── Layout/         ← Sidebar + topbar
            ├── Auth/           ← Login + Register
            ├── Dashboard/      ← KPIs + Charts
            ├── Inventory/      ← Product CRUD
            ├── POS/            ← Billing screen
            ├── Invoice/        ← List + View + Print
            ├── Expenses/       ← Expense CRUD
            ├── Reports/        ← Sales/Expense/Profit + CSV
            └── Users/          ← Admin user management
```

---

## 🚀 Setup (Step by Step)

### Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → New Query
3. Paste the entire contents of `database/schema.sql`
4. Click **Run**
5. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Settings → API

---

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev        # Runs on http://localhost:5000
```

Test it:
```
GET http://localhost:5000/api/health
```

---

### Step 3 — Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase URL and Anon Key
npm install
npm start          # Runs on http://localhost:3000
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| POST   | /api/auth/register | Create account       |
| POST   | /api/auth/login    | Login → returns JWT  |
| GET    | /api/auth/me       | Current user info    |

### Products
| Method | Endpoint                    | Role    |
|--------|-----------------------------|---------|
| GET    | /api/products               | All     |
| GET    | /api/products/barcode/:code | All     |
| POST   | /api/products               | Admin   |
| PUT    | /api/products/:id           | Admin   |
| DELETE | /api/products/:id           | Admin   |

### Invoices
| Method | Endpoint                 | Description         |
|--------|--------------------------|---------------------|
| GET    | /api/invoices            | List (paginated)    |
| POST   | /api/invoices            | Create + decrement stock |
| GET    | /api/invoices/:id        | Single with items   |
| PUT    | /api/invoices/:id/status | Update status       |
| DELETE | /api/invoices/:id        | Delete (admin)      |

### Dashboard
| GET /api/dashboard/summary      | KPI stats          |
| GET /api/dashboard/sales-chart  | Chart data         |
| GET /api/dashboard/top-products | Top 5 products     |

### Reports
| GET /api/reports/sales?format=csv    | Sales CSV export   |
| GET /api/reports/expenses?format=csv | Expenses CSV export |
| GET /api/reports/profit              | Profit analysis    |

---

## ✨ Features by Module

| Module        | Features                                                              |
|---------------|-----------------------------------------------------------------------|
| Auth          | Register, Login, JWT, RBAC (admin/manager/cashier), auto-profile      |
| Inventory     | Product CRUD, categories, barcode, SKU, stock tracking, low-stock     |
| POS Billing   | Barcode scan, product search, cart, quantity control, checkout        |
| Invoices      | Auto-number, PDF print, WhatsApp share, status management, pagination |
| Dashboard     | Sales KPIs, 14-day bar chart, top 5 products, profit summary          |
| Expenses      | CRUD, categories, date filter, paid-by tracking                       |
| Reports       | Sales/Expenses/Profit reports, date range filter, CSV export          |
| Users         | Admin-only: view users, change roles, enable/disable accounts         |

---

## 🔧 Environment Variables

### Backend `.env`
```
PORT=5000
CLIENT_URL=http://localhost:3000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Frontend `.env`
```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Deploy /build folder to Vercel
# Set env vars in Vercel dashboard
```

### Backend → Railway / Render
```bash
# Add env vars in dashboard
# Deploy from GitHub
# Set PORT in env
```
