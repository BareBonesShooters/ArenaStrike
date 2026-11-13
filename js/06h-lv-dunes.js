"use strict";
// Level 2 · Scorched Dunes: a sun-baked desert town at noon. Low sand mounds, adobe houses, saguaro cacti and bleached bones.
// Monsters are mummy husks that dig out of the sand. Boss: The Dune Pharaoh, who calls down sandstorms.
LV.reg({
id:"dunes",n:"Scorched Dunes",tag:"The sand remembers",mod:"heatwave",pack:0,
theme:{sky:[0x1c4f9a,0x6fa6d8,0xf2e0a8],cloud:0,cc:[1,.96,.86],stars:0,sun:{c:0xfff1c0,i:.95,d:[.3,.9,.35]},hemi:[0xcfe6ff,0xd8b77c,.85],fog:[0xf0dcaa,60,200],
gr:{base:"#d8b77c",v:["#cfae70","#e2c48f","#c9a468","#dcbc82"],path:"#c4a06a",edge:"#a88656",plaza:"#e4cc98"},roads:false,
wall:0xd9b98a,trim:0x8a6a44,house:[0xdcab88,0xcb9676,0xe3b592],roof:[0xb98b6a,0xa87858],leaf:[0x6f8a4a],trunk:0x5a4028,mount:[0xc9a070,0xd9b47e],win:0x2a1a10,lamp:0xffd080,night:0,
motes:[0xe8d2a0,.1,.6,9,.03]},
// sand: long wavy dune ripples, dark wind-swept patches and a few cracked dry-earth areas
paint(g,N,k,rng){
for(let i=0;i<70;i++){const y0=rng()*N,ph=rng()*6.283,fr=(2+rng()*2)*6.283/N,amp=(.25+rng()*.4)*k;
g.strokeStyle=rng()<.5?"rgba(150,108,58,.2)":"rgba(255,240,200,.14)";g.lineWidth=Math.max(1,.12*k);g.beginPath();
for(let x=0;x<=N;x+=6){const y=y0+Math.sin(x*fr+ph)*amp;if(x)g.lineTo(x,y);else g.moveTo(x,y)}g.stroke()}
for(let i=0;i<24;i++){const x=rng()*N,y=rng()*N,r=(4+rng()*7)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(120,84,44,.16)");q.addColorStop(1,"rgba(120,84,44,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
for(let p=0;p<4;p++){const cx=rng()*N,cy=rng()*N,R=(3+rng()*2)*k;
g.beginPath();g.arc(cx,cy,R,0,6.283);g.fillStyle="rgba(190,140,90,.22)";g.fill();
g.strokeStyle="rgba(100,70,40,.5)";g.lineWidth=Math.max(1,.1*k);
for(let i=0;i<14;i++){let x=cx,y=cy,a=rng()*6.283;g.beginPath();g.moveTo(x,y);
for(let s=0;s<4;s++){a+=(rng()-.5)*1.2;const l=R*(.25+rng()*.2);x+=Math.cos(a)*l;y+=Math.sin(a)*l;g.lineTo(x,y)}g.stroke()}}},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const ADO=[0xd9a57f,0xcf9a74,0xe3b58d,0xc98f6a],SAND=[0xe0c08a,0xd4b07a,0xcaa670,0xe6cb98],CACT=[0x5f8a4a,0x6a9654],BONE=0xe8dcc0,WOOD=0x6a4a2e,DARKW=0x5a3a20;
// low sand mound inside the arena: flattened, no collision
const mound=(x,z)=>{if(!free(x,z,2.4))return false;P("sph",x,.1,z,rr(3,5),rr(.3,.5),rr(2.5,4),pick(SAND),rng()*3,.4);return true};
// adobe house: main block with rounded corner posts, a smaller stacked block, flat roof, vigas, arched door, deep windows
const adobe=(x,z)=>{const w=rr(5,6.5),d=rr(4.5,5.5),h=rr(3,3.6);if(!free(x,z,Math.max(w,d)/2+1.4))return false;
const col=pick(ADO),top=lerpC(col,0xffffff,.06),ox=-w*.18,oz=d*.1,sw=w*.55,sd=d*.6,fz=z+d/2+.02;
blk(x,z,w,h,d,col,.6);
reg(x+ox,z+oz,sw,sd,h+1.8,1);
P("box",x+ox,h+.9,z+oz,sw,1.8,sd,top,0,.7);
P("box",x,h+.1,z,w+.2,.2,d+.2,lerpC(col,0x000000,.12),0,.8);
for(const [sx,sz] of[[-1,-1],[1,-1],[-1,1],[1,1]])P("cyl",x+sx*w/2,h/2,z+sz*d/2,.5,h,.5,col,0,.6);
for(let i=-2;i<=2;i++)P("box",x+i*w*.19,h-.25,z+d/2+.22,.16,.16,.5,DARKW,0,.9);
P("box",x,1.05,fz,1.1,2.1,.06,0x2a1a12,0,1);
P("cyl",x,2.1,fz,1.1,.06,1.1,0x2a1a12,0,1,null,PI/2,0);
for(const s of[-1,1])P("box",x+s*w*.32,h*.55,fz,.55,.7,.06,0x1a0e08,0,1);
return true};
// saguaro cactus: tall green column with one or two bent arms
const saguaro=(x,z)=>{if(!free(x,z,1))return false;reg(x,z,.8,.8,5);const h=rr(4,5.5),col=pick(CACT);
P("cyl",x,h/2,z,.5,h,.5,col,0,.6);P("sph",x,h,z,.5,.5,.5,col,0,.6);
for(const s of rng()<.5?[-1,1]:[pick([-1,1])]){const ay=h*rr(.5,.65);
P("cyl",x+s*.6,ay,z,.3,1.2,.3,col,0,.6,null,0,PI/2);P("cyl",x+s*1.2,ay+.55,z,.3,1.1,.3,col,0,.6);P("sph",x+s*1.2,ay+1.1,z,.3,.3,.3,col,0,.6)}
return true};
// round barrel cactus with a pink flower on top
const barrel=(x,z)=>{if(!free(x,z,.8))return false;reg(x,z,.9,.9,1.2);P("cyl",x,.55,z,.9,1.1,.9,CACT[0],0,.6);
for(let i=0;i<4;i++){const a=i*PI/2;P("box",x+Math.cos(a)*.45,.55,z+Math.sin(a)*.45,.06,1,.06,0x3f6a34,a,.7)}
P("sph",x,1.13,z,.26,.18,.26,0xff6fa0,0,1);return true};
// cattle skull with curved horns
const skull=(x,z)=>{if(!free(x,z,.8))return false;const r=rng()*6.283,cs=Math.cos(r),sn=Math.sin(r);
P("box",x,.3,z,.6,.45,.55,BONE,r,.5);P("box",x+cs*.36,.22,z-sn*.36,.36,.3,.4,BONE,r,.5);
for(const s of[-1,1])P("cone",x+sn*s*.28,.6,z+cs*s*.28,.14,.6,.14,BONE,r,.5,null,0,-s*.5);
return true};
// ribcage: rows of thin bone boxes either side of a spine
const ribs=(x,z)=>{if(!free(x,z,1.2))return false;const r=rng()*6.283,cs=Math.cos(r),sn=Math.sin(r);
for(let i=0;i<5;i++){const o=(i-2)*.34,px=x+cs*o,pz=z-sn*o;for(const s of[-1,1])P("box",px+sn*s*.42,.32,pz+cs*s*.42,.07,.07,.9,BONE,r,.5)}
return true};
// loose bleached bone with knobbed ends
const bone=(x,z)=>{if(!free(x,z,.6))return false;const r=rng()*6.283,L=rr(.5,.8),cs=Math.cos(r),sn=Math.sin(r);
P("cyl",x,.08,z,.1,L,.1,BONE,r,.5,null,0,PI/2);
for(const s of[-1,1])P("sph",x+cs*s*L/2,.1,z-sn*s*L/2,.2,.2,.2,BONE,0,.5);
return true};
// broken wagon: tilted bed, one broken shaft, two wheels
const wagon=(x,z)=>{if(!free(x,z,2.4))return false;const r=rng()*1.2-.6,cs=Math.cos(r),sn=Math.sin(r),B=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
reg(x,z,2.8,2.2,1.4);
let q=B(0,0);P("box",q[0],1,q[1],2.6,.18,1.6,WOOD,r,.7,null,0,.18);
for(const s of[-1,1]){q=B(0,s*.78);P("box",q[0],1.4,q[1],2.4,.5,.1,0x7a5632,r,.7)}
q=B(-1.25,0);P("box",q[0],1.4,q[1],.1,.5,1.6,0x7a5632,r,.7);
q=B(1.6,0);P("box",q[0],.9,q[1],1.8,.12,.12,WOOD,r,.7,null,0,.35);
for(const s of[-1,1]){q=B(.5,s*1.05);P("cyl",q[0],.7,q[1],1.4,.16,1.4,DARKW,r,.6,null,PI/2,0)}
return true};
// dried dead shrub: a bunch of bare sticks leaning out
const shrub=(x,z)=>{if(!free(x,z,.6))return false;for(let i=0;i<6;i++){const a=rng()*6.283,h=rr(.5,1.1),tl=rr(.15,.6);
P("cyl",x+Math.cos(a)*.1,h/2,z+Math.sin(a)*.1,.05,h,.05,0x8a7048,0,.7,null,Math.sin(a)*tl,Math.cos(a)*tl)}
return true};
// ruined sandstone temple gate with a sun disc, and a broken obelisk beside it
const temple=(x,z)=>{if(!free(x,z,7))return false;const sc=0xd8b07a,dk=0xb8905a;
blk(x-2.6,z,1.3,5,1.3,sc,.6);blk(x+2.6,z,1.3,3.4,1.3,sc,.6);
P("box",x,5.2,z,6.4,.6,1.3,dk,0,.7,null,0,-.08);
P("box",x,.2,z,7.2,.4,3,dk,0,.6);
P("cyl",x,6.9,z+.3,1.6,.14,1.6,0xffc040,0,1,null,PI/2,0);
c.halo(x,6.9,z+.6,0xffc040,6,.45);c.light(x,6.6,z+.6,0xffc040,1,16,true);
blk(x+7,z,1.2,4,1.2,sc,.6);P("pyr",x+7,4.6,z,1.2,1.2,1.2,sc,0,.6);
return true};
// big tall dunes outside the walls: backdrop only, no collision
for(let i=0;i<22;i++){const a=i/22*6.283+rng()*.2,r=c.H+14+rng()*12,sy=rr(10,18),sx=rr(20,32),sz=rr(16,26);
P("sph",Math.cos(a)*r,sy*.3,Math.sin(a)*r,sx,sy,sz,pick(SAND),rng()*3,.6)}
place(1,(x,z)=>temple(x,z),16);
place(c.pc(6),adobe,10);
place(c.pc(10),saguaro,5);
place(c.pc(7),barrel,5);
place(c.pc(8),skull,5);
place(c.pc(10),bone,5);
place(c.pc(5),ribs,6);
place(1,wagon,10);
place(c.pc(10),shrub,4);
place(c.pc(16),mound,3);
// heat haze: faint halos near the ground that slowly pulse in size
const haze=[];for(let i=0;i<8;i++){const s=c.halo(rr(-34,34),1,rr(-34,34),0xffe6a8,rr(6,10),.13);haze.push([s,rr(0,6),s.scale.x])}
c.anim((dt,t)=>{for(const [s,ph,b] of haze)s.scale.setScalar(b*(1+.12*Math.sin(t*.7+ph)))});
},
mon:{names:["Husk","Dust Runner","Sand Brute","Burrower","Tomb Guard","Scarab Spitter","Dune Stalker"],weights:[[0,44],[1,12],[2,10],[3,26],[4,6],[5,10],[6,12]],hp:1,spd:1,dmg:1,trait:"burrow"},
// mummy husks: sand-coloured wrapped bodies, cream bandage strips on torso, arms and head, scarab-blue eyes; tomb guards wear a gold collar
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0xc9a77a,0xb8966a,0xd2b184,0xa98c60,0xbf9d6e,0xc4a878,0x9c8462];
m[0].color.setHex(SK[k]||SK[0]);m[1].color.setHex(0x3a2a1a);m[2].color.setHex(0xe8dcc0);m[3].color.setHex(0x6a4a2a);m[4].color.setHex(0x5a4a3a);m[5].color.setHex(0x7a4a2a);m[6].color.setHex(0x5fb8ff);m[6].emissive.setHex(0x1a4a7a);
const band=new T.MeshLambertMaterial({color:0xefe2c0});m.push(band);
const eye=new T.MeshBasicMaterial({color:0x4fd0ff});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){for(let i=0;i<4;i++)add(u.torso,new T.BoxGeometry(1.03,.07,.74),band,0,-.24+i*.16,0,i%2?.04:-.04,0);
add(u.torso,new T.BoxGeometry(.09,.7,.78),band,-.3,.02,0,0,.35);add(u.torso,new T.BoxGeometry(.1,.5,.03),band,-.42,-.48,.3,.2,.3);
if(k===4){const gold=new T.MeshLambertMaterial({color:0xd4a52a});m.push(gold);add(u.torso,new T.BoxGeometry(.8,.1,.6),gold,0,.36,0)}}
if(u.head){for(const y of[.2,-.14])add(u.head,new T.BoxGeometry(.6,.07,.6),band,0,y,0);
add(u.head,new T.BoxGeometry(.08,.6,.62),band,.18,0,0,0,.4);
for(const x of[-.14,.14])add(u.head,new T.SphereGeometry(.06,6,4),eye,x,.06,.31)}
if(u.arms)for(const i of[0,1])if(u.arms[i]){add(u.arms[i],new T.BoxGeometry(.5,.06,.5),band,0,-.3,0,0,.2);add(u.arms[i],new T.BoxGeometry(.06,.5,.04),band,.12,-.8,.22,.3,0)}
if(o.boss){ // The Dune Pharaoh: striped gold-and-blue nemes headdress, gold collar and a staff with a sun disc
const nemes=new T.MeshLambertMaterial({color:0x2a5aa8}),gold=new T.MeshLambertMaterial({color:0xe0b040}),sh=new T.MeshLambertMaterial({color:0x6a4a20});m.push(nemes,gold,sh);
add(u.head,new T.BoxGeometry(.7,.42,.66),nemes,0,.42,0);
for(const y of[.3,.44,.58])add(u.head,new T.BoxGeometry(.73,.05,.69),gold,0,y,0);
for(const x of[-.4,.4])add(u.head,new T.BoxGeometry(.16,.8,.1),nemes,x,-.12,.24);
add(u.head,new T.ConeGeometry(.05,.22,5),gold,0,.28,.36,Math.PI/2);
add(u.torso,new T.BoxGeometry(.95,.14,.66),gold,0,.34,0);
add(u.arms[0],new T.BoxGeometry(.08,2.2,.08),sh,0,-1.1,.25);
add(u.arms[0],new T.CylinderGeometry(.34,.34,.07,12),new T.MeshBasicMaterial({color:0xffc040}),0,-2.25,.25,Math.PI/2)}},
boss:{name:"The Dune Pharaoh",scale:2.5,col:0xffc040,hp:1,minions:6,minionK:3,attacks:{meteor:2,dash:2,volley:2,slam:1,special:3},
// Sandstorm: three sand vortices start at the boss and travel toward the player's position; each step is telegraphed, then lands with a burst
special(e,b){const o=e.g.position,p=b.player(),H=b.H();b.flash("Sandstorm!");b.snd("roar",.8);
const dx=p.x-o.x,dz=p.z-o.z,L=Math.hypot(dx,dz)||1,nx=-dz/L,nz=dx/L;
for(let v=-1;v<=1;v++){let hv=false;
for(let i=0;i<8;i++){const f=(i+1)/8,lat=v*3*f,x=b.clamp(o.x+dx*f+nx*lat,-H+2,H-2),z=b.clamp(o.z+dz*f+nz*lat,-H+2,H-2);
b.later(e,i*250,()=>b.ring(x,z,1.8,0xe8c880,.9));
b.later(e,i*250+900,()=>{b.burst(x,.5,z,0xd8b77c,20,6);b.burst(x,1.6,z,0xf0dca0,10,3);if(!hv&&b.near(x,z,1.8)){hv=true;b.hurt(e.dmg*.6,x,z)}})}}}}
});
