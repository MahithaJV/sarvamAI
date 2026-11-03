# KrishiDeep (कृषिदीप) – A Farmer-Friendly Crop Insurance Payout Predictor & Multilingual Voice AI

KrishiDeep is an AI-powered agricultural advisory platform designed to assist Indian farmers in understanding crop insurance claims (PMFBY), predicting market prices, diagnosing crop diseases, and preparing for weather risks through real-time meteorological forecasts and localized voice interaction across **all 22 scheduled Indian languages**.

---

## 🌟 Two Major AI Features

### 🎙️ Feature 1: 22-Language Multilingual Voice AI Assistant
- **Powered by Sarvam AI (`api.sarvam.ai`)**:
  - **Speech-to-Text (STT)**: Uses Sarvam `saaras:v3` with browser PCM 16-bit 16kHz WAV audio capture. Supports automatic language identification.
  - **Text-to-Speech (TTS)**: Uses Sarvam `bulbul:v3` neural voice synthesis with native Indian speakers (`aditya`, `kavitha`, `gokul`, `chaitra`, `ishita`, `roopa`, `pooja`, `anand`) with playback controls (Play, Pause, Resume, Replay).
  - **Translation**: Uses Sarvam `mayura:v1` for natural vernacular translation.
  - **All 22 Scheduled Indian Languages Supported**: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, Urdu (+ English).
  - **Grounded AI Answers**: Calculates actual PMFBY insurance payouts ($\text{Loss \%} \times \text{Acres} \times \text{Sum Insured}$), checks rainfall deficit trigger thresholds, and answers questions using live weather data.

### 🌦️ Feature 2: Daily Smart Weather Dashboard & Agricultural Alerts
- **Live Meteorological Feed**: Connects to Open-Meteo for real-time temperature, feels-like, humidity, precipitation amount, cloud cover, and wind speed/direction.
- **Smart Rain Prediction**: Identifies upcoming rain windows (e.g., *"Rain expected within the next 3 hours between 3 PM and 6 PM with 75% probability"*), estimated mm rainfall, and severe weather warnings.
- **Hourly Forecast**: 24-hour horizontal forecast with rain probability percentages.
- **7-Day Weather Outlook**: Daily temperature curves and rain sums.
- **Crop-Specific Recommendations**: Actionable precautions tailored to crop (Wheat, Rice, Cotton, Corn, Tomato, etc.) for drainage management, heat stress, wind bracing, and pest prevention.
- **Weather Risk Indicator**: Color-coded Green / Yellow / Orange / Red indicator with transparent reasoning.
- **Daily Notification Center**: Audio announcement for imminent rain, frost, and high-wind warnings.

---

## 🛠️ Architecture & Tech Stack

```
├── backend/
│   ├── main.py                  # FastAPI server with all endpoints
│   ├── weather_service.py       # Live Open-Meteo weather engine, smart rain analysis, crop advisory
│   ├── sarvam_service.py        # Sarvam AI STT (saaras:v3), TTS (bulbul:v3), Translation (mayura:v1)
│   ├── assistant_service.py     # Grounded Q&A engine for PMFBY insurance & farm data
│   ├── models/                  # ML models (Random Forest price model & crop encoder)
│   ├── data/                    # Crop prices dataset
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WeatherDashboard.jsx    # Complete daily weather dashboard & PMFBY summary
│   │   │   ├── VoiceAssistantModal.jsx # Voice AI recording, editing & chat dialogue
│   │   │   ├── LanguageSelector.jsx    # 22-language switcher with Sarvam vs Fallback badges
│   │   │   └── NotificationDrawer.jsx  # Notification center with audio announcement
│   │   ├── localization/
│   │   │   └── translations.js         # Full UI localization dictionary for 22 languages
│   │   ├── utils/
│   │   │   ├── audioRecorder.js        # Web Audio API 16kHz PCM WAV recorder
│   │   │   └── audioPlayer.js          # Base64 audio player & Web Speech fallback
│   │   ├── pages/                      # Dashboard, Onboarding, DiseaseDetection, PricePrediction
│   │   └── api.js                      # Axios client connecting to backend
│   └── package.json
```

---

## 🚀 Setup & Running Locally

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

Start the backend:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Interactive API docs available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`
