import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourses, createCourse } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import type { Course } from '../types'

function CourseFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('USA')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createCourse({ name, description: description || null, city: city || null, state: state || null, country: country || 'USA' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); onClose() },
    onError: () => setError('Failed to create course.'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 p-6 mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">New Course</h2>
        {error && <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md bg-slate-800 border border-slate-700 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 rounded-md bg-green-600 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50">{mutation.isPending ? 'Saving…' : 'Create course'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const location = [course.city, course.state].filter(Boolean).join(', ') || course.country

  return (
    <Link
      to={`/courses/${course.id}`}
      className="rounded-lg bg-slate-800 border border-slate-700 p-4 flex flex-col gap-1 hover:border-green-600 hover:bg-slate-700/60 transition-colors"
    >
      <h2 className="font-semibold text-white">{course.name}</h2>
      <p className="text-sm text-green-400">{location}</p>
      {course.description && (
        <p className="text-sm text-slate-400 line-clamp-2 mt-1">{course.description}</p>
      )}
    </Link>
  )
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', { search, state: stateFilter, page }],
    queryFn: () => getCourses({
      search: search || undefined,
      state: stateFilter || undefined,
      page,
    }),
    placeholderData: (prev) => prev,
  })

  const courses = data?.data ?? []
  const meta = data?.meta

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStateChange = (value: string) => {
    setStateFilter(value)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <div className="flex items-center gap-3">
          {meta && <span className="text-sm text-slate-400">{meta.total} courses</span>}
          {user?.is_admin && (
            <button onClick={() => setShowCreate(true)} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors">
              + New Course
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name…"
          className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
        />
        <input
          type="text"
          value={stateFilter}
          onChange={(e) => handleStateChange(e.target.value)}
          placeholder="State"
          className="w-28 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
        />
      </div>

      {isLoading && !data && (
        <div className="py-16 text-center text-slate-400">Loading courses…</div>
      )}

      {isError && (
        <div className="py-16 text-center text-red-400">Failed to load courses.</div>
      )}

      {!isLoading && !isError && courses.length === 0 && (
        <div className="py-16 text-center text-slate-400">No courses found.</div>
      )}

      {courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
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
      {showCreate && <CourseFormModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
