import {PlayVoice} from '../playful_shared/voice.js?v=20261017warm1';
const WARM_GUIDE_AUDIO_IDS = new Set(["dd1_brush","dd1_dust_done","dd1_fact_allosaurus","dd1_fact_ankylosaurus","dd1_fact_apatosaurus","dd1_fact_brachiosaurus","dd1_fact_carnotaurus","dd1_fact_corythosaurus","dd1_fact_dilophosaurus","dd1_fact_diplodocus","dd1_fact_gallimimus","dd1_fact_iguanodon","dd1_fact_microraptor","dd1_fact_oviraptor","dd1_fact_pachycephalosaurus","dd1_fact_parasaurolophus","dd1_fact_spinosaurus","dd1_fact_stegosaurus","dd1_fact_therizinosaurus","dd1_fact_trex","dd1_fact_triceratops","dd1_fact_velociraptor","dd1_hello","dd1_imagine","dd1_name_allosaurus","dd1_name_ankylosaurus","dd1_name_apatosaurus","dd1_name_brachiosaurus","dd1_name_carnotaurus","dd1_name_corythosaurus","dd1_name_dilophosaurus","dd1_name_diplodocus","dd1_name_gallimimus","dd1_name_iguanodon","dd1_name_microraptor","dd1_name_oviraptor","dd1_name_pachycephalosaurus","dd1_name_parasaurolophus","dd1_name_spinosaurus","dd1_name_stegosaurus","dd1_name_therizinosaurus","dd1_name_trex","dd1_name_triceratops","dd1_name_velociraptor","dd1_next","dd1_over_here","dd1_pick","dd1_shovel","dd1_soil","dd1_welcome","dd2_first_glimpse","dd2_sand","dd2_sand_done","dd3_fine","dd3_finebrush","dd4_brush","dd4_fine","dd4_start","dd5_next_button","dd5_pick_start","dd5_rock_done","dd5_rock_tap"]);
import {VERSION} from './content.js?v=20261014dig11';
export class DigVoice extends PlayVoice {
 async load(id){
  if(!/^dd[12345]_[a-z0-9_]{2,55}$/.test(id))throw new Error('Invalid dig clip');
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
