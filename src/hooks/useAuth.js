import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useMockAuth } from '../mocks/MockDataProvider'

const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

// Export the appropriate hook based on mode
export const useAuth = isMockMode ? useMockAuth : function useRealAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
