import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Send, Volume2, Pause, Play, RotateCcw,
  Sparkles, X, Edit3, AlertCircle, ShieldAlert, CloudRain,
  DollarSign, CheckCircle2, MessageSquare
} from 'lucide-react';
import { transcribeAudio, askAssistant, synthesizeSpeech } from '../api';
import { AudioRecorder } from '../utils/audioRecorder';
import { audioPlayer } from '../utils/audioPlayer';
import { getTranslation, LANGUAGES } from '../localization/translations';

const VoiceAssistantModal = ({
  isOpen,
  onClose,
  currentLang = 'hi',
  location = 'Punjab',
  crop = 'Wheat',
  farmSizeAcres = 3.0,
  cropLossPct = 35.0
}) => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: getTranslation(currentLang, 'sampleQ1'),
      textEn: 'Hello! I am your KrishiDeep AI assistant. Ask me anything about today\'s rain, crop health, or PMFBY insurance payout.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audioBase64: null,
      grounding: null
    }
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [playbackState, setPlaybackState] = useState({ isPlaying: false, isPaused: false, activeIndex: null });

  const recorderRef = useRef(null);
  const chatBottomRef = useRef(null);

  const activeLangObj = LANGUAGES.find((l) => l.key === currentLang) || LANGUAGES[1];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, answering, transcriptDraft]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (recorderRef.current) recorderRef.current.cancel();
      audioPlayer.stop();
      setIsRecording(false);
      setTranscriptDraft('');
    }
  }, [isOpen]);

  const handleStartRecording = async () => {
    setErrorMsg('');
    try {
      audioPlayer.stop();
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start((vol) => {
        setAudioLevel(vol);
      });
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMsg('Could not access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    setAudioLevel(0);
    setTranscribing(true);

    try {
      const audioBlob = await recorderRef.current.stop();
      if (!audioBlob) {
        setTranscribing(false);
        return;
      }

      // Call Sarvam AI STT
      const result = await transcribeAudio(audioBlob, activeLangObj.code);
      if (result.success && result.transcript) {
        setTranscriptDraft(result.transcript);
        setIsEditingDraft(true);
      } else if (result.transcript) {
        setTranscriptDraft(result.transcript);
        setIsEditingDraft(true);
      } else {
        setErrorMsg('No speech detected. Please speak clearly into the microphone.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMsg('Speech recognition failed. Please try again or type your question.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleSubmitQuestion = async (questionText) => {
    const q = (questionText || transcriptDraft).trim();
    if (!q) return;

    setErrorMsg('');
    setTranscriptDraft('');
    setIsEditingDraft(false);

    // Add user message
    const userMsg = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setAnswering(true);

    try {
      const res = await askAssistant({
        question: q,
        languageCode: activeLangObj.code,
        location,
        crop,
        farmSizeAcres,
        cropLossPct
      });

      const assistantMsg = {
        sender: 'assistant',
        text: res.answer || res.answer_en,
        textEn: res.answer_en,
        intent: res.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: res.audio_base64,
        voiceEngine: res.voice_engine,
        grounding: res.grounding
      };

      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        const newIdx = next.length - 1;
        // Auto play speech response
        if (res.audio_base64) {
          playAudioResponse(res.audio_base64, newIdx);
        } else if (res.answer) {
          audioPlayer.speakFallback(res.answer, activeLangObj.code, (st) => {
            setPlaybackState({
              isPlaying: st.status === 'playing',
              isPaused: st.status === 'paused',
              activeIndex: newIdx
            });
          });
        }
        return next;
      });
    } catch (err) {
      console.error('Assistant error:', err);
      setErrorMsg('Failed to process question. Please check backend connection.');
    } finally {
      setAnswering(false);
    }
  };

  const playAudioResponse = (audioBase64, msgIndex) => {
    if (!audioBase64) return;
    audioPlayer.playBase64(audioBase64, (st) => {
      setPlaybackState({
        isPlaying: st.status === 'playing',
        isPaused: st.status === 'paused',
        activeIndex: st.status === 'ended' || st.status === 'stopped' ? null : msgIndex
      });
    });
  };

  const sampleQuestions = [
    getTranslation(currentLang, 'sampleQ1'),
    getTranslation(currentLang, 'sampleQ2'),
    getTranslation(currentLang, 'sampleQ3'),
    getTranslation(currentLang, 'sampleQ4')
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '88vh',
          maxHeight: '750px',
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: '#16A34A',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={24} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                KrishiDeep AI Voice Assistant
              </h2>
              <div style={{ fontSize: '0.82rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Speaking in <strong>{activeLangObj.native}</strong> ({activeLangObj.name})</span>
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                >
                  {activeLangObj.voiceType === 'sarvam' ? 'Sarvam AI Neural' : 'Web Fallback'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', backgroundColor: '#F8FAFC' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isPlayingThis = playbackState.activeIndex === idx && playbackState.isPlaying;
            const isPausedThis = playbackState.activeIndex === idx && playbackState.isPaused;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '1.2rem'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '1rem 1.2rem',
                    borderRadius: isUser ? '1.2rem 1.2rem 0.2rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.2rem',
                    backgroundColor: isUser ? '#16A34A' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#1E293B',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: isUser ? 'none' : '1px solid #E2E8F0',
                    fontSize: '1rem',
                    lineHeight: 1.5
                  }}
                >
                  <div>{msg.text}</div>

                  {/* Grounded Insurance / Weather metrics breakdown */}
                  {msg.grounding && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        fontSize: '0.85rem',
                        color: '#166534'
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={16} /> Grounded KrishiDeep Verification:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                        <div><strong>Farm:</strong> {msg.grounding.farm_size_acres} acres ({msg.grounding.crop})</div>
                        <div><strong>Location:</strong> {msg.grounding.location}</div>
                        <div><strong>PMFBY Cover:</strong> ₹{msg.grounding.total_coverage?.toLocaleString()}</div>
                        <div><strong>Crop Loss:</strong> {msg.grounding.crop_loss_pct}%</div>
                        <div style={{ gridColumn: 'span 2', color: '#B45309', fontWeight: 600 }}>
                          <strong>Estimated Payout:</strong> ₹{msg.grounding.estimated_payout?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Controls for Assistant Replies */}
                  {!isUser && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        paddingTop: '0.6rem',
                        borderTop: '1px solid #F1F5F9',
                        fontSize: '0.8rem',
                        color: '#64748B'
                      }}
                    >
                      {msg.audioBase64 ? (
                        <>
                          {!isPlayingThis ? (
                            <button
                              onClick={() => playAudioResponse(msg.audioBase64, idx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.75rem',
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                border: 'none',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            >
                              <Volume2 size={15} /> Listen ({msg.voiceEngine || 'Sarvam AI'})
                            </button>
                          ) : (
                            <button
                              onClick={() => audioPlayer.pause()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.75rem',
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: 'none',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            >
                              <Pause size={15} /> Pause
                            </button>
                          )}

                          {isPausedThis && (
                            <button
                              onClick={() => audioPlayer.resume()}
                              style={{
                                padding: '0.3rem 0.6rem',
                                backgroundColor: '#E0F2FE',
                                color: '#0369A1',
                                border: 'none',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              <Play size={14} /> Resume
                            </button>
                          )}

                          <button
                            onClick={() => audioPlayer.replay()}
                            style={{
                              padding: '0.3rem',
                              background: 'none',
                              border: 'none',
                              color: '#64748B',
                              cursor: 'pointer'
                            }}
                            title="Replay Audio"
                          >
                            <RotateCcw size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            audioPlayer.speakFallback(msg.text, activeLangObj.code, (st) => {
                              setPlaybackState({
                                isPlaying: st.status === 'playing',
                                isPaused: st.status === 'paused',
                                activeIndex: idx
                              });
                            })
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <Volume2 size={15} /> Read Aloud (Web Voice)
                        </button>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {answering && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16A34A', padding: '0.5rem' }}>
              <div className="spinner-dots" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                🌾 KrishiDeep is analyzing weather and policy data...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Sample Questions Chips */}
        <div
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSubmitQuestion(q)}
              style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                color: '#334155',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
                e.currentTarget.style.borderColor = '#94A3B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Speech Recognition Review / Edit Banner */}
        {isEditingDraft && (
          <div
            style={{
              padding: '0.8rem 1.25rem',
              backgroundColor: '#FEF3C7',
              borderTop: '1px solid #FCD34D',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#92400E' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Edit3 size={16} /> Recognized Voice (Review & Edit before sending):
              </span>
              <button
                onClick={() => {
                  setTranscriptDraft('');
                  setIsEditingDraft(false);
                }}
                style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Clear
              </button>
            </div>
            <textarea
              value={transcriptDraft}
              onChange={(e) => setTranscriptDraft(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '0.6rem',
                fontSize: '0.95rem',
                borderRadius: '0.5rem',
                border: '1px solid #D97706',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => handleSubmitQuestion(transcriptDraft)}
                style={{
                  padding: '0.45rem 1.2rem',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Send size={16} /> Send Question
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Listening Animation Box */}
        {isRecording && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#EFF6FF',
              borderTop: '2px solid #3B82F6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <div style={{ color: '#1D4ED8', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="pulse-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
              Listening to your voice in {activeLangObj.native}...
            </div>
            {/* Dynamic Sound Wave indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '36px' }}>
              {[0.4, 0.8, 1.2, 1.0, 0.6, 0.9, 1.3, 0.7, 0.5].map((scale, i) => {
                const height = Math.max(6, Math.min(32, (audioLevel * 35 + 8) * scale));
                return (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${height}px`,
                      backgroundColor: '#3B82F6',
                      borderRadius: '2px',
                      transition: 'height 0.08s ease'
                    }}
                  />
                );
              })}
            </div>
            <button
              onClick={handleStopRecording}
              style={{
                padding: '0.45rem 1.25rem',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.25)'
              }}
            >
              <MicOff size={16} /> Finish Speaking
            </button>
          </div>
        )}

        {/* Transcribing feedback */}
        {transcribing && (
          <div style={{ padding: '0.8rem', textAlign: 'center', backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: '0.9rem' }}>
            Transcribing speech with Sarvam Saaras AI model...
          </div>
        )}

        {/* Bottom Input Bar */}
        {!isRecording && !isEditingDraft && (
          <div
            style={{
              padding: '0.9rem 1.25rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {/* Big Mic Button */}
            <button
              onClick={handleStartRecording}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#16A34A',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.35)',
                transition: 'transform 0.15s ease',
                flexShrink: 0
              }}
              title="Speak to Ask"
            >
              <Mic size={24} />
            </button>

            {/* Text Input Fallback */}
            <input
              type="text"
              placeholder={`Ask in ${activeLangObj.name} or tap the mic...`}
              value={transcriptDraft}
              onChange={(e) => setTranscriptDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitQuestion(transcriptDraft);
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                borderRadius: '9999px',
                border: '1.5px solid #CBD5E1',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSubmitQuestion(transcriptDraft)}
              disabled={!transcriptDraft.trim()}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: transcriptDraft.trim() ? '#16A34A' : '#E2E8F0',
                color: transcriptDraft.trim() ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: transcriptDraft.trim() ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistantModal;

