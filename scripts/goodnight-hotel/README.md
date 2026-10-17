# Goodnight Hotel: guided bedtime routines

Released content version: `20261003night2`. The game has 15 distinct animals, each with 4–6 ordered steps, a unique illustrated two-sentence story, pajamas and a sleeping pose. Tap a room object or its footer picture; the brush, pajamas and book can also be dragged onto the animal. Completed steps cannot be undone accidentally. A wrong-order tap gently repeats the current request.

All animals finish with the light. The sleeping pose and third-person “The … is asleep” feedback remain for at least 1.4 active seconds and finish speech (maximum 4.5 seconds). The old guest slides left in 0.55 seconds and the next enters from the right in 0.65 seconds. The 15-item shuffled bag starts randomly and avoids repeats across the bag boundary. There is no three-room ending or Next button. Reduced motion uses short fades. The active clock pauses in the background, interrupted gestures are cancelled, and a story resumes with its full minimum picture time.

## Content and art

`content.json` is authoritative for animals, routine order, story titles/text and art descriptions. `python3 scripts/goodnight-hotel/build-content.py` writes the runtime `frontend-game/games/goodnight_hotel/content.js` and the current 134-line speech source (44 retained requests/feedback clips plus 90 page narrations). Never edit generated runtime content alone. Advance the version in the generator and all referencing URLs after a released file changes.

Art originals, exact prompts and hashes are retained in `art/goodnight-hotel/20261003/`. The built-in image generation tool created 39 originals: one room, 15 separate three-state character sheets, 15 story scenes, and eight props. Each character sheet contains only that same animal in day clothes, pajamas and sleeping pajamas. Windows/curtains, lamp and music box each have matching on/off state frames. Do not replace these illustrated props with geometric constructions. Story speech bubbles and transparent hit areas are UI framing.

With Pillow available, run `python scripts/goodnight-hotel/build-assets.py`. The script derives 72 WebP assets, preserves alpha, normalizes pose alignment, and records source/runtime hashes in `asset-manifest.json`. `--partial` is only for working previews; release requires zero missing sources. `--resume` is for an interrupted initial pack with unchanged packing rules; it validates existing images and atomically replaces incomplete files. A changed packer requires a full rebuild. Only the current animal's state and story images load during play; original PNGs and manifests are not browser dependencies.

## Speech

Use the common `scripts/english-learning/generate-speech.py` with the hotel `speech-lines.json`, existing `voice-profiles.json`, model `cosyvoice-v3.5-plus`, and the protected app env file described in the [common voice guide](../english-learning/README.md). Requests use the soft Teddy voice; introductions, stories and asleep narration use Guide. Every spoken edit requires the matching audio edit.

Generate into a separate audio directory. Copy **only `gn2_*.mp3`** into `frontend-game/games/playful_shared/audio/`; never replace its shared manifest. Keep this generation's manifest at `art/goodnight-hotel/20261003/voice-manifest.json` and WAV/meta originals under `voice-raw/`. Verify all 60 clips with `scripts/game-voices/verify-speech.py`, the hotel lines and `reviewed-clips.json`. `asr/summary.json` records 60 matches and zero unresolved/failed clips; ASR is not a claim of human listening review. Existing public audio IDs and the shared runtime are unchanged.

The initial 2026-10-03 version used one picture and two sentences per animal. Its timing notes below are historical.

The current request is prefetched; each story downloads only when it becomes the current step. Story images remain for at least four active seconds and until narration finishes, with an 11-second failure bound. Tapping the bubble or Listen Again restarts the picture time. All voices use the existing single channel; music-box notes are quiet, pause during narration and stop when its step is completed. Explicit retry restores failed speech; an art retry preserves the current animal and step.

## Verification and release

- `tests/goodnight-hotel.cjs`: 15 distinct animals, ordered 4–6-step routines, wrong-order guidance, all 15 stories, day/pajamas/sleep poses, automatic slides, rapid taps, drag/keyboard, lifecycle and five screen sizes.
- `tests/goodnight-hotel-audio.cjs`: actual homepage gesture, decoded speech, one voice, current-resource loading, story replay, sleep/arrival sequence, mute, lifecycle, missing audio/art, denied storage and reduced motion.
- `tests/playful-four.cjs` hotel/resilience groups and `tests/playful-audio.cjs`: shared integration regression; the original three-animal test flow has been replaced.

Set `PLAYFUL_BASE`, `PLAYFUL_EVIDENCE` and optionally `PLAYFUL_ENGINE=webkit`. Tests use DOM actions without writing internal game state; analytics are intercepted. Browser WebKit is not a physical iPhone/iPad test.

Production serves the source directly. Develop in a separate stage and publish owned paths only while holding `/srv/data/mini_web_games/.static-publish.lock`. Guard every existing file with its initial SHA, back it up, install resources before code and HTML last, and verify public response bytes. For rollback, verify the release manifest's after-hashes before restoring; do not overwrite later work. The server knowledge leaf `projects/mini-web-game/docs/goodnight-hotel.md` records the release receipt and current evidence.

The associated shared Home fix restricts compatibility-click suppression to an actual Home link. A null lookup previously suppressed unrelated trusted taps during the first 800 ms. `tests/game-home-click-guard.cjs` covers early ordinary taps, an ordinary tap after Home, single Home activation and keyboard input in Chromium/WebKit. All 36 Home JavaScript references advance to `20261003home2`; Home CSS stays `20261002home1`.


## Six-page stories and contextual help (2026-10-11)

Version `20261011night3` removes `gn2_first` from gameplay: a wrong tap replays the exact current request, with a golden arrow, animated halo and small sparkles around the real room object, plus a highlighted matching toolbar button. Wrong taps do not advance the routine. The hint stays until the correct action, restart or phase change. Rapid wrong taps throttle narration restarts to 0.9 seconds. Reduced motion retains a static pointer and halo.

All 15 animals have six individually illustrated and narrated pages, with a beginning, a small problem, help or discovery, and a quiet ending. `content.json` owns the page text, clip ID and image path. `story-speech-lines.json` owns its 90 voice performances (`gn3_story_<animal>_<page>`); `build-content.py` merges them with unchanged existing performances into the full speech source. Edit both page text and the matching speech line when changing wording, regenerate and verify affected audio, and rebuild content. The model remains `cosyvoice-v3.5-plus` using the existing Guide profile.

Each of 15 independent built-in imagegen calls produced one six-frame storyboard sheet for consistent characters. All original sheets, exact prompts, source SHA and crop rectangles are retained in `art/goodnight-hotel/20261011/image-manifest.json`. `build-story-assets.py` (Pillow required) derives 90 separate WebP pages under `assets/stories-v3/`; it does not creatively redraw the originals. Only the current page is loaded, with page 1 prefetched when the story becomes the current step. The runtime never loads the original sheets or other animals' stories in bulk.

The picture must load before its narration starts. Each page stays for at least four foreground seconds and 0.8 seconds after the narration ends; a 12-second failure bound keeps unavailable resources from trapping the game. Tapping the picture, speech caption or speaker replays only the current sentence and resets its reading time. Backgrounding pauses and resuming repeats the current sentence. Mute changes reset reading time; restart removes the whole book and invalidates old image callbacks. Retry retains the exact guest and page. After page 6, the routine advances exactly once.

New regression suites: `tests/goodnight-hotel-stories.cjs` checks all 90 page/voice pairs with actual audio decoding and contextual guidance (isolated content selection, no direct game-state writes); `tests/goodnight-hotel-loading.cjs` covers delayed image loading before speech, failed image/audio retry, 320px layout and reduced motion. Existing hotel UI and audio suites now understand six pages. Test output belongs in `PLAYFUL_EVIDENCE`, never the project root. Raw WAVs, synthesis manifest and independent ASR results remain under the dated art directory; 90 matched clips, no unresolved or failed clips. ASR is not a claim of manual listening review.
