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

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

# In-memory storage for the client (for this prototype)
client_storage = {}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

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
        # In a real app, we'd use a session token or JWT. 
        # For this prototype, we'll store the client instance temporarily or just verify credentials.
        # Since the library handles tokens, we can just return success if login() didn't raise.
        client_storage["current_client"] = client
        return {"status": "success", "message": "Logged in successfully"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

class ActionRequest(BaseModel):
    pin: str | None = None

@app.get("/api/status")
async def get_status():
    if "current_client" not in client_storage:
        # Try to use .env credentials if not logged in via UI
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
                raise HTTPException(status_code=401, detail=f"Auto-login failed: {str(e)}")
        else:
            raise HTTPException(status_code=401, detail="Not authenticated")
    
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        if not vehicles:
            return {"status": "error", "message": "No vehicles found"}
        
        # Get status for the first vehicle
        vehicle = vehicles[0]
        status = client.get_vehicle_status(vehicle)
        
        # Debugging: print vehicle object to console
        print(f"DEBUG Vehicle: {vehicle}")
        
        # Fallback for vehicle name
        v_name = vehicle.vehicle_nickname or f"Leapmotor {vehicle.car_type or 'T03'}"
        
        return {
            "vin": vehicle.vin,
            "vehicle_name": v_name,
            "soc": status.battery.soc,
            "range": status.battery.expected_mileage,
            "is_charging": status.battery.is_charging,
            "odometer": status.driving.total_mileage,
            "battery_health": "Ottima",
            "charging_power": getattr(status.battery, 'charging_power_kw', 0),
            "charging_time_remaining": getattr(status.battery, 'charge_remain_time', 0),
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
            },
            "windows": {
                "driver": status.windows.driver_window_status,
                "left_rear": status.windows.left_rear_window_status,
                "right_front": status.windows.right_front_window_status,
                "right_rear": status.windows.right_rear_window_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lock")
async def lock_vehicle(request: ActionRequest):
    if "current_client" not in client_storage:
        raise HTTPException(status_code=401, detail="Not authenticated")
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        # The library uses operation_password for remote actions
        if request.pin:
            client.operation_password = request.pin
        elif os.getenv("LEAPMOTOR_PIN"):
            client.operation_password = os.getenv("LEAPMOTOR_PIN")
            
        client.lock_vehicle(vehicles[0].vin)
        return {"status": "success", "message": "Vehicle locked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/unlock")
async def unlock_vehicle(request: ActionRequest):
    if "current_client" not in client_storage:
        raise HTTPException(status_code=401, detail="Not authenticated")
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        if request.pin:
            client.operation_password = request.pin
        elif os.getenv("LEAPMOTOR_PIN"):
            client.operation_password = os.getenv("LEAPMOTOR_PIN")
            
        client.unlock_vehicle(vehicles[0].vin)
        return {"status": "success", "message": "Vehicle unlocked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-trunk")
async def open_trunk(request: ActionRequest):
    if "current_client" not in client_storage:
        raise HTTPException(status_code=401, detail="Not authenticated")
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        if request.pin:
            client.operation_password = request.pin
        elif os.getenv("LEAPMOTOR_PIN"):
            client.operation_password = os.getenv("LEAPMOTOR_PIN")
            
        client.open_trunk(vehicles[0].vin)
        return {"status": "success", "message": "Trunk opened"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/open-windows")
async def open_windows(request: ActionRequest):
    if "current_client" not in client_storage:
        raise HTTPException(status_code=401, detail="Not authenticated")
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        if request.pin:
            client.operation_password = request.pin
        elif os.getenv("LEAPMOTOR_PIN"):
            client.operation_password = os.getenv("LEAPMOTOR_PIN")
            
        client.open_windows(vehicles[0].vin)
        return {"status": "success", "message": "Windows opened"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/close-windows")
async def close_windows(request: ActionRequest):
    if "current_client" not in client_storage:
        raise HTTPException(status_code=401, detail="Not authenticated")
    client = client_storage["current_client"]
    try:
        vehicles = client.get_vehicle_list()
        if request.pin:
            client.operation_password = request.pin
        elif os.getenv("LEAPMOTOR_PIN"):
            client.operation_password = os.getenv("LEAPMOTOR_PIN")
            
        client.close_windows(vehicles[0].vin)
        return {"status": "success", "message": "Windows closed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
