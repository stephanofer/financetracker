PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    auto_logout_minutes INTEGER DEFAULT 30
);

INSERT INTO "users" VALUES('demo_user','holamundo','demo_user@example.com','Demo User',NULL);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_name TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('efectivo', 'debito', 'credito', 'banco', 'ahorros', 'inversiones')),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    color TEXT, -- hex color
    icon TEXT, -- icon name
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO "accounts" VALUES(1,1,'Cuenta de Prueba','banco',1000.00,'PEN','#FF5733','🏦',1,'2025-10-07 04:32:48','2025-10-07 04:32:48');


CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
    color TEXT NOT NULL, -- hex color
    icon TEXT NOT NULL, -- emoji or icon name
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "categories" VALUES(1,'Comida y Alimentación','gasto','#FF6B6B','🍔',1,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(2,'Transporte','gasto','#4ECDC4','🚗',2,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(3,'Entretenimiento','gasto','#95E1D3','🎬',3,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(4,'Servicios y Facturas','gasto','#FFE66D','💡',4,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(5,'Salud','gasto','#FF8B94','🏥',5,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(6,'Hogar','gasto','#A8DADC','🏠',6,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(7,'Ropa y Calzado','gasto','#E8B4F2','👕',7,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(8,'Educación','gasto','#B4E8F2','📚',8,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(9,'Regalos y Donaciones','gasto','#FFB4E8','🎁',9,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(10,'Otros','gasto','#C0C0C0','💼',10,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(11,'Salario','ingreso','#06D6A0','💰',1,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(12,'Inversiones','ingreso','#118AB2','📈',2,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(13,'Bonos/Extras','ingreso','#FFD166','🎁',3,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(14,'Freelance','ingreso','#EF476F','💼',4,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(15,'Ventas','ingreso','#8338EC','🏪',5,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(16,'Otros ingresos','ingreso','#06FFA5','📊',6,1,'2025-10-07 04:32:50');
CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
INSERT INTO "subcategories" VALUES(1,1,'Supermercado',1,1,'2025-10-07 04:32:51');
INSERT INTO "subcategories" VALUES(2,1,'Restaurantes',2,1,'2025-10-07 04:32:51');
INSERT INTO "subcategories" VALUES(3,1,'Comida rápida',3,1,'2025-10-07 04:32:51');
INSERT INTO "subcategories" VALUES(4,1,'Delivery',4,1,'2025-10-07 04:32:51');
INSERT INTO "subcategories" VALUES(5,1,'Cafeterías',5,1,'2025-10-07 04:32:51');
INSERT INTO "subcategories" VALUES(6,2,'Gasolina',1,1,'2025-10-07 04:32:52');
INSERT INTO "subcategories" VALUES(7,2,'Uber/Taxi',2,1,'2025-10-07 04:32:52');
INSERT INTO "subcategories" VALUES(8,2,'Transporte público',3,1,'2025-10-07 04:32:52');
INSERT INTO "subcategories" VALUES(9,2,'Estacionamiento',4,1,'2025-10-07 04:32:52');
INSERT INTO "subcategories" VALUES(10,2,'Mantenimiento vehículo',5,1,'2025-10-07 04:32:52');
INSERT INTO "subcategories" VALUES(11,3,'Cine',1,1,'2025-10-07 04:32:53');
INSERT INTO "subcategories" VALUES(12,3,'Streaming (Netflix, Spotify)',2,1,'2025-10-07 04:32:53');
INSERT INTO "subcategories" VALUES(13,3,'Videojuegos',3,1,'2025-10-07 04:32:53');
INSERT INTO "subcategories" VALUES(14,3,'Eventos/Conciertos',4,1,'2025-10-07 04:32:53');
INSERT INTO "subcategories" VALUES(15,3,'Hobbies',5,1,'2025-10-07 04:32:53');


CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto', 'deuda', 'pago_deuda', 'transferencia')),
    amount DECIMAL(15, 2) NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER NOT NULL,
    description TEXT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Para transferencias
    destination_account_id INTEGER,
    
    -- Para pagos a deudas
    debt_id INTEGER,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL

    CHECK(
    -- Condición 1: Si es transferencia
    (type = 'transferencia' AND destination_account_id IS NOT NULL AND account_id != destination_account_id) 
    
    OR -- O cualquiera de estas otras condiciones
    
    -- Condición 2: Si es pago de deuda
    (type = 'pago_deuda' AND debt_id IS NOT NULL) 
    
    OR -- O
    
    -- Condición 3: Si es ingreso, gasto o deuda simple
    (type IN ('ingreso', 'gasto', 'deuda'))
)
);


INSERT INTO "transactions" VALUES(1,1,'gasto',100.00,1,1,1,'Ingreso de prueba','','2025-10-07','2025-10-07 04:32:48','2025-10-07 04:32:48',NULL,NULL);


CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);
CREATE TABLE transaction_tags (
    transaction_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id, tag_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE TABLE debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    creditor TEXT, -- persona o institución
    original_amount DECIMAL(15, 2) NOT NULL,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00, -- porcentaje
    start_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'activa' CHECK(status IN ('activa', 'pagada', 'vencida')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    period_type TEXT NOT NULL CHECK(period_type IN ('semanal', 'mensual')),
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
CREATE TABLE recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('semanal', 'quincenal', 'mensual', 'anual')),
    charge_day INTEGER NOT NULL, -- día del cobro (1-31 para mensual, 1-7 para semanal)
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER NOT NULL,
    status TEXT DEFAULT 'activo' CHECK(status IN ('activo', 'pausado', 'cancelado')),
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
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);
CREATE TABLE savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0.00,
    target_date DATE,
    priority TEXT DEFAULT 'media' CHECK(priority IN ('alta', 'media', 'baja')),
    status TEXT DEFAULT 'en_progreso' CHECK(status IN ('en_progreso', 'alcanzada', 'vencida', 'cancelada')),
    image_url TEXT, -- emoji o URL
    auto_contribute BOOLEAN DEFAULT 0,
    auto_contribute_percentage DECIMAL(5, 2), -- % de cada ingreso
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER, -- bytes
    mime_type TEXT,
    r2_key TEXT NOT NULL, -- key en R2
    r2_url TEXT, -- URL pública
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('comments',4);
INSERT INTO "sqlite_sequence" VALUES('categories',16);
INSERT INTO "sqlite_sequence" VALUES('subcategories',15);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_next_charge ON recurring_expenses(next_charge_date);
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON savings_goals(status);
CREATE INDEX idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX idx_photos_transaction_id ON photos(transaction_id);
