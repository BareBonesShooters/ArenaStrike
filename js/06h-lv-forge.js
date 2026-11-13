"use strict";
// Level 7 · Molten Forge: a smoky forge built on black basalt, with lava channels and a volcano outside the walls.
// Monsters are cinder imps and magma golems that burst into flame when they die. Boss: Furnace Colossus, whose Lava Wave rings must be jumped.
LV.reg({
id:"forge",n:"Molten Forge",tag:"The mountain is bleeding fire",mod:"firestorm",pack:1,
theme:{light:{fill:.55,cool:.27,bounce:.24},sky:[0x14100e,0x5a1a10,0xff7a2a],cloud:.6,cc:[.42,.28,.24],stars:.2,sun:{c:0xff7a3a,i:1.05,d:[.5,.18,.6]},hemi:[0xffa06a,0x4a2a1c,.95],fog:[0x5a2414,35,150],
gr:{base:"#3a2c24",v:["#30241e","#44342a","#4a3424","#3a2a20"],path:"#3a2a20",edge:"#150f0c",plaza:"#2e2622"},roads:false,
wall:0x4a3a34,trim:0x2a1e1a,house:[0x2e2624,0x3a2e2a,0x262020],roof:[0x1a1412,0x221a18],leaf:[0x2a1a10],trunk:0x1a1210,mount:[0x140e0c,0x1e1614],win:0xff8a2a,lamp:0xff7a2a,night:.35,
motes:[0xffa040,.14,.85,8,1]},
// ground: black basalt with ash grey patches, three lava rivers with dark red edges, and glowing cracks
paint(g,N,k,rng){
for(let i=0;i<50;i++){const x=rng()*N,y=rng()*N,rx=(2+rng()*3)*k,ry=(1.5+rng()*2)*k;g.fillStyle=rng()<.5?"rgba(120,116,112,.22)":"rgba(90,86,84,.25)";g.beginPath();g.ellipse(x,y,rx,ry,rng()*3,0,6.283);g.fill()}
for(let i=0;i<60;i++){const x=rng()*N,y=rng()*N,w=(1+rng())*k,h=(1+rng())*k;g.fillStyle=rng()<.5?"rgba(10,8,7,.5)":"rgba(40,30,26,.45)";g.fillRect(x-w/2,y-h/2,w,h)}
g.lineCap="round";g.lineJoin="round";
for(let r=0;r<3;r++){const pts=[];let x=rng()*N,y=rng()*N,a=rng()*6.283;
for(let i=0;i<6;i++){pts.push([x,y]);a+=(rng()-.5)*1.2;x+=Math.cos(a)*(8+rng()*6)*k*.5;y+=Math.sin(a)*(8+rng()*6)*k*.5}
const path=()=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i];g.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2)}g.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);g.stroke()};
g.shadowBlur=0;g.strokeStyle="#4a0a00";g.lineWidth=3.6*k;path();
g.shadowColor="#ff6a1a";g.shadowBlur=6*k;g.strokeStyle="#ff5a14";g.lineWidth=2.6*k;path();
g.shadowBlur=0;g.strokeStyle="#ffd24a";g.lineWidth=1.1*k;path()}
g.shadowBlur=0;
for(let i=0;i<40;i++){let x=rng()*N,y=rng()*N,a=rng()*6.283;g.strokeStyle="rgba(255,110,30,.6)";g.lineWidth=.22*k;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){a+=(rng()-.5)*1.4;x+=Math.cos(a)*1.4*k;y+=Math.sin(a)*1.4*k;g.lineTo(x,y)}g.stroke()}
for(let i=0;i<14;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*5)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(255,120,40,.35)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const basalt=[0x3a3a40,0x34343a,0x2e2e34],iron=0x3a3430,wood=0x3a2a1e;
// lean a vertical piece toward direction d by th radians: returns [rx,rz] for P
const tilt=(d,th)=>[Math.sin(d)*th,-Math.cos(d)*th];
// lava pool decal: dark rim, bright orange body, yellow core (no collision, no free check)
const lavaDecal=(x,z,r,halo)=>{P("cyl",x,.02,z,r*2.4,.03,r*2.4,0x4a0a00,0,1);P("cyl",x,.05,z,r*2,.05,r*2,0xff6a1a,0,1,glow);P("cyl",x,.07,z,r*1.2,.04,r*1.2,0xffd24a,0,1,glow);if(halo)c.halo(x,.5,z,0xff7a2a,r*2.6,.5)};
const pool=(x,z,r,halo)=>{if(!free(x,z,r+.5))return false;lavaDecal(x,z,r,halo);return true};
// lava channel: a long glowing strip across the ground
const channel=(x,z,ry,len)=>{if(!free(x,z,len/2))return false;P("box",x,.02,z,len,.03,1.9,0x4a0a00,ry,1);P("box",x,.05,z,len,.05,1.1,0xff6a1a,ry,1,glow);P("box",x,.07,z,len*.9,.03,.45,0xffd24a,ry,1,glow);return true};
// basalt hex-column cluster: tall ones are solid, low ones are walkable steps
const columns=(x,z)=>{if(!free(x,z,3))return false;const n=3+Math.floor(rng()*4);for(let i=0;i<n;i++){const cx=x+rr(-1.6,1.6),cz=z+rr(-1.6,1.6),h=rr(.3,3.6),r=rr(.45,.7),col=pick(basalt);
if(h<=.5)blk(cx,cz,r*2,h,r*2,col,.6);
else{reg(cx,cz,r*1.6,r*1.6,h,1);P("cyl",cx,h/2,cz,r*2,h,r*2,col,0,.7);P("cyl",cx,h+.02,cz,r*1.7,.04,r*1.7,lerpC(col,0xffffff,.1),0,.9)}}return true};
// forge building: dark stone smithy with a tall chimney and a glowing furnace mouth
const smithy=(x,z)=>{if(!free(x,z,5))return false;const w=6.5,d=5,h=3.4;blk(x,z,w,h,d,0x2e2624,.6);
P("gab",x,h+1.1,z,d+.9,2.2,w+.9,0x1a1412,PI/2,.75);
P("box",x+2,h+2.6,z-1.5,1.1,5.2,1.1,0x2a2220,0,.7);P("box",x+2,8.7,z-1.5,1.4,.2,1.4,0x1a1412,0,1);
P("box",x,1.3,z+d/2+.04,1.6,1.2,.1,0xffa030,0,1,glow);P("box",x,2,z+d/2+.04,2.1,.22,.1,0x1a1412,0,.9);
c.halo(x+2,9.4,z-1.5,0x5a5050,3.2,.35);c.light(x,1.4,z+d/2+1.2,0xff6a1a,1.3,12);return true};
// anvil on a stump
const anvil=(x,z)=>{if(!free(x,z,.8))return false;reg(x,z,1.2,.7,1.1,1);P("box",x,.35,z,1,.7,.6,0x2a2624,0,1);P("box",x,.85,z,1.3,.25,.7,0x3a3430,0,1);P("box",x+.5,.95,z,.4,.12,.5,0x3a3430,0,1);return true};
// giant crucible on a steel frame, pouring a column of molten metal onto a lava pool
const crucible=(x,z)=>{if(!free(x,z,2.4))return false;reg(x,z,2.2,2.2,5,1);
for(const [a,b] of[[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9]])P("box",x+a,2.5,z+b,.2,5,.2,iron,0,.8);
P("box",x,5.1,z,2.4,.25,2.4,iron,0,.9);P("cyl",x,5.5,z,1.6,.6,1.6,0x6a6a6e,0,.8);
P("cyl",x,5.84,z,1.2,.06,1.2,0xffa030,0,1,glow);P("cyl",x,2.6,z,.45,5.2,.45,0xff8a2a,0,1,glow);
lavaDecal(x,z,1.2,false);c.halo(x,5.6,z,0xff8a2a,3,.6);return true};
// gantry with hanging chains (solid posts, chains are decoration)
const gantry=(x,z,rot)=>{if(!free(x,z,3.4))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
const p1=L(-2.8,0),p2=L(2.8,0);reg(p1[0],p1[1],.4,.4,4.6,1);reg(p2[0],p2[1],.4,.4,4.6,1);
P("box",x,4.5,z,5.8,.3,.3,iron,ry,.8);
for(let i=-2;i<=2;i++){const q=L(i*1.1,0);for(let j=0;j<6;j++)P("box",q[0],4.3-j*.3,q[1],.08,.22,.08,iron,0,.8)}
return true};
// obsidian boulder: glossy black with a dark red sheen
const obsidian=(x,z)=>{const s=rr(1.2,2.2);if(!free(x,z,s))return false;reg(x,z,s*1.3,s*1.3,s*.9,1);P("ico",x,s*.45,z,s*1.4,s*.9,s*1.2,0x0c0a0e,rng()*3,.6);P("ico",x+s*.25,s*.9,z,s*.5,s*.35,s*.45,0x2a2024,rng()*3,.8);return true};
// mine cart on a short rail track, full of glowing ore
const cart=(x,z,ry)=>{if(!free(x,z,3))return false;const sx=Math.sin(ry),sz=Math.cos(ry),cx=Math.cos(ry),cz=-Math.sin(ry);
for(const s of[-.7,.7])P("box",x+sx*s,.14,z+sz*s,8,.08,.1,0x6a6a70,ry,.7);
for(let i=-3;i<=3;i++)P("box",x+cx*i*1.1,.05,z+cz*i*1.1,.35,.08,2,wood,ry,.7);
P("box",x,.7,z,2,.9,1.2,0x4a4038,ry,.7);P("ico",x,1.35,z,1,.5,1.1,0xff6a1a,ry,1,glow);
for(const sa of[-.75,.75])for(const sb of[-.6,.6])P("cyl",x+cx*sa+sx*sb,.28,z+cz*sa+sz*sb,.55,.14,.55,0x222222,ry+PI/2,.6,null,0,PI/2);
return true};
// weapon rack: a wooden board with spears and maces
const rack=(x,z,rot)=>{const W=2.6,D=.6;if(!free(x,z,2))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
reg(x,z,rot&1?D:W,rot&1?W:D,2.2,1);
const bd=L(0,-.2);P("box",bd[0],1.2,bd[1],W,2.4,.12,wood,ry,.7);
for(let i=0;i<4;i++){const q=L(-1+i*.66,.1);P("cyl",q[0],1.1,q[1],.07,2.2,.07,0x5a5a60,ry,.7,null,0,.12);P("pyr",q[0],2.3,q[1],.16,.4,.16,0x8a8a90,ry,1)}
return true};
// ---- placement
// landmark: an erupting volcano outside the walls, with lava streaks down its flank and a smoke plume
const a0=rng()*6.283,R=c.H+16,vx=Math.cos(a0)*R,vz=Math.sin(a0)*R;
P("cone",vx,7.5,vz,44,15,44,0x1a1412,0,.7);
P("cyl",vx,14.2,vz,6.8,1.6,6.8,0x2a1c16,0,1);
P("cyl",vx,15.02,vz,5.2,.06,5.2,0xff6a1a,0,1,glow);
P("cyl",vx,15.08,vz,2.8,.05,2.8,0xffd24a,0,1,glow);
c.halo(vx,17,vz,0x3a3030,9,.5);c.halo(vx+2,21,vz-1,0x4a3a36,13,.4);c.halo(vx-1,25,vz+2,0x5a4a44,16,.3);
c.light(vx,16,vz,0xff6a1a,1.4,40);
for(let i=0;i<4;i++){const a=a0+i*1.57+rng()*.3,[rx,rz]=tilt(a+PI,.96),r=12.7;
P("box",vx+Math.cos(a)*r,6.5,vz+Math.sin(a)*r,.7,22.7,.3,0xff5a14,0,1,null,rx,rz)}
place(c.pc(2),(x,z)=>smithy(x,z),12);
place(1,(x,z)=>crucible(x,z),14);
place(c.pc(3),(x,z,r)=>gantry(x,z,r),8);
place(c.pc(4),(x,z)=>anvil(x,z),6);
place(c.pc(6),(x,z)=>columns(x,z),6);
place(c.pc(8),(x,z)=>obsidian(x,z),6);
place(c.pc(6),(x,z)=>pool(x,z,rr(2,3.6),rng()<.5),6);
place(c.pc(4),(x,z,r)=>channel(x,z,r*PI/2+rng()*.4,rr(8,14)),10);
place(c.pc(3),(x,z,r)=>cart(x,z,r*PI/2+rng()*.3),8);
place(c.pc(3),(x,z,r)=>rack(x,z,r),6);
},
mon:{names:["Cinder Imp","Ember Runner","Magma Golem","Ash Crawler","Obsidian Hulk","Flame Spitter","Slag Stalker"],weights:[[0,55],[1,22],[2,12],[3,14],[4,6],[5,8],[6,6]],hp:1,spd:1,dmg:1,trait:"explode"},
// black rock body per type, glowing orange cracks, curved horns, a flame on the head and glowing eyes
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0x2a2420,0x332a24,0x25201c,0x3a2e26,0x0e0c10,0x2e2622,0x2a2018];
m[0].color.setHex(SK[k]||SK[0]);m[1].color.setHex(0x141010);m[3].color.setHex(0x3a2a20);m[4].color.setHex(0x2a2624);m[5].color.setHex(0x4a2a1a);m[6].color.setHex(0xffb040);m[6].emissive.setHex(0xff5a14);
const rock=new T.MeshLambertMaterial({color:0x1a1614});m.push(rock);
const hot=new T.MeshBasicMaterial({color:0xff6a1a}),eye=new T.MeshBasicMaterial({color:0xffc040}),flame=new T.MeshBasicMaterial({color:0xff8a1a,transparent:true,opacity:.9});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){for(const [x,y,z] of[[-.25,.2,.36],[.2,-.1,.36],[.02,.3,.36]])add(u.torso,new T.BoxGeometry(.04,.45,.04),hot,x,y,z,0,.2);
if(k===4){add(u.torso,new T.IcosahedronGeometry(.3,0),rock,-.62,.32,0);add(u.torso,new T.IcosahedronGeometry(.3,0),rock,.62,.32,0)}}
for(let i=0;i<2;i++){if(u.arms&&u.arms[i])add(u.arms[i],new T.BoxGeometry(.035,.45,.035),hot,0,-.4,.12,0,.3);if(u.legs&&u.legs[i])add(u.legs[i],new T.BoxGeometry(.035,.45,.035),hot,0,-.35,.14,0,-.2)}
if(u.head){for(const s of[-1,1])add(u.head,new T.ConeGeometry(.05,.3,5),m[1],s*.2,.32,0,0,-s*.5);
add(u.head,new T.ConeGeometry(.12,.4,6),flame,0,.55,0);
for(const s of[-1,1])add(u.head,new T.SphereGeometry(.05,6,4),eye,s*.14,.06,.31)}
if(o.boss){ // Furnace Colossus: glowing chest grille, twin smokestacks, a hammer in one arm and a molten crown
m[0].color.setHex(0x2e2420);
if(u.torso){add(u.torso,new T.BoxGeometry(.7,.5,.05),new T.MeshBasicMaterial({color:0xff8a2a}),0,.2,.37);for(const x of[-.22,-.07,.07,.22])add(u.torso,new T.BoxGeometry(.05,.5,.06),m[4],x,.2,.4);
for(const s of[-1,1])add(u.torso,new T.CylinderGeometry(.14,.16,.8,8),m[4],s*.25,.6,-.42)}
if(u.arms&&u.arms[0]){add(u.arms[0],new T.BoxGeometry(.12,1.4,.12),m[4],0,-1,.1);add(u.arms[0],new T.BoxGeometry(.55,.42,.5),m[4],0,-1.8,.1)}
if(u.head){for(let i=0;i<5;i++)add(u.head,new T.ConeGeometry(.06,.28,5),hot,(i-2)*.14,.45,0,0,-(i-2)*.2)}
}},
boss:{name:"Furnace Colossus",scale:2.8,col:0xff6a1a,hp:1,minions:4,minionK:0,attacks:{meteor:3,slam:2,nova:1,dash:1,special:3},
// Lava Wave: five fire rings expand from the boss at 3, 6, 9, 12 and 15 m, one every 260 ms.
// Each ring telegraphs ~0.9 s ahead; you are hit if your distance from the boss is within 1.3 m of the ring and you are below y=1 (jump to dodge)
special(e,b){b.flash("Jump the lava wave!");b.snd("roar",.8);const p=e.g.position,cx=p.x,cz=p.z;
for(let i=0;i<5;i++){const R=3+i*3,t0=300+i*260;
b.later(e,t0,()=>{b.ring(cx,cz,R,0xffa040,.9)});
b.later(e,t0+900,()=>{b.ring(cx,cz,R,0xff6a1a,.5);b.snd("boom",.35);
for(let j=0;j<12;j++){const a=j/12*6.283;b.burst(cx+Math.cos(a)*R,.5,cz+Math.sin(a)*R,j%2?0xff8a2a:0xffd24a,6,3)}
const q=b.player();if(Math.abs(Math.hypot(q.x-cx,q.z-cz)-R)<=1.3&&q.y<1)b.hurt(e.dmg*.6,q.x,q.z)})}}}
});
