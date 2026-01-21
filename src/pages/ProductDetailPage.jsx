import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { getReturnStatus } from '../utils/returnStatus'
import '../styles/ProductDetailPage.css'

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProductById, sellProductSize, deleteProduct } = useProducts()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sellModal, setSellModal] = useState(null)
  const [salePrice, setSalePrice] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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

  const handleSell = async (sizeId) => {
    if (!salePrice || parseFloat(salePrice) <= 0) {
      alert('Vul een geldige verkoopprijs in')
      return
    }

    setActionLoading(true)
    try {
      await sellProductSize(sizeId, salePrice, 1)
      await fetchProduct()
      setSellModal(null)
      setSalePrice('')
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
  const returnStatus = getReturnStatus(product.purchase_date)

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

      {/* Return Status Warning */}
      {returnStatus.status === 'warning' && (
        <div className="return-warning-banner warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <strong>Product Retour Waarschuwing</strong>
            <p>{returnStatus.message}</p>
          </div>
        </div>
      )}

      {returnStatus.status === 'expired' && (
        <div className="return-warning-banner expired">
          <div className="warning-icon">❌</div>
          <div className="warning-content">
            <strong>Retour Deadline Verstreken</strong>
            <p>{returnStatus.message}</p>
          </div>
        </div>
      )}

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
            {product.purchase_date && (
              <div className="price-box">
                <span className="price-label">Inkoopdatum</span>
                <span className="price-value">
                  {new Date(product.purchase_date).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            {product.purchase_date && (
              <div className={`price-box return-box ${returnStatus.status}`}>
                <span className="price-label">Retour mogelijk tot</span>
                <span className="price-value return-date">
                  {(() => {
                    const deadline = new Date(product.purchase_date)
                    deadline.setDate(deadline.getDate() + 30)
                    return deadline.toLocaleDateString('nl-NL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  })()}
                </span>
                {returnStatus.status === 'warning' && (
                  <span className="return-days-left">Nog {returnStatus.daysLeft} {returnStatus.daysLeft === 1 ? 'dag' : 'dagen'}</span>
                )}
                {returnStatus.status === 'expired' && (
                  <span className="return-expired-text">Verlopen</span>
                )}
              </div>
            )}
          </div>

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

          {/* Sales History */}
          {(() => {
            // Collect all sales from all sizes
            const allSales = product.product_sizes?.flatMap(size =>
              (size.sales || []).map(sale => ({
                ...sale,
                size: size.size
              }))
            ) || []

            // Sort by date, newest first
            allSales.sort((a, b) => new Date(b.sold_at) - new Date(a.sold_at))

            if (allSales.length === 0) return null

            return (
              <div className="detail-sales-history">
                <h3>Verkoop Geschiedenis</h3>
                <div className="sales-history-table">
                  <div className="sales-history-header">
                    <span>Datum</span>
                    <span>Maat</span>
                    <span>Aantal</span>
                    <span>Verkoopprijs</span>
                    <span>Winst</span>
                  </div>
                  {allSales.map(sale => {
                    const profit = (sale.sale_price - product.purchase_price) * sale.quantity
                    const saleDate = new Date(sale.sold_at)
                    const formattedDate = saleDate.toLocaleDateString('nl-NL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })

                    return (
                      <div key={sale.id} className="sales-history-row">
                        <span className="sale-date">{formattedDate}</span>
                        <span className="sale-size">{sale.size}</span>
                        <span className="sale-quantity">{sale.quantity}x</span>
                        <span className="sale-price">€{sale.sale_price.toFixed(2)}</span>
                        <span className={`sale-profit ${profit >= 0 ? 'positive' : 'negative'}`}>
                          {profit >= 0 ? '+' : ''}€{profit.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Sell Modal */}
      {sellModal && (
        <div className="modal-overlay" onClick={() => {
          setSellModal(null)
          setSalePrice('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Product Verkopen</h2>
            <p>
              Verkoop <strong>{product.name}</strong> maat <strong>{sellModal.size}</strong>
            </p>

            <div className="form-field" style={{ marginBottom: '20px' }}>
              <label htmlFor="sale_price" className="field-label">
                Verkoopprijs <span className="required">*</span>
              </label>
              <div className="field-input-wrapper">
                <span className="input-prefix">€</span>
                <input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="field-input with-prefix"
                  autoFocus
                  required
                />
              </div>
              <div className="field-hint">
                Inkoopprijs: €{product.purchase_price.toFixed(2)}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setSellModal(null)
                  setSalePrice('')
                }}
                disabled={actionLoading}
                className="modal-button secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleSell(sellModal.id)}
                disabled={actionLoading || !salePrice}
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
