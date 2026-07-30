import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Box, Snackbar, Tab, Tabs, Typography } from '@mui/material'
import { useAuth } from '../../auth/AuthContext'
import { listarColaboradores } from '../../api/colaboradores'
import { listarItens } from '../../api/itens'
import type { Colaborador, Item } from '../../api/types'
import { SaidaForm } from './SaidaForm'
import { DevolucaoForm } from './DevolucaoForm'
import { PendentesTab } from './PendentesTab'

interface TabDef {
  label: string
  content: ReactNode
}

export function MovimentacoesPage() {
  const { isAdmin } = useAuth()

  const [tab, setTab] = useState(0)
  const [itens, setItens] = useState<Item[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)

  const carregarListasApoio = useCallback(async () => {
    const [itensData, colaboradoresData] = await Promise.all([listarItens(), listarColaboradores()])
    setItens(itensData)
    setColaboradores(colaboradoresData)
  }, [])

  useEffect(() => {
    carregarListasApoio()
  }, [carregarListasApoio])

  const tabs = useMemo<TabDef[]>(() => {
    const base: TabDef[] = [
      {
        label: 'Retirada',
        content: <SaidaForm tipo="retirada" itens={itens} colaboradores={colaboradores} onSuccess={setFeedback} />,
      },
      {
        label: 'Empréstimo',
        content: <SaidaForm tipo="emprestimo" itens={itens} colaboradores={colaboradores} onSuccess={setFeedback} />,
      },
      {
        label: 'Devolução',
        content: <DevolucaoForm colaboradores={colaboradores} onSuccess={setFeedback} />,
      },
    ]
    if (isAdmin) {
      base.push({
        label: 'Pendentes',
        content: <PendentesTab onSuccess={setFeedback} onItensAtualizados={carregarListasApoio} />,
      })
    }
    return base
  }, [itens, colaboradores, isAdmin, carregarListasApoio])

  useEffect(() => {
    if (tab >= tabs.length) setTab(0)
  }, [tabs, tab])

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Controle de movimentação
      </Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        {tabs.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>
      {tabs[tab]?.content}

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} message={feedback} />
    </Box>
  )
}
