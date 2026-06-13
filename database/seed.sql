INSERT INTO roles (name)
VALUES ('admin'), ('manager'), ('user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (id, name, email, password, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Admin', 'admin@demo.local', '$2a$10$wHfT1k6H8P3v2d3m6v1yXuC4sS1e6J8w1nQ3v2d3m6v1yXuC4sS1e', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'Demo User', 'user@demo.local', '$2a$10$wHfT1k6H8P3v2d3m6v1yXuC4sS1e6J8w1nQ3v2d3m6v1yXuC4sS1e', 'user')
ON CONFLICT (email) DO NOTHING;

