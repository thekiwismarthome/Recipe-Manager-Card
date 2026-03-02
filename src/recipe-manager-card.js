/**
 * Recipe Manager Card — main entry point.
 * Registers the custom element and orchestrates view routing.
 */
import { LitElement, html, css } from 'lit';
import { RecipeManagerAPI } from './services/api.js';

import './components/rm-recipe-grid.js';
import './components/rm-recipe-detail.js';
import './components/rm-add-recipe-dialog.js';
import './components/rm-meal-planner.js';
import './components/rm-settings-view.js';

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'rm_settings';

const DEFAULT_SETTINGS = {
  theme:         'warm',    // 'warm' | 'forest' | 'ocean' | 'midnight' | 'ember' | 'blossom'
  darkMode:      'system',  // 'on' | 'off' | 'system'
  fontSize:      'medium',  // 'small' | 'medium' | 'large'
  columns:       3,         // 2 | 3 | 4
  showFavourites: true,
  showPlanner:   true,
};

// CSS variable sets per theme.  Each theme has light + dark variants,
// except 'midnight' and 'ember' which are always dark.
const THEME_VARS = {
  warm: {
    light: {
      '--rm-bg-main':      '#faf8f5',
      '--rm-bg-surface':   '#ffffff',
      '--rm-bg-elevated':  '#ffffff',
      '--rm-text':         '#2d2016',
      '--rm-text-secondary': '#6b5c4a',
      '--rm-text-muted':   '#a08060',
      '--rm-accent':       '#e8622e',
      '--rm-accent-soft':  'rgba(232,98,46,0.12)',
      '--rm-border':       'rgba(45,32,22,0.1)',
      '--rm-shadow':       '0 2px 8px rgba(45,32,22,0.12)',
    },
    dark: {
      '--rm-bg-main':      '#1a1510',
      '--rm-bg-surface':   '#241e18',
      '--rm-bg-elevated':  '#2e261e',
      '--rm-text':         '#f0e8dc',
      '--rm-text-secondary': '#c09070',
      '--rm-text-muted':   '#6b5040',
      '--rm-accent':       '#ff7a45',
      '--rm-accent-soft':  'rgba(255,122,69,0.15)',
      '--rm-border':       'rgba(240,232,220,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  forest: {
    light: {
      '--rm-bg-main':      '#f4f7f2',
      '--rm-bg-surface':   '#ffffff',
      '--rm-bg-elevated':  '#ffffff',
      '--rm-text':         '#1a2b1a',
      '--rm-text-secondary': '#4a6b4a',
      '--rm-text-muted':   '#7a9b7a',
      '--rm-accent':       '#2e7d32',
      '--rm-accent-soft':  'rgba(46,125,50,0.12)',
      '--rm-border':       'rgba(26,43,26,0.1)',
      '--rm-shadow':       '0 2px 8px rgba(26,43,26,0.12)',
    },
    dark: {
      '--rm-bg-main':      '#101810',
      '--rm-bg-surface':   '#182015',
      '--rm-bg-elevated':  '#202e1e',
      '--rm-text':         '#d4f0d0',
      '--rm-text-secondary': '#80b080',
      '--rm-text-muted':   '#406040',
      '--rm-accent':       '#66bb6a',
      '--rm-accent-soft':  'rgba(102,187,106,0.15)',
      '--rm-border':       'rgba(212,240,208,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  ocean: {
    light: {
      '--rm-bg-main':      '#f0f5fa',
      '--rm-bg-surface':   '#ffffff',
      '--rm-bg-elevated':  '#ffffff',
      '--rm-text':         '#0d2040',
      '--rm-text-secondary': '#3a5878',
      '--rm-text-muted':   '#7090b0',
      '--rm-accent':       '#1565c0',
      '--rm-accent-soft':  'rgba(21,101,192,0.12)',
      '--rm-border':       'rgba(13,32,64,0.1)',
      '--rm-shadow':       '0 2px 8px rgba(13,32,64,0.12)',
    },
    dark: {
      '--rm-bg-main':      '#0a1628',
      '--rm-bg-surface':   '#0f2040',
      '--rm-bg-elevated':  '#162a52',
      '--rm-text':         '#d0e8f8',
      '--rm-text-secondary': '#7090b8',
      '--rm-text-muted':   '#3a5070',
      '--rm-accent':       '#42a5f5',
      '--rm-accent-soft':  'rgba(66,165,245,0.15)',
      '--rm-border':       'rgba(208,232,248,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
  midnight: {
    dark: {
      '--rm-bg-main':      '#0d1117',
      '--rm-bg-surface':   '#161b22',
      '--rm-bg-elevated':  '#21262d',
      '--rm-text':         '#e6edf3',
      '--rm-text-secondary': '#7d8590',
      '--rm-text-muted':   '#484f58',
      '--rm-accent':       '#7c3aed',
      '--rm-accent-soft':  'rgba(124,58,237,0.2)',
      '--rm-border':       'rgba(230,237,243,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  ember: {
    dark: {
      '--rm-bg-main':      '#111111',
      '--rm-bg-surface':   '#1c1210',
      '--rm-bg-elevated':  '#261a15',
      '--rm-text':         '#f0e0d0',
      '--rm-text-secondary': '#a07060',
      '--rm-text-muted':   '#584030',
      '--rm-accent':       '#f57c00',
      '--rm-accent-soft':  'rgba(245,124,0,0.18)',
      '--rm-border':       'rgba(240,224,208,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.5)',
    },
  },
  blossom: {
    light: {
      '--rm-bg-main':      '#fdf6f8',
      '--rm-bg-surface':   '#ffffff',
      '--rm-bg-elevated':  '#ffffff',
      '--rm-text':         '#2d1520',
      '--rm-text-secondary': '#7a4060',
      '--rm-text-muted':   '#b08090',
      '--rm-accent':       '#c2185b',
      '--rm-accent-soft':  'rgba(194,24,91,0.12)',
      '--rm-border':       'rgba(45,21,32,0.1)',
      '--rm-shadow':       '0 2px 8px rgba(45,21,32,0.12)',
    },
    dark: {
      '--rm-bg-main':      '#1a0d12',
      '--rm-bg-surface':   '#241420',
      '--rm-bg-elevated':  '#2e1a28',
      '--rm-text':         '#f8d0de',
      '--rm-text-secondary': '#c070a0',
      '--rm-text-muted':   '#603050',
      '--rm-accent':       '#f48fb1',
      '--rm-accent-soft':  'rgba(244,143,177,0.15)',
      '--rm-border':       'rgba(248,208,222,0.08)',
      '--rm-shadow':       '0 2px 8px rgba(0,0,0,0.4)',
    },
  },
};

const FONT_SIZE_MAP = { small: '13px', medium: '15px', large: '17px' };

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------

class RecipeManagerCard extends LitElement {
  static properties = {
    hass:            { type: Object },
    _config:         { type: Object },
    _view:           { type: String },   // 'grid' | 'detail' | 'planner' | 'settings'
    _recipes:        { type: Array },
    _tags:           { type: Array },
    _selectedRecipe: { type: Object },
    _loading:        { type: Boolean },
    _error:          { type: String },
    _searchQuery:    { type: String },
    _activeTag:      { type: String },
    _showAddDialog:  { type: Boolean },
    _shoppingLists:  { type: Array },
    _settings:       { type: Object },
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
    this._settings = loadSettings();
    this._unsubscribe = null;
    this._darkModeQuery = null;
  }

  setConfig(config) {
    this._config = config;
  }

  static getConfigElement() {
    return document.createElement('recipe-manager-card-editor');
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() { return 6; }

  // -- Lifecycle ------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    this._darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._darkModeQuery.addEventListener('change', this._onSystemDarkChange);
    this._applyTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    this._darkModeQuery?.removeEventListener('change', this._onSystemDarkChange);
  }

  _onSystemDarkChange = () => {
    if (this._settings.darkMode === 'system') this._applyTheme();
  };

  updated(changedProps) {
    if (changedProps.has('hass') && this.hass && !this._api) {
      this._api = new RecipeManagerAPI(this.hass);
      this._init();
    }
    if (changedProps.has('hass') && this._api) {
      this._api.hass = this.hass;
    }
    if (changedProps.has('_settings')) {
      this._applyTheme();
    }
  }

  // -- Theme ----------------------------------------------------------------

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
    for (const [key, val] of Object.entries(vars)) {
      this.style.setProperty(key, val);
    }
    this.style.setProperty('--rm-font-size-base', FONT_SIZE_MAP[s.fontSize] ?? '15px');
    this.style.setProperty(
      '--rm-grid-columns',
      `repeat(${s.columns ?? 3}, minmax(0, 1fr))`,
    );
  }

  // -- Data -----------------------------------------------------------------

  async _init() {
    this._loading = true;
    try {
      await Promise.all([this._loadRecipes(), this._loadTags(), this._loadShoppingLists()]);
      await this._subscribe();
    } catch (e) {
      this._error = e.message || 'Failed to load recipes';
    } finally {
      this._loading = false;
    }
  }

  async _loadRecipes() {
    const result = await this._api.getAllRecipes();
    this._recipes = result?.recipes ?? [];
  }

  async _loadTags() {
    const result = await this._api.getTags();
    this._tags = result?.tags ?? [];
  }

  async _loadShoppingLists() {
    try {
      const result = await this._api.getShoppingLists();
      this._shoppingLists = result?.lists ?? [];
    } catch {
      this._shoppingLists = [];
    }
  }

  async _subscribe() {
    if (this._unsubscribe) return;
    try {
      this._unsubscribe = await this._api.subscribe((msg) => {
        const t = msg.event_type ?? msg.event;
        if (t === 'recipe_manager_recipe_added' || t === 'recipe_added' ||
            t === 'recipe_manager_recipe_updated' || t === 'recipe_updated' ||
            t === 'recipe_manager_recipe_deleted' || t === 'recipe_deleted') {
          this._loadRecipes();
          this._loadTags();
        }
      });
    } catch { /* subscriptions optional */ }
  }

  // -- Computed -------------------------------------------------------------

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

  _handleSearch(e)      { this._searchQuery = e.detail?.query ?? ''; }
  _handleTagFilter(e)   { const t = e.detail?.tag; this._activeTag = this._activeTag === t ? null : t; }
  _handleBack()         { this._view = 'grid'; this._selectedRecipe = null; }
  _handleShowPlanner()  { this._view = 'planner'; }
  _handleShowGrid()     { this._view = 'grid'; this._selectedRecipe = null; }

  _handleOpenRecipe(e) {
    this._selectedRecipe = e.detail?.recipe;
    this._view = 'detail';
  }

  async _handleToggleFavourite(e) {
    const { recipeId } = e.detail;
    await this._api.toggleFavourite(recipeId);
    await this._loadRecipes();
    if (this._selectedRecipe?.id === recipeId) {
      this._selectedRecipe = this._recipes.find(r => r.id === recipeId) ?? this._selectedRecipe;
    }
  }

  async _handleDeleteRecipe(e) {
    const { recipeId } = e.detail;
    await this._api.deleteRecipe(recipeId);
    await this._loadRecipes();
    await this._loadTags();
    this._view = 'grid';
    this._selectedRecipe = null;
  }

  async _handleUpdateRecipe(e) {
    const { recipeId, data } = e.detail;
    await this._api.updateRecipe(recipeId, data);
    await this._loadRecipes();
    await this._loadTags();
    if (this._selectedRecipe?.id === recipeId) {
      this._selectedRecipe = this._recipes.find(r => r.id === recipeId) ?? null;
    }
  }

  async _handleAddRecipe(e) {
    const { data } = e.detail;
    await this._api.addRecipe(data);
    this._showAddDialog = false;
    await this._loadRecipes();
    await this._loadTags();
  }

  async _handleImportDone() {
    await this._loadRecipes();
    await this._loadTags();
  }

  async _handleAddToShopping(e) {
    const { ingredients, listId } = e.detail;
    try {
      const results = await this._api.addIngredientsToShoppingList(listId, ingredients);
      const failed = results.filter(r => !r.success);
      if (failed.length) console.warn('Some ingredients failed to add:', failed);
    } catch (err) {
      console.error('Failed to add ingredients to shopping list:', err);
    }
  }

  // -- Render ---------------------------------------------------------------

  render() {
    const s = this._settings;
    const inSettings = this._view === 'settings';
    const inGrid = this._view === 'grid';

    return html`
      <ha-card class="rm-card">
        <div class="rm-header">
          <div class="rm-header-left">
            ${this._view !== 'grid' && !inSettings ? html`
              <button class="icon-btn" @click=${this._handleShowGrid} title="Back to recipes">
                <ha-icon icon="mdi:arrow-left"></ha-icon>
              </button>
            ` : html`
              <ha-icon icon="mdi:chef-hat" class="rm-logo"></ha-icon>
            `}
            <span class="rm-title">
              ${inSettings            ? 'Settings'
                : this._view === 'detail' && this._selectedRecipe ? this._selectedRecipe.name
                : this._view === 'planner'                        ? 'Meal Planner'
                :                                                   'Recipes'}
            </span>
          </div>
          <div class="rm-header-right">
            ${inSettings ? html`
              <button class="icon-btn" @click=${() => { this._view = 'grid'; }} title="Close settings">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : inGrid ? html`
              <button class="icon-btn" @click=${() => { this._showAddDialog = true; }} title="Add recipe">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
              ${s.showPlanner ? html`
                <button class="icon-btn" @click=${this._handleShowPlanner} title="Meal planner">
                  <ha-icon icon="mdi:calendar-week"></ha-icon>
                </button>
              ` : ''}
              <button class="icon-btn" @click=${() => { this._view = 'settings'; }} title="Settings">
                <ha-icon icon="mdi:cog-outline"></ha-icon>
              </button>
            ` : this._view === 'planner' ? html`
              <button class="icon-btn" @click=${this._handleShowGrid} title="Back to recipes">
                <ha-icon icon="mdi:view-grid"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="rm-body">
          ${inSettings ? html`
            <rm-settings-view
              .settings=${this._settings}
              @rm-settings-change=${this._handleSettingsChange}
              @rm-settings-close=${() => { this._view = 'grid'; }}
            ></rm-settings-view>
          ` : this._loading ? html`
            <div class="rm-loading">
              <ha-circular-progress active size="large"></ha-circular-progress>
            </div>
          ` : this._error ? html`
            <div class="rm-error">
              <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              <p>${this._error}</p>
              <button class="text-btn" @click=${this._init.bind(this)}>Retry</button>
            </div>
          ` : this._view === 'grid' ? html`
            <rm-recipe-grid
              .recipes=${this._filteredRecipes}
              .allRecipes=${this._recipes}
              .tags=${this._tags}
              .searchQuery=${this._searchQuery}
              .activeTag=${this._activeTag}
              .columns=${this._settings.columns}
              .showFavourites=${this._settings.showFavourites}
              @rm-search=${this._handleSearch}
              @rm-tag-filter=${this._handleTagFilter}
              @rm-open-recipe=${this._handleOpenRecipe}
              @rm-toggle-favourite=${this._handleToggleFavourite}
            ></rm-recipe-grid>
          ` : this._view === 'detail' ? html`
            <rm-recipe-detail
              .recipe=${this._selectedRecipe}
              .api=${this._api}
              .shoppingLists=${this._shoppingLists}
              @rm-back=${this._handleBack}
              @rm-toggle-favourite=${this._handleToggleFavourite}
              @rm-delete-recipe=${this._handleDeleteRecipe}
              @rm-update-recipe=${this._handleUpdateRecipe}
              @rm-add-to-shopping=${this._handleAddToShopping}
            ></rm-recipe-detail>
          ` : this._view === 'planner' ? html`
            <rm-meal-planner
              .api=${this._api}
              .recipes=${this._recipes}
              @rm-open-recipe=${this._handleOpenRecipe}
            ></rm-meal-planner>
          ` : ''}
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
      /* Default (warm, light) — overridden at runtime by _applyTheme() */
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
      flex-direction: column;
      min-height: 500px;
      max-height: 85vh;
      color: var(--rm-text);
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
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rm-logo {
      color: var(--rm-accent);
      --mdc-icon-size: 24px;
    }

    .rm-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--rm-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .rm-body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-secondary);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      padding: 0;
    }
    .icon-btn:hover { background: var(--rm-border); color: var(--rm-text); }
    .icon-btn.active { color: var(--rm-accent); }

    .text-btn {
      background: var(--rm-accent);
      color: #fff;
      border: none;
      border-radius: var(--rm-radius-sm);
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .rm-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    .rm-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;
      color: var(--rm-text-secondary);
      text-align: center;
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
