import { CentralGame } from './engine/game.js';
import { OperatorCamRenderer, TraceGlobeRenderer } from './engine/sprites.js';
import { AppRenderer } from './ui/apps.js';
import { WindowManager } from './ui/windows.js';

function bootstrap() {
  const game = new CentralGame();
  const workspaceEl = document.getElementById('desktop-workspace');
  const taskbarTabsEl = document.getElementById('taskbar-tabs');

  const winMgr = new WindowManager(workspaceEl, taskbarTabsEl);
  winMgr.registerWindows();

  const apps = new AppRenderer(game, winMgr);

  const opCanvas = document.getElementById('operator-cam-canvas');
  const opRenderer = new OperatorCamRenderer(opCanvas);
  let globeRenderer = null;

  document.getElementById('desktop-icons')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-open-win]');
    if (!btn) return;
    winMgr.openOrFocus(btn.dataset.openWin);
  });

  document.getElementById('start-btn')?.addEventListener('click', () => {
    document.getElementById('start-menu')?.classList.toggle('is-hidden');
  });

  document.getElementById('start-menu')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-open-win]');
    if (!btn) return;
    winMgr.openOrFocus(btn.dataset.openWin);
    document.getElementById('start-menu')?.classList.add('is-hidden');
  });

  // Refresh browser neural voices list when voices finish loading asynchronously
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      apps.configUi.render();
    };
  }

  const bootSplash = document.getElementById('boot-splash');
  document.getElementById('boot-skip-btn')?.addEventListener('click', () => {
    bootSplash?.classList.add('is-hidden');
  });
  setTimeout(() => {
    bootSplash?.classList.add('is-hidden');
  }, 1000);

  game.subscribe((_, eventType) => {
    apps.renderAll(eventType);
  });

  apps.renderAll('update');
  game.startLoop();

  let lastFrame = 0;
  function animateCanvases(ts) {
    if (ts - lastFrame >= 50) {
      lastFrame = ts;
      opRenderer.setMode(game.operatorMode);
      opRenderer.render(game.state);

      const traceCanvas = document.getElementById('trace-globe-canvas');
      if (traceCanvas) {
        if (!globeRenderer || globeRenderer.canvas !== traceCanvas) {
          globeRenderer = new TraceGlobeRenderer(traceCanvas);
        }
        const call = game.state.activeCall;
        globeRenderer.render(call?.traceProgress || 0, Boolean(call?.isTracing));
      }
    }
    requestAnimationFrame(animateCanvases);
  }
  requestAnimationFrame(animateCanvases);

  const isLocalHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  if ('serviceWorker' in navigator) {
    if (isLocalHost) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } else if (location.protocol.startsWith('https')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
