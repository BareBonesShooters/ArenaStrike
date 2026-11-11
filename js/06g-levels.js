"use strict";
// ---------- Monster Rush levels ----------
// Every 5 waves is one level with its own map, monsters, boss and weather. Each level lives in its own file
// (js/06h-lv-<id>.js) and registers itself in LV_REG. This file holds the schedule, scaling, rewards,
// level modifiers and monster traits. Online co-op keeps the old single-arena behaviour (LV.on() is false).
//
// Wave slots inside a level: 1 plain, 2 the level's own modifier, 3 champion (a mini-boss), 4 rotating modifier, 5 boss.
const LV_REG={};
const LV_ORDER=["hollow","dunes","corrupt","spire","frost","swamp","forge","temple"];
const LV_DIFF={easy:.6,medium:1,hard:1.5,impossible:2.2}; // coins and Battle Pass XP by difficulty (Nightmare = impossible)
const LV=(()=>{
const on=()=>typeof mode!=="undefined"&&mode==="waves"&&!(typeof PT!=="undefined"&&PT.on);
const idxOf=w=>Math.floor(Math.max(0,(w|0)-1)/5);
const idx=()=>idxOf(wave);
const cycle=i=>Math.floor((i==null?idx():i)/LV_ORDER.length);
const idAt=i=>LV_ORDER[((i%LV_ORDER.length)+LV_ORDER.length)%LV_ORDER.length];
const defAt=i=>LV_REG[idAt(i)]||null;
const cur=()=>on()?defAt(idx()):null;
const key=i=>"lv_"+idAt(i);
const slot=()=>((Math.max(1,wave)-1)%5)+1;
// register a level's theme with the world builder (called once per level file, after THEMES exists)
function reg(d){LV_REG[d.id]=d;if(d.theme&&typeof THEMES!=="undefined"){THEMES["lv_"+d.id]=Object.assign({n:d.n,cloud:0,cc:[1,1,1],stars:0,pine:0,snow:0,night:0,crystal:0,trunk:0x6a4a30,
house:[0x999999],roof:[0x666666],leaf:[0x557744],mount:[0x777777,0x888888],win:0xffe0a0,lamp:0xffe0a0,flower:[0xffffff],wall:0x888888,trim:0x555555},d.theme,d.paint?{paint:d.paint}:{})}}
// ---- scaling: tougher every level, a big jump each time the 8 levels loop
const ramp=()=>on()?1+.06*idx()+.35*cycle():1;
const dmgRamp=()=>on()?1+.04*idx()+.25*cycle():1;
const spdCap=()=>5.4+(on()?Math.min(1.2,.1*idx()):0);
const countCap=()=>30+(on()?Math.min(20,2*idx()):0);
// ---- rewards: difficulty multiplier on coins and Battle Pass XP, and both grow with the level reached
const diffMul=()=>LV_DIFF[typeof diff!=="undefined"?diff:"medium"]||1;
const coinMul=()=>diffMul()*(1+.12*(on()?idx():0))*modCoin();
const bpMul=()=>diffMul()*(1+.1*(on()?idx():0));
const xpMul=()=>1+.1*(on()?idx():0); // in-run power-up XP

// ---- level modifiers
const MODS={
blackout:{n:"BLACKOUT",sub:"the lights die. Watch for glowing eyes",col:"#8fa3ff"},
heatwave:{n:"HEATWAVE",sub:"the air shimmers and monsters move faster",col:"#ffb04a",spd:1.18,coin:1.3},
surge:{n:"POWER SURGE",sub:"lightning strikes the marked rings",col:"#7af0ff",coin:1.3},
frenzy:{n:"FRENZY",sub:"the fewer monsters left, the faster they run",col:"#ff4a6a",coin:1.3},
giants:{n:"GIANTS",sub:"fewer monsters, but huge and tough",col:"#c58bff",count:.55,hp:2.3,scale:1.5,coin:2},
glass:{n:"GLASS CANNON",sub:"everyone hits twice as hard",col:"#fff16a",toYou:1.8,toMon:1.8,coin:1.4},
goldrush:{n:"GOLD RUSH",sub:"tougher monsters pay triple coins",col:"#ffd24a",hp:1.35,coin:3},
ghost:{n:"GHOST",col:"#5ff5ff"},
blizzard:{n:"BLIZZARD",col:"#cfe8ff",phase:"frost"},
blight:{n:"BLIGHT",col:"#b6f26a",phase:"blight"},
firestorm:{n:"FIRESTORM",col:"#ffa24a",phase:"ember"}};
const ROT=["ghost","glass","goldrush","frenzy"];
let mod="";
function modFor(i,s){const d=defAt(i);if(!d)return"";if(s===2)return d.mod||"";if(s===4)return i%2===1?"blizzard":ROT[Math.floor(i/2)%ROT.length];return""}
const M=()=>MODS[mod]||{};
function modCoin(){return mod?(M().coin||1):1}
// ---- wave start: called from nextWave. Returns {mod, champion, boss}
function startWave(){
mod="";clearOv();
if(!on())return null;
const s=slot(),i=idx(),d=cur();
const out={slot:s,mod:"",champion:s===3,boss:s===5,corrupt:!!(d&&d.corrupt)};
if(s!==5){mod=modFor(i,s);out.mod=mod}
// Blackout: the lights fade out (js/02c-light.js), your flashlight comes on, and the screen edges fall into darkness
if(mod==="blackout"){try{Light.blackout(1)}catch(e){}ov("radial-gradient(ellipse 60% 55% at 50% 52%,rgba(0,0,10,0) 30%,rgba(0,0,12,.55) 70%,rgba(0,0,8,.9) 100%)")}
if(mod==="heatwave")ov("linear-gradient(0deg,rgba(255,140,40,.22),rgba(255,200,120,.05) 50%,rgba(255,120,30,.18))","lvheat");
if(mod==="goldrush")ov("radial-gradient(ellipse at center,rgba(0,0,0,0) 50%,rgba(255,200,40,.22) 100%)");
if(mod==="frenzy")ov("radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(200,0,40,.25) 100%)");
surgeT=2;return out}
let ovEl=null;
function ov(bg,cls){clearOv();ovEl=document.createElement("div");ovEl.className="lvov"+(cls?" "+cls:"");ovEl.style.cssText="position:fixed;inset:0;z-index:7;pointer-events:none;background:"+bg;document.body.appendChild(ovEl)}
function clearOv(){if(ovEl){ovEl.remove();ovEl=null}}
function endWave(){mod="";clearOv();try{Light.blackout(0)}catch(e){}}
// the match ended or the map is being rebuilt: drop the modifier, its overlay and its lighting at once
function reset(){mod="";clearOv();try{Light.blackout(-1)}catch(e){}}
// ---- monsters
function pickType(fallback){const d=cur();if(!d||!d.mon||!d.mon.weights)return fallback();
const n=3+Math.max(0,Math.floor((wave-1)/10)),pool=d.mon.weights.filter(w=>w[1]>0&&(w[0]<3||w[0]<n+1||wave>=6));let tot=0;pool.forEach(w=>tot+=w[1]);let x=rnd()*tot;for(const [k,w] of pool){x-=w;if(x<=0)return k}return 0}
function monName(k){const d=on()?cur():null;return d&&d.mon&&d.mon.names?d.mon.names[(k|0)%d.mon.names.length]:null}
const hpMul=()=>{const d=cur();return ramp()*((d&&d.mon&&d.mon.hp)||1)*(M().hp||1)};
const spdMul=()=>{const d=cur();return((d&&d.mon&&d.mon.spd)||1)*(M().spd||1)};
const dmgMul=()=>{const d=cur();return dmgRamp()*((d&&d.mon&&d.mon.dmg)||1)};
const countMul=()=>M().count||1;
// dress a fresh monster model in the level's skin; returns nothing
function skin(g,k,o){const d=cur();if(!d||!d.skin)return;try{d.skin(g,k,o||{})}catch(err){console.warn("level skin",d.id,err)}
if(M().scale&&!(o&&o.boss))g.scale.multiplyScalar(M().scale)}
// after spawnMon builds e
function onSpawn(e){const d=cur();if(!d)return;e.lvTrait=d.mon&&d.mon.trait||"";
if(mod==="blackout"&&e.g){const eb=new T.MeshBasicMaterial({color:0xfff26a,fog:false}),hd=e.g.userData.head;if(hd)for(const x of[-.14,.14]){const m=new T.Mesh(new T.SphereGeometry(.075,8,6),eb);m.position.set(x,.06,.3);m.raycast=()=>{};hd.add(m);
const h=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,color:0xffd84a,transparent:true,opacity:.75,blending:T.AdditiveBlending,depthWrite:false,fog:false}));h.scale.setScalar(.55);h.raycast=()=>{};m.add(h)}}}
// player damage dealt to a monster: shield trait, glass cannon
function toMon(e,d,head){if(!on())return d;let m=M().toMon||1;if(e.lvTrait==="shield"&&!head&&!e.boss)m*=.7;return d*m}
// monster or boss damage to the player
function toYou(d){return on()?d*(M().toYou||1):d}
// melee hit landed on the player
function onMelee(e){if(!on()||!e)return;const t=e.lvTrait;
if(t==="chill"){P.lvChill=1.6;flash("Chilled!",500)}
else if(t==="toxic"){P.lvPoison=3;P.lvPT=.5}}
function moveMul(){return P.lvChill>0?.65:1}
function onDeath(e){if(!on()||!e||e.boss)return;const t=e.lvTrait,p=e.g.position,x=p.x,z=p.z;
if(t==="explode"&&!e.minion){ringFx(x,z,3.2,0xff6a1a,.6);setTimeout(()=>{if(state!=="play")return;Fx.burst({x,y:.6,z},0xff7a2a,26,9,.12,2,20);Gfx.flare({x,y:1,z},0xffb04a,5,.3);snd("boom",.5);
if(Math.hypot(P.x-x,P.z-z)<3.2&&P.y<2)hit(8+wave*.6,{x,z})},650)}
else if(t==="rise"&&!e.minion&&!e.lvRisen&&rnd()<.22){setTimeout(()=>{if(state!=="play"||mode!=="waves")return;spawnMon({k:e.k,x,z,rise:1})},900)}}
// per-frame: poison, chill, leap trait, power surge, frenzy
let surgeT=2,lpT=0;
function frame(dt){
if(P.lvChill>0)P.lvChill-=dt;
if(P.lvPoison>0){P.lvPoison-=dt;P.lvPT-=dt;if(P.lvPT<=0){P.lvPT=.5;const was=P.prot;P.prot=0;hit(1.5+wave*.08,null);P.prot=was}}
if(!on()||state!=="play"||menuOpen)return;
const d=cur();if(d&&d.frame)try{d.frame(dt,performance.now()/1000)}catch(err){}
if(mod==="surge"){surgeT-=dt;if(surgeT<=0){surgeT=2.2+rnd()*1.5;const a=rnd()*6.283,r=rnd()*7,x=clamp(P.x+Math.cos(a)*r+P.vx*.4,-H+2,H-2),z=clamp(P.z+Math.sin(a)*r+P.vz*.4,-H+2,H-2);
ringFx(x,z,2.6,0x7af0ff,1.1);setTimeout(()=>{if(state!=="play")return;try{Gfx.bolt(x,z,0xb8f8ff,true)}catch(err){}Fx.burst({x,y:.3,z},0x9af6ff,18,7,.1,2,16);snd("kill",.4);if(Math.hypot(P.x-x,P.z-z)<2.6&&P.y<2.2)hit(10+wave*.5,{x,z})},1100)}}
if(mod==="frenzy"){const alive=E.filter(e=>e.t==="mon"&&!e.boss).length,f=1+.6*clamp(1-alive/10,0,1);for(const e of E)if(e.t==="mon"&&!e.boss){if(e.lvBase==null)e.lvBase=e.spd;e.spd=e.lvBase*f}}
lpT-=dt;if(lpT<=0){lpT=.25;for(const e of E){if(e.lvTrait!=="leap"||e.boss||e.em>0||e.hp<=0)continue;e.lpCD=(e.lpCD||2+rnd()*2)-.25;
const p=e.g.position,dd=Math.hypot(P.x-p.x,P.z-p.z);if(e.lpCD<=0&&dd>3&&dd<9){e.lpCD=4+rnd()*2;if(e.lvBase==null)e.lvBase=e.spd;e.spd=e.lvBase*2.6;Fx.burst({x:p.x,y:.3,z:p.z},0x6aa84a,8,3,.08,2,10);setTimeout(()=>{if(e.lvBase!=null)e.spd=e.lvBase},550)}}}}
// ---- bosses
function bossDef(){const d=cur();return d&&d.boss?d.boss:null}
function bossName(){const b=bossDef();if(!b)return null;return b.name+(cycle()>0?" "+["","II","III","IV","V"][Math.min(4,cycle())]:"")}
// choose the next boss attack from the level's weights
function bossPick(e,dist){const b=e.lvDef;if(!b||!b.attacks)return null;
const pool=Object.entries(b.attacks).filter(([a,w])=>w>0&&!(a==="slam"&&dist>11)&&!(a==="special"&&!b.special));let tot=0;pool.forEach(p=>tot+=p[1]);let x=rnd()*tot;
for(const [a,w] of pool){x-=w;if(x<=0)return a}return"volley"}
const WIND={slam:.8,dash:.6,nova:.8,meteor:.7,volley:.55,special:.9};
// helpers handed to level boss specials, so level files never touch the internals directly
const BA={
ring:(x,z,r,col,t)=>ringFx(x,z,r,col,t),burst:(x,y,z,col,n,sp)=>Fx.burst({x,y,z},col,n||16,sp||6,.1,2,18),flare:(x,y,z,col,s)=>Gfx.flare({x,y,z},col,s||3,.3),
bolt:(x,z,col)=>{try{Gfx.bolt(x,z,col||0xd0f0ff,true)}catch(err){}},crack:(x,z,col)=>{try{Gfx.crack(x,z,col||0xff5020,6,5)}catch(err){}},
hurt:(dmg,x,z)=>bossHit(dmg,{x,z}),near:(x,z,r)=>Math.hypot(P.x-x,P.z-z)<r&&P.y<2.2,
spit:(e,col,n)=>{const p=e.g.position;for(let j=0;j<(n||1);j++)setTimeout(()=>{if(E.includes(e)&&state==="play")spit(p.x,3,p.z,e.dmg*.4,Math.hypot(P.x-p.x,P.z-p.z),col)},j*200)},
later:(e,ms,fn)=>setTimeout(()=>{if(state==="play"&&E.includes(e))try{fn()}catch(err){}},ms),
summon:(e,n,k)=>{const p=e.g.position;for(let i=0;i<n;i++){const a=rnd()*6.283,r=2+rnd()*4;spawnMon({k:k==null?0:k,x:clamp(p.x+Math.cos(a)*r,-H+3,H-3),z:clamp(p.z+Math.sin(a)*r,-H+3,H-3)})}},
shake:ms=>{document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),ms||250)},
snd:(n,v)=>{try{snd(n,v==null?.8:v)}catch(err){}},flash:t=>flash(t,1400),
player:()=>({x:P.x,y:P.y,z:P.z,vx:P.vx||0,vz:P.vz||0}),H:()=>H,rnd:()=>rnd(),clamp:(v,a,b)=>clamp(v,a,b),chill:s=>{P.lvChill=Math.max(P.lvChill||0,s||1.5)},poison:s=>{P.lvPoison=Math.max(P.lvPoison||0,s||3);P.lvPT=.5}};
function bossSpecial(e){const b=e.lvDef;if(b&&b.special)try{b.special(e,BA)}catch(err){console.warn("boss special",err)}}
return{on,idx,idxOf,cycle,cur,defAt,idAt,key,slot,reg,ramp,dmgRamp,spdCap,countCap,diffMul,coinMul,bpMul,xpMul,MODS,modFor,startWave,endWave,reset,get mod(){return mod},
pickType,monName,hpMul,spdMul,dmgMul,countMul,skin,onSpawn,toMon,toYou,onMelee,moveMul,onDeath,frame,bossDef,bossName,bossPick,WIND,bossSpecial,BA}})();
if(typeof module!=="undefined")module.exports={LV,LV_REG,LV_ORDER,LV_DIFF};
