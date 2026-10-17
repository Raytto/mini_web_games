import {Playground,$,button,shuffle,clamp,LINES} from '../playful_shared/core.js?v=20261002play1';
import {DINOSAURS,LAYERS,DIG_LINES,TOOLS,VERSION} from './content.js?v=20261014dig11';
import {DigVoice} from './voice.js?v=20261014dig11';
import {SoilLayer,SURFACE} from './soil.js?v=20261014dig10';
import {createImageLoader} from './image-loader.js?v=20261013dig8';
import {DigScrubSound} from './scrub-audio.js?v=20261017scrub1';
Object.assign(LINES,DIG_LINES);
const app=new Playground({id:'dino_dig',title:'Dino Dig',zh:'小恐龙考古队',theme:'sand',eyebrow:'LITTLE DIGS · BIG DISCOVERIES'});
app.voice.stop();app.voice=new DigVoice('dino_dig',s=>app.voiceState(s));app.voiceState({enabled:app.voice.enabled});
const scrub=new DigScrubSound(app);
$('#mute').addEventListener('click',()=>{if(!app.voice.enabled)scrub.stop();});
window.addEventListener('blur',()=>cancelGesture());
const tr=(en,zh)=>app.lang==='zh'?zh:en,reduced=matchMedia('(prefers-reduced-motion: reduce)');
const art=n=>new URL('assets/'+n+(/^(depth\/|site-)/.test(n)?'-lite':'')+'.webp?v='+VERSION,import.meta.url).href;
const canvas=document.createElement('canvas');canvas.id='dig-canvas';canvas.width=692;canvas.height=520;canvas.tabIndex=0;canvas.setAttribute('role','button');
const board=document.createElement('div');board.id='dig-board';board.append(canvas);$('.play-area').append(board);
const ctx=canvas.getContext('2d');
// Fit the cropped logical scene without stretching the fossil.
function sizeBoard(){const r=board.getBoundingClientRect(),scale=Math.min(r.width/692,r.height/520);canvas.style.width=Math.max(1,692*scale)+'px';canvas.style.height=Math.max(1,520*scale)+'px';}
new ResizeObserver(sizeBoard).observe(board);sizeBoard();
const offer=button('next-tool','Next tool','<img alt="" draggable="false"><small></small>',{className:'next-tool'});offer.hidden=true;board.append(offer);
const ghost=document.createElement('img');ghost.id='tool-ghost';ghost.alt='';ghost.hidden=true;document.body.append(ghost);
// Release assistance is checked only by an actual pointer/key release.
const RELEASE_COVERAGE=.95;
let fade=null,offerReady=false,toolFresh=true,keyboardUsing=false,releaseFinish=false;
const assetTool=id=>'tool-'+(id==='finebrush'?'brush':id);
const toolClip=id=>id==='finebrush'?'dd3_finebrush':'dd1_'+id;
function nextReady(){const next=level+1;return next<3&&images.has(assetTool(LAYERS[next].tool))&&images.has(next===2?'depth/'+dino.id+'-final':depthPictures()[next+1]);}
function positionOffer(){const c=canvas.getBoundingClientRect(),b=board.getBoundingClientRect();offer.style.right=Math.max(10,b.right-c.right+12)+'px';offer.style.top=Math.max(8,c.top-b.top+8)+'px';}
new ResizeObserver(positionOffer).observe(canvas);
function syncTool(){
 const available=['dig','toolReady'].includes(phase);
 if(!available){offer.hidden=true;offer.classList.remove('ready','taken');return;}
 const id=LAYERS[phase==='toolReady'?level+1:level].tool;
 if(offer.dataset.tool!==id){offer.dataset.tool=id;offer.querySelector('img').dataset.asset=assetTool(id);offer.querySelector('img').src=imageSource(assetTool(id));refreshTools();}
 const ready=phase==='dig'||nextReady(),using=phase==='dig'&&(!!gesture||keyboardUsing);
 offer.disabled=!ready;offer.hidden=false;offer.classList.toggle('taken',using);offer.classList.toggle('ready',ready&&toolFresh&&!using);offer.setAttribute('aria-pressed',String(!toolFresh));positionOffer();
 document.body.dataset.toolFresh=String(toolFresh);
}
function updateOffer(){if(phase!=='toolReady')return;syncTool();if(nextReady()&&!offerReady){offerReady=true;app.guide=level===0?'dd4_brush':'dd4_fine';app.guideTo(app.guide);app.chime('tap');}}
function fadeResiduals(final=false){fade={index:level,at:app.time,duration:reduced.matches?.3:.95,final};}
function finishLayer(){
 if(phase!=='dig'||fade||!(layers[level].complete||(releaseFinish&&!gesture&&!keyboardUsing)))return;
 if(level<2)offerTool();else{keyboardPoint=null;app.tools.replaceChildren();fadeResiduals(true);phaseTo('finishing');}
}
function offerTool(){
 // Only full clearing while held, or an eligible release, can offer a new tool.
 fadeResiduals();keyboardPoint=null;toolFresh=true;phaseTo('toolReady');offerReady=false;
 app.guide=level===0?'dd4_brush':'dd4_fine';app.caption.textContent=DIG_LINES[app.guide];syncTool();updateOffer();
}
function takeTool(){
 if(phase!=='toolReady'||!nextReady())return false;
 LAYERS.forEach((l,i)=>{if(!layers[i]&&images.has(depthPictures()[i]))layers[i]=new SoilLayer(images.get(depthPictures()[i]),l.strength);});
 level++;loading.hidden=true;beginDig();return true;
}
function showGhost(e){if(!gesture?.fromTool)return;ghost.src=imageSource(assetTool(LAYERS[level].tool));ghost.dataset.tool=LAYERS[level].tool;ghost.hidden=false;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}
// A single toolbar represents both the first tool and later tools. It is a
// hint, not a gate: touching the digging area equips the same current tool.
function useTool(){
 releaseFinish=false;
 if(phase==='toolReady'&&!takeTool())return false;
 if(phase!=='dig')return false;
 const firstUse=toolFresh;toolFresh=false;offer.classList.remove('ready');
 if(firstUse){app.guide=LAYERS[level].clip;app.guideTo(app.guide);}
 return true;
}
offer.addEventListener('pointerdown',e=>{
 if(!validPointer(e)||!['dig','toolReady'].includes(phase))return;
 e.preventDefault();e.stopPropagation();app.input();if(!useTool())return;
 gesture={id:e.pointerId,from:offer,fromTool:true,moved:false,start:{x:e.clientX,y:e.clientY},point:point(e),at:app.time};
 try{offer.setPointerCapture(e.pointerId);}catch{}syncTool();showGhost(e);updateData();
});
offer.addEventListener('click',e=>{if(e.detail===0&&!app.hidden){app.input();if(useTool()){app.feedback(toolClip(LAYERS[level].tool));syncTool();}}});
const loading=document.createElement('div');loading.id='loading-dig';board.append(loading);
const discovery=document.createElement('div');discovery.id='discovery';discovery.hidden=true;board.append(discovery);
const nextButton=document.createElement('button');nextButton.id='next-dinosaur';nextButton.type='button';nextButton.hidden=true;nextButton.innerHTML='<span class=next-label></span><span class=next-arrow aria-hidden=true>➜</span>';document.querySelector('footer').prepend(nextButton);
nextButton.addEventListener('click',()=>{if(phase!=='alive'||app.hidden)return;app.input();nextButton.disabled=true;phaseTo('departing');app.guide='dd1_next';app.say(app.guide);});
const images=new Map(),repairing=new WeakSet();let token=0;
let queue=shuffle([...DINOSAURS]),lastId=null,dino=null,phase='loading',phaseAt=0,aliveAt=0,level=0,layers=[],gesture=null,particles=[],lastHint=-9,served=0,strokeCount=0,pointerMark=null,keyboardPoint=null;
let progressAt=0,progressCoverage=0,attemptsSinceProgress=0,stuckHint=false,lastRedirect=-30;
const loader=createImageLoader({images,url:art,paused:()=>app.hidden||app.destroyed,onReady:(name,image)=>{if(dino&&name==='site-'+dino.site)$('.backdrop').style.backgroundImage='url("'+image.src+'")';}});
const imageSource=name=>images.get(name)?.src||art(name);
// Retired species stay in saved history for a future return, but do not count toward the active collection.
let discovered=new Set(),retiredDiscoveries=[];try{const v=JSON.parse(localStorage.getItem('xiaoxiaoDinoDiscoveries')||'[]');if(Array.isArray(v)){discovered=new Set(v.filter(x=>DINOSAURS.some(d=>d.id===x)));retiredDiscoveries=[...new Set(v.filter(x=>['styracosaurus','centrosaurus'].includes(x)))];}}catch{}
const baseLanguage=window.XiaoxiaoI18n.applyLanguage;
window.XiaoxiaoI18n.applyLanguage=lang=>{baseLanguage(lang);refreshLabels();};
function refreshLabels(){
 $('.heading small').textContent=tr('LITTLE DIGS · BIG DISCOVERIES','轻轻挖一挖 · 一点点发现');
 $('#replay').setAttribute('aria-label',tr('Listen again','再听一遍'));$('#speech').setAttribute('aria-label',tr('Listen again','再听一遍'));
 $('#again').setAttribute('aria-label',tr('Dig this fossil again','重新挖这块化石'));
 $('#art-note').textContent=tr('↻ Bring our fossil camp back','↻ 重新加载考古营地');
 nextButton.querySelector('.next-label').textContent=tr('Next dinosaur!','下一只恐龙！');nextButton.setAttribute('aria-label',tr('Find the next dinosaur','去找下一只恐龙'));
 loading.textContent=tr('Our fossil camp is getting ready…','考古营地正在准备……');
 updateData();refreshTools();
}
function nextDino(){if(!queue.length){queue=shuffle([...DINOSAURS]);if(queue[0].id===lastId)[queue[0],queue[1]]=[queue[1],queue[0]];}const d=queue.shift();lastId=d.id;return d;}
function phaseTo(p){if(p!=='dig')scrub.stop();phase=p;phaseAt=app.time;document.body.dataset.phase=p;nextButton.hidden=p!=='alive';nextButton.disabled=p!=='alive';updateData();syncTool();}
function updateData(){
 if(!dino)return;
 Object.assign(document.body.dataset,{imageCount:String(images.size),total:String(DINOSAURS.length),dino:dino.id,site:dino.site,phase,layer:String(level),tool:phase==='dig'?LAYERS[level].tool:'none',coverage:String(layers[level]?.coverage||0),coverages:JSON.stringify(LAYERS.map((_,i)=>+(layers[i]?.coverage||0).toFixed(5))),served:String(served),discoveries:String(discovered.size),strokes:String(strokeCount),dragging:String(!!gesture),depthArt:JSON.stringify(depthPictures()),centralCoverage:String(layers[level]?.centralCoverage||0),fade:fade?String(clamp((app.time-fade.at)/fade.duration,0,1)):'none'});
 $('#progress').textContent=tr(discovered.size+' of '+DINOSAURS.length+' dinosaurs', '发现了 '+discovered.size+' / '+DINOSAURS.length+' 种');
 canvas.setAttribute('aria-label',phase==='loading'?tr('Our fossil camp is getting ready','考古营地正在准备'):phase==='dig'?tr('Dig the highlighted patch. Move with arrows or press Enter to explore.','挖开提示的土块。方向键移动，空格挖掘，回车挖提示位置。'):phase==='toolReady'?tr('Touch the soil, or tap or drag the glowing tool.','直接触摸土面，或点按、拖动发光的工具。'):phase==='revealed'?tr('The whole fossil is uncovered. Watch our dinosaur come alive.','完整化石露出来了，看看恐龙活着的样子。'):tr('Meet our dinosaur. Use the big next dinosaur button to keep exploring.','认识这只恐龙，点下方大按钮去找下一只。'));
 if(phase==='alive')discovery.innerHTML=(app.lang==='zh'?dino.zh:dino.en)+'<small>'+tr(dino.fact,dino.zhfact)+'</small>';
 for(const b of app.tools.querySelectorAll('button'))b.disabled=phase!=='dig';
}
function refreshTools(){
 for(const b of document.querySelectorAll('.tool[data-tool]')){b.querySelector('small').textContent=tr(TOOLS[b.dataset.tool].en,TOOLS[b.dataset.tool].zh);b.setAttribute('aria-label',tr(TOOLS[b.dataset.tool].en,TOOLS[b.dataset.tool].zh));}
}
function depthPictures(){return ['depth/soil','depth/'+dino.id+'-peek','depth/'+dino.id+'-reveal'];}
async function prepare(friend){
 const local=++token;loader.cancel();cancelGesture();
 // Keep only this animal's decoded pictures; twenty rounds must not retain all artwork.
 for(const name of images.keys())if((name.startsWith('dino-')&&name!=='dino-'+friend.id)||(name.startsWith('depth/')&&name!=='depth/soil'&&!name.startsWith('depth/'+friend.id+'-')))images.delete(name);
fade=null;toolFresh=true;keyboardUsing=false;offer.hidden=true;offer.classList.remove('ready','taken');app.newRound();app.guide=null;dino=friend;level=0;layers=[];particles=[];pointerMark=null;keyboardPoint=null;strokeCount=0;discovery.hidden=true;loading.hidden=false;$('#art-note').hidden=true;
 phaseTo('loading');loading.textContent=tr('Our fossil camp is getting ready…','考古营地正在准备……');app.caption.textContent=DIG_LINES.dd1_welcome;
 const site='site-'+dino.site;if(images.has(site))$('.backdrop').style.backgroundImage='url("'+imageSource(site)+'")';
 // Only the first surface, its immediate reveal and current tool gate play.
 loader.load(site);
 const required=[...depthPictures().slice(0,2),'tool-shovel'];
 const ready=await Promise.all(required.map(n=>loader.load(n)));
 if(local!==token||app.destroyed||ready.some(im=>!im))return;
 layers=LAYERS.map((l,i)=>images.has(depthPictures()[i])?new SoilLayer(images.get(depthPictures()[i]),l.strength):null);loading.hidden=true;$('#art-note').hidden=true;beginDig(true);
 // Later pictures download while the child explores the first layer.
 for(const name of [...depthPictures().slice(2),'depth/'+dino.id+'-final','tool-brush','dino-'+dino.id])loader.load(name);
}
function beginDig(first=false){
 // Set the new phase before syncing the toolbar: level already advanced.
 toolFresh=true;phaseTo('dig');cancelGesture();progressAt=app.time;progressCoverage=layers[level].coverage;attemptsSinceProgress=0;stuckHint=false;document.body.dataset.guidance='none';buildTools();app.lastInput=app.time;lastHint=app.time;app.guide=LAYERS[level].clip;
 if(first){app.guide='dd4_start';app.sequence(['dd1_welcome',app.guide]);}else app.guideTo(app.guide);
}
function buildTools(){app.tools.replaceChildren();syncTool();updateData();}
function point(e){const r=canvas.getBoundingClientRect();return{x:14+(e.clientX-r.left)*692/r.width,y:38+(e.clientY-r.top)*520/r.height};}
function validPointer(e){return e.isPrimary&&e.button<=0&&!app.hidden&&!gesture;}
function inSurface(p){return p.x>=SURFACE.x-12&&p.x<=SURFACE.x+SURFACE.w+12&&p.y>=SURFACE.y-12&&p.y<=SURFACE.y+SURFACE.h+12;}
function cancelGesture(){
 scrub.stop();
 releaseFinish=false;ghost.hidden=true;keyboardUsing=false;
 if(gesture){try{gesture.from.releasePointerCapture(gesture.id);}catch{}}
 gesture=null;pointerMark=null;if(dino){document.body.dataset.dragging='false';syncTool();}
}
function finishOnRelease(){
 if(phase!=='dig'||app.hidden||gesture||keyboardUsing)return;
 releaseFinish=layers[level].centralCoverage>RELEASE_COVERAGE;finishLayer();
}
function dust(x,y){if(reduced.matches)return;for(let i=0;i<4;i++)particles.push({x,y,vx:(Math.random()-.5)*105,vy:-40-Math.random()*70,age:0,color:LAYERS[level].color,r:3+Math.random()*5});while(particles.length>72)particles.shift();}
function stamp(p){
 if(phase!=='dig'||app.hidden||!inSurface(p))return;
 pointerMark={...p,at:app.time};app.lastInput=app.time;
 const changed=layers[level].stamp(p.x,p.y);strokeCount++;attemptsSinceProgress++;const coverage=layers[level].coverage;if(coverage-progressCoverage>=.004){progressAt=app.time;progressCoverage=coverage;attemptsSinceProgress=0;stuckHint=false;app.guide=LAYERS[level].clip;document.body.dataset.guidance='none';}if(changed){dust(p.x,p.y);scrub.stroke(level);}
 updateData();
 finishLayer();
}
function sweep(a,b){
 const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.min(85,Math.max(1,Math.ceil(distance/22)));
 for(let i=1;i<=steps&&phase==='dig';i++)stamp({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps});
}
function meetDino(){
 cancelGesture();served++;discovered.add(dino.id);try{localStorage.setItem('xiaoxiaoDinoDiscoveries',JSON.stringify([...discovered,...retiredDiscoveries]));}catch{}
 app.tools.replaceChildren();discovery.hidden=false;phaseTo('alive');aliveAt=app.time;app.guide=dino.factClip;app.sequence(['dd1_imagine',dino.nameClip,dino.factClip,'dd5_next_button']);app.celebrate();app.lastInput=app.time;
}
board.addEventListener('pointerdown',e=>{
 if(!validPointer(e)||!['dig','toolReady','alive'].includes(phase))return;e.preventDefault();app.input();const p=point(e);
 if(phase==='alive'){phaseAt=app.time;app.say('dd1_hello');app.chime('pop');return;}
 if(!useTool())return;
 gesture={id:e.pointerId,from:board,fromTool:false,moved:false,start:{x:e.clientX,y:e.clientY},point:p,at:app.time};try{board.setPointerCapture(e.pointerId);}catch{}syncTool();
 if(phase==='dig')stamp(p);
});
document.addEventListener('pointermove',e=>{
 if(!gesture||e.pointerId!==gesture.id||app.hidden)return;e.preventDefault();
 const old=gesture.point,p=point(e);gesture.point=p;gesture.moved=gesture.moved||Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)>5;
 showGhost(e);
 if(gesture.moved&&phase==='dig'){gesture.at=app.time;sweep(old,p);}else if(gesture.moved)app.lastInput=app.time;
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!gesture||e.pointerId!==gesture.id)return;const fromTool=gesture.fromTool,moved=gesture.moved,p=point(e);
 if(fromTool&&moved){if(phase==='dig')stamp(p);}cancelGesture();finishOnRelease();
});
document.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId)cancelGesture();});
canvas.addEventListener('keydown',e=>{
 if(app.hidden)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();keyboardPoint ||= layers[level]?.hint()||{x:360,y:280};keyboardPoint.x=clamp(keyboardPoint.x+(e.key==='ArrowLeft'?-34:e.key==='ArrowRight'?34:0),48,672);keyboardPoint.y=clamp(keyboardPoint.y+(e.key==='ArrowUp'?-34:e.key==='ArrowDown'?34:0),70,490);app.input();return;}
 if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();app.input();
 if(['dig','toolReady'].includes(phase)&&useTool()){keyboardUsing=true;syncTool();stamp(e.key===' '&&keyboardPoint?keyboardPoint:layers[level].hint());}
 else if(phase==='alive'){phaseAt=app.time;app.say('dd1_hello');}
});
canvas.addEventListener('keyup',e=>{if((e.key==='Enter'||e.key===' ')&&keyboardUsing){scrub.stop();keyboardUsing=false;syncTool();finishOnRelease();}});
app.onCancel=cancelGesture;app.onRestart=()=>{if(dino)prepare(dino);};
app.onVisibility=visible=>{cancelGesture();if(visible&&['revealed','alive'].includes(phase)){phaseAt=app.time;if(app.guide)app.say(app.guide);}};
async function repairImage(im){
 if(!im.dataset.asset||repairing.has(im))return;repairing.add(im);const local=token;
 const loaded=await loader.load(im.dataset.asset,true);repairing.delete(im);
 if(loaded&&local===token&&im.isConnected&&!app.destroyed)im.src=loaded.src;
}
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){$('#art-note').hidden=true;repairImage(e.target);}},true);
$('#art-note').onclick=()=>{loader.resume();$('#art-note').hidden=true;};
function roundRect(x,y,w,h,r,fill,stroke=null,line=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function drawImage(name,x,y,w,h,alpha=1){const im=images.get(name);if(!im)return;ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(im,x,y,w,h);ctx.restore();}
function arrow(x,y,time){
 ctx.save();ctx.translate(x,y);if(!reduced.matches)ctx.translate(0,Math.sin(time*3)*6);
 ctx.fillStyle='#f8ce75';ctx.strokeStyle='#fff9e9';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-11,-56);ctx.lineTo(11,-56);ctx.lineTo(11,-32);ctx.lineTo(25,-32);ctx.lineTo(0,-7);ctx.lineTo(-25,-32);ctx.lineTo(-11,-32);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
// All four exposure pictures share one rectangle. Erasing a layer reveals the
// next complete image locally; the skeleton never becomes a separate puzzle.
function drawPit(alpha=1){
 ctx.save();ctx.globalAlpha*=alpha;
 roundRect(22,44,676,476,43,'#9b7250');roundRect(28,43,664,462,38,'#d4af7b');roundRect(36,50,648,448,34,'#bb8e5d');
 roundRect(43,58,634,436,29,'#f0d7a3');
 ctx.save();ctx.beginPath();ctx.roundRect(SURFACE.x,SURFACE.y,SURFACE.w,SURFACE.h,27);ctx.clip();
 drawImage('depth/'+dino.id+'-final',SURFACE.x,SURFACE.y,SURFACE.w,SURFACE.h);
 for(let i=2;i>=0;i--)if(layers[i]){ctx.save();if(fade?.index===i){const u=clamp((app.time-fade.at)/fade.duration,0,1);ctx.globalAlpha*=1-u*u*(3-2*u);}ctx.drawImage(layers[i].canvas,0,0);ctx.restore();}
 ctx.restore();ctx.strokeStyle='#76563855';ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(48,70,624,420,27);ctx.stroke();
 for(let i=0;i<3;i++){roundRect(66,519+i*12,588,11,4,LAYERS[i].color);if(i<level||phase==='revealed'){ctx.fillStyle='#fff5d370';ctx.fillRect(66,519+i*12,588,11);}}
 ctx.restore();
}
function draw(dt,time){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,692,520);if(!dino||phase==='loading')return;ctx.translate(-14,-38);
 const digging=['dig','toolReady','finishing','revealed'].includes(phase);
 if(digging){
  drawPit();
  if(phase==='dig'&&(time-app.lastInput>4||keyboardPoint||stuckHint)){
   const h=keyboardPoint||layers[level].hint();ctx.save();ctx.strokeStyle='#fff1b7';ctx.lineWidth=4;ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(h.x,h.y,54,0,Math.PI*2);ctx.stroke();ctx.restore();arrow(h.x,h.y-47,time);
  }
  const mark=gesture?.point||pointerMark;
  if(mark&&!gesture?.fromTool&&inSurface(mark)&&(gesture||time-mark.at<.45)){const id=LAYERS[level].tool;ctx.save();ctx.translate(mark.x+8,mark.y-8);if(!reduced.matches)ctx.rotate(Math.sin(time*16)*.08);const size=id==='finebrush'?79:105;drawImage(assetTool(id),-size/2,-size/2,size,size);ctx.restore();}
 }else if(['alive','departing'].includes(phase)){
  const age=time-aliveAt,t=clamp(age/.8,0,1),bounce=reduced.matches?0:Math.sin(Math.min(age,1)*Math.PI)*-18;
  ctx.fillStyle='#a1845433';ctx.beginPath();ctx.ellipse(360,506,220,23,0,0,Math.PI*2);ctx.fill();
  if(t<1)drawPit(1-t);
  ctx.save();ctx.translate(0,bounce+(reduced.matches?0:Math.sin(time*2)*3));drawImage('dino-'+dino.id,35,66,650,450,t);ctx.restore();
 }
 for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;ctx.globalAlpha=Math.max(0,1-p.age/.65);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.65,p.age*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;particles=particles.filter(p=>p.age<.65);
}
app.listeners.add((dt,time)=>{
 if(fade){document.body.dataset.fade=String(clamp((time-fade.at)/fade.duration,0,1));if(time-fade.at>=fade.duration){const ended=fade;layers[ended.index].clear();fade=null;document.body.dataset.fade='none';updateData();if(ended.final){phaseTo('revealed');app.guide=LAYERS[2].done;app.say(app.guide);}else if(phase==='dig')finishLayer();}}

 if(phase==='dig'){
  const stalled=time-progressAt>3.8&&attemptsSinceProgress>=3;
  if(stalled&&!stuckHint){stuckHint=true;document.body.dataset.guidance='remaining';}
  if(stuckHint&&time-lastRedirect>14&&!app.voice.active){lastRedirect=time;app.guideTo('dd1_over_here');}
  if(gesture&&!gesture.fromTool&&time-gesture.at>.13){gesture.at=time;stamp(gesture.point);}
  if(time-app.lastInput>13&&time-lastHint>18){lastHint=time;app.guideTo(toolFresh?'dd4_start':LAYERS[level].clip);}
 }else if(phase==='toolReady'){updateOffer();if(time-app.lastInput>12&&time-lastHint>15&&offerReady){lastHint=time;app.guideTo(app.guide);}}else if(phase==='revealed'&&time-phaseAt>1.8&&(!app.voice.active||time-phaseAt>6)){if(images.has('dino-'+dino.id)){loading.hidden=true;meetDino();}else{loading.textContent=tr('Our dinosaur is on its way…','恐龙正在赶来……');loading.hidden=false;}}
 else if(phase==='alive'&&time-app.lastInput>18&&time-lastHint>22&&!app.voice.active){lastHint=time;app.say('dd5_next_button');}
 else if(phase==='departing'&&time-phaseAt>.8&&(!app.voice.active||time-phaseAt>4))prepare(nextDino());
 draw(dt,time);
});
refreshLabels();prepare(nextDino());
