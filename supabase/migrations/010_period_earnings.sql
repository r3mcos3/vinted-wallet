-- Period-based earnings statistics
-- Calculate earnings for week, month, and year periods

CREATE OR REPLACE FUNCTION get_period_earnings(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_week_earned DECIMAL(10, 2);
    v_week_profit DECIMAL(10, 2);
    v_week_sales INTEGER;
    v_month_earned DECIMAL(10, 2);
    v_month_profit DECIMAL(10, 2);
    v_month_sales INTEGER;
    v_year_earned DECIMAL(10, 2);
    v_year_profit DECIMAL(10, 2);
    v_year_sales INTEGER;
BEGIN
    -- This week (Monday to now)
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_week_earned, v_week_profit, v_week_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= date_trunc('week', CURRENT_DATE);

    -- This month
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_month_earned, v_month_profit, v_month_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= date_trunc('month', CURRENT_DATE);

    -- This year
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_year_earned, v_year_profit, v_year_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= date_trunc('year', CURRENT_DATE);

    -- Build result JSON
    result := json_build_object(
        'week', json_build_object(
            'earned', v_week_earned,
            'profit', v_week_profit,
            'sales', v_week_sales
        ),
        'month', json_build_object(
            'earned', v_month_earned,
            'profit', v_month_profit,
            'sales', v_month_sales
        ),
        'year', json_build_object(
            'earned', v_year_earned,
            'profit', v_year_profit,
            'sales', v_year_sales
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
