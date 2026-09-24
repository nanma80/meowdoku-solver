# Meowdoku solver

A static, browser-only screenshot solver. Choose an untouched screenshot, click **Solve**, and place cats in the circles. Photos stay on the device.

## Run locally

With Node.js installed, run `npm start` from this folder and open <http://127.0.0.1:4173>. No dependency installation is needed to run the app. Stop the server with Ctrl+C.

The development server defaults to this computer only. To temporarily test over home Wi-Fi in PowerShell, run `$env:HOST='0.0.0.0'; npm start`, then open the computer's Wi-Fi IP on port 4173 from your phone. Stop the server afterward and run `Remove-Item Env:HOST` to restore the default for future runs.

## Tests

Run `npm install` to install development dependencies, then `npm test`. Browser tests use installed Microsoft Edge in headless mode. They start their own loopback-only server on an available port and stop it afterward. Tests cover both real input screenshots, known solutions, game constraints, permutation exhaustion, malformed input, image replacement, and desktop/phone-sized layouts. Generated browser screenshots are saved in the ignored `test-results/` directory.

Use `npm run format` to format source and documentation, or `npm run format:check` to check formatting without changing files. Prettier's settings are in `.prettierrc.json`.

During initial development, tests were run with the bundled Codex Node packages through `NODE_PATH`, without installing dependencies into this project.

## Implementation

```text
index.html                 Page structure
styles/app.css             Responsive appearance
src/
  app.js                   UI events, preview state, and worker lifecycle
  image.js                 Local image decoding and detection-size sampling
  overlay.js               Solution circles on the original screenshot
  solver.js                Permutation search and game constraints
  solver-worker.js         Detection and solving outside the UI thread
  detection/
    board.js               Coordinate the detection pipeline
    cells.js               Flood fill to find candidate colored cells
    grid.js                Match cells to a regular square grid
    colors.js              Sample backgrounds and assign color IDs
scripts/server.mjs         Local static development server
tests/                     Solver, detection, and browser tests
screenshots/               Input fixtures and completed-board references
```

Start reading at `src/app.js` for the UI flow, `src/detection/board.js` for image interpretation, or `src/solver.js` for the search algorithm. Only module entry points are exported; helper functions remain private to their module.

The worker receives image pixels and returns a board plus an array of zero-based cat columns. A board contains `size`, `colors` (the region-ID matrix), `palette` (RGB colors), and `cells` (a matrix of `{ x, y, width, height }`). Cell centers and dimensions are in detection-image pixels. The overlay converts them back into original-image coordinates using the sampling scale.

Detection supports 5×5 through 12×12 and is validated on the two supplied 8×8 boards and the 12×12 daily puzzle in `screenshots/12x12.png`. Other sizes still need real screenshot validation. Existing marks and celebration overlays are not supported inputs. No manual correction controls or worst-case performance optimizations are included yet.

## GitHub Pages

The runtime uses only HTML, CSS, JavaScript, and relative asset URLs. The Pages workflow deploys `index.html`, `src/`, and `styles/` on pushes to `main`; there is no build step or backend. The development server, tests, and fixture screenshots are not included in the deployed site.

Live site: <https://www.nan.ma/meowdoku-solver/> (uses the GitHub account's existing Pages custom domain).

The initial MVP was also tested end to end on an iPhone over home Wi-Fi. The user reported a new 10×10 level solved in less than one second.

See [REQUIREMENTS.md](REQUIREMENTS.md) for agreed scope and acceptance criteria.
