import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProducts } from '../hooks/useProducts'
import '../styles/ProductDetailPage.css'

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sellProductSize, deleteProduct } = useProducts()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sellModal, setSellModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (err) {
      console.error('Error fetching product:', err)
      alert('Product niet gevonden')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async (sizeId) => {
    setActionLoading(true)
    try {
      await sellProductSize(sizeId, 1)
      await fetchProduct()
      setSellModal(null)
    } catch (err) {
      alert(err.message || 'Kon item niet verkopen')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      return
    }

    setActionLoading(true)
    try {
      await deleteProduct(id)
      navigate('/')
    } catch (err) {
      alert(err.message || 'Kon product niet verwijderen')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="detail-page-loading">
        <div className="loading-spinner"></div>
        <p>Product laden...</p>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const totalQuantity = product.product_sizes?.reduce((sum, s) => sum + s.total_quantity, 0) || 0
  const soldQuantity = product.product_sizes?.reduce((sum, s) => sum + s.sold_quantity, 0) || 0
  const potentialProfit = product.sale_price
    ? (product.sale_price - product.purchase_price) * (totalQuantity - soldQuantity)
    : 0

  return (
    <div className="product-detail-page">
      <div className="detail-header">
        <Link to="/" className="back-button">
          ← Terug
        </Link>
        <div className="detail-actions">
          <Link to={`/products/${id}/edit`} className="detail-button edit">
            ✏️ Bewerken
          </Link>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="detail-button delete"
          >
            🗑️ Verwijderen
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="detail-image-placeholder">📦</div>
          )}
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{product.name}</h1>

          <div className="detail-prices">
            <div className="price-box">
              <span className="price-label">Inkoopprijs</span>
              <span className="price-value">€{product.purchase_price.toFixed(2)}</span>
            </div>
            {product.sale_price && (
              <>
                <div className="price-arrow">→</div>
                <div className="price-box sale">
                  <span className="price-label">Verkoopprijs</span>
                  <span className="price-value">€{product.sale_price.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {product.sale_price && (
            <div className={`detail-profit ${potentialProfit > 0 ? 'positive' : 'negative'}`}>
              <span>Potentiële winst:</span>
              <strong>
                {potentialProfit >= 0 ? '+' : ''}€{potentialProfit.toFixed(2)}
              </strong>
            </div>
          )}

          {product.notes && (
            <div className="detail-notes">
              <h3>Notities</h3>
              <p>{product.notes}</p>
            </div>
          )}

          <div className="detail-sizes">
            <h3>Voorraad per Maat</h3>
            <div className="sizes-table">
              <div className="sizes-table-header">
                <span>Maat</span>
                <span>Totaal</span>
                <span>Verkocht</span>
                <span>Beschikbaar</span>
                <span>Actie</span>
              </div>
              {product.product_sizes?.map(size => {
                const available = size.total_quantity - size.sold_quantity
                return (
                  <div key={size.id} className="sizes-table-row">
                    <span className="size-badge">{size.size}</span>
                    <span>{size.total_quantity}</span>
                    <span>{size.sold_quantity}</span>
                    <span className={available > 0 ? 'available' : 'sold-out'}>
                      {available}
                    </span>
                    <span>
                      {available > 0 ? (
                        <button
                          onClick={() => setSellModal(size)}
                          className="sell-button"
                          disabled={actionLoading}
                        >
                          Verkoop
                        </button>
                      ) : (
                        <span className="sold-out-badge">Uitverkocht</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sell Modal */}
      {sellModal && (
        <div className="modal-overlay" onClick={() => setSellModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Product Verkopen</h2>
            <p>
              Wil je <strong>{product.name}</strong> maat <strong>{sellModal.size}</strong> verkopen?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setSellModal(null)}
                disabled={actionLoading}
                className="modal-button secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleSell(sellModal.id)}
                disabled={actionLoading}
                className="modal-button primary"
              >
                {actionLoading ? 'Bezig...' : 'Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
