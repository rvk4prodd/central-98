export class WindowManager {
  constructor(workspaceEl, taskbarTabsEl, onFocusChange) {
    this.workspaceEl = workspaceEl;
    this.taskbarTabsEl = taskbarTabsEl;
    this.onFocusChange = onFocusChange;
    this.topZ = 20;
    this.activeWindowId = 'win-phone';
    this.windows = new Map();
    this.initDragHandlers();
  }

  registerWindows() {
    const winEls = this.workspaceEl.querySelectorAll('.win11-window[data-app-id]');
    for (const el of winEls) {
      const id = el.id;
      this.windows.set(id, {
        id,
        appId: el.dataset.appId,
        title: el.dataset.title || id,
        el,
        minimized: el.classList.contains('is-minimized'),
        maximized: false
      });

      el.addEventListener('pointerdown', () => this.focusWindow(id));

      el.querySelector('[data-win-action="minimize"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMinimize(id);
      });

      el.querySelector('[data-win-action="maximize"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMaximize(id);
      });

      el.querySelector('[data-win-action="close"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMinimize(id);
      });
    }
    this.focusWindow(this.activeWindowId);
    this.renderTaskbar();
  }

  isMobileViewport() {
    return window.innerWidth <= 900;
  }

  focusWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (this.isMobileViewport()) {
      for (const item of this.windows.values()) {
        if (item.id === id) {
          item.minimized = false;
          item.el.classList.remove('is-minimized');
          item.el.classList.add('is-mobile-active');
        } else {
          item.el.classList.remove('is-mobile-active');
        }
      }
    } else {
      win.minimized = false;
      win.el.classList.remove('is-minimized');
    }

    this.topZ += 1;
    win.el.style.zIndex = String(this.topZ);
    this.activeWindowId = id;

    for (const item of this.windows.values()) {
      item.el.classList.toggle('is-active', item.id === id);
    }

    this.renderTaskbar();
    this.onFocusChange?.(id);
  }

  toggleMinimize(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (this.isMobileViewport()) {
      this.focusWindow(id);
      return;
    }

    win.minimized = !win.minimized;
    win.el.classList.toggle('is-minimized', win.minimized);
    if (!win.minimized) {
      this.focusWindow(id);
    } else {
      this.renderTaskbar();
    }
  }

  toggleMaximize(id) {
    if (this.isMobileViewport()) return;
    const win = this.windows.get(id);
    if (!win) return;
    win.maximized = !win.maximized;
    win.el.classList.toggle('is-maximized', win.maximized);
    this.focusWindow(id);
  }

  openOrFocus(id) {
    this.focusWindow(id);
  }

  renderTaskbar() {
    this.taskbarTabsEl.innerHTML = '';
    for (const win of this.windows.values()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'task11-tab';
      if (win.id === this.activeWindowId && !win.minimized) {
        btn.classList.add('is-active');
      }
      btn.dataset.targetWin = win.id;
      btn.textContent = win.title;
      btn.addEventListener('click', () => {
        if (this.isMobileViewport()) {
          this.focusWindow(win.id);
        } else if (win.id === this.activeWindowId && !win.minimized) {
          this.toggleMinimize(win.id);
        } else {
          this.focusWindow(win.id);
        }
      });
      this.taskbarTabsEl.appendChild(btn);
    }
  }

  initDragHandlers() {
    let dragging = null;

    this.workspaceEl.addEventListener('pointerdown', (e) => {
      if (this.isMobileViewport()) return;
      const titlebar = e.target.closest('.win11-titlebar');
      if (!titlebar || e.target.closest('button')) return;

      const winEl = titlebar.closest('.win11-window');
      if (!winEl || winEl.classList.contains('virus-popup') || winEl.classList.contains('is-maximized')) return;

      this.focusWindow(winEl.id);
      const rect = winEl.getBoundingClientRect();
      const parentRect = this.workspaceEl.getBoundingClientRect();
      dragging = {
        winEl,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        parentRect
      };
      titlebar.setPointerCapture?.(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const { winEl, offsetX, offsetY, parentRect } = dragging;
      const maxX = Math.max(0, parentRect.width - winEl.offsetWidth);
      const maxY = Math.max(0, parentRect.height - 46);
      const nextX = Math.max(0, Math.min(maxX, e.clientX - parentRect.left - offsetX));
      const nextY = Math.max(0, Math.min(maxY, e.clientY - parentRect.top - offsetY));
      winEl.style.left = `${Math.round(nextX)}px`;
      winEl.style.top = `${Math.round(nextY)}px`;
    });

    window.addEventListener('pointerup', () => {
      dragging = null;
    });

    window.addEventListener('resize', () => {
      this.focusWindow(this.activeWindowId);
    });
  }
}
