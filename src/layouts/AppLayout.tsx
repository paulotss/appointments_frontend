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
  Toolbar,
  Typography,
} from '@mui/material'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken, getIsAdmin } from '../services/authStorage'

const DRAWER_WIDTH = 260

export function AppLayout() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
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
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>
            Atendimentos
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ flex: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                '&.active': {
                  bgcolor: 'primary.light',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
