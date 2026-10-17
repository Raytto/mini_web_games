import {PlayVoice} from './voice.js?v=20261002play1';
import {LINES,VERSION} from './lines.js?v=20261002play1';
export {VERSION,LINES};
export const NS='http://www.w3.org/2000/svg';
export const $=(s,root=document)=>root.querySelector(s);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function svg(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));parent?.append(e);return e;}
export function attr(e,attrs){for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
export function imageArt(name){return new URL(`assets/${name}.webp?v=${VERSION}`,import.meta.url).href;}
export function picture(name,x,y,w,h,parent,extra={}){const img=svg('image',{href:imageArt(name),x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet',...extra},parent);img.addEventListener('error',()=>window.dispatchEvent(new Event('play-art-error')));return img;}
export const shuffle=a=>a.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.x);
export class Bag{constructor(items){this.items=items;this.bag=[];this.last=null;}next(){if(!this.bag.length){this.bag=shuffle([...this.items]);if(this.bag.length>1&&this.bag.at(-1)===this.last)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}return this.last=this.bag.pop();}}
export function distSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function crossed(a,b,c,d,pad=0){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const overlap=Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y));return ((overlap&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)||Math.min(distSegment(a,c,d),distSegment(b,c,d),distSegment(c,a,b),distSegment(d,a,b))<=pad);}
export const icons={
 home:'<path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/>',
 sound:'<path d="M3 9h4l6-5v16l-6-5H3zM17 8q5 4 0 8M20 4q9 8 0 16"/>',
 mute:'<path d="M3 9h4l6-5v16l-6-5H3zM17 8l5 8M22 8l-5 8"/>',
 next:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
 replay:'<path d="M5 7a8 8 0 1 1-1 9M4 3v6h6"/>',
 play:'<path d="m8 4 13 8-13 8z"/>',
 ear:'<path d="M8 9a6 6 0 1 1 11 3c-2 2-4 2-4 5a3 3 0 0 1-6 0M11 9a2 2 0 1 1 4 2l-2 2"/>',
 hand:'<path d="M8 13V5a2 2 0 0 1 4 0v6l1-2a2 2 0 0 1 3 0l5 5-2 7H8l-5-7a2 2 0 0 1 3-2z"/>',
 camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="14" r="4"/>',
 moon:'<path d="M19 16A8 8 0 0 1 8 5a8 8 0 1 0 11 11z"/>',
 star:'<path d="m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z"/>'
};
export function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.star}</svg>`;}
export function button(id,label,art,{className='',pressed=null}={}){const b=document.createElement('button');b.id=id;b.className='tool '+className;b.type='button';b.setAttribute('aria-label',label);b.title=label;if(pressed!==null)b.setAttribute('aria-pressed',String(pressed));b.innerHTML=art;return b;}
export function defs(scene){scene.innerHTML=`<defs>
 <filter id="soft-shadow" x="-35%" y="-35%" width="180%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#543e37" flood-opacity=".16"/></filter>
 <linearGradient id="wood" x2="0" y2="1"><stop stop-color="#eec495"/><stop offset="1" stop-color="#bb7547"/></linearGradient>
 <linearGradient id="cream" x2="0" y2="1"><stop stop-color="#fffdf3"/><stop offset="1" stop-color="#eadfc3"/></linearGradient>
 <pattern id="weave" width="16" height="14" patternUnits="userSpaceOnUse"><rect width="16" height="14" fill="#cc9355"/><path d="M0 0h16M0 7h16M8 0v7M0 7v7M16 7v7" stroke="#eebf7a" stroke-width="3"/></pattern>
 <radialGradient id="apple"><stop stop-color="#ff9990"/><stop offset=".65" stop-color="#eb594b"/><stop offset="1" stop-color="#c83c33"/></radialGradient>
 <radialGradient id="pear"><stop stop-color="#eef39b"/><stop offset=".65" stop-color="#acd153"/><stop offset="1" stop-color="#73a237"/></radialGradient>
 <radialGradient id="orange"><stop stop-color="#ffe59a"/><stop offset=".65" stop-color="#ffb34e"/><stop offset="1" stop-color="#ec862d"/></radialGradient>
 </defs>`;}

export class Playground{
 constructor({id,title,zh,theme='mint',eyebrow=''}){
  this.sounds=new Set();this.id=id;this.round=0;this.speechEpoch=0;this.time=0;this.timers=[];this.listeners=new Set();this.hidden=document.hidden;this.destroyed=false;this.lastInput=0;this.guide=null;this.version=VERSION;
  let lang='en';try{lang=parent!==window&&parent.XiaoxiaoI18n?parent.XiaoxiaoI18n.language:localStorage.getItem('xiaoxiaoLanguage')||'en';}catch{}
  this.lang=lang;document.documentElement.lang=lang;document.body.dataset.game=id;document.body.dataset.theme=theme;
  document.body.innerHTML=`<div class="backdrop" aria-hidden="true"></div><div class="app">
   <header class="topbar"><a class="round-button home" href="../../home.html" aria-label="${lang==='zh'?'返回合集':'Back to games'}">${icon('home')}</a><div class="heading"><small>${eyebrow}</small><h1>${lang==='zh'?zh:title}</h1></div><button class="round-button" id="replay" type="button" aria-label="Listen again">${icon('sound')}</button></header>
   <div class="speech-row"><button id="speech" class="speech" type="button" aria-label="Listen again"><span class="voice-dot" aria-hidden="true"></span><span id="caption">…</span></button></div>
   <main class="play-area" aria-label="${title}"><svg class="scene" id="scene" viewBox="0 0 600 620" role="group" aria-label="Play scene"></svg></main>
   <footer><div id="tools" class="tools" role="group" aria-label="Play tools"></div><div class="bottom-row"><button id="mute" class="mini-button" type="button" aria-label="Mute English voices" aria-pressed="false">${icon('sound')}</button><div id="progress" aria-label="Round progress"></div><button id="again" class="mini-button" type="button" aria-label="Start this round again">${icon('replay')}</button></div></footer></div>
   <button id="art-note" class="sound-note art-note" type="button" hidden>↻ Load our friends</button><div id="celebration" class="celebration" aria-hidden="true"></div><button id="sound-note" class="sound-note" type="button" hidden>Tap 🔊 to listen</button>`;
  window.addEventListener('play-art-error',()=>{$('#art-note').hidden=false;});document.addEventListener('error',e=>{if(e.target.tagName==='IMG')$('#art-note').hidden=false;},true);$('#art-note').onclick=()=>location.reload();const applyLanguage=next=>{this.lang=next==='zh'?'zh':'en';document.documentElement.lang=this.lang==='zh'?'zh-CN':'en';$('.heading h1').textContent=this.lang==='zh'?zh:title;$('.home').setAttribute('aria-label',this.lang==='zh'?'返回合集':'Back to games');};window.XiaoxiaoI18n={get language(){return document.documentElement.lang.startsWith('zh')?'zh':'en';},applyLanguage};applyLanguage(lang);this.scene=$('#scene');this.tools=$('#tools');this.caption=$('#caption');this.voice=new PlayVoice(id,s=>this.voiceState(s));
  const repeat=()=>{this.input();this.voice.failedUntil=0;if(this.guide)this.say(this.guide);};$('#speech').onclick=repeat;$('#replay').onclick=repeat;$('#sound-note').onclick=repeat;
  $('#mute').onclick=()=>{this.voice.setEnabled(!this.voice.enabled);this.voiceState({enabled:this.voice.enabled});if(this.voice.enabled)repeat();};
  $('#again').onclick=()=>{this.input();this.onRestart?.();};
  this.voiceState({enabled:this.voice.enabled});
  document.addEventListener('pointerdown',()=>{this.voice.unlock();this.lastInput=this.time;},{capture:true});
  document.addEventListener('keydown',()=>{this.voice.unlock();this.lastInput=this.time;},{capture:true});
  const hide=()=>this.setHidden(true),show=()=>this.setHidden(document.hidden);
  document.addEventListener('visibilitychange',show);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
  window.addEventListener('beforeunload',()=>this.close(),{once:true});
  let last=performance.now();const frame=t=>{if(this.destroyed)return;const dt=this.hidden?0:Math.min(.1,Math.max(0,(t-last)/1000));last=t;if(dt){this.time+=dt;for(const fn of this.listeners)fn(dt,this.time);const due=this.timers.filter(x=>x.at<=this.time);this.timers=this.timers.filter(x=>x.at>this.time);for(const timer of due)timer.fn();}this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);
 }
 voiceState(s){if(s.speaking!==undefined)document.body.classList.toggle('speaking',s.speaking);if(s.failed)$('#sound-note').hidden=false;if(s.ready)$('#sound-note').hidden=true;if(s.enabled!==undefined){$('#mute').setAttribute('aria-pressed',String(!s.enabled));$('#mute').innerHTML=icon(s.enabled?'sound':'mute');$('#mute').setAttribute('aria-label',s.enabled?'Mute English voices':'Enable English voices');if(!s.enabled)$('#sound-note').hidden=true;}}
 input(){this.voice.unlock();this.lastInput=this.time;document.querySelectorAll('.hint-pulse').forEach(x=>x.classList.remove('hint-pulse'));}
 setHidden(hidden){if(this.hidden===hidden)return;this.hidden=hidden;document.body.classList.toggle('paused',hidden);this.voice.setHidden(hidden);if(hidden){this.speechEpoch++;this.stopSounds();this.onCancel?.();}else if(this.guide)this.say(this.guide);this.onVisibility?.(!hidden);}
 stopSounds(){for(const o of this.sounds){try{o.stop();}catch{}}this.sounds.clear();}
 close(){this.stopSounds();this.destroyed=true;this.voice.stop();cancelAnimationFrame(this.raf);for(const t of this.timers)t.cancel?.();this.timers=[];}
 newRound(){this.round++;this.speechEpoch++;this.voice.stop();this.stopSounds();this.timers.splice(0).forEach(t=>t.cancel?.());this.scene.replaceChildren();defs(this.scene);this.tools.replaceChildren();this.lastInput=this.time;$('#celebration').replaceChildren();document.body.classList.remove('celebrating');return this.round;}
 point(event){const point=this.scene.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const matrix=this.scene.getScreenCTM();if(!matrix)return{x:0,y:0};return point.matrixTransform(matrix.inverse());}
 later(ms,fn){const task={at:this.time+ms/1000,fn};this.timers.push(task);return()=>{this.timers=this.timers.filter(x=>x!==task);};}
 wait(ms){return new Promise(resolve=>{const task={at:this.time+ms/1000,fn:()=>resolve(true),cancel:()=>resolve(false)};this.timers.push(task);});}
 guideTo(id,announce=true){this.guide=id;if(announce)return this.say(id);this.caption.textContent=LINES[id]||'';this.voice.prefetch(id);return Promise.resolve();}
 async sequence(ids){const token=++this.speechEpoch;for(const id of ids){if(token!==this.speechEpoch||this.destroyed)return false;this.caption.textContent=LINES[id]||id;await this.voice.play(id);if(token!==this.speechEpoch)return false;}return true;}
 say(id){return this.sequence([id]);}
 async feedback(id){const goal=this.guide,round=this.round;if(await this.sequence([id])&&round===this.round&&goal===this.guide){await this.wait(240);if(round===this.round&&goal===this.guide)this.say(goal);}}
 progress(index,total){$('#progress').innerHTML=Array.from({length:total},(_,i)=>`<i class="progress-dot ${i<index?'done':i===index?'current':''}"></i>`).join('');$('#progress').setAttribute('aria-label',`${Math.min(index+1,total)} of ${total}`);}
 sparkle(x=300,y=300){const g=svg('g',{'pointer-events':'none'},this.scene);for(let i=0;i<10;i++){const a=i*2.4,r=18+Math.random()*25;svg('circle',{cx:x+Math.cos(a)*r,cy:y+Math.sin(a)*r,r:3+Math.random()*4,fill:['#edb84c','#fff8cb','#ed8994'][i%3]},g);}g.classList.add('spark');this.later(780,()=>g.remove());}
 celebrate(){document.body.classList.add('celebrating');const box=$('#celebration');box.innerHTML=Array.from({length:16},(_,i)=>`<i style="--x:${8+(i*31)%85}%;--delay:${i*.025}s;--turn:${i*39}deg;--color:${['#eabd56','#ed8fa0','#89bdaa'][i%3]}"></i>`).join('');this.later(1800,()=>{box.replaceChildren();document.body.classList.remove('celebrating');});this.chime('win');}
 chime(kind='tap'){if(!this.voice.enabled||this.hidden)return;try{const ctx=this.voice.context();if(ctx.state!=='running')return;const n=ctx.currentTime,notes=kind==='win'?[523,659,784]:kind==='snip'?[920,620]:kind==='pop'?[420,740]:[440];for(let i=0;i<notes.length;i++){const o=ctx.createOscillator(),g=ctx.createGain();o.type=kind==='snip'?'triangle':'sine';o.frequency.setValueAtTime(notes[i],n+i*.095);g.gain.setValueAtTime(0,n+i*.095);g.gain.linearRampToValueAtTime(.09,n+i*.095+.01);g.gain.exponentialRampToValueAtTime(.001,n+i*.095+.19);o.connect(g);g.connect(ctx.destination);this.sounds.add(o);o.onended=()=>{this.sounds.delete(o);o.disconnect();g.disconnect();};o.start(n+i*.095);o.stop(n+i*.095+.2);}}catch{}}
}

export function accessible(g,label,fn){g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',label);g.style.cursor='pointer';g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(e);}});g.addEventListener('click',e=>{if(e.detail===0)fn(e);});}
export function basket(scene,x,y,w=126){const g=svg('g',{transform:`translate(${x} ${y})`},scene);svg('path',{d:`M8 18Q${w/2} -62 ${w-8} 18`,fill:'none',stroke:'#bf8549','stroke-width':10},g);svg('ellipse',{cx:w/2,cy:15,rx:w/2,ry:18,fill:'#875936'},g);svg('path',{d:`M0 14Q${w/2} 40 ${w} 14L${w-13} 88Q${w/2} 105 13 88Z`,fill:'url(#weave)',stroke:'#ae763e','stroke-width':4},g);svg('path',{d:`M0 14Q${w/2} 40 ${w} 14`,fill:'none',stroke:'#efc895','stroke-width':10},g);return g;}
export function fruit(scene,type,x,y,r=35){const g=svg('g',{transform:`translate(${x} ${y})`},scene);if(type==='pear'){svg('path',{d:`M0 ${-r}C-${r*.65} ${-r} -${r*.3} -5 -${r*.85} 10C-${r*1.25} ${r*1.5} ${r*1.25} ${r*1.5} ${r*.85} 10C${r*.3} -5 ${r*.65} -${r} 0 -${r}Z`,fill:'url(#pear)',stroke:'#779e38','stroke-width':2},g);}else{svg('circle',{cx:0,cy:0,r,fill:`url(#${type})`,stroke:type==='apple'?'#b94735':'#d38635','stroke-width':2},g);}svg('path',{d:`M0 ${-r+4}q-4 -14 5 -20`,fill:'none',stroke:'#795137','stroke-width':5,'stroke-linecap':'round'},g);svg('path',{d:`M1 ${-r-3}q9 -23 29 -14q-5 23 -29 14`,fill:'#79aa51'},g);svg('ellipse',{cx:-r*.35,cy:-r*.28,rx:r*.17,ry:r*.33,fill:'#fff',opacity:.24,transform:'rotate(25)'},g);return g;}
