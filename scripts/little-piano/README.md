# Little Piano maintenance

Current entry, style, logic and score version: `20261017piano3` (2026-10-17).

The top navigation has Free play and Songs. A single song desk provides Listen / Follow the light buttons, shared selection and progress. Switching these modes pauses sound and keeps the current note. Choosing a song resets its progress but does not start automatic playback; Play starts it explicitly. Free play keeps the song position for returning later. Restart is the explicit reset.

Auto playback uses the AudioContext clock and a 60–120 ms articulation gap, bounded by each note duration. Lights follow note-on / note-off even for consecutive notes of the same pitch; phrase rests remain dark. Pause, mode changes, blur and background clear scheduled voices and automatic lights. Guided mode continues to wait for each new correct press, including release before a repeated note; Hear note does not advance.

## Scores and sources

`songs.js` is the authoritative melody data. All 16 arrangements are longer: 1,506 notes total, 15 white-key arrangements and the existing black-key exercise, all within C4–C6. `sectionNotes` counts one melody section; `repeats` is 2–4; `durationSeconds` is at Normal speed. Gentle (0.85) takes approximately 42–87 seconds per arrangement. Repetition is explicit in the chooser and credits.

The Smurfs extends the existing verse with its refrain, 99 notes per round / 198 notes over two rounds. Reference: Hunan music teaching material, page 32: https://hnwy-ecs-backup.oss-cn-beijing.aliyuncs.com/uploads/20190627/2732d7a19671431fbffeb610ee481a4c.pdf#page=32 . The instrumental intro is omitted; F-sharp passing notes are deliberately F naturals for a white-key teaching version.

Castle in the Sky extends the opening to 29 notes / 87 over three rounds, with F-sharp simplified to F natural; it remains an opening theme, not the full film score. Reference: https://doc.xuehai.net/b6900ab34c23a1f1345ca6f4a.html . The Mushroom Girl repeats its existing four opening phrases three times (102 notes). Baby Shark repeats four times without key changes (120 notes). Traditional songs retain their existing melody and repeat whole verses/themes; no lyrics or original recordings are added.

Each note is `{midi, beats, soundBeats}`. Tokens use `pitch:totalBeats:soundingBeats` for phrase rests without adding blank guided steps. Preserve the distinction between exact transposition and a white-key melodic simplification in credits.

## Sound and layout

Alexander Holm's Salamander Grand Piano v3, CC BY 3.0: nine local stereo samples from Tone.js, nearest-sample transposition at most one semitone, 24 simultaneous voices, soft release. Retain the sample LICENSE and in-game credits. `prepare-samples.py` recreates compressed samples; `speech-lines.json` is the existing five-clip CosyVoice 3.5 Plus source. No sound assets changed in this iteration.

There are 15 white + 10 black keys, one row in landscape and two in portrait. Free play supports chords and sliding between keys. The shared song controls adapt to small phones and landscape; the tempo selector is only shown in Listen. Preserve sound retry inside the instrument rail.

## Verification and publication

`tests/little-piano.cjs` checks every distinct phrase and a repeat boundary for all 16 songs, completes Smurfs and Castle, verifies real touch input, repeated-note release, mode switching, retained progress, auto playback completion, repeated-note dark intervals, pause/tempo/background and five viewports. Run each engine separately with `PIANO_ENGINE=chromium` or `webkit`, `PIANO_BASE` and `PIANO_TEST_OUT` (or `CWW_JOB_RUNTIME`).

`tests/little-piano-song-ui.cjs` checks long song names and both lesson modes in both languages, dialog scrolling, phrase-rest lights and complete Mushroom Girl playback. `tests/little-piano-integration.cjs` checks real homepage entry, audio output and retry. Tests block analytics; simulated browser tests do not claim physical-device or child testing.

Optional `PIANO_PREVIEW` points to a runtime directory containing only the four changed previews: `piano-index.html`, `piano-game.mjs`, `piano-songs.mjs`, `piano-style.css`. Browser routing can test these against the actual site before replacing its entry; this is not an extra project checkout.

Production serves the source workspace directly. Follow the server knowledge base's current Git/lock/atomic-replacement rules. Do not create full stage copies or filesystem code backups. Preserve existing unrelated changes; commit and push only scoped changes. Verify the remote commit and public file hashes, then remove temporary previews and screenshots.
