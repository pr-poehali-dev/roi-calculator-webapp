CREATE TABLE IF NOT EXISTS roi_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry VARCHAR(64),
    employees VARCHAR(32),
    salary INTEGER,
    routine_hours NUMERIC(4,1),
    savings BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
