import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProducts } from '../hooks/useProducts'
import { useStats } from '../hooks/useStats'
import { ProductGrid } from '../components/products/ProductGrid'
import { ThemeToggle } from '../components/common/ThemeToggle'
import '../styles/OverviewPage.css'

export function OverviewPage() {
  const { user, signOut } = useAuth()
  const { products, loading } = useProducts()
  const { stats, refetch: refetchStats } = useStats()

  // Refetch stats when page becomes visible (e.g., after editing a product)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchStats()
      }
    }

    // Refetch on mount as well
    refetchStats()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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

          <div className="header-center">
            <div className="wallet-display">
              <div className="wallet-icon">💰</div>
              <div className="wallet-info">
                <div className="wallet-label">Wallet Saldo</div>
                <div className={`wallet-amount ${stats?.wallet_balance >= 0 ? 'positive' : 'negative'}`}>
                  €{stats?.wallet_balance?.toFixed(2) ?? '0.00'}
                </div>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <Link to="/stats" className="header-button stats">
              📊 Statistieken
            </Link>
            <Link to="/products/new" className="header-button primary">
              + Nieuw Product
            </Link>
            <ThemeToggle />
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
