/**
 * Recipe Manager — Settings panel.
 * Tabs: Appearance (theme, dark, font, grid, nav) | Advanced (sound, wake lock, units) | Sync | Help
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
        <div class="tab-bar">
          ${[
            ['appearance', 'mdi:palette-outline',      'Appearance'],
            ['advanced',   'mdi:tune-variant',         'Advanced'],
            ['sync',       'mdi:cloud-sync-outline',   'Sync'],
            ['help',       'mdi:help-circle-outline',  'Help'],
          ].map(([id, icon, label]) => html`
            <button class="tab-item ${this._activeTab === id ? 'active' : ''}"
              @click=${() => { this._activeTab = id; }}>
              <ha-icon icon="${icon}"></ha-icon>
              <span>${label}</span>
            </button>
          `)}
        </div>
        <div class="settings-body">
          ${this._activeTab === 'appearance' ? this._renderAppearance(s) : ''}
          ${this._activeTab === 'advanced'   ? this._renderAdvanced(s)   : ''}
          ${this._activeTab === 'sync'       ? this._renderPlaceholder('Sync', 'mdi:cloud-sync-outline', 'Cloud sync and backup options — coming soon.') : ''}
          ${this._activeTab === 'help'       ? this._renderPlaceholder('Help', 'mdi:help-circle-outline', 'Documentation and support — coming soon.') : ''}
        </div>
      </div>
    `;
  }

  _renderAppearance(s) {
    const alwaysDark  = s.theme === 'midnight' || s.theme === 'ember' || s.theme === 'neon';
    const alwaysLight = s.theme === 'arctic'   || s.theme === 'meadow' || s.theme === 'ocean';
    const noToggle    = alwaysDark || alwaysLight;
    return html`
      <!-- ── Theme ── -->
      <div class="section">
        <div class="section-label">Theme</div>

        <div class="setting-row">
          <span class="setting-name">Colour theme</span>
          <select class="theme-select" @change=${e => this._update({ theme: e.target.value })}>
            <optgroup label="Adaptive">
              <option value="soft"     ?selected=${s.theme === 'soft' || !s.theme}>🎨 Soft Pastel</option>
            </optgroup>
            <optgroup label="Light Themes">
              <option value="arctic"   ?selected=${s.theme === 'arctic'  }>🧊 Arctic</option>
              <option value="meadow"   ?selected=${s.theme === 'meadow'  }>🌿 Meadow</option>
              <option value="blossom"  ?selected=${s.theme === 'blossom' }>🌸 Blossom</option>
              <option value="ocean"    ?selected=${s.theme === 'ocean'   }>🌊 Ocean Blue</option>
            </optgroup>
            <optgroup label="Dark Themes">
              <option value="midnight" ?selected=${s.theme === 'midnight'}>🌙 Midnight Ocean</option>
              <option value="ember"    ?selected=${s.theme === 'ember'   }>🔥 Ember</option>
              <option value="neon"     ?selected=${s.theme === 'neon'    }>🍇 Purple &amp; Cyan</option>
            </optgroup>
          </select>
        </div>

        ${noToggle ? html`
          <div class="setting-row muted-row">
            <span class="setting-name">Dark mode</span>
            <span class="muted-note">${alwaysDark ? 'Always dark for this theme' : 'Always light for this theme'}</span>
          </div>
        ` : html`
          <div class="setting-row">
            <span class="setting-name">Dark mode</span>
            <div class="btn-group">
              ${[['off','Light'],['system','Auto'],['on','Dark']].map(([val, lbl]) => html`
                <button class="seg-btn ${s.darkMode === val ? 'active' : ''}"
                  @click=${() => this._update({ darkMode: val })}>${lbl}</button>
              `)}
            </div>
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

      <!-- ── Recipe Grid ── -->
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
            <span class="setting-hint">Recipes shown in the Recent filter tab</span>
          </div>
          <div class="btn-group">
            ${[6, 12, 24].map(n => html`
              <button class="seg-btn ${(s.recentCount ?? 12) === n ? 'active' : ''}"
                @click=${() => this._update({ recentCount: n })}>${n}</button>
            `)}
          </div>
        </div>
      </div>

      <!-- ── Navigation ── -->
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

  _renderAdvanced(s) {
    return html`
      <!-- ── Timer Sound ── -->
      <div class="section">
        <div class="section-label">Timer Sound</div>

        <div class="setting-row">
          <span class="setting-name">Alarm sound</span>
          <select class="theme-select" @change=${e => this._update({ timerSound: e.target.value })}>
            <option value="beep"  ?selected=${(s.timerSound ?? 'beep') === 'beep'}>Beep</option>
            <option value="ding"  ?selected=${s.timerSound === 'ding'            }>Ding</option>
            <option value="alarm" ?selected=${s.timerSound === 'alarm'           }>Alarm (3 beeps)</option>
            <option value="none"  ?selected=${s.timerSound === 'none'            }>Silent</option>
            <option value="file"  ?selected=${s.timerSound === 'file'            }>Custom file…</option>
          </select>
        </div>

        ${s.timerSound === 'file' ? html`
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">Sound file</span>
              <span class="setting-hint">${s.timerSoundFileName || 'No file selected'}</span>
            </div>
            <label class="file-label">
              <input type="file" accept="audio/*" class="file-input"
                @change=${this._handleSoundFileChange} />
              <ha-icon icon="mdi:folder-music-outline"></ha-icon>
              ${s.timerSoundFile ? 'Change' : 'Choose file'}
            </label>
          </div>
        ` : ''}

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Test sound</span>
            <span class="setting-hint">Play a preview of the selected alarm</span>
          </div>
          <button class="seg-btn active" @click=${() => this._testSound(s.timerSound ?? 'beep', s.timerSoundFile)}>
            <ha-icon icon="mdi:volume-high"></ha-icon> Play
          </button>
        </div>
      </div>

      <!-- ── Keep Screen On ── -->
      <div class="section">
        <div class="section-label">Keep Screen On</div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Keep screen on while viewing a recipe</span>
            <span class="setting-hint">Uses Wake Lock API (Chrome / Edge / Android)</span>
          </div>
          <label class="toggle">
            <input type="checkbox" ?checked=${s.keepScreenOn}
              @change=${e => this._update({ keepScreenOn: e.target.checked })} />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>

        ${s.keepScreenOn ? html`
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">Auto-release after</span>
              <span class="setting-hint">Screen lock released after this many minutes</span>
            </div>
            <div class="btn-group">
              ${[15, 30, 45, 60].map(n => html`
                <button class="seg-btn ${(s.wakeLockDuration ?? 60) === n ? 'active' : ''}"
                  @click=${() => this._update({ wakeLockDuration: n })}>${n}m</button>
              `)}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- ── Unit Conversion ── -->
      <div class="section">
        <div class="section-label">Unit Conversion</div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Show metric conversion button</span>
            <span class="setting-hint">Button in Ingredients tab converts oz/lb/cups/fl oz → g/ml/kg</span>
          </div>
          <label class="toggle">
            <input type="checkbox" ?checked=${s.showUnitConversion}
              @change=${e => this._update({ showUnitConversion: e.target.checked })} />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
      </div>
    `;
  }

  _handleSoundFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      this._update({ timerSoundFile: evt.target.result, timerSoundFileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  _testSound(type, fileUrl) {
    if (type === 'file') {
      if (fileUrl) {
        const audio = new Audio(fileUrl);
        audio.play().catch(err => console.warn('Could not play file:', err));
      }
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'ding') {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(1046, ctx.currentTime);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.0);
      } else if (type === 'alarm') {
        for (let i = 0; i < 3; i++) {
          const t = ctx.currentTime + i * 0.35;
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'square'; osc.frequency.setValueAtTime(660, t);
          gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.start(t); osc.stop(t + 0.2);
        }
      } else if (type !== 'none') {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) { console.warn('Audio test failed:', e); }
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

    .settings-root { display: flex; flex-direction: column; height: 100%; }

    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--rm-border, rgba(0,0,0,0.08));
      background: var(--rm-bg-surface, #fff);
      flex-shrink: 0; overflow-x: auto; scrollbar-width: none;
    }
    .tab-bar::-webkit-scrollbar { display: none; }

    .tab-item {
      display: flex; align-items: center; gap: 5px;
      background: none; border: none;
      border-bottom: 2px solid transparent;
      padding: 10px 14px; font-size: 13px; font-weight: 500;
      color: var(--rm-text-secondary, #6b5c4a);
      cursor: pointer; white-space: nowrap;
      transition: color 0.15s, border-color 0.15s; flex-shrink: 0;
    }
    .tab-item ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; }
    .tab-item:hover { color: var(--rm-text, #2d2016); }
    .tab-item.active { color: var(--rm-accent); border-bottom-color: var(--rm-accent); }

    .settings-body { flex: 1; overflow-y: auto; padding-bottom: 24px; }

    .section { margin-bottom: 8px; }

    .section-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--rm-text-muted, #a08060); padding: 16px 20px 6px;
    }

    .setting-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--rm-border, rgba(0,0,0,0.08)); gap: 12px;
    }
    .setting-row.muted-row { opacity: 0.5; }

    .setting-name { font-size: 15px; font-weight: 500; flex-shrink: 0; color: var(--rm-text); }

    .setting-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .setting-hint { font-size: 12px; color: var(--rm-text-muted, #a08060); }

    .muted-note { font-size: 13px; color: var(--rm-text-muted, #a08060); }

    .theme-select {
      background: var(--rm-bg-surface, #fff); color: var(--rm-text, #2d2016);
      border: 1px solid var(--rm-border, rgba(0,0,0,0.12));
      border-radius: 8px; padding: 6px 10px; font-size: 14px; cursor: pointer;
      min-width: 160px; flex-shrink: 0;
    }

    .btn-group {
      display: flex; border-radius: 8px; overflow: hidden;
      border: 1px solid var(--rm-border, rgba(0,0,0,0.1)); flex-shrink: 0;
    }
    .seg-btn {
      background: transparent; border: none; padding: 6px 14px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      color: var(--rm-text-secondary, #6b5c4a);
      border-right: 1px solid var(--rm-border, rgba(0,0,0,0.1));
      transition: background 0.12s, color 0.12s;
      display: flex; align-items: center; gap: 4px;
    }
    .seg-btn ha-icon { --mdc-icon-size: 16px; }
    .seg-btn:last-child { border-right: none; }
    .seg-btn.active { background: var(--rm-accent); color: #fff; }
    .seg-btn:hover:not(.active) { background: var(--rm-border); color: var(--rm-text); }

    .toggle { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
    .toggle input { display: none; }
    .toggle-track {
      width: 44px; height: 24px;
      background: var(--rm-border, rgba(0,0,0,0.15));
      border-radius: 12px; position: relative; transition: background 0.2s;
    }
    .toggle input:checked + .toggle-track { background: var(--rm-accent); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 20px; height: 20px; background: #fff; border-radius: 50%;
      transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(20px); }

    .file-label {
      display: flex; align-items: center; gap: 6px;
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 8px; padding: 6px 12px; font-size: 13px;
      color: var(--rm-text); cursor: pointer; transition: background 0.15s;
      flex-shrink: 0;
    }
    .file-label:hover { background: var(--rm-accent-soft); }
    .file-label ha-icon { --mdc-icon-size: 18px; color: var(--rm-accent); }
    .file-input { display: none; }

    .placeholder-tab {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 60px 24px; gap: 12px;
      color: var(--rm-text-secondary); text-align: center;
    }
    .placeholder-tab ha-icon { --mdc-icon-size: 48px; opacity: 0.3; }
    .placeholder-title { font-size: 18px; font-weight: 600; color: var(--rm-text); }
    .placeholder-msg { font-size: 14px; max-width: 280px; line-height: 1.5; }
  `;
}

if (!customElements.get('rm-settings-view')) customElements.define('rm-settings-view', RmSettingsView);
