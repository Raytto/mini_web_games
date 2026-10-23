# Face Stage / 我的脸来演主角

2026-10-23. Original local-camera family photo game. `index.html`, `style.css`,
`art.js`, and `game.js` are the only game runtime code; no face model, backend,
microphone, recording, or photo upload is used. Photos and fitting state remain in
memory. Only the existing collection language and sound preferences use storage.

The 10 scenes are 3 solo, 4 adult/child duos, and 3 three-person family layouts.
All illustration geometry is original canvas code, with independent draggable
costumes and an adjustable oval opening per person. The single mirrored camera
projection is shared across openings; it is not copied wholesale into each face.
Preview and the 1200×1000 PNG use the same crop and mirror direction.

Camera access requires an explicit click, HTTPS (or localhost), and an allowed
camera context. `facingMode: {ideal: 'user'}` prefers the front camera; no audio is
requested. Camera tracks stop on capture, user stop, camera disconnection,
background, Home, and pagehide. An asynchronous request that resolves after
cancellation has its incoming tracks stopped immediately. Return from background
does not restart the camera.

The prepared PNG `File` is passed to `navigator.share` directly in the save-button
click, after checking `navigator.canShare`. The game cannot determine whether the
user saved it to Photos. The preview remains a normal long-pressable image and
PNG download is a separate option. No sandbox or PP Agent implementation change
is required: use the HTTPS game site.

The 3 voice files reuse existing approved CosyVoice 3.5 Plus warm-guide clips;
exact source files and hashes are in `audio/manifest.json`. No new voice was
synthesized. Art has no imported images or third-party character assets.

`tests/face-stage.cjs` exercises actual buttons and pointer actions in Chromium
and WebKit, with synthetic canvas streams and mocked OS share outcomes. It also
uses Chromium's native fake-device media pipeline. Reports and screenshots go to
`CWW_JOB_RUNTIME`. `tests/face-stage-collection.cjs` covers the public collection
entry, inherited settings, 3-person capture and Home track cleanup.

These tests do not establish physical iPad/iPhone camera quality, OS Photos-menu
availability, or suitability for a particular child. The detailed deployment,
reference sources and validation record live in the server knowledge base:
`projects/mini-web-game/docs/face-stage.md`.
