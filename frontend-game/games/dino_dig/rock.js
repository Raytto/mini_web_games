import {SURFACE} from './soil.js?v=20261014dig10';
// Clip a convex polygon to the side of the bisector nearest one rock seed.
function clip(poly,nx,ny,limit){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=a.x*nx+a.y*ny-limit,db=b.x*nx+b.y*ny-limit;
  if(da<=1e-7)out.push(a);
  if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
 }
 return out;
}
export function rockPieces(random=Math.random){
 const s=SURFACE,seeds=[];
 for(let r=0;r<3;r++)for(let c=0;c<6;c++)seeds.push({x:s.x+(c+.5+(random()-.5)*.55)*s.w/6,y:s.y+(r+.5+(random()-.5)*.55)*s.h/3});
 return seeds.map((a,id)=>{
  let polygon=[{x:s.x,y:s.y},{x:s.x+s.w,y:s.y},{x:s.x+s.w,y:s.y+s.h},{x:s.x,y:s.y+s.h}];
  for(const b of seeds)if(a!==b)polygon=clip(polygon,b.x-a.x,b.y-a.y,(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2);
  let twiceArea=0,cx=0,cy=0;
  for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],cross=p.x*q.y-q.x*p.y;twiceArea+=cross;cx+=(p.x+q.x)*cross;cy+=(p.y+q.y)*cross;}
  return {id,polygon,area:Math.abs(twiceArea)/2,center:{x:cx/(3*twiceArea),y:cy/(3*twiceArea)},removed:false,tint:random()*.08};
 });
}
function contains(poly,x,y){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
const path=(ctx,points)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
export class RockLayer {
 constructor(texture,random=Math.random){
  this.texture=texture;this.pieces=rockPieces(random);this.canvas=document.createElement('canvas');this.canvas.width=720;this.canvas.height=600;this.ctx=this.canvas.getContext('2d');this.lastPiece=null;this.render();
 }
 render(){
  const c=this.ctx,s=SURFACE;c.clearRect(0,0,720,600);c.save();c.beginPath();c.roundRect(s.x,s.y,s.w,s.h,27);c.clip();
  for(const p of this.pieces)if(!p.removed){
   c.save();path(c,p.polygon);c.clip();c.drawImage(this.texture,s.x,s.y,s.w,s.h);
   c.fillStyle=`rgba(83,66,45,${p.tint})`;c.fillRect(s.x,s.y,s.w,s.h);
   // A broad dark cut and a fine lit rim make a thin, chipped stone crust.
   path(c,p.polygon);c.strokeStyle='#514a40';c.lineWidth=4;c.stroke();
   c.translate(1.2,1.2);path(c,p.polygon);c.strokeStyle='#f4e6ca';c.lineWidth=1.8;c.stroke();c.restore();
  }
  c.restore();
 }
 stamp(x,y){
  const p=this.pieces.find(p=>contains(p.polygon,x,y));
  if(!p||p.removed)return false;
  p.removed=true;this.lastPiece=p;this.render();return true;
 }
 get coverage(){return this.pieces.reduce((sum,p)=>sum+(p.removed?p.area:0),0)/(SURFACE.w*SURFACE.h);}
 get centralCoverage(){return this.complete?1:this.coverage;}
 get complete(){return this.pieces.every(p=>p.removed);}
 clear(){this.pieces.forEach(p=>p.removed=true);this.ctx.clearRect(0,0,720,600);}
 hint(){return this.pieces.filter(p=>!p.removed).sort((a,b)=>b.area-a.area)[0]?.center||{x:360,y:280};}
}
