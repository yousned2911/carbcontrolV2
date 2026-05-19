-- =============================================
-- DROP EXISTING TABLES (clean reset)
-- =============================================
DROP TABLE IF EXISTS driver_scores CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS fuel_events CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS depots CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- =============================================
-- CORRECTED SCHEMA
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies (tenants)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'company_admin' CHECK (role IN ('super_admin', 'company_admin', 'fleet_manager', 'fuel_manager', 'maintenance_manager', 'driver')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for new auth users (reads role and company_id from raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'company_admin'),
    (NEW.raw_user_meta_data ->> 'company_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Depots
CREATE TABLE depots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  geofence JSONB
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plate TEXT NOT NULL,
  vin TEXT,
  tracker_id TEXT,
  fuel_sensor_id TEXT,
  depot_id UUID REFERENCES depots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Telemetry
CREATE TABLE telemetry (
  id BIGSERIAL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  fuel_level DOUBLE PRECISION,
  ignition BOOLEAN,
  raw_data JSONB
);
CREATE INDEX idx_telemetry_vehicle_time ON telemetry(vehicle_id, timestamp DESC);

-- Fuel events (NOW WITH company_id)
CREATE TABLE fuel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('refuel', 'drain')),
  amount_liters DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  detected_by TEXT DEFAULT 'sensor',
  metadata JSONB
);

-- Manual fuel logs (NOW WITH company_id)
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  liters DOUBLE PRECISION,
  cost DOUBLE PRECISION,
  timestamp TIMESTAMPTZ,
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id)
);

-- Maintenance logs (NOW WITH company_id)
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT,
  description TEXT,
  cost DOUBLE PRECISION,
  workshop TEXT,
  date TIMESTAMPTZ,
  documents JSONB
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('vehicle', 'driver', 'company')),
  entity_id UUID NOT NULL,
  name TEXT,
  file_path TEXT,
  expiration_date DATE,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  rule_type TEXT NOT NULL,
  message TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Driver scores (NOW WITH company_id)
CREATE TABLE driver_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score NUMERIC,
  period_start DATE,
  period_end DATE,
  details JSONB
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_scores ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Generic RLS policies for tables with company_id
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    VALUES ('depots'), ('vehicles'), ('telemetry'), ('fuel_events'), 
           ('fuel_logs'), ('maintenance_logs'), ('documents'), ('alerts'), 
           ('driver_scores')
  LOOP
    EXECUTE format('
      CREATE POLICY "Users can select own company data" ON %I
        FOR SELECT USING (company_id = user_company_id());
      
      CREATE POLICY "Users can insert own company data" ON %I
        FOR INSERT WITH CHECK (company_id = user_company_id());
      
      CREATE POLICY "Users can update own company data" ON %I
        FOR UPDATE USING (company_id = user_company_id());
      
      CREATE POLICY "Users can delete own company data" ON %I
        FOR DELETE USING (company_id = user_company_id());
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- RLS for companies table (special case)
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = user_company_id());

CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (id = user_company_id());

-- Allow authenticated users to insert a company (when creating a new company)
CREATE POLICY "Allow insert companies for authenticated users" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');