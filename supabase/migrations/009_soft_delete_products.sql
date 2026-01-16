-- Soft Delete for Products
-- Instead of deleting products, mark them as deleted to preserve sales history

-- =============================================================================
-- ADD DELETED_AT COLUMN TO PRODUCTS
-- =============================================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- =============================================================================
-- UPDATE GET_OVERVIEW_STATS FUNCTION
-- =============================================================================
-- Stats should include ALL products (deleted and active) to preserve earnings history
-- But inventory_value and total_items_available should only count active products

CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_starting_budget DECIMAL(10, 2);
    v_total_invested DECIMAL(10, 2);
    v_total_earned DECIMAL(10, 2);
    v_inventory_value DECIMAL(10, 2);
    v_total_products INTEGER;
    v_total_items_sold INTEGER;
    v_total_items_available INTEGER;
    v_wallet_balance DECIMAL(10, 2);
BEGIN
    -- Get starting budget (or 0 if not set)
    v_starting_budget := COALESCE(
        (SELECT starting_budget FROM user_settings WHERE user_id = p_user_id),
        0
    );

    -- Calculate invested from ALL products (including deleted) - money was spent
    v_total_invested := COALESCE(
        (SELECT SUM(p.purchase_price * ps.total_quantity)
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id),
        0
    );

    -- Calculate inventory value from ACTIVE products only
    v_inventory_value := COALESCE(
        (SELECT SUM(p.purchase_price * (ps.total_quantity - ps.sold_quantity))
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id AND p.deleted_at IS NULL),
        0
    );

    -- Count active products only
    v_total_products := COALESCE(
        (SELECT COUNT(DISTINCT p.id)
         FROM products p
         WHERE p.user_id = p_user_id AND p.deleted_at IS NULL),
        0
    );

    -- Count sold items from ALL products (including deleted)
    v_total_items_sold := COALESCE(
        (SELECT SUM(ps.sold_quantity)
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id),
        0
    );

    -- Count available items from ACTIVE products only
    v_total_items_available := COALESCE(
        (SELECT SUM(ps.total_quantity - ps.sold_quantity)
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id AND p.deleted_at IS NULL),
        0
    );

    -- Calculate total earned from ALL sales (including from deleted products)
    v_total_earned := COALESCE(
        (SELECT SUM(s.sale_price * s.quantity)
         FROM sales s
         JOIN product_sizes ps ON ps.id = s.product_size_id
         JOIN products p ON p.id = ps.product_id
         WHERE p.user_id = p_user_id),
        0
    );

    -- Calculate wallet balance: starting_budget - total_invested + total_earned
    v_wallet_balance := v_starting_budget - v_total_invested + v_total_earned;

    -- Build result JSON
    result := json_build_object(
        'total_invested', v_total_invested,
        'total_earned', v_total_earned,
        'inventory_value', v_inventory_value,
        'total_products', v_total_products,
        'total_items_sold', v_total_items_sold,
        'total_items_available', v_total_items_available,
        'starting_budget', v_starting_budget,
        'wallet_balance', v_wallet_balance
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- UPDATE RLS POLICIES FOR PRODUCTS
-- =============================================================================
-- Users should only see their own non-deleted products in normal queries
-- But the stats function (SECURITY DEFINER) can still access all products

-- Drop existing SELECT policy and create new one that filters deleted
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own active products"
    ON products FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Keep other policies unchanged (INSERT, UPDATE, DELETE still work on all owned products)
