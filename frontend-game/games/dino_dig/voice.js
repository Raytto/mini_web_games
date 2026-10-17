import {PlayVoice} from '../playful_shared/voice.js?v=20261002play1';
import {VERSION} from './content.js?v=20261014dig11';
export class DigVoice extends PlayVoice {
 async load(id){
  if(!/^dd[12345]_[a-z0-9_]{2,55}$/.test(id))throw new Error('Invalid dig clip');
  if(this.buffers.has(id))return this.buffers.get(id);
  if(this.loading.has(id))return this.loading.get(id);
  const task=(async()=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);
   try{const r=await fetch(new URL('audio/'+id+'.mp3?v='+VERSION,import.meta.url),{signal:c.signal});
    if(!r.ok)throw new Error('Audio unavailable');const b=await this.context().decodeAudioData(await r.arrayBuffer());
    this.buffers.set(id,b);while(this.buffers.size>32)this.buffers.delete(this.buffers.keys().next().value);return b;
   }finally{clearTimeout(timer);this.loading.delete(id);}
  })();this.loading.set(id,task);return task;
 }
}
