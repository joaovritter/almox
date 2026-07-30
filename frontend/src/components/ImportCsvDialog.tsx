import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { extractErrorMessage } from '../api/client'
import type { ImportResult } from '../api/types'

interface ImportCsvDialogProps {
  open: boolean
  title: string
  instructions: string
  onClose: () => void
  onImport: (arquivo: File) => Promise<ImportResult>
  onImported: () => void
}

export function ImportCsvDialog({ open, title, instructions, onClose, onImport, onImported }: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    setFile(null)
    setResult(null)
    setError(null)
    onClose()
  }

  async function handleImport() {
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      const importResult = await onImport(file)
      setResult(importResult)
      onImported()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao importar o arquivo.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {instructions}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component="label">
            Selecionar arquivo CSV
            <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {file.name}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.falhas.length ? 'warning' : 'success'}>
              {result.sucessos} registro(s) importado(s) com sucesso.
              {result.falhas.length > 0 && ` ${result.falhas.length} falha(s).`}
            </Alert>
            {result.falhas.length > 0 && (
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {result.falhas.map((falha, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={falha} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
        <Button variant="contained" onClick={handleImport} disabled={!file || submitting}>
          Importar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
