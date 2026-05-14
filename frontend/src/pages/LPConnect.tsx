import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  MapPin, RefreshCcw, Navigation, ShieldCheck, 
  Lock, Unlock, Package,
  Thermometer, Wind, Map, Gauge, LayoutPanelLeft
} from 'lucide-react'
import carImage from '../assets/car/leapmotor-t03.jpg'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'

interface VehicleStatus {
  vin: string;
  vehicle_name: string;
  soc: number;
  range: number;
  is_charging: boolean;
  odometer: number;
  battery_health: string;
  outdoor_temp: number;
  tires: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
    all_ok: boolean;
  };
  location: {
    lat: number;
    lon: number;
  };
}

function LPConnect() {
  const [status, setStatus] = useState<VehicleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/status`);
      setStatus(response.data);
    } catch (err: any) {
      console.error(err.response?.data?.detail || 'Connessione al server fallita.');
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    const pin = window.prompt("Inserisci il tuo PIN di sicurezza (Password Operativa):");
    if (pin === null) return;

    try {
      await axios.post(`${API_BASE_URL}/api/${action}`, { pin: pin });
      fetchStatus();
    } catch (err: any) {
      alert(`Errore: ${err.response?.data?.detail || 'Operazione fallita'}`);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!status && loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-mono">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 uppercase tracking-widest">Loading LP Connect...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 font-mono border-8 border-black">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Leapmotor T03</h1>
          <p className="text-xs mt-1">SYSTEM LIVE</p>
        </div>
        <div className="flex gap-4">
            <Link to="/" className="border-2 border-black p-2 hover:bg-black hover:text-white transition-colors">
                <LayoutPanelLeft className="w-6 h-6" />
            </Link>
            <button onClick={fetchStatus} className="border-2 border-black p-2 hover:bg-black hover:text-white transition-colors">
                <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {status && (
        <div className="space-y-8">
          
          {/* Main Display Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center border-b-4 border-black pb-8">
            <div className="border-4 border-black p-4 flex justify-center">
               <img src={carImage} alt="T03" className="max-w-full h-auto grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-4">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter">{status.vehicle_name}</h2>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase">{status.vin}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-black p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Navigation className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Autonomia Residua</span>
                        </div>
                        <p className="text-3xl font-bold">{status.range} km</p>
                    </div>
                    <div className="border-2 border-black p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Percorrenza Totale</span>
                        </div>
                        <p className="text-3xl font-bold">{status.odometer} km</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Central Gauge Section */}
          <div className="flex flex-col items-center justify-center py-12 relative border-b-4 border-black">
             <div className="w-64 h-64 border-8 border-slate-100 rounded-full flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="black"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - status.soc / 100)}
                    />
                </svg>
                <div className="text-center">
                    <p className="text-6xl font-black">{status.soc}%</p>
                    <div className="border-2 border-black px-2 py-1 mt-2 inline-flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Sistema OK</span>
                    </div>
                </div>
             </div>
             
             {/* Circular indicators like in screen.png */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></div>
             </div>
          </div>

          {/* Controls Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-8">
            <button onClick={() => performAction('unlock')} className="border-2 border-black p-4 hover:bg-black hover:text-white transition-all uppercase font-bold text-xs flex flex-col items-center gap-2">
                <Unlock className="w-6 h-6" />
                Sblocca
            </button>
            <button onClick={() => performAction('lock')} className="border-2 border-black p-4 hover:bg-black hover:text-white transition-all uppercase font-bold text-xs flex flex-col items-center gap-2">
                <Lock className="w-6 h-6" />
                Blocca
            </button>
            <button onClick={() => performAction('open-trunk')} className="border-2 border-black p-4 hover:bg-black hover:text-white transition-all uppercase font-bold text-xs flex flex-col items-center gap-2">
                <Package className="w-6 h-6" />
                Bagagliaio
            </button>
            <button onClick={() => performAction('open-windows')} className="border-2 border-black p-4 hover:bg-black hover:text-white transition-all uppercase font-bold text-xs flex flex-col items-center gap-2">
                <Wind className="w-6 h-6" />
                Apri Vetri
            </button>
            <button onClick={() => performAction('close-windows')} className="border-2 border-black p-4 hover:bg-black hover:text-white transition-all uppercase font-bold text-xs flex flex-col items-center gap-2">
                <ShieldCheck className="w-4 h-4 rotate-180" />
                Chiudi Vetri
            </button>
          </div>

          {/* Bottom Technical Data */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t-4 border-black pt-8">
             <div className="p-2">
                <p className="text-[10px] font-bold uppercase mb-2">Battery Health</p>
                <p className="font-bold text-xl">{status.battery_health}</p>
             </div>
             <div className="p-2">
                <p className="text-[10px] font-bold uppercase mb-2">Outdoor Temp</p>
                <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5" />
                    <p className="font-bold text-xl">{status.outdoor_temp}°C</p>
                </div>
             </div>
             <div className="p-2">
                <p className="text-[10px] font-bold uppercase mb-2">Tire Pressure</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>FL: {status.tires.fl} bar</div>
                    <div>FR: {status.tires.fr} bar</div>
                    <div>RL: {status.tires.rl} bar</div>
                    <div>RR: {status.tires.rr} bar</div>
                </div>
             </div>
             <div className="p-2">
                <p className="text-[10px] font-bold uppercase mb-2">Vehicle Location</p>
                <div className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    <p className="text-[10px] font-bold">{status.location.lat.toFixed(4)}, {status.location.lon.toFixed(4)}</p>
                </div>
             </div>
          </div>

        </div>
      )}

      <footer className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.4em] border-t-2 border-black pt-4">
        Leapmotor Smart Control Interface • 2026 Edition
      </footer>
    </div>
  )
}

export default LPConnect
