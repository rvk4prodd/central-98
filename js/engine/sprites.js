function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export class OperatorCamRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.mode = 'idle'; // 'idle' | 'typing' | 'talking' | 'sweating' | 'celebrating' | 'panicking'
    this.tick = 0;
    this.particles = [];
  }

  setMode(mode) {
    if (this.mode !== mode && mode === 'celebrating') {
      for (let i = 0; i < 8; i += 1) {
        this.particles.push({
          x: 12 + Math.random() * 40,
          y: 44 + Math.random() * 10,
          vy: -0.4 - Math.random() * 0.5,
          life: 45 + Math.random() * 25,
          kind: 'cash'
        });
      }
    }
    this.mode = mode;
  }

  render(state) {
    const ctx = this.ctx;
    this.tick += 1;

    const alarm = this.mode === 'panicking' || state.pc.activeViruses.length > 0;
    const hot = state.pc.cpuTemp >= 78;

    // Office wall background
    px(ctx, 0, 0, 64, 64, alarm && (this.tick % 16 < 8) ? '#3a1414' : '#263038');
    // Wall poster ("META")
    px(ctx, 4, 5, 16, 18, '#dcd6c4');
    px(ctx, 5, 6, 14, 4, '#0b3d91');
    px(ctx, 6, 12, 12, 2, '#b91c1c');
    px(ctx, 6, 16, 9, 2, '#333333');

    // Window / blinds with neon glow
    px(ctx, 44, 4, 16, 16, '#14232e');
    for (let by = 6; by < 19; by += 3) {
      px(ctx, 45, by, 14, 1, '#3d515e');
    }

    // Desk
    px(ctx, 0, 48, 64, 16, '#5c4028');
    px(ctx, 0, 48, 64, 2, '#7d5a3c');

    // Character body (hoodie)
    const bob = this.mode === 'talking' || this.mode === 'celebrating' ? (this.tick % 12 < 6 ? -1 : 0) : 0;
    px(ctx, 20, 32 + bob, 24, 18, '#2d4b73');
    px(ctx, 24, 34 + bob, 16, 14, '#3a6091');

    // Neck & Head
    px(ctx, 29, 28 + bob, 6, 5, '#e0ac84');
    px(ctx, 23, 13 + bob, 18, 16, '#f0be96');
    // Hair
    px(ctx, 22, 11 + bob, 20, 5, '#251d1a');
    px(ctx, 22, 14 + bob, 3, 6, '#251d1a');
    px(ctx, 39, 14 + bob, 3, 6, '#251d1a');

    // Headset band + mic boom
    px(ctx, 21, 12 + bob, 22, 2, '#18181b');
    px(ctx, 20, 15 + bob, 3, 8, '#3f3f46');
    px(ctx, 41, 15 + bob, 3, 8, '#3f3f46');
    px(ctx, 21, 18 + bob, 2, 2, alarm ? '#ef4444' : '#22c55e');
    px(ctx, 22, 22 + bob, 8, 2, '#18181b');

    // Eyes (blink every ~70 frames)
    const blink = this.tick % 75 > 70;
    if (blink) {
      px(ctx, 26, 20 + bob, 3, 1, '#1c1917');
      px(ctx, 35, 20 + bob, 3, 1, '#1c1917');
    } else {
      px(ctx, 26, 19 + bob, 3, 3, '#1c1917');
      px(ctx, 35, 19 + bob, 3, 3, '#1c1917');
      px(ctx, 27, 19 + bob, 1, 1, '#ffffff');
      px(ctx, 36, 19 + bob, 1, 1, '#ffffff');
    }

    // Mouth animation
    if (this.mode === 'talking' && this.tick % 10 < 5) {
      px(ctx, 29, 24 + bob, 6, 3, '#4a1818');
      px(ctx, 30, 25 + bob, 4, 1, '#f4a29e');
    } else if (this.mode === 'celebrating') {
      px(ctx, 28, 24 + bob, 8, 2, '#ffffff');
    } else if (alarm || this.mode === 'sweating') {
      px(ctx, 29, 25 + bob, 6, 2, '#3b1c1c');
    } else {
      px(ctx, 30, 25 + bob, 5, 1, '#7c4836');
    }

    // Sweat drop if stressed or PC overheating
    if (this.mode === 'sweating' || hot || alarm) {
      const sy = 15 + ((this.tick >> 2) % 6);
      px(ctx, 40, sy, 2, 3, '#38bdf8');
    }

    // Coffee mug on left desk
    px(ctx, 6, 43, 6, 6, '#e5e5e5');
    px(ctx, 12, 44, 2, 3, '#e5e5e5');
    if (this.tick % 30 < 15) {
      px(ctx, 8, 40, 1, 2, '#cbd5e1');
      px(ctx, 10, 39, 1, 2, '#cbd5e1');
    } else {
      px(ctx, 9, 39, 1, 2, '#cbd5e1');
    }

    // Hands typing / waving
    const handOffset = this.mode === 'typing' ? (this.tick % 8 < 4 ? -1 : 1) : 0;
    if (this.mode === 'celebrating') {
      px(ctx, 16, 27 + bob, 4, 8, '#f0be96');
      px(ctx, 44, 27 + bob, 4, 8, '#f0be96');
    } else {
      px(ctx, 22, 47 + handOffset, 5, 3, '#f0be96');
      px(ctx, 37, 47 - handOffset, 5, 3, '#f0be96');
    }

    // CRT glow foreground bar (keyboard / monitor rim)
    px(ctx, 18, 52, 28, 4, '#1e293b');
    px(ctx, 20, 53, 24, 2, alarm ? '#ef4444' : '#38bdf8');

    // Cash particles when celebrating
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.y += p.vy;
      p.life -= 1;
      px(ctx, p.x, p.y, 4, 3, '#22c55e');
      px(ctx, p.x + 1, p.y + 1, 2, 1, '#dcfce7');
    }
  }
}

export function drawVictimPortrait(canvas, victim, mood = 'calm', isSpeaking = false) {
  if (!canvas || !victim) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const p = victim.portrait;

  // Backdrop
  px(ctx, 0, 0, 32, 32, victim.isScambaiter ? '#2c1c28' : '#182b3a');
  px(ctx, 1, 1, 30, 30, victim.isScambaiter ? '#3d2536' : '#20384b');

  // Shoulders
  px(ctx, 6, 22, 20, 10, p.shirt);
  px(ctx, 13, 19, 6, 4, p.skin);

  // Head
  px(ctx, 9, 7, 14, 13, p.skin);

  // Hair styles
  if (p.hairStyle === 'bun') {
    px(ctx, 12, 3, 8, 4, p.hair);
    px(ctx, 8, 6, 16, 4, p.hair);
  } else if (p.hairStyle === 'long') {
    px(ctx, 7, 6, 18, 5, p.hair);
    px(ctx, 7, 10, 3, 12, p.hair);
    px(ctx, 22, 10, 3, 12, p.hair);
  } else if (p.hairStyle === 'bob') {
    px(ctx, 8, 5, 16, 5, p.hair);
    px(ctx, 7, 9, 3, 8, p.hair);
    px(ctx, 22, 9, 3, 8, p.hair);
  } else if (p.hairStyle === 'messy') {
    px(ctx, 8, 5, 16, 4, p.hair);
    px(ctx, 10, 4, 4, 2, p.hair);
    px(ctx, 17, 4, 5, 2, p.hair);
  } else {
    px(ctx, 8, 6, 16, 4, p.hair);
  }

  // Eyes & eyebrows based on mood
  const browColor = '#1c1917';
  if (mood === 'angry' || mood === 'suspicious') {
    px(ctx, 11, 11, 3, 1, browColor);
    px(ctx, 18, 11, 3, 1, browColor);
  } else {
    px(ctx, 11, 10, 3, 1, browColor);
    px(ctx, 18, 10, 3, 1, browColor);
  }

  px(ctx, 11, 12, 3, 3, '#111827');
  px(ctx, 18, 12, 3, 3, '#111827');
  px(ctx, 12, 12, 1, 1, '#ffffff');
  px(ctx, 19, 12, 1, 1, '#ffffff');

  if (p.glasses) {
    px(ctx, 10, 11, 5, 5, 'rgba(20, 20, 25, 0.25)');
    px(ctx, 17, 11, 5, 5, 'rgba(20, 20, 25, 0.25)');
    px(ctx, 15, 13, 2, 1, '#111827');
  }

  // Mouth
  if (isSpeaking) {
    px(ctx, 13, 17, 6, 2, '#5c1919');
  } else if (mood === 'convinced') {
    px(ctx, 13, 17, 6, 1, '#3b1c1c');
    px(ctx, 12, 16, 1, 1, '#3b1c1c');
    px(ctx, 19, 16, 1, 1, '#3b1c1c');
  } else if (mood === 'angry') {
    px(ctx, 13, 18, 6, 1, '#4c1111');
  } else {
    px(ctx, 14, 17, 4, 1, '#5a2d24');
  }
}

export function drawBossPortrait(canvas, angry = true) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  px(ctx, 0, 0, 32, 32, angry ? '#3f1111' : '#1b2e1e');
  px(ctx, 5, 22, 22, 10, '#27272a');
  px(ctx, 14, 22, 4, 10, '#dc2626'); // red tie
  px(ctx, 9, 7, 14, 15, angry ? '#e69882' : '#ddb090');
  // Mustache & bald top with side hair
  px(ctx, 8, 9, 2, 6, '#1f1d1b');
  px(ctx, 22, 9, 2, 6, '#1f1d1b');
  px(ctx, 12, 16, 8, 2, '#1f1d1b');

  // Angry eyebrows
  px(ctx, 10, 11, 4, 1, '#111111');
  px(ctx, 18, 11, 4, 1, '#111111');
  px(ctx, 11, 12, 3, 2, '#111111');
  px(ctx, 18, 12, 3, 2, '#111111');

  px(ctx, 12, 18, 8, angry ? 3 : 1, angry ? '#450a0a' : '#27272a');
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
    const r = Math.min(w, h) * 0.38;

    ctx.fillStyle = '#07140d';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (isTracing) {
      this.angle += 0.05;
    } else {
      this.angle += 0.008;
    }

    // Globe circle + latitude/longitude ellipses
    ctx.strokeStyle = isTracing ? '#4ade80' : '#16a34a';
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

    // Target lock reticle
    const lockX = cx + Math.cos(this.angle * 1.4) * (r * 0.45 * (1 - progress / 120));
    const lockY = cy + Math.sin(this.angle * 1.1) * (r * 0.35 * (1 - progress / 120));
    ctx.strokeStyle = progress >= 100 ? '#facc15' : '#ef4444';
    ctx.beginPath();
    ctx.arc(lockX, lockY, 6, 0, Math.PI * 2);
    ctx.moveTo(lockX - 10, lockY);
    ctx.lineTo(lockX + 10, lockY);
    ctx.moveTo(lockX, lockY - 10);
    ctx.lineTo(lockX, lockY + 10);
    ctx.stroke();
  }
}
