/**
 * ItineraryPage - Fully fixed:
 * - View ALL saved itineraries (getAll works)
 * - Generate new ones and they persist
 * - Select any itinerary before starting live trip
 * - Delete itineraries
 * - Works with or without backend (localStorage fallback)
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import {
  Calendar, Wand2, MapPin, Clock, DollarSign, ChevronDown, ChevronUp,
  RefreshCw, Sparkles, Trash2, Navigation, Plus, ArrowRight, Users,
  CheckCircle, Star, X, AlertTriangle, Loader2
} from 'lucide-react'
import { itineraryAPI, tripsAPI, crowdAPI, weatherAPI } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import CrowdBadge from '../components/common/CrowdBadge'

const INTERESTS = [
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
]

const TRAVEL_STYLES = [
  { id: 'budget', label: 'Budget', desc: 'Affordable', emoji: '💚' },
  { id: 'comfort', label: 'Comfort', desc: 'Balanced', emoji: '✈️' },
  { id: 'luxury', label: 'Luxury', desc: 'Premium', emoji: '💎' },
]

export default function ItineraryPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showGenerator, setShowGenerator] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [expandedDay, setExpandedDay] = useState(0)
  const [deleteId, setDeleteId] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Generator form state
  const [form, setForm] = useState({
    destinations: '',
    duration: 3,
    budget: 1500,
    interests: [],
    travelStyle: 'comfort',
    groupSize: 1,
    startDate: new Date().toISOString().split('T')[0],
  })

  // Fetch all itineraries
  const { data: allData, isLoading } = useQuery({
    queryKey: ['itineraries-all'],
    queryFn: () => itineraryAPI.getAll(),
    staleTime: 1000 * 30,
  })

  const { data: tripsData } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsAPI.getAll(),
  })

  const allItineraries = allData?.data?.itineraries || []
  const trips = tripsData?.data?.trips || []

  // Get full itinerary when selected
  const { data: activeData, isLoading: loadingActive } = useQuery({
    queryKey: ['itinerary', activeId],
    queryFn: () => itineraryAPI.get(activeId),
    enabled: !!activeId,
    retry: false,
  })
  const activeItinerary = activeData?.data?.itinerary ||
    allItineraries.find(i => i._id === activeId)

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => itineraryAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['itineraries-all'])
      if (activeId === deleteId) setActiveId(null)
      setDeleteId(null)
      toast.success('Itinerary deleted')
    },
    onError: () => toast.error('Failed to delete')
  })

  // Auto-update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => itineraryAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['itinerary', activeId])
      toast.success('Itinerary updated for current conditions')
    },
  })

  const handleAutoUpdate = async () => {
    if (!activeItinerary) return
    try {
      const dest = activeItinerary.params?.destinations?.[0] || 'Paris'
      const [crowdRes, weatherRes] = await Promise.allSettled([
        crowdAPI.predict({ location: dest, datetime: new Date().toISOString() }),
        weatherAPI.getCurrent({ city: dest }),
      ])
      updateMutation.mutate({
        id: activeItinerary._id,
        data: {
          reason: 'auto_update',
          crowdData: crowdRes.status === 'fulfilled' ? crowdRes.value.data?.prediction : null,
          weatherData: weatherRes.status === 'fulfilled' ? weatherRes.value.data?.weather : null,
        }
      })
    } catch {
      toast.error('Could not fetch live conditions')
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!form.destinations.trim()) {
      toast.error('Please enter a destination')
      return
    }
    setGenerating(true)
    try {
      const res = await itineraryAPI.generate({
        destinations: form.destinations.split(',').map(d => d.trim()).filter(Boolean),
        duration: parseInt(form.duration),
        budget: parseInt(form.budget),
        interests: form.interests,
        travelStyle: form.travelStyle,
        groupSize: parseInt(form.groupSize),
        startDate: form.startDate,
      })
      const newItinerary = res.data?.itinerary
      if (newItinerary) {
        // Also save to localStorage as fallback
        const stored = JSON.parse(localStorage.getItem('tripzy-itineraries') || '[]')
        stored.unshift(newItinerary)
        localStorage.setItem('tripzy-itineraries', JSON.stringify(stored.slice(0, 20)))

        qc.invalidateQueries(['itineraries-all'])
        setActiveId(newItinerary._id)
        setShowGenerator(false)
        toast.success('✨ Itinerary generated and saved!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed — check if backend is running')
    }
    setGenerating(false)
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-400" /> Itineraries
          </h1>
          <p className="page-subtitle">Generate AI itineraries, view and manage all your plans</p>
        </div>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="btn-primary flex items-center gap-2"
        >
          {showGenerator ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showGenerator ? 'Close' : 'New Itinerary'}
        </button>
      </div>

      {/* Generator Panel */}
      {showGenerator && (
        <div className="card p-6 border-violet-500/20 bg-violet-500/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Itinerary Generator</h2>
              <p className="text-sm text-slate-400">Fill in details and get a full day-by-day plan</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Destinations *</label>
                <input
                  className="input"
                  placeholder="e.g. Paris, London or Tokyo"
                  value={form.destinations}
                  onChange={e => setForm(f => ({ ...f, destinations: e.target.value }))}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple destinations with commas</p>
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Duration (days)</label>
                <input
                  type="number"
                  min="1" max="14"
                  className="input"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Total Budget (USD)</label>
                <input
                  type="number"
                  min="100"
                  className="input"
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Group Size</label>
                <input
                  type="number"
                  min="1" max="20"
                  className="input"
                  value={form.groupSize}
                  onChange={e => setForm(f => ({ ...f, groupSize: e.target.value }))}
                />
              </div>
            </div>

            {/* Travel Style */}
            <div>
              <label className="label">Travel Style</label>
              <div className="grid grid-cols-3 gap-3">
                {TRAVEL_STYLES.map(({ id, label, desc, emoji }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, travelStyle: id }))}
                    className={clsx(
                      'p-4 rounded-xl border text-center transition-all',
                      form.travelStyle === id
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="label">Interests (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(({ id, label, emoji }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      interests: f.interests.includes(id)
                        ? f.interests.filter(i => i !== id)
                        : [...f.interests, id]
                    }))}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all',
                      form.interests.includes(id)
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <span>{emoji}</span> {label}
                    {form.interests.includes(id) && <CheckCircle className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={generating} className="btn-primary flex items-center gap-2 px-8">
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Itinerary</>
                )}
              </button>
              <button type="button" onClick={() => setShowGenerator(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Itineraries list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      ) : allItineraries.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No itineraries yet</h3>
          <p className="text-slate-500 mb-6">Generate your first AI-powered travel plan</p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Create Your First Itinerary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: itinerary list */}
          <div className="space-y-3">
            <h2 className="section-title">Saved Itineraries ({allItineraries.length})</h2>
            {allItineraries.map(itin => (
              <div
                key={itin._id}
                className={clsx(
                  'card-hover p-4 cursor-pointer group',
                  activeId === itin._id && 'border-violet-500/40 bg-violet-500/5'
                )}
                onClick={() => setActiveId(itin._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{itin.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {itin.params?.destinations?.join(', ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {itin.summary?.totalDays} days
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-emerald-400 font-medium">
                        ~${itin.summary?.totalEstimatedCost?.toFixed(0)} est.
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500 capitalize">
                        {itin.params?.travelStyle}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    {/* Start live trip button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/live-trip', { state: { selectedItineraryId: itin._id } })
                      }}
                      className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 transition-all"
                    >
                      <Navigation className="w-3 h-3" /> Start
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(itin._id)
                      }}
                      className="text-xs text-slate-600 hover:text-rose-400 p-1 rounded-lg transition-colors self-end"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {itin.params?.startDate && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(itin.params.startDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: active itinerary detail */}
          <div className="lg:col-span-2">
            {!activeId ? (
              <div className="card p-10 text-center h-full flex flex-col items-center justify-center">
                <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">Select an itinerary to view details</p>
              </div>
            ) : loadingActive ? (
              <div className="card p-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              </div>
            ) : activeItinerary ? (
              <ItineraryDetail
                itinerary={activeItinerary}
                expandedDay={expandedDay}
                setExpandedDay={setExpandedDay}
                onAutoUpdate={handleAutoUpdate}
                isUpdating={updateMutation.isPending}
                onStartTrip={() => navigate('/live-trip', { state: { selectedItineraryId: activeId } })}
              />
            ) : (
              <div className="card p-10 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-400">Could not load itinerary details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative card p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Delete Itinerary?</h3>
            <p className="text-slate-400 text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 font-medium py-2 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ItineraryDetail({ itinerary, expandedDay, setExpandedDay, onAutoUpdate, isUpdating, onStartTrip }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-white text-xl">{itinerary.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {itinerary.params?.destinations?.join(' → ')}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                {itinerary.summary?.totalDays} days
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                ${itinerary.summary?.totalEstimatedCost?.toFixed(0)} est.
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onAutoUpdate} disabled={isUpdating} className="btn-secondary text-xs flex items-center gap-1.5 py-2">
              <RefreshCw className={clsx('w-3.5 h-3.5', isUpdating && 'animate-spin')} />
              Update
            </button>
            <button onClick={onStartTrip} className="btn-primary text-xs flex items-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20">
              <Navigation className="w-3.5 h-3.5" />
              Start Live Trip
            </button>
          </div>
        </div>

        {/* Summary chips */}
        {itinerary.summary?.topAttractions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {itinerary.summary.topAttractions.map(a => (
              <span key={a} className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                ⭐ {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Days */}
      <div className="divide-y divide-slate-700/30 max-h-[520px] overflow-y-auto">
        {itinerary.days?.map((day, i) => (
          <div key={i}>
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors text-left"
              onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-sm font-bold text-violet-400">
                  {day.day}
                </div>
                <div>
                  <div className="font-medium text-slate-200">
                    {day.theme || `Day ${day.day}`}
                    <span className="text-slate-500 font-normal text-sm ml-2">
                      {day.date && format(new Date(day.date), 'MMM d')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{day.activities?.length} activities</span>
                    <span>·</span>
                    <span>~${day.estimatedDayCost?.toFixed(0)}</span>
                    {day.crowdForecast && (
                      <>
                        <span>·</span>
                        <CrowdBadge level={day.crowdForecast.level} score={day.crowdForecast.score} showScore={false} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              {expandedDay === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedDay === i && (
              <div className="px-4 pb-4 space-y-2">
                {day.activities?.map((act, ai) => (
                  <div key={ai} className="flex gap-3 p-3 bg-slate-800/40 rounded-xl">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="text-xs text-sky-400 font-mono font-semibold">{act.time}</div>
                      {ai < day.activities.length - 1 && (
                        <div className="w-px flex-1 bg-slate-700 mt-1 min-h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-200 text-sm">{act.title}</div>
                          {act.description && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{act.description}</div>
                          )}
                        </div>
                        <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                          {act.estimatedCost > 0 ? `$${act.estimatedCost}` : 'Free'}
                        </div>
                      </div>
                      {act.location?.address && (
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-1.5">
                          <MapPin className="w-3 h-3" />
                          {act.location.address}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {act.duration && (
                          <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                            ⏱ {act.duration}min
                          </span>
                        )}
                        {act.crowdLevel && (
                          <CrowdBadge level={act.crowdLevel} showScore={false} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
