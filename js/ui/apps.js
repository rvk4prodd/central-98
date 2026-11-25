import { UPGRADES, getUpgradePrice } from '../data/upgrades.js';
import { getAvailableVictims } from '../state.js';
import { AI_PROVIDERS } from '../engine/ai-client.js';
import { soundEngine } from '../engine/audio.js';
import { drawBossPortrait, drawVictimPortrait } from '../engine/sprites.js';
import { ConfigUi } from './config-ui.js';

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
    this.showCustomForm = false;
    this.scamazonTab = 'giftcard'; // 'giftcard' | 'bank' | 'crypto'

    this.els = {
      phoneBody: document.getElementById('phone-body'),
      remoteBody: document.getElementById('remote-body'),
      traceBody: document.getElementById('trace-body'),
      scamazonBody: document.getElementById('scamazon-body'),
      fakeshieldBody: document.getElementById('fakeshield-body'),
      doctorBody: document.getElementById('doctor-body'),
      configBody: document.getElementById('config-body'),
      virusLayer: document.getElementById('virus-layer'),
      hudDay: document.getElementById('hud-day'),
      hudQuota: document.getElementById('hud-quota'),
      hudWallet: document.getElementById('hud-wallet'),
      hudTimer: document.getElementById('hud-timer'),
      hudHeat: document.getElementById('hud-heat'),
      hudTemp: document.getElementById('hud-temp'),
      hudStrikes: document.getElementById('hud-strikes'),
      opBadge: document.getElementById('operator-status-badge'),
      toastBar: document.getElementById('toast-bar'),
      raidBanner: document.getElementById('police-raid-banner'),
      raidCountdown: document.getElementById('raid-countdown'),
      excelOverlay: document.getElementById('excel-panic-overlay'),
      bsodOverlay: document.getElementById('bsod-overlay'),
      shiftModal: document.getElementById('shift-modal'),
      shiftModalBody: document.getElementById('shift-modal-body')
    };

    this.configUi = new ConfigUi(this.els.configBody, this.game);
    this.bindDelegatedEvents();
  }

  bindDelegatedEvents() {
    // PhoneLink VoIP events
    this.els.phoneBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'dial') {
        this.game.dialVictim(btn.dataset.victimId);
      } else if (action === 'toggle-custom-form') {
        this.showCustomForm = !this.showCustomForm;
        this.renderPhone('update');
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
        const channel = btn.dataset.channel || 'giftcard';
        this.scamazonTab = channel;
        navigator.clipboard?.writeText(secret).catch(() => {});
        this.winMgr.openOrFocus('win-scamazon');
        this.renderScamazon();
        const redeemInput = document.getElementById('redeem-code-input');
        if (redeemInput) redeemInput.value = secret;
        this.game.notify(`Código ${secret} pronto para resgate na aba ${channel.toUpperCase()}!`);
      } else if (action === 'soundboard') {
        soundEngine.playSoundboard(btn.dataset.sound);
      } else if (action === 'mic') {
        this.toggleMic();
      }
    });

    this.els.phoneBody.addEventListener('submit', (e) => {
      if (e.target.id === 'call-chat-form') {
        e.preventDefault();
        const input = document.getElementById('call-msg-input');
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        input.value = '';
        this.game.sendPlayerMessage(val);
      } else if (e.target.id === 'custom-victim-form') {
        e.preventDefault();
        const res = this.game.createCustomVictim({
          name: document.getElementById('cv-name')?.value,
          role: document.getElementById('cv-role')?.value,
          company: document.getElementById('cv-company')?.value,
          payout: document.getElementById('cv-payout')?.value,
          scamChannel: document.getElementById('cv-channel')?.value,
          gender: document.getElementById('cv-gender')?.value,
          personaPrompt: document.getElementById('cv-persona')?.value,
          isScambaiter: document.getElementById('cv-baiter')?.checked
        });
        if (res.ok) {
          this.showCustomForm = false;
          this.renderPhone('update');
        }
      }
    });

    // AnyControl Remote Desktop events
    this.els.remoteBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-remote-action]');
      if (!btn) return;
      const act = btn.dataset.remoteAction;
      if (act === 'connect') this.game.connectAnyControl();
      else if (act === 'curtain') this.game.toggleBlackCurtain();
      else if (act === 'fakescan') this.game.runRemoteFakeScan();
      else if (act === 'open-file') this.game.openRemoteFile(Number(btn.dataset.fileIdx));
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

    // Scamazon & CryptoVault events
    this.els.scamazonBody.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('button[data-scam-tab]');
      if (tabBtn) {
        this.scamazonTab = tabBtn.dataset.scamTab;
        this.renderScamazon();
        return;
      }
      const btn = e.target.closest('button[data-action="buy-upgrade"]');
      if (btn) this.game.buyUpgrade(btn.dataset.upgradeId);
    });

    this.els.scamazonBody.addEventListener('submit', (e) => {
      if (e.target.id !== 'redeem-form') return;
      e.preventDefault();
      const input = document.getElementById('redeem-code-input');
      if (!input) return;
      const res = this.game.redeemCode(input.value, this.scamazonTab);
      if (res.ok) input.value = '';
    });

    // FakeShield AV events
    this.els.fakeshieldBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="send-fakeshield"]');
      if (btn) this.game.deployFakeShield();
    });

    // PC Doctor events
    this.els.doctorBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-repair]');
      if (btn) this.game.repairPc(btn.dataset.repair);
    });

    // Virus popups
    this.els.virusLayer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-close-virus]');
      if (btn) this.game.closeVirusPopup(btn.dataset.closeVirus);
    });

    // Panic Excel / Raid controls
    document.getElementById('panic-excel-btn')?.addEventListener('click', () => {
      this.game.togglePanicExcel();
    });
    document.getElementById('raid-dodge-btn')?.addEventListener('click', () => {
      if (!this.game.state.panicExcelMode) this.game.togglePanicExcel();
    });
    document.getElementById('excel-return-btn')?.addEventListener('click', () => {
      if (this.game.state.panicExcelMode) this.game.togglePanicExcel();
    });

    // BSOD reboot button
    document.getElementById('bsod-reboot-btn')?.addEventListener('click', () => {
      this.game.repairPc('reboot');
    });

    // Shift modal next day
    this.els.shiftModalBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="next-day"]');
      if (btn) this.game.nextDay();
    });
  }

  toggleMic() {
    if (this.micActive && this.activeRec) {
      this.activeRec.stop();
      this.micActive = false;
      this.renderPhone('update');
      return;
    }

    this.micActive = true;
    this.renderPhone('update');
    this.activeRec = soundEngine.listenMicrophone({
      onResult: (transcript) => {
        const input = document.getElementById('call-msg-input');
        if (input && transcript) input.value = transcript;
        if (transcript) this.game.sendPlayerMessage(transcript);
      },
      onError: (errMsg) => this.game.notify(errMsg, true),
      onEnd: () => {
        this.micActive = false;
        this.activeRec = null;
        this.renderPhone('update');
      }
    });
  }

  renderAll(eventType = 'update') {
    this.renderHud();
    this.renderPhone(eventType);
    this.renderRemote();
    this.renderTrace();
    this.renderFakeShield();
    this.renderScamazon();
    this.renderDoctor();
    if (eventType === 'update' || eventType === 'config' || eventType === 'reset') {
      this.configUi.render();
    }
    this.renderViruses();
    this.renderOverlays();
  }

  renderHud() {
    const s = this.game.state;
    this.els.hudDay.textContent = `DIA ${s.day}`;
    this.els.hudQuota.textContent = `META R$ ${s.shiftEarned}/${s.quota}`;
    this.els.hudQuota.classList.toggle('is-ok', s.shiftEarned >= s.quota);
    this.els.hudWallet.textContent = `CAIXA R$ ${s.wallet}`;
    this.els.hudTimer.textContent = formatTime(s.shiftTimeLeft);
    this.els.hudHeat.textContent = `POLÍCIA ${Math.round(s.policeHeat)}%`;
    this.els.hudHeat.classList.toggle('is-danger', s.policeHeat >= 65);
    this.els.hudTemp.textContent = `CPU ${Math.round(s.pc.cpuTemp)}°C`;
    this.els.hudTemp.classList.toggle('is-danger', s.pc.cpuTemp >= 80);
    this.els.hudStrikes.textContent = `AVISOS ${s.strikes}/${s.maxStrikes}`;

    const modeLabels = {
      idle: 'EM LINHA',
      typing: 'DIGITANDO...',
      talking: 'VOZ ATIVA',
      sweating: 'PRESSÃO!',
      celebrating: 'GOLPE FEITO!',
      panicking: 'ALERTA!'
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
      if (eventType === 'tick' && this.showCustomForm) return;
      const targets = getAvailableVictims(s);
      const customBox = this.showCustomForm
        ? `
          <form id="custom-victim-form" class="custom-victim-box">
            <div class="box-title">Criar Alvo de IA Personalizado</div>
            <div class="cfg-row-2">
              <input id="cv-name" type="text" class="win-input" placeholder="Nome (ex.: Seu Jorge)" required />
              <input id="cv-role" type="text" class="win-input" placeholder="Cargo (ex.: Dono de Padaria)" />
              <input id="cv-company" type="text" class="win-input" placeholder="Empresa (ex.: Pão Quente)" />
              <input id="cv-payout" type="number" class="win-input" value="950" min="200" max="5000" />
              <select id="cv-channel" class="win-input">
                <option value="bank">Canal: Banco / PIX</option>
                <option value="giftcard">Canal: Gift Card</option>
                <option value="crypto">Canal: CryptoVault</option>
              </select>
              <select id="cv-gender" class="win-input">
                <option value="male">Voz Masculina</option>
                <option value="female">Voz Feminina</option>
              </select>
            </div>
            <input id="cv-persona" type="text" class="win-input" placeholder="Personalidade (ex.: desconfia de ligações, mas tem medo do fisco)..." required />
            <div class="cfg-actions">
              <label class="inline-check"><input id="cv-baiter" type="checkbox" /> É um Scambaiter?</label>
              <button type="submit" class="win-btn win-btn-primary">Salvar Alvo</button>
            </div>
          </form>
        `
        : '';

      const rows = targets
        .map((v) => {
          const done = s.completedIds.includes(v.id);
          return `
            <div class="target-card ${done ? 'is-done' : ''}">
              <div class="target-info">
                <div class="target-name">
                  ${escapeHtml(v.name)}
                  ${v.isCustom ? '<span class="tag tag-accent">CUSTOM</span>' : ''}
                  ${v.isScambaiter ? '<span class="tag tag-warn">SCAMBAITER</span>' : ''}
                  ${done ? '<span class="tag tag-ok">EXTRAÍDO</span>' : ''}
                </div>
                <div class="target-meta">${escapeHtml(v.role)} — ${escapeHtml(v.company)}</div>
                <div class="target-goal">Alvo: <strong>${escapeHtml(v.goalLabel)}</strong> • Prêmio: <strong>R$ ${v.payout}</strong></div>
              </div>
              <button type="button" class="win-btn win-btn-primary" data-action="dial" data-victim-id="${v.id}">
                Ligar
              </button>
            </div>
          `;
        })
        .join('');

      this.els.phoneBody.innerHTML = `
        <div class="app-banner">
          <span>Discador Dia ${s.day} (${targets.length} alvos)</span>
          <div class="banner-right">
            <span class="badge-provider">${escapeHtml(AI_PROVIDERS[this.game.aiConfig.provider]?.label || 'Local')}</span>
            <button type="button" class="win-btn win-btn-mini" data-action="toggle-custom-form">
              ${this.showCustomForm ? 'Fechar Criador' : '+ Criar Alvo'}
            </button>
          </div>
        </div>
        ${customBox}
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
        (h, i) => `<button type="button" class="win-btn win-btn-mini" data-action="hint" data-text="${escapeHtml(h)}">Script ${i + 1}</button>`
      )
      .join('');

    const secretBox = call.extractedSecret
      ? `
        <div class="secret-banner">
          <div>
            <strong>EXTRAÍDO:</strong>
            <code>${escapeHtml(call.extractedSecret)}</code>
          </div>
          <button type="button" class="win-btn win-btn-cash" data-action="copy-secret" data-secret="${escapeHtml(call.extractedSecret)}" data-channel="${escapeHtml(victim.scamChannel || 'giftcard')}">
            ${call.redeemed ? 'Já Resgatado' : 'Resgatar Agora'}
          </button>
        </div>
      `
      : '';

    this.els.phoneBody.innerHTML = `
      <div class="call-header">
        <canvas id="victim-portrait-canvas" width="48" height="48" class="pixel-canvas victim-portrait"></canvas>
        <div class="call-id">
          <div class="call-name">${escapeHtml(victim.name)} <small>(${escapeHtml(victim.phone)})</small></div>
          <div class="call-goal">${escapeHtml(victim.goalLabel)} • R$ ${victim.payout}</div>
          <div class="voice-wave ${this.game.isSpeaking ? 'is-active' : ''}">
            <span></span><span></span><span></span><span></span><span></span>
            <small>${this.game.isSpeaking ? 'Falando na linha...' : call.onHold ? 'Em espera' : 'Linha conectada'}</small>
          </div>
        </div>
        <div class="call-actions-top">
          <button type="button" class="win-btn" data-action="replay">Ouvir</button>
          <button type="button" class="win-btn ${call.onHold ? 'is-pressed' : ''}" data-action="hold">${call.onHold ? 'Retomar' : 'Espera'}</button>
          <button type="button" class="win-btn win-btn-danger" data-action="hangup">${call.status === 'active' ? 'Desligar' : 'Voltar'}</button>
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
        <button type="button" class="win-btn win-btn-mini" data-action="soundboard" data-sound="typing">SFX Teclado</button>
        <button type="button" class="win-btn win-btn-mini" data-action="soundboard" data-sound="beep">SFX Sistema</button>
      </div>

      <form id="call-chat-form" class="chat-form">
        <input id="call-msg-input" type="text" class="win-input" autocomplete="off"
          placeholder="${call.status === 'active' ? 'Fale no mic ou digite sua lábia...' : 'Ligação encerrada — clique em Voltar'}"
          ${call.status !== 'active' ? 'disabled' : ''} />
        <button type="button" class="win-btn ${this.micActive ? 'win-btn-danger' : ''}" data-action="mic" ${call.status !== 'active' ? 'disabled' : ''}>
          ${this.micActive ? 'Parar' : 'Mic'}
        </button>
        <button type="submit" class="win-btn win-btn-primary" ${call.status !== 'active' || this.game.isSending ? 'disabled' : ''}>
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

  renderRemote() {
    const call = this.game.state.activeCall;
    const victim = this.game.getActiveVictim();

    if (!call || !victim) {
      this.els.remoteBody.innerHTML = `
        <div class="empty-card">
          <strong>AnyControl Desktop Remoto</strong>
          <p class="muted-note">Ligue para uma vítima e conquiste pelo menos <strong>35% de Confiança</strong> para assumir o PC dela, rodar scanner falso, ativar Tela Preta e puxar arquivos secretos.</p>
        </div>
      `;
      return;
    }

    if (!call.remoteConnected) {
      this.els.remoteBody.innerHTML = `
        <div class="empty-card">
          <strong>Sessão Pronta: ${escapeHtml(victim.name)}</strong>
          <p class="muted-note">Confiança atual: <strong>${call.trust}%</strong> (mínimo 35% para o alvo aceitar acesso remoto).</p>
          <button type="button" class="win-btn win-btn-primary" data-remote-action="connect" ${call.status !== 'active' ? 'disabled' : ''}>
            Conectar ao PC da Vítima
          </button>
        </div>
      `;
      return;
    }

    const filesHtml = (victim.remoteFiles || [])
      .map((f, idx) => {
        const opened = call.inspectedFiles.includes(idx);
        return `
          <div class="remote-file ${opened ? 'is-opened' : ''} ${f.isSecret ? 'is-secret' : ''}">
            <div>
              <div class="file-name">${escapeHtml(f.name)}</div>
              <div class="muted-note">${opened ? escapeHtml(f.label) : 'Clique para inspecionar'}</div>
            </div>
            <button type="button" class="win-btn win-btn-mini" data-remote-action="open-file" data-file-idx="${idx}">
              ${opened ? 'Lido' : 'Abrir'}
            </button>
          </div>
        `;
      })
      .join('');

    this.els.remoteBody.innerHTML = `
      <div class="remote-toolbar">
        <span class="tag tag-ok">CONECTADO: ${escapeHtml(victim.name)}</span>
        <button type="button" class="win-btn win-btn-mini ${call.blackCurtain ? 'win-btn-primary' : ''}" data-remote-action="curtain">
          ${call.blackCurtain ? 'Tela Preta: ON' : 'Ativar Tela Preta'}
        </button>
        <button type="button" class="win-btn win-btn-mini win-btn-danger" data-remote-action="fakescan" ${call.fakeScanRun ? 'disabled' : ''}>
          ${call.fakeScanRun ? 'FakeScan Enviado' : 'Rodar FakeScan'}
        </button>
      </div>
      <div class="remote-screen ${call.blackCurtain ? 'is-curtained' : ''}">
        <div class="remote-screen-caption">
          ${call.blackCurtain ? 'TELA PRETA NA VÍTIMA: Ela não vê você mexendo nos arquivos!' : 'VISÍVEL PARA A VÍTIMA: Abrir arquivos sem Tela Preta gera suspeita!'}
        </div>
        <div class="remote-files-grid">${filesHtml}</div>
      </div>
    `;
  }

  renderTrace() {
    const call = this.game.state.activeCall;
    const victim = this.game.getActiveVictim();

    if (!call || !victim) {
      this.els.traceBody.innerHTML = `
        <div class="trace-layout">
          <canvas id="trace-globe-canvas" width="160" height="120" class="trace-canvas"></canvas>
          <div class="trace-side">
            <p class="muted-note">Inicie uma ligação no <strong>PhoneLink</strong> para rastrear o IP e desbloquear o dossiê completo da vítima.</p>
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
              <button type="button" class="win-btn win-btn-mini" data-action="use-fact" data-fact="${escapeHtml(fact.value)}">Inserir</button>
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
          <button type="button" class="win-btn win-btn-primary" data-action="toggle-trace" ${call.traceProgress >= 100 || call.status !== 'active' ? 'disabled' : ''}>
            ${call.traceProgress >= 100 ? 'Dossiê 100%' : call.isTracing ? 'Pausar Rastreio' : 'Iniciar GeoTrace'}
          </button>
        </div>
      </div>
      <div class="facts-list">${factsHtml}</div>
    `;
  }

  renderFakeShield() {
    const call = this.game.state.activeCall;
    const victim = this.game.getActiveVictim();

    if (!call || !victim) {
      this.els.fakeshieldBody.innerHTML = `
        <div class="empty-card">
          <strong>FakeShield AV — Gerador de Pânico</strong>
          <p class="muted-note">Durante uma chamada ativa, dispare um alerta falso de "Trojan Bancário" na tela da vítima para aumentar a confiança dela no seu suporte técnico (+20%). Cuidado com Scambaiters!</p>
        </div>
      `;
      return;
    }

    this.els.fakeshieldBody.innerHTML = `
      <div class="fakeshield-card">
        <div class="fakeshield-banner">ALERTA SIMULADO: TROJAN_BANCARIO_WIN32 DETECTADO</div>
        <p class="muted-note">Alvo na linha: <strong>${escapeHtml(victim.name)}</strong></p>
        <p class="muted-note">Envia uma notificação assustadora simulando risco de bloqueio/vírus para pressionar o alvo.</p>
        <button type="button" class="win-btn win-btn-danger" data-action="send-fakeshield" ${call.fakeShieldSent || call.status !== 'active' ? 'disabled' : ''}>
          ${call.fakeShieldSent ? 'Alerta Já Disparado' : 'Disparar Alerta FakeShield'}
        </button>
      </div>
    `;
  }

  renderScamazon() {
    const s = this.game.state;
    const redeemEl = document.getElementById('redeem-code-input');
    const draftCode = redeemEl ? redeemEl.value : '';

    const channelInfo = {
      giftcard: 'Resgate de Vale-Presente Scamazon (taxa 1.0x imediata)',
      bank: 'Validação PIX / Conta Corporativa (taxa 1.0x imediata)',
      crypto: `CryptoVault BTC/MemeCoin (cotação ao vivo: ${s.cryptoRate.toFixed(2)}x)`
    };

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
          <button type="button" class="win-btn ${canBuy ? 'win-btn-primary' : ''}" data-action="buy-upgrade" data-upgrade-id="${u.id}" ${maxed || !canBuy ? 'disabled' : ''}>
            ${maxed ? 'MÁX' : `R$ ${price}`}
          </button>
        </div>
      `;
    }).join('');

    this.els.scamazonBody.innerHTML = `
      <div class="subtabs">
        <button type="button" class="subtab-btn ${this.scamazonTab === 'giftcard' ? 'is-active' : ''}" data-scam-tab="giftcard">Gift Cards</button>
        <button type="button" class="subtab-btn ${this.scamazonTab === 'bank' ? 'is-active' : ''}" data-scam-tab="bank">Banco / PIX</button>
        <button type="button" class="subtab-btn ${this.scamazonTab === 'crypto' ? 'is-active' : ''}" data-scam-tab="crypto">Crypto (${s.cryptoRate.toFixed(2)}x)</button>
      </div>
      <form id="redeem-form" class="redeem-box">
        <div class="redeem-title">${escapeHtml(channelInfo[this.scamazonTab])}</div>
        <div class="redeem-row">
          <input id="redeem-code-input" type="text" class="win-input" placeholder="Cole código / senha / PIX extraído..." value="${escapeHtml(draftCode)}" />
          <button type="submit" class="win-btn win-btn-cash">Resgatar</button>
        </div>
      </form>
      <div class="shop-header">Upgrades do Setup & Escritório (Caixa: <strong>R$ ${s.wallet}</strong>)</div>
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
          <button type="button" class="win-btn win-btn-primary" data-repair="dust">Soprar Poeira</button>
        </div>
        <div class="pc-part ${pc.looseCable ? 'is-bad' : ''}">
          <div><strong>Cabo de Força SATA</strong><br/><small>${pc.looseCable ? 'SOLTO! Causando instabilidade' : 'Conectado firme'}</small></div>
          <button type="button" class="win-btn ${pc.looseCable ? 'win-btn-danger' : ''}" data-repair="cable" ${pc.looseCable ? '' : 'disabled'}>Encaixar</button>
        </div>
        <div class="pc-part ${pc.burntCap ? 'is-bad' : ''}">
          <div><strong>Capacitor VRM</strong><br/><small>${pc.burntCap ? 'ESTUFADO! Esquentando CPU' : 'Tensão normal'}</small></div>
          <button type="button" class="win-btn ${pc.burntCap ? 'win-btn-danger' : ''}" data-repair="capacitor" ${pc.burntCap ? '' : 'disabled'}>Trocar Peça</button>
        </div>
        <div class="pc-part ${pc.activeViruses.length > 0 ? 'is-bad' : ''}">
          <div><strong>Avastão 11 Scanner</strong><br/><small>${pc.activeViruses.length} vírus ativo(s)</small></div>
          <button type="button" class="win-btn ${pc.activeViruses.length > 0 ? 'win-btn-danger' : ''}" data-repair="antivirus" ${pc.activeViruses.length > 0 ? '' : 'disabled'}>Limpar Vírus</button>
        </div>
      </div>
    `;
  }

  renderViruses() {
    const viruses = this.game.state.pc.activeViruses;
    this.els.virusLayer.innerHTML = viruses
      .map((v, idx) => {
        const top = 36 + ((idx * 34) % 140);
        const left = 24 + ((idx * 42) % 180);
        return `
          <div class="win11-window virus-popup" style="top:${top}px;left:${left}px;z-index:90;">
            <div class="win11-titlebar is-virus">
              <span>ALERTA: ${escapeHtml(v.source)}</span>
              <button type="button" class="win-ctrl-btn" data-close-virus="${v.id}">×</button>
            </div>
            <div class="win-body virus-body">
              <p><strong>${escapeHtml(v.title)}</strong></p>
              <p>Esquentando sua CPU! Feche agora ou limpe no PC Doctor.</p>
              <button type="button" class="win-btn win-btn-danger" data-close-virus="${v.id}">Fechar Pop-up</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderOverlays() {
    const s = this.game.state;
    this.els.bsodOverlay.classList.toggle('is-hidden', !s.pc.isCrashed);
    this.els.excelOverlay.classList.toggle('is-hidden', !s.panicExcelMode);

    if (s.policeRaid && !s.panicExcelMode) {
      this.els.raidBanner.classList.remove('is-hidden');
      this.els.raidCountdown.textContent = `${s.policeRaid.timeLeft}s`;
    } else {
      this.els.raidBanner.classList.add('is-hidden');
    }

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
          <canvas id="boss-portrait-canvas" width="48" height="48" class="pixel-canvas victim-portrait"></canvas>
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
          <button type="button" class="win-btn win-btn-primary" data-action="next-day">
            ${report.fired ? 'Recomeçar Carreira (Dia 1)' : `Iniciar Dia ${s.day + 1}`}
          </button>
        </div>
      `;
      drawBossPortrait(document.getElementById('boss-portrait-canvas'), !report.hitQuota || report.fired);
    }
  }
}
