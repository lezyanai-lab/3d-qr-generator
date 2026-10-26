# 3D QR Generator

A free web tool that turns any link, text or Wi‑Fi login into a 3D-printable QR code tag or keychain. Tune the plate size, border, thickness, code height, corner radius and keychain loop, preview it live in 3D, and download STL files ready for your slicer — a single combined model, or separate base and code parts for two-color printing. A flat PNG of the code is also available.

Everything runs in the browser: no account, no credits, nothing uploaded.

## Features

- Link, text or Wi‑Fi QR codes, exported as a two-color 3MF (plus a flat PNG)
- Keychain ring you can move to any side, slide along the edge and bring closer to the code
- Light and dark theme (follows the system, switchable)
- Languages: English, עברית, العربية, Español, Français, Deutsch, Русский (RTL supported)
- Installable as an app (PWA) and works offline after the first visit
- Phone-first layout with a pinned download bar

## Tech

- TanStack Start + React 19, Tailwind CSS 4, shadcn/ui
- [`qrcode`](https://www.npmjs.com/package/qrcode) for the QR matrix
- [three.js](https://threejs.org) for geometry, the live preview and STL export
- Deployed on Netlify and GitHub Pages (`GITHUB_PAGES=true pnpm build` makes the static build)

## Run locally

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.
