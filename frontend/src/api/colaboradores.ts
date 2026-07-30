import { apiClient } from './client'
import type { Colaborador, ImportResult, Paginated } from './types'

export interface ColaboradorInput {
  nome: string
  setor?: string
  matricula?: string
}

export async function listarColaboradores(search = ''): Promise<Colaborador[]> {
  const response = await apiClient.get<Paginated<Colaborador> | Colaborador[]>('/colaboradores/', {
    params: { search: search || undefined, page_size: 200 },
  })
  return Array.isArray(response.data) ? response.data : response.data.results
}

export async function criarColaborador(input: ColaboradorInput): Promise<Colaborador> {
  const response = await apiClient.post<Colaborador>('/colaboradores/', input)
  return response.data
}

export async function atualizarColaborador(id: number, input: ColaboradorInput): Promise<Colaborador> {
  const response = await apiClient.patch<Colaborador>(`/colaboradores/${id}/`, input)
  return response.data
}

export async function removerColaborador(id: number): Promise<void> {
  await apiClient.delete(`/colaboradores/${id}/`)
}

export async function importarColaboradoresCsv(arquivo: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const response = await apiClient.post<ImportResult>('/colaboradores/importar-csv/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
