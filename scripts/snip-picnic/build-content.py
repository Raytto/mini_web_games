#!/usr/bin/env python3
"""Authoritative fruit garden -> browser content and scene-directed speech."""
from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import json
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
VERSION='20261003harvest1'
gardens=json.loads((HERE/'content.json').read_text())
lines=[]
def say(key,text,profile='guide',instruction='Warm child English. Curious and clear. Stress the fruit name. Exact words, no fillers.'):
 lines.append(dict(id='sp2_'+key,text=text,voice_profile=profile,scene='Fruit garden: '+key,stress=[],instruction=instruction,rate=.98,seed=94500+len(lines)))
for g in gardens:
 assert 4<=len(g['slots'])<=8 and g['kind'] in ('tree','vine','ground_vine','low','rosette','herb','bush')
 g['mixed']=any(s['mode']=='rope' for s in g['slots'])
 if g['id']=='passion_fruit':g['fact']='Passion fruit grows on climbing vines.'
 action='Cut a rope, or touch the fruit.' if g['mixed'] else 'Touch the fruit to pick it.'
 say('intro_'+g['id'],g['fact']+' '+action)
 share="Let's share these "+g['plural'].lower()+"!" if g['id'] in ('pear','cherry','raspberry') else g['plural']+" for everyone! Let's share!"
 say('share_'+g['id'],share,'teddy','Happy child English. Warm delight at sharing the fruit. Clear words, no fillers.')
 g['introClip']='sp2_intro_'+g['id'];g['shareClip']='sp2_share_'+g['id']
say('rope','Cut the rope to drop this fruit.','guide')
say('pick','Touch the fruit to pick it.','guide')
say('mixed','Cut a rope, or touch the fruit.','guide')
(HERE/'speech-lines.json').write_text(json.dumps(apply_lines('frontend-game/games/playful_shared/audio', lines),ensure_ascii=False,indent=2)+'\n')
if not (HERE/'reviewed-clips.json').exists():(HERE/'reviewed-clips.json').write_text('{}\n')
(ROOT/'frontend-game/games/snip_picnic/content.js').write_text('export const VERSION='+json.dumps(VERSION)+';\nexport const GARDENS='+json.dumps(gardens,ensure_ascii=False)+';\nexport const HARVEST_LINES='+json.dumps({line['id']:line['text'] for line in lines},ensure_ascii=False)+';\n')
print('Prepared',len(gardens),'gardens and',len(lines),'speech clips')
