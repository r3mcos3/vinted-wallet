-- Cleanup Deprecated Fields and Functions
-- Run this AFTER testing confirms the variable pricing system works correctly

-- Drop the old sell_product_size function (replaced by record_sale)
DROP FUNCTION IF EXISTS sell_product_size(UUID, INTEGER);

-- Remove the deprecated sale_price column from products table
ALTER TABLE products DROP COLUMN IF EXISTS sale_price;
