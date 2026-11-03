import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Scan, TrendingUp, BookOpen, Mic, Bell, Sparkles, MapPin, Sprout } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DiseaseDetection from './pages/DiseaseDetection';
import PricePrediction from './pages/PricePrediction';
import GovtSchemes from './pages/GovtSchemes';
import Onboarding from './pages/Onboarding';
import LanguageSelector from './components/LanguageSelector';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import NotificationDrawer from './components/NotificationDrawer';
import { getTranslation, LANGUAGES } from './localization/translations';
import { getDailyWeather } from './api';

const Sidebar = ({ currentLang }) => {
  return (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
          🌾
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#166534' }}>KrishiDeep</h2>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>कृषिदीप AI Assistant</span>
        </div>
      </div>

      <nav>
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Home size={20} /> {getTranslation(currentLang, 'dashboard')}
        </NavLink>
        <NavLink to="/detect" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <Scan size={20} /> {getTranslation(currentLang, 'diseaseDetection')}
        </NavLink>
        <NavLink to="/predict" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <TrendingUp size={20} /> {getTranslation(currentLang, 'pricePrediction')}
        </NavLink>
        <NavLink to="/schemes" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          <BookOpen size={20} /> {getTranslation(currentLang, 'govtSchemes')}
        </NavLink>
      </nav>

      {/* Language badge in sidebar */}
      <div style={{ marginTop: 'auto', padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '0.75rem', border: '1px solid #DCFCE7' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={14} /> 22 Indian Languages
        </div>
        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#166534' }}>
          Voice interaction powered by Sarvam AI Neural Engine
        </p>
      </div>
    </div>
  );
};

const Header = ({
  currentLang,
  onSelectLanguage,
  onOpenVoiceAssistant,
  onToggleNotifications,
  unreadCount
}) => {
  const location = useLocation();
  const titleMap = {
    '/dashboard': getTranslation(currentLang, 'dashboard'),
    '/detect': getTranslation(currentLang, 'diseaseDetection'),
    '/predict': getTranslation(currentLang, 'pricePrediction'),
    '/schemes': getTranslation(currentLang, 'govtSchemes')
  };

  const userLoc = localStorage.getItem("userLocation") || "Punjab";
  const userCrop = localStorage.getItem("selectedCrop") || "Wheat";

  return (
    <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
          {titleMap[location.pathname] || 'KrishiDeep'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.82rem', color: '#64748B' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={13} color="#16A34A" /> {userLoc}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sprout size={13} color="#16A34A" /> {userCrop}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Prominent Voice Assistant Button in Header */}
        <button
          onClick={onOpenVoiceAssistant}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16A34A',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)',
            transition: 'transform 0.15s ease'
          }}
          title="Open Voice Assistant"
        >
          <Mic size={18} />
          <span>{getTranslation(currentLang, 'voiceAssistant')}</span>
        </button>

        {/* 22-Language Selector */}
        <LanguageSelector currentLang={currentLang} onSelectLanguage={onSelectLanguage} />

        {/* Notification Bell */}
        <button
          onClick={onToggleNotifications}
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1E293B'
          }}
          title="Daily Weather Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#DC2626',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

function MainApp() {
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("appLanguage") || "hi");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const location = localStorage.getItem("userLocation") || "Punjab";
  const crop = localStorage.getItem("selectedCrop") || "Wheat";
  const farmSize = parseFloat(localStorage.getItem("farmSizeAcres") || "3.5");
  const cropLoss = parseFloat(localStorage.getItem("cropLossPct") || "35.0");

  useEffect(() => {
    // Fetch notifications for the location
    getDailyWeather(location, crop)
      .then((data) => {
        if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch((e) => console.error(e));
  }, [location, crop]);

  const handleSelectLang = (langKey) => {
    setCurrentLang(langKey);
    localStorage.setItem("appLanguage", langKey);
  };

  return (
    <div className="app-container">
      <Sidebar currentLang={currentLang} />
      <div className="main-content">
        <Header
          currentLang={currentLang}
          onSelectLanguage={handleSelectLang}
          onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
          onToggleNotifications={() => setIsNotifOpen(!isNotifOpen)}
          unreadCount={notifications.length}
        />
        <div className="page-content">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  currentLang={currentLang}
                  onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                />
              }
            />
            <Route path="/detect" element={<DiseaseDetection />} />
            <Route path="/predict" element={<PricePrediction />} />
            <Route path="/schemes" element={<GovtSchemes />} />
          </Routes>
        </div>
      </div>

      {/* Floating Action Microphone Button (Always accessible) */}
      <button
        onClick={() => setIsVoiceOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          backgroundColor: '#16A34A',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(22, 163, 74, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 900,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="fab-pulse"
        title="Tap to Speak with KrishiDeep Voice AI"
      >
        <Mic size={30} />
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        currentLang={currentLang}
        location={location}
        crop={crop}
        farmSizeAcres={farmSize}
        cropLossPct={cropLoss}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        currentLang={currentLang}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
