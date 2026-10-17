import {SONGS} from './songs.js?v=20261017piano3';
import {PianoAudio} from './audio.js?v=20261014piano1';
const $=id=>document.getElementById(id), audio=new PianoAudio();
const words={
 songs:['歌曲','Songs'],rounds:['遍','rounds'],minutes:['分钟','min'],title:['小钢琴','Little Piano'],subtitle:['小小的手，也能弹出美妙音乐。','A little touch. A little music.'],free:['自由弹','Free play'],listen:['听一听','Listen'],guide:['跟着亮光弹','Follow the light'],choose:['选一首歌','Choose a song'],tempo:['速度','Speed'],slow:['慢慢来','Slow'],gentle:['轻轻弹','Gentle'],normal:['正常','Normal'],two:['两个八度 · 三角钢琴','TWO OCTAVES · GRAND PIANO'],low:['低音','LOWER'],high:['高音','HIGHER'],footer:['让小手，弹出自己的音乐。','Little hands, wonderful music.'],retry:['重新加载声音','Retry sound'],about:['关于小钢琴','About this piano'],help:['可以用几个手指一起按，弹出和弦。跟着亮光弹会逐个音等你，不催时间。把 iPad 横过来，就能看到一整排琴键。','Touch several keys together to play a chord. Follow the light waits for you, one note at a time. Turn your iPad sideways for one long keyboard.'],sound:['三角钢琴音色','Grand piano sound'],scores:['曲目与来源','Music & credits'],songnote:['15 首白键旋律，另有黑键小练习。向下滑动选更多歌曲。跟弹不用赶拍子。','15 white-key melodies and a black-key exercise. Scroll for more songs. Follow the light waits for you.'],excerptNote:['每首安排 2—4 遍自然重复。《蓝精灵》包含主歌和副歌；《天空之城》加长开头主题，两首的临时变化音简化为白键。《采蘑菇的小姑娘》重复开头乐句；鲨鱼宝宝保持同调。','Each arrangement repeats 2–4 times. The Smurfs includes its verse and refrain; Castle in the Sky has a longer opening theme. Both simplify chromatic notes to white keys. The Mushroom Girl repeats its opening phrases; Baby Shark stays in one key.'],make:['来弹自己的音乐','Make your own music'],try:['白键、黑键都可以试试。','Try the white keys and the black keys.'],tap:['点亮着的琴键','Tap the glowing key'],time:['不用着急，我会等你。','Take your time. I will wait for you.'],lift:['抬起手，再点一次','Lift your finger, then tap again'],great:['弹完啦，真棒！','You did it!'],again:['还想弹？再来一次吧。','Ready for another go?'],listenHint:['听听这首歌','Listen to the melody'],listenSub:['亮起的琴键，就是正在弹的音。','The glowing keys show each note.'],paused:['准备好了就继续','Continue when you are ready'],pausedSub:['音乐停在这里，等你回来。','Your place is saved right here.'],ready:['想先听一听吗？','Shall we listen first?'],readySub:['按播放，看看旋律怎样走。','Press play and watch the melody.'],hearNote:['听这个音','Hear note'],play:['播放','Play'],pause:['暂停','Pause'],continue:['继续','Resume'],teach:['教我弹','Teach me'],replay:['再来一次','Again'],white:['只用白键','White keys'],black:['黑键练习','Black-key practice'],whiteTheme:['白键简化主题','White-key theme'],song:['完整旋律','Full melody'],chorus:['副歌','Chorus'],theme:['主题','Theme'],excerpt:['开头乐句','Opening phrase'],loading:['琴音准备中','Loading piano'],loaded:['琴音已就绪','Ready to play'],failed:['琴音加载失败','Sound unavailable'],unlock:['点琴键开始','Tap a key'],voiceOn:['英语语音开启','English voice on'],voiceOff:['英语语音关闭','English voice off'],home:['回首页','Home'],close:['关闭','Close'],count:['个音','notes']
};
let lang='en';try{lang=window.parent.XiaoxiaoI18n?.language || (localStorage.getItem('xiaoxiaoLanguage')==='zh'?'zh':'en');}catch{}
const t=key=>words[key]?.[lang==='zh'?0:1] || key;
let songMode='guide';
let song=SONGS.find(s=>s.id==='smurfs') ?? SONGS[0],mode='guide',cursor=0,finished=false,running=false,everStarted=false,speed=.85;
let scheduled=[],scheduleIndex=0,nextTime=0,endTime=0,timer=null,raf=null,voicesOn=true,welcomed=false,loadFailed=false;
let currentAuto=-1,pointers=new Map(),computer=new Map(),lastAdvance=0,completionTimer=null;
try{voicesOn=localStorage.getItem('xiaoxiaoEnglishVoiceEnabled')!=='false';}catch{}
const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const solfege=['Do','','Re','','Mi','Fa','','Sol','','La','','Ti'];
const colors=['#d58b76','#d58b76','#d5ae55','#d5ae55','#c5bd65','#88aa7c','#88aa7c','#6fa9a8','#6fa9a8','#8b99be','#8b99be','#b197b6'];
const name=midi=>names[midi%12]+(Math.floor(midi/12)-1);
const keys=new Map();
for(const [start,end,count] of [[60,71,7],[72,84,8]]){
 const row=document.createElement('div');row.className='octave';let whites=0;
 for(let n=start;n<=end;n++){
  const black=names[n%12].includes('♯'),el=document.createElement('button');el.type='button';el.className='key '+(black?'black':'white');el.dataset.note=n;el.setAttribute('aria-label',name(n));el.style.setProperty('--note-color',colors[n%12]);
  el.innerHTML=`<span class="dot"></span><span class="letter">${names[n%12]}<sub>${Math.floor(n/12)-1}</sub></span>${black?'':`<span class="solfege">${solfege[n%12]}</span>`}`;
  if(black){el.style.left=(whites/count*100)+'%';el.style.width=(70/count)+'%';el.style.marginLeft=(-35/count)+'%';}else whites++;
  row.append(el);keys.set(n,el);
 }
 $('keyboard').append(row);
}
function speak(id){if(voicesOn)audio.say(id);}
function localize(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 $('voice').setAttribute('aria-label',t(voicesOn?'voiceOn':'voiceOff'));$('info').setAttribute('aria-label',t('about'));$('restart').setAttribute('aria-label',t('replay'));
 document.querySelector('header a').setAttribute('aria-label',t('home'));document.querySelectorAll('.close').forEach(e=>e.setAttribute('aria-label',t('close')));
 $('voice').setAttribute('aria-pressed',voicesOn);$('voice').textContent=voicesOn?'♬':'♩';renderSongs();render();soundStatus();
}
window.XiaoxiaoI18n={get language(){return lang;},applyLanguage(value){lang=value==='zh'?'zh':'en';localize();}};
function soundStatus(){
 $('sound-state').textContent=loadFailed?t('failed'):audio.ready?(audio.ctx.state==='running'?t('loaded'):t('unlock')):t('loading');
 $('sound-retry').hidden=!loadFailed;$('play').disabled=!audio.ready;
}
async function prepare(){
 loadFailed=false;soundStatus();
 try{await audio.load((a,b)=>{if(loadFailed)return;$('sound-state').textContent=`${t('loading')} ${a}/${b}`;});soundStatus();welcome();}catch{loadFailed=true;soundStatus();}
}
function welcome(){if(!welcomed && audio.ready && audio.ctx.state==='running'){welcomed=true;speak(mode==='guide'?'guide':'welcome');}}
function clearVisual(){keys.forEach(k=>k.classList.remove('sounding'));}
function render(){
 document.body.dataset.playMode=mode;
 $('song-name').textContent=song[lang];$('song-icon').textContent=song.icon;$('kind').textContent=t(song.kind);$('tempo-wrap').hidden=mode!=='listen';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===(mode==='free'&&b.closest('.song-mode')?songMode:mode)));
 document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.panel===(mode==='free'?'free':'songs')));
 $('restart').hidden=mode==='free';$('progress').style.width=(mode==='free'?0:cursor/song.notes.length*100)+'%';
 $('progress-label').textContent=mode==='free'?'':`${Math.min(cursor,song.notes.length)} / ${song.notes.length}`;
 keys.forEach(k=>{k.classList.remove('expected','lift');k.removeAttribute('aria-current');});
 let hint,sub,action;
 if(mode==='free'){hint='make';sub='try';action='teach';}
 else if(finished){hint='great';sub='again';action='replay';}
 else if(mode==='guide'){
  const expected=song.notes[cursor].midi,key=keys.get(expected),held=[...pointers.values(),...computer.values()].some(p=>p.midi===expected);
  key.classList.add('expected');key.setAttribute('aria-current','step');if(held)key.classList.add('lift');hint=held?'lift':'tap';sub='time';action='hearNote';
 }else{hint=running?'listenHint':everStarted?'paused':'ready';sub=running?'listenSub':everStarted?'pausedSub':'readySub';action=running?'pause':everStarted?'continue':'play';}
 $('hint').textContent=t(hint);$('subhint').textContent=t(sub);$('play').innerHTML=`${running?'Ⅱ':mode==='free'?'☞':mode==='guide'&&!finished?'♪':'▷'} <span>${t(action)}</span>`;
 $('notes').replaceChildren();
 if(mode==='free'){$('notes').innerHTML='<span class="free-notes" aria-hidden="true">♪ ♫ ♪ ♬</span>';}
 else for(const [i,n]of song.notes.slice(cursor,cursor+6).entries()){
  const chip=document.createElement('span');chip.className='note-chip'+(i===0?' next':'');chip.textContent=name(n.midi);$('notes').append(chip);
 }
 if(finished)$('notes').innerHTML='<span class="free-notes" aria-hidden="true">✦ ♫ ✦</span>';
}
function renderSongs(){
 $('song-list').replaceChildren();$('credits').replaceChildren();
 for(const s of SONGS){
  const b=document.createElement('button');b.type='button';b.className='song-option'+(s===song?' selected':'');b.dataset.song=s.id;b.setAttribute('aria-pressed',s===song);
  b.innerHTML=`<span class="symbol" aria-hidden="true">${s.icon}</span><span><strong>${s[lang]}</strong><small>${t(s.kind)} · ${t(s.whiteKeys?'white':'black')} · ${s.notes.length} ${t('count')} · ${s.repeats} ${t('rounds')}</small></span>`;
  b.onclick=()=>{stopEverything();song=s;cursor=0;finished=false;everStarted=false;$('songs').close();renderSongs();render();if(mode==='guide')speak('guide');};$('song-list').append(b);
  const li=document.createElement('li');li.textContent=s.credit+' ';if(s.source){const a=document.createElement('a');a.href=s.source;a.target='_blank';a.rel='noopener';a.textContent=lang==='zh'?'曲谱参考':'Score reference';li.append(a);}$('credits').append(li);
 }
}
function stopAuto(){
 running=false;clearInterval(timer);cancelAnimationFrame(raf);timer=null;raf=null;scheduled=[];audio.stop();clearVisual();currentAuto=-1;
}
function stopEverything(){stopAuto();clearTimeout(completionTimer);audio.stopSpeech();pointers.clear();computer.clear();keys.forEach(k=>k.classList.remove('pressed'));}
function finish(){
 stopAuto();cursor=song.notes.length;finished=true;render();
 const box=$('celebration');box.replaceChildren();
 for(let i=0;i<12;i++){const star=document.createElement('span');star.className='spark';star.textContent=i%2?'♪':'✦';star.style.setProperty('--x',(12+Math.random()*76)+'%');star.style.setProperty('--size',(18+Math.random()*18)+'px');star.style.setProperty('--color',colors[(i*2)%12]);star.style.animationDelay=(i*.03)+'s';box.append(star);}
 completionTimer=setTimeout(()=>{if(!document.hidden)speak(song.kind==='song'?'done':'phrase');},450);
}
function pause(){
 if(running){const now=audio.ctx.currentTime,last=scheduled.filter(n=>n.at<=now).at(-1);if(last)cursor=last.index;}
 stopAuto();render();
}
function schedule(){
 if(!running)return;const ctx=audio.ctx;
 while(scheduleIndex<song.notes.length && nextTime<ctx.currentTime+.14){
  const n=song.notes[scheduleIndex],duration=n.beats*60/song.bpm/speed,gap=Math.min(.12,Math.max(.06,duration*.18)),sounding=Math.max(.035,Math.min((n.soundBeats??n.beats)*60/song.bpm/speed*.9,duration-gap));
  audio.note(n.midi,nextTime,sounding);scheduled.push({index:scheduleIndex,at:nextTime,off:nextTime+sounding,midi:n.midi});nextTime+=duration;scheduleIndex++;
 }
 endTime=nextTime;
}
function animate(){
 if(!running)return;const now=audio.ctx.currentTime,active=scheduled.filter(n=>n.at<=now).at(-1);
 if(active){if(currentAuto!==active.index){currentAuto=active.index;cursor=active.index;render();}clearVisual();if(now<active.off)keys.get(active.midi).classList.add('sounding');}
 // Keep only the most recent and queued events, so a long score stays bounded.
 if(scheduled.length>10)scheduled=scheduled.filter((n,i)=>n.at>now || i===scheduled.findLastIndex(x=>x.at<=now));
 if(scheduleIndex===song.notes.length && now>=endTime+.3){finish();return;}
 raf=requestAnimationFrame(animate);
}
function startAuto(){
 if(!audio.ready || document.hidden)return;audio.unlock().catch(()=>{});stopEverything();if(finished||cursor>=song.notes.length)cursor=0;finished=false;everStarted=true;running=true;scheduleIndex=cursor;nextTime=audio.ctx.currentTime+.08;endTime=Infinity;
 render();schedule();timer=setInterval(schedule,35);raf=requestAnimationFrame(animate);
}
function modeChange(next){
 if(next===mode)return;
 if(running)pause();stopEverything();mode=next;if(next!=='free')songMode=next;
 lastAdvance=0;welcomed=true;audio.unlock().catch(()=>{});render();
 if(mode==='guide'&&!finished)speak('guide');
}

function press(midi,id,collection){
 if(!audio.ready || collection.has(id))return;
 if(mode==='listen' && running)pause();
 audio.unlock().catch(()=>{});audio.stopSpeech();welcomed=true;
 const alreadyHeld=[...pointers.values(),...computer.values()].some(p=>p.midi===midi);
 const voice=audio.note(midi);collection.set(id,{midi,voice});keys.get(midi).classList.add('pressed');$('playing-note').textContent=name(midi)+' · '+(solfege[midi%12]||names[midi%12]);
 if(mode==='guide' && !finished && midi===song.notes[cursor].midi && !alreadyHeld && performance.now()-lastAdvance>100){
  lastAdvance=performance.now();cursor++;
  if(cursor===song.notes.length){finished=true;render();completionTimer=setTimeout(()=>{if(mode==='guide' && cursor===song.notes.length)finish();},400);}else render();
 }else if(mode==='guide'&&!finished){render();}
}
function release(id,collection){const p=collection.get(id);if(!p)return;p.voice?.release();collection.delete(id);if(![...pointers.values(),...computer.values()].some(x=>x.midi===p.midi))keys.get(p.midi).classList.remove('pressed');if(mode==='guide'&&!finished && cursor<song.notes.length)render();}
const keyAt=(x,y)=>document.elementFromPoint(x,y)?.closest('.key');
$('keyboard').addEventListener('pointerdown',e=>{
 if(e.button!==0 || !e.target.closest('.key'))return;e.preventDefault();const key=e.target.closest('.key');key.setPointerCapture(e.pointerId);press(Number(key.dataset.note),e.pointerId,pointers);
});
$('keyboard').addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||mode!=='free')return;e.preventDefault();const key=keyAt(e.clientX,e.clientY),p=pointers.get(e.pointerId);if(key && Number(key.dataset.note)!==p.midi){release(e.pointerId,pointers);press(Number(key.dataset.note),e.pointerId,pointers);}
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('keyboard').addEventListener(event,e=>release(e.pointerId,pointers));
// Physical keyboards are optional; every key also supports focus + Space/Enter.
const mapping={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72,o:73,l:74,p:75,';':76,"'":77};
window.addEventListener('keydown',e=>{if(e.repeat || $('songs').open || $('about').open || e.target.matches('select,input'))return;let midi=mapping[e.key.toLowerCase()];if([' ','Enter'].includes(e.key)&&e.target.matches('.key'))midi=Number(e.target.dataset.note);if(midi!==undefined){e.preventDefault();press(midi,e.code,computer);}});
window.addEventListener('keyup',e=>release(e.code,computer));
$('keyboard').addEventListener('click',e=>{if(e.detail===0&&e.target.closest('.key')&&!e.isTrusted){const midi=Number(e.target.closest('.key').dataset.note);press(midi,'accessible',computer);release('accessible',computer);}});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>modeChange(b.dataset.mode));
 document.querySelector('[data-panel="songs"]').onclick=()=>modeChange(songMode);
$('play').onclick=()=>{if(mode==='free')modeChange('guide');else if(mode==='guide'){if(finished){stopEverything();cursor=0;finished=false;lastAdvance=0;render();speak('guide');}else{audio.unlock().catch(()=>{});audio.stopSpeech();audio.note(song.notes[cursor].midi,audio.ctx.currentTime,.7);}}else if(running)pause();else startAuto();};
$('restart').onclick=()=>{const wasRunning=running;stopEverything();cursor=0;finished=false;everStarted=false;lastAdvance=0;render();if(wasRunning)startAuto();};
$('tempo').onchange=()=>{const wasRunning=running;if(running)pause();speed=Number($('tempo').value);if(wasRunning)startAuto();};
$('voice').onclick=()=>{voicesOn=!voicesOn;try{localStorage.setItem('xiaoxiaoEnglishVoiceEnabled',voicesOn);}catch{}if(!voicesOn)audio.stopSpeech();localize();};
for(const [button,dialog]of [['choose','songs'],['info','about']])$(button).onclick=()=>{if(running)pause();audio.stopSpeech();$(dialog).showModal();};
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
$('sound-retry').onclick=()=>{audio.unlock().catch(()=>{});prepare();};
function leave(){if(running)pause();stopEverything();render();}
window.addEventListener('blur',leave);window.addEventListener('pagehide',leave);document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();else soundStatus();});
document.querySelector('header a').addEventListener('click',leave);
localize();prepare();audio.ctx.addEventListener('statechange',()=>{if(audio.ctx.state!=='running'&&running)pause();soundStatus();});
// Safari and Chromium grant touch activation on release, not on pointerdown.
document.addEventListener('pointerup',()=>{if(audio.ctx.state!=='running')audio.unlock().then(soundStatus).catch(()=>{});},{capture:true});
document.addEventListener('touchend',()=>{if(audio.ctx.state!=='running')audio.unlock().then(soundStatus).catch(()=>{});},{passive:true});
document.addEventListener('pointerdown',()=>{audio.unlock().then(()=>{soundStatus();welcome();}).catch(()=>{});},{once:true});
// Read-only diagnostics used by the two-browser interaction and audio checks.
window.pianoDebug=()=>({mode,song:song.id,cursor,total:song.notes.length,expected:!finished&&cursor<song.notes.length?song.notes[cursor].midi:null,finished,running,ready:audio.ready,context:audio.ctx.state,voices:audio.voices.size,pressed:pointers.size+computer.size,sampleCount:audio.buffers.size,sampleRate:audio.ctx.sampleRate,baseLatency:audio.ctx.baseLatency??null,speed});
