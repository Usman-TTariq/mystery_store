-- Enable RLS on stores table if not already enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public insert access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public update access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public delete access to stores" ON stores;

-- Create policies for public access
-- Allow anyone to read stores
CREATE POLICY "Allow public read access to stores"
ON stores FOR SELECT
USING (true);

-- Allow anyone to insert stores
CREATE POLICY "Allow public insert access to stores"
ON stores FOR INSERT
WITH CHECK (true);

-- Allow anyone to update stores
CREATE POLICY "Allow public update access to stores"
ON stores FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete stores
CREATE POLICY "Allow public delete access to stores"
ON stores FOR DELETE
USING (true);
