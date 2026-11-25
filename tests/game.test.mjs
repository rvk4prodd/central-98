import test from 'node:test';
import assert from 'node:assert/strict';

import { VICTIMS } from '../js/data/victims.js';
import {
  addCustomVictim,
  advanceToNextDay,
  applyCallTurnResult,
  buyUpgradeItem,
  canEndShiftEarly,
  connectRemoteDesktop,
  createInitialState,
  DEFAULT_AI_CONFIG,
  evaluateShift,
  inspectRemoteFile,
  loadAiConfig,
  redeemSecretCode,
  repairPart,
  resolvePoliceRaid,
  runRemoteFakeScan,
  sendFakeShieldAlert,
  spawnVirus,
  spoofRedialVictim,
  startCallState,
  tickHardware,
  triggerPoliceRaid
} from '../js/state.js';
import {
  AI_PROVIDERS,
  getActiveApiKey,
  isAiReady,
  parseAiResponse,
  rankModelsForGame
} from '../js/engine/ai-client.js';
import { decodePcm16ToFloat32 } from '../js/engine/audio.js';
import { CentralGame } from '../js/engine/game.js';

test('supports 10 real AI providers, mandatory BYOK check, and legacy migration', () => {
  assert.equal(Object.keys(AI_PROVIDERS).length, 10);
  const cfg = structuredClone(DEFAULT_AI_CONFIG);
  assert.equal(isAiReady(cfg), false);

  cfg.keysByProvider.gemini = 'AIza-demo';
  assert.equal(isAiReady(cfg), true);

  cfg.provider = 'anthropic';
  assert.equal(isAiReady(cfg), false);
  cfg.keysByProvider.anthropic = 'sk-ant-test-123';
  assert.equal(getActiveApiKey(cfg), 'sk-ant-test-123');
  assert.equal(isAiReady(cfg), true);

  cfg.provider = 'custom';
  assert.equal(isAiReady(cfg), true);

  const fakeStorage = {
    getItem: (k) => (k === 'central98_ai_v1' ? JSON.stringify({ provider: 'offline', apiKey: '', model: 'local-contextual-v1' }) : null)
  };
  const migrated = loadAiConfig(fakeStorage);
  assert.equal(migrated.provider, 'gemini');
  assert.equal(isAiReady(migrated), false);
});

test('rankModelsForGame filters non-chat models and prioritizes recommended/free models', () => {
  const ranked = rankModelsForGame('openrouter', [
    { id: 'text-embedding-3-large', name: 'Embed' },
    { id: 'openai/whisper-1', name: 'Whisper' },
    { id: 'openai/tts-1', name: 'TTS' },
    { id: 'some/random-model', name: 'Random' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 Free', isFree: true },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ]);

  assert.equal(ranked.some((m) => m.id.includes('embedding') || m.id.includes('whisper') || m.id.includes('tts')), false);
  assert.equal(ranked[0].id, 'meta-llama/llama-3.3-70b-instruct:free');
  assert.ok(ranked[0].badges.includes('Grátis'));
  assert.ok(ranked[1].id === 'google/gemini-2.5-flash');
});

test('parseAiResponse strips think tags/fences and decodePcm16ToFloat32 decodes PCM16', () => {
  const clean = parseAiResponse('<think>reasoning...</think>\n```json\n{"reply":"Oi, tudo bem?","trustDelta":15,"suspicionDelta":-5,"mood":"convinced","revealSecret":true}\n```');
  assert.equal(clean.reply, 'Oi, tudo bem?');
  assert.equal(clean.revealSecret, true);

  const bytes = new Uint8Array([0x00, 0x00, 0xff, 0x7f, 0x00, 0x80]);
  const floats = decodePcm16ToFloat32(bytes);
  assert.equal(floats.length, 3);
  assert.equal(floats[0], 0);
  assert.ok(floats[1] > 0.99 && floats[1] <= 1);
  assert.equal(floats[2], -1);
});

test('dialVictim blocks without API key, and hangUpCall clears activeCall cleanly', () => {
  const game = new CentralGame();
  assert.equal(game.dialVictim('dona_marlene'), false);

  game.updateAiConfig({ provider: 'gemini', keysByProvider: { gemini: 'AIza-test' } });
  assert.equal(game.dialVictim('dona_marlene'), true);
  assert.equal(game.state.activeCall.victimId, 'dona_marlene');

  game.hangUpCall();
  assert.equal(game.state.activeCall, null);
  assert.equal(game.dialVictim('cleber_oficina'), true);
});

test('redeemSecretCode requires prior extraction and spoofRedial unlocks hung-up victims', () => {
  const state = createInitialState();
  const victim = VICTIMS[0];

  // Reject guessing a secret that was never extracted
  const guessed = redeemSecretCode(state, victim.secretPayload);
  assert.equal(guessed.ok, false);

  startCallState(state, victim.id);
  applyCallTurnResult(
    state,
    victim,
    { reply: 'Ok', trustDelta: 60, suspicionDelta: 0, mood: 'convinced', revealSecret: true, hangUp: false, triggerVirus: false },
    'Protocolo confirmado'
  );
  assert.equal(state.activeCall.status, 'won');

  const redeemed = redeemSecretCode(state, victim.secretPayload);
  assert.equal(redeemed.ok, true);
  assert.equal(state.shiftEarned, victim.payout);

  // Victim hangup locks target until spoofed
  const second = VICTIMS[1];
  startCallState(state, second.id);
  applyCallTurnResult(
    state,
    second,
    { reply: 'Golpe!', trustDelta: -20, suspicionDelta: 95, mood: 'angry', revealSecret: false, hangUp: true, triggerVirus: false },
    'Passa o pix logo'
  );
  assert.ok(state.failedVictimIds.includes(second.id));
  const spoof = spoofRedialVictim(state, second.id);
  assert.equal(spoof.ok, true);
  assert.equal(state.failedVictimIds.includes(second.id), false);
});

test('AnyControl, FakeShield, Police Raid, hardware line penalty and canEndShiftEarly work together', () => {
  const state = createInitialState();
  const victim = VICTIMS.find((v) => v.id === 'dona_marlene');
  startCallState(state, victim.id);

  // Active virus/loose cable adds +5 suspicion penalty on turns
  spawnVirus(state, 'Teste');
  const prevSusp = state.activeCall.suspicion;
  applyCallTurnResult(state, victim, { reply: 'Alô?', trustDelta: 20, suspicionDelta: 0, mood: 'calm' }, 'Oi');
  assert.equal(state.activeCall.suspicion, prevSusp + 5);

  const conn = connectRemoteDesktop(state);
  assert.equal(conn.ok, true);
  assert.equal(runRemoteFakeScan(state, victim).ok, true);
  assert.equal(sendFakeShieldAlert(state, victim).ok, true);

  state.activeCall.blackCurtain = true;
  const secretIdx = victim.remoteFiles.findIndex((f) => f.isSecret);
  const fileRes = inspectRemoteFile(state, victim, secretIdx);
  assert.equal(fileRes.ok, true);
  assert.equal(fileRes.secretFound, victim.secretPayload);

  // Police raid dodge vs fine
  triggerPoliceRaid(state);
  assert.equal(resolvePoliceRaid(state, true).dodged, true);

  // Early shift end check
  state.activeCall = null;
  state.shiftEarned = state.quota;
  assert.equal(canEndShiftEarly(state), true);

  // Custom victim + CryptoVault + BSOD
  const created = addCustomVictim(state, {
    name: 'Seu Arlindo',
    role: 'Síndico',
    company: 'Condomínio Sol',
    payout: 1000,
    scamChannel: 'crypto',
    personaPrompt: 'Síndico preocupado com boleto.'
  });
  assert.equal(created.ok, true);
  state.wallet = 1000;
  assert.equal(buyUpgradeItem(state, 'vpn').ok, true);

  state.pc.cpuTemp = 96;
  const hw = tickHardware(state, 5, () => 0.9);
  assert.equal(hw.crashedNow, true);
  assert.equal(repairPart(state, 'reboot').ok, true);
  assert.equal(evaluateShift(state).hitQuota, true);
  advanceToNextDay(state);
  assert.equal(state.day, 2);
});
