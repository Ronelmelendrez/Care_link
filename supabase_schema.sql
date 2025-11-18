-- ============================================
-- CareLink Database Schema for Supabase
-- University Clinic Appointment System
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user information for both Patients and Doctors
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Patient', 'Doctor', 'Staff')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  specialty VARCHAR(100), -- Only for doctors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. AVAILABLE_SLOTS TABLE
-- Stores time slots created by doctors
-- ============================================
CREATE TABLE IF NOT EXISTS available_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  is_booked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, date, time) -- Prevent duplicate slots for same doctor at same time
);

-- ============================================
-- 3. APPOINTMENTS TABLE
-- Stores appointment bookings
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES available_slots(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT, -- Notes from doctor after confirmation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id, status) -- Prevent multiple active appointments for same slot
);

-- ============================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Available slots indexes
CREATE INDEX IF NOT EXISTS idx_slots_doctor_id ON available_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON available_slots(date);
CREATE INDEX IF NOT EXISTS idx_slots_is_booked ON available_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON available_slots(doctor_id, date);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_id ON appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view all profiles
CREATE POLICY "Allow users to view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Allow users to insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Allow users to update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- AVAILABLE_SLOTS TABLE POLICIES
-- ============================================

-- Anyone can view available slots
CREATE POLICY "Allow users to view available slots"
  ON available_slots FOR SELECT
  USING (true);

-- Only doctors can insert their own slots
CREATE POLICY "Allow doctors to insert their own slots"
  ON available_slots FOR INSERT
  WITH CHECK (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Doctor'
    )
  );

-- Only doctors can update their own slots
CREATE POLICY "Allow doctors to update their own slots"
  ON available_slots FOR UPDATE
  USING (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Doctor'
    )
  );

-- Only doctors can delete their own slots
CREATE POLICY "Allow doctors to delete their own slots"
  ON available_slots FOR DELETE
  USING (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Doctor'
    )
  );

-- ============================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================

-- Patients can view their own appointments
-- Doctors can view appointments for their slots
CREATE POLICY "Allow users to view their own appointments"
  ON appointments FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM available_slots
      WHERE available_slots.id = appointments.slot_id
      AND available_slots.doctor_id = auth.uid()
    )
  );

-- Patients can create appointments
CREATE POLICY "Allow patients to create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Patient'
    )
  );

-- Patients can cancel their own appointments
-- Doctors can update appointments for their slots
CREATE POLICY "Allow users to update appointments"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM available_slots
      WHERE available_slots.id = appointments.slot_id
      AND available_slots.doctor_id = auth.uid()
    )
  );

-- Patients can delete their cancelled appointments
CREATE POLICY "Allow patients to delete cancelled appointments"
  ON appointments FOR DELETE
  USING (
    auth.uid() = patient_id AND
    status = 'cancelled'
  );

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_available_slots_updated_at
  BEFORE UPDATE ON available_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update slot booking status
CREATE OR REPLACE FUNCTION update_slot_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When appointment is created, mark slot as booked
    IF NEW.status IN ('pending', 'confirmed') THEN
      UPDATE available_slots
      SET is_booked = TRUE
      WHERE id = NEW.slot_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- When appointment is cancelled, mark slot as available
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      UPDATE available_slots
      SET is_booked = FALSE
      WHERE id = NEW.slot_id;
    END IF;
    -- When appointment is reactivated, mark slot as booked
    IF NEW.status IN ('pending', 'confirmed') AND OLD.status = 'cancelled' THEN
      UPDATE available_slots
      SET is_booked = TRUE
      WHERE id = NEW.slot_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- When appointment is deleted, mark slot as available
    IF OLD.status IN ('pending', 'confirmed') THEN
      UPDATE available_slots
      SET is_booked = FALSE
      WHERE id = OLD.slot_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointment status changes
CREATE TRIGGER manage_slot_booking_status
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_booking_status();

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Uncomment the following lines if you want to insert sample data for testing
/*
-- Insert sample doctor (you'll need to create auth user first)
INSERT INTO profiles (id, role, first_name, last_name, email, specialty)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Doctor', 'John', 'Smith', 'doctor@example.com', 'General Medicine');

-- Insert sample patient (you'll need to create auth user first)
INSERT INTO profiles (id, role, first_name, last_name, email)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Patient', 'Jane', 'Doe', 'patient@example.com');

-- Insert sample available slots
INSERT INTO available_slots (doctor_id, date, time, duration)
VALUES 
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '09:00', 30),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '10:00', 30),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '11:00', 30);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'available_slots', 'appointments');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'available_slots', 'appointments');

-- ============================================
-- COMPLETED
-- ============================================

-- Your CareLink database is now ready to use!
-- Make sure to update your .env file with your Supabase credentials
