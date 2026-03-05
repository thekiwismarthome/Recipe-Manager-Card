/**
 * Shopping list view — uses slm-item-grid directly for identical SLM tile look,
 * or shows a local fallback list when SLM is not available.
 */
import { LitElement, html, css } from 'lit';

class RmShoppingView extends LitElement {
  static properties = {
    hass:             { type: Object },
    slmAvailable:     { type: Boolean },
    shoppingLists:    { type: Array },
    api:              { type: Object },
    localItems:       { type: Array },
    _slmItems:        { type: Array, state: true },
    _slmCategories:   { type: Array, state: true },
    _selectedListId:  { type: String, state: true },
    _loading:         { type: Boolean, state: true },
    _clearing:        { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.hass = null;
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
      const [itemsRes, catsRes] = await Promise.allSettled([
        this.api.getSlmItems(this._selectedListId),
        this.api.getSlmCategories(),
      ]);
      this._slmItems = itemsRes.status === 'fulfilled' ? (itemsRes.value?.items ?? []) : [];
      this._slmCategories = catsRes.status === 'fulfilled' ? (catsRes.value?.categories ?? []) : [];
    } finally {
      this._loading = false;
    }
  }

  // -- SLM grid API adapter -------------------------------------------------
  // slm-item-grid calls these methods on its .api prop.

  get _slmGridApi() {
    if (!this.api) return null;
    const api = this.api;
    return {
      getProductsByIds: (ids) => api.getSlmProductsByIds(ids).catch(() => ({ products: [] })),
      getProductSuggestions: (limit) => api.getSlmProductSuggestions(limit).catch(() => ({ products: [] })),
    };
  }

  // -- Event handlers -------------------------------------------------------

  async _handleItemCheck(e) {
    const { itemId, checked } = e.detail;
    // Optimistic update
    this._slmItems = this._slmItems.map(i => i.id === itemId ? { ...i, checked } : i);
    try {
      await this.api.checkSlmItem(itemId, checked);
    } catch {
      this._slmItems = this._slmItems.map(i => i.id === itemId ? { ...i, checked: !checked } : i);
    }
  }

  async _handleItemDecrease(e) {
    const { itemId } = e.detail;
    const item = this._slmItems.find(i => i.id === itemId);
    if (!item) return;
    if ((item.quantity ?? 1) <= 1) {
      this._slmItems = this._slmItems.filter(i => i.id !== itemId);
      try { await this.api.deleteSlmItem(itemId); } catch { /* ignore */ }
    } else {
      const newQty = item.quantity - 1;
      this._slmItems = this._slmItems.map(i => i.id === itemId ? { ...i, quantity: newQty } : i);
      try { await this.api.updateSlmItem(itemId, { quantity: newQty }); } catch { /* ignore */ }
    }
  }

  async _handleItemClick(e) {
    // Quantity badge click = increment
    const { itemId } = e.detail;
    const item = this._slmItems.find(i => i.id === itemId);
    if (!item) return;
    const newQty = (item.quantity ?? 1) + 1;
    this._slmItems = this._slmItems.map(i => i.id === itemId ? { ...i, quantity: newQty } : i);
    try { await this.api.updateSlmItem(itemId, { quantity: newQty }); } catch { /* ignore */ }
  }

  async _handleAddItem(e) {
    const { name, category_id, product_id, quantity, unit, price, image_url } = e.detail;
    try {
      const result = await this.api.addSlmItem(this._selectedListId, {
        name, category_id, product_id,
        quantity: quantity || 1,
        unit: unit || 'units',
        ...(price ? { price } : {}),
        ...(image_url ? { image_url } : {}),
      });
      if (result?.item) this._slmItems = [...this._slmItems, result.item];
    } catch (err) {
      console.warn('Failed to add item:', err);
    }
  }

  async _clearChecked() {
    this._clearing = true;
    try {
      await this.api.clearSlmChecked(this._selectedListId);
      this._slmItems = this._slmItems.filter(i => !i.checked);
    } finally {
      this._clearing = false;
    }
  }

  // -- Local mode helpers ---------------------------------------------------

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

  // -- Render ---------------------------------------------------------------

  render() {
    return html`
      <div class="shopping-view">
        ${this.slmAvailable ? this._renderSlmMode() : this._renderLocalMode()}
      </div>
    `;
  }

  _renderSlmMode() {
    const hasChecked = this._slmItems.some(i => i.checked);
    const checkedItems = this._slmItems.filter(i => i.checked);

    // Build SLM-compatible settings object
    const slmSettings = {
      showRecentlyUsed: true,
      showPriceOnTile: true,
      tilesPerRow: 3,
      sortMode: 'category',
    };

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
            <button class="sv-btn danger" @click=${this._clearChecked} ?disabled=${this._clearing}>
              <ha-icon icon="mdi:delete-sweep-outline"></ha-icon>
              <span>Clear checked</span>
            </button>
          ` : ''}
        </div>
      </div>

      ${this._loading ? html`
        <div class="sv-loading"><ha-circular-progress active size="small"></ha-circular-progress></div>
      ` : html`
        <div class="sv-scroll">
          <slm-item-grid
            .items=${this._slmItems}
            .categories=${this._slmCategories}
            .settings=${slmSettings}
            .api=${this._slmGridApi}
            @item-check=${this._handleItemCheck}
            @item-decrease=${this._handleItemDecrease}
            @item-click=${this._handleItemClick}
            @add-item=${this._handleAddItem}
          ></slm-item-grid>

          ${checkedItems.length ? html`
            <div class="checked-section">
              <div class="checked-label">Checked (${checkedItems.length})</div>
              ${checkedItems.map(item => html`
                <div class="checked-row"
                  @click=${() => this._handleItemCheck({ detail: { itemId: item.id, checked: false } })}>
                  <span class="checked-name">${item.name}</span>
                  <ha-icon icon="mdi:check-circle" class="checked-icon"></ha-icon>
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      `}
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
          <div class="cat-dot"></div>
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
    :host {
      display: block;
      height: 100%;

      /* ── Bridge SLM CSS variables so slm-item-grid/slm-item-tile render correctly ── */
      /* Text */
      --slm-text-primary:    var(--rm-text,           #e5e5ea);
      --slm-text-secondary:  var(--rm-text-secondary, #8e8e93);
      --slm-text-muted:      var(--rm-text-muted,     #636366);
      /* Accents — keep SLM's blue-purple palette, not RM's orange */
      --slm-accent-primary:   #9fa8da;
      --slm-accent-secondary: #81c784;
      --slm-accent-warning:   #ffb74d;
      --slm-accent-danger:    #ef9a9a;
      /* Tiles */
      --slm-tile-checked-opacity: 0.35;
      --slm-font-size-base:   14px;
      --slm-font-weight-base: 400;
      /* Category colours (dark theme) */
      --slm-cat-produce:    #4caf50;
      --slm-cat-dairy:      #29b6f6;
      --slm-cat-meat:       #ef5350;
      --slm-cat-bakery:     #ffa726;
      --slm-cat-pantry:     #ff7043;
      --slm-cat-frozen:     #26c6da;
      --slm-cat-beverages:  #7c4dff;
      --slm-cat-snacks:     #d4e157;
      --slm-cat-household:  #26a69a;
      --slm-cat-health:     #66bb6a;
      --slm-cat-pet:        #8d6e63;
      --slm-cat-baby:       #ec407a;
      --slm-cat-other:      #78909c;
      --slm-cat-recent:     #9e9e9e;
    }

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
      padding: 10px 14px;
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
      padding: 5px 10px;
      font-size: 14px;
      cursor: pointer;
    }

    .sv-actions { display: flex; gap: 6px; align-items: center; }

    .sv-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 1px solid var(--rm-border);
      border-radius: 8px;
      color: var(--rm-text-secondary);
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .sv-btn ha-icon { --mdc-icon-size: 18px; }
    .sv-btn:hover:not(:disabled) { background: var(--rm-accent-soft); color: var(--rm-text); }
    .sv-btn.danger { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
    .sv-btn.danger:hover:not(:disabled) { background: rgba(207,102,121,0.1); }
    .sv-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Loading ────────────────────── */

    .sv-loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    /* ── SLM scroll area ────────────── */

    .sv-scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border) transparent;
    }

    slm-item-grid {
      display: block;
    }

    /* ── Checked section ────────────── */

    .checked-section {
      padding: 0 4px 16px;
    }

    .checked-label {
      padding: 10px 12px 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--rm-text-muted);
    }

    .checked-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      border-bottom: 1px solid var(--rm-border);
      cursor: pointer;
      opacity: 0.5;
      transition: background 0.12s;
    }
    .checked-row:hover { background: var(--rm-accent-soft); opacity: 0.7; }

    .checked-name {
      font-size: 14px;
      color: var(--rm-text);
      text-decoration: line-through;
    }

    .checked-icon { --mdc-icon-size: 18px; color: var(--rm-text-muted); }

    /* ── Install banner (local mode) ── */

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
    .sv-install-text { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--rm-text-secondary); }
    .sv-install-text strong { color: var(--rm-text); font-size: 13px; }

    /* ── Empty state ────────────────── */

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

    /* ── Local items list ───────────── */

    .sv-items {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0 16px;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border) transparent;
    }

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
      min-height: 46px;
    }
    .sv-row:hover { background: var(--rm-accent-soft); }
    .sv-row-checked { opacity: 0.5; }

    .sv-row-left { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
    .cat-dot { width: 8px; height: 8px; border-radius: 50%; background: #78909c; flex-shrink: 0; }
    .row-emoji { font-size: 17px; line-height: 1; width: 22px; text-align: center; }

    .sv-row-mid {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 7px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .sv-item-name { font-size: 14px; color: var(--rm-text); font-weight: 500; }
    .sv-row-checked .sv-item-name { text-decoration: line-through; }
    .sv-item-unit { font-size: 12px; color: var(--rm-text-muted); }

    .sv-row-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

    .sv-checkbox {
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 2px solid var(--rm-border);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .sv-checkbox.checked { color: #fff; background: #78909c; border-color: #78909c; }
    .sv-checkbox ha-icon { --mdc-icon-size: 14px; }
  `;
}

customElements.define('rm-shopping-view', RmShoppingView);
