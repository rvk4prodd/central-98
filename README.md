# CENTRAL 98

Simulador 2D satírico de call center em estilo **Windows 98 / CRT**, inspirado em *Scam With Your Friends*, com personagem animado em `Canvas2D` pixel art no canto da tela, sistema de voz, manutenção de PC e suporte a IA local ou BYOK (API Key salva apenas no `localStorage` do navegador).

## Recursos

- **Fone98:** Ligações com alvos e empresas em PT-BR (incluindo Scambaiters que atacam seu PC), medidores de Confiança/Suspeita/Paciência, entrada por texto ou microfone (`SpeechRecognition`) e voz sintetizada (`speechSynthesis` local ou OpenAI TTS opcional).
- **GeoTrace:** Radar/globo wireframe 2D que rastreia fatos ocultos da vítima para usar na conversa.
- **Scamazon:** Resgate de códigos/senhas/PIX extraídos e loja de upgrades (Cooler, Headset, Fibra Pirata, Avastão 98, Planilha VIP, Cafeteira).
- **PC Doctor:** Telemetria de temperatura/poeira/saúde, limpeza de cooler, troca de capacitor, cabo solto, remoção de pop-ups de vírus e recuperação de Tela Azul (BSOD).
- **Config IA (100% Local):** Funciona offline com motor contextual próprio ou conectado via API Key local (OpenRouter, Gemini, Groq, OpenAI ou endpoint local como Ollama).
- **PWA Mobile:** Instalável na tela inicial do celular via navegador (Android/iOS).

## Rodar localmente

```powershell
python -m http.server 4188 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4188/` no navegador.

## Testes

```powershell
node --test tests/game.test.mjs
```
