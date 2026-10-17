import {SceneView} from './scene-view.js?v=20261001inline1';
import {CASES,VERSION} from './cases.js?v=20261003kite1';
import {LINES} from './lines.js?v=20261001feather1';
import {DetectiveSession,WrongReplyBag} from './model.js?v=20261003kite1';
import {DetectiveVoice} from './voice.js?v=20261017warm1';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
class LittleDetective{
 constructor(){
  this.model=new DetectiveSession();this.replies=new WrongReplyBag();this.flow=0;this.phase='loading';this.loaded=false;this.closed=false;this.hidden=document.hidden;this.epoch=0;this.animations=new Set();this.waiters=[];this.countdown=null;this.cache=new Map();this.attempt=0;
  this.voice=new DetectiveVoice(state=>this.audioState(state));this.audioState({enabled:this.voice.enabled});
  $('replay').onclick=()=>this.replay();$('sound-note').onclick=()=>this.replay();$('mute').onclick=()=>{this.voice.setEnabled(!this.voice.enabled);if(this.voice.enabled)this.replay();};
  $('hint').onclick=()=>this.guide();$('retry').onclick=()=>this.loadCase(true);$('next').onclick=()=>this.next();
  this.sceneView=new SceneView({viewport:$('scene-repeat'),layer:$('scene-content'),plus:$('zoom-in'),minus:$('zoom-out'),reset:$('zoom-reset'),onTap:()=>this.replay(true)});
  $('play-again').onclick=()=>{this.cancel();this.model.restart();$('complete').hidden=true;void this.loadCase();};
  document.querySelectorAll('a[href]').forEach(el=>el.addEventListener('click',()=>{this.closed=true;this.cancel();this.waiters.splice(0).forEach(f=>f());}));
  document.addEventListener('pointerdown',()=>this.voice.unlock(),{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')this.voice.unlock();});
  document.addEventListener('visibilitychange',()=>this.setHidden(document.hidden));window.addEventListener('pagehide',()=>this.setHidden(true));window.addEventListener('pageshow',()=>{if(!document.hidden)this.setHidden(false);});
  this.resizeObserver=new ResizeObserver(()=>this.layoutClue());this.resizeObserver.observe($('scene-panel'));window.addEventListener('resize',()=>this.layoutClue());window.visualViewport?.addEventListener('resize',()=>this.layoutClue());this.sync();void this.loadCase();
 }
 asset(name){return new URL('assets/'+name,import.meta.url).href;}
 alive(token){return !this.closed&&token===this.flow;}
 async visible(){if(this.hidden&&!this.closed)await new Promise(f=>this.waiters.push(f));}
 setHidden(value){
  if(value===this.hidden)return;this.pauseCountdown();this.sceneView.endGesture();this.hidden=value;this.epoch++;this.voice.setHidden(value);document.body.classList.toggle('paused',value);
  this.animations.forEach(a=>value?a.pause():a.play());if(!value){this.waiters.splice(0).forEach(f=>f());this.resumeCountdown();}
 }
 cancel(){
  this.clearCountdown();this.flow++;this.voice.stop();this.animations.forEach(a=>a.cancel());this.animations.clear();$('celebration').replaceChildren();document.body.classList.remove('show-clue');document.querySelectorAll('.choice.selected').forEach(el=>el.classList.remove('selected'));
 }
 async animate(el,keyframes,ms,options={}){
  const a=el.animate(keyframes,{duration:ms,fill:'forwards',easing:'ease-in-out',...options});this.animations.add(a);if(this.hidden)a.pause();
  try{await a.finished;}catch{}finally{this.animations.delete(a);a.cancel();}
 }
 audioState(state){
  if('speaking'in state)document.body.classList.toggle('speaking',state.speaking);
  if(state.failed){document.body.classList.add('audio-failed');$('sound-note').hidden=false;}
  if(state.ready){document.body.classList.remove('audio-failed');$('sound-note').hidden=true;}
  if('enabled'in state){$('mute').classList.toggle('muted',!state.enabled);$('mute').setAttribute('aria-pressed',String(!state.enabled));$('mute').setAttribute('aria-label',state.enabled?'Mute English voices':'Turn on English voices');if(!state.enabled)$('sound-note').hidden=true;}
 }
 sync(){
  const b=document.body.dataset;b.phase=this.phase;b.case=this.model.current?.id||'';b.index=String(this.model.index);b.solved=String(this.model.solved.size);b.attempts=String(this.model.attempts);b.round=String(this.model.round);
  $('case-number').textContent=String(Math.min(CASES.length,this.model.index+1));$('case-total').textContent=String(CASES.length);$('progress-fill').style.width=(this.model.solved.size/CASES.length*100)+'%';$('progress').setAttribute('aria-label',this.model.solved.size+' of '+CASES.length+' cases solved');
  for(const id of ['hint','replay','scene-repeat'])$(id).disabled=!this.loaded||this.model.complete;
  this.sceneView.setEnabled(this.loaded&&!this.model.complete&&!this.closed);
  document.querySelectorAll('.choice').forEach(el=>{el.disabled=!this.loaded||this.model.isSolved||this.closed;});
  $('next').hidden=!this.model.isSolved||!this.loaded;$('case-stamp').hidden=!this.model.isSolved||!this.loaded;
  if(!this.countdown)$('next-label').textContent=this.model.index===CASES.length-1?'Finish':'Next case';
 }
 async loadPicture(name,retry){
  if(!retry&&this.cache.has(name))return this.cache.get(name);
  const image=await new Promise((resolve,reject)=>{
   const img=new Image(),timer=setTimeout(()=>reject(new Error('Picture timeout')),7000);
   img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(new Error('Picture unavailable'));};img.src=this.asset(name)+(retry?'?retry='+retry:'');
  });
  this.cache.set(name,image);while(this.cache.size>15)this.cache.delete(this.cache.keys().next().value);return image;
 }
 async loadCase(retry=false){
  if(this.closed||(this.loading&&!retry))return;if(this.model.complete){void this.complete();return;}
  this.cancel();this.sceneView.reset();const token=this.flow,c=this.model.current;this.loaded=false;this.loading=true;this.phase='loading';this.attempt=retry?this.attempt+1:0;
  this.showDifficulty(c);$('case-title').textContent=c.title;$('question').textContent=c.question;$('caption').textContent='Look for a clue. Tap a friend.';$('loading').hidden=false;$('retry').hidden=true;$('loading-title').textContent='Getting the case ready…';$('loading-count').textContent='0 / 5 pictures';$('load-bar').style.width='0%';$('choices').replaceChildren();
  this.choiceElements=new Map();for(const id of this.model.optionOrder){
   const option=c.options.find(o=>o.id===id),button=document.createElement('button');button.type='button';button.className='choice';button.dataset.option=id;button.setAttribute('aria-label','Choose '+(option.accessibleLabel||option.label).toLowerCase());
   const img=document.createElement('img');img.alt=option.accessibleLabel||option.label;img.draggable=false;const label=document.createElement('span');label.className='name';label.textContent=option.label;button.append(img,label);button.onclick=()=>this.select(id);$('choices').append(button);this.choiceElements.set(id,button);
  }
  this.sync();let loaded=0;const names=[c.sceneAsset||'scene-'+c.id+'-v1.webp',...this.model.optionOrder.map(id=>c.options.find(o=>o.id===id).asset||id+'-v1.webp')];
  const pictures=await Promise.allSettled(names.map(async name=>{const img=await this.loadPicture(name,this.attempt);if(this.alive(token)){$('loading-count').textContent=++loaded+' / 5 pictures';$('load-bar').style.width=(loaded/5*100)+'%';}return img;}));
  if(!this.alive(token))return;
  try{
   if(pictures.some(p=>p.status==='rejected'))throw new Error('Essential picture unavailable');
   const elements=[$('scene-image'),...this.model.optionOrder.map(id=>this.choiceElements.get(id).querySelector('img'))];
   await Promise.all(elements.map(async(el,n)=>{el.src=pictures[n].value.src;await el.decode();}));
   await this.visible();if(!this.alive(token))return;
   $('scene-image').alt=c.title+'. Look for '+c.clue+'.';
   $('loading').hidden=true;this.loaded=true;this.phase='asking';this.sync();this.layoutClue();
   if(this.model.index===0&&this.model.round===0&&!this.welcomed){this.welcomed=true;this.voice.prefetch('ld_question_'+c.id);await this.say('ld_hello',token);if(!this.alive(token))return;}
   await this.say('ld_question_'+c.id,token);if(this.alive(token)){$('caption').textContent='Look for a clue. Tap a friend.';}
  }catch{if(this.alive(token)){this.phase='load-error';$('loading-title').textContent='The case needs another try.';$('retry').hidden=false;this.sync();}}
  finally{if(this.alive(token))this.loading=false;}
 }
 async say(id,token){
  await this.visible();if(!this.alive(token))return false;
  const epoch=this.epoch;$('caption').textContent=LINES[id];document.body.dataset.cue=id;const ok=await this.voice.play(id);
  if(!this.alive(token))return false;if(epoch!==this.epoch){await this.visible();if(this.alive(token))return this.say(id,token);}return ok;
 }
 showDifficulty(c){
  document.body.dataset.difficulty=String(c.difficulty);
  for(const id of ['case-difficulty']){
   const label=$(id);label.dataset.stars=String(c.difficulty);label.setAttribute('aria-label','Difficulty: '+c.difficulty+' of 3 stars');label.title='Difficulty: '+c.difficulty+' of 3';
   const filled=document.createElement('span'),empty=document.createElement('span');filled.className='filled';empty.className='empty';filled.textContent='★'.repeat(c.difficulty);empty.textContent='☆'.repeat(3-c.difficulty);filled.setAttribute('aria-hidden','true');empty.setAttribute('aria-hidden','true');label.replaceChildren(filled,empty);
  }
 }
 layoutClue(){
  const c=this.model.current,img=$('scene-image'),panel=$('scene-panel'),box=$('scene-frame');if(!c||!img.naturalWidth)return;
  const fitted=Math.min(panel.clientWidth/img.naturalWidth,panel.clientHeight/img.naturalHeight);box.style.width=(img.naturalWidth*fitted)+'px';box.style.height=(img.naturalHeight*fitted)+'px';
  const [cx,cy,cw,ch]=c.sceneFocus,scale=Math.min(box.clientWidth/img.naturalWidth,box.clientHeight/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
  Object.assign($('clue-ring').style,{left:((box.clientWidth-w)/2+cx*w)+'px',top:((box.clientHeight-h)/2+cy*h)+'px',width:cw*w+'px',height:ch*h+'px'});this.sceneView.resize();
 }
 highlightClue(){const [x,y]=this.model.current.sceneFocus;this.sceneView.focus(x,y);document.body.classList.remove('show-clue');void $('clue-ring').offsetWidth;document.body.classList.add('show-clue');}
 async select(id){
  if(!this.loaded||this.hidden||this.closed)return;const event=this.model.choose(id);if(event.ignored)return;
  this.voice.unlock();this.cancel();const token=this.flow,c=this.model.current;this.loading=false;
  if(event.correct){
   this.phase='solved';this.choiceElements.forEach((el,key)=>el.classList.add(key===id?'found':'other'));this.highlightClue();this.confetti();this.sync();
   await this.say('ld_yes_'+c.id,token);if(!this.alive(token))return;
   this.autoNext(token);
  }else{
   this.phase='guiding';this.choiceElements.get(id).classList.add('selected');this.sync();this.voice.prefetch('ld_hint_'+c.id);
   await this.say(this.replies.next(event.option.kind),token);if(!this.alive(token))return;this.highlightClue();await this.say('ld_hint_'+c.id,token);if(!this.alive(token))return;
   this.choiceElements.get(id).classList.remove('selected');this.phase='asking';this.sync();$('caption').textContent=c.question;
  }
 }
 clearCountdown(){
  clearTimeout(this.countdown?.timer);this.countdown=null;$('next-countdown').hidden=true;
  $('next-countdown').textContent='';delete document.body.dataset.countdown;
  $('next-label').textContent=this.model.index===CASES.length-1?'Finish':'Next case';
 }
 pauseCountdown(){
  const clock=this.countdown;if(!clock)return;clearTimeout(clock.timer);
  if(clock.startedAt!==null){clock.remaining=Math.max(0,clock.remaining-(performance.now()-clock.startedAt));clock.startedAt=null;}
 }
 resumeCountdown(){
  const clock=this.countdown;if(!clock||!this.alive(clock.token)||this.hidden)return;
  this.pauseCountdown();
  if(clock.remaining<=0){this.next();return;}
  const seconds=Math.ceil(clock.remaining/1000);$('next-countdown').textContent=String(seconds);
  $('next-countdown').setAttribute('aria-label',seconds+' seconds');document.body.dataset.countdown=String(seconds);
  clock.startedAt=performance.now();
  clock.timer=setTimeout(()=>{if(this.countdown===clock)this.resumeCountdown();},Math.max(1,clock.remaining%1000||1000));
 }
 autoNext(token){
  if(!this.alive(token)||!this.model.isSolved)return;this.clearCountdown();
  this.countdown={token,remaining:3000,startedAt:null,timer:null};
  $('next-label').textContent=this.model.index===CASES.length-1?'Finish in':'Next in';
  $('next-countdown').hidden=false;$('next-countdown').textContent='3';$('next-countdown').setAttribute('aria-label','3 seconds');document.body.dataset.countdown='3';
  this.resumeCountdown();
 }
 async replay(questionOnly=false){
  if(!this.loaded||this.hidden||this.closed||this.model.complete)return;this.voice.setEnabled(true);this.voice.unlock();this.cancel();this.loading=false;const token=this.flow,c=this.model.current;
  if(!this.model.isSolved)this.phase='asking';this.sync();await this.say((this.model.isSolved&&!questionOnly?'ld_yes_':'ld_question_')+c.id,token);
  if(this.alive(token)&&this.model.isSolved)await this.autoNext(token);
 }
 async guide(){
  if(!this.loaded||this.hidden||this.closed||this.model.complete)return;this.voice.unlock();this.cancel();this.loading=false;const token=this.flow,c=this.model.current;if(!this.model.isSolved)this.phase='asking';this.highlightClue();this.sync();await this.say('ld_hint_'+c.id,token);
  if(this.alive(token)&&this.model.isSolved)await this.autoNext(token);
 }
 next(){
  if(!this.loaded||this.hidden||this.closed||!this.model.isSolved)return;this.cancel();this.loading=false;this.model.next();void this.loadCase();
 }
 async complete(){
  this.cancel();const token=this.flow;this.phase='complete';this.loaded=false;this.loading=false;$('loading').hidden=true;$('complete').hidden=false;this.sync();$('play-again').focus();this.confetti();await this.say('ld_complete_v2',token);
 }
 confetti(){
  if(reduced.matches)return;const container=$('celebration');
  for(let n=0;n<22;n++){const el=document.createElement('i');el.className='confetti';el.style.left=(22+Math.random()*56)+'%';el.style.top='20%';el.style.background=['#edbe62','#a7c9a0','#ebaf9a','#91b6b0'][n%4];container.append(el);void this.animate(el,[{opacity:0,transform:'translateY(0) rotate(0deg)'},{opacity:.9,offset:.18},{opacity:0,transform:`translate(${(Math.random()-.5)*210}px,${130+Math.random()*180}px) rotate(${200+Math.random()*200}deg)`}],1450+Math.random()*450).then(()=>el.remove());}
 }
}
new LittleDetective();
