-- Variable Pricing Migration
-- Converts from fixed sale_price per product to variable pricing per sale transaction

-- =============================================================================
-- SALES TABLE
-- =============================================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_size_id UUID NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,
    sale_price DECIMAL(10, 2) NOT NULL CHECK (sale_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    sold_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sales_product_size_id ON sales(product_size_id);
CREATE INDEX idx_sales_sold_at ON sales(sold_at DESC);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales table
CREATE POLICY "Users can view own sales"
    ON sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM product_sizes ps
            JOIN products p ON p.id = ps.product_id
            WHERE ps.id = sales.product_size_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own sales"
    ON sales FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own sales"
    ON sales FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM product_sizes ps
            JOIN products p ON p.id = ps.product_id
            WHERE ps.id = sales.product_size_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own sales"
    ON sales FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM product_sizes ps
            JOIN products p ON p.id = ps.product_id
            WHERE ps.id = sales.product_size_id
            AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- NEW RECORD_SALE FUNCTION
-- =============================================================================
-- Replaces sell_product_size with variable pricing support
CREATE OR REPLACE FUNCTION record_sale(
    p_product_size_id UUID,
    p_sale_price DECIMAL(10, 2),
    p_quantity INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL
)
RETURNS sales AS $$
DECLARE
    v_result sales;
    v_available INTEGER;
BEGIN
    -- Validate inputs
    IF p_sale_price < 0 THEN
        RAISE EXCEPTION 'Sale price cannot be negative';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;

    -- Check available quantity
    SELECT (total_quantity - sold_quantity) INTO v_available
    FROM product_sizes
    WHERE id = p_product_size_id;

    -- Validate that we have enough available
    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Product size not found';
    END IF;

    IF v_available < p_quantity THEN
        RAISE EXCEPTION 'Cannot sell % items. Only % available', p_quantity, v_available;
    END IF;

    -- Update sold quantity
    UPDATE product_sizes
    SET sold_quantity = sold_quantity + p_quantity
    WHERE id = p_product_size_id;

    -- Create sale record
    INSERT INTO sales (product_size_id, sale_price, quantity, notes)
    VALUES (p_product_size_id, p_sale_price, p_quantity, p_notes)
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- UPDATE GET_OVERVIEW_STATS FUNCTION
-- =============================================================================
-- Update to calculate total_earned from sales table instead of fixed sale_price
DROP FUNCTION IF EXISTS get_overview_stats(UUID);

CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_invested', COALESCE(SUM(p.purchase_price * ps.total_quantity), 0),
        'total_earned', COALESCE(
            (SELECT SUM(s.sale_price * s.quantity)
             FROM sales s
             JOIN product_sizes ps2 ON ps2.id = s.product_size_id
             JOIN products p2 ON p2.id = ps2.product_id
             WHERE p2.user_id = p_user_id), 0
        ),
        'inventory_value', COALESCE(SUM(p.purchase_price * (ps.total_quantity - ps.sold_quantity)), 0),
        'total_products', COUNT(DISTINCT p.id),
        'total_items_sold', COALESCE(SUM(ps.sold_quantity), 0),
        'total_items_available', COALESCE(SUM(ps.total_quantity - ps.sold_quantity), 0)
    ) INTO result
    FROM products p
    LEFT JOIN product_sizes ps ON p.id = ps.product_id
    WHERE p.user_id = p_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DATA CLEANUP (Optional - since existing data is mock data)
-- =============================================================================
-- Reset sold_quantity to 0 for clean slate
-- Uncomment if you want to reset existing mock data:
-- UPDATE product_sizes SET sold_quantity = 0;

-- =============================================================================
-- REMOVE DEPRECATED COLUMN (Run after frontend updated)
-- =============================================================================
-- Drop sale_price column from products table
-- Run this AFTER all frontend code is updated to not use sale_price
-- ALTER TABLE products DROP COLUMN IF EXISTS sale_price;

-- Drop old sell_product_size function
-- Run this AFTER frontend is updated to use record_sale
-- DROP FUNCTION IF EXISTS sell_product_size(UUID, INTEGER);
