import {PARTS} from './rhythms.js?v=20261014drums1';
export class DrumAudio {
 constructor(){this.buffers=new Map();this.voices=new Set();this.speechBuffers=new Map();this.speechToken=0;this.ready=false;this.rounds=new Map();this.recent=[];}
 init(){
  if(this.ctx&&this.ctx.state!=='closed')return this.ctx;
  try{this.ctx=window.parent.gameSpeechContext?.('little_drums');}catch{}
  this.ctx ||= new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  this.master=this.ctx.createGain();this.master.gain.value=.70;
  this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-8;this.compressor.knee.value=8;this.compressor.ratio.value=8;this.compressor.attack.value=.002;this.compressor.release.value=.10;
  this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);this.voiceGain=this.ctx.createGain();this.voiceGain.gain.value=1;this.voiceGain.connect(this.ctx.destination);return this.ctx;
 }
 unlock(){const c=this.init();return c.state==='running'?Promise.resolve():c.resume();}
 async decode(url){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);try{const response=await fetch(url,{signal:ctrl.signal});if(!response.ok)throw Error('Audio '+response.status);return await this.init().decodeAudioData(await response.arrayBuffer());}finally{clearTimeout(timer);}}
 load(progress){
  if(this.loading)return this.loading;this.init();let index=0;
  const items=PARTS.flatMap(p=>[p.id+'-1',p.id+'-2']);
  // Wait for every worker to settle before enabling retry, avoiding competing loads.
  this.loading=Promise.allSettled(Array.from({length:3},async()=>{while(index<items.length){const id=items[index++];if(!this.buffers.has(id))this.buffers.set(id,await this.decode(`samples/${id}.mp3?v=20261014drums1`));progress?.(this.buffers.size,items.length);}})).then(results=>{const fail=results.find(r=>r.status==='rejected');if(fail)throw fail.reason;this.ready=true;}).finally(()=>{this.loading=null;});return this.loading;
 }
 hit(id,when=this.ctx.currentTime,velocity=1){
  if(!this.ready)return null;
  while(this.voices.size>=32)this.voices.values().next().value.kill();
  const part=PARTS.find(p=>p.id===id);if(!part)return null;
  const variant=(this.rounds.get(id)||0)%2+1;this.rounds.set(id,variant);
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),at=Math.max(when,this.ctx.currentTime);source.buffer=this.buffers.get(`${id}-${variant}`);gain.gain.value=part.gain*velocity;source.connect(gain);gain.connect(this.master);
  const voice={id,at,source,kill:()=>{try{source.stop();}catch{}this.voices.delete(voice);}};
  source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();};this.voices.add(voice);source.start(at);this.recent.push({id,at,variant});if(this.recent.length>64)this.recent.shift();return voice;
 }
 group(hits,when=this.ctx.currentTime){for(const id of hits)this.hit(id,when);}
 stop(){for(const v of [...this.voices])v.kill();}
 stopSpeech(){this.speechToken++;try{this.speech?.stop();}catch{}this.speech=null;}
 async say(id){this.stopSpeech();const token=this.speechToken;try{if(!this.speechBuffers.has(id))this.speechBuffers.set(id,this.decode(`audio/dr1_${id}.mp3?v=20261017warm1`).catch(e=>{this.speechBuffers.delete(id);throw e;}));const buffer=await this.speechBuffers.get(id);if(token!==this.speechToken||document.hidden||this.ctx.state!=='running')return;const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.voiceGain);this.speech=source;source.start();source.onended=()=>{source.disconnect();if(this.speech===source)this.speech=null;};}catch{/* Speech is optional; live drums always take priority. */}}
}
