import {VOICE_VERSION} from './cases.js?v=20261003kite1';
const WARM_GUIDE_AUDIO_IDS = new Set(["ld_complete_v2","ld_hello","ld_hint_apple","ld_hint_banana","ld_hint_beach_swimmer","ld_hint_blue_buttons","ld_hint_blue_car","ld_hint_blue_cup","ld_hint_blue_feather","ld_hint_blue_tail","ld_hint_bus_window","ld_hint_button","ld_hint_cookie","ld_hint_crumb_trail","ld_hint_feather","ld_hint_footprints","ld_hint_garden_help","ld_hint_grapes","ld_hint_green_boots","ld_hint_green_bus","ld_hint_green_tracks","ld_hint_high_shelf","ld_hint_kite_string","ld_hint_mud","ld_hint_night_reader","ld_hint_orange_snack","ld_hint_orange_tracks","ld_hint_paint","ld_hint_penguin_shadow","ld_hint_polka_dots","ld_hint_puddle","ld_hint_rain_visitor","ld_hint_rainbow_gate","ld_hint_red_tail","ld_hint_reeds","ld_hint_scarf","ld_hint_sock","ld_hint_strawberry","ld_hint_striped_hat","ld_hint_white_buttons","ld_hint_yellow_boots","ld_hint_yellow_van","ld_question_apple","ld_question_banana","ld_question_beach_swimmer","ld_question_blue_buttons","ld_question_blue_car","ld_question_blue_cup","ld_question_blue_feather","ld_question_blue_tail","ld_question_bus_window","ld_question_button","ld_question_cookie","ld_question_crumb_trail","ld_question_feather","ld_question_footprints","ld_question_garden_help","ld_question_grapes","ld_question_green_boots","ld_question_green_bus","ld_question_green_tracks","ld_question_high_shelf","ld_question_kite_string","ld_question_mud","ld_question_night_reader","ld_question_orange_snack","ld_question_orange_tracks","ld_question_paint","ld_question_penguin_shadow","ld_question_polka_dots","ld_question_puddle","ld_question_rain_visitor","ld_question_rainbow_gate","ld_question_red_tail","ld_question_reeds","ld_question_scarf","ld_question_sock","ld_question_strawberry","ld_question_striped_hat","ld_question_white_buttons","ld_question_yellow_boots","ld_question_yellow_van","ld_wrong_bear_0","ld_wrong_bear_1","ld_wrong_bear_2","ld_wrong_bear_3","ld_wrong_blue_bird_0","ld_wrong_blue_bird_1","ld_wrong_blue_bird_2","ld_wrong_blue_bird_3","ld_wrong_blue_car_0","ld_wrong_blue_car_1","ld_wrong_blue_car_2","ld_wrong_blue_car_3","ld_wrong_cat_0","ld_wrong_cat_1","ld_wrong_cat_2","ld_wrong_cat_3","ld_wrong_dog_0","ld_wrong_dog_1","ld_wrong_dog_2","ld_wrong_dog_3","ld_wrong_duck_0","ld_wrong_duck_1","ld_wrong_duck_2","ld_wrong_duck_3","ld_wrong_fox_0","ld_wrong_fox_1","ld_wrong_fox_2","ld_wrong_fox_3","ld_wrong_giraffe_0","ld_wrong_giraffe_1","ld_wrong_giraffe_2","ld_wrong_giraffe_3","ld_wrong_green_bus_0","ld_wrong_green_bus_1","ld_wrong_green_bus_2","ld_wrong_green_bus_3","ld_wrong_owl_0","ld_wrong_owl_1","ld_wrong_owl_2","ld_wrong_owl_3","ld_wrong_panda_0","ld_wrong_panda_1","ld_wrong_panda_2","ld_wrong_panda_3","ld_wrong_penguin_0","ld_wrong_penguin_1","ld_wrong_penguin_2","ld_wrong_penguin_3","ld_wrong_rabbit_0","ld_wrong_rabbit_1","ld_wrong_rabbit_2","ld_wrong_rabbit_3","ld_wrong_red_car_0","ld_wrong_red_car_1","ld_wrong_red_car_2","ld_wrong_red_car_3","ld_wrong_rhino_0","ld_wrong_rhino_1","ld_wrong_rhino_2","ld_wrong_rhino_3","ld_wrong_tiger_0","ld_wrong_tiger_1","ld_wrong_tiger_2","ld_wrong_tiger_3","ld_wrong_yellow_van_0","ld_wrong_yellow_van_1","ld_wrong_yellow_van_2","ld_wrong_yellow_van_3","ld_yes_apple","ld_yes_banana","ld_yes_beach_swimmer","ld_yes_blue_buttons","ld_yes_blue_car","ld_yes_blue_cup","ld_yes_blue_feather","ld_yes_blue_tail","ld_yes_bus_window","ld_yes_button","ld_yes_cookie","ld_yes_crumb_trail","ld_yes_feather","ld_yes_footprints","ld_yes_garden_help","ld_yes_grapes","ld_yes_green_boots","ld_yes_green_bus","ld_yes_green_tracks","ld_yes_high_shelf","ld_yes_kite_string","ld_yes_mud","ld_yes_night_reader","ld_yes_orange_snack","ld_yes_orange_tracks","ld_yes_paint","ld_yes_penguin_shadow","ld_yes_polka_dots","ld_yes_puddle","ld_yes_rain_visitor","ld_yes_rainbow_gate","ld_yes_red_tail","ld_yes_reeds","ld_yes_scarf","ld_yes_sock","ld_yes_strawberry","ld_yes_striped_hat","ld_yes_white_buttons","ld_yes_yellow_boots","ld_yes_yellow_van"]);

import {LINES} from './lines.js?v=20261001feather1';

// One bounded English narrator; interrupted clues never resume in a later case.
export class DetectiveVoice {
  constructor(onState) {
    this.onState=onState;this.serial=0;this.buffers=new Map();this.loading=new Map();this.active=null;
    this.enabled=true;this.hidden=false;this.failedUntil=0;this.ducked=null;
    try{this.enabled=localStorage.getItem('xiaoxiaoEnglishVoiceEnabled')!=='false';}catch{}
  }
  context() {
    if(this.ctx&&this.ctx.state!=='closed')return this.ctx;
    let borrowed;try{if(parent!==window)borrowed=parent.gameSpeechContext?.('little_detective');}catch{}
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!borrowed&&!Audio)throw new Error('Audio unavailable');
    this.ctx=borrowed||new Audio();this.gain=this.ctx.createGain();this.gain.gain.value=1.2;this.gain.connect(this.ctx.destination);
    return this.ctx;
  }
  unlock() {
    if(!this.enabled||this.hidden)return;
    try{void this.context().resume().catch(()=>{});}catch{}
  }
  async load(id) {
    if(!Object.hasOwn(LINES,id))throw new Error('Invalid clip');
    if(this.buffers.has(id))return this.buffers.get(id);
    if(this.loading.has(id))return this.loading.get(id);
    const task=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
      try{
        const response=await fetch(new URL(`audio/${id}.mp3?v=${WARM_GUIDE_AUDIO_IDS.has(id) ? '20261017warm1' : VOICE_VERSION}`,import.meta.url),{signal:controller.signal});
        if(!response.ok)throw new Error('Audio download failed');
        const buffer=await this.context().decodeAudioData(await response.arrayBuffer());
        this.buffers.set(id,buffer);while(this.buffers.size>24)this.buffers.delete(this.buffers.keys().next().value);
        return buffer;
      }finally{clearTimeout(timer);this.loading.delete(id);}
    })();
    this.loading.set(id,task);return task;
  }
  prefetch(id) {if(this.enabled&&!this.hidden&&Date.now()>this.failedUntil)void this.load(id).catch(()=>{});}
  duck(on) {
    try{
      const bgm=parent.document.getElementById('bgm');if(!bgm)return;
      if(on&&!this.ducked){const volume=bgm.volume;this.ducked={bgm,volume,lower:volume*.2};bgm.volume=volume*.2;}
      if(!on&&this.ducked){const d=this.ducked;this.ducked=null;if(Math.abs(d.bgm.volume-d.lower)<.002)d.bgm.volume=d.volume;}
    }catch{}
  }
  stop() {
    this.serial++;const active=this.active;this.active=null;
    if(active){clearTimeout(active.timer);try{active.source?.stop();}catch{}active.finish?.(false);}
    this.duck(false);this.onState({speaking:false});
  }
  play(id,{retry=false}={}) {
    if(!this.enabled||this.hidden)return Promise.resolve(false);
    if(this.active?.id===id)return this.active.promise;
    if(!retry&&Date.now()<this.failedUntil)return Promise.resolve(false);
    this.stop();const token=this.serial;
    const active={id,source:null};this.active=active;
    active.promise=(async()=>{
      let loadTimer;
      try{
        const context=this.context();
        const setup=Promise.all([context.resume(),this.load(id)]);
        const [,buffer]=await Promise.race([setup,new Promise((_,reject)=>{loadTimer=setTimeout(()=>reject(new Error('Sound not ready')),2200);})]);
        clearTimeout(loadTimer);
        if(token!==this.serial||this.hidden||!this.enabled)return false;
        this.failedUntil=0;
        return await new Promise(resolve=>{
          active.finish=resolve;const source=context.createBufferSource();active.source=source;
          source.buffer=buffer;source.connect(this.gain);source.onended=()=>resolve(true);
          active.timer=setTimeout(()=>{try{source.stop();}catch{}resolve(false);},Math.min(9000,buffer.duration*1000+600));
          this.duck(true);this.onState({speaking:true,id,ready:true});source.start();
        });
      }catch{
        if(token===this.serial){this.failedUntil=this.ctx?.state==='suspended'?0:Date.now()+10000;this.onState({failed:true});}
        return false;
      }finally{
        clearTimeout(loadTimer);clearTimeout(active.timer);try{active.source?.disconnect();}catch{}
        if(this.active===active){this.active=null;this.duck(false);this.onState({speaking:false});}
      }
    })();return active.promise;
  }
  setEnabled(value) {
    this.enabled=value;try{localStorage.setItem('xiaoxiaoEnglishVoiceEnabled',String(value));}catch{}
    if(!value)this.stop();else{this.failedUntil=0;this.unlock();}
    this.onState({enabled:value});
  }
  setHidden(value) {this.hidden=value;if(value)this.stop();}
}
