import { useState, useEffect } from 'react'
import { supabase, PRODUCTS_BUCKET } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
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

      // Update sizes: delete old and insert new
      const { error: deleteError } = await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', productId)

      if (deleteError) throw deleteError

      if (productData.sizes && productData.sizes.length > 0) {
        const sizesData = productData.sizes.map(size => ({
          product_id: productId,
          size: size.size,
          total_quantity: size.quantity
        }))

        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesData)

        if (sizesError) throw sizesError
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
      const { error } = await supabase
        .from('products')
        .delete()
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

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProductSize
  }
}
