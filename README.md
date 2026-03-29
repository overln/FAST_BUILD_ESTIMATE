# FAST_BUILD_ESTIMATE

Minimal front-end residential interior estimate tool built with Vite + React + TypeScript.

## Setup

```bash
npm install
```

## Local development

```bash
npm run dev
```

## Build

```bash
npm run build
```

Build output is generated in the `dist/` folder.

## Deploy to GitHub Pages

1. Create a GitHub repository named `FAST_BUILD_ESTIMATE`.
2. Push this project to the repository.
3. Install dependencies:

```bash
npm install
```

4. Deploy:

```bash
npm run deploy
```

5. In GitHub repository settings, ensure GitHub Pages is configured to serve from the `gh-pages` branch if needed.

## Notes

- `vite.config.ts` uses `base: '/FAST_BUILD_ESTIMATE/'` for GitHub Pages.
- If your repository name changes, update the `base` value in `vite.config.ts`.
