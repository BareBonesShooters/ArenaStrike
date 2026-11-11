"use strict";
// ---------- lighting: sun shadows that follow the player, the per-tier light balance, and the Blackout darkness with a flashlight ----------
const Light=(()=>{
// the flashlight stays in the scene at zero strength, so switching it on never makes every material recompile
const flashL=new T.SpotLight(0xfff0d2,0,34,.5,.55,1.2);flashL.castShadow=false;sc.add(flashL,flashL.target);
const dir=new T.Vector3(),fw=new T.Vector3(),TMP=new T.Color();
// Blackout: the sky, fog and lights fade almost to black, only a short fog distance stays visible
const DARK={sky:[0x010104,0x030409,0x070a13],cloud:0x0b0d16,fog:0x020308,hc:0x3a4670,hg:0x040509,sun:0x5060a0};
let K=0,TG=0,snap=null;
function take(){const u=Sky.u;return{cT:u.cT.value.clone(),cM:u.cM.value.clone(),cH:u.cH.value.clone(),cc:u.cc.value.clone(),stars:u.stars.value,
fog:sc.fog.color.clone(),near:sc.fog.near,far:sc.fog.far,hc:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,sc:sun.color.clone(),si:sun.intensity}}
function apply(k){const B=snap,u=Sky.u;if(!B||!sc.fog)return;
u.cT.value.copy(B.cT).lerp(TMP.setHex(DARK.sky[0]),k);u.cM.value.copy(B.cM).lerp(TMP.setHex(DARK.sky[1]),k);u.cH.value.copy(B.cH).lerp(TMP.setHex(DARK.sky[2]),k);u.cc.value.copy(B.cc).lerp(TMP.setHex(DARK.cloud),k);
u.stars.value=B.stars+(1-B.stars)*k*.6;
sc.fog.color.copy(B.fog).lerp(TMP.setHex(DARK.fog),k);if(sc.background&&sc.background.isColor)sc.background.copy(sc.fog.color);
sc.fog.near=B.near+(3-B.near)*k;sc.fog.far=B.far+(30-B.far)*k;
hemi.color.copy(B.hc).lerp(TMP.setHex(DARK.hc),k);hemi.groundColor.copy(B.hg).lerp(TMP.setHex(DARK.hg),k);hemi.intensity=B.hi*(1-.8*k);
sun.color.copy(B.sc).lerp(TMP.setHex(DARK.sun),k);sun.intensity=B.si*(1-.92*k)}
function restore(){if(snap){apply(0);snap=null}K=TG=0;flashL.intensity=0}
// keeps the sun's shadow box centred a little ahead of the camera, so the whole shadow map is spent where you look (about twice as sharp as one box over the arena)
// the title and lobby cameras look out over the whole map, so there the box covers the whole arena instead
function shadows(){if(!sun.castShadow)return;const near=state==="play"||state==="pause",R=near?LOD.shR||62:62,cm=sun.shadow.camera;
if(cm.right!==R){cm.left=cm.bottom=-R;cm.right=cm.top=R;cm.updateProjectionMatrix()}
dir.copy(sun.position).sub(sun.target.position);if(dir.lengthSq()<1e-6)return;dir.normalize();
cam.getWorldDirection(fw);fw.y=0;if(fw.lengthSq()>1e-6)fw.normalize();
const s=4*R/sun.shadow.mapSize.x;let x=near?cam.position.x+fw.x*R*.35:0,z=near?cam.position.z+fw.z*R*.35:0;x=Math.round(x/s)*s;z=Math.round(z/s)*s;
sun.target.position.set(x,0,z);sun.position.copy(sun.target.position).addScaledVector(dir,100);sun.target.updateMatrixWorld()}
return{
// after buildWorld sets the theme lights: tiers with shadows get a stronger sun and a little less fill, so shadows read clearly
world(){snap=null;K=TG=0;flashL.intensity=0;if(LOD.sh){sun.intensity*=1.15;hemi.intensity*=.82}},
// 1 fade to dark, 0 fade back, -1 snap back at once (match ended or the map is about to be rebuilt)
blackout(v){if(v<0)return restore();if(v>0&&!snap&&sc.fog)snap=take();TG=v>0?1:0},
get dark(){return K},
frame(dt){shadows();
if(snap){K+=(TG-K)*Math.min(1,dt*1.6);if(TG===0&&K<.01){restore();return}apply(K)}
if(K>.01){cam.getWorldDirection(fw);flashL.position.copy(cam.position).addScaledVector(fw,.3);flashL.position.y-=.25;flashL.target.position.copy(cam.position).addScaledVector(fw,12);flashL.target.updateMatrixWorld();
flashL.intensity=K*(state==="play"||state==="pause"?1.7:0)}else if(flashL.intensity)flashL.intensity=0}}})();
