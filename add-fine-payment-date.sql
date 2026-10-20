-- Add payment date column to fines table
ALTER TABLE fines
ADD COLUMN IF NOT EXISTS payment_date DATE;
