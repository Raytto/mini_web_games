from pathlib import Path
from pathlib import Path as _WarmPath
import sys as _warm_sys
_warm_sys.path.insert(0, str(_WarmPath(__file__).resolve().parents[1]))
from warm_guide_policy import apply_lines
import os,json
S=Path(__file__).resolve().parents[2]
V='20261002play1'
lines=[]
def say(id,text,profile='guide',tone='Warm playful child guide. Clear natural English, joyful and unhurried.'):
    lines.append(dict(id=id,text=text,voice_profile=profile,scene='Preschool play: '+id,stress=[],instruction=tone,rate=.94,seed=6810+len(lines)))

for id,text in {
 'pf_again':'Let’s play again!','pf_nice':'You did it!','pf_try':'Let’s try again.','pf_listen':'Let’s listen.',
 'pf_free':'Let’s play your way.','pf_next':'Here comes a new friend!','pf_help':'Tap me to listen again.',
 'hs_short':'Short hair, please.','hs_long':'Long hair, please.','hs_neat':'Brush my hair, please.',
 'hs_cut':'Let’s cut your hair.','hs_brush':'Let’s brush your hair.','hs_grow':'Let’s grow it back.',
 'hs_short_done':'My hair is short! I love it!','hs_long_done':'My hair is long! I love it!',
 'hs_neat_done':'So neat and smooth! Thank you!','hs_giggle':'That tickles!','hs_photo':'Look at my new hair!',
 'hs_red':'Red hair!','hs_blue':'Your hair is blue.','hs_yellow':'Yellow hair!',
 'hs_finish':'Three happy friends. What lovely hair!',
 'sp_cut':'Cut the rope.','sp_red':'Cut the red rope.','sp_blue':'Cut the blue rope.',
 'sp_red_other':'That’s the red rope. Try the blue rope.','sp_blue_other':'That’s the blue rope. Try the red rope.',
 'sp_down':'Down it goes!','sp_roll':'Look! It’s rolling!','sp_bounce':'Bounce, bounce!',
 'sp_basket':'It’s in the basket!','sp_thanks':'Thank you for the picnic!',
 'sp_apple':'A juicy apple!','sp_pear':'A lovely pear!','sp_orange':'A sweet orange!',
 'sp_next':'Let’s find another picnic.','sp_finish':'Our picnic is ready. Yummy!',
 'ls_intro':'Pick a friend. Let’s make a story!', 'ls_play':'Let’s watch our little story.',
 'ls_finish':'What a lovely story!', 'ls_new':'A new place to play!', 'ls_move':'Pick me up and move me.',
 'ls_wrong':'Here I am! Let’s listen again.',
}.items():say(id,text,'pip' if id.startswith('hs_') else 'guide')

for id,text in {
 'gn_light':'Turn off the light, please.', 'gn_curtain':'Close the curtains, please.',
 'gn_music':'Turn off the music, please.', 'gn_light_off':'The light is off.', 'gn_light_on':'The light is on.',
 'gn_curtain_closed':'The curtains are closed.', 'gn_curtain_open':'The curtains are open.',
 'gn_music_off':'It’s quiet now.', 'gn_music_on':'The music is on.',
 'gn_sleepy':'I’m sleepy.', 'gn_hug':'A gentle hug. Thank you.',
 'gn_next':'Another friend is getting sleepy.', 'gn_finish':'Everyone is asleep. Good night!',
}.items():say(id,text,'guide','Gentle sleepy child voice. Soft, clear, cozy English, warm and reassuring.')
for a,name in [('rabbit','Bunny'),('bear','Bear'),('cat','Kitty')]:say('gn_night_'+a,'Good night, '+name+'.','guide','A tender quiet goodnight. Warm clear child voice, peaceful and smiling.')

for animal in ['cat','rabbit','bear','duck','fox','owl']:
 say('ls_'+animal,'Here’s the '+animal+'!')
places=[('on_table','on the table'),('under_table','under the table'),('in_box','in the box'),
 ('on_bench','on the bench'),('under_bench','under the bench'),('in_basket','in the basket'),
 ('on_log','on the log'),('under_bridge','under the bridge'),('in_tent','in the tent')]
for key,place in places:
 say('ls_ask_'+key,'Put me '+place+', please.','pip')
 say('ls_at_'+key,'You’re '+place+'!')
say('ls_under_hint','Try a spot underneath.');say('ls_in_hint','Let’s go inside.');say('ls_on_hint','Try a spot on top.')

assert len({x['id'] for x in lines})==len(lines)
repairs={'pf_free','ls_fox','sp_cut','ls_at_in_box','gn_sleepy','ls_at_in_basket','hs_giggle','sp_blue_other','sp_red'}
for row in lines:
 if row['id'] in repairs:
  row['seed']+=20000;row['rate']=.91
  row['instruction']='Clear natural English. Crisp first word. Exact words only, no fillers. Warm, unhurried child voice.'
  if row['id'] in ['sp_cut','sp_red','sp_blue_other']:
   row['instruction']='Clear child English. Emphasize CUT and ROPE. No fillers. Speak the exact sentence.'
  row['text']=row['text'].replace('You’re','You are').replace('I’m','I am')
p=S/'scripts/playful-four/speech-lines.json';p.write_text(json.dumps(apply_lines('frontend-game/games/playful_shared/audio', lines),ensure_ascii=False,indent=2))
config={x['id']:x['text'] for x in lines}
(S/'frontend-game/games/playful_shared/lines.js').write_text('export const VERSION='+json.dumps(V)+';\nexport const LINES='+json.dumps(config,ensure_ascii=False)+';\n')
reviews=S/'scripts/playful-four/reviewed-clips.json'
if not reviews.exists():reviews.write_text('{}\n')
print('Prepared',len(lines),'scene-specific English clips.')
