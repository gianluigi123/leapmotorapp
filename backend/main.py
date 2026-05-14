import os
import uuid
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from leapmotor_api import LeapmotorApiClient
import uvicorn

# Caricamento variabili d'ambiente
load_dotenv()

app = FastAPI()

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

class ActionRequest(BaseModel):
    pin: str | None = None
    value: int | None = None

# Storage in memoria: { session_id: client_instance }
# In produzione andrebbe usato un database o Redis con scadenza sessione
session_storage = {}

def get_client(session_id: str = Header(None)):
    if not session_id or session_id not in session_storage:
        raise HTTPException(status_code=401, detail="Sessione non valida o scaduta. Effettua il login.")
    return session_storage[session_id]

@app.post("/api/login")
async def login(request: LoginRequest):
    try:
        client = LeapmotorApiClient(
            username=request.username,
            password=request.password,
            app_cert_path="certs/app.crt",
            app_key_path="certs/app.key"
        )
        client.login()
        
        # Genera un ID sessione unico
        session_id = str(uuid.uuid4())
        session_storage[session_id] = client
        
        return {"session_id": session_id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login fallito: {str(e)}")

@app.get("/api/status")
async def get_status(session_id: str = Header(None)):
    client = get_client(session_id)
    try:
        vehicles = client.get_vehicle_list()
        if not vehicles:
            return {"status": "error", "message": "Nessun veicolo trovato"}
        
        vehicle = vehicles[0]
        status = client.get_vehicle_status(vehicle)
        
        v_name = vehicle.vehicle_nickname or f"Leapmotor {vehicle.car_type or 'T03'}"
        
        return {
            "vin": vehicle.vin,
            "vehicle_name": v_name,
            "soc": status.battery.soc,
            "range": status.battery.expected_mileage,
            "is_charging": status.battery.is_charging,
            "odometer": status.driving.total_mileage,
            "battery_health": "Ottima",
            "outdoor_temp": getattr(status.climate, 'outdoor_temp', 0),
            "tires": {
                "fl": getattr(status.tires, 'front_left_bar', 0),
                "fr": getattr(status.tires, 'front_right_bar', 0),
                "rl": getattr(status.tires, 'rear_left_bar', 0),
                "rr": getattr(status.tires, 'rear_right_bar', 0),
                "all_ok": getattr(status.tires, 'all_ok', True)
            },
            "doors": {
                "is_locked": status.doors.is_locked,
                "driver": status.doors.lbcm_driver_door_status == 1, 
                "left_rear": status.doors.lbcm_left_rear_door_status == 1,
                "right_rear": status.doors.rbcm_right_rear_door_status == 1,
                "trunk": status.doors.bbcm_back_door_status == 1
            }
        }
    except Exception as e:
        if session_id in session_storage:
            del session_storage[session_id]
        raise HTTPException(status_code=500, detail=f"Errore sessione: {str(e)}")

@app.post("/api/{action}")
async def perform_action(action: str, request: ActionRequest, session_id: str = Header(None)):
    client = get_client(session_id)
    try:
        vehicles = client.get_vehicle_list()
        if not vehicles:
            raise HTTPException(status_code=404, detail="Veicolo non trovato")
        
        vin = vehicles[0].vin
        
        if request.pin:
            client.operation_password = request.pin

        if action == "lock":
            client.lock_vehicle(vin)
        elif action == "unlock":
            client.unlock_vehicle(vin)
        elif action == "open-trunk":
            client.open_trunk(vin)
        elif action == "close-trunk":
            client.close_trunk(vin)
        elif action == "open-windows":
            client.open_windows(vin)
        elif action == "close-windows":
            client.close_windows(vin)
        elif action == "ac-on":
            client.ac_switch(vin, True)
        elif action == "ac-off":
            client.ac_switch(vin, False)
        elif action == "start-charging":
            client.start_charging(vin)
        elif action == "stop-charging":
            client.stop_charging(vin)
        else:
            raise HTTPException(status_code=400, detail=f"Azione '{action}' non riconosciuta")

        return {"status": "success", "message": f"Comando '{action}' inviato"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
