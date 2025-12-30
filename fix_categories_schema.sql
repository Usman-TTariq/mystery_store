-- Fix categories table schema
-- Run this in Supabase SQL Editor

-- Add background_color column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE categories ADD COLUMN background_color TEXT DEFAULT '#000000';
  END IF;
END $$;

-- Add icon_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon_url TEXT;
  END IF;
END $$;

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE categories ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Update existing categories to have default background_color if null
UPDATE categories 
SET background_color = '#000000' 
WHERE background_color IS NULL;

-- Update existing categories to have default timestamps if null
UPDATE categories 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE categories 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Create index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

