import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Existing Features (Preserved)
export const getDashboardSummary = async (location, crop) => {
  const response = await api.get('/dashboard_summary', { params: { location, crop }});
  return response.data;
};

export const getSchemes = async () => {
  const response = await api.get('/schemes');
  return response.data;
};

export const predictPrice = async (data) => {
  const response = await api.post('/predict_price', data);
  return response.data;
};

export const detectDisease = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/detect_disease', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// ==========================================
// FEATURE 1: 22-Language Voice AI Assistant
// ==========================================
export const getLanguages = async () => {
  const response = await api.get('/languages');
  return response.data;
};

export const transcribeAudio = async (audioBlob, languageCode = 'hi-IN') => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  
  const response = await api.post('/voice/stt', formData, {
    params: { language_code: languageCode },
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const synthesizeSpeech = async (text, languageCode = 'hi-IN', speaker = null) => {
  const response = await api.post('/voice/tts', {
    text,
    language_code: languageCode,
    speaker
  });
  return response.data;
};

export const askAssistant = async ({ question, languageCode, location, crop, farmSizeAcres, cropLossPct }) => {
  const response = await api.post('/assistant/ask', {
    question,
    language_code: languageCode,
    location,
    crop,
    farm_size_acres: farmSizeAcres || 3.0,
    crop_loss_pct: cropLossPct || 35.0
  });
  return response.data;
};

// ==========================================
// FEATURE 2: Daily Weather Dashboard
// ==========================================
export const getDailyWeather = async (location, crop) => {
  const response = await api.get('/weather/daily', {
    params: { location, crop }
  });
  return response.data;
};

export default api;
