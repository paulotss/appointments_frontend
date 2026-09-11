import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListSubheader,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logoSeraphisBranca from '../assets/logo-seraphis-branca.png'
import { PortalRagChat } from '../components/PortalRagChat'
import { clearToken, getIsAdmin, getLoggedUser } from '../services/authStorage'
import { getMenuItems, getSubmenuIdForPath, type MenuDivider, type MenuLink } from './menuConfig'

const DRAWER_WIDTH = 260
const TOP_BAR_HEIGHT = 60

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'U'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1][0] ?? ''
  return `${first}${last}`.toUpperCase()
}

export function AppLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUser = getLoggedUser()
  const displayName = loggedUser?.name?.trim() || loggedUser?.usernameLogin || 'Usuário'
  const userInitials = getUserInitials(displayName)

  const menuItems = useMemo(() => getMenuItems(isAdmin), [isAdmin])

  const [drawerOpen, setDrawerOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width:900px)').matches : false,
  )
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

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
    setUserMenuAnchor(null)
    clearToken()
    navigate('/login', { replace: true })
  }

  const drawerTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  })

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding>
          {menuItems.map((item) => {
            if (item.kind === 'link') {
              return (
                <ListItemButton
                  key={item.id}
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
            }

            return (
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
            )
          })}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: TOP_BAR_HEIGHT,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: `${TOP_BAR_HEIGHT}px !important`,
            height: TOP_BAR_HEIGHT,
            px: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={logoSeraphisBranca}
              alt="Clínica Seraphis"
              sx={{ height: 40, width: 'auto' }}
            />
            <Typography component="p" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Clínica Seraphis
            </Typography>
          </Box>

          <Box>
            <IconButton
              aria-label="Menu do usuário"
              aria-controls={userMenuAnchor ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuAnchor ? 'true' : undefined}
              onClick={(event) => setUserMenuAnchor(event.currentTarget)}
              sx={{ p: 0.25 }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.dark',
                  color: 'primary.contrastText',
                  width: 40,
                  height: 40,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: { mt: 1 },
                },
              }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, pt: `${TOP_BAR_HEIGHT}px` }}>
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
              top: TOP_BAR_HEIGHT,
              height: `calc(100% - ${TOP_BAR_HEIGHT}px)`,
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
          <Outlet />
        </Box>
      </Box>
      <PortalRagChat />
    </Box>
  )
}
