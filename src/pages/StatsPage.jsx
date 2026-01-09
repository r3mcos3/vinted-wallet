import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useStats'
import '../styles/StatsPage.css'

export function StatsPage() {
  const { stats, loading } = useStats()

  if (loading) {
    return (
      <div className="stats-page-loading">
        <div className="loading-spinner"></div>
        <p>Statistieken laden...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="stats-page-error">
        <p>Kon statistieken niet laden</p>
        <Link to="/" className="back-link">← Terug naar overzicht</Link>
      </div>
    )
  }

  const profitPercentage = stats.total_invested > 0
    ? ((stats.net_profit / stats.total_invested) * 100).toFixed(1)
    : 0

  const sellThroughRate = stats.total_items_sold + stats.total_items_available > 0
    ? ((stats.total_items_sold / (stats.total_items_sold + stats.total_items_available)) * 100).toFixed(1)
    : 0

  return (
    <div className="stats-page">
      <div className="stats-header">
        <Link to="/" className="back-button">
          ← Terug
        </Link>
        <h1 className="stats-title">Statistieken Dashboard</h1>
      </div>

      <div className="stats-grid">
        {/* Total Invested */}
        <div className="stat-card invested">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Totaal Geïnvesteerd</div>
            <div className="stat-value">€{stats.total_invested.toFixed(2)}</div>
            <div className="stat-detail">
              In {stats.total_products} {stats.total_products === 1 ? 'product' : 'producten'}
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="stat-card earned">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">Totaal Verdiend</div>
            <div className="stat-value">€{stats.total_earned.toFixed(2)}</div>
            <div className="stat-detail">
              Van verkochte items
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`stat-card profit ${stats.net_profit >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">{stats.net_profit >= 0 ? '📈' : '📉'}</div>
          <div className="stat-content">
            <div className="stat-label">Netto Winst</div>
            <div className="stat-value">
              {stats.net_profit >= 0 ? '+' : ''}€{stats.net_profit.toFixed(2)}
            </div>
            <div className="stat-detail">
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage}% ROI
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="stat-card inventory">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-label">Voorraad Waarde</div>
            <div className="stat-value">€{stats.inventory_value.toFixed(2)}</div>
            <div className="stat-detail">
              {stats.total_items_available} {stats.total_items_available === 1 ? 'item' : 'items'} beschikbaar
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="stat-card sold">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Items Verkocht</div>
            <div className="stat-value">{stats.total_items_sold}</div>
            <div className="stat-detail">
              {sellThroughRate}% sell-through rate
            </div>
          </div>
        </div>

        {/* Items Available */}
        <div className="stat-card available">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-label">Items Beschikbaar</div>
            <div className="stat-value">{stats.total_items_available}</div>
            <div className="stat-detail">
              Nog te verkopen
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card">
          <h3>💡 Inzichten</h3>
          <ul>
            {stats.net_profit > 0 ? (
              <li className="positive">Je hebt tot nu toe €{stats.net_profit.toFixed(2)} winst gemaakt!</li>
            ) : stats.net_profit < 0 ? (
              <li className="negative">Je investering is nog niet terugverdiend. Blijf verkopen!</li>
            ) : (
              <li>Begin met verkopen om winst te maken!</li>
            )}

            {stats.total_items_available > 0 && (
              <li>
                Als je alle beschikbare items verkoopt tegen de ingestelde prijzen,
                kun je nog €{(stats.total_items_available * ((stats.total_earned / (stats.total_items_sold || 1)) - (stats.total_invested / (stats.total_items_sold + stats.total_items_available)))).toFixed(2)} verdienen.
              </li>
            )}

            {sellThroughRate > 50 ? (
              <li className="positive">Goede verkoop! {sellThroughRate}% van je voorraad is al verkocht.</li>
            ) : sellThroughRate > 0 ? (
              <li>Je hebt {sellThroughRate}% van je voorraad verkocht. Blijf promoten!</li>
            ) : (
              <li>Begin met verkopen om je eerste item te verkopen!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
