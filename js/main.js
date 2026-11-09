/**
 * main.js — Storefront Controller
 * =================================
 * Coordinates catalogue rendering from Supabase/Local Database,
 * multi-dimensional filtering (Category, Subcategory, Condition),
 * search, sorting, product detail modal with multi-image gallery,
 * and responsive navigation.
 */

// ── State ────────────────────────────────────────────────────────────────────
let allProducts = [];
let currentCategory = "all";
let currentSubcategory = null;
let currentCondition = "all"; // 'all', 'Brand New', 'Fairly Used'
let currentSearch = "";
let currentSort = "featured";
let isProductDetailOpen = false;

// ── Initialization ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  Cart.init();
  populateStoreInfo();
  buildCategoryNav();
  buildCategoryCards();
  buildFooterCategories();
  bindEvents();
  
  // Load products from database layer
  await loadCatalogue();
  
  handleHashNavigation();
});

// ── Store Information Binding ────────────────────────────────────────────────
function populateStoreInfo() {
  document.querySelectorAll("[data-store-name]").forEach((el) => {
    el.textContent = STORE_CONFIG.name;
  });
  document.querySelectorAll("[data-store-tagline]").forEach((el) => {
    el.textContent = STORE_CONFIG.tagline;
  });
  document.querySelectorAll("[data-store-description]").forEach((el) => {
    el.textContent = STORE_CONFIG.description;
  });
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    el.href = `https://wa.me/${STORE_CONFIG.whatsappNumber}`;
  });
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.href = `mailto:${STORE_CONFIG.email}`;
    el.textContent = STORE_CONFIG.email;
  });
  document.querySelectorAll("[data-address]").forEach((el) => {
    el.textContent = STORE_CONFIG.address;
  });

  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// ── Catalogue Loading ─────────────────────────────────────────────────────────
async function loadCatalogue() {
  const loadingGrid = document.getElementById("products-grid");
  if (loadingGrid && (!allProducts || allProducts.length === 0)) {
    loadingGrid.innerHTML = `
      <div class="products-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
        <div class="spinner"></div>
        <p style="margin-top: 1rem; color: var(--clr-text-muted);">Loading gadget catalogue…</p>
      </div>`;
  }

  try {
    allProducts = await Database.getPublishedProducts();
  } catch (err) {
    console.error("Failed to load products from database:", err);
    allProducts = [];
  }

  renderFeatured();
  renderProducts();
}

// ── Navigation Building ───────────────────────────────────────────────────────
function buildCategoryNav() {
  const desktopNav = document.getElementById("desktop-category-nav");
  const mobileNav = document.getElementById("mobile-category-list");
  const filterPillsRow = document.getElementById("primary-category-pills");

  CATEGORIES.forEach((cat) => {
    // Desktop Nav
    if (desktopNav) {
      const a = document.createElement("a");
      a.href = `#${cat.id}`;
      a.className = "nav__cat-link";
      a.textContent = cat.label;
      a.dataset.category = cat.id;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        filterByCategory(cat.id);
        scrollToSection("shop");
        setActiveCatLink(a);
      });
      desktopNav.appendChild(a);
    }

    // Mobile Nav
    if (mobileNav) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${cat.id}`;
      a.className = "mobile-nav__link";
      a.innerHTML = `<span>${cat.icon}</span> ${cat.label}`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        filterByCategory(cat.id);
        scrollToSection("shop");
        closeMobileMenu();
      });
      li.appendChild(a);
      mobileNav.appendChild(li);
    }

    // Shop Category Pills
    if (filterPillsRow) {
      const pill = document.createElement("button");
      pill.className = "filter-pill";
      pill.textContent = cat.label;
      pill.dataset.category = cat.id;
      pill.addEventListener("click", () => {
        filterByCategory(cat.id);
      });
      filterPillsRow.appendChild(pill);
    }
  });
}

function setActiveCatLink(activeEl) {
  document.querySelectorAll(".nav__cat-link").forEach((el) => el.classList.remove("active"));
  if (activeEl) activeEl.classList.add("active");
}

function buildCategoryCards() {
  const grid = document.getElementById("category-cards-grid");
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map((cat) => `
    <div class="category-card" onclick="filterByCategory('${cat.id}'); scrollToSection('shop');" role="button" tabindex="0">
      <div class="category-card__img-wrap">
        <img src="${cat.image}" alt="${cat.label}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
      </div>
      <div class="category-card__body">
        <span class="category-card__icon">${cat.icon}</span>
        <p class="category-card__label">${cat.label}</p>
        <p class="category-card__desc">${cat.description}</p>
      </div>
    </div>
  `).join("");
}

function buildFooterCategories() {
  const list = document.getElementById("footer-category-list");
  if (!list) return;
  list.innerHTML = CATEGORIES.map((cat) => `
    <li>
      <a href="#${cat.id}" onclick="event.preventDefault(); filterByCategory('${cat.id}'); scrollToSection('shop');">
        ${cat.label}
      </a>
    </li>
  `).join("");
}

// ── Product Rendering ─────────────────────────────────────────────────────────

function renderFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  const featured = allProducts
    .filter((p) => p.featured && p.status === "published")
    .slice(0, 8);

  if (featured.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1 / -1; color: var(--clr-text-muted); text-align: center;">No featured gadgets at this moment.</p>`;
    return;
  }

  grid.innerHTML = featured.map(createProductCardHTML).join("");
  bindProductCardEvents(grid);
}

function getFilteredProducts() {
  let list = allProducts.filter((p) => p.status === "published");

  // Category filter
  if (currentCategory !== "all") {
    list = list.filter((p) => p.category === currentCategory);
  }

  // Subcategory filter
  if (currentSubcategory) {
    list = list.filter((p) => p.subcategory === currentSubcategory);
  }

  // Condition filter
  if (currentCondition !== "all") {
    list = list.filter((p) => p.condition === currentCondition);
  }

  // Search filter (name, brand, model, description)
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const model = (p.model || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || brand.includes(q) || model.includes(q) || desc.includes(q);
    });
  }

  // Sort
  switch (currentSort) {
    case "price-asc":
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price-desc":
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "newest":
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      break;
    default: // 'featured'
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  const emptyState = document.getElementById("products-empty");
  const countEl = document.getElementById("products-count");

  if (!grid) return;

  const products = getFilteredProducts();

  if (countEl) {
    countEl.textContent = `Showing ${products.length} gadget${products.length !== 1 ? "s" : ""}`;
  }

  if (products.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "flex";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  grid.innerHTML = products.map(createProductCardHTML).join("");
  bindProductCardEvents(grid);
}

// ── Product Card Markup ───────────────────────────────────────────────────────
function createProductCardHTML(product) {
  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label || product.category;
  const isIndividual = product.inventory_type === "individual";
  const isSoldOut = product.stock_quantity <= 0;

  // Condition Badge
  const isNewCondition = product.condition === "Brand New";
  const conditionBadge = isNewCondition
    ? `<span class="badge badge--brand-new">Brand New</span>`
    : `<span class="badge badge--used">Fairly Used</span>`;

  // Age badge if older model
  const ageBadge = product.model_age === "Older Model"
    ? `<span class="badge badge--older-model">Older Model</span>`
    : "";

  // Stock / Availability badge
  let stockBadge = "";
  if (isSoldOut) {
    stockBadge = `<span class="badge badge--sold">Sold Out</span>`;
  } else if (isIndividual) {
    stockBadge = `<span class="badge badge--single">Single Device</span>`;
  }

  const primaryImg = resolveProductImage(product.image || (product.images && product.images[0]));

  // Used device highlights snippet
  let usedSnippet = "";
  if (product.condition === "Fairly Used") {
    const highlights = [];
    if (product.battery_health) highlights.push(`🔋 ${product.battery_health}% BH`);
    if (product.cosmetic_condition) highlights.push(product.cosmetic_condition.slice(0, 32) + "…");
    if (highlights.length > 0) {
      usedSnippet = `<div class="product-card__used-snippet">${highlights.join(" • ")}</div>`;
    }
  }

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card__img-wrap">
        <div class="product-card__badges">
          ${conditionBadge}
          ${ageBadge}
          ${stockBadge}
        </div>
        <img src="${primaryImg}" alt="${product.name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
      </div>
      <div class="product-card__body">
        <p class="product-card__category">${categoryLabel}</p>
        <h3 class="product-card__name">${product.name}</h3>
        <p class="product-card__price">${formatPrice(product.price)}</p>
        ${usedSnippet}
        <p class="product-card__desc">${product.description ? product.description.substring(0, 85) + (product.description.length > 85 ? "…" : "") : ""}</p>
        <div class="product-card__actions">
          <button class="btn btn--outline btn--sm js-view-product" data-id="${product.id}">View Details</button>
          <button class="btn btn--primary btn--sm js-add-cart" data-id="${product.id}" ${isSoldOut ? "disabled" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            ${isSoldOut ? "Sold" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>`;
}

function bindProductCardEvents(container) {
  container.querySelectorAll(".js-view-product").forEach((btn) => {
    btn.addEventListener("click", () => openProductDetail(btn.dataset.id));
  });

  container.querySelectorAll(".js-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const product = allProducts.find((p) => String(p.id) === String(btn.dataset.id));
      if (product) {
        Cart.addItem(product, 1);
      }
    });
  });
}

// ── Product Detail Modal with Multi-Image Gallery ─────────────────────────────
async function openProductDetail(productId) {
  const product = allProducts.find((p) => String(p.id) === String(productId));
  if (!product) return;

  const modal = document.getElementById("product-modal");
  const content = document.getElementById("product-modal-content");
  if (!modal || !content) return;

  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label || product.category;
  const isIndividual = product.inventory_type === "individual";
  const isSoldOut = product.stock_quantity <= 0;

  // Prepare images array
  const images = (product.images && product.images.length > 0)
    ? product.images.map(resolveProductImage)
    : [resolveProductImage(product.image)];

  // Gallery thumbnails
  const thumbnailsHtml = images.length > 1
    ? `<div class="modal__thumbnails">
        ${images.map((img, idx) => `
          <button class="modal__thumb-btn ${idx === 0 ? 'active' : ''}" onclick="switchModalImage('${img}', this)" aria-label="View photo ${idx + 1}">
            <img src="${img}" alt="${product.name} angle ${idx + 1}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
          </button>
        `).join("")}
       </div>`
    : "";

  // Used phone / individual device diagnostics
  let usedInspectionHtml = "";
  if (product.condition === "Fairly Used" || isIndividual) {
    usedInspectionHtml = `
      <div class="used-device-card">
        <h4 class="used-device-card__title">Device Condition & Diagnostics</h4>
        <div class="used-device-card__grid">
          ${product.battery_health ? `
            <div class="used-spec-item">
              <span class="used-spec-label">Battery Health</span>
              <span class="used-spec-val highlight-green">🔋 ${product.battery_health}%</span>
            </div>` : ""}
          <div class="used-spec-item">
            <span class="used-spec-label">Cosmetic Grade</span>
            <span class="used-spec-val">${product.cosmetic_condition || "Clean tested condition"}</span>
          </div>
          <div class="used-spec-item">
            <span class="used-spec-label">Defects / Faults</span>
            <span class="used-spec-val">${product.faults || "None (100% Fully Functional)"}</span>
          </div>
          <div class="used-spec-item">
            <span class="used-spec-label">Included Accessories</span>
            <span class="used-spec-val">${product.accessories_included || "Standard cable"}</span>
          </div>
        </div>
      </div>`;
  }

  // Specifications
  let specsHtml = "";
  if (product.specs && Object.keys(product.specs).length > 0) {
    const rows = Object.entries(product.specs)
      .map(([k, v]) => `<tr><td class="spec-key">${k}</td><td class="spec-val">${v}</td></tr>`)
      .join("");
    specsHtml = `
      <div class="modal__specs-wrap">
        <h4 class="specs-title">Technical Specifications</h4>
        <table class="spec-table"><tbody>${rows}</tbody></table>
      </div>`;
  }

  content.innerHTML = `
    <div class="modal__inner">
      <div class="modal__img-col">
        <div class="modal__main-img-wrap">
          <img id="modal-main-img" src="${images[0]}" alt="${product.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        ${thumbnailsHtml}
      </div>
      <div class="modal__info-col">
        <div class="modal__header-badges">
          <span class="badge ${product.condition === 'Brand New' ? 'badge--brand-new' : 'badge--used'}">${product.condition}</span>
          ${product.model_age === 'Older Model' ? '<span class="badge badge--older-model">Older Model</span>' : ''}
          ${isIndividual ? '<span class="badge badge--single">Single Unique Device</span>' : ''}
          ${isSoldOut ? '<span class="badge badge--sold">Sold Out</span>' : ''}
        </div>
        <p class="modal__category">${categoryLabel}</p>
        <h2 class="modal__name">${product.name}</h2>
        <p class="modal__price">${formatPrice(product.price)}</p>
        <p class="modal__desc">${product.description || ""}</p>
        
        ${usedInspectionHtml}
        ${specsHtml}

        <div class="modal__actions">
          ${
            isIndividual
              ? `<div class="modal__individual-notice">Unique physical device listing (Quantity: 1)</div>`
              : `
              <div class="qty-control modal__qty">
                <button class="qty-btn" id="modal-qty-dec" aria-label="Decrease quantity">−</button>
                <span class="qty-value" id="modal-qty-val">1</span>
                <button class="qty-btn" id="modal-qty-inc" aria-label="Increase quantity">+</button>
              </div>`
          }
          <button class="btn btn--primary" id="modal-add-btn" ${isSoldOut ? "disabled" : ""}>
            ${isSoldOut ? "Item Sold" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>`;

  // Bind quantity controls in modal
  let qty = 1;
  const maxStock = isIndividual ? 1 : Number(product.stock_quantity || 1);
  const qtyVal = content.querySelector("#modal-qty-val");
  const qtyDec = content.querySelector("#modal-qty-dec");
  const qtyInc = content.querySelector("#modal-qty-inc");
  const addBtn = content.querySelector("#modal-add-btn");

  if (qtyDec && qtyInc && qtyVal) {
    qtyDec.addEventListener("click", () => {
      if (qty > 1) {
        qty--;
        qtyVal.textContent = qty;
      }
    });
    qtyInc.addEventListener("click", () => {
      if (qty < maxStock) {
        qty++;
        qtyVal.textContent = qty;
      } else {
        Cart.showToast(`Maximum ${maxStock} in stock.`, "info");
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      Cart.addItem(product, qty);
      closeProductDetail();
    });
  }

  modal.classList.add("modal--open");
  document.body.classList.add("no-scroll");
  isProductDetailOpen = true;
}

window.switchModalImage = function(imgUrl, btn) {
  const mainImg = document.getElementById("modal-main-img");
  if (mainImg) mainImg.src = imgUrl;
  document.querySelectorAll(".modal__thumb-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
};

function closeProductDetail() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.remove("modal--open");
  document.body.classList.remove("no-scroll");
  isProductDetailOpen = false;
}

// ── Filtering & Searching ─────────────────────────────────────────────────────

function filterByCategory(categoryId) {
  currentCategory = categoryId;
  currentSubcategory = null;
  currentSearch = "";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  updateFilterUI();
  renderProducts();
}

function filterByCondition(condition) {
  currentCondition = condition;
  document.querySelectorAll(".condition-pill").forEach((pill) => {
    pill.classList.toggle("filter-pill--active", pill.dataset.condition === condition);
  });
  renderProducts();
}

function updateFilterUI() {
  // Category pills
  document.querySelectorAll("#primary-category-pills .filter-pill").forEach((pill) => {
    pill.classList.toggle("filter-pill--active", pill.dataset.category === currentCategory);
  });

  // Section Heading
  const heading = document.getElementById("shop-heading");
  if (heading) {
    if (currentCategory === "all") {
      heading.textContent = "All Gadgets";
    } else {
      const cat = CATEGORIES.find((c) => c.id === currentCategory);
      heading.textContent = cat ? cat.label : "Products";
    }
  }

  buildSubcategoryPills();
}

function buildSubcategoryPills() {
  const container = document.getElementById("subcategory-pills");
  if (!container) return;
  container.innerHTML = "";

  if (currentCategory === "all") return;

  const cat = CATEGORIES.find((c) => c.id === currentCategory);
  if (!cat || !cat.subcategories || cat.subcategories.length === 0) return;

  const allPill = document.createElement("button");
  allPill.className = `filter-pill ${!currentSubcategory ? "filter-pill--active" : ""}`;
  allPill.textContent = `All ${cat.label}`;
  allPill.addEventListener("click", () => {
    currentSubcategory = null;
    renderProducts();
    buildSubcategoryPills();
  });
  container.appendChild(allPill);

  cat.subcategories.forEach((sub) => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${currentSubcategory === sub.id ? "filter-pill--active" : ""}`;
    pill.textContent = sub.label;
    pill.addEventListener("click", () => {
      currentSubcategory = sub.id;
      renderProducts();
      buildSubcategoryPills();
    });
    container.appendChild(pill);
  });
}

function handleHashNavigation() {
  const hash = window.location.hash.replace("#", "");
  if (hash && CATEGORIES.find((c) => c.id === hash)) {
    setTimeout(() => {
      filterByCategory(hash);
      scrollToSection("shop");
    }, 150);
  }
}

// ── Event Bindings ────────────────────────────────────────────────────────────
function bindEvents() {
  // Search inputs with debouncing
  const searchInput = document.getElementById("search-input");
  const mobileSearchInput = document.getElementById("mobile-search-input");

  function onSearch(query) {
    currentSearch = query;
    if (currentSearch.trim()) {
      currentCategory = "all";
      currentSubcategory = null;
      updateFilterUI();
    }
    renderProducts();
    if (currentSearch.trim()) scrollToSection("shop");
  }

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onSearch(e.target.value), 250);
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onSearch(e.target.value);
        if (e.target.value.trim()) closeMobileMenu();
      }, 300);
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Condition filter buttons
  document.querySelectorAll(".condition-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterByCondition(btn.dataset.condition);
    });
  });

  // Category All pill
  const allCatPill = document.getElementById("filter-all-cat");
  if (allCatPill) {
    allCatPill.addEventListener("click", () => {
      filterByCategory("all");
    });
  }

  // Hero Shop button
  const heroBtn = document.getElementById("hero-shop-btn");
  if (heroBtn) {
    heroBtn.addEventListener("click", () => scrollToSection("shop"));
  }

  // "Browse All" / "Shop All" buttons
  document.querySelectorAll(".js-shop-all").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = "all";
      currentSubcategory = null;
      currentCondition = "all";
      currentSearch = "";
      updateFilterUI();
      renderProducts();
      scrollToSection("shop");
    });
  });

  // Mobile Menu Toggle
  const hamburger = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("mobile-menu--open");
      hamburger.setAttribute("aria-expanded", isOpen);
      hamburger.classList.toggle("hamburger--open", isOpen);
    });
  }

  document.addEventListener("click", (e) => {
    if (mobileMenu && hamburger && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Modal Close Events
  const modalOverlay = document.getElementById("product-modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeProductDetail();
    });
  }

  const modalClose = document.getElementById("modal-close-btn");
  if (modalClose) modalClose.addEventListener("click", closeProductDetail);

  // Keyboard navigation (ESC key)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (isProductDetailOpen) closeProductDetail();
      else Cart.close();
    }
  });

  // Header scroll shadow
  window.addEventListener("scroll", () => {
    const header = document.getElementById("site-header");
    if (header) header.classList.toggle("header--scrolled", window.scrollY > 15);
  });
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburger = document.getElementById("hamburger-btn");
  if (mobileMenu) mobileMenu.classList.remove("mobile-menu--open");
  if (hamburger) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.classList.remove("hamburger--open");
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}
