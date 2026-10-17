#!/usr/bin/env python3
"""Build the Balloon Pump-only extension, verifying CosyVoice recordings."""
from pathlib import Path
import argparse,json,hashlib
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).parent
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
lines=json.loads((HERE/'speech-lines.json').read_text());colors=json.loads((HERE/'colors.json').read_text())
manifest=json.loads((ROOT/'art/balloon-pump-voices/voice-manifest.json').read_text())
assert manifest['model']=='cosyvoice-v3.5-plus'
records={x['id']:x for x in manifest['clips']};clips={}
for row in lines:
 record=records[row['id']]
 for key in ['text','voice_profile','instruction','rate','seed']:assert record[key]==row[key],(row['id'],key)
 audio=ROOT/'frontend-game/games/balloon_pump/audio'/(row['id']+'.mp3')
 assert hashlib.sha256(audio.read_bytes()).hexdigest()==record['sha256']
 clips[row['id']]=dict(src='../balloon_pump/audio/'+row['id']+'.mp3?v=20261014pump1',text=row['text'],profile=row['voice_profile'])
assert len(clips)==12 and len(colors)==6
cues={event:dict(by={c['hex']:[f"bp1_{kind}_{c['name']}"] for c in colors},priority=priority,cooldown=0) for event,kind,priority in [('color','appear',1),('fly','fly',3)]}
result='// Per-page extension; shared catalog and other games remain unchanged.\n(()=>{const c=window.GameVoiceCatalog;if(!c?.games?.balloon_pump)return;\nObject.assign(c.clips,'+json.dumps(clips,separators=(',',':'))+');\nObject.assign(c.games.balloon_pump.cues,'+json.dumps(cues,separators=(',',':'))+');\n})();\n'
target=ROOT/'frontend-game/games/balloon_pump/voice-catalog.js'
if args.check:assert target.read_text()==result
else:target.write_text(result)
print('Balloon Pump: six colors, twelve verified recordings')
