import client from './client'
import type { LeaderboardEntry, Stats } from '../types'

export const getStats = () =>
  client.get<Stats>('/me/stats').then((r) => r.data)

export const getLeaderboard = () =>
  client.get<{ data: LeaderboardEntry[] }>('/leaderboard').then((r) => r.data.data)

export const getCourseLeaderboard = (courseId: number) =>
  client
    .get<{ course: { id: number; name: string }; data: LeaderboardEntry[] }>(`/leaderboard/${courseId}`)
    .then((r) => r.data)
