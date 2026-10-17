import {Playground,$,svg,attr,button,accessible,Bag,clamp,LINES} from '../playful_shared/core.js?v=20261017warm1';
import {ANIMALS,STEPS,NIGHT_LINES,VERSION} from './content.js?v=20261011night3';
Object.assign(LINES,NIGHT_LINES);
const app=new Playground({id:'goodnight_hotel',title:'Goodnight Hotel',zh:'晚安动物旅馆',theme:'night',eyebrow:'ONE LITTLE STEP · ONE SWEET DREAM'});
const bag=new Bag(ANIMALS),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let friend,index=0,served=0,phase='',phaseAt=0,actor,patient,quilt,parts={},buttons={},states={},storyBubble,actionArt,gesture=null;
let currentAction=null,actionCommitted=false,lastWrong=-10,hintAt=0,roundVisit=0,nextNote=0,noteIndex=0;
let hintOverlay=null,storyPage=0,storyToken=0,storyReadyAt=null,storyQuietAt=null;
const failedImages=new Set();
const src=name=>new URL('assets/'+name+'.webp?v='+VERSION,import.meta.url).href;
const caption=(en,zh)=>app.lang==='zh'?zh:en;
const key=()=>friend?.steps[index]||null;
const status=document.createElement('div');status.id='night-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;$('.play-area').append(status);
const stepLine=document.createElement('div');stepLine.id='step-line';app.tools.before(stepLine);
function art(name,x,y,width,height,parent,extra={}){
 const image=svg('image',{href:src(name),x,y,width,height,preserveAspectRatio:'xMidYMid meet',...extra},parent);
 image.addEventListener('error',()=>{failedImages.add(image);$('#art-note').hidden=false;});
 image.addEventListener('load',()=>{failedImages.delete(image);if(!failedImages.size)$('#art-note').hidden=true;});
 return image;
}
$('#art-note').onclick=()=>{for(const img of [...failedImages]){if(!img.isConnected){failedImages.delete(img);continue;}const attribute=img.tagName==='IMG'?'src':'href';const url=new URL(img.getAttribute(attribute));url.searchParams.set('retry',String(Date.now()));img.setAttribute(attribute,url.href);}if(!failedImages.size)$('#art-note').hidden=true;};
function setPhase(value){if(value!=='playing')clearHint();phase=value;phaseAt=app.time;document.body.dataset.phase=value;}
function data(){document.body.dataset.friend=friend.id;document.body.dataset.need=key()||'none';document.body.dataset.step=String(index);document.body.dataset.steps=JSON.stringify(friend.steps);document.body.dataset.done=JSON.stringify(friend.steps.slice(0,index));document.body.dataset.served=String(served);document.body.dataset.visit=String(roundVisit);document.body.dataset.light=states.light?'on':'off';document.body.dataset.curtain=states.curtain?'open':'closed';document.body.dataset.music=states.music?'on':'off';}
function updateTools(){const need=key();for(const [k,b]of Object.entries(buttons)){const done=friend.steps.indexOf(k)<index;b.classList.toggle('step-done',done);b.classList.toggle('step-current',k===need);b.setAttribute('aria-pressed',String(k===need));b.setAttribute('aria-label',STEPS[k].label+(done?' — done':k===need?' — next':''));b.disabled=!['playing'].includes(phase);}
 for(const [k,g]of Object.entries(parts)){g.classList.toggle('requested',k===need&&phase==='playing');g.setAttribute('aria-disabled',String(phase!=='playing'));}
 stepLine.textContent=key()?caption(`${friend.name} · Step ${index+1} of ${friend.steps.length}`,`${friend.zh} · 第 ${index+1} / ${friend.steps.length} 步`):caption('Sweet dreams!','做个好梦！');
 $('#progress').textContent=caption(`${served} ${served===1?'friend':'friends'} dreaming`,`已哄睡 ${served} 位朋友`);$('#progress').setAttribute('aria-label',`${served} sleeping friends`);data();
}
function setPose(pose){patient.setAttribute('href',src('actors/'+friend.id+'-'+pose));document.body.dataset.pose=pose;}
function refreshRoom(){parts.curtain.querySelector('image').setAttribute('href',src('curtains-'+(states.curtain?'open':'closed')));parts.light.querySelector('image').setAttribute('href',src('lamp-'+(states.light?'on':'off')));parts.music.querySelector('image').setAttribute('href',src('music-'+(states.music?'on':'off')));document.body.classList.toggle('lights-off',!states.light);document.body.classList.toggle('music-on',states.music);data();}
function guide(speak=true){const need=key();if(!need)return;app.guideTo('gn2_ask_'+need,speak);if(need==='story'){// Only the current friend's story is requested, when it becomes the next action.
 app.voice.prefetch(friend.pages[0].clip);const img=new Image();img.src=src(friend.pages[0].image);}
}
function sparkle(x,y){if(!reduced.matches)app.sparkle(x,y);}
function clearGesture(){if(gesture){try{app.scene.releasePointerCapture(gesture.id);}catch{}}gesture=null;$('#drag-prop',app.scene)?.remove();}
// A pointer and a halo identify the actual room object; the matching toolbar
// control is highlighted too. No hit area is covered by the decorative overlay.
function clearHint(){hintOverlay?.remove();hintOverlay=null;document.querySelectorAll('.guided-target').forEach(e=>e.classList.remove('guided-target'));}
function showHint(){clearHint();const need=key();if(!need||phase!=='playing')return;hintAt=app.time;
 const image=parts[need].querySelector('image'),x=+image.getAttribute('x'),y=+image.getAttribute('y'),w=+image.getAttribute('width'),h=+image.getAttribute('height');
 parts[need].classList.add('guided-target');buttons[need].classList.add('guided-target');
 hintOverlay=svg('g',{id:'step-hint','data-target':need,'pointer-events':'none','aria-hidden':'true'},app.scene);
 svg('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2+5,ry:h/2+5,class:'guide-halo',fill:'none',stroke:'#ffe79a','stroke-width':6},hintOverlay);
 const arrow=svg('g',{transform:`translate(${x+w/2} ${y-12})`},hintOverlay);
 svg('path',{d:'M-12-54H12V-29H26L0-3-26-29H-12Z',fill:'#ffd96d',stroke:'#fffaf0','stroke-width':4,'stroke-linejoin':'round',class:'guide-arrow'},arrow);
 for(const [dx,dy]of [[-w/2,-h/3],[w/2,h/3],[w/3,-h/2]])svg('path',{d:'M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z',transform:`translate(${x+w/2+dx} ${y+h/2+dy})`,fill:'#fff6b4',class:'guide-star'},hintOverlay);
}
function act(which){if(phase!=='playing')return;app.input();if(which!==key()){showHint();if(app.time-lastWrong>.9){lastWrong=app.time;app.voice.stop();guide();}return;}
 clearHint();
 currentAction=which;actionCommitted=false;app.voice.stop();app.speechEpoch++;if(which==='story'){beginStory();return;}setPhase('acting');updateTools();
 if(which==='brush'){actionArt=art('brush',270,303,92,65,app.scene,{id:'action-prop','pointer-events':'none'});app.guide='gn2_brush_more';app.say(app.guide);}
 else if(which==='pajamas'){actionArt=art('pajamas',243,308,118,113,app.scene,{id:'action-prop','pointer-events':'none'});app.guide='gn2_done_pajamas';app.say(app.guide);}
 else {app.guide='gn2_done_'+which;if(which!=='light')app.say(app.guide);}
}
function commitAction(){if(actionCommitted)return;actionCommitted=true;const which=currentAction;
 if(which==='pajamas'){states.pajamas=true;setPose('pajamas');sparkle(300,379);}
 if(which==='brush'){states.brush=true;sparkle(300,306);}
 if(['curtain','light','music'].includes(which)){states[which]=false;refreshRoom();if(which==='curtain')parts.curtain.classList.add('curtain-close');}
 actionArt?.remove();actionArt=null;
}
function advanceStep(){if(!friend||index>=friend.steps.length)return;index++;currentAction=null;actionCommitted=false;storyToken++;storyBubble?.remove();storyBubble=null;delete document.body.dataset.storyPage;actionArt?.remove();actionArt=null;
 if(index===friend.steps.length){sleep();return;}setPhase('playing');updateTools();guide();}
function beginStory(){storyPage=0;storyBubble=document.createElement('button');storyBubble.id='story-bubble';storyBubble.type='button';
 storyBubble.innerHTML='<span class="story-heading"></span><img id="story-picture" alt=""><span id="story-text" lang="en"></span><span class="story-footer"><span id="story-pages"></span><span class="story-listen"></span></span>';
 $('.play-area').append(storyBubble);storyBubble.onclick=replayStory;showStoryPage();}
function showStoryPage(){setPhase('story');updateTools();storyReadyAt=null;storyQuietAt=null;const token=++storyToken,page=friend.pages[storyPage];
 document.body.dataset.storyPage=String(storyPage+1);document.body.dataset.storyPages=String(friend.pages.length);
 storyBubble.setAttribute('aria-label',`${friend.storyTitle}, page ${storyPage+1} of ${friend.pages.length}. ${page.text} Listen again.`);
 $('.story-heading',storyBubble).textContent=friend.storyTitle;
 $('#story-text',storyBubble).textContent=page.text;
 $('.story-listen',storyBubble).textContent=caption('Tap picture to listen again','点画面再听一遍');
 $('#story-pages',storyBubble).innerHTML=friend.pages.map((_,i)=>`<span class="story-dot ${i===storyPage?'is-current':''}" aria-hidden="true"></span>`).join('')+`<b>${storyPage+1} / ${friend.pages.length}</b>`;
 const image=$('#story-picture',storyBubble);failedImages.delete(image);if(!failedImages.size)$('#art-note').hidden=true;
 image.alt=page.text;image.onload=()=>{if(token!==storyToken)return;phaseAt=app.time;storyReadyAt=app.time;storyQuietAt=null;failedImages.delete(image);if(!failedImages.size)$('#art-note').hidden=true;app.voice.stop();app.say(page.clip);};
 image.onerror=()=>{if(token!==storyToken)return;failedImages.add(image);$('#art-note').hidden=false;app.say(page.clip);};
 app.guideTo(page.clip,false);image.src=src(page.image);
}
function nextStoryPage(){if(storyPage+1<friend.pages.length){storyPage++;showStoryPage();}else advanceStep();}
function replayStory(){if(phase!=='story')return;app.input();phaseAt=app.time;storyQuietAt=null;if(storyReadyAt!==null)storyReadyAt=app.time;app.voice.failedUntil=0;app.voice.stop();app.say(friend.pages[storyPage].clip);}
for(const id of ['#replay','#speech','#sound-note']){const control=$(id),repeat=control.onclick;control.onclick=()=>{if(phase==='story')replayStory();else repeat();};}
const toggleVoice=$('#mute').onclick;$('#mute').onclick=()=>{if(phase==='story'){phaseAt=app.time;storyQuietAt=null;if(storyReadyAt!==null)storyReadyAt=app.time;}toggleVoice();};
function sleep(){clearGesture();setPhase('asleep');states.light=false;states.music=false;states.curtain=false;states.pajamas=true;refreshRoom();setPose('sleep');patient.classList.add('breathing');served++;updateTools();status.hidden=false;status.className='is-asleep';status.innerHTML='<span aria-hidden="true">☾</span><strong>'+caption(`The ${friend.name.toLowerCase()} is asleep.`,`${friend.zh}睡着啦。`)+'</strong><small>'+caption('Sweet dreams!','做个好梦！')+'</small>';app.guide='gn2_sleep_'+friend.id;app.say(app.guide);}
function leaving(){setPhase('leaving');patient.classList.remove('breathing');app.voice.stop();app.speechEpoch++;app.guide=null;status.className='is-next';status.innerHTML='<strong>'+caption('Another sleepy friend…','下一位困困的小伙伴来啦…')+'</strong>';}
function roomControl(which,name,x,y,w,h){const g=svg('g',{'data-room-control':which},app.scene);art(name,x,y,w,h,g);svg('rect',{x:x-5,y:y-5,width:w+10,height:h+10,fill:'transparent'},g);accessible(g,STEPS[which].label,()=>act(which));parts[which]=g;
 g.addEventListener('pointerdown',e=>{if(e.button!==0||gesture||phase!=='playing')return;e.preventDefault();app.input();const p=app.point(e);gesture={id:e.pointerId,which,start:p,last:p,moving:false};app.scene.setPointerCapture(e.pointerId);});return g;}
function draw(){const s=app.scene;parts={};
 // Background furniture, every interactive object, the child and quilt are art assets.
 art('bed',119,231,358,365,s,{id:'bed'});
 roomControl('curtain','curtains-'+(states.curtain?'open':'closed'),415,68,173,195);
 roomControl('brush','brush',22,115,133,102);
 roomControl('light','lamp-on',5,246,155,215);
 roomControl('pajamas','pajamas',443,287,139,135);
 roomControl('music','music-'+(states.music?'on':'off'),437,449,152,137);
 roomControl('story','book',12,462,153,118);
 actor=svg('g',{id:'guest'},s);patient=art('actors/'+friend.id+'-day',156,168,288,360,actor,{id:'patient'});
 quilt=art('quilt',121,431,356,165,s,{id:'quilt','pointer-events':'none'});
}
function start(selected){clearGesture();clearHint();storyToken++;storyBubble?.remove();storyBubble=null;delete document.body.dataset.storyPage;lastWrong=-10;app.newRound();failedImages.clear();$('#art-note').hidden=true;friend=selected||bag.next();index=0;currentAction=null;actionArt=null;storyBubble=null;states={brush:!friend.steps.includes('brush'),pajamas:false,light:true,curtain:friend.steps.includes('curtain'),music:friend.steps.includes('music')};setPhase('entering');document.body.classList.remove('lights-off');status.hidden=true;draw();refreshRoom();actor.setAttribute('transform','translate(700 0)');buttons={};
 const iconName={brush:'brush',pajamas:'pajamas',story:'book',curtain:'curtains-open',music:'music-on',light:'lamp-on'};
 for(const k of friend.steps){const b=button('step-'+k,STEPS[k].label,`<img src="${src(iconName[k])}" alt=""><span>${caption({brush:'Brush',pajamas:'Pajamas',story:'Story',curtain:'Curtains',music:'Music',light:'Light'}[k],STEPS[k].zh)}</span>`,{pressed:false});b.dataset.step=k;b.onclick=()=>act(k);buttons[k]=b;app.tools.append(b);}
 updateTools();hintAt=app.time;app.guide='gn2_ask_'+key();app.guideTo(app.guide,false);data();document.body.dataset.pose='day';}
app.scene.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();const p=app.point(e);gesture.last=p;if(['brush','pajamas','story'].includes(gesture.which)&&Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>12){gesture.moving=true;let img=$('#drag-prop',app.scene);if(!img)img=art({brush:'brush',pajamas:'pajamas',story:'book'}[gesture.which],p.x-40,p.y-40,80,80,app.scene,{id:'drag-prop','pointer-events':'none',opacity:.9});attr(img,{x:p.x-40,y:p.y-40});}});
app.scene.addEventListener('pointerup',e=>{if(gesture?.id!==e.pointerId)return;const g=gesture,p=app.point(e);clearGesture();if(!g.moving||(p.x>135&&p.x<455&&p.y>160&&p.y<530))act(g.which);});
for(const name of ['pointercancel','lostpointercapture'])app.scene.addEventListener(name,e=>{if(gesture?.id===e.pointerId)clearGesture();});
app.onCancel=clearGesture;
app.onRestart=()=>{if(['asleep','leaving'].includes(phase))served=Math.max(0,served-1);start(friend);};
app.onVisibility=visible=>{if(visible&&phase==='story'){phaseAt=app.time;storyQuietAt=null;if(storyReadyAt!==null)storyReadyAt=app.time;}};
function musicNote(){if(!app.voice.enabled||app.voice.active||app.hidden)return;try{const ctx=app.voice.context();if(ctx.state!=='running')return;const o=ctx.createOscillator(),g=ctx.createGain(),n=ctx.currentTime;const melody=[523,659,784,659,587,698,784,698];o.type='sine';o.frequency.value=melody[noteIndex++%melody.length];g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(.022,n+.025);g.gain.exponentialRampToValueAtTime(.001,n+.55);o.connect(g);g.connect(ctx.destination);app.sounds.add(o);o.onended=()=>{app.sounds.delete(o);o.disconnect();g.disconnect();};o.start(n);o.stop(n+.58);}catch{}}
app.listeners.add((dt)=>{const elapsed=app.time-phaseAt;
 if(app.voice.active||!app.voice.enabled||!states.music||phase!=='playing')app.stopSounds();else if(app.time>=nextNote){nextNote=app.time+.75;musicNote();}
 if(phase==='entering'){const p=clamp(elapsed/(reduced.matches?.15:.65),0,1);actor.setAttribute('transform',`translate(${reduced.matches?0:700*(1-p)**3} 0)`);actor.setAttribute('opacity',String(p));if(p===1){actor.removeAttribute('transform');actor.removeAttribute('opacity');setPhase('playing');updateTools();app.guide='gn2_ask_'+key();app.sequence(['gn2_hello_'+friend.id,app.guide]);}}
 else if(phase==='acting'){
  const duration=currentAction==='brush'?1.8:currentAction==='pajamas'?1.1:.65;
  if(actionArt&&currentAction==='brush')actionArt.setAttribute('transform',`translate(${Math.sin(elapsed*25)*15} ${Math.sin(elapsed*12)*3}) rotate(${Math.sin(elapsed*15)*8} 300 330)`);
  if(actionArt&&currentAction==='pajamas')actionArt.setAttribute('opacity',String(Math.max(0,1-elapsed/1.1)));
  if(elapsed>=duration)commitAction();
  if(actionCommitted&&(currentAction==='light'||(!app.voice.active&&elapsed>=duration)||elapsed>=4.5))advanceStep();
 }
 else if(phase==='story'){if(app.voice.active)storyQuietAt=null;else if(storyQuietAt===null)storyQuietAt=app.time;const seen=storyReadyAt!==null&&app.time-storyReadyAt>=4,quiet=storyQuietAt!==null&&app.time-storyQuietAt>=.8;if((seen&&quiet)||elapsed>=12)nextStoryPage();}
 else if(phase==='asleep'&&elapsed>=1.4&&(!app.voice.active||elapsed>=4.5))leaving();
 else if(phase==='leaving'){const p=clamp(elapsed/(reduced.matches?.15:.55),0,1);actor.setAttribute('transform',`translate(${reduced.matches?0:-700*p*p} 0)`);actor.setAttribute('opacity',String(1-p));if(p===1){roundVisit++;start();}}
 if(phase==='playing'&&!gesture&&app.time-app.lastInput>7&&app.time-hintAt>10){showHint();if(!app.voice.active)guide();}
});
start();
