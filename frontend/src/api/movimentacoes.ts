import { apiClient } from './client'
import type { Movimentacao, Paginated, SaidaAtiva } from './types'

export interface RegistrarMovimentacaoInput {
  item: number
  colaborador: number
  quantidade: number
}

async function registrar(path: string, input: RegistrarMovimentacaoInput): Promise<Movimentacao> {
  const response = await apiClient.post<Movimentacao>(`/movimentacoes/${path}/`, input)
  return response.data
}

export const registrarRetirada = (input: RegistrarMovimentacaoInput) => registrar('retirada', input)
export const registrarEmprestimo = (input: RegistrarMovimentacaoInput) => registrar('emprestimo', input)
export const registrarDevolucao = (input: RegistrarMovimentacaoInput) => registrar('devolucao', input)

export async function listarPendentes(): Promise<Movimentacao[]> {
  const response = await apiClient.get<Movimentacao[]>('/movimentacoes/pendentes/')
  return response.data
}

export async function aprovarMovimentacao(id: number): Promise<Movimentacao> {
  const response = await apiClient.post<Movimentacao>(`/movimentacoes/${id}/aprovar/`)
  return response.data
}

export async function rejeitarMovimentacao(id: number): Promise<Movimentacao> {
  const response = await apiClient.post<Movimentacao>(`/movimentacoes/${id}/rejeitar/`)
  return response.data
}

export async function listarSaidasAtivas(colaboradorId: number): Promise<SaidaAtiva[]> {
  const response = await apiClient.get<SaidaAtiva[]>('/movimentacoes/saidas-ativas/', {
    params: { colaborador_id: colaboradorId },
  })
  return response.data
}

export async function listarHistorico(
  params: { tipo_movimento?: string; status_ti?: string } = {},
): Promise<Movimentacao[]> {
  const response = await apiClient.get<Paginated<Movimentacao> | Movimentacao[]>('/movimentacoes/historico/', {
    params: { ...params, page_size: 200 },
  })
  return Array.isArray(response.data) ? response.data : response.data.results
}
