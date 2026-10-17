from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).parent;OUT=ROOT/'frontend-game/games/draw_swim'
lines=[]
def say(id,text,profile='guide',focus='',instruction='Warm curious child voice. Clear exact English. Playful and encouraging.'):
 lines.append(dict(id='ds1_'+id,text=text,voice_profile=profile,scene='Draw and Swim: '+id,focus=focus,stress=[focus] if focus else [],instruction=instruction,rate=.95,seed=131100+len(lines)))
for id,text in [
 ('welcome','Let us draw a little fish!'),('head','Draw a head. Wobbly lines are welcome!'),('body','Now draw the body. Make it your way!'),('tail','Draw a tail. It will wiggle!'),('eye','Tap to give your fish an eye.'),
 ('head_done','A little head! Now for the body.'),('body_done','There is the body! Time for a tail.'),('ready','Your fish is ready. Let it swim!'),('alive','Look! Your very own fish is swimming!'),('follow','Tap the water. Your fish will follow.'),('another','Let us draw another little fish.'),('edit','Let us add a few more lines.'),('undo','That last little mark is gone.'),('clear','A fresh space for this part.'),('slow','Slow and gentle.'),('fast','Wiggle, wiggle. Swim a little faster!'),('hello','Hello, little fish!'),('gallery','Look at the fish you made!'),('hint','Try drawing along the big dotted line.'),('saved','Your little fish is here.'),('limit','Lots of lovely lines! Let us make them swim!')]:say(id,text,profile='teddy' if id in ['alive','hello','ready','slow','fast'] else 'guide')
for id,text in [('coral','Red.'),('gold','Yellow.'),('teal','Green.'),('blue','Blue.'),('purple','Purple.')]:say(id,text,focus=text.rstrip('.'))
say('next_part','Ready? Tap the arrow for the next part.')
new_lines=[
 ('welcome','Choose a sea friend. Draw it your way!'),
 ('fish','A little fish. Follow the dotted shape, or draw your own!'),
 ('goldfish','A goldfish, with a big, flowing tail!'),
 ('puffer','A round pufferfish, with little fins!'),
 ('angelfish','An angelfish, with tall, pointy fins!'),
 ('ray','A ray, with wide, wavy fins!'),
 ('seahorse','A seahorse, with a curly tail!'),
 ('hint','Draw anywhere on the paper. Wobbly lines are welcome!'),
 ('ready','Ready? Tap the arrow to make it swim!'),
 ('clear','A fresh page. What will you draw?'),
 ('another','Let us draw another sea friend.'),
 ('alive','Look! Your sea friend is swimming!'),
 ('follow','Tap the water. Your sea friends will follow.'),
 ('eye','Tap to add an eye.'),('hello','Hello, little sea friend!'),
 ('gallery','Look at all your sea friends!'),('saved','Your sea friends are here.'),
 ('limit','Lots of lovely lines. Let us make them swim!')]
for i,(id,text) in enumerate(new_lines):
 lines.append(dict(id='ds2_'+id,text=text,voice_profile='teddy' if id in ['alive','hello','ready'] else 'guide',scene='Draw a complete sea friend: '+id,focus=id if id in ['fish','goldfish','puffer','angelfish','ray','seahorse'] else '',instruction='Warm curious child voice. Clear exact English. Playful and encouraging.',rate=.95,seed=131600+i))
# Current, calm delivery. Previous clips keep their IDs for cached/older clients.
soft_text={
 'welcome':'Choose a sea friend. Draw it your way.',
 'fish':'A little fish. Follow the dotted shape, or draw your own.',
 'goldfish':'A goldfish, with a big, flowing tail.',
 'puffer':'A round pufferfish, with little fins.',
 'angelfish':'An angelfish, with tall, pointy fins.',
 'ray':'A ray, with wide, wavy fins.',
 'seahorse':'A seahorse, with a curly tail.',
 'hint':'Draw anywhere on the paper. Wobbly lines are welcome.',
 'ready':'When you are ready, touch the arrow to let it swim.',
 'clear':'A fresh page. What would you like to draw?',
 'another':'Let us draw another sea friend.',
 'alive':'Look, your little friend is swimming.',
 'follow':'Touch the water to guide a little friend.',
 'eye':'You can add an eye here.',
 'hello':'Hello, little friend.',
 'gallery':'Here are the sea friends you made.',
 'saved':'Your sea friends are here.',
 'limit':'So many lovely lines. Shall we let them swim?',
 'edit':'Let us add a few more lines.',
 'undo':'That last little mark is gone.',
 'slow':'Slow and gentle.',
 'fast':'A little wiggle, a little faster.',
 'coral':'Red.', 'gold':'Yellow.', 'teal':'Green.', 'blue':'Blue.', 'purple':'Purple.',
 'wave':'A little wave for you.',
 'explore':'Let us explore over here.',
 'together':'It is lovely to swim with you.',
 'coming':'Here comes your little friend.'}
soft=[]
for i,(id,text) in enumerate(soft_text.items()):
 soft.append(dict(id='ds3_'+id,text=text,voice_profile='guide',scene='Draw and Swim, gentle: '+id,focus='',stress=[],instruction='Read warmly and gently to a young child. Natural even stress, no emphatic words, no shouting.',rate=.94,seed=131900+i))
lines.extend(soft)
feeding=[]
for i,(id,text) in enumerate([
 ('feed','Touch the water to give your friends a little food.'),
 ('food','You can drag a little food into the water.'),
 ('yummy','What a lovely little snack.'),
 ('thanks','Thank you for the food.'),
 ('tasty','That tastes lovely.'),
 ('full','My tummy is full. Thank you.')]):
 feeding.append(dict(id='ds4_'+id,text=text,voice_profile='guide',scene='Draw and Swim, feeding: '+id,focus='',stress=[],instruction='Read warmly and gently to a young child. Natural even stress, no emphatic words, no shouting.',rate=.94,seed=132700+i))
lines.extend(feeding)
(HERE/'speech-feeding.json').write_text(json.dumps(feeding,ensure_ascii=False,indent=2))
content={'PARTS':[{'id':'head','en':'Head','zh':'头'},{'id':'body','en':'Body','zh':'身体'},{'id':'tail','en':'Tail','zh':'尾巴'}], 'COLORS':[{'id':'coral','hex':'#e96359','en':'Red','zh':'红色'},{'id':'gold','hex':'#bd8508','en':'Yellow','zh':'黄色'},{'id':'teal','hex':'#138775','en':'Green','zh':'绿色'},{'id':'blue','hex':'#3472bd','en':'Blue','zh':'蓝色'},{'id':'purple','hex':'#9253aa','en':'Purple','zh':'紫色'}], 'DRAW_LINES':{r['id']:r['text'] for r in lines}}
catalog=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import('./frontend-game/games/draw_swim/templates.js').then(m=>console.log(JSON.stringify(m.TEMPLATES.map(({id,en,zh,speech})=>({id,en,zh,speech})))))"],cwd=ROOT,text=True))
extra_colors=[('orange','#e79431','Orange','橙色'),('pink','#dc82a5','Pink','粉色'),('cyan','#24a7bb','Light blue','浅蓝'),('lime','#87af43','Light green','浅绿'),('brown','#8c654b','Brown','棕色'),('gray','#7a858e','Gray','灰色'),('black','#334754','Black','黑色')]
content['COLORS'].extend(dict(id=id,hex=hex,en=en,zh=zh) for id,hex,en,zh in extra_colors)
for c in content['COLORS']:c['speech']=('ds3_' if c['id'] in ['coral','gold','teal','blue','purple'] else 'ds5_')+c['id']
new_text=[(t['id'],('An ' if t['en'][0].lower() in 'aeiou' else 'A ')+t['en'].lower()+'. You can draw it your way.') for t in catalog if t['speech'].startswith('ds5_')]
new_text+=[(id,en+'.') for id,hex,en,zh in extra_colors]
repairs={'blue_tang':'This is a blue tang.', 'lionfish':'Meet a lionfish. You can draw your own.', 'eel':'This is an eel.', 'tuna':'Meet a tuna. You can draw your own.', 'pink':'This one is pink.', 'lime':'This one is light green.', 'gray':'This one is gray.'}
new_text=[(id,repairs.get(id,text)) for id,text in new_text]
new_text += [('erase','You can gently rub out a little part.'),('shuffle','Here are some more sea friends.'),('library','Here are your drawings. You can bring a friend into the sea.'),('stored','Your oldest friend is resting in your book.'),('return','Your little friend is back in the sea.')]
expanded=[dict(id='ds5_'+id,text=text,voice_profile='guide',scene='Draw and Swim, collection: '+id,focus='',stress=[],instruction='Read warmly and gently to a young child. Natural even stress, no emphatic words, no shouting.',rate=.9,seed=133100+i) for i,(id,text) in enumerate(new_text)]
lines.extend(expanded);content['DRAW_LINES'].update({r['id']:r['text'] for r in expanded})
(HERE/'speech-collection.json').write_text(json.dumps(expanded,ensure_ascii=False,indent=2))
content['GREETINGS']=['ds3_hello','ds3_wave','ds3_explore','ds3_together','ds3_coming']
OUT.mkdir(parents=True,exist_ok=True);(OUT/'content.js').write_text('export const VERSION="20261013swim8";\n'+''.join('export const '+k+'='+json.dumps(v,ensure_ascii=False)+';\n' for k,v in content.items()))
(HERE/'speech-lines.json').write_text(json.dumps(lines,ensure_ascii=False,indent=2));(HERE/'reviewed-clips.json').write_text('{}\n');print('Prepared',len(lines),'speech clips.')

(HERE/'speech-new-species.json').write_text(json.dumps([r for r in lines if r['id'].startswith('ds2_')],ensure_ascii=False,indent=2))

(HERE/'speech-gentle.json').write_text(json.dumps(soft,ensure_ascii=False,indent=2))
