import {PlayVoice} from '../playful_shared/voice.js?v=20261002play1';
import {VERSION} from './content.js?v=20261013clinic3';
export class ClinicVoice extends PlayVoice {
 async load(id) {
  if(!/^ac1_[a-z0-9_]{2,55}$/.test(id))throw new Error('Invalid clinic clip');
  if(this.buffers.has(id))return this.buffers.get(id);
  if(this.loading.has(id))return this.loading.get(id);
  const task=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);try{
   const r=await fetch(new URL(`audio/${id}.mp3?v=${VERSION}`,import.meta.url),{signal:controller.signal});if(!r.ok)throw new Error('Audio unavailable');
   const b=await this.context().decodeAudioData(await r.arrayBuffer());this.buffers.set(id,b);
   while(this.buffers.size>32)this.buffers.delete(this.buffers.keys().next().value);return b;
  }finally{clearTimeout(timer);this.loading.delete(id);}})();this.loading.set(id,task);return task;
 }
}
