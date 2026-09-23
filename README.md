# Meowdoku solver

A static, browser-only screenshot solver. Choose an untouched screenshot, click **Solve**, and place cats in the circles. Photos stay on the device.

## Run locally

With Node.js installed, run `npm start` from this folder and open <http://127.0.0.1:4173>. No dependency installation is needed to run the app. Stop the server with Ctrl+C.

## Tests

Run `npm install` to install development dependencies. With the local server running in another terminal, run `npm test`. Browser tests use installed Microsoft Edge in headless mode. Tests cover both real input screenshots, the first board's known solution, game constraints, malformed input, image replacement, and desktop/phone-sized layouts. Generated browser screenshots are saved in the ignored `test-results/` directory.

During initial development, tests were run with the bundled Codex Node packages through `NODE_PATH`, without installing dependencies into this project.

## Implementation

- `app.js`: local file selection, preview, worker lifecycle, and solution overlay.
- `detector.js`: find colored square components separated by gutters, identify a regular 5–11 cell square lattice, and sample/group cell colors.
- `solver.js`: lexicographic permutation enumeration, ported from the original Python approach, checking adjacency and color uniqueness.
- `worker.js`: run detection and solving outside the UI thread.
- `screenshots/`: two untouched input fixtures plus partial/completed reference images.

Detection is validated on the two supplied 8×8 boards. Other sizes are supported by the detector's geometry search but still need real screenshot validation. Existing marks and celebration overlays are not supported inputs. No manual correction controls or worst-case performance optimizations are included yet.

## GitHub Pages

The runtime uses only HTML, CSS, JavaScript, and relative asset URLs. The Pages workflow deploys the six runtime files on pushes to `main`; there is no build step or backend. `server.mjs` is only a local development server and listens on the local network for phone testing.

Live site: <https://www.nan.ma/meowdoku-solver/> (uses the GitHub account's existing Pages custom domain).

The initial MVP was also tested end to end on an iPhone over home Wi-Fi. The user reported a new 10×10 level solved in less than one second.

See [REQUIREMENTS.md](REQUIREMENTS.md) for agreed scope and acceptance criteria.
