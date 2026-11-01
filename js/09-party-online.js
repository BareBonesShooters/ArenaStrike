"use strict";
// ---------- party + online (PeerJS) ----------
const PT={on:false,online:false,host:false,coop:false,cw:0,cwT:0,mode:"ffa",goal:15,me:null,team:0,F:new Map(),remotes:new Map()};
const coopN=()=>PT.on&&PT.coop?1+PT.remotes.size:1,coopHp=()=>{const n=coopN();return n>1?1+.45*(n-1):1};
const Party=(()=>{
let sendT=0,botT=0,lastBy=null,lastHead=false;
const tm=()=>!!(PM_MODES[PT.mode]&&PM_MODES[PT.mode].team);
const friendly=r=>tm()&&r.team===PT.team;
function wipeRemotes(){for(const [,r] of PT.remotes){if(r.g){sc.remove(r.g);disposeGeo(r.g)}}PT.remotes.clear()}
function removeRemote(id){const r=PT.remotes.get(id);if(!r)return;if(r.g){sc.remove(r.g);disposeGeo(r.g)}PT.remotes.delete(id)}
function ensureRemote(id,name,team){
let r=PT.remotes.get(id);if(r)return r;
const blue=tm()&&(team===1||PT.coop),g=mkHuman({body:blue?0x3b82f6:0xef4444,trim:0x1f2937,gun:GB("g2")});
const tagM=tag(name||"Player",blue?"#60a5fa":"#f87171",2.9);g.add(tagM);
g.visible=false;sc.add(g);
r={id,name:name||"Player",team,g,tag:tagM,bar:null,hp:100,max:100,kills:0,deaths:0,x:0,y:0,z:0,yaw:0,dead:false,init:false,seen:performance.now(),mz:0,shoot:0,lx:0,lz:0};
r.bar=HB.make(g,2.55/(g.scale.x||1),()=>({hp:r.hp,max:r.max||100,alive:!r.dead&&r.hp>0,far:110,col:tm()?(r.team===PT.team?0x60a5fa:0xef4444):null}));
PT.remotes.set(id,r);return r}
function setBar(r){}
function board(){const rows=[];for(const [,r] of PT.remotes)rows.push({n:r.name,k:r.kills|0,d:r.deaths|0,t:r.team,me:0});if(PT.me)rows.push({n:S.name,k:PT.me.kills|0,d:PT.me.deaths|0,t:PT.team,me:1});return rows.sort((a,b)=>b.k-a.k)}
function targets(out){for(const [,r] of PT.remotes)if(r.hp>0&&!r.dead&&r.init&&!friendly(r)&&r.g&&r.g.userData&&r.g.userData.hit){for(const m of r.g.userData.hit){m.userData.remote=r.id;out.push(m)}}}
// attacker side: tell the victim, they own their health and report their own death
function hitRemote(id,d,head){
const r=PT.remotes.get(id);if(!r||r.dead||r.hp<=0||friendly(r)||P.dead>0)return;
Net.send({t:"hit",to:id,d:Math.round(d),head:head?1:0});
r.hp=Math.max(0,r.hp-(head?d*2:d));setBar(r);hitMark(!!head);snd(head?"head":"hit");if(head)qAdd("heads",1)}
function applyDmg(id,d,head){hitRemote(id,d,head)}
function shoot(){}
function stab(){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);for(const [,r] of PT.remotes){if(r.dead||!r.init||friendly(r))continue;const dx=r.g.position.x-P.x,dz=r.g.position.z-P.z,dd=Math.hypot(dx,dz)||1;if(dd<2.8&&(dx*fx+dz*fz)/dd>.4)hitRemote(r.id,KNIFE_D,false)}}
function sendFx(a,b,g){if(!PT.online||!Net.ready||!b)return;Net.send({t:"fx",w:g&&g.id?String(g.id):"",a:[+a.x.toFixed(2),+a.y.toFixed(2),+a.z.toFixed(2)],b:[+b.x.toFixed(2),+b.y.toFixed(2),+b.z.toFixed(2)]})}
function spawnSpot(initial){
const sp=WORLD.spawns&&WORLD.spawns.length?WORLD.spawns:[freeSpot(0,0)];
if(initial&&PT.online){const ros=Net.roster(),i=ros.findIndex(x=>x.id===Net.pid);if(i>=0)return sp[i%sp.length]}
const pool=sp.slice();for(let i=0;i<6;i++)pool.push(freeSpot((rnd()-.5)*H,(rnd()-.5)*H));
let best=pool[0],bd=-1;
for(const s of pool){let md=1e9;for(const [,r] of PT.remotes)if(!r.dead)md=Math.min(md,Math.hypot(r.x-s.x,r.z-s.z));for(const e of E)if(e.t==="bot")md=Math.min(md,Math.hypot(e.g.position.x-s.x,e.g.position.z-s.z));const v=md+rnd()*8;if(v>bd){bd=v;best=s}}
return best}
function respawn(){const s=spawnSpot(false);placePlayer(s,Math.atan2(s.x,s.z),0);P.prot=2;VM.swap();flash("Back in the fight",900)}
function die(src){
if(PT.coop){P.hp=0;P.dead=1e6;endEmote();PT.me.deaths=(PT.me.deaths|0)+1;flash("You are down. The squad can bring you back next wave",2800);Death.start({src,len:2.8,title:"DOWN",kick:"You're out of the fight",by:"Taken down by",label:"Your squad fights on",slow:!PT.online});return}
P.hp=0;P.dead=1e6;endEmote();PT.me.deaths=(PT.me.deaths|0)+1;
Death.start({src,ring:3,label:"Respawning",slow:!PT.online,done:()=>{if(state==="play"&&P.dead>0)respawn()}});
const r=lastBy&&PT.remotes.get(lastBy),bn=r?r.name:(PT.online?"":DF[diff].n),head=lastHead;
killFeed(bn||"Unknown",S.name,"",head,false);flash(bn?bn+" eliminated you":"You were eliminated",1400);
if(PT.online&&Net.ready)Net.send({t:"kill",by:lastBy,vn:S.name,bn:S.name?bn:"",head:head?1:0});
lastBy=null;lastHead=false}
function reward(){
snd("kill");const m=PT.mode;
if(m==="ffa"){P.hp=Math.min(P.max,P.hp+30);P.rush=4;flash("Kill Rush",700)}
else if(m==="duel1"){P.hp=P.max;flash("Round won",800)}
else if(m==="gg"){PT.me.lvl=(PT.me.lvl|0)+1;P.hp=Math.min(P.max,P.hp+40);const ng=cg();A.mag=ng.m;A.rl=0;VM.swap();flash("Next gun: "+ng.n,1200)}
checkWin()}
function myKill(head){PT.me.kills=(PT.me.kills|0)+1;qAdd("kills",1);reward()}
function botKilled(head){PT.me.kills=(PT.me.kills|0)+1;reward()}
function checkWin(){
if(state!=="play"||!PT.me)return;
let done;if(tm()){let t=PT.me.kills|0;for(const [,r] of PT.remotes)if(r.team===PT.team)t+=r.kills|0;done=t>=PT.goal}else done=(PT.me.kills|0)>=PT.goal;
if(done){PT.winner=S.name;if(PT.online&&Net.ready)Net.send({t:"win",name:S.name,team:PT.team});endGame(true)}}
function frame(dt){
const now=performance.now();
if(!PT.me)return;
if(PT.online&&Net.ready){sendT-=dt;if(sendT<=0){sendT=.05;Net.send({t:"st",cw:PT.cw|0,w:wave|0,x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(3),hp:Math.round(P.hp),dead:P.dead>0?1:0,name:S.name,team:PT.team,kills:PT.me.kills|0,deaths:PT.me.deaths|0})}}
if(P.dead>0&&state==="play"){P.dead-=dt;if(P.dead<=0)respawn()}
if(PT.coop)coopFrame(dt);
for(const [id,r] of PT.remotes){
if(now-r.seen>8000){removeRemote(id);continue}
const g=r.g;g.visible=r.init&&!r.dead;
if(!r.init)continue;
const age=Math.min(.12,(now-r.seen)/1000),tx=r.x+(r.vx||0)*age,tz=r.z+(r.vz||0)*age,kf=1-Math.exp(-dt*18);
if(Math.hypot(tx-g.position.x,tz-g.position.z)>8){g.position.x=tx;g.position.z=tz}
g.position.x+=(tx-g.position.x)*kf;g.position.z+=(tz-g.position.z)*kf;g.position.y+=(r.y-g.position.y)*Math.min(1,dt*20);
g.rotation.y=turnTo(g.rotation.y,r.yaw+Math.PI,dt*16);
const mv=dt>0?Math.hypot(g.position.x-r.lx,g.position.z-r.lz)/dt:0;r.lx=g.position.x;r.lz=g.position.z;
if(r.shoot>0)r.shoot-=dt;if(r.mz>0){r.mz-=dt;if(r.mz<=0)setMuzzle(g,false)}
poseHuman(g,dt,clamp(mv/5,0,1),r.shoot>0?1:0)}
// solo party only: bots fill the room
if(!PT.online&&!menuOpen&&P.dead<=0){
const want=PT.mode==="duel1"?1:PT.coop?0:S.mp.bots|0;let n=0;for(const e of E)if(e.t==="bot")n++;
if(n<want&&n<9){botT-=dt;if(botT<=0){spawnBot();botT=1.2}}}
if(!PT.coop)checkWin()}
// co-op: every client simulates its own copy of the wave, and the squad moves on together once every standing player has cleared it
function coopFrame(dt){
if(state!=="play"||!PT.me)return;
PT.me.kills=kills;
let alive=0,ready=true;for(const [,r] of PT.remotes)if(r.init&&!r.dead){alive++;if((r.cw|0)<wave)ready=false}
if(P.dead>0&&!alive){endGame(false);return}
const done=P.dead>0||(PT.cw===wave&&wn>=1e8);
if(!done)return;
PT.cwT+=dt;
if(ready||PT.cwT>30){PT.cwT=0;
for(const e of E.slice())dropModel(e.g,e.tag);E=[];projs.forEach(o=>sc.remove(o.m));projs.length=0;
if(P.dead>0){P.dead=0;respawn();P.hp=P.max*.5;P.prot=3;flash("Back on your feet",1400)}
wn=0;nextWave()}}
function hud(){if(PT.coop){let up=P.dead>0?0:1;for(const [,r] of PT.remotes)if(r.init&&!r.dead)up++;return{kc:null,rows:board().map(r=>[r.n,(r.k|0)+(r.me?" \u2605":""),r.me?"me":""]),top:"Wave "+wave,sub:(E.length+wq)+" monsters  \u00b7  "+up+" of "+(1+PT.remotes.size)+" standing"}}
const rows=board().map(r=>[r.n,(r.k|0)+(r.me?" \u2605":""),r.me?"me":""]);
let mine=PT.me?PT.me.kills|0:0;if(tm()){mine=PT.me.kills|0;for(const [,r] of PT.remotes)if(r.team===PT.team)mine+=r.kills|0}
return{kc:null,rows,top:mine+" / "+PT.goal,sub:PM_MODES[PT.mode]?PM_MODES[PT.mode].n:"Party"}}
function begin(asHost,online,cfg){
PT.on=true;PT.online=online;PT.host=!!asHost;PT.mode=(cfg&&cfg.mode)||S.mp.mode||"ffa";if(!PM_MODES[PT.mode])PT.mode="ffa";PT.goal=PM_MODES[PT.mode].goal;PT.winner="";PT.coop=PT.mode==="coop";PT.cw=0;PT.cwT=0;
myS=opS=kills=ggL=wave=wq=wn=bt=0;PU=PUbase();PU.on=PT.coop;xp=0;xpNeed=40;xpLevel=0;corrReset();
PT.team=0;if(online&&tm()){const t=cfg&&cfg.teams&&cfg.teams[Net.pid];PT.team=t!=null?t:(asHost?0:1)}
PT.me={kills:0,deaths:0,lvl:0};wipeRemotes();mode=PT.coop?"waves":"party";diff=(cfg&&cfg.diff)||S.mp.diff||"medium";lastBy=null;sendT=0;botT=0;
const seed=(cfg&&cfg.seed)!=null?cfg.seed:((rnd()*2147483647)|0),theme=(cfg&&cfg.theme&&THEMES[cfg.theme])?cfg.theme:pk(OUTDOOR);
beginPlay();buildWorld(PT.coop?"ruin":theme,seed,{waves:!!PT.coop});const s=spawnSpot(true);placePlayer(s,Math.atan2(s.x,s.z),0);P.hp=100;P.max=100;P.prot=2;if(PT.coop)nextWave();
state="play";document.body.classList.add("playing");$("hud").classList.remove("hid");Aim.request()}
function startSolo(){begin(true,false,null);flash("Party \u00b7 bots fill empty slots",1800)}
function startOnline(asHost,cfg){begin(asHost,true,cfg);flash(asHost?"You are hosting":"Joined match",1600)}
function onNet(msg,from){
if(!msg||!msg.t)return;
if(msg.t==="start"){if(!PT.host||!PT.on)startOnline(false,msg);return}
if(!PT.on||!PT.online)return;
const src=msg.f||from;
if(msg.t==="st"){
const r=ensureRemote(src,msg.name,tm()?(msg.team|0):0);
{const nx=+msg.x||0,nz=+msg.z||0,nw=performance.now(),dtm=(nw-r.seen)/1000;if(r.init&&dtm>.015&&dtm<.5){r.vx=(nx-r.x)/dtm;r.vz=(nz-r.z)/dtm}else{r.vx=r.vz=0}}
r.x=+msg.x||0;r.y=+msg.y||0;r.z=+msg.z||0;r.yaw=+msg.yaw||0;r.seen=performance.now();r.cw=msg.cw|0;r.team=tm()?(msg.team|0):0;r.kills=msg.kills|0;r.deaths=msg.deaths|0;r.name=msg.name||r.name;r.dead=!!msg.dead;
if(msg.hp!=null){r.hp=+msg.hp;setBar(r)}
if(!r.init){r.init=true;r.g.position.set(r.x,r.y,r.z);r.lx=r.x;r.lz=r.z}
return}
if(msg.t==="hit"){
if(msg.to!==Net.pid||P.dead>0||P.prot>0||P.fz>0||state!=="play")return;
const by=PT.remotes.get(src);if(by&&friendly(by))return;
lastBy=src;lastHead=!!msg.head;const d=clamp(+msg.d||10,1,160)*(msg.head?2:1);
hit(d,by?{x:by.x,z:by.z}:null);if(msg.head)flash("HEADSHOT",500);return}
if(msg.t==="kill"){
const vr=PT.remotes.get(src),vn=msg.vn||(vr?vr.name:"Player");
killFeed(msg.bn||"Unknown",vn,"",!!msg.head,msg.by===Net.pid);
if(msg.by===Net.pid)myKill(!!msg.head);return}
if(msg.t==="fx"){
if(!Array.isArray(msg.a)||!Array.isArray(msg.b))return;
const a=new T.Vector3(+msg.a[0]||0,+msg.a[1]||0,+msg.a[2]||0),b=new T.Vector3(+msg.b[0]||0,+msg.b[1]||0,+msg.b[2]||0);
Fx.tracer(a,b,0xffee99,.022);Fx.burst(b,0xffe9a0,3,3.5,.05,1.2,12);
const r=PT.remotes.get(src);if(r){setMuzzle(r.g,true);r.mz=.06;r.shoot=.4;r.g.userData.kick=1}
gunSnd((typeof msg.w==="string"&&GB(msg.w))||G[0],"fire",clamp(1-Math.hypot(a.x-P.x,a.z-P.z)/70,.08,.6));return}
if(msg.t==="win"){if(state==="over")return;PT.winner=msg.name||"Another player";endGame(tm()?msg.team===PT.team:false);return}
if(msg.t==="bye"){removeRemote(msg.id||src);return}}
function leave(){wipeRemotes();PT.on=false;PT.online=false;PT.host=false;PT.coop=false;PT.me=null;lastBy=null}
return{board,targets,shoot,stab,sendFx,frame,hud,startSolo,startOnline,onNet,leave,wipe:wipeRemotes,tryHitRemote:()=>false,wipeRemotes,applyDmg,die,botKilled,spawnSpot}})();

const Net=(()=>{
let peer=null,conns=new Map(),pid="",rosterList=[],mode="ffa",bots=5,diff="medium",ready=false,lastStart=null,leaving=false,keepT=null;
const api={state:"idle",code:"",err:"",onChange:null,get pid(){return pid},get ready(){return ready},
roster(){return rosterList.slice()},
fire(){if(api.onChange)api.onChange()},
setMode(m){mode=m;broadcast({t:"meta",mode,bots,diff})},
setBots(n){bots=n|0;broadcast({t:"meta",mode,bots,diff})},
send(msg){const j=msg;for(const [,c] of conns)if(c.open)try{c.send(j)}catch(e){}},
host(code0){
if(typeof Peer==="undefined"){api.err="PeerJS failed to load. Check your internet connection.";api.fire();return}
api.state="starting";api.err="";leaving=false;api.fire();
const code=code0||(""+Math.random().toString(36).slice(2,7)).toUpperCase();
try{if(peer)peer.destroy()}catch(e){}
const p=peer=new Peer("arena3d-"+code,{debug:0});
p.on("open",id=>{if(peer!==p)return;pid=id;api.code=code;api.state="hosting";ready=true;if(!rosterList.some(r=>r.id===pid))rosterList=[{id:pid,name:S.name,host:1,team:0}];api.err="";keepOn();api.fire();if(!code0)toast("Server code "+code)});
p.on("connection",c=>wire(c,true));
guard(p,{host:1,code});
},
join(code){
code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
if(code.length<4){api.err="Enter a valid room code";api.fire();return}
if(typeof Peer==="undefined"){api.err="PeerJS failed to load. Check your internet connection.";api.fire();return}
api.state="starting";api.err="";leaving=false;api.fire();
try{if(peer)peer.destroy()}catch(e){}
const p=peer=new Peer({debug:0});
p.on("open",id=>{if(peer!==p)return;pid=id;const c=peer.connect("arena3d-"+code,{reliable:true});wire(c,false);api.code=code;
c.on("open",()=>{api.state="joined";ready=true;api.err="";keepOn();api.fire();c.send({t:"hello",name:S.name,id:pid});toast("Joined "+code)});
c.on("error",()=>{api.err="Could not reach host";api.state="idle";api.fire()})});
guard(p,{host:0,code});
},
// a room only ends when somebody leaves it on purpose: here is the one place that tears it down
leave(){leaving=true;keepOff();try{if(ready)broadcast({t:"bye",id:pid})}catch(e){}lastStart=null;ready=false;for(const [,c] of conns)try{c.close()}catch(e){}conns.clear();try{if(peer)peer.destroy()}catch(e){}peer=null;api.state="idle";api.code="";rosterList=[];Party.leave();api.fire()},
// leave the match but stay in the room: the host ending it sends everybody back to the lobby together, a guest just steps out
exitMatch(){if(!ready)return;if(api.state==="hosting"){lastStart=null;broadcast({t:"back"})}else{try{api.send({t:"bye",id:pid})}catch(e){}}api.fire()},
setTeam(id){if(api.state!=="hosting")return;const r=rosterList.find(x=>x.id===id);if(!r)return;r.team=r.team?0:1;broadcast({t:"roster",list:rosterList});api.fire()},
kick(id){if(api.state!=="hosting"||id===pid)return;const c=conns.get(id);if(c){try{c.send({t:"kick"})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},120)}},
start(){if(api.state!=="hosting")return;
const m=S.mp.mode,n=rosterList.length;
if(n<2){api.err="Nobody has joined yet. Share your code first, or play solo with bots";api.fire();return}
if(m==="duel1"&&n!==2){api.err="A 1v1 needs exactly two players";api.fire();return}
api.err="";const seed=(rnd()*2147483647)|0,teams={};rosterList.forEach((r,n)=>{teams[r.id]=m==="coop"?0:(r.team!=null?r.team:n%2)});const cfg={t:"start",mode:S.mp.mode,diff:S.mp.diff,seed,theme:pk(OUTDOOR),teams};lastStart=cfg;broadcast(cfg);Party.startOnline(true,cfg)}};
const SOFT={network:1,"server-error":1,"socket-error":1,"socket-closed":1,disconnected:1};
const balTeam=()=>{let a=0,b=0;for(const r of rosterList)r.team?b++:a++;return a<=b?0:1};
// the broker drops idle signalling sockets after a while: win the connection back instead of tearing the room down
function guard(p,o){
const back=()=>{if(leaving||peer!==p||p.destroyed)return;try{if(p.disconnected)p.reconnect()}catch(e){}};
p.on("disconnected",()=>setTimeout(back,1200));
p.on("close",()=>{if(leaving||peer!==p)return;if(o.host&&api.state==="hosting")setTimeout(()=>{if(!leaving&&peer===p)api.host(o.code)},800)});
p.on("error",e=>{const ty=e&&e.type;if(leaving||peer!==p)return;
if(SOFT[ty]){setTimeout(back,1500);return}
if(ty==="unavailable-id"&&o.host&&api.state==="starting"){api.host();return}
if(ty==="peer-unavailable"){api.err="No server with that code";api.state="idle";ready=false;api.fire();return}
api.err=String((e&&(e.type||e.message))||e);if(api.state==="starting"){api.state="idle";ready=false}api.fire()})}
function keepOn(){keepOff();keepT=setInterval(()=>{if(leaving||!peer)return;try{if(peer.disconnected)peer.reconnect()}catch(e){}broadcast({t:"ping"})},10000)}
function keepOff(){if(keepT){clearInterval(keepT);keepT=null}}
function broadcast(msg){for(const [,c] of conns)if(c.open)try{c.send(msg)}catch(e){}}
const RELAY={st:1,hit:1,kill:1,fx:1,win:1,bye:1};
function wire(c,asHost){
c.on("open",()=>{conns.set(c.peer,c);if(asHost){if(!rosterList.some(x=>x.id===c.peer))rosterList.push({id:c.peer,name:"Player",host:0,team:balTeam()});broadcast({t:"roster",list:rosterList});c.send({t:"meta",mode:S.mp.mode,bots:S.mp.bots,diff:S.mp.diff});
if(lastStart&&PT.on)c.send(Object.assign({},lastStart,{teams:Object.assign({},lastStart.teams,{[c.peer]:S.mp.mode==="coop"?0:((rosterList.find(x=>x.id===c.peer)||{}).team|0)})}));api.fire()}});
c.on("data",msg=>{
if(!msg||!msg.t||msg.t==="ping")return;
if(msg.t==="back"){if(!asHost&&PT.on){lastStart=null;try{flash("The host ended the match",1800);quit()}catch(e){}}return}
if(msg.t==="kick"){if(!asHost){try{flash("The host removed you from the server",2200);if(PT.on)quit()}catch(e){}api.leave()}return}
if(msg.t==="hello"){const i=rosterList.find(x=>x.id===c.peer);if(i)i.name=msg.name;else rosterList.push({id:c.peer,name:msg.name,host:0,team:balTeam()});broadcast({t:"roster",list:rosterList});api.fire()}
if(msg.t==="roster"){rosterList=msg.list||rosterList;api.fire()}
if(msg.t==="meta"){if(msg.mode)S.mp.mode=msg.mode;if(msg.bots!=null)S.mp.bots=msg.bots;if(msg.diff)S.mp.diff=msg.diff;api.fire()}
// the host is the hub: it passes every player's messages on to the others so clients can see and fight each other
if(asHost&&RELAY[msg.t]){msg.f=c.peer;if(msg.to){const o=conns.get(msg.to);if(o&&o.open&&o!==c)try{o.send(msg)}catch(e){}}else for(const [,o] of conns)if(o!==c&&o.open)try{o.send(msg)}catch(e){}}
Party.onNet(msg,c.peer)});
c.on("close",()=>{conns.delete(c.peer);rosterList=rosterList.filter(x=>x.id!==c.peer);try{Party.onNet({t:"bye",id:c.peer},c.peer)}catch(e){}
if(asHost){broadcast({t:"roster",list:rosterList});broadcast({t:"bye",id:c.peer})}
else{const inGame=PT.on;try{flash("Host left the match",2500)}catch(e){}setTimeout(()=>{try{if(inGame)quit();api.leave()}catch(e){}},inGame?400:0)}
api.fire()})}
return api})();
