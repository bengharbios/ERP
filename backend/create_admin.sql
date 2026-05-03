-- Create Admin User
INSERT INTO users (id, email, first_name, last_name, phone, role, password, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@institute.com',
    'Admin',
    'User',
    '1234567890',
    'ADMIN',
    '$2a$10$YourHashedPasswordHere',
    NOW(),
    NOW()
);
