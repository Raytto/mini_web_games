import {PlayVoice} from '../playful_shared/voice.js?v=20261017warm1';
const WARM_GUIDE_AUDIO_IDS = new Set(["ac1_choose_bandage","ac1_choose_brush","ac1_choose_coldpack","ac1_choose_cotton","ac1_choose_hand","ac1_choose_sponge","ac1_choose_towel","ac1_intro_bear","ac1_intro_cat","ac1_intro_dog","ac1_intro_duck","ac1_intro_fox","ac1_intro_hedgehog","ac1_intro_ladybug","ac1_intro_panda","ac1_intro_penguin","ac1_intro_rabbit","ac1_intro_squirrel","ac1_intro_turtle","ac1_next","ac1_tool_bandage","ac1_tool_brush","ac1_tool_coldpack","ac1_tool_cotton","ac1_tool_hand","ac1_tool_sponge","ac1_tool_towel"]);
import {VERSION} from './content.js?v=20261013clinic3';
export class ClinicVoice extends PlayVoice {
 async load(id) {
  if(!/^ac1_[a-z0-9_]{2,55}$/.test(id))throw new Error('Invalid clinic clip');
  if(this.buffers.has(id))return this.buffers.get(id);
  if(this.loading.has(id))return this.loading.get(id);
  const task=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);try{
   const r=await fetch(new URL(`audio/${id}.mp3?v=${WARM_GUIDE_AUDIO_IDS.has(id) ? '20261017warm1' : VERSION}`,import.meta.url),{signal:controller.signal});if(!r.ok)throw new Error('Audio unavailable');
   const b=await this.context().decodeAudioData(await r.arrayBuffer());this.buffers.set(id,b);
   while(this.buffers.size>32)this.buffers.delete(this.buffers.keys().next().value);return b;
  }finally{clearTimeout(timer);this.loading.delete(id);}})();this.loading.set(id,task);return task;
 }
}
