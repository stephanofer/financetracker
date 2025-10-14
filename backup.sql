PRAGMA defer_foreign_keys=TRUE;

-- ======================================
-- ELIMINACIÓN DE TABLAS EXISTENTES
-- ======================================
DROP TABLE IF EXISTS goal_contributions;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS recurring_expenses;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS debt_payments;
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- ======================================
-- CREACIÓN DE TABLAS
-- ======================================

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

INSERT INTO "users" (username, password_hash, email, full_name, created_at, updated_at, last_login, is_active, auto_logout_minutes) VALUES('demo_user','holamundo','demo_user@example.com','Demo User','2025-10-07 04:32:48','2025-10-07 04:32:48',NULL,1,30);

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
    type TEXT NOT NULL CHECK(type IN ('cash', 'debit', 'credit', 'bank', 'savings', 'investments')),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    color TEXT, -- hex color
    icon TEXT, -- icon name
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO "accounts" VALUES(1,1,'Cuenta de Prueba','bank',1000.00,'PEN','#FF5733','🏦',1,'2025-10-07 04:32:48','2025-10-07 04:32:48');


CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    color TEXT NOT NULL, -- hex color
    icon TEXT NOT NULL, -- emoji or icon name
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "categories" VALUES(1,'Comida y Alimentación','expense','#FF6B6B','🍔',1,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(2,'Transporte','expense','#4ECDC4','🚗',2,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(3,'Entretenimiento','expense','#95E1D3','🎬',3,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(4,'Servicios y Facturas','expense','#FFE66D','💡',4,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(5,'Salud','expense','#FF8B94','🏥',5,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(6,'Hogar','expense','#A8DADC','🏠',6,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(7,'Ropa y Calzado','expense','#E8B4F2','👕',7,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(8,'Educación','expense','#B4E8F2','📚',8,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(9,'Regalos y Donaciones','expense','#FFB4E8','🎁',9,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(10,'Otros','expense','#C0C0C0','💼',10,1,'2025-10-07 04:32:49');
INSERT INTO "categories" VALUES(11,'Salario','income','#06D6A0','💰',1,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(12,'Inversiones','income','#118AB2','📈',2,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(13,'Bonos/Extras','income','#FFD166','🎁',3,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(14,'Freelance','income','#EF476F','💼',4,1,'2025-10-07 04:32:50');
INSERT INTO "categories" VALUES(15,'Ventas','income','#8338EC','🏪',5,1,'2025-10-07 04:32:50');
    INSERT INTO "categories" VALUES(16,'Otros incomes','income','#06FFA5','📊',6,1,'2025-10-07 04:32:50');

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

INSERT INTO "debts" VALUES(1,1,'Préstamo Personal','Banco Continental',5000.00,4500.00,12.50,'2025-01-15','2026-01-15','activa','Préstamo para emergencias','2025-01-15 10:00:00','2025-10-07 04:34:00');
INSERT INTO "debts" VALUES(2,1,'Tarjeta de Crédito','Visa',1200.00,800.00,18.00,'2025-03-01','2025-12-31','activa','Deuda de tarjeta','2025-03-01 08:00:00','2025-10-07 04:34:00');

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'debt', 'debt_payment', 'transfer')),
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
    (type = 'transfer' AND destination_account_id IS NOT NULL AND account_id != destination_account_id) 
    
    OR -- O cualquiera de estas otras condiciones
    
    -- Condición 2: Si es pago de deuda
    (type = 'debt_payment' AND debt_id IS NOT NULL) 
    
    OR -- O
    
    -- Condición 3: Si es ingreso, gasto o deuda simple
    (type IN ('income', 'expense', 'debt'))
)
);


INSERT INTO "transactions" VALUES(1,1,'expense',100.00,1,1,1,'Compra supermercado','Compra semanal','2025-10-07','2025-10-07 04:32:48','2025-10-07 04:32:48',NULL,NULL);
INSERT INTO "transactions" VALUES(2,1,'income',1500.00,11,NULL,1,'Salario mensual','Pago de octubre','2025-10-01','2025-10-01 09:00:00','2025-10-01 09:00:00',NULL,NULL);
INSERT INTO "transactions" VALUES(3,1,'expense',50.00,2,6,1,'Gasolina','Tanque lleno','2025-10-08','2025-10-08 15:30:00','2025-10-08 15:30:00',NULL,NULL);
INSERT INTO "transactions" VALUES(4,1,'expense',35.00,1,2,1,'Almuerzo','Restaurante italiano','2025-10-09','2025-10-09 13:00:00','2025-10-09 13:00:00',NULL,NULL);

-- Tabla para almacenar archivos adjuntos de transacciones en R2
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    original_file_name TEXT, -- nombre original del archivo subido
    file_size INTEGER, -- bytes
    mime_type TEXT,
    file_type TEXT CHECK(file_type IN ('image', 'pdf', 'document', 'receipt', 'other')), -- tipo de archivo
    r2_key TEXT NOT NULL UNIQUE, -- key única en R2
    r2_url TEXT, -- URL pública o presigned
    description TEXT, -- descripción opcional del archivo
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

INSERT INTO "attachments" VALUES(1,1,'1696685568000-abc123def.jpg','recibo_supermercado.jpg',245680,'image/jpeg','image','uploads/1696685568000-abc123def.jpg','https://your-r2-domain.com/uploads/1696685568000-abc123def.jpg','Recibo de compra en supermercado','2025-10-07 04:35:00','2025-10-07 04:35:00');

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

INSERT INTO "tags" VALUES(1,1,'Urgente','#FF5733','2025-10-07 04:33:00');
INSERT INTO "tags" VALUES(2,1,'Recurrente','#3498DB','2025-10-07 04:33:01');
INSERT INTO "tags" VALUES(3,1,'Deducible','#2ECC71','2025-10-07 04:33:02');

CREATE TABLE transaction_tags (
    transaction_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id, tag_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

INSERT INTO "transaction_tags" VALUES(1,1,'2025-10-07 04:33:05');
INSERT INTO "transaction_tags" VALUES(3,2,'2025-10-08 15:35:00');

-- Agregar transacciones de pago de deuda (deben crearse después de que exista la tabla debts)
INSERT INTO "transactions" VALUES(5,1,'debt_payment',500.00,NULL,NULL,1,'Pago préstamo personal','Cuota mensual','2025-10-01','2025-10-01 10:00:00','2025-10-01 10:00:00',NULL,1);
INSERT INTO "transactions" VALUES(6,1,'debt_payment',200.00,NULL,NULL,1,'Pago tarjeta crédito','Pago mínimo','2025-10-05','2025-10-05 11:00:00','2025-10-05 11:00:00',NULL,2);

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

INSERT INTO "debt_payments" VALUES(1,1,5,500.00,'2025-10-01','Pago mensual del préstamo','2025-10-01 10:00:00');
INSERT INTO "debt_payments" VALUES(2,2,6,200.00,'2025-10-05','Pago mínimo de tarjeta','2025-10-05 11:00:00');

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

INSERT INTO "budgets" VALUES(1,1,1,'mensual',500.00,'2025-10-01','2025-10-31',1,1,1,1,'2025-10-01 08:00:00','2025-10-01 08:00:00');
INSERT INTO "budgets" VALUES(2,1,2,'mensual',300.00,'2025-10-01','2025-10-31',1,1,1,1,'2025-10-01 08:00:00','2025-10-01 08:00:00');
INSERT INTO "budgets" VALUES(3,1,3,'mensual',200.00,'2025-10-01','2025-10-31',1,1,1,1,'2025-10-01 08:00:00','2025-10-01 08:00:00');

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

INSERT INTO "recurring_expenses" VALUES(1,1,'Netflix','15.99','mensual',5,3,12,1,'activo','2025-11-05','2025-10-05',1,1,1,'2025-09-05 10:00:00','2025-10-05 10:00:00');
INSERT INTO "recurring_expenses" VALUES(2,1,'Luz','80.00','mensual',15,4,NULL,1,'activo','2025-11-15','2025-10-15',1,1,1,'2025-09-15 08:00:00','2025-10-15 08:00:00');
INSERT INTO "recurring_expenses" VALUES(3,1,'Internet','65.00','mensual',10,4,NULL,1,'activo','2025-11-10','2025-10-10',1,1,1,'2025-09-10 09:00:00','2025-10-10 09:00:00');
INSERT INTO "recurring_expenses" VALUES(4,1,'Gimnasio','120.00','mensual',1,5,NULL,1,'activo','2025-11-01','2025-10-01',1,1,1,'2025-09-01 07:00:00','2025-10-01 07:00:00');

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

INSERT INTO "savings_goals" VALUES(1,1,'Viaje a Europa','Ahorrar para vacaciones de verano',5000.00,1500.00,'2026-06-30','alta','en_progreso','✈️',0,NULL,'2025-01-01 10:00:00','2025-10-07 10:00:00',NULL);
INSERT INTO "savings_goals" VALUES(2,1,'Laptop Nueva','Actualizar equipo de trabajo',2500.00,800.00,'2025-12-31','media','en_progreso','💻',1,10.00,'2025-05-01 10:00:00','2025-10-07 10:00:00',NULL);
INSERT INTO "savings_goals" VALUES(3,1,'Fondo de Emergencia','6 meses de gastos',10000.00,3000.00,NULL,'alta','en_progreso','🛡️',1,15.00,'2025-01-01 10:00:00','2025-10-07 10:00:00',NULL);

CREATE TABLE goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);

INSERT INTO "goal_contributions" VALUES(1,1,500.00,'2025-10-01','Aporte mensual','2025-10-01 10:00:00');
INSERT INTO "goal_contributions" VALUES(2,1,200.00,'2025-09-15','Aporte extra','2025-09-15 14:00:00');
INSERT INTO "goal_contributions" VALUES(3,2,300.00,'2025-10-05','Primer aporte','2025-10-05 09:00:00');
INSERT INTO "goal_contributions" VALUES(4,3,1000.00,'2025-10-01','Aporte inicial','2025-10-01 11:00:00');


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
CREATE INDEX idx_attachments_transaction_id ON attachments(transaction_id);
CREATE INDEX idx_attachments_file_type ON attachments(file_type);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags(tag_id);
