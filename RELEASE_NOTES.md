# Release Notes — Recipe Manager Card v1.0.0

First public release of the Recipe Manager Card for Home Assistant.

> **Requires:** [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) backend integration v1.0.0 or later.

## What's Included

### Recipe Grid
- Browse all recipes in a responsive grid
- Live search bar with clear button
- Filter by tag, course or category using chip selectors
- Sort by rating or filter to favourites / recently viewed
- Configurable column count (2–10 columns)

### Recipe Detail View
- Full ingredients list with serving scaler (tap +/− to scale all quantities)
- Metric unit conversion — converts oz, lb, cups, fl oz → g, ml, kg on demand
- Step-by-step directions with tappable timers (tap any time mention to start a countdown)
- Ingredient checklist — tap ingredients to tick them off while cooking
- Nutrition panel with macro ring showing carbs, fat and protein arcs
- Photo gallery with swipe navigation and configurable auto-advance slideshow
- Favourite, Plan and Edit quick-action buttons (circular icon style)

### Wide Layout (Tablet/Desktop)
- Two-column layout: image + info card on the top row, ingredients + directions on the bottom row
- Collapsible sidebar with search, navigation and recipe count

### Narrow Layout (Phone)
- Single-column layout with full-width hero image
- Bottom navigation bar
- Tag/filter chips in the recipe grid

### Edit Mode
- Edit all recipe fields inline: name, description, source URL, prep/cook time, servings, rating, tags, courses, categories, collections and notes
- Upload a new photo from your device or paste an image URL — current image shown as preview at the top of the edit form
- Drag-and-drop ingredient and step reordering
- ▲/▼ reorder buttons as an alternative to dragging
- Inline ingredient and step editors with keyboard shortcuts (Enter to add)
- Nutrition facts editor (calories, fat, saturated fat, carbs, fibre, sugar, protein, sodium, cholesterol)
- Delete recipe with confirmation

### Adding Recipes
- **Scrape from URL** — paste any recipe website link and import in one tap
- **Manual entry** — fill in any fields you want
- **Recipe Keeper import** — drag-and-drop or upload an HTML export from Recipe Keeper for bulk import

### Meal Planner
- Weekly calendar view — navigate forward/backward through weeks
- Assign recipes to breakfast, lunch, dinner or snack slots on any day
- Remove meals with a single tap
- Back-to-recipe arrow when opening the planner from a recipe detail view

### Shopping List
- Add recipe ingredients to a shopping list from the recipe detail
- Integrates with Shopping List Manager Card (optional)

### Timers
- Start timers by tapping any time mention in recipe directions
- Multiple simultaneous timers
- Configurable presets for your most-used durations
- Audio alert on completion (built-in sounds or upload your own)
- Wake lock — keeps your screen on while cooking (configurable duration)

### Settings
- Light / dark / system-auto theme
- Grid column count (2–10)
- Show/hide metric unit conversion button
- Show/hide meal planner in navigation
- Image slideshow interval (Off / 3 s / 5 s / 10 s / 15 s)
- Wake lock duration (15 / 30 / 45 / 60 min)
- Timer sound selection

## Installation

See the [README](README.md) for full HACS installation instructions.

> **Also required:** Install [Recipe Manager](https://github.com/thekiwismarthome/Recipe-Manager) first — the card will not work without the backend integration.
