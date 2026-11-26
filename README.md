# Saans — The winter air report

A React and Node.js field guide for families navigating winter air pollution. Compare hourly outdoor US AQI, adapt a household routine and ask a context-aware assistant about a practical decision.

## Run with Docker

From the extracted project directory run:

```sh
docker compose up --build
```

Open http://localhost:3000. Use `docker compose down` to stop. The multi-stage image builds the React client, then runs the Node server as a non-root user. Browser geolocation works on localhost or HTTPS. For a phone accessing a remote deployment, serve the app over HTTPS or select a city manually.

## Run directly

Use Node.js 22 or later.

```sh
npm ci
npm test
npm start
```

The test command also builds the client. After source edits, rebuild and start with `npm run dev`.

## Assistant configuration

The complete demo works without credentials. Set OPENAI_API_KEY in the shell or a local Compose .env file to enable live generation. OPENAI_MODEL optionally selects a different Responses API model. Never include credentials in your submission. Without a key or during a provider failure, the UI labels the deterministic built-in guide. Live air forecasts require outbound access to Open-Meteo. The smog simulation is available offline after the app loads.

## Three-minute judging walkthrough

1. Explore the cover film and the current city estimate. Try location or choose a city.
2. Select **Try smog demo**, choose **Walk or cycle**, and open **On the road**. Compare the current US AQI of 325 with the forecast hour marked 94. The recommendation and impact explanation change.
3. Choose **HEPA purifier**, open **Back at home**, and mark the action done. Play the walkthrough to see the scenes advance.
4. Ask about school pickup or copy the community note. In live mode, select a forecast hour to export a 30-minute calendar entry for the current action.

## Implementation

- src/App.jsx owns the React interface, forecast selection, playback, sharing and calendar export.
- src/planner.js contains the shared action and impact rules.
- src/worker.js implements GET /api/air and POST /api/ask. OpenAI receives a question and household context. Precise coordinates are excluded.
- server.mjs runs the HTTP service on Node.js. build.mjs bundles React with esbuild and packages the assets. The same handler also supports the hosted preview.
- src/media contains the generated editorial imagery and a six-second animated-still hero film.
- planner.test.js covers recommendation thresholds, scenario changes, API input validation, provider parsing, answer fallback and media range responses.

Open-Meteo / CAMS supplies regional modeled values on the US AQI scale. Simulations are labeled. Preferences and checkmarks are stored in the browser. The service does not measure indoor air or estimate personal health outcomes.

## Prompt engineering

See PROMPTS.md for the user brief, design decisions, runtime prompt contract and repeatable evaluation cases.
