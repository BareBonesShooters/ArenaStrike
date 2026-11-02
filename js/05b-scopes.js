"use strict";
// ---------- scopes: every gun has its own sight picture when you aim down it (hold or toggle right mouse) ----------
// fov: field of view while aiming. pip: a lens scope, drawn as a live picture inside the 3D scope on the gun (r = lens radius in vmin, used to crop the reticle). c: reticle colour.
// Open sights (pip off) are a 2D overlay of one SVG per sight kind (200 x 200 units) inside #scopeov.
const LENS_BASE=62; // field of view of the main view while you look through a lens scope: the world stays visible around the gun and only the lens is zoomed
const SCOPE_KINDS={
iron:{n:"Iron sights",fov:64,c:"#f4f4f5"},
rev:{n:"Big-bore sights",fov:62,c:"#fde68a"},
dot:{n:"Red dot",fov:54,c:"#ff3b4a"},
holo:{n:"Holographic sight",fov:48,c:"#ff4d5e"},
bead:{n:"Ghost ring",fov:66,c:"#fef3c7"},
acog:{n:"3x combat optic",fov:24,pip:1,r:25,c:"#ff4d4d"},
ring:{n:"Targeting ring",fov:50,c:"#ff6b6b"},
plasma:{n:"Energy sight",fov:52,c:"#67e8f9"},
aether:{n:"Aether sight",fov:54,c:"#f5f5f5"},
rail:{n:"5x rail scope",fov:14,pip:1,r:26,c:"#7dd3fc",tint:"rgba(80,190,255,.12)"},
scout:{n:"4x scout scope",fov:17,pip:1,r:27,c:"#101114"},
mark:{n:"6x marksman scope",fov:11,pip:1,r:28,c:"#101114"},
amr:{n:"12x long-range scope",fov:6,pip:1,r:30,c:"#101114"},
beam:{n:"8x beam scope",fov:9,pip:1,r:28,c:"#f0abfc",tint:"rgba(240,120,255,.1)"}};
const scopeKind=g=>g.scope&&g.d>=100?"amr":g.scope&&g.glow?"beam":g.scope?(g.base&&g.base.d<50?"scout":"mark"):g.coil?"rail":g.pel?"bead":
g.multi?"ring":g.glow?(g.st?"aether":"plasma"):g.pst?(g.a?"dot":g.d>=60?"rev":g.mg&&g.base&&g.base.d>=40?"rev":"iron"):
g.a&&g.mg&&!g.st?"dot":g.m>=60||(g.st&&!g.a)?"acog":g.a?"holo":"iron";
const scopeOf=g=>{if(!g)return SCOPE_KINDS.iron;if(!g._sc){const k=scopeKind(g);g._sc=Object.assign({k},SCOPE_KINDS[k])}return g._sc};

const Scope=(()=>{
const L=(x1,y1,x2,y2,w,cls)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="${w}"${cls?` class="${cls}"`:""}/>`;
const cross=(a,b,w,cls)=>L(100,100-b,100,100-a,w,cls)+L(100,100+a,100,100+b,w,cls)+L(100-b,100,100-a,100,w,cls)+L(100+a,100,100+b,100,w,cls);
const dots=(n,gap,r)=>{let s="";for(let i=1;i<=n;i++){const d=i*gap;s+=`<circle cx="${100+d}" cy="100" r="${r}"/><circle cx="${100-d}" cy="100" r="${r}"/><circle cx="100" cy="${100+d}" r="${r}"/><circle cx="100" cy="${100-d}" r="${r}"/>`}return s};
const SV={
// The illuminated point is exactly on the centre shot ray (100,100).
// Keep the post below it, rather than covering the target or pointing above it.
iron:`<g class="fl"><rect x="80" y="101" width="11" height="18" rx="1"/><rect x="109" y="101" width="11" height="18" rx="1"/><rect x="98.4" y="102" width="3.2" height="17" rx=".8"/></g><circle class="fw" cx="100" cy="100" r="1"/>`,
rev:`<g class="fl"><path d="M72 101h19v20H72zM109 101h19v20h-19z"/><rect x="97.6" y="102" width="4.8" height="19" rx="1"/></g><circle class="fw" cx="100" cy="100" r="1.3"/>`,
// a floating dot inside a thin ring: the glass is a window onto the world
dot:`<circle class="ln" cx="100" cy="100" r="17" stroke-width="2.4" fill="rgba(255,60,80,.05)"/><circle class="ln2" cx="100" cy="100" r="17" stroke-width=".5" fill="none"/><circle class="dt" cx="100" cy="100" r="1.9"/>`,
holo:`<circle class="ln2" cx="100" cy="100" r="24" fill="none" stroke-width="1.5"/>${L(100,72,100,64,1.6,"ln2")}${L(100,128,100,136,1.6,"ln2")}${L(72,100,64,100,1.6,"ln2")}${L(128,100,136,100,1.6,"ln2")}<circle class="dt" cx="100" cy="100" r="1.7"/>`,
// ghost ring and bead: wide, forgiving, made for close work
bead:`<circle class="ln" cx="100" cy="100" r="27" fill="none" stroke-width="3.2"/><circle class="ln2" cx="100" cy="100" r="27" fill="none" stroke-width=".7"/>${L(100,66,100,74,2,"ln2")}${L(100,126,100,134,2,"ln2")}${L(66,100,74,100,2,"ln2")}${L(126,100,134,100,2,"ln2")}<circle class="fw" cx="100" cy="100" r="2.8"/>`,
// a red chevron on a post and ladder: quick to read, built for bursts
acog:`<g class="ln2" fill="none" stroke-linecap="round">${cross(10,98,2.2,"th")}${L(100,100,90,116,1.8)}${L(100,100,110,116,1.8)}${L(78,124,122,124,1.1)}${L(86,134,114,134,1.1)}${L(92,144,108,144,1.1)}</g><circle class="dt" cx="100" cy="100" r="1.2"/>`,
ring:`<circle class="ln2" cx="100" cy="100" r="21" fill="none" stroke-width="2" stroke-dasharray="22 8"/>${cross(5,15,1.6,"ln2")}<circle class="dt" cx="100" cy="100" r="2"/>`,
plasma:`<g class="ln2" fill="none" stroke-linecap="round" stroke-width="2"><path d="M78 88V78h10M122 88V78h-10M78 112v10h10M122 112v10h-10"/></g><circle class="ln2" cx="100" cy="100" r="3.6" fill="none" stroke-width="1.3"/><circle class="dt" cx="100" cy="100" r="1.2"/>`,
aether:`<defs><linearGradient id="aeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0abfc"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#67e8f9"/></linearGradient></defs><g style="opacity:.9;filter:drop-shadow(0 0 .6px rgba(0,0,0,.55))" fill="none" stroke="url(#aeg)" stroke-linecap="round"><circle cx="100" cy="100" r="40" stroke-width=".6"/><circle class="spin" cx="100" cy="100" r="38" stroke-width=".7" stroke-dasharray="1.2 6" style="animation-duration:40s"/><path d="M133.8 112.3A36 36 0 0 1 112.3 133.8M66.2 87.7A36 36 0 0 1 87.7 66.2" stroke-width="1.3" style="animation:none"/><path d="M141.5 100.0L145.0 100.0M140.9 107.2L142.1 107.4M139.0 114.2L140.2 114.6M135.9 120.8L137.9 121.9M131.8 126.7L132.8 127.5M126.7 131.8L127.5 132.8M120.8 135.9L121.9 137.9M114.2 139.0L114.6 140.2M107.2 140.9L107.4 142.1M100.0 141.5L100.0 145.0M92.8 140.9L92.6 142.1M85.8 139.0L85.4 140.2M79.2 135.9L78.1 137.9M73.3 131.8L72.5 132.8M68.2 126.7L67.2 127.5M64.1 120.8L62.1 121.9M61.0 114.2L59.8 114.6M59.1 107.2L57.9 107.4M58.5 100.0L55.0 100.0M59.1 92.8L57.9 92.6M61.0 85.8L59.8 85.4M64.1 79.2L62.1 78.1M68.2 73.3L67.2 72.5M73.3 68.2L72.5 67.2M79.2 64.1L78.1 62.1M85.8 61.0L85.4 59.8M92.8 59.1L92.6 57.9M100.0 58.5L100.0 55.0M107.2 59.1L107.4 57.9M114.2 61.0L114.6 59.8M120.8 64.1L121.9 62.1M126.7 68.2L127.5 67.2M131.8 73.3L132.8 72.5M135.9 79.2L137.9 78.1M139.0 85.8L140.2 85.4M140.9 92.8L142.1 92.6" stroke-width=".8"/><path d="M147.5 97.6l2.4 2.4-2.4 2.4-2.4-2.4zM100.0 145.1l2.4 2.4-2.4 2.4-2.4-2.4zM52.5 97.6l2.4 2.4-2.4 2.4-2.4-2.4zM100.0 50.1l2.4 2.4-2.4 2.4-2.4-2.4z" stroke-width="1" fill="rgba(240,171,252,.5)"/></g><g style="opacity:.85"><path class="ln2" style="filter:none" d="M100 91.5v4.5M100 104v4.5M91.5 100h4.5M104 100h4.5" fill="none" stroke-width=".8"/><circle class="dt" style="filter:none" cx="100" cy="100" r="1"/></g>`,
// the long guns: duplex crosshair, mil dots, stadia ladders
rail:`<g class="ln2" fill="none" stroke-linecap="round">${cross(5,100,.8)}${cross(8,22,1.8)}${L(92,88,108,88,.9)}${L(94,76,106,76,.9)}${L(88,112,112,112,.9)}${L(94,124,106,124,.9)}<path d="M64 100v-5M64 100v5M136 100v-5M136 100v5" stroke-width=".9"/></g><circle class="dt" cx="100" cy="100" r="1.1"/>`,
scout:`<g class="rt">${cross(22,100,3.2)}${cross(3,22,.8)}</g>`,
mark:`<g class="rt">${cross(30,100,3)}${cross(3,30,.7)}<g class="rtd">${dots(3,8,1.5)}</g></g>`,
amr:`<g class="rt">${cross(34,100,3.4)}${cross(3,34,.7)}${[8,16,24,32].map((d,i)=>L(100-5-i*1.5,100+d,100+5+i*1.5,100+d,.8)+L(100-5-i*1.5,100-d,100+5+i*1.5,100-d,.8)+L(100+d,100-5-i*1.5,100+d,100+5+i*1.5,.8)+L(100-d,100-5-i*1.5,100-d,100+5+i*1.5,.8)).join("")}</g>`,
beam:`<g class="ln2" fill="none" stroke-linecap="round">${cross(4,100,.7)}<circle cx="100" cy="100" r="11" stroke-width="1"/><circle cx="100" cy="100" r="30" stroke-width=".6" stroke-dasharray="2 4"/>${L(100,100-30,100,100-34,1.4)}${L(100,100+30,100,100+34,1.4)}${L(100-30,100,100-34,100,1.4)}${L(100+30,100,100+34,100,1.4)}</g><circle class="dt" cx="100" cy="100" r="1.4"/>`};
let el=null,key="",on=false;
function render(g){
el=el||document.getElementById("scopeov");if(!el)return;
const s=scopeOf(g),k=s.k+"|"+g.id;if(k===key)return;key=k;
el.dataset.k=s.k;el.style.setProperty("--rc",s.c);
el.innerHTML=`${s.pip?"":`<svg viewBox="0 0 200 200" aria-hidden="true">${SV[s.k]||SV.iron}</svg>`}<u class="nm">${s.n}</u>`}
// the sight picture is up once the aim has mostly arrived; the name card shows for a moment on each new aim
function frame(g,scoped,fov){
render(g);const a=!!scoped&&VM.ads>.65;
if(a!==on){on=a;document.body.classList.toggle("scoping",a);if(a&&el){el.classList.remove("nm-on");void el.offsetWidth;el.classList.add("nm-on")}}
return a}

// ---------- lens scopes: a second, zoomed camera renders into a small texture that is the glass of the 3D scope on the gun ----------
const RS=c=>`<style>.ln{stroke:rgba(0,0,0,.8)}.ln2,.ln2 path,.ln2 circle{stroke:${c}}.ln2 path.th{stroke-width:2.6}.dt{fill:${c}}.fl{fill:#16181d;stroke:rgba(255,255,255,.5);stroke-width:.8}.fw{fill:${c};stroke:#000;stroke-width:.9}.rt path{stroke:${c};fill:none}.rtd circle{fill:${c}}</style>`;
const ret={};let rt=null,zc=null,picM=null,picOn=false;
// the reticle is drawn once per scope kind (SVG to canvas to texture), cropped to the lens and finished with a soft edge shadow
function retTex(s){
if(ret[s.k])return ret[s.k];
const c=document.createElement("canvas");c.width=c.height=512;const x=c.getContext("2d"),t=new T.CanvasTexture(c);ret[s.k]=t;
const ru=s.r*2,img=new Image();
img.onload=()=>{x.clearRect(0,0,512,512);x.save();x.beginPath();x.arc(256,256,256,0,6.2832);x.clip();
if(s.tint){x.fillStyle=s.tint;x.fillRect(0,0,512,512)}
x.drawImage(img,0,0,512,512);
const g=x.createRadialGradient(256,256,140,256,256,256);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.82,"rgba(0,0,0,.16)");g.addColorStop(1,"rgba(0,0,0,.6)");x.fillStyle=g;x.fillRect(0,0,512,512);x.restore();t.needsUpdate=true};
img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${100-ru} ${100-ru} ${ru*2} ${ru*2}" width="512" height="512">${RS(s.c)}${SV[s.k]||""}</svg>`);
return t}
function ensure(){
if(rt)return;
const n=S.gfx>=2?320:448;
rt=new T.WebGLRenderTarget(n,n,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,depthBuffer:true});
zc=new T.PerspectiveCamera(20,1,cam.near,cam.far);
picM=new T.MeshBasicMaterial({map:rt.texture,color:0x06090e,toneMapped:false})}
// called once per gun build: puts the glass (picture plus reticle) into the rear of the gun's own scope tube
function buildLens(gb,g){
const s=scopeOf(g);if(!gb||!gb.lens||!s.pip)return;
ensure();const L=gb.lens,geo=new T.CircleGeometry(L.r,40),grp=new T.Group();
const p=new T.Mesh(geo,picM),q=new T.Mesh(geo,new T.MeshBasicMaterial({map:retTex(s),transparent:true,depthWrite:false,toneMapped:false}));
q.position.z=.0007;grp.add(p,q);grp.position.set(L.x||0,L.y,L.z);gb.grp.add(grp);gb.lensG=grp}
// per frame, after the main view is drawn and before the gun is: show the zoomed picture in the glass while aiming
function lens(g){
const s=scopeOf(g),gb=VM.gb,on=!!(s.pip&&gb&&gb.lensG&&VM.ads>.2&&!Death.active);
if(on!==picOn&&picM){picOn=on;picM.color.setHex(on?0xffffff:0x06090e)}
if(!on||!rt)return;
zc.fov=s.fov;zc.near=cam.near;zc.far=cam.far;zc.updateProjectionMatrix();
zc.position.copy(cam.position);zc.quaternion.copy(cam.quaternion);zc.updateMatrixWorld(true);
const ac=rd.autoClear;rd.autoClear=true;rd.setRenderTarget(rt);rd.render(sc,zc);rd.setRenderTarget(null);rd.autoClear=ac}
// mouse speed follows what the lens shows, not the wide main view behind it
function sensFov(f){const s=scopeOf(typeof cg==="function"?cg():null);return s.pip?f+(s.fov-f)*clamp(VM.ads,0,1):f}
return{frame,render,buildLens,lens,sensFov,get on(){return on}}})();

