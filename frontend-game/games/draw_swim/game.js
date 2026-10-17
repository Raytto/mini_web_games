import {Playground,$,icon,LINES} from '../playful_shared/core.js?v=20261017warm1';
import {COLORS,DRAW_LINES,VERSION,GREETINGS} from './content.js?v=20261013swim8';
import {DrawVoice} from './voice.js?v=20261017warm1';
import {smoothStroke,clamp} from './rig.js?v=20261013swim8';
import {makeSwimmer,stepSchool,arrangeSchool,drawSwimmer,setGoal,renderPaths,DEFAULT_WATER,swimLimits,resizeSwimmer} from './swimmer.js?v=20261013swim8';
import {blank,readBook,encodeBook,activateDrawing,archiveDrawing,removeDrawing,MAX_POINTS,MAX_SAVED_POINTS,MAX_STROKES} from './book.js?v=20261014swim10';
import {TEMPLATES,templateOf,templatePicture,recommendTemplates} from './templates.js?v=20261013swim8';
import {hitSwimmer,fishHitBox} from './fish-actions.js?v=20261013swim8';
import {Feeding,drawingMouth} from './feeding.js?v=20261013swim8';
import {eraseInk} from './eraser.js?v=20261013swim8';
import {loadRecord,saveRecord} from './repository.js?v=20261013swim8';
import {LibraryShelf,bookIcon} from './library.js?v=20261014swim10';
Object.assign(LINES,DRAW_LINES);
const app=new Playground({id:'draw_swim',title:'Draw & Swim',zh:'我画的小鱼活了',eyebrow:'YOUR LINES · YOUR LITTLE FISH',theme:'mint'});
app.voice.stop();app.voice=new DrawVoice('draw_swim',s=>app.voiceState(s));app.voiceState({enabled:app.voice.enabled});
const tr=(en,zh)=>app.lang==='zh'?zh:en,reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Idle reminders share one quiet interval, measured after the last action or speech.
const VOICE_IDLE_SECONDS=45;
let lastSpeechAt=0;
const speakSequence=app.sequence.bind(app);
app.sequence=async ids=>{
 lastSpeechAt=app.time;
 const pending=speakSequence(ids),epoch=app.speechEpoch;
 try{return await pending;}finally{if(epoch===app.speechEpoch)lastSpeechAt=app.time;}
};
function idleVoiceReady(time){return !app.voice.active&&!pointer&&!foodDrag&&menuPress===null&&time-Math.max(app.lastInput,lastSpeechAt)>VOICE_IDLE_SECONDS;}

const canvas=document.createElement('canvas');canvas.id='draw-canvas';canvas.width=720;canvas.height=480;canvas.tabIndex=0;canvas.setAttribute('role','application');$('.play-area').append(canvas);const ctx=canvas.getContext('2d');
const picker=document.createElement('div');picker.id='templates';picker.setAttribute('role','group');$('.speech-row').after(picker);
const notices=document.createElement('div');notices.id='notices';picker.after(notices);notices.append($('#art-note'),$('#sound-note'));
const actions=document.createElement('div');actions.className='action-row';actions.innerHTML='<button id="eye-tool" class="action square eye-tool" type="button"><svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="20" rx="12" ry="15" fill="#fff" stroke="#abc6c1" stroke-width="2"/><ellipse cx="18" cy="21" rx="5" ry="8" fill="#304f5b"/></svg></button><button id="eraser" class="action square" type="button"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 24-3-4 14-15q2-2 4 0l7 7q2 2 0 4L17 28h-6z" fill="#efb0b9" stroke="#866f77" stroke-width="2"/><path d="m7 17 11 11H11l-7-8z" fill="#fff4dd" stroke="#866f77" stroke-width="2"/></svg></button><button id="main-action" class="action main-action" type="button"></button>';app.tools.after(actions);
const fishActions=document.createElement('div');fishActions.id='fish-actions';fishActions.hidden=true;fishActions.setAttribute('role','group');fishActions.innerHTML='<button id="fish-store" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></svg></button><button id="fish-edit" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 10-10 4 4-10 10-5 1zM13 7l4 4M5 15l4 4"/></svg></button><button id="fish-delete" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></svg></button>';document.body.append(fishActions);
const saveNote=document.createElement('div');saveNote.id='save-note';saveNote.className='sound-note';saveNote.hidden=true;saveNote.setAttribute('role','status');notices.append(saveNote);
const fishStatus=document.createElement('span');fishStatus.className='sr-only';fishStatus.setAttribute('role','status');document.body.append(fishStatus);
// A drawing gesture can suppress a browser's compatibility click on the next
// touch. Activate buttons on a genuine pointer-up and discard only its duplicate.
let buttonTouch=null,lastTouchActivation=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')lastTouchActivation=null;const b=e.target.closest?.('button');if(e.pointerType==='touch'&&e.isPrimary&&b&&b.id!=='feed'&&!b.classList.contains('library-card')&&!b.disabled)buttonTouch={b,id:e.pointerId,x:e.clientX,y:e.clientY,valid:true};},true);
document.addEventListener('pointermove',e=>{if(buttonTouch?.id===e.pointerId&&Math.hypot(e.clientX-buttonTouch.x,e.clientY-buttonTouch.y)>14)buttonTouch.valid=false;},true);
document.addEventListener('pointercancel',()=>{buttonTouch=null},true);
document.addEventListener('pointerup',e=>{const t=buttonTouch;if(!t||t.id!==e.pointerId)return;buttonTouch=null;if(!t.valid||!t.b.isConnected||t.b.disabled||e.target.closest?.('button')!==t.b)return;e.preventDefault();lastTouchActivation={x:e.clientX,y:e.clientY,at:performance.now()};t.b.click();},true);
// WebKit may retarget the delayed compatibility click after the layout changes
// from sea to paper. Suppress that gesture's duplicate even on a different button.
document.addEventListener('click',e=>{const t=lastTouchActivation;if(t&&e.detail>0&&performance.now()-t.at<650&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<25){e.preventDefault();e.stopImmediatePropagation();}},true);
let view={width:720,height:480,unit:1,px:1,py:1},water={...DEFAULT_WATER},layoutPending=true;
const loaded=await loadRecord(),book=readBook(loaded.value);let recommendations=recommendTemplates([],book.draft.strokes.length?book.draft.type:null);if(!book.draft.strokes.length)book.draft.type=recommendations[0];
let saveTicket=0,archiveFlights=[],eraserCursor=null,eraserSize=19;
let draft=book.draft,phase='draw',phaseAt=0,tool='pen',color=COLORS[3],pointer=null,fish=book.fish.map((drawing,i)=>makeSwimmer(drawing,i)),selectedId=book.fish.at(-1)?.id||null,releaseFish=null,releaseStart=null,fast=false,bubbles=[],lastHint=0,lastData=0,accum=0,keyPoint={x:150,y:220},artReady=false,artFailed=false,artTimer;
let foodDrag=null,lastMealVoice=-10,mealVoice=0,lastCareSave=0;
const feeding=new Feeding(book.care,onMeal);feeding.sync(fish,water);
let menuId=null,menuHover=false,menuPress=null,keyboardNav=false,menuSide='above',menuSize={width:116,height:52};
const shelf=new LibraryShelf({book:()=>book,tr,typeOf:templateOf,bring:bringFromLibrary,remove:deleteDrawing,closed:()=>{document.body.dataset.libraryOpen='false';layoutPending=true;},input:()=>app.input(),gesture:e=>{lastTouchActivation={x:e.clientX,y:e.clientY,at:performance.now()};}});
function closeFishActions(){menuId=null;menuHover=false;menuPress=null;fishActions.hidden=true;fishActions.dataset.fish='';document.body.dataset.fishMenu='';}
fishActions.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')menuHover=true});
fishActions.addEventListener('pointerleave',()=>{menuHover=false});
fishActions.addEventListener('pointerdown',e=>{if(e.isPrimary)menuPress=e.pointerId});
document.addEventListener('pointerup',e=>{if(menuPress===e.pointerId)menuPress=null});
document.addEventListener('pointercancel',()=>{menuPress=null;menuHover=false});
document.addEventListener('pointerdown',()=>{keyboardNav=false},true);
document.addEventListener('keydown',e=>{keyboardNav=true;if(e.key==='Escape'&&menuId){closeFishActions();canvas.focus();e.preventDefault()}},true);
let greetingBag=[],lastGreeting=null;
function greeting(){if(!greetingBag.length){greetingBag=GREETINGS.slice();for(let i=greetingBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[greetingBag[i],greetingBag[j]]=[greetingBag[j],greetingBag[i]];}if(greetingBag.at(-1)===lastGreeting)[greetingBag[0],greetingBag[greetingBag.length-1]]=[greetingBag.at(-1),greetingBag[0]];}return lastGreeting=greetingBag.pop();}
const guides=new Map(TEMPLATES.map(t=>[t.id,t.paths.map(p=>new Path2D(p))]));
const sea=new Image();sea.onload=()=>{clearTimeout(artTimer);artReady=true;artFailed=false;$('#art-note').hidden=true;$('.backdrop').style.backgroundImage='url("'+sea.src+'")';};sea.onerror=()=>{clearTimeout(artTimer);artFailed=true;$('#art-note').hidden=false;};
function loadSea(){clearTimeout(artTimer);sea.src=new URL('assets/sea.webp?v='+VERSION+(artFailed?'&retry='+Date.now():''),import.meta.url).href;artTimer=setTimeout(()=>{if(!artReady){artFailed=true;$('#art-note').hidden=false}},6500);}
$('#art-note').onclick=()=>{app.input();loadSea();};loadSea();
function captureCare(){Object.assign(book.care,feeding.snapshot());}
function save(){captureCare();feeding.sync(fish,water);Object.assign(book.care,feeding.snapshot());lastCareSave=app.time;book.draft=draft;book.part='head';book.mode=phase==='draw'?'draw':'swim';const ticket=++saveTicket;document.body.dataset.saving='true';saveRecord(encodeBook(book)).then(ok=>{if(ticket!==saveTicket)return;document.body.dataset.saving='false';document.body.dataset.saved=String(ok);saveNote.hidden=ok;layoutPending=true;});}
const totalPoints=()=>draft.strokes.reduce((n,s)=>n+s.points.length,0);
function eraseAt(a,b=a){const next=eraseInk(draft.strokes,a,b,eraserSize);if(next.reduce((n,s)=>n+s.points.length,0)<=MAX_SAVED_POINTS)draft.strokes=next;else app.say('ds3_limit');}
function drawingGuide(){return tool==='eraser'?'ds5_erase':tool==='eye'?'ds3_eye':draft.strokes.length?'ds3_ready':templateOf(draft.type).speech;}
function sync(){
 if(phase!=='swim'){closeFishActions();cancelFoodDrag();feeding.clearFood();shelf.close();}
 if(phase==='draw')app.guide=drawingGuide();layoutPending=true;Object.assign(document.body.dataset,{phase,sea:String(phase!=='draw'),type:draft.type,tool,strokes:String(draft.strokes.length),points:String(totalPoints()),fish:String(fish.length),library:String(book.library.length),collection:String(book.fish.length+book.library.length),order:book.fish.map(f=>f.id).join(','),recommendations:recommendations.join(','),draft:draft.id,selected:selectedId||'',dragging:String(!!pointer),speed:fast?'fast':'gentle'});
 const muteParent=phase==='draw'?$('.bottom-row'):$('.topbar');if($('#mute').parentElement!==muteParent){if(phase==='draw')muteParent.prepend($('#mute'));else muteParent.append($('#mute'));}
 $('#progress').textContent=phase==='draw'?tr('Draw it your way','自由画出你的小伙伴'):tr(fish.length+' in the sea · '+book.library.length+' in your book',fish.length+' 个在海里 · '+book.library.length+' 个在画作库');
 for(const b of picker.querySelectorAll('button')){b.classList.toggle('current',b.dataset.type===draft.type);b.setAttribute('aria-pressed',String(b.dataset.type===draft.type));b.disabled=phase!=='draw';}
 $('#main-action').disabled=phase==='releasing'||(phase==='draw'&&!draft.strokes.length);
 $('#main-action').innerHTML=phase==='draw'?tr('Let it swim!','让它游起来')+' <span aria-hidden="true">➜</span>':phase==='releasing'?tr('Here it goes…','游起来啦……'):(draft.strokes.length&&!book.fish.some(f=>f.id===draft.id)&&!book.library.some(f=>f.id===draft.id)?tr('Keep drawing','接着画刚才的'):tr('Draw another','再画一个'));
 for(const id of ['eye-tool','eraser']){$('#'+id).hidden=phase!=='draw';$('#'+id).setAttribute('aria-pressed',String(tool===(id==='eraser'?'eraser':'eye')));}
 $('#again').setAttribute('aria-label',tr('Open my drawing book','打开我的画作库'));
 if($('#speed'))$('#speed').disabled=!fish.length;
 if($('#feed'))$('#feed').disabled=!fish.length;
 if(!fish.length&&phase==='swim')$('#main-action').textContent=tr('Draw a sea friend','画一个小伙伴');
 canvas.setAttribute('aria-label',phase==='draw'?tr('Draw your whole sea friend here. Arrow keys move; Space draws.','在这里自由画完整个小伙伴。方向键移动，空格画一笔。'):tr('Touch the water to add food. Tap a sea friend for its buttons. Enter selects the next friend; arrows guide it.','点水面撒食，点小伙伴打开按钮。回车选下一个，方向键引导。'));
}
function labels(){
 $('.heading small').textContent=tr('YOUR LINES · SEA FRIENDS','你的线条 · 海洋小伙伴');$('#art-note').textContent=tr('↻ Bring our sea back','↻ 重新加载小海湾');$('#replay').setAttribute('aria-label',tr('Show six more sea friends','换一组六个小伙伴'));$('#replay').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3c4 0 5 10 9 10h4m-4-4 4 4-4 4M4 17h3c4 0 5-10 9-10h4m-4-4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';$('#again').innerHTML=bookIcon;$('#eye-tool').setAttribute('aria-label',tr('Add an eye','点一个眼睛'));$('#eraser').setAttribute('aria-label',tr('Erase part of a line','擦掉一小块'));saveNote.textContent=tr('We cannot save on this device right now. Your drawings are still on this page.','暂时无法保存在这台设备上，画作还在当前页面里。');$('#speech').setAttribute('aria-label',tr('Listen again','再听一遍'));
 picker.setAttribute('aria-label',tr('Choose a sea friend','选一个海洋小伙伴'));
 fishActions.setAttribute('aria-label',tr('This sea friend','这一个小伙伴'));
 for(const [id,en,zh]of [['fish-store','Put this friend in the drawing book','把这个小伙伴收进画册'],['fish-edit','Add more lines to this friend','给这个小伙伴补画'],['fish-delete','Delete this friend','删除这个小伙伴']]){const b=$('#'+id);b.setAttribute('aria-label',tr(en,zh));b.title=tr(en,zh);}
 picker.innerHTML=recommendations.map(templateOf).map(t=>'<button type="button" data-type="'+t.id+'" aria-label="'+tr(t.en,t.zh)+'">'+templatePicture(t.id)+'<b>'+tr(t.en==='Butterflyfish'?'Butterfly fish':t.en,t.zh)+'</b></button>').join('');
 for(const b of picker.querySelectorAll('button'))b.onclick=()=>{if(phase==='draw')chooseType(b.dataset.type);};buildTools();sync();if(shelf.visible)shelf.refresh();
}
const baseLang=window.XiaoxiaoI18n.applyLanguage;window.XiaoxiaoI18n.applyLanguage=l=>{baseLang(l);labels()};
function buildTools(){
 cancelFoodDrag();app.tools.replaceChildren();
 if(phase==='draw'){
  for(const c of COLORS){const b=document.createElement('button');b.id='color-'+c.id;b.className='crayon';b.style.setProperty('--crayon',c.hex);b.setAttribute('aria-label',tr(c.en,c.zh));b.setAttribute('aria-pressed',String(tool==='pen'&&color.id===c.id));b.innerHTML='<span aria-hidden="true"></span>';b.onclick=()=>{finishStroke();app.input();tool='pen';color=c;app.guide=drawingGuide();app.say(c.speech);buildTools();sync()};app.tools.append(b);}
 }else if(phase==='swim'){
  const feed=document.createElement('button');feed.id='feed';feed.className='sea-action';feed.type='button';feed.setAttribute('aria-label',tr('Give food. Tap here or drag food into the water.','喂食。点一下，或拖到水中。'));feed.innerHTML='<svg class="food-jar" viewBox="0 0 32 36" aria-hidden="true"><path d="M7 9h18l2 21q0 3-3 3H8q-3 0-3-3z" fill="#f4d188" stroke="#ad7e42" stroke-width="2"/><rect x="6" y="3" width="20" height="7" rx="3" fill="#76ad93"/><path d="m11 18 4 3-4 3 1-3zM20 24l3 2-3 3-2-3zM20 14l2 2-2 3-2-3z" fill="#ba7741"/></svg><span class="button-label">'+tr('Food','喂食')+'</span>';wireFoodJar(feed);app.tools.append(feed);
  const speed=document.createElement('button');speed.id='speed';speed.className='sea-action';speed.innerHTML='<span class="button-symbol" aria-hidden="true">'+(fast?'〰':'≈')+'</span><span class="button-label">'+tr(fast?'Playful swim':'Gentle swim',fast?'欢快地游':'慢慢游')+'</span>';speed.setAttribute('aria-pressed',String(fast));speed.onclick=()=>{app.input();fast=!fast;app.say(fast?'ds3_fast':'ds3_slow');buildTools();sync()};app.tools.append(speed);
  const library=document.createElement('button');library.id='library-button';library.className='sea-action';library.innerHTML=bookIcon+'<span class="button-label">'+tr('My drawings','画作库')+'</span>';library.onclick=openLibrary;app.tools.append(library);
 }
}
$('#eye-tool').onclick=()=>{finishStroke();app.input();tool='eye';eraserCursor=null;app.guideTo('ds3_eye');buildTools();sync();};
$('#eraser').onclick=()=>{finishStroke();app.input();tool='eraser';app.guideTo('ds5_erase');buildTools();sync();};
$('#replay').onclick=()=>{if(phase!=='draw')return;finishStroke();app.input();recommendations=recommendTemplates(recommendations,draft.strokes.length?draft.type:null);if(!draft.strokes.length)draft.type=recommendations[0];labels();app.guide=drawingGuide();app.say('ds5_shuffle');save();};
function chooseType(id){finishStroke();app.input();draft.type=templateOf(id).id;tool='pen';eraserCursor=null;app.guideTo(templateOf(id).speech);buildTools();sync();save();}
function changeStrokes(list){draft.strokes=list;sync();save();}
function finishStroke(){
 if(!pointer)return;app.lastInput=app.time;const p=pointer;pointer=null;try{canvas.releasePointerCapture(p.id)}catch{}
 if(p.kind==='eraser'){save();sync();return;}
 if(p.raw.length){let pts=p.kind==='eye'?[p.raw[0]]:smoothStroke(p.raw);const remaining=MAX_POINTS-totalPoints();if(pts.length>remaining)pts=pts.filter((_,i)=>i%Math.ceil(pts.length/Math.max(1,remaining))===0);pts=pts.slice(0,remaining).map(p=>({x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100}));if(pts.length)changeStrokes([...draft.strokes,{part:'whole',color:p.color,width:14,kind:p.kind,points:pts}]);}
 sync();
}
function startPoint(p,id){
 if(tool!=='eraser'&&(draft.strokes.length>=MAX_STROKES||totalPoints()>=MAX_POINTS)){app.say('ds3_limit');return;}
 pointer={id,color:color.hex,kind:tool,raw:[p]};if(tool==='eraser'){eraserSize=Math.max(19,16*720/canvas.getBoundingClientRect().width);eraseAt(p);eraserCursor=p;}app.lastInput=app.time;sync();
}
function canvasPoint(e){if(layoutPending)updateViewport();const b=canvas.getBoundingClientRect();return{x:clamp((e.clientX-b.x)*view.width/b.width,3,view.width-3),y:clamp((e.clientY-b.y)*view.height/b.height,3,view.height-3)}}
canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0||pointer||app.hidden||phase==='releasing')return;if(shelf.visible){shelf.close();return;}e.preventDefault();app.input();const p=canvasPoint(e);if(phase==='swim'){tapSea(p);return;}startPoint(p,e.pointerId);try{canvas.setPointerCapture(e.pointerId)}catch{}});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||app.hidden)return;e.preventDefault();if(pointer.kind==='eye')return;const events=e.getCoalescedEvents?.()||[e];for(const ev of events.length?events:[e]){const p=canvasPoint(ev),last=pointer.raw.at(-1);if(pointer.kind==='eraser'){eraseAt(last,p);pointer.raw=[p];eraserCursor=p;}else if(Math.hypot(p.x-last.x,p.y-last.y)>1.5&&pointer.raw.length<3000)pointer.raw.push(p)}app.lastInput=app.time;});
canvas.addEventListener('pointerup',e=>{if(pointer?.id===e.pointerId)finishStroke()});canvas.addEventListener('pointercancel',e=>{if(pointer?.id===e.pointerId)finishStroke()});
canvas.addEventListener('keydown',e=>{if(app.hidden||phase==='releasing')return;if(phase==='swim'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();app.input();const i=fish.findIndex(f=>f.id===selectedId);if(fish.length){openFishActions(fish[(i+1)%fish.length]);$('#fish-edit').focus()}return;}if(e.key.startsWith('Arrow')){e.preventDefault();keyPoint.x=clamp(keyPoint.x+(e.key==='ArrowLeft'?-18:e.key==='ArrowRight'?18:0),10,view.width-10);keyPoint.y=clamp(keyPoint.y+(e.key==='ArrowUp'?-18:e.key==='ArrowDown'?18:0),10,view.height-10);app.input();if(phase==='swim'){closeFishActions();callFish(keyPoint)}return;}if(e.key===' '||e.key==='Enter'){e.preventDefault();app.input();startPoint({...keyPoint},-1);finishStroke()}});
app.onRestart=openLibrary;
$('#main-action').onclick=()=>{app.input();if(phase==='swim'){startNew();return;}if(phase!=='draw')return;finishStroke();if(draft.strokes.length)release();};
function startNew(){
 shelf.close();finishStroke();if(draft.strokes.length&&!book.fish.some(f=>f.id===draft.id)&&!book.library.some(f=>f.id===draft.id)){phase='draw';tool='pen';labels();app.guideTo(drawingGuide());save();return;}
 app.newRound();recommendations=recommendTemplates(recommendations);draft=blank(recommendations[0]);phase='draw';phaseAt=app.time;selectedId=null;releaseFish=null;tool='pen';labels();app.guideTo(templateOf(draft.type).speech);save();
}
function editSelected(){
 const item=book.fish.find(f=>f.id===selectedId)||book.fish.at(-1);if(!item)return;
 app.newRound();draft={id:item.id,type:item.type,strokes:item.strokes.map(s=>({...s,points:s.points.map(p=>({...p}))}))};recommendations=recommendTemplates(recommendations,draft.type);phase='draw';phaseAt=app.time;tool='pen';labels();app.say('ds3_edit');save();
}
function release(){
 shelf.close();captureCare();const paper=canvas.getBoundingClientRect();app.newRound();phase='releasing';phaseAt=app.time;selectedId=draft.id;releaseFish=makeSwimmer(draft,0,water);const rig=releaseFish.baked.rig;
 releaseStart={x:rig.origin.x+rig.axis.x*rig.centerX+rig.normal.x*rig.centerY,y:rig.origin.y+rig.axis.y*rig.centerX+rig.normal.y*rig.centerY,angle:rig.angle,paper:{cx:(paper.x+paper.width/2)/innerWidth,cy:(paper.y+paper.height/2)/innerHeight,width:paper.width}};
 const savedDrawing={id:draft.id,type:draft.type,strokes:draft.strokes.map(s=>({...s,points:s.points.map(p=>({...p}))}))};const archived=activateDrawing(book,savedDrawing);startArchiveFlights(archived);feeding.restore(draft.id,book.care[draft.id]);
 fish=book.fish.map((drawing,i)=>drawing.id===releaseFish.id?releaseFish:fish.find(f=>f.id===drawing.id)||makeSwimmer(drawing,i,water));
 app.guide='ds3_alive';app.caption.textContent=DRAW_LINES.ds3_alive;app.chime('pop');labels();updateViewport();positionRelease();arrangeSchool(fish,water,app.time,releaseFish,reduced.matches);accum=0;save();
}
function enterSwim(){
 closeFishActions();
 captureCare();
 if(!book.fish.some(f=>f.id===selectedId))selectedId=book.fish.at(-1)?.id||null;
 const arriving=releaseFish;phase='swim';phaseAt=app.time;releaseFish=null;
 fish=book.fish.map((drawing,i)=>arriving?.id===drawing.id?arriving:fish.find(f=>f.id===drawing.id)||makeSwimmer(drawing,i,water));
 if(arriving)arriving.drive=.5;
 app.guide='ds4_feed';labels();updateViewport();if(!arriving)arrangeSchool(fish,water,app.time,null,reduced.matches);accum=0;save();
}
function callFish(p){
 const closest=fish.reduce((best,f)=>!best||Math.hypot(f.x-p.x,f.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?f:best,null);if(closest){selectedId=closest.id;setGoal(closest,p.x,p.y,app.time,water);}
 if(!reduced.matches)for(let i=0;i<6;i++)bubbles.push({x:p.x+(Math.random()-.5)*40,y:p.y,r:4+Math.random()*9,life:0});
 if(app.time-lastHint>3){lastHint=app.time;app.say(greeting())}app.chime('tap');sync();
}
function openFishActions(f){if(app.time-lastHint>3){lastHint=app.time;app.say(greeting())}selectedId=f.id;menuId=f.id;menuSide='above';fishActions.hidden=false;menuSize={width:fishActions.offsetWidth,height:fishActions.offsetHeight};app.chime('tap');sync();positionFishActions();}
function tapSea(p){const hit=hitSwimmer(fish,p,view.unit);if(hit){openFishActions(hit);return;}closeFishActions();dropFood(p);}
$('#fish-edit').onclick=()=>{if(phase==='swim'&&menuId){selectedId=menuId;closeFishActions();app.input();editSelected()}};
$('#fish-store').onclick=()=>{
 if(phase!=='swim'||!menuId)return;app.input();captureCare();const item=archiveDrawing(book,menuId);if(!item)return;
 startArchiveFlights([item]);fish=fish.filter(f=>f.id!==item.id);closeFishActions();selectedId=book.fish.at(-1)?.id||null;
 fishStatus.textContent=tr('Your friend is resting in your drawing book.','小伙伴收进画册休息啦。');app.chime('pop');sync();if(shelf.visible)shelf.refresh();save();canvas.focus({preventScroll:true});
};
function deleteDrawing(id){
 if(phase!=='swim'||!book.fish.concat(book.library).some(f=>f.id===id))return;
 app.input();captureCare();fish=fish.filter(f=>f.id!==id);feeding.sync(fish,water);removeDrawing(book,id);
 archiveFlights=archiveFlights.filter(a=>a.f.id!==id);if(draft.id===id)draft=blank(draft.type);
 closeFishActions();if(selectedId===id)selectedId=book.fish.at(-1)?.id||null;
 fishStatus.textContent=tr('This drawing has been deleted.','这个画作已删除。');app.chime('pop');sync();save();
 if(!shelf.visible)canvas.focus({preventScroll:true});
}
$('#fish-delete').onclick=()=>{if(menuId)deleteDrawing(menuId);};
function openLibrary(){finishStroke();cancelFoodDrag();closeFishActions();app.input();if(phase==='releasing')return;if(phase==='draw')enterSwim();shelf.open();document.body.dataset.libraryOpen='true';layoutPending=true;app.guideTo('ds5_library');}
function startArchiveFlights(items){for(const item of items){const f=fish.find(f=>f.id===item.id);if(f)archiveFlights.push({f,at:app.time,x:f.x/view.width,y:f.y/view.height});}if(items.length)fishStatus.textContent=tr('Your oldest friend is resting in your drawing book.','最早入水的小伙伴回画作库休息啦。');}
function bringFromLibrary(id,point){
 const existing=fish.find(f=>f.id===id),item=book.library.find(f=>f.id===id)||book.fish.find(f=>f.id===id);if(!item)return;shelf.close();closeFishActions();app.input();updateViewport();
 if(existing){selectedId=id;openFishActions(existing);return;}
 captureCare();const archived=activateDrawing(book,item);startArchiveFlights(archived);feeding.restore(id,book.care[id]);const f=makeSwimmer(item,fish.length,water),b=swimLimits(f,water);fish=fish.filter(f=>book.fish.some(d=>d.id===f.id));
 const entries=[.25,.5,.75].flatMap(t=>[{x:b.left+8,y:b.top+(b.bottom-b.top)*t},{x:b.right-8,y:b.top+(b.bottom-b.top)*t}]);entries.sort((a,b)=>Math.min(...fish.map(f=>Math.hypot(f.x-b.x,f.y-b.y)),1e5)-Math.min(...fish.map(f=>Math.hypot(f.x-a.x,f.y-a.y)),1e5));const p=point?{x:point.x/view.unit,y:point.y/view.unit}:entries[0];f.x=clamp(p.x,b.left,b.right);f.y=clamp(p.y,b.top,b.bottom);f.appear={at:app.time,duration:reduced.matches?.3:.65};f.opacity=0;f.vx=f.x<(b.left+b.right)/2?16:-16;f.yaw=f.vx>0?Math.PI:0;setGoal(f,(b.left+b.right)/2,f.y,app.time,water);fish.push(f);selectedId=id;app.guide='ds4_feed';app.say(archived.length?'ds5_stored':'ds5_return');sync();save();
}
function positionFishActions(){
 const f=phase==='swim'&&!app.hidden&&fish.find(f=>f.id===menuId);if(!f){fishActions.hidden=true;return;}
 fishActions.hidden=false;const u=view.unit,w=menuSize.width,h=menuSize.height,cx=f.x*u,cy=f.y*u;
 const top=water.top*u,bottom=water.bottom*u,ry=Math.max(18,f.baked.rig.marginY*u),above=cy-ry-10-h,below=cy+ry+10;
 if(menuSide==='above'&&above<top&&below+h<=bottom)menuSide='below';else if(menuSide==='below'&&below+h>bottom&&above>=top)menuSide='above';
 const x=clamp(cx-w/2,water.left*u,water.right*u-w),y=clamp(menuSide==='above'?above:below,top,bottom-h);
 fishActions.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;fishActions.dataset.fish=f.id;document.body.dataset.fishMenu=f.id;
}
app.onCancel=()=>{shelf.cancel();shelf.close();cancelFoodDrag();buttonTouch=null;menuPress=null;menuHover=false;finishStroke();closeFishActions()};app.onVisibility=visible=>{cancelFoodDrag();finishStroke();accum=0;save();};window.addEventListener('pagehide',save);
// Paper coordinates remain 720x480. The sea has its own aspect-correct world;
// resizing remaps positions and targets, never the child's saved line geometry.
function updateViewport(){
 layoutPending=false;
 if(phase==='draw'){
  if(canvas.width!==720||canvas.height!==480){canvas.width=720;canvas.height=480;}
  view={width:720,height:480,unit:1,px:1,py:1};keyPoint.x=clamp(keyPoint.x,10,710);keyPoint.y=clamp(keyPoint.y,10,470);return;
 }
 const box=canvas.getBoundingClientRect();if(!box.width||!box.height){layoutPending=true;return;}
 const unit=clamp(Math.min(box.width,box.height)/720,.4,1.25),ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(4000000/(box.width*box.height)));
 const width=box.width/unit,height=box.height/unit,remap=Math.abs(view.width-width)>.1||Math.abs(view.height-height)>.1,pw=Math.round(box.width*ratio),ph=Math.round(box.height*ratio);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 view={width,height,unit,px:pw/width,py:ph/height};
 const visible=e=>{const r=e.getBoundingClientRect();return r.width&&r.height?r:null;};
 const top=[visible($('.topbar')),visible($('.speech-row')),visible(notices)].filter(Boolean).reduce((v,r)=>Math.max(v,r.bottom),box.top);
 const bottom=[visible($('footer')),visible($('#progress')),visible(shelf.el)].filter(Boolean).reduce((v,r)=>Math.min(v,r.top),box.bottom);
 const next={left:10/unit,top:clamp((top-box.top+12)/unit,0,height*.35),right:width-10/unit,bottom:clamp((bottom-box.top-12)/unit,height*(shelf.visible?.32:.55),height)};
 if(Object.keys(next).some(k=>Math.abs(next[k]-water[k])>.1)){
  for(const f of new Set([...fish,...(releaseFish?[releaseFish]:[])])){if(remap||Math.abs(next.bottom-water.bottom)>height*.12)resizeSwimmer(f,water,next);else{const b=swimLimits(f,next);f.x=clamp(f.x,b.left,b.right);f.y=clamp(f.y,b.top,b.bottom);f.goal.x=clamp(f.goal.x,b.left,b.right);f.goal.y=clamp(f.goal.y,b.top,b.bottom);}}bubbles=[];
 }
 feeding.resize(water,next);water=next;if(phase==='releasing'&&releaseStart&&releaseFish)positionRelease();keyPoint.x=clamp(keyPoint.x,water.left,water.right);keyPoint.y=clamp(keyPoint.y,water.top,water.bottom);
 document.body.dataset.water=JSON.stringify({width,height,unit,...water});
}
const layoutObserver=new ResizeObserver(()=>{layoutPending=true;});
for(const e of [canvas,$('.speech-row'),$('footer'),notices,shelf.el])layoutObserver.observe(e);
window.addEventListener('resize',()=>{shelf.cancel();cancelFoodDrag();finishStroke();layoutPending=true;});
window.visualViewport?.addEventListener('resize',()=>{layoutPending=true;});
window.addEventListener('pagehide',()=>{layoutObserver.disconnect();});
window.addEventListener('pageshow',()=>{for(const e of [canvas,$('.speech-row'),$('footer'),notices,shelf.el])layoutObserver.observe(e);layoutPending=true;});
function releasePaper(){
 const p=releaseStart.paper,w=Math.min(p.width/view.unit,view.width*.98,view.height*1.47),scale=w/720;
 return {x:p.cx*view.width-w/2,y:p.cy*view.height-w/3,scale};
}
function positionRelease(){
 const p=releasePaper(),b=swimLimits(releaseFish,water);
 releaseFish.x=clamp(p.x+releaseStart.x*p.scale,b.left,b.right);releaseFish.y=clamp(p.y+releaseStart.y*p.scale,b.top,b.bottom);
}
function advanceSchool(dt,time,fixed=null){accum+=dt;while(accum>=1/60){if(phase==='swim')feeding.step(1/60,fish,water,{held:fixed,reduced:reduced.matches});stepSchool(fish,1/60,time,fast,reduced.matches,water,fixed);accum-=1/60;}}
function dropFood(p){
 if(phase!=='swim'||!fish.length)return null;app.input();const food=feeding.add(p.x,p.y);if(food)app.chime('tap');return food;
}
function foodNearFriend(){
 const a=[...feeding.actors.values()].filter(a=>!a.entering).sort((a,b)=>a.satiety-b.satiety)[0];
 if(a){const p=drawingMouth(a.fish);dropFood({x:p.x+(Math.cos(a.fish.yaw)>0?-22:22),y:p.y-18});}
}
function cancelFoodDrag(){const drag=foodDrag;foodDrag=null;if(!drag)return;feeding.discard(drag.food);try{drag.button.releasePointerCapture(drag.id)}catch{}drag.button.classList.remove('feeding');}
function wireFoodJar(button){
 button.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0||app.hidden||phase!=='swim'||!fish.length||foodDrag)return;e.preventDefault();app.input();closeFishActions();foodDrag={id:e.pointerId,button,x:e.clientX,y:e.clientY,food:null};button.classList.add('feeding');try{button.setPointerCapture(e.pointerId)}catch{}});
 button.addEventListener('pointermove',e=>{const drag=foodDrag;if(!drag||drag.id!==e.pointerId)return;e.preventDefault();const p=canvasPoint(e);if(!drag.food&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>12)drag.food=feeding.add(p.x,p.y,true);if(drag.food){drag.food.x=clamp(p.x,water.left+14,water.right-14);drag.food.y=clamp(p.y,water.top+12,water.bottom-12);}});
 button.addEventListener('pointerup',e=>{const drag=foodDrag;if(!drag||drag.id!==e.pointerId)return;e.preventDefault();app.lastInput=app.time;foodDrag=null;button.classList.remove('feeding');if(drag.food){drag.food.dragging=false;app.chime('tap');}else foodNearFriend();lastTouchActivation={x:e.clientX,y:e.clientY,at:performance.now()};try{button.releasePointerCapture(e.pointerId)}catch{}});
 button.addEventListener('pointercancel',cancelFoodDrag);button.addEventListener('lostpointercapture',()=>{if(foodDrag?.button===button)cancelFoodDrag()});
 button.onclick=e=>{if(e.detail===0&&!app.hidden&&phase==='swim'){app.input();closeFishActions();foodNearFriend();}};
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&foodDrag){cancelFoodDrag();e.preventDefault()}});
function onMeal(a){
 app.chime('pop');fishStatus.textContent=tr('Your sea friend enjoyed a little food.','小伙伴吃到食物啦。');
 if(app.time-lastMealVoice>4&&app.time-phaseAt>5){lastMealVoice=app.time;app.say(a.satiety>=75?'ds4_full':['ds4_yummy','ds4_thanks','ds4_tasty'][mealVoice++%3]);}
 save();
}
function foodShape(x,y,size){ctx.save();ctx.translate(x,y);ctx.fillStyle='#d68e48';ctx.strokeStyle='#fff4cc';ctx.lineWidth=2/view.unit;ctx.beginPath();ctx.roundRect(-size,-size*.65,size*2,size*1.3,size*.5);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe0a0';ctx.beginPath();ctx.arc(-size*.2,-size*.1,size*.23,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawFood(){for(const food of feeding.world.foods){if(food.dragging){ctx.strokeStyle='#fffce29c';ctx.lineWidth=2/view.unit;ctx.beginPath();ctx.arc(food.x,food.y,20/view.unit,0,Math.PI*2);ctx.stroke();}foodShape(food.x,food.y,7/view.unit);}}
function drawAppetite(f,time){
 const a=feeding.actors.get(f.id);if(!a||f.opacity<.7||f.id===menuId)return;const mood=feeding.mood(f.id);if(mood==='content'||mood==='full')return;
 // A small thought bubble invites care; a happy heart belongs to the eater.
 const size=15/view.unit,x=clamp(f.x+(f.id===selectedId&&fish.length>1?36/view.unit:0),water.left+size,water.right-size),y=clamp(f.y-f.baked.rig.marginY-15/view.unit,water.top+size,water.bottom-size);
 ctx.save();ctx.globalAlpha=(f.opacity??1)*(mood==='happy'?1:.72);ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
 if(mood==='hungry')foodShape(x,y,5/view.unit);else{ctx.translate(x,y);ctx.scale(1/view.unit,1/view.unit);ctx.fillStyle='#e89b8b';ctx.beginPath();ctx.moveTo(0,7);ctx.bezierCurveTo(-17,-3,-6,-14,0,-5);ctx.bezierCurveTo(6,-14,17,-3,0,7);ctx.fill();}
 ctx.restore();
 if(a.biteFor>0&&!reduced.matches){const p=drawingMouth(f),radius=(1-a.biteFor/.35)*14/view.unit;ctx.strokeStyle='#ffefb5';ctx.lineWidth=2/view.unit;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,radius),0,Math.PI*2);ctx.stroke();}
}
function roundRect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function drawPaper(opacity=1){ctx.save();ctx.globalAlpha=opacity;roundRect(2,7,716,468,27,'#baa784');roundRect(2,2,716,468,27,'#fffdf4');ctx.strokeStyle='#e8e0cd';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(13,13,694,446,20);ctx.stroke();ctx.restore()}
function pathsFor(strokes){return strokes.map(s=>({...s,out:new Float32Array(s.points.flatMap(p=>[p.x,p.y]))}))}
let draftCache=null,draftRef=null;
function drawDraft(){if(draft.strokes!==draftRef){draftRef=draft.strokes;draftCache=pathsFor(draft.strokes)}renderPaths(ctx,draftCache||[]);if(pointer&&pointer.kind!=='eraser')renderPaths(ctx,pathsFor([{kind:pointer.kind,color:pointer.color,width:14,points:pointer.raw}]))}
function drawSelectedMarker(f){const r=f.baked.rig,top=f.y-(r.bounds.maxY-r.bounds.minY)*r.scale/2;ctx.save();ctx.translate(f.x,Math.max(water.top+18,top-18));ctx.fillStyle='#fffbe9';ctx.strokeStyle='#598f7e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#527864';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,5);ctx.lineTo(5,-4);ctx.moveTo(-4,5);ctx.lineTo(-5,8);ctx.stroke();ctx.restore();}
function drawSelectionHalo(f){const r=f.baked.rig,rx=Math.max(22/view.unit,(r.bounds.maxX-r.bounds.minX+28)*r.scale*Math.max(.25,Math.abs(Math.cos(f.yaw)))/2+10/view.unit),ry=Math.max(22/view.unit,(r.bounds.maxY-r.bounds.minY+28)*r.scale/2+10/view.unit);ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.pitch*Math.cos(f.yaw)*r.pitch);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fillStyle='#fff8cc28';ctx.fill();ctx.strokeStyle='#fff5c5cc';ctx.lineWidth=2/view.unit;ctx.setLineDash([4/view.unit,6/view.unit]);ctx.stroke();ctx.restore();}
function drawGuides(time){
 const t=templateOf(draft.type);ctx.save();ctx.lineWidth=6;ctx.lineCap='round';ctx.setLineDash([8,13]);ctx.strokeStyle='#879b91';ctx.globalAlpha=.65;
 for(const path of guides.get(t.id))ctx.stroke(path);ctx.setLineDash([]);ctx.globalAlpha=1;
 if(!draft.strokes.some(s=>s.kind==='eye')){ctx.beginPath();ctx.arc(...t.eye,11,0,Math.PI*2);ctx.strokeStyle='#ded3bb';ctx.lineWidth=3;ctx.stroke();}
 if(time-app.lastInput>5&&(tool==='eye'||!draft.strokes.length)){const [x,y]=tool==='eye'?t.eye:[t.bones[0].x-22,t.bones[0].y-40],pulse=reduced.matches?0:Math.sin(time*3)*5;ctx.strokeStyle='#e4b154';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,24+pulse,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e4b154';ctx.beginPath();ctx.moveTo(x-13,y-56);ctx.lineTo(x+13,y-56);ctx.lineTo(x,y-36);ctx.closePath();ctx.fill();}
 ctx.restore();
}
function draw(dt,time){
 if(layoutPending)updateViewport();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(view.px,0,0,view.py,0,0);
 const aspect=view.width/view.height;if(artReady){const crop=sea.width/sea.height>aspect;let sx=0,sy=0,sw=sea.width,sh=sea.height;if(crop){sw=sh*aspect;sx=(sea.width-sw)/2}else{sh=sw/aspect;sy=(sea.height-sh)/2}ctx.drawImage(sea,sx,sy,sw,sh,0,0,view.width,view.height)}else roundRect(0,0,view.width,view.height,0,'#b7e3dc');
 const nextHint=phase==='draw'&&tool==='pen'&&draft.strokes.length>0&&time-app.lastInput>4&&!pointer;$('#main-action').classList.toggle('next-invite',nextHint);document.body.dataset.nextHint=String(nextHint);document.body.dataset.editMarker=phase==='swim'&&fish.length>1?selectedId||'':'';
 if(phase==='draw'){drawPaper();drawGuides(time);drawDraft();if(tool==='eraser'&&eraserCursor){ctx.strokeStyle='#bc899099';ctx.lineWidth=2;ctx.beginPath();ctx.arc(eraserCursor.x,eraserCursor.y,eraserSize,0,Math.PI*2);ctx.stroke();}}
 else if(phase==='releasing'){
  const t=clamp((time-phaseAt)/1.5,0,1),e=t*t*(3-2*t),f=releaseFish,paper=releasePaper();
  advanceSchool(dt,time,f);for(const other of fish)if(other!==f)drawSwimmer(ctx,other);
  ctx.save();ctx.translate(paper.x,paper.y);ctx.scale(paper.scale,paper.scale);drawPaper(1-e);ctx.restore();f.wave+=dt*6;f.age+=dt;
  const x=(paper.x+releaseStart.x*paper.scale)*(1-e)+f.x*e,y=(paper.y+releaseStart.y*paper.scale)*(1-e)+f.y*e,scale=paper.scale+(f.baked.rig.scale-paper.scale)*e;
  drawSwimmer(ctx,f,{strength:e*.5,x,y,scale,angle:releaseStart.angle*(1-e),facing:1,halo:e>.4});
  document.body.dataset.arrival=JSON.stringify({id:f.id,t,x,y,scale,target:{x:f.x,y:f.y},paper});
  if(t>=1){enterSwim();app.celebrate();app.say('ds3_alive');}
 }else{
  const held=menuId&&(menuHover||menuPress!==null||(keyboardNav&&fishActions.contains(document.activeElement)))?fish.find(f=>f.id===menuId):null;
  advanceSchool(dt,time,held);if(held){held.wave+=dt*2;held.age+=dt;}
  const chosen=fish.find(f=>f.id===menuId);if(chosen)drawSelectionHalo(chosen);
  drawFood();for(const f of fish){drawSwimmer(ctx,f);drawAppetite(f,time);}if(fish.length>1&&!menuId){const selected=fish.find(f=>f.id===selectedId);if(selected)drawSelectedMarker(selected);}
  for(const b of bubbles){b.life+=dt;b.y-=30*dt;ctx.globalAlpha=Math.max(0,1-b.life/1.4);ctx.strokeStyle='#f3fffc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;bubbles=bubbles.filter(b=>b.life<1.4);
 }
 if(phase==='swim'&&time-lastCareSave>12)save();
 if(phase==='swim'&&fish.length&&document.body.dataset.libraryOpen!=='true'&&idleVoiceReady(time))app.guideTo(feeding.eaten?'ds4_feed':'ds4_food');
 if(phase!=='draw'){
  const target=$('#library-button')?.getBoundingClientRect(),tx=target?(target.x+target.width/2)/view.unit:view.width*.75,ty=target?(target.y+target.height/2)/view.unit:view.height;
  for(const flight of archiveFlights){const t=clamp((time-flight.at)/.85,0,1),e=t*t*(3-2*t);flight.f.wave+=dt*2;drawSwimmer(ctx,flight.f,{x:flight.x*view.width*(1-e)+tx*e,y:flight.y*view.height*(1-e)+ty*e,scale:flight.f.baked.rig.scale*(1-e*.75),alpha:1-e});}
  archiveFlights=archiveFlights.filter(f=>time-f.at<.85);
 }
 positionFishActions();
 if(time-lastData>.3){lastData=time;document.body.dataset.swimmers=JSON.stringify(fish.map(f=>({id:f.id,x:+f.x.toFixed(2),y:+f.y.toFixed(2),vx:+f.vx.toFixed(2),yaw:+f.yaw.toFixed(3),wave:+f.wave.toFixed(3),drive:+f.drive.toFixed(3),opacity:+(f.opacity??1).toFixed(3),space:{x:f.baked.rig.marginX,y:f.baked.rig.marginY},hit:fishHitBox(f,view.unit),goal:{...f.goal},limits:swimLimits(f,water),points:f.baked.pointCount,rig:f.baked.rig.mode,type:f.baked.rig.type,scale:f.baked.rig.scale,bones:f.baked.rig.nodes.length,feeding:feeding.actors.has(f.id)?{satiety:+feeding.actors.get(f.id).satiety.toFixed(2),mood:feeding.mood(f.id),target:feeding.actors.get(f.id).target,mouth:drawingMouth(f),goal:f.feedGoal||null}:null})));document.body.dataset.feeding=JSON.stringify({time:feeding.world.time,offered:feeding.world.nextId-1,eaten:feeding.eaten,lastMeal:feeding.lastMeal,foods:feeding.world.foods.map(f=>({id:f.id,x:f.x,y:f.y,dragging:f.dragging,rivals:[...f.rivals]}))});}
 if(phase==='draw'&&idleVoiceReady(time)){app.guideTo(tool==='eraser'?'ds5_erase':tool==='eye'?'ds3_eye':draft.strokes.length?'ds3_ready':'ds3_hint')}
}
app.listeners.add(draw);labels();saveNote.hidden=!loaded.blocked;if(book.mode==='swim'){enterSwim();app.say(fish.length?'ds3_saved':'ds3_another')}else{app.guideTo(templateOf(draft.type).speech)}
