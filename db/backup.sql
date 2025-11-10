-- ============================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- ============================================

PRAGMA foreign_keys = OFF;

-- ============================================
-- LIMPIEZA DE TABLAS (en orden correcto)
-- ============================================
DROP TABLE IF EXISTS pending_payments;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS recurring_expenses;
DROP TABLE IF EXISTS debt_installments;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    is_active INTEGER DEFAULT 1,
    auto_logout_minutes INTEGER DEFAULT 30
);

INSERT INTO users (username, password_hash, salt, email, full_name, last_login)
VALUES ('stephanofer', '3f9d5fac2a86a67f86f8f7ac17bd2708eda3e6f2c7f47f39e693f16d625d3ace', 
        'tH6rZ8ux/vSVqoENhCyRZg==', 'slowdown_4@hotmail.com', 
        'Stephano Fernandez', '2025-10-07 04:32:48');

-- ============================================
-- TABLA: accounts
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'debit', 'credit', 'bank', 'savings', 'investments')),
    balance REAL DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    color TEXT,
    icon TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

INSERT INTO accounts (user_id, name, type, color, icon)
VALUES 
    (1, 'Efectivo', 'cash', '#FFD166', '💵'),
    (1, 'Banco BCP', 'bank', '#06D6A0', '🏦'),
    (1, 'Tarjeta de Crédito', 'credit', '#EF476F', '💳'),
    (1, 'Ahorros', 'savings', '#118AB2', '💰'),
    (1, 'Yape', 'debit', '#9B5DE5', '📱');

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO categories (name, user_id, type, color, icon, order_index, is_active, created_at)
VALUES 
    ('Comida y Alimentación', 1, 'expense', '#FF6B6B', '🍔', 1, 1, '2025-10-07 04:32:49'),
    ('Transporte', 1, 'expense', '#4ECDC4', '🚗', 2, 1, '2025-10-07 04:32:49'),
    ('Entretenimiento', 1, 'expense', '#95E1D3', '🎬', 3, 1, '2025-10-07 04:32:49'),
    ('Servicios y Facturas', 1, 'expense', '#FFE66D', '💡', 4, 1, '2025-10-07 04:32:49'),
    ('Salud', 1, 'expense', '#FF8B94', '🏥', 5, 1, '2025-10-07 04:32:49'),
    ('Hogar', 1, 'expense', '#A8DADC', '🏠', 6, 1, '2025-10-07 04:32:49'),
    ('Ropa y Calzado', 1, 'expense', '#E8B4F2', '👕', 7, 1, '2025-10-07 04:32:49'),
    ('Educación', 1, 'expense', '#B4E8F2', '📚', 8, 1, '2025-10-07 04:32:49'),
    ('Regalos y Donaciones', 1, 'expense', '#FFB4E8', '🎁', 9, 1, '2025-10-07 04:32:49'),
    ('Otros', 1, 'expense', '#C0C0C0', '💼', 10, 1, '2025-10-07 04:32:49');

INSERT INTO categories (name, user_id, type, color, icon, order_index, is_active, created_at)
VALUES 
    ('Salario', 1, 'income', '#06D6A0', '💰', 1, 1, '2025-10-07 04:32:50'),
    ('Inversiones', 1, 'income', '#118AB2', '📈', 2, 1, '2025-10-07 04:32:50'),
    ('Bonos/Extras', 1, 'income', '#FFD166', '🎁', 3, 1, '2025-10-07 04:32:50'),
    ('Freelance', 1, 'income', '#EF476F', '💼', 4, 1, '2025-10-07 04:32:50'),
    ('Ventas', 1, 'income', '#8338EC', '🏪', 5, 1, '2025-10-07 04:32:50'),
    ('Otros ingresos', 1, 'income', '#06FFA5', '📊', 6, 1, '2025-10-07 04:32:50');

-- ============================================
-- TABLA: subcategories
-- ============================================
CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (1, 1, 'Supermercado', 1, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Restaurantes', 2, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Comida rápida', 3, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Delivery', 4, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Cafeterías', 5, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Mercado', 6, 1, '2025-10-07 04:32:54'),
    (1, 1, 'Bodega', 7, 1, '2025-10-07 04:32:54');

INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (2, 1, 'Gasolina', 1, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Uber/Taxi', 2, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Transporte público', 3, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Estacionamiento', 4, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Mantenimiento vehículo', 5, 1, '2025-10-07 04:32:52');

INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (3, 1, 'Cine', 1, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Streaming (Netflix, Spotify)', 2, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Videojuegos', 3, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Eventos/Conciertos', 4, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Hobbies', 5, 1, '2025-10-07 04:32:53');

-- ============================================
-- TABLA: debts
-- Representa deudas que TÚ DEBES a otros
-- ============================================
CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('person', 'institution', 'credit_card', 'loan', 'mortgage', 'other')),
    original_amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    interest_rate REAL DEFAULT 0.00,
    start_date TEXT NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue')),
    notes TEXT,
    has_installments INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

-- ============================================
-- TABLA: loans
-- Representa préstamos que TÚ OTORGAS a otros
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    debtor_name TEXT NOT NULL,
    debtor_contact TEXT,
    original_amount REAL NOT NULL CHECK(original_amount > 0),
    remaining_amount REAL NOT NULL CHECK(remaining_amount >= 0),
    interest_rate REAL DEFAULT 0.00 CHECK(interest_rate >= 0),
    loan_date TEXT NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'partial')),
    notes TEXT,
    account_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_loans_debtor_name ON loans(debtor_name);

-- ============================================
-- TABLA: savings_goals
-- ============================================
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount REAL NOT NULL CHECK(target_amount > 0),
    current_amount REAL DEFAULT 0.00 CHECK(current_amount >= 0),
    target_date TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'achieved', 'expired', 'cancelled')),
    image_url TEXT,
    auto_contribute INTEGER DEFAULT 0,
    auto_contribute_percentage REAL CHECK(auto_contribute_percentage >= 0 AND auto_contribute_percentage <= 100),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_status ON savings_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

-- ============================================
-- TABLA: pending_payments
-- Pagos puntuales pendientes que el usuario debe recordar hacer
-- ============================================
CREATE TABLE IF NOT EXISTS pending_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    due_date TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'overdue')),
    notes TEXT,
    reminder_enabled INTEGER DEFAULT 1,
    debt_id INTEGER,
    loan_id INTEGER,
    transaction_id INTEGER,
    paid_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_status ON pending_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_due_date ON pending_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_pending_payments_priority ON pending_payments(priority);

-- ============================================
-- TABLA: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'debt_payment', 'transfer', 'goal_contribution', 'loan_given', 'loan_payment', 'pending_payment')),
    amount REAL NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER,
    description TEXT,
    notes TEXT,
    transaction_date TEXT NOT NULL,
    destination_account_id INTEGER,
    debt_id INTEGER,
    loan_id INTEGER,
    goal_id INTEGER,
    pending_payment_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE SET NULL,
    FOREIGN KEY (pending_payment_id) REFERENCES pending_payments(id) ON DELETE SET NULL,
    CHECK (
        (type = 'transfer' AND destination_account_id IS NOT NULL AND account_id != destination_account_id)
        OR (type = 'debt_payment' AND debt_id IS NOT NULL)
        OR (type = 'loan_given' AND loan_id IS NOT NULL)
        OR (type = 'loan_payment' AND loan_id IS NOT NULL)
        OR (type = 'goal_contribution' AND goal_id IS NOT NULL)
        OR (type = 'pending_payment' AND pending_payment_id IS NOT NULL)
        OR (type IN ('income', 'expense', 'debt'))
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_goal ON transactions(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_debt_id ON transactions(debt_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pending_payment_id ON transactions(pending_payment_id);

-- ============================================
-- TABLA: attachments
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    original_file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    file_type TEXT CHECK (file_type IN ('image', 'pdf', 'document', 'receipt', 'other')),
    r2_key TEXT NOT NULL UNIQUE,
    r2_url TEXT,
    description TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON attachments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON attachments(file_type);

-- ============================================
-- TABLA: debt_installments
-- ============================================
CREATE TABLE IF NOT EXISTS debt_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    paid_amount REAL DEFAULT 0.00,
    paid_date TEXT,
    transaction_id INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_debt_installments_debt_id ON debt_installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_installments_due_date ON debt_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_installments_status ON debt_installments(status);

-- ============================================
-- TABLA: recurring_expenses
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'annual')),
    charge_day INTEGER NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
    next_charge_date TEXT,
    last_charge_date TEXT,
    notify_3_days INTEGER DEFAULT 1,
    notify_1_day INTEGER DEFAULT 1,
    notify_same_day INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CHECK (
        (frequency = 'weekly' AND charge_day BETWEEN 1 AND 7) OR
        (frequency = 'biweekly' AND charge_day BETWEEN 1 AND 7) OR
        (frequency = 'monthly' AND charge_day BETWEEN 1 AND 31) OR
        (frequency = 'annual' AND charge_day BETWEEN 1 AND 365)
    )
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_status ON recurring_expenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_charge ON recurring_expenses(next_charge_date);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_account ON recurring_expenses(account_id);