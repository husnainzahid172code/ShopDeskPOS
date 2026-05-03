-- ================================================================
--  Cleanup Script - Run this FIRST to drop existing tables
--  Then run schema.sql
-- ================================================================

-- Drop policies first
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_all_invoices" ON invoices;
DROP POLICY IF EXISTS "admin_all_expenses" ON expenses;
DROP POLICY IF EXISTS "admin_all_customers" ON customers;
DROP POLICY IF EXISTS "admin_all_suppliers" ON suppliers;
DROP POLICY IF EXISTS "admin_all_categories" ON categories;
DROP POLICY IF EXISTS "admin_all_products" ON products;
DROP POLICY IF EXISTS "cashier_insert_items" ON invoice_items;
DROP POLICY IF EXISTS "cashier_insert_invoice" ON invoices;
DROP POLICY IF EXISTS "auth_read_exp_cats" ON expense_categories;
DROP POLICY IF EXISTS "auth_read_expenses" ON expenses;
DROP POLICY IF EXISTS "auth_read_inv_items" ON invoice_items;
DROP POLICY IF EXISTS "auth_read_invoices" ON invoices;
DROP POLICY IF EXISTS "auth_read_customers" ON customers;
DROP POLICY IF EXISTS "auth_read_suppliers" ON suppliers;
DROP POLICY IF EXISTS "auth_read_categories" ON categories;
DROP POLICY IF EXISTS "auth_read_products" ON products;
DROP POLICY IF EXISTS "auth_read_profiles" ON profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_expenses_upd ON expenses;
DROP TRIGGER IF EXISTS trg_invoices_upd ON invoices;
DROP TRIGGER IF EXISTS trg_customers_upd ON customers;
DROP TRIGGER IF EXISTS trg_products_upd ON products;
DROP TRIGGER IF EXISTS trg_profiles_upd ON profiles;
DROP TRIGGER IF EXISTS trg_invoice_number ON invoices;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS set_invoice_number();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS invoice_seq;
