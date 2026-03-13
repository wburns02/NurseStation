# NurseStation

A React-based front-end application for nurse station management and workflows.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18+ with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Routing | React Router DOM |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Separate API server at `~/nursestation-api` |

## Project Structure

```
NurseStation/
├── index.html              # Vite entry HTML
├── vite.config.ts          # Vite + Tailwind plugin config
├── package.json            # Dependencies and scripts
├── tsconfig.json           # Base TypeScript config
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node/build TS config
├── eslint.config.js        # ESLint flat config
├── public/                 # Static assets (served as-is)
├── src/
│   ├── main.tsx            # App entry point
│   ├── App.tsx             # Root component with routing
│   ├── index.css           # Global styles / Tailwind imports
│   ├── vite-env.d.ts       # Vite type declarations
│   └── assets/             # Images, SVGs, and other bundled assets
└── README.md
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (default: http://localhost:5173)
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npx eslint .

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture Notes

- **Routing**: React Router DOM handles client-side routing. All routes are defined in `App.tsx`.
- **Styling**: Tailwind CSS v4 with the Vite plugin — no `tailwind.config.js` needed. Styles are configured via CSS (`@theme` directives in `index.css`).
- **Animations**: Framer Motion is used for page transitions and UI animations.
- **State Management**: Local React state (useState/useReducer). No external state library.
- **API Layer**: Backend lives in `~/nursestation-api` (separate repo/project). API calls go to that server.
- **No SSR**: This is a pure SPA served by Vite.

## Backend

The API server is a separate project located at:
```
~/nursestation-api
```
Refer to that directory for backend setup, endpoints, and database configuration.

## Production Deployment

- **URL**: https://nursestation-production.up.railway.app
- **Build**: `npm run build` outputs to `dist/`
- **Deploy**: Push to GitHub; deployment pipeline TBD

## Development Rules

### Commit & Push Policy
- **ALWAYS push to GitHub** after every commit — no exceptions.
- Never leave commits sitting locally.

### Playwright Verification (HARD RULE)
- **ALWAYS test with Playwright** after making changes to verify features work in the browser.
- If Playwright shows something is broken:
  1. Build a plan to fix it
  2. Execute the fix
  3. Test again with Playwright
  4. If still broken, repeat — **up to 30 iterations max**
- **Never claim success without Playwright verification.**

### Storage Policy
- **NEVER store large files (PDFs, datasets, models, images, videos, archives) on the home drive.**
- Home drive (`/home/will/`, `/dev/sda3`) is 110G — code and configs only.
- Large data goes to `/mnt/win11/Fedora/` (504G) or `/dataPool/`.
- Before downloading or generating >100MB, confirm the target is NOT on `/home/will/`.

### Code Quality
- Keep TypeScript strict — no `any` types without justification.
- Use Tailwind utility classes; avoid inline styles.
- Prefer named exports for components.
- Keep components small and focused — extract when logic gets complex.
