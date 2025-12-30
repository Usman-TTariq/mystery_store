-- ============================================
-- Fix Banner RLS Policies for Admin Panel
-- ============================================
-- Run this SQL in Supabase SQL Editor if banners are not creating
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can insert banners" ON banners;
DROP POLICY IF EXISTS "Public can update banners" ON banners;
DROP POLICY IF EXISTS "Public can delete banners" ON banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON banners;

-- Allow public to insert banners (for admin panel using service role key)
-- Note: Service role key bypasses RLS, but this ensures it works
CREATE POLICY "Public can insert banners" ON banners FOR INSERT WITH CHECK (true);

-- Allow public to update banners
CREATE POLICY "Public can update banners" ON banners FOR UPDATE USING (true) WITH CHECK (true);

-- Allow public to delete banners
CREATE POLICY "Public can delete banners" ON banners FOR DELETE USING (true);

-- Alternative: If you want to restrict to authenticated users only, use:
-- CREATE POLICY "Authenticated users can manage banners" ON banners FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
-- 2. If using anon key, you need these policies
-- 3. For production, restrict to authenticated admin users only
-- ============================================

