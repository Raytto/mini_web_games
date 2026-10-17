import {Playground,$,svg,button,icon,accessible,Bag,distSegment,crossed,LINES} from '../playful_shared/core.js?v=20261017warm1';
import {GARDENS,HARVEST_LINES,VERSION} from './content.js?v=20261003harvest1';
Object.assign(LINES,HARVEST_LINES);
const app=new Playground({id:'snip_picnic',title:'Snip & Picnic',zh:'剪绳野餐队',theme:'sky',eyebrow:'PICK · ROLL · SHARE'});
const bag=new Bag(GARDENS),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let garden,items=[],phase='loading',phaseAt=0,picked=0,delivered=0,visits=0,picnics=0,gesture=null,lastHint=0,lastRopeHint=-10;
const snackPositions=[[102,84],[170,72],[244,84]];
let fruitLayer,collectionLayer,friends,eatingFruit=[],crateFront,route,routeLength,next,summary,trail;
const failures=new Set(),url=name=>new URL('assets/'+name+'.webp?v='+VERSION,import.meta.url).href;
const words=(en,zh)=>app.lang==='zh'?zh:en;
const habitatEn={tree:'Fruit tree',vine:'Climbing vine',ground_vine:'Ground vine',low:'Low plant',rosette:'Leafy plant',herb:'Tall plant',bush:'Berry bush'};
const info=document.createElement('div');info.id='garden-info';$('.speech-row').after(info);
const instruction=document.createElement('div');instruction.id='harvest-tip';app.tools.before(instruction);
function setPhase(value){phase=value;phaseAt=app.time;document.body.dataset.phase=value;}
function updateData(){Object.assign(document.body.dataset,{fruit:garden.id,habitat:garden.kind,picked:String(picked),delivered:String(delivered),fruitCount:String(items.length),garden:String(visits),picnics:String(picnics),modes:JSON.stringify(items.map(i=>i.mode))});
 $('#progress').textContent=words(`${delivered} / ${items.length} in the crate`,`${delivered} / ${items.length} 个已入箱`);}
function art(name,x,y,w,h,parent,extra={}){const el=svg('image',{href:url(name),x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet',...extra},parent);el.addEventListener('error',()=>{failures.add(el);$('#art-note').hidden=false});el.addEventListener('load',()=>{failures.delete(el);if(!failures.size)$('#art-note').hidden=true});return el;}
$('#art-note').onclick=()=>{for(const el of [...failures]){if(!el.isConnected){failures.delete(el);continue}const u=new URL(el.getAttribute('href'));u.searchParams.set('retry',String(Date.now()));el.setAttribute('href',u.href)}if(!failures.size)$('#art-note').hidden=true};
function spark(x,y){if(!reduced.matches)app.sparkle(x,y)}
function clearGesture(){if(gesture){try{app.scene.releasePointerCapture(gesture.id)}catch{}}gesture=null;trail?.remove();trail=null;}
function goal(){return garden.mixed?'sp2_mixed':'sp2_pick'}
function ropeHint(item){if(app.time-lastRopeHint<2)return;lastRopeHint=app.time;item.rope.classList.add('hint-pulse');instruction.textContent=words('✂ Cut the string above this fruit','✂ 剪开这个果子上方的绳子');app.say('sp2_rope');app.guide=goal();}
function harvest(item){if(phase!=='harvesting'||item.phase!=='ready')return;app.input();item.phase='falling';item.element.dataset.phase='falling';item.element.setAttribute('aria-disabled','true');item.element.removeAttribute('tabindex');item.rope?.remove();app.scene.querySelector('[data-stem="'+item.id+'"]')?.remove();item.vy=0;item.rotation=0;picked++;spark(item.x,item.y);app.chime(item.mode==='rope'?'snip':'pop');instruction.textContent=words('Down it goes… into the crate!','掉下来，滚进箱子啦！');if(picked===items.length){setPhase('collecting');app.guide=null;}updateData();}
function hit(a,b){if(phase!=='harvesting')return;const scale=app.scene.getScreenCTM()?.a||1,pad=Math.max(16,20/scale);let matched=false;
 for(const item of items){if(item.phase!=='ready')continue;if(item.mode==='rope'){if(Math.min(a.y,b.y)<=item.y-item.r*.82&&crossed(a,b,item.anchor,{x:item.x,y:item.y-item.r*.82},pad)){harvest(item);matched=true}}
 else if(distSegment({x:item.x,y:item.y},a,b)<=item.r+Math.min(pad,23)){harvest(item);matched=true}}
 if(!matched&&Math.hypot(b.x-a.x,b.y-a.y)<3){const item=items.find(i=>i.phase==='ready'&&i.mode==='rope'&&Math.hypot(b.x-i.x,b.y-i.y)<i.r+12);if(item)ropeHint(item)}
}
function trackAt(x){let best=0,d=Infinity;for(let n=0;n<=120;n++){const length=routeLength*n/120,p=route.getPointAtLength(length),dx=Math.abs(p.x-x);if(dx<d){d=dx;best=length}}return best;}
function deliver(item){if(item.phase==='delivered')return;item.phase='delivered';item.element.dataset.phase='delivered';item.element.remove();item.rope?.remove();const n=delivered++;const gx=449+(n%4)*23,gy=531-Math.floor(n/4)*18;art('fruits/'+garden.id,gx-16,gy-18,33,36,collectionLayer,{'data-collected':item.id});spark(486,524);app.chime('tap');updateData();if(delivered===items.length)picnic();}
function picnic(){clearGesture();setPhase('picnic');picnics++;app.voice.stop();app.speechEpoch++;app.guide=garden.shareClip;app.say(garden.shareClip);document.body.classList.add('having-picnic');$('#how-to-pick').hidden=true;friends.setAttribute('transform','translate(17 384) scale(1.32)');for(const [n,p]of snackPositions.entries()){const el=art('fruits/'+garden.id,p[0]-18,p[1]-18,36,36,friends,{'data-snack':n});eatingFruit.push(el)}summary.hidden=false;summary.innerHTML='<strong>'+words('All picked! Let’s share!','摘完啦，大家一起吃！')+'</strong><small>'+words(garden.plural+' for everyone.',`一起分享${garden.zh}。`)+'</small>';instruction.textContent=words('A little picnic, then a new fruit garden','野餐一下，再去新的果园');next.hidden=false;next.disabled=true;updateData();app.chime('win');spark(265,435);}
function nextGarden(){if(phase!=='picnic'||app.time-phaseAt<.9)return;visits++;start();}
function start(restart=false){clearGesture();app.newRound();failures.clear();$('#art-note').hidden=true;if(!restart)garden=bag.next();items=[];picked=0;delivered=0;eatingFruit=[];setPhase('harvesting');document.body.classList.remove('having-picnic');app.scene.setAttribute('viewBox','0 0 600 660');
 info.innerHTML=`<img src="${url('fruits/'+garden.id)}" alt=""><strong>${words(garden.en,garden.zh)}</strong><span>${words(habitatEn[garden.kind],garden.kindZh)}</span>`;
 const scene=app.scene;art('plants/'+garden.id,0,0,600,430,scene,{id:'fruit-plant'});
 // A toy harvest chute makes every picked fruit visibly fall and roll to the crate.
 const trackD='M35 429 C150 435 260 457 340 476 S450 518 485 535';
 route=svg('path',{d:trackD,fill:'none',stroke:'#a9764d','stroke-width':18,'stroke-linecap':'round',id:'fruit-chute'},scene);svg('path',{d:trackD,fill:'none',stroke:'#f2d1a1','stroke-width':9,'stroke-linecap':'round','pointer-events':'none'},scene);routeLength=route.getTotalLength();
 art('crate',418,489,176,148,scene,{id:'fruit-crate'});collectionLayer=svg('g',{id:'crate-fruit','pointer-events':'none'},scene);
 friends=svg('g',{id:'picnic-friends',transform:'translate(12 500) scale(.94)'},scene);art('picnic-friends',0,0,336,158,friends);
 fruitLayer=svg('g',{id:'growing-fruits'},scene);
 garden.slots.forEach((slot,id)=>{const r=garden.radius,anchor={x:slot.x,y:garden.kind==='vine'?90:slot.y-r-69};let rope;
  if(slot.mode==='pick'&&garden.kind==='vine'){svg('path',{d:`M${slot.x+12} 112Q${slot.x-14} ${slot.y-65} ${slot.x} ${slot.y-r*.55}`,fill:'none',stroke:'#718840','stroke-width':4,'stroke-linecap':'round','data-stem':id,'pointer-events':'none'},fruitLayer);}
  if(slot.mode==='rope'){rope=svg('g',{'data-rope':id},fruitLayer);svg('path',{d:`M${anchor.x} ${anchor.y}L${slot.x} ${slot.y-r*.8}`,fill:'none',stroke:'#b77747','stroke-width':8,'stroke-linecap':'round'},rope);svg('path',{d:`M${anchor.x-1} ${anchor.y}L${slot.x-1} ${slot.y-r*.8}`,fill:'none',stroke:'#ffdfa1','stroke-width':3,'stroke-dasharray':'5 5','stroke-linecap':'round'},rope);svg('circle',{cx:anchor.x,cy:anchor.y,r:7,fill:'#dca86d',stroke:'#9f6d40','stroke-width':2},rope);svg('path',{d:`M${anchor.x-16} ${anchor.y+31}l32 13m-32 0 32-13`,stroke:'#fff9de','stroke-width':3,'stroke-linecap':'round',opacity:.9},rope);}
  const group=svg('g',{'data-fruit':id,'data-mode':slot.mode,'data-phase':'ready',transform:`translate(${slot.x} ${slot.y})`},fruitLayer);art('fruits/'+garden.id,-r,-r,r*2,r*2,group);svg('circle',{r:r+8,fill:'transparent'},group);
  const entry=trackAt(slot.x),floor=route.getPointAtLength(entry).y-r*.7;const item={...slot,id,r,x:slot.x,y:slot.y,entry,floor,anchor,phase:'ready',element:group,rope,rotation:0};items.push(item);accessible(group,(slot.mode==='rope'?'Cut the rope for ':'Pick ')+garden.en,()=>harvest(item));if(rope)accessible(rope,'Cut the rope for '+garden.en,()=>harvest(item));});
 // Only the crate's illustrated front is painted above delivered fruit.
 const defs=$('defs',scene),clip=svg('clipPath',{id:'crate-front-clip'},defs);svg('rect',{x:410,y:551,width:190,height:100},clip);crateFront=art('crate',418,489,176,148,scene,{'clip-path':'url(#crate-front-clip)','pointer-events':'none'});
 summary=$('#picnic-message');if(!summary){summary=document.createElement('div');summary.id='picnic-message';summary.setAttribute('role','status');$('.play-area').append(summary)}summary.hidden=true;
 const hint=button('how-to-pick',words('Listen to how to pick','重听采摘方法'),icon(garden.mixed?'hand':'hand'),{className:'request-tool'});hint.innerHTML='<span aria-hidden="true">'+(garden.mixed?'✂':'☝')+'</span><small>'+words(garden.mixed?'Snip / touch':'Touch / swipe',garden.mixed?'剪绳 / 触碰':'点按 / 滑过')+'</small>';hint.onclick=()=>{app.input();app.say(goal())};app.tools.append(hint);
 next=button('next-garden',words('Visit the next fruit garden','去下一片果园'),icon('next'),{className:'next'});next.innerHTML='<span>'+words('Next garden','下一片果园')+'</span>'+icon('next');next.hidden=true;next.onclick=nextGarden;app.tools.append(next);
 instruction.textContent=words(garden.mixed?'Cut the marked strings. Touch the other fruit.':'Tap or swipe across the fruit to pick it.',garden.mixed?'剪开绳子；其他果子点一下或滑过就能摘。':'点一点，或用手指滑过果子，就能摘下来。');app.guide=garden.introClip;app.guideTo(app.guide);lastHint=app.time;updateData();}
app.scene.addEventListener('pointerdown',e=>{if(e.button!==0||gesture)return;if(phase==='picnic'){gesture={id:e.pointerId,last:app.point(e),picnic:true,ready:app.time-phaseAt>=.9};app.scene.setPointerCapture(e.pointerId);return}if(phase!=='harvesting')return;e.preventDefault();app.input();const p=app.point(e);gesture={id:e.pointerId,last:p,picnic:false};app.scene.setPointerCapture(e.pointerId);hit(p,p);});
app.scene.addEventListener('pointermove',e=>{if(gesture?.id!==e.pointerId||gesture.picnic)return;e.preventDefault();const p=app.point(e);hit(gesture.last,p);if(!reduced.matches){if(!trail)trail=svg('path',{fill:'none',stroke:'#fff7c9','stroke-width':8,'stroke-linecap':'round',opacity:.75,'pointer-events':'none'},app.scene);trail.setAttribute('d',`M${gesture.last.x} ${gesture.last.y}L${p.x} ${p.y}`)}gesture.last=p;});
app.scene.addEventListener('pointerup',e=>{if(gesture?.id!==e.pointerId)return;const g=gesture,p=app.point(e);clearGesture();if(g.picnic&&g.ready&&Math.hypot(p.x-g.last.x,p.y-g.last.y)<35)nextGarden();});
for(const name of ['pointercancel','lostpointercapture'])app.scene.addEventListener(name,e=>{if(gesture?.id===e.pointerId)clearGesture()});
app.onCancel=clearGesture;app.onRestart=()=>{if(phase==='picnic')picnics=Math.max(0,picnics-1);start(true)};
app.listeners.add(dt=>{for(const item of items){if(item.phase==='falling'){item.vy+=980*dt;item.y+=item.vy*dt;if(item.y>=item.floor){item.y=item.floor;item.progress=item.entry;item.speed=110;item.phase='rolling';item.element.dataset.phase='rolling';app.chime('tap');}}
 else if(item.phase==='rolling'){item.speed=Math.min(280,item.speed+160*dt);item.progress=Math.min(routeLength,item.progress+item.speed*dt);const p=route.getPointAtLength(item.progress);item.x=p.x;item.y=p.y-item.r*.7;item.rotation+=dt*180;if(item.progress>=routeLength)deliver(item)}
 if(item.phase==='falling'||item.phase==='rolling')item.element.setAttribute('transform',`translate(${item.x} ${item.y}) rotate(${reduced.matches?0:item.rotation})`);}
 if(phase==='picnic'){if(next.disabled&&app.time-phaseAt>=.9){next.disabled=false;instruction.textContent=words('Tap the garden or the arrow to keep exploring','点一下画面或箭头，去下一片果园')}
  if(!reduced.matches){const t=app.time-phaseAt;friends.setAttribute('transform',`translate(17 ${384+Math.sin(t*6)*2}) scale(1.32)`);eatingFruit.forEach((e,i)=>e.setAttribute('transform',`translate(0 ${-7-Math.sin(t*4+i*2)*7}) rotate(${Math.sin(t*4+i)*6} ${snackPositions[i][0]} ${snackPositions[i][1]})`));}}
 if(phase==='harvesting'&&!gesture&&app.time-app.lastInput>7&&app.time-lastHint>10){lastHint=app.time;const item=items.find(i=>i.phase==='ready');(item?.rope||item?.element)?.classList.add('hint-pulse');if(!app.voice.active)app.say(goal());}
});
start();
