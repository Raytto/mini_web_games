#!/usr/bin/env python3
"""Validate the aquarium's distinct character recordings and build its local catalogue."""
from pathlib import Path
import argparse,hashlib,json
root=Path(__file__).resolve().parents[2];game=root/'frontend-game/games/feed_fish';author=root/'scripts/feed-fish'
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');args=p.parse_args()
lines=json.loads((author/'speech-lines.json').read_text());profiles=json.loads((author/'voice-profiles.json').read_text())
manifest=json.loads((game/'audio/manifest.json').read_text());recorded={c['id']:c for c in manifest['clips']}
species=json.loads((game/'fish-catalog.js').read_text().split('=',1)[1].strip().removesuffix(';'))['species']
assert len(species)==37 and len(lines)==len(recorded)==1+4*len(species)
assert len({profiles['profiles'][s['name']]['voice_id'] for s in species})==len(species)
assert manifest['model']==profiles['model']=='cosyvoice-v3.5-plus'
clips={};inspect={};reactions={}
for line in lines:
 ident=line['id'];item=recorded[ident];audio=game/'audio'/item['file'];profile=profiles['profiles'][line['voice_profile']]
 assert item['text']==line['text'] and item['voice']==profile['voice_id'] and item['model']==manifest['model']
 assert hashlib.sha256(audio.read_bytes()).hexdigest()==item['sha256'],ident
 clips[ident]={'src':'audio/'+item['file']+('?v=20261002reef4' if ident.startswith('reef4_') else '?v=20261001reef3'),'text':line['text']}
 if 'species' in line:
  assert line['species'] in {s['name'] for s in species}
  clips[ident].update(species=line['species'],event=line['event'])
  if line['event']=='hello':inspect[line['species']]=[ident]
  else:
   assert not any(s['word'].lower() in line['text'].lower() for s in species),ident
   assert 'this is' not in line['text'].lower(),ident
   reactions[line['species']+'_'+line['event']]=[ident]
assert len(inspect)==len(species) and len(reactions)==3*len(species)
config={'version':'20261002reef4','clips':clips,'games':{'feed_fish':{'cues':{
 'intro':{'clips':['reef3_intro'],'priority':0,'cooldown':0},
 'inspect':{'by':inspect,'priority':3,'cooldown':0},
 'fish':{'by':reactions,'priority':1,'cooldown':1500}
}}}}
code='// Aquarium-only voices; no credentials or voice-design IDs are shipped.\nwindow.GameVoiceCatalog = '+json.dumps(config,separators=(',',':'))+';\n'
target=game/'voice-catalog.js'
if args.check:assert target.read_text()==code
else:target.write_text(code)
print(json.dumps({'clips':len(clips),'characterVoices':len(inspect),'feedingReactions':len(reactions)}))
