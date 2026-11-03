import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sprout, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { getTranslation } from '../localization/translations';

const locationCropMap = {
  "punjab": ["Wheat", "Rice"],
  "haryana": ["Wheat", "Rice"],
  "maharashtra": ["Cotton", "Corn", "Sugarcane"],
  "gujarat": ["Cotton", "Groundnut"],
  "andhra pradesh": ["Rice", "Corn", "Cotton"],
  "telangana": ["Rice", "Cotton", "Corn"],
  "karnataka": ["Corn", "Cotton", "Rice"],
  "madhya pradesh": ["Wheat", "Corn", "Soybean"],
  "uttar pradesh": ["Wheat", "Rice", "Sugarcane", "Potato"],
  "tamil nadu": ["Rice", "Sugarcane", "Groundnut"],
  "west bengal": ["Rice", "Jute", "Potato"],
  "odisha": ["Rice", "Pulses"]
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("appLanguage") || "hi");
  const [location, setLocation] = useState(localStorage.getItem("userLocation") || 'Ludhiana, Punjab');
  const [suggestedCrops, setSuggestedCrops] = useState(["Wheat", "Rice", "Cotton", "Corn"]);
  const [selectedCrop, setSelectedCrop] = useState(localStorage.getItem("selectedCrop") || 'Wheat');
  const [farmSize, setFarmSize] = useState(localStorage.getItem("farmSizeAcres") || '3.5');

  const handleLocationBlur = () => {
    if (!location) {
      setSuggestedCrops(["Wheat", "Rice", "Cotton", "Corn"]);
      setSelectedCrop("Wheat");
      return;
    }
    const locLower = location.toLowerCase();
    let found = false;
    for (const [state, crops] of Object.entries(locationCropMap)) {
      if (locLower.includes(state)) {
        setSuggestedCrops(crops);
        setSelectedCrop(crops[0]);
        found = true;
        break;
      }
    }
    if (!found) {
      setSuggestedCrops(["Wheat", "Rice", "Corn", "Cotton"]);
      setSelectedCrop("Wheat");
    }
  };

  const handleProceed = () => {
    if (location && selectedCrop) {
      localStorage.setItem("userLocation", location);
      localStorage.setItem("selectedCrop", selectedCrop);
      localStorage.setItem("farmSizeAcres", farmSize || "3.5");
      localStorage.setItem("cropLossPct", "35.0");
      localStorage.setItem("appLanguage", currentLang);
      navigate("/dashboard");
    } else {
      alert("Please enter a location and select a crop.");
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <LanguageSelector currentLang={currentLang} onSelectLanguage={(l) => {
          setCurrentLang(l);
          localStorage.setItem("appLanguage", l);
        }} />
      </div>

      <div className="card" style={{ padding: '2.5rem', borderRadius: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <Sparkles size={16} /> 22-Language Voice AI & Live Weather
          </div>
          <h1 style={{ color: '#166534', margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: 800 }}>
            KrishiDeep (कृषिदीप)
          </h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem', margin: 0 }}>
            {getTranslation(currentLang, 'appTagline')}
          </p>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            <MapPin size={20} color="#16A34A" /> {getTranslation(currentLang, 'farmLocation')} (Village / District / State)
          </label>
          <input 
            type="text" 
            placeholder="e.g. Ludhiana, Punjab or Warangal, Telangana"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleLocationBlur}
            style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '1.05rem', borderRadius: '0.6rem', border: '1.5px solid #CBD5E1', outline: 'none' }}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            <ShieldCheck size={20} color="#16A34A" /> {getTranslation(currentLang, 'farmSize')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input 
              type="number" 
              step="0.5"
              min="0.5"
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              style={{ width: '150px', padding: '0.85rem 1rem', fontSize: '1.05rem', borderRadius: '0.6rem', border: '1.5px solid #CBD5E1', outline: 'none' }}
            />
            <span style={{ fontWeight: 600, color: '#475569' }}>{getTranslation(currentLang, 'acres')}</span>
          </div>
        </div>

        {suggestedCrops.length > 0 && (
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1E293B' }}>
              <Sprout size={20} color="#16A34A" /> {getTranslation(currentLang, 'selectedCrop')}
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {suggestedCrops.map(crop => (
                <div 
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  style={{
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.6rem', 
                    cursor: 'pointer',
                    border: selectedCrop === crop ? '2px solid #16A34A' : '1px solid #E2E8F0',
                    backgroundColor: selectedCrop === crop ? '#F0FDF4' : 'white',
                    fontWeight: selectedCrop === crop ? 700 : 500,
                    color: selectedCrop === crop ? '#15803D' : '#334155',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🌾 {crop}
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          className="btn" 
          onClick={handleProceed}
          disabled={!location || !selectedCrop}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.15rem',
            fontWeight: 700,
            justifyContent: 'center',
            backgroundColor: '#16A34A',
            color: 'white',
            borderRadius: '0.75rem',
            cursor: (!location || !selectedCrop) ? 'not-allowed' : 'pointer',
            opacity: (!location || !selectedCrop) ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
          }}
        >
          {getTranslation(currentLang, 'dashboard')} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
