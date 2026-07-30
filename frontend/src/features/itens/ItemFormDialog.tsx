import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { TIPOS_ITEM } from '../../api/itens'
import { extractErrorMessage } from '../../api/client'
import type { Item, TipoItem } from '../../api/types'

export interface ItemFormValues {
  codigo_item: string
  nome_item: string
  quantidade_atual: number
  tipo: TipoItem
  requer_aprovacao: boolean
}

interface ItemFormDialogProps {
  open: boolean
  item: Item | null
  onClose: () => void
  onSubmit: (values: ItemFormValues) => Promise<void>
}

const EMPTY_VALUES: ItemFormValues = {
  codigo_item: '',
  nome_item: '',
  quantidade_atual: 0,
  tipo: 'Geral',
  requer_aprovacao: false,
}

export function ItemFormDialog({ open, item, onClose, onSubmit }: ItemFormDialogProps) {
  const [values, setValues] = useState<ItemFormValues>(EMPTY_VALUES)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(
        item
          ? {
              codigo_item: item.codigo_item,
              nome_item: item.nome_item,
              quantidade_atual: item.quantidade_atual,
              tipo: item.tipo,
              requer_aprovacao: item.requer_aprovacao,
            }
          : EMPTY_VALUES,
      )
      setError(null)
    }
  }, [open, item])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao salvar o item.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item ? 'Editar item' : 'Cadastrar item'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Código/SKU"
            value={values.codigo_item}
            onChange={(e) => setValues({ ...values, codigo_item: e.target.value })}
            required
          />
          <TextField
            label="Nome do item"
            value={values.nome_item}
            onChange={(e) => setValues({ ...values, nome_item: e.target.value })}
            required
          />
          <TextField
            select
            label="Categoria"
            value={values.tipo}
            onChange={(e) => setValues({ ...values, tipo: e.target.value as TipoItem })}
          >
            {TIPOS_ITEM.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
          {!item && (
            <TextField
              label="Quantidade inicial"
              type="number"
              value={values.quantidade_atual}
              onChange={(e) => setValues({ ...values, quantidade_atual: Number(e.target.value) })}
              inputProps={{ min: 0 }}
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={values.requer_aprovacao}
                onChange={(e) => setValues({ ...values, requer_aprovacao: e.target.checked })}
              />
            }
            label="Requer aprovação (ex.: itens de TI)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
