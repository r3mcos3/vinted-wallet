import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_overview_stats', {
        p_user_id: user.id
      })

      if (error) throw error

      // Calculate net profit
      const netProfit = data.total_earned - (data.total_invested - data.inventory_value)

      setStats({
        ...data,
        net_profit: netProfit
      })
    } catch (err) {
      setError(err.message)
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
