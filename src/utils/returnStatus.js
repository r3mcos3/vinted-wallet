/**
 * Calculate return status for a product based on purchase date
 * Products can be returned within 30 days of purchase
 * Warning status shown 7 days before deadline
 */

export function getReturnStatus(purchaseDate) {
  if (!purchaseDate) {
    return { status: 'normal', daysLeft: null, message: null }
  }

  const purchase = new Date(purchaseDate)
  const today = new Date()

  // Reset time to midnight for accurate day calculation
  purchase.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const daysSincePurchase = Math.floor((today - purchase) / (1000 * 60 * 60 * 24))
  const daysUntilDeadline = 30 - daysSincePurchase

  if (daysSincePurchase > 30) {
    return {
      status: 'expired',
      daysLeft: 0,
      message: 'Retour deadline verstreken'
    }
  }

  if (daysUntilDeadline <= 7) {
    return {
      status: 'warning',
      daysLeft: daysUntilDeadline,
      message: `Nog ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'dag' : 'dagen'} om te retourneren`
    }
  }

  return {
    status: 'normal',
    daysLeft: daysUntilDeadline,
    message: null
  }
}

/**
 * Check if product has return warning status
 */
export function hasReturnWarning(purchaseDate) {
  const { status } = getReturnStatus(purchaseDate)
  return status === 'warning' || status === 'expired'
}
