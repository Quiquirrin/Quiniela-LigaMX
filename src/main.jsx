import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { DataProvider, useData } from './lib/data'
import Layout from './components/Layout'
import { Spinner, Toast } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import ResetPassword from './pages/ResetPassword'

function Private({ children, admin }) {
  const { session, profile, loading } = useData()
  if (session === undefined || (session && loading && !profile)) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (admin && profile?.role !== 'admin') return <Navigate to="/inicio" replace />
  return children
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/nueva-contrasena" element={<ResetPassword />} />
        <Route element={<Private><Layout /></Private>}>
          <Route path="/inicio" element={<Dashboard />} />
          <Route path="/partidos" element={<Matches />} />
          <Route path="/tabla" element={<Ranking />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/admin" element={<Private admin><Admin /></Private>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </HashRouter>
  </StrictMode>,
)
