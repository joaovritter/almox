import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useAuth } from './AuthContext'
import { extractErrorMessage } from '../api/client'
import { fontHeading, fontMono, INK } from '../theme'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Usuário ou senha inválidos.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* Painel de marca — some em telas estreitas */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '42%',
          minWidth: 420,
          p: 6,
          bgcolor: INK.bg,
          color: INK.text,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 15% 15%, ${INK.accentSoft}, transparent 45%)`,
            pointerEvents: 'none',
          }}
        />

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              bgcolor: INK.accent,
              color: '#1A1410',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fontHeading,
              fontWeight: 600,
              fontSize: 19,
            }}
          >
            A
          </Box>
          <Typography sx={{ fontFamily: fontHeading, fontWeight: 600, fontSize: 19 }}>Almox</Typography>
        </Stack>

        <Box sx={{ position: 'relative' }}>
          <Typography
            sx={{
              fontFamily: fontHeading,
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: '1.85rem',
              lineHeight: 1.35,
              maxWidth: 380,
            }}
          >
            Controle de estoque, movimentações e servidores em um só lugar.
          </Typography>
          <Typography sx={{ mt: 3, fontSize: 13.5, color: INK.textMuted, maxWidth: 360, lineHeight: 1.6 }}>
            Registre retiradas, empréstimos e devoluções com aprovação para itens sensíveis, e acompanhe todo o
            histórico do almoxarifado em tempo real.
          </Typography>
        </Box>

        <Typography sx={{ position: 'relative', fontFamily: fontMono, fontSize: 11, color: INK.textMuted }}>
          almox · fase 1
        </Typography>
      </Box>

      {/* Formulário */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 360 }}>
          <Typography sx={{ fontFamily: fontHeading, fontWeight: 600, fontSize: 26, mb: 0.5 }}>
            Entrar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Use suas credenciais de acesso ao sistema.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              label="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3.5, py: 1.2 }} disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
