import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { extractErrorMessage } from '../../api/client'
import { listarSaidasAtivas, registrarDevolucao } from '../../api/movimentacoes'
import type { Colaborador, SaidaAtiva } from '../../api/types'

interface DevolucaoFormProps {
  colaboradores: Colaborador[]
  onSuccess: (mensagem: string) => void
}

export function DevolucaoForm({ colaboradores, onSuccess }: DevolucaoFormProps) {
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [saldos, setSaldos] = useState<SaidaAtiva[]>([])
  const [selecionado, setSelecionado] = useState<SaidaAtiva | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loadingSaldos, setLoadingSaldos] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSelecionado(null)
    if (!colaborador) {
      setSaldos([])
      return
    }
    setLoadingSaldos(true)
    listarSaidasAtivas(colaborador.id)
      .then(setSaldos)
      .catch((err) => setError(extractErrorMessage(err, 'Falha ao carregar saídas ativas.')))
      .finally(() => setLoadingSaldos(false))
  }, [colaborador])

  useEffect(() => {
    if (selecionado) setQuantidade(selecionado.saldo)
  }, [selecionado])

  async function handleSubmit() {
    if (!colaborador || !selecionado) {
      setError('Selecione o servidor e o item a devolver.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await registrarDevolucao({ item: selecionado.item_id, colaborador: colaborador.id, quantidade })
      onSuccess('Devolução registrada com sucesso.')
      setSaldos(await listarSaidasAtivas(colaborador.id))
      setSelecionado(null)
      setQuantidade(1)
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao registrar a devolução.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Autocomplete
          options={colaboradores}
          getOptionLabel={(option) => option.nome}
          value={colaborador}
          onChange={(_, value) => setColaborador(value)}
          renderInput={(params) => <TextField {...params} label="Servidor com item a devolver" required />}
        />

        {colaborador && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Itens em posse do servidor
            </Typography>
            {loadingSaldos && <Typography variant="body2">Carregando...</Typography>}
            {!loadingSaldos && saldos.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhum item pendente de devolução para este servidor.
              </Typography>
            )}
            {saldos.length > 0 && (
              <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {saldos.map((saldo) => (
                  <ListItemButton
                    key={saldo.item_id}
                    selected={selecionado?.item_id === saldo.item_id}
                    onClick={() => setSelecionado(saldo)}
                  >
                    <ListItemText primary={saldo.item_nome} secondary={`Quantidade retirada: ${saldo.saldo}`} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        )}

        {selecionado && (
          <TextField
            label="Quantidade a devolver"
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            inputProps={{ min: 1, max: selecionado.saldo }}
          />
        )}

        <Button variant="contained" onClick={handleSubmit} disabled={submitting || !selecionado}>
          Devolver item selecionado
        </Button>
      </Stack>
    </Box>
  )
}
