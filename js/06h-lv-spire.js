"use strict";
// Level 4 · Iron Spire: a night-time machine city on a steel tower. Lattice towers, server racks, cargo containers and a needle spire.
// Monsters are rogue robots with glowing visors. Boss: Overseer Mk-IV, which fires an orbital laser along a line.
LV.reg({
id:"spire",n:"Iron Spire",tag:"The machines have taken the tower",mod:"surge",pack:1,
theme:{sky:[0x060a18,0x1c3248,0x2fb8c0],cloud:.1,cc:[.35,.5,.6],stars:1,night:1,sun:{c:0xcfe8ff,i:.5,d:[-.4,.8,.3]},hemi:[0x4a6a90,0x1a1e26,.45],fog:[0x101c2a,30,150],
gr:{base:"#2a3038",v:["#262c34","#30363e","#23282f","#2e343b"],path:"#3a4048",edge:"#1c5a66",plaza:"#343a44"},roads:false,
wall:0x3a4250,trim:0x00e0ff,house:[0x4a525e,0x5a6470,0x3c4450],roof:[0x2a303a,0x3a4048],leaf:[0x1a2a30],trunk:0x2a2a2a,mount:[0x1a2030,0x222a3a],win:0x40ffd0,lamp:0x7af0ff,
motes:[0x7ff8ff,.1,.9,8,.1]},
// dark plates: square grid, rivets, hazard-stripe bands, glowing cyan circuit traces and landing pads with H marks
paint(g,N,k,rng){
g.strokeStyle="rgba(8,10,14,.7)";g.lineWidth=Math.max(1,.1*k);
for(let x=0;x<=N;x+=2*k){g.beginPath();g.moveTo(x,0);g.lineTo(x,N);g.stroke();g.beginPath();g.moveTo(0,x);g.lineTo(N,x);g.stroke()}
g.fillStyle="rgba(150,160,172,.45)";
for(let x=0;x<N;x+=2*k)for(let y=0;y<N;y+=2*k){if(rng()<.5)continue;g.beginPath();g.arc(x+.5*k,y+.5*k,.12*k,0,6.283);g.fill();g.beginPath();g.arc(x+1.5*k,y+1.5*k,.12*k,0,6.283);g.fill()}
for(let b=0;b<3;b++){const y0=rng()*N,h=(1.2+rng()*.6)*k;g.save();g.beginPath();g.rect(0,y0,N,h);g.clip();
g.fillStyle="#1a1a1a";g.fillRect(0,y0,N,h);g.fillStyle="rgba(242,194,0,.85)";
for(let x=-h;x<N+h;x+=2*k){g.beginPath();g.moveTo(x,y0+h);g.lineTo(x+k,y0+h);g.lineTo(x+k+h,y0);g.lineTo(x+h,y0);g.closePath();g.fill()}g.restore()}
g.strokeStyle="rgba(0,240,255,.6)";g.lineWidth=Math.max(1,.12*k);g.shadowColor="#00f0ff";g.shadowBlur=.5*k;
for(let t=0;t<16;t++){let x=rng()*N,y=rng()*N,hz=rng()<.5;g.beginPath();g.moveTo(x,y);
for(let s=0;s<5;s++){const l=(2+rng()*6)*k*(rng()<.5?-1:1);if(hz)x+=l;else y+=l;g.lineTo(x,y);hz=!hz}g.stroke();
g.fillStyle="rgba(120,255,255,.9)";g.beginPath();g.arc(x,y,.22*k,0,6.283);g.fill()}
g.shadowBlur=0;
for(let p=0;p<3;p++){const x=rng()*N,y=rng()*N,R=3*k;g.strokeStyle="rgba(255,220,60,.8)";g.lineWidth=Math.max(1.5,.25*k);g.beginPath();g.arc(x,y,R,0,6.283);g.stroke();
g.fillStyle="rgba(255,255,255,.7)";g.font="bold "+Math.round(2.4*k)+"px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("H",x,y+.1*k)}},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const STEEL=0x5a646e,DARK=0x3a424c,ORG=0xe07020,WHT=0xdfe6ee,CY=0x40f0ff,GRN=0x40ff90,RED=0xff2030;
const pyl=[],bec=[];
// steel lattice tower, 10-16 m, red blinking beacon on top; collision on the footprint
const tower=(x,z)=>{if(!free(x,z,1.8))return false;const hh=rr(10,16);reg(x,z,1.5,1.5,hh);
for(const sx of[-1,1])for(const sz of[-1,1])P("box",x+sx*.7,hh/2,z+sz*.7,.14,hh,.14,STEEL,0,.8);
for(let j=0;j*2+1<hh;j++){const y=j*2+1;
for(const s of[-1,1]){P("box",x,y,z+s*.7,1.5,.1,.1,STEEL,0,.9);P("box",x+s*.7,y,z,.1,.1,1.5,STEEL,0,.9)}
P("box",x,y+1,z+.7,.08,2.3,.08,STEEL,0,.9,null,0,j%2?.9:-.9);P("box",x+.7,y+1,z,.08,2.3,.08,STEEL,0,.9,null,j%2?-.9:.9,0)}
P("ico",x,hh+.3,z,.3,.3,.3,RED,0,1,glow);bec.push([c.halo(x,hh+.3,z,0xff2030,3.2,.7),rr(0,6)]);
return true};
// radio antenna mast with a dish and a light on top
const mast=(x,z)=>{if(!free(x,z,1.2))return false;reg(x,z,.8,.8,9);P("cyl",x,4.5,z,.14,9,.14,DARK,0,.9);P("box",x,8,z,1.6,.08,.08,DARK,0,.9);
P("sph",x+.3,7.2,z,1.8,.5,1.8,WHT,0,.6,null,0,.5);P("ico",x,9.2,z,.22,.22,.22,RED,0,1,glow);return true};
// server rack: solid cabinet with rows of glowing green and cyan lights on the front
const rack=(x,z)=>{if(!free(x,z,1.5))return false;const w=rr(1.8,2.2),d=1.2,h=2.6;blk(x,z,w,h,d,0x20262e,.6);
P("box",x,h+.05,z,w+.1,.1,d+.1,DARK,0,.7);
for(let r=0;r<6;r++)for(let q=0;q<2;q++)P("box",x+(q-.5)*w*.45,.35+r*.38,z+d/2+.02,.22,.12,.03,pick([GRN,CY]),0,1,glow);
return true};
// corrugated cargo container: solid main box with thin vertical ribs on both long faces
const container=(x,z,rot)=>{const L=rr(5,6),W=2.4,H=2.6,ax=rot&1,w=ax?W:L,d=ax?L:W;if(!free(x,z,Math.max(w,d)/2+.8))return false;
const col=pick([0x3a6fa8,0xb84a2a,0x3d8a4a,0xc9a030,0x7a3a8a]),dk=lerpC(col,0x000000,.25);
blk(x,z,w,H,d,col,.6);
const n=Math.floor(L/.5);
for(let i=0;i<=n;i++){const t=-.5+i/n;
for(const s of[-1,1]){if(ax)P("box",x+s*(W/2+.03),H/2,z+t*(L-.4),.05,H*.9,.1,dk,0,.8);else P("box",x+t*(L-.4),H/2,z+s*(W/2+.03),.1,H*.9,.05,dk,0,.8)}}
return true};
// coolant tank: banded cylinder with a dome and side pipes
const tank=(x,z)=>{if(!free(x,z,2))return false;const r=rr(1.1,1.5),h=rr(3,4.5);reg(x,z,r*2,r*2,h,1);
P("cyl",x,h/2,z,r*2,h,r*2,WHT,0,.6);
P("cyl",x,h*.3,z,r*2+.2,.2,r*2+.2,ORG,0,.8);P("cyl",x,h*.7,z,r*2+.2,.2,r*2+.2,ORG,0,.8);
P("sph",x,h,z,r*2,r*.7,r*2,WHT,0,.6);
for(let i=0;i<2;i++){const a=i*PI+.6;P("cyl",x+Math.cos(a)*(r+.4),h*.35,z+Math.sin(a)*(r+.4),.2,h*.7,.2,STEEL,0,.8)}
return true};
// power pylon with glowing insulators; cyan cable arcs are drawn between neighbours afterwards
const pylon=(x,z)=>{if(!free(x,z,.8))return false;reg(x,z,.6,.6,6);P("box",x,3,z,.22,6,.22,STEEL,0,.8);P("box",x,5.8,z,2.6,.14,.14,STEEL,0,.8);
for(const s of[-1,1])P("ico",x+s*1.2,5.9,z,.2,.2,.2,CY,0,1,glow);
pyl.push([x,z]);return true};
// hazard barrier: yellow block with black stripes on top
const barrier=(x,z,rot)=>{const len=rr(3,4.5),ax=rot&1,w=ax?1:len,d=ax?len:1;if(!free(x,z,len/2+.6))return false;
blk(x,z,w,.9,d,0xf2c200,.7);
const n=Math.round(len/.5);for(let i=1;i<n;i+=2){const t=-len/2+(i+.5)*len/n;P("box",x+(ax?0:t),.915,z+(ax?t:0),ax?1.02:.3,.02,ax?.3:1.02,0x141414,0,1)}
return true};
// maintenance catwalk: solid steel deck with railings, reached by a stepped ramp of solid blocks
const catwalk=(x,z)=>{const w=rr(4,6),d=rr(3,4);if(!free(x,z,Math.max(w,d)/2+3))return false;
blk(x,z,w,2.5,d,DARK,.6);
P("box",x,3,z+d/2,w,1,.08,STEEL,0,.9);P("box",x,3,z-d/2,w,1,.08,STEEL,0,.9);
P("box",x+w/2,3,z,.08,1,d,STEEL,0,.9);P("box",x-w/2,3,z,.08,1,d,STEEL,0,.9);
for(let i=0;i<4;i++){const sx=x-w/2-.4-i*.8;blk(sx,z,.8,2-i*.5,d*.6,lerpC(DARK,STEEL,.2),.6)}
return true};
// giant needle spire just outside the north wall: backdrop only, stacked cylinders getting thinner, glowing rings and a spinning ring
const spire=(x,z)=>{for(let i=0;i<8;i++){const r=3.6*(1-i/8)+.35,y=i*5+2.5;P("cyl",x,y,z,r*2,5,r*2,i%2?DARK:STEEL,0,.9);
if(i%2===0)P("cyl",x,i*5+5,z,r*2+.4,.22,r*2+.4,CY,0,1,glow)}
P("cone",x,41.5,z,.5,3,.5,CY,0,1,glow);
c.halo(x,42,z,0x40f0ff,8,.6);
const ring=new T.Group();ring.position.set(x,24,z);
const tor=new T.Mesh(new T.TorusGeometry(4.2,.14,6,32),new T.MeshBasicMaterial({color:0x40f0ff}));tor.rotation.x=PI/2;ring.add(tor);
c.add(ring);c.anim(dt=>{ring.rotation.y+=dt*.6});
return true};
// arrange the world: landmark outside the north wall, then the scenery around the arena
spire(0,-c.H-9);
place(c.pc(4),tower,8);
place(c.pc(3),mast,8);
place(c.pc(8),rack,6);
place(c.pc(8),container,6);
place(c.pc(4),tank,8);
place(c.pc(6),pylon,6);
place(c.pc(6),barrier,6);
place(c.pc(3),catwalk,10);
// cyan cable arcs: each pylon connects to its nearest neighbour
pyl.forEach(([ax,az],i)=>{let best=null,bd=1e9;pyl.forEach(([bx,bz],j)=>{if(j===i)return;const d=Math.hypot(bx-ax,bz-az);if(d<bd){bd=d;best=[bx,bz]}});
if(!best||bd>24)return;
for(let j=1;j<10;j++){const t=j/10;P("box",ax+(best[0]-ax)*t,5.9-1.4*Math.sin(PI*t),az+(best[1]-az)*t,.12,.12,.12,CY,0,1,glow)}});
// slow pulse on the tower beacons
c.anim((dt,t)=>{for(const [h,p] of bec)h.material.opacity=Math.sin(t*4+p)>.3?.85:.05});
},
mon:{names:["Drone","Scout Bot","Crusher Mech","Spider Bot","Siege Walker","Laser Turret","Hunter Unit"],weights:[[0,12],[1,40],[2,14],[3,14],[4,6],[5,16],[6,10]],hp:1,spd:1,dmg:1,trait:"shield"},
// robots: gunmetal or chrome bodies, orange or white plating on some types, a glowing cyan visor bar, a head antenna and a chest light
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0x5e6670,0x9aa4b0,0x4a5560,0x7a8290,0x3c434c,0xd8dee6,0x6a6e78];
m[0].color.setHex(SK[k]||SK[0]);m[1].color.setHex(0x1c2026);m[2].color.setHex(0xc8d0da);
m[3].color.setHex(k===2||k===6?0xe07a2a:k===5?0xe8ecf2:0x3a4048);m[4].color.setHex(0x3a3f48);m[5].color.setHex(0x6a4a3a);m[6].color.setHex(0x40f0ff);m[6].emissive.setHex(0x107a8a);
const visor=new T.MeshBasicMaterial({color:0x40f0ff});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){if(k===4)add(u.torso,new T.BoxGeometry(1.12,.9,.86),m[4],0,.05,0);
for(const s of[-1,1])add(u.torso,new T.BoxGeometry(.32,.14,.5),m[3],s*.62,.4,0);
add(u.torso,new T.SphereGeometry(.07,6,4),visor,0,.22,.36)}
if(u.head&&!o.boss){add(u.head,new T.BoxGeometry(.5,.09,.04),visor,0,.08,.31);
add(u.head,new T.CylinderGeometry(.015,.015,.5,4),m[4],.15,.5,0);
add(u.head,new T.SphereGeometry(.04,6,4),new T.MeshBasicMaterial({color:0xff4a3a}),.15,.78,0);
if(k===1)add(u.head,new T.CylinderGeometry(.34,.34,.03,10),m[4],0,.46,0)}
if(u.arms)for(const i of[0,1])if(u.arms[i])add(u.arms[i],new T.BoxGeometry(.3,.36,.3),m[3],0,-.2,0);
if(o.boss){ // Overseer Mk-IV: large rectangular head with one big eye, antenna crown, shoulder cannons and back exhaust stacks
const iron=m[4];
if(u.head){add(u.head,new T.BoxGeometry(.95,.72,.8),m[0],0,.05,0);
add(u.head,new T.SphereGeometry(.16,10,8),new T.MeshBasicMaterial({color:0x90f8ff}),0,.05,.42);
for(const x of[-.3,0,.3])add(u.head,new T.CylinderGeometry(.02,.02,.45,4),iron,x,.6,0);
for(const x of[-.3,0,.3])add(u.head,new T.SphereGeometry(.05,6,4),visor,x,.86,0)}
if(u.torso){for(const s of[-1,1])add(u.torso,new T.CylinderGeometry(.13,.13,.8,8),iron,s*.62,.3,.25,Math.PI/2);
for(const s of[-1,1])add(u.torso,new T.CylinderGeometry(.09,.1,.9,6),iron,s*.3,.3,-.5)}}},
boss:{name:"Overseer Mk-IV",scale:2.6,col:0x40e8ff,hp:1,minions:4,minionK:1,attacks:{volley:3,nova:2,dash:1,meteor:1,special:3},
// Orbital Laser: eight rings mark a straight line from the boss to the player's position, then the beam strikes each ring in turn
special(e,b){const o=e.g.position,p=b.player();b.flash("Overseer: orbital laser!");b.snd("rift",.8);
const pts=[];for(let i=1;i<=8;i++){const f=i/8;pts.push([o.x+(p.x-o.x)*f,o.z+(p.z-o.z)*f])}
for(const [x,z] of pts)b.ring(x,z,1,0x40e8ff,1.1);
let hit=false; // the beam hurts the player once, not once per ring
pts.forEach(([x,z],i)=>b.later(e,1000+i*90,()=>{b.bolt(x,z,0x90f8ff);b.burst(x,.6,z,0x40e8ff,14,5);if(!hit&&b.near(x,z,1.6)){hit=true;b.hurt(e.dmg*.6,x,z)}}))}}
});
