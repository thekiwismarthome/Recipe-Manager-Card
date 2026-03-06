/**
 * Weekly meal planner view.
 */
import { LitElement, html, css } from 'lit';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

class RmMealPlanner extends LitElement {
  static properties = {
    api: { type: Object },
    recipes: { type: Array },
    _weekStart: { type: String },    // ISO date string YYYY-MM-DD (Monday)
    _plan: { type: Array },          // MealPlanEntry[]
    _loading: { type: Boolean },
    _showPicker: { type: Boolean },  // show recipe picker modal
    _pickerTarget: { type: Object }, // { date, mealType }
    _pickerSearch: { type: String },
    _pickerServings: { type: Number },
  };

  constructor() {
    super();
    this.api = null;
    this.recipes = [];
    this._plan = [];
    this._loading = false;
    this._showPicker = false;
    this._pickerTarget = null;
    this._pickerSearch = '';
    this._pickerServings = 2;
    this._weekStart = this._getMondayISO(new Date());
  }

  updated(changedProps) {
    if ((changedProps.has('api') || changedProps.has('_weekStart')) && this.api) {
      this._loadPlan();
    }
  }

  _getMondayISO(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  _addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  _formatDisplayDate(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    return d.getDate().toString();
  }

  _formatMonthYear(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  _prevWeek() {
    this._weekStart = this._addDays(this._weekStart, -7);
  }

  _nextWeek() {
    this._weekStart = this._addDays(this._weekStart, 7);
  }

  _isCurrentWeek() {
    return this._weekStart === this._getMondayISO(new Date());
  }

  async _loadPlan() {
    this._loading = true;
    try {
      const result = await this.api.getMealPlan(this._weekStart);
      this._plan = result?.entries ?? [];
    } catch (err) {
      this._plan = [];
    } finally {
      this._loading = false;
    }
  }

  _getEntriesForSlot(date, mealType) {
    return this._plan.filter(e => e.date === date && e.meal_type === mealType);
  }

  _openPicker(date, mealType) {
    this._pickerTarget = { date, mealType };
    this._pickerSearch = '';
    this._pickerServings = 2;
    this._showPicker = true;
  }

  async _handlePickRecipe(recipe) {
    if (!this._pickerTarget) return;
    await this.api.addToMealPlan(
      recipe.id,
      this._pickerTarget.date,
      this._pickerTarget.mealType,
      this._pickerServings
    );
    this._showPicker = false;
    await this._loadPlan();
  }

  async _handleRemoveEntry(entryId) {
    await this.api.removeFromMealPlan(entryId);
    await this._loadPlan();
  }

  async _handleClearWeek() {
    await this.api.clearMealPlanWeek(this._weekStart);
    await this._loadPlan();
  }

  _openRecipeDetail(entry) {
    const recipe = this.recipes.find(r => r.id === entry.recipe_id);
    if (!recipe) return;
    this.dispatchEvent(new CustomEvent('rm-open-recipe', {
      detail: { recipe },
      bubbles: true,
      composed: true,
    }));
  }

  get _pickerFiltered() {
    const q = this._pickerSearch.trim().toLowerCase();
    if (!q) return this.recipes;
    return this.recipes.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  render() {
    const days = Array.from({ length: 7 }, (_, i) => this._addDays(this._weekStart, i));
    const today = new Date().toISOString().split('T')[0];

    return html`
      <div class="planner-container">
        <!-- Week navigation -->
        <div class="week-nav">
          <button class="nav-btn" @click=${this._prevWeek}>
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <div class="week-label">
            <span class="week-month">${this._formatMonthYear(this._weekStart)}</span>
            ${this._isCurrentWeek() ? html`<span class="today-badge">This week</span>` : html`
              <button class="text-link" @click=${() => { this._weekStart = this._getMondayISO(new Date()); }}>Today</button>
            `}
          </div>
          <button class="nav-btn" @click=${this._nextWeek}>
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
        </div>

        <!-- Day headers -->
        <div class="day-headers">
          ${days.map((date, i) => html`
            <div class="day-header ${date === today ? 'today' : ''}">
              <span class="day-name">${DAY_NAMES[i]}</span>
              <span class="day-num">${this._formatDisplayDate(date)}</span>
            </div>
          `)}
        </div>

        <!-- Plan grid scroll -->
        <div class="plan-scroll">
          ${this._loading ? html`
            <div class="plan-loading"><ha-circular-progress active></ha-circular-progress></div>
          ` : html`
            ${MEAL_TYPES.map(mealType => html`
              <div class="meal-row">
                <div class="meal-label">${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</div>
                <div class="meal-cells">
                  ${days.map(date => {
                    const entries = this._getEntriesForSlot(date, mealType);
                    return html`
                      <div class="meal-cell ${date === today ? 'today' : ''}">
                        ${entries.map(entry => {
                          const recipe = this.recipes.find(r => r.id === entry.recipe_id);
                          return html`
                            <div class="meal-entry" @click=${() => this._openRecipeDetail(entry)}>
                              ${recipe?.image_url ? html`
                                <img src="${recipe.image_url}" alt="${recipe?.name || ''}" class="entry-thumb" />
                              ` : html`
                                <div class="entry-thumb entry-placeholder"><ha-icon icon="mdi:food"></ha-icon></div>
                              `}
                              <span class="entry-name">${recipe?.name ?? 'Unknown'}</span>
                              ${entry.servings && entry.servings !== 1 ? html`
                                <span class="entry-servings">×${entry.servings}</span>
                              ` : ''}
                              <button
                                class="entry-remove"
                                @click=${(e) => { e.stopPropagation(); this._handleRemoveEntry(entry.id); }}
                              >
                                <ha-icon icon="mdi:close"></ha-icon>
                              </button>
                            </div>
                          `;
                        })}
                        <button class="add-slot-btn" @click=${() => this._openPicker(date, mealType)}>
                          <ha-icon icon="mdi:plus"></ha-icon>
                        </button>
                      </div>
                    `;
                  })}
                </div>
              </div>
            `)}
          `}

          <!-- Clear week button -->
          ${this._plan.length ? html`
            <div class="clear-row">
              <button class="text-danger-btn" @click=${this._handleClearWeek}>
                <ha-icon icon="mdi:calendar-remove-outline"></ha-icon>
                Clear this week
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Recipe picker dialog -->
        ${this._showPicker ? this._renderPicker() : ''}
      </div>
    `;
  }

  _renderPicker() {
    const target = this._pickerTarget;
    return html`
      <div class="picker-overlay" @click=${(e) => { if (e.target === e.currentTarget) this._showPicker = false; }}>
        <div class="picker-panel">
          <div class="picker-header">
            <span>Add to ${target.mealType}</span>
            <button class="icon-btn" @click=${() => { this._showPicker = false; }}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="picker-servings-row">
            <span class="picker-label">Servings:</span>
            <div class="servings-ctrl">
              <button class="scaler-btn" @click=${() => { if (this._pickerServings > 1) this._pickerServings--; }}>
                <ha-icon icon="mdi:minus"></ha-icon>
              </button>
              <span class="servings-val">${this._pickerServings}</span>
              <button class="scaler-btn" @click=${() => { this._pickerServings++; }}>
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
            </div>
          </div>
          <div class="picker-search-wrap">
            <ha-icon icon="mdi:magnify" class="search-icon"></ha-icon>
            <input
              type="text"
              class="picker-search"
              placeholder="Search recipes…"
              .value=${this._pickerSearch}
              @input=${e => { this._pickerSearch = e.target.value; }}
            />
          </div>
          <div class="picker-list">
            ${this._pickerFiltered.length === 0 ? html`
              <div class="picker-empty">No recipes found</div>
            ` : this._pickerFiltered.map(recipe => html`
              <div class="picker-item" @click=${() => this._handlePickRecipe(recipe)}>
                ${recipe.image_url ? html`
                  <img src="${recipe.image_url}" alt="${recipe.name}" class="picker-thumb" />
                ` : html`
                  <div class="picker-thumb picker-placeholder"><ha-icon icon="mdi:food"></ha-icon></div>
                `}
                <div class="picker-info">
                  <span class="picker-name">${recipe.name}</span>
                  ${recipe.tags?.length ? html`<span class="picker-tags">${recipe.tags.slice(0, 2).join(', ')}</span>` : ''}
                </div>
                ${recipe.is_favourite ? html`<ha-icon icon="mdi:heart" class="picker-fav"></ha-icon>` : ''}
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; }

    .planner-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    /* Week nav */
    .week-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
    }
    .nav-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; padding: 0;
    }
    .nav-btn:hover { background: var(--rm-border, rgba(255,255,255,0.08)); }
    .week-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--rm-text, #e5e5ea);
    }
    .today-badge {
      font-size: 11px;
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
      border-radius: 10px;
      padding: 2px 8px;
    }
    .text-link {
      background: none; border: none; cursor: pointer;
      color: var(--rm-accent, #ff6b35);
      font-size: 12px; padding: 0;
    }

    /* Day headers */
    .day-headers {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      padding: 6px 8px 4px;
      flex-shrink: 0;
    }
    .day-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .day-name { font-size: 10px; text-transform: uppercase; color: var(--rm-text-secondary, #8e8e93); letter-spacing: 0.05em; }
    .day-num { font-size: 14px; font-weight: 600; color: var(--rm-text, #e5e5ea); }
    .day-header.today .day-num {
      background: var(--rm-accent, #ff6b35);
      color: #fff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    /* Plan scroll */
    .plan-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 4px 8px 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }

    .plan-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
    }

    .meal-row { margin-bottom: 8px; }
    .meal-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--rm-text-secondary, #8e8e93);
      font-weight: 600;
      padding: 4px 2px 3px;
    }
    .meal-cells {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 3px;
    }
    .meal-cell {
      min-height: 48px;
      background: var(--rm-surface, #2c2c2e);
      border-radius: 6px;
      padding: 3px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border: 1px solid transparent;
    }
    .meal-cell.today { border-color: var(--rm-accent, #ff6b35); }

    .meal-entry {
      display: flex;
      align-items: center;
      gap: 3px;
      background: var(--rm-bg-elevated, #1c1c1e);
      border-radius: 4px;
      padding: 2px 2px 2px 4px;
      cursor: pointer;
      font-size: 10px;
      color: var(--rm-text, #e5e5ea);
      position: relative;
      min-height: 22px;
      max-height: 22px;
      overflow: hidden;
    }
    .entry-thumb {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .entry-placeholder {
      background: var(--rm-border, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .entry-placeholder ha-icon { --mdc-icon-size: 10px; }
    .entry-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
    }
    .entry-servings { font-size: 9px; color: var(--rm-text-secondary, #8e8e93); flex-shrink: 0; }
    .entry-remove {
      background: rgba(0,0,0,0.35);
      border: none;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      min-width: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding: 0;
      opacity: 1;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .entry-remove:hover { background: rgba(207,102,121,0.8); }
    .entry-remove ha-icon { --mdc-icon-size: 10px; }

    .add-slot-btn {
      background: none;
      border: 1px dashed var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 4px;
      cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, color 0.15s;
      padding: 0;
      margin-top: auto;
    }
    .add-slot-btn ha-icon { --mdc-icon-size: 12px; }
    .add-slot-btn:hover { border-color: var(--rm-accent, #ff6b35); color: var(--rm-accent, #ff6b35); }

    .clear-row {
      display: flex;
      justify-content: center;
      padding: 8px;
    }
    .text-danger-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--error-color, #cf6679);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      border-radius: 6px;
      opacity: 0.8;
    }
    .text-danger-btn:hover { opacity: 1; background: rgba(207, 102, 121, 0.1); }
    .text-danger-btn ha-icon { --mdc-icon-size: 16px; }

    /* Picker */
    .picker-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      z-index: 20;
    }
    .picker-panel {
      background: var(--rm-bg-surface, #1c1c1e);
      border-radius: var(--rm-radius, 12px) var(--rm-radius, 12px) 0 0;
      width: 100%;
      max-height: 80%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
    }
    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      font-weight: 600;
      font-size: 15px;
      color: var(--rm-text, #e5e5ea);
      text-transform: capitalize;
      flex-shrink: 0;
    }
    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; padding: 0;
    }

    .picker-servings-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
      flex-shrink: 0;
    }
    .picker-label { font-size: 13px; color: var(--rm-text-secondary, #8e8e93); }
    .servings-ctrl { display: flex; align-items: center; gap: 8px; }
    .scaler-btn {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      border-radius: 50%;
      width: 26px; height: 26px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--rm-text, #e5e5ea); padding: 0;
    }
    .scaler-btn ha-icon { --mdc-icon-size: 14px; }
    .servings-val { font-size: 14px; font-weight: 600; color: var(--rm-text, #e5e5ea); min-width: 24px; text-align: center; }

    .picker-search-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
      flex-shrink: 0;
    }
    .search-icon { color: var(--rm-text-secondary, #8e8e93); --mdc-icon-size: 18px; }
    .picker-search {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--rm-text, #e5e5ea);
      font-size: 14px;
      padding: 4px 0;
    }
    .picker-search::placeholder { color: var(--rm-text-secondary, #8e8e93); }

    .picker-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }
    .picker-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.05));
      transition: background 0.12s;
    }
    .picker-item:hover { background: var(--rm-surface, #2c2c2e); }
    .picker-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .picker-placeholder {
      background: var(--rm-surface, #2c2c2e);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text-secondary, #8e8e93);
    }
    .picker-placeholder ha-icon { --mdc-icon-size: 22px; }
    .picker-info { flex: 1; min-width: 0; }
    .picker-name { font-size: 14px; font-weight: 500; color: var(--rm-text, #e5e5ea); display: block; }
    .picker-tags { font-size: 12px; color: var(--rm-text-secondary, #8e8e93); }
    .picker-fav { color: var(--error-color, #cf6679); --mdc-icon-size: 16px; }
    .picker-empty { padding: 30px; text-align: center; color: var(--rm-text-secondary, #8e8e93); font-size: 14px; }
  `;
}

if (!customElements.get('rm-meal-planner')) customElements.define('rm-meal-planner', RmMealPlanner);
