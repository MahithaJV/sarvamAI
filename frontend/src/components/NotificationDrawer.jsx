import React, { useState } from 'react';
import { Bell, X, Volume2, Check, AlertTriangle, CloudRain, Wind, Thermometer } from 'lucide-react';
import { audioPlayer } from '../utils/audioPlayer';
import { synthesizeSpeech } from '../api';
import { LANGUAGES } from '../localization/translations';

const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  currentLang = 'hi'
}) => {
  const [enabled, setEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeLangObj = LANGUAGES.find((l) => l.key === currentLang) || LANGUAGES[1];

  const handlePlayAll = async () => {
    if (isPlaying) {
      audioPlayer.stop();
      setIsPlaying(false);
      return;
    }

    if (!notifications || notifications.length === 0) return;

    const summaryText = notifications.map((n) => `${n.title}. ${n.message}`).join(' ');
    setIsPlaying(true);

    try {
      if (activeLangObj.voiceType === 'sarvam') {
        const res = await synthesizeSpeech(summaryText, activeLangObj.code);
        if (res.success && res.audio_base64) {
          audioPlayer.playBase64(res.audio_base64, (st) => {
            if (st.status === 'ended' || st.status === 'stopped' || st.status === 'error') {
              setIsPlaying(false);
            }
          });
          return;
        }
      }
      audioPlayer.speakFallback(summaryText, activeLangObj.code, () => setIsPlaying(false));
    } catch (err) {
      console.error('Audio announcement error:', err);
      audioPlayer.speakFallback(summaryText, activeLangObj.code, () => setIsPlaying(false));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#FFFFFF',
        boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease-out'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} color="#16A34A" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>
            Daily Notifications
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
          />
          Enable Alerts
        </label>

        {notifications.length > 0 && enabled && (
          <button
            onClick={handlePlayAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Volume2 size={14} /> {isPlaying ? 'Stop Audio' : 'Play All'}
          </button>
        )}
      </div>

      {/* Notification items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {!enabled ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
            Daily weather notifications are currently paused.
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            <Check size={36} color="#16A34A" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A' }}>All Clear</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>No severe weather alerts or rain warnings at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: n.urgency === 'high' ? '#FEF2F2' : '#EFF6FF',
                  border: n.urgency === 'high' ? '1px solid #FCA5A5' : '1px solid #BFDBFE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  {n.type === 'rain' ? (
                    <CloudRain size={16} color="#2563EB" />
                  ) : n.type === 'wind' ? (
                    <Wind size={16} color="#0D9488" />
                  ) : (
                    <Thermometer size={16} color="#DC2626" />
                  )}
                  <strong style={{ fontSize: '0.9rem', color: n.urgency === 'high' ? '#991B1B' : '#1E40AF' }}>
                    {n.title}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                  {n.message}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748B', textAlign: 'right' }}>
                  {n.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDrawer;

