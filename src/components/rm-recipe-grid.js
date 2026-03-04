/**
 * Recipe grid view — filter tabs, tag chips, and recipe tiles.
 * In wide (tablet/desktop) mode the search bar is hidden (it lives in the sidebar).
 */
import { LitElement, html, css } from 'lit';

class RmRecipeGrid extends LitElement {
  static properties = {
    recipes:        { type: Array },
    allRecipes:     { type: Array },
    tags:           { type: Array },
    searchQuery:    { type: String },
    activeTag:      { type: String },
    columns:        { type: Number },
    showFavourites: { type: Boolean },
    hideSidebar:    { type: Boolean },  // true when sidebar is shown (wide view)
    scrollPos:      { type: Number },   // scroll position to restore on mount
    recentRecipes:  { type: Array },    // recently viewed recipes
    recentCount:    { type: Number },
    _filterMode:    { type: String },   // 'all'|'courses'|'categories'|'favourites'|'recent'
    _infoRecipe:    { type: Object },   // recipe shown in quick-info popup
  };

  constructor() {
    super();
    this.recipes = [];
    this.allRecipes = [];
    this.tags = [];
    this.searchQuery = '';
    this.activeTag = null;
    this.columns = 3;
    this.showFavourites = true;
    this.hideSidebar = false;
    this.scrollPos = 0;
    this.recentRecipes = [];
    this.recentCount = 12;
    this._filterMode = 'all';
    this._infoRecipe = null;
    this._lastScrollPos = 0;
  }

  updated(changedProps) {
    if (changedProps.has('scrollPos') && this.scrollPos > 0) {
      // Restore scroll position after the grid re-mounts
      this.updateComplete.then(() => {
        requestAnimationFrame(() => {
          const el = this.shadowRoot?.querySelector('.grid-scroll');
          if (el) el.scrollTop = this.scrollPos;
        });
      });
    }
  }

  _handleSearchInput(e) {
    this.dispatchEvent(new CustomEvent('rm-search', {
      detail: { query: e.target.value },
      bubbles: true,
      composed: true,
    }));
  }

  _handleClearSearch() {
    this.dispatchEvent(new CustomEvent('rm-search', {
      detail: { query: '' },
      bubbles: true,
      composed: true,
    }));
  }

  _handleTagClick(tag) {
    this.dispatchEvent(new CustomEvent('rm-tag-filter', {
      detail: { tag },
      bubbles: true,
      composed: true,
    }));
  }

  _handleOpenRecipe(recipe) {
    this.dispatchEvent(new CustomEvent('rm-open-recipe', {
      detail: { recipe },
      bubbles: true,
      composed: true,
    }));
  }

  _handleToggleFavourite(e, recipe) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('rm-toggle-favourite', {
      detail: { recipeId: recipe.id },
      bubbles: true,
      composed: true,
    }));
  }

  _showInfo(e, recipe) {
    e.stopPropagation();
    this._infoRecipe = this._infoRecipe?.id === recipe.id ? null : recipe;
  }

  _formatTime(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  // -- Compute filtered list per filter mode --------------------------------

  _getFilteredList() {
    const base = this.recipes; // already filtered by search + activeTag from parent
    switch (this._filterMode) {
      case 'favourites':
        return this.allRecipes.filter(r => r.is_favourite)
          .filter(r => base.find(b => b.id === r.id));
      case 'recent':
        return this.recentRecipes.slice(0, this.recentCount)
          .filter(r => base.find(b => b.id === r.id));
      default:
        return base;
    }
  }

  // Distinct courses / categories across ALL recipes (for filter sub-chips)
  get _allCourses() {
    const set = new Set();
    this.allRecipes.forEach(r => (r.courses || []).forEach(c => set.add(c)));
    return [...set].sort();
  }

  get _allCategories() {
    const set = new Set();
    this.allRecipes.forEach(r => (r.categories || []).forEach(c => set.add(c)));
    return [...set].sort();
  }

  _renderRecipeCard(recipe) {
    const totalTime = recipe.total_time || (recipe.prep_time || 0) + (recipe.cook_time || 0) || null;
    return html`
      <div class="recipe-card" @click=${() => this._handleOpenRecipe(recipe)}>
        <div class="recipe-thumb">
          ${recipe.image_url ? html`
            <img src="${recipe.image_url}" alt="${recipe.name}" loading="lazy" />
          ` : html`
            <div class="recipe-thumb-placeholder">
              <ha-icon icon="mdi:food"></ha-icon>
            </div>
          `}
          <button
            class="fav-btn ${recipe.is_favourite ? 'active' : ''}"
            @click=${(e) => this._handleToggleFavourite(e, recipe)}
            title="${recipe.is_favourite ? 'Remove from favourites' : 'Add to favourites'}"
          >
            <ha-icon icon="${recipe.is_favourite ? 'mdi:heart' : 'mdi:heart-outline'}"></ha-icon>
          </button>
          <!-- Info icon — bottom right of thumbnail -->
          <button
            class="info-btn"
            @click=${(e) => this._showInfo(e, recipe)}
            title="Quick info"
          >
            <ha-icon icon="mdi:information-outline"></ha-icon>
          </button>
        </div>
        <div class="recipe-info">
          <h3 class="recipe-name">${recipe.name}</h3>
          <div class="recipe-meta">
            ${totalTime ? html`
              <span class="meta-chip">
                <ha-icon icon="mdi:clock-outline"></ha-icon>
                ${this._formatTime(totalTime)}
              </span>
            ` : ''}
            ${recipe.servings ? html`
              <span class="meta-chip">
                <ha-icon icon="mdi:account-group-outline"></ha-icon>
                ${recipe.servings}
              </span>
            ` : ''}
            ${recipe.tags?.length ? html`
              <span class="meta-chip tag-chip">${recipe.tags[0]}</span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderInfoPopup(recipe) {
    if (!recipe) return '';
    const totalTime = recipe.total_time || (recipe.prep_time || 0) + (recipe.cook_time || 0) || null;
    const ingCount = recipe.ingredients?.length ?? 0;
    return html`
      <div class="info-popup-overlay" @click=${() => { this._infoRecipe = null; }}>
        <div class="info-popup" @click=${e => e.stopPropagation()}>
          <div class="info-popup-header">
            <span class="info-popup-name">${recipe.name}</span>
            <button class="info-close-btn" @click=${() => { this._infoRecipe = null; }}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          ${recipe.description ? html`<p class="info-popup-desc">${recipe.description}</p>` : ''}
          <div class="info-popup-meta">
            ${totalTime ? html`<span class="info-meta-item"><ha-icon icon="mdi:clock-outline"></ha-icon>${this._formatTime(totalTime)}</span>` : ''}
            ${recipe.servings ? html`<span class="info-meta-item"><ha-icon icon="mdi:account-group-outline"></ha-icon>${recipe.servings_text || recipe.servings} servings</span>` : ''}
            ${ingCount ? html`<span class="info-meta-item"><ha-icon icon="mdi:format-list-bulleted"></ha-icon>${ingCount} ingredients</span>` : ''}
            ${recipe.courses?.length ? html`<span class="info-meta-item"><ha-icon icon="mdi:silverware-fork-knife"></ha-icon>${recipe.courses.join(', ')}</span>` : ''}
          </div>
          ${recipe.tags?.length ? html`
            <div class="info-popup-tags">
              ${recipe.tags.map(t => html`<span class="info-tag">${t}</span>`)}
            </div>
          ` : ''}
          <button class="info-open-btn" @click=${() => { this._infoRecipe = null; this._handleOpenRecipe(recipe); }}>
            Open Recipe
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const list = this._getFilteredList();
    const showFavSection = this._filterMode === 'all' && this.showFavourites && !this.activeTag && !this.searchQuery;
    const favourites = showFavSection ? list.filter(r => r.is_favourite) : [];
    const mainList = showFavSection && favourites.length ? list.filter(r => !r.is_favourite) : list;
    const gridStyle = `grid-template-columns: var(--rm-grid-columns, repeat(${this.columns}, minmax(0, 1fr)));`;

    return html`
      <div class="grid-container">
        <!-- Search bar — only shown on narrow (sidebar-less) view -->
        ${!this.hideSidebar ? html`
          <div class="search-row">
            <div class="search-wrap">
              <ha-icon icon="mdi:magnify" class="search-icon"></ha-icon>
              <input
                type="text"
                class="search-input"
                placeholder="Search recipes…"
                .value=${this.searchQuery}
                @input=${this._handleSearchInput}
              />
              ${this.searchQuery ? html`
                <button class="clear-btn" @click=${this._handleClearSearch}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Filter tabs: shown only in wide mode (hideSidebar = true) -->
        ${this.hideSidebar ? html`
          <div class="filter-tabs">
            ${[
              ['all',         'mdi:view-grid',           'All'],
              ['courses',     'mdi:silverware-fork-knife','Courses'],
              ['categories',  'mdi:tag-multiple-outline', 'Categories'],
              ['favourites',  'mdi:heart-outline',        'Favourites'],
              ['recent',      'mdi:history',              'Recent'],
            ].map(([mode, icon, label]) => html`
              <button
                class="filter-tab ${this._filterMode === mode ? 'active' : ''}"
                @click=${() => { this._filterMode = mode; }}
              >
                <ha-icon icon="${icon}"></ha-icon>
                <span>${label}</span>
              </button>
            `)}
          </div>
        ` : ''}

        <!-- Sub-filter chips for Courses / Categories -->
        ${this.hideSidebar && this._filterMode === 'courses' && this._allCourses.length ? html`
          <div class="sub-filter-row">
            ${this._allCourses.map(c => html`
              <button
                class="sub-chip ${this.activeTag === c ? 'active' : ''}"
                @click=${() => this._handleTagClick(c)}
              >${c}</button>
            `)}
          </div>
        ` : ''}
        ${this.hideSidebar && this._filterMode === 'categories' && this._allCategories.length ? html`
          <div class="sub-filter-row">
            ${this._allCategories.map(c => html`
              <button
                class="sub-chip ${this.activeTag === c ? 'active' : ''}"
                @click=${() => this._handleTagClick(c)}
              >${c}</button>
            `)}
          </div>
        ` : ''}

        <!-- Tag chips (narrow view only) -->
        ${!this.hideSidebar && this.tags.length ? html`
          <div class="tags-row">
            ${this.tags.map(tag => html`
              <button
                class="tag-btn ${this.activeTag === tag ? 'active' : ''}"
                @click=${() => this._handleTagClick(tag)}
              >${tag}</button>
            `)}
          </div>
        ` : ''}

        <!-- Recipe content -->
        <div class="grid-scroll" @scroll=${e => { this._lastScrollPos = e.target.scrollTop; }}>
          ${list.length === 0 ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:pot-steam-outline"></ha-icon>
              <p>${this.searchQuery || this.activeTag
                ? 'No matching recipes'
                : this._filterMode === 'favourites'
                  ? 'No favourites yet — heart a recipe!'
                  : this._filterMode === 'recent'
                    ? 'No recently viewed recipes yet.'
                    : 'No recipes yet — add one!'}</p>
            </div>
          ` : html`
            <!-- Favourites section (only in 'all' mode) -->
            ${showFavSection && favourites.length ? html`
              <div class="section-label">Favourites</div>
              <div class="recipe-grid" style=${gridStyle}>
                ${favourites.map(r => this._renderRecipeCard(r))}
              </div>
              ${mainList.length ? html`<div class="section-label">All Recipes</div>` : ''}
            ` : ''}

            <!-- Main grid -->
            <div class="recipe-grid" style=${gridStyle}>
              ${mainList.map(r => this._renderRecipeCard(r))}
            </div>
          `}
        </div>
      </div>

      <!-- Quick-info popup -->
      ${this._infoRecipe ? this._renderInfoPopup(this._infoRecipe) : ''}
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; position: relative; }

    .grid-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* Search (narrow only) */
    .search-row {
      padding: 10px 14px 6px;
      flex-shrink: 0;
    }
    .search-wrap {
      display: flex;
      align-items: center;
      background: var(--rm-bg-elevated, #2c2c2e);
      border-radius: 10px;
      padding: 0 10px;
      gap: 8px;
    }
    .search-icon { color: var(--rm-text-secondary, #8e8e93); --mdc-icon-size: 18px; }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--rm-text, #e5e5ea);
      font-size: 14px;
      padding: 9px 0;
    }
    .search-input::placeholder { color: var(--rm-text-secondary, #8e8e93); }
    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      padding: 2px;
      display: flex;
      align-items: center;
    }
    .clear-btn ha-icon { --mdc-icon-size: 16px; }

    /* Filter tabs (wide view) */
    .filter-tabs {
      display: flex;
      gap: 2px;
      padding: 8px 14px 4px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      overflow-x: auto;
      scrollbar-width: none;
    }
    .filter-tabs::-webkit-scrollbar { display: none; }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--rm-text-secondary, #8e8e93);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .filter-tab ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; }
    .filter-tab:hover { background: var(--rm-accent-soft, rgba(255,107,53,0.1)); color: var(--rm-text); }
    .filter-tab.active {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
      font-weight: 600;
    }

    /* Sub-filter chips */
    .sub-filter-row {
      display: flex;
      gap: 6px;
      padding: 6px 14px;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .sub-filter-row::-webkit-scrollbar { display: none; }
    .sub-chip {
      background: var(--rm-bg-elevated, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      border-radius: 20px;
      color: var(--rm-text-secondary, #8e8e93);
      font-size: 12px;
      padding: 4px 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .sub-chip.active {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      border-color: var(--rm-accent, #ff6b35);
      color: var(--rm-accent, #ff6b35);
    }

    /* Tags (narrow view) */
    .tags-row {
      display: flex;
      gap: 6px;
      padding: 4px 14px 8px;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .tags-row::-webkit-scrollbar { display: none; }
    .tag-btn {
      background: var(--rm-bg-elevated, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      border-radius: 20px;
      color: var(--rm-text-secondary, #8e8e93);
      font-size: 12px;
      padding: 4px 10px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .tag-btn.active {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      border-color: var(--rm-accent, #ff6b35);
      color: var(--rm-accent, #ff6b35);
    }

    /* Grid scroll area */
    .grid-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 4px 14px 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--rm-text-secondary, #8e8e93);
      margin: 8px 0 6px;
    }

    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    /* Recipe card */
    .recipe-card {
      background: var(--rm-bg-surface, #2c2c2e);
      border-radius: var(--rm-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      border: 1px solid var(--rm-border, rgba(255,255,255,0.08));
    }
    .recipe-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--rm-shadow, 0 2px 8px rgba(0,0,0,0.3));
    }

    .recipe-thumb {
      position: relative;
      aspect-ratio: 4/3;
      background: var(--rm-border, rgba(255,255,255,0.08));
      overflow: hidden;
    }
    .recipe-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .recipe-thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text-secondary, #8e8e93);
    }
    .recipe-thumb-placeholder ha-icon { --mdc-icon-size: 36px; }

    .fav-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.5);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.7);
      transition: color 0.15s;
      padding: 0;
    }
    .fav-btn ha-icon { --mdc-icon-size: 16px; }
    .fav-btn.active { color: var(--error-color, #cf6679); }

    /* Info icon — bottom-right of thumbnail, large and prominent */
    .info-btn {
      position: absolute;
      bottom: 6px;
      right: 6px;
      background: rgba(0,0,0,0.65);
      border: 1.5px solid rgba(255,255,255,0.4);
      border-radius: 50%;
      width: 38px;
      height: 38px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.95);
      padding: 0;
      transition: background 0.15s, transform 0.15s, border-color 0.15s;
      touch-action: manipulation;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .info-btn ha-icon { --mdc-icon-size: 24px; }
    .info-btn:hover { background: rgba(0,0,0,0.85); transform: scale(1.08); border-color: rgba(255,255,255,0.7); }

    .recipe-info {
      padding: 8px 10px 10px;
    }
    .recipe-name {
      margin: 0 0 3px;
      font-size: 14px;
      font-weight: 600;
      color: var(--rm-text, #e5e5ea);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .recipe-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--rm-text-secondary, #8e8e93);
      background: rgba(255,255,255,0.06);
      border-radius: 6px;
      padding: 2px 6px;
    }
    .meta-chip ha-icon { --mdc-icon-size: 12px; }
    .tag-chip {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 12px;
      color: var(--rm-text-secondary, #8e8e93);
      text-align: center;
    }
    .empty-state ha-icon { --mdc-icon-size: 56px; opacity: 0.4; }
    .empty-state p { margin: 0; font-size: 15px; }

    /* Quick-info popup */
    .info-popup-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .info-popup {
      background: var(--rm-bg-surface, #fff);
      border-radius: var(--rm-radius, 12px);
      width: min(360px, 100%);
      max-height: 80%;
      overflow-y: auto;
      padding: 16px;
      box-shadow: var(--rm-shadow);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .info-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .info-popup-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--rm-text);
      flex: 1;
    }

    .info-close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-secondary);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex-shrink: 0;
    }
    .info-close-btn ha-icon { --mdc-icon-size: 18px; }

    .info-popup-desc {
      margin: 0;
      font-size: 13px;
      color: var(--rm-text-secondary);
      line-height: 1.5;
    }

    .info-popup-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--rm-text-secondary);
    }
    .info-meta-item ha-icon { --mdc-icon-size: 16px; color: var(--rm-accent); flex-shrink: 0; }

    .info-popup-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .info-tag {
      background: var(--rm-accent-soft);
      color: var(--rm-accent);
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 12px;
    }

    .info-open-btn {
      background: var(--rm-accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: opacity 0.15s;
      margin-top: 4px;
    }
    .info-open-btn:hover { opacity: 0.88; }
  `;
}

customElements.define('rm-recipe-grid', RmRecipeGrid);
