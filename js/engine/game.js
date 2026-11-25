import {
  addCustomVictim,
  advanceToNextDay,
  applyCallTurnResult,
  buyUpgradeItem,
  clamp,
  connectRemoteDesktop,
  createInitialState,
  evaluateShift,
  findVictimById,
  inspectRemoteFile,
  loadAiConfig,
  loadSavedState,
  persistAiConfig,
  persistState,
  redeemSecretCode,
  removeVirus,
  repairPart,
  resolvePoliceRaid,
  runRemoteFakeScan,
  sendFakeShieldAlert,
  spawnVirus,
  startCallState,
  tickHardware,
  triggerPoliceRaid
} from '../state.js';
import { requestVictimReply, testProviderConnection } from './ai-client.js';
import { soundEngine } from './audio.js';

export class CentralGame {
  constructor() {
    this.state = loadSavedState();
    this.aiConfig = loadAiConfig();
    this.listeners = new Set();
    this.isSending = false;
    this.isSpeaking = false;
    this.operatorMode = 'idle';
    this.lastToast = '';
    this.timerId = null;
    this.callSessionSeq = 0;

    soundEngine.syncSettings(this.aiConfig);
    soundEngine.setSpeakingCallback((speaking) => {
      this.isSpeaking = speaking;
      this.syncOperatorMood();
      this.emit('speaking');
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(eventType = 'update') {
    for (const fn of this.listeners) {
      fn(this.state, eventType, this);
    }
  }

  notify(msg, isError = false) {
    this.lastToast = msg;
    if (isError) soundEngine.playError();
    else soundEngine.playNotify();
    this.emit('toast');
  }

  startLoop() {
    if (this.timerId) return;
    this.timerId = setInterval(() => this.onSecondTick(), 1000);
  }

  stopLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  onSecondTick() {
    if (this.state.gameOver || this.state.lastShiftReport) return;

    let structuralChange = false;

    if (this.state.shiftTimeLeft % 6 === 0) {
      const delta = (Math.random() - 0.48) * 0.06;
      this.state.cryptoRate = Number(clamp(this.state.cryptoRate + delta, 0.9, 1.32).toFixed(2));
    }

    const hw = tickHardware(this.state, 1);
    if (hw.faultOccurred === 'looseCable') {
      structuralChange = true;
      this.notify('Alerta de Hardware: Cabo SATA soltou no gabinete!', true);
    } else if (hw.faultOccurred === 'burntCap') {
      structuralChange = true;
      this.notify('Capacitor estufou no PC Doctor!', true);
    }
    if (hw.crashedNow) {
      soundEngine.playError();
      soundEngine.stopLineHum();
      soundEngine.toggleHoldMusic(false);
      if (this.state.activeCall && this.state.activeCall.status === 'active') {
        this.state.activeCall.status = 'lost';
      }
      this.emit('bsod');
      return;
    }

    if (!this.state.pc.isCrashed) {
      this.state.shiftTimeLeft = Math.max(0, this.state.shiftTimeLeft - 1);

      if (this.state.policeRaid) {
        this.state.policeRaid.timeLeft -= 1;
        if (this.state.policeRaid.timeLeft <= 0) {
          structuralChange = true;
          const res = resolvePoliceRaid(this.state, this.state.panicExcelMode);
          this.notify(res.message, !res.dodged);
          if (this.state.strikes >= this.state.maxStrikes) {
            this.finishShift();
            return;
          }
        }
      } else if (this.state.policeHeat >= 82 && !this.state.panicExcelMode) {
        if (triggerPoliceRaid(this.state)) {
          structuralChange = true;
          soundEngine.playPoliceSiren();
          this.notify('BATIDA POLICIAL! Ative o Modo Excel (Pânico) agora!', true);
        }
      }

      const call = this.state.activeCall;
      if (call && call.status === 'active') {
        if (!call.onHold) {
          call.patience = Math.max(0, call.patience - 1);
          if (call.patience === 0) {
            structuralChange = true;
            const victim = this.getActiveVictim();
            call.status = 'lost';
            call.messages.push({
              role: 'victim',
              text: 'Cansei de esperar, perdi a paciência. Tchau!',
              mood: 'angry',
              timestamp: Date.now()
            });
            soundEngine.stopLineHum();
            soundEngine.playError();
            this.notify(`${victim?.name || 'Alvo'} perdeu a paciência e desligou.`, true);
          }
        }

        if (call.isTracing && call.traceProgress < 100) {
          const speed = 13 + (this.state.upgrades.modem || 0) * 8;
          call.traceProgress = clamp(call.traceProgress + speed, 0, 100);

          const factsCount = Math.min(3, Math.floor(call.traceProgress / 33));
          for (let i = 0; i < factsCount; i += 1) {
            if (!call.revealedFacts.includes(i)) {
              call.revealedFacts.push(i);
              structuralChange = true;
              soundEngine.playRepair();
            }
          }
          if (call.traceProgress >= 100) {
            call.isTracing = false;
            structuralChange = true;
            this.notify('GeoTrace concluído! Todos os fatos do dossiê estão disponíveis.');
          }
        }
      }

      if (this.state.shiftTimeLeft === 0) {
        this.finishShift();
        return;
      }
    }

    this.syncOperatorMood();
    persistState(this.state);
    this.emit(structuralChange ? 'update' : 'tick');
  }

  getActiveVictim() {
    if (!this.state.activeCall) return null;
    return findVictimById(this.state, this.state.activeCall.victimId);
  }

  syncOperatorMood() {
    if (this.state.pc.isCrashed || this.state.pc.activeViruses.length > 0 || this.state.policeRaid) {
      this.operatorMode = 'panicking';
    } else if (this.isSpeaking) {
      this.operatorMode = 'talking';
    } else if (this.isSending) {
      this.operatorMode = 'typing';
    } else if (
      (this.state.activeCall && this.state.activeCall.suspicion >= 65) ||
      this.state.pc.cpuTemp >= 78
    ) {
      this.operatorMode = 'sweating';
    } else if (this.state.activeCall && this.state.activeCall.status === 'won') {
      this.operatorMode = 'celebrating';
    } else {
      this.operatorMode = 'idle';
    }
  }

  dialVictim(victimId) {
    if (this.state.pc.isCrashed) {
      this.notify('PC em Tela Azul! Reinicie no PC Doctor.', true);
      return;
    }

    soundEngine.stopSpeech();
    soundEngine.stopLineHum();
    soundEngine.toggleHoldMusic(false);
    this.isSending = false;
    this.callSessionSeq += 1;
    const seq = this.callSessionSeq;

    const call = startCallState(this.state, victimId);
    if (!call) return;

    const victim = this.getActiveVictim();
    soundEngine.playDial();
    soundEngine.startLineHum();
    this.syncOperatorMood();
    persistState(this.state);
    this.emit('call-start');

    setTimeout(() => {
      if (this.callSessionSeq === seq && this.state.activeCall?.victimId === victimId) {
        this.speakWithNotification(victim.openingLine, victim.voiceProfile);
      }
    }, 450);
  }

  hangUpCall() {
    this.callSessionSeq += 1;
    this.isSending = false;
    soundEngine.stopSpeech();
    soundEngine.stopLineHum();
    soundEngine.toggleHoldMusic(false);
    if (!this.state.activeCall) return;
    this.state.activeCall = null;
    this.syncOperatorMood();
    persistState(this.state);
    this.emit('call-end');
  }

  async speakWithNotification(text, voiceProfile) {
    const res = await soundEngine.speakVictim(text, voiceProfile);
    if (res && res.error) {
      this.notify(`Voz neural falhou (${res.error}) — usando voz do navegador.`, true);
    }
  }

  toggleHold() {
    const call = this.state.activeCall;
    if (!call || call.status !== 'active') return;
    call.onHold = !call.onHold;
    soundEngine.toggleHoldMusic(call.onHold);
    this.notify(call.onHold ? 'Chamada em espera.' : 'Chamada retomada.');
    this.emit();
  }

  toggleTrace() {
    const call = this.state.activeCall;
    if (!call || call.status !== 'active') {
      this.notify('Inicie uma ligação primeiro para rastrear no GeoTrace.', true);
      return;
    }
    if (call.traceProgress >= 100) return;
    call.isTracing = !call.isTracing;
    soundEngine.playClick();
    this.emit();
  }

  connectAnyControl() {
    const res = connectRemoteDesktop(this.state);
    if (!res.ok) {
      this.notify(res.reason, true);
    } else {
      soundEngine.playRemoteConnect();
      this.notify(res.message);
    }
    this.emit();
    return res;
  }

  toggleBlackCurtain() {
    const call = this.state.activeCall;
    if (!call || !call.remoteConnected) return;
    call.blackCurtain = !call.blackCurtain;
    soundEngine.playClick();
    this.notify(call.blackCurtain ? 'Tela Preta ativada na vítima (modo invisível).' : 'Tela da vítima visível novamente.');
    this.emit();
  }

  openRemoteFile(fileIdx) {
    const victim = this.getActiveVictim();
    const res = inspectRemoteFile(this.state, victim, fileIdx);
    if (!res.ok) {
      this.notify(res.reason, true);
    } else if (res.secretFound) {
      soundEngine.playCash();
      this.notify(`Arquivo secreto extraído via AnyControl: ${res.secretFound}!`);
    } else {
      soundEngine.playRemoteConnect();
      this.notify(`Lido: ${res.file.label}`);
    }
    persistState(this.state);
    this.emit();
    return res;
  }

  runRemoteFakeScan() {
    const victim = this.getActiveVictim();
    const res = runRemoteFakeScan(this.state, victim);
    if (!res.ok) {
      this.notify(res.reason, true);
    } else {
      soundEngine.playFakeScan();
      this.notify(res.message, res.backfired);
    }
    this.emit();
    return res;
  }

  deployFakeShield() {
    const victim = this.getActiveVictim();
    const res = sendFakeShieldAlert(this.state, victim);
    if (!res.ok) {
      this.notify(res.reason, true);
    } else {
      soundEngine.playFakeScan();
      this.notify(res.message, res.backfired);
    }
    this.emit();
    return res;
  }

  togglePanicExcel() {
    this.state.panicExcelMode = !this.state.panicExcelMode;
    soundEngine.playClick();
    if (this.state.panicExcelMode && this.state.policeRaid) {
      const res = resolvePoliceRaid(this.state, true);
      this.notify(res.message);
    }
    this.emit();
  }

  createCustomVictim(payload) {
    const res = addCustomVictim(this.state, payload);
    if (!res.ok) {
      this.notify(res.reason, true);
    } else {
      soundEngine.playCash();
      this.notify(`Alvo "${res.victim.name}" adicionado ao discador!`);
      persistState(this.state);
    }
    this.emit();
    return res;
  }

  updateOperatorLook(partial) {
    this.state.operatorLook = { ...this.state.operatorLook, ...partial };
    persistState(this.state);
    this.emit('config');
  }

  async sendPlayerMessage(rawText) {
    const text = String(rawText || '').trim();
    const call = this.state.activeCall;
    const victim = this.getActiveVictim();

    if (!text || !call || !victim || call.status !== 'active' || this.isSending) return;
    if (call.onHold) {
      call.onHold = false;
      soundEngine.toggleHoldMusic(false);
    }

    this.isSending = true;
    const seq = this.callSessionSeq;
    this.syncOperatorMood();
    this.emit('sending');

    const aiResult = await requestVictimReply(this.aiConfig, victim, call, text);
    if (this.callSessionSeq !== seq || this.state.activeCall !== call) {
      return;
    }
    this.isSending = false;
    call.lastSource = aiResult.source || this.aiConfig.provider;

    const { triggeredVirus } = applyCallTurnResult(this.state, victim, aiResult, text);

    if (triggeredVirus) {
      spawnVirus(this.state, victim.name);
      soundEngine.playError();
      this.notify(`ATAQUE DE SCAMBAITER! ${victim.name} disparou um pop-up de vírus!`, true);
    } else if (call.status === 'won') {
      soundEngine.playCash();
      this.notify(`Código obtido! Resgate na Scamazon: ${call.extractedSecret}`);
    } else if (call.status === 'lost') {
      soundEngine.stopLineHum();
      soundEngine.playError();
      this.notify(`${victim.name} desligou na sua cara!`, true);
    }

    if (aiResult.warning) {
      this.notify(`Fallback local (${aiResult.warning})`, true);
    }

    this.syncOperatorMood();
    persistState(this.state);
    this.emit('call-reply');

    const lastMsg = call.messages[call.messages.length - 1];
    if (lastMsg && lastMsg.role === 'victim') {
      this.speakWithNotification(lastMsg.text, victim.voiceProfile);
    }
  }

  replayLastVictimAudio() {
    const call = this.state.activeCall;
    const victim = this.getActiveVictim();
    if (!call || !victim) return;
    const lastVictimMsg = [...call.messages].reverse().find((m) => m.role === 'victim');
    if (lastVictimMsg) {
      this.speakWithNotification(lastVictimMsg.text, victim.voiceProfile);
    }
  }

  redeemCode(code, channel = 'giftcard') {
    const result = redeemSecretCode(this.state, code, channel);
    if (!result.ok) {
      this.notify(result.reason, true);
      return result;
    }
    soundEngine.playCash();
    this.notify(`+R$ ${result.payout} resgatados (${channel.toUpperCase()})!`);
    persistState(this.state);
    this.emit('cash');
    return result;
  }

  buyUpgrade(upgradeId) {
    const result = buyUpgradeItem(this.state, upgradeId);
    if (!result.ok) {
      this.notify(result.reason, true);
      return result;
    }
    soundEngine.playCash();
    this.notify(`${result.upgrade.name} (Nv.${result.newLevel}) instalado!`);
    persistState(this.state);
    this.emit();
    return result;
  }

  repairPc(action) {
    const result = repairPart(this.state, action);
    if (result.ok) {
      soundEngine.playRepair();
      this.notify(result.message);
    } else {
      this.notify(result.message, true);
    }
    this.syncOperatorMood();
    persistState(this.state);
    this.emit();
    return result;
  }

  closeVirusPopup(virusId) {
    if (removeVirus(this.state, virusId)) {
      soundEngine.playRepair();
      this.syncOperatorMood();
      persistState(this.state);
      this.emit();
    }
  }

  finishShift() {
    soundEngine.stopSpeech();
    soundEngine.stopLineHum();
    soundEngine.toggleHoldMusic(false);
    const report = evaluateShift(this.state);
    if (report.hitQuota) soundEngine.playCash();
    else soundEngine.playError();
    persistState(this.state);
    this.emit('shift-end');
  }

  nextDay() {
    if (this.state.gameOver) {
      this.resetCampaign();
      return;
    }
    this.state.lastShiftReport = null;
    advanceToNextDay(this.state);
    persistState(this.state);
    this.emit('new-day');
  }

  resetCampaign() {
    soundEngine.stopSpeech();
    soundEngine.stopLineHum();
    soundEngine.toggleHoldMusic(false);
    this.state = createInitialState();
    persistState(this.state);
    this.emit('reset');
  }

  updateAiConfig(partial) {
    const next = {
      ...this.aiConfig,
      ...partial,
      keysByProvider: {
        ...this.aiConfig.keysByProvider,
        ...(partial.keysByProvider || {})
      }
    };

    // Auto-upgrade from robotic browser voice when a Gemini or OpenAI key is saved
    if (!partial.ttsProvider && next.ttsProvider === 'browser') {
      if (next.provider === 'gemini' && next.keysByProvider.gemini?.trim()) {
        next.ttsProvider = 'gemini_tts';
      } else if (next.provider === 'openai' && next.keysByProvider.openai?.trim()) {
        next.ttsProvider = 'openai';
      }
    }

    this.aiConfig = next;
    persistAiConfig(this.aiConfig);
    soundEngine.syncSettings(this.aiConfig);
    this.emit('config');
  }

  clearCurrentProviderKey() {
    const p = this.aiConfig.provider;
    this.updateAiConfig({
      keysByProvider: { [p]: '' }
    });
    this.notify(`Chave de ${p} removida do armazenamento local.`);
  }

  async testAiConnection() {
    return testProviderConnection(this.aiConfig);
  }
}
