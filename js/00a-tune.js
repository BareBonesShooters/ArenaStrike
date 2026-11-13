// ---------- live tuning panel (developer tool, off for players; loads first so any file can call Tune.n) ----------
// Game code reads tunable numbers through Tune.n("name", default, min, max), e.g.
//   const k = Tune.n("recoil.stiffness", 180, 20, 600);
// Without ?tune in the address it simply returns the default (one object lookup, no UI).
// With ?tune a panel lists every value the game has asked for, with sliders that change it live;
// "Copy" puts the changed numbers on the clipboard so they can be written back into the code as the new defaults.
const Tune=(()=>{
const on=/[?&]tune\b/.test(location.search),V={},D={};let panel=null,list=null,dirty=false;
try{if(on)Object.assign(V,JSON.parse(localStorage.getItem("arenaTune")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("arenaTune",JSON.stringify(V))}catch(e){}};
function row(k){
const d=D[k],r=document.createElement("label");r.className="tn-r";
const step=d.step||(d.max-d.min)/200;
r.innerHTML=`<span>${k}</span><input type="range" min="${d.min}" max="${d.max}" step="${step}"><output></output>`;
const inp=r.querySelector("input"),out=r.querySelector("output");
const sync=()=>{inp.value=V[k];out.textContent=(+V[k]).toFixed(step<1?3:0);r.classList.toggle("tn-ch",V[k]!==d.def)};
inp.addEventListener("input",()=>{V[k]=+inp.value;save();sync()});
r.addEventListener("dblclick",()=>{V[k]=d.def;save();sync()});
sync();list.appendChild(r)}
function build(){
panel=document.createElement("div");panel.id="tune";
panel.innerHTML=`<style>#tune{position:fixed;right:8px;top:8px;z-index:9999;width:300px;max-height:80vh;overflow:auto;background:rgba(12,14,20,.92);color:#dde;font:11px system-ui;padding:8px;border-radius:8px;pointer-events:auto}
#tune .tn-r{display:grid;grid-template-columns:1fr 90px 44px;gap:4px;align-items:center;margin:2px 0}#tune .tn-ch span{color:#ffd166}#tune button{font:11px system-ui;margin:0 4px 6px 0}
#tune output{text-align:right}</style><b>Tune</b> <button data-a="copy">Copy changed</button><button data-a="reset">Reset all</button><button data-a="hide">Hide</button><div></div>`;
list=panel.querySelector("div");document.body.appendChild(panel);
panel.addEventListener("keydown",e=>e.stopPropagation());
panel.addEventListener("click",e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;
if(a==="copy"){const ch={};for(const k in D)if(V[k]!==D[k].def)ch[k]=V[k];const t=JSON.stringify(ch,null,1);try{navigator.clipboard.writeText(t)}catch(err){}prompt("Changed values",t)}
if(a==="reset"){for(const k in D)V[k]=D[k].def;save();list.innerHTML="";for(const k in D)row(k)}
if(a==="hide")panel.style.display=panel.style.display==="none"?"":"none"});
for(const k in D)row(k)}
function n(k,def,min,max,step){
if(!on)return def;
if(!D[k]){D[k]={def,min:min??0,max:max??(def*4||1),step};if(!(k in V))V[k]=def;dirty=true;if(document.body){if(!panel)build();else row(k)}}
return V[k]}
if(on)addEventListener("load",()=>{if(!panel)build()});
// backquote toggles the panel while tuning
if(on)addEventListener("keydown",e=>{if(e.code==="Backquote"&&panel)panel.style.display=panel.style.display==="none"?"":"none"});
return{n,on,get values(){return{...V}}}})();
