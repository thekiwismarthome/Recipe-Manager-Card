/**
 * Recipe Manager WebSocket API service.
 * Mirrors the pattern from Shopping List Manager's api.js.
 */

// ---------------------------------------------------------------------------
// SLM ingredient helpers
// ---------------------------------------------------------------------------

const _SLM_UNIT_RE = /^[½¼¾⅓⅔⅛⅜⅝⅞\d][\d.,/½¼¾⅓⅔⅛⅜⅝⅞\s]*\s*(?:tsp|tbsp|tablespoons?|teaspoons?|cups?|oz|lbs?|g|kg|ml|cl|dl|L|(?:milli|centi|deci)?lit(?:re|er)s?|kilo(?:gramme|gram)s?|(?:gramme|gram)s?|pints?|quarts?|gallons?|fl\.?\s*oz|cans?|bunches?|heads?|cloves?|slices?|pieces?|sheets?|pinch(?:es)?|dash(?:es)?|handfuls?|sprigs?|stalks?)\s*/i;

/**
 * Return a clean ingredient name suitable for an SLM item title.
 * When the Python parser failed to split a Unicode fraction (e.g. "½ tsp baking powder"
 * ended up as the full name), this strips the leading measurement so SLM gets
 * "Baking Powder" rather than "½ tsp baking powder".
 */
function _slmCleanName(ing) {
  // If the parser captured amount/unit separately, ing.name is already clean.
  if (ing.amount || ing.unit) return ing.name;
  // Otherwise try to strip an embedded measurement prefix.
  const cleaned = ing.name.replace(_SLM_UNIT_RE, '').trim();
  return cleaned || ing.name;
}

/**
 * Build the full ingredient string for the recipe note (amount + unit + name).
 * e.g. "1/2 tsp baking powder"
 */
function _slmIngString(ing, cleanName) {
  if (!ing.amount && !ing.unit) {
    // Name may already contain the measurement (malformed parse) — use as-is.
    return ing.name;
  }
  return [ing.amount, ing.unit, cleanName].filter(Boolean).join(' ');
}

/**
 * Build the "[RM] RecipeName — ½ tsp baking powder" note string.
 */
function _slmBuildNote(recipeName, ing, cleanName) {
  return `[RM] ${recipeName} \u2014 ${_slmIngString(ing, cleanName)}`;
}

/**
 * Parse an ingredient amount string to a numeric quantity for SLM.
 * Handles ASCII fractions ("1/2"), Unicode fractions ("½"), mixed numbers ("1 1/2").
 */
function _slmParseQty(amount) {
  if (!amount) return 1;
  const fracMap = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3,
                    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
  let s = String(amount).trim();
  for (const [c, v] of Object.entries(fracMap)) s = s.replace(c, String(v));
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 1;
}

export class RecipeManagerAPI {
  constructor(hass) {
    this.hass = hass;
  }

  // -- Subscription ---------------------------------------------------------

  subscribe(callback) {
    return this.hass.connection.subscribeMessage(callback, {
      type: 'recipe_manager/subscribe',
    });
  }

  // -- Recipes --------------------------------------------------------------

  async getAllRecipes() {
    return this.hass.callWS({ type: 'recipe_manager/recipes/get_all' });
  }

  async getRecipe(recipeId) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/get', recipe_id: recipeId });
  }

  async scrapeRecipe(url) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/scrape', url });
  }

  async addRecipe(data) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/add', ...data });
  }

  async updateRecipe(recipeId, data) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/update', recipe_id: recipeId, ...data });
  }

  async deleteRecipe(recipeId) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/delete', recipe_id: recipeId });
  }

  async toggleFavourite(recipeId) {
    return this.hass.callWS({ type: 'recipe_manager/recipes/toggle_favourite', recipe_id: recipeId });
  }

  async downloadRecipeImage(recipeId, imageUrl) {
    return this.hass.callWS({
      type: 'recipe_manager/recipes/download_image',
      recipe_id: recipeId,
      image_url: imageUrl,
    });
  }

  // -- Tags -----------------------------------------------------------------

  async getTags() {
    return this.hass.callWS({ type: 'recipe_manager/tags/get_all' });
  }

  // -- Meal Plan ------------------------------------------------------------

  async getMealPlan(weekStart) {
    const msg = { type: 'recipe_manager/meal_plan/get' };
    if (weekStart) msg.week_start = weekStart;
    return this.hass.callWS(msg);
  }

  async addToMealPlan(recipeId, date, mealType, servings = 1, notes = null) {
    const msg = {
      type: 'recipe_manager/meal_plan/add',
      recipe_id: recipeId,
      date,
      meal_type: mealType,
      servings,
    };
    if (notes) msg.notes = notes;
    return this.hass.callWS(msg);
  }

  async removeFromMealPlan(entryId) {
    return this.hass.callWS({ type: 'recipe_manager/meal_plan/remove', entry_id: entryId });
  }

  async clearMealPlanWeek(weekStart) {
    return this.hass.callWS({ type: 'recipe_manager/meal_plan/clear', week_start: weekStart });
  }

  // -- Shopping Manager cross-integration -----------------------------------

  /**
   * Push a list of ingredients to the Shopping Manager's active list.
   * - Cleans malformed ingredient names (e.g. "½ tsp baking powder" → name:"baking powder")
   * - Adds a recipe-sourced note: "[RM] RecipeName — ½ tsp baking powder"
   * - If an unchecked item with the same name already exists, appends the note
   *   rather than creating a duplicate.
   *
   * ingredients: [{name, amount, unit}]
   * listId: Shopping Manager list ID
   * recipeName: name of the source recipe (for the note)
   */
  async addIngredientsToShoppingList(listId, ingredients, recipeName = null) {
    // Fetch existing unchecked items to detect duplicates
    let existingItems = [];
    try {
      const r = await this.getSlmItems(listId);
      existingItems = (r?.items ?? []).filter(i => !i.checked);
    } catch { /* proceed without dedup if SLM items unavailable */ }

    const results = [];
    for (const ing of ingredients) {
      try {
        const cleanName = _slmCleanName(ing);
        const note = recipeName ? _slmBuildNote(recipeName, ing, cleanName) : null;

        // Try to match an existing unchecked item by name (case-insensitive)
        const match = existingItems.find(
          item => item.name.toLowerCase().trim() === cleanName.toLowerCase().trim()
        );

        if (match && note) {
          // Append recipe note to existing item instead of duplicating
          const combined = match.note ? `${match.note}\n${note}` : note;
          await this.hass.callWS({
            type: 'shopping_list_manager/items/update',
            item_id: match.id,
            note: combined,
          });
          results.push({ success: true, name: cleanName, merged: true });
        } else {
          // Create new item
          const payload = {
            type: 'shopping_list_manager/items/add',
            list_id: listId,
            name: cleanName,
            quantity: _slmParseQty(ing.amount),
            unit: ing.unit || 'units',
            category_id: 'other',
          };
          if (note) payload.note = note;
          await this.hass.callWS(payload);
          results.push({ success: true, name: cleanName });
        }
      } catch (err) {
        results.push({ success: false, name: ing.name, error: err.message });
      }
    }
    return results;
  }

  async updateSlmItem(itemId, data) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/update', item_id: itemId, ...data });
  }

  async getShoppingLists() {
    return this.hass.callWS({ type: 'shopping_list_manager/lists/get_all' });
  }

  async getSlmItems(listId) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/get', list_id: listId });
  }

  async checkSlmItem(itemId, checked) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/check', item_id: itemId, checked });
  }

  async clearSlmChecked(listId) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/clear_checked', list_id: listId });
  }

  async deleteSlmItem(itemId) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/delete', item_id: itemId });
  }

  async addSlmItem(listId, data) {
    return this.hass.callWS({ type: 'shopping_list_manager/items/add', list_id: listId, ...data });
  }

  async getSlmCategories() {
    return this.hass.callWS({ type: 'shopping_list_manager/categories/get_all' });
  }

  async getSlmProductsByIds(ids) {
    return this.hass.callWS({ type: 'shopping_list_manager/products/get_by_ids', product_ids: ids });
  }

  async getSlmProductSuggestions(limit = 20) {
    return this.hass.callWS({ type: 'shopping_list_manager/products/suggestions', limit });
  }

  // -- Import ---------------------------------------------------------------

  /**
   * Import recipes from Recipe Keeper HTML content.
   * The caller extracts the HTML from the ZIP in the browser (via JSZip) and
   * sends only the text here to stay under the WebSocket message size limit.
   * Returns { imported, failed, recipe_images: [{recipe_id, image_filename}] }
   */
  async importRecipeKeeper(htmlContent) {
    return this.hass.callWS({
      type: 'recipe_manager/import/recipe_keeper',
      html_content: htmlContent,
    });
  }

  /**
   * Upload a single recipe image (base64-encoded) and save it locally.
   * Returns { image_url }
   */
  async uploadRecipeImage(recipeId, imageData) {
    return this.hass.callWS({
      type: 'recipe_manager/recipes/upload_image',
      recipe_id: recipeId,
      image_data: imageData,
    });
  }
}
