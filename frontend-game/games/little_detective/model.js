import {CASES} from './cases.js?v=20261003kite1';
export function shuffled(values,random=Math.random){
 const result=[...values];for(let n=result.length-1;n>0;n--){const i=Math.min(n,Math.max(0,Math.floor(random()*(n+1))));[result[n],result[i]]=[result[i],result[n]];}return result;
}
export class DetectiveSession{
 constructor(random=Math.random){this.random=random;this.round=0;this.order=shuffled(CASES.map(c=>c.id),this.random);this.index=0;this.solved=new Set();this.attempts=0;this.optionOrder=[];this.begin();}
 get current(){return CASES.find(c=>c.id===this.order[this.index]);}
 get complete(){return this.index>=this.order.length;}
 get isSolved(){return !this.complete&&this.solved.has(this.current.id);}
 begin(){if(!this.complete)this.optionOrder=shuffled(this.current.options.map(o=>o.id),this.random);}
 choose(id){
  if(this.complete||this.isSolved)return {ignored:true};
  const option=this.current.options.find(o=>o.id===id);if(!option)return {ignored:true};
  this.attempts++;const correct=id===this.current.correct;if(correct)this.solved.add(this.current.id);
  return {ignored:false,correct,option,caseId:this.current.id};
 }
 next(){if(!this.isSolved)return false;this.index++;this.begin();return true;}
 restart(){
  const previous=this.order.at(-1);this.round++;this.order=shuffled(CASES.map(c=>c.id),this.random);
  if(this.order[0]===previous)[this.order[0],this.order[1]]=[this.order[1],this.order[0]];
  this.index=0;this.solved.clear();this.attempts=0;this.begin();
 }
}

// A small shuffled bag per pictured candidate keeps repeated mistakes conversational.
export class WrongReplyBag{
 constructor(random=Math.random){this.random=random;this.bags=new Map();this.last=new Map();}
 next(kind){
  let bag=this.bags.get(kind);
  if(!bag?.length){bag=shuffled([0,1,2,3],this.random);if(bag.at(-1)===this.last.get(kind))[bag[0],bag[3]]=[bag[3],bag[0]];this.bags.set(kind,bag);}
  const variant=bag.pop();this.last.set(kind,variant);return 'ld_wrong_'+kind+'_'+variant;
 }
}
