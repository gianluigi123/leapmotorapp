import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from leapmotor_api import LeapmotorApiClient
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS
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

client_storage = {}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/status")
async def get_status():
    if "current_client" not in client_storage:
        username = os.getenv("LEAPMOTOR_USERNAME")
        password = os.getenv("LEAPMOTOR_PASSWORD")
        if username and password:
            try:
                client = LeapmotorApiClient(
                    username=username,
                    password=password,
                    app_cert_path="certs/app.crt",
                    app_key_path="certs/app.key"
                )
                client.login()
                client_storage["current_client"] = client
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Login fallito: {str(e)}")
        else:
            raise HTTPException(status_code=401, detail="Credenziali mancanti")
    
    client = client_storage["current_client"]
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
            "location": {
                "lat": getattr(status.location, 'latitude', 0),
                "lon": getattr(status.location, 'longitude', 0)
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
        # In caso di errore di sessione, svuotiamo il client per forzare il re-login al prossimo giro
        client_storage.clear()
        raise HTTPException(status_code=500, detail=str(e))

# Placeholder per comandi remoti (disabilitati per ora a causa dei blocchi lato server)
@app.post("/api/{action}")
async def proxy_action(action: str, request: ActionRequest):
    raise HTTPException(
        status_code=403, 
        detail="Comando momentaneamente non disponibile per restrizioni di sicurezza Leapmotor."
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
