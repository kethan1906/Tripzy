import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Check, CheckCheck, Filter, CloudRain, Users, Plane, Map, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { alertsAPI } from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useState } from 'react'

const TYPE_CONFIG = {
  weather: { icon: CloudRain, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Weather' },
  crowd: { icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Crowd' },
  booking: { icon: Plane, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Booking' },
  itinerary: { icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Itinerary' },
  safety: { icon: Info, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Safety' },
  system: { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'System' },
}

const SEV_STYLE = {
  info: 'border-l-sky-400',
  warning: 'border-l-amber-400',
  danger: 'border-l-rose-400',
  critical: 'border-l-rose-500',
}

export default function AlertsPage() {
  const [filter, setFilter] = useState({ type: '', isRead: '' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts-page', filter],
    queryFn: () => alertsAPI.getAll({ type: filter.type || undefined, isRead: filter.isRead !== '' ? filter.isRead : undefined, limit: 50 }),
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: alertsAPI.markRead,
    onSuccess: () => qc.invalidateQueries(['alerts-page'])
  })

  const markAllMutation = useMutation({
    mutationFn: alertsAPI.markAllRead,
    onSuccess: () => { qc.invalidateQueries(['alerts-page']); qc.invalidateQueries(['alerts-count']); toast.success('All alerts marked as read') }
  })

  const alerts = data?.data?.alerts || []
  const unreadCount = data?.data?.unreadCount || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            Alerts {unreadCount > 0 && <span className="badge bg-rose-500/15 text-rose-400 border-rose-500/20 text-sm">{unreadCount} unread</span>}
          </h1>
          <p className="page-subtitle">Real-time weather, crowd, and travel notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className="btn-secondary flex items-center gap-2 self-start">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-36" value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})}>
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input w-36" value={filter.isRead} onChange={e => setFilter({...filter, isRead: e.target.value})}>
          <option value="">All Status</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="card p-16 text-center text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-slate-400 mb-1">All clear!</p>
          <p className="text-sm">No alerts to show. You're good to go ✓</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert, i) => {
            const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.system
            const Icon = cfg.icon
            return (
              <motion.div key={alert._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={clsx('card p-4 border-l-4 flex items-start gap-4 transition-all', SEV_STYLE[alert.severity], !alert.isRead && 'ring-1 ring-sky-500/10 bg-sky-500/3')}>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                  <Icon className={clsx('w-5 h-5', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={clsx('font-semibold text-sm', !alert.isRead ? 'text-white' : 'text-slate-300')}>{alert.title}</h3>
                        {!alert.isRead && <div className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className={clsx('badge text-xs', cfg.bg, cfg.color)}>{cfg.label}</span>
                      <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.action && (
                        <a href={alert.action.url} className="text-xs text-sky-400 hover:text-sky-300 font-medium">{alert.action.label}</a>
                      )}
                      {!alert.isRead && (
                        <button onClick={() => markReadMutation.mutate(alert._id)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
