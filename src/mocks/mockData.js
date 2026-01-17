// Mock data for development/testing
// Provides realistic sample data to demonstrate all app features

export const MOCK_USER = {
  id: 'mock-user-123',
  email: 'demo@vinted-wallet.test',
  created_at: '2024-01-01T00:00:00.000Z'
}

// Helper to generate dates relative to today
const daysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

const hoursAgo = (hours) => {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}

// Sample product images (using placeholder URLs)
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', // Nike shoes
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', // Watch
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop', // T-shirt
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', // Jacket
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop', // Sweater
  'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&h=400&fit=crop', // Clothes rack
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop', // Dress
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', // Sneakers
]

// Generate UUIDs for mock data
let idCounter = 1
const generateId = () => `mock-${idCounter++}`

// Mock Products with varied scenarios
export const MOCK_PRODUCTS = [
  // 1. Fully sold product - profitable
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Nike Air Max 90',
    purchase_price: 45.00,
    purchase_date: daysAgo(30),
    notes: 'Gekocht via Marktplaats, goede staat',
    image_url: PLACEHOLDER_IMAGES[0],
    created_at: daysAgo(30),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: '42', total_quantity: 1, sold_quantity: 1 },
    ],
    avg_sale_price: 85.00
  },

  // 2. Partially sold product with multiple sizes
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Zara Oversized Blazer',
    purchase_price: 25.00,
    purchase_date: daysAgo(21),
    notes: 'Bulk aankoop, 3 stuks voor €75',
    image_url: PLACEHOLDER_IMAGES[3],
    created_at: daysAgo(21),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'S', total_quantity: 1, sold_quantity: 1 },
      { id: generateId(), size: 'M', total_quantity: 1, sold_quantity: 0 },
      { id: generateId(), size: 'L', total_quantity: 1, sold_quantity: 0 },
    ],
    avg_sale_price: 55.00
  },

  // 3. Available product - no sales yet
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'H&M Premium Hoodie',
    purchase_price: 15.00,
    purchase_date: daysAgo(14),
    notes: null,
    image_url: PLACEHOLDER_IMAGES[4],
    created_at: daysAgo(14),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'M', total_quantity: 2, sold_quantity: 0 },
      { id: generateId(), size: 'L', total_quantity: 1, sold_quantity: 0 },
    ],
    avg_sale_price: null
  },

  // 4. One Size product - fully sold
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Vintage Levi\'s Riem',
    purchase_price: 8.00,
    purchase_date: daysAgo(45),
    notes: 'Kringloop vondst',
    image_url: PLACEHOLDER_IMAGES[5],
    created_at: daysAgo(45),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'One Size', total_quantity: 1, sold_quantity: 1 },
    ],
    avg_sale_price: 22.00
  },

  // 5. High value item - partially sold
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'The North Face Puffer Jacket',
    purchase_price: 65.00,
    purchase_date: daysAgo(60),
    notes: 'Seizoensaankoop, verwacht hogere prijs in winter',
    image_url: PLACEHOLDER_IMAGES[3],
    created_at: daysAgo(60),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'M', total_quantity: 1, sold_quantity: 1 },
      { id: generateId(), size: 'L', total_quantity: 1, sold_quantity: 0 },
    ],
    avg_sale_price: 125.00
  },

  // 6. Recently added - return deadline still active
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Adidas Superstar',
    purchase_price: 35.00,
    purchase_date: daysAgo(3),
    notes: 'Nieuw met tags',
    image_url: PLACEHOLDER_IMAGES[7],
    created_at: daysAgo(3),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: '40', total_quantity: 1, sold_quantity: 0 },
      { id: generateId(), size: '41', total_quantity: 1, sold_quantity: 0 },
    ],
    avg_sale_price: null
  },

  // 7. Multi-quantity same size
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Basic T-Shirts Pack',
    purchase_price: 5.00,
    purchase_date: daysAgo(7),
    notes: 'Partij van 10 voor €50',
    image_url: PLACEHOLDER_IMAGES[2],
    created_at: daysAgo(7),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'M', total_quantity: 5, sold_quantity: 3 },
      { id: generateId(), size: 'L', total_quantity: 5, sold_quantity: 2 },
    ],
    avg_sale_price: 12.50
  },

  // 8. Loss item - sold below purchase price
  {
    id: generateId(),
    user_id: MOCK_USER.id,
    name: 'Vintage Zonnebril',
    purchase_price: 20.00,
    purchase_date: daysAgo(90),
    notes: 'Verkeerde inschatting, moeilijk te verkopen',
    image_url: PLACEHOLDER_IMAGES[1],
    created_at: daysAgo(90),
    deleted_at: null,
    product_sizes: [
      { id: generateId(), size: 'One Size', total_quantity: 1, sold_quantity: 1 },
    ],
    avg_sale_price: 12.00
  },
]

// Mock Sales Records (for period earnings)
export const MOCK_SALES = [
  // This week sales
  { id: generateId(), product_size_id: MOCK_PRODUCTS[6].product_sizes[0].id, sale_price: 12.00, quantity: 2, sold_at: hoursAgo(24), notes: null },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[6].product_sizes[1].id, sale_price: 13.00, quantity: 1, sold_at: hoursAgo(48), notes: 'Snelle verkoop' },

  // This month sales
  { id: generateId(), product_size_id: MOCK_PRODUCTS[0].product_sizes[0].id, sale_price: 85.00, quantity: 1, sold_at: hoursAgo(24 * 15), notes: null },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[1].product_sizes[0].id, sale_price: 55.00, quantity: 1, sold_at: hoursAgo(24 * 10), notes: null },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[6].product_sizes[0].id, sale_price: 12.50, quantity: 1, sold_at: hoursAgo(24 * 5), notes: null },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[6].product_sizes[1].id, sale_price: 12.50, quantity: 1, sold_at: hoursAgo(24 * 8), notes: null },

  // Older sales (this year)
  { id: generateId(), product_size_id: MOCK_PRODUCTS[3].product_sizes[0].id, sale_price: 22.00, quantity: 1, sold_at: hoursAgo(24 * 40), notes: null },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[4].product_sizes[0].id, sale_price: 125.00, quantity: 1, sold_at: hoursAgo(24 * 35), notes: 'Goede deal' },
  { id: generateId(), product_size_id: MOCK_PRODUCTS[7].product_sizes[0].id, sale_price: 12.00, quantity: 1, sold_at: hoursAgo(24 * 85), notes: 'Verlies genomen' },
]

// Mock User Settings
export const MOCK_USER_SETTINGS = {
  id: generateId(),
  user_id: MOCK_USER.id,
  starting_budget: 500.00,
  created_at: daysAgo(100)
}

// Calculate mock stats based on mock data
export function calculateMockStats() {
  let totalInvested = 0
  let totalEarned = 0
  let inventoryValue = 0
  let totalProducts = 0
  let totalItemsSold = 0
  let totalItemsAvailable = 0

  MOCK_PRODUCTS.forEach(product => {
    if (!product.deleted_at) {
      totalProducts++

      product.product_sizes.forEach(size => {
        const totalQty = size.total_quantity
        const soldQty = size.sold_quantity
        const availableQty = totalQty - soldQty

        totalInvested += product.purchase_price * totalQty
        totalItemsSold += soldQty
        totalItemsAvailable += availableQty
        inventoryValue += product.purchase_price * availableQty
      })
    }
  })

  // Calculate total earned from sales
  MOCK_SALES.forEach(sale => {
    totalEarned += sale.sale_price * sale.quantity
  })

  const netProfit = totalEarned - (totalInvested - inventoryValue)
  const walletBalance = MOCK_USER_SETTINGS.starting_budget - totalInvested + totalEarned

  return {
    total_invested: totalInvested,
    total_earned: totalEarned,
    inventory_value: inventoryValue,
    total_products: totalProducts,
    total_items_sold: totalItemsSold,
    total_items_available: totalItemsAvailable,
    starting_budget: MOCK_USER_SETTINGS.starting_budget,
    wallet_balance: walletBalance,
    net_profit: netProfit
  }
}

// Calculate mock period earnings
export function calculateMockPeriodEarnings(weekOffset = 0, monthOffset = 0, yearOffset = 0) {
  const now = new Date()

  // Calculate date ranges for each period
  const getWeekRange = (offset) => {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay() + 1 + (offset * 7)) // Monday
    const end = new Date(start)
    end.setDate(end.getDate() + 6) // Sunday
    return { start, end }
  }

  const getMonthRange = (offset) => {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    return { start, end }
  }

  const getYearRange = (offset) => {
    const year = now.getFullYear() + offset
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31)
    }
  }

  const calculatePeriodStats = (startDate, endDate) => {
    let earned = 0
    let profit = 0
    let sales = 0

    MOCK_SALES.forEach(sale => {
      const saleDate = new Date(sale.sold_at)
      if (saleDate >= startDate && saleDate <= endDate) {
        earned += sale.sale_price * sale.quantity
        sales += sale.quantity

        // Find purchase price for profit calculation
        const product = MOCK_PRODUCTS.find(p =>
          p.product_sizes.some(s => s.id === sale.product_size_id)
        )
        if (product) {
          profit += (sale.sale_price - product.purchase_price) * sale.quantity
        }
      }
    })

    return { earned, profit, sales }
  }

  const weekRange = getWeekRange(weekOffset)
  const monthRange = getMonthRange(monthOffset)
  const yearRange = getYearRange(yearOffset)

  const weekStats = calculatePeriodStats(weekRange.start, weekRange.end)
  const monthStats = calculatePeriodStats(monthRange.start, monthRange.end)
  const yearStats = calculatePeriodStats(yearRange.start, yearRange.end)

  return {
    week: {
      ...weekStats,
      start_date: weekRange.start.toISOString().split('T')[0],
      end_date: weekRange.end.toISOString().split('T')[0]
    },
    month: {
      ...monthStats,
      start_date: monthRange.start.toISOString().split('T')[0],
      end_date: monthRange.end.toISOString().split('T')[0]
    },
    year: {
      ...yearStats,
      start_date: yearRange.start.toISOString().split('T')[0],
      end_date: yearRange.end.toISOString().split('T')[0]
    }
  }
}
