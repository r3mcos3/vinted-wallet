// Mock Data Provider for development/testing
// Replaces Supabase-dependent hooks with in-memory mock data

import { createContext, useContext, useState, useCallback } from 'react'
import {
  MOCK_USER,
  MOCK_PRODUCTS,
  MOCK_SALES,
  MOCK_USER_SETTINGS,
  calculateMockStats,
  calculateMockPeriodEarnings
} from './mockData'

// Context for mock mode flag
const MockModeContext = createContext(false)

export function useMockMode() {
  return useContext(MockModeContext)
}

export function MockModeProvider({ children, enabled = false }) {
  return (
    <MockModeContext.Provider value={enabled}>
      {children}
    </MockModeContext.Provider>
  )
}

// Mock Auth Hook
export function useMockAuth() {
  const [user] = useState(MOCK_USER)
  const [loading] = useState(false)

  const signUp = async () => {
    console.log('[MOCK] Sign up called - auto logged in as demo user')
    return { user: MOCK_USER }
  }

  const signIn = async () => {
    console.log('[MOCK] Sign in called - auto logged in as demo user')
    return { user: MOCK_USER }
  }

  const signOut = async () => {
    console.log('[MOCK] Sign out called - stays logged in for demo')
  }

  return { user, loading, signUp, signIn, signOut }
}

// Mock Products Hook
export function useMockProducts() {
  const [products, setProducts] = useState([...MOCK_PRODUCTS])
  const [sales, setSales] = useState([...MOCK_SALES])
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))
    setLoading(false)
  }, [])

  const createProduct = useCallback(async (productData) => {
    const newProduct = {
      id: `mock-${Date.now()}`,
      user_id: MOCK_USER.id,
      name: productData.name,
      purchase_price: parseFloat(productData.purchase_price),
      purchase_date: productData.purchase_date,
      notes: productData.notes || null,
      image_url: productData.image ? URL.createObjectURL(productData.image) : null,
      created_at: new Date().toISOString(),
      deleted_at: null,
      product_sizes: (productData.sizes || [{ size: 'One Size', quantity: productData.quantity || 1 }]).map((s, i) => ({
        id: `mock-size-${Date.now()}-${i}`,
        size: s.size,
        total_quantity: s.quantity,
        sold_quantity: 0
      })),
      avg_sale_price: null
    }

    setProducts(prev => [newProduct, ...prev])
    console.log('[MOCK] Created product:', newProduct)
    return newProduct
  }, [])

  const updateProduct = useCallback(async (productId, productData) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p

      const updatedSizes = (productData.sizes || []).map((s, i) => {
        const existing = p.product_sizes.find(ps => ps.size === s.size)
        if (existing) {
          const additionalQty = s.additionalQuantity || 0
          return {
            ...existing,
            total_quantity: existing.total_quantity + additionalQty
          }
        }
        return {
          id: `mock-size-${Date.now()}-${i}`,
          size: s.size,
          total_quantity: s.quantity || s.additionalQuantity || 1,
          sold_quantity: 0
        }
      })

      return {
        ...p,
        name: productData.name,
        purchase_price: parseFloat(productData.purchase_price),
        purchase_date: productData.purchase_date,
        notes: productData.notes || null,
        image_url: productData.image instanceof File
          ? URL.createObjectURL(productData.image)
          : productData.image_url,
        product_sizes: updatedSizes
      }
    }))

    console.log('[MOCK] Updated product:', productId)
  }, [])

  const deleteProduct = useCallback(async (productId) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, deleted_at: new Date().toISOString() }
        : p
    ))
    console.log('[MOCK] Soft deleted product:', productId)
  }, [])

  const sellProductSize = useCallback(async (sizeId, salePrice, quantity = 1, notes = null) => {
    // Update sold_quantity on the size
    setProducts(prev => prev.map(p => ({
      ...p,
      product_sizes: p.product_sizes.map(s => {
        if (s.id !== sizeId) return s
        const newSoldQty = s.sold_quantity + quantity
        if (newSoldQty > s.total_quantity) {
          throw new Error('Niet genoeg voorraad beschikbaar')
        }
        return { ...s, sold_quantity: newSoldQty }
      })
    })))

    // Create sale record
    const newSale = {
      id: `mock-sale-${Date.now()}`,
      product_size_id: sizeId,
      sale_price: parseFloat(salePrice),
      quantity,
      sold_at: new Date().toISOString(),
      notes
    }
    setSales(prev => [newSale, ...prev])

    // Update avg_sale_price for the product
    setProducts(prev => prev.map(p => {
      const productSize = p.product_sizes.find(s => s.id === sizeId)
      if (!productSize) return p

      const productSales = [...sales, newSale].filter(sale =>
        p.product_sizes.some(s => s.id === sale.product_size_id)
      )

      if (productSales.length === 0) return p

      const totalRevenue = productSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0)
      const totalQty = productSales.reduce((sum, sale) => sum + sale.quantity, 0)

      return {
        ...p,
        avg_sale_price: totalQty > 0 ? totalRevenue / totalQty : null
      }
    }))

    console.log('[MOCK] Recorded sale:', newSale)
    return newSale
  }, [sales])

  // Fetch a single product by ID (for detail page)
  const fetchProductById = useCallback(async (productId) => {
    await new Promise(resolve => setTimeout(resolve, 200))

    const product = products.find(p => p.id === productId)
    if (!product) return null

    // Add sales data to each size (mimics Supabase nested query)
    const productWithSales = {
      ...product,
      product_sizes: product.product_sizes.map(size => ({
        ...size,
        sales: sales
          .filter(sale => sale.product_size_id === size.id)
          .map(sale => ({
            id: sale.id,
            sale_price: sale.sale_price,
            quantity: sale.quantity,
            sold_at: sale.sold_at,
            notes: sale.notes
          }))
      }))
    }

    return productWithSales
  }, [products, sales])

  // Filter out soft-deleted products
  const activeProducts = products.filter(p => !p.deleted_at)

  return {
    products: activeProducts,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProductSize
  }
}

// Mock Stats Hook
export function useMockStats() {
  const [stats, setStats] = useState(() => calculateMockStats())
  const [periodEarnings, setPeriodEarnings] = useState(() => calculateMockPeriodEarnings())
  const [periodOffsets, setPeriodOffsets] = useState({ week: 0, month: 0, year: 0 })
  const [loading, setLoading] = useState(false)
  const [periodLoading, setPeriodLoading] = useState(false)
  const [error] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 200))
    setStats(calculateMockStats())
    setPeriodEarnings(calculateMockPeriodEarnings(
      periodOffsets.week,
      periodOffsets.month,
      periodOffsets.year
    ))
    setLoading(false)
  }, [periodOffsets])

  const navigatePeriod = useCallback((periodType, direction) => {
    const newOffsets = {
      ...periodOffsets,
      [periodType]: Math.min(0, periodOffsets[periodType] + direction)
    }
    setPeriodOffsets(newOffsets)
    setPeriodLoading(true)
    setTimeout(() => {
      setPeriodEarnings(calculateMockPeriodEarnings(
        newOffsets.week,
        newOffsets.month,
        newOffsets.year
      ))
      setPeriodLoading(false)
    }, 150)
  }, [periodOffsets])

  const resetPeriod = useCallback((periodType) => {
    const newOffsets = { ...periodOffsets, [periodType]: 0 }
    setPeriodOffsets(newOffsets)
    setPeriodEarnings(calculateMockPeriodEarnings(
      newOffsets.week,
      newOffsets.month,
      newOffsets.year
    ))
  }, [periodOffsets])

  const updateStartingBudget = useCallback(async (amount) => {
    MOCK_USER_SETTINGS.starting_budget = parseFloat(amount)
    setStats(calculateMockStats())
    console.log('[MOCK] Updated starting budget:', amount)
  }, [])

  return {
    stats,
    periodEarnings,
    periodOffsets,
    loading,
    periodLoading,
    error,
    refetch,
    updateStartingBudget,
    navigatePeriod,
    resetPeriod
  }
}
