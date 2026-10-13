# QA Playground clone

A practice site for Playwright with TypeScript. It has 44 exercises in 12 areas: basic elements, locators, dynamic elements, forms, authentication, tables, dialogs, frames, mouse and keyboard, content, network and debugging.

The structure and behavior come from an analysis of https://playwright-playground.com/ made with [REA](https://github.com/morluto/rea). The lesson text, briefs, solutions, styles and the backend are written again in own words. The site is not affiliated with the original, with Playwright or with Microsoft.

## Run

```bash
npm install
npm run dev          # http://127.0.0.1:5173, includes the mock API under /api
npm run build        # type check and production build
npm run preview      # http://127.0.0.1:4173
```

## Test

Every exercise has a solution. The solution is a real Playwright test in `e2e/<area>/<exercise>.spec.ts`, and the site shows the same file in the Solution panel.

```bash
npm run dev &                 # the tests need a running server
npm test                      # uses the Chrome that is installed on the machine
BASE_URL=http://127.0.0.1:4173 npx playwright test e2e/basic
```

## Layout

| Path | Content |
|---|---|
| `src/nav.ts` | Areas, exercises, difficulty, redirects |
| `src/Layout.tsx`, `src/Home.tsx` | Shell, sidebar, brief and solution panel, home page |
| `src/pages/<area>/` | One component for each exercise, plus its brief |
| `server/api.ts` | Mock backend (Vite middleware under `/api`). Data is kept in memory for each server process |
| `public/embeds/`, `public/popups/` | Static pages for the iframe and popup exercises |
| `e2e/` | Playwright specs. They are the solutions |

## Known differences from the original

- The original gives each visitor private API data. This backend shares one data set for the whole server process. Call `POST /api/reset` to restore the seed users.
- The static pages in `public/embeds/` and `public/popups/`, the cities list, some API error messages and the sample download file are written from observed behavior, so some wording differs.
- Styles are written again. The layout and colors are close, but not pixel-identical.
