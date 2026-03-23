import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getIsAdmin } from '../services/authStorage'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  if (!getIsAdmin()) {
    return <Navigate to="/registros" replace />
  }

  return <>{children}</>
}
