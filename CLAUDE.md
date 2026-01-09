# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vinted Wallet is a resale tracking web application for managing product inventory, sales, and profit calculations. Built as a frontend-only React app with Supabase as the backend (PostgreSQL + Auth + Storage).

**Purpose**: Track products bought for resale on Vinted, manage multi-size inventory, record individual sales, and calculate profit metrics.

## Development Commands

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Architecture Overview

### Frontend Architecture

**State Management Pattern**: React Context + Custom Hooks (no Redux)
- `AuthContext`: Global authentication state (user, login, logout)
- Custom hooks for data operations: `useProducts()`, `useStats()`, `useAuth()`

**Data Flow for Product Operations**:
1. Component calls custom hook (e.g., `useProducts()`)
2. Hook interacts directly with Supabase client
3. Supabase handles auth verification via JWT + Row Level Security
4. Hook updates local state and returns to component

**Key Pattern - Product Creation Flow**:
```
ProductForm → useProducts.createProduct() → [Upload Image to Storage] → [Insert Product] → [Insert Product Sizes] → Refresh products list
```

### Backend (Supabase)

**Database Schema**:
- `products`: Main product table with user_id, pricing, and image_url
- `product_sizes`: Child table for multi-size tracking (size, total_quantity, sold_quantity)
- **Critical Relationship**: Each product can have multiple sizes via `product_sizes.product_id` foreign key with CASCADE delete

**Row Level Security (RLS)**:
- All tables have RLS enabled
- Users can only view/modify their own products (checked via `auth.uid() = user_id`)
- INSERT policies may need `WITH CHECK (true)` instead of user_id check due to session timing (see migration 002)

**Database Functions**:
- `get_overview_stats(p_user_id)`: Returns aggregated statistics (invested, earned, profit) as JSON
- `sell_product_size(p_size_id, p_quantity)`: Validates and increments sold_quantity with constraint checking

**Storage**:
- Bucket: `product-images` (must be public)
- File structure: `{user_id}/{timestamp}.{ext}`
- Access via public URLs from `supabase.storage.getPublicUrl()`

### Multi-Size Inventory System

**Critical Concept**: Products can be tracked with OR without specific sizes
- **With sizes**: User selects clothing sizes (XS-XXL), shoe sizes (36-46), or custom sizes
- **Without sizes**: Simple quantity field creates a "One Size" entry automatically

**Size Tracking**:
- `total_quantity`: How many items purchased of this size
- `sold_quantity`: How many sold (incremented via sell_product_size function)
- Available = total_quantity - sold_quantity

**Selling Individual Items**:
- Sales happen at the size level, not product level
- Each size can be sold independently
- Constraint: `sold_quantity <= total_quantity` enforced at database level

## Environment Setup

**Required Environment Variables** (`.env.local`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Setup Requirements**:
1. Run migrations in `supabase/migrations/` via Supabase SQL Editor
2. Create Storage bucket named `product-images` and set it to public
3. If RLS issues occur, may need to run migration 002 to relax INSERT policies
4. Disable email confirmation in Auth settings for local development

## Profit Calculation Logic

**Formulas** (implemented in `get_overview_stats` function and frontend calculations):
- Total Invested = SUM(purchase_price × total_quantity) across all product_sizes
- Total Earned = SUM(sale_price × sold_quantity) for sold items only
- Inventory Value = SUM(purchase_price × available_quantity) for unsold items
- Net Profit = Total Earned - (purchase_price × sold_quantity for sold items)
- ROI = (Net Profit / Total Invested) × 100%
- Sell-through Rate = (Total Sold / Total Items) × 100%

**Important**: Stats only count actually sold items, not potential profit from unsold inventory.

## Component Patterns

**SizeManager Component**:
- Three modes: Clothing sizes, Shoe sizes, Custom input
- Switches between predefined buttons and text input
- Outputs array of `{size, quantity}` objects
- Disables simple quantity field when sizes are selected

**ProductForm Component**:
- Handles both add and edit modes via optional `product` prop
- Image upload accepts File object or existing URL
- Validates: name required, purchase_price > 0, either quantity OR sizes must be set
- If no sizes selected, automatically creates "One Size" entry with quantity value

**ImageUpload Component**:
- Drag & drop with preview
- Validates: image types only, max 5MB
- Returns File object to parent (actual upload happens in useProducts hook)

## Common Issues & Solutions

**RLS Policy Violations on INSERT**:
- Problem: `WITH CHECK (auth.uid() = user_id)` fails due to session timing
- Solution: Use `WITH CHECK (true)` for INSERT policies (foreign key still enforces ownership)
- See: `supabase/migrations/002_fix_rls_policies.sql`

**Storage Upload Failures**:
- Ensure bucket is set to public in Supabase dashboard
- Check bucket name matches `PRODUCTS_BUCKET` constant in `src/lib/supabase.js`

**Product Update Workflow**:
- Deletes all existing product_sizes and recreates them (not UPSERT)
- This resets sold_quantity - TODO: Preserve sales history during edits

## Design System

**Fonts**: Outfit (headers), DM Sans (body) - loaded via Google Fonts in CSS files

**Color Scheme**:
- Primary Blue: `#4A7FFF` (actions, links)
- Success Green: `#10B981` (profit, available)
- Error Red: `#EF4444` (loss, sold out)
- Warning Yellow: `#F59E0B` (partial inventory)

**Animation Pattern**: Staggered fade-ins using `animation-delay` based on index
- See: `ProductGrid.css` for implementation example
