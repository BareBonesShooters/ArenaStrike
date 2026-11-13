"use strict";
// ---------- flying bullets ----------
// Every shot is a bullet that is stepped each frame with a ray over the stretch it covers, so far shots take time to land and drop a
// little. Each gun class has its own speed and drop. Short guns (pistols, SMGs, shotguns) hit instantly inside 25 m and fly beyond;
// rifles are fast with slight drop; snipers take about 0.3 s to cross 70 m and drop about 25 cm on the way; railguns are instant and
// pierce; plasma throws slow, visible bolts. A bullet starts at the camera (so it goes where the crosshair points); its streak starts at the
// gun muzzle and slides onto the true path over the first ten metres. Thin low cover (fences, crates, low walls) can be shot through at
// reduced damage. A grazing hit on a hard surface sparks off as a ricochet. Damage falls off with distance travelled.
// Bots fire the same bullets and lead a moving target by difficulty, so you can dodge a long shot by moving.
const Bul=(()=>{
const CL={
short:{v:330,g:4,inst:25,max:90,fo:35},
rifle:{v:420,g:5,inst:0,max:110,fo:75},
sniper:{v:240,g:5.9,inst:0,max:160,fo:0},
rail:{v:0,g:0,inst:160,max:160,fo:0,pierce:3,thru:1.2},
beam:{v:0,g:0,inst:110,max:110,fo:0},
plasma:{v:75,g:0,inst:0,max:80,fo:45,bolt:1}};
const cls=g=>g.coil?"rail":g.glow&&g.scope?"beam":g.glow?"plasma":g.scope?"sniper":(g.pel>1||g.pst||g.r===0||(g.mg||0)>=.18||g.l<=.42)?"short":"rifle";
const spec=g=>{const c=CL[cls(g)];return c.bolt&&g.st?Object.assign({},c,{v:140}):c};
// bullet drop at a distance for a gun, in metres (range marks on scopes use it)
function dropAt(g,d){const c=spec(g);if(!c.v||d<=c.inst)return 0;const t=(d-c.inst)/c.v;return .5*c.g*t*t}
const B=[],SK=[],sg=new T.BoxGeometry(1,1,1),_d=new T.Vector3(),_e=new T.Vector3(),_q=new T.Vector3();
let si=0;
function streak(){if(SK.length<40){const m=new T.Mesh(sg,new T.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));m.frustumCulled=false;m.raycast=()=>{};m.visible=false;sc.add(m);SK.push(m);return m}
const m=SK[si=(si+1)%SK.length];return m}
// world ray that also says how thick the box it hits is (for shooting through thin cover); ground and ceiling count as infinitely thick
function wRay(o,d,max){
let best=max,thick=1e9,bb=null;
if(typeof CustomBattle!=="undefined"&&CustomBattle.active)return{t:rayWorld(o.x,o.y,o.z,d.x,d.y,d.z,max),thick,b:null};
if(d.y<-1e-6){const t=-o.y/d.y;if(t>0&&t<best)best=t}
if(WORLD.ceil&&d.y>1e-6){const t=(WORLD.ceil-o.y)/d.y;if(t>0&&t<best)best=t}
for(let i=0;i<boxes.length;i++){const b=boxes[i];let t0=0,t1=1e9,lo,hi,u;
if(Math.abs(d.x)<1e-9){if(o.x<b.x-b.w/2||o.x>b.x+b.w/2)continue}else{lo=(b.x-b.w/2-o.x)/d.x;hi=(b.x+b.w/2-o.x)/d.x;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(Math.abs(d.y)<1e-9){if(o.y<0||o.y>b.h)continue}else{lo=-o.y/d.y;hi=(b.h-o.y)/d.y;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(Math.abs(d.z)<1e-9){if(o.z<b.z-b.d/2||o.z>b.z+b.d/2)continue}else{lo=(b.z-b.d/2-o.z)/d.z;hi=(b.z+b.d/2-o.z)/d.z;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(t0>1e-4&&t0<best){best=t0;thick=t1-t0;bb=b}}
return{t:best,thick:bb?thick:1e9,b:bb}}
// which way the surface at p faces (top of a box or the ground, else the box side the bullet came at); same rule as the impact sparks
function nrm(p,d,b){if(!b||p.y<.06||(b&&p.y>b.h-.06))return[0,1,0];const ex=Math.min(Math.abs(p.x-(b.x-b.w/2)),Math.abs(p.x-(b.x+b.w/2))),ez=Math.min(Math.abs(p.z-(b.z-b.d/2)),Math.abs(p.z-(b.z+b.d/2)));return ex<ez?[-Math.sign(d.x)||1,0,0]:[0,0,-Math.sign(d.z)||1]}
const hsOf=g=>Number.isFinite(g.hs)&&g.hs>0?g.hs:(RM.hs[g.r]||2);
function fall(b){const g=b.g;if(g.fo)return gFall(g,b.s);const fo=b.c.fo;return fo?clamp(1.1-.5*b.s/fo,.5,1):1}
// player bullet hits a target
function hitTarget(b,h,end){
const u=h.object.userData,g=b.g,dmg=g.d*fall(b)*b.k;
if(u.remote&&PT.on){Party.applyDmg(u.remote,dmg,!!u.head);Fx.burst(end,0xff5a4a,u.head?7:4,4,.06,1.5,16)}
else if(u.en){if(u.en.fighter){Party.shoot(u.en,g,!!u.head,1);Fx.burst(end,0xff5a4a,u.head?7:4,4,.06,1.5,16)}
else hurtE(u.en,dmg*(u.head?hsOf(g)/2:1),u.head,end)}
else if(u.tgt)tgtHit(h.object)}
// bot bullet against the player: a capsule from the feet to the head (lower when crouched)
function hitPlayer(o,d,len){
if(P.dead>0)return -1;const top=P.y+1.75-.55*P.crouch,bot=P.y+.1;
const h2=d.x*d.x+d.z*d.z,tc=h2>1e-6?((P.x-o.x)*d.x+(P.z-o.z)*d.z)/h2:0;
// sample a few points along the segment around the closest approach in the ground plane
if(tc<-.5||tc>len+.5)return -1;for(const dt of[0,-.25,.25,-.5,.5]){const tt=clamp(tc+dt,0,len),x=o.x+d.x*tt,y=o.y+d.y*tt,z=o.z+d.z*tt;
if(y>=bot&&y<=top&&Math.hypot(x-P.x,z-P.z)<.38)return tt}return -1}
function impact(b,p,d,mini){Gfx.impact(p,b.gc,b.g,mini,d)}
// move a bullet along a straight stretch: returns false when the bullet is spent
function travel(b,len){
const d=_d.copy(b.dir);let left=len,guard=0;
while(left>1e-3&&guard++<5){
const w=wRay(b.p,d,left);let th=-1,hh=null;
if(b.src==="p"){rc.set(b.p,d);rc.near=0;rc.far=Math.min(left,w.t);const tg=b.tg;const hs=tg.length?rc.intersectObjects(tg,false):[];for(const h of hs){const en=h.object.userData.en||h.object.userData.remote||h.object;if(b.done.has(en))continue;hh=h;th=h.distance;break}rc.far=Infinity}
else{const t=hitPlayer(b.p,d,Math.min(left,w.t));if(t>=0)th=t}
if(th>=0){
const end=_e.copy(b.p).addScaledVector(d,th);
if(b.src==="p"){hitTarget(b,hh,end.clone());b.done.add(hh.object.userData.en||hh.object.userData.remote||hh.object)}
else{hit(b.dmg*fall(b),b.from);b.p.copy(end);return false}
b.s+=th;left-=th;b.p.copy(end).addScaledVector(d,.05);
if(b.pierce>0){b.pierce--;continue}return false}
if(w.t<left){
const end=_e.copy(b.p).addScaledVector(d,w.t);b.s+=w.t;
const thin=w.b&&(w.thick<=(b.c.thru||.35))&&(b.c.thru||w.b.h<=2.3);
if(thin){impact(b,end.clone(),d,true);b.k*=b.c.thru?.8:.5;b.p.copy(end).addScaledVector(d,w.thick+.02);left-=w.t+w.thick;b.s+=w.thick;
_q.copy(b.p);impact(b,_q.clone(),d,true);continue}
b.p.copy(end);
if(b.src==="p"||LOD.fx>=.6)impact(b,end.clone(),d,b.mini);
// ricochet: a grazing hit on a wall throws sparks along the bounce
const n=nrm(end,d,w.b),c=Math.abs(d.x*n[0]+d.y*n[1]+d.z*n[2]);
if(c<.24&&n[1]<.5&&LOD.fx>=.3){const k=2*(d.x*n[0]+d.y*n[1]+d.z*n[2]);Fx.spray(end,d.x-k*n[0],d.y-k*n[1]+.15,d.z-k*n[2],0xffd27a,5,9,.03,10,.5);if(b.src==="p"||end.distanceTo(cam.position)<20)snd("ktick",.25,1.8+rnd()*.5)}
return false}
b.p.addScaledVector(d,left);b.s+=left;left=0}
return true}
function draw(b){
const m=b.m;if(!m)return;const k=Math.min(1,b.s/10),L=b.c.bolt?.7:Math.min(b.s,2.4+b.v*.006);
_q.copy(b.p).addScaledVector(b.off,1-k);_e.copy(_q).addScaledVector(b.dir,-L);
m.position.lerpVectors(_q,_e,.5);m.lookAt(_q);m.scale.set(b.w,b.w,L);m.visible=true}
// a player shot: o/d are the camera ray, mz the muzzle the streak starts from
function fire(o,d,g,mz,opt){
opt=opt||{};const c=spec(g),inst=mode==="range"?1e9:c.inst; // the range keeps its hit streak counter in step with each shot, so it stays instant
const b={src:"p",p:o.clone(),dir:d.clone().normalize(),c,g,gc:opt.gc||gunCol(g),k:1,s:0,t:0,v:c.v,pierce:c.pierce||0,done:new Set(),tg:opt.tg||gatherTargets().slice(),mini:!!opt.mini,
ttl:PT.on?.5:(c.max/(c.v||1e9))+.2,off:mz.clone().sub(o),w:c.bolt?.09:(opt.w||.022),m:null,col:opt.col||(opt.gc||gunCol(g)).col};
const st=b.p.clone(),live=travel(b,Math.min(inst,c.max));
if(!live||!c.v){Fx.tracer(mz,b.p.clone(),b.col,b.w,b.gc.life);if(c.pierce||g.glow||g.coil||g.r>=4)Fx.tracer(mz,b.p.clone(),b.col,.06+g.r*.01,b.gc.life*.8);return b.p.clone()}
if(inst>0)Fx.tracer(mz,b.p.clone(),b.col,b.w,.05);
b.off.multiplyScalar(inst>0?0:1);b.dir.multiplyScalar(c.v);b.vel=b.dir.clone();b.dir.normalize();
b.m=streak();b.m.material.color.setHex(b.col).multiplyScalar(Post.hot);b.m.material.opacity=.95;B.push(b);draw(b);
return null}
// a bot shot from a (muzzle) at the aim point tp; lead 0..1 is how much of your movement the bot leads
function botFire(a,tp,dmg,from,lead,spd){
const v=spd||Tune.n("bul.botV",170,40,600),dist=a.distanceTo(tp),t=dist/v;
const aim=tp.clone();aim.x+=P.vx*t*lead;aim.z+=P.vz*t*lead;aim.y+=.5*CL.rifle.g*t*t*.6;
const dir=aim.sub(a).normalize();
const b={src:"b",p:a.clone(),dir,c:{fo:0,thru:0},g:{},gc:{col:0xffe9a0,life:.06},k:1,s:0,t:0,v,pierce:0,dmg,from,mini:true,ttl:1.2,off:new T.Vector3(),w:.03,m:null,col:0xff8866,grav:2,whizz:0};
b.vel=dir.clone().multiplyScalar(v);b.m=streak();b.m.material.color.setHex(b.col).multiplyScalar(Post.hot);b.m.material.opacity=.95;B.push(b);draw(b)}
function step(dt){
for(let i=B.length-1;i>=0;i--){const b=B[i];b.t+=dt;
const gr=b.src==="b"?b.grav:b.c.g;b.vel.y-=gr*dt;const len=b.vel.length()*dt;b.dir.copy(b.vel).normalize();
const p0=b.p.clone(),live=b.t<b.ttl&&b.s<(b.c.max||140)&&travel(b,len);
if(b.src==="b"&&!b.whizz){const cp=cam.position,seg=b.p.distanceTo(p0);if(seg>0){_d.subVectors(b.p,p0).divideScalar(seg);const tt=clamp((cp.x-p0.x)*_d.x+(cp.y-p0.y)*_d.y+(cp.z-p0.z)*_d.z,0,seg),qx=p0.x+_d.x*tt-cp.x,qy=p0.y+_d.y*tt-cp.y,qz=p0.z+_d.z*tt-cp.z,cd=Math.hypot(qx,qy,qz);
if(cd<1.6&&live){b.whizz=1;snd("whizz",clamp(1.3-cd*.6,.3,1),.9+rnd()*.25)}}}
if(!live){if(b.m)b.m.visible=false;B.splice(i,1);continue}
draw(b)}}
function clear(){B.length=0;SK.forEach(m=>m.visible=false)}
return{fire,botFire,step,clear,cls,spec,dropAt,get n(){return B.length}}})();
