#!/usr/bin/env python3
"""Resumable approved guide voice generation. Never edits live game audio/references.

Permanent results are new, reusable MP3s plus provenance and independent ASR.
Transient WAVs and ffmpeg temporary files live under --runtime-dir only.
"""
import argparse,base64,concurrent.futures,fcntl,hashlib,importlib.util,json,os,re,subprocess,tempfile,threading,time,urllib.request
from pathlib import Path

ROOT=Path('/srv/workspace/mini_web_games')
spec=importlib.util.spec_from_file_location('speech',ROOT/'scripts/english-learning/generate-speech.py')
speech=importlib.util.module_from_spec(spec);spec.loader.exec_module(speech)

def dump(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True);t=p.with_name(p.name+'.tmp');t.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');t.replace(p)
def normalized(text):
 text=text.lower().replace('’',"'").replace("let's",'let us').replace("it's",'it is').replace("you're",'you are')
 text=re.sub(r'\b1\b','one',text);text=re.sub(r'\b3\b','three',text)
 return re.sub('[^a-z0-9]','',text)

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--work-dir',type=Path,required=True);parser.add_argument('--runtime-dir',type=Path,required=True);parser.add_argument('--workers',type=int,default=6,choices=range(1,9));parser.add_argument('--asr-workers',type=int,default=3,choices=range(1,9));args=parser.parse_args()
 w=args.work_dir;w.mkdir(parents=True,exist_ok=True);guard=(w/'generation.lock').open('a');fcntl.flock(guard,fcntl.LOCK_EX|fcntl.LOCK_NB)
 config=json.loads((w/'profiles.json').read_text());lines=json.loads((w/'lines.json').read_text());plan=json.loads((w/'plan.json').read_text());profile=config['profiles']['warm_guide'];assert config['model']==profile['target_model']==speech.MODEL;assert profile['voice_id']==plan['voice_id'];assert len(lines)==len({x['id'] for x in lines})
 key=speech.read_key(Path('/srv/data/chatgpt-work/config/app.env'));audio=w/'audio';records=w/'records';asr=w/'asr'
 for p in [audio,records,asr]:p.mkdir(exist_ok=True)
 lock=threading.Lock();state={'phase':'generating','started_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'total':len(lines),'generated':0,'asr_checked':0,'asr_match':0,'asr_review':0,'generation_failures':[],'asr_failures':[],'model':speech.MODEL,'voice_id':profile['voice_id'],'source_script_sha256':speech.sha(Path(__file__)),'plan_sha256':speech.sha(w/'plan.json')}
 def update(**kw):
  with lock:
   for k,v in kw.items():
    if k.endswith('_increment'):state[k[:-10]]+=v
    elif k.endswith('_append'):state[k[:-7]].append(v)
    else:state[k]=v
   state['updated_at']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());dump(w/'status.json',state)
 update()
 def synth(item):
  ident=item['id'];assert re.fullmatch('wg_[a-f0-9]{20}',ident);assert item['voice_profile']=='warm_guide';assert len(item['instruction'])<=100
  payload={'model':speech.MODEL,'input':{'text':item['text'],'voice':profile['voice_id'],'format':'wav','sample_rate':24000,'rate':item['rate'],'pitch':1.,'volume':50,'language_hints':['en'],'instruction':item['instruction'],'seed':item['seed']}}
  fingerprint=hashlib.sha256(json.dumps([payload,speech.PROCESSING],sort_keys=True).encode()).hexdigest();target=audio/(ident+'.mp3');meta=records/(ident+'.json')
  cached=json.loads(meta.read_text()) if meta.exists() else {}
  if cached.get('fingerprint')==fingerprint and target.exists() and speech.sha(target)==cached.get('sha256'):
   update(generated_increment=1);return cached
  for attempt in range(4):
   try:
    result=speech.request_json(speech.ENDPOINT,payload,key);url=result.get('output',{}).get('audio',{}).get('url');assert url,'missing audio URL'
    with urllib.request.urlopen(url.replace('http://','https://',1),timeout=60) as response:raw=speech.normalize_wav(response.read(speech.MAX_RAW_BYTES+1))
    args.runtime_dir.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=ident+'-',dir=args.runtime_dir) as temp:
     wav=Path(temp)/'raw.wav';mp3=Path(temp)/'clip.mp3';wav.write_bytes(raw)
     subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','80k',str(mp3)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
     measures=speech.probe(mp3);os.replace(mp3,target)
    clip={**item,'model':speech.MODEL,'voice':profile['voice_id'],'file':target.name,'fingerprint':fingerprint,'raw_sha256':hashlib.sha256(raw).hexdigest(),**measures};dump(meta,clip);update(generated_increment=1);print('GENERATED',ident,measures['duration'],flush=True);return clip
   except Exception as e:
    if attempt==3:raise RuntimeError(type(e).__name__) from None
    print('RETRY_GENERATION',ident,attempt+1,type(e).__name__,flush=True);time.sleep(2**attempt)
 def check(clip):
  ident=clip['id'];p=asr/(ident+'.json');old=json.loads(p.read_text()) if p.exists() else {}
  if old.get('sha256')==clip['sha256'] and old.get('expected')==clip['text'] and old.get('status') in ['match','review']:entry=old
  else:
   payload={'model':'qwen3-asr-flash','messages':[{'role':'user','content':[{'type':'input_audio','input_audio':{'data':'data:audio/mpeg;base64,'+base64.b64encode((audio/clip['file']).read_bytes()).decode()}}]}],'stream':False,'asr_options':{'language':'en','enable_itn':False}}
   for attempt in range(4):
    try:
     result=speech.request_json('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',payload,key);text=result['choices'][0]['message']['content'];assert isinstance(text,str)
     entry={'id':ident,'sha256':clip['sha256'],'expected':clip['text'],'transcript':text,'model':'qwen3-asr-flash','status':'match' if normalized(text)==normalized(clip['text']) else 'review'};dump(p,entry);break
    except Exception as e:
     if attempt==3:raise RuntimeError(type(e).__name__) from None
     time.sleep(2**attempt)
  update(asr_checked_increment=1,**{'asr_'+entry['status']+'_increment':1});return entry
 clips=[];asr_entries=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=args.asr_workers) as ap,concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as gp:
  gt={gp.submit(synth,x):x['id'] for x in lines};at={}
  for f in concurrent.futures.as_completed(gt):
   ident=gt[f]
   try:c=f.result();clips.append(c);at[ap.submit(check,c)]=ident
   except Exception as e:update(generation_failures_append={'id':ident,'error_type':type(e).__name__});print('GENERATION_FAILED',ident,flush=True)
  update(phase='checking_transcripts');dump(w/'manifest.json',{'model':speech.MODEL,'provider':config['provider'],'synthetic':True,'processing':speech.PROCESSING,'clips':sorted(clips,key=lambda x:x['id'])})
  for f in concurrent.futures.as_completed(at):
   ident=at[f]
   try:asr_entries.append(f.result())
   except Exception as e:update(asr_failures_append={'id':ident,'error_type':type(e).__name__});print('ASR_FAILED',ident,flush=True)
 dump(asr/'summary.json',{'summary':{s:sum(x['status']==s for x in asr_entries) for s in ['match','review']},'clips':sorted(asr_entries,key=lambda x:x['id'])})
 phase='needs_review' if state['generation_failures'] or state['asr_failures'] or state['asr_review'] else 'ready_to_publish';update(phase=phase);print('COMPLETE',phase,state['generated'],state['asr_match'],state['asr_review'],flush=True)

if __name__=='__main__':main()
