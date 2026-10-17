#!/usr/bin/env python3
"""Build local browser catalog and verify every narrated variant and audio SHA."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify generated catalog without changing it')
    args = parser.parse_args()
    plan = json.loads((HERE / 'coverage.json').read_text())
    lines = json.loads((HERE / 'lines.json').read_text())
    assert plan['model'] == 'cosyvoice-v3.5-plus'
    assert len({line['id'] for line in lines}) == len(lines)
    shared = ROOT / 'frontend-game/games/shared'
    old = json.loads((shared / '../english_shared/audio/manifest.json').read_text())
    new = json.loads((shared / 'voice/audio/manifest.json').read_text())
    assert old['model'] == new['model'] == plan['model']
    recordings = {c['id']:c for c in old['clips'] + new['clips']}
    for line in lines:
        recorded = recordings[line['id']]
        for key in ['text', 'voice_profile', 'instruction', 'rate', 'seed']:
            assert recorded[key] == line[key], (line['id'], key, 'regenerate this clip')
        plan['clips'][line['id']] = {
            'src': f'./voice/audio/{line["id"]}.mp3?v={plan["version"]}',
            'text': line['text'], 'profile': line['voice_profile']}
    used = set()
    variants = 0
    for game, config in plan['games'].items():
        assert 'intro' in config['cues'], game
        for event, cue in config['cues'].items():
            options = list(cue['by'].values()) if 'by' in cue else [cue['clips']]
            variants += len(options)
            for ids in options:
                assert ids, (game,event)
                used.update(ids)
    assert used <= set(plan['clips']), ('missing clips', used - set(plan['clips']))
    # Old recordings remain in source manifests for rollback. The browser only
    # receives clips referenced by the current lesson and feedback plan.
    plan['clips'] = {ident:item for ident,item in plan['clips'].items() if ident in used}
    total_bytes = 0
    for ident, item in plan['clips'].items():
        file = (shared / urlsplit(item['src']).path).resolve()
        assert file.is_relative_to((ROOT / 'frontend-game/games').resolve())
        raw = file.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == recordings[ident]['sha256'], ident
        assert item['text'] == recordings[ident]['text'], ident
        total_bytes += len(raw)
    target = shared / 'voice-catalog.js'
    result = 'window.GameVoiceCatalog = ' + json.dumps(plan, ensure_ascii=False, separators=(',',':')) + ';\n'
    if args.check:
        assert target.read_text() == result, 'Run build-catalog.py after changing lines or coverage'
    else:
        target.write_text(result, encoding='utf-8')
    print(json.dumps({'games':len(plan['games']), 'cue_variants':variants,
                      'recorded_clips':len(lines), 'active_clips':len(plan['clips']),
                      'reused_clips':len(used - {line['id'] for line in lines}),
                      'referenced_bytes':total_bytes}))

if __name__ == '__main__':
    main()
