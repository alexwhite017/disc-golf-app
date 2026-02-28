import { useState, type FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourse, updateCourse, deleteCourse } from '../api/courses'
import { createHole, updateHole, deleteHole } from '../api/holes'
import { useAuth } from '../context/AuthContext'
import type { Hole } from '../types'
import ConfirmButton from '../components/ConfirmButton'

function HoleFormModal({ courseId, hole, onClose }: { courseId: number; hole?: Hole; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!hole
  const [number, setNumber] = useState(hole?.number?.toString() ?? '')
  const [par, setPar] = useState(hole?.par?.toString() ?? '3')
  const [distance, setDistance] = useState(hole?.distance_feet?.toString() ?? '')
  const [notes, setNotes] = useState(hole?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? updateHole(courseId, hole.id, { number: Number(number), par: Number(par) as 3|4|5, distance_feet: distance ? Number(distance) : null, notes: notes || null })
      : createHole(courseId, { number: Number(number), par: Number(par) as 3|4|5, distance_feet: distance ? Number(distance) : null, notes: notes || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course', String(courseId)] }); onClose() },
    onError: () => setError('Failed to save hole.'),
  })

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); setError(null); mutation.mutate() }
  const inputClass = 'w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 p-6 mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">{isEdit ? 'Edit Hole' : 'Add Hole'}</h2>
        {error && <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Hole #</label>
              <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} min={1} max={36} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Par</label>
              <select value={par} onChange={(e) => setPar(e.target.value)} className={inputClass}>
                <option value="3">3</option><option value="4">4</option><option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Dist (ft)</label>
              <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} min={0} placeholder="—" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md bg-slate-800 border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-md bg-green-600 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50">{mutation.isPending ? 'Saving…' : isEdit ? 'Save' : 'Add hole'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditCourseModal({ courseId, initial, onClose }: { courseId: number; initial: { name: string; description: string | null; city: string | null; state: string | null; country: string }; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [state, setState] = useState(initial.state ?? '')
  const [country, setCountry] = useState(initial.country)
  const [error, setError] = useState<string | null>(null)
  const inputClass = 'w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none'

  const mutation = useMutation({
    mutationFn: () => updateCourse(courseId, { name, description: description || null, city: city || null, state: state || null, country }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course', String(courseId)] }); queryClient.invalidateQueries({ queryKey: ['courses'] }); onClose() },
    onError: () => setError('Failed to update course.'),
  })

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); setError(null); mutation.mutate() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 p-6 mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">Edit Course</h2>
        {error && <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm text-slate-400">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm text-slate-400">State</label><input type="text" value={state} onChange={(e) => setState(e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className="mb-1 block text-sm text-slate-400">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} /></div>
          <div><label className="mb-1 block text-sm text-slate-400">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md bg-slate-800 border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-md bg-green-600 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50">{mutation.isPending ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.is_admin ?? false
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [holeModal, setHoleModal] = useState<Hole | null | undefined>(undefined)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(Number(id)),
    enabled: !!id,
  })

  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteCourse(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); navigate('/courses') },
  })

  const deleteHoleMutation = useMutation({
    mutationFn: (holeId: number) => deleteHole(Number(id), holeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course', id] }),
  })

  if (isLoading) return <div className="py-16 text-center text-slate-400">Loading course…</div>
  if (isError || !course) return <div className="py-16 text-center text-red-400">Failed to load course.</div>

  const location = [course.city, course.state].filter(Boolean).join(', ') || course.country
  const holes = [...(course.holes ?? [])].sort((a, b) => a.number - b.number)
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0)
  const hasDistances = holes.some((h) => h.distance_feet != null)
  const hasNotes = holes.some((h) => h.notes)

  return (
    <div>
      <Link to="/courses" className="text-sm text-slate-400 hover:text-white mb-6 inline-block">← Back to courses</Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{course.name}</h1>
          <p className="text-green-400 mb-2">{location}</p>
          {course.description && <p className="text-slate-300 max-w-2xl">{course.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowEditCourse(true)} className="rounded-md bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-600 transition-colors">Edit</button>
            <ConfirmButton onConfirm={() => deleteCourseMutation.mutate()} label="Delete" className="rounded-md bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors" />
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Holes</h2>
        <div className="flex items-center gap-3">
          {holes.length > 0 && <span className="text-sm text-slate-400">{holes.length} holes · Par {totalPar}</span>}
          {isAdmin && <button onClick={() => setHoleModal(null)} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-green-500 transition-colors">+ Add Hole</button>}
        </div>
      </div>

      {holes.length === 0 ? (
        <p className="text-slate-400">No hole data available.</p>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium w-16">Hole</th>
                <th className="px-4 py-3 font-medium w-16">Par</th>
                {hasDistances && <th className="px-4 py-3 font-medium">Distance</th>}
                {hasNotes && <th className="px-4 py-3 font-medium">Notes</th>}
                {isAdmin && <th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {holes.map((hole, i) => (
                <tr key={hole.id} className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                  <td className="px-4 py-3 text-white font-medium">{hole.number}</td>
                  <td className="px-4 py-3 text-slate-300">{hole.par}</td>
                  {hasDistances && <td className="px-4 py-3 text-slate-300">{hole.distance_feet != null ? `${hole.distance_feet} ft` : '—'}</td>}
                  {hasNotes && <td className="px-4 py-3 text-slate-400">{hole.notes ?? '—'}</td>}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setHoleModal(hole)} className="text-xs text-slate-400 hover:text-white transition-colors">Edit</button>
                        <ConfirmButton onConfirm={() => deleteHoleMutation.mutate(hole.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors" />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 border-t border-slate-700">
                <td className="px-4 py-3 text-slate-400 font-medium">Total</td>
                <td className="px-4 py-3 text-white font-semibold">{totalPar}</td>
                {hasDistances && <td className="px-4 py-3 text-slate-300">{holes.reduce((sum, h) => sum + (h.distance_feet ?? 0), 0).toLocaleString()} ft</td>}
                {hasNotes && <td />}
                {isAdmin && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showEditCourse && <EditCourseModal courseId={course.id} initial={course} onClose={() => setShowEditCourse(false)} />}
      {holeModal !== undefined && <HoleFormModal courseId={course.id} hole={holeModal ?? undefined} onClose={() => setHoleModal(undefined)} />}
    </div>
  )
}
