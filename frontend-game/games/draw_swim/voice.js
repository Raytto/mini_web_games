import {PlayVoice} from '../playful_shared/voice.js?v=20261017warm1';
const WARM_GUIDE_AUDIO_IDS = new Set(["ds3_alive","ds3_angelfish","ds3_another","ds3_blue","ds3_coming","ds3_coral","ds3_edit","ds3_explore","ds3_eye","ds3_fast","ds3_fish","ds3_gold","ds3_goldfish","ds3_hello","ds3_hint","ds3_limit","ds3_puffer","ds3_purple","ds3_ray","ds3_ready","ds3_saved","ds3_seahorse","ds3_slow","ds3_teal","ds3_wave","ds4_feed","ds4_food","ds5_black","ds5_blue_tang","ds5_brown","ds5_butterflyfish","ds5_catfish","ds5_clownfish","ds5_cyan","ds5_dolphin","ds5_eel","ds5_erase","ds5_flying_fish","ds5_gray","ds5_hammerhead","ds5_jellyfish","ds5_koi","ds5_library","ds5_lime","ds5_lionfish","ds5_octopus","ds5_orange","ds5_orca","ds5_pink","ds5_return","ds5_salmon","ds5_sea_turtle","ds5_seal","ds5_shark","ds5_shuffle","ds5_squid","ds5_starfish","ds5_stored","ds5_sunfish","ds5_swordfish","ds5_tuna","ds5_whale","ds5_whale_shark"]);
import {VERSION} from './content.js?v=20261013swim8';
export class DrawVoice extends PlayVoice {
 async load(id){
  if(!/^ds[12345]_[a-z0-9_]{2,55}$/.test(id))throw new Error('Invalid draw clip');
  if(this.buffers.has(id))return this.buffers.get(id);
  if(this.loading.has(id))return this.loading.get(id);
  const task=(async()=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);
   try{const r=await fetch(new URL('audio/'+id+'.mp3?v='+(WARM_GUIDE_AUDIO_IDS.has(id) ? '20261017warm1' : VERSION),import.meta.url),{signal:c.signal});
    if(!r.ok)throw new Error('Audio unavailable');const b=await this.context().decodeAudioData(await r.arrayBuffer());
    this.buffers.set(id,b);while(this.buffers.size>32)this.buffers.delete(this.buffers.keys().next().value);return b;
   }finally{clearTimeout(timer);this.loading.delete(id);}
  })();this.loading.set(id,task);return task;
 }
}
