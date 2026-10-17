import {ui,icons} from './core.js?v=20261017warm1';
import {itemArt} from './catalog.js?v=20260924e2';

// Six large choices at a time. Every item remains directly reachable in five pages.
export class Library {
 constructor(game,items,labels,onChoose){
  this.game=game;game.library=this;this.items=items;this.labels=labels;this.onChoose=onChoose;this.page=0;this.picked=new Set();this.selected=null;
  this.bar=document.createElement('div');this.bar.className='collection-bar';this.bar.innerHTML=`<button id="choose-library" class="collection-button">${ui(labels.zh+' · 30',labels.en+' · 30')}</button><span id="current-choice" lang="en"></span>`;
  document.getElementById('progress').after(this.bar);
  this.overlay=document.createElement('div');this.overlay.className='overlay library-overlay';this.overlay.id='choice-library';this.overlay.hidden=true;this.overlay.setAttribute('role','dialog');this.overlay.setAttribute('aria-modal','true');this.overlay.setAttribute('aria-labelledby','library-title');
  this.overlay.innerHTML=`<section class="panel library-panel"><h2 id="library-title">${ui(labels.zh,labels.en)}</h2><p>${ui('每页 6 个，一共有 30 个。点一个就能玩。','30 choices, six at a time. Pick one to play.')}</p><div class="library-grid"></div><div class="library-pager"><button id="previous-choices" class="quiet" data-aria-zh="上一页" data-aria-en="Previous choices">←</button><span id="library-page" aria-live="polite"></span><button id="next-choices" class="quiet" data-aria-zh="下一页" data-aria-en="Next choices">→</button></div><div class="library-actions"><button id="surprise-choice" class="primary">${ui('帮我选一个','Surprise me')}</button><button id="keep-choice" class="quiet" hidden>${ui('继续玩这个','Keep this choice')}</button></div></section>`;
  document.body.append(this.overlay);
  this.bar.querySelector('button').onclick=()=>{if(game.started)this.open();};
  this.overlay.querySelector('#previous-choices').onclick=()=>this.showPage(this.page-1);
  this.overlay.querySelector('#next-choices').onclick=()=>this.showPage(this.page+1);
  this.overlay.querySelector('#surprise-choice').onclick=()=>this.choose(this.next());
  this.overlay.querySelector('#keep-choice').onclick=()=>this.choose(this.selected);
  this.overlay.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&this.selected){event.preventDefault();this.choose(this.selected);}
   if(event.key==='Tab'){const all=[...this.overlay.querySelectorAll('button:not(:disabled):not([hidden])')];const first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
 }
 next(){let available=this.items.filter(x=>!this.picked.has(x.id));if(!available.length){this.picked.clear();available=this.items.filter(x=>x.id!==this.selected?.id);}return available[Math.floor(Math.random()*available.length)];}
 open(){this.game.cancel();this.overlay.hidden=false;this.overlay.querySelector('#keep-choice').hidden=!this.selected;this.showPage(this.page);this.overlay.querySelector('.library-item').focus({preventScroll:true});this.onOpen?.();}
 showPage(page){this.page=Math.max(0,Math.min(4,page));this.overlay.querySelector('#library-page').textContent=`${this.page+1} / 5`;this.overlay.querySelector('#previous-choices').disabled=this.page===0;this.overlay.querySelector('#next-choices').disabled=this.page===4;
  const grid=this.overlay.querySelector('.library-grid');grid.innerHTML=this.items.slice(this.page*6,this.page*6+6).map(x=>`<button class="library-item ${x.id===this.selected?.id?'chosen':''}" data-choice="${x.id}" aria-label="${x.word}">${itemArt(x)}<strong lang="en">${x.word}</strong><span class="gloss">${x.zh}</span></button>`).join('');
  grid.querySelectorAll('button').forEach(button=>button.onclick=()=>this.choose(this.items.find(x=>x.id===button.dataset.choice)));this.game.localize();
 }
 choose(item){if(!item)return;this.game.cancel();this.selected=item;this.picked.add(item.id);this.overlay.hidden=true;this.bar.querySelector('#current-choice').textContent=item.word;this.game.stage.dataset.choice=item.id;this.game.word(item.word,item.zh);this.onChoose(item);document.getElementById('replay').focus({preventScroll:true});}
 advance(){this.choose(this.next());}
}
