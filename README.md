# QA Playground clone

A practice website for learning [Playwright](https://playwright.dev/) with TypeScript. It has **44 exercises in 12 areas**. Each exercise has a brief, a working page, and a solution written as a real Playwright test.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.64-2ead33?logo=playwright&logoColor=white)

> The structure and behavior come from an analysis of <https://playwright-playground.com/> made with [REA](https://github.com/morluto/rea). The lesson text, briefs, solutions, styles, and backend are written again in own words. This project is not affiliated with the original site, with Playwright, or with Microsoft.

## Contents

- [Quick start](#quick-start)
- [Exercises](#exercises)
- [How to use an exercise](#how-to-use-an-exercise)
- [Run the solution tests](#run-the-solution-tests)
- [Mock API](#mock-api)
- [Project layout](#project-layout)
- [Scripts](#scripts)
- [Known differences from the original](#known-differences-from-the-original)

## Quick start

Requirements:

- Node.js and npm.
- Google Chrome installed on the machine. The tests use it through `channel: "chrome"`, so no browser download is needed.

```bash
git clone https://github.com/kawsar-95/playwright-playground-clone.git
cd playwright-playground-clone
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. The dev server also serves the mock API under `/api`.

If you do not have Chrome, run `npx playwright install chromium`. Then change `channel: "chrome"` in [playwright.config.ts](playwright.config.ts).

## Exercises

| Area | Exercises | What you practice |
|---|---|---|
| Basic Elements | 6 | Click, type, check, select, and hover |
| Locators | 1 | Target one element when names repeat and no test ids exist |
| Dynamic Elements | 6 | Late elements, changing text, actionability, flaky timing, fake clocks |
| Forms | 6 | Login, validation, autocomplete, upload, download, multi-step form |
| Authentication | 1 | Real sessions, Remember me, signing in once for many tests |
| Tables | 4 | Read cells, prove sort order, row actions, paginated grid |
| Dialogs & Windows | 3 | Native dialogs, modals, popups, new tabs and windows |
| Frames | 3 | iframes, nested and duplicate frames, embedded widgets |
| Mouse & Keyboard | 3 | Keyboard input, drag and drop, advanced mouse actions |
| Content & Attributes | 5 | Text, attributes vs properties, ARIA, shadow DOM, page audit |
| Network & API | 3 | Watch traffic, test the API directly, mock responses |
| Debugging & Tracing | 3 | Read failures, find a bug in a trace, debugging tools |

Each exercise has a level: beginner, intermediate, or advanced. The full list is in [src/nav.ts](src/nav.ts).

## How to use an exercise

1. Start the app with `npm run dev`.
2. Open an exercise in the sidebar and read the brief.
3. Write your own Playwright test for the page.
4. Open the **Solution** panel to compare. It shows the same file as `e2e/<area>/<exercise>.spec.ts`.

Some exercises need a desktop browser (hover, keyboard, drag and drop, mouse). The site marks them.

## Run the solution tests

The tests need a running server.

```bash
npm run dev &                                    # start the server
npm test                                         # run all solutions
npx playwright test e2e/basic                    # run one area
npx playwright test e2e/forms/login.spec.ts      # run one file
BASE_URL=http://127.0.0.1:4173 npx playwright test   # test the production build
```

To test the production build, run `npm run build` and `npm run preview` first.

A failed test keeps a trace. Open it with `npx playwright show-trace <path-to-trace.zip>`.

## Mock API

The backend is a Vite middleware in [server/api.ts](server/api.ts). It runs under `/api` in both `dev` and `preview`.

- Data is kept in memory for each server process.
- All visitors share one data set.
- Call `POST /api/reset` to restore the seed users.

The Network & API exercises use this backend.

## Project layout

| Path | Content |
|---|---|
| [src/nav.ts](src/nav.ts) | Areas, exercises, difficulty, redirects |
| [src/Layout.tsx](src/Layout.tsx), [src/Home.tsx](src/Home.tsx) | Shell, sidebar, brief and solution panel, home page |
| `src/pages/<area>/` | One component for each exercise, plus its brief |
| [server/api.ts](server/api.ts) | Mock backend (Vite middleware under `/api`) |
| `public/embeds/`, `public/popups/` | Static pages for the iframe and popup exercises |
| `e2e/` | Playwright specs. They are the solutions |

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start the dev server at `http://127.0.0.1:5173` |
| `npm run build` | Type check and build for production |
| `npm run preview` | Serve the build at `http://127.0.0.1:4173` |
| `npm run typecheck` | Type check only |
| `npm test` | Run the Playwright solutions |

## Known differences from the original

- The original gives each visitor private API data. This backend shares one data set for the whole server process.
- The static pages in `public/embeds/` and `public/popups/`, the cities list, some API error messages, and the sample download file are written from observed behavior. Some wording differs.
- Styles are written again. The layout and colors are close, but not pixel-identical.
