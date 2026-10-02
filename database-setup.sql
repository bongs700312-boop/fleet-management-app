-- Fleet Management Database Setup Script
-- Run this in your Supabase SQL Editor to set up the required tables

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS carwashes CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS company_rules CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Create vehicles table
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance')),
  current_mileage INTEGER NOT NULL DEFAULT 0,
  last_service_mileage INTEGER NOT NULL DEFAULT 0,
  next_service_mileage INTEGER NOT NULL DEFAULT 10000,
  last_service_date TIMESTAMP WITH TIME ZONE,
  next_service_date TIMESTAMP WITH TIME ZONE,
  license_disk_expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table with UUID to match Supabase default
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'in_progress')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspections table with UUID for booking_id
CREATE TABLE inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip')),
  inspector_name TEXT NOT NULL,
  start_km INTEGER,
  end_km INTEGER,
  condition_notes TEXT NOT NULL,
  issues_found TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_rules table
CREATE TABLE company_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fines table
CREATE TABLE fines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  staff_email TEXT NOT NULL,
  fine_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carwashes table
CREATE TABLE carwashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  wash_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX idx_inspections_booking_id ON inspections(booking_id);
CREATE INDEX idx_inspections_type ON inspections(inspection_type);

CREATE INDEX idx_fines_vehicle_id ON fines(vehicle_id);
CREATE INDEX idx_fines_fine_date ON fines(fine_date);
CREATE INDEX idx_fines_status ON fines(status);

CREATE INDEX idx_carwashes_vehicle_id ON carwashes(vehicle_id);
CREATE INDEX idx_carwashes_wash_date ON carwashes(wash_date);

-- Insert sample company rule
INSERT INTO company_rules (title, description)
VALUES ('Vehicle Usage Policy', 'All vehicles must be used for business purposes only. Drivers must maintain valid licenses and follow traffic laws at all times.');
