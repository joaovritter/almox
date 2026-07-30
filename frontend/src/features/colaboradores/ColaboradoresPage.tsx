import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import { useAuth } from '../../auth/AuthContext'
import { extractErrorMessage } from '../../api/client'
import {
  atualizarColaborador,
  criarColaborador,
  importarColaboradoresCsv,
  listarColaboradores,
  removerColaborador,
} from '../../api/colaboradores'
import type { Colaborador } from '../../api/types'
import { ImportCsvDialog } from '../../components/ImportCsvDialog'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { dataGridContainerSx, dataGridSx } from '../../styles/dataGridSx'
import { fontMono } from '../../theme'
import { ColaboradorFormDialog, type ColaboradorFormValues } from './ColaboradorFormDialog'

export function ColaboradoresPage() {
  const { isAdmin } = useAuth()

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [selecionado, setSelecionado] = useState<Colaborador | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setColaboradores(await listarColaboradores(search))
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao carregar colaboradores.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(carregar, 300)
    return () => clearTimeout(timeout)
  }, [carregar])

  async function handleSalvar(values: ColaboradorFormValues) {
    if (selecionado) {
      await atualizarColaborador(selecionado.id, values)
      setFeedback('Colaborador atualizado com sucesso.')
    } else {
      await criarColaborador(values)
      setFeedback('Colaborador cadastrado com sucesso.')
    }
    await carregar()
  }

  async function handleExcluir() {
    if (!selecionado) return
    try {
      await removerColaborador(selecionado.id)
      setFeedback('Colaborador excluído com sucesso.')
      setConfirmDeleteOpen(false)
      await carregar()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao excluir o colaborador.'))
      setConfirmDeleteOpen(false)
    }
  }

  const columns = useMemo<GridColDef<Colaborador>[]>(() => {
    const base: GridColDef<Colaborador>[] = [
      { field: 'nome', headerName: 'Nome', flex: 1, minWidth: 220 },
      {
        field: 'matricula',
        headerName: 'Matrícula',
        width: 140,
        renderCell: (params: GridRenderCellParams<Colaborador>) => (
          <Box component="span" sx={{ fontFamily: fontMono, fontSize: 12.5 }}>
            {params.value}
          </Box>
        ),
      },
      { field: 'setor', headerName: 'Setor', width: 180 },
    ]

    if (!isAdmin) return base

    return [
      ...base,
      {
        field: 'acoes',
        headerName: 'Ações',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Colaborador>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => {
                  setSelecionado(params.row)
                  setFormOpen(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setSelecionado(params.row)
                  setConfirmDeleteOpen(true)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ]
  }, [isAdmin])

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Colaboradores</Typography>
        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelecionado(null)
                setFormOpen(true)
              }}
            >
              Novo colaborador
            </Button>
          </Stack>
        )}
      </Stack>

      <TextField
        label="Pesquisar (nome ou matrícula)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, minWidth: 320 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={[{ height: 520 }, dataGridContainerSx]}>
        <DataGrid
          rows={colaboradores}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={dataGridSx}
        />
      </Box>

      <ColaboradorFormDialog
        open={formOpen}
        colaborador={selecionado}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSalvar}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Excluir colaborador"
        description={`Tem certeza que deseja excluir "${selecionado?.nome}"? Colaboradores com histórico de movimentação não podem ser excluídos.`}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleExcluir}
      />
      <ImportCsvDialog
        open={importOpen}
        title="Importar colaboradores via CSV"
        instructions="O arquivo deve conter as colunas: nome_colaborador, setor, matricula."
        onClose={() => setImportOpen(false)}
        onImport={importarColaboradoresCsv}
        onImported={carregar}
      />

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} message={feedback} />
    </Box>
  )
}
