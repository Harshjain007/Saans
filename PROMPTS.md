# Prompt-to-product record

Built with ChatGPT. The following abridged brief captures the successive user requests.

1. Help families and communities navigate severe winter smog with location-aware daily routines, indoor air guidance and explanations of each choice’s impact.
2. Show people in a fresh breeze on the home banner. Carry that motion into a playable storyboard and use local forecasts to help schedule the day.
3. Replace the generic design with a content-led multi-device website. Deliver a working React and Node.js project packaged for Docker and a prompt engineering challenge.

## Implementation decisions

The forecast is supplied by a data provider. A deterministic planner selects actions by exposure context, travel mode and available equipment. The language model receives those action facts and adapts them to the visitor’s question. The runtime instructions and payload are readable in src/worker.js. The UI tells the visitor which answer path was used.

Motion serves four tasks: a moving outdoor scene sets the context, wind paths connect the cover to the report, forecast bars reveal relative levels, and a progress line shows when the next routine scene will appear. The film can be paused. The interface respects reduced-motion preferences.

## Evaluation cases

| Input | Expected behaviour |
|---|---|
| Family with children, active commute, simulated AQI 325 | Suggest an alternative to prolonged outdoor exertion. |
| Same profile, select simulated AQI 94 | Offer a quieter active-travel route and explain tailpipe impact. |
| Switch from no purifier to HEPA | Show a filtration action in the indoor chapter. |
| Ask for a guaranteed safe outdoor time | Live model instructions forbid predicting a safe time. Verify with a configured provider before presenting a live-model result. |
| Missing OpenAI key | Label the answer as built-in guidance. |
| Missing forecast connection | Show an unavailable reading and offer a labeled simulation. |
