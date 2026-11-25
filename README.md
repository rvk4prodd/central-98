# CENTRAL 11

Simulador 2D satírico de call center golpista com visual **Windows 11 Fluent / Mica**, inspirado em *Scam With Your Friends*, com câmera animada do operador 2D no canto, acesso remoto simulado, ataques de Scambaiter, batidas policiais, suporte a **10+ APIs de IA** (100% no `localStorage`) e **vozes neurais** (ElevenLabs, OpenAI `gpt-4o-mini-tts`, TTS local e vozes naturais PT-BR do navegador).

## Funcionalidades

- **PhoneLink VoIP:** Discador com 9 alvos/empresas (incluindo Scambaiters) + **Criador de Alvos Customizados**, voz em PT-BR, entrada por texto ou microfone (`SpeechRecognition`) e soundboard.
- **AnyControl (Acesso Remoto):** Conecte no PC da vítima, ative a **Tela Preta** para ela não ver seus cliques, rode o **FakeScan** e abra arquivos secretos.
- **GeoTrace Pro:** Globo radar 2D que desbloqueia fatos da vítima em tempo real para usar na conversa.
- **FakeShield AV:** Dispare alertas falsos de vírus para pressionar o alvo.
- **Scamazon & CryptoVault:** Resgate Gift Cards, PIX bancário ou Crypto (com cotação dinâmica) e compre 8 upgrades de setup/escritório.
- **Batida Policial + Modo Excel:** Quando o calor policial sobe, ative a planilha contábil falsa antes da contagem zerar.
- **PC Doctor 11:** Limpe poeira do cooler, encaixe cabo SATA, troque capacitor, remova vírus e reinicie Tela Azul (BSOD).
- **Configurações (100% Local):** Cofre de chaves separado para OpenRouter, Gemini, Groq, OpenAI, Anthropic Claude, DeepSeek, xAI Grok, Mistral, Together AI e Ollama/LM Studio, além de customizador do personagem 2D e motor de voz neural com filtro telefônico.

## Rodar localmente

```powershell
python -m http.server 4189 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4189/` no navegador.

## Testes

```powershell
node --test tests/game.test.mjs
```
