import { Box, Typography, useTheme } from '@mui/material'
import type { StatusMovimento } from '../api/types'

const STATUS_COLOR_KEY: Record<StatusMovimento, 'warning' | 'success' | 'error' | 'info'> = {
  Pendente: 'warning',
  Aprovado: 'success',
  Rejeitado: 'error',
  Concluído: 'info',
}

/** Ponto colorido + rótulo — mais discreto que um Chip preenchido do MUI. */
export function StatusChip({ status }: { status: StatusMovimento }) {
  const theme = useTheme()
  const color = theme.palette[STATUS_COLOR_KEY[status]].main

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.9 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{status}</Typography>
    </Box>
  )
}
