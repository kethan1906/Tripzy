import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Globe, Plane, Bell, MapPin, ArrowRight, Plus,
  AlertCircle, Wallet, Users, Navigation, Zap
} from 'lucide-react'
import { tripsAPI, alertsAPI, crowdAPI, expensesAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format, isAfter } from 'date-fns'
import CrowdBadge from '../components/common/CrowdBadge'
import clsx from 'clsx'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: tripsData } = useQuery({ queryKey: ['trips'], queryFn: () => tripsAPI.getAll({ limit: 10, sort: 'startDate' }), retry: 1 })
  const { data: alertsData } = useQuery({ queryKey: ['alerts', 'unread'], queryFn: () => alertsAPI.getAll({ isRead: false, limit: 5 }), retry: 1 })
  const { data: allExpenses } = useQuery({ queryKey: ['expenses', 'all'], queryFn: () => expensesAPI.getAll('all'), retry: 1 })

  const trips = tripsData?.data?.trips || []
  const alerts = alertsData?.data?.alerts || []
  const unreadCount = alertsData?.data?.unreadCount || 0
  const totalSpent = allExpenses?.data?.totalSpent || 0

  const upcomingTrips = trips.filter(t => isAfter(new Date(t.startDate), new Date()))
  const activeTrip = trips.find(t => t.status === 'ongoing')
  const nextTrip = upcomingTrips[0]
  const daysUntilNextTrip = nextTrip ? Math.ceil((new Date(nextTrip.startDate) - new Date()) / 86400000) : null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Globe, color: 'sky', link: '/trips' },
    { label: 'Upcoming', value: upcomingTrips.length, icon: Plane, color: 'violet', link: '/trips' },
    { label: 'Total Spent', value: `$${(totalSpent || 0).toFixed(0)}`, icon: Wallet, color: 'emerald', link: '/expenses' },
    { label: 'Alerts', value: unreadCount, icon: Bell, color: unreadCount > 0 ? 'amber' : 'slate', link: '/alerts' },
  ]

  const colorMap = {
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    slate: 'bg-slate-600/20 text-slate-400 border-slate-600/20',
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            {greeting()}, {user?.name?.split(' ')[0] || 'Traveler'}! ✈️
          </h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/live-trip')} className="btn-secondary text-sm flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Live Trip</span>
          </button>
          <Link to="/trips" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Trip</span>
          </Link>
        </div>
      </div>

      {activeTrip && (
        <Link to={`/trips/${activeTrip._id}`} className="card p-4 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Active Now</div>
              <div className="font-bold text-white">{activeTrip.title}</div>
            </div>
          </div>
          <button onClick={(e) => { e.preventDefault(); navigate('/live-trip') }}
            className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 flex items-center gap-1.5">
            <Navigation className="w-4 h-4" /> Navigate
          </button>
        </Link>
      )}

      {!activeTrip && nextTrip && daysUntilNextTrip !== null && daysUntilNextTrip <= 30 && (
        <Link to={`/trips/${nextTrip._id}`} className="card p-4 border-sky-500/20 bg-sky-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="text-xs text-sky-400 font-semibold uppercase tracking-wide">Next Trip</div>
              <div className="font-bold text-white">{nextTrip.title}</div>
              <div className="text-xs text-slate-400">{format(new Date(nextTrip.startDate), 'MMM d, yyyy')}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-display font-bold text-sky-400">{daysUntilNextTrip}</div>
            <div className="text-xs text-slate-400">days away</div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card-hover p-5 group">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}><Icon className="w-4 h-4" /></div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-slate-400 text-sm mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Your Trips</h2>
            <Link to="/trips" className="text-sky-400 text-sm hover:text-sky-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {trips.length === 0 ? (
            <div className="card p-10 text-center">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No trips planned yet</p>
              <Link to="/trips" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Plan Your First Trip
              </Link>
            </div>
          ) : (
            trips.slice(0, 5).map(trip => (
              <Link key={trip._id} to={`/trips/${trip._id}`} className="card-hover p-4 flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{trip.title}</div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
                    {trip.destinations?.[0]?.name && ` · ${trip.destinations[0].name}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={trip.status} />
                  {trip.budget?.total && <div className="text-xs text-slate-500">${trip.budget.total.toLocaleString()}</div>}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'AI Itinerary', icon: '✨', link: '/itinerary' },
                { label: 'Book Travel', icon: '✈️', link: '/booking' },
                { label: 'Live Map', icon: '🗺️', link: '/map' },
                { label: 'Group Trip', icon: '👥', link: '/groups' },
              ].map(({ label, icon, link }) => (
                <Link key={label} to={link}
                  className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all text-center group">
                  <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Recent Alerts</h2>
              <Link to="/alerts" className="text-sky-400 text-sm hover:text-sky-300"><ArrowRight className="w-4 h-4" /></Link>
            </div>
            {alerts.length === 0 ? (
              <div className="card p-5 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert._id} className={clsx('card p-3.5 border-l-2',
                    alert.severity === 'critical' ? 'border-rose-500' :
                    alert.severity === 'danger' ? 'border-orange-500' :
                    alert.severity === 'warning' ? 'border-amber-500' : 'border-sky-500')}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className={clsx('w-4 h-4 flex-shrink-0 mt-0.5',
                        alert.severity === 'warning' ? 'text-amber-400' : 'text-sky-400')} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">{alert.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{alert.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" /> Quick Crowd Check
            </h3>
            <QuickCrowdCheck destination={nextTrip?.destinations?.[0]?.name || activeTrip?.destinations?.[0]?.name} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    planning: 'badge-info',
    confirmed: 'bg-violet-500/15 text-violet-400 border border-violet-500/20 badge',
    ongoing: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 badge',
    completed: 'bg-slate-600/30 text-slate-400 border border-slate-600/30 badge',
    cancelled: 'bg-rose-500/15 text-rose-400 border border-rose-500/20 badge',
  }
  return <span className={map[status] || 'badge-info text-xs capitalize'}>{status}</span>
}

function QuickCrowdCheck({ destination }) {
  const loc = destination || 'Your City'
  const [inputLoc, setInputLoc] = useState(loc)
  const [loading, setLoading] = useState(false)
  const [pred, setPred] = useState(null)

  const check = async (l) => {
    setLoading(true)
    try {
      const res = await crowdAPI.predict({ location: l, datetime: new Date().toISOString() })
      setPred(res.data.prediction)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { check(loc) }, [])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input text-sm py-2 flex-1"
          value={inputLoc}
          onChange={e => setInputLoc(e.target.value)}
          placeholder="Enter location..."
          onKeyDown={e => e.key === 'Enter' && check(inputLoc)}
        />
        <button onClick={() => check(inputLoc)} disabled={loading} className="btn-secondary text-xs py-2 px-3">
          {loading ? '...' : 'Check'}
        </button>
      </div>
      {pred ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">{inputLoc}</span>
            <CrowdBadge level={pred.level} score={pred.score} />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{pred.recommendation}</p>
        </div>
      ) : loading ? (
        <div className="text-xs text-slate-500">Checking crowd data...</div>
      ) : null}
      <Link to="/map" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
        View crowd map <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}