import "./scss/styles.scss";
import $ from "jquery";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

let currentUser = null;
let productData = [];
let cart = [];
window.setProductData = (data) => {
  productData = Array.isArray(data) ? data : [];
};
const isLoggedIn = () => !!(currentUser || auth.currentUser);
const modules = import.meta.glob("./pages/*.js", { eager: true });

const routeList = Object.values(modules).map((mod) => {
  const meta = mod.meta ?? {};
  const id = meta.id;
  return {
    id,
    label: meta.label ?? meta.id,
    order: meta.order ?? 9999,
    parent: meta.parent ?? null,
    render: mod.render,
    init: mod.init,
  };
});

routeList.sort((a, b) => a.order - b.order);

// Convert list → lookup map for fast routing
const routes = {};
routeList.forEach((r) => {
  routes[r.id] = r;
});

// Shared panel helper for facets/nav/etc.
function closePanels({ panelSelector = ".panel", openClass = "open", resetFacetButtons = false, overlaySelectors = [] } = {}) {
  document.querySelectorAll(panelSelector).forEach((panel) => panel.classList.remove(openClass));

  if (resetFacetButtons) {
    document.querySelectorAll(".facet-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
    });
  }

  overlaySelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.classList.remove("active"));
  });
}

function setPanelScrollLock(lock = false) {
  document.body.classList.toggle("panel-open", !!lock);
}

function syncPanelParent(menu, panel) {
  if (!menu || !panel) return;
  const target = isMobileNav() ? document.body : menu;
  if (panel.parentElement !== target) {
    target.appendChild(panel);
  }
}

function blurNavFocus() {
  const active = document.activeElement;
  if (active && active.closest(".topnav") && typeof active.blur === "function") {
    active.blur();
  }
}

function blurMenuLink(selector) {
  const link = document.querySelector(selector);
  if (link && typeof link.blur === "function") {
    link.blur();
  }
}

function showTransientAlert({ title, icon = "success", duration = 1800 }) {
  if (!title) return;

  const containerId = "app-toast-container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "app-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `app-toast ${icon === "error" ? "error" : "success"}`;
  toast.textContent = title;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
      document.querySelectorAll(".overlay").forEach((el) => el.classList.remove("active"));
      document.body.classList.remove("nav-modal-open", "panel-open");
      setPanelScrollLock(false);
    }, 200);
  }, duration);
}

window.closePanels = closePanels;
window.setPanelScrollLock = setPanelScrollLock;

const navOverlay = ensureOverlay();
const isMobileNav = () => window.matchMedia("(max-width: 900px)").matches;

function ensureOverlay() {
  let overlay = document.querySelector(".overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "app-overlay";
    document.body.appendChild(overlay);
  }
  return overlay;
}

function toggleNavOverlay(show) {
  if (!navOverlay) return;
  navOverlay.classList.toggle("active", !!show);
  document.body.classList.toggle("nav-modal-open", !!show);
  setPanelScrollLock(show);
}

function closeAllNavPanels() {
  document.querySelectorAll(".nav-panel").forEach((panel) => {
    const parentMenu = panel.closest("li");
    if (parentMenu) {
      parentMenu.classList.remove("open");
      forceHideNavPanel(parentMenu);
    }
  });
  closePanels({ panelSelector: ".nav-panel", overlaySelectors: [".overlay"] });
  document.body.classList.remove("nav-modal-open");
  setPanelScrollLock(false);
  blurNavFocus();
}

function forceHideNavPanel(menuEl) {
  if (!menuEl) return;
  menuEl.classList.add("closing");
  setTimeout(() => menuEl.classList.remove("closing"), 200);
}

// 5) Build a parent → children map for nav
const childrenByParent = {};
routeList.forEach((route) => {
  if (!route.parent) return; // top-level, no parent
  if (!childrenByParent[route.parent]) {
    childrenByParent[route.parent] = [];
  }
  childrenByParent[route.parent].push(route);
});

// function buildNav() {
//   const $nav = $("#myTopnav");

//   const topLevel = routeList.filter((r) => !r.parent);

//   const html = topLevel
//     .map((route) => {
//       const children = childrenByParent[route.id] || [];

//       if (children.length === 0) {
//         // simple top-level link
//         return `<a href="#${route.id}" class="nav-link">${route.label}</a>`;
//       }

//       // parent with submenu
//       const submenuLinks = children
//         .map(
//           (child) =>
//             `<a href="#${child.id}" class="submenu-link">${child.label}</a>`
//         )
//         .join("");

//       return `
//         <div class="nav-item has-children">
//           <a href="#${route.id}" class="nav-link parent-link">${route.label}</a>
//           <div class="submenu">
//             ${submenuLinks}
//           </div>
//         </div>
//       `;
//     })
//     .join("");

function normalizeRoute(hash) {
  if (!hash) return "home";
  const cleaned = hash.replace(/^#?/, "");
  return cleaned.replace(/^page-/, "") || "home";
}

function changeRoute() {
  const pageID = normalizeRoute(window.location.hash);
  const route = routes[pageID] || routes.home;
  $("#app").html(route.render());

  if (typeof route.init === "function") {
    route.init();
  }
}

function initURLListener() {
  $(window).on("hashchange", changeRoute);
  changeRoute();
}

function initNavToggle() {
  const nav = document.querySelector(".topnav");
  const toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("mobile-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

function initAccountPanel() {
  const panel = document.querySelector(".account-panel");
  const menu = document.querySelector(".account-menu");
  if (!panel) return;
  syncPanelParent(menu, panel);
  const closeBtn = injectNavClose(panel);

  const statusEl = panel.querySelector(".auth-status");
  const submitBtn = panel.querySelector(".auth-submit");
  const signoutBtn = panel.querySelector(".auth-signout");
  const emailInput = panel.querySelector('input[name="email"]');
  const passwordInput = panel.querySelector('input[name="password"]');
  const usernameInput = panel.querySelector('input[name="username"]');

  const radios = panel.querySelectorAll('input[name="authMode"]');
  const applyMode = () => {
    const mode = panel.querySelector('input[name="authMode"]:checked')?.value;
    panel.classList.toggle("mode-login", mode === "login");
    panel.classList.toggle("mode-signup", mode === "signup");
  };

  // Keep panel open while moving between trigger and panel
  let hideTimeout;
  const openPanel = (withOverlay = true) => {
    if (!menu) return;
    document.querySelector(".cart-menu")?.classList.remove("open");
    blurMenuLink(".cart-menu a");
    clearTimeout(hideTimeout);
    menu.classList.add("open");
    panel.classList.add("open");
    refreshLoggedInStatus({ notify: false });
    if (isMobileNav() && withOverlay) {
      toggleNavOverlay(true);
      setPanelScrollLock(true);
    }
  };
  const scheduleHide = () => {
    if (!menu) return;
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      closePanel();
    }, 200);
  };

  const closePanel = () => {
    menu?.classList.remove("open");
    panel.classList.remove("open");
    forceHideNavPanel(menu);
    if (!document.querySelector(".cart-menu.open")) toggleNavOverlay(false);
    clearFields({ clearEmail: false });
    if (!currentUser) {
      setStatus("", false, { notify: false });
    } else {
      refreshLoggedInStatus({ notify: false });
    }
  };

  if (navOverlay) {
    navOverlay.addEventListener("click", () => {
      closeAllNavPanels();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
      closeAllNavPanels();
    });
  }

  if (menu) {
    menu.querySelector("a")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (menu.classList.contains("open")) {
        closePanel();
      } else {
        openPanel();
      }
    });
    menu.addEventListener("mouseenter", () => {
      if (isMobileNav()) return;
      blurMenuLink(".cart-menu a");
      openPanel(false);
    });
    menu.addEventListener("mouseleave", () => {
      if (isMobileNav()) return;
      scheduleHide();
    });
    panel.addEventListener("mouseenter", () => {
      if (isMobileNav()) return;
      clearTimeout(hideTimeout);
    });
    panel.addEventListener("mouseleave", () => {
      if (isMobileNav()) return;
      scheduleHide();
    });
  }

  window.addEventListener("resize", () => {
    syncPanelParent(menu, panel);
    if (isMobileNav()) {
      panel.classList.remove("open");
      menu?.classList.remove("open");
    }
  });

  radios.forEach((radio) => {
    radio.addEventListener("change", applyMode);
  });

  applyMode();

  const setStatus = (msg, isError = false, { notify = true } = {}) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
    const lower = (msg || "").toLowerCase();
    if (notify && msg && !lower.includes("working") && !lower.includes("signing out")) {
      showTransientAlert({
        icon: isError ? "error" : "success",
        title: msg,
        duration: 1800,
      });
    }
  };

  const clearFields = ({ clearEmail = true } = {}) => {
    if (clearEmail && emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (usernameInput) usernameInput.value = "";
  };

  const getMode = () =>
    panel.querySelector('input[name="authMode"]:checked')?.value || "signup";

  const toggleBusy = (busy) => {
    submitBtn.disabled = busy;
    signoutBtn.disabled = busy;
  };

  const refreshLoggedInStatus = ({ notify = true } = {}) => {
    if (currentUser) {
      setStatus(`Logged in as ${currentUser.email}`, false, { notify });
    }
  };

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const mode = getMode();
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value || "";
      const username = usernameInput?.value?.trim();

      if (!email || !password) {
      setStatus("Email and password are required.", true);
      return;
    }

      toggleBusy(true);
      setStatus("Working...");
      try {
        if (mode === "signup") {
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          if (username) {
            await updateProfile(user, { displayName: username });
          }
          currentUser = user;
          setStatus(`Signed up as ${user.email}`);
        } else {
          const { user } = await signInWithEmailAndPassword(auth, email, password);
          currentUser = user;
          setStatus(`Logged in as ${user.email}`);
        }
        refreshCartPanel();
        openPanel();
        clearFields();
      } catch (error) {
        setStatus(error.message || "Authentication failed.", true);
        if (emailInput) {
          emailInput.focus();
          emailInput.select();
        }
        clearFields({ clearEmail: false });
      } finally {
        toggleBusy(false);
      }
    });

    // Allow Enter key to trigger submit
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitBtn.click();
      }
    });
  }

  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      toggleBusy(true);
      setStatus("Signing out...");
      try {
        await signOut(auth);
        setStatus("Signed out.");
        cart = [];
    refreshCartPanel?.();
  } catch (error) {
        setStatus(error.message || "Sign out failed.", true);
      } finally {
        toggleBusy(false);
        clearFields();
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    const isLoggedIn = !!user;
    currentUser = user || null;
    panel.classList.toggle("is-logged-in", isLoggedIn);
    if (submitBtn) submitBtn.style.display = isLoggedIn ? "none" : "block";
    if (signoutBtn) signoutBtn.style.display = isLoggedIn ? "block" : "none";
    [emailInput, passwordInput, usernameInput].forEach((el) => {
      if (el) el.disabled = isLoggedIn;
    });
    clearFields();
    setStatus(isLoggedIn ? `Logged in as ${user.email}` : "", false, { notify: false });
    refreshLoggedInStatus({ notify: false });
    if (!isLoggedIn) {
      cart = [];
      if (typeof window.refreshCartPanel === "function") {
        window.refreshCartPanel();
      }
      // clear any cart status message when logged out
      const cartPanel = document.querySelector(".cart-panel .cart-status");
      if (cartPanel) {
        cartPanel.textContent = "";
        cartPanel.classList.remove("error");
      }
    }
    refreshCartPanel();
  });

  // clear on initial load
  clearFields();
  setStatus("");
}

function initCartPanel() {
  const menu = document.querySelector(".cart-menu");
  const panel = menu?.querySelector(".cart-panel");
  if (!menu || !panel) return;
  syncPanelParent(menu, panel);
  const closeBtn = injectNavClose(panel);

  const statusEl = panel.querySelector(".cart-status");
  const itemsEl = panel.querySelector(".cart-items");
  const clearBtn = panel.querySelector(".cart-clear");

  let hideTimeout;

  const setCartStatus = (msg, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
    const lower = (msg || "").toLowerCase();
    if (msg && !lower.includes("sign out")) {
      showTransientAlert({
        icon: isError ? "error" : "success",
        title: msg,
        duration: 1600,
      });
    }
  };

  const renderCart = () => {
    if (!itemsEl) return;
    if (!cart.length) {
      itemsEl.innerHTML = "<p class='cart-empty'>Your cart is empty.</p>";
      return;
    }

    itemsEl.innerHTML = cart
      .map(
        (item) =>
          `<div class="cart-item">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-color">${item.color ? item.color : ""}</span>
            <span class="cart-item-qty">x${item.qty}</span>
            <span class="cart-item-price">${item.price || ""}</span>
          </div>`
      )
      .join("");
  };

  const openPanel = () => {
    clearTimeout(hideTimeout);
    document.querySelector(".account-menu")?.classList.remove("open");
    blurMenuLink(".account-menu a");
    menu.classList.add("open");
    panel.classList.add("open");
    renderCart();
    if (isMobileNav()) {
      toggleNavOverlay(true);
      setPanelScrollLock(true);
    }
  };

  const scheduleHide = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      closePanel();
    }, 200);
  };

  const closePanel = () => {
    menu.classList.remove("open");
    panel.classList.remove("open");
    forceHideNavPanel(menu);
    if (!document.querySelector(".account-menu.open")) toggleNavOverlay(false);
  };

  if (navOverlay) {
    navOverlay.addEventListener("click", () => {
      closeAllNavPanels();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllNavPanels();
    });
  }

  menu.querySelector("a")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
      panel.classList.remove("open");
      forceHideNavPanel(menu);
      setPanelScrollLock(false);
    } else {
      openPanel();
    }
  });

  menu.addEventListener("mouseenter", () => {
    if (isMobileNav()) return;
    blurMenuLink(".account-menu a");
    openPanel();
  });
  menu.addEventListener("mouseleave", () => {
    if (isMobileNav()) return;
    scheduleHide();
  });
  panel.addEventListener("mouseenter", () => {
    if (isMobileNav()) return;
    clearTimeout(hideTimeout);
  });
  panel.addEventListener("mouseleave", () => {
    if (isMobileNav()) return;
    scheduleHide();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      cart = [];
      renderCart();
      setCartStatus("Cart cleared.");
    });
  }

  window.addToCart = (productIndex, color = "") => {
    if (!isLoggedIn()) {
      setCartStatus("Please log in to add items.", true);
      openPanel(false);
      return;
    }
    const product = productData?.[productIndex];
    if (!product) {
      setCartStatus("Product not found.", true);
      return;
    }
    const price = product.prices?.discounted || product.prices?.original || "";
    const existing = cart.find(
      (item) => item.name === product.name && item.price === price && item.color === color
    );
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        name: product.name,
        price,
        color,
        qty: 1,
      });
    }
    setCartStatus(`Added ${product.name}.`);
    renderCart();
    // Do not auto-open the cart panel after adding an item
  };

  window.refreshCartPanel = renderCart;

  renderCart();

  window.addEventListener("resize", () => {
    syncPanelParent(menu, panel);
    if (isMobileNav()) {
      panel.classList.remove("open");
      menu.classList.remove("open");
    }
  });
}

function injectNavClose(panel) {
  if (!panel) return null;
  let btn = panel.querySelector(".nav-panel-close");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-panel-close";
    btn.setAttribute("aria-label", "Close panel");
    btn.innerHTML = "&times;";
    panel.prepend(btn);
  }
  return btn;
}

$(document).ready(function () {
  // buildNav();
  initURLListener();
  initNavToggle();
  initAccountPanel();
  initCartPanel();
});
