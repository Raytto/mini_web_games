#!/usr/bin/env python3
"""Build the salon's own lines; never rewrite another game's speech library."""
from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import json

ROOT = Path(__file__).resolve().parents[2]
TEXT = {
    'short': 'Short hair, please.',
    'triangle': 'A triangle, please.',
    'middle': 'Part my hair in the middle, please.',
    'round': 'A round haircut, please.',
    'side': 'A slanting haircut, please.',
    'spikes': 'I want spiky hair, please!',
    'long': 'Keep my hair long, please.',
    'wave': 'I want wavy hair, please.',
    'hint': 'Follow the dotted line.',
    'repair': 'A little too short? Let’s grow it back!',
    'grown': 'All grown back! Lovely!',
    'complete': 'Complete! I love my new hair!',
    'coming': 'A new customer is coming!',
    'cut': 'Snip, snip! Keep going!',
}
lines = []
for i, (key, text) in enumerate(TEXT.items()):
    instruction = 'Playful child English. Clear key words, friendly and unhurried. Exact words only.'
    if key == 'complete':
        instruction = 'Delighted child English! Celebrate COMPLETE, then thank the hairdresser with a big smile.'
    elif key in ('repair', 'grown'):
        instruction = 'Reassuring playful child English. Warm, smiling, no disappointment. Exact words only.'
    lines.append(dict(id='hs2_'+key, text=text, voice_profile='pip',
                      scene='Silly Hair Salon: '+key, stress=[], instruction=instruction,
                      rate=.92 if key in ('spikes','wave') else .97, seed=(81200 if key in ('spikes','wave') else 71200)+i))
out = ROOT/'scripts/silly-hair-salon'
out.mkdir(parents=True,exist_ok=True)
(out/'speech-lines.json').write_text(json.dumps(apply_lines('frontend-game/games/playful_shared/audio', lines),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'frontend-game/games/silly_hair_salon/lines.js').write_text(
    'export const SALON_LINES = '+json.dumps({x['id']:x['text'] for x in lines},ensure_ascii=False)+';\n',
    encoding='utf-8')
print('Prepared',len(lines),'salon clips.')
