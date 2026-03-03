/**
 * Shopping list view — shows either SLM items or a local fallback list.
 */
import { LitElement, html, css } from 'lit';

class RmShoppingView extends LitElement {
  static properties = {
    slmAvailable:    { type: Boolean },
    shoppingLists:   { type: Array },
    api:             { type: Object },
    localItems:      { type: Array },
    _slmItems:       { type: Array },
    _selectedListId: { type: String },
    _loading:        { type: Boolean },
    _clearing:       { type: Boolean },
  };

  constructor() {
    super();
    this.slmAvailable = false;
    this.shoppingLists = [];
    this.api = null;
    this.localItems = [];
    this._slmItems = [];
    this._selectedListId = '';
    this._loading = false;
    this._clearing = false;
  }

  updated(changedProps) {
    if (changedProps.has('slmAvailable') || changedProps.has('shoppingLists')) {
      if (this.slmAvailable && this.shoppingLists.length && !this._selectedListId) {
        this._selectedListId = this.shoppingLists[0]?.id ?? '';
        this._loadSlmItems();
      }
    }
    if (changedProps.has('_selectedListId') && this._selectedListId && this.slmAvailable) {
      this._loadSlmItems();
    }
  }

  async _loadSlmItems() {
    if (!this._selectedListId || !this.api) return;
    this._loading = true;
    try {
      const result = await this.api.getSlmItems(this._selectedListId);
      this._slmItems = result?.items ?? [];
    } catch (err) {
      console.warn('Failed to load SLM items:', err);
      this._slmItems = [];
    } finally {
      this._loading = false;
    }
  }

  async _toggleSlmItem(item) {
    // Optimistic update first to prevent double-tap delay
    const newChecked = !item.checked;
    this._slmItems = this._slmItems.map(i =>
      i.id === item.id ? { ...i, checked: newChecked } : i
    );
    try {
      await this.api.checkSlmItem(item.id, newChecked);
    } catch (err) {
      // Revert on failure
      console.warn('Failed to check SLM item:', err);
      this._slmItems = this._slmItems.map(i =>
        i.id === item.id ? { ...i, checked: !newChecked } : i
      );
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

  render() {
    return html`
      <div class="shopping-view">
        ${this.slmAvailable ? this._renderSlmMode() : this._renderLocalMode()}
      </div>
    `;
  }

  _renderSlmMode() {
    const hasChecked = this._slmItems.some(i => i.checked);
    const unchecked = this._slmItems.filter(i => !i.checked);
    const checked = this._slmItems.filter(i => i.checked);

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
          <button class="sv-btn" @click=${this._loadSlmItems} title="Refresh">
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
          ${unchecked.map(item => this._renderSlmItem(item))}
          ${checked.length ? html`
            <div class="sv-divider-label">Checked</div>
            ${checked.map(item => this._renderSlmItem(item))}
          ` : ''}
        </div>
      `}
    `;
  }

  _renderSlmItem(item) {
    const qtyText = [
      item.quantity && item.quantity !== 1 ? item.quantity : '',
      item.unit && item.unit !== 'units' ? item.unit : '',
    ].filter(Boolean).join(' ');

    return html`
      <div class="sv-item ${item.checked ? 'sv-item-checked' : ''}"
        @click=${() => this._toggleSlmItem(item)}>
        <div class="sv-checkbox ${item.checked ? 'checked' : ''}">
          ${item.checked ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
        </div>
        <div class="sv-item-info">
          <span class="sv-item-name">${item.name}</span>
          ${qtyText ? html`<span class="sv-item-qty">${qtyText}</span>` : ''}
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
          ${unchecked.map(item => this._renderLocalItem(item))}
          ${checked.length ? html`
            <div class="sv-divider-label">Checked</div>
            ${checked.map(item => this._renderLocalItem(item))}
          ` : ''}
        </div>
      `}
    `;
  }

  _renderLocalItem(item) {
    const qtyText = [item.amount || '', item.unit || ''].filter(Boolean).join(' ');
    return html`
      <div class="sv-item ${item.checked ? 'sv-item-checked' : ''}"
        @click=${() => this._toggleLocalItem(item.id)}>
        <div class="sv-checkbox ${item.checked ? 'checked' : ''}">
          ${item.checked ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
        </div>
        <div class="sv-item-info">
          <span class="sv-item-name">${item.name}</span>
          ${qtyText ? html`<span class="sv-item-qty">${qtyText}</span>` : ''}
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

    .sv-items {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
      scrollbar-width: thin;
      scrollbar-color: var(--rm-border) transparent;
    }

    .sv-divider-label {
      padding: 10px 16px 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--rm-text-muted);
    }

    .sv-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.12s;
      border-bottom: 1px solid var(--rm-border);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .sv-item:last-child { border-bottom: none; }
    .sv-item:hover { background: var(--rm-accent-soft); }
    .sv-item-checked { opacity: 0.5; }

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
    .sv-checkbox.checked {
      background: var(--rm-accent);
      border-color: var(--rm-accent);
      color: #fff;
    }
    .sv-checkbox ha-icon { --mdc-icon-size: 14px; }

    .sv-item-info {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sv-item-name { font-size: 14px; color: var(--rm-text); }
    .sv-item-qty { font-size: 12px; color: var(--rm-text-secondary); }
    .sv-item-checked .sv-item-name { text-decoration: line-through; }
  `;
}

customElements.define('rm-shopping-view', RmShoppingView);
