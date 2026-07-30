import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { extractErrorMessage } from '../../api/client'
import type { Item } from '../../api/types'

interface AjustarEstoqueDialogProps {
  open: boolean
  item: Item | null
  onClose: () => void
  onSubmit: (quantidade: number) => Promise<void>
}

export function AjustarEstoqueDialog({ open, item, onClose, onSubmit }: AjustarEstoqueDialogProps) {
  const [quantidade, setQuantidade] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && item) {
      setQuantidade(item.quantidade_atual)
      setError(null)
    }
  }, [open, item])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(quantidade)
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao ajustar o estoque.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ajustar estoque — {item?.nome_item}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Nova quantidade"
          type="number"
          fullWidth
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          inputProps={{ min: 0 }}
          sx={{ mt: 1 }}
        />
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
