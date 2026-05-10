/**
 * Tripzy App - Main Router (Extended with all new features)
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

import DashboardLayout from './components/common/DashboardLayout'
import AuthLayout from './components/auth/AuthLayout'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import BookingPage from './pages/BookingPage'
import ItineraryPage from './pages/ItineraryPage'
import ExpensesPage from './pages/ExpensesPage'
import AlertsPage from './pages/AlertsPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import LandingPage from './pages/LandingPage'
import LiveTripPage from './pages/LiveTripPage'
import GroupPage from './pages/GroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import OfflinePage from './pages/OfflinePage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { initAuth } = useAuthStore()
  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/login" element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthLayout><RegisterPage /></AuthLayout></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="itinerary/:tripId?" element={<ItineraryPage />} />
        <Route path="expenses/:tripId?" element={<ExpensesPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="live-trip/:liveTripId?" element={<LiveTripPage />} />
        <Route path="groups" element={<GroupPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
