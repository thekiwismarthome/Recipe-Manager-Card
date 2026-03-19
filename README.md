# Recipe Manager Card for Home Assistant

A Lovelace card that brings a full-featured recipe management UI to your Home Assistant dashboard — browse, search, cook, plan meals, manage shopping lists and track timers, all from one card.

> **This card requires the [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) backend integration to be installed first.**

---

## Features

### Recipe Library
- Grid view with live search and filter by tags, courses, categories and collections
- Responsive layout — compact phone view and wide tablet/desktop view
- Sort by rating, filter favourites or recently viewed

### Recipe Detail
- Full ingredients list with optional metric unit conversion (oz/lb/cups → g/ml/kg)
- Serving scaler — tap +/− to multiply all ingredient quantities
- Step-by-step directions with in-line cook timers (tap any time mention to start a timer)
- Nutrition panel with macro ring (carbs / fat / protein)
- Photo gallery with slideshow — swipe or auto-advance
- Favourite, Plan and Edit quick-action buttons

### Recipe Editing
- Edit all recipe fields: name, description, ingredients, directions, nutrition, tags, courses, categories, collections, notes
- Drag-and-drop ingredient and step reordering
- Upload a photo from your device or paste an image URL
- Star rating picker

### Adding Recipes
- **Scrape from URL** — paste any recipe website link and import automatically
- **Manual entry** — fill in the form yourself
- **Recipe Keeper import** — bulk-import from a Recipe Keeper HTML export

### Meal Planner
- Weekly calendar with breakfast, lunch, dinner and snack slots
- Navigate between weeks, assign recipes to any slot
- Back-to-recipe shortcut when opening the planner from a recipe detail

### Shopping List
- Add recipe ingredients to a shopping list directly from the recipe
- Integrates with [Shopping List Manager Card](https://github.com/thekiwismarthome/shopping-list-manager-card)

### Timers
- Start timers by tapping time mentions in directions ("bake for 25 minutes")
- Save timer presets for your most-used times
- Multiple timers run simultaneously with audio alerts
- Wake lock keeps your screen on while cooking

### Customisation (Settings)
- Light / dark theme with auto system-theme detection
- Adjustable recipe grid columns (2–10)
- Metric unit conversion toggle
- Image slideshow interval (3 s / 5 s / 10 s / 15 s / off)
- Timer sound selection and wake lock duration

---

## Requirements

- Home Assistant **2024.8.0** or newer
- [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) integration installed and running
- HACS installed ([hacs.xyz](https://hacs.xyz))

---

## Installation

### Step 1 — Install the Backend Integration First

If you haven't already, install [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) via HACS and restart Home Assistant. The card will not work without it.

### Step 2 — Add the Card via HACS

1. Open HACS in your Home Assistant sidebar
2. Click **Frontend**
3. Click the three-dot menu (top right) → **Custom repositories**
4. Paste `https://github.com/thekiwismarthome/Recipe-Manager-Card` and select category **Dashboard**
5. Click **Add**
6. Search for **Recipe Manager Card** and click **Download**

### Step 3 — Add to Your Dashboard

1. Go to any dashboard and enter **Edit mode**
2. Click **Add Card** → search for **Custom: Recipe Manager Card**
3. Add it and save

> **Tip:** The card works best when given its own full-width dashboard tab so it has plenty of space.

---

## Updating

Updates are managed through HACS. When a new version is available you will see a notification in the HACS panel. After updating, do a hard refresh in your browser (**Ctrl+Shift+R** / **Cmd+Shift+R**) to clear the cached card file.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Card shows "Connecting…" | Make sure Recipe Manager integration is installed and the HA WebSocket is accessible |
| Recipes not loading | Check that the Recipe Manager integration is set up under Settings → Integrations |
| Card shows old version after update | Hard-refresh your browser (Ctrl+Shift+R) |
| Scraping fails | The recipe site may block automated requests — try the manual entry option |
| Images not showing | Images are served from `/local/images/recipe_manager/` — check the integration is set up |

---

## Related

- [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) — the required backend integration
- [Shopping List Manager Card](https://github.com/thekiwismarthome/shopping-list-manager-card) — optional shopping list integration

---

## License

MIT License — see [LICENSE](LICENSE)
