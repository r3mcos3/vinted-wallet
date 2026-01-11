import { Link } from 'react-router-dom'
import { getReturnStatus } from '../../utils/returnStatus'
import '../../styles/ProductCard.css'

export function ProductCard({ product }) {
  // Calculate totals
  const totalQuantity = product.product_sizes?.reduce((sum, size) => sum + size.total_quantity, 0) || 0
  const soldQuantity = product.product_sizes?.reduce((sum, size) => sum + size.sold_quantity, 0) || 0
  const availableQuantity = totalQuantity - soldQuantity

  // Status
  const isSoldOut = availableQuantity === 0
  const isPartialSold = soldQuantity > 0 && availableQuantity > 0

  // Available sizes
  const availableSizes = product.product_sizes
    ?.filter(s => s.total_quantity > s.sold_quantity)
    .map(s => s.size)
    .join(', ') || 'Geen'

  // Return status
  const returnStatus = getReturnStatus(product.purchase_date)

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-card-placeholder">
            <span>📦</span>
          </div>
        )}

        {/* Status badges */}
        <div className="product-card-badges">
          <div className={`product-card-badge ${isSoldOut ? 'sold-out' : isPartialSold ? 'partial' : 'available'}`}>
            {isSoldOut ? 'Uitverkocht' : `${availableQuantity} beschikbaar`}
          </div>
          {returnStatus.status === 'warning' && (
            <div className="product-card-badge return-warning">
              ⚠️ Product Retour
            </div>
          )}
          {returnStatus.status === 'expired' && (
            <div className="product-card-badge return-expired">
              ❌ Retour verlopen
            </div>
          )}
        </div>
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>

        {/* Sizes */}
        {availableSizes !== 'Geen' && (
          <div className="product-card-sizes">
            <span className="size-label">Maten:</span> {availableSizes}
          </div>
        )}

        {/* Prices */}
        <div className="product-card-prices">
          <div className="price-item">
            <span className="price-label">Inkoop</span>
            <span className="price-value">€{product.purchase_price.toFixed(2)}</span>
          </div>
          {product.avg_sale_price !== null && (
            <div className="price-item">
              <span className="price-label">Gem. Verkoop</span>
              <span className="price-value sale-price">€{product.avg_sale_price.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
