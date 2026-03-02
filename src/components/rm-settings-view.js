/**
 * Recipe Manager — Settings panel.
 * The parent card provides the header/title; this component only renders the body.
 * Dispatches 'rm-settings-change' with the full updated settings object.
 */
import { LitElement, html, css } from 'lit';

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

  render() {
    const s = this.settings;

    // Midnight and Ember are always-dark — no dark mode toggle shown
    const alwaysDark = s.theme === 'midnight' || s.theme === 'ember';

    return html`
      <div class="settings-body">

        <!-- ── Appearance ────────────────────────────── -->
        <div class="section">
          <div class="section-label">Appearance</div>

          <!-- Theme — emoji dropdown matching Shopping List Manager style -->
          <div class="setting-row">
            <span class="setting-name">Theme</span>
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

          <!-- Dark mode — hidden for always-dark themes -->
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

          <!-- Text size -->
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

        <!-- ── Display ───────────────────────────────── -->
        <div class="section">
          <div class="section-label">Display</div>

          <!-- Grid columns -->
          <div class="setting-row">
            <span class="setting-name">Recipe columns</span>
            <div class="btn-group">
              ${[2, 3, 4].map(n => html`
                <button class="seg-btn ${s.columns === n ? 'active' : ''}"
                  @click=${() => this._update({ columns: n })}>${n}</button>
              `)}
            </div>
          </div>

          <!-- Show favourites section -->
          <div class="setting-row">
            <span class="setting-name">Favourites section</span>
            <label class="toggle">
              <input type="checkbox" ?checked=${s.showFavourites}
                @change=${e => this._update({ showFavourites: e.target.checked })} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>

          <!-- Show meal planner -->
          <div class="setting-row">
            <span class="setting-name">Meal planner</span>
            <label class="toggle">
              <input type="checkbox" ?checked=${s.showPlanner}
                @change=${e => this._update({ showPlanner: e.target.checked })} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </div>

      </div>
    `;
  }

  static styles = css`
    :host { display: block; height: 100%; overflow-y: auto; }

    .settings-body {
      padding: 8px 0 24px;
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
  `;
}

customElements.define('rm-settings-view', RmSettingsView);
