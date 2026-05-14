import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LPConnect from './pages/LPConnect'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/connect" element={<LPConnect />} />
      </Routes>
    </Router>
  )
}

export default App
