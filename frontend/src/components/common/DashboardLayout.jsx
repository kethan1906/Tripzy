/**
 * Dashboard Layout - Sidebar + Main Content (Extended)
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Map, Plane, Calendar, Receipt, Bell, User,
  LogOut, Menu, X, Compass, Wallet, Users, Navigation, Wifi, WifiOff
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { alertsAPI } from '../../services/api'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips',      icon: Plane,           label: 'My Trips' },
  { to: '/booking',    icon: Plane,           label: 'Book Travel' },
  { to: '/itinerary',  icon: Calendar,        label: 'Itinerary' },
  { to: '/live-trip',  icon: Navigation,      label: 'Live Trip', accent: true },
  { to: '/map',        icon: Map,             label: 'Map & Routes' },
  { to: '/expenses',   icon: Wallet,          label: 'Expenses' },
  { to: '/groups',     icon: Users,           label: 'Group Travel' },
  { to: '/alerts',     icon: Bell,            label: 'Alerts', badge: true },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, unreadCount, setUnreadCount } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const navigate = useNavigate()

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertsAPI.getAll({ isRead: false, limit: 1 })
        setUnreadCount(res.data.unreadCount || 0)
      } catch {}
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [setUnreadCount])

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col h-full bg-slate-900 border-r border-slate-800/80',
      mobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/80">
        <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/30">
          <Compass className="w-5 h-5 text-white" />
        </div>
        {(sidebarOpen || mobile) && (
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight">Tripzy</span>
            <div className="text-[10px] text-slate-500 -mt-0.5 font-medium tracking-widest">SMART TRAVEL</div>
          </div>
        )}
      </div>

      {/* Offline Banner */}
      {!isOnline && (sidebarOpen || mobile) && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-400 font-medium">Offline Mode</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge, accent }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
              isActive
                ? accent
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobile) && (
              <>
                <span className="font-medium text-sm flex-1">{label}</span>
                {accent && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>}
                {badge && unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
            {!sidebarOpen && !mobile && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800/80 p-3 space-y-0.5">
        <NavLink to="/profile" className={({ isActive }) => clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full',
          isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {(sidebarOpen || mobile) && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          )}
        </NavLink>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 w-full">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(sidebarOpen || mobile) && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <div className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full"><SidebarContent mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex btn-ghost p-2">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex-1" />
          {!isOnline && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline
            </div>
          )}
          <NavLink to="/live-trip" className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-all">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live Trip
          </NavLink>
          <NavLink to="/alerts" className="relative btn-ghost p-2">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
          </NavLink>
          <NavLink to="/profile">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </NavLink>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
