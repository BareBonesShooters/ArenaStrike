"use strict";
// ---------- colour helpers ----------
const rgbOf=c=>[(c>>16)&255,(c>>8)&255,c&255];
const tint=(c,f)=>{const [r,g,b]=rgbOf(c),m=f>0?255:0,a=Math.abs(f);return`rgb(${Math.round(r+(m-r)*a)},${Math.round(g+(m-g)*a)},${Math.round(b+(m-b)*a)})`};

// ---------- gun skin textures ----------
const SKP={ // painters: (ctx, w, h, hexColor, rng)
dev(g,w,h,c,r){
g.fillStyle="#101827";g.fillRect(0,0,w,h);g.strokeStyle="#26364b";g.lineWidth=1;
for(let x=0;x<w;x+=16){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
g.fillStyle=tint(c,0);g.fillRect(0,8,w,5);g.fillRect(0,h-13,w,5);
g.fillStyle="#ffb16b";g.font="bold 36px monospace";g.textAlign="center";g.textBaseline="middle";g.fillText("<DEV/>",w/2,h/2);
g.fillStyle="#e2f7ff";g.fillRect(15,h/2-3,12,6);g.fillRect(w-27,h/2-3,12,6)},
metal(g,w,h,c,r){g.fillStyle=tint(c,-.08);g.fillRect(0,0,w,h);g.fillStyle=tint(c,.2);g.fillRect(0,0,w,h*.22);g.fillStyle="#e8d5a8";g.fillRect(0,h*.68,w,h*.12);g.fillStyle="#3d5853";g.fillRect(w*.73,0,w*.08,h);},
camo(g,w,h,c,r){g.fillStyle=tint(c,-.35);g.fillRect(0,0,w,h);const cols=[tint(c,.15),tint(c,-.6),"#4a3b24",tint(c,.4)];
for(let i=0;i<46;i++){g.fillStyle=cols[i%4];g.beginPath();const x=r()*w,y=r()*h,rx=10+r()*30,ry=6+r()*16;g.ellipse(x,y,rx,ry,r()*3,0,6.283);g.fill()}},
fade(g,w,h,c,r){const q=g.createLinearGradient(0,0,w,h*.4);q.addColorStop(0,tint(c,-.35));q.addColorStop(.5,tint(c,.1));q.addColorStop(1,tint(c,.85));g.fillStyle=q;g.fillRect(0,0,w,h);
for(let i=0;i<500;i++){g.fillStyle=`rgba(255,255,255,${r()*.06})`;g.fillRect(r()*w,r()*h,2,2)}},
carbon(g,w,h,c,r){g.fillStyle="#101216";g.fillRect(0,0,w,h);const s=8;for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){const o=((x/s+y/s)&1);g.fillStyle=o?"#1a1d23":"#0b0c0f";g.fillRect(x,y,s,s);g.fillStyle=o?"rgba(255,255,255,.08)":"rgba(255,255,255,.03)";g.fillRect(x,y,s,2)}
g.fillStyle=tint(c,0);g.fillRect(0,h*.46,w,h*.1);g.fillStyle="rgba(255,255,255,.35)";g.fillRect(0,h*.46,w,2)},
wave(g,w,h,c,r){const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,tint(c,-.5));q.addColorStop(1,tint(c,-.15));g.fillStyle=q;g.fillRect(0,0,w,h);
for(let k=0;k<9;k++){g.strokeStyle=k%2?tint(c,.55):tint(c,.1);g.lineWidth=3;g.beginPath();for(let x=0;x<=w;x+=4){const y=h*(k+.5)/9+Math.sin(x/w*12.56+k*.7)*6;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}},
gold(g,w,h,c,r){const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,"#8a5a0a");q.addColorStop(.25,"#ffe27a");q.addColorStop(.5,"#d49a1c");q.addColorStop(.75,"#fff1a8");q.addColorStop(1,"#9a6a10");g.fillStyle=q;g.fillRect(0,0,w,h);
for(let i=0;i<180;i++){g.fillStyle=`rgba(255,250,200,${r()*.5})`;g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}
g.strokeStyle="rgba(120,70,0,.35)";g.lineWidth=1;for(let x=-h;x<w;x+=14){g.beginPath();g.moveTo(x,h);g.lineTo(x+h,0);g.stroke()}},
stripe(g,w,h,c,r){g.fillStyle="#121317";g.fillRect(0,0,w,h);g.fillStyle=tint(c,0);g.fillRect(0,h*.2,w,h*.2);g.fillRect(0,h*.6,w,h*.2);
g.fillStyle="#fff";g.fillRect(0,h*.45,w,3);g.fillStyle=tint(c,.5);g.fillRect(0,h*.2,w,2);g.fillRect(0,h*.6,w,2);
for(let i=0;i<6;i++){g.fillStyle="rgba(255,255,255,.06)";g.fillRect(i*w/6,0,2,h)}},
circuit(g,w,h,c,r){g.fillStyle="#06121a";g.fillRect(0,0,w,h);g.strokeStyle=tint(c,0);g.fillStyle=tint(c,.3);g.lineWidth=3;
for(let i=0;i<22;i++){let x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){if(r()<.5)x+=(r()-.5)*90;else y+=(r()-.5)*50;g.lineTo(x,y)}g.stroke();g.beginPath();g.arc(x,y,4,0,6.283);g.fill()}
g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=1;for(let i=0;i<6;i++){g.strokeRect(r()*w*.9,r()*h*.8,18,12)}},
galaxy(g,w,h,c,r){const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,"#0b0420");q.addColorStop(1,"#1d0a3a");g.fillStyle=q;g.fillRect(0,0,w,h);
for(const col of[tint(c,0),"#ff4fd8","#3b82f6","#7c3aed"]){for(let i=0;i<3;i++){const x=r()*w,y=r()*h,rad=40+r()*70,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,col.startsWith("#")?col+"aa":col.replace("rgb","rgba").replace(")",",.65)"));gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2)}}
for(let i=0;i<150;i++){g.fillStyle=`rgba(255,255,255,${.3+r()*.7})`;const s=r()<.1?2.5:1.2;g.fillRect(r()*w,r()*h,s,s)}},
prism(g,w,h,c,r){const q=g.createLinearGradient(0,0,w,h);["#ff5f6d","#ffc371","#fff07a","#6dff9c","#5fd6ff","#8f7bff","#ff7bf0","#ff5f6d"].forEach((s,i,a)=>q.addColorStop(i/(a.length-1),s));g.fillStyle=q;g.fillRect(0,0,w,h);
g.fillStyle="rgba(255,255,255,.22)";for(let x=-h;x<w;x+=22){g.beginPath();g.moveTo(x,h);g.lineTo(x+h*.6,0);g.lineTo(x+h*.6+9,0);g.lineTo(x+9,h);g.fill()}},
honey(g,w,h,c,r){g.fillStyle=tint(c,-.62);g.fillRect(0,0,w,h);const R=11,dx=R*1.732,dy=R*1.5;
for(let row=-1;row<h/dy+1;row++)for(let col=-1;col<w/dx+1;col++){const x=col*dx+(row&1?dx/2:0),y=row*dy;g.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;g.lineTo(x+Math.cos(a)*(R-1.5),y+Math.sin(a)*(R-1.5))}g.closePath();
g.fillStyle=r()<.18?tint(c,-.05):tint(c,-.4+r()*.12);g.fill();g.strokeStyle=tint(c,.45);g.lineWidth=1.6;g.stroke()}},
scales(g,w,h,c,r){g.fillStyle=tint(c,-.7);g.fillRect(0,0,w,h);const sw=16,sh=9;
for(let row=h/sh+1;row>=-1;row--)for(let col=-1;col<w/sw+1;col++){const x=col*sw+(row&1?sw/2:0),y=row*sh,q=g.createRadialGradient(x,y-sh*.5,1,x,y,sw*.7);q.addColorStop(0,tint(c,.35));q.addColorStop(.6,tint(c,-.15));q.addColorStop(1,tint(c,-.6));
g.fillStyle=q;g.beginPath();g.arc(x,y,sw*.55,0,Math.PI);g.fill();g.strokeStyle="rgba(0,0,0,.45)";g.lineWidth=1.2;g.stroke()}},
ice(g,w,h,c,r){const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,tint(c,-.1));q.addColorStop(.5,tint(c,.7));q.addColorStop(1,tint(c,.15));g.fillStyle=q;g.fillRect(0,0,w,h);
g.lineCap="round";for(let i=0;i<14;i++){let x=r()*w,y=r()*h;g.strokeStyle=`rgba(255,255,255,${.25+r()*.5})`;g.lineWidth=.8+r()*1.4;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=(r()-.5)*60;y+=(r()-.5)*30;g.lineTo(x,y)}g.stroke()}
for(let i=0;i<260;i++){g.fillStyle=`rgba(255,255,255,${r()*.5})`;g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}},
magma(g,w,h,c,r){g.fillStyle="#150805";g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=`rgba(60,24,12,${.3+r()*.5})`;g.beginPath();g.ellipse(r()*w,r()*h,6+r()*22,4+r()*10,r()*3,0,6.283);g.fill()}
g.lineCap="round";g.lineJoin="round";for(let pass=0;pass<2;pass++){g.strokeStyle=pass?"#ffd27a":tint(c,0);g.lineWidth=pass?1.2:4;g.shadowColor=tint(c,0);g.shadowBlur=pass?0:8;
const rr=mkRng(c*3+7);for(let i=0;i<16;i++){let x=rr()*w,y=rr()*h;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=(rr()-.5)*70;y+=(rr()-.5)*34;g.lineTo(x,y)}g.stroke()}}g.shadowBlur=0},
aurora(g,w,h,c,r){g.fillStyle="#050b16";g.fillRect(0,0,w,h);const cols=["rgba(52,211,153,","rgba(56,189,248,","rgba(167,139,250,"];
for(let k=0;k<9;k++){const base=h*(.1+k*.1),col=cols[k%3];for(let x=0;x<w;x+=2){const y=base+Math.sin(x/w*6.283*2+k)*9+Math.sin(x/w*6.283*5+k*2)*3,q=g.createLinearGradient(0,y-16,0,y+16);q.addColorStop(0,col+"0)");q.addColorStop(.5,col+".5)");q.addColorStop(1,col+"0)");g.fillStyle=q;g.fillRect(x,y-16,2,32)}}
for(let i=0;i<70;i++){g.fillStyle=`rgba(255,255,255,${.2+r()*.6})`;g.fillRect(r()*w,r()*h,1.3,1.3)}}};
const SKS={metal:[0xcccccc,90,0,.24],camo:[0x333333,25,0,.08],fade:[0x888888,60,0,.2],carbon:[0x777777,70,0,.3],wave:[0x999999,80,0,.22],gold:[0xfff0b0,160,0,.38],stripe:[0xaaaaaa,90,0,.24],circuit:[0x66ffee,60,.9,.18],galaxy:[0xaa88ff,90,.85,.22],prism:[0xffffff,130,.35,.3],
honey:[0xffe0a0,100,0,.26],scales:[0xbbffbb,110,0,.28],ice:[0xffffff,150,.12,.4],magma:[0xff9966,40,.9,.14],aurora:[0xaaffee,90,.8,.22],dev:[0xffcc99,100,.5,.2]};
const SKM={},ANIMM=[],ANIMK={prism:1,magma:1,aurora:1,circuit:1,galaxy:1,dev:1};
function skinMat(sk){
if(SKM[sk.id])return SKM[sk.id];
const c=document.createElement("canvas");c.width=256;c.height=128;SKP[sk.kind](c.getContext("2d"),256,128,sk.c,mkRng(sk.c*7+13));
const map=new T.CanvasTexture(c);map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;const sp=SKS[sk.kind]||SKS.metal;
const o={map,specular:0x52645c,shininess:18,flatShading:true};if(sp[2]){o.emissive=0xffffff;o.emissiveMap=map;o.emissiveIntensity=sp[2]}
const m=new T.MeshPhongMaterial(o);m.userData.kind=sk.kind;if(ANIMK[sk.kind])ANIMM.push(m);return SKM[sk.id]=m}
function animSkins(t){for(const m of ANIMM){const k=m.userData.kind;
if(k==="prism"){m.map.offset.x=(t*.12)%1;m.emissive.setHSL((t*.15)%1,.9,.35);m.emissiveIntensity=.55}
else if(k==="aurora"){m.map.offset.x=(t*.05)%1;m.emissiveIntensity=.65+.2*Math.sin(t*1.3)}
else if(k==="magma")m.emissiveIntensity=.7+.3*Math.sin(t*2.1)+.1*Math.sin(t*5.3)
else if(k==="circuit")m.emissiveIntensity=.75+.25*Math.sin(t*3.2)
else if(k==="dev")m.emissiveIntensity=.45+.15*Math.sin(t*2)
else if(k==="galaxy"){m.map.offset.x=(t*.02)%1}}}

// ---------- reflection environment: a small studio cube so metal and gloss pick up soft boxes and a horizon ----------
const ENV=(()=>{const S2=64,mk=f=>{const c=document.createElement("canvas");c.width=c.height=S2;f(c.getContext("2d"));return c},
side=(lights)=>mk(g=>{const q=g.createLinearGradient(0,0,0,S2);q.addColorStop(0,"#5d7399");q.addColorStop(.48,"#a9b9d4");q.addColorStop(.52,"#3a3f4c");q.addColorStop(1,"#0e1015");g.fillStyle=q;g.fillRect(0,0,S2,S2);g.fillStyle="rgba(255,255,255,.9)";for(const [x,w] of lights)g.fillRect(x,8,w,22)}),
top=mk(g=>{g.fillStyle="#8da2c6";g.fillRect(0,0,S2,S2);g.fillStyle="#fff";g.fillRect(16,16,32,32)}),bot=mk(g=>{g.fillStyle="#0d0f14";g.fillRect(0,0,S2,S2)});
const t=new T.CubeTexture([side([[6,14],[40,12]]),side([[20,18]]),top,bot,side([[4,10],[30,16],[52,8]]),side([[12,12],[44,14]])]);t.needsUpdate=true;return t})();

// ---------- shared materials ----------
const MDK=new T.MeshPhongMaterial({color:0x293e3b,specular:0x425b52,shininess:12,flatShading:true}),MMT=new T.MeshPhongMaterial({color:0x9d9d80,specular:0xb8c0a3,shininess:22,flatShading:true}),
MWD=new T.MeshPhongMaterial({color:0x6b4423,shininess:20}),MGL=new T.MeshBasicMaterial({color:0x00ffd0}),MBL=new T.MeshBasicMaterial({color:0x66ccff}),MRD=new T.MeshBasicMaterial({color:0xff4f6a}),MMG=new T.MeshBasicMaterial({color:0xf0abfc});
const RAILM=(()=>{const c=document.createElement("canvas");c.width=32;c.height=4;const g=c.getContext("2d");g.fillStyle="#2b2f38";g.fillRect(0,0,32,4);g.fillStyle="#0a0b0e";g.fillRect(0,0,12,4);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;return new T.MeshPhongMaterial({map:t,shininess:40})})();
const FLASH=(()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d"),q=g.createRadialGradient(32,32,0,32,32,32);q.addColorStop(0,"rgba(255,255,230,1)");q.addColorStop(.3,"rgba(255,210,90,.85)");q.addColorStop(1,"rgba(255,140,0,0)");g.fillStyle=q;g.fillRect(0,0,64,64);return new T.CanvasTexture(c)})();

function disposeGeo(o){o.traverse(m=>{if(m.geometry)m.geometry.dispose()})}

// ---------- gun model (barrel points toward -z) ----------
function buildGun(g,sk){
const grp=new T.Group(),skin=skinMat(sk||SK[0]),f=-g.l/2;
const add=(geo,mat,x,y,z,rx,ry,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);grp.add(m);return m};
const bx=(w,h,d,x,y,z,mat,rx,ry,rz)=>add(new T.BoxGeometry(w,h,d),mat,x,y,z,rx,ry,rz),cy=(r,l,x,y,z,mat,r2)=>add(new T.CylinderGeometry(r,r2==null?r:r2,l,12),mat,x,y,z,Math.PI/2,0,0);
const pistol=g.id==="g0"||!!g.pst;
const rail=(len,y,z)=>{const gm=new T.BoxGeometry(.034,.012,len),uv=gm.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*Math.round(len/.022));add(gm,RAILM,0,y,z)};
if(pistol){bx(.07,.075,g.l,0,.04,0,skin);bx(.062,.06,g.l*.9,0,-.03,.02,MDK);bx(.03,.02,g.l*.92,0,.085,0,MDK)}
else{bx(.09,.12,g.l,0,0,0,skin);bx(.036,.016,g.l*.84,0,.075,-g.l*.04,MDK);bx(.092,.02,g.l*.5,0,-.02,f+g.l*.25,MMT)}
cy(.022,g.b,0,.02,f-g.b/2,MMT);cy(.031,.05,0,.02,f-g.b-.015,MDK);
if(!pistol&&g.b>.2&&!g.pump&&!g.coil&&!g.multi)bx(.1,.12,Math.min(g.b*.95,.34),0,.012,f-Math.min(g.b*.95,.34)/2+.02,skin);
bx(.058,.15,.075,0,pistol?-.1:-.125,g.l*.27,MDK,.32);bx(.012,.02,.09,0,-.075,g.l*.07,MDK);
const mg=g.mg||.1;let mag=null,prop=null;if(!g.pump&&!g.coil&&!g.multi&&!g.scope||g.id==="g4")mag=bx(.07,mg,.075,0,-.06-mg/2,-.015,MDK,.14);
else{prop=bx(.05,.07,.05,0,-.1,-.015,MMT);prop.visible=false}

if(g.st){bx(.07,.105,.22,0,-.012,g.l/2+.11,skin);bx(.072,.115,.025,0,-.012,g.l/2+.23,MDK)}
if(g.pump){bx(.1,.075,.2,0,-.07,f-.1,MWD);cy(.02,g.b*.95,0,-.04,f-g.b*.45,MMT)}
let lens=null;
if(g.scope){lens={y:.115,z:.147,r:.031};cy(.04,.03,0,.115,.125,MDK);cy(.034,.3,0,.115,-.02,MDK);cy(.04,.04,0,.115,-.19,MDK);cy(.03,.012,0,.115,-.212,MBL);bx(.02,.045,.03,0,.088,-.1,MDK);bx(.02,.045,.03,0,.088,.06,MDK);bx(.03,.04,.12,0,-.06,f-.05,MDK)}
if(g.glow){cy(.034,.05,0,.02,f-g.b+.01,MGL);bx(.01,.1,.16,.052,.01,f-.07,skin);bx(.01,.1,.16,-.052,.01,f-.07,skin);bx(.094,.01,g.l*.55,0,.03,0,MGL)}
if(g.coil){for(let i=0;i<3;i++)cy(.056,.03,0,.02,f-.1-i*.15,MBL);bx(.016,.02,g.b+.12,.045,.035,f-g.b/2,MMT);bx(.016,.02,g.b+.12,-.045,.035,f-g.b/2,MMT);bx(.094,.01,g.l*.7,0,.04,0,MBL)}
if(g.multi){[[.045,.05],[-.045,.05],[0,-.03]].forEach(([x,y])=>cy(.02,g.b,x,y,f-g.b/2-.02,MMT));cy(.075,.06,0,.01,f-.1,MDK);cy(.075,.06,0,.01,f-.26,MDK);bx(.12,.13,.14,0,-.14,.0,MDK);bx(.1,.012,g.l*.7,0,.07,0,MRD)}
if(!pistol&&!g.scope&&!g.pump&&!g.coil&&!g.multi)rail(Math.min(g.l*.8,.42),.082,-g.l*.06);
if(!pistol)bx(.094,.028,.075,0,.034,-g.l*.1,MDK);
// the optic that goes with the sight picture (hidden while aiming, because the overlay is the view through it)
const optic=new T.Group(),ob=(w,h,d,x,y,z,mat)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);optic.add(m);return m},oc=(r,l,x,y,z,mat)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,l,12),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);optic.add(m)},ov=(r,l,x,y,z,mat)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,l,10),mat);m.position.set(x,y,z);optic.add(m)},sk2=scopeOf(g).k,oz=-g.l*.12;
// open reflex frame: a low base, two posts, a short hood and a tinted pane with the reticle on it, so there is something to see through instead of a solid block
const frame=(w,h,d,z,dot,post,sq)=>{
const y0=.086,t=.007,top=y0+.012+h,pane=new T.MeshBasicMaterial({color:0x7fc8ff,transparent:true,opacity:.34,depthWrite:false});
ob(w*.8,.012,d*.7,0,y0+.006,z,MDK);
ob(t,h,d*.8,w/2-t/2,y0+.012+h/2,z,post);ob(t,h,d*.8,-w/2+t/2,y0+.012+h/2,z,post);
ob(w+.004,t*.8,d*.5,0,top+t*.4,z-d*.25,MMT);
const gp=new T.Mesh(new T.BoxGeometry(w-2*t,h,.003),pane);gp.position.set(0,y0+.012+h/2,z-d*.42);gp.renderOrder=2;optic.add(gp);
ob(sq,sq,.004,0,y0+.012+h*.5,z-d*.42-.003,dot)};
if(sk2==="dot")frame(.036,.03,.06,oz,MRD,MMT,.007);
else if(sk2==="holo")frame(.05,.042,.09,oz,MRD,MMT,.008);
else if(sk2==="ring")frame(.05,.042,.085,oz,MRD,MMT,.011);
else if(sk2==="plasma")frame(.05,.042,.085,oz,MGL,MGL,.008);
else if(sk2==="aether")frame(.05,.042,.08,.02,MMG,MMT,.008);
else if(sk2==="acog"){lens={y:.12,z:oz+.103,r:.027};oc(.036,.03,0,.12,oz+.085,MDK);oc(.03,.16,0,.12,oz,MDK);oc(.036,.03,0,.12,oz-.09,MDK);oc(.026,.004,0,.12,oz-.106,MRD);ob(.012,.03,.05,0,.1,oz+.03,MDK);ob(.012,.03,.05,0,.1,oz-.04,MDK)}
else if(sk2==="rail"){lens={y:.118,z:oz+.123,r:.029};oc(.036,.03,0,.118,oz+.105,MDK);oc(.03,.2,0,.118,oz,MDK);oc(.036,.03,0,.118,oz-.11,MDK);oc(.026,.004,0,.118,oz-.126,MBL);ob(.014,.028,.03,0,.098,oz+.05,MDK);ob(.014,.028,.03,0,.098,oz-.05,MDK);ov(.01,.016,0,.118+.03+.006,oz-.01,MBL);ov(.008,.012,.034,.118,oz-.01,MDK)}
// iron sights belong to the optic group so they vanish while you look through the overlay; guns with a real optic carry none
if(sk2==="iron"||sk2==="rev"||sk2==="bead"){ob(.012,.035,.012,0,.1,f-g.b*.75,MDK);ob(.04,.03,.012,0,.098,g.l*.36,MDK)}
grp.add(optic);
const mf=new T.Sprite(new T.SpriteMaterial({map:FLASH,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
const mz={x:0,y:.02,z:f-g.b-.07};mf.position.set(mz.x,mz.y,mz.z);mf.scale.setScalar(.34);mf.visible=false;grp.add(mf);
YardArt.gun(grp,g);
return{grp,mf,mz,f,optic,lens,mag,prop,grip:{x:0,y:pistol?-.1:-.125,z:g.l*.27},fore:{x:0,y:g.pump?-.07:-.045,z:g.pump?f-.1:f-Math.min(g.b,.3)*.55}}}

// ---------- knife model (blade points toward -z, edge downward) ----------
function buildKnife(kn){
const grp=new T.Group(),s=kn.s,len=s.len,w=s.w,raw=kn.c,mats=[];
let bm;if(s.glow){bm=new T.MeshBasicMaterial({color:raw});}else bm=new T.MeshPhongMaterial({color:raw,specular:0xffffff,shininess:140});
mats.push(bm);
const sh=new T.Shape();
if(s.curve){sh.moveTo(0,w*.9);sh.quadraticCurveTo(len*.55,w*1.4,len,-w*.2);sh.quadraticCurveTo(len*.5,-w*.6,len*.2,-w*.9);sh.lineTo(0,-w*.9);sh.lineTo(0,w*.9)}
else if(s.guard){sh.moveTo(0,w*.5);sh.lineTo(len*.94,w*.5);sh.lineTo(len,0);sh.lineTo(len*.94,-w*.5);sh.lineTo(0,-w*.5);sh.lineTo(0,w*.5)}
else if(s.ring){sh.moveTo(0,0);sh.lineTo(len*.15,w);sh.quadraticCurveTo(len*.5,w*1.3,len,0);sh.quadraticCurveTo(len*.5,-w*1.3,len*.15,-w);sh.lineTo(0,0)}
else{sh.moveTo(0,w);sh.lineTo(len*.78,w);sh.quadraticCurveTo(len*.95,w*.7,len,-w*.1);sh.lineTo(len*.35,-w*.75);sh.lineTo(0,-w);sh.lineTo(0,w)}
const geo=new T.ExtrudeGeometry(sh,{depth:.018,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:8});
geo.translate(0,0,-.009);geo.rotateY(Math.PI/2);const blade=new T.Mesh(geo,bm);blade.position.z=-.04;grp.add(blade);
if(s.glow){const hg=new T.Mesh(geo,new T.MeshBasicMaterial({color:raw,transparent:true,opacity:.28,blending:T.AdditiveBlending,depthWrite:false}));hg.position.z=-.04;hg.scale.set(2.6,1.35,1.04);grp.add(hg);mats.push(hg.material)}
const hl=s.guard?.26:.17;const hd=new T.Mesh(new T.CylinderGeometry(.021,.025,hl,10),new T.MeshPhongMaterial({color:0x2a1d12,shininess:30}));hd.rotation.x=Math.PI/2;hd.position.z=hl/2;grp.add(hd);
for(let i=0;i<4;i++){const rg=new T.Mesh(new T.CylinderGeometry(.027,.027,.012,10),MDK);rg.rotation.x=Math.PI/2;rg.position.z=.03+i*(hl-.04)/3;grp.add(rg)}
const gd=new T.Mesh(new T.BoxGeometry(s.guard?.13:.07,.028,.02),MMT);gd.position.z=-.01;grp.add(gd);
if(s.ring){const rg=new T.Mesh(new T.TorusGeometry(.03,.007,6,14),MMT);rg.position.z=hl+.03;grp.add(rg)}
return{grp,mats,len,hl}}

// ---------- humans ----------
function limb(parent,x,y,z,w,h,d,mat,hit){const pv=new T.Group();pv.position.set(x,y,z);const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.y=-h/2;m.castShadow=true;pv.add(m);parent.add(pv);hit.push(m);return pv}
const UA=.31,FA=.33;
function mkArm(g,x,mb,ms,mtrim,hit){
const pv=new T.Group();pv.position.set(x,1.56,0);
const up=new T.Mesh(new T.BoxGeometry(.16,UA,.16),mb);up.position.y=-UA/2;up.castShadow=true;pv.add(up);hit.push(up);
const el=new T.Group();el.position.y=-UA;pv.add(el);
const fa=new T.Mesh(new T.BoxGeometry(.15,FA,.15),mb);fa.position.y=-FA/2;fa.castShadow=true;el.add(fa);hit.push(fa);
const hd=new T.Mesh(new T.BoxGeometry(.13,.12,.13),ms);hd.position.y=-FA-.03;el.add(hd);hit.push(hd);
const pd=new T.Mesh(new T.BoxGeometry(.2,.1,.2),mtrim);pd.position.y=.02;pv.add(pd);
pv.userData.el=el;g.add(pv);return pv}
// accessories that turn an outfit into a full player model skin
function styleHuman(g,sty,head,torso,arms,body,trim,mats){
const L=c=>{const m=new T.MeshLambertMaterial({color:c});mats.push(m);return m},B=c=>new T.MeshBasicMaterial({color:c});
const add=(par,geo,mat,x,y,z,rx,ry,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);par.add(m);return m},bx=(w,h,d)=>new T.BoxGeometry(w,h,d);
const cape=(c)=>{const m=add(torso,bx(.5,.95,.04),L(c),0,-.26,-.17);m.rotation.x=.08;return m};
if(sty==="cap"){add(head,bx(.34,.08,.34),L(trim),0,.2,0);add(head,bx(.3,.03,.16),L(trim),0,.17,.22)}
else if(sty==="hood"){const c=L(body);add(head,bx(.37,.08,.37),c,0,.2,0);add(head,bx(.37,.36,.06),c,0,0,-.17);add(head,bx(.05,.36,.34),c,.17,0,0);add(head,bx(.05,.36,.34),c,-.17,0,0);add(head,bx(.04,.16,.2),B(0x86efac),0,.2,.1)}
else if(sty==="flame"){[[0,.34,0,.13,.4],[-.1,.3,.02,.1,.3],[.1,.3,.02,.1,.3],[0,.3,-.1,.09,.28]].forEach(([x,y,z,r,h],i)=>add(head,new T.ConeGeometry(r,h,5),B(i%2?0xffd24a:0xff6a1a),x,y,z))}
else if(sty==="wizard"){const c=L(body);add(head,new T.CylinderGeometry(.34,.34,.03,14),c,0,.18,0);add(head,new T.ConeGeometry(.22,.55,12),c,0,.46,0,-.12,0,0);add(head,new T.TorusGeometry(.2,.025,6,14),B(0xfde68a),0,.24,0,Math.PI/2,0,0)}
else if(sty==="beanie"){add(head,bx(.35,.14,.35),L(trim),0,.2,0);add(head,new T.SphereGeometry(.06,8,6),L(0xffffff),0,.3,0);add(head,bx(.36,.07,.04),B(0x38bdf8),0,.06,.17)}
else if(sty==="ninja"){add(head,bx(.33,.15,.33),L(body),0,-.08,0);add(head,bx(.34,.06,.34),B(trim),0,.1,0);add(head,bx(.07,.05,.24),B(trim),.05,.1,-.26,0,.2,0);add(head,bx(.07,.05,.24),B(trim),-.05,.08,-.26,0,-.2,0)}
else if(sty==="horns"){[-1,1].forEach(x=>add(head,new T.ConeGeometry(.05,.3,6),L(0xf1f5f9),x*.14,.3,0,0,0,-x*.5));cape(0x7f1d1d)}
else if(sty==="crown"){const gold=B(0xffd24a);add(head,bx(.33,.07,.33),gold,0,.2,0);[[-.13,-.13],[.13,-.13],[-.13,.13],[.13,.13],[0,.14],[0,-.14]].forEach(([x,z])=>add(head,bx(.05,.09,.05),gold,x,.27,z));arms.forEach(a=>add(a,bx(.24,.07,.24),gold,0,.07,0))}
else if(sty==="halo"){add(head,new T.TorusGeometry(.2,.022,8,24),B(trim),0,.5,0,Math.PI/2,0,0);mats.forEach(m=>{m.transparent=true;m.opacity=.8})}
else if(sty==="band"){add(head,bx(.34,.06,.34),B(0xef4444),0,.08,0);add(head,bx(.06,.05,.2),B(0xef4444),.05,.08,-.26,0,.2,0);add(torso,bx(.52,.1,.32),L(trim),0,.36,0)}
else if(sty==="nvg"){add(head,bx(.3,.07,.08),L(0x111827),0,.07,.18);[-.07,.07].forEach(x=>add(head,new T.CylinderGeometry(.04,.04,.1,8),B(0x4ade80),x,.07,.24,Math.PI/2,0,0));add(head,bx(.33,.07,.33),L(0x111827),0,.19,0)}
else if(sty==="champ"){const gold=B(0xffd24a);add(head,bx(.33,.07,.33),gold,0,.2,0);[[-.13,0],[.13,0],[0,-.13],[0,.13]].forEach(([x,z])=>add(head,bx(.05,.1,.05),gold,x,.27,z));cape(0xb45309)}
else if(sty==="dev"){
const accent=B(trim),dark=L(body);add(head,bx(.36,.1,.36),dark,0,.2,0);add(head,bx(.34,.065,.035),accent,0,.07,.17);
[-1,1].forEach(x=>{add(head,bx(.075,.19,.15),dark,x*.2,0,0);add(head,bx(.035,.1,.1),accent,x*.245,0,0)});
add(head,bx(.025,.025,.19),accent,.23,-.1,.15);add(torso,bx(.39,.055,.025),accent,0,.12,.17);
arms.forEach(a=>add(a,bx(.22,.07,.22),accent,0,.07,0));
const badge=document.createElement("canvas");badge.width=128;badge.height=64;const ctx=badge.getContext("2d");ctx.fillStyle="#121827";ctx.fillRect(0,0,128,64);ctx.fillStyle="#ffb16b";ctx.font="bold 30px monospace";ctx.textAlign="center";ctx.fillText("<DEV>",64,43);
const map=new T.CanvasTexture(badge);add(torso,new T.PlaneGeometry(.38,.19),new T.MeshBasicMaterial({map}),0,-.08,.18)
}}
// no shadow map on Low and Potato, so every character carries a soft dark disc on the floor instead (hidden whenever real shadows are on; Q.set toggles it)
let BLOBT=null,BLOBM=null;const BLOBG=new T.PlaneGeometry(1,1);BLOBG.rotateX(-Math.PI/2);
function blobShadow(r){
if(!BLOBM){const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d"),q=x.createRadialGradient(32,32,2,32,32,32);q.addColorStop(0,"rgba(0,0,0,.6)");q.addColorStop(.55,"rgba(0,0,0,.32)");q.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=q;x.fillRect(0,0,64,64);BLOBT=new T.CanvasTexture(c);
BLOBM=new T.MeshBasicMaterial({map:BLOBT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}
const m=new T.Mesh(BLOBG,BLOBM);m.scale.set(r*2.4,1,r*2.4);m.position.y=.05;m.renderOrder=-1;m.userData.blob=1;m.visible=!LOD.sh;m.raycast=()=>{};return m}
function mkHuman(o){
o=o||{};const body=o.body==null?0x2563eb:o.body,trim=o.trim==null?0x93c5fd:o.trim,skin=o.skin||0xf1c27d,g=new T.Group(),hit=[],mats=[];
const mk=c=>{const m=new T.MeshLambertMaterial({color:c});mats.push(m);return m},mb=mk(body),mtrim=mk(trim),ms=mk(skin),mp=mk(0x222c44),mbt=mk(0x15171c),mh=mk(o.hair==null?0x3a2a1a:o.hair);
const torso=new T.Group();torso.position.y=1.26;g.add(torso);
const tm=new T.Mesh(new T.BoxGeometry(.5,.62,.28),mb);tm.castShadow=true;torso.add(tm);hit.push(tm);
const ch=new T.Mesh(new T.BoxGeometry(.54,.16,.3),mtrim);ch.position.y=.32;torso.add(ch);hit.push(ch);
const bl=new T.Mesh(new T.BoxGeometry(.52,.07,.3),mbt);bl.position.y=-.28;torso.add(bl);hit.push(bl);
const head=new T.Group();head.position.y=1.9;g.add(head);
const hm=new T.Mesh(new T.BoxGeometry(.3,.32,.3),ms);hm.castShadow=true;hm.userData.head=true;head.add(hm);hit.push(hm);
const hr=new T.Mesh(new T.BoxGeometry(.33,.13,.33),mh);hr.position.y=.16;hr.userData.head=true;head.add(hr);hit.push(hr);
const vz=new T.Mesh(new T.BoxGeometry(.26,.08,.02),new T.MeshBasicMaterial({color:0x10131a}));vz.position.set(0,.03,.16);vz.userData.head=true;head.add(vz);hit.push(vz);
const ey=new T.Mesh(new T.BoxGeometry(.2,.02,.01),new T.MeshBasicMaterial({color:trim}));ey.position.set(0,.03,.172);head.add(ey);
const legs=[limb(g,-.13,.9,0,.2,.78,.24,mp,hit),limb(g,.13,.9,0,.2,.78,.24,mp,hit)];
legs.forEach(l=>{const bt=new T.Mesh(new T.BoxGeometry(.22,.12,.34),mbt);bt.position.set(0,-.84,.04);bt.castShadow=true;l.add(bt);hit.push(bt)});
// two-bone arms (shoulder + elbow) so they can really reach the gun
const arms=[mkArm(g,-.36,mb,ms,mtrim,hit),mkArm(g,.36,mb,ms,mtrim,hit)];
if(o.style)styleHuman(g,o.style,head,torso,arms,body,trim,mats);
let gun=null,hold=null;
if(o.gun){
gun=buildGun(o.gun,o.gunSkin||SK[0]);const sc=.68,piv=new T.Vector3(0,1.5,0);
gun.grp.scale.setScalar(sc);
const rig=new T.Group();rig.position.copy(piv);g.add(rig);rig.add(gun.grp);
const gp=new T.Vector3(gun.grip.x,gun.grip.y,gun.grip.z),fp=new T.Vector3(gun.fore.x,gun.fore.y,gun.fore.z),SL=new T.Vector3(.36,1.56,0),rp=new T.Vector3(0,0,o.gun.l/2+(o.gun.st?.25:0));
const tg=new T.Vector3(),tf=new T.Vector3(),rr=new T.Vector3();let bp=[.3,.14];
const tryPlace=(psi,zg)=>{
gun.grp.rotation.y=Math.PI+psi;gun.grp.position.set(0,0,0);gun.grp.updateMatrix();
const go=gp.clone().applyMatrix4(gun.grp.matrix);
tg.set(-.1,1.4,zg);gun.grp.position.copy(tg).sub(piv).sub(go);gun.grp.updateMatrix();
tf.copy(fp).applyMatrix4(gun.grp.matrix).add(piv);rr.copy(rp).applyMatrix4(gun.grp.matrix).add(piv);
return tf.distanceTo(SL)};
// find a hold where the off hand reaches the foregrip and the stock stays out of the back of the body
let bestD=1e9;
search:for(const psi of[.1,.2,.3,.4,.5])for(let zg=.36;zg>=.02;zg-=.02){const d=tryPlace(psi,zg);
if(rr.z>=-.08){if(d<bestD){bestD=d;bp=[psi,zg]}if(d<=UA+FA+.02){bp=[psi,zg];break search}}}
tryPlace(bp[0],bp[1]);
hold={rig,piv,tg:tg.clone(),tf:tf.clone()};
gun.grp.traverse(m=>{if(m.isMesh)m.castShadow=false})}
hurtBox(g,.62,1.52,.42,0,.88,0,false,hit);hurtBox(head,.44,.5,.44,0,.02,0,true,hit);
g.userData={legs,arms,torso,head,hit,mats,gun,hold,body,ph:0,sp:0,kick:0,flashT:0};YardArt.human(g,o);g.scale.setScalar(.88);g.add(blobShadow(.55));if(hold)poseHuman(g,0,0,0);return Post.rim(g)}
// invisible hurt boxes: forgiving, gap-free volumes around the body and the head so shots at the visible shape never slip between the thin limbs
const HURT=new T.MeshBasicMaterial({visible:false});
function hurtBox(par,w,h,d,x,y,z,head,hit){const m=new T.Mesh(new T.BoxGeometry(w,h,d),HURT);m.position.set(x,y,z);m.userData.head=!!head;par.add(m);hit.push(m);return m}
function bindOwner(m,owner,key){m.userData.hit.forEach(h=>{h.userData[key||"en"]=owner})}
function setMuzzle(m,on){const gn=m.userData.gun;if(gn){gn.mf.visible=on;if(on)gn.mf.material.color.setScalar(Post.hot);gn.mf.material.rotation=rnd()*6}}
// walk and aim pose
const _xa=new T.Vector3(1,0,0),_dn=new T.Vector3(0,-1,0),_q1=new T.Quaternion(),_v1=new T.Vector3(),_v2=new T.Vector3(),_v3=new T.Vector3(),_E=new T.Vector3(),_pl=new T.Vector3(),_pr=new T.Vector3(-.6,-1,-.25),_pL=new T.Vector3(.6,-1,-.25);
// two-bone arm: shoulder -> elbow -> hand lands on target (model space)
function armIK(arm,tgt,pole){
const S=arm.position,el=arm.userData.el;_v1.subVectors(tgt,S);const d=_v1.length();if(d<.001)return;_v1.divideScalar(d);
const dm=Math.min(d,UA+FA-.004),x=(UA*UA-FA*FA+dm*dm)/(2*dm),h=Math.sqrt(Math.max(0,UA*UA-x*x));
_pl.copy(pole);_pl.addScaledVector(_v1,-_pl.dot(_v1));if(_pl.lengthSq()<1e-6)_pl.set(0,-1,0);_pl.normalize();
_E.copy(S).addScaledVector(_v1,x).addScaledVector(_pl,h);
_v2.subVectors(_E,S).normalize();arm.quaternion.setFromUnitVectors(_dn,_v2);
_v3.copy(S).addScaledVector(_v1,dm);_v2.subVectors(_v3,_E).normalize();_q1.setFromUnitVectors(_dn,_v2);
el.quaternion.copy(arm.quaternion).invert().multiply(_q1)}
function poseHuman(m,dt,sp,aim,air){
const u=m.userData;
if(u.nar)return narutoPose(m,dt,sp,air);
u.ph+=dt*(4+sp*7)*(sp>.05?1:0);u.sp+=(sp-u.sp)*Math.min(1,dt*12);const sw=Math.sin(u.ph)*.85*u.sp;
u.air=(u.air||0)+((air?1:0)-(u.air||0))*Math.min(1,dt*10);const ar=u.air,br=Math.sin(performance.now()*.0018)*(1-u.sp);
u.legs[0].rotation.x=sw*(1-ar)-.55*ar;u.legs[1].rotation.x=-sw*(1-ar)+.35*ar;
u.kick*=Math.max(0,1-dt*14);
const hd=u.hold;
if(hd){
// both hands stay on the gun: it rides in a rig that tilts with aim and recoil
const th=-(aim||0)*.5-u.kick*.2;hd.rig.rotation.x=th;
_v1.copy(hd.tg).sub(hd.piv).applyAxisAngle(_xa,th).add(hd.piv);armIK(u.arms[0],_v1,_pr);
_v1.copy(hd.tf).sub(hd.piv).applyAxisAngle(_xa,th).add(hd.piv);armIK(u.arms[1],_v1,_pL)}
else{
u.arms[0].userData.el.rotation.set(0,0,0);u.arms[1].userData.el.rotation.set(0,0,0);
const ax=-1.38-(aim||0)*.8+u.kick*.35;
u.arms[1].rotation.set(ax,0,-.3);u.arms[0].rotation.set(ax+.05,0,.3)}
u.torso.rotation.x=.06*u.sp+.05*ar;u.torso.rotation.z=Math.sin(u.ph)*.035*u.sp;u.torso.position.y=1.26+Math.abs(Math.sin(u.ph))*.04*u.sp+br*.012-.03*ar;u.head.position.y=1.9+Math.abs(Math.sin(u.ph))*.04*u.sp+br*.016-.03*ar;
u.head.rotation.x=-(aim||0)*.5;u.head.rotation.z=-Math.sin(u.ph)*.05*u.sp}
// goofy anime run: body tipped far forward, arms streaming straight back, big wobbly legs and a bobbing head
function narutoPose(m,dt,sp,air){
const u=m.userData;u.nar=true;
u.sp+=(sp-u.sp)*Math.min(1,dt*10);const k=Math.min(1,u.sp*1.4),a=air?1:0;u.air=(u.air||0)+(a-(u.air||0))*Math.min(1,dt*12);
u.ph+=dt*(10+u.sp*9)*(u.sp>.05&&!air?1:0);const ph=u.ph,sw=Math.sin(ph);
const lean=k*(1.05-.35*u.air),c=Math.cos(lean),s=Math.sin(lean),bob=Math.abs(Math.sin(ph))*.07*k*(1-u.air);
u.torso.position.set(0,.9+.36*c+bob,.36*s);u.torso.rotation.set(lean,Math.sin(ph)*.12*k,0);
u.head.position.set(0,.9+1.0*c+bob,1.0*s+.05*k);u.head.rotation.set(-lean*.55+Math.sin(ph*2)*.1*k,0,Math.sin(ph)*.18*k);
const ay=.9+.66*c+bob,az=.66*s;
for(let i=0;i<2;i++){
const arm=u.arms[i],sd=i?1:-1;arm.position.set(sd*.36,ay,az);
const back=Math.PI/2+.4+Math.sin(ph*2+i)*.12*k;
arm.rotation.set(THREE.MathUtils.lerp(.05,back,k),0,sd*(.04+.16*k));
arm.userData.el.rotation.set(0,0,0)}
u.legs[0].rotation.x=THREE.MathUtils.lerp(sw*1.3+.3*k,-.9,u.air);u.legs[1].rotation.x=THREE.MathUtils.lerp(-sw*1.3+.3*k,.6,u.air);
m.rotation.z=Math.sin(ph)*.07*k}
function hurtFlash(m,on){m.userData.mats.forEach(x=>x.emissive.setHex(on?0x771111:(x.userData.em||0)))}
// emotes, returns vertical offset
function danceHuman(m,t,k,baseY){
const u=m.userData,a=u.arms,l=u.legs,s=Math.sin(t*9);m.rotation.set(0,baseY,0);m.scale.setScalar(.88);
a.forEach(x=>{x.rotation.set(0,0,0);if(x.userData.el)x.userData.el.rotation.set(0,0,0)});l.forEach(x=>x.rotation.set(0,0,0));u.torso.rotation.set(0,0,0);u.head.rotation.set(0,0,0);if(u.hold)u.hold.rig.rotation.x=0;let dy=0;
if(k==="spin"){m.rotation.y+=t*9;a[0].rotation.z=-1.5;a[1].rotation.z=1.5}
else if(k==="bnc"){dy=Math.abs(s)*.5;a[0].rotation.z=-1.2*Math.max(0,s);a[1].rotation.z=1.2*Math.max(0,s);l[0].rotation.x=-.3*Math.abs(s);l[1].rotation.x=-.3*Math.abs(s)}
else if(k==="wave"){a[1].rotation.z=2.7+Math.sin(t*12)*.35;a[1].rotation.x=0;u.head.rotation.z=Math.sin(t*3)*.1}
else if(k==="bot"){const q=Math.floor(t*4)%2?1.57:-1.57;a[1].rotation.z=Math.abs(q);a[0].rotation.z=-Math.abs(q);a[1].rotation.x=Math.floor(t*4)%2?-1.57:0;m.rotation.y+=Math.floor(t*3)*.8}
else if(k==="floss"){a[0].rotation.z=-1.1*s;a[1].rotation.z=-1.1*s;u.torso.rotation.z=s*.12;m.rotation.z=s*.1;l[0].rotation.x=s*.35;l[1].rotation.x=-s*.35}
else if(k==="flex"){a[0].rotation.z=-2.1;a[1].rotation.z=2.1;a[0].rotation.x=-.3;a[1].rotation.x=-.3;m.scale.setScalar(.88*(1+Math.abs(s)*.09))}
else if(k==="flip"){const ph=(t*1.1)%1,e=ph<.15?0:Math.min(1,(ph-.15)/.7);dy=Math.sin(e*Math.PI)*1.5;m.rotation.x=-easeIO(e)*Math.PI*2;a[0].rotation.z=-.3;a[1].rotation.z=.3}
else if(k==="lev"){dy=1+Math.sin(t*3)*.3;m.rotation.y+=t*5;a[0].rotation.z=-1.8;a[1].rotation.z=1.8;l[0].rotation.x=.2;l[1].rotation.x=-.2}
else{l[0].rotation.x=s*.6;l[1].rotation.x=-s*.6;a[0].rotation.z=-s*.9-.2;a[1].rotation.z=s*.9+.2;u.torso.rotation.y=s*.25}
return dy}

// ---------- monsters ----------
function mkMon(k){return Post.rim(YardArt.monster(k))}
function poseMon(m,dt,att){
const u=m.userData,p=m.position,sc=m.scale.y||1;
// the walk cycle is driven by the ground actually covered: one leg swing per step length, so the feet stay planted instead of skating
if(u.lx===undefined){u.lx=p.x;u.lz=p.z;u.v=0;u.amp=0;u.br=rnd()*6}
const d=Math.hypot(p.x-u.lx,p.z-u.lz);u.lx=p.x;u.lz=p.z;
const v=dt>0?d/dt:0,run=v<9&&v>.12?v:0;
u.v+=(run-u.v)*Math.min(1,dt*9);u.amp+=((run?clamp(.3+.085*u.v,.3,.78):0)-u.amp)*Math.min(1,dt*9);u.br+=dt*2.1;
const L=.7*sc;if(run)u.ph+=d*Math.PI/(2*L*Math.sin(Math.max(u.amp,.3)));
const a=u.amp/.6,sw=Math.sin(u.ph)*u.amp,br=Math.sin(u.br);
u.legs[0].rotation.x=sw;u.legs[1].rotation.x=-sw;
u.bob=L*(Math.cos(sw)-1); // body sinks as the legs spread, so the planted foot stays on the ground
u.kick=Math.max(0,u.kick-dt*3.2);const lift=-1.15-Math.sin(u.kick*Math.PI)*.9;
u.arms[0].rotation.set(lift+Math.cos(u.ph)*.11*a+br*.03,0,.1);u.arms[1].rotation.set(lift-Math.cos(u.ph)*.11*a+br*.03,0,-.1);
u.torso.rotation.set(.1+.07*clamp(u.v/4,0,1)+Math.abs(Math.cos(u.ph))*.03*a+br*.012,Math.sin(u.ph)*.15*a,0);u.head.rotation.z=Math.sin(u.ph)*.06*a+Math.sin(u.br*.6)*.035}

// ---------- death: accelerating fall away from the shooter, limp limbs on springs, thud, then sink ----------
const DQ={q:new T.Quaternion(),n:new T.Vector3()};
function deathInit(g,fx,fz,head,mon){
const u=g.userData,p=g.position,sa=(rnd()-.5)*.9,cs=Math.cos(sa),sn=Math.sin(sa);let dx=p.x-fx,dz=p.z-fz;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
if(u.head)u.head.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshBasicMaterial)o.material.color.setHex(0x111111)});
const L=[...u.arms,...u.legs].map((m,i)=>{const arm=i<u.arms.length,s=m.position.x<0?-1:1;
return{m,x:m.rotation.x,z:m.rotation.z,vx:(rnd()-.5)*5+(arm?-2:0),vz:s*(arm?3+rnd()*3:1+rnd()*1.5),tx:arm?-.3+(rnd()-.5)*.9:(rnd()-.5)*.7,tz:s*(arm?.9+rnd()*.7:.12+rnd()*.12)}});
const sc=g.scale.x;
return{g,t:0,f:{x:dx*cs-dz*sn,z:dx*sn+dz*cs},th:0,w:(head?2.8:1.3)+rnd()*.8,sl:(head?3.4:2.2)+rnd()*1.2,y0:p.y,thick:(mon?.3:.14)*sc,sc,mon,yaw:g.quaternion.clone(),L,
hd:{x:u.head?u.head.rotation.x:0,v:head?-4:-1.2,t:head?-.9:.3},tr:{x:u.torso?u.torso.rotation.x:0,v:0,t:mon?.45:.5},bn:0,land:0,tw:0}}
function deathStep(d,dt){
const g=d.g,u=g.userData,p=g.position;d.t+=dt;
if(!d.land){
d.w+=18*(Math.sin(d.th)+.22)*dt;d.th+=d.w*dt;
if(d.th>=1.52||d.t>2){d.th=Math.min(d.th,1.52);
if(!d.bn&&d.t<2){d.bn=1;d.w=-d.w*.2;snd("land",.55);Fx.burst({x:p.x,y:.15,z:p.z},d.mon?0x66ff44:0xbfae8c,8,3,.08,1,10)}
else{d.land=d.t;d.w=0}}
d.sl*=Math.exp(-dt*3.5);const nx=p.x+d.f.x*d.sl*dt,nz=p.z+d.f.z*d.sl*dt;
if(!blocked(nx,nz,0,.3)){p.x=nx;p.z=nz}else d.sl=0}
DQ.n.set(d.f.z,0,-d.f.x);DQ.q.setFromAxisAngle(DQ.n,d.th);g.quaternion.copy(DQ.q).multiply(d.yaw);
const fl=floorAt(p.x,p.z,d.y0+1.2);p.y=fl+Math.max(0,d.y0-fl)*Math.max(0,1-d.t*6)+d.thick*Math.sin(Math.min(d.th,1.5707));
for(const l of d.L){l.vx+=((l.tx-l.x)*70-l.vx*7)*dt;l.vz+=((l.tz-l.z)*70-l.vz*7)*dt;l.x+=l.vx*dt;l.z+=l.vz*dt;l.m.rotation.x=l.x;l.m.rotation.z=l.z}
if(u.head){const h=d.hd;h.v+=((h.t-h.x)*50-h.v*6)*dt;h.x+=h.v*dt;u.head.rotation.x=h.x}
if(u.torso){const t=d.tr;t.v+=((t.t-t.x)*40-t.v*6)*dt;t.x+=t.v*dt;u.torso.rotation.x=t.x}
if(d.land){const a=d.t-d.land;
if(d.tw<(d.mon?2:1)&&a>.25+d.tw*.45){d.tw++;d.L.forEach(l=>{l.vx+=(rnd()-.5)*5;l.vz+=(rnd()-.5)*3})}
const k=Math.min(1,Math.max(0,(a-2)));g.scale.setScalar(d.sc*(1-k*k));p.y-=k*.25;return k>=1}
return false}

// ---------- floating name tag ----------
// ---------- health bars: one shared bar for monsters, bots and remote players; it is rescaled every frame by camera distance so it stays the same size on screen, and it eases to the new value with a pale damage trail ----------
const HB=(()=>{
const list=new Set(),v3=new T.Vector3(),W=1.2,HH=.15;
const mat=(c,o)=>new T.SpriteMaterial({color:c,transparent:true,opacity:o==null?1:o,depthWrite:false,fog:false});
const spr=(m,w,h,x,ro,left)=>{const s=new T.Sprite(m);if(left)s.center.set(0,.5);s.scale.set(w,h,1);s.position.set(x,0,0);s.renderOrder=ro;s.raycast=()=>{};return s};
const hpCol=f=>f>.6?0x4ade80:f>.3?0xfbbf24:0xf43f5e;
function make(g,y,get,o){
o=o||{};const h=new T.Object3D();h.position.y=y;
const fr=spr(mat(0x000000,.8),W+.12,HH+.1,0,10),bk=spr(mat(0x1f2430,.95),W,HH,0,11),tr=spr(mat(0xf8fafc,.9),W,HH,-W/2,12,1),fl=spr(mat(0x4ade80),W,HH,-W/2,13,1),sh=spr(mat(0xffffff,.22),W,HH*.38,0,14);sh.position.y=HH*.22;
h.add(fr,bk,tr,fl,sh);g.add(h);
const b={h,fl,tr,fr,bk,sh,get,v:1,t:1,tv:1,hold:0,base:o.base||1,col:o.col||null,k:1,on:o.on!==false,show:true};
list.add(b);return b}
function remove(b){list.delete(b);if(b.h.parent)b.h.parent.remove(b.h);b.h.traverse(o=>{if(o.material)o.material.dispose()})}
function update(dt){
const cp=cam.position;
for(const b of list){
const g=b.h.parent;if(!g||!g.parent){remove(b);continue}
const s=b.get(),vis=g.visible&&s&&s.alive&&b.on;
b.h.visible=!!vis;if(!vis)continue;
const f=clamp(s.hp/s.max,0,1);
if(f<b.t-.001)b.hold=.42;
if(f>b.tv)b.tv=f;
b.t=f;
b.v+=(f-b.v)*Math.min(1,dt*16);
if(b.hold>0)b.hold-=dt;else if(b.tv>b.v)b.tv=Math.max(b.v,b.tv-dt*.9);
b.tr.scale.x=Math.max(.0001,W*b.tv);b.fl.scale.x=Math.max(.0001,W*b.v);
b.fl.material.color.setHex(s.col!=null?s.col:(b.col?b.col(f):hpCol(f)));
g.getWorldPosition(v3);const d=Math.hypot(v3.x-cp.x,v3.y-cp.y,v3.z-cp.z);
b.lt=(b.lt||0)-dt;if(b.lt<=0){b.lt=.3;const fa=d>34;if(fa!==b.fa){b.fa=fa;g.traverse(o=>{if(o.isMesh){if(o.userData.cs===undefined)o.userData.cs=o.castShadow;o.castShadow=!fa&&o.userData.cs}})}}
const gs=g.scale.x||1,k=clamp(d/15,.8,3.4)*b.base,far=s.far||90;
if(d>=far){b.h.visible=false;continue}
b.h.scale.setScalar(k/gs);const a=d<far-30?1:clamp((far-d)/30,0,1);
b.fr.material.opacity=.8*a;b.bk.material.opacity=.95*a;b.fl.material.opacity=a;b.tr.material.opacity=.9*a;b.sh.material.opacity=.22*a}}
return{make,remove,update,list}})();
function tag(txt,col,y){const c=document.createElement("canvas");c.width=256;c.height=64;const x=c.getContext("2d");x.font="bold 34px system-ui,sans-serif";x.textAlign="center";x.fillStyle=col;x.strokeStyle="#000";x.lineWidth=5;x.lineJoin="round";x.strokeText(txt,128,44);x.fillText(txt,128,44);
const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthWrite:false,fog:false}));s.scale.set(2,.5,1);s.position.y=y||2.5;s.raycast=()=>{};s.renderOrder=5;return s}

// ---------- thumbnails (offscreen renderer) ----------
const Thumb=(()=>{
let r=null,scn=null,tcam=null;const cache=new Map(),q=[];let busy=false;
function init(){if(r)return true;try{r=new T.WebGLRenderer({antialias:!SOFT,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(1)}catch(e){r=false;return false}
scn=new T.Scene();scn.add(new T.HemisphereLight(0xa9d2ce,0x7c7054,LU(.67)));const d=new T.DirectionalLight(0xffe0a5,LU(.85));d.position.set(3,4,5);scn.add(d);const rim=new T.DirectionalLight(0xa9d2ce,LU(.3));rim.position.set(-4,2,-3);scn.add(rim);const d2=new T.DirectionalLight(0xfff0d0,LU(.45));d2.position.set(-3,-1,4);scn.add(d2);
tcam=new T.PerspectiveCamera(30,1.6,.05,50);return true}
function make(kind,item,w,h){
if(!init())return"";r.setSize(w,h,false);tcam.aspect=w/h;tcam.updateProjectionMatrix();
let obj,ry=-.5,rx=.12,fit=1;
if(kind==="gun"){const b=buildGun(item,IDM[typeof item.skin==="string"?item.skin:"s"+(item.skin|0)]||SK[0]);obj=b.grp;obj.rotation.set(0,Math.PI/2+.5,0);ry=0;fit=1.15}
else if(kind==="skin"){const b=buildGun(GB("g2"),item);obj=b.grp;obj.rotation.set(0,Math.PI/2+.45,0);fit=1.1}
else if(kind==="knife"){const b=buildKnife(item);obj=b.grp;obj.rotation.set(0,-Math.PI/2-.35,.25);obj.rotation.x=0}
else{obj=mkHuman({body:item.c,trim:item.t,style:item.sty,gun:GB("g2")});obj.scale.setScalar(1);obj.rotation.y=.55;obj.traverse(m=>{if(m.isMesh)m.castShadow=false})}
scn.add(obj);const box=new T.Box3().setFromObject(obj),c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3()),
th=Math.tan(T.MathUtils.degToRad(tcam.fov/2)),span=Math.max(s.x,s.y*1.6,s.z)*fit,dist=kind==="out"?Math.max(s.x/(2*th*tcam.aspect),s.y/(2*th))*1.05:Math.max(s.x/(2*th*tcam.aspect),s.y/(2*th))*1.18/fit*1.0;
obj.position.sub(c);tcam.position.set(0,kind==="out"?0:.05,dist+Math.max(s.x,s.z)/2);tcam.lookAt(0,0,0);
r.render(scn,tcam);const url=r.domElement.toDataURL("image/png");scn.remove(obj);disposeGeo(obj);return url}
function get(kind,item,w,h){const key=kind+item.id+(item.skin!=null?item.skin:"")+w;return cache.get(key)}
function req(kind,item,w,h,cb){const key=kind+item.id+(item.skin!=null?item.skin:"")+w;if(cache.has(key)){cb(cache.get(key));return}
q.push({key,kind,item,w,h,cb});pump()}
function pump(){if(busy||!q.length)return;busy=true;setTimeout(()=>{const j=q.shift();if(j){try{let u=cache.get(j.key);if(!u){u=make(j.kind,j.item,j.w,j.h);cache.set(j.key,u)}j.cb(u)}catch(e){}}busy=false;pump()},SOFT?40:12)}
function flush(){q.length=0}
return{req,get,flush}})();

