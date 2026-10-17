#!/usr/bin/env python3
from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import json
ROOT=Path(__file__).resolve().parents[2]
DIR=Path(__file__).parent
animals=json.loads((DIR/'content.json').read_text())
steps={
 'brush': {'label':'Brush teeth','zh':'刷牙','ask':'Brush my teeth, please.','done':'All clean! What a lovely smile!'},
 'pajamas': {'label':'Pajamas','zh':'换睡衣','ask':'Put on my pajamas, please.','done':'Soft pajamas. So cozy!'},
 'story': {'label':'Story time','zh':'讲故事','ask':'Read me a story, please.','done':'What a lovely story!'},
 'curtain': {'label':'Curtains','zh':'拉窗帘','ask':'Close the curtains, please.','done':'The curtains are closed.'},
 'music': {'label':'Quiet music','zh':'关音乐','ask':'Turn off the music, please.','done':'The music is off. So quiet!'},
 'light': {'label':'Lights out','zh':'关灯','ask':'Turn off the light, please.','done':'The light is off.'}
}
previous={line['id']:line for line in json.loads((DIR/'speech-lines.json').read_text())} if (DIR/'speech-lines.json').exists() else {}
lines=[]
def say(ident,text,profile='teddy',instruction='Gentle child English. Warm, sleepy and clear. Exact words, no fillers.',rate=.96):
 if 'gn2_'+ident in previous and previous['gn2_'+ident]['text']==text:
  lines.append(previous['gn2_'+ident]);return
 lines.append(dict(id='gn2_'+ident,text=text,voice_profile=profile,scene='Bedtime: '+ident,stress=[],instruction=instruction,rate=rate,seed=82900+len(lines)))
for key,step in steps.items():
 say('ask_'+key,step['ask']);say('done_'+key,step['done'])
for a in animals:
 assert len(a['steps'])>=4 and len(set(a['steps']))==len(a['steps']) and a['steps'][-1]=='light'
 say('hello_'+a['id'],'The '+a['name'].lower()+' is ready for bed.','guide')
 say('sleep_'+a['id'],'The '+a['name'].lower()+' is asleep. Good night!','guide')
 # Six independently voiced picture-book pages are compiled below.
 a['storyClip']=a['pages'][0]['clip']
say('next','Here comes another sleepy friend.','guide')
# Wrong taps repeat the current request directly, without a generic preamble.
say('brush_more','Brush, brush, brush!','teddy')
lines.extend(json.loads((DIR/'story-speech-lines.json').read_text()))
(DIR/'speech-lines.json').write_text(json.dumps(apply_lines('frontend-game/games/playful_shared/audio', lines),ensure_ascii=False,indent=2)+'\n')
(DIR/'reviewed-clips.json').write_text('{}\n') if not (DIR/'reviewed-clips.json').exists() else None
out=ROOT/'frontend-game/games/goodnight_hotel/content.js'
out.write_text('export const VERSION="20261011night3";\nexport const ANIMALS='+json.dumps(animals,ensure_ascii=False)+';\nexport const STEPS='+json.dumps(steps,ensure_ascii=False)+';\nexport const NIGHT_LINES='+json.dumps({a['id']:a['text'] for a in lines},ensure_ascii=False)+';\n')
print('Prepared',len(animals),'animals and',len(lines),'bedtime clips.')
