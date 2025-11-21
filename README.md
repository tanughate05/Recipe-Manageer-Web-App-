# RecipePal: CRUD Recipe Manager (Search, Filter, Mobile)

Folder structure

---

RecipeManagerApp/
├─ index.html
├─ addRecipe.html
├─ data.js
├─ main.js
├─ style.css
├─ formRespnsive.css
├─ images/
│ ├─ recipe-bg.jpg
│ ├─ bg-form.jpg
│ ├─ wooden-background.jpg
│ └─ (other images...)
├─ README.md

---

# RecipeManagerApp

A small front-end recipe manager. Recipes are rendered as cards, can be added from a form and are stored in browser localStorage. There is a simple mobile menu, search and difficulty filter.

---

## Quick file overview

- `index.html` — Main listing page. Includes search bar, difficulty filter (select with id `filter-section`), add-recipe button and the cards grid (`.grid-box-recipe`).
- `addRecipe.html` — Form page to add a recipe (`#recipe-form`).
- `data.js` — Optional seed data: `window.RECIPES_DATA` array. Used if localStorage key `userRecipes` is empty.
- `main.js` — App logic:
  - `loadRecipes()` / `saveRecipes()` — read/write `localStorage` key `userRecipes`.
  - `makeCard(recipe)` — builds DOM card for each recipe (title, description, ingredients, steps, one image, actions).
  - `renderCards(search)` — renders filtered list using current search + difficulty.
  - Separate wiring functions:
    - `wireSearchInput()` — live input (debounced).
    - `wireSearchButton()` — search by button click.
    - `wireFilterSelect()` — difficulty select (id `filter-section`).
    - `wireForm()` — handles `#recipe-form` submit and saves to localStorage.
    - `wireMenuToggle()` — mobile header menu toggle.
- `style.css` — global styles and card/grid/menu styles.
- `formRespnsive.css` — styles for add form and responsive rules.
- `images/` — background and recipe images.

---

## How localStorage is used / lessons learned

- Key used: `userRecipes`. All added recipes are pushed into that array and saved as JSON.
- Seed behavior: when `userRecipes` is absent, code falls back to `window.RECIPES_DATA` (from `data.js`) and persists that seed into `localStorage`. This ensures initial cards display.
- Common pitfalls:
  - If `data.js` contains `localStorage.removeItem("userRecipes")`, it will wipe saved recipes on every page load. Remove that line in `data.js` unless intentionally resetting during development.
  - If you change `data.js` but `userRecipes` already exists in localStorage, the page continues to use the stored data — you may need to clear the key to pick up `data.js` changes.
- Useful console commands:
  - Reset stored recipes: `localStorage.removeItem('userRecipes'); location.reload();`
  - Inspect stored recipes: `JSON.parse(localStorage.getItem('userRecipes'))`

Persisting changes to `data.js` on disk:

- Browser code cannot modify files on disk. To actually update `data.js` on save you need a backend server that accepts a POST and rewrites `data.js`. (I suggested a minimal Express server earlier.)
- Without a server, saving goes to `localStorage` only.

---

## Search + Filter behavior

- Search input is debounced (≈160–180ms) and filters title, description, ingredients, steps, difficulty.
- Search button triggers an immediate search.
- Difficulty filter (`select#filter-section`) filters recipes by recipe.difficulty (`easy`, `medium`, `hard`, `all`).

Implementation notes (main.js):

- The code separates search input and search button wiring:
  - `wireSearchInput()` listens for `input` and `Enter` key.
  - `wireSearchButton()` listens for `.search-button` clicks.
  - `wireFilterSelect()` listens for changes on `#filter-section`.
- `renderCards()` uses both `currentSearch` and `currentDifficulty`.

---

## CSS / UI notes & small details you have used

- Background image:
  - Single image set with `background-image: url("images/recipe-bg.jpg"); background-repeat: no-repeat; background-position: top center; background-size: cover;`
  - To dim the background without making children translucent, use a gradient overlay (or a ::before pseudo-element) — you already used both approaches in different files.
- Form container `.add-recipe-container`:
  - Has cover background image (e.g., `wooden-background.jpg`), overlay via gradients, rounded corners and box-shadow.
  - For responsiveness you added media queries (`max-width: 768px` and `420px`) to remove float, set width:100%, reduce padding and make height `auto`.
- Cards:
  - Fixed visual appearance but content is clamped in `.card-body` with a Read more button that toggles `.expanded` class to reveal full content.
  - Single image per card (placed above content).
  - Hover effects: subtle lift + shadow; expanded uses `z-index` so it overlaps neighbors.
- Mobile nav:
  - Hamburger `.menu-toggle` with three bars, toggles `nav.nav-open`.
  - On mobile, `.nav-links` shown as a vertical column inside the same nav with background matching `--header-nav-bg`.
  - You also experimented with a CSS-only checkbox approach (`.side-menu`) and `:has()` rules (note: `:has` not supported in all browsers).

---

## How to run the app

- Quick (no server): open `index.html` in your browser.
- Recommended (serves assets correctly — Mac / Terminal):
  - From project folder:
    - Python 3: `python3 -m http.server 8000`
    - Or Node: `npx serve .` (install `serve` if needed)
  - Then open: `http://localhost:8000`
- Dev tips:
  - Open DevTools (Console) to view errors and localStorage contents.
  - To reset seed data and start fresh:  
    `localStorage.removeItem('userRecipes'); location.reload();`

## Data structure in localStorage

- Key: `userRecipes`
- Value: JSON string of an array of recipe objects. Each recipe object example:

```json
{
  "id": 1763703887413,
  "title": "Pav Bhaji",
  "description": "Full description text...",
  "ingredients": "line1\nline2\nline3",
  "steps": "step1\nstep2",
  "prepTime": 20,
  "cookTime": 30,
  "times": 50,
  "difficulty": "easy",      // values: "easy" | "medium" | "hard"
  "imageURL": "https://...jpg",
  "savedAt": "2025-11-21T05:44:47.413Z"
}

---

## Known issues / tips

- If you see duplicate or wrong images: check `data.js` and localStorage recipe objects for correct `imageURL` values; file names are case sensitive on some systems.
- If newly added recipes don't show, verify there are no JS errors in DevTools — errors can stop submit handler.
- Keep `data.js` free of any call that clears `localStorage` unless intended.

---
```
