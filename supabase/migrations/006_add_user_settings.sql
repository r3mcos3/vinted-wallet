-- Add user_settings table to store starting budget and other user preferences
-- This allows users to track their wallet balance

-- =============================================================================
-- USER SETTINGS TABLE
-- =============================================================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    starting_budget DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (starting_budget >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UPDATE get_overview_stats FUNCTION
-- =============================================================================
-- Add wallet_balance to the statistics function
CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_starting_budget DECIMAL(10, 2);
    v_total_invested DECIMAL(10, 2);
    v_total_earned DECIMAL(10, 2);
    v_wallet_balance DECIMAL(10, 2);
BEGIN
    -- Get starting budget (or 0 if not set)
    SELECT COALESCE(starting_budget, 0) INTO v_starting_budget
    FROM user_settings
    WHERE user_id = p_user_id;

    -- If no settings exist, default to 0
    IF v_starting_budget IS NULL THEN
        v_starting_budget := 0;
    END IF;

    -- Calculate stats
    SELECT
        COALESCE(SUM(p.purchase_price * ps.total_quantity), 0),
        COALESCE(SUM(p.sale_price * ps.sold_quantity), 0)
    INTO v_total_invested, v_total_earned
    FROM products p
    LEFT JOIN product_sizes ps ON p.id = ps.product_id
    WHERE p.user_id = p_user_id;

    -- Calculate wallet balance: starting_budget - total_invested + total_earned
    v_wallet_balance := v_starting_budget - v_total_invested + v_total_earned;

    -- Build result JSON
    SELECT json_build_object(
        'total_invested', v_total_invested,
        'total_earned', v_total_earned,
        'inventory_value', COALESCE(
            (SELECT SUM(p.purchase_price * (ps.total_quantity - ps.sold_quantity))
             FROM products p
             LEFT JOIN product_sizes ps ON p.id = ps.product_id
             WHERE p.user_id = p_user_id), 0
        ),
        'total_products', COALESCE(
            (SELECT COUNT(DISTINCT p.id)
             FROM products p
             WHERE p.user_id = p_user_id), 0
        ),
        'total_items_sold', COALESCE(
            (SELECT SUM(ps.sold_quantity)
             FROM products p
             LEFT JOIN product_sizes ps ON p.id = ps.product_id
             WHERE p.user_id = p_user_id), 0
        ),
        'total_items_available', COALESCE(
            (SELECT SUM(ps.total_quantity - ps.sold_quantity)
             FROM products p
             LEFT JOIN product_sizes ps ON p.id = ps.product_id
             WHERE p.user_id = p_user_id), 0
        ),
        'starting_budget', v_starting_budget,
        'wallet_balance', v_wallet_balance
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTIONS FOR USER SETTINGS
-- =============================================================================

-- Function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id UUID)
RETURNS user_settings AS $$
DECLARE
    v_settings user_settings;
BEGIN
    -- Try to get existing settings
    SELECT * INTO v_settings
    FROM user_settings
    WHERE user_id = p_user_id;

    -- If not found, create default settings
    IF NOT FOUND THEN
        INSERT INTO user_settings (user_id, starting_budget)
        VALUES (p_user_id, 0.00)
        RETURNING * INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update starting budget
CREATE OR REPLACE FUNCTION update_starting_budget(
    p_user_id UUID,
    p_starting_budget DECIMAL(10, 2)
)
RETURNS user_settings AS $$
DECLARE
    v_settings user_settings;
BEGIN
    -- Validate amount
    IF p_starting_budget < 0 THEN
        RAISE EXCEPTION 'Starting budget cannot be negative';
    END IF;

    -- Insert or update settings
    INSERT INTO user_settings (user_id, starting_budget)
    VALUES (p_user_id, p_starting_budget)
    ON CONFLICT (user_id)
    DO UPDATE SET
        starting_budget = p_starting_budget,
        updated_at = NOW()
    RETURNING * INTO v_settings;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
