/**
 * Recipe Manager Card — main entry point.
 */
import { LitElement, html, css } from 'lit';
import { RecipeManagerAPI } from './services/api.js';

import './components/rm-recipe-grid.js';
import './components/rm-recipe-detail.js';
import './components/rm-add-recipe-dialog.js';
import './components/rm-meal-planner.js';
import './components/rm-settings-view.js';
import './components/rm-shopping-view.js';

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'rm_settings';
const LOCAL_SHOPPING_KEY = 'rm_shopping';
const RECENT_RECIPES_KEY = 'rm_recent_recipes';
const TIMERS_KEY = 'rm_timers';

const DEFAULT_SETTINGS = {
  theme:             'soft',
  darkMode:          'system',
  fontSize:          'medium',
  columns:           3,
  showFavourites:    true,
  showPlanner:       true,
  recentCount:       12,
  timerSound:        'beep',
  keepScreenOn:      false,
  keepScreenOnMins:  30,
  showUnitConversion: false,
};

// ---------------------------------------------------------------------------
// Themes — colours match Shopping List Manager exactly
// ---------------------------------------------------------------------------

const THEME_VARS = {
  // Adaptive (light/dark)
  soft: {
    light: {
      '--rm-bg-main':        '#fafbfc', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#424242',
      '--rm-text-secondary': '#757575', '--rm-text-muted':     '#9e9e9e',
      '--rm-accent':         '#9fa8da', '--rm-accent-soft':    'rgba(159,168,218,0.15)',
      '--rm-border':         '#e8eaf6', '--rm-shadow':         '0 2px 6px rgba(0,0,0,0.08)',
    },
    dark: {
      '--rm-bg-main':        '#14161a', '--rm-bg-surface':     '#1b1f25',
      '--rm-bg-elevated':    '#232833', '--rm-text':           '#e4e7ec',
      '--rm-text-secondary': '#a8b0bd', '--rm-text-muted':     '#7a8594',
      '--rm-accent':         '#9fa8da', '--rm-accent-soft':    'rgba(159,168,218,0.18)',
      '--rm-border':         '#2b313c', '--rm-shadow':         '0 2px 6px rgba(0,0,0,0.3)',
    },
  },

  // Light-only
  arctic: {
    light: {
      '--rm-bg-main':        '#f0f4f8', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#1a2332',
      '--rm-text-secondary': '#526070', '--rm-text-muted':     '#8097aa',
      '--rm-accent':         '#2979ff', '--rm-accent-soft':    'rgba(41,121,255,0.12)',
      '--rm-border':         '#dce6f0', '--rm-shadow':         '0 2px 6px rgba(26,35,50,0.1)',
    },
  },
  meadow: {
    light: {
      '--rm-bg-main':        '#f4f7f0', '--rm-bg-surface':     '#fefffe',
      '--rm-bg-elevated':    '#fefffe', '--rm-text':           '#2d3a2a',
      '--rm-text-secondary': '#6b7c64', '--rm-text-muted':     '#96a98e',
      '--rm-accent':         '#4caf50', '--rm-accent-soft':    'rgba(76,175,80,0.12)',
      '--rm-border':         '#dde8d8', '--rm-shadow':         '0 2px 6px rgba(45,58,42,0.1)',
    },
  },
  blossom: {
    light: {
      '--rm-bg-main':        '#fdf8fb', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#fff8fc', '--rm-text':           '#3d1f35',
      '--rm-text-secondary': '#8c5e79', '--rm-text-muted':     '#b48fa5',
      '--rm-accent':         '#c2668a', '--rm-accent-soft':    'rgba(194,102,138,0.12)',
      '--rm-border':         '#f0d6e8', '--rm-shadow':         '0 2px 6px rgba(61,31,53,0.1)',
    },
    dark: {
      '--rm-bg-main':        '#1a0d12', '--rm-bg-surface':     '#241420',
      '--rm-bg-elevated':    '#2e1a28', '--rm-text':           '#f8d0de',
      '--rm-text-secondary': '#c070a0', '--rm-text-muted':     '#603050',
      '--rm-accent':         '#f48fb1', '--rm-accent-soft':    'rgba(244,143,177,0.15)',
      '--rm-border':         'rgba(248,208,222,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  ocean: {
    light: {
      '--rm-bg-main':        '#f0f7ff', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#f9fbff', '--rm-text':           '#1a3a5f',
      '--rm-text-secondary': '#4a6b8c', '--rm-text-muted':     '#7a9bbd',
      '--rm-accent':         '#0077ff', '--rm-accent-soft':    'rgba(0,119,255,0.12)',
      '--rm-border':         '#d0e1f2', '--rm-shadow':         '0 2px 6px rgba(26,58,95,0.1)',
    },
  },

  // Dark-only
  midnight: {
    dark: {
      '--rm-bg-main':        '#0d1117', '--rm-bg-surface':     '#161b22',
      '--rm-bg-elevated':    '#1c2333', '--rm-text':           '#c9d1d9',
      '--rm-text-secondary': '#8b949e', '--rm-text-muted':     '#6e7681',
      '--rm-accent':         '#58a6ff', '--rm-accent-soft':    'rgba(88,166,255,0.15)',
      '--rm-border':         '#21262d', '--rm-shadow':         '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  ember: {
    dark: {
      '--rm-bg-main':        '#111111', '--rm-bg-surface':     '#1c1a17',
      '--rm-bg-elevated':    '#242018', '--rm-text':           '#f5f0e8',
      '--rm-text-secondary': '#a89880', '--rm-text-muted':     '#7a6a55',
      '--rm-accent':         '#f0a500', '--rm-accent-soft':    'rgba(240,165,0,0.15)',
      '--rm-border':         'rgba(245,240,232,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  neon: {
    dark: {
      '--rm-bg-main':        '#0a0b10', '--rm-bg-surface':     '#121420',
      '--rm-bg-elevated':    '#1a1d2e', '--rm-text':           '#e0e0f0',
      '--rm-text-secondary': '#a0a5c0', '--rm-text-muted':     '#6a6f8e',
      '--rm-accent':         '#bb86fc', '--rm-accent-soft':    'rgba(187,134,252,0.15)',
      '--rm-border':         '#2a2d45', '--rm-shadow':         '0 2px 8px rgba(0,0,0,0.6)',
    },
  },
};

const FONT_SIZE_MAP = { small: '13px', medium: '15px', large: '17px' };

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function loadRecentRecipes() {
  try {
    const raw = localStorage.getItem(RECENT_RECIPES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecentRecipes(ids) {
  try { localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Timer persistence
// ---------------------------------------------------------------------------

function loadTimers() {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    const now = Date.now();
    return saved
      .map(t => {
        // Adjust remaining time by elapsed wall-clock time since save
        const elapsed = t.savedAt ? Math.floor((now - t.savedAt) / 1000) : 0;
        const remaining = Math.max(0, (t.remaining ?? 0) - (t.running ? elapsed : 0));
        return { ...t, remaining, savedAt: undefined };
      })
      .filter(t => t.remaining > 0);
  } catch { return []; }
}

function saveTimers(timers) {
  try {
    const toSave = timers.map(t => ({ ...t, savedAt: Date.now() }));
    localStorage.setItem(TIMERS_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

function formatTimerDisplay(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Timer sound via Web Audio API
// ---------------------------------------------------------------------------

function playTimerSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const play = (freq, start, dur, vol = 0.6) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };

    if (type === 'beep') {
      play(880, 0, 0.15); play(880, 0.2, 0.15); play(880, 0.4, 0.15);
    } else if (type === 'ding') {
      play(1318, 0, 0.8, 0.5); play(1047, 0.1, 0.6, 0.3);
    } else if (type === 'alarm') {
      for (let i = 0; i < 5; i++) { play(880, i * 0.25, 0.12); play(660, i * 0.25 + 0.13, 0.1); }
    }
    // 'none' → no sound
  } catch { /* AudioContext not available */ }
}

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------

class RecipeManagerCard extends LitElement {
  static properties = {
    hass:                 { type: Object },
    _config:              { type: Object },
    _view:                { type: String },
    _recipes:             { type: Array },
    _tags:                { type: Array },
    _selectedRecipe:      { type: Object },
    _loading:             { type: Boolean },
    _error:               { type: String },
    _searchQuery:         { type: String },
    _activeTag:           { type: String },
    _shoppingLists:       { type: Array },
    _slmAvailable:        { type: Boolean },
    _localShoppingItems:  { type: Array },
    _settings:            { type: Object },
    _wide:                { type: Boolean },
    _sidebarCollapsed:    { type: Boolean },
    _gridScrollPos:       { type: Number },
    _recentRecipeIds:     { type: Array },
    _timers:              { type: Array },
    _timerAlarm:          { type: Object },
    _timersPrevView:      { type: String },
    _customTimerInput:    { type: String },
    _hdrStarHover:        { type: Number },
    _mobileMenuOpen:      { type: Boolean },
    _navDirection:        { type: String },
  };

  constructor() {
    super();
    this._view = 'grid';
    this._recipes = [];
    this._tags = [];
    this._selectedRecipe = null;
    this._loading = false;
    this._error = null;
    this._searchQuery = '';
    this._activeTag = null;
    this._shoppingLists = [];
    this._slmAvailable = false;
    this._localShoppingItems = [];
    this._settings = loadSettings();
    this._wide = false;
    this._sidebarCollapsed = false;
    this._gridScrollPos = 0;
    this._recentRecipeIds = loadRecentRecipes();
    this._timers = loadTimers();
    this._timerAlarm = null;
    this._timersPrevView = null;
    this._customTimerInput = '';
    this._hdrStarHover = 0;
    this._mobileMenuOpen = false;
    this._navDirection = 'forward';
    this._alarmLoopActive = false;
    this._alarmInterval = null;
    this._alarmTimeout = null;
    this._alarmAudio = null;
    this._unsubscribe = null;
    this._darkModeQuery = null;
    this._resizeObserver = null;
    this._timerTick = null;
  }

  setConfig(config) { this._config = config; }
  static getConfigElement() { return document.createElement('recipe-manager-card-editor'); }
  static getStubConfig() { return {}; }
  getCardSize() { return 6; }

  connectedCallback() {
    super.connectedCallback();
    this._darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._darkModeQuery.addEventListener('change', this._onSystemDark);
    this._applyTheme();
    this._resizeObserver = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width ?? 0;
      this._wide = w >= 620;
    });
    this._resizeObserver.observe(this);
    this._timerTick = setInterval(() => this._tickTimers(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    this._darkModeQuery?.removeEventListener('change', this._onSystemDark);
    this._resizeObserver?.disconnect();
    if (this._timerTick) { clearInterval(this._timerTick); this._timerTick = null; }
    saveTimers(this._timers);
  }

  _onSystemDark = () => {
    if (this._settings.darkMode === 'system') this._applyTheme();
  };

  updated(changedProps) {
    if (changedProps.has('hass') && this.hass && !this._api) {
      this._api = new RecipeManagerAPI(this.hass);
      this._init();
    }
    if (changedProps.has('hass') && this._api) this._api.hass = this.hass;
    if (changedProps.has('_settings')) this._applyTheme();
  }

  _applyTheme() {
    const s = this._settings;
    const themeVars = THEME_VARS[s.theme] ?? THEME_VARS.soft;
    const alwaysDark = !themeVars.light;
    const alwaysLight = !themeVars.dark;
    let isDark = alwaysDark;
    if (!alwaysDark && !alwaysLight) {
      if (s.darkMode === 'on') isDark = true;
      else if (s.darkMode === 'off') isDark = false;
      else isDark = this._darkModeQuery?.matches ?? false;
    } else if (alwaysLight) {
      isDark = false;
    }
    const vars = isDark ? (themeVars.dark ?? themeVars.light) : (themeVars.light ?? themeVars.dark);
    for (const [k, v] of Object.entries(vars)) this.style.setProperty(k, v);
    this.style.setProperty('--rm-font-size-base', FONT_SIZE_MAP[s.fontSize] ?? '15px');
    this.style.setProperty('--rm-grid-columns', `repeat(${s.columns ?? 3}, minmax(0, 1fr))`);
  }

  // -- Data -----------------------------------------------------------------

  async _init() {
    this._loading = true;
    this._loadLocalShopping();
    try {
      await Promise.all([this._loadRecipes(), this._loadTags(), this._loadShoppingLists()]);
      await this._subscribe();
    } catch (e) {
      this._error = e.message || 'Failed to load recipes';
    } finally { this._loading = false; }
  }

  _loadLocalShopping() {
    try {
      const raw = localStorage.getItem(LOCAL_SHOPPING_KEY);
      this._localShoppingItems = raw ? JSON.parse(raw) : [];
    } catch { this._localShoppingItems = []; }
  }

  _saveLocalShopping() {
    try { localStorage.setItem(LOCAL_SHOPPING_KEY, JSON.stringify(this._localShoppingItems)); }
    catch { /* ignore */ }
  }

  async _loadRecipes() {
    const r = await this._api.getAllRecipes();
    this._recipes = r?.recipes ?? [];
  }

  async _loadTags() {
    const r = await this._api.getTags();
    this._tags = r?.tags ?? [];
  }

  async _loadShoppingLists() {
    try {
      this._shoppingLists = (await this._api.getShoppingLists())?.lists ?? [];
      this._slmAvailable = true;
    } catch {
      this._shoppingLists = [];
      this._slmAvailable = false;
    }
  }

  async _subscribe() {
    if (this._unsubscribe) return;
    try {
      this._unsubscribe = await this._api.subscribe(msg => {
        const t = msg.event_type ?? msg.event;
        if (/recipe_(added|updated|deleted)/.test(t)) {
          this._loadRecipes(); this._loadTags();
        }
      });
    } catch { /* optional */ }
  }

  get _filteredRecipes() {
    let list = this._recipes;
    if (this._activeTag) list = list.filter(r =>
      r.tags?.includes(this._activeTag) ||
      r.courses?.includes(this._activeTag) ||
      r.categories?.includes(this._activeTag) ||
      r.collections?.includes(this._activeTag));
    if (this._searchQuery.trim()) {
      const q = this._searchQuery.trim().toLowerCase();
      list = list.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get _recentRecipes() {
    const count = this._settings.recentCount ?? 12;
    return this._recentRecipeIds
      .slice(0, count)
      .map(id => this._recipes.find(r => r.id === id))
      .filter(Boolean);
  }

  // -- Settings -------------------------------------------------------------

  _handleSettingsChange(e) {
    this._settings = e.detail.settings;
    saveSettings(this._settings);
  }

  // -- Timer management -----------------------------------------------------

  _tickTimers() {
    if (!this._timers.length) return;
    let changed = false;
    let alarm = null;
    const updated = this._timers.map(t => {
      if (!t.running || t.remaining <= 0) return t;
      const newRemaining = t.remaining - 1;
      changed = true;
      if (newRemaining <= 0 && !alarm) {
        alarm = { id: t.id, label: t.label };
      }
      return { ...t, remaining: newRemaining, running: newRemaining > 0 };
    });
    if (changed) {
      this._timers = updated;
      saveTimers(this._timers);
    }
    if (alarm && !this._timerAlarm) {
      this._timerAlarm = alarm;
      this._startAlarmLoop(this._settings.timerSound ?? 'beep', this._settings.timerSoundFile);
    }
  }

  _startTimer(seconds, label) {
    const id = Date.now().toString(36);
    this._timers = [...this._timers, {
      id,
      label: label || `${Math.floor(seconds / 60)} min timer`,
      total: seconds,
      remaining: seconds,
      running: true,
    }];
    saveTimers(this._timers);
  }

  _stopTimer(id) {
    this._timers = this._timers.filter(t => t.id !== id);
    saveTimers(this._timers);
  }

  _pauseTimer(id) {
    this._timers = this._timers.map(t => t.id === id ? { ...t, running: !t.running } : t);
    saveTimers(this._timers);
  }

  _addTimeToTimer(id, seconds) {
    this._timers = this._timers.map(t =>
      t.id === id ? { ...t, remaining: t.remaining + seconds, total: t.total + seconds, running: true } : t
    );
    if (this._timerAlarm?.id === id) { this._stopAlarmLoop(); this._timerAlarm = null; }
    saveTimers(this._timers);
  }

  _dismissAlarm() {
    if (this._timerAlarm) {
      this._stopAlarmLoop();
      this._stopTimer(this._timerAlarm.id);
      this._timerAlarm = null;
    }
  }

  _startAlarmLoop(type, fileUrl) {
    this._stopAlarmLoop();
    if (type === 'none') return;
    if (type === 'file' && fileUrl) {
      this._alarmLoopActive = true;
      const playNext = () => {
        if (!this._alarmLoopActive) return;
        this._alarmAudio = new Audio(fileUrl);
        this._alarmAudio.onended = () => {
          if (this._alarmLoopActive) this._alarmTimeout = setTimeout(playNext, 2000);
        };
        this._alarmAudio.onerror = () => {
          if (this._alarmLoopActive) this._alarmTimeout = setTimeout(() => playTimerSound('beep'), 2000);
        };
        this._alarmAudio.play().catch(() => {});
      };
      playNext();
    } else {
      playTimerSound(type);
      this._alarmInterval = setInterval(() => playTimerSound(type), 4000);
    }
  }

  _stopAlarmLoop() {
    this._alarmLoopActive = false;
    if (this._alarmInterval) { clearInterval(this._alarmInterval); this._alarmInterval = null; }
    if (this._alarmTimeout) { clearTimeout(this._alarmTimeout); this._alarmTimeout = null; }
    if (this._alarmAudio) {
      this._alarmAudio.pause();
      this._alarmAudio.onended = null;
      this._alarmAudio.onerror = null;
      this._alarmAudio = null;
    }
  }

  _handleStartTimer(e) {
    const { seconds, label } = e.detail;
    this._startTimer(seconds, label);
  }

  // -- Event handlers -------------------------------------------------------

  _handleSearch(e)     { this._searchQuery = e.detail?.query ?? ''; }
  _handleTagFilter(e)  { const t = e.detail?.tag; this._activeTag = this._activeTag === t ? null : t; }

  _handleBack() {
    this._navDirection = 'back';
    this._view = 'grid';
    this._selectedRecipe = null;
  }

  _handleShowGrid()    { this._navDirection = 'back'; this._view = 'grid'; this._selectedRecipe = null; }
  _handleShowPlanner() { this._navDirection = 'forward'; this._view = 'planner'; }

  _handleOpenRecipe(e) {
    const grid = this.shadowRoot?.querySelector('rm-recipe-grid');
    if (grid) {
      const scrollEl = grid.shadowRoot?.querySelector('.grid-scroll');
      this._gridScrollPos = scrollEl?.scrollTop ?? 0;
    }
    const recipe = e.detail?.recipe;
    this._navDirection = 'forward';
    this._selectedRecipe = recipe;
    this._view = 'detail';

    if (recipe?.id) {
      const ids = [recipe.id, ...this._recentRecipeIds.filter(id => id !== recipe.id)].slice(0, 50);
      this._recentRecipeIds = ids;
      saveRecentRecipes(ids);
    }
  }

  async _handleToggleFavourite(e) {
    const { recipeId } = e.detail;
    await this._api.toggleFavourite(recipeId);
    await this._loadRecipes();
    if (this._selectedRecipe?.id === recipeId)
      this._selectedRecipe = this._recipes.find(r => r.id === recipeId) ?? this._selectedRecipe;
  }

  async _handleDeleteRecipe(e) {
    await this._api.deleteRecipe(e.detail.recipeId);
    await this._loadRecipes(); await this._loadTags();
    this._navDirection = 'back'; this._view = 'grid'; this._selectedRecipe = null;
  }

  async _handleUpdateRecipe(e) {
    const { recipeId, data } = e.detail;
    await this._api.updateRecipe(recipeId, data);
    await this._loadRecipes(); await this._loadTags();
    if (this._selectedRecipe?.id === recipeId)
      this._selectedRecipe = this._recipes.find(r => r.id === recipeId) ?? null;
  }

  async _handleAddRecipe(e) {
    await this._api.addRecipe(e.detail.data);
    this._navDirection = 'back';
    this._view = 'grid';
    await this._loadRecipes(); await this._loadTags();
  }

  async _handleImportDone() {
    this._navDirection = 'back';
    this._view = 'grid';
    await this._loadRecipes(); await this._loadTags();
  }

  async _handleAddToShopping(e) {
    const { ingredients, listId, recipeName } = e.detail;
    if (this._slmAvailable && listId) {
      try {
        const res = await this._api.addIngredientsToShoppingList(listId, ingredients, recipeName);
        if (res.filter(r => !r.success).length) console.warn('Some ingredients failed to add to SLM');
      } catch (err) { console.error('Shopping list error:', err); }
    } else {
      const newItems = ingredients.map(ing => ({
        id: Math.random().toString(36).slice(2, 10),
        name: ing.name,
        amount: ing.amount || null,
        unit: ing.unit || null,
        checked: false,
      }));
      this._localShoppingItems = [...this._localShoppingItems, ...newItems];
      this._saveLocalShopping();
    }
  }

  _handleShoppingLocalUpdate(e) {
    this._localShoppingItems = e.detail.items;
    this._saveLocalShopping();
  }

  // -- Render ---------------------------------------------------------------

  _renderStars(rating) {
    const r = rating || 0;
    const hover = this._hdrStarHover;
    const display = hover > 0 ? hover : r;
    return html`
      <div class="header-stars"
        @mouseleave=${() => { this._hdrStarHover = 0; }}
        title="${hover > 0 ? `Set rating: ${hover}★` : r > 0 ? `Rating: ${r}★ — click to change` : 'Click to rate'}">
        ${[1,2,3,4,5].map(n => html`
          <span class="hdr-star ${n <= display ? 'filled' : ''}"
            @mouseover=${() => { this._hdrStarHover = n; }}
            @click=${() => this._handleRateRecipe(n)}>★</span>
        `)}
      </div>
    `;
  }

  async _handleRateRecipe(n) {
    if (!this._selectedRecipe) return;
    // Clicking the current rating clears it
    const newRating = this._selectedRecipe.rating === n ? null : n;
    this._hdrStarHover = 0;
    await this._handleUpdateRecipe({
      detail: { recipeId: this._selectedRecipe.id, data: { rating: newRating } },
    });
  }

  _renderSidebar() {
    const v = this._view;
    const collapsed = this._sidebarCollapsed;

    const navItem = (icon, label, view, placeholder = false) => html`
      <button
        class="sb-item ${v === view ? 'active' : ''} ${placeholder ? 'placeholder' : ''}"
        title="${placeholder ? label + ' — coming soon' : label}"
        @click=${placeholder ? undefined : () => { this._navDirection = 'forward'; this._view = view; this._selectedRecipe = null; }}
        ?disabled=${placeholder}
      >
        <ha-icon icon="${icon}"></ha-icon>
        ${!collapsed ? html`<span>${label}</span>` : ''}
      </button>
    `;

    return html`
      <nav class="rm-sidebar ${collapsed ? 'collapsed' : ''}">
        <div class="sb-top">
          <div class="sb-logo-row">
            <button class="sb-collapse-btn" @click=${() => { this._sidebarCollapsed = !this._sidebarCollapsed; }}
              title="${collapsed ? 'Expand sidebar' : 'Collapse sidebar'}">
              <ha-icon icon="${collapsed ? 'mdi:menu-close' : 'mdi:menu-open'}"></ha-icon>
            </button>
            ${!collapsed ? html`
              <div class="sb-logo">
                <ha-icon icon="mdi:chef-hat"></ha-icon>
                <span>Recipes</span>
              </div>
            ` : ''}
          </div>

          ${!collapsed ? html`
            <div class="sb-search">
              <ha-icon icon="mdi:magnify" class="sb-search-icon"></ha-icon>
              <input
                class="sb-search-input"
                type="text"
                placeholder="Search…"
                .value=${this._searchQuery}
                @input=${e => { this._searchQuery = e.target.value; this._navDirection = 'back'; this._view = 'grid'; }}
              />
              ${this._searchQuery ? html`
                <button class="sb-search-clear" @click=${() => { this._searchQuery = ''; }}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              ` : ''}
            </div>

            <button class="sb-new-btn" @click=${() => { this._view = 'add'; }}>
              <ha-icon icon="mdi:plus"></ha-icon>
              <span>New Recipe</span>
            </button>
          ` : html`
            <button class="sb-icon-only-btn" @click=${() => { this._view = 'add'; }} title="New Recipe">
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
          `}
        </div>

        <div class="sb-nav">
          ${navItem('mdi:home', 'Home', 'grid')}
          ${navItem('mdi:cart-outline', 'Shopping List', 'shopping')}
          ${this._settings.showPlanner
            ? navItem('mdi:calendar-week', 'Meal Planner', 'planner')
            : ''}
          ${navItem('mdi:book-open-variant', 'Cookbook', 'cookbook', true)}
          <button
            class="sb-item ${v === 'timers' ? 'active' : ''}"
            title="Timers"
            @click=${() => { this._timersPrevView = this._view; this._view = 'timers'; }}
          >
            <ha-icon icon="mdi:timer-outline"></ha-icon>
            ${!collapsed ? html`<span>Timers</span>` : ''}
            ${this._timers.length ? html`<span class="sb-timer-badge">${this._timers.length}</span>` : ''}
          </button>
        </div>

        <div class="sb-bottom">
          <button class="sb-item placeholder" disabled title="Sync — coming soon">
            <ha-icon icon="mdi:cloud-sync-outline"></ha-icon>${!collapsed ? html`<span>Sync</span>` : ''}
          </button>
          <button class="sb-item placeholder" disabled title="Help — coming soon">
            <ha-icon icon="mdi:help-circle-outline"></ha-icon>${!collapsed ? html`<span>Help</span>` : ''}
          </button>
          <button class="sb-item ${v === 'settings' ? 'active' : ''}"
            @click=${() => { this._view = 'settings'; }}>
            <ha-icon icon="mdi:cog-outline"></ha-icon>${!collapsed ? html`<span>Settings</span>` : ''}
          </button>
        </div>
      </nav>
    `;
  }

  _renderHeader() {
    const inDetail = this._view === 'detail' && this._selectedRecipe;
    const inSettings = this._view === 'settings';
    const inAdd = this._view === 'add';
    const inTimers = this._view === 'timers';
    const wide = this._wide;

    const title =
      inSettings  ? 'Settings'
      : inAdd     ? 'New Recipe'
      : inTimers  ? 'Timers'
      : inDetail  ? this._selectedRecipe.name
      : this._view === 'planner'  ? 'Meal Planner'
      : this._view === 'shopping' ? 'Shopping List'
      :                             'Recipes';

    return html`
      <div class="rm-header">
        <div class="rm-header-left">
          ${inDetail || inAdd ? html`
            <button class="icon-btn" @click=${this._handleBack} title="Back">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
          ` : inTimers && this._timersPrevView === 'detail' ? html`
            <button class="icon-btn"
              @click=${() => { this._navDirection = 'back'; this._view = 'detail'; this._timersPrevView = null; }}
              title="Back to recipe">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
          ` : !wide ? html`
            ${this._view !== 'grid' && !inSettings && !inTimers ? html`
              <button class="icon-btn" @click=${this._handleShowGrid}>
                <ha-icon icon="mdi:arrow-left"></ha-icon>
              </button>
            ` : html`
              <ha-icon icon="mdi:chef-hat" class="rm-logo"></ha-icon>
            `}
          ` : ''}
          <span class="rm-title">${title}</span>
        </div>

        <div class="rm-header-right">
          <!-- Timer pills (compact, shown when timers are running, not in timer view) -->
          ${this._timers.length && this._view !== 'timers' ? html`
            <div class="timer-pills" @click=${() => { this._navDirection = 'forward'; this._timersPrevView = this._view; this._view = 'timers'; }}>
              ${this._timers.slice(0, 3).map(t => html`
                <div class="timer-pill ${!t.running ? 'paused' : ''}">
                  <ha-icon icon="mdi:timer-outline"></ha-icon>
                  <span>${formatTimerDisplay(t.remaining)}</span>
                </div>
              `)}
              ${this._timers.length > 3 ? html`<span class="timer-more">+${this._timers.length - 3}</span>` : ''}
            </div>
          ` : ''}

          ${inDetail ? this._renderStars(this._selectedRecipe.rating) : ''}

          ${inSettings || inAdd || inTimers ? html`
            <button class="icon-btn" @click=${this._handleShowGrid}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          ` : !wide ? html`
            <button class="icon-btn"
              @click=${() => { this._mobileMenuOpen = !this._mobileMenuOpen; }}
              title="${this._mobileMenuOpen ? 'Close menu' : 'Menu'}">
              <ha-icon icon="${this._mobileMenuOpen ? 'mdi:close' : 'mdi:menu'}"></ha-icon>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderBody() {
    const s = this._settings;
    if (this._view === 'settings') return html`
      <rm-settings-view
        .settings=${s}
        @rm-settings-change=${this._handleSettingsChange}
      ></rm-settings-view>
    `;
    if (this._view === 'add') return html`
      <rm-add-recipe-dialog
        .api=${this._api}
        .asPanel=${true}
        .inlineMode=${true}
        @rm-add-recipe=${this._handleAddRecipe}
        @rm-import-done=${this._handleImportDone}
        @rm-close=${() => { this._navDirection = 'back'; this._view = 'grid'; }}
      ></rm-add-recipe-dialog>
    `;
    if (this._view === 'timers') return this._renderTimersView();
    if (this._loading) return html`
      <div class="rm-loading"><ha-circular-progress active size="large"></ha-circular-progress></div>
    `;
    if (this._error) return html`
      <div class="rm-error">
        <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
        <p>${this._error}</p>
        <button class="text-btn" @click=${this._init.bind(this)}>Retry</button>
      </div>
    `;
    if (this._view === 'grid') return html`
      <rm-recipe-grid
        .recipes=${this._filteredRecipes}
        .allRecipes=${this._recipes}
        .tags=${this._tags}
        .searchQuery=${this._searchQuery}
        .activeTag=${this._activeTag}
        .columns=${s.columns}
        .showFavourites=${s.showFavourites}
        .hideSidebar=${this._wide}
        .scrollPos=${this._gridScrollPos}
        .recentRecipes=${this._recentRecipes}
        .recentCount=${s.recentCount ?? 12}
        @rm-search=${this._handleSearch}
        @rm-tag-filter=${this._handleTagFilter}
        @rm-open-recipe=${this._handleOpenRecipe}
        @rm-toggle-favourite=${this._handleToggleFavourite}
      ></rm-recipe-grid>
    `;
    if (this._view === 'detail') return html`
      <rm-recipe-detail
        .recipe=${this._selectedRecipe}
        .api=${this._api}
        .settings=${s}
        .shoppingLists=${this._shoppingLists}
        .slmAvailable=${this._slmAvailable}
        @rm-back=${this._handleBack}
        @rm-toggle-favourite=${this._handleToggleFavourite}
        @rm-delete-recipe=${this._handleDeleteRecipe}
        @rm-update-recipe=${this._handleUpdateRecipe}
        @rm-add-to-shopping=${this._handleAddToShopping}
        @rm-start-timer=${this._handleStartTimer}
      ></rm-recipe-detail>
    `;
    if (this._view === 'planner') return html`
      <rm-meal-planner
        .api=${this._api}
        .recipes=${this._recipes}
        @rm-open-recipe=${this._handleOpenRecipe}
      ></rm-meal-planner>
    `;
    if (this._view === 'shopping') return html`
      <rm-shopping-view
        .hass=${this.hass}
        .slmAvailable=${this._slmAvailable}
        .shoppingLists=${this._shoppingLists}
        .api=${this._api}
        .localItems=${this._localShoppingItems}
        .settings=${this._settings}
        @rm-shopping-local-update=${this._handleShoppingLocalUpdate}
      ></rm-shopping-view>
    `;
    return html``;
  }

  _renderTimersView() {
    const hasCustom = this._customTimerInput.trim();
    return html`
      <div class="timers-view">
        ${this._timers.length === 0 ? html`
          <div class="timer-empty">
            <ha-icon icon="mdi:timer-off-outline"></ha-icon>
            <p>No active timers.</p>
            <p class="timer-empty-hint">Tap a highlighted time in a recipe's directions to start one.</p>
          </div>
        ` : html`
          <div class="timer-list">
            ${this._timers.map(t => html`
              <div class="timer-item">
                <div class="timer-info">
                  <span class="timer-label">${t.label}</span>
                  <div class="timer-bar-wrap">
                    <div class="timer-bar" style="width:${Math.round((t.remaining / t.total) * 100)}%"></div>
                  </div>
                </div>
                <div class="timer-time">${formatTimerDisplay(t.remaining)}</div>
                <div class="timer-controls">
                  <button class="timer-ctrl-btn" @click=${() => this._pauseTimer(t.id)} title="${t.running ? 'Pause' : 'Resume'}">
                    <ha-icon icon="${t.running ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
                  </button>
                  <button class="timer-ctrl-btn danger" @click=${() => this._stopTimer(t.id)} title="Stop">
                    <ha-icon icon="mdi:stop"></ha-icon>
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}

        <!-- Manual timer entry -->
        <div class="timer-add-section">
          <div class="timer-add-label">Add a timer (minutes):</div>
          <div class="timer-add-ctrl">
            <input
              type="number"
              class="timer-input"
              placeholder="e.g. 10"
              min="1"
              .value=${this._customTimerInput}
              @input=${e => { this._customTimerInput = e.target.value; }}
              @keydown=${e => {
                if (e.key === 'Enter' && hasCustom) {
                  this._startTimer(parseInt(this._customTimerInput) * 60, `${this._customTimerInput} min timer`);
                  this._customTimerInput = '';
                }
              }}
            />
            <button class="action-btn primary"
              ?disabled=${!hasCustom}
              @click=${() => {
                this._startTimer(parseInt(this._customTimerInput) * 60, `${this._customTimerInput} min timer`);
                this._customTimerInput = '';
              }}>
              Start
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderTimerAlarm() {
    const alarm = this._timerAlarm;
    if (!alarm) return '';
    return html`
      <div class="alarm-overlay">
        <div class="alarm-bubble">
          <ha-icon icon="mdi:alarm" class="alarm-icon"></ha-icon>
          <div class="alarm-label">${alarm.label}</div>
          <div class="alarm-sub">Timer complete!</div>
          <div class="alarm-btns">
            <button class="alarm-btn" @click=${() => this._addTimeToTimer(alarm.id, 300)}>+5 min</button>
            <button class="alarm-btn" @click=${() => this._addTimeToTimer(alarm.id, 600)}>+10 min</button>
            <button class="alarm-btn accent" @click=${() => {
              const mins = parseInt(prompt('Add how many minutes?') || '0');
              if (mins > 0) this._addTimeToTimer(alarm.id, mins * 60);
              else this._timerAlarm = null;
            }}>Custom</button>
            <button class="alarm-btn stop" @click=${this._dismissAlarm}>Stop</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderBottomNav() {
    const v = this._view;
    // Home is always "back" (return to grid); everything else is "forward"
    const homeBtn = html`
      <button class="rm-bn-btn ${v === 'grid' ? 'active' : ''}"
        @click=${() => { this._navDirection = 'back'; this._view = 'grid'; this._selectedRecipe = null; this._mobileMenuOpen = false; }}
        title="Home">
        <ha-icon icon="mdi:home"></ha-icon>
        <span>Home</span>
      </button>
    `;
    const btn = (icon, label, view) => html`
      <button class="rm-bn-btn ${v === view ? 'active' : ''}"
        @click=${() => { this._navDirection = 'forward'; this._view = view; this._selectedRecipe = null; this._mobileMenuOpen = false; }}
        title="${label}">
        <ha-icon icon="${icon}"></ha-icon>
        <span>${label}</span>
      </button>
    `;
    return html`
      <div class="rm-bottom-nav">
        ${homeBtn}
        ${this._settings.showPlanner ? btn('mdi:calendar-week', 'Planner', 'planner') : ''}
        <button class="rm-bn-btn rm-bn-add"
          @click=${() => { this._navDirection = 'forward'; this._view = 'add'; this._mobileMenuOpen = false; }}
          title="New Recipe">
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
        <button class="rm-bn-btn ${v === 'timers' ? 'active' : ''}"
          @click=${() => { this._navDirection = 'forward'; this._timersPrevView = this._view; this._view = 'timers'; this._mobileMenuOpen = false; }}
          title="Timers">
          <ha-icon icon="mdi:timer-outline"></ha-icon>
          <span>Timers</span>
          ${this._timers.length ? html`<span class="rm-bn-badge">${this._timers.length}</span>` : ''}
        </button>
        ${btn('mdi:cart-outline', 'Shopping', 'shopping')}
      </div>
    `;
  }

  _renderMobileMenu() {
    return html`
      <div class="rm-mobile-overlay" @click=${() => { this._mobileMenuOpen = false; }}>
        <nav class="rm-mobile-menu" @click=${e => e.stopPropagation()}>
          <div class="rm-mm-header">
            <ha-icon icon="mdi:chef-hat" class="rm-mm-logo"></ha-icon>
            <span class="rm-mm-title">Recipes</span>
            <button class="icon-btn" @click=${() => { this._mobileMenuOpen = false; }}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="rm-mm-items">
            <button class="rm-mm-item" @click=${() => { this._view = 'settings'; this._mobileMenuOpen = false; }}>
              <ha-icon icon="mdi:cog-outline"></ha-icon>
              <span>Settings</span>
            </button>
            <button class="rm-mm-item" disabled>
              <ha-icon icon="mdi:help-circle-outline"></ha-icon>
              <span>Help</span>
              <span class="rm-mm-soon">Soon</span>
            </button>
          </div>
        </nav>
      </div>
    `;
  }

  render() {
    const wide = this._wide;
    return html`
      <ha-card class="rm-card ${wide ? 'rm-wide' : ''}">
        ${wide ? this._renderSidebar() : ''}
        <div class="rm-main">
          ${this._renderHeader()}
          <div class="rm-body" data-nav="${this._navDirection}">${this._renderBody()}</div>
          ${!wide ? this._renderBottomNav() : ''}
        </div>

        ${!wide && this._mobileMenuOpen ? this._renderMobileMenu() : ''}

        <!-- Timer alarm modal -->
        ${this._timerAlarm ? this._renderTimerAlarm() : ''}
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --rm-bg-main:        #fafbfc;
      --rm-bg-surface:     #ffffff;
      --rm-bg-elevated:    #ffffff;
      --rm-text:           #424242;
      --rm-text-secondary: #757575;
      --rm-text-muted:     #9e9e9e;
      --rm-accent:         #9fa8da;
      --rm-accent-soft:    rgba(159,168,218,0.15);
      --rm-border:         #e8eaf6;
      --rm-shadow:         0 2px 6px rgba(0,0,0,0.08);
      --rm-radius:         12px;
      --rm-radius-sm:      8px;
      --rm-font-size-base: 15px;
      --rm-grid-columns:   repeat(3, minmax(0, 1fr));
      font-size: var(--rm-font-size-base);
    }

    ha-card.rm-card {
      background: var(--rm-bg-main);
      border-radius: var(--rm-radius);
      overflow: hidden;
      display: flex;
      flex-direction: row;
      height: 100%;
      max-height: none;
      min-height: 500px;
      color: var(--rm-text);
      position: relative;
    }

    /* ── Sidebar ─────────────────────────────── */

    .rm-sidebar {
      width: 200px;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      background: var(--rm-bg-surface);
      border-right: 1px solid var(--rm-border);
      overflow: hidden;
      transition: width 0.2s ease, min-width 0.2s ease;
    }

    .rm-sidebar.collapsed {
      width: 56px;
      min-width: 56px;
    }

    ha-card:not(.rm-wide) .rm-sidebar { display: none; }

    .sb-top {
      padding: 12px 8px 8px;
      flex-shrink: 0;
    }

    .sb-logo-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2px 8px;
    }

    .sb-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 15px;
      color: var(--rm-accent);
      overflow: hidden;
    }
    .sb-logo ha-icon { --mdc-icon-size: 22px; flex-shrink: 0; }

    .sb-collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-muted);
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .sb-collapse-btn:hover { background: var(--rm-accent-soft); color: var(--rm-text); }
    .sb-collapse-btn ha-icon { --mdc-icon-size: 20px; }

    .sb-search {
      display: flex;
      align-items: center;
      background: var(--rm-bg-main);
      border-radius: 8px;
      padding: 0 8px;
      gap: 6px;
      margin-bottom: 8px;
      border: 1px solid var(--rm-border);
    }
    .sb-search-icon { --mdc-icon-size: 16px; color: var(--rm-text-muted); flex-shrink: 0; }
    .sb-search-input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--rm-text); font-size: 13px; padding: 7px 0;
    }
    .sb-search-input::placeholder { color: var(--rm-text-muted); }
    .sb-search-clear {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-muted); padding: 2px; display: flex; align-items: center;
    }
    .sb-search-clear ha-icon { --mdc-icon-size: 14px; }

    .sb-new-btn {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 10px;
      background: var(--rm-accent); color: #fff;
      border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    .sb-new-btn:hover { opacity: 0.88; }
    .sb-new-btn ha-icon { --mdc-icon-size: 18px; }

    .sb-icon-only-btn {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; margin: 0 auto;
      background: var(--rm-accent); color: #fff;
      border: none; border-radius: 8px;
      cursor: pointer; transition: opacity 0.15s;
    }
    .sb-icon-only-btn:hover { opacity: 0.88; }
    .sb-icon-only-btn ha-icon { --mdc-icon-size: 20px; }

    .sb-nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px 6px 4px;
      scrollbar-width: none;
    }
    .sb-nav::-webkit-scrollbar { display: none; }

    .sb-bottom {
      padding: 4px 6px 12px;
      border-top: 1px solid var(--rm-border);
    }

    .sb-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 9px 10px;
      background: none; border: none; border-radius: 8px;
      font-size: 14px; color: var(--rm-text-secondary);
      cursor: pointer; text-align: left;
      transition: background 0.12s, color 0.12s;
      position: relative;
    }
    .rm-sidebar.collapsed .sb-item {
      justify-content: center;
      padding: 10px 6px;
    }
    .sb-item ha-icon { --mdc-icon-size: 20px; flex-shrink: 0; }
    .sb-item:hover:not(:disabled) { background: var(--rm-accent-soft); color: var(--rm-text); }
    .sb-item.active { background: var(--rm-accent-soft); color: var(--rm-accent); font-weight: 600; }
    .sb-item.placeholder { opacity: 0.4; cursor: default; }

    .sb-timer-badge {
      margin-left: auto;
      background: var(--rm-accent);
      color: #fff;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
    }
    .rm-sidebar.collapsed .sb-timer-badge {
      position: absolute;
      top: 4px; right: 4px;
      margin-left: 0;
      font-size: 9px;
      padding: 1px 4px;
    }

    /* ── Main content ────────────────────────── */

    .rm-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .rm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--rm-border);
      background: var(--rm-bg-surface);
      flex-shrink: 0;
      gap: 8px;
    }

    .rm-header-left, .rm-header-right {
      display: flex; align-items: center; gap: 6px;
      min-width: 0;
    }
    .rm-header-left { flex: 1; min-width: 0; }
    .rm-header-right { flex-shrink: 0; }

    .rm-logo { color: var(--rm-accent); --mdc-icon-size: 24px; }

    .rm-title {
      font-size: 17px; font-weight: 600; color: var(--rm-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      flex: 1; min-width: 0;
    }

    /* Star rating in header */
    .header-stars {
      display: flex;
      gap: 1px;
      align-items: center;
    }
    .hdr-star {
      font-size: 18px;
      color: var(--rm-border, rgba(0,0,0,0.2));
      line-height: 1;
      cursor: pointer;
      transition: color 0.1s, transform 0.1s;
      -webkit-text-stroke: 1px rgba(200,150,0,0.3);
    }
    .hdr-star:hover { transform: scale(1.2); color: #f5a623; }
    .hdr-star.filled { color: #f5a623; -webkit-text-stroke: 1px #c47f0a; }

    /* Timer pills */
    .timer-pills {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 2px;
    }
    .timer-pill {
      display: flex;
      align-items: center;
      gap: 3px;
      background: var(--rm-accent-soft);
      color: var(--rm-accent);
      border-radius: 10px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .timer-pill.paused { opacity: 0.6; }
    .timer-pill ha-icon { --mdc-icon-size: 12px; }
    .timer-more {
      font-size: 11px;
      color: var(--rm-text-secondary);
      padding: 0 4px;
    }

    .rm-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary); width: 34px; height: 34px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s; padding: 0; flex-shrink: 0;
    }
    .icon-btn:hover { background: var(--rm-border); color: var(--rm-text); }

    .text-btn {
      background: var(--rm-accent); color: #fff; border: none;
      border-radius: var(--rm-radius-sm); padding: 8px 16px;
      cursor: pointer; font-size: 14px; font-weight: 500;
    }

    .rm-loading {
      display: flex; justify-content: center; align-items: center; height: 200px;
    }

    .rm-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px 20px; gap: 12px;
      color: var(--rm-text-secondary); text-align: center;
    }
    .rm-error ha-icon { --mdc-icon-size: 48px; color: var(--error-color, #cf6679); }
    .rm-error p { margin: 0; font-size: 14px; }

    /* ── Timers view ─────────────────────────── */

    .timers-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      gap: 16px;
    }

    .timer-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px 0 24px;
      color: var(--rm-text-secondary);
      text-align: center;
      font-size: 14px;
    }
    .timer-empty ha-icon { --mdc-icon-size: 48px; opacity: 0.35; }
    .timer-empty p { margin: 0; }
    .timer-empty-hint { font-size: 12px !important; color: var(--rm-text-muted) !important; }

    .timer-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .timer-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--rm-bg-elevated);
      border-radius: 10px;
      padding: 12px 14px;
      border: 1px solid var(--rm-border);
    }

    .timer-info { flex: 1; min-width: 0; }
    .timer-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--rm-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .timer-bar-wrap {
      height: 4px;
      background: var(--rm-border);
      border-radius: 2px;
      margin-top: 6px;
      overflow: hidden;
    }
    .timer-bar {
      height: 100%;
      background: var(--rm-accent);
      border-radius: 2px;
      transition: width 1s linear;
    }

    .timer-time {
      font-size: 20px;
      font-weight: 700;
      color: var(--rm-accent);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .timer-controls { display: flex; gap: 4px; }
    .timer-ctrl-btn {
      background: none;
      border: 1px solid var(--rm-border);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text-secondary);
      padding: 0;
      transition: background 0.15s, color 0.15s;
    }
    .timer-ctrl-btn ha-icon { --mdc-icon-size: 15px; }
    .timer-ctrl-btn:hover { background: var(--rm-accent-soft); color: var(--rm-accent); }
    .timer-ctrl-btn.danger:hover { background: rgba(207,102,121,0.12); color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }

    .timer-add-section {
      border-top: 1px solid var(--rm-border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
    }
    .timer-add-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--rm-text-secondary);
    }
    .timer-add-ctrl { display: flex; gap: 8px; }
    .timer-input {
      flex: 1;
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 8px;
      color: var(--rm-text);
      padding: 8px 10px;
      font-size: 14px;
    }
    .timer-input:focus { outline: none; border-color: var(--rm-accent); }

    .action-btn {
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 8px;
      color: var(--rm-text);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .action-btn.primary {
      background: var(--rm-accent);
      border-color: var(--rm-accent);
      color: #fff;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Timer alarm bubble ──────────────────── */

    .alarm-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .alarm-bubble {
      background: var(--rm-bg-surface);
      border-radius: 20px;
      padding: 28px 24px;
      text-align: center;
      max-width: 300px;
      width: calc(100% - 48px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .alarm-icon {
      --mdc-icon-size: 52px;
      color: var(--rm-accent);
      animation: alarm-pulse 0.8s ease-in-out infinite alternate;
    }

    @keyframes alarm-pulse {
      from { transform: scale(1); opacity: 1; }
      to   { transform: scale(1.15); opacity: 0.8; }
    }

    .alarm-label {
      font-size: 18px;
      font-weight: 700;
      color: var(--rm-text);
    }

    .alarm-sub {
      font-size: 13px;
      color: var(--rm-text-secondary);
      margin-bottom: 8px;
    }

    .alarm-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    }

    .alarm-btn {
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 10px;
      color: var(--rm-text);
      padding: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .alarm-btn:hover { background: var(--rm-accent-soft); }
    .alarm-btn.accent { background: var(--rm-accent); color: #fff; border-color: var(--rm-accent); }
    .alarm-btn.stop {
      background: var(--error-color, #cf6679);
      color: #fff;
      border-color: var(--error-color, #cf6679);
      grid-column: 1 / -1;
    }
    .alarm-btn.stop:hover { opacity: 0.85; }

    /* ── View transitions (directional slide) ──────────────── */

    @keyframes rm-slide-forward {
      from { opacity: 0; transform: translateX(48px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes rm-slide-back {
      from { opacity: 0; transform: translateX(-48px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .rm-body[data-nav="forward"] > * { animation: rm-slide-forward 0.25s cubic-bezier(0.25,0.46,0.45,0.94); }
    .rm-body[data-nav="back"]    > * { animation: rm-slide-back    0.25s cubic-bezier(0.25,0.46,0.45,0.94); }

    /* ── Mobile bottom nav ───────────────── */

    .rm-bottom-nav {
      display: flex;
      align-items: stretch;
      border-top: 1px solid var(--rm-border);
      background: var(--rm-bg-surface);
      flex-shrink: 0;
      height: 56px;
    }

    .rm-bn-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-muted);
      font-size: 9px;
      font-weight: 600;
      padding: 6px 2px;
      position: relative;
      transition: color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .rm-bn-btn ha-icon { --mdc-icon-size: 22px; }
    .rm-bn-btn.active { color: var(--rm-accent); }
    .rm-bn-btn:not(.rm-bn-add):hover { color: var(--rm-text); }

    .rm-bn-add {
      background: var(--rm-accent);
      color: white !important;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      flex: none;
      align-self: center;
      margin: 0 8px;
      padding: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .rm-bn-add ha-icon { --mdc-icon-size: 26px; }

    .rm-bn-badge {
      position: absolute;
      top: 3px;
      right: calc(50% - 18px);
      background: var(--rm-accent);
      color: #fff;
      border-radius: 8px;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 4px;
      min-width: 14px;
      text-align: center;
    }

    /* ── Mobile slide-in menu ────────────── */

    .rm-mobile-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 100;
      display: flex;
      justify-content: flex-end;
    }

    .rm-mobile-menu {
      width: min(280px, 80%);
      height: 100%;
      background: var(--rm-bg-surface);
      border-left: 1px solid var(--rm-border);
      display: flex;
      flex-direction: column;
      animation: rm-menu-slide-in 0.22s ease;
      overflow: hidden;
    }

    @keyframes rm-menu-slide-in {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .rm-mm-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 12px 14px 16px;
      border-bottom: 1px solid var(--rm-border);
      flex-shrink: 0;
    }
    .rm-mm-logo { color: var(--rm-accent); --mdc-icon-size: 22px; }
    .rm-mm-title { flex: 1; font-weight: 700; font-size: 15px; color: var(--rm-text); }

    .rm-mm-items { padding: 8px 0; flex: 1; overflow-y: auto; }

    .rm-mm-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-secondary);
      font-size: 14px;
      text-align: left;
      transition: background 0.12s, color 0.12s;
      -webkit-tap-highlight-color: transparent;
    }
    .rm-mm-item ha-icon { --mdc-icon-size: 20px; flex-shrink: 0; }
    .rm-mm-item:hover:not(:disabled) { background: var(--rm-accent-soft); color: var(--rm-text); }
    .rm-mm-item:disabled { opacity: 0.4; cursor: default; }

    .rm-mm-soon {
      margin-left: auto;
      font-size: 10px;
      font-weight: 700;
      background: var(--rm-accent-soft);
      color: var(--rm-accent);
      border-radius: 6px;
      padding: 2px 6px;
    }
  `;
}

if (!customElements.get('recipe-manager-card')) customElements.define('recipe-manager-card', RecipeManagerCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'recipe-manager-card',
  name: 'Recipe Manager',
  description: 'Manage, browse, and plan meals with your recipe collection.',
  preview: false,
});
