import EventNoteIcon from '@mui/icons-material/EventNote'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import PercentIcon from '@mui/icons-material/Percent'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LogoutIcon from '@mui/icons-material/Logout'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PeopleIcon from '@mui/icons-material/People'
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Toolbar,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logoSeraphisBranca from '../assets/logo-seraphis-branca.png'
import { clearToken, getIsAdmin, getLoggedUser } from '../services/authStorage'

const DRAWER_WIDTH = 260

export function AppLayout() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUser = getLoggedUser()
  const displayName = loggedUser?.name?.trim() || loggedUser?.usernameLogin || 'Usuário'
  const [relatoriosAberto, setRelatoriosAberto] = useState(true)

  const menuItems = useMemo(() => {
    return [
      { label: 'Registros', to: '/registros', icon: <EventNoteIcon /> },
      ...(isAdmin
        ? [
            { label: 'Especialidades', to: '/especialidades', icon: <MedicalServicesIcon /> },
            { label: 'Usuarios', to: '/usuarios', icon: <PeopleIcon /> },
            {
              type: 'submenu' as const,
              label: 'Relatórios',
              icon: <AssessmentIcon />,
              items: [
                { label: 'Horários', to: '/relatorios/horarios', icon: <AccessTimeIcon /> },
                { label: 'Atendimentos', to: '/relatorios/atendimentos', icon: <PersonIcon /> },
                { label: 'Taxa de conversão', to: '/relatorios/taxa-conversao', icon: <PercentIcon /> },
              ],
            },
          ]
        : []),
    ]
  }, [isAdmin])

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        }}
      >
        <Toolbar sx={{ minHeight: 80, display: 'flex', justifyContent: 'center', py: 2 }}>
          <Box
            component="img"
            src={logoSeraphisBranca}
            alt="Seraphis"
            sx={{ width: 170, maxWidth: '100%' }}
          />
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.22)' }} />
        <List sx={{ flex: 1 }}>
          {menuItems.map((item) => {
            if ('type' in item && item.type === 'submenu') {
              return (
                <Box key={item.label}>
                  <ListItemButton
                    onClick={() => setRelatoriosAberto((prev) => !prev)}
                    sx={{
                      color: 'inherit',
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                        minWidth: 40,
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.12)',
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                    {relatoriosAberto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>
                  <Collapse in={relatoriosAberto} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.items.map((subitem) => (
                        <ListItemButton
                          key={subitem.to}
                          component={NavLink}
                          to={subitem.to}
                          sx={{
                            pl: 4,
                            color: 'inherit',
                            '& .MuiListItemIcon-root': {
                              color: 'inherit',
                              minWidth: 40,
                            },
                            '&.active': {
                              bgcolor: 'rgba(255,255,255,0.18)',
                            },
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.12)',
                            },
                          }}
                        >
                          <ListItemIcon>{subitem.icon}</ListItemIcon>
                          <ListItemText primary={subitem.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )
            }

            return (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  color: 'inherit',
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                    minWidth: 40,
                  },
                  '&.active': {
                    bgcolor: 'rgba(255,255,255,0.18)',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          })}
        </List>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.22)' }} />
        <List>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              color: 'inherit',
              '& .MuiListItemIcon-root': {
                color: 'inherit',
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Typography
            component="p"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.dark',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: 1,
            }}
          >
            Bem vindo(a), {displayName}
          </Typography>
        </Box>
        <Outlet />
      </Box>
    </Box>
  )
}
