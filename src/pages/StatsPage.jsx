import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useStats } from '../hooks/useStats'
import '../styles/StatsPage.css'

// Helper function to get ISO week number
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Helper function to format period labels
const formatPeriodLabel = (periodType, periodData, offset) => {
  if (!periodData?.start_date) {
    if (offset === 0) {
      if (periodType === 'week') return 'Deze Week'
      if (periodType === 'month') return 'Deze Maand'
      if (periodType === 'year') return 'Dit Jaar'
    }
    return ''
  }

  const startDate = new Date(periodData.start_date)

  if (periodType === 'week') {
    const weekNum = getWeekNumber(startDate)
    if (offset === 0) return `Deze Week (${weekNum})`
    if (offset === -1) return `Vorige Week (${weekNum})`
    return `Week ${weekNum}`
  }

  if (periodType === 'month') {
    if (offset === 0) return 'Deze Maand'
    return startDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  }

  if (periodType === 'year') {
    if (offset === 0) return 'Dit Jaar'
    return startDate.getFullYear().toString()
  }

  return ''
}

export function StatsPage() {
  const {
    stats,
    periodEarnings,
    periodOffsets,
    loading,
    periodLoading,
    updateStartingBudget,
    refetch: refetchStats,
    navigatePeriod,
    resetPeriod
  } = useStats()
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetValue, setBudgetValue] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [budgetSuccess, setBudgetSuccess] = useState(false)

  // Refetch stats when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchStats()
      }
    }

    // Refetch on mount
    refetchStats()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleEditBudget = () => {
    setBudgetValue(stats?.starting_budget?.toFixed(2) || '0.00')
    setIsEditingBudget(true)
    setBudgetError('')
    setBudgetSuccess(false)
  }

  const handleCancelEdit = () => {
    setIsEditingBudget(false)
    setBudgetValue('')
    setBudgetError('')
    setBudgetSuccess(false)
  }

  const handleSaveBudget = async () => {
    try {
      setBudgetError('')
      setBudgetSuccess(false)

      const amount = parseFloat(budgetValue)
      if (isNaN(amount) || amount < 0) {
        setBudgetError('Voer een geldig bedrag in (minimaal €0.00)')
        return
      }

      await updateStartingBudget(amount)
      setIsEditingBudget(false)
      setBudgetSuccess(true)
      setTimeout(() => setBudgetSuccess(false), 3000)
    } catch (err) {
      setBudgetError(err.message || 'Kon budget niet updaten')
    }
  }

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
        {/* Wallet Balance */}
        <div className={`stat-card wallet ${stats.wallet_balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Wallet Saldo</div>
            <div className="stat-value">
              {stats.wallet_balance >= 0 ? '' : '-'}€{Math.abs(stats.wallet_balance).toFixed(2)}
            </div>
            <div className="stat-detail">
              Huidig beschikbaar bedrag
            </div>
          </div>
        </div>

        {/* Starting Budget - Editable */}
        <div className="stat-card budget-settings">
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <div className="stat-label">Startbudget</div>
            {!isEditingBudget ? (
              <>
                <div className="stat-value">€{stats.starting_budget.toFixed(2)}</div>
                <button onClick={handleEditBudget} className="edit-budget-btn">
                  ✏️ Aanpassen
                </button>
                {budgetSuccess && (
                  <div className="budget-success">✓ Budget bijgewerkt!</div>
                )}
              </>
            ) : (
              <div className="budget-editor">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  className="budget-input"
                  placeholder="0.00"
                  autoFocus
                />
                {budgetError && <div className="budget-error">{budgetError}</div>}
                <div className="budget-actions">
                  <button onClick={handleSaveBudget} className="budget-save-btn">
                    Opslaan
                  </button>
                  <button onClick={handleCancelEdit} className="budget-cancel-btn">
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total Invested */}
        <div className="stat-card invested">
          <div className="stat-icon">💸</div>
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

      {/* Period Earnings */}
      {periodEarnings && (
        <div className="period-earnings-section">
          <h2 className="section-title">Verdiensten per Periode</h2>
          <div className={`period-grid ${periodLoading ? 'loading' : ''}`}>
            {/* Week */}
            <div className="period-card week">
              <div className="period-header">
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('week', -1)}
                  disabled={periodLoading}
                >
                  ‹
                </button>
                <div className="period-title">
                  <span className="period-icon">📅</span>
                  <span className="period-label">
                    {formatPeriodLabel('week', periodEarnings.week, periodOffsets.week)}
                  </span>
                </div>
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('week', 1)}
                  disabled={periodLoading || periodOffsets.week >= 0}
                >
                  ›
                </button>
              </div>
              {periodOffsets.week !== 0 && (
                <button className="period-reset-btn" onClick={() => resetPeriod('week')}>
                  Naar deze week
                </button>
              )}
              <div className="period-stats">
                <div className="period-stat">
                  <span className="period-stat-label">Omzet</span>
                  <span className="period-stat-value">€{periodEarnings.week.earned.toFixed(2)}</span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Winst</span>
                  <span className={`period-stat-value ${periodEarnings.week.profit >= 0 ? 'positive' : 'negative'}`}>
                    {periodEarnings.week.profit >= 0 ? '+' : ''}€{periodEarnings.week.profit.toFixed(2)}
                  </span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Verkopen</span>
                  <span className="period-stat-value">{periodEarnings.week.sales}</span>
                </div>
              </div>
            </div>

            {/* Month */}
            <div className="period-card month">
              <div className="period-header">
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('month', -1)}
                  disabled={periodLoading}
                >
                  ‹
                </button>
                <div className="period-title">
                  <span className="period-icon">📆</span>
                  <span className="period-label">
                    {formatPeriodLabel('month', periodEarnings.month, periodOffsets.month)}
                  </span>
                </div>
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('month', 1)}
                  disabled={periodLoading || periodOffsets.month >= 0}
                >
                  ›
                </button>
              </div>
              {periodOffsets.month !== 0 && (
                <button className="period-reset-btn" onClick={() => resetPeriod('month')}>
                  Naar deze maand
                </button>
              )}
              <div className="period-stats">
                <div className="period-stat">
                  <span className="period-stat-label">Omzet</span>
                  <span className="period-stat-value">€{periodEarnings.month.earned.toFixed(2)}</span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Winst</span>
                  <span className={`period-stat-value ${periodEarnings.month.profit >= 0 ? 'positive' : 'negative'}`}>
                    {periodEarnings.month.profit >= 0 ? '+' : ''}€{periodEarnings.month.profit.toFixed(2)}
                  </span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Verkopen</span>
                  <span className="period-stat-value">{periodEarnings.month.sales}</span>
                </div>
              </div>
            </div>

            {/* Year */}
            <div className="period-card year">
              <div className="period-header">
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('year', -1)}
                  disabled={periodLoading}
                >
                  ‹
                </button>
                <div className="period-title">
                  <span className="period-icon">📊</span>
                  <span className="period-label">
                    {formatPeriodLabel('year', periodEarnings.year, periodOffsets.year)}
                  </span>
                </div>
                <button
                  className="period-nav-btn"
                  onClick={() => navigatePeriod('year', 1)}
                  disabled={periodLoading || periodOffsets.year >= 0}
                >
                  ›
                </button>
              </div>
              {periodOffsets.year !== 0 && (
                <button className="period-reset-btn" onClick={() => resetPeriod('year')}>
                  Naar dit jaar
                </button>
              )}
              <div className="period-stats">
                <div className="period-stat">
                  <span className="period-stat-label">Omzet</span>
                  <span className="period-stat-value">€{periodEarnings.year.earned.toFixed(2)}</span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Winst</span>
                  <span className={`period-stat-value ${periodEarnings.year.profit >= 0 ? 'positive' : 'negative'}`}>
                    {periodEarnings.year.profit >= 0 ? '+' : ''}€{periodEarnings.year.profit.toFixed(2)}
                  </span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Verkopen</span>
                  <span className="period-stat-value">{periodEarnings.year.sales}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
