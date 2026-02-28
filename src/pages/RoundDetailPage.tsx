import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRound, upsertScore, deleteScore } from '../api/rounds'
import { getCourse } from '../api/courses'
import type { Hole, Score } from '../types'

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

function HoleRow({
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

  // Update running totals optimistically as user types
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
    <tr className="border-t border-slate-700/50">
      <td className="px-4 py-3 text-white font-medium">{hole.number}</td>
      <td className="px-4 py-3 text-slate-300">{hole.par}</td>
      {hole.distance_feet != null && (
        <td className="px-4 py-3 text-slate-400">{hole.distance_feet} ft</td>
      )}
      <td className="px-4 py-2">
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="—"
          className="w-16 rounded-md bg-slate-700 border border-slate-600 px-2 py-1.5 text-center text-white focus:border-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>
      <td className="px-4 py-3 text-right">
        {status === 'saving' && <span className="text-xs text-slate-500">saving…</span>}
        {status === 'saved' && <span className="text-xs text-green-500">saved</span>}
        {status === 'idle' && hasScore && (
          <span className={`text-sm font-medium ${vsParColor(strokes, hole.par)}`}>
            {vsParLabel(strokes, hole.par)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {score && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
            title="Clear score"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  )
}

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>()
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

  const [localScores, setLocalScores] = useState<Record<number, number>>({})

  useEffect(() => {
    if (round?.scores) {
      const initial: Record<number, number> = {}
      round.scores.forEach((s) => { initial[s.hole_id] = s.strokes })
      setLocalScores(initial)
    }
  }, [round?.scores])

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

  if (roundError || !round || !course) {
    return <div className="py-16 text-center text-red-400">Failed to load round.</div>
  }

  const holes = [...course.holes].sort((a, b) => a.number - b.number)
  const hasDistances = holes.some((h) => h.distance_feet != null)

  const scoreMap = new Map(round.scores.map((s) => [s.hole_id, s]))

  const totalStrokes = Object.values(localScores).reduce((sum, s) => sum + s, 0)
  const scoredHoles = holes.filter((h) => localScores[h.id] != null)
  const totalPar = scoredHoles.reduce((sum, h) => sum + h.par, 0)
  const totalVsPar = scoredHoles.length > 0 ? totalStrokes - totalPar : null

  function totalVsParLabel() {
    if (totalVsPar === null) return '—'
    if (totalVsPar === 0) return 'E'
    return totalVsPar > 0 ? `+${totalVsPar}` : `${totalVsPar}`
  }

  function totalVsParColor() {
    if (totalVsPar === null) return 'text-slate-400'
    if (totalVsPar < 0) return 'text-green-400'
    if (totalVsPar > 0) return 'text-red-400'
    return 'text-slate-300'
  }

  return (
    <div>
      <Link to="/rounds" className="text-sm text-slate-400 hover:text-white mb-6 inline-block">
        ← Back to rounds
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">{course.name}</h1>
        <p className="text-slate-400 text-sm">{round.played_at}</p>
        {round.notes && <p className="text-slate-400 text-sm mt-1">{round.notes}</p>}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium w-14">Hole</th>
              <th className="px-4 py-3 font-medium w-14">Par</th>
              {hasDistances && <th className="px-4 py-3 font-medium">Dist</th>}
              <th className="px-4 py-3 font-medium">Strokes</th>
              <th className="px-4 py-3 font-medium text-right">+/-</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {holes.map((hole) => (
              <HoleRow
                key={hole.id}
                hole={hole}
                score={scoreMap.get(hole.id) ?? null}
                roundId={round.id}
                onSaved={handleSaved}
                onCleared={handleCleared}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-800 border-t border-slate-700">
              <td className="px-4 py-3 text-slate-400 font-medium" colSpan={hasDistances ? 3 : 2}>
                Total ({scoredHoles.length}/{holes.length} holes)
              </td>
              <td className="px-4 py-3 text-white font-semibold">
                {totalStrokes > 0 ? totalStrokes : '—'}
              </td>
              <td className={`px-4 py-3 text-right font-semibold ${totalVsParColor()}`}>
                {totalVsParLabel()}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
