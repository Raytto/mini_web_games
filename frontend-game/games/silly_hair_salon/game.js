import {Playground,$,svg,attr,picture,button,icon,accessible,Bag,clamp,shuffle,LINES} from '../playful_shared/core.js?v=20261002play1';
import {STYLES,STRAND_COUNT,ROOT_Y,HAIR_LEFT,HAIR_RIGHT,makeHair,finished,needsCut,needsGrow,cutHair,growHair,assess,guidePath} from './model.js?v=20261002salon2';
import {SALON_LINES} from './lines.js?v=20261002salon2';
// The shared player stays unchanged. This page contributes only its own IDs.
Object.assign(LINES,SALON_LINES);
const app=new Playground({id:'silly_hair_salon',title:'Silly Hair Salon',zh:'怪兽理发店',theme:'peach',eyebrow:'A LITTLE SNIP · A BIG SMILE'});
const bag=new Bag(STYLES);bag.bag=shuffle(STYLES.slice(1));bag.last=STYLES[0];
const palettes=[['#844ca5','#c296e3','#e9b464'],['#d05983','#ffb3c9','#8ac8b7'],['#278d9e','#82dbe2','#ebb264'],['#bf7028','#ffcf69','#b894cf'],['#5277c1','#a4c9ff','#ecaaa8']];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let look,hair,paths,customer,face,guide,card,effects,cursor,primary,checkButton,progressFill;
let gesture=null,phase='',phaseAt=0,served=0,visit=0,enterSide=1,colors,particles=[],regrowth=[];
let hintAt=0,lastSnip=-10,celebrationAt=0;
const art={
 cut:'<svg viewBox="0 0 70 70" aria-hidden="true"><path d="M25 43 52 13Q58 7 58 17L36 47M33 40 18 13Q14 5 13 17L24 48" fill="#bacdd0" stroke="#6c9299" stroke-width="3"/><circle cx="22" cy="50" r="11" fill="#f29490" stroke="#bf625f" stroke-width="3"/><circle cx="44" cy="51" r="11" fill="#f29490" stroke="#bf625f" stroke-width="3"/><circle cx="22" cy="50" r="5" fill="#fff2dc"/><circle cx="44" cy="51" r="5" fill="#fff2dc"/><circle cx="31" cy="37" r="3" fill="#edc65f"/></svg>',
 grow:'<svg viewBox="0 0 70 70" aria-hidden="true"><path d="m19 59 29-37" stroke="#71b9a3" stroke-width="11" stroke-linecap="round"/><path d="m47 6 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill="#f5cf6f" stroke="#bc8a25" stroke-width="2"/><path d="M16 15v9m-4-4h8M60 46v9m-4-4h8" stroke="#ebaa6f" stroke-width="3" stroke-linecap="round"/></svg>'
};
const feedback=document.createElement('div');feedback.id='salon-feedback';feedback.hidden=true;feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');$('.play-area').append(feedback);
app.scene.setAttribute('viewBox','60 25 540 590');
const toolHint=document.createElement('div');toolHint.id='tool-hint';app.tools.before(toolHint);
function text(en,zh){return app.lang==='zh'?zh:en;}
function setPhase(value){phase=value;phaseAt=app.time;document.body.dataset.phase=value;}
function setGuide(id,speak=true){app.guideTo(id,speak);}
function hairPath(h,y=h.y){const mid=(ROOT_Y+y)/2;return `M${h.x} ${ROOT_Y} C${h.x+h.wave} ${mid+27} ${h.x-h.wave} ${mid-20} ${h.x} ${y}`;}
function paintHair(i,y){const h=hair[i],p=paths[i],d=hairPath(h,y);attr(p.main,{d});attr(p.shine,{d});attr(p.hit,{d});p.g.dataset.complete=String(finished(h));p.g.dataset.y=h.y.toFixed(2);p.g.dataset.target=h.target.toFixed(2);p.g.dataset.x=h.x.toFixed(2);p.g.dataset.needsGrow=String(needsGrow(h));p.g.dataset.needsCut=String(needsCut(h));p.g.classList.toggle('needs-grow',phase==='repairing'&&needsGrow(h));}
function updateProgress(){const state=assess(hair);document.body.dataset.progress=String(state.complete);document.body.dataset.remaining=String(state.cut);document.body.dataset.gaps=String(state.grow);progressFill.setAttribute('width',String(180*state.complete/STRAND_COUNT));$('#progress').textContent=text(`${served} happy ${served===1?'friend':'friends'}`,`已服务 ${served} 位顾客`);$('#progress').setAttribute('aria-label',text(`${served} happy customers`,`已服务 ${served} 位顾客`));return state;}
function showTool(){const growing=phase==='repairing';primary.innerHTML=art[growing?'grow':'cut']+`<span>${text(growing?'Magic grow':'Scissors',growing?'魔法长回来':'小剪刀')}</span>`;primary.dataset.tool=growing?'grow':'cut';primary.setAttribute('aria-label',growing?'Magic grow wand — touch the missing hair':'Scissors — follow the dotted line');primary.setAttribute('aria-pressed','true');toolHint.textContent=text(growing?'Brush the sparkly gaps to grow it back':'Snip along the dotted line',growing?'涂一涂闪亮的缺口，让头发长回来':'沿着虚线剪一剪');checkButton.hidden=growing;document.body.dataset.tool=growing?'grow':'cut';}
function puff(x,y,kind='cut',amount=3){if(reduced.matches)return;for(let i=0;i<amount&&particles.length<75;i++){const e=svg(kind==='cut'?'path':'circle',kind==='cut'?{d:'M-3 -9Q5 0 -2 9',fill:'none',stroke:i%2?colors[0]:colors[1],'stroke-width':7,'stroke-linecap':'round'}:{r:3+Math.random()*4,fill:i%2?'#fff5a6':'#efbd45'},effects);particles.push({e,x,y,vx:(Math.random()-.5)*140,vy:kind==='cut'?-40-Math.random()*100:-70-Math.random()*50,life:0,duration:kind==='cut'?.75:.5,rotation:Math.random()*360,kind});}}
function resetGesture(){if(gesture){try{app.scene.releasePointerCapture(gesture.id);}catch{}}gesture=null;if(cursor)cursor.style.display='none';}
function finishStroke(){resetGesture();if(phase==='playing'||phase==='repairing')assessFinish();}
function assessFinish(explicit=false){const state=updateProgress();if(state.cut===0){if(state.grow){if(phase!=='repairing')beginRepair();}else if(phase!=='complete')complete();}else if(explicit){setGuide('hs2_hint');for(const p of paths)if(needsCut(hair[p.index]))p.g.classList.add('hint-pulse');guide.classList.add('hint-pulse');}}
function beginRepair(){setPhase('repairing');showTool();guide.classList.add('repair-guide');hair.forEach((_,i)=>paintHair(i));setGuide('hs2_repair');app.chime('pop');}
function complete(){resetGesture();setPhase('complete');served++;updateProgress();primary.disabled=true;checkButton.disabled=true;guide.classList.remove('hint-pulse');guide.classList.add('guide-complete');customer.querySelectorAll('[data-gap]').forEach(e=>e.setAttribute('opacity','0'));card.classList.add('look-approved');face.classList.add('wiggle');feedback.hidden=false;feedback.className='is-complete';feedback.innerHTML='<span class="feedback-star" aria-hidden="true">★</span><strong>Complete!</strong><span>'+text('Looking lovely!','新发型真好看！')+'</span>';app.celebrate();celebrationAt=app.time;setGuide('hs2_complete');}
function countdown(){setPhase('countdown');feedback.className='is-coming';feedback.innerHTML='<span class="count-number" aria-hidden="true">2</span><strong>New customer is coming!</strong>';document.body.dataset.countdown='2';setGuide('hs2_coming');}
function actAt(a,b){if(!['playing','repairing'].includes(phase)||!gesture)return;const mode=gesture.mode;if(mode!==phase)return;let changed=false;
 const scale=app.scene.getScreenCTM()?.a||1,radius=clamp(9/scale,9,22),tolerance=clamp(8/scale,12,23),dx=b.x-a.x;
 for(let i=0;i<hair.length;i++){const h=hair[i];const t=Math.abs(dx)>.01?clamp((h.x-a.x)/dx,0,1):1;const px=a.x+dx*t,py=a.y+(b.y-a.y)*t;
  if(Math.abs(h.x-px)>radius)continue;
  if(mode==='repairing'){if(gesture.used.has(i)||!needsGrow(h)||py<h.target-25||py>ROOT_Y+28)continue;const old=h.y;if(growHair(h)){gesture.used.add(i);regrowth.push({i,from:old,at:app.time});puff(h.x,h.target,'grow');changed=true;}}
  else {if(py<h.y-5||py>ROOT_Y+24)continue;const localTarget=look.target(clamp((px-HAIR_LEFT)/(HAIR_RIGHT-HAIR_LEFT)*2-1,-1,1));const onGuide=Math.abs(py-localTarget)<=tolerance;const old=h.y;if(cutHair(h,onGuide?h.target:py,tolerance)){paintHair(i);changed=true;if(old<h.y-9&&i%3===0)puff(h.x,(old+h.y)/2);}}
 }
 if(changed){app.input();if(app.time-lastSnip>.07){app.chime(mode==='repairing'?'pop':'snip');lastSnip=app.time;}face.classList.remove('wiggle');void face.getBoundingClientRect();face.classList.add('wiggle');updateProgress();}
 cursor.style.display='';attr(cursor,{transform:`translate(${b.x+14} ${b.y+7}) rotate(${mode==='repairing'?-18:-12})`});
}
function keyboardStrand(i){if(!['playing','repairing'].includes(phase))return;app.input();gesture={mode:phase,used:new Set()};const h=hair[i],y=phase==='repairing'?(h.y+h.target)/2:h.target;actAt({x:h.x,y},{x:h.x,y});finishStroke();}
function drawCustomer(){const s=app.scene;
 svg('ellipse',{cx:300,cy:566,rx:166,ry:23,fill:'#775349',opacity:.14},s);
 svg('rect',{x:235,y:432,width:130,height:88,rx:18,fill:'#ae8d98'},s);svg('path',{d:'M300 508v54m-70 4h140',stroke:'#be9583','stroke-width':14,'stroke-linecap':'round'},s);
 customer=svg('g',{id:'customer'},s);picture('monster-'+['teal','pink','blue'][visit%3],107,147,386,386,customer);
 svg('path',{d:'M193 413Q300 447 405 413L434 489Q300 555 165 489Z',fill:colors[2],stroke:'#fff1dc','stroke-width':5},customer);
 for(let i=0;i<10;i++)svg('circle',{cx:187+i*25,cy:462+(i%3)*13,r:4,fill:'#fff4d5',opacity:.75},customer);
 svg('path',{d:'M280 448q20 17 40 0l-5 32h-29Z',fill:'#fff5df',opacity:.7},customer);
 face=svg('g',{id:'face'},customer);
 for(const x of [254,346]){svg('ellipse',{cx:x,cy:332,rx:26,ry:31,fill:'#fff9e9'},face);svg('ellipse',{cx:x+2,cy:335,rx:11,ry:16,fill:'#4b3444'},face);svg('circle',{cx:x-3,cy:326,r:5,fill:'#fff'},face);}
 svg('ellipse',{cx:221,cy:370,rx:20,ry:11,fill:'#f99da0',opacity:.7},face);svg('ellipse',{cx:379,cy:370,rx:20,ry:11,fill:'#f99da0',opacity:.7},face);
 svg('path',{d:'M270 379Q300 403 331 379Q326 418 300 418Q278 418 270 379',fill:'#65394a'},face);svg('ellipse',{cx:304,cy:408,rx:14,ry:7,fill:'#f4a1aa'},face);
 svg('path',{d:'M155 282Q300 312 445 282',fill:'none',stroke:colors[0],'stroke-width':15,'stroke-linecap':'round'},customer);
 paths=hair.map((h,i)=>{const g=svg('g',{'data-strand':i},customer);const main=svg('path',{fill:'none',stroke:colors[0],'stroke-width':13,'stroke-linecap':'round'},g);const shine=svg('path',{fill:'none',stroke:colors[1],'stroke-width':4,'stroke-linecap':'round',opacity:.72},g);const hit=svg('path',{fill:'none',stroke:'transparent','stroke-width':18},g);accessible(g,'Style hair lock '+(i+1),()=>keyboardStrand(i));return{g,main,shine,hit,index:i};});hair.forEach((_,i)=>paintHair(i));
 guide=svg('g',{id:'hair-guide','aria-hidden':'true'},customer);const d=guidePath(look);svg('path',{d,fill:'none',stroke:'#422f57','stroke-width':9,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.28},guide);svg('path',{d,fill:'none',stroke:'#fffcea','stroke-width':5,'stroke-dasharray':'2 11','stroke-linecap':'round','stroke-linejoin':'round'},guide);
 // Ghost locks stay visible even when a lock was cut all the way to its root.
 const ghosts=svg('g',{id:'grow-gaps','aria-hidden':'true'},customer);hair.forEach((h,i)=>svg('path',{'data-gap':i,d:`M${h.x} ${h.target}L${h.x} ${ROOT_Y}`,fill:'none',stroke:'#ffe59a','stroke-width':6,'stroke-dasharray':'3 8','stroke-linecap':'round',opacity:0},ghosts));
 card=svg('g',{id:'look-card','aria-label':'Requested haircut: '+look.label},s);svg('path',{d:'M463 83h111q13 0 13 13v131q0 13-13 13h-85l-22 17 4-17h-8q-13 0-13-13V96q0-13 13-13Z',fill:'#fffbed',stroke:'#debe92','stroke-width':3},card);
 svg('text',{x:518,y:109,'text-anchor':'middle',fill:'#825d55','font-size':15,'font-weight':700},card).textContent=text('My wish','我想要');
 svg('ellipse',{cx:518,cy:187,rx:31,ry:27,fill:'#b1daca'},card);
 const preview=svg('g',{transform:'translate(434 100) scale(.28)'},card);svg('path',{d:d+`L${HAIR_RIGHT} ${ROOT_Y}L${HAIR_LEFT} ${ROOT_Y}Z`,fill:colors[0],stroke:colors[1],'stroke-width':4,'stroke-linejoin':'round'},preview);
 for(const x of [509,527]){svg('ellipse',{cx:x,cy:195,rx:5,ry:6,fill:'#fffdf3'},card);svg('circle',{cx:x,cy:196,r:2.5,fill:'#5b415c'},card);}
 svg('path',{d:'M512 205q6 5 12 0',fill:'none',stroke:'#5b415c','stroke-width':2,'stroke-linecap':'round'},card);
 svg('text',{x:518,y:229,'text-anchor':'middle',fill:'#664977','font-size':look.label.length>9?12:15,'font-weight':700},card).textContent=text(look.label,look.zh);
 const meter=svg('g',{'aria-hidden':'true'},s);svg('rect',{x:210,y:595,width:180,height:7,rx:4,fill:'#fffae8',opacity:.7},meter);progressFill=svg('rect',{x:210,y:595,width:0,height:7,rx:4,fill:'#619f88'},meter);
 effects=svg('g',{'pointer-events':'none','aria-hidden':'true'},s);
 cursor=svg('g',{'pointer-events':'none','aria-hidden':'true',id:'tool-cursor'},s);cursor.style.display='none';
}
function drawCursor(){cursor.replaceChildren();if(phase==='repairing'){svg('path',{d:'M0 18 20-5',stroke:'#8ec8b0','stroke-width':7,'stroke-linecap':'round'},cursor);svg('path',{d:'m20-18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z',fill:'#ffdc68',stroke:'#bd922c','stroke-width':2},cursor);}else{svg('path',{d:'M0 14 23-15M11 16-5-16',stroke:'#dcebef','stroke-width':7,'stroke-linecap':'round'},cursor);svg('circle',{cx:-4,cy:21,r:9,fill:'none',stroke:'#f28f93','stroke-width':6},cursor);svg('circle',{cx:17,cy:22,r:9,fill:'none',stroke:'#f28f93','stroke-width':6},cursor);}}
function start(selected){resetGesture();app.newRound();look=selected||bag.next();hair=makeHair(look);particles=[];regrowth=[];hintAt=app.time;colors=palettes[visit%palettes.length];setPhase('entering');document.body.dataset.look=look.id;document.body.dataset.goal=look.id;document.body.dataset.visit=String(visit);delete document.body.dataset.countdown;feedback.hidden=true;drawCustomer();enterSide=visit%2===0?1:-1;document.body.dataset.entrySide=enterSide===1?'right':'left';customer.setAttribute('transform',`translate(${enterSide*740} 0)`);
 primary=button('tool-primary','Scissors',art.cut,{pressed:true,className:'salon-primary'});primary.onclick=()=>{if(!['playing','repairing'].includes(phase))return;app.input();setGuide(phase==='repairing'?'hs2_repair':'hs2_hint');};
 checkButton=button('check-hair','Check my haircut','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>'+text('All done?','剪好啦？')+'</span>',{className:'salon-check'});checkButton.onclick=()=>{if(phase==='playing'){app.input();assessFinish(true);}};app.tools.append(primary,checkButton);showTool();primary.disabled=checkButton.disabled=true;updateProgress();setGuide('hs2_'+look.id,false);
}
app.scene.addEventListener('pointerdown',e=>{if(e.button!==0||gesture||!['playing','repairing'].includes(phase))return;e.preventDefault();app.input();const p=app.point(e);gesture={id:e.pointerId,last:p,mode:phase,used:new Set()};app.scene.setPointerCapture(e.pointerId);drawCursor();actAt(p,p);});
app.scene.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();const p=app.point(e);actAt(gesture.last,p);gesture.last=p;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])app.scene.addEventListener(event,e=>{if(gesture?.id===e.pointerId)finishStroke();});
app.onCancel=resetGesture;
app.onVisibility=visible=>{if(visible&&['playing','repairing'].includes(phase))assessFinish();};
app.onRestart=()=>{if(['complete','countdown'].includes(phase))served=Math.max(0,served-1);start(look);};
app.listeners.add((dt)=>{
 const elapsed=app.time-phaseAt;
 if(phase==='entering'){const p=clamp(elapsed/(reduced.matches?.15:.64),0,1);customer.setAttribute('transform',`translate(${reduced.matches?0:enterSide*740*(1-p)**3} 0)`);customer.style.opacity=String(p);if(p===1){customer.removeAttribute('transform');customer.style.opacity='';setPhase('playing');primary.disabled=checkButton.disabled=false;setGuide('hs2_'+look.id);}}
 else if(phase==='complete'&&app.time-celebrationAt>=1.55&&(!app.voice.active||app.time-celebrationAt>=4.5))countdown();
 else if(phase==='countdown'){const p=clamp(elapsed/.65,0,1);customer.setAttribute('transform',`translate(${reduced.matches?0:-740*p*p} 0)`);customer.style.opacity=String(1-p);const number=String(Math.max(1,Math.ceil(2-elapsed)));document.body.dataset.countdown=number;feedback.querySelector('.count-number').textContent=number;if(elapsed>=2){visit++;start();}}
 if(phase==='repairing'){for(let i=0;i<hair.length;i++){$('[data-gap="'+i+'"]',customer).setAttribute('opacity',needsGrow(hair[i])?'.85':'0');}}
 for(const item of regrowth){const p=clamp((app.time-item.at)/.28,0,1);paintHair(item.i,item.from+(hair[item.i].y-item.from)*(1-(1-p)**3));}regrowth=regrowth.filter(i=>app.time-i.at<.28);
 for(const p of particles){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='cut'?430:50)*dt;attr(p.e,{transform:`translate(${p.x} ${p.y}) rotate(${p.rotation+p.life*200})`,opacity:1-p.life/p.duration});if(p.life>=p.duration)p.e.remove();}particles=particles.filter(p=>p.life<p.duration);
 if(['playing','repairing'].includes(phase)&&!gesture&&app.time-app.lastInput>7&&app.time-hintAt>9){hintAt=app.time;guide.classList.add('hint-pulse');primary.classList.add('hint-pulse');if(!app.voice.active)setGuide(phase==='repairing'?'hs2_repair':'hs2_hint');}
});
start(STYLES[0]);
