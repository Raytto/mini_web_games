# Rhythm Railway / 节奏小火车

Integrated into the collection on 2026-10-18. Runtime: `frontend-game/games/rhythm_train/`. Public entry: `https://xiaoxiao.cool/games/rhythm_train/index.html`. Homepage position 10, after Little Drummer; 43 cards at release. No build or service restart is required. Follow the knowledge base's current shared-workspace/Git workflow; do not create stage sites or source copies.

The original 2026-10-15 offline game's scheduling, presets, 4–32 cars, per-car four-instrument combinations, 24-train garage, undo, JSON backup/import and storage conflict protection are retained. `xiaoxiaoRhythmRailwayV1` remains the storage key. Storage belongs to the current browser and origin. An old downloaded file's data can be moved using its JSON backup, not by accessing another origin's storage.

`index.html`, `style.css`, `game.js` and `messages.js` are normal site files. The game loads the shared Home control, translator and tracking metadata. Homepage text is in `frontend-game/scripts/rhythm-train-home.js`; the wrapper's `ENGLISH_GAMES` registration supplies the unlocked AudioContext and suppresses BGM. Default language is English, with the homepage preference inherited. The 320×568 layout keeps the instrument tools and playback controls visible together.

## Sounds and voice

The four recordings directly reuse `../little_drums/samples/{kick,snare,hat,crash}-1.mp3?v=20261014drums1`, byte-identical to the original offline game's embedded audio. Do not copy or replace these shared samples. Their CC0 license is in `frontend-game/games/little_drums/samples/LICENSE.txt`: Virtuosity Drums, Versilian Studios / Karoryfer Samples, performed by Austin McMahon. Same-car sources share an AudioContext start time. Loading waits for all attempts to finish before enabling a retry; decoded successes are reused.

Two optional English instructions use the approved `warm_guide` profile and CosyVoice 3.5 Plus, rate 0.92, pitch 1.0. Both passed independent transcript checks. Source text/settings are in `speech-lines.json`; provenance and SHA-256 are in `voice-manifest.json`; blind ASR results are in `voice-check.json`. Runtime filenames are `audio/intro.mp3` and `audio/help.mp3`, mapped by each source line's `key` and manifest's `runtime_file`. Guidance stops as soon as the child interacts; music never competes with narration. Help has replay and the existing `xiaoxiaoEnglishVoiceEnabled` preference. Voice failures never block the music.

For regeneration, create a task runtime directory containing this `speech-lines.json` as `lines.json`, the current `scripts/english-learning/voice-profiles.json` as `profiles.json`, and `plan.json` containing the current warm guide `voice_id`. Run `scripts/warm-guide/generate.py --work-dir <task-directory> --runtime-dir <temporary-directory>`. Review both generation and ASR counts, then install the relevant MP3 by its `key`; update the manifest mapping and audio cache version. Credentials remain in the protected configuration read by the existing generator and must not be copied into the task or repository.

## Cover and validation

The cover derives from the game's original native SVG artwork. `art/rhythm-train/cover.svg` is the editable source; the runtime cover is the 720×450 `frontend-game/assets/thumbnails/rhythm-train-v1.webp`. Render the SVG at its native size and encode WebP with FFmpeg at quality 90. No unrelated generated source images are retained.

Run the following against the local frontend or public site with `TRAIN_BASE`, and place test artifacts in `TRAIN_TEST_OUT`. The test environment must allow a short temporary socket directory for Chromium (for example its normal `/tmp`). All analytics calls are intercepted; tests do not write business events.

- `tests/rhythm-train.cjs`: 17 core groups in Chromium and WebKit, including overlapping instruments, exact simultaneous onset, nonzero output, follow/manual navigation, tempo, garage, import/export, persistence, layout and lifecycle.
- `tests/rhythm-train-edge.cjs`: 8 groups in each engine, including real touch/live edits, all rests, corrupt storage, quota failure, decoding retry, canceled loading and invalid output timestamps.
- `tests/rhythm-train-integration.cjs`: 9 groups in each engine, exercising real homepage buttons, position/cover, auto English introduction, parent audio and BGM, Home, Chinese inheritance, voice controls, translated dialogs and 5 viewport sizes in both languages.

The public integration tests passed on 2026-10-18. Phone/tablet sizes are browser emulations, not physical iPhone/iPad testing or child playtesting. The 42 existing homepage cards retain their content and relative order. Revert this integration's Git commit only after checking for newer changes; do not reset the entire repository or restore an old directory snapshot.
