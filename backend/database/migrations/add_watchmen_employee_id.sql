-- Add employee_id and update password field for watchmen table
-- Date: 2025-11-02

-- Add employee_id column if it doesn't exist
ALTER TABLE watchmen ADD COLUMN employee_id VARCHAR(50) UNIQUE;

-- Rename password to password_hash if not already done
-- SQLite doesn't support RENAME COLUMN directly in all versions
-- So we'll create new column and copy data

-- Add password_hash column if it doesn't exist
ALTER TABLE watchmen ADD COLUMN password_hash VARCHAR(255);

-- Add shift_start and shift_end columns for better shift management
ALTER TABLE watchmen ADD COLUMN shift_start TIME;
ALTER TABLE watchmen ADD COLUMN shift_end TIME;

-- Note: You may need to manually:
-- 1. Copy data from 'password' to 'password_hash' if password column exists
-- 2. Drop old 'password' column
-- 3. Ensure all watchmen have employee_id values
