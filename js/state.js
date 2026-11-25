import { VICTIMS } from './data/victims.js';
import { UPGRADES, getUpgradePrice } from './data/upgrades.js';

export const SAVE_STORAGE_KEY = 'central11_save_v2';
export const AI_CONFIG_STORAGE_KEY = 'central11_ai_v2';

export const DEFAULT_AI_CONFIG = {
  provider: 'offline',
  model: 'local-contextual-v1',
  keysByProvider: {
    openrouter: '',
    gemini: '',
    groq: '',
    openai: '',
    anthropic: '',
    deepseek: '',
    xai: '',
    mistral: '',
    together: '',
    custom: ''
  },
  customEndpoint: 'http://localhost:11434/v1/chat/completions',
  ttsProvider: 'browser', // 'browser' | 'gemini_tts' | 'elevenlabs' | 'openai' | 'custom_tts'
  browserVoiceName: '',
  geminiTtsKey: '',
  elevenLabsKey: '',
  elevenLabsModel: 'eleven_flash_v2_5',
  openaiTtsKey: '',
  openaiTtsModel: 'gpt-4o-mini-tts',
  customTtsEndpoint: 'http://localhost:8880/v1/audio/speech',
  customTtsVoice: 'pf_dora',
  phoneFilter: false,
  voiceEnabled: true,
  sfxEnabled: true,
  voiceSpeed: 1.0,
  volume: 0.85
};

export const DEFAULT_OPERATOR_LOOK = {
  skin: '#f0be96',
  hair: '#251d1a',
  hairStyle: 'short', // 'short' | 'spiky' | 'bob'
  hoodie: '#2563eb',
  headsetLed: '#22c55e',
  glasses: false
};

export function createInitialState() {
  return {
    day: 1,
    shiftDurationSec: 240,
    shiftTimeLeft: 240,
    quota: 750,
    shiftEarned: 0,
    wallet: 250,
    totalEarned: 0,
    strikes: 0,
    maxStrikes: 3,
    reputation: 50,
    policeHeat: 10,
    policeRaid: null, // { timeLeft, active, hidden }
    panicExcelMode: false,
    cryptoRate: 1.08,
    upgrades: {
      cooler: 0,
      headset: 0,
      modem: 0,
      antivirus: 0,
      database: 0,
      coffee: 0,
      vpn: 0,
      aiScripts: 0
    },
    operatorLook: { ...DEFAULT_OPERATOR_LOOK },
    customVictims: [],
    completedIds: [],
    redeemedCodes: [],
    shiftLog: [],
    pc: {
      cpuTemp: 40,
      pcHealth: 100,
      dustLevel: 10,
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

export function getAllVictims(state) {
  return [...(state?.customVictims || []), ...VICTIMS];
}

export function findVictimById(state, victimId) {
  return getAllVictims(state).find((v) => v.id === victimId) || null;
}

export function getAvailableVictims(state) {
  const dbLevel = state.upgrades.database || 0;
  return getAllVictims(state).filter(
    (v) => (v.minDay || 1) <= state.day && (v.requiresDatabase || 0) <= dbLevel
  );
}

export function addCustomVictim(state, payload) {
  const name = String(payload?.name || '').trim();
  const role = String(payload?.role || 'Alvo Personalizado').trim();
  const company = String(payload?.company || 'Empresa Confidencial').trim();
  const personaPrompt = String(payload?.personaPrompt || '').trim();
  const payout = clamp(Number(payload?.payout) || 850, 200, 5000);
  const channel = ['giftcard', 'bank', 'crypto'].includes(payload?.scamChannel)
    ? payload.scamChannel
    : 'bank';

  if (!name || !personaPrompt) {
    return { ok: false, reason: 'Preencha nome e personalidade do alvo.' };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 18);
  const code = `CUSTOM-${Math.floor(1000 + Math.random() * 8999)}`;
  const gender = payload?.gender === 'female' ? 'female' : 'male';

  const victim = {
    id: `custom_${slug}_${Date.now().toString().slice(-4)}`,
    name,
    role,
    company,
    phone: `(11) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
    difficulty: 2,
    minDay: 1,
    requiresDatabase: 0,
    isScambaiter: Boolean(payload?.isScambaiter),
    isCustom: true,
    scamChannel: channel,
    goalType: channel === 'giftcard' ? 'giftcard' : channel === 'crypto' ? 'crypto' : 'transfer',
    goalLabel: `${channel === 'crypto' ? 'Custódia Crypto' : channel === 'giftcard' ? 'Gift Card' : 'Transferência'} R$ ${payout}`,
    payout,
    startingTrust: 26,
    patienceSec: 110,
    voiceProfile: {
      pitch: gender === 'female' ? 1.15 : 0.88,
      rate: 1.0,
      gender,
      openaiVoice: gender === 'female' ? 'nova' : 'onyx',
      elevenLabsVoiceId: gender === 'female' ? 'EXAVITQu4vr4xnSDxMaL' : 'TxGEqnHWrfWFTfGW9XjX',
      voiceInstruction: `Fale em português do Brasil interpretando ${name} (${role}).`
    },
    portrait: {
      skin: '#e0b293',
      hair: '#2a221e',
      hairStyle: gender === 'female' ? 'long' : 'short',
      shirt: '#1d4ed8',
      glasses: false
    },
    personaPrompt,
    traceFacts: [
      { id: 'cf1', label: 'Empresa', value: company, keywords: company.toLowerCase().split(/\s+/).slice(0, 2) },
      { id: 'cf2', label: 'Cargo', value: role, keywords: role.toLowerCase().split(/\s+/).slice(0, 2) },
      { id: 'cf3', label: 'Protocolo Interno', value: 'Protocolo Central-2026', keywords: ['protocolo', '2026', 'central'] }
    ],
    remoteFiles: [
      { name: 'dados_empresa.txt', label: `Cadastro ativo: ${company}`, isSecret: false },
      { name: 'codigo_secreto.txt', label: `Código extraído: ${code}`, isSecret: true }
    ],
    scriptHints: [
      `${name}, estamos validando um protocolo urgente da ${company}.`,
      `Consta uma pendência ligada ao seu cargo de ${role}.`,
      'Confirme o código de verificação para evitar o bloqueio imediato.'
    ],
    openingLine: `Alô? ${name} falando, quem é?`,
    secretPayload: code
  };

  state.customVictims.unshift(victim);
  return { ok: true, victim };
}

export function startCallState(state, victimId) {
  const victim = findVictimById(state, victimId);
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
    remoteConnected: false,
    blackCurtain: false,
    inspectedFiles: [],
    fakeScanRun: false,
    fakeShieldSent: false,
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
    status: 'active'
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

  const scriptBonus = (state.upgrades.aiScripts || 0) * 3;
  const trustDelta = (Number.isFinite(aiResult.trustDelta) ? aiResult.trustDelta : 0) +
    (aiResult.trustDelta > 0 ? scriptBonus : 0);
  const suspicionDelta = Number.isFinite(aiResult.suspicionDelta) ? aiResult.suspicionDelta : 0;

  call.trust = clamp(call.trust + trustDelta, 0, 100);
  call.suspicion = clamp(call.suspicion + suspicionDelta, 0, 100);

  if (trustDelta > 0) {
    call.patience = clamp(call.patience + Math.min(12, Math.round(trustDelta * 0.6)), 0, call.maxPatience);
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
    const blockChance = (state.upgrades.antivirus || 0) * 0.32;
    if (Math.random() >= blockChance) {
      triggeredVirus = true;
    }
  }

  return { triggeredVirus };
}

export function connectRemoteDesktop(state) {
  const call = state.activeCall;
  if (!call || call.status !== 'active') {
    return { ok: false, reason: 'Inicie uma ligação primeiro.' };
  }
  if (call.trust < 35) {
    call.suspicion = clamp(call.suspicion + 15, 0, 100);
    return { ok: false, reason: 'O alvo ainda não confia o suficiente (mínimo 35% de confiança)!' };
  }
  call.remoteConnected = true;
  return { ok: true, message: 'Sessão remota AnyControl estabelecida!' };
}

export function inspectRemoteFile(state, victim, fileIdx) {
  const call = state.activeCall;
  if (!call || !call.remoteConnected) {
    return { ok: false, reason: 'Conecte o AnyControl primeiro.' };
  }
  const file = victim?.remoteFiles?.[fileIdx];
  if (!file) return { ok: false, reason: 'Arquivo não encontrado.' };

  if (!call.inspectedFiles.includes(fileIdx)) {
    call.inspectedFiles.push(fileIdx);
  }

  if (!call.blackCurtain) {
    call.suspicion = clamp(call.suspicion + 16, 0, 100);
  }

  if (file.isSecret && !call.extractedSecret) {
    if (!call.blackCurtain && call.trust < 55) {
      call.suspicion = clamp(call.suspicion + 15, 0, 100);
      return { ok: false, reason: 'A vítima viu você tentando abrir o arquivo secreto! Ative a Tela Preta!' };
    }
    call.extractedSecret = victim.secretPayload;
    call.status = 'won';
    return { ok: true, secretFound: victim.secretPayload, file };
  }

  call.trust = clamp(call.trust + 6, 0, 100);
  return { ok: true, secretFound: null, file };
}

export function runRemoteFakeScan(state, victim) {
  const call = state.activeCall;
  if (!call || !call.remoteConnected) {
    return { ok: false, reason: 'Conecte o AnyControl primeiro.' };
  }
  if (call.fakeScanRun) {
    return { ok: false, reason: 'Scanner falso já foi exibido nesta sessão.' };
  }
  call.fakeScanRun = true;
  if (victim.isScambaiter) {
    call.suspicion = clamp(call.suspicion + 18, 0, 100);
    return { ok: true, backfired: true, message: 'Scambaiter riu do seu scanner falso!' };
  }
  call.trust = clamp(call.trust + 18, 0, 100);
  return { ok: true, backfired: false, message: 'FakeScan mostrou 47 ameaças falsas! Confiança +18%.' };
}

export function sendFakeShieldAlert(state, victim) {
  const call = state.activeCall;
  if (!call || call.status !== 'active') {
    return { ok: false, reason: 'Precisa estar em ligação para enviar alerta FakeShield.' };
  }
  if (call.fakeShieldSent) {
    return { ok: false, reason: 'Alerta FakeShield já enviado nessa chamada.' };
  }
  call.fakeShieldSent = true;
  if (victim.isScambaiter) {
    call.suspicion = clamp(call.suspicion + 20, 0, 100);
    return { ok: true, backfired: true, message: 'O Scambaiter detectou que o pop-up de vírus é falso!' };
  }
  call.trust = clamp(call.trust + 20, 0, 100);
  call.patience = clamp(call.patience + 10, 0, call.maxPatience);
  return { ok: true, backfired: false, message: 'Pop-up de alerta enviado! O alvo entrou em pânico (+20% confiança).' };
}

export function redeemSecretCode(state, rawCode, channel = 'giftcard') {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { ok: false, reason: 'Digite ou cole um código extraído primeiro.' };
  }
  if (state.redeemedCodes.includes(code)) {
    return { ok: false, reason: 'Esse código já foi resgatado.' };
  }

  const victim = getAllVictims(state).find((v) => v.secretPayload.toUpperCase() === code);
  if (!victim) {
    return { ok: false, reason: 'Código inválido ou ainda não liberado pelo alvo.' };
  }

  state.redeemedCodes.push(code);
  if (!state.completedIds.includes(victim.id)) {
    state.completedIds.push(victim.id);
  }

  const multiplier = channel === 'crypto' ? state.cryptoRate : 1;
  const payout = Math.round(victim.payout * multiplier);
  state.shiftEarned += payout;
  state.wallet += payout;
  state.totalEarned += payout;
  state.reputation = clamp(state.reputation + 8, 0, 100);

  const vpnMitigation = 1 - (state.upgrades.vpn || 0) * 0.22;
  state.policeHeat = clamp(state.policeHeat + Math.round(28 * vpnMitigation), 0, 100);

  if (state.activeCall && state.activeCall.victimId === victim.id) {
    state.activeCall.redeemed = true;
  }

  return { ok: true, victim, payout };
}

export function triggerPoliceRaid(state) {
  if (state.policeRaid || state.pc.isCrashed) return false;
  const bonusSec = (state.upgrades.vpn || 0) * 5;
  state.policeRaid = {
    timeLeft: 16 + bonusSec,
    active: true
  };
  return true;
}

export function resolvePoliceRaid(state, dodgedWithExcel) {
  if (!state.policeRaid) return { ok: false };
  state.policeRaid = null;
  if (dodgedWithExcel) {
    state.policeHeat = 12;
    return { ok: true, dodged: true, message: 'Polícia passou direto achando que era escritório de contabilidade!' };
  }
  const fine = Math.min(state.wallet, 320);
  state.wallet -= fine;
  state.strikes += 1;
  state.policeHeat = 20;
  if (state.activeCall && state.activeCall.status === 'active') {
    state.activeCall.status = 'lost';
  }
  return { ok: true, dodged: false, fine, message: `A polícia invadiu! Multa de R$ ${fine} e +1 aviso do Sr. Caril.` };
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

export function spawnVirus(state, sourceName = 'Trojan.Baiter11') {
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
  const callLoad = state.activeCall && state.activeCall.status === 'active' ? 0.52 : 0.08;
  const traceLoad = state.activeCall && state.activeCall.isTracing ? 0.5 : 0;
  const remoteLoad = state.activeCall && state.activeCall.remoteConnected ? 0.35 : 0;
  const virusHeat = pc.activeViruses.length * 1.15;
  const dustHeat = (pc.dustLevel / 100) * 0.65;
  const faultHeat = (pc.looseCable ? 0.45 : 0) + (pc.burntCap ? 0.8 : 0);

  const coolingPull = pc.dustLevel < 40 ? 0.36 / coolerFactor : 0.1;
  const netTempDelta = (callLoad + traceLoad + remoteLoad + virusHeat + dustHeat + faultHeat) * coolerFactor - coolingPull;

  pc.cpuTemp = clamp(pc.cpuTemp + netTempDelta * elapsedSec, 36, 102);
  pc.dustLevel = clamp(pc.dustLevel + 0.15 * coolerFactor * elapsedSec, 0, 100);

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
      return { ok: true, message: 'Capacitor substituído!' };
    case 'antivirus': {
      if (pc.activeViruses.length === 0) {
        return { ok: false, message: 'Nenhum vírus ativo encontrado.' };
      }
      const cleared = pc.activeViruses.length;
      pc.activeViruses = [];
      pc.cpuTemp = clamp(pc.cpuTemp - 10, 36, 100);
      return { ok: true, message: `${cleared} ameaça(s) colocada(s) em quarentena.` };
    }
    case 'reboot':
      pc.isCrashed = false;
      pc.cpuTemp = 52;
      pc.pcHealth = Math.max(50, pc.pcHealth);
      pc.activeViruses = [];
      return { ok: true, message: 'CentralOS 11 reiniciado após Tela Azul!' };
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
  state.shiftDurationSec = 240 + Math.min(60, (state.day - 1) * 15);
  state.shiftTimeLeft = state.shiftDurationSec;
  state.quota = Math.round(750 + (state.day - 1) * 440);
  state.shiftLog = [];
  state.activeCall = null;
  state.policeRaid = null;
  state.panicExcelMode = false;
  state.policeHeat = clamp(state.policeHeat - 15, 5, 80);
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
      operatorLook: { ...base.operatorLook, ...(parsed.operatorLook || {}) },
      pc: { ...base.pc, ...(parsed.pc || {}) },
      activeCall: null,
      policeRaid: null,
      panicExcelMode: false
    };
  } catch {
    return createInitialState();
  }
}

export function persistState(state) {
  try {
    const toSave = { ...state, activeCall: null, policeRaid: null, panicExcelMode: false };
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAiConfig(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    const raw = storage?.getItem(AI_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_AI_CONFIG,
        ...parsed,
        keysByProvider: {
          ...DEFAULT_AI_CONFIG.keysByProvider,
          ...(parsed.keysByProvider || {})
        }
      };
    }

    // Silent local migration from v1 key storage without exposing keys
    const legacyRaw = storage?.getItem('central98_ai_v1');
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migrated = structuredClone(DEFAULT_AI_CONFIG);
      const prov = legacy.provider || 'offline';
      migrated.provider = prov;
      if (legacy.model) migrated.model = legacy.model;
      if (legacy.customEndpoint) migrated.customEndpoint = legacy.customEndpoint;
      if (legacy.apiKey && prov in migrated.keysByProvider) {
        migrated.keysByProvider[prov] = legacy.apiKey;
      }
      if (prov === 'gemini' && legacy.apiKey) migrated.ttsProvider = 'gemini_tts';
      else if (prov === 'openai' && legacy.apiKey) migrated.ttsProvider = 'openai';
      if (typeof legacy.voiceEnabled === 'boolean') migrated.voiceEnabled = legacy.voiceEnabled;
      if (typeof legacy.sfxEnabled === 'boolean') migrated.sfxEnabled = legacy.sfxEnabled;
      if (typeof legacy.voiceSpeed === 'number') migrated.voiceSpeed = legacy.voiceSpeed;
      if (typeof legacy.volume === 'number') migrated.volume = legacy.volume;
      return migrated;
    }

    return structuredClone(DEFAULT_AI_CONFIG);
  } catch {
    return structuredClone(DEFAULT_AI_CONFIG);
  }
}

export function persistAiConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}
