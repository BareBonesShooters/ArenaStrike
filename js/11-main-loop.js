"use strict";
// ---------- lobby backdrop, adaptive quality and main loop ----------
function backdrop(){
bkReady=true;clearEnts();Fx.clear();endEmote();
buildWorld(pk(OUTDOOR),(rnd()*2147483647)|0,{});
cam.fov=58;cam.updateProjectionMatrix()}

// Four quality levels plus a render scale. Auto first shrinks the render resolution (down to half) whenever play averages under ~38 fps, drops a whole level once that is not enough, and
// wins resolution back only up to the last scale that held, so it never pulses. Picking a level by hand turns all of that off.
// High only: a cheap bloom. The frame is copied into a tiny canvas every other frame; CSS turns that copy into a soft glow of just the brightest parts and screens it over the scene
// sun glare: a soft halo, an anamorphic streak and a few lens ghosts that follow the sun across the screen, fade when a wall or building covers it, and stay off at night
const Flare=(()=>{let el=null,on=false,vis=0,occ=0,tick=0,kids=null,lo="";const sd=new T.Vector3(),cd=new T.Vector3(),pr=new T.Vector3();
const GH=[["sg",0,540],["st",0,0],["g1",.55,110],["g2",1.05,46],["g3",1.55,150],["g4",.25,70]];
function make(){el=document.createElement("div");el.id="sunfx";el.setAttribute("aria-hidden","true");el.innerHTML=GH.map(g=>`<i class="${g[0]}"></i>`).join("");rd.domElement.after(el);kids=[...el.children]}
function covered(){const px=cam.position.x,py=cam.position.y,pz=cam.position.z;for(let t=2.5;t<70;t+=3){const x=px+sd.x*t,y=py+sd.y*t,z=pz+sd.z*t;if(y>40)return false;for(const b of boxes)if(y<b.h&&Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2)return true}return false}
return{set(v){v=!!v&&!SOFT;if(v===on)return;on=v;if(v&&!el)make();if(el)el.style.display=v?"":"none"},
draw(){if(!on||!el)return;const th=THEMES[WORLD.theme];let a=0;
if(th&&(th.night||0)<.6&&state!=="title"){sd.copy(sun.position).sub(sun.target.position).normalize();cam.getWorldDirection(cd);const d=cd.dot(sd);
if(d>.25){if(!(tick++&3))occ=covered()?1:0;vis+=((occ?0:1)-vis)*.12;a=Math.min(1,(d-.25)/.55)*vis*(1-(th.night||0)*1.4)*(typeof scoped!=="undefined"&&scoped?.35:1)*(document.body.classList.contains("dthfx")?.2:1)}
else vis*=.9;
if(a>.01){pr.copy(cam.position).addScaledVector(sd,300).project(cam);const W=innerWidth,H=innerHeight,x=(pr.x*.5+.5)*W,y=(-pr.y*.5+.5)*H,cx=W/2,cy=H/2,fr=Math.min(1,Math.hypot(x-cx,y-cy)/(W*.6));
kids.forEach((k,i)=>{const g=GH[i],gx=x+(cx-x)*g[1],gy=y+(cy-y)*g[1];k.style.transform="translate("+gx.toFixed(1)+"px,"+gy.toFixed(1)+"px) translate(-50%,-50%)"+(i===1?" scaleX("+(1+fr*.5).toFixed(2)+")":"")});}}
const o=a>.01?a.toFixed(3):"0";if(o!==lo){lo=o;el.style.opacity=o;el.style.visibility=a>.01?"visible":"hidden"}}}})();
const Bloom=(()=>{let cv=null,x=null,on=false,w=0,h=0;
function size(){const nw=Math.max(64,Math.round(innerWidth/6)),nh=Math.max(48,Math.round(innerHeight/6));if(nw!==w||nh!==h){w=cv.width=nw;h=cv.height=nh}}
return{set(v){v=!!v&&!SOFT;if(v===on)return;on=v;if(v&&!cv){cv=document.createElement("canvas");cv.id="bloom";cv.setAttribute("aria-hidden","true");rd.domElement.after(cv);x=cv.getContext("2d");size()}
if(cv)cv.style.display=v?"":"none"},draw(){if(!on||!x)return;size();try{x.drawImage(rd.domElement,0,0,w,h)}catch(e){}}}})();
const QL=[
{n:"High",pr:1.5,sh:2048,cloud:2,props:1,fx:1,tex:1536,dust:1,lite:0,tm:1.12,mz:1,vg:1},
{n:"Medium",pr:1,sh:1024,cloud:2,props:.8,fx:.8,tex:1024,dust:.7,lite:0,tm:1.06,mz:0,vg:1},
{n:"Low",pr:1,sh:0,cloud:1,props:.6,fx:.6,tex:1024,dust:.5,lite:1,tm:0,mz:0,vg:0},
{n:"Potato",pr:.7,sh:0,cloud:0,props:.4,fx:.4,tex:512,dust:.25,lite:1,tm:0,mz:0,vg:0}];
const Q=(()=>{
let acc=0,n=0,skip=90,rs=1,cap=1,hold=0;
function fit(){rd.setPixelRatio(Math.min(devicePixelRatio||1,QL[S.gfx].pr)*rs);rd.setSize(innerWidth,innerHeight)}
function set(l,keep){
l=clamp(l|0,0,QL.length-1);S.gfx=l;const q=QL[l];
for(const k in LOD)LOD[k]=q[k];
if(!keep)rs=cap=1;
fit();
sun.castShadow=q.sh>0;
if(q.sh&&sun.shadow.mapSize.x!==q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
if(!q.sh&&sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}
Bloom.set(l===0);Flare.set(l<=1);document.body.classList.toggle("grade",l===0);document.body.classList.toggle("lite",!!q.lite);document.body.classList.toggle("vg",!!q.vg);
// filmic tone mapping (High and Medium) rolls bright skies and muzzle glare off smoothly instead of clipping them
const tmWas=rd.toneMapping;rd.toneMapping=q.tm?T.ACESFilmicToneMapping:T.NoToneMapping;rd.toneMappingExposure=q.tm||1;
if(q.mz&&!mzL.parent)sc.add(mzL);else if(!q.mz&&mzL.parent)sc.remove(mzL);
sc.traverse(o=>{if(o.userData&&o.userData.blob)o.visible=!q.sh});
if(tmWas!==rd.toneMapping)sc.traverse(o=>{if(o.material){for(const m of[].concat(o.material))m.needsUpdate=true}});
const th=THEMES[WORLD.theme];if(th)Sky.u.cloud.value=q.cloud>0?th.cloud:0;Sky.u.cq.value=q.cloud;
if(WORLD.dust)WORLD.dust.visible=q.dust>0;
acc=n=0;skip=90}
function pick(v){if(v==="auto"){S.auto=1;S.ac=0;set(HW.tier)}else{S.auto=0;set(+v)}sv()}
function tick(ms){
if(skip>0){skip--;return}
if(ms>250||!S.auto)return;acc+=ms;n++;
if(acc<1000&&n<90)return;
const avg=acc/n;acc=n=0;
if(avg>26){
hold=3;cap=Math.min(cap,rs-.04);
if(rs>.55){rs=Math.max(.5,rs-.12);fit()}
else if(S.gfx<QL.length-1){set(S.gfx+1,true);S.ac=S.gfx;rs=.8;cap=.8;fit();sv();toast("Graphics lowered to "+QL[S.gfx].n+" for smoother play")}}
else if(hold>0)hold--;
else if(avg<19.5&&rs<cap){rs=Math.min(cap,rs+.06);fit()}}
return{set,pick,tick,get scale(){return rs},reset(){acc=n=0;skip=90;cap=1}}})();
rd.shadowMap.autoUpdate=false;
Q.set(S.gfx==null?0:S.gfx);
// a GPU driver reset (common on Windows and Linux when a driver is pushed too hard) loses the WebGL context; three.js rebuilds it, and Auto drops a level so it does not happen again
rd.domElement.addEventListener("webglcontextrestored",()=>{
try{if(S.auto&&S.gfx<QL.length-1){Q.set(S.gfx+1);S.ac=S.gfx;sv();toast("Graphics driver reset. Lowered to "+QL[S.gfx].n)}else Q.set(S.gfx)}catch(e){}});

let lastT=performance.now(),clock=0,loopErr="",fr=0;
function loop(now){
requestAnimationFrame(loop);
const raw=now-lastT,dt=Math.min(.05,Math.max(0,raw/1000));lastT=now;clock+=dt;fr++;
try{
const playing=state==="play",paused=state==="pause";
// the lobby orbit is slow, so it renders at half rate (a third on weak settings) and leaves the GPU free for the blurred panels
if(!playing&&!paused&&state!=="title"&&fr%(S.gfx>1?(SOFT?6:3):2)){return}
// a paused scene is static, so it only needs an occasional redraw
if(paused&&fr%(S.gfx>1?4:2)){return}
if(playing){update(dt*Death.frame(dt));Q.tick(raw)}
else if(state==="title"){Title.frame(dt,clock)}
else if(!paused){
const a=clock*.11;
if(cam.fov!==58){cam.fov=58;cam.updateProjectionMatrix()}
cam.position.set(Math.sin(a)*30,14+Math.sin(clock*.2)*1.5,Math.cos(a)*30);cam.lookAt(0,2,0)}
worldFrame(dt,clock);animSkins(clock);if(playing)HB.update(dt);
if(!paused){Fx.step(dt);Fx.tracers(dt);Gfx.step(dt)}
rd.shadowMap.needsUpdate=!(fr&1)||S.gfx>1;
rd.render(sc,cam);
if(playing&&!(CustomBattle.active&&!CustomBattle.joined))Scope.lens(cg());
if((playing||paused||(state==="title"&&Title.fp))&&!(CustomBattle.active&&!CustomBattle.joined)){rd.autoClear=false;rd.clearDepth();rd.render(VM.scene,VM.cam);rd.autoClear=true}
if(!(fr&1))Bloom.draw();Flare.draw();
}catch(e){
rd.autoClear=true;
if(String(e)!==loopErr){loopErr=String(e);console.error(e)}}}

// software GL compiles shaders slowly, so the game's materials are compiled once while the lobby sits idle instead of freezing the first seconds of a match
function prewarm(){
const a=new T.Group(),b=new T.Group();
try{
a.add(mkHuman({gun:GB("g2")}),mkMon(0),mkMon(1),mkMon(2),tag("warm","#fff",2));
b.add(buildGun(GB("g2"),SK[0]).grp,buildKnife(KN[0]).grp);
sc.add(a);VM.scene.add(b);rd.compile(sc,cam);rd.compile(VM.scene,VM.cam)}catch(e){}
sc.remove(a);VM.scene.remove(b);disposeGeo(a);disposeGeo(b)}
if(SOFT)setTimeout(()=>{if(state!=="play")prewarm()},1200);

// ---------- title screen: a live Monster Rush wave with a squad shooting it ----------
const Title=(()=>{
// the title screen is a showreel made of the game's own systems: a first-person Monster Rush with your equipped gun, a real parkour course,
// the weapon inspector on rarity-ordered guns and knives, the case reel, and a bot duel. Nothing here is a mock-up.
let on=false,seg=-1,segT=0,tt=0,objs=[],fade=null,lab=null,swp=0,A={},fpOn=false,ov=null,fails=0,glowTex=null;
const SEGS=["rush","parkour","inspect","cases","duel"],DUR={rush:17,parkour:15,inspect:15,cases:13,duel:13};
const add=o=>{sc.add(o);objs.push(o);return o};
function clearSeg(){if(A&&A.keep){mode=A.keep.mode;wave=A.keep.wave;PU=A.keep.PU;wq=0;wt=0;wn=0;try{for(const o of projs)sc.remove(o.m);projs.length=0}catch(e){}try{clearEnts()}catch(e){}}for(const o of objs){sc.remove(o);try{disposeGeo(o)}catch(e){}}objs=[];try{Fx.clear()}catch(e){}if(ov){ov.remove();ov=null}fpOn=false;A={};if(cam.fov!==66){cam.fov=66;cam.updateProjectionMatrix()}}
const setLab=t=>{if(lab&&lab.textContent!==t)lab.textContent=t};
const fwdV=(ry)=>[Math.sin(ry),Math.cos(ry)];
const mkOv=html=>{ov=document.createElement("div");ov.className="tov";ov.innerHTML=html;const el=$("title");if(el)el.appendChild(ov);return ov};
function world(th,seed,opts){clearEnts();Fx.clear();buildWorld(th,seed,opts)}
const rseed=()=>(rnd()*2147483647)|0,orbit=()=>{const a=tt*.11;if(cam.fov!==58){cam.fov=58;cam.updateProjectionMatrix()}cam.position.set(Math.sin(a)*30,14+Math.sin(tt*.2)*1.5,Math.cos(a)*30);cam.lookAt(0,2,0)};
function glowT(){if(glowTex)return glowTex;const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,"rgba(255,255,255,.9)");g.addColorStop(.35,"rgba(255,255,255,.28)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,128,128);glowTex=new T.CanvasTexture(c);return glowTex}
// ---------- monster rush: the real Ruined Hall arena, real spawn points, real monster and boss AI, first person with your equipped gun ----------
function startRush(){
world("ruin",rseed(),{});
const keep={mode,wave,PU};mode="waves";PU=PUbase();PU.on=1;wave=3;wq=0;wt=0;wn=0;
const s=freeSpot(0,H-8);placePlayer(s,Math.atan2(s.x,s.z),0);
const g=cg(),sk=I(eq().s)||SK[0],kn=I(eq().k)||KN[0],ps=I(eq().p)||PS[0];VM.set(g,sk,kn,ps);fpOn=true;
mkOv('<div style="position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;border:1.5px solid rgba(255,255,255,.85);box-shadow:0 0 4px #000"></div><div id="bossbar" style="display:none;top:40vh;width:min(520px,80vw)"><div class="bn"></div><div class="bt"><i class="bl"></i><i class="bf"></i><u style="left:25%"></u><u style="left:50%"></u><u style="left:75%"></u></div></div>');
A={g,keep,ex:s.x,ez:s.z,ey:floorAt(s.x,s.z,2)+1.7,spawnT:.2,kills:0,cd:.5,ax:0,ay:1.3,az:0,boss:null,bossDone:false,t:0,bar:ov.querySelector("#bossbar"),lag:1,rush:1}}
function rushKill(e){
const a=A,p=e.g.position,i=E.indexOf(e);a.kills++;
Fx.burst({x:p.x,y:1.2,z:p.z},e.boss?0xffaa33:e.k===2?0xff3344:0x7cff5a,e.boss?60:e.k===2?30:14,5,.12,2,16);
if(e.k===2||e.boss)ringFx(p.x,p.z,e.boss?9:5,0xff6a2a,.5);
if(e.boss){a.bossDone=true;a.boss=null;a.bar.style.display="none";const cols=[0xffd24a,0xff6a2a,0xff3344,0xffffff];for(let k=0;k<4;k++){Fx.burst({x:p.x,y:1.2+k*.5,z:p.z},cols[k],24+k*8,7+k,.1+.02*k,2+k*.3,28);ringFx(p.x,p.z,3+k*2.6,cols[k],.6+k*.15)}}
if(i>=0)E.splice(i,1);dropModel(e.g,e.tag)}
function fRush(dt){
const a=A,cp=cam.position;a.t+=dt;
// the game's own spawner: waves of mixed monsters from the arena spawn points, then the boss
a.spawnT-=dt;
if((a.t<7.5||a.bossDone)&&a.spawnT<=0&&E.length<10){a.spawnT=.6;spawnMon()}
if(!a.boss&&!a.bossDone&&a.t>7.5){wave=5;spawnBoss();const b=E.find(x=>x.boss);if(b){b.hp=b.hpMax=900;a.boss=b}try{flashScreen("#ff2244")}catch(e){}}
// pick the nearest monster the player can actually see, skipping an invulnerable boss while minions live
const minions=E.some(x=>x.t==="mon"&&!x.boss&&x.hp>0);
let tg=null,bd=1e9;
for(const e of E){if(e.hp<=0||e.em>0||(e.boss&&minions))continue;const p=e.g.position,d=Math.hypot(p.x-a.ex,p.z-a.ez);if(d<bd&&los(a.ex,a.ey,a.ez,p.x,e.boss?2.2:1.1,p.z)){bd=d;tg=e}}
let tx=0,ty=1.3,tz=0;if(tg){tx=tg.g.position.x;tz=tg.g.position.z;ty=tg.boss?2.2:1.1}
a.ax+=(tx-a.ax)*Math.min(1,dt*9);a.ay+=(ty-a.ay)*Math.min(1,dt*9);a.az+=(tz-a.az)*Math.min(1,dt*9);
cp.set(a.ex,a.ey+Math.sin(tt*2.1)*.015,a.ez);cam.lookAt(a.ax,a.ay,a.az);
if(cam.fov!==75){cam.fov=75;cam.updateProjectionMatrix()}
a.cd-=dt;
if(tg&&a.cd<=0&&Math.hypot(a.ax-tx,a.az-tz)<1.2+bd*.03){
a.cd=clamp(a.g.t,.09,.3)*(1+rnd()*.25);VM.kick(.55);VM.flash();
const f=new T.Vector3(a.ax-cp.x,a.ay-cp.y,a.az-cp.z).normalize(),rt=new T.Vector3(f.z,0,-f.x).normalize();
const a0=cp.clone().addScaledVector(f,1.1).addScaledVector(rt,.22);a0.y-=.18;
const b0=new T.Vector3(tx+(rnd()-.5)*.5,ty+(rnd()-.5)*.4,tz);
Fx.tracer(a0,b0,a.g.glow?0x66e0ff:0xffe9a0,.035);Fx.burst(b0,tg.boss?0xff5533:0x7cff5a,3,3,.06,1,12);
if(rnd()<.9){tg.hp-=Math.max(8,a.g.d*(a.g.pel?3:1));tg.hf=.1;hurtFlash(tg.g,true);monBar(tg);if(tg.hp<=0)rushKill(tg)}}
VM.frame(dt,{dyaw:0,dpitch:0,speed:0,gr:true,scoped:false,reload:0,slot:0,hide:false,pull:0,knifeCD:0,charging:false,charge:0});
for(const e of E.slice())if(e.hp>0)monStep(e,dt);
projStep(dt);
const b=a.boss;
if(b&&b.hp>0){const f=clamp(b.hp/b.hpMax,0,1);a.bar.style.display="block";a.bar.querySelector(".bn").textContent=b.name+(minions?"  ·  CLEAR MINIONS":"");
a.bar.querySelector(".bf").style.width=f*100+"%";a.lag+=(f-a.lag)*.04;if(a.lag<f)a.lag=f;a.bar.querySelector(".bl").style.width=a.lag*100+"%"}
setLab("MONSTER RUSH  ·  WAVE "+wave+(a.boss?"  ·  BOSS":"")+"  ·  "+a.kills+" KILLS")}
// ---------- parkour: a real generated course (platforms, lava, gems, checkpoints) run with the real runner pose ----------
function lobbyRunReset(r){const u=r.userData;u.torso.position.set(0,1.26,0);u.torso.rotation.set(0,0,0);u.head.position.set(0,1.9,0);u.head.rotation.set(0,0,0);
u.arms[0].position.set(-.36,1.56,0);u.arms[1].position.set(.36,1.56,0);u.arms.forEach(x=>{x.rotation.set(0,0,0);if(x.userData.el)x.userData.el.rotation.set(0,0,0)});
u.legs.forEach(l=>l.rotation.set(0,0,0));r.rotation.z=0;r.rotation.x=0}
function startParkour(){
const mp=pk(PKMAPS),df=pk(["easy","medium","hard"]);
world(mp.th,mp.seed,{empty:true,parkour:df,pkmap:mp});
const c=WORLD.course,rt=c&&c.route;if(!rt||rt.length<3)throw new Error("parkour route missing");
const ps=pk(PS.filter(x=>x.sty)),r=mkHuman({body:ps.c,trim:ps.t,style:ps.sty});r.userData.nar=true;add(r);
A={rt,r,i:0,t:0,ry:0,fin:0,fw:0,clock:0,lab:"PARKOUR  ·  "+PKDN[df]+"  ·  "+mp.n};
const s=rt[0];r.position.set(s.x,s.h,s.z);cam.fov=70;cam.updateProjectionMatrix();cam.position.set(s.x,s.h+3,s.z+6)}
function fParkour(dt){
const a=A,rt=a.rt,r=a.r;let ry=a.ry;
if(a.fin>0){a.fin+=dt;const lp=rt[rt.length-1];r.position.set(lp.x,lp.h+danceHuman(r,a.fin,a.fin<1.6?"flip":"lev",ry),lp.z);
a.fw-=dt;if(a.fw<=0){a.fw=.28;Fx.burst({x:lp.x+(rnd()-.5)*8,y:lp.h+4+rnd()*4,z:lp.z-2+rnd()*4},pk([0xffd24a,0xff5a6a,0x5ad1ff,0x7dff9a,0xe879f9]),26,8,.13,3,14)}
setLab(a.lab+"  ·  COURSE COMPLETE  "+a.clock.toFixed(1)+"s")}
else{
a.clock+=dt;
const p0=rt[a.i],p1=rt[a.i+1],dx=p1.x-p0.x,dz=p1.z-p0.z,dist=Math.hypot(dx,dz)||1,dur=clamp(dist/10,.42,.95);
a.t+=dt/dur;
if(a.t>=1){a.t=0;a.i++;if(a.i>=rt.length-1){a.fin=.01;a.fw=0;lobbyRunReset(r);return}}
const q0=rt[a.i],q1=rt[a.i+1],ex=q1.x-q0.x,ez=q1.z-q0.z,ed=Math.hypot(ex,ez)||1,u=a.t;
const s0=clamp(Math.max(q0.w,q0.d)/2/ed,0,.45),s1=1-clamp(Math.max(q1.w,q1.d)/2/ed,0,.45),span=Math.max(.05,s1-s0),v=clamp((u-s0)/span,0,1),air=v>0&&v<1&&span*ed>1;
const x=lerp(q0.x,q1.x,u),z=lerp(q0.z,q1.z,u),y=q0.h+(q1.h-q0.h)*v+(air?Math.sin(v*Math.PI)*(.8+ed*.04):0);
ry=turnTo(ry,Math.atan2(ex,ez),dt*10);r.rotation.y=ry;r.position.set(x,y,z);a.ry=ry;
narutoPose(r,dt,1.25,air);
setLab(a.lab+"  ·  PLATFORM "+(a.i+1)+" / "+rt.length+"  ·  "+a.clock.toFixed(1)+"s")}
const [fx,fz]=fwdV(ry),rx=fz,rz=-fx,rp=r.position;
const want=new T.Vector3(rp.x-fx*3.9+rx*.7,rp.y+2.1,rp.z-fz*3.9+rz*.7);
cam.position.lerp(want,1-Math.exp(-dt*5));cam.lookAt(rp.x+fx*2.2,rp.y+1.4,rp.z+fz*2.2)}
// ---------- weapon inspection: the real gun and knife models, shown in rarity order ----------
function startInspect(){
clearEnts();Fx.clear();
const C=new T.Vector3(0,400,0);
const dome=add(new T.Mesh(new T.SphereGeometry(16,24,16),new T.MeshBasicMaterial({color:0x090e1b,side:T.BackSide,fog:false})));dome.position.copy(C);
const fl=add(new T.Mesh(new T.CircleGeometry(5,48),new T.MeshBasicMaterial({color:0x111a2f,fog:false})));fl.rotation.x=-Math.PI/2;fl.position.set(C.x,C.y-1.3,C.z);
const pickN=(L,n)=>{const p=L.slice(),o=[];while(o.length<n&&p.length)o.push(p.splice((rnd()*p.length)|0,1)[0]);return o};
const gs=G.filter(x=>x.r>=3),ks=KN.filter(x=>x.r>=3);
const list=[...pickN(gs.length?gs:G,3),...pickN(ks.length?ks:KN,2)].sort((x,y)=>x.r-y.r);
const skins=SK.filter(s=>s.r>=2);
mkOv('<div id="ipanel" style="position:absolute;right:5vw;top:64%;transform:translateY(-50%);width:min(250px,36vw);text-align:left;padding:12px 15px;border-radius:16px;background:rgba(10,16,32,.66);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 20px 50px -20px #000"></div>');
A={C,list,i:-1,t:99,pivot:null,glow:null,sc:1,skin:skins.length?pk(skins):SK[0],panel:ov.querySelector("#ipanel")};
cam.fov=38;cam.updateProjectionMatrix()}
function inspShow(i){
const a=A,it=a.list[i%a.list.length],C=a.C,isG=G.includes(it),rc=RC[it.r];
if(a.pivot){sc.remove(a.pivot);try{disposeGeo(a.pivot)}catch(e){}objs=objs.filter(o=>o!==a.pivot)}
if(a.glow){sc.remove(a.glow);objs=objs.filter(o=>o!==a.glow)}
const b=isG?buildGun(it,a.skin):buildKnife(it),pivot=new T.Group(),holder=new T.Group();
b.grp.rotation.y=-Math.PI/2;if(b.mf)b.grp.remove(b.mf);b.grp.updateMatrixWorld(true);
const box=new T.Box3().setFromObject(b.grp),size=box.getSize(new T.Vector3()),ctr=box.getCenter(new T.Vector3());
if(b.mf){b.grp.add(b.mf);b.mf.visible=false}
b.grp.position.copy(ctr).negate();holder.add(b.grp);pivot.add(holder);
a.sc=2.3/Math.max(size.x,size.y,size.z,.01);pivot.scale.setScalar(a.sc);pivot.position.set(C.x-.55,C.y,C.z);add(pivot);a.pivot=pivot;
const gl=new T.Sprite(new T.SpriteMaterial({map:glowT(),color:new T.Color(rc),transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,fog:false}));gl.scale.set(6,6,1);gl.position.set(C.x-.55,C.y,C.z-1.5);add(gl);a.glow=gl;
const bar=(l,v)=>'<div style="display:flex;align-items:center;gap:10px;margin-top:7px;font-size:.72rem;color:#cbd5e1"><span style="width:84px">'+l+'</span><span style="flex:1;height:6px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden"><i style="display:block;height:100%;width:'+clamp(v,.05,1)*100+'%;background:'+rc+';box-shadow:0 0 8px '+rc+'"></i></span></div>';
const mx=k=>Math.max(...G.map(x=>x[k]||0)),stats=isG?bar("Damage",it.d/mx("d"))+bar("Fire rate",(1/it.t)/Math.max(...G.map(x=>1/x.t)))+bar("Magazine",it.m/mx("m"))+bar("Reload speed",1-it.rl/mx("rl")+.15):bar("Reach",((it.s&&it.s.len)||.3)/.7)+bar("Blade width",((it.s&&it.s.w)||.04)/.09);
a.panel.style.borderColor=rc;
a.panel.innerHTML='<div style="font-size:.7rem;letter-spacing:.22em;text-transform:uppercase;color:#94a3b8">Inspect · '+(isG?"Gun":"Knife")+'</div><div style="font-size:1.25rem;font-weight:900;margin:3px 0;color:#fff">'+esc(it.n)+'</div><span style="display:inline-block;padding:3px 11px;border-radius:999px;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0b1020;background:'+rc+'">'+R[it.r]+'</span>'+stats}
function fInspect(dt){
const a=A;a.t+=dt;if(a.t>3.7){a.t=0;a.i++;inspShow(a.i)}
const it=a.list[a.i%a.list.length],ap=clamp(a.t/.45,0,1),e=1-Math.pow(1-ap,3);
if(a.pivot){a.pivot.rotation.set(.18+Math.sin(tt*.7)*.08,tt*.9+a.i*1.3,0);a.pivot.position.y=a.C.y+Math.sin(tt*1.6)*.04;a.pivot.scale.setScalar(a.sc*(.8+.2*e))}
cam.position.set(a.C.x,a.C.y+.25,a.C.z+3.6);cam.lookAt(a.C.x-.35,a.C.y+.3,a.C.z);
setLab("INSPECT  ·  "+(it?it.n:"")+"  ·  "+(it?R[it.r]:""))}
// ---------- case opening: the real reel, real items and odds, over the same lobby scene ----------
function startCases(){
world(pk(OUTDOOR),rseed(),{});
const cs=CS.filter(c=>c.L.length>6&&!(c.L===FN)),c=pk(cs.length?cs:CS);let win=roll(c),tries=0;while(win.r<3&&tries++<40)win=roll(c);
const N=44,WI=36,cards=[];for(let k=0;k<N;k++)cards.push(k===WI?win:pk(c.L));
mkOv('<div id="cbox" style="position:absolute;left:50%;top:63%;transform:translate(-50%,-50%);width:min(600px,88vw);padding:12px 16px 14px;border-radius:18px;background:rgba(10,16,32,.66);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 24px 60px -20px #000;text-align:center"><div class="eyebrow">Case opening</div><h3 style="margin:2px 0 8px;font-size:1.1rem">'+esc(c.n)+'</h3><div class="reelwrap"><div class="reel">'+cards.map(it=>'<div class="rc" style="--rc:'+rcol(it)+'">'+thumb(it,{w:160,h:100})+'<span style="font-size:.72rem">'+esc(it.n)+'</span></div>').join("")+'</div></div><div id="cres" style="min-height:24px;margin-top:8px;font-weight:800;font-size:.95rem;opacity:0;transition:opacity .4s"></div></div>');
try{fillThumbs(ov)}catch(e){}
A={c,win,t:0,done:false,reel:ov.querySelector(".reel"),res:ov.querySelector("#cres"),started:false}}
function fCases(dt){
const a=A;a.t+=dt;orbit();
if(!a.started&&a.t>.8){a.started=true;const wrap=a.reel.parentNode,cw=wrap.clientWidth||600,stop=36*104+48-cw/2+(rnd()-.5)*60;
a.reel.animate([{transform:"translateX(0)"},{transform:"translateX("+(-stop)+"px)"}],{duration:5200,easing:"cubic-bezier(.12,.72,.08,1)",fill:"forwards"})}
if(!a.done&&a.t>6.4){a.done=true;const w=a.win;a.res.innerHTML='<span style="color:'+rcol(w)+'">'+R[w.r]+'</span> · '+esc(w.n);a.res.style.opacity=1;try{flashScreen(rcol(w))}catch(e){}}
setLab("CASES  ·  "+a.c.n+(a.done?"  ·  "+R[a.win.r]+" pull":""))}
// ---------- duel vs bot, on a real arena ----------
function startDuel(){
world(pk(OUTDOOR),rseed(),{});
const gl=[GB("g2"),GB("g4"),GB("g5"),GB("g1"),GB("g3")].filter(Boolean),o1=pk(PS.filter(x=>x.sty)),o2=pk(PS.filter(x=>x.sty));
const mk=(col,xx,ps,gn)=>{const g=mkHuman({body:col,trim:0x1f2937,style:ps.sty,gun:gn});g.position.set(xx,0,-8);add(g);return{g,gn,x:xx,z:-8,hp:100,cd:.6+rnd()*.5,dead:0,kills:0,sd:1,sdT:0,spd:0,col}};
A={bots:[mk(0x2563eb,-12,o1,pk(gl)),mk(0xef4444,12,o2,pk(gl))],round:1}}
function fDuel(dt){
const [b0,b1]=A.bots;
for(const b of A.bots){
const o=b===b0?b1:b0,gp=b.g.position;
if(b.dead>0){b.dead-=dt;const f=clamp((1.6-b.dead)/.35,0,1);b.g.rotation.x=-f*1.45;b.g.position.y=f*.12;
if(b.dead<=0){b.hp=100;b.g.rotation.x=0;b.g.position.y=0;b.x=(b===b0?-1:1)*(10+Math.random()*4);b.z=-8+(Math.random()-.5)*8;b.cd=.8}
continue}
if(o.dead>0&&b.spd>0)b.spd*=.9;
let dx=o.x-b.x,dz=o.z-b.z;const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
b.sdT-=dt;if(b.sdT<=0){b.sd=Math.random()<.5?-1:1;b.sdT=.7+Math.random()*1.1}
const fwd=o.dead>0?0:clamp((d-11)*.5,-3,3),px=-dz,pz=dx,sp=3.4;
b.x=clamp(b.x+(dx*fwd+px*b.sd*sp)*dt,-18,18);b.z=clamp(b.z+(dz*fwd+pz*b.sd*sp)*dt,-20,2);
b.spd=Math.hypot(dx*fwd+px*b.sd*sp,dz*fwd+pz*b.sd*sp);
gp.x=b.x;gp.z=b.z;b.g.rotation.y=turnTo(b.g.rotation.y,Math.atan2(o.x-b.x,o.z-b.z),dt*9);
b.cd-=dt;
if(b.cd<=0&&o.dead<=0){
b.cd=b.gn.t*(1+Math.random()*.7)+.14;b.g.userData.kick=1;setMuzzle(b.g,true);setTimeout(()=>{try{setMuzzle(b.g,false)}catch(e){}},50);
const fy=b.g.rotation.y,a0=new T.Vector3(gp.x+Math.sin(fy)*.9,1.4,gp.z+Math.cos(fy)*.9),hit=Math.random()<.6,e=new T.Vector3(o.x+(hit?0:(Math.random()-.5)*2.5),1.2+Math.random()*.5,o.z);
Fx.tracer(a0,e,b.gn.glow?0x66e0ff:0xffe9a0,.035);
if(hit){o.hp-=9+Math.random()*7;Fx.burst(e,0xff3b3b,5,3,.07,1,12);hurtFlash(o.g,true);setTimeout(()=>{try{hurtFlash(o.g,false)}catch(er){}},90);
if(o.hp<=0){o.dead=1.6;b.kills++;Fx.burst({x:o.x,y:1.2,z:o.z},0xff5555,26,6,.12,2,16);if(b.kills>=5){b0.kills=b1.kills=0;A.round++}}}}
poseHuman(b.g,dt,b.spd/6.5,0)}
setLab("DUEL VS BOT  ·  BLUE "+b0.kills+"  -  "+b1.kills+" RED");
const ang=tt*.2,cx=(b0.x+b1.x)/2,cz=(b0.z+b1.z)/2;
cam.position.set(cx+Math.sin(ang)*17,5.4,cz+Math.cos(ang)*17);cam.lookAt(cx,1.5,cz)}

const RUN={rush:fRush,parkour:fParkour,inspect:fInspect,cases:fCases,duel:fDuel},START={rush:startRush,parkour:startParkour,inspect:startInspect,cases:startCases,duel:startDuel};
function goSeg(i){clearSeg();seg=((i%SEGS.length)+SEGS.length)%SEGS.length;segT=0;swp=0;
try{START[SEGS[seg]]();fails=0}catch(err){console.error(err);clearSeg();if(++fails<SEGS.length)goSeg(seg+1);else{fails=0;end()}}}
function begin(){
try{
on=true;state="title";bkReady=true;clearEnts();Fx.clear();endEmote();
cam.fov=66;cam.updateProjectionMatrix();
const el=$("title");
fade=document.createElement("div");fade.style.cssText="position:fixed;inset:0;background:#000;opacity:0;transition:opacity .4s;pointer-events:none;z-index:-1";el.appendChild(fade);
lab=document.createElement("div");lab.style.cssText="position:absolute;left:22px;bottom:20px;font-weight:800;letter-spacing:.14em;font-size:.8rem;color:#fff;text-shadow:0 2px 8px #000;text-transform:uppercase;text-align:left;pointer-events:none;z-index:3";el.appendChild(lab);
goSeg(Math.floor(Math.random()*SEGS.length));
const go=e=>{if(!on||e.metaKey||e.ctrlKey||e.altKey||/^F\d+$/.test(e.key||""))return;e.stopImmediatePropagation();e.preventDefault();end()};
addEventListener("keydown",go,true);addEventListener("click",go,true)
}catch(err){console.error(err);end()}}
function end(){
if(!on&&!objs.length)return;
on=false;clearSeg();
const el=$("title");if(el){el.classList.add("out");setTimeout(()=>el.remove(),600)}
try{snd("ui")}catch(e){}
bkReady=false;state="lobby";goLobby()}
function frame(dt,t){
if(!on)return;tt+=dt;segT+=dt;
const k=SEGS[seg];
try{RUN[k](dt)}catch(err){console.error(err);goSeg(seg+1)}
if(!swp&&segT>DUR[k]-.45){swp=1;if(fade)fade.style.opacity=1}
if(segT>DUR[k]){goSeg(seg+1);if(fade)fade.style.opacity=0}}
return{begin,end,frame,get fp(){return fpOn}}})();

addEventListener("resize",()=>Aim.reset());
document.addEventListener("visibilitychange",()=>{if(document.hidden){clearKeys();lastT=performance.now()}else Q.reset()});
setVol(S.vol);primeSnd();
lobbyUI();Title.begin();
requestAnimationFrame(loop);

// ---------- touch controls and profile boot ----------
(function touchUI(){
// Built only when the main pointer is a finger on a device that reports touch points. Desktops and laptops never get any of this.
const force=/[?&]touch=1/.test(location.search);
if(!force&&!(matchMedia("(pointer:coarse)").matches&&(navigator.maxTouchPoints>0||"ontouchstart" in window)))return;
document.body.classList.add("touch");Aim.touchOn();
const ic=(p)=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';
const d=document.createElement("div");d.id="tc";d.dataset.m="";
d.innerHTML='<div id="tl"></div><div id="tz"></div><div id="tj"><i></i><b>SPRINT</b></div>'
+'<button id="tfl" aria-label="Fire">FIRE</button><button id="tf" aria-label="Fire">FIRE</button>'
+'<button id="tjp" aria-label="Jump">'+ic('<path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')+'JUMP</button>'
+'<button id="trl" aria-label="Reload">'+ic('<path d="M19 12a7 7 0 1 1-2.1-5M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')+'RELOAD</button>'
+'<button id="tcr" aria-label="Crouch or slide">'+ic('<path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')+'CROUCH</button>'
+'<button id="tsw" aria-label="Swap weapon">KNIFE</button>'
+'<button id="tad" aria-label="Aim down sights">'+ic('<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke="currentColor" stroke-width="2"/>')+'AIM</button>'
+'<button id="tgr" aria-label="Grenade, hold to aim and release to throw">'+ic('<circle cx="12" cy="14" r="6" fill="currentColor"/><path d="M12 8V4h4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>')+'NADE</button>'
+'<button id="tps" aria-label="Pause">II</button><button id="tsc" aria-label="Scoreboard">TAB</button><button id="tem" aria-label="Emotes">EMOTE</button><button id="tmp" aria-label="Map">MAP</button>'
+'<button id="tpk1" class="md pk" aria-label="Restart run">RESET</button><button id="tpk2" class="md pk" aria-label="Change view">VIEW</button><button id="tri" class="md rg" aria-label="Inspect gun">LOOK</button>'
+'<div id="tep"></div>';
document.body.appendChild(d);
const rot=document.createElement("div");rot.id="rot";rot.innerHTML='<svg viewBox="0 0 64 64"><rect x="20" y="6" width="24" height="46" rx="5"/><path d="M30 46h4"/></svg><b>Turn your phone sideways</b><span>Arena Strike plays best in landscape.</span>';document.body.appendChild(rot);
const key=(c,dn)=>dispatchEvent(new KeyboardEvent(dn?"keydown":"keyup",{code:c,key:c,bubbles:true})),held={},set=(c,v)=>{if(!!held[c]!==v){held[c]=v;key(c,v)}};
const buzz=n=>{try{if(S.opt&&S.opt.haptics===false)return;navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
let fsTried=false;const goFull=()=>{if(fsTried)return;fsTried=true;try{const de=document.documentElement,f=de.requestFullscreen||de.webkitRequestFullscreen;if(f&&!document.fullscreenElement){const p=f.call(de);p&&p.then&&p.then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(()=>{})}catch(e){}}).catch(()=>{})}}catch(e){}};
const tj=$("tj"),knob=tj.firstChild;let jid=null,j0=null,lid=null,lx=0,ly=0;
const jmove=(x,y)=>{const dx=x-j0.x,dy=y-j0.y,l=Math.hypot(dx,dy)||1,m=Math.min(l,56),nx=dx/l*m,ny=dy/l*m;knob.style.transform=`translate(${nx}px,${ny}px)`;const dz=16;
set("KeyW",ny<-dz);set("KeyS",ny>dz);set("KeyA",nx<-dz);set("KeyD",nx>dz);const sp=ny<-48&&Math.abs(nx)<40;set("ShiftLeft",sp);tj.classList.toggle("sp",sp)};
const jend=()=>{jid=null;["KeyW","KeyS","KeyA","KeyD","ShiftLeft"].forEach(c=>set(c,false));knob.style.transform="";tj.classList.remove("on","sp");tj.style.left="";tj.style.top="";tj.style.bottom="";tj.style.marginLeft=""};
const z=$("tz");
z.addEventListener("pointerdown",e=>{if(jid!=null)return;e.preventDefault();goFull();try{z.setPointerCapture(e.pointerId)}catch(_){}jid=e.pointerId;j0={x:e.clientX,y:e.clientY};tj.classList.add("on");tj.style.left=(e.clientX-62)+"px";tj.style.top=(e.clientY-62)+"px";tj.style.bottom="auto";tj.style.marginLeft="0"});
z.addEventListener("pointermove",e=>{if(e.pointerId===jid)jmove(e.clientX,e.clientY)});z.addEventListener("pointerup",e=>{if(e.pointerId===jid)jend()});z.addEventListener("pointercancel",e=>{if(e.pointerId===jid)jend()});
const look=(dx,dy)=>Aim.touchLook(dx*2.2,dy*2.2),l=$("tl");
l.addEventListener("pointerdown",e=>{if(lid!=null)return;e.preventDefault();goFull();try{l.setPointerCapture(e.pointerId)}catch(_){}lid=e.pointerId;lx=e.clientX;ly=e.clientY});
l.addEventListener("pointermove",e=>{if(e.pointerId!==lid)return;look(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY});
const lend=e=>{if(e.pointerId===lid)lid=null};l.addEventListener("pointerup",lend);l.addEventListener("pointercancel",lend);
// a button can also steer the view: fire buttons keep aiming while the thumb drags
const bind=(id,dn,up,steer)=>{const b=$(id);let pid=null,px=0,py=0;
b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();goFull();try{b.setPointerCapture(e.pointerId)}catch(_){}pid=e.pointerId;px=e.clientX;py=e.clientY;b.classList.add("on");buzz(8);dn()});
if(steer)b.addEventListener("pointermove",e=>{if(e.pointerId!==pid)return;look(e.clientX-px,e.clientY-py);px=e.clientX;py=e.clientY});
const u=e=>{if(e.pointerId!==pid)return;pid=null;b.classList.remove("on");if(up)up()};b.addEventListener("pointerup",u);b.addEventListener("pointercancel",u)};
const fireDn=()=>rd.domElement.dispatchEvent(new MouseEvent("mousedown",{button:0,bubbles:true})),fireUp=()=>dispatchEvent(new MouseEvent("mouseup",{button:0}));
bind("tf",fireDn,fireUp,true);bind("tfl",fireDn,fireUp,true);
bind("tjp",()=>key("Space",1),()=>key("Space",0));
bind("trl",()=>{key("KeyR",1);key("KeyR",0)});
bind("tcr",()=>{const v=!held.ControlLeft;set("ControlLeft",v);$("tcr").classList.toggle("lk",v)},null);
bind("tsw",()=>{const kn=slot!==1,c=kn?"Digit2":"Digit1";key(c,1);key(c,0)});
bind("tad",()=>rd.domElement.dispatchEvent(new MouseEvent("mousedown",{button:2,bubbles:true})),()=>dispatchEvent(new MouseEvent("mouseup",{button:2})));
bind("tgr",()=>key("KeyG",1),()=>key("KeyG",0));
bind("tps",()=>pauseGame());
bind("tmp",()=>BigMap.toggle());
bind("tsc",()=>key("Tab",1),()=>key("Tab",0));
bind("tpk1",()=>{key("KeyT",1);key("KeyT",0)});bind("tpk2",()=>{key("KeyV",1);key("KeyV",0)});bind("tri",()=>{key("KeyI",1);key("KeyI",0)});
// emote picker lists the emotes in the current loadout
const ep=$("tep");
bind("tem",()=>{if(ep.classList.contains("open")){ep.classList.remove("open");return}
const e=eq().e;ep.innerHTML=e.map((id,i)=>{const it=id&&S.own[id]&&I(id);return it?`<button data-i="${i}">${esc(it.n)}</button>`:""}).join("")||'<button disabled>No emotes</button>';ep.classList.add("open")});
ep.addEventListener("pointerdown",e=>{const b=e.target.closest("button[data-i]");if(!b)return;e.preventDefault();e.stopPropagation();ep.classList.remove("open");key("Digit"+(3+ +b.dataset.i),1);key("Digit"+(3+ +b.dataset.i),0)});
// state that follows the game: mode specific buttons, knife label, portrait pause, and no stuck inputs when a menu opens
let lastPlay=false;
setInterval(()=>{const playing=document.body.classList.contains("playing");
if(d.dataset.m!==mode)d.dataset.m=mode;
const sw=$("tsw");const want=slot===1?"GUN":"KNIFE";if(sw.textContent!==want)sw.textContent=want;
if(!(slot===0))$("tad").style.opacity=.35;else $("tad").style.opacity="";
if(playing&&!lastPlay){ep.classList.remove("open");$("tcr").classList.remove("lk");set("ControlLeft",false)}
if(!playing&&lastPlay){["KeyW","KeyS","KeyA","KeyD","ShiftLeft","ControlLeft"].forEach(c=>set(c,false));ep.classList.remove("open")}
lastPlay=playing;
if(playing&&state==="play"&&!menuOpen&&matchMedia("(orientation:portrait)").matches)pauseGame()},250);
document.addEventListener("contextmenu",e=>e.preventDefault());
})();
{const n=$("nm");
if(n){n.value=S.name||"Player";n.addEventListener("change",()=>{S.name=cleanName(n.value)||"Player";n.value=S.name;sv()})}
// hard-wire Back so it always works even if delegated clicks fail
const bb=$("btnBack");
if(bb){const go=e=>{e.preventDefault();e.stopPropagation();goLobby()};
bb.addEventListener("click",go);bb.addEventListener("pointerup",e=>{if(e.button===0)go(e)})}
// Esc from any page sheet
addEventListener("keydown",e=>{if(e.code==="Escape"&&view==="pg"){e.preventDefault();goLobby()}})}

// ---------- motion polish: numbers bump when they change, the health bar leaves a damage trail, buttons catch the light under the pointer ----------
{const RM=matchMedia("(prefers-reduced-motion:reduce)");
const bump=el=>{if(!el||RM.matches)return;el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")};
for(const id of["am","kcn","hpn","amx"]){const el=$(id);if(el)new MutationObserver(()=>bump(el)).observe(el,{childList:true,characterData:true,subtree:true})}
const hp=$("hp");
if(hp&&hp.parentNode){const tr=document.createElement("i");tr.id="hpt";hp.parentNode.insertBefore(tr,hp);let prev=100,tm=0;
new MutationObserver(()=>{const w=parseFloat(hp.style.width)||0;clearTimeout(tm);
if(w<prev){tr.style.transition="none";tr.style.width=prev+"%";void tr.offsetWidth;tm=setTimeout(()=>{tr.style.transition="width .55s cubic-bezier(.22,1,.36,1)";tr.style.width=w+"%"},260)}
else{tr.style.transition="none";tr.style.width=w+"%"}
prev=w}).observe(hp,{attributes:true,attributeFilter:["style"]})}
document.addEventListener("pointermove",e=>{const b=e.target&&e.target.closest&&e.target.closest(".b");if(!b)return;const r=b.getBoundingClientRect();b.style.setProperty("--bx",(e.clientX-r.left)+"px");b.style.setProperty("--by",(e.clientY-r.top)+"px")},{passive:true})}
