import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Globe, MapPin, Calendar, DollarSign, Trash2, Edit2, ArrowRight, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { tripsAPI } from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const INTERESTS = ['culture','nature','adventure','food','shopping','history','photography','nightlife','wellness','sports']
const STATUS_COLORS = {
  planning: 'bg-slate-600/30 text-slate-300 border-slate-500/30',
  confirmed: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  ongoing: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

function TripFormModal({ trip, onClose, onSave }) {
  const [form, setForm] = useState(trip || {
    title: '', startDate: '', endDate: '', budget: { total: '', currency: 'USD' },
    destinations: [{ name: '', country: '' }], interests: [], travelStyle: 'comfort', notes: ''
  })
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (d) => trip ? tripsAPI.update(trip._id, d) : tripsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(['trips']); toast.success(trip ? 'Trip updated!' : 'Trip created!'); onClose() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to save trip')
  })

  const toggleInterest = (i) => setForm(f => ({
    ...f, interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i]
  }))

  const submit = (e) => {
    e.preventDefault()
    mutation.mutate({ ...form, budget: { ...form.budget, total: Number(form.budget.total) } })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-5">{trip ? 'Edit Trip' : 'New Trip'}</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Trip Title</label>
            <input className="input" placeholder="e.g. Paris Summer Adventure" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate?.split('T')[0] || ''}
                onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate?.split('T')[0] || ''}
                onChange={e => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Budget ($)</label>
              <input type="number" className="input" placeholder="2500" value={form.budget.total}
                onChange={e => setForm({ ...form, budget: { ...form.budget, total: e.target.value } })} required />
            </div>
            <div>
              <label className="label">Travel Style</label>
              <select className="input" value={form.travelStyle} onChange={e => setForm({ ...form, travelStyle: e.target.value })}>
                <option value="budget">Budget</option>
                <option value="comfort">Comfort</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Primary Destination</label>
            <input className="input" placeholder="e.g. Paris, France" value={form.destinations[0]?.name || ''}
              onChange={e => setForm({ ...form, destinations: [{ name: e.target.value }] })} />
          </div>
          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERESTS.map(i => (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-all', form.interests.includes(i)
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500')}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Any notes for this trip..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : trip ? 'Save Changes' : 'Create Trip'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function TripsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editTrip, setEditTrip] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: () => tripsAPI.getAll({ status: statusFilter || undefined, limit: 50 }),
  })

  const deleteMutation = useMutation({
    mutationFn: tripsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['trips']); toast.success('Trip deleted') },
    onError: () => toast.error('Failed to delete trip')
  })

  const trips = (data?.data?.trips || []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.destinations?.[0]?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id) => {
    if (confirm('Delete this trip and all its data?')) deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">Plan, manage, and explore your travel adventures</p>
        </div>
        <button onClick={() => { setEditTrip(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> New Trip
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search trips or destinations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['planning','confirmed','ongoing','completed','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20 card">
          <Globe className="w-14 h-14 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">No trips found</h3>
          <p className="text-slate-500 mb-6">{search ? 'Try different search terms' : "Start planning your next adventure!"}</p>
          {!search && <button onClick={() => setShowModal(true)} className="btn-primary mx-auto"><Plus className="w-4 h-4 mr-2 inline" />Create First Trip</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {trips.map((trip, i) => (
              <motion.div key={trip._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                className="card-hover group overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-t-2xl" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate">{trip.title}</h3>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-400 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{trip.destinations?.[0]?.name || 'No destination'}</span>
                      </div>
                    </div>
                    <span className={clsx('badge ml-2 flex-shrink-0', STATUS_COLORS[trip.status])}>{trip.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mb-1" />
                      <p className="text-xs font-medium text-slate-200">{trip.startDate ? format(new Date(trip.startDate), 'MMM d') : '—'}</p>
                      <p className="text-xs text-slate-500">{trip.duration || 0} days</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 mb-1" />
                      <p className="text-xs font-medium text-slate-200">${trip.budget?.total?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{trip.travelStyle}</p>
                    </div>
                  </div>

                  {trip.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {trip.interests.slice(0, 3).map(i => (
                        <span key={i} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600/50">{i}</span>
                      ))}
                      {trip.interests.length > 3 && <span className="text-xs text-slate-500">+{trip.interests.length - 3}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link to={`/trips/${trip._id}`} className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 text-sm">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => { setEditTrip(trip); setShowModal(true) }}
                      className="btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(trip._id)} disabled={deleteMutation.isPending}
                      className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <TripFormModal trip={editTrip} onClose={() => { setShowModal(false); setEditTrip(null) }} />
      )}
    </div>
  )
}
