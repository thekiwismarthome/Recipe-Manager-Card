/**
 * Recipe Manager — Settings panel with tabs.
 * Tabs: Appearance | Display | [placeholder] | [placeholder]
 * Dispatches 'rm-settings-change' with the full updated settings object.
 */
import { LitElement, html, css } from 'lit';

class RmSettingsView extends LitElement {
  static properties = {
    settings:   { type: Object },
    _activeTab: { type: String },
  };

  constructor() {
    super();
    this.settings = {};
    this._activeTab = 'appearance';
  }

  _update(patch) {
    const next = { ...this.settings, ...patch };
    this.dispatchEvent(new CustomEvent('rm-settings-change', {
      detail: { settings: next },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const s = this.settings;

    return html`
      <div class="settings-root">
        <!-- Tab bar -->
        <div class="tab-bar">
          ${[
            ['appearance', 'mdi:palette-outline',   'Appearance'],
            ['display',    'mdi:view-dashboard-outline', 'Display'],
            ['sync',       'mdi:cloud-sync-outline', 'Sync'],
            ['advanced',   'mdi:tune-variant',       'Advanced'],
          ].map(([id, icon, label]) => html`
            <button
              class="tab-item ${this._activeTab === id ? 'active' : ''}"
              @click=${() => { this._activeTab = id; }}
            >
              <ha-icon icon="${icon}"></ha-icon>
              <span>${label}</span>
            </button>
          `)}
        </div>

        <!-- Tab content -->
        <div class="settings-body">
          ${this._activeTab === 'appearance' ? this._renderAppearance(s) : ''}
          ${this._activeTab === 'display'    ? this._renderDisplay(s)    : ''}
          ${this._activeTab === 'sync'       ? this._renderPlaceholder('Sync', 'mdi:cloud-sync-outline', 'Cloud sync and backup options — coming soon.') : ''}
          ${this._activeTab === 'advanced'   ? this._renderPlaceholder('Advanced', 'mdi:tune-variant', 'Advanced configuration options — coming soon.') : ''}
        </div>
      </div>
    `;
  }

  _renderAppearance(s) {
    const alwaysDark = s.theme === 'midnight' || s.theme === 'ember';
    return html`
      <div class="section">
        <div class="section-label">Theme</div>

        <div class="setting-row">
          <span class="setting-name">Colour theme</span>
          <select
            class="theme-select"
            @change=${e => this._update({ theme: e.target.value })}
          >
            <optgroup label="Light &amp; Dark">
              <option value="warm"    ?selected=${s.theme === 'warm'}>🍊 Warm Kitchen</option>
            </optgroup>
            <optgroup label="Light Themes">
              <option value="forest"  ?selected=${s.theme === 'forest'}>🌿 Forest</option>
              <option value="ocean"   ?selected=${s.theme === 'ocean'}>🌊 Ocean</option>
              <option value="blossom" ?selected=${s.theme === 'blossom'}>🌸 Blossom</option>
            </optgroup>
            <optgroup label="Dark Themes">
              <option value="midnight" ?selected=${s.theme === 'midnight'}>🌙 Midnight</option>
              <option value="ember"    ?selected=${s.theme === 'ember'}>🔥 Ember</option>
            </optgroup>
          </select>
        </div>

        ${!alwaysDark ? html`
          <div class="setting-row">
            <span class="setting-name">Dark mode</span>
            <div class="btn-group">
              ${[['off','Light'],['system','Auto'],['on','Dark']].map(([val, lbl]) => html`
                <button class="seg-btn ${s.darkMode === val ? 'active' : ''}"
                  @click=${() => this._update({ darkMode: val })}>${lbl}</button>
              `)}
            </div>
          </div>
        ` : html`
          <div class="setting-row muted-row">
            <span class="setting-name">Dark mode</span>
            <span class="muted-note">Always dark for this theme</span>
          </div>
        `}

        <div class="setting-row">
          <span class="setting-name">Text size</span>
          <div class="btn-group">
            ${[['small','S'],['medium','M'],['large','L']].map(([val, lbl]) => html`
              <button class="seg-btn ${s.fontSize === val ? 'active' : ''}"
                @click=${() => this._update({ fontSize: val })}>${lbl}</button>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  _renderDisplay(s) {
    return html`
      <div class="section">
        <div class="section-label">Recipe Grid</div>

        <div class="setting-row">
          <span class="setting-name">Recipe columns</span>
          <div class="btn-group">
            ${[2, 3, 4].map(n => html`
              <button class="seg-btn ${s.columns === n ? 'active' : ''}"
                @click=${() => this._update({ columns: n })}>${n}</button>
            `)}
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-name">Favourites section</span>
          <label class="toggle">
            <input type="checkbox" ?checked=${s.showFavourites}
              @change=${e => this._update({ showFavourites: e.target.checked })} />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Recent recipes count</span>
            <span class="setting-hint">How many recently viewed recipes to show in the Recent filter</span>
          </div>
          <div class="btn-group">
            ${[6, 12, 24].map(n => html`
              <button class="seg-btn ${(s.recentCount ?? 12) === n ? 'active' : ''}"
                @click=${() => this._update({ recentCount: n })}>${n}</button>
            `)}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Navigation</div>

        <div class="setting-row">
          <span class="setting-name">Meal planner</span>
          <label class="toggle">
            <input type="checkbox" ?checked=${s.showPlanner}
              @change=${e => this._update({ showPlanner: e.target.checked })} />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
      </div>
    `;
  }

  _renderPlaceholder(title, icon, message) {
    return html`
      <div class="placeholder-tab">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="placeholder-title">${title}</div>
        <div class="placeholder-msg">${message}</div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; overflow: hidden; }

    .settings-root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Tab bar */
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--rm-border, rgba(0,0,0,0.08));
      background: var(--rm-bg-surface, #fff);
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab-bar::-webkit-scrollbar { display: none; }

    .tab-item {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--rm-text-secondary, #6b5c4a);
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .tab-item ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; }
    .tab-item:hover { color: var(--rm-text, #2d2016); }
    .tab-item.active {
      color: var(--rm-accent, #e8622e);
      border-bottom-color: var(--rm-accent, #e8622e);
    }

    /* Settings body */
    .settings-body {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 24px;
    }

    .section { margin-bottom: 8px; }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rm-text-muted, #a08060);
      padding: 16px 20px 6px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--rm-border, rgba(0,0,0,0.08));
      gap: 12px;
    }
    .setting-row.muted-row { opacity: 0.5; }

    .setting-name {
      font-size: 15px;
      font-weight: 500;
      flex-shrink: 0;
      color: var(--rm-text);
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .setting-hint {
      font-size: 12px;
      color: var(--rm-text-muted, #a08060);
    }

    .muted-note { font-size: 13px; color: var(--rm-text-muted, #a08060); }

    /* Theme select */
    .theme-select {
      background: var(--rm-bg-surface, #fff);
      color: var(--rm-text, #2d2016);
      border: 1px solid var(--rm-border, rgba(0,0,0,0.12));
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 14px;
      cursor: pointer;
      min-width: 160px;
      flex-shrink: 0;
    }

    /* Segmented buttons */
    .btn-group {
      display: flex;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--rm-border, rgba(0,0,0,0.1));
      flex-shrink: 0;
    }
    .seg-btn {
      background: transparent;
      border: none;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--rm-text-secondary, #6b5c4a);
      border-right: 1px solid var(--rm-border, rgba(0,0,0,0.1));
      transition: background 0.12s, color 0.12s;
    }
    .seg-btn:last-child { border-right: none; }
    .seg-btn.active { background: var(--rm-accent, #e8622e); color: #fff; }
    .seg-btn:hover:not(.active) { background: var(--rm-border); color: var(--rm-text); }

    /* Toggle */
    .toggle { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
    .toggle input { display: none; }
    .toggle-track {
      width: 44px; height: 24px;
      background: var(--rm-border, rgba(0,0,0,0.15));
      border-radius: 12px;
      position: relative;
      transition: background 0.2s;
    }
    .toggle input:checked + .toggle-track { background: var(--rm-accent, #e8622e); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 20px; height: 20px;
      background: #fff; border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(20px); }

    /* Placeholder tab */
    .placeholder-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 12px;
      color: var(--rm-text-secondary);
      text-align: center;
    }
    .placeholder-tab ha-icon { --mdc-icon-size: 48px; opacity: 0.3; }
    .placeholder-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--rm-text);
    }
    .placeholder-msg {
      font-size: 14px;
      max-width: 280px;
      line-height: 1.5;
    }
  `;
}

customElements.define('rm-settings-view', RmSettingsView);
