#!/usr/bin/env python3
"""Authoritative clinic content and CosyVoice lines. No credentials belong here."""
from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import json
ROOT=Path(__file__).resolve().parents[2];V='20261013clinic3'
OUT=ROOT/'frontend-game/games/animal_clinic';ART=ROOT/'art/animal-clinic/20261013';HERE=Path(__file__).parent
patients=[
 ('turtle','Turtle','小乌龟','flip','pond','Turtle rolled onto its back. Let us help.'),
 ('rabbit','Bunny','小兔子','mud','meadow','Bunny splashed in a muddy puddle.'),
 ('cat','Kitty','小猫咪','scrape','tree','Kitty has a little scratch on its paw.'),
 ('hedgehog','Hedgehog','小刺猬','leaves','tree','Hedgehog has leaves stuck in its coat.'),
 ('bear','Bear','小熊','bump','meadow','Bear has a little bump. Let us be gentle.'),
 ('duck','Duck','小鸭子','wet','pond','Duck is wet and chilly after the rain.'),
 ('ladybug','Ladybug','小瓢虫','flip','meadow','Ladybug rolled onto its back. Let us help.'),
 ('fox','Fox','小狐狸','mud','tree','Fox has muddy paws after a forest walk.'),
 ('dog','Puppy','小狗狗','scrape','meadow','Puppy has a little scratch on its paw.'),
 ('squirrel','Squirrel','小松鼠','leaves','tree','Squirrel has leaves stuck in its fluffy tail.'),
 ('panda','Panda','大熊猫','bump','tree','Panda has a little bump. Let us help.'),
 ('penguin','Penguin','小企鹅','wet','pond','Penguin is wet and chilly after the rain.'),
]
tools={
 'hand':{'en':'Helping hand','zh':'小手','clip':'ac1_tool_hand'},
 'sponge':{'en':'Soft sponge','zh':'软海绵','clip':'ac1_tool_sponge'},
 'towel':{'en':'Fluffy towel','zh':'小毛巾','clip':'ac1_tool_towel'},
 'cotton':{'en':'Soft cotton','zh':'软棉片','clip':'ac1_tool_cotton'},
 'bandage':{'en':'Little bandage','zh':'小绷带','clip':'ac1_tool_bandage'},
 'brush':{'en':'Soft brush','zh':'软毛刷','clip':'ac1_tool_brush'},
 'coldpack':{'en':'Cool pack','zh':'凉凉袋','clip':'ac1_tool_coldpack'},
}
steps={
 'roll':{'tool':'hand','en':'Help me roll over, gently.','zh':'轻轻帮我翻过来。','mode':'roll','hits':1,'done':'I am the right way up!'},
 'wash':{'tool':'sponge','en':'Wipe the muddy spots, gently.','zh':'轻轻擦掉泥点。','mode':'wipe','hits':3,'done':'The mud is gone. So clean!'},
 'dry':{'tool':'towel','en':'Pat me dry with the towel.','zh':'用毛巾轻轻擦干。','mode':'wipe','hits':3,'done':'Warm and dry. That feels nice!'},
 'clean':{'tool':'cotton','en':'Gently clean around my little scratch.','zh':'轻轻擦干净小擦痕旁边。','mode':'wipe','hits':2,'done':'Nice and clean. Thank you!'},
 'cover':{'tool':'bandage','en':'Put the bandage on my little scratch.','zh':'把小绷带贴到擦痕上。','mode':'place','hits':1,'done':'The bandage is on. Thank you!'},
 'brush':{'tool':'brush','en':'Brush the leaves away, gently.','zh':'轻轻刷掉叶子。','mode':'wipe','hits':3,'done':'All the leaves are gone!'},
 'cool':{'tool':'coldpack','en':'Put the cool pack on my little bump.','zh':'把凉凉袋轻轻放在小鼓包上。','mode':'hold','hits':3,'done':'Cool and comfy. That feels better!'},
 'comfort':{'tool':'hand','en':'Give me a gentle pat.','zh':'轻轻拍拍我吧。','mode':'pat','hits':1,'done':'Thank you for taking care of me!'},
}
problems={
 'flip':{'en':'A little tumble','zh':'翻不过来啦','steps':['roll','comfort']},
 'mud':{'en':'Muddy paws','zh':'身上沾了泥','steps':['wash','dry','comfort']},
 'scrape':{'en':'A little scratch','zh':'小小擦痕','steps':['clean','cover','comfort']},
 'leaves':{'en':'Tickly leaves','zh':'叶子挂身上','steps':['brush','comfort']},
 'bump':{'en':'A little bump','zh':'小小鼓包','steps':['cool','comfort']},
 'wet':{'en':'Wet and chilly','zh':'湿湿凉凉的','steps':['dry','comfort']},
}
lines=[]
def say(id,text,profile='guide',focus='',tone=None):
 lines.append(dict(id=id,text=text,voice_profile=profile,scene='Animal Clinic: '+id,focus=focus,stress=[focus] if focus else [],instruction=tone or 'Warm playful child voice. Clear gentle English. Exact words. Friendly, never worried.',rate=.94,seed=131020+len(lines)))
say('ac1_welcome','Welcome to our little animal clinic. Let us help a friend!')
say('ac1_next','Here comes another little friend!')
say('ac1_done','I feel much better. Thank you!','teddy',tone='Joyful grateful child voice. Smile clearly. Exact English. Warm relief, not loud.')
say('ac1_great','You are so gentle!','teddy')
say('ac1_again','Let us help this friend again.')
say('ac1_keep','Gently, gently. You are doing it!','teddy')
say('ac1_two','Which tool can help our friend?')
for t,d in tools.items():
 say(d['clip'],{'hand':'A gentle helping hand.','sponge':'This is a soft sponge.','towel':'This is a fluffy towel.','cotton':'This is soft cotton.','bandage':'This is a little bandage.','brush':'This is a soft brush.','coldpack':'This is a cool pack.'}[t],focus=d['en'])
 say('ac1_choose_'+t,{'hand':'Use your gentle helping hand.','sponge':'Find the soft sponge.','towel':'Find the fluffy towel.','cotton':'Find the soft cotton.','bandage':'Find the little bandage.','brush':'Find the soft brush.','coldpack':'Find the cool pack.'}[t],focus=d['en'])
for k,d in steps.items():
 d['clip']='ac1_ask_'+k;d['doneClip']='ac1_step_'+k
 say(d['clip'],d['en'],'teddy')
 say(d['doneClip'],d['done'],'teddy',tone='Happy relieved child voice. Clear English. Gentle gratitude, smiling, exact words.')
actors=[]
for id,name,zh,problem,room,intro in patients:
 say('ac1_intro_'+id,intro)
 say('ac1_thanks_'+id,{'turtle':'I can walk again. Thank you!','ladybug':'I can wiggle my little feet. Thank you!','rabbit':'My fur is clean and fluffy. Thank you!','fox':'My paws are clean again. Thank you!','cat':'My little paw feels better. Thank you!','dog':'My little paw feels better. Thank you!','hedgehog':'No more tickly leaves. Thank you!','squirrel':'My tail is fluffy again. Thank you!','bear':'That feels so much better. Thank you!','panda':'That feels so much better. Thank you!','duck':'Warm and dry. Thank you for helping me!','penguin':'Warm and dry. Thank you for helping me!'}[id],'teddy',tone='Joyful thankful child voice. A lovely smile and relief. Clear exact words, unhurried.')
 actors.append(dict(id=id,name=name,zh=zh,problem=problem,room=room,intro='ac1_intro_'+id,thanks='ac1_thanks_'+id))
content={'PATIENTS':actors,'TOOLS':tools,'STEPS':steps,'PROBLEMS':problems,'CLINIC_LINES':{r['id']:r['text'] for r in lines}}
OUT.mkdir(parents=True,exist_ok=True);ART.mkdir(parents=True,exist_ok=True)
(OUT/'content.js').write_text('export const VERSION='+json.dumps(V)+';\n'+''.join('export const '+k+'='+json.dumps(v,ensure_ascii=False)+';\n' for k,v in content.items()),encoding='utf-8')
(HERE/'speech-lines.json').write_text(json.dumps(apply_lines('frontend-game/games/animal_clinic/audio', lines),ensure_ascii=False,indent=2),encoding='utf-8')
if not (HERE/'reviewed-clips.json').exists():(HERE/'reviewed-clips.json').write_text('{}\n')
print('Prepared',len(actors),'patients,',len(problems),'problems,',len(lines),'speech clips.')
