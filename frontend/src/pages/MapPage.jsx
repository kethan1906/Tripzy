/**
 * Smart Map Page - Uses Leaflet (free, no API key needed)
 */
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Navigation, Users, Search, Layers,
  Plane, Train, Bus, Car, Footprints, Play, RefreshCw, Info
} from 'lucide-react'
import { crowdAPI, weatherAPI, tripsAPI, itineraryAPI } from '../services/api'
import CrowdBadge from '../components/common/CrowdBadge'
import { Spinner } from '../components/common/CrowdBadge'
import { WeatherIcon } from '../components/common/CrowdBadge'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CROWD_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f43f5e' }

const CITIES = {
  Paris: { lat: 48.8566, lng: 2.3522 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  London: { lat: 51.5074, lng: -0.1278 },
  Rome: { lat: 41.9028, lng: 12.4964 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
}

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [city, setCity] = useState('Paris')
  const [searchInput, setSearchInput] = useState('Paris')
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [crowdPrediction, setCrowdPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [selectedTripId, setSelectedTripId] = useState('')
  const [showItineraryRoute, setShowItineraryRoute] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const { data: tripsData } = useQuery({ queryKey: ['trips'], queryFn: () => tripsAPI.getAll() })
  const trips = tripsData?.data?.trips || []

  const { data: hotspotsData, isLoading: hotspotsLoading } = useQuery({
    queryKey: ['hotspots', city],
    queryFn: () => crowdAPI.getHotspots({ city }),
    staleTime: 1000 * 60 * 5,
  })

  const { data: itinData } = useQuery({
    queryKey: ['itinerary-map', selectedTripId],
    queryFn: () => itineraryAPI.get(selectedTripId),
    enabled: !!selectedTripId,
    retry: false,
  })

  const base = CITIES[city] || { lat: 48.8566, lng: 2.3522 }
  const hotspots = (hotspotsData?.data?.hotspots || []).map((h, i) => ({
    ...h,
    lat: base.lat + (h.lat || 0) + (i * 0.003 - 0.006),
    lng: base.lng + (h.lng || 0) + (i * 0.004 - 0.008),
  }))

  const itinerary = itinData?.data?.itinerary
  const itineraryStops = itinerary?.days?.flatMap(day =>
    day.activities?.filter(a => a.location?.name).map(a => ({
      name: a.location.name,
      day: day.day,
      time: a.time,
      category: a.category,
      crowdLevel: a.crowdLevel,
    })) || []
  ) || []

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Add Leaflet JS
    if (window.L) {
      setLeafletLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return
    const L = window.L

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const map = L.map(mapRef.current).setView([base.lat, base.lng], 13)
    mapInstanceRef.current = map

    // OpenStreetMap tiles - completely free!
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add crowd hotspot markers
    markersRef.current = []
    hotspots.forEach(h => {
      const color = CROWD_COLORS[h.crowdLevel] || '#94a3b8'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const marker = L.marker([h.lat, h.lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:140px">
          <div style="font-weight:600;margin-bottom:4px;color:#1e293b">${h.name}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;background:${color}22;color:${color};border:1px solid ${color}44">
            ${h.crowdLevel?.toUpperCase()} CROWD · ${Math.round(h.crowdScore || 50)}
          </div>
        </div>
      `)
      markersRef.current.push(marker)
    })

    // Add itinerary route if enabled
    if (showItineraryRoute && itineraryStops.length > 1) {
      const coords = itineraryStops.slice(0, 8).map((_, i) => [
        base.lat + (i * 0.005 - 0.01),
        base.lng + (i * 0.006 - 0.012),
      ])
      L.polyline(coords, { color: '#8b5cf6', weight: 3, dashArray: '8,4', opacity: 0.8 }).addTo(map)
      coords.forEach((coord, i) => {
        const stopIcon = L.divIcon({
          className: '',
          html: `<div style="width:22px;height:22px;background:#8b5cf6;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${itineraryStops[i]?.day || i+1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })
        L.marker(coord, { icon: stopIcon }).addTo(map)
          .bindPopup(`<b>Day ${itineraryStops[i]?.day}</b><br>${itineraryStops[i]?.name}`)
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, city, hotspots.length, showItineraryRoute, itineraryStops.length])

  // Pan map when city changes
  useEffect(() => {
    if (mapInstanceRef.current && base) {
      mapInstanceRef.current.setView([base.lat, base.lng], 13)
    }
  }, [city])

  const handleSearch = (e) => {
    e.preventDefault()
    setCity(searchInput)
  }

  const handleCrowdCheck = async () => {
    setPredicting(true)
    try {
      const [cr, wr] = await Promise.allSettled([
        crowdAPI.predict({ location: city, datetime: new Date().toISOString() }),
        weatherAPI.getCurrent({ city }),
      ])
      if (cr.status === 'fulfilled') setCrowdPrediction(cr.value.data.prediction)
      if (wr.status === 'fulfilled') setWeatherData(wr.value.data.weather)
    } catch { toast.error('Could not fetch data') }
    setPredicting(false)
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Smart Map</h1>
          <p className="page-subtitle">Itinerary routes, crowd hotspots & transport options</p>
        </div>
        <button
          onClick={() => navigate('/live-trip')}
          className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
        >
          <Play className="w-4 h-4" /> Start Live Trip
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden" style={{ height: '540px' }}>
            {!leafletLoaded && (
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
              </div>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%', display: leafletLoaded ? 'block' : 'none' }} />
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> Map powered by OpenStreetMap — completely free, no API key needed
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Search */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" /> Destination
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-2">
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input flex-1 h-9 py-0 text-sm" placeholder="City name..." />
              <button type="submit" className="btn-primary px-3 h-9 text-sm">Go</button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CITIES).map(c => (
                <button key={c} onClick={() => { setSearchInput(c); setCity(c) }}
                  className={clsx('text-[10px] px-2 py-0.5 rounded-full border transition-all',
                    city === c ? 'bg-sky-500/20 border-sky-500/30 text-sky-400' : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                  )}>{c}</button>
              ))}
            </div>
          </div>

          {/* Itinerary Route */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-violet-400" /> Itinerary Route
            </h3>
            <select value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)} className="input text-sm mb-2">
              <option value="">Select trip to see route</option>
              {trips.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
            {itineraryStops.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{itineraryStops.length} stops</span>
                  <button onClick={() => setShowItineraryRoute(!showItineraryRoute)}
                    className={clsx('text-xs px-2 py-1 rounded-lg border transition-all',
                      showItineraryRoute ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' : 'border-slate-700 text-slate-400'
                    )}>
                    {showItineraryRoute ? 'Hide' : 'Show'} Route
                  </button>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                  {itineraryStops.slice(0, 8).map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-4 h-4 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center text-violet-400 text-[9px] flex-shrink-0">{stop.day}</div>
                      <span className="truncate">{stop.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Live Conditions */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">Live Conditions</h3>
              <button onClick={handleCrowdCheck} disabled={predicting} className="btn-ghost p-1 text-sky-400">
                {predicting ? <Spinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>
            {!crowdPrediction && !weatherData ? (
              <button onClick={handleCrowdCheck} disabled={predicting} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                {predicting ? <Spinner size="sm" /> : <Navigation className="w-4 h-4" />}
                Check {city} Now
              </button>
            ) : (
              <div className="space-y-2.5">
                {weatherData && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Weather</span>
                    <span className="text-white">{weatherData.temperature}°C · {weatherData.description}</span>
                  </div>
                )}
                {crowdPrediction && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1"><Users className="w-3.5 h-3.5" />Crowd</span>
                      <CrowdBadge level={crowdPrediction.level} score={crowdPrediction.score} />
                    </div>
                    <p className="text-xs text-slate-400 bg-slate-700/40 rounded-lg p-2.5">{crowdPrediction.recommendation}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hotspots */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" /> Crowd Hotspots
            </h3>
            {hotspotsLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
              <div className="space-y-2">
                {hotspots.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-700/30 transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CROWD_COLORS[h.crowdLevel] }} />
                    <span className="text-sm text-slate-300 flex-1 truncate">{h.name}</span>
                    <CrowdBadge level={h.crowdLevel} showScore={false} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="card p-3">
            <div className="grid grid-cols-3 gap-2">
              {[['low', '#22c55e', 'Low'], ['medium', '#f59e0b', 'Medium'], ['high', '#f43f5e', 'High']].map(([, color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
