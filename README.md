# 3D QR Generator

A free web tool that turns any link, text or Wi‑Fi login into a 3D-printable QR code tag or keychain. Tune the plate size, border, thickness, code height, corner radius and keychain loop, preview it live in 3D, and download STL files ready for your slicer — a single combined model, or separate base and code parts for two-color printing. A flat PNG of the code is also available.

Everything runs in the browser: no account, no credits, nothing uploaded.

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
