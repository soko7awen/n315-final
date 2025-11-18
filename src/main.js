import "./scss/styles.scss";
import $ from "jquery";
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

function buildNav() {
  const $nav = $("nav"); // assume <nav></nav> in index.html

  const topLevel = routeList.filter((r) => !r.parent);

  const html = topLevel
    .map((route) => {
      const children = childrenByParent[route.id] || [];

      if (children.length === 0) {
        // simple top-level link
        return `<a href="#${route.id}" class="nav-link">${route.label}</a>`;
      }

      // parent with submenu
      const submenuLinks = children
        .map(
          (child) =>
            `<a href="#${child.id}" class="submenu-link">${child.label}</a>`
        )
        .join("");

      return `
        <div class="nav-item has-children">
          <a href="#${route.id}" class="nav-link parent-link">${route.label}</a>
          <div class="submenu">
            ${submenuLinks}
          </div>
        </div>
      `;
    })
    .join("");

  $nav.html(html);
}

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

$(document).ready(function () {
  buildNav();
  initURLListener();
});
