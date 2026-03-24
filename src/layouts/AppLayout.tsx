import EventNoteIcon from '@mui/icons-material/EventNote'
import LogoutIcon from '@mui/icons-material/Logout'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import PeopleIcon from '@mui/icons-material/People'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Toolbar,
} from '@mui/material'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logoSeraphisBranca from '../assets/logo-seraphis-branca.png'
import { clearToken, getIsAdmin, getLoggedUser } from '../services/authStorage'

const DRAWER_WIDTH = 260

export function AppLayout() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUser = getLoggedUser()
  const displayName = loggedUser?.name?.trim() || loggedUser?.usernameLogin || 'Usuário'
  const menuItems = [
    { label: 'Registros', to: '/registros', icon: <EventNoteIcon /> },
    ...(isAdmin
      ? [
          { label: 'Especialidades', to: '/especialidades', icon: <MedicalServicesIcon /> },
          { label: 'Usuarios', to: '/usuarios', icon: <PeopleIcon /> },
        ]
      : []),
  ]

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
          {menuItems.map((item) => (
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
          ))}
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
