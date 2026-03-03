/**
 * Recipe detail view — full recipe with ingredients, directions, nutrition, and actions.
 */
import { LitElement, html, css } from 'lit';

const NUTRITION_FIELDS = [
  { key: 'calories',      label: 'Calories',         unit: 'kcal', bold: true },
  { key: 'fat',           label: 'Total Fat',         unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated Fat',     unit: 'g', indent: true },
  { key: 'cholesterol',   label: 'Cholesterol',       unit: 'mg' },
  { key: 'sodium',        label: 'Sodium',            unit: 'mg' },
  { key: 'carbohydrates', label: 'Total Carbohydrate',unit: 'g' },
  { key: 'fiber',         label: 'Dietary Fiber',     unit: 'g', indent: true },
  { key: 'sugar',         label: 'Total Sugars',      unit: 'g', indent: true },
  { key: 'protein',       label: 'Protein',           unit: 'g' },
];

class RmRecipeDetail extends LitElement {
  static properties = {
    recipe:              { type: Object },
    api:                 { type: Object },
    shoppingLists:       { type: Array },
    slmAvailable:        { type: Boolean },
    _editing:            { type: Boolean },
    _editData:           { type: Object },
    _servingMult:        { type: Number },
    _activeTab:          { type: String },  // 'ingredients'|'directions'|'notes'|'nutrition'
    _showShoppingPicker: { type: Boolean },
    _selectedListId:     { type: String },
    _checkedIngredients: { type: Object },  // Set of indices
    _shoppingAdding:     { type: Boolean },
    _shoppingResult:     { type: String },
    _confirmDelete:      { type: Boolean },
    _downloading:        { type: Boolean },
    _hoverRating:        { type: Number },
  };

  constructor() {
    super();
    this.recipe = null;
    this.api = null;
    this.shoppingLists = [];
    this.slmAvailable = false;
    this._editing = false;
    this._editData = {};
    this._servingMult = 1;
    this._activeTab = 'ingredients';
    this._showShoppingPicker = false;
    this._selectedListId = '';
    this._checkedIngredients = null;
    this._shoppingAdding = false;
    this._shoppingResult = null;
    this._confirmDelete = false;
    this._downloading = false;
    this._hoverRating = 0;
  }

  updated(changedProps) {
    if (changedProps.has('recipe') && this.recipe) {
      this._servingMult = 1;
      this._editing = false;
      this._confirmDelete = false;
      this._shoppingResult = null;
      this._showShoppingPicker = false;
      this._checkedIngredients = null;
    }
    if (changedProps.has('shoppingLists') && this.shoppingLists.length && !this._selectedListId) {
      this._selectedListId = this.shoppingLists[0]?.id ?? '';
    }
  }

  _formatTime(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  _scaleAmount(amount) {
    if (!amount || isNaN(parseFloat(amount))) return amount;
    const scaled = parseFloat(amount) * this._servingMult;
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
  }

  // -- Actions ------------------------------------------------------------------

  _startEdit() {
    const n = this.recipe.nutrition || {};
    this._editData = {
      name:          this.recipe.name || '',
      description:   this.recipe.description || '',
      source_url:    this.recipe.source_url || '',
      servings:      this.recipe.servings || '',
      prep_time:     this.recipe.prep_time || '',
      cook_time:     this.recipe.cook_time || '',
      tags:          (this.recipe.tags || []).join(', '),
      courses:       (this.recipe.courses || []).join(', '),
      categories:    (this.recipe.categories || []).join(', '),
      collections:   (this.recipe.collections || []).join(', '),
      notes:         this.recipe.notes || '',
      rating:        this.recipe.rating || 0,
      // Nutrition
      cal:  n.calories      || '',
      fat:  n.fat           || '',
      satf: n.saturated_fat || '',
      chol: n.cholesterol   || '',
      sod:  n.sodium        || '',
      carb: n.carbohydrates || '',
      fib:  n.fiber         || '',
      sug:  n.sugar         || '',
      prot: n.protein       || '',
    };
    this._editing = true;
  }

  _cancelEdit() {
    this._editing = false;
    this._editData = {};
  }

  _handleEditField(field, value) {
    this._editData = { ...this._editData, [field]: value };
  }

  async _saveEdit() {
    const d = this._editData;
    const splitList = v => v ? v.split(',').map(t => t.trim()).filter(Boolean) : [];

    const nutrition = {};
    const nMap = { cal:'calories', fat:'fat', satf:'saturated_fat', chol:'cholesterol',
                   sod:'sodium', carb:'carbohydrates', fib:'fiber', sug:'sugar', prot:'protein' };
    let hasNutrition = false;
    for (const [k, nk] of Object.entries(nMap)) {
      if (d[k] !== '' && d[k] != null) {
        nutrition[nk] = d[k];
        hasNutrition = true;
      }
    }

    const data = {
      name:        d.name,
      description: d.description,
      source_url:  d.source_url,
      servings:    parseInt(d.servings) || null,
      prep_time:   parseInt(d.prep_time) || null,
      cook_time:   parseInt(d.cook_time) || null,
      tags:        splitList(d.tags),
      courses:     splitList(d.courses),
      categories:  splitList(d.categories),
      collections: splitList(d.collections),
      notes:       d.notes,
      rating:      d.rating || null,
      nutrition:   hasNutrition ? nutrition : null,
    };
    this.dispatchEvent(new CustomEvent('rm-update-recipe', {
      detail: { recipeId: this.recipe.id, data },
      bubbles: true,
      composed: true,
    }));
    this._editing = false;
  }

  _handleToggleFav() {
    this.dispatchEvent(new CustomEvent('rm-toggle-favourite', {
      detail: { recipeId: this.recipe.id },
      bubbles: true,
      composed: true,
    }));
  }

  _handleSetRating(rating) {
    const newRating = this.recipe.rating === rating ? null : rating;
    this.dispatchEvent(new CustomEvent('rm-update-recipe', {
      detail: { recipeId: this.recipe.id, data: { rating: newRating } },
      bubbles: true,
      composed: true,
    }));
  }

  async _handleDownloadImage() {
    if (!this.recipe.image_url) return;
    this._downloading = true;
    try {
      const result = await this.api.downloadRecipeImage(this.recipe.id, this.recipe.image_url);
      if (result?.local_url) {
        this.dispatchEvent(new CustomEvent('rm-update-recipe', {
          detail: { recipeId: this.recipe.id, data: { image_url: result.local_url } },
          bubbles: true,
          composed: true,
        }));
      }
    } catch (err) {
      console.warn('Image download failed:', err);
    } finally {
      this._downloading = false;
    }
  }

  _handleDeleteRecipe() {
    if (!this._confirmDelete) {
      this._confirmDelete = true;
      setTimeout(() => { this._confirmDelete = false; }, 3000);
      return;
    }
    this.dispatchEvent(new CustomEvent('rm-delete-recipe', {
      detail: { recipeId: this.recipe.id },
      bubbles: true,
      composed: true,
    }));
  }

  _openShoppingPicker() {
    const count = this.recipe?.ingredients?.length ?? 0;
    this._checkedIngredients = new Set([...Array(count).keys()]);
    this._showShoppingPicker = true;
  }

  _toggleIngredient(index) {
    const newSet = new Set(this._checkedIngredients);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    this._checkedIngredients = newSet;
  }

  async _handleAddToShopping() {
    const checked = this._checkedIngredients;
    if (!checked?.size) return;

    const ingredients = (this.recipe.ingredients || [])
      .filter((_, i) => checked.has(i))
      .map(ing => ({
        ...ing,
        amount: this._scaleAmount(ing.amount),
      }));

    this._shoppingAdding = true;
    this._shoppingResult = null;
    this.dispatchEvent(new CustomEvent('rm-add-to-shopping', {
      detail: { ingredients, listId: this._selectedListId || null },
      bubbles: true,
      composed: true,
    }));
    await new Promise(r => setTimeout(r, 600));
    this._shoppingAdding = false;
    this._shoppingResult = 'success';
    this._showShoppingPicker = false;
    setTimeout(() => { this._shoppingResult = null; }, 2500);
  }

  // -- Render -------------------------------------------------------------------

  _renderStars(rating, interactive = false) {
    const current = this._hoverRating || rating || 0;
    return html`
      <div class="stars ${interactive ? 'stars-interactive' : ''}">
        ${[1,2,3,4,5].map(n => html`
          <span
            class="star ${n <= current ? 'filled' : ''}"
            @mouseenter=${interactive ? () => { this._hoverRating = n; } : undefined}
            @mouseleave=${interactive ? () => { this._hoverRating = 0; } : undefined}
            @click=${interactive ? () => this._handleSetRating(n) : undefined}
          >★</span>
        `)}
      </div>
    `;
  }

  _renderChipGroup(label, items, cssClass) {
    if (!items?.length) return '';
    return html`
      <div class="chip-group">
        <span class="chip-group-label">${label}:</span>
        ${items.map(t => html`<span class="chip ${cssClass}">${t}</span>`)}
      </div>
    `;
  }

  render() {
    if (!this.recipe) return html``;
    const r = this.recipe;
    const totalTime = r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || null;

    return html`
      <div class="detail-container">
        <!-- Hero image -->
        <div class="hero ${r.image_url ? '' : 'no-image'}">
          ${r.image_url ? html`
            <img src="${r.image_url}" alt="${r.name}" />
            <div class="hero-overlay"></div>
          ` : html`
            <div class="hero-placeholder">
              <ha-icon icon="mdi:food"></ha-icon>
            </div>
          `}
          <div class="hero-actions">
            <button class="hero-btn ${r.is_favourite ? 'fav-active' : ''}" @click=${this._handleToggleFav}
              title="${r.is_favourite ? 'Remove from favourites' : 'Add to favourites'}">
              <ha-icon icon="${r.is_favourite ? 'mdi:heart' : 'mdi:heart-outline'}"></ha-icon>
            </button>
            ${r.source_url ? html`
              <a class="hero-btn" href="${r.source_url}" target="_blank" rel="noopener" title="Open source">
                <ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            ` : ''}
            <button class="hero-btn" @click=${this._startEdit} title="Edit">
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>
            <button class="hero-btn delete-btn ${this._confirmDelete ? 'confirm' : ''}" @click=${this._handleDeleteRecipe}
              title="${this._confirmDelete ? 'Confirm delete' : 'Delete recipe'}">
              <ha-icon icon="${this._confirmDelete ? 'mdi:check' : 'mdi:trash-can-outline'}"></ha-icon>
            </button>
          </div>
        </div>

        <div class="detail-scroll">
          <!-- Recipe name + meta -->
          <div class="detail-head">
            <h2 class="detail-name">${r.name}</h2>
            ${r.description ? html`<p class="detail-desc">${r.description}</p>` : ''}

            <!-- Star rating (inline, interactive) -->
            ${this._renderStars(r.rating, true)}

            <div class="meta-row">
              ${r.prep_time ? html`
                <div class="meta-item">
                  <span class="meta-label">Prep</span>
                  <span class="meta-val">${this._formatTime(r.prep_time)}</span>
                </div>
              ` : ''}
              ${r.cook_time ? html`
                <div class="meta-item">
                  <span class="meta-label">Cook</span>
                  <span class="meta-val">${this._formatTime(r.cook_time)}</span>
                </div>
              ` : ''}
              ${totalTime ? html`
                <div class="meta-item">
                  <span class="meta-label">Total</span>
                  <span class="meta-val">${this._formatTime(totalTime)}</span>
                </div>
              ` : ''}
              ${r.servings ? html`
                <div class="meta-item">
                  <span class="meta-label">Serves</span>
                  <span class="meta-val">${r.servings_text || r.servings}</span>
                </div>
              ` : ''}
            </div>

            ${r.tags?.length ? html`
              <div class="tags-row">
                ${r.tags.map(t => html`<span class="tag-chip">${t}</span>`)}
              </div>
            ` : ''}

            ${this._renderChipGroup('Courses', r.courses, 'chip-course')}
            ${this._renderChipGroup('Categories', r.categories, 'chip-category')}
            ${this._renderChipGroup('Collections', r.collections, 'chip-collection')}
          </div>

          <!-- Serving scaler -->
          ${r.servings ? html`
            <div class="scaler-row">
              <span class="scaler-label">Scale servings:</span>
              <div class="scaler-ctrl">
                <button class="scaler-btn" @click=${() => { if (this._servingMult > 0.25) this._servingMult = Math.round((this._servingMult - 0.25) * 4) / 4; }}>
                  <ha-icon icon="mdi:minus"></ha-icon>
                </button>
                <span class="scaler-val">×${this._servingMult}</span>
                <button class="scaler-btn" @click=${() => { this._servingMult = Math.round((this._servingMult + 0.25) * 4) / 4; }}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Tabs -->
          <div class="tabs-row">
            ${[['ingredients','Ingredients'],['directions','Directions'],['notes','Notes'],['nutrition','Nutrition']].map(([val, lbl]) => html`
              <button
                class="tab-btn ${this._activeTab === val ? 'active' : ''}"
                @click=${() => { this._activeTab = val; }}
              >${lbl}</button>
            `)}
          </div>

          <!-- Tab content -->
          <div class="tab-content">
            ${this._activeTab === 'ingredients' ? this._renderIngredients(r) : ''}
            ${this._activeTab === 'directions'  ? this._renderDirections(r)  : ''}
            ${this._activeTab === 'notes'       ? this._renderNotes(r)       : ''}
            ${this._activeTab === 'nutrition'   ? this._renderNutrition(r)   : ''}
          </div>
        </div>

        <!-- Edit panel (inline overlay) -->
        ${this._editing ? this._renderEditPanel() : ''}
      </div>
    `;
  }

  _renderIngredients(r) {
    const picking = this._showShoppingPicker;
    const checkedSet = this._checkedIngredients;
    const checkedCount = checkedSet?.size ?? 0;

    return html`
      ${r.ingredients?.length ? html`
        <ul class="ingredient-list">
          ${r.ingredients.map((ing, i) => html`
            <li class="ingredient-item ${picking ? 'selectable' : ''}"
              @click=${picking ? () => this._toggleIngredient(i) : undefined}>
              ${picking ? html`
                <span class="ing-check ${checkedSet?.has(i) ? 'checked' : ''}">
                  ${checkedSet?.has(i) ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
                </span>
              ` : ''}
              <span class="ing-amount">${this._scaleAmount(ing.amount) || ''} ${ing.unit || ''}</span>
              <span class="ing-name">${ing.name}${ing.notes ? html` <em class="ing-notes">(${ing.notes})</em>` : ''}</span>
            </li>
          `)}
        </ul>
      ` : html`<p class="empty-tab">No ingredients listed.</p>`}

      <!-- Shopping section (always shown) -->
      <div class="shopping-section">
        ${this._shoppingResult === 'success' ? html`
          <div class="shopping-success">
            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
            Added to shopping list!
          </div>
        ` : picking ? html`
          <div class="shopping-picker-panel">
            ${this.slmAvailable && this.shoppingLists.length ? html`
              <select class="list-select" .value=${this._selectedListId}
                @change=${e => { this._selectedListId = e.target.value; }}>
                ${this.shoppingLists.map(l => html`
                  <option value="${l.id}" ?selected=${l.id === this._selectedListId}>${l.name}</option>
                `)}
              </select>
            ` : this.slmAvailable ? html`
              <span class="shopping-note">No lists found in Shopping List Manager</span>
            ` : ''}
            <div class="picker-btns">
              <button class="action-btn" @click=${() => { this._showShoppingPicker = false; }}>Cancel</button>
              <button class="action-btn primary"
                ?disabled=${this._shoppingAdding || !checkedCount}
                @click=${this._handleAddToShopping}>
                ${this._shoppingAdding
                  ? html`<ha-circular-progress active size="tiny"></ha-circular-progress>`
                  : `Add${checkedCount ? ` (${checkedCount})` : ''}`}
              </button>
            </div>
          </div>
        ` : html`
          <button class="action-btn primary shopping-btn" @click=${this._openShoppingPicker}>
            <ha-icon icon="mdi:cart-plus"></ha-icon>
            Add to Shopping List
          </button>
        `}
      </div>
    `;
  }

  _renderDirections(r) {
    return html`
      ${r.instructions?.length ? html`
        <ol class="steps-list">
          ${r.instructions.map((step, i) => html`
            <li class="step-item">
              <span class="step-num">${i + 1}</span>
              <span class="step-text">${step}</span>
            </li>
          `)}
        </ol>
      ` : html`<p class="empty-tab">No directions listed.</p>`}
    `;
  }

  _renderNotes(r) {
    return html`
      ${r.notes
        ? html`<p class="notes-text">${r.notes}</p>`
        : html`<p class="empty-tab">No notes.</p>`}
    `;
  }

  _renderNutrition(r) {
    const n = r.nutrition || {};
    const hasAny = NUTRITION_FIELDS.some(f => n[f.key] != null && n[f.key] !== '');
    if (!hasAny) {
      return html`
        <div class="empty-tab">
          <p>No nutrition info. Add it via the edit panel.</p>
        </div>
      `;
    }
    const perServing = r.servings ? `Per serving (${r.servings_text || r.servings})` : 'Per serving';
    return html`
      <div class="nutrition-panel">
        <div class="nutr-header">Nutrition Facts</div>
        <div class="nutr-sub">${perServing}</div>
        <div class="nutr-divider thick"></div>
        ${NUTRITION_FIELDS.map(f => {
          const val = n[f.key];
          if (val == null || val === '') return '';
          return html`
            <div class="nutr-row ${f.bold ? 'nutr-bold' : ''} ${f.indent ? 'nutr-indent' : ''}">
              <span class="nutr-label">${f.label}</span>
              <span class="nutr-val">${val}${f.unit !== 'kcal' ? html`<em> ${f.unit}</em>` : ''}</span>
            </div>
            <div class="nutr-divider"></div>
          `;
        })}
      </div>
    `;
  }

  _renderEditPanel() {
    const d = this._editData;
    return html`
      <div class="edit-overlay" @click=${(e) => { if (e.target === e.currentTarget) this._cancelEdit(); }}>
        <div class="edit-panel">
          <div class="edit-header">
            <span>Edit Recipe</span>
            <button class="icon-btn" @click=${this._cancelEdit}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="edit-body">

            ${this._renderField('Name', 'name', 'text')}
            ${this._renderField('Description', 'description', 'textarea')}
            ${this._renderField('Source URL', 'source_url', 'url')}

            <div class="edit-row-3">
              ${this._renderField('Prep (min)', 'prep_time', 'number')}
              ${this._renderField('Cook (min)', 'cook_time', 'number')}
              ${this._renderField('Servings', 'servings', 'number')}
            </div>

            <!-- Star rating picker -->
            <div class="edit-field">
              <label>Rating</label>
              <div class="edit-stars">
                ${[1,2,3,4,5].map(n => html`
                  <span class="edit-star ${n <= (d.rating || 0) ? 'filled' : ''}"
                    @click=${() => this._handleEditField('rating', d.rating === n ? 0 : n)}
                  >★</span>
                `)}
              </div>
            </div>

            ${this._renderField('Tags (comma-separated)', 'tags', 'text')}
            ${this._renderField('Courses (comma-separated)', 'courses', 'text')}
            ${this._renderField('Categories (comma-separated)', 'categories', 'text')}
            ${this._renderField('Collections (comma-separated)', 'collections', 'text')}
            ${this._renderField('Notes', 'notes', 'textarea')}

            <!-- Nutrition section -->
            <div class="edit-section-label">Nutrition Facts (per serving)</div>
            <div class="edit-row-3">
              ${this._renderField('Calories (kcal)', 'cal', 'number')}
              ${this._renderField('Protein (g)', 'prot', 'number')}
              ${this._renderField('Fat (g)', 'fat', 'number')}
            </div>
            <div class="edit-row-3">
              ${this._renderField('Saturated Fat (g)', 'satf', 'number')}
              ${this._renderField('Carbs (g)', 'carb', 'number')}
              ${this._renderField('Fiber (g)', 'fib', 'number')}
            </div>
            <div class="edit-row-3">
              ${this._renderField('Sugar (g)', 'sug', 'number')}
              ${this._renderField('Sodium (mg)', 'sod', 'number')}
              ${this._renderField('Cholesterol (mg)', 'chol', 'number')}
            </div>

          </div>
          <div class="edit-footer">
            <button class="action-btn" @click=${this._cancelEdit}>Cancel</button>
            <button class="action-btn primary" @click=${this._saveEdit}>Save</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderField(label, field, type) {
    const val = this._editData[field] ?? '';
    if (type === 'textarea') {
      return html`
        <div class="edit-field">
          <label>${label}</label>
          <textarea
            .value=${val}
            @input=${e => this._handleEditField(field, e.target.value)}
            rows="3"
          ></textarea>
        </div>
      `;
    }
    return html`
      <div class="edit-field">
        <label>${label}</label>
        <input
          type="${type}"
          .value=${String(val)}
          @input=${e => this._handleEditField(field, e.target.value)}
        />
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; }

    .detail-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    /* Hero */
    .hero {
      flex-shrink: 0;
      height: 180px;
      position: relative;
      background: var(--rm-surface, #2c2c2e);
      overflow: hidden;
    }
    .hero.no-image { height: 80px; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%);
    }
    .hero-placeholder {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text-secondary, #8e8e93);
    }
    .hero-placeholder ha-icon { --mdc-icon-size: 48px; opacity: 0.4; }

    .hero-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 6px;
    }
    .hero-btn {
      background: rgba(0,0,0,0.55);
      border: none;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
      padding: 0;
    }
    .hero-btn ha-icon { --mdc-icon-size: 18px; }
    .hero-btn:hover { background: rgba(0,0,0,0.75); }
    .hero-btn.fav-active { color: var(--error-color, #cf6679); }
    .hero-btn.delete-btn.confirm { background: var(--error-color, #cf6679); color: #fff; }

    /* Scroll area */
    .detail-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px 16px 24px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }

    .detail-head { margin-bottom: 12px; }
    .detail-name {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 700;
      color: var(--rm-text, #e5e5ea);
    }
    .detail-desc {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--rm-text-secondary, #8e8e93);
      line-height: 1.5;
    }

    /* Stars */
    .stars {
      display: flex;
      gap: 2px;
      margin-bottom: 8px;
    }
    .star {
      font-size: 20px;
      color: var(--rm-border, rgba(255,255,255,0.2));
      line-height: 1;
      transition: color 0.1s;
    }
    .star.filled { color: #f5a623; }
    .stars-interactive .star { cursor: pointer; }
    .stars-interactive .star:hover,
    .stars-interactive .star:hover ~ .star { color: var(--rm-border, rgba(255,255,255,0.2)); }
    .stars-interactive:hover .star { color: #f5a623; }
    .stars-interactive .star:hover ~ .star { color: var(--rm-border, rgba(255,255,255,0.2)) !important; }

    .meta-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--rm-surface, #2c2c2e);
      border-radius: 8px;
      padding: 6px 12px;
      min-width: 60px;
    }
    .meta-label { font-size: 10px; color: var(--rm-text-secondary, #8e8e93); text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-val { font-size: 14px; font-weight: 600; color: var(--rm-text, #e5e5ea); }

    .tags-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
    .tag-chip {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 12px;
    }

    /* Chip groups (courses, categories, collections) */
    .chip-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 5px;
    }
    .chip-group-label {
      font-size: 11px;
      color: var(--rm-text-secondary, #8e8e93);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .chip {
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 12px;
    }
    .chip-course    { background: rgba(88,166,255,0.15); color: #58a6ff; }
    .chip-category  { background: rgba(63,185,80,0.15);  color: #3fb950; }
    .chip-collection{ background: rgba(210,153,34,0.15); color: #d2a01e; }

    /* Scaler */
    .scaler-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .scaler-label { font-size: 13px; color: var(--rm-text-secondary, #8e8e93); }
    .scaler-ctrl { display: flex; align-items: center; gap: 8px; }
    .scaler-btn {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rm-text, #e5e5ea);
      padding: 0;
    }
    .scaler-btn ha-icon { --mdc-icon-size: 16px; }
    .scaler-val { font-size: 14px; font-weight: 600; color: var(--rm-text, #e5e5ea); min-width: 36px; text-align: center; }

    /* Tabs */
    .tabs-row {
      display: flex;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      margin-bottom: 14px;
    }
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 8px 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: var(--rm-text-secondary, #8e8e93);
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .tab-btn.active {
      color: var(--rm-accent, #ff6b35);
      border-bottom-color: var(--rm-accent, #ff6b35);
    }

    /* Ingredients */
    .ingredient-list { list-style: none; padding: 0; margin: 0 0 16px; }
    .ingredient-item {
      display: flex;
      gap: 10px;
      align-items: baseline;
      padding: 7px 0;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
    }
    .ingredient-item:last-child { border-bottom: none; }
    .ing-amount {
      font-size: 13px;
      font-weight: 600;
      color: var(--rm-accent, #ff6b35);
      min-width: 60px;
      flex-shrink: 0;
    }
    .ing-name { font-size: 14px; color: var(--rm-text, #e5e5ea); }
    .ing-notes { font-size: 12px; color: var(--rm-text-secondary, #8e8e93); font-style: italic; }

    /* Ingredient checkbox selection */
    .ingredient-item.selectable { cursor: pointer; border-radius: 6px; padding-left: 4px; }
    .ingredient-item.selectable:hover { background: var(--rm-accent-soft, rgba(255,107,53,0.1)); }
    .ing-check {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--rm-border, rgba(255,255,255,0.15));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s;
    }
    .ing-check.checked {
      background: var(--rm-accent, #ff6b35);
      border-color: var(--rm-accent, #ff6b35);
      color: #fff;
    }
    .ing-check ha-icon { --mdc-icon-size: 12px; }

    /* Shopping */
    .shopping-section { margin-top: 12px; }
    .shopping-btn { width: 100%; justify-content: center; gap: 6px; }
    .shopping-btn ha-icon { --mdc-icon-size: 18px; }
    .shopping-picker-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--rm-bg-elevated, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 10px;
      padding: 10px;
    }
    .picker-btns { display: flex; gap: 8px; justify-content: flex-end; }
    .shopping-note { font-size: 12px; color: var(--rm-text-secondary, #8e8e93); }
    .list-select {
      flex: 1;
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 10px;
      font-size: 14px;
      min-width: 120px;
    }
    .shopping-success {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--success-color, #4caf50);
      font-size: 14px;
      padding: 8px 0;
    }
    .shopping-success ha-icon { --mdc-icon-size: 20px; }

    /* Directions */
    .steps-list { list-style: none; padding: 0; margin: 0; }
    .step-item {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
      align-items: flex-start;
    }
    .step-num {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      background: var(--rm-accent, #ff6b35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }
    .step-text { font-size: 14px; color: var(--rm-text, #e5e5ea); line-height: 1.6; }

    /* Notes */
    .notes-text { font-size: 14px; color: var(--rm-text, #e5e5ea); line-height: 1.6; white-space: pre-wrap; }
    .empty-tab { font-size: 14px; color: var(--rm-text-secondary, #8e8e93); text-align: center; padding: 20px 0; margin: 0; }

    /* Nutrition */
    .nutrition-panel {
      max-width: 340px;
      border: 2px solid var(--rm-text, #e5e5ea);
      border-radius: 4px;
      padding: 8px 12px;
      margin: 0 auto;
    }
    .nutr-header {
      font-size: 28px;
      font-weight: 900;
      color: var(--rm-text, #e5e5ea);
      line-height: 1;
      margin-bottom: 2px;
    }
    .nutr-sub {
      font-size: 11px;
      color: var(--rm-text-secondary, #8e8e93);
      margin-bottom: 6px;
    }
    .nutr-divider { border-top: 1px solid var(--rm-border, rgba(255,255,255,0.15)); margin: 2px 0; }
    .nutr-divider.thick { border-top: 6px solid var(--rm-text, #e5e5ea); margin: 4px 0; }
    .nutr-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 2px 0;
      font-size: 13px;
      color: var(--rm-text, #e5e5ea);
    }
    .nutr-bold { font-weight: 700; font-size: 15px; }
    .nutr-indent { padding-left: 14px; font-size: 12px; }
    .nutr-val { font-weight: 600; white-space: nowrap; }
    .nutr-val em { font-style: normal; font-size: 11px; color: var(--rm-text-secondary, #8e8e93); }

    /* Buttons */
    .action-btn {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .action-btn.primary {
      background: var(--rm-accent, #ff6b35);
      border-color: var(--rm-accent, #ff6b35);
      color: #fff;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; padding: 0;
    }

    /* Edit overlay */
    .edit-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: flex-end;
      z-index: 10;
    }
    .edit-panel {
      background: var(--rm-bg, #1c1c1e);
      border-radius: var(--rm-radius, 12px) var(--rm-radius, 12px) 0 0;
      width: 100%;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
    }
    .edit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      font-weight: 600;
      font-size: 16px;
      color: var(--rm-text, #e5e5ea);
      flex-shrink: 0;
    }
    .edit-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .edit-section-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--rm-text-muted, #8e8e93);
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
    }
    .edit-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .edit-field { display: flex; flex-direction: column; gap: 4px; }
    .edit-field label { font-size: 11px; color: var(--rm-text-secondary, #8e8e93); text-transform: uppercase; letter-spacing: 0.05em; }
    .edit-field input, .edit-field textarea {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }
    .edit-field input:focus, .edit-field textarea:focus {
      outline: none;
      border-color: var(--rm-accent, #ff6b35);
    }
    .edit-stars {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .edit-star {
      font-size: 26px;
      color: var(--rm-border, rgba(255,255,255,0.2));
      cursor: pointer;
      transition: color 0.12s;
      line-height: 1;
    }
    .edit-star.filled { color: #f5a623; }
    .edit-star:hover { color: #f5a623; }
    .edit-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      flex-shrink: 0;
    }
  `;
}

customElements.define('rm-recipe-detail', RmRecipeDetail);
