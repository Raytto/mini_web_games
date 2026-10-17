// Quiet, unpitched soil/brush friction. One noise voice per gesture, never a chime.
const profiles = [
  {highpass:260, lowpass:2200, gain:.085}, // small shovel: dry, slightly coarse soil
  {highpass:600, lowpass:3600, gain:.065}, // soft brush: lighter sand
  {highpass:850, lowpass:4200, gain:.045}  // fine brush: a very soft dust hiss
];
export class DigScrubSound {
  constructor(app) { this.app=app; this.voice=null; this.buffer=null; this.context=null; this.timer=null; }
  stroke(layer) {
    const app=this.app;
    if (!app.voice.enabled || app.hidden || app.destroyed) { this.stop(); return; }
    try {
      const ctx=app.voice.context();
      if(ctx.state!=='running')return;
      const profile=profiles[Math.min(2,Math.max(0,layer))];
      if(this.voice && (this.voice.layer!==layer || this.context!==ctx))this.stop();
      if(!this.voice){
        if(!this.buffer || this.context!==ctx){
          this.context=ctx;this.buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
          const data=this.buffer.getChannelData(0);let soft=0;
          for(let i=0;i<data.length;i++){
            // Smoothed noise with an irregular grain envelope; no tonal oscillator.
            soft=.55*soft+.45*(Math.random()*2-1);
            const grain=.7+.2*Math.sin(i/ctx.sampleRate*37)+.1*Math.sin(i/ctx.sampleRate*83);
            const edge=Math.min(1,i/(ctx.sampleRate*.02),(data.length-1-i)/(ctx.sampleRate*.02));
            data[i]=soft*grain*edge;
          }
        }
        const source=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),gain=ctx.createGain();
        source.buffer=this.buffer;source.loop=true;
        hp.type='highpass';hp.frequency.value=profile.highpass;hp.Q.value=.5;
        lp.type='lowpass';lp.frequency.value=profile.lowpass;lp.Q.value=.5;
        gain.gain.value=0;source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(ctx.destination);
        const voice={source,hp,lp,gain,layer};this.voice=voice;app.sounds.add(source);
        source.onended=()=>{app.sounds.delete(source);source.disconnect();hp.disconnect();lp.disconnect();gain.disconnect();if(this.voice===voice)this.voice=null;};
        source.start(ctx.currentTime,Math.random());
      }
      const now=ctx.currentTime,param=this.voice.gain.gain;
      this.hold(param,now);
      param.linearRampToValueAtTime(profile.gain,now+.035);
      param.setValueAtTime(profile.gain,now+.12);
      param.linearRampToValueAtTime(0,now+.25);
      clearTimeout(this.timer);this.timer=setTimeout(()=>this.stop(),270);
    } catch { this.stop(); } // Missing audio never blocks excavation.
  }
  hold(param,now) {
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
    else {const value=param.value;param.cancelScheduledValues(now);param.setValueAtTime(value,now);}
  }
  stop() {
    clearTimeout(this.timer);this.timer=null;
    const voice=this.voice;this.voice=null;
    if(!voice)return;
    try {
      const now=voice.source.context.currentTime;
      this.hold(voice.gain.gain,now);voice.gain.gain.linearRampToValueAtTime(0,now+.035);
      voice.source.stop(now+.045);
    } catch { this.app.sounds.delete(voice.source); }
  }
}
