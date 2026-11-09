/**
 * admin.js — Melisco Gadgets Owner Administration Controller
 * ==========================================================
 * Designed specifically for Android mobile smartphones.
 * Features:
 *   - Supabase Auth session management
 *   - Overview stats (published, stock count, sold, drafts)
 *   - Add & Edit gadgets with smartphone camera/gallery multi-upload
 *   - Individual device tracking (battery health, cosmetic grade, faults)
 *   - Quantity-based inventory tracking (stock counts)
 *   - Quick status switches: Mark as Sold, Mark Out of Stock, Publish, Archive
 *   - Destruction confirmation modals
 *   - Immediate toast feedback
 */

const AdminApp = (() => {
  let currentUser = null;
  let allAdminProducts = [];
  let currentStatusFilter = "all";
  let currentSearchQuery = "";
  
  // Staged image files & URLs for current modal
  let stagedImageFiles = []; // Array of File objects
  let currentProductImageUrls = []; // Array of existing URLs or Data URLs
  let forcedStatusToSave = null;

  // ── Initialization ────────────────────────────────────────────────────────
  async function init() {
    currentUser = await Database.getCurrentUser();
    if (currentUser) {
      const isAuthorized = await Database.checkOwnerAuthorization();
      if (isAuthorized) {
        showDashboardView();
        await loadDashboardData();
      } else {
        showLoginView();
        const errorBox = document.getElementById("login-error");
        if (errorBox) {
          errorBox.textContent = "Your account is authenticated, but not authorized as a store owner. Add your user ID to public.store_owners in Supabase.";
          errorBox.style.display = "block";
        }
      }
    } else {
      showLoginView();
    }

    // Populate Subcategories based on default category
    handleCategoryChange();
    handleConditionOrInventoryChange();
  }

  // ── View Switching ────────────────────────────────────────────────────────
  function showLoginView() {
    const loginView = document.getElementById("login-view");
    const dashView = document.getElementById("dashboard-view");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginView) loginView.style.display = "flex";
    if (dashView) dashView.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  function showDashboardView() {
    const loginView = document.getElementById("login-view");
    const dashView = document.getElementById("dashboard-view");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginView) loginView.style.display = "none";
    if (dashView) dashView.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  }

  // ── Authentication ────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorBox = document.getElementById("login-error");
    const submitBtn = document.getElementById("login-submit-btn");

    if (errorBox) errorBox.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying…";
    }

    try {
      const data = await Database.signIn(email, password);
      currentUser = data.user;

      const isAuthorized = await Database.checkOwnerAuthorization();
      if (!isAuthorized) {
        await Database.signOut();
        currentUser = null;
        throw new Error("Access Denied: Your account is not registered in the 'store_owners' table. Run the SQL step in README to authorize this owner.");
      }

      showDashboardView();
      await loadDashboardData();
      showToast("Welcome back, Store Owner!", "success");
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err.message || "Sign in failed. Check your credentials.";
        errorBox.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In to Dashboard";
      }
    }
  }

  async function handleLogout() {
    await Database.signOut();
    currentUser = null;
    showLoginView();
    showToast("Signed out successfully.", "info");
  }

  // ── Dashboard Data Loading ────────────────────────────────────────────────
  async function loadDashboardData() {
    const listEl = document.getElementById("admin-product-list");
    try {
      allAdminProducts = await Database.getAllProductsForAdmin();
      updateMetricCards();
      renderProductCards();
    } catch (err) {
      console.error("Error loading admin products:", err);
      if (listEl) {
        listEl.innerHTML = `<p style="color: var(--adm-danger); text-align: center;">Error loading products. Refresh to retry.</p>`;
      }
    }
  }

  function updateMetricCards() {
    const published = allAdminProducts.filter((p) => p.status === "published");
    const drafts = allAdminProducts.filter((p) => p.status === "draft");
    const sold = allAdminProducts.filter((p) => p.status === "sold");
    const archived = allAdminProducts.filter((p) => p.status === "archived");

    // Total available stock across published & draft
    const totalStock = allAdminProducts
      .filter((p) => p.status === "published" || p.status === "draft")
      .reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);

    const pubEl = document.getElementById("metric-published");
    const stockEl = document.getElementById("metric-stock");
    const soldEl = document.getElementById("metric-sold");
    const draftEl = document.getElementById("metric-drafts");

    if (pubEl) pubEl.textContent = published.length;
    if (stockEl) stockEl.textContent = totalStock;
    if (soldEl) soldEl.textContent = sold.length;
    if (draftEl) draftEl.textContent = drafts.length;

    // Update tab badges
    const cAll = document.getElementById("count-all");
    const cPub = document.getElementById("count-published");
    const cDraft = document.getElementById("count-draft");
    const cSold = document.getElementById("count-sold");
    const cArch = document.getElementById("count-archived");

    if (cAll) cAll.textContent = allAdminProducts.length;
    if (cPub) cPub.textContent = published.length;
    if (cDraft) cDraft.textContent = drafts.length;
    if (cSold) cSold.textContent = sold.length;
    if (cArch) cArch.textContent = archived.length;
  }

  // ── Product Cards Rendering ───────────────────────────────────────────────
  function renderProductCards() {
    const listEl = document.getElementById("admin-product-list");
    if (!listEl) return;

    let filtered = [...allAdminProducts];

    // Status Filter
    if (currentStatusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === currentStatusFilter);
    }

    // Search Query
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const model = (p.model || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || model.includes(q);
      });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--adm-border); border-radius: 0.85rem; padding: 3rem 1rem; text-align: center; color: var(--adm-text-muted);">
          <p style="font-size: 1.1rem; font-weight: 700; color: var(--adm-text);">No gadgets found</p>
          <span style="font-size: 0.85rem;">Try a different search or filter, or add a new gadget.</span>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered.map(createAdminProductCardHtml).join("");
  }

  function createAdminProductCardHtml(p) {
    const isIndividual = p.inventory_type === "individual";
    const isSold = p.status === "sold";
    const isDraft = p.status === "draft";
    const isArchived = p.status === "archived";
    const isPublished = p.status === "published";

    // Primary image
    const rawImg = (p.images && p.images[0]) || p.image || "";
    const imgUrl = resolveProductImage(rawImg);

    // Status pill
    let statusPillClass = "badge--brand-new";
    let statusLabel = p.status.toUpperCase();
    if (isPublished) {
      statusPillClass = "badge--used";
      statusLabel = "PUBLISHED";
    } else if (isSold) {
      statusPillClass = "badge--sold";
      statusLabel = "SOLD";
    } else if (isDraft) {
      statusPillClass = "badge--older-model";
      statusLabel = "DRAFT";
    } else if (isArchived) {
      statusPillClass = "badge--older-model";
      statusLabel = "ARCHIVED";
    }

    // Condition & Inventory pills
    const conditionTag = p.condition === "Brand New"
      ? `<span class="badge badge--brand-new">Brand New</span>`
      : `<span class="badge badge--used">Fairly Used</span>`;

    const inventoryTag = isIndividual
      ? `<span class="badge badge--single">Single Device (Qty: 1)</span>`
      : `<span class="badge badge--older-model">Stock: ${p.stock_quantity} units</span>`;

    const ageTag = p.model_age === "Older Model"
      ? `<span class="badge badge--older-model">Older Model</span>`
      : "";

    // Used diagnostics snippet
    let diagSnippet = "";
    if (p.condition === "Fairly Used" || isIndividual) {
      const parts = [];
      if (p.battery_health) parts.push(`🔋 ${p.battery_health}% BH`);
      if (p.cosmetic_condition) parts.push(p.cosmetic_condition);
      if (p.faults) parts.push(`Faults: ${p.faults}`);
      if (parts.length > 0) {
        diagSnippet = `<div class="admin-product-card__diagnostics">${parts.join(" • ")}</div>`;
      }
    }

    return `
      <div class="admin-product-card" data-id="${p.id}">
        <img class="admin-product-card__thumb" src="${imgUrl}" alt="${p.name}" onerror="this.src='../assets/images/placeholder.svg'" loading="lazy" />
        <div class="admin-product-card__content">
          <div class="admin-product-card__top">
            <h3 class="admin-product-card__title">${p.name}</h3>
            <span class="badge ${statusPillClass}">${statusLabel}</span>
          </div>

          <div class="admin-product-card__price">${formatPrice(p.price)}</div>

          <div class="admin-product-card__tags">
            ${conditionTag}
            ${inventoryTag}
            ${ageTag}
          </div>

          ${diagSnippet}

          <!-- Quick Actions Bar -->
          <div class="admin-product-card__actions">
            <!-- Mark as Sold (for individual device) or Out of Stock (for quantity) -->
            ${
              isPublished && isIndividual
                ? `<button class="admin-btn admin-btn--danger" onclick="AdminApp.quickStatusChange('${p.id}', 'sold')">
                    Mark as Sold
                   </button>`
                : ""
            }
            ${
              isPublished && !isIndividual && p.stock_quantity > 0
                ? `<button class="admin-btn admin-btn--danger" onclick="AdminApp.quickSetStock('${p.id}', 0)">
                    Mark Out of Stock
                   </button>`
                : ""
            }

            <!-- Publish / Unpublish -->
            ${
              isDraft || isSold || isArchived
                ? `<button class="admin-btn admin-btn--success" onclick="AdminApp.quickStatusChange('${p.id}', 'published')">
                    Publish
                   </button>`
                : `<button class="admin-btn" onclick="AdminApp.quickStatusChange('${p.id}', 'draft')">
                    Unpublish
                   </button>`
            }

            <!-- Edit Details -->
            <button class="admin-btn admin-btn--primary" onclick="AdminApp.openEditProductModal('${p.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Edit
            </button>

            <!-- Archive -->
            ${
              !isArchived
                ? `<button class="admin-btn" onclick="AdminApp.quickStatusChange('${p.id}', 'archived')" title="Archive">
                    Archive
                   </button>`
                : ""
            }

            <!-- Delete with confirmation -->
            <button class="admin-btn admin-btn--danger" onclick="AdminApp.promptDelete('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>`;
  }

  // ── Quick Status Actions ──────────────────────────────────────────────────
  async function quickStatusChange(id, newStatus) {
    try {
      await Database.setProductStatus(id, newStatus);
      showToast(`Gadget status updated to "${newStatus.toUpperCase()}".`, "success");
      await loadDashboardData();
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  }

  async function quickSetStock(id, newStock) {
    try {
      const prod = allAdminProducts.find((p) => String(p.id) === String(id));
      if (!prod) return;
      await Database.updateProduct(id, { ...prod, stock_quantity: newStock });
      showToast(`Stock updated to ${newStock}.`, "success");
      await loadDashboardData();
    } catch (err) {
      showToast("Failed to update stock: " + err.message, "error");
    }
  }

  function promptDelete(id, name) {
    const modal = document.getElementById("confirm-modal");
    const msg = document.getElementById("confirm-message");
    const confirmBtn = document.getElementById("confirm-action-btn");

    if (msg) msg.textContent = `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        closeConfirmModal();
        try {
          await Database.deleteProduct(id);
          showToast(`Deleted "${name}".`, "info");
          await loadDashboardData();
        } catch (err) {
          showToast("Failed to delete: " + err.message, "error");
        }
      };
    }

    if (modal) modal.classList.add("open");
  }

  function closeConfirmModal() {
    const modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.remove("open");
  }

  // ── Modal Form: Add / Edit Product ────────────────────────────────────────
  function openAddProductModal() {
    const modal = document.getElementById("product-form-modal");
    const title = document.getElementById("form-modal-title");
    const form = document.getElementById("product-form");

    if (title) title.textContent = "Add New Gadget";
    if (form) form.reset();

    document.getElementById("form-product-id").value = "";
    document.getElementById("form-stock-quantity").value = "1";
    document.getElementById("form-condition").value = "Brand New";
    document.getElementById("form-inventory-type").value = "quantity";
    document.getElementById("form-model-age").value = "Current Model";

    stagedImageFiles = [];
    currentProductImageUrls = [];
    renderPreviewStrip();

    handleCategoryChange();
    handleConditionOrInventoryChange();

    if (modal) modal.classList.add("open");
  }

  function openEditProductModal(id) {
    const prod = allAdminProducts.find((p) => String(p.id) === String(id));
    if (!prod) return;

    const modal = document.getElementById("product-form-modal");
    const title = document.getElementById("form-modal-title");

    if (title) title.textContent = "Edit Gadget Details";

    document.getElementById("form-product-id").value = prod.id;
    document.getElementById("form-name").value = prod.name || "";
    document.getElementById("form-brand").value = prod.brand || "";
    document.getElementById("form-model").value = prod.model || "";
    document.getElementById("form-category").value = prod.category || "smartphones";
    
    handleCategoryChange();
    document.getElementById("form-subcategory").value = prod.subcategory || "";

    document.getElementById("form-price").value = prod.price || "";
    document.getElementById("form-condition").value = prod.condition || "Brand New";
    document.getElementById("form-model-age").value = prod.model_age || "Current Model";
    document.getElementById("form-inventory-type").value = prod.inventory_type || "quantity";
    document.getElementById("form-stock-quantity").value = prod.stock_quantity ?? 1;

    // Used Diagnostics
    document.getElementById("form-battery-health").value = prod.battery_health ?? "";
    document.getElementById("form-cosmetic").value = prod.cosmetic_condition || "";
    document.getElementById("form-faults").value = prod.faults || "";
    document.getElementById("form-accessories").value = prod.accessories_included || "";

    // Description & Featured
    document.getElementById("form-description").value = prod.description || "";
    document.getElementById("form-featured").checked = Boolean(prod.featured);

    // Specs
    if (prod.specs && typeof prod.specs === "object") {
      const specLines = Object.entries(prod.specs).map(([k, v]) => `${k}: ${v}`).join("\n");
      document.getElementById("form-specs-raw").value = specLines;
    } else {
      document.getElementById("form-specs-raw").value = "";
    }

    stagedImageFiles = [];
    currentProductImageUrls = (prod.images && prod.images.length > 0)
      ? [...prod.images]
      : (prod.image ? [prod.image] : []);

    renderPreviewStrip();
    handleConditionOrInventoryChange();

    if (modal) modal.classList.add("open");
  }

  function closeFormModal() {
    const modal = document.getElementById("product-form-modal");
    if (modal) modal.classList.remove("open");
  }

  // ── Conditional Form Fields Logic ─────────────────────────────────────────
  function handleCategoryChange() {
    const catSelect = document.getElementById("form-category");
    const subSelect = document.getElementById("form-subcategory");
    if (!catSelect || !subSelect) return;

    const catId = catSelect.value;
    const cat = CATEGORIES.find((c) => c.id === catId);

    subSelect.innerHTML = `<option value="">None / General</option>`;
    if (cat && cat.subcategories) {
      cat.subcategories.forEach((sub) => {
        subSelect.innerHTML += `<option value="${sub.id}">${sub.label}</option>`;
      });
    }
  }

  function handleConditionOrInventoryChange() {
    const condition = document.getElementById("form-condition").value;
    const invType = document.getElementById("form-inventory-type").value;

    const diagCard = document.getElementById("field-used-diagnostics");
    const qtyWrap = document.getElementById("field-quantity-wrap");

    // Show diagnostics box if device is Fairly Used OR tracked individually
    if (condition === "Fairly Used" || invType === "individual") {
      if (diagCard) diagCard.style.display = "block";
    } else {
      if (diagCard) diagCard.style.display = "none";
    }

    // Hide quantity field if individual device (since it is inherently 1)
    if (invType === "individual") {
      if (qtyWrap) qtyWrap.style.display = "none";
      document.getElementById("form-stock-quantity").value = "1";
    } else {
      if (qtyWrap) qtyWrap.style.display = "block";
    }
  }

  // ── Image Handling in Form ────────────────────────────────────────────────
  function handleImageFilesSelect(e) {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    files.forEach((file) => {
      stagedImageFiles.push(file);

      // Local preview reader
      const reader = new FileReader();
      reader.onload = (event) => {
        currentProductImageUrls.push(event.target.result);
        renderPreviewStrip();
      };
      reader.readAsDataURL(file);
    });

    e.target.value = ""; // Reset file input so same file can be re-added if desired
  }

  function removePreviewImage(index) {
    currentProductImageUrls.splice(index, 1);
    if (index < stagedImageFiles.length) {
      stagedImageFiles.splice(index, 1);
    }
    renderPreviewStrip();
  }

  function setAsPrimaryImage(index) {
    if (index === 0) return;
    const [url] = currentProductImageUrls.splice(index, 1);
    currentProductImageUrls.unshift(url);

    if (index < stagedImageFiles.length) {
      const [file] = stagedImageFiles.splice(index, 1);
      stagedImageFiles.unshift(file);
    }
    renderPreviewStrip();
  }

  function renderPreviewStrip() {
    const strip = document.getElementById("form-preview-strip");
    if (!strip) return;

    if (currentProductImageUrls.length === 0) {
      strip.innerHTML = `<span style="font-size: 0.75rem; color: var(--adm-text-muted);">No photographs uploaded yet. Tap above to add photos.</span>`;
      return;
    }

    strip.innerHTML = currentProductImageUrls
      .map((url, idx) => `
        <div class="preview-item">
          <img src="${resolveProductImage(url)}" alt="Gadget preview ${idx + 1}" />
          ${idx === 0 ? `<div class="preview-item__primary-badge">PRIMARY</div>` : ""}
          <button type="button" class="preview-item__remove" onclick="AdminApp.removePreviewImage(${idx})" title="Remove photo">×</button>
        </div>
      `)
      .join("");
  }

  // ── Form Save Handler ─────────────────────────────────────────────────────
  function submitProductWithStatus(status) {
    forcedStatusToSave = status;
    const form = document.getElementById("product-form");
    if (form) form.requestSubmit();
  }

  async function handleSaveProduct(e) {
    e.preventDefault();

    const saveBtn = document.getElementById("form-save-btn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving Gadget…";
    }

    try {
      const editId = document.getElementById("form-product-id").value;
      const name = document.getElementById("form-name").value.trim();
      const brand = document.getElementById("form-brand").value.trim();
      const model = document.getElementById("form-model").value.trim();
      const category = document.getElementById("form-category").value;
      const subcategory = document.getElementById("form-subcategory").value;
      const price = Number(document.getElementById("form-price").value);
      const condition = document.getElementById("form-condition").value;
      const model_age = document.getElementById("form-model-age").value;
      const inventory_type = document.getElementById("form-inventory-type").value;
      let stock_quantity = Number(document.getElementById("form-stock-quantity").value || 1);
      if (inventory_type === "individual") stock_quantity = 1;

      const battery_health = document.getElementById("form-battery-health").value;
      const cosmetic_condition = document.getElementById("form-cosmetic").value.trim();
      const faults = document.getElementById("form-faults").value.trim();
      const accessories_included = document.getElementById("form-accessories").value.trim();

      const description = document.getElementById("form-description").value.trim();
      const featured = document.getElementById("form-featured").checked;
      const status = forcedStatusToSave || "published";

      // Parse specifications
      const specsRaw = document.getElementById("form-specs-raw").value;
      const specs = {};
      specsRaw.split("\n").forEach((line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(":").trim();
          if (k && v) specs[k] = v;
        }
      });

      // 1. Upload new staged image files through Database layer
      const uploadedUrls = [];
      for (const file of stagedImageFiles) {
        const url = await Database.uploadImageFile(file);
        uploadedUrls.push(url);
      }

      // Combine existing non-data URLs with newly uploaded URLs
      const existingUrls = currentProductImageUrls.filter((u) => !u.startsWith("data:"));
      const finalImageUrls = [...existingUrls, ...uploadedUrls];
      if (finalImageUrls.length === 0) {
        finalImageUrls.push("../assets/images/placeholder.svg");
      }

      const productPayload = {
        name,
        brand,
        model,
        category,
        subcategory,
        price,
        condition,
        model_age,
        inventory_type,
        stock_quantity,
        battery_health: battery_health ? Number(battery_health) : null,
        cosmetic_condition: cosmetic_condition || null,
        faults: faults || null,
        accessories_included: accessories_included || null,
        description,
        specs,
        featured,
        status,
      };

      if (editId) {
        await Database.updateProduct(editId, productPayload, finalImageUrls);
        showToast(`Updated "${name}" successfully.`, "success");
      } else {
        await Database.createProduct(productPayload, finalImageUrls);
        showToast(`Added "${name}" to inventory!`, "success");
      }

      closeFormModal();
      await loadDashboardData();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error saving product: " + err.message, "error");
    } finally {
      forcedStatusToSave = null;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Publish Product";
      }
    }
  }

  // ── Filters & Search ──────────────────────────────────────────────────────
  function filterStatus(status) {
    currentStatusFilter = status;
    document.querySelectorAll(".status-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.status === status);
    });
    renderProductCards();
  }

  function handleSearch(e) {
    currentSearchQuery = e.target.value;
    renderProductCards();
  }

  // ── Toast Feedback ────────────────────────────────────────────────────────
  function showToast(message, type = "info") {
    const toast = document.getElementById("admin-toast");
    if (!toast) return;

    toast.className = `admin-toast visible ${type}`;
    toast.textContent = message;

    setTimeout(() => {
      toast.classList.remove("visible");
    }, 3200);
  }

  return {
    init,
    handleLogin,
    handleLogout,
    filterStatus,
    handleSearch,
    openAddProductModal,
    openEditProductModal,
    closeFormModal,
    handleCategoryChange,
    handleConditionOrInventoryChange,
    handleImageFilesSelect,
    removePreviewImage,
    setAsPrimaryImage,
    submitProductWithStatus,
    handleSaveProduct,
    quickStatusChange,
    quickSetStock,
    promptDelete,
    closeConfirmModal,
  };
})();

// Auto-run on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  AdminApp.init();
});
