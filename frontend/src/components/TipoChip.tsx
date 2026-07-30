import { Box, Typography } from '@mui/material'
import type { TipoItem } from '../api/types'

const TIPO_COLORS: Record<TipoItem, string> = {
  Escritório: '#5B7DA6',
  Copa: '#8A8F3F',
  TI: '#B5502A',
  Geral: '#8A8478',
  Temporário: '#8B5FA6',
}

/** Ponto colorido + rótulo, mesma linguagem visual do StatusChip. */
export function TipoChip({ tipo }: { tipo: TipoItem }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.9 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TIPO_COLORS[tipo] ?? '#8A8478', flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{tipo}</Typography>
    </Box>
  )
}
