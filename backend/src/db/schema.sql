-- ============================================================
-- BusinessZhumashBank — Full Database Schema
-- Run this in Supabase SQL Editor (single execution)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('IP', 'TOO')),
  iin TEXT NOT NULL,
  company TEXT,
  registration_date TEXT,
  city TEXT DEFAULT 'Алматы',
  -- Subscription / role
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('developer', 'paid', 'free')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BANK ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KZT' CHECK (currency IN ('KZT', 'USD', 'EUR', 'RUB')),
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  -- Contractor info (embedded JSON for simplicity)
  contractor_name TEXT,
  contractor_iin TEXT,
  contractor_phone TEXT,
  contractor_email TEXT,
  contractor_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MILESTONES (payment stages per project)
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('contract', 'invoice', 'receipt', 'report', 'statement', 'other')),
  file_path TEXT,
  file_size TEXT,
  ai_analysis JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECEIPTS (virtual cash register)
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_iin TEXT,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  seller_name TEXT,
  seller_iin TEXT,
  seller_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- PAYROLL TRANSACTIONS (parsed from bank statements)
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  employee_name TEXT,
  amount NUMERIC(18,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'salary' CHECK (type IN ('salary', 'bonus', 'advance')),
  description TEXT,
  transaction_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STRIPE SUBSCRIPTIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT,
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_user ON payroll_transactions(user_id);
