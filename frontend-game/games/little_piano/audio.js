const SAMPLES = [[60,'C4'],[63,'Ds4'],[66,'Fs4'],[69,'A4'],[72,'C5'],[75,'Ds5'],[78,'Fs5'],[81,'A5'],[84,'C6']];
export class PianoAudio {
  constructor(){this.buffers=new Map();this.voices=new Set();this.speechBuffers=new Map();this.speechToken=0;this.ready=false;}
  init(){
    if(this.ctx && this.ctx.state !== 'closed')return this.ctx;
    try{this.ctx=window.parent.gameSpeechContext?.('little_piano');}catch{}
    this.ctx ||= new (window.AudioContext || window.webkitAudioContext)({latencyHint:'interactive'});
    this.master=this.ctx.createGain();this.master.gain.value=.8;
    this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.knee.value=12;this.compressor.ratio.value=4;this.compressor.attack.value=.003;this.compressor.release.value=.15;
    this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);
    this.voiceGain=this.ctx.createGain();this.voiceGain.gain.value=1;this.voiceGain.connect(this.ctx.destination);
    return this.ctx;
  }
  unlock(){const ctx=this.init();return ctx.state === 'running' ? Promise.resolve() : ctx.resume();}
  async getBuffer(url){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw new Error('Audio '+r.status);return await this.init().decodeAudioData(await r.arrayBuffer());}finally{clearTimeout(timer);}
  }
  load(onProgress){
    if(this.loading)return this.loading;
    this.init();let next=0;
    this.loading=Promise.all(Array.from({length:3},async()=>{
      while(next<SAMPLES.length){const [midi,name]=SAMPLES[next++];if(!this.buffers.has(midi))this.buffers.set(midi,await this.getBuffer(`samples/${name}.mp3?v=20261014piano1`));onProgress?.(this.buffers.size,SAMPLES.length);}
    })).then(()=>{this.ready=true;}).finally(()=>{this.loading=null;});
    return this.loading;
  }
  note(midi,when=this.ctx.currentTime,duration=null){
    if(!this.ready)return null;
    while(this.voices.size>=24){const old=this.voices.values().next().value;old.kill();}
    const base=SAMPLES.reduce((a,b)=>Math.abs(b[0]-midi)<Math.abs(a[0]-midi)?b:a)[0];
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
    source.buffer=this.buffers.get(base);source.playbackRate.value=2**((midi-base)/12);
    const start=Math.max(when,this.ctx.currentTime);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.8,start+.004);
    source.connect(gain);gain.connect(this.master);
    let released=false;
    const voice={midi,start,source,gain,release:(at=this.ctx.currentTime)=>{
      if(released)return;released=true;at=Math.max(start+.07,at);
      gain.gain.cancelScheduledValues(at);gain.gain.setValueAtTime(.8,at);gain.gain.exponentialRampToValueAtTime(.0001,at+.28);
      try{source.stop(at+.3);}catch{}
    },kill:()=>{try{source.stop();}catch{}this.voices.delete(voice);}};
    source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();};this.voices.add(voice);
    source.start(start);if(duration!==null)voice.release(start+duration);return voice;
  }
  stop(){for(const v of [...this.voices])v.kill();}
  stopSpeech(){this.speechToken++;try{this.speech?.stop();}catch{}this.speech=null;}
  async say(id){
    this.stopSpeech();const token=this.speechToken;
    try{
      if(!this.speechBuffers.has(id))this.speechBuffers.set(id,this.getBuffer(`audio/p1_${id}.mp3?v=${['welcome','guide','phrase','done'].includes(id)?'20261017warm1':'20261014piano1'}`).catch(e=>{this.speechBuffers.delete(id);throw e;}));
      const buffer=await this.speechBuffers.get(id);if(token!==this.speechToken || this.ctx.state!=='running' || document.hidden)return;
      const s=this.ctx.createBufferSource();s.buffer=buffer;s.connect(this.voiceGain);this.speech=s;s.start();s.onended=()=>{s.disconnect();if(this.speech===s)this.speech=null;};
    }catch{/* Optional narration must never prevent playing. */}
  }
}
