#!/usr/bin/env python3
"""Build the 40-case runtime library without altering existing character cutouts."""
from pathlib import Path
import argparse,hashlib,json
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("--metadata-only",action="store_true");args=parser.parse_args()
if not args.metadata_only:
 from PIL import Image
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'art/little-detective';OUT=ROOT/'frontend-game/games/little_detective/assets';OUT.mkdir(parents=True,exist_ok=True)
CASES=json.loads((ROOT/'scripts/little-detective/cases.json').read_text());assets=[];seen=set();runtime=[]
SPEECH=json.loads((ROOT/'scripts/little-detective/speech-lines.json').read_text());LINES={line['id']:line['text'] for line in SPEECH}
assert len(LINES)==len(SPEECH),'Duplicate speech ID'
for c in CASES:
 for prefix,key in [('question','question'),('hint','hint'),('yes','explanation')]:
  assert LINES.get('ld_'+prefix+'_'+c['id'])==c[key],c['id']+' speech text differs from case metadata'
def record(path,source,**data):
 if path.name in seen:return
 seen.add(path.name);im=Image.open(path);entry={'file':path.name,'source':source,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'size':list(im.size),'mode':im.mode,**data}
 if im.mode=='RGBA':
  entry['transparentPixels']=im.getchannel('A').histogram()[0];assert entry['transparentPixels']>im.width*im.height*.1
 assets.append(entry)
for c in CASES:
 assert type(c.get('difficulty')) is int and 1<=c['difficulty']<=3,'Invalid difficulty: '+c['id']
 new='sceneSource' in c;source=ART/c.get('sceneSource','v1/'+c['id']+'-scene.source.png')
 if not args.metadata_only:assert source.exists(),source
 filename=c.get('sceneAsset','scene-'+c['id']+('-v2' if new else '-v1')+'.webp')
 assert Path(filename).name==filename and filename.endswith('.webp'),'Invalid scene asset: '+filename
 target=OUT/filename
 if not args.metadata_only:
  if new or not target.exists():
   im=Image.open(source).convert('RGB');im.thumbnail((1200,800),Image.Resampling.LANCZOS);im.save(target,quality=87,method=4)
  record(target,str(source.relative_to(ART)),case=c['id'],kind='scene')
  for o in c['options']:
   name=o.get('asset',o['id']+'-v1.webp')
   assert Path(name).name==name and name.endswith('.webp'),'Invalid option asset: '+name
   option=OUT/name;assert option.exists(),option
   record(option,o.get('assetSource','v1/'+c.get('optionsSource',c.get('optionsFrom','')+'-options.source.png')),kind='option',option=o['id'])
 item={k:v for k,v in c.items() if k in ['id','title','question','hint','explanation','clue','correct','sceneFocus','difficulty']};item['sceneAsset']=target.name
 item['options']=[{k:v for k,v in o.items() if k in ['id','kind','label','asset','accessibleLabel']} for o in c['options']];runtime.append(item)
manifest={'method':'built-in image_gen; full-scene WebP compression; reuse reviewed alpha character cutouts','assets':assets,'cases':len(CASES),'optionCount':sum(a['kind']=='option' for a in assets)}
if not args.metadata_only:(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'frontend-game/games/little_detective/cases.js').write_text('export const VERSION="20261001detective2";\nexport const VOICE_VERSION="20261001feather1";\nexport const CASES='+json.dumps(runtime,separators=(',',':'))+';\n')
(ROOT/'frontend-game/games/little_detective/lines.js').write_text('export const LINES='+json.dumps(LINES,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'cases':len(CASES),'metadataOnly':args.metadata_only,'difficultyCounts':{n:sum(c['difficulty']==n for c in CASES) for n in [1,2,3]},'filesBuilt':len(assets)}))
