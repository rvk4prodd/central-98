import { VICTIMS } from '../data/victims.js';
import {
  advanceToNextDay,
  applyCallTurnResult,
  buyUpgradeItem,
  clamp,
  createInitialState,
  evaluateShift,
  loadAiConfig,
  loadSavedState,
  persistAiConfig,
  persistState,
  redeemSecretCode,
  removeVirus,
  repairPart,
  spawnVirus,
  startCallState,
  tickHardware
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

    soundEngine.syncSettings(this.aiConfig);
    soundEngine.setSpeakingCallback((speaking) => {
      this.isSpeaking = speaking;
      this.syncOperatorMood();
      this.emit();
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

    const hw = tickHardware(this.state, 1);
    if (hw.faultOccurred === 'looseCable') {
      this.notify('Alerta de Hardware: Cabo de força soltou dentro do gabinete!', true);
    } else if (hw.faultOccurred === 'burntCap') {
      this.notify('Cheiro de queimado: Um capacitor estufou no PC Doctor!', true);
    }
    if (hw.crashedNow) {
      soundEngine.playError();
      soundEngine.stopLineHum();
      soundEngine.toggleHoldMusic(false);
      if (this.state.activeCall && this.state.activeCall.status === 'active') {
        this.state.activeCall.status = 'lost';
      }
      this.emit('bsod');
    }

    if (!this.state.pc.isCrashed) {
      // Shift clock ticks down while working
      this.state.shiftTimeLeft = Math.max(0, this.state.shiftTimeLeft - 1);

      const call = this.state.activeCall;
      if (call && call.status === 'active') {
        if (!call.onHold) {
          call.patience = Math.max(0, call.patience - 1);
          if (call.patience === 0) {
            const victim = this.getActiveVictim();
            call.status = 'lost';
            call.messages.push({
              role: 'victim',
              text: 'Olha, cansei de esperar e perdi a paciência. Tchau!',
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
              soundEngine.playRepair();
            }
          }
          if (call.traceProgress >= 100) {
            call.isTracing = false;
            this.notify('GeoTrace concluído! Todos os fatos do dossiê estão disponíveis.');
          }
        }
      }

      if (this.state.shiftTimeLeft === 0) {
        this.finishShift();
      }
    }

    this.syncOperatorMood();
    persistState(this.state);
    this.emit('tick');
  }

  getActiveVictim() {
    if (!this.state.activeCall) return null;
    return VICTIMS.find((v) => v.id === this.state.activeCall.victimId) || null;
  }

  syncOperatorMood() {
    if (this.state.pc.isCrashed || this.state.pc.activeViruses.length > 0) {
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
      this.notify('PC travado em Tela Azul! Reinicie no PC Doctor.', true);
      return;
    }
    const call = startCallState(this.state, victimId);
    if (!call) return;

    const victim = this.getActiveVictim();
    soundEngine.playDial();
    soundEngine.startLineHum();
    soundEngine.toggleHoldMusic(false);
    this.syncOperatorMood();
    persistState(this.state);
    this.emit('call-start');

    setTimeout(() => {
      if (this.state.activeCall?.victimId === victimId) {
        soundEngine.speakVictim(victim.openingLine, victim.voiceProfile);
      }
    }, 520);
  }

  hangUpCall() {
    if (!this.state.activeCall) return;
    soundEngine.stopSpeech();
    soundEngine.stopLineHum();
    soundEngine.toggleHoldMusic(false);
    if (this.state.activeCall.status === 'active') {
      this.state.activeCall.status = 'lost';
    }
    this.state.activeCall.isTracing = false;
    this.syncOperatorMood();
    persistState(this.state);
    this.emit();
  }

  toggleHold() {
    const call = this.state.activeCall;
    if (!call || call.status !== 'active') return;
    call.onHold = !call.onHold;
    soundEngine.toggleHoldMusic(call.onHold);
    this.notify(call.onHold ? 'Chamada em espera (música lo-fi ligada).' : 'Chamada retomada.');
    this.emit();
  }

  toggleTrace() {
    const call = this.state.activeCall;
    if (!call || call.status !== 'active') {
      this.notify('Inicie uma ligação primeiro para rastrear no GeoTrace.', true);
      return;
    }
    if (call.traceProgress >= 100) {
      this.notify('Rastreamento já está 100% completo.');
      return;
    }
    call.isTracing = !call.isTracing;
    soundEngine.playClick();
    this.emit();
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
    this.syncOperatorMood();
    this.emit('sending');

    const aiResult = await requestVictimReply(this.aiConfig, victim, call, text);
    this.isSending = false;

    const { triggeredVirus } = applyCallTurnResult(this.state, victim, aiResult, text);

    if (triggeredVirus) {
      spawnVirus(this.state, victim.name);
      soundEngine.playError();
      this.notify(`ATAQUE DE SCAMBAITER! ${victim.name} disparou um pop-up de vírus!`, true);
    } else if (call.status === 'won') {
      soundEngine.playCash();
      this.notify(`Código obtido! Copie e resgate na Scamazon: ${call.extractedSecret}`);
    } else if (call.status === 'lost') {
      soundEngine.stopLineHum();
      soundEngine.playError();
      this.notify(`${victim.name} desligou na sua cara!`, true);
    }

    if (aiResult.warning) {
      this.notify(`IA em fallback local (${aiResult.warning})`);
    }

    this.syncOperatorMood();
    persistState(this.state);
    this.emit('call-reply');

    const lastMsg = call.messages[call.messages.length - 1];
    if (lastMsg && lastMsg.role === 'victim') {
      soundEngine.speakVictim(lastMsg.text, victim.voiceProfile);
    }
  }

  replayLastVictimAudio() {
    const call = this.state.activeCall;
    const victim = this.getActiveVictim();
    if (!call || !victim) return;
    const lastVictimMsg = [...call.messages].reverse().find((m) => m.role === 'victim');
    if (lastVictimMsg) {
      soundEngine.speakVictim(lastVictimMsg.text, victim.voiceProfile);
    }
  }

  redeemCode(code) {
    const result = redeemSecretCode(this.state, code);
    if (!result.ok) {
      this.notify(result.reason, true);
      return result;
    }
    soundEngine.playCash();
    this.notify(`+R$ ${result.payout} na conta! Meta do turno atualizada.`);
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
    if (report.hitQuota) {
      soundEngine.playCash();
    } else {
      soundEngine.playError();
    }
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
    this.aiConfig = { ...this.aiConfig, ...partial };
    persistAiConfig(this.aiConfig);
    soundEngine.syncSettings(this.aiConfig);
    this.emit('config');
  }

  clearApiKey() {
    this.updateAiConfig({ apiKey: '', provider: 'offline', ttsMode: 'browser' });
    this.notify('Chave removida do navegador. Motor local ativo.');
  }

  async testAiConnection() {
    return testProviderConnection(this.aiConfig);
  }
}
