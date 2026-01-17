import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { ProductForm } from '../components/products/ProductForm'
import '../styles/FormPage.css'

export function EditProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProductById, updateProduct } = useProducts()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const data = await fetchProductById(id)
      if (!data) throw new Error('Product niet gevonden')
      setProduct(data)
    } catch (err) {
      console.error('Error fetching product:', err)
      alert('Product niet gevonden')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    setSubmitLoading(true)
    setError(null)

    try {
      await updateProduct(id, {
        ...formData,
        image_url: product.image_url // Keep existing image URL if no new image
      })
      navigate(`/products/${id}`)
    } catch (err) {
      setError(err.message || 'Er ging iets fout bij het updaten van het product')
      console.error('Error updating product:', err)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="form-page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h1 className="form-page-title">Product Bewerken</h1>
        <p className="form-page-subtitle">Pas de details aan van {product?.name}</p>
      </div>

      {error && (
        <div className="form-page-error">
          {error}
        </div>
      )}

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        loading={submitLoading}
      />
    </div>
  )
}
