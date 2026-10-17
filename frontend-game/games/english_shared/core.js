const ROOT = new URL('./', import.meta.url);
const SPEECH_GAIN = 1.2; // Louder narration; keep in sync with shared/game-voice.js.
const SPEECH_CACHE_LIMIT = 64; // Bound decoded audio memory during long 100-word sessions.
export const asset = name => new URL(`assets/${name}`, ROOT).href;
export const animal = name => new URL(`../shared/generated_assets/shadow_match_animal_${name}_optimized.webp`, ROOT).href;
export const ui = (zh, en) => `<span data-zh="${zh}" data-en="${en}">${zh}</span>`;
export const icons = {
 home:'<svg viewBox="0 0 32 32"><path d="M5 15 16 5l11 10M8 13v14h6v-8h4v8h6V13"/></svg>',
 sound:'<svg viewBox="0 0 32 32"><path d="M5 12h6l7-6v20l-7-6H5zM22 11q6 5 0 10M25 6q11 10 0 20"/></svg>',
 next:'<svg viewBox="0 0 32 32"><path d="M6 16h20M18 8l8 8-8 8"/></svg>',
 again:'<svg viewBox="0 0 32 32"><path d="M25 12A10 10 0 1 0 26 20M25 4v8h-8"/></svg>',
 hand:'<svg viewBox="0 0 64 64"><path d="M19 34V20q0-7 6-5V10q5-6 9 0v4q7-4 8 4v4q8-3 8 5v15q-1 16-17 16-8 0-14-9L9 36q-3-8 4-8z" fill="#ffcd91" stroke="#ae744f" stroke-width="3" stroke-linejoin="round"/><path d="M25 15v18m9-19v18m8-10v11" fill="none" stroke="#ae744f" stroke-width="3"/></svg>',
 ball:'<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="30" fill="#f06865"/><path d="M15 55q35-7 45-38" stroke="#fff2cf" stroke-width="9" fill="none"/><ellipse cx="28" cy="22" rx="9" ry="5" fill="#ffffff80"/></svg>',
 book:'<svg viewBox="0 0 80 80"><rect x="13" y="12" width="54" height="56" rx="7" fill="#63a4d0"/><path d="M23 18v43q18-4 38 0" stroke="#fff4d5" stroke-width="6" fill="none"/><path d="m35 31 5-7 5 7 8 2-6 6 1 8-8-4-8 4 1-8-6-6z" fill="#ffdf79"/></svg>'
};
export function sprite(who, pose=0, extra='') {return `<div class="sprite ${who} ${extra}" style="--pose-x:${pose%3*50}%;--pose-y:${Math.floor(pose/3)*100}%" role="img" aria-label="${who==='pip'?'Pip the penguin':'Teddy the bear'}"></div>`;}
export function pose(el,n) {el.style.setProperty('--pose-x',`${n%3*50}%`);el.style.setProperty('--pose-y',`${Math.floor(n/3)*100}%`);el.dataset.pose=n;}
export const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));

// One audio graph, one speaking source, a cancellable sequence, no queued clicks.
class SpeechBank {
 constructor(onFailure,onSpeaking,contextProvider) {this.contextProvider=contextProvider;this.buffers=new Map();this.loading=new Map();this.sequence=0;this.active=null;this.onFailure=onFailure;this.onSpeaking=onSpeaking;}
 unlock() {const C=window.AudioContext||window.webkitAudioContext;if(!C) return Promise.reject(new Error('Audio unavailable'));if(!this.context||this.context.state==='closed'){this.context=this.contextProvider?.()||new C();this.output=this.context.createGain();this.output.gain.value=SPEECH_GAIN;this.output.connect(this.context.destination);}return this.context.resume();}
 async load(id) {
  if(this.buffers.has(id)){const buffer=this.buffers.get(id);this.buffers.delete(id);this.buffers.set(id,buffer);return buffer;}
  if(this.loading.has(id))return this.loading.get(id);
  const promise=(async()=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(new URL(`audio/${id}.mp3?v=20260930cv1`,ROOT),{signal:controller.signal});if(!r.ok)throw new Error('Missing audio');const b=await r.arrayBuffer();const decoded=await this.context.decodeAudioData(b);this.buffers.set(id,decoded);while(this.buffers.size>SPEECH_CACHE_LIMIT)this.buffers.delete(this.buffers.keys().next().value);return decoded;}finally{clearTimeout(timer);this.loading.delete(id);}})();this.loading.set(id,promise);return promise;
 }
 async prepare(ids) {await this.unlock();await Promise.all(ids.map(id=>this.load(id)));}
 stop() {this.sequence++;if(this.source){try{this.source.stop();}catch{}this.source=null;}if(this.finish){this.finish(false);this.finish=null;}this.active=null;this.onSpeaking(false);}
 play(ids) {
  const list=Array.isArray(ids)?ids:[ids],key=list.join('|');if(this.active?.key===key)return this.active.promise;
  this.stop();const token=this.sequence;
  const promise=(async()=>{try{await this.unlock();for(const id of list){if(token!==this.sequence||document.hidden)return false;const buffer=await this.load(id);if(token!==this.sequence||document.hidden)return false;const ended=await new Promise(resolve=>{const s=this.context.createBufferSource();s.buffer=buffer;s.connect(this.output);this.source=s;this.finish=resolve;s.onended=()=>{if(this.source===s){this.source=null;this.finish=null;}resolve(true);};this.onSpeaking(true);s.start();});if(!ended||token!==this.sequence)return false;}return true;}catch(error){if(token===this.sequence)this.onFailure();return false;}finally{if(token===this.sequence){this.active=null;this.onSpeaking(false);}}})();this.active={key,promise};return promise;
 }
}

export class Game {
 constructor(config) {
  this.config=config;this.epoch=0;this.started=false;this.lastCue=[];this.hidden=false;
  document.body.dataset.game=config.id;
  document.body.innerHTML=`<div class="game-shell"><header class="topbar"><a class="round-button home-button" href="../../home.html" data-aria-zh="回到游戏主页" data-aria-en="Back to games">${icons.home}</a><div class="heading"><h1>${ui(config.zh,config.en)}</h1><p>${ui(config.tagZh,config.tagEn)}</p></div><button class="round-button replay-button" id="replay" data-aria-zh="再听一次英语" data-aria-en="Listen again">${icons.sound}</button></header><div class="progress" id="progress" aria-label="Round progress"></div><main id="stage" class="scene scene-${config.id}"></main><div class="word-card" aria-live="polite"><strong id="word" lang="en">${config.word}</strong><span id="gloss" class="gloss">${config.gloss}</span></div><p id="hint" class="hint"></p><div id="controls" class="controls"></div><div class="audio-notice" id="audio-notice" hidden>${ui('声音暂时没有准备好，可点这里重试。','Sound is not ready. Tap to retry.')}<button id="audio-retry">${icons.sound}</button></div><footer><button class="parent-toggle" id="parent-toggle">${ui('陪玩小提示','For grown-ups')}</button><p id="parent-note" hidden>${ui(config.parentZh,config.parentEn)} ${ui('英语配音为合成语音。','English voices are AI generated.')}</p></footer></div><div id="start-screen" class="overlay"><section class="welcome panel"><div class="welcome-icon">${config.icon}</div><p class="eyebrow" lang="en">PLAY · LISTEN · DISCOVER</p><h2>${ui(config.zh,config.en)}</h2><p>${ui(config.introZh,config.introEn)}</p><button id="start" class="primary big-start">${icons.next}${ui('一起玩','Let’s play')}</button><p id="load-status" class="small-note">${ui('打开声音，听听英语吧','Turn on sound to hear the English words')}</p><button id="visual-start" class="quiet" hidden>${ui('先看图玩，稍后重试声音','Play with pictures, retry sound later')}</button></section></div><div id="finish-screen" class="overlay" hidden><section class="panel"><div class="finish-art">${config.icon}</div><h2>${ui('玩好这一小轮啦','A lovely little round!')}</h2><p id="finish-note"></p><div class="finish-actions"><button id="again" class="primary">${icons.again}${ui('再玩一轮','Play again')}</button><a href="../../home.html" class="quiet home-link">${ui('回到主页','Back to games')}</a></div></section></div>`;
  this.stage=document.getElementById('stage');this.controls=document.getElementById('controls');
  this.audio=new SpeechBank(()=>this.audioError(),speaking=>document.querySelector('.word-card').classList.toggle('speaking',speaking),config.audioContext || (()=>{try{return parent!==window?parent.gameSpeechContext?.(config.id):null;}catch{return null;}}));
  document.getElementById('start').addEventListener('click',()=>this.start());
  document.getElementById('visual-start').addEventListener('click',()=>this.begin());
  document.getElementById('replay').addEventListener('click',()=>{if(this.started&&!this.hidden){if(this.onReplay)this.onReplay();else if(this.lastCue.length)this.audio.play(this.lastCue);}});
  document.getElementById('audio-retry').addEventListener('click',async()=>{try{await this.audio.prepare(config.audio);document.getElementById('audio-notice').hidden=true;document.body.classList.remove('audio-unavailable');await this.audio.play(this.lastCue);}catch{this.audioError();}});
  document.getElementById('again').addEventListener('click',()=>{document.getElementById('finish-screen').hidden=true;this.begin();});
  document.getElementById('parent-toggle').addEventListener('click',()=>{const n=document.getElementById('parent-note');n.hidden=!n.hidden;});
  document.querySelectorAll('.home-button,.home-link').forEach(a=>a.addEventListener('click',()=>this.cancel()));
  const pause=()=>{if(this.hidden)return;this.hidden=true;this.cancel();this.onPause?.();};
  const resume=()=>{const wasHidden=this.hidden;this.hidden=false;if(wasHidden){if(this.started&&this.library)this.library.open();else this.onResume?.();}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else resume();});window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);
  new MutationObserver(()=>this.localize()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(()=>this.localize()).observe(document.body,{childList:true,subtree:true});
  this.localize();this.progress(0);
 }
 localize(){const en=window.XiaoxiaoI18n?.language==='en';document.querySelectorAll('[data-zh]').forEach(el=>{const text=el.dataset[en?'en':'zh'];if(el.textContent!==text)el.textContent=text;});document.querySelectorAll('[data-aria-zh]').forEach(el=>el.setAttribute('aria-label',el.dataset[en?'ariaEn':'ariaZh']));document.title=en?this.config.en:this.config.zh;}
 hint(zh,en){const el=document.getElementById('hint');el.dataset.zh=zh;el.dataset.en=en;this.localize();}
 word(word,gloss){document.getElementById('word').textContent=word;document.getElementById('gloss').textContent=gloss;}
 say(ids){this.lastCue=Array.isArray(ids)?ids:[ids];return this.audio.play(this.lastCue);}
 audioError(){document.getElementById('audio-notice').hidden=false;document.body.classList.add('audio-unavailable');}
 cancel(){this.epoch++;this.audio.stop();this.onCancel?.();}
 nextEpoch(){this.cancel();return this.epoch;}
 alive(epoch){return epoch===this.epoch;}
 async start(){const epoch=this.epoch;const b=document.getElementById('start');if(b.disabled)return;b.disabled=true;const s=document.getElementById('load-status');s.dataset.zh='正在准备声音…';s.dataset.en='Getting the sounds ready…';this.localize();try{await this.audio.prepare(this.config.audio);if(epoch!==this.epoch||this.hidden)return;document.getElementById('audio-notice').hidden=true;document.body.classList.remove('audio-unavailable');this.begin();}catch{this.audioError();s.dataset.zh='声音加载未完成，可以重试或先看图玩。';s.dataset.en='Sound could not load. Retry or play with pictures.';document.getElementById('visual-start').hidden=false;this.localize();}finally{b.disabled=false;}}
 begin(){this.nextEpoch();this.started=true;document.getElementById('start-screen').hidden=true;this.onStart?.();}
 progress(n,total=3){document.getElementById('progress').innerHTML=Array.from({length:total},(_,i)=>`<span class="${i<n?'filled':''}"></span>`).join('');document.getElementById('progress').setAttribute('aria-label',`${n} / ${total}`);}
 finish(zh,en){const n=document.getElementById('finish-note');n.dataset.zh=zh;n.dataset.en=en;this.localize();document.getElementById('finish-screen').hidden=false;document.getElementById('again').focus({preventScroll:true});}
 action(id,icon,zh,en,handler,cls='primary'){const b=document.createElement('button');b.id=id;b.className=cls;b.innerHTML=icon+ui(zh,en);b.addEventListener('click',handler);this.controls.append(b);return b;}
}
