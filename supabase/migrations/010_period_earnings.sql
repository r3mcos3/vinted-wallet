-- Period-based earnings statistics
-- Calculate earnings for week, month, and year periods
-- Supports offset to look back at previous periods

CREATE OR REPLACE FUNCTION get_period_earnings(
    p_user_id UUID,
    p_week_offset INTEGER DEFAULT 0,
    p_month_offset INTEGER DEFAULT 0,
    p_year_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_week_earned DECIMAL(10, 2);
    v_week_profit DECIMAL(10, 2);
    v_week_sales INTEGER;
    v_week_start DATE;
    v_week_end DATE;
    v_month_earned DECIMAL(10, 2);
    v_month_profit DECIMAL(10, 2);
    v_month_sales INTEGER;
    v_month_start DATE;
    v_month_end DATE;
    v_year_earned DECIMAL(10, 2);
    v_year_profit DECIMAL(10, 2);
    v_year_sales INTEGER;
    v_year_start DATE;
    v_year_end DATE;
BEGIN
    -- Calculate week range (offset is negative for past weeks)
    v_week_start := date_trunc('week', CURRENT_DATE + (p_week_offset * INTERVAL '1 week'))::DATE;
    v_week_end := v_week_start + INTERVAL '6 days' + INTERVAL '23 hours 59 minutes 59 seconds';

    -- Calculate month range
    v_month_start := date_trunc('month', CURRENT_DATE + (p_month_offset * INTERVAL '1 month'))::DATE;
    v_month_end := (date_trunc('month', v_month_start) + INTERVAL '1 month' - INTERVAL '1 second')::DATE;

    -- Calculate year range
    v_year_start := date_trunc('year', CURRENT_DATE + (p_year_offset * INTERVAL '1 year'))::DATE;
    v_year_end := (date_trunc('year', v_year_start) + INTERVAL '1 year' - INTERVAL '1 second')::DATE;

    -- Week earnings
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_week_earned, v_week_profit, v_week_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= v_week_start
    AND s.sold_at <= v_week_end;

    -- Month earnings
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_month_earned, v_month_profit, v_month_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= v_month_start
    AND s.sold_at <= v_month_end;

    -- Year earnings
    SELECT
        COALESCE(SUM(s.sale_price * s.quantity), 0),
        COALESCE(SUM((s.sale_price - p.purchase_price) * s.quantity), 0),
        COALESCE(SUM(s.quantity), 0)
    INTO v_year_earned, v_year_profit, v_year_sales
    FROM sales s
    JOIN product_sizes ps ON ps.id = s.product_size_id
    JOIN products p ON p.id = ps.product_id
    WHERE p.user_id = p_user_id
    AND s.sold_at >= v_year_start
    AND s.sold_at <= v_year_end;

    -- Build result JSON with period info
    result := json_build_object(
        'week', json_build_object(
            'earned', v_week_earned,
            'profit', v_week_profit,
            'sales', v_week_sales,
            'start_date', v_week_start,
            'end_date', v_week_end::DATE
        ),
        'month', json_build_object(
            'earned', v_month_earned,
            'profit', v_month_profit,
            'sales', v_month_sales,
            'start_date', v_month_start,
            'end_date', v_month_end::DATE
        ),
        'year', json_build_object(
            'earned', v_year_earned,
            'profit', v_year_profit,
            'sales', v_year_sales,
            'start_date', v_year_start,
            'end_date', v_year_end::DATE
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
