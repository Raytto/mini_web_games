/* Original code-drawn cover, rendered with the game's actual mirror engine.
   Writes only the runtime cover and a transparent sample PNG in COVER_RUNTIME. */
process.env.TMPDIR='/tmp';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=process.env.COVER_RUNTIME;assert(out,'Set COVER_RUNTIME');fs.mkdirSync(out,{recursive:true});
const curve=(a,b,c,d)=>Array.from({length:51},(_,i)=>{const t=i/50,u=1-t;return[0,1].map(k=>+(a[k]*u**3+3*b[k]*u*u*t+3*c[k]*u*t*t+d[k]*t**3).toFixed(2))});
const petal=[...curve([618,490],[770,410],[850,220],[760,170]),...curve([760,170],[647,108],[597,321],[618,490]).slice(1)];
const leaf=[...curve([795,480],[965,467],[1030,300],[960,288]),...curve([960,288],[884,275],[804,411],[795,480]).slice(1)];
const inner=[...curve([603,538],[642,502],[693,474],[695,505]),...curve([695,505],[699,541],[640,548],[603,538]).slice(1)];
const stroke=(color,width,points)=>({type:'stroke',tool:'pen',parts:6,color,width,points});
const actions=[stroke('#80a878',20,leaf),stroke('#e36e64',26,petal),stroke('#dfb941',20,inner),stroke('#648fbe',30,[[710,112]]),stroke('#dfb941',20,[[1000,460]]),stroke('#d58da8',20,curve([640,355],[685,302],[718,280],[708,236])),stroke('#80a878',20,[[600,600]])];
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',args:['--no-sandbox','--disable-gpu','--no-proxy-server']});try{
 const p=await b.newPage();await p.route('**/bankend/**',r=>r.fulfill({status:204}));await p.addInitScript(()=>localStorage.setItem('xiaoxiaoEnglishVoiceEnabled','false'));
 await p.goto((process.env.SYMMETRY_BASE||'http://127.0.0.1:18879')+'/games/symmetry_draw/index.html');
 const result=await p.evaluate(async actions=>{
  const {action}=await import('./engine.js?v=20261016sym1'),art=document.createElement('canvas');art.width=art.height=1200;const a=art.getContext('2d');actions.forEach(s=>action(a,s));
  const cover=document.createElement('canvas');cover.width=1440;cover.height=900;const c=cover.getContext('2d');c.scale(2,2);
  c.fillStyle='#f4efdf';c.fillRect(0,0,720,450);c.fillStyle='#e6ecdd';c.beginPath();c.arc(25,455,165,0,Math.PI*2);c.fill();c.fillStyle='#f1ddca';c.beginPath();c.arc(700,12,126,0,Math.PI*2);c.fill();
  c.save();c.shadowColor='#64745a26';c.shadowBlur=22;c.shadowOffsetY=8;c.fillStyle='#fffefa';c.beginPath();c.arc(361,225,201,0,Math.PI*2);c.fill();c.restore();
  c.fillStyle='#fff';c.beginPath();c.arc(361,225,191,0,Math.PI*2);c.fill();c.save();c.strokeStyle='#bdcabb';c.lineWidth=1;c.setLineDash([4,6]);
  for(let i=0;i<6;i++){const t=-Math.PI/2+i*Math.PI/3;c.beginPath();c.moveTo(361,225);c.lineTo(361+191*Math.cos(t),225+191*Math.sin(t));c.stroke();}c.restore();c.drawImage(art,170,34,382,382);
  ['#e36e64','#dfb941','#80a878','#648fbe'].forEach((color,i)=>{c.fillStyle='#fffdf6';c.beginPath();c.arc(88,144+i*51,19,0,Math.PI*2);c.fill();c.fillStyle=color;c.beginPath();c.arc(88,144+i*51,13,0,Math.PI*2);c.fill()});
  c.save();c.translate(611,303);c.rotate(.39);c.fillStyle='#668e78';c.beginPath();c.roundRect(-12,-125,24,145,8);c.fill();c.fillStyle='#98b79f';c.fillRect(-8,-116,6,125);c.fillStyle='#e2c4a0';c.beginPath();c.moveTo(-12,20);c.lineTo(12,20);c.lineTo(0,51);c.closePath();c.fill();c.fillStyle='#e36e64';c.beginPath();c.moveTo(-4,40);c.lineTo(4,40);c.lineTo(0,51);c.closePath();c.fill();c.restore();
  c.strokeStyle='#ddab6b';c.lineWidth=3;c.lineCap='round';for(const [x,y]of [[608,83],[132,70],[627,386]]){c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.moveTo(x,y-6);c.lineTo(x,y+6);c.stroke()}
  const thumb=document.createElement('canvas');thumb.width=720;thumb.height=450;thumb.getContext('2d').drawImage(cover,0,0,720,450);
  return{cover:thumb.toDataURL('image/webp',.9),art:art.toDataURL('image/png')};
 },actions);
 fs.writeFileSync(path.join(__dirname,'../../frontend-game/assets/thumbnails/symmetry-draw-v1.webp'),Buffer.from(result.cover.split(',')[1],'base64'));
 fs.writeFileSync(path.join(out,'sample-art.png'),Buffer.from(result.art.split(',')[1],'base64'));
 fs.writeFileSync(path.join(out,'sample-actions.json'),JSON.stringify(actions));console.log('Generated 720×450 cover using game mirror engine');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
