import { apiClient } from './client'
import type { ImportResult, Item, Paginated, TipoItem } from './types'

export const TIPOS_ITEM: TipoItem[] = ['Escritório', 'Copa', 'TI', 'Geral', 'Temporário']

export interface ItemInput {
  codigo_item: string
  nome_item: string
  tipo: TipoItem
  requer_aprovacao: boolean
}

export interface ItemCreateInput extends ItemInput {
  quantidade_atual: number
}

export async function listarItens(params: { search?: string; tipo?: string } = {}): Promise<Item[]> {
  const response = await apiClient.get<Paginated<Item> | Item[]>('/itens/', {
    params: { search: params.search || undefined, tipo: params.tipo || undefined, page_size: 200 },
  })
  return Array.isArray(response.data) ? response.data : response.data.results
}

export async function criarItem(input: ItemCreateInput): Promise<Item> {
  const response = await apiClient.post<Item>('/itens/', input)
  return response.data
}

export async function atualizarItem(id: number, input: ItemInput): Promise<Item> {
  const response = await apiClient.patch<Item>(`/itens/${id}/`, input)
  return response.data
}

export async function ajustarEstoque(id: number, quantidade_atual: number): Promise<Item> {
  const response = await apiClient.post<Item>(`/itens/${id}/ajustar-estoque/`, { quantidade_atual })
  return response.data
}

export async function removerItem(id: number): Promise<void> {
  await apiClient.delete(`/itens/${id}/`)
}

export async function importarItensCsv(arquivo: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const response = await apiClient.post<ImportResult>('/itens/importar-csv/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
