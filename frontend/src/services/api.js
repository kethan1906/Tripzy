/**
 * Tripzy API Service - Complete with all endpoints + offline mock fallbacks
 * Works even when backend is not running (mock mode)
 */
import axios from 'axios'
import toast from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('tripzy-auth')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`
    }
  } catch {}
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tripzy-auth')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ─── Trips ────────────────────────────────────────────────────────────────────
export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  getStats: (id) => api.get(`/trips/${id}/stats`),
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  searchFlights: (params) => api.get('/bookings/search/flights', { params }),
  searchHotels: (params) => api.get('/bookings/search/hotels', { params }),
  searchTrains: (params) => api.get('/bookings/search/trains', { params }),
  searchBuses: (params) => api.get('/bookings/search/buses', { params }),
  searchGuides: (params) => api.get('/bookings/search/guides', { params }),
  getAll: (params) => api.get('/bookings', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  // Summary — with mock fallback
  getSummary: async () => {
    try {
      return await api.get('/bookings/summary')
    } catch {
      return { data: { totalBookings: 0, confirmedCount: 0, totalSpent: 0 } }
    }
  },
}

// ─── Itinerary ────────────────────────────────────────────────────────────────
export const itineraryAPI = {
  generate: (data) => api.post('/itinerary/generate', data),
  getAll: async () => {
    try {
      return await api.get('/itinerary')
    } catch {
      // Return mock data if backend is offline
      const stored = JSON.parse(localStorage.getItem('tripzy-itineraries') || '[]')
      return { data: { itineraries: stored } }
    }
  },
  get: (id) => api.get(`/itinerary/${id}`),
  update: (id, data) => api.put(`/itinerary/${id}/update`, data),
  delete: async (id) => {
    try {
      return await api.delete(`/itinerary/${id}`)
    } catch {
      // Remove from localStorage fallback
      const stored = JSON.parse(localStorage.getItem('tripzy-itineraries') || '[]')
      const updated = stored.filter(i => i._id !== id)
      localStorage.setItem('tripzy-itineraries', JSON.stringify(updated))
      return { data: { success: true } }
    }
  },
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll: async (tripId, params) => {
    try {
      if (tripId === 'all') return await api.get('/expenses', { params })
      return await api.get(`/expenses/${tripId}`, { params })
    } catch {
      return { data: { expenses: [], totalSpent: 0 } }
    }
  },
  getAnalysis: (tripId) => api.get(`/expenses/${tripId}/analysis`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsAPI = {
  getAll: async (params) => {
    try {
      return await api.get('/alerts', { params })
    } catch {
      return { data: { alerts: [], unreadCount: 0 } }
    }
  },
  markRead: (id) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  create: (data) => api.post('/alerts', data),
}

// ─── Weather ──────────────────────────────────────────────────────────────────
export const weatherAPI = {
  getCurrent: async (params) => {
    try {
      return await api.get('/weather/current', { params })
    } catch {
      // Return mock weather
      return {
        data: {
          weather: {
            temperature: 24,
            description: 'Partly cloudy',
            humidity: 65,
            windSpeed: 12,
            condition: 'clouds',
            feelsLike: 26,
          }
        }
      }
    }
  },
  getForecast: (params) => api.get('/weather/forecast', { params }),
}

// ─── Crowd ────────────────────────────────────────────────────────────────────
export const crowdAPI = {
  predict: async (data) => {
    try {
      return await api.post('/crowd/predict', data)
    } catch {
      // Smart mock based on time/day
      const hour = new Date().getHours()
      const day = new Date().getDay()
      const isWeekend = day === 0 || day === 6
      const isPeakHour = (hour >= 10 && hour <= 14) || (hour >= 17 && hour <= 20)
      const score = isWeekend
        ? (isPeakHour ? 78 + Math.random() * 15 : 55 + Math.random() * 20)
        : (isPeakHour ? 55 + Math.random() * 20 : 25 + Math.random() * 25)
      const level = score > 65 ? 'high' : score > 40 ? 'medium' : 'low'
      return {
        data: {
          prediction: {
            level,
            score: Math.round(score),
            recommendation: level === 'high'
              ? 'Very crowded. Visit early morning or after 5pm for a better experience.'
              : level === 'medium'
              ? 'Moderate crowds. Weekday mornings are quieter.'
              : 'Great time to visit! Low crowd levels expected.',
            peakHours: ['10:00', '13:00', '17:00'],
            factors: isWeekend ? ['Weekend', isPeakHour ? 'Peak hours' : ''] : [isPeakHour ? 'Peak hours' : 'Off-peak']
          }
        }
      }
    }
  },
  getHotspots: async (params) => {
    try {
      return await api.get('/crowd/hotspots', { params })
    } catch {
      return { data: { hotspots: [] } }
    }
  },
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  getOne: (id) => api.get(`/groups/${id}`),
  join: (code) => api.post(`/groups/join/${code}`),
  createPoll: (id, data) => api.post(`/groups/${id}/polls`, data),
  vote: (id, pollId, data) => api.post(`/groups/${id}/polls/${pollId}/vote`, data),
  addExpense: (id, data) => api.post(`/groups/${id}/expenses`, data),
  getBalances: (id) => api.get(`/groups/${id}/balances`),
  sendMessage: (id, data) => api.post(`/groups/${id}/messages`, data),
}

// ─── Live Trip ────────────────────────────────────────────────────────────────
export const liveTripAPI = {
  start: (data) => api.post('/livetrip/start', data),
  getActive: async () => {
    try {
      return await api.get('/livetrip/active')
    } catch {
      return { data: { liveTrip: null } }
    }
  },
  completeStep: (id, stepIndex, data) => api.put(`/livetrip/${id}/step/${stepIndex}/complete`, data),
  updateLocation: (id, data) => api.put(`/livetrip/${id}/location`, data),

  // Cab options — returns Ola, Uber, Rapido with deep links
  getTransportOptions: async (id, params) => {
    try {
      return await api.get(`/livetrip/${id}/transport-options`, { params })
    } catch {
      // Generate mock cab options with deep links
      const { fromLat = 0, fromLng = 0, toLat = 0, toLng = 0 } = params || {}
      const dist = Math.max(1, Math.round(Math.sqrt((toLat - fromLat) ** 2 + (toLng - fromLng) ** 2) * 111))
      return {
        data: {
          distance: dist,
          recommended: 'ola',
          cabOptions: [
            {
              provider: 'Uber',
              type: 'UberGo',
              icon: '🖤',
              price: Math.round(dist * 14 + 20),
              eta: `${Math.round(dist * 3 + 5)} min`,
              deepLink: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${toLat}&dropoff[longitude]=${toLng}`,
              webLink: 'https://www.uber.com',
              color: '#000000',
            },
            {
              provider: 'Ola',
              type: 'Ola Mini',
              icon: '🟢',
              price: Math.round(dist * 11 + 15),
              eta: `${Math.round(dist * 3 + 3)} min`,
              deepLink: `https://olawebsite.com/book?lat=${toLat}&lng=${toLng}`,
              webLink: 'https://www.olacabs.com',
              color: '#28A745',
            },
            {
              provider: 'Rapido',
              type: 'Bike',
              icon: '🟡',
              price: Math.round(dist * 6 + 10),
              eta: `${Math.round(dist * 2 + 2)} min`,
              deepLink: `https://rapido.bike`,
              webLink: 'https://rapido.bike',
              color: '#FFC107',
            },
            {
              provider: 'Auto',
              type: 'Auto-Rickshaw',
              icon: '🛺',
              price: Math.round(dist * 9 + 12),
              eta: `${Math.round(dist * 4 + 4)} min`,
              deepLink: `https://www.olacabs.com`,
              webLink: 'https://www.olacabs.com',
              color: '#FF851B',
            },
          ]
        }
      }
    }
  },

  addAlert: (id, data) => api.post(`/livetrip/${id}/alert`, data),
  pause: (id) => api.put(`/livetrip/${id}/pause`),
  resume: (id) => api.put(`/livetrip/${id}/resume`),
  end: (id) => api.put(`/livetrip/${id}/end`),
}
