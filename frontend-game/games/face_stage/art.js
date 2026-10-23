/* Original vector costumes. One shared camera projection, clipped separately into
   each face hole: never duplicate the entire camera image into every face. */
(() => {
'use strict';
const W=1200,H=1000,ink='#35554c';
const scenes=[
 {id:'sunflower',zh:'花心里的我',en:'Little Sunflower',n:1,kinds:['sunflower'],bg:'#d9eee1',prompt:['你就是花心，笑得像太阳！','A smile as sunny as a sunflower!'],effect:'bee'},
 {id:'moon',zh:'月亮快递员',en:'Moon Mail',n:1,kinds:['astronaut'],bg:'#303c61',prompt:['张大嘴巴，发现一颗新星星！','Oh! A brand-new star!'],effect:'stars'},
 {id:'lion',zh:'小狮子剧场',en:'The Little Lion',n:1,kinds:['lion'],bg:'#f5dfc4',prompt:['鼓起脸颊，来一声无声的吼！','Puff your cheeks. A silent roar!'],effect:'confetti'},
 {id:'pandas',zh:'熊猫野餐日',en:'Panda Picnic',n:2,kinds:['panda','panda'],bg:'#e1edcc',prompt:['大熊猫和小熊猫，一起眯眼笑。','Big panda, little panda. Happy eyes!'],effect:'leaves'},
 {id:'flowers',zh:'两朵花开啦',en:'Two Little Blooms',n:2,kinds:['sunflower','daisy'],bg:'#e1f0e8',prompt:['一朵大花一朵小花，谁笑得更灿烂？','Two flowers. Two lovely smiles!'],effect:'bee'},
 {id:'balloon',zh:'小熊云朵旅行',en:'Bears in the Air',n:2,kinds:['bear','bear'],bg:'#f5e1c6',prompt:['亲亲脸颊，坐气球去云朵家！','Cheek to cheek, up in the clouds!'],effect:'clouds'},
 {id:'penguins',zh:'企鹅冰上舞会',en:'Penguin Party',n:2,kinds:['penguin','penguin'],bg:'#dbedf0',prompt:['歪歪头，我们是摇摆企鹅！','Tilt your heads. Waddle together!'],effect:'snow'},
 {id:'submarine',zh:'海底泡泡一家',en:'Bubble Submarine',n:3,kinds:['porthole','porthole','porthole'],bg:'#bfdedb',prompt:['三张惊讶脸，发现大鲸鱼！','Three surprised faces. A whale!'],effect:'bubbles'},
 {id:'dino',zh:'恐龙观光列车',en:'Dino Express',n:3,kinds:['dino','dino','dino'],bg:'#e7ebd0',prompt:['大恐龙小恐龙，一起鼓鼓腮帮！','All aboard, little dinosaurs!'],effect:'steam'},
 {id:'band',zh:'森林蘑菇乐队',en:'Mushroom Band',n:3,kinds:['mushroom','mushroom','mushroom'],bg:'#e4e8dc',prompt:['张嘴唱、闭嘴笑，一家人的音乐会。','Sing a silly song together!'],effect:'notes'}
];
function ellipse(c,x,y,rx,ry,fill,stroke=null,w=5){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
function path(c,points,fill,stroke=null,w=5,close=true){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()}}
function round(c,x,y,w,h,r,fill,stroke=null,lw=5){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function line(c,p,color=ink,w=5){path(c,p,null,color,w,false)}
function star(c,x,y,r,color,n=5){const p=[];for(let i=0;i<n*2;i++){let a=-Math.PI/2+i*Math.PI/n,q=i%2?r*.46:r;p.push([x+Math.cos(a)*q,y+Math.sin(a)*q])}path(c,p,color)}
function leaf(c,x,y,s,col,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-s,-s*.8,-s,-s*1.6,0,-s*2);c.bezierCurveTo(s,-s*1.6,s,-s*.8,0,0);c.fillStyle=col;c.fill();line(c,[[0,-8],[0,-s*1.7]],'#fff6',3);c.restore()}
function cloud(c,x,y,s,col='#fffaf0'){ellipse(c,x,y,90*s,24*s,col);ellipse(c,x-35*s,y-15*s,37*s,32*s,col);ellipse(c,x+20*s,y-24*s,45*s,43*s,col)}
function smile(c,x,y,r=20,color=ink){c.strokeStyle=color;c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(x,y,r,0.15,Math.PI-.15);c.stroke()}
function tinyFlower(c,x,y,s=1,col='#e59a83'){for(let a=0;a<6;a++)ellipse(c,x+Math.cos(a*Math.PI/3)*15*s,y+Math.sin(a*Math.PI/3)*15*s,12*s,12*s,col);ellipse(c,x,y,9*s,9*s,'#f7c665')}
function hill(c,y,col){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(280,y-90,510,y+120,760,y-5);c.bezierCurveTo(990,y-110,1070,y+30,W,y-30);c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fillStyle=col;c.fill()}
function bamboo(c,x,y,h){for(let j=0;j<4;j++){round(c,x,y-j*h/4,17,h/4-4,6,'#7f9d74');leaf(c,x+9,y-j*h/4+15,26,'#74966a',j%2?1.2:-1.2)}}
function fish(c,x,y,s=1,col='#efb35b'){c.save();c.translate(x,y);c.scale(s,s);path(c,[[-30,0],[-62,-26],[-62,26]],col);ellipse(c,0,0,47,27,col);ellipse(c,21,-7,4,5,ink);line(c,[[-9,-17],[-19,0],[-9,17]],'#fff7',4);c.restore()}
function bunting(c,y){line(c,[[80,y],[600,y+32],[1120,y]],ink,4);const cols=['#d6816f','#eab653','#6c9c88','#8ca7bc'];for(let i=0;i<11;i++){let x=100+i*96,z=y+Math.sin(i/10*Math.PI)*30;path(c,[[x,z],[x+65,z+6],[x+30,z+66]],cols[i%4])}}
function background(c,s,t=0){
 c.fillStyle=s.bg;c.fillRect(0,0,W,H);c.lineCap='round';c.lineJoin='round';
 if(['sunflower','flowers'].includes(s.id)){
  ellipse(c,1040,150,73,73,'#f5c765');for(let a=0;a<12;a++){let q=a*Math.PI/6;line(c,[[1040+Math.cos(q)*86,150+Math.sin(q)*86],[1040+Math.cos(q)*103,150+Math.sin(q)*103]],'#ecc06a',5)}
  cloud(c,190,180,1);cloud(c,820,250,.6);hill(c,695,'#b5d0a0');hill(c,805,'#9fbd8c');
  for(let i=0;i<12;i++){let x=30+i*105;round(c,x,680,30,160,12,'#f6f4df');}round(c,0,725,1200,22,8,'#fff7e4');
  for(let i=0;i<17;i++){let x=(i*163+30)%W,y=850+(i%3)*32;tinyFlower(c,x,y,.55,['#fff1cf','#edb1a1','#f5d386'][i%3]);}
  if(s.id==='flowers'){c.strokeStyle='#c99792';c.lineWidth=20;c.beginPath();c.arc(400,345,260,Math.PI,Math.PI*2);c.stroke();c.strokeStyle='#ecc774';c.beginPath();c.arc(400,345,236,Math.PI,Math.PI*2);c.stroke();c.strokeStyle='#87b6ad';c.beginPath();c.arc(400,345,212,Math.PI,Math.PI*2);c.stroke();cloud(c,150,330,.8);round(c,965,730,130,110,20,'#7bafa9',ink,4);ellipse(c,1098,760,30,40,null,ink,8);path(c,[[970,750],[890,710],[870,730],[965,800]],'#7bafa9',ink,4);}
 }else if(s.id==='moon'){
  for(let i=0;i<44;i++){const x=(i*197+41)%W,y=(i*79+32)%700;star(c,x,y,4+(i%4)*3,['#fff0c2','#a4b8c8','#e3b9ac'][i%3])}
  ellipse(c,200,210,90,90,'#a7c6bb');path(c,[[136,175],[180,143],[202,165],[195,200],[227,230],[190,270],[162,241]],'#6d9d97');
  hill(c,745,'#bab7c5');hill(c,830,'#d5ccd0');for(let i=0;i<6;i++)ellipse(c,90+i*220,895-(i%2)*68,65,19,'#aaa6b5');
  c.save();c.translate(970,620);c.rotate(.13);path(c,[[-65,90],[-65,-75],[0,-160],[65,-75],[65,90]],'#f6e7cd',ink,5);path(c,[[-65,20],[-115,100],[-65,90]],'#da8c7e');path(c,[[65,20],[115,100],[65,90]],'#da8c7e');ellipse(c,0,-45,32,40,'#7ea9b0',ink);line(c,[[-40,75],[40,75]],'#cf8c7a',12);c.restore();
  line(c,[[230,800],[230,540]],'#f8efda',9);path(c,[[235,545],[378,580],[235,625]],'#e2a890');star(c,280,582,17,'#fff4ce');
 }else if(s.id==='lion'){
  for(let i=0;i<12;i++){c.fillStyle=i%2?'#f5dfc4':'#f9ead6';c.fillRect(i*100,0,100,790)}
  c.fillStyle='#75a69a';c.fillRect(0,780,W,220);for(let i=0;i<12;i++)line(c,[[i*110,780],[i*110-40,1000]],'#67988e',3);
  path(c,[[0,0],[280,0],[225,120],[162,240],[100,360],[0,420]],'#bd7266');path(c,[[1200,0],[920,0],[975,120],[1038,240],[1100,360],[1200,420]],'#bd7266');
  for(let i=0;i<3;i++){line(c,[[30+i*50,20],[20+i*35,280]],'#a65e59',7);line(c,[[1170-i*50,20],[1180-i*35,280]],'#a65e59',7)}bunting(c,130);
  round(c,380,820,440,65,16,'#edb257',ink,5);for(let i=0;i<6;i++)path(c,[[400+i*65,825],[430+i*65,880],[460+i*65,825]],'#f7dec0');
  ellipse(c,200,770,65,65,'#e7a08a',ink);line(c,[[160,730],[240,810]],'#fff1d4',13);star(c,1000,740,57,'#efd16f');
 }else if(s.id==='pandas'){
  hill(c,670,'#c1d4a7');hill(c,790,'#abc696');bamboo(c,80,650,470);bamboo(c,155,680,570);bamboo(c,1050,660,500);bamboo(c,1130,700,620);cloud(c,580,175,1.4);
  path(c,[[205,790],[910,790],[1050,955],[105,955]],'#f4e1c1');for(let i=0;i<8;i++)line(c,[[210+i*94,795],[120+i*122,950]],'#d99f8c',17);for(let i=0;i<4;i++)line(c,[[183-i*25,818+i*37],[933+i*27,818+i*37]],'#d99f8c',14);
  ellipse(c,600,868,87,26,'#fff9df',ink,3);ellipse(c,581,854,20,21,'#dd8970');ellipse(c,620,855,20,21,'#edb953');leaf(c,580,838,8,'#729770',.5);
  round(c,962,825,130,91,15,'#bd9667',ink,4);ellipse(c,1027,817,45,32,null,ink,6);line(c,[[980,848],[1080,848]],'#efd2a3',8);
 }else if(s.id==='balloon'){
  for(let i=0;i<6;i++)cloud(c,(i*257+95)%W,120+i*120,.7+(i%3)*.3,'#fff3dd');hill(c,865,'#c6d1be');hill(c,920,'#a9bfb2');
  ellipse(c,600,80,440,210,'#d48677');ellipse(c,600,80,315,210,'#e9b85d');ellipse(c,600,80,150,210,'#f5d8ac');
  line(c,[[260,195],[360,710]],ink,9);line(c,[[940,195],[840,710]],ink,9);line(c,[[420,270],[455,715]],'#c09b77',6);line(c,[[780,270],[745,715]],'#c09b77',6);
 }else if(s.id==='penguins'){
  path(c,[[0,590],[130,260],[310,590],[530,315],[730,590],[960,210],[1200,590]],'#b8d7dc');path(c,[[66,420],[130,260],[213,418],[151,380],[110,420]],'#fff9e8');path(c,[[882,355],[960,210],[1053,355],[988,325],[944,365]],'#fff9e8');hill(c,690,'#eef5ea');hill(c,805,'#c3dee2');
  ellipse(c,610,840,440,120,'#a8cdd5');ellipse(c,610,835,370,80,null,'#daeff0',5);line(c,[[160,850],[250,837]],'#e8f4f0',7);line(c,[[860,885],[1010,870]],'#e8f4f0',7);
  for(let i=0;i<6;i++){let x=70+i*212,y=130+(i%3)*100;star(c,x,y,16,'#fefaf0',6)}
 }else if(s.id==='submarine'){
  hill(c,755,'#90bdb9');hill(c,875,'#75aaa7');for(let i=0;i<7;i++){let x=i*190+30;leaf(c,x,975,70,'#5e9692',.1);leaf(c,x+10,980,50,'#79a99a',-.65)}
  c.save();c.translate(970,180);ellipse(c,0,0,130,62,'#6eaaac');path(c,[[95,0],[178,-50],[170,40]],'#6eaaac');ellipse(c,-65,-8,5,6,ink);path(c,[[-20,45],[20,90],[25,40]],'#568f97');c.restore();fish(c,170,180,.7,'#e6b366');fish(c,260,240,.45,'#dc8d78');
  round(c,135,315,930,460,210,'#e8bc61',ink,8);round(c,490,235,220,100,30,'#d99d57',ink,6);line(c,[[600,236],[600,175],[690,175]],ink,36);line(c,[[600,236],[600,175],[690,175]],'#e3ad57',23);ellipse(c,110,565,36,90,'#cf9658',ink);round(c,1010,500,100,130,15,'#d69d59',ink);path(c,[[1110,565],[1160,500],[1160,630]],'#d69d59',ink);
  for(let i=0;i<15;i++)ellipse(c,235+i*53,736,4,4,'#a77a43');
 }else if(s.id==='dino'){
  cloud(c,210,160,1);cloud(c,880,185,1.2);hill(c,650,'#c4cba2');path(c,[[630,665],[840,250],[1060,665]],'#abb591');path(c,[[782,365],[840,250],[902,370],[855,345],[828,385]],'#f6eacb');hill(c,800,'#a5bd8b');
  for(let i=0;i<2;i++){let x=i?1100:90;line(c,[[x,790],[x,400]],'#9b8e64',24);for(let j=0;j<5;j++)leaf(c,x,405,72,'#719b79',(j-2)*.7)}
  line(c,[[0,927],[1200,927]],'#807e68',11);line(c,[[0,972],[1200,972]],'#807e68',9);for(let i=0;i<15;i++)line(c,[[i*88,918],[i*88+24,981]],'#b09c77',12);
 }else if(s.id==='band'){
  for(let i=0;i<6;i++){let x=i*245-40;round(c,x,0,55,820,15,'#b0bb9e');ellipse(c,x+20,130,140,200,'#c0ccb1');leaf(c,x+15,360,55,'#9eb49a',.5)}hill(c,780,'#b2c39f');hill(c,885,'#92af92');bunting(c,140);
  for(let i=0;i<8;i++)tinyFlower(c,50+i*160,875+(i%2)*25,.65,'#eac8a0');
  ellipse(c,610,890,520,58,'#758e76');round(c,125,875,950,60,15,'#aa8a65',ink,4);for(let i=0;i<9;i++)line(c,[[165+i*106,878],[155+i*106,930]],'#d8b58b',4);
 }
}
function costume(c,kind,index=0,t=0){
 const coat=['#72a798','#de9f80','#e1b358'][index%3];
 if(kind==='sunflower'||kind==='daisy'){
  line(c,[[0,90],[0,390]],'#658c58',23);leaf(c,-5,270,86,'#7da66f',-1);leaf(c,5,335,74,'#85ad78',1.05);
  path(c,[[-105,340],[105,340],[77,452],[-77,452]],'#ca8f6a',ink,4);round(c,-116,330,232,36,11,'#d8a27b',ink,4);line(c,[[-69,392],[68,392]],'#edc09b',8);
  const petals=kind==='daisy'?12:10,col=kind==='daisy'?'#a8c8d0':'#efbf56';
  for(let a=0;a<petals;a++){c.save();c.rotate(a*Math.PI*2/petals);ellipse(c,0,-139,kind==='daisy'?32:45,79,col,kind==='daisy'?'#779fa8':'#c79a43',3);c.restore()}
  ellipse(c,0,0,118,132,kind==='daisy'?'#f4d58b':'#d9a85d',ink,5);
 }else if(kind==='astronaut'){
  round(c,-108,100,216,210,56,'#eee7d7',ink,6);round(c,-145,95,44,148,16,'#c8bdb2',ink,5);round(c,101,95,44,148,16,'#c8bdb2',ink,5);
  line(c,[[-80,145],[-173,192],[-193,120]],'#efe7d7',43);ellipse(c,-190,108,26,31,'#d8987e',ink,4);line(c,[[80,145],[177,165],[192,123]],'#efe7d7',43);ellipse(c,191,108,26,31,'#d8987e',ink,4);
  round(c,-95,282,72,90,20,'#f0e6d0',ink,5);round(c,23,282,72,90,20,'#f0e6d0',ink,5);round(c,-60,150,120,91,17,'#9bbcb7',ink,4);ellipse(c,-25,180,11,11,'#dd9c7e');line(c,[[5,180],[35,180]],'#f3e7cc',7);line(c,[[-30,215],[30,215]],'#5b827d',5);
  ellipse(c,0,0,148,155,'#f1e7d2',ink,7);ellipse(c,0,0,116,132,'#89a9ad',ink,6);ellipse(c,-141,10,18,45,'#dc9d82',ink,5);ellipse(c,141,10,18,45,'#dc9d82',ink,5);
 }else if(kind==='panda'||kind==='bear'){
  const fur=kind==='panda'?'#f4efdf':'#c9996e',dark=kind==='panda'?'#405654':'#99744f';
  ellipse(c,0,213,116,140,fur,ink,5);ellipse(c,-82,318,58,38,dark,ink,4);ellipse(c,82,318,58,38,dark,ink,4);
  c.save();c.translate(-108,155);c.rotate(-.55-Math.sin(t)*.04);ellipse(c,0,0,40,78,dark,ink,4);c.restore();c.save();c.translate(108,155);c.rotate(.55+Math.sin(t)*.04);ellipse(c,0,0,40,78,dark,ink,4);c.restore();
  if(kind==='bear'){ellipse(c,0,224,72,94,'#e6c19a');round(c,-85,95,170,40,12,index?'#8eacb6':'#c67862');path(c,[[45,118],[67,185],[101,170],[84,115]],index?'#8eacb6':'#c67862')}
  ellipse(c,-104,-111,47,48,dark,ink,5);ellipse(c,104,-111,47,48,dark,ink,5);ellipse(c,-104,-111,25,27,kind==='panda'?'#6d7a71':'#d5b08c');ellipse(c,104,-111,25,27,kind==='panda'?'#6d7a71':'#d5b08c');ellipse(c,0,0,142,144,fur,ink,6);ellipse(c,0,0,111,129,kind==='panda'?'#637571':'#dfb78c');
 }else if(kind==='penguin'){
  ellipse(c,0,190,132,164,'#4e6b71',ink,6);ellipse(c,0,204,94,128,'#f7ecd4');ellipse(c,-80,336,62,29,'#e4ae58',ink,4);ellipse(c,80,336,62,29,'#e4ae58',ink,4);
  c.save();c.rotate(-.5);ellipse(c,-158,135,32,112,'#4e6b71',ink,5);c.restore();c.save();c.rotate(.5);ellipse(c,158,135,32,112,'#4e6b71',ink,5);c.restore();
  ellipse(c,0,0,143,151,'#4e6b71',ink,6);ellipse(c,0,0,115,132,'#f8edd7');round(c,-118,113,236,32,12,index?'#dfb756':'#ce887e');path(c,[[70,130],[115,214],[65,222],[38,135]],index?'#dfb756':'#ce887e');
  round(c,-100,-155,200,40,15,'#89a69b',ink,4);ellipse(c,0,-158,83,50,'#89a69b');ellipse(c,0,-207,20,20,'#f4dfb2');
 }else if(kind==='lion'){
  ellipse(c,0,220,115,142,'#e8b866',ink,5);ellipse(c,0,224,72,99,'#f4d79f');ellipse(c,-80,341,58,35,'#e8b866',ink,4);ellipse(c,80,341,58,35,'#e8b866',ink,4);
  line(c,[[97,285],[181,275],[209,205]],'#dda45b',19);ellipse(c,211,191,30,42,'#aa7151');ellipse(c,-118,177,40,72,'#e8b866',ink,5);ellipse(c,118,177,40,72,'#e8b866',ink,5);
  for(let i=0;i<12;i++){c.save();c.rotate(i*Math.PI/6);ellipse(c,0,-135,49,73,i%2?'#b67952':'#c38b57',ink,3);c.restore()}
  ellipse(c,0,0,123,136,'#f2ca83',ink,5);path(c,[[-55,-154],[-68,-210],[-19,-182],[0,-225],[24,-182],[68,-210],[55,-154]],'#efc15e',ink,4);star(c,0,-184,13,'#fff5d6');
 }else if(kind==='porthole'){
  ellipse(c,0,0,138,154,'#b97e46',ink,6);ellipse(c,0,0,122,139,'#f0d8a0',ink,4);ellipse(c,0,0,108,124,'#527e7e');
  for(let i=0;i<10;i++){let a=i*Math.PI/5;ellipse(c,Math.cos(a)*129,Math.sin(a)*145,4.5,4.5,ink)}
 }else if(kind==='dino'){
  ellipse(c,0,215,113,137,coat,ink,5);ellipse(c,0,225,71,96,'#f2deaf');ellipse(c,-90,185,42,63,coat,ink,4);ellipse(c,90,185,42,63,coat,ink,4);
  path(c,[[92,246],[185,246],[211,205],[227,277],[178,316],[83,309]],coat,ink,5);
  for(let i=0;i<3;i++)path(c,[[147+i*24,259],[162+i*24,231-i*5],[177+i*24,266]],'#d2a75b',ink,3);
  ellipse(c,0,0,142,153,coat,ink,6);for(let i=-1;i<=1;i++)path(c,[[i*53-25,-134],[i*53,-191+Math.abs(i)*13],[i*53+27,-134]],'#e8bd66',ink,4);
  ellipse(c,0,0,113,131,'#e9ddb2');ellipse(c,-111,-45,12,15,'#d8cb99');ellipse(c,111,-45,12,15,'#d8cb99');
 }else if(kind==='mushroom'){
  ellipse(c,0,220,102,135,'#eadac0',ink,5);ellipse(c,-65,339,43,27,'#7b9180',ink,4);ellipse(c,65,339,43,27,'#7b9180',ink,4);line(c,[[-89,170],[-155,231]],'#e6d4b7',34);line(c,[[89,170],[155,231]],'#e6d4b7',34);
  round(c,-90,-107,180,231,70,'#f0e3ca',ink,5);ellipse(c,0,0,112,129,'#e9d3ae');
  c.beginPath();c.moveTo(-180,-87);c.bezierCurveTo(-165,-270,160,-270,180,-87);c.quadraticCurveTo(0,-28,-180,-87);c.fillStyle=['#bc7565','#d1aa57','#849e97'][index];c.fill();c.strokeStyle=ink;c.lineWidth=5;c.stroke();
  [[-85,-127,27],[-15,-190,23],[82,-130,32],[110,-180,13]].forEach(([x,y,r])=>ellipse(c,x,y,r,r*.8,'#f3e6cb'));
  if(index===0){ellipse(c,0,250,100,48,'#d69b6f',ink,5);round(c,-99,247,198,62,5,'#c88965',ink,5);ellipse(c,0,246,100,39,'#f2dab2',ink,5);line(c,[[-105,208],[-20,249]],ink,8);line(c,[[105,208],[20,249]],ink,8)}
  else if(index===1){ellipse(c,28,255,70,94,'#d8aa5b',ink,5);ellipse(c,28,250,23,27,'#6f725e');round(c,8,130,40,112,10,'#9e855e',ink,4);for(let j=0;j<3;j++)line(c,[[20+j*9,150],[20+j*9,314]],'#f4d89f',2)}
  else{line(c,[[-60,230],[115,197]],'#b5975a',23);ellipse(c,130,192,37,26,'#dbb86f',ink,4);line(c,[[-80,240],[-80,310]],ink,8)}
 }
}
function positions(s){
 if(s.n===1)return[{x:600,y:370,s:1.25,base:1.25}];
 if(s.n===2)return[{x:365,y:380,s:1.08,base:1.08},{x:835,y:520,s:.86,base:.86}];
 if(s.id==='submarine')return[{x:315,y:480,s:1.03,base:1.03},{x:600,y:560,s:.82,base:.82},{x:885,y:480,s:1.03,base:1.03}];
 return[{x:270,y:380,s:.96,base:.96},{x:600,y:505,s:.79,base:.79},{x:930,y:380,s:.96,base:.96}];
}
function camera(c,video,zoom=1){
 if(!video||video.readyState<2||!video.videoWidth)return false;
 const vw=video.videoWidth,vh=video.videoHeight,scale=Math.max(W/vw,H/vh)*zoom,sw=vw*scale,sh=vh*scale;
 c.save();c.translate(W,0);c.scale(-1,1);c.drawImage(video,(W-sw)/2,(H-sh)/2,sw,sh);c.restore();return true;
}
function placeholder(c,p,i){c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);ellipse(c,0,0,100,116,'#f2dec4');ellipse(c,-34,-14,7,10,ink);ellipse(c,34,-14,7,10,ink);ellipse(c,-60,17,16,9,'#e9b0a0');ellipse(c,60,17,16,9,'#e9b0a0');smile(c,0,22,31);c.fillStyle='#906f52';c.font='bold 15px system-ui';c.textAlign='center';c.fillText('YOU'+(i?` ${i+1}`:''),0,87);c.restore()}
function foreground(c,s){
 if(s.id==='balloon'){path(c,[[245,750],[955,750],[905,950],[295,950]],'#b48b60',ink,6);round(c,226,729,748,50,18,'#cfaa78',ink,5);for(let i=0;i<10;i++)line(c,[[284+i*68,790],[308+i*62,937]],'#e2bd86',5);for(let i=0;i<4;i++)line(c,[[275+i*8,806+i*37],[926-i*8,806+i*37]],'#946f4b',5);round(c,500,806,200,75,24,'#f0d2a1');star(c,600,844,23,'#b78155');}
 if(s.id==='dino'){for(let i=0;i<3;i++){let x=112+i*336;round(c,x,765,304,132,19,['#749e8c','#d8a26d','#7f9eab'][i],ink,5);round(c,x-8,750,320,35,10,'#ebd0a2',ink,5);for(let j=0;j<2;j++){ellipse(c,x+65+j*168,892,36,36,'#49675d',ink,5);ellipse(c,x+65+j*168,892,15,15,'#d4bb8c')}if(i<2)line(c,[[x+306,845],[x+335,845]],ink,10);star(c,x+152,829,26,'#f5dcaa')}}
}
function effects(c,s,t,pulse){
 if(!pulse)return;
 const u=1-pulse;
 for(let i=0;i<12;i++){let x=(i*143+80+u*110)%W,y=740-u*630+(i%4)*45;
  if(s.effect==='bubbles'){ellipse(c,x,y,17+i%4*8,'#eef9ef50','#f3fff2',3)}
  else if(s.effect==='snow'){star(c,x,y,10,'#fffdf5',6)}
  else if(s.effect==='leaves'){leaf(c,x,y,14,'#72965b',i+u*4)}
  else if(s.effect==='notes'){c.fillStyle=['#e5b255','#c78574','#648e83'][i%3];c.font='bold 52px serif';c.fillText(i%2?'♪':'♫',x,y)}
  else if(s.effect==='clouds'||s.effect==='steam')cloud(c,x,y,.2,'#fff7e8');
  else if(s.effect==='bee'){
   if(i>3)continue;let bx=200+i*260+Math.sin(u*9+i)*80,by=220+u*460;ellipse(c,bx-7,by-17,13,17,'#fff9e2');ellipse(c,bx+10,by-17,13,17,'#fff9e2');ellipse(c,bx,by,23,14,'#ebbb57',ink,3);line(c,[[bx,by-12],[bx,by+12]],ink,6);ellipse(c,bx+14,by-3,3,3,ink)
  }else{c.save();c.translate(x,y);c.rotate(i+u*5);star(c,0,0,11+i%3*5,['#d99683','#edc36b','#84b4ac'][i%3]);c.restore()}
 }
}
function render(c,s,poses,opts={}){
 c.save();c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);background(c,s,opts.t);
 for(let i=0;i<poses.length;i++){let p=poses[i];c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);costume(c,s.kinds[i],i,opts.t||0);c.restore()}
 if(opts.adjust&&opts.video){c.save();c.globalAlpha=.5;camera(c,opts.video,opts.zoom);c.restore()}
 poses.forEach((p,i)=>{c.save();c.beginPath();c.ellipse(p.x,p.y,100*p.s,116*p.s,0,0,Math.PI*2);c.clip();if(!camera(c,opts.video,opts.zoom))placeholder(c,p,i);c.restore();ellipse(c,p.x,p.y,100*p.s,116*p.s,null,'#fff7df',4);
  if(opts.adjust){c.save();c.setLineDash([12,8]);ellipse(c,p.x,p.y,109*p.s,125*p.s,null,opts.selected===i?'#cf653f':'#ffffff',6);c.setLineDash([]);round(c,p.x-22,p.y-151*p.s,44,36,13,opts.selected===i?'#cf653f':'#365a51');c.fillStyle='#fff';c.font='bold 22px system-ui';c.textAlign='center';c.fillText(i+1,p.x,p.y-151*p.s+26);c.restore()}
 });
 foreground(c,s);effects(c,s,opts.t||0,opts.pulse||0);
 if(opts.photo){round(c,330,944,540,38,19,s.id==='moon'?'#f3e5cc':'#fff7e7');c.fillStyle=ink;c.font='bold 17px system-ui';c.textAlign='center';c.fillText('FACE STAGE  ·  '+s.en.toUpperCase(),600,970)}
 c.restore();
}
window.FaceArt={W,H,scenes,positions,render};
})();
