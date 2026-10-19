# Bubble Sky / 泡泡弹弹乐

The canonical self-contained game is `prototypes/sky-sling/index.html`. This is an independent playable delivery, not a registered home-page game or a production route. Do not infer permission to change shared collection files from this prototype.

All art, CSS, JavaScript and eight English recordings are embedded in that one UTF-8 file. There are no external requests, browser storage, analytics, backend dependencies or build dependencies. Edit the HTML directly; its read-only `window.skySlingState` snapshot supports acceptance without mutating the simulation.

## Audio maintenance

`speech-lines.json` contains the eight game-specific warm-guide lines. `voice-manifest.json` records the CosyVoice 3.5 Plus generation metadata and processed audio hashes; `voice-verification.json` records independent ASR of the final recordings. The runtime MP3 bytes are the corresponding data URLs in the HTML's `voice-data` JSON element, keyed by each line's `key`. The HTML is the only maintained copy of the audio assets; do not store redundant loose MP3s.

To regenerate, use the repository's existing `scripts/warm-guide/generate.py` with a task runtime work directory containing these speech lines as `lines.json`, the current `scripts/english-learning/voice-profiles.json` as `profiles.json`, and a `plan.json` naming the current warm-guide `voice_id`. Credentials remain in the protected configuration read by the existing generator. Review the generation and ASR results, replace the embedded JSON, and update these three metadata files. No credentials belong in the HTML or repository.

Pop sounds, launch swooshes and celebration chords are local Web Audio synthesis. A compressor limits overlapping hits. All sounds follow the mute control; pause, backgrounding and page exit suspend them. No music loop runs behind the game.

## Acceptance and delivery

Run `tests/sky-sling.cjs` with `CWW_JOB_RUNTIME` pointing to the current task's process directory. Set `PLAYWRIGHT_MODULE` to the existing Playwright installation and `PLAYWRIGHT_BROWSERS_PATH` to the installed browsers if needed. A short `TMPDIR` may be necessary for browser socket paths on this host. The script launches Chromium and WebKit serially, serves the final HTML under the PP Agent web sandbox CSP, uses real buttons and pointer gestures, and saves only process evidence. It never changes game state to manufacture hits.

`tests/sky-sling-safe-area.cjs` additionally checks six viewports, two languages and simulated safe insets in each engine, and verifies that pause stops canvas painting. Simulated insets are not a real-device test.

`SKY_SLING_HTML` can point at a delivery HTML instead of the canonical source. Copy the verified file to `CWW_OUTPUTS_DIR`; write a sibling named `<filename>.html.pp-agent.json` with `{"presentation_mode":"web","sha256":"<full SHA-256 of the exact HTML>"}`. Validate the final document and declaration through the installed PP Agent validator. The declaration is protocol material and is not a user attachment link.

Current behavior, evidence limits and the delivery record are maintained in the PPHK knowledge base at `projects/mini-web-game/docs/sky-sling-prototype.md`. Use Git for source and resource recovery; do not create full-project staging or backup copies.
