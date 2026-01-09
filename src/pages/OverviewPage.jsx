import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProducts } from '../hooks/useProducts'
import { ProductGrid } from '../components/products/ProductGrid'
import '../styles/OverviewPage.css'

export function OverviewPage() {
  const { user, signOut } = useAuth()
  const { products, loading } = useProducts()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Vinted Wallet</h1>
            <p className="header-subtitle">
              Welkom terug, {user?.email?.split('@')[0]}!
            </p>
          </div>

          <div className="header-actions">
            <Link to="/stats" className="header-button stats">
              📊 Statistieken
            </Link>
            <Link to="/products/new" className="header-button primary">
              + Nieuw Product
            </Link>
            <button onClick={handleLogout} className="header-button secondary">
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="overview-main">
        <ProductGrid products={products} loading={loading} />
      </main>

      {/* Floating action button for mobile */}
      <Link to="/products/new" className="fab">
        +
      </Link>
    </div>
  )
}
