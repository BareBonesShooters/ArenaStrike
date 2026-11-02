"use strict";
// ---------- shared game state ----------
let state="lobby",mode="duel",sel="duel",diff="easy",grind=false,menuOpen=false;
const RANGE_SHOTS=40;let rHit=0,rCur=0,rBest=0,rNow=0;
let rangeG=0,myS=0,opS=0,kills=0,ggL=0,wave=0,wq=0,wt=0,wn=0,rt=0,rL=0,rs=0,rT=[],E=[],pu=[],pT=3,slot=0,nextShot=0,firing=false,rmb=false,scoped=false,tutF={},emo=null,dying=[],scoreOpen=false,xp=0,xpNeed=40,xpLevel=0,knifeCharge=0,knifeCharging=false,knifeCD=0,grenAim=false,gPrevMesh=null,gPrevRing=null;
const P={x:0,y:0,z:0,vx:0,vz:0,vy:0,yaw:0,pitch:0,hp:100,max:100,gr:true,fz:0,dead:0,sp:0,spd:0,em:null,eye:1.7,crouch:0,slide:0,slideCD:0,rk:0,sinceHit:99,coy:0,jb:0,mantle:null,stepOff:0,landDip:0,bobPh:0,bobA:0,roll:0,mcd:0,jumping:false,air:0,jHeld:false,jpress:false,prot:0,rush:0,stepT:0,regen:false,grenCD:0};
const A={mag:12,rl:0},K={};
const rc=new T.Raycaster(),rc2=new T.Raycaster();rc.far=90;
const tf=k=>tutF[k]=1;

// ---------- unified aim: one crosshair, always at screen centre ----------
// The crosshair never leaves the middle of the screen and the OS cursor is hidden. Only mouse movement turns
// the view (pointer lock gives unlimited motion). Where the browser blocks pointer lock (sandboxed pages) the
// same mouse deltas are used, the arrow keys and Q/E also turn, and the cursor reappears near a window edge
// so it is obvious when to bring the mouse back. The view never turns on its own.
const Aim=(()=>{
let dx=0,dy=0,lock=false,free=false,armed=false,nx=0,ny=0,lx=null,ly=null,hot=false,hinted=false,tm=0,cx=-1,cy=-1,sp=-1,edge=false;
const cr=()=>$("cross"),B=()=>document.body;
function fall(){if(lock||free)return;free=true;lx=ly=null;if(!hinted){hinted=true;toast("This page cannot lock the mouse. Move the mouse to look and use Q and E to turn. Open it in a full browser tab for true mouse look")}B().classList.add("freeaim")}
function request(){if(typeof MobileLayout!=="undefined"&&MobileLayout.active){free=true;hinted=true;return}const c=rd.domElement;if(lock||!c.requestPointerLock)return fall();
// raw input skips the Windows and Linux desktop mouse acceleration; browsers or systems that cannot do it fall back to the normal lock
try{let p;try{p=c.requestPointerLock({unadjustedMovement:true})}catch(e){p=c.requestPointerLock()}
if(p&&p.catch)p.catch(()=>{if(lock)return;try{const q=c.requestPointerLock();if(q&&q.catch)q.catch(()=>fall())}catch(e){fall()}})}catch(e){fall()}
clearTimeout(tm);tm=setTimeout(()=>{if(state==="play"&&!lock&&!menuOpen)fall()},650)}
function release(){try{if(document.pointerLockElement)document.exitPointerLock()}catch(e){}}
function setEdge(v){if(v!==edge){edge=v;B().classList.toggle("edge",v)}}
document.addEventListener("pointerlockchange",()=>{lock=document.pointerLockElement===rd.domElement;
if(lock){free=false;setEdge(false);B().classList.remove("freeaim")}else if(state==="play"&&!menuOpen&&!free&&!(typeof CustomBattle!=="undefined"&&CustomBattle.active&&!CustomBattle.joined))pauseGame()});
document.addEventListener("pointerlockerror",fall);
addEventListener("mousemove",e=>{
if(typeof MobileLayout!=="undefined"&&MobileLayout.active)return;
// a button released outside the page never sends mouseup, so trust the live button state to stop stuck fire
if(e.buttons!==undefined&&!(e.buttons&1))firing=false;
if(lock){dx+=clamp(e.movementX||0,-220,220);dy+=clamp(e.movementY||0,-220,220);return}
if(!free)return;
const mx=e.movementX?e.movementX:(lx==null?0:e.clientX-lx),my=e.movementY?e.movementY:(ly==null?0:e.clientY-ly);
dx+=clamp(mx,-220,220);dy+=clamp(my,-220,220);lx=e.clientX;ly=e.clientY;
nx=clamp(e.clientX/innerWidth*2-1,-1,1);ny=clamp(1-e.clientY/innerHeight*2,-1,1);
if(!armed&&Math.abs(nx)<.8&&Math.abs(ny)<.8)armed=true;
const m=Math.min(e.clientX,e.clientY,innerWidth-e.clientX,innerHeight-e.clientY);setEdge(m<Math.min(innerWidth,innerHeight)*.04)},{passive:true});
document.addEventListener("mouseleave",()=>{lx=ly=null;dx=dy=0;nx=ny=0;setEdge(false)});
function frame(dt,sc){
place();
if(state!=="play"||menuOpen||P.dead>0||P.em){dx=dy=0;return}
if(!(lock||free))return;
const zs=sc?clamp(Math.pow(Math.tan(Scope.sensFov(cam.fov)*.00872665)/.7673,.55)*S.ssens,.2,1.5):1,k=.0022*S.sens*zs*(hot?.82:1),f=1-Math.exp(-dt*55),ox=dx*f,oy=dy*f;dx-=ox;dy-=oy;P.yaw-=ox*k;P.pitch=clamp(P.pitch-oy*k,-1.5,1.5);
// without mouse lock the cursor stops at the window border, so a cursor pinned right at the border keeps turning gently (never from anywhere else)
if(free&&armed){const ex=Math.abs(nx)>.97?Math.sign(nx):0,ey=Math.abs(ny)>.97?Math.sign(ny):0;if(ex)P.yaw-=ex*1.5*S.sens*zs*dt;if(ey)P.pitch=clamp(P.pitch+ey*1.1*S.sens*zs*dt,-1.5,1.5)}}
function place(){if(cx===0)return;cx=cy=0;cr().style.transform=`translate(${(innerWidth/2).toFixed(1)}px,${(innerHeight/2).toFixed(1)}px)`}
function spread(px){const v=Math.round(px*2)/2;if(v!==sp){sp=v;cr().style.setProperty("--g",v+"px")}}
function setHot(v){if(v!==hot){hot=v;cr().classList.toggle("hot",v)}}
return{touchLook(x,y){dx+=x;dy+=y},touchOn(){free=true;hinted=true},request,release,frame,spread,setHot,get locked(){return lock},get free(){return free},x:0,y:0,reset(){dx=dy=0;cx=-1;lx=ly=null;armed=false;setEdge(false);place()},fall}})();

// ---------- movement ----------
const MV={walk:6.4,sprint:9.4,scope:3.7,accG:15,accA:3.4,jump:8.4,jump2:8.2,air:1,grav:24,coy:.12,jbuf:.14};
function tryMantle(dirx,dirz){
if(P.mcd>0||P.vy<-7)return false;const len=Math.hypot(dirx,dirz);if(len<.1)return false;dirx/=len;dirz/=len;
const px=P.x+dirx*.62,pz=P.z+dirz*.62;
for(let i=0;i<boxes.length;i++){const b=boxes[i];
if(!b.nc&&Math.abs(px-b.x)<b.w/2&&Math.abs(pz-b.z)<b.d/2){const rise=b.h-P.y;if(rise<STEP+.05||b.h>P.y+1.95||b.h>(WORLD.ceil?WORLD.ceil-2.1:99))continue;
let tx=clamp(P.x+dirx*1.05,b.x-b.w/2+.34,b.x+b.w/2-.34),tz=clamp(P.z+dirz*1.05,b.z-b.d/2+.34,b.z+b.d/2-.34);
if(b.w<.8)tx=b.x;if(b.d<.8)tz=b.z;
if(blocked(tx,tz,b.h+.02,.4)||floorAt(tx,tz,b.h,.4)<b.h-.01)continue;
P.mantle={sx:P.x,sy:P.y,sz:P.z,tx,ty:b.h,tz,t:0,dur:.24+rise*.09,dx:dirx,dz:dirz};P.vx=P.vz=0;P.vy=0;P.jumping=false;snd("jump",.6,.8);return true}}
return false}
function movePlayer(dt,inp){
// inp: {f,s,sprint,jump,crouch}  — crouch input is now used as slide
P.slideCD=Math.max(0,P.slideCD-dt);
if(inp.crouch&&P.gr&&P.slide<=0&&P.slideCD<=0&&P.dead<=0&&!P.mantle&&Math.hypot(P.vx,P.vz)>4){
P.slide=.55;P.slideCD=1.1;P.crouch=1;const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
P.vx+=-sn*8;P.vz+=-cs*8;snd("jump",.45,1.4);Fx.burst({x:P.x,y:P.y+.05,z:P.z},0xbfeaff,8,2.2,.06,.1,6)}
if(P.slide>0){P.slide-=dt;P.crouch=1;if(P.slide<=0)P.crouch=0}
else P.crouch+=((0)-P.crouch)*Math.min(1,dt*9);
if(P.mantle){const m=P.mantle;m.t+=dt;const k=Math.min(1,m.t/m.dur),e=easeIO(clamp((k-.45)/.55,0,1));
// Lift above the ledge before moving into it, and check the climb path too.
const nx=lerp(m.sx,m.tx,e),nz=lerp(m.sz,m.tz,e),ny=lerp(m.sy,m.ty,easeOut(Math.min(1,k/.45)))+Math.sin(k*Math.PI)*.1;
if(blockedMove(P.x,P.z,nx,P.z,ny,.4)||blockedMove(nx,P.z,nx,nz,ny,.4)){P.mantle=null;P.mcd=.2;return}
P.x=nx;P.z=nz;P.y=ny;
if(k>=1){P.y=m.ty;P.mantle=null;P.vy=0;P.gr=true;P.vx=m.dx*3.2;P.vz=m.dz*3.2;P.mcd=.35;P.landDip=.07;snd("land",.5)}return}
P.mcd=Math.max(0,P.mcd-dt);
const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);let mx=-sn*inp.f+cs*inp.s,mz=-cs*inp.f-sn*inp.s;const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l}
const base=scoped?MV.scope:inp.sprint&&inp.f>0&&P.crouch<.3?MV.sprint:MV.walk,sp=base*(1-.35*P.crouch)*(P.spd>0||P.rush>0||P.slide>0?1.4:1)*PU.spd*(P.slide>0?1.35:1)*(slot===0?(cg().mv||1):1.05);
const ac=1-Math.exp(-(P.gr?MV.accG:MV.accA*(mode==="parkour"&&pkKnifeOn()?2.2:1))*dt*(l>0?1:.85));
P.vx+=(mx*sp-P.vx)*ac;P.vz+=(mz*sp-P.vz)*ac;
// collision with sub-steps so fast movement never tunnels
const dist=Math.hypot(P.vx,P.vz)*dt,n=Math.max(1,Math.ceil(dist/.22)),sdt=dt/n;let wallHit=false;
for(let i=0;i<n;i++){
let nx=P.x+P.vx*sdt,nz=P.z+P.vz*sdt;
if(blockedMove(P.x,P.z,nx,P.z,P.y,.4)){P.vx=0;nx=P.x;wallHit=true}
const cb=(typeof CustomBattle!=="undefined"&&CustomBattle.active)?{x0:-118,x1:118,z0:-118,z1:118}:(mode==="parkour"&&WORLD.course&&WORLD.course.bnd)?WORLD.course.bnd:{x0:-H,x1:H,z0:-H,z1:H};
P.x=clamp(nx,cb.x0+.5,cb.x1-.5);
if(blockedMove(P.x,P.z,P.x,nz,P.y,.4)){P.vz=0;nz=P.z;wallHit=true}
P.z=clamp(nz,cb.z0+.5,cb.z1-.5)}
// jump buffer, coyote time, variable height
const press=P.jpress||(inp.jump&&!P.jHeld);P.jpress=false;P.jHeld=!!inp.jump;
P.jb=Math.max(0,P.jb-dt);if(inp.jump)P.jb=MV.jbuf;
P.coy=P.gr?MV.coy:Math.max(0,P.coy-dt);
if(P.gr)P.air=0;
if(P.jb>0&&P.coy>0){P.vy=MV.jump;P.gr=false;P.coy=0;P.jb=0;P.jumping=true;snd("jump",.7)}
// double jump: a fresh press in mid-air gives one more lift of fixed height and turns most of your momentum toward where you push
else if(press&&!P.gr&&P.coy<=0&&P.air<MV.air&&P.vy<7.2&&P.dead<=0&&P.fz<=0){
P.air++;P.vy=MV.jump2;P.jumping=false;P.jb=0;
if(l>.05){P.vx+=(mx*sp-P.vx)*.6;P.vz+=(mz*sp-P.vz)*.6}
snd("djump",.8);qAdd("djump",1);Fx.burst({x:P.x,y:P.y+.12,z:P.z},0xbfeaff,12,2.6,.07,.3,4);tf("djump")}
if(P.jumping&&!K.Space&&P.vy>3.2)P.vy-=58*dt;if(P.vy<=0)P.jumping=false;
// ledge climbing: pushing into a ledge while rising or airborne pulls you up smoothly
if((wallHit||!P.gr)&&(l>.1)&&(!P.gr||P.jb>0)&&P.vy>-5.5&&tryMantle(mx,mz))return;
const wasGr=P.gr,oldY=P.y,iv=P.vy;P.vy-=MV.grav*dt;P.y+=P.vy*dt;
// Sweep from the previous height so a fast fall cannot skip a roof. Use the
// same footprint as wall collision, including when standing on a roof edge.
let fl=floorAt(P.x,P.z,Math.max(oldY,P.y),.4);
if(P.y<=fl){const rise=fl-oldY;if(wasGr&&rise>.04)P.stepOff-=Math.min(rise,.6);
if(!wasGr&&iv<-6){P.landDip=Math.min(.32,(-iv-6)*.02+.06);snd("land",clamp(-iv/18,.3,1))}
P.y=fl;P.vy=0;P.gr=true}
else if(wasGr&&P.vy<=0&&P.y-fl<=STEP&&!P.jumping&&oldY-fl<=STEP+.01&&fl<oldY){P.stepOff+=P.y-fl;P.y=fl;P.vy=0;P.gr=true}
else P.gr=false;
if(WORLD.ceil&&P.y>WORLD.ceil-2.1){P.y=WORLD.ceil-2.1;if(P.vy>0)P.vy=0}
if(P.y<-30)P.y=0}

// ---------- camera ----------
function updateCamera(dt,inp){
const lockd=P.fz>0||P.dead>0||rL>0;
if(P.em){const d=3.4,fx2=-Math.sin(P.yaw),fz2=-Math.cos(P.yaw),a=Math.min(1,dt*6),tx=P.x+fx2*d,tz=P.z+fz2*d,ty=P.y+2;
cam.position.x+=(tx-cam.position.x)*a;cam.position.y+=(ty-cam.position.y)*a;cam.position.z+=(tz-cam.position.z)*a;cam.lookAt(P.x,P.y+1.2,P.z);return}
if(mode==="parkour"&&pkView===3&&pkBody){ // over-the-shoulder chase camera on the line behind your aim (it drops as you look up), smooth height, wall-safe
const cp=Math.cos(P.pitch),bx=Math.sin(P.yaw)*cp,by=-Math.sin(P.pitch),bz=Math.cos(P.yaw)*cp,rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
pkCamY=pkCamY==null||Math.abs(P.y-pkCamY)>6?P.y:pkCamY+(P.y-pkCamY)*Math.min(1,dt*9);
const hx=P.x,hy=pkCamY+1.65,hz=P.z,want=3.6,px=hx+rx*.65,pz=hz+rz*.65; // pivot sits over the right shoulder
let dist=want;try{dist=Math.min(want,Math.max(.7,rayWorld(px,hy,pz,bx,by+.0001,bz,want+.4)-.4))}catch(e){}
cam.position.set(px+bx*dist,Math.max(pkCamY+.35,hy+by*dist+.2),pz+bz*dist);
cam.rotation.set(P.pitch,P.yaw,0,"YXZ");return}
P.eye+=((P.dead>0?.5:1.7-.62*P.crouch)-P.eye)*Math.min(1,dt*10);
P.stepOff*=Math.exp(-dt*13);P.landDip*=Math.exp(-dt*9);
const spd=Math.hypot(P.vx,P.vz),amp=P.gr&&!lockd&&!P.mantle?Math.min(1,spd/8):0;
P.bobA+=(amp-P.bobA)*Math.min(1,dt*8);const o=P.bobPh;P.bobPh+=dt*spd*1.15*(P.gr?1:0);
if(P.bobA>.3&&Math.floor(P.bobPh/Math.PI)!==Math.floor(o/Math.PI))snd("step",(.5+P.bobA*.3)*(1-.65*P.crouch));
const bobY=Math.sin(P.bobPh*2)*.034*P.bobA,bobX=Math.cos(P.bobPh)*.022*P.bobA,cs=Math.cos(P.yaw),sn=Math.sin(P.yaw);
let lift=0,rollT=-(inp?inp.s:0)*.014*Math.min(1,spd/6);
if(P.mantle){const k=Math.min(1,P.mantle.t/P.mantle.dur);lift=-Math.sin(k*Math.PI)*.14;rollT+=Math.sin(k*Math.PI)*.025}
P.roll+=(rollT-P.roll)*Math.min(1,dt*9);
cam.position.set(P.x+cs*bobX,P.y+P.eye+P.stepOff-P.landDip+bobY+lift,P.z-sn*bobX);
cam.rotation.set(P.pitch+P.rk-P.landDip*.25+Death.pit,P.yaw,P.roll+Death.rol,"YXZ")}
function updateFov(dt,g,inp){
const sprinting=inp&&inp.sprint&&inp.f>0&&!scoped&&Math.hypot(P.vx,P.vz)>7.5,tfv=scoped?(scopeOf(g).pip?LENS_BASE:scopeOf(g).fov):sprinting?81:75;
if(Math.abs(cam.fov-tfv)>.05){cam.fov+=(tfv-cam.fov)*Math.min(1,dt*(scoped?16:7));cam.updateProjectionMatrix()}}

// ---------- knife swing animations: one keyframed motion per blade (frames are [time,x,y,z,pitch,yaw,roll] offsets from the rest pose) ----------
const KSTY={"Combat Knife":"slash","Kunai":"jab","Machete":"chop","Karambit":"rake","Katana":"draw","Plasma Blade":"arc","Solar Edge":"spin","Tanto":"thrust","Butterfly":"flip","Cleaver":"cleave","Void Fang":"fang","Star Piercer":"star","Season Blade":"sweep","Echo Kunai":"echo","Apex Edge":"apex"};
const KSPD={slash:3.2,jab:4.2,chop:2.4,rake:3.3,draw:3.8,arc:3,spin:2.5,thrust:3,flip:2,cleave:2,fang:3.2,star:2.4,sweep:2.8,echo:3.2,apex:2.8};
const kmir=f=>f.map(k=>[k[0],-k[1],k[2],k[3],k[4],-k[5],-k[6]]),K0=[0,0,0,0,0,0,0],K1=[1,0,0,0,0,0,0],TAU=6.283;
const KSW=(()=>{const t={
slash:[[K0,[.16,.3,.04,.06,-.15,-1,.7],[.4,-.3,-.06,-.28,-.35,.95,-.6],[.68,-.2,-.03,-.12,-.2,.55,-.3],K1],0,[K0,[.2,0,.28,.06,-1.4,0,0],[.44,-.05,-.3,-.3,1,0,.1],[.7,-.03,-.18,-.14,.5,0,0],K1]],
jab:[[K0,[.14,.03,0,.18,.2,0,0],[.34,.02,.02,-.55,-.15,.1,0],[.58,.02,.01,-.3,-.05,.05,0],K1],[K0,[.14,-.04,-.05,.16,.2,0,0],[.34,-.05,-.03,-.55,-.12,-.1,0],[.58,-.04,-.02,-.3,-.05,-.05,0],K1],[K0,[.3,.05,0,-.1,-.2,0,-3.1],[.6,.03,.02,-.5,-.1,0,-TAU],[1,0,0,0,0,0,-TAU]]],
chop:[[K0,[.28,.1,.34,.14,-1.55,-.2,.2],[.46,-.04,-.34,-.36,.95,.1,-.1],[.62,-.03,-.27,-.3,.75,.05,-.05],K1],0,[K0,[.28,.3,.3,.1,-1.3,-.7,.6],[.48,-.3,-.3,-.3,.8,.7,-.5],K1]],
rake:[[K0,[.2,.34,-.05,.02,0,-1.1,.9],[.46,-.4,0,-.3,-.2,1.15,-.9-TAU],[.7,-.28,0,-.12,-.1,.6,-TAU],[1,0,0,0,0,0,-TAU]],0,[K0,[.2,-.2,-.2,0,.6,.4,.3],[.5,.1,.25,-.3,-.9,-.4,-.4],K1]],
draw:[[K0,[.22,-.14,-.03,.1,.05,.95,-.3],[.4,.4,.02,-.2,-.15,-1.25,.5],[.64,.44,.03,-.22,-.15,-1.3,.5],[.86,.2,0,-.1,-.05,-.6,.2],K1],0,[K0,[.25,-.1,-.05,.12,.1,.8,-.2],[.5,.05,0,-.6,-.1,-.1,0],K1]],
arc:[[K0,[.2,-.22,-.16,.06,.5,.6,-.5],[.5,.34,.22,-.26,-.75,-.75,.75],[.74,.2,.1,-.12,-.35,-.35,.35],K1],0,[K0,[.25,-.2,-.1,.05,.3,.6,-.5],[.5,.3,.25,-.3,-.9,-.5,.9],[.75,-.15,-.05,-.2,.4,.9,-.6],K1]],
spin:[[K0,[.14,.12,0,.1,0,.6,0],[.56,-.08,0,-.22,-.1,-5.7,.2],[.82,0,0,-.1,0,-TAU,.1],[1,0,0,0,0,-TAU,0]],0,[K0,[.15,0,.05,.05,.4,0,0],[.6,0,-.05,-.3,-5.9,0,0],[1,0,0,0,-TAU,0,0]]],
thrust:[[K0,[.26,.05,-.06,.15,.38,0,0],[.5,0,.02,-.72,-.12,0,0],[.74,0,.01,-.52,-.05,0,0],K1],0,[K0,[.25,0,-.15,.1,.5,0,0],[.5,0,.15,-.6,-.7,0,0],K1]],
flip:[[K0,[.25,.08,.06,-.1,-2.6,0,.3],[.55,0,.02,-.22,-6.9,.4,0],[.8,0,0,-.1,-9.4,0,0],[1,0,0,0,-2*TAU,0,0]],0,[K0,[.3,0,.05,-.1,-.3,0,-3.2],[.7,0,0,-.2,0,0,-6.3],[1,0,0,0,0,0,-TAU]]],
cleave:[[K0,[.34,.14,.4,.16,-1.75,0,.25],[.52,0,-.42,-.42,1.3,0,0],[.6,0,-.3,-.36,1.1,0,0],[.7,0,-.36,-.4,1.25,0,0],K1],0,[K0,[.3,.34,0,.1,0,-.9,.9],[.55,-.34,-.1,-.3,0,.9,-.5],K1]],
fang:[[K0,[.2,-.2,.2,0,-.6,.8,-.9],[.42,.32,-.26,-.26,.5,-.95,.9],[.6,.2,-.2,-.14,.3,-.5,.5],K1],0,[K0,[.18,-.2,.2,0,-.6,.8,-.9],[.34,.3,-.2,-.2,.4,-.9,.9],[.5,.3,.2,0,-.6,-.8,.9],[.66,-.3,-.25,-.25,.5,.9,-.9],K1]],
star:[[K0,[.2,0,0,.12,.1,0,0],[.5,0,0,-.55,-.2,0,-6.2],[.8,0,0,-.35,0,0,-12.5],[1,0,0,0,0,0,-2*TAU]],0,[K0,[.3,.1,.1,.1,-.4,0,-3],[.6,-.1,-.1,-.5,.3,0,-9],[1,0,0,0,0,0,-2*TAU]]],
sweep:[[K0,[.18,.34,-.06,.02,.15,-1.3,.3],[.5,-.36,-.08,-.2,.2,1.3,-.3],[.75,-.2,-.04,-.1,.1,.7,-.15],K1],0,[K0,[.2,-.3,0,0,.1,1.2,-.3],[.45,.3,-.05,-.2,.1,-1.2,.3],[.7,-.2,-.05,-.1,.1,.8,-.2],K1]],
echo:[[K0,[.12,.03,0,.16,.2,0,0],[.26,.02,.01,-.5,-.15,.08,0],[.4,.02,0,-.1,.1,.03,0],[.54,.02,0,-.5,-.12,.06,0],[.75,.02,0,-.2,-.05,.02,0],K1],0,0],
apex:[[K0,[.2,.28,.24,.05,-.7,-.7,.8],[.42,-.3,-.3,-.26,.7,.8,-.8],[.7,-.2,-.15,-.12,.3,.4,-.4],K1],0,[K0,[.16,.28,.24,.05,-.7,-.7,.8],[.3,-.3,-.3,-.26,.7,.8,-.8],[.42,-.3,.24,.05,-.7,.7,-.8],[.58,.3,-.3,-.26,.7,-.8,.8],K1]]};
for(const k in t){const a=t[k];a[1]=a[1]||kmir(a[0]);a[2]=a[2]||a[0]}return t})();
const ksty=k=>KSTY[k&&k.n]||"slash";
function kframe(p,f){for(let i=0;i<f.length-1;i++){const a=f[i],b=f[i+1];if(p<=b[0]){const u=clamp((p-a[0])/(b[0]-a[0]),0,1),s=u*u*(3-2*u);return[0,1,2,3,4,5].map(j=>a[j+1]+(b[j+1]-a[j+1])*s)}}return f[f.length-1].slice(1)}
// ---------- first person viewmodel (drawn in its own pass so it never clips walls) ----------
const VM=(()=>{
const scn=new T.Scene(),vc=new T.PerspectiveCamera(58,innerWidth/innerHeight,.03,6);
const vh=new T.HemisphereLight(0xffffff,0x667088,.78),vd=new T.DirectionalLight(0xffffff,.9);vd.position.set(.6,1,.8);scn.add(vh,vd,vc);
const root=new T.Group();scn.add(root);const gunH=new T.Group(),knifeH=new T.Group();root.add(gunH,knifeH);
let gb=null,gkey="",kkey="",flashT=0,gdef=GB("g0"),gz=-.4;
const st={rec:0,rr:0,swap:1,stab:0,cm:0,sx:0,sy:0,bx:0,by:0,rlp:0,ia:0,ip:0,sf:0,land:0,spr:0,air:0,pg:true,pvy:0};let cbShot=null,offH=null;
const skinM=new T.MeshLambertMaterial({color:0xf1c27d}),slv=new T.MeshLambertMaterial({color:0x2563eb}),V3=(x,y,z)=>new T.Vector3(x,y,z);
function limbBox(par,from,to,w,mat){const d=new T.Vector3().subVectors(to,from),L=d.length(),m=new T.Mesh(new T.BoxGeometry(w,w*.95,L),mat);m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V3(0,0,1),d.normalize());par.add(m);return m}
function hand(par,at,back){const g=new T.Group(),h=new T.Mesh(new T.BoxGeometry(.065,.07,.09),skinM);h.position.copy(at);g.add(h);limbBox(g,at,at.clone().add(back),.075,slv);par.add(g);return g}
function clear(h){while(h.children.length){const c=h.children[0];h.remove(c);disposeGeo(c)}}
function set(g,sk,kn,ps){
slv.color.setHex(ps.c);gdef=g;
const k1=g.id+sk.id;if(k1!==gkey){gkey=k1;clear(gunH);gb=buildGun(g,sk);Scope.buildLens(gb,g);gunH.add(gb.grp);hand(gunH,V3(gb.grip.x,gb.grip.y+.01,gb.grip.z),V3(.1,-.32,.36));offH=hand(gunH,V3(gb.fore.x,gb.fore.y-.03,gb.fore.z),V3(-.12,-.3,.42));gb.offAt=V3(gb.fore.x,gb.fore.y-.03,gb.fore.z);{const m0=gb.mag||gb.prop;m0.userData.p0=m0.position.clone();m0.userData.r0=m0.rotation.x}
gz=-(.2+g.l/2+(g.st?.23:0));gunH.position.set(.15,-.16,gz)}
const k2=kn.id;if(k2!==kkey){kkey=k2;clear(knifeH);const kb=buildKnife(kn);knifeH.add(kb.grp);knifeH.userData.mats=kb.mats;knifeH.userData.pr=kn.r===5;
hand(knifeH,V3(0,-.005,kb.hl*.5),V3(.08,-.3,.34));knifeH.position.set(.2,-.2,-.42);knifeH.rotation.set(.1,-.3,.1)}}
function frame(dt,o){
const t=performance.now()/1000;
st.rec*=Math.exp(-dt*16);st.rr*=Math.exp(-dt*9);st.swap=Math.max(0,st.swap-dt*3.8);st.stab=Math.max(0,st.stab-dt*(KSPD[st.ks]||3));st.th=Math.max(0,(st.th||0)-dt*(2.6-.2*(st.kr|0)));
const a=1-Math.exp(-dt*10);st.sx+=(clamp(-o.dyaw*1.1,-.07,.07)-st.sx)*a;st.sy+=(clamp(o.dpitch*1.1,-.06,.06)-st.sy)*a;
const mv=Math.min(1,o.speed/8)*(o.gr?1:0),bp=t*(6+o.speed*.7);st.bx+=(Math.cos(bp)*.012*mv-st.bx)*a;st.by+=(Math.abs(Math.sin(bp))*.016*mv-st.by)*a;
// landing thump, jump lift and a sprint carry make the weapon feel attached to a body that has weight
const vy=o.vy||0;if(!o.gr)st.pvy=vy;if(o.gr&&!st.pg&&st.pvy<-3)st.land=Math.min(1,-st.pvy/16);st.pg=!!o.gr;st.land*=Math.exp(-dt*7.5);
st.air+=((o.gr?0:1)-st.air)*Math.min(1,dt*9);st.spr+=((o.gr&&o.speed>7.2&&!o.scoped?1:0)-st.spr)*Math.min(1,dt*7);
const ads=o.scoped&&!o.reload&&!st.ia&&st.swap<=0&&!o.hide&&o.slot===0?1:0;st.ads=(st.ads||0)+(ads-(st.ads||0))*Math.min(1,dt*14);const A1=st.ads;
const rp=o.reload;st.rlp=rp;const sw=easeOut(st.swap);
// reload choreography: tip the gun, off hand to the mag, mag out, fresh mag in, seat it with a kick, rack the charging handle, settle
const rs=(a,b)=>clamp((rp-a)/(b-a),0,1),rEnv=rp>0?easeIO(rs(0,.13))*(1-easeIO(rs(.86,1))):0,rl=rEnv;
const rGet=rp>0?easeIO(rs(.04,.16)):0,rOut=easeOut(rs(.16,.3)),rGone=easeIO(rs(.3,.42)),rIn=easeOut(rs(.5,.66)),rRack=rs(.74,.9),rBack=easeIO(rs(.9,1));
const rKick=Math.sin(rs(.64,.74)*Math.PI),rPull=Math.sin(rRack*Math.PI);
// gun
// Camera recoil already changes the shot direction. Additional weapon sway
// must settle out while aiming so the lens reticle stays on that same ray.
const freeAim=1-A1,br=Math.sin(t*1.7)*freeAim,sx=st.sx*freeAim,sy=st.sy*freeAim,pull=o.pull*freeAim;
gunH.position.set(lerp(.15,0,A1)+sx+st.bx*freeAim+br*.002,lerp(-.16,-.13,A1)+sy-st.by*freeAim+rl*.07-sw*.32-pull*.06+br*.0035,lerp(gz,gz+.1,A1)+st.rec*.05*freeAim+pull*.2);
gunH.rotation.set(st.rr*.07*freeAim+rl*.3+sw*.8+pull*.5+sy*1.2+br*.004,sx*1.4+rl*.4+pull*.4+.03*freeAim,-sx*.8-rl*.8);
if(rp>0){gunH.position.y+=-rKick*.022;gunH.position.z+=rKick*.03+rPull*.035;gunH.rotation.x+=rKick*.1-rPull*.08;gunH.rotation.z+=rKick*.06}
{const lf=st.land*freeAim,sp2=st.spr*freeAim,ar=st.air*freeAim,lift=clamp(-vy*.0025,-.035,.03);
gunH.position.x+=-.035*sp2;gunH.position.y+=-lf*.07-.03*sp2+lift*ar;gunH.position.z+=lf*.05+.02*sp2;
gunH.rotation.x+=lf*.22+.1*sp2-lift*3*ar;gunH.rotation.y+=-.22*sp2;gunH.rotation.z+=-.14*sp2+Math.sin(t*(6+o.speed*.7))*.012*sp2}
if(st.ia){ // inspect: bring the gun up, turn it over to show both sides, fire one shot, bring it back
st.ip=Math.min(1,st.ip+dt/2.8);const p=st.ip,env=easeIO(clamp(p/.16,0,1))*(1-easeIO(clamp((p-.84)/.16,0,1))),w=Math.sin(p*Math.PI*2);
gunH.position.x+=-.12*env;gunH.position.y+=.06*env;gunH.position.z+=.1*env;
gunH.rotation.y+=env*(-.9+w*.45);gunH.rotation.z+=env*w*.55;gunH.rotation.x+=env*(.18+Math.sin(p*Math.PI*3)*.1);
if(!st.sf&&p>=.58){st.sf=1;if(cbShot)cbShot()}
if(p>=1)st.ia=0}
if(gb&&offH){
const m=gb.mag||gb.prop,pm=m.userData.p0,ha=gb.offAt;
let hx=0,hy=0,hz=0;
if(rp>0&&pm){
const home=1-rBack,drop=-.34*rOut-.3*rGone+.64*rIn; // the hand carries the old mag down and away, then comes back up with a fresh one
hx=(pm.x-ha.x)*rGet*home;hy=((pm.y-.04-ha.y)*rGet+drop)*home+.14*rPull;hz=(pm.z-ha.z)*rGet*home+.16*rPull;
if(gb.mag){const mm=gb.mag,mu=mm.userData;mm.visible=rp<.4||rp>.46;mm.position.set(mu.p0.x,mu.p0.y+drop,mu.p0.z);mm.rotation.x=mu.r0+.5*Math.min(1,-drop/.34)}
else if(gb.prop){gb.prop.visible=rp>.46&&rp<.68;gb.prop.position.set(pm.x,pm.y+drop,pm.z)}}
else if(gb.mag){gb.mag.visible=true;gb.mag.position.copy(gb.mag.userData.p0);gb.mag.rotation.x=gb.mag.userData.r0}
else if(gb.prop)gb.prop.visible=false;
offH.position.set(hx,hy,hz)}
gunH.visible=o.slot===0&&!o.hide;
if(gb&&gb.optic)gb.optic.visible=!(o.scoped&&A1>.4&&!scopeOf(gdef).pip);
// the Aether Rifle's wide glowing body and stock sat right under the sight line: drop it out of the way while aiming so the target stays clear
if(gb&&gdef.glow&&!scopeOf(gdef).pip)gunH.position.y+=-.05*A1;
// lens scopes: the whole gun slides up until the eyepiece of its own scope sits dead centre, and you look through it
if(gb&&gb.lens&&scopeOf(gdef).pip){gunH.position.y+=(-gb.lens.y+.13)*A1;gunH.position.z+=(-.18-gb.lens.z-(gz+.1))*A1}
{const nn=gb&&gb.lens&&scopeOf(gdef).pip?.03+.105*A1:.03;if(Math.abs(vc.near-nn)>.002){vc.near=nn;vc.updateProjectionMatrix()}} // the rear of the gun is at your eye: cut it away so only the scope and the front of the gun show
if(gb&&flashT>0){flashT-=dt;if(flashT<=0)gb.mf.visible=false}
// knife
const sk=st.stab,pp=1-sk,sl=Math.sin(pp*Math.PI),ea=pp<.5?2*pp*pp:1-Math.pow(-2*pp+2,2)/2,cm=st.cm|0;
let kx=.2,ky=-.2,kz=-.42,rx=.1,ry=-.3,rz=.1;
if(sk>0){const q=kframe(pp,KSW[st.ks||"slash"][cm===1?1:cm===2?2:0]);kx+=q[0];ky+=q[1];kz+=q[2];rx+=q[3];ry+=q[4];rz+=q[5]}
if(st.th>0){ // throw: wind back, then fling forward; epic and above twirl it first
const q=1-st.th,kr=st.kr|0,pull=Math.sin(Math.min(1,q/.3)*Math.PI/2),fl=clamp((q-.28)/.2,0,1),pf=pull*(1-fl);
kx+=.12*pf;ky+=.08*pf-.02*fl;kz+=.15*pf-.6*fl;rx+=-.9*pf+1.2*fl;if(kr>=3)rz+=Math.min(1,q/.28)*Math.PI*2*(kr>=5?2:1)*(1-fl)}
if(st.ia&&o.slot===1){ // knife inspect: flip it over and show off the blade
const p=st.ip,env=easeIO(clamp(p/.16,0,1))*(1-easeIO(clamp((p-.84)/.16,0,1)));
kx+=-.1*env;ky+=.08*env;kz+=.12*env;ry+=env*(-.7+Math.sin(p*Math.PI*2)*.5);rz+=env*Math.sin(p*Math.PI*4)*.9;rx+=env*(.3+Math.sin(p*Math.PI*3)*.5)}
knifeH.position.set(kx+st.sx+st.bx-.03*st.spr,ky-st.by-sw*.3-st.land*.06-.02*st.spr,kz+o.pull*.2+st.land*.04);
knifeH.rotation.set(rx+sw*.7+st.land*.2,ry-.18*st.spr,rz-.12*st.spr);knifeH.visible=o.slot===1&&!o.hide&&(!(o.knifeCD>0)||st.th>.5);
// charge pose: pull knife back over shoulder while holding attack
if(o.charging&&o.slot===1&&!(o.knifeCD>0)){const c=clamp(o.charge||0,0,1);knifeH.position.x+=.12*c;knifeH.position.y+=.08*c;knifeH.position.z+=.15*c;knifeH.rotation.x-=.9*c;knifeH.rotation.z+=.5*c}
if(knifeH.userData.pr&&knifeH.userData.mats)knifeH.userData.mats.forEach(m=>{if(m.color)m.color.setHSL((t*.8)%1,.85,.6)});
vh.color.copy(hemi.color);vh.groundColor.copy(hemi.groundColor)}
return{scene:scn,cam:vc,set,frame,swap(){st.swap=1;try{snd("swap",.7)}catch(e){}},inspect(){st.ia=1;st.ip=0;st.sf=0},onShot(f){cbShot=f},get inspecting(){return !!st.ia},stab(r,k){st.stab=1;st.kr=r|0;st.ks=ksty(k);st.cm=((st.cm|0)+1)%3},throwAnim(r){st.th=1;st.kr=r|0},cmv(){return st.cm|0},kick(k){st.rec=Math.min(1.4,st.rec+k);st.rr=Math.min(1.5,st.rr+k)},
flash(){if(LOD.mz){mzT=.07;if(!mzL.parent)sc.add(mzL)}if(gb){gb.mf.visible=true;gb.mf.material.rotation=rnd()*6;gb.mf.scale.setScalar(.26+rnd()*.14);flashT=.045}},get gb(){return gb},get ads(){return st.ads||0},
resize(){vc.aspect=innerWidth/innerHeight;vc.updateProjectionMatrix()}}})();
addEventListener("resize",VM.resize);

// ---------- input ----------
const clearKeys=()=>{for(const k in K)K[k]=0;firing=false;rmb=false;scoped=false;knifeCharging=false;knifeCharge=0;grenAim=false;try{clearGrenPrev()}catch(e){}};
const isGame=()=>state==="play"&&!menuOpen;
addEventListener("keydown",e=>{
if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
// macOS swallows the keyup of every key pressed while Command is held, so Command clears the keys instead of leaving them stuck
if(e.key==="Meta"){clearKeys();return}
if(inspOpen){ // gun inspect panel is open
if(e.code==="KeyI"||e.code==="Escape"){e.preventDefault();inspClose();return}
if(e.repeat)return;
if(e.code==="KeyZ"||e.code==="BracketLeft")inspSwap(-1);else if(e.code==="KeyX"||e.code==="BracketRight")inspSwap(1);else if(e.code==="Space"){e.preventDefault();inspReplay()}
return}
K[e.code]=1;if(!isGame()){if(state==="pause"&&!e.repeat&&e.code==="KeyM"){BigMap.toggle();return}if(state==="pause"&&!e.repeat&&e.code==="Escape"&&BigMap.on){BigMap.close();return}if(e.code==="Escape"&&!e.repeat&&(state==="pause"||state==="play"&&menuOpen))resume();return}
if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab","AltLeft","AltRight","ControlLeft","ControlRight"].includes(e.code))e.preventDefault();
if(e.code==="Tab"){scoreOpen=true;return}
if(e.repeat)return;
if(e.code==="Space"){P.jb=MV.jbuf;P.jpress=true;if(P.gr&&!(P.dead>0||P.fz>0||rL>0))tf("jump")}
if(e.code==="KeyR")reload();
if(e.code==="KeyP"){pauseGame();return}
if(e.code==="KeyM"){BigMap.toggle();return}
if(e.code==="KeyT"){if(mode==="parkour")restartMatch();return}
if(e.code==="KeyV"&&mode==="parkour"){pkPref=pkPref===3?1:3;pkView=pkPref;flash(pkView===3?"Third person view":"First person view",800);snd("ui",.6);return}
if(e.code==="KeyI"&&mode==="range"){inspStart();return}
if(e.code==="KeyG"){grenAim=true}
if(e.code==="Digit1"&&slot!==0&&mode!=="parkour"){slot=0;knifeCharging=false;knifeCharge=0;VM.swap();snd("ui",.6)}
if(mode==="range"&&(e.code==="KeyZ"||e.code==="KeyX"||e.code==="BracketLeft"||e.code==="BracketRight"))rangeSwap(e.code==="KeyX"||e.code==="BracketRight"?1:-1);
if(e.code==="Digit2"&&slot!==1&&mode!=="parkour"){slot=1;tf("knife");VM.swap();snd("ui",.6)}
if(/^Digit[3-7]$/.test(e.code))emote(+e.code[5]-3);
if(e.code==="Escape"){pauseGame();return}});
addEventListener("keyup",e=>{
K[e.code]=0;if(e.code==="Tab")scoreOpen=false;
if(e.code==="KeyG"){if(grenAim){grenAim=false;clearGrenPrev();throwGrenade()}}
});
addEventListener("blur",()=>{clearKeys();scoreOpen=false;if(state==="play"&&!menuOpen)pauseGame()});
addEventListener("contextmenu",e=>{if(state==="play")e.preventDefault()});
rd.domElement.addEventListener("mousedown",e=>{if(!isGame())return;if(!Aim.locked)Aim.request();if(e.button===2){if(slot===0&&P.dead<=0&&!P.em){if(S.opt&&S.opt.scopeToggle!==false){rmb=!rmb;snd("ui",.35)}else{rmb=true}} }else{firing=true;if(slot===1){if(knifeCD<=0){knifeCharging=true;knifeCharge=0}}else fire()}});
addEventListener("mouseup",e=>{if(e.button===2){if(!(S.opt&&S.opt.scopeToggle!==false))rmb=false}else{if(slot===1&&knifeCharging){const c=knifeCharge;knifeCharging=false;knifeCharge=0;if(knifeCD<=0){if(c>=.35)throwKnife(c);else stab()}}firing=false}});
// one gun/knife swap per scroll gesture: trackpads and free-spinning wheels fire dozens of wheel events, which used to flip the weapon back and forth
let wheelAcc=0,wheelT=0;
rd.domElement.addEventListener("wheel",e=>{if(!isGame())return;e.preventDefault();if(mode==="parkour")return;
const now=performance.now();if(now-wheelT<320){wheelT=now;return}
wheelAcc+=(e.deltaMode===1?e.deltaY*33:e.deltaY);if(Math.abs(wheelAcc)<40)return;
wheelAcc=0;wheelT=now;slot=slot?0:1;knifeCharging=false;knifeCharge=0;VM.swap()},{passive:false});
let leaveT=0;
function disarmLeave(){clearTimeout(leaveT);const b=$("pleave");if(!b)return;b.classList.remove("arm");b.firstElementChild.textContent="Leave match"}
// first press arms the button for 3 seconds, a second press inside that window really leaves
function leaveMatch(){const b=$("pleave");if(!b.classList.contains("arm")){b.classList.add("arm");b.firstElementChild.textContent="Press again to leave";leaveT=setTimeout(disarmLeave,3000);return}disarmLeave();quit()}
function pauseMeta(){let i=["Arena"];try{i=BigMap.info()}catch(e){}
$("pmeta").innerHTML=i.map(t=>`<span class="pill">${esc(t)}</span>`).join("");$("prestart").classList.toggle("hid",mode!=="parkour")}
function pauseGame(){
if(state!=="play"||menuOpen)return;if(CustomBattle.active){const panel=$("custom-battle-ui");if(panel)panel.hidden=true}clearKeys();Aim.release();syncSliders();BigMap.close();try{pauseQuests()}catch(e){}
state="pause";menuOpen=false;disarmLeave();pauseMeta();
document.body.classList.remove("playing");show("ps");
const q=$("pq");q.classList.add("fresh");setTimeout(()=>q.classList.remove("fresh"),900)}
function resume(){
if(CustomBattle.active)return CustomBattle.resume();
if(state!=="pause"&&state!=="play")return;
BigMap.close();state="play";menuOpen=false;show("");document.body.classList.add("playing");Aim.reset();Aim.request();
// 3s freeze after unpause — player and AI locked
P.fz=Math.max(P.fz,3);lastCount=0;P.vx=P.vz=0;clearKeys();flash("3",500);snd("tick")}
function quit(){
try{if(typeof Net!=="undefined"&&Net.ready)Net.exitMatch()}catch(e){}
try{Party.leave();corrReset()}catch(e){}
try{if(typeof PK!=="undefined"&&PK.st){if(PK.st.ghost){sc.remove(PK.st.ghost);disposeGeo(PK.st.ghost);PK.st.ghost=null}} }catch(e){}
try{clearEnts()}catch(e){}
BigMap.close();Aim.release();menuOpen=false;state="lobby";mode="";document.body.classList.remove("playing","edge");
$("hud").classList.add("hid");hide("ps",true);clearKeys();Fx.clear();clearGrenPrev();
try{if(bossEl)bossEl.style.display="none"}catch(e){}
lobbyUI();show("lobby");toast("Back in lobby")}
function restartMatch(){
if(mode!=="parkour")return;
if(state!=="play"&&state!=="pause")return;
if(menuOpen&&document.getElementById("puov"))return;
clearKeys();clearGrenPrev();knifeCharging=false;knifeCharge=0;
Aim.release();menuOpen=false;document.body.classList.remove("playing");
try{if(typeof PK!=="undefined"&&PK.st&&PK.st.ghost){sc.remove(PK.st.ghost);disposeGeo(PK.st.ghost);PK.st.ghost=null}}catch(e){}
flash("Restarting…",600);setTimeout(()=>{pkPicked=true;startGame0("parkour")},60)}


