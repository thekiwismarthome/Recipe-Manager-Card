/**
 * Recipe grid view — search bar, tag chips, and recipe tiles.
 */
import { LitElement, html, css } from 'lit';

class RmRecipeGrid extends LitElement {
  static properties = {
    recipes: { type: Array },
    allRecipes: { type: Array },
    tags: { type: Array },
    searchQuery: { type: String },
    activeTag: { type: String },
  };

  constructor() {
    super();
    this.recipes = [];
    this.allRecipes = [];
    this.tags = [];
    this.searchQuery = '';
    this.activeTag = null;
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

  _formatTime(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
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
        </div>
        <div class="recipe-info">
          <h3 class="recipe-name">${recipe.name}</h3>
          ${recipe.description ? html`
            <p class="recipe-desc">${recipe.description}</p>
          ` : ''}
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

  render() {
    const favourites = this.recipes.filter(r => r.is_favourite);
    const showFavSection = !this.activeTag && !this.searchQuery && favourites.length > 0;
    const mainList = showFavSection ? this.recipes.filter(r => !r.is_favourite) : this.recipes;

    return html`
      <div class="grid-container">
        <!-- Search bar -->
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

        <!-- Tag chips -->
        ${this.tags.length ? html`
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
        <div class="grid-scroll">
          ${this.recipes.length === 0 ? html`
            <div class="empty-state">
              <ha-icon icon="mdi:pot-steam-outline"></ha-icon>
              <p>${this.searchQuery || this.activeTag ? 'No matching recipes' : 'No recipes yet — add one!'}</p>
            </div>
          ` : html`
            <!-- Favourites section -->
            ${showFavSection ? html`
              <div class="section-label">Favourites</div>
              <div class="recipe-grid">
                ${favourites.map(r => this._renderRecipeCard(r))}
              </div>
              ${mainList.length ? html`<div class="section-label">All Recipes</div>` : ''}
            ` : ''}

            <!-- Main grid -->
            <div class="recipe-grid">
              ${mainList.map(r => this._renderRecipeCard(r))}
            </div>
          `}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; }

    .grid-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* Search */
    .search-row {
      padding: 10px 14px 6px;
      flex-shrink: 0;
    }
    .search-wrap {
      display: flex;
      align-items: center;
      background: var(--rm-surface, #2c2c2e);
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

    /* Tags */
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
      background: var(--rm-surface, #2c2c2e);
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
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    /* Recipe card */
    .recipe-card {
      background: var(--rm-surface, #2c2c2e);
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
    .recipe-desc {
      margin: 0 0 6px;
      font-size: 12px;
      color: var(--rm-text-secondary, #8e8e93);
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
  `;
}

customElements.define('rm-recipe-grid', RmRecipeGrid);
