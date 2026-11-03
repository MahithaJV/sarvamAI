import React, { useState } from 'react';
import { Globe, Check, Sparkles, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../localization/translations';

const LanguageSelector = ({ currentLang, onSelectLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeLangObj = LANGUAGES.find((l) => l.key === currentLang) || LANGUAGES[1]; // default Hindi

  const filteredLangs = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.native.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.9rem',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--border-color, #E2E8F0)',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontWeight: 600,
          color: 'var(--text-primary, #1E293B)',
          fontSize: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}
        title="Select from 22 Scheduled Indian Languages"
      >
        <Globe size={18} color="#16A34A" />
        <span>{activeLangObj.native} ({activeLangObj.name})</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '115%',
            width: '320px',
            maxHeight: '420px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '1rem',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Language (22 Indian Languages)
            </div>
            <input
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                borderRadius: '0.4rem',
                border: '1px solid #CBD5E1',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '0.3rem 0' }}>
            {filteredLangs.map((lang) => {
              const isSelected = lang.key === currentLang;
              const isSarvam = lang.voiceType === 'sarvam';
              return (
                <div
                  key={lang.key}
                  onClick={() => {
                    onSelectLanguage(lang.key);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.55rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#F0FDF4' : 'transparent',
                    borderLeft: isSelected ? '4px solid #16A34A' : '4px solid transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.92rem', color: '#0F172A' }}>
                      {lang.native} <span style={{ color: '#64748B', fontWeight: 400, fontSize: '0.82rem' }}>({lang.name})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      {isSarvam ? (
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Sparkles size={10} /> Sarvam AI Voice
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 500 }}>
                          Web Voice Fallback
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={18} color="#16A34A" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

