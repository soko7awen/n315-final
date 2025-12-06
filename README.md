# N315 Final – Keurig Recreation

Live build: [Web4 Deployment](https://in-info-web4.luddy.indianapolis.iu.edu/~hhamelin/Y4/FA25/N315/final)

## Overview
Single-page, Keurig website recreation built with Vite. The page mirrors the reference design with hero/banner, product grid, responsive navigation, cart, and account access. Product data is loaded from local JSON; Firebase Authentication powers sign up/log in/log out.

## Features
- Firebase Auth: create account, log in, and log out directly from the top-right account panel; includes inline status/error feedback.
- Shopping cart: badge count in the header, “Buy Now” buttons add items, cart drawer lists selections with quantities/colors, and an “Empty Cart” control clears everything.
- Product grid: 10+ coffee makers sourced from `public/data/products.json`, with badges, pricing, color selectors, ratings, coupons, and starter-kit pricing callouts.
- Navigation: SPA-style routing using page modules under `src/pages`, hash-based URLs, and injected views for smooth one-page navigation.
- Responsive UI: grid, navigation, and panels adapt for mobile and tablet; overlay/panel patterns mirror the reference site.
- Alerts/feedback: lightweight toast/alert states for cart and auth actions (see `showTransientAlert` in `src/main.js`).

## Project Structure
- `src/pages`: view modules for Home, Products, About, Contact, Teams.
- `public/data/products.json`: product catalog used to render the grid/cart.
- `src/firebase.js`: Firebase initialization (Auth + Firestore placeholder).
- `src/scss`: base styles and component styles; compiled via Vite + Sass.

## Local Setup
1) Install deps: `npm install`  
2) Create `.env.local` with your Firebase project values:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
3) Run locally: `npm run dev` (Vite dev server)  
4) Build for Web4/GitHub Pages: `npm run build:web4` (sets correct base path) or `npm run build` for default.

## Usage Notes
- Auth state drives UI: when logged out, cart is cleared; when logged in, the account panel hides the submit CTA and shows a sign-out button.
- Cart badge and drawer stay in sync with the JSON-loaded products and selected color options.
- Data is in-memory/local; refreshing the page resets cart items and ephemeral state (per assignment requirements).
