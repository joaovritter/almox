import { useState } from 'react'
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material'
import { extractErrorMessage } from '../../api/client'
import { registrarEmprestimo, registrarRetirada } from '../../api/movimentacoes'
import type { Colaborador, Item } from '../../api/types'

interface SaidaFormProps {
  tipo: 'retirada' | 'emprestimo'
  itens: Item[]
  colaboradores: Colaborador[]
  onSuccess: (mensagem: string) => void
}

/** Compartilhado por Retirada e Empréstimo: mesma UI, muda só a chamada de API. */
export function SaidaForm({ tipo, itens, colaboradores, onSuccess }: SaidaFormProps) {
  const [item, setItem] = useState<Item | null>(null)
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!item || !colaborador) {
      setError('Selecione o item e o servidor.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const registrar = tipo === 'retirada' ? registrarRetirada : registrarEmprestimo
      const movimentacao = await registrar({ item: item.id, colaborador: colaborador.id, quantidade })
      onSuccess(
        movimentacao.status_ti === 'Pendente'
          ? 'Solicitação registrada e pendente de aprovação.'
          : 'Movimentação registrada com sucesso.',
      )
      setItem(null)
      setColaborador(null)
      setQuantidade(1)
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao registrar a movimentação.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <Autocomplete
          options={itens}
          getOptionLabel={(option) => `${option.codigo_item} — ${option.nome_item}`}
          value={item}
          onChange={(_, value) => setItem(value)}
          renderInput={(params) => <TextField {...params} label="Item" required />}
        />
        <Autocomplete
          options={colaboradores}
          getOptionLabel={(option) => option.nome}
          value={colaborador}
          onChange={(_, value) => setColaborador(value)}
          renderInput={(params) => <TextField {...params} label="Servidor" required />}
        />
        <TextField
          label="Quantidade"
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          inputProps={{ min: 1 }}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Registrar {tipo === 'retirada' ? 'retirada' : 'empréstimo'}
        </Button>
      </Stack>
    </Box>
  )
}
