-- ============================================================
-- STUDENT FEE SYSTEM - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. STUDENTS
-- ============================================================
CREATE TYPE student_status AS ENUM ('Paid', 'Partial', 'Unpaid');

CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    TEXT UNIQUE NOT NULL,
  student_name  TEXT NOT NULL,
  father_name   TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  course        TEXT DEFAULT '',
  batch         TEXT DEFAULT '',
  admission_date TEXT DEFAULT '',
  total_fee     NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid          NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        student_status NOT NULL DEFAULT 'Unpaid',
  payment_method TEXT DEFAULT '',
  payment_date  TEXT DEFAULT '',
  remarks       TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_status ON students(status);

-- ============================================================
-- 2. TRANSACTIONS
-- ============================================================
CREATE TYPE tx_type AS ENUM ('Fee Payment', 'Installment', 'Expense', 'Refund', 'Other');
CREATE TYPE tx_method AS ENUM ('Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other');

CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_no    TEXT,
  student_id    TEXT,
  student_name  TEXT NOT NULL DEFAULT 'N/A',
  type          tx_type NOT NULL DEFAULT 'Fee Payment',
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  method        tx_method NOT NULL DEFAULT 'Cash',
  description   TEXT NOT NULL DEFAULT '',
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date DESC);

-- ============================================================
-- 3. EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT 'Other',
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date DESC);

-- ============================================================
-- 4. INSTALLMENTS
-- ============================================================
CREATE TYPE installment_status AS ENUM ('Pending', 'Paid', 'Overdue');

CREATE TABLE installments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    TEXT NOT NULL,
  student_name  TEXT NOT NULL DEFAULT '',
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  installment_1 NUMERIC(12,2) NOT NULL DEFAULT 0,
  installment_2 NUMERIC(12,2) NOT NULL DEFAULT 0,
  installment_3 NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date_1    DATE,
  due_date_2    DATE,
  due_date_3    DATE,
  status        installment_status NOT NULL DEFAULT 'Pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installments_student_id ON installments(student_id);
CREATE INDEX idx_installments_status ON installments(status);

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. ROW LEVEL SECURITY (auth users only)
-- ============================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON installments FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE installments;
