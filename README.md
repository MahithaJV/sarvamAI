# 🌾 KrishiDeep (कृषिदीप)
### AI-Powered Crop Insurance Intelligence, Agricultural Advisory & Multilingual Voice Assistant

**Making agricultural intelligence accessible to every Indian farmer through AI, voice technology, and real-time weather insights.**
<img width="704" height="696" alt="image" src="https://github.com/user-attachments/assets/154b6686-2d60-4cf9-a45d-e5f538c7e5b8" />


KrishiDeep is an AI-powered agricultural advisory platform designed to empower Indian farmers with accessible, localized, and intelligent agricultural information.

The platform combines Machine Learning, multilingual Voice AI, weather intelligence, and agricultural advisory services to help farmers make informed decisions about crop insurance, market prices, crop health, and weather-related risks.

With support for all **22 Scheduled Indian Languages**, KrishiDeep aims to bridge the digital divide by allowing farmers to interact with agricultural technology in their native languages.

---
<img width="1278" height="711" alt="image" src="https://github.com/user-attachments/assets/cc431484-5c53-4239-8d00-9f198b6ccc17" />
<img width="656" height="629" alt="image" src="https://github.com/user-attachments/assets/78320ee4-15ca-455b-9d02-beeff087f811" />
<img width="1263" height="622" alt="image" src="https://github.com/user-attachments/assets/b166b169-d84c-4d0a-b92d-e4a3caa0900a" />
![Uploading image.png…]()


## 🌟 Key Features

### 🎙️ 1. Multilingual Voice AI Assistant – 22 Indian Languages

A voice-first agricultural assistant that allows farmers to communicate naturally in their preferred language.

**Powered by Sarvam AI**

| Capability | Model | Purpose |
|---|---|---|
| Speech-to-Text | `saaras:v3` | Converts spoken farmer queries into text |
| Text-to-Speech | `bulbul:v3` | Generates natural-sounding Indian voice responses |
| Machine Translation | `mayura:v1` | Translates agricultural information into regional languages |

**Implementation Highlights:**
- Browser-based audio recording using Web Audio API.
- 16 kHz, 16-bit, mono PCM WAV audio processing.
- Automatic language identification through speech recognition.
- Native regional voice selection.
- AI-generated spoken responses.
- Audio playback controls: Play, Pause, Resume, Replay, and Stop.
- Live listening animation using RMS audio volume levels.
- Translation of agricultural recommendations and assistant responses.
- Fallback speech synthesis using the browser's Web Speech API when a dedicated Sarvam voice is unavailable.

**Language Support**

Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, and Urdu.

English is also supported as an additional interface language.

**Voice Engine Transparency:**
- Sarvam AI Neural Engine – for supported neural voices.
- Web Speech Engine – fallback for languages without an available dedicated Sarvam voice.

### 🌦️ 2. Daily Smart Weather Dashboard & Agricultural Alerts

An intelligent weather dashboard that helps farmers understand current conditions and prepare for upcoming weather changes.

**Powered by Open-Meteo API**

**Current Weather Monitoring**
- Temperature and feels-like temperature.
- Humidity.
- Precipitation.
- Cloud cover.
- Wind speed and direction.

**Smart Rain Prediction**
- Identifies upcoming rainfall windows.
- Displays estimated rainfall amounts.
- Shows hourly precipitation probabilities.
- Highlights potentially severe weather conditions.
- Provides advance warnings for approaching rain.

**24-Hour Hourly Forecast**
- Horizontal hourly weather timeline.
- Temperature variations.
- Rain probability percentages.
- Expected precipitation.

**7-Day Weather Outlook**
- Daily maximum and minimum temperatures.
- Rainfall predictions.
- Weather trend visualization.
- Weekly agricultural weather planning.

**Crop-Specific Recommendations**

Provides actionable recommendations based on weather conditions and selected crops, including:

| Crop | Example Advisory |
|---|---|
| Rice | Water management and drainage precautions |
| Wheat | Moisture and rainfall management |
| Cotton | Wind protection and pest prevention |
| Corn | Heat stress and irrigation management |
| Tomato | Rain protection and disease prevention |

**Weather Risk Indicator**

A color-coded agricultural risk assessment:

- 🟢 Green – Low weather risk.
- 🟡 Yellow – Moderate risk.
- 🟠 Orange – High risk.
- 🔴 Red – Severe weather risk.

Each risk level includes an explanation of the underlying weather conditions.

**Daily Notification Center**
- Upcoming rainfall alerts.
- High-wind warnings.
- Frost warnings where relevant.
- Audio announcements in the selected language.
- Actionable crop protection recommendations.

---

## 🌱 Other Agricultural AI Capabilities

### 3. PMFBY Crop Insurance Payout Estimation

Helps farmers understand their potential crop insurance compensation under the Pradhan Mantri Fasal Bima Yojana (PMFBY).

Key capabilities:
- Crop insurance information.
- Cultivated area and sum-insured inputs.
- Estimated crop-loss calculations.
- Rainfall deficit and weather-trigger analysis.
- Explanation of insurance-related information through the Voice AI assistant.

The platform provides indicative estimates based on configured insurance assumptions. Actual PMFBY compensation depends on applicable scheme rules, notified crops and areas, insured values, yield assessments, and claim eligibility.

### 4. Machine Learning-Based Crop Price Prediction

Uses Machine Learning to estimate agricultural market prices and help farmers understand potential market trends.

**Technology:**
- Scikit-learn.
- Random Forest Regressor.
- Crop encoding and preprocessing.
- Historical agricultural price datasets.

Model artifacts:
- `price_model.pkl`
- `crop_encoder.pkl`

### 5. AI-Based Crop Disease Detection

Provides a dedicated interface for identifying potential crop diseases and supporting farmers with crop-health information.

### 6. Grounded Agricultural AI Assistant

The assistant combines agricultural context, insurance calculations, and weather information to generate relevant answers.

It is designed to:
- Answer agricultural questions.
- Explain insurance calculations.
- Interpret weather conditions.
- Provide crop-specific precautions.
- Deliver localized responses through multilingual voice interaction.

---

## 🏗️ System Architecture

```text
                  FARMER
                     |
                     v
          React + Vite Frontend
                     |
          +----------+-----------+
          |          |           |
          v          v           v
      Dashboard   Voice AI   Crop Services
          |          |           |
          |          v           |
          |     Audio Recording  |
          |          |           |
          |          v           |
          |      FastAPI Backend |
          |          |           |
          |     +----+-----+     |
          |     |          |     |
          |     v          v     |
          |   Sarvam     Assistant
          |     AI        Service
          |     |          |
          |     v          v
          |   STT/TTS   PMFBY + Farm
          |   Translate   Context
          |
          +----------+
                     |
                     v
              Weather Service
                     |
                     v
               Open-Meteo API
                     |
                     v
             Weather Intelligence
                     |
                     v
          Localized Farmer Alerts
```

### Voice AI Pipeline

```text
Farmer Speaks
      |
      v
Browser Microphone
      |
      v
Web Audio API
      |
      v
16 kHz PCM WAV Recording
      |
      v
FastAPI Backend
      |
      v
Sarvam Saaras v3
(Speech-to-Text)
      |
      v
Language Identification
      |
      v
Agricultural Assistant
      |
      +----------------------+
      |                      |
      v                      v
 Weather Data           PMFBY / Farm Data
      |                      |
      +----------+-----------+
                 |
                 v
          Contextual Answer
                 |
                 v
         Sarvam Mayura v1
          (Translation)
                 |
                 v
         Sarvam Bulbul v3
          (Text-to-Speech)
                 |
                 v
          Audio Response
                 |
                 v
             Farmer
```

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn, Random Forest |
| Voice AI | Sarvam AI |
| Speech-to-Text | Saaras v3 |
| Text-to-Speech | Bulbul v3 |
| Translation | Mayura v1 |
| Weather API | Open-Meteo |
| Audio Processing | Web Audio API, PCM WAV |
| Browser Speech Fallback | Web Speech API |
| API Communication | Axios |
| Data Processing | Python, Pandas, NumPy |

---

## 📁 Project Structure

```text
KrishiDeep/
│
├── backend/
│   ├── main.py
│   ├── weather_service.py
│   ├── sarvam_service.py
│   ├── assistant_service.py
│   │
│   ├── models/
│   │   ├── price_model.pkl
│   │   └── crop_encoder.pkl
│   │
│   ├── data/
│   │   └── crop_prices.csv
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WeatherDashboard.jsx
│   │   │   ├── VoiceAssistantModal.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   └── NotificationDrawer.jsx
│   │   │
│   │   ├── localization/
│   │   │   └── translations.js
│   │   │
│   │   ├── utils/
│   │   │   ├── audioRecorder.js
│   │   │   └── audioPlayer.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard
│   │   │   ├── Onboarding
│   │   │   ├── DiseaseDetection
│   │   │   └── PricePrediction
│   │   │
│   │   └── api.js
│   │
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm
- Sarvam AI API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/KrishiDeep.git

cd KrishiDeep
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

**Windows:**

```bash
venv\Scripts\activate
```

**Linux / macOS:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
SARVAM_API_KEY=your_new_sarvam_api_key
```

Keep your API credentials private. Never commit `.env` to GitHub.

### 4. Start the Backend

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 5. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Security & Configuration

- Store API keys in environment variables.
- Keep `.env` files out of version control.
- Use backend API routes for external AI service calls.
- Do not expose private API credentials in frontend JavaScript.
- Configure appropriate CORS origins before deployment.
- Validate uploaded audio and other user inputs.

---

## 💡 What Makes KrishiDeep Different?

Traditional agricultural platforms often require farmers to navigate complex interfaces, understand technical terminology, or depend on text-based information.

KrishiDeep focuses on accessibility and practical agricultural intelligence.

**Our approach:**

1. **Voice-First Interaction:** Farmers can speak naturally instead of typing complex queries.
2. **Native Language Accessibility:** Agricultural information is available across all 22 Scheduled Indian Languages.
3. **Weather-Aware Agriculture:** Weather forecasts are transformed into practical crop-specific precautions.
4. **Insurance Transparency:** Farmers can better understand potential crop insurance payouts.
5. **Machine Learning Integration:** Historical agricultural data supports market-price estimation.
6. **Localized Intelligence:** Combines weather conditions, agricultural context, and multilingual communication.

---

## 🔮 Future Enhancements

- Integration with additional government agricultural datasets.
- More accurate localized crop-yield and insurance estimation.
- Personalized farm profiles and location-based alerts.
- Offline-first support for low-connectivity rural areas.
- Integration with additional agricultural market APIs.
- Improved regional dialect and agricultural terminology support.
- Automated notifications for important agricultural events.

---

## 🌾 Vision

**KrishiDeep – Technology that speaks the farmer's language.**

Our vision is to make advanced AI and agricultural intelligence accessible to every farmer, regardless of language, location, or technical knowledge.

By bringing together Machine Learning, multilingual Voice AI, weather intelligence, and agricultural advisory services, KrishiDeep aims to make farming information more accessible, understandable, and actionable.

---

**Built with ❤️ for Indian Agriculture.**

*KrishiDeep (कृषिदीप) – Empowering Farmers Through AI.*
