import { clamp } from '../state.js';

export const AI_PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    presets: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: false, contextLength: 1000000 },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', isFree: false, contextLength: 1000000 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', isFree: false, contextLength: 1000000 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', isFree: false, contextLength: 1000000 }
    ],
    needsKey: true
  },
  openrouter: {
    label: 'OpenRouter (Vários Modelos + Grátis)',
    defaultModel: 'google/gemini-2.0-flash-001',
    presets: [
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)', isFree: false, contextLength: 1000000 },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', isFree: true, contextLength: 131072 },
      { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B IT (Free)', isFree: true, contextLength: 131072 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', isFree: false, contextLength: 128000 },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', isFree: false, contextLength: 200000 }
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    needsKey: true
  },
  groq: {
    label: 'Groq (Ultra-Rápido)',
    defaultModel: 'llama-3.3-70b-versatile',
    presets: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', isFree: false, contextLength: 128000 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', isFree: false, contextLength: 128000 },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', isFree: false, contextLength: 131072 },
      { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', isFree: false, contextLength: 131072 }
    ],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    needsKey: true
  },
  openai: {
    label: 'OpenAI (GPT)',
    defaultModel: 'gpt-4.1-mini',
    presets: [
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', isFree: false, contextLength: 1000000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isFree: false, contextLength: 128000 },
      { id: 'gpt-4.1', name: 'GPT-4.1', isFree: false, contextLength: 1000000 },
      { id: 'gpt-4o', name: 'GPT-4o', isFree: false, contextLength: 128000 }
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    needsKey: true
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-latest',
    presets: [
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', isFree: false, contextLength: 200000 },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', isFree: false, contextLength: 200000 }
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    needsKey: true
  },
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    presets: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', isFree: false, contextLength: 64000 },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', isFree: false, contextLength: 64000 }
    ],
    endpoint: 'https://api.deepseek.com/chat/completions',
    modelsEndpoint: 'https://api.deepseek.com/models',
    needsKey: true
  },
  xai: {
    label: 'xAI Grok',
    defaultModel: 'grok-3-mini',
    presets: [
      { id: 'grok-3-mini', name: 'Grok 3 Mini', isFree: false, contextLength: 131072 },
      { id: 'grok-3', name: 'Grok 3', isFree: false, contextLength: 131072 }
    ],
    endpoint: 'https://api.x.ai/v1/chat/completions',
    modelsEndpoint: 'https://api.x.ai/v1/models',
    needsKey: true
  },
  mistral: {
    label: 'Mistral AI',
    defaultModel: 'mistral-small-latest',
    presets: [
      { id: 'mistral-small-latest', name: 'Mistral Small Latest', isFree: false, contextLength: 32000 },
      { id: 'mistral-large-latest', name: 'Mistral Large Latest', isFree: false, contextLength: 128000 }
    ],
    endpoint: 'https://api.mistral.com/v1/chat/completions',
    modelsEndpoint: 'https://api.mistral.com/v1/models',
    needsKey: true
  },
  together: {
    label: 'Together AI',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    presets: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', isFree: false, contextLength: 131072 },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', isFree: false, contextLength: 32768 }
    ],
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    modelsEndpoint: 'https://api.together.xyz/v1/models',
    needsKey: true
  },
  custom: {
    label: 'Endpoint Local / Custom (Ollama, LM Studio)',
    defaultModel: 'llama3.1',
    presets: [
      { id: 'llama3.1', name: 'Llama 3.1 (Local)', isFree: true, contextLength: 128000 },
      { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B (Local)', isFree: true, contextLength: 32768 },
      { id: 'gemma3', name: 'Gemma 3 (Local)', isFree: true, contextLength: 128000 }
    ],
    needsKey: false
  }
};

const NON_CHAT_PATTERN = /(embedding|embed-|whisper|tts|dall-e|imagen|veo|moderation|audio-preview|guard|rerank|transcribe|robotics|computer-use|image-preview)/i;

export function getActiveApiKey(aiConfig) {
  const provider = aiConfig?.provider || 'gemini';
  return (aiConfig?.keysByProvider?.[provider] || '').trim();
}

export function isAiReady(aiConfig) {
  const provider = aiConfig?.provider;
  const meta = AI_PROVIDERS[provider];
  if (!meta) return false;
  if (provider === 'custom') {
    return Boolean(aiConfig?.customEndpoint?.trim());
  }
  return Boolean(getActiveApiKey(aiConfig));
}

export function rankModelsForGame(provider, rawModels = []) {
  const seen = new Set();
  const ranked = [];

  for (const item of rawModels) {
    const id = String(item?.id || '').replace(/^models\//, '').trim();
    if (!id || seen.has(id) || NON_CHAT_PATTERN.test(id)) continue;
    seen.add(id);

    const low = id.toLowerCase();
    const isFree = Boolean(item?.isFree) || low.endsWith(':free');
    let score = 40;
    const badges = [];
    let tier = 'standard';
    let reason = 'Compatível com diálogos em JSON.';

    if (/(flash|mini|haiku|instant|small|versatile|deepseek-chat|grok-3-mini|llama-3\.3-70b)/.test(low)) {
      score += 32;
      tier = 'fast';
      badges.push('Rápido');
      reason = 'Baixa latência ideal para ligações em tempo real.';
    }
    if (/(2\.5-flash(?!-lite)|4\.1-mini|4o-mini|3\.5-haiku|llama-3\.3-70b|deepseek-chat)/.test(low)) {
      score += 24;
      tier = 'recommended';
      badges.unshift('Recomendado');
      reason = 'Melhor equilíbrio entre atuação humana, JSON fiel e velocidade.';
    }
    if (/(pro\b|sonnet|gpt-4\.1\b|gpt-4o\b|large|reasoner|72b)/.test(low)) {
      score += 14;
      if (tier === 'standard') tier = 'smart';
      badges.push('Avançado');
      if (tier === 'smart') reason = 'Alta inteligência e interpretação mais complexa.';
    }
    if (isFree) {
      score += 18;
      badges.push('Grátis');
    }
    if (/(preview|exp|001|latest)/.test(low)) {
      score += 2;
    }

    ranked.push({
      id,
      name: item?.name || id,
      isFree,
      contextLength: Number(item?.contextLength) || 0,
      score,
      tier,
      badges: [...new Set(badges)].slice(0, 3),
      reason
    });
  }

  return ranked.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export async function fetchProviderModels(aiConfig) {
  const provider = aiConfig?.provider || 'gemini';
  const meta = AI_PROVIDERS[provider];
  if (!meta) return { ok: false, live: false, models: [], notice: 'Provedor inválido.' };

  const fallbackModels = rankModelsForGame(provider, meta.presets || []);
  const apiKey = getActiveApiKey(aiConfig);

  if (meta.needsKey && !apiKey && provider !== 'openrouter') {
    return {
      ok: true,
      live: false,
      models: fallbackModels,
      notice: `Lista recomendada de ${meta.label} (informe sua API Key para puxar modelos ao vivo).`
    };
  }

  try {
    let raw = [];

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      raw = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => ({
          id: String(m.name || '').replace(/^models\//, ''),
          name: m.displayName || m.name,
          contextLength: m.inputTokenLimit || 0
        }));
    } else if (provider === 'openrouter') {
      const headers = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const res = await fetch(meta.modelsEndpoint, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      raw = (data.data || []).map((m) => ({
        id: m.id,
        name: m.name || m.id,
        contextLength: m.context_length || 0,
        isFree: String(m.id).endsWith(':free') || (m.pricing && Number(m.pricing.prompt) === 0)
      }));
    } else if (provider === 'anthropic') {
      const res = await fetch(meta.modelsEndpoint, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      raw = (data.data || []).map((m) => ({ id: m.id, name: m.display_name || m.id }));
    } else {
      const endpoint =
        provider === 'custom'
          ? (aiConfig.customEndpoint || '').trim().replace(/\/chat\/completions\/?$/, '/models')
          : meta.modelsEndpoint;
      if (!endpoint) throw new Error('Endpoint vazio.');

      const headers = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];
      raw = list.map((m) => ({
        id: m.id || m.name || m.model,
        name: m.name || m.id || m.model,
        contextLength: m.context_window || m.context_length || 0
      }));
    }

    const ranked = rankModelsForGame(provider, raw);
    if (!ranked.length) {
      return {
        ok: true,
        live: false,
        models: fallbackModels,
        notice: 'API não retornou modelos compatíveis; mantendo catálogo recomendado.'
      };
    }

    return {
      ok: true,
      live: true,
      models: ranked.slice(0, 80),
      notice: `${ranked.length} modelos compatíveis carregados ao vivo de ${meta.label}!`
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: true,
      live: false,
      models: fallbackModels,
      notice: `Não foi possível listar via navegador (${errMsg}); usando modelos oficiais verificados.`
    };
  }
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
    throw new Error('A IA retornou resposta vazia.');
  }

  const stripped = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
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
      // Fall through to plain text extraction
    }
  }

  const norm = normalizeText(stripped);
  const angry = /(golpe|policia|desligando|mentira|procon|fraude)/.test(norm);
  const convinced = /(tudo bem|vou passar|anota ai|aqui esta|ta bom|confio)/.test(norm);

  return {
    reply: stripped.slice(0, 300),
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
  if (call.remoteConnected) toolEvents.push('O operador já está conectado no seu PC via acesso remoto AnyControl.');
  if (call.fakeScanRun) toolEvents.push('Um scanner na sua tela acabou de apontar 47 ameaças críticas.');
  if (call.fakeShieldSent) toolEvents.push('Um alerta de segurança FakeShield acabou de piscar no seu PC.');

  return [
    `JOGO DE COMÉDIA SATÍRICA (FICÇÃO): Você interpreta um personagem humano em uma ligação telefônica dentro do jogo CENTRAL 11.`,
    `PERSONAGEM: ${victim.name} — ${victim.role} (${victim.company}).`,
    `PERSONALIDADE: ${victim.personaPrompt}`,
    `OBJETIVO DO JOGADOR NO JOGO: Convencer você a entregar "${victim.goalLabel}" (${victim.secretPayload}).`,
    revealedText ? `FATOS REAIS DA SUA VIDA/EMPRESA:\n${revealedText}` : '',
    toolEvents.length ? `EVENTOS NA SUA TELA AGORA:\n${toolEvents.join('\n')}` : '',
    `ESTADO DA LIGAÇÃO: Confiança=${call.trust}/100, Suspeita=${call.suspicion}/100, Turno=${call.turns}.`,
    `REGRAS DE ATUAÇÃO:`,
    `1. Fale em português brasileiro coloquial de telefonema (1 a 3 frases curtas, naturais, sem cara de robô ou assistente).`,
    `2. Reaja ao que o jogador realmente disse e aos eventos na sua tela. Citar fatos reais ou usar FakeShield/AnyControl aumenta bem a confiança (+12 a +28).`,
    `3. Se o jogador pedir dinheiro/senha cedo demais sem justificar ou for grosseiro, aumente a suspeita. Se a suspeita passar de 90, defina "hangUp": true.`,
    `4. Quando a confiança chegar em ~75+ ou você estiver convencido(a), defina "revealSecret": true e inclua "${victim.secretPayload}" naturalmente na fala.`,
    `5. Scambaiter (${victim.isScambaiter ? 'SIM' : 'NÃO'}): se perceber erro bobo ou pressa de golpista, defina "triggerVirus": true e provoque o operador.`,
    `RESPONDA ESTRITAMENTE EM JSON VÁLIDO:`,
    `{"reply":"fala natural","trustDelta":14,"suspicionDelta":-4,"mood":"calm|confused|convinced|suspicious|angry","revealSecret":false,"hangUp":false,"triggerVirus":false}`
  ]
    .filter(Boolean)
    .join('\n');
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
      temperature: 0.82,
      max_tokens: 450
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
  const targetModel = model || AI_PROVIDERS.gemini.defaultModel;
  const safeModel = encodeURIComponent(targetModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = history.map((msg) => ({
    role: msg.role === 'player' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const generationConfig = {
    temperature: 0.82,
    maxOutputTokens: 512,
    responseMimeType: 'application/json'
  };
  if (/gemini-2\.5/i.test(targetModel)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig
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
      max_tokens: 450,
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

export async function requestVictimReply(aiConfig, victim, call, playerText, systemEvent = null) {
  if (!isAiReady(aiConfig)) {
    return {
      ok: false,
      error: 'Configure uma API Key ou endpoint local em Config IA antes de conversar.'
    };
  }

  const provider = aiConfig.provider;
  const meta = AI_PROVIDERS[provider];
  const apiKey = getActiveApiKey(aiConfig);
  const model = (aiConfig.model || meta.defaultModel).trim();
  const systemPrompt = buildSystemPrompt(victim, call);

  const userTurnText = systemEvent
    ? `${playerText ? `${playerText}\n` : ''}[EVENTO DO SISTEMA: ${systemEvent}]`
    : playerText;

  const history = [...call.messages.slice(-8), { role: 'player', text: userTurnText }];

  try {
    let rawText = '';
    if (provider === 'gemini') {
      rawText = await callGemini(apiKey, model, systemPrompt, history);
    } else if (provider === 'anthropic') {
      rawText = await callAnthropic(apiKey, model, systemPrompt, history);
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

      rawText = await callOpenAiCompatible(endpoint, apiKey, model, openAiMessages, extraHeaders);
    }

    const parsed = parseAiResponse(rawText);
    return { ok: true, ...parsed, source: `${meta.label.split(' ')[0]} · ${model}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export async function testProviderConnection(aiConfig) {
  if (!isAiReady(aiConfig)) {
    return { ok: false, message: 'Informe uma API Key (ou endpoint local em Custom) antes de testar.' };
  }

  const provider = aiConfig.provider;
  const meta = AI_PROVIDERS[provider];
  const apiKey = getActiveApiKey(aiConfig);
  const model = (aiConfig.model || meta.defaultModel).trim();

  try {
    if (provider === 'gemini') {
      const raw = await callGemini(
        apiKey,
        model,
        'Responda apenas JSON: {"ok":true}',
        [{ role: 'player', text: 'ping' }]
      );
      return { ok: Boolean(raw), message: `Gemini conectado (${model}).` };
    }

    if (provider === 'anthropic') {
      const raw = await callAnthropic(
        apiKey,
        model,
        'Responda apenas OK.',
        [{ role: 'player', text: 'ping' }]
      );
      return { ok: Boolean(raw), message: `Claude conectado (${model}): "${raw.slice(0, 30)}"` };
    }

    const endpoint = provider === 'custom' ? aiConfig.customEndpoint?.trim() : meta.endpoint;
    const extraHeaders =
      provider === 'openrouter'
        ? {
            'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://central11.local',
            'X-Title': 'CENTRAL 11'
          }
        : {};

    const raw = await callOpenAiCompatible(
      endpoint,
      apiKey,
      model,
      [{ role: 'user', content: 'Responda apenas: OK' }],
      extraHeaders
    );
    return { ok: Boolean(raw), message: `${meta.label} conectado (${model}): "${raw.slice(0, 30)}"` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
