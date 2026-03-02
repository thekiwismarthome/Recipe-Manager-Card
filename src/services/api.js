/**
 * Recipe Manager WebSocket API service.
 * Mirrors the pattern from Shopping List Manager's api.js.
 */
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
   * ingredients: [{name, amount, unit}]
   * listId: Shopping Manager list ID
   */
  async addIngredientsToShoppingList(listId, ingredients) {
    const results = [];
    for (const ing of ingredients) {
      try {
        const result = await this.hass.callWS({
          type: 'shopping_list_manager/items/add',
          list_id: listId,
          name: ing.name,
          quantity: ing.amount ? parseFloat(ing.amount) || 1 : 1,
          unit: ing.unit || 'units',
          category_id: 'other',
        });
        results.push({ success: true, name: ing.name, result });
      } catch (err) {
        results.push({ success: false, name: ing.name, error: err.message });
      }
    }
    return results;
  }

  async getShoppingLists() {
    return this.hass.callWS({ type: 'shopping_list_manager/lists/get_all' });
  }
}
