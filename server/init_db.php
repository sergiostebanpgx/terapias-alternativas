<?php
// Initialize the Database Schema

// Suppress JSON error from database.php during CLI init
require __DIR__ . '/config/database.php';

$sqls = [
    "CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'patient', -- 'admin', 'receptionist', 'patient'
        document_number VARCHAR(30),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialty VARCHAR(120),
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        day_of_week SMALLINT NOT NULL,
        start_time TIME,
        end_time TIME,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT doctor_schedules_day_range CHECK (day_of_week >= 0 AND day_of_week <= 6),
        CONSTRAINT doctor_schedules_time_order CHECK (
            (is_active = FALSE) OR
            (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        ),
        UNIQUE (doctor_id, day_of_week)
    )",

    "CREATE TABLE IF NOT EXISTS weight_controls (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        weight_kg DECIMAL(5,2) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )",

    "CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
        appointment_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS patient_debts (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        debt_type VARCHAR(20) NOT NULL DEFAULT 'control', -- 'control' | 'product'
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER DEFAULT 1,
        concept TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        pending_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'partial' | 'paid'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        payment_method VARCHAR(100) NOT NULL, -- 'cash', 'card', 'transfer'
        payment_category VARCHAR(20) DEFAULT 'control', -- 'control' | 'product' | 'abono'
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER DEFAULT 1,
        debt_id INTEGER REFERENCES patient_debts(id) ON DELETE SET NULL,
        payment_status VARCHAR(20) DEFAULT 'completed',
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    "CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
        movement_type VARCHAR(30) NOT NULL, -- 'sale' | 'sale_reversal' | 'adjustment'
        quantity INTEGER NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

$migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS document_number VARCHAR(30)",
    "ALTER TABLE users ALTER COLUMN email DROP NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS users_document_number_unique_idx ON users(document_number) WHERE document_number IS NOT NULL",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_id INTEGER",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2)",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_category VARCHAR(20) DEFAULT 'control'",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_id INTEGER",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS debt_id INTEGER",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'completed'",
    "UPDATE payments SET total_amount = amount WHERE total_amount IS NULL",
    "ALTER TABLE payments ALTER COLUMN total_amount SET NOT NULL",
    "CREATE INDEX IF NOT EXISTS idx_patient_debts_patient_status ON patient_debts(patient_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, created_at)",
    "UPDATE users SET document_number = CONCAT('TMP', LPAD(id::TEXT, 8, '0')) WHERE role = 'patient' AND document_number IS NULL",
    "CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week)",
    "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status ON appointments(doctor_id, appointment_date, status)"
];

$fkMigrations = [
    "ALTER TABLE appointments ADD CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL",
    "ALTER TABLE payments ADD CONSTRAINT fk_payments_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL",
    "ALTER TABLE payments ADD CONSTRAINT fk_payments_debt FOREIGN KEY (debt_id) REFERENCES patient_debts(id) ON DELETE SET NULL"
];

echo "Initializing Database Schema...\n";

foreach ($sqls as $sql) {
    try {
        $pdo->exec($sql);
        echo "Executed Table creation.\n";
    } catch (\PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "Running schema migrations...\n";
foreach ($migrations as $sql) {
    try {
        $pdo->exec($sql);
    } catch (\PDOException $e) {
        echo "Migration warning: " . $e->getMessage() . "\n";
    }
}

foreach ($fkMigrations as $sql) {
    try {
        $pdo->exec($sql);
    } catch (\PDOException $e) {
        // Most likely constraint already exists, safe to ignore.
    }
}

// Check if default admin exists
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
$adminCount = $stmt->fetchColumn();

if ($adminCount == 0) {
    $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
    $pdo->exec("INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@centro.com', '$hashedPassword', 'admin')");
    echo "Created default admin user (admin@centro.com / admin123)\n";
}

echo "Database Setup Complete.\n";
