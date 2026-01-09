import { ProductCard } from './ProductCard'
import '../../styles/ProductGrid.css'

export function ProductGrid({ products, loading, emptyMessage = "Geen producten gevonden" }) {
  if (loading) {
    return (
      <div className="product-grid-loading">
        <div className="loading-spinner"></div>
        <p>Producten laden...</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid-empty">
        <div className="empty-icon">📦</div>
        <h3>{emptyMessage}</h3>
        <p>Voeg je eerste product toe om te beginnen!</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="product-grid-item"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
