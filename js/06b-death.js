"use strict";
// ---------- death screen: slow-motion kill-cam, shattering ELIMINATED title, killer card, respawn ring or results countdown ----------
const Death=(()=>{
const MN=["Grunt","Sprinter","Brute","Lurker","Juggernaut","Spitter","Stalker"],
LINE=["Lights out.","That one stung.","Shake it off.","Regroup and go again.","The arena wins this round.","Not your last stand.","Reset. Re-aim. Return."],
CIR=2*Math.PI*34,
fx={on:0,t:0,len:0,ring:0,done:null,mul:1,rol:0,pit:0,rolT:0,pitT:0,kind:"ring",slow:1,mini:0};
const reduced=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);

// who landed the hit: the closest living enemy to where the blow came from
function killerOf(src){
let best=null,bd=1e9;const sx=src?src.x:P.x,sz=src?src.z:P.z;
for(const e of E){if(e.hp<=0||!e.g)continue;const p=e.g.position,d=Math.hypot(p.x-sx,p.z-sz);if(d<bd){bd=d;best=e}}
if(!best||bd>7)return{n:"The arena",tag:"HAZARD",d:0};
const d=Math.hypot(best.g.position.x-P.x,best.g.position.z-P.z);
if(best.champion)return{n:best.name||"Champion",tag:"CHAMPION",d};if(best.boss)return{n:best.name||"Boss",tag:best.ghostB?"GHOST BOSS":best.corr?"CORRUPTED BOSS":"BOSS",d};
if(best.t==="bot")return{n:DF[diff].n,tag:"BOT",d};
return{n:(best.ghost?"Ghost ":best.corr?"Corrupted ":"")+((typeof LV!=="undefined"&&LV.monName(best.k))||MN[(best.k|0)%MN.length]),tag:best.ghost?"GHOST":"MONSTER",d}}

function stats(){
const st=[];
if(mode==="parkour")st.push(["Falls",PK.st.falls],["Checkpoint",PK.st.cp+1]);
else if(mode==="waves")st.push(["Wave",wave],["Kills",kills]);
else if(mode==="duel"||mode==="gg")st.push(["Score",myS+" - "+opS],["Kills",kills]);
else if(PT.on)st.push(["Kills",PT.me.kills|0],["Deaths",PT.me.deaths|0]);
else st.push(["Kills",kills]);
return st}

function shards(host){
const n=reduced()?0:22;let h="";
for(let i=0;i<n;i++){const a=Math.random()*6.283,d=120+Math.random()*320,s=4+Math.random()*16;
h+=`<i style="--dx:${Math.cos(a)*d|0}px;--dy:${Math.sin(a)*d*.7|0}px;--r:${(Math.random()*540-270)|0}deg;--s:${s|0}px;--dl:${(Math.random()*.12).toFixed(2)}s"></i>`}
host.innerHTML=h}

// o: {src, len (seconds the card stays), ring (respawn seconds shown on the ring, 0 = no ring), label, done (called when the card closes)}
function start(o){
const root=$("dth");if(!root)return;
const k=o.who||killerOf(o.src),rd=reduced();
fx.on=1;fx.t=0;fx.len=o.len||2.4;fx.ring=o.ring||0;fx.done=o.done||null;fx.kind=o.ring?"ring":"end";fx.slow=o.slow===false||o.mini?0:1;fx.mini=o.mini?1:0;fx.mul=fx.slow?(rd?.6:.18):1;
fx.rolT=fx.mini?0:(Math.random()<.5?-1:1)*(rd?0:.55);fx.pitT=fx.mini||rd?0:.38;
const t=o.title||"ELIMINATED";
root.classList.toggle("mini",!!fx.mini);
root.innerHTML=
`<div class="dflash"></div><div class="dvig"></div><div class="dscan"></div><div class="dsh" id="dsh"></div>
<div class="dmain">
<div class="dkick"><span>${esc(o.kick||"You went down")}</span></div>
<h2 class="dtit" aria-label="${esc(t)}">${[...t].map((c,i)=>c===" "?`<b class="sp"></b>`:`<b style="--i:${i}">${esc(c)}</b>`).join("")}</h2>
<div class="dkill"><div class="dsk">${typeof gly==="function"?gly("skull"):""}</div>
<div class="dkt"><small>${esc(o.by||"Eliminated by")}</small><strong>${esc(k.n)}</strong></div>
<div class="dtag ${k.tag==="HAZARD"?"hz":""}">${esc(k.tag)}${k.d>0?` · ${k.d.toFixed(0)} m`:""}</div></div>
<div class="dstat">${stats().map(([a,b],i)=>`<div style="--i:${i}"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join("")}</div>
<div class="dline">${esc(o.line||LINE[(Math.random()*LINE.length)|0])}</div>
${fx.kind==="ring"?`<div class="dring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" id="drf" cx="40" cy="40" r="34" stroke-dasharray="${CIR.toFixed(1)}" stroke-dashoffset="${CIR.toFixed(1)}"/></svg><b id="drn">${Math.ceil(fx.ring)}</b><small>${esc(o.label||"Respawning")}</small></div>`
:`<div class="dbar"><i id="dbf"></i><small>${esc(o.label||"Tallying your run")}</small></div>`}
</div>`;
shards($("dsh"));
root.classList.remove("hid","out");void root.offsetWidth;root.classList.add("on");
if(!fx.mini)document.body.classList.add("dthfx");
if(!rd&&!fx.mini)document.body.classList.add("dthshake");
snd("dth",1);snd("hurt",.6);
setTimeout(()=>{if(fx.on)snd("boom",.35)},120)}

// real-time frame step; returns the factor the game's dt should be scaled by
function frame(raw){
if(!fx.on){fx.rol*=Math.exp(-raw*12);fx.pit*=Math.exp(-raw*12);return 1}
fx.t+=raw;
const k=Math.min(1,fx.t/.5);
fx.rol+=(fx.rolT*k-fx.rol)*Math.min(1,raw*3.2);fx.pit+=(fx.pitT*k-fx.pit)*Math.min(1,raw*3.2);
// slow-motion: crawl at the moment of impact, then ease toward normal so the world keeps living behind the card
const base=reduced()?.6:.18;
fx.mul=fx.slow?Math.min(fx.kind==="ring"?.85:.5,base+Math.max(0,fx.t-.35)*(fx.kind==="ring"?.45:.18)):1;
if(fx.kind==="ring"){
const left=Math.max(0,fx.ring-fx.t);
const f=$("drf"),n=$("drn");
if(f)f.style.strokeDashoffset=(CIR*Math.min(1,fx.t/fx.ring)).toFixed(1);
if(n){const c=String(Math.ceil(left)||0);if(n.textContent!==c){n.textContent=c;if(left>0)snd("tick",.25)}}
if(fx.t>=fx.ring)finish()}
else{
const f=$("dbf");if(f)f.style.transform="scaleX("+Math.min(1,fx.t/fx.len).toFixed(3)+")";
if(fx.t>=fx.len)finish()}
return fx.mul}

function finish(){
if(!fx.on)return;
const cb=fx.done;fx.done=null;fx.on=0;
const root=$("dth");
if(root){root.classList.add("out");setTimeout(()=>{if(!fx.on){root.classList.add("hid");root.classList.remove("on","out");root.innerHTML=""}},320)}
document.body.classList.remove("dthfx","dthshake");
fx.mul=1;
if(cb)try{cb()}catch(e){console.error(e)}}

// leave instantly (menu, scene change, map reset)
function stop(){
fx.on=0;fx.done=null;fx.rol=fx.pit=0;fx.mul=1;
const root=$("dth");if(root){root.classList.add("hid");root.classList.remove("on","out");root.innerHTML=""}
document.body.classList.remove("dthfx","dthshake")}

return{start,frame,stop,
get active(){return!!fx.on},get rol(){return fx.rol},get pit(){return fx.pit}}
})();
