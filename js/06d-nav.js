// ---------- Nav: a flow field over the arena so monsters walk around walls and crates instead of pushing into them, and hop up ledges they cannot step onto ----------
const Nav=(()=>{
const CS=1,N=Math.round(2*H/CS),NN=N*N,WR=.7,STEPUP=.9,HOPMAX=1.8;
const fl=new Float32Array(NN),ok=new Uint8Array(NN),cost=new Float32Array(NN),nxt=new Int32Array(NN),W={x:0,z:0,y:0,hop:0,rise:0};
let bx=null,bl=0,loc=[],goal=-1,stamp=0;
const cell=v=>Math.max(0,Math.min(N-1,Math.floor((v+H)/CS))),ctr=i=>-H+(i+.5)*CS;
const DX=[1,-1,0,0,1,1,-1,-1],DZ=[0,0,1,-1,1,-1,1,-1];
// every grid cell remembers the few boxes that can touch it, so building and querying stay cheap
function build(){
loc=new Array(NN);for(let i=0;i<NN;i++)loc[i]=[];
const m=WR+.4;
for(const b of boxes){const x0=cell(b.x-b.w/2-m),x1=cell(b.x+b.w/2+m),z0=cell(b.z-b.d/2-m),z1=cell(b.z+b.d/2+m);for(let cz=z0;cz<=z1;cz++)for(let cx=x0;cx<=x1;cx++)loc[cz*N+cx].push(b)}
for(let i=0;i<NN;i++){
const x=ctr(i%N),z=ctr((i/N)|0),L=loc[i];let f=0;
for(const b of L)if(!b.nc&&b.h>f&&Math.abs(x-b.x)<b.w/2+.3&&Math.abs(z-b.z)<b.d/2+.3)f=b.h;
fl[i]=f;let good=Math.abs(x)<H-1.3&&Math.abs(z)<H-1.3;
if(good){const y=f+.05;for(const b of L)if((b.nc?y<b.h+2.2:y<b.h-STEP)&&Math.abs(x-b.x)<b.w/2+WR&&Math.abs(z-b.z)<b.d/2+WR){good=false;break}}
ok[i]=good?1:0}}
// breadth-first from the player's cell: every reachable cell learns which neighbour leads toward the player
function flow(){
cost.fill(1e9);nxt.fill(-1);cost[goal]=0;const q=[goal];
for(let qi=0;qi<q.length;qi++){const a=q[qi],ax=a%N,az=(a/N)|0,ca=cost[a];
for(let d=0;d<8;d++){
const nx=ax+DX[d],nz=az+DZ[d];if(nx<0||nz<0||nx>=N||nz>=N)continue;
const n=nz*N+nx;if(!ok[n])continue;
const dg=d>=4;if(dg&&(!ok[az*N+nx]||!ok[nz*N+ax]))continue;
const up=fl[a]-fl[n];let c=ca+(dg?1.41:1);
if(up>STEPUP){if(a!==goal&&(up>HOPMAX||dg))continue;if(dg)continue;c+=6}
if(c<cost[n]-.001){cost[n]=c;nxt[n]=a;q.push(n)}}}}
function ensure(){
if(boxes!==bx||boxes.length!==bl){bx=boxes;bl=boxes.length;build();goal=-1}
const g=cell(P.z)*N+cell(P.x),now=performance.now();
if(g!==goal&&now-stamp>260){goal=g;stamp=now;flow()}}
// a straight run between two cells is fine when every cell on the way is open and about as high as where we start
function clear(x0,z0,x1,z1,f0){const dx=x1-x0,dz=z1-z0,n=Math.ceil(Math.hypot(dx,dz)/.35);for(let k=1;k<n;k++){const i=cell(z0+dz*k/n)*N+cell(x0+dx*k/n);if(!ok[i]||Math.abs(fl[i]-f0)>STEPUP)return false}return true}
// where should an entity standing at (x,z) head next? null when it is already at the player's cell or cannot reach it
function next(x,z){
ensure();if(goal<0)return null;
const i=cell(z)*N+cell(x);if(i===goal||cost[i]>=1e8)return null;
let b=nxt[i];if(b<0)return null;
const rise=fl[b]-fl[i];
if(rise>STEPUP){W.x=ctr(b%N);W.z=ctr((b/N)|0);W.y=fl[b];W.rise=rise;W.hop=rise<=HOPMAX?1:0;return W}
let s=1;
while(s<7&&b!==goal){const c=nxt[b];if(c<0||fl[c]-fl[b]>STEPUP)break;if(!clear(x,z,ctr(c%N),ctr((c/N)|0),fl[i]))break;b=c;s++}
W.x=ctr(b%N);W.z=ctr((b/N)|0);W.y=fl[b];W.rise=0;W.hop=0;return W}
// the cell n steps further along the route, used to leap a monster that has been stuck for a while
function ahead(x,z,n){
ensure();if(goal<0)return null;
let i=cell(z)*N+cell(x);if(cost[i]>=1e8)return null;
for(let k=0;k<n&&i!==goal&&nxt[i]>=0;k++)i=nxt[i];
W.x=ctr(i%N);W.z=ctr((i/N)|0);W.y=fl[i];W.rise=0;W.hop=0;return W}
function hopStart(e,tx,tz,ty,rise,dur){
const p=e.g.position;
e.hop={t:0,d:dur||.6,sx:p.x,sz:p.z,sy:p.y-(e.yo||0),tx,tz,ty,hh:Math.max(.9,(rise||0)*.55+.7)};
snd("land",.25)}
function hopStep(e,dt){
const h=e.hop,g=e.g,p=g.position,u=g.userData;h.t+=dt;
const k=Math.min(1,h.t/h.d);
p.x=h.sx+(h.tx-h.sx)*k;p.z=h.sz+(h.tz-h.sz)*k;p.y=h.sy+(h.ty-h.sy)*k+Math.sin(k*Math.PI)*h.hh;
g.rotation.y=turnTo(g.rotation.y,Math.atan2(h.tx-h.sx,h.tz-h.sz),dt*14);
const up=Math.sin(k*Math.PI);
u.legs[0].rotation.x=-.5-up*.6;u.legs[1].rotation.x=.3+up*.5;
u.arms[0].rotation.x=u.arms[1].rotation.x=-2.5*up-.3;u.arms[0].rotation.z=.1;u.arms[1].rotation.z=-.1;
u.torso.rotation.x=.1+(k<.5?.25:-.1)*up;
if(k>=1){e.hop=null;e.yo=0;p.y=h.ty;e.hc=.5;e.sx=p.x;e.sz=p.z;e.sT=.4;
Fx.burst({x:p.x,y:p.y+.1,z:p.z},0xbfae8c,8,3,.08,1,10);snd("land",.4)}}
return{next,ahead,hopStart,hopStep,ensure,reset:()=>{stamp=0;goal=-1},dbg:()=>({N,ok,fl,cost,nxt,goal})}})();
