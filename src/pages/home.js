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
  prepareDropdowns()
  renderProducts()
}

function prepareDropdowns() {
  const facets = document.querySelectorAll('.facet');

  facets.forEach(facet => {
    const btn = facet.querySelector('.facet-btn');
    const panel = facet.querySelector('.facet-panel');

    facet.addEventListener('mouseenter', () => {
      document.querySelectorAll('.facet-panel').forEach(p => p.classList.remove('open'));
      document.querySelectorAll('.facet-btn').forEach(b => b.classList.remove('active'));

      panel.classList.add('open');
      btn.classList.add('active');
    });

    facet.addEventListener('mouseleave', () => {
      panel.classList.remove('open');
      btn.classList.remove('active');
    });
  });
}

async function renderProducts() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;

  try {
    const response = await fetch('/data/products.json');
    if (!response.ok) throw new Error('Unable to load products');

    const products = await response.json();
    grid.innerHTML = products.map(createProductCard).join('');
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
            `<button tabindex="0" role="button" aria-label="${color}" class="${
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
        <button class="buy-button">BUY NOW</button>
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
