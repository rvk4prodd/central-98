import { UPGRADES, getUpgradePrice } from '../data/upgrades.js';
import { getAvailableVictims } from '../state.js';
import { AI_PROVIDERS } from '../engine/ai-client.js';
import { soundEngine } from '../engine/audio.js';
import { drawBossPortrait, drawVictimPortrait } from '../engine/sprites.js';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export class AppRenderer {
  constructor(game, winMgr) {
    this.game = game;
    this.winMgr = winMgr;
    this.micActive = false;
    this.activeRec = null;

    this.els = {
      phoneBody: document.getElementById('phone-body'),
      traceBody: document.getElementById('trace-body'),
      scamazonBody: document.getElementById('scamazon-body'),
      doctorBody: document.getElementById('doctor-body'),
      configBody: document.getElementById('config-body'),
      virusLayer: document.getElementById('virus-layer'),
      hudDay: document.getElementById('hud-day'),
      hudQuota: document.getElementById('hud-quota'),
      hudWallet: document.getElementById('hud-wallet'),
      hudTimer: document.getElementById('hud-timer'),
      hudTemp: document.getElementById('hud-temp'),
      hudStrikes: document.getElementById('hud-strikes'),
      opBadge: document.getElementById('operator-status-badge'),
      toastBar: document.getElementById('toast-bar'),
      bsodOverlay: document.getElementById('bsod-overlay'),
      shiftModal: document.getElementById('shift-modal'),
      shiftModalBody: document.getElementById('shift-modal-body')
    };

    this.bindDelegatedEvents();
  }

  bindDelegatedEvents() {
    // Fone98 events
    this.els.phoneBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'dial') {
        this.game.dialVictim(btn.dataset.victimId);
      } else if (action === 'hangup') {
        this.game.hangUpCall();
      } else if (action === 'hold') {
        this.game.toggleHold();
      } else if (action === 'replay') {
        this.game.replayLastVictimAudio();
      } else if (action === 'hint') {
        const input = document.getElementById('call-msg-input');
        if (input) {
          input.value = btn.dataset.text || '';
          input.focus();
        }
      } else if (action === 'copy-secret') {
        const secret = btn.dataset.secret || '';
        const redeemInput = document.getElementById('redeem-code-input');
        if (redeemInput) redeemInput.value = secret;
        navigator.clipboard?.writeText(secret).catch(() => {});
        this.winMgr.openOrFocus('win-scamazon');
        this.game.notify(`Código ${secret} copiado! Clique em Resgatar na Scamazon.`);
      } else if (action === 'soundboard') {
        soundEngine.playSoundboard(btn.dataset.sound);
      } else if (action === 'mic') {
        this.toggleMic();
      }
    });

    this.els.phoneBody.addEventListener('submit', (e) => {
      if (e.target.id !== 'call-chat-form') return;
      e.preventDefault();
      const input = document.getElementById('call-msg-input');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      this.game.sendPlayerMessage(val);
    });

    // GeoTrace events
    this.els.traceBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'toggle-trace') {
        this.game.toggleTrace();
      } else if (btn.dataset.action === 'use-fact') {
        const input = document.getElementById('call-msg-input');
        if (input) {
          const snippet = btn.dataset.fact || '';
          input.value = input.value ? `${input.value} (${snippet})` : snippet;
          this.winMgr.openOrFocus('win-phone');
          input.focus();
        }
      }
    });

    // Scamazon events
    this.els.scamazonBody.addEventListener('submit', (e) => {
      if (e.target.id !== 'redeem-form') return;
      e.preventDefault();
      const input = document.getElementById('redeem-code-input');
      if (!input) return;
      const res = this.game.redeemCode(input.value);
      if (res.ok) input.value = '';
    });

    this.els.scamazonBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="buy-upgrade"]');
      if (!btn) return;
      this.game.buyUpgrade(btn.dataset.upgradeId);
    });

    // PC Doctor events
    this.els.doctorBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-repair]');
      if (!btn) return;
      this.game.repairPc(btn.dataset.repair);
    });

    // Virus popups
    this.els.virusLayer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-close-virus]');
      if (!btn) return;
      this.game.closeVirusPopup(btn.dataset.closeVirus);
    });

    // Config IA events
    this.els.configBody.addEventListener('change', (e) => {
      const el = e.target;
      if (el.id === 'cfg-provider') {
        const provider = el.value;
        const defaultModel = AI_PROVIDERS[provider]?.defaultModel || '';
        this.game.updateAiConfig({ provider, model: defaultModel });
      } else if (el.id === 'cfg-tts-mode') {
        this.game.updateAiConfig({ ttsMode: el.value });
      } else if (el.id === 'cfg-voice-enabled') {
        this.game.updateAiConfig({ voiceEnabled: el.checked });
      } else if (el.id === 'cfg-sfx-enabled') {
        this.game.updateAiConfig({ sfxEnabled: el.checked });
      } else if (el.id === 'cfg-voice-speed') {
        this.game.updateAiConfig({ voiceSpeed: parseFloat(el.value) || 1.0 });
      } else if (el.id === 'cfg-volume') {
        this.game.updateAiConfig({ volume: parseFloat(el.value) || 0.85 });
      }
    });

    this.els.configBody.addEventListener('submit', (e) => {
      if (e.target.id !== 'ai-config-form') return;
      e.preventDefault();
      const key = document.getElementById('cfg-apikey')?.value || '';
      const model = document.getElementById('cfg-model')?.value || '';
      const customEndpoint = document.getElementById('cfg-endpoint')?.value || '';
      this.game.updateAiConfig({ apiKey: key.trim(), model: model.trim(), customEndpoint: customEndpoint.trim() });
      this.game.notify('Configurações de IA salvas localmente no seu dispositivo.');
    });

    this.els.configBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-cfg-action]');
      if (!btn) return;
      const act = btn.dataset.cfgAction;

      if (act === 'test') {
        const key = document.getElementById('cfg-apikey')?.value || '';
        const model = document.getElementById('cfg-model')?.value || '';
        const customEndpoint = document.getElementById('cfg-endpoint')?.value || '';
        this.game.updateAiConfig({ apiKey: key.trim(), model: model.trim(), customEndpoint: customEndpoint.trim() });
        const statusEl = document.getElementById('cfg-test-status');
        if (statusEl) statusEl.textContent = 'Testando conexão...';
        const res = await this.game.testAiConnection();
        if (statusEl) {
          statusEl.textContent = res.message;
          statusEl.className = `status-pill ${res.ok ? 'is-ok' : 'is-bad'}`;
        }
      } else if (act === 'clear-key') {
        this.game.clearApiKey();
      } else if (act === 'reset-save') {
        if (window.confirm('Apagar todo o progresso do jogo e começar do Dia 1?')) {
          this.game.resetCampaign();
        }
      }
    });

    // BSOD reboot button
    document.getElementById('bsod-reboot-btn')?.addEventListener('click', () => {
      this.game.repairPc('reboot');
    });

    // Shift modal next day / restart
    this.els.shiftModalBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="next-day"]');
      if (!btn) return;
      this.game.nextDay();
    });
  }

  toggleMic() {
    if (this.micActive && this.activeRec) {
      this.activeRec.stop();
      this.micActive = false;
      this.renderPhone();
      return;
    }

    this.micActive = true;
    this.renderPhone();
    this.activeRec = soundEngine.listenMicrophone({
      onResult: (transcript) => {
        const input = document.getElementById('call-msg-input');
        if (input && transcript) {
          input.value = transcript;
        }
        if (transcript) {
          this.game.sendPlayerMessage(transcript);
        }
      },
      onError: (errMsg) => {
        this.game.notify(errMsg, true);
      },
      onEnd: () => {
        this.micActive = false;
        this.activeRec = null;
        this.renderPhone();
      }
    });
  }

  renderAll(eventType = 'update') {
    this.renderHud();
    this.renderPhone(eventType);
    this.renderTrace();
    this.renderScamazon();
    this.renderDoctor();
    if (eventType === 'update' || eventType === 'config' || eventType === 'reset') {
      this.renderConfig();
    }
    this.renderViruses();
    this.renderOverlays();
  }

  renderHud() {
    const s = this.game.state;
    this.els.hudDay.textContent = `DIA ${s.day}`;
    this.els.hudQuota.textContent = `META: R$ ${s.shiftEarned} / R$ ${s.quota}`;
    this.els.hudQuota.classList.toggle('is-ok', s.shiftEarned >= s.quota);
    this.els.hudWallet.textContent = `CAIXA: R$ ${s.wallet}`;
    this.els.hudTimer.textContent = formatTime(s.shiftTimeLeft);
    this.els.hudTemp.textContent = `CPU ${Math.round(s.pc.cpuTemp)}°C`;
    this.els.hudTemp.classList.toggle('is-danger', s.pc.cpuTemp >= 80);
    this.els.hudStrikes.textContent = `AVISOS ${s.strikes}/${s.maxStrikes}`;

    const modeLabels = {
      idle: 'EM LINHA',
      typing: 'DIGITANDO...',
      talking: 'VOZ ATIVA',
      sweating: 'PRESSÃO!',
      celebrating: 'GOLPE FEITO!',
      panicking: 'ALERTA PC!'
    };
    this.els.opBadge.textContent = modeLabels[this.game.operatorMode] || 'ONLINE';
    this.els.opBadge.dataset.mode = this.game.operatorMode;

    if (this.game.lastToast) {
      this.els.toastBar.textContent = this.game.lastToast;
    }
  }

  renderPhone(eventType) {
    const s = this.game.state;
    const call = s.activeCall;
    const victim = this.game.getActiveVictim();

    // Avoid wiping user's typed draft on 1s timer ticks
    const existingInput = document.getElementById('call-msg-input');
    const draftValue = existingInput ? existingInput.value : '';
    const hadFocus = existingInput && document.activeElement === existingInput;

    if (eventType === 'tick' && call && call.status === 'active') {
      const patienceFill = document.getElementById('meter-patience-fill');
      const patienceText = document.getElementById('meter-patience-text');
      if (patienceFill && patienceText) {
        const pct = Math.round((call.patience / call.maxPatience) * 100);
        patienceFill.style.width = `${pct}%`;
        patienceText.textContent = `${call.patience}s`;
        return;
      }
    }

    if (!call || !victim) {
      const targets = getAvailableVictims(s);
      const rows = targets
        .map((v) => {
          const done = s.completedIds.includes(v.id);
          return `
            <div class="target-card ${done ? 'is-done' : ''}">
              <div class="target-info">
                <div class="target-name">
                  ${escapeHtml(v.name)}
                  ${v.isScambaiter ? '<span class="tag tag-warn">RISCO VÍRUS</span>' : ''}
                  ${done ? '<span class="tag tag-ok">EXTRAÍDO</span>' : ''}
                </div>
                <div class="target-meta">${escapeHtml(v.role)} — ${escapeHtml(v.company)}</div>
                <div class="target-goal">Alvo: <strong>${escapeHtml(v.goalLabel)}</strong> • Prêmio: <strong>R$ ${v.payout}</strong></div>
              </div>
              <button type="button" class="btn98 btn-primary" data-action="dial" data-victim-id="${v.id}">
                Ligar
              </button>
            </div>
          `;
        })
        .join('');

      this.els.phoneBody.innerHTML = `
        <div class="app-banner">
          <span>Lista de Discagem — Dia ${s.day}</span>
          <span class="badge-provider">${escapeHtml(AI_PROVIDERS[this.game.aiConfig.provider]?.label || 'Local')}</span>
        </div>
        <div class="target-list">${rows}</div>
      `;
      return;
    }

    const patiencePct = Math.round((call.patience / call.maxPatience) * 100);
    const lastVictimMsg = [...call.messages].reverse().find((m) => m.role === 'victim');
    const mood = lastVictimMsg?.mood || 'calm';

    const messagesHtml = call.messages
      .map(
        (m) => `
        <div class="chat-msg ${m.role === 'player' ? 'is-player' : 'is-victim'}">
          <span class="chat-who">${m.role === 'player' ? 'Você' : escapeHtml(victim.name)}:</span>
          <span class="chat-text">${escapeHtml(m.text)}</span>
        </div>
      `
      )
      .join('');

    const hintsHtml = victim.scriptHints
      .map(
        (h, i) => `<button type="button" class="btn98 btn-hint" data-action="hint" data-text="${escapeHtml(h)}">Script ${i + 1}</button>`
      )
      .join('');

    const secretBox = call.extractedSecret
      ? `
        <div class="secret-banner">
          <div>
            <strong>DADO EXTRAÍDO:</strong>
            <code>${escapeHtml(call.extractedSecret)}</code>
          </div>
          <button type="button" class="btn98 btn-cash" data-action="copy-secret" data-secret="${escapeHtml(call.extractedSecret)}">
            ${call.redeemed ? 'Já Resgatado' : 'Copiar p/ Scamazon'}
          </button>
        </div>
      `
      : '';

    this.els.phoneBody.innerHTML = `
      <div class="call-header">
        <canvas id="victim-portrait-canvas" width="32" height="32" class="pixel-canvas victim-portrait"></canvas>
        <div class="call-id">
          <div class="call-name">${escapeHtml(victim.name)} <small>(${escapeHtml(victim.phone)})</small></div>
          <div class="call-goal">${escapeHtml(victim.goalLabel)} • R$ ${victim.payout}</div>
          <div class="voice-wave ${this.game.isSpeaking ? 'is-active' : ''}">
            <span></span><span></span><span></span><span></span><span></span>
            <small>${this.game.isSpeaking ? 'Falando na linha...' : call.onHold ? 'Em espera' : 'Linha aberta'}</small>
          </div>
        </div>
        <div class="call-actions-top">
          <button type="button" class="btn98" data-action="replay" title="Ouvir última fala novamente">Ouvir</button>
          <button type="button" class="btn98 ${call.onHold ? 'is-pressed' : ''}" data-action="hold">${call.onHold ? 'Retomar' : 'Espera'}</button>
          <button type="button" class="btn98 btn-danger" data-action="hangup">${call.status === 'active' ? 'Desligar' : 'Voltar'}</button>
        </div>
      </div>

      <div class="meters-grid">
        <div class="meter-row">
          <label>Confiança</label>
          <div class="meter-track"><div class="meter-fill is-trust" style="width:${call.trust}%"></div></div>
          <span>${call.trust}%</span>
        </div>
        <div class="meter-row">
          <label>Suspeita</label>
          <div class="meter-track"><div class="meter-fill is-suspicion" style="width:${call.suspicion}%"></div></div>
          <span>${call.suspicion}%</span>
        </div>
        <div class="meter-row">
          <label>Paciência</label>
          <div class="meter-track"><div id="meter-patience-fill" class="meter-fill is-patience" style="width:${patiencePct}%"></div></div>
          <span id="meter-patience-text">${call.patience}s</span>
        </div>
      </div>

      ${secretBox}

      <div class="chat-log" id="call-chat-log">${messagesHtml}</div>

      <div class="script-strip">
        ${hintsHtml}
        <button type="button" class="btn98 btn-mini" data-action="soundboard" data-sound="typing">SFX Teclado</button>
        <button type="button" class="btn98 btn-mini" data-action="soundboard" data-sound="beep">SFX Sistema</button>
      </div>

      <form id="call-chat-form" class="chat-form">
        <input id="call-msg-input" type="text" class="input98" autocomplete="off"
          placeholder="${call.status === 'active' ? 'Fale ou digite sua lábia aqui...' : 'Ligação encerrada — clique em Voltar'}"
          ${call.status !== 'active' ? 'disabled' : ''} />
        <button type="button" class="btn98 ${this.micActive ? 'btn-danger' : ''}" data-action="mic" ${call.status !== 'active' ? 'disabled' : ''}>
          ${this.micActive ? 'Parar Mic' : 'Mic'}
        </button>
        <button type="submit" class="btn98 btn-primary" ${call.status !== 'active' || this.game.isSending ? 'disabled' : ''}>
          ${this.game.isSending ? '...' : 'Enviar'}
        </button>
      </form>
    `;

    const portraitCanvas = document.getElementById('victim-portrait-canvas');
    drawVictimPortrait(portraitCanvas, victim, mood, this.game.isSpeaking);

    const logEl = document.getElementById('call-chat-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;

    const restoredInput = document.getElementById('call-msg-input');
    if (restoredInput && draftValue) {
      restoredInput.value = draftValue;
      if (hadFocus) restoredInput.focus();
    }
  }

  renderTrace() {
    const call = this.game.state.activeCall;
    const victim = this.game.getActiveVictim();

    if (!call || !victim) {
      this.els.traceBody.innerHTML = `
        <div class="trace-layout">
          <canvas id="trace-globe-canvas" width="160" height="120" class="trace-canvas"></canvas>
          <div class="trace-side">
            <p class="muted-note">Inicie uma ligação no <strong>Fone98</strong> para rastrear o IP e puxar o dossiê do alvo em tempo real.</p>
            <p class="muted-note">Citar fatos do dossiê na conversa aumenta muito a confiança da vítima.</p>
          </div>
        </div>
      `;
      return;
    }

    const factsHtml = victim.traceFacts
      .map((fact, idx) => {
        const unlocked = call.revealedFacts.includes(idx);
        return unlocked
          ? `
            <div class="fact-item is-unlocked">
              <div><strong>${escapeHtml(fact.label)}:</strong> ${escapeHtml(fact.value)}</div>
              <button type="button" class="btn98 btn-mini" data-action="use-fact" data-fact="${escapeHtml(fact.value)}">Inserir</button>
            </div>
          `
          : `<div class="fact-item is-locked">[CRIPTOGRAFADO — Rastreie para revelar #${idx + 1}]</div>`;
      })
      .join('');

    this.els.traceBody.innerHTML = `
      <div class="trace-layout">
        <canvas id="trace-globe-canvas" width="160" height="120" class="trace-canvas"></canvas>
        <div class="trace-side">
          <div><strong>Alvo:</strong> ${escapeHtml(victim.name)}</div>
          <div><strong>Empresa:</strong> ${escapeHtml(victim.company)}</div>
          <div class="meter-row">
            <label>Progresso</label>
            <div class="meter-track"><div class="meter-fill is-trust" style="width:${call.traceProgress}%"></div></div>
            <span>${Math.round(call.traceProgress)}%</span>
          </div>
          <button type="button" class="btn98 btn-primary" data-action="toggle-trace" ${call.traceProgress >= 100 || call.status !== 'active' ? 'disabled' : ''}>
            ${call.traceProgress >= 100 ? 'Dossiê 100%' : call.isTracing ? 'Pausar Rastreio' : 'Iniciar GeoTrace'}
          </button>
        </div>
      </div>
      <div class="facts-list">${factsHtml}</div>
    `;
  }

  renderScamazon() {
    const s = this.game.state;
    const redeemEl = document.getElementById('redeem-code-input');
    const draftCode = redeemEl ? redeemEl.value : '';

    const upgradesHtml = UPGRADES.map((u) => {
      const lvl = s.upgrades[u.id] || 0;
      const maxed = lvl >= u.maxLevel;
      const price = getUpgradePrice(u, lvl);
      const canBuy = !maxed && s.wallet >= price;
      return `
        <div class="upgrade-card">
          <div class="upgrade-info">
            <div class="upgrade-name">${escapeHtml(u.name)} <span class="tag">Nv ${lvl}/${u.maxLevel}</span></div>
            <div class="upgrade-desc">${escapeHtml(u.shortDesc)}</div>
            <div class="upgrade-effect">${escapeHtml(u.effectLabel)}</div>
          </div>
          <button type="button" class="btn98 ${canBuy ? 'btn-primary' : ''}" data-action="buy-upgrade" data-upgrade-id="${u.id}" ${maxed || !canBuy ? 'disabled' : ''}>
            ${maxed ? 'MÁXIMO' : `R$ ${price}`}
          </button>
        </div>
      `;
    }).join('');

    this.els.scamazonBody.innerHTML = `
      <form id="redeem-form" class="redeem-box">
        <div class="redeem-title">SCAMAZON — Central de Resgate & Lavagem</div>
        <div class="redeem-row">
          <input id="redeem-code-input" type="text" class="input98" placeholder="Cole código / senha / PIX extraído..." value="${escapeHtml(draftCode)}" />
          <button type="submit" class="btn98 btn-cash">Resgatar</button>
        </div>
      </form>
      <div class="shop-header">Upgrades do Escritório & PC (Caixa: <strong>R$ ${s.wallet}</strong>)</div>
      <div class="upgrade-list">${upgradesHtml}</div>
    `;
  }

  renderDoctor() {
    const pc = this.game.state.pc;
    const tempPct = Math.round(((pc.cpuTemp - 35) / 65) * 100);

    this.els.doctorBody.innerHTML = `
      <div class="doctor-stats">
        <div class="meter-row">
          <label>Temp CPU</label>
          <div class="meter-track"><div class="meter-fill ${pc.cpuTemp >= 80 ? 'is-suspicion' : 'is-trust'}" style="width:${Math.min(100, Math.max(5, tempPct))}%"></div></div>
          <span>${Math.round(pc.cpuTemp)}°C</span>
        </div>
        <div class="meter-row">
          <label>Saúde PC</label>
          <div class="meter-track"><div class="meter-fill is-trust" style="width:${Math.round(pc.pcHealth)}%"></div></div>
          <span>${Math.round(pc.pcHealth)}%</span>
        </div>
        <div class="meter-row">
          <label>Poeira</label>
          <div class="meter-track"><div class="meter-fill is-patience" style="width:${Math.round(pc.dustLevel)}%"></div></div>
          <span>${Math.round(pc.dustLevel)}%</span>
        </div>
      </div>

      <div class="pc-interior">
        <div class="pc-part ${pc.dustLevel > 50 ? 'is-warn' : ''}">
          <div><strong>Cooler & Dissipador</strong><br/><small>Poeira: ${Math.round(pc.dustLevel)}%</small></div>
          <button type="button" class="btn98 btn-primary" data-repair="dust">Soprar Poeira</button>
        </div>
        <div class="pc-part ${pc.looseCable ? 'is-bad' : ''}">
          <div><strong>Cabo de Força SATA</strong><br/><small>${pc.looseCable ? 'SOLTO! Causando instabilidade' : 'Conectado firme'}</small></div>
          <button type="button" class="btn98 ${pc.looseCable ? 'btn-danger' : ''}" data-repair="cable" ${pc.looseCable ? '' : 'disabled'}>Encaixar</button>
        </div>
        <div class="pc-part ${pc.burntCap ? 'is-bad' : ''}">
          <div><strong>Capacitor VRM</strong><br/><small>${pc.burntCap ? 'ESTUFADO! Esquentando CPU' : 'Tensão normal'}</small></div>
          <button type="button" class="btn98 ${pc.burntCap ? 'btn-danger' : ''}" data-repair="capacitor" ${pc.burntCap ? '' : 'disabled'}>Trocar Peça</button>
        </div>
        <div class="pc-part ${pc.activeViruses.length > 0 ? 'is-bad' : ''}">
          <div><strong>Avastão 98 Scanner</strong><br/><small>${pc.activeViruses.length} vírus ativo(s)</small></div>
          <button type="button" class="btn98 ${pc.activeViruses.length > 0 ? 'btn-danger' : ''}" data-repair="antivirus" ${pc.activeViruses.length > 0 ? '' : 'disabled'}>Limpar Vírus</button>
        </div>
      </div>
    `;
  }

  renderConfig() {
    const cfg = this.game.aiConfig;
    const providerMeta = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.offline;
    const options = Object.entries(AI_PROVIDERS)
      .map(
        ([key, val]) => `<option value="${key}" ${cfg.provider === key ? 'selected' : ''}>${escapeHtml(val.label)}</option>`
      )
      .join('');

    this.els.configBody.innerHTML = `
      <form id="ai-config-form" class="cfg-form">
        <div class="cfg-notice">
          Sua chave API fica salva <strong>exclusivamente no localStorage deste navegador</strong>. Nenhuma chave é enviada para servidores do jogo.
        </div>

        <label class="cfg-field">
          <span>Motor de IA das Vítimas</span>
          <select id="cfg-provider" class="input98">${options}</select>
        </label>

        <label class="cfg-field">
          <span>Modelo</span>
          <input id="cfg-model" type="text" class="input98" value="${escapeHtml(cfg.model || providerMeta.defaultModel)}" ${cfg.provider === 'offline' ? 'disabled' : ''} />
        </label>

        <label class="cfg-field">
          <span>API Key (armazenada localmente)</span>
          <input id="cfg-apikey" type="password" class="input98" autocomplete="off" placeholder="${providerMeta.needsKey ? 'Cole sua chave aqui (sk-... / AIza...)' : 'Opcional / Não necessária'}" value="${escapeHtml(cfg.apiKey)}" ${cfg.provider === 'offline' ? 'disabled' : ''} />
        </label>

        ${
          cfg.provider === 'custom'
            ? `<label class="cfg-field">
                 <span>Endpoint OpenAI-compatible</span>
                 <input id="cfg-endpoint" type="text" class="input98" value="${escapeHtml(cfg.customEndpoint)}" />
               </label>`
            : ''
        }

        <div class="cfg-row-2">
          <label class="cfg-field">
            <span>Voz das Vítimas (TTS)</span>
            <select id="cfg-tts-mode" class="input98">
              <option value="browser" ${cfg.ttsMode === 'browser' ? 'selected' : ''}>Voz Local do Dispositivo (Grátis)</option>
              <option value="openai" ${cfg.ttsMode === 'openai' ? 'selected' : ''}>OpenAI TTS-1 (requer chave OpenAI)</option>
            </select>
          </label>
          <label class="cfg-field">
            <span>Velocidade da Voz (${cfg.voiceSpeed}x)</span>
            <input id="cfg-voice-speed" type="range" min="0.75" max="1.4" step="0.05" value="${cfg.voiceSpeed}" />
          </label>
        </div>

        <div class="cfg-checks">
          <label><input id="cfg-voice-enabled" type="checkbox" ${cfg.voiceEnabled ? 'checked' : ''} /> Ouvir voz das vítimas</label>
          <label><input id="cfg-sfx-enabled" type="checkbox" ${cfg.sfxEnabled ? 'checked' : ''} /> Efeitos sonoros Win98</label>
        </div>

        <div class="cfg-actions">
          <button type="submit" class="btn98 btn-primary">Salvar Localmente</button>
          <button type="button" class="btn98" data-cfg-action="test">Testar Conexão</button>
          <button type="button" class="btn98 btn-danger" data-cfg-action="clear-key">Apagar Chave</button>
          <button type="button" class="btn98" data-cfg-action="reset-save">Resetar Save</button>
        </div>
        <div id="cfg-test-status" class="status-pill">Provedor atual: ${escapeHtml(providerMeta.label)}</div>
      </form>
    `;
  }

  renderViruses() {
    const viruses = this.game.state.pc.activeViruses;
    this.els.virusLayer.innerHTML = viruses
      .map((v, idx) => {
        const top = 36 + ((idx * 34) % 140);
        const left = 24 + ((idx * 42) % 180);
        return `
          <div class="os-window virus-popup" style="top:${top}px;left:${left}px;z-index:90;">
            <div class="win-titlebar is-virus">
              <span>ALERTA: ${escapeHtml(v.source)}</span>
              <button type="button" class="win-btn" data-close-virus="${v.id}">X</button>
            </div>
            <div class="win-body virus-body">
              <p><strong>${escapeHtml(v.title)}</strong></p>
              <p>Esquentando sua CPU! Feche agora ou limpe no PC Doctor.</p>
              <button type="button" class="btn98 btn-danger" data-close-virus="${v.id}">Fechar Pop-up</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderOverlays() {
    const s = this.game.state;
    this.els.bsodOverlay.classList.toggle('is-hidden', !s.pc.isCrashed);

    const report = s.lastShiftReport;
    this.els.shiftModal.classList.toggle('is-hidden', !report);
    if (report) {
      const quotesHtml = report.sampleQuotes.length
        ? report.sampleQuotes
            .map((q) => `<li><strong>Para ${escapeHtml(q.victimName)}:</strong> "${escapeHtml(q.playerText)}"</li>`)
            .join('')
        : '<li>Você mal abriu a boca nesse turno inteiro!</li>';

      this.els.shiftModalBody.innerHTML = `
        <div class="boss-header">
          <canvas id="boss-portrait-canvas" width="32" height="32" class="pixel-canvas victim-portrait"></canvas>
          <div>
            <div class="boss-name">AVALIAÇÃO DO SR. CARIL — DIA ${report.day}</div>
            <div class="boss-grade">Nota do Turno: <span class="grade-badge">${report.grade}</span></div>
          </div>
        </div>
        <p class="boss-quote">"${escapeHtml(report.mrCurryLine)}"</p>
        <div class="boss-stats">
          <span>Faturado: <strong>R$ ${report.earned}</strong></span>
          <span>Meta: <strong>R$ ${report.quota}</strong></span>
          <span>Avisos: <strong>${report.strikes}/${report.maxStrikes}</strong></span>
        </div>
        <div class="boss-clips">
          <strong>Gravações do Seu Turno:</strong>
          <ul>${quotesHtml}</ul>
        </div>
        <div class="boss-footer">
          <button type="button" class="btn98 btn-primary" data-action="next-day">
            ${report.fired ? 'Recomeçar Carreira (Dia 1)' : `Iniciar Dia ${s.day + 1}`}
          </button>
        </div>
      `;
      drawBossPortrait(document.getElementById('boss-portrait-canvas'), !report.hitQuota || report.fired);
    }
  }
}
