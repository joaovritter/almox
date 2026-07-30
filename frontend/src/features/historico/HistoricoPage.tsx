import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { extractErrorMessage } from '../../api/client'
import { listarHistorico } from '../../api/movimentacoes'
import type { Movimentacao, StatusMovimento } from '../../api/types'
import { StatusChip } from '../../components/StatusChip'
import { dataGridContainerSx, dataGridSx } from '../../styles/dataGridSx'
import { fontMono } from '../../theme'

const TIPOS = ['Saída', 'Empréstimo', 'Devolução']
const STATUS = ['Pendente', 'Aprovado', 'Rejeitado', 'Concluído']

export function HistoricoPage() {
  const [historico, setHistorico] = useState<Movimentacao[]>([])
  const [tipo, setTipo] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dados = await listarHistorico({
        tipo_movimento: tipo || undefined,
        status_ti: status || undefined,
      })
      setHistorico(dados)
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao carregar o histórico.'))
    } finally {
      setLoading(false)
    }
  }, [tipo, status])

  useEffect(() => {
    carregar()
  }, [carregar])

  const columns = useMemo<GridColDef<Movimentacao>[]>(
    () => [
      {
        field: 'data_hora',
        headerName: 'Data/Hora',
        width: 170,
        valueFormatter: (value: string) => new Date(value).toLocaleString('pt-BR'),
        renderCell: (params: GridRenderCellParams<Movimentacao>) => (
          <Box component="span" sx={{ fontFamily: fontMono, fontSize: 12.5, color: 'text.secondary' }}>
            {new Date(params.row.data_hora).toLocaleString('pt-BR')}
          </Box>
        ),
      },
      { field: 'tipo_movimento', headerName: 'Tipo', width: 130 },
      { field: 'item_nome', headerName: 'Item', flex: 1, minWidth: 180 },
      { field: 'colaborador_nome', headerName: 'Servidor', flex: 1, minWidth: 180 },
      {
        field: 'quantidade',
        headerName: 'Qtd.',
        width: 80,
        type: 'number',
        renderCell: (params: GridRenderCellParams<Movimentacao>) => (
          <Box component="span" sx={{ fontFamily: fontMono, fontWeight: 600 }}>
            {params.value}
          </Box>
        ),
      },
      {
        field: 'status_ti',
        headerName: 'Status',
        width: 130,
        renderCell: (params: GridRenderCellParams<Movimentacao>) => (
          <StatusChip status={params.row.status_ti as StatusMovimento} />
        ),
      },
    ],
    [],
  )

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Histórico completo de movimentação
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Todos</MenuItem>
          {TIPOS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {STATUS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={[{ height: 560 }, dataGridContainerSx]}>
        <DataGrid
          rows={historico}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          sx={dataGridSx}
        />
      </Box>
    </Box>
  )
}
