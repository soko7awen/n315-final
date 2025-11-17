import "./scss/styles.scss";
import $ from "jquery";
const modules = import.meta.glob("./pages/*.js", { eager: true });

const routeList = Object.values(modules).map((mod) => {
  const meta = mod.meta ?? {};
  return {
    id: meta.id,
    label: meta.label ?? meta.id,
    order: meta.order ?? 9999,
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

function buildNav() {
  const $nav = $("#appNav");

  const links = routeList
    .map((route) => {
      return `<a href="#${route.id}" data-page="${route.id}">
                ${route.label}
              </a>`;
    })
    .join(" ");

  $nav.append(links);
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
