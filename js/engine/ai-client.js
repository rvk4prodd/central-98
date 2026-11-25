import { clamp } from '../state.js';

export const AI_PROVIDERS = {
  offline: {
    label: 'Simulador Local (Sem API Key)',
    defaultModel: 'local-contextual-v1',
    needsKey: false
  },
  openrouter: {
    label: 'OpenRouter (BYOK)',
    defaultModel: 'google/gemini-2.0-flash-001',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    needsKey: true
  },
  gemini: {
    label: 'Google Gemini (BYOK)',
    defaultModel: 'gemini-2.5-flash',
    needsKey: true
  },
  groq: {
    label: 'Groq (BYOK)',
    defaultModel: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    needsKey: true
  },
  openai: {
    label: 'OpenAI (BYOK)',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    needsKey: true
  },
  custom: {
    label: 'Endpoint Custom (Ollama / LM Studio)',
    defaultModel: 'llama3.1',
    needsKey: false
  }
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parseAiResponse(rawText) {
  const raw = String(rawText || '').trim();
  if (!raw) {
    return {
      reply: 'Alô? Cortou a ligação aqui, pode repetir?',
      trustDelta: 0,
      suspicionDelta: 2,
      mood: 'confused',
      revealSecret: false,
      hangUp: false,
      triggerVirus: false
    };
  }

  // Strip markdown fences if the model wrapped the JSON payload
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const reply = String(parsed.reply || parsed.message || parsed.text || '').trim();
      if (reply) {
        return {
          reply,
          trustDelta: clamp(Number(parsed.trustDelta) || 0, -30, 35),
          suspicionDelta: clamp(Number(parsed.suspicionDelta) || 0, -20, 40),
          mood: ['calm', 'confused', 'convinced', 'suspicious', 'angry'].includes(parsed.mood)
            ? parsed.mood
            : 'calm',
          revealSecret: Boolean(parsed.revealSecret),
          hangUp: Boolean(parsed.hangUp),
          triggerVirus: Boolean(parsed.triggerVirus)
        };
      }
    } catch {
      // Fall through to plain text fallback
    }
  }

  // Heuristic fallback if the model returned plain dialogue
  const norm = normalizeText(stripped);
  const angry = /(golpe|policia|desligando|mentira|procon|fraude)/.test(norm);
  const convinced = /(tudo bem|vou passar|anota ai|aqui esta|ta bom|confio)/.test(norm);

  return {
    reply: stripped.slice(0, 260),
    trustDelta: convinced ? 16 : angry ? -12 : 4,
    suspicionDelta: angry ? 22 : convinced ? -6 : 2,
    mood: angry ? 'angry' : convinced ? 'convinced' : 'confused',
    revealSecret: convinced,
    hangUp: false,
    triggerVirus: false
  };
}

export function buildSystemPrompt(victim, call) {
  const revealedText = call.revealedFacts
    .map((idx) => victim.traceFacts[idx])
    .filter(Boolean)
    .map((f) => `- ${f.label}: ${f.value}`)
    .join('\n');

  return [
    `Você está atuando como um personagem humano em uma ligação telefônica dentro de um jogo satírico chamado CENTRAL 98 (estilo comédia de call center).`,
    `PERSONAGEM: ${victim.name} — ${victim.role} (${victim.company}).`,
    `PERSONALIDADE: ${victim.personaPrompt}`,
    `OBJETIVO SECRETO DO JOGADOR: Conseguir "${victim.goalLabel}" (${victim.secretPayload}).`,
    revealedText ? `FATOS QUE EXISTEM NA SUA VIDA REAL:\n${revealedText}` : '',
    `ESTADO ATUAL DA LIGAÇÃO: Confiança=${call.trust}/100, Suspeita=${call.suspicion}/100, Turno=${call.turns}.`,
    `REGRAS DE ATUAÇÃO:`,
    `1. Fale em português brasileiro natural e coloquial de telefonema (1 a 3 frases curtas, diretas, sem parecer robô nem assistente).`,
    `2. Reaja ao que o jogador realmente disse. Se o jogador mencionar algum fato real da sua vida/empresa, sua confiança sobe muito.`,
    `3. Se o jogador pedir dinheiro/senha cedo demais sem justificativa ou for grosseiro, sua suspeita sobe.`,
    `4. Só defina "revealSecret": true quando a confiança passar de ~78 ou você estiver realmente convencido(a), incluindo o código "${victim.secretPayload}" na fala.`,
    `5. Se você for um Scambaiter (${victim.isScambaiter ? 'SIM' : 'NÃO'}), enrole com humor e defina "triggerVirus": true quando notar erro amador.`,
    `RESPONDA ESTRITAMENTE EM JSON VÁLIDO (sem texto fora do JSON):`,
    `{"reply":"sua fala aqui","trustDelta":12,"suspicionDelta":-4,"mood":"calm|confused|convinced|suspicious|angry","revealSecret":false,"hangUp":false,"triggerVirus":false}`
  ]
    .filter(Boolean)
    .join('\n');
}

export function generateOfflineReply(victim, call, playerText) {
  const norm = normalizeText(playerText);
  const words = norm.split(/\s+/).filter(Boolean);

  // Detect repetition against last player message
  const lastPlayer = [...call.messages].reverse().find((m) => m.role === 'player');
  const isRepeat = lastPlayer && normalizeText(lastPlayer.text) === norm;

  if (words.length <= 1 || isRepeat) {
    return {
      reply: isRepeat
        ? 'Você já falou isso faz dez segundos! Tá lendo script pronto ou o quê?'
        : 'Oi? Não entendi nada, fala direito comigo.',
      trustDelta: -4,
      suspicionDelta: 12,
      mood: 'suspicious',
      revealSecret: false,
      hangUp: false,
      triggerVirus: victim.isScambaiter && call.turns >= 1
    };
  }

  // Check if player hit any trace facts (revealed or guessed)
  let hitFacts = 0;
  victim.traceFacts.forEach((fact, idx) => {
    const matched = fact.keywords.some((kw) => norm.includes(normalizeText(kw)));
    if (matched && !call.usedFactIndices.includes(idx)) {
      call.usedFactIndices.push(idx);
      hitFacts += 1;
    } else if (matched) {
      hitFacts += 0.35;
    }
  });

  const politeOrAuthority = /(senhor|senhora|doutor|protocolo|auditoria|setor|seguranca|verificacao|urgente|prazo|bloqueio|multa|sistema|central|suporte)/.test(
    norm
  );
  const directAsk = /(senha|codigo|gift|pix|transfer|anydesk|token|digito|passa|manda)/.test(
    norm
  );
  const rudeOrSuspicious = /(idiota|burro|passa logo|otario|golpe|hack|roubar)/.test(norm);

  if (rudeOrSuspicious) {
    return {
      reply: 'Ah, pronto! Vou chamar a polícia e desligar na sua cara agora mesmo!',
      trustDelta: -25,
      suspicionDelta: 45,
      mood: 'angry',
      revealSecret: false,
      hangUp: call.suspicion >= 55,
      triggerVirus: victim.isScambaiter
    };
  }

  let trustDelta = 5;
  let suspicionDelta = 0;
  let mood = 'confused';

  if (hitFacts >= 1) {
    trustDelta += Math.round(24 * Math.min(2, hitFacts));
    suspicionDelta -= 10;
    mood = 'convinced';
  }
  if (politeOrAuthority) {
    trustDelta += 12;
    suspicionDelta -= 3;
  }

  if (directAsk && call.trust + trustDelta < 60) {
    trustDelta -= 6;
    suspicionDelta += 18;
    mood = 'suspicious';
    return {
      reply: `Peraí... mal começamos a conversar e você já quer ${victim.goalType === 'password' ? 'minha senha' : 'esse código'}? Prova primeiro de onde você tá ligando!`,
      trustDelta,
      suspicionDelta,
      mood,
      revealSecret: false,
      hangUp: false,
      triggerVirus: victim.isScambaiter
    };
  }

  const projectedTrust = clamp(call.trust + trustDelta, 0, 100);
  const projectedSuspicion = clamp(call.suspicion + suspicionDelta, 0, 100);

  if (victim.isScambaiter && hitFacts < 1 && call.turns >= 1 && projectedTrust < 78) {
    return {
      reply: 'Haha, peraí amigão, deixei o arquivo salvo num link aqui... ops, abriu aí na sua tela? Deve ser meu antivírus apitando!',
      trustDelta: 4,
      suspicionDelta: 10,
      mood: 'suspicious',
      revealSecret: false,
      hangUp: false,
      triggerVirus: true
    };
  }

  if (projectedTrust >= 78 && projectedSuspicion < 75) {
    return {
      reply: `Nossa, ainda bem que você ligou e explicou certinho! Não quero problema com isso não. Anota aí: ${victim.secretPayload}. Resolve tudo por favor!`,
      trustDelta,
      suspicionDelta: -8,
      mood: 'convinced',
      revealSecret: true,
      hangUp: false,
      triggerVirus: false
    };
  }

  if (hitFacts >= 1) {
    const factReplyByGoal = {
      giftcard: 'Uai, como você sabe disso tudo?! Então é sério mesmo... o que eu preciso comprar ou digitar pra não bloquear?',
      transfer: 'Caramba, bate com o que tá aqui no sistema mesmo! Qual é o procedimento certo pra regularizar isso rápido?',
      password: 'Ah, se o pessoal interno já liberou o protocolo então faz sentido... precisa validar algum acesso meu agora?',
      remote: 'Gente, que susto! Ainda bem que vocês viram antes de derrubar tudo. Onde que eu clico pra passar o acesso?'
    };
    return {
      reply: factReplyByGoal[victim.goalType] || 'Entendi... faz sentido o que você falou. Qual o próximo passo?',
      trustDelta,
      suspicionDelta,
      mood: 'convinced',
      revealSecret: false,
      hangUp: false,
      triggerVirus: false
    };
  }

  const midLines = [
    'Olha, até parece urgente, mas como eu sei que não é trote? Me dá um detalhe concreto daqui.',
    'Tô meio desconfiado dessa história... quem exatamente pediu pra você me ligar?',
    'Fala mais claro que o telefone tá chiando. Que setor ou empresa que tá cobrando isso?'
  ];
  return {
    reply: midLines[call.turns % midLines.length],
    trustDelta: politeOrAuthority ? 10 : 4,
    suspicionDelta: politeOrAuthority ? 2 : 7,
    mood: 'confused',
    revealSecret: false,
    hangUp: false,
    triggerVirus: false
  };
}

async function callOpenAiCompatible(endpoint, apiKey, model, messages, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.78,
      max_tokens: 240
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 140)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey, model, systemPrompt, history) {
  const safeModel = encodeURIComponent(model || AI_PROVIDERS.gemini.defaultModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = history.map((msg) => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.78,
        maxOutputTokens: 240,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 140)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function requestVictimReply(aiConfig, victim, call, playerText) {
  const provider = aiConfig?.provider || 'offline';
  if (provider === 'offline') {
    return { ...generateOfflineReply(victim, call, playerText), source: 'offline' };
  }

  const meta = AI_PROVIDERS[provider];
  if (meta?.needsKey && !aiConfig.apiKey?.trim()) {
    const fallback = generateOfflineReply(victim, call, playerText);
    return { ...fallback, source: 'offline-fallback', warning: 'Sem API key configurada.' };
  }

  const systemPrompt = buildSystemPrompt(victim, call);
  const history = [...call.messages.slice(-8), { role: 'player', text: playerText }];

  try {
    let rawText = '';
    if (provider === 'gemini') {
      rawText = await callGemini(aiConfig.apiKey.trim(), aiConfig.model, systemPrompt, history);
    } else {
      const endpoint =
        provider === 'custom'
          ? aiConfig.customEndpoint?.trim() || 'http://localhost:11434/v1/chat/completions'
          : meta.endpoint;

      const openAiMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === 'player' ? 'user' : 'assistant',
          content: m.text
        }))
      ];

      const extraHeaders =
        provider === 'openrouter'
          ? { 'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://central98.local', 'X-Title': 'CENTRAL 98' }
          : {};

      rawText = await callOpenAiCompatible(
        endpoint,
        aiConfig.apiKey?.trim(),
        aiConfig.model || meta.defaultModel,
        openAiMessages,
        extraHeaders
      );
    }

    return { ...parseAiResponse(rawText), source: provider };
  } catch (err) {
    const fallback = generateOfflineReply(victim, call, playerText);
    return {
      ...fallback,
      source: 'offline-fallback',
      warning: err instanceof Error ? err.message : String(err)
    };
  }
}

export async function testProviderConnection(aiConfig) {
  const provider = aiConfig?.provider || 'offline';
  if (provider === 'offline') {
    return { ok: true, message: 'Motor Local Contextual ativo e pronto (sem necessidade de chave).' };
  }

  const meta = AI_PROVIDERS[provider];
  if (meta?.needsKey && !aiConfig.apiKey?.trim()) {
    return { ok: false, message: 'Informe uma API Key antes de testar.' };
  }

  try {
    if (provider === 'gemini') {
      const raw = await callGemini(
        aiConfig.apiKey.trim(),
        aiConfig.model || meta.defaultModel,
        'Responda apenas JSON: {"ok":true}',
        [{ role: 'player', text: 'ping' }]
      );
      return { ok: Boolean(raw), message: `Conexão Gemini OK (${aiConfig.model}).` };
    }

    const endpoint =
      provider === 'custom'
        ? aiConfig.customEndpoint?.trim()
        : meta.endpoint;

    const raw = await callOpenAiCompatible(
      endpoint,
      aiConfig.apiKey?.trim(),
      aiConfig.model || meta.defaultModel,
      [{ role: 'user', content: 'Responda apenas: OK' }]
    );
    return { ok: Boolean(raw), message: `Conexão ${meta.label} OK: "${raw.slice(0, 40)}"` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
