import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Zap, RefreshCcw, Car, Navigation, ShieldCheck, 
  Battery as BatteryIcon, Lock, Unlock, 
  Package, Activity, Cpu, Wind, LogOut
} from 'lucide-react'
import carImage from '../assets/car/T03.png'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

interface VehicleStatus {
  vin: string;
  vehicle_name: string;
  soc: number;
  range: number;
  is_charging: boolean;
  odometer: number;
  doors: {
    is_locked: boolean;
    driver: boolean;
    left_rear: boolean;
    right_rear: boolean;
    trunk: boolean;
  };
}

function Dashboard() {
  const [status, setStatus] = useState<VehicleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const getSessionId = () => localStorage.getItem('session_id');

  const handleUnauthorized = () => {
    localStorage.removeItem('session_id');
    navigate('/login');
  };

  const fetchStatus = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return handleUnauthorized();

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/status`, {
        headers: { 'session-id': sessionId }
      });
      setStatus(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        console.error(err.response?.data?.detail || 'Connessione al server fallita.');
      }
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    const sessionId = getSessionId();
    if (!sessionId) return handleUnauthorized();

    const pin = window.prompt("Inserisci il tuo PIN di sicurezza (Password Operativa):");
    if (pin === null) return;

    setActionLoading(action);
    try {
      await axios.post(`${API_BASE_URL}/api/${action}`, 
        { pin: pin },
        { headers: { 'session-id': sessionId } }
      );
      fetchStatus();
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        alert(`Errore: ${err.response?.data?.detail || 'Operazione fallita'}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('session_id');
    navigate('/login');
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getSocColor = (soc: number) => {
    if (soc > 70) return '#059669';
    if (soc > 25) return '#0284c7';
    return '#e11d48';
  };

  return (
    <div className="min-h-screen bg-[#f0f9f4] text-slate-800 flex flex-col items-center p-4 md:p-12 font-sans selection:bg-emerald-200">
      
      {/* Header */}
      <header className="w-full max-w-6xl mb-16 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white border-2 border-emerald-100 shadow-xl rounded-[1.5rem] flex items-center justify-center">
            <Car className="text-[#059669] w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase leading-none text-slate-900">
              T03 <span className="text-[#059669]">HUB</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Activity className="w-4 h-4 text-[#10b981]" />
              <p className="text-xs text-slate-400 font-bold tracking-[0.2em] uppercase">Control System Live</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={logout}
            className="p-5 bg-white border-2 border-rose-50 shadow-lg rounded-2xl hover:bg-rose-50 transition-all active:scale-90"
            title="Esci"
          >
            <LogOut className="w-6 h-6 text-rose-600" />
          </button>
          <button 
            onClick={fetchStatus}
            disabled={loading}
            className="p-5 bg-white border-2 border-emerald-50 shadow-lg rounded-2xl hover:bg-emerald-50 transition-all active:scale-90"
          >
            <RefreshCcw className={`w-6 h-6 text-[#059669] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl space-y-12 relative z-10 pb-20 px-4 md:px-0">
        {status ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column - Identity & Controls */}
            <div className="lg:col-span-7 space-y-10 min-w-0">
              
              {/* Identity & Visual Card */}
              <div className="bg-white rounded-[3.5rem] p-8 md:p-10 shadow-2xl shadow-emerald-900/5 border border-emerald-50 flex flex-col items-center gap-8">
                <div className="w-full flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                  <div className="bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-[#059669]" />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{status.odometer.toLocaleString()} km</span>
                  </div>
                  <div className="text-center md:text-right">
                    <h2 className="text-3xl font-black text-slate-900 italic uppercase">{status.vehicle_name}</h2>
                    <p className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full mt-1 border border-slate-100 inline-block">{status.vin}</p>
                  </div>
                </div>

                <div className="relative py-4 flex justify-center w-full">
                  <img 
                    src={carImage} 
                    alt="T03" 
                    className="w-full max-w-[400px] object-contain drop-shadow-[0_20px_40px_rgba(5,150,105,0.15)]" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                      <div className="bg-[#059669]/10 p-3 rounded-xl flex-shrink-0">
                        <Navigation className="w-6 h-6 text-[#059669]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Range</p>
                        <p className="text-2xl font-black text-slate-900 truncate">{status.range} km</p>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                      <div className="bg-blue-500/10 p-3 rounded-xl flex-shrink-0">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security</p>
                        <p className="text-xl font-black text-slate-900 uppercase truncate mt-1">{status.doors?.is_locked ? 'Locked' : 'Open'}</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <button 
                  onClick={() => performAction('unlock')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#059669' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-emerald-900/20 border-b-4 border-[#047857] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Unlock className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">Unlock</span>
                </button>
                
                <button 
                  onClick={() => performAction('lock')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#065f46' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-emerald-900/20 border-b-4 border-[#064e3b] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Lock className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">Lock</span>
                </button>

                <button 
                  onClick={() => performAction('open-trunk')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#059669' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-emerald-900/20 border-b-4 border-[#047857] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Package className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">Trunk</span>
                </button>

                <button 
                  onClick={() => performAction('ac-on')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#0ea5e9' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-sky-900/20 border-b-4 border-[#0369a1] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Wind className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">AC ON</span>
                </button>

                <button 
                  onClick={() => performAction('ac-off')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#475569' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-900/20 border-b-4 border-[#334155] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Activity className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">AC OFF</span>
                </button>

                <button 
                  onClick={() => performAction('start-charging')}
                  disabled={!!actionLoading}
                  style={{ backgroundColor: '#10b981' }}
                  className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-emerald-900/20 border-b-4 border-[#059669] active:border-b-0 active:translate-y-1 transition-all group min-h-[120px] md:min-h-[140px]"
                >
                  <Zap className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white leading-none text-center">Charge ON</span>
                </button>
              </div>
            </div>

            {/* Right Column - Battery Gauge */}
            <div className="lg:col-span-5 h-full min-w-0">
              <div className="bg-white rounded-[4rem] p-8 md:p-12 shadow-2xl shadow-emerald-900/5 border border-emerald-50 flex flex-col items-center gap-10 relative h-full">
                
                <div className="w-full flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Power Status</span>
                      <span className={`text-sm font-bold ${status.is_charging ? 'text-[#10b981]' : 'text-slate-600'}`}>
                        {status.is_charging ? 'Charging Active' : 'System OK'}
                      </span>
                   </div>
                   {status.is_charging && <Zap className="w-8 h-8 text-[#10b981] animate-pulse" />}
                </div>

                <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 view-box-[0 0 320 320]" viewBox="0 0 320 320">
                    <circle cx="160" cy="160" r="130" stroke="#f1f5f9" strokeWidth="20" fill="transparent" />
                    <circle
                      cx="160"
                      cy="160"
                      r="130"
                      stroke={getSocColor(status.soc)}
                      strokeWidth="20"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 130}
                      strokeDashoffset={2 * Math.PI * 130 * (1 - status.soc / 100)}
                      className="transition-all duration-[2s] cubic-bezier(0.34, 1.56, 0.64, 1)"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-none">{status.soc}</span>
                    <div className="flex items-center gap-2 mt-2 bg-slate-100 px-4 py-1.5 rounded-full">
                       <BatteryIcon className="w-5 h-5 text-[#059669]" />
                       <span className="text-xl font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-6 mt-auto">
                  <div className="flex justify-between items-center px-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</p>
                    <p className="text-sm font-black text-[#10b981] italic uppercase tracking-wider">Optimal</p>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="h-3 rounded-full transition-all duration-1000 shadow-inner"
                        style={{ backgroundColor: i < (status.soc / 20) ? getSocColor(status.soc) : '#f1f5f9' }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-48">
            <div className="w-24 h-24 border-8 border-emerald-100 border-t-[#059669] rounded-full animate-spin"></div>
            <p className="mt-10 text-[#059669] font-black tracking-[0.5em] uppercase text-xs">Accessing Command Link...</p>
          </div>
        )}
      </main>

      <footer className="mt-24 py-10 w-full max-w-6xl border-t-2 border-emerald-50 flex justify-center">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.8em]">Leapmotor Smart Command Interface</p>
      </footer>
    </div>
  )
}

export default Dashboard
