/**
 * Booking Page - FULLY FUNCTIONAL
 * Flights, Hotels, Trains, Buses, Tour Guides
 * Real search + booking saved to DB + linked to expenses
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plane, Hotel, Train, Bus, UserCheck, Search, Clock,
  Star, MapPin, Wifi, Check, X, ChevronRight, DollarSign,
  ArrowRight, AlertCircle, Package
} from 'lucide-react'
import { bookingsAPI, tripsAPI } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Spinner, Modal } from '../components/common/CrowdBadge'
import clsx from 'clsx'

const TABS = [
  { id: 'flight', label: 'Flights', icon: Plane },
  { id: 'hotel', label: 'Hotels', icon: Hotel },
  { id: 'train', label: 'Trains', icon: Train },
  { id: 'bus', label: 'Buses', icon: Bus },
  { id: 'guide', label: 'Guides', icon: UserCheck },
]

export default function BookingPage() {
  const [activeTab, setActiveTab] = useState('flight')
  const [bookingModal, setBookingModal] = useState(null)

  // Fetch existing bookings
  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsAPI.getAll({ limit: 5 }),
  })
  const recentBookings = bookingsData?.data?.bookings || []

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Book Travel</h1>
        <p className="page-subtitle">Search and book flights, hotels, trains, buses, and guides</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Search panels */}
      {activeTab === 'flight' && <FlightSearch onBook={setBookingModal} />}
      {activeTab === 'hotel' && <HotelSearch onBook={setBookingModal} />}
      {activeTab === 'train' && <TrainSearch onBook={setBookingModal} />}
      {activeTab === 'bus' && <BusSearch onBook={setBookingModal} />}
      {activeTab === 'guide' && <GuideSearch onBook={setBookingModal} />}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="mt-8">
          <h2 className="section-title">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings.map(b => (
              <div key={b._id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  {b.type === 'flight' ? <Plane className="w-5 h-5 text-sky-400" /> :
                   b.type === 'hotel' ? <Hotel className="w-5 h-5 text-violet-400" /> :
                   b.type === 'train' ? <Train className="w-5 h-5 text-amber-400" /> :
                   b.type === 'bus' ? <Bus className="w-5 h-5 text-emerald-400" /> :
                   <UserCheck className="w-5 h-5 text-rose-400" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-200 capitalize">{b.type.replace('_',' ')} Booking</div>
                  <div className="text-xs text-slate-400">{b.bookingReference} · {format(new Date(b.createdAt), 'MMM d, yyyy')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">${b.pricing?.totalPrice?.toFixed(0)}</div>
                  <span className={clsx('text-xs capitalize', b.status === 'confirmed' ? 'text-emerald-400' : b.status === 'cancelled' ? 'text-rose-400' : 'text-slate-400')}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking confirmation modal */}
      {bookingModal && (
        <BookingConfirmModal
          item={bookingModal.item}
          type={bookingModal.type}
          params={bookingModal.params}
          onClose={() => setBookingModal(null)}
          onBooked={() => { setBookingModal(null); refetchBookings(); }}
        />
      )}
    </div>
  )
}

// ─── Flight Search ────────────────────────────────────────────────────────────
function FlightSearch({ onBook }) {
  const [params, setParams] = useState({ from: '', to: '', date: '', passengers: 1, class: 'economy' })
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearching(true)
    try {
      const res = await bookingsAPI.searchFlights(params)
      setResults(res.data.flights)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed')
    }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">From</label>
            <input value={params.from} onChange={e => setParams(p => ({ ...p, from: e.target.value }))}
              className="input" placeholder="New York" required />
          </div>
          <div>
            <label className="label">To</label>
            <input value={params.to} onChange={e => setParams(p => ({ ...p, to: e.target.value }))}
              className="input" placeholder="Paris" required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={params.date} onChange={e => setParams(p => ({ ...p, date: e.target.value }))}
              className="input" min={new Date().toISOString().split('T')[0]} required />
          </div>
          <div>
            <label className="label">Passengers</label>
            <input type="number" min="1" max="9" value={params.passengers}
              onChange={e => setParams(p => ({ ...p, passengers: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Class</label>
            <select value={params.class} onChange={e => setParams(p => ({ ...p, class: e.target.value }))} className="input">
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>
        {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
        <button type="submit" disabled={searching} className="btn-primary mt-3 flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : <Search className="w-4 h-4" />} Search Flights
        </button>
      </form>

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title">{results.length} flights found — {params.from} → {params.to}</h3>
          </div>
          {results.map(flight => (
            <div key={flight.id} className="card-hover p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{flight.logo}</div>
                <div>
                  <div className="font-semibold text-white">{flight.carrier}</div>
                  <div className="text-xs text-slate-400">{flight.flightNumber}</div>
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="font-bold text-white text-lg">
                  {format(new Date(flight.departureTime), 'HH:mm')} → {format(new Date(flight.arrivalTime), 'HH:mm')}
                </div>
                <div className="text-xs text-slate-400">{flight.duration} · {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop via ${flight.stopCity}`}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${flight.price}</div>
                  <div className="text-xs text-slate-400">${flight.pricePerPerson}/person · {flight.class}</div>
                  {flight.refundable && <div className="text-xs text-emerald-400">Refundable</div>}
                </div>
                <button onClick={() => onBook({ item: flight, type: 'flight', params })}
                  className="btn-primary whitespace-nowrap">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hotel Search ─────────────────────────────────────────────────────────────
function HotelSearch({ onBook }) {
  const [params, setParams] = useState({ city: '', checkIn: '', checkOut: '', guests: 1, rooms: 1 })
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearching(true)
    try {
      const res = await bookingsAPI.searchHotels(params)
      setResults(res.data.hotels)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed')
    }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="label">City</label>
            <input value={params.city} onChange={e => setParams(p => ({ ...p, city: e.target.value }))}
              className="input" placeholder="Paris" required />
          </div>
          <div>
            <label className="label">Check-in</label>
            <input type="date" value={params.checkIn} onChange={e => setParams(p => ({ ...p, checkIn: e.target.value }))}
              className="input" min={new Date().toISOString().split('T')[0]} required />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input type="date" value={params.checkOut} onChange={e => setParams(p => ({ ...p, checkOut: e.target.value }))}
              className="input" min={params.checkIn || new Date().toISOString().split('T')[0]} required />
          </div>
          <div>
            <label className="label">Guests</label>
            <input type="number" min="1" value={params.guests}
              onChange={e => setParams(p => ({ ...p, guests: e.target.value }))} className="input" />
          </div>
        </div>
        {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
        <button type="submit" disabled={searching} className="btn-primary mt-3 flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : <Search className="w-4 h-4" />} Search Hotels
        </button>
      </form>

      {results && (
        <div className="space-y-3">
          <h3 className="section-title">{results.length} hotels in {params.city}</h3>
          {results.map(hotel => (
            <div key={hotel.id} className="card-hover p-5 flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-32 h-24 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={hotel.images?.[0]} alt={hotel.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none' }} />
                <Hotel className="w-8 h-8 text-slate-500 absolute" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-white">{hotel.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3" />{hotel.address}
                      <span className="mx-1">·</span>{hotel.distanceFromCenter} from center
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(hotel.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      <span className="text-xs text-slate-400 ml-1">{hotel.reviewScore} ({hotel.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-white">${hotel.pricePerNight}<span className="text-sm font-normal text-slate-400">/night</span></div>
                    <div className="text-xs text-slate-400">${hotel.totalPrice} total · {hotel.nights} nights</div>
                    {hotel.freeCancellation && <div className="text-xs text-emerald-400">Free cancellation</div>}
                    <button onClick={() => onBook({ item: hotel, type: 'hotel', params })} className="btn-primary text-sm mt-2">Book</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hotel.amenities?.slice(0, 5).map(a => (
                    <span key={a} className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-md">{a}</span>
                  ))}
                  {hotel.breakfastIncluded && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Breakfast Included</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Train Search ─────────────────────────────────────────────────────────────
function TrainSearch({ onBook }) {
  const [params, setParams] = useState({ from: '', to: '', date: '', passengers: 1 })
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [selectedClass, setSelectedClass] = useState({})

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await bookingsAPI.searchTrains(params)
      setResults(res.data.trains)
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label">From</label><input value={params.from} onChange={e => setParams(p => ({ ...p, from: e.target.value }))} className="input" placeholder="Mumbai" required /></div>
          <div><label className="label">To</label><input value={params.to} onChange={e => setParams(p => ({ ...p, to: e.target.value }))} className="input" placeholder="Delhi" required /></div>
          <div><label className="label">Date</label><input type="date" value={params.date} onChange={e => setParams(p => ({ ...p, date: e.target.value }))} className="input" min={new Date().toISOString().split('T')[0]} required /></div>
          <div><label className="label">Passengers</label><input type="number" min="1" value={params.passengers} onChange={e => setParams(p => ({ ...p, passengers: e.target.value }))} className="input" /></div>
        </div>
        <button type="submit" disabled={searching} className="btn-primary mt-3 flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : <Search className="w-4 h-4" />} Search Trains
        </button>
      </form>

      {results && results.map(train => (
        <div key={train.id} className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Train className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-semibold text-white">{train.name} <span className="text-slate-400 text-sm">({train.number})</span></div>
              <div className="text-xs text-slate-400">
                {format(new Date(train.departureTime), 'HH:mm')} → {format(new Date(train.arrivalTime), 'HH:mm')} · {train.duration}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {train.classes?.map(cls => (
              <button key={cls.name}
                onClick={() => { setSelectedClass({ ...selectedClass, [train.id]: cls }); onBook({ item: { ...train, selectedClass: cls }, type: 'train', params }) }}
                className="p-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-sky-500/30 rounded-xl text-left transition-all">
                <div className="text-xs text-slate-400 mb-0.5">{cls.name}</div>
                <div className="font-bold text-white">${cls.price}</div>
                <div className="text-[10px] text-slate-500">{cls.seats} seats left</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Bus Search ───────────────────────────────────────────────────────────────
function BusSearch({ onBook }) {
  const [params, setParams] = useState({ from: '', to: '', date: '', passengers: 1 })
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await bookingsAPI.searchBuses(params)
      setResults(res.data.buses)
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label">From</label><input value={params.from} onChange={e => setParams(p => ({ ...p, from: e.target.value }))} className="input" placeholder="Hyderabad" required /></div>
          <div><label className="label">To</label><input value={params.to} onChange={e => setParams(p => ({ ...p, to: e.target.value }))} className="input" placeholder="Bangalore" required /></div>
          <div><label className="label">Date</label><input type="date" value={params.date} onChange={e => setParams(p => ({ ...p, date: e.target.value }))} className="input" min={new Date().toISOString().split('T')[0]} required /></div>
          <div><label className="label">Passengers</label><input type="number" min="1" value={params.passengers} onChange={e => setParams(p => ({ ...p, passengers: e.target.value }))} className="input" /></div>
        </div>
        <button type="submit" disabled={searching} className="btn-primary mt-3 flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : <Search className="w-4 h-4" />} Search Buses
        </button>
      </form>

      {results && results.map(bus => (
        <div key={bus.id} className="card-hover p-4 flex items-center gap-4">
          <Bus className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-white">{bus.operator}</div>
            <div className="text-xs text-slate-400">{bus.busType} · {bus.duration}</div>
            <div className="text-xs text-slate-400">
              {format(new Date(bus.departureTime), 'HH:mm')} → {format(new Date(bus.arrivalTime), 'HH:mm')} · {bus.seatsAvailable} seats
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-lg">${bus.price}</div>
            <button onClick={() => onBook({ item: bus, type: 'bus', params })} className="btn-primary text-sm mt-1">Book</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Guide Search ─────────────────────────────────────────────────────────────
function GuideSearch({ onBook }) {
  const [city, setCity] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearching(true)
    try {
      const res = await bookingsAPI.searchGuides({ city })
      setResults(res.data.guides)
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="card p-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">City</label>
          <input value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Tokyo" required />
        </div>
        <button type="submit" disabled={searching} className="btn-primary flex items-center gap-2">
          {searching ? <Spinner size="sm" /> : <Search className="w-4 h-4" />} Find Guides
        </button>
      </form>

      {results && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map(guide => (
            <div key={guide.id} className="card-hover p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {guide.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">{guide.name}</div>
                  <div className="text-xs text-slate-400">{guide.speciality}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-slate-300">{guide.rating} ({guide.reviewCount})</span>
                    {guide.verified && <span className="text-xs text-sky-400">✓ Verified</span>}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-2">{guide.experience} · {guide.languages?.join(', ')}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {guide.tours?.map(t => <span key={t} className="text-[10px] badge bg-slate-700/50 text-slate-400 border-slate-600">{t}</span>)}
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white">${guide.pricePerHour}<span className="text-xs font-normal text-slate-400">/hr</span></div>
                <button onClick={() => onBook({ item: guide, type: 'tour_guide', params: { city } })} className="btn-primary text-sm">Book Guide</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Booking Confirmation Modal ───────────────────────────────────────────────
function BookingConfirmModal({ item, type, params, onClose, onBooked }) {
  const qc = useQueryClient()
  const { data: tripsData } = useQuery({ queryKey: ['trips'], queryFn: () => tripsAPI.getAll() })
  const trips = tripsData?.data?.trips || []
  const [tripId, setTripId] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [autoItinerary, setAutoItinerary] = useState(null)

  const getPrice = () => {
    if (type === 'flight') return item.price
    if (type === 'hotel') return item.totalPrice
    if (type === 'train') return item.selectedClass?.price || item.classes?.[0]?.price || 0
    if (type === 'bus') return item.price
    if (type === 'tour_guide') return item.pricePerHour * 4
    return 0
  }
  const price = getPrice()
  const tax = price * 0.1
  const total = price + tax

  const handleBook = async () => {
    setLoading(true)
    try {
      const bookingData = {
        type,
        trip: tripId || undefined,
        status: 'confirmed',
        pricing: { basePrice: price, taxes: tax, fees: 0, totalPrice: total, currency: 'USD', paidAmount: total },
        ...(type === 'flight' && {
          transport: {
            from: params.from, to: params.to,
            carrier: item.carrier, flightNumber: item.flightNumber,
            departureTime: item.departureTime, arrivalTime: item.arrivalTime,
            class: item.class, seats: parseInt(params.passengers || 1),
            duration: item.duration
          }
        }),
        ...(type === 'hotel' && {
          hotel: {
            name: item.name, address: item.address, city: item.city,
            checkIn: params.checkIn, checkOut: params.checkOut,
            nights: item.nights, roomType: item.roomType,
            guests: parseInt(params.guests || 1), rating: item.rating,
            amenities: item.amenities, coordinates: item.coordinates
          }
        }),
        ...(type === 'train' && {
          transport: {
            from: params.from, to: params.to,
            carrier: item.name, flightNumber: item.number,
            departureTime: item.departureTime, arrivalTime: item.arrivalTime,
            duration: item.duration, class: item.selectedClass?.name
          }
        }),
        ...(type === 'bus' && {
          transport: {
            from: params.from, to: params.to,
            carrier: item.operator,
            departureTime: item.departureTime, arrivalTime: item.arrivalTime,
            duration: item.duration
          }
        }),
        ...(type === 'tour_guide' && {
          tourGuide: {
            guideName: item.name, language: item.languages?.[0],
            tours: item.tours, city: params.city
          }
        }),
      }

      const res = await bookingsAPI.create(bookingData)
      setSuccess(res.data.booking)
      if (res.data.itinerary) setAutoItinerary(res.data.itinerary)
      qc.invalidateQueries(['bookings'])
      qc.invalidateQueries(['expenses'])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative card p-8 w-full max-w-md text-center animate-slide-up">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Booking Confirmed! 🎉</h2>
          <p className="text-slate-400 mb-1">Reference: <span className="text-sky-400 font-mono">{success.bookingReference}</span></p>
          <p className="text-slate-400 text-sm mb-4">Expense of ${total.toFixed(2)} auto-added to tracker.</p>
          {autoItinerary && (
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-4 text-left">
              <div className="text-sky-400 font-semibold text-sm mb-1">🗺️ Itinerary Auto-Generated!</div>
              <div className="text-slate-300 text-sm mb-3">{autoItinerary.title} — {autoItinerary.summary?.totalDays} days with {autoItinerary.days?.reduce((s,d) => s + d.activities.length, 0)} activities planned.</div>
              <div className="flex gap-2">
                <a href="/itinerary" onClick={onBooked} className="btn-primary text-xs py-1.5 flex-1 text-center">📅 View Itinerary</a>
                <a href="/live-trip" onClick={onBooked} className="btn-secondary text-xs py-1.5 flex-1 text-center">🚀 Start Live Trip</a>
              </div>
            </div>
          )}
          <button onClick={onBooked} className="btn-secondary w-full text-sm">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" /> Confirm Booking
        </h2>

        <div className="bg-slate-700/40 rounded-xl p-4 mb-4 space-y-2 text-sm">
          {type === 'flight' && <>
            <div className="flex justify-between"><span className="text-slate-400">Route</span><span className="text-white">{item.from} → {item.to}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Flight</span><span className="text-white">{item.carrier} {item.flightNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Time</span><span className="text-white">{format(new Date(item.departureTime), 'MMM d, HH:mm')} → {format(new Date(item.arrivalTime), 'HH:mm')}</span></div>
          </>}
          {type === 'hotel' && <>
            <div className="flex justify-between"><span className="text-slate-400">Hotel</span><span className="text-white">{item.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Check-in</span><span className="text-white">{params.checkIn}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Check-out</span><span className="text-white">{params.checkOut}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Room</span><span className="text-white">{item.roomType} · {item.nights} nights</span></div>
          </>}
          {(type === 'train' || type === 'bus') && <>
            <div className="flex justify-between"><span className="text-slate-400">Route</span><span className="text-white">{params.from} → {params.to}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Operator</span><span className="text-white">{item.name || item.operator}</span></div>
          </>}
          {type === 'tour_guide' && <>
            <div className="flex justify-between"><span className="text-slate-400">Guide</span><span className="text-white">{item.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">City</span><span className="text-white">{params.city}</span></div>
          </>}
          <div className="border-t border-slate-600 pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>${price.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400"><span>Taxes (10%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-white text-base pt-1"><span>Total</span><span className="text-sky-400">${total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Link to Trip (optional)</label>
          <select value={tripId} onChange={e => setTripId(e.target.value)} className="input">
            <option value="">No specific trip</option>
            {trips.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>

        <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300 mb-4">
          💡 Booking will auto-create an expense entry in your tracker
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleBook} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : 'Confirm & Pay'}
          </button>
        </div>
      </div>
    </div>
  )
}
