-- Add purchase_date to products table for return tracking
-- Products can be returned within 30 days of purchase
-- Status "Product Retour" shown 7 days before deadline (23 days after purchase)

ALTER TABLE products
ADD COLUMN purchase_date DATE DEFAULT CURRENT_DATE;

-- Update existing products to use created_at as purchase_date
UPDATE products
SET purchase_date = DATE(created_at)
WHERE purchase_date IS NULL;

-- Make purchase_date NOT NULL after backfill
ALTER TABLE products
ALTER COLUMN purchase_date SET NOT NULL;

-- Create a view or function to calculate product status
-- This can be used in queries to determine if product needs return warning
CREATE OR REPLACE FUNCTION get_product_return_status(p_purchase_date DATE)
RETURNS TEXT AS $$
DECLARE
    days_since_purchase INTEGER;
    days_until_deadline INTEGER;
BEGIN
    days_since_purchase := CURRENT_DATE - p_purchase_date;
    days_until_deadline := 30 - days_since_purchase;

    -- If past 30 days, return deadline has passed
    IF days_since_purchase > 30 THEN
        RETURN 'expired';
    -- If 7 or fewer days until deadline (23+ days after purchase)
    ELSIF days_until_deadline <= 7 THEN
        RETURN 'warning';
    -- Normal status
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
