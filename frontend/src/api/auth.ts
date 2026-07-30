import { apiClient, tokenStorage } from './client'
import type { User } from './types'

interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export async function login(username: string, password: string): Promise<User> {
  const response = await apiClient.post<LoginResponse>('/auth/token/', { username, password })
  tokenStorage.setTokens(response.data.access, response.data.refresh)
  return response.data.user
}

export function logout() {
  tokenStorage.clear()
}

export async function fetchMe(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me/')
  return response.data
}
