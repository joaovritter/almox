import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import EditIcon from '@mui/icons-material/Edit'
import TuneIcon from '@mui/icons-material/Tune'
import DeleteIcon from '@mui/icons-material/Delete'

import { useAuth } from '../../auth/AuthContext'
import { extractErrorMessage } from '../../api/client'
import {
  TIPOS_ITEM,
  ajustarEstoque,
  atualizarItem,
  criarItem,
  importarItensCsv,
  listarItens,
  removerItem,
} from '../../api/itens'
import type { Item } from '../../api/types'
import { ImportCsvDialog } from '../../components/ImportCsvDialog'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { TipoChip } from '../../components/TipoChip'
import { dataGridContainerSx, dataGridSx } from '../../styles/dataGridSx'
import { fontMono } from '../../theme'
import { ItemFormDialog, type ItemFormValues } from './ItemFormDialog'
import { AjustarEstoqueDialog } from './AjustarEstoqueDialog'

export function ItensPage() {
  const { isAdmin } = useAuth()

  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [estoqueOpen, setEstoqueOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItens(await listarItens({ search: search || undefined, tipo: tipoFiltro || undefined }))
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao carregar itens.'))
    } finally {
      setLoading(false)
    }
  }, [search, tipoFiltro])

  useEffect(() => {
    const timeout = setTimeout(carregar, 300)
    return () => clearTimeout(timeout)
  }, [carregar])

  async function handleSalvarItem(values: ItemFormValues) {
    if (selectedItem) {
      await atualizarItem(selectedItem.id, {
        codigo_item: values.codigo_item,
        nome_item: values.nome_item,
        tipo: values.tipo,
        requer_aprovacao: values.requer_aprovacao,
      })
      setFeedback('Item atualizado com sucesso.')
    } else {
      await criarItem(values)
      setFeedback('Item cadastrado com sucesso.')
    }
    await carregar()
  }

  async function handleAjustarEstoque(quantidade: number) {
    if (!selectedItem) return
    await ajustarEstoque(selectedItem.id, quantidade)
    setFeedback('Estoque ajustado com sucesso.')
    await carregar()
  }

  async function handleExcluir() {
    if (!selectedItem) return
    try {
      await removerItem(selectedItem.id)
      setFeedback('Item excluído com sucesso.')
      setConfirmDeleteOpen(false)
      await carregar()
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao excluir o item.'))
      setConfirmDeleteOpen(false)
    }
  }

  const columns = useMemo<GridColDef<Item>[]>(() => {
    const base: GridColDef<Item>[] = [
      {
        field: 'codigo_item',
        headerName: 'Código',
        width: 120,
        renderCell: (params: GridRenderCellParams<Item>) => (
          <Box component="span" sx={{ fontFamily: fontMono, fontSize: 12.5 }}>
            {params.value}
          </Box>
        ),
      },
      { field: 'nome_item', headerName: 'Nome do item', flex: 1, minWidth: 200 },
      {
        field: 'tipo',
        headerName: 'Categoria',
        width: 140,
        renderCell: (params: GridRenderCellParams<Item>) => <TipoChip tipo={params.row.tipo} />,
      },
      {
        field: 'quantidade_atual',
        headerName: 'Qtd. atual',
        width: 110,
        type: 'number',
        renderCell: (params: GridRenderCellParams<Item>) => (
          <Box component="span" sx={{ fontFamily: fontMono, fontWeight: 600 }}>
            {params.value}
          </Box>
        ),
      },
      {
        field: 'requer_aprovacao',
        headerName: 'Requer aprovação',
        width: 150,
        valueFormatter: (value: boolean) => (value ? 'Sim' : 'Não'),
      },
    ]

    if (!isAdmin) return base

    return [
      ...base,
      {
        field: 'acoes',
        headerName: 'Ações',
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Item>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Editar item">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedItem(params.row)
                  setFormOpen(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ajustar estoque">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedItem(params.row)
                  setEstoqueOpen(true)
                }}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir item">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setSelectedItem(params.row)
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
        <Typography variant="h5">Estoque de itens</Typography>
        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedItem(null)
                setFormOpen(true)
              }}
            >
              Novo item
            </Button>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Pesquisar (nome ou código)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <TextField
          select
          label="Categoria"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {TIPOS_ITEM.map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {tipo}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={[{ height: 520 }, dataGridContainerSx]}>
        <DataGrid
          rows={itens}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={dataGridSx}
        />
      </Box>

      <ItemFormDialog
        open={formOpen}
        item={selectedItem}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSalvarItem}
      />
      <AjustarEstoqueDialog
        open={estoqueOpen}
        item={selectedItem}
        onClose={() => setEstoqueOpen(false)}
        onSubmit={handleAjustarEstoque}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Excluir item"
        description={`Tem certeza que deseja excluir "${selectedItem?.nome_item}"? Itens com histórico de movimentação não podem ser excluídos.`}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleExcluir}
      />
      <ImportCsvDialog
        open={importOpen}
        title="Importar itens via CSV"
        instructions="O arquivo deve conter as colunas: codigo_item, nome_item, quantidade_atual, tipo."
        onClose={() => setImportOpen(false)}
        onImport={importarItensCsv}
        onImported={carregar}
      />

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} message={feedback} />
    </Box>
  )
}
