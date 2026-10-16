#!/usr/bin/env python3
"""Independently transcribe each generated MP3; cache by SHA, never supply expected text to ASR."""
import argparse, base64, concurrent.futures, hashlib, importlib.util, json, pathlib, re, time

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--env-file',type=pathlib.Path,required=True)
parser.add_argument('--lines',type=pathlib.Path,default=pathlib.Path(__file__).with_name('lines.json'))
parser.add_argument('--audio',type=pathlib.Path,required=True)
parser.add_argument('--out',type=pathlib.Path,required=True)
parser.add_argument('--available',action='store_true',help='Check only files already generated; reruns reuse matching hashes')
parser.add_argument('--workers',type=int,default=4,choices=range(1,9))
parser.add_argument('--reviews',type=pathlib.Path,default=pathlib.Path(__file__).with_name('reviewed-clips.json'))
args=parser.parse_args()
spec=importlib.util.spec_from_file_location('generator',pathlib.Path(__file__).parents[1]/'english-learning/generate-speech.py')
generator=importlib.util.module_from_spec(spec);spec.loader.exec_module(generator)
key=generator.read_key(args.env_file)
items=json.loads(args.lines.read_text())
reviews=json.loads(args.reviews.read_text()) if args.reviews.exists() else {}
args.out.mkdir(parents=True,exist_ok=True)

def normalized(text):
    text=text.lower().replace('’',"'").replace("let's",'let us').replace("it's",'it is').replace("you're",'you are')
    text=re.sub(r'\b1\b','one',text);text=re.sub(r'\b3\b','three',text)
    return re.sub('[^a-z0-9]','',text)

def check(item):
    ident=item['id'];audio=args.audio/(ident+'.mp3');dst=args.out/(ident+'.json')
    if not audio.exists():
        if args.available:return {'id':ident,'status':'pending'}
        raise RuntimeError('Missing audio '+ident)
    sha=hashlib.sha256(audio.read_bytes()).hexdigest()
    if dst.exists():
        cached=json.loads(dst.read_text())
        if cached.get('sha256')==sha and cached.get('expected')==item['text']:return cached
    payload={'model':'qwen3-asr-flash','messages':[{'role':'user','content':[{'type':'input_audio','input_audio':{'data':'data:audio/mpeg;base64,'+base64.b64encode(audio.read_bytes()).decode()}}]}],
             'stream':False,'asr_options':{'language':'en','enable_itn':False}}
    for attempt in range(4):
        try:
            result=generator.request_json('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',payload,key)
            text=result['choices'][0]['message']['content']
            if not isinstance(text,str):raise RuntimeError('Unexpected transcript format')
            entry={'id':ident,'sha256':sha,'expected':item['text'],'transcript':text,'model':'qwen3-asr-flash',
                   'status':'match' if normalized(text)==normalized(item['text']) else 'review'}
            generator.write_json(dst,entry)
            return entry
        except (RuntimeError,KeyError):
            if attempt==3:raise
            time.sleep(2**attempt)

results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
    tasks={pool.submit(check,item):item['id'] for item in items}
    for future in concurrent.futures.as_completed(tasks):
        ident=tasks[future]
        try:
            entry=future.result()
            review=reviews.get(ident)
            if entry['status']=='review' and review and all(entry.get(k)==review.get(k) for k in ['sha256','expected','transcript']):
                entry={**entry,'status':'reviewed','review_reason':review['reason']}
            results.append(entry)
            if entry['status']!='pending':print(entry['status'].upper(),ident,flush=True)
        except Exception as error:
            results.append({'id':ident,'status':'failed','error_type':type(error).__name__, 'error':str(error) if isinstance(error,RuntimeError) else type(error).__name__})
            print('FAILED',ident,str(error) if isinstance(error,RuntimeError) else type(error).__name__,flush=True)
summary={status:sum(r['status']==status for r in results) for status in ['match','reviewed','review','pending','failed']}
generator.write_json(args.out/'summary.json',{'summary':summary,'clips':results})
print('COMPLETE',json.dumps(summary),flush=True)
if summary['failed'] or summary['review']:raise SystemExit(1)
