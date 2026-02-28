import { useState, useEffect, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDiscs, createDisc, updateDisc, deleteDisc } from '../api/discs'
import type { Disc, PaginatedResponse } from '../types'
import ConfirmButton from '../components/ConfirmButton'

const DISC_TYPES: { value: Disc['type']; label: string }[] = [
  { value: 'driver', label: 'Driver' },
  { value: 'fairway_driver', label: 'Fairway Driver' },
  { value: 'mid_range', label: 'Mid Range' },
  { value: 'putter', label: 'Putter' },
]

function typeLabel(type: Disc['type']): string {
  return DISC_TYPES.find((t) => t.value === type)?.label ?? type
}

function typeColor(type: Disc['type']): string {
  switch (type) {
    case 'driver': return 'bg-red-900/40 text-red-300 border-red-800'
    case 'fairway_driver': return 'bg-orange-900/40 text-orange-300 border-orange-800'
    case 'mid_range': return 'bg-blue-900/40 text-blue-300 border-blue-800'
    case 'putter': return 'bg-purple-900/40 text-purple-300 border-purple-800'
  }
}

type DiscFormData = {
  brand: string
  name: string
  type: Disc['type']
  weight_grams: string
  color: string
  notes: string
  is_in_bag: boolean
}

const emptyForm: DiscFormData = {
  brand: '',
  name: '',
  type: 'driver',
  weight_grams: '',
  color: '',
  notes: '',
  is_in_bag: true,
}

function DiscFormModal({ disc, onClose }: { disc: Disc | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = disc !== null

  const [form, setForm] = useState<DiscFormData>(
    disc
      ? {
          brand: disc.brand,
          name: disc.name,
          type: disc.type,
          weight_grams: disc.weight_grams ?? '',
          color: disc.color ?? '',
          notes: disc.notes ?? '',
          is_in_bag: disc.is_in_bag,
        }
      : emptyForm,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(
      disc
        ? {
            brand: disc.brand,
            name: disc.name,
            type: disc.type,
            weight_grams: disc.weight_grams ?? '',
            color: disc.color ?? '',
            notes: disc.notes ?? '',
            is_in_bag: disc.is_in_bag,
          }
        : emptyForm,
    )
  }, [disc])

  const set = (field: keyof DiscFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        brand: form.brand,
        name: form.name,
        type: form.type,
        weight_grams: form.weight_grams || null,
        color: form.color || null,
        notes: form.notes || null,
        is_in_bag: form.is_in_bag,
      }
      return isEdit ? updateDisc(disc.id, payload) : createDisc(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discs'] })
      onClose()
    },
    onError: () => setError('Failed to save disc.'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-8">
      <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 p-6 mx-4">
        <h2 className="text-lg font-semibold text-white mb-4">
          {isEdit ? 'Edit Disc' : 'Add Disc'}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={set('brand')}
                required
                placeholder="Innova"
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="Destroyer"
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Type</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:border-green-500 focus:outline-none"
            >
              {DISC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Weight (g)</label>
              <input
                type="number"
                value={form.weight_grams}
                onChange={set('weight_grams')}
                min={100}
                max={200}
                placeholder="175"
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={set('color')}
                placeholder="Blue"
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Great for headwinds…"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_in_bag}
              onChange={(e) => setForm((prev) => ({ ...prev, is_in_bag: e.target.checked }))}
              className="rounded accent-green-500"
            />
            <span className="text-sm text-slate-300">In bag</span>
          </label>

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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add disc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DiscCard({
  disc,
  onEdit,
  onDelete,
  onToggleBag,
}: {
  disc: Disc
  onEdit: (disc: Disc) => void
  onDelete: (id: number) => void
  onToggleBag: (disc: Disc) => void
}) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{disc.name}</p>
          <p className="text-sm text-slate-400 truncate">{disc.brand}</p>
        </div>
        <span className={`shrink-0 text-xs border rounded-full px-2 py-0.5 ${typeColor(disc.type)}`}>
          {typeLabel(disc.type)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
        {disc.weight_grams && <span>{disc.weight_grams}g</span>}
        {disc.color && <span>{disc.color}</span>}
      </div>

      {disc.notes && (
        <p className="text-xs text-slate-500 line-clamp-2">{disc.notes}</p>
      )}

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-700">
        <button
          onClick={() => onToggleBag(disc)}
          className={`text-xs px-2 py-1 rounded-md border transition-colors ${
            disc.is_in_bag
              ? 'bg-green-900/40 border-green-800 text-green-300 hover:bg-green-900/60'
              : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
          }`}
        >
          {disc.is_in_bag ? 'In bag' : 'Not in bag'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(disc)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Edit
          </button>
          <ConfirmButton
            onConfirm={() => onDelete(disc.id)}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}

export default function BagPage() {
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<Disc['type'] | ''>('')
  const [bagFilter, setBagFilter] = useState<'all' | 'in' | 'out'>('all')
  const [modalDisc, setModalDisc] = useState<Disc | null | undefined>(undefined)

  const filters = {
    per_page: 100,
    type: typeFilter || undefined,
    is_in_bag: bagFilter === 'in' ? true : bagFilter === 'out' ? false : undefined,
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['discs', filters],
    queryFn: () => getDiscs(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDisc,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discs'] }),
  })

  const toggleBagMutation = useMutation({
    mutationFn: (disc: Disc) => updateDisc(disc.id, { is_in_bag: !disc.is_in_bag }),
    onMutate: async (disc) => {
      await queryClient.cancelQueries({ queryKey: ['discs'] })
      const queryKey = ['discs', filters]
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: PaginatedResponse<Disc> | undefined) => {
        if (!old) return old
        return { ...old, data: old.data.map((d) => d.id === disc.id ? { ...d, is_in_bag: !d.is_in_bag } : d) }
      })
      return { previous, queryKey }
    },
    onError: (_err, _disc, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.queryKey, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['discs'] }),
  })

  const discs = data?.data ?? []
  // modalDisc === undefined means modal is closed; null means add mode; Disc means edit mode
  const modalOpen = modalDisc !== undefined

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Bag</h1>
        <button
          onClick={() => setModalDisc(null)}
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors"
        >
          + Add Disc
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as Disc['type'] | '')}
          className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        >
          <option value="">All types</option>
          {DISC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={bagFilter}
          onChange={(e) => setBagFilter(e.target.value as 'all' | 'in' | 'out')}
          className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
        >
          <option value="all">All discs</option>
          <option value="in">In bag</option>
          <option value="out">Not in bag</option>
        </select>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-slate-400">Loading discs…</div>
      )}

      {isError && (
        <div className="py-16 text-center text-red-400">Failed to load discs.</div>
      )}

      {!isLoading && !isError && discs.length === 0 && (
        <div className="py-16 text-center text-slate-400">No discs found.</div>
      )}

      {discs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discs.map((disc) => (
            <DiscCard
              key={disc.id}
              disc={disc}
              onEdit={setModalDisc}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggleBag={(disc) => toggleBagMutation.mutate(disc)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <DiscFormModal
          disc={modalDisc}
          onClose={() => setModalDisc(undefined)}
        />
      )}
    </div>
  )
}
