"use strict";
// ---------- views ----------
let view="lobby",PAGE="",bkReady=false,endAgain="",CB=0,WON=null,CQ=1;
const IDX={cat:"gun",f:"all",sel:"g0"},LD={slot:0};
const KIND={g:"gun",s:"skin",n:"knife",p:"out"},HUDV=["lobby","pg","end"];
const rcol=it=>RC[it.r]||RC[0],owns=it=>!!S.own[it.id];
const ico=(n,s)=>`<svg class="ic"${s?` style="width:${s}px;height:${s}px"`:""} aria-hidden="true"><use href="#i-${n}"/></svg>`;
const seg=(a,items,cur)=>items.map(([v,l])=>`<button class="b${String(cur)===String(v)?" on":""}" data-a="${a}" data-v="${v}">${l}</button>`).join("");

function show(v){
try{if(v==="lobby"&&!bkReady)backdrop()}catch(e){}
if(v==="")bkReady=false;
try{if(view==="pg"&&v!=="pg"&&typeof Thumb!=="undefined")Thumb.flush()}catch(e){}
try{if(v!==view)snd("whoosh",.35);Mus.view(v)}catch(e){}
for(const id of["lobby","pg","ps","end"]){const el=$(id);if(el)el.classList.toggle("hid",id!==v)}
if(HUDV.includes(v)){const h=$("hud");if(h)h.classList.add("hid")}
// canvas must not steal lobby/UI clicks
try{if(rd&&rd.domElement)rd.domElement.style.pointerEvents=(v===""||v==="hud")?"auto":"none"}catch(e){}
view=v}
function goLobby(){
try{Death.stop()}catch(e){}
try{Party.leave()}catch(e){}
try{Aim.release()}catch(e){}
try{document.body.classList.remove("playing","edge")}catch(e){}
try{menuOpen=false;state="lobby"}catch(e){}
// hard-toggle visibility without relying on anything else
const pg=$("pg"),lb=$("lobby"),ps=$("ps"),en=$("end"),hd=$("hud");
if(pg)pg.classList.add("hid");
if(ps)ps.classList.add("hid");
if(en)en.classList.add("hid");
if(lb)lb.classList.remove("hid");
if(hd)hd.classList.add("hid");
view="lobby";
try{Mus.view("lobby")}catch(e){}
try{if(rd&&rd.domElement)rd.domElement.style.pointerEvents="none"}catch(e){}
try{lobbyUI()}catch(e){console.error(e)}
try{if(!bkReady)backdrop()}catch(e){}}

// ---------- thumbnails ----------
function thumb(it,o){
o=o||{};const c=PRE(it.id),st=`--rc:${rcol(it)}`;
if(KIND[c])return`<div class="th" style="${st}" data-th="${it.id}" data-w="${o.w||240}" data-h="${o.h||150}"${o.sk?` data-sk="${o.sk}"`:""}></div>`;
if(c==="f")return`<div class="th fin" style="${st};--c1:${it.c1};--c2:${it.c2}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i>${gly(it.e)}</div>`;
if(c==="m")return`<div class="th gt" style="${st}" aria-hidden="true">${gly(it.e)}</div>`;
if(c==="u")return`<div class="th gt disc" style="${st}" aria-hidden="true"><i></i>${gly(it.e)}</div>`;
if(c==="b")return`<div class="th" style="${st};background:${it.css}"></div>`;
return`<div class="th" style="${st};background:${I(S.bg).css}" aria-hidden="true">${gly(it.e)}</div>`}
function fillThumbs(root){
root.querySelectorAll("[data-th]").forEach(e=>{
const it=I(e.dataset.th);if(!it)return;const kind=KIND[PRE(it.id)];let item=it;
if(kind==="gun"&&e.dataset.sk)item=Object.assign({},it,{skin:e.dataset.sk});
Thumb.req(kind,item,+e.dataset.w||240,+e.dataset.h||150,u=>{
if(!e.isConnected||e.firstChild)return;
if(!u){e.textContent=it.n[0];return}
const im=new Image();im.alt=it.n;im.src=u;e.appendChild(im)})})}
function card(it,o){
o=o||{};const ow=owns(it);
return`<button class="it${o.sel?" sel":""}${ow||o.all?"":" lock"}${it.r>=3?" hi":""}" data-a="${o.a}"${o.f?` data-f="${o.f}"`:""} data-v="${it.id}" style="--rc:${rcol(it)};--i:${Math.min(o.i||0,12)}">${thumb(it,o)}<b>${esc(it.n)}</b><span class="m"><span class="rar">${R[it.r]}</span>${ow?"":ico("lock",14)}</span>${o.badge?`<span class="badge ok">${ico("check",13)}</span>`:""}</button>`}

// ---------- lobby ----------
// the party stays together between matches, so the lobby keeps saying so
function roomLine(){const s=Net.state;if(s!=="hosting"&&s!=="joined")return "";const n=Net.roster().length;return (s==="hosting"?"Hosting party ":"In party ")+Net.code+" \u00b7 "+n+" player"+(n===1?"":"s")+(s==="hosting"?" \u00b7 open Servers to manage teams and start":"")}
function lobbyUI(msg){
if(sel==="duel1"||sel==="coop")S.mp.mode=sel;
const nm=$("nm");if(document.activeElement!==nm)nm.value=S.name;
paintCoins();$("sk").textContent=S.streak;try{questDot()}catch(e){}
const bg=I(S.bg),av=I(S.av);$("av").style.background=bg.css;$("av").innerHTML=gly(av.e);
Thumb.req("out",I(eq().p),110,130,u=>{if(u){const i=$("pfo");if(i.getAttribute("src")!==u)i.src=u;i.hidden=false}});
// the list is built once and only the highlight moves afterwards, so picking a mode does not replay every row's entrance
{const mds=$("mds"),h=MD.map((m,i)=>`<button class="mode" data-a="mode" data-v="${m[0]}" style="--i:${i}"><span><b>${m[1]}</b></span>${PMS(m[0])?'<span class="tag">Online</span>':m[0]==="tut"&&!S.tut?'<span class="tag">New</span>':""}</button>`).join("");
if(mds._h!==h){mds._h=h;mds.innerHTML=h}
mds.querySelectorAll(".mode").forEach(b=>{const on=b.dataset.v===sel;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)})}
{const mi=$("mi");mi.textContent=(MD.find(m=>m[0]===sel)||MD[0])[2];if(sel==="tut"){mi.insertAdjacentHTML("beforeend",Cine.clips([["move","Move"],["aim","Aim and shoot"]]));Cine.scan(mi)}}
const dfv=S.opt.df,rgv=S.opt.rg;$("df").value=dfv;$("rg").value=String(rgv);
$("sg-df").innerHTML=seg("df",[["easy","Easy"],["medium","Medium"],["hard","Hard"],["impossible","Nightmare"]],dfv);
$("sg-rg").innerHTML=seg("rg",[[3,"3"],[5,"5"],[10,"10"]],rgv);
hide("o-df",!(sel==="duel"||sel==="gg"||sel==="parkour"||sel==="waves"));$("o-dft").textContent=sel==="parkour"?"Course difficulty":sel==="waves"?"Monster difficulty":"Bot difficulty";hide("o-rd",sel!=="duel");hide("o-party",!PMS(sel));
const hasGhost=Object.keys(S.pkt||{}).some(k=>k.indexOf((S.opt.df||"easy")+"_")===0&&S.pkg&&S.pkg[k]&&S.pkg[k].length>2);
hide("o-gr",sel!=="waves");{const access=DevAccess.unlocked,gr=access&&!!S.opt.grind;
$("sg-gr").innerHTML=access?seg("gr",[["0","Off"],["1","On"]],gr?1:0):'<button class="b" data-a="devaccess">'+ico("lock",16)+'Input code</button>';
$("grinfo").textContent=!access?"Input code for a dev-only game mode.":gr?"Custom mode enabled for this session.":"Custom mode unlocked for this session. Switch it on to play."}
hide("o-gl",sel!=="waves");{const gl=!!S.opt.ghostLvl;$("sg-gl").innerHTML=seg("gl",[["0","Classic"],["1","Ghost level"]],gl?1:0);$("glinfo").textContent=gl?"Every monster is a ghost: they hover, keep their distance and shoot when they see you. Every 5th wave brings the Ghost boss.":"Classic Monster Rush. A ghost wave still haunts the arena every 7th wave."}
hide("o-ghost",sel!=="parkour");hide("o-pkk",sel!=="parkour");$("sg-pk").innerHTML=seg("pkknife",[["0","Off"],["1","On"]],pkKnifeOn()?1:0);
if(sel==="parkour"){
const gr=clamp(+S.opt.ghostRace||0,0,2);
$("sg-gh").innerHTML=seg("ghost",[["0","Solo"],["1","Time only"],["2","Show ghost"]],gr);
$("ghinfo").textContent=hasGhost?(gr===2?"Ghost race against your best run on the map you pick.":gr===1?"Time attack against your best time on the map you pick, no visible ghost.":"Solo run. You'll hear it if you beat your best time."):"Finish a course first to unlock time attack and ghost race.";
document.querySelectorAll("#sg-gh .b").forEach(b=>{if(b.dataset.v!=="0"&&!hasGhost)b.disabled=true});
}
$("pm").innerHTML=Object.entries(PM_MODES).map(([k,m])=>`<button class="b${S.mp.mode===k?" on":""}" data-a="pmode" data-v="${k}">${esc(m.n)}<small>${esc(m.perk)}</small></button>`).join("");
const pm=PM_MODES[S.mp.mode];$("perk").innerHTML=`<b>${esc(pm.perk)}</b> ${esc(pm.pd)}<br><small>${esc(pm.d)}</small>`;
$("sg-pb").innerHTML=seg("pbots",[[0,"0"],[3,"3"],[5,"5"],[7,"7"],[9,"9"]],S.mp.bots);
$("sg-pd").innerHTML=seg("pdiff",[["easy","Easy"],["medium","Medium"],["hard","Hard"]],S.mp.diff);
hide("hostbtn",!PMS(sel));$("gotxt").textContent=sel==="party"?"Play party with bots":sel==="duel1"?"Play 1v1 vs bot":sel==="coop"?"Needs friends: host a server":sel==="tut"?"Start tutorial":sel==="parkour"?"Start course":"Play";$("go").disabled=sel==="coop";
{const one=sel!=="party",row=(id,off)=>{const x=$(id);x.classList.toggle("hid",off);if(x.previousElementSibling)x.previousElementSibling.classList.toggle("hid",off)};row("pm",one);row("sg-pb",sel!=="party");row("sg-pd",sel==="coop")}
$("ml").textContent=msg!=null?msg:Net.err||roomLine()}

function endCard(o){
const win=o.win===true,lose=o.win===false,end=$("end");end.classList.toggle("win",win);end.classList.toggle("lose",lose);end.classList.toggle("neu",!win&&!lose);
const t=$("et");t.className="endt"+(win?" win":lose?" lose":"");t.setAttribute("aria-label",o.title);{const wd=o.title.split(" "),ci={n:0};t.style.setProperty("--n",Math.max(...wd.map(w=>w.length)));t.innerHTML=wd.map(w=>'<span class="w">'+[...w].map(c=>`<b style="--i:${ci.n++}">${esc(c)}</b>`).join("")+"</span>").join("")}
$("emed").innerHTML=gly(win?"trophy":lose?"skull":"star");$("ek").textContent=win?"Match won":lose?"Match lost":"Well played";
$("es").textContent=o.sub||"";
$("est").innerHTML=(o.stats||[]).map(([a,b],i)=>`<div style="--i:${i}"><span>${esc(a)}</span><b data-n="${/^\d+$/.test(String(b))?b:""}">${esc(b)}</b></div>`).join("");
$("er").innerHTML=o.coins>0?`${gly("coin")}<span data-n="${o.coins}">+${o.coins} coins</span>`:"";hide("er",!(o.coins>0));
endAgain=o.again||"";hide("eagain",!endAgain);
$("hud").classList.add("hid");show("end");if(win){Cine.confetti(3);const live=()=>!end.classList.contains("hid")&&end.classList.contains("win");
setTimeout(()=>{if(!live())return;document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),220);try{flashScreen("#ffe27a")}catch(e){}},380);
setTimeout(()=>{if(live())Cine.confetti(4)},900);setTimeout(()=>{if(live())Cine.confetti(3)},1900)}
// count the numbers up while the tiles rise in
if(!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))end.querySelectorAll("#est b[data-n],#er span[data-n]").forEach((e,i)=>{const n=+e.dataset.n;if(!n)return;const rw=e.parentNode.id==="er",t0=performance.now()+1100+(rw?500:i*100);e.textContent=rw?"+0 coins":"0";
const f=now=>{if(!end.isConnected||end.classList.contains("hid"))return;const k=Math.min(1,Math.max(0,(now-t0)/900)),v=Math.round(n*(1-Math.pow(1-k,3)));e.textContent=rw?"+"+v+" coins":v;if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}

function renderScoreboard(){
let rows;
if(PT.on)rows=Party.board();
else if(mode==="duel"||mode==="gg"||mode==="tut")rows=[{n:S.name,k:myS,d:opS,me:1},{n:DF[diff].n,k:opS,d:myS}];
else if(mode==="parkour")rows=[{n:S.name,k:PK.st.cp+1,d:PK.st.falls,me:1}];
else rows=[{n:S.name,k:mode==="range"?myS:kills,d:null,me:1}];
rows=rows.slice().sort((a,b)=>b.k-a.k);
const pkm=mode==="parkour"&&!PT.on,h="<table><tr><th>Player</th><th>"+(pkm?"Stage":"Kills")+"</th><th>"+(pkm?"Falls":"Deaths")+"</th></tr>"+rows.map(r=>`<tr class="tm${r.t==null?"":r.t}${r.me?" me":""}"><td>${esc(r.n)}</td><td>${r.k}</td><td>${r.d==null?"":r.d}</td></tr>`).join("")+"</table>";
const e=el("sbd");if(e._s!==h){e._s=h;e.innerHTML=h}}

// ---------- liquid thumb: slides a glass highlight to the active option of every segmented strip, from wherever the last one stood ----------
const Glide=(()=>{const seen=new Map(),RM=matchMedia("(prefers-reduced-motion:reduce)");let raf=0;
const key=(el,i)=>el.id||el.getAttribute("aria-label")||"seg"+i;
function sync(){raf=0;document.querySelectorAll(".seg:not(.tg),.shtabs").forEach((el,i)=>{
const on=el.querySelector(".b.on");let t=el.querySelector(":scope>.gthumb");
if(!on||!el.offsetWidth){if(t)t.classList.remove("go");el.classList.remove("glided");return}
const k=key(el,i),r={x:on.offsetLeft,y:on.offsetTop,w:on.offsetWidth,h:on.offsetHeight},p=seen.get(k);
if(!t){t=document.createElement("i");t.className="gthumb";t.setAttribute("aria-hidden","true");el.prepend(t);
const q=p||r;t.classList.add("still");t.style.width=q.w+"px";t.style.height=q.h+"px";t.style.transform="translate("+q.x+"px,"+q.y+"px)";if(p)t.classList.add("go");void t.offsetWidth;t.classList.remove("still")}
el.classList.add("glided");t.classList.add("go");
if(RM.matches)t.classList.add("still");
t.style.width=r.w+"px";t.style.height=r.h+"px";t.style.transform="translate("+r.x+"px,"+r.y+"px)";seen.set(k,r)})}
const go=()=>{if(!raf)raf=requestAnimationFrame(sync)};
const th=n=>n.classList&&n.classList.contains("gthumb");
new MutationObserver(m=>{if(m.some(x=>x.type==="attributes"?!th(x.target):(x.addedNodes.length||x.removedNodes.length)&&![...x.addedNodes,...x.removedNodes].every(th)))go()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
addEventListener("resize",go);document.fonts&&document.fonts.ready.then(go);
return{sync:go}})();
// ---------- pages ----------
function openPage(v){if(v==="bp")BPV.ch=-1;
if(!PG[v])return;PAGE=v;Thumb.flush();$("pgt").textContent=PG[v].t;$("pgb").classList.remove("still");$("pgb").scrollTop=0;
renderPage(false);show("pg");const b=document.querySelector("#pg .sh-h .b");if(b)b.focus({preventScroll:true});
}
function renderPage(still){
const b=$("pgb"),st=b.scrollTop,sl=[...b.querySelectorAll(".strip")].map(s=>s.scrollLeft);
if(still!==false)b.classList.add("still");
b.innerHTML=PG[PAGE].f();b.querySelectorAll(".strip").forEach((s,i)=>{s.scrollLeft=sl[i]||0});b.scrollTop=st;
paintCoins();fillThumbs(b);Cine.scan(b);paintRanges();Glide.sync()}

// shop
function roll(c){
const L=c.L.filter(x=>!x.free&&!x.bp&&!x.codeOnly),sec=L.filter(x=>x.r===5);
if(sec.length&&rnd()<.001)return pk(sec);
const tiers=[0,1,2,3,4].filter(r=>L.some(x=>x.r===r));let tot=0;tiers.forEach(r=>tot+=W[r]);let x=rnd()*tot;
for(const r of tiers){x-=W[r];if(x<=0)return pk(L.filter(y=>y.r===r))}
return pk(L.filter(y=>y.r<5))}
function wonHTML(w){
if(w.list&&w.list.length>1){const nw=w.list.filter(x=>!x.dup).length,rf=w.list.reduce((a,x)=>a+x.rf,0);
return`<div class="row"><div class="l"><b>Opened ${w.list.length} cases</b><small>${nw} new, ${w.list.length-nw} duplicate${w.list.length-nw==1?"":"s"}${rf?", refunded "+rf+" coins":""}</small></div></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:8px">${w.list.map(x=>`<div style="--rc:${rcol(x.it)};border:1px solid var(--rc);border-radius:12px;padding:6px;text-align:center;background:rgba(255,255,255,.05)">${thumb(x.it,{w:100,h:64})}<small class="rar" style="display:block">${R[x.it.r]}</small><small style="display:block;color:var(--ink)">${esc(x.it.n)}</small>${x.dup?`<small>+${x.rf}</small>`:""}</div>`).join("")}</div>`}
if(w.list)w=w.list[0];
return`<div class="won" style="--rc:${rcol(w.it)}">${thumb(w.it,{w:200,h:126})}<div><small class="rar">${R[w.it.r]}</small><b>${esc(w.it.n)}</b><small>${w.dup?"Duplicate, refunded "+w.rf+" coins":"Added to your collection"}</small></div></div>`}
function csStats(){
const s=S.cs,net=s.spent-s.ref,epic=s.r[3]+s.r[4]+s.r[5],pc=(a,b)=>b?Math.round(a/b*100)+"%":"0%",
tn=s.opened===0?"No cases opened yet. These numbers will be waiting for you.":s.dry>=25?s.dry+" cases in a row without an Epic or better. It is totally due.":s.dry>=10?s.dry+" cases since your last Epic or better. Just one more.":net>=3000?net.toLocaleString()+" coins gone for good. Imagine what you could have done with them.":s.dups>s.opened/2?"More than half your pulls were duplicates. The refunds are a nice touch though.":"Keep going. Statistically, something good will happen eventually.",
cell=(l,v,sub)=>`<div class="stc"><small>${l}</small><b>${v}</b>${sub?`<small>${sub}</small>`:""}</div>`;
return`<div class="csb"><h3>Your case stats</h3><div class="csg">`+cell("Coins spent",s.spent.toLocaleString())+cell("Cases opened",s.opened.toLocaleString())+cell("Net lost",net.toLocaleString(),"after "+s.ref.toLocaleString()+" refunded")+cell("Duplicates",s.dups.toLocaleString(),pc(s.dups,s.opened)+" of your pulls")+cell("Epic or better",epic.toLocaleString(),pc(epic,s.opened)+" of your pulls")+cell("Dry streak",s.dry,"cases since last Epic+")+cell("Coins per Epic+",epic?Math.round(net/epic).toLocaleString():"\u221e","net, on average")+cell("Best pull",s.opened?R[s.best]:"None yet")+`</div><div class="rr">`+s.r.map((n,i)=>`<span style="--rc:${RC[i]}">${R[i]} ${n}</span>`).join("")+`</div><div class="tn">${tn}</div></div>`}
// shop: two sections, Cases and Finishers. Kill finishers have their own tab instead of a row of buttons on the case page
const SH={tab:"cases",cat:"all",ff:"all",ic:"g",itf:"all"},finId=()=>S.own[S.fin]?S.fin:"f0";
const CM={"Gun Case":["gun","Guns","#ff8a3d"],"Skin Case":["paint","Skins","#c084fc"],"Knife Case":["blade","Knives","#7dd3fc"],"Emote Case":["shuf","Emotes","#f9a8d4"],"Outfit Case":["shirt","Outfits","#86efac"],"Profile Case":["prism","Profile","#fcd34d"],"Finisher Case":["burst","Finishers","#fb7185"],"Music Case":["disc","Music","#a5b4fc"],
"Sidearm Case":["gun","Guns","#fb923c"],"Close Quarters Case":["gun","Guns","#f87171"],"Marksman Case":["target","Guns","#38bdf8"],"Heavy Arms Case":["burst","Guns","#facc15"],
"Elemental Case":["flame","Skins","#fb7185"],"Street Case":["paint","Skins","#facc15"],"Mythic Case":["gem","Skins","#a78bfa"],
"Frontier Knife Case":["axe","Knives","#fbbf24"],"Arcane Knife Case":["blade","Knives","#818cf8"],
"Party Emote Case":["party","Emotes","#f472b6"],"Legend Emote Case":["crown","Emotes","#fbbf24"],
"Street Outfit Case":["cap","Outfits","#4ade80"],"Royal Outfit Case":["crown","Outfits","#fde047"],
"Avatar Case":["cool","Profile","#67e8f9"],"Backdrop Case":["prism","Profile","#a5b4fc"],"Prestige Backdrop Case":["eclipse","Profile","#f0abfc"],
"Chill Disc Case":["headp","Music","#7dd3fc"],"Hype Disc Case":["rush","Music","#fb7185"]};
const oddsHTML=()=>`<div class="odb" role="img" aria-label="Drop odds by rarity">${W.map((w,j)=>`<s style="flex:${w};background:${RC[j]}"></s>`).join("")}<s style="flex:.5;background:${RC[5]}"></s></div><div class="odl">${W.map((w,j)=>`<span style="--rc:${RC[j]}">${R[j]} ${w}%</span>`).join("")}<span style="--rc:${RC[5]}">Secret 0.1%</span></div>`;
function caseCard(c,i,wide){
const m=CM[c.n]||["gift",c.n,"#ff8a3d"],items=c.L.filter(x=>!x.free&&!x.bp&&!x.codeOnly),got=items.filter(owns).length,pc=items.length?Math.round(got/items.length*100):0,cost=c.p*CQ,can=S.coins>=cost&&!CB,
chase=items.filter(x=>x.r>=4&&x.r<5).slice(0,2).map(x=>esc(x.n)).join(", ");
return`<article class="cs2${wide?" wide":""}" style="--cc:${m[2]};--i:${Math.min(i,10)}"><div class="cs2a">${gly(m[0])}<i></i><i></i><i></i></div>
<div class="cs2b"><div class="cs2h"><h3>${c.n}</h3><small>${items.length} items</small></div>
<div class="cs2p" title="${got} of ${items.length} collected"><i style="width:${pc}%"></i></div><small>${got} of ${items.length} collected${chase?` · chase: <b>${chase}</b>`:""}</small>
${oddsHTML()}
<button class="b p buy" data-a="case" data-v="${CS.indexOf(c)}"${can?"":" disabled"}>${ico("coin")}${cost.toLocaleString()}${S.coins<cost?`<em>need ${(cost-S.coins).toLocaleString()} more</em>`:""}</button></div></article>`}
// single items cost more than the case they drop from: Common 0.6x the case, Uncommon the same, then 2.5x, 6x and 14x. Secret items are case only
const IPM=[.6,1,2.5,6,14],caseOf=it=>CS.find(c=>c.L.includes(it)),itemPrice=it=>{const c=caseOf(it),m=IPM[it.r];return c&&m&&!it.free&&!it.bp&&!it.codeOnly?Math.round(c.p*m/50)*50:0};
const ITC=[["g","Guns",G.filter(x=>!x.bp&&!x.codeOnly),"gun"],["s","Skins",SK.filter(x=>!x.bp&&!x.codeOnly),"paint"],["n","Knives",KN.filter(x=>!x.bp&&!x.codeOnly),"blade"],["m","Emotes",EM.filter(x=>!x.bp&&!x.codeOnly),"shuf"],["p","Outfits",PS.filter(x=>!x.bp&&!x.codeOnly),"shirt"],["b","Backgrounds",BG.filter(x=>!x.bp&&!x.codeOnly),"prism"],["a","Avatars",AV.filter(x=>!x.bp&&!x.codeOnly),"cool"],["u","Music",MU.filter(x=>!x.bp&&!x.codeOnly),"disc"]],KLB={g:"Gun",s:"Gun skin",n:"Knife",m:"Emote",p:"Outfit",b:"Background",a:"Avatar",u:"Music disc"};
const itemTotal=()=>ITC.reduce((a,c)=>a+c[2].length,0),itemOwned=()=>ITC.reduce((a,c)=>a+c[2].filter(owns).length,0);
function itemCard(it,i){
const ow=owns(it),pr=itemPrice(it),k=PRE(it.id);
const act=ow?`<button class="b" disabled>${ico("check",14)}Owned</button>`:pr?`<button class="b" data-a="itembuy" data-v="${it.id}"${S.coins>=pr&&!CB?"":" disabled"}>${ico("coin")}${pr.toLocaleString()}</button>`:`<small class="fno">${ico("lock",13)}Case only</small>`;
return`<article class="fnc${ow?"":" lock"}" style="--rc:${rcol(it)};--i:${Math.min(i,14)}">${thumb(it)}<div class="fni"><div class="fnh"><b>${esc(it.n)}</b><span class="rar">${R[it.r]}</span></div><small>${KLB[k]}${k==="g"?" · "+it.d+" damage":""}</small></div>${act}</article>`}
function finCard(it,i){
const ow=owns(it),q=finId()===it.id,pr=itemPrice(it);
const act=q?`<button class="b" disabled>${ico("check",14)}Equipped</button>`:ow?`<button class="b p" data-a="fin" data-v="${it.id}">Equip</button>`:pr?`<button class="b" data-a="finbuy" data-v="${it.id}"${S.coins>=pr&&!CB?"":" disabled"}>${ico("coin")}${pr.toLocaleString()}</button>`:`<small class="fno">${ico("lock",13)}Case only</small>`;
return`<article class="fnc${q?" eqd":""}${ow?"":" lock"}" style="--rc:${rcol(it)};--i:${Math.min(i,14)}">${thumb(it)}<div class="fni"><div class="fnh"><b>${esc(it.n)}</b><span class="rar">${R[it.r]}</span></div><small>${esc(it.d)}</small></div>${act}</article>`}
function shopIdle(){
if(SH.tab==="fin"){const f=I(finId());return`<div class="stg0" style="--rc:${rcol(f)}"><div class="stt">${thumb(f)}</div><div class="fqi"><small class="rar">Your finisher · ${R[f.r]}</small><b>${esc(f.n)}</b><small>${esc(f.d)} It plays every time you eliminate someone.</small></div></div>`}
if(SH.tab==="items")return`<div class="stg0"><div class="fqi"><b>Buy items directly</b><small>Skip the luck: every item can be bought on its own, but it costs more than the case it drops from. Common items are cheaper than the case, Uncommon cost the same, and Secret items only drop from cases.</small></div></div>`;
return`<div class="stg0"><div class="fqi"><b>Open a case</b><small>Pick a case below. Duplicates refund 12% of the price and the odds are on every case.</small></div></div>`}
function pShop(){
const cases=CS.filter(c=>c.L!==FN),fcase=CS.find(c=>c.L===FN),fo=FN.filter(owns).length,top=WON?wonHTML(WON):shopIdle();
const tabs=`<div class="tabs shtabs" role="tablist" aria-label="Shop section"><button class="b${SH.tab==="cases"?" on":""}" role="tab" aria-selected="${SH.tab==="cases"}" data-a="shtab" data-v="cases"${CB?" disabled":""}>${gly("gift",18)}Cases<em>${cases.length}</em></button><button class="b${SH.tab==="fin"?" on":""}" role="tab" aria-selected="${SH.tab==="fin"}" data-a="shtab" data-v="fin"${CB?" disabled":""}>${gly("burst",18)}Finishers<em>${fo}/${FN.length}</em></button><button class="b${SH.tab==="items"?" on":""}" role="tab" aria-selected="${SH.tab==="items"}" data-a="shtab" data-v="items"${CB?" disabled":""}>${gly("gun",18)}Items<em>${itemOwned()}/${itemTotal()}</em></button></div>`;
const bar=`<div class="shbar"><div class="seg fit" role="group" aria-label="Open at once"><small>Open at once</small>${[1,2,3,5,10].map(n=>`<button class="b${CQ===n?" on":""}" data-a="cq" data-v="${n}"${CB?" disabled":""}>×${n}</button>`).join("")}</div><div class="seg fit tg"><button class="b${S.skipCase?" on":""}" data-a="skipc" aria-pressed="${!!S.skipCase}"${CB?" disabled":""}>Skip animation</button><button class="b${S.autoCase?" on":""}" data-a="autoc" aria-pressed="${!!S.autoCase}"${CB?" disabled":""}>Auto open</button></div></div>`;
let body;
if(SH.tab==="items"){
const C=ITC.find(c=>c[0]===SH.ic)||ITC[0],L=C[2].filter(x=>SH.itf==="own"?owns(x):SH.itf==="lock"?!owns(x):true).slice().sort((a,b)=>a.r-b.r),ow=C[2].filter(owns).length,
chips=[["all","All",C[2].length],["own","Owned",ow],["lock","Locked",C[2].length-ow]].map(([k,l,n])=>`<button class="b${SH.itf===k?" on":""}" data-a="shif" data-v="${k}">${l}<em>${n}</em></button>`).join("");
body=`<div class="tabs shcats" role="group" aria-label="Item type">${ITC.map(c=>`<button class="b${C===c?" on":""}" data-a="shic" data-v="${c[0]}">${c[1]}<em>${c[2].filter(owns).length}/${c[2].length}</em></button>`).join("")}</div><div class="sec"><div class="shh2"><h3>${C[1]}</h3><div class="tabs">${chips}</div></div><div class="fng stg">${L.length?L.map(itemCard).join(""):`<p class="lke">Nothing here yet.</p>`}</div><small>Prices follow the case each item drops from. Bought items go to your collection, then equip them in Loadout.</small></div>`}
else if(SH.tab==="fin"){
const L=FN.filter(x=>SH.ff==="own"?owns(x):SH.ff==="lock"?!owns(x):true),chips=[["all","All",FN.length],["own","Owned",fo],["lock","Locked",FN.length-fo]].map(([k,l,n])=>`<button class="b${SH.ff===k?" on":""}" data-a="shff" data-v="${k}">${l}<em>${n}</em></button>`).join("");
body=`<div class="sec"><h3>Finisher Case</h3>${caseCard(fcase,0,1)}</div><div class="sec"><div class="shh2"><h3>All finishers</h3><div class="tabs">${chips}</div></div><div class="fng stg">${L.length?L.map(finCard).join(""):`<p class="lke">Nothing here yet.</p>`}</div><small>Common to Legendary finishers can be bought directly. Secret ones only drop from the Finisher Case. Equip any finisher here or in Loadout.</small></div>`}
else{
const grp=c=>(CM[c.n]||[0,c.n])[1],cats=[["all","All"]].concat([...new Set(cases.map(grp))].map(g=>[g,g])),L=cases.filter(c=>SH.cat==="all"||grp(c)===SH.cat);
body=`<div class="tabs shcats" role="group" aria-label="Case type">${cats.map(([k,l])=>`<button class="b${SH.cat===k?" on":""}" data-a="shcat" data-v="${k}">${l}</button>`).join("")}</div><div class="cs2g stg">${L.map((c,i)=>caseCard(c,i)).join("")}</div>`}
return`<div id="reelbox" aria-live="polite">${top}</div>${tabs}${SH.tab==="items"?"":bar}${body}`}
function openCase(i){
const c=CS[i],n=clamp(CQ,1,10);if(!c||CB||S.coins<c.p*n)return;
S.coins-=c.p*n;S.cs.spent+=c.p*n;CB=1;WON=null;snd("chest");sv();paintCoins();
const wins=Array.from({length:n},()=>roll(c)),best=wins.reduce((a,b)=>b.r>a.r?b:a),zm=n>6?.5:n>3?.65:n>1?.85:1,N=44,WI=36;
const box=$("reelbox"),fast=matchMedia("(prefers-reduced-motion:reduce)").matches||!!S.skipCase,dur=fast?200:4600,rare=best.r>=3&&!fast;
const finish=()=>{const list=wins.map(w=>{const dup=owns(w);let rf=0;if(dup){rf=Math.floor(c.p*.12);S.coins+=rf;S.cs.ref+=rf;S.cs.dups++}else S.own[w.id]=1;S.cs.opened++;S.cs.r[w.r]=(S.cs.r[w.r]|0)+1;if(w.r>=3)S.cs.dry=0;else S.cs.dry++;S.cs.best=Math.max(S.cs.best,w.r);return{it:w,dup,rf}});
WON={list};CB=0;qAdd("cases",n);sv();if(!fast&&best.r>=2){const bw=list.find(x=>x.it===best)||{};Cine.reward({title:bw.dup?"Duplicate unlocked":"New unlock",item:best,r:best.r,sub:R[best.r]+(bw.dup?" · duplicate, +"+bw.rf+" coins":"")})}if(S.cs.dry>=8)toast("Dry streak: "+S.cs.dry+" cases without an Epic or better. "+S.cs.spent.toLocaleString()+" coins spent so far",3600);if(!rare)snd(best.r>=3?"win":"pick");
if(view==="pg"&&PAGE==="shop")renderPage(true);
else toast((list[0].dup?"Duplicate ":"New: ")+list[0].it.n);
if(S.autoCase&&S.coins>=c.p*n&&view==="pg"&&PAGE==="shop")setTimeout(()=>openCase(i),400)};
if(fast){box.innerHTML="";finish();return}
box.innerHTML=wins.map(win=>{const cards=[];for(let k=0;k<N;k++)cards.push(k===WI?win:pk(c.L));
return`<div class="reelwrap" style="zoom:${zm};margin-bottom:${n>1?4:0}px"><div class="reel">${cards.map(it=>`<div class="rc" style="--rc:${rcol(it)}">${thumb(it,{w:160,h:100})}<span style="font-size:.72rem">${esc(it.n)}</span></div>`).join("")}</div></div>`}).join("");
fillThumbs(box);
$("pgb").querySelectorAll(".cs2 .b,.fnc .b,.shtabs .b,.shcats .b,.shbar .b").forEach(b=>b.disabled=true);
const cw=box.clientWidth/zm;
box.querySelectorAll(".reel").forEach(reel=>{const stop=WI*104+48-cw/2+(rnd()-.5)*60;
reel.animate([{transform:"translateX(0)"},{transform:`translateX(${-stop}px)`}],{duration:dur,easing:"cubic-bezier(.12,.72,.08,1)",fill:"forwards"})});
snd("tick",.6);
if(rare)setTimeout(()=>rareFx(best),dur-200);
setTimeout(finish,dur+(rare?2000:250))}

// loadout
function stripOf(title,L,a,f,cur,o){
o=o||{};return`<div class="sec"><h3>${title}</h3><div class="strip">`+L.filter(owns).map((it,i)=>card(it,{a,f,sel:cur===it.id,i,badge:cur===it.id,w:o.w||200,h:o.h||124,sk:o.sk&&o.sk(it)})).join("")+"</div></div>"}
const LK={cat:"g",sel:null,own:0};
const LKC=[["g","Guns",G,"gun","g"],["s","Skins",SK,"paint","s"],["k","Knives",KN,"blade","k"],["p","Outfits",PS,"shirt","p"],["m","Emotes",EM,"shuf","e"],["bg","Backgrounds",BG,"prism","bg"],["av","Avatars",AV,"cool","av"],["u","Music discs",MU,"disc","mh"],["f","Finishers",FN,"burst","fin"]];
const lkEq=(c,e)=>c==="f"?finId():c==="bg"||c==="av"?S[c]:c==="u"?S[LK.ms||"mh"]:c==="m"?e.e[LD.slot]:e[c];
function pLoad(){
const e=eq(),C=LKC.find(x=>x[0]===LK.cat)||LKC[0],L=C[2].filter(x=>!LK.own||owns(x)),sk=e.s;
const cur=lkEq(C[0],e),isEq=it=>C[0]==="m"?e.e.includes(it.id):C[0]==="u"?(it.id===S.mh||it.id===S.mm):cur===it.id;
let pv=LK.sel&&C[2].some(x=>x.id===LK.sel)?I(LK.sel):(cur&&I(cur))||C[2].find(owns)||C[2][0];
const own=x=>C[2].filter(owns).length;
const mx=k=>Math.max(...G.map(k));
let h=`<div class="tabs" role="tablist" aria-label="Loadout slot">${[0,1,2,3,4].map(i=>`<button class="b${i===S.cur?" on":""}" role="tab" data-a="ld" data-v="${i}">Loadout ${i+1}</button>`).join("")}</div>`;
// preview panel
let note="";if(pv){const c=PRE(pv.id);note=owns(pv)?(c==="u"?(pv.id===S.mh&&pv.id===S.mm?"Playing at home and in matches":pv.id===S.mh?"Your home music":pv.id===S.mm?"Your match music":"Owned. Tap it to put it in the "+((LK.ms||"mh")==="mm"?"match":"home")+" slot."):isEq(pv)?"Equipped in this loadout":"Owned. Tap it to equip."):"Locked. "+foundIn(pv)}
if(pv&&C[0]==="f")note=(owns(pv)?(isEq(pv)?"Equipped. It plays on every elimination. ":"Owned. Tap it to equip. "):"Locked. "+foundIn(pv)+". ")+pv.d;
let st="";if(pv&&C[0]==="g")st=statRow("Damage",pv.d*(pv.pel||1),mx(g=>g.d*(g.pel||1)),pv.d+(pv.pel?" x"+pv.pel:""))+statRow("Fire rate",1/pv.t,mx(g=>1/g.t),(1/pv.t).toFixed(1)+"/s")+statRow("Magazine",pv.m,mx(g=>g.m),pv.m)+statRow("Reload",pv.rl,3.2,pv.rl+"s",1);
else if(pv&&C[0]==="k")st=statRow("Damage",KNIFE_D*KNM[pv.r],100,Math.round(KNIFE_D*KNM[pv.r]))+statRow("Reach",pv.s.len*(1+.04*pv.r),.75,Math.round(pv.s.len*(1+.04*pv.r)*100)+" cm");
const rows=[["g","Gun",e.g],["s","Skin",e.s],["k","Knife",e.k],["p","Outfit",e.p],["f","Finisher",finId()],["bg","Background",S.bg],["av","Avatar",S.av],["mh","Home music",S.mh],["mm","Match music",S.mm]].map(([c,l,id])=>{const it=I(id),ms=c==="mh"||c==="mm";return`<button class="lkr${ms?(C[0]==="u"&&(LK.ms||"mh")===c?" on":""):C[0]===c?" on":""}" data-a="${ms?"lkms":"lkcat"}" data-v="${c}" style="--rc:${it?rcol(it):"#94a3b8"}"><small>${l}</small><b>${it?esc(it.n):"None"}</b><i></i></button>`}).join("");
h+=`<div class="lk"><aside class="lkp gl" aria-label="Preview"><div class="lkpv" style="--rc:${pv?rcol(pv):"#94a3b8"}">${pv?thumb(pv,{w:420,h:250,sk:C[0]==="g"?sk:undefined}):""}${pv&&isEq(pv)?`<span class="eqb big">${ico("check",14)}Equipped</span>`:pv&&!owns(pv)?`<span class="eqb lockb">${ico("lock",13)}Locked</span>`:""}</div>
<div class="lkn" style="--rc:${pv?rcol(pv):"#94a3b8"}"><small class="rar">${pv?R[pv.r]:""} ${C[1].replace(/s$/,"")}</small><h3>${pv?esc(pv.n):"Nothing here"}</h3><p>${esc(note)}</p></div>${st?`<div class="stats lks">${st}</div>`:""}${wshBtn(pv)}${C[0]==="u"?discPanel(pv):""}
<div class="lkh"><small>This loadout</small></div><div class="lkrs">${rows}</div>
<div class="lkh"><small>Emote slots, keys 3 to 7</small></div><div class="slots5">`+[0,1,2,3,4].map(i=>{const it=e.e[i]&&I(e.e[i]);return`<button class="slot${LD.slot===i&&C[0]==="m"?" on":""}" data-a="slot" data-v="${i}" aria-label="Emote slot ${i+1}">${it?gly(it.e):ico("close",18)}<small>Key ${i+3}</small></button>`}).join("")+`</div></aside>
<section class="lkm"><div class="lkc" role="tablist" aria-label="Item type">${LKC.map(c=>`<button class="b${C[0]===c[0]?" on":""}" role="tab" data-a="lkcat" data-v="${c[0]}">${gly(c[3],18)}${c[1]}<em>${c[2].filter(owns).length}/${c[2].length}</em></button>`).join("")}<button class="b lkf${LK.own?" on":""}" data-a="lkown" aria-pressed="${!!LK.own}">${ico("check",15)}Owned only</button></div>
<div class="lkg">`+(C[0]==="m"?`<button class="it lkt${e.e[LD.slot]?"":" eqd"}" data-a="em" data-v="" style="--rc:#94a3b8"><div class="th">${ico("close",26)}</div><b>Empty</b><span class="m"><span class="rar">Slot ${LD.slot+3}</span></span>${e.e[LD.slot]?"":`<span class="eqb">${ico("check",12)}Equipped</span>`}</button>`:"")+
(L.length?L.map((it,i)=>{const q=isEq(it),ow=owns(it);return`<button class="it lkt${q?" eqd":""}${ow?"":" lock"}${pv&&pv.id===it.id?" sel":""}${it.r>=3?" hi":""}" data-a="lkpick" data-v="${it.id}" style="--rc:${rcol(it)};--i:${Math.min(i,14)}" aria-pressed="${q}">${thumb(it,{w:200,h:124,sk:C[0]==="g"?sk:undefined})}<b>${esc(it.n)}</b><span class="m"><span class="rar">${R[it.r]}</span>${ow?"":ico("lock",14)}</span>${q?`<span class="eqb">${ico("check",12)}Equipped</span>`:""}</button>`}).join(""):`<p class="lke">Nothing owned in this category yet. Open cases in the Shop or claim Battle Pass rewards.</p>`)+`</div></section></div>`;
return h+`<small>Loadouts save automatically. Gun Game uses its own gun ladder, so the gun slot is ignored there. Items are sorted from Common to Secret.</small>`}
// index
// ---------- weapon sheet: stats, rarity bonus, ratings, and what each weapon is good and bad at ----------
const GSX={ // [strengths, weaknesses]
"Pistol":[["Draws and reloads fast","Steady single shots, easy to control"],["Low damage per shot","Struggles against bosses and packs"]],
"Sidearm+":[["Fires faster than the Pistol","Cheap, quick reloads"],["Tiny damage","Falls off past mid range"]],
"SMG":[["Very high fire rate up close","Big magazine, light to carry"],["Bullets scatter at range","Low damage per bullet"]],
"Burst SMG":[["Tighter spray than the SMG","Solid at mid range"],["Slower fire rate","Missed bursts leave you exposed"]],
"Assault Rifle":[["Reliable at every distance","Stable, forgiving recoil"],["No standout stat","Loses damage past 60 m"]],
"Carbine":[["Quick handling and follow-up shots","Light, keeps you mobile"],["Lower damage than the Assault Rifle","Runs dry quickly"]],
"Shotgun":[["Devastating up close","Great against monsters rushing you"],["Damage drops hard with distance","Slow pump between shots"]],
"Scattergun":[["Wide pattern clears groups","Extra pellets per shot"],["Very short effective range","Spread wastes pellets on single targets"]],
"Marksman":[["Heavy hits, no fall-off","Scope for long sight lines"],["Slow fire rate","Hard to land on fast close targets"]],
"Scout Rifle":[["Faster follow-up than the Marksman","Light, scoped, no fall-off"],["Lower damage per shot","Punishes sloppy aim"]],
"Plasma Gun":[["Near-perfect accuracy","Fast energy bolts"],["Mid damage per bolt","Small magazine for sustained fights"]],
"Arc Blaster":[["Blistering fire rate","Large magazine for quick burn-downs"],["Weak per shot","Falls off past mid range"]],
"Railgun":[["Huge damage, no fall-off","Pinpoint accuracy"],["Slow between shots","Tiny magazine"]],
"Coil Driver":[["Huge damage, no fall-off","Quicker reload than the Railgun"],["Very small magazine","Slow cycling"]],
"Heavy Pulse":[["Giant magazine, endless pressure","Shreds bosses"],["Heavy: slows your movement","Wide spread, long reload"]],
"Storm Cannon":[["Faster than the Heavy Pulse","Huge sustained damage"],["Heavy: slows your movement","Spread opens up fast"]],
"Omega Rifle":[["Excellent damage and accuracy together","Large magazine"],["Needs steady aim to pay off","Bright glow gives away your position"]],
"Aether Rifle":[["Fast, precise and deep magazine","Quick reload for its class"],["Moderate damage per bullet","Glow reveals your position"]],
"Revolver":[["Hits hard for a sidearm","Accurate at range"],["Only 6 rounds","Slow reload"]],
"Machine Pistol":[["Crazy fire rate from a tiny gun","Keeps you fast on your feet"],["Spread explodes at range","Burns ammo quickly"]],
"Battle Rifle":[["Two-shot kills with good range","Forgiving accuracy"],["Semi-automatic only","Slower follow-ups"]],
"Auto Shotgun":[["Full-auto close combat","Great panic button"],["Short range","Drinks ammo"]],
"Light Machine Gun":[["75-round magazine, suppresses crowds","Strong sustained damage"],["Very long reload","Slows your movement"]],
"Hand Cannon":[["Enormous pistol damage","Quick to draw"],["Slow shots","Small magazine"]],
"Anti-Materiel Rifle":[["Deletes almost anything in one hit","No fall-off, perfect accuracy"],["More than a second between shots","Heavy: slows your movement"]],
"Nova Beam":[["Insane fire rate and a 90-round magazine","Scoped and laser accurate"],["Each hit is small, armour soaks it","Needs time on target"]]};
const KSX={
"Combat Knife":[["Fast, reliable swing","No surprises"],["Short reach","Lowest damage"]],
"Kunai":[["Light and quick to throw","Fast recovery"],["Tiny reach","Needs good aim"]],
"Machete":[["Long reach, wide cleave","Good against groups"],["Slower recovery","Heavy on the wrist"]],
"Karambit":[["Quick curved slashes","High damage for its size"],["Short reach","Rewards staying close"]],
"Katana":[["Longest reach in the case","Clean, powerful cuts"],["Slow to ready","Thin guard"]],
"Plasma Blade":[["Searing edge, big damage","Great reach"],["Bright glow draws attention","Heavy swing"]],
"Solar Edge":[["Top-tier damage","Long reach with a blazing arc"],["Hard to hide","Wide swing is easy to read"]],
"Tanto":[["Quick stabs","Reliable and cheap"],["Short reach","Modest damage"]],
"Butterfly":[["Fast flicking swing","Stylish and agile"],["Short reach","Weak against bruisers"]],
"Cleaver":[["Brutal hits","Chops through weak monsters"],["Short for its weight","Slow swing"]],
"Void Fang":[["Strong damage and speed","Glowing edge scares bots"],["Short blade","Glow is easy to see"]],
"Star Piercer":[["Best damage and balance","Precise thrusts"],["Narrow arc","Needs commitment"]]};
function gClass(g){return g.scope&&g.d>=100?"Anti-materiel":g.scope&&g.a?"Beam rifle":g.scope||g.coil?"Marksman":g.pel?(g.a?"Auto shotgun":"Shotgun"):g.multi||g.m>=60?"Heavy":g.glow?"Energy":g.pst?"Sidearm":g.a&&g.mg?"SMG":g.st?"Rifle":"Pistol"}
// 0..1 ratings, relative to the whole arsenal
let _gMax=null;
function gMax(){if(_gMax)return _gMax;const sus=g=>g.d*(g.pel||1)*g.m/(g.m*g.t+g.rl);return _gMax={sus:Math.max(...G.map(sus)),dps:Math.max(...G.map(g=>g.dps)),burst:Math.max(...G.map(g=>g.d*(g.pel||1)))}}
function gRate(g){const M=gMax(),sus=g.d*(g.pel||1)*g.m/(g.m*g.t+g.rl),close=g.dps*(g.fo&&g.fo<=30?1.25:1)/(M.dps*1.1);
return[["Close range",clamp(close,.08,1)],["Long range",g.fo===0?clamp(.55+g.d*(g.pel||1)/M.burst*.45,.55,1):clamp(g.fo/110-(g.sp||0)*3,.05,.7)],["Boss damage",clamp(sus/M.sus,.08,1)],["Crowds",clamp((g.pel?.5:0)+(g.a?.25:0)+g.m/150+(g.fo&&g.fo<50?.1:0),.08,1)],["Mobility",clamp((g.mv-.84)/.24,.05,1)]]}
const rLab=v=>v>=.8?"Great":v>=.55?"Good":v>=.3?"Fair":"Poor";
function wshHTML(it){
const gun=PRE(it.id)==="g",c=rcol(it),[S1,W1]=(gun?GSX:KSX)[it.n]||[["Reliable"],["No special weakness"]];
const pct=(v,inv)=>{const x=Math.round((inv?1-v:v-1)*100);return x?`<em class="${x>0?"up":"dn"}">${x>0?"+":""}${x}%</em>`:""};
let stats="",chips="",rates="",cls="";
if(gun){const mx=k=>Math.max(...G.map(k));cls=gClass(it);const b=it.base;
stats=statRow("Damage",it.d*(it.pel||1),mx(g=>g.d*(g.pel||1)),it.d+(it.pel?" ×"+it.pel:"")+" "+pct(RM.d[it.r]))+statRow("Fire rate",1/it.t,mx(g=>1/g.t),(1/it.t).toFixed(1)+"/s")+statRow("DPS",it.dps,mx(g=>g.dps),it.dps)+statRow("Magazine",it.m,mx(g=>g.m),it.m+" "+pct(RM.m[it.r]))+statRow("Reload",it.rl,3.4,it.rl+"s "+pct(RM.rl[it.r],1),1)+statRow("Accuracy",1-it.sp/.07,1,Math.round(Math.max(0,1-it.sp/.07)*100)+"%")+statRow("Range",it.fo?it.fo:130,130,it.fo?it.fo+" m":"No fall-off");
chips=[["Damage",pct(RM.d[it.r])],["Magazine",pct(RM.m[it.r])],["Reload",pct(RM.rl[it.r],1)],["Accuracy",pct(RM.sp[it.r],1)],["Fire rate",pct(RM.t[it.r],1)],["Headshot","×"+it.hs]].filter(x=>x[1]).map(x=>`<span class="wchip">${x[0]} ${x[1]}</span>`).join("");
rates=gRate(it).map(([n,v])=>`<div class="wrate"><span>${n}</span><i><s style="width:${Math.round(v*100)}%"></s></i><b class="q${Math.min(3,Math.floor(v*4))}">${rLab(v)}</b></div>`).join("")}
else{const d=Math.round(KNIFE_D*KNM[it.r]),rc=Math.round(it.s.len*(1+.04*it.r)*100);cls="Knife";
stats=statRow("Damage",d,100,d+" "+pct(KNM[it.r]))+statRow("Reach",it.s.len*(1+.04*it.r),.75,rc+" cm "+pct(1+.04*it.r))+statRow("Throw damage",d*1.55,160,Math.round(d*1.15)+" to "+Math.round(d*2.05));
chips=[["Damage",pct(KNM[it.r])],["Reach",pct(1+.04*it.r)]].filter(x=>x[1]).map(x=>`<span class="wchip">${x[0]} ${x[1]}</span>`).join("")||`<span class="wchip">Baseline</span>`}
const li=(a,ic,k)=>a.map(x=>`<li class="${k}">${ico(ic,15)}<span>${esc(x)}</span></li>`).join("");
return`<div class="wsh-ov" id="wsh" data-a="wshx" role="dialog" aria-modal="true" aria-label="Weapon sheet"><div class="wsh gl" style="--rc:${c}" data-stop="1">
<button class="b wshc" data-a="wshx" aria-label="Close">${ico("close",18)}</button>
<div class="wsh-h">${thumb(it,{w:220,h:136})}<div><small class="rar" style="color:${c}">${R[it.r]} · ${cls}</small><h3>${esc(it.n)}</h3><div class="wchips">${chips}</div></div></div>
<div class="wsh-g"><div class="sec" style="gap:6px"><h4>Stats</h4>${stats}</div>${rates?`<div class="sec" style="gap:6px"><h4>How it plays</h4>${rates}</div>`:`<div class="sec"><h4>Rarity bonus</h4><p class="sm">Higher rarity swings harder, reaches further and throws harder. Secret knives hit ${Math.round((KNM[5]-1)*100)}% harder than a common one.</p></div>`}</div>
<div class="wsh-sw"><div class="sec"><h4 style="color:var(--ok)">Strengths</h4><ul>${li(S1,"check","g")}</ul></div><div class="sec"><h4 style="color:var(--bad)">Weaknesses</h4><ul>${li(W1,"close","b")}</ul></div></div>
</div></div>`}
function wshOpen(id){const it=I(id);if(!it)return;wshClose();const d=document.createElement("div");d.innerHTML=wshHTML(it);document.body.appendChild(d.firstChild);snd("open",.6)}
function wshClose(){const o=document.getElementById("wsh");if(o){o.remove();snd("shut",.4)}}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById("wsh")){wshClose();e.stopPropagation()}},true);
const wshBtn=it=>it&&(PRE(it.id)==="g"||PRE(it.id)==="n")?`<button class="b wshb" data-a="wsh" data-v="${it.id}">${ico("help",15)}Strengths &amp; weaknesses</button>`:"";
function discPanel(d){
if(!d)return"";const pv=Mus.prev,on=pv&&pv.id===d.id,ow=owns(d),bar=(n,l)=>statRow(l,n,5,["","Mellow","Easy","Steady","Driving","Intense"][n]);
return`<div class="dsk" style="--rc:${rcol(d)}"><p class="sm">${esc(d.desc||"")}</p><div class="stats lks">${bar(d.en||2,"Energy")}<div class="stat"><span>Tempo</span><i></i><b>${d.bl} / ${d.bb} BPM</b></div></div>
<div class="dskb"><button class="b p" data-a="dskeq" data-v="${d.id}" data-s="mh"${ow?"":" disabled"}>${S.mh===d.id?"Home music ✓":"Use at home"}</button><button class="b p" data-a="dskeq" data-v="${d.id}" data-s="mm"${ow?"":" disabled"}>${S.mm===d.id?"Match music ✓":"Use in matches"}</button>
<button class="b" data-a="dskprev" data-v="${d.id}">${ico("play")}${on?(pv.kind==="lobby"?"Playing home mix · hear match mix":"Playing match mix · stop"):"Preview"}</button></div></div>`}
const CATS=[["gun","Guns",G],["skin","Gun skins",SK],["knife","Knives",KN],["emote","Emotes",EM],["out","Outfits",PS],["bg","Backgrounds",BG],["av","Avatars",AV],["disc","Music discs",MU],["more","Other",null]];
const EQF={g:"g",s:"s",n:"k",p:"p"};
function foundIn(it){
if(it.codeOnly)return"Exclusive reward. Redeem a reward code from the lobby's Redeem codes page.";
if(it.free)return"Starter item, owned from the beginning";
const cs=CS.filter(c=>c.L.includes(it));if(!cs.length)return"Not available";
return cs.map(c=>`${c.n} (${R[it.r]}${it.r===5?", 0.1% chance":", "+W[it.r]+"% tier"})`).join(", ")+(itemPrice(it)?` or buy it for ${itemPrice(it).toLocaleString()} coins in Shop, ${PRE(it.id)==="f"?"Finishers":"Items"}`:"")}
function statRow(l,v,max,txt,inv){const p=Math.max(4,Math.min(100,(inv?1-v/max+.15:v/max)*100));return`<div class="stat"><span>${l}</span><i><s style="width:${p.toFixed(0)}%"></s></i><b>${txt}</b></div>`}
function detailHTML(it,cat){
const ow=owns(it),mx=k=>Math.max(...G.map(k));let st="",note="";
if(cat==="gun"){
st=statRow("Damage",it.d*(it.pel||1),mx(g=>g.d*(g.pel||1)),it.d+(it.pel?" ×"+it.pel:""))+statRow("Fire rate",1/it.t,mx(g=>1/g.t),(1/it.t).toFixed(1)+"/s")+statRow("Magazine",it.m,mx(g=>g.m),it.m)+statRow("Reload",it.rl,3.2,it.rl+"s",1)+statRow("DPS",it.dps,mx(g=>g.dps),it.dps)+statRow("Accuracy",1-it.sp/.07,1,it.sp?Math.round((1-it.sp/.07)*100)+"%":"100%");
note=[it.a?"Automatic":"Semi automatic",scopeOf(it).n,it.pel?it.pel+" pellets":"",it.pump?"Pump action":"",it.glow?"Plasma glow":"",it.coil?"Coil rails":"",it.multi?"Triple barrel":""].filter(Boolean).join(" · ")}
else if(cat==="skin")note="Pattern: "+it.kind+". "+(it.r>=4?"Animated.":"Painted onto every gun you own.")+" Equip it in Loadout.";
else if(cat==="knife"){st=statRow("Damage",KNIFE_D*KNM[it.r],100,Math.round(KNIFE_D*KNM[it.r]))+statRow("Reach",it.s.len*(1+.04*it.r),.75,Math.round(it.s.len*(1+.04*it.r)*100)+" cm");note=[it.s.curve?"Curved blade":"",it.s.guard?"Hand guard":"",it.s.ring?"Ring pommel":"",it.s.glow?"Glowing edge":"",it.s.prism?"Prismatic":""].filter(Boolean).join(" · ")||"Straight blade"}
else if(cat==="emote")note="Equip it in an emote slot, then press keys 3 to 7 in a match. Move or shoot to stop. Style: "+it.k+".";
else if(cat==="out")note=`Player model skin: ${({cap:"Recruit cap",hood:"Leaf hood",flame:"Flame crest",wizard:"Wizard hat",beanie:"Beanie and goggles",ninja:"Ninja mask and headband",horns:"Horns and cape",crown:"Golden crown and pauldrons",halo:"Floating halo, hologram body",band:"Headband and scarf",nvg:"Night vision goggles",champ:"Champion crown and cape"})[it.sty]||"Standard"}. Body ${hex6(it.c)}, trim ${hex6(it.t)}. Shown in emotes, parkour and previews.`;
else if(cat==="disc")note="Put it in the home slot for the lobby, or the match slot for battles. Boss fights and corrupted waves keep their own themes.";
else if(cat==="bg")note="Shown behind your avatar in the lobby.";
else note="Shown in your profile card.";
const f=EQF[PRE(it.id)],can=ow&&(f||cat==="bg"||cat==="av"||cat==="emote");
const btn=!ow?`<small>Open cases in the Shop to find it.</small>`:cat==="disc"?"":cat==="emote"?`<button class="b p" data-a="ixeq" data-v="${it.id}">Equip to slot ${LD.slot+1}</button>`:can?`<button class="b p" data-a="ixeq" data-v="${it.id}">Equip</button>`:"";
return`<div class="detail" style="--rc:${rcol(it)}">${thumb(it,{w:320,h:200})}<div><h3>${esc(it.n)}</h3><div class="pills"><span class="pill" style="color:${rcol(it)}">${R[it.r]}</span><span class="pill">${ow?"Owned":"Not owned"}</span></div>
<p class="sm" style="margin:10px 0">${esc(note)}</p><div class="sec" style="gap:6px">${st}</div><p class="sm" style="margin:10px 0"><b style="color:var(--ink2)">Found in:</b> ${esc(foundIn(it))}</p>${btn} ${wshBtn(it)}${cat==="disc"?discPanel(it):""}</div></div>`}
function moreHTML(){
const sec=(t,rows)=>`<div class="sec"><h3>${t}</h3>${rows.join("")}</div>`,row=(a,b,c)=>`<div class="row"><div class="l"><b>${a}</b><small>${b}</small></div>${c?`<small>${c}</small>`:""}</div>`;
return sec("Pickups",PUP.map(p=>row(`<span style="color:${p[2]};font-size:.8em">&#9679;</span> ${p[0]}`,p[1],"Spawns in solo matches")))
+sec("Maps",Object.entries(MAPNOTES).map(([k,v])=>row(k[0].toUpperCase()+k.slice(1),v,k==="ruin"?"Monster Rush":"Random map")))
+sec("Game modes",MD.map(m=>row(m[1],m[2])))
+sec("Party games",Object.values(PM_MODES).map(m=>row(m.n+" · "+m.perk,m.pd+" "+m.d)))
+sec("Opponents",Object.values(DF).map(d=>row(d.n,"Health "+d.hp+", damage "+d.dmg+", accuracy "+Math.round(d.acc*100)+"%","+"+d.coins+" coins")).concat([row("Walker","Melee monster, the most common.","Waves"),row("Spitter","Keeps its distance and shoots.","Wave 3 and later"),row("Brute","Slow, huge health and heavy hits.","Wave 5 and later")]))}
function pIndex(){
const tot=ALL.length,got=ALL.filter(owns).length;
let h=`<div class="row"><div class="l"><b>Collection ${got} / ${tot}</b><div class="bar"><i style="width:${got/tot*100}%"></i></div></div><div class="seg" style="min-width:230px">${seg("ifilt",[["all","All"],["own","Owned"],["miss","Missing"]],IDX.f)}</div></div>`;
h+=csStats();
h+=`<div class="tabs" role="tablist">`+CATS.map(([k,n,L])=>`<button class="b${IDX.cat===k?" on":""}" role="tab" data-a="icat" data-v="${k}">${n}${L?`<em>${L.filter(owns).length}/${L.length}</em>`:""}</button>`).join("")+"</div>";
const C=CATS.find(c=>c[0]===IDX.cat);
if(!C[2])return h+moreHTML();
let L=C[2].filter(it=>IDX.f==="all"||(IDX.f==="own")===owns(it));
const cur=I(IDX.sel);
if(cur&&C[2].includes(cur))h+=detailHTML(cur,IDX.cat);
h+=L.length?`<div class="grid stg">`+L.map((it,i)=>card(it,{a:"ix",sel:IDX.sel===it.id,i,all:1,w:220,h:136})).join("")+"</div>":`<div class="row"><div class="l"><b>Nothing here</b><small>Change the filter to see more items.</small></div></div>`;
return h}

// quests, board, help
function qLeft(){const ms=Math.max(0,qNextRot()-Date.now()),h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return h?h+"h "+m+"m":Math.max(1,m)+"m"}
// one quest card, shared by the Quests page and the pause screen; i is the quest's place on the board (what Switch and Skip act on)
function qCard(q,i,n,compact){
const v=Math.min(q.p,q.need),pc=v/q.need*100,sw=S.qsw|0,c=qSkipCost(q);
return`<div class="qc${compact?" qs":""}" style="--i:${n};--qt:${QTC[q.t]}"><div class="qt"><span class="qtier">${QT[q.t]}</span><span class="qxp">+${q.xp} XP</span></div><b>${esc(q.n)}</b><div class="qb" role="progressbar" aria-valuemin="0" aria-valuemax="${q.need}" aria-valuenow="${v}"><i style="width:${pc.toFixed(1)}%"></i></div><small>${v} / ${q.need}</small>
<div class="qa"><button class="rsb" data-a="qswap" data-v="${i}"${sw?"":" disabled"} title="Replace this quest with a new ${QT[q.t].toLowerCase()} one">Switch<small> ${sw} left</small></button><button class="rsb" data-a="qskip" data-v="${i}"${S.coins>=c?"":" disabled"} title="Pay coins to finish this quest now and collect its XP">Skip<small> ${c} coins</small></button></div></div>`}
const QV={tab:"daily"},wqLeft=()=>{const ms=Math.max(0,wkNext()-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d?d+"d "+h+"h":h+"h"};
function lqCard(q,n,col){const v=Math.min(q.p,q.need),pc=v/q.need*100,done=q.p>=q.need;
return`<div class="qc lq${done?" done":""}" style="--i:${n};--qt:${col}"><div class="qt"><span class="qtier">${done?"Complete":"In progress"}</span><span class="qxp">+${q.xp.toLocaleString()} XP</span></div><b>${esc(q.n)}</b><div class="qb" role="progressbar" aria-valuemin="0" aria-valuemax="${q.need}" aria-valuenow="${v}"><i style="width:${pc.toFixed(1)}%"></i></div><small>${v.toLocaleString()} / ${q.need.toLocaleString()}</small><div class="lqr">${ico("coin",14)}<span>+${(q.c|0).toLocaleString()} coins</span>${done?`<span class="lqd">${ico("check",14)}Paid out</span>`:""}</div></div>`}
function pQuests(){
longFill();S.qseen=1;setTimeout(()=>{try{questDot()}catch(e){}});
const tab=["daily","weekly","season"].includes(QV.tab)?QV.tab:"daily",wd=S.wq.list.filter(q=>q.p>=q.need).length,sd=S.sq.list.filter(q=>q.p>=q.need).length;
const tabs=`<div class="tabs shtabs qtabs" role="tablist" aria-label="Quest type">${[["daily","Daily",S.qb.length?questFill().filter(q=>q.p>0).length+" started":""],["weekly","Weekly",wd+"/"+S.wq.list.length],["season","Season "+SEASON_ID,sd+"/"+S.sq.list.length]].map(([k,l,e])=>`<button class="b${tab===k?" on":""}" role="tab" aria-selected="${tab===k}" data-a="qtab" data-v="${k}">${l}<em>${e}</em></button>`).join("")}</div>`;
if(tab==="weekly"){const xp=S.wq.list.reduce((a,q)=>a+(q.p>=q.need?0:q.xp),0);
return tabs+`<div class="row"><div class="l"><b>Weekly quests</b><small>${S.wq.list.length} bigger goals that reset every Monday, in ${wqLeft()}. Each one pays Battle Pass XP and coins the moment you finish it.</small></div><span class="pill gold">${ico("bolt")}${xp.toLocaleString()} XP left</span></div>
<div class="qgrid stg">${S.wq.list.map((q,i)=>lqCard(q,i,"#38bdf8")).join("")}</div>`}
if(tab==="season"){const xp=S.sq.list.reduce((a,q)=>a+(q.p>=q.need?0:q.xp),0),pc=sd/S.sq.list.length*100;
return tabs+`<div class="row"><div class="l"><b>Season ${SEASON_ID} quests</b><small>Long-term goals that never reset and carry across the whole season. Slow and steady, with the biggest XP and coin payouts in the game.</small><div class="bar" style="height:8px;margin-top:8px"><i style="width:${pc}%;background:linear-gradient(90deg,var(--ac),var(--gold))"></i></div></div><span class="pill gold">${ico("bolt")}${xp.toLocaleString()} XP left</span></div>
<div class="qgrid stg">${S.sq.list.map((q,i)=>lqCard(q,i,"#f0abfc")).join("")}</div>`}
const b=questFill().map((q,i)=>({q,i})).sort((a,c)=>a.q.t-c.q.t||a.i-c.i),xp=b.reduce((a,o)=>a+o.q.xp,0);
return tabs+`<div class="row"><div class="l"><b>${b.length} daily quests</b><small>New quests every day in ${qLeft()}. Quests you have started stay, the untouched ones rotate out. Quest XP is a bonus on top of what matches pay.</small></div><span class="pill gold">${ico("bolt")}${xp} XP left</span></div>
<div class="row"><div class="l"><b>${S.qsw|0} of ${QSW} free switches left today</b><small>Switch swaps a quest for a new one of the same difficulty. Skip pays coins to finish a quest right now and collect its XP.</small></div><span class="pill">${ico("coin")}${(S.coins|0).toLocaleString()}</span></div>
<div class="qgrid stg">${b.map((o,n)=>qCard(o.q,o.i,n,false)).join("")}</div>
<p class="sm">Do the task anywhere in the game and the XP goes straight to your Battle Pass (tier ${bpTier()} of ${BP_TIERS}). Harder quests are rarer and pay much more. You can also check them any time from the pause screen.</p>`}
// the quest list on the pause screen
function pauseQuests(){
const host=$("pq");if(!host)return;
const b=questFill().map((q,i)=>({q,i})).sort((a,c)=>(c.q.p>0)-(a.q.p>0)||(c.q.p/c.q.need)-(a.q.p/a.q.need)||a.q.t-c.q.t);
host.innerHTML=`<div class="pqh"><div><small class="eyebrow">Daily quests</small><h3>${b.length} active</h3></div><span class="pill">New in ${qLeft()} · ${S.qsw|0} switch${(S.qsw|0)===1?"":"es"}</span></div><div class="pql">${b.map((o,n)=>qRow(o.q,o.i,n)).join("")}</div>`}
function qRow(q,i,n){const v=Math.min(q.p,q.need),pc=v/q.need*100,sw=S.qsw|0,c=qSkipCost(q);
return`<div class="qr" style="--qt:${QTC[q.t]};--i:${n|0}"><span class="qd" title="${QT[q.t]}"></span><div class="qm"><b>${esc(q.n)}</b><div class="qb" role="progressbar" aria-valuemin="0" aria-valuemax="${q.need}" aria-valuenow="${v}"><i style="width:${pc.toFixed(1)}%"></i></div><small>${v} / ${q.need} · <em>+${q.xp} XP</em> · ${QT[q.t]}</small></div>
<div class="qa"><button class="rsb" data-a="qswap" data-v="${i}"${sw?"":" disabled"} title="Replace this quest with a new ${QT[q.t].toLowerCase()} one">Switch</button><button class="rsb" data-a="qskip" data-v="${i}"${S.coins>=c?"":" disabled"} title="Pay coins to finish this quest now and collect its XP">Skip <small>${c}</small></button></div></div>`}
function qRefresh(){try{if(view==="pg"&&PAGE==="quests")renderPage(true)}catch(e){}try{if(state==="pause")pauseQuests()}catch(e){}}
function pUpdates(){
const U=[
["Beta 1.6","Roofs, radar, music, shop and menu polish",
["Aether Rifle scope fixed: the gun now drops out of your sightline while aiming, the view is wider, and the sight is a clear centre with a fine iridescent ring, ticks and diamond nodes around the edge",
"Monsters now path around walls and crates, hop up ledges they cannot step onto, and burrow free if they ever get stuck; their stride matches the distance they cover",
"New wave phases from wave 6: Whiteout (frozen monsters thaw as you close in), Blight (poison clouds) and Firestorm (meteors and chain explosions), each with its own sky and a power-up reward when cleared",
"Bosses can no longer kill you in one hit: a single boss attack takes at most about a third of your health, with a short grace window after each hit",
"Nothing passes through walls any more: ghosts hover and walk around cover, and the Ghost boss vanishes where it stands and reappears in sight",
"Bosses now scale with difficulty: on Easy they have half the health, hit about half as hard, move slower, attack less often and one hit can take at most a fifth of your health; Medium sits between Easy and Hard",
"Fixed flickering stripes on some guns where two parts shared a surface, and steadier depth on the held gun",
"The title screen now reads Arena Strike 3D",
"You can now walk up onto house roofs: every house has an outdoor staircase, and pitched roofs are walkable up to the ridge",
"Parkour courses are much harder and more varied: sliding platforms, crumbling slabs that drop after you land, green launch pads that fire you up to a high ledge, walls to vault, narrow beams on the winding maps, double jump gaps, and each map is ringed with its own landmarks (lava spires, neon pylons, ice crystals, giant fungi, obelisks and arches). Nightmare is tighter and faster than before, so saved times were reset",
"Monster Rush arenas are now multi-level: a two-tier fortress, a crossing of raised walkways, a pillared colosseum or a lane maze with sniper decks, all with staircases up, and each new stage rolls a different layout",
"Monster Rush now changes arena after every boss: fade out, a new map and sky, a stage title card, then the next wave (Ruined Hall, Toxic Dusk, Neon Night, Frostbite, Dunes, Sunset, Autumn, Meadow)",
"Every parkour map now has its own course: Magma Run keeps wide slabs with tall pillars, Neon Circuit zigzags on long rails, Frost Spire winds up an ice tower, Toxic Depths follows a winding river of stepping stones and Dune Temple climbs a stepped ziggurat (old best times and ghosts are cleared because the courses changed)",
"Custom mode: input code for a dev-only game mode",
"Third person (Parkour, V) fixed: the camera now follows behind your aim instead of swinging up and losing your character when you look up or down",
"Aiming fixes: the Mythic Pulse and other optic guns no longer show a dark block over the reticle, and 3D iron sights now hide while you look through them",
"Reload animation is now a full sequence: tip the gun, off hand drops the mag, a fresh one comes up, seat it, rack it",
"Optics are rebuilt as open sights and a slimmer rail instead of solid blocks on top of the gun",
"Scoped sensitivity has its own slider and a smoother curve; the tutorial gains hints and R now reloads in it",
"Battle Pass grows to 150 tiers in six chapters, with a new hero header, a next-exclusive card, chapter tabs, Claim all and a Skip tier button; tiers 1 to 30 and everything you already claimed are unchanged",
"Quests now come in three kinds: Daily, Weekly (six bigger goals that reset every Monday) and Season (twelve long-term goals that never reset). Weekly and Season quests pay Battle Pass XP and coins the moment you finish them",
"The Shop gains an Items tab where every gun, skin, knife, emote, outfit, background, avatar and music disc can be bought outright, priced by rarity, plus around 19 new cases, 16 more finishers and a lot more backgrounds",
"Coin totals now match everywhere: the shop, the lobby, the HUD and the Battle Pass all read one rounded number",
"Segmented controls (difficulty, rounds, shop tabs, quest tabs) fill their width, centre their labels and slide a liquid glass highlight to the selected option; panels, buttons and chips share a refreshed liquid glass look",
"Both lobby sidebars are only as tall as their content and scroll only when the window is too short",
"Graphics: a sun glare with an anamorphic streak and lens ghosts that fades behind walls, and a subtle colour grade on High",
"The Shop is rebuilt with two tabs: Cases and Finishers. Kill finishers have their own section with 18 effects, a Finisher Case, buy and equip buttons, and a matching Finishers tab in Loadout",
"The pause menu is redesigned: a big Resume button, Map and Restart run shortcuts, settings grouped into Controls, Audio and Display with live values, and a Leave button that needs a second press so you cannot quit by accident",
"Menus feel more consistent: shorter animations, notifications that drop in from the top, the same slider, scrollbar and disabled styles everywhere, and a lobby Play panel whose mode list scrolls on its own so Play is always in reach",
"Every gun now has its own scope: iron sights, red dot, holographic, combat optic, ghost ring, rail scope, scout, marksman, long-range and beam scopes with different zoom. Aim down sights with right mouse. Scoped guns raise the real scope to your eye and you look through its lens, with the whole world still visible around it",
"Roofs are back: pitched roofs with chimneys and flat roofs you can climb using the crate stairs beside the house",
"Maps are laid out around their roads: houses face the street, lamps line it, cars park along it, towers ring the middle and parkour courses have start and finish arches",
"Radar now works like a real one: contacts show only when the green beam passes over them, pulse once, then stay frozen until the next sweep",
"New victory and defeat screens with a medal, count-up stats and coin reward; the death screen is much brighter",
"Pause screen rebuilt with settings on one card and your quests in matching rows",
"Music: 26 rebuilt discs across synthwave, lofi, metal, orchestral, EDM, trap, funk, jazz and more, each with a real melody, chords and drums",
"Knives have a tighter hitbox, gun hit zones are fuller, shotguns are more accurate, and rapid scrolling no longer flips between gun and knife",
"Animation pass: weapons thump on landing and tilt when sprinting, players lift their legs in the air, numbers bump when they change, the health bar leaves a damage trail",
"High graphics: soft bloom glow around bright lights, signs and the sun"]],
["Beta 1.4","Weapons, monsters, music and phones",
["Rarity matters: Legendary and Secret guns hit far harder, hold more, reload faster and spread less than Common ones",
"Weapon sheets: strengths and weaknesses for every gun and knife, in the Index and Loadout",
"Real gun traits: shotgun and SMG damage falls off with range, heavy guns slow you down, snipers keep full damage at distance",
"Waves have modifiers (Swarm, Brute, Ambush, Elite) and monsters now claw out of the ground with a warning rift",
"Monsters wind up before they strike, with slash, slam and spit effects and claw marks on your screen",
"Corrupted waves: blood moon, lightning, glowing cracks and a heavier soundtrack",
"New muzzle flares, tracers, impact sparks and shell casings",
"Arcade-style sounds across menus, kills, combos and rewards",
"Music discs: collect them in the Music Case and set one for home and one for matches. Boss and corrupted waves have their own themes",
"Phones and tablets: landscape touch controls with a floating stick, fire buttons, aim, grenade, crouch and more. Desktop play is unchanged",
"Death screen: slow-motion kill-cam, shattering title, killer card, run stats and a respawn ring or results bar, in every mode",
"Roofs: hop on from a crate or ledge with a well-timed jump. Hard on purpose, and you stand on top, never inside",
"Nothing hits through walls: bots, monsters, bosses, meteors and slams all need a clear line to you, and monsters no longer walk into objects",
"Ghost level (Monster Rush): spectral monsters hover and shoot you from range when they see you. Every 7th wave is one, or switch it on in the lobby",
"Bosses: the Ghost boss vanishes, reappears in sight and slams down beside you, the Corrupted boss blinks behind you and fires a nova",
"Monsters take stairs and crates smoothly, spawning monsters no longer soak up your bullets, and corpses stay on the ground they fell on",
"Servers stay open until you leave them, and your party stays together after a match. The host can swap teams and remove players from the Servers page",
"Auto graphics now reads your GPU, CPU, memory and screen size to pick a starting level, and remembers if it ever had to step down",
"Low and Potato keep the High look without the cost: baked shadows on the ground, soft discs under players and monsters, same sky and fog",
"Better lighting everywhere: sun-scatter fog toward the sun, ground haze, and soft contact shading around walls, houses and crates",
"Windows and Linux: raw mouse input, more font fallbacks, and a graphics driver reset now lowers the level instead of leaving a black screen",
"Battle Pass reworked: the first tiers come quickly and the climb stays gentle, so all 30 tiers take about 14,000 XP instead of 43,000",
"Every match feeds the pass: 70 XP for a match (130 for a win), +4 per kill, +10 per Monster Rush wave, bigger wave and boss payouts, and the first 3 matches each day pay x1.5. Quests are a bonus on top, not the only way up",
"After Tier 30 the pass keeps paying: 75 coins for every 800 XP. The pass page lists every way to earn XP, and the match results show what you got",
"Quests: 90 tasks in the pool (double what it was), including per-mode plays and wins, monsters defeated, waves cleared and coins earned",
"Quests rotate every day: untouched quests are replaced with new ones, quests you have started stay",
"Switch a quest for a new one of the same difficulty (3 free switches a day) or Skip it for coins to finish it now and collect the XP",
"The pause screen now shows your quests with progress, and you can switch or skip from there",
"Press M (or the MAP button on a phone) for a map of the mode you are in: you, enemies, teammates with names, monsters, bosses and the safe zone. Parkour shows the course, checkpoints, gems and goal. It never pauses the game",
"Monster Rush bosses can no longer leap across the whole arena: a boss jump now covers 13 meters at most"]],
["Launch","Core game ships as a single HTML file",
["3D arena shooter built with Three.js",
"Modes: Duel vs Bot, Gun Game, Party, Monster Rush, Range, Parkour, Tutorial",
"Shop cases, loadout, cosmetics, local save"]],
["Controls & combat",
"Input and weapons polish",
["Slide on Ctrl / Option (replaces crouch)",
"Grenade on G with aim preview",
"Knife charge + throw; 0.5s without knife after a throw",
"ADS toggle or hold (Settings)",
"Crit hits: gold flash, sound, and particles"]],
["Parkour",
"Course tools and fairness",
["Larger maps on Hard / Nightmare so stages stay in bounds",
"Live run timer on the HUD",
"Mario Kart-style ghost of your best run",
"Best times saved per difficulty"]],
["Monster Rush",
"AI, bosses, and chaos",
["Monsters step stairs / low platforms and unstick from walls",
"Speeds by type: green 1.0 · purple 1.5 · red 0.5",
"Extra monster types every 10 waves after wave 10",
"Boss invulnerable while minions live; dizzy until minions are cleared",
"Boss bar lowered so the name stays readable",
"10% Corrupted waves after wave 10 (backrooms look + pick 3 power-ups)"]],
["Progression",
"Quests and Battle Pass",
["Quests grant Battle Pass XP (not only coins)",
"Random quests from any mode, 2:00 countdown between quests, harder tasks give more XP",
"30-tier Battle Pass tab with horizontal reward track",
"Exclusive BP skins, knives, emotes, outfits, and rare guns"]],
["UI & quality",
"Lobby and presentation",
["Battle Pass tab next to Shop / Loadout",
"Bot health bars in duel modes",
"Update Log tab (this page)",
"Syntax fix so lobby buttons work again"]],
["Saves & multiplayer",
"Per-device saves and PeerJS rooms",
["Each device keeps its own save (coins, BP, cosmetics)",
"Name is only for display in matches",
"Host a server → share the 5-letter code",
"Friends open the same HTML file → Join with the code",
"Party Mode online: position sync, damage, kill feed",
"Host can still fill empty slots with bots"]]];
return U.map(([title,sub,bullets],i)=>`<div class="sec" style="--i:${i}"><h3>${title}</h3><p class="sm" style="margin-bottom:8px">${sub}</p><ul style="margin:0 0 0 1.1em;line-height:1.55;color:var(--ink2)">${bullets.map(b=>`<li style="margin:.2em 0">${b}</li>`).join("")}</ul></div>`).join("")}
// ---------- Battle Pass: 150 tiers in six chapters ----------
const BPV={ch:-1},bpCh=t=>clamp(Math.floor((t-1)/25),0,BP_CH.length-1),bpArt=(rw,done,lock)=>rw.kind==="item"&&I(rw.id)?thumb(I(rw.id),{w:128,h:84}):`<div class="th gt bpc" aria-hidden="true">${gly(rw.icon||"coin")}</div>`;
function bpGrant(tier){const rw=BP_REW[tier-1];if(!rw||bpTier()<tier)return null;if(!S.bpClaim||typeof S.bpClaim!=="object")S.bpClaim={};if(S.bpClaim[tier])return null;
S.bpClaim[tier]=1;if(rw.coins)S.coins+=rw.coins;if(rw.kind==="item"&&rw.id)S.own[rw.id]=1;return rw}
function pBP(){
const t=bpTier(),xp=S.bpXP|0,max=t>=BP_TIERS,next=Math.min(BP_TIERS,t+1),need=BP_XP[next]||BP_XP[BP_TIERS],prev=BP_XP[t]||0,into=xp-prev,span=Math.max(1,need-prev),pct=max?100:clamp(into/span*100,0,100),left=Math.max(0,need-xp);
if(!S.bpClaim||typeof S.bpClaim!=="object")S.bpClaim={};
if(BPV.ch<0||BPV.ch>=BP_CH.length)BPV.ch=bpCh(next);
const ch=BPV.ch,cc=BP_CH[bpCh(max?BP_TIERS:next)],claimable=BP_REW.filter(r=>r.tier<=t&&!S.bpClaim[r.tier]),claimed=Object.keys(S.bpClaim).filter(k=>S.bpClaim[k]).length,nr=BP_REW.find(r=>r.tier>t&&r.kind==="item"),dl=!S.bpd||S.bpd.d!==qDayKey()?3:Math.max(0,3-S.bpd.n);
let h=`<div class="bph" style="--cc:${cc[1]};--p:${pct}"><div class="bpring"><b>${t}</b><small>TIER</small></div>
<div class="bpi"><span class="eyebrow">Season pass · ${max?"Complete":"Chapter "+(bpCh(next)+1)+" · "+cc[0]}</span><h3>Tier ${t} <em>of ${BP_TIERS}</em></h3>
<div class="bpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i></i></div>
<small>${max?`Max tier reached. Every ${BP_OVER[0].toLocaleString()} XP now pays ${BP_OVER[1]} coins.`:`${into.toLocaleString()} / ${span.toLocaleString()} XP this tier · ${left.toLocaleString()} to Tier ${next}`}</small>
<div class="bpall"><i style="width:${t/BP_TIERS*100}%"></i></div><small class="bpsub">${claimed} of ${BP_TIERS} rewards claimed · ${xp.toLocaleString()} XP earned</small></div>
<div class="bpa">${claimable.length?`<button class="b p bpclaimall" data-a="bpall">${ico("check",16)}Claim ${claimable.length}</button>`:`<button class="b" disabled>${ico("check",16)}All claimed</button>`}
${max?"":`<button class="b" data-a="bpskip"${S.coins<bpSkipCost()?" disabled":""} title="Spend coins to finish this tier">${ico("coin",16)}Skip tier · ${bpSkipCost().toLocaleString()}</button>`}</div></div>
${nr?`<div class="bpn"><span class="eyebrow">Next exclusive</span><div class="bpnc" style="--rc:${RC[nr.r]}">${bpArt(nr)}<div><b>${esc(nr.n)}</b><small>${R[nr.r]} · Tier ${nr.tier}${nr.tier>t?` · ${(BP_XP[nr.tier]-xp).toLocaleString()} XP away`:""}</small></div></div></div>`:""}
<div class="tabs bpch" role="tablist" aria-label="Chapters">${BP_CH.map((c,i)=>{const a=i*25+1,z=a+24,done=BP_REW.slice(a-1,z).filter(r=>S.bpClaim[r.tier]).length,can=BP_REW.slice(a-1,z).some(r=>r.tier<=t&&!S.bpClaim[r.tier]);return`<button class="b${ch===i?" on":""}" role="tab" aria-selected="${ch===i}" data-a="bpch" data-v="${i}" style="--cc:${c[1]}"><i class="bpd${can?" on":""}"></i><span>${c[0]}</span><em>${a}-${z} · ${done}/25</em></button>`}).join("")}</div>
<div class="bpg" style="--cc:${BP_CH[ch][1]}">`;
for(let i=ch*25;i<Math.min(BP_TIERS,ch*25+25);i++){
const rw=BP_REW[i],unlocked=t>=rw.tier,done=!!S.bpClaim[rw.tier],can=unlocked&&!done,isNext=rw.tier===next&&!max,big=rw.kind==="item"&&rw.r>=3;
h+=`<button class="bpt${can?" can":""}${done?" done":""}${!unlocked?" lock":""}${isNext?" nxt":""}${big?" big":""}" data-a="bpclaim" data-v="${rw.tier}" style="--rc:${RC[rw.r]};--i:${i-ch*25}" ${can?"":"disabled"} aria-label="Tier ${rw.tier}, ${esc(rw.n)}${done?", claimed":can?", ready to claim":unlocked?"":", locked"}">
<span class="tn">${rw.tier}</span><div class="bpa2">${bpArt(rw)}${done?`<span class="bpok">${ico("check",20)}</span>`:!unlocked?`<span class="bpl">${ico("lock",14)}</span>`:""}</div>
<b>${esc(rw.n)}</b><small>${done?"Claimed":can?"Tap to claim":rw.kind==="item"?R[rw.r]+(rw.coins?" · +"+rw.coins.toLocaleString():""):(unlocked?"":"Locked")}</small>${isNext?`<i class="bpp"><s style="width:${pct}%"></s></i>`:""}</button>`}
return h+`</div><div class="sec"><h3>How to earn XP</h3><div class="keys">
<div><span>Finish a match</span><kbd>70 XP, win 130</kbd></div><div><span>Every kill</span><kbd>+4 XP (up to 150 a match)</kbd></div><div><span>Monster Rush</span><kbd>+10 XP per wave you reach</kbd></div><div><span>Clear a wave</span><kbd>15+ XP, more later on</kbd></div><div><span>Defeat a boss</span><kbd>80+ XP, Corrupted 150+</kbd></div><div><span>Quests</span><kbd>Daily, weekly and season</kbd></div><div><span>Daily boost</span><kbd>${dl} of 3 matches left at x1.5</kbd></div><div><span>After Tier ${BP_TIERS}</span><kbd>${BP_OVER[1]} coins every ${BP_OVER[0].toLocaleString()} XP</kbd></div></div></div>
<p class="sm">${BP_TIERS} tiers in ${BP_CH.length} chapters. Every match counts toward the pass and quests are a bonus on top. Exclusive guns, skins, knives, emotes, outfits, avatars, backgrounds, finishers and music unlock as you climb, and tier ${BP_TIERS} is the grand prize.</p>`}
function pBoard(){
const rows=Object.entries(S.board).sort((a,b)=>b[1].w-a[1].w||b[1].k-a[1].k);
return"<table><tr><th>#</th><th>Player</th><th>Wins</th><th>Kills</th></tr>"+rows.map(([n,v],i)=>`<tr class="${n===S.name?"me":""}"><td>${i+1}</td><td>${esc(n)}</td><td>${v.w|0}</td><td>${v.k|0}</td></tr>`).join("")+"</table>"}
function pHelp(){
const K2=[["Move","W A S D"],["Look and aim","Mouse"],["Jump, climb ledges","Space"],["Sprint","Shift"],["Slide","Control / Option"],["Grenade (hold to aim)","Hold G"],["Shoot / charge knife throw","Left click"],["Aim down sights","Right click to toggle"],["Reload","R"],["Gun or knife","1, 2 or scroll"],["Emotes","3 to 7"],["Scoreboard","Hold Tab"],["Map (shows where everyone is)","M"],["Pause (shows your quests)","P or Esc"],["Restart (parkour only)","T"]];
const TCH=document.body.classList.contains("touch")?[["Move","Left thumb: drag anywhere on the left"],["Sprint","Push the stick all the way forward"],["Look and aim","Drag on the right side of the screen"],["Shoot","FIRE (left or right). Drag from it to keep aiming"],["Aim down sights","AIM"],["Jump, double jump","JUMP"],["Slide / crouch","CROUCH"],["Grenade","Hold NADE, release to throw"],["Gun or knife","KNIFE / GUN"],["Emotes","EMOTE"],["Scoreboard","Hold TAB"],["Map","MAP"],["Pause","II"]]:null;
if(TCH)K2.splice(0,K2.length,...TCH);
return`<div class="sec"><h3>Watch how it works</h3>${Cine.clips([["move","Move and sprint"],["aim","Aim and shoot"],["jump","Jump and double jump"],["slide","Slide"],["reload","Reload"],["knife","Throw a knife"]])}</div>
<div class="sec"><h3>Controls</h3><div class="keys">${K2.map(k=>`<div><span>${k[0]}</span><kbd>${k[1]}</kbd></div>`).join("")}</div></div>
<div class="sec"><h3>Aiming</h3><p class="sm" style="line-height:1.55">Click the game to lock your mouse. The crosshair always stays in the centre and the view moves under it. If your browser blocks mouse lock, the mouse still turns the view, Q and E turn too, and the cursor appears when you reach a window edge so you know to bring it back. Right-click aims down sights. In Settings you can choose toggle (click on / off) or hold (keep right-click held to stay aimed). The crosshair turns red when it is over an enemy.</p></div>
<div class="sec"><h3>Movement</h3><p class="sm" style="line-height:1.55">Run into a ledge while jumping and you climb up smoothly. Hold Space for a higher jump, tap it for a short hop, and press Space again in the air for a double jump. Stairs and low steps need no jump.</p></div>
<div class="sec"><h3>Settings</h3>
<div class="row"><span>Mouse sensitivity</span><span class="sm" data-sv="sens">${S.sens.toFixed(2)}</span></div><input type="range" min=".3" max="2.5" step=".05" value="${S.sens}" data-i="sens" aria-label="Mouse sensitivity">
<div class="row"><span>Scoped sensitivity</span><span class="sm" data-sv="ssens">${S.ssens.toFixed(2)}</span></div><input type="range" min=".4" max="1.6" step=".05" value="${S.ssens}" data-i="ssens" aria-label="Scoped sensitivity">
<div class="row"><span>Volume</span></div><input type="range" min="0" max="1" step=".05" value="${S.vol}" data-i="vol" aria-label="Volume"><div class="row"><span>Music</span></div><input type="range" min="0" max="1" step=".05" value="${S.mvol}" data-i="mvol" aria-label="Music volume"><div class="row" style="opacity:.8;font-size:12px"><span>Icons: game-icons.net (CC BY 3.0, Lorc &amp; Delapouite) &middot; Audio: Howler.js (MIT)</span></div>
${gfxSel()}
<div class="row"><span>Aim down sights</span></div><select data-i="scope" aria-label="Aim down sights mode"><option value="toggle"${(S.opt&&S.opt.scopeToggle!==false)?" selected":""}>Toggle (click on / off)</option><option value="hold"${(S.opt&&S.opt.scopeToggle===false)?" selected":""}>Hold (must hold right-click)</option></select>
</div>
<div class="row"><div class="l"><b>New here?</b><small>A short guided match against an easy bot.</small></div><button class="b p" data-a="tut">Start tutorial</button></div>`}

// servers
function pServers(){
const st=Net.state,room=st==="hosting"||st==="joined",ros=Net.roster();
let h="";
if(!room){
h+=`<div class="sec"><h3>Host a server</h3><p class="sm" style="line-height:1.55">Uses PeerJS (needs internet once to connect). Share the 5-letter code. Friends open this same HTML file on any device, enter the code, then you press <b>Start match</b>. Party Mode only for online play.</p>
<button class="b p lg" data-a="hostgo"${st==="starting"?" disabled":""}>${ico("globe")}${st==="starting"?"Creating room":"Create server"}</button></div>
<div class="sec"><h3>Join a server</h3><div class="joinbox" style="padding:0;background:none;border:0;box-shadow:none"><div class="rw"><input id="jc2" type="text" maxlength="5" placeholder="CODE" autocomplete="off" spellcheck="false" aria-label="Server code" style="text-transform:uppercase;letter-spacing:.3em;text-align:center;font-weight:800"><button class="b p" data-a="join2">${ico("globe")}Join</button></div></div></div>`;
if(Net.err)h+=`<div class="err" role="alert">${esc(Net.err)}</div>`;
return h}
h+=`<div class="sec"><h3>${st==="hosting"?"Your server code":"Connected to"}</h3><div class="code">${esc(Net.code)}</div>
<div class="rw" style="display:flex;gap:8px"><button class="b" data-a="copy">${ico("copy")}Copy code</button><button class="b" data-a="leave">Leave server</button></div></div>
<div class="sec"><h3>Players ${ros.length} / ${S.mp.mode==="duel1"?2:10}</h3><div class="roster">`+Array.from({length:S.mp.mode==="duel1"?2:10},(_,i)=>{const r=ros[i],pm=PM_MODES[S.mp.mode]||PM_MODES.ffa,tt=pm.team&&S.mp.mode!=="coop"?(r&&r.team!=null?r.team:i%2):S.mp.mode==="coop"?1:-1,mg=st==="hosting"&&r;return r?`<div class="rs${r.id===Net.pid?" me":""}${tt===1?" tb":tt===0?" tr":""}"><i></i>${esc(r.name)}${r.id===Net.pid?"<em>You</em>":r.host?"<em>Host</em>":""}${mg&&tt>=0&&S.mp.mode!=="coop"?`<button class="rsb" data-a="swapteam" data-v="${esc(r.id)}" aria-label="Move ${esc(r.name)} to the other team">${tt===1?"Blue":"Red"} \u21c4</button>`:""}${mg&&r.id!==Net.pid?`<button class="rsb x" data-a="kickp" data-v="${esc(r.id)}" aria-label="Remove ${esc(r.name)}">Kick</button>`:""}</div>`:`<div class="rs empty">Open</div>`}).join("")+"</div></div>";
{const pm=PM_MODES[S.mp.mode]||PM_MODES.ffa,need=S.mp.mode==="duel1"?"Exactly two players":S.mp.mode==="coop"?"Two or more players":"Two or more players online";
const card=`<div class="perk"><b>${esc(pm.n)}</b> ${esc(pm.perk)}: ${esc(pm.pd)}<br><small>${esc(pm.d)}</small></div>`;
if(st==="hosting"){
const can=S.mp.mode==="duel1"?ros.length===2:ros.length>=2;
h+=`<div class="sec"><h3>Party game</h3><div class="pmodes">${Object.entries(PM_MODES).map(([k,m])=>`<button class="b${S.mp.mode===k?" on":""}" data-a="pmode2" data-v="${k}">${esc(m.n)}<small>${esc(m.perk)}</small></button>`).join("")}</div>${card}
<p class="sm">${need}. ${can?"Everyone is in. Press start when you are ready.":ros.length<2?"Waiting for players to join with your code.":"Too many players for this game, pick another."}</p>
<div class="rw" style="display:flex;gap:8px;flex-wrap:wrap"><button class="b p lg" data-a="start"${can?"":" disabled"}>${ico("play")}Start match</button>${S.mp.mode==="coop"?"":`<button class="b" data-a="solo">Play solo with bots</button>`}</div></div>`}
else h+=`<div class="sec"><h3>Next game</h3>${card}<p class="sm">Waiting for the host to start. You will drop straight in.</p></div>`}
if(Net.err)h+=`<div class="err" role="alert">${esc(Net.err)}</div>`;
return h}

function pCodes(){
const unlocked=DevAccess.unlocked;
return`<div class="codes-layout">
<section class="code-panel"><span class="eyebrow">Special rewards</span><h3>Got a code?</h3><p>Redeem it for exclusive skins, outfits and other rewards. Each code can be claimed once per save.</p>
<form id="redeem-form" class="code-form"><label for="reward-code">Reward code</label><div class="code-entry"><input id="reward-code" name="code" type="text" maxlength="64" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Enter your code" aria-describedby="redeem-status"><button class="b p" type="submit">Redeem</button></div></form>
<p id="redeem-status" class="code-status" role="status" aria-live="polite"></p>
<div id="code-rewards" class="code-rewards"></div>
<button class="b" data-a="page" data-v="load">${ico("pack",16)}Open Loadout</button><small class="code-note">Rewards save on this browser, just like your other items.</small></section>
<section class="code-panel developer-panel"><span class="eyebrow">Developer exclusive</span><h3>Custom mode</h3><p>Input code for a dev-only game mode.</p>
${unlocked?`<div class="code-access">${ico("check",18)}Custom mode unlocked</div><p>Access lasts until you reload or lock it. Enable Custom mode in the Monster Rush lobby.</p><div class="code-actions"><button class="b p" data-a="devwaves">Open Monster Rush</button><button class="b" data-a="devlock">Lock access</button></div>`:`<form id="developer-form" class="code-form"><label for="developer-password">Developer code</label><div class="code-entry"><input id="developer-password" name="password" type="password" maxlength="128" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Enter code" aria-describedby="developer-status"><button class="b" type="submit">Unlock</button></div><small>Developer codes are case-sensitive.</small></form>`}
<p id="developer-status" class="code-status" role="status" aria-live="polite"></p></section></div>`
}
function codeStatus(id,message,ok){const el=$(id);if(el){el.textContent=message;el.classList.toggle("success",!!ok);el.classList.toggle("error",!ok)}}
function submitReward(){
const input=$("reward-code"),result=redeemCode(input.value);codeStatus("redeem-status",result.message,result.ok);
input.setAttribute("aria-invalid",String(!result.ok));snd(result.ok?"chest":"err",.7);
if(!result.ok)return;
input.value="";$("code-rewards").innerHTML=result.items.map(id=>{const it=I(id);return`<article class="code-reward" style="--rc:${rcol(it)}">${thumb(it,{w:240,h:150})}<b>${esc(it.n)}</b><small>${PRE(id)==="s"?"Gun skin":PRE(id)==="p"?"Outfit":"Item"} · Unlocked</small></article>`}).join("");fillThumbs($("code-rewards"))
}
async function submitDeveloper(form){
const input=form.querySelector("input"),button=form.querySelector("button");if(button.disabled)return;
if(!input.value){codeStatus("developer-status","Enter the developer code first.",false);input.setAttribute("aria-invalid","true");return}
button.disabled=true;button.textContent="Checking…";const password=input.value;input.value="";
try{const ok=await DevAccess.unlock(password);if(!form.isConnected)return;
if(ok){snd("equip",.7);renderPage(true);codeStatus("developer-status","Unlocked. Open Monster Rush to enable Custom mode.",true);$("pgb").querySelector('[data-a="devwaves"]').focus()}
else{codeStatus("developer-status","Incorrect code. Custom mode is still locked.",false);input.setAttribute("aria-invalid","true");input.focus();snd("err",.7)}
}catch(error){if(form.isConnected)codeStatus("developer-status",error.message,false)}
finally{if(button.isConnected){button.disabled=false;button.textContent="Unlock"}}
}
document.addEventListener("submit",event=>{
if(event.target.id==="redeem-form"){event.preventDefault();submitReward()}
else if(event.target.id==="developer-form"){event.preventDefault();submitDeveloper(event.target)}
});
const PG={shop:{t:"Shop",f:pShop},load:{t:"Loadout",f:pLoad},codes:{t:"Redeem codes",f:pCodes},bp:{t:"Battle Pass",f:pBP},index:{t:"Index",f:pIndex},quests:{t:"Quests",f:pQuests},board:{t:"Leaderboard",f:pBoard},updates:{t:"Update Log",f:pUpdates},help:{t:"How to play",f:pHelp},servers:{t:"Servers",f:pServers}};

// ---------- cinematics: prize reveals, banners and looping tutorial clips. Everything is drawn in code, so there are no video files and it stays one page ----------
const Cine=(()=>{
const calm=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
let el=null,stop=null,tmr=0,fin=null;
function onKey(e){if(e.code==="Escape"||e.code==="Enter"||e.code==="Space"){e.preventDefault();e.stopPropagation();close()}}
function close(){if(!el)return;if(stop){stop();stop=null}clearTimeout(tmr);const e=el;el=null;e.classList.add("out");setTimeout(()=>e.remove(),320);document.removeEventListener("keydown",onKey,true);if(fin){const f=fin;fin=null;try{f()}catch(x){}}}
// confetti, light rays, shock rings and sparkles on a full screen canvas, scaled by rarity
function burst(cv,r,col,life){
const g=cv.getContext("2d");let W=0,H=0,dpr=Math.min(devicePixelRatio||1,1.5);
const fit=()=>{W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0)};fit();
const cx=()=>W/2,cy=()=>H*.44,pw=[.3,.5,.75,1,1.3,1.7][r],pal=[col,"#ffffff","#fbbf24",col],P=[];
const N=Math.round(36+pw*70);
for(let i=0;i<N;i++){const a=Math.random()*6.283,s=(240+Math.random()*520)*Math.min(1.4,.7+pw*.4);P.push({x:cx(),y:cy(),vx:Math.cos(a)*s,vy:Math.sin(a)*s-220,w:5+Math.random()*7,h:3+Math.random()*5,rot:Math.random()*6,vr:(Math.random()-.5)*14,c:pal[i%pal.length],d:Math.random()*.25})}
const rays=10+r*3;let t0=performance.now(),last=t0,id=0;
function loop(now){id=requestAnimationFrame(loop);const t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000);last=now;if(t>life+.6){g.clearRect(0,0,W,H);cancelAnimationFrame(id);return}
g.clearRect(0,0,W,H);const fade=t<.25?t/.25:t>life?Math.max(0,1-(t-life)/.6):1;
g.globalCompositeOperation="lighter";
// rotating light rays
g.save();g.translate(cx(),cy());g.rotate(t*.35);const R0=Math.hypot(W,H)*.6;
for(let i=0;i<rays;i++){const a=i/rays*6.283,w=.07+.03*Math.sin(t*2+i);g.fillStyle=col;g.globalAlpha=(.11+.05*pw)*fade*(.6+.4*Math.sin(t*3+i*1.7));g.beginPath();g.moveTo(0,0);g.arc(0,0,R0,a-w,a+w);g.closePath();g.fill()}
g.restore();
// shock rings
for(let k=0;k<3;k++){const u=t-k*.2;if(u<0||u>1.1)continue;g.globalAlpha=(1-u/1.1)*.7*fade;g.strokeStyle=k==1?"#fff":col;g.lineWidth=6-k*1.5;g.beginPath();g.arc(cx(),cy(),40+u*Math.min(W,H)*.6*(1+pw*.2),0,6.283);g.stroke()}
// soft glow behind the card
const gr=g.createRadialGradient(cx(),cy(),0,cx(),cy(),Math.min(W,H)*.42);gr.addColorStop(0,col);gr.addColorStop(1,"transparent");g.globalAlpha=(.28+.1*Math.sin(t*4))*fade;g.fillStyle=gr;g.fillRect(0,0,W,H);
// sparkles
g.globalAlpha=1;for(let i=0;i<8+r*3;i++){const a=i*2.399+t*.4,rr=90+((i*53)%160)+Math.sin(t*2+i)*14,x=cx()+Math.cos(a)*rr*1.3,y=cy()+Math.sin(a)*rr*.8,s=(Math.sin(t*5+i*2.1)*.5+.5)*7*fade;if(s<.6)continue;g.fillStyle="#fff";g.fillRect(x-s,y-.8,s*2,1.6);g.fillRect(x-.8,y-s,1.6,s*2)}
g.globalCompositeOperation="source-over";
// confetti
for(const p of P){if(t<p.d)continue;p.vy+=780*dt;p.vx*=1-1.1*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;if(p.y>H+30)continue;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.globalAlpha=Math.min(1,fade*1.4);g.fillStyle=p.c;g.scale(1,Math.abs(Math.cos(p.rot*1.7))*.8+.2);g.fillRect(-p.w/2,-p.h/2,p.w,p.h);g.restore()}}
id=requestAnimationFrame(loop);return()=>cancelAnimationFrame(id)}
// a full screen reveal: {title, name, sub, item, r, coins, xp, icon, done}
function reward(o){
if(el)close();o=o||{};const r=clamp(o.r|0,0,5),col=RC[r],it=o.item,life=[1.8,2.2,2.8,3.4,4.2,5][r];
const d=document.createElement("div");d.id="cine";d.className="cine r"+r;d.style.setProperty("--rc",col);d.setAttribute("role","dialog");d.setAttribute("aria-label",o.title||"Reward");
const extra=[o.coins?`<span class="cchip">${ico("coin")}+${o.coins} coins</span>`:"",o.xp?`<span class="cchip">${ico("bolt")}+${o.xp} XP</span>`:""].join("");
d.innerHTML=`<canvas aria-hidden="true"></canvas><div class="cflash"></div><div class="cc"><div class="cey">${esc(o.title||"Reward")}</div><div class="cth">${it?thumb(it,{w:320,h:200}):`<div class="th">${gly(o.icon||"coin")}</div>`}</div><div class="cnm">${esc(o.name||(it?it.n:""))}</div><div class="crr">${esc(o.sub||(it?R[it.r]:R[r]))}</div>${extra?`<div class="cchips">${extra}</div>`:""}<small>Click or press Enter to continue</small></div>`;
document.body.appendChild(d);el=d;fin=o.done||null;fillThumbs(d);
d.addEventListener("click",close);document.addEventListener("keydown",onKey,true);
if(!calm())stop=burst(d.querySelector("canvas"),r,col,life);
if(r>=4){document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),620)}
try{snd("rev"+r);if(o.coins)setTimeout(()=>snd("pour",.8),600)}catch(e){}
tmr=setTimeout(close,life*1000+1200)}
// a small slide-in banner for quest and tier moments
function banner(title,sub,r){
const b=document.createElement("div");b.className="cban";b.style.setProperty("--rc",RC[clamp(r|0,0,5)]);
b.innerHTML=`<i class="cbi">${gly(r>=3?"crown":"star")}</i><div><b>${esc(title)}</b><small>${esc(sub||"")}</small></div><s></s>`;
document.body.appendChild(b);setTimeout(()=>b.classList.add("out"),3200);setTimeout(()=>b.remove(),3700)}
// ---- looping tutorial clips ----
const live=new Set();let loopOn=0;
const ACC="#ff8a3d",INK="#e8eefc",DIM="#6b7a99",BG1="#101a33",BG2="#0a1022";
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function key(g,x,y,l,on,w){w=w||26;g.save();g.translate(x,y);if(on)g.translate(0,2);rr(g,0,0,w,24,6);g.fillStyle=on?ACC:"#1b2745";g.fill();g.strokeStyle=on?"#ffd2a8":"#2f3f68";g.lineWidth=1.5;g.stroke();g.fillStyle=on?"#1a0c00":INK;g.font="700 11px system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(l,w/2,12.5);g.restore()}
function man(g,x,y,s,o){ // simple runner: o={ph,lean,crouch,arm}
o=o||{};const ph=o.ph||0,lean=o.lean||0,cr=o.crouch||0;g.save();g.translate(x,y);g.scale(s,s);g.rotate(lean);g.lineCap="round";g.strokeStyle="#9fb4e6";g.lineWidth=7;
const hip=-34+cr*14,sh=hip-30+cr*4;g.beginPath();g.moveTo(0,hip);g.lineTo(0,sh);g.stroke();
for(const k of[0,1]){const a=Math.sin(ph+k*Math.PI)*.8,kx=Math.sin(a)*16,ky=hip+Math.cos(a)*18+cr*2;g.beginPath();g.moveTo(0,hip);g.lineTo(kx,ky);g.lineTo(kx+Math.sin(a*.6)*10,Math.min(0,ky+16));g.stroke()}
g.strokeStyle=ACC;g.lineWidth=6;g.beginPath();g.moveTo(0,sh+4);g.lineTo(14+(o.arm||0),sh+8);g.lineTo(26+(o.arm||0),sh+6);g.stroke();
g.fillStyle="#cdd9f7";g.beginPath();g.arc(2,sh-10,9,0,6.283);g.fill();g.fillStyle="#2a3a66";g.fillRect(2,sh-14,9,4);g.restore()}
function ground(g,W,H,t,sp){g.fillStyle="#0f1830";g.fillRect(0,H-34,W,34);g.strokeStyle="#22335c";g.lineWidth=2;for(let i=-1;i<12;i++){const x=((i*34-t*sp)%408+408)%408-20;g.beginPath();g.moveTo(x,H-34);g.lineTo(x-14,H);g.stroke()}}
function lab(g,W,t1,t2){g.textAlign="left";g.textBaseline="top";g.fillStyle=INK;g.font="700 13px system-ui,sans-serif";g.fillText(t1,12,10);if(t2){g.fillStyle=DIM;g.font="500 11px system-ui,sans-serif";g.fillText(t2,12,28)}}
const SC={
move(g,W,H,t){ground(g,W,H,t,90);const ph=t*10,k=Math.floor(t/.9)%4;lab(g,W,"Move","W A S D · Shift to sprint");
man(g,W/2+Math.sin(t*1.5)*18,H-34,1.15,{ph,lean:-.12});
[["W",0],["A",1],["S",2],["D",3]].forEach(([l,i],j)=>{const kx=W-118+(i===0?30:i===1?0:i===2?30:60),ky=H-76+(i===0?0:30);key(g,kx,ky,l,j===k)})},
aim(g,W,H,t){lab(g,W,"Aim and shoot","Mouse to look · left click to fire");const cyc=t%1.6,tx=W*.62+Math.sin(t*1.3)*70,ty=H*.52+Math.cos(t*1.9)*26;
for(let i=3;i>0;i--){g.fillStyle=i%2?"#f8fafc":"#ef4444";g.beginPath();g.arc(tx,ty,i*11,0,6.283);g.fill()}
const e=1-Math.pow(1-Math.min(1,cyc/.5),3),px=W*.3+(tx-W*.3)*e,py=H*.6+(ty-H*.6)*e;
g.strokeStyle=cyc>.5?"#fbbf24":ACC;g.lineWidth=2;g.beginPath();g.arc(px,py,13,0,6.283);g.moveTo(px-22,py);g.lineTo(px-7,py);g.moveTo(px+7,py);g.lineTo(px+22,py);g.moveTo(px,py-22);g.lineTo(px,py-7);g.moveTo(px,py+7);g.lineTo(px,py+22);g.stroke();
if(cyc>.5&&cyc<.9){const u=(cyc-.5)/.4;g.strokeStyle="rgba(255,225,160,"+(1-u)+")";g.lineWidth=3;g.beginPath();g.arc(tx,ty,8+u*34,0,6.283);g.stroke();g.fillStyle="rgba(255,255,255,"+(1-u)+")";g.font="800 14px system-ui";g.textAlign="center";g.fillText("HIT",tx,ty-22-u*16);
g.fillStyle="rgba(255,220,140,"+(1-u)+")";g.beginPath();g.moveTo(W*.2,H-30);g.lineTo(px,py);g.lineWidth=2;g.strokeStyle="rgba(255,230,170,"+(1-u)*.8+")";g.stroke()}
g.fillStyle="#1b2745";rr(g,W-52,H-60,34,48,14);g.fill();g.fillStyle=cyc>.5&&cyc<.8?ACC:"#2f3f68";g.fillRect(W-52,H-60,17,22)},
jump(g,W,H,t){ground(g,W,H,t,40);lab(g,W,"Jump and double jump","Space, then Space again in the air");const c=t%2.4,gy=H-34;let y=0,p=0;
if(c<.5){y=Math.sin(c/.5*Math.PI)*0;p=0}
const u=c;if(u<1.6){const a=u<.8?u/.8:1;y=u<.8?Math.sin(a*Math.PI/2)*46:46+Math.sin(Math.min(1,(u-.8)/.8)*Math.PI/2)*26-Math.max(0,(u-1.25))*60}else y=Math.max(0,(1.7-u)*0);
if(u>=1.6)y=Math.max(0,72-(u-1.6)*180);
man(g,W/2,gy-y,1.1,{ph:y>1?.6:t*9,lean:-.05});
if(u>.8&&u<1.2){const k=(u-.8)/.4;g.strokeStyle="rgba(180,230,255,"+(1-k)+")";g.lineWidth=3;g.beginPath();g.ellipse(W/2,gy-46-12,16+k*26,5+k*7,0,0,6.283);g.stroke()}
const s1=u<.25,s2=u>.8&&u<1.05;key(g,W/2-60,H-30-2,"SPACE",s1||s2,120)},
slide(g,W,H,t){ground(g,W,H,t,150);lab(g,W,"Slide","Sprint, then Control / Option");const c=t%2.2,sl=c>1&&c<1.7;
man(g,W/2+(sl?18:0),H-34,1.1,{ph:t*11,lean:sl?-.55:-.1,crouch:sl?1.3:0});
if(sl){for(let i=0;i<5;i++){g.strokeStyle="rgba(190,230,255,"+(.5-i*.09)+")";g.lineWidth=2;g.beginPath();g.moveTo(W/2-30-i*16,H-30-i*3);g.lineTo(W/2-60-i*16,H-30-i*3);g.stroke()}}
key(g,W-96,H-52,"SHIFT",c<1,44);key(g,W-48,H-52,"CTRL",sl,44)},
reload(g,W,H,t){lab(g,W,"Reload","Press R · empty guns reload on their own click");const c=t%2.6,cx=W/2-10,cy=H/2+4;
g.fillStyle="#2a3a66";rr(g,cx-70,cy-14,120,24,6);g.fill();g.fillStyle="#3a4d80";g.fillRect(cx+40,cy-26,48,12);g.fillStyle="#2a3a66";rr(g,cx-52,cy+8,26,40,5);g.fill();
const mx=c<.5?0:c<.9?(c-.5)/.4*70:c<1.4?70:c<1.9?70-(c-1.4)/.5*70:0;
g.fillStyle=ACC;rr(g,cx-8,cy+10+mx,22,38,4);g.fill();g.fillStyle="#1a0c00";for(let i=0;i<4;i++)g.fillRect(cx-4,cy+16+mx+i*8,14,4);
const n=c<1.9?(c<.5?0:0):Math.min(12,Math.round((c-1.9)/.5*12));g.fillStyle=DIM;g.font="700 22px system-ui";g.textAlign="right";g.fillText(String(c<.5?12:c<1.9?0:n),W-20,H-24);
key(g,W-60,H-70,"R",c>.4&&c<.7)},
knife(g,W,H,t){ground(g,W,H,t,0);lab(g,W,"Knife","2 to draw · hold click to charge · release to throw");const c=t%2.4,cx=W*.28;man(g,cx,H-34,1.05,{ph:0,arm:c<1?-c*8:10});
const tx=W*.82;g.fillStyle="#6b4a2a";g.fillRect(tx,H-110,10,76);
if(c<1){g.fillStyle=ACC;g.fillRect(cx-30,H-20,Math.min(60,c*60),5)}
if(c>=1&&c<1.8){const u=(c-1)/.8,x=cx+30+(tx-cx-30)*u,y=H-78-Math.sin(u*Math.PI)*18;g.save();g.translate(x,y);g.rotate(u*18);g.fillStyle="#dbe4f5";g.beginPath();g.moveTo(-12,-3);g.lineTo(12,0);g.lineTo(-12,3);g.closePath();g.fill();g.restore()}
else if(c>=1.8){g.save();g.translate(tx-8,H-78);g.fillStyle="#dbe4f5";g.fillRect(-14,-2,16,4);g.restore();const u=Math.min(1,(c-1.8)/.4);g.strokeStyle="rgba(255,255,255,"+(1-u)+")";g.lineWidth=2;g.beginPath();g.arc(tx-4,H-78,6+u*22,0,6.283);g.stroke()}}
};
function run(now){if(!live.size){loopOn=0;return}requestAnimationFrame(run);if(now-run.l<33)return;run.l=now;
for(const c of live){if(!c.isConnected){live.delete(c);continue}const r=c.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.width)continue;
const g=c.getContext("2d"),W=c.width/c._d,H=c.height/c._d,t=(now-c._t0)/1000;g.setTransform(c._d,0,0,c._d,0,0);
const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,BG1);gr.addColorStop(1,BG2);g.fillStyle=gr;g.fillRect(0,0,W,H);
try{SC[c.dataset.clip](g,W,H,calm()?1.1:t)}catch(e){}}}
run.l=0;
function scan(root){(root||document).querySelectorAll("canvas[data-clip]:not([data-on])").forEach(c=>{if(!SC[c.dataset.clip])return;c.dataset.on=1;c._d=Math.min(devicePixelRatio||1,2);const W=+c.getAttribute("width")||320,H=+c.getAttribute("height")||180;c.width=W*c._d;c.height=H*c._d;c._t0=performance.now();live.add(c);if(!loopOn){loopOn=1;requestAnimationFrame(run)}})}
const clips=(list)=>`<div class="clips">${list.map(([k,t])=>`<figure><canvas data-clip="${k}" width="320" height="180" role="img" aria-label="${esc(t)} animation"></canvas><figcaption>${esc(t)}</figcaption></figure>`).join("")}</div>`;
function confetti(r){if(calm())return;const c=document.createElement("canvas");c.className="cconf";c.setAttribute("aria-hidden","true");document.body.appendChild(c);burst(c,r,RC[Math.max(2,r)],1.5);setTimeout(()=>c.remove(),3000)}
return{reward,banner,close,scan,clips,confetti}})();
// one coin number for every screen: the lobby pill and the shop pill are painted together from S.coins, so they can never disagree
const paintCoins=(()=>{const els=[$("cn"),$("pgn")].filter(Boolean),RM=matchMedia("(prefers-reduced-motion:reduce)");let shown=null,goal=null,raf=0,fin=0,endAt=0;
const fmt=v=>v.toLocaleString("en-US"),write=v=>{shown=v;const t=fmt(v);for(const n of els)if(n.textContent!==t)n.textContent=t},cls=(g,sp)=>{const n=$("pgn");if(n){n.classList.toggle("gain",g);n.classList.toggle("spend",sp)}};
return function paintCoins(snap){const to=Math.max(0,Math.round(+S.coins||0));if(S.coins!==to)S.coins=to;
if(to===goal&&!snap){if(raf&&performance.now()>endAt+120){cancelAnimationFrame(raf);raf=0;write(to);cls(false,false)}else if(!raf&&shown!==to)write(to);return}
goal=to;cancelAnimationFrame(raf);raf=0;clearTimeout(fin);
if(snap||shown==null||RM.matches||document.hidden||Math.abs(to-shown)<2){write(to);cls(false,false);return}
const from=shown,t0=performance.now(),D=Math.min(700,260+Math.abs(to-from)*.4);endAt=t0+D;cls(to>from,to<from);const cn=$("cn");if(cn){cn.classList.remove("bump");void cn.offsetWidth;cn.classList.add("bump")}
const step=now=>{const k=Math.min(1,(now-t0)/D);if(k>=1){raf=0;write(goal);fin=setTimeout(()=>cls(false,false),240);return}write(Math.round(from+(to-from)*(1-Math.pow(1-k,3))));raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}})();
setInterval(()=>{try{paintCoins()}catch(e){}},500);

// ---------- actions ----------
const ACT={
shtab(e){if(CB)return;SH.tab=e.dataset.v==="fin"||e.dataset.v==="items"?e.dataset.v:"cases";WON=null;snd("tab",.5);$("pgb").scrollTop=0;renderPage()},
shcat(e){SH.cat=e.dataset.v;snd("ui",.4);renderPage(true)},
shic(e){if(ITC.some(c=>c[0]===e.dataset.v)){SH.ic=e.dataset.v;SH.itf="all";snd("ui",.4);renderPage(true)}},
shif(e){SH.itf=e.dataset.v;snd("ui",.4);renderPage(true)},
itembuy(e){const it=I(e.dataset.v),pr=it?itemPrice(it):0;if(CB||!it||!pr||owns(it)||S.coins<pr){snd("err",.7);return}
S.coins-=pr;S.own[it.id]=1;sv();paintCoins();snd("chest");toast("Bought "+it.n+". Equip it in Loadout");renderPage(true)},
shff(e){SH.ff=e.dataset.v;snd("ui",.4);renderPage(true)},
finbuy(e){const it=I(e.dataset.v),pr=it?itemPrice(it):0;if(CB||!it||PRE(it.id)!=="f"||!pr||owns(it)||S.coins<pr){snd("err",.7);return}
S.coins-=pr;S.own[it.id]=1;S.fin=it.id;sv();paintCoins();snd("chest");toast("Bought "+it.n+" and equipped it");renderPage(true)},
fin(e){if(I(e.dataset.v)&&(e.dataset.v==="f0"||S.own[e.dataset.v])){S.fin=e.dataset.v;sv();renderPage(true)}},
cq(e){if(!CB){CQ=clamp(+e.dataset.v||1,1,10);renderPage(true)}},
mapx(){BigMap.close()},
mapo(){BigMap.open()},
prestart(){restartMatch()},
pleave(){leaveMatch()},
ads(e){INP.scope({value:e.dataset.v})},
qswap(e){const i=+e.dataset.v;if(qSwap(i)){snd("ui",.6);toast("Quest switched")}qRefresh()},
qskip(e){const i=+e.dataset.v,q=S.qb[i];if(q&&qSkip(i))toast("Quest skipped · +"+q.xp+" XP");qRefresh()},
bpskip(){const t=bpTier();if(t>=BP_TIERS)return;const c=bpSkipCost();if(S.coins<c)return;S.coins-=c;addBP(BP_XP[t+1]-(S.bpXP|0));renderPage(true)},
skipc(){S.skipCase=!S.skipCase;sv();renderPage(true)},
autoc(){S.autoCase=!S.autoCase;sv();renderPage(true)},
page(e){if(e.dataset.v!=="shop")WON=null;openPage(e.dataset.v)},
back(){goLobby()},
mode(e){sel=e.dataset.v;lobbyUI()},
df(e){S.opt.df=e.dataset.v;sv();lobbyUI()},
pkknife(e){S.opt.pkKnife=e.dataset.v==="1";sv();lobbyUI()},
gl(e){S.opt.ghostLvl=e.dataset.v==="1";sv();lobbyUI()},
gr(e){if(!DevAccess.unlocked){S.opt.grind=false;sv();ACT.devaccess();return}S.opt.grind=e.dataset.v==="1";sv();lobbyUI()},
devaccess(){openPage("codes");const input=$("developer-password");if(input)input.focus()},
devwaves(){sel="waves";goLobby()},
devlock(){DevAccess.lock();renderPage(true);codeStatus("developer-status","Custom mode locked and switched off.",true);$("developer-password").focus()},
ghost(e){S.opt.ghostRace=clamp(+e.dataset.v||0,0,2);sv();lobbyUI()},
rg(e){S.opt.rg=+e.dataset.v;sv();lobbyUI()},
pmode(e){if(PM_MODES[e.dataset.v]){S.mp.mode=e.dataset.v;sv();lobbyUI()}},
pbots(e){S.mp.bots=clamp(+e.dataset.v|0,0,9);sv();lobbyUI()},
pdiff(e){if(DF[e.dataset.v]){S.mp.diff=e.dataset.v;sv();lobbyUI()}},
pmode2(e){if(PM_MODES[e.dataset.v]){S.mp.mode=e.dataset.v;sv();Net.setMode(e.dataset.v);renderPage(true)}},
pbots2(e){S.mp.bots=clamp(+e.dataset.v|0,0,9);sv();Net.setBots(S.mp.bots);renderPage(true)},
play(){S.name=cleanName($("nm").value)||S.name;startGame(sel)},
tut(){sel="tut";startGame("tut")},
host(){openPage("servers")},
hostgo(){S.name=cleanName($("nm").value)||S.name||"Player";sv();Net.host()},
join(){S.name=cleanName($("nm").value)||S.name||"Player";sv();Net.join($("jc").value)},
join2(){S.name=cleanName($("nm").value)||S.name||"Player";sv();const i=$("jc2");Net.join(i?i.value:"")},
copy(){const c=Net.code;try{navigator.clipboard.writeText(c).then(()=>toast("Code copied"),()=>toast("Code: "+c))}catch(e){toast("Code: "+c)}},
leave(){Net.leave()},
swapteam(e){Net.setTeam(e.dataset.v);renderPage(true)},
kickp(e){Net.kick(e.dataset.v)},
start(){Net.start()},
solo(){S.name=cleanName($("nm").value)||S.name||"Player";sv();startGame0(S.mp.mode==="duel1"?"duel1":"party")},
resume(){resume()},
quit(){quit()},
lobby(){quit()},
again(){const m=endAgain;if(!m)return quit();show("");startGame(m)},
case(e){openCase(+e.dataset.v)},
claim(e){return;const q=QU[+e.dataset.v];if(!q||(S.q[q.k]||0)<q.need)return;const now=Date.now();if(S.qcd&&S.qcd[q.k]>now)return;addBP(q.xp);S.q[q.k]=0;if(!S.qcd)S.qcd={};S.qcd[q.k]=now+5*60*1000;sv();snd("pick");toast("Quest claimed · 5:00 cooldown");questDot();renderPage(true);startQuestTick()},
bpclaim(e){const tier=+e.dataset.v,rw=bpGrant(tier);if(!rw)return;sv();snd("win");
const msg=rw.kind==="item"?("Unlocked "+rw.n+(rw.coins?" · +"+rw.coins+" coins":"")):("+"+(rw.coins||0)+" coins");
toast("Tier "+tier+" · "+msg);Cine.reward({title:"Tier "+tier+" reward",item:rw.kind==="item"&&rw.id?I(rw.id):null,r:rw.r||1,name:rw.n,coins:rw.coins,icon:rw.icon});renderPage(true)},
bpall(){const t=bpTier(),got=[];for(let i=1;i<=t;i++){const rw=bpGrant(i);if(rw)got.push(rw)}if(!got.length)return;sv();snd("win");
const items=got.filter(r=>r.kind==="item"),coins=got.reduce((a,r)=>a+(r.coins||0),0),best=items.sort((a,b)=>b.r-a.r)[0];
toast("Claimed "+got.length+" reward"+(got.length>1?"s":"")+(coins?" · +"+coins.toLocaleString()+" coins":"")+(items.length?" · "+items.length+" exclusive"+(items.length>1?"s":""):""));
if(best)Cine.reward({title:"Best of "+got.length+" rewards",item:I(best.id),r:best.r,name:best.n,coins:coins||0,icon:best.icon});renderPage(true)},
qtab(e){if(["daily","weekly","season"].includes(e.dataset.v)){QV.tab=e.dataset.v;snd("tab",.5);renderPage(true)}},
bpch(e){const c=+e.dataset.v;if(c>=0&&c<BP_CH.length){BPV.ch=c;snd("ui",.4);renderPage(true)}},
ld(e){S.cur=clamp(+e.dataset.v|0,0,4);sv();renderPage(true)},
eqp(e){const it=I(e.dataset.v),f=e.dataset.f;if(!it||!owns(it))return;
if(f==="bg"||f==="av")S[f]=it.id;else if(["g","k","s","p"].includes(f)&&PRE(it.id)===({g:"g",k:"n",s:"s",p:"p"})[f])eq()[f]=it.id;else return;
sv();snd("ui",.7);renderPage(true)},
slot(e){LD.slot=clamp(+e.dataset.v|0,0,4);if(PAGE==="load")LK.cat="m";renderPage(true)},
lkcat(e){const c=e.dataset.v;if(LKC.some(x=>x[0]===c)){LK.cat=c;LK.sel=null;snd("ui",.4)}renderPage(true)},
lkown(){LK.own=LK.own?0:1;renderPage(true)},
lkms(e){LK.cat="u";LK.ms=e.dataset.v==="mm"?"mm":"mh";LK.sel=null;snd("tab",.5);renderPage(true)},
dskeq(e){const it=I(e.dataset.v),s=e.dataset.s;if(!it||!owns(it)||PRE(it.id)!=="u"||(s!=="mh"&&s!=="mm"))return;S[s]=it.id;sv();Mus.prev=null;Mus.go();snd("disc",.8);toast(it.n+(s==="mh"?" is now your home music":" is now your match music"));renderPage(true)},
dskprev(e){const it=I(e.dataset.v);if(!it)return;const p=Mus.prev;snd("scratch",.5);
if(!p||p.id!==it.id)Mus.prev={id:it.id,kind:"lobby"};else if(p.kind==="lobby")Mus.prev={id:it.id,kind:"battle"};else Mus.prev=null;Mus.go();renderPage(true)},
wsh(e){wshOpen(e.dataset.v)},
wshx(e){wshClose()},
lkpick(e){const it=I(e.dataset.v),c=LK.cat;if(!it)return;LK.sel=it.id;
if(owns(it)){if(c==="bg"||c==="av")S[c]=it.id;else if(c==="f")S.fin=it.id;else if(c==="m")eq().e[LD.slot]=it.id;else if(c==="u"){S[LK.ms||"mh"]=it.id;Mus.prev=null;Mus.go()}else if(["g","s","k","p"].includes(c))eq()[c]=it.id;sv();snd(c==="u"?"disc":"equip",.8)}else snd("err",.7);
renderPage(true)},
em(e){const id=e.dataset.v,it=id?I(id):null;if(id&&(!it||!owns(it)||PRE(id)!=="m"))return;
eq().e[LD.slot]=id;sv();snd("ui",.7);renderPage(true)},
icat(e){IDX.cat=e.dataset.v;const C=CATS.find(c=>c[0]===IDX.cat);if(C&&C[2]&&!C[2].includes(I(IDX.sel)))IDX.sel=C[2][0].id;renderPage()},
ifilt(e){IDX.f=e.dataset.v;renderPage(true)},
ix(e){IDX.sel=e.dataset.v;renderPage(true)},
ixeq(e){const it=I(e.dataset.v);if(!it||!owns(it))return;const c=PRE(it.id);
if(c==="m")eq().e[LD.slot]=it.id;else if(c==="b")S.bg=it.id;else if(c==="a")S.av=it.id;else if(EQF[c])eq()[EQF[c]]=it.id;else return;
sv();snd("ui",.7);toast(it.n+" equipped");renderPage(true)}};

document.addEventListener("click",e=>{
let t=e.target;
// SVG <use> / text nodes: walk up to the actionable control
while(t&&t!==document&&!(t.getAttribute&&t.getAttribute("data-a")))t=t.parentNode||t.parentElement;
if(!t||t===document)return;
if(t.disabled||t.getAttribute("disabled")!=null)return;
const a=t.getAttribute("data-a"),f=ACT[a];if(!f)return;if(a==="wshx"&&t.id==="wsh"&&e.target.closest&&e.target.closest("[data-stop]")&&!e.target.closest(".wshc"))return;
e.preventDefault();e.stopPropagation();
try{snd("ui",.35)}catch(err){}
try{f(t)}catch(err){console.error("ACT."+a,err);toast("Button error: "+a)}});
document.addEventListener("input",e=>{const t=e.target,f=t.dataset&&t.dataset.i&&INP[t.dataset.i];if(f)f(t)});
const INP={
sens(t){S.sens=clamp(+t.value||1,.3,2.5);sv();syncSliders()},
ssens(t){S.ssens=clamp(+t.value||1,.4,1.6);sv();syncSliders()},
vol(t){setVol(clamp(+t.value,0,1));sv();syncSliders()},
mvol(t){S.mvol=clamp(+t.value,0,1);Mus.go();sv();syncSliders()},
gfx(t){Q.pick(t.value);syncSliders();toast(t.value==="auto"?"Graphics set to Auto ("+QL[S.gfx].n+" for "+(HW.name||"this device")+")":"Graphics set to "+QL[S.gfx].n+". Scenery detail updates next match")},
scope(t){if(!S.opt||typeof S.opt!=="object")S.opt={};S.opt.scopeToggle=t.value!=="hold";sv();toast(S.opt.scopeToggle?"ADS: toggle (click to aim)":"ADS: hold right-click");syncSliders()}};
const gfxSel=()=>{const v=S.auto?"auto":String(S.gfx);return`<div class="row"><span>Graphics</span></div><select data-i="gfx" aria-label="Graphics quality">${[["auto",S.auto?"Auto ("+QL[S.gfx].n+")":"Auto"],...QL.map((q,i)=>[String(i),q.n])].map(o=>`<option value="${o[0]}"${o[0]===v?" selected":""}>${o[1]}</option>`).join("")}</select>`};
// the orange fill on a slider is a CSS variable the script keeps in step with its value
function paintRange(i){i.style.setProperty("--p",((i.value-i.min)/(i.max-i.min)*100).toFixed(1)+"%")}
function paintRanges(){document.querySelectorAll("input[type=range]").forEach(paintRange)}
document.addEventListener("input",e=>{if(e.target.type==="range")paintRange(e.target)},true);
function syncSliders(){
document.querySelectorAll('[data-i="sens"]').forEach(i=>{if(+i.value!==S.sens)i.value=S.sens});document.querySelectorAll('[data-i="ssens"]').forEach(i=>{if(+i.value!==S.ssens)i.value=S.ssens});
document.querySelectorAll('[data-i="vol"]').forEach(i=>{if(+i.value!==S.vol)i.value=S.vol});document.querySelectorAll('[data-i="mvol"]').forEach(i=>{if(+i.value!==S.mvol)i.value=S.mvol});
document.querySelectorAll('[data-sv="sens"]').forEach(s=>s.textContent=S.sens.toFixed(2));document.querySelectorAll('[data-sv="ssens"]').forEach(s=>s.textContent=S.ssens.toFixed(2));
document.querySelectorAll('[data-i="gfx"]').forEach(s=>{const v=S.auto?"auto":String(S.gfx);if(s.value!==v)s.value=v;s.options[0].textContent=S.auto?"Auto ("+QL[S.gfx].n+")":"Auto"});
document.querySelectorAll('[data-sv="vol"]').forEach(s=>s.textContent=Math.round(S.vol*100)+"%");document.querySelectorAll('[data-sv="mvol"]').forEach(s=>s.textContent=Math.round(S.mvol*100)+"%");
paintRanges();
const adsT=!(S.opt&&S.opt.scopeToggle===false);document.querySelectorAll('[data-a="ads"]').forEach(b=>{const on=(b.dataset.v==="toggle")===adsT;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
document.querySelectorAll('[data-i="scope"]').forEach(s=>{const v=(S.opt&&S.opt.scopeToggle===false)?"hold":"toggle";if(s.value!==v)s.value=v})}
addEventListener("keydown",e=>{
if(e.code==="Escape"&&view==="pg")ACT.back();
if(e.code==="Enter"&&e.target&&(e.target.id==="jc"||e.target.id==="jc2")){e.preventDefault();e.target.id==="jc"?ACT.join():ACT.join2()}});
$("nm").addEventListener("change",()=>{S.name=cleanName($("nm").value)||"Player";$("nm").value=S.name;sv()});
for(const id of["jc"])$(id).addEventListener("input",e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"")});
document.addEventListener("input",e=>{if(e.target.id==="jc2")e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"")});
setInterval(()=>{try{questTickGlobal();questDot()}catch(e){}},1000);
Net.onChange=()=>{
if(view==="pg"&&PAGE==="servers")renderPage(true);
if(view==="lobby")$("ml").textContent=Net.err||roomLine()};

(function initOpt(){
if(!S.opt||typeof S.opt!=="object")S.opt={};
S.opt.grind=false;
if(!DF[S.opt.df])S.opt.df="easy";if(S.pkLay!==3){S.pkt={};S.pkg={};S.pkb={};S.pkLay=3}if(![3,5,10].includes(S.opt.rg))S.opt.rg=5;S.opt.ghostRace=clamp(+S.opt.ghostRace||0,0,2);if(S.opt.scopeToggle==null)S.opt.scopeToggle=true})();

// shop cards tilt toward the pointer and slide a highlight across the picture
document.addEventListener("pointermove",e=>{if(e.pointerType==="touch")return;const it=e.target.closest&&e.target.closest(".it");if(!it)return;
const r=it.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,s=it.style;
s.setProperty("--mx",(x*100).toFixed(0)+"%");s.setProperty("--my",(y*100).toFixed(0)+"%");s.setProperty("--tx",((x-.5)*16).toFixed(1)+"deg");s.setProperty("--ty",((.5-y)*12).toFixed(1)+"deg")});
document.addEventListener("pointerout",e=>{const it=e.target.closest&&e.target.closest(".it");if(it&&!it.contains(e.relatedTarget)){it.style.removeProperty("--tx");it.style.removeProperty("--ty")}});
