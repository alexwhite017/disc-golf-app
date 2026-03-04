import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRound, upsertScore, deleteScore, addPlayer, removePlayer } from '../api/rounds'
import { searchUsers } from '../api/users'
import { getCourse } from '../api/courses'
import type { Hole, Score, User } from '../types'
import { useAuth } from '../context/AuthContext'
import ConfirmButton from '../components/ConfirmButton'

function vsParLabel(strokes: number, par: number): string {
  const diff = strokes - par
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

function vsParColor(strokes: number, par: number): string {
  const diff = strokes - par
  if (diff < 0) return 'text-green-400'
  if (diff > 0) return 'text-red-400'
  return 'text-slate-300'
}

function totalVsParLabel(vsPar: number | null): string {
  if (vsPar === null) return '—'
  if (vsPar === 0) return 'E'
  return vsPar > 0 ? `+${vsPar}` : `${vsPar}`
}

function totalVsParColor(vsPar: number | null): string {
  if (vsPar === null) return 'text-slate-400'
  if (vsPar < 0) return 'text-green-400'
  if (vsPar > 0) return 'text-red-400'
  return 'text-slate-300'
}

// Editable score cell for the current user
function MyScoreCell({
  hole,
  score,
  roundId,
  onSaved,
  onCleared,
}: {
  hole: Hole
  score: Score | null
  roundId: number
  onSaved: (holeId: number, strokes: number) => void
  onCleared: (holeId: number) => void
}) {
  const [value, setValue] = useState(score?.strokes?.toString() ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    setValue(score?.strokes?.toString() ?? '')
  }, [score?.strokes])

  const saveMutation = useMutation({
    mutationFn: (strokes: number) => upsertScore(roundId, { hole_id: hole.id, strokes }),
    onSuccess: (_, strokes) => {
      setStatus('saved')
      onSaved(hole.id, strokes)
      setTimeout(() => setStatus('idle'), 1500)
    },
    onError: () => setStatus('idle'),
  })

  const clearMutation = useMutation({
    mutationFn: () => deleteScore(roundId, score!.id),
    onSuccess: () => {
      setValue('')
      onCleared(hole.id)
    },
  })

  const handleBlur = () => {
    const parsed = parseInt(value, 10)
    if (!value || isNaN(parsed) || parsed < 1 || parsed > 99) return
    if (parsed === score?.strokes) return
    setStatus('saving')
    saveMutation.mutate(parsed)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    const parsed = parseInt(v, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
      onSaved(hole.id, parsed)
    }
  }

  const strokes = parseInt(value, 10)
  const hasScore = value !== '' && !isNaN(strokes)

  return (
    <>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={99}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="—"
            className="w-14 rounded-md bg-slate-700 border border-slate-600 px-2 py-1.5 text-center text-white focus:border-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {score && (
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="text-slate-600 hover:text-red-400 transition-colors"
              title="Clear score"
            >
              ✕
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right w-12">
        {status === 'saving' && <span className="text-xs text-slate-500">…</span>}
        {status === 'saved' && <span className="text-xs text-green-500">✓</span>}
        {status === 'idle' && hasScore && (
          <span className={`text-sm font-medium ${vsParColor(strokes, hole.par)}`}>
            {vsParLabel(strokes, hole.par)}
          </span>
        )}
      </td>
    </>
  )
}

// Read-only score cell for other players
function OtherScoreCell({ hole, score }: { hole: Hole; score: Score | null }) {
  return (
    <td className="px-3 py-3 text-center">
      {score ? (
        <span className={`text-sm font-medium ${vsParColor(score.strokes, hole.par)}`}>
          {score.strokes}
        </span>
      ) : (
        <span className="text-slate-600">—</span>
      )}
    </td>
  )
}

// Player management panel (creator only)
function PlayerManagementPanel({ roundId, players, creatorId }: {
  roundId: number
  players: User[]
  creatorId: number
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (v: string) => {
    setSearch(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 300)
  }

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  })

  const playerIds = new Set(players.map((p) => p.id))

  const addMutation = useMutation({
    mutationFn: (userId: number) => addPlayer(roundId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', String(roundId)] })
      setSearch('')
      setDebouncedSearch('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removePlayer(roundId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', String(roundId)] })
    },
  })

  const filteredResults = (searchResults ?? []).filter((u) => !playerIds.has(u.id))

  return (
    <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-5">
      <h2 className="text-base font-semibold text-white mb-4">Manage Players</h2>

      <div className="mb-4">
        <h3 className="text-sm text-slate-400 mb-2">Current players</h3>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">{player.name}</span>
                {player.id === creatorId && (
                  <span className="ml-2 text-xs text-slate-500">(creator)</span>
                )}
              </div>
              {player.id !== creatorId && (
                <ConfirmButton
                  onConfirm={() => removeMutation.mutate(player.id)}
                  className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                  label="Remove"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm text-slate-400 mb-2">Add a player</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
        />
        {debouncedSearch.length >= 2 && (
          <div className="mt-2 rounded-md border border-slate-700 bg-slate-800 overflow-hidden">
            {searching && (
              <div className="px-4 py-3 text-sm text-slate-400">Searching…</div>
            )}
            {!searching && filteredResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No users found.</div>
            )}
            {!searching && filteredResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-4 py-2 hover:bg-slate-700/50 transition-colors">
                <div>
                  <span className="text-sm text-white">{user.name}</span>
                </div>
                <button
                  onClick={() => addMutation.mutate(user.id)}
                  disabled={addMutation.isPending}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: round, isLoading: roundLoading, isError: roundError } = useQuery({
    queryKey: ['round', id],
    queryFn: () => getRound(Number(id)),
    enabled: !!id,
  })

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', round?.course_id],
    queryFn: () => getCourse(round!.course_id),
    enabled: !!round?.course_id,
  })

  // Only track current user's scores for optimistic totals
  const [localScores, setLocalScores] = useState<Record<number, number>>({})

  useEffect(() => {
    if (round?.scores && currentUser) {
      const initial: Record<number, number> = {}
      round.scores
        .filter((s) => s.user_id === currentUser.id)
        .forEach((s) => { initial[s.hole_id] = s.strokes })
      setLocalScores(initial)
    }
  }, [round?.scores, currentUser])

  const handleSaved = (holeId: number, strokes: number) => {
    setLocalScores((prev) => ({ ...prev, [holeId]: strokes }))
    queryClient.invalidateQueries({ queryKey: ['rounds'] })
  }

  const handleCleared = (holeId: number) => {
    setLocalScores((prev) => {
      const next = { ...prev }
      delete next[holeId]
      return next
    })
    queryClient.invalidateQueries({ queryKey: ['rounds'] })
    queryClient.invalidateQueries({ queryKey: ['round', id] })
  }

  if (roundLoading || courseLoading) {
    return <div className="py-16 text-center text-slate-400">Loading round…</div>
  }

  if (roundError || !round || !course || !currentUser) {
    return <div className="py-16 text-center text-red-400">Failed to load round.</div>
  }

  const holes = [...course.holes].sort((a, b) => a.number - b.number)
  const hasDistances = holes.some((h) => h.distance_feet != null)
  const isCreator = round.user_id === currentUser.id

  // All players: current user first, then others
  const players = round.players ?? []
  const otherPlayers = players.filter((p) => p.id !== currentUser.id)

  // Score maps: player_id → hole_id → Score
  const scoreByUserAndHole = new Map<number, Map<number, Score>>()
  for (const score of round.scores) {
    if (!scoreByUserAndHole.has(score.user_id)) {
      scoreByUserAndHole.set(score.user_id, new Map())
    }
    scoreByUserAndHole.get(score.user_id)!.set(score.hole_id, score)
  }

  const myScoreMap = scoreByUserAndHole.get(currentUser.id) ?? new Map<number, Score>()

  // Optimistic totals for current user
  const myStrokes = Object.values(localScores).reduce((sum, s) => sum + s, 0)
  const myScoredHoles = holes.filter((h) => localScores[h.id] != null)
  const myTotalPar = myScoredHoles.reduce((sum, h) => sum + h.par, 0)
  const myVsPar = myScoredHoles.length > 0 ? myStrokes - myTotalPar : null

  return (
    <div>
      <Link to="/rounds" className="text-sm text-slate-400 hover:text-white mb-6 inline-block">
        ← Back to rounds
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">{course.name}</h1>
        <p className="text-slate-400 text-sm">{round.played_at}</p>
        {round.notes && <p className="text-slate-400 text-sm mt-1">{round.notes}</p>}
        {players.length > 1 && (
          <p className="text-slate-500 text-xs mt-1">{players.length} players</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium w-14">Hole</th>
              <th className="px-4 py-3 font-medium w-14">Par</th>
              {hasDistances && <th className="px-4 py-3 font-medium">Dist</th>}
              {/* Current user column header */}
              <th className="px-3 py-3 font-medium text-green-400" colSpan={2}>
                {currentUser.name} (you)
              </th>
              {/* Other players column headers */}
              {otherPlayers.map((player) => (
                <th key={player.id} className="px-3 py-3 font-medium text-center">
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holes.map((hole) => (
              <tr key={hole.id} className="border-t border-slate-700/50">
                <td className="px-4 py-3 text-white font-medium">{hole.number}</td>
                <td className="px-4 py-3 text-slate-300">{hole.par}</td>
                {hasDistances && (
                  <td className="px-4 py-3 text-slate-400">
                    {hole.distance_feet != null ? `${hole.distance_feet} ft` : '—'}
                  </td>
                )}
                <MyScoreCell
                  hole={hole}
                  score={myScoreMap.get(hole.id) ?? null}
                  roundId={round.id}
                  onSaved={handleSaved}
                  onCleared={handleCleared}
                />
                {otherPlayers.map((player) => {
                  const playerScoreMap = scoreByUserAndHole.get(player.id)
                  const playerScore = playerScoreMap?.get(hole.id) ?? null
                  return (
                    <OtherScoreCell key={player.id} hole={hole} score={playerScore} />
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-800 border-t border-slate-700">
              <td className="px-4 py-3 text-slate-400 font-medium" colSpan={hasDistances ? 3 : 2}>
                Total ({myScoredHoles.length}/{holes.length})
              </td>
              {/* Current user totals */}
              <td className="px-3 py-3 text-white font-semibold">
                {myStrokes > 0 ? myStrokes : '—'}
              </td>
              <td className={`px-3 py-3 text-right font-semibold ${totalVsParColor(myVsPar)}`}>
                {totalVsParLabel(myVsPar)}
              </td>
              {/* Other players totals */}
              {otherPlayers.map((player) => {
                const totals = round.player_totals?.[String(player.id)]
                return (
                  <td key={player.id} className={`px-3 py-3 text-center font-semibold ${totalVsParColor(totals?.score_vs_par ?? null)}`}>
                    {totals?.total_score != null ? (
                      <span title={`${totals.total_score} strokes`}>
                        {totalVsParLabel(totals.score_vs_par ?? null)}
                      </span>
                    ) : '—'}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {isCreator && (
        <PlayerManagementPanel
          roundId={round.id}
          players={players}
          creatorId={round.user_id}
        />
      )}
    </div>
  )
}
