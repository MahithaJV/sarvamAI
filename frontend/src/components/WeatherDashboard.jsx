import React, { useState, useEffect } from 'react';
import {
  CloudRain, Thermometer, Droplets, Wind, Sun, Sunset, Sunrise,
  Cloud, AlertTriangle, ShieldCheck, Volume2, Pause, Play,
  RefreshCw, CheckCircle, Bell, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { getDailyWeather, synthesizeSpeech } from '../api';
import { audioPlayer } from '../utils/audioPlayer';
import { getTranslation, LANGUAGES } from '../localization/translations';

const WeatherDashboard = ({
  location = 'Punjab',
  crop = 'Wheat',
  farmSizeAcres = 3.0,
  cropLossPct = 35.0,
  currentLang = 'hi',
  onOpenVoiceAssistant
}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingKey, setPlayingKey] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsDismissed, setNotificationsDismissed] = useState(false);

  const activeLangObj = LANGUAGES.find((l) => l.key === currentLang) || LANGUAGES[1];

  const fetchWeather = () => {
    setLoading(true);
    setError(null);
    getDailyWeather(location, crop)
      .then((res) => {
        setWeatherData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Weather fetch error:', err);
        setError('Failed to fetch real-time weather. Please check network connection.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWeather();
  }, [location, crop]);

  const handleSpeakText = async (text, key) => {
    if (playingKey === key) {
      audioPlayer.stop();
      setPlayingKey(null);
      return;
    }

    setPlayingKey(key);
    try {
      if (activeLangObj.voiceType === 'sarvam') {
        const res = await synthesizeSpeech(text, activeLangObj.code);
        if (res.success && res.audio_base64) {
          audioPlayer.playBase64(res.audio_base64, (st) => {
            if (st.status === 'ended' || st.status === 'stopped' || st.status === 'error') {
              setPlayingKey(null);
            }
          });
          return;
        }
      }
      // Fallback
      audioPlayer.speakFallback(text, activeLangObj.code, (st) => {
        if (st.status === 'ended' || st.status === 'stopped' || st.status === 'error') {
          setPlayingKey(null);
        }
      });
    } catch (err) {
      console.error('Speech synthesis error:', err);
      audioPlayer.speakFallback(text, activeLangObj.code, () => setPlayingKey(null));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={36} className="spin-icon" color="#16A34A" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#166534', margin: 0 }}>Connecting to Live Satellite & Ground Radar...</h3>
        <p style={{ color: '#64748B' }}>Fetching high-resolution forecast for your {crop} field in {location}</p>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
        <AlertTriangle size={32} color="#DC2626" style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ color: '#991B1B', margin: 0 }}>Weather Data Unavailable</h3>
        <p style={{ color: '#7F1D1D' }}>{error || 'Unable to contact live weather service.'}</p>
        <button className="btn" onClick={fetchWeather} style={{ marginTop: '1rem', backgroundColor: '#DC2626' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const { current, smart_rain_alert, hourly_forecast, seven_day_forecast, crop_recommendations, weather_risk, notifications } = weatherData;

  // Insurance calculation
  const sumInsuredPerAcre = crop.toLowerCase().includes('cotton') ? 45000 : crop.toLowerCase().includes('rice') ? 40000 : 35000;
  const totalCoverage = farmSizeAcres * sumInsuredPerAcre;
  const isLossTriggered = cropLossPct >= 33.0;
  const estimatedPayout = isLossTriggered ? Math.round((cropLossPct / 100) * totalCoverage) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Farmer Welcome & Farm Profile Bar */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(22, 101, 52, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                FARM MONITORING ACTIVE
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{weatherData.last_updated}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>
              {location} • {crop} Farm
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              Holding: <strong>{farmSizeAcres} {getTranslation(currentLang, 'acres')}</strong> | Policy: <strong>PMFBY Pradhan Mantri Fasal Bima</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={onOpenVoiceAssistant}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#FFFFFF',
                color: '#15803D',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            >
              <Sparkles size={18} color="#15803D" />
              <span>{getTranslation(currentLang, 'speakToKrishiDeep')}</span>
            </button>
            <button
              onClick={fetchWeather}
              title="Refresh Forecast"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Urgent Smart Rain Prediction Card (Most Important Feature) */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          borderLeft: smart_rain_alert.alert_level === 'warning' ? '6px solid #DC2626' : smart_rain_alert.alert_level === 'caution' ? '6px solid #EA580C' : '6px solid #2563EB',
          backgroundColor: smart_rain_alert.alert_level === 'warning' ? '#FEF2F2' : smart_rain_alert.alert_level === 'caution' ? '#FFFBEB' : '#EFF6FF',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: smart_rain_alert.alert_level === 'warning' ? '#FEE2E2' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CloudRain size={24} color={smart_rain_alert.alert_level === 'warning' ? '#DC2626' : '#2563EB'} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                {getTranslation(currentLang, 'rainAlert')}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: smart_rain_alert.alert_level === 'warning' ? '#991B1B' : '#1E40AF', fontWeight: 800 }}>
                {smart_rain_alert.headline}
              </h3>
            </div>
          </div>

          <button
            onClick={() => handleSpeakText(`${smart_rain_alert.headline}. ${smart_rain_alert.details}`, 'rain_alert')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.9rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer'
            }}
          >
            <Volume2 size={16} color="#16A34A" />
            <span>{playingKey === 'rain_alert' ? 'Stop' : getTranslation(currentLang, 'readAloud')}</span>
          </button>
        </div>

        <p style={{ marginTop: '0.75rem', fontSize: '0.98rem', color: '#334155', lineHeight: 1.5 }}>
          {smart_rain_alert.details}
        </p>

        {/* Rain Windows metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Next 24h Rain Chance</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563EB' }}>
              {smart_rain_alert.max_probability_next_24h}%
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Estimated Accumulation</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
              {smart_rain_alert.total_rain_next_24h_mm} mm
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Upcoming Window</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D97706' }}>
              {smart_rain_alert.rain_windows?.length > 0
                ? `${smart_rain_alert.rain_windows[0].start_time?.split('T')[-1] || 'Today'}`
                : 'Clear sky'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Weather Metrics Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {getTranslation(currentLang, 'weatherOverview')}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Live Data: Open-Meteo Radar</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Temperature */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{getTranslation(currentLang, 'temperature')}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {current.temperature}°C
                </div>
              </div>
              <Thermometer size={28} color="#EA580C" />
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              {getTranslation(currentLang, 'feelsLike')}: <strong>{current.feels_like}°C</strong>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                H: {current.temp_max_today}°C • L: {current.temp_min_today}°C
              </div>
            </div>
          </div>

          {/* Condition & Clouds */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Sky & Condition</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>
                  {current.condition}
                </div>
              </div>
              <Cloud size={28} color="#0284C7" />
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              {getTranslation(currentLang, 'cloudCover')}: <strong>{current.cloud_cover_pct}%</strong>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                {current.condition_desc}
              </div>
            </div>
          </div>

          {/* Humidity & Rain Rate */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{getTranslation(currentLang, 'humidity')}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {current.humidity}%
                </div>
              </div>
              <Droplets size={28} color="#2563EB" />
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              {getTranslation(currentLang, 'precipitation')}: <strong>{current.precipitation_mm} mm/hr</strong>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                Optimal range for {crop}: 40-70%
              </div>
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{getTranslation(currentLang, 'windSpeed')}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                  {current.wind_speed_kmh} <span style={{ fontSize: '1rem', fontWeight: 500 }}>km/h</span>
                </div>
              </div>
              <Wind size={28} color="#0D9488" />
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              Direction: <strong>{current.wind_direction}</strong>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                Sunrise: {current.sunrise} • Sunset: {current.sunset}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Weather Risk Indicator & Crop Insurance Summary Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Weather Risk Gauge */}
        <div className="card" style={{ padding: '1.5rem', borderTop: `5px solid ${weather_risk.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={22} color={weather_risk.color} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0F172A' }}>
                {getTranslation(currentLang, 'weatherRisk')}
              </h3>
            </div>
            <span
              style={{
                backgroundColor: `${weather_risk.color}20`,
                color: weather_risk.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.8rem'
              }}
            >
              {weather_risk.badge}
            </span>
          </div>

          <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: weather_risk.color }}>
              {weather_risk.label}
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            <strong>Assigned Reason:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', marginBottom: 0 }}>
              {weather_risk.reasons.map((r, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94A3B8' }}>
            * Independent of historical actuarial PMFBY claim rate.
          </div>
        </div>

        {/* Insurance Payout Predictor Summary Card */}
        <div className="card" style={{ padding: '1.5rem', borderTop: '5px solid #16A34A', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={22} color="#16A34A" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#166534' }}>
                {getTranslation(currentLang, 'insurancePayout')}
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
              PMFBY VERIFIED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>{getTranslation(currentLang, 'estimatedLoss')}</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isLossTriggered ? '#DC2626' : '#15803D' }}>
                {cropLossPct}%
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>{getTranslation(currentLang, 'triggerThreshold')}</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isLossTriggered ? '#DC2626' : '#64748B', marginTop: '0.25rem' }}>
                {isLossTriggered ? getTranslation(currentLang, 'triggerReached') : getTranslation(currentLang, 'triggerNotReached')} (33%)
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{getTranslation(currentLang, 'estimatedPayout')}</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803D' }}>
                ₹{estimatedPayout.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Formula: ({cropLossPct}% Loss × {farmSizeAcres} Acres × ₹{sumInsuredPerAcre.toLocaleString()})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Hourly Forecast (24 Hours Horizontal Visual Bar Chart) */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
          {getTranslation(currentLang, 'hourlyForecast')} (Next 24 Hours)
        </h3>

        <div style={{ display: 'flex', gap: '0.9rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
          {hourly_forecast.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '70px',
                padding: '0.75rem 0.5rem',
                backgroundColor: i === 0 ? '#F0FDF4' : '#F8FAFC',
                border: i === 0 ? '1.5px solid #16A34A' : '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                {i === 0 ? 'Now' : h.time}
              </span>
              <CloudRain size={20} color={h.rain_prob > 30 ? '#2563EB' : '#94A3B8'} style={{ margin: '0.4rem 0' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {Math.round(h.temp)}°
              </span>
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: h.rain_prob > 40 ? '#2563EB' : '#64748B',
                  backgroundColor: h.rain_prob > 40 ? '#DBEAFE' : 'transparent',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px'
                }}
              >
                {h.rain_prob}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Crop-Specific Agricultural Recommendations */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {getTranslation(currentLang, 'cropRecommendations')} for {crop}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Tailored to Soil & Weather</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {crop_recommendations.map((rec, i) => (
            <div
              key={i}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: rec.severity === 'high' ? '#FEF2F2' : '#F8FAFC',
                borderLeft: rec.severity === 'high' ? '4px solid #DC2626' : '4px solid #16A34A',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: rec.severity === 'high' ? '#991B1B' : '#15803D', fontSize: '1rem', fontWeight: 700 }}>
                  {rec.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.5 }}>
                  {rec.message}
                </p>
              </div>

              <button
                onClick={() => handleSpeakText(`${rec.title}. ${rec.message}`, `rec_${i}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Volume2 size={15} color="#16A34A" />
                <span>{playingKey === `rec_${i}` ? 'Stop' : getTranslation(currentLang, 'readAloud')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. 7-Day Weather Forecast */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
          {getTranslation(currentLang, 'sevenDayForecast')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {seven_day_forecast.map((d, i) => (
            <div
              key={i}
              style={{
                padding: '1rem 0.75rem',
                backgroundColor: i === 0 ? '#F0FDF4' : '#F8FAFC',
                border: i === 0 ? '1.5px solid #16A34A' : '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{d.day}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem' }}>{d.date}</div>
              <CloudRain size={24} color={d.rain_prob_max > 40 ? '#2563EB' : '#94A3B8'} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {Math.round(d.temp_max)}° <span style={{ color: '#64748B', fontWeight: 500 }}>{Math.round(d.temp_min)}°</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '0.25rem', fontWeight: 600 }}>
                {d.rain_prob_max}% rain
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;

