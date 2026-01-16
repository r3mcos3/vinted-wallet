import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [periodEarnings, setPeriodEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch both overview stats and period earnings in parallel
      const [overviewResult, periodResult] = await Promise.all([
        supabase.rpc('get_overview_stats', { p_user_id: user.id }),
        supabase.rpc('get_period_earnings', { p_user_id: user.id })
      ])

      if (overviewResult.error) {
        console.error('Supabase RPC error:', overviewResult.error)
        throw overviewResult.error
      }

      // Calculate net profit
      const netProfit = overviewResult.data.total_earned - (overviewResult.data.total_invested - overviewResult.data.inventory_value)

      setStats({
        ...overviewResult.data,
        net_profit: netProfit
      })

      // Period earnings might not exist yet (before migration)
      if (!periodResult.error && periodResult.data) {
        setPeriodEarnings(periodResult.data)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStartingBudget = async (amount) => {
    if (!user) throw new Error('Not authenticated')

    try {
      const { data, error } = await supabase.rpc('update_starting_budget', {
        p_user_id: user.id,
        p_starting_budget: parseFloat(amount)
      })

      if (error) throw error

      // Refresh stats to get updated wallet balance
      await fetchStats()
      return data
    } catch (err) {
      console.error('Error updating starting budget:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user])

  return {
    stats,
    periodEarnings,
    loading,
    error,
    refetch: fetchStats,
    updateStartingBudget
  }
}
