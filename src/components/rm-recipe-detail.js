/**
 * Recipe detail view — full recipe with ingredients, directions, nutrition, photos and actions.
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

// Regex to find time mentions in directions text
// Matches: "10 minutes", "1 hour", "30 mins", "2 hrs", "45 seconds", "1 hour 30 minutes"
const TIME_RE = /(\d+\s*(?:hours?|hrs?)\s*(?:and\s*)?\d*\s*(?:minutes?|mins?)?|\d+\s*(?:minutes?|mins?|seconds?|secs?|hours?|hrs?))/gi;

function parseTimeToSeconds(text) {
  const t = text.toLowerCase();
  let total = 0;
  const hourM = t.match(/(\d+)\s*h(?:ours?|rs?)?/);
  if (hourM) total += parseInt(hourM[1]) * 3600;
  const minM = t.match(/(\d+)\s*m(?:in(?:utes?)?)?(?!\s*l)/);
  if (minM) total += parseInt(minM[1]) * 60;
  const secM = t.match(/(\d+)\s*s(?:ec(?:onds?)?)?/);
  if (secM) total += parseInt(secM[1]);
  if (!total) {
    const bare = t.match(/^(\d+)$/);
    if (bare) total = parseInt(bare[1]) * 60;
  }
  return total || 0;
}

// Daily Reference Values (FDA / EU)
const RDA = {
  calories:      { label: 'Calories',         val: 2000, unit: 'kcal' },
  fat:           { label: 'Total Fat',         val: 65,   unit: 'g'    },
  saturated_fat: { label: 'Saturated Fat',     val: 20,   unit: 'g'    },
  cholesterol:   { label: 'Cholesterol',       val: 300,  unit: 'mg'   },
  sodium:        { label: 'Sodium',            val: 2300, unit: 'mg'   },
  carbohydrates: { label: 'Total Carbohydrate',val: 300,  unit: 'g'    },
  fiber:         { label: 'Dietary Fiber',     val: 28,   unit: 'g'    },
  sugar:         { label: 'Added Sugars',      val: 50,   unit: 'g'    },
  protein:       { label: 'Protein',           val: 50,   unit: 'g'    },
};

// Imperial → metric conversion factors
const IMPERIAL_TO_METRIC = {
  'oz':     { factor: 28.3495, to: 'g',  toFull: 'g'  },
  'lb':     { factor: 453.592, to: 'g',  toFull: 'g', thresholdKg: 500 },
  'cup':    { factor: 250,     to: 'ml', toFull: 'ml' },
  'cups':   { factor: 250,     to: 'ml', toFull: 'ml' },
  'fl oz':  { factor: 29.5735, to: 'ml', toFull: 'ml' },
  'pt':     { factor: 473.176, to: 'ml', toFull: 'ml' },
  'qt':     { factor: 946.353, to: 'ml', toFull: 'ml' },
};

function convertToMetric(amount, unit) {
  if (!amount || !unit) return null;
  const num = parseFloat(amount);
  if (isNaN(num)) return null;
  const key = unit.toLowerCase().trim();
  const conv = IMPERIAL_TO_METRIC[key];
  if (!conv) return null;
  let result = num * conv.factor;
  let resultUnit = conv.to;
  // For lb → use kg if ≥ 500g
  if (key === 'lb' && result >= 500) { result = result / 1000; resultUnit = 'kg'; }
  // For ml → use L if ≥ 1000ml
  if (resultUnit === 'ml' && result >= 1000) { result = result / 1000; resultUnit = 'L'; }
  // Round sensibly
  const rounded = result >= 10 ? Math.round(result) : Math.round(result * 10) / 10;
  return { amount: String(rounded), unit: resultUnit };
}

class RmRecipeDetail extends LitElement {
  static properties = {
    recipe:              { type: Object },
    api:                 { type: Object },
    shoppingLists:       { type: Array },
    slmAvailable:        { type: Boolean },
    settings:            { type: Object },
    wide:                { type: Boolean },
    _editing:            { type: Boolean },
    _editData:           { type: Object },
    _servingMult:        { type: Number },
    _activeTab:          { type: String },  // 'ingredients'|'directions'|'notes'|'nutrition'|'photos'
    _showShoppingPicker: { type: Boolean },
    _selectedListId:     { type: String },
    _checkedIngredients: { type: Object },  // Set of indices
    _shoppingAdding:     { type: Boolean },
    _shoppingResult:     { type: String },
    _confirmDelete:      { type: Boolean },
    _downloading:        { type: Boolean },
    _photoUrlInput:      { type: String },
    _addingPhotoUrl:     { type: Boolean },
    _metricMode:         { type: Boolean },
    _wakeActive:         { type: Boolean },
    _completedSteps:     { type: Object },  // Set of completed step indices
    _editIngInput:        { type: String },
    _editStepInput:       { type: String },
    _nutritionExpanded:   { type: Boolean },
  };

  constructor() {
    super();
    this.recipe = null;
    this.api = null;
    this.shoppingLists = [];
    this.slmAvailable = false;
    this.settings = {};
    this.wide = false;
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
    this._photoUrlInput = '';
    this._addingPhotoUrl = false;
    this._metricMode = false;
    this._wakeActive = false;
    this._completedSteps = new Set();
    this._editIngInput = '';
    this._editStepInput = '';
    this._nutritionExpanded = false;
    this._wakeLockSentinel = null;
    this._wakeLockTimeout = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._releaseWakeLock();
  }

  // -- Wake Lock -----------------------------------------------------------

  async _requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      this._wakeLockSentinel = await navigator.wakeLock.request('screen');
      this._wakeActive = true;
      const durationMin = this.settings?.wakeLockDuration ?? 60;
      this._wakeLockTimeout = setTimeout(() => this._releaseWakeLock(), durationMin * 60_000);
    } catch (err) { console.warn('Wake Lock failed:', err); }
  }

  async _releaseWakeLock() {
    if (this._wakeLockSentinel) {
      try { await this._wakeLockSentinel.release(); } catch { /* ignore */ }
      this._wakeLockSentinel = null;
    }
    this._wakeActive = false;
    if (this._wakeLockTimeout) { clearTimeout(this._wakeLockTimeout); this._wakeLockTimeout = null; }
  }

  updated(changedProps) {
    if (changedProps.has('recipe') && this.recipe) {
      this._servingMult = 1;
      this._editing = false;
      this._confirmDelete = false;
      this._shoppingResult = null;
      this._showShoppingPicker = false;
      this._checkedIngredients = null;
      this._photoUrlInput = '';
      this._metricMode = false;
      this._completedSteps = new Set();
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
      ingredients:   [...(this.recipe.ingredients || [])],
      instructions:  [...(this.recipe.instructions || [])],
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

  _editAddIngredient() {
    const raw = this._editIngInput.trim();
    if (!raw) return;
    let newIng;
    if (raw.startsWith('#')) {
      newIng = { name: raw, is_heading: true };
    } else {
      const parts = raw.split(/\s+/);
      let amount = '', unit = '', name = '';
      if (parts.length >= 3 && !isNaN(parseFloat(parts[0]))) {
        amount = parts[0]; unit = parts[1]; name = parts.slice(2).join(' ');
      } else if (parts.length === 2 && !isNaN(parseFloat(parts[0]))) {
        amount = parts[0]; name = parts[1];
      } else { name = raw; }
      newIng = { amount, unit, name };
    }
    this._editData = { ...this._editData, ingredients: [...(this._editData.ingredients || []), newIng] };
    this._editIngInput = '';
  }

  _editRemoveIngredient(idx) {
    this._editData = { ...this._editData, ingredients: (this._editData.ingredients || []).filter((_, i) => i !== idx) };
  }

  _editMoveIngredient(idx, dir) {
    const arr = [...(this._editData.ingredients || [])];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    this._editData = { ...this._editData, ingredients: arr };
  }

  _editMoveStep(idx, dir) {
    const arr = [...(this._editData.instructions || [])];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    this._editData = { ...this._editData, instructions: arr };
  }

  _editAddStep(text) {
    if (!text.trim()) return;
    this._editData = { ...this._editData, instructions: [...(this._editData.instructions || []), text.trim()] };
  }

  _editRemoveStep(idx) {
    this._editData = { ...this._editData, instructions: (this._editData.instructions || []).filter((_, i) => i !== idx) };
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
      notes:        d.notes,
      rating:       d.rating || null,
      ingredients:  d.ingredients || [],
      instructions: d.instructions || [],
      nutrition:    hasNutrition ? nutrition : null,
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
    // Default: NO items checked — user selects what they need
    this._checkedIngredients = new Set();
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

  _selectAllIngredients() {
    const count = this.recipe?.ingredients?.length ?? 0;
    this._checkedIngredients = new Set([...Array(count).keys()]);
  }

  _clearAllIngredients() {
    this._checkedIngredients = new Set();
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
      detail: { ingredients, listId: this._selectedListId || null, recipeName: this.recipe.name },
      bubbles: true,
      composed: true,
    }));
    await new Promise(r => setTimeout(r, 600));
    this._shoppingAdding = false;
    this._shoppingResult = 'success';
    this._showShoppingPicker = false;
    setTimeout(() => { this._shoppingResult = null; }, 2500);
  }

  _handleQuickRate(n) {
    const newRating = this.recipe.rating === n ? null : n;
    this.dispatchEvent(new CustomEvent('rm-update-recipe', {
      detail: { recipeId: this.recipe.id, data: { rating: newRating } },
      bubbles: true, composed: true,
    }));
  }

  _handleShowPlanner() {
    this.dispatchEvent(new CustomEvent('rm-show-planner', { bubbles: true, composed: true }));
  }

  _handleChipNav(filterMode, value) {
    this.dispatchEvent(new CustomEvent('rm-chip-nav', {
      detail: { filterMode, value },
      bubbles: true,
      composed: true,
    }));
  }

  // -- Timer helpers ----------------------------------------------------------

  _fireTimer(seconds, label) {
    const recipeName = this.recipe?.name;
    const fullLabel = recipeName ? `${recipeName} — ${label}` : label;
    this.dispatchEvent(new CustomEvent('rm-start-timer', {
      detail: { seconds, label: fullLabel },
      bubbles: true,
      composed: true,
    }));
  }

  // -- Photos -----------------------------------------------------------------

  async _handleAddPhotoUrl() {
    const url = this._photoUrlInput.trim();
    if (!url) return;
    this._addingPhotoUrl = true;
    try {
      // For now, set it as the main image_url (first photo sets main image)
      const existingPhotos = this.recipe.photos || [];
      const newPhotos = [...existingPhotos, url];
      const updateData = { photos: newPhotos };
      // If no main image, also set it as image_url
      if (!this.recipe.image_url) updateData.image_url = url;
      this.dispatchEvent(new CustomEvent('rm-update-recipe', {
        detail: { recipeId: this.recipe.id, data: updateData },
        bubbles: true,
        composed: true,
      }));
      this._photoUrlInput = '';
    } finally {
      this._addingPhotoUrl = false;
    }
  }

  _handleCameraCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target.result.split(',')[1];
      try {
        const result = await this.api.uploadRecipeImage(this.recipe.id, b64);
        if (result?.image_url || result?.local_url) {
          const newUrl = result.image_url || result.local_url;
          const newPhotos = [...(this.recipe.photos || []), newUrl];
          const updateData = { photos: newPhotos };
          if (!this.recipe.image_url) updateData.image_url = newUrl;
          this.dispatchEvent(new CustomEvent('rm-update-recipe', {
            detail: { recipeId: this.recipe.id, data: updateData },
            bubbles: true,
            composed: true,
          }));
        }
      } catch (err) {
        console.warn('Camera upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  }

  _setMainPhoto(url) {
    this.dispatchEvent(new CustomEvent('rm-update-recipe', {
      detail: { recipeId: this.recipe.id, data: { image_url: url } },
      bubbles: true,
      composed: true,
    }));
  }

  _removePhoto(url) {
    const newPhotos = (this.recipe.photos || []).filter(p => p !== url);
    const updateData = { photos: newPhotos };
    if (this.recipe.image_url === url) {
      updateData.image_url = newPhotos[0] || null;
    }
    this.dispatchEvent(new CustomEvent('rm-update-recipe', {
      detail: { recipeId: this.recipe.id, data: updateData },
      bubbles: true,
      composed: true,
    }));
  }

  // -- Render -------------------------------------------------------------------

  _renderChipGroup(label, items, cssClass) {
    if (!items?.length) return '';
    return html`
      <div class="chip-group">
        <span class="chip-group-label">${label}:</span>
        ${items.map(t => html`<span class="chip ${cssClass}">${t}</span>`)}
      </div>
    `;
  }

  _renderChipGroups(r) {
    const courses    = r.courses    || [];
    const categories = r.categories || [];
    const collections= r.collections|| [];
    if (!courses.length && !categories.length && !collections.length) return '';
    return html`
      <div class="chips-area">
        ${courses.length ? html`
          <div class="chip-group-row">
            <span class="chip chip-label">Course:</span>
            ${courses.map(t => html`<button class="chip chip-course chip-nav" @click=${() => this._handleChipNav('courses', t)} title="Filter by course: ${t}">${t}</button>`)}
          </div>` : ''}
        ${categories.length ? html`
          <div class="chip-group-row">
            <span class="chip chip-label">Category:</span>
            ${categories.map(t => html`<button class="chip chip-category chip-nav" @click=${() => this._handleChipNav('categories', t)} title="Filter by category: ${t}">${t}</button>`)}
          </div>` : ''}
        ${collections.length ? html`
          <div class="chip-group-row">
            <span class="chip chip-label">Collection:</span>
            ${collections.map(t => html`<button class="chip chip-collection chip-nav" @click=${() => this._handleChipNav('collections', t)} title="Filter by collection: ${t}">${t}</button>`)}
          </div>` : ''}
      </div>
    `;
  }

  _renderMetaRow(r) {
    const hasAny = r.servings || r.prep_time || r.cook_time || r.total_time;
    if (!hasAny) return '';
    const totalTime = r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || null;
    const calcTotal = (r.prep_time || 0) + (r.cook_time || 0);
    const showTotal = totalTime && totalTime !== calcTotal;
    return html`
      <div class="meta-chips">
        ${r.servings ? html`
          <span class="meta-chip-icon">
            <ha-icon icon="mdi:silverware-fork-knife"></ha-icon>
            ${r.servings_text || r.servings}
          </span>
        ` : ''}
        ${r.prep_time ? html`
          <span class="meta-chip-icon">
            <ha-icon icon="mdi:pencil-outline"></ha-icon>
            ${this._formatTime(r.prep_time)}
          </span>
        ` : ''}
        ${r.cook_time ? html`
          <span class="meta-chip-icon">
            <ha-icon icon="mdi:pot-steam-outline"></ha-icon>
            ${this._formatTime(r.cook_time)}
          </span>
        ` : ''}
        ${showTotal ? html`
          <span class="meta-chip-icon">
            <ha-icon icon="mdi:clock-outline"></ha-icon>
            ${this._formatTime(totalTime)}
          </span>
        ` : ''}
      </div>
    `;
  }

  _renderQuickRating(r) {
    const rating = r.rating || 0;
    return html`
      <div class="quick-rating">
        ${[1,2,3,4,5].map(n => html`
          <span class="qr-star ${n <= rating ? 'filled' : ''}"
            @click=${() => this._handleQuickRate(n)}>★</span>
        `)}
      </div>
    `;
  }

  _renderActionButtons(r) {
    return html`
      <div class="action-btns-row">
        <button class="action-icon-btn ${r.is_favourite ? 'fav-active' : ''}"
          @click=${this._handleToggleFav}
          title="${r.is_favourite ? 'Remove from favourites' : 'Add to favourites'}">
          <ha-icon icon="${r.is_favourite ? 'mdi:heart' : 'mdi:heart-outline'}"></ha-icon>
          <span>Favourite</span>
        </button>
        <button class="action-icon-btn"
          @click=${() => { this._activeTab = 'directions'; }}
          title="Cook">
          <ha-icon icon="mdi:chef-hat"></ha-icon>
          <span>Cook</span>
        </button>
        <button class="action-icon-btn" @click=${this._handleShowPlanner} title="Add to meal plan">
          <ha-icon icon="mdi:calendar-plus"></ha-icon>
          <span>Plan</span>
        </button>
        <button class="action-icon-btn" @click=${this._openShoppingPicker} title="Add to shopping list">
          <ha-icon icon="mdi:cart-plus"></ha-icon>
          <span>Shop</span>
        </button>
        ${r.source_url ? html`
          <a class="action-icon-btn" href="${r.source_url}" target="_blank" rel="noopener" title="Open source">
            <ha-icon icon="mdi:open-in-new"></ha-icon>
            <span>Source</span>
          </a>
        ` : ''}
        <button class="action-icon-btn" @click=${this._startEdit} title="Edit recipe">
          <ha-icon icon="mdi:pencil-outline"></ha-icon>
          <span>Edit</span>
        </button>
      </div>
    `;
  }

  _renderScaler() {
    const r = this.recipe;
    if (!r?.servings) return '';
    return html`
      <div class="scaler-row">
        <ha-icon class="scaler-icon" icon="mdi:silverware-fork-knife"></ha-icon>
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
    `;
  }

  _renderWakeLock() {
    if (!this.settings?.keepScreenOn) return '';
    return html`
      <div class="wakelock-row">
        <button class="wakelock-btn ${this._wakeActive ? 'active' : ''}"
          @click=${() => this._wakeActive ? this._releaseWakeLock() : this._requestWakeLock()}
          title="${this._wakeActive ? 'Release screen lock' : 'Keep screen on'}">
          <ha-icon icon="${this._wakeActive ? 'mdi:eye' : 'mdi:eye-off-outline'}"></ha-icon>
          ${this._wakeActive ? 'Screen on' : 'Keep screen on'}
        </button>
      </div>
    `;
  }

  render() {
    if (!this.recipe) return html``;
    const r = this.recipe;
    return this.wide ? this._renderWide(r) : this._renderNarrow(r);
  }

  _renderWide(r) {
    const groups = this._groupIngredients(r.ingredients);
    const picking = this._showShoppingPicker;
    const checkedSet = this._checkedIngredients;
    const checkedCount = checkedSet?.size ?? 0;

    return html`
      <div class="detail-container wide">
        <!--
          CSS grid: 2 cols (1fr 2fr) × auto rows
          [image]   [info card]
          [ings]    [directions]
          Whole card scrolls — no independent column scrolling
        -->
        <div class="wide-layout">

          <!-- row 1: image (1/3) + info card (2/3) -->
          <div class="wide-row">

          <!-- col 1: square image card (padding-top:100% inner wrapper forces square) -->
          <div class="wide-image-card">
            <div class="wide-image-square">
              ${r.image_url ? html`
                <img src="${r.image_url}" alt="${r.name}" />
              ` : html`
                <div class="hero-placeholder">
                  <ha-icon icon="mdi:food"></ha-icon>
                </div>
              `}
            </div>
          </div>

          <!-- col 2: info card -->
          <div class="wide-info-card">
            <h1 class="wide-title">${r.name}</h1>
            ${this._renderQuickRating(r)}
            ${this._renderActionButtons(r)}
            ${r.description ? html`<p class="wide-desc">${r.description}</p>` : ''}
            ${this._renderMetaRow(r)}
            ${this._renderChipGroups(r)}
          </div>

          </div><!-- end wide-row 1 -->

          <!-- row 2: ingredients (1/3) + directions (2/3) -->
          <div class="wide-row">

          <!-- col 1: ingredients column -->
          <div class="wide-ing-col">
            <!-- ingredients controls: scaler left, cart right — above ingredients only -->
            <div class="wide-ing-controls">
              ${this._renderScaler()}
              ${this._shoppingResult === 'success' ? html`
                <span class="ing-shop-success"><ha-icon icon="mdi:check-circle-outline"></ha-icon></span>
              ` : html`
                <button class="ing-shop-btn ${picking ? 'active' : ''}"
                  @click=${picking ? () => { this._showShoppingPicker = false; } : this._openShoppingPicker}
                  title="${picking ? 'Cancel' : 'Add to shopping list'}">
                  <ha-icon icon="${picking ? 'mdi:close' : 'mdi:cart-plus'}"></ha-icon>
                </button>
              `}
            </div>

            <!-- shopping picker (shown inline when picking) -->
            ${picking ? html`
              <div class="wide-section-card shopping-picker-panel">
                <div class="picker-select-row">
                  <button class="picker-sel-btn" @click=${this._selectAllIngredients}>Select All</button>
                  <button class="picker-sel-btn" @click=${this._clearAllIngredients}>Clear All</button>
                  ${this.slmAvailable && this.shoppingLists.length ? html`
                    <select class="list-select" .value=${this._selectedListId}
                      @change=${e => { this._selectedListId = e.target.value; }}>
                      ${this.shoppingLists.map(l => html`
                        <option value="${l.id}" ?selected=${l.id === this._selectedListId}>${l.name}</option>
                      `)}
                    </select>
                  ` : ''}
                </div>
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
            ` : ''}

            ${groups.map(g => html`
              <div class="wide-section-card">
                ${g.header ? html`<div class="wide-section-title">${g.header}</div>` : ''}
                ${g.items.length ? html`
                  <ul class="ingredient-list">
                    ${g.items.map((ing) => {
                      const globalIdx = (r.ingredients || []).indexOf(ing);
                      const { amount, unit } = this._getDisplayAmount(ing);
                      return html`
                        <li class="ingredient-item ${picking ? 'selectable' : ''}"
                          @click=${picking ? () => this._toggleIngredient(globalIdx) : undefined}>
                          ${picking ? html`
                            <span class="ing-check ${checkedSet?.has(globalIdx) ? 'checked' : ''}">
                              ${checkedSet?.has(globalIdx) ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
                            </span>
                          ` : ''}
                          <span class="ing-amount">${amount} ${unit}</span>
                          <span class="ing-name">${ing.name}${ing.notes ? html` <em class="ing-notes">(${ing.notes})</em>` : ''}</span>
                        </li>
                      `;
                    })}
                  </ul>
                ` : ''}
              </div>
            `)}

            <div class="wide-section-card">
              ${this._renderNutritionRing(r)}
            </div>
          </div>

          <!-- col 2: directions column, each step its own card -->
          <div class="wide-dir-col">
            <div class="wide-dir-spacer"></div>
            ${this._renderWakeLock()}
            ${(r.instructions || []).length ? (r.instructions || []).map((step, i) => {
              const done = this._completedSteps.has(i);
              return html`
                <div class="wide-section-card wide-step-card ${done ? 'step-done' : ''}">
                  <span class="step-num ${done ? 'done' : ''}"
                    @click=${(e) => { e.stopPropagation(); this._toggleStepComplete(i); }}
                    title="${done ? 'Mark incomplete' : 'Mark complete'}"
                  >${done ? html`<ha-icon icon="mdi:check"></ha-icon>` : i + 1}</span>
                  <span class="step-text">${this._renderStepWithTimers(step)}</span>
                </div>
              `;
            }) : html`<p class="empty-tab">No directions listed.</p>`}
            ${r.notes ? html`
              <div class="wide-section-card">
                <div class="wide-section-title">Notes</div>
                <p class="notes-text">${r.notes}</p>
              </div>
            ` : ''}
          </div>

          </div><!-- end wide-row 2 -->

        </div>

        <!-- Edit overlay -->
        ${this._editing ? this._renderEditPanel() : ''}
      </div>
    `;
  }

  _renderNarrow(r) {
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
          </div>
        </div>

        <div class="detail-scroll">
          <!-- Recipe meta -->
          <div class="detail-head">
            <h2 class="recipe-title">${r.name}</h2>
            ${this._renderQuickRating(r)}
            ${this._renderActionButtons(r)}
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
                  <span class="meta-val">${r.servings_text || r.servings}</span>
                </div>
              ` : ''}
            </div>

            ${this._renderChipGroups(r)}
          </div>

          <!-- Serving scaler -->
          ${this._renderScaler()}

          <!-- Tabs -->
          <div class="tabs-row">
            ${[['ingredients','Ingredients'],['directions','Directions'],['notes','Notes'],['nutrition','Nutrition'],['photos','Photos']].map(([val, lbl]) => html`
              <button
                class="tab-btn ${this._activeTab === val ? 'active' : ''}"
                @click=${() => { this._activeTab = val; }}
              >${lbl}</button>
            `)}
          </div>

          <!-- Wake lock button (shown when setting enabled) -->
          ${this._renderWakeLock()}

          <!-- Tab content -->
          <div class="tab-content">
            ${this._activeTab === 'ingredients' ? this._renderIngredients(r) : ''}
            ${this._activeTab === 'directions'  ? this._renderDirections(r)  : ''}
            ${this._activeTab === 'notes'       ? this._renderNotes(r)       : ''}
            ${this._activeTab === 'nutrition'   ? this._renderNutritionRing(r) : ''}
            ${this._activeTab === 'photos'      ? this._renderPhotos(r)      : ''}
          </div>
        </div>

        <!-- Edit panel (inline overlay) -->
        ${this._editing ? this._renderEditPanel() : ''}
      </div>
    `;
  }

  _getDisplayAmount(ing) {
    if (this._metricMode) {
      const conv = convertToMetric(this._scaleAmount(ing.amount), ing.unit);
      if (conv) return conv;
    }
    return { amount: this._scaleAmount(ing.amount) || '', unit: ing.unit || '' };
  }

  _groupIngredients(ingredients) {
    const groups = [];
    let current = { header: null, items: [] };
    for (const ing of (ingredients || [])) {
      if (ing.is_heading || ing.name?.startsWith('#')) {
        if (current.items.length > 0 || current.header !== null) groups.push(current);
        const label = ing.name?.startsWith('#') ? ing.name.slice(1).trim() : ing.name;
        current = { header: label || '', items: [] };
      } else {
        current.items.push(ing);
      }
    }
    if (current.items.length > 0 || current.header !== null) groups.push(current);
    return groups.length ? groups : [{ header: null, items: ingredients || [] }];
  }

  _renderIngredients(r) {
    const picking = this._showShoppingPicker;
    const checkedSet = this._checkedIngredients;
    const checkedCount = checkedSet?.size ?? 0;
    const hasImperial = (r.ingredients || []).some(ing =>
      ing.unit && IMPERIAL_TO_METRIC[ing.unit.toLowerCase().trim()]
    );

    return html`
      ${this.settings?.showUnitConversion && hasImperial ? html`
        <div class="metric-toggle-row">
          <button class="metric-btn ${this._metricMode ? 'active' : ''}"
            @click=${() => { this._metricMode = !this._metricMode; }}>
            <ha-icon icon="mdi:swap-horizontal"></ha-icon>
            ${this._metricMode ? 'Showing metric' : 'Convert to metric'}
          </button>
        </div>
      ` : ''}

      ${r.ingredients?.length ? html`
        <ul class="ingredient-list">
          ${r.ingredients.map((ing, i) => {
            if (ing.is_heading || ing.name?.startsWith('#')) {
              const headingText = ing.name?.startsWith('#') ? ing.name.slice(1).trim() : ing.name;
              return html`<li class="ing-heading">${headingText}</li>`;
            }
            const { amount, unit } = this._getDisplayAmount(ing);
            return html`
              <li class="ingredient-item ${picking ? 'selectable' : ''}"
                @click=${picking ? () => this._toggleIngredient(i) : undefined}>
                ${picking ? html`
                  <span class="ing-check ${checkedSet?.has(i) ? 'checked' : ''}">
                    ${checkedSet?.has(i) ? html`<ha-icon icon="mdi:check"></ha-icon>` : ''}
                  </span>
                ` : ''}
                <span class="ing-amount">${amount} ${unit}</span>
                <span class="ing-name">${ing.name}${ing.notes ? html` <em class="ing-notes">(${ing.notes})</em>` : ''}</span>
              </li>
            `;
          })}
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
            <div class="picker-select-row">
              <button class="picker-sel-btn" @click=${this._selectAllIngredients}>Select All</button>
              <button class="picker-sel-btn" @click=${this._clearAllIngredients}>Clear All</button>
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
            </div>
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

  _toggleStepComplete(i) {
    const next = new Set(this._completedSteps);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    this._completedSteps = next;
  }

  _renderDirections(r) {
    if (!r.instructions?.length) {
      return html`<p class="empty-tab">No directions listed.</p>`;
    }
    return html`
      <ol class="steps-list">
        ${r.instructions.map((step, i) => {
          const done = this._completedSteps.has(i);
          return html`
            <li class="step-item ${done ? 'step-done' : ''}">
              <span class="step-num ${done ? 'done' : ''}"
                @click=${(e) => { e.stopPropagation(); this._toggleStepComplete(i); }}
                title="${done ? 'Mark incomplete' : 'Mark complete'}"
              >${done ? html`<ha-icon icon="mdi:check"></ha-icon>` : i + 1}</span>
              <span class="step-text">${this._renderStepWithTimers(step)}</span>
            </li>
          `;
        })}
      </ol>
    `;
  }

  _renderStepWithTimers(text) {
    // Split text by time mentions and wrap them in clickable timer chips
    const parts = [];
    let lastIndex = 0;
    let match;
    TIME_RE.lastIndex = 0;
    while ((match = TIME_RE.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const timeText = match[0];
      const seconds = parseTimeToSeconds(timeText);
      if (seconds > 0) {
        parts.push(html`<button class="time-chip" @click=${(e) => { e.stopPropagation(); this._fireTimer(seconds, timeText); }} title="Start timer for ${timeText}">
          <ha-icon icon="mdi:timer-outline"></ha-icon>${timeText}
        </button>`);
      } else {
        parts.push(timeText);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
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

  _renderNutritionRing(r) {
    const n = r?.nutrition || {};
    const cal = parseFloat(n.calories) || 0;
    const fat = parseFloat(n.fat) || 0;
    const carb = parseFloat(n.carbohydrates) || 0;
    const prot = parseFloat(n.protein) || 0;

    const fatCal = fat * 9;
    const carbCal = carb * 4;
    const protCal = prot * 4;
    const total = fatCal + carbCal + protCal;
    const hasData = total > 0 || cal > 0;

    if (!hasData) {
      return html`
        <div class="nutr-card">
          <p class="empty-tab" style="margin:0;padding:8px 0;text-align:center">No nutritional information available.</p>
        </div>`;
    }

    // Donut ring
    const size = 90;
    const cx = size / 2, cy = size / 2;
    const ro = 38, ri = 25;

    const MACROS = [
      { label: 'Carbs',    val: carb, cal: carbCal, color: '#f59e0b' },
      { label: 'Total fat',val: fat,  cal: fatCal,  color: '#3b82f6' },
      { label: 'Protein',  val: prot, cal: protCal, color: '#22c55e' },
    ];

    function toXY(angleDeg, radius) {
      const rad = (angleDeg - 90) * Math.PI / 180;
      return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
    }
    function arcPath(sa, ea) {
      const [sox, soy] = toXY(sa, ro); const [eox, eoy] = toXY(ea, ro);
      const [six, siy] = toXY(sa, ri); const [eix, eiy] = toXY(ea, ri);
      const large = (ea - sa) > 180 ? 1 : 0;
      return `M ${sox} ${soy} A ${ro} ${ro} 0 ${large} 1 ${eox} ${eoy} L ${eix} ${eiy} A ${ri} ${ri} 0 ${large} 0 ${six} ${siy} Z`;
    }

    const arcs = [];
    if (total > 0) {
      let angle = 0;
      for (const m of MACROS) {
        if (m.cal <= 0) continue;
        const sweep = (m.cal / total) * 358;
        arcs.push({ ...m, path: arcPath(angle, angle + sweep) });
        angle += sweep + 2;
      }
    }
    const displayCal = cal > 0 ? cal : (total > 0 ? Math.round(total / 9) : null);

    // RDA progress data
    const rdaRows = Object.entries(RDA).filter(([k]) => {
      const v = parseFloat(n[k]);
      return v > 0;
    }).map(([k, rda]) => {
      const v = parseFloat(n[k]);
      const pct = Math.min(Math.round(v / rda.val * 100), 999);
      return { key: k, label: rda.label, val: v, unit: rda.unit, pct };
    });

    return html`
      <div class="nutr-card">
        <!-- Top row: donut + macro columns -->
        <div class="nutr-top">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0">
            <circle cx="${cx}" cy="${cy}" r="${(ro + ri) / 2}"
              fill="none" stroke="var(--rm-border)" stroke-width="${ro - ri}"/>
            ${arcs.map(a => html`<path d="${a.path}" fill="${a.color}" opacity="0.9"/>`)}
            <text x="${cx}" y="${cy - 2}" text-anchor="middle"
              fill="var(--rm-text)" font-size="15" font-weight="700" font-family="inherit">
              ${displayCal != null ? displayCal : '\u2013'}
            </text>
            <text x="${cx}" y="${cy + 11}" text-anchor="middle"
              fill="var(--rm-text-secondary)" font-size="8" font-family="inherit">kcal</text>
          </svg>

          <div class="nutr-macro-cols">
            ${MACROS.map(m => {
              const pct = total > 0 ? Math.round(m.cal / total * 100) : 0;
              return html`
                <div class="nutr-macro-col">
                  <span class="nutr-mcol-num" style="color:${m.color}">${m.val > 0 ? `${m.val} g` : '\u2014'}</span>
                  <span class="nutr-mcol-label">${m.label}</span>
                  ${pct > 0 ? html`<span class="nutr-mcol-pct" style="color:${m.color}">${pct}% cals</span>` : ''}
                </div>
              `;
            })}
          </div>
        </div>

        ${r?.servings ? html`
          <div class="nutr-serving-note">
            Per ${r.servings_text || `${r.servings} serving${r.servings !== 1 ? 's' : ''}`}
          </div>
        ` : ''}

        <!-- Daily RDA collapsible -->
        ${rdaRows.length ? html`
          <button class="nutr-rda-toggle" @click=${() => { this._nutritionExpanded = !this._nutritionExpanded; }}>
            <span class="nutr-rda-title">Daily RDA Nutrition</span>
            <span class="nutr-rda-count">${rdaRows.length}</span>
            <ha-icon icon="${this._nutritionExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}"></ha-icon>
          </button>
          ${this._nutritionExpanded ? html`
            <div class="nutr-rda-rows">
              ${rdaRows.map(row => html`
                <div class="nutr-rda-row">
                  <span class="nutr-rda-label">${row.label}</span>
                  <span class="nutr-rda-val">${row.val} ${row.unit}</span>
                  <span class="nutr-rda-pct">${row.pct}%</span>
                  <div class="nutr-rda-bar-wrap">
                    <div class="nutr-rda-bar ${row.pct > 100 ? 'over' : ''}" style="width:${Math.min(row.pct, 100)}%"></div>
                  </div>
                </div>
              `)}
            </div>
          ` : ''}
        ` : ''}
      </div>
    `;
  }

  _renderPhotos(r) {
    const photos = r.photos || [];
    const mainImage = r.image_url;
    // Combine main image with extra photos (deduplicated)
    const allPhotos = mainImage
      ? [mainImage, ...photos.filter(p => p !== mainImage)]
      : photos;

    return html`
      <div class="photos-tab">
        ${allPhotos.length ? html`
          <div class="photos-grid">
            ${allPhotos.map(url => html`
              <div class="photo-item ${url === mainImage ? 'main-photo' : ''}">
                <img src="${url}" alt="Recipe photo" loading="lazy" />
                ${url === mainImage ? html`<span class="photo-badge">Main</span>` : html`
                  <button class="photo-action set-main" @click=${() => this._setMainPhoto(url)} title="Set as main photo">
                    <ha-icon icon="mdi:star-outline"></ha-icon>
                  </button>
                `}
                <button class="photo-action remove-photo" @click=${() => this._removePhoto(url)} title="Remove photo">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-tab">
            <ha-icon icon="mdi:image-off-outline"></ha-icon>
            <p>No photos yet.</p>
          </div>
        `}

        <div class="photo-add-section">
          <div class="photo-add-label">Add a photo</div>
          <div class="photo-url-row">
            <input
              type="url"
              class="photo-url-input"
              placeholder="Paste image URL…"
              .value=${this._photoUrlInput}
              @input=${e => { this._photoUrlInput = e.target.value; }}
              @keydown=${e => { if (e.key === 'Enter') this._handleAddPhotoUrl(); }}
            />
            <button class="action-btn primary" ?disabled=${!this._photoUrlInput.trim() || this._addingPhotoUrl}
              @click=${this._handleAddPhotoUrl}>
              Add
            </button>
          </div>
          <div class="camera-btns">
            <label class="camera-btn-split">
              <ha-icon icon="mdi:camera"></ha-icon>
              <span>Take Photo</span>
              <input type="file" accept="image/*" capture="environment" class="camera-input"
                @change=${this._handleCameraCapture} />
            </label>
            <label class="camera-btn-split">
              <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
              <span>Choose from Library</span>
              <input type="file" accept="image/*" class="camera-input"
                @change=${this._handleCameraCapture} />
            </label>
          </div>
        </div>
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

            <!-- Ingredients editor -->
            <div class="edit-section-label">Ingredients (${(d.ingredients || []).length})</div>
            ${(d.ingredients || []).length ? html`
              <ul class="edit-ing-list">
                ${(d.ingredients || []).map((ing, i) => html`
                  <li class="${ing.is_heading || ing.name?.startsWith('#') ? 'edit-ing-heading' : ''}">
                    <div class="edit-reorder-btns">
                      <button class="edit-move-btn" ?disabled=${i === 0} @click=${() => this._editMoveIngredient(i, -1)} title="Move up">
                        <ha-icon icon="mdi:chevron-up"></ha-icon>
                      </button>
                      <button class="edit-move-btn" ?disabled=${i === (d.ingredients.length - 1)} @click=${() => this._editMoveIngredient(i, 1)} title="Move down">
                        <ha-icon icon="mdi:chevron-down"></ha-icon>
                      </button>
                    </div>
                    <span class="edit-ing-text">
                      ${ing.is_heading || ing.name?.startsWith('#')
                        ? html`<strong>${ing.name?.startsWith('#') ? ing.name.slice(1).trim() : ing.name}</strong>`
                        : html`${ing.amount ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''} ` : ''}${ing.name}`}
                    </span>
                    <button class="edit-remove-btn" @click=${() => this._editRemoveIngredient(i)}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </li>
                `)}
              </ul>
            ` : ''}
            <div class="edit-add-row">
              <input
                type="text"
                .value=${this._editIngInput}
                @input=${e => { this._editIngInput = e.target.value; }}
                @keydown=${e => { if (e.key === 'Enter') this._editAddIngredient(); }}
                placeholder='e.g. "2 cups flour" or "# Section Header"'
              />
              <button class="edit-add-btn" @click=${this._editAddIngredient}>Add</button>
            </div>

            <!-- Instructions editor -->
            <div class="edit-section-label">Directions (${(d.instructions || []).length} steps)</div>
            ${(d.instructions || []).length ? html`
              <ol class="edit-steps-list">
                ${(d.instructions || []).map((step, i) => html`
                  <li>
                    <div class="edit-reorder-btns">
                      <button class="edit-move-btn" ?disabled=${i === 0} @click=${() => this._editMoveStep(i, -1)} title="Move up">
                        <ha-icon icon="mdi:chevron-up"></ha-icon>
                      </button>
                      <button class="edit-move-btn" ?disabled=${i === (d.instructions.length - 1)} @click=${() => this._editMoveStep(i, 1)} title="Move down">
                        <ha-icon icon="mdi:chevron-down"></ha-icon>
                      </button>
                    </div>
                    <span class="edit-ing-text">${step}</span>
                    <button class="edit-remove-btn" @click=${() => this._editRemoveStep(i)}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </li>
                `)}
              </ol>
            ` : ''}
            <div class="edit-add-row">
              <textarea
                rows="2"
                .value=${this._editStepInput}
                @input=${e => { this._editStepInput = e.target.value; }}
                @keydown=${e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._editAddStep(this._editStepInput);
                    this._editStepInput = '';
                  }
                }}
                placeholder="Type a step, press Enter to add…"
              ></textarea>
              <button class="edit-add-btn" @click=${() => {
                this._editAddStep(this._editStepInput);
                this._editStepInput = '';
              }}>Add</button>
            </div>

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
            <button class="action-btn danger-outline" @click=${this._handleDeleteRecipe}
              title="${this._confirmDelete ? 'Click again to confirm delete' : 'Delete recipe'}">
              <ha-icon icon="${this._confirmDelete ? 'mdi:alert' : 'mdi:trash-can-outline'}"></ha-icon>
              ${this._confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
            <div class="edit-footer-right">
              <button class="action-btn" @click=${this._cancelEdit}>Cancel</button>
              <button class="action-btn primary" @click=${this._saveEdit}>Save</button>
            </div>
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

    /* Wide two-column layout */
    .detail-container.wide { flex-direction: row; }
    .detail-left {
      width: 320px; flex-shrink: 0; display: flex; flex-direction: column;
      border-right: 1px solid var(--rm-border); overflow: hidden;
    }
    .detail-left .hero-img {
      height: 240px; flex-shrink: 0; position: relative; overflow: hidden;
      background: var(--rm-bg-elevated);
    }
    .detail-left .hero-img img { width: 100%; height: 100%; object-fit: cover; }
    .detail-left .hero-img .hero-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center;
      justify-content: center; color: var(--rm-text-secondary);
    }
    .detail-left .hero-img .hero-placeholder ha-icon { --mdc-icon-size: 64px; opacity: 0.3; }
    .detail-left-scroll {
      flex: 1; overflow-y: auto; padding: 12px 14px 16px;
      scrollbar-width: thin; scrollbar-color: var(--rm-border) transparent;
    }
    .detail-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .detail-right-header { padding: 16px 16px 0; flex-shrink: 0; }
    .detail-right-scroll {
      flex: 1; overflow-y: auto; padding: 6px 16px 24px;
      scrollbar-width: thin; scrollbar-color: var(--rm-border) transparent;
    }
    .notes-section { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--rm-border); }
    .notes-section h3 { margin: 0 0 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--rm-text-secondary); }

    /* Recipe title */
    .recipe-title {
      margin: 0 0 6px; font-size: 20px; font-weight: 700;
      color: var(--rm-text); line-height: 1.2;
    }
    .recipe-title.wide-centered { text-align: center; font-size: 22px; }
    .detail-desc.wide-centered { text-align: center; }
    .detail-right-header .quick-rating { justify-content: center; }
    .detail-right-header .action-btns-row { justify-content: center; }

    /* Quick rating */
    .quick-rating { display: flex; gap: 2px; margin: 0 0 8px; }
    .qr-star { font-size: 20px; cursor: pointer; color: var(--rm-border); -webkit-text-stroke: 1px rgba(200,150,0,0.4); transition: color 0.15s; }
    .qr-star.filled { color: #f5a623; -webkit-text-stroke: 1px #c47f0a; }
    .qr-star:hover { color: #f5a623; }

    /* Action buttons row */
    .action-btns-row {
      display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 12px;
    }
    .action-icon-btn {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 12px; padding: 12px 8px; cursor: pointer;
      color: var(--rm-text-secondary); font-size: 11px; font-weight: 500;
      transition: all 0.15s; text-decoration: none; min-width: 60px;
    }
    .action-icon-btn ha-icon { --mdc-icon-size: 24px; }
    .action-icon-btn:hover { background: var(--rm-accent-soft); color: var(--rm-accent); border-color: var(--rm-accent); }
    .action-icon-btn.fav-active { color: var(--error-color, #cf6679); }
    .action-icon-btn.danger { background: var(--error-color, #cf6679); color: #fff; border-color: var(--error-color, #cf6679); }

    /* Meta chips (wide layout) */
    .meta-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; justify-content: center; }
    .meta-chip-icon {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 20px; padding: 5px 12px; font-size: 12px;
      color: var(--rm-text-secondary); font-weight: 600;
    }
    .meta-chip-icon ha-icon { --mdc-icon-size: 14px; }

    /* Chip groups: column of rows, each row = label chip + value chips */
    .chips-area { display: flex; flex-direction: column; gap: 5px; }
    .chip-group-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
    .chip-label {
      background: var(--rm-bg); border: 1px solid var(--rm-border);
      color: var(--rm-text-secondary); font-weight: 600; cursor: default;
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
    .detail-desc {
      margin: 0 0 8px;
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
      background: var(--rm-bg-elevated, #2c2c2e);
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
      padding: 3px 10px;
      font-size: 12px;
      border: none;
      cursor: default;
    }
    .chip-nav {
      cursor: pointer;
      transition: filter 0.15s, opacity 0.15s;
    }
    .chip-nav:hover { filter: brightness(1.25); opacity: 0.9; }
    .chip-course    { background: rgba(88,166,255,0.15); color: #58a6ff; }
    .chip-category  { background: rgba(63,185,80,0.15);  color: #3fb950; }
    .chip-collection{ background: rgba(210,153,34,0.15); color: #d2a01e; }
    .chip-tag { background: var(--rm-accent-soft); color: var(--rm-accent); }

    /* Scaler */
    .scaler-row { display: flex; align-items: center; gap: 8px; }
    .scaler-icon { --mdc-icon-size: 18px; color: var(--rm-text-secondary); flex-shrink: 0; }
    .scaler-ctrl { display: flex; align-items: center; gap: 6px; }
    .scaler-btn {
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 50%;
      width: 34px; height: 34px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--rm-text-secondary); padding: 0; transition: all 0.15s;
    }
    .scaler-btn:hover { background: var(--rm-accent-soft); color: var(--rm-accent); border-color: var(--rm-accent); }
    .scaler-btn ha-icon { --mdc-icon-size: 18px; }
    .scaler-val {
      font-size: 13px; font-weight: 600; color: var(--rm-text);
      min-width: 34px; height: 34px; text-align: center;
      display: flex; align-items: center; justify-content: center;
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 8px;
    }

    /* Tabs */
    .tabs-row {
      display: flex;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      margin-bottom: 14px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tabs-row::-webkit-scrollbar { display: none; }
    .tab-btn {
      flex-shrink: 0;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 11px 14px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: var(--rm-text-secondary, #8e8e93);
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .tab-btn.active {
      color: var(--rm-accent, #ff6b35);
      border-bottom-color: var(--rm-accent, #ff6b35);
    }

    /* Wake lock button */
    .wakelock-row {
      display: flex;
      justify-content: flex-end;
      padding: 4px 0 10px;
    }
    .wakelock-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: 1px solid var(--rm-border);
      border-radius: 20px; padding: 4px 12px;
      font-size: 12px; cursor: pointer;
      color: var(--rm-text-secondary);
      transition: all 0.15s;
    }
    .wakelock-btn ha-icon { --mdc-icon-size: 14px; }
    .wakelock-btn.active {
      background: var(--rm-accent-soft); color: var(--rm-accent);
      border-color: var(--rm-accent);
    }

    /* Metric toggle */
    .metric-toggle-row {
      display: flex;
      justify-content: flex-end;
      padding: 0 0 8px;
    }
    .metric-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: 1px solid var(--rm-border);
      border-radius: 20px; padding: 4px 12px;
      font-size: 12px; cursor: pointer;
      color: var(--rm-text-secondary);
      transition: all 0.15s;
    }
    .metric-btn ha-icon { --mdc-icon-size: 14px; }
    .metric-btn.active {
      background: var(--rm-accent-soft); color: var(--rm-accent);
      border-color: var(--rm-accent);
    }

    /* Ingredient section heading */
    .ing-heading {
      list-style: none;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--rm-accent); padding: 10px 0 4px;
      margin-top: 6px;
    }

    /* Ingredients */
    .ingredient-list { list-style: none; padding: 0; margin: 0 0 16px; }
    .ingredient-item {
      display: flex;
      gap: 10px;
      align-items: baseline;
      padding: 10px 0;
      border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
    }
    .ingredient-item:last-child { border-bottom: none; }
    .ing-amount {
      font-size: 14px;
      font-weight: 700;
      color: var(--rm-accent, #ff6b35);
      min-width: 70px;
      flex-shrink: 0;
    }
    .ing-name { font-size: 15px; color: var(--rm-text, #e5e5ea); }
    .ing-notes { font-size: 13px; color: var(--rm-text-secondary, #8e8e93); font-style: italic; }

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
    .picker-select-row {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .picker-sel-btn {
      background: none;
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 6px;
      color: var(--rm-text-secondary, #8e8e93);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 12px;
    }
    .picker-sel-btn:hover { background: var(--rm-accent-soft); color: var(--rm-text); }
    .picker-btns { display: flex; gap: 8px; justify-content: flex-end; }
    .shopping-note { font-size: 12px; color: var(--rm-text-secondary, #8e8e93); }
    .list-select {
      flex: 1;
      background: var(--rm-bg-elevated, #2c2c2e);
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
      gap: 14px;
      margin-bottom: 20px;
      align-items: flex-start;
    }
    .step-num {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      background: var(--rm-accent, #ff6b35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      user-select: none;
    }
    .step-num:hover { opacity: 0.8; }
    .step-num.done {
      background: transparent;
      border: 2px solid var(--rm-border, rgba(255,255,255,0.2));
      color: var(--rm-text-muted);
    }
    .step-num.done ha-icon { --mdc-icon-size: 16px; }
    .step-item.step-done .step-text {
      opacity: 0.45;
      text-decoration: line-through;
      text-decoration-color: var(--rm-border);
    }
    .step-text { font-size: 15px; color: var(--rm-text, #e5e5ea); line-height: 1.7; transition: opacity 0.2s; }

    /* Timer chip in directions */
    .time-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: var(--rm-accent-soft, rgba(255,107,53,0.15));
      color: var(--rm-accent, #ff6b35);
      border: 1px solid var(--rm-accent, #ff6b35);
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      vertical-align: middle;
    }
    .time-chip ha-icon { --mdc-icon-size: 12px; }
    .time-chip:hover { background: var(--rm-accent, #ff6b35); color: #fff; }

    /* Notes */
    .notes-text { font-size: 14px; color: var(--rm-text, #e5e5ea); line-height: 1.6; white-space: pre-wrap; }
    .empty-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--rm-text-secondary, #8e8e93);
      text-align: center;
      padding: 20px 0;
      margin: 0;
    }
    .empty-tab ha-icon { --mdc-icon-size: 40px; opacity: 0.35; }
    .empty-tab p { margin: 0; }

    /* Nutrition (legacy table) */
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

    /* Nutrition card */
    .nutr-card { display: flex; flex-direction: column; gap: 10px; }
    .nutr-top { display: flex; align-items: center; gap: 14px; }
    .nutr-macro-cols { display: flex; gap: 10px; flex: 1; justify-content: space-around; }
    .nutr-macro-col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .nutr-mcol-num { font-size: 17px; font-weight: 700; line-height: 1; }
    .nutr-mcol-label { font-size: 11px; color: var(--rm-text-secondary); font-weight: 500; }
    .nutr-mcol-pct { font-size: 10px; font-weight: 600; }
    .nutr-serving-note {
      font-size: 11px; color: var(--rm-text-muted); text-align: center; margin-top: -4px;
    }
    /* Daily RDA expandable */
    .nutr-rda-toggle {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; border-top: 1px solid var(--rm-border);
      padding: 10px 0 0; cursor: pointer; color: var(--rm-text); font-size: 13px; font-weight: 600;
      width: 100%; text-align: left;
    }
    .nutr-rda-title { flex: 1; }
    .nutr-rda-count {
      font-size: 12px; font-weight: 700; color: var(--rm-text-secondary);
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 10px; padding: 1px 7px;
    }
    .nutr-rda-toggle ha-icon { --mdc-icon-size: 18px; color: var(--rm-text-secondary); }
    .nutr-rda-rows { display: flex; flex-direction: column; gap: 6px; padding-top: 6px; }
    .nutr-rda-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      grid-template-rows: auto 4px;
      column-gap: 8px;
      row-gap: 4px;
      font-size: 12px;
    }
    .nutr-rda-label { color: var(--rm-text-secondary); grid-column: 1; grid-row: 1; }
    .nutr-rda-val { color: var(--rm-text); font-weight: 600; grid-column: 2; grid-row: 1; white-space: nowrap; }
    .nutr-rda-pct { color: var(--rm-text-muted); grid-column: 3; grid-row: 1; white-space: nowrap; min-width: 36px; text-align: right; }
    .nutr-rda-bar-wrap { grid-column: 1 / -1; grid-row: 2; background: var(--rm-border); border-radius: 2px; height: 4px; overflow: hidden; }
    .nutr-rda-bar { height: 100%; background: var(--rm-accent); border-radius: 2px; transition: width 0.3s; }
    .nutr-rda-bar.over { background: var(--error-color, #cf6679); }

    /* Photos tab */
    .photos-tab { display: flex; flex-direction: column; gap: 16px; }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
    }
    .photo-item {
      position: relative;
      aspect-ratio: 4/3;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
    }
    .photo-item.main-photo { border-color: var(--rm-accent, #ff6b35); }
    .photo-item img { width: 100%; height: 100%; object-fit: cover; }
    .photo-badge {
      position: absolute;
      bottom: 4px;
      left: 4px;
      background: var(--rm-accent, #ff6b35);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .photo-action {
      position: absolute;
      background: rgba(0,0,0,0.6);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding: 0;
      transition: background 0.15s;
    }
    .photo-action ha-icon { --mdc-icon-size: 14px; }
    .photo-action:hover { background: rgba(0,0,0,0.85); }
    .remove-photo { top: 4px; right: 4px; }
    .set-main { bottom: 4px; left: 4px; }

    .photo-add-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
    }
    .photo-add-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--rm-text-secondary, #8e8e93);
    }
    .photo-url-row { display: flex; gap: 8px; }
    .photo-url-input {
      flex: 1;
      background: var(--rm-bg-elevated, #2c2c2e);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px;
      color: var(--rm-text, #e5e5ea);
      padding: 8px 10px;
      font-size: 13px;
    }
    .photo-url-input:focus { outline: none; border-color: var(--rm-accent, #ff6b35); }
    .camera-btns {
      display: flex;
      gap: 10px;
    }
    .camera-btn-split {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--rm-bg-elevated, #2c2c2e);
      border: 2px solid var(--rm-accent, #ff6b35);
      border-radius: 10px;
      color: var(--rm-text, #e5e5ea);
      padding: 16px 8px;
      cursor: pointer;
      font-size: 12px;
      text-align: center;
      transition: background 0.15s, border-color 0.15s;
    }
    .camera-btn-split:hover { background: var(--rm-accent-soft, rgba(255,107,53,0.12)); }
    .camera-btn-split ha-icon { --mdc-icon-size: 28px; color: var(--rm-accent, #ff6b35); }
    .camera-input { display: none; }

    /* Buttons */
    .action-btn {
      background: var(--rm-bg-elevated, #2c2c2e);
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
      background: var(--rm-bg-surface, #1c1c1e);
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
      background: var(--rm-bg-elevated, #2c2c2e);
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
      font-size: 32px;
      color: var(--rm-border, rgba(255,255,255,0.3));
      cursor: pointer;
      transition: color 0.12s;
      line-height: 1;
      -webkit-text-stroke: 1px rgba(200,150,50,0.5);
    }
    .edit-star.filled { color: #f5a623; -webkit-text-stroke: 1px #d4881b; }
    .edit-star:hover { color: #f5a623; }
    .edit-footer {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--rm-border, rgba(255,255,255,0.08));
      flex-shrink: 0;
    }
    .edit-footer-right { display: flex; gap: 8px; }

    /* Edit ingredient/step lists */
    .edit-ing-list, .edit-steps-list {
      list-style: none; padding: 0; margin: 0 0 6px;
    }
    .edit-ing-list li, .edit-steps-list li {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 5px 0; border-bottom: 1px solid var(--rm-border, rgba(255,255,255,0.06));
      font-size: 13px; color: var(--rm-text, #e5e5ea);
    }
    .edit-ing-heading { font-weight: 700; color: var(--rm-accent) !important; }
    .edit-ing-text { flex: 1; line-height: 1.4; }
    .edit-reorder-btns { display: flex; flex-direction: column; flex-shrink: 0; gap: 0; }
    .edit-move-btn {
      background: none; border: none; cursor: pointer; padding: 0; line-height: 1;
      color: var(--rm-text-secondary, #8e8e93); --mdc-icon-size: 14px;
    }
    .edit-move-btn:disabled { opacity: 0.2; cursor: default; }
    .edit-remove-btn {
      background: none; border: none; cursor: pointer; flex-shrink: 0;
      color: var(--rm-text-secondary, #8e8e93); padding: 2px; margin-top: 1px;
    }
    .edit-remove-btn ha-icon { --mdc-icon-size: 14px; }
    .edit-add-row {
      display: flex; gap: 8px; align-items: flex-end; margin-bottom: 4px;
    }
    .edit-add-row input, .edit-add-row textarea {
      flex: 1; background: var(--rm-bg-elevated, #232833);
      border: 1px solid var(--rm-border, rgba(255,255,255,0.12));
      border-radius: 8px; color: var(--rm-text, #e5e5ea);
      padding: 7px 10px; font-size: 13px; font-family: inherit; resize: none;
    }
    .edit-add-row input:focus, .edit-add-row textarea:focus {
      outline: none; border-color: var(--rm-accent, #9fa8da);
    }
    .edit-add-btn {
      background: var(--rm-accent, #9fa8da); border: none; border-radius: 8px;
      color: #fff; padding: 7px 12px; cursor: pointer; font-size: 13px;
      white-space: nowrap; flex-shrink: 0;
    }

    /* Danger outline button */
    .action-btn.danger-outline {
      color: var(--error-color, #cf6679);
      border-color: var(--error-color, #cf6679);
    }
    .action-btn.danger-outline:hover {
      background: var(--error-color, #cf6679); color: #fff;
    }

    /* ── Wide grid layout (2 cols × auto rows) ─────────────── */
    /* Whole card scrolls — no independent column scrolling */
    .detail-container.wide {
      overflow-x: hidden;
      overflow-y: auto;
    }

    .wide-layout {
      --ion-grid-columns: 12;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 14px;
      width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    /* Each row is a flex container — no gap (columns are exact % fractions summing to 100%).
       align-items:stretch makes both columns the same height.
       Column spacing uses margin-left + reduced width on col-2 items. */
    .wide-row {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      width: 100%;
      box-sizing: border-box;
    }

    /* Col 1 — image card: exact Ionic 4/12 column; aspect-ratio:1/1 makes height = width */
    .wide-image-card {
      flex: 0 0 calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      width: calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      max-width: calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      min-width: 0;
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      overflow: hidden;
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
    }
    .wide-image-square {
      width: 100%;
      height: 100%;
    }
    .wide-image-square img {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .wide-image-square .hero-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: var(--rm-text-secondary);
    }
    .wide-image-square .hero-placeholder ha-icon { --mdc-icon-size: 64px; opacity: 0.3; }

    /* Col 2 — info card: 8/12 minus the 14px gap, with margin-left for the gap */
    .wide-info-card {
      flex: 0 0 calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      width: calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      max-width: calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      min-width: 0;
      box-sizing: border-box;
      margin-left: 14px;
      border-radius: 16px;
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .wide-title {
      margin: 0 0 4px; font-size: 22px; font-weight: 700;
      color: var(--rm-text); line-height: 1.2; text-align: center;
    }
    .wide-desc {
      text-align: center; margin: 6px 0;
      font-size: 13px; color: var(--rm-text-secondary); line-height: 1.5;
    }
    .wide-info-card .quick-rating { justify-content: center; margin-bottom: 6px; }
    .wide-info-card .action-btns-row { justify-content: center; flex-wrap: wrap; width: 100%; }
    .wide-info-card .meta-chips { justify-content: center; margin-top: 6px; }
    /* Chips pushed to bottom-left of info card */
    .wide-info-card .chips-area { align-self: flex-start; margin-top: auto; padding-top: 10px; }

    /* Row 2, Col 1 — ingredients column: exact Ionic 4/12, aligns with image above */
    .wide-ing-col {
      flex: 0 0 calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      width: calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      max-width: calc(calc(4 / var(--ion-grid-columns, 12)) * 100%);
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Row 2, Col 2 — directions column: 8/12 minus gap, margin-left for spacing */
    .wide-dir-col {
      flex: 0 0 calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      width: calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      max-width: calc(calc(8 / var(--ion-grid-columns, 12)) * 100% - 14px);
      min-width: 0;
      margin-left: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Ingredients column controls: scaler left, cart right — above ingredients only */
    .wide-ing-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 2px;
      min-height: 42px;
    }
    .wide-dir-spacer { min-height: 42px; }
    .ing-shop-btn {
      background: var(--rm-bg-elevated); border: 1px solid var(--rm-border);
      border-radius: 50%; width: 34px; height: 34px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--rm-text-secondary); padding: 0; transition: all 0.15s;
    }
    .ing-shop-btn ha-icon { --mdc-icon-size: 18px; }
    .ing-shop-btn:hover { background: var(--rm-accent-soft); color: var(--rm-accent); border-color: var(--rm-accent); }
    .ing-shop-btn.active { background: var(--rm-accent-soft); color: var(--rm-accent); border-color: var(--rm-accent); }
    .ing-shop-success { color: var(--success-color, #4caf50); display: flex; align-items: center; }
    .ing-shop-success ha-icon { --mdc-icon-size: 22px; }

    /* Section cards (ingredients, nutrition, notes) */
    .wide-section-card {
      background: var(--rm-bg-elevated);
      border: 1px solid var(--rm-border);
      border-radius: 14px;
      padding: 12px 14px;
    }
    .wide-section-title {
      font-size: 14px; font-weight: 700; color: var(--rm-text);
      margin-bottom: 10px; padding-bottom: 6px;
      border-bottom: 1px solid var(--rm-border);
    }

    /* Per-step direction cards in wide layout */
    .wide-step-card {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .wide-step-card .step-num { flex-shrink: 0; }
    .wide-step-card .step-text { flex: 1; }
    .wide-step-card.step-done .step-text {
      opacity: 0.45;
      text-decoration: line-through;
      text-decoration-color: var(--rm-border);
    }
  `;
}

try { customElements.define('rm-recipe-detail', RmRecipeDetail); } catch {}
