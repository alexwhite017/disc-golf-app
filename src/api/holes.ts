import client from './client'
import type { Hole } from '../types'

export const createHole = (courseId: number, data: Omit<Hole, 'id' | 'course_id'>) =>
  client.post<{ data: Hole }>(`/courses/${courseId}/holes`, data).then((r) => r.data.data)

export const updateHole = (courseId: number, holeId: number, data: Partial<Omit<Hole, 'id' | 'course_id'>>) =>
  client.patch<{ data: Hole }>(`/courses/${courseId}/holes/${holeId}`, data).then((r) => r.data.data)

export const deleteHole = (courseId: number, holeId: number) =>
  client.delete(`/courses/${courseId}/holes/${holeId}`)
