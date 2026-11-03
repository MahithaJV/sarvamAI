import React, { useState, useEffect } from 'react';
import WeatherDashboard from '../components/WeatherDashboard';
import { getTranslation } from '../localization/translations';

const Dashboard = ({ currentLang = 'hi', onOpenVoiceAssistant }) => {
  const location = localStorage.getItem("userLocation") || "Punjab";
  const crop = localStorage.getItem("selectedCrop") || "Wheat";
  const farmSize = parseFloat(localStorage.getItem("farmSizeAcres") || "3.5");
  const cropLoss = parseFloat(localStorage.getItem("cropLossPct") || "35.0");

  return (
    <div className="dashboard-container" style={{ paddingBottom: '3rem' }}>
      <WeatherDashboard
        location={location}
        crop={crop}
        farmSizeAcres={farmSize}
        cropLossPct={cropLoss}
        currentLang={currentLang}
        onOpenVoiceAssistant={onOpenVoiceAssistant}
      />
    </div>
  );
};

export default Dashboard;
