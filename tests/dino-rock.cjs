process.env.TMPDIR='/tmp';
const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.DIG_BASE||'http://127.0.0.1:8003',out=process.env.DIG_EVIDENCE||process.env.CWW_JOB_RUNTIME;
(async()=>{for(const engine of ['chromium','webkit']){
 const b=await({chromium,webkit}[engine]).launch({executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu']:[]});
 try{
 const c=await b.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block'});await c.route(/\/(api|bankend)\//,r=>r.abort());
 if(process.env.DIG_GAME_OVERRIDE)await c.route('**/games/dino_dig/game.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.DIG_GAME_OVERRIDE,'utf8')}));
 const p=await c.newPage(),errors=[],bad=[],clips=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!/\/(api|bankend)\//.test(r.url()))bad.push(r.url());if(/dd5_(pick_start|rock_tap|rock_done)\.mp3/.test(r.url()))clips.push(r.url());});
 await p.addInitScript(()=>{window.rockAudioProbe={tones:0,active:0,loops:0};const osc=AudioContext.prototype.createOscillator,src=AudioContext.prototype.createBufferSource;
 AudioContext.prototype.createOscillator=function(){const o=osc.call(this),start=o.start.bind(o);o.start=(...a)=>{rockAudioProbe.tones++;rockAudioProbe.active++;o.addEventListener('ended',()=>rockAudioProbe.active--,{once:true});return start(...a)};return o;};
 AudioContext.prototype.createBufferSource=function(){const o=src.call(this),start=o.start.bind(o);o.start=(...a)=>{if(o.loop)rockAudioProbe.loops++;return start(...a)};return o;};});
 await p.goto(base+'/games/dino_dig/');await p.waitForFunction(()=>window.dinoRockDebug?.().pieces?.length===18);await p.locator('#speech').click();await p.waitForTimeout(300);
 const state=()=>p.evaluate(()=>({rock:dinoRockDebug(),data:{...document.body.dataset},audio:{...rockAudioProbe}}));
 const point=async xy=>{const r=await p.locator('#dig-canvas').boundingBox();return{x:r.x+(xy.x-14)*r.width/692,y:r.y+(xy.y-38)*r.height/520};};
 const tap=async xy=>{const q=await point(xy);await p.touchscreen.tap(q.x,q.y);};
 assert.equal((await state()).data.tool,'pick');assert.equal((await state()).data.layer,'0');
 const model=await p.evaluate(async()=>{
  const {rockPieces,RockLayer}=await import('./rock.js?v=20261017rock1');let minArea=Infinity,maxArea=0;
  for(let seed=1;seed<=80;seed++){let v=seed;const random=()=>((v=(v*1664525+1013904223)>>>0)/4294967296);const pieces=rockPieces(random);if(pieces.length!==18)throw Error('wrong count');const total=pieces.reduce((s,p)=>s+p.area,0);if(Math.abs(total-624*420)>.01)throw Error('gaps in rock tiling');for(const p of pieces){minArea=Math.min(minArea,p.area);maxArea=Math.max(maxArea,p.area);if(p.polygon.length<3||p.polygon.some(q=>q.x<47.999||q.x>672.001||q.y<69.999||q.y>490.001))throw Error('polygon outside pit');}}
  const img=new Image();img.src='./assets/layer-rock-v1.webp';await img.decode();const rock=new RockLayer(img);
  const alpha=xy=>rock.ctx.getImageData(Math.floor(xy.x),Math.floor(xy.y),1,1).data[3];
  const first=rock.pieces[0],far=rock.pieces.at(-1);if(alpha(first.center)!==255)throw Error('initial stone missing');
  rock.stamp(first.center.x,first.center.y);if(alpha(first.center)!==0||alpha(far.center)!==255)throw Error('non-local break');if(rock.stamp(first.center.x,first.center.y))throw Error('empty hole broke more stone');
  for(const p of rock.pieces.slice(1)){if(!rock.stamp(p.center.x,p.center.y))throw Error('inaccessible rock');}if(!rock.complete||rock.centralCoverage!==1)throw Error('cannot complete');
  return {layouts:80,pieces:18,minArea,maxArea,localErasure:true,emptyHoleStable:true,allPiecesReachable:true};
 });
 // The pick is draggable before it is equipped, then leaves all stones unobstructed.
 const dragTarget=await point((await state()).rock.pieces[2].center);await p.locator('#next-tool').hover();await p.mouse.down();await p.mouse.move(dragTarget.x,dragTarget.y,{steps:5});await p.mouse.up();assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,1);await p.locator('#again').click();await p.waitForSelector('body[data-phase=dig]');
 await p.screenshot({path:out+'/rock-'+engine+'-whole.png'});
 const original=(await state()).rock.pieces;const a=await point(original[7].center),other=await point(original[10].center);
 await p.mouse.move(a.x,a.y);await p.mouse.down();await p.waitForTimeout(900);let s=await state();assert.equal(s.rock.pieces.filter(p=>p.removed).length,1,'hold repeated strikes');
 await p.mouse.move(other.x,other.y,{steps:10});await p.waitForTimeout(300);assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,1,'drag brushed through rock');await p.mouse.up();
 await tap(original[7].center);assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,1,'tap cleared hole removed a neighbour');
 assert.equal((await state()).audio.loops,0,'stone used brushing noise');assert((await state()).audio.tones>=2,'missing stone chink');await p.waitForTimeout(200);assert.equal((await state()).audio.active,0,'stone chink continued');
 await p.mouse.move(0,0);await p.screenshot({path:out+'/rock-'+engine+'-one-piece.png'});
 // Dragging the tool drops one strike; keyboard auto-repeat must not mine repeatedly.
 assert.equal(await p.locator('#next-tool').isVisible(),false,'equipped pick obscures stone');
 await p.locator('#dig-canvas').focus();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.down('Enter');assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,2);await p.keyboard.up('Enter');
 await p.locator('#mute').click();const tones=(await state()).audio.tones;await tap((await state()).rock.pieces.find(x=>!x.removed).center);assert.equal((await state()).audio.tones,tones);await p.locator('#mute').click();
 for(const piece of (await state()).rock.pieces.filter(p=>!p.removed))await tap(piece.center);
 await p.waitForSelector('body[data-phase=toolReady]');assert.equal((await state()).data.layer,'0');assert.equal((await state()).rock.pieces.filter(p=>!p.removed).length,0);
 await p.waitForTimeout(1050);await p.locator('#next-tool').tap();assert.equal((await state()).data.layer,'1');assert.equal((await state()).data.tool,'shovel');assert.equal(+(await state()).data.coverage,0,'rock press leaked into soil');
 // Full four-layer round with real key presses, including the three original tools.
 for(let layer=1;layer<=3;layer++){
  assert.equal(+(await state()).data.layer,layer);assert.equal((await state()).data.tool,['pick','shovel','brush','finebrush'][layer]);await p.locator('#dig-canvas').focus();
  for(let n=0;n<500&&(await state()).data.phase==='dig';n++)await p.keyboard.press('Enter');
  if(layer<3){await p.waitForSelector('body[data-phase=toolReady]');await p.locator('#next-tool').tap();}else await p.waitForSelector('body[data-phase=alive]');
 }
 assert((await state()).audio.loops>0,'soil no longer brushes');assert(clips.some(x=>x.includes('dd5_rock_done')),'missing tool transition voice');
 const oldLayout=original.map(x=>x.polygon);await p.locator('#again').click();await p.waitForSelector('body[data-phase=dig]');assert.equal((await state()).data.tool,'pick');assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,0);assert.notDeepEqual((await state()).rock.pieces.map(x=>x.polygon),oldLayout);
 // Narrow screens: every stone centroid remains visible and touchable.
 const layouts=[];for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:768,height:1024}]){
  await p.setViewportSize(size);await p.locator('#again').click();await p.waitForSelector('body[data-phase=dig]');const piece=(await state()).rock.pieces[8];await tap(piece.center);assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,1);
  const g=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('#dig-canvas').getBoundingClientRect().toJSON(),height:innerHeight}));assert(g.scroll<=g.width+1);assert(g.canvas.bottom<=g.height+1);layouts.push({...size,...g});for(const piece of (await state()).rock.pieces.filter(p=>!p.removed))await tap(piece.center);assert.equal((await state()).rock.pieces.filter(p=>!p.removed).length,0,'stone blocked on '+size.width);await p.screenshot({path:out+`/rock-${engine}-${size.width}.png`});
 }
 await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));const before=(await state()).rock.pieces.filter(p=>p.removed).length;await p.waitForTimeout(250);assert.equal((await state()).audio.active,0);await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));assert.equal((await state()).rock.pieces.filter(p=>p.removed).length,before);
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);const result={engine,passed:true,model,oneTapOneChunk:true,holdAndDragDoNotRepeat:true,toolDrag:true,keyboardRepeatBlocked:true,mute:true,stoneAudio:true,fullFourLayerRound:true,originalBrushAudio:true,restartRandomizes:true,layouts,errors,bad};fs.writeFileSync(out+'/rock-'+engine+'.json',JSON.stringify(result,null,2));console.log(engine,'PASS rock model, touch, four layers, audio, restart, four viewports');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
