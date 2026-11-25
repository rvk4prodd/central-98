import test from 'node:test';
import assert from 'node:assert/strict';

import { VICTIMS } from '../js/data/victims.js';
import {
  addCustomVictim,
  advanceToNextDay,
  applyCallTurnResult,
  buyUpgradeItem,
  connectRemoteDesktop,
  createInitialState,
  DEFAULT_AI_CONFIG,
  evaluateShift,
  inspectRemoteFile,
  redeemSecretCode,
  repairPart,
  resolvePoliceRaid,
  runRemoteFakeScan,
  sendFakeShieldAlert,
  spawnVirus,
  startCallState,
  tickHardware,
  triggerPoliceRaid
} from '../js/state.js';
import { AI_PROVIDERS, generateOfflineReply, getActiveApiKey, parseAiResponse } from '../js/engine/ai-client.js';

test('supports 10+ AI providers with per-provider key vault and JSON parser', () => {
  assert.ok(Object.keys(AI_PROVIDERS).length >= 11);
  const cfg = structuredClone(DEFAULT_AI_CONFIG);
  cfg.provider = 'anthropic';
  cfg.keysByProvider.anthropic = 'sk-ant-test-123';
  assert.equal(getActiveApiKey(cfg), 'sk-ant-test-123');

  const clean = parseAiResponse('{"reply":"Oi, tudo bem?","trustDelta":15,"suspicionDelta":-5,"mood":"convinced","revealSecret":true}');
  assert.equal(clean.reply, 'Oi, tudo bem?');
  assert.equal(clean.revealSecret, true);

  const fenced = parseAiResponse('```json\n{"reply":"Certo.","trustDelta":10,"mood":"calm"}\n```');
  assert.equal(fenced.reply, 'Certo.');
});

test('AnyControl remote desktop, black curtain, FakeScan and FakeShield flow', () => {
  const state = createInitialState();
  const victim = VICTIMS.find((v) => v.id === 'dona_marlene');
  startCallState(state, victim.id);

  // Boost trust above 35% without completing the call yet
  const r1 = generateOfflineReply(victim, state.activeCall, 'Dona Marlene, aqui é do setor de protocolo da entrega.');
  applyCallTurnResult(state, victim, r1, 'Dona Marlene, aqui é do setor de protocolo da entrega.');
  assert.equal(state.activeCall.status, 'active');
  assert.ok(state.activeCall.trust >= 35);

  const conn = connectRemoteDesktop(state);
  assert.equal(conn.ok, true);

  const scan = runRemoteFakeScan(state, victim);
  assert.equal(scan.ok, true);
  assert.equal(scan.backfired, false);

  state.activeCall.blackCurtain = true;
  const secretIdx = victim.remoteFiles.findIndex((f) => f.isSecret);
  const fileRes = inspectRemoteFile(state, victim, secretIdx);
  assert.equal(fileRes.ok, true);
  assert.equal(fileRes.secretFound, victim.secretPayload);
  assert.equal(state.activeCall.status, 'won');
});

test('FakeShield panics normal victims and backfires on Scambaiters', () => {
  const state = createInitialState();
  state.day = 3;
  const baiter = VICTIMS.find((v) => v.isScambaiter);
  startCallState(state, baiter.id);

  const res = sendFakeShieldAlert(state, baiter);
  assert.equal(res.ok, true);
  assert.equal(res.backfired, true);
});

test('Police Raid dodge with Excel vs fine + strike', () => {
  const state = createInitialState();
  state.wallet = 500;
  assert.equal(triggerPoliceRaid(state), true);
  const dodged = resolvePoliceRaid(state, true);
  assert.equal(dodged.dodged, true);
  assert.equal(state.strikes, 0);

  triggerPoliceRaid(state);
  const busted = resolvePoliceRaid(state, false);
  assert.equal(busted.dodged, false);
  assert.equal(state.strikes, 1);
  assert.ok(state.wallet < 500);
});

test('Custom victim creator, CryptoVault multiplier, upgrades, and hardware BSOD recovery', () => {
  const state = createInitialState();
  const created = addCustomVictim(state, {
    name: 'Seu Arlindo',
    role: 'Síndico',
    company: 'Condomínio Sol',
    payout: 1000,
    scamChannel: 'crypto',
    personaPrompt: 'Síndico preocupado com boleto.'
  });
  assert.equal(created.ok, true);

  state.cryptoRate = 1.25;
  const redeem = redeemSecretCode(state, created.victim.secretPayload, 'crypto');
  assert.equal(redeem.ok, true);
  assert.equal(redeem.payout, 1250);

  const buy = buyUpgradeItem(state, 'vpn');
  assert.equal(buy.ok, true);
  assert.equal(state.upgrades.vpn, 1);

  state.pc.cpuTemp = 96;
  spawnVirus(state, 'Teste');
  const hw = tickHardware(state, 5, () => 0.9);
  assert.equal(hw.crashedNow, true);
  assert.equal(repairPart(state, 'reboot').ok, true);

  state.shiftEarned = state.quota;
  assert.equal(evaluateShift(state).hitQuota, true);
  advanceToNextDay(state);
  assert.equal(state.day, 2);
});
