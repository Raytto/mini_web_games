import {VERSION} from './lines.js?v=20261002play1';
const WARM_GUIDE_AUDIO_IDS = new Set(["gn2_hello_bear","gn2_hello_cat","gn2_hello_deer","gn2_hello_dog","gn2_hello_elephant","gn2_hello_fox","gn2_hello_koala","gn2_hello_lion","gn2_hello_monkey","gn2_hello_panda","gn2_hello_penguin","gn2_hello_pig","gn2_hello_rabbit","gn2_hello_squirrel","gn2_hello_tiger","gn2_sleep_bear","gn2_sleep_cat","gn2_sleep_deer","gn2_sleep_dog","gn2_sleep_elephant","gn2_sleep_fox","gn2_sleep_koala","gn2_sleep_lion","gn2_sleep_monkey","gn2_sleep_panda","gn2_sleep_penguin","gn2_sleep_pig","gn2_sleep_rabbit","gn2_sleep_squirrel","gn2_sleep_tiger","gn3_story_bear_1","gn3_story_bear_2","gn3_story_bear_3","gn3_story_bear_4","gn3_story_bear_5","gn3_story_bear_6","gn3_story_cat_1","gn3_story_cat_2","gn3_story_cat_3","gn3_story_cat_4","gn3_story_cat_5","gn3_story_cat_6","gn3_story_deer_1","gn3_story_deer_2","gn3_story_deer_3","gn3_story_deer_4","gn3_story_deer_5","gn3_story_deer_6","gn3_story_dog_1","gn3_story_dog_2","gn3_story_dog_3","gn3_story_dog_4","gn3_story_dog_5","gn3_story_dog_6","gn3_story_elephant_1","gn3_story_elephant_2","gn3_story_elephant_3","gn3_story_elephant_4","gn3_story_elephant_5","gn3_story_elephant_6","gn3_story_fox_1","gn3_story_fox_2","gn3_story_fox_3","gn3_story_fox_4","gn3_story_fox_5","gn3_story_fox_6","gn3_story_koala_1","gn3_story_koala_2","gn3_story_koala_3","gn3_story_koala_4","gn3_story_koala_5","gn3_story_koala_6","gn3_story_lion_1","gn3_story_lion_2","gn3_story_lion_3","gn3_story_lion_4","gn3_story_lion_5","gn3_story_lion_6","gn3_story_monkey_1","gn3_story_monkey_2","gn3_story_monkey_3","gn3_story_monkey_4","gn3_story_monkey_5","gn3_story_monkey_6","gn3_story_panda_1","gn3_story_panda_2","gn3_story_panda_3","gn3_story_panda_4","gn3_story_panda_5","gn3_story_panda_6","gn3_story_penguin_1","gn3_story_penguin_2","gn3_story_penguin_3","gn3_story_penguin_4","gn3_story_penguin_5","gn3_story_penguin_6","gn3_story_pig_1","gn3_story_pig_2","gn3_story_pig_3","gn3_story_pig_4","gn3_story_pig_5","gn3_story_pig_6","gn3_story_rabbit_1","gn3_story_rabbit_2","gn3_story_rabbit_3","gn3_story_rabbit_4","gn3_story_rabbit_5","gn3_story_rabbit_6","gn3_story_squirrel_1","gn3_story_squirrel_2","gn3_story_squirrel_3","gn3_story_squirrel_4","gn3_story_squirrel_5","gn3_story_squirrel_6","gn3_story_tiger_1","gn3_story_tiger_2","gn3_story_tiger_3","gn3_story_tiger_4","gn3_story_tiger_5","gn3_story_tiger_6","hs2_coming","hs2_hint","hs2_repair","ls_at_in_basket","ls_at_in_box","ls_at_in_tent","ls_at_on_bench","ls_at_on_log","ls_at_on_table","ls_at_under_bench","ls_at_under_bridge","ls_at_under_table","ls_bear","ls_cat","ls_duck","ls_finish","ls_fox","ls_intro","ls_owl","ls_play","ls_rabbit","pf_nice","sp2_intro_apple","sp2_intro_banana","sp2_intro_blueberry","sp2_intro_cantaloupe","sp2_intro_cherry","sp2_intro_grape","sp2_intro_kiwi","sp2_intro_lemon","sp2_intro_lychee","sp2_intro_mango","sp2_intro_orange","sp2_intro_passion_fruit","sp2_intro_peach","sp2_intro_pear","sp2_intro_persimmon","sp2_intro_pineapple","sp2_intro_plum","sp2_intro_raspberry","sp2_intro_strawberry","sp2_intro_watermelon","sp2_mixed","sp2_pick","sp2_rope"]);

// Per-game single-source audio, borrowing the homepage gesture-unlocked context.
// New interactions replace outdated speech; whole clips are decoded on demand.
export class PlayVoice {
  constructor(gameId,onState) {
    this.gameId=gameId;this.onState=onState;this.serial=0;this.buffers=new Map();this.loading=new Map();this.active=null;
    this.enabled=true;this.hidden=false;this.failedUntil=0;this.ducked=null;
    try{this.enabled=localStorage.getItem('xiaoxiaoEnglishVoiceEnabled')!=='false';}catch{}
  }
  context() {
    if(this.ctx&&this.ctx.state!=='closed')return this.ctx;
    let borrowed;try{if(parent!==window)borrowed=parent.gameSpeechContext?.(this.gameId);}catch{}
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
    if(!/^[a-z][a-z0-9_]{2,60}$/.test(id))throw new Error('Invalid clip');
    if(this.buffers.has(id))return this.buffers.get(id);
    if(this.loading.has(id))return this.loading.get(id);
    const task=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
      try{
        const response=await fetch(new URL(`audio/${id}.mp3?v=${WARM_GUIDE_AUDIO_IDS.has(id) ? '20261017warm1' : VERSION}`,import.meta.url),{signal:controller.signal});
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
        if(token===this.serial){this.failedUntil=this.ctx?.state==='suspended'?0:Date.now()+1600;this.onState({failed:true});}
        return false;
      }finally{
        clearTimeout(loadTimer);clearTimeout(active.timer);
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
