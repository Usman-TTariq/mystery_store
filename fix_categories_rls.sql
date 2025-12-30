-- Fix RLS policies for categories table
-- Run this in Supabase SQL Editor

-- Enable RLS on categories table if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can select categories" ON categories;
DROP POLICY IF EXISTS "Public can insert categories" ON categories;
DROP POLICY IF EXISTS "Public can update categories" ON categories;
DROP POLICY IF EXISTS "Public can delete categories" ON categories;

-- Allow public to select categories (for frontend display)
CREATE POLICY "Public can select categories" ON categories
  FOR SELECT
  USING (true);

-- Allow public to insert categories (for admin panel)
CREATE POLICY "Public can insert categories" ON categories
  FOR INSERT
  WITH CHECK (true);

-- Allow public to update categories (for admin panel)
CREATE POLICY "Public can update categories" ON categories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public to delete categories (for admin panel)
CREATE POLICY "Public can delete categories" ON categories
  FOR DELETE
  USING (true);

