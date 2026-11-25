import { clamp } from '../state.js';

export const AI_PROVIDERS = {
  offline: {
    label: 'Simulador Local (Sem API Key)',
    defaultModel: 'local-contextual-v1',
    presets: ['local-contextual-v1'],
    needsKey: false
  },
  openrouter: {
    label: 'OpenRouter (BYOK — Multi-Modelos)',
    defaultModel: 'google/gemini-2.0-flash-001',
    presets: [
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-haiku',
      'qwen/qwen-2.5-72b-instruct'
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    needsKey: true
  },
  gemini: {
    label: 'Google Gemini (BYOK)',
    defaultModel: 'gemini-2.5-flash',
    presets: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    needsKey: true
  },
  groq: {
    label: 'Groq (Ultra-Rápido BYOK)',
    defaultModel: 'llama-3.3-70b-versatile',
    presets: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b'],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    needsKey: true
  },
  openai: {
    label: 'OpenAI (BYOK)',
    defaultModel: 'gpt-4o-mini',
    presets: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    needsKey: true
  },
  anthropic: {
    label: 'Anthropic Claude (BYOK)',
    defaultModel: 'claude-3-5-haiku-latest',
    presets: ['claude-3-5-haiku-latest', 'claude-sonnet-4-20250514'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    needsKey: true
  },
  deepseek: {
    label: 'DeepSeek (BYOK)',
    defaultModel: 'deepseek-chat',
    presets: ['deepseek-chat', 'deepseek-reasoner'],
    endpoint: 'https://api.deepseek.com/chat/completions',
    needsKey: true
  },
  xai: {
    label: 'xAI Grok (BYOK)',
    defaultModel: 'grok-3-mini',
    presets: ['grok-3-mini', 'grok-3'],
    endpoint: 'https://api.x.ai/v1/chat/completions',
    needsKey: true
  },
  mistral: {
    label: 'Mistral AI (BYOK)',
    defaultModel: 'mistral-small-latest',
    presets: ['mistral-small-latest', 'mistral-large-latest'],
    endpoint: 'https://api.mistral.com/v1/chat/completions',
    needsKey: true
  },
  together: {
    label: 'Together AI (BYOK)',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    presets: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    needsKey: true
  },
  custom: {
    label: 'Endpoint Local / Custom (Ollama, LM Studio)',
    defaultModel: 'llama3.1',
    presets: ['llama3.1', 'qwen2.5:14b', 'gemma3'],
    needsKey: false
  }
};

export function getActiveApiKey(aiConfig) {
  const provider = aiConfig?.provider || 'offline';
  return (aiConfig?.keysByProvider?.[provider] || '').trim();
}

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
      reply: 'Alô? Cortou um pouco a ligação, pode repetir?',
      trustDelta: 0,
      suspicionDelta: 2,
      mood: 'confused',
      revealSecret: false,
      hangUp: false,
      triggerVirus: false
    };
  }

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

  const toolEvents = [];
  if (call.remoteConnected) toolEvents.push('O operador já está conectado na sua tela via acesso remoto AnyControl.');
  if (call.fakeScanRun) toolEvents.push('Um scanner falso na sua tela acabou de mostrar 47 ameaças críticas.');
  if (call.fakeShieldSent) toolEvents.push('Um pop-up de alerta de segurança FakeShield acabou de piscar no seu PC.');

  return [
    `Você atua como um personagem humano em uma ligação telefônica dentro do jogo satírico CENTRAL 11.`,
    `PERSONAGEM: ${victim.name} — ${victim.role} (${victim.company}).`,
    `PERSONALIDADE: ${victim.personaPrompt}`,
    `OBJETIVO SECRETO DO JOGADOR: Conseguir "${victim.goalLabel}" (${victim.secretPayload}).`,
    revealedText ? `FATOS REAIS DA SUA VIDA/EMPRESA:\n${revealedText}` : '',
    toolEvents.length ? `EVENTOS NA SUA TELA AGORA:\n${toolEvents.join('\n')}` : '',
    `ESTADO DA LIGAÇÃO: Confiança=${call.trust}/100, Suspeita=${call.suspicion}/100, Turno=${call.turns}.`,
    `REGRAS:`,
    `1. Fale em português brasileiro coloquial de telefonema (1 a 3 frases curtas, naturais, sem cara de IA).`,
    `2. Reaja ao que o jogador disse e aos eventos na tela. Citar fatos reais eleva confiança.`,
    `3. Só defina "revealSecret": true quando a confiança passar de ~78 ou estiver convencido(a), citando "${victim.secretPayload}".`,
    `4. Scambaiter (${victim.isScambaiter ? 'SIM' : 'NÃO'}): se perceber erro óbvio, defina "triggerVirus": true.`,
    `RESPONDA APENAS EM JSON VÁLIDO:`,
    `{"reply":"fala natural","trustDelta":12,"suspicionDelta":-4,"mood":"calm|confused|convinced|suspicious|angry","revealSecret":false,"hangUp":false,"triggerVirus":false}`
  ]
    .filter(Boolean)
    .join('\n');
}

export function generateOfflineReply(victim, call, playerText) {
  const norm = normalizeText(playerText);
  const words = norm.split(/\s+/).filter(Boolean);

  const lastPlayer = [...call.messages].reverse().find((m) => m.role === 'player');
  const isRepeat = lastPlayer && normalizeText(lastPlayer.text) === norm;

  if (words.length <= 1 || isRepeat) {
    return {
      reply: isRepeat
        ? 'Você já repetiu essa mesma frase! Tá lendo script pronto ou o quê?'
        : 'Oi? Não deu pra entender nada, fala direito comigo.',
      trustDelta: -4,
      suspicionDelta: 12,
      mood: 'suspicious',
      revealSecret: false,
      hangUp: false,
      triggerVirus: victim.isScambaiter && call.turns >= 1
    };
  }

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

  const politeOrAuthority = /(senhor|senhora|doutor|protocolo|auditoria|setor|seguranca|verificacao|urgente|prazo|bloqueio|multa|sistema|central|suporte|remoto|anycontrol|virus)/.test(
    norm
  );
  const directAsk = /(senha|codigo|gift|pix|transfer|anydesk|token|digito|passa|manda|seed|chave)/.test(
    norm
  );
  const rudeOrSuspicious = /(idiota|burro|passa logo|otario|golpe|hack|roubar)/.test(norm);

  if (rudeOrSuspicious) {
    return {
      reply: 'Ah, pronto! Vou desligar na sua cara e registrar boletim de ocorrência agora!',
      trustDelta: -25,
      suspicionDelta: 45,
      mood: 'angry',
      revealSecret: false,
      hangUp: call.suspicion >= 55,
      triggerVirus: victim.isScambaiter
    };
  }

  let trustDelta = 6;
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
  if (call.fakeShieldSent || call.fakeScanRun) {
    trustDelta += 8;
  }

  if (directAsk && call.trust + trustDelta < 60) {
    trustDelta -= 6;
    suspicionDelta += 18;
    mood = 'suspicious';
    return {
      reply: `Calma lá... mal começou a ligação e já está pedindo ${victim.goalType === 'password' ? 'minha senha' : 'esse código'}? Prova quem você é primeiro!`,
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
      reply: 'Haha, peraí amigão, abri um arquivo seu aqui... opa, disparou um pop-up na sua tela aí também?',
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
      reply: `Nossa, ainda bem que você me avisou com detalhes! Não quero perder nada não. Anota aí: ${victim.secretPayload}. Resolve tudo por favor!`,
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
      giftcard: 'Uai, você tem os dados certinhos mesmo... o que eu preciso comprar ou informar pra não bloquear?',
      transfer: 'Caramba, bate com o sistema daqui mesmo! Qual o procedimento para regularizar o PIX?',
      password: 'Se o pessoal interno já liberou o chamado faz sentido... precisa validar minha credencial agora?',
      remote: 'Que susto! Ainda bem que vocês viram antes. Quer conectar no AnyControl ou precisa do código?',
      crypto: 'Certo, bateu com nossa custódia. Qual chave de validação preciso confirmar?'
    };
    return {
      reply: factReplyByGoal[victim.goalType] || 'Entendi... faz sentido. Qual é o próximo passo?',
      trustDelta,
      suspicionDelta,
      mood: 'convinced',
      revealSecret: false,
      hangUp: false,
      triggerVirus: false
    };
  }

  const midLines = [
    'Olha, parece sério, mas como sei que não é trote? Me passa algum dado real nosso.',
    'Ainda tô desconfiado dessa história... quem exatamente pediu pra você ligar?',
    'Fala mais claro que tá falhando aqui. Qual setor ou empresa que tá cobrando isso?'
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
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 250
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
        temperature: 0.8,
        maxOutputTokens: 250,
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

async function callAnthropic(apiKey, model, systemPrompt, history) {
  const response = await fetch(AI_PROVIDERS.anthropic.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model || AI_PROVIDERS.anthropic.defaultModel,
      max_tokens: 250,
      system: systemPrompt,
      messages: history.map((m) => ({
        role: m.role === 'player' ? 'user' : 'assistant',
        content: m.text
      }))
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Anthropic HTTP ${response.status}: ${errText.slice(0, 140)}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function requestVictimReply(aiConfig, victim, call, playerText) {
  const provider = aiConfig?.provider || 'offline';
  if (provider === 'offline') {
    return { ...generateOfflineReply(victim, call, playerText), source: 'offline' };
  }

  const meta = AI_PROVIDERS[provider];
  const apiKey = getActiveApiKey(aiConfig);
  if (meta?.needsKey && !apiKey) {
    const fallback = generateOfflineReply(victim, call, playerText);
    return { ...fallback, source: 'offline-fallback', warning: `Sem API key para ${meta.label}.` };
  }

  const systemPrompt = buildSystemPrompt(victim, call);
  const history = [...call.messages.slice(-8), { role: 'player', text: playerText }];

  try {
    let rawText = '';
    if (provider === 'gemini') {
      rawText = await callGemini(apiKey, aiConfig.model, systemPrompt, history);
    } else if (provider === 'anthropic') {
      rawText = await callAnthropic(apiKey, aiConfig.model, systemPrompt, history);
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
          ? {
              'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://central11.local',
              'X-Title': 'CENTRAL 11'
            }
          : {};

      rawText = await callOpenAiCompatible(
        endpoint,
        apiKey,
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
    return { ok: true, message: 'Simulador Local Contextual pronto (sem API Key).' };
  }

  const meta = AI_PROVIDERS[provider];
  const apiKey = getActiveApiKey(aiConfig);
  if (meta?.needsKey && !apiKey) {
    return { ok: false, message: `Informe a API Key de ${meta.label} antes de testar.` };
  }

  try {
    if (provider === 'gemini') {
      const raw = await callGemini(
        apiKey,
        aiConfig.model || meta.defaultModel,
        'Responda apenas JSON: {"ok":true}',
        [{ role: 'player', text: 'ping' }]
      );
      return { ok: Boolean(raw), message: `Gemini conectado (${aiConfig.model || meta.defaultModel}).` };
    }

    if (provider === 'anthropic') {
      const raw = await callAnthropic(
        apiKey,
        aiConfig.model || meta.defaultModel,
        'Responda apenas OK.',
        [{ role: 'player', text: 'ping' }]
      );
      return { ok: Boolean(raw), message: `Claude conectado: "${raw.slice(0, 35)}"` };
    }

    const endpoint = provider === 'custom' ? aiConfig.customEndpoint?.trim() : meta.endpoint;
    const raw = await callOpenAiCompatible(
      endpoint,
      apiKey,
      aiConfig.model || meta.defaultModel,
      [{ role: 'user', content: 'Responda apenas: OK' }]
    );
    return { ok: Boolean(raw), message: `${meta.label} conectado: "${raw.slice(0, 35)}"` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
