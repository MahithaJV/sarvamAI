from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import numpy as np
from pydantic import BaseModel
import os
import io
import requests
from functools import lru_cache
from PIL import Image

app = FastAPI(title="Smart Agriculture API")

# Setup CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
price_model = None
crop_encoder = None
disease_model = None

# PlantVillage class names — maps model output index to human-readable label
DISEASE_CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# Action recommendations based on disease detection
DISEASE_ACTIONS = {
    "healthy": "No action needed. Your crop looks healthy. Continue regular monitoring and maintenance.",
    "scab": "Apply appropriate fungicide (captan or myclobutanil). Remove and destroy fallen leaves to reduce spread.",
    "black_rot": "Prune out infected areas. Apply fungicides during the growing season. Improve air circulation.",
    "cedar_apple_rust": "Apply fungicide at bud break. Remove nearby juniper/cedar trees if possible.",
    "rust": "Apply sulfur-based or triazole fungicides immediately. Remove severely infected leaves.",
    "powdery_mildew": "Spray with neem oil, potassium bicarbonate, or sulfur-based fungicide. Ensure good air circulation.",
    "cercospora": "Apply strobilurin or triazole fungicides. Rotate crops and remove infected debris.",
    "gray_leaf_spot": "Apply foliar fungicides. Use resistant hybrids for future planting.",
    "common_rust": "Apply fungicide if infection is caught early. Use resistant varieties in the future.",
    "northern_leaf_blight": "Apply fungicides at first sign. Use resistant hybrids and practice crop rotation.",
    "leaf_blight": "Remove infected leaves. Apply copper-based fungicides. Avoid overhead irrigation.",
    "esca": "Prune infected wood during dormancy. No chemical cure exists — focus on prevention.",
    "black_measles": "Prune infected wood during dormancy. No chemical cure exists — focus on prevention.",
    "haunglongbing": "Remove and destroy infected trees immediately. Control psyllid vectors with insecticides.",
    "citrus_greening": "Remove and destroy infected trees immediately. Control psyllid vectors with insecticides.",
    "bacterial_spot": "Apply copper-based bactericides. Use disease-free seeds and resistant varieties.",
    "early_blight": "Apply chlorothalonil or mancozeb fungicides. Practice crop rotation and remove debris.",
    "late_blight": "Apply metalaxyl or chlorothalonil immediately. Destroy all infected plant material.",
    "leaf_mold": "Improve ventilation and reduce humidity. Apply fungicides if necessary.",
    "septoria_leaf_spot": "Apply fungicides containing chlorothalonil. Remove lower infected leaves. Avoid overhead watering.",
    "spider_mites": "Apply miticides or insecticidal soap. Increase humidity around plants. Introduce predatory mites.",
    "target_spot": "Apply fungicides. Remove infected foliage. Practice proper crop rotation.",
    "yellow_leaf_curl_virus": "Control whitefly vectors with insecticides. Remove and destroy infected plants. Use resistant varieties.",
    "mosaic_virus": "Remove and destroy infected plants immediately. Control aphid vectors. Disinfect tools.",
    "leaf_scorch": "Ensure adequate watering. Remove severely damaged foliage. Improve soil drainage.",
}


def get_disease_action(class_name: str) -> str:
    """Look up an action recommendation by matching keywords in the class name."""
    name_lower = class_name.lower()

    if "healthy" in name_lower:
        return DISEASE_ACTIONS["healthy"]

    # Try to match keywords from the actions dictionary
    for key, action in DISEASE_ACTIONS.items():
        if key in name_lower:
            return action

    return "Monitor the crop closely. Consult a local agricultural extension officer for specific treatment recommendations."


def format_disease_name(class_name: str) -> str:
    """Convert class names like 'Tomato___Early_blight' to 'Tomato — Early Blight'."""
    parts = class_name.split("___")
    if len(parts) == 2:
        crop = parts[0].replace("_", " ")
        disease = parts[1].replace("_", " ").strip()
        if disease.lower() == "healthy":
            return "Healthy"
        return f"{crop} — {disease.title()}"
    return class_name.replace("_", " ")


@lru_cache(maxsize=100)
def get_real_weather(location: str):
    city = location if location and location not in ["Unknown", "Unknown Location", ""] else "Delhi"
    temperature, humidity, rainfall = 25.0, 60.0, 0.0
    condition = "Partly Cloudy"
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
        geo_response = requests.get(geo_url, timeout=3)
        if geo_response.status_code == 200:
            geo_data = geo_response.json()
            if "results" in geo_data and len(geo_data["results"]) > 0:
                lat = geo_data["results"][0]["latitude"]
                lon = geo_data["results"][0]["longitude"]
                
                weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code"
                weather_response = requests.get(weather_url, timeout=3)
                if weather_response.status_code == 200:
                    w_data = weather_response.json()
                    current = w_data.get("current", {})
                    temperature = float(current.get("temperature_2m", 25.0))
                    humidity = float(current.get("relative_humidity_2m", 60.0))
                    rainfall = float(current.get("precipitation", 0.0)) * 24 # rough estimation mm per day
                    
                    weather_code = current.get("weather_code", 0)
                    if weather_code == 0: condition = "Clear sky"
                    elif weather_code in [1, 2, 3]: condition = "Cloudy"
                    elif weather_code in [45, 48]: condition = "Fog"
                    elif weather_code in [51, 53, 55, 56, 57]: condition = "Drizzle"
                    elif weather_code in [61, 63, 65, 66, 67]: condition = "Rain"
                    elif weather_code in [71, 73, 75, 77, 85, 86]: condition = "Snow"
                    elif weather_code in [80, 81, 82]: condition = "Rain Showers"
                    elif weather_code in [95, 96, 99]: condition = "Thunderstorm"
                    else: condition = "Unknown"
    except Exception as e:
        print(f"Error fetching real weather: {e}")
    
    return temperature, humidity, rainfall, condition

@app.on_event("startup")
def load_models():
    global price_model, crop_encoder, disease_model
    import traceback
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Load price prediction models
    try:
        with open(os.path.join(base_dir, "models", "price_model.pkl"), "rb") as f:
            price_model = pickle.load(f)
        with open(os.path.join(base_dir, "models", "crop_encoder.pkl"), "rb") as f:
            crop_encoder = pickle.load(f)
        print("Price prediction models loaded successfully.")
    except Exception as e:
        print("Could not load price prediction models.")
        traceback.print_exc()

    # Load disease detection model (PyTorch)
    try:
        disease_model_path = os.path.join(base_dir, "models", "disease_model.pth")
        if os.path.exists(disease_model_path):
            import torch
            from torchvision import models as tv_models
            # Load MobileNetV2 architecture with custom classifier head
            model = tv_models.mobilenet_v2(weights=None)
            num_classes = len(DISEASE_CLASS_NAMES)
            model.classifier[1] = torch.nn.Linear(model.last_channel, num_classes)
            model.load_state_dict(torch.load(disease_model_path, map_location="cpu", weights_only=True))
            model.eval()
            disease_model = model
            print("Disease detection model loaded successfully.")
        else:
            print(f"Disease model not found at {disease_model_path}. Disease detection will be unavailable.")
    except Exception as e:
        print("Could not load disease detection model.")
        traceback.print_exc()

class PredictionRequest(BaseModel):
    crop_name: str
    mandi_location: str = "Unknown"
    quantity_kg: float = 1.0
    number_of_days: int = 7

@app.post("/api/predict_price")
def predict_price(request: PredictionRequest):
    if price_model is None or crop_encoder is None:
        return {"error": "Models are not loaded."}
    
    try:
        # Check if crop exists
        if request.crop_name not in crop_encoder.classes_:
            return {"error": f"Crop '{request.crop_name}' not supported."}

        crop_encoded = crop_encoder.transform([request.crop_name])[0]
        
        # Fetch real weather for the mandi location
        temp_val, hum_val, rain_val, _ = get_real_weather(request.mandi_location)
        
        from datetime import datetime
        day_of_year_val = datetime.now().timetuple().tm_yday

        # Run model prediction for each future day
        graph_data = []
        min_price = float('inf')
        max_price = 0
        best_day_name = ""
        worst_day_name = ""

        for day_offset in range(request.number_of_days):
            future_day = (day_of_year_val + day_offset - 1) % 365 + 1
            day_name = "Today" if day_offset == 0 else f"Day {day_offset + 1}"

            input_data = pd.DataFrame([{
                'day_of_year': future_day,
                'crop_encoded': crop_encoded,
                'rainfall': rain_val,
                'temperature': temp_val,
                'humidity': hum_val
            }])

            price = float(price_model.predict(input_data)[0])
            rounded_price = round(price, 2)

            graph_data.append({"day": day_name, "price": rounded_price})

            if rounded_price > max_price:
                max_price = rounded_price
                best_day_name = day_name
            if rounded_price < min_price:
                min_price = rounded_price
                worst_day_name = day_name

        day_1_price = round(graph_data[0]["price"], 2)
        target_day_price = round(graph_data[-1]["price"], 2)
        
        earnings_today = day_1_price * request.quantity_kg
        earnings_after_n_days = target_day_price * request.quantity_kg
        
        profit_loss_per_kg = round(target_day_price - day_1_price, 2)
        total_change_percent = ((target_day_price - day_1_price) / day_1_price) * 100 if day_1_price != 0 else 0

        # Compute real confidence from RandomForest individual tree predictions
        today_input = pd.DataFrame([{
            'day_of_year': day_of_year_val,
            'crop_encoded': crop_encoded,
            'rainfall': rain_val,
            'temperature': temp_val,
            'humidity': hum_val
        }])
        tree_predictions = np.array([tree.predict(today_input)[0] for tree in price_model.estimators_])
        std_dev = float(np.std(tree_predictions))
        mean_pred = float(np.mean(tree_predictions))
        cv = std_dev / mean_pred if mean_pred != 0 else 0
        confidence_pct = max(0, min(100, round((1 - cv) * 100, 1)))
        confidence = f"{confidence_pct}%"
        
        # Make a recommendation based on trend
        if total_change_percent > 2:
            trend = "Rising"
            action = "WAIT"
            recommendation = "WAIT 🚀"
            reason = f"Prices will increase over the next {request.number_of_days} days."
        elif total_change_percent < -2:
            trend = "Falling"
            action = "SELL TODAY"
            recommendation = "SELL NOW ⚡"
            reason = f"Prices will decrease over the next {request.number_of_days} days."
        else:
            trend = "Stable"
            action = "SELL PARTIALLY"
            recommendation = "HOLD / SELL PARTIALLY ⚖️"
            reason = "Market seems stable. Sell a portion if cash needed."

        return {
            "day_1_price": day_1_price,
            "target_day_price": target_day_price,
            "target_day": request.number_of_days,
            "quantity_kg": request.quantity_kg,
            "profit_loss_per_kg": profit_loss_per_kg,
            "best_day": best_day_name,
            "worst_day": worst_day_name,
            "trend": trend,
            "action": action,
            "confidence": confidence,
            "recommendation": recommendation,
            "reason": reason,
            "mandi_location": request.mandi_location,
            "graph_data": graph_data
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/detect_disease")
async def detect_disease(file: UploadFile = File(...)):
    if disease_model is None:
        return {"error": "Disease detection model is not loaded. Please ensure 'models/disease_model.pth' exists."}

    try:
        import torch
        from torchvision import transforms

        content = await file.read()

        # Preprocess the image for the PyTorch CNN model
        image = Image.open(io.BytesIO(content)).convert("RGB")

        preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        img_tensor = preprocess(image).unsqueeze(0)  # Add batch dimension

        # Run real model inference
        with torch.no_grad():
            outputs = disease_model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence_val, class_idx = torch.max(probabilities, dim=1)
            confidence = float(confidence_val.item()) * 100
            class_idx = int(class_idx.item())

        # Map index to class name
        if class_idx < len(DISEASE_CLASS_NAMES):
            raw_class_name = DISEASE_CLASS_NAMES[class_idx]
        else:
            raw_class_name = f"Unknown_class_{class_idx}"

        disease_display = format_disease_name(raw_class_name)
        action = get_disease_action(raw_class_name)

        return {
            "filename": file.filename,
            "disease": disease_display,
            "confidence": round(confidence, 2),
            "action": action
        }
    except Exception as e:
        return {"error": f"Disease detection failed: {str(e)}"}

@app.get("/api/dashboard_summary")
def get_dashboard_summary(location: str = "Delhi", crop: str = "Crop"):
    temperature, humidity, _, condition = get_real_weather(location)
    crop_name = crop if crop and crop != "Your Crop" else "Crop"

    weather_data = {
        "temperature": round(temperature),
        "condition": condition,
        "humidity": round(humidity)
    }

    return {
        "weather": weather_data,
        "alerts": [
            f"Favorable conditions for {crop_name} farming.",
            "Stay updated with regular market trends."
        ],
        "market": f"Stable trends in {crop_name} prices."
    }

@app.get("/api/schemes")
def get_schemes():
    return [
        {"id": 1, "name": "PM KISAN Samman Nidhi", "description": "Provides income support to all landholding farmers' families in the country.", "amount": "₹6,000/year", "link": "https://pmkisan.gov.in/"},
        {"id": 2, "name": "Pradhan Mantri Fasal Bima Yojana", "description": "Crop insurance scheme to provide financial support in case of crop failure.", "amount": "Varies by crop", "link": "https://pmfby.gov.in/"},
        {"id": 3, "name": "Soil Health Card Scheme", "description": "Provides information to farmers on nutrient status of their soil along with recommendations.", "amount": "Free Assessment", "link": "https://soilhealth.dac.gov.in/"}
    ]

# ==========================================
# KrishiDeep: Feature 1 (Voice AI) & Feature 2 (Weather Dashboard)
# ==========================================
try:
    from weather_service import get_complete_weather_dashboard
    from sarvam_service import speech_to_text, text_to_speech, LANGUAGE_REGISTRY, SARVAM_SUPPORTED_CODES, resolve_language_code
    from assistant_service import answer_farmer_query
except ImportError:
    from backend.weather_service import get_complete_weather_dashboard
    from backend.sarvam_service import speech_to_text, text_to_speech, LANGUAGE_REGISTRY, SARVAM_SUPPORTED_CODES, resolve_language_code
    from backend.assistant_service import answer_farmer_query

class AssistantRequest(BaseModel):
    question: str
    language_code: str = "hi-IN"
    location: str = "Punjab"
    crop: str = "Wheat"
    farm_size_acres: float = 3.0
    crop_loss_pct: float = 35.0

class TTSRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    speaker: str = None

@app.get("/api/languages")
def get_languages():
    return {
        "languages": [
            {
                "key": k,
                "code": v["code"],
                "name": v["name"],
                "native": v["native"],
                "voice_engine": v["voice_engine"],
                "region": v["region"],
                "is_sarvam_native": (v["voice_engine"] == "sarvam")
            }
            for k, v in LANGUAGE_REGISTRY.items()
        ],
        "total_count": len(LANGUAGE_REGISTRY),
        "scheduled_count": 22
    }

@app.post("/api/voice/stt")
async def handle_speech_to_text(file: UploadFile = File(...), language_code: str = "hi-IN"):
    try:
        content = await file.read()
        result = speech_to_text(content, filename=file.filename or "recording.wav", requested_lang=language_code)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/voice/tts")
def handle_text_to_speech(req: TTSRequest):
    try:
        return text_to_speech(req.text, requested_lang=req.language_code, speaker=req.speaker)
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/assistant/ask")
def handle_assistant_query(req: AssistantRequest):
    try:
        return answer_farmer_query(
            question=req.question,
            language_code=req.language_code,
            location=req.location,
            crop=req.crop,
            farm_size_acres=req.farm_size_acres,
            crop_loss_pct=req.crop_loss_pct
        )
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/weather/daily")
def handle_daily_weather(location: str = "Delhi", crop: str = "Wheat"):
    try:
        return get_complete_weather_dashboard(location=location, crop=crop)
    except Exception as e:
        return {"error": str(e)}

