-- Remove unused merchant_id / network_id from stores

DROP INDEX IF EXISTS idx_stores_merchant_id;
DROP INDEX IF EXISTS idx_stores_network_id;

ALTER TABLE stores DROP COLUMN IF EXISTS merchant_id;
ALTER TABLE stores DROP COLUMN IF EXISTS network_id;
