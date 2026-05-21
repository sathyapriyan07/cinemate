import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetail from './pages/MovieDetail'
import Series from './pages/Series'
import SeriesDetail from './pages/SeriesDetail'
import PersonDetail from './pages/PersonDetail'
import Login from './pages/Login'

import AdminDashboard from './pages/admin/Dashboard'
import AdminImport from './pages/admin/Import'
import AdminMovies from './pages/admin/AdminMovies'
import AdminSeries from './pages/admin/AdminSeries'
import AdminPersons from './pages/admin/AdminPersons'

function AdminGuard({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function PublicGuard({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="spinner" />
  // If admin tries to visit public pages, redirect to admin
  if (user && isAdmin) return <Navigate to="/admin" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicGuard><Home /></PublicGuard>} />
        <Route path="/movies" element={<PublicGuard><Movies /></PublicGuard>} />
        <Route path="/movies/:id" element={<PublicGuard><MovieDetail /></PublicGuard>} />
        <Route path="/series" element={<PublicGuard><Series /></PublicGuard>} />
        <Route path="/series/:id" element={<PublicGuard><SeriesDetail /></PublicGuard>} />
        <Route path="/person/:id" element={<PublicGuard><PersonDetail /></PublicGuard>} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/import" element={<AdminGuard><AdminImport /></AdminGuard>} />
        <Route path="/admin/movies" element={<AdminGuard><AdminMovies /></AdminGuard>} />
        <Route path="/admin/series" element={<AdminGuard><AdminSeries /></AdminGuard>} />
        <Route path="/admin/persons" element={<AdminGuard><AdminPersons /></AdminGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
