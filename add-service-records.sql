-- Create service records table to track vehicle service history
CREATE TABLE IF NOT EXISTS service_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  service_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  service_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(service_date);
