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

const DEFAULT_SETTINGS = {
  theme:          'warm',
  darkMode:       'system',
  fontSize:       'medium',
  columns:        3,
  showFavourites: true,
  showPlanner:    true,
  recentCount:    12,
};

const THEME_VARS = {
  warm: {
    light: {
      '--rm-bg-main':        '#faf8f5', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#2d2016',
      '--rm-text-secondary': '#6b5c4a', '--rm-text-muted':     '#a08060',
      '--rm-accent':         '#e8622e', '--rm-accent-soft':    'rgba(232,98,46,0.12)',
      '--rm-border':         'rgba(45,32,22,0.1)', '--rm-shadow': '0 2px 8px rgba(45,32,22,0.12)',
    },
    dark: {
      '--rm-bg-main':        '#1a1510', '--rm-bg-surface':     '#241e18',
      '--rm-bg-elevated':    '#2e261e', '--rm-text':           '#f0e8dc',
      '--rm-text-secondary': '#c09070', '--rm-text-muted':     '#6b5040',
      '--rm-accent':         '#ff7a45', '--rm-accent-soft':    'rgba(255,122,69,0.15)',
      '--rm-border':         'rgba(240,232,220,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  forest: {
    light: {
      '--rm-bg-main':        '#f4f7f2', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#1a2b1a',
      '--rm-text-secondary': '#4a6b4a', '--rm-text-muted':     '#7a9b7a',
      '--rm-accent':         '#2e7d32', '--rm-accent-soft':    'rgba(46,125,50,0.12)',
      '--rm-border':         'rgba(26,43,26,0.1)', '--rm-shadow': '0 2px 8px rgba(26,43,26,0.12)',
    },
    dark: {
      '--rm-bg-main':        '#101810', '--rm-bg-surface':     '#182015',
      '--rm-bg-elevated':    '#202e1e', '--rm-text':           '#d4f0d0',
      '--rm-text-secondary': '#80b080', '--rm-text-muted':     '#406040',
      '--rm-accent':         '#66bb6a', '--rm-accent-soft':    'rgba(102,187,106,0.15)',
      '--rm-border':         'rgba(212,240,208,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  ocean: {
    light: {
      '--rm-bg-main':        '#f0f5fa', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#0d2040',
      '--rm-text-secondary': '#3a5878', '--rm-text-muted':     '#7090b0',
      '--rm-accent':         '#1565c0', '--rm-accent-soft':    'rgba(21,101,192,0.12)',
      '--rm-border':         'rgba(13,32,64,0.1)', '--rm-shadow': '0 2px 8px rgba(13,32,64,0.12)',
    },
    dark: {
      '--rm-bg-main':        '#0a1628', '--rm-bg-surface':     '#0f2040',
      '--rm-bg-elevated':    '#162a52', '--rm-text':           '#d0e8f8',
      '--rm-text-secondary': '#7090b8', '--rm-text-muted':     '#3a5070',
      '--rm-accent':         '#42a5f5', '--rm-accent-soft':    'rgba(66,165,245,0.15)',
      '--rm-border':         'rgba(208,232,248,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  midnight: {
    dark: {
      '--rm-bg-main':        '#0d1117', '--rm-bg-surface':     '#161b22',
      '--rm-bg-elevated':    '#21262d', '--rm-text':           '#e6edf3',
      '--rm-text-secondary': '#7d8590', '--rm-text-muted':     '#484f58',
      '--rm-accent':         '#7c3aed', '--rm-accent-soft':    'rgba(124,58,237,0.2)',
      '--rm-border':         'rgba(230,237,243,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  ember: {
    dark: {
      '--rm-bg-main':        '#111111', '--rm-bg-surface':     '#1c1210',
      '--rm-bg-elevated':    '#261a15', '--rm-text':           '#f0e0d0',
      '--rm-text-secondary': '#a07060', '--rm-text-muted':     '#584030',
      '--rm-accent':         '#f57c00', '--rm-accent-soft':    'rgba(245,124,0,0.18)',
      '--rm-border':         'rgba(240,224,208,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  blossom: {
    light: {
      '--rm-bg-main':        '#fdf6f8', '--rm-bg-surface':     '#ffffff',
      '--rm-bg-elevated':    '#ffffff', '--rm-text':           '#2d1520',
      '--rm-text-secondary': '#7a4060', '--rm-text-muted':     '#b08090',
      '--rm-accent':         '#c2185b', '--rm-accent-soft':    'rgba(194,24,91,0.12)',
      '--rm-border':         'rgba(45,21,32,0.1)', '--rm-shadow': '0 2px 8px rgba(45,21,32,0.12)',
    },
    dark: {
      '--rm-bg-main':        '#1a0d12', '--rm-bg-surface':     '#241420',
      '--rm-bg-elevated':    '#2e1a28', '--rm-text':           '#f8d0de',
      '--rm-text-secondary': '#c070a0', '--rm-text-muted':     '#603050',
      '--rm-accent':         '#f48fb1', '--rm-accent-soft':    'rgba(244,143,177,0.15)',
      '--rm-border':         'rgba(248,208,222,0.08)', '--rm-shadow': '0 2px 8px rgba(0,0,0,0.4)',
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
    _showAddPanel:        { type: Boolean },
    _shoppingLists:       { type: Array },
    _slmAvailable:        { type: Boolean },
    _localShoppingItems:  { type: Array },
    _settings:            { type: Object },
    _wide:                { type: Boolean },
    _gridScrollPos:       { type: Number },
    _recentRecipeIds:     { type: Array },
    _timers:              { type: Array },
    _timerAlarm:          { type: Object },  // {id, label} when a timer fires
    _showTimerView:       { type: Boolean },
    _customTimerInput:    { type: String },
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
    this._showAddPanel = false;
    this._shoppingLists = [];
    this._slmAvailable = false;
    this._localShoppingItems = [];
    this._settings = loadSettings();
    this._wide = false;
    this._gridScrollPos = 0;
    this._recentRecipeIds = loadRecentRecipes();
    this._timers = [];
    this._timerAlarm = null;
    this._showTimerView = false;
    this._customTimerInput = '';
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
    // Start timer tick
    this._timerTick = setInterval(() => this._tickTimers(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    this._darkModeQuery?.removeEventListener('change', this._onSystemDark);
    this._resizeObserver?.disconnect();
    if (this._timerTick) { clearInterval(this._timerTick); this._timerTick = null; }
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
    const themeVars = THEME_VARS[s.theme] ?? THEME_VARS.warm;
    const alwaysDark = !themeVars.light;
    let isDark = alwaysDark;
    if (!alwaysDark) {
      if (s.darkMode === 'on') isDark = true;
      else if (s.darkMode === 'off') isDark = false;
      else isDark = this._darkModeQuery?.matches ?? false;
    }
    const vars = isDark ? (themeVars.dark ?? themeVars.light) : themeVars.light;
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
    if (this._activeTag) list = list.filter(r => r.tags?.includes(this._activeTag));
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
    if (changed) this._timers = updated;
    if (alarm) this._timerAlarm = alarm;
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
  }

  _stopTimer(id) {
    this._timers = this._timers.filter(t => t.id !== id);
  }

  _pauseTimer(id) {
    this._timers = this._timers.map(t => t.id === id ? { ...t, running: !t.running } : t);
  }

  _addTimeToTimer(id, seconds) {
    this._timers = this._timers.map(t =>
      t.id === id ? { ...t, remaining: t.remaining + seconds, total: t.total + seconds, running: true } : t
    );
    if (this._timerAlarm?.id === id) this._timerAlarm = null;
  }

  _dismissAlarm() {
    if (this._timerAlarm) {
      this._stopTimer(this._timerAlarm.id);
      this._timerAlarm = null;
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
    this._view = 'grid';
    this._selectedRecipe = null;
  }

  _handleShowGrid()    { this._view = 'grid'; this._selectedRecipe = null; }
  _handleShowPlanner() { this._view = 'planner'; }

  _handleOpenRecipe(e) {
    // Save current grid scroll position before navigating
    const grid = this.shadowRoot?.querySelector('rm-recipe-grid');
    if (grid) {
      const scrollEl = grid.shadowRoot?.querySelector('.grid-scroll');
      this._gridScrollPos = scrollEl?.scrollTop ?? 0;
    }
    const recipe = e.detail?.recipe;
    this._selectedRecipe = recipe;
    this._view = 'detail';

    // Track recently viewed
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
    this._view = 'grid'; this._selectedRecipe = null;
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
    this._showAddPanel = false;
    await this._loadRecipes(); await this._loadTags();
  }

  async _handleImportDone() {
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
    return html`
      <div class="header-stars">
        ${[1,2,3,4,5].map(n => html`<span class="hdr-star ${n <= r ? 'filled' : ''}">★</span>`)}
      </div>
    `;
  }

  _renderSidebar() {
    const v = this._view;
    const navItem = (icon, label, view, placeholder = false) => html`
      <button
        class="sb-item ${v === view ? 'active' : ''} ${placeholder ? 'placeholder' : ''}"
        title="${placeholder ? label + ' — coming soon' : label}"
        @click=${placeholder ? undefined : () => { this._view = view; this._selectedRecipe = null; }}
        ?disabled=${placeholder}
      >
        <ha-icon icon="${icon}"></ha-icon>
        <span>${label}</span>
      </button>
    `;

    return html`
      <nav class="rm-sidebar">
        <div class="sb-top">
          <div class="sb-logo">
            <ha-icon icon="mdi:chef-hat"></ha-icon>
            <span>Recipes</span>
          </div>

          <div class="sb-search">
            <ha-icon icon="mdi:magnify" class="sb-search-icon"></ha-icon>
            <input
              class="sb-search-input"
              type="text"
              placeholder="Search…"
              .value=${this._searchQuery}
              @input=${e => { this._searchQuery = e.target.value; this._view = 'grid'; }}
            />
            ${this._searchQuery ? html`
              <button class="sb-search-clear" @click=${() => { this._searchQuery = ''; }}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>

          <button class="sb-new-btn" @click=${() => { this._showAddPanel = true; }}>
            <ha-icon icon="mdi:plus"></ha-icon>
            <span>New Recipe</span>
          </button>
        </div>

        <div class="sb-nav">
          ${navItem('mdi:home', 'Home', 'grid')}
          ${navItem('mdi:cart-outline', 'Shopping List', 'shopping')}
          ${this._settings.showPlanner
            ? navItem('mdi:calendar-week', 'Meal Planner', 'planner')
            : ''}
          ${navItem('mdi:book-open-variant', 'Cookbook', 'cookbook', true)}
          <button
            class="sb-item ${this._showTimerView ? 'active' : ''}"
            title="Timers"
            @click=${() => { this._showTimerView = !this._showTimerView; }}
          >
            <ha-icon icon="mdi:timer-outline"></ha-icon>
            <span>Timers</span>
            ${this._timers.length ? html`<span class="sb-timer-badge">${this._timers.length}</span>` : ''}
          </button>
        </div>

        <div class="sb-bottom">
          <button class="sb-item placeholder" disabled title="Sync — coming soon">
            <ha-icon icon="mdi:cloud-sync-outline"></ha-icon><span>Sync</span>
          </button>
          <button class="sb-item placeholder" disabled title="Help — coming soon">
            <ha-icon icon="mdi:help-circle-outline"></ha-icon><span>Help</span>
          </button>
          <button class="sb-item ${v === 'settings' ? 'active' : ''}"
            @click=${() => { this._view = 'settings'; }}>
            <ha-icon icon="mdi:cog-outline"></ha-icon><span>Settings</span>
          </button>
        </div>
      </nav>
    `;
  }

  _renderHeader() {
    const inDetail = this._view === 'detail' && this._selectedRecipe;
    const inSettings = this._view === 'settings';
    const wide = this._wide;

    return html`
      <div class="rm-header">
        <div class="rm-header-left">
          ${/* Back arrow: always show in detail view (both narrow and wide) */
            inDetail ? html`
              <button class="icon-btn" @click=${this._handleBack} title="Back">
                <ha-icon icon="mdi:arrow-left"></ha-icon>
              </button>
            ` : !wide ? html`
              ${this._view !== 'grid' && !inSettings ? html`
                <button class="icon-btn" @click=${this._handleShowGrid}>
                  <ha-icon icon="mdi:arrow-left"></ha-icon>
                </button>
              ` : html`
                <ha-icon icon="mdi:chef-hat" class="rm-logo"></ha-icon>
              `}
            ` : ''}
          <span class="rm-title">
            ${inSettings                                           ? 'Settings'
              : inDetail                                           ? this._selectedRecipe.name
              : this._view === 'planner'                          ? 'Meal Planner'
              : this._view === 'shopping'                         ? 'Shopping List'
              :                                                     'Recipes'}
          </span>
        </div>

        <div class="rm-header-right">
          <!-- Timer pills (compact, shown when timers are running) -->
          ${this._timers.length ? html`
            <div class="timer-pills" @click=${() => { this._showTimerView = !this._showTimerView; }}>
              ${this._timers.slice(0, 3).map(t => html`
                <div class="timer-pill ${!t.running ? 'paused' : ''}">
                  <ha-icon icon="mdi:timer-outline"></ha-icon>
                  <span>${formatTimerDisplay(t.remaining)}</span>
                </div>
              `)}
              ${this._timers.length > 3 ? html`<span class="timer-more">+${this._timers.length - 3}</span>` : ''}
            </div>
          ` : ''}

          <!-- Star rating shown in header when viewing a recipe -->
          ${inDetail ? this._renderStars(this._selectedRecipe.rating) : ''}

          ${inSettings ? html`
            <button class="icon-btn" @click=${this._handleShowGrid}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          ` : !wide && this._view === 'grid' ? html`
            <button class="icon-btn" @click=${() => { this._showAddPanel = true; }}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>
            ${this._settings.showPlanner ? html`
              <button class="icon-btn" @click=${this._handleShowPlanner}>
                <ha-icon icon="mdi:calendar-week"></ha-icon>
              </button>
            ` : ''}
            <button class="icon-btn" @click=${() => { this._view = 'settings'; }}>
              <ha-icon icon="mdi:cog-outline"></ha-icon>
            </button>
          ` : !wide && this._view === 'planner' ? html`
            <button class="icon-btn" @click=${this._handleShowGrid}>
              <ha-icon icon="mdi:view-grid"></ha-icon>
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
        .slmAvailable=${this._slmAvailable}
        .shoppingLists=${this._shoppingLists}
        .api=${this._api}
        .localItems=${this._localShoppingItems}
        @rm-shopping-local-update=${this._handleShoppingLocalUpdate}
      ></rm-shopping-view>
    `;
    return html``;
  }

  _renderTimerView() {
    const hasCustom = this._customTimerInput.trim();
    return html`
      <div class="timer-overlay" @click=${e => { if (e.target === e.currentTarget) this._showTimerView = false; }}>
        <div class="timer-panel">
          <div class="timer-panel-header">
            <span>Timers</span>
            <button class="icon-btn" @click=${() => { this._showTimerView = false; }}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="timer-panel-body">
            ${this._timers.length === 0 ? html`
              <div class="timer-empty">
                <ha-icon icon="mdi:timer-off-outline"></ha-icon>
                <p>No active timers.<br>Tap a highlighted time in a recipe's directions to start one.</p>
              </div>
            ` : this._timers.map(t => html`
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

            <!-- Manual timer entry -->
            <div class="timer-add-row">
              <span class="timer-add-label">Add timer (minutes):</span>
              <div class="timer-add-ctrl">
                <input
                  type="number"
                  class="timer-input"
                  placeholder="e.g. 10"
                  min="1"
                  .value=${this._customTimerInput}
                  @input=${e => { this._customTimerInput = e.target.value; }}
                  @keydown=${e => { if (e.key === 'Enter' && hasCustom) { this._startTimer(parseInt(this._customTimerInput) * 60, `${this._customTimerInput} min timer`); this._customTimerInput = ''; } }}
                />
                <button class="action-btn primary"
                  ?disabled=${!hasCustom}
                  @click=${() => { this._startTimer(parseInt(this._customTimerInput) * 60, `${this._customTimerInput} min timer`); this._customTimerInput = ''; }}>
                  Start
                </button>
              </div>
            </div>
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

  render() {
    const wide = this._wide;
    return html`
      <ha-card class="rm-card ${wide ? 'rm-wide' : ''}">
        ${wide ? this._renderSidebar() : ''}
        <div class="rm-main">
          ${this._renderHeader()}
          <div class="rm-body">${this._renderBody()}</div>
        </div>

        <!-- New Recipe right-side panel (wide) or bottom sheet (narrow) -->
        ${this._showAddPanel ? html`
          <rm-add-recipe-dialog
            .api=${this._api}
            .asPanel=${wide}
            @rm-add-recipe=${this._handleAddRecipe}
            @rm-import-done=${this._handleImportDone}
            @rm-close=${() => { this._showAddPanel = false; }}
          ></rm-add-recipe-dialog>
        ` : ''}

        <!-- Timer view overlay -->
        ${this._showTimerView ? this._renderTimerView() : ''}

        <!-- Timer alarm modal -->
        ${this._timerAlarm ? this._renderTimerAlarm() : ''}
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --rm-bg-main:        #faf8f5;
      --rm-bg-surface:     #ffffff;
      --rm-bg-elevated:    #ffffff;
      --rm-text:           #2d2016;
      --rm-text-secondary: #6b5c4a;
      --rm-text-muted:     #a08060;
      --rm-accent:         #e8622e;
      --rm-accent-soft:    rgba(232,98,46,0.12);
      --rm-border:         rgba(45,32,22,0.1);
      --rm-shadow:         0 2px 8px rgba(45,32,22,0.12);
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
      min-height: 500px;
      max-height: 85vh;
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
    }

    ha-card:not(.rm-wide) .rm-sidebar { display: none; }

    .sb-top {
      padding: 12px 10px 8px;
      flex-shrink: 0;
    }

    .sb-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px 10px;
      font-weight: 700;
      font-size: 15px;
      color: var(--rm-accent);
    }
    .sb-logo ha-icon { --mdc-icon-size: 22px; }

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

    .sb-nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px 8px 4px;
      scrollbar-width: none;
    }
    .sb-nav::-webkit-scrollbar { display: none; }

    .sb-bottom {
      padding: 4px 8px 12px;
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
      font-size: 16px;
      color: var(--rm-border, rgba(0,0,0,0.15));
      line-height: 1;
    }
    .hdr-star.filled { color: #f5a623; }

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

    /* ── Timer panel ─────────────────────────── */

    .timer-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timer-panel {
      background: var(--rm-bg-surface);
      border-radius: var(--rm-radius);
      width: min(380px, calc(100% - 32px));
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--rm-shadow);
    }

    .timer-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--rm-border);
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .timer-panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .timer-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 0;
      color: var(--rm-text-secondary);
      text-align: center;
      font-size: 13px;
    }
    .timer-empty ha-icon { --mdc-icon-size: 40px; opacity: 0.4; }
    .timer-empty p { margin: 0; }

    .timer-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--rm-bg-elevated);
      border-radius: 10px;
      padding: 10px 12px;
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
      margin-top: 4px;
      overflow: hidden;
    }
    .timer-bar {
      height: 100%;
      background: var(--rm-accent);
      border-radius: 2px;
      transition: width 1s linear;
    }

    .timer-time {
      font-size: 18px;
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
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text-secondary);
      padding: 0;
      transition: background 0.15s, color 0.15s;
    }
    .timer-ctrl-btn ha-icon { --mdc-icon-size: 14px; }
    .timer-ctrl-btn:hover { background: var(--rm-accent-soft); color: var(--rm-accent); }
    .timer-ctrl-btn.danger:hover { background: rgba(207,102,121,0.12); color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }

    .timer-add-row {
      padding-top: 8px;
      border-top: 1px solid var(--rm-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .timer-add-label {
      font-size: 11px;
      font-weight: 600;
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
  `;
}

customElements.define('recipe-manager-card', RecipeManagerCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'recipe-manager-card',
  name: 'Recipe Manager',
  description: 'Manage, browse, and plan meals with your recipe collection.',
  preview: false,
});
