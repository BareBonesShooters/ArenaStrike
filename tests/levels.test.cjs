"use strict";
// Monster Rush levels: loads js/06g-levels.js and every js/06h-lv-*.js in a sandbox with stand-in 3D objects,
// then checks the schedule, scaling, rewards, and that every level's props, skin and boss special run cleanly.
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.join(__dirname,"..");
// a do-anything object: any property, call or `new` returns another one, and it reads as 0 in maths
function any(){const f=function(){};const store={};return new Proxy(f,{get:(t,k)=>k===Symbol.toPrimitive?()=>0:k==="then"?undefined:k in store?store[k]:(store[k]=any()),set:(t,k,v)=>{store[k]=v;return true},apply:()=>any(),construct:()=>any()})}
function load(){
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const ctx={console,Math,Object,Array,JSON,Number,String,Set,Map,Symbol,Promise,THEMES:{},T:any(),SOFTDOT:any(),document:any(),performance:{now:()=>0},
mode:"waves",PT:{on:false},wave:1,diff:"medium",state:"play",menuOpen:false,E:[],P:{x:0,y:0,z:0,vx:0,vz:0,hp:100,max:100,prot:0},H:40,rnd,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
setTimeout:fn=>{fn();return 0},flash(){},snd(){},hit(){},ringFx(){},Fx:{burst(){}},Gfx:{flare(){},bolt(){},crack(){}},spit(){},spawnMon(){},bossHit(){},module:undefined};
ctx.globalThis=ctx;vm.createContext(ctx);
const files=["06g-levels.js",...fs.readdirSync(path.join(ROOT,"js")).filter(f=>/^06h-lv-.*\.js$/.test(f)).sort()];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(ROOT,"js",f),"utf8")+"\n;globalThis.LV=LV;globalThis.LV_REG=LV_REG;globalThis.LV_ORDER=LV_ORDER;globalThis.LV_DIFF=LV_DIFF;",ctx,{filename:f});
return ctx}
const C=load(),{LV,LV_REG,LV_ORDER}=C;
const at=(w,d)=>{C.wave=w;if(d)C.diff=d};

test("index.html loads the level system and every level file",()=>{
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
assert.ok(html.includes('src="js/06g-levels.js"'));
for(const id of LV_ORDER)assert.ok(html.includes(`src="js/06h-lv-${id}.js"`),id+" script tag");
assert.ok(html.indexOf("06g-levels.js")<html.indexOf("06h-lv-"),"core loads before level files");});

test("eight distinct levels are registered in order",()=>{
assert.equal(LV_ORDER.length,8);
for(const id of LV_ORDER){const d=LV_REG[id];assert.ok(d,id+" registered");assert.equal(d.id,id);assert.ok(C.THEMES["lv_"+id],id+" theme")}
const uniq=f=>new Set(LV_ORDER.map(id=>f(LV_REG[id]))).size;
assert.equal(uniq(d=>d.n),8,"names");assert.equal(uniq(d=>d.theme.sky.join()),8,"skies");assert.equal(uniq(d=>d.theme.gr.base),8,"ground colours");
assert.equal(uniq(d=>d.boss.name),8,"boss names");assert.equal(uniq(d=>d.mon.names[0]),8,"monster families");});

test("each level has monsters, a boss and a known modifier",()=>{
for(const id of LV_ORDER){const d=LV_REG[id];
assert.equal(d.mon.names.length,7,id);assert.ok(d.mon.weights.length>=3,id);assert.equal(typeof d.skin,"function",id);assert.equal(typeof d.props,"function",id);
const b=d.boss;assert.ok(b.scale>=2&&b.scale<=3,id+" boss scale");assert.ok(b.minions>=3&&b.minions<=8,id+" minions");assert.equal(typeof b.special,"function",id+" special");
assert.ok(Object.keys(b.attacks).length>=3&&b.attacks.special>0,id+" attacks");assert.ok(LV.MODS[d.mod],id+" modifier "+d.mod)}
assert.equal(new Set(LV_ORDER.map(id=>LV_REG[id].boss.minions+":"+Object.entries(LV_REG[id].boss.attacks).join())).size,8,"boss kits differ");});

test("props, ground paint, skins and boss specials run without errors",()=>{
for(const id of LV_ORDER.filter(i=>LV_REG[i])){const d=LV_REG[id];let parts=0,solids=0,out=[];const boxes=[];
const free=(x,z,r)=>Math.abs(x)<38-r&&Math.abs(z)<38-r&&!boxes.some(b=>Math.abs(x-b[0])<b[2]/2+r&&Math.abs(z-b[1])<b[3]/2+r);
const reg=(x,z,w,dd)=>{solids++;boxes.push([x,z,w,dd]);if(Math.abs(x)>40||Math.abs(z)>40)out.push([x,z])};
const c={P:()=>{parts++},blk:(x,z,w,h,dd)=>{parts++;reg(x,z,w,dd)},reg,free,glow:any(),solid:any(),grp:any(),rng:C.rnd,crng:C.rnd,rr:(a,b)=>a+(b-a)*C.rnd(),cr:(a,b)=>a+(b-a)*C.rnd(),
pick:a=>a[Math.floor(C.rnd()*a.length)],cpick:a=>a[Math.floor(C.rnd()*a.length)],place:(n,fn,m)=>{let ok=0;for(let i=0;i<n*5&&ok<n;i++){if(fn((C.rnd()-.5)*(80-(m||10)),(C.rnd()-.5)*(80-(m||10)),Math.floor(C.rnd()*4)))ok++}return ok},
pc:n=>n,crateAt:()=>true,crate:()=>true,barrel:()=>true,rock:()=>true,lerpC:a=>a,th:C.THEMES["lv_"+id],key:"lv_"+id,H:40,PI:Math.PI,U:any(),LOD:{props:1},light:()=>any(),halo:()=>any(),add:o=>o,anim:()=>{}};
assert.doesNotThrow(()=>d.props(c),id+" props");
assert.ok(parts>=150,id+" has a full set of scenery ("+parts+" pieces)");assert.ok(solids>=15,id+" has solid cover ("+solids+")");
assert.deepEqual(out,[],id+" solid props stay inside the walls");
if(d.paint)assert.doesNotThrow(()=>d.paint(any(),1024,12.8,C.rnd),id+" paint");
const u={head:any(),torso:any(),arms:[any(),any()],legs:[any(),any()],mats:[0,1,2,3,4,5,6].map(()=>any())};
for(let k=0;k<7;k++)assert.doesNotThrow(()=>d.skin({userData:u,scale:any(),add(){},traverse(){}},k,{}),id+" skin "+k);
assert.doesNotThrow(()=>d.skin({userData:u,scale:any(),add(){},traverse(){}},2,{boss:true}),id+" boss skin");
C.E=[];const e={g:{position:{x:5,y:0,z:5}},dmg:40,hp:1,lvDef:d.boss};C.E.push(e);
assert.doesNotThrow(()=>d.boss.special(e,LV.BA),id+" boss special");
if(d.frame)assert.doesNotThrow(()=>d.frame(.016,1),id+" frame")}});

test("level, wave slot and modifier schedule",()=>{
at(1);assert.equal(LV.cur().id,"hollow");assert.equal(LV.slot(),1);
at(5);assert.equal(LV.slot(),5);assert.equal(LV.cur().id,"hollow");
at(6);assert.equal(LV.cur().id,"dunes");
for(let i=0;i<16;i++){assert.equal(LV.modFor(i,2),LV_REG[LV_ORDER[i%8]].mod)}
const slot4=[0,1,2,3,4,5,6,7].map(i=>LV.modFor(i,4));
assert.equal(slot4.filter(m=>m==="blizzard").length,4,"blizzard every other level");assert.ok(slot4.includes("ghost"),"ghost level");
const newMods=["blackout","heatwave","surge","frenzy","giants","glass","goldrush"].filter(m=>LV.MODS[m]);assert.ok(newMods.length>=3);
at(66);assert.equal(LV.cur().id,"swamp");assert.equal(LV.cycle(),1);});

test("the Corrupted level arrives right after wave 10, every cycle",()=>{
assert.equal(LV_ORDER[2],"corrupt");assert.equal(LV_REG.corrupt.corrupt,true);
for(const w of[11,12,13,14,15,51,55]){at(w);assert.equal(LV.cur().id,"corrupt",String(w))}
at(10);assert.notEqual(LV.cur().id,"corrupt");at(16);assert.notEqual(LV.cur().id,"corrupt");});

test("difficulty and rewards ramp",()=>{
const coins=d=>{at(1,d);return LV.coinMul()},xp=d=>{at(1,d);return LV.bpMul()};
assert.ok(coins("easy")<coins("medium")&&coins("medium")<coins("hard")&&coins("hard")<coins("impossible"),"coin multipliers by difficulty");
assert.ok(xp("easy")<xp("medium")&&xp("medium")<xp("hard")&&xp("hard")<xp("impossible"),"XP multipliers by difficulty");
at(1,"medium");assert.equal(LV.coinMul(),1);const c1=LV.coinMul(),r1=LV.ramp(),x1=LV.bpMul();
at(26,"medium");assert.ok(LV.coinMul()>c1&&LV.bpMul()>x1&&LV.ramp()>r1&&LV.xpMul()>1,"later levels pay and hit harder");
at(36);const r8=LV.ramp();at(41);assert.ok(LV.ramp()-r8>.3,"second cycle jumps in toughness");
assert.ok(LV.countCap()>30&&LV.spdCap()>5.4);
C.PT.on=true;at(26);assert.equal(LV.cur(),null,"online co-op keeps the classic arena");assert.equal(LV.ramp(),1);C.PT.on=false;});
