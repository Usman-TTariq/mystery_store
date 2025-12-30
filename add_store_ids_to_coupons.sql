-- Add store_ids column to coupons table for coupon-store relationship
-- This allows one coupon to be associated with multiple stores

-- Add store_ids column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'store_ids'
  ) THEN
    ALTER TABLE coupons ADD COLUMN store_ids UUID[] DEFAULT ARRAY[]::UUID[];
    RAISE NOTICE '✅ Column store_ids added to coupons table';
  ELSE
    RAISE NOTICE '⚠️ Column store_ids already exists in coupons table';
  END IF;
END $$;

-- Create GIN index for better query performance on array operations
-- GIN (Generalized Inverted Index) is optimal for array contains queries
CREATE INDEX IF NOT EXISTS idx_coupons_store_ids ON coupons USING GIN (store_ids);

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE 'Column store_ids type: UUID[]';
  RAISE NOTICE 'Index idx_coupons_store_ids created for efficient queries';
END $$;
