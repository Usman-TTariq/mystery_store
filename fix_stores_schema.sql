-- ============================================
-- Fix Stores Table Schema
-- ============================================
-- This script adds store_id and renames columns to match the code expectations

-- Step 1: Add store_id column as SERIAL (auto-incrementing integer)
DO $$ 
BEGIN
  -- First, drop the column if it exists (to start fresh)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE stores DROP COLUMN store_id;
    RAISE NOTICE 'Dropped existing store_id column';
  END IF;

  -- Add store_id as SERIAL (auto-incrementing from 1)
  ALTER TABLE stores ADD COLUMN store_id SERIAL UNIQUE NOT NULL;
  RAISE NOTICE 'Added store_id column with SERIAL type';
END $$;

-- Step 2: Rename columns to match code expectations
DO $$ 
BEGIN
  -- Rename 'name' to 'store_name'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'name'
  ) THEN
    ALTER TABLE stores RENAME COLUMN name TO store_name;
    RAISE NOTICE 'Renamed name to store_name';
  END IF;

  -- Rename 'logo_url' to 'store_logo_url'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE stores RENAME COLUMN logo_url TO store_logo_url;
    RAISE NOTICE 'Renamed logo_url to store_logo_url';
  END IF;

  -- Add merchant_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'merchant_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN merchant_id TEXT;
    RAISE NOTICE 'Added merchant_id column';
  END IF;

  -- Add network_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'network_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN network_id TEXT;
    RAISE NOTICE 'Added network_id column';
  END IF;

  -- Add tracking_link if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'tracking_link'
  ) THEN
    ALTER TABLE stores ADD COLUMN tracking_link TEXT;
    RAISE NOTICE 'Added tracking_link column';
  END IF;

  -- Rename 'featured' to 'isTrending' (if you want to match the code)
  -- Note: Only do this if you want to use isTrending instead of featured
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'featured'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'isTrending'
  ) THEN
    ALTER TABLE stores RENAME COLUMN featured TO "isTrending";
    RAISE NOTICE 'Renamed featured to isTrending';
  END IF;

  -- Add isTrending if it doesn't exist and featured doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'isTrending'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'featured'
  ) THEN
    ALTER TABLE stores ADD COLUMN "isTrending" BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added isTrending column';
  END IF;

  -- Rename 'seo_title' to 'seoTitle' (camelCase)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'seo_title'
  ) THEN
    ALTER TABLE stores RENAME COLUMN seo_title TO "seoTitle";
    RAISE NOTICE 'Renamed seo_title to seoTitle';
  END IF;

  -- Rename 'seo_description' to 'seoDescription' (camelCase)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'seo_description'
  ) THEN
    ALTER TABLE stores RENAME COLUMN seo_description TO "seoDescription";
    RAISE NOTICE 'Renamed seo_description to seoDescription';
  END IF;

  -- Rename 'sub_store_name' to 'subStoreName' (camelCase)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'sub_store_name'
  ) THEN
    ALTER TABLE stores RENAME COLUMN sub_store_name TO "subStoreName";
    RAISE NOTICE 'Renamed sub_store_name to subStoreName';
  END IF;

END $$;

-- Step 3: Create index on store_id for better performance
CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id);

-- Step 4: Display current schema
DO $$ 
BEGIN
  RAISE NOTICE 'Stores table schema updated successfully!';
END $$;

-- View the updated schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stores'
ORDER BY ordinal_position;
