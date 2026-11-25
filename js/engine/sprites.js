function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export class OperatorCamRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.mode = 'idle';
    this.tick = 0;
    this.particles = [];
  }

  setMode(mode) {
    if (this.mode !== mode && mode === 'celebrating') {
      for (let i = 0; i < 10; i += 1) {
        this.particles.push({
          x: 24 + Math.random() * 80,
          y: 88 + Math.random() * 20,
          vy: -0.9 - Math.random() * 0.9,
          life: 48 + Math.random() * 22
        });
      }
    }
    this.mode = mode;
  }

  render(state) {
    const ctx = this.ctx;
    this.tick += 1;
    const look = state.operatorLook || {};
    const skin = look.skin || '#f0be96';
    const hair = look.hair || '#251d1a';
    const hoodie = look.hoodie || '#2563eb';
    const led = look.headsetLed || '#22c55e';
    const hairStyle = look.hairStyle || 'short';
    const glasses = Boolean(look.glasses);

    const raid = Boolean(state.policeRaid);
    const alarm = this.mode === 'panicking' || state.pc.activeViruses.length > 0 || raid;
    const hot = state.pc.cpuTemp >= 78;

    // Office room backdrop with Win11 blue/night lighting or police siren flash
    if (raid) {
      px(ctx, 0, 0, 128, 128, this.tick % 14 < 7 ? '#1e1b4b' : '#450a0a');
    } else if (alarm) {
      px(ctx, 0, 0, 128, 128, this.tick % 16 < 8 ? '#3b1116' : '#1b1d28');
    } else {
      px(ctx, 0, 0, 128, 128, '#162032');
    }

    // Back wall acoustic panels + LED strip
    px(ctx, 6, 10, 34, 40, '#1e293b');
    px(ctx, 8, 12, 30, 36, '#0f172a');
    px(ctx, 10, 16, 26, 4, '#38bdf8');
    px(ctx, 10, 24, 18, 3, '#94a3b8');
    px(ctx, 10, 30, 22, 3, '#22c55e');

    // Window blinds on right
    px(ctx, 86, 8, 34, 34, '#0b1322');
    for (let by = 12; by < 40; by += 5) {
      px(ctx, 88, by, 30, 2, raid ? (this.tick % 14 < 7 ? '#3b82f6' : '#ef4444') : '#334155');
    }

    // Desk surface
    px(ctx, 0, 96, 128, 32, '#1f2937');
    px(ctx, 0, 96, 128, 3, '#334155');

    // Character hoodie & shoulders
    const bob = this.mode === 'talking' || this.mode === 'celebrating' ? (this.tick % 12 < 6 ? -2 : 0) : 0;
    px(ctx, 38, 64 + bob, 52, 34, hoodie);
    px(ctx, 48, 66 + bob, 32, 30, 'rgba(255,255,255,0.08)');
    px(ctx, 56, 56 + bob, 16, 10, skin);

    // Head
    px(ctx, 44, 26 + bob, 40, 32, skin);

    // Hair styles
    if (hairStyle === 'spiky') {
      px(ctx, 42, 20 + bob, 44, 10, hair);
      px(ctx, 46, 14 + bob, 8, 8, hair);
      px(ctx, 58, 12 + bob, 10, 10, hair);
      px(ctx, 72, 16 + bob, 8, 8, hair);
    } else if (hairStyle === 'bob') {
      px(ctx, 42, 20 + bob, 44, 11, hair);
      px(ctx, 40, 28 + bob, 6, 26, hair);
      px(ctx, 82, 28 + bob, 6, 26, hair);
    } else {
      px(ctx, 42, 21 + bob, 44, 10, hair);
      px(ctx, 42, 28 + bob, 6, 12, hair);
      px(ctx, 80, 28 + bob, 6, 12, hair);
    }

    // Gaming headset + RGB LED + boom mic
    px(ctx, 40, 20 + bob, 48, 4, '#0f172a');
    px(ctx, 38, 30 + bob, 7, 16, '#1e293b');
    px(ctx, 83, 30 + bob, 7, 16, '#1e293b');
    px(ctx, 40, 34 + bob, 3, 8, alarm ? '#ef4444' : led);
    px(ctx, 85, 34 + bob, 3, 8, alarm ? '#ef4444' : led);
    px(ctx, 42, 46 + bob, 18, 3, '#0f172a');
    px(ctx, 58, 46 + bob, 4, 4, '#38bdf8');

    // Eyes
    const blink = this.tick % 80 > 75;
    if (blink) {
      px(ctx, 51, 40 + bob, 6, 2, '#111827');
      px(ctx, 71, 40 + bob, 6, 2, '#111827');
    } else {
      px(ctx, 51, 38 + bob, 6, 6, '#0f172a');
      px(ctx, 71, 38 + bob, 6, 6, '#0f172a');
      px(ctx, 53, 39 + bob, 2, 2, '#ffffff');
      px(ctx, 73, 39 + bob, 2, 2, '#ffffff');
    }

    if (glasses) {
      px(ctx, 49, 36 + bob, 10, 10, 'rgba(56, 189, 248, 0.22)');
      px(ctx, 69, 36 + bob, 10, 10, 'rgba(56, 189, 248, 0.22)');
      px(ctx, 59, 40 + bob, 10, 2, '#1e293b');
    }

    // Mouth
    if (this.mode === 'talking' && this.tick % 10 < 5) {
      px(ctx, 58, 49 + bob, 12, 5, '#4c1d1d');
      px(ctx, 60, 51 + bob, 8, 2, '#fda4af');
    } else if (this.mode === 'celebrating') {
      px(ctx, 56, 48 + bob, 16, 4, '#ffffff');
    } else if (alarm || this.mode === 'sweating') {
      px(ctx, 58, 50 + bob, 12, 4, '#3f1d1d');
    } else {
      px(ctx, 60, 50 + bob, 10, 2, '#7c4836');
    }

    // Stress sweat drop
    if (this.mode === 'sweating' || hot || alarm) {
      const sy = 30 + ((this.tick >> 1) % 12);
      px(ctx, 80, sy, 4, 6, '#38bdf8');
    }

    // Coffee mug with steam
    px(ctx, 10, 84, 14, 14, '#e2e8f0');
    px(ctx, 24, 87, 4, 7, '#e2e8f0');
    if (this.tick % 28 < 14) {
      px(ctx, 14, 76, 2, 5, 'rgba(226, 232, 240, 0.7)');
      px(ctx, 19, 74, 2, 6, 'rgba(226, 232, 240, 0.7)');
    } else {
      px(ctx, 16, 74, 2, 6, 'rgba(226, 232, 240, 0.7)');
    }

    // Hands & keyboard RGB glow
    const handOffset = this.mode === 'typing' ? (this.tick % 8 < 4 ? -2 : 2) : 0;
    if (this.mode === 'celebrating') {
      px(ctx, 28, 52 + bob, 9, 16, skin);
      px(ctx, 91, 52 + bob, 9, 16, skin);
    } else {
      px(ctx, 42, 93 + handOffset, 10, 6, skin);
      px(ctx, 76, 93 - handOffset, 10, 6, skin);
    }

    px(ctx, 34, 105, 60, 8, '#0f172a');
    px(ctx, 38, 107, 52, 4, alarm ? '#ef4444' : '#38bdf8');

    // Floating cash bills
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.y += p.vy;
      p.life -= 1;
      px(ctx, p.x, p.y, 8, 5, '#22c55e');
      px(ctx, p.x + 2, p.y + 1, 4, 3, '#dcfce7');
    }
  }
}

export function drawVictimPortrait(canvas, victim, mood = 'calm', isSpeaking = false) {
  if (!canvas || !victim) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const p = victim.portrait;

  px(ctx, 0, 0, 48, 48, victim.isScambaiter ? '#3b182c' : '#102542');
  px(ctx, 2, 2, 44, 44, victim.isScambaiter ? '#4c1d38' : '#17365e');

  px(ctx, 9, 33, 30, 15, p.shirt);
  px(ctx, 19, 28, 10, 6, p.skin);
  px(ctx, 13, 10, 22, 20, p.skin);

  if (p.hairStyle === 'bun') {
    px(ctx, 18, 4, 12, 6, p.hair);
    px(ctx, 12, 9, 24, 6, p.hair);
  } else if (p.hairStyle === 'long') {
    px(ctx, 10, 9, 28, 7, p.hair);
    px(ctx, 10, 15, 5, 18, p.hair);
    px(ctx, 33, 15, 5, 18, p.hair);
  } else if (p.hairStyle === 'bob') {
    px(ctx, 12, 7, 24, 7, p.hair);
    px(ctx, 10, 14, 5, 12, p.hair);
    px(ctx, 33, 14, 5, 12, p.hair);
  } else if (p.hairStyle === 'messy') {
    px(ctx, 12, 7, 24, 6, p.hair);
    px(ctx, 15, 5, 6, 3, p.hair);
    px(ctx, 26, 5, 7, 3, p.hair);
  } else {
    px(ctx, 12, 9, 24, 6, p.hair);
  }

  const browColor = '#1c1917';
  if (mood === 'angry' || mood === 'suspicious') {
    px(ctx, 16, 16, 5, 2, browColor);
    px(ctx, 27, 16, 5, 2, browColor);
  } else {
    px(ctx, 16, 15, 5, 1, browColor);
    px(ctx, 27, 15, 5, 1, browColor);
  }

  px(ctx, 17, 18, 4, 4, '#111827');
  px(ctx, 27, 18, 4, 4, '#111827');
  px(ctx, 18, 18, 2, 2, '#ffffff');
  px(ctx, 28, 18, 2, 2, '#ffffff');

  if (p.glasses) {
    px(ctx, 15, 17, 8, 7, 'rgba(15, 23, 42, 0.28)');
    px(ctx, 25, 17, 8, 7, 'rgba(15, 23, 42, 0.28)');
    px(ctx, 23, 19, 2, 2, '#111827');
  }

  if (isSpeaking) {
    px(ctx, 19, 25, 10, 3, '#5c1919');
  } else if (mood === 'convinced') {
    px(ctx, 19, 25, 10, 2, '#3b1c1c');
    px(ctx, 18, 24, 2, 1, '#3b1c1c');
    px(ctx, 28, 24, 2, 1, '#3b1c1c');
  } else if (mood === 'angry') {
    px(ctx, 19, 26, 10, 2, '#4c1111');
  } else {
    px(ctx, 21, 25, 6, 2, '#5a2d24');
  }
}

export function drawBossPortrait(canvas, angry = true) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  px(ctx, 0, 0, 48, 48, angry ? '#450a0a' : '#143322');
  px(ctx, 8, 33, 32, 15, '#18181b');
  px(ctx, 21, 33, 6, 15, '#dc2626');
  px(ctx, 13, 10, 22, 23, angry ? '#e69882' : '#ddb090');
  px(ctx, 11, 14, 3, 9, '#1f1d1b');
  px(ctx, 34, 14, 3, 9, '#1f1d1b');
  px(ctx, 18, 24, 12, 3, '#1f1d1b');

  px(ctx, 15, 16, 6, 2, '#111111');
  px(ctx, 27, 16, 6, 2, '#111111');
  px(ctx, 17, 18, 4, 3, '#111111');
  px(ctx, 27, 18, 4, 3, '#111111');

  px(ctx, 18, 28, 12, angry ? 4 : 2, angry ? '#450a0a' : '#27272a');
}

export class TraceGlobeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.angle = 0;
  }

  render(progress = 0, isTracing = false) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.39;

    ctx.fillStyle = '#07111e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(76, 194, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    this.angle += isTracing ? 0.05 : 0.009;

    ctx.strokeStyle = isTracing ? '#4cc2ff' : '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = -2; i <= 2; i += 1) {
      const latY = cy + (i * r) / 3;
      const halfW = Math.sqrt(Math.max(0, r * r - ((i * r) / 3) ** 2));
      ctx.beginPath();
      ctx.moveTo(cx - halfW, latY);
      ctx.lineTo(cx + halfW, latY);
      ctx.stroke();
    }

    for (let j = 0; j < 3; j += 1) {
      const rx = Math.abs(Math.cos(this.angle + (j * Math.PI) / 3)) * r;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(2, rx), r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const lockX = cx + Math.cos(this.angle * 1.4) * (r * 0.45 * (1 - progress / 120));
    const lockY = cy + Math.sin(this.angle * 1.1) * (r * 0.35 * (1 - progress / 120));
    ctx.strokeStyle = progress >= 100 ? '#22c55e' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(lockX, lockY, 6, 0, Math.PI * 2);
    ctx.moveTo(lockX - 10, lockY);
    ctx.lineTo(lockX + 10, lockY);
    ctx.moveTo(lockX, lockY - 10);
    ctx.lineTo(lockX, lockY + 10);
    ctx.stroke();
  }
}
