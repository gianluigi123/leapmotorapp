import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Car, Lock, User, Key, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '../config'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username,
        password
      })
      localStorage.setItem('session_id', response.data.session_id)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login fallito. Controlla le credenziali.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f9f4] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl shadow-emerald-900/10 border border-emerald-50">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6">
            <Car className="text-[#059669] w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">
            T03 <span className="text-[#059669]">HUB</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Accedi al tuo veicolo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email Leapmotor"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:border-[#059669] focus:bg-white outline-none transition-all font-bold text-slate-700"
              required
            />
          </div>

          <div className="relative">
            <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:border-[#059669] focus:bg-white outline-none transition-all font-bold text-slate-700"
              required
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#059669] hover:bg-[#065f46] text-white font-black italic uppercase py-5 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Entra nell'HUB</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
