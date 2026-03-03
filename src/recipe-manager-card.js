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

const DEFAULT_SETTINGS = {
  theme:          'warm',
  darkMode:       'system',
  fontSize:       'medium',
  columns:        3,
  showFavourites: true,
  showPlanner:    true,
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
    _showAddDialog:       { type: Boolean },
    _shoppingLists:       { type: Array },
    _slmAvailable:        { type: Boolean },
    _localShoppingItems:  { type: Array },
    _settings:            { type: Object },
    _wide:                { type: Boolean },
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
    this._showAddDialog = false;
    this._shoppingLists = [];
    this._slmAvailable = false;
    this._localShoppingItems = [];
    this._settings = loadSettings();
    this._wide = false;
    this._unsubscribe = null;
    this._darkModeQuery = null;
    this._resizeObserver = null;
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    this._darkModeQuery?.removeEventListener('change', this._onSystemDark);
    this._resizeObserver?.disconnect();
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

  // -- Settings -------------------------------------------------------------

  _handleSettingsChange(e) {
    this._settings = e.detail.settings;
    saveSettings(this._settings);
  }

  // -- Event handlers -------------------------------------------------------

  _handleSearch(e)     { this._searchQuery = e.detail?.query ?? ''; }
  _handleTagFilter(e)  { const t = e.detail?.tag; this._activeTag = this._activeTag === t ? null : t; }
  _handleBack()        { this._view = 'grid'; this._selectedRecipe = null; }
  _handleShowGrid()    { this._view = 'grid'; this._selectedRecipe = null; }
  _handleShowPlanner() { this._view = 'planner'; }

  _handleOpenRecipe(e) {
    this._selectedRecipe = e.detail?.recipe;
    this._view = 'detail';
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
    this._showAddDialog = false;
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
      // Add to local list
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
          <!-- Logo / burger placeholder -->
          <div class="sb-logo">
            <ha-icon icon="mdi:chef-hat"></ha-icon>
            <span>Recipes</span>
          </div>

          <!-- Inline search -->
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

          <!-- New recipe -->
          <button class="sb-new-btn" @click=${() => { this._showAddDialog = true; }}>
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
          ${navItem('mdi:timer-outline', 'New Timer', 'timer', true)}
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
    const inGrid = this._view === 'grid';
    const inSettings = this._view === 'settings';
    const wide = this._wide;

    return html`
      <div class="rm-header">
        <div class="rm-header-left">
          ${!wide && this._view !== 'grid' && !inSettings ? html`
            <button class="icon-btn" @click=${this._handleShowGrid}>
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
          ` : !wide ? html`
            <ha-icon icon="mdi:chef-hat" class="rm-logo"></ha-icon>
          ` : ''}
          <span class="rm-title">
            ${inSettings                                          ? 'Settings'
              : this._view === 'detail' && this._selectedRecipe  ? this._selectedRecipe.name
              : this._view === 'planner'                         ? 'Meal Planner'
              : this._view === 'shopping'                        ? 'Shopping List'
              :                                                    'Recipes'}
          </span>
        </div>
        <div class="rm-header-right">
          ${inSettings ? html`
            <button class="icon-btn" @click=${this._handleShowGrid}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          ` : !wide && inGrid ? html`
            <button class="icon-btn" @click=${() => { this._showAddDialog = true; }}>
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

  render() {
    const wide = this._wide;
    return html`
      <ha-card class="rm-card ${wide ? 'rm-wide' : ''}">
        ${wide ? this._renderSidebar() : ''}
        <div class="rm-main">
          ${this._renderHeader()}
          <div class="rm-body">${this._renderBody()}</div>
        </div>

        ${this._showAddDialog ? html`
          <rm-add-recipe-dialog
            .api=${this._api}
            @rm-add-recipe=${this._handleAddRecipe}
            @rm-import-done=${this._handleImportDone}
            @rm-close=${() => { this._showAddDialog = false; }}
          ></rm-add-recipe-dialog>
        ` : ''}
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      /* Default warm-light vars (overridden at runtime) */
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
      flex-direction: row;   /* always row; sidebar hidden on narrow */
      min-height: 500px;
      max-height: 85vh;
      color: var(--rm-text);
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

    /* Sidebar hidden unless .rm-wide */
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
    }
    .sb-item ha-icon { --mdc-icon-size: 20px; flex-shrink: 0; }
    .sb-item:hover:not(:disabled) { background: var(--rm-accent-soft); color: var(--rm-text); }
    .sb-item.active { background: var(--rm-accent-soft); color: var(--rm-accent); font-weight: 600; }
    .sb-item.placeholder { opacity: 0.4; cursor: default; }

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
      padding: 12px 16px;
      border-bottom: 1px solid var(--rm-border);
      background: var(--rm-bg-surface);
      flex-shrink: 0;
    }

    .rm-header-left, .rm-header-right {
      display: flex; align-items: center; gap: 8px;
    }

    .rm-logo { color: var(--rm-accent); --mdc-icon-size: 24px; }

    .rm-title {
      font-size: 18px; font-weight: 600; color: var(--rm-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;
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
      color: var(--rm-text-secondary); width: 36px; height: 36px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s; padding: 0;
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
