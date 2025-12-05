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
