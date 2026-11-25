import test from 'node:test';
import assert from 'node:assert/strict';

import { VICTIMS } from '../js/data/victims.js';
import {
  advanceToNextDay,
  applyCallTurnResult,
  buyUpgradeItem,
  createInitialState,
  evaluateShift,
  redeemSecretCode,
  repairPart,
  spawnVirus,
  startCallState,
  tickHardware
} from '../js/state.js';
import { generateOfflineReply, parseAiResponse } from '../js/engine/ai-client.js';

test('parseAiResponse handles valid JSON, markdown-fenced JSON, and plain text fallback', () => {
  const clean = parseAiResponse('{"reply":"Oi, tudo bem?","trustDelta":15,"suspicionDelta":-5,"mood":"convinced","revealSecret":true,"hangUp":false,"triggerVirus":false}');
  assert.equal(clean.reply, 'Oi, tudo bem?');
  assert.equal(clean.trustDelta, 15);
  assert.equal(clean.revealSecret, true);

  const fenced = parseAiResponse('```json\n{"reply":"Certo, anota aí.","trustDelta":10,"suspicionDelta":0,"mood":"calm","revealSecret":false}\n```');
  assert.equal(fenced.reply, 'Certo, anota aí.');
  assert.equal(fenced.trustDelta, 10);

  const plain = parseAiResponse('Isso parece golpe! Vou chamar a polícia!');
  assert.equal(plain.mood, 'angry');
  assert.ok(plain.suspicionDelta > 0);
});

test('offline motor rewards trace facts and reveals secret at high trust', () => {
  const state = createInitialState();
  const victim = VICTIMS.find((v) => v.id === 'dona_marlene');
  startCallState(state, victim.id);

  // First turn: polite + mentions trace fact keywords (airfryer, caixa 0412)
  const r1 = generateOfflineReply(victim, state.activeCall, 'Dona Marlene, aqui é do setor da Scamazon sobre sua panela AirFryer e o protocolo da Caixa 0412.');
  applyCallTurnResult(state, victim, r1, 'Dona Marlene, aqui é do setor da Scamazon sobre sua panela AirFryer e o protocolo da Caixa 0412.');
  assert.ok(state.activeCall.trust > victim.startingTrust);

  // Second turn: mentions grandson Lucas -> pushes trust above secret threshold
  const r2 = generateOfflineReply(victim, state.activeCall, 'Seu neto Lucas pediu para confirmar a entrega urgente antes do bloqueio.');
  applyCallTurnResult(state, victim, r2, 'Seu neto Lucas pediu para confirmar a entrega urgente antes do bloqueio.');

  assert.equal(state.activeCall.status, 'won');
  assert.equal(state.activeCall.extractedSecret, victim.secretPayload);
});

test('scambaiter triggers virus popup when probed lazily', () => {
  const state = createInitialState();
  state.day = 3;
  const baiter = VICTIMS.find((v) => v.isScambaiter);
  startCallState(state, baiter.id);

  const r1 = generateOfflineReply(baiter, state.activeCall, 'Oi tudo bem');
  applyCallTurnResult(state, baiter, r1, 'Oi tudo bem');

  const r2 = generateOfflineReply(baiter, state.activeCall, 'Me passa logo os dados');
  assert.equal(r2.triggerVirus, true);
});

test('hardware heats up, crashes at 100C, and repairs recover health', () => {
  const state = createInitialState();
  state.pc.cpuTemp = 96;
  state.pc.dustLevel = 80;
  spawnVirus(state, 'Teste');

  const tickRes = tickHardware(state, 5, () => 0.9);
  assert.equal(tickRes.crashedNow, true);
  assert.equal(state.pc.isCrashed, true);

  const rebootRes = repairPart(state, 'reboot');
  assert.equal(rebootRes.ok, true);
  assert.equal(state.pc.isCrashed, false);

  state.pc.looseCable = true;
  const cableRes = repairPart(state, 'cable');
  assert.equal(cableRes.ok, true);
  assert.equal(state.pc.looseCable, false);
});

test('economy redeems secret once, buys upgrades, and evaluates shift', () => {
  const state = createInitialState();
  const victim = VICTIMS[0];

  const first = redeemSecretCode(state, victim.secretPayload);
  assert.equal(first.ok, true);
  assert.equal(state.shiftEarned, victim.payout);

  const dup = redeemSecretCode(state, victim.secretPayload);
  assert.equal(dup.ok, false);

  state.wallet = 1000;
  const buy = buyUpgradeItem(state, 'cooler');
  assert.equal(buy.ok, true);
  assert.equal(state.upgrades.cooler, 1);

  state.shiftEarned = state.quota;
  const report = evaluateShift(state);
  assert.equal(report.hitQuota, true);
  assert.equal(report.fired, false);

  advanceToNextDay(state);
  assert.equal(state.day, 2);
  assert.equal(state.shiftEarned, 0);
});
