import {VERSION} from './model.js?v=20260930duck1';

// Only the current word and one look-ahead word load. Counting order belongs to
// the boarding sequence, so rapid tapping cannot replace or skip number words.
export class DuckVoice {
  constructor(onState) {
    this.onState=onState;this.serial=0;this.buffers=new Map();this.loading=new Map();this.active=null;
    this.enabled=true;this.hidden=false;this.failedUntil=0;this.ducked=null;
    try{this.enabled=localStorage.getItem('xiaoxiaoEnglishVoiceEnabled')!=='false';}catch{}
  }
  context() {
    if(this.ctx&&this.ctx.state!=='closed')return this.ctx;
    let borrowed;try{if(parent!==window)borrowed=parent.gameSpeechContext?.('duck_boat');}catch{}
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
    if(!/^db_(intro_\d+|count_\d+|full_\d+|guide|return|arrival)$/.test(id))throw new Error('Invalid clip');
    if(this.buffers.has(id))return this.buffers.get(id);
    if(this.loading.has(id))return this.loading.get(id);
    const task=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
      try{
        const response=await fetch(new URL(`audio/${id}.mp3?v=${VERSION}`,import.meta.url),{signal:controller.signal});
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
