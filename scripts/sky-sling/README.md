# Bubble Sky / 泡泡弹弹乐

The canonical game is `frontend-game/games/sky_sling/index.html`, available from the collection home after Bubble Pop. The earlier independent source was moved into this production directory; its historical delivered HTML and Git history remain available. New game development follows the [default integration policy](/srv/workspace/pphk-manage/projects/mini-web-game/docs/development-maintenance.md#默认完成开发后直接接入合集2026-10-19): develop, verify, integrate and validate the live collection as one task.

## Collection behavior

The home card is registered in `frontend-game/home.html`, its translations in `frontend-game/scripts/sky-sling-home.js`, and its age guidance in `scripts/game-guidance/catalog.json`. The root shell includes `sky_sling` in `ENGLISH_GAMES`, pauses background music, and prepares the shared speech context during the card click. Entering from the home card starts play and the spoken guide immediately; a direct URL keeps the initial play button to unlock sound.

The game uses the shared Home CSS/JS and the ordinary collection tracking script. Home remains available from play, help, pause and the direct-entry welcome panel. It cancels a held shot and stops all game sounds before navigation; the shell closes its borrowed audio context. An independently opened game closes its own context on page exit.

Language is inherited through `parent.XiaoxiaoI18n` and `xiaoxiaoLanguage`; only the home has a language selector. Sound follows `xiaoxiaoEnglishVoiceEnabled`, including changes from other tabs. Muting this game also stops its effects. Bubble count and best combo remain session-only and reset when reopening.

All original game art, CSS, gameplay JavaScript and eight recordings are embedded in the game HTML. Common Home assets and tracking are shared with the collection; no new backend or database schema is involved. Edit the game HTML directly. Its read-only `window.skySlingState` snapshot supports acceptance without changing the simulation.

## Audio and cover maintenance

`speech-lines.json`, `voice-manifest.json` and `voice-verification.json` hold the eight CosyVoice 3.5 Plus warm-guide lines, generation metadata, processed MP3 hashes and independent ASR results. MP3 bytes live only in the HTML's `voice-data` JSON element, keyed by each line's `key`.

To regenerate, use the existing `scripts/warm-guide/generate.py` with a task runtime directory containing these lines as `lines.json`, the current `scripts/english-learning/voice-profiles.json` as `profiles.json`, and `plan.json` naming the current warm-guide `voice_id`. Credentials remain in protected configuration read by that generator. Review synthesis and ASR, replace the embedded JSON, and update the three metadata files.

Pop sounds, launch sounds and celebration chords use local Web Audio synthesis with a compressor for overlapping hits. Pause and backgrounding suspend audio and repeated canvas painting; no music loop runs behind the game.

`build-cover.cjs` reuses the game's original SVG illustration, adds matching sky art, and renders `frontend-game/assets/thumbnails/sky-sling-v1.webp` at 720×450. It uses installed Playwright and ffmpeg, and removes its temporary PNG from `CWW_JOB_RUNTIME`.

## Acceptance

Set `CWW_JOB_RUNTIME` to the current process directory; set `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_BROWSERS_PATH` to installed tools if necessary. A short `TMPDIR` can be needed for browser socket paths. Run browsers serially:

- `node tests/sky-sling.cjs`: actual direct-page buttons, pointer shots, four trajectories, natural collisions, combo/burst rewards, audio, layout and touch cancellation; served from the real frontend on loopback.
- `node tests/sky-sling-safe-area.cjs`: six viewports, two languages, simulated safe insets, paused painting and resume. Insets are simulated, not physical-device evidence.
- `node tests/sky-sling-collection.cjs`: the real root shell, home card, automatic entry/voice, shared language/sound, BGM suppression, Home from help/pause, context cleanup and mobile iframe layouts. Set `BASE_URL=https://xiaoxiao.cool` to verify production instead of loopback.
- `python3 scripts/game-guidance/build-home.py --check`: all home age badges still match the catalogue.

Tests use real gestures and read-only telemetry, not injected hits or scores. Browser tracking is disabled during acceptance so testing does not write production event rows. The production files still include the normal tracking integration. Preserve evidence in the task runtime and clean temporary images after inspection.

Current publication, evidence limits and rollback commits are maintained in `projects/mini-web-game/docs/sky-sling-prototype.md` in the PPHK knowledge base. Use Git for recovery; do not create whole-project copies or a separate standalone release by default.
