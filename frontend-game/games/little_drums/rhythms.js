export const PARTS = [
 {id:'crash',zh:'吊镲',en:'Crash',sound:'crash',type:'cymbal',color:'#d5ac57',key:'Q',gain:.52},
 {id:'ride',zh:'叮叮镲',en:'Ride',sound:'ride',type:'cymbal',color:'#bca05b',key:'E',gain:.40},
 {id:'tom',zh:'高音通鼓',en:'High tom',sound:'tom',type:'tom',color:'#6b9aa0',key:'W',gain:.77},
 {id:'hat',zh:'踩镲',en:'Hi-hat',sound:'hat',type:'cymbal',color:'#cfad65',key:'A',gain:.40},
 {id:'snare',zh:'军鼓',en:'Snare',sound:'snare',type:'snare',color:'#c98373',key:'S',gain:.83},
 {id:'floor',zh:'落地通鼓',en:'Floor tom',sound:'floor',type:'tom',color:'#809c87',key:'D',gain:.80},
 {id:'kick',zh:'底鼓',en:'Kick',sound:'kick',type:'kick',color:'#5a8c7d',key:'Space',gain:1}
];
const event=(hits,beats=.5)=>({hits:hits.split('+'),beats});
const basics=[
 ['kick+hat','hat','snare+hat','hat','kick+hat','hat','snare+hat','hat'],
 ['kick+hat','hat','snare+hat','hat','kick+hat','kick+hat','snare+hat','hat']
];
const fills=[
 ['kick+hat','hat','snare+hat','hat','snare','tom','floor','floor'],
 ['kick+ride','ride','snare+ride','ride','snare','snare','tom','tom','floor','floor','kick+snare','kick+snare']
];
export const RHYTHMS=[
 {id:'steady',zh:'咚次打次',en:'Boom, tss, tah, tss',tagZh:'轻松入门',tagEn:'A steady start',bpm:88},
 {id:'double',zh:'咚次打次 · 咚咚打次',en:'The double-kick groove',tagZh:'多一个咚',tagEn:'One extra boom',bpm:94}
].map((r,index)=>{
 const events=[];
 for(let bar=0;bar<3;bar++)basics[index].forEach((hits,i)=>events.push({...event(hits),bar,slot:i/2,fill:false}));
 let slot=0;fills[index].forEach((hits,i)=>{const beats=index===1&&i>=4?.25:.5;events.push({...event(hits,beats),bar:3,slot,fill:true});slot+=beats;});
 events.push({...event('kick+crash',1),bar:4,slot:0,fill:false,ending:true});
 return {...r,events};
});
const ids=new Set(PARTS.map(p=>p.id));
for(const rhythm of RHYTHMS){
 for(let bar=0;bar<4;bar++)if(rhythm.events.filter(e=>e.bar===bar).reduce((a,e)=>a+e.beats,0)!==4)throw Error('Invalid four-beat bar');
 if(rhythm.events.some(e=>e.hits.length>2||e.hits.some(h=>!ids.has(h))))throw Error('Unplayable rhythm');
}
