DROP TABLE IF EXISTS transactions;

DROP TABLE IF EXISTS goal_contributions;

DROP TABLE IF EXISTS savings_goals;

DROP TABLE IF EXISTS recurring_expenses;

DROP TABLE IF EXISTS budgets;

DROP TABLE IF EXISTS debt_payments;

DROP TABLE IF EXISTS debts;

DROP TABLE IF EXISTS transaction_tags;

DROP TABLE IF EXISTS tags;

DROP TABLE IF EXISTS attachments;

DROP TABLE IF EXISTS subcategories;

DROP TABLE IF EXISTS categories;

DROP TABLE IF EXISTS accounts;

DROP TABLE IF EXISTS sessions;

DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS photos;

DROP TABLE IF EXISTS comments;

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

INSERT INTO
    "users" (
        username,
        password_hash,
        salt,
        email,
        full_name,
        last_login
    )
VALUES
    (
        'stephanofer',
        '3f9d5fac2a86a67f86f8f7ac17bd2708eda3e6f2c7f47f39e693f16d625d3ace',
        'tH6rZ8ux/vSVqoENhCyRZg==',
        'slowdown_4@hotmail.com.com',
        'Stephano Fernandez',
        '2025-10-07 04:32:48'
    );

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'cash',
            'debit',
            'credit',
            'bank',
            'savings',
            'investments'
        )
    ),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO
    accounts (user_id, name, type, color, icon)
VALUES
    (1, 'Efectivo', 'cash', '#FFD166', '💵'),
    (1, 'Banco BCP', 'bank', '#06D6A0', '🏦'),
    (
        1,
        'Tarjeta de Crédito',
        'credit',
        '#EF476F',
        '💳'
    ),
    (1, 'Ahorros', 'savings', '#118AB2', '💰');

INSERT INTO
    accounts (user_id, name, type, color, icon)
VALUES
    (1, 'Yape', 'debit', '#9B5DE5', '📱');

CREATE INDEX idx_accounts_user_id ON accounts (user_id);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL, -- hex color
    icon TEXT NOT NULL, -- emoji or icon name
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Comida y Alimentación',
        'expense',
        '#FF6B6B',
        '🍔',
        1,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Transporte',
        'expense',
        '#4ECDC4',
        '🚗',
        2,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Entretenimiento',
        'expense',
        '#95E1D3',
        '🎬',
        3,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Servicios y Facturas',
        'expense',
        '#FFE66D',
        '💡',
        4,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Salud',
        'expense',
        '#FF8B94',
        '🏥',
        5,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Hogar',
        'expense',
        '#A8DADC',
        '🏠',
        6,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Ropa y Calzado',
        'expense',
        '#E8B4F2',
        '👕',
        7,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Educación',
        'expense',
        '#B4E8F2',
        '📚',
        8,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Regalos y Donaciones',
        'expense',
        '#FFB4E8',
        '🎁',
        9,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Otros',
        'expense',
        '#C0C0C0',
        '💼',
        10,
        1,
        '2025-10-07 04:32:49'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Salario',
        'income',
        '#06D6A0',
        '💰',
        1,
        1,
        '2025-10-07 04:32:50'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Inversiones',
        'income',
        '#118AB2',
        '📈',
        2,
        1,
        '2025-10-07 04:32:50'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Bonos/Extras',
        'income',
        '#FFD166',
        '🎁',
        3,
        1,
        '2025-10-07 04:32:50'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Freelance',
        'income',
        '#EF476F',
        '💼',
        4,
        1,
        '2025-10-07 04:32:50'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Ventas',
        'income',
        '#8338EC',
        '🏪',
        5,
        1,
        '2025-10-07 04:32:50'
    );

INSERT INTO
    "categories" (
        name,
        type,
        color,
        icon,
        order_index,
        is_active,
        created_at
    )
VALUES
    (
        'Otros incomes',
        'income',
        '#06FFA5',
        '📊',
        6,
        1,
        '2025-10-07 04:32:50'
    );

CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

INSERT INTO
    subcategories (
        category_id,
        name,
        order_index,
        is_active,
        created_at
    )
VALUES
    (1, 'Supermercado', 1, 1, '2025-10-07 04:32:51'),
    (1, 'Restaurantes', 2, 1, '2025-10-07 04:32:51'),
    (1, 'Comida rápida', 3, 1, '2025-10-07 04:32:51'),
    (1, 'Delivery', 4, 1, '2025-10-07 04:32:51'),
    (1, 'Cafeterías', 5, 1, '2025-10-07 04:32:51'),
    (2, 'Gasolina', 1, 1, '2025-10-07 04:32:52'),
    (2, 'Uber/Taxi', 2, 1, '2025-10-07 04:32:52'),
    (
        2,
        'Transporte público',
        3,
        1,
        '2025-10-07 04:32:52'
    ),
    (2, 'Estacionamiento', 4, 1, '2025-10-07 04:32:52'),
    (
        2,
        'Mantenimiento vehículo',
        5,
        1,
        '2025-10-07 04:32:52'
    ),
    (3, 'Cine', 1, 1, '2025-10-07 04:32:53'),
    (
        3,
        'Streaming (Netflix, Spotify)',
        2,
        1,
        '2025-10-07 04:32:53'
    ),
    (3, 'Videojuegos', 3, 1, '2025-10-07 04:32:53'),
    (
        3,
        'Eventos/Conciertos',
        4,
        1,
        '2025-10-07 04:32:53'
    ),
    (3, 'Hobbies', 5, 1, '2025-10-07 04:32:53');

INSERT INTO
    subcategories (
        category_id,
        name,
        order_index,
        is_active,
        created_at
    )
VALUES
    (1, 'Mercado', 6, 1, '2025-10-07 04:32:54');

INSERT INTO
    subcategories (
        category_id,
        name,
        order_index,
        is_active,
        created_at
    )
VALUES
    (1, 'Bodega', 7, 1, '2025-10-07 04:32:54');

CREATE INDEX idx_subcategories_category_id ON subcategories (category_id);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'income',
            'expense',
            'debt',
            'debt_payment',
            'transfer'
        )
    ),
    amount DECIMAL(15, 2) NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    account_id INTEGER,
    description TEXT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    destination_account_id INTEGER,
    debt_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_account_id) REFERENCES accounts (id) ON DELETE SET NULL,
    FOREIGN KEY (debt_id) REFERENCES debts (id) ON DELETE SET NULL,
    CHECK (
        (
            type = 'transfer'
            AND destination_account_id IS NOT NULL
            AND account_id != destination_account_id
        )
        OR (
            type = 'debt_payment'
            AND debt_id IS NOT NULL
        )
        OR (type IN ('income', 'expense', 'debt'))
    )
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_transactions_date ON transactions (transaction_date);

CREATE INDEX idx_transactions_type ON transactions (type);

CREATE INDEX idx_transactions_category_id ON transactions (category_id);

CREATE INDEX idx_transactions_account_id ON transactions (account_id);

CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    original_file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    file_type TEXT CHECK (
        file_type IN ('image', 'pdf', 'document', 'receipt', 'other')
    ),
    r2_key TEXT NOT NULL UNIQUE,
    r2_url TEXT,
    description TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_transaction_id ON attachments (transaction_id);

CREATE INDEX idx_attachments_file_type ON attachments (file_type);

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    has_installments BOOLEAN DEFAULT 0, -- Flag para saber si usa cuotas
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_debts_user_id ON debts (user_id);

CREATE INDEX idx_debts_status ON debts (status);

CREATE INDEX idx_debts_due_date ON debts (due_date);

CREATE TABLE debt_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL, -- Cuota #1, #2, etc.
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'overdue', 'partial')
    ),
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    paid_date DATE,
    transaction_id INTEGER, -- Referencia al pago
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
);

CREATE INDEX idx_debt_installments_debt_id ON debt_installments (debt_id);

CREATE INDEX idx_debt_installments_due_date ON debt_installments (due_date);

CREATE INDEX idx_debt_installments_status ON debt_installments (status);

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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE INDEX idx_budgets_user_id ON budgets (user_id);

CREATE INDEX idx_budgets_dates ON budgets (start_date, end_date);