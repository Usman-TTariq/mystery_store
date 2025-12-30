-- Fix Row-Level Security (RLS) policy for coupons table
-- This allows inserting new coupons from the admin panel

-- Enable RLS on coupons table (if not already enabled)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public insert access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public update access to coupons" ON coupons;
DROP POLICY IF EXISTS "Allow public delete access to coupons" ON coupons;

-- Allow anyone to read active coupons
CREATE POLICY "Allow public read access to coupons"
ON coupons FOR SELECT
USING (status = 'active');

-- Allow anyone to insert coupons (for admin panel)
CREATE POLICY "Allow public insert access to coupons"
ON coupons FOR INSERT
WITH CHECK (true);

-- Allow anyone to update coupons (for admin panel)
CREATE POLICY "Allow public update access to coupons"
ON coupons FOR UPDATE
USING (true);

-- Allow anyone to delete coupons (for admin panel)
CREATE POLICY "Allow public delete access to coupons"
ON coupons FOR DELETE
USING (true);

-- Verify policies are created
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully for coupons table';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  - SELECT: Active coupons only';
  RAISE NOTICE '  - INSERT: All allowed';
  RAISE NOTICE '  - UPDATE: All allowed';
  RAISE NOTICE '  - DELETE: All allowed';
END $$;
