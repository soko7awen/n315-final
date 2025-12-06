import $ from "jquery";
import html from "./home.htm?raw"

export const meta = {
  order: 1,
  id: "home",
  label: "Home",
};

export function render() {
  return `<main id="content" class="${meta.id}">${html}</main>`
}

export function init() {
  initFacets()
  renderProducts()
}

function initFacets() {
  const facetSections = document.querySelectorAll('.facet');
  const isMobileView = () => window.matchMedia('(max-width: 900px)').matches;
  const overlay = ensureSharedOverlay();

  const closeAllPanels = () => {
    if (typeof window.closePanels === 'function') {
      window.closePanels({
        resetFacetButtons: true,
        overlaySelectors: ['.overlay'],
      });
      if (typeof window.setPanelScrollLock === 'function') {
        window.setPanelScrollLock(false);
      }
      return;
    }
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('open'));
    document.querySelectorAll('.facet-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-expanded', 'false');
    });
    if (overlay) overlay.classList.remove('active');
    if (typeof window.setPanelScrollLock === 'function') {
      window.setPanelScrollLock(false);
    }
  };

  facetSections.forEach((facet) => {
    const trigger = facet.querySelector('.facet-btn');
    const panel = facet.querySelector('.facet-panel');
    if (!trigger || !panel) return;
    const closeBtn = injectPanelClose(panel, closeAllPanels);

    facet.addEventListener('mouseenter', () => {
      if (isMobileView()) return;
      closeAllPanels();
      panel.classList.add('open');
      trigger.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
    });

    facet.addEventListener('mouseleave', () => {
      if (isMobileView()) return;
      panel.classList.remove('open');
      trigger.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    });

    trigger.addEventListener('click', (event) => {
      if (!isMobileView()) return;
      event.preventDefault();
      const alreadyOpen = panel.classList.contains('open');
      closeAllPanels();
      if (!alreadyOpen) {
        panel.classList.add('open');
        trigger.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        if (overlay) overlay.classList.add('active');
        if (typeof window.setPanelScrollLock === 'function') {
          window.setPanelScrollLock(true);
        }
      }
    });

    closeBtn?.addEventListener('click', () => {
      trigger.focus({ preventScroll: true });
    });
  });

  if (overlay) {
    overlay.addEventListener('click', closeAllPanels);
  }

  window.addEventListener('resize', closeAllPanels);
}

function ensurePanelOverlay() {
  console.warn('ensurePanelOverlay is deprecated; use ensureSharedOverlay instead.');
  return ensureSharedOverlay();
}

function ensureSharedOverlay() {
  let overlay = document.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'app-overlay';
    document.body.appendChild(overlay);
  }
  return overlay;
}

function injectPanelClose(panel, onClose) {
  const container = panel.querySelector('.facet-panel-contents');
  if (!container) return null;
  let closeBtn = panel.querySelector('.facet-close');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'facet-close';
    closeBtn.setAttribute('aria-label', 'Close filters');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onClose();
      if (typeof window.setPanelScrollLock === 'function') {
        window.setPanelScrollLock(false);
      }
    });
    container.prepend(closeBtn);
  }
  return closeBtn;
}

async function renderProducts() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;

  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) throw new Error('Unable to load products');

    const products = await response.json();
    window.productData = products;
    if (typeof window.setProductData === 'function') {
      window.setProductData(products);
    }
    grid.innerHTML = products.map(createProductCard).join('');
    attachColorOptionHandlers();
    attachAddToCartHandlers();
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p class="error">Unable to load products right now.</p>`;
  }
}

function createProductCard(product, index) {
  const badgeClass = product.badgeType ? `product-badge badge-${product.badgeType}` : 'product-badge';
  const badge = product.badge ? `<div class="${badgeClass}">${product.badge}</div>` : '';

  const colorButtons = Array.isArray(product.colors)
    ? product.colors
        .map(
          (color, colorIndex) =>
            `<button tabindex="0" role="button" aria-label="${color}" data-color="${color}" class="${
              colorIndex === 0 ? 'selected ' : ''
            }color-option"><span class="color-option-fill" style="background-color: ${color};"></span></button>`
        )
        .join('')
    : '';

  const pricing = buildPricing(product);
  const coupon = product.coupon
    ? `<span class="coupon">
        <span class="coupon-label">Coupon</span>
        <span class="coupon-main-text">
          <span class="coupon-code">${product.coupon.code}</span><br>
          <span class="coupon-note">${product.coupon.note ?? ''}</span>
        </span>
      </span>`
    : '';

  const rating = product.rating
    ? `<div class="rating">
        <div class="stars-background">
          <div class="stars-fill" style="width: ${Math.min(Math.max(product.rating.value ?? 0, 0), 5) * 20}%;"></div>
        </div>
        <span class="rating-value">${product.rating.value?.toFixed(1) ?? ''}</span>
        <span class="rating-count">| (${product.rating.count ?? 0})</span>
      </div>`
    : '';

  const freeShipping = product.freeShipping
    ? `<div class="free-shipping">
        <img class="text-icon" src="./img/free-shipping.svg" alt="">
        <span>Free shipping</span>
      </div>`
    : '';

  const compareId = `compare-${index}`;

  return `<div class="product-card">
    ${badge}
    <div class="product-image-container">
      <img src="${product.image}" alt="${product.name}" class="product-image">
    </div>

    <div class="product-info">
      <div class="color-selector">
        ${colorButtons}
      </div>

      <h3 class="product-name">${product.name}</h3>

      ${pricing}

      ${coupon}

      ${rating}

      ${freeShipping}

      <div class="compare">
        <input type="checkbox" id="${compareId}" class="compare-checkbox">
        <label for="${compareId}" class="compare-label">Compare</label>
      </div>

      <div class="card-bottom-content">
        <button class="buy-button" data-product-index="${index}">Add to Cart</button>
      </div>
    </div>
  </div>`;
}

function buildPricing(product) {
  const prices = product.prices || {};
  const rows = [];

  if (prices.discounted || prices.original) {
    rows.push(`<div class="pricing">
      <div class="price-split">
        ${prices.discounted ? `<span class="price discounted-price">${formatPrice(prices.discounted)}</span>` : ''}
        ${prices.original ? `<span class="price original-price">$${prices.original}</span>` : ''}
      </div>
      ${product.starterKitNote ? `<div class="price-note">${product.starterKitNote}</div>` : ''}
    </div>`);
  }

  if (prices.starterKitPrice) {
    rows.push(`<div class="pricing">
      <div class="price normal-price">${formatPrice(prices.starterKitPrice)}</div>
    </div>`);
  }

  return rows.join('');
}

function formatPrice(value) {
  if (!value) return '';
  const [dollars, cents = '00'] = String(value).split('.');
  return `<sup>$</sup>${dollars}<sup>${cents.padEnd(2, '0').slice(0, 2)}</sup>`;
}

function attachColorOptionHandlers() {
  document.querySelectorAll('.product-card').forEach((card) => {
    const options = card.querySelectorAll('.color-option');
    options.forEach((btn) => {
      btn.addEventListener('click', () => {
        options.forEach((o) => o.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  });
}

function attachAddToCartHandlers() {
  document.querySelectorAll('.buy-button[data-product-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-product-index'));
      if (Number.isNaN(idx)) return;
      const card = btn.closest('.product-card');
      const selectedColor = card?.querySelector('.color-option.selected')?.getAttribute('data-color') || "";
      if (typeof window.addToCart === 'function') {
        window.addToCart(idx, selectedColor);
      }
    });
  });
}
