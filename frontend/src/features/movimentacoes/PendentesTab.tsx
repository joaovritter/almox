import { useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { extractErrorMessage } from '../../api/client'
import { aprovarMovimentacao, listarPendentes, rejeitarMovimentacao } from '../../api/movimentacoes'
import type { Movimentacao } from '../../api/types'

interface PendentesTabProps {
  onSuccess: (mensagem: string) => void
  onItensAtualizados: () => void
}

export function PendentesTab({ onSuccess, onItensAtualizados }: PendentesTabProps) {
  const [pendentes, setPendentes] = useState<Movimentacao[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processandoId, setProcessandoId] = useState<number | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setPendentes(await listarPendentes())
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao carregar solicitações pendentes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleAprovar(id: number) {
    setProcessandoId(id)
    setError(null)
    try {
      await aprovarMovimentacao(id)
      onSuccess('Solicitação aprovada e estoque atualizado.')
      await carregar()
      onItensAtualizados()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao aprovar a solicitação.'))
    } finally {
      setProcessandoId(null)
    }
  }

  async function handleRejeitar(id: number) {
    setProcessandoId(id)
    setError(null)
    try {
      await rejeitarMovimentacao(id)
      onSuccess('Solicitação rejeitada.')
      await carregar()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao rejeitar a solicitação.'))
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Solicitações pendentes de aprovação
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && pendentes.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nenhuma solicitação pendente.
        </Typography>
      )}
      {pendentes.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Servidor</TableCell>
              <TableCell>Qtd.</TableCell>
              <TableCell>Movimento</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendentes.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell>{mov.item_nome}</TableCell>
                <TableCell>{mov.colaborador_nome}</TableCell>
                <TableCell>{mov.quantidade}</TableCell>
                <TableCell>{mov.tipo_movimento}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={processandoId === mov.id}
                      onClick={() => handleAprovar(mov.id)}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={processandoId === mov.id}
                      onClick={() => handleRejeitar(mov.id)}
                    >
                      Rejeitar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}
