-- Vinted Wallet Database Schema
-- Initial migration with products, product_sizes, and supporting functions

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    purchase_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view own products"
    ON products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- PRODUCT SIZES TABLE
-- =============================================================================
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    sold_quantity INTEGER DEFAULT 0 CHECK (sold_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size)
);

-- Index for performance
CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);

-- Constraint: sold_quantity can't exceed total_quantity
ALTER TABLE product_sizes
ADD CONSTRAINT check_sold_quantity
CHECK (sold_quantity <= total_quantity);

-- Enable Row Level Security
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_sizes
CREATE POLICY "Users can view own product sizes"
    ON product_sizes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_sizes.product_id
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own product sizes"
    ON product_sizes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_sizes.product_id
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own product sizes"
    ON product_sizes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_sizes.product_id
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own product sizes"
    ON product_sizes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_sizes.product_id
            AND products.user_id = auth.uid()
        )
    );

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Function to get overview statistics for a user
CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_invested', COALESCE(SUM(p.purchase_price * ps.total_quantity), 0),
        'total_earned', COALESCE(SUM(p.sale_price * ps.sold_quantity), 0),
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

-- Function to sell a product size with validation
CREATE OR REPLACE FUNCTION sell_product_size(
    p_size_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS product_sizes AS $$
DECLARE
    v_result product_sizes;
    v_available INTEGER;
BEGIN
    -- Check available quantity
    SELECT (total_quantity - sold_quantity) INTO v_available
    FROM product_sizes
    WHERE id = p_size_id;

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
    WHERE id = p_size_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STORAGE POLICIES (for product-images bucket)
-- =============================================================================
-- Note: You need to manually create the 'product-images' bucket in Supabase Dashboard first
-- Then apply these policies via the Storage settings in the dashboard or run them separately

-- Storage policies for product images
-- These will be applied to the 'product-images' bucket

-- INSERT policy: Users can upload to their own folder
-- CREATE POLICY "Users can upload own images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'product-images'
--     AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- SELECT policy: Users can view all images
-- CREATE POLICY "Users can view images"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'product-images');

-- DELETE policy: Users can delete own images
-- CREATE POLICY "Users can delete own images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--     bucket_id = 'product-images'
--     AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- =============================================================================
-- INITIAL DATA (optional)
-- =============================================================================
-- No seed data for now
