// A single optional speaker; stale network responses never play over new cues.
export class Voice {
  constructor() { this.cache = new Map(); this.token = 0; this.enabled = true; this.welcomed = false; }
  init() {
    if (this.ctx?.state !== 'closed' && this.ctx) return this.ctx;
    try { this.ctx = window.parent.gameSpeechContext?.('symmetry_draw'); } catch {}
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && Audio) this.ctx = new Audio();
    return this.ctx;
  }
  async unlock() {
    try { const ctx = this.init(); if (ctx?.state === 'suspended') await ctx.resume(); this.welcome(); } catch {}
  }
  welcome() {
    if (!this.welcomed && this.enabled && this.init()?.state === 'running') {
      this.welcomed = true; void this.say('welcome');
    }
  }
  stop() { this.token++; try { this.source?.stop(); } catch {} this.source = null; }
  async say(id) {
    this.stop();
    if (!this.enabled || document.hidden) return;
    const ctx = this.init(), token = this.token;
    if (!ctx || ctx.state !== 'running') return;
    try {
      if (!this.cache.has(id)) {
        const request = (async () => {
          const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
          try {
            const response = await fetch(`audio/sd1_${id}.mp3?v=20261016sym1`, { signal: controller.signal });
            if (!response.ok) throw new Error('Voice unavailable');
            return await ctx.decodeAudioData(await response.arrayBuffer());
          } finally { clearTimeout(timer); }
        })().catch(error => { this.cache.delete(id); throw error; });
        this.cache.set(id, request);
      }
      const buffer = await this.cache.get(id);
      if (token !== this.token || !this.enabled || document.hidden || ctx.state !== 'running') return;
      const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination);
      this.source = source; source.onended = () => { source.disconnect(); if (this.source === source) this.source = null; };
      source.start();
    } catch { /* Drawing and saving remain available without sound. */ }
  }
}
