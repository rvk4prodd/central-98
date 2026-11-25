class SoundEngine {
  constructor() {
    this.ctx = null;
    this.holdTimer = null;
    this.lineNoiseNode = null;
    this.speakingCallback = null;
    this.currentSource = null;
    this.sfxEnabled = true;
    this.voiceEnabled = true;
    this.volume = 0.85;
    this.voiceSpeed = 1.0;
    this.ttsProvider = 'browser';
    this.browserVoiceName = '';
    this.elevenLabsKey = '';
    this.elevenLabsModel = 'eleven_flash_v2_5';
    this.openaiTtsKey = '';
    this.openaiTtsModel = 'gpt-4o-mini-tts';
    this.customTtsEndpoint = '';
    this.customTtsVoice = 'pf_dora';
    this.phoneFilter = true;
  }

  syncSettings(aiConfig) {
    this.sfxEnabled = aiConfig.sfxEnabled !== false;
    this.voiceEnabled = aiConfig.voiceEnabled !== false;
    this.volume = Number.isFinite(aiConfig.volume) ? aiConfig.volume : 0.85;
    this.voiceSpeed = Number.isFinite(aiConfig.voiceSpeed) ? aiConfig.voiceSpeed : 1.0;
    this.ttsProvider = aiConfig.ttsProvider || 'browser';
    this.browserVoiceName = aiConfig.browserVoiceName || '';
    this.elevenLabsKey = (aiConfig.elevenLabsKey || '').trim();
    this.elevenLabsModel = aiConfig.elevenLabsModel || 'eleven_flash_v2_5';
    this.openaiTtsKey = (aiConfig.openaiTtsKey || aiConfig.keysByProvider?.openai || '').trim();
    this.openaiTtsModel = aiConfig.openaiTtsModel || 'gpt-4o-mini-tts';
    this.customTtsEndpoint = (aiConfig.customTtsEndpoint || '').trim();
    this.customTtsVoice = (aiConfig.customTtsVoice || 'pf_dora').trim();
    this.phoneFilter = aiConfig.phoneFilter !== false;
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

  playTone(freq, duration = 0.08, type = 'sine', gainVal = 0.14, delay = 0) {
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
    for (let i = 0; i < 4; i += 1) {
      this.playTone(freqs[i % freqs.length], 0.06, 'sine', 0.11, i * 0.08);
      this.playTone(1209 + (i % 3) * 127, 0.06, 'sine', 0.09, i * 0.08);
    }
    this.playTone(425, 0.25, 'sine', 0.07, 0.36);
  }

  playCash() {
    this.playTone(880, 0.07, 'triangle', 0.14, 0);
    this.playTone(1174, 0.1, 'triangle', 0.14, 0.07);
    this.playTone(1568, 0.22, 'sine', 0.15, 0.15);
  }

  playNotify() {
    this.playTone(587.33, 0.09, 'sine', 0.11, 0);
    this.playTone(880, 0.14, 'sine', 0.1, 0.08);
  }

  playRemoteConnect() {
    this.playTone(440, 0.08, 'sine', 0.11, 0);
    this.playTone(659, 0.08, 'sine', 0.11, 0.08);
    this.playTone(880, 0.14, 'sine', 0.12, 0.16);
  }

  playFakeScan() {
    this.playTone(340, 0.1, 'sawtooth', 0.12, 0);
    this.playTone(510, 0.1, 'sawtooth', 0.12, 0.11);
  }

  playPoliceSiren() {
    this.playTone(640, 0.22, 'sawtooth', 0.15, 0);
    this.playTone(910, 0.22, 'sawtooth', 0.15, 0.22);
    this.playTone(640, 0.22, 'sawtooth', 0.15, 0.44);
  }

  playError() {
    this.playTone(230, 0.12, 'sawtooth', 0.15, 0);
    this.playTone(165, 0.2, 'sawtooth', 0.15, 0.12);
  }

  playRepair() {
    this.playTone(360, 0.05, 'triangle', 0.13, 0);
    this.playTone(580, 0.09, 'triangle', 0.13, 0.06);
  }

  playClick() {
    this.playTone(760, 0.025, 'sine', 0.06, 0);
  }

  playSoundboard(kind) {
    if (kind === 'typing') {
      for (let i = 0; i < 6; i += 1) {
        this.playTone(920 + (i % 2) * 180, 0.02, 'square', 0.07, i * 0.055);
      }
    } else if (kind === 'beep') {
      this.playTone(1046, 0.14, 'sine', 0.12, 0);
      this.playTone(1046, 0.14, 'sine', 0.12, 0.2);
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
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.value = 0.015 * this.volume;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.lineNoiseNode = noise;
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
      this.playTone(notes[step % notes.length], 0.24, 'triangle', 0.06, 0);
      step += 1;
    };
    playStep();
    this.holdTimer = setInterval(playStep, 320);
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop?.();
        this.currentSource.pause?.();
      } catch {
        // Ignore already stopped source
      }
      this.currentSource = null;
    }
    if (this.speakingCallback) this.speakingCallback(false);
  }

  listRankedPortugueseVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices() || [];
    const score = (v) => {
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      let s = 0;
      if (lang.startsWith('pt-br')) s += 50;
      else if (lang.startsWith('pt')) s += 25;
      if (name.includes('natural') || name.includes('online')) s += 40;
      if (name.includes('google')) s += 30;
      if (name.includes('francisca') || name.includes('antonio') || name.includes('thalita') || name.includes('brenda')) s += 25;
      return s;
    };
    return [...voices]
      .filter((v) => (v.lang || '').toLowerCase().startsWith('pt') || score(v) >= 40)
      .sort((a, b) => score(b) - score(a));
  }

  pickBestBrowserVoice(gender = 'female') {
    const ranked = this.listRankedPortugueseVoices();
    if (!ranked.length) return null;

    if (this.browserVoiceName) {
      const exact = ranked.find((v) => v.name === this.browserVoiceName);
      if (exact) return exact;
    }

    const femaleHints = /(female|femin|maria|francisca|thalita|brenda|helga|luciana|google português)/i;
    const maleHints = /(male|mascul|antonio|daniel|fabio|humberto|ricardo)/i;
    const target = ranked.find((v) =>
      gender === 'male' ? maleHints.test(v.name) : femaleHints.test(v.name)
    );
    return target || ranked[0];
  }

  async playAudioBufferWithPhonePipeline(arrayBuffer, speed = 1.0) {
    const ctx = this.ensureCtx();
    if (!ctx) return false;

    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.playbackRate.value = Math.max(0.75, Math.min(1.35, speed));

    const masterGain = ctx.createGain();
    masterGain.gain.value = this.volume;

    if (this.phoneFilter) {
      // Realistic telephone voiceband shaping (320Hz - 3300Hz) + compression
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 310;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 3300;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(comp);
      comp.connect(masterGain);
    } else {
      source.connect(masterGain);
    }

    masterGain.connect(ctx.destination);
    this.currentSource = source;
    if (this.speakingCallback) this.speakingCallback(true);

    source.onended = () => {
      if (this.currentSource === source) this.currentSource = null;
      if (this.speakingCallback) this.speakingCallback(false);
    };
    source.start();
    return true;
  }

  async fetchElevenLabsAudio(text, voiceProfile) {
    if (!this.elevenLabsKey) return null;
    const voiceId = voiceProfile.elevenLabsVoiceId || 'EXAVITQu4vr4xnSDxMaL';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsKey
      },
      body: JSON.stringify({
        text,
        model_id: this.elevenLabsModel || 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.78,
          style: 0.35
        }
      })
    });
    if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);
    return res.arrayBuffer();
  }

  async fetchOpenAiTtsAudio(text, voiceProfile) {
    if (!this.openaiTtsKey) return null;
    const model = this.openaiTtsModel || 'gpt-4o-mini-tts';
    const body = {
      model,
      voice: voiceProfile.openaiVoice || 'nova',
      input: text,
      response_format: 'mp3',
      speed: this.voiceSpeed
    };
    if (model === 'gpt-4o-mini-tts' && voiceProfile.voiceInstruction) {
      body.instructions = voiceProfile.voiceInstruction;
    }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiTtsKey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`OpenAI TTS HTTP ${res.status}`);
    return res.arrayBuffer();
  }

  async fetchCustomTtsAudio(text, voiceProfile) {
    if (!this.customTtsEndpoint) return null;
    const res = await fetch(this.customTtsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: this.customTtsVoice || voiceProfile.openaiVoice || 'pf_dora',
        speed: this.voiceSpeed
      })
    });
    if (!res.ok) throw new Error(`Custom TTS HTTP ${res.status}`);
    return res.arrayBuffer();
  }

  async speakVictim(text, voiceProfile = {}) {
    if (!this.voiceEnabled || !text) return;
    this.stopSpeech();

    try {
      let buf = null;
      if (this.ttsProvider === 'elevenlabs' && this.elevenLabsKey) {
        buf = await this.fetchElevenLabsAudio(text, voiceProfile);
      } else if (this.ttsProvider === 'openai' && this.openaiTtsKey) {
        buf = await this.fetchOpenAiTtsAudio(text, voiceProfile);
      } else if (this.ttsProvider === 'custom_tts' && this.customTtsEndpoint) {
        buf = await this.fetchCustomTtsAudio(text, voiceProfile);
      }

      if (buf) {
        const played = await this.playAudioBufferWithPhonePipeline(buf, this.ttsProvider === 'elevenlabs' ? this.voiceSpeed : 1.0);
        if (played) return;
      }
    } catch {
      // Fallback to browser ranked neural voice
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = this.pickBestBrowserVoice(voiceProfile.gender);
      if (voice) utter.voice = voice;
      utter.lang = 'pt-BR';
      utter.pitch = voiceProfile.pitch || 1.0;
      utter.rate = Math.max(0.75, Math.min(1.45, (voiceProfile.rate || 1.0) * this.voiceSpeed));
      utter.volume = this.volume;

      utter.onstart = () => this.speakingCallback?.(true);
      utter.onend = () => this.speakingCallback?.(false);
      utter.onerror = () => this.speakingCallback?.(false);

      window.speechSynthesis.speak(utter);
    }
  }

  async previewVoice(aiConfig) {
    this.syncSettings(aiConfig);
    await this.speakVictim(
      'Alô? Aqui é do escritório, estou testando a qualidade da voz na linha telefônica.',
      {
        gender: 'female',
        pitch: 1.04,
        rate: 1.0,
        openaiVoice: 'nova',
        elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
        voiceInstruction: 'Fale em português do Brasil de forma natural e clara ao telefone.'
      }
    );
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
    rec.onerror = (event) => onError?.(event.error || 'Erro ao capturar microfone.');
    rec.onend = () => onEnd?.();

    rec.start();
    return rec;
  }
}

export const soundEngine = new SoundEngine();
