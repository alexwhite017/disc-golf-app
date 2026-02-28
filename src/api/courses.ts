import client from './client'
import type { Course, PaginatedResponse } from '../types'

export interface CourseFilters {
  search?: string
  state?: string
  page?: number
  per_page?: number
}

export const getCourses = (filters?: CourseFilters) =>
  client.get<PaginatedResponse<Course>>('/courses', { params: filters }).then((r) => r.data)

export const getCourse = (id: number) =>
  client.get<{ data: Course }>(`/courses/${id}`).then((r) => r.data.data)

export const createCourse = (data: Partial<Course>) =>
  client.post<{ data: Course }>('/courses', data).then((r) => r.data.data)

export const updateCourse = (id: number, data: Partial<Course>) =>
  client.patch<{ data: Course }>(`/courses/${id}`, data).then((r) => r.data.data)

export const deleteCourse = (id: number) =>
  client.delete(`/courses/${id}`)
