"use strict";
// ---------- Wave phases (Monster Rush): like the corrupted wave, but each one reshapes the arena and the fight in its own way ----------
// Whiteout: a blizzard, tougher slow monsters, some frozen solid until you come close, ice shatters when they die
// Blight: sick green haze, toxic clouds bloom around you, bloated monsters burst into more of them
// Firestorm: embers and a red sky, meteors rain on the arena, cinder monsters explode and chain into their friends
const Phase=(()=>{
const DEF={
frost:{name:"WHITEOUT",sub:"a blizzard rolls in. Some monsters are frozen solid until you get close",rew:"Whiteout",col:"#cfe8ff",
sky:[0xa9c4d8,0xc4d8e8,0xe6f1f8],fog:0xcbdceb,hemiC:0xdcedff,hemiG:0x5c7084,sun:0xe2f1ff,cloud:0xffffff,fogN:.5,fogF:.5,sunK:.75,
vig:"radial-gradient(ellipse at center,rgba(255,255,255,0) 38%,rgba(185,222,255,.3) 72%,rgba(236,247,255,.78) 100%)",
pt:{col:0xffffff,size:.3,vy:-3.2,vx:1.7,n:170,top:20},tint:0xcfeaff,em:0x1b3a52},
blight:{name:"BLIGHT",sub:"toxic clouds are blooming. Stay out of the green",rew:"Blight",col:"#b6f26a",
sky:[0x0c1806,0x2b3d0b,0x70921a],fog:0x1d2a08,hemiC:0xb0dc50,hemiG:0x182206,sun:0xcce868,cloud:0x9cc240,fogN:.45,fogF:.55,sunK:.65,
vig:"radial-gradient(ellipse at center,rgba(0,0,0,0) 36%,rgba(60,96,10,.4) 70%,rgba(6,12,2,.9) 100%)",
pt:{col:0xa4ec4e,size:.55,vy:.7,vx:.5,n:130,top:14},tint:0xb6e04a,em:0x2c4a08},
ember:{name:"FIRESTORM",sub:"the sky is burning. Watch for the red rings",rew:"Firestorm",col:"#ffa24a",
sky:[0x1c0700,0x701c04,0xe8701c],fog:0x2b0f04,hemiC:0xff8c3c,hemiG:0x2c0d02,sun:0xff8a2a,cloud:0xff7a2a,fogN:.55,fogF:.6,sunK:.85,
vig:"radial-gradient(ellipse at center,rgba(0,0,0,0) 36%,rgba(140,40,0,.42) 70%,rgba(18,4,0,.92) 100%)",
pt:{col:0xff8a2a,size:.36,vy:2.6,vx:.9,n:160,top:22},tint:0xff7a30,em:0x5a1604}};
const TMP=new T.Color();
let kind=null,on=false,K=0,TG=0,snap=null,pts=null,ov=null,hz=[],hzT=2,last=-9,gT=0;

function reset(){
on=false;kind=null;K=0;TG=0;snap=null;
if(ov){ov.remove();ov=null}
if(pts){sc.remove(pts);pts.geometry.dispose();pts.material.dispose();pts=null}
for(const h of hz)dropCloud(h);hz.length=0}

// ---- wave start / end
function pick(){
// not on boss, ghost or corrupted waves, not twice in a row, and never while the corrupted tint is still fading out
if(snap||K>0||typeof corrK!=="undefined"&&corrK>0)return null;
if(wave<6||wave-last<3||PT.on||!sc.fog||rnd()>.16)return null;
return["frost","blight","ember"][Math.floor(rnd()*3)]}
function begin(k){
const d=DEF[k];if(!d||!sc.fog)return false;
reset();kind=k;on=true;TG=1;last=wave;hzT=2.5;gT=3;
const u=Sky.u;snap={cT:u.cT.value.clone(),cM:u.cM.value.clone(),cH:u.cH.value.clone(),cc:u.cc.value.clone(),fog:sc.fog.color.clone(),near:sc.fog.near,far:sc.fog.far,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),sc:sun.color.clone(),si:sun.intensity,stars:u.stars.value};
ov=document.createElement("div");ov.style.cssText="position:fixed;inset:-3%;z-index:8;pointer-events:none;opacity:0;background:"+d.vig;document.body.appendChild(ov);
const n=SOFT?Math.round(d.pt.n*.4):d.pt.n,pos=new Float32Array(n*3);
for(let i=0;i<n;i++){pos[i*3]=P.x+(rnd()-.5)*70;pos[i*3+1]=rnd()*d.pt.top;pos[i*3+2]=P.z+(rnd()-.5)*70}
const geo=new T.BufferGeometry();geo.setAttribute("position",new T.BufferAttribute(pos,3));
pts=new T.Points(geo,new T.PointsMaterial({map:SOFTDOT,color:d.pt.col,size:d.pt.size,transparent:true,opacity:0,depthWrite:false,blending:k==="frost"?T.NormalBlending:T.AdditiveBlending,fog:false}));pts.frustumCulled=false;sc.add(pts);
try{snd("cstart",.7);if(k==="frost")tone(190,2.2,"sine",.1,92);else if(k==="blight")tone(64,2.4,"sawtooth",.12,46);else tone(92,2,"square",.07,210)}catch(e){}
flash(d.name+" · wave "+wave+" · "+d.sub,3600);try{flashScreen(d.col)}catch(e){}
return true}
// the wave is over: settle the lighting back, pay out, and hand over a power-up. Returns true when it handled the clear screen
function clear(b){
if(!on)return false;
const d=DEF[kind],bonus=Math.round(b*.5);on=false;TG=0;
for(const h of hz)h.t=Math.max(h.t,h.life-.8);
S.coins+=bonus;P.hp=Math.min(P.max,P.hp+P.max*.3);sv();
flash(d.name+" CLEARED  +"+(b+bonus)+" coins · pick a power-up",2800);snd("win");wn=1e9;
setTimeout(()=>{if(typeof offerCorruptedPU==="function")offerCorruptedPU(1,d.rew)},600);
return true}

// ---- environment, particles, hazards
function frame(dt){
if(!snap&&!pts)return;
K+=(TG-K)*Math.min(1,dt*1.8);if(TG===0&&K<.01)K=0;
const d=DEF[kind];if(!d)return;
const k=K,u=Sky.u,B=snap,t=performance.now()/1000;
if(B&&sc.fog){
u.cT.value.copy(B.cT).lerp(TMP.setHex(d.sky[0]),k*.95);u.cM.value.copy(B.cM).lerp(TMP.setHex(d.sky[1]),k*.93);u.cH.value.copy(B.cH).lerp(TMP.setHex(d.sky[2]),k*.9);u.cc.value.copy(B.cc).lerp(TMP.setHex(d.cloud),k*.75);
sc.fog.color.copy(B.fog).lerp(TMP.setHex(d.fog),k*.9);if(sc.background&&sc.background.isColor)sc.background.copy(sc.fog.color);
sc.fog.near=B.near*(1-d.fogN*k);sc.fog.far=B.far*(1-d.fogF*k)+Math.sin(t*1.3)*4*k;
hemi.color.copy(B.hc).lerp(TMP.setHex(d.hemiC),k*.75);hemi.groundColor.copy(B.hg).lerp(TMP.setHex(d.hemiG),k*.8);
sun.color.copy(B.sc).lerp(TMP.setHex(d.sun),k*.8);sun.intensity=B.si*(1-(1-d.sunK)*k);u.stars.value=B.stars*(1-k*.8);
if(TG===0&&k===0)snap=null}
if(ov)ov.style.opacity=(k*(.82+.12*Math.sin(t*2.4))).toFixed(3);
if(pts){
const a=pts.geometry.attributes.position,arr=a.array,n=arr.length/3,pc=d.pt;pts.material.opacity=(kind==="frost"?.9:.8)*k;
for(let i=0;i<n;i++){const j=i*3;arr[j+1]+=dt*pc.vy*(.7+(i%5)*.15);arr[j]+=(pc.vx+Math.sin(t*.8+i)*.6)*dt;arr[j+2]+=Math.cos(t*.6+i)*dt*.5;
if(arr[j+1]>pc.top)arr[j+1]=0;else if(arr[j+1]<0)arr[j+1]=pc.top;
const dx=arr[j]-P.x,dz=arr[j+2]-P.z;if(dx>35)arr[j]-=70;else if(dx<-35)arr[j]+=70;if(dz>35)arr[j+2]-=70;else if(dz<-35)arr[j+2]+=70}
a.needsUpdate=true;
if(TG===0&&k===0){sc.remove(pts);pts.geometry.dispose();pts.material.dispose();pts=null;if(ov){ov.remove();ov=null}kind=null}}
if(!on||state!=="play"||menuOpen||P.dead>0)return hazards(dt,0);
hazards(dt,1)}
function hazards(dt,live){
for(let i=hz.length-1;i>=0;i--){const h=hz[i];h.t+=dt;
if(h.t>=h.life){dropCloud(h);hz.splice(i,1);continue}
if(h.t<0)continue;
const fade=Math.min(1,h.t/.4)*Math.min(1,(h.life-h.t)/.9);h.m.material.opacity=(.3+.07*Math.sin(h.t*4))*fade;h.m.scale.setScalar(1+.04*Math.sin(h.t*3));
if(live&&fade>.5&&Math.hypot(P.x-h.x,P.z-h.z)<h.r&&P.y<1.6){h.tick-=dt;if(h.tick<=0){h.tick=.65;hit(Math.min(P.max*.07,2.5+wave*.35),{x:h.x,z:h.z})}}
if(live&&(fr&7)===0&&rnd()<.5)Fx.burst({x:h.x+(rnd()-.5)*h.r*1.4,y:.2,z:h.z+(rnd()-.5)*h.r*1.4},0x9be84a,1,.8,.12,1.4,-.4)}
if(!live||!kind)return;
if(kind==="blight"){hzT-=dt;if(hzT<=0&&hz.length<7){hzT=2.6+rnd()*2;const a=rnd()*6.283,r=rnd()*6;cloud(clamp(P.x+P.vx*1.1+Math.cos(a)*r,-H+3,H-3),clamp(P.z+P.vz*1.1+Math.sin(a)*r,-H+3,H-3),3.2,7,1.1)}}
else if(kind==="ember"){hzT-=dt;if(hzT<=0){hzT=2.2+rnd()*1.2;const n=wave>=12?2:1;for(let i=0;i<n;i++){const a=rnd()*6.283,r=i?3+rnd()*8:rnd()*3;meteor(clamp(P.x+P.vx*.5+Math.cos(a)*r,-H+2,H-2),clamp(P.z+P.vz*.5+Math.sin(a)*r,-H+2,H-2))}}}
else if(kind==="frost"){gT-=dt;if(gT<=0){gT=7+rnd()*6;gust()}}}
function cloud(x,z,r,life,warn){
const m=new T.Mesh(new T.CircleGeometry(r,28),new T.MeshBasicMaterial({color:0x7be03a,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false}));
m.rotation.x=-Math.PI/2;m.position.set(x,.08,z);m.raycast=()=>{};sc.add(m);
hz.push({x,z,r,t:-warn,life,m,tick:.3});if(warn>0)ringFx(x,z,r,0x9be84a,warn)}
function dropCloud(h){sc.remove(h.m);h.m.geometry.dispose();h.m.material.dispose()}
function meteor(x,z){
ringFx(x,z,2.8,0xff5a1a,.95);
setTimeout(()=>{if(state!=="play"||!on)return;
Fx.burst({x,y:.4,z},0xff8a2a,24,8,.12,2,22);ringFx(x,z,3.1,0xffd24a,.35);snd("kill",.4);
if(Math.hypot(P.x-x,P.z-z)<2.9&&P.y<2.2&&los(x,.9,z,P.x,P.y+1,P.z))hit(Math.min(P.max*.2,7+wave*.8),{x,z});
for(const o of E.slice())if(o.t==="mon"&&!o.boss&&Math.hypot(o.g.position.x-x,o.g.position.z-z)<3.1)hurtE(o,60+wave*6)},1000)}
// a cold gust: a flurry of ice across the screen and a shiver in the sound
function gust(){try{tone(150,1.2,"sine",.08,70)}catch(e){}try{flashScreen("rgba(220,240,255,.55)")}catch(e){}}

// ---- monsters
function tintMon(g,c,em,a){(g.userData.mats||[]).forEach(m=>{m.color.lerp(TMP.setHex(c),a);if(em!=null){m.userData.em=em;m.emissive.setHex(em)}})}
// called for every spawned monster once its stats exist
function mod(e,g){
if(!on||e.boss)return;
const d=DEF[kind];
if(kind==="frost"){e.hp*=1.2;e.hpMax=e.hp;e.spd*=.88;tintMon(g,d.tint,d.em,.45);
if(!e.minion&&wave>=6&&rnd()<.3){e.frz=14;tintMon(g,0xffffff,0x2a5a7a,.45)}}
else if(kind==="blight"){
if(!e.minion&&rnd()<.25){e.blt=1;e.hp*=1.5;e.hpMax=e.hp;e.spd*=.8;g.scale.multiplyScalar(1.25);e.rad=clamp(.4*g.scale.x+.12,.5,.7);tintMon(g,0xc8d84a,0x3a4a06,.6)}
else tintMon(g,d.tint,d.em,.25)}
else{
if(!e.minion&&rnd()<.22){e.cin=1;e.hp*=.8;e.hpMax=e.hp;e.spd*=1.2;tintMon(g,0xff5a1a,0x8a2a04,.6)}
else tintMon(g,d.tint,d.em,.2)}}
// frozen monsters stay put until you come close, shoot them, or the ice gives way. Returns true while still frozen
function frozen(e,dist,dt){
if(!e.frz)return false;
e.frz-=dt;
if(dist<11||e.hp<e.hpMax||e.frz<=0){
e.frz=0;e.spd*=1.25;const p=e.g.position;
(e.g.userData.mats||[]).forEach(m=>{m.userData.em=0x1b3a52;m.emissive.setHex(0x1b3a52)});
Fx.burst({x:p.x,y:1.1,z:p.z},0xdff3ff,26,6,.1,2,20);Gfx.ring(p.x,.12,p.z,0xbfe6ff,.3,2.6,.45,.7);Gfx.crack(p.x,p.z,0xcfeaff,1.4,6);snd("kill",.35);return false}
poseMon(e.g,0);return true}
// what a dying monster leaves behind
function onKill(e){
if(!on||e.boss||e.t!=="mon")return;
const p=e.g.position;
if(kind==="frost"){Fx.burst({x:p.x,y:p.y+1,z:p.z},0xdff3ff,26,7,.1,2,18);Gfx.ring(p.x,.12,p.z,0xbfe6ff,.3,2,.4,.6)}
else if(kind==="blight"){if(e.blt){cloud(p.x,p.z,3,5.5,.3);Fx.burst({x:p.x,y:p.y+1,z:p.z},0x9be84a,28,6,.12,2,18)}else if(rnd()<.12)cloud(p.x,p.z,2.2,4,.3)}
else if(e.cin){
Fx.burst({x:p.x,y:p.y+1,z:p.z},0xff8a2a,30,8,.12,2,22);ringFx(p.x,p.z,3.6,0xff7a1a,.4);Gfx.flare({x:p.x,y:1.2,z:p.z},0xffb040,5,.3);snd("kill",.6);
if(Math.hypot(P.x-p.x,P.z-p.z)<3.6&&los(p.x,1,p.z,P.x,P.y+1,P.z))hit(Math.min(P.max*.18,8+wave*.7),{x:p.x,z:p.z});
for(const o of E.slice())if(o!==e&&o.t==="mon"&&!o.boss&&Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z)<3.6)hurtE(o,50+wave*5)}}

return{reset,pick,begin,clear,frame,mod,frozen,onKill,get on(){return on},get kind(){return kind}}
})();
