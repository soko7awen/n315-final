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

//   $nav.html(html);
// }

function changeRoute() {
  let pageID = window.location.hash.replace("#", "") || "home";

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

function initAccountPanel() {
  const panel = document.querySelector(".account-panel");
  const menu = document.querySelector(".account-menu");
  if (!panel) return;

  const statusEl = panel.querySelector(".auth-status");
  const submitBtn = panel.querySelector(".auth-submit");
  const signoutBtn = panel.querySelector(".auth-signout");
  const emailInput = panel.querySelector('input[name="email"]');
  const passwordInput = panel.querySelector('input[name="password"]');
  const usernameInput = panel.querySelector('input[name="username"]');
  let currentUser = null;

  const radios = panel.querySelectorAll('input[name="authMode"]');
  const applyMode = () => {
    const mode = panel.querySelector('input[name="authMode"]:checked')?.value;
    panel.classList.toggle("mode-login", mode === "login");
    panel.classList.toggle("mode-signup", mode === "signup");
  };

  // Keep panel open while moving between trigger and panel
  let hideTimeout;
  const openPanel = () => {
    if (!menu) return;
    document.querySelector(".cart-menu")?.classList.remove("open");
    clearTimeout(hideTimeout);
    menu.classList.add("open");
    refreshLoggedInStatus();
  };
  const scheduleHide = () => {
    if (!menu) return;
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      menu.classList.remove("open");
      clearFields();
      if (!currentUser) {
        setStatus("");
      } else {
        refreshLoggedInStatus();
      }
    }, 200);
  };

  if (menu) {
    menu.addEventListener("mouseenter", openPanel);
    menu.addEventListener("mouseleave", scheduleHide);
    panel.addEventListener("mouseenter", openPanel);
    panel.addEventListener("mouseleave", scheduleHide);
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", applyMode);
  });

  applyMode();

  const setStatus = (msg, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
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

  const refreshLoggedInStatus = () => {
    if (currentUser) {
      setStatus(`Logged in as ${currentUser.email}`);
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
    setStatus(isLoggedIn ? `Logged in as ${user.email}` : "");
    refreshLoggedInStatus();
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

  const statusEl = panel.querySelector(".cart-status");
  const itemsEl = panel.querySelector(".cart-items");
  const clearBtn = panel.querySelector(".cart-clear");

  let hideTimeout;

  const setCartStatus = (msg, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
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
    menu.classList.add("open");
    renderCart();
  };

  const scheduleHide = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      menu.classList.remove("open");
    }, 200);
  };

  menu.addEventListener("mouseenter", openPanel);
  menu.addEventListener("mouseleave", scheduleHide);
  panel.addEventListener("mouseenter", openPanel);
  panel.addEventListener("mouseleave", scheduleHide);
  menu.querySelector("a")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
    } else {
      openPanel();
    }
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
      openPanel();
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
    openPanel();
  };

  window.refreshCartPanel = renderCart;

  renderCart();
}

$(document).ready(function () {
  // buildNav();
  initURLListener();
  initAccountPanel();
  initCartPanel();
});
