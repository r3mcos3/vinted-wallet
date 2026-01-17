import { useState, useEffect } from 'react'
import { supabase, PRODUCTS_BUCKET } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useMockProducts } from '../mocks/MockDataProvider'

const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

// Real Supabase implementation
function useRealProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch products with product_sizes
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // Fetch all sales for this user's products
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          product_sizes!inner (
            product_id
          )
        `)

      if (salesError) throw salesError

      // Calculate average sale price per product
      const avgSalePriceByProduct = {}

      if (salesData && salesData.length > 0) {
        // Group sales by product_id
        const salesByProduct = {}

        salesData.forEach(sale => {
          const productId = sale.product_sizes.product_id
          if (!salesByProduct[productId]) {
            salesByProduct[productId] = []
          }
          salesByProduct[productId].push(sale)
        })

        // Calculate average for each product
        Object.keys(salesByProduct).forEach(productId => {
          const sales = salesByProduct[productId]
          const totalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.sale_price) * sale.quantity), 0)
          const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0)
          avgSalePriceByProduct[productId] = totalQuantity > 0 ? totalRevenue / totalQuantity : null
        })
      }

      // Add average sale price to each product
      const productsWithAvgPrice = (productsData || []).map(product => ({
        ...product,
        avg_sale_price: avgSalePriceByProduct[product.id] || null
      }))

      setProducts(productsWithAvgPrice)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [user])

  const createProduct = async (productData) => {
    if (!user) throw new Error('Not authenticated')

    try {
      // Get fresh user session to ensure we have the correct user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('No authenticated user found')

      let imageUrl = null

      // Upload image if provided
      if (productData.image && productData.image instanceof File) {
        const fileExt = productData.image.name.split('.').pop()
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from(PRODUCTS_BUCKET)
          .upload(fileName, productData.image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(PRODUCTS_BUCKET)
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          purchase_price: parseFloat(productData.purchase_price),
          purchase_date: productData.purchase_date,
          notes: productData.notes || null,
          image_url: imageUrl,
          user_id: currentUser.id
        })
        .select()
        .single()

      if (productError) throw productError

      // Create product sizes
      if (productData.sizes && productData.sizes.length > 0) {
        const sizesData = productData.sizes.map(size => ({
          product_id: product.id,
          size: size.size,
          total_quantity: size.quantity
        }))

        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesData)

        if (sizesError) throw sizesError
      }

      await fetchProducts()
      return product
    } catch (err) {
      console.error('Error creating product:', err)
      throw err
    }
  }

  const updateProduct = async (productId, productData) => {
    if (!user) throw new Error('Not authenticated')

    try {
      let imageUrl = productData.image_url

      // Upload new image if provided
      if (productData.image && productData.image instanceof File) {
        const fileExt = productData.image.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from(PRODUCTS_BUCKET)
          .upload(fileName, productData.image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(PRODUCTS_BUCKET)
          .getPublicUrl(fileName)

        imageUrl = publicUrl

        // TODO: Delete old image if exists
      }

      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: productData.name,
          purchase_price: parseFloat(productData.purchase_price),
          purchase_date: productData.purchase_date,
          notes: productData.notes || null,
          image_url: imageUrl
        })
        .eq('id', productId)

      if (productError) throw productError

      // Get existing sizes to preserve sold_quantity
      const { data: existingSizes, error: fetchError } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', productId)

      if (fetchError) throw fetchError

      // Create a map of existing sizes by size name for quick lookup
      const existingSizesMap = new Map(
        existingSizes.map(s => [s.size, s])
      )

      // Track which sizes are in the new data
      const newSizeNames = new Set(productData.sizes.map(s => s.size))

      // Update or insert sizes from the form
      if (productData.sizes && productData.sizes.length > 0) {
        for (const size of productData.sizes) {
          const existing = existingSizesMap.get(size.size)

          if (existing) {
            // Size exists - handle based on whether we're adding or setting quantity
            let newTotalQty

            if (size.hasOwnProperty('additionalQuantity')) {
              // Adding new stock to existing
              const additionalQty = parseInt(size.additionalQuantity) || 0
              newTotalQty = existing.total_quantity + additionalQty
            } else {
              // Setting total (old behavior for compatibility)
              newTotalQty = parseInt(size.quantity)
            }

            // Only update if quantity changed
            if (newTotalQty !== existing.total_quantity) {
              // Validate: new total_quantity must be >= sold_quantity
              if (newTotalQty < existing.sold_quantity) {
                throw new Error(
                  `Kan totaal aantal voor maat "${size.size}" niet verlagen tot ${newTotalQty} omdat er al ${existing.sold_quantity} verkocht zijn`
                )
              }

              const { error: updateError } = await supabase
                .from('product_sizes')
                .update({ total_quantity: newTotalQty })
                .eq('id', existing.id)

              if (updateError) throw updateError
            }
          } else {
            // New size, insert it
            const quantity = size.hasOwnProperty('additionalQuantity')
              ? parseInt(size.additionalQuantity)
              : parseInt(size.quantity)

            if (quantity > 0) {
              const { error: insertError } = await supabase
                .from('product_sizes')
                .insert({
                  product_id: productId,
                  size: size.size,
                  total_quantity: quantity
                })

              if (insertError) throw insertError
            }
          }
        }
      }

      // Delete sizes that are no longer in the form
      // (only in create/full edit mode, not when just adding stock)
      const isAddingStock = productData.sizes.some(s => s.hasOwnProperty('additionalQuantity'))

      if (!isAddingStock) {
        for (const existing of existingSizes) {
          if (!newSizeNames.has(existing.size)) {
            // Only delete if nothing has been sold
            if (existing.sold_quantity > 0) {
              throw new Error(
                `Kan maat "${existing.size}" niet verwijderen omdat er al ${existing.sold_quantity} verkocht zijn. Pas eerst het aantal aan.`
              )
            }

            const { error: deleteError } = await supabase
              .from('product_sizes')
              .delete()
              .eq('id', existing.id)

            if (deleteError) throw deleteError
          }
        }
      }

      await fetchProducts()
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const deleteProduct = async (productId) => {
    if (!user) throw new Error('Not authenticated')

    try {
      // Soft delete: set deleted_at timestamp instead of actually deleting
      // This preserves sales history and earnings calculations
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', productId)

      if (error) throw error

      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      throw err
    }
  }

  const sellProductSize = async (sizeId, salePrice, quantity = 1, notes = null) => {
    try {
      const { data, error} = await supabase.rpc('record_sale', {
        p_product_size_id: sizeId,
        p_sale_price: parseFloat(salePrice),
        p_quantity: quantity,
        p_notes: notes
      })

      if (error) throw error

      await fetchProducts()
      return data
    } catch (err) {
      console.error('Error recording sale:', err)
      throw err
    }
  }

  // Fetch a single product by ID (for detail page)
  const fetchProductById = async (productId) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_sizes (
          *,
          sales (
            id,
            sale_price,
            quantity,
            sold_at,
            notes
          )
        )
      `)
      .eq('id', productId)
      .single()

    if (error) throw error
    return data
  }

  return {
    products,
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

// Export the appropriate hook based on mode
export const useProducts = isMockMode ? useMockProducts : useRealProducts
