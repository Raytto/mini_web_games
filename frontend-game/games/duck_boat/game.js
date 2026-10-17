import {BoatRound,CapacityBag,textFor} from './model.js?v=20260930duck1';
import {DuckVoice} from './voice.js?v=20260930duck1';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

class DuckBoat {
  constructor() {
    this.bag=new CapacityBag();this.roundID=0;this.phase='loading';this.hidden=document.hidden;this.visibilityEpoch=0;
    this.animations=new Set();this.visibleWaiters=[];this.processing=false;this.drag=null;this.closed=false;
    this.boat=$('boat');this.queue=$('queue');this.seats=$('seats');
    this.voice=new DuckVoice(state=>this.audioState(state));this.audioState({enabled:this.voice.enabled});
    $('replay').addEventListener('click',()=>this.replay());$('sound-note').addEventListener('click',()=>this.replay());
    $('mute').addEventListener('click',()=>{this.voice.setEnabled(!this.voice.enabled);if(this.voice.enabled)this.replay();});
    $('retry-assets').addEventListener('click',()=>this.loadAssets());
    document.querySelector('.home').addEventListener('click',()=>{this.closed=true;this.roundID++;this.voice.stop();this.cancelDrag();this.animations.forEach(a=>a.cancel());this.visibleWaiters.splice(0).forEach(done=>done());});
    document.addEventListener('pointerdown',()=>this.voice.unlock(),{capture:true,passive:true});
    document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')this.voice.unlock();},{capture:true});
    const pause=()=>this.setHidden(true),resume=()=>{if(!document.hidden)this.setHidden(false);};
    document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
    window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);
    window.addEventListener('resize',()=>{this.cancelDrag();this.layoutQueue();});
    this.seats.addEventListener('click',event=>{if(event.target.closest('.occupied')&&this.model?.count)this.replay();});
    this.sync();void this.loadAssets();
  }
  audioState(state) {
    if('speaking'in state)document.body.classList.toggle('speaking',state.speaking);
    if(state.failed){document.body.classList.add('audio-failed');$('sound-note').hidden=false;}
    if(state.ready){document.body.classList.remove('audio-failed');$('sound-note').hidden=true;}
    if('enabled'in state){$('mute').classList.toggle('muted',!state.enabled);$('mute').setAttribute('aria-pressed',String(!state.enabled));$('mute').setAttribute('aria-label',state.enabled?'Mute English voices':'Turn on English voices');if(!state.enabled)$('sound-note').hidden=true;}
  }
  async loadAssets() {
    if(this.loadingAssets||this.model)return;
    this.loadingAssets=true;$('retry-assets').hidden=true;$('loading').hidden=false;$('loading-text').textContent='Getting our boat ready…';
    try{
      let done=0;
      await Promise.all(['duck-poses-v1.webp','boat-v1.webp'].map(name=>new Promise((resolve,reject)=>{
        const image=new Image(),timer=setTimeout(()=>reject(new Error('Picture timeout')),10000);
        image.onload=()=>{clearTimeout(timer);done++;$('loading-text').textContent=`Getting ready… ${done} / 2`;resolve();};
        image.onerror=()=>{clearTimeout(timer);reject(new Error('Picture unavailable'));};
        image.src=new URL('assets/'+name,import.meta.url).href;
      })));
      $('loading').hidden=true;await this.visible();if(!this.closed)void this.nextRound(true);
    }catch{$('loading-text').textContent='Our pictures need another try.';$('retry-assets').hidden=false;}
    finally{this.loadingAssets=false;}
  }
  alive(round){return !this.closed&&round===this.roundID;}
  async visible(){if(!this.hidden||this.closed)return;await new Promise(resolve=>this.visibleWaiters.push(resolve));}
  setHidden(hidden) {
    if(hidden===this.hidden)return;
    this.hidden=hidden;this.visibilityEpoch++;document.body.classList.toggle('paused',hidden);this.voice.setHidden(hidden);
    if(hidden){this.cancelDrag();this.animations.forEach(a=>a.pause());}
    else{this.animations.forEach(a=>a.play());this.visibleWaiters.splice(0).forEach(done=>done());}
  }
  async animate(element,frames,duration,options={}) {
    const animation=element.animate(frames,{duration:reduced.matches?Math.min(duration,260):duration,easing:'cubic-bezier(.35,0,.25,1)',fill:'forwards',...options});
    this.animations.add(animation);if(this.hidden)animation.pause();
    try{await animation.finished;}catch{}finally{this.animations.delete(animation);animation.cancel();}
  }
  async say(id,round) {
    await this.visible();if(!this.alive(round))return false;
    this.lastCue=id;$('caption').textContent=textFor(id);
    const life=this.visibilityEpoch;const ok=await this.voice.play(id);
    if(!this.alive(round))return false;
    if(life!==this.visibilityEpoch){await this.visible();if(this.alive(round))return this.say(id,round);}
    return ok;
  }
  replay() {
    if(this.hidden||!this.lastCue)return;
    this.voice.setEnabled(true);this.voice.unlock();
    const id=this.voice.active?.id||this.lastCue;void this.voice.play(id,{retry:true});
    this.seats.querySelectorAll('.occupied').forEach(seat=>{seat.classList.add('recount');setTimeout(()=>seat.classList.remove('recount'),600);});
  }
  sync() {
    document.body.dataset.phase=this.phase;document.body.dataset.round=String(this.roundID);
    if(!this.model)return;
    document.body.dataset.capacity=String(this.model.capacity);document.body.dataset.count=String(this.model.count);
    $('aboard-count').textContent=this.model.count;$('capacity-count').textContent=this.model.capacity;
    $('counter').setAttribute('aria-label',`${this.model.count} of ${this.model.capacity} ducks aboard`);
    this.boat.setAttribute('aria-label',`Boat: ${this.model.count} ducks, ${this.model.capacity} seats`);
    $('counter').classList.toggle('complete',this.model.full);
    for(const duck of this.model.ducks){const el=this.queue.children[duck.id];if(!el)continue;el.classList.remove('ashore','queued','boarding','aboard','coach');el.classList.add(duck.status);el.disabled=!['ready','boarding'].includes(this.phase)||duck.status!=='ashore';}
    const next=this.model.ducks.find(d=>d.status==='ashore');
    if(next&&this.phase==='ready'&&this.model.count===0)this.queue.children[next.id].classList.add('coach');
  }
  layoutQueue() {
    if(!this.model||!this.queue.firstElementChild)return;
    this.queue.style.minHeight='';
    const style=getComputedStyle(this.queue),cols=style.gridTemplateColumns.split(' ').length;
    const first=this.queue.firstElementChild,display=first.style.display,visibility=first.style.visibility;
    first.style.display='block';first.style.visibility='hidden';
    const height=first.getBoundingClientRect().height;
    first.style.display=display;first.style.visibility=visibility;
    const rows=Math.ceil(this.model.capacity/cols);
    this.queue.style.minHeight=(rows*height+(rows-1)*(parseFloat(style.rowGap)||0))+'px';
  }
  async nextRound(first=false) {
    const round=++this.roundID;this.processing=false;this.cancelDrag();this.voice.stop();
    this.phase='arriving';this.model=new BoatRound(this.bag.next());this.lastCue='db_intro_'+this.model.capacity;
    $('celebration').classList.remove('show');$('hint').textContent='Here comes our boat!';$('caption').textContent=first?'Here comes our boat!':textFor('db_arrival');
    this.boat.classList.add('sailing');this.boat.style.transform='translateX(-115vw)';
    this.queue.replaceChildren();this.seats.replaceChildren();
    this.seats.style.setProperty('--cols',this.model.columns);this.seats.style.setProperty('--rows',Math.ceil(this.model.capacity/this.model.columns));
    this.queue.style.setProperty('--queue-cols',Math.min(3,this.model.capacity));this.queue.style.setProperty('--phone-cols',Math.min(6,this.model.capacity));this.queue.style.setProperty('--land-cols',Math.min(4,this.model.capacity));
    for(let i=0;i<this.model.capacity;i++){
      const seat=document.createElement('div');seat.className='seat';seat.dataset.seat=String(i);seat.setAttribute('aria-label',`Empty seat ${i+1}`);
      const number=document.createElement('span');number.className='seat-number';number.textContent=i+1;seat.append(number);this.seats.append(seat);
      const button=document.createElement('button');button.type='button';button.className='duck-button ashore';button.dataset.duck=String(i);button.setAttribute('aria-label',`Duck ${i+1}: tap or drag to board`);button.style.setProperty('--duck-index',i);
      const art=document.createElement('span');art.className='duck';art.setAttribute('aria-hidden','true');button.append(art);this.bindDuck(button,i,round);this.queue.append(button);
    }
    this.sync();this.layoutQueue();this.voice.prefetch(this.lastCue);this.voice.prefetch('db_count_1');
    const arrivalVoice=first?Promise.resolve():this.voice.play('db_arrival');
    await this.animate(this.boat,[{transform:'translateX(-115vw) rotate(-3deg)'},{transform:'translateX(0) rotate(0deg)'}],1200);
    await this.visible();if(!this.alive(round))return;
    this.boat.style.transform='';this.boat.classList.remove('sailing');this.phase='ready';this.sync();$('hint').textContent='Tap a duck • Drag to the boat';
    void arrivalVoice.then(()=>{if(this.alive(round)&&this.phase==='ready'&&this.model.count===0)void this.say('db_intro_'+this.model.capacity,round);});
    setTimeout(()=>{if(this.alive(round)&&this.phase==='ready'&&this.model.count===0&&!this.voice.active&&!this.hidden)void this.voice.play('db_guide');},8500);
  }
  bindDuck(button,id,round) {
    let committedAt=-Infinity;
    button.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||button.disabled||!this.alive(round)||this.drag)return;
      event.preventDefault();button.setPointerCapture(event.pointerId);
      this.drag={button,id,round,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
    });
    button.addEventListener('pointermove',event=>{
      const d=this.drag;if(!d||d.pointer!==event.pointerId||d.id!==id)return;
      d.x=event.clientX;d.y=event.clientY;
      if(!d.moved&&Math.hypot(d.x-d.startX,d.y-d.startY)>9){d.moved=true;const rect=button.querySelector('.duck').getBoundingClientRect();d.width=rect.width;d.height=rect.height;d.ghost=this.ghost(rect,'drag-duck');button.classList.add('drag-source');}
      if(d.ghost){d.ghost.style.left=(d.x-d.width/2)+'px';d.ghost.style.top=(d.y-d.height*.62)+'px';this.boat.classList.toggle('drop-ready',this.overBoat(d.x,d.y));}
    });
    button.addEventListener('pointerup',event=>{
      const d=this.drag;if(!d||d.pointer!==event.pointerId||d.id!==id)return;
      event.preventDefault();committedAt=performance.now();
      const allowed=!d.moved||this.overBoat(event.clientX,event.clientY);
      const from=d.ghost?.getBoundingClientRect();this.cancelDrag();
      if(allowed)this.request(id,round,from);
      else{void this.animate(button,[{transform:'rotate(-8deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0deg)'}],320);if(this.phase==='ready'&&!this.voice.active)void this.voice.play('db_return');}
    });
    button.addEventListener('pointercancel',()=>this.cancelDrag());
    button.addEventListener('lostpointercapture',()=>{if(this.drag?.id===id)this.cancelDrag();});
    button.addEventListener('click',event=>{
      // Touch commits on pointerup (including Safari). The following synthetic
      // click cannot board a second duck; keyboard / assistive clicks still work.
      // A pointer click can land on a different button as the queue advances.
      // Only keyboard / assistive activation needs this fallback handler.
      if(event.detail>0||performance.now()-committedAt<650)return;
      if(!button.disabled){event.preventDefault();this.request(id,round);}
    });
  }
  overBoat(x,y) {const r=this.boat.getBoundingClientRect();return x>=r.left+5&&x<=r.right-5&&y>=r.top+5&&y<=r.bottom-5;}
  cancelDrag() {
    const d=this.drag;this.drag=null;this.boat.classList.remove('drop-ready');
    if(!d)return;d.button.classList.remove('drag-source');d.ghost?.remove();
    try{if(d.button.hasPointerCapture(d.pointer))d.button.releasePointerCapture(d.pointer);}catch{}
  }
  ghost(rect,kind='flying-duck') {
    const ghost=document.createElement('div');ghost.className=kind;ghost.setAttribute('aria-hidden','true');
    Object.assign(ghost.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
    const art=document.createElement('span');art.className='duck step';ghost.append(art);document.body.append(ghost);return ghost;
  }
  request(id,round,from) {
    if(!this.alive(round)||this.hidden||!['ready','boarding'].includes(this.phase)||!this.model.request(id))return;
    // A dragged duck travels from the release point only if it can board now.
    if(!this.processing&&from)this.releasePosition={id,rect:from};
    this.sync();void this.boardQueue(round);
  }
  async boardQueue(round) {
    if(this.processing)return;this.processing=true;this.phase='boarding';this.voice.stop();this.sync();
    try{
      let item;
      while(this.alive(round)&&(item=this.model.takeNext())){
        await this.visible();if(!this.alive(round))return;
        const button=this.queue.children[item.id],seat=this.seats.children[item.seat];
        const from=this.releasePosition?.id===item.id?this.releasePosition.rect:button.querySelector('.duck').getBoundingClientRect();this.releasePosition=null;
        const art=document.createElement('span');art.className='duck';art.style.visibility='hidden';art.setAttribute('aria-hidden','true');seat.append(art);
        const target=art.getBoundingClientRect();const width=target.width,height=target.height;
        const endX=target.left,endY=target.top;
        const dx=endX-from.left,dy=endY-from.top,sx=width/from.width,sy=height/from.height;
        const ghost=this.ghost(from);this.sync();
        await this.animate(ghost,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx*.5}px,${dy*.5-45}px) scale(${(1+sx)/2},${(1+sy)/2})`,offset:.52},{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`}],520);
        await this.visible();ghost.remove();if(!this.alive(round)){art.remove();return;}
        const waiting=[...this.queue.children].filter(el=>!el.classList.contains('aboard')&&!el.classList.contains('boarding')).map(el=>({el,rect:el.getBoundingClientRect()}));
        if(!this.model.land(item.id))throw new Error('Boarding state mismatch');
        seat.classList.add('occupied','landed');seat.setAttribute('aria-label',`Duck in seat ${item.seat+1}`);
        art.style.visibility='';
        $('counter').classList.remove('count-pop');void $('counter').offsetWidth;$('counter').classList.add('count-pop');this.sync();
        waiting.forEach(({el,rect})=>{const next=el.getBoundingClientRect();if(rect.left!==next.left||rect.top!==next.top)void this.animate(el,[{transform:`translate(${rect.left-next.left}px,${rect.top-next.top}px)`},{transform:'translate(0,0)'}],260);});
        if(this.model.count<this.model.capacity)this.voice.prefetch('db_count_'+(this.model.count+1));
        else this.voice.prefetch('db_full_'+this.model.capacity);
        await this.say('db_count_'+this.model.count,round);await this.visible();if(!this.alive(round))return;
        seat.classList.remove('landed');
        if(this.model.full){await this.depart(round);return;}
      }
    }finally{
      if(this.alive(round)){this.processing=false;if(!this.model.full){this.phase='ready';this.sync();}}
    }
  }
  async depart(round) {
    this.phase='celebrating';this.sync();$('celebration').classList.add('show');$('hint').textContent='Every duck has a seat!';
    this.seats.querySelectorAll('.duck').forEach(duck=>duck.classList.add('happy'));
    await this.say('db_full_'+this.model.capacity,round);await this.visible();if(!this.alive(round))return;
    await sleep(250);await this.visible();if(!this.alive(round))return;
    this.phase='departing';this.sync();this.boat.classList.add('sailing');$('hint').textContent='Wave goodbye!';
    await this.animate(this.boat,[{transform:'translateX(0) rotate(0)'},{transform:'translateX(12vw) translateY(-4px) rotate(-2deg)',offset:.32},{transform:'translateX(115vw) translateY(-16px) rotate(1deg)'}],2300,{easing:'cubic-bezier(.3,.02,.6,1)'});
    this.boat.style.transform='translateX(115vw)';await this.visible();if(!this.alive(round))return;
    this.phase='between';this.sync();$('celebration').classList.remove('show');await sleep(350);await this.visible();
    if(this.alive(round))void this.nextRound();
  }
}

new DuckBoat();
