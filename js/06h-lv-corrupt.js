"use strict";
// Level 3 · The Corrupted Realm: a blood-red wasteland of obsidian spires, crystal, bones and a rift in the sky.
// Every wave here is a Corrupted wave, so the map is its own red world. Monsters are dark red husks and knights.
// Boss: The Crimson Herald, who calls down Blood Rain.
LV.reg({
id:"corrupt",n:"The Corrupted Realm",tag:"Everything turns red",mod:"frenzy",pack:2,corrupt:true,
theme:{sky:[0x0a0004,0x6a0a18,0xc0203a],cloud:.3,cc:[.8,.2,.25],stars:.6,sun:{c:0xff3040,i:.5,d:[.6,.3,.5]},hemi:[0x8a1a2a,0x1a0a0c,.6],fog:[0x2a0408,20,110],
gr:{base:"#1a0a0c",v:["#160809","#1e0c0e","#120506","#22100f"],path:"#2a0c10",edge:"#0c0304",plaza:"#24100e"},roads:false,
wall:0x2a1418,trim:0x1a0a0c,house:[0x2a1418,0x3a1a20],roof:[0x14080a,0x1e0a0e],leaf:[0x2a0a10],trunk:0x1a0a0c,mount:[0x1a0408,0x2a0a12],win:0xff2a3a,lamp:0xff3040,night:1,
motes:[0xff3a3a,.2,.85,7,.6]},
// ground: obsidian with mottled dark patches, blood pools, glowing lava veins and a cracked rune circle
paint(g,N,k,rng){
for(let i=0;i<50;i++){const x=rng()*N,y=rng()*N,r=(2+rng()*4)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(90,10,18,.45)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
for(let i=0;i<14;i++){const x=rng()*N,y=rng()*N,r=(1.5+rng()*2)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(120,4,12,.85)");q.addColorStop(.7,"rgba(70,0,8,.6)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
// lava veins: a dark outline under a bright red core, branching as they go
const vein=(x,y,a,len,d)=>{if(d<0)return;const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;g.lineCap="round";
g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle="rgba(10,0,2,.9)";g.lineWidth=(d+1.5)*k*.55;g.stroke();
g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle="rgba(255,40,40,.95)";g.lineWidth=(d+1)*k*.28;g.stroke();
vein(x2,y2,a+(rng()-.5)*.9,len*.75,d-1);if(rng()<.6)vein(x2,y2,a+(rng()<.5?-1:1)*(.6+rng()*.5),len*.6,d-1)};
for(let i=0;i<9;i++)vein(rng()*N,rng()*N,rng()*6.283,(10+rng()*8)*k,4);
// big cracked rune circle around the centre: broken arc segments and ticks
g.lineCap="round";
for(let j=0;j<12;j++){if(j%5===4)continue;const a0=j/12*6.283,a1=(j+.7)/12*6.283;g.beginPath();g.arc(N/2,N/2,14*k,a0,a1);g.strokeStyle="rgba(10,0,2,.9)";g.lineWidth=2.6*k*.6;g.stroke();g.strokeStyle="rgba(255,40,40,.85)";g.lineWidth=1.2*k*.5;g.stroke()}
g.beginPath();g.arc(N/2,N/2,10.5*k,0,6.283);g.strokeStyle="rgba(255,40,40,.6)";g.lineWidth=.8*k*.5;g.stroke();
for(let j=0;j<12;j++){const a=j/12*6.283;g.beginPath();g.moveTo(N/2+Math.cos(a)*10*k,N/2+Math.sin(a)*10*k);g.lineTo(N/2+Math.cos(a)*12.5*k,N/2+Math.sin(a)*12.5*k);g.strokeStyle="rgba(255,40,40,.8)";g.lineWidth=.6*k*.5;g.stroke()}
},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,PI,H}=c;
const obs=[0x0c0506,0x140708,0x1a0a0c],crys=[0xff2040,0xff3a4a,0xc0102a],iron=0x2a2226;
// tall jagged obsidian spire, some leaning (base sits on the ground)
const spire=(x,z)=>{if(!free(x,z,1.6))return false;const r=rr(.7,1.2),h=rr(6,12),tl=rng()<.45?rr(-.2,.2):0;reg(x,z,r*1.6,r*1.6,2.4,1);P("cone",x,h/2*Math.cos(tl),z,r,h,r,pick(obs),rng()*3,.8,null,0,tl);return true};
// crimson crystal cluster, glowing
const crystal=(x,z)=>{if(!free(x,z,1.2))return false;reg(x,z,1.2,1.2,1.6,1);const n=3+Math.floor(rng()*3);for(let i=0;i<n;i++){const h=rng()<.3?rr(2.6,4):rr(1,2),r=rr(.14,.3);P("cone",x+rr(-.5,.5),h/2,z+rr(-.5,.5),r,h,r,pick(crys),rng()*3,1,glow)}if(rng()<.5)c.halo(x,1.2,z,0xff2040,2.6,.5);return true};
// broken black pillar: solid stump with a tilted cracked top
const pillar=(x,z)=>{if(!free(x,z,1))return false;const h=rr(2.5,5);blk(x,z,1.1,h,1.1,0x1e0c10,.7);P("box",x+rr(-.4,.4),h+.25,z,.9,.45,.8,0x1e0c10,0,.7,null,0,rr(-.3,.3));return true};
// ruined dark arch: two pillars and a sagging lintel
const arch=(x,z,rot)=>{if(!free(x,z,2.6))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
for(const s of[-2,2]){const q=L(s,0);blk(q[0],q[1],1,4,1.2,0x1e0c10,.6)}
P("box",x,4.1,z,4.6,.7,1.2,0x1a0a0c,ry,.7,null,0,.12);return true};
// bone pile with a skull whose eyes glow red
const bones=(x,z)=>{if(!free(x,z,.8))return false;for(let i=0;i<7;i++)P("cyl",x+rr(-.5,.5),.1,z+rr(-.5,.5),.08,.8,.08,0xcfc6a8,rng()*3,.8,null,0,PI/2);
P("sph",x,.3,z,.3,.28,.3,0xd6ceb4,0,.8);P("box",x-.1,.32,z+.26,.08,.07,.05,0xff2030,0,1,glow);P("box",x+.1,.32,z+.26,.08,.07,.05,0xff2030,0,1,glow);return true};
// iron cage: floor, roof and bar walls
const cage=(x,z)=>{if(!free(x,z,1.5))return false;reg(x,z,1.8,1.8,2.4,1);P("box",x,.08,z,1.8,.16,1.8,iron,0,1);P("box",x,2.3,z,1.9,.12,1.9,iron,0,.9);
for(let i=0;i<=4;i++){const o=-.8+i*.4;P("box",x+o,1.15,z-.85,.05,2.2,.05,iron,0,1);P("box",x+o,1.15,z+.85,.05,2.2,.05,iron,0,1);P("box",x-.85,1.15,z+o,.05,2.2,.05,iron,0,1);P("box",x+.85,1.15,z+o,.05,2.2,.05,iron,0,1)}return true};
// row of impaling spikes, some with a red tip
const spikes=(x,z,rot)=>{const len=6,w=rot&1?.6:len,d=rot&1?len:.6;if(!free(x,z,len/2+.5))return false;reg(x,z,w,d,1.4,1);
for(let i=0;i<=7;i++){const o=-len/2+i*.8,px=rot&1?x:x+o,pz=rot&1?z+o:z,h=rr(1.3,2.2);P("cone",px,h/2,pz,.12,h,.12,iron,0,.8,null,0,rr(-.12,.12));if(i%2===0)P("sph",px,h,pz,.15,.15,.15,0x8a0a18,0,1,glow)}return true};
// blood pool: flat glowing dark-red disc, no collision
const pool=(x,z)=>{const r=rr(1.2,2.6);if(!free(x,z,r))return false;P("cyl",x,.03,z,r,.05,r,0x5a0610,0,1,glow);return true};
place(c.pc(18),spire,4);
place(c.pc(14),crystal,6);
place(c.pc(8),pillar,6);
place(c.pc(3),arch,10);
place(c.pc(10),bones,6);
place(c.pc(4),cage,6);
place(c.pc(4),spikes,8);
place(c.pc(12),pool,4);
// distant jagged spires outside the walls (decor only)
for(let i=0;i<30;i++){const a=i/30*6.283+rng()*.2,r=H+10+rng()*12,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rr(10,18),w=rr(2.5,4);P("pyr",x,h/2,z,w,h,w,pick(obs),rng()*3,.6)}
// floating rock chunks above the arena, bobbing
const rocks=[];
for(let i=0;i<5;i++){const m=new T.Mesh(new T.IcosahedronGeometry(rr(1,2),0),new T.MeshLambertMaterial({color:0x2a0a10,flatShading:true}));m.position.set(rr(-22,22),rr(12,17),rr(-22,22));m.userData.b=m.position.y;m.userData.ph=rng()*6.283;c.add(m);rocks.push(m)}
c.anim((dt,t)=>{for(const m of rocks){m.position.y=m.userData.b+Math.sin(t*.8+m.userData.ph)*.5;m.rotation.y+=dt*.15;m.rotation.x+=dt*.07}});
// landmark: a huge red rift just outside the east wall, a ring of glowing slabs around a pulsing core
const RX=H+6.5,RZ=-6;
const rift=new T.Group();rift.position.set(RX,0,RZ);rift.rotation.y=-PI/2;
const rm=new T.MeshBasicMaterial({color:0xff1a2a});
for(let i=0;i<12;i++){const a=i/12*6.283,b=new T.Mesh(new T.BoxGeometry(1.1,1.7,.5),rm);b.position.set(Math.cos(a)*6,6+Math.sin(a)*6,0);b.rotation.z=a;rift.add(b)}
const disc=new T.Mesh(new T.CircleGeometry(5.2,28),new T.MeshBasicMaterial({color:0xff0a20,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));disc.position.set(0,6,0);rift.add(disc);
c.add(rift);
c.anim((dt,t)=>{const s=1+.05*Math.sin(t*1.4);disc.scale.set(s,s,1);disc.material.opacity=.3+.15*Math.sin(t*1.4)});
c.halo(RX-1,6,RZ,0xff2040,8,.5);c.halo(RX-1.5,3,RZ,0xff2040,6,.4);c.halo(RX-1.5,9,RZ,0xff4050,5,.35);
c.light(RX-2,6,RZ,0xff2030,2.2,30);
},
mon:{names:["Corrupted Husk","Blood Runner","Crimson Brute","Rift Crawler","Dread Knight","Plague Herald","Void Stalker"],weights:[[0,18],[1,16],[2,14],[3,16],[4,12],[5,12],[6,12]],hp:1,spd:1,dmg:1,trait:""},
// black-red body per type, glowing red cracks across the torso, curved horns, red eyes; Dread Knight (k=4) wears spiked pauldrons
skin(g,k,o){const u=g.userData,m=u.mats,BD=[0x2a0a10,0x3a0c14,0x22080c,0x301014,0x3a0a1a,0x40101a,0x1a0a20];
m[0].color.setHex(BD[k%7]);m[1].color.setHex(0x0a0204);m[2].color.setHex(0x6a5a50);m[3].color.setHex(0x5a0a14);m[4].color.setHex(0x2a2226);m[5].color.setHex(0x6a1018);m[6].color.setHex(0xff2030);m[6].emissive.setHex(0xff0a18);
const cloth=new T.MeshLambertMaterial({color:[0x2a0a10,0x3a0a12,0x1e0608,0x24080e][k%4]});m.push(cloth);
const horn=new T.MeshLambertMaterial({color:0x1a0a0c});m.push(horn);
const crack=new T.MeshBasicMaterial({color:0xff2a30}),eye=new T.MeshBasicMaterial({color:0xff2030});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){add(u.torso,new T.BoxGeometry(1,.62,.7),cloth,0,.18,0);
add(u.torso,new T.BoxGeometry(.04,.5,.04),crack,-.2,.1,.36,0,.3);add(u.torso,new T.BoxGeometry(.04,.36,.04),crack,.15,-.1,.36,0,-.4);add(u.torso,new T.BoxGeometry(.04,.3,.04),crack,.05,.22,.36,0,.2);add(u.torso,new T.BoxGeometry(.3,.04,.04),crack,.12,-.2,.36,0,.2)}
if(k===4&&u.torso){const iron=new T.MeshLambertMaterial({color:0x2a2226});m.push(iron);
for(const s of[-1,1]){add(u.torso,new T.BoxGeometry(.5,.18,.6),iron,s*.62,.4,0);add(u.torso,new T.ConeGeometry(.14,.46,4),iron,s*.62,.6,0,0,-s*.5)}}
if(u.head){for(const x of[-.14,.14])add(u.head,new T.SphereGeometry(.06,6,4),eye,x,.06,.31);
for(const s of[-1,1]){add(u.head,new T.ConeGeometry(.07,.45,5),horn,s*.25,.4,0,0,-s*.6);add(u.head,new T.ConeGeometry(.05,.3,5),horn,s*.36,.56,0,0,-s*1)}
add(u.head,new T.BoxGeometry(.5,.1,.5),cloth,0,.3,0,0,.15)}
if(o.boss){ // The Crimson Herald: a tall crown of red crystal spikes, a tattered cape and a glowing red orb
m[0].color.setHex(0x1a0608);
const cape=new T.MeshLambertMaterial({color:0x140408});m.push(cape);
for(let i=0;i<4;i++)add(u.torso,new T.BoxGeometry(.2,.9+(i%2)*.25,.04),cape,-.33+i*.22,-.25-(i%2)*.1,-.42,0,(i-1.5)*.05);
const crys=new T.MeshBasicMaterial({color:0xff2040});
add(u.head,new T.CylinderGeometry(.36,.4,.12,8),m[1],0,.3,0);
for(let i=0;i<7;i++){const off=i-3,hh=.42+(3-Math.abs(off))*.1;add(u.head,new T.ConeGeometry(.07,hh,5),crys,off*.12,.5+(3-Math.abs(off))*.05,0,0,-off*.16)}
add(u.arms[1],new T.SphereGeometry(.22,8,6),crys,0,-1.35,0)}},
boss:{name:"The Crimson Herald",scale:2.7,col:0xff1030,hp:1,minions:6,minionK:0,attacks:{volley:2,nova:2,meteor:2,dash:1,slam:1,special:3},
// Blood Rain: ten red rings are scattered around you, then erupt one after another
special(e,b){const p=b.player();b.flash("The Crimson Herald: Blood Rain!");b.snd("roar",.9);
const pts=[];for(let i=0;i<10;i++){const a=b.rnd()*6.283,r=b.rnd()*9;pts.push([b.clamp(p.x+Math.cos(a)*r,-b.H()+2,b.H()-2),b.clamp(p.z+Math.sin(a)*r,-b.H()+2,b.H()-2)])}
pts.forEach(([x,z],i)=>{b.ring(x,z,2,0xff1030,1);b.later(e,1000+i*120,()=>{b.burst(x,.5,z,0xff1030,18,6);b.burst(x,1.5,z,0xff4050,8,3);b.crack(x,z,0xff2030);if(b.near(x,z,2))b.hurt(e.dmg*.6,x,z)})});
b.later(e,1000+10*120+200,()=>{b.summon(e,2,0);b.shake(250)})}}
});
