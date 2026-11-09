/**
 * cart.js — Shopping Cart & WhatsApp Checkout
 * ============================================
 * Handles cart storage, stock constraints, subtotal calculations,
 * drawer UI, and real-time database validation before WhatsApp order dispatch.
 */

const Cart = (() => {
  const STORAGE_KEY = "melisco_cart_items";

  // Array of { product: {...}, quantity: number }
  let items = [];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      items = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to read cart from localStorage:", e);
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }

  // ── Cart Modification ──────────────────────────────────────────────────────

  /**
   * Add item to cart with strict inventory rules
   */
  function addItem(product, requestedQty = 1) {
    if (!product || product.status !== "published" || product.stock_quantity <= 0) {
      showToast("Sorry, this item is currently unavailable or sold out.", "error");
      return false;
    }

    const isIndividual = product.inventory_type === "individual";
    const existing = items.find((i) => String(i.product.id) === String(product.id));

    if (existing) {
      if (isIndividual) {
        showToast(`"${product.name}" is a unique single device and is already in your cart (Max: 1).`, "info");
        open();
        return false;
      }

      const newQty = existing.quantity + requestedQty;
      if (newQty > product.stock_quantity) {
        existing.quantity = product.stock_quantity;
        showToast(`Stock limit reached. Maximum ${product.stock_quantity} available.`, "info");
      } else {
        existing.quantity = newQty;
        showToast(`Updated "${product.name}" quantity (${existing.quantity}) in cart.`);
      }
    } else {
      let finalQty = requestedQty;
      if (isIndividual) {
        finalQty = 1;
      } else if (finalQty > product.stock_quantity) {
        finalQty = product.stock_quantity;
      }

      items.push({
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          image: product.image || (product.images && product.images[0]) || PLACEHOLDER_IMAGE,
          inventory_type: product.inventory_type,
          condition: product.condition,
          stock_quantity: Number(product.stock_quantity),
          status: product.status,
        },
        quantity: finalQty,
      });

      showToast(`Added "${product.name}" to your cart.`);
    }

    save();
    renderCart();
    updateBadge();
    return true;
  }

  function removeItem(productId) {
    items = items.filter((i) => String(i.product.id) !== String(productId));
    save();
    renderCart();
    updateBadge();
  }

  function setQuantity(productId, quantity) {
    const item = items.find((i) => String(i.product.id) === String(productId));
    if (!item) return;

    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    // Individual device constraint: max 1
    if (item.product.inventory_type === "individual" && quantity > 1) {
      showToast("This is a unique individual device listing. Only 1 unit is available.", "info");
      item.quantity = 1;
      save();
      renderCart();
      updateBadge();
      return;
    }

    // Quantity-based constraint: cannot exceed available stock
    if (item.product.stock_quantity && quantity > item.product.stock_quantity) {
      showToast(`Only ${item.product.stock_quantity} units available in stock.`, "info");
      item.quantity = item.product.stock_quantity;
    } else {
      item.quantity = quantity;
    }

    save();
    renderCart();
    updateBadge();
  }

  function getTotal() {
    return items.reduce((sum, i) => sum + (Number(i.product.price) || 0) * i.quantity, 0);
  }

  function getTotalItems() {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }

  function getItems() {
    return items;
  }

  function clear() {
    items = [];
    save();
    renderCart();
    updateBadge();
    showToast("Cart has been cleared.", "info");
  }

  // ── UI Updates ─────────────────────────────────────────────────────────────

  function updateBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const total = getTotalItems();
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }

  function renderCart() {
    const body = document.getElementById("cart-items");
    const footer = document.getElementById("cart-footer");
    if (!body || !footer) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <p class="cart-empty__title">Your shopping cart is empty</p>
          <p class="cart-empty__sub">Discover smartphones, laptops, audio and gadgets in our store.</p>
          <button class="btn btn--primary" onclick="Cart.close()">Browse Gadgets</button>
        </div>`;
      footer.innerHTML = "";
      return;
    }

    body.innerHTML = items
      .map(({ product, quantity }) => {
        const isIndividual = product.inventory_type === "individual";
        const subtotal = Number(product.price) * quantity;
        const conditionBadge = product.condition
          ? `<span class="cart-item__condition-tag">${product.condition}</span>`
          : "";

        return `
          <div class="cart-item" data-id="${product.id}">
            <img class="cart-item__img" src="${resolveProductImage(product.image)}" alt="${product.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'" loading="lazy">
            <div class="cart-item__info">
              <p class="cart-item__name">${product.name}</p>
              <div class="cart-item__meta">
                ${conditionBadge}
                <span class="cart-item__price">${formatPrice(product.price)}</span>
              </div>
              ${
                isIndividual
                  ? `<div class="cart-item__individual-note">Single device listing (Qty: 1)</div>`
                  : `
                  <div class="qty-control" aria-label="Quantity control">
                    <button class="qty-btn" onclick="Cart.setQuantity('${product.id}', ${quantity - 1})" aria-label="Decrease quantity">−</button>
                    <span class="qty-value">${quantity}</span>
                    <button class="qty-btn" onclick="Cart.setQuantity('${product.id}', ${quantity + 1})" aria-label="Increase quantity">+</button>
                  </div>`
              }
            </div>
            <div class="cart-item__right">
              <button class="cart-item__remove" onclick="Cart.removeItem('${product.id}')" aria-label="Remove item" title="Remove item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <p class="cart-item__subtotal">${formatPrice(subtotal)}</p>
            </div>
          </div>`;
      })
      .join("");

    footer.innerHTML = `
      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>Subtotal (${getTotalItems()} item${getTotalItems() !== 1 ? "s" : ""})</span>
          <span class="cart-summary__total">${formatPrice(getTotal())}</span>
        </div>
        <p class="cart-summary__note">${STORE_CONFIG.deliveryNote}</p>
      </div>
      <button id="cart-checkout-btn" class="btn btn--whatsapp btn--full" onclick="Cart.checkoutViaWhatsApp()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Checkout via WhatsApp
      </button>
      <button class="btn btn--ghost btn--full" onclick="Cart.clear()">Clear Cart</button>`;
  }

  // ── WhatsApp Order Checkout Logic ──────────────────────────────────────────

  /**
   * Complete checkout validation and formatted WhatsApp message generation
   */
  async function checkoutViaWhatsApp() {
    if (items.length === 0) {
      showToast("Your cart is empty. Add gadgets before checking out.", "error");
      return;
    }

    // WhatsApp configuration check
    if (!isConfiguredWhatsApp(STORE_CONFIG.whatsappNumber)) {
      alert(
        `WhatsApp Number Notice:\n\nThe store's official WhatsApp order number is currently set to the default placeholder: ${STORE_CONFIG.whatsappNumber}.\n\nPlease configure your official business phone number in "js/config.js" under STORE_CONFIG.whatsappNumber.`
      );
      return;
    }

    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Verifying availability…";
    }

    try {
      // 1. Fetch latest product info to ensure prices & availability are accurate
      const validationIssues = [];
      const confirmedItems = [];
      const updatedCartItems = [];

      for (const item of items) {
        const fresh = await Database.getProductById(item.product.id);
        if (!fresh || fresh.status !== "published") {
          validationIssues.push(`"${item.product.name}" is no longer available and was removed from your cart.`);
          continue;
        }

        // Validate stock
        if (fresh.stock_quantity <= 0) {
          validationIssues.push(`"${fresh.name}" has just sold out and was removed from your cart.`);
          continue;
        }

        let confirmedQty = item.quantity;
        if (fresh.inventory_type === "individual") {
          confirmedQty = 1;
        } else if (confirmedQty > fresh.stock_quantity) {
          confirmedQty = fresh.stock_quantity;
          validationIssues.push(`"${fresh.name}" quantity was adjusted to maximum available stock (${fresh.stock_quantity}).`);
        }

        if (Number(fresh.price) !== Number(item.product.price)) {
          validationIssues.push(`"${fresh.name}" price updated from ${formatPrice(item.product.price)} to ${formatPrice(fresh.price)}.`);
        }

        confirmedItems.push({
          name: fresh.name,
          unitPrice: Number(fresh.price),
          quantity: confirmedQty,
          subtotal: Number(fresh.price) * confirmedQty,
          condition: fresh.condition,
        });

        updatedCartItems.push({
          product: {
            ...item.product,
            price: Number(fresh.price),
            stock_quantity: Number(fresh.stock_quantity),
            status: fresh.status,
          },
          quantity: confirmedQty,
        });
      }

      if (validationIssues.length > 0) {
        items = updatedCartItems;
        save();
        renderCart();
        updateBadge();
        alert("Cart Update Notice:\n\n" + validationIssues.join("\n"));
        if (confirmedItems.length === 0) {
          return;
        }
      } else {
        items = updatedCartItems;
        save();
      }

      // Calculate fresh grand total
      const grandTotal = confirmedItems.reduce((acc, i) => acc + i.subtotal, 0);

      // Format WhatsApp order message according to requirements
      const itemBlocks = confirmedItems.map((item, idx) => {
        return (
          `${idx + 1}. ${item.name}\n` +
          `   Quantity: ${item.quantity}\n` +
          `   Unit price: ${formatPrice(item.unitPrice)}\n` +
          `   Subtotal: ${formatPrice(item.subtotal)}`
        );
      });

      const message =
        `NEW ORDER – ${STORE_CONFIG.name.toUpperCase()}\n\n` +
        `Hello! I would like to place an order for:\n\n` +
        itemBlocks.join("\n\n") +
        `\n\n-------------------------\n` +
        `TOTAL: ${formatPrice(grandTotal)}\n` +
        `-------------------------\n\n` +
        `Please confirm availability and the next steps. Thank you!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodedMessage}`;

      // Open WhatsApp chat in a new tab/window
      window.open(whatsappUrl, "_blank");

      showToast("WhatsApp opened with your pre-filled order! Press send in WhatsApp.", "info");
    } catch (err) {
      console.error("Checkout error:", err);
      showToast("Could not complete checkout check. Please try again.", "error");
    } finally {
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        renderCart();
      }
    }
  }

  // ── Toast Notifications ───────────────────────────────────────────────────

  function showToast(message, type = "success") {
    const existing = document.getElementById("cart-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "cart-toast";
    toast.className = `cart-toast cart-toast--${type}`;

    let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
    if (type === "error") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === "info") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("cart-toast--visible");
      });
    });

    setTimeout(() => {
      toast.classList.remove("cart-toast--visible");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // ── Drawer Open/Close ─────────────────────────────────────────────────────

  function open() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer) drawer.classList.add("cart-drawer--open");
    if (overlay) overlay.classList.add("cart-overlay--visible");
    document.body.classList.add("no-scroll");
  }

  function close() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer) drawer.classList.remove("cart-drawer--open");
    if (overlay) overlay.classList.remove("cart-overlay--visible");
    document.body.classList.remove("no-scroll");
  }

  // ── Initialization ────────────────────────────────────────────────────────

  function init() {
    load();
    renderCart();
    updateBadge();

    // Event listeners
    const cartBtn = document.getElementById("cart-btn");
    if (cartBtn) cartBtn.addEventListener("click", open);

    const cartCloseBtn = document.getElementById("cart-close");
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", close);

    const overlay = document.getElementById("cart-overlay");
    if (overlay) overlay.addEventListener("click", close);
  }

  return {
    init,
    addItem,
    removeItem,
    setQuantity,
    clear,
    getTotal,
    getTotalItems,
    getItems,
    checkoutViaWhatsApp,
    open,
    close,
    showToast,
  };
})();
