-- Correct get_overview_stats to use sales table and add wallet balance
-- This version works with the variable pricing system (sales table)

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

    -- Calculate all stats from products and product_sizes
    SELECT
        COALESCE(SUM(p.purchase_price * ps.total_quantity), 0),
        COALESCE(SUM(p.purchase_price * (ps.total_quantity - ps.sold_quantity)), 0),
        COUNT(DISTINCT p.id),
        COALESCE(SUM(ps.sold_quantity), 0),
        COALESCE(SUM(ps.total_quantity - ps.sold_quantity), 0)
    INTO
        v_total_invested,
        v_inventory_value,
        v_total_products,
        v_total_items_sold,
        v_total_items_available
    FROM products p
    LEFT JOIN product_sizes ps ON p.id = ps.product_id
    WHERE p.user_id = p_user_id;

    -- Calculate total earned from sales table
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
