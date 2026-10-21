-- Add petrol level column to inspections table
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS petrol_level TEXT;
