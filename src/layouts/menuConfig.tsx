import AssessmentIcon from '@mui/icons-material/Assessment'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import ChatIcon from '@mui/icons-material/Chat'
import DescriptionIcon from '@mui/icons-material/Description'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PersonIcon from '@mui/icons-material/Person'
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg'
import SettingsIcon from '@mui/icons-material/Settings'
import type { ReactNode } from 'react'
import {
  CLINICAL_STAFF_ROLES,
  STAFF_ROLES,
  type UserRole,
} from '../routes/access'

export type MenuLink = { kind: 'link'; label: string; to: string; roles?: readonly UserRole[] }
export type MenuDivider = { kind: 'divider'; label: string }
export type MenuSubmenu = {
  kind: 'submenu'
  id: string
  label: string
  icon: ReactNode
  roles?: readonly UserRole[]
  items: (MenuLink | MenuDivider)[]
}
export type MenuTopLink = {
  kind: 'link'
  id: string
  label: string
  to: string
  icon: ReactNode
  roles?: readonly UserRole[]
}
export type MenuItem = MenuSubmenu | MenuTopLink

const allMenuItems: MenuItem[] = [
  {
    kind: 'link',
    id: 'agenda-clinica',
    label: 'Agenda clínica',
    to: '/clinical-appointments',
    icon: <CalendarMonthIcon />,
  },
  {
    kind: 'submenu',
    id: 'recepcao',
    label: 'Recepção',
    icon: <PermPhoneMsgIcon />,
    roles: STAFF_ROLES,
    items: [
      { kind: 'link', label: 'Registros', to: '/registros' },
      { kind: 'link', label: 'Chamadas', to: '/chamadas' },
      { kind: 'link', label: 'Mensagens', to: '/mensagens' },
    ],
  },
  {
    kind: 'submenu',
    id: 'tiss',
    label: 'TISS',
    icon: <DescriptionIcon />,
    roles: STAFF_ROLES,
    items: [
      { kind: 'link', label: 'Guias', to: '/guias' },
      { kind: 'link', label: 'Procedimentos', to: '/procedimentos' },
      { kind: 'link', label: 'Lotes', to: '/tiss/lotes' },
      { kind: 'link', label: 'Planos de saúde', to: '/planos-saude' },
    ],
  },
  {
    kind: 'link',
    id: 'pacientes',
    label: 'Pacientes',
    to: '/pacientes',
    icon: <PersonIcon />,
    roles: CLINICAL_STAFF_ROLES,
  },
  {
    kind: 'link',
    id: 'profissionais',
    label: 'Profissionais',
    to: '/profissionais',
    icon: <MedicalServicesIcon />,
    roles: CLINICAL_STAFF_ROLES,
  },
  {
    kind: 'submenu',
    id: 'cartao',
    label: 'Cartão',
    icon: <CreditCardIcon />,
    roles: STAFF_ROLES,
    items: [{ kind: 'link', label: 'Planos', to: '/cartao/planos' }],
  },
  {
    kind: 'submenu',
    id: 'financeiro',
    label: 'Financeiro',
    icon: <AttachMoneyIcon />,
    roles: STAFF_ROLES,
    items: [
      { kind: 'link', label: 'Entradas', to: '/financeiro/entradas' },
      { kind: 'link', label: 'Saídas', to: '/financeiro/saidas' },
      { kind: 'link', label: 'Pagamentos', to: '/financeiro/pagamentos' },
    ],
  },
  {
    kind: 'submenu',
    id: 'estoque',
    label: 'Estoque',
    icon: <Inventory2Icon />,
    roles: CLINICAL_STAFF_ROLES,
    items: [
      { kind: 'link', label: 'Produtos', to: '/estoque/produtos', roles: CLINICAL_STAFF_ROLES },
      { kind: 'link', label: 'Entradas', to: '/estoque/lotes', roles: STAFF_ROLES },
      { kind: 'link', label: 'Saídas', to: '/estoque/saidas', roles: CLINICAL_STAFF_ROLES },
    ],
  },
  {
    kind: 'link',
    id: 'higia',
    label: 'Higia',
    to: '/higia',
    icon: <ChatIcon />,
    roles: STAFF_ROLES,
  },
  {
    kind: 'submenu',
    id: 'relatorios',
    label: 'Relatórios',
    icon: <AssessmentIcon />,
    roles: STAFF_ROLES,
    items: [
      { kind: 'link', label: 'Horários', to: '/relatorios/horarios' },
      { kind: 'link', label: 'Atendimentos', to: '/relatorios/atendimentos' },
      { kind: 'link', label: 'Taxa de conversão', to: '/relatorios/taxa-conversao' },
      {
        kind: 'link',
        label: 'Especialidades atendidas',
        to: '/relatorios/especialidades-atendidas',
      },
    ],
  },
  {
    kind: 'submenu',
    id: 'configuracoes',
    label: 'Configurações',
    icon: <SettingsIcon />,
    roles: CLINICAL_STAFF_ROLES,
    items: [
      { kind: 'divider', label: 'Geral' },
      { kind: 'link', label: 'Clínica', to: '/configuracoes/clinica', roles: ['ADMIN'] },
      { kind: 'link', label: 'Usuários', to: '/usuarios', roles: ['ADMIN'] },
      { kind: 'link', label: 'Tokens', to: '/configuracoes/tokens', roles: ['ADMIN'] },
      { kind: 'link', label: 'Especialidades', to: '/especialidades', roles: STAFF_ROLES },
      { kind: 'link', label: 'Pacotes', to: '/pacotes', roles: STAFF_ROLES },
      { kind: 'divider', label: 'Estoque' },
      { kind: 'link', label: 'Categorias', to: '/configuracoes/estoque/categorias', roles: STAFF_ROLES },
      { kind: 'link', label: 'Produtos', to: '/configuracoes/estoque/produtos', roles: STAFF_ROLES },
      { kind: 'link', label: 'Fornecedores', to: '/configuracoes/estoque/fornecedores', roles: STAFF_ROLES },
      { kind: 'link', label: 'Setores', to: '/configuracoes/estoque/setores', roles: STAFF_ROLES },
      { kind: 'link', label: 'Locais', to: '/configuracoes/estoque/locais', roles: STAFF_ROLES },
    ],
  },
]

function papelPodeVer(roles: readonly UserRole[] | undefined, role: UserRole): boolean {
  return !roles || roles.includes(role)
}

function filtrarSubitens(items: (MenuLink | MenuDivider)[], role: UserRole): (MenuLink | MenuDivider)[] {
  const visiveis: (MenuLink | MenuDivider)[] = []
  let divisorPendente: MenuDivider | null = null
  for (const item of items) {
    if (item.kind === 'divider') {
      divisorPendente = item
      continue
    }
    if (!papelPodeVer(item.roles, role)) {
      continue
    }
    if (divisorPendente) {
      visiveis.push(divisorPendente)
      divisorPendente = null
    }
    visiveis.push(item)
  }
  return visiveis
}

export function getMenuItems(role: UserRole | null): MenuItem[] {
  if (!role) {
    return []
  }
  const visiveis: MenuItem[] = []
  for (const item of allMenuItems) {
    if (!papelPodeVer(item.roles, role)) {
      continue
    }
    if (item.kind === 'link') {
      visiveis.push(item)
      continue
    }
    const subitens = filtrarSubitens(item.items, role)
    if (subitens.some((subitem) => subitem.kind === 'link')) {
      visiveis.push({ ...item, items: subitens })
    }
  }
  return visiveis
}

export function isLinkActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function getFirstSubmenuLink(item: MenuSubmenu): MenuLink | null {
  return item.items.find((subitem): subitem is MenuLink => subitem.kind === 'link') ?? null
}

export function getSubmenuIdForPath(pathname: string, menuItems: MenuItem[]): string | null {
  for (const item of menuItems) {
    if (item.kind === 'link') {
      if (isLinkActive(pathname, item.to)) {
        return item.id
      }
      continue
    }
    const hasMatch = item.items.some(
      (subitem) => subitem.kind === 'link' && isLinkActive(pathname, subitem.to),
    )
    if (hasMatch) {
      return item.id
    }
  }
  return null
}
