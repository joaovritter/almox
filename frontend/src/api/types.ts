export type Role = 'colaborador' | 'administrativo' | 'super_administrativo'

export interface User {
  id: number
  username: string
  nome: string
  role: Role
  is_staff: boolean
  is_superuser: boolean
}

export interface Colaborador {
  id: number
  nome: string
  setor: string
  matricula: string
}

export type TipoItem = 'Escritório' | 'Copa' | 'TI' | 'Geral' | 'Temporário'

export interface Item {
  id: number
  codigo_item: string
  nome_item: string
  quantidade_atual: number
  tipo: TipoItem
  requer_aprovacao: boolean
}

export type TipoMovimento = 'Saída' | 'Empréstimo' | 'Devolução'
export type StatusMovimento = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Concluído'

export interface Movimentacao {
  id: number
  item: number
  item_nome: string
  item_codigo: string
  colaborador: number
  colaborador_nome: string
  quantidade: number
  tipo_movimento: TipoMovimento
  status_ti: StatusMovimento
  data_hora: string
}

export interface SaidaAtiva {
  item_id: number
  item_nome: string
  saldo: number
  ultima_movimentacao: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ImportResult {
  sucessos: number
  falhas: string[]
}
