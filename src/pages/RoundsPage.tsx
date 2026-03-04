import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRounds, createRound, updateRound, deleteRound } from '../api/rounds'
import { getCourses } from '../api/courses'
import type { Round } from '../types'
import ConfirmButton from '../components/ConfirmButton'
import { useAuth } from '../context/AuthContext'

function formatVsPar(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return 'E'
  return value > 0 ? `+${value}` : `${value}`
}

function vsParColor(value: number | null): string {
  if (value === null) return 'text-slate-400'
  if (value < 0) return 'text-green-400'
  if (value > 0) return 'text-red-400'
  return 'text-slate-300'
}

function RoundFormModal({ round, onClose }: { round?: Round; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!round

  const [courseId, setCourseId] = useState(round?.course_id?.toString() ?? '')
  const [playedAt, setPlayedAt] = useState(round?.played_at ?? new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(round?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => getCourses({ per_page: 100 }),
  })

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? updateRound(round.id, { course_id: Number(courseId), played_at: playedAt, notes: notes || undefined })
      : createRound({ course_id: Number(courseId), played_at: playedAt, notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      onClose()
    },
    onError: () => setError('Failed to save round.'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!courseId) return setError('Please select a course.')
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 p-6 mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">{isEdit ? 'Edit Round' : 'New Round'}</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none"
            >
              <option value="">Select a course…</option>
              {courses?.data.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Date played</label>
            <input
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              required
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none resize-none"
              placeholder="Any notes about this round…"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md bg-slate-800 border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-md bg-green-600 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoundRow({ round, currentUserId, onEdit, onDelete }: {
  round: Round
  currentUserId: number
  onEdit: (round: Round) => void
  onDelete: (id: number) => void
}) {
  const myTotals = round.player_totals?.[String(currentUserId)]
  const scoreVsPar = myTotals?.score_vs_par ?? null
  const totalScore = myTotals?.total_score ?? null
  const isCreator = round.user_id === currentUserId
  const playerCount = round.players?.length ?? 1

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 hover:border-green-600 hover:bg-slate-700/60 transition-colors">
      <Link to={`/rounds/${round.id}`} className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{round.course?.name ?? 'Unknown course'}</span>
          {playerCount > 1 && (
            <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
              {playerCount} players
            </span>
          )}
        </div>
        <span className="text-sm text-slate-400">{round.played_at}</span>
        {round.notes && <span className="text-xs text-slate-500 mt-0.5">{round.notes}</span>}
      </Link>
      <div className="flex items-center gap-6 ml-4">
        <div className="text-right">
          <div className={`text-lg font-semibold ${vsParColor(scoreVsPar)}`}>
            {formatVsPar(scoreVsPar)}
          </div>
          {totalScore !== null && (
            <div className="text-xs text-slate-500">{totalScore} strokes</div>
          )}
        </div>
        {isCreator && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => onEdit(round)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Edit
            </button>
            <ConfirmButton
              onConfirm={() => onDelete(round.id)}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function RoundsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [modalRound, setModalRound] = useState<Round | null | undefined>(undefined)
  const queryClient = useQueryClient()

  const filters = {
    page,
    from: fromDate || undefined,
    to: toDate || undefined,
    course_id: courseFilter ? Number(courseFilter) : undefined,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rounds', filters],
    queryFn: () => getRounds(filters),
    placeholderData: (prev) => prev,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => getCourses({ per_page: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRound,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rounds'] }),
  })

  const rounds = data?.data ?? []
  const meta = data?.meta
  const modalOpen = modalRound !== undefined

  const resetFilters = () => {
    setFromDate('')
    setToDate('')
    setCourseFilter('')
    setPage(1)
  }

  const hasFilters = fromDate || toDate || courseFilter

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Rounds</h1>
        <button
          onClick={() => setModalRound(null)}
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors"
        >
          + New Round
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="mb-1 block text-xs text-slate-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Course</label>
          <select
            value={courseFilter}
            onChange={(e) => { setCourseFilter(e.target.value); setPage(1) }}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
          >
            <option value="">All courses</option>
            {courses?.data.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-white transition-colors pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && !data && (
        <div className="py-16 text-center text-slate-400">Loading rounds…</div>
      )}

      {isError && (
        <div className="py-16 text-center text-red-400">Failed to load rounds.</div>
      )}

      {!isLoading && !isError && rounds.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          {hasFilters ? 'No rounds match your filters.' : 'No rounds yet. Play one!'}
        </div>
      )}

      {rounds.length > 0 && (
        <div className="flex flex-col gap-3">
          {rounds.map((round) => (
            <RoundRow
              key={round.id}
              round={round}
              currentUserId={user!.id}
              onEdit={setModalRound}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={meta.current_page === 1}
            className="rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={meta.current_page === meta.last_page}
            className="rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <RoundFormModal
          round={modalRound ?? undefined}
          onClose={() => setModalRound(undefined)}
        />
      )}
    </div>
  )
}
