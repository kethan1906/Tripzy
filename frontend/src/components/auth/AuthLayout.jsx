import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-sky-500/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-sky-500/8 rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-sky-500/40">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <span className="font-display text-3xl font-bold text-white">Tripzy</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
            Your Unified<br />
            <span className="text-gradient">Travel Command Center</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Book transport, hotels & tours. Get AI crowd predictions, real-time weather alerts, and dynamic itineraries — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { emoji: '🤖', title: 'AI Crowd Prediction', desc: 'Know before you go' },
              { emoji: '🗺️', title: 'Smart Itineraries', desc: 'Auto-adapts to conditions' },
              { emoji: '⚡', title: 'Real-time Alerts', desc: 'Weather & safety updates' },
              { emoji: '💰', title: 'Expense Tracker', desc: 'Stay on budget' },
            ].map(f => (
              <div key={f.title} className="glass rounded-xl p-4">
                <div className="text-2xl mb-2">{f.emoji}</div>
                <div className="text-white font-semibold text-sm">{f.title}</div>
                <div className="text-slate-400 text-xs mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">Tripzy</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
