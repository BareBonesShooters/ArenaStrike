"use strict";
// ---------- terrain: warm heightmap hills, woods and boulders around the arena, and instanced grass inside it ----------
// Looks only. The playing field stays flat (floorAt, bots and online matches never see any of this), and every part uses its own seeded
// random stream, so the arena an online match builds from its seed is unchanged.
const Terrain=(()=>{
// smooth value noise from a seeded lattice; fbm adds octaves for rolling shapes, ridge folds it into sharp crests for the far peaks
function noise2(seed){
const N=256,v=new Float32Array(N*N),r=mkRng(seed>>>0||1);for(let i=0;i<N*N;i++)v[i]=r();
const at=(i,j)=>v[(j&255)*N+(i&255)],sm=t=>t*t*(3-2*t);
const n=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),fx=sm(x-i),fz=sm(z-j),a=at(i,j),b=at(i+1,j),c=at(i,j+1),d=at(i+1,j+1);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz};
const fbm=(x,z,o)=>{let s=0,a=.5,f=1,t=0;for(let k=0;k<(o||4);k++){s+=a*n(x*f+k*17.3,z*f-k*9.1);t+=a;a*=.5;f*=2.03}return s/t};
return{n,fbm,ridge:(x,z)=>{let s=0,a=.5,f=1,t=0;for(let k=0;k<4;k++){s+=a*(1-Math.abs(2*n(x*f+k*31.7,z*f+k*5.3)-1));t+=a;a*=.5;f*=2.1}return s/t}}}
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const tier=()=>typeof S!=="undefined"&&S&&S.gfx!=null?S.gfx:1;
const col=c=>new T.Color(c);
// slate-blue rock, a cool blue for the far ranges, a pale straw for the odd dry grass clump
const ROCK=[0x3e5372,0x33455f,0x4b6386,0x2b3a52],FAR=0x5d7aa6,GOLD=0xb7b46e;

// the land shape, shared by the mountains mesh and everything placed on it.
// Low meadow hills just past the walls, then foothills, then a ring of tall, sharp ranges (ridged noise raised to a power for crisp peaks),
// and behind them a second, higher range. A slow domain warp bends the ridges so they wind instead of lining up on the noise grid.
function land(seed){
const no=noise2(seed^0x2c1b3c6d),pk=(v,p)=>Math.pow(v,p);
const h=(x,z)=>{const r=Math.hypot(x,z),dS=Math.max(Math.abs(x),Math.abs(z));
if(dS<41.5)return -.3;
const wx=x+(no.fbm(x*.006,z*.006,2)-.5)*70,wz=z+(no.fbm(x*.006+50,z*.006-20,2)-.5)*70,
n=no.fbm(wx*.011,wz*.011),near=ss(41.5,47,dS),
y=near*(.4+1.6*no.fbm(x*.05,z*.05,3))*ss(42,60,dS)
+ss(46,80,r)*12*(.35+1.1*n)                                        // rolling hills
+ss(70,150,r)*24*(.15+n)                                           // foothills
+ss(125,200,r)*pk(no.ridge(wx*.011,wz*.011),1.7)*55                  // the main ranges
+ss(200,290,r)*pk(no.ridge(wx*.006+3.1,wz*.006-7.7),1.5)*55      // the high range behind
+ss(80,200,r)*(no.fbm(x*.04,z*.04,2)-.5)*6;                         // crags
return -.3+(.3+y)*near};
const wood=(x,z)=>ss(.42,.58,no.fbm(x*.025+40,z*.025-11,3)); // where the woodland patches are
const slope=(x,z)=>Math.hypot(h(x+1,z)-h(x-1,z),h(x,z+1)-h(x,z-1))/2;
return{no,h,wood,slope}}

// Mountains: one polar-grid mesh (a single draw call) that replaces the flat land disk and the icosahedron mountains.
// Rows get further apart with distance, so the facets stay about the same size on screen near and far.
// Coloured per vertex: grass, dark woodland floor, scree, banded rock on steep or high ground, snow above the snow line,
// with valleys darkened and crests lightened (a cheap stand-in for ambient occlusion) so the shapes read from far away.
function hills(grp,th,seed,fxOn){
const L=land(seed),no=L.no,t=tier(),nR=[42,36,30][t]||30,nA=[132,112,96][t]||96,R0=20,R1=400;
const pos=[],idx=[];
for(let i=0;i<=nR;i++){const f=i/nR,r=R0*Math.pow(R1/R0,f);for(let j=0;j<nA;j++){const jr=i>2?.35:0,a=(j+(i&1)*.5+(no.n(i*7.1,j*3.3)-.5)*jr)/nA*Math.PI*2,rr=r*(1+(no.n(j*5.7,i*2.9)-.5)*jr*.08),x=Math.cos(a)*rr,z=Math.sin(a)*rr;pos.push(x,L.h(x,z),z)}} // points nudged off the grid so the facets come out irregular
for(let i=0;i<nR;i++)for(let j=0;j<nA;j++){const a=i*nA+j,b=i*nA+(j+1)%nA,c=a+nA,d=b+nA;idx.push(a,b,c,b,d,c)}
const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
const nm=g.attributes.normal,cs=[],C=new T.Color(),G=th.gr||{},gv=(G.v&&G.v.length?G.v:[G.base||"#5da34a"]).map(col),
wood=(th.leaf&&th.leaf.length?th.leaf:[0x2f7a3a]).map(col).sort((p,q)=>p.getHSL({}).l-q.getHSL({}).l)[0].multiplyScalar(.7),
mc=(th.mount||[0x7189a0]).map(col),rock=ROCK.map(col),scree=col(0x8e9c96),snow=col(0xe8eef8),far=col(FAR),
haze=col(th.fog?th.fog[0]:0xcfe4f7);
for(let k=0;k<pos.length/3;k++){const x=pos[k*3],y=pos[k*3+1],z=pos[k*3+2],ny=nm.getY(k),r=Math.hypot(x,z),n=no.n(x*.09,z*.09),m=no.fbm(x*.025+40,z*.025-11,3),
e=Math.max(3,r*.03),cv=y-(L.h(x+e,z)+L.h(x-e,z)+L.h(x,z+e)+L.h(x,z-e))/4;     // above or below its surroundings: a crest or a gully
C.copy(gv[Math.min(gv.length-1,Math.floor(n*gv.length))]).lerp(gv[0],.3);
C.lerp(wood,Math.max(ss(.42,.58,m)*.85,ss(8,20,y)*.55)*ss(1.5,5,y)*(1-ss(30,44,y)));  // dark green forested slopes
C.lerp(scree,ss(.9,.78,ny)*ss(20,36,y)*.5);                                       // pale scree where the grass thins
const rc=rock[Math.min(3,Math.floor(no.n(x*.05-3,z*.05+9)*4))];C.lerp(rc,Math.max(ss(.84,.66,ny),ss(22,40,y+n*8)));
C.multiplyScalar(1+.07*Math.sin(y*.45+n*4)*ss(.85,.6,ny));                        // faint rock strata on the cliffs
C.lerp(snow,ss(80,94,y+n*6-cv*.5)*ss(.5,.75,ny)*(th.night>.3?.7:1));              // snow above the line, on all but the sheerest faces
C.multiplyScalar((.86+.16*ny)*(1+Math.max(-.28,Math.min(.14,cv*.035))));
C.lerp(far,ss(170,300,r)*.55*(1-ss(80,94,y)));C.lerp(haze,ss(120,330,r)*.15);cs.push(C.r,C.g,C.b)} // the far range turns blue with distance, its snow stays white
g.setAttribute("color",new T.Float32BufferAttribute(cs,3));
// low-poly like the rest of the game: split into separate triangles, each one flat-lit and a single colour (the average of its corners)
const fg=g.toNonIndexed(),fc=fg.attributes.color.array;for(let i=0;i<fc.length;i+=9)for(let c=0;c<3;c++){const v=(fc[i+c]+fc[i+3+c]+fc[i+6+c])/3;fc[i+c]=fc[i+3+c]=fc[i+6+c]=v}
fg.computeVertexNormals();g.dispose();
const mat=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});if(fxOn)fogFx(mat,"hl"); // same fog, mist and cloud shadows as the walls
// thinner fog the higher up the mountain, so the summits stand above the haze instead of fading out at the fog's far distance
const pb=mat.onBeforeCompile;mat.onBeforeCompile=sh=>{if(pb)pb(sh);sh.vertexShader=sh.vertexShader.replace("#include <fog_vertex>","#include <fog_vertex>\n#ifdef USE_FOG\nvFogDepth*=1.-.8*smoothstep(4.,70.,(modelMatrix*vec4(transformed,1.)).y);\n#endif")};
if(!fxOn)mat.customProgramCacheKey=()=>"hlf";
const m=new T.Mesh(fg,mat);m.name="hills";m.receiveShadow=true;m.userData.noAO=true;grp.add(m);return L}

// merge non-indexed geometries (position and normal only) into one
function merge(gs){const p=[],n=[];for(const g0 of gs){const g=g0.index?g0.toNonIndexed():g0;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array)}
const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("normal",new T.Float32BufferAttribute(n,3));return g}

// an open six-sided cone as six triangles (three.js's ConeGeometry spends another six on a degenerate tip)
function cone(rad,y0,y1){const p=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=(i+1)/6*Math.PI*2;p.push(Math.cos(a)*rad,y0,Math.sin(a)*rad,0,y1,0,Math.cos(b)*rad,y0,Math.sin(b)*rad)}
const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g}
// Woods and boulders on the hills: two InstancedMeshes (two draw calls) of very low-poly shapes, coloured per instance.
// Round broadleaf crowns and squashed boulders share one icosahedron; pines are two stacked six-sided cones.
function forest(grp,th,seed,L,fxOn){
const t=tier(),want=[1500,1100,700][t]||700,r=mkRng((seed^0x7f4a7c15)>>>0||1),
blobG=new T.IcosahedronGeometry(.5,0),pineG=merge([cone(.5,-.5,.12),cone(.36,0,.5)]),
leaf=(th.leaf&&th.leaf.length?th.leaf:[0x2f7a3a]).map(col).sort((p,q)=>p.getHSL({}).l-q.getHSL({}).l),
rock=ROCK.map(col),blobs=[],pines=[],C=new T.Color();let nRock=0;
for(let tries=0;blobs.length+pines.length<want&&tries<want*8;tries++){
const a=r()*Math.PI*2,rad=46+130*Math.sqrt(r()),x=Math.cos(a)*rad,z=Math.sin(a)*rad;
if(Math.max(Math.abs(x),Math.abs(z))<45)continue;
const y=L.h(x,z),s=L.slope(x,z),w=L.wood(x,z),u=r();
if(y<34&&s<.9&&u<w*.9+.03){ // a tree: pines higher up and on the slopes, broadleaf lower down
const pine=y>13+r()*8||s>.4;
if(pine){const ht=5+r()*5,wd=ht*(.42+r()*.12);C.copy(leaf[0]).multiplyScalar(.7+r()*.25);pines.push([x,y+ht*.42,z,wd,ht,wd,r()*6,C.getHex()])}
else{const sz=2.4+r()*2;C.copy(leaf[Math.floor(r()*Math.min(2,leaf.length))]).multiplyScalar(.8+r()*.2);
blobs.push([x,y+sz*(.3-s*.25),z,sz*(1+r()*.3),sz*(.85+r()*.3),sz*(1+r()*.3),r()*6,C.getHex()])}}
else if(s>.6&&y<30&&nRock<want*.05&&u<.04){nRock++;const sz=1.5+r()*2.5;C.copy(rock[Math.floor(r()*rock.length)]).multiplyScalar(.85+r()*.25); // a boulder on steep or high ground
blobs.push([x,y-sz*.05,z,sz*1.4,sz*.75,sz*(1+r()*.4),r()*6,C.getHex()])}}
const M=new T.Matrix4(),Q=new T.Quaternion(),V=new T.Vector3(),Sc=new T.Vector3(),Y=new T.Vector3(0,1,0),out=[];
for(const [geo,list,tag] of[[blobG,blobs,"fb"],[pineG,pines,"fp"]]){if(!list.length)continue;
const mat=new T.MeshLambertMaterial();if(fxOn)fogFx(mat,tag); // fogFx handles instancing, so the woods fade into the same haze as the hills
const im=new T.InstancedMesh(geo,mat,list.length);
list.forEach((q,i)=>{M.compose(V.set(q[0],q[1],q[2]),Q.setFromAxisAngle(Y,q[6]),Sc.set(q[3],q[4],q[5]));im.setMatrixAt(i,M);im.setColorAt(i,C.setHex(q[7]))});
im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;im.computeBoundingSphere();
im.name="forest";im.userData.noAO=true;grp.add(im);out.push(im)}
return out}

// Grass: one InstancedMesh of small clumps of single-triangle blades, swaying in the wind and shrinking to nothing past ~40 m,
// where the ground texture's own blade detail takes over. Medium and up only; Low and Potato keep the painted ground.
let CLUMP=null;
function clump(){if(CLUMP)return CLUMP;
const p=[],gh=[],c=[],r=mkRng(0x9e3779b1),NB=8;
for(let b=0;b<NB;b++){const a=(b+r()*.6)/NB*Math.PI*2,o=.03+r()*.12,ox=Math.cos(a)*o,oz=Math.sin(a)*o,ht=.26+r()*.3,w=.026+r()*.016,fa=a+Math.PI/2+(r()-.5)*.8,
fx=Math.cos(fa)*w,fz=Math.sin(fa)*w,lean=.06+r()*.14,tx=ox+Math.cos(a)*lean,tz=oz+Math.sin(a)*lean;
// one tapered triangle per blade, leaning outward from the clump's middle
p.push(ox-fx,0,oz-fz, ox+fx,0,oz+fz, tx,ht,tz);gh.push(0,0,1);const lb=.5+r()*.1,lt=1.05+r()*.2;c.push(lb,lb,lb,lb,lb,lb,lt,lt,lt)}
const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("gh",new T.Float32BufferAttribute(gh,1));
g.setAttribute("color",new T.Float32BufferAttribute(c,3));const n=new Float32Array(p.length);for(let i=1;i<n.length;i+=3)n[i]=1;g.setAttribute("normal",new T.BufferAttribute(n,3)); // lit like the ground under it
return CLUMP=g}
function grass(grp,th,seed,ok,fxOn){
const t=tier();if(t>2||th.snow>.8||th.night>.3)return null;
const want=[8000,6000,3800][t],no=noise2(seed^0x51ed270b),r=mkRng((seed^0x1b873593)>>>0||1),G=th.gr||{},
base=col(G.base||"#5da34a"),vs=(G.v||[]).map(col),leaf=(th.leaf||[]).map(col),gold=col(GOLD),
mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),amp=(Tune.n("gfx.grassWind",.13,0,.4)).toFixed(3);
mat.onBeforeCompile=sh=>{sh.uniforms.windT=Sky.u.time;
sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float gh;uniform float windT;").replace("#include <begin_vertex>",`#include <begin_vertex>
vec2 ip=instanceMatrix[3].xz;float fd=1.-smoothstep(26.,40.,distance(ip,cameraPosition.xz));transformed*=fd;
float wp=windT*1.8+ip.x*.23+ip.y*.19;vec3 wd=vec3(sin(wp)+.35*sin(wp*2.3+ip.y),0.,.55*cos(wp*1.4));transformed+=gh*gh*${amp}*(wd*mat3(instanceMatrix));`);
sh.fragmentShader=sh.fragmentShader.replace("#include <normal_fragment_begin>","#include <normal_fragment_begin>\nnormal=normalize(vNormal);");};
if(fxOn)fogFx(mat,"gr"+amp);else mat.customProgramCacheKey=()=>"grass"+amp;
const im=new T.InstancedMesh(clump(),mat,want),M=new T.Matrix4(),Q=new T.Quaternion(),V=new T.Vector3(),Sc=new T.Vector3(),Y=new T.Vector3(0,1,0),C=new T.Color();
let k=0;for(let tries=0;k<want&&tries<want*5;tries++){const x=(r()-.5)*(H*2-2),z=(r()-.5)*(H*2-2),d=no.fbm(x*.07,z*.07,3);
if(r()>ss(.3,.62,d)+.08||!ok(x,z))continue;                                    // patchy: thick tufts in some places, bare earth in others
const s=.7+r()*.6+d*.35;M.compose(V.set(x,0,z),Q.setFromAxisAngle(Y,r()*Math.PI*2),Sc.set(s,s*(.8+r()*.5),s));im.setMatrixAt(k,M);
C.copy(vs.length?vs[Math.floor(r()*vs.length)]:base);if(leaf.length&&r()<.3)C.lerp(leaf[Math.floor(r()*leaf.length)],.45);
if(r()<.06+.1*(1-d))C.lerp(gold,.25+r()*.2);                                    // dry straw-coloured clumps, more of them where the grass is thin
C.lerp(base,.2).multiplyScalar(.95+r()*.15);im.setColorAt(k,C);k++}
im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
im.frustumCulled=false;im.receiveShadow=t<=1;im.userData.noAO=true;im.name="grass";grp.add(im);return im}
return{hills,forest,grass}})();
