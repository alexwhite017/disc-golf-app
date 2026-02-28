import client from './client'
import type { AuthResponse, User } from '../types'

export const register = (data: {
  name: string
  email: string
  password: string
  password_confirmation: string
}) => client.post<AuthResponse>('/register', data).then((r) => r.data)

export const login = (data: { email: string; password: string }) =>
  client.post<AuthResponse>('/login', data).then((r) => r.data)

export const logout = () =>
  client.post('/logout').then((r) => r.data)

export const getUser = () =>
  client.get<User>('/user').then((r) => r.data)

export const updateProfile = (data: {
  name?: string
  email?: string
  current_password?: string
  password?: string
  password_confirmation?: string
}) => client.patch<User>('/user', data).then((r) => r.data)
