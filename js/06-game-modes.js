"use strict";
// ---------- small helpers ----------
const EL={},el=id=>EL[id]||(EL[id]=$(id));
const txt=(id,v)=>{const e=el(id);if(e._v!==v){e._v=v;e.textContent=v}};
const hide=(id,on)=>{const e=el(id);if(e._h!==!!on){e._h=!!on;e.classList.toggle("hid",!!on)}};
const turnTo=(cur,to,k)=>cur+angDiff(cur,to)*Math.min(1,k);
const KNIFE_D=55,GOAL_GG=30;
let GOAL=5,bt=0,lastCount=0,hudT=0,probeT=0,lastYaw=0,lastPitch=0,regenShown=false,rangeT=0;
const myLvl=()=>PT.on&&PT.me?PT.me.lvl:ggL;
const cg=()=>mode==="range"?G[rangeG%G.length]:mode==="gg"?G[GGO[ggL%GGO.length]]:PT.on&&PT.mode==="gg"?G[GGO[(PT.me?PT.me.lvl:0)%GGO.length]]:I(eq().g);

function los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,d=Math.hypot(dx,dy,dz)||1;return rayWorld(ax,ay,az,dx/d,dy/d,dz/d,d)>=d-.02}
function stepEnt(p,vx,vz,dt,r){
const nx=p.x+vx*dt,nz=p.z+vz*dt;let mv=false;
const tryMove=(x,z)=>{
if(Math.abs(x)>=H-1||Math.abs(z)>=H-1)return false;
const fy=floorAt(x,z,p.y+1.2),rise=fy-(p.y||0);
// allow walking onto low stairs / platforms (up to ~0.9m) and ignore pure walls
if(rise>0.95)return false;
if(blocked(x,z,Math.max(0,fy+.05),r))return false;
p.x=x;p.z=z;if(rise>0.02)p.y=fy;return true};
if(tryMove(nx,p.z))mv=true;
if(tryMove(p.x,nz))mv=true;
// slide along walls by trying pure x or z when diagonal fails
if(!mv&&tryMove(nx,p.z+vz*dt*.35))mv=true;
if(!mv&&tryMove(p.x+vx*dt*.35,nz))mv=true;
return mv}
// walks an entity toward (tx,tz), keeping a preferred distance band; recovers when wedged on a corner
function steer(e,tx,tz,dt,spd,near,far,strafe){
const p=e.g.position,ex=tx-p.x,ez=tz-p.z,dist=Math.hypot(ex,ez)||1,ux=ex/dist,uz=ez/dist,fw=dist>far?1:dist<near?-.7:0,st=strafe*e.sd;
let vx=ux*fw-uz*st,vz=uz*fw+ux*st;
if(e.esc>0){e.esc-=dt;const c=Math.cos(e.ea),s=Math.sin(e.ea);if(!fw&&!st){vx=ux;vz=uz}const nx=vx*c-vz*s,nz=vx*s+vz*c;vx=nx;vz=nz}
const want=Math.hypot(vx,vz),mv=want>.05?stepEnt(p,vx*spd,vz*spd,dt,e.rad||.5):false;
// snap monster feet to floor so they don't float or sink into stairs
const fl=floorAt(p.x,p.z,p.y+1.2);if(Math.abs((p.y||0)-fl)>.02&&!e.em)p.y=fl;
e.sT-=dt;if(e.sT<=0){e.sT=.4;if(want>.12&&Math.hypot(p.x-e.sx,p.z-e.sz)<.1*spd){e.esc=1.4+rnd()*.6;e.ea=(rnd()<.5?-1:1)*(1.4+rnd()*1.4);e.sd=-e.sd;
// hard unstuck: hop toward open space
for(let k=0;k<8;k++){const a=e.ea+Math.atan2(ux,uz)+k*.785,hx=clamp(p.x+Math.cos(a)*.6,-H+2,H-2),hz=clamp(p.z+Math.sin(a)*.6,-H+2,H-2);if(!blocked(hx,hz,p.y,e.rad||.5)){p.x=hx;p.z=hz;p.y=floorAt(p.x,p.z,p.y+1.2);break}}}e.sx=p.x;e.sz=p.z}
return mv?Math.min(1,want):0}
function dropModel(g,tg){g.parent&&g.parent.remove(g);disposeGeo(g);if(tg&&tg.material){if(tg.material.map)tg.material.map.dispose();tg.material.dispose()}}
function killFeed(a,b,w,head,mine){
const f=el("kfeed"),d=document.createElement("div");d.className="kf"+(mine?" me":"");
d.innerHTML=`<b>${esc(a)}</b><i>${esc(w||"")}${head?" "+gly("target",12):""}</i><b>${esc(b)}</b>`;f.appendChild(d);
setTimeout(()=>d.classList.add("out"),4200);setTimeout(()=>d.remove(),4700);while(f.children.length>5)f.firstChild.remove()}

// ---------- range targets ----------
const TGT={};
function targetTex(p){
if(TGT[p])return TGT[p];const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d"),col=p===5?"#e879f9":p===4?"#38bdf8":p===3?"#ffd24a":p===2?"#fb923c":"#ef4444";
[[64,"#1b1f2a"],[58,"#f8fafc"],[46,col],[34,"#f8fafc"],[22,col],[10,"#1b1f2a"]].forEach(([r,f])=>{g.fillStyle=f;g.beginPath();g.arc(64,64,r,0,6.283);g.fill()});
return TGT[p]=new T.CanvasTexture(c)}
function mkTarget(p,x,z,mv){
const r=[.8,.8,.65,.5,.42,.3][p],m=new T.Mesh(new T.CircleGeometry(r,40),new T.MeshBasicMaterial({map:targetTex(p),side:T.DoubleSide}));
m.position.set(x,1.75,z);m.userData={tgt:1,pts:p,x0:x,z0:z,ph:rnd()*6,hf:0,mv:mv||null};
const st=new T.Mesh(new T.BoxGeometry(.08,1.75,.08),new T.MeshLambertMaterial({color:0x4b5563}));st.position.y=-.875;m.add(st);
sc.add(m);rT.push(m)}

function rangeLabel(txt,z){const s=tag(txt,"#fbbf24",2.7);s.scale.set(5.5,1.4,1);s.position.x=-27;s.position.z=z;sc.add(s);rT.push(s)}
function buildRange(){
for(let i=0;i<7;i++)mkTarget(1,-18+i*6,24);
for(const x of[-12,0,12])mkTarget(1,x,17,{t:"s",amp:6,sp:.7});
for(const x of[-16,-8,0,8,16])mkTarget(2,x,9,{t:"u",amp:1.5,sp:1.1});
for(const x of[-8,0,8])mkTarget(2,x,1,{t:"s",amp:10,sp:1.3});
for(const x of[-12,0,12])mkTarget(3,x,-9,{t:"o",amp:4,sp:1.1});
for(const x of[-9,9])mkTarget(4,x,-20,{t:"f",amp:8,sp:1.2});
mkTarget(5,0,-32,{t:"f",amp:16,sp:1.9});
[["1 PT",24],["1 PT  MOVING",17],["2 PT  POP-UPS",9],["2 PT  FAST",1],["3 PT  ORBIT",-9],["4 PT  FIGURE 8",-20],["5 PT  BONUS",-32]].forEach(([t,z])=>rangeLabel(t,z))}
function rangeMove(m,t){const u=m.userData,v=u.mv;if(!v)return;const a=t*v.sp+u.ph;
if(v.t==="s")m.position.x=u.x0+Math.sin(a)*v.amp;
else if(v.t==="u"){m.position.x=u.x0+Math.sin(a*.6)*v.amp;m.position.y=1.7+Math.sin(a*1.4)*.95}
else if(v.t==="o"){m.position.x=u.x0+Math.cos(a)*v.amp;m.position.z=u.z0+Math.sin(a)*v.amp*.7}
else if(v.t==="f"){m.position.x=u.x0+Math.sin(a)*v.amp;m.position.y=2.3+Math.sin(a*2)*.8}}
function rangeSwap(d){if(mode!=="range"||!isGame())return;rangeG=(rangeG+d+G.length)%G.length;slot=0;knifeCharging=false;const g=cg();A.mag=g.m;A.rl=0;rmb=false;scoped=false;VM.swap();flash(g.n+"  ·  "+R[g.r]+"  ("+(rangeG+1)+"/"+G.length+")",900);snd("ui",.6)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#rgun button");if(b){if(b.dataset.i)inspStart();else rangeSwap(+b.dataset.d)}});

// ---------- gun inspect (shooting range, key I): the gun moves in your hands, fires one shot sound, and a model you can spin with the mouse ----------
let inspK=false,inspOpen=false,inspS=null,inspR=null,inspRaf=0,inspEl=null;
function inspShot(){if(inspK){knSnd(curKn(),"swing");return}const g=cg();try{VM.flash()}catch(e){}gunSnd(g,"fire");
if(inspS&&inspS.mf){inspS.mf.visible=true;clearTimeout(inspS.mt);inspS.mt=setTimeout(()=>{if(inspS&&inspS.mf)inspS.mf.visible=false},80)}}
VM.onShot(()=>{if(mode==="range")inspShot()});
function inspReplay(){VM.inspect()}
function inspLabels(){if(!inspEl)return;if(inspK){const k=curKn(),ki=Math.max(0,KN.indexOf(k)),v=knVoice(k),st=ksty(k);inspEl.querySelector("#inspn").textContent=k.n;inspEl.querySelector("#inspr").textContent=R[k.r]+"  ·  knife  ·  "+(ki+1)+" / "+KN.length;inspEl.style.setProperty("--rc",RC[k.r]);
inspEl.querySelector("#insts").innerHTML=statRow("Damage",KNIFE_D*KNM[k.r],100,Math.round(KNIFE_D*KNM[k.r]))+statRow("Reach",k.s.len*(1+.04*k.r),.75,Math.round(k.s.len*(1+.04*k.r)*100)+" cm")+statRow("Swing speed",1.7-v.w,1.2,v.w<.7?"Very fast":v.w<1?"Fast":v.w<1.3?"Medium":"Heavy")+`<div class="stat"><span>Swing</span><b style="grid-column:2/4;text-align:right;text-transform:capitalize">${st} · ${v.k}</b></div>`;return}const g=cg();inspEl.querySelector("#inspn").textContent=g.n;
inspEl.querySelector("#insts").innerHTML=statRow("Damage",g.d*(g.pel||1),Math.max(...G.map(x=>x.d*(x.pel||1))),g.d+(g.pel?" ×"+g.pel:""))+statRow("Fire rate",1/g.t,Math.max(...G.map(x=>1/x.t)),(1/g.t).toFixed(1)+"/s")+statRow("Accuracy",1-g.sp/.07,1,g.sp?Math.round((1-g.sp/.07)*100)+"%":"100%")+statRow("Reload",g.rl,3.6,g.rl+" s",1);
inspEl.querySelector("#inspr").textContent=R[g.r]+"  ·  "+g.dps+" DPS  ·  "+g.m+" rounds  ·  "+(rangeG+1)+" / "+G.length;inspEl.style.setProperty("--rc",RC[g.r])}
function inspBuild(){
if(!inspR)return;const g=cg(),sk=I(eq().s)||SK[0];
if(inspS){inspS.sc.remove(inspS.pivot);disposeGeo(inspS.pivot);clearTimeout(inspS.mt)}
const b=inspK?(()=>{const kb=buildKnife(curKn());return{grp:kb.grp,mf:new T.Group()}})():buildGun(g,sk),pivot=new T.Group(),holder=new T.Group();
b.grp.rotation.y=-Math.PI/2;b.grp.remove(b.mf);b.grp.updateMatrixWorld(true);
const box=new T.Box3().setFromObject(b.grp),size=box.getSize(new T.Vector3()),ctr=box.getCenter(new T.Vector3());
b.grp.add(b.mf);b.mf.visible=false;b.grp.position.copy(ctr).negate();holder.add(b.grp);pivot.add(holder);
let sc2,cam2;
if(inspS){sc2=inspS.sc;cam2=inspS.cam}
else{sc2=new T.Scene();sc2.add(new T.HemisphereLight(0xffffff,0x3b4660,.95));const d1=new T.DirectionalLight(0xffffff,1.15);d1.position.set(2,3,4);sc2.add(d1);const d2=new T.DirectionalLight(0x9db4ff,.45);d2.position.set(-3,1,-2);sc2.add(d2);cam2=new T.PerspectiveCamera(32,1.6,.01,20)}
sc2.add(pivot);
inspS=Object.assign(inspS||{yaw:.55,pitch:.16,vy:0,drag:0,zoom:1,auto:.006,lx:0,ly:0},{sc:sc2,cam:cam2,pivot,mf:b.mf,mt:0,dist:Math.max(size.x,size.y,size.z)*1.45});
cam2.position.set(0,0,inspS.dist*inspS.zoom)}
function inspLoop(){
if(!inspOpen||!inspR||!inspS)return;inspRaf=requestAnimationFrame(inspLoop);
const q=inspS;if(!q.drag){q.vy*=.94;q.yaw+=q.auto+q.vy}
q.pivot.rotation.set(q.pitch,q.yaw,0);q.cam.position.z+=(q.dist*q.zoom-q.cam.position.z)*.2;inspR.render(q.sc,q.cam)}
function inspStart(){
if(mode!=="range"||!isGame()||inspOpen||P.fz>0||P.dead>0)return;
inspOpen=true;menuOpen=true;clearKeys();Aim.release();document.body.classList.remove("playing");
inspK=slot===1;
const w=document.createElement("div");w.id="inspw";
w.innerHTML='<div class="ih"><b id="inspn"></b><small id="inspr"></small></div><canvas id="inspc"></canvas><div id="insts" class="insts"></div><div class="ib"><button data-q="p" title="Previous (Z)" aria-label="Previous"><svg class="ic" style="transform:scaleX(-1)"><use href="#i-fwd"/></svg></button><button data-q="s" title="Hear it">Sound</button><button data-q="r" title="Play the hand animation again (Space)">Replay</button><button data-q="n" title="Next (X)" aria-label="Next"><svg class="ic"><use href="#i-fwd"/></svg></button><button data-q="x">Close</button></div><small class="ihint">Drag to spin · scroll to zoom · double-click resets · I or Esc closes</small>';
document.body.appendChild(w);inspEl=w;
const c=w.querySelector("#inspc");
try{
inspR=new T.WebGLRenderer({canvas:c,antialias:true,alpha:true});inspR.setPixelRatio(Math.min(devicePixelRatio||1,2));
inspBuild();
const W=c.clientWidth||320,H=c.clientHeight||210;inspR.setSize(W,H,false);inspS.cam.aspect=W/H;inspS.cam.updateProjectionMatrix();
c.addEventListener("pointerdown",e=>{inspS.drag=1;inspS.vy=0;inspS.lx=e.clientX;inspS.ly=e.clientY;try{c.setPointerCapture(e.pointerId)}catch(_){}});
c.addEventListener("pointermove",e=>{if(!inspS||!inspS.drag)return;const dx=e.clientX-inspS.lx,dy=e.clientY-inspS.ly;inspS.lx=e.clientX;inspS.ly=e.clientY;inspS.yaw+=dx*.012;inspS.vy=dx*.012;inspS.pitch=clamp(inspS.pitch+dy*.01,-1.1,1.1)});
const up=()=>{if(inspS)inspS.drag=0};c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
c.addEventListener("wheel",e=>{e.preventDefault();inspS.zoom=clamp(inspS.zoom*(1+Math.sign(e.deltaY)*.08),.45,1.8)},{passive:false});
c.addEventListener("dblclick",()=>{inspS.yaw=.55;inspS.pitch=.16;inspS.zoom=1;inspS.vy=0});
inspRaf=requestAnimationFrame(inspLoop)
}catch(err){inspR=null;const m=document.createElement("small");m.textContent="The 3D model preview is not available in this browser, but the hand animation still plays.";c.replaceWith(m)}
w.addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;b.blur();const k=b.dataset.q;if(k==="x")inspClose();else if(k==="p")inspSwap(-1);else if(k==="n")inspSwap(1);else if(k==="s")inspShot();else if(k==="r")inspReplay()});
inspLabels();VM.inspect()}
function inspSwap(d){
if(!inspOpen)return;if(inspK){const cur=Math.max(0,KN.indexOf(curKn()));rangeK=(cur+d+KN.length)%KN.length;knifeCharging=false;VM.swap();snd("ui",.6);inspBuild();inspLabels();VM.inspect();return}rangeG=(rangeG+d+G.length)%G.length;const g=cg();A.mag=g.m;A.rl=0;scoped=false;rmb=false;VM.swap();snd("ui",.6);inspBuild();inspLabels();VM.inspect()}
function inspClose(silent){
if(!inspOpen)return;inspOpen=false;cancelAnimationFrame(inspRaf);
if(inspS){clearTimeout(inspS.mt);try{disposeGeo(inspS.pivot)}catch(e){}inspS=null}
if(inspR){try{inspR.dispose();inspR.forceContextLoss()}catch(e){}inspR=null}
if(inspEl){inspEl.remove();inspEl=null}
if(!silent){menuOpen=false;document.body.classList.add("playing");Aim.reset();Aim.request()}}

// ---------- start / rounds / end ----------
function placePlayer(s,yaw,fz){
Object.assign(P,{x:s.x,y:0,z:s.z,vx:0,vz:0,vy:0,pitch:0,hp:P.max,dead:0,fz:fz||0,spd:0,rush:0,sinceHit:99,mantle:null,stepOff:0,landDip:0,prot:0,gr:true,jumping:false,air:0,jHeld:false,jpress:false,coy:0,jb:0,rk:0,sp:0,roll:0,crouch:0,slide:0,slideCD:0,grenCD:0,eye:1.7});
P.yaw=yaw;endEmote();A.mag=cg().m;A.rl=0;scoped=false;rmb=false;cam.fov=75;cam.updateProjectionMatrix();lastYaw=yaw;lastPitch=0}
function clearEnts(){
if(typeof CustomBattle!=="undefined")CustomBattle.stop();
try{inspClose(true)}catch(e){}try{pkBodyDrop()}catch(e){}
E.forEach(e=>dropModel(e.g,e.tag));E=[];dying.forEach(d=>dropModel(d.g));dying=[];
pu.forEach(p=>dropModel(p.g));pu=[];rT.forEach(m=>dropModel(m));rT=[];projs.forEach(o=>sc.remove(o.m));projs.length=0}
function beginPlay(){
state="play";menuOpen=false;show("");$("hud").classList.remove("hid");document.body.classList.add("playing");
clearKeys();Aim.reset();Aim.request()}
async function startGame(m){S.name=cleanName($("nm").value)||S.name||"Player";sv();startGame0(m)}
function startGame0(m){
const customGrind=m==="grind";
if(customGrind&&!DevAccess.unlocked){toast("Enter the developer code to unlock Grinding Mode.");return}
if(customGrind)m="waves";
if(CustomBattle.isMode(m)){CustomBattle.start(m);return}
stageBusy=false;stageDone=0;if(stageEl)stageEl.classList.remove("on");
ghostW=false;try{Death.stop()}catch(e){}
try{Mus.set("battle")}catch(e){}
if(m==="parkour"){if(!pkPicked){pkMapScreen();return}pkPicked=false}
const nm=cleanName($("nm").value)||"Player";S.name=nm;try{Party.leave();corrReset()}catch(e){}mode=m;grind=customGrind;diff=m==="tut"?"easy":(DF[$("df").value]?$("df").value:"easy");
GOAL=m==="gg"?GOAL_GG:m==="tut"?3:[3,5,10].includes(+$("rg").value)?+$("rg").value:5;
myS=opS=kills=ggL=wave=wq=wn=bt=0;tutF={};slot=0;lastCount=0;sv();
PU=PUbase();PU.on=m==="waves";P.max=100;P.hp=100;xp=0;xpNeed=40;xpLevel=0;knifeCharge=0;knifeCharging=false;grenAim=false;clearGrenPrev();{const o=document.getElementById("puov");if(o)o.remove()}if(bossEl)bossEl.style.display="none";
if(m==="party")return Party.startSolo();
if(m==="duel1"){S.mp.mode="duel1";return Party.startSolo()}
if(m==="coop"){toast("Co-op needs friends. Host a server and share the code");return}
beginPlay();newRound()}
function newRound(){
clearEnts();VM.swap();
let th=mode==="waves"?"ruin":pk(OUTDOOR),seed=(rnd()*2147483647)|0;
if(mode==="parkour"&&pkMap){th=pkMap.th;seed=pkMap.seed}
// ghost race must rebuild the exact course the best run was recorded on
if(mode==="parkour"&&S.opt&&S.opt.ghostRace&&S.pks&&S.pks[pkK()]&&S.pkg&&S.pkg[pkK()]&&S.pkg[pkK()].length>2){
const m=S.pks[pkK()];if(m&&m.seed!=null){seed=m.seed>>>0;if(m.theme&&THEMES[m.theme])th=m.theme}
}
buildWorld(th,seed,{waves:mode==="waves",empty:mode==="range"||mode==="parkour",parkour:mode==="parkour"?diff:null,pkmap:mode==="parkour"?pkMap:null});
if(mode==="range"){placePlayer(freeSpot(0,H-6),0,1.2);rt=0;rs=RANGE_SHOTS;rHit=rCur=rBest=0;rangeG=Math.max(0,G.findIndex(x=>x.id===eq().g));rangeK=-1;A.mag=cg().m;buildRange()}
else if(mode==="parkour"){rt=0;pT=1e9;PK.start();pkBodyMake();slot=pkKnifeOn()?1:0;VM.swap()}
else{const s=freeSpot(0,H-8);placePlayer(s,Math.atan2(s.x,s.z),2);rt=0;pT=3;
if(mode==="waves")nextWave();else spawnBot()}
if(mode==="range")flash("40 shots. Make every one count. Z / X swaps guns, I inspects",2600)}
function roundEnd(w,t){
if(rL>0||state!=="play")return;
if(w===true){myS++;tf("kill")}if(w===false)opS++;
flash(t||(w===true?"Round won":w===false?"Round lost":"Draw"),1500);
if(myS>=GOAL||opS>=GOAL)return endGame(myS>=GOAL);rL=1.6}
function endGame(win){
if(state==="over")return;state="over";menuOpen=false;Aim.release();document.body.classList.remove("playing");clearKeys();
let b=0,sub="";const me=boardOf(S.name);me.k+=kills;if(win)me.w++;
const st=[];qAdd("play",1);qAdd("m_"+mode,1);if(win)qAdd("w_"+mode,1);if(PT.on){qAdd("party",1);if(win)qAdd("pwin",1)}
if(mode==="duel"||mode==="gg"){const bo=boardOf(DF[diff].n);bo.k+=opS;if(!win)bo.w++;
if(win){b=mode==="gg"?90:DF[diff].coins+20*Math.min(S.streak,5);S.streak++;qAdd("wins",1)}else S.streak=0;
sub=win?"You won "+myS+" to "+opS:"You lost "+myS+" to "+opS;st.push(["Score",myS+" - "+opS],["Opponent",DF[diff].n],["Win streak",S.streak])}
else if(PT.on&&PT.coop){let tk=kills;for(const [,r] of PT.remotes)tk+=r.kills|0;b=Math.min(60,wave*3);sub="Your squad reached wave "+wave;st.push(["Wave",wave],["Your kills",kills],["Squad kills",tk],["Squad size",1+PT.remotes.size])}
else if(PT.on){b=win?120:30;if(win)qAdd("wins",1);sub=win?"You won the match":"Match over: "+(PT.winner||"another player")+" won";st.push(["Kills",PT.me.kills|0],["Deaths",PT.me.deaths|0],["Mode",(PM_MODES[PT.mode]||PM_MODES.ffa).n])}
else if(mode==="tut"){if(win){b=S.tut?0:50;S.tut=1}sub=win?"Tutorial complete":"Try again, you can do it";st.push(["Bot kills",myS+" / 3"])}
else if(mode==="parkour"){const c=WORLD.course,f=PK.st.falls,bs=S.pkb&&typeof S.pkb==="object"?S.pkb:(S.pkb={});
b=Math.round((c.base*(f===0?1.5:f<=3?1.2:1)+PK.st.gems*8)*.25);if(bs[pkK()]==null||f<bs[pkK()])bs[pkK()]=f;qAdd("pk",1);if(diff==="hard"||diff==="impossible")qAdd("pkh",1);if(diff==="impossible")qAdd("pkn",1);
sub=f===0?"Flawless run, no falls":"You reached the golden beacon";st.push(["Falls",f],["Gems",PK.st.gems+" / "+c.gems.length],["Checkpoints",c.cps.length-1],["Best falls",bs[pkK()]],["Height",Math.round(PK.st.maxY)+" m"])}
else if(mode==="waves"){sub="You reached wave "+wave+(grind?" (Grinding Mode)":"");st.push(["Wave",wave],["Kills",kills]);b=0}
else{const used=RANGE_SHOTS-Math.max(0,rs),acc=used?rHit/used:0,fin=Math.round(myS*(.75+acc*.5));b=Math.min(8,Math.floor(fin/16));qAdd("range",myS,1);sub=used>=RANGE_SHOTS?"Out of ammo. Final score "+fin:"Run ended early. Final score "+fin;st.push(["Final score",fin],["Target points",myS],["Accuracy",Math.round(acc*100)+"%"],["Shots hit",rHit+" / "+used],["Best streak",rBest],["Reward",b+" coins"])}
S.coins+=b;if(b>0)qAdd("coin",b);const bx=bpDaily(((win?130:70)+(mode==="waves"?wave*10:0)+Math.min(150,kills*4))*(mode==="tut"?.3:1));st.push(["Battle Pass XP","+"+bx.xp+(bx.boost?" (daily boost)":"")]);addBP(bx.xp);sv();
endCard({title:mode==="waves"||mode==="range"?"Run complete":mode==="parkour"?"Course complete":win?"Victory":"Defeat",sub,stats:st,coins:b,win:mode==="waves"||mode==="range"?null:win,again:PT.on&&PT.online?"":grind?"grind":mode});
snd(win||mode==="waves"||mode==="range"?"win":"lose")}

// ---------- damage ----------
function hit(d,src){
if(CustomBattle.active)return CustomBattle.playerHurt(d,src);
if(state!=="play"||menuOpen||P.dead>0||rL>0||P.fz>0||P.prot>0)return;
if(grind)d*=.12;snd("hurt");P.hp-=d*PU.arm;P.sinceHit=0;dmgFlash();P.rk+=.02;hurtDir(src);lastSrc=src||null;
if(P.hp<=0){P.hp=0;die()}}
function hurtDir(src){
if(!src)return;const a=Math.atan2(src.x-P.x,src.z-P.z)-(P.yaw+Math.PI),e=el("hdir");
e.style.setProperty("--r",(-a*57.3).toFixed(0)+"deg");e.classList.remove("on");void e.offsetWidth;e.classList.add("on")}
let lastSrc=null;
function die(){
endEmote();const src=lastSrc;
if(PT.on)return Party.die(src);
// the player stays "dead" while the kill-cam plays; the result (end card, next round, respawn) fires when the card closes
if(mode==="waves"){P.dead=1e6;Death.start({src,len:2.7,label:"Tallying your run",done:()=>endGame(false)})}
else if(mode==="gg"){opS++;P.dead=1e6;const fin=opS>=GOAL_GG;
Death.start(fin?{src,len:2.7,label:"Final score",done:()=>endGame(false)}:{src,ring:2.6,label:"Respawning",done:()=>{if(state==="play")respawnPlayer()}})}
else{P.dead=1e6;Death.start({src,len:2.2,label:"Next round loading",done:()=>roundEnd(false,"You were eliminated")})}}
function respawnPlayer(){
const o=E.length?E[0].g.position:{x:0,z:0},s=awaySpot(o.x,o.z,26);
placePlayer(s,Math.atan2(s.x,s.z),0);P.prot=1.5;VM.swap();flash("Back in the fight",900)}
function critFx(pt){
snd("head",1.2);snd("kill",.5);flash("CRIT!",500);flashScreen("#fbbf24");
if(pt)Fx.burst(pt,0xfbbf24,16,7,.09,2.5,20);hitMark(true)}
function hurtE(e,d,head,pt){
// Invalid damage must never corrupt HP and leave an untargetable, living enemy.
if(!Number.isFinite(d)||d<0)return;
if(e.custom)return CustomBattle.playerDamage(e,d,head,pt);
if(e.hp<=0||e.em>0||e.phz)return;
// boss is invulnerable while any of its minion wave is still alive
if(e.boss){const minions=E.filter(x=>x!==e&&x.t==="mon"&&x.minion&&x.hp>0);if(minions.length){flash("Clear the minions first!",700);snd("ui",.4);return}}
let wasCrit=false;
if(head){d*=2;qAdd("heads",1);flash("HEADSHOT",600)}
if(PU.on&&e.t==="mon"){const critRoll=rnd()<PU.crit;if(critRoll){d*=2;wasCrit=true}d*=PU.dmg*(head?PU.hs:1)*(e.hp<(e.hpMax||1e9)*.3?PU.exe:1)*(P.hp<P.max*.3?PU.ls:1)}
else if(PU.crit>0&&rnd()<PU.crit){d*=2;wasCrit=true}
if(!Number.isFinite(d))return;
e.hp-=d;if(e.t==="mon")monBar(e);if(e.t==="bot")botBar(e);snd(head?"head":"hit");hitMark(head);hurtFlash(e.g,true);e.hf=.09;e.alert=1;
if(wasCrit)critFx(pt||{x:e.g.position.x,y:e.g.position.y+1.2,z:e.g.position.z});
else if(pt){Fx.burst(pt,e.t==="mon"?0x77ff55:0xff5a4a,head?9:5,4,.07,1.5,16);Gfx.flare(pt,e.t==="mon"?0xb7ff7a:0xff8a7a,head?1.5:.9,.1)}
if(e.hp<=0)killE(e,head)}
function killE(e,head){
const i=E.indexOf(e);if(i<0)return;E.splice(i,1);
if(e.tag){e.g.remove(e.tag);dropModel(e.tag)}
hurtFlash(e.g,false);dying.push(deathInit(e.g,P.x,P.z,head,e.t==="mon"));
Fx.burst({x:e.g.position.x,y:e.g.position.y+1,z:e.g.position.z},e.t==="mon"?0x66ff44:0xff4444,18,6,.1,3,18);if(e.t==="mon"){monDeathFx(e);Phase.onKill(e)}
snd("kill");streakSnd();kills++;qAdd("kills",1);if(e.t==="mon")qAdd("mk",1);tf("kill");celebrate(e);if(e.boss){bossDeath(e);qAdd("boss",1)}
if(e.t==="mon"){S.coins+=Math.max(1,Math.round((.6+wave*.1)*PU.coin*(e.elite?5:1)));if(PU.kh)P.hp=Math.min(P.max,P.hp+PU.kh);const gain=Math.round((8+wave*2+(e.boss?40:e.k===2?18:e.k===1?12:6))*(head?1.25:1)*(e.elite?3:1));addXP(gain)}
else{S.coins+=1;
if(mode==="gg"){myS++;ggL=myS;
if(myS>=GOAL_GG){sv();return endGame(true)}
const ng=cg();A.mag=ng.m;A.rl=0;VM.swap();flash("Next gun: "+ng.n,1200);snd("pick");bt=1.4}
else if(PT.on)Party.botKilled(head);else roundEnd(true)}
sv()}
function tgtHit(m){
const u=m.userData;myS+=u.pts+(rCur>=2?Math.min(3,rCur-1):0);rNow=1;qAdd("range",myS,1);u.hf=.5;Fx.burst(m.position,0xffffff,8,3,.06,1,10);flash("+"+u.pts,500);snd(u.pts===3?"head":"hit");hitMark(u.pts===3)}

// ---------- waves, bots, monsters ----------
let corrupted=false,corrWas=false;
// corrupted wave: the arena stays the same map, it just slips into a violet glitch tint that fades in and out
let corrTgt=0,corrK=0,corrSnap=null,corrPts=null;const CTMP=new T.Color(),CORRC={sky:[0x0a0008,0x3d0416,0x9a0f2a],fog:0x25030f,hemiC:0xff3a4a,hemiG:0x2a0510,sun:0xff1f3a,cloud:0xff4060};let corrOv=null,corrGl=null,lightT=3,glT=0,bT=2,vT=1,corrMoon=null;
function corrStart(){
const th=THEMES[WORLD.theme];if(!th||!sc.fog)return;
if(!corrSnap){const u=Sky.u;corrSnap={cT:u.cT.value.clone(),cM:u.cM.value.clone(),cH:u.cH.value.clone(),cc:u.cc.value.clone(),fog:sc.fog.color.clone(),near:sc.fog.near,far:sc.fog.far,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),sc:sun.color.clone(),si:sun.intensity,stars:u.stars.value}}
corrTgt=1;lightT=1.5;
if(!corrOv){corrOv=document.createElement("div");corrOv.style.cssText="position:fixed;inset:-3%;z-index:8;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 34%,rgba(110,0,24,.5) 68%,rgba(8,0,4,.96) 100%)";document.body.appendChild(corrOv);
corrGl=document.createElement("div");corrGl.style.cssText="position:fixed;inset:0;z-index:8;pointer-events:none;opacity:0;background:repeating-linear-gradient(0deg,rgba(255,0,60,.09) 0 2px,rgba(0,0,0,0) 2px 5px);mix-blend-mode:screen";document.body.appendChild(corrGl)}
if(!corrMoon){corrMoon=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:0xff2030,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:0,fog:false}));corrMoon.scale.set(80,80,1);corrMoon.raycast=()=>{};corrMoon.frustumCulled=false;sc.add(corrMoon)}
try{tone(52,3,"sawtooth",.22,34);tone(78,3,"square",.08,60,.15);snd("cstart",.9)}catch(e){}
if(!corrPts){const N=SOFT?60:150,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=P.x+(rnd()-.5)*70;pos[i*3+1]=rnd()*22;pos[i*3+2]=P.z+(rnd()-.5)*70}
const geo=new T.BufferGeometry();geo.setAttribute("position",new T.BufferAttribute(pos,3));
corrPts=new T.Points(geo,new T.PointsMaterial({map:SOFTDOT,color:0xff1f4d,size:.55,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,fog:false}));corrPts.frustumCulled=false;sc.add(corrPts)}}
function corrReset(){try{Phase.reset()}catch(e){}corrTgt=0;corrK=0;if(corrOv){corrOv.remove();corrGl.remove();corrOv=corrGl=null}if(corrPts){sc.remove(corrPts);corrPts.geometry.dispose();corrPts.material.dispose();corrPts=null}corrSnap=null;corrupted=false;if(corrMoon){sc.remove(corrMoon);corrMoon.material.dispose();corrMoon=null}}
function corrFrame(dt){
if(!corrSnap&&!corrPts)return;
corrK+=(corrTgt-corrK)*Math.min(1,dt*1.8);if(corrTgt===0&&corrK<.01)corrK=0;
const k=corrK,u=Sky.u,B=corrSnap,t=performance.now()/1000;
if(corrMoon){corrMoon.material.opacity=.85*k;corrMoon.position.set(P.x+90,58+k*6,P.z-130)}
if(k>.5&&corrTgt>0&&state==="play"){bT-=dt;if(bT<=0){bT=1.6+rnd()*2.4;const a=rnd()*6.283,r=14+rnd()*30;Gfx.bolt(clamp(P.x+Math.cos(a)*r,-H+2,H-2),clamp(P.z+Math.sin(a)*r,-H+2,H-2),0xd9a0ff)}
vT-=dt;if(vT<=0){vT=.9;const a=rnd()*6.283,r=4+rnd()*26;Gfx.crack(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r,0xff2050,7,5)}}
if(B&&sc.fog){
u.cT.value.copy(B.cT).lerp(CTMP.setHex(CORRC.sky[0]),k*.96);u.cM.value.copy(B.cM).lerp(CTMP.setHex(CORRC.sky[1]),k*.94);u.cH.value.copy(B.cH).lerp(CTMP.setHex(CORRC.sky[2]),k*.9);u.cc.value.copy(B.cc).lerp(CTMP.setHex(CORRC.cloud),k*.8);
sc.fog.color.copy(B.fog).lerp(CTMP.setHex(CORRC.fog),k*.92);if(sc.background&&sc.background.isColor)sc.background.copy(sc.fog.color);
sc.fog.near=B.near*(1-.6*k);sc.fog.far=B.far*(1-.55*k)+Math.sin(t*1.7)*5*k;
hemi.color.copy(B.hc).lerp(CTMP.setHex(CORRC.hemiC),k*.8);hemi.groundColor.copy(B.hg).lerp(CTMP.setHex(CORRC.hemiG),k*.85);
sun.color.copy(B.sc).lerp(CTMP.setHex(CORRC.sun),k*.85);sun.intensity=B.si*(1-.4*k)*(1+.5*Math.pow(Math.max(0,Math.sin(t*2.2)),8));u.stars.value=Math.max(B.stars,k*.9);
if(corrTgt===0&&k===0)corrSnap=null}
if(corrOv){corrOv.style.opacity=(k*(.85+.15*Math.sin(t*7)*Math.sin(t*2.3))).toFixed(3);corrOv.style.transform="scale("+(1+.035*Math.pow(Math.max(0,Math.sin(t*2.2)),6)).toFixed(3)+")";
glT-=dt;if(k>.5&&glT<=0&&rnd()<dt*.6){glT=.16;corrGl.style.transform="translateX("+((rnd()-.5)*30).toFixed(0)+"px)"}corrGl.style.opacity=glT>0?(.8*k).toFixed(2):"0";
lightT-=dt;if(k>.6&&corrTgt>0&&lightT<=0&&state==="play"){lightT=5+rnd()*7;flashScreen("#ff1030");document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),500);try{tone(46,1.4,"sawtooth",.28,28)}catch(e){}}}
if(corrPts){const a=corrPts.geometry.attributes.position,arr=a.array,n=arr.length/3;corrPts.material.opacity=.85*k;
for(let i=0;i<n;i++){const j=i*3;arr[j+1]+=dt*(.8+(i%5)*.25);arr[j]+=Math.sin(t+i)*dt*.4;if(arr[j+1]>24)arr[j+1]=0;
let dx=arr[j]-P.x,dz=arr[j+2]-P.z;if(dx>35)arr[j]-=70;else if(dx<-35)arr[j]+=70;if(dz>35)arr[j+2]-=70;else if(dz<-35)arr[j+2]+=70}
a.needsUpdate=true;if(corrTgt===0&&k===0){sc.remove(corrPts);corrPts.geometry.dispose();corrPts.material.dispose();corrPts=null}}}
// type count: waves 1-10 → 3 types, 11-20 → 4, ... (green=0 melee, purple=1 ranged, red=2 brute, then extras)
function monTypeCount(){return 3+Math.max(0,Math.floor((wave-1)/10))}
function pickMonType(){
if(wmod==="brute"&&rnd()<.55)return monTypeCount()>=5&&rnd()<.4?4:2;
const n=monTypeCount(),weights=[];
// base types always available
weights.push([0,50],[1,wave>=3?28:0],[2,wave>=5?14:0]);
if(n>=4)weights.push([3,18]); // crawler – fast low HP
if(n>=5)weights.push([4,12]); // tank – slow armored
if(n>=6)weights.push([5,10]); // screamer – debuff aura concept (ranged weak)
if(n>=7)weights.push([6,8]);
const pool=weights.filter(w=>w[1]>0);let tot=0;pool.forEach(w=>tot+=w[1]);let x=rnd()*tot;
for(const [k,w] of pool){x-=w;if(x<=0)return k}return 0}
// relative speed multipliers by type (overall a bit slower than before)
const MON_SPD=[1.0,1.5,0.5,1.35,0.4,1.1,0.85];
let ghostW=false,wmod="",eliteN=0;const WMN={swarm:"SWARM",brute:"BRUTE SQUAD",ambush:"AMBUSH",elite:"ELITE HUNT"};
function nextWave(){
if(mode==="waves"&&!PT.on&&wave>0&&wave%5===0&&stageDone!==wave){stageDone=wave;stageChange();return}
wave++;snd("horn",.8);if(wave%5===0)setTimeout(()=>snd("roar",.8),600);const bw=wave%5===0;wq=bw?0:Math.min(30,3+wave*2);if(coopN()>1&&wq)wq=Math.min(60,Math.round(wq*(1+.3*(coopN()-1))));wt=0;wn=0;P.hp=Math.min(P.max,P.hp+PU.sw);
corrWas=corrupted;corrupted=false;
ghostW=mode==="waves"&&!PT.on&&!!((S.opt&&S.opt.ghostLvl)||(wave>=7&&wave%7===0));
wmod="";eliteN=0;if(!bw&&!ghostW&&wave>=3){const r=rnd();wmod=wave>=8&&r<.12?"elite":wave>=6&&r<.26?"brute":r<.42?"swarm":wave>=4&&r<.52?"ambush":""}
if(wmod==="swarm")wq=Math.min(44,Math.round(wq*1.7));else if(wmod==="brute")wq=Math.round(wq*.7);
const ph=!bw&&!ghostW&&mode==="waves"?Phase.pick():null;
if(!bw&&!ghostW&&wave>10&&rnd()<.1){corrupted=true;wmod="";wq=0;flash("CORRUPTED WAVE "+wave+" · "+bossName(true),3200);snd("lose");
try{corrStart();flashScreen("#8b3dff")}catch(e){}spawnBoss(true)}
else if(bw){flash("BOSS: "+bossName(false,ghostW),2800);spawnBoss(false,ghostW);if(ghostW){snd("ghost");flashScreen("#5ff5ff")}}
else if(ghostW){flash("GHOST LEVEL \u00b7 wave "+wave+" \u00b7 the dead hover and shoot from range",3200);snd("ghost");try{flashScreen("#5ff5ff")}catch(e){}}
else if(ph&&Phase.begin(ph)){wmod="";wq=Math.round(wq*1.1)}
else{flash("Wave "+wave+(wmod?" · "+WMN[wmod]:""),2400);if(wmod)setTimeout(()=>snd(wmod==="elite"?"elite":"roar",.7),500)}
try{Mus.set(corrupted?"corrupt":bw?"boss":"battle")}catch(e){}
snd("go")}
// ---------- stages: every boss you beat moves the fight to a new arena (fade out, rebuild, title card, fade in) ----------
const STAGES=["ruin","toxic","neon","frost","desert","sunset","autumn","meadow"];let stageBusy=false,stageDone=0,stageEl=null;
function stageFx(){if(!stageEl){stageEl=document.createElement("div");stageEl.id="stagefx";stageEl.innerHTML='<div class="sn"><small></small><b></b><em></em></div>';document.body.appendChild(stageEl)}return stageEl}
function stageChange(){
if(stageBusy)return;stageBusy=true;wn=1e9;P.prot=Math.max(P.prot,6);
const n=Math.floor(wave/5),key=STAGES[n%STAGES.length],el=stageFx();
el.querySelector("small").textContent="Stage "+(n+1);el.querySelector("b").textContent=(THEMES[key]||{}).n||key;el.querySelector("em").textContent="Wave "+(wave+1)+" begins";
try{snd("phase",.8)}catch(e){}
el.classList.add("on");
const live=()=>mode==="waves"&&(state==="play"||menuOpen);
setTimeout(()=>{
if(!live()){stageBusy=false;el.classList.remove("on");return}
try{corrReset()}catch(e){}clearEnts();VM.swap();
buildWorld(key,(rnd()*2147483647)|0,{waves:true});
const s=freeSpot(0,H-8);placePlayer(s,Math.atan2(s.x,s.z),0);P.prot=4;
setTimeout(()=>{el.classList.remove("on");stageBusy=false;if(live())wn=.6;},1200)},480)}
function spawnMon(opt){
opt=opt||{};
const k=opt.minion?0:(opt.k!=null?opt.k:pickMonType());
const elite=!opt.minion&&((wmod==="elite"&&eliteN<2)||(wave>=4&&rnd()<.05));if(elite)eliteN++;
const near=wmod==="ambush"?WORLD.spawns.filter(s=>{const d=Math.hypot(s.x-P.x,s.z-P.z);return d>9&&d<24}):[];
let o=opt.minion?{x:opt.x,z:opt.z}:near.length?pk(near):awaySpot(P.x,P.z,18);if(blocked(o.x,o.z,0,.6))o=freeSpot(o.x,o.z);
const typeMul=[1,.7,2.5,.65,3.2,.8,1.2][k]||1;
const hp=(opt.minion?24+wave*4.5:34+wave*9.5)*typeMul*(corrupted?1.25:1)*coopHp()*(elite?2.6:1)*(wmod==="swarm"&&!opt.minion?.65:1)*(grind?.2:1);
const g=mkMon(Math.min(2,k)); // visual base 0-2, extras reuse with tint
if(k>=3){g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color){if(k===3)o.material.color.offsetHSL(.08,.2,-.05);if(k===4)o.material.color.offsetHSL(-.05,-.1,-.15);if(k===5)o.material.color.offsetHSL(.35,.15,.05);if(k===6)o.material.color.offsetHSL(-.15,.1,.1)}});g.scale.multiplyScalar(k===4?1.35:k===3?.8:1)}
if(corrupted){const tc=new T.Color(0x1a0008);(g.userData.mats||[]).forEach(m=>{m.color.lerp(tc,.68);m.userData.em=0x4a0010;m.emissive.setHex(0x4a0010)});
g.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshBasicMaterial)o.material.color.setHex(0xff0018)});
{const hd=g.userData.head,eb=new T.MeshBasicMaterial({color:0xff0018}),tb=new T.MeshBasicMaterial({color:0xf5f0e0}),sp=new T.MeshLambertMaterial({color:0x0a0004});
if(hd){for(const x of[-.2,.2]){const e2=new T.Mesh(new T.BoxGeometry(.07,.07,.04),eb);e2.position.set(x,.2,.27);hd.add(e2)}
for(let i=-3;i<=3;i++){const tt=new T.Mesh(new T.BoxGeometry(.04,.13,.03),tb);tt.position.set(i*.075,-.13+(i%2?.04:0),.285);hd.add(tt)}}
const tq=g.userData.torso;if(tq)for(let i=0;i<5;i++){const c=new T.Mesh(new T.ConeGeometry(.09,.7,5),sp);c.position.set((i-2)*.19,.15+(i%2)*.18,-.36);c.rotation.x=-2.2;tq.add(c)}
const rg=new T.Mesh(new T.RingGeometry(.8,1.25,32),new T.MeshBasicMaterial({color:0xff1030,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));rg.rotation.x=-Math.PI/2;rg.position.y=.05;rg.raycast=()=>{};g.add(rg)}
const au=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:0xff1030,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:.5,fog:false}));au.scale.set(4.6,4.6,1);au.position.y=1.1;au.raycast=()=>{};g.add(au);g.scale.multiplyScalar(1.15);g.scale.y*=1.1}
if(elite){const au2=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:0xffc233,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:.55,fog:false}));au2.scale.set(4,4,1);au2.position.y=1.2;au2.raycast=()=>{};g.add(au2);g.scale.multiplyScalar(1.22);(g.userData.mats||[]).forEach(m=>{if(m.emissive)m.emissive.setHex(0x5a3a00)})}
const md=({easy:.85,medium:1,hard:1.15,impossible:1.3})[diff]||1;
const baseSp=(grind?.7:1)*Math.min(5.4,(2.15+wave*.12)*md)*(MON_SPD[k]||1)*(corrupted?1.1:1)*(wmod==="swarm"?1.12:1);
const e={g,hp,t:"mon",k,cd:1,sd:rnd()<.5?1:-1,spd:baseSp,dmg:(7+wave*1)*(k===2||k===4?1.5:k===3?.8:1)*(corrupted?1.2:1)*(elite?1.3:1),ph:rnd()*6,esc:0,ea:0,sT:.5,sx:o.x,sz:o.z,hf:0,corr:!!corrupted,minion:!!opt.minion,rad:clamp(.4*g.scale.x+.12,.5,.7),pt:.5,stk:0,px:o.x,pz:o.z,vt:0,hc:0,vis:false};
e.hpMax=hp;e.bar=HB.make(g,2.6/(g.scale.x||1),()=>({hp:e.hp,max:e.hpMax,alive:e.hp>0&&!(e.em>0),far:70}),{base:e.corr?1.1:1,col:corrupted?(f=>f>.5?0xa78bfa:0xf43f5e):elite?(f=>0xfbbf24):null});e.elite=elite?1:0;e.em=opt.minion?(opt.em||1.4):1.4
if(ghostW||opt.ghost){e.ghost=1;e.phz=1;e.hv=.55;Ghost.tint(g)}
Phase.mod(e,g);
bindOwner(g,e);g.position.set(o.x,e.ghost?.55:-1.9,o.z);sc.add(g);g.updateMatrixWorld(true);E.push(e)}
function monBar(e){}
function spawnBot(){
const d=DF[diff],o=awaySpot(P.x,P.z,26),g=mkHuman({body:d.col,trim:0x1f2937,gun:GB("g2")});
const e={g,hp:d.hp,hpMax:d.hp,t:"bot",cd:1.2+rnd(),ph:rnd()*6,sd:rnd()<.5?1:-1,esc:0,ea:0,sT:.5,sx:o.x,sz:o.z,hf:0,mz:0,see:0,alert:0,err:0,burst:0};
e.bar=HB.make(g,2.55/(g.scale.x||1),()=>({hp:e.hp,max:e.hpMax||100,alive:e.hp>0,far:90}));
bindOwner(g,e);e.tag=tag(d.n,"#ef4444",2.9);g.add(e.tag);g.position.set(o.x,0,o.z);g.rotation.y=Math.atan2(P.x-o.x,P.z-o.z);sc.add(g);g.updateMatrixWorld(true);E.push(e)}
function botBar(e){}
// bots: a reaction delay after spotting you, a turn rate, short bursts, and an aim error that shrinks while you stay still and grows when you move, jump or are far away
const REACT={easy:.85,medium:.6,hard:.4,impossible:.25};
function botShot(e,d,a,dist,mv){
const p=e.g.position,ex=P.x-a.x,ez=P.z-a.z,l=Math.hypot(ex,ez)||1,lx=ez/l,lz=-ex/l;
const R=(1-d.acc)*(.35+dist*.03)+e.err+mv*.09+(P.gr?0:.35),ox=(rnd()+rnd()-1)*R,oy=(rnd()+rnd()-1)*R*.7,ok=Math.abs(ox)<.4&&oy>-.85&&oy<.65;
const tx=P.x+lx*ox,ty=P.y+1.1-.4*P.crouch+oy,tz=P.z+lz*ox,dx=tx-a.x,dy=ty-a.y,dz=tz-a.z,dl=Math.hypot(dx,dy,dz)||1,len=Math.min(dl+(ok?0:5),90),mzOk=los(p.x,1.35,p.z,a.x,a.y,a.z), // the muzzle sits ahead of the bot: if a wall is between body and muzzle the round dies in that wall
wall=mzOk?rayWorld(a.x,a.y,a.z,dx/dl,dy/dl,dz/dl,len):0;
const end=new T.Vector3(a.x+dx/dl*Math.min(len,wall),a.y+dy/dl*Math.min(len,wall),a.z+dz/dl*Math.min(len,wall));
Fx.tracer(a,end,0xff8866,.03);if(wall<len)Fx.burst(end,0xffe9a0,3,3,.05,1,12);
e.err+=.14;snd("sh",clamp(1-dist/70,.12,.55),.8);
if(ok&&wall>=dl-.1)hit(d.dmg*clamp(1.2-dist/90,.5,1),p)}
function botStep(e,dt){
const d=DF[diff],g=e.g,p=g.position,ex=P.x-p.x,ez=P.z-p.z,dist=Math.hypot(ex,ez)||1,face=Math.atan2(ex,ez);
g.rotation.y=turnTo(g.rotation.y,face,dt*(e.see?5.5:3.5));
if(e.hf>0){e.hf-=dt;if(e.hf<=0)hurtFlash(g,false)}
if(e.mz>0){e.mz-=dt;if(e.mz<=0)setMuzzle(g,false)}
if(P.fz>0||rL>0||P.dead>0||menuOpen){poseHuman(g,dt,0,0);return}
e.lt=(e.lt||0)-dt;if(e.lt<=0||e.seeR==null){e.lt=.09+rnd()*.05;e.seeR=dist<70&&los(p.x,1.5,p.z,P.x,P.y+1.4-.5*P.crouch,P.z)}
const see=e.seeR&&dist<70;
if(see&&!e.see){e.cd=Math.max(e.cd,REACT[diff]+rnd()*.25);e.err=Math.max(e.err||0,.9+dist*.02);e.burst=0}
e.see=see;e.err=Math.max(0,(e.err||0)-dt*(see?.9:2));
const sp=steer(e,P.x,P.z,dt,d.spd,6,see?11:3,see?.9:0);
poseHuman(g,dt,sp,see?1:0);
e.cd-=dt;
if(see&&e.cd<=0&&Math.abs(angDiff(g.rotation.y,face))<.3){
if(!e.burst)e.burst=diff==="easy"?1+(rnd()*2|0):2+(rnd()*3|0);
e.burst--;e.cd=e.burst>0?d.rate*.5:d.rate*(1.8+rnd()*1.6);
setMuzzle(g,true);e.mz=.06;g.userData.kick=1;
botShot(e,d,new T.Vector3(p.x+Math.sin(g.rotation.y)*.7,1.35,p.z+Math.cos(g.rotation.y)*.7),dist,Math.hypot(P.vx,P.vz)*.4+sp*d.spd*.15)}}
// spitter globs travel and can be dodged
const projs=[];let SPG=null,SPM=null;
function spit(x,y,z,dmg,dist,col){col=col||0x66ff44;
if(!SPG){SPG=new T.SphereGeometry(.16,8,6);SPM=new T.MeshBasicMaterial({color:0x66ff44})}
const lead=dist/15,tx=P.x+P.vx*lead*.5,tz=P.z+P.vz*lead*.5,ty=P.y+1.2-.4*P.crouch,dx=tx-x,dy=ty-y,dz=tz-z,l=Math.hypot(dx,dy,dz)||1,m=new T.Mesh(SPG,spm(col));
m.position.set(x,y,z);sc.add(m);projs.push({m,vx:dx/l*15,vy:dy/l*15,vz:dz/l*15,dmg,life:3,col});Gfx.flare({x,y,z},col,1.7,.2);snd("spit",clamp(1-dist/50,.2,.6))}
function projStep(dt){
for(let i=projs.length-1;i>=0;i--){const o=projs[i],p=o.m.position;o.life-=dt;o.vy-=2*dt;
const sx=o.vx*dt,sy=o.vy*dt,sz=o.vz*dt,sl=Math.hypot(sx,sy,sz)||1e-6,w=rayWorld(p.x,p.y,p.z,sx/sl,sy/sl,sz/sl,sl);
let dead=o.life<=0||w<sl||p.y<0;
if(!dead&&P.dead<=0&&P.fz<=0&&!menuOpen&&Math.hypot(p.x-P.x,p.z-P.z)<.65&&p.y>P.y&&p.y<P.y+1.9){hit(o.dmg,{x:p.x-o.vx,z:p.z-o.vz});dead=true}
if(dead){Gfx.splat(p,o.col||0x66ff44);sc.remove(o.m);projs.splice(i,1)}else{if(LOD.fx>.5&&rnd()<.6)Fx.burst(p,o.col||0x66ff44,1,.5,.06,.2,2);p.set(p.x+sx,p.y+sy,p.z+sz)}}}
function monUnstick(e){
e.stk=0;const g=e.g,p=g.position,w=Nav.ahead(p.x,p.z,6);let x,z;
if(w&&Math.hypot(w.x-p.x,w.z-p.z)>2){x=w.x;z=w.z}else{const s=freeSpot(P.x+(rnd()-.5)*18,P.z+(rnd()-.5)*18,e.rad||.6);x=s.x;z=s.z}
Fx.burst({x:p.x,y:.2,z:p.z},0x5a4632,10,3,.09,2,10);
p.x=x;p.z=z;p.y=0;e.yo=0;e.sx=x;e.sz=z;e.px=x;e.pz=z;e.em=1.4;e.fxd=0}
function monStep(e,dt){
const g=e.g,p=g.position,ex=P.x-p.x,ez=P.z-p.z,dist=Math.hypot(ex,ez)||1,u=g.userData;
if(e.boss)return bossStep(e,dt);if(e.em>0)return emergeStep(e,dt,ex,ez);
if(e.hf>0){e.hf-=dt;if(e.hf<=0)hurtFlash(g,false)}
if(P.fz>0||rL>0||menuOpen){poseMon(g,dt);return}
if(e.frz&&Phase.frozen(e,dist,dt))return;
g.rotation.y=turnTo(g.rotation.y,Math.atan2(ex,ez),dt*8);
if(P.dead>0){poseMon(g,dt);return}
if(e.hop){Nav.hopStep(e,dt);return}
const gh=!!e.ghost,ly0=p.y-(e.yo||0)-(e.hv||0);p.y=ly0;const rng=gh||e.k===1||e.k===5;
if(gh)e.hv=.55+Math.sin(performance.now()/476+e.ph)*.22; // ghosts hover, but they walk the same floor and routes as everything else
// walk straight at the player while the way is open; otherwise follow the flow field around walls and crates, hopping ledges that are too high to step onto
e.vt-=dt;if(e.vt<=0){e.vt=.18+rnd()*.1;e.vis=los(p.x,p.y+.35,p.z,P.x,p.y+.35,P.z)}
e.hc-=dt;let tx=P.x,tz=P.z,nr=0,fr=rng?10:1.4,sd=rng&&dist<12?.8:0;
if(gh)nr=5.5;
if(!e.vis){const w=Nav.next(p.x,p.z);if(w){tx=w.x;tz=w.z;fr=.1;sd=0;if(w.hop&&e.hc<=0&&Math.hypot(w.x-p.x,w.z-p.z)<1.35){Nav.hopStart(e,w.x,w.z,w.y,w.rise,.5+w.rise*.12);return}}}
const sp=steer(e,tx,tz,dt,gh?e.spd*1.05:e.spd,e.vis?nr:0,fr,sd);
// wedged for ~3 s with a long way to go: burrow under and come up further along the route
e.pt-=dt;if(e.pt<=0){e.pt=.5;e.stk=Math.hypot(p.x-e.px,p.z-e.pz)<.18&&dist>(rng?10.5:2.4)&&!e.wu?e.stk+1:0;e.px=p.x;e.pz=p.z;if(e.stk>=6)monUnstick(e)}
// keep feet on floor (steer already snaps; light bob only)
// the walking logic works on the true floor height; what you see glides there, so stairs and crates are climbed instead of popped onto
const fl=floorAt(p.x,p.z,p.y+1.2);e.yo=clamp(((e.yo||0)+(ly0-fl))*Math.exp(-dt*11),-2.6,2.6);p.y=fl+e.yo+(gh?e.hv:u.bob||0);e.cd-=dt;
if(!rng){if(e.wu>0){e.wu-=dt;u.kick=Math.max(u.kick,.7);if(e.wu<=0)monStrike(e)}else if(dist<1.9&&e.cd<=0&&los(p.x,1.2,p.z,P.x,P.y+1.2,P.z)){e.cd=e.k===4?1.2:.9;e.wu=e.k===4?.4:e.k===3?.14:e.k===2?.34:.24;monWind(e)}}
if(rng&&dist<(gh?28:24)&&e.cd<=0&&los(p.x,1.5,p.z,P.x,P.y+1.4-.5*P.crouch,P.z)){if(gh){e.cd=(e.k===1?1.3:e.k===4?2.8:2.1)+rnd()*.8;u.kick=1;spit(p.x,1.5,p.z,e.dmg*.8,dist,Ghost.CY);Gfx.flare({x:p.x,y:1.5,z:p.z},Ghost.CY,1.6,.2)}else{e.cd=e.k===5?1.4:1.8;u.kick=1;spit(p.x,1.6,p.z,e.dmg*.8,dist,e.corr?0xc060ff:0x66ff44)}}
if(gh&&(fr&3)===0&&rnd()<.5)Fx.burst({x:p.x+(rnd()-.5)*.8,y:p.y+.4+rnd()*1.4,z:p.z+(rnd()-.5)*.8},Ghost.CY,1,.6,.05,.4,6);
poseMon(g,dt)}

// ---------- Monster Rush: bosses, power-ups, finishers, effects ----------
const BN=["Gravemaw","Bonecrusher","The Hollow King","Rotlord","Voidmother"],CN=["Glitchwraith","Null Sovereign","The Unmade","Static Herald"],GN=["Wraith Queen","The Hollow Choir","Specter Prime","Banshee Monarch"],bossName=(c,gh)=>gh?GN[(Math.floor(wave/5)+GN.length*9)%GN.length]:c?"Corrupt "+CN[wave%CN.length]:BN[(Math.floor(wave/5)-1+BN.length*9)%BN.length];
let bossEl=null,bossLag=1;
function ringFx(x,z,r,col,life){const m=new T.Mesh(new T.RingGeometry(r*.9,r,48),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.12,z);sc.add(m);setTimeout(()=>{sc.remove(m);m.geometry.dispose();m.material.dispose()},life*1000)}
function spawnMinions(x,z,n,rad,step){for(let i=0;i<n;i++){const a=rnd()*6.283,r=1.5+rnd()*rad;spawnMon({minion:1,x:clamp(x+Math.cos(a)*r,-H+3,H-3),z:clamp(z+Math.sin(a)*r,-H+3,H-3),em:1.4+i*step})}}
function emergeStep(e,dt,ex,ez){if(e.ghost)return Ghost.emerge(e,dt,ex,ez);const g=e.g,p=g.position,u=g.userData;e.em-=dt;const f=clamp(e.em/1.4,0,1);if(e.em<1.4&&!e.fxd){e.fxd=1;spawnFx(p.x,p.z,!!e.corr)}
p.y=-1.9*f;g.rotation.y=turnTo(g.rotation.y,Math.atan2(ex,ez),dt*6);
u.torso.rotation.x=.1+1.1*f;u.arms[0].rotation.x=u.arms[1].rotation.x=-2.2+Math.sin(performance.now()/90+e.ph)*.5;u.legs[0].rotation.x=u.legs[1].rotation.x=0;
if(e.em<1.4&&Math.random()<dt*14)Fx.burst({x:p.x,y:.15,z:p.z},0x5a4632,3,2,.08,2,8);
if(e.em<=0){p.y=0;emergeDone(e)}}
function bossScale(){const tier=bpTier(),bf=clamp(PU.dmg*Math.sqrt(PU.rate)*(PU.hs>1?1.1:1)*(1+PU.crit*.4)*(PU.ls>1?1.1:1)*(1+PU.kh*.01),1,6);return{tier,bf}}
function bossNova(e){
const rings=e.corr?3:2;
for(let r=0;r<rings;r++)setTimeout(()=>{if(!E.includes(e)||state!=="play")return;
const p=e.g.position,n=e.corr?24:16,off=r*Math.PI/n+rnd()*.12;if(!SPG){SPG=new T.SphereGeometry(.16,8,6);SPM=new T.MeshBasicMaterial({color:0x66ff44})}
for(let i=0;i<n;i++){const a=i/n*6.283+off,m=new T.Mesh(SPG,SPM);m.position.set(p.x,1.3,p.z);sc.add(m);const sp=10+r*1.6;projs.push({m,vx:Math.cos(a)*sp,vy:0,vz:Math.sin(a)*sp,dmg:e.dmg*.4,life:3.2})}
ringFx(p.x,p.z,5+r*1.5,e.corr?0xb050ff:0x66ff44,.5);snd("sh",.5,.4)},r*380);
document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),200)}
// a ground slam: red telegraph first, then a shockwave; later stages follow it with a second ring that catches anyone who just stood at the edge
const LEAP_MAX=13; // longest boss jump in world units; the arena is 80 across
// boss blows are capped at a share of full health and followed by a short grace window, so no single landing can take you from healthy to dead
// bosses scale with the chosen difficulty: hp, damage, speed, attack tempo, the most one hit can take, and the grace window after it
const BD={easy:{hp:.5,dm:.5,sp:.8,tm:1.5,cap:.2,gr:1.3},medium:{hp:.75,dm:.72,sp:.9,tm:1.25,cap:.28,gr:1.05},hard:{hp:1,dm:1,sp:1,tm:1,cap:.36,gr:.9},impossible:{hp:1.15,dm:1.12,sp:1.04,tm:.92,cap:.4,gr:.8}},BDG={hp:.12,dm:.3,sp:.7,tm:2,cap:.08,gr:1.6},bdf=()=>grind?BDG:BD[diff]||BD.hard;
function bossHit(d,src){const was=P.hp,b=bdf();hit(Math.min(d,P.max*b.cap/(PU.arm||1)),src);if(P.hp<was)P.prot=Math.max(P.prot,b.gr)}
function bossSlam(e,r,m){
const p=e.g.position,x=p.x,z=p.z;
Fx.burst({x,y:.3,z},0xffaa44,32,10,.13,2,22);ringFx(x,z,r,0xffaa44,.4);
if(Math.hypot(P.x-x,P.z-z)<r&&P.y<1.8&&los(x,1.1,z,P.x,P.y+1.1,P.z))bossHit(e.dmg*m,{x,z});
snd("slam",.9);document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),280);
if(e.stage>=2||e.corr)setTimeout(()=>{if(!E.includes(e)||state!=="play")return;ringFx(x,z,r*1.55,0xff5a1a,.4);Fx.burst({x,y:.3,z},0xff5a1a,22,12,.1,2,20);const d=Math.hypot(P.x-x,P.z-z);if(d>r*.9&&d<r*1.6&&P.y<1.8&&los(x,1.1,z,P.x,P.y+1.1,P.z))bossHit(e.dmg*.7,{x,z})},450)}
// meteor rain: marked circles that detonate after a beat, aimed slightly ahead of where you are running
function bossMeteors(e){
const n=5+e.stage*2+(e.corr?4:0);
for(let i=0;i<n;i++){const a=rnd()*6.283,r=i===0?0:2+rnd()*9,x=clamp(P.x+Math.cos(a)*r+P.vx*.45,-H+2,H-2),z=clamp(P.z+Math.sin(a)*r+P.vz*.45,-H+2,H-2);
ringFx(x,z,3,0xff5a1a,1);
setTimeout(()=>{if(state!=="play"||!E.includes(e))return;Fx.burst({x,y:.4,z},0xff8a2a,22,8,.12,2,22);ringFx(x,z,3.3,0xffd24a,.35);if(Math.hypot(P.x-x,P.z-z)<3.1&&P.y<2.2&&los(x,.9,z,P.x,P.y+1,P.z))bossHit(e.dmg*.8,{x,z});snd("kill",.45)},900+i*120)}
document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),160)}
function spawnBoss(corr,ghost){
try{snd("roar",1);setTimeout(()=>snd("slam",.8),700)}catch(e){}
let o=awaySpot(P.x,P.z,20);if(blocked(o.x,o.z,0,corr?1.45:1.2))o=freeSpot(o.x,o.z);const g=mkMon(2),sc_=bossScale(),lv=1+xpLevel*.035,hp=Math.round((4200+wave*620)*(1+sc_.tier*.03)*sc_.bf*lv*(corr?2.2:1)*coopHp()*bdf().hp);g.scale.multiplyScalar(corr?2.7:2.2);
if(corr){const tc=new T.Color(0x1a0008);(g.userData.mats||[]).forEach(m=>{m.color.lerp(tc,.68);m.userData.em=0x4a0010;m.emissive.setHex(0x4a0010)})}
const lt=new T.PointLight(ghost?0x40e0ff:corr?0xa020ff:0xff2030,2.5,30,1.5);lt.position.y=3;g.add(lt);
for(let i=0;i<5;i++){const c=new T.Mesh(new T.ConeGeometry(.09,.55,5),new T.MeshLambertMaterial({color:0xe8e4d0}));c.position.set((i-2)*.14,2.35,.1);c.rotation.z=(i-2)*.18;g.add(c)}
const ring=new T.Mesh(new T.TorusGeometry(1.1,.07,8,32),new T.MeshBasicMaterial({color:0xff3344}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);
const e={g,hp,hpMax:hp,t:"mon",k:2,boss:true,corr:!!corr,lt,sd:1,name:bossName(corr,ghost),ghostB:!!ghost,ghost:!!ghost,rad:corr?1.45:1.2,at:"volley",spd:Math.min(5.2,3.3+wave*.035)*bdf().sp,dmg:(36+wave*2.1)*(1+sc_.tier*.015)*(1+(sc_.bf-1)*.4)*(1+xpLevel*.02)*(corr?1.6:1)*bdf().dm,ph:rnd()*6,esc:0,ea:0,sT:.5,sx:o.x,sz:o.z,hf:0,stage:0,stun:0,wind:0,atkT:2.2,ring,cd:1,leapT:corr?4:6.5,lp:null,hb:0,addT:7};
if(ghost)Ghost.tint(g,true);
bindOwner(g,e);g.position.set(o.x,0,o.z);sc.add(g);g.updateMatrixWorld(true);E.push(e);bossLag=1;
// the arena darkens and the ground trembles as it rises
try{if(!corr){corrStart();corrTgt=.55}}catch(x){}
try{tone(38,2.6,"sawtooth",.3,26);tone(57,2.2,"square",.1,40,.2);tone(88,1.4,"sawtooth",.07,60,.5)}catch(x){}
flashScreen(corr?"#6a00b0":"#7a0000");document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),900);ringFx(o.x,o.z,12,corr?0xb050ff:0xff2030,1.4)}
function bossStep(e,dt){
const g=e.g,p=g.position,u=g.userData,ex=P.x-p.x,ez=P.z-p.z,dist=Math.hypot(ex,ez)||1,t=performance.now()/1000;
if(e.hf>0){e.hf-=dt;if(e.hf<=0)hurtFlash(g,false)}
e.ring.rotation.z+=dt*(e.stun>0?6:2);e.ring.material.color.setHex(e.stun>0?0xaefcff:e.wind>0?0xffaa00:e.ghostB?0x6ff3ff:e.corr?0xb050ff:0xff3344);
if(e.lt)e.lt.intensity=(e.stun>0?1:2.2+Math.sin(t*4)*.8)+(e.wind>0?2.5:0);
if((fr&7)===0&&e.stun<=0)Fx.burst({x:p.x+(rnd()-.5)*2.4,y:.2,z:p.z+(rnd()-.5)*2.4},e.corr?0xa020ff:0xff3344,2,1.5,.06,2,8);
if(rnd()<dt*.35)e.sd*=-1;
e.phCD=(e.phCD||0)-dt;e.blCD=(e.blCD||0)-dt;
e.hb-=dt;if(e.hb<=0){e.hb=e.hp<e.hpMax*.3?.55:1.1;try{tone(54,.24,"sine",.2,36)}catch(x){}}
if(e.corr&&e.stun<=0&&!E.some(x=>x.minion&&x.hp>0)){e.addT-=dt;if(e.addT<=0&&E.length<11){e.addT=8;spawnMon();spawnMon()}}
// quarter-health thresholds summon minions and fully stun the boss (no attack)
if(e.stage<3&&e.hp>0&&e.hp<=e.hpMax*(1-.25*(e.stage+1))){e.stage++;e.stun=4.2;e.wind=0;e.atkT=2;u.kick=1;snd("kill",.9);flash(e.name+" is stunned. Horde incoming!",2000);ringFx(p.x,p.z,9,0xaefcff,2.5);Fx.burst({x:p.x,y:2.4,z:p.z},0xaefcff,24,6,.1,3,22);spawnMinions(p.x,p.z,5*e.stage,6,2.2/(5*e.stage))}
if(P.fz>0||rL>0||menuOpen){poseMon(g,dt);return}
if(P.dead>0){poseMon(g,dt);return}
const minionsLeft=E.filter(x=>x!==e&&x.t==="mon"&&x.minion&&x.hp>0).length;
// the boss snaps out of it the moment the last minion dies
if(minionsLeft===0&&e.stun>0){e.stun=0;g.rotation.z=0;p.y=0;if(u.head)u.head.rotation.y=0;flash(e.name+" recovers!",900)}
if(e.stun>0||minionsLeft>0&&e.stage>0){
// dizzy animation: wobble, head spin, arms out, floating stars
g.rotation.y+=Math.sin(t*9)*.04;
g.rotation.z=Math.sin(t*7)*.12;
p.y=.12+Math.abs(Math.sin(t*5.5))*.18;
poseMon(g,dt);
if(u.head)u.head.rotation.y=Math.sin(t*10)*1.4;
if(u.arms){u.arms[0].rotation.x=-1.2+Math.sin(t*6)*.5;u.arms[1].rotation.x=-1.2+Math.cos(t*6)*.5;u.arms[0].rotation.z=.6;u.arms[1].rotation.z=-.6}
if((fr&2)===0)Fx.burst({x:p.x+(rnd()-.5)*1.4,y:p.y+2.6+(rnd()*.4),z:p.z+(rnd()-.5)*1.4},0xfff1a8,2,1.2,.05,1.5,4);
if(e.stun<=0&&minionsLeft===0){g.rotation.z=0;if(u.head)u.head.rotation.y=0}
return}
if(e.lp){const l=e.lp;l.t+=dt;const k=Math.min(1,l.t/l.dur);p.x=l.sx+(l.tx-l.sx)*k;p.z=l.sz+(l.tz-l.sz)*k;p.y=Math.sin(k*Math.PI)*4.4;poseMon(g,dt);u.arms[0].rotation.x=u.arms[1].rotation.x=-2.6;g.rotation.y=turnTo(g.rotation.y,Math.atan2(l.tx-l.sx,l.tz-l.sz),dt*8);
if(k>=1){e.lp=null;p.y=0;bossSlam(e,8.2,1);e.atkT=Math.max(e.atkT,1.1)}return}
if(e.pz>0){Ghost.phaseStep(e,dt);return}
if(e.dash>0){e.dash-=dt;const sd_=dt*(e.corr?22:18),dnx=clamp(p.x+e.dx*sd_,-H+2,H-2),dnz=clamp(p.z+e.dz*sd_,-H+2,H-2),rd_=e.rad||1.5;
if(!blocked(dnx,dnz,0,rd_)){p.x=dnx;p.z=dnz}
else if(!blocked(dnx,p.z,0,rd_))p.x=dnx;else if(!blocked(p.x,dnz,0,rd_))p.z=dnz;
else{e.dash=0;e.dhit=0;e.atkT=1.8;snd("slam",.8);Fx.burst({x:p.x+e.dx*rd_,y:1.2,z:p.z+e.dz*rd_},0xcfc6b0,26,7,.12,2,18);ringFx(p.x,p.z,4.2,0xffaa44,.4);document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),240);poseMon(g,dt);return}
if(!e.dhit&&Math.hypot(P.x-p.x,P.z-p.z)<2.8&&P.y<1.8&&los(p.x,1.1,p.z,P.x,P.y+1.1,P.z)){e.dhit=1;bossHit(e.dmg*1.1,p)}
Fx.burst({x:p.x,y:.4,z:p.z},e.corr?0xb050ff:0xffaa44,3,2,.08,2,8);poseMon(g,dt);if(e.dash<=0){e.dhit=0;e.atkT=1.6}return}
g.rotation.y=turnTo(g.rotation.y,Math.atan2(ex,ez),dt*(e.corr?3.4:2.6));
let sp=0;
if(e.wind>0){e.wind-=dt;if(e.wind<=0){
if(e.at==="slam")bossSlam(e,8.2,1.3);
else if(e.at==="meteor")bossMeteors(e);
else if(e.at==="nova"){bossNova(e)}else if(e.at==="phase"){Ghost.phaseStart(e);return}else if(e.at==="blink"){Ghost.blink(e)}else if(e.at==="dash"){e.dash=1.1;e.dx=ex/dist;e.dz=ez/dist;snd("kill",.8)}else{for(let j=0;j<(3+e.stage)*(e.corr?2:1);j++)setTimeout(()=>{if(E.includes(e)&&state==="play"&&!menuOpen&&P.fz<=0)spit(p.x,3.2,p.z,e.dmg*.45,Math.hypot(P.x-p.x,P.z-p.z))},j*230)}
e.atkT=Math.max(.9,2.1-e.stage*.22-(e.hp<e.hpMax*.3?.5:0))*(e.corr?.7:1)*bdf().tm}}
else{
// it circles the player at a distance instead of walking straight in, and now and then leaps across the arena
const oa=t*.32*e.sd+e.ph,ox=clamp(P.x+Math.cos(oa)*10,-H+3,H-3),oz=clamp(P.z+Math.sin(oa)*10,-H+3,H-3);
sp=steer(e,ox,oz,dt,e.spd*(e.corr?1.35:1)+e.stage*.4,1.2,2.6,0);e.atkT-=dt;
e.leapT-=dt;if(e.leapT<=0&&dist>5){e.leapT=(e.corr?5:8)-e.stage*.8;let lx=clamp(P.x+(rnd()-.5)*5,-H+4,H-4),lz=clamp(P.z+(rnd()-.5)*5,-H+4,H-4);
// the leap is a short hop, not a trip across the arena: the landing spot stays within LEAP_MAX of where the boss stands
const ldx=lx-p.x,ldz=lz-p.z,ld=Math.hypot(ldx,ldz);if(ld>LEAP_MAX){lx=p.x+ldx/ld*LEAP_MAX;lz=p.z+ldz/ld*LEAP_MAX}
if(blocked(lx,lz,0,e.rad||1.5)){const f_=freeSpot(lx,lz);lx=f_.x;lz=f_.z}
if(los(p.x,1.2,p.z,lx,1.2,lz)){e.lp={t:0,dur:clamp(Math.hypot(lx-p.x,lz-p.z)/LEAP_MAX,.55,1),sx:p.x,sz:p.z,tx:lx,tz:lz};ringFx(lx,lz,8.2,0xff2200,1);snd("jump",.9,.5);u.kick=1}else e.leapT=1.2}
if(e.atkT<=0){const r_=rnd(),adv=e.corr||e.stage>=1||wave>=10;e.at=dist<9&&r_<.55?"slam":r_<.22?"dash":r_<.42?"nova":(r_<.64&&adv)?"meteor":"volley";e.wind=e.at==="slam"?.8:e.at==="dash"?.6:e.at==="nova"?.8:e.at==="meteor"?.7:.55;if(e.at==="slam")ringFx(p.x,p.z,8.2,0xff2200,.8);u.kick=1;
if(e.ghostB&&e.phCD<=0&&(rnd()<.3||!los(p.x,1.2,p.z,P.x,P.y+1.2,P.z))){e.at="phase";e.wind=.9;Ghost.fade(g,.35);ringFx(p.x,p.z,5,0x6ff3ff,.9);snd("phase",.8)}
else if(e.corr&&e.blCD<=0&&rnd()<.3){e.at="blink";e.wind=.7;ringFx(p.x,p.z,4,0xd070ff,.7);snd("lose",.5)}}}
p.y=Math.abs(Math.sin(t*5))*.12*sp;poseMon(g,dt);if(e.wind>0)u.arms[0].rotation.x=u.arms[1].rotation.x=-2.6}
function bossDeath(e){
const p=e.g.position.clone(),gx=e.g;
flash(e.name+" defeated",2800);snd("boom",.9);setTimeout(()=>snd("win"),500);
// multi-stage exploding death
const cols=[0xffd24a,0xff6a2a,0xff3344,0xffffff,0xaefcff];
for(let i=0;i<6;i++)setTimeout(()=>{
const c=cols[i%cols.length],r=3+i*1.8;
Fx.burst({x:p.x,y:1.2+i*.4,z:p.z},c,18+i*6,7+i,.1+.02*i,2+i*.3,28);
ringFx(p.x,p.z,r,c,.5+i*.15);
if(i%2===0)snd("kill",.7+.1*i);
},i*140);
setTimeout(()=>{document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),700);flashScreen("#ffd24a")},200);
setTimeout(()=>{Fx.burst({x:p.x,y:2.5,z:p.z},0xffffff,55,12,.16,4,40);ringFx(p.x,p.z,14,0xffd24a,2.2)},900);
S.coins+=15+wave*2;addBP(e.corr?150+wave*3:80+Math.floor(wave*2.4));spawnMinions(p.x,p.z,12,2.2,.14)}
function bossHud(){const b=E.find(x=>x.boss);if(!b){if(bossEl)bossEl.style.display="none";return}
if(!bossEl){bossEl=document.createElement("div");bossEl.id="bossbar";bossEl.innerHTML='<div class="bn"></div><div class="bt"><i class="bl"></i><i class="bf"></i><u style="left:25%"></u><u style="left:50%"></u><u style="left:75%"></u></div><div class="bp"><s></s><s></s><s></s><s></s></div>';document.body.appendChild(bossEl)}
const f=clamp(b.hp/b.hpMax,0,1),mins=E.filter(x=>x!==b&&x.t==="mon"&&x.minion&&x.hp>0).length;
bossEl.style.display="block";bossEl.querySelector(".bn").textContent=b.name+(mins?"  ·  CLEAR MINIONS ("+mins+")":(b.stun>0?"  ·  STUNNED":""));
bossEl.querySelector(".bf").style.width=f*100+"%";bossLag+=(f-bossLag)*.04;if(bossLag<f)bossLag=f;bossEl.querySelector(".bl").style.width=bossLag*100+"%";
bossEl.classList.toggle("sum",b.stun>0);bossEl.querySelectorAll(".bp s").forEach((x,i)=>x.classList.toggle("on",i>=b.stage))}
setInterval(()=>{if(bossEl&&(mode!=="waves"||state!=="play"))bossEl.style.display="none"},300);
function addXP(n){
if(mode!=="waves"||state!=="play")return;
xp+=n;flash("+"+n+" XP",500);snd("xp",.35,1+Math.min(.5,xp/Math.max(1,xpNeed)*.5));
while(xp>=xpNeed){xp-=xpNeed;xpLevel++;xpNeed=Math.round(40+xpLevel*18);offerPU();break}
}
function freezeCombat(){
// stop every monster/bot in place and wipe projectiles mid-flight
for(const e of E){const g=e.g;if(!g)continue;e.cd=Math.max(e.cd||0,1.2);e.wind=0;e.atkT=Math.max(e.atkT||0,1);e.burst=0;e.see=false;
if(g.userData)g.userData.kick=0;setMuzzle(g,false)}
while(projs.length){const o=projs.pop();try{sc.remove(o.m)}catch(e){}}
firing=false;knifeCharging=false;knifeCharge=0;grenAim=false;clearGrenPrev()}
function offerPU(){if(state!=="play"||mode!=="waves")return;menuOpen=true;Aim.release();document.body.classList.remove("playing");grenAim=false;clearGrenPrev();freezeCombat();
const pool=[...PUD].sort(()=>rnd()-.5).slice(0,3),ov=document.createElement("div");ov.id="puov";
ov.innerHTML=`<div class="puw"><div class="eyebrow">Level ${xpLevel} · Power-up</div><h2>Choose a power-up</h2><div class="pucs">${pool.map(q=>`<button class="puc" data-p="${q.id}"><span class="pue">${gly(q.e)}</span><b>${q.n}</b><small>${q.d}</small>${PU.got[q.id]?`<em>owned x${PU.got[q.id]}</em>`:""}</button>`).join("")}</div></div>`;
document.body.appendChild(ov);
ov.addEventListener("click",ev=>{const b=ev.target.closest(".puc");if(!b)return;const q=PUD.find(x=>x.id===b.dataset.p);q.f();PU.got[q.id]=(PU.got[q.id]||0)+1;ov.remove();menuOpen=false;document.body.classList.add("playing");snd("pick");flash(q.n,1200);Aim.request()})}
function offerCorruptedPU(left,label){
if(state!=="play"||mode!=="waves")return;menuOpen=true;Aim.release();document.body.classList.remove("playing");grenAim=false;clearGrenPrev();freezeCombat();
const taken=new Set();const show=()=>{const pool=PUD.filter(q=>!taken.has(q.id)).sort(()=>rnd()-.5).slice(0,Math.min(6,PUD.length));
const old=document.getElementById("puov");if(old)old.remove();
const ov=document.createElement("div");ov.id="puov";
ov.innerHTML=`<div class="puw"><div class="eyebrow">${label||"Corrupted"} reward · ${left} left</div><h2>Choose from all power-ups</h2><div class="pucs">${pool.map(q=>`<button class="puc" data-p="${q.id}"><span class="pue">${gly(q.e)}</span><b>${q.n}</b><small>${q.d}</small></button>`).join("")}</div></div>`;
document.body.appendChild(ov);
ov.addEventListener("click",ev=>{const b=ev.target.closest(".puc");if(!b)return;const q=PUD.find(x=>x.id===b.dataset.p);if(!q||taken.has(q.id))return;q.f();PU.got[q.id]=(PU.got[q.id]||0)+1;taken.add(q.id);snd("pick");flash(q.n,900);left--;
if(left<=0){ov.remove();menuOpen=false;document.body.classList.add("playing");corrupted=false;wn=1.2;Aim.request()}else show()})};
show()}
function flashScreen(c){const d=document.createElement("div");d.style.cssText="position:fixed;inset:0;z-index:30;pointer-events:none;background:"+c+";opacity:.35;transition:opacity .35s";document.body.appendChild(d);requestAnimationFrame(()=>d.style.opacity=0);setTimeout(()=>d.remove(),450)}
function celebrate(e){const id=S.own[S.fin]?S.fin:"f0";playFinisher(I(id)||FN[0],e.g.position)}
// The same effect recipes can target the match or an isolated loadout preview.
function playFinisher(item,p,effects){
const k=item.k,at=(x,y,z)=>({x:p.x+x,y:p.y+y,z:p.z+z}),
B=effects?effects.burst:(...args)=>Fx.burst(...args),
later=effects?effects.later:setTimeout,flash=effects?effects.flash:flashScreen;
if(k==="pop")B(at(0,1.1,0),0xffe08a,14,6,.1,3,16);
else if(k==="conf"){[0xff5a8a,0x5ae0ff,0xffe05a,0x8aff5a].forEach((c,j)=>later(()=>B(at(0,1.2+j*.15,0),c,16,7,.09,5,24),j*70))}
else if(k==="bolt"){for(let j=0;j<6;j++)later(()=>B(at((rnd()-.5)*.4,j*1.1,(rnd()-.5)*.4),0xbfe4ff,10,5,.12,1,10),j*35);flash("#bfe4ff")}
else if(k==="wave2"){for(let j=0;j<3;j++)later(()=>{for(let a=0;a<12;a++){const t=a/12*6.283;B(at(Math.cos(t)*(.8+j*.9),.3,Math.sin(t)*(.8+j*.9)),0x7ad7ff,3,2,.1,1,12)}},j*120)}
else if(k==="fire"){for(let j=0;j<4;j++)later(()=>B(at((rnd()-.5)*3,3+rnd()*2,(rnd()-.5)*3),pk([0xff4a6a,0xffd24a,0x6affb2,0xb48cff]),26,8,.1,2,30),j*160)}
else if(k==="hole"){for(let j=0;j<5;j++)later(()=>B(at(0,1+j*.3,0),0xb48cff,14,3,.1,-1,20),j*90);flash("#b48cff")}
else if(k==="spark"){for(let j=0;j<6;j++)later(()=>B(at((rnd()-.5)*.6,.5+j*.35,(rnd()-.5)*.6),pk([0xfff1a8,0xffc83a,0xffffff]),9,2.2,.07,2.5,-1),j*80)}
else if(k==="bub"){for(let j=0;j<7;j++)later(()=>B(at((rnd()-.5)*1.2,.3+j*.18,(rnd()-.5)*1.2),pk([0x9fe8ff,0xc9f3ff,0x7ac6ff]),4,1.3,.17,1.2,-1.6),j*70)}
else if(k==="coins"){for(let j=0;j<8;j++)later(()=>B(at((rnd()-.5)*1.6,2.6+rnd(),(rnd()-.5)*1.6),pk([0xffd24a,0xe0a800]),6,1.2,.12,0,10),j*60)}
else if(k==="pet"){for(let j=0;j<8;j++){const t=j*.8;later(()=>B(at(Math.cos(t)*.7,.7+j*.16,Math.sin(t)*.7),pk([0xffb3d1,0xff8fb8,0xffd6e6]),7,2.6,.1,1.6,-.4),j*70)}}
else if(k==="ember"){for(let j=0;j<5;j++)later(()=>B(at((rnd()-.5)*.5,.3+j*.25,(rnd()-.5)*.5),pk([0xff7a1a,0xffc04a,0xff4a1a]),11,2.4,.08,5,-2),j*70)}
else if(k==="ice"){B(at(0,1,0),0xbfeaff,26,8,.09,1,14);B(at(0,1.1,0),0xffffff,10,5,.07,2,10);for(let j=0;j<2;j++)later(()=>{for(let a=0;a<10;a++){const t=a/10*6.283;B(at(Math.cos(t)*(.7+j*.8),.25,Math.sin(t)*(.7+j*.8)),0xd4f1ff,3,2,.09,1,12)}},j*110);flash("#bfeaff")}
else if(k==="met"){for(let j=0;j<5;j++)later(()=>B(at(0,5.2-j*1.1,0),pk([0xff8a2a,0xffd24a]),9,1.2,.13,0,2),j*45);later(()=>{B(at(0,.2,0),0xffb347,34,9,.12,3,14);B(at(0,.3,0),0xff4a1a,16,5,.15,2,10);flash("#ff9a3c")},260)}
else if(k==="tox"){for(let j=0;j<6;j++)later(()=>B(at((rnd()-.5)*.9,.25+j*.22,(rnd()-.5)*.9),pk([0x7dff4a,0x9dff5a,0x3aa81f]),8,1.8,.19,1.4,-.6),j*80)}
else if(k==="phx"){for(let j=0;j<12;j++){const t=j*.7;later(()=>B(at(Math.cos(t)*.8,j*.32,Math.sin(t)*.8),pk([0xff5a1f,0xffb02e,0xffe08a]),8,2,.1,3,-1),j*45)}}
else if(k==="nova"){B(at(0,1.2,0),0xffffff,40,10,.12,0,6);B(at(0,1.2,0),0xffd86a,24,6,.16,0,4);for(let j=0;j<3;j++)later(()=>{for(let a=0;a<14;a++){const t=a/14*6.283;B(at(Math.cos(t)*(.8+j*.9),1.2,Math.sin(t)*(.8+j*.9)),0xfff3b0,3,2.4,.1,0,6)}},j*100);flash("#ffffff")}
else if(k==="torn"){for(let j=0;j<14;j++){const t=j*.9,r=.3+j*.06;later(()=>B(at(Math.cos(t)*r,j*.28,Math.sin(t)*r),pk([0xdfe7ee,0xb4c2d0,0x8fa3b8]),5,1.2,.1,2,-2),j*40)}}
else if(k==="glitch"){for(let j=0;j<8;j++)later(()=>{B(at((rnd()-.5)*2,.3+rnd()*2,(rnd()-.5)*2),pk([0x00ffd0,0xff2d95,0xffffff]),7,3,.16,0,0);if(j%3==0)flash(j%2?"#00ffd0":"#ff2d95")},j*55)}
else if(k==="dust"){B(at(0,.3,0),0xe8dcc0,16,2.4,.15,1,5);later(()=>B(at(0,.5,0),0xb8a57d,10,1.6,.18,1.4,-.4),90)}
else if(k==="smoke"){for(let j=0;j<5;j++)later(()=>B(at((rnd()-.5)*.5,.4+j*.28,(rnd()-.5)*.5),pk([0xd5dbe2,0x9aa3ad,0xc7ced6]),6,1,.2,1.6,-.9),j*80)}
else if(k==="hearts"){for(let j=0;j<8;j++)later(()=>B(at((rnd()-.5)*.9,.5+j*.22,(rnd()-.5)*.9),pk([0xff9ab8,0xff4f84,0xffc2d4]),4,1.8,.13,1.4,-.8),j*70)}
else if(k==="starf"){for(let j=0;j<9;j++)later(()=>B(at((rnd()-.5)*1.6,4+rnd()*1.5,(rnd()-.5)*1.6),pk([0xfff1a8,0xffd24a,0xffffff]),5,.8,.1,0,9),j*60)}
else if(k==="leaf"){for(let j=0;j<14;j++){const t=j*.8,r=.4+j*.05;later(()=>B(at(Math.cos(t)*r,.3+j*.16,Math.sin(t)*r),pk([0xb6f29a,0x6fd45a,0x3fae45]),4,1.4,.1,2,-1),j*45)}}
else if(k==="rain"){const cs=[0xff4a4a,0xffa94a,0xffe04a,0x6aff7a,0x4ac8ff,0x9a6aff];for(let a=0;a<18;a++){const t=a/17*Math.PI;later(()=>B(at(Math.cos(t)*1.6,.3+Math.sin(t)*2,0),cs[Math.floor(a/3)],4,.8,.13,1.6,-.2),a*28)}}
else if(k==="clap"){B(at(0,1,0),0xffffff,20,9,.1,1,8);for(let j=0;j<2;j++)later(()=>{for(let a=0;a<14;a++){const t=a/14*6.283;B(at(Math.cos(t)*(.8+j*1.1),.4,Math.sin(t)*(.8+j*1.1)),0x8fb8ff,3,2.6,.11,1,10)}},j*120);flash("#ffffff")}
else if(k==="sak"){B(at(0,1,0),0xffc8dc,24,5,.1,1.6,-.5);for(let j=0;j<8;j++)later(()=>B(at((rnd()-.5)*1.4,1.5+rnd()*1.2,(rnd()-.5)*1.4),pk([0xffc8dc,0xff8fb8,0xffe0ec]),4,1.2,.1,1.8,-.3),j*70)}
else if(k==="aur"){for(let j=0;j<7;j++)later(()=>B(at(Math.sin(j)*.5,.4+j*.45,Math.cos(j)*.3),pk([0x58f0b8,0x7be0ff,0xa78bfa]),10,1.6,.15,3,-.5),j*80)}
else if(k==="ring"){for(let j=0;j<3;j++)later(()=>{for(let a=0;a<20;a++){const t=a/20*6.283,r=.8+j*.7;B(at(Math.cos(t)*r,.25,Math.sin(t)*r),pk([0xff3a1a,0xffb347,0xffe08a]),3,1.4,.12,2,-1.4)}},j*110);flash("#ff7a2a")}
else if(k==="crys"){B(at(0,1,0),0xf0c8ff,28,8,.09,1,14);B(at(0,1.1,0),0x8ad7ff,18,6,.08,1.2,12);later(()=>B(at(0,1.2,0),0xffffff,10,4,.07,2,8),120);flash("#d8b4fe")}
else if(k==="cos"){for(let j=0;j<10;j++)later(()=>B(at((rnd()-.5)*1.4,.4+j*.22,(rnd()-.5)*1.4),pk([0xd8b4fe,0x8b5cf6,0xffffff]),6,1.6,.09,2.5,-.7),j*60)}
else if(k==="drag"){for(let j=0;j<14;j++)later(()=>B(at(Math.sin(j*1.3)*.15,.9+j*.03,j*.28),pk([0xff2a1a,0xff8a1a,0xffcf5a]),9,2.4,.14,2,-.6),j*35);flash("#ff6a1a")}
else if(k==="sol"){B(at(0,1.2,0),0xfff3b0,34,9,.12,0,6);B(at(0,1.2,0),0xff8a1a,22,6,.17,0,4);for(let j=0;j<3;j++)later(()=>{for(let a=0;a<16;a++){const t=a/16*6.283;B(at(Math.cos(t)*(.9+j),1.2,Math.sin(t)*(.9+j)),0xffc04a,3,2.6,.1,0,6)}},j*100);flash("#ffcf6a")}
else if(k==="wolfs"){for(let w=0;w<4;w++)for(let j=0;j<8;j++){const t=w*1.571+j*.22;later(()=>B(at(Math.cos(t)*1.5,.3+j*.22,Math.sin(t)*1.5),pk([0xc9e8ff,0x6aa0ff,0xffffff]),4,1,.12,2,-.8),j*55+w*40)}}
else if(k==="rift"){for(let j=0;j<6;j++)later(()=>B(at((rnd()-.5)*2,.3+rnd()*2,(rnd()-.5)*2),pk([0xe0aaff,0x7c3aed,0x111827]),10,3,.14,-1,0),j*70);later(()=>{B(at(0,1.2,0),0xffffff,30,9,.1,0,6);flash("#7c3aed")},420)}}
function rareFx(it){const o=document.createElement("div");o.id="rfx";o.style.setProperty("--c",RC[it.r]);if(it.r===5)o.classList.add("rb");
let h='<div class="fl"></div><div class="rays"></div><div class="ring"></div><div class="ring" style="animation-delay:.18s"></div>';
const n=18+it.r*8;for(let i=0;i<n;i++){const a=i/n*6.283+rnd()*.3,d=18+rnd()*34;h+=`<i style="--dx:${(Math.cos(a)*d).toFixed(1)}vmin;--dy:${(Math.sin(a)*d).toFixed(1)}vmin;animation-delay:${(rnd()*.25).toFixed(2)}s"></i>`}
h+=`<div class="tx"><small>${R[it.r]}</small><b>${esc(it.n)}</b></div>`;o.innerHTML=h;document.body.appendChild(o);
if(it.r>=4){document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),700)}
snd("win");setTimeout(()=>o.remove(),2100)}
function slashFx(c,r,k){const d=document.createElement("div");d.className="slash s"+c+" r"+(r|0)+" k-"+ksty(k);document.body.appendChild(d);setTimeout(()=>d.remove(),320)}

// ---------- pickups ----------
function spawnPU(){
const t=pk([0,0,1,2,2,2]),s=freeSpot((rnd()-.5)*70,(rnd()-.5)*70),g=new T.Group();
const m=(geo,c,o)=>{const x=new T.Mesh(geo,new T.MeshBasicMaterial({color:c,transparent:!!o,opacity:o||1,depthWrite:!o}));g.add(x);return x};
if(t==0){m(new T.BoxGeometry(.7,.22,.22),0xff2244);m(new T.BoxGeometry(.22,.7,.22),0xff2244);m(new T.SphereGeometry(.55,12,8),0xffffff,.22)}
else if(t==1){m(new T.ConeGeometry(.3,.6,4),0x22d3ee).position.y=.3;const b=m(new T.ConeGeometry(.3,.6,4),0x22d3ee);b.position.y=-.3;b.rotation.x=Math.PI;m(new T.SphereGeometry(.55,12,8),0x22d3ee,.18)}
else{const c=m(new T.CylinderGeometry(.4,.4,.1,16),0xffd700);c.rotation.x=Math.PI/2;const i=m(new T.CylinderGeometry(.25,.25,.12,16),0xe0a800);i.rotation.x=Math.PI/2}
g.position.set(s.x,1,s.z);sc.add(g);pu.push({g,t})}
function puStep(dt){
if(mode!=="range"&&!PT.on){pT-=dt;if(pT<=0&&pu.length<4&&P.fz<=0){pT=6;spawnPU()}}
const tt=performance.now();
pu=pu.filter(p=>{p.g.rotation.y+=dt*2.5;p.g.position.y=1+Math.sin(tt/300)*.12;
if(P.dead<=0&&Math.hypot(p.g.position.x-P.x,p.g.position.z-P.z)<1.3&&P.y<1.6){
Fx.burst(p.g.position,[0xff4466,0x22d3ee,0xffd700][p.t],10,3,.07,2,6);dropModel(p.g);snd(["heal","spd","coin"][p.t]||"pick");qAdd("pick",1);
if(p.t==0){P.hp=Math.min(P.max,P.hp+35);flash("+35 Health")}
if(p.t==1){P.spd=6;flash("Speed boost")}
if(p.t==2){S.coins+=2;sv();flash("+2 coins")}return false}return true});
P.spd=Math.max(0,P.spd-dt)}
