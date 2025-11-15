-- Seed data untuk testing dengan Neon schema

-- Insert leave types
INSERT INTO leave_types (id, name, description, max_days_per_year)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Cuti Tahunan', 'Cuti tahunan karyawan', 12),
  ('550e8400-e29b-41d4-a716-446655440101', 'Cuti Sakit', 'Cuti karena sakit', 30),
  ('550e8400-e29b-41d4-a716-446655440102', 'Cuti Khusus', 'Cuti untuk keperluan khusus', 5);

-- Insert users dengan schema Neon
INSERT INTO users (id, email, password, name, role, department, position, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'hr-site@company.com', 'password123', 'Budi Santoso', 'hr-site', 'Human Resources', 'HR Staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440002', 'atasan@company.com', 'password123', 'Siti Nurhaliza', 'atasan', 'Operations', 'Manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440003', 'pjo@company.com', 'password123', 'Ahmad Wijaya', 'pjo', 'Human Resources', 'PJO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440004', 'hr-ho@company.com', 'password123', 'Dewi Lestari', 'hr-ho', 'Human Resources', 'HR Head', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440005', 'admin@company.com', 'password123', 'Rudi Hermawan', 'admin', 'IT', 'Administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample leave request
INSERT INTO leave_requests (
  id, user_id, submitted_by, submitted_by_name, leave_type_id,
  start_date, end_date, reason, status, created_at, updated_at
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Budi Santoso',
    '550e8400-e29b-41d4-a716-446655440100',
    '2025-02-01',
    '2025-02-05',
    'Liburan keluarga',
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Insert approval records untuk workflow
INSERT INTO approvals (
  id, leave_request_id, approver_id, approver_name, approver_role,
  status, notes, created_at, updated_at
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440002',
    'Siti Nurhaliza',
    'atasan',
    'pending',
    'Menunggu approval dari atasan langsung',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440003',
    'Ahmad Wijaya',
    'pjo',
    'pending',
    'Menunggu approval dari PJO',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440004',
    'Dewi Lestari',
    'hr-ho',
    'pending',
    'Menunggu approval dari HR Head Office',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
