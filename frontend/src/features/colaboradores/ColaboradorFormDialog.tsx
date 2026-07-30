import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { extractErrorMessage } from '../../api/client'
import type { Colaborador } from '../../api/types'

export interface ColaboradorFormValues {
  nome: string
  setor: string
  matricula: string
}

interface ColaboradorFormDialogProps {
  open: boolean
  colaborador: Colaborador | null
  onClose: () => void
  onSubmit: (values: ColaboradorFormValues) => Promise<void>
}

const EMPTY_VALUES: ColaboradorFormValues = { nome: '', setor: '', matricula: '' }

export function ColaboradorFormDialog({ open, colaborador, onClose, onSubmit }: ColaboradorFormDialogProps) {
  const [values, setValues] = useState<ColaboradorFormValues>(EMPTY_VALUES)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(
        colaborador
          ? { nome: colaborador.nome, setor: colaborador.setor, matricula: colaborador.matricula }
          : EMPTY_VALUES,
      )
      setError(null)
    }
  }, [open, colaborador])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao salvar o colaborador.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{colaborador ? 'Editar colaborador' : 'Cadastrar colaborador'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nome do servidor"
            value={values.nome}
            onChange={(e) => setValues({ ...values, nome: e.target.value })}
            required
          />
          <TextField
            label="Matrícula"
            value={values.matricula}
            onChange={(e) => setValues({ ...values, matricula: e.target.value })}
          />
          <TextField
            label="Departamento/Setor"
            value={values.setor}
            onChange={(e) => setValues({ ...values, setor: e.target.value })}
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
