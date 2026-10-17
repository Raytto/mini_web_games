#!/usr/bin/env python3
from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import json
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).parent;OUT=ROOT/'frontend-game/games/dino_dig';V='20261014dig11'
dinosaurs=[
 ('triceratops','Triceratops','三角龙','forest','Triceratops has three horns.','头上有三只角。'),
 ('stegosaurus','Stegosaurus','剑龙','forest','Stegosaurus has plates on its back.','背上长着骨板。'),
 ('trex','T. rex','霸王龙','canyon','T. rex has two tiny arms.','有两只小小的前肢。'),
 ('brachiosaurus','Brachiosaurus','腕龙','shore','Brachiosaurus has a very long neck.','脖子很长很长。'),
 ('ankylosaurus','Ankylosaurus','甲龙','canyon','Ankylosaurus has a club on its tail.','尾巴末端有骨锤。'),
 ('parasaurolophus','Parasaurolophus','副栉龙','shore','Parasaurolophus has a long crest.','头上有长长的冠。'),
 ('diplodocus', 'Diplodocus', '梁龙', 'forest', 'Diplodocus has a very long tail.', '尾巴很长很长。'),
 ('spinosaurus', 'Spinosaurus', '棘龙', 'shore', 'Spinosaurus has a tall sail on its back.', '背上有高高的帆状结构。'),
 ('velociraptor', 'Velociraptor', '伶盗龙', 'canyon', 'Velociraptor has feathers.', '身上有羽毛。'),
 ('iguanodon', 'Iguanodon', '禽龙', 'forest', 'Iguanodon has a spike on each thumb.', '两只手的拇指各有一个尖刺。'),
 ('allosaurus', 'Allosaurus', '异特龙', 'canyon', 'Allosaurus has three fingers on each hand.', '每只手有三根手指。'),
 ('carnotaurus', 'Carnotaurus', '食肉牛龙', 'canyon', 'Carnotaurus has two horns on its head.', '头上有两只角。'),
 ('pachycephalosaurus', 'Pachycephalosaurus', '肿头龙', 'forest', 'Pachycephalosaurus has a thick, round skull.', '头骨又厚又圆。'),
 ('microraptor', 'Microraptor', '小盗龙', 'forest', 'Microraptor has feathers on its arms and legs.', '前肢和后腿都长着羽毛。'),
 ('therizinosaurus', 'Therizinosaurus', '镰刀龙', 'forest', 'Therizinosaurus has very long claws.', '爪子很长很长。'),
 ('gallimimus', 'Gallimimus', '似鸡龙', 'canyon', 'Gallimimus has long legs for running.', '长长的腿适合奔跑。'),
 ('oviraptor', 'Oviraptor', '窃蛋龙', 'canyon', 'Oviraptor has a beak with no teeth.', '嘴喙里面没有牙齿。'),
 ('corythosaurus', 'Corythosaurus', '冠龙', 'shore', 'Corythosaurus eats plants.', '喜欢吃植物。'),
 ('dilophosaurus', 'Dilophosaurus', '双脊龙', 'shore', 'Dilophosaurus has two crests on its head.', '头上有两片冠。'),
 ('apatosaurus', 'Apatosaurus', '迷惑龙', 'shore', 'Apatosaurus has a long neck.', '有长长的脖子。'),
]
layers=[
 dict(id='soil',tool='shovel',en='Loose soil',zh='松松的表土',color='#826046',strength=.78,clip='dd1_soil',done='dd2_first_glimpse'),
 dict(id='earth',tool='brush',en='Sandy soil',zh='骨头周围的沙土',color='#b58156',strength=.55,clip='dd2_sand',done='dd2_sand_done'),
 dict(id='dust',tool='finebrush',en='Fine dust',zh='薄薄的细沙',color='#d8b58a',strength=.42,clip='dd3_fine',done='dd1_dust_done'),
]
lines=[]
def say(id,text,profile='guide',focus='',emotion='Warm curious child voice. Speak exact clear English, gentle and playful.'):
 lines.append(dict(id=id,text=text,voice_profile=profile,scene='Dino Dig: '+id,focus=focus,stress=[focus] if focus else [],instruction=emotion,rate=.94,seed=131030+len(lines)))
common=[
 ('welcome','Let us look for a dinosaur fossil!'),
 ('soil','Use the little shovel. Scoop away the soil.'),
 ('earth','Use the small pick. Tap the bumpy earth.'),
 ('dust','Use the soft brush. Sweep the dust away.'),
 ('soil_done','Look! There is another layer underneath!'),
 ('earth_done','We are getting closer. Time for the soft brush!'),
 ('dust_done','You found a dinosaur fossil!'),
 ('first_glimpse','Look! A little bit of the fossil is showing!'),
 ('more','Keep going, gently. There is more to find.'),
 ('shovel','This is a little shovel.'),
 ('pick','This is a small pick.'),
 ('brush','This is a soft brush.'),
 ('assemble','Let us put the fossil pieces together.'),
 ('fit','Find where this fossil piece fits.'),
 ('piece_yes','That piece fits!'),
 ('piece_yes2','The pieces are coming together!'),
 ('whole','We found all the pieces!'),
 ('imagine','Let us imagine our dinosaur alive!'),
 ('next','Another fossil is waiting. Let us explore!'),
 ('again','Let us uncover this fossil again.'),
 ('gentle','So gentle. Nice digging!'),
 ('hello','Hello, little explorer!'),
 ('museum','You found so many dinosaurs!'),
 ('move','Try brushing another little spot.'),
]
for key,text in common:say('dd1_'+key,text,profile='teddy' if key in ['piece_yes','piece_yes2','whole','hello','gentle'] else 'guide')
rows=[]
for id,en,zh,site,fact,zhfact in dinosaurs:
 say('dd1_name_'+id,'Tyrannosaurus rex!' if id=='trex' else en+'!',focus=en,emotion='Delighted curious child voice. Clearly say the dinosaur name. Exact words.')
 say('dd1_fact_'+id,fact,focus=en)
 rows.append(dict(id=id,en=en,zh=zh,site=site,fact=fact,zhfact=zhfact,nameClip='dd1_name_'+id,factClip='dd1_fact_'+id))
say('dd1_over_here','Try digging over here!')
say('dd2_sand','Some bones are showing. Gently brush away the sandy soil.')
say('dd2_first_glimpse','Look! Some bones are showing. Let us use a soft brush.')
say('dd2_sand_done','Almost there! Gently sweep away the fine dust.')
say('dd3_take_brush','Here is a soft brush! Tap it or drag it to the soil.')
say('dd3_take_fine','Here is a fine brush! Tap it or drag it to the fossil.')
say('dd3_fine','Use the fine brush. Gently sweep the last dust away.')
say('dd3_finebrush','This is a fine brush.')
say('dd4_start','Here is a little shovel! Touch the soil, or pick up the shovel.')
say('dd4_brush','Here is a soft brush! Touch the soil, or pick up the brush.')
say('dd4_fine','Here is a fine brush! Touch the soil, or pick up the brush.')
say('dd5_next_button','Ready for another dinosaur? Tap the big arrow!')
for line in lines:
 if line['id'] in ['dd1_name_therizinosaurus','dd1_name_apatosaurus','dd1_fact_apatosaurus']:
  line['rate']=.88;line['seed']+=91;line['instruction']='Warm clear child voice. Pronounce '+('uh-PAT-oh-SORE-us' if 'apatosaurus' in line['id'] else 'theh-riz-in-oh-SORE-us')+'. Speak exact words.'
for line in lines:
 if line['id'].endswith(('microraptor','dilophosaurus')):
  line['instruction']='Curious child voice. Clear dinosaur name, warm and unhurried. Speak exact words.';line['rate']=.9
(HERE/'speech-distinct.json').write_text(json.dumps(apply_lines('frontend-game/games/dino_dig/audio', [r for r in lines if r['id'].endswith(('microraptor','dilophosaurus'))]),ensure_ascii=False,indent=2))
content={'DINOSAURS':rows,'LAYERS':layers,'DIG_LINES':{r['id']:r['text'] for r in lines},'TOOLS':{'finebrush':{'en':'Fine brush','zh':'细毛刷'},'shovel':{'en':'Little shovel','zh':'小铲子'},'pick':{'en':'Small pick','zh':'小挖镐'},'brush':{'en':'Soft brush','zh':'软毛刷'}}}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'content.js').write_text('export const VERSION='+json.dumps(V)+';\n'+''.join('export const '+k+'='+json.dumps(v,ensure_ascii=False)+';\n' for k,v in content.items()))
(HERE/'speech-lines.json').write_text(json.dumps(apply_lines('frontend-game/games/dino_dig/audio', lines),ensure_ascii=False,indent=2))
if not(HERE/'reviewed-clips.json').exists():(HERE/'reviewed-clips.json').write_text('{}\n')
print('Prepared',len(rows),'dinosaurs,',len(lines),'speech clips.')
