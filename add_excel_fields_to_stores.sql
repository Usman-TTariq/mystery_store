-- Add new columns to stores table for Excel bulk upload support
-- Run this in Supabase SQL Editor

-- Add merchant_id column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS merchant_id TEXT;

-- Add network_id column  
ALTER TABLE stores ADD COLUMN IF NOT EXISTS network_id TEXT;

-- Add website_url column (if not exists)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add tracking_link column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tracking_link TEXT;

-- Add country column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Add status column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON stores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_stores_network_id ON stores(network_id);
CREATE INDEX IF NOT EXISTS idx_stores_country ON stores(country);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- Update existing stores to have default status if null
UPDATE stores SET status = 'active' WHERE status IS NULL;
UPDATE stores SET country = 'US' WHERE country IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added new columns to stores table for Excel bulk upload support';
END $$;
