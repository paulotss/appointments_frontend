import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getUserRole } from '../services/authStorage'
import { homePathForRole, type UserRole } from './access'

interface RoleRouteProps {
  roles: readonly UserRole[]
  children: ReactNode
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const role = getUserRole()
  if (!role || !roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  return <>{children}</>
}
