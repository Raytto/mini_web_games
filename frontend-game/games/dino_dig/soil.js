// A brush removes only the material under its actual path. Each stratum owns
// a separate surface and coverage map; the layer gate lives in the game.
export const SURFACE={x:48,y:70,w:624,h:420};
export class SoilLayer{
 constructor(texture,strength){
  this.strength=strength;this.canvas=document.createElement('canvas');this.canvas.width=720;this.canvas.height=600;
  this.ctx=this.canvas.getContext('2d');this.cols=48;this.rows=32;this.cells=new Float32Array(this.cols*this.rows);
  const c=this.ctx,s=SURFACE;c.save();c.beginPath();c.roundRect(s.x,s.y,s.w,s.h,27);c.clip();c.drawImage(texture,s.x,s.y,s.w,s.h);c.restore();
  this.brush=document.createElement('canvas');this.brush.width=152;this.brush.height=152;const b=this.brush.getContext('2d');
  const g=b.createRadialGradient(76,76,44,76,76,76);g.addColorStop(0,'rgba(0,0,0,'+strength+')');g.addColorStop(1,'rgba(0,0,0,0)');b.fillStyle=g;b.fillRect(0,0,152,152);
 }
 stamp(x,y){
  const s=SURFACE;if(x<s.x-30||x>s.x+s.w+30||y<s.y-30||y>s.y+s.h+30)return false;
  this.ctx.save();this.ctx.globalCompositeOperation='destination-out';this.ctx.drawImage(this.brush,x-76,y-76);this.ctx.restore();
  let change=0;
  for(let row=0;row<this.rows;row++)for(let col=0;col<this.cols;col++){
   const dx=s.x+(col+.5)*s.w/this.cols-x,dy=s.y+(row+.5)*s.h/this.rows-y,d=Math.hypot(dx,dy);
   if(d>=76)continue;const i=row*this.cols+col,amount=this.strength*Math.min(1,(76-d)/32),old=this.cells[i];
   const next=1-(1-old)*(1-amount);
   // Alpha is displayed in 8-bit steps. Count an invisible remainder as clear
   // so a complete sweep can reach exactly 100%, rather than approach it forever.
   this.cells[i]=next>=1-1/255?1:next;change+=this.cells[i]-old;
  }
  return change>.005;
 }
 get coverage(){return this.cells.reduce((a,b)=>a+b,0)/this.cells.length;}
 // Progress uses the central 83% x 81% play patch. Held gestures must
 // clear every cell; only a real release may qualify for residual assistance.
 get centralCoverage(){let sum=0,n=0;for(let r=3;r<29;r++)for(let c=4;c<44;c++){sum+=this.cells[r*this.cols+c];n++;}return sum/n;}
 get complete(){return this.centralCoverage===1;}
 clear(){this.ctx.clearRect(0,0,720,600);this.cells.fill(1);}
 hint(){
  // Sample broad patches so hints choose substantial remaining material.
  let best=null,bestWeight=-1;
  for(let row=5;row<29;row+=5)for(let col=6;col<44;col+=6){
   let weight=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)weight+=1-this.cells[(row+dy)*this.cols+col+dx];
   if(weight>bestWeight){bestWeight=weight;best={x:SURFACE.x+(col+.5)*SURFACE.w/this.cols,y:SURFACE.y+(row+.5)*SURFACE.h/this.rows};}
  }
  return best||{x:360,y:280};
 }
}
