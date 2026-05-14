import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LPConnect from './pages/LPConnect'
import Login from './pages/Login'
import './App.css'

// Componente per proteggere le rotte
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/connect" 
          element={
            <ProtectedRoute>
              <LPConnect />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
