/**
 * Shopping list view — shows either SLM items or a local fallback list.
 * Visual style matches Shopping List Manager (SLM) card.
 */
import { LitElement, html, css } from 'lit';

// ---------------------------------------------------------------------------
// Category metadata (mirrors SLM categories)
// ---------------------------------------------------------------------------

const CATEGORY_META = {
  produce:    { label: 'Produce',    emoji: '🥦', color: '#4caf50' },
  dairy:      { label: 'Dairy',      emoji: '🥛', color: '#42a5f5' },
  meat:       { label: 'Meat',       emoji: '🥩', color: '#ef5350' },
  bakery:     { label: 'Bakery',     emoji: '🍞', color: '#ff8f00' },
  pantry:     { label: 'Pantry',     emoji: '🫙', color: '#ef6c00' },
  frozen:     { label: 'Frozen',     emoji: '🧊', color: '#00acc1' },
  beverages:  { label: 'Beverages',  emoji: '🧃', color: '#7e57c2' },
  snacks:     { label: 'Snacks',     emoji: '🍿', color: '#cddc39' },
  household:  { label: 'Household',  emoji: '🧹', color: '#26a69a' },
  health:     { label: 'Health',     emoji: '💊', color: '#66bb6a' },
  pet:        { label: 'Pet',        emoji: '🐾', color: '#a1887f' },
  baby:       { label: 'Baby',       emoji: '🍼', color: '#f06292' },
  other:      { label: 'Other',      emoji: '📦', color: '#78909c' },
  recent:     { label: 'Recent',     emoji: '🕐', color: '#90a4ae' },
};

function catMeta(catId) {
  return CATEGORY_META[catId?.toLowerCase()] ?? CATEGORY_META.other;
}

function catColor(catId) {
  return catMeta(catId).color;
}

function catEmoji(catId) {
  return catMeta(catId).emoji;
}

function catLabel(catId) {
  return catMeta(catId).label;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

class RmShoppingView extends LitElement {
  static properties = {
    slmAvailable:      { type: Boolean },
    shoppingLists:     { type: Array },
    api:               { type: Object },
    localItems:        { type: Array },
    _slmItems:         { type: Array },
    _slmCategories:    { type: Array },
    _selectedListId:   { type: String },
    _loading:          { type: Boolean },
    _clearing:         { type: Boolean },
  };

  constructor() {
    super();
    this.slmAvailable = false;
    this.shoppingLists = [];
    this.api = null;
    this.localItems = [];
    this._slmItems = [];
    this._slmCategories = [];
    this._selectedListId = '';
    this._loading = false;
    this._clearing = false;
  }

  updated(changedProps) {
    if (changedProps.has('slmAvailable') || changedProps.has('shoppingLists')) {
      if (this.slmAvailable && this.shoppingLists.length && !this._selectedListId) {
        this._selectedListId = this.shoppingLists[0]?.id ?? '';
        this._loadSlmData();
      }
    }
    if (changedProps.has('_selectedListId') && this._selectedListId && this.slmAvailable) {
      this._loadSlmData();
    }
  }

  async _loadSlmData() {
    if (!this._selectedListId || !this.api) return;
    this._loading = true;
    try {
      const [itemsResult, catsResult] = await Promise.allSettled([
        this.api.getSlmItems(this._selectedListId),
        this.api.getSlmCategories?.(),
      ]);
      this._slmItems = itemsResult.status === 'fulfilled' ? (itemsResult.value?.items ?? []) : [];
      this._slmCategories = catsResult.status === 'fulfilled' ? (catsResult.value?.categories ?? []) : [];
    } catch (err) {
      console.warn('Failed to load SLM data:', err);
      this._slmItems = [];
    } finally {
      this._loading = false;
    }
  }

  async _toggleSlmItem(item) {
    const newChecked = !item.checked;
    this._slmItems = this._slmItems.map(i =>
      i.id === item.id ? { ...i, checked: newChecked } : i
    );
    try {
      await this.api.checkSlmItem(item.id, newChecked);
    } catch (err) {
      console.warn('Failed to check SLM item:', err);
      this._slmItems = this._slmItems.map(i =>
        i.id === item.id ? { ...i, checked: !newChecked } : i
      );
    }
  }

  async _decreaseSlmItem(item) {
    const qty = (item.quantity ?? 1);
    if (qty <= 1) {
      // Remove item
      this._slmItems = this._slmItems.filter(i => i.id !== item.id);
      try { await this.api.deleteSlmItem?.(item.id); } catch { /* ignore */ }
    } else {
      const newQty = qty - 1;
      this._slmItems = this._slmItems.map(i =>
        i.id === item.id ? { ...i, quantity: newQty } : i
      );
      try { await this.api.updateSlmItem?.(item.id, { quantity: newQty }); } catch { /* ignore */ }
    }
  }

  async _clearSlmChecked() {
    this._clearing = true;
    try {
      await this.api.clearSlmChecked(this._selectedListId);
      this._slmItems = this._slmItems.filter(i => !i.checked);
    } catch (err) {
      console.warn('Failed to clear SLM checked:', err);
    } finally {
      this._clearing = false;
    }
  }

  _toggleLocalItem(id) {
    const updated = this.localItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    this._dispatchLocalUpdate(updated);
  }

  _clearLocalChecked() {
    this._dispatchLocalUpdate(this.localItems.filter(item => !item.checked));
  }

  _clearAllLocal() {
    this._dispatchLocalUpdate([]);
  }

  _dispatchLocalUpdate(items) {
    this.dispatchEvent(new CustomEvent('rm-shopping-local-update', {
      detail: { items },
      bubbles: true,
      composed: true,
    }));
  }

  // Group unchecked SLM items by category, preserving SLM category order
  _groupByCategory(items) {
    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);

    // Determine ordered category IDs from SLM categories or from item data
    const orderedCatIds = this._slmCategories.length
      ? this._slmCategories.map(c => c.id ?? c.name?.toLowerCase())
      : [...new Set(unchecked.map(i => i.category?.toLowerCase() ?? 'other'))];

    // Build groups
    const groups = [];
    const seen = new Set();

    for (const catId of orderedCatIds) {
      const catItems = unchecked.filter(i => (i.category?.toLowerCase() ?? 'other') === catId);
      if (catItems.length) {
        groups.push({ catId, items: catItems });
        seen.add(catId);
      }
    }

    // Add any categories not in the ordered list
    for (const item of unchecked) {
      const catId = item.category?.toLowerCase() ?? 'other';
      if (!seen.has(catId)) {
        const existing = groups.find(g => g.catId === catId);
        if (existing) existing.items.push(item);
        else { groups.push({ catId, items: [item] }); seen.add(catId); }
      }
    }

    return { groups, checked };
  }

  render() {
    return html`
      <div class="shopping-view">
        ${this.slmAvailable ? this._renderSlmMode() : this._renderLocalMode()}
      </div>
    `;
  }

  _renderSlmMode() {
    const hasChecked = this._slmItems.some(i => i.checked);
    const { groups, checked } = this._groupByCategory(this._slmItems);

    return html`
      <div class="sv-header">
        <div class="sv-header-left">
          ${this.shoppingLists.length > 1 ? html`
            <select class="list-select" .value=${this._selectedListId}
              @change=${e => { this._selectedListId = e.target.value; }}>
              ${this.shoppingLists.map(l => html`
                <option value="${l.id}" ?selected=${l.id === this._selectedListId}>${l.name}</option>
              `)}
            </select>
          ` : html`
            <span class="sv-list-name">${this.shoppingLists[0]?.name ?? 'Shopping List'}</span>
          `}
        </div>
        <div class="sv-actions">
          <button class="sv-btn" @click=${this._loadSlmData} title="Refresh">
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
          ${hasChecked ? html`
            <button class="sv-btn danger" @click=${this._clearSlmChecked} ?disabled=${this._clearing}>
              <ha-icon icon="mdi:delete-sweep-outline"></ha-icon>
              <span>Clear checked</span>
            </button>
          ` : ''}
        </div>
      </div>

      ${this._loading ? html`
        <div class="sv-loading"><ha-circular-progress active size="small"></ha-circular-progress></div>
      ` : this._slmItems.length === 0 ? html`
        <div class="sv-empty">
          <ha-icon icon="mdi:cart-outline"></ha-icon>
          <p>Your shopping list is empty.</p>
          <p class="sv-hint">Add ingredients from any recipe to get started.</p>
        </div>
      ` : html`
        <div class="sv-items">
          ${groups.map(({ catId, items }) => this._renderCategoryGroup(catId, items))}
          ${checked.length ? html`
            <div class="sv-divider-label">Checked</div>
            ${checked.map(item => this._renderSlmRow(item, true))}
          ` : ''}
        </div>
      `}
    `;
  }

  _renderCategoryGroup(catId, items) {
    const color = catColor(catId);
    const emoji = catEmoji(catId);
    const label = catLabel(catId);

    return html`
      <div class="cat-group">
        <div class="cat-header" style="border-left-color:${color}; background: linear-gradient(to right, ${color}18, transparent)">
          <span class="cat-emoji">${emoji}</span>
          <span class="cat-name" style="color:${color}">${label}</span>
          <span class="cat-count">${items.length}</span>
        </div>
        ${items.map(item => this._renderSlmRow(item, false, color))}
      </div>
    `;
  }

  _renderSlmRow(item, isChecked, catColor = '#78909c') {
    const qty = item.quantity && item.quantity !== 1 ? item.quantity : null;
    const unit = item.unit && item.unit !== 'units' ? item.unit : null;
    const color = isChecked ? '#78909c' : (catColor || catColor(item.category));

    return html`
      <div class="sv-row ${isChecked ? 'sv-row-checked' : ''}"
        @click=${() => this._toggleSlmItem(item)}>
        <div class="sv-row-left">
          <div class="cat-dot" style="background:${color}"></div>
          <span class="row-emoji">${catEmoji(item.category)}</span>
        </div>
        <div class="sv-row-mid">
          <span class="sv-item-name">${item.name}</span>
          ${unit ? html`<span class="sv-item-unit">${unit}</span>` : ''}
        </div>
        <div class="sv-row-right" @click=${e => e.stopPropagation()}>
          ${!isChecked ? html`
            <button class="dec-btn" @click=${() => this._decreaseSlmItem(item)} title="Decrease">−</button>
          ` : ''}
          ${qty !== null ? html`
            <span class="qty-badge" style="background:${color}22; color:${color}; border-color:${color}44">${qty}</span>
          ` : ''}
          <div class="sv-checkbox ${isChecked ? 'checked' : ''}"
            style="${isChecked ? `background:${color}; border-color:${color}` : `border-color:${color}`}">
            ${isChecked ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderLocalMode() {
    const hasChecked = this.localItems.some(i => i.checked);
    const unchecked = this.localItems.filter(i => !i.checked);
    const checked = this.localItems.filter(i => i.checked);

    return html`
      <div class="sv-header">
        <span class="sv-list-name">My Shopping List</span>
        <div class="sv-actions">
          ${hasChecked ? html`
            <button class="sv-btn danger" @click=${this._clearLocalChecked}>
              <ha-icon icon="mdi:delete-sweep-outline"></ha-icon>
              <span>Clear checked</span>
            </button>
          ` : ''}
          ${this.localItems.length ? html`
            <button class="sv-btn" @click=${this._clearAllLocal} title="Clear all">
              <ha-icon icon="mdi:delete-outline"></ha-icon>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="sv-install-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="sv-install-text">
          <strong>Get more features with Shopping List Manager</strong>
          <span>Install the Shopping List Manager HACS integration for shared lists, categories, and sync.</span>
        </div>
      </div>

      ${this.localItems.length === 0 ? html`
        <div class="sv-empty">
          <ha-icon icon="mdi:cart-outline"></ha-icon>
          <p>Your shopping list is empty.</p>
          <p class="sv-hint">Add ingredients from any recipe to get started.</p>
        </div>
      ` : html`
        <div class="sv-items">
          ${unchecked.map(item => this._renderLocalRow(item))}
          ${checked.length ? html`
            <div class="sv-divider-label">Checked</div>
            ${checked.map(item => this._renderLocalRow(item))}
          ` : ''}
        </div>
      `}
    `;
  }

  _renderLocalRow(item) {
    const qtyText = [item.amount || '', item.unit || ''].filter(Boolean).join(' ');
    return html`
      <div class="sv-row ${item.checked ? 'sv-row-checked' : ''}"
        @click=${() => this._toggleLocalItem(item.id)}>
        <div class="sv-row-left">
          <div class="cat-dot" style="background:#78909c"></div>
          <span class="row-emoji">📦</span>
        </div>
        <div class="sv-row-mid">
          <span class="sv-item-name">${item.name}</span>
          ${qtyText ? html`<span class="sv-item-unit">${qtyText}</span>` : ''}
        </div>
        <div class="sv-row-right">
          <div class="sv-checkbox ${item.checked ? 'checked' : ''}">
            ${item.checked ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; }

    .shopping-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ── Header ─────────────────────── */

    .sv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--rm-border);
      flex-shrink: 0;
      gap: 8px;
    }

    .sv-header-left { display: flex; align-items: center; }

    .sv-list-name {
      font-weight: 600;
      font-size: 15px;
      color: var(--rm-text);
    }

    .list-select {
      background: var(--rm-bg-surface);
      border: 1px solid var(--rm-border);
      border-radius: 8px;
      color: var(--rm-text);
      padding: 6px 10px;
      font-size: 14px;
      cursor: pointer;
    }

    .sv-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .sv-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 1px solid var(--rm-border);
      border-radius: 8px;
      color: var(--rm-text-secondary);
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .sv-btn ha-icon { --mdc-icon-size: 18px; }
    .sv-btn:hover:not(:disabled) { background: var(--rm-accent-soft); color: var(--rm-text); }
    .sv-btn.danger { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
    .sv-btn.danger:hover:not(:disabled) { background: rgba(207,102,121,0.1); }
    .sv-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Install banner ─────────────── */

    .sv-install-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--rm-accent-soft);
      border-left: 3px solid var(--rm-accent);
      padding: 10px 14px;
      margin: 12px 16px;
      border-radius: 0 8px 8px 0;
      flex-shrink: 0;
    }
    .sv-install-banner ha-icon { --mdc-icon-size: 20px; color: var(--rm-accent); flex-shrink: 0; margin-top: 1px; }
    .sv-install-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
      color: var(--rm-text-secondary);
    }
    .sv-install-text strong { color: var(--rm-text); font-size: 13px; }

    /* ── Loading / empty ────────────── */

    .sv-loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .sv-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--rm-text-secondary);
      text-align: center;
      gap: 6px;
    }
    .sv-empty ha-icon { --mdc-icon-size: 48px; opacity: 0.35; }
    .sv-empty p { margin: 0; font-size: 15px; }
    .sv-hint { font-size: 13px !important; color: var(--rm-text-muted) !important; }

    /* ── Items scroll container ─────── */

    .sv-items {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border) transparent;
    }

    /* ── Category group ─────────────── */

    .cat-group { margin-bottom: 4px; }

    .cat-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px 7px 12px;
      border-left: 3px solid;
      margin: 4px 0 0;
    }

    .cat-emoji { font-size: 15px; line-height: 1; }

    .cat-name {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      flex: 1;
    }

    .cat-count {
      font-size: 10px;
      font-weight: 600;
      color: var(--rm-text-muted);
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 10px;
      padding: 1px 7px;
      min-width: 20px;
      text-align: center;
    }

    /* ── Item rows ──────────────────── */

    .sv-divider-label {
      padding: 12px 16px 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--rm-text-muted);
    }

    .sv-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px 9px 12px;
      cursor: pointer;
      transition: background 0.12s;
      border-bottom: 1px solid var(--rm-border);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      min-height: 46px;
    }
    .sv-row:last-child { border-bottom: none; }
    .sv-row:hover { background: var(--rm-accent-soft); }
    .sv-row-checked { opacity: 0.5; }

    .sv-row-left {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
    }

    .cat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .row-emoji {
      font-size: 17px;
      line-height: 1;
      width: 22px;
      text-align: center;
    }

    .sv-row-mid {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 7px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .sv-item-name {
      font-size: 14px;
      color: var(--rm-text);
      font-weight: 500;
    }
    .sv-row-checked .sv-item-name { text-decoration: line-through; }

    .sv-item-unit {
      font-size: 12px;
      color: var(--rm-text-muted);
    }

    .sv-row-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .dec-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1.5px solid var(--rm-border);
      background: var(--rm-bg-elevated);
      color: var(--rm-text-secondary);
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s;
      padding: 0;
    }
    .dec-btn:hover { background: rgba(207,102,121,0.12); border-color: var(--error-color, #cf6679); color: var(--error-color, #cf6679); }

    .qty-badge {
      font-size: 12px;
      font-weight: 700;
      border: 1.5px solid;
      border-radius: 12px;
      padding: 2px 9px;
      min-width: 28px;
      text-align: center;
    }

    .sv-checkbox {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--rm-border);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s;
    }
    .sv-checkbox.checked { color: #fff; }
    .sv-checkbox ha-icon { --mdc-icon-size: 14px; }
  `;
}

customElements.define('rm-shopping-view', RmShoppingView);
