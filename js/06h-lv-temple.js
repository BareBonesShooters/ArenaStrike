"use strict";
// Level 8 · Overgrown Temple: a humid jungle over the ruins of an old temple. A mossy stepped ziggurat with a golden idol
// stands at the centre, with giant carved heads, vine-wrapped columns, torches and stone snakes around it.
// Monsters are vine stalkers that leap at you. Boss: The Thorn Idol, a living stone idol whose root spikes burst through the ground.
LV.reg({
id:"temple",n:"Overgrown Temple",tag:"The jungle swallowed the old gods",mod:"giants",pack:-1,
theme:{sky:[0x2a8a7a,0x9ad8a0,0xf0d080],cloud:.6,cc:[1,1,.95],stars:0,sun:{c:0xffd060,i:.85,d:[.4,.7,.3]},hemi:[0xb8e0a0,0x3a5a2a,.8],fog:[0x5a9a8a,30,140],
gr:{base:"#3f6a32",v:["#4a7a3a","#355a2a","#5a6a34","#6a5a36"],path:"#b0a894",edge:"#2e4a24",plaza:"#8a8a74"},roads:false,
wall:0x7a7a6a,trim:0x4a5a3a,house:[0x8a8a7a,0x7a7860],roof:[0x4a6a30,0x3a5a28],leaf:[0x2f7a2a,0x3f8a34,0x2a6a22],trunk:0x5a4028,mount:[0x3a6a4a,0x4a7a5a],win:0xffd060,lamp:0xffc040,
motes:[0xffe070,.1,.8,8,.1]},
// ground: jungle green with mossy patches, fallen-leaf spots and four paved stone paths from a round plaza
paint(g,N,k,rng){
for(let i=0;i<60;i++){const x=rng()*N,y=rng()*N,r=(2+rng()*4)*k,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(80,130,40,.45)");q.addColorStop(1,"rgba(60,100,30,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
for(let i=0;i<120;i++){const x=rng()*N,y=rng()*N,r=(.3+rng()*.5)*k;g.fillStyle=rng()<.5?"rgba(120,70,30,.5)":"rgba(90,52,22,.45)";g.beginPath();g.ellipse(x,y,r,r*.6,rng()*3,0,6.283);g.fill()}
g.fillStyle="rgba(170,160,138,.8)";g.beginPath();g.arc(N/2,N/2,9*k,0,6.283);g.fill();
const sl=["#b8af9a","#aca28c","#c2b9a2","#9f9684"];
for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){
 for(let s=4;s<38;s+=1.8){
  for(let w=-1;w<=1;w++){
   const al=s*k,la=w*1.8*k,x=dx?N/2+dx*al:N/2+la,y=dx?N/2+la:N/2+dy*al;
   g.fillStyle="#6a6458";g.fillRect(x-.95*k,y-.85*k,1.9*k,1.7*k);
   g.fillStyle=sl[Math.floor(rng()*sl.length)];g.fillRect(x-.8*k,y-.7*k,1.6*k,1.4*k);
  }
 }
}},
props(c){
const {P,blk,reg,free,place,rr,pick,rng,glow,lerpC,PI}=c;
const STN=[0x8a8c7e,0x9a9684,0x7a7c6e,0x8e8a78],VINE=[0x3f8a2c,0x2f7a24,0x4f9a34],BARK=[0x5a4028,0x4a3420,0x6a4a30],MOSS=[0x4a7a2a,0x3a6a24,0x5a8a34],LEAF=[0x2f7a2a,0x3f8a34,0x2a6a22,0x4a9a3a];
// keep the centre clear for the ziggurat and the four paths
const ok=(x,z,r)=>Math.hypot(x,z)>r+12&&Math.min(Math.abs(x),Math.abs(z))>r+3&&free(x,z,r);
// ---- centrepiece: stepped ziggurat, six concentric tiers each 0.5 higher, shrine and golden idol on top
const zc=[0x8a8c7e,0x7e8270,0x9a9a86,0x6e7462,0x7a7a68,0x6a6e5a];
for(let i=0;i<6;i++){const s=16-2*i;blk(0,0,s,(i+1)*.5,s,zc[i],.75)}
for(let i=0;i<5;i++){const top=(i+1)*.5,ring=7.5-i;for(let j=0;j<4;j++){const a=j*1.57+rng()*.6;P("ico",Math.cos(a)*ring,top+.03,Math.sin(a)*ring,1.2,.12,.5,pick(MOSS),a,1)}}
for(const s of[-1,1])for(let t=-6;t<=6;t+=2.4){P("box",t,.25,s*8.04,.12,.5,.08,pick(VINE),0,.6);P("box",s*8.04,.25,t,.08,.5,.12,pick(VINE),0,.6)}
for(const [sx,sz] of[[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]]){P("cyl",sx,4.5,sz,.5,3,.5,STN[1],0,.6);reg(sx,sz,.6,.6,6,1)}
P("gab",0,6.7,0,5.8,1.4,5.8,0x4a6a30,0,.7);
P("pyr",0,7.9,0,.6,1,.6,STN[0],0,.8);
P("box",0,3.7,0,1.2,1.4,.8,0xffc840,0,1,glow);
P("sph",0,4.75,0,.8,.8,.8,0xffe070,0,1,glow);
c.halo(0,4.6,0,0xffd860,6,.6);
c.light(0,4.6,0,0xffd060,1.5,22);
// giant carved stone head: square face with brow, eye sockets, nose, mouth slit and a moss cap
const head=(x,z,rot)=>{if(!ok(x,z,2.2))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs],col=pick(STN);
reg(x,z,2.8,2.8,3.6,1);
P("box",x,.45,z,3,.9,2.8,STN[2],ry,.9);
P("box",x,2.2,z,2.4,2.6,2.2,col,ry,.8);
let q=L(0,1.12);P("box",q[0],2.7,q[1],2.5,.4,.3,lerpC(col,0x000000,.15),ry,.7);
for(const s of[-1,1]){q=L(s*.55,1.2);P("box",q[0],2.3,q[1],.45,.22,.08,0x2a2a24,ry,1)}
q=L(0,1.32);P("box",q[0],2.0,q[1],.32,.7,.36,lerpC(col,0x000000,.08),ry,.8);
q=L(0,1.13);P("box",q[0],1.45,q[1],.95,.14,.06,0x1e1e18,ry,1);
P("ico",x,3.55,z,2.1,.35,1.9,MOSS[0],ry,1);
return true};
// broken column wrapped in a spiral of vines
const column=(x,z)=>{if(!ok(x,z,.9))return false;const h=rr(1.8,4.6),col=pick(STN);reg(x,z,1.1,1.1,h,1);
P("box",x,.25,z,1.3,.5,1.3,STN[2],0,.8);
P("cyl",x,h/2+.4,z,.8,h,.8,col,0,.7);
P("box",x+rr(-.1,.1),h+.5,z+rr(-.1,.1),.9,.25,.9,col,rng()*3,.8);
const n=Math.floor(h*2.2);
for(let i=0;i<n;i++){const a=i*.95,y=.5+i*(h/n)*.9;P("box",x+Math.cos(a)*.52,y,z+Math.sin(a)*.52,.12,.55,.12,pick(VINE),a,.6)}
return true};
// tall jungle tree: trunk with collision, layered flat canopy and hanging vines
const tree=(x,z)=>{if(!ok(x,z,2.6))return false;const h=rr(10,14);reg(x,z,1.3,1.3,h,1);
P("cyl",x,h/2,z,.7,h,.7,pick(BARK),0,.6,null,rr(-.03,.03),rr(-.03,.03));
for(let L=0;L<4;L++){const y=h-2.2+L*.75,r=4.6-L*.75;P("ico",x,y,z,r*2,.6,r*2,LEAF[L%LEAF.length],rng()*3,.6)}
P("sph",x,h+.6,z,2.4,1.6,2.4,LEAF[3],0,.8);
for(let i=0;i<8;i++){const a=rng()*6.283,rad=2.2+rng()*2.4,len=2.5+rng()*3.5,y0=h-2.6+rng()*1.2;P("box",x+Math.cos(a)*rad,y0-len/2,z+Math.sin(a)*rad,.07,len,.07,pick(VINE),0,.5)}
return true};
// giant fern: flattened green fronds fanned out from a root clump
const fern=(x,z)=>{if(!ok(x,z,1.8))return false;P("ico",x,.25,z,1.2,.5,1.2,0x2f6a2a,0,1);
for(let i=0;i<7;i++){const a=i/7*6.283+rng()*.3,ln=1.6+rng()*.6;P("cone",x+Math.cos(a)*.6,.7,z+Math.sin(a)*.6,.45,ln,.14,pick(LEAF),a,.5,null,0,.75)}
return true};
// stone archway: two pillars with a moss-covered lintel
const arch=(x,z,rot)=>{if(!ok(x,z,3))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs],col=pick(STN);
for(const s of[-1,1]){const q=L(s*2,0);reg(q[0],q[1],.9,.9,3.6,1);P("box",q[0],1.8,q[1],1,3.6,1,col,ry,.8)}
P("box",x,3.85,z,5.4,.7,1.3,col,ry,.8);
P("ico",x,4.25,z,5,.3,1.4,MOSS[1],ry,1);
return true};
// burning torch on a post, with a warm halo
const torch=(x,z)=>{if(!ok(x,z,.6))return false;reg(x,z,.3,.3,2.6,1);
P("cyl",x,1.3,z,.22,2.6,.22,0x4a3a2a,0,.7);P("cyl",x,2.7,z,.42,.3,.42,0x2a2018,0,.8);
P("ico",x,2.98,z,.3,.5,.3,0xffb040,0,1,glow);c.halo(x,3.2,z,0xffa030,3.4,.7);c.light(x,3.1,z,0xffa030,.9,11,true);return true};
// crumbled moss-covered wall, 1-1.5 m high, usable as cover
const wall=(x,z,rot)=>{const len=rr(4,7),th=.8,h=rr(1,1.5),w=rot&1?th:len,d=rot&1?len:th;if(!ok(x,z,len/2+.5))return false;
blk(x,z,w,h,d,pick(STN),.8);
for(let i=0;i<4;i++){const o=rr(-len/2+.8,len/2-.8);P("ico",rot&1?x:x+o,h+.08,rot&1?z+o:z,rr(.8,1.6),.22,rr(.8,1.6),pick(MOSS),0,1)}
for(let i=0;i<3;i++){const o=rr(-len/2+.5,len/2-.5),sg=i%2?1:-1;P("box",rot&1?x+sg*(d/2+.03):x+o,h*.55,rot&1?z+o:z+sg*(d/2+.03),rot&1?.05:.14,h*.9,rot&1?.14:.05,pick(MOSS),0,.6)}
return true};
// stone snake statue: a coiled body of stone segments with a head and glowing eyes
const snake=(x,z,rot)=>{if(!ok(x,z,3.5))return false;const ry=rot*PI/2,cs=Math.cos(ry),sn=Math.sin(ry),L=(a,b)=>[x+a*cs+b*sn,z-a*sn+b*cs],col=pick(STN);
for(let i=0;i<10;i++){const a=-3+i*.62,r=.5-i*.02,q=L(a,Math.sin(i*.9)*.8);P("sph",q[0],r,q[1],r*2,r*2,r*2,col,ry,.8)}
let q=L(3.2,0);P("box",q[0],.4,q[1],1.2,.7,.9,col,ry,.8);
for(const s of[-1,1]){q=L(3.5,s*.32);P("box",q[0],.62,q[1],.18,.18,.18,0xffd040,ry,1,glow)}
return true};
place(c.pc(4),head,10);
place(c.pc(8),column,6);
place(c.pc(10),tree,8);
place(c.pc(8),fern,6);
place(c.pc(3),arch,10);
place(c.pc(8),torch,6);
place(c.pc(10),wall,6);
place(c.pc(3),snake,10);
// dense jungle backdrop outside the walls (decor only, no collision)
for(let i=0;i<c.pc(60);i++){const a=i/60*6.283+rng()*.08,r=c.H+5+rng()*12,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rr(9,15),s=rr(5,8);
P("cyl",x,h/2,z,.8,h,.8,pick(BARK),0,.5);
P("ico",x,h*.85,z,s*1.8,s*.9,s*1.8,pick(LEAF),rng()*3,.5);
P("sph",x,h*.9+1.4,z,s*1.2,s*.7,s*1.2,pick(LEAF),0,.7)}
// low ground mist
for(let i=0;i<6;i++)c.halo(rr(-35,35),.8,rr(-35,35),0x9ad8b0,rr(7,11),.14);
},
mon:{names:["Vine Stalker","Thorn Runner","Root Brute","Creeper","Stone Guardian","Spore Spitter","Jungle Prowler"],weights:[[0,26],[1,20],[2,12],[3,16],[4,8],[5,10],[6,8]],hp:1,spd:1,dmg:1,trait:"leap"},
// bark body with mossy green tones per type, leafy fronds on shoulders and head, thorns on the arms,
// a carved wooden tribal mask with painted stripes and glowing yellow eyes. k=4 is grey stone with moss.
skin(g,k,o){const u=g.userData,m=u.mats;
const add=(par,geo,mat,x,y,z,rx,rz)=>{const q=new T.Mesh(geo,mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;q.raycast=()=>{};par.add(q);return q};
const fr=(par,mat,r,h,x,y,z,rx,rz)=>{const q=add(par,new T.ConeGeometry(r,h,4),mat,x,y,z,rx,rz);q.scale.set(1,1,.35);return q};
if(o&&o.boss&&u.torso&&u.head){ // The Thorn Idol: a living stone idol with a carved mask, a golden headdress and a gem in its chest
const BODY=[0x8a8258];
const stone=new T.MeshLambertMaterial({color:0x9a9274}),gold=new T.MeshLambertMaterial({color:0xd8b040}),vine=new T.MeshLambertMaterial({color:0x3f8a2c}),dark=new T.MeshLambertMaterial({color:0x2a2418}),gem=new T.MeshBasicMaterial({color:0xffe060});
m[0].color.setHex(BODY[0]);m[1].color.setHex(0x2a2418);m[3].color.setHex(0x4f7a2a);m[4].color.setHex(0x5a5a50);
m.push(stone,gold,vine,dark);
add(u.torso,new T.BoxGeometry(1.2,.9,.5),stone,0,.25,.22);
add(u.torso,new T.SphereGeometry(.17,8,6),gem,0,.3,.5);
add(u.head,new T.BoxGeometry(.95,.95,.14),stone,0,.02,.36);
add(u.head,new T.BoxGeometry(1.05,.14,.2),stone,0,.36,.42);
add(u.head,new T.BoxGeometry(.3,.4,.2),stone,0,-.02,.48);
add(u.head,new T.BoxGeometry(.62,.08,.06),dark,0,-.3,.46);
for(const x of[-.24,.24]){add(u.head,new T.BoxGeometry(.2,.1,.05),dark,x,.12,.44);add(u.head,new T.SphereGeometry(.07,6,4),gem,x,.12,.48)}
for(let i=0;i<7;i++){const a=(i-3)*.26;add(u.head,new T.BoxGeometry(.1,1.1,.45),gold,Math.sin(a)*.55,.62,-.12,0,-a)}
if(u.arms)for(const a of u.arms){for(let i=0;i<5;i++)add(a,new T.BoxGeometry(.1,.1,.42),vine,0,-.3-i*.22,0,i%2?.5:-.5,.7)}
return}
const BARK=[0x6a4a2a,0x5a7a3a,0x7a5a34,0x4a6a3a,0x8a8a84,0x6a8a4a,0x5a4a2e],MOSS=[0x3f7a2a,0x4f8a34,0x3a6a26,0x5a8a3a,0x4a5a48,0x6aa040,0x6a7a30];
m[0].color.setHex(BARK[k]||BARK[0]);m[1].color.setHex(0x2a2018);m[2].color.setHex(0xc8b890);m[3].color.setHex(MOSS[k]||MOSS[0]);
m[4].color.setHex(0x4a4a44);m[5].color.setHex(0x6a4a2a);m[6].color.setHex(0xffe040);m[6].emissive.setHex(0xffb000);
const leaf=new T.MeshLambertMaterial({color:MOSS[k]||MOSS[0]}),wood=new T.MeshLambertMaterial({color:k===4?0x8a8a84:0x6a4a2a}),red=new T.MeshLambertMaterial({color:0xb8452a}),ochre=new T.MeshLambertMaterial({color:0xd8a030}),eye=new T.MeshBasicMaterial({color:0xffe040});
m.push(leaf,wood,red,ochre);
if(u.torso){fr(u.torso,leaf,.12,.9,-.5,.45,0,0,.9);fr(u.torso,leaf,.12,.9,.5,.45,0,0,-.9)}
if(u.head){
for(let i=0;i<4;i++)fr(u.head,leaf,.12,.8,(i-1.5)*.16,.42,-.02,-.6,(i-1.5)*-.3);
add(u.head,new T.BoxGeometry(.42,.44,.06),wood,0,.02,.33);
add(u.head,new T.BoxGeometry(.42,.035,.03),red,0,.16,.37);
add(u.head,new T.BoxGeometry(.42,.035,.03),ochre,0,-.1,.37);
add(u.head,new T.BoxGeometry(.3,.03,.03),red,0,-.18,.37);
for(const x of[-.12,.12])add(u.head,new T.SphereGeometry(.05,6,4),eye,x,.06,.39);
}
if(u.arms)u.arms.forEach((a,j)=>{const s=j?1:-1;for(let i=0;i<3;i++)add(a,new T.ConeGeometry(.04,.16,4),m[2],s*.13,-.1-i*.2,0,0,-s*1.3)});
},
boss:{name:"The Thorn Idol",scale:2.6,col:0xffd84a,hp:1,minions:5,minionK:6,attacks:{slam:2,volley:2,nova:1,meteor:1,special:3},
// Root Spikes: a line of seven rings marches from the idol toward you; each erupts 0.8 s after its ring appears.
// A second line follows at 30 degrees to one side.
special(e,b){const p=b.player(),bp=e.g.position,bx=bp.x,bz=bp.z;b.flash("The Thorn Idol: root spikes!");b.snd("dig",.9);
const dx=p.x-bx,dz=p.z-bz,L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
const line=(ang,t0)=>{const cs=Math.cos(ang),sn=Math.sin(ang),vx=ux*cs-uz*sn,vz=ux*sn+uz*cs;
for(let i=0;i<7;i++){const d=2.2*(i+1),x=b.clamp(bx+vx*d,-b.H()+2,b.H()-2),z=b.clamp(bz+vz*d,-b.H()+2,b.H()-2);
b.later(e,t0+i*150,()=>b.ring(x,z,1.5,0x7fb84a,.8));
b.later(e,t0+i*150+800,()=>{b.burst(x,.4,z,0x5a4632,16,5);b.burst(x,1.1,z,0x6aa84a,8,3);b.crack(x,z,0x6aa84a);b.snd("slam",.5);if(i===6)b.shake(250);if(b.near(x,z,1.6))b.hurt(e.dmg*.6,x,z)})}};
line(0,0);line(.5236,1900);
}}
});
