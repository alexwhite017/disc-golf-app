import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/stats'
import type { Stats } from '../types'

function formatAvg(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return 'E'
  const rounded = parseFloat(value.toFixed(1))
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

function avgColor(value: number | null): string {
  if (value === null) return 'text-slate-400'
  if (value < 0) return 'text-green-400'
  if (value > 0) return 'text-red-400'
  return 'text-slate-300'
}

function StatCard({ label, value, valueClass = 'text-white' }: {
  label: string
  value: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function ScoreDistribution({ dist, holesPlayed }: {
  dist: Stats['score_distribution']
  holesPlayed: number
}) {
  const categories = [
    { key: 'eagles_or_better', label: 'Eagle or better', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
    { key: 'birdies', label: 'Birdie', color: 'bg-green-400', textColor: 'text-green-400' },
    { key: 'pars', label: 'Par', color: 'bg-slate-400', textColor: 'text-slate-300' },
    { key: 'bogeys', label: 'Bogey', color: 'bg-orange-400', textColor: 'text-orange-400' },
    { key: 'double_bogeys_or_worse', label: 'Double bogey+', color: 'bg-red-500', textColor: 'text-red-400' },
  ] as const

  const total = holesPlayed || 1

  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <h2 className="text-sm font-medium text-slate-400 mb-4">Score Distribution</h2>

      {holesPlayed === 0 ? (
        <p className="text-slate-500 text-sm">No scores yet.</p>
      ) : (
        <div className="space-y-3">
          {categories.map(({ key, label, color, textColor }) => {
            const count = dist[key]
            const pct = Math.round((count / total) * 100)
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={textColor}>{label}</span>
                  <span className="text-slate-400">{count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BestRoundCard({ round }: { round: NonNullable<Stats['best_round']> }) {
  const diff = round.score_vs_par
  const label = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`
  const color = diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-slate-300'

  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <h2 className="text-sm font-medium text-slate-400 mb-3">Best Round</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{round.course}</p>
          <p className="text-sm text-slate-400">{round.played_at}</p>
          <p className="text-sm text-slate-400">{round.total_strokes} strokes</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${color}`}>{label}</p>
          <Link
            to={`/rounds/${round.id}`}
            className="text-xs text-green-400 hover:text-green-300 mt-1 inline-block"
          >
            View round →
          </Link>
        </div>
      </div>
    </div>
  )
}

function FavoriteCourseCard({ course }: { course: NonNullable<Stats['favorite_course']> }) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
      <h2 className="text-sm font-medium text-slate-400 mb-3">Favorite Course</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{course.name}</p>
          <p className="text-sm text-slate-400">{course.rounds_played} rounds played</p>
        </div>
        <Link
          to={`/courses/${course.id}`}
          className="text-xs text-green-400 hover:text-green-300"
        >
          View course →
        </Link>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  })

  if (isLoading) {
    return <div className="py-16 text-center text-slate-400">Loading stats…</div>
  }

  if (isError || !stats) {
    return <div className="py-16 text-center text-red-400">Failed to load stats.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Stats</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Rounds played" value={stats.rounds_played} />
        <StatCard label="Holes played" value={stats.holes_played} />
        <StatCard
          label="Avg vs par / round"
          value={formatAvg(stats.avg_score_vs_par)}
          valueClass={avgColor(stats.avg_score_vs_par)}
        />
        <StatCard label="Discs in bag" value={stats.discs_in_bag} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {stats.best_round ? (
          <BestRoundCard round={stats.best_round} />
        ) : (
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-2">Best Round</h2>
            <p className="text-slate-500 text-sm">No rounds yet.</p>
          </div>
        )}

        {stats.favorite_course ? (
          <FavoriteCourseCard course={stats.favorite_course} />
        ) : (
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-2">Favorite Course</h2>
            <p className="text-slate-500 text-sm">No rounds yet.</p>
          </div>
        )}
      </div>

      <ScoreDistribution dist={stats.score_distribution} holesPlayed={stats.holes_played} />
    </div>
  )
}
