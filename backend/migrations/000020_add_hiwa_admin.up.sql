INSERT INTO admins (google_id, email, name, avatar, role_id)
VALUES (
  '101655488781650664740',
  'hiwacoffee1223@gmail.com',
  '檜田康一',
  '',
  (SELECT id FROM admin_roles WHERE name = 'super_admin')
) ON CONFLICT (email) DO NOTHING;
