-- Creating comprehensive database schema for school management system

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (
    role IN ('admin', 'principal', 'society_member', 'accountant', 'parent') -- ✅ added parent
  ),
  student_id INTEGER REFERENCES students(id), -- ✅ link parent to a student
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  class VARCHAR(50) NOT NULL,
  section VARCHAR(10),
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  admission_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee types table
CREATE TABLE IF NOT EXISTS fee_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee vouchers table
CREATE TABLE IF NOT EXISTS fee_vouchers (
  id SERIAL PRIMARY KEY,
  voucher_number VARCHAR(50) UNIQUE NOT NULL,
  student_id INTEGER REFERENCES students(id),
  fee_type_id INTEGER REFERENCES fee_types(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'overdue', 'cancelled')
  ),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id SERIAL PRIMARY KEY,
  voucher_id INTEGER REFERENCES fee_vouchers(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  processed_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-specific information table
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cnic VARCHAR(15) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  occupation VARCHAR(100),
  emergency_contact VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student relationship table
CREATE TABLE IF NOT EXISTS parent_student (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian')),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_vouchers_student_id ON fee_vouchers(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_vouchers_status ON fee_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_voucher_id ON fee_payments(voucher_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
