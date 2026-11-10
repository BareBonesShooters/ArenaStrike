"use strict";
// ---------- stylized look: post-processing and character rim light ----------
// Ultra High, High and Medium draw the scene through a small effect chain: scene, ambient occlusion (Ultra only), the gun,
// bloom, a colour grade (soft highlight roll-off, punchier colour, cool shadows, warm highlights, vignette) and anti-aliasing.
// Low and Potato skip the chain and draw straight to the screen. Every tier keeps the rim light on players and monsters.
const Post=(()=>{
const RIM={k:{value:.45},c:{value:new T.Color(0xcfe4ff)}};
// tier settings by post level: 3 Ultra High, 2 High, 1 Medium, 0 off
const LV=[null,
{bloom:null,half:true,aa:"fxaa",ao:false,hdr:false},
{bloom:[.3,.4,1.35],half:false,aa:"fxaa",ao:false,hdr:true},
{bloom:[.36,.45,1.35],half:false,aa:"smaa",ao:true,hdr:true}];
const GradeShader={
uniforms:{tDiffuse:{value:null},uExp:{value:1.04},uSat:{value:1.16},uCon:{value:1.07},uLift:{value:new T.Vector3(.012,.02,.045)},uGain:{value:new T.Vector3(1.03,1.01,.97)},uVig:{value:.28},uK:{value:.78}},
vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
fragmentShader:`uniform sampler2D tDiffuse;uniform float uExp,uSat,uCon,uVig,uK;uniform vec3 uLift,uGain;varying vec2 vUv;
vec3 shoulder(vec3 x){vec3 o=x-uK;return mix(x,uK+(1.-uK)*(1.-exp(-o/(1.-uK))),step(uK,x));}
void main(){vec4 t=texture2D(tDiffuse,vUv);vec3 c=shoulder(max(t.rgb*uExp,0.));
float l=dot(c,vec3(.299,.587,.114)),mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));
c=mix(vec3(l),c,uSat+(1.-(mx-mn))*.12);
c=clamp((c-.5)*uCon+.5,0.,1.);
c=c*uGain+uLift*(1.-c);
vec2 d=vUv-.5;c*=1.-uVig*smoothstep(.35,.85,length(d*vec2(1.25,1.)));
gl_FragColor=vec4(clamp(c,0.,1.),t.a);}`};
let cmp=null,lvl=0,rp,ao,vmp,bloom,grade,aa,vmOn=false,hdrOn=false,gm=null;
// draws the first-person gun into the frame after the world (and its ambient occlusion), so the gun gets bloom and grading too
class VMPass extends T.Pass{constructor(){super();this.needsSwap=false}
render(r,wb,rb){if(!vmOn)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(VM.scene,VM.cam);r.autoClear=ac}}
function canHDR(){try{return rd.capabilities.isWebGL2&&!!rd.extensions.get("EXT_color_buffer_float")&&!SOFT}catch(e){return false}}
function build(L){
dispose();
const pr=rd.getPixelRatio(),w=innerWidth,h=innerHeight,hdr=L.hdr&&canHDR();hdrOn=hdr;gm=null;
const rt=new T.WebGLRenderTarget(w*pr,h*pr,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,type:hdr?T.HalfFloatType:T.UnsignedByteType,stencilBuffer:false});
cmp=new T.EffectComposer(rd,rt);cmp.setPixelRatio(pr);cmp.setSize(w,h);
rp=new T.RenderPass(sc,cam);cmp.addPass(rp);
// ambient occlusion runs at half resolution with a depth texture (one extra cheap scene draw instead of two full-size ones); the soft result hides the lower resolution
if(L.ao&&T.SAOPass){ao=new T.SAOPass(sc,cam,true,false,new T.Vector2(w*pr/2,h*pr/2));{const dt=ao.beautyRenderTarget.depthTexture;for(const m of[ao.saoMaterial,ao.vBlurMaterial,ao.hBlurMaterial])m.uniforms.tDepth.value=dt}/* r128 SAOPass hands its shaders `true` instead of the depth texture */const ss=ao.setSize.bind(ao);ao.setSize=(x,y)=>ss(Math.max(1,x/2),Math.max(1,y/2));const p=ao.params;p.saoBias=.5;p.saoIntensity=.012;p.saoScale=6;p.saoKernelRadius=14;p.saoMinResolution=0;p.saoBlur=true;p.saoBlurRadius=4;p.saoBlurStdDev=3;p.saoBlurDepthCutoff=.01;cmp.addPass(ao)}
vmp=new VMPass();cmp.addPass(vmp);
// bloom needs the HDR buffer: lit ground already reaches 1.0, so only light sources above that (glow parts, sun, muzzle flash, sparks) should glow
const b=L.bloom,bs=L.half?.5:1;if(b&&hdr){bloom=new T.UnrealBloomPass(new T.Vector2(w*bs,h*bs),b[0],b[1],b[2]);bloom.highPassUniforms.smoothWidth.value=.25;cmp.addPass(bloom)}
grade=new T.ShaderPass(GradeShader);cmp.addPass(grade);
if(L.aa==="smaa"&&T.SMAAPass){aa=new T.SMAAPass(w*pr,h*pr)}else{aa=new T.ShaderPass(T.FXAAShader);aa.material.uniforms.resolution.value.set(1/(w*pr),1/(h*pr))}
cmp.addPass(aa)}
function dispose(){hdrOn=false;glowGain();if(!cmp)return;try{for(const p of cmp.passes){if(p.dispose)p.dispose()}cmp.renderTarget1.dispose();cmp.renderTarget2.dispose()}catch(e){}cmp=null;rp=ao=vmp=bloom=grade=aa=null}
// per-level colour: night and fog levels get less saturation boost so they stay moody, bright ones get more punch
function look(){if(!grade)return;const th=THEMES[WORLD.theme]||{},n=th.night||0,g=th.grade||{},u=grade.uniforms;
u.uSat.value=g.sat!=null?g.sat:1.16-n*.1;u.uCon.value=g.con!=null?g.con:1.07;u.uExp.value=g.exp!=null?g.exp:1.04+n*.06;u.uVig.value=g.vig!=null?g.vig:.26+n*.1;
if(bloom)bloom.strength=LV[lvl].bloom[0]*(g.bloom!=null?g.bloom:1+n*.35)}
// glowing scenery is pushed past 1.0 only when the HDR buffer is on, so it blooms there and looks exactly as before everywhere else
function glowGain(){const m=WORLD.glowM;if(m)m.color.setScalar(hdrOn?1.8:1)}
let lastTheme="";
return{RIM,
get on(){return !!cmp},
get passes(){return cmp?cmp.passes:[]},
// level: 0 off, 1 Medium, 2 High, 3 Ultra High
set(l){l=l|0;if(SOFT)l=0;if(l===lvl&&(!!cmp)===(l>0))return;lvl=l;if(l>0){try{build(LV[l]);lastTheme=""}catch(e){console.error(e);dispose();lvl=0}}else dispose()},
size(){if(cmp)try{build(LV[lvl]);lastTheme=""}catch(e){dispose();lvl=0}},
rimK(v){RIM.k.value=v},
render(withVM){vmOn=withVM;if(WORLD.glowM!==gm){gm=WORLD.glowM;glowGain()}if(WORLD.theme!==lastTheme){lastTheme=WORLD.theme;look()}cmp.render()},
frame(){RIM.c.value.copy(Sky.u.cT.value).lerp(Sky.u.sunCol.value,.45).lerp(C_W,.35)},
// adds a soft fresnel rim to a model's Lambert materials so players and monsters pop off the background
rim(g){g.traverse(o=>{if(!o.isMesh)return;for(const m of[].concat(o.material)){if(!m||!m.isMeshLambertMaterial||m.userData.rim)continue;m.userData.rim=1;const prev=m.onBeforeCompile;
m.onBeforeCompile=sh=>{if(prev)prev(sh);sh.uniforms.rimK=RIM.k;sh.uniforms.rimC=RIM.c;
sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vRimN;varying vec3 vRimV;").replace("#include <project_vertex>","#include <project_vertex>\nvRimN=normalize(transformedNormal);vRimV=-mvPosition.xyz;");
sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vRimN;varying vec3 vRimV;uniform float rimK;uniform vec3 rimC;").replace("#include <envmap_fragment>","#include <envmap_fragment>\nfloat rimF=pow(1.-clamp(dot(normalize(vRimN),normalize(vRimV)),0.,1.),2.6);outgoingLight+=rimC*rimF*rimK*(.35+.65*diffuseColor.rgb);")};
const ck=m.customProgramCacheKey;m.customProgramCacheKey=()=>(ck?ck.call(m):"")+"rim";m.needsUpdate=true}});return g}}})();
const C_W=new T.Color(1,1,1);
addEventListener("resize",()=>Post.size());
