-- ================================================================
--  ShopDesk POS — Complete Supabase Database Schema
--  Run this entire file in Supabase SQL Editor
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
--  PROFILES (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  VARCHAR(150),
  role       VARCHAR(20) NOT NULL DEFAULT 'cashier'
             CHECK (role IN ('admin','cashier','manager')),
  phone      VARCHAR(20),
  avatar_url TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name',
          COALESCE(NEW.raw_user_meta_data->>'role','cashier'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
--  CATEGORIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  SUPPLIERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(20),
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  PRODUCTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  sku           VARCHAR(50) UNIQUE,
  barcode       VARCHAR(100) UNIQUE,
  description   TEXT,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  stock          INTEGER       NOT NULL DEFAULT 0,
  min_stock      INTEGER       NOT NULL DEFAULT 5,
  unit           VARCHAR(20)   DEFAULT 'pcs',
  image_url      TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  CUSTOMERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
  email      VARCHAR(150),
  phone      VARCHAR(20),
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  INVOICES
-- ────────────────────────────────────────────────────────────
DROP SEQUENCE IF EXISTS invoice_seq;
CREATE SEQUENCE invoice_seq START 1;

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(30) UNIQUE NOT NULL DEFAULT '',
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id      UUID NOT NULL REFERENCES profiles(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'paid'
                  CHECK (status IN ('draft','paid','refunded','cancelled')),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(30) DEFAULT 'cash'
                  CHECK (payment_method IN ('cash','card','online','other')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(),'YYYY') || '-'
                        || LPAD(NEXTVAL('invoice_seq')::TEXT,5,'0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_number ON invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- ────────────────────────────────────────────────────────────
--  INVOICE ITEMS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  name        VARCHAR(200) NOT NULL,
  sku         VARCHAR(50),
  qty         INTEGER      NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  tax_rate    NUMERIC(5,2)  NOT NULL DEFAULT 0,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total  NUMERIC(12,2) GENERATED ALWAYS AS (
                (unit_price * qty) - discount +
                ((unit_price * qty - discount) * tax_rate / 100)
              ) STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  EXPENSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO expense_categories (name) VALUES
  ('Rent'),('Utilities'),('Salaries'),('Supplies'),
  ('Marketing'),('Maintenance'),('Transport'),('Other')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(200) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  paid_by     UUID REFERENCES profiles(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  AUTO updated_at TRIGGER (reusable)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_upd   ON profiles;
DROP TRIGGER IF EXISTS trg_products_upd   ON products;
DROP TRIGGER IF EXISTS trg_customers_upd  ON customers;
DROP TRIGGER IF EXISTS trg_invoices_upd   ON invoices;
DROP TRIGGER IF EXISTS trg_expenses_upd   ON expenses;

CREATE TRIGGER trg_profiles_upd   BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_upd   BEFORE UPDATE ON products   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_upd  BEFORE UPDATE ON customers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_upd   BEFORE UPDATE ON invoices   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_expenses_upd   BEFORE UPDATE ON expenses   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
--  INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created    ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer   ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cashier    ON invoices(cashier_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv   ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date       ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category_id);

-- ────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "auth_read_profiles" ON profiles;
DROP POLICY IF EXISTS "auth_read_products" ON products;
DROP POLICY IF EXISTS "auth_read_categories" ON categories;
DROP POLICY IF EXISTS "auth_read_suppliers" ON suppliers;
DROP POLICY IF EXISTS "auth_read_customers" ON customers;
DROP POLICY IF EXISTS "auth_read_invoices" ON invoices;
DROP POLICY IF EXISTS "auth_read_inv_items" ON invoice_items;
DROP POLICY IF EXISTS "auth_read_expenses" ON expenses;
DROP POLICY IF EXISTS "auth_read_exp_cats" ON expense_categories;
DROP POLICY IF EXISTS "cashier_insert_invoice" ON invoices;
DROP POLICY IF EXISTS "cashier_insert_items" ON invoice_items;
DROP POLICY IF EXISTS "admin_all_products" ON products;
DROP POLICY IF EXISTS "admin_all_categories" ON categories;
DROP POLICY IF EXISTS "admin_all_suppliers" ON suppliers;
DROP POLICY IF EXISTS "admin_all_customers" ON customers;
DROP POLICY IF EXISTS "admin_all_expenses" ON expenses;
DROP POLICY IF EXISTS "admin_all_invoices" ON invoices;
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;

-- Authenticated users can read everything
CREATE POLICY "auth_read_profiles"    ON profiles      FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_products"    ON products      FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_categories"  ON categories    FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_suppliers"   ON suppliers     FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_customers"   ON customers     FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_invoices"    ON invoices      FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_inv_items"   ON invoice_items FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_expenses"    ON expenses      FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_read_exp_cats"    ON expense_categories FOR SELECT USING (auth.role()='authenticated');

-- Cashiers: can insert invoices
CREATE POLICY "cashier_insert_invoice" ON invoices FOR INSERT WITH CHECK (auth.uid() = cashier_id);
CREATE POLICY "cashier_insert_items"   ON invoice_items FOR INSERT WITH CHECK (auth.role()='authenticated');

-- Admins: full access (set role in user_metadata)
CREATE POLICY "admin_all_products"   ON products   FOR ALL USING ((auth.jwt()->>'role')='admin' OR (SELECT role FROM profiles WHERE id=auth.uid())='admin');
CREATE POLICY "admin_all_categories" ON categories FOR ALL USING ((SELECT role FROM profiles WHERE id=auth.uid()) IN ('admin','manager'));
CREATE POLICY "admin_all_suppliers"  ON suppliers  FOR ALL USING ((SELECT role FROM profiles WHERE id=auth.uid()) IN ('admin','manager'));
CREATE POLICY "admin_all_customers"  ON customers  FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "admin_all_expenses"   ON expenses   FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "admin_all_invoices"   ON invoices   FOR ALL USING ((SELECT role FROM profiles WHERE id=auth.uid()) IN ('admin','manager'));
CREATE POLICY "admin_all_profiles"   ON profiles   FOR ALL USING ((SELECT role FROM profiles WHERE id=auth.uid())='admin');

-- ────────────────────────────────────────────────────────────
--  SEED DATA (optional demo data)
-- ────────────────────────────────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Electronics'),('Groceries'),('Clothing'),
  ('Stationery'),('Medicines'),('Beverages')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, email, phone) VALUES
  ('TechWorld Pvt Ltd',   'orders@techworld.pk',   '+92-21-1234567'),
  ('Fresh Mart Supplies', 'supply@freshmart.pk',   '+92-42-7654321'),
  ('MedPharma Co.',       'procurement@medpharma.pk', '+92-51-9876543')
ON CONFLICT DO NOTHING;
