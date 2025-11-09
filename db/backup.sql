-- ============================================
-- LIMPIEZA DE TABLAS (en orden correcto)
-- ============================================
DROP TABLE IF EXISTS goal_contributions;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS recurring_expenses;
DROP TABLE IF EXISTS debt_installments;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    auto_logout_minutes INTEGER DEFAULT 30
);

INSERT INTO users (username, password_hash, salt, email, full_name, last_login)
VALUES ('stephanofer', '3f9d5fac2a86a67f86f8f7ac17bd2708eda3e6f2c7f47f39e693f16d625d3ace', 
        'tH6rZ8ux/vSVqoENhCyRZg==', 'slowdown_4@hotmail.com.com', 
        'Stephano Fernandez', '2025-10-07 04:32:48');

-- ============================================
-- TABLA: accounts
-- ============================================
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'debit', 'credit', 'bank', 'savings', 'investments')),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

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
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categorías de gastos
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

-- Categorías de ingresos
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
CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);

-- Subcategorías: Comida y Alimentación (category_id = 1)
INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (1, 1, 'Supermercado', 1, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Restaurantes', 2, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Comida rápida', 3, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Delivery', 4, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Cafeterías', 5, 1, '2025-10-07 04:32:51'),
    (1, 1, 'Mercado', 6, 1, '2025-10-07 04:32:54'),
    (1, 1, 'Bodega', 7, 1, '2025-10-07 04:32:54');

-- Subcategorías: Transporte (category_id = 2)
INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (2, 1, 'Gasolina', 1, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Uber/Taxi', 2, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Transporte público', 3, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Estacionamiento', 4, 1, '2025-10-07 04:32:52'),
    (2, 1, 'Mantenimiento vehículo', 5, 1, '2025-10-07 04:32:52');

-- Subcategorías: Entretenimiento (category_id = 3)
INSERT INTO subcategories (category_id, user_id, name, order_index, is_active, created_at)
VALUES 
    (3, 1, 'Cine', 1, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Streaming (Netflix, Spotify)', 2, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Videojuegos', 3, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Eventos/Conciertos', 4, 1, '2025-10-07 04:32:53'),
    (3, 1, 'Hobbies', 5, 1, '2025-10-07 04:32:53');

-- ============================================
-- TABLA: debts (DEBE IR ANTES DE transactions)
-- ============================================
CREATE TABLE debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('person', 'institution', 'credit_card', 'loan', 'mortgage', 'other')),
    original_amount DECIMAL(15, 2) NOT NULL,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue')),
    notes TEXT,
    has_installments BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);

-- ============================================
-- TABLA: transactions
-- ============================================
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'debt_payment', 'transfer')),
    amount DECIMAL(15, 2) NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER,
    description TEXT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    destination_account_id INTEGER,
    debt_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL,
    CHECK (
        (type = 'transfer' AND destination_account_id IS NOT NULL AND account_id != destination_account_id)
        OR (type = 'debt_payment' AND debt_id IS NOT NULL)
        OR (type IN ('income', 'expense', 'debt'))
    )
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);

-- ============================================
-- TABLA: attachments
-- ============================================
CREATE TABLE attachments (
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
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_transaction_id ON attachments(transaction_id);
CREATE INDEX idx_attachments_file_type ON attachments(file_type);

-- ============================================
-- TABLA: debt_installments
-- ============================================
CREATE TABLE debt_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    paid_date DATE,
    transaction_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

CREATE INDEX idx_debt_installments_debt_id ON debt_installments(debt_id);
CREATE INDEX idx_debt_installments_due_date ON debt_installments(due_date);
CREATE INDEX idx_debt_installments_status ON debt_installments(status);

-- ============================================
-- TABLA: budgets
-- ============================================
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
    amount DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    alert_threshold_75 BOOLEAN DEFAULT 1,
    alert_threshold_90 BOOLEAN DEFAULT 1,
    alert_threshold_100 BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);

-- ============================================
-- TABLA: recurring_expenses
-- ============================================
CREATE TABLE recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK(amount > 0),
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'annual')),
    charge_day INTEGER NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
    next_charge_date DATE,
    last_charge_date DATE,
    notify_3_days BOOLEAN DEFAULT 1,
    notify_1_day BOOLEAN DEFAULT 1,
    notify_same_day BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_user_status ON recurring_expenses(user_id, status);
CREATE INDEX idx_recurring_expenses_next_charge ON recurring_expenses(next_charge_date);
CREATE INDEX idx_recurring_expenses_account ON recurring_expenses(account_id);

-- ============================================
-- TABLA: savings_goals
-- ============================================
CREATE TABLE savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL CHECK(target_amount > 0),
    current_amount DECIMAL(15, 2) DEFAULT 0.00 CHECK(current_amount >= 0),
    target_date DATE,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'achieved', 'expired', 'cancelled')),
    image_url TEXT,
    auto_contribute BOOLEAN DEFAULT 0,
    auto_contribute_percentage DECIMAL(5, 2) CHECK(auto_contribute_percentage >= 0 AND auto_contribute_percentage <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_user_status ON savings_goals(user_id, status);
CREATE INDEX idx_savings_goals_status ON savings_goals(status);
CREATE INDEX idx_savings_goals_target_date ON savings_goals(target_date);

-- ============================================
-- TABLA: goal_contributions
-- ============================================
CREATE TABLE goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    transaction_id INTEGER,
    amount DECIMAL(15, 2) NOT NULL CHECK(amount > 0),
    contribution_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_date ON goal_contributions(contribution_date);
CREATE INDEX idx_goal_contributions_transaction ON goal_contributions(transaction_id);

-- ============================================
-- TRIGGERS: Actualización automática de savings_goals
-- ============================================

-- Trigger: Actualizar current_amount al agregar contribución
CREATE TRIGGER trg_after_contribution_insert
AFTER INSERT ON goal_contributions
BEGIN
    UPDATE savings_goals
    SET 
        current_amount = current_amount + NEW.amount,
        updated_at = CURRENT_TIMESTAMP,
        status = CASE 
            WHEN (current_amount + NEW.amount) >= target_amount THEN 'achieved'
            ELSE status
        END,
        completed_at = CASE 
            WHEN (current_amount + NEW.amount) >= target_amount AND completed_at IS NULL THEN CURRENT_TIMESTAMP
            ELSE completed_at
        END
    WHERE id = NEW.goal_id;
END;

-- Trigger: Actualizar current_amount al eliminar contribución
CREATE TRIGGER trg_after_contribution_delete
AFTER DELETE ON goal_contributions
BEGIN
    UPDATE savings_goals
    SET 
        current_amount = current_amount - OLD.amount,
        updated_at = CURRENT_TIMESTAMP,
        status = CASE 
            WHEN (current_amount - OLD.amount) < target_amount AND status = 'achieved' THEN 'in_progress'
            ELSE status
        END,
        completed_at = CASE 
            WHEN (current_amount - OLD.amount) < target_amount THEN NULL
            ELSE completed_at
        END
    WHERE id = OLD.goal_id;
END;

-- Trigger: Actualizar current_amount al modificar contribución
CREATE TRIGGER trg_after_contribution_update
AFTER UPDATE ON goal_contributions
BEGIN
    UPDATE savings_goals
    SET 
        current_amount = current_amount - OLD.amount + NEW.amount,
        updated_at = CURRENT_TIMESTAMP,
        status = CASE 
            WHEN (current_amount - OLD.amount + NEW.amount) >= target_amount THEN 'achieved'
            WHEN (current_amount - OLD.amount + NEW.amount) < target_amount AND status = 'achieved' THEN 'in_progress'
            ELSE status
        END,
        completed_at = CASE 
            WHEN (current_amount - OLD.amount + NEW.amount) >= target_amount AND completed_at IS NULL THEN CURRENT_TIMESTAMP
            WHEN (current_amount - OLD.amount + NEW.amount) < target_amount THEN NULL
            ELSE completed_at
        END
    WHERE id = NEW.goal_id;
END;

-- Trigger: Actualizar updated_at en recurring_expenses
CREATE TRIGGER trg_recurring_expenses_update
AFTER UPDATE ON recurring_expenses
FOR EACH ROW
BEGIN
    UPDATE recurring_expenses
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Actualizar updated_at en savings_goals
CREATE TRIGGER trg_savings_goals_update
AFTER UPDATE ON savings_goals
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE savings_goals
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;


