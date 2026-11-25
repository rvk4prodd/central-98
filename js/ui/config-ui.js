import { AI_PROVIDERS, getActiveApiKey } from '../engine/ai-client.js';
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
    this.testStatus = '';
    this.testOk = null;
    this.bindEvents();
  }

  bindEvents() {
    this.el.addEventListener('click', async (e) => {
      const tabBtn = e.target.closest('button[data-cfg-tab]');
      if (tabBtn) {
        this.activeTab = tabBtn.dataset.cfgTab;
        this.render();
        return;
      }

      const presetBtn = e.target.closest('button[data-model-preset]');
      if (presetBtn) {
        const model = presetBtn.dataset.modelPreset;
        this.game.updateAiConfig({ model });
        return;
      }

      const btn = e.target.closest('button[data-cfg-action]');
      if (!btn) return;
      const act = btn.dataset.cfgAction;

      if (act === 'test') {
        this.saveCurrentTabInputs();
        this.testStatus = 'Testando conexão...';
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
        await soundEngine.previewVoice(this.game.aiConfig);
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

    this.el.addEventListener('submit', (e) => {
      if (e.target.id === 'ai-config-form') {
        e.preventDefault();
        this.saveCurrentTabInputs();
        this.game.notify('API & configurações salvas localmente no navegador.');
      } else if (e.target.id === 'voice-config-form') {
        e.preventDefault();
        this.saveVoiceInputs();
        this.game.notify('Configurações de voz neural salvas localmente.');
      }
    });
  }

  saveCurrentTabInputs() {
    const provider = this.game.aiConfig.provider;
    const key = document.getElementById('cfg-apikey')?.value ?? '';
    const model = document.getElementById('cfg-model')?.value ?? '';
    const customEndpoint = document.getElementById('cfg-endpoint')?.value ?? this.game.aiConfig.customEndpoint;
    this.game.updateAiConfig({
      model: model.trim(),
      customEndpoint: customEndpoint.trim(),
      keysByProvider: { [provider]: key.trim() }
    });
  }

  saveVoiceInputs() {
    const elevenLabsKey = document.getElementById('cfg-eleven-key')?.value ?? this.game.aiConfig.elevenLabsKey;
    const elevenLabsModel = document.getElementById('cfg-eleven-model')?.value ?? this.game.aiConfig.elevenLabsModel;
    const openaiTtsKey = document.getElementById('cfg-openai-tts-key')?.value ?? this.game.aiConfig.openaiTtsKey;
    const openaiTtsModel = document.getElementById('cfg-openai-tts-model')?.value ?? this.game.aiConfig.openaiTtsModel;
    const customTtsEndpoint = document.getElementById('cfg-custom-tts-url')?.value ?? this.game.aiConfig.customTtsEndpoint;
    const customTtsVoice = document.getElementById('cfg-custom-tts-voice')?.value ?? this.game.aiConfig.customTtsVoice;
    this.game.updateAiConfig({
      elevenLabsKey: elevenLabsKey.trim(),
      elevenLabsModel: elevenLabsModel.trim(),
      openaiTtsKey: openaiTtsKey.trim(),
      openaiTtsModel: openaiTtsModel.trim(),
      customTtsEndpoint: customTtsEndpoint.trim(),
      customTtsVoice: customTtsVoice.trim()
    });
  }

  render() {
    const cfg = this.game.aiConfig;
    const tabs = `
      <div class="subtabs">
        <button type="button" class="subtab-btn ${this.activeTab === 'ai' ? 'is-active' : ''}" data-cfg-tab="ai">APIs de IA (11)</button>
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

      this.el.innerHTML = `
        ${tabs}
        <form id="voice-config-form" class="cfg-form">
          <div class="cfg-notice">
            Escolha um motor neural real (ElevenLabs, OpenAI <code>gpt-4o-mini-tts</code>, servidor local Kokoro/Qwen3) ou selecione a melhor voz Natural do seu navegador.
          </div>

          <label class="cfg-field">
            <span>Motor de Voz das Vítimas (TTS)</span>
            <select id="cfg-tts-provider" class="win-input">
              <option value="browser" ${cfg.ttsProvider === 'browser' ? 'selected' : ''}>Navegador (Vozes Naturais PT-BR ranqueadas)</option>
              <option value="elevenlabs" ${cfg.ttsProvider === 'elevenlabs' ? 'selected' : ''}>ElevenLabs Flash v2.5 (Ultra-Realista)</option>
              <option value="openai" ${cfg.ttsProvider === 'openai' ? 'selected' : ''}>OpenAI gpt-4o-mini-tts (Expressivo)</option>
              <option value="custom_tts" ${cfg.ttsProvider === 'custom_tts' ? 'selected' : ''}>Servidor Local TTS (Kokoro / Qwen3 / Edge-TTS)</option>
            </select>
          </label>

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
                     <span>ElevenLabs API Key (local)</span>
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
                     <span>OpenAI Key (ou usa a chave OpenAI da aba IA)</span>
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
            <label><input id="cfg-phone-filter" type="checkbox" ${cfg.phoneFilter ? 'checked' : ''} /> Filtro de linha telefônica realista (310–3300Hz)</label>
            <label><input id="cfg-voice-enabled" type="checkbox" ${cfg.voiceEnabled ? 'checked' : ''} /> Voz das vítimas ativa</label>
            <label><input id="cfg-sfx-enabled" type="checkbox" ${cfg.sfxEnabled ? 'checked' : ''} /> Efeitos sonoros Win11</label>
          </div>

          <div class="cfg-actions">
            <button type="submit" class="win-btn win-btn-primary">Salvar Áudio</button>
            <button type="button" class="win-btn" data-cfg-action="preview-voice">Testar Voz Agora</button>
          </div>
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

    // Default tab: AI Providers
    const meta = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.offline;
    const activeKey = getActiveApiKey(cfg);
    const providerOpts = Object.entries(AI_PROVIDERS)
      .map(
        ([key, val]) => {
          const hasSavedKey = Boolean(cfg.keysByProvider?.[key]);
          const suffix = hasSavedKey ? ' [Chave salva]' : '';
          return `<option value="${key}" ${cfg.provider === key ? 'selected' : ''}>${escapeHtml(val.label + suffix)}</option>`;
        }
      )
      .join('');

    const presetChips = (meta.presets || [])
      .map(
        (m) => `<button type="button" class="win-btn win-btn-mini ${cfg.model === m ? 'win-btn-primary' : ''}" data-model-preset="${escapeHtml(m)}">${escapeHtml(m)}</button>`
      )
      .join('');

    const statusClass = this.testOk === true ? 'is-ok' : this.testOk === false ? 'is-bad' : '';
    const statusText = this.testStatus || `Motor ativo: ${meta.label}`;

    this.el.innerHTML = `
      ${tabs}
      <form id="ai-config-form" class="cfg-form">
        <div class="cfg-notice">
          Cofre local: cada provedor guarda sua própria API Key exclusivamente no <strong>localStorage</strong> do seu navegador.
        </div>

        <label class="cfg-field">
          <span>Provedor de Inteligência Artificial</span>
          <select id="cfg-provider" class="win-input">${providerOpts}</select>
        </label>

        <label class="cfg-field">
          <span>Modelo (clique num preset ou digite)</span>
          <input id="cfg-model" type="text" class="win-input" value="${escapeHtml(cfg.model || meta.defaultModel)}" ${cfg.provider === 'offline' ? 'disabled' : ''} />
        </label>

        <div class="preset-row">${presetChips}</div>

        <label class="cfg-field">
          <span>API Key de ${escapeHtml(meta.label)}</span>
          <input id="cfg-apikey" type="password" class="win-input" autocomplete="off"
            placeholder="${meta.needsKey ? 'Cole sua chave aqui...' : 'Opcional / Não necessária'}"
            value="${escapeHtml(activeKey)}" ${cfg.provider === 'offline' ? 'disabled' : ''} />
        </label>

        ${
          cfg.provider === 'custom'
            ? `<label class="cfg-field">
                 <span>Endpoint OpenAI-compatible (Ollama / LM Studio)</span>
                 <input id="cfg-endpoint" type="text" class="win-input" value="${escapeHtml(cfg.customEndpoint)}" />
               </label>`
            : ''
        }

        <div class="cfg-actions">
          <button type="submit" class="win-btn win-btn-primary">Salvar Localmente</button>
          <button type="button" class="win-btn" data-cfg-action="test">Testar Conexão</button>
          <button type="button" class="win-btn win-btn-danger" data-cfg-action="clear-key">Limpar Chave</button>
          <button type="button" class="win-btn" data-cfg-action="reset-save">Resetar Save</button>
        </div>

        <div id="cfg-test-status" class="status-pill ${statusClass}">${escapeHtml(statusText)}</div>
      </form>
    `;
  }
}
