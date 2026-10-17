export class RockStrikeSound {
 constructor(app){this.app=app;this.sources=new Set();this.last=-1;}
 hit(){
  const app=this.app;if(!app.voice.enabled||app.hidden||app.destroyed)return;
  try{
   const c=app.voice.context(),now=c.currentTime;if(c.state!=='running'||now-this.last<.055)return;this.last=now;
   if(this.sources.size>=6)this.stop();
   const pitch=1100+Math.random()*260;
   for(const [frequency,volume,length] of [[pitch,.035,.14],[pitch*1.53,.013,.085]]){
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency;
    g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+.003);g.gain.exponentialRampToValueAtTime(.0001,now+length);
    o.connect(g);g.connect(c.destination);this.track(o,()=>g.disconnect());o.start(now);o.stop(now+length+.015);
   }
   const b=c.createBuffer(1,Math.floor(c.sampleRate*.045),c.sampleRate),data=b.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.028*(1-i/data.length)**3;
   const source=c.createBufferSource();source.buffer=b;source.connect(c.destination);this.track(source);source.start(now);
  }catch{}
 }
 track(source,cleanup=()=>{}){this.sources.add(source);this.app.sounds.add(source);source.onended=()=>{this.sources.delete(source);this.app.sounds.delete(source);source.disconnect();cleanup();};}
 stop(){for(const s of this.sources){try{s.stop();}catch{}}this.sources.clear();}
}
