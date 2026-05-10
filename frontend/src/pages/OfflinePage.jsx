/**
 * Offline Page - shown when app is offline and no cache available
 */
import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, Compass } from 'lucide-react'
import { offlineDB, STORES } from '../utils/offlineDB'

export default function OfflinePage() {
  const [cachedTrips, setCachedTrips] = useState([])

  useEffect(() => {
    offlineDB.getAll(STORES.TRIPS).then(setCachedTrips).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">You're Offline</h1>
        <p className="text-slate-400 mb-8">No internet connection detected. But don't worry — your saved trips are still available.</p>

        <button
          onClick={() => window.location.reload()}
          className="btn-primary flex items-center gap-2 mx-auto mb-8"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>

        {cachedTrips.length > 0 && (
          <div className="card p-5 text-left">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" /> Saved Offline Trips
            </h3>
            <div className="space-y-2">
              {cachedTrips.map(trip => (
                <div key={trip._id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-200 text-sm">{trip.title}</div>
                    <div className="text-xs text-slate-500">Cached {trip._cachedAt ? new Date(trip._cachedAt).toLocaleDateString() : ''}</div>
                  </div>
                  <span className="badge badge-info">Offline</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
