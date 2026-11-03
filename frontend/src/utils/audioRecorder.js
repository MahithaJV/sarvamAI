/**
 * In-browser Web Audio API PCM 16-bit 16kHz WAV Recorder
 * Compatible with all modern browsers without external dependencies.
 */
export class AudioRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.audioData = [];
    this.isRecording = false;
    this.volumeCallback = null;
  }

  async start(onVolumeChange) {
    if (this.isRecording) return;
    this.volumeCallback = onVolumeChange;
    this.audioData = [];

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Buffer size 4096, 1 input channel, 1 output channel
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      this.audioData.push(new Float32Array(channelData));

      // Calculate instantaneous RMS volume for wave animation
      if (this.volumeCallback) {
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        const level = Math.min(1, rms * 5); // 0 to 1
        this.volumeCallback(level);
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.isRecording) {
        resolve(null);
        return;
      }
      this.isRecording = false;

      if (this.processor && this.source) {
        this.source.disconnect();
        this.processor.disconnect();
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      }

      const sampleRate = this.audioContext ? this.audioContext.sampleRate : 16000;
      if (this.audioContext && this.audioContext.state !== "closed") {
        this.audioContext.close();
      }

      // Merge recorded buffers
      let totalLength = 0;
      for (let i = 0; i < this.audioData.length; i++) {
        totalLength += this.audioData[i].length;
      }

      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (let i = 0; i < this.audioData.length; i++) {
        merged.set(this.audioData[i], offset);
        offset += this.audioData[i].length;
      }

      // Encode to 16-bit PCM WAV Blob
      const wavBlob = encodeWAV(merged, sampleRate);
      resolve(wavBlob);
    });
  }

  cancel() {
    this.isRecording = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // File length minus 8
  view.setUint32(4, 36 + samples.length * 2, true);
  // WAVE identifier
  writeString(view, 8, "WAVE");
  // Format chunk identifier
  writeString(view, 12, "fmt ");
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // Channels = 1 (mono)
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sample rate * 2 for 16-bit mono)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (2 bytes)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, "data");
  // Data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let index = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    index += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

