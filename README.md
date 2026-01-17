# Vinted Wallet 💰

A modern web application for tracking Vinted purchases and sales. Perfect for resellers who want to track their inventory and profit.

## ✨ Features

- **Authentication**: Secure login/registration with Supabase Auth
- **Product Management**: Add, edit, and delete products
- **Multi-size Tracking**: Track multiple sizes per product with individual stock
- **Image Upload**: Drag & drop photo upload with preview
- **Sales Tracking**: Sell items per size and track what is available
- **Statistics Dashboard**: Real-time overview of investment, earnings, and profit
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🎨 Design

Modern Boutique aesthetic with:
- **Fonts**: Outfit (headers) + DM Sans (body)
- **Colors**:
  - Cobalt Blue (#4A7FFF) for primary actions
  - Green (#10B981) for profit/available
  - Red (#EF4444) for loss/sold out
- **Animations**: Smooth hover effects, fade-ins, and micro-interactions
- **Components**: Large product images, badges, and intuitive forms

## 🚀 Setup

### 1. Supabase Database

You have already executed the SQL migration in Supabase. Make sure you have also created the **Storage bucket**:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket: `product-images`
3. Set it to **Public**

### 2. Dependencies

Dependencies are already installed! If not:

```bash
npm install
```

### 3. Start Development Server

The server is already running on http://localhost:5173!

To restart:

```bash
npm run dev
```

### 4. Mock Mode (Optional)

Want to test the app without Supabase? Use mock mode with sample data:

```bash
npm run dev:mock
```

This starts the app with:
- 8 realistic sample products
- Various scenarios (sold, partially sold, loss)
- Working statistics and sales functionality
- No Supabase credentials needed

Perfect for:
- Demos and presentations
- UI/UX testing
- Development without database

## 📱 Usage

### 1. Register

1. Go to http://localhost:5173/register
2. Create an account with email/password
3. You will be automatically logged in

### 2. Add Product

1. Click on **"+ New Product"**
2. Upload a photo (drag & drop or click)
3. Fill in product details:
   - Name
   - Purchase price (what you paid)
   - Selling price (what you ask)
   - Notes (optional)
4. Select sizes and quantities:
   - Click on the size buttons (XS, S, M, L, XL, XXL)
   - Fill in the quantity per size
5. Click **"Add Product"**

### 3. Sell Product

1. Click on a product in the overview
2. See all sizes with availability
3. Click **"Sell"** for an available size
4. Confirm the sale
5. Inventory is automatically updated

### 4. View Statistics

1. Click on **"📊 Statistics"**
2. See overview of:
   - Total invested
   - Total earned
   - Net profit
   - Inventory value
   - Items sold/available
   - ROI and sell-through rate

## 📂 Project Structure

```
vinted-wallet/
├── src/
│   ├── components/
│   │   ├── auth/              # Login/Register forms
│   │   ├── products/          # Product components
│   │   ├── stats/             # Stats components
│   │   └── common/            # Reusable components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # React Context
│   ├── lib/                   # Supabase client
│   ├── mocks/                 # Mock data for development
│   └── styles/                # CSS files
├── supabase/
│   └── migrations/            # Database schema
└── public/                    # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Styling**: Custom CSS (Modern Boutique design)

## 🔒 Security

- ✅ Passwords are automatically hashed by Supabase
- ✅ Row Level Security (RLS) on all database tables
- ✅ Users can only see/edit their own products
- ✅ Image uploads are secured per user folder
- ✅ JWT tokens for authentication

## 📈 Profit Calculation

The app automatically calculates:

- **Potential profit**: (Selling price - Purchase price) × Available items
- **Net profit**: Total earned - Investment in sold items
- **ROI**: (Net profit / Total invested) × 100%
- **Sell-through rate**: (Sold / Total) × 100%

## 🎯 Next Steps

To use the app:

1. ✅ Supabase project is set up
2. ✅ Database schema is loaded
3. ✅ Create Storage bucket `product-images`
4. 🔄 Register an account at http://localhost:5173/register
5. 🔄 Add your first product
6. 🔄 Test the sales functionality
7. 🔄 View the statistics

## 💡 Tips

- **Photos**: Use good product photos for better presentation
- **Selling price**: Always fill in a selling price for accurate statistics
- **Sizes**: Add all available sizes at once
- **Notes**: Use notes for important details (condition, color variants, etc.)

## 🐛 Troubleshooting

**App not loading?**
- Check if Supabase credentials are correct in `.env.local`
- Check if the dev server is running (`npm run dev`)

**Cannot add product?**
- Ensure the Storage bucket `product-images` exists and is public
- Check the browser console for error messages

**Photo upload not working?**
- Check if the Storage bucket is public
- Maximum file size is 5MB

---

Good luck with your Vinted business! 🚀💰