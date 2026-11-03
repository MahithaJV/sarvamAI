/**
 * Universal Audio Player with Sarvam AI Base64 playback & Web Speech fallback
 */
class AudioPlayerService {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.onStateChange = null;
  }

  playBase64(base64Wav, onStateChange) {
    this.stop();
    this.onStateChange = onStateChange;

    const audioUrl = `data:audio/wav;base64,${base64Wav}`;
    this.currentAudio = new Audio(audioUrl);

    this.currentAudio.onplay = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "playing" });
    };

    this.currentAudio.onpause = () => {
      if (this.isPlaying) {
        this.isPaused = true;
        if (this.onStateChange) this.onStateChange({ status: "paused" });
      }
    };

    this.currentAudio.onended = () => {
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "ended" });
    };

    this.currentAudio.onerror = (e) => {
      console.error("Audio playback error:", e);
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "error" });
    };

    this.currentAudio.play().catch((err) => {
      console.warn("Autoplay was prevented:", err);
      if (this.onStateChange) this.onStateChange({ status: "paused" });
    });
  }

  pause() {
    if (this.currentAudio && this.isPlaying && !this.isPaused) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play();
    }
  }

  replay() {
    if (this.currentAudio) {
      this.currentAudio.currentTime = 0;
      this.currentAudio.play();
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    if (this.onStateChange) this.onStateChange({ status: "stopped" });
  }

  speakFallback(text, languageCode = "en-IN", onStateChange) {
    this.stop();
    if (!window.speechSynthesis) return;

    this.onStateChange = onStateChange;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "playing", engine: "web_speech" });
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "ended" });
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ status: "error" });
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const audioPlayer = new AudioPlayerService();

