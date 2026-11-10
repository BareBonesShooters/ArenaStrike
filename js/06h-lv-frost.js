"use strict";
// Level 5 · Frozen Pass: a snowbound mountain pass with frozen lakes, log cabins, snowy pines and a blizzard.
// Monsters are frost ghouls and yetis. Boss: Rimefang, a huge white yeti whose Icicle Rain freezes you in place.
LV.reg({
id:"frost",n:"Frozen Pass",tag:"Cold enough to stop a heart",mod:"blizzard",pack:3,
theme:{sky:[0x9ec8e8,0xcfe6f4,0xffffff],cloud:.7,cc:[1,1,1],stars:0,sun:{c:0xdfeeff,i:.75,d:[.7,.2,.5]},hemi:[0xcfe6ff,0xeef6ff,.9],fog:[0xe6f2fb,35,150],
gr:{base:"#e8f0f6",v:["#e0eaf2","#eef5fa","#dce8f1","#f2f7fb"],path:"#c8d8e6",edge:"#b4c8d8",plaza:"#dde8f0"},roads:false,
wall:0xdde8f0,trim:0x8aa0b4,house:[0x6a4a34,0x5a3e2a,0x7a5838],roof:[0xf4f8fc,0xeaf2f8],leaf:[0x1e4a34],trunk:0x4a3420,mount:[0xb8c8d8,0xd8e6f0],snow:1,win:0xffd890,lamp:0xffe0a0,night:0,
motes:[0xffffff,.14,.9,9,-1.2]},
// ground: snow with faint blue, frozen lake ice patches with white cracks, sled tracks, drifts and blue shadows
paint(g,N,k,rng){
for(let i=0;i<30;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*5)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(90,130,180,.14)");q.addColorStop(1,"rgba(90,130,180,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
for(let i=0;i<22;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*3)*k;g.save();g.translate(x,y);g.rotate(rng()*.6-.3);g.scale(2.4,1);const q=g.createRadialGradient(0,0,0,0,0,r);q.addColorStop(0,"rgba(255,255,255,.7)");q.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=q;g.fillRect(-r,-r,2*r,2*r);g.restore()}
for(let i=0;i<6;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*4)*k;g.beginPath();g.ellipse(x,y,r,r*.7,rng()*3,0,6.283);g.fillStyle="rgba(170,220,240,.75)";g.fill();g.strokeStyle="rgba(120,180,210,.7)";g.lineWidth=.6*k;g.stroke();
g.strokeStyle="rgba(255,255,255,.95)";g.lineWidth=.22*k;for(let j=0;j<6;j++){const a=rng()*6.283,l=r*(.5+rng()*.5);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*.7);g.stroke()}}
for(let i=0;i<5;i++){const x=rng()*N,y=rng()*N,a=rng()*6.283,l=(12+rng()*10)*k;g.save();g.translate(x,y);g.rotate(a);g.strokeStyle="rgba(110,135,160,.45)";g.lineWidth=.35*k;for(const s of[-.5,.5]){g.beginPath();g.moveTo(-l/2,s*k);g.lineTo(l/2,s*k);g.stroke()}g.restore()}
},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,PI,H}=c;
const logs=[0x5a3e28,0x4a3220,0x6a4a30],ice=[0x9ad8ff,0xb8e4ff,0x7ac8f0],greens=[0x1e4a34,0x24553a,0x1a3f2e],snow=0xf4f8fc;
// snowy pine: dark green layered cones, each with a white snow cap; collision on the trunk only
const pine=(x,z)=>{if(!free(x,z,1.4))return false;reg(x,z,.5,.5,2.2,1);P("cyl",x,.9,z,.22,1.8,.22,0x4a3420,0,.7);const col=pick(greens);
for(let i=0;i<3;i++){const r=2.1-i*.6,y=1.6+i*1.3;P("cone",x,y,z,r,1.6,r,col,rng()*3,.6);P("cone",x,y+.55,z,r*.55,.6,r*.55,snow,0,.4)}return true};
// log cabin with a thick white snow roof, icicles along the eaves and a smoking chimney
const cabin=(x,z,rot)=>{const w=rr(5,6.5),d=rr(4.5,5.5),h=2.8,sw=rot&1?d:w,sd=rot&1?w:d;if(!free(x,z,Math.max(sw,sd)/2+1.2))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
reg(x,z,sw,sd,h+2.4,1);const lc=pick(logs);
for(let i=0;i<6;i++)P("box",x,.25+i*.46,z,w,.42,d,i%2?lc:c.lerpC(lc,0x000000,.15),ry,.6);
P("gab",x,h+1.1,z,d+.9,2.2,w+.9,0x3a2a24,ry+PI/2,.75);
P("gab",x,h+1.55,z,d+1.2,1.1,w+1.2,snow,ry+PI/2,.9);
for(let t=-w/2+.4;t<w/2-.2;t+=.7)for(const s of[-1,1]){const q=L(t,s*(d/2+.15));P("cone",q[0],h-.3,q[1],.07,.6,.07,0xdff6ff,ry,.9,null,PI,0)}
let q=L(0,d/2+.03);P("box",q[0],1,q[1],1,2,.1,0x3a2a1c,ry,.9);
for(const s of[-1,1]){q=L(s*w/3.2,d/2+.04);P("box",q[0],1.5,q[1],.8,.7,.1,c.th.win,ry,1,glow)}
q=L(w*.3,-d*.15);P("box",q[0],h+1.6,q[1],.6,1.6,.6,0x4a4440,ry,.7);c.halo(q[0],h+3.6,q[1],0xdde6ee,3.5,.22);return true};
// ice crystal formation, glowing light blue, some tall
const icec=(x,z)=>{if(!free(x,z,1.2))return false;reg(x,z,1.2,1.2,1.6,1);const n=3+Math.floor(rng()*3);for(let i=0;i<n;i++){const h=rng()<.3?rr(3,5):rr(1.2,2.4),r=rr(.14,.3);P("cone",x+rr(-.5,.5),h/2,z+rr(-.5,.5),r,h,r,pick(ice),rng()*3,1,glow)}if(rng()<.4)c.halo(x,1.4,z,0x9ad8ff,2.6,.45);return true};
// snowman: stacked spheres, carrot nose, stick arms, top hat
const snowman=(x,z)=>{if(!free(x,z,1))return false;reg(x,z,1,1,2.2,1);P("sph",x,.5,z,.95,.95,.95,snow,0,.6);P("sph",x,1.45,z,.7,.7,.7,snow,0,.6);P("sph",x,2.1,z,.5,.5,.5,snow,0,.6);
P("cyl",x,2.5,z,.36,.08,.36,0x202428,0,.6);P("cyl",x,2.75,z,.26,.45,.26,0x202428,0,.6);P("cone",x,2.1,z+.4,.07,.4,.07,0xff7a20,0,1,null,PI/2,0);
for(const s of[-1,1]){P("cyl",x+s*.6,1.6,z,.05,.9,.05,0x4a3420,0,.8,null,0,s*1.1);P("sph",x-.12+s*.24,2.15,z+.42,.05,.05,.05,0x101010,0,1)}return true};
// snow-covered rock: grey stone under a white cap
const snowRock=(x,z)=>{if(!free(x,z,1.2))return false;reg(x,z,1.4,1.4,1.1,0);P("ico",x,.6,z,1.1,.85,1,0x6a7480,rng()*3,.8);P("sph",x,1.05,z,.8,.35,.7,snow,0,.6);return true};
// wooden sled with runners and slats, left in the snow
const sled=(x,z,rot)=>{if(!free(x,z,1.2))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
for(const s of[-.45,.45]){const q=L(0,s);P("box",q[0],.12,q[1],1.7,.08,.08,0x4a2e1a,ry,.6)}
for(let i=0;i<3;i++){const q=L(-.5+i*.5,0);P("box",q[0],.42,q[1],.12,.12,1.1,0x7a5030,ry,.7)}
const q=L(0,0);P("box",q[0],.3,q[1],1.1,.1,.6,0x6a4a30,ry,.7);return true};
// broken frozen bridge: planks with a missing gap and one plank hanging loose
const bridge=(x,z,rot)=>{const len=7,w=rot&1?3:len,d=rot&1?len:3;if(!free(x,z,len/2+1.5))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
for(let i=0;i<7;i++){if(i===3)continue;const q=L(-len/2+i+.5,0);P("box",q[0],.12,q[1],.9,.14,2.4,0x6a4a30,ry,.7)}
const h=L(-len/2+3.5,0);P("box",h[0]+.3,-.2,h[1],.9,.14,2.4,0x6a4a30,ry,.7,null,0,.9);
for(const s of[-1,1])for(const a of[-len/2,len/2]){const q=L(a,s*1.3);P("box",q[0],.5,q[1],.1,1,.1,0x4a3220,ry,.8)}
for(let i=0;i<4;i++){const q=L(-len/2+i*2.3,1.3);P("sph",q[0],1.05,q[1],.3,.18,.3,snow,0,.6)}return true};
// frozen lake: flat pale-blue disc with no collision, and a broken dark ice hole
const lake=(x,z)=>{if(!free(x,z,8))return false;P("cyl",x,.03,z,7,.05,7,0xa8d8f0,0,.5);P("cyl",x+1.8,.06,z-.6,1.5,.05,1.5,0x2a4a66,0,1);
for(let i=0;i<5;i++){const a=rng()*6.283;P("box",x+1.8+Math.cos(a)*1.9,.07,z-.6+Math.sin(a)*1.9,.8,.04,.1,0xeaf6ff,a,1)}return true};
place(1,lake,10);
place(c.pc(5),cabin,10);
place(c.pc(14),pine,6);
place(c.pc(12),icec,6);
place(c.pc(8),snowman,6);
place(c.pc(6),snowRock,6);
place(c.pc(3),sled,8);
place(c.pc(3),bridge,10);
// distant snowy pines outside the walls (decor only)
for(let i=0;i<40;i++){const a=i/40*6.283+rng()*.1,r=H+8+rng()*14,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rr(7,13),w=rr(2,3.2);P("cone",x,h/2,z,w,h,w,0x1e4a34,rng()*3,.5);P("cone",x,h*.8,z,w*.5,h*.3,w*.5,snow,0,.4)}
// landmark: a frozen waterfall / ice cliff just outside the west wall, with icicles hanging from the top
const FX=-(H+6);
for(let i=-4;i<=4;i++){const hh=10-Math.abs(i)*1.1+rng()*1.5;P("box",FX+rr(-.6,.6),hh/2,i*1.8,2.2,hh,1.6,0x9ad8ff,0,1,glow)}
for(let i=-4;i<=4;i++)for(let j=0;j<2;j++){const hi=10-Math.abs(i)*1.1;P("cone",FX+rr(-.4,.4),hi-.3-j*.4,i*1.8+rr(-.6,.6),.25,1.6,.25,0xdff6ff,0,1,null,PI,0)}
c.halo(FX+3,5,0,0x9ad8ff,12,.25);
},
mon:{names:["Frostbitten","Ice Runner","Yeti","Snow Crawler","Glacier Golem","Frost Spitter","Rime Stalker"],weights:[[0,18],[1,16],[2,12],[3,16],[4,12],[5,12],[6,14]],hp:1,spd:1,dmg:1,trait:"chill"},
// ice-blue or white body per type, shaggy white fur on shoulders, head and back, icicle shards on the shoulders,
// pale cyan eyes; yetis (k=2, k=4) get more fur and tusks; the boss is a white yeti with an ice crown and an icy club
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0xcfe8f5,0xbfe0f0,0xd8eef8,0xa8d0e8,0xe8f4fa,0xb0c8dc,0xc8e0f0];
const yeti=k===2||k===4||!!(o&&o.boss);
m[0].color.setHex(SK[k]||SK[0]);m[1].color.setHex(0x3a5a70);m[2].color.setHex(0xf0f8ff);m[3].color.setHex(0x8ac0e0);m[4].color.setHex(0x5a7088);m[5].color.setHex(0x7a8a9a);m[6].color.setHex(0x9ef6ff);m[6].emissive.setHex(0x3ad8ff);
const fur=new T.MeshLambertMaterial({color:0xffffff});m.push(fur);
const shard=new T.MeshBasicMaterial({color:0x9ad8ff}),eye=new T.MeshBasicMaterial({color:0x9ef6ff});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){add(u.torso,new T.BoxGeometry(1,.62,.7),m[0],0,.18,0);
const nT=yeti?30:12;for(let i=0;i<nT;i++){const tx=((i*.37)%1-.5)*(yeti?1.2:.9),ty=((i*.61)%1)*.6-.2,tz=-.2-((i*.29)%1)*.2;add(u.torso,new T.BoxGeometry(.14,.18,.14),fur,tx,ty,tz)}
for(const s of[-1,1])add(u.torso,new T.ConeGeometry(.07,.38,5),shard,s*.5,.25,0,Math.PI,0)}
if(u.head){for(const s of[-1,1])add(u.head,new T.SphereGeometry(.06,6,4),eye,s*.14,.06,.31);
for(let i=0;i<(yeti?8:5);i++)add(u.head,new T.BoxGeometry(.13,.14,.13),fur,((i*.5)%1-.5)*.45,.2+((i*.3)%1)*.1,-.12);
if(yeti)for(const s of[-1,1])add(u.head,new T.ConeGeometry(.045,.32,5),m[2],s*.16,-.2,.3,1,0)}
if(u.arms){for(let i=0;i<2;i++)for(let j=0;j<2;j++)add(u.arms[i],new T.BoxGeometry(.18,.16,.18),fur,0,-.2+j*.35,0)}
if(o.boss){ // Rimefang: white-furred yeti with an ice crown and an icy club
m[0].color.setHex(0xeef6fb);
const club=new T.MeshLambertMaterial({color:0xbfeaff});m.push(club);
const crownM=new T.MeshBasicMaterial({color:0xbfeaff});
if(u.head)for(let i=0;i<7;i++){const off=i-3,hh=.38+(3-Math.abs(off))*.1;add(u.head,new T.ConeGeometry(.07,hh,5),crownM,off*.12,.45+(3-Math.abs(off))*.04,0,0,-off*.18)}
if(u.arms)add(u.arms[1],new T.BoxGeometry(.3,1.1,.3),club,0,-1.4,0),add(u.arms[1],new T.ConeGeometry(.2,.4,5),club,0,-2.1,0,Math.PI,0)}},
boss:{name:"Rimefang",scale:2.6,col:0x9ad8ff,hp:1,minions:5,minionK:3,attacks:{slam:3,volley:2,meteor:2,special:3},
// Icicle Rain: eight rings mark the ground around you, one of them right under your feet; icicles fall after about a second
special(e,b){const p=b.player();b.flash("Rimefang: Icicle Rain!");b.snd("ghost",.8);
const pts=[[p.x,p.z]];for(let i=0;i<7;i++){const a=i/7*6.283;pts.push([b.clamp(p.x+Math.cos(a)*3.2,-b.H()+2,b.H()-2),b.clamp(p.z+Math.sin(a)*3.2,-b.H()+2,b.H()-2)])}
pts.forEach(([x,z],i)=>{b.ring(x,z,1.8,0x9ad8ff,1);b.later(e,1000+i*60,()=>{b.burst(x,1.5,z,0x9ad8ff,16,5);b.burst(x,.3,z,0xdff6ff,10,3);b.flare(x,1,z,0xbfeaff,3);
if(b.near(x,z,1.8)){b.hurt(e.dmg*.55,x,z);b.chill(2)}})})}}
});
