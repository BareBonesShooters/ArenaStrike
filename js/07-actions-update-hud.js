"use strict";
// ---------- actions ----------
function reload(){const g=cg();if(state!=="play"||menuOpen||A.rl>0||A.mag>=g.m&&mode!=="tut"||P.dead>0||slot!==0)return;A.rl=g.rl*PU.rl;gunSnd(g,"rl",1,A.rl);tf("reload")}
function muzzleWorld(){
if(TP.on()){const m=TP.mz();if(m)return m}
const gb=VM.gb,g=cg(),k=Math.tan(cam.fov*.00872665)/Math.tan(.506145),mz=gb?gb.mz:{x:0,y:.02,z:-g.l/2-g.b-.07};
return cam.localToWorld(new T.Vector3((.17+mz.x)*k,(-.17+mz.y)*k,-.4+mz.z))}
// one cone for the bullets and the crosshair: half-angle as a tangent, so it is round on screen at any aspect ratio or zoom
function curSpread(g){return((g.sp||0)*(scoped?.35:1)+P.sp*.0013+(P.gr?0:.012)+Math.hypot(P.vx,P.vz)*.0007)*(1-.3*P.crouch)}
const hitList=[];
function gatherTargets(){
hitList.length=0;for(const e of E)if(e.hp>0&&!(e.em>0)&&!e.phz&&(!e.custom||e.team!==CustomBattle.playerTeam))hitList.push(...e.g.userData.hit);
if(PT.on)Party.targets(hitList);for(const m of rT)hitList.push(m);return hitList}
function fire(){
if(CustomBattle.active&&!CustomBattle.canShoot)return;
if(!isGame()||P.fz>0||P.dead>0||rL>0||P.em||mode==="parkour")return;if(slot===1)return stab();if(A.rl>0)return;
const g=cg(),now=performance.now()/1000;if(now<nextShot)return;if(A.mag<=0){gunSnd(g,"dry");nextShot=now+.25;reload();return}if(mode==="range"&&rs<=0)return;
nextShot=now+g.t/PU.rate;A.mag--;if(g.m>8&&A.mag<=5){if(A.mag>0)snd("lastr",.6,1+(5-A.mag)*.1);else snd("mclack",.7)} // last-rounds tick rises in pitch; an empty mag clacks
P.fk=P.fk||{x:0,v:0};if(!S.comfort)P.fk.v+=Tune.n("fx.fovKick",9,0,40)*clamp(.35+g.d/60,.35,1.4)*((g.pel||1)>1?1.3:1);if(mode==="range"){rs--;rNow=0;if(rs<=0)setTimeout(()=>{if(state==="play"&&mode==="range")endGame(true)},1300)}tf("shoot");cam.updateMatrixWorld();
const tg=gatherTargets(),pel=g.pel||1,acc=new Map(),ax=Aim.x,ay=Aim.y,
spr=curSpread(g),tf2=Math.tan(cam.fov*.00872665),asp=cam.aspect,mzp=muzzleWorld(),gc=gunCol(g);let lastEnd=null;
const tgs=tg.slice();
for(let i=0;i<pel;i++){
const pa=rnd()*6.2832,pr=i===0&&pel>1?0:Math.sqrt(rnd())*spr;rc.setFromCamera({x:ax+Math.cos(pa)*pr/(tf2*asp),y:ay+Math.sin(pa)*pr/tf2},cam);
const o=rc.ray.origin.clone(),d=rc.ray.direction.clone();
if(PT.on&&!lastEnd)lastEnd=o.clone().addScaledVector(d,rayWorld(o.x,o.y,o.z,d.x,d.y,d.z,90)); // what other players see
Bul.fire(o,d,g,mzp,{gc,tg:tgs,mini:pel>1&&i>1,w:(pel>1?.012:.022)+g.r*.0035})}
if(mode==="range"){if(rNow){rHit++;rCur++;rBest=Math.max(rBest,rCur)}else rCur=0}
acc.forEach((a,f)=>Party.shoot(f,g,!!a.head,a.n));
if(PT.on)Party.sendFx(mzp,lastEnd,g);
VM.kick(clamp(.4+g.d*.008,.4,1.2));VM.flash();TP.kick(clamp(.4+g.d*.008,.4,1.2));gunSnd(g,"fire");Gfx.flare(mzp,gc.col,clamp(.45+g.d*(g.pel||1)*.006,.5,1.5),.06);if(!g.glow&&!g.coil&&!g.multi&&LOD.fx>.4)Fx.burst(TP.on()?mzp:cam.localToWorld(new T.Vector3(.22,-.14,-.45)),g.pel>1?0xd24a3a:0xd9a441,1,2.4,.045,2.6,20);
P.rk+=clamp(.006+g.d*.0004,.006,.032);P.pitch+=clamp(.002+g.d*.0001,.002,.008);P.yaw+=(rnd()-.5)*.004;P.sp=Math.min(12,P.sp+(g.pel?4:3.5));
if(A.mag<=0)reload()}
function stab(){
if(CustomBattle.active&&!CustomBattle.canShoot)return;
const now=performance.now()/1000;if(now<nextShot||knifeCD>0)return;nextShot=now+.42;const kn=curKn();VM.stab(knR(),kn);slashFx(VM.cmv(),knR(),kn);knSnd(kn,"swing");let kh=0;
const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
for(const e of E.slice()){const dx=e.g.position.x-P.x,dz=e.g.position.z-P.z,dd=Math.hypot(dx,dz)||1;if(dd<2.8*(1+.04*kn.r)&&(dx*fx+dz*fz)/dd>.4){kh=1;hurtE(e,KNIFE_D*PU.kn*KNM[kn.r],false,{x:e.g.position.x,y:e.g.position.y+1.2,z:e.g.position.z})}}
if(kh)setTimeout(()=>knSnd(kn,"hit"),70);
if(PT.on)Party.stab()}
function throwKnife(charge){
if(CustomBattle.active)return;
const now=performance.now()/1000;if(now<nextShot||knifeCD>0)return;nextShot=now+.55;knifeCD=.5;
const pwr=clamp(charge/1.1,0,1),kR=knR();VM.throwAnim(kR);slashFx(VM.cmv(),kR,curKn());knSnd(curKn(),"throw");
// fly exactly where the crosshair points, like a bullet: aim ray -> target point -> straight line from the hand
cam.updateMatrixWorld();rc.setFromCamera({x:Aim.x,y:Aim.y},cam);
const ro=rc.ray.origin.clone(),rd=rc.ray.direction.clone().normalize(),wd=rayWorld(ro.x,ro.y,ro.z,rd.x,rd.y,rd.z,90),tp=ro.clone().addScaledVector(rd,Math.min(wd,90));
const rgt=new T.Vector3().crossVectors(rd,new T.Vector3(0,1,0)).normalize(),st0=ro.clone().addScaledVector(rd,.5).addScaledVector(rgt,.14).add(new T.Vector3(0,-.1,0));
const dir=tp.clone().sub(st0);if(dir.lengthSq()<.04)dir.copy(rd);dir.normalize();
const speed=60+pwr*30,knCol=curKn().c||0xdddddd;
const knd=curKn(),mesh=buildKnife(knd).grp;mesh.scale.setScalar(1.3+.08*kR);
mesh.position.copy(st0);
mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),dir);let life=1.6,pierced=0,hitIds=new Set();const stop=()=>{sc.remove(mesh);disposeGeo(mesh)};
const tick=()=>{const dt=.016;life-=dt;mesh.rotateX(dt*(9+kR*4));if(kR>=1)Fx.burst(mesh.position,kR===5?(Math.random()<.5?0xf0abfc:0x67e8f9):RCN[kR],kR>=3?3:1,.3,.04+.01*kR,.3,2);
for(let sub=0;sub<3;sub++){const step=speed*dt/3,px=mesh.position.x,py=mesh.position.y,pz=mesh.position.z;
if(rayWorld(px,py,pz,dir.x,dir.y,dir.z,step+.1)<step+.05||py<.15){Fx.burst(mesh.position,0xffe9a0,6,3,.05,1,12);knSnd(knd,"stick");stop();return}
mesh.position.x+=dir.x*step;mesh.position.y+=dir.y*step;mesh.position.z+=dir.z*step;
for(const e of E.slice()){if(e.hp<=0||hitIds.has(e))continue;const sc_=e.g.scale.x||1,hr=(e.rad?e.rad*.85:.42*sc_)+.14,hd_=Math.hypot(e.g.position.x-mesh.position.x,e.g.position.z-mesh.position.z),vy_=mesh.position.y-e.g.position.y;
if(hd_<hr&&vy_>.1&&vy_<2.15*sc_){hitIds.add(e);pierced++;hurtE(e,Math.round(KNIFE_D*PU.kn*KNM[knd.r]*(1.15+pwr*.9)),false,{x:mesh.position.x,y:mesh.position.y,z:mesh.position.z});qAdd("knife",1);knSnd(knd,"hit");
Fx.burst(mesh.position,0xffe9a0,8,4,.06,1,14);if(pierced>=3){stop();return}}}}
if(life<=0){stop();return}
requestAnimationFrame(tick)};setTimeout(()=>{sc.add(mesh);requestAnimationFrame(tick)},70+kR*22);flash(pwr>.75?"Power throw!":"Knife throw",600)}
function clearGrenPrev(){
if(gPrevMesh){sc.remove(gPrevMesh);gPrevMesh.geometry.dispose();gPrevMesh.material.dispose();gPrevMesh=null}
if(gPrevRing){sc.remove(gPrevRing);gPrevRing.geometry.dispose();gPrevRing.material.dispose();gPrevRing=null}}
function simulateGrenadeLand(){
const dir=new T.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(-P.pitch)+.35,-Math.cos(P.yaw)*Math.cos(P.pitch)).normalize();
let x=P.x+dir.x*.6,y=P.y+1.4+dir.y*.4,z=P.z+dir.z*.6,vx=dir.x*18,vy=dir.y*12+4,vz=dir.z*18,life=2.4;
for(let i=0;i<160;i++){const dt=.016;life-=dt;vy-=22*dt;x+=vx*dt;y+=vy*dt;z+=vz*dt;if(y<.2||life<=0)return{x,y:Math.max(.15,y),z}}
return{x,y:Math.max(.15,y),z}}
function updateGrenPrev(){
if(!grenAim||!isGame()||P.dead>0||P.fz>0||P.grenCD>0||mode==="parkour"||mode==="range"){clearGrenPrev();return}
const land=simulateGrenadeLand();
if(!gPrevMesh){gPrevMesh=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:.85}));sc.add(gPrevMesh)}
gPrevMesh.position.set(land.x,land.y+.22,land.z);
if(!gPrevRing){gPrevRing=new T.Mesh(new T.RingGeometry(7.2,7.55,48),new T.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));gPrevRing.rotation.x=-Math.PI/2;sc.add(gPrevRing)}
gPrevRing.position.set(land.x,.08,land.z);gPrevRing.material.opacity=.35+.2*Math.sin(performance.now()/180)}
function throwGrenade(){
if(!isGame()||P.dead>0||P.fz>0||P.grenCD>0||mode==="parkour"||mode==="range")return;
P.grenCD=4.5;qAdd("gren",1);snd("sh",.9,.55);flash("Grenade!",700);clearGrenPrev();grenAim=false;
const dir=new T.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(-P.pitch)+.35,-Math.cos(P.yaw)*Math.cos(P.pitch)).normalize();
const g=new T.Mesh(new T.SphereGeometry(.18,10,8),new T.MeshBasicMaterial({color:0x3a3a3a}));
g.position.set(P.x+dir.x*.6,P.y+1.4+dir.y*.4,P.z+dir.z*.6);sc.add(g);
const vel={x:dir.x*18,y:dir.y*12+4,z:dir.z*18};let life=2.4,boom=false;
const tick=()=>{if(boom)return;const dt=.016;life-=dt;vel.y-=22*dt;g.position.x+=vel.x*dt;g.position.y+=vel.y*dt;g.position.z+=vel.z*dt;
if(g.position.y<.2||life<=0){boom=true;const px=g.position.x,py=Math.max(.3,g.position.y),pz=g.position.z;sc.remove(g);g.geometry.dispose();g.material.dispose();
Fx.burst({x:px,y:py,z:pz},0xff6a2a,28,9,.12,3,20);snd("boom",1);flashScreen("#ff6a2a");
for(const e of E.slice()){const d=Math.hypot(e.g.position.x-px,e.g.position.z-pz);if(d<7.5)hurtE(e,Math.round(55*(1-d/7.5)),false,{x:px,y:py,z:pz})}
return}requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function endEmote(){if(emo){sc.remove(emo);disposeGeo(emo);emo=null}P.em=null}
function emote(i){
const id=eq().e[i],it=id&&S.own[id]&&I(id);if(!it||!isGame()||P.fz>0||P.dead>0||P.em||rL>0)return;
const ps=I(eq().p);emo=mkHuman({body:PT.on&&PT.team?PT.me.col:ps.c,trim:ps.t,style:ps.sty});sc.add(emo);P.em={t:0,k:it.k};scoped=false;tf("dance");snd("emote");qAdd("emote",1)}
// ---------- parkour: your own runner model, the goofy Naruto run, and the record celebration ----------
let pkCamY=null,pkBody=null,pkPref=3,pkView=3,pkFw=0,pkCelOn=0,pkTip=0;
function pkBodyDrop(){if(pkBody){sc.remove(pkBody);disposeGeo(pkBody);pkBody=null}const w=document.getElementById("pkwin");if(w)w.remove()}
function pkBodyMake(){
pkBodyDrop();pkCamY=null;pkView=pkKnifeOn()?1:pkPref;pkCelOn=0;pkFw=0;const ps=I(eq().p)||PS[0];
pkBody=mkHuman({body:ps.c,trim:ps.t,style:ps.sty});pkBody.userData.nar=true;
pkBody.traverse(o=>{if(o.isMesh)o.castShadow=true});sc.add(pkBody);
if(!pkTip){pkTip=1;toast("Parkour: press V to switch between third and first person")}}
function pkBodyFrame(dt){
if(!pkBody)return;const u=pkBody.userData,st=PK.st,c=st.celeb||0;
pkBody.visible=pkView===3&&P.dead<=0&&!P.em;pkBody.position.set(P.x,P.y,P.z);
if(c>0){
if(!pkCelOn){pkCelOn=1;pkView=3;u.torso.position.set(0,1.26,0);u.head.position.set(0,1.9,0);u.arms[0].position.set(-.36,1.56,0);u.arms[1].position.set(.36,1.56,0);pkBody.rotation.set(0,P.yaw,0)}
const el=3.2-c,dy=danceHuman(pkBody,el,el<1.8?"flip":"lev",P.yaw);pkBody.position.y=P.y+dy;pkBody.visible=true;
pkFw-=dt;if(pkFw<=0){pkFw=.2;const cols=[0xffd24a,0xff5a6a,0x5ad1ff,0x7dff9a,0xe879f9,0xffffff],a=Math.random()*6.283,r=3+Math.random()*4;
Fx.burst({x:P.x+Math.cos(a)*r,y:P.y+4+Math.random()*5,z:P.z+Math.sin(a)*r},cols[(Math.random()*cols.length)|0],30,9,.14,4,12);if(Math.random()<.5)snd("pick",.3)}
st.celeb=c-dt;if(st.celeb<=0){st.celeb=0;endGame(true)}
return}
const spd=Math.hypot(P.vx,P.vz),air=!P.gr&&!P.mantle,tgt=spd>.6?Math.atan2(P.vx,P.vz):P.yaw+Math.PI;
pkBody.rotation.y=turnTo(pkBody.rotation.y,tgt,dt*12);
narutoPose(pkBody,dt,clamp(spd/6.4,0,1.4),air)}
function pkVictory(prev,t){
const st=PK.st;st.celeb=3.2;pkFw=0;prev=+prev;const first=!isFinite(prev)||prev<=0;
const old=document.getElementById("pkwin");if(old)old.remove();
const w=document.createElement("div");w.id="pkwin";const cc=["#ffd24a","#ff5a6a","#5ad1ff","#7dff9a","#e879f9","#ffffff"];let conf="";
for(let i=0;i<70;i++)conf+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+cc[i%cc.length]+';width:'+(6+(Math.random()*8|0))+'px;animation-duration:'+(1.8+Math.random()*1.6).toFixed(2)+'s;animation-delay:'+(Math.random()*1.1).toFixed(2)+'s"></i>';
w.innerHTML=conf+'<div class="t"><small>'+(first?"Course cleared":"Personal record")+'</small><b>'+(first?"First clear!":"New best!")+'</b><span>'+t.toFixed(1)+'s'+(first?"":"  ·  "+(prev-t).toFixed(1)+'s faster')+'</span></div>';
document.body.appendChild(w);setTimeout(()=>{if(w.isConnected)w.remove()},3700);
snd("win");setTimeout(()=>snd("win"),450);setTimeout(()=>snd("pick"),900);try{flashScreen("rgba(255,214,90,.9)")}catch(e){}}
// ---------- third person in the offline modes: your own soldier holding your gun, an over-the-shoulder camera, V to switch, B swaps the shoulder ----------
// shots still go from the camera through the crosshair (the body is not in any shot list); tracers and the flash start at the body's muzzle.
// A lens scope (picture-in-picture glass) drops back to first person while you aim; emotes, death and parkour keep their own cameras.
const TP=(()=>{
let body=null,key="",dist=null,side=1,sideS=1,cy=null,fl=0,tip=0;
const kOf=g=>(g.id||g.n)+"|"+eq().p+"|"+eq().s;
const ok=()=>(state==="play"||state==="pause")&&!PT.on&&!CustomBattle.active&&mode!=="parkour";
const want=()=>!!S.tp&&ok();
const on=()=>want()&&!!body&&P.dead<=0&&!P.em&&!(scoped&&slot===0&&scopeOf(cg()).pip);
function drop(){if(body){sc.remove(body);disposeGeo(body);body=null;key=""}}
function make(g){drop();const ps=I(eq().p)||PS[0];
body=mkHuman({body:ps.c,trim:ps.t,style:ps.sty,gun:g,gunSkin:I(eq().s)||SK[0]});
body.traverse(o=>{if(o.isMesh&&o.material.visible!==false)o.castShadow=true});
sc.add(body);key=kOf(g);dist=null;cy=null}
function frame(dt){
if(!want()){if(body)drop();return}
const g=cg();if(!body||key!==kOf(g))make(g);
const u=body.userData,spd=Math.hypot(P.vx,P.vz);
body.visible=on()&&(dist==null||dist>.8);
body.position.set(P.x,P.y,P.z);body.rotation.y=P.yaw+Math.PI; // faces the aim; the legs follow the direction of travel
u.cr=Math.max(P.crouch,P.slide>0?1:0);u.sh=slot===0&&!(spd>7.5&&!firing)?1:0;u.rl=A.rl>0?1-A.rl/(g.rl*PU.rl):0;
if(u.gun)u.gun.grp.visible=slot===0;
poseHuman(body,dt,clamp(spd/7,0,1.2),clamp(1+2*P.pitch,-1.5,3.5),!P.gr&&!P.mantle);
if(fl>0){fl-=dt;if(fl<=0)setMuzzle(body,false)}}
function cam_(dt,lockd){
P.eye+=((1.7-.62*P.crouch)-P.eye)*Math.min(1,dt*10);P.stepOff*=Math.exp(-dt*13);
cy=cy==null||Math.abs(P.y-cy)>6?P.y:cy+(P.y-cy)*Math.min(1,dt*14);
const cp=Math.cos(P.pitch),bx=Math.sin(P.yaw)*cp,by=-Math.sin(P.pitch),bz=Math.cos(P.yaw)*cp,rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
sideS+=(side-sideS)*Math.min(1,dt*8);
const hy=cy+P.eye+Tune.n("tp.up",.2,-.3,.8),sd=sideS<0?-1:1,sx=rx*sd,sz=rz*sd;
// shoulder offset shrinks against a wall on that side, then the camera backs off along the aim line until a wall (three rays: centre, above, below)
let so=Math.abs(sideS)*Tune.n("tp.side",ads_()?.85:.75,0,1.4);try{so=Math.min(so,Math.max(0,rayWorld(P.x,hy,P.z,sx,0,sz,so+.4)-.28))}catch(e){}
const px=P.x+sx*so,pz=P.z+sz*so,ads=scoped&&slot===0,w=ads?Tune.n("tp.adsDist",2,.8,3):Tune.n("tp.dist",3.1,1.5,5);
let d=w;for(const oy of[0,.22,-.22]){try{d=Math.min(d,rayWorld(px,hy+oy,pz,bx,by+.0001,bz,w+.35)-.3)}catch(e){}}
d=Math.max(.35,d);dist=dist==null||d<dist?d:dist+(d-dist)*Math.min(1,dt*(ads?10:4));
P.ldS=P.ldS||{x:0,v:0};P.rkS=P.rkS||{x:0,v:0};if(P.landDip>0){P.ldS.v+=P.landDip*Tune.n("cam.land",13,0,40);P.landDip=0}
const dip=clamp(spring(P.ldS,0,130,11,dt),-.08,.45)*.5,rk=spring(P.rkS,P.rk,Tune.n("cam.recoilK",320,60,900),24,dt);
const amp=P.gr&&!lockd&&!P.mantle?Math.min(1,spd_()/8):0;P.bobA+=(amp-P.bobA)*Math.min(1,dt*8);const o=P.bobPh;P.bobPh+=dt*spd_()*1.15*(P.gr?1:0);
if(P.bobA>.3&&Math.floor(P.bobPh/Math.PI)!==Math.floor(o/Math.PI))snd("step",(.5+P.bobA*.3)*(1-.65*P.crouch));
cam.position.set(px+bx*dist,Math.max(cy+.3,hy+by*dist)-dip,pz+bz*dist);
cam.rotation.set(P.pitch+rk*.6,P.yaw,0,"YXZ")}
const spd_=()=>Math.hypot(P.vx,P.vz),ads_=()=>scoped&&slot===0;
return{ok,on,drop,frame,cam:cam_,
toggle(){S.tp=S.tp?0:1;sv();if(!S.tp)drop();flash(S.tp?"Third person view":"First person view",800);snd("ui",.6);if(S.tp&&!tip){tip=1;toast("Third person: V switches back, B swaps the shoulder")}},
swap(){side=-side;snd("ui",.4)},
kick(k){if(!body)return;body.userData.kick=Math.min(1.5,body.userData.kick+k);setMuzzle(body,true);fl=.05},
mz(){const gn=body&&body.userData.gun;if(!gn)return null;body.updateMatrixWorld(true);return gn.mf.getWorldPosition(new T.Vector3())},
head(){body.userData.head.updateWorldMatrix(true,false);return body.userData.head.getWorldPosition(new T.Vector3())}}})();
// ---------- HUD extras: floating damage numbers, a reload ring on the crosshair, red ammo when the magazine is low, a kill feed and
// kill-streak banner in solo play. Low and Potato (body.lite) and reduced motion show them without the motion.
const HX=(()=>{
const pool=[],v=new T.Vector3();let pi=0,ring=null,amE=null,ks=0,ban=null,banT=0;
// shotgun pellets and fast bursts on one enemy add into one number instead of a cloud of small ones
function num(e,p,d,head){
if(!p||!(d>0))return;const now=performance.now(),j=e&&e._dn;
if(j&&now-j.t<140&&j.el.isConnected){j.sum+=d;j.t=now;j.head=j.head||head;j.el.textContent=Math.round(j.sum);if(j.head)j.el.classList.add("hs");return}
v.set(p.x,p.y,p.z).project(cam);if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1)return;
pi=(pi+1)%10;let el=pool[pi];if(!el){el=document.createElement("b");document.body.appendChild(el);pool[pi]=el}
el.className="dn"+(head?" hs":"");el.style.left=((v.x+1)*50).toFixed(2)+"%";el.style.top=((1-v.y)*50).toFixed(2)+"%";
el.style.setProperty("--dx",((rnd()-.5)*44).toFixed(0)+"px");el.textContent=Math.round(d);void el.offsetWidth;el.classList.add("go");
if(e)e._dn={el,sum:d,t:now,head}}
const SOLO={3:"Killing spree",5:"Rampage",8:"Unstoppable",12:"Godlike",20:"Legendary"},HORDE={10:"Monster hunter",25:"Slayer",50:"Exterminator",100:"Legend of the horde"};
function banner(t,sub){if(!ban){ban=document.createElement("div");ban.id="stb";document.body.appendChild(ban)}
ban.innerHTML=esc(t)+(sub?"<small>"+esc(sub)+"</small>":"");ban.classList.remove("on");void ban.offsetWidth;ban.classList.add("on");clearTimeout(banT);banT=setTimeout(()=>ban.classList.remove("on"),1900)}
function kill(e,head){
if(PT.on)return;ks++;
if(e.t==="bot"||e.boss||e.elite||e.champion)killFeed(S.name||"You",e.name||(e.t==="bot"?(DF[diff]&&DF[diff].n)||"Bot":"Monster"),slot===1?curKn().n:cg().n,head,true);
const t=(mode==="waves"?HORDE:SOLO)[ks];if(t)banner(t,ks+" kills without dying")}
function frame(dt,g){
if(P.dead>0)ks=0;
if(!ring){const c=document.getElementById("cross");if(c){c.insertAdjacentHTML("beforeend",'<svg id="rlr" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/></svg>');ring=document.getElementById("rlr")}}
const rl=A.rl>0&&slot===0;if(ring){ring.classList.toggle("on",rl);if(rl)ring.style.setProperty("--p",clamp(1-A.rl/(g.rl*PU.rl),0,1).toFixed(3))}
amE=amE||document.getElementById("ammo");if(amE)amE.classList.toggle("low",slot===0&&A.rl<=0&&A.mag<=Math.max(1,Math.ceil(g.m*.25)))}
return{num,kill,frame,banner,get streak(){return ks}}})();
// crosshair colour: red while the aim point is over an enemy, plus a little aim friction
function aimProbe(){
aimTgt=null;
if(!isGame()||P.dead>0||P.em||slot!==0){Aim.setHot(false);return}
cam.updateMatrixWorld();rc.setFromCamera({x:Aim.x,y:Aim.y},cam);
const o=rc.ray.origin,d=rc.ray.direction,tg=gatherTargets();tg.length=tg.length-rT.length;
const h=tg.length?rc.intersectObjects(tg,false)[0]:null,on=!!h&&h.distance<rayWorld(o.x,o.y,o.z,d.x,d.y,d.z,90);Aim.setHot(on);
if(on&&isTouch())for(const e of E)if(e.hp>0&&e.g.userData.hit.includes(h.object)){aimTgt=e;break}}
// touch aim assist (phones only, never against other players): while the crosshair is on an enemy it drifts with that enemy a little,
// so a moving target does not slide off a thumb-steered aim. Optional auto-fire shoots while the crosshair stays on one.
let aimTgt=null;const isTouch=()=>document.body.classList.contains("touch");
function aimAssist(dt,g){const e=aimTgt;if(!e||e.hp<=0||PT.on||!isTouch()||(S.opt&&S.opt.assist===false))return;
const p=e.g.position,dx=cam.position.x-p.x,dz=cam.position.z-p.z,hd=Math.hypot(dx,dz)||1,want=Math.atan2(dx,dz);let er=want-P.yaw;er=Math.atan2(Math.sin(er),Math.cos(er));
const pw=Math.atan2(p.y+1.1-cam.position.y,hd),ep=pw-P.pitch,k=1-Math.exp(-dt*Tune.n("touch.assist",2.2,0,8));
if(Math.abs(er)<.15)P.yaw+=er*k;if(Math.abs(ep)<.15)P.pitch=clamp(P.pitch+ep*k*.6,-1.5,1.5);
if(S.opt&&S.opt.autoFire&&slot===0&&!firing&&A.mag>0)fire()}

// ---------- per-frame game update ----------
function update(dt){
if(CustomBattle.active){CustomBattle.update(dt);return}
if(mzT>0){mzT-=dt;mzL.intensity=Math.max(0,mzT/.07)*2.6*PLK(16,2);cam.getWorldDirection(fwd);const tm=TP.on()&&TP.mz();if(tm)mzL.position.copy(tm);else mzL.position.copy(cam.position).addScaledVector(fwd,1.6)}else if(mzL.intensity)mzL.intensity=0;
Aim.frame(dt,scoped);
const g=cg(),lock=P.fz>0||P.dead>0||rL>0||(mode==="parkour"&&PK.st.celeb>0),K_=K;
Pad.frame(dt);
let f=lock?0:(K_.KeyW||K_.ArrowUp?1:0)-(K_.KeyS||K_.ArrowDown?1:0),s=lock?0:(K_.KeyD?1:0)-(K_.KeyA?1:0),sprint=!!(K_.ShiftLeft||K_.ShiftRight);if(!lock&&AN.on){f=-AN.y;s=AN.x} // analog stick: speed follows how far it is pushed
if(!menuOpen){if(K_.ArrowLeft||K_.KeyQ)P.yaw+=dt*2;if(K_.ArrowRight||K_.KeyE)P.yaw-=dt*2}
if(f||s)tf("move");
if(P.em&&(f||s||firing||K_.Space)){endEmote()}
if(slot!==0||P.dead>0||P.em||menuOpen)rmb=false;
scoped=rmb&&!lock&&A.rl<=0&&!VM.inspecting;
if(lock)P.jb=0;
if(P.em){P.em.t+=dt;P.vx*=.85;P.vz*=.85;if(P.em.t>3.5)endEmote()}
if(menuOpen){P.vx*=.8;P.vz*=.8}
const stand=mode==="range";if(stand){P.vx=P.vz=0}
const lensUp=scoped&&scopeOf(g).pip; // Shift holds your breath under a lens scope instead of sprinting
movePlayer(dt,{f:menuOpen||stand?0:f,s:menuOpen||stand?0:s,sprint:sprint&&!stand&&!lensUp,jump:!stand&&!lock&&!menuOpen&&!!K_.Space,crouch:!stand&&!menuOpen&&!lock&&!!(K_.AltLeft||K_.AltRight||K_.ControlLeft||K_.ControlRight)});
updateCamera(dt,{f,s});updateFov(dt,g,{f,sprint});TP.frame(dt);Scope.sway(dt,g,scoped,sprint);
if(emo&&P.em){const dy=danceHuman(emo,P.em.t,P.em.k,P.yaw+Math.PI);emo.position.set(P.x,P.y+dy,P.z)}
VM.set(g,I(eq().s),curKn(),I(eq().p));
cam.getWorldDirection(fwd);const dw=rayWorld(cam.position.x,cam.position.y,cam.position.z,fwd.x,fwd.y,fwd.z,1);
VM.frame(dt,{dyaw:angDiff(lastYaw,P.yaw),dpitch:P.pitch-lastPitch,speed:Math.hypot(P.vx,P.vz),vy:P.vy,gr:P.gr,scoped,reload:A.rl>0?1-A.rl/g.rl:0,slot,hide:!!P.em||P.dead>0||(mode==="parkour"&&(!pkKnifeOn()||pkView===3))||TP.on(),pull:dw<.95?1-dw/.95:0,knifeCD,charging:knifeCharging,charge:knifeCharge});
if(knifeCD>0)knifeCD=Math.max(0,knifeCD-dt);
lastYaw=P.yaw;lastPitch=P.pitch;
Scope.frame(g,scoped,cam.fov);
if(firing&&g.a&&slot===0)fire();
if(knifeCharging&&slot===1&&isGame()&&P.dead<=0){knifeCharge=Math.min(1.2,knifeCharge+dt);if(knifeCharge>.2&&(fr&3)===0)VM.kick(.08)}
else if(!firing)knifeCharging=false;
if(grenAim)updateGrenPrev();else if(gPrevMesh)clearGrenPrev();
if(A.rl>0){A.rl-=dt;if(A.rl<=0)A.mag=g.m}
P.rk*=Math.exp(-dt*10);P.sp*=Math.exp(-dt*8);
Aim.spread(clamp(curSpread(g)/Math.tan(cam.fov*.00872665)*innerHeight*.5,3,64));
probeT-=dt;if(probeT<=0){probeT=.05;aimProbe()}aimAssist(dt,g);
if(P.prot>0)P.prot-=dt;if(P.rush>0)P.rush-=dt;if(P.grenCD>0)P.grenCD-=dt;
// entities
if(!menuOpen){for(const e of E.slice())e.t==="bot"?botStep(e,dt):monStep(e,dt)}
for(let i=dying.length-1;i>=0;i--)if(deathStep(dying[i],dt)){dropModel(dying[i].g);dying.splice(i,1)}
for(const m of rT){const u=m.userData;if(u.hf>0){u.hf-=dt;m.rotation.x=Math.sin(u.hf*40)*u.hf*.8}else m.rotation.x=0;if(u.mv)rangeMove(m,performance.now()/1000)}
puStep(dt);if(!menuOpen)projStep(dt);Bul.step(dt);
// mode flow
if(PT.on)Party.frame(dt);
if(!PT.on||PT.coop){
if(mode==="parkour"){PK.frame(dt);pkBodyFrame(dt)}
if(mode==="waves"){bossHud();corrFrame(dt);Phase.frame(dt);LV.frame(dt);
if(!menuOpen){
if(wq>0){wt-=dt;if(wt<=0&&E.length<16+(wmod==="swarm"?6:0)+(coopN()-1)*3){wt=wmod==="swarm"?.4:wmod==="ambush"?.25:.6;wq--;spawnMon()}}
else if(!E.length&&!wn&&P.dead<=0){const b=Math.round(2*wave*PU.coin*(corrupted?1.5:1)*LV.coinMul()),lvC=LV.on()&&LV.cur()&&LV.cur().corrupt;LV.endWave();S.coins+=b;addBP(Math.round((15+Math.floor(wave*2.6)+(corrupted?20:0))*LV.bpMul()));sv();qAdd("wave",wave,1);qAdd("wc",1);if(PT.coop)PT.cw=wave;
if(corrupted&&(!lvC||wave%5===0)){flash("CORRUPTED WAVE CLEARED: pick 3 power-ups",2800);snd("win");wn=1e9;setTimeout(()=>offerCorruptedPU(3),600)}
else if(Phase.on&&Phase.clear(b)){}
else{flash("Wave "+wave+" cleared  +"+b+" coins"+(PT.coop?"  \u00b7  waiting for the squad":""),2500);snd("clear");setTimeout(()=>snd("chord",.6),180);wn=PT.coop?1e9:1.6}
// restore normal lighting after corrupted
try{if(!lvC||wave%5===0)corrTgt=0}catch(e){}}
if(wn>0&&wn<1e8){const w0=wn;wn-=dt;if(w0>1.1&&wn<=1.1)snd((wave+1)%5===0?"lowbeat":"riser",.55);if(wn<=0){wn=0;nextWave()}} // a riser before each wave, a quiet beat before a boss
if(PU.regen&&P.dead<=0&&P.hp<P.max)P.hp=Math.min(P.max,P.hp+PU.regen*dt);
if(P.dead<=0&&P.fz<=0){P.sinceHit+=dt;if(P.sinceHit>=10&&P.hp<P.max){P.hp=Math.min(P.max,P.hp+10*dt)}}}
}
if(mode==="gg"){
if(P.dead>0){P.dead-=dt;if(P.dead<=0)respawnPlayer()}
else if(!E.length&&P.fz<=0){bt-=dt;if(bt<=0)spawnBot()}}}
if(P.fz>0){P.fz-=dt;const c=Math.ceil(P.fz);if(P.fz>0&&c!==lastCount){lastCount=c;flash(String(c),500);snd("tick")}if(P.fz<=0){lastCount=0;flash("Go",600);snd("go")}}
else if(rL>0){rL-=dt;if(rL<=0&&state==="play")newRound()}

Radar.frame(dt);hudFrame(dt)}
const fwd=new T.Vector3();

// ---------- HUD ----------
// low health (under 30 hp): a heartbeat that quickens, muffled sound, drained colour and a pulsing red edge, all scaled by how low you are
const LH=(()=>{let k=0,hbT=0,el=null,on=false;
function frame(dt){const t=state==="play"&&!menuOpen&&P.dead<=0&&P.hp>0&&P.hp<30?1-P.hp/30:0;k+=(t-k)*Math.min(1,dt*3);
if(k<.01&&!on)return;
if(!el){el=document.createElement("div");el.id="lhv";el.setAttribute("aria-hidden","true");document.body.appendChild(el)}
const nowOn=k>.01;if(nowOn!==on){on=nowOn;document.body.classList.toggle("lowhp",on)}
el.style.setProperty("--lh",on?k.toFixed(3):"0");try{Post.lowHp(k)}catch(e){}muffle(k*.85);
if(t>0){hbT-=dt;if(hbT<=0){hbT=1.05-.45*t;snd("hb",.45+.5*t)}}else{hbT=0;if(!on){try{Post.lowHp(0)}catch(e){}muffle(0)}}}
return{frame}})();
function hudFrame(dt){LH.frame(dt);
txt("hpn",String(Math.ceil(P.hp)));el("hp").style.width=Math.max(0,P.hp/P.max*100)+"%";el("hpw").classList.toggle("low",P.hp<30);if(P.hp<30&&P.hp>0)lowHp();
txt("coins",String(Math.round(S.coins)));hide("ammo",mode==="parkour");hide("rgun",mode!=="range");
const showW=mode==="waves";
hide("xpbar",!showW);hide("boosts",!showW);
if(showW){
el("xpfill").style.width=Math.min(100,xp/xpNeed*100)+"%";
txt("xptxt","XP "+Math.floor(xp)+" / "+xpNeed+"  ·  Lv "+xpLevel);
const bits=[];
if(PU.dmg!==1)bits.push(`<b>DMG</b> ×${PU.dmg.toFixed(2)}`);
if(PU.rate!==1)bits.push(`<b>RATE</b> ×${PU.rate.toFixed(2)}`);
if(PU.rl!==1)bits.push(`<b>RLD</b> ×${(1/PU.rl).toFixed(2)}`);
if(PU.spd!==1)bits.push(`<b>SPD</b> ×${PU.spd.toFixed(2)}`);
if(PU.hs!==1)bits.push(`<b>HS</b> ×${PU.hs.toFixed(2)}`);
if(PU.arm!==1)bits.push(`<b>ARM</b> −${Math.round((1-PU.arm)*100)}%`);
if(PU.regen)bits.push(`<b>REGEN</b> +${PU.regen}/s`);
if(PU.kh)bits.push(`<b>LIFESTEAL</b> +${PU.kh}`);
if(PU.kn!==1)bits.push(`<b>KNIFE</b> ×${PU.kn.toFixed(2)}`);
if(PU.coin!==1)bits.push(`<b>COIN</b> ×${PU.coin.toFixed(2)}`);
if(PU.sw)bits.push(`<b>WAVE HEAL</b> +${PU.sw}`);
if(PU.exe!==1)bits.push(`<b>EXE</b> ×${PU.exe.toFixed(2)}`);
if(PU.crit)bits.push(`<b>CRIT</b> ${Math.round(PU.crit*100)}%`);
if(PU.ls!==1)bits.push(`<b>LAST STAND</b> ×${PU.ls.toFixed(2)}`);
el("boosts").innerHTML=bits.length?bits.join("<br>"):"<span style=\"opacity:.7\">No boosts yet. Fill the XP bar.</span>";
}
const g=cg();HX.frame(dt,g);txt("am",A.rl>0?"Reloading":slot?"Knife":String(A.mag));txt("amx",slot?"":"/ "+g.m);txt("gn",slot?curKn().n:g.n);
// waves regeneration indicator
if(mode==="waves"&&P.dead<=0&&P.hp<P.max&&P.fz<=0){const left=Math.ceil(10-P.sinceHit);
if(P.sinceHit>=10){txt("regen","Regenerating  +10 HP/s");hide("regen",false);el("regen").classList.add("on")}
else if(P.sinceHit>=3){txt("regen","Regen in "+left+"s");hide("regen",false);el("regen").classList.remove("on")}
else hide("regen",true)}else hide("regen",true);
// respawn text
hide("respawn",!(P.dead>0&&(mode==="gg"||PT.on))||Death.active);
if(P.dead>0&&(mode==="gg"||PT.on))txt("respawn",PT.coop?"Down. You return when the squad clears the wave":"Respawning in "+Math.max(1,Math.ceil(P.dead)));
hide("sbd",!scoreOpen);
hudT-=dt;if(hudT>0)return;hudT=.12;
let top="",sub="",kc=null,rows=[];
if(PT.on){const h=Party.hud();kc=h.kc;rows=h.rows;top=h.top;sub=h.sub}
else if(mode==="parkour"){const h=PK.hud();top=h.top;sub=h.sub;rows=h.rows}
else if(mode==="waves"){top="Wave "+wave;sub=(E.length+wq)+" monsters left";rows=[[S.name,kills]]}
else if(mode==="range"){top="Accuracy Challenge";{const u=RANGE_SHOTS-Math.max(0,rs);sub="Score "+myS+"  ·  "+Math.max(0,rs)+" of "+RANGE_SHOTS+" shots left  ·  "+(u?Math.round(rHit/u*100):100)+"% accuracy"+(rCur>=2?"  ·  streak "+rCur:"")}rows=[[S.name,myS]];txt("rgn",cg().n+"  ·  "+R[cg().r]+"  ·  "+(rangeG+1)+"/"+G.length);el("rgn").style.color=RC[cg().r]}
else{top=mode==="gg"?"Gun Game":mode==="tut"?"Tutorial":"Duel";sub=mode==="gg"?"":"First to "+GOAL;rows=[[S.name,myS],[DF[diff].n,opS]];if(mode==="gg")kc=[myS+"",GOAL_GG+"",DF[diff].n+" "+opS]}
txt("top",top);txt("sub",sub);hide("sub",!sub);
hide("kc",!kc);if(kc){txt("kcn",kc[0]);txt("kct",kc[1]?"/ "+kc[1]:"");txt("kcs",kc[2]||"");hide("kcs",!kc[2])}
rows.sort((a,b)=>b[1]-a[1]);
el("lbd").innerHTML="<b>Top</b>"+rows.slice(0,5).map((r,i)=>`<div class="${r[2]||""}"><span>${i+1}</span>${esc(r[0])}<em>${r[1]}</em></div>`).join("");
if(mode==="tut"){const TS=[["move","Move","W A S D to move, Shift to sprint, mouse to look around"],["jump","Jump","Space to jump, Space again in the air to double jump. Run into a ledge to climb it"],["shoot","Shoot","Left click to fire, right click to aim"],["reload","Reload","Press R to reload. In the tutorial it works even with a full magazine"],["knife","Knife","Press 2 for the knife, 1 to go back to your gun"],["dance","Dance","Press 3 to dance"],["kill","Win the match","Defeat the easy bot 3 times. Keep moving, it is slow to react"]],ns=TS.find(x=>!tutF[x[0]]);
hide("tut",false);const th=ns?`<small>Step ${TS.indexOf(ns)+1} of ${TS.length}</small><b>${ns[1]}</b><span>${ns[2]}</span>`:`<small>All steps done</small><b>Keep going</b><span>Finish the match to complete the tutorial</span>`,te=el("tut");if(te._k!==th){te._k=th;te.innerHTML=th}}else hide("tut",true);
if(scoreOpen)renderScoreboard()}


