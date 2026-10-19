// Reuse the game's own vector illustration. Render only temporary PNG data.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),runtime=process.env.CWW_JOB_RUNTIME;
if(!runtime)throw Error('CWW_JOB_RUNTIME required');
const source=fs.readFileSync(path.join(root,'frontend-game/games/sky_sling/index.html'),'utf8');
const art=source.match(/<svg class="hero-art"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
if(!art)throw Error('Missing original game illustration');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 450">
<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#a8dce9"/><stop offset="1" stop-color="#edf0d9"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h720v450H0z"/>
<g fill="#fffdf3" opacity=".6"><path d="M-30 102q-12-32 17-38q3-44 42-27q26-31 54-1q39-5 35 25q47-1 45 29q-2 27-65 23Z"/><path d="M542 67q-9-24 14-28q2-33 31-20q19-23 40-1q29-4 27 19q35-1 34 21q-2 20-49 17Z"/></g>
<circle cx="616" cy="112" r="61" fill="#fff4ba" opacity=".6"/>
<path d="M0 390Q166 321 341 381T720 368V450H0Z" fill="#d3e5cf"/><path d="M0 421Q210 381 391 421T720 401V450H0Z" fill="#bbd7be"/>
<g transform="translate(63 39) scale(2.25)">${art}</g>
<g fill="url(#hb)" stroke="#fff" stroke-width="2.5"><circle cx="634" cy="333" r="49"/><circle cx="398" cy="73" r="22"/></g>
<path d="M598 321q4-21 23-25M383 67q2-8 8-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
<g transform="translate(119 377)"><ellipse cy="-9" rx="29" ry="27" fill="#fffbec"/><ellipse cx="-13" cy="-70" rx="9" ry="30" fill="#fffbec"/><ellipse cx="13" cy="-70" rx="9" ry="30" fill="#fffbec"/><ellipse cx="-13" cy="-72" rx="3" ry="19" fill="#efb8b0"/><ellipse cx="13" cy="-72" rx="3" ry="19" fill="#efb8b0"/><ellipse cy="-40" rx="30" ry="25" fill="#fffbec"/><g fill="#6d6a61"><ellipse cx="-10" cy="-41" rx="2.5" ry="3.5"/><ellipse cx="10" cy="-41" rx="2.5" ry="3.5"/></g><g fill="#f3c4bc"><ellipse cx="-19" cy="-33" rx="6" ry="4"/><ellipse cx="19" cy="-33" rx="6" ry="4"/></g><path d="M-4-36h8l-4 5Z" fill="#ce9d98"/><path d="M-24-18q24 13 48 0l-4 9q-20 10-40 0Z" fill="#7fb9ae"/></g>
</svg>`;
(async()=>{const png=path.join(runtime,'sky-sling-cover.png'),output=path.join(root,'frontend-game/assets/thumbnails/sky-sling-v1.webp');const b=await chromium.launch({headless:true,args:['--disable-gpu','--no-zygote','--single-process']});try{const p=await b.newPage({viewport:{width:720,height:450},deviceScaleFactor:1});await p.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>'+svg);await p.screenshot({path:png});const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',png,'-frames:v','1','-c:v','libwebp','-quality','88',output],{encoding:'utf8'});if(r.status)throw Error(r.stderr);console.log('Cover: 720×450, '+fs.statSync(output).size+' bytes');}finally{await b.close();fs.rmSync(png,{force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
