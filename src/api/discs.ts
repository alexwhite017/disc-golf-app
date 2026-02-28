import client from './client'
import type { Disc, PaginatedResponse } from '../types'

export interface DiscFilters {
  is_in_bag?: boolean
  type?: Disc['type']
  page?: number
  per_page?: number
}

export const getDiscs = (filters?: DiscFilters) =>
  client.get<PaginatedResponse<Disc>>('/discs', { params: filters }).then((r) => r.data)

export const createDisc = (data: Omit<Disc, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
  client.post<{ data: Disc }>('/discs', data).then((r) => r.data.data)

export const updateDisc = (id: number, data: Partial<Omit<Disc, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
  client.patch<{ data: Disc }>(`/discs/${id}`, data).then((r) => r.data.data)

export const deleteDisc = (id: number) =>
  client.delete(`/discs/${id}`)
