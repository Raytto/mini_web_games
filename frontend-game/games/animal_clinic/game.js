import {Playground,$,svg,attr,button,accessible,shuffle,clamp,LINES,icon,distSegment} from '../playful_shared/core.js?v=20261002play1';
import {PATIENTS,TOOLS,STEPS,PROBLEMS,CLINIC_LINES,VERSION} from './content.js?v=20261013clinic3';
import {ClinicVoice} from './voice.js?v=20261013clinic3';
Object.assign(LINES,CLINIC_LINES);
const app=new Playground({id:'animal_clinic',title:'Animal Clinic',zh:'动物小诊所',theme:'mint',eyebrow:'LITTLE HANDS · BIG KINDNESS'});
app.voice.stop();app.voice=new ClinicVoice('animal_clinic',s=>app.voiceState(s));app.voiceState({enabled:app.voice.enabled});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const art=name=>new URL(`assets/${name}.webp?v=${VERSION}`,import.meta.url).href;
const tr=(en,zh)=>app.lang==='zh'?zh:en;
const tutorial=PATIENTS.slice(0,3),remaining=shuffle(PATIENTS.slice(3));let queue=[...tutorial,...remaining],lastId=null;
let friend=null,plan=[],step=0,served=0,phase='loading',phaseAt=0,loadToken=0,actor=null,patient=null,marks=null,hint=null,gesture=null,selected=null,choices=[],targets=[],done=new Set(),buttons={},lastWrong=-10,wrongCount=0,lastHintVoice=-30,holdProgress=0,completionLine=null,transient=null,permanent=null,pose='help';
const stepStrip=document.createElement('div');stepStrip.id='step-strip';app.tools.before(stepStrip);
const info=document.createElement('div');info.id='friend-info';$('.speech-row').after(info);
const result=document.createElement('div');result.id='care-result';result.hidden=true;result.setAttribute('role','status');result.setAttribute('aria-live','polite');$('.play-area').append(result);
const loading=document.createElement('div');loading.id='loading-friend';loading.textContent=tr('A little friend is getting ready…','小伙伴正在过来……');$('.play-area').append(loading);
const baseApply=window.XiaoxiaoI18n.applyLanguage;window.XiaoxiaoI18n.applyLanguage=lang=>{baseApply(lang);refreshLabels();};
function refreshLabels(){
 $('.heading small').textContent=tr('LITTLE HANDS · BIG KINDNESS','轻轻的小手 · 暖暖的照顾');
 $('#replay').setAttribute('aria-label',tr('Listen again','再听一遍'));$('#speech').setAttribute('aria-label',tr('Listen again','再听一遍'));
 $('#again').setAttribute('aria-label',tr('Help this friend again','重新帮助这位朋友'));
 $('#art-note').textContent=tr('↻ Bring our friend back','↻ 再请小伙伴过来');
 if(friend)updateData();
}
function nextFriend(){if(!queue.length){queue=shuffle([...PATIENTS]);if(queue[0].id===lastId)[queue[0],queue[1]]=[queue[1],queue[0]];}const f=queue.shift();lastId=f.id;return f;}
function activeStep(){return STEPS[plan[step]];}
function phaseTo(value){phase=value;phaseAt=app.time;document.body.dataset.phase=value;document.body.classList.toggle('care-complete',value==='happy');updateData();}
function updateData(){if(!friend)return;const spec=activeStep();Object.assign(document.body.dataset,{friend:friend.id,problem:friend.problem,room:friend.room,step:String(step),need:plan[step]||'none',tool:spec?.tool||'none',selected:selected||'none',choices:JSON.stringify(choices),served:String(served),hits:String(done.size),targets:String(targets.length),pose,steps:JSON.stringify(plan)});
 info.innerHTML=`<span class="friend-name">${app.lang==='zh'?friend.zh:friend.name}</span><span class="problem-name">${app.lang==='zh'?PROBLEMS[friend.problem].zh:PROBLEMS[friend.problem].en}</span>`;
 $('#progress').textContent=tr(`${served} happy ${served===1?'friend':'friends'}`,`照顾了 ${served} 位朋友`);
 stepStrip.innerHTML=plan.map((k,i)=>`<span class="care-step ${i<step?'done':i===step?'current':''}" aria-label="${i<step?'Done: ':''}${STEPS[k].en}">${i<step?'✓':i+1}</span>`).join('<span class="step-join" aria-hidden="true"></span>');
 for(const [id,b]of Object.entries(buttons)){b.disabled=phase!=='playing';b.setAttribute('aria-pressed',String(selected===id));b.querySelector('small').textContent=TOOLS[id][app.lang==='zh'?'zh':'en'];b.setAttribute('aria-label',TOOLS[id][app.lang==='zh'?'zh':'en']);}
 result.textContent=tr('Feeling better! Thank you!','舒服多啦，谢谢你！');
}
function picture(name,x,y,w,h,parent,extra={}){const im=svg('image',{href:art(name),x,y,width:w,height:h,preserveAspectRatio:'xMidYMid meet',...extra},parent);im.addEventListener('error',()=>{failedImages.add(im);$('#art-note').hidden=false;});im.addEventListener('load',()=>{failedImages.delete(im);if(!failedImages.size&&phase!=='loading')$('#art-note').hidden=true;});return im;}
function loadImage(name,retry=false){return new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>{img.onload=img.onerror=null;reject(new Error('Image timeout'));},6500);img.onload=()=>{clearTimeout(timer);resolve(img)};img.onerror=()=>{clearTimeout(timer);reject(new Error('Image unavailable'))};img.src=art(name)+(retry?'&retry='+Date.now():'');});}
const cachedImages=new Set(),failedImages=new Set();
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){failedImages.add(e.target);$('#art-note').hidden=false;}},true);
document.addEventListener('load',e=>{if(e.target.tagName==='IMG'){failedImages.delete(e.target);if(!failedImages.size&&phase!=='loading')$('#art-note').hidden=true;}},true);
async function ensureImages(names,retry=false){await Promise.all([...new Set(names)].map(async n=>{if(!retry&&cachedImages.has(n))return;await loadImage(n,retry);cachedImages.add(n);}));}
async function prepare(next,retry=false){
 const token=++loadToken;clearGesture();clearHint();failedImages.clear();app.newRound();app.guide=null;friend=next;plan=PROBLEMS[friend.problem].steps;step=0;selected=null;choices=[];buttons={};targets=[];done.clear();pose='help';permanent=null;completionLine=null;result.hidden=true;loading.hidden=false;loading.textContent=tr('A little friend is getting ready…','小伙伴正在过来……');phaseTo('loading');
 const room='room-'+friend.room;$('.backdrop').style.backgroundImage=`url("${art(room)}")`;
 const names=[room,...['help','better','happy'].map(p=>'actors/'+friend.id+'-'+p),...plan.map(k=>STEPS[k].tool).filter(x=>x!=='hand').map(x=>'tools/'+x)];
 try{await ensureImages(names,retry);}catch{if(token!==loadToken)return;$('#art-note').hidden=false;loading.textContent=tr('Tap ↻ to bring our friend back.','轻点 ↻，再请小伙伴过来。');return;}
 if(token!==loadToken||app.destroyed)return;$('#art-note').hidden=true;loading.hidden=true;
 app.scene.setAttribute('viewBox','0 0 600 560');
 svg('ellipse',{cx:300,cy:495,rx:167,ry:21,fill:'#72583e',opacity:.14,'pointer-events':'none'},app.scene);
 actor=svg('g',{id:'guest'},app.scene);patient=picture('actors/'+friend.id+'-help',65,42,470,470,actor,{id:'patient'});
 permanent=svg('g',{'pointer-events':'none',id:'care-keepsake'},actor);
 marks=svg('g',{id:'care-marks'},actor);
 phaseTo('entering');actor.setAttribute('transform',`translate(${reduced.matches?0:430} 0)`);
}
function paw(){return friend.id==='cat'?(pose==='happy'?[296,478]:[244,473]):[272,476];}
function setPose(next){pose=next;patient.setAttribute('href',art('actors/'+friend.id+'-'+next));const bandage=$('#placed-bandage');if(bandage){const [x,y]=paw();attr(bandage,{x:x-40,y:y-40});}updateData();}
function handArt(){return '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M25 41V18c0-8 11-8 11 0v19-24c0-8 11-8 11 0v25-18c0-8 10-8 10 0v20-10c0-7 10-7 10 0v22c0 16-9 24-22 24-11 0-17-5-23-15L12 49c-5-7 4-13 9-7l4 4" fill="#f6d2a4" stroke="#b98c61" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function toolMarkup(id){return id==='hand'?handArt():`<img src="${art('tools/'+id)}" alt="" draggable="false">`;}
function pickChoices(){const tool=activeStep().tool;if(served<3||tool==='hand')return[tool];const alternatives=Object.keys(TOOLS).filter(x=>x!==tool&&x!=='hand');return shuffle([tool,alternatives[Math.floor(Math.random()*alternatives.length)]]);}
function buildTools(){app.tools.replaceChildren();buttons={};for(const id of choices){const b=button('tool-'+id,TOOLS[id].en,toolMarkup(id)+'<small></small>');b.dataset.tool=id;b.style.touchAction='none';app.tools.append(b);buttons[id]=b;
 b.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0||phase!=='playing'||gesture)return;e.preventDefault();app.input();if(!chooseTool(id))return;gesture={id:e.pointerId,from:b,start:{x:e.clientX,y:e.clientY},point:app.point(e),fromTool:true,moved:false};try{b.setPointerCapture(e.pointerId);}catch{}});
 b.addEventListener('click',e=>{if(e.detail===0){app.input();chooseTool(id);}});
 }updateData();}
function chooseTool(id){if(phase!=='playing')return false;if(id!==activeStep().tool){wrong();return false;}const same=selected===id;selected=id;clearHint();updateData();if(!same){app.guide=activeStep().clip;app.sequence([TOOLS[id].clip,app.guide]);}showHint();return true;}
function guideId(){return selected?activeStep().clip:'ac1_choose_'+activeStep().tool;}
function announceStep(){app.guideTo(guideId());}
function wrong(){if(phase!=='playing')return;wrongCount++;showHint();if(app.time-lastWrong>.9){lastWrong=app.time;app.voice.stop();app.guideTo(guideId());}}
function targetPositions(){const key=plan[step];if(key==='roll')return[[300,285]];if(key==='comfort')return[[300,300]];if(key==='cover')return[paw()];if(key==='cool')return[[300,125]];if(key==='clean'){const [x,y]=paw();return[[x-16,y-9],[x+16,y+7]];}if(key==='brush'&&friend.id==='squirrel')return[[186,224],[151,310],[195,393]];if(key==='brush')return[[190,205],[392,235],[393,340]];if(friend.id==='fox')return[[240,440],[347,439],[295,480]];return[[236,279],[357,300],[295,384]];}
function makeTargets(){marks.replaceChildren();done=new Set();targets=targetPositions().map(([x,y],i)=>({x,y,i}));const key=plan[step];
 if(friend.problem==='scrape'&&!['comfort'].includes(key)){const [x,y]=paw();svg('path',{d:'M'+(x-12)+' '+(y-6)+'q10 8 21-2M'+(x-6)+' '+(y+6)+'q9 5 17-1',stroke:'#d79b89','stroke-width':5,'stroke-linecap':'round',fill:'none','pointer-events':'none'},marks);}
 for(const t of targets){const g=svg('g',{class:'care-target',id:'target-'+t.i,'data-target':t.i,transform:`translate(${t.x} ${t.y})`},marks);t.element=g;
 svg('circle',{r:60,fill:'#fff',opacity:0,'pointer-events':'all'},g);
 if(key==='wash')svg('path',{d:'M-24-11C-53-16-54 13-31 19C-27 45 9 43 16 24C49 36 57 0 31-11C24-38-15-37-24-11Z',fill:'#94734f',stroke:'#b29267','stroke-width':4,opacity:.93,'pointer-events':'none'},g);
 else if(key==='brush'){svg('path',{d:'M-30 18Q-37-26 24-36Q46 16-30 18Z',fill:['#dca854','#a9b45f','#ce885b'][t.i%3],stroke:'#877d44','stroke-width':3,'pointer-events':'none'},g);svg('path',{d:'M-31 23 14-20M-10 0-17-14M1-10 19-7',fill:'none',stroke:'#827444','stroke-width':3,'pointer-events':'none'},g);}
 else if(key==='dry')svg('path',{d:'M0-30C-5-13-23 0-23 15a23 23 0 0 0 46 0C23 0 5-13 0-30Z',fill:'#8bcbe0',stroke:'#e4f9ff','stroke-width':3,opacity:.9,'pointer-events':'none'},g);
 else if(key==='cool'){svg('circle',{r:41,fill:'none',stroke:'#7fb9d1','stroke-width':7,'stroke-dasharray':258,'stroke-dashoffset':258,transform:'rotate(-90)',class:'cool-ring','pointer-events':'none'},g);svg('ellipse',{rx:26,ry:21,fill:'#efb8a2',opacity:.65,'pointer-events':'none'},g);svg('path',{d:'M-10-9q9-7 20 0',fill:'none',stroke:'#dba485','stroke-width':3,'pointer-events':'none'},g);}
 else if(key==='comfort')svg('path',{d:'M0 23C-59-9-26-45 0-21C26-45 59-9 0 23Z',fill:'#e99596',stroke:'#fff6df','stroke-width':4,opacity:.88,'pointer-events':'none'},g);
 else svg('ellipse',{rx:key==='roll'?65:40,ry:key==='roll'?40:34,fill:'none',stroke:'#ffdf84','stroke-width':4,'stroke-dasharray':'8 7',opacity:.8,'pointer-events':'none'},g);
 accessible(g,`${STEPS[key].en} ${t.i+1}`,()=>{app.input();if(!selected){wrong();return;}hit(t);});
 }
 updateData();}
function startStep(intro=false){clearGesture();clearHint();transient?.remove();transient=null;selected=null;holdProgress=0;wrongCount=0;completionLine=null;choices=pickChoices();if(choices.length===1)selected=choices[0];
 makeTargets();phaseTo('playing');buildTools();app.lastInput=app.time;lastHintVoice=app.time;
 app.guide=guideId();if(intro)app.sequence([friend.intro,app.guide]);else announceStep();
 for(const id of choices)if(id!=='hand'){const img=new Image();img.src=art('tools/'+id);}
}
function clearHint(){hint?.remove();hint=null;document.querySelectorAll('.guided-tool').forEach(e=>e.classList.remove('guided-tool'));}
function showHint(){if(phase!=='playing')return;clearHint();const tool=buttons[activeStep().tool];tool?.classList.add('guided-tool');
 if(!selected)return;const t=targets.find(t=>!done.has(t.i));if(!t)return;
 hint=svg('g',{id:'care-hint','pointer-events':'none','aria-hidden':'true'},app.scene);
 svg('circle',{cx:t.x,cy:t.y,r:64,fill:'none',stroke:'#ffdc7c','stroke-width':5,class:'guide-ring'},hint);
 svg('path',{d:'M-12-32H12V-8H26L0 20-26-8H-12Z',fill:'#f8c65f',stroke:'#fff8e8','stroke-width':4,'stroke-linejoin':'round',transform:`translate(${t.x} ${t.y-93})`,class:'guide-arrow'},hint);
}
function clearGesture(){if(gesture){try{gesture.from.releasePointerCapture(gesture.id);}catch{}}gesture=null;$('#drag-tool',app.scene)?.remove();}
function locate(p){return targets.find(t=>!done.has(t.i)&&Math.hypot(p.x-t.x,p.y-t.y)<=77);}
function toolAt(x,y){transient?.remove();transient=svg('g',{id:'action-tool','pointer-events':'none'},app.scene);if(selected==='hand'){svg('path',{d:'M-20 0q10-24 24-1q9-16 18 3q3 21-20 30q-31-9-22-32Z',fill:'#f5d8ad',stroke:'#fff6dd','stroke-width':3,transform:`translate(${x} ${y})`},transient);}else picture('tools/'+selected,x-42,y-37,100,100,transient);transient.classList.add('care-touch');const local=transient;app.later(430,()=>{local.remove();if(transient===local)transient=null;});}
function hit(t,holding=false){if(phase!=='playing'||!selected||done.has(t.i))return;const key=plan[step];clearHint();
 if(key==='cool'){if(!holding)holdProgress=Math.min(2.1,holdProgress+.75);toolAt(t.x,t.y);t.element.classList.add('cooling');t.element.querySelector('.cool-ring')?.setAttribute('stroke-dashoffset',String(258*(1-holdProgress/2.1)));if(holdProgress<2.1){app.chime('tap');updateData();return;}}
 done.add(t.i);t.element.dataset.done='true';t.element.classList.add('target-done');t.element.setAttribute('aria-disabled','true');t.element.setAttribute('tabindex','-1');
 toolAt(t.x,t.y);app.chime(key==='wash'||key==='dry'?'pop':'tap');if(!reduced.matches)app.sparkle(t.x,t.y);updateData();
 if(done.size>=targets.length){clearGesture();app.voice.stop();app.speechEpoch++;completionLine=activeStep().doneClip;app.guide=completionLine;phaseTo('feedback');updateData();app.say(completionLine);
  if(key==='cover'){const [x,y]=paw();picture('tools/bandage',x-40,y-40,80,80,permanent,{id:'placed-bandage'});}
  if(key==='roll'){actor.classList.add('gentle-roll');app.later(350,()=>{actor.classList.remove('gentle-roll');setPose('better');});}
  else if(key!=='comfort')setPose('better');
  if(key==='comfort')finishPatient();
 }else showHint();
}
function finishPatient(){clearGesture();clearHint();marks.replaceChildren();setPose('happy');served++;completionLine=friend.thanks;app.guide=completionLine;phaseTo('happy');result.hidden=false;app.celebrate();app.say(completionLine);}
function drawDrag(p){let g=$('#drag-tool',app.scene);if(!g){g=svg('g',{id:'drag-tool','pointer-events':'none'},app.scene);if(selected==='hand')svg('circle',{r:24,fill:'#f5d8ad',stroke:'#fff5e7','stroke-width':4},g);else picture('tools/'+selected,-40,-40,80,80,g);}g.setAttribute('transform',`translate(${p.x} ${p.y})`);}
app.scene.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0||phase!=='playing'||gesture)return;e.preventDefault();app.input();if(!selected){wrong();return;}gesture={id:e.pointerId,from:app.scene,start:{x:e.clientX,y:e.clientY},point:app.point(e),fromTool:false,moved:false};try{app.scene.setPointerCapture(e.pointerId);}catch{}const t=locate(gesture.point);if(t)hit(t);else showHint();});
document.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId||phase!=='playing')return;e.preventDefault();const previous=gesture.point,p=app.point(e);gesture.point=p;if(Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)>6)gesture.moved=true;if(gesture.moved){drawDrag(p);app.lastInput=app.time;if(['wash','dry','clean','brush'].includes(plan[step])){const crossed=targets.filter(t=>!done.has(t.i)&&distSegment(t,previous,p)<=77).sort((a,b)=>Math.hypot(a.x-previous.x,a.y-previous.y)-Math.hypot(b.x-previous.x,b.y-previous.y));for(const t of crossed){if(phase!=='playing')break;hit(t);}}else{const t=locate(p);if(t&&plan[step]!=='cool')hit(t);}}}, {passive:false});
document.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;if(g.fromTool&&g.moved&&phase==='playing'){const t=locate(app.point(e));if(t)hit(t);}clearGesture();});
document.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId)clearGesture();});
app.onCancel=clearGesture;
app.onRestart=()=>{if(friend)prepare(friend);};
$('#art-note').onclick=()=>{app.input();if(phase==='loading'){if(friend)prepare(friend,true);return;}for(const im of [...failedImages]){if(!im.isConnected){failedImages.delete(im);continue;}const a=im.tagName==='IMG'?'src':'href',u=new URL(im.getAttribute(a));u.searchParams.set('retry',String(Date.now()));im.setAttribute(a,u.href);}if(!failedImages.size)$('#art-note').hidden=true;};
app.onVisibility=visible=>{clearGesture();if(visible&&['feedback','happy'].includes(phase)){phaseAt=app.time;if(completionLine){app.guide=completionLine;app.say(completionLine);}}};
app.listeners.add((dt,time)=>{
 if(phase==='entering'){const q=clamp((time-phaseAt)/.66,0,1);actor.setAttribute('transform',`translate(${reduced.matches?0:430*(1-q)**3} 0)`);if(q===1){actor.removeAttribute('transform');startStep(true);}}
 else if(phase==='playing'){
  if(gesture&&plan[step]==='cool'&&selected&&locate(gesture.point)){drawDrag(gesture.point);holdProgress=Math.min(2.1,holdProgress+dt);targets[0].element.querySelector('.cool-ring')?.setAttribute('stroke-dashoffset',String(258*(1-holdProgress/2.1)));if(holdProgress>=2.1)hit(targets[0],true);}
  if(time-app.lastInput>5&&!hint)showHint();
  if(time-app.lastInput>12&&time-lastHintVoice>18){lastHintVoice=time;announceStep();}
 }
 else if(phase==='feedback'&&time-phaseAt>.8&&(!app.voice.active||time-phaseAt>6)){step++;startStep();}
 else if(phase==='happy'&&time-phaseAt>1.8&&(!app.voice.active||time-phaseAt>6)){result.hidden=true;phaseTo('leaving');app.guide='ac1_next';app.say('ac1_next');}
 else if(phase==='leaving'){const q=clamp((time-phaseAt)/.6,0,1);actor.setAttribute('transform',`translate(${reduced.matches?0:-640*q*q} 0)`);if(q===1)prepare(nextFriend());}
});
refreshLabels();prepare(nextFriend());
