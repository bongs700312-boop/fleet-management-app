-- Create users table for staff profiles with roles
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (you can change the email and password)
-- Password is 'admin123' (in production, use hashed passwords)
INSERT INTO users (email, full_name, password, role)
VALUES ('admin@yourcompany.com', 'Fleet Administrator', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;
