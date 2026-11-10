"use strict";
// ---------- parkour: a course of platforms over lava with checkpoints and gems (there is no timer) ----------
// st stages, per platforms in each stage, sz/gap/rise ranges in metres, jit sideways wobble, beam chance of a narrow beam, dj how many of the last stages need a double jump, base coin reward
const PKD={
easy:{st:8,per:14,sz:[3.4,4.4],gap:[1.2,2],rise:[.2,.45],jit:1.2,beam:0,dj:0,base:60},
medium:{st:8,per:14,sz:[2.5,3.4],gap:[1.8,3],rise:[.2,.45],jit:1.8,beam:.15,dj:2,base:130},
hard:{st:8,per:13,sz:[1.9,2.6],gap:[3.2,4.6],rise:[.15,.4],jit:2.3,beam:.25,dj:3,base:240},
impossible:{st:8,per:12,sz:[1.7,2.4],gap:[3.2,4.2],rise:[.1,.3],jit:2.4,beam:.2,dj:4,base:420}};

const PK=(()=>{
const st={falls:0,cp:0,gems:0,maxY:0,done:false,course:null,t:0,best:null,rec:[],ghost:null,gpath:null,grecT:0};
const PADW=5;
function clearGhost(){if(st.ghost){sc.remove(st.ghost);disposeGeo(st.ghost);st.ghost=null}st.gpath=null;st.gtrail=null;st._gt=0}
function spawnGhost(path){
clearGhost();if(!path||path.length<2)return;
const g=mkHuman({body:0x66e0ff,trim:0xb8f0ff});g.userData.nar=true;
g.traverse(o=>{if(o.isMesh&&o.material){const m=o.material.clone();m.transparent=true;m.opacity=.52;m.depthWrite=false;if(m.color)m.color.multiplyScalar(.9);o.material=m;o.castShadow=false}});
// glowing nameplate so the ghost is easy to track like Mario Kart
const tag=document.createElement("canvas");tag.width=256;tag.height=64;const tg=tag.getContext("2d");
tg.fillStyle="rgba(8,20,36,.55)";tg.fillRect(0,0,256,64);tg.font="bold 28px Outfit,system-ui,sans-serif";tg.fillStyle="#9fe8ff";tg.textAlign="center";tg.fillText("GHOST",128,42);
const spr=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(tag),transparent:true,depthWrite:false}));spr.scale.set(2.2,.55,1);spr.position.y=2.35;g.add(spr);
// ribbon trail points
const trail=[];
sc.add(g);st.ghost=g;st.gpath=path;st.gtrail=trail;st.gtrailMesh=null}
function sampleGhost(t){
const p=st.gpath;if(!p||!st.ghost||p.length<2)return;
let i=0;while(i<p.length-2&&p[i+1].t<t)i++;
const a=p[i],b=p[Math.min(i+1,p.length-1)],u=b.t>a.t?clamp((t-a.t)/(b.t-a.t),0,1):0;
const x=lerp(a.x,b.x,u),y=lerp(a.y,b.y,u),z=lerp(a.z,b.z,u);
st.ghost.position.set(x,y,z);
const dy=angDiff(a.yaw,b.yaw);st.ghost.rotation.y=a.yaw+dy*u+Math.PI;
// animate limbs from movement speed / airborne flag
const spd=Math.hypot(b.x-a.x,b.z-a.z)/Math.max(.05,b.t-a.t);
const air=!!(a.air||b.air)||(y>(a.y0||0)+.15);
const cro=lerp(a.crouch||0,b.crouch||0,u);
try{poseHuman(st.ghost,.016,clamp(spd/7,0,1.4),0,air)}catch(err){}
st.ghostLead=(t-(st.best||0));
// soft trail puffs
if(!st._gt||performance.now()-st._gt>70){st._gt=performance.now();Fx.burst({x,y:y+.2,z},0x66e0ff,2,.6,.04,.2,2)}
}

// Builds the course inside buildWorld. c carries that function's helpers: blk/reg/P/glow/rng/th/key/lerpC/grp.
function build(c){
// every map has its own layout: sh = platform shape for stop k, gm gap, jm wobble, rm climb, pm extra platforms per stage, ex extra height change at stop k; spiral builds a tower instead of rows
const r0=(a,b)=>a+(b-a)*c.rng(),sty=(c.map&&c.map.sty)||"ledge",MSS={
ledge:{sp:{cr:1.7,va:1.2},gm:1,jm:1,rm:1,pm:0,ex:k=>k%4===3?.55:k%4===0?-.5:0,sh:k=>k%4===3?{a:r0(2.3,2.8),l:r0(2.3,2.8)}:null},
circuit:{sp:{mv:2,va:.3},gm:.78,jm:1.2,rm:.5,pm:-2,spiral:1,path:"zig",esz:5,sh:k=>k%2?{a:r0(5.4,7),l:r0(2.1,2.5)}:{a:r0(2.9,3.4),l:r0(2.9,3.4)}},
spire:{sp:{bo:2,va:1.4},gm:1,jm:1,rm:1,pm:0,spiral:1,path:"circle"},
stones:{sp:{mv:1.4,cr:1.4,va:0},gm:.82,jm:1.6,rm:.3,pm:6,spiral:1,path:"wave",esz:2.3,sh:()=>{const s=r0(2,2.6);return{a:s,l:s}}},
stairs:{sp:{va:2,bo:2,cr:.6},gm:1,jm:.8,rm:.5,pm:0,spiral:1,path:"square",ex:k=>k%3===2?.8:k%9===8?-1.6:0,sh:k=>k%3===2?{a:r0(4.6,6),l:r0(3.6,4.6)}:null}},MS=MSS[sty]||MSS.ledge;
const d0=PKD[c.diff]||PKD.easy,rmul=c.map?c.map.rm:1,d=Object.assign({},d0,{rise:[d0.rise[0]*rmul*MS.rm,d0.rise[1]*rmul*MS.rm],jit:d0.jit*MS.jm}),rng=c.rng,rr=(a,b)=>a+(b-a)*rng(),night=!!c.th.night||c.key==="neon"||c.key==="toxic";
// bigger play space on harder courses so Nightmare stages stay inside the map
const limScale=c.diff==="impossible"?1.9:c.diff==="hard"?1.8:c.diff==="medium"?1.65:1.5;
const lim=(H-4)*limScale;
const cps=[],gems=[],plats=[],route=[],NS=d.st+((c.map&&c.map.ns)|0),PER=Math.max(6,d.per+Math.floor(rng()*3)-1+MS.pm);
const stCol=s=>new T.Color().setHSL((.55+s*.115)%1,night?.8:.55,night?.58:.56).getHex();
const edge=night?0x00f0ff:0xffffff;
function plat(x,z,w,dd,h,s,pad,gem){
const col=stCol(s),body=c.lerpC(col,0x161a26,.5),cap=c.lerpC(col,0xffffff,pad?.5:.22),band=c.lerpC(body,0x000000,.4);
c.reg(x,z,w,dd,h);
c.P("box",x,(h-.22)/2,z,w-.02,h-.22,dd-.02,body,0,.62);
c.P("box",x,h-.11,z,w+.14,.22,dd+.14,cap,0,.9);
for(const k of[-1,1]){c.P("box",x+k*(w/2+.03),h+.02,z,.08,.05,dd+.14,edge,0,1,c.glow);c.P("box",x,h+.02,z+k*(dd/2+.03),w+.14,.05,.08,edge,0,1,c.glow)}
for(let y=1.4;y<h-.5;y+=2.4)c.P("box",x,y,z,w+.06,.1,dd+.06,band,0,1);
const o={x,z,w,d:dd,h};plats.push(o);if(!gem){o.ri=route.length;route.push(o)}}
function overlaps(x,z,w,dd){for(const p of plats)if(Math.abs(x-p.x)<(w+p.w)/2+.6&&Math.abs(z-p.z)<(dd+p.d)/2+.6)return true;return false}
function beacon(x,z,y,col,tall){
const m=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),
b=new T.Mesh(new T.CylinderGeometry(tall?2:1.25,tall?2:1.25,tall?34:8,20,1,true),m);b.position.set(x,y+(tall?17:4),z);c.grp.add(b);
const r=new T.Mesh(new T.TorusGeometry(tall?2.4:1.6,.09,8,36),new T.MeshBasicMaterial({color:col}));r.rotation.x=Math.PI/2;r.position.set(x,y+.1,z);c.grp.add(r);
return{b,r}}
function pad(x,z,h,s,dir,isFin,yw){
const w=isFin?6.5:PADW;plat(x,z,w,w,h,s,true);
const o=beacon(x,z,h,isFin?0xffd24a:0x55ddff,isFin);
return{x,z,y:h,w,d:w,yaw:yw!=null?yw:-dir*Math.PI/2,got:false,b:o.b,r:o.r,fin:!!isFin,ri:route.length-1}}

// one stage is a checkpoint pad followed by a row of platforms along x; connector hops along z lead to the next stage, which runs back the other way
const avgS=(d.sz[0]+d.sz[1])/2,step=avgS+(d.gap[0]+d.gap[1])/2,nc=clamp(Math.round(12/step)-1,1,3),sp=(nc+1)*step;
const djOn=Array.from({length:NS},(_,s)=>s>=NS-(d.dj||0)),djDone=new Array(NS).fill(false);
// two glowing chevrons on the take-off edge of a pad that leads into a double-jump gap
function chevrons(ex,ez,y,dir,dz){
dz=dz||0;const bar=(x1,z1,x2,z2)=>c.P("box",(x1+x2)/2,y,(z1+z2)/2,Math.hypot(x2-x1,z2-z1),.03,.12,0x9fe8ff,Math.atan2(-(z2-z1),x2-x1),1,c.glow);
for(const o of[.55,1.25]){const tx=ex-dir*o,tz=ez-dz*o;for(const sg of[-1,1])bar(tx,tz,tx-dir*.5-dz*.5*sg,tz-dz*.5+dir*.5*sg)}}
// special platforms: mv slides sideways, cr crumbles after you land, bo launches you up to a high ledge, va has a wall to vault over
const SPD=({easy:{mv:.05,cr:0,bo:0,va:0},medium:{mv:.12,cr:.1,bo:.04,va:.06},hard:{mv:.15,cr:.15,bo:.05,va:.08},impossible:{mv:.2,cr:.22,bo:.06,va:.12}})[c.diff]||{mv:0,cr:0,bo:0,va:0};
const dyn=[],boost=[];let lastSp=-9,pidx=0,pend=0;
const spw=q=>(SPD[q]||0)*((MS.sp&&MS.sp[q])||1);
function slab(x,z,w,dd,h,kind){
const col=kind==="mv"?0x2ad4ff:0xff9a3a,mk1=(cc,a)=>new T.MeshLambertMaterial({color:c.lerpC(cc,a,.5)}),body=mk1(col,0x161a26),cap=new T.MeshLambertMaterial({color:c.lerpC(col,0xffffff,.25)}),gl=new T.MeshBasicMaterial({color:col}),g=new T.Group();
const bx=(sx,sy,sz,m,px,py,pz)=>{const q=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);q.position.set(px,py,pz);g.add(q);return q};
bx(w-.02,.5,dd-.02,body,0,h-.36,0);bx(w+.14,.2,dd+.14,cap,0,h-.1,0);bx(w-.3,.06,dd-.3,gl,0,h-.64,0);
for(const k of[-1,1]){bx(.08,.05,dd+.14,gl,k*(w/2+.03),h+.02,0);bx(w+.14,.05,.08,gl,0,h+.02,k*(dd/2+.03))}
if(kind==="cr")for(let i=-1;i<=1;i++)bx(w*.9,.03,.07,body,0,h+.01,i*dd*.28);
g.position.set(x,0,z);c.grp.add(g);return{g,cap,col}}
function mk(x,z,w,dd,h,s,ok,ax){
pidx++;
if(!ok||pidx-lastSp<3){plat(x,z,w,dd,h,s,false);return null}
const r=rng(),pm=spw("mv"),pc=spw("cr"),pb=spw("bo"),pv=spw("va"),al=ax==="x"?w:dd,lat=ax==="x"?dd:w;let kd=null,amp=0;
if(r<pm)kd="mv";else if(r<pm+pc)kd="cr";else if(r<pm+pc+pb&&Math.min(w,dd)>=2.4)kd="bo";else if(r<pm+pc+pb+pv)kd="va";
if(kd==="mv"){amp=Math.min(2.1,Math.max(1.4,lat*.7));if(overlaps(x,z,ax==="x"?w:w+amp*2,ax==="x"?dd+amp*2:dd))kd=null}
if(!kd){plat(x,z,w,dd,h,s,false);return null}
lastSp=pidx;
if(kd==="mv"||kd==="cr"){c.reg(x,z,w,dd,h);const b=boxes[boxes.length-1],m=slab(x,z,w,dd,h,kd),o={x,z,w,d:dd,h,ri:route.length};plats.push(o);route.push(o);
dyn.push({k:kd,cc:c.lerpC(m.col,0xffffff,.25),m,b,o,bx:x,bz:z,h,ax:ax==="x"?"z":"x",amp,ph:rng()*6.28,per:c.diff==="easy"?5.2:c.diff==="medium"?4.4:3.6,st:0,t:0});return kd}
if(kd==="va"){const W2=ax==="x"?Math.max(w,3.6):w,D2=ax==="x"?dd:Math.max(dd,3.6);if(overlaps(x,z,W2,D2)){plat(x,z,w,dd,h,s,false);return null}w=W2;dd=D2}
plat(x,z,w,dd,h,s,false);const o=plats[plats.length-1];
if(kd==="bo"){const rd=Math.min(w,dd)*.7;c.P("cyl",x,h+.03,z,rd,.05,rd,0x4cff8a,0,1,c.glow);c.P("cyl",x,h+.04,z,rd*.55,.05,rd*.55,0xffffff,0,1,c.glow);boost.push(o);pend=3;return kd}
const th2=.5,wc=c.lerpC(stCol(s),0x000000,.3);
if(ax==="x")c.blk(x,z,th2,h+1.55,dd,wc,.7);else c.blk(x,z,w,h+1.55,th2,wc,.7);
c.P("box",x,h+1.57,z,ax==="x"?th2+.08:w+.08,.08,ax==="x"?dd+.08:th2+.08,edge,0,1,c.glow);return kd}
const dir0=rng()<.5?1:-1;let x=-dir0*(lim-3),z=-(NS-1)*sp/2,h=.7,dir=dir0,fin=null;
if(MS.spiral){
// path maps: platforms are walked along a curve (circle = spire, square = ziggurat, zig = lightning, wave = winding river), and every next stop sits exactly one gap away
const kind=MS.path||"circle",Rmax=Math.min(lim-5,44),Rmin=Math.max(15,Rmax*.38),tot=NS*PER,midK=Math.floor(PER*.6),A=lim-8;
const rad=i=>Rmax-(Rmax-Rmin)*Math.min(1,i/tot);
const estL=(tot*((MS.esz||(d.sz[0]+d.sz[1])/2)+(d.gap[0]+d.gap[1])/2*1.15*MS.gm+.3)+(d.dj||0)*14)*1.15+30;
const kds=Array.from({length:NS},(_,s)=>djOn[s]?2+Math.floor(rng()*3):-1);
let curve,t0=0,dT=.004;
if(kind==="circle"||kind==="square"){
const sq=kind==="square";
curve=(t,i)=>{const r=rad(i);if(!sq)return{x:Math.cos(t)*r,z:Math.sin(t)*r};const q=(((t/6.2832)%1)+1)%1*4,sd=Math.floor(q),f=q-sd;return sd===0?{x:r,z:-r+2*r*f}:sd===1?{x:r-2*r*f,z:r}:sd===2?{x:-r,z:r-2*r*f}:{x:-r+2*r*f,z:-r}};
t0=rng()*6.283;dT=.004*(rng()<.5?1:-1)}
else{
const pts=[],fl=rng()<.5?-1:1;
if(kind==="zig"){const n=Math.max(3,Math.ceil(estL/Math.hypot(2*A,10))),dz=clamp(2*A/n,3.5,16);for(let j=0;j<=n;j++)pts.push({x:fl*(j%2?A:-A),z:-n*dz/2+j*dz})}
else{const Rn=Math.max(3,Math.ceil(estL/(2*A*1.12))),dz=clamp(2*A/Rn,7,20),amp=Math.min(4.5,dz/2-2.5);
for(let r=0;r<Rn;r++){const dx=r%2?-1:1,zr=-Rn*dz/2+r*dz;for(let u=0;u<=2*A;u+=3){const x=fl*(-A+(dx>0?u:2*A-u));pts.push({x,z:zr+amp*Math.sin(x/8+r*1.7)})}}}
const cum=[0];for(let j=1;j<pts.length;j++)cum.push(cum[j-1]+Math.hypot(pts[j].x-pts[j-1].x,pts[j].z-pts[j-1].z));
curve=t=>{const n=pts.length;if(t>=cum[n-1]){const a=pts[n-2],b=pts[n-1],L=cum[n-1]-cum[n-2]||1;return{x:b.x+(b.x-a.x)/L*(t-cum[n-1]),z:b.z+(b.z-a.z)/L*(t-cum[n-1])}}
let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=t)lo=m;else hi=m}
const f=(t-cum[lo])/((cum[hi]-cum[lo])||1);return{x:pts[lo].x+(pts[hi].x-pts[lo].x)*f,z:pts[lo].z+(pts[hi].z-pts[lo].z)*f}};dT=.12}
const edge=(a,b)=>Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),Math.max(0,Math.abs(a.z-b.z)-(a.d+b.d)/2));
const dirAt=(t,i)=>{const a=curve(t,i),b=curve(t+dT*5,i),dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz)||1;return{x:dx/L,z:dz/L}},yawAt=(t,i)=>{const q=dirAt(t,i);return Math.atan2(-q.x,-q.z)};
function nextStop(prev,t,i,w,dd,g,ro){
let n=0,cand;
do{t+=dT;const p=curve(t,i),q=dirAt(t,i);cand={x:p.x-q.z*ro,z:p.z+q.x*ro,w,d:dd}}while(edge(prev,cand)<g&&n++<900);
return{c:cand,t}}
let t=t0,p0=curve(t,0),prev={x:p0.x,z:p0.z,w:PADW,d:PADW};
cps.push(pad(prev.x,prev.z,h,0,0,false,yawAt(t,0)));
const total=tot-1;
for(let i=1;i<=total;i++){
const s=Math.floor(i/PER),k=i%PER,last=s===NS-1,isStart=k===0,isCP=k===midK&&!last,kd=kds[s],isDJ=k===kd&&!isStart&&!isCP;
const qb=dirAt(t,i),bmx=Math.abs(qb.x)>=Math.abs(qb.z),bm=!isStart&&!isCP&&!isDJ&&!MS.sh&&k!==3&&kd!==k+1&&kd!==k-1&&rng()<d.beam*.9,ov=!isStart&&!isCP&&!isDJ&&MS.sh?MS.sh(k):null,sq0=Math.max(2,rr(d.sz[0],d.sz[1])),sw=isStart||isCP?PADW:isDJ?Math.max(2.8,sq0):bm?(bmx?5.4:1.3):ov?ov.a:sq0,sd=isStart||isCP?PADW:isDJ?sw:bm?(bmx?1.3:5.4):ov?ov.l:sq0,g=isDJ?rr(9.4,10.6):rr(d.gap[0],d.gap[1])*1.15*MS.gm;
let ro=isStart||isCP||isDJ||bm?0:rr(-1,1)*d.jit*.5,st_=nextStop(prev,t,i,sw,sd,g,ro);
if(ro&&overlaps(st_.c.x,st_.c.z,sw,sd)){ro=0;st_=nextStop(prev,t,i,sw,sd,g,0)}
const hPrev=h;h=Math.max(.7,h+(k%6===5?-rr(.3,.55):rr(d.rise[0],d.rise[1])));if(MS.ex&&!isStart&&!isCP&&!isDJ)h=Math.max(.7,h+MS.ex(k));if(pend){h+=pend;pend=0}
const c2=st_.c;
if(isStart||isCP)cps.push(pad(c2.x,c2.z,h,s,0,false,yawAt(st_.t,i)));else mk(c2.x,c2.z,sw,sd,h,s,!isDJ&&!bm&&k!==3&&kd!==k+1&&kd!==k-1&&!last,Math.abs(qb.x)>=Math.abs(qb.z)?"x":"z");
if(isDJ){const ux=c2.x-prev.x,uz=c2.z-prev.z,L=Math.hypot(ux,uz)||1,dx=ux/L,dz=uz/L,m=Math.max(Math.abs(dx),Math.abs(dz))||1;chevrons(prev.x+dx*prev.w/2/m,prev.z+dz*prev.d/2/m,hPrev+.02,dx,dz);djDone[s]=true}
if(k===3){
const q=dirAt(st_.t,i),bw=2,off=Math.max(sw,sd)/2+rr(2.6,3.1)+bw/2,bh=h+.4,pr=(f)=>({x:c2.x-q.z*off*f,z:c2.z+q.x*off*f});let bp=pr(1);
if(overlaps(bp.x,bp.z,bw,bw))bp=pr(-1);
if(Math.abs(bp.x)<lim+1&&Math.abs(bp.z)<lim+1&&!overlaps(bp.x,bp.z,bw,bw)){plat(bp.x,bp.z,bw,bw,bh,s,false,true);
const gm=new T.Mesh(new T.OctahedronGeometry(.42),new T.MeshBasicMaterial({color:0xffd24a}));gm.position.set(bp.x,bh+1.1,bp.z);c.grp.add(gm);
gems.push({x:bp.x,z:bp.z,y:bh+1.1,m:gm,got:false})}}
prev=c2;t=st_.t}
{const fs=nextStop(prev,t,total+1,6.5,6.5,rr(d.gap[0],d.gap[1]),0);h+=rr(.6,.9);fin=pad(fs.c.x,fs.c.z,h,NS-1,0,true,yawAt(fs.t,total+1))}
}else for(let s=0;s<NS;s++){
const rowZ=z,last=s===NS-1,kd=djOn[s]?2+Math.floor(rng()*3):-1;cps.push(pad(x,z,h,s,dir,false));
let prev={x,z,half:PADW/2,lat:PADW},mid=null;const midK=Math.floor(PER*.6);
for(let k=0;k<(last?PER-1:PER);k++){
let isCP=!last&&k===midK&&k!==kd,isDJ=k===kd,beam=!isDJ&&!isCP&&rng()<d.beam,along=isCP?PADW:isDJ?Math.max(3.2,rr(d.sz[0],d.sz[1])):beam?rr(4.8,6.2):rr(d.sz[0],d.sz[1]),lat=isCP?PADW:isDJ?Math.max(2.8,rr(d.sz[0],d.sz[1])):beam?rr(1.2,1.5):rr(d.sz[0],d.sz[1]),
// a single sprint jump spans about 8 m edge to edge, a double jump about 12 m, so these gaps need the second jump
gap=isDJ?rr(9.4,10.6):rr(d.gap[0],d.gap[1])*1.15*MS.gm;
const ov2=!isCP&&!isDJ&&!beam&&MS.sh?MS.sh(k):null;if(ov2){along=ov2.a;lat=ov2.l}
const nx=prev.x+dir*(prev.half+gap+along/2);
if(Math.abs(nx)+along/2>(last?lim-6:lim))break;
const maxD=(prev.lat+lat)/2*.55;
let nz=clamp(rowZ+(k%2?1:-1)*rr(.3,1)*d.jit,prev.z-maxD,prev.z+maxD);nz=clamp(nz,rowZ-d.jit,rowZ+d.jit);
if(isDJ)nz=clamp(prev.z+rr(-.4,.4),rowZ-d.jit,rowZ+d.jit);
const hPrev=h;h=Math.max(.7,h+(k%6===5?-rr(.3,.55):rr(d.rise[0],d.rise[1])));if(MS.ex&&!isCP&&!isDJ)h=Math.max(.7,h+MS.ex(k));if(pend){h+=pend;pend=0}
if(isCP)cps.push(pad(nx,nz,h,s,dir,false));else mk(nx,nz,along,lat,h,s,!isDJ&&!beam&&k!==3&&k!==kd+1&&k!==kd-1&&!last,"x");
if(isDJ){chevrons(prev.x+dir*prev.half,prev.z,hPrev+.02,dir);djDone[s]=true}
prev={x:nx,z:nz,half:along/2,lat};
if(k===3)mid={x:nx,z:nz,lat,h}}
// the optional gem sits on a small side platform a longer jump away from the route
if(mid){
const bw=2,bx=mid.x,bz=mid.z-(mid.lat/2+rr(2.6,3.1)+bw/2),bh=mid.h+.4;
if(Math.abs(bz)<lim+1&&!overlaps(bx,bz,bw,bw)){plat(bx,bz,bw,bw,bh,s,false,true);
const gm=new T.Mesh(new T.OctahedronGeometry(.42),new T.MeshBasicMaterial({color:0xffd24a}));gm.position.set(bx,bh+1.1,bz);c.grp.add(gm);
gems.push({x:bx,z:bz,y:bh+1.1,m:gm,got:false})}}
if(last){
// the final stage ends on a wide golden plaza
const fw=6.5,gap=rr(d.gap[0],d.gap[1]),fx=clamp(prev.x+dir*(prev.half+gap+fw/2),-lim+fw/2+4,lim-fw/2-4);
h+=rr(.6,.9);fin=pad(fx,clamp(prev.z,rowZ-1,rowZ+1),h,s,dir,true);break}
let cz=prev.z,pHalf=prev.lat/2;const px=prev.x;
for(let i=0;i<nc;i++){
const sz2=rr(d.sz[0],d.sz[1]),g2=rr(d.gap[0],d.gap[1])*1.15;cz+=pHalf+g2+sz2/2;h+=rr(d.rise[0],d.rise[1]);
plat(clamp(px+rr(-.5,.5),-lim,lim),cz,sz2,sz2,h,s,false);pHalf=sz2/2}
cz+=pHalf+rr(d.gap[0],d.gap[1])+PADW/2;h+=rr(d.rise[0],d.rise[1]);
x=clamp(px,-lim+.5,lim-.5);z=cz;dir=-dir}
// guide posts around the finish plaza
for(const [a,b] of[[-1,-1],[1,-1],[-1,1],[1,1]])c.P("box",fin.x+a*3,fin.y+2.4,fin.z+b*3,.3,4.8,.3,0xffd24a,0,1,c.glow);
// the lava (or water, or neon floor) that sends you back to the last checkpoint
// tileable value noise baked once; the shader scrolls two copies against each other so the crust drifts and cracks glow
// the walkable area is fitted to the platforms that were really built, so no stage can end up outside it
for(const e of dyn)if(e.k==="mv"){const o=e.o,sw=e.ax==="x"?o.w+2*e.amp:o.w,sd2=e.ax==="z"?o.d+2*e.amp:o.d;for(const p of plats)if(p!==o&&Math.abs(e.bx-p.x)<(sw+p.w)/2+.3&&Math.abs(e.bz-p.z)<(sd2+p.d)/2+.3){e.amp=0;break}}
let bx0=1e9,bx1=-1e9,bz0=1e9,bz1=-1e9;for(const p of plats){bx0=Math.min(bx0,p.x-p.w/2);bx1=Math.max(bx1,p.x+p.w/2);bz0=Math.min(bz0,p.z-p.d/2);bz1=Math.max(bz1,p.z+p.d/2)}
const bnd={x0:bx0-10,x1:bx1+10,z0:bz0-10,z1:bz1+10};
// scenery between the course and the walls so the void is never empty: each map gets its own landmarks
{const bw=bnd.x1-bnd.x0,bd=bnd.z1-bnd.z0,N=S.gfx>2?34:70,K=c.key;let n=0;
for(let i=0;i<N*10&&n<N;i++){const x=bnd.x0+4+rng()*(bw-8),z=bnd.z0+4+rng()*(bd-8);if(overlaps(x,z,7,7))continue;n++;
const hh=rr(9,34),a=rng()*3,pk2=rng();
if(K==="neon"){const col=n%2?0xff2bd6:0x00f0ff;c.P("box",x,hh/2,z,1.4,hh,1.4,0x120a26,0,.8);for(let y=3;y<hh-1;y+=rr(4,7))c.P("box",x,y,z,1.9,.14,1.9,col,0,1,c.glow);c.P("box",x+.72,hh/2,z,.08,hh*.9,.08,col,0,1,c.glow)}
else if(K==="frost"){const r=rr(1.2,2.4);c.P("cone",x,hh/2,z,r*1.6,hh,r*1.6,0xaee4ff,a,.8,null,(rng()-.5)*.25,(rng()-.5)*.25);c.P("cone",x,hh*.45,z,r*.7,hh*.9,r*.7,0xffffff,a,1,c.glow)}
else if(K==="toxic"){if(pk2<.65){c.P("cyl",x,hh/2,z,.9,hh,.9,0x2b2a1c,0,.6);for(const f of[.35,.7])c.P("cyl",x,hh*f,z,1.35,.16,1.35,0x7dff3a,0,1,c.glow)}else{const q=hh*.4;c.P("cyl",x,q/2,z,1.1,q,1.1,0x4a5a2a,0,.6);c.P("ico",x,q+.5,z,5,2.4,5,0x2f8a3a,a,.7);c.P("ico",x,q+.7,z,3.6,1.4,3.6,0x9aff5a,a,1,c.glow)}}
else if(K==="desert"){if(pk2<.6){const w=rr(1.8,3);c.P("box",x,hh*.35,z,w,hh*.7,w,0xc9a35a,a,.6);c.P("box",x,hh*.85,z,w*.7,hh*.3,w*.7,0xb98f48,a,.6);c.P("box",x,hh+.3,z,w*.3,.6,w*.3,0xffd24a,a,1,c.glow)}else{const q=rr(6,10);for(const sg of[-1,1])c.P("box",x+sg*2.4,q/2,z,1.3,q,1.3,0xc9a35a,0,.6);c.P("box",x,q+.5,z,6.4,1,1.6,0xb98f48,0,.6);c.P("box",x,q-.1,z,5,.12,1.7,0xffd24a,0,1,c.glow)}}
else{const r=rr(1.6,3.2);c.P("cone",x,hh/2-1,z,r*2,hh+2,r*2,0x2a1712,a,.55);c.P("cyl",x,.6,z,r*2.2,.5,r*2.2,0xff5a1a,0,1,c.glow)}}}

{const wc=c.lerpC(night?0x0b1020:0x3a302a,0x000000,.15),wh=Math.max(h+40,90),W=bnd.x1-bnd.x0+24,D=bnd.z1-bnd.z0+24,cx=(bnd.x0+bnd.x1)/2,cz=(bnd.z0+bnd.z1)/2,wm=new T.MeshLambertMaterial({color:wc,side:T.DoubleSide}),bm=new T.MeshBasicMaterial({color:edge});
for(const [x,z,w,dd] of[[cx,bnd.z0-12,W,1],[cx,bnd.z1+12,W,1],[bnd.x0-12,cz,1,D],[bnd.x1+12,cz,1,D]]){const m=new T.Mesh(new T.BoxGeometry(w,wh,dd),wm);m.position.set(x,wh/2-8,z);c.grp.add(m);
const zw=w>dd,ox=zw?0:(x<cx?1:-1)*.8,oz=zw?(z<cz?1:-1)*.8:0;
for(let y=6;y<wh-8;y+=14){const b=new T.Mesh(new T.BoxGeometry(zw?w:.4,.45,zw?.4:dd),bm);b.position.set(x+ox,y,z+oz);c.grp.add(b)}}}
let rl=0;for(let i=1;i<route.length;i++)rl+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);
const NZ=256,nd=new Uint8Array(NZ*NZ*4),lays=[];
const smooth=t=>t*t*(3-2*t);
for(const per of[4,8,16,32]){const a=new Float32Array(per*per);for(let i=0;i<a.length;i++)a[i]=Math.random();lays.push([per,a])}
for(let y=0;y<NZ;y++)for(let x=0;x<NZ;x++){
let v=0,amp=.5;
for(const [per,a] of lays){const fx=x/NZ*per,fy=y/NZ*per,ix=Math.floor(fx),iy=Math.floor(fy),tx=smooth(fx-ix),ty=smooth(fy-iy),x1=(ix+1)%per,y1=(iy+1)%per;
v+=amp*((a[iy*per+ix]*(1-tx)+a[iy*per+x1]*tx)*(1-ty)+(a[y1*per+ix]*(1-tx)+a[y1*per+x1]*tx)*ty);amp*=.5}
const o=(y*NZ+x)*4;nd[o]=nd[o+1]=nd[o+2]=Math.min(255,v*270);nd[o+3]=255}
const tx=new T.DataTexture(nd,NZ,NZ,T.RGBAFormat);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.needsUpdate=true;
const pal=c.key==="toxic"?[[.01,.06,.01],[.2,.9,.1],[.8,1,.5]]:c.key==="neon"?[[.05,.01,.09],[1,.1,.8],[.3,.95,1]]:c.key==="frost"?[[.01,.07,.16],[.1,.55,1],[.8,.96,1]]:[[.07,.015,.005],[1,.32,.05],[1,.82,.35]];
const haz=new T.Mesh(new T.PlaneGeometry(bnd.x1-bnd.x0+160,bnd.z1-bnd.z0+160),new T.ShaderMaterial({
uniforms:{map:{value:tx},t:{value:0},c0:{value:new T.Vector3(...pal[0])},c1:{value:new T.Vector3(...pal[1])},c2:{value:new T.Vector3(...pal[2])}},
vertexShader:"varying vec2 v;void main(){v=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
fragmentShader:"uniform sampler2D map;uniform float t;uniform vec3 c0,c1,c2;varying vec2 v;"+
"void main(){vec2 u=v*.045;"+
"float a=texture2D(map,u+vec2(t*.012,t*.006)).r,b=texture2D(map,u*1.9+vec2(-t*.02,t*.015)).r;"+
"float n=clamp((a*.6+b*.4-.5)*2.1+.5,0.,1.);float ridge=1.-abs(n*2.-1.);"+
"float crack=smoothstep(.88,.99,ridge),bleed=smoothstep(.55,.97,ridge);"+
"float pulse=.8+.2*sin(t*1.4+a*11.);"+
"vec3 col=c0*(.35+1.3*b*b);col=mix(col,c1,bleed*.42*pulse);col=mix(col,c1*1.4,crack*pulse);col=mix(col,c2,crack*crack*.9);"+
"gl_FragColor=vec4(col,1.);}"}));
haz.rotation.x=-Math.PI/2;haz.position.set((bnd.x0+bnd.x1)/2,.06,(bnd.z0+bnd.z1)/2);c.grp.add(haz);
// embers drift up out of the hazard
const NE=S.gfx>2?36:90,ep=new Float32Array(NE*3),ev=new Float32Array(NE);
for(let i=0;i<NE;i++){ep[i*3]=(Math.random()-.5)*H*1.6;ep[i*3+1]=Math.random()*14;ep[i*3+2]=(Math.random()-.5)*H*1.6;ev[i]=.7+Math.random()*1.6}
const eg=new T.BufferGeometry();eg.setAttribute("position",new T.BufferAttribute(ep,3));
const emb=new T.Points(eg,new T.PointsMaterial({map:SOFTDOT,color:new T.Color(...pal[2]),size:.34,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
emb.frustumCulled=false;c.grp.add(emb);
cps.push(fin);
return{dyn,boost,cps,gems,fin,plats,route,haz,emb,ev,stages:NS,base:d.base,maxH:h,dj:djDone,lim,bnd,est:rl/8,rlen:rl}}

function start(){
const c=WORLD.course;const bt=(S.pkt&&S.pkt[pkK()])||null;
const gpath=(S.pkg&&S.pkg[pkK()])||null;
const modeG=S.opt&&S.opt.ghostRace?+S.opt.ghostRace:0; // 0 solo, 1 time only, 2 full ghost
const race=modeG>0&&gpath&&gpath.length>2&&bt!=null;
const showG=modeG===2&&race;
clearGhost();
Object.assign(st,{celeb:0,falls:0,cp:0,gems:0,maxY:0,done:false,course:c,prog:0,t:0,best:bt,rec:[],grecT:0,racing:!!race,showGhost:!!showG,ghostLead:0});
const p=c.cps[0];placePlayer({x:p.x,z:p.z},p.yaw,3);P.y=p.y+.05;P.gr=false;lastCount=0;
if(showG)spawnGhost(gpath);
let msg;
if(showG)msg="Ghost race! Beat "+(+bt).toFixed(1)+"s";
else if(race)msg="Time attack! Beat "+(+bt).toFixed(1)+"s";
else if(bt!=null)msg="Best to beat: "+(+bt).toFixed(1)+"s";
else msg=c.dj[0]?"Double jump ahead: press Space again in mid-air":"Reach the golden beacon";
flash(msg,2400)}
function respawn(){
const c=st.course,p=c.cps[st.cp];placePlayer({x:p.x,z:p.z},p.yaw,0);P.y=p.y+.05;P.gr=false;P.prot=.5;st.prog=p.ri}

function dynFrame(c,dt){
const tm=c.tm=(c.tm||0)+dt;c.bcd=(c.bcd||0)-dt;
const onTop=(b,h)=>P.gr&&P.dead<=0&&!P.mantle&&Math.abs(P.x-b.x)<b.w/2+.12&&Math.abs(P.z-b.z)<b.d/2+.12&&Math.abs(P.y-h)<.25;
for(const e of c.dyn){
if(e.k==="mv"){const off=Math.sin(tm*6.283/e.per+e.ph)*e.amp,nx=e.bx+(e.ax==="x"?off:0),nz=e.bz+(e.ax==="z"?off:0);
if(onTop(e.b,e.h)){P.x+=nx-e.b.x;P.z+=nz-e.b.z}
e.b.x=nx;e.b.z=nz;e.o.x=nx;e.o.z=nz;e.m.g.position.set(nx,0,nz)}
else if(e.st===0){if(onTop(e.b,e.h)){e.st=1;e.t=0;snd("land",.35,.7)}}
else if(e.st===1){e.t+=dt;e.m.g.position.set(e.bx+(Math.random()-.5)*.14,0,e.bz+(Math.random()-.5)*.14);e.m.cap.color.setHex(Math.sin(e.t*40)>0?0xff3a2a:0xffb060);if(e.t>.5){e.st=2;e.t=0;e.b.h=-9}}
else{e.t+=dt;e.m.g.position.set(e.bx,-e.t*e.t*16,e.bz);if(e.t>.9)e.m.g.visible=false;if(e.t>3.4){e.b.h=e.h;e.m.g.visible=true;e.m.g.position.set(e.bx,0,e.bz);e.m.cap.color.set(e.cc);e.st=0}}}
if(c.bcd<=0)for(const o of c.boost)if(onTop(o,o.h)){P.vy=14.5;P.gr=false;P.jumping=false;P.coy=0;c.bcd=.5;const nx=c.route[o.ri+1];
if(nx){const rise=nx.h-P.y,dx=nx.x-P.x,dz=nx.z-P.z,L=Math.hypot(dx,dz)||1,T=(14.5+Math.sqrt(Math.max(0,14.5*14.5-48*rise)))/24,vh=Math.min(10.5,L/T);P.vx=dx/L*vh;P.vz=dz/L*vh} // the pad aims the launch at the next ledge
snd("jump",.7,1.5);Fx.burst({x:o.x,y:o.h+.2,z:o.z},0x4cff8a,16,5,.08,3,12);break}}
function frame(dt){
const c=st.course;if(!c||st.done||state!=="play")return;
if(P.fz<=0&&P.dead<=0){
st.t+=dt;
// record path for ghost (about 20 samples/sec, max ~2 min)
st.grecT+=dt;if(st.grecT>=.04&&st.rec.length<3000){st.grecT=0;st.rec.push({t:+st.t.toFixed(3),x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(3),air:P.gr?0:1,crouch:+(P.crouch||0).toFixed(2)})}
}
if(st.showGhost&&st.ghost)sampleGhost(st.t);
c.haz.material.uniforms.t.value+=dt;
const ea=c.emb.geometry.attributes.position,ev=c.ev,ep=ea.array;for(let i=0;i<ev.length;i++){ep[i*3+1]+=ev[i]*dt;ep[i*3]+=Math.sin(i+performance.now()/900)*dt*.5;if(ep[i*3+1]>16){ep[i*3+1]=.2;ep[i*3]=P.x+(Math.random()-.5)*60;ep[i*3+2]=P.z+(Math.random()-.5)*60}}ea.needsUpdate=true;
for(const g of c.gems)if(!g.got){g.m.rotation.y+=dt*2.2;g.m.position.y=g.y+Math.sin(performance.now()/380+g.x)*.12}
dynFrame(c,dt);
if(P.dead>0){P.dead-=dt;if(P.dead<=0)respawn();return}
if(P.fz>0)return;
st.maxY=Math.max(st.maxY,P.y);
// touching the floor means the lava: back to the last checkpoint
if(P.gr&&P.y<.35&&!P.mantle){
st.falls++;P.dead=.9;P.vx=P.vz=0;dmgFlash();snd("hurt",.7);Death.start({mini:1,len:.9,title:"FELL",kick:"Lava touched you",by:"Respawning at",who:{n:"Checkpoint "+(st.cp+1),tag:"LAVA",d:0},label:"Back to checkpoint"});
Fx.burst({x:P.x,y:.3,z:P.z},0xff7a2a,18,5,.09,3,14);flash("Back to checkpoint "+(st.cp+1),900);return}
for(let i=st.cp+1;i<c.cps.length;i++){
const p=c.cps[i];
if(P.gr&&Math.abs(P.x-p.x)<p.w/2&&Math.abs(P.z-p.z)<p.d/2&&Math.abs(P.y-p.y)<.5){
if(p.fin){st.done=true;st.cp=i;p.got=true;snd("win");
if(!S.pkt||typeof S.pkt!=="object")S.pkt={};if(!S.pkg||typeof S.pkg!=="object")S.pkg={};if(!S.pks||typeof S.pks!=="object")S.pks={};
const prev=S.pkt[pkK()],beat=prev==null||st.t<prev;
if(beat){S.pkt[pkK()]=+st.t.toFixed(2);S.pkg[pkK()]=st.rec.slice();S.pks[pkK()]={seed:WORLD.seed>>>0,theme:WORLD.theme};sv();
flash(prev==null?("First clear! "+st.t.toFixed(1)+"s"):("New best! "+st.t.toFixed(1)+"s (was "+(+prev).toFixed(1)+"s)"),2200)}
else flash("Finished in "+st.t.toFixed(1)+"s · Best "+(+prev).toFixed(1)+"s",2200);
clearGhost();if(beat){pkVictory(prev,st.t);return}return endGame(true)}
st.cp=i;p.got=true;p.b.material.color.setHex(0x4cff8a);p.b.material.opacity=.26;p.r.material.color.setHex(0x4cff8a);
flash(c.dj[i]?"Double jump ahead: press Space again in mid-air":"Checkpoint "+(i+1)+" / "+c.cps.length,c.dj[i]?2400:1200);snd("pick");Fx.burst({x:p.x,y:p.y+.5,z:p.z},0x4cff8a,14,4,.08,3,10)}}
for(const g of c.gems)if(!g.got&&Math.hypot(g.x-P.x,g.z-P.z)<1.1&&Math.abs(P.y+1-g.y)<1.6){
g.got=true;st.gems++;g.m.visible=false;snd("pick");flash("Gem "+st.gems+" / "+c.gems.length,900);Fx.burst({x:g.x,y:g.y,z:g.z},0xffd24a,16,4,.07,2,10)}}

function hud(){
const c=st.course;if(!c)return{top:"Parkour",sub:"",rows:[]};
const n=c.cps.length,nxt=c.cps[Math.min(st.cp+1,n-1)],fin=nxt.fin,dist=Math.round(Math.hypot(nxt.x-P.x,nxt.z-P.z));
let tm=st.t.toFixed(1)+"s";
if(st.best!=null){
if(st.racing){const delta=st.t-st.best,sign=delta>=0?"+":"";tm+=" · "+(st.showGhost?"Ghost ":"Best ")+(+st.best).toFixed(1)+"s ("+sign+delta.toFixed(1)+")"}
else tm+=" · Best "+(+st.best).toFixed(1)+"s";
}
return{top:tm,sub:"Checkpoint "+(st.cp+1)+"/"+n+" · "+(fin?"Finish ":"Next ")+dist+"m · Falls "+st.falls+" · Gems "+st.gems+"/"+c.gems.length+(c.dj[Math.min(st.cp,c.dj.length-1)]?" · DJ":"")+(st.showGhost?" · GHOST RACE":st.racing?" · TIME ATTACK":""),rows:[[S.name,Math.round(st.cp/(n-1)*100)+"%"]]}}

return{st,build,start,frame,hud,get course(){return st.course}}})();

// ---------- radar: a heading-up minimap in the bottom-left corner ----------
// The arena is baked once per map. Each frame draws it rotated around the player, then adds bots, monsters and party fighters. It is hidden in parkour.
const Radar=(()=>{
const RANGE=34,BK=4;
const pings=new Map(),PER=6.283/1.6;
let cv=null,g=null,bake=null,baked=null,acc=0,sweep=0,R=84,dpr=1,lastW=0,hid=false,sg=null,fg=null;
function size(){
const w=cv.clientWidth||168;if(w===lastW)return;lastW=w;R=w/2;dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.height=Math.round(w*dpr);sg=fg=null}
function rebake(){
baked=WORLD.group;
if(!bake){bake=document.createElement("canvas");bake.width=bake.height=2*H*BK}
const b=bake.getContext("2d");
b.clearRect(0,0,bake.width,bake.height);
b.fillStyle="rgba(70,92,84,.55)";b.fillRect(0,0,bake.width,bake.height);
const list=boxes.slice().sort((p,q)=>p.h-q.h);
for(const o of list){
const t=clamp(o.h/8,0,1);
b.fillStyle=o.h>3.5&&o.w>30?"rgba(30,36,48,.95)":"hsl(215,"+(10+t*14)+"%,"+(36+t*34)+"%)";
b.fillRect((o.x-o.w/2+H)*BK,(o.z-o.d/2+H)*BK,o.w*BK,o.d*BK)}
if(WORLD.zone){b.strokeStyle="rgba(255,255,255,.35)";b.lineWidth=2;b.beginPath();b.arc((WORLD.zone.x+H)*BK,(WORLD.zone.z+H)*BK,WORLD.zone.r*BK,0,6.283);b.stroke()}}
const ECOL={bot:"#ef4444"},MCOL=["#4ade80","#fbbf24","#fb7185"];
function dot(x,z,r,col){g.fillStyle=col;g.beginPath();g.arc(x,z,r,0,6.283);g.fill()}
function frame(dt){
if(!cv){cv=$("radar");if(!cv)return;g=cv.getContext("2d")}
const off=!!WORLD.course;if(off!==hid){hid=off;cv.style.display=off?"none":""}if(off)return;
acc+=dt;if(acc<(S.gfx>2?.066:.033))return;const prev=sweep;sweep=(sweep+acc*1.6)%6.283;acc=0;
size();if(baked!==WORLD.group&&WORLD.group)rebake();
const k=R/RANGE,k0=k;
g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,2*R,2*R);
g.save();g.beginPath();g.arc(R,R,R-1.5,0,6.283);g.clip();
g.fillStyle="rgba(8,12,24,.62)";g.fillRect(0,0,2*R,2*R);
g.save();g.translate(R,R);g.rotate(P.yaw);g.scale(k,k);g.translate(-P.x,-P.z);
if(bake)g.drawImage(bake,-H,-H,2*H,2*H);
const lim=RANGE*1.25,now=performance.now()/1000,cs=Math.cos(P.yaw),sn=Math.sin(P.yaw),adv=(sweep-prev+6.283)%6.283;
// like a real radar: nothing moves on the screen until the green sweep crosses it. A contact is logged where it stood when the beam passed, pulses once, and fades until the next pass
const hit=(x,z)=>{const vx=x-P.x,vz=z-P.z;let a=Math.atan2(vx*sn+vz*cs,vx*cs-vz*sn);if(a<0)a+=6.283;const r=(a-prev+6.283)%6.283;return r>0&&r<=adv};
for(const e of E){const p=e.g.position;if(e.hp<=0||Math.abs(p.x-P.x)>lim||Math.abs(p.z-P.z)>lim||!hit(p.x,p.z))continue;
const mon=e.t==="mon";pings.set(e,{x:p.x,z:p.z,t:now,col:mon?MCOL[e.k||0]:ECOL.bot,big:mon&&e.k===2,ring:mon||e.alert>0})}
if(PT.on)for(const f of PT.remotes.values()){if(f.dead||f.hp<=0||Math.abs(f.x-P.x)>lim||Math.abs(f.z-P.z)>lim||!hit(f.x,f.z))continue;
pings.set(f,{x:f.x,z:f.z,t:now,col:(PM_MODES[PT.mode]&&PM_MODES[PT.mode].team&&f.team===PT.team)?"#60a5fa":"#ef4444",big:0,ring:1})}
for(const [k,q] of pings){const age=Math.max(0,now-q.t);if(age>PER){pings.delete(k);continue}
const fade=1-.82*age/PER;g.globalAlpha=fade;dot(q.x,q.z,(q.big?5.4:4)/k0,q.col);
if(age<.9){g.strokeStyle=q.col;g.lineWidth=1.6/k0;g.globalAlpha=(1-age/.9)*.85;g.beginPath();g.arc(q.x,q.z,(4+age/.9*(q.ring?16:11))/k0,0,6.283);g.stroke()}
g.globalAlpha=1}
g.restore();
// range rings and cross hairs
g.strokeStyle="rgba(255,255,255,.12)";g.lineWidth=1;
for(const f of[.33,.66]){g.beginPath();g.arc(R,R,R*f,0,6.283);g.stroke()}
g.beginPath();g.moveTo(R,3);g.lineTo(R,2*R-3);g.moveTo(3,R);g.lineTo(2*R-3,R);g.stroke();
if(!document.body.classList.contains("lite")){
if(!sg){sg=g.createLinearGradient(0,0,R,0);sg.addColorStop(0,"rgba(110,255,190,0)");sg.addColorStop(1,"rgba(110,255,190,.28)")}
g.save();g.translate(R,R);g.rotate(sweep);g.fillStyle=sg;g.beginPath();g.moveTo(0,0);g.arc(0,0,R,-.5,0);g.closePath();g.fill();g.restore()}
// what you can see
const half=Math.min(1.05,Math.atan(Math.tan(cam.fov*.00872665)*cam.aspect));
if(!fg){fg=g.createRadialGradient(R,R,0,R,R,R*.95);fg.addColorStop(0,"rgba(255,255,255,.26)");fg.addColorStop(1,"rgba(255,255,255,0)")}
g.fillStyle=fg;g.beginPath();g.moveTo(R,R);g.arc(R,R,R*.95,-1.5708-half,-1.5708+half);g.closePath();g.fill();
g.restore();
// you
g.fillStyle="#fff";g.beginPath();g.moveTo(R,R-7);g.lineTo(R+5,R+5);g.lineTo(R,R+2);g.lineTo(R-5,R+5);g.closePath();g.fill();
// north follows the world as you turn
g.font="800 "+Math.round(R*.13)+"px Outfit,system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillStyle="rgba(255,255,255,.85)";
g.fillText("N",R+Math.sin(P.yaw)*(R-10),R-Math.cos(P.yaw)*(R-10))}
return{frame}})();

// ---------- map (M): the whole arena from above, north up, with every player, bot and monster on it ----------
// Plays on top of the live game (it never pauses it); in the pause screen it has a close button. Parkour shows the course platforms shaded by height.
const BigMap=(()=>{
let on=false,cv=null,g=null,ov=null,baked=null,bk=null,bkN=-1,bnd=null,raf=0,last=0,lastW=0,dpr=1;
const MC=["#4ade80","#fbbf24","#fb7185"],BAKE=720;
const modeName=()=>{if(PT.on&&PM_MODES[PT.mode])return PM_MODES[PT.mode].n;const m=MD.find(x=>x[0]===mode);return m?m[1]:"Arena"};
const mapName=()=>mode==="parkour"&&pkMap?pkMap.n:(THEMES[WORLD.theme]&&THEMES[WORLD.theme].n)||"Arena";
function bounds(){
if(!WORLD.course)return{cx:0,cz:0,half:H};
let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
for(const o of boxes){x0=Math.min(x0,o.x-o.w/2);x1=Math.max(x1,o.x+o.w/2);z0=Math.min(z0,o.z-o.d/2);z1=Math.max(z1,o.z+o.d/2)}
if(x0>x1)return{cx:0,cz:0,half:H};
return{cx:(x0+x1)/2,cz:(z0+z1)/2,half:Math.max(x1-x0,z1-z0)/2+7}}
function rebake(){
bnd=bounds();baked=WORLD.group;bkN=boxes.length;
if(!bk){bk=document.createElement("canvas");bk.width=bk.height=BAKE}
const b=bk.getContext("2d"),k=BAKE/(2*bnd.half),X=x=>(x-bnd.cx+bnd.half)*k,Z=z=>(z-bnd.cz+bnd.half)*k;
b.clearRect(0,0,BAKE,BAKE);b.fillStyle="rgba(58,78,72,.9)";b.fillRect(0,0,BAKE,BAKE);
b.strokeStyle="rgba(255,255,255,.07)";b.lineWidth=1;
const stepW=bnd.half>50?20:10;for(let v=-Math.floor(bnd.half/stepW)*stepW;v<=bnd.half;v+=stepW){const px=X(bnd.cx+v),pz=Z(bnd.cz+v);b.beginPath();b.moveTo(px,0);b.lineTo(px,BAKE);b.moveTo(0,pz);b.lineTo(BAKE,pz);b.stroke()}
let mh=1;for(const o of boxes)mh=Math.max(mh,o.h);
const list=boxes.slice().sort((p,q)=>p.h-q.h),pk_=!!WORLD.course;
for(const o of list){
const t=clamp(o.h/(pk_?mh:8),0,1);
b.fillStyle=pk_?"hsl("+(200-t*150)+",55%,"+(34+t*30)+"%)":(o.h>3.5&&o.w>30?"rgba(30,36,48,.95)":"hsl(215,"+(10+t*14)+"%,"+(36+t*34)+"%)");
b.fillRect(X(o.x-o.w/2),Z(o.z-o.d/2),Math.max(1.5,o.w*k),Math.max(1.5,o.d*k))}
if(WORLD.zone){b.strokeStyle="rgba(255,255,255,.5)";b.lineWidth=2.5;b.beginPath();b.arc(X(WORLD.zone.x),Z(WORLD.zone.z),WORLD.zone.r*k,0,6.283);b.stroke()}
b.strokeStyle="rgba(255,255,255,.35)";b.lineWidth=3;b.strokeRect(1.5,1.5,BAKE-3,BAKE-3)}
function size(){
const w=cv.clientWidth||480;if(w===lastW)return;lastW=w;dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.height=Math.round(w*dpr)}
function draw(){
if(!cv){cv=$("bigmap");ov=$("mapov");if(!cv)return;g=cv.getContext("2d")}
size();if(baked!==WORLD.group||bkN!==boxes.length)rebake();
const W=cv.width,k=W/(2*bnd.half),X=x=>(x-bnd.cx+bnd.half)*k,Z=z=>(z-bnd.cz+bnd.half)*k,u=dpr;
g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,W);g.drawImage(bk,0,0,W,W);
const dot=(x,z,r,col,ring)=>{g.fillStyle=col;g.beginPath();g.arc(X(x),Z(z),r*u,0,6.283);g.fill();if(ring){g.strokeStyle=col;g.globalAlpha=.45;g.lineWidth=1.5*u;g.beginPath();g.arc(X(x),Z(z),ring*u,0,6.283);g.stroke();g.globalAlpha=1}};
g.font="700 "+Math.round(10.5*u)+"px Outfit,system-ui,sans-serif";g.textAlign="center";g.textBaseline="bottom";
let nb=0,nm=0;
const c=WORLD.course;
if(c){
for(const s of c.cps||[])if(typeof s.x==="number")dot(s.x,s.z,4.2,"#55ddff");
for(const q of c.gems||[])if(!q.got)dot(q.x,q.z,2.6,"#ffd24a");
const f=c.cps&&c.cps[c.cps.length-1];if(f&&typeof f.x==="number"){dot(f.x,f.z,6.5,"#ffd24a",11);g.fillStyle="#fff";g.fillText("GOAL",X(f.x),Z(f.z)-9*u)}
try{const gh=PK.st.ghost;if(gh&&gh.visible)dot(gh.position.x,gh.position.z,4,"rgba(255,255,255,.55)")}catch(e){}}
else{
for(const e of E){if(e.hp<=0)continue;const p=e.g.position,mon=e.t==="mon";
if(mon){nm++;dot(p.x,p.z,e.boss?7:e.k===2?5:3.8,MC[e.k||0],e.boss?12:0);if(e.boss){g.fillStyle="#fff";g.fillText("BOSS",X(p.x),Z(p.z)-13*u)}}
else{nb++;dot(p.x,p.z,4.2,"#ef4444")}}
if(PT.on)for(const f of PT.remotes.values()){if(f.dead||f.hp<=0||!f.init)continue;nb++;
const fr=PT.coop||(PM_MODES[PT.mode]&&PM_MODES[PT.mode].team&&f.team===PT.team);
dot(f.x,f.z,5,fr?"#60a5fa":"#ef4444",9);g.fillStyle="#fff";g.fillText(String(f.name||"").slice(0,14),X(f.x),Z(f.z)-10*u)}}
// you, with the way you face
g.save();g.translate(X(P.x),Z(P.z));g.rotate(-P.yaw);g.fillStyle="#fff";g.strokeStyle="rgba(0,0,0,.6)";g.lineWidth=1.5*u;
g.beginPath();g.moveTo(0,-9*u);g.lineTo(6.5*u,7*u);g.lineTo(0,3.5*u);g.lineTo(-6.5*u,7*u);g.closePath();g.fill();g.stroke();g.restore();
g.fillStyle="#fff";g.fillText("YOU",X(P.x),Z(P.z)-12*u);
g.textBaseline="top";g.textAlign="center";g.font="800 "+Math.round(13*u)+"px Outfit,system-ui,sans-serif";g.fillStyle="rgba(255,255,255,.85)";g.fillText("N",W/2,6*u);
const s=$("maps"),pt=[];if(nm)pt.push(nm+" monster"+(nm===1?"":"s"));if(nb||!nm)pt.push(nb+" "+(PT.on?"player":"bot")+(nb===1?"":"s"));
if(s)s.textContent=c?"Height "+Math.max(0,Math.round(P.y))+" m · Falls "+PK.st.falls:pt.join(" · ")}
function loop(t){
if(!on)return;
if(state!=="play"&&state!=="pause"){close();return}
ov.classList.toggle("pm",state==="pause");
if(t-last>=33){last=t;try{draw()}catch(e){}}
raf=requestAnimationFrame(loop)}
function open(){
if(on||(state!=="play"&&state!=="pause")||!WORLD.group)return;
if(!cv){cv=$("bigmap");ov=$("mapov");if(!cv)return;g=cv.getContext("2d")}
on=true;lastW=0;$("mapt").textContent=modeName()+" · "+mapName();
const c=WORLD.course;
$("mapl").innerHTML=c?'<span><i style="background:#fff"></i>You</span><span><i style="background:#55ddff"></i>Checkpoint</span><span><i style="background:#ffd24a"></i>Gem / goal</span><span><i style="background:#fff;opacity:.55"></i>Ghost</span>':'<span><i style="background:#fff"></i>You</span><span><i style="background:#ef4444"></i>Enemy</span>'+(PT.on?'<span><i style="background:#60a5fa"></i>Team</span>':"")+'<span><i style="background:#4ade80"></i>Monsters</span>';
ov.classList.remove("hid");ov.classList.toggle("pm",state==="pause");cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);try{snd("ui",.5)}catch(e){}}
function close(){if(!on)return;on=false;cancelAnimationFrame(raf);if(ov)ov.classList.add("hid")}
return{open,close,toggle(){on?close():open()},get on(){return on},info:()=>[modeName(),mapName()]}})();
