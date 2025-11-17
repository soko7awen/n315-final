# Add Buttons

A modular, hash-routed demo application built with Vite, jQuery, and SCSS. It showcases a lightweight client-side routing pattern using `import.meta.glob` for automatic page discovery plus a consistent button interaction style.

## 📋 Overview

This project (N423 – Fall 2025) demonstrates how to:

- Auto-load page modules placed in `src/pages/`.
- Generate navigation from each page module's exported `meta` object.
- Render and initialize pages using a simple `render()` and `init()` API.
- Apply reusable interaction patterns (e.g. `.btn` class) styled with SCSS.

Ideal for learning modern tooling (Vite) while keeping the JavaScript patterns explicit and framework-agnostic.

## 🚀 Key Features

- **Auto Page Discovery**: Uses `import.meta.glob('./pages/*.js', { eager: true })`.
- **Meta-Driven Navigation**: Page order, labels, and IDs stored in code—not duplicated in HTML.
- **Hash Routing**: Changes to `window.location.hash` swap views without a full page reload.
- **Declarative Button Interactions**: Each page wires up its own event handlers in `init()`.
- **SCSS Architecture**: Base structural resets + component utility classes.
- **Fast Dev Environment**: Vite dev server with HMR.

## 🛠️ Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Build | Vite | Dev server + bundling |
| DOM   | jQuery | Concise selection & events |
| Styles | SCSS | Nested rules & reuse |

Versions are managed in `package.json`.

## 📁 Project Structure

```
addButtons/
├── index.html                # Root HTML shell (empty nav + app mount)
├── package.json              # Dependencies & scripts
├── vite.config.js            # Vite configuration (base path, etc.)
├── public/                   # Static assets (served as-is)
└── src/
      ├── main.js               # App bootstrap: routing + nav build
      ├── pages/                # Individual page modules
      │   ├── home.js
      │   ├── about.js
      │   ├── contact.js
      │   └── products.js
      └── scss/
            ├── styles.scss       # Entry SCSS that @use's partials
            └── structure.scss    # Resets, layout primitives, component classes
```

## 🔄 Dynamic Routing Flow

1. **Discovery**:
    ```js
    const modules = import.meta.glob('./pages/*.js', { eager: true });
    ```
    Vite expands this at build time, returning an object of loaded modules.

2. **Normalization**: Each module's `meta` is read to build a `routeList`:
    ```js
    const routeList = Object.values(modules).map((mod) => {
       const meta = mod.meta ?? {};
       return {
          id: meta.id,
          label: meta.label ?? meta.id,
          order: meta.order ?? 9999,
          render: mod.render,
          init: mod.init,
       };
    }).sort((a,b) => a.order - b.order);
    ```

3. **Lookup Map** for fast access:
    ```js
    const routes = {};
    routeList.forEach(r => { routes[r.id] = r; });
    ```

4. **Navigation Build** (DOM injection):
    ```js
    function buildNav() {
       const links = routeList.map(r => `<a href="#${r.id}" data-page="${r.id}">${r.label}</a>`).join(' ');
       $('#appNav').append(links);
    }
    ```

5. **Hash Change Handler**:
    ```js
    function changeRoute() {
       const pageID = window.location.hash.replace('#', '') || 'home';
       const route = routes[pageID] || routes.home;
       $('#app').html(route.render());
       if (typeof route.init === 'function') route.init();
    }
    $(window).on('hashchange', changeRoute);
    ```

## 📦 Page Module API

Each file in `src/pages/` exports:

```js
export const meta = {
   order: 1,       // Numeric order for nav
   id: 'home',     // Hash fragment + lookup key
   label: 'Home',  // Text shown in navigation
};

export function render() {
   return `<h1>Welcome</h1><div id="clickMe" class="btn">Click Me</div>`;
}

export function init() {
   $('#clickMe').on('click', () => alert('Button clicked on Home page!'));
}
```

### Lifecycle Notes
- `render()` returns an HTML string; no side effects.
- `init()` runs after the HTML is injected, safe to bind events.
- `meta.order` drives nav ordering; leaving large defaults (e.g. `9999`) pushes items to end.

## ➕ Adding a New Page

1. Create `src/pages/faq.js`.
2. Export `meta`, `render`, (optional) `init`.
3. Visit `#/faq` (or click its auto-generated link) — no manual imports required.

Example:
```js
export const meta = { order: 5, id: 'faq', label: 'FAQ' };
export function render() {
   return `<h1>FAQ</h1><div class="btn" id="ask">Ask</div>`;
}
export function init() {
   $('#ask').on('click', () => alert('FAQ action'));
}
```

## 🔘 Button Interaction Pattern

Reusable styling is applied via the `.btn` class (defined in `structure.scss`):

```scss
.btn {
   display: inline-block;
   padding: 10px 20px;
   background-color: #007bff;
   color: #fff;
   border-radius: 4px;
   cursor: pointer;
   transition: background-color .3s ease;
   &:hover { background-color: #0056b3; }
}
```

Behavior is attached in each page's `init()` function using jQuery selectors so HTML stays declarative.

## 🎨 Styling Architecture

- `structure.scss` contains global resets, layout primitives, navigation styles, and shared component classes like `.btn`.
- `styles.scss` simply `@use`'s `structure` (expandable for future partials/components).
- Nesting kept shallow to maintain clarity; consider extracting future elements (e.g. cards, forms) into separate partials.

## 🧪 Running Locally

```bash
npm install
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`). Hash changes (`#/about`) switch pages instantly.

## 📦 Building & Previewing

```bash
npm run build
npm run preview
```
Artifacts land in `dist/` (served by Vite preview for validation).

## 🛠 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Page not showing | Missing `meta.id` | Add `id` to `meta` object |
| Nav label wrong | `label` omitted | Provide `label` or accept `id` fallback |
| Button handler not firing | Event bound before DOM exists | Ensure code in `init()` not `render()` |
| 404 asset paths after deploy | Incorrect `base` config | Adjust `base` in `vite.config.js` |

## 💡 Future Improvements (Ideas)

- Accessibility enhancements (focus states, ARIA landmarks).
- Centralized page registry tests.
- Active link highlighting & keyboard navigation.
- Theming system (light/dark via CSS variables).
- Transition animations between pages.

## 🤝 Contributing

Educational scope, but PRs / forks for experimentation are welcome. Keep modules self-contained and avoid implicit global state.

## 📄 License

Educational use for N423 coursework (Fall 2025).

## 👤 Author

N423 – Fall 2025

---

**Note**: Requires a modern ES module-capable browser.

# Add Buttons

A modern web application built with Vite, jQuery, and SCSS for dynamic button interactions.

## 📋 Project Overview

This project is a lightweight web application that demonstrates interactive button functionality. Built as part of the N423 coursework (Fall 2025), it serves as a foundation for learning modern web development workflows with Vite bundling, jQuery DOM manipulation, and SCSS styling.

## 🚀 Features

- **Modern Build System**: Powered by Vite for fast development and optimized production builds
- **jQuery Integration**: Simplified DOM manipulation and event handling
- **SCSS Styling**: Modular and maintainable stylesheets with SCSS
- **Responsive Design**: Mobile-first approach with proper viewport configuration
- **Hot Module Replacement**: Instant updates during development

## 🛠️ Technologies

- **[Vite](https://vitejs.dev/)** (v7.2.2) - Next-generation frontend tooling
- **[jQuery](https://jquery.com/)** (v3.7.1) - Fast, small, and feature-rich JavaScript library
- **[SCSS](https://sass-lang.com/)** (v1.94.0) - CSS preprocessor with superpowers

## 📁 Project Structure

```
addButtons/
├── index.html           # Main HTML entry point
├── package.json         # Project dependencies and scripts
├── vite.config.js       # Vite configuration
├── public/              # Static assets
└── src/
    ├── main.js          # JavaScript entry point
    └── scss/
        ├── styles.scss      # Main stylesheet
        └── structure.scss   # Base structural styles
```

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository or navigate to the project directory:
   ```bash
   cd addButtons
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build

Create a production-ready build:

```bash
npm run build
```

The optimized files will be generated in the `dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the project for production |
| `npm run preview` | Previews the production build locally |

## 🎨 Styling

The project uses SCSS for styling with a modular approach:

- **structure.scss**: Contains base CSS resets and structural styles
- **styles.scss**: Main stylesheet that imports other SCSS modules

All styles are automatically compiled by Vite during development and build processes.

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment with your own implementations.

## 📄 License

This project is created for educational purposes as part of the N423 course curriculum.

## 👤 Author

Created for N423 - Fall 2025

---

**Note**: This project uses Vite's modern build system with ES modules. Make sure your browser supports modern JavaScript features for the best experience.