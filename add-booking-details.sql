-- Add additional booking details fields
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS number_of_passengers INTEGER,
ADD COLUMN IF NOT EXISTS trip_description TEXT;
