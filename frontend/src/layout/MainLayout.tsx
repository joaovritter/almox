import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { alpha, Box, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import GroupIcon from '@mui/icons-material/Group'
import HistoryIcon from '@mui/icons-material/History'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import { useAuth } from '../auth/AuthContext'
import { useThemeMode } from '../context/ThemeModeContext'
import { fontHeading, fontMono } from '../theme'

const NAV_ITEMS = [
  { label: 'Movimentação', path: '/movimentacoes', icon: <SwapHorizIcon fontSize="small" /> },
  { label: 'Itens', path: '/itens', icon: <Inventory2Icon fontSize="small" /> },
  { label: 'Colaboradores', path: '/colaboradores', icon: <GroupIcon fontSize="small" /> },
  { label: 'Histórico', path: '/historico', icon: <HistoryIcon fontSize="small" /> },
]

const ROLE_LABELS: Record<string, string> = {
  colaborador: 'Colaborador',
  administrativo: 'Administrativo',
  super_administrativo: 'Super Admin',
}

const floatSx = {
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 1px 2px rgba(20,17,10,0.05), 0 10px 28px rgba(20,17,10,0.06)',
  overflow: 'hidden',
} as const

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { mode, toggleMode } = useThemeMode()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.nome || user?.username || ''

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', p: 1.5, gap: 1.5, boxSizing: 'border-box' }}>
      {/* Sidebar "suspensa" — flutua sobre o fundo, acompanha o modo claro/escuro */}
      <Box component="nav" sx={{ ...floatSx, width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fontHeading,
                fontWeight: 600,
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              A
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontFamily: fontHeading, fontWeight: 600, fontSize: 17, lineHeight: 1.15 }}>
                Almox
              </Typography>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: 'text.secondary',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Gestão de materiais
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mx: 2.25, mb: 1.5 }} />

        <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0, gap: 0.5, display: 'flex' }}>
          {NAV_ITEMS.map((item) => (
            <Box
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                mx: 1.25,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                textDecoration: 'none',
                color: 'text.secondary',
                fontSize: 14,
                fontWeight: 600,
                transition: 'background-color 120ms ease, color 120ms ease',
                '& svg': { display: 'block' },
                '&:hover': { backgroundColor: 'action.hover', color: 'text.primary' },
                '&.active': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: 'text.primary',
                },
                '&.active svg': { color: 'primary.main' },
              }}
            >
              {item.icon}
              {item.label}
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 'auto', px: 2.25, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontFamily: fontMono, fontSize: 11, color: 'text.secondary' }}>
            almox · fase 1
          </Typography>
        </Box>
      </Box>

      {/* Coluna de conteúdo — também "suspensa" */}
      <Box sx={{ ...floatSx, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            height: 64,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            px: 3,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tooltip title={mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
            <IconButton size="small" onClick={toggleMode}>
              {mode === 'light' ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ my: 1.5 }} />

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {initials(displayName)}
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{displayName}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Sair">
            <IconButton size="small" onClick={handleLogout}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
