const hairline = 'rgba(127,127,127,0.18)'

// Sem anotação de tipo `SxProps<Theme>` de propósito: isso faz o TS inferir um
// tipo literal preciso, evitando conflitos de overload ao compor esses objetos
// com outros valores de `sx` (ex.: `{ ...dataGridContainerSx }`).

/** Visual "sistema profissional" para o DataGrid: bordas finas, cabeçalho discreto, sem foco azul padrão. */
export const dataGridSx = {
  border: 'none',
  fontSize: 13.5,
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'background.default',
    borderBottom: `1px solid ${hairline}`,
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 700,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'text.secondary',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${hairline}`,
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
    outline: 'none',
  },
  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
    outline: 'none',
  },
  '& .MuiDataGrid-row:hover': {
    bgcolor: 'action.hover',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: `1px solid ${hairline}`,
  },
  '& .MuiDataGrid-columnSeparator': {
    display: 'none',
  },
} as const

/** Wrapper (Box) que dá o "cartão" com borda fina em volta do grid. */
export const dataGridContainerSx = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
  overflow: 'hidden',
  bgcolor: 'background.paper',
} as const
