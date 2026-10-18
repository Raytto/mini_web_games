# Hide & Seek / 小伙伴藏哪儿

Integrated into the Xiaoxiao collection on 2026-10-18, following the user's approval of the six-world standalone prototype and request for richer, additional scenes. Runtime source is `frontend-game/games/hide_seek/`; homepage entry follows Little Detective. The 3+ label is a design suggestion, not a measured developmental result.

## Content and play

Twelve original SVG worlds each contain four distinct animals: 48 scene/target combinations using 14 animal designs. `art.js` owns the animal shapes, exact-part clues, backgrounds, hiding objects and positions. The original forest, pond, garden, bedroom, farm and picnic worlds have more environmental detail. New worlds are beach, orchard, greenhouse, playroom, snowy cottage and starlight camp.

The target's complete picture stays visible. Tap a hiding place to reveal its animal. Non-targets introduce themselves without ending the question; only the requested animal completes it. The child chooses when to continue. There is no timer, penalty, purchase or account requirement. The hint points to the matching detail. The world chooser supports any of the 48 questions.

Random play uses a shuffled bag of all 48 combinations and avoids the same adjacent question across bags. Manual world selection is separate from the random bag. Reentering starts a new bag. Every animal changes position whenever a scene is revisited; the displayed progress counts unique solved combinations during this visit only.

## Collection integration

- `game-home.css/js` supplies the shared 48 px Home link; `MINI_GAME.id` is `hide_seek`.
- UI language inherits `XiaoxiaoI18n` / `xiaoxiaoLanguage`. The default is English. The game supplies its own Chinese and English strings; `scripts/hide-seek-home.js` registers the homepage strings before the shared translator runs.
- `index.html` registers `hide_seek` in `ENGLISH_GAMES`. The root card click unlocks the shared speech context and pauses background music before navigation. Direct links retain tap-to-unlock speech.
- `voice.js` uses the existing `xiaoxiaoEnglishVoiceEnabled` preference, caches decoded audio, cancels previous speech on a new question, and stops on page exit or hiding. Failed requests clear the cache entry and show a retry hint while the game remains playable.
- `voices.js` references 42 existing warm-guide recordings under `games/english_shared/audio/`, three per animal. `audio-sources.json` records their approved text, profile, model and SHA-256 as of this release. No audio synthesis service or copied audio library is needed at runtime. Future intentional audio replacements must update this provenance after verification.
- Homepage age labels are built with `python3 scripts/game-guidance/build-home.py`, then `--check`. This integration also restores the missing catalogue entry for the already-live Symmetry Draw Ages 2+ card; its displayed age is unchanged.

## Cover and testing

The cover uses this game's original vector artwork, not stock art or a screenshot of another product. Rebuild its 720 × 450 WebP with `node scripts/hide-seek/build-cover.cjs` while holding the site's static publish lock. Requires Chromium via Playwright and `ffmpeg`; `CWW_JOB_RUNTIME` must point outside the repository. `PLAYWRIGHT_MODULE` may point to the installed Playwright module and `PLAYWRIGHT_BROWSERS_PATH` to the existing browser cache.

```sh
node tests/hide-seek.cjs
node tests/hide-seek-collection.cjs
python3 scripts/game-guidance/build-home.py --check
```

The tests use a loopback server serving the real frontend, disable analytics in the browser, and write reports/screenshots into `CWW_JOB_RUNTIME` (or `HIDE_SEEK_QA_DIR`). They run Chromium and WebKit serially. The first suite checks 48 real question flows, 144 non-target choices, two complete shuffled cycles, changing hiding positions, both languages at six screen sizes, touch and keyboard controls. The collection suite checks the real homepage-to-game flow, automatic decoded speech via the parent audio context, music suppression, voice cancellation, language and sound preferences, failed-audio retry, and shared touch Home. These are desktop browser engines with touch emulation, not physical iPad/iPhone or child tests.

Technical success does not establish educational benefit. Sequentially opening all four hiding places still works; observed child comparison, first choices, hint use and willingness to continue remain the next usability questions. The original six-world offline artifact remains in its PP Agent research conversation; the live game's current source of truth is this repository.
