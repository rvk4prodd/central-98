class SoundEngine {
  constructor() {
    this.ctx = null;
    this.holdTimer = null;
    this.lineNoiseNode = null;
    this.lineGain = null;
    this.speakingCallback = null;
    this.currentAudioEl = null;
    this.sfxEnabled = true;
    this.voiceEnabled = true;
    this.volume = 0.85;
    this.voiceSpeed = 1.0;
    this.ttsMode = 'browser';
    this.openaiKey = '';
  }

  syncSettings(aiConfig) {
    this.sfxEnabled = aiConfig.sfxEnabled !== false;
    this.voiceEnabled = aiConfig.voiceEnabled !== false;
    this.volume = Number.isFinite(aiConfig.volume) ? aiConfig.volume : 0.85;
    this.voiceSpeed = Number.isFinite(aiConfig.voiceSpeed) ? aiConfig.voiceSpeed : 1.0;
    this.ttsMode = aiConfig.ttsMode || 'browser';
    this.openaiKey = aiConfig.provider === 'openai' ? (aiConfig.apiKey || '').trim() : '';
  }

  setSpeakingCallback(cb) {
    this.speakingCallback = cb;
  }

  ensureCtx() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, duration = 0.08, type = 'square', gainVal = 0.14, delay = 0) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const level = Math.max(0.001, gainVal * this.volume);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playDial() {
    const freqs = [697, 770, 852, 941];
    for (let i = 0; i < 5; i += 1) {
      this.playTone(freqs[i % freqs.length], 0.06, 'sine', 0.12, i * 0.08);
      this.playTone(1209 + (i % 3) * 127, 0.06, 'sine', 0.1, i * 0.08);
    }
    this.playTone(425, 0.28, 'sine', 0.08, 0.45);
  }

  playCash() {
    this.playTone(987, 0.07, 'square', 0.14, 0);
    this.playTone(1318, 0.18, 'square', 0.16, 0.07);
    this.playTone(1760, 0.22, 'triangle', 0.15, 0.16);
  }

  playError() {
    this.playTone(220, 0.12, 'sawtooth', 0.18, 0);
    this.playTone(165, 0.22, 'sawtooth', 0.18, 0.12);
  }

  playRepair() {
    this.playTone(320, 0.05, 'triangle', 0.14, 0);
    this.playTone(540, 0.09, 'triangle', 0.14, 0.06);
  }

  playClick() {
    this.playTone(720, 0.025, 'square', 0.06, 0);
  }

  playVoiceBlip() {
    this.playTone(520, 0.05, 'sine', 0.09, 0);
  }

  playSoundboard(kind) {
    if (kind === 'typing') {
      for (let i = 0; i < 6; i += 1) {
        this.playTone(900 + (i % 2) * 180, 0.02, 'square', 0.08, i * 0.055);
      }
    } else if (kind === 'beep') {
      this.playTone(1046, 0.15, 'sine', 0.14, 0);
      this.playTone(1046, 0.15, 'sine', 0.14, 0.22);
    } else if (kind === 'siren') {
      this.playTone(660, 0.16, 'sawtooth', 0.12, 0);
      this.playTone(880, 0.16, 'sawtooth', 0.12, 0.17);
      this.playTone(660, 0.16, 'sawtooth', 0.12, 0.34);
    }
  }

  startLineHum() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || this.lineNoiseNode) return;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.value = 0.02 * this.volume;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.lineNoiseNode = noise;
    this.lineGain = gain;
  }

  stopLineHum() {
    if (this.lineNoiseNode) {
      try {
        this.lineNoiseNode.stop();
        this.lineNoiseNode.disconnect();
      } catch {
        // Ignore already-stopped nodes
      }
      this.lineNoiseNode = null;
      this.lineGain = null;
    }
  }

  toggleHoldMusic(active) {
    if (!active) {
      if (this.holdTimer) {
        clearInterval(this.holdTimer);
        this.holdTimer = null;
      }
      return;
    }
    if (this.holdTimer) return;
    const notes = [392, 440, 493.88, 587.33, 493.88, 440];
    let step = 0;
    const playStep = () => {
      this.playTone(notes[step % notes.length], 0.24, 'triangle', 0.07, 0);
      step += 1;
    };
    playStep();
    this.holdTimer = setInterval(playStep, 320);
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioEl) {
      this.currentAudioEl.pause();
      this.currentAudioEl = null;
    }
    if (this.speakingCallback) this.speakingCallback(false);
  }

  pickBrazilianVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith('pt-br')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ||
      voices[0] ||
      null
    );
  }

  async speakVictim(text, voiceProfile = {}) {
    if (!this.voiceEnabled || !text) return;
    this.stopSpeech();

    if (this.ttsMode === 'openai' && this.openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openaiKey}`
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: voiceProfile.openaiVoice || 'alloy',
            input: text,
            speed: this.voiceSpeed
          })
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = this.volume;
          this.currentAudioEl = audio;
          if (this.speakingCallback) this.speakingCallback(true);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (this.speakingCallback) this.speakingCallback(false);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            if (this.speakingCallback) this.speakingCallback(false);
          };
          await audio.play();
          return;
        }
      } catch {
        // Fallback silently to browser Web Speech API
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = this.pickBrazilianVoice();
      if (voice) utter.voice = voice;
      utter.lang = 'pt-BR';
      utter.pitch = voiceProfile.pitch || 1.0;
      utter.rate = Math.max(0.7, Math.min(1.5, (voiceProfile.rate || 1.0) * this.voiceSpeed));
      utter.volume = this.volume;

      utter.onstart = () => {
        if (this.speakingCallback) this.speakingCallback(true);
      };
      utter.onend = () => {
        if (this.speakingCallback) this.speakingCallback(false);
      };
      utter.onerror = () => {
        if (this.speakingCallback) this.speakingCallback(false);
      };

      window.speechSynthesis.speak(utter);
    }
  }

  listenMicrophone({ onResult, onError, onEnd }) {
    if (typeof window === 'undefined') {
      onError?.('Microfone indisponível neste ambiente.');
      return null;
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      onError?.('Reconhecimento de voz não suportado neste navegador (use Chrome/Edge ou digite).');
      return null;
    }

    const rec = new Rec();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      onResult?.(transcript);
    };
    rec.onerror = (event) => {
      onError?.(event.error || 'Erro ao capturar microfone.');
    };
    rec.onend = () => {
      onEnd?.();
    };

    rec.start();
    return rec;
  }
}

export const soundEngine = new SoundEngine();
