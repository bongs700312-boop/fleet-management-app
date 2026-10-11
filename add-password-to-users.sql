-- Add password column to existing users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'changeme123';

-- Update any existing users that don't have a password
UPDATE users
SET password = 'changeme123'
WHERE password IS NULL OR password = '';
