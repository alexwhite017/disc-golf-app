import client from './client'
import type { SearchUser } from '../types'

export const searchUsers = (search: string): Promise<SearchUser[]> =>
  client.get<{ data: SearchUser[] }>('/users', { params: { search } }).then((r) => r.data.data)
