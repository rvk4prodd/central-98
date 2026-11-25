import { AI_PROVIDERS, getActiveApiKey, isAiReady } from '../engine/ai-client.js';
import { soundEngine } from '../engine/audio.js';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class ConfigUi {
  constructor(containerEl, game) {
    this.el = containerEl;
    this.game = game;
    this.activeTab = 'ai'; // 'ai' | 'voice' | 'avatar'
    this.modelSearch = '';
    this.modelFilter = 'all'; // 'all' | 'recommended' | 'free' | 'fast'
    this.modelFetchNotice = '';
    this.isFetchingModels = false;
    this.testStatus = '';
    this.testOk = null;
    this.voiceStatus = '';
    this.voiceOk = null;
    this.bindEvents();
  }

  bindEvents() {
    this.el.addEventListener('input', (e) => {
      if (e.target.id === 'cfg-model-search') {
        this.modelSearch = e.target.value;
        this.renderModelPickerOnly();
      }
    });

    this.el.addEventListener('click', async (e) => {
      const tabBtn = e.target.closest('button[data-cfg-tab]');
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.cfgTab;
        this.render();
        return;
      }

      const filterBtn = e.target.closest('button[data-model-filter]');
      if (filterBtn) {
        this.modelFilter = filterBtn.dataset.modelFilter;
        this.render();
        return;
      }

      const modelPickBtn = e.target.closest('button[data-pick-model]');
      if (modelPickBtn) {
        this.saveCurrentTabInputs();
        const model = modelPickBtn.dataset.pickModel;
        this.game.updateAiConfig({ model });
        this.game.notify(`Modelo selecionado: ${model}`);
        return;
      }

      const btn = e.target.closest('button[data-cfg-action]');
      if (!btn) return;
      const act = btn.dataset.cfgAction;

      if (act === 'fetch-models') {
        this.saveCurrentTabInputs();
        this.isFetchingModels = true;
        this.modelFetchNotice = 'Consultando API de modelos...';
        this.render();
        const res = await this.game.fetchModelsForCurrentProvider();
        this.isFetchingModels = false;
        this.modelFetchNotice = res.notice || '';
        this.render();
      } else if (act === 'auto-pick') {
        this.saveCurrentTabInputs();
        this.game.autoSelectBestModel();
      } else if (act === 'test') {
        this.saveCurrentTabInputs();
        this.testStatus = 'Testando conexão real com a IA...';
        this.testOk = null;
        this.render();
        const res = await this.game.testAiConnection();
        this.testStatus = res.message;
        this.testOk = res.ok;
        this.render();
      } else if (act === 'clear-key') {
        this.game.clearCurrentProviderKey();
      } else if (act === 'preview-voice') {
        this.saveVoiceInputs();
        this.voiceStatus = 'Gerando áudio de teste...';
        this.voiceOk = null;
        this.render();
        const res = await soundEngine.previewVoice(this.game.aiConfig);
        if (res?.error) {
          this.voiceStatus = `Erro TTS (${res.error}) — fallback: ${res.voiceName || 'navegador'}`;
          this.voiceOk = false;
        } else {
          this.voiceStatus = `Tocando via ${res?.provider || 'navegador'}${res?.voiceName ? ` (${res.voiceName})` : ''}.`;
          this.voiceOk = true;
        }
        this.render();
      } else if (act === 'reset-save') {
        if (window.confirm('Apagar todo o progresso do jogo e começar do Dia 1?')) {
          this.game.resetCampaign();
        }
      }
    });

    this.el.addEventListener('change', (e) => {
      const el = e.target;
      if (el.id === 'cfg-provider') {
        const provider = el.value;
        const defaultModel = AI_PROVIDERS[provider]?.defaultModel || '';
        this.testStatus = '';
        this.testOk = null;
        this.modelFetchNotice = '';
        this.modelSearch = '';
        this.game.updateAiConfig({ provider, model: defaultModel });
      } else if (el.id === 'cfg-tts-provider') {
        this.game.updateAiConfig({ ttsProvider: el.value });
      } else if (el.id === 'cfg-browser-voice') {
        this.game.updateAiConfig({ browserVoiceName: el.value });
      } else if (el.id === 'cfg-phone-filter') {
        this.game.updateAiConfig({ phoneFilter: el.checked });
      } else if (el.id === 'cfg-voice-enabled') {
        this.game.updateAiConfig({ voiceEnabled: el.checked });
      } else if (el.id === 'cfg-sfx-enabled') {
        this.game.updateAiConfig({ sfxEnabled: el.checked });
      } else if (el.id === 'cfg-voice-speed') {
        this.game.updateAiConfig({ voiceSpeed: parseFloat(el.value) || 1.0 });
      } else if (el.id === 'cfg-volume') {
        this.game.updateAiConfig({ volume: parseFloat(el.value) || 0.85 });
      } else if (el.dataset.lookField) {
        const field = el.dataset.lookField;
        const val = el.type === 'checkbox' ? el.checked : el.value;
        this.game.updateOperatorLook({ [field]: val });
      }
    });

    this.el.addEventListener('submit', async (e) => {
      if (e.target.id === 'ai-config-form') {
        e.preventDefault();
        this.saveCurrentTabInputs();
        this.testStatus = 'Validando chave e modelo...';
        this.testOk = null;
        this.render();
        const res = await this.game.testAiConnection();
        this.testStatus = res.message;
        this.testOk = res.ok;
        if (res.ok) {
          this.game.notify('IA conectada e pronta para jogar!');
        } else {
          this.game.notify(`Falha na API: ${res.message}`, true);
        }
        this.render();
      } else if (e.target.id === 'voice-config-form') {
        e.preventDefault();
        this.saveVoiceInputs();
        this.game.notify('Configurações de voz neural salvas localmente.');
      }
    });
  }

  saveCurrentTabInputs() {
    const provider = this.game.aiConfig.provider;
    const keyInput = document.getElementById('cfg-apikey');
    const modelInput = document.getElementById('cfg-model');
    const endpointInput = document.getElementById('cfg-endpoint');
    const patch = {};
    if (modelInput) patch.model = modelInput.value.trim();
    if (endpointInput) patch.customEndpoint = endpointInput.value.trim();
    if (keyInput) patch.keysByProvider = { [provider]: keyInput.value.trim() };
    this.game.updateAiConfig(patch);
  }

  saveVoiceInputs() {
    const geminiTtsKey = document.getElementById('cfg-gemini-tts-key')?.value ?? this.game.aiConfig.geminiTtsKey;
    const elevenLabsKey = document.getElementById('cfg-eleven-key')?.value ?? this.game.aiConfig.elevenLabsKey;
    const elevenLabsModel = document.getElementById('cfg-eleven-model')?.value ?? this.game.aiConfig.elevenLabsModel;
    const openaiTtsKey = document.getElementById('cfg-openai-tts-key')?.value ?? this.game.aiConfig.openaiTtsKey;
    const openaiTtsModel = document.getElementById('cfg-openai-tts-model')?.value ?? this.game.aiConfig.openaiTtsModel;
    const customTtsEndpoint = document.getElementById('cfg-custom-tts-url')?.value ?? this.game.aiConfig.customTtsEndpoint;
    const customTtsVoice = document.getElementById('cfg-custom-tts-voice')?.value ?? this.game.aiConfig.customTtsVoice;
    this.game.updateAiConfig({
      geminiTtsKey: geminiTtsKey.trim(),
      elevenLabsKey: elevenLabsKey.trim(),
      elevenLabsModel: elevenLabsModel.trim(),
      openaiTtsKey: openaiTtsKey.trim(),
      openaiTtsModel: openaiTtsModel.trim(),
      customTtsEndpoint: customTtsEndpoint.trim(),
      customTtsVoice: customTtsVoice.trim()
    });
  }

  getFilteredModels() {
    const cfg = this.game.aiConfig;
    const all = this.game.getModelsForProvider(cfg.provider);
    const q = this.modelSearch.trim().toLowerCase();

    return all.filter((m) => {
      if (q && !m.id.toLowerCase().includes(q) && !m.name.toLowerCase().includes(q)) {
        return false;
      }
      if (this.modelFilter === 'recommended') return m.tier === 'recommended';
      if (this.modelFilter === 'free') return m.isFree;
      if (this.modelFilter === 'fast') return m.tier === 'fast' || m.tier === 'recommended';
      return true;
    });
  }

  renderModelPickerOnly() {
    const listEl = document.getElementById('cfg-model-picker-list');
    if (!listEl) return;
    listEl.innerHTML = this.buildModelRowsHtml();
  }

  buildModelRowsHtml() {
    const cfg = this.game.aiConfig;
    const models = this.getFilteredModels();
    if (!models.length) {
      return '<div class="muted-note">Nenhum modelo encontrado para esse filtro.</div>';
    }
    return models
      .slice(0, 40)
      .map((m) => {
        const active = cfg.model === m.id;
        const badgesHtml = (m.badges || [])
          .map((b) => `<span class="tag ${b === 'Grátis' ? 'tag-ok' : b === 'Recomendado' ? 'tag-accent' : ''}">${escapeHtml(b)}</span>`)
          .join(' ');
        return `
          <button type="button" class="model-option ${active ? 'is-selected' : ''}" data-pick-model="${escapeHtml(m.id)}">
            <div class="model-option-top">
              <span class="model-id">${escapeHtml(m.id)}</span>
              <span class="model-badges">${badgesHtml}</span>
            </div>
            <div class="model-reason">${escapeHtml(m.reason)}</div>
          </button>
        `;
      })
      .join('');
  }

  render() {
    const cfg = this.game.aiConfig;
    const tabs = `
      <div class="subtabs">
        <button type="button" class="subtab-btn ${this.activeTab === 'ai' ? 'is-active' : ''}" data-cfg-tab="ai">APIs & Modelos</button>
        <button type="button" class="subtab-btn ${this.activeTab === 'voice' ? 'is-active' : ''}" data-cfg-tab="voice">Vozes Neurais</button>
        <button type="button" class="subtab-btn ${this.activeTab === 'avatar' ? 'is-active' : ''}" data-cfg-tab="avatar">Personagem 2D</button>
      </div>
    `;

    if (this.activeTab === 'voice') {
      const voices = soundEngine.listRankedPortugueseVoices();
      const voiceOpts = [
        `<option value="">Automático (Melhor voz PT-BR Neural)</option>`,
        ...voices.map(
          (v) => `<option value="${escapeHtml(v.name)}" ${cfg.browserVoiceName === v.name ? 'selected' : ''}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`
        )
      ].join('');
      const vStatusClass = this.voiceOk === true ? 'is-ok' : this.voiceOk === false ? 'is-bad' : '';

      this.el.innerHTML = `
        ${tabs}
        <form id="voice-config-form" class="cfg-form">
          <div class="cfg-notice">
            Para vozes humanas de verdade, use <strong>Google Gemini Neural TTS</strong> (usa a mesma chave Gemini!), <strong>ElevenLabs</strong> ou <strong>OpenAI gpt-4o-mini-tts</strong>.
          </div>

          <label class="cfg-field">
            <span>Motor de Voz das Vítimas (TTS)</span>
            <select id="cfg-tts-provider" class="win-input">
              <option value="gemini_tts" ${cfg.ttsProvider === 'gemini_tts' ? 'selected' : ''}>Google Gemini 2.5 Neural TTS (Usa sua chave Gemini!)</option>
              <option value="elevenlabs" ${cfg.ttsProvider === 'elevenlabs' ? 'selected' : ''}>ElevenLabs Flash v2.5 (Ultra-Realista)</option>
              <option value="openai" ${cfg.ttsProvider === 'openai' ? 'selected' : ''}>OpenAI gpt-4o-mini-tts (Expressivo)</option>
              <option value="custom_tts" ${cfg.ttsProvider === 'custom_tts' ? 'selected' : ''}>Servidor Local TTS (Kokoro / Qwen3 / Edge-TTS)</option>
              <option value="browser" ${cfg.ttsProvider === 'browser' ? 'selected' : ''}>Navegador (Vozes do Sistema — pode soar robótico)</option>
            </select>
          </label>

          ${
            cfg.ttsProvider === 'gemini_tts'
              ? `<label class="cfg-field">
                   <span>Gemini API Key para Voz (opcional se já salvou na aba APIs)</span>
                   <input id="cfg-gemini-tts-key" type="password" class="win-input" value="${escapeHtml(cfg.geminiTtsKey)}" placeholder="${cfg.keysByProvider?.gemini ? 'Usando chave Gemini já salva na aba APIs' : 'AIza...'}" />
                 </label>`
              : ''
          }

          ${
            cfg.ttsProvider === 'browser'
              ? `<label class="cfg-field">
                   <span>Voz PT-BR Detectada (${voices.length} disponíveis)</span>
                   <select id="cfg-browser-voice" class="win-input">${voiceOpts}</select>
                 </label>`
              : ''
          }

          ${
            cfg.ttsProvider === 'elevenlabs'
              ? `<div class="cfg-row-2">
                   <label class="cfg-field">
                     <span>ElevenLabs API Key</span>
                     <input id="cfg-eleven-key" type="password" class="win-input" value="${escapeHtml(cfg.elevenLabsKey)}" placeholder="xi-api-key..." />
                   </label>
                   <label class="cfg-field">
                     <span>Modelo ElevenLabs</span>
                     <select id="cfg-eleven-model" class="win-input">
                       <option value="eleven_flash_v2_5" ${cfg.elevenLabsModel === 'eleven_flash_v2_5' ? 'selected' : ''}>eleven_flash_v2_5 (Baixa latência)</option>
                       <option value="eleven_multilingual_v2" ${cfg.elevenLabsModel === 'eleven_multilingual_v2' ? 'selected' : ''}>eleven_multilingual_v2</option>
                     </select>
                   </label>
                 </div>`
              : ''
          }

          ${
            cfg.ttsProvider === 'openai'
              ? `<div class="cfg-row-2">
                   <label class="cfg-field">
                     <span>OpenAI Key (ou usa chave OpenAI da aba APIs)</span>
                     <input id="cfg-openai-tts-key" type="password" class="win-input" value="${escapeHtml(cfg.openaiTtsKey)}" placeholder="sk-..." />
                   </label>
                   <label class="cfg-field">
                     <span>Modelo OpenAI TTS</span>
                     <select id="cfg-openai-tts-model" class="win-input">
                       <option value="gpt-4o-mini-tts" ${cfg.openaiTtsModel === 'gpt-4o-mini-tts' ? 'selected' : ''}>gpt-4o-mini-tts (com atuação emocional)</option>
                       <option value="tts-1" ${cfg.openaiTtsModel === 'tts-1' ? 'selected' : ''}>tts-1 (rápido)</option>
                     </select>
                   </label>
                 </div>`
              : ''
          }

          ${
            cfg.ttsProvider === 'custom_tts'
              ? `<div class="cfg-row-2">
                   <label class="cfg-field">
                     <span>Endpoint OpenAI TTS (/v1/audio/speech)</span>
                     <input id="cfg-custom-tts-url" type="text" class="win-input" value="${escapeHtml(cfg.customTtsEndpoint)}" />
                   </label>
                   <label class="cfg-field">
                     <span>ID da Voz (ex.: pf_dora)</span>
                     <input id="cfg-custom-tts-voice" type="text" class="win-input" value="${escapeHtml(cfg.customTtsVoice)}" />
                   </label>
                 </div>`
              : ''
          }

          <div class="cfg-row-2">
            <label class="cfg-field">
              <span>Velocidade (${cfg.voiceSpeed}x)</span>
              <input id="cfg-voice-speed" type="range" min="0.75" max="1.35" step="0.05" value="${cfg.voiceSpeed}" />
            </label>
            <label class="cfg-field">
              <span>Volume (${Math.round(cfg.volume * 100)}%)</span>
              <input id="cfg-volume" type="range" min="0.1" max="1.0" step="0.05" value="${cfg.volume}" />
            </label>
          </div>

          <div class="cfg-checks">
            <label><input id="cfg-phone-filter" type="checkbox" ${cfg.phoneFilter ? 'checked' : ''} /> Efeito de linha telefônica (260–3800Hz)</label>
            <label><input id="cfg-voice-enabled" type="checkbox" ${cfg.voiceEnabled ? 'checked' : ''} /> Voz das vítimas ativa</label>
            <label><input id="cfg-sfx-enabled" type="checkbox" ${cfg.sfxEnabled ? 'checked' : ''} /> Efeitos sonoros Win11</label>
          </div>

          <div class="cfg-actions">
            <button type="submit" class="win-btn win-btn-primary">Salvar Áudio</button>
            <button type="button" class="win-btn" data-cfg-action="preview-voice">Testar Voz Agora</button>
          </div>
          ${this.voiceStatus ? `<div class="status-pill ${vStatusClass}">${escapeHtml(this.voiceStatus)}</div>` : ''}
        </form>
      `;
      return;
    }

    if (this.activeTab === 'avatar') {
      const look = this.game.state.operatorLook;
      this.el.innerHTML = `
        ${tabs}
        <div class="cfg-form">
          <div class="cfg-notice">Personalize seu operador 2D na câmera do canto (CAM-01):</div>
          <div class="cfg-row-2">
            <label class="cfg-field">
              <span>Estilo de Cabelo</span>
              <select class="win-input" data-look-field="hairStyle">
                <option value="short" ${look.hairStyle === 'short' ? 'selected' : ''}>Curto Clássico</option>
                <option value="spiky" ${look.hairStyle === 'spiky' ? 'selected' : ''}>Arrepiado</option>
                <option value="bob" ${look.hairStyle === 'bob' ? 'selected' : ''}>Médio Lateral</option>
              </select>
            </label>
            <label class="cfg-field">
              <span>Cor do Moletom</span>
              <input type="color" class="win-input color-input" data-look-field="hoodie" value="${escapeHtml(look.hoodie)}" />
            </label>
            <label class="cfg-field">
              <span>Tom de Pele</span>
              <input type="color" class="win-input color-input" data-look-field="skin" value="${escapeHtml(look.skin)}" />
            </label>
            <label class="cfg-field">
              <span>Cor do Cabelo</span>
              <input type="color" class="win-input color-input" data-look-field="hair" value="${escapeHtml(look.hair)}" />
            </label>
            <label class="cfg-field">
              <span>LED do Headset</span>
              <input type="color" class="win-input color-input" data-look-field="headsetLed" value="${escapeHtml(look.headsetLed)}" />
            </label>
            <label class="cfg-field">
              <span>Acessório</span>
              <label class="inline-check"><input type="checkbox" data-look-field="glasses" ${look.glasses ? 'checked' : ''} /> Usar óculos</label>
            </label>
          </div>
        </div>
      `;
      return;
    }

    // Default tab: AI Providers + Smart Model Picker
    const meta = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.gemini;
    const activeKey = getActiveApiKey(cfg);
    const ready = isAiReady(cfg);
    const providerOpts = Object.entries(AI_PROVIDERS)
      .map(([key, val]) => {
        const hasSavedKey = Boolean(cfg.keysByProvider?.[key]);
        const suffix = hasSavedKey ? ' [Chave salva]' : '';
        return `<option value="${key}" ${cfg.provider === key ? 'selected' : ''}>${escapeHtml(val.label + suffix)}</option>`;
      })
      .join('');

    const statusClass = this.testOk === true ? 'is-ok' : this.testOk === false ? 'is-bad' : '';
    const statusText =
      this.testStatus ||
      (ready
        ? `Pronto: ${meta.label} (${cfg.model})`
        : `Ação necessária: cole sua API Key de ${meta.label} abaixo para habilitar as ligações.`);

    this.el.innerHTML = `
      ${tabs}
      <form id="ai-config-form" class="cfg-form">
        <div class="cfg-notice ${ready ? '' : 'is-warn'}">
          ${ready ? 'Chave salva apenas no <strong>localStorage</strong> deste navegador.' : 'O jogo exige uma IA real para as vítimas responderem e caírem na sua lábia.'}
        </div>

        <label class="cfg-field">
          <span>Provedor de IA</span>
          <select id="cfg-provider" class="win-input">${providerOpts}</select>
        </label>

        <label class="cfg-field">
          <span>API Key de ${escapeHtml(meta.label)}</span>
          <input id="cfg-apikey" type="password" class="win-input" autocomplete="off"
            placeholder="${meta.needsKey ? 'Cole sua chave aqui (AIza... / sk-or-... / gsk_... / sk-...)' : 'Opcional para endpoint local'}"
            value="${escapeHtml(activeKey)}" />
        </label>

        ${
          cfg.provider === 'custom'
            ? `<label class="cfg-field">
                 <span>Endpoint OpenAI-compatible (Ollama / LM Studio)</span>
                 <input id="cfg-endpoint" type="text" class="win-input" value="${escapeHtml(cfg.customEndpoint)}" />
               </label>`
            : ''
        }

        <div class="model-picker-header">
          <span>Seletor Inteligente de Modelos</span>
          <div class="model-picker-actions">
            <button type="button" class="win-btn win-btn-mini" data-cfg-action="fetch-models" ${this.isFetchingModels ? 'disabled' : ''}>
              ${this.isFetchingModels ? 'Buscando...' : 'Buscar Modelos da API'}
            </button>
            <button type="button" class="win-btn win-btn-mini win-btn-primary" data-cfg-action="auto-pick">
              Auto-Escolher Melhor
            </button>
          </div>
        </div>

        <div class="model-filter-bar">
          <input id="cfg-model-search" type="text" class="win-input" placeholder="Filtrar modelos (ex.: flash, free, llama, gpt)..." value="${escapeHtml(this.modelSearch)}" />
          <div class="filter-chips">
            <button type="button" class="win-btn win-btn-mini ${this.modelFilter === 'all' ? 'win-btn-primary' : ''}" data-model-filter="all">Todos</button>
            <button type="button" class="win-btn win-btn-mini ${this.modelFilter === 'recommended' ? 'win-btn-primary' : ''}" data-model-filter="recommended">Recomendados</button>
            <button type="button" class="win-btn win-btn-mini ${this.modelFilter === 'free' ? 'win-btn-primary' : ''}" data-model-filter="free">Grátis</button>
            <button type="button" class="win-btn win-btn-mini ${this.modelFilter === 'fast' ? 'win-btn-primary' : ''}" data-model-filter="fast">Rápidos</button>
          </div>
        </div>

        ${this.modelFetchNotice ? `<div class="muted-note">${escapeHtml(this.modelFetchNotice)}</div>` : ''}

        <div id="cfg-model-picker-list" class="model-picker-list">
          ${this.buildModelRowsHtml()}
        </div>

        <label class="cfg-field">
          <span>ID do Modelo Selecionado (editável)</span>
          <input id="cfg-model" type="text" class="win-input" value="${escapeHtml(cfg.model || meta.defaultModel)}" />
        </label>

        <div class="cfg-actions">
          <button type="submit" class="win-btn win-btn-primary">Salvar &amp; Testar Conexão</button>
          <button type="button" class="win-btn" data-cfg-action="test">Só Testar</button>
          <button type="button" class="win-btn win-btn-danger" data-cfg-action="clear-key">Limpar Chave</button>
          <button type="button" class="win-btn" data-cfg-action="reset-save">Resetar Save</button>
        </div>

        <div id="cfg-test-status" class="status-pill ${statusClass}">${escapeHtml(statusText)}</div>
      </form>
    `;
  }
}
