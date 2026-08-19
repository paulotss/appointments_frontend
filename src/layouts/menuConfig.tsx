import AssessmentIcon from '@mui/icons-material/Assessment'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EventNoteIcon from '@mui/icons-material/EventNote'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import SettingsIcon from '@mui/icons-material/Settings'
import type { ReactNode } from 'react'

export type MenuLink = { kind: 'link'; label: string; to: string }
export type MenuDivider = { kind: 'divider'; label: string }
export type MenuSubmenu = {
  kind: 'submenu'
  id: string
  label: string
  icon: ReactNode
  adminOnly?: boolean
  items: (MenuLink | MenuDivider)[]
}
export type MenuTopLink = {
  kind: 'link'
  id: string
  label: string
  to: string
  icon: ReactNode
  adminOnly?: boolean
}
export type MenuItem = MenuSubmenu | MenuTopLink

const allMenuItems: MenuItem[] = [
  {
    kind: 'submenu',
    id: 'agendamentos',
    label: 'Agendamentos',
    icon: <EventNoteIcon />,
    items: [
      { kind: 'link', label: 'Registros', to: '/registros' },
      { kind: 'link', label: 'Agenda clínica', to: '/clinical-appointments' },
      { kind: 'link', label: 'Chamadas', to: '/chamadas' },
      { kind: 'link', label: 'Mensagens', to: '/mensagens' },
    ],
  },
  {
    kind: 'link',
    id: 'guias',
    label: 'Guias',
    to: '/guias',
    icon: <AssignmentIcon />,
    adminOnly: true,
  },
  {
    kind: 'link',
    id: 'procedimentos',
    label: 'Procedimentos',
    to: '/procedimentos',
    icon: <MedicalServicesIcon />,
    adminOnly: true,
  },
  {
    kind: 'submenu',
    id: 'estoque',
    label: 'Estoque',
    icon: <Inventory2Icon />,
    adminOnly: true,
    items: [
      { kind: 'link', label: 'Produtos', to: '/estoque/produtos' },
      { kind: 'link', label: 'Entradas', to: '/estoque/lotes' },
      { kind: 'link', label: 'Saídas', to: '/estoque/saidas' },
    ],
  },
  {
    kind: 'submenu',
    id: 'relatorios',
    label: 'Relatórios',
    icon: <AssessmentIcon />,
    adminOnly: true,
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
    adminOnly: true,
    items: [
      { kind: 'divider', label: 'Geral' },
      { kind: 'link', label: 'Usuários', to: '/usuarios' },
      { kind: 'link', label: 'Profissionais', to: '/profissionais' },
      { kind: 'link', label: 'Especialidades', to: '/especialidades' },
      { kind: 'link', label: 'Pacientes', to: '/pacientes' },
      { kind: 'link', label: 'Planos de saúde', to: '/planos-saude' },
      { kind: 'divider', label: 'Estoque' },
      { kind: 'link', label: 'Categorias', to: '/configuracoes/estoque/categorias' },
      { kind: 'link', label: 'Produtos', to: '/configuracoes/estoque/produtos' },
      { kind: 'link', label: 'Fornecedores', to: '/configuracoes/estoque/fornecedores' },
      { kind: 'link', label: 'Setores', to: '/configuracoes/estoque/setores' },
      { kind: 'link', label: 'Locais', to: '/configuracoes/estoque/locais' },
    ],
  },
]

export function getMenuItems(isAdmin: boolean): MenuItem[] {
  return allMenuItems.filter((item) => !item.adminOnly || isAdmin)
}

export function getSubmenuIdForPath(pathname: string, menuItems: MenuItem[]): string | null {
  for (const item of menuItems) {
    if (item.kind === 'link') {
      if (pathname.startsWith(item.to)) {
        return item.id
      }
      continue
    }
    const hasMatch = item.items.some(
      (subitem) => subitem.kind === 'link' && pathname.startsWith(subitem.to),
    )
    if (hasMatch) {
      return item.id
    }
  }
  return null
}
