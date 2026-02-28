import client from './client'
import type { PaginatedResponse, Round, Score } from '../types'

export interface RoundFilters {
  course_id?: number
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export const getRounds = (filters?: RoundFilters) =>
  client.get<PaginatedResponse<Round>>('/rounds', { params: filters }).then((r) => r.data)

export const getRound = (id: number) =>
  client.get<{ data: Round }>(`/rounds/${id}`).then((r) => r.data.data)

export const createRound = (data: { course_id: number; played_at: string; notes?: string }) =>
  client.post<{ data: Round }>('/rounds', data).then((r) => r.data.data)

export const updateRound = (id: number, data: Partial<{ course_id: number; played_at: string; notes: string }>) =>
  client.patch<{ data: Round }>(`/rounds/${id}`, data).then((r) => r.data.data)

export const deleteRound = (id: number) =>
  client.delete(`/rounds/${id}`)

export const upsertScore = (roundId: number, data: { hole_id: number; strokes: number }) =>
  client.post<{ data: Score }>(`/rounds/${roundId}/scores`, data).then((r) => r.data.data)

export const deleteScore = (roundId: number, scoreId: number) =>
  client.delete(`/rounds/${roundId}/scores/${scoreId}`)
