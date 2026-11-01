"use strict";
// ---------- world: collision ----------
const H=40,STEP=.55;
const SOFTDOT=(()=>{const c=document.createElement("canvas");c.width=c.height=32;const g=c.getContext("2d"),q=g.createRadialGradient(16,16,0,16,16,16);q.addColorStop(0,"rgba(255,255,255,1)");q.addColorStop(.4,"rgba(255,255,255,.55)");q.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=q;g.fillRect(0,0,32,32);return new T.CanvasTexture(c)})();
let boxes=[],WORLD={course:null,zone:null,spawns:[],theme:"meadow",seed:0,group:null,ceil:0,lights:[],dust:null,dv:null,flames:null};
function blocked(x,z,y,r){for(let i=0;i<boxes.length;i++){const b=boxes[i];if((b.nc?y<b.h+2.2:y<b.h-STEP)&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return true}return false}
function floorAt(x,z,y){let f=typeof CustomBattle!=="undefined"&&CustomBattle.active?CustomBattle.groundHeight(x,z):0;for(let i=0;i<boxes.length;i++){const b=boxes[i];if(!b.nc&&b.h>f&&y>=b.h-STEP&&Math.abs(x-b.x)<b.w/2+.3&&Math.abs(z-b.z)<b.d/2+.3)f=b.h}return f}
// distance along a ray to the first world surface (boxes, ground, ceiling)
function rayWorld(ox,oy,oz,dx,dy,dz,max){
const custom=typeof CustomBattle!=="undefined"&&CustomBattle.active;
let best=custom?CustomBattle.rayGround(ox,oy,oz,dx,dy,dz,max):max;
if(!custom&&dy<-1e-6){const t=-oy/dy;if(t>0&&t<best)best=t}
if(WORLD.ceil&&dy>1e-6){const t=(WORLD.ceil-oy)/dy;if(t>0&&t<best)best=t}
for(let i=0;i<boxes.length;i++){const b=boxes[i];let t0=0,t1=best,ok=true,lo,hi,t,u;
if(Math.abs(dx)<1e-9){if(ox<b.x-b.w/2||ox>b.x+b.w/2)continue}else{lo=(b.x-b.w/2-ox)/dx;hi=(b.x+b.w/2-ox)/dx;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(Math.abs(dy)<1e-9){if(oy<0||oy>b.h)continue}else{lo=-oy/dy;hi=(b.h-oy)/dy;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(Math.abs(dz)<1e-9){if(oz<b.z-b.d/2||oz>b.z+b.d/2)continue}else{lo=(b.z-b.d/2-oz)/dz;hi=(b.z+b.d/2-oz)/dz;if(lo>hi){u=lo;lo=hi;hi=u}if(lo>t0)t0=lo;if(hi<t1)t1=hi}
if(t0>t1)continue;
if(t0>1e-4&&t0<best)best=t0}
return best}

// ---------- world: geometry batching ----------
const NM3=new T.Matrix3(),V0=new T.Vector3(),C0=new T.Color(),M4=new T.Matrix4(),Q0=new T.Quaternion(),E0=new T.Euler(),S0=new T.Vector3(),T0=new T.Vector3();
const mt=(x,y,z,sx,sy,sz,ry,rx,rz)=>{E0.set(rx||0,ry||0,rz||0);Q0.setFromEuler(E0);T0.set(x,y,z);S0.set(sx,sy,sz);return M4.compose(T0,Q0,S0)};
const U=(()=>{
const fix=tris=>{const p=[];for(let i=0;i<tris.length;i+=3){const a=tris[i],b=tris[i+1],c=tris[i+2];
const n=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];
const m=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];
if(n[0]*m[0]+n[1]*m[1]+n[2]*m[2]<0)p.push(...a,...c,...b);else p.push(...a,...b,...c)}
const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g};
const pyr=fix([[-.5,-.5,-.5],[.5,-.5,-.5],[0,.5,0],[.5,-.5,-.5],[.5,-.5,.5],[0,.5,0],[.5,-.5,.5],[-.5,-.5,.5],[0,.5,0],[-.5,-.5,.5],[-.5,-.5,-.5],[0,.5,0],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]);
const A=[-.5,-.5,-.5],B=[.5,-.5,-.5],C=[.5,-.5,.5],D=[-.5,-.5,.5],R1=[0,.5,-.5],R2=[0,.5,.5];
// the underside is part of the mesh: without it the eaves are see-through from the ground
const gab=fix([A,D,R2,A,R2,R1,B,R1,R2,B,R2,C,D,C,R2,A,R1,B,A,B,C,A,C,D]);
return{box:new T.BoxGeometry(1,1,1).toNonIndexed(),cyl:new T.CylinderGeometry(.5,.5,1,12,1).toNonIndexed(),cone:new T.ConeGeometry(.5,1,9,1).toNonIndexed(),
ico:new T.IcosahedronGeometry(.5,0).toNonIndexed(),sph:new T.SphereGeometry(.5,10,8).toNonIndexed(),pyr,gab}})();
class Batch{
constructor(){this.p=[];this.n=[];this.c=[]}
add(g,m,col,ao,br){const pa=g.attributes.position,na=g.attributes.normal,nm=NM3.getNormalMatrix(m);C0.set(col);const r=C0.r*br,gg=C0.g*br,b=C0.b*br;
for(let i=0;i<pa.count;i++){V0.set(pa.getX(i),pa.getY(i),pa.getZ(i));const sh=ao+(1-ao)*(V0.y+.5);V0.applyMatrix4(m);this.p.push(V0.x,V0.y,V0.z);
V0.set(na.getX(i),na.getY(i),na.getZ(i)).applyMatrix3(nm).normalize();this.n.push(V0.x,V0.y,V0.z);this.c.push(r*sh,gg*sh,b*sh)}}
mesh(mat){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(this.p,3));g.setAttribute("normal",new T.Float32BufferAttribute(this.n,3));g.setAttribute("color",new T.Float32BufferAttribute(this.c,3));return new T.Mesh(g,mat)}}

// ---------- world: themes ----------
const THEMES={
meadow:{n:"Meadow",sky:[0x2f7bff,0x8cc8ff,0xe0f0ff],cloud:.9,cc:[1,1,1],stars:0,sun:{c:0xfff0d0,i:.8,d:[.5,.75,.35]},hemi:[0xdcecff,0x7a9a5a,.78],fog:[0xcfe4f7,55,190],
gr:{base:"#5da34a",v:["#4e9440","#6bb356","#589f47","#74bb5c"],path:"#cbb78d",edge:"#a99668",plaza:"#d8d0bf"},wall:0xcfc8b8,trim:0x8d8672,
house:[0xf3e3c8,0xf0c9a0,0xdbe6f2,0xf2b8b0,0xcfe3c9],roof:[0xb4513b,0x7d8aa6,0x8f5a44,0x3f5f8a],leaf:[0x3f8f3c,0x4aa044,0x2f7a3a,0x5fae48],trunk:0x7a5230,pine:.2,
mount:[0x7189a0,0x8aa0b4],snow:.5,win:0xbfe6ff,lamp:0xfff3a0,night:0,flower:[0xff6b9a,0xffd23f,0xffffff,0xb48cff]},
sunset:{n:"Sunset",sky:[0x24285e,0xd05a7a,0xffb070],cloud:.8,cc:[1,.72,.55],stars:0,sun:{c:0xffb066,i:.9,d:[.85,.3,.4]},hemi:[0xffc9a0,0x6a4a5a,.62],fog:[0xf0a07c,40,175],
gr:{base:"#7b8a4a",v:["#6d7d40","#8a9650","#6a7a3e","#9aa357"],path:"#b69069",edge:"#8f6c4c",plaza:"#c7b09a"},wall:0xc9b0a0,trim:0x7a5a4e,
house:[0xf0d0b0,0xe8b898,0xd8c0c8,0xf0a890,0xe0d4a8],roof:[0x8f3a3a,0x5a3a5a,0x7a4a3a,0x3a4a6a],leaf:[0x5a7a2a,0x7a8a2f,0x4a6a2a,0x8a8f35],trunk:0x6a4428,pine:.25,
mount:[0x5a4a7a,0x7a5a7a],snow:0,win:0xffd27a,lamp:0xffd27a,night:.3,flower:[0xff7a5a,0xffd23f,0xffa0c8,0xffffff]},
frost:{n:"Frostbite",sky:[0x6b93c4,0xb4cfe8,0xeef5fb],cloud:.6,cc:[1,1,1],stars:0,sun:{c:0xe8f0ff,i:.8,d:[.4,.62,.5]},hemi:[0xe4efff,0xaab8c8,.82],fog:[0xdce9f5,35,160],
gr:{base:"#e9f1f7",v:["#dce8f2","#f3f8fb","#cfe0ee","#e2edf5"],path:"#b7c6d3",edge:"#97a9b9",plaza:"#cfdbe6"},wall:0xb9c8d6,trim:0x6f8294,
house:[0xcfdce8,0xe8d9c8,0xb7c9d9,0xd9c3bd],roof:[0x4b5d72,0x7b8fa6,0x9a4b4b,0x35506a],leaf:[0x2d5e4a,0x3a7058,0x24503f],trunk:0x5a4030,pine:.92,
mount:[0xa9bdd0,0xc4d3e2],snow:1,win:0xffe6a8,lamp:0xcfe8ff,night:0,flower:[0x9ac8ff,0xffffff,0xc8e0ff,0xffc0d0]},
neon:{n:"Neon Night",sky:[0x03010d,0x1a0a3a,0x5a1a80],cloud:0,cc:[1,1,1],stars:1,sun:{c:0xff4fd8,i:.5,d:[-.45,.4,-.8]},hemi:[0x6a5ad0,0x1a1030,.95],fog:[0x1a0a3a,30,150],
gr:{base:"#0d1020",v:["#12162c","#0a0c1a","#161a34"],path:"#1a1f3c",edge:"#00f0ff",plaza:"#141a38"},wall:0x2a2f5a,trim:0x00f0ff,
house:[0x2a3162,0x3a2a6a,0x1f3a6a,0x4a2a5a],roof:[0x151a3a,0x2a1a4a,0x102a4a],leaf:[0x10c8a0,0x2a8aff,0xb040ff],trunk:0x2a2f5a,pine:0,crystal:1,
mount:[0x20104a,0x2a1060],snow:0,win:0xff6ad8,lamp:0x00f0ff,night:1,flower:[0x00f0ff,0xff2fd0,0x7cff4f,0xffe14a]},
desert:{n:"Dunes",sky:[0x3a7bd5,0x9ccbea,0xfbe8c4],cloud:.35,cc:[1,.97,.9],stars:0,sun:{c:0xfff0c0,i:.95,d:[.3,.85,.4]},hemi:[0xfff0d0,0xb08a58,.85],fog:[0xf2dcae,50,185],
gr:{base:"#dcc08a",v:["#d2b47a","#e6cd9a","#cfb078","#e0c590"],path:"#bfa070",edge:"#a08558",plaza:"#e8d7b0"},wall:0xd9c29a,trim:0x8a6b45,
house:[0xe8d2a8,0xdcb888,0xf0dcb8,0xd4a878],roof:[0xa8572e,0x8a6a45,0xc08a52,0x6a4a35],leaf:[0x6f8a3a,0x8a9a45,0x5f7a35],trunk:0x7a5a38,pine:0,
mount:[0xc09a68,0xd4ae7c],snow:0,win:0x8fd4ff,lamp:0xffe2a0,night:0,flower:[0xff9a3a,0xffd23f,0xffe9b0,0xe86a5a]},
autumn:{n:"Autumn",sky:[0x4a78b8,0xb8c8d8,0xf6e6cf],cloud:.8,cc:[1,.95,.9],stars:0,sun:{c:0xffe0b0,i:.8,d:[.55,.55,.3]},hemi:[0xffe6c8,0x7a5a3a,.75],fog:[0xe6d2b8,45,175],
gr:{base:"#8a8a3a",v:["#7e7e32","#9a9644","#8a7a30","#a08a3c"],path:"#b49a70",edge:"#947a52",plaza:"#d0c0a4"},wall:0xcbb8a0,trim:0x7a5a42,
house:[0xf0d8b8,0xe8c4a0,0xd8d0c0,0xe8b898],roof:[0x8a3a2a,0x6a4a3a,0x9a5a30,0x4a4a5a],leaf:[0xd8742a,0xc8541f,0xe0a030,0xa8381f],trunk:0x6a4428,pine:.1,
mount:[0x8a6a5a,0xa08068],snow:0,win:0xffd890,lamp:0xffd890,night:.1,flower:[0xe85a2a,0xffb02f,0xffe070,0xc8402a]},
toxic:{n:"Toxic Dusk",sky:[0x050f0a,0x143a22,0x4a8a30],cloud:.3,cc:[.7,1,.6],stars:.6,sun:{c:0x9aff6a,i:.5,d:[-.4,.45,-.7]},hemi:[0x6ad07a,0x102a18,.9],fog:[0x143a22,28,140],
gr:{base:"#13251a",v:["#18301f","#0f1d15","#1d3824"],path:"#1f3a2a",edge:"#7cff4f",plaza:"#18301f"},wall:0x2a4a38,trim:0x7cff4f,
house:[0x2a4a3a,0x2a3a4a,0x3a4a2a,0x1f4a42],roof:[0x15281d,0x1a2a3a,0x22301a],leaf:[0x7cff4f,0x3aff9a,0xc8ff3a],trunk:0x2a3a30,pine:0,crystal:1,
mount:[0x18301f,0x1f4028],snow:0,win:0xb8ff4f,lamp:0x7cff4f,night:1,flower:[0x7cff4f,0xffe14a,0x3affd0,0xff6ad8]},
ruin:{n:"Ruined Hall",sky:[0x0a0b10,0x14161c,0x1b1d24],cloud:0,cc:[1,1,1],stars:0,sun:{c:0x9fb4d0,i:.3,d:[.2,.9,.1]},hemi:[0x8a94a8,0x3a3d45,.7],fog:[0x14161c,10,60],
gr:{base:"#3d4048",v:["#33363d","#454952"],path:"#2c2e35",edge:"#222",plaza:"#3a3d45"},wall:0x5a606c,trim:0x3a3d46,
house:[0x6b7280],roof:[0x4b5563],leaf:[0x4b5563],trunk:0x4b5563,pine:0,mount:[0x20222a],snow:0,win:0x60a5fa,lamp:0xffc477,night:1,flower:[0x7c6f64]}};
const OUTDOOR=["meadow","sunset","frost","neon","desert","autumn","toxic"];

// ---------- world: sky ----------
const Sky=(()=>{
const u={cT:{value:new T.Color()},cM:{value:new T.Color()},cH:{value:new T.Color()},cc:{value:new T.Color()},sunDir:{value:new T.Vector3(0,1,0)},sunCol:{value:new T.Color()},stars:{value:0},cloud:{value:0},time:{value:0},cq:{value:2}};
const m=new T.Mesh(new T.SphereGeometry(300,24,16),new T.ShaderMaterial({uniforms:u,side:T.BackSide,depthWrite:false,fog:false,
vertexShader:"varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
fragmentShader:`varying vec3 vD;uniform vec3 cT,cM,cH,cc,sunDir,sunCol;uniform float stars,cloud,time,cq;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p,int o){float a=.5,s=0.;for(int i=0;i<4;i++){if(i>=o)break;s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){vec3 d=normalize(vD);float h=d.y,t=max(h,0.);vec3 L=normalize(sunDir);
vec3 col=mix(cH,cM,smoothstep(0.,.32,t));col=mix(col,cT,smoothstep(.22,.95,t)*.95);col=mix(col,cH,pow(1.-t,6.)*.55);
float sd=max(dot(d,L),0.);
col+=sunCol*(pow(sd,1200.)*3.5+pow(sd,60.)*.3+pow(sd,7.)*.14)*(.35+.65*smoothstep(-.05,.2,L.y));
col+=sunCol*pow(sd,3.)*pow(1.-t,3.)*.12;
if(h<0.)col=cH*(1.+h*.4);
if(cloud>0.&&h>.012){
vec2 uv=d.xz/(h*.9+.2)*1.5+vec2(time*.010,time*.0035);float n=fbm(uv,4),cov=smoothstep(.5,.8,n),lit;
if(cq>1.5){float l=fbm(uv+L.xz*.09,3);lit=clamp(.62+(n-l)*2.6,0.,1.);}else lit=1.-smoothstep(.55,.95,n)*.4;
vec3 cl=mix(cc*.6,cc*1.04,lit)+sunCol*.22*pow(sd,6.)*lit;
col=mix(col,cl,cov*cloud*smoothstep(.012,.25,h)*.92);
if(cq>1.5){float c2=fbm(d.xz/(h+.1)*.55+vec2(time*.006,17.),3);col=mix(col,cc,smoothstep(.6,.9,c2)*.18*cloud*smoothstep(.1,.5,h));}}
if(stars>0.&&h>0.){vec2 uv=d.xz/(h+.12)*46.;float s=h21(floor(uv));float tw=.6+.4*sin(time*2.+s*60.);col+=step(.982,s)*stars*tw*(.35+.65*h21(floor(uv)+3.))*smoothstep(0.,.2,h);}
col+=(h21(gl_FragCoord.xy)-.5)/255.;
gl_FragColor=vec4(col,1.);}`}));
m.renderOrder=-10;m.frustumCulled=false;sc.add(m);
return{m,u,set(th){u.cT.value.setHex(th.sky[0]);u.cM.value.setHex(th.sky[1]);u.cH.value.setHex(th.sky[2]).lerp(C0.setHex(th.fog[0]),th.night?0:.65);u.cc.value.setRGB(th.cc[0],th.cc[1],th.cc[2]);u.sunDir.value.set(...th.sun.d);u.sunCol.value.setHex(th.sun.c);u.stars.value=th.stars;u.cloud.value=LOD.cloud>0?th.cloud:0;u.cq.value=LOD.cloud}}})();

// ---------- world: ground texture ----------
let GROADS=[];
function paintGround(key,th,rng){GROADS=[];
const N=LOD.tex,qs=N/2048,c=document.createElement("canvas");c.width=c.height=N;const g=c.getContext("2d"),k=N/(2*H),gr=th.gr;
g.fillStyle=gr.base;g.fillRect(0,0,N,N);
for(let i=0;i<110;i++){const x=rng()*N,y=rng()*N,r=(70+rng()*220)*qs,col=gr.v[Math.floor(rng()*gr.v.length)],q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,col+"d0");q.addColorStop(1,col+"00");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}
const ruin=key==="ruin",neon=key==="neon";
if(!ruin&&!neon){ // roads
g.lineCap="round";const cx=N/2,roads=[];const base=rng()*6.283;for(let i=0;i<3;i++){const a=base+i*2.094+rng()*.5,ex=cx+Math.cos(a)*N*.8,ey=cx+Math.sin(a)*N*.8,mx=cx+Math.cos(a+.4)*N*.3,my=cx+Math.sin(a+.4)*N*.3;roads.push([cx,cx,mx,my,ex,ey])}GROADS=roads.map(r=>r.map(v=>v/N));
for(const [w,col] of[[7.4*k,gr.edge],[6.2*k,gr.path]]){g.strokeStyle=col;g.lineWidth=w;for(const r of roads){g.beginPath();g.moveTo(r[0],r[1]);g.quadraticCurveTo(r[2],r[3],r[4],r[5]);g.stroke()}}
g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=.14*k;g.setLineDash([1.4*k,1.2*k]);for(const r of roads){g.beginPath();g.moveTo(r[0],r[1]);g.quadraticCurveTo(r[2],r[3],r[4],r[5]);g.stroke()}g.setLineDash([]);
// plaza
g.fillStyle=gr.edge;g.beginPath();g.arc(cx,cx,10.2*k,0,6.283);g.fill();g.fillStyle=gr.plaza;g.beginPath();g.arc(cx,cx,9.6*k,0,6.283);g.fill();
g.strokeStyle="rgba(0,0,0,.09)";g.lineWidth=2;for(let i=-10;i<=10;i++){g.beginPath();g.moveTo(cx+i*k*1.2,cx-10*k);g.lineTo(cx+i*k*1.2,cx+10*k);g.stroke();g.beginPath();g.moveTo(cx-10*k,cx+i*k*1.2);g.lineTo(cx+10*k,cx+i*k*1.2);g.stroke()}}
if(neon){g.fillStyle=gr.plaza;g.beginPath();g.arc(N/2,N/2,10*k,0,6.283);g.fill();
for(const [col,w,bl,step] of[["#00f0ff",3,14,4],["#ff2fd0",2,10,16]]){g.strokeStyle=col;g.lineWidth=w;g.shadowColor=col;g.shadowBlur=bl;
for(let u=-H;u<=H;u+=step){const p=(u+H)*k;g.beginPath();g.moveTo(p,0);g.lineTo(p,N);g.stroke();g.beginPath();g.moveTo(0,p);g.lineTo(N,p);g.stroke()}}
g.shadowBlur=18;g.strokeStyle="#ff2fd0";g.lineWidth=5;g.beginPath();g.arc(N/2,N/2,10*k,0,6.283);g.stroke();g.strokeStyle="#00f0ff";g.beginPath();g.arc(N/2,N/2,6.4*k,0,6.283);g.stroke();g.shadowBlur=0}
if(ruin){g.strokeStyle="rgba(0,0,0,.35)";g.lineWidth=3;for(let u=-H;u<=H;u+=5){const p=(u+H)*k;g.beginPath();g.moveTo(p,0);g.lineTo(p,N);g.stroke();g.beginPath();g.moveTo(0,p);g.lineTo(N,p);g.stroke()}
g.lineWidth=2;for(let i=0;i<60;i++){let x=rng()*N,y=rng()*N;g.beginPath();g.moveTo(x,y);for(let j=0;j<7;j++){x+=(rng()-.5)*90;y+=(rng()-.5)*90;g.lineTo(x,y)}g.stroke()}
for(let i=0;i<14;i++){const x=rng()*N,y=rng()*N,r=40+rng()*90,q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,"rgba(120,150,190,.28)");q.addColorStop(1,"rgba(120,150,190,0)");g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}}
for(let i=0,n=70000*qs*qs|0;i<n;i++){g.fillStyle=rng()<.5?"rgba(255,255,255,.06)":"rgba(0,0,0,.07)";g.fillRect(rng()*N,rng()*N,1+rng()*3*qs,1+rng()*3*qs)}
if(!ruin&&!neon&&key!=="frost"&&key!=="desert"&&key!=="toxic"){ // blades in four tones, plus dry and lush patches so the lawn is not one flat green
const tone=th.night?["rgba(20,40,30,.2)","rgba(60,110,70,.18)"]:["rgba(22,78,28,.24)","rgba(200,236,120,.2)","rgba(120,170,60,.2)","rgba(214,196,110,.14)"];
g.lineWidth=1.4*Math.max(.6,qs);for(let i=0,n=26000*qs*qs|0;i<n;i++){const x=rng()*N,y=rng()*N;g.strokeStyle=tone[(rng()*tone.length)|0];g.beginPath();g.moveTo(x,y);g.lineTo(x+(rng()-.5)*6*qs,y-(3+rng()*6)*qs);g.stroke()}
for(let i=0;i<26;i++){const x=rng()*N,y=rng()*N,r=(60+rng()*130)*qs,col=rng()<.5?"rgba(190,170,90,.16)":"rgba(30,120,50,.16)",gg2=g.createRadialGradient(x,y,0,x,y,r);gg2.addColorStop(0,col);gg2.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gg2;g.fillRect(x-r,y-r,2*r,2*r)}}
const t=new T.CanvasTexture(c);t.anisotropy=Math.min(SOFT?1:8,rd.capabilities.getMaxAnisotropy());
// the GPU keeps its own copy, so the canvas backing store (up to 9 MB) can go as soon as the upload is done
t.onUpdate=()=>{t.onUpdate=null;c.width=c.height=1};return t}

// tiled blade detail multiplied over the ground texture so the lawn stays sharp near the camera
let GDET=null;
function grassDetail(){if(GDET)return GDET;
const n=256,c=document.createElement("canvas");c.width=c.height=n;const g=c.getContext("2d"),r=mkRng(7);
g.fillStyle="#808080";g.fillRect(0,0,n,n);g.lineCap="round";
for(let i=0;i<4200;i++){const x=r()*n,y=r()*n,l=4+r()*8,a=(r()-.5)*.7;g.strokeStyle=r()<.5?"rgba(255,255,255,.2)":"rgba(0,0,0,.24)";g.lineWidth=.8+r()*.9;
for(const ox of[-n,0,n])for(const oy of[-n,0,n]){const px=x+ox,py=y+oy;if(px<-14||px>n+14||py<-14||py>n+14)continue;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.sin(a)*l,py-Math.cos(a)*l);g.stroke()}}
GDET=new T.CanvasTexture(c);GDET.wrapS=GDET.wrapT=T.RepeatWrapping;GDET.anisotropy=Math.min(8,rd.capabilities.getMaxAnisotropy());return GDET}

// ---------- world: build ----------
function disposeWorld(){
const grp=WORLD.group;if(grp){sc.remove(grp);grp.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}})}
WORLD.group=null;WORLD.lights=[];WORLD.dust=null;WORLD.dv=null;WORLD.flames=null;WORLD.zone=null;WORLD.course=null;WORLD.spawns=[];WORLD.ceil=0;boxes=[]}

// Low and Potato have no shadow map, so the shadows every wall, house and crate would cast are painted into the ground texture instead, along the same sun direction the real ones use.
// Drawn once per match into a small canvas (solid, so overlaps never double up) and then softened and laid over the ground at a fixed strength.
function bakeGround(gt,th,shade){
const cv=gt.image,N=cv.width,s=N>>2,u=s/(2*H),sx=sun.position.x,sy=Math.max(20,sun.position.y),sz=sun.position.z,c2=cv.getContext("2d");
const soft=(src,a,bl)=>{c2.save();c2.globalAlpha=a;c2.imageSmoothingEnabled=true;c2.imageSmoothingQuality="high";try{c2.filter="blur("+(N/(2*H)*bl).toFixed(1)+"px)"}catch(e){}c2.drawImage(src,0,0,N,N);c2.restore()};
// contact shading: every wall, house and crate darkens the ground right around its base (all levels, since real shadow maps do not give this)
const ao=document.createElement("canvas");ao.width=ao.height=s;{const a=ao.getContext("2d");a.fillStyle=th.night?"#000":"#10182c";
for(const b of boxes)if(b.h>.6)a.fillRect((b.x-b.w/2-.7+H)*u,(b.z-b.d/2-.7+H)*u,(b.w+1.4)*u,(b.d+1.4)*u)}
soft(ao,th.night?.4:.26,.45);
if(!shade){gt.needsUpdate=true;return}
const o=document.createElement("canvas");o.width=o.height=s;const g=o.getContext("2d");g.fillStyle=th.night?"#04050c":"#0e1536";
const cr=(O,A,B)=>(A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);
for(const b of boxes){
if(b.h<.3)continue;
const h=Math.min(b.h,26),dx=-sx/sy*h,dz=-sz/sy*h,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;
const P=[[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0+dx,z0+dz],[x1+dx,z0+dz],[x1+dx,z1+dz],[x0+dx,z1+dz]].sort((a,c)=>a[0]-c[0]||a[1]-c[1]);
const lo=[],up=[];
for(const p of P){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
const hull=lo.slice(0,-1).concat(up.slice(0,-1));
g.beginPath();hull.forEach((p,i)=>{const X=(p[0]+H)*u,Y=(p[1]+H)*u;i?g.lineTo(X,Y):g.moveTo(X,Y)});g.closePath();g.fill()}
soft(o,th.night?.5:.42,.22);gt.needsUpdate=true}

// sun-scatter fog for the world materials: distant scenery warms toward the sun's colour when you look at it and a thin haze hugs the ground, which carries the sky shader's own horizon glow onto the land
const FOGF=`#ifdef USE_FOG
float fogFactor=smoothstep(fogNear,fogFar,fogDepth);
float sA=pow(max(dot(normalize(vWP-cameraPosition),normalize(sunD)),0.),5.);
vec3 fogC=mix(fogColor,min(fogColor*.5+sunC*.7,vec3(1.)),sA*fogFactor*.75);
fogFactor=clamp(fogFactor+(1.-smoothstep(0.,7.,vWP.y))*smoothstep(fogNear*.25,fogFar*.8,fogDepth)*.15,0.,1.);
gl_FragColor.rgb=mix(gl_FragColor.rgb,fogC,fogFactor);
#endif`;
function fogFx(mat,tag){
const prev=mat.onBeforeCompile;
mat.onBeforeCompile=sh=>{
if(prev)prev(sh);
sh.uniforms.sunD=Sky.u.sunDir;sh.uniforms.sunC=Sky.u.sunCol;
sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vWP;").replace("#include <project_vertex>","#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;");
sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vWP;uniform vec3 sunD,sunC;").replace("#include <fog_fragment>",FOGF)};
mat.customProgramCacheKey=()=>"fx"+tag}

function buildWorld(key,seed,opt){
opt=opt||{};disposeWorld();
const th=THEMES[key]||THEMES.meadow;key=THEMES[key]?key:"meadow";const ruin=key==="ruin",rng=mkRng((seed>>>0)||1);
// rng drives everything that affects collision and spawns, so every device builds the same arena from one seed (online matches rely on it).
// crng drives looks only (brightness jitter, mountains, flowers, grass), so weaker settings can drop decoration without changing the map.
const crng=mkRng(((seed>>>0)^0x5bd1e995)>>>0||1);
const rr=(a,b)=>a+(b-a)*rng(),pick=a=>a[Math.floor(rng()*a.length)],br=()=>.94+crng()*.12,PI=Math.PI,cr=(a,b)=>a+(b-a)*crng(),cpick=a=>a[Math.floor(crng()*a.length)];
const solid=new Batch(),glow=new Batch(),grp=new T.Group();
const reg=(x,z,w,d,h,nc,rf)=>{boxes.push({x,z,w,d,h,nc:nc?1:0,rf:rf?1:0})}; // rf: unused now (roofs are walkable); // nc: solid all the way up, never climbed or stood on (house roofs)
let RDP=[];const onRoad=(x,z,m)=>{for(const q of RDP)if((x-q.x)*(x-q.x)+(z-q.z)*(z-q.z)<m*m)return true;return false};
const free=(x,z,r,ig)=>{if(Math.abs(x)>H-r-1.5||Math.abs(z)>H-r-1.5)return false;if(!ig&&RDP.length&&onRoad(x,z,3.9+r*.5))return false;for(const b of boxes)if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return false;return true};
const P=(t,x,y,z,sx,sy,sz,col,ry,ao,b2,rx,rz)=>(b2||solid).add(U[t],mt(x,y,z,sx,sy,sz,ry,rx,rz),col,ao==null?.7:ao,br());
const blk=(x,z,w,h,d,col,ao)=>{reg(x,z,w,d,h);P("box",x,h/2,z,w,h,d,col,0,ao)};
const P2=m=>[(rng()-.5)*(H*2-(m||10)),(rng()-.5)*(H*2-(m||10))];
const lerpC=(a,b,t)=>{const x=new T.Color(a),y=new T.Color(b);return x.lerp(y,t).getHex()};
// lighting and atmosphere
sc.background=new T.Color(th.fog[0]);sc.fog=new T.Fog(th.fog[0],th.fog[1],th.fog[2]);
hemi.color.setHex(th.hemi[0]);hemi.groundColor.setHex(th.hemi[1]);hemi.intensity=th.hemi[2];
sun.color.setHex(key==="neon"?0x8aa8ff:th.sun.c);sun.intensity=key==="neon"?.5:th.sun.i;sun.position.set(th.sun.d[0]*100,Math.max(30,th.sun.d[1]*100),th.sun.d[2]*100);
if(key==="neon")sun.position.set(-40,70,-50);
sun.target.position.set(0,0,0);Sky.set(th);
// ground
const gt=paintGround(key,th,crng),gmat=new T.MeshLambertMaterial({map:gt});
if(LOD.tex>=1024&&!ruin&&key!=="neon"){const dt=grassDetail();gmat.onBeforeCompile=sh=>{sh.uniforms.dtex={value:dt};
sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform sampler2D dtex;").replace("#include <map_fragment>","#include <map_fragment>\ndiffuseColor.rgb*=.6+texture2D(dtex,vUv*36.).r*.8;")};gmat.customProgramCacheKey=()=>"gdet"}
const fxOn=LOD.cloud>0;if(fxOn)fogFx(gmat,LOD.tex>=1024&&!ruin&&key!=="neon"?"gd":"g");
// the roads are in the ground texture: sample them so houses, lamps and cars can line up with them instead of landing at random
RDP=[];GROADS.forEach((r,ri)=>{const f=v=>v*2*H-H;for(let i=0;i<=60;i++){const t=i/60,u=1-t,X=f(u*u*r[0]+2*u*t*r[2]+t*t*r[4]),Z=f(u*u*r[1]+2*u*t*r[3]+t*t*r[5]),dx=2*u*(r[2]-r[0])+2*t*(r[4]-r[2]),dz=2*u*(r[3]-r[1])+2*t*(r[5]-r[3]),dl=Math.hypot(dx,dz)||1;
if(Math.hypot(X,Z)>12&&Math.abs(X)<H-3&&Math.abs(Z)<H-3)RDP.push({x:X,z:Z,tx:dx/dl,tz:dz/dl,ri})}});
const gm=new T.Mesh(new T.PlaneGeometry(opt.custom?240:H*2,opt.custom?240:H*2),gmat);gm.rotation.x=-PI/2;gm.receiveShadow=true;grp.add(gm);
const far=new T.Mesh(new T.CircleGeometry(420,32),new T.MeshLambertMaterial({color:new T.Color(th.gr.base).multiplyScalar(.8)}));far.rotation.x=-PI/2;far.position.y=-.05;grp.add(far);
// perimeter (skipped entirely for parkour so platforms aren't blocked by arena walls)
if(!opt.parkour&&!opt.custom){
const wh=ruin?7:3.6,wc=th.wall;
[[0,-H-1,2*H+4,2],[0,H+1,2*H+4,2],[-H-1,0,2,2*H+4],[H+1,0,2,2*H+4]].forEach(([x,z,w,d])=>{reg(x,z,w,d,wh);P("box",x,wh/2,z,w,wh,d,wc,0,.75);P("box",x,wh+.12,z,w+.3,.26,d+.3,th.trim,0,1)});
for(let i=-4;i<=4;i++){[[i*10,-H-.2],[i*10,H+.2],[-H-.2,i*10],[H+.2,i*10]].forEach(([x,z])=>{P("box",x,wh/2+.3,z,1.1,wh+.6,1.1,th.trim,0,.8)})}
if(key==="neon"){for(const [x,z,w,d] of[[0,-H+.1,2*H,.15],[0,H-.1,2*H,.15],[-H+.1,0,.15,2*H],[H-.1,0,.15,2*H]])P("box",x,1.2,z,w,.12,d,0x00f0ff,0,1,glow)}
}
// distant mountains
if(!ruin&&!opt.custom)for(let i=0,nm=Math.max(10,Math.round(26*LOD.props));i<nm;i++){const a=i/nm*PI*2+crng()*.2,d=100+crng()*40,r=cr(14,28),h=cr(18,44),x=Math.cos(a)*d,z=Math.sin(a)*d,mc=cpick(th.mount);
P("cone",x,h/2-2,z,r*2,h,r*2,mc,crng()*3,.55);if(th.snow&&crng()<th.snow)P("cone",x,h-h*.14-2,z,r*.75,h*.3,r*.75,0xf4f8ff,0,.95)}
// interior shell for the ruin
if(ruin){WORLD.ceil=7;P("box",0,7.25,0,2*H+6,.5,2*H+6,0x1b1d24,0,.9);
for(let u=-35;u<=35;u+=10){P("box",u,6.6,0,.7,.7,2*H,0x2a2c34,0,.8);P("box",0,6.6,u,2*H,.7,.7,0x2a2c34,0,.8)}
for(let i=0;i<10;i++){const [x,z]=P2(8);P("box",x,6.85,z,1.6,.12,.7,0xffd9a0,0,1,glow);if(i<3){const l=new T.PointLight(0xffc477,1.1,30,1.6);l.position.set(x,5.5,z);l.userData.base=1.1;l.userData.ph=rng()*9;grp.add(l);WORLD.lights.push(l)}}
for(let u=-34;u<=34;u+=12){[[u,-H+.15],[u,H-.15]].forEach(([x,z])=>P("box",x,4.6,z,5,1.1,.1,th.win,0,1,glow));[[-H+.15,u],[H-.15,u]].forEach(([x,z])=>P("box",x,4.6,z,.1,1.1,5,th.win,0,1,glow))}}
// props
const lb=(cx,cz,rot,lx,lz,w,h,d,col,ao)=>{const c=Math.cos(rot*PI/2),s=Math.sin(rot*PI/2),x=cx+lx*c+lz*s,z=cz-lx*s+lz*c,sw=rot&1?d:w,sd=rot&1?w:d;blk(x,z,sw,h,sd,col,ao)};
const house=(x,z,rot)=>{
if(key==="neon"){x=Math.round((x+H-2)/4)*4-H+2;z=Math.round((z+H-2)/4)*4-H+2}
const pitched=rng()<.52,w=rr(5,7),d=rr(5,7),h=pitched?rr(2.8,3.9):rr(2.8,3.3),sw=rot&1?d:w,sd=rot&1?w:d;if(!free(x,z,Math.max(sw,sd)/2+(pitched?1.4:2.6)))return false;
const ry=rot*PI/2,c=Math.cos(ry),s=Math.sin(ry),L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c],wc2=pick(th.house),rc=pick(th.roof),rh=pitched?rr(1.5,2.1):0;
P("box",x,h/2,z,w,h,d,wc2,ry,.6);P("box",x,.2,z,w+.2,.4,d+.2,th.trim,ry,.8);
P("box",x,h+.07,z,w+.55,.16,d+.55,th.trim,ry,.85);
let p;
if(pitched){ // visible pitched roof (ridge along the long side); solid, so nobody stands inside it
const lx=w>=d,ry2=lx?ry+PI/2:ry,span=(lx?d:w)+.9,len=(lx?w:d)+.9;
{ // the roof is walkable: stepped collision bands follow the slope, each rise under STEP so you just walk up it
const bands=[[1,0],[.75,.25],[.5,.5],[.25,.75],[.1,.92]];
for(const [f,r] of bands){const ac=Math.min(lx?d:w,span*f),tp=h+.2+rh*r,lw=lx?w:ac,ld=lx?ac:d;reg(x,z,rot&1?ld:lw,rot&1?lw:ld,tp)}}
P("gab",x,h+.15+rh/2,z,span,rh,len,rc,ry2,.78);P("box",x,h+.15+rh+.04,z,.2,.12,len+.08,th.trim,ry2,.9);
p=L(w*.25,-d*.2);P("box",p[0],h+.3+(rh+.9)/2,p[1],.62,rh+.9,.62,0x8a4b3a,ry,.7);reg(p[0],p[1],.7,.7,h+rh+1.2,1)}
else{ // flat deck: its top is exactly the collision surface, so a player up there stands on the roof; a crate staircase on one side makes it reachable
reg(x,z,sw,sd,h+.32);
P("box",x,h+.2,z,w+.04,.24,d+.04,rc,ry,.78);
for(const [a,b,ww,dd] of[[0,d/2+.2,w+.5,.16],[0,-d/2-.2,w+.5,.16],[w/2+.2,0,.16,d+.5],[-w/2-.2,0,.16,d+.5]]){p=L(a,b);P("box",p[0],h+.52,p[1],ww,.4,dd,th.trim,ry,.85)}
p=L(-w*.28,d*.18);P("box",p[0],h+.78,p[1],1.1,.8,.9,0x9aa0a8,ry,.7);reg(p[0],p[1],1.2,1,h+1.18,1);
p=L(w*.12,-d*.22);P("cyl",p[0],h+.62,p[1],.5,.6,.5,0x7a7f88,ry,.7);
p=L(w*.3,d*.22);P("box",p[0],h+1.2,p[1],.06,1.8,.06,0x2a2c34,ry,1);P("box",p[0],h+1.85,p[1],.8,.05,.05,0x2a2c34,ry,1);
const sd2=rng()<.5?1:-1,q1=L(sd2*(w/2+.85),-d*.22),q2=L(sd2*(w/2+.85),-d*.22+1.4);
crateAt(q1[0],q1[1],1.2,2);crateAt(q2[0],q2[1],1.2,1)}
// outdoor staircase up the side wall to the roof (steps are under STEP, so walking is enough); tries each side and direction until it fits
{const top=pitched?h+.2:h+.32,n=Math.ceil(top/.5),sh=top/n,dep=.9,scol=lerpC(th.trim,0xffffff,.18);let done=false;
for(const sg of(rng()<.5?[1,-1]:[-1,1])){if(done)break;for(const dz of[1,-1]){const lxs=sg*(w/2+.8),z0=-dz*(d/2-.8),pts=[];for(let i=0;i<n;i++)pts.push(L(lxs,z0+dz*(n-1-i)*dep));
if(pts.every(q=>free(q[0],q[1],.6,1))){for(let i=0;i<n;i++)lb(x,z,rot,lxs,z0+dz*(n-1-i)*dep,1.2,sh*(i+1),dep+.04,scol,.7);
for(let i=0;i<n;i+=3){const q=L(lxs+sg*.6,z0+dz*(n-1-i)*dep);P("box",q[0],sh*(i+1)+.5,q[1],.08,1,.08,0x2a2c34,0,1)}
done=true;break}}}}
p=L(0,d/2+.05);P("box",p[0],1,p[1],1.1,2,.12,0x5b3a21,ry,.9);p=L(0,d/2+.5);P("box",p[0],.08,p[1],1.9,.16,.9,th.trim,ry,1);
const wcol=th.night?th.win:th.win;
for(const sx of[-1,1]){p=L(sx*w/4,d/2+.05);P("box",p[0],h*.62,p[1],1.05,.95,.1,0x3a3a40,ry,1);P("box",p[0],h*.62,p[1],.88,.78,.14,wcol,ry,1,glow);
p=L(sx*(w/2+.05),sx*d*.12);P("box",p[0],h*.62,p[1],.1,.95,1.05,0x3a3a40,ry,1);P("box",p[0],h*.62,p[1],.14,.78,.88,wcol,ry,1,glow)}
return true};
const tree=(x,z)=>{
if(!free(x,z,1.5))return false;reg(x,z,.7,.7,3.2);const t=rr(.85,1.25),pine=rng()<th.pine,leaf=pick(th.leaf);
if(th.crystal){const hh=rr(3.5,7);P("cone",x,hh/2,z,1.5,hh,1.5,leaf,rng()*3,.55);P("cone",x,hh/2,z,.7,hh*1.02,.7,0xffffff,0,1,glow);return true}
P("cyl",x,1.15*t,z,.55,2.3*t,.55,th.trunk,0,.55);
if(pine){for(let i=0;i<4;i++){const r=(2.6-i*.5)*t;P("cone",x,(2+i*1.05)*t,z,r*1.6,1.7*t,r*1.6,leaf,i,.62);if(th.snow)P("cone",x,(2.28+i*1.05)*t,z,r*1.15,.9*t,r*1.15,0xf4f8ff,i,.95)}}
else{P("ico",x,3.5*t,z,3.3*t,2.8*t,3.3*t,leaf,rng()*3,.55);P("ico",x+.9*t,3.0*t,z+.4*t,2.2*t,1.9*t,2.2*t,lerpC(leaf,0xffffff,.1),rng()*3,.6);P("ico",x-.7*t,3.1*t,z-.6*t,2.3*t,2*t,2.3*t,leaf,rng()*3,.6)}
return true};
const crateAt=(x,z,s,stack)=>{const h=s*stack,col=pick([0x8b6b3d,0x9a7a48,0x7a5c34]);reg(x,z,s,s,h);
for(let i=0;i<stack;i++){P("box",x,s*(i+.5),z,s,s,s,col,0,.62);P("box",x,s*(i+.5),z,s+.06,s*.14,s+.06,0x4e3a20,0,.9);P("box",x,s*(i+.5),z,s*.14,s+.06,s+.06,0x4e3a20,0,.9)}return true};
const crate=(x,z,s,stack)=>{if(!free(x,z,s*.8+.3))return false;crateAt(x,z,s,stack);return true};
const barrel=(x,z)=>{if(!free(x,z,.9))return false;reg(x,z,.9,.9,1.1);const c=pick([0xd1342f,0x2f6fd1,0x3fa34d,0xe0a020]);P("cyl",x,.55,z,.9,1.1,.9,c,0,.6);P("cyl",x,.55,z,.93,.16,.93,lerpC(c,0xffffff,.5),0,.9);P("cyl",x,.25,z,.95,.1,.95,0x333333,0,1);P("cyl",x,.85,z,.95,.1,.95,0x333333,0,1);P("cyl",x,1.1,z,.8,.04,.8,0x222222,0,1);P("cyl",x,1.14,z,.22,.05,.22,0x555555,0,1);return true};
const barrelGroup=(x,z)=>{let n=0;for(const [a,b] of[[0,0],[.95,.25],[-.2,.98]])if(barrel(x+a,z+b))n++;return n>0};
const barrier=(x,z,rot)=>{const w=rot&1?.7:3,d=rot&1?3:.7;if(!free(x,z,Math.max(w,d)/2+.4))return false;reg(x,z,w,d,1);const c=0xa7a9ad;P("box",x,.35,z,w*(rot&1?1.4:1),.7,d*(rot&1?1:1.4),c,0,.6);P("box",x,.85,z,w,.6,d,c,0,.65);P("box",x,.8,z,w+.02,.14,d+.02,0xff7a1a,0,1);return true};
const sandbags=(x,z,rot)=>{const w=rot&1?.9:2.6,d=rot&1?2.6:.9;if(!free(x,z,Math.max(w,d)/2+.4))return false;reg(x,z,w,d,.9);const c=pick([0xb8a67a,0xa89a74]);P("box",x,.22,z,w,.44,d,c,0,.6);P("box",x,.62,z,w*(rot&1?.9:.82),.38,d*(rot&1?.82:.9),lerpC(c,0x000000,.08),0,.65);return true};
const tires=(x,z)=>{if(!free(x,z,.9))return false;reg(x,z,.95,.95,1.2);for(let i=0;i<3;i++){P("cyl",x,.2+i*.4,z,.95-i*.04,.4,.95-i*.04,0x1b1c20,0,.6);P("cyl",x,.2+i*.4,z,.5,.42,.5,0x3a3b42,0,1)}return true};
const car=(x,z,rot,ig)=>{const w=rot&1?1.8:3.6,d=rot&1?3.6:1.8;if(!free(x,z,2.3,ig))return false;reg(x,z,w,d,1.5);const ry=rot*PI/2,c=Math.cos(ry),s=Math.sin(ry),L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c],col=pick([0xd1342f,0x2f6fd1,0xe8c020,0xdddddd,0x3a3a42,0x2fa37a]);
P("box",x,.55,z,3.6,.7,1.8,col,ry,.6);let p=L(-.1,0);P("box",p[0],1.2,p[1],1.9,.62,1.6,lerpC(col,0x000000,.15),ry,.7);
p=L(-.1,0);P("box",p[0],1.2,p[1],1.94,.4,1.64,th.night?0x203050:0xbfe6ff,ry,1,glow);
for(const lx of[-1.2,1.2])for(const lz of[-.9,.9]){p=L(lx,lz);P("cyl",p[0],.34,p[1],.68,.3,.68,0x151515,ry,1,null,0,PI/2);}
const hl=th.night?0xfff0b0:0xffffff;for(const lz of[-.55,.55]){p=L(1.8,lz);P("box",p[0],.6,p[1],.08,.18,.3,hl,ry,1,glow)}return true};
const lamp=(x,z)=>{if(!free(x,z,.6))return false;reg(x,z,.3,.3,4.6);P("box",x,2.3,z,.2,4.6,.2,0x3a3a42,0,.6);P("box",x,4.7,z,.5,.1,.5,0x2a2a30,0,1);P("ico",x,4.5,z,.55,.55,.55,th.lamp,0,1,glow);return true};
const rock=(x,z)=>{const s=rr(1,2.2);if(!free(x,z,s*.8))return false;reg(x,z,s*1.3,s*1.3,s*.8);const c=th.snow>.8?0xcfd8e2:0x7d8087;P("ico",x,s*.35,z,s*1.5,s*.9,s*1.3,c,rng()*3,.55);return true};
const bench=(x,z,rot)=>{const w=rot&1?.7:2,d=rot&1?2:.7;if(!free(x,z,1.3))return false;reg(x,z,w,d,.5);const ry=rot*PI/2;P("box",x,.42,z,2,.1,.6,0x8b6b3d,ry,.8);P("box",x,.2,z,1.8,.4,.5,0x555560,ry,.6);return true};
const tower=(x,z,rot)=>{if(!free(x,z,7))return false;
lb(x,z,rot,0,0,4,2.2,4,pick(th.house),.6);
for(let i=0;i<5;i++)lb(x,z,rot,0,2.6+i*.9,2.4,.44*(5-i),.9,lerpC(th.trim,0xffffff,.15),.7);
lb(x,z,rot,0,0,4.2,.16,4.2,th.trim,1);
// guard rail posts (decorative)
for(const [a,b] of[[-1.9,-1.9],[1.9,-1.9],[-1.9,1.9],[1.9,1.9]]){const c=Math.cos(rot*PI/2),s=Math.sin(rot*PI/2);P("box",x+a*c+b*s,2.2+1.1,z-a*s+b*c,.14,2.2,.14,th.trim,0,1)}
const tc=th.night?glow:null;P("box",x,4.55,z,4.7,.22,4.7,pick(th.roof),rot*PI/2,.8);P("box",x,4.78,z,.3,.5,.3,th.trim,0,1);P("ico",x,5.15,z,.5,.5,.5,th.lamp,0,1,glow);return true};
const wall=(x,z,rot,len,h)=>{const w=rot&1?.8:len,d=rot&1?len:.8;if(!free(x,z,Math.max(w,d)/2+.5))return false;blk(x,z,w,h,d,pick([0x8a8f99,0x9a9488,0xa89c8c]),.62);P("box",x,h+.08,z,w+.1,.16,d+.1,th.trim,0,1);return true};
const fence=(x,z,rot,len)=>{const w=rot&1?.25:len,d=rot&1?len:.25;if(!free(x,z,Math.max(w,d)/2+.4))return false;reg(x,z,w,d,1.05);
P("box",x,.78,z,w,.12,d,0xf4f1e8,0,.85);P("box",x,.4,z,w,.12,d,0xf4f1e8,0,.85);const n=Math.floor(len/1.2);
for(let i=0;i<=n;i++){const o=-len/2+i*len/n;P("box",rot&1?x:x+o,.55,rot&1?z+o:z,.16,1.1,.16,0xe8e4d8,0,.8)}return true};
const parkour=(x,z,rot)=>{ // zig-zag run of platforms with rising heights
const hs=[.9,1.35,1.8,2.25,1.6,1];if(!free(x,z,9))return false;const c=Math.cos(rot*PI/2),s=Math.sin(rot*PI/2);
for(const e of[-1,1]){const lx=e*8.3,px=x+lx*c,pz=z-lx*s;P("box",px+s*1.5,1.4,pz+c*1.5,.22,2.8,.22,th.trim,0,.9);P("box",px-s*1.5,1.4,pz-c*1.5,.22,2.8,.22,th.trim,0,.9);P("box",px,2.85,pz,Math.abs(s)>.5?3.4:.28,.28,Math.abs(s)>.5?.28:3.4,th.night>.5?0x00f0ff:0xffd23f,0,1,th.night>.5?glow:null)}
hs.forEach((h,i)=>{const lx=i*2.6-6.5,lz=(i%2?1.3:-1.3),px=x+lx*c+lz*s,pz=z-lx*s+lz*c,w=rr(1.6,2.2),col=lerpC(0xe0a040,0xe04060,i/5);blk(px,pz,w,h,w,th.night>.5?lerpC(col,0x202040,.35):col,.62);P("box",px,h+.05,pz,w+.1,.1,w+.1,th.night>.5?0x00f0ff:0xffffff,0,1,th.night>.5?glow:null)});return true};
const pc=n=>opt.fixed?n:Math.max(1,Math.round(n*LOD.props)),place=(n,fn,m)=>{let ok=0;for(let i=0;i<n*5&&ok<n;i++){const [x,z]=P2(m);if(fn(x,z,Math.floor(rng()*4)))ok++}return ok};

// Monster Rush arenas: a themed multi-level layout (raised decks with staircases, bridges, bunkers, lanes) built before the scatter props so those fit around it
const arenaPack=v=>{
const c1=lerpC(th.trim,0x8a8e9a,.4),c2=lerpC(th.trim,0xffffff,.25),gl=th.lamp,wc3=pick(th.house);
const deck=(x,z,w,d,hh)=>{blk(x,z,w,hh,d,c1,.7);P("box",x,hh+.05,z,w+.16,.1,d+.16,c2,0,1);
for(const [a,b,ww,dd] of[[0,d/2+.01,w,.07],[0,-d/2-.01,w,.07],[w/2+.01,0,.07,d],[-w/2-.01,0,.07,d]])P("box",x+a,hh-.25,z+b,ww,.12,dd,gl,0,1,glow)};
const stairs=(ex,ez,dx,dz,h0,h1,wd)=>{const n=Math.ceil((h1-h0)/.5);for(let i=0;i<n;i++){const k=.45+(n-1-i)*.9,cx=ex-dx*k,cz=ez-dz*k;blk(cx,cz,dx?.94:wd,h0+(h1-h0)*(i+1)/n,dx?wd:.94,c2,.75)}};
const low=(x,z,w,d,hh)=>{blk(x,z,w,hh,d,wc3,.65);P("box",x,hh+.06,z,w+.1,.12,d+.1,th.trim,0,1)};
const pillar=(x,z,hh)=>{blk(x,z,1.7,hh,1.7,lerpC(c1,0x000000,.15),.6);P("box",x,.3,z,2.1,.6,2.1,c2,0,.8);P("box",x,hh+.2,z,2.1,.4,2.1,c2,0,.8);P("box",x,hh*.6,z,.12,hh*.5,1.76,gl,0,1,glow)};
if(v===0){ // keep: two-tier fortress, corner bunkers, ring of cover
deck(0,0,17,17,1.6);deck(0,0,8,8,3.2);
stairs(8.5,0,-1,0,0,1.6,3);stairs(-8.5,0,1,0,0,1.6,3);stairs(0,8.5,0,-1,0,1.6,3);stairs(0,-8.5,0,1,0,1.6,3);
stairs(4,5.5,0,-1,1.6,3.2,2.4);stairs(-4,-5.5,0,1,1.6,3.2,2.4);
for(const sx of[-1,1])for(const sz of[-1,1]){deck(sx*27,sz*24,7,7,1.9);stairs(sx*27-sx*3.5,sz*24,-sx,0,0,1.9,3);pillar(sx*17,sz*17,3.6)}
for(let i=0;i<8;i++){const a=i*PI/4+PI/8;low(Math.cos(a)*14.5,Math.sin(a)*14.5,i&1?1.1:3.4,i&1?3.4:1.1,1.2)}}
else if(v===1){ // crossing: high hub and four walkways with stairs at the ends
deck(0,0,9,9,3);deck(15,0,18,3.6,3);deck(-15,0,18,3.6,3);deck(0,15,3.6,18,3);deck(0,-15,3.6,18,3);
stairs(24,0,-1,0,0,3,3);stairs(-24,0,1,0,0,3,3);stairs(0,24,0,-1,0,3,3);stairs(0,-24,0,1,0,3,3);
for(const sx of[-1,1])for(const sz of[-1,1]){low(sx*14,sz*14,6,1,1.3);low(sx*14,sz*14+sz*5,1,5,1.3);pillar(sx*29,sz*29,4)}}
else if(v===2){ // colosseum: ring of pillars, four raised arcs reached from both sides
for(let i=0;i<10;i++){const a=i*PI/5;pillar(Math.cos(a)*22,Math.sin(a)*22,4.2)}
deck(0,13,13,4,2.4);deck(0,-13,13,4,2.4);deck(13,0,4,13,2.4);deck(-13,0,4,13,2.4);
stairs(0,15,0,-1,0,2.4,3);stairs(0,-15,0,1,0,2.4,3);stairs(15,0,-1,0,0,2.4,3);stairs(-15,0,1,0,0,2.4,3);
stairs(0,11,0,1,0,2.4,3);stairs(0,-11,0,-1,0,2.4,3);stairs(11,0,1,0,0,2.4,3);stairs(-11,0,-1,0,0,2.4,3);
deck(0,0,5,5,.9);for(let i=0;i<4;i++){const a=i*PI/2+PI/4;low(Math.cos(a)*7,Math.sin(a)*7,2.4,.9,1.2)}}
else{ // lanes: staggered walls make switchbacks, three sniper decks overlook them
for(const [z,gx] of[[-22,-10],[-11,10],[0,-10],[11,10],[22,-10]]){const l=gx<0?[-38,gx-3]:[gx+3,38],cl=(l[0]+l[1])/2;low(cl,z,l[1]-l[0],.9,2.4);const m=gx<0?[gx+3,38]:[-38,gx-3];if(Math.abs(z)>20)low((m[0]+m[1])/2,z,m[1]-m[0]>30?10:m[1]-m[0],.9,2.4)}
deck(-30,-30,7,7,3.2);stairs(-26.5,-30,-1,0,0,3.2,3);deck(30,-6,7,7,3.2);stairs(30,-9.5,0,1,0,3.2,3);deck(-30,28,7,7,3.2);stairs(-26.5,28,-1,0,0,3.2,3)}
};
if(!opt.empty){
if(opt.waves)arenaPack(((seed>>>0)>>3)%4);
if(!ruin){
// central plaza
if(!opt.waves){const tiers=[[14,.45],[10,.9],[6,1.35]];tiers.forEach(([s,h],i)=>{blk(0,0,s,h,s,i==2?lerpC(th.trim,0xffffff,.25):lerpC(th.trim,0xffffff,.1+i*.05),.7);P("box",0,h+.03,0,s+.12,.08,s+.12,key==="neon"?(i%2?0xff2fd0:0x00f0ff):0xffffff,0,1,key==="neon"?glow:null)});
P("ico",0,2.7,0,1.1,1.1,1.1,key==="neon"?0xff2fd0:0xfff3a0,0,1,glow);P("box",0,1.9,0,.3,1.1,.3,th.trim,0,1);
WORLD.zone={x:0,z:0,r:6};}
// watchtowers ring the arena and face the plaza, parkour runs sit in the open between them
{const a0=rng()*6.283;for(let i=0;i<3;i++){const a=a0+i*2.094+rr(-.25,.25),tx=Math.cos(a)*26,tz=Math.sin(a)*26;tower(tx,tz,((Math.round(Math.atan2(-tx,-tz)/(PI/2))%4)+4)%4)}}
place(2,parkour,14);
// houses line the roads, set back and facing them; the rest scatter in the gaps
if(RDP.length){const nh=opt.sparse?4:9;for(let k=0,ok=0;k<nh*6&&ok<nh;k++){const cs=RDP.filter(q=>q.ri===k%3&&Math.hypot(q.x,q.z)>16&&Math.hypot(q.x,q.z)<54);if(!cs.length)continue;const q=cs[Math.floor(rng()*cs.length)],sg=rng()<.5?-1:1,off=9.3+rr(0,2.2),hx=q.x-q.tz*off*sg,hz=q.z+q.tx*off*sg;
if(house(hx,hz,((Math.round(Math.atan2(q.x-hx,q.z-hz)/(PI/2))%4)+4)%4))ok++}
// street furniture: lamps every so often on alternating verges, cars parked along the kerb in line with the road
let side=1;RDP.forEach((q,i)=>{if(i%11===5&&Math.hypot(q.x,q.z)>14){side=-side;lamp(q.x-q.tz*4.8*side,q.z+q.tx*4.8*side)}});
for(let k=0,ok=0;k<24&&ok<(opt.sparse?2:4);k++){const q=RDP[Math.floor(rng()*RDP.length)],sg=rng()<.5?-1:1;if(Math.hypot(q.x,q.z)<20)continue;if(car(q.x-q.tz*5*sg,q.z+q.tx*5*sg,Math.abs(q.tx)>Math.abs(q.tz)?0:1,1))ok++}
// benches ring the plaza
for(let k=0,ok=0;k<16&&ok<4;k++){const a=rng()*6.283;if(bench(Math.cos(a)*12.6,Math.sin(a)*12.6,Math.abs(Math.sin(a))>Math.abs(Math.cos(a))?0:1))ok++}}
place(opt.sparse?2:(RDP.length?4:11),house,10);place(pc(opt.sparse?10:22),(x,z)=>tree(x,z),8);
place(pc(RDP.length?1:5),car,8);place(pc(RDP.length?2:8),lamp,6);place(pc(7),(x,z,r)=>crate(x,z,rr(1.1,1.5),1+(rng()<.4?1:0)),6);place(pc(5),barrel,6);place(pc(3),barrelGroup,7);place(pc(4),barrier,6);place(pc(3),sandbags,6);place(pc(2),tires,6);place(pc(8),rock,6);place(pc(RDP.length?1:4),bench,6);
place(pc(4),(x,z,r)=>fence(x,z,r&1,rr(5,9)),8);place(pc(5),(x,z,r)=>wall(x,z,r&1,rr(3,5),rr(1.2,2.2)),8);
// flowers and tufts
const fl=th.flower;for(let i=0,nf=Math.max(1,Math.round(260*LOD.props));i<nf;i++){const x=(crng()-.5)*(H*2-6),z=(crng()-.5)*(H*2-6);if(!free(x,z,.5))continue;const f=crng()<.25,sz=f?.28:.34;
if(key==="neon"){if(f)P("ico",x,.18,z,.22,.3,.22,cpick(fl),0,1,glow)}else if(th.snow>.8){if(crng()<.5)P("ico",x,.1,z,cr(.4,.9),.25,cr(.4,.9),0xffffff,crng()*3,.9)}
else{P("cone",x,sz/2,z,.22,sz,.22,f?cpick(fl):lerpC(cpick(th.leaf),0xffffff,.1),0,.6);if(f)P("ico",x,sz+.04,z,.18,.18,.18,cpick(fl),0,1)}}
}else{
// ruined hall
place(7,(x,z,r)=>wall(x,z,r&1,rr(4,11),rr(3,6.5)),10);
place(13,(x,z)=>{if(!free(x,z,1.2))return false;blk(x,z,1.1,7,1.1,0x4b5563,.55);P("box",x,.3,z,1.5,.6,1.5,0x3a3f4a,0,.8);P("box",x,6.6,z,1.5,.5,1.5,0x3a3f4a,0,.8);return true},8);
place(3,tower,16);
place(pc(22),(x,z)=>{const s=rr(.7,1.6),h=rr(.4,1.1);if(!free(x,z,s));else{blk(x,z,s,h,s*rr(.8,1.4),pick([0x7c6f64,0x6b6258,0x8a7e72]),.6);return true}return false},6);
place(pc(10),(x,z)=>crate(x,z,1.2,1+(rng()<.35?1:0)),6);place(pc(6),barrel,6);place(pc(3),barrelGroup,7);place(pc(4),barrier,6);place(pc(3),sandbags,6);place(pc(2),tires,6);place(3,car,8);
// candles on short pedestals / ground (no floating)
WORLD.flames=[];const CG=new T.CylinderGeometry(.5,.5,1,10),FG=new T.ConeGeometry(.055,.22,6),wax=new T.MeshLambertMaterial({color:0xefe3c8}),dish=new T.MeshLambertMaterial({color:0x3a2c1e}),flm=new T.MeshBasicMaterial({color:0xffc15a}),ped=new T.MeshLambertMaterial({color:0x4a4036});
for(let i=0;i<8;i++){const [x,z]=P2(6),ph=rng()*9,ch=.34+rng()*.2,pedH=.55+rng()*.35,g=new T.Group();g.position.set(x,0,z);
const base=new T.Mesh(CG,ped);base.scale.set(.42,pedH,.42);base.position.y=pedH/2;g.add(base);
const body=new T.Mesh(CG,wax);body.scale.set(.17,ch,.17);body.position.y=pedH+ch/2;g.add(body);
const pool=new T.Mesh(CG,wax);pool.scale.set(.2,.03,.2);pool.position.y=pedH+ch;g.add(pool);
const dsh=new T.Mesh(CG,dish);dsh.scale.set(.34,.05,.34);dsh.position.y=pedH;g.add(dsh);
const fl=new T.Mesh(FG,flm);fl.position.y=pedH+ch+.14;g.add(fl);
const halo=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:0xffa64a,blending:T.AdditiveBlending,transparent:true,depthWrite:false,opacity:.7,fog:false}));halo.scale.setScalar(1.7);halo.position.y=pedH+ch+.16;g.add(halo);
grp.add(g);WORLD.flames.push({g,fl,halo,y:pedH+ch/2,ph,fixed:1})}
// dust motes
WORLD.dv={vy:.15,top:6.8};
mkMotes(grp,Math.max(8,Math.round(320*LOD.dust)),0xd8e4ff,.1,.5,6.5)}
}
if(!WORLD.dust&&!opt.parkour){const M={meadow:[0xfff0a8,.13,.75,10,.06],sunset:[0xffa24a,.15,.85,12,.45],frost:[0xffffff,.14,.9,12,-1.1],neon:[0x4ffff0,.12,.85,12,.55],desert:[0xffe6b0,.14,.8,12,.08],autumn:[0xffa84a,.15,.8,12,-.25],toxic:[0x9aff5a,.13,.85,12,.5]}[key];
if(M){mkMotes(grp,Math.max(10,Math.round(220*LOD.dust)),M[0],M[1],M[2],M[3]);WORLD.dv={vy:M[4],top:M[3]}}}
if(opt.parkour)WORLD.course=PK.build({blk,reg,P,glow,rng,th,key,lerpC,grp,diff:opt.parkour,map:opt.pkmap});
// finish geometry
const smat=new T.MeshLambertMaterial({vertexColors:true});if(fxOn)fogFx(smat,"s");
const sm=solid.mesh(smat);sm.castShadow=true;sm.receiveShadow=true;grp.add(sm);
if(glow.p.length){const gmesh=glow.mesh(new T.MeshBasicMaterial({vertexColors:true}));grp.add(gmesh)}
sc.add(grp);WORLD.group=grp;WORLD.theme=key;WORLD.seed=seed;
if(!ruin)bakeGround(gt,th,!LOD.sh);else if(!LOD.sh)sun.intensity*=.35
// spawn points (farthest-point sampling over free ground)
const cand=[];for(let i=0;i<400&&cand.length<60;i++){const [x,z]=P2(8);if(free(x,z,1.3)&&!blocked(x,z,0,1.2))cand.push([x,z])}
const sp=[];if(cand.length){sp.push(cand[0]);while(sp.length<14&&sp.length<cand.length){let bi=-1,bd=-1;cand.forEach((c,i)=>{let m=1e9;for(const s of sp)m=Math.min(m,Math.hypot(c[0]-s[0],c[1]-s[1]));if(m>bd){bd=m;bi=i}});sp.push(cand[bi]);cand.splice(bi,1)}}
if(!sp.length)sp.push([0,H-8]);WORLD.spawns=sp.map(s=>({x:s[0],z:s[1]}));
if(WORLD.course)WORLD.spawns=[{x:WORLD.course.cps[0].x,z:WORLD.course.cps[0].z}];
return WORLD}

function mkMotes(grp,n,col,size,op,top){const dp=new Float32Array(n*3);for(let i=0;i<n;i++){dp[i*3]=(Math.random()-.5)*H*2;dp[i*3+1]=Math.random()*top;dp[i*3+2]=(Math.random()-.5)*H*2}
const dg=new T.BufferGeometry();dg.setAttribute("position",new T.BufferAttribute(dp,3));const dm=new T.Points(dg,new T.PointsMaterial({map:SOFTDOT,color:col,size,transparent:true,opacity:op,depthWrite:false,blending:T.AdditiveBlending}));dm.frustumCulled=false;grp.add(dm);WORLD.dust=dm}
function freeSpot(x,z,rad){rad=rad||1;for(let r=0;r<80;r++){const px=x+(rnd()-.5)*r*.6,pz=z+(rnd()-.5)*r*.6;if(Math.abs(px)<H-2&&Math.abs(pz)<H-2&&!blocked(px,pz,0,rad))return{x:px,z:pz}}return{x:0,z:H-8}}
function awaySpot(ax,az,d){const sp=WORLD.spawns.filter(s=>Math.hypot(s.x-ax,s.z-az)>(d||22));if(sp.length&&rnd()<.8)return pk(sp);
for(let r=0;r<60;r++){const x=(rnd()-.5)*(H*2-8),z=(rnd()-.5)*(H*2-8);if(Math.hypot(x-ax,z-az)>(d||22)&&!blocked(x,z,0,1))return{x,z}}return freeSpot(0,0)}

// per-frame world animation (sky follows camera, lamp flicker, dust drift)
function worldFrame(dt,t){
Sky.m.position.copy(cam.position);Sky.u.time.value=t;
for(const l of WORLD.lights)l.intensity=l.userData.base*(.82+.18*Math.sin(t*7+l.userData.ph)*Math.sin(t*2.3+l.userData.ph*2)+(Math.sin(t*31+l.userData.ph)>.97?-.4:0));
if(WORLD.dust){const dv=WORLD.dv||{vy:.15,top:6.8},a=WORLD.dust.geometry.attributes.position,up=dv.vy>0;for(let i=0;i<a.count;i++){let y=a.getY(i)+dt*dv.vy*(1+i%3*.4);if(up){if(y>dv.top)y=.2}else if(y<0)y=dv.top;a.setY(i,y);a.setX(i,a.getX(i)+Math.sin(t*.3+i)*dt*.1)}a.needsUpdate=true}
if(WORLD.flames)for(const c of WORLD.flames){const f=.9+.1*Math.sin(t*9+c.ph)+.06*Math.sin(t*23+c.ph*3);c.fl.scale.set(f,.8+.4*f,f);c.halo.material.opacity=.5+.3*f;if(!c.fixed){c.g.position.y=c.y+Math.sin(t*.8+c.ph)*.12;c.g.rotation.y=t*.2+c.ph}}}
