import { VICTIMS } from './data/victims.js';
import { UPGRADES, getUpgradePrice } from './data/upgrades.js';

export const SAVE_STORAGE_KEY = 'central98_save_v1';
export const AI_CONFIG_STORAGE_KEY = 'central98_ai_v1';

export const DEFAULT_AI_CONFIG = {
  provider: 'offline',
  apiKey: '',
  model: 'google/gemini-2.0-flash-001',
  customEndpoint: 'http://localhost:11434/v1/chat/completions',
  ttsMode: 'browser', // 'browser' | 'openai'
  voiceEnabled: true,
  sfxEnabled: true,
  voiceSpeed: 1.0,
  volume: 0.85
};

export function createInitialState() {
  return {
    day: 1,
    shiftDurationSec: 210,
    shiftTimeLeft: 210,
    quota: 750,
    shiftEarned: 0,
    wallet: 200,
    totalEarned: 0,
    strikes: 0,
    maxStrikes: 3,
    reputation: 50,
    upgrades: {
      cooler: 0,
      headset: 0,
      modem: 0,
      antivirus: 0,
      database: 0,
      coffee: 0
    },
    completedIds: [],
    redeemedCodes: [],
    shiftLog: [],
    pc: {
      cpuTemp: 42,
      pcHealth: 100,
      dustLevel: 12,
      looseCable: false,
      burntCap: false,
      activeViruses: [],
      isCrashed: false
    },
    activeCall: null,
    lastShiftReport: null,
    gameOver: false
  };
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function getAvailableVictims(state) {
  const dbLevel = state.upgrades.database || 0;
  return VICTIMS.filter(
    (v) => v.minDay <= state.day && v.requiresDatabase <= dbLevel
  );
}

export function startCallState(state, victimId) {
  const victim = VICTIMS.find((v) => v.id === victimId);
  if (!victim) return null;

  const headsetBonus = (state.upgrades.headset || 0) * 10;
  const coffeeBonus = 1 + (state.upgrades.coffee || 0) * 0.18;
  const maxPatience = Math.round(victim.patienceSec * coffeeBonus);
  const revealedFacts = (state.upgrades.database || 0) >= 1 ? [0] : [];

  state.activeCall = {
    victimId: victim.id,
    trust: clamp(victim.startingTrust + headsetBonus, 0, 100),
    suspicion: 8,
    patience: maxPatience,
    maxPatience,
    traceProgress: revealedFacts.length ? 34 : 0,
    isTracing: false,
    revealedFacts,
    usedFactIndices: [],
    messages: [
      {
        role: 'victim',
        text: victim.openingLine,
        mood: 'calm',
        timestamp: Date.now()
      }
    ],
    extractedSecret: null,
    redeemed: false,
    onHold: false,
    turns: 0,
    status: 'active' // 'active' | 'won' | 'lost'
  };

  return state.activeCall;
}

export function applyCallTurnResult(state, victim, aiResult, playerText) {
  const call = state.activeCall;
  if (!call || call.status !== 'active') return { triggeredVirus: false };

  call.turns += 1;
  call.messages.push({ role: 'player', text: playerText, timestamp: Date.now() });
  state.shiftLog.push({
    victimName: victim.name,
    playerText,
    replyText: aiResult.reply
  });
  if (state.shiftLog.length > 30) state.shiftLog.shift();

  const trustDelta = Number.isFinite(aiResult.trustDelta) ? aiResult.trustDelta : 0;
  const suspicionDelta = Number.isFinite(aiResult.suspicionDelta) ? aiResult.suspicionDelta : 0;

  call.trust = clamp(call.trust + trustDelta, 0, 100);
  call.suspicion = clamp(call.suspicion + suspicionDelta, 0, 100);

  if (trustDelta > 0) {
    call.patience = clamp(call.patience + Math.min(10, Math.round(trustDelta * 0.6)), 0, call.maxPatience);
  } else if (suspicionDelta > 5) {
    call.patience = clamp(call.patience - 8, 0, call.maxPatience);
  }

  let replyText = aiResult.reply || '...';
  const shouldReveal =
    Boolean(aiResult.revealSecret) ||
    (call.trust >= 82 && call.suspicion < 75);

  if (shouldReveal && !call.extractedSecret) {
    call.extractedSecret = victim.secretPayload;
    call.status = 'won';
    if (!replyText.includes(victim.secretPayload)) {
      replyText = `${replyText} Anota aí o código: ${victim.secretPayload}`;
    }
  }

  call.messages.push({
    role: 'victim',
    text: replyText,
    mood: aiResult.mood || 'calm',
    timestamp: Date.now()
  });

  if (aiResult.hangUp || call.suspicion >= 100 || call.patience <= 0) {
    if (call.status !== 'won') {
      call.status = 'lost';
    }
  }

  let triggeredVirus = false;
  if (aiResult.triggerVirus) {
    const blockChance = (state.upgrades.antivirus || 0) * 0.35;
    if (Math.random() >= blockChance) {
      triggeredVirus = true;
    }
  }

  return { triggeredVirus };
}

export function redeemSecretCode(state, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { ok: false, reason: 'Digite ou cole um código extraído primeiro.' };
  }
  if (state.redeemedCodes.includes(code)) {
    return { ok: false, reason: 'Esse código já foi resgatado na Scamazon.' };
  }

  const victim = VICTIMS.find((v) => v.secretPayload.toUpperCase() === code);
  if (!victim) {
    return { ok: false, reason: 'Código inválido ou ainda não liberado pelo alvo.' };
  }

  state.redeemedCodes.push(code);
  if (!state.completedIds.includes(victim.id)) {
    state.completedIds.push(victim.id);
  }
  state.shiftEarned += victim.payout;
  state.wallet += victim.payout;
  state.totalEarned += victim.payout;
  state.reputation = clamp(state.reputation + 8, 0, 100);

  if (state.activeCall && state.activeCall.victimId === victim.id) {
    state.activeCall.redeemed = true;
  }

  return { ok: true, victim, payout: victim.payout };
}

export function buyUpgradeItem(state, upgradeId) {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'Upgrade não encontrado.' };

  const currentLevel = state.upgrades[upgrade.id] || 0;
  if (currentLevel >= upgrade.maxLevel) {
    return { ok: false, reason: 'Nível máximo já instalado.' };
  }

  const price = getUpgradePrice(upgrade, currentLevel);
  if (state.wallet < price) {
    return { ok: false, reason: `Saldo insuficiente (faltam R$ ${price - state.wallet}).` };
  }

  state.wallet -= price;
  state.upgrades[upgrade.id] = currentLevel + 1;
  return { ok: true, upgrade, newLevel: currentLevel + 1, price };
}

export function spawnVirus(state, sourceName = 'Trojan.Baiter98') {
  const id = `v_${Date.now()}_${Math.floor(Math.random() * 999)}`;
  const titles = [
    'VOCÊ GANHOU 999 BITCOINS!',
    'ERRO CRÍTICO NO REGISTRO!',
    'SR. CARIL ESTÁ VENDO SUA TELA',
    'BAIXE MAIS MEMÓRIA RAM GRÁTIS'
  ];
  state.pc.activeViruses.push({
    id,
    title: titles[Math.floor(Math.random() * titles.length)],
    source: sourceName
  });
  return id;
}

export function removeVirus(state, virusId) {
  const idx = state.pc.activeViruses.findIndex((v) => v.id === virusId);
  if (idx === -1) return false;
  state.pc.activeViruses.splice(idx, 1);
  return true;
}

export function tickHardware(state, elapsedSec = 1, rng = Math.random) {
  const pc = state.pc;
  if (pc.isCrashed) return { crashedNow: false, faultOccurred: null };

  const coolerFactor = Math.max(0.25, 1 - (state.upgrades.cooler || 0) * 0.25);
  const callLoad = state.activeCall && state.activeCall.status === 'active' ? 0.55 : 0.08;
  const traceLoad = state.activeCall && state.activeCall.isTracing ? 0.55 : 0;
  const virusHeat = pc.activeViruses.length * 1.15;
  const dustHeat = (pc.dustLevel / 100) * 0.65;
  const faultHeat = (pc.looseCable ? 0.45 : 0) + (pc.burntCap ? 0.8 : 0);

  const coolingPull = pc.dustLevel < 40 ? 0.35 / coolerFactor : 0.1;
  const netTempDelta = (callLoad + traceLoad + virusHeat + dustHeat + faultHeat) * coolerFactor - coolingPull;

  pc.cpuTemp = clamp(pc.cpuTemp + netTempDelta * elapsedSec, 36, 102);
  pc.dustLevel = clamp(pc.dustLevel + 0.16 * coolerFactor * elapsedSec, 0, 100);

  if (pc.cpuTemp > 80 || pc.activeViruses.length > 0 || pc.burntCap) {
    const damage =
      (pc.cpuTemp > 80 ? (pc.cpuTemp - 78) * 0.09 : 0) +
      pc.activeViruses.length * 0.45 +
      (pc.burntCap ? 0.4 : 0);
    pc.pcHealth = clamp(pc.pcHealth - damage * elapsedSec, 0, 100);
  } else if (pc.cpuTemp < 60 && !pc.looseCable && !pc.burntCap) {
    pc.pcHealth = clamp(pc.pcHealth + 0.12 * elapsedSec, 0, 100);
  }

  let faultOccurred = null;
  if (pc.cpuTemp > 72 && !pc.looseCable && rng() < 0.012 * elapsedSec) {
    pc.looseCable = true;
    faultOccurred = 'looseCable';
  } else if (pc.cpuTemp > 84 && !pc.burntCap && rng() < 0.014 * elapsedSec) {
    pc.burntCap = true;
    faultOccurred = 'burntCap';
  }

  let crashedNow = false;
  if (pc.cpuTemp >= 100 || pc.pcHealth <= 0) {
    pc.isCrashed = true;
    crashedNow = true;
  }

  return { crashedNow, faultOccurred };
}

export function repairPart(state, action) {
  const pc = state.pc;
  switch (action) {
    case 'dust':
      pc.dustLevel = clamp(pc.dustLevel - 38, 0, 100);
      pc.cpuTemp = clamp(pc.cpuTemp - 9, 36, 100);
      pc.pcHealth = clamp(pc.pcHealth + 6, 0, 100);
      return { ok: true, message: 'Poeira removida do cooler!' };
    case 'cable':
      if (!pc.looseCable) return { ok: false, message: 'O cabo SATA já está firme.' };
      pc.looseCable = false;
      pc.pcHealth = clamp(pc.pcHealth + 12, 0, 100);
      return { ok: true, message: 'Cabo de força reconectado!' };
    case 'capacitor':
      if (!pc.burntCap) return { ok: false, message: 'Capacitores estão íntegros.' };
      pc.burntCap = false;
      pc.cpuTemp = clamp(pc.cpuTemp - 12, 36, 100);
      pc.pcHealth = clamp(pc.pcHealth + 18, 0, 100);
      return { ok: true, message: 'Capacitor substituído com solda fria!' };
    case 'antivirus':
      if (pc.activeViruses.length === 0) {
        return { ok: false, message: 'Nenhum vírus ativo encontrado.' };
      }
      const cleared = pc.activeViruses.length;
      pc.activeViruses = [];
      pc.cpuTemp = clamp(pc.cpuTemp - 10, 36, 100);
      return { ok: true, message: `${cleared} ameaça(s) colocada(s) em quarentena.` };
    case 'reboot':
      pc.isCrashed = false;
      pc.cpuTemp = 54;
      pc.pcHealth = Math.max(45, pc.pcHealth);
      pc.activeViruses = [];
      return { ok: true, message: 'CentralOS 98 reiniciado após Tela Azul!' };
    default:
      return { ok: false, message: 'Ação desconhecida.' };
  }
}

export function evaluateShift(state) {
  const hitQuota = state.shiftEarned >= state.quota;
  const ratio = state.quota > 0 ? state.shiftEarned / state.quota : 1;

  let grade = 'F';
  if (ratio >= 1.5) grade = 'S';
  else if (ratio >= 1.15) grade = 'A';
  else if (ratio >= 1.0) grade = 'B';
  else if (ratio >= 0.6) grade = 'C';

  if (!hitQuota) {
    state.strikes += 1;
    state.reputation = clamp(state.reputation - 15, 0, 100);
  } else {
    state.reputation = clamp(state.reputation + 10, 0, 100);
  }

  const fired = state.strikes >= state.maxStrikes;
  state.gameOver = fired;

  const sampleQuotes = state.shiftLog.slice(-3);
  const mrCurryLine = fired
    ? 'VOCÊ TÁ DEMITIDO! Arruma essa porcaria de caixa de papelão e some do meu call center!'
    : hitQuota
      ? ratio >= 1.4
        ? 'Até que enfim alguém que presta nessa pocilga! Bateu a meta com folga, amanhã quero o dobro.'
        : 'Bateu a cota raspando, né? Não fez mais que a obrigação. Amanhã a meta sobe!'
      : `Cadê o resto do dinheiro?! Faltaram R$ ${state.quota - state.shiftEarned}! Mais um vacilo desses e é rua!`;

  const report = {
    day: state.day,
    earned: state.shiftEarned,
    quota: state.quota,
    hitQuota,
    grade,
    strikes: state.strikes,
    maxStrikes: state.maxStrikes,
    fired,
    mrCurryLine,
    sampleQuotes
  };

  state.lastShiftReport = report;
  return report;
}

export function advanceToNextDay(state) {
  if (state.gameOver) return;
  state.day += 1;
  state.shiftEarned = 0;
  state.shiftDurationSec = 210 + Math.min(60, (state.day - 1) * 15);
  state.shiftTimeLeft = state.shiftDurationSec;
  state.quota = Math.round(750 + (state.day - 1) * 420);
  state.shiftLog = [];
  state.activeCall = null;
  state.pc.cpuTemp = clamp(state.pc.cpuTemp - 14, 38, 90);
}

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      pc: { ...base.pc, ...(parsed.pc || {}) },
      activeCall: null
    };
  } catch {
    return createInitialState();
  }
}

export function persistState(state) {
  try {
    const toSave = { ...state, activeCall: null };
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function loadAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function persistAiConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}
