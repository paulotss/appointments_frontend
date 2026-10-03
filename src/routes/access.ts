export const USER_ROLES = ['PATIENT', 'PROFESSIONAL', 'RECEPTIONIST', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ALL_ROLES: readonly UserRole[] = USER_ROLES

export const STAFF_ROLES: readonly UserRole[] = ['RECEPTIONIST', 'ADMIN']

export const CLINICAL_STAFF_ROLES: readonly UserRole[] = [
  'PROFESSIONAL',
  'RECEPTIONIST',
  'ADMIN',
]

export const ADMIN_ROLES: readonly UserRole[] = ['ADMIN']

export const ROLE_LABELS: Record<UserRole, string> = {
  PATIENT: 'Paciente',
  PROFESSIONAL: 'Profissional',
  RECEPTIONIST: 'Colaborador',
  ADMIN: 'Administrador',
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}

export function homePathForRole(role: UserRole | null): string {
  if (role === 'PATIENT' || role === 'PROFESSIONAL') {
    return '/clinical-appointments'
  }
  return '/registros'
}
