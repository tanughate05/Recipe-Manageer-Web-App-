(() => {
  const STORAGE_KEY = "userRecipes";

  const loadRecipes = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      if (
        window &&
        Array.isArray(window.RECIPES_DATA) &&
        window.RECIPES_DATA.length
      ) {
        const seed = window.RECIPES_DATA.map((r) =>
          Object.assign(
            { id: r.id || `seed-${Date.now()}-${Math.random()}` },
            r
          )
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        } catch (e) {}
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

  let currentSearch = "";
  let currentDifficulty = "all";

  //  max prep time filter state
  let currentMaxPrep = null;

  function makeCard(recipe) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.dataset.id = recipe.id;

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
      if (!i || !String(i).trim()) return;
      const li = document.createElement("li");
      li.textContent = i;
      ul.appendChild(li);
    });
    ingrWrap.appendChild(ul);
    body.appendChild(ingrWrap);

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
      if (!s || !String(s).trim()) return;
      const li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    });
    stepsWrap.appendChild(ol);
    body.appendChild(stepsWrap);

    card.appendChild(body);

    if (recipe.imageURL && String(recipe.imageURL).trim()) {
      const img = document.createElement("img");
      img.className = "recipe-image";
      img.alt = recipe.title || "Recipe image";
      img.src = recipe.imageURL;
      card.insertBefore(img, body);
    }

    const readMoreBtn = document.createElement("button");
    readMoreBtn.className = "read-more-btn";
    readMoreBtn.type = "button";
    readMoreBtn.textContent = "Read more";
    readMoreBtn.addEventListener("click", () => {
      const expanded = card.classList.toggle("expanded");
      readMoreBtn.textContent = expanded ? "Read less" : "Read more";
      if (expanded)
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

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
      renderCards(currentSearch);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(readMoreBtn);
    card.appendChild(actions);

    return card;
  }

  // max prep filter
  function matches(recipe, q, difficulty) {
    if (difficulty && difficulty !== "all") {
      const rDiff = (recipe.difficulty || "").toString().toLowerCase();
      if (rDiff !== String(difficulty).toLowerCase()) return false;
    }

    //  prep time filtering
    if (currentMaxPrep !== null) {
      const prep = Number(recipe.prepTime) || 0;
      if (prep > currentMaxPrep) return false;
    }

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

  function renderCards(search = "") {
    currentSearch = typeof search === "string" ? search : "";
    const root = container();
    if (!root) return;
    root.innerHTML = "";
    const recipes = loadRecipes();
    const list = recipes.filter((r) =>
      matches(r, currentSearch, currentDifficulty)
    );
    if (!list.length) {
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

  function wireSearchInput() {
    const input = document.querySelector(".search-input");
    if (!input) return;
    const run = debounce(() => renderCards(input.value.trim()), 160);
    input.addEventListener("input", run);
  }

  function wireSearchButton() {
    const btn = document.querySelector(".search-button");
    const input = document.querySelector(".search-input");
    if (!btn) return;
    btn.addEventListener("click", () =>
      renderCards(input ? input.value.trim() : "")
    );
  }

  function wireFilterSelect() {
    const sel = document.getElementById("filter-section");
    const input = document.querySelector(".search-input");
    if (!sel) return;
    currentDifficulty = sel.value || "all";
    sel.addEventListener("change", () => {
      currentDifficulty = sel.value;
      renderCards(input ? input.value.trim() : "");
    });
  }

  // Wire max prep filter
  const maxTimeInput = document.getElementById("maxTime");
  if (maxTimeInput) {
    maxTimeInput.addEventListener("input", () => {
      const v = maxTimeInput.value.trim();
      currentMaxPrep = v === "" ? null : Number(v);
      renderCards(currentSearch);
    });
  }

  function wireForm() {
    const recipeForm = document.getElementById("recipe-form");
    if (!recipeForm) return;

    recipeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!recipeForm.checkValidity()) {
        recipeForm.reportValidity();
        return;
      }

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

      renderCards();
    });
  }

  function wireMenuToggle() {
    const btn = document.querySelector(".menu-toggle");
    const nav = document.querySelector("header nav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      const opened = nav.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", opened ? "true" : "false");
    });

    nav.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("nav-open");
        btn.setAttribute("aria-expanded", "false");
      })
    );
  }

  function startFormBgSlideshow(images = [], intervalMs = 5000) {
    if (!images || !images.length) return null;
    const container = document.querySelector(".add-recipe-container");
    if (!container) return null;

    if (images.length === 1) {
      container.style.backgroundImage = `url("${images[0]}")`;
      return null;
    }

    let slideA = container.querySelector(".bg-slide.a");
    let slideB = container.querySelector(".bg-slide.b");

    if (!slideA) {
      slideA = document.createElement("div");
      slideA.className = "bg-slide a";
      container.insertBefore(slideA, container.firstChild);
    }

    if (!slideB) {
      slideB = document.createElement("div");
      slideB.className = "bg-slide b";
      container.insertBefore(slideB, container.firstChild);
    }

    let cur = 0;

    slideA.style.backgroundImage = `url("${images[0]}")`;
    slideA.classList.add("visible");
    slideB.style.backgroundImage = `url("${images[1 % images.length]}")`;
    slideB.classList.remove("visible");

    cur = 1;

    const id = setInterval(() => {
      const nextUrl = images[cur % images.length];

      const hidden = slideA.classList.contains("visible") ? slideB : slideA;
      const visible = hidden === slideA ? slideB : slideA;

      hidden.style.backgroundImage = `url("${nextUrl}")`;
      hidden.offsetHeight;

      visible.classList.remove("visible");
      hidden.classList.add("visible");

      cur = (cur + 1) % images.length;
    }, intervalMs);

    return () => clearInterval(id);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCards();
    wireSearchInput();
    wireSearchButton();
    wireFilterSelect();
    wireForm();
    wireMenuToggle();
    startFormBgSlideshow(
      [
        "images/wooden-background.jpg",
        "images/bg-bg-form-2.jpg",
        "images/bg-bg-form.jpg",
      ],
      5000
    );
  });
})();
