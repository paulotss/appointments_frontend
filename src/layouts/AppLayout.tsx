import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListSubheader,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logoSeraphisBranca from '../assets/logo-seraphis-branca.png'
import { clearToken, getIsAdmin, getLoggedUser } from '../services/authStorage'
import { getMenuItems, getSubmenuIdForPath, type MenuDivider, type MenuLink } from './menuConfig'

const DRAWER_WIDTH = 260

export function AppLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUser = getLoggedUser()
  const displayName = loggedUser?.name?.trim() || loggedUser?.usernameLogin || 'Usuário'

  const menuItems = useMemo(() => getMenuItems(isAdmin), [isAdmin])

  const [drawerOpen, setDrawerOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width:900px)').matches : false,
  )
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setDrawerOpen(isDesktop)
  }, [isDesktop])

  useEffect(() => {
    const activeSubmenuId = getSubmenuIdForPath(location.pathname, menuItems)
    if (activeSubmenuId) {
      setOpenSubmenus((prev) => ({ ...prev, [activeSubmenuId]: true }))
    }
  }, [location.pathname, menuItems])

  useEffect(() => {
    if (!isDesktop) {
      setDrawerOpen(false)
    }
  }, [location.pathname, isDesktop])

  function toggleDrawer() {
    setDrawerOpen((prev) => !prev)
  }

  function toggleSubmenu(id: string) {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  const drawerTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  })

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar
        sx={{
          minHeight: 80,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          py: 2,
        }}
      >
        <Box
          component="img"
          src={logoSeraphisBranca}
          alt="Seraphis"
          sx={{ width: 170, maxWidth: '100%' }}
        />
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding>
          {menuItems.map((item) => (
            <Box key={item.id}>
              <ListItemButton
                onClick={() => toggleSubmenu(item.id)}
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
                {openSubmenus[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              <Collapse in={openSubmenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.items.map((subitem) => {
                    if (subitem.kind === 'divider') {
                      return (
                        <ListSubheader
                          key={`${item.id}-${subitem.label}`}
                          disableSticky
                          sx={{
                            bgcolor: 'transparent',
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: '32px',
                            pl: 4,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {(subitem as MenuDivider).label}
                        </ListSubheader>
                      )
                    }

                    const link = subitem as MenuLink
                    return (
                      <ListItemButton
                        key={link.to}
                        component={NavLink}
                        to={link.to}
                        sx={{
                          pl: 4,
                          color: 'inherit',
                          '&.active': {
                            bgcolor: 'rgba(255,255,255,0.18)',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.12)',
                          },
                        }}
                      >
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />
      <List disablePadding sx={{ flexShrink: 0 }}>
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
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Drawer
        variant={isDesktop ? 'persistent' : 'temporary'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop && drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: drawerTransition,
          overflow: 'hidden',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            overflow: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: '100%',
          p: 3,
          transition: drawerTransition,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton
            aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={toggleDrawer}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
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
