"use strict";
// ---------- Ghost level (Monster Rush): spectral monsters that hover and shoot when they see you, a Ghost boss that vanishes and reappears in sight, and the corrupted boss' blink ----------
const Ghost=(()=>{
const CY=0x6ff3ff,BASE=.62;


function fade(g,a){(g.userData.mats||[]).forEach(m=>{m.transparent=true;m.opacity=a;m.depthWrite=a>.9})}

// icy tint, translucent body and a soft glow
function tint(g,boss){
const ic=new T.Color(0xb8fbff);
(g.userData.mats||[]).forEach(m=>{m.color.lerp(ic,boss?.5:.6);m.userData.em=0x167f8c;m.emissive.setHex(0x167f8c);m.transparent=true;m.opacity=BASE;m.depthWrite=false});
const au=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:CY,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:boss?.55:.38,fog:false}));
au.scale.set(boss?7:3.4,boss?7:3.4,1);au.position.y=boss?2.2:1.1;au.raycast=()=>{};g.add(au)}

// materialising instead of climbing out of the ground
function emerge(e,dt,ex,ez){
const g=e.g,p=g.position,u=g.userData;e.em-=dt;const f=Math.max(0,Math.min(1,e.em/1.4));
if(e.em<1.4&&!e.fxd){e.fxd=1;Gfx.ring(p.x,.12,p.z,CY,.3,2.4,.5,.6);Fx.burst({x:p.x,y:1,z:p.z},CY,14,3,.1,3,14);snd("phase",clamp(1-Math.hypot(P.x-p.x,P.z-p.z)/45,.12,.6))}
p.y=.55+f*.9;fade(g,(1-f)*BASE);g.rotation.y=turnTo(g.rotation.y,Math.atan2(ex,ez),dt*6);
u.arms[0].rotation.x=u.arms[1].rotation.x=-1.4;poseMon(g,dt);
if(e.em<=0){e.phz=0;fade(g,BASE)}}

// Ghost boss special: fade out where it stands, rematerialise on open ground in sight of you (marked on the floor first), and slam down.
// Nothing here moves through geometry: it vanishes in place and appears in place
function spot(rad){
for(let i=0;i<16;i++){const a=rnd()*6.283,d=6+rnd()*5,x=clamp(P.x+Math.cos(a)*d,-H+3,H-3),z=clamp(P.z+Math.sin(a)*d,-H+3,H-3);
if(!blocked(x,z,0,rad)&&los(x,1.2,z,P.x,P.y+1.2,P.z))return{x,z}}
return freeSpot(P.x,P.z,rad)}
function phaseStart(e){
const g=e.g,p=g.position,f=spot((e.rad||1.2)+.15);
e.ptx=f.x;e.ptz=f.z;e.pz=1.3;e.pt0=1.3;e.phz=1;e.pmv=0;
ringFx(f.x,f.z,6,CY,1.3);Fx.burst({x:p.x,y:1.6,z:p.z},CY,30,6,.12,3,24);snd("phase",1);flash(e.name+" vanishes",1100)}
function phaseStep(e,dt){
const g=e.g,p=g.position;e.pz-=dt;const k=1-Math.max(0,e.pz)/e.pt0;
if(k<.5)fade(g,BASE*(1-k*2)+.03);
else{
if(!e.pmv){e.pmv=1;Fx.burst({x:p.x,y:1.6,z:p.z},CY,24,5,.12,3,20);p.x=e.ptx;p.z=e.ptz;p.y=0;e.sx=p.x;e.sz=p.z;snd("phase",.7)}
fade(g,BASE*(k*2-1)+.03)}
g.rotation.y=turnTo(g.rotation.y,Math.atan2(P.x-p.x,P.z-p.z),dt*6);
poseMon(g,dt);
if(e.pz<=0){
p.y=0;e.phz=0;fade(g,BASE);e.phCD=7;e.atkT=1.4;
Fx.burst({x:p.x,y:1.4,z:p.z},CY,40,8,.14,3,28);ringFx(p.x,p.z,6,CY,.6);
bossSlam(e,6,.9)}}

// corrupted boss special: glitch-step behind you, then a nova
function blink(e){
const g=e.g,p=g.position,rad=e.rad||1.45;
let bx=clamp(P.x+Math.sin(P.yaw)*6.5,-H+3,H-3),bz=clamp(P.z+Math.cos(P.yaw)*6.5,-H+3,H-3);
if(blocked(bx,bz,0,rad)||!los(bx,1.2,bz,P.x,P.y+1.2,P.z)){const f=freeSpot(bx,bz,rad+.15);bx=f.x;bz=f.z}
Fx.burst({x:p.x,y:1.8,z:p.z},0xc060ff,36,7,.12,3,24);ringFx(p.x,p.z,5,0xb050ff,.5);
p.x=bx;p.z=bz;p.y=0;
Fx.burst({x:bx,y:1.8,z:bz},0xff0018,36,7,.12,3,24);ringFx(bx,bz,7,0xff0018,.6);
g.rotation.y=Math.atan2(P.x-bx,P.z-bz);e.blCD=9;snd("phase",.9);document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),200);
bossNova(e)}

return{fade,tint,emerge,phaseStart,phaseStep,blink,CY,BASE}
})();
