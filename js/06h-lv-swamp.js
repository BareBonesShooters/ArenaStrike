"use strict";
// Level 6 · Toxic Bog: a sickly swamp under a green sky. Stilt huts, dead mangroves, toxic barrels and glowing pools.
// Monsters are bog mutants whose hits poison you. Boss: Mother Mire, who calls up acid geysers under your feet.
LV.reg({
id:"swamp",n:"Toxic Bog",tag:"Don't breathe the air",mod:"blight",pack:2,
theme:{sky:[0x2c3316,0x4a5a2a,0xa8b43a],cloud:.4,cc:[.7,.8,.5],stars:0,sun:{c:0xd8e060,i:.45,d:[.6,.25,.5]},hemi:[0x7aa050,0x2a2c18,.7],fog:[0x4a5a30,18,100],
gr:{base:"#2e3320",v:["#2a2e1a","#363a20","#33301c","#2a3a22"],path:"#4a4228",edge:"#262a18",plaza:"#4a4630"},roads:false,
wall:0x3a3a26,trim:0x2a2a18,house:[0x4a3a22,0x3e3020,0x5a4628],roof:[0x3a3a22,0x4a4428],leaf:[0x4a6a2a],trunk:0x3a3024,mount:[0x2e3a24,0x3a4a2e],win:0xd8ff40,lamp:0xc8ff40,night:.4,
motes:[0xd8ff50,.18,.8,6,.06]},
// ground: dark mud, muddy water, algae streaks, glowing toxic pools and reed clumps
paint(g,N,k,rng){
for(let i=0;i<40;i++){const x=rng()*N,y=rng()*N,rx=(1.5+rng()*2.5)*k,ry=(1+rng()*1.5)*k;g.fillStyle="rgba(14,20,10,.5)";g.beginPath();g.ellipse(x,y,rx,ry,rng()*3,0,6.283);g.fill()}
for(let i=0;i<60;i++){const x=rng()*N,y=rng()*N,w=(1+rng())*k,h=(1.5+rng())*k;g.fillStyle=rng()<.5?"rgba(70,56,30,.45)":"rgba(48,40,22,.5)";g.fillRect(x-w/2,y-h/2,w,h)}
g.lineCap="round";
for(let i=0;i<22;i++){let x=rng()*N,y=rng()*N;const a=rng()*6.283;g.strokeStyle=rng()<.5?"rgba(120,160,40,.35)":"rgba(90,130,30,.3)";g.lineWidth=(.5+rng()*.6)*k;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=Math.cos(a+(rng()-.5)*.6)*2*k;y+=Math.sin(a+(rng()-.5)*.6)*2*k;g.lineTo(x,y)}g.stroke()}
for(let i=0;i<14;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*5)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(170,255,60,.45)");q.addColorStop(.6,"rgba(120,220,40,.18)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
for(let i=0;i<50;i++){const x=rng()*N,y=rng()*N,n=3+Math.floor(rng()*3);for(let j=0;j<n;j++){g.strokeStyle=rng()<.5?"rgba(110,130,50,.7)":"rgba(140,150,70,.6)";g.lineWidth=.35*k;g.beginPath();g.moveTo(x+j*.35*k,y);g.lineTo(x+j*.35*k+(rng()-.5)*.4*k,y-(1.2+rng()*.8)*k);g.stroke()}}
},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const wood=[0x4a3a26,0x3e3020,0x56432c],bark=0x3a3024,water=0x1a2412;
// lean a vertical piece toward direction d by th radians: returns [rx,rz] for P
const tilt=(d,th)=>[Math.sin(d)*th,-Math.cos(d)*th];
// hanging moss strands from a point
const hang=(x,y,z,n,L)=>{for(let i=0;i<n;i++){const l=L*rr(.6,1);P("box",x+rr(-.4,.4),y-l/2,z+rr(-.4,.4),.05,l,.05,0x2e4a22,0,.6)}};
// dead mangrove: twisted trunk on arching roots, branches with hanging moss
const mangrove=(x,z)=>{if(!free(x,z,2.2))return false;reg(x,z,.9,.9,3.4,1);const h=rr(5,7);
for(let s=0;s<4;s++)P("cyl",x+rr(-.25,.25),s*h/4+h/8,z+rr(-.2,.2),.7-s*.1,h/4+.2,.7-s*.1,bark,rng()*3,.6,null,rr(-.06,.06),rr(-.06,.06));
for(let i=0;i<6;i++){const a=i/6*6.283+rr(-.2,.2),L=rr(2.4,2.8),[rx,rz]=tilt(a+PI,1.1);P("cyl",x+Math.cos(a)*1.1,.55,z+Math.sin(a)*1.1,.2,L,.2,bark,0,.6,null,rx,rz)}
for(let i=0;i<4;i++){const a=rng()*6.283,l=rr(1.8,2.4),y=h*rr(.7,.95),[rx,rz]=tilt(a,1.2);P("box",x+Math.cos(a)*l*.5,y+.2,z+Math.sin(a)*l*.5,.16,l,.16,bark,0,.6,null,rx,rz);hang(x+Math.cos(a)*l,y-.2,z+Math.sin(a)*l,3,rr(1.2,2))}
return true};
// stilt hut: a plank hut on a deck 2 m up, reached by three steps, with a thatched cone roof
const stilt=(x,z,rot)=>{const W=3.6,D=3.2;if(!free(x,z,4.6))return false;
const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
reg(x,z,rot&1?D:W,rot&1?W:D,2,0);
for(const [a,b] of[[-W/2+.3,-D/2+.3],[W/2-.3,-D/2+.3],[-W/2+.3,D/2-.3],[W/2-.3,D/2-.3],[0,-D/2+.3],[0,D/2-.3]]){const q=L(a,b);P("cyl",q[0],1,q[1],.34,2,.34,wood[1],0,.6)}
const dk=L(0,0);P("box",dk[0],1.95,dk[1],W,.2,D,wood[0],ry,.8);
for(let j=0;j<3;j++){const q=L(0,D/2+.45+j*.9),h=1.5-j*.5;blk(q[0],q[1],rot&1?.9:W*.45,h,rot&1?W*.45:.9,wood[2],.6)}
const bk=L(0,-D/2+.1);P("box",bk[0],3.1,bk[1],W,2.2,.18,wood[2],ry,.7);
for(const s of[-1,1]){const q=L(s*(W/2-.1),0);P("box",q[0],3.1,q[1],.18,2.2,D,wood[2],ry,.7)}
for(let i=0;i<4;i++){const q=L(0,-D/2+.22);P("box",q[0],2.3+i*.55,q[1],W+.02,.05,.2,wood[1],ry,.8)}
const rf=L(0,0);P("cone",rf[0],4.9,rf[1],5.4,1.6,5.4,pick([0x9a8a46,0x7a6a34]),0,.6);
return true};
// toxic waste barrel: yellow drum with a glowing green lid; some lie tipped over
const barrel=(x,z,tip)=>{if(!free(x,z,.8))return false;const ry=rng()*3;
if(tip){P("cyl",x,.45,z,.9,1.1,.9,0xd8c028,ry,.6,null,0,PI/2);P("cyl",x-.56*Math.cos(ry),.45,z+.56*Math.sin(ry),.8,.04,.8,0x9dff3a,ry,1,null,0,PI/2);return true}
reg(x,z,.9,.9,1.1);P("cyl",x,.55,z,.9,1.1,.9,0xd8c028,0,.6);P("cyl",x,.4,z,.94,.14,.94,0x2a2a10,0,1);P("cyl",x,.8,z,.94,.14,.94,0x2a2a10,0,1);P("cyl",x,1.12,z,.8,.04,.8,0x9dff3a,0,1,glow);return true};
// toxic pool: flat glowing disc on dark water; bubbling pools get a pulsing ring (animated below)
const bubs=[];
const pool=(x,z,r,bub)=>{if(!free(x,z,r+.6))return false;
P("cyl",x,.02,z,r*2.3,.03,r*2.3,water,0,1);P("cyl",x,.05,z,r*2,.05,r*2,0x9dff3a,0,1,glow);P("cyl",x,.07,z,r*1.1,.04,r*1.1,0xd8ff60,0,1,glow);
if(bub){c.halo(x,.4,z,0x9dff40,r*2.4,.4);const m=new T.Mesh(new T.RingGeometry(.35,.5,14),new T.MeshBasicMaterial({color:0xc8ff60,transparent:true,opacity:.6,depthWrite:false,fog:false}));m.rotation.x=-PI/2;m.position.set(x,.09,z);c.add(m);bubs.push({m,ph:rng()*6.28})}
return true};
// giant mushroom: thick pale stem, spotted dome cap; some caps glow purple
const mushroom=(x,z)=>{if(!free(x,z,1.4))return false;const h=rr(1.8,3),r=rr(.9,1.4),pur=rng()<.35,cap=pur?0xa050e0:pick([0xb8483a,0xc0a040,0x9a3a6a]),sp=pur?0xf0d8ff:0xf4f0d0;
reg(x,z,.7,.7,h,1);P("cyl",x,h/2,z,.6,h,.6,0xe8dcc0,0,.6);P("sph",x,h,z,r*2,r*.9,r*2,cap,0,.6,pur?glow:null);
for(let i=0;i<5;i++){const a=rng()*6.283,dd=rr(.2,.6);P("sph",x+Math.cos(a)*dd*r,h+.45*r*Math.sqrt(1-dd*dd),z+Math.sin(a)*dd*r,.22,.12,.22,sp,0,1,pur?glow:null)}
return true};
// cattail and reed cluster
const reeds=(x,z)=>{if(!free(x,z,1))return false;for(let i=0;i<7;i++){const cx=x+rr(-.8,.8),cz=z+rr(-.8,.8),h=rr(1.4,2.4);P("cyl",cx,h/2,cz,.07,h,.07,pick([0x6a8a3a,0x7a8a46,0x5a7a34]),0,.6);if(i%2===0)P("cyl",cx,h-.25,cz,.14,.5,.14,0x4a2a1a,0,.8)}return true};
// rotting boardwalk planks lying on the mud
const planks=(x,z,ry)=>{if(!free(x,z,2))return false;const dx=Math.cos(ry),dz=-Math.sin(ry);for(let i=0;i<7;i++){if(rng()<.2)continue;const q=i*.55-1.6;P("box",x+dx*q,.06,z+dz*q,1.1,.08,.42,pick([0x5a4630,0x4a3a26,0x6a5a3a]),ry+rr(-.08,.08),.8)}return true};
// sunken rowboat, half under the water
const rowboat=(x,z)=>{if(!free(x,z,2.6))return false;const ry=rng()*6.283;
P("cyl",x,.02,z,4.2,.03,2.6,water,ry,1);P("box",x,.02,z,3.2,.5,1.3,0x4a3620,ry,.9,null,rr(-.1,.1),.12);P("box",x,.3,z,2.8,.06,1,0x6a5030,ry,.9);return true};
// landmark: a rotten giant stump hut outside the walls, glowing windows, a crooked roof and a green light
const a0=rng()*6.283,R=c.H+12,lx=Math.cos(a0)*R,lz=Math.sin(a0)*R,di=a0+PI;
P("cyl",lx,4,lz,7,8,7,0x3a2a1a,0,.7);
for(let i=0;i<7;i++){const a=i/7*6.283+rr(-.2,.2),[rx,rz]=tilt(a+PI,1.2);P("cyl",lx+Math.cos(a)*4.6,.6,lz+Math.sin(a)*4.6,1.1,3.2,1.1,0x3a2a1a,0,.7,null,rx,rz)}
P("cyl",lx,8.05,lz,6.6,.12,6.6,0x2a1e12,0,1);P("cyl",lx,8.1,lz,5.4,.04,5.4,0x9dff3a,0,1,glow);
P("cone",lx+.5,10.1,lz,6.2,4,6.2,0x221a14,0,.7,null,.12,-.1);
for(let t=-1;t<=1;t++){const wx=lx+Math.cos(di)*3.45-Math.sin(di)*t*1.6,wz=lz+Math.sin(di)*3.45+Math.cos(di)*t*1.6;P("box",wx,4.6,wz,.9,1.3,.15,0x9dff3a,PI/2-di,1,glow)}
P("box",lx+Math.cos(di)*3.5,1.2,lz+Math.sin(di)*3.5,1.2,2.2,.2,0x0a0a06,PI/2-di,1);
c.halo(lx+Math.cos(di)*3.4,4.6,lz+Math.sin(di)*3.4,0x9dff3a,3,.6);
c.light(lx+Math.cos(di)*6,5,lz+Math.sin(di)*6,0x9dff40,1.1,22);
// dead cypress silhouettes outside the walls
for(let i=0;i<26;i++){const a=i/26*6.283+rng()*.1,r=c.H+8+rng()*14,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rr(8,13);P("cyl",x,h/2,z,.5,h,.5,bark,0,.5,null,rr(-.1,.1),rr(-.1,.1));P("box",x+.6,h*.7,z,1.6,.2,.2,bark,rng()*3,.5,null,0,.3)}
// low ground mist
for(let i=0;i<8;i++)c.halo(rr(-35,35),.6,rr(-35,35),0x8a9a60,rr(7,11),.18);
// ---- placement
place(c.pc(4),(x,z,r)=>stilt(x,z,r),8);
place(c.pc(8),mangrove,6);
place(3,(x,z)=>pool(x,z,rr(2.4,3.2),true),10);
c.anim((dt,t)=>{for(const b of bubs){const u=(t*.45+b.ph)%1,s=1+u*2.2;b.m.scale.set(s,s,1);b.m.material.opacity=.6*(1-u)}});
place(c.pc(7),(x,z)=>pool(x,z,rr(2,3.4),false),8);
place(c.pc(10),(x,z)=>barrel(x,z,rng()<.3),6);
place(c.pc(12),mushroom,6);
place(c.pc(10),reeds,6);
place(c.pc(5),(x,z)=>planks(x,z,rng()*6.283),6);
place(c.pc(2),rowboat,8);
},
mon:{names:["Bog Mutant","Leaper","Swamp Hulk","Mudcrawler","Bloater","Acid Spitter","Mire Lurker"],weights:[[0,55],[1,22],[2,12],[3,14],[4,6],[5,8],[6,6]],hp:1,spd:1,dmg:1,trait:"toxic"},
// slimy green-olive skin per type, glowing pustules, hanging moss strands and a wide drooping jaw
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0x5a7a3a,0x6a7a3a,0x4a6a3a,0x7a8a4a,0xc8e8a0,0x6a9a3a,0x5a6a3a];
m[0].color.setHex(o.boss?0x6a8a3a:(SK[k]||SK[0]));m[1].color.setHex(0x1e2412);m[3].color.setHex(0x4a4226);m[4].color.setHex(0x3a3a2a);m[5].color.setHex(0x5a4a22);m[6].color.setHex(0xd8ff50);m[6].emissive.setHex(0x5a8a10);
const moss=new T.MeshLambertMaterial({color:0x2e4a22});m.push(moss);
const pus=new T.MeshBasicMaterial({color:0xd8ff40}),sac=new T.MeshBasicMaterial({color:0x9dff3a,transparent:true,opacity:.8}),eye=new T.MeshBasicMaterial({color:0xd8ff40});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){
if(k===4)add(u.torso,new T.SphereGeometry(.42,8,6),m[0],0,.05,.2);
for(const [x,y,z] of[[-.3,.25,.36],[.22,.1,.36],[.05,-.2,.38],[-.42,.05,.2],[.42,-.1,.2],[-.18,-.05,.4],[.32,.3,.3]])add(u.torso,new T.SphereGeometry(.06,6,4),pus,x,y,z);
for(const x of[-.4,-.2,.25,.45])add(u.torso,new T.BoxGeometry(.05,.3+Math.abs(x)*.5,.05),moss,x,-.4,.3);
if(k===5)for(const [x,y,z,r] of[[-.2,.2,-.42,.2],[.22,.05,-.44,.16],[0,-.25,-.42,.18]])add(u.torso,new T.SphereGeometry(r,8,6),sac,x,y,z);
}
for(const a of u.arms||[]){if(!a)continue;add(a,new T.SphereGeometry(.05,6,4),pus,0,-.3,.12);add(a,new T.SphereGeometry(.05,6,4),pus,0,-.6,.14)}
if(u.head){for(const x of[-.14,.14])add(u.head,new T.SphereGeometry(.065,6,4),eye,x,.06,.31);
add(u.head,new T.BoxGeometry(.5,.12,.36),m[0],0,-.33,.13,.3);
add(u.head,new T.BoxGeometry(.56,.1,.5),moss,0,.3,0,0,.15);
for(const x of[-.25,.25])add(u.head,new T.BoxGeometry(.05,.4,.05),moss,x,.05,-.1)}
if(o.boss){ // Mother Mire: a swollen swamp queen with egg sacs on her back, a mushroom crown and a dripping moss cloak
const egg=new T.MeshLambertMaterial({color:0xc8f0a0});m.push(egg);
const stem=new T.MeshLambertMaterial({color:0xe8dcc0});m.push(stem);
const cap=new T.MeshLambertMaterial({color:0xa050e0});m.push(cap);
if(u.torso){for(const [x,y] of[[-.38,.3],[.38,.3],[-.25,-.1],[.25,-.1],[0,.6],[0,-.4]])add(u.torso,new T.SphereGeometry(.22,8,6),egg,x,y,-.45);
add(u.torso,new T.BoxGeometry(1.2,1,.06),moss,0,-.25,-.38);
for(const x of[-.5,-.25,0,.25,.5])add(u.torso,new T.BoxGeometry(.12,.5,.06),moss,x,-.85,-.38)}
if(u.head){for(let i=0;i<5;i++){const a=i/5*6.283,mx=Math.cos(a)*.22,mz=Math.sin(a)*.22;add(u.head,new T.CylinderGeometry(.03,.035,.14,5),stem,mx,.38,mz);add(u.head,new T.SphereGeometry(.09,6,4),cap,mx,.5,mz).scale.set(1,.6,1)}}
}},
boss:{name:"Mother Mire",scale:2.5,col:0xa8ff40,hp:1,minions:8,minionK:3,attacks:{volley:3,nova:2,slam:1,special:3},
// Acid Geysers: five geysers within 8 m of you plus one right under you; each telegraphs with a ring, then bursts tall
special(e,b){const p=b.player();b.flash("Mother Mire: acid geysers!");b.snd("roar",.7);
const pts=[{x:p.x,z:p.z}];for(let i=0;i<5;i++){const a=b.rnd()*6.283,r=b.rnd()*8;pts.push({x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r})}
pts.forEach((q,i)=>{const x=b.clamp(q.x,-b.H()+2,b.H()-2),z=b.clamp(q.z,-b.H()+2,b.H()-2);b.ring(x,z,1.8,0xa8ff40,1.1);
b.later(e,1100+i*90,()=>{b.snd("boom",.5);b.burst(x,.4,z,0x9dff3a,22,6);b.burst(x,1.8,z,0xc8ff60,12,4);b.burst(x,3.2,z,0x9dff3a,6,2);b.flare(x,1,z,0xa8ff40,3);if(b.near(x,z,1.8)){b.hurt(e.dmg*.6,x,z);b.poison(3)}})})}}
});
