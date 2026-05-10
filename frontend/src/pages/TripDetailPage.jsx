import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, MapPin, Tag, ArrowLeft, Plane, Hotel, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { tripsAPI, bookingsAPI, itineraryAPI } from '../services/api'
import clsx from 'clsx'

export default function TripDetailPage() {
  const { id } = useParams()
  const { data: tripData, isLoading } = useQuery({ queryKey: ['trip', id], queryFn: () => tripsAPI.getOne(id) })
  const { data: bookingsData } = useQuery({ queryKey: ['bookings', id], queryFn: () => bookingsAPI.getAll({ tripId: id }) })
  const { data: statsData } = useQuery({ queryKey: ['trip-stats', id], queryFn: () => tripsAPI.getStats(id) })

  const trip = tripData?.data?.trip
  const bookings = bookingsData?.data?.bookings || []
  const stats = statsData?.data?.stats

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  if (!trip) return <div className="card p-10 text-center text-slate-400">Trip not found</div>

  const statusColor = { planning:'bg-slate-600/30 text-slate-300', confirmed:'badge-info', ongoing:'badge-low', completed:'bg-purple-500/15 text-purple-400' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/trips" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title mb-0">{trip.title}</h1>
            <span className={clsx('badge', statusColor[trip.status])}>{trip.status}</span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{trip.destinations?.[0]?.name} • {trip.duration} days</p>
        </div>
        <Link to="/itinerary" className="btn-primary flex items-center gap-2 text-sm py-2">
          <Zap className="w-4 h-4" /> Generate Itinerary
        </Link>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Start Date', value: trip.startDate ? format(new Date(trip.startDate), 'MMM d, yyyy') : '—', icon: Calendar, color: 'text-sky-400' },
          { label: 'Duration', value: `${trip.duration || 0} days`, icon: Calendar, color: 'text-purple-400' },
          { label: 'Budget', value: `$${trip.budget?.total?.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Spent', value: stats ? `$${stats.totalSpent?.toFixed(0)}` : '—', icon: DollarSign, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon className={`w-5 h-5 ${color}`} />
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Details */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">Trip Details</h3>
          {trip.description && <p className="text-slate-400 text-sm">{trip.description}</p>}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-sky-400" /><span className="text-slate-300">{trip.destinations?.map(d => d.name).join(', ') || 'No destinations'}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-sky-400" /><span className="text-slate-300">{trip.startDate ? format(new Date(trip.startDate),'MMM d') : '—'} – {trip.endDate ? format(new Date(trip.endDate),'MMM d, yyyy') : '—'}</span></div>
            <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-sky-400" /><span className="text-slate-300">${trip.budget?.total?.toLocaleString()} • {trip.travelStyle}</span></div>
          </div>
          {trip.interests?.length > 0 && (
            <div><p className="text-xs text-slate-400 mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">{trip.interests.map(i => <span key={i} className="badge badge-info text-xs capitalize">{i}</span>)}</div>
            </div>
          )}
          {trip.notes && <div className="bg-slate-700/30 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-300">{trip.notes}</p></div>}
        </div>

        {/* Bookings */}
        <div className="card p-5">
          <h3 className="section-title">Bookings ({bookings.length})</h3>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm mb-3">No bookings yet</p>
              <Link to="/bookings" className="text-sky-400 text-sm hover:underline">Book flights & hotels →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b._id} className="flex items-center gap-3 p-3 bg-slate-700/20 rounded-xl">
                  <span className="text-xl">{b.type === 'flight' ? '✈️' : b.type === 'hotel' ? '🏨' : '🎫'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 capitalize">{b.type.replace('_',' ')}</p>
                    <p className="text-xs text-slate-400">{b.bookingReference}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white text-sm">${b.pricing?.totalPrice?.toLocaleString()}</p>
                    <span className={clsx('text-xs', b.status === 'confirmed' ? 'text-emerald-400' : 'text-slate-400')}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
