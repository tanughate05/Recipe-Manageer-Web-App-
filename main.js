// Renders cards from localStorage (key: userRecipes), wires search and form if present.
(() => {
  const STORAGE_KEY = "userRecipes";
  const loadRecipes = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      // If localStorage empty but data.js provided initial data, use it and persist
      if (
        window &&
        Array.isArray(window.RECIPES_DATA) &&
        window.RECIPES_DATA.length
      ) {
        const seed = window.RECIPES_DATA.map((r) => {
          // ensure consistent shape and unique id if needed
          return Object.assign(
            { id: r.id || `seed-${Date.now()}-${Math.random()}` },
            r
          );
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        } catch (e) {
          console.warn("Could not persist seed data to localStorage:", e);
        }
        return seed;
      }
      return [];
    } catch (e) {
      console.error("loadRecipes error", e);
      return [];
    }
  };

  const saveRecipes = (arr) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error("saveRecipes error", e);
    }
  };

  const container = () =>
    document.getElementById("recipes-container") ||
    document.querySelector(".grid-box-recipe");

  // ...existing code...
  function makeCard(recipe) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.dataset.id = recipe.id;

    // wrap the main content so we can clamp it via CSS and toggle expansion
    const body = document.createElement("div");
    body.className = "card-body";

    const h3 = document.createElement("h3");
    h3.textContent = recipe.title || "Untitled";
    body.appendChild(h3);

    const desc = document.createElement("p");
    desc.className = "recipe-description";
    desc.textContent = recipe.description || "";
    body.appendChild(desc);

    const meta = document.createElement("p");
    meta.className = "recipe-meta";
    meta.textContent = `Prep: ${recipe.prepTime || 0} min · Cook: ${
      recipe.cookTime || 0
    } min · Total: ${
      recipe.times || (recipe.prepTime || 0) + (recipe.cookTime || 0)
    } min · ${(recipe.difficulty || "").toString()}`;
    body.appendChild(meta);

    // Ingredients list
    const ingrWrap = document.createElement("div");
    ingrWrap.className = "recipe-ingredients";
    const ingrTitle = document.createElement("strong");
    ingrTitle.textContent = "Ingredients";
    ingrWrap.appendChild(ingrTitle);
    const ul = document.createElement("ul");
    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : String(recipe.ingredients || "").split(/\r?\n/);
    ingredients.forEach((i) => {
      if (!i.trim()) return;
      const li = document.createElement("li");
      li.textContent = i;
      ul.appendChild(li);
    });
    ingrWrap.appendChild(ul);
    body.appendChild(ingrWrap);

    // Steps list
    const stepsWrap = document.createElement("div");
    stepsWrap.className = "recipe-steps";
    const stepsTitle = document.createElement("strong");
    stepsTitle.textContent = "Steps";
    stepsWrap.appendChild(stepsTitle);
    const ol = document.createElement("ol");
    const steps = Array.isArray(recipe.steps)
      ? recipe.steps
      : String(recipe.steps || "").split(/\r?\n/);
    steps.forEach((s) => {
      if (!s.trim()) return;
      const li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    });
    stepsWrap.appendChild(ol);
    body.appendChild(stepsWrap);

    card.appendChild(body);

    // image (kept, above actions)
    const img = document.createElement("img");
    img.className = "recipe-image";
    img.alt = recipe.title || "Recipe image";
    img.src =
      recipe.imageURL && String(recipe.imageURL).trim()
        ? recipe.imageURL
        : "https://via.placeholder.com/600x360?text=No+Image";
    // place image at top visually by inserting before body if desired,
    // here we append so it appears after body — adjust as you prefer:
    card.insertBefore(img, body);

    // Read more button (toggles expansion)
    const readMoreBtn = document.createElement("button");
    readMoreBtn.className = "read-more-btn";
    readMoreBtn.type = "button";
    readMoreBtn.textContent = "Read more";
    readMoreBtn.addEventListener("click", () => {
      const expanded = card.classList.toggle("expanded");
      readMoreBtn.textContent = expanded ? "Read less" : "Read more";
      // ensure layout reflow: scroll into view when expanded
      if (expanded)
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // actions
    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      window.location.href = `addRecipe.html?edit=${encodeURIComponent(
        recipe.id
      )}`;
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete this recipe?")) return;
      const recipes = loadRecipes().filter((r) => r.id !== recipe.id);
      saveRecipes(recipes);
      renderCards(currentFilter);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    // append readMore button and actions at the end
    card.appendChild(readMoreBtn);
    card.appendChild(actions);

    return card;
  }
  // ...existing code...

  let currentFilter = "";

  function matches(recipe, q) {
    if (!q) return true;
    q = q.toLowerCase();
    const hay = [
      recipe.title,
      recipe.description,
      Array.isArray(recipe.ingredients)
        ? recipe.ingredients.join(" ")
        : recipe.ingredients,
      Array.isArray(recipe.steps) ? recipe.steps.join(" ") : recipe.steps,
      recipe.difficulty,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function renderCards(filter = "") {
    currentFilter = filter;
    const root = container();
    if (!root) return;
    root.innerHTML = "";
    const recipes = loadRecipes();
    const list = recipes.filter((r) => matches(r, filter));
    if (list.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No recipes found.";
      root.appendChild(p);
      return;
    }
    list.forEach((r) => root.appendChild(makeCard(r)));
  }

  function debounce(fn, ms = 180) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function wireSearch() {
    const input = document.querySelector(".search-input");
    const btn = document.querySelector(".search-button");
    if (!input) return;
    const run = debounce(() => renderCards(input.value.trim()), 160);
    input.addEventListener("input", run);
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") renderCards(input.value.trim());
    });
    if (btn)
      btn.addEventListener("click", () => renderCards(input.value.trim()));
  }

  // Keep addRecipe form handling if the page has the form
  function wireForm() {
    const recipeForm = document.getElementById("recipe-form");
    if (!recipeForm) return;

    recipeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!recipeForm.checkValidity()) {
        recipeForm.reportValidity();
        return;
      }
      const submitButton = recipeForm.querySelector(".submit-button");
      submitButton.textContent = "Saving...";
      submitButton.disabled = true;

      const formData = new FormData(recipeForm);
      const prepTime = parseInt(formData.get("prepTime")) || 0;
      const cookTime = parseInt(formData.get("cookTime")) || 0;

      const recipeData = {
        id: Date.now(),
        title: formData.get("title") || "",
        description: formData.get("description") || "",
        ingredients: formData.get("ingredients") || "",
        steps: formData.get("steps") || "",
        prepTime,
        cookTime,
        times: prepTime + cookTime,
        difficulty: formData.get("difficulty") || "",
        imageURL: formData.get("imageURL") || null,
        savedAt: new Date().toISOString(),
      };

      const recipes = loadRecipes();
      recipes.unshift(recipeData);
      saveRecipes(recipes);

      submitButton.textContent = "Recipe Saved!";
      setTimeout(() => {
        recipeForm.reset();
        submitButton.textContent = "Save Recipe";
        submitButton.disabled = false;
        // if on add page, navigate back to index to see card
        if (window.location.pathname.endsWith("addRecipe.html")) {
          window.location.href = "index.html";
        } else {
          renderCards();
        }
      }, 800);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // data.js will seed localStorage if empty before this runs (data.js should be loaded first)
    renderCards();
    wireSearch();
    wireForm();
  });
})();
