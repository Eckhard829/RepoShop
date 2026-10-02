# client - frontend

React 18 + Vite + React Router.

## Layout

    client/
      index.html
      vite.config.js    proxies /api and /download to :3000
      package.json
      src/
        main.jsx        ReactDOM.createRoot + BrowserRouter
        App.jsx         Routes
        api.js          fetch wrapper + brand constants
        styles.css      global styles
        pages/          one component per route
        components/     reusable UI

## Pages

| Route | File | Notes |
|---|---|---|
| / | Home.jsx | Marketing page |
| /about | About.jsx | |
| /contact | Contact.jsx | |
| /login | Auth.jsx (mode="login") | Email/password + Continue with Google |
| /signup | Auth.jsx (mode="signup") | |
| /dashboard | Dashboard.jsx | Purchase state, one-time download, OAuth toast |
| /admin | Admin.jsx | Client list, impersonate, grant, reset |
| * | Home.jsx | Fallback |

## Components

- PillNav      top navigation with pill styling (GSAP)
- DashBar      slim header for dashboard/admin pages
- MagicBento   animated card grid
- ScrollReveal GSAP scroll animation wrapper
- TextType     typewriter effect

## API layer

All HTTP goes through src/api.js:

    import { api, post } from '../api';
    const data = await api('/api/me');           // GET
    const res  = await post('/api/checkout');    // POST

api.js also exports BRAND, PRICE, EMAIL. Change them once, they propagate.

## Dev proxy

vite.config.js:

    server: { proxy: { '/api': 'http://localhost:3000',
                       '/download': 'http://localhost:3000' } }

In development the frontend and backend are on different ports, but the
browser only ever talks to :5173. Vite forwards /api and /download to :3000.

In production Netlify does the equivalent via redirects in netlify.toml.

## OAuth

The Continue with Google button is a plain <a href="/api/auth/google">. It has
to be a full-page navigation because OAuth is a redirect flow, not an XHR.

On success the backend redirects to /dashboard?oauth=ok, which Dashboard.jsx
detects and shows a toast.

## Running

    npm run dev      # vite dev server on :5173
    npm run build    # outputs to dist/
    npm run preview  # preview the production build

Or from the repo root: npm run dev (runs backend + frontend together).

## Adding a page

1. Create src/pages/MyPage.jsx
2. Add a <Route path="/mypage" element={...} /> in App.jsx
3. If it should show the public header, wrap in the Public component
4. If it needs auth, check the session in App.jsx and redirect

## Adding a component

1. Create src/components/MyThing.jsx + MyThing.css
2. Import the CSS from the component file
3. Keep props minimal and typed by convention