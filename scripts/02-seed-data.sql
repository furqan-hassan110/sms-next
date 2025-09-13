-- Seeding initial data for the school management system

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@school.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'System Administrator', 'admin'),
('principal@school.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'School Principal', 'principal'),
('society@school.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Society Member', 'society_member'),
('accountant@school.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'School Accountant', 'accountant')
ON CONFLICT (email) DO NOTHING;

-- Insert sample fee types
INSERT INTO fee_types (name, description, amount) VALUES 
('Monthly Tuition', 'Regular monthly tuition fee', 5000.00),
('Admission Fee', 'One-time admission fee', 10000.00),
('Examination Fee', 'Semester examination fee', 2000.00),
('Library Fee', 'Annual library fee', 1500.00),
('Sports Fee', 'Annual sports activities fee', 3000.00),
('Transport Fee', 'Monthly transport fee', 2500.00)
ON CONFLICT DO NOTHING;

-- Insert sample students
INSERT INTO students (student_id, name, class, section, father_name, mother_name, phone, address, admission_date) VALUES 
('STU001', 'Ahmed Ali', 'Grade 10', 'A', 'Muhammad Ali', 'Fatima Ali', '03001234567', '123 Main Street, Karachi', '2024-01-15'),
('STU002', 'Sara Khan', 'Grade 9', 'B', 'Imran Khan', 'Ayesha Khan', '03009876543', '456 Park Avenue, Lahore', '2024-01-20'),
('STU003', 'Hassan Ahmed', 'Grade 11', 'A', 'Ahmed Hassan', 'Zainab Ahmed', '03007654321', '789 School Road, Islamabad', '2024-02-01'),
('STU004', 'Zara Sheikh', 'Grade 8', 'C', 'Omar Sheikh', 'Nadia Sheikh', '03005432109', '321 Garden Street, Karachi', '2024-02-10')
ON CONFLICT (student_id) DO NOTHING;
