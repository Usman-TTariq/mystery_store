-- Check current stores table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- Also check a sample row to see actual data
SELECT * FROM stores LIMIT 1;
