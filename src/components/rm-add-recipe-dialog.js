/**
 * Add Recipe dialog — URL scrape or manual entry.
 */
import { LitElement, html, css } from 'lit';

class RmAddRecipeDialog extends LitElement {
  static properties = {
    api: { type: Object },
    _mode: { type: String },   // 'url' | 'manual'
    _url: { type: String },
    _scraping: { type: Boolean },
    _scrapeError: { type: String },
    _form: { type: Object },
    _saving: { type: Boolean },
    _ingredientInput: { type: String },
  };

  constructor() {
    super();
    this.api = null;
    this._mode = 'url';
    this._url = '';
    this._scraping = false;
    this._scrapeError = null;
    this._saving = false;
    this._ingredientInput = '';
    this._form = this._emptyForm();
  }

  _emptyForm() {
    return {
      name: '',
      description: '',
      source_url: '',
      servings: 4,
      prep_time: '',
      cook_time: '',
      tags: '',
      notes: '',
      image_url: '',
      ingredients: [],
      instructions: [],
    };
  }

  _close() {
    this.dispatchEvent(new CustomEvent('rm-close', { bubbles: true, composed: true }));
  }

  async _handleScrape() {
    if (!this._url.trim() || this._scraping) return;
    this._scraping = true;
    this._scrapeError = null;
    try {
      const result = await this.api.scrapeRecipe(this._url.trim());
      if (result?.recipe) {
        const r = result.recipe;
        this._form = {
          name: r.name || '',
          description: r.description || '',
          source_url: r.source_url || this._url.trim(),
          servings: r.servings || 4,
          prep_time: r.prep_time || '',
          cook_time: r.cook_time || '',
          tags: (r.tags || []).join(', '),
          notes: r.notes || '',
          image_url: r.image_url || '',
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
        };
        this._mode = 'manual';  // show form to review/edit before saving
      } else {
        this._scrapeError = result?.error || 'Could not extract recipe from this URL.';
      }
    } catch (err) {
      this._scrapeError = err.message || 'Scraping failed.';
    } finally {
      this._scraping = false;
    }
  }

  async _handleSave() {
    if (!this._form.name.trim() || this._saving) return;
    this._saving = true;
    try {
      const data = {
        ...this._form,
        servings: parseInt(this._form.servings) || 4,
        prep_time: parseInt(this._form.prep_time) || null,
        cook_time: parseInt(this._form.cook_time) || null,
        tags: this._form.tags
          ? this._form.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
      };
      this.dispatchEvent(new CustomEvent('rm-add-recipe', {
        detail: { data },
        bubbles: true,
        composed: true,
      }));
    } finally {
      this._saving = false;
    }
  }

  _setField(field, value) {
    this._form = { ...this._form, [field]: value };
  }

  _addIngredient() {
    const raw = this._ingredientInput.trim();
    if (!raw) return;
    // simple parse: "2 cups flour" -> {amount:'2', unit:'cups', name:'flour'}
    const parts = raw.split(/\s+/);
    let amount = '', unit = '', name = '';
    if (parts.length >= 3 && !isNaN(parseFloat(parts[0]))) {
      amount = parts[0];
      unit = parts[1];
      name = parts.slice(2).join(' ');
    } else if (parts.length === 2 && !isNaN(parseFloat(parts[0]))) {
      amount = parts[0];
      name = parts[1];
    } else {
      name = raw;
    }
    this._form = {
      ...this._form,
      ingredients: [...this._form.ingredients, { amount, unit, name }],
    };
    this._ingredientInput = '';
  }

  _removeIngredient(idx) {
    const updated = this._form.ingredients.filter((_, i) => i !== idx);
    this._form = { ...this._form, ingredients: updated };
  }

  _addStep(text) {
    if (!text.trim()) return;
    this._form = { ...this._form, instructions: [...this._form.instructions, text.trim()] };
  }

  _removeStep(idx) {
    const updated = this._form.instructions.filter((_, i) => i !== idx);
    this._form = { ...this._form, instructions: updated };
  }

  render() {
    return html`
      <div class="dialog-overlay" @click=${(e) => { if (e.target === e.currentTarget) this._close(); }}>
        <div class="dialog-panel">
          <div class="dialog-header">
            <div class="mode-toggle">
              <button class="mode-btn ${this._mode === 'url' ? 'active' : ''}" @click=${() => { this._mode = 'url'; }}>
                <ha-icon icon="mdi:link-variant"></ha-icon> From URL
              </button>
              <button class="mode-btn ${this._mode === 'manual' ? 'active' : ''}" @click=${() => { this._mode = 'manual'; }}>
                <ha-icon icon="mdi:pencil-outline"></ha-icon> Manual
              </button>
            </div>
            <button class="icon-btn" @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="dialog-body">
            ${this._mode === 'url' ? this._renderUrlMode() : this._renderManualMode()}
          </div>

          ${this._mode === 'manual' ? html`
            <div class="dialog-footer">
              <button class="action-btn" @click=${this._close}>Cancel</button>
              <button
                class="action-btn primary"
                ?disabled=${!this._form.name.trim() || this._saving}
                @click=${this._handleSave}
              >
                ${this._saving
                  ? html`<ha-circular-progress active size="tiny"></ha-circular-progress>`
                  : html`<ha-icon icon="mdi:content-save-outline"></ha-icon>`}
                Save Recipe
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderUrlMode() {
    return html`
      <div class="url-mode">
        <div class="url-hint">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          Paste a recipe URL to automatically extract the recipe details.
        </div>
        <div class="url-row">
          <input
            type="url"
            class="url-input"
            placeholder="https://www.example.com/recipe/..."
            .value=${this._url}
            @input=${e => { this._url = e.target.value; }}
            @keydown=${e => { if (e.key === 'Enter') this._handleScrape(); }}
          />
          <button
            class="action-btn primary"
            ?disabled=${!this._url.trim() || this._scraping}
            @click=${this._handleScrape}
          >
            ${this._scraping
              ? html`<ha-circular-progress active size="tiny"></ha-circular-progress>`
              : html`<ha-icon icon="mdi:download-outline"></ha-icon>`}
            Fetch
          </button>
        </div>
        ${this._scrapeError ? html`
          <div class="error-msg">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            ${this._scrapeError}
          </div>
          <button class="action-btn" @click=${() => { this._mode = 'manual'; this._form = { ...this._emptyForm(), source_url: this._url }; }}>
            Enter manually instead
          </button>
        ` : ''}
      </div>
    `;
  }

  _renderManualMode() {
    const f = this._form;
    return html`
      <div class="manual-mode">
        <!-- Name (required) -->
        <div class="field">
          <label>Recipe Name *</label>
          <input type="text" .value=${f.name} @input=${e => this._setField('name', e.target.value)} placeholder="e.g. Spaghetti Bolognese" />
        </div>

        <!-- Description -->
        <div class="field">
          <label>Description</label>
          <textarea rows="2" .value=${f.description} @input=${e => this._setField('description', e.target.value)} placeholder="Short description…"></textarea>
        </div>

        <!-- Source URL -->
        <div class="field">
          <label>Source URL</label>
          <input type="url" .value=${f.source_url} @input=${e => this._setField('source_url', e.target.value)} placeholder="https://…" />
        </div>

        <!-- Image URL -->
        <div class="field">
          <label>Image URL</label>
          <input type="url" .value=${f.image_url} @input=${e => this._setField('image_url', e.target.value)} placeholder="https://…/image.jpg" />
        </div>

        <!-- Times + servings row -->
        <div class="field-row">
          <div class="field">
            <label>Prep (min)</label>
            <input type="number" .value=${String(f.prep_time)} @input=${e => this._setField('prep_time', e.target.value)} placeholder="15" min="0" />
          </div>
          <div class="field">
            <label>Cook (min)</label>
            <input type="number" .value=${String(f.cook_time)} @input=${e => this._setField('cook_time', e.target.value)} placeholder="30" min="0" />
          </div>
          <div class="field">
            <label>Servings</label>
            <input type="number" .value=${String(f.servings)} @input=${e => this._setField('servings', e.target.value)} placeholder="4" min="1" />
          </div>
        </div>

        <!-- Tags -->
        <div class="field">
          <label>Tags (comma-separated)</label>
          <input type="text" .value=${f.tags} @input=${e => this._setField('tags', e.target.value)} placeholder="dinner, italian, pasta" />
        </div>

        <!-- Ingredients -->
        <div class="field">
          <label>Ingredients (${f.ingredients.length})</label>
          ${f.ingredients.length ? html`
            <ul class="ing-list">
              ${f.ingredients.map((ing, i) => html`
                <li>
                  <span class="ing-text">${ing.amount ? `${ing.amount} ${ing.unit} ` : ''}${ing.name}</span>
                  <button class="remove-btn" @click=${() => this._removeIngredient(i)}><ha-icon icon="mdi:close"></ha-icon></button>
                </li>
              `)}
            </ul>
          ` : ''}
          <div class="add-row">
            <input
              type="text"
              .value=${this._ingredientInput}
              @input=${e => { this._ingredientInput = e.target.value; }}
              @keydown=${e => { if (e.key === 'Enter') this._addIngredient(); }}
              placeholder='e.g. "2 cups flour" or "salt"'
            />
            <button class="action-btn sm" @click=${this._addIngredient}>Add</button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="field">
          <label>Instructions (${f.instructions.length} steps)</label>
          ${f.instructions.length ? html`
            <ol class="steps-edit">
              ${f.instructions.map((step, i) => html`
                <li>
                  <span class="step-text">${step}</span>
                  <button class="remove-btn" @click=${() => this._removeStep(i)}><ha-icon icon="mdi:close"></ha-icon></button>
                </li>
              `)}
            </ol>
          ` : ''}
          <div class="add-row">
            <textarea
              rows="2"
              @keydown=${e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._addStep(e.target.value); e.target.value = ''; } }}
              placeholder="Type a step, press Enter to add…"
            ></textarea>
            <button class="action-btn sm" @click=${e => {
              const ta = e.target.closest('.add-row').querySelector('textarea');
              this._addStep(ta.value);
              ta.value = '';
            }}>Add</button>
          </div>
        </div>

        <!-- Notes -->
        <div class="field">
          <label>Notes</label>
          <textarea rows="3" .value=${f.notes} @input=${e => this._setField('notes', e.target.value)} placeholder="Variations, tips…"></textarea>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }

    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-panel {
      background: var(--rm-bg, #1c1c1e);
      border-radius: var(--rm-radius, 12px) var(--rm-radius, 12px) 0 0;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      flex-shrink: 0;
    }

    .mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--rm-surface, #2c2c2e);
      border-radius: 8px;
      padding: 3px;
    }
    .mode-btn {
      background: none;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--rm-text-secondary, #8e8e93);
      display: flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s, color 0.15s;
    }
    .mode-btn ha-icon { --mdc-icon-size: 16px; }
    .mode-btn.active { background: var(--rm-accent, #ff6b35); color: #fff; }

    .icon-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93);
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; padding: 0;
    }

    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border, rgba(255,255,255,0.08)) transparent;
    }

    /* URL mode */
    .url-mode { display: flex; flex-direction: column; gap: 14px; }
    .url-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--rm-text-secondary, #8e8e93);
      background: var(--rm-surface, #2c2c2e);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .url-hint ha-icon { --mdc-icon-size: 18px; flex-shrink: 0; }
    .url-row { display: flex; gap: 8px; }
    .url-input {
      flex: 1;
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 10px 12px;
      font-size: 14px;
    }
    .url-input:focus { outline: none; border-color: var(--rm-accent, #ff6b35); }
    .error-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--error-color, #cf6679);
      font-size: 13px;
    }
    .error-msg ha-icon { --mdc-icon-size: 16px; }

    /* Manual form */
    .manual-mode { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--rm-text-secondary, #8e8e93); }
    .field input, .field textarea {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }
    .field input:focus, .field textarea:focus { outline: none; border-color: var(--rm-accent, #ff6b35); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

    /* Ingredient list in form */
    .ing-list, .steps-edit { list-style: none; padding: 0; margin: 0 0 6px; }
    .ing-list li, .steps-edit li {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
      font-size: 13px;
      color: var(--rm-text, #e5e5ea);
    }
    .ing-text, .step-text { flex: 1; }
    .remove-btn {
      background: none; border: none; cursor: pointer;
      color: var(--rm-text-secondary, #8e8e93); padding: 2px; flex-shrink: 0;
    }
    .remove-btn ha-icon { --mdc-icon-size: 14px; }

    .add-row { display: flex; gap: 8px; align-items: flex-end; }
    .add-row input, .add-row textarea {
      flex: 1;
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      resize: none;
    }
    .add-row input:focus, .add-row textarea:focus { outline: none; border-color: var(--rm-accent, #ff6b35); }

    /* Buttons */
    .action-btn {
      background: var(--rm-surface, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 9px 14px;
      cursor: pointer;
      font-size: 14px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .action-btn ha-icon { --mdc-icon-size: 16px; }
    .action-btn.primary { background: var(--rm-accent, #ff6b35); border-color: var(--rm-accent, #ff6b35); color: #fff; }
    .action-btn.sm { padding: 6px 10px; font-size: 13px; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .dialog-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      flex-shrink: 0;
    }
  `;
}

customElements.define('rm-add-recipe-dialog', RmAddRecipeDialog);
