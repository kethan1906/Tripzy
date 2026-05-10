/**
 * Shared UI Components
 */
import { Users, CloudSun, Cloud, CloudRain, CloudSnow, Zap, Wind } from 'lucide-react'
import clsx from 'clsx'

// ─── Crowd Badge ──────────────────────────────────────────────────────────────
export default function CrowdBadge({ level, score, showScore = true }) {
  const config = {
    low: { className: 'badge-low', label: 'Low Crowd', dot: 'bg-emerald-400' },
    medium: { className: 'badge-medium', label: 'Medium', dot: 'bg-amber-400' },
    high: { className: 'badge-high', label: 'High Crowd', dot: 'bg-rose-400' },
  }
  const { className, label, dot } = config[level] || config.medium

  return (
    <span className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1.5 inline-block`} />
      {label}
      {showScore && score !== undefined && <span className="ml-1 opacity-70">({Math.round(score)})</span>}
    </span>
  )
}

// ─── Weather Icon ─────────────────────────────────────────────────────────────
export function WeatherIcon({ condition, className = 'w-5 h-5' }) {
  const map = {
    clear: <CloudSun className={clsx(className, 'text-yellow-400')} />,
    clouds: <Cloud className={clsx(className, 'text-slate-400')} />,
    rain: <CloudRain className={clsx(className, 'text-sky-400')} />,
    drizzle: <CloudRain className={clsx(className, 'text-sky-300')} />,
    snow: <CloudSnow className={clsx(className, 'text-blue-200')} />,
    thunderstorm: <Zap className={clsx(className, 'text-yellow-500')} />,
    mist: <Wind className={clsx(className, 'text-slate-400')} />,
    fog: <Wind className={clsx(className, 'text-slate-400')} />,
  }
  return map[condition?.toLowerCase()] || <CloudSun className={clsx(className, 'text-slate-400')} />
}

// ─── Weather Widget ───────────────────────────────────────────────────────────
export function WeatherWidget({ city }) {
  return (
    <div className="text-xs text-slate-500 italic">
      Weather data available when OpenWeather API key is configured
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={clsx(
      'border-2 border-slate-700 border-t-sky-500 rounded-full animate-spin',
      sizes[size], className
    )} />
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card p-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-600 mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'sky', className = '' }) {
  const percent = Math.min(100, (value / max) * 100)
  const colors = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
  }
  return (
    <div className={clsx('h-2 bg-slate-700 rounded-full overflow-hidden', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative card w-full animate-slide-up my-4', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
