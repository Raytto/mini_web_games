(() => {
  "use strict";
  const ROOT = "../shared/generated_assets/";
  const WEATHERS = [
    { id:"sun", name:"大太阳", icon:"☀️", effect:"sun", items:[{id:"sun_hat",name:"遮阳帽",slot:"first"},{id:"sunglasses",name:"墨镜",slot:"second"}] },
    { id:"rain", name:"下雨天", icon:"🌧️", effect:"rain", items:[{id:"raincoat",name:"雨衣",slot:"first"},{id:"rain_boots",name:"雨靴",slot:"second"}] },
    { id:"snow", name:"下雪天", icon:"❄️", effect:"snow", items:[{id:"puffer",name:"羽绒服",slot:"first"},{id:"scarf",name:"围巾",slot:"second"}] },
    { id:"wind", name:"大风天", icon:"💨", effect:"wind", items:[{id:"windbreaker",name:"防风外套",slot:"first"},{id:"cap",name:"防风帽",slot:"second"}] },
    { id:"autumn", name:"秋凉天", icon:"🍂", effect:"autumn", items:[{id:"sweater",name:"毛衣",slot:"first"},{id:"beanie",name:"针织帽",slot:"second"}] }
  ];
  const ALL_ITEMS = WEATHERS.flatMap(weather => weather.items.map(item => ({...item,weatherId:weather.id,file:`weather_dress_${weather.id}_item_${item.slot}.png`})));
  const stage=document.getElementById("weatherStage"), child=document.getElementById("childTarget"), childImage=document.getElementById("childImage");
  const cards=document.getElementById("itemCards"), dockTip=document.getElementById("dockTip"), nextPanel=document.getElementById("nextPanel");
  const nextButton=document.getElementById("nextButton"), resetButton=document.getElementById("resetButton"), feedback=document.getElementById("feedback");
  const roundBadge=document.getElementById("roundBadge"), collectionBadge=document.getElementById("collectionBadge"), successBanner=document.getElementById("successBanner");
  const weatherReveal=document.getElementById("weatherReveal"), completeWeatherName=document.getElementById("completeWeatherName");
  const effects=document.getElementById("weatherEffects"), celebration=document.getElementById("celebration"), dragGhost=document.getElementById("dragGhost");
  let bag=[],current=null,placed=new Set(),discovered=new Set(),selected=null,feedbackTimer=0,drag=null,suppressClickUntil=0,audioContext=null;

  const shuffle=values=>{const copy=[...values];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
  const asset=name=>`${ROOT}${name}`;
  const stateAsset=state=>asset(`weather_dress_${current.id}_${state}.png`);

  function drawWeather(){
    if(!bag.length){const others=WEATHERS.filter(w=>w.id!==current?.id);bag=shuffle(others);if(current)bag.unshift(current);}
    return bag.pop();
  }

  function startWeather(weather=current){
    if(drag)cleanupDrag();
    current=weather; placed=new Set(); selected=null; successBanner.hidden=true; weatherReveal.hidden=true; nextPanel.hidden=true; dockTip.hidden=false; cards.hidden=false; celebration.replaceChildren(); hideFeedback();
    stage.style.setProperty("--scene",`url("${asset(`weather_dress_bg_${current.id}.jpg`)}")`);
    childImage.src=stateAsset("none"); childImage.alt="有两件东西没有穿好的小朋友"; child.className="child-target";
    const distractor=shuffle(ALL_ITEMS.filter(item=>item.weatherId!==current.id))[0];
    const choices=shuffle([...current.items.map(item=>({...item,weatherId:current.id,file:`weather_dress_${current.id}_item_${item.slot}.png`})),distractor]);
    cards.innerHTML=choices.map(item=>`<button class="item-card" type="button" data-id="${item.id}" aria-label="${item.name}" title="${item.name}"><img src="${asset(item.file)}" alt="${item.name}" draggable="false"></button>`).join("");
    cards.querySelectorAll(".item-card").forEach(bindCard); renderEffects(); updateBadges(); preloadCurrent();
  }

  function bindCard(card){
    card.addEventListener("click",event=>{if(Date.now()<suppressClickUntil)return;event.preventDefault();chooseItem(card.dataset.id);});
    card.addEventListener("pointerdown",startDrag);
  }

  function clearSelection(){
    selected=null;
    cards.querySelectorAll(".item-card").forEach(card=>card.classList.remove("selected"));
    child.classList.remove("is-target");
  }

  function chooseItem(id){
    if(placed.has(id))return; selected=selected===id?null:id;
    cards.querySelectorAll(".item-card").forEach(card=>card.classList.toggle("selected",card.dataset.id===selected));
    child.classList.toggle("is-target",Boolean(selected));
    if(selected){showFeedback("再点一下小朋友，把东西送过去");playTone(440,.12);}else hideFeedback();
  }

  child.addEventListener("click",()=>{if(selected)tryItem(selected);});

  function tryItem(id){
    const item=current.items.find(value=>value.id===id);
    if(!item){clearSelection();child.classList.remove("wrong");void child.offsetWidth;child.classList.add("wrong");setTimeout(()=>child.classList.remove("wrong"),450);showFeedback("这个天气用不上，再看看场景和形状 👀");playWrong();return;}
    if(placed.has(id))return;
    placed.add(id); clearSelection();
    const card=cards.querySelector(`[data-id="${id}"]`);card?.classList.add("used");
    const state=placed.size===2?"complete":(placed.has(current.items[0].id)?"first":"second");
    childImage.src=stateAsset(state); childImage.alt=`已经穿上${item.name}的小朋友`;
    child.classList.remove("happy");void child.offsetWidth;child.classList.add("happy");
    showFeedback(`${item.name}穿好啦！`);playTone(item.slot==="first"?523:659,.28);updateBadges();
    if(placed.size===2)setTimeout(completeWeather,460);
  }

  function completeWeather(){
    discovered.add(current.id);updateBadges();successBanner.hidden=false;weatherReveal.textContent=`${current.icon} ${current.name}`;weatherReveal.hidden=false;
    completeWeatherName.textContent=`${current.icon} ${current.name}准备好啦！`;dockTip.hidden=true;cards.hidden=true;nextPanel.hidden=false;hideFeedback();celebrate();playFanfare();
  }

  function updateBadges(){roundBadge.textContent=`准备好 ${placed.size}/2`;collectionBadge.textContent=`天气图鉴 ${discovered.size}/5`;}
  function nextWeather(){current=drawWeather();startWeather(current);showFeedback("天气变啦，看看这次需要什么");}
  function resetWeather(){startWeather(current);showFeedback("这个天气重新准备啦");}

  function renderEffects(){
    effects.className=`weather-effects ${current.effect}`;effects.replaceChildren();const counts={sun:16,rain:26,snow:24,wind:15,autumn:13};
    for(let i=0;i<counts[current.effect];i++){const piece=document.createElement("i");
      piece.style.left=`${Math.random()*100}%`;piece.style.top=current.effect==="sun"?`${8+Math.random()*80}%`:piece.style.top;
      piece.style.setProperty("--duration",`${1.8+Math.random()*3.2}s`);piece.style.setProperty("--delay",`${-Math.random()*5}s`);piece.style.setProperty("--drift",`${-100+Math.random()*200}px`);
      if(current.effect==="snow"){piece.textContent=i%4===0?"❄":"●";piece.style.fontSize=`${7+Math.random()*13}px`;}
      if(current.effect==="wind")piece.textContent=i%2?"🍃":"🌸";
      if(current.effect==="autumn")piece.textContent=i%2?"🍂":"🍁";
      if(current.effect==="sun"){piece.textContent="✦";piece.style.fontSize=`${11+Math.random()*15}px`;}
      effects.appendChild(piece);
    }
  }

  function celebrate(){const symbols=["★","●","◆",current.icon];for(let i=0;i<28;i++){const piece=document.createElement("i");piece.textContent=symbols[i%symbols.length];piece.style.left=`${Math.random()*100}%`;piece.style.color=["#ff5b83","#ffc43d","#48a9e6","#8d60db","#34b899"][i%5];piece.style.fontSize=`${15+Math.random()*17}px`;piece.style.setProperty("--duration",`${1.8+Math.random()*1.4}s`);piece.style.setProperty("--delay",`${Math.random()*.4}s`);piece.style.setProperty("--drift",`${-80+Math.random()*160}px`);celebration.appendChild(piece);}}
  function preloadCurrent(){["none","first","second","complete"].forEach(state=>{const img=new Image();img.src=stateAsset(state);});}
  function showFeedback(message){clearTimeout(feedbackTimer);feedback.textContent=message;feedback.classList.add("show");feedbackTimer=setTimeout(hideFeedback,1900);}
  function hideFeedback(){feedback.classList.remove("show");}

  function startDrag(event){if(event.button!==undefined&&event.button!==0)return;const card=event.currentTarget;if(card.classList.contains("used"))return;if(drag)cleanupDrag();clearSelection();drag={id:card.dataset.id,card,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};try{card.setPointerCapture?.(event.pointerId);}catch(_){/* Global listeners still finish the drag. */}}
  function moveDrag(event){if(!drag||drag.pointerId!==event.pointerId)return;if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>9){drag.moved=true;drag.card.classList.add("selected");dragGhost.innerHTML=`<img src="${drag.card.querySelector("img").src}" alt="">`;dragGhost.classList.add("active");child.classList.add("is-target");}if(drag.moved){event.preventDefault();dragGhost.style.left=`${event.clientX}px`;dragGhost.style.top=`${event.clientY}px`;}}
  function endDrag(event){if(!drag||drag.pointerId!==event.pointerId)return;const currentDrag=drag;cleanupDrag();if(currentDrag.moved){suppressClickUntil=Date.now()+250;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest(".child-target");if(target)tryItem(currentDrag.id);}}
  function cancelDrag(event){if(!drag||(event&&drag.pointerId!==event.pointerId))return;cleanupDrag();}
  function cleanupDrag(){if(!drag)return;const currentDrag=drag;drag=null;try{if(currentDrag.card.hasPointerCapture?.(currentDrag.pointerId))currentDrag.card.releasePointerCapture(currentDrag.pointerId);}catch(_){/* The pointer may already be released. */}currentDrag.card.classList.remove("selected");dragGhost.classList.remove("active");child.classList.remove("is-target");}

  function ensureAudio(){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return null;if(!audioContext)audioContext=new AudioCtx();if(audioContext.state==="suspended")audioContext.resume();return audioContext;}
  function playTone(freq,duration=.2,volume=.055){const ctx=ensureAudio();if(!ctx)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type="sine";osc.frequency.value=freq;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.02);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+duration+.03);}
  function playWrong(){playTone(190,.12,.035);setTimeout(()=>playTone(150,.14,.03),110);}
  function playFanfare(){[523,659,784].forEach((freq,i)=>setTimeout(()=>playTone(freq,.34,.06),i*130));}

  window.addEventListener("pointermove",moveDrag,{passive:false});window.addEventListener("pointerup",endDrag);window.addEventListener("pointercancel",cancelDrag);
  nextButton.addEventListener("click",nextWeather);resetButton.addEventListener("click",resetWeather);current=drawWeather();startWeather(current);
})();
