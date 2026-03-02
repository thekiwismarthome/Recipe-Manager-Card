/**
 * Recipe Manager — Settings panel.
 * Dispatches 'rm-settings-change' with the full updated settings object.
 */
import { LitElement, html, css } from 'lit';

const THEMES = [
  { id: 'warm',     label: 'Warm',     swatch: '#e8622e' },
  { id: 'forest',   label: 'Forest',   swatch: '#2e7d32' },
  { id: 'ocean',    label: 'Ocean',    swatch: '#1565c0' },
  { id: 'midnight', label: 'Midnight', swatch: '#7c3aed', alwaysDark: true },
  { id: 'ember',    label: 'Ember',    swatch: '#f57c00', alwaysDark: true },
  { id: 'blossom',  label: 'Blossom',  swatch: '#c2185b' },
];

class RmSettingsView extends LitElement {
  static properties = {
    settings: { type: Object },
  };

  constructor() {
    super();
    this.settings = {};
  }

  _update(patch) {
    const next = { ...this.settings, ...patch };
    this.dispatchEvent(new CustomEvent('rm-settings-change', {
      detail: { settings: next },
      bubbles: true,
      composed: true,
    }));
  }

  _close() {
    this.dispatchEvent(new CustomEvent('rm-settings-close', { bubbles: true, composed: true }));
  }

  render() {
    const s = this.settings;
    const theme = THEMES.find(t => t.id === s.theme) ?? THEMES[0];
    const alwaysDark = theme.alwaysDark ?? false;

    return html`
      <div class="settings-panel">
        <div class="settings-header">
          <span class="settings-title">Settings</span>
          <button class="icon-btn" @click=${this._close} title="Close settings">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="settings-body">

          <!-- ── Appearance ────────────────────────────── -->
          <div class="section">
            <div class="section-label">Appearance</div>

            <!-- Theme swatches -->
            <div class="setting-row col">
              <span class="setting-name">Theme</span>
              <div class="theme-row">
                ${THEMES.map(t => html`
                  <button
                    class="swatch-btn ${s.theme === t.id ? 'active' : ''}"
                    style="--swatch: ${t.swatch}"
                    title="${t.label}${t.alwaysDark ? ' (dark)' : ''}"
                    @click=${() => this._update({ theme: t.id })}
                  >
                    <span class="swatch-dot"></span>
                    <span class="swatch-label">${t.label}</span>
                    ${t.alwaysDark ? html`<ha-icon class="moon-icon" icon="mdi:weather-night"></ha-icon>` : ''}
                  </button>
                `)}
              </div>
            </div>

            <!-- Dark mode — hidden when theme forces dark -->
            ${!alwaysDark ? html`
              <div class="setting-row">
                <span class="setting-name">Dark mode</span>
                <div class="btn-group">
                  ${[['off','Light'],['system','Auto'],['on','Dark']].map(([val, lbl]) => html`
                    <button
                      class="seg-btn ${s.darkMode === val ? 'active' : ''}"
                      @click=${() => this._update({ darkMode: val })}
                    >${lbl}</button>
                  `)}
                </div>
              </div>
            ` : html`
              <div class="setting-row muted-row">
                <span class="setting-name">Dark mode</span>
                <span class="muted-note">Always dark for this theme</span>
              </div>
            `}

            <!-- Font size -->
            <div class="setting-row">
              <span class="setting-name">Text size</span>
              <div class="btn-group">
                ${[['small','S'],['medium','M'],['large','L']].map(([val, lbl]) => html`
                  <button
                    class="seg-btn ${s.fontSize === val ? 'active' : ''}"
                    @click=${() => this._update({ fontSize: val })}
                  >${lbl}</button>
                `)}
              </div>
            </div>
          </div>

          <!-- ── Display ───────────────────────────────── -->
          <div class="section">
            <div class="section-label">Display</div>

            <!-- Grid columns -->
            <div class="setting-row">
              <span class="setting-name">Recipe columns</span>
              <div class="btn-group">
                ${[2, 3, 4].map(n => html`
                  <button
                    class="seg-btn ${s.columns === n ? 'active' : ''}"
                    @click=${() => this._update({ columns: n })}
                  >${n}</button>
                `)}
              </div>
            </div>

            <!-- Show favourites section -->
            <div class="setting-row">
              <span class="setting-name">Favourites section</span>
              <label class="toggle">
                <input
                  type="checkbox"
                  ?checked=${s.showFavourites}
                  @change=${e => this._update({ showFavourites: e.target.checked })}
                />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>

            <!-- Show meal planner -->
            <div class="setting-row">
              <span class="setting-name">Meal planner</span>
              <label class="toggle">
                <input
                  type="checkbox"
                  ?checked=${s.showPlanner}
                  @change=${e => this._update({ showPlanner: e.target.checked })}
                />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; }

    .settings-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--rm-bg-main);
      color: var(--rm-text);
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--rm-border);
      background: var(--rm-bg-surface);
      flex-shrink: 0;
    }

    .settings-title {
      font-size: 18px;
      font-weight: 600;
    }

    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rm-text-secondary);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      padding: 0;
    }
    .icon-btn:hover { background: var(--rm-border); color: var(--rm-text); }

    .settings-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0 24px;
    }

    .section {
      margin-bottom: 8px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rm-text-muted);
      padding: 16px 20px 6px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--rm-border);
      gap: 12px;
    }
    .setting-row.col {
      flex-direction: column;
      align-items: flex-start;
    }
    .setting-row.muted-row { opacity: 0.5; }

    .setting-name {
      font-size: 15px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .muted-note {
      font-size: 13px;
      color: var(--rm-text-muted);
    }

    /* Theme swatches */
    .theme-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
      width: 100%;
    }

    .swatch-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: var(--rm-bg-surface);
      border: 2px solid transparent;
      border-radius: 10px;
      padding: 8px 10px 6px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      position: relative;
      min-width: 62px;
      color: var(--rm-text-secondary);
    }
    .swatch-btn.active {
      border-color: var(--swatch);
      color: var(--rm-text);
    }
    .swatch-btn:hover { box-shadow: 0 0 0 2px var(--swatch); }

    .swatch-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--swatch);
      display: block;
    }

    .swatch-label {
      font-size: 11px;
      font-weight: 500;
    }

    .moon-icon {
      position: absolute;
      top: 4px;
      right: 4px;
      --mdc-icon-size: 12px;
      opacity: 0.6;
    }

    /* Segmented button group */
    .btn-group {
      display: flex;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--rm-border);
      flex-shrink: 0;
    }

    .seg-btn {
      background: transparent;
      border: none;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--rm-text-secondary);
      border-right: 1px solid var(--rm-border);
      transition: background 0.12s, color 0.12s;
    }
    .seg-btn:last-child { border-right: none; }
    .seg-btn.active {
      background: var(--rm-accent);
      color: #fff;
    }
    .seg-btn:hover:not(.active) { background: var(--rm-border); color: var(--rm-text); }

    /* Toggle switch */
    .toggle {
      display: flex;
      align-items: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .toggle input { display: none; }

    .toggle-track {
      width: 44px;
      height: 24px;
      background: var(--rm-border);
      border-radius: 12px;
      position: relative;
      transition: background 0.2s;
    }
    .toggle input:checked + .toggle-track {
      background: var(--rm-accent);
    }

    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .toggle input:checked ~ .toggle-track .toggle-thumb {
      transform: translateX(20px);
    }
  `;
}

customElements.define('rm-settings-view', RmSettingsView);
