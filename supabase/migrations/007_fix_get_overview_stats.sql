-- Fix get_overview_stats to handle missing user_settings gracefully
-- This ensures the function works even if user hasn't set up their settings yet

CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_starting_budget DECIMAL(10, 2);
    v_total_invested DECIMAL(10, 2);
    v_total_earned DECIMAL(10, 2);
    v_wallet_balance DECIMAL(10, 2);
    v_inventory_value DECIMAL(10, 2);
    v_total_products INTEGER;
    v_total_items_sold INTEGER;
    v_total_items_available INTEGER;
BEGIN
    -- Get starting budget (or 0 if not set)
    -- Using COALESCE with subquery to handle no rows case
    v_starting_budget := COALESCE(
        (SELECT starting_budget FROM user_settings WHERE user_id = p_user_id),
        0
    );

    -- Calculate total invested and earned
    SELECT
        COALESCE(SUM(p.purchase_price * ps.total_quantity), 0),
        COALESCE(SUM(p.sale_price * ps.sold_quantity), 0)
    INTO v_total_invested, v_total_earned
    FROM products p
    LEFT JOIN product_sizes ps ON p.id = ps.product_id
    WHERE p.user_id = p_user_id;

    -- Calculate inventory value
    v_inventory_value := COALESCE(
        (SELECT SUM(p.purchase_price * (ps.total_quantity - ps.sold_quantity))
         FROM products p
         LEFT JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id),
        0
    );

    -- Count total products
    v_total_products := COALESCE(
        (SELECT COUNT(DISTINCT p.id)
         FROM products p
         WHERE p.user_id = p_user_id),
        0
    );

    -- Calculate total items sold
    v_total_items_sold := COALESCE(
        (SELECT SUM(ps.sold_quantity)
         FROM products p
         LEFT JOIN product_sizes ps ON p.id = ps.product_id
         WHERE p.user_id = p_user_id),
        0
    );

    -- Calculate total items available
    v_total_items_available := COALESCE(
        (SELECT SUM(ps.total_quantity - ps.sold_quantity)
         FROM products p
         LEFT JOIN product_sizes ps ON p.id = ps.product_id
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
