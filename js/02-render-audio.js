"use strict";
// ---------- renderer / scene ----------
const sc=new T.Scene(),cam=new T.PerspectiveCamera(75,innerWidth/innerHeight,.05,420);
// quality budget read by the world builder, sky, particles and the HUD; 09-main.js owns the levels
const LOD={pr:1.5,sh:2048,cloud:2,props:1,fx:1,tex:2048,dust:1,mz:1};
const rd=new T.WebGLRenderer({antialias:!SOFT&&S.gfx<2&&(devicePixelRatio||1)<1.5,stencil:false,powerPreference:SOFT?"default":"high-performance"});
rd.setSize(innerWidth,innerHeight);rd.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
rd.shadowMap.enabled=true;rd.shadowMap.type=T.PCFSoftShadowMap;
rd.domElement.id="gl";document.body.prepend(rd.domElement);{const v=document.createElement("div");v.id="vgn";v.setAttribute("aria-hidden","true");rd.domElement.after(v)}
const hemi=new T.HemisphereLight(0xffffff,0x555566,.8),sun=new T.DirectionalLight(0xffffff,.9),mzL=new T.PointLight(0xffd7a0,0,16,2);let mzT=0;
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
{const c=sun.shadow.camera;c.left=-62;c.right=62;c.top=62;c.bottom=-62;c.near=1;c.far=260}
sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;
sc.add(hemi,sun,sun.target,cam);
addEventListener("resize",()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();rd.setSize(innerWidth,innerHeight)});

// ---------- audio ----------
let AC=null,MG=null,NB=null,BKG=false,DL=0; // BKG/DL: set while a voice is being rendered offline for Howler
function actx(){
if(AC===null){try{AC=new(window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=S.vol;MG.connect(AC.destination);
const n=AC.sampleRate*.4|0;NB=AC.createBuffer(1,n,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}catch(e){AC=false}}
if(AC&&!BKG&&AC.state==="suspended")AC.resume().catch(()=>{});return AC||null}
const setVol=v=>{S.vol=v;if(MG)MG.gain.value=v;try{if(window.Howler)Howler.volume(v)}catch(e){}};
function tone(f,d,type,v,f2,dl){const a=actx();if(!a)return;const t=a.currentTime+DL+(dl||0),o=a.createOscillator(),g=a.createGain();
o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2||f/2),t+d);
g.gain.setValueAtTime(Math.max(.0009,v),t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(MG);o.start(t);o.stop(t+d+.03)}
function hiss(d,v,fq,dl){const a=actx();if(!a||!NB)return;const t=a.currentTime+DL+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
s.buffer=NB;f.type="highpass";f.frequency.value=fq;g.gain.setValueAtTime(Math.max(.0009,v),t);g.gain.exponentialRampToValueAtTime(.0008,t+d);
s.connect(f);f.connect(g);g.connect(MG);s.start(t);s.stop(t+d)}
const SND={
sh:(v,r)=>{hiss(.09,.26*v,900*r);tone(190*r,.11,"sawtooth",.13*v,60)},
hit:v=>tone(900,.05,"square",.06*v,600),
head:v=>{tone(1300,.07,"square",.07*v,900);tone(1900,.05,"sine",.05*v,1500,.03)},
rl:v=>{tone(300,.08,"triangle",.08*v,200);tone(420,.1,"triangle",.09*v,300,.5)},
kill:v=>{tone(520,.12,"sine",.14*v,700);tone(780,.2,"sine",.14*v,1000,.1)},
hurt:v=>{tone(120,.16,"sawtooth",.15*v,50);hiss(.08,.1*v,300)},
jump:v=>tone(260,.1,"sine",.05*v,420),
djump:v=>{tone(420,.13,"sine",.06*v,900);tone(640,.1,"triangle",.03*v,1200,.04)},
land:v=>{hiss(.07,.12*v,200);tone(90,.09,"sine",.12*v,50)},
step:v=>hiss(.04,.035*v,500),
pick:v=>{tone(660,.08,"sine",.1*v,880);tone(990,.1,"sine",.1*v,1200,.07)},
ui:v=>tone(700,.04,"sine",.05*v,500),
tick:v=>tone(880,.06,"square",.04*v,880),
go:v=>{tone(660,.25,"square",.06*v,990)},
win:v=>{[523,659,784,1046].forEach((f,i)=>tone(f,.25,"triangle",.12*v,f*1.01,i*.11))},
lose:v=>{[392,330,262].forEach((f,i)=>tone(f,.3,"triangle",.1*v,f*.9,i*.15))},
emote:v=>tone(440,.2,"triangle",.07*v,660)};
function sndLive(k,vol,rate){try{if(!actx())return;const f=SND[k];if(f)f(vol==null?1:vol,rate||1)}catch(e){}}
// ---------- weapon voices: every gun and every knife has its own synthesised sound ----------
function nz(d,v,type,fq,dl,f2,q){const a=actx();if(!a||!NB)return;const t=a.currentTime+DL+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();d=Math.min(d,.38);
s.buffer=NB;s.playbackRate.value=.8+Math.random()*.4;f.type=type;f.frequency.setValueAtTime(fq,t);if(f2)f.frequency.exponentialRampToValueAtTime(Math.max(40,f2),t+d);if(q)f.Q.value=q;
g.gain.setValueAtTime(Math.max(.0009,v),t);g.gain.exponentialRampToValueAtTime(.0008,t+d);s.connect(f);f.connect(g);g.connect(MG);s.start(t);s.stop(t+d)}
const clk=(f,v,dl)=>{tone(f,.022,"square",.05*v,f*.5,dl);nz(.025,.06*v,"highpass",3500,dl)};
const GF={ // fire: crack (noise), body (low tone), tail (room) and a signature layer per family
pistol:(v,p,x)=>{nz(.05,.34*v,"highpass",2100*p);tone(260*p,.09,"sawtooth",.16*v,68*p);tone(1700*p,.025,"square",.06*v,700);if(x)nz(.16,.07*v,"lowpass",1800,.01,500)},
smg:(v,p,x)=>{nz(.035,.26*v,"highpass",2800*p);tone(330*p,.055,"square",.09*v,110*p);tone(2400*p,.015,"square",.04*v,900);if(x)tone(210*p,.05,"sawtooth",.07*v,90,.045)},
ar:(v,p,x)=>{nz(.07,.34*v,"highpass",1300*p);tone(170*p,.12,"sawtooth",.18*v,52*p);nz(.2,.1*v,"lowpass",1100,.02,380);if(x)tone(900*p,.03,"square",.05*v,400)},
shot:(v,p,x)=>{nz(.2,.5*v,"lowpass",2600*p,0,500);nz(.07,.35*v,"highpass",1100);tone(110*p,.28,"sawtooth",.24*v,32);tone(70*p,.3,"sine",.22*v,28);nz(.32,.12*v,"lowpass",700,.04,260);if(x)nz(.05,.2*v,"bandpass",3000,.07,0,2)},
snip:(v,p)=>{nz(.1,.42*v,"highpass",900*p);tone(140*p,.22,"sawtooth",.22*v,36);tone(70*p,.3,"sine",.2*v,26);nz(.38,.15*v,"lowpass",900,.06,200);tone(3200*p,.04,"sine",.05*v,1400)},
plasma:(v,p,x)=>{tone(1500*p,.17,"square",.09*v,190*p);tone(420*p,.2,"sine",.12*v,1500*p);nz(.09,.1*v,"bandpass",3000*p,0,900,3);if(x)tone(2400*p,.1,"triangle",.05*v,600,.02)},
arc:(v,p)=>{for(let i=0;i<4;i++)tone((2100-i*330)*p,.04,"sawtooth",.06*v,(900-i*100)*p,i*.022);nz(.12,.16*v,"highpass",4200);tone(140*p,.1,"square",.07*v,60)},
rail:(v,p)=>{tone(300*p,.1,"sine",.09*v,2600*p);tone(110*p,.34,"sawtooth",.28*v,28,.09);nz(.3,.42*v,"lowpass",3200,.09,260);tone(2000*p,.25,"sine",.07*v,300,.1)},
coil:(v,p)=>{tone(80*p,.3,"triangle",.2*v,40);for(let i=0;i<3;i++)tone((2600-i*500)*p,.07,"sawtooth",.07*v,300+i*80,i*.035);nz(.25,.3*v,"lowpass",2000,.02,300);tone(55,.35,"sine",.22*v,26,.03)},
pulse:(v,p)=>{tone(130*p,.08,"sine",.2*v,55);nz(.06,.22*v,"lowpass",2400,0,500);tone(520*p,.04,"square",.05*v,200)},
storm:(v,p)=>{tone(100*p,.1,"sawtooth",.2*v,40);nz(.14,.26*v,"bandpass",1600*p,0,500,1.5);for(let i=0;i<2;i++)tone(2400-i*400,.04,"sawtooth",.05*v,800,.03+i*.03)},
omega:(v,p)=>{GF.ar(v*.8,p*1.1,1);tone(2200*p,.18,"sine",.06*v,3200,.01);tone(3300*p,.14,"sine",.04*v,2400,.03)},
aether:(v,p)=>{tone(880*p,.22,"sine",.1*v,1760*p);tone(1320*p,.2,"sine",.08*v,660*p,.02);nz(.15,.14*v,"highpass",3500);tone(120*p,.1,"triangle",.14*v,50)},
cannon:(v,p)=>{nz(.26,.55*v,"lowpass",1800*p,0,300);tone(90*p,.36,"sawtooth",.28*v,24);tone(48,.4,"sine",.26*v,22);nz(.1,.3*v,"highpass",1500)},
laser:(v,p)=>{tone(2600*p,.12,"sawtooth",.08*v,700*p);tone(3400*p,.07,"sine",.05*v,1200,.01);nz(.05,.08*v,"highpass",5000)},
revolver:(v,p)=>{nz(.09,.46*v,"highpass",1200*p);tone(200*p,.2,"sawtooth",.24*v,40);nz(.3,.14*v,"lowpass",900,.02,250);tone(1400*p,.03,"square",.05*v,500)}
};
const GR={ // reload: a sequence of mechanical events laid out across the real reload time T
pistol:(v,T,p)=>{clk(420*p,v,T*.15);tone(140*p,.06,"sine",.1*v,70,T*.2);clk(640*p,v,T*.58);clk(300*p,v,T*.88);nz(.05,.08*v,"bandpass",1800,T*.88,0,2)},
smg:(v,T,p)=>{clk(520*p,v,T*.12);tone(180*p,.07,"triangle",.1*v,80,T*.18);clk(760*p,v,T*.6);nz(.08,.07*v,"bandpass",2400,T*.82,0,2);clk(480*p,v,T*.9)},
ar:(v,T,p)=>{tone(210*p,.08,"triangle",.12*v,90,T*.14);clk(360*p,v,T*.3);tone(170*p,.1,"triangle",.14*v,70,T*.55);nz(.12,.08*v,"bandpass",1200,T*.78,500,1.5);clk(560*p,v,T*.88);clk(420*p,v,T*.93)},
shot:(v,T,p)=>{for(let i=0;i<3;i++){const d=T*(.14+i*.16);clk(480*p+i*60,v,d);tone(120,.05,"sine",.07*v,70,d)}clk(300,v*1.2,T*.72);tone(140,.07,"square",.1*v,60,T*.72);clk(240,v*1.3,T*.84);tone(110,.08,"square",.1*v,50,T*.84)},
snip:(v,T,p)=>{clk(900*p,v,T*.18);tone(1400*p,.1,"sine",.04*v,1100,T*.18);tone(150,.08,"triangle",.1*v,80,T*.3);clk(500,v,T*.5);nz(.1,.07*v,"bandpass",1600,T*.64,0,2);clk(1000*p,v*1.1,T*.8);clk(420,v,T*.92)},
energy:(v,T,p)=>{tone(900*p,.28,"sine",.08*v,180,T*.08);tone(260,.3,"triangle",.08*v,1500*p,T*.5);tone(1900*p,.09,"sine",.07*v,2400,T*.94);nz(.14,.05*v,"highpass",3500,T*.5)},
rail:(v,T,p)=>{tone(120,Math.min(.38,T*.6),"sawtooth",.05*v,1700*p,T*.15);clk(500,v*1.2,T*.9);tone(2200*p,.12,"sine",.05*v,1600,T*.92)},
heavy:(v,T,p)=>{for(let i=0;i<4;i++)tone(110+i*20,.08,"square",.08*v,70,T*(.1+i*.16));nz(.3,.07*v,"bandpass",800,T*.2,0,1.2);clk(380,v*1.3,T*.82);tone(90,.12,"sawtooth",.14*v,50,T*.88)}
};
const RLF={pistol:"pistol",revolver:"pistol",smg:"smg",ar:"ar",omega:"ar",shot:"shot",snip:"snip",plasma:"energy",arc:"energy",laser:"energy",aether:"energy",rail:"rail",coil:"rail",pulse:"heavy",storm:"heavy",cannon:"heavy"};
const GVOICE={"Pistol":["pistol",1,0],"Sidearm+":["pistol",1.3,1],"SMG":["smg",1,0],"Burst SMG":["smg",.82,1,1],"Assault Rifle":["ar",1,0],"Carbine":["ar",1.25,1],"Shotgun":["shot",1,0],"Scattergun":["shot",1.3,1],"Marksman":["snip",1],"Scout Rifle":["snip",1.4],"Plasma Gun":["plasma",1,0],"Arc Blaster":["arc",1],"Railgun":["rail",1],"Coil Driver":["coil",1],"Heavy Pulse":["pulse",1],"Storm Cannon":["storm",1],"Omega Rifle":["omega",1],"Aether Rifle":["aether",1],"Revolver":["revolver",1],"Machine Pistol":["smg",1.55,1],"Battle Rifle":["ar",.8,0],"Auto Shotgun":["shot",.85,1],"Light Machine Gun":["pulse",.75],"Hand Cannon":["revolver",.7,1],"Anti-Materiel Rifle":["snip",.55],"Nova Beam":["laser",1]};
const hashS=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
function gunVoice(g){ // known guns use the table above; any new gun gets a family from its traits and a pitch from its name, so it never sounds like another
if(g._v)return g._v;const t=GVOICE[g.n],h=hashS(g.n);
const fam=t?t[0]:g.fam||(g.coil?"coil":g.glow&&g.scope?"laser":g.glow&&!g.st?"plasma":g.pel?"shot":g.scope?"snip":g.multi?"pulse":g.glow?"aether":g.a?(g.t<.1?"smg":"ar"):"pistol");
return g._v={f:GF[fam]?fam:"pistol",p:t?t[1]:.85+(h%45)/100,x:t?t[2]:h&1,b:t?t[3]:0}}
function gunLive(g,k,v,T){try{if(!actx()||!g)return;const o=gunVoice(g);v=v==null?1:v;
if(k==="fire"){GF[o.f](v,o.p,o.x);if(o.b)setTimeout(()=>{try{GF[o.f](v*.7,o.p*1.05,o.x)}catch(e){}},40)}
else if(k==="rl")(GR[RLF[o.f]||"ar"])(v,Math.max(.5,T||g.rl||1.5),o.p);
else if(k==="dry"){if(/energy|rail/.test(RLF[o.f]||""))tone(700*o.p,.12,"sine",.06*v,200);else{tone(1300*o.p,.016,"square",.07*v,800);tone(190*o.p,.05,"triangle",.07*v,110)}}
}catch(e){}}
// knives: whoosh, edge accent, flesh hit, wall stick; each blade has its own pitch, weight and character
const KV={"Combat Knife":{w:.8,p:1,k:"steel"},"Kunai":{w:.6,p:1.3,k:"ring"},"Machete":{w:1.3,p:.7,k:"steel"},"Karambit":{w:.7,p:1.2,k:"curve"},"Katana":{w:1,p:1.05,k:"shing"},"Plasma Blade":{w:1,p:.9,k:"plasma"},"Solar Edge":{w:1.1,p:.8,k:"fire"},"Tanto":{w:.8,p:1.1,k:"ring"},"Butterfly":{w:.5,p:1.4,k:"flip"},"Cleaver":{w:1.5,p:.6,k:"heavy"},"Void Fang":{w:.9,p:.75,k:"void"},"Star Piercer":{w:.8,p:1.35,k:"star"},"Season Blade":{w:1,p:.95,k:"steel"},"Echo Kunai":{w:.6,p:1.2,k:"echo"},"Apex Edge":{w:1,p:1.1,k:"apex"}};
const KACC={ // edge accent played with the whoosh
steel:(v,p)=>tone(2400*p,.04,"sine",.04*v,1800,.05),ring:(v,p)=>tone(3000*p,.3,"sine",.03*v,2700,.03),curve:(v,p)=>{nz(.1,.08*v,"highpass",5000,.02);tone(1800*p,.08,"sine",.03*v,3200)},
shing:(v,p)=>{tone(3300*p,.4,"triangle",.05*v,3000,.04);nz(.12,.1*v,"highpass",4500,.02)},plasma:(v,p)=>{tone(160*p,.3,"sawtooth",.07*v,420*p);tone(1900,.06,"square",.04*v,500,.05)},
fire:(v,p)=>{nz(.3,.14*v,"lowpass",1400,0,3000);tone(110*p,.3,"sine",.1*v,60)},flip:(v,p)=>{clk(900*p,v);clk(700*p,v,.07);clk(1100*p,v,.14)},
heavy:(v,p)=>{tone(90*p,.18,"sine",.2*v,40,.06);nz(.12,.12*v,"lowpass",600,.05)},void:(v,p)=>{tone(420*p,.34,"sine",.08*v,60);tone(1400,.3,"triangle",.03*v,300,.04)},
star:(v,p)=>{[2400,3200,3900].forEach((f,i)=>tone(f*p,.12,"sine",.035*v,f*p*1.2,.03*i))},echo:(v,p)=>{nz(.1,.12*v,"bandpass",2600*p,.12,1200,2);tone(2200*p,.06,"sine",.03*v,1500,.14)},
apex:(v,p)=>{tone(2600*p,.1,"triangle",.05*v,3600*p);nz(.12,.1*v,"highpass",4000,.1)}};
function knVoice(k){return KV[k.n]||(KV[k.n]={w:.6+(k.s.len||.3),p:1.5-(k.s.len||.3),k:k.s.glow?"plasma":k.s.curve?"curve":k.s.ring?"ring":"steel"})}
function knLive(k,m,v){try{if(!actx()||!k)return;const o=knVoice(k);v=v==null?1:v;const w=o.w,p=o.p;
if(m==="swing"){const d=.12+.1*w;nz(d,.26*v,"bandpass",900*p,0,2600*p,1.4);nz(d*.8,.1*v,"highpass",2500*p,.02);(KACC[o.k]||KACC.steel)(v,p)}
else if(m==="throw"){nz(.2,.22*v,"bandpass",700*p,0,2800*p,1.6);for(let i=0;i<4;i++)tone((260+i*40)*p,.05,"sawtooth",.04*v,200*p,i*.05);(KACC[o.k]||KACC.steel)(v*.7,p)}
else if(m==="hit"){tone(160/Math.sqrt(w),.09,"sine",.2*v,60);nz(.07,.2*v,"lowpass",1800,0,500);tone(900*p,.05,"square",.05*v,500,.01);if(o.k==="plasma"||o.k==="void")tone(1200*p,.12,"sawtooth",.05*v,200,.01);else tone(2100*p,.18,"sine",.025*v,1800,.01)}
else if(m==="stick"){tone(280/Math.sqrt(w),.05,"square",.1*v,120);tone(1800*p,.3,"sine",.045*v,1700,.02);nz(.04,.14*v,"highpass",2500)}
}catch(e){}}
// ---------- sound library: Howler.js plays every sound; each synth voice above is rendered once (OfflineAudioContext, with a small room reverb and a limiter) and handed to it ----------
const SB={h:{},q:[],pend:{},stat:{},busy:false,act:0,sr:32000,nz:null,on:typeof Howl==="function"&&typeof OfflineAudioContext==="function"};
function wavOf(buf,loop){ // mono AudioBuffer -> 16-bit WAV blob URL
const d=buf.getChannelData(0);let n=d.length;if(!loop){while(n>64&&Math.abs(d[n-1])<.0006)n--;n=Math.min(d.length,n+256)}
const v=new DataView(new ArrayBuffer(44+n*2)),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,d[i]));v.setInt16(44+i*2,s<0?s*32768:s*32767,true)}
return URL.createObjectURL(new Blob([v],{type:"audio/wav"}))}
function irBuf(oc){const sr=oc.sampleRate,n=sr*.45|0,b=oc.createBuffer(1,n,sr),d=b.getChannelData(0);let lp=0;
for(let i=0;i<n;i++){const x=(Math.random()*2-1)*Math.pow(1-i/n,3);lp+=(x-lp)*(.5-.35*i/n);d[i]=lp}return b}
function bake(key,dur,fn,o){ // run a synth voice against an offline context, then give the result to Howler
o=o||{};return new Promise(res=>{try{
const sr=SB.sr,oc=new OfflineAudioContext(1,Math.ceil(sr*dur),sr),m=oc.createGain(),cp=oc.createDynamicsCompressor();
cp.threshold.value=-14;cp.knee.value=10;cp.ratio.value=6;cp.attack.value=.002;cp.release.value=.12;m.connect(cp);
if(o.wet){const cv=oc.createConvolver(),wg=oc.createGain();cv.buffer=irBuf(oc);wg.gain.value=o.wet;m.connect(cv);cv.connect(wg);wg.connect(cp)}
const pg=oc.createGain(),ws=oc.createWaveShaper(),cv2=new Float32Array(4096);for(let i=0;i<4096;i++)cv2[i]=Math.tanh((i/2047.5-1)*2)/Math.tanh(2);ws.curve=cv2;
m.gain.value=o.loop?1:3;pg.gain.value=o.loop?1:.8;cp.connect(pg);pg.connect(ws);ws.connect(oc.destination); // pre-gain into the compressor, make-up gain, then a soft clipper: quiet detail stays, loud shots round off instead of clipping
if(!SB.nz){SB.nz=new Float32Array(sr*.4|0);for(let i=0;i<SB.nz.length;i++)SB.nz[i]=Math.random()*2-1}
const nb=oc.createBuffer(1,SB.nz.length,sr);nb.getChannelData(0).set(SB.nz);
const a0=AC,m0=MG,n0=NB;AC=oc;MG=m;NB=nb;BKG=true;DL=0;
try{fn()}finally{AC=a0;MG=m0;NB=n0;BKG=false;DL=0}
oc.startRendering().then(b=>{const d=b.getChannelData(0);let pk=0,sq=0;for(let i=0;i<d.length;i++){const a=Math.abs(d[i]);if(a>pk)pk=a;sq+=d[i]*d[i]}
SB.stat[key]=[+pk.toFixed(3),+Math.sqrt(sq/d.length).toFixed(4),+(d.length/sr).toFixed(2)];
if(pk<.0005){res(false);return}
const url=wavOf(b,o.loop),x={ok:false};x.h=new Howl({src:[url],format:["wav"],loop:!!o.loop,onload(){x.ok=true;try{URL.revokeObjectURL(url)}catch(e){}if(key[0]==="m")Mus.go()},onloaderror(){x.ok=false}});
SB.h[key]=x;res(true)}).catch(()=>res(false))
}catch(e){res(false)}})}
function bq(key,dur,fn,o,front){if(!SB.on||SB.h[key]||SB.pend[key])return;SB.pend[key]=1;const j=[key,dur,fn,o];front?SB.q.unshift(j):SB.q.push(j);if(!SB.busy)pump()}
function pump(){SB.busy=true;const j=SB.q.shift();if(!j){SB.busy=false;return}
bake(j[0],j[1],j[2],j[3]).then(()=>setTimeout(pump,j[0][0]==="m"?120:20))}
function bplay(keys,v,rate){ // play one of the baked variants; false = not ready, caller falls back to the live synth
if(!SB.on)return false;let c=[];for(const k of keys){const x=SB.h[k];if(x&&x.ok)c.push(x)}if(!c.length)return false;
if(SB.act>40)return true;const x=c[(Math.random()*c.length)|0],id=x.h.play();x.h.volume(Math.max(0,Math.min(1,v)),id);x.h.rate(Math.max(.5,Math.min(2.5,rate||1)),id);
SB.act++;x.h.once("end",()=>{SB.act--},id);return true}
// a swelling note for music and pads (the live helpers above have no attack)
function note(f,t,d,v,type,att,det){const a=actx();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t0=a.currentTime+DL+t;o.type=type||"sine";o.frequency.value=f;if(det)o.detune.value=det;
g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(v,t0+(att||.02));g.gain.exponentialRampToValueAtTime(.0005,t0+d);o.connect(g);g.connect(MG);o.start(t0);o.stop(t0+d+.02)}
// ----- more sound effects (the original table above is kept; these add to it or sharpen it) -----
Object.assign(SND,{
hit:v=>{tone(1100,.04,"square",.05*v,700);tone(180,.07,"sine",.12*v,90);nz(.03,.07*v,"highpass",3000)},
head:v=>{tone(1500,.06,"square",.07*v,1000);tone(2300,.22,"sine",.06*v,2000,.02);tone(150,.08,"sine",.12*v,70)},
ui:v=>{tone(760,.035,"sine",.05*v,560);tone(1520,.03,"sine",.02*v,1100)},
hover:v=>tone(1250,.022,"sine",.02*v,1250),
tab:v=>{tone(480,.05,"sine",.04*v,680);tone(960,.04,"sine",.015*v,1100,.02)},
whoosh:v=>nz(.28,.14*v,"bandpass",500,0,3200,.9),
open:v=>{nz(.2,.1*v,"bandpass",600,0,2400,1.2);tone(300,.16,"sine",.05*v,600)},
shut:v=>{nz(.16,.09*v,"bandpass",2400,0,500,1.2);tone(520,.12,"sine",.04*v,260)},
err:v=>{tone(200,.1,"square",.07*v,180);tone(160,.16,"square",.07*v,140,.12)},
equip:v=>{clk(700,v*1.3);tone(150,.1,"triangle",.14*v,70,.02);nz(.12,.08*v,"bandpass",1800,.03,900,1.5)},
swap:v=>{nz(.1,.1*v,"bandpass",1400,0,700,1.3);clk(520,v,.07);tone(110,.07,"sine",.1*v,70,.07)},
coin:v=>{tone(1318,.12,"sine",.1*v,1330);tone(1760,.3,"sine",.1*v,1770,.07);tone(3520,.2,"sine",.025*v,3500,.07)},
pour:v=>{for(let i=0;i<9;i++)tone(1500+(i*137)%900,.07,"sine",.06*v,1200+(i*91)%600,i*.05+((i*7)%3)*.01)},
chest:v=>{tone(70,.28,"sine",.25*v,48);nz(.25,.12*v,"lowpass",700,0,200);tone(180,.4,"sawtooth",.05*v,330,.05);nz(.3,.07*v,"highpass",5000,.18);[1046,1318,1568].forEach((f,i)=>tone(f,.35,"sine",.06*v,f*1.01,.2+i*.08))},
lvl:v=>{[523,659,784,988,1318].forEach((f,i)=>{tone(f,.22,"triangle",.1*v,f*1.01,i*.08);tone(f*2,.2,"sine",.03*v,f*2,i*.08+.01)})},
quest:v=>{[659,784,1046].forEach((f,i)=>tone(f,.22,"triangle",.1*v,f,i*.09));SND.coin(v*.8)},
beat:v=>{tone(62,.12,"sine",.28*v,40);tone(54,.14,"sine",.22*v,36,.16)},
boom:v=>{nz(.38,.5*v,"lowpass",2400,0,120);tone(80,.4,"sine",.35*v,24);nz(.1,.3*v,"highpass",1200)},
slam:v=>{tone(120,.3,"sine",.35*v,28);nz(.2,.4*v,"lowpass",900,0,150);nz(.06,.25*v,"highpass",2500)},
roar:v=>{tone(95,.8,"sawtooth",.16*v,50);tone(143,.7,"sawtooth",.1*v,70,.03);nz(.38,.2*v,"bandpass",400,0,900,1.1);nz(.38,.14*v,"bandpass",700,.35,300,1.3)},
growl:v=>{tone(110,.4,"sawtooth",.1*v,70);nz(.3,.12*v,"bandpass",350,0,600,2)},
horn:v=>{tone(110,.6,"sawtooth",.1*v,108);tone(165,.6,"sawtooth",.08*v,162);tone(220,.55,"square",.04*v,216,.05)},
clear:v=>{[523,659,784].forEach((f,i)=>tone(f,.4,"sine",.1*v,f,i*.1));tone(1046,.6,"sine",.06*v,1046,.3)},
ammo:v=>{clk(600,v);clk(900,v,.07);tone(880,.08,"sine",.05*v,1100,.1)},
heal:v=>{[523,659,784,1046].forEach((f,i)=>tone(f,.25,"sine",.07*v,f*1.02,i*.06))},
spd:v=>{tone(300,.3,"sawtooth",.05*v,1400);nz(.25,.08*v,"highpass",3500,.05)},
spawn:v=>{tone(300,.5,"sine",.08*v,1800);nz(.4,.07*v,"highpass",4000,.1)},
rico:v=>{tone(2600,.2,"sine",.05*v,900);nz(.04,.1*v,"highpass",4000)},
shell:v=>{tone(4200,.05,"sine",.03*v,3600);tone(3100,.07,"sine",.025*v,2800,.06);tone(5200,.04,"sine",.02*v,4800,.13)}});
for(let n=2;n<=5;n++)SND["mk"+n]=v=>{for(let i=0;i<n;i++)tone(440*Math.pow(1.1225,i*2+2),.14,"square",.05*v,440*Math.pow(1.1225,i*2+3),i*.055);tone(110*n,.3,"sine",.14*v,60,.02)};
for(let r=0;r<6;r++)SND["rev"+r]=v=>{ // prize sting: longer and richer the rarer the item
const n=2+r,st=[0,4,7,12,16,19,24];for(let i=0;i<n;i++){const f=392*Math.pow(2,st[i]/12);tone(f,.3+.05*r,"triangle",.09*v,f*1.005,i*(.09-.006*r));if(r>=2)tone(f*2,.25,"sine",.025*v,f*2,i*(.09-.006*r)+.01)}
if(r>=2)nz(.35,.07*v,"highpass",5000,.1);if(r>=3)tone(60,.5,"sine",.22*v,38);
if(r>=4)[392,494,587,784].forEach(f=>tone(f,.9,"sine",.04*v,f*1.01,n*.07));if(r>=5){tone(200,.7,"sawtooth",.05*v,2400);nz(.38,.1*v,"highpass",6000,.2)}};
// ----- arcade sounds: chiptune blips, coin and power-up jingles, combo ladders, plus the monster, rift and thunder effects -----
const sq=(f,d,v,dl,f2)=>tone(f,d,"square",v,f2||f,dl),tri=(f,d,v,dl,f2)=>tone(f,d,"triangle",v,f2||f,dl);
Object.assign(SND,{
ui:v=>{sq(988,.035,.045*v);sq(1318,.05,.04*v,.03)},
hover:v=>sq(1760,.018,.012*v),
tab:v=>{sq(660,.04,.04*v,0,880);sq(990,.05,.03*v,.04)},
pick:v=>[523,659,784,1046,1318].forEach((f,i)=>{sq(f,.07,.055*v,i*.045);tri(f/2,.07,.05*v,i*.045)}),
coin:v=>{sq(988,.07,.07*v);sq(1319,.45,.07*v,.07);tone(2637,.25,"sine",.03*v,2637,.07)},
buy:v=>{for(let i=0;i<4;i++){sq(988+i*120,.06,.05*v,i*.07);sq(1319+i*160,.18,.05*v,i*.07+.05)}},
go:v=>{sq(523,.1,.06*v);sq(523,.1,.06*v,.12);sq(784,.32,.07*v,.24);tri(392,.32,.08*v,.24)},
win:v=>{[523,523,523,659,784,659,784,1046].forEach((f,i)=>{sq(f,i<7?.1:.55,.065*v,i*.1);tri(f/2,i<7?.1:.55,.08*v,i*.1)})},
ghost:v=>{tone(330,1.7,"sine",.07*v,990);tone(335,1.7,"sine",.06*v,985,.06);tone(660,1.5,"triangle",.03*v,1320,.25);tone(110,1.8,"sine",.1*v,70)},
phase:v=>{tone(1300,.55,"sine",.05*v,150);tone(820,.55,"triangle",.04*v,90,.05);tone(3000,.2,"sine",.02*v,500)},
dth:v=>{tone(220,.9,"sawtooth",.09*v,34);tone(110,1.3,"sine",.16*v,26);[1318,1046,784,523,392].forEach((f,i)=>sq(f,.2,.03*v,.06+i*.1,f*.55));tone(3200,.35,"sine",.02*v,300,.02)},
lose:v=>[392,370,349,330,262].forEach((f,i)=>{sq(f,.2,.055*v,i*.17,f*.96);tri(f/2,.2,.07*v,i*.17,f*.48)}),
lvl:v=>{[523,659,784,1046,784,1046,1318].forEach((f,i)=>{sq(f,.09,.06*v,i*.07);tri(f/2,.09,.06*v,i*.07)});sq(1568,.5,.06*v,.5);tone(2093,.45,"sine",.03*v,2093,.5)},
quest:v=>{[784,988,1175,1568].forEach((f,i)=>sq(f,.1,.06*v,i*.08));sq(2093,.4,.05*v,.34);SND.coin(v*.7)},
xp:v=>{sq(1175,.04,.04*v,0,1568);sq(1568,.05,.03*v,.04)},
emote:v=>{sq(523,.08,.05*v,0,784);sq(784,.1,.05*v,.07,1046)},
disc:v=>{nz(.12,.1*v,"bandpass",900,0,2400,2);tone(180,.18,"sawtooth",.05*v,720);sq(660,.06,.05*v,.2);sq(990,.14,.05*v,.27);clk(520,v,.14)},
scratch:v=>{nz(.2,.12*v,"bandpass",1500,0,500,3);tone(900,.18,"sawtooth",.04*v,200)},
dig:v=>{for(let i=0;i<3;i++)nz(.38,.3*v,"lowpass",300-i*40,i*.3,90,1);tone(52,1.3,"sine",.3*v,36);for(let i=0;i<9;i++)nz(.03,.1*v,"highpass",2500,i*.12+(i*37%10)/100)},
rift:v=>{tone(80,1.5,"sawtooth",.1*v,260);tone(82,1.5,"sawtooth",.09*v,266);tone(1200,1.2,"sine",.035*v,300,.1);for(let i=0;i<3;i++)nz(.38,.14*v,"bandpass",500,i*.4,3000,2);tone(40,1.4,"sine",.3*v,28)},
mrise:v=>{tone(95,.7,"sawtooth",.09*v,55);nz(.32,.16*v,"lowpass",500,0,180,1);tone(140,.5,"square",.03*v,70,.05);nz(.1,.12*v,"highpass",3000,.5)},
mwind:v=>{tone(130,.32,"sawtooth",.08*v,220);nz(.26,.1*v,"bandpass",800,0,1700,2)},
claw:v=>{nz(.12,.2*v,"bandpass",3200,0,900,1.5);tone(300,.08,"sawtooth",.06*v,120);tone(120,.1,"sine",.14*v,60,.05);nz(.05,.12*v,"highpass",5000,.03)},
mslam:v=>{tone(70,.4,"sine",.4*v,24);nz(.32,.35*v,"lowpass",1000,0,100);nz(.08,.2*v,"highpass",2000);nz(.12,.15*v,"bandpass",2400,0,700,1.5)},
spit:v=>{tone(500,.14,"sine",.1*v,180);nz(.1,.12*v,"bandpass",1200,0,400,3);tone(260,.1,"triangle",.06*v,500,.06)},
splat:v=>{nz(.12,.2*v,"lowpass",1800,0,300,1);tone(220,.12,"sine",.14*v,60);nz(.05,.1*v,"highpass",3500)},
mdie:v=>{tone(320,.4,"sawtooth",.1*v,70);nz(.25,.15*v,"bandpass",900,0,250,2);tone(160,.35,"square",.04*v,50,.03)},
cdie:v=>{tone(200,.8,"sawtooth",.12*v,40);tone(203,.8,"sawtooth",.1*v,38);nz(.38,.22*v,"bandpass",500,0,100,1.5);tone(1500,.6,"sine",.04*v,300,.05);tone(50,.9,"sine",.3*v,28)},
thunder:v=>{nz(.06,.5*v,"highpass",1200);nz(.38,.5*v,"lowpass",1800,.03,120);nz(.38,.35*v,"lowpass",500,.3,70);tone(48,1.5,"sine",.35*v,26,.05)},
elite:v=>{tone(196,.5,"sawtooth",.09*v,190);tone(294,.5,"sawtooth",.07*v,288,.05);sq(587,.3,.04*v,.25);nz(.3,.14*v,"bandpass",400,0,900,1.2)},
cstart:v=>{tone(40,2.2,"sawtooth",.15*v,130);nz(.38,.2*v,"bandpass",300,0,2000,1.5);tone(1760,.6,"sine",.03*v,440,.5);tone(52,2.2,"sine",.3*v,34)}});
const _k0=SND.kill;SND.kill=v=>{_k0(v);sq(1568,.05,.03*v,.05,2093)};
for(let n=2;n<=5;n++)SND["mk"+n]=v=>{const sc=[0,2,4,7,9,12];for(let i=0;i<n;i++){const f=523*Math.pow(2,sc[i]/12);sq(f,.09,.055*v,i*.06);tri(f/2,.09,.06*v,i*.06)}tone(110*n,.3,"sine",.14*v,60,.02);tone(2093,.3,"sine",.025*v,2093,n*.06)};
for(let r=0;r<6;r++){const o=SND["rev"+r];SND["rev"+r]=v=>{o(v);const st=[0,4,7,12,16,19,24];for(let i=0;i<2+r;i++)sq(523*Math.pow(2,st[i]/12),.08,.04*v,i*.08+.03)}}
const SDUR={dig:1.5,rift:1.7,mrise:.9,mwind:.45,claw:.35,mslam:.7,spit:.35,splat:.3,mdie:.6,cdie:1.1,thunder:1.8,elite:1,cstart:2.5,disc:.6,scratch:.35,buy:1,xp:.2,win:1.4,lose:1.3,dth:1.7,ghost:1.9,phase:.9,quest:1,lvl:1.2,pick:.5,coin:.7,go:.6,mk2:.8,mk3:.8,mk4:.8,mk5:.8,emote:.3};
// ----- guns: each gun is rendered with its own signature (name-seeded thump and crack tone), brass and action sounds -----
const FD={cannon:1.1,snip:1.2,shot:1.1,rail:1,coil:1,revolver:.9,plasma:.8,aether:.8};
function fireLayers(o,h,i){
const p=o.p*(i?1.03:.98);GF[o.f](1,p,o.x);
if(o.b){DL=.045;GF[o.f](.7,p*1.05,o.x);DL=0}
const sb=60+h%70,cr=1800+(h>>3)%2600;tone(sb,.06,"triangle",.08,sb*.5);nz(.03,.09,"bandpass",cr,0,cr*.6,2);
if(!/plasma|arc|rail|coil|pulse|storm|aether|laser/.test(o.f)){DL=.22+(h%9)/60;SND.shell(.9);DL=0}
if(o.f==="shot"){DL=.42;clk(520,1.1);tone(120,.05,"sine",.1,70);DL=.5;clk(300,1.2);DL=0}
if(o.f==="snip"||o.f==="revolver"){DL=.5;clk(900,.9);DL=.62;clk(620,1);DL=0}}
const gT=g=>Math.max(.5,Math.min(3.6,g.rl||1.5));
function gunBake(g,front){if(!SB.on||!g)return;const id=g.id||g.n,o=gunVoice(g),h=hashS(g.n),T=gT(g);
for(let i=0;i<2;i++)bq("f"+i+":"+id,FD[o.f]||.7,()=>fireLayers(o,h,i),{wet:.22},front);
bq("r:"+id,T+.5,()=>gunLive(g,"rl",1,T),{wet:.12},front);bq("d:"+id,.3,()=>gunLive(g,"dry",1),{wet:.05},front)}
function gunSnd(g,k,v,T){try{if(!g)return;v=v==null?1:v;const id=g.id||g.n;
if(k==="fire"){if(bplay(["f0:"+id,"f1:"+id],v,.97+Math.random()*.06))return}
else if(k==="rl"){const Tb=gT(g);if(bplay(["r:"+id],v,Math.max(.75,Math.min(1.4,Tb/Math.max(.5,T||Tb)))))return}
else if(bplay(["d:"+id],v,1))return;
gunBake(g,true);gunLive(g,k,v,T)}catch(e){}}
function knBake(k,front){if(!SB.on||!k)return;for(const m of["swing","throw","hit","stick"])for(let i=0;i<(m==="swing"||m==="hit"?2:1);i++)bq("n:"+k.n+":"+m+i,.7,()=>knLive(k,m,1),{wet:.07},front)}
function knSnd(k,m,v){try{if(!k)return;v=v==null?1:v;if(bplay(["n:"+k.n+":"+m+"0","n:"+k.n+":"+m+"1"],v,.96+Math.random()*.08))return;knBake(k,true);knLive(k,m,v)}catch(e){}}
function snd(k,vol,rate){try{const v=vol==null?1:vol,r=rate||1;if(bplay(["s:"+k],v,r))return;sndLive(k,vol,rate)}catch(e){}}
// ----- music: two looping tracks written in code (calm lobby pad, driving battle beat), faded in and out by view -----
function musLobby(){const bt=60/84,bar=bt*4,ch=[[110,165,220,261.63,329.63],[87.31,174.61,261.63,349.23,440],[130.81,196,261.63,329.63,392],[98,196,246.94,293.66,392]],ar=[[0,2,3,4,3,2,3,1],[0,2,4,3,2,3,4,2]];
ch.forEach((c,ci)=>{const t0=ci*2*bar;c.forEach((f,i)=>{note(f,t0,2*bar-.15,.022,"triangle",.9,i%2?6:-6);note(f*2,t0,2*bar-.2,.008,"sine",1.2)});note(c[0]/2,t0,2*bar-.1,.07,"sine",.06);
for(let b=0;b<2;b++)for(let s=0;s<8;s++){const n=c[ar[b][s]]*2,t=t0+b*bar+s*bt/2;note(n,t,.55,.03,"sine",.004);if(s%4===0)note(n*2,t,.4,.012,"triangle",.004)}})}
function musBattle(){const bt=60/126,N=16,bass=[55,55,65.41,55,49,55,73.42,55],arp=[220,261.63,329.63,261.63];
for(let b=0;b<N;b++){const t=b*bt;tone(150,.22,"sine",.2,42,t);if(b%2===1)nz(.14,.14,"bandpass",1800,t,900,1.2);
for(let h=0;h<2;h++)nz(.03,.045,"highpass",7500,t+h*bt/2);
for(let i=0;i<2;i++)note(bass[(b*2+i)%8]*(b>=8&&b<12?1.122:1),t+i*bt/2,.22,.09,"triangle",.005);
note(arp[b%4],t,.3,.012,"square",.004)}
note(110,0,N*bt-.2,.03,"triangle",1.5,-7);note(110,0,N*bt-.2,.03,"triangle",1.5,7)}
// boss and corrupted-wave themes
function musBoss(){const bt=60/150,N=32,rt=[41.2,41.2,43.65,41.2];
for(let b=0;b<N;b++){const t=b*bt,r=rt[(b>>3)%4];tone(140,.2,"sine",.26,38,t);if(b%2===1){nz(.16,.2,"bandpass",1700,t,800,1.2);tone(180,.1,"triangle",.08,100,t)}
for(let h=0;h<2;h++){nz(.03,.05,"highpass",7500,t+h*bt/2);note(r,t+h*bt/2,bt*.45,.12,"sawtooth",.003)}
if(b%4===0)nz(.38,.08,"highpass",5000,t,2500);if(b%8===7)for(let q=0;q<4;q++)tone(110-q*12,.14,"sine",.2,50,t+q*bt/4);
if(b%4===0){note(r*4,t,bt*1.5,.045,"sawtooth",.01);note(r*4*1.06,t,bt*1.5,.04,"sawtooth",.01,12)}}
note(82.4,0,N*bt-.2,.04,"sawtooth",1.8,-10);note(87.3,0,N*bt-.2,.025,"sawtooth",2.2,10)}
function musCorrupt(){const bt=60/90,N=32,rn=prng(666);
for(let b=0;b<N;b++){const t=b*bt;if(b%4===0){tone(70,.14,"sine",.3,36,t);tone(64,.16,"sine",.25,34,t+.34)}
if(b%2===1)nz(.3,.05,"bandpass",600+rn()*1200,t,200,3)}
for(let i=0;i<26;i++){const t=rn()*N*bt,f=1500+rn()*2400;tone(f,.04+rn()*.06,"square",.018,f*(rn()<.5?.5:1.5),t)}
for(let c=0;c<4;c++){note(55,c*8*bt,8*bt,.05,"sawtooth",2.5,-14);note(77.8,c*8*bt,8*bt,.04,"sawtooth",2.5,14);note(110,c*8*bt,8*bt,.015,"triangle",3,0)}
for(let c=0;c<2;c++)tone(200,3.4,"sawtooth",.02,1900,c*16*bt)}
// ----- composed songs: every disc is a style (its instruments and drum groove) plus a key, a scale and a chord loop. The lead is written bar by bar from short motifs that follow the chords, so the tune repeats, answers itself and lands on chord tones. Home mixes are 8 bars and relaxed, match mixes are 16 bars with a verse, a build and a chorus -----
const SCL={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10]};
function prng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let x=Math.imul(s^s>>>15,1|s);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296}}
// k/s/c/h = kick, snare, clap and hat steps over one 16th-note bar (x closed, o open); kk/sk = kick and snare sound; the rest picks the bass, pad, chord, arpeggio and lead instruments
const SGS={
synthwave:{k:"x...x...x...x...",s:"....x.......x...",c:"....x.......x...",h:"x.o.x.o.x.o.x.o.",kk:"punch",bass:"off8",pad:"saw",arp:"pl",lead:"saw"},
chill:{k:"x.......x.x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",kk:"soft",bass:"root",pad:"saw",arp:"pl",lead:"flute",hd:1},
lofi:{k:"x.....x...x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",kk:"soft",bass:"walk",pad:"none",cp:[0,7,10],ch:"ep",lead:"ep",sev:1,sw:.3,hd:1,vinyl:1},
chip:{k:"x...x..xx...x...",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",kk:"chip",sk:"chip",bass:"pulse",pad:"none",arp:"sq",lead:"sq"},
metal:{k:"x.xxx.x.x.xxx.x.",s:"....x.......x...",h:"",kk:"metal",bass:"power",pad:"none",chug:1,lead:"gtr",cr:1},
orch:{k:"",s:"",h:"",tp:[0,8],bass:"root",pad:"str",lead:"brass",nd:1,hit:1},
edm:{k:"x...x...x...x...",s:"",c:"....x.......x...",h:"..o...o...o...o.",kk:"punch",bass:"off8",pad:"saw",duck:1,arp:"pl",lead:"saw"},
trap:{k:"x..x..x...x.....",s:"........x.......",h:"xxxxxxxxxxxxxxxx",kk:"808",bass:"808",pad:"sine",lead:"bell",roll:1},
funk:{k:"x..x..x.x..x....",s:"....x..x.x..x...",h:"x.xxx.xxx.xxx.xx",kk:"punch",bass:"funk",pad:"none",cp:[2,3,6,10,11,14],ch:"chop",lead:"brass"},
rock:{k:"x...x..xx.x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",kk:"punch",bass:"eighth",pad:"none",cp:[0,6,8,12],ch:"power",lead:"gtr",cr:1},
dnb:{k:"x.........x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",kk:"punch",bass:"reese",pad:"saw",arp:"pl",lead:"pl"},
house:{k:"x...x...x...x...",s:"",c:"....x.......x...",h:"..o...o...o...o.",kk:"punch",bass:"off8",pad:"none",cp:[2,6,10,14],ch:"stab",lead:"pl",duck:1},
jazz:{k:"x.......x.......",s:"....x.......x...",h:"x..xx..xx..xx..x",kk:"soft",bass:"walk",pad:"none",cp:[0,6,10],ch:"ep",lead:"flute",sev:1,sw:.33,hd:1},
ambient:{k:"",s:"",h:"",bass:"root",pad:"saw",arp:"bell",lead:"bell",nd:1},
orient:{k:"x..x..x...x.x...",s:"..x...x.x.....x.",h:"x.x.x.x.x.x.x.x.",kk:"soft",bass:"eighth",pad:"sine",arp:"pl",lead:"pl"},
march:{k:"x.......x.......",s:"x.x.x.x.x.x.x.x.",h:"",kk:"punch",sk:"tight",bass:"eighth",pad:"str",lead:"brass",hit:1},
techno:{k:"x...x...x...x...",s:"",c:"........x.......",h:"..o...o...o...o.",kk:"punch",bass:"off8",pad:"none",arp:"pl",lead:"pl",duck:1},
cine:{k:"x.......x.x.....",s:"........x.......",h:"",tp:[0,8],kk:"metal",bass:"power",pad:"str",lead:"brass",hit:1,cr:1}};
const ONE=s=>{const o=[];for(let i=0;i<s.length;i++)if(s[i]!==".")o.push([i,s[i]]);return o};
function songMix(d,bat){
const a=actx(),T0=a.currentTime+DL,bpm=bat?d.bb:d.bl,bt=60/bpm,s16=bt/4,bar=bt*4,BARS=bat?16:8,SC=SCL[d.sc]||SCL.min,rn=prng(hashS(d.n)+(bat?11:5)),S=SGS[d.st]||SGS.synthwave,g=d.g||1,sw=S.sw||0,P=d.prog,P2=d.p2||P;
const hz=(k,o)=>d.root*Math.pow(2,(SC[((k%7)+7)%7]+12*Math.floor(k/7))/12)*Math.pow(2,o||0);
// echo bus shared by the lead voices
const dly=a.createDelay(2),fb=a.createGain(),dlp=a.createBiquadFilter(),snd=a.createGain();dly.delayTime.value=bt*.75;fb.gain.value=.33;dlp.type="lowpass";dlp.frequency.value=2400;snd.connect(dly);dly.connect(dlp);dlp.connect(fb);fb.connect(dly);dlp.connect(MG);
// one filtered voice: waveform, lowpass (sweeping to c2), attack, release, detune, vibrato in cents, echo send, sidechain pump
const vc=(f,t,dur,v,o)=>{o=o||{};const os=a.createOscillator(),fl=a.createBiquadFilter(),gn=a.createGain(),t0=T0+t,at=Math.min(o.at||.01,dur*.6),rl=o.rl||.08;
os.type=o.w||"sawtooth";os.frequency.value=f;if(o.det)os.detune.value=o.det;fl.type="lowpass";fl.Q.value=o.q||.7;fl.frequency.setValueAtTime(o.c||2000,t0);if(o.c2)fl.frequency.exponentialRampToValueAtTime(o.c2,t0+dur);
gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(v,t0+at);if(o.dec){const e=Math.min(o.dec,dur-at);if(e>.02)gn.gain.exponentialRampToValueAtTime(Math.max(.0004,v*(o.sus==null?.3:o.sus)),t0+at+e)}
gn.gain.setTargetAtTime(.0001,t0+dur,rl/3);os.connect(fl);fl.connect(gn);let out=gn;
if(o.duck){const dk=a.createGain();dk.gain.setValueAtTime(1,t0);for(let q=Math.ceil((t0-T0)/bt-1e-6)*bt+T0;q<t0+dur;q+=bt){dk.gain.setValueAtTime(.3,q);dk.gain.linearRampToValueAtTime(1,q+bt*.7)}gn.connect(dk);out=dk}
out.connect(MG);if(o.echo){const sg=a.createGain();sg.gain.value=o.echo;out.connect(sg);sg.connect(snd)}
if(o.vib){const lf=a.createOscillator(),lg=a.createGain();lf.frequency.value=5.2;lg.gain.value=o.vib;lf.connect(lg);lg.connect(os.detune);lf.start(t0);lf.stop(t0+dur+rl*2)}
os.start(t0);os.stop(t0+dur+rl*2)};
const ev=(f,t,dd,v)=>{note(f,t,dd,v,"sine",.003);note(f*2,t,dd*.5,v*.28,"sine",.002);note(f*4.01,t,.12,v*.1,"sine",.001)};
const bell=(f,t,dd,v)=>{note(f,t,dd*2,v,"sine",.002);note(f*2.76,t,dd*.9,v*.35,"sine",.002);note(f*5.4,t,.25,v*.15,"sine",.001)};
const kick=(t,v)=>{const q=S.kk;if(q==="chip")tone(190,.12,"square",.085*v,45,t);else if(q==="metal"){tone(130,.1,"sine",.26*v,40,t);nz(.02,.1*v,"highpass",3000,t)}else if(q==="808")tone(120,.8,"sine",.36*v,38,t);else if(q==="punch"){tone(165,.2,"sine",.3*v,40,t);nz(.015,.1*v,"highpass",2500,t)}else tone(150,.22,"sine",.22*v,42,t)};
const snare=(t,v)=>{const q=S.sk||"std";if(q==="chip")nz(.09,.11*v,"highpass",3000,t);else if(q==="tight"){nz(.05,.14*v,"bandpass",1700,t,1500,1.5);tone(210,.05,"triangle",.06*v,130,t)}else{nz(.15,.16*v,"bandpass",1900,t,900,1.2);tone(190,.08,"triangle",.07*v,110,t)}};
const clap=(t,v)=>{for(let i=0;i<3;i++)nz(.05,.1*v,"bandpass",1500,t+i*.012,1500,1.5);nz(.12,.07*v,"highpass",3000,t+.03)};
const hat=(t,v,o)=>nz(o?.12:.03,(o?.05:.04)*v,"highpass",7500,t);
// motifs: a rhythm for one bar and a contour in scale steps from the chord root; downbeats are pulled onto chord tones
const RH=[[0,3,6,8,10,12],[0,4,8,10,12,14],[0,2,4,8,12],[0,3,6,10,12,14],[0,6,8,12],[0,4,6,8,11,14],[0,2,4,6,8,12],[0,3,8,11,14]];
const tonal=c=>{let b=c;for(let i=0;i<4;i++){for(const x of[c-i,c+i]){const m=((x%7)+7)%7;if(m===0||m===2||m===4)return x}}return b};
const mk=dense=>{const rh=RH[(rn()*RH.length)|0].slice();if(dense&&rn()<.6)rh.splice(1+(rn()*(rh.length-1)|0),0,rh[0]+2);rh.sort((x,y)=>x-y);
let cur=[0,2,4][(rn()*3)|0];const cn=[];rh.forEach((st,i)=>{if(i)cur=clamp(cur+[-2,-1,-1,1,1,2,0,3,-3][(rn()*9)|0],-3,7);if(st%4===0)cur=tonal(cur);cn.push(cur)});return{rh,cn}};
const vr=(m,last)=>({rh:m.rh,cn:m.cn.map((c,i)=>i===m.cn.length-1?last:i===m.cn.length-2?c+[-1,1][(rn()*2)|0]:c)});
const MA=mk(0),MB=mk(0),MC=mk(1),MD=mk(1);
const VA=vr(MA,2),VA0=vr(MA,0),VB=vr(MB,2),VB0=vr(MB,0),VC=vr(MC,2),VD0=vr(MD,0),VD4=vr(MD,4);
const mel=b=>{const j=b%4;return b<4?[MA,VA,MB,VB0][j]:b<8?[MB,VB,MA,VA0][j]:[MC,VC,MD,b>=12?VD0:VD4][j]};
const leadPlay=(f,t,len,v)=>{const q=S.lead;
if(q==="saw"){vc(f,t,len,v,{w:"sawtooth",c:2800,at:.012,rl:.12,vib:10,echo:.45,det:6});vc(f,t,len,v*.7,{w:"sawtooth",c:2200,at:.012,rl:.12,det:-7})}
else if(q==="sq"){note(f,t,len,v,"square",.006);note(f*2,t,len,v*.25,"square",.006,4)}
else if(q==="pl")vc(f,t,Math.max(len,.28),v*1.3,{w:"sawtooth",c:3800,c2:700,dec:Math.max(len,.28)*.9,sus:.12,at:.004,rl:.1,echo:.55});
else if(q==="bell")bell(f,t,Math.max(len,.4),v);
else if(q==="flute"){vc(f,t,len*1.1,v*1.3,{w:"sine",c:4000,at:.06,rl:.15,vib:14,echo:.35});vc(f*2,t,len*1.1,v*.2,{w:"triangle",c:3000,at:.08,rl:.12,vib:14})}
else if(q==="brass")vc(f,t,len,v*1.2,{w:"sawtooth",c:1500,c2:3400,at:.07,rl:.12,vib:9,echo:.25,det:5});
else if(q==="gtr"){vc(f,t,len,v*1.1,{w:"sawtooth",c:3400,q:2,at:.004,rl:.1,vib:14,echo:.3,det:4});vc(f/2,t,len,v*.5,{w:"square",c:1600,at:.004,rl:.08})}
else ev(f,t,Math.max(len,.4),v*1.3)};
const kS=ONE(S.k||""),sS=ONE(S.s||""),cS=ONE(S.c||""),hS=ONE(S.h||"");
for(let b=0;b<BARS;b++){
const t0=b*bar,kk=((b<BARS/2||!bat)?P:P2)[b%P.length]%7,chorus=bat&&b>=8,ch=[kk,kk+2,kk+4].concat(S.sev?[kk+6]:[]),hv=bat?1:.55,pv=(bat?.012:.02)*g;
// pad
if(S.pad==="saw")ch.forEach((c,i)=>{vc(hz(c,2),t0,bar+.1,pv*1.6,{w:"sawtooth",c:1100,c2:2000,at:.4,rl:.4,det:i*7-7,duck:S.duck});vc(hz(c,2),t0,bar+.1,pv*1.2,{w:"sawtooth",c:900,at:.4,rl:.4,det:i*7+8,duck:S.duck})});
else if(S.pad==="str")ch.forEach((c,i)=>{for(const dt of[-10,0,10])vc(hz(c,2),t0,bar+.05,pv*.9,{w:"sawtooth",c:1700,at:.55,rl:.5,det:dt+i,vib:6})});
else if(S.pad==="sine")ch.forEach((c,i)=>note(hz(c,2),t0,bar,pv*1.4,"sine",.5,i*4-4));
// chord hits
if(S.cp&&S.ch)S.cp.forEach(i=>{const tt=t0+i*s16+(i%2&&sw?sw*s16:0);ch.forEach((c,n)=>{const f=hz(c,2);if(S.ch==="ep")ev(f,tt,bt*1.4,.05*g*hv);else if(S.ch==="stab")vc(f,tt,s16*2.2,.034*g,{w:"square",c:1800,c2:600,at:.004,rl:.05,dec:s16*2,sus:.2});else if(S.ch==="chop")vc(f,tt,s16*1.3,.032*g,{w:"square",c:2200,c2:700,at:.003,rl:.03});else vc(f/(n?1:2),tt,s16*3.4,.04*g,{w:"sawtooth",c:1700,at:.004,rl:.06,q:1.5})})});
// metal chugs
if(S.chug&&bat)ONE(S.k).forEach(([i])=>{const tt=t0+i*s16;vc(hz(kk,1),tt,s16*.85,.07*g,{w:"sawtooth",c:1300,at:.003,rl:.02});vc(hz(kk+4,1),tt,s16*.85,.05*g,{w:"sawtooth",c:1300,at:.003,rl:.02})});
// bass
const bv=(bat?1:.75)*g,r=hz(kk,0),r2=hz(kk,1);
if(S.bass==="root"){note(r,t0,bar-.08,.12*bv,"sine",.03);note(r2,t0,bar-.1,.035*bv,"triangle",.05)}
else if(S.bass==="off8")for(let i=0;i<4;i++){const tt=t0+i*bt+bt/2;vc(r,tt,bt*.46,.12*bv,{w:"sawtooth",c:750,c2:260,at:.004,rl:.05});note(r,tt,bt*.46,.07*bv,"sine",.004)}
else if(S.bass==="eighth")for(let i=0;i<8;i++){const f=i%4===3?r2:r;note(f,t0+i*bt/2,bt*.42,.09*bv,"triangle",.004);note(f,t0+i*bt/2,bt*.42,.06*bv,"sine",.004)}
else if(S.bass==="walk")[r,hz(kk+2,0),hz(kk+4,0),hz(kk+3,0)].forEach((f,i)=>{const tt=t0+i*bt+(i%2?sw*bt*.5:0);note(f,tt,bt*.85,.14*bv,"sine",.01);note(f*2,tt,bt*.4,.03*bv,"triangle",.01)});
else if(S.bass==="pulse")for(let i=0;i<16;i++)note(i%4===3?r2:r,t0+i*s16,s16*.8,.065*bv,"square",.003);
else if(S.bass==="808")[0,6,10].forEach(i=>{const tt=t0+i*s16;tone(r,bt*1.2,"sine",.34*bv,r*.72,tt);tone(r*2,.2,"triangle",.05*bv,r*1.4,tt)});
else if(S.bass==="reese"){for(const dt of[-14,0,14])vc(r2,t0,bar-.04,.07*bv,{w:"sawtooth",c:360,c2:950,at:.02,det:dt,q:3});note(r,t0,bar-.04,.1*bv,"sine",.02)}
else if(S.bass==="funk")[0,3,6,8,10,13].forEach(i=>vc(i===6||i===13?r2:r,t0+i*s16,s16*1.5,.11*bv,{w:"square",c:950,c2:340,at:.003,rl:.03}));
else if(S.bass==="power")for(let i=0;i<(bat?8:4);i++){const tt=t0+i*(bat?bt/2:bt),dd=bat?bt*.45:bt*.9;vc(r*2,tt,dd,.08*bv,{w:"sawtooth",c:1500,at:.004,rl:.04});vc(hz(kk+4,1),tt,dd,.05*bv,{w:"sawtooth",c:1500,at:.004,rl:.04});note(r,tt,dd,.07*bv,"sine",.004)}
// drums: the full kit in a match, a quiet backbone at home
if(!S.nd||bat){
if(bat||S.hd){kS.forEach(([i])=>{if(bat||i%8===0)kick(t0+i*s16,bat?1:.5)});
if(bat){sS.forEach(([i])=>snare(t0+i*s16+(i%2&&sw?sw*s16:0),.9));cS.forEach(([i])=>clap(t0+i*s16,.9));if(S.cr&&b%4===0)nz(.38,.08,"highpass",5000,t0,2500)}
hS.forEach(([i,c],n)=>{if(bat||i%4===0){const sh=i%2&&sw?sw*s16:0;hat(t0+i*s16+sh,(n%2?.7:1)*(bat?1:.55),c==="o")}})}
if(S.tp)S.tp.forEach(i=>{if(bat||i===0){tone(100,.5,"sine",.26*hv,55,t0+i*s16);nz(.06,.08*hv,"lowpass",800,t0+i*s16)}});
if(bat&&S.roll&&b%2===1)for(let q=12;q<16;q++)hat(t0+q*s16+s16/2,.6,0);
if(bat&&b%4===3){for(let q=12;q<16;q++){if(S.s||S.c)snare(t0+q*s16,.5+.1*(q-12))}}
if(bat&&(b===8||b===0)&&!S.nd)nz(.38,.09,"highpass",5000,t0,2500);
if(bat&&S.hit&&b%4===0){vc(hz(kk,1),t0,bt*1.5,.07*g,{w:"sawtooth",c:1500,at:.01,rl:.3});vc(hz(kk+4,1),t0,bt*1.5,.05*g,{w:"sawtooth",c:1500,at:.01,rl:.3});tone(70,.7,"sine",.3,40,t0)}}
// arpeggio
if(S.arp&&(bat||b%2===0)){const tn=[kk,kk+2,kk+4,kk+7],seq=[0,1,2,3,2,1],av=(bat?.03:.018)*g;for(let i=0;i<16;i++){const f=hz(tn[seq[i%6]],2),tt=t0+i*s16+(i%2&&sw?sw*s16:0);if(S.arp==="sq")note(f,tt,s16*.85,av*.9,"square",.004);else if(S.arp==="bell")bell(f,tt,.35,av*1.2);else vc(f,tt,s16*1.6,av*1.4,{w:"sawtooth",c:2400,c2:600,at:.003,rl:.04,dec:s16*1.4,sus:.2,echo:.3})}}
// lead melody
if(S.lead&&(bat||b%4>=2)){const m=mel(b),lo=chorus?5:0,sc=bat?1:.7;m.rh.forEach((st,i)=>{let a2=kk+m.cn[i]+lo;while(a2>11)a2-=7;while(a2<0)a2+=7;const nx=i+1<m.rh.length?m.rh[i+1]:16,len=Math.max(.1,(nx-st)*s16*(bat?.92:1.5));leadPlay(hz(a2,2),t0+st*s16+(st%2&&sw?sw*s16:0),len,(chorus?.04:.032)*g*sc)})}
// ambient shimmer
if(S.vinyl&&b%2===0)for(let q=0;q<10;q++)nz(.012,.012,"highpass",3000+rn()*3000,rn()*bar*2+t0)}}
// bake settings per disc: 8 bars at the disc's tempo
const discDur=(d,bat)=>(bat?16:8)*4*60/(bat?d.bb:d.bl);
const STDM={lobby:[60/84*32,musLobby,.15],battle:[60/126*16,musBattle,.1],boss:[60/150*32,musBoss,.1],corrupt:[60/90*32,musCorrupt,.2]};
setInterval(()=>{try{Mus.guard()}catch(e){}},700);
const MB={lobby:.55,battle:.4,boss:.42,corrupt:.5},RT={lobby:.045,battle:.07,boss:.075,corrupt:.06}; // base volume and the loudness each kind is levelled to
const Mus={want:"lobby",prev:null,pl:null,
set(n){this.prev=null;this.want=n;this.stamp=performance.now();this.go()},
view(v){const g=v===""||v==="ps"||v==="end";if(!g)this.set("lobby");else if(!["battle","boss","corrupt"].includes(this.want))this.set("battle")},
// watchdog: only the current track may ever sound. Anything else that is still playing after a switch is stopped.
// watchdog: exactly one music track may ever sound. Anything else is stopped, and the right track is retried until the audio engine is unlocked.
guard(){if(!SB.on||this.busy)return;const cur=this.pl;this.killOthers(cur&&cur.h);try{if(cur&&cur.h){(cur.h._sounds||[]).forEach(s=>{if(s._id!==cur.id)cur.h.stop(s._id)})}}catch(e){}
const pl=document.body.classList.contains("playing");if(pl&&!["battle","boss","corrupt"].includes(this.want))this.set("battle");else if(!pl&&(view==="lobby"||view==="pg")&&this.want!=="lobby")this.set("lobby");else this.go()},
killOthers(keep){for(const k in SB.h){if(k.slice(0,2)!=="m:")continue;const x=SB.h[k];if(x&&x.h&&x.h!==keep){try{x.h.stop()}catch(e){}}}},
resolve(n){if(this.prev)return this.prev.id+":"+this.prev.kind;if(n==="boss"||n==="corrupt")return n;const d=I(S[n==="lobby"?"mh":"mm"]);return d&&d.id!=="u0"?d.id+":"+n:n},
ensure(key){const kk="m:"+key;if(SB.h[kk]||SB.pend[kk]||!SB.on)return;const p=key.split(":");
if(p.length===1){const s=STDM[key];if(s)bq(kk,s[0],s[1],{wet:s[2],loop:1},true)}
else{const d=I(p[0]),bat=p[1]==="battle";if(d)bq(kk,discDur(d,bat),()=>songMix(d,bat),{wet:bat?.1:.18,loop:1},true)}},
vol(key){const kd=key.split(":").pop(),st=SB.stat["m:"+key],k=st&&st[1]>.002?clamp(RT[kd]/st[1],.2,2.4):1;return S.mvol*MB[kd]*k},
go(){if(!SB.on||this.busy)return;const key=this.resolve(this.want),on=key&&S.mvol>0,p=this.pl;
if(p&&(!on||p.n!==key)){ // fade the old song out completely, only then may the next one start
this.pl=null;this.busy=true;try{p.h.fade(p.h.volume(p.id),0,450,p.id)}catch(e){}
setTimeout(()=>{try{p.h.stop()}catch(e){}this.busy=false;this.go()},500);return}
if(!on)return;
if(this.pl){try{this.pl.h.volume(this.vol(key),this.pl.id)}catch(e){}return}
const x=SB.h["m:"+key];if(!x||!x.ok){this.ensure(key);return}
if(!(window.Howler&&Howler.ctx&&Howler.ctx.state==="running"))return; // never queue a play while the browser has audio locked: queued plays are what stack up
this.killOthers(null);try{x.h.stop()}catch(e){}
const id=x.h.play();x.h.volume(0,id);x.h.fade(0,this.vol(key),1200,id);this.pl={n:key,h:x.h,id}}};
// ----- game-side helpers -----
let hbT=0,ksN=0,ksT=0,hvT=0,hvL=null;
function lowHp(){const n=performance.now();if(n>hbT){hbT=n+420+P.hp*20;snd("beat",.9)}}
function streakSnd(){const n=performance.now();ksN=n-ksT<4000?ksN+1:1;ksT=n;if(ksN>=2)setTimeout(()=>snd("mk"+Math.min(ksN,5)),120)}
function primeSnd(){ // queue everything, most useful first: UI and combat sounds, the equipped gun and knife, then the rest, then the music
if(!SB.on)return;const fx={ui:[.25],hover:[.15],tab:[.2],pick:[.4],win:[.9],lose:[1],dth:[1.7],kill:[.5],head:[.5],hit:[.3],hurt:[.4],sh:[.5],rl:[.6],jump:[.3],djump:[.3],land:[.3],step:[.15],tick:[.15],go:[.45],emote:[.35],chest:[.9],lvl:[.9],quest:[.9],coin:[.6],pour:[.7],beat:[.4],boom:[.9],slam:[.7],roar:[1.1],growl:[.6],horn:[.9],clear:[1],err:[.4],equip:[.4],swap:[.35],whoosh:[.4],open:[.35],shut:[.3],ammo:[.35],heal:[.45],spd:[.45],spawn:[.7],rico:[.35],shell:[.3],mk2:[.4],mk3:[.5],mk4:[.6],mk5:[.7],rev0:[.7],rev1:[.8],rev2:[1],rev3:[1.2],rev4:[1.5],rev5:[1.8]};
for(const k in SND){const d=SDUR[k]||(fx[k]?fx[k][0]:.7);bq("s:"+k,d,()=>SND[k](1,1),{wet:/^(ui|hover|tab|step|tick|jump|djump|land)$/.test(k)?0:.12})}
try{gunBake(I(eq().g)||G[0],true);knBake(curKn(),true)}catch(e){}
setTimeout(()=>{try{G.forEach(g=>gunBake(g));KN.forEach(k=>knBake(k))}catch(e){}},3500);
bq("m:lobby",60/84*32,musLobby,{wet:.15,loop:1});bq("m:battle",60/126*16,musBattle,{wet:.1,loop:1});
setTimeout(()=>{try{Mus.ensure(Mus.resolve("lobby"));Mus.ensure(Mus.resolve("battle"));Mus.ensure("boss");Mus.ensure("corrupt")}catch(e){}},2500)}
document.addEventListener("pointerover",e=>{const t=e.target.closest&&e.target.closest("button,.mode,.slot,.th,.puc,[data-a]");if(!t||t===hvL)return;hvL=t;const n=performance.now();if(n-hvT<70||(view===""&&!menuOpen))return;hvT=n;snd("hover",.7)},true);
let rangeK=-1; // the knife being inspected in the shooting range (-1 = the equipped one)
const curKn=()=>mode==="range"&&rangeK>=0&&KN[rangeK]?KN[rangeK]:I(eq().k)||KN[0];

// ---------- particles and tracers ----------
const Fx=(()=>{
const MAX=260,im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial(),MAX);
im.frustumCulled=false;im.instanceMatrix.setUsage(T.DynamicDrawUsage);
const pr=[],m4=new T.Matrix4(),q=new T.Quaternion(),v3=new T.Vector3(),s3=new T.Vector3(),cl=new T.Color(),zero=new T.Matrix4().makeScale(0,0,0);
for(let i=0;i<MAX;i++){pr.push({l:0,m:.9,x:0,y:0,z:0,vx:0,vy:0,vz:0,s:.1,g:14});im.setMatrixAt(i,zero);im.setColorAt(i,cl.setHex(0xffffff))}
sc.add(im);let cur=0;
function burst(p,col,n,spd,size,up,grav){
for(let i=0,nn=Math.max(2,Math.round((n||14)*LOD.fx));i<nn;i++){const o=pr[cur=(cur+1)%MAX],a=rnd()*6.283,e=rnd()*2-.4,sp=(spd||5)*(.3+rnd()*.7);
o.x=p.x;o.y=p.y;o.z=p.z;o.vx=Math.cos(a)*sp*(1-Math.abs(e)*.3);o.vz=Math.sin(a)*sp*(1-Math.abs(e)*.3);o.vy=e*sp+(up||0);
o.l=o.m=.5+rnd()*.5;o.s=(size||.1)*(.6+rnd()*.8);o.g=grav==null?14:grav;im.setColorAt(cur,cl.setHex(col==null?(rnd()*0xffffff|0):col))}
if(im.instanceColor)im.instanceColor.needsUpdate=true}
function step(dt){
for(let i=0;i<MAX;i++){const o=pr[i];if(o.l<=0)continue;o.l-=dt;
if(o.l<=0){im.setMatrixAt(i,zero);continue}
o.vy-=o.g*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;if(o.y<.03){o.y=.03;o.vy*=-.3;o.vx*=.6;o.vz*=.6}
const k=o.s*Math.min(1,o.l/o.m*2);v3.set(o.x,o.y,o.z);s3.set(k,k,k);im.setMatrixAt(i,m4.compose(v3,q,s3))}
im.instanceMatrix.needsUpdate=true}
// tracers
const TR=[],tg=new T.BoxGeometry(1,1,1);let tc=0;
for(let i=0;i<28;i++){const m=new T.Mesh(tg,new T.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));m.visible=false;m.frustumCulled=false;m.raycast=()=>{};sc.add(m);TR.push({m,l:0})}
const a3=new T.Vector3();
function tracer(a,b,col,w,life){const o=TR[tc=(tc+1)%TR.length],m=o.m,len=a.distanceTo(b);if(len<.3)return;
m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);const t=w||.022;m.scale.set(t,t,len);m.material.color.setHex(col||0xffe9a0);m.material.opacity=.9;m.visible=true;o.l=o.ml=life||.09}
function tracers(dt){for(const o of TR){if(o.l<=0)continue;o.l-=dt;if(o.l<=0){o.m.visible=false;continue}o.m.material.opacity=o.l/(o.ml||.09)*.9}}
return{burst,step,tracer,tracers,clear(){for(const o of pr)o.l=0;im.instanceMatrix.needsUpdate=true;TR.forEach(o=>{o.l=0;o.m.visible=false});try{Gfx.clear()}catch(e){}}}})();
// ---------- combat graphics: muzzle and impact flares, shock rings, glowing ground cracks, lightning, spawn portals, claw slashes ----------
const Gfx=(()=>{
const FL=[],RG=[],TF=[];let ready=false,fi=0,ri=0,crG=null;
function init(){if(ready)return;ready=true;
for(let i=0;i<32;i++){const s=new T.Sprite(new T.SpriteMaterial({map:SOFTDOT,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false,opacity:0}));s.visible=false;s.raycast=()=>{};s.frustumCulled=false;sc.add(s);FL.push({s,l:0,m:1,z:1,vy:0})}
const rg=new T.RingGeometry(.86,1,44);
for(let i=0;i<18;i++){const m=new T.Mesh(rg,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,fog:false}));m.rotation.x=-Math.PI/2;m.visible=false;m.raycast=()=>{};m.frustumCulled=false;sc.add(m);RG.push({m,l:0,mx:1,r0:1,r1:2,op:1})}
crG=new T.BoxGeometry(1,.02,1)}
function flare(p,col,size,life,vy){if(LOD.fx<.2)return;init();const o=FL[fi=(fi+1)%FL.length];o.s.position.set(p.x,p.y,p.z);o.s.material.color.setHex(col);o.z=size;o.l=o.m=life;o.vy=vy||0;o.s.visible=true;o.s.scale.set(size,size,1)}
function ring(x,y,z,col,r0,r1,life,op){if(LOD.fx<.2)return;init();const o=RG[ri=(ri+1)%RG.length];o.m.position.set(x,y,z);o.m.material.color.setHex(col);o.r0=r0;o.r1=r1;o.l=o.mx=life;o.op=op==null?.7:op;o.m.visible=true;o.m.scale.set(r0,r0,1)}
function drop(o){sc.remove(o.o);o.o.traverse(c=>{if(c.geometry&&!c.userData.shared)c.geometry.dispose();if(c.material)c.material.dispose()})}
function add(o){if(TF.length>44)drop(TF.shift());TF.push(o)}
function crack(x,z,col,life,n){if(LOD.fx<.2)return;init();n=n||6;const gr=new T.Group(),mats=[];gr.position.set(x,.06,z);
for(let i=0;i<n;i++){const L=1.1+rnd()*1.6,a=i/n*6.283+rnd()*.5,m=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,fog:false}),b=new T.Mesh(crG,m);
b.userData.shared=1;b.scale.set(.07+rnd()*.06,1,L);b.position.set(Math.cos(a)*L/2,0,Math.sin(a)*L/2);b.rotation.y=Math.PI/2-a;b.raycast=()=>{};gr.add(b);mats.push(m)}
sc.add(gr);add({o:gr,l:life,m:life,k:"crack",mats})}
function column(x,z,col,h,life){if(LOD.fx<.2)return;const m=new T.Mesh(new T.CylinderGeometry(.45,.95,h,14,1,true),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,fog:false}));
m.position.set(x,h/2,z);m.raycast=()=>{};sc.add(m);add({o:m,l:life,m:life,k:"col"})}
function bolt(x,z,col,quiet){if(LOD.fx<.2)return;init();const pts=[],top=44+rnd()*10,cx=x+(rnd()-.5)*10,cz=z+(rnd()-.5)*10,N=14;
for(let i=0;i<=N;i++){const k=i/N,j=i===N?0:1;pts.push(cx+(x-cx)*k+j*(rnd()-.5)*3.4*(1-k*.4),top*(1-k),cz+(z-cz)*k+j*(rnd()-.5)*3.4*(1-k*.4))}
for(let j=0;j<3;j++){const arr=pts.slice();if(j)for(let i=0;i<arr.length;i+=3){arr[i]+=(rnd()-.5)*.3;arr[i+2]+=(rnd()-.5)*.3}
const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(arr,3));
const ln=new T.Line(geo,new T.LineBasicMaterial({color:j?0xffffff:col,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,fog:false}));ln.frustumCulled=false;ln.raycast=()=>{};sc.add(ln);add({o:ln,l:.34,m:.34,k:"bolt"})}
flare({x,y:.8,z},col,7,.3);ring(x,.12,z,col,.4,6,.4,.9);Fx.burst({x,y:.3,z},col,12,8,.08,4,16);
const d=Math.hypot(x-P.x,z-P.z);if(!quiet){snd("thunder",clamp(1.1-d/70,.2,1));if(d<28){flashScreen("#a855f7");document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),220)}}}
function slash(x,y,z,ry,col,s){if(LOD.fx<.2)return;s=s||1;const rx=Math.cos(ry),rz=-Math.sin(ry);
for(let c=-1;c<=1;c++){const arr=[];for(let i=0;i<=8;i++){const u=i/8-.5,lat=u*1.5*s+c*.2*s,vy=-u*1.2*s+Math.sin(u*3.1)*.12*s;arr.push(x+rx*lat,y+vy,z+rz*lat)}
const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(arr,3));
const ln=new T.Line(geo,new T.LineBasicMaterial({color:c?col:0xffffff,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false,fog:false}));ln.frustumCulled=false;ln.raycast=()=>{};sc.add(ln);add({o:ln,l:.22,m:.22,k:"slash"})}
flare({x,y,z},col,2.4*s,.16)}
function splat(p,col){flare(p,col,1.5,.2);ring(p.x,Math.max(.1,p.y),p.z,col,.1,1,.25,.6);Fx.burst(p,col,7,3.5,.07,1.5,12);snd("splat",clamp(1-Math.hypot(p.x-P.x,p.z-P.z)/40,.15,.6))}
function impact(p,gc,g,mini){if(LOD.fx<.3)return;flare(p,gc.col,mini?.4:.8+(g.glow||g.coil?.5:0),.09);Fx.burst(p,gc.col,mini?2:5,mini?3:4.5,.04,1.5,14);
if(!mini&&LOD.fx>.5)Fx.burst(p,0x8a8f98,2,1.1,.17,.7,-1.5)}
function step(dt){
for(const o of FL){if(o.l<=0)continue;o.l-=dt;if(o.l<=0){o.s.visible=false;continue}const k=o.l/o.m;o.s.material.opacity=Math.min(1,k*1.4);o.s.scale.setScalar(o.z*(1+(1-k)*.5));if(o.vy)o.s.position.y+=o.vy*dt}
for(const o of RG){if(o.l<=0)continue;o.l-=dt;if(o.l<=0){o.m.visible=false;continue}const k=1-o.l/o.mx,r=o.r0+(o.r1-o.r0)*(1-Math.pow(1-k,2));o.m.scale.set(r,r,1);o.m.material.opacity=(1-k)*o.op}
for(let i=TF.length-1;i>=0;i--){const o=TF[i];o.l-=dt;if(o.l<=0){drop(o);TF.splice(i,1);continue}const k=o.l/o.m;
if(o.k==="crack"){const op=k>.85?1:Math.min(1,k*1.3)*(.75+.25*Math.sin(o.l*18));for(const m of o.mats)m.opacity=op}
else if(o.k==="col"){o.o.material.opacity=.65*k;o.o.scale.set(1+(1-k)*.4,1,1+(1-k)*.4)}
else if(o.k==="bolt")o.o.material.opacity=(Math.random()<.45?1:.35)*Math.min(1,k*2);
else o.o.material.opacity=k}}
function clear(){for(const o of FL){o.l=0;if(o.s)o.s.visible=false}for(const o of RG){o.l=0;o.m.visible=false}for(const o of TF)drop(o);TF.length=0}
return{flare,ring,crack,column,bolt,slash,splat,impact,step,clear}})();
const SPC={};const spm=c=>SPC[c]||(SPC[c]=new T.MeshBasicMaterial({color:c}));
const gunCol=g=>g.coil?{col:0xa5d8ff,life:.16}:g.glow?{col:g.r>=5?0xf0abfc:0x67e8f9,life:.12}:g.multi?{col:0xffa24a,life:.1}:g.scope&&g.d>=100?{col:0xfff1b0,life:.16}:g.pel>1?{col:0xffd070,life:.08}:{col:0xffe9a0,life:.09};
function spawnFx(x,z,corr){ // the ground splits, light leaks out, and (corrupted) a violet rift opens above the spot
const col=corr?0xb050ff:0xff9a3c;
Gfx.crack(x,z,col,1.9,corr?9:6);Gfx.ring(x,.1,z,col,.4,corr?4.4:3,.9,.8);setTimeout(()=>{try{Gfx.ring(x,.1,z,col,.3,2.4,.7,.6)}catch(e){}},260);
Fx.burst({x,y:.2,z},corr?0x6a1a8a:0x5a4632,corr?14:10,3,.1,3,12);
if(corr){Gfx.column(x,z,0xc060ff,16,1.3);Gfx.flare({x,y:.6,z},0xe0a0ff,5,.9,.6);if(rnd()<.5)Gfx.bolt(x+(rnd()-.5)*3,z+(rnd()-.5)*3,0xd9a0ff,true)}
snd(corr?"rift":"dig",clamp(1.1-Math.hypot(x-P.x,z-P.z)/60,.2,.9))}
function emergeDone(e){const p=e.g.position;Gfx.ring(p.x,.12,p.z,e.corr?0xb050ff:0xc8a070,.3,2.2,.45,.6);Fx.burst({x:p.x,y:.3,z:p.z},0x5a4632,12,3.5,.1,3,12);
snd("mrise",clamp(1-Math.hypot(P.x-p.x,P.z-p.z)/50,.15,.8));if(e.elite){Gfx.flare({x:p.x,y:1.2,z:p.z},0xffc233,5,.5);snd("elite",.7)}}
function monWind(e){const g=e.g,p=g.position,col=e.corr?0xc060ff:0xff4a3a;Gfx.flare({x:p.x,y:2.1*(g.scale.y||1),z:p.z},col,1.8,.32);Gfx.ring(p.x,.1,p.z,col,.3,1.7,.3,.6);snd("mwind",clamp(1-Math.hypot(P.x-p.x,P.z-p.z)/30,.1,.7))}
function clawScreen(corr){const d=document.createElement("div");d.className="claw"+(corr?" cc":"");d.innerHTML="<i></i><i></i><i></i>";document.body.appendChild(d);setTimeout(()=>d.remove(),520)}
function monStrike(e){const g=e.g,p=g.position,u=g.userData,d=Math.hypot(P.x-p.x,P.z-p.z),big=e.k===2||e.k===4,col=e.corr?0xd08cff:0xff5a4a,fx=Math.sin(g.rotation.y),fz=Math.cos(g.rotation.y);u.kick=1;
Gfx.slash(p.x+fx*1.1,1.3,p.z+fz*1.1,g.rotation.y,col,big?1.5:1);snd(big?"mslam":"claw",.85);
if(big){Gfx.ring(p.x+fx*1.6,.12,p.z+fz*1.6,col,.3,3.4,.45,.8);Fx.burst({x:p.x+fx*1.6,y:.2,z:p.z+fz*1.6},0x5a4632,10,4,.1,3,12);if(d<6){document.body.classList.add("shk");setTimeout(()=>document.body.classList.remove("shk"),160)}}
if(e.corr)Gfx.flare({x:p.x,y:1.3,z:p.z},0xc060ff,2.6,.2);
if(d<(big?2.7:2.35)&&los(p.x,1.2,p.z,P.x,P.y+1.2,P.z)){hit(e.dmg,p);if(P.dead<=0)clawScreen(e.corr)}}
function monDeathFx(e){const q=e.g.position,c=e.corr?0xc060ff:0x9dff6a;Gfx.flare({x:q.x,y:q.y+1.1,z:q.z},c,e.boss?8:3.4,.3);Gfx.ring(q.x,.12,q.z,e.corr?0xb050ff:0x66ff44,.4,e.boss?7:2.6,.5,.7);
if(e.corr)Fx.burst({x:q.x,y:q.y+1,z:q.z},0xb050ff,14,6,.1,3,16);snd(e.corr?"cdie":"mdie",clamp(1-Math.hypot(P.x-q.x,P.z-q.z)/45,.15,.7))}


// ---------- hud helpers ----------
const flash=(t,ms)=>{const m=$("msg");m.textContent=t;m.classList.remove("pop");void m.offsetWidth;m.classList.add("pop");clearTimeout(flash.t);flash.t=setTimeout(()=>{m.textContent="";m.classList.remove("pop")},ms||1600)};
let hmT=0,dmgT=0;
const hitMark=head=>{const h=$("hm");h.classList.toggle("hd",!!head);h.style.opacity=1;clearTimeout(hmT);hmT=setTimeout(()=>h.style.opacity=0,110)};
const dmgFlash=()=>{const d=$("dmg");d.style.opacity=1;clearTimeout(dmgT);dmgT=setTimeout(()=>d.style.opacity=0,140)};
function toast(t,ms){const c=$("toasts"),d=document.createElement("div");d.className="toast";d.textContent=t;c.appendChild(d);setTimeout(()=>{d.classList.add("out");setTimeout(()=>d.remove(),400)},ms||2600);while(c.children.length>4)c.firstChild.remove()}
