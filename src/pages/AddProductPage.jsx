import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { ProductForm } from '../components/products/ProductForm'
import '../styles/FormPage.css'

export function AddProductPage() {
  const navigate = useNavigate()
  const { createProduct } = useProducts()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      await createProduct(formData)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Er ging iets fout bij het toevoegen van het product')
      console.error('Error creating product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h1 className="form-page-title">Nieuw Product Toevoegen</h1>
        <p className="form-page-subtitle">Vul de details in van je nieuwe product</p>
      </div>

      {error && (
        <div className="form-page-error">
          {error}
        </div>
      )}

      <ProductForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
