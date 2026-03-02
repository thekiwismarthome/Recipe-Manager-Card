/**
 * Recipe detail view — full recipe with ingredients, steps, and actions.
 */
import { LitElement, html, css } from 'lit';

class RmRecipeDetail extends LitElement {
  static properties = {
    recipe: { type: Object },
    api: { type: Object },
    shoppingLists: { type: Array },
    _editing: { type: Boolean },
    _editData: { type: Object },
    _servingMult: { type: Number },
    _activeTab: { type: String },  // 'ingredients' | 'steps' | 'notes'
    _showShoppingPicker: { type: Boolean },
    _selectedListId: { type: String },
    _shoppingAdding: { type: Boolean },
    _shoppingResult: { type: String },
    _confirmDelete: { type: Boolean },
    _downloading: { type: Boolean },
  };

  constructor() {
    super();
    this.recipe = null;
    this.api = null;
    this.shoppingLists = [];
    this._editing = false;
    this._editData = {};
    this._servingMult = 1;
    this._activeTab = 'ingredients';
    this._showShoppingPicker = false;
    this._selectedListId = '';
    this._shoppingAdding = false;
    this._shoppingResult = null;
    this._confirmDelete = false;
    this._downloading = false;
  }

  updated(changedProps) {
    if (changedProps.has('recipe') && this.recipe) {
      this._servingMult = 1;
      this._editing = false;
      this._confirmDelete = false;
      this._shoppingResult = null;
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
    this._editData = {
      name: this.recipe.name || '',
      description: this.recipe.description || '',
      source_url: this.recipe.source_url || '',
      servings: this.recipe.servings || 4,
      prep_time: this.recipe.prep_time || '',
      cook_time: this.recipe.cook_time || '',
      tags: (this.recipe.tags || []).join(', '),
      notes: this.recipe.notes || '',
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
    const data = {
      ...this._editData,
      servings: parseInt(this._editData.servings) || 4,
      prep_time: parseInt(this._editData.prep_time) || null,
      cook_time: parseInt(this._editData.cook_time) || null,
      tags: this._editData.tags
        ? this._editData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
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

  async _handleDownloadImage() {
    if (!this.recipe.source_url && !this.recipe.image_url) return;
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

  async _handleAddToShopping() {
    if (!this._selectedListId) return;
    const ingredients = (this.recipe.ingredients || []).map(ing => ({
      ...ing,
      amount: this._scaleAmount(ing.amount),
    }));
    this._shoppingAdding = true;
    this._shoppingResult = null;
    this.dispatchEvent(new CustomEvent('rm-add-to-shopping', {
      detail: { ingredients, listId: this._selectedListId },
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
            <button class="hero-btn ${r.is_favourite ? 'fav-active' : ''}" @click=${this._handleToggleFav}>
              <ha-icon icon="${r.is_favourite ? 'mdi:heart' : 'mdi:heart-outline'}"></ha-icon>
            </button>
            ${r.source_url ? html`
              <a class="hero-btn" href="${r.source_url}" target="_blank" rel="noopener">
                <ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            ` : ''}
            <button class="hero-btn" @click=${this._startEdit}>
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>
            <button class="hero-btn delete-btn ${this._confirmDelete ? 'confirm' : ''}" @click=${this._handleDeleteRecipe}>
              <ha-icon icon="${this._confirmDelete ? 'mdi:check' : 'mdi:trash-can-outline'}"></ha-icon>
            </button>
          </div>
        </div>

        <div class="detail-scroll">
          <!-- Recipe name + meta -->
          <div class="detail-head">
            <h2 class="detail-name">${r.name}</h2>
            ${r.description ? html`<p class="detail-desc">${r.description}</p>` : ''}

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
                  <span class="meta-val">${r.servings}</span>
                </div>
              ` : ''}
            </div>

            ${r.tags?.length ? html`
              <div class="tags-row">
                ${r.tags.map(t => html`<span class="tag-chip">${t}</span>`)}
              </div>
            ` : ''}
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
            ${['ingredients', 'steps', 'notes'].map(tab => html`
              <button
                class="tab-btn ${this._activeTab === tab ? 'active' : ''}"
                @click=${() => { this._activeTab = tab; }}
              >${tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            `)}
          </div>

          <!-- Tab content -->
          <div class="tab-content">
            ${this._activeTab === 'ingredients' ? html`
              ${r.ingredients?.length ? html`
                <ul class="ingredient-list">
                  ${r.ingredients.map(ing => html`
                    <li class="ingredient-item">
                      <span class="ing-amount">${this._scaleAmount(ing.amount) || ''} ${ing.unit || ''}</span>
                      <span class="ing-name">${ing.name}</span>
                    </li>
                  `)}
                </ul>
              ` : html`<p class="empty-tab">No ingredients listed.</p>`}

              <!-- Add to shopping -->
              ${this.shoppingLists.length ? html`
                <div class="shopping-section">
                  ${this._shoppingResult === 'success' ? html`
                    <div class="shopping-success">
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                      Added to shopping list!
                    </div>
                  ` : this._showShoppingPicker ? html`
                    <div class="shopping-picker">
                      <select class="list-select" .value=${this._selectedListId} @change=${e => { this._selectedListId = e.target.value; }}>
                        ${this.shoppingLists.map(l => html`
                          <option value="${l.id}" ?selected=${l.id === this._selectedListId}>${l.name}</option>
                        `)}
                      </select>
                      <button class="action-btn primary" ?disabled=${this._shoppingAdding} @click=${this._handleAddToShopping}>
                        ${this._shoppingAdding ? html`<ha-circular-progress active size="tiny"></ha-circular-progress>` : 'Add'}
                      </button>
                      <button class="action-btn" @click=${() => { this._showShoppingPicker = false; }}>Cancel</button>
                    </div>
                  ` : html`
                    <button class="action-btn primary shopping-btn" @click=${() => { this._showShoppingPicker = true; }}>
                      <ha-icon icon="mdi:cart-plus"></ha-icon>
                      Add to Shopping List
                    </button>
                  `}
                </div>
              ` : ''}
            ` : this._activeTab === 'steps' ? html`
              ${r.instructions?.length ? html`
                <ol class="steps-list">
                  ${r.instructions.map((step, i) => html`
                    <li class="step-item">
                      <span class="step-num">${i + 1}</span>
                      <span class="step-text">${step}</span>
                    </li>
                  `)}
                </ol>
              ` : html`<p class="empty-tab">No instructions listed.</p>`}
            ` : html`
              ${r.notes ? html`
                <p class="notes-text">${r.notes}</p>
              ` : html`<p class="empty-tab">No notes.</p>`}
            `}
          </div>
        </div>

        <!-- Edit dialog (inline) -->
        ${this._editing ? this._renderEditPanel() : ''}
      </div>
    `;
  }

  _renderEditPanel() {
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
            <div class="edit-row-2">
              ${this._renderField('Prep time (min)', 'prep_time', 'number')}
              ${this._renderField('Cook time (min)', 'cook_time', 'number')}
              ${this._renderField('Servings', 'servings', 'number')}
            </div>
            ${this._renderField('Tags (comma-separated)', 'tags', 'text')}
            ${this._renderField('Notes', 'notes', 'textarea')}
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
    .hero.no-image { height: 100px; }
    .hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
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
      padding: 16px 16px 24px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }

    .detail-head { margin-bottom: 12px; }
    .detail-name {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 700;
      color: var(--rm-text, #e5e5ea);
    }
    .detail-desc {
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--rm-text-secondary, #8e8e93);
      line-height: 1.5;
    }

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

    .tags-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag-chip {
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 12px;
    }

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
      font-size: 13px;
      font-weight: 500;
      color: var(--rm-text-secondary, #8e8e93);
      transition: color 0.15s, border-color 0.15s;
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

    /* Shopping */
    .shopping-section { margin-top: 12px; }
    .shopping-btn {
      width: 100%;
      justify-content: center;
      gap: 6px;
    }
    .shopping-btn ha-icon { --mdc-icon-size: 18px; }
    .shopping-picker { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
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

    /* Steps */
    .steps-list { list-style: none; padding: 0; margin: 0; counter-reset: steps; }
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
    .empty-tab { font-size: 14px; color: var(--rm-text-secondary, #8e8e93); text-align: center; padding: 20px 0; }

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
      max-height: 80vh;
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
      color: var(--rm-text, #e5e5ea);
    }
    .edit-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .edit-row-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .edit-field { display: flex; flex-direction: column; gap: 4px; }
    .edit-field label { font-size: 12px; color: var(--rm-text-secondary, #8e8e93); text-transform: uppercase; letter-spacing: 0.05em; }
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
    .edit-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
    }
  `;
}

customElements.define('rm-recipe-detail', RmRecipeDetail);
