import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLeaderboard, getCourseLeaderboard } from '../api/stats'
import { getCourses } from '../api/courses'
import type { LeaderboardEntry } from '../types'

function formatVsPar(value: number | string, decimals = 0): string {
  const rounded = parseFloat(Number(value).toFixed(decimals))
  if (rounded === 0) return 'E'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

function ScoreCell({ value, decimals = 0 }: { value: number | string; decimals?: number }) {
  const rounded = parseFloat(Number(value).toFixed(decimals))
  const color =
    rounded < 0 ? 'text-green-400' : rounded > 0 ? 'text-red-400' : 'text-slate-300'
  return <span className={color}>{formatVsPar(value, decimals)}</span>
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-16 text-center text-slate-400">No rounds played yet.</p>
  }

  return (
    <div className="rounded-lg border border-slate-700 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-slate-400 text-left">
            <th className="px-4 py-3 font-medium w-12">#</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium text-right">Rounds</th>
            <th className="px-4 py-3 font-medium text-right">Total vs Par</th>
            <th className="px-4 py-3 font-medium text-right">Avg / Round</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.user_id}
              className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}
            >
              <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
              <td className="px-4 py-3 text-white font-medium">{entry.name}</td>
              <td className="px-4 py-3 text-slate-300 text-right">{entry.rounds_played}</td>
              <td className="px-4 py-3 text-right">
                <ScoreCell value={entry.total_vs_par} />
              </td>
              <td className="px-4 py-3 text-right">
                <ScoreCell value={entry.avg_vs_par_per_round} decimals={1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LeaderboardPage() {
  const [courseId, setCourseId] = useState<number | null>(null)

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => getCourses({ per_page: 100 }),
  })

  const { data: globalData, isLoading: globalLoading, isError: globalError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    enabled: courseId === null,
  })

  const { data: courseData, isLoading: courseLoading, isError: courseError } = useQuery({
    queryKey: ['leaderboard', courseId],
    queryFn: () => getCourseLeaderboard(courseId!),
    enabled: courseId !== null,
  })

  const isLoading = courseId === null ? globalLoading : courseLoading
  const isError = courseId === null ? globalError : courseError
  const entries = courseId === null ? (globalData ?? []) : (courseData?.data ?? [])
  const title = courseId === null ? 'Overall' : (courseData?.course.name ?? 'Course')

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <select
          value={courseId ?? ''}
          onChange={(e) => setCourseId(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full sm:w-auto rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        >
          <option value="">Overall</option>
          {courses?.data.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {courseId !== null && courseData && (
        <p className="text-slate-400 text-sm mb-4">{title}</p>
      )}

      {isLoading && (
        <div className="py-16 text-center text-slate-400">Loading leaderboard…</div>
      )}

      {isError && (
        <div className="py-16 text-center text-red-400">Failed to load leaderboard.</div>
      )}

      {!isLoading && !isError && (
        <LeaderboardTable entries={entries} />
      )}
    </div>
  )
}
