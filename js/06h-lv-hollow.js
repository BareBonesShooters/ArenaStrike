"use strict";
// Level 1 · Haunted Hollow: a graveyard village at dusk. Log cabins, crooked graves, dead trees, jack-o'-lanterns.
// Monsters are rotting zombies that sometimes climb back out of the ground. Boss: Gravemaw, who raises hands from the earth.
LV.reg({
id:"hollow",n:"Haunted Hollow",tag:"The dead don't stay buried",mod:"blackout",pack:0,
theme:{sky:[0x1a1030,0x5a2d58,0xe08a4a],cloud:.5,cc:[.9,.7,.75],stars:.5,sun:{c:0xff9a5a,i:.65,d:[.8,.22,.45]},hemi:[0xb58ac8,0x2a3020,.7],fog:[0x4a3550,22,120],
gr:{base:"#3e4a32",v:["#36412b","#465238","#2f3a27","#4b4a34"],path:"#5a4c3a",edge:"#3a3026",plaza:"#5e5648"},roads:false,
wall:0x4a4038,trim:0x3a2e26,house:[0x6a4a32,0x5a3e2a,0x7a5838],roof:[0x2a2228,0x3a2a2a],leaf:[0x2a2a22],trunk:0x2e2620,mount:[0x2a2238,0x3a2a44],win:0xffb04a,lamp:0xffa040,night:.5,
motes:[0xb6ff7a,.16,.85,7,.12]},
// ground: dark grass with dirt grave patches and a worn earth ring
paint(g,N,k,rng){
for(let i=0;i<70;i++){const x=rng()*N,y=rng()*N,w=(1.2+rng()*.8)*k,h=(2.2+rng())*k;g.fillStyle=rng()<.5?"rgba(70,52,34,.55)":"rgba(52,40,28,.5)";g.save();g.translate(x,y);g.rotate((rng()-.5)*.4);g.fillRect(-w/2,-h/2,w,h);g.restore()}
g.strokeStyle="rgba(90,70,50,.35)";g.lineWidth=2.2*k;g.beginPath();g.arc(N/2,N/2,13*k,0,6.283);g.stroke();
for(let i=0;i<30;i++){const x=rng()*N,y=rng()*N,r=(3+rng()*6)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(120,255,120,.06)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const stone=[0x6e6f72,0x7c7a74,0x5c5e62],wood=[0x5a3e28,0x4a3220,0x6a4a30];
// gravestone: slab, cross or obelisk, slightly tilted
const grave=(x,z,r)=>{if(!free(x,z,.9))return false;const t=rng(),col=pick(stone),ry=r*PI/2+rr(-.25,.25),tl=rr(-.12,.12);reg(x,z,.9,.5,1);
if(t<.5){P("box",x,.55,z,.8,1.1,.22,col,ry,.6,null,0,tl);P("cyl",x,1.1,z,.8,.22,.22,col,ry,.6,null,0,PI/2)}
else if(t<.8){P("box",x,.7,z,.18,1.4,.18,col,ry,.6,null,0,tl);P("box",x,1.0,z,.7,.16,.18,col,ry,.6,null,0,tl)}
else{P("box",x,.15,z,.6,.3,.6,col,ry,.6);P("pyr",x,.95,z,.38,1.4,.38,col,ry,.6)}
P("box",x,.04,z+.0,1.0,.08,1.8,0x3a2a1c,ry,.9);return true};
// dead tree: bare trunk with crooked branches
const dead=(x,z)=>{if(!free(x,z,1.2))return false;reg(x,z,.6,.6,4);const h=rr(3.5,5.5),tc=c.th.trunk;P("cyl",x,h/2,z,.45,h,.45,tc,0,.5,null,rr(-.08,.08),rr(-.08,.08));
for(let i=0;i<4;i++){const a=rng()*6.283,y=h*(.5+i*.12),l=rr(1.2,2.2);P("box",x+Math.cos(a)*l*.45,y+l*.25,z+Math.sin(a)*l*.45,.14,l,.14,tc,-a,.6,null,0,(PI/2-.6)*(Math.cos(a)>0?-1:1))}return true};
// log cabin with a glowing window and a steep roof
const cabin=(x,z,rot)=>{const w=rr(5,6.5),d=rr(4.5,5.5),h=2.8,sw=rot&1?d:w,sd=rot&1?w:d;if(!free(x,z,Math.max(sw,sd)/2+1.2))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs];
reg(x,z,sw,sd,h+2.4,1);const lc=pick(wood);
for(let i=0;i<6;i++){P("box",x,.25+i*.46,z,w,.42,d,i%2?lc:lerpC(lc,0x000000,.15),ry,.6)}
for(const [a,b] of[[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){const q=L(a,b);P("box",q[0],h/2,q[1],.35,h+.2,.35,lerpC(lc,0x000000,.3),ry,.6)}
P("gab",x,h+1.1,z,d+.9,2.2,w+.9,pick(c.th.roof),ry+PI/2,.75);
let q=L(0,d/2+.03);P("box",q[0],1,q[1],1,2,.1,0x2a1a10,ry,.9);
for(const s of[-1,1]){q=L(s*w/3.2,d/2+.04);P("box",q[0],1.5,q[1],.8,.7,.1,c.th.win,ry,1,glow)}
q=L(w*.3,-d*.15);P("box",q[0],h+2,q[1],.6,1.4,.6,0x4a4440,ry,.7);return true};
// jack-o'-lantern with a glowing face
const pumpkin=(x,z)=>{if(!free(x,z,.6))return false;const s=rr(.5,.8);P("ico",x,s*.4,z,s,s*.8,s,0xd8701c,rng()*3,.6);P("cyl",x,s*.85,z,.08,.2,.08,0x3a5a20,0,1);P("box",x,s*.45,z+s*.42,s*.5,s*.18,.04,0xffd040,0,1,glow);return true};
// lantern post with a warm halo
const lantern=(x,z)=>{if(!free(x,z,.5))return false;reg(x,z,.25,.25,3);P("box",x,1.4,z,.14,2.8,.14,0x2a2420,0,.7);P("box",x+.35,2.75,z,.7,.08,.08,0x2a2420,0,.8);P("box",x+.7,2.45,z,.28,.4,.28,0xffb04a,0,1,glow);c.halo(x+.7,2.45,z,0xffa040,2.2,.6);return true};
// iron fence run with spiked tips
const fence=(x,z,rot)=>{const len=rr(5,8),w=rot&1?.2:len,d=rot&1?len:.2;if(!free(x,z,len/2+.3))return false;reg(x,z,w,d,1.4);
P("box",x,1.1,z,w,.06,d,0x1a1a1e,0,1);P("box",x,.4,z,w,.06,d,0x1a1a1e,0,1);for(let i=0;i<=len/.35;i++){const o=-len/2+i*.35,px=rot&1?x:x+o,pz=rot&1?z+o:z;P("box",px,.65,pz,.05,1.3,.05,0x1a1a1e,0,1);P("cone",px,1.38,pz,.09,.18,.09,0x1a1a1e,0,1)}return true};
// mausoleum landmark: stone box, columns, pediment, green flame bowls
const mausoleum=(x,z)=>{if(!free(x,z,5))return false;blk(x,z,6,3.6,4.5,0x6a6a6e,.6);P("gab",x,4.3,z,5,1.4,6.6,0x55555a,PI/2,.7);
for(const s of[-2.4,-.8,.8,2.4]){P("cyl",x+s,1.8,z+2.6,.45,3.6,.45,0x8a8a8a,0,.6)}reg(x,z+2.6,6,.6,3.6);P("box",x,3.75,z+2.6,6.4,.3,1,0x7a7a7e,0,.7);
for(const s of[-1,1]){P("cyl",x+s*3.6,.6,z+3.4,.7,1.2,.7,0x4a4a4e,0,.6);P("cone",x+s*3.6,1.5,z+3.4,.5,.8,.5,0x7dff6a,0,1,glow);c.halo(x+s*3.6,1.6,z+3.4,0x7dff6a,2.4,.7)}
c.light(x,3,z+4,0x7dff6a,1.4,18);return true};
// stone well
const well=(x,z)=>{if(!free(x,z,1.6))return false;reg(x,z,2,2,1);P("cyl",x,.5,z,2,1,2,0x6a6a6e,0,.6);P("cyl",x,1.01,z,1.6,.04,1.6,0x0a1410,0,1);for(const s of[-1,1])P("box",x+s*.9,1.5,z,.15,2,.15,0x4a3220,0,.7);P("gab",x,2.7,z,1.6,.7,2.2,0x3a2a2a,0,.7);return true};
place(1,(x,z)=>mausoleum(x,z),18);
place(c.pc(5),cabin,10);
// rows of graves in a few clusters
for(let g=0;g<5;g++){const cx=rr(-30,30),cz=rr(-30,30);if(Math.hypot(cx,cz)<16)continue;for(let i=0;i<4;i++)for(let j=0;j<3;j++)grave(cx+i*1.6+rr(-.2,.2),cz+j*2.4+rr(-.2,.2),0)}
place(c.pc(14),grave,6);place(c.pc(12),dead,6);place(c.pc(10),pumpkin,6);place(c.pc(7),lantern,6);place(c.pc(5),fence,8);place(1,well,10);
place(c.pc(6),(x,z)=>c.rock(x,z),6);
// distant bare treeline outside the walls
for(let i=0;i<40;i++){const a=i/40*6.283+rng()*.1,r=c.H+8+rng()*14,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rr(7,13);P("cone",x,h/2,z,rr(2,3.4),h,rr(2,3.4),0x1e2420,rng()*3,.5)}
// low ground mist sprites
for(let i=0;i<14;i++)c.halo(rr(-35,35),.4,rr(-35,35),0x8a7aa0,rr(7,12),.18);
},
mon:{names:["Rotter","Shambler","Grave Brute","Crawler","Bloated Corpse","Bile Spitter","Ghoul"],weights:[[0,55],[1,22],[2,12],[3,14],[4,6],[5,8],[6,6]],hp:1,spd:1,dmg:1,trait:"rise"},
// rotting skin, torn shirt, exposed ribs, slack jaw and green eyes; each type gets its own skin tint
skin(g,k,o){const u=g.userData,m=u.mats,SK=[0x7f9a6a,0x8a9a78,0x6a7a52,0x9aa080,0x8aa060,0x6aa04a,0x9a8a90];
m[0].color.setHex(SK[k]||SK[0]);m[4].color.setHex(0x3a3a42);m[3].color.setHex(0x5a4a3a);m[5].color.setHex(0x6a2a20);m[1].color.setHex(0x2a2620);m[6].color.setHex(0x9dff6a);m[6].emissive.setHex(0x3a8a1a);
const cloth=new T.MeshLambertMaterial({color:[0x5a6a8a,0x7a5a4a,0x4a5a4a,0x6a6a5a][k%4]});m.push(cloth);
const bone=new T.MeshLambertMaterial({color:0xd8d4c0});m.push(bone);const eye=new T.MeshBasicMaterial({color:0xb6ff7a});
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
if(u.torso){add(u.torso,new T.BoxGeometry(1,.62,.7),cloth,0,.18,0);for(let i=0;i<3;i++)add(u.torso,new T.BoxGeometry(.38,.05,.04),bone,.12,-.08+i*.1,.37);add(u.torso,new T.BoxGeometry(.2,.4,.05),cloth,-.35,-.42,.3,0,.3)}
if(u.head){for(const x of[-.14,.14])add(u.head,new T.SphereGeometry(.065,6,4),eye,x,.06,.31);add(u.head,new T.BoxGeometry(.4,.12,.3),bone,0,-.3,.12,.35);add(u.head,new T.BoxGeometry(.5,.1,.5),cloth,0,.3,0,0,.15)}
if(o.boss){ // Gravemaw: a gravedigger giant with a headstone on its back, a bone crown and a lantern
const st=new T.MeshLambertMaterial({color:0x7a7a7e});m.push(st);add(u.torso,new T.BoxGeometry(.9,1.1,.2),st,0,.3,-.5,0,.08);
for(let i=0;i<5;i++)add(u.head,new T.ConeGeometry(.06,.35,5),bone,(i-2)*.12,.42,0,0,(i-2)*.2);
const lan=add(u.arms[1],new T.BoxGeometry(.25,.32,.25),new T.MeshBasicMaterial({color:0x9dff6a}),0,-1.3,0);
const sh=new T.MeshLambertMaterial({color:0x5a4a3a});m.push(sh);add(u.arms[0],new T.BoxGeometry(.08,1.8,.08),sh,0,-1,.25);add(u.arms[0],new T.BoxGeometry(.4,.5,.06),st,0,-1.9,.25)}},
boss:{name:"Gravemaw",scale:2.4,col:0x7dff6a,hp:1,minions:5,minionK:0,attacks:{slam:3,volley:2,nova:1,dash:1,special:3},
// Grave Rise: six graves crack open around you, hands burst out, and two rotters crawl free
special(e,b){const p=b.player();b.flash("Gravemaw: the graves open!");b.snd("dig",.9);
for(let i=0;i<6;i++){const a=i/6*6.283,x=b.clamp(p.x+Math.cos(a)*3.6,-b.H()+2,b.H()-2),z=b.clamp(p.z+Math.sin(a)*3.6,-b.H()+2,b.H()-2);b.ring(x,z,1.6,0x9dff6a,1);
b.later(e,950+i*60,()=>{b.burst(x,.4,z,0x5a4632,18,6);b.burst(x,1,z,0x9dff6a,8,3);b.crack(x,z,0x7dff6a);if(b.near(x,z,1.7))b.hurt(e.dmg*.55,x,z)})}
b.later(e,1300,()=>{b.summon(e,2,0);b.shake(300)})}}
});
