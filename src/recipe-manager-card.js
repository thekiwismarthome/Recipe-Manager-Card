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

class RecipeManagerCard extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _view: { type: String },           // 'grid' | 'detail' | 'planner'
    _recipes: { type: Array },
    _tags: { type: Array },
    _selectedRecipe: { type: Object },
    _loading: { type: Boolean },
    _error: { type: String },
    _searchQuery: { type: String },
    _activeTag: { type: String },
    _showAddDialog: { type: Boolean },
    _shoppingLists: { type: Array },
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
    this._unsubscribe = null;
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

  // HA card size hint
  getCardSize() { return 6; }

  updated(changedProps) {
    if (changedProps.has('hass') && this.hass && !this._api) {
      this._api = new RecipeManagerAPI(this.hass);
      this._init();
    }
    if (changedProps.has('hass') && this._api) {
      this._api.hass = this.hass;
    }
  }

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
        if (msg.event === 'recipe_added' || msg.event === 'recipe_updated' || msg.event === 'recipe_deleted') {
          this._loadRecipes();
          this._loadTags();
        }
      });
    } catch { /* subscriptions optional */ }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  // -- Computed -----------------------------------------------------------------

  get _filteredRecipes() {
    let list = this._recipes;
    if (this._activeTag) {
      list = list.filter(r => r.tags?.includes(this._activeTag));
    }
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

  // -- Event handlers -----------------------------------------------------------

  _handleSearch(e) {
    this._searchQuery = e.detail?.query ?? '';
  }

  _handleTagFilter(e) {
    const tag = e.detail?.tag;
    this._activeTag = this._activeTag === tag ? null : tag;
  }

  _handleOpenRecipe(e) {
    this._selectedRecipe = e.detail?.recipe;
    this._view = 'detail';
  }

  _handleBack() {
    this._view = 'grid';
    this._selectedRecipe = null;
  }

  _handleShowPlanner() {
    this._view = 'planner';
  }

  _handleShowGrid() {
    this._view = 'grid';
    this._selectedRecipe = null;
  }

  async _handleToggleFavourite(e) {
    const { recipeId } = e.detail;
    await this._api.toggleFavourite(recipeId);
    await this._loadRecipes();
    // Update selectedRecipe if open
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
      if (failed.length) {
        console.warn('Some ingredients failed to add:', failed);
      }
    } catch (err) {
      console.error('Failed to add ingredients to shopping list:', err);
    }
  }

  // -- Render -------------------------------------------------------------------

  render() {
    return html`
      <ha-card class="rm-card">
        <div class="rm-header">
          <div class="rm-header-left">
            ${this._view !== 'grid' ? html`
              <button class="icon-btn" @click=${this._handleShowGrid} title="Back to recipes">
                <ha-icon icon="mdi:arrow-left"></ha-icon>
              </button>
            ` : html`
              <ha-icon icon="mdi:chef-hat" class="rm-logo"></ha-icon>
            `}
            <span class="rm-title">
              ${this._view === 'detail' && this._selectedRecipe
                ? this._selectedRecipe.name
                : this._view === 'planner'
                  ? 'Meal Planner'
                  : 'Recipes'}
            </span>
          </div>
          <div class="rm-header-right">
            ${this._view === 'grid' ? html`
              <button class="icon-btn" @click=${() => { this._showAddDialog = true; }} title="Add recipe">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
              <button class="icon-btn ${this._view === 'planner' ? 'active' : ''}" @click=${this._handleShowPlanner} title="Meal planner">
                <ha-icon icon="mdi:calendar-week"></ha-icon>
              </button>
            ` : this._view === 'planner' ? html`
              <button class="icon-btn" @click=${this._handleShowGrid} title="Back to recipes">
                <ha-icon icon="mdi:view-grid"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="rm-body">
          ${this._loading ? html`
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
      --rm-bg: var(--card-background-color, #1c1c1e);
      --rm-surface: var(--secondary-background-color, #2c2c2e);
      --rm-text: var(--primary-text-color, #e5e5ea);
      --rm-text-secondary: var(--secondary-text-color, #8e8e93);
      --rm-accent: var(--primary-color, #ff6b35);
      --rm-accent-soft: rgba(255, 107, 53, 0.15);
      --rm-border: rgba(255,255,255,0.08);
      --rm-radius: 12px;
      --rm-radius-sm: 8px;
      --rm-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    ha-card.rm-card {
      background: var(--rm-bg);
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
      background: var(--rm-surface);
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
