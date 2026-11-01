"use strict";
// Rules are separate from rendering so budgets, placement and battle results can be tested.
const BattleRules=(()=>{
const troops=[
{id:"brawler",n:"Brawler",icon:"blade",cost:70,hp:90,speed:2.9,damage:19,reach:1.6,rate:.85,human:true,tip:"Cheap melee troops. Strong together; weak against blasts."},
{id:"shield",n:"Shield Guard",icon:"shield",cost:140,hp:230,speed:1.8,damage:17,reach:1.8,rate:1.1,human:true,shield:true,tip:"Blocks 75% of frontal ranged damage. Protects your back line."},
{id:"rifle",n:"Rifleman",icon:"gun",cost:160,hp:65,speed:2.2,damage:24,reach:24,rate:1.15,human:true,ranged:true,tip:"Long range, low health. Runners can overwhelm it."},
{id:"runner",n:"Runner",icon:"bolt",cost:65,hp:48,speed:5.8,damage:13,reach:1.4,rate:.65,k:1,tip:"Fast monster that closes the gap on ranged troops."},
{id:"brute",n:"Brute",icon:"skull",cost:260,hp:340,speed:1.65,damage:42,reach:2.7,rate:1.65,k:2,splash:2.8,tip:"Heavy sweeping attacks punish tightly packed groups."},
{id:"spitter",n:"Spitter",icon:"flame",cost:170,hp:95,speed:2.4,damage:21,reach:19,rate:1.3,k:0,ranged:true,poison:true,tip:"Toxic shots keep hurting their target for a short time."},
{id:"bomber",n:"Bomber",icon:"burst",cost:120,hp:60,speed:3.8,damage:110,reach:2.1,rate:1,k:0,bomb:true,splash:5,tip:"Explodes once on contact. Spread out to limit the damage."},
{id:"ghost",n:"Ghost",icon:"eclipse",cost:220,hp:85,speed:3.1,damage:19,reach:20,rate:.85,k:1,ranged:true,hover:1.3,tip:"Hovers and fires spectral bolts. Ranged troops can reach it."},
{id:"titan",n:"Titan",icon:"crown",cost:650,hp:1000,speed:1.25,damage:66,reach:3.7,rate:2,k:2,splash:4,scale:2.1,tip:"Huge health and stomps. Expensive and vulnerable to focused fire."}
];
const line=(id,n,x,z,gap=3)=>Array.from({length:n},(_,i)=>({id,x,z:z+(i-(n-1)/2)*gap,team:1}));
const levels=[
{n:"First clash",budget:320,hint:"Four brawlers hold the line. Spend carefully and attack together.",enemy:line("brawler",4,13,0)},
{n:"Firing line",budget:510,hint:"Riflemen punish a slow advance. Close the distance or protect your troops.",enemy:line("rifle",3,18,0,6)},
{n:"The shield wall",budget:850,hint:"Guards cover a ranged back line. Try flanking their shields.",enemy:[...line("shield",3,10,0),...line("rifle",3,19,0,5)]},
{n:"The swarm",budget:850,hint:"Twelve runners rush forward. Area attacks can break their numbers.",enemy:[...line("runner",6,12,0),...line("runner",6,17,0)]},
{n:"Toxic approach",budget:1250,hint:"Spitters and bombers punish a packed formation. Leave space between units.",enemy:[...line("spitter",4,22,0,5),...line("bomber",4,11,0,5),...line("shield",2,16,0,12)]},
{n:"Haunted field",budget:1500,hint:"Ghosts attack from above while brutes hold the ground.",enemy:[...line("ghost",4,23,0,6),...line("brute",2,12,0,12)]},
{n:"The final stand",budget:2200,hint:"A titan leads a mixed army. Build a force that covers several weaknesses.",enemy:[...line("titan",1,13,0),...line("shield",2,15,0,14),...line("rifle",4,24,0,6),...line("runner",4,19,0,7)]}
];
const troop=id=>troops.find(t=>t.id===id),spent=(layout,team=0)=>layout.filter(u=>u.team===team).reduce((sum,u)=>sum+(troop(u.id)?.cost||0),0);
function placement(layout,id,team,x,z,campaign,level){
const t=troop(id),limit=campaign?34:115;
if(!t||![0,1].includes(team)||!Number.isFinite(x)||!Number.isFinite(z))return"Choose a valid unit and team.";
if(Math.abs(x)>limit||Math.abs(z)>limit)return"Place inside the marked battlefield.";
if(layout.length>=60)return"The field supports up to 60 units.";
if(campaign&&(team!==0||x>-2))return"Place your army on the blue side of the field.";
if(campaign&&spent(layout)+t.cost>levels[level].budget)return"Not enough budget. Remove a unit to refund its cost.";
if(layout.some(u=>Math.hypot(u.x-x,u.z-z)<(troop(u.id).scale||1)+(t.scale||1)))return"Leave a little space between units.";
return"";
}
function result(blue,red){return blue===0&&red===0?"draw":red===0?"blue":blue===0?"red":null}
return{troops,levels,troop,spent,placement,result,isMode:m=>m==="battle_sim"||m==="sandbox"};
})();

const CustomBattle=(()=>{
let active=false,joined=false,campaign=false,level=0,team=0,pick=0,running=false,started=false,finished=null;
let resetLayout=null,layout=[],units=[],bodies=[],shots=[],ui=null,stage=null,marker=null,hover=null,erase=false,drag=false,lastX=0,lastY=0,serial=0,notice="",hudTime=0;
let speed=1,playerTeam=0,restoreCamera=null,pointer={x:0,y:0,seen:false};
const ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),point=new T.Vector3();
const colors=[0x55baff,0xff606d],hex=["#55baff","#ff606d"];
const alive=team=>units.filter(u=>u.team===team&&u.hp>0);
function dispose(g){
if(!g)return;g.parent?.remove(g);
const shared=new Set([MDK,MMT,MWD,MGL,MBL,MRD,MMG,RAILM,HURT,BLOBM,...Object.values(SKM)]),geos=new Set(),mats=new Set(),maps=new Set();
g.traverse(o=>{if(o.geometry&&o.geometry!==BLOBG&&!o.isSprite)geos.add(o.geometry);for(const m of o.material?[].concat(o.material):[])if(!shared.has(m)){mats.add(m);if(m.map&&m.map!==FLASH&&m.map!==SOFTDOT&&m.map!==ENV)maps.add(m.map)}});
geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());maps.forEach(t=>t.dispose());
}
function clearUnits(){
for(const u of units){if(u.bar)HB.remove(u.bar);dispose(u.g)}
for(const b of bodies)dispose(b.g);for(const s of shots)dispose(s.mesh);
units=[];bodies=[];shots=[];E=E.filter(e=>!e.custom);
}
function stop(){
if(!active)return;active=false;joined=false;drag=false;clearUnits();dispose(stage);stage=marker=null;ui?.remove();ui=null;layout=[];resetLayout=null;
document.body.classList.remove("custom-battle","custom-joined");clearKeys();
}
function makeUnit(entry){
const t=BattleRules.troop(entry.id),col=colors[entry.team];
const g=t.human?mkHuman({body:col,trim:0xe2e8f0,style:t.shield?"armor":null,gun:t.ranged?GB("g2"):null}):mkMon(t.k);
if(!t.human){g.userData.mats.forEach(m=>m.color.lerp(new T.Color(col),.45));if(t.scale)g.scale.multiplyScalar(t.scale)}
if(t.hover){g.userData.mats.forEach(m=>{m.transparent=true;m.opacity=.65;m.emissive.setHex(col);m.emissiveIntensity=.2})}
if(t.shield){const s=new T.Mesh(new T.BoxGeometry(.85,1.1,.12),new T.MeshLambertMaterial({color:col}));s.position.set(-.28,1.12,.45);g.add(s);g.userData.hit.push(s)}
if(t.bomb){const b=new T.Mesh(new T.SphereGeometry(.35,10,8),new T.MeshBasicMaterial({color:0xffb347}));b.position.set(0,1.4,.35);g.add(b)}
const ring=new T.Mesh(new T.RingGeometry(.72,.9,24),new T.MeshBasicMaterial({color:col,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.045;ring.raycast=()=>{};g.add(ring);
const u={custom:true,id:++serial,entry,t,team:entry.team,g,hp:t.hp,hpMax:t.hp,cd:.25+rnd()*.4,retarget:0,target:null,hf:0,vx:0,vz:0,poison:0,poisonTick:0,ph:rnd()*6,rad:(t.scale||1)*.55};
g.position.set(entry.x,t.hover||0,entry.z);g.rotation.y=entry.team?-Math.PI/2:Math.PI/2;
u.bar=HB.make(g,2.7,()=>({hp:u.hp,max:u.hpMax,alive:u.hp>0,far:250}),{col:()=>col,base:.8});
bindOwner(g,u);sc.add(g);units.push(u);E.push(u);return u;
}
function overview(){
if(joined)returnToFlight();P.x=campaign?-26:0;P.z=campaign?28:40;P.y=campaign?34:40;P.yaw=campaign?-.65:0;P.pitch=-.78;P.vx=P.vz=P.vy=0;
cam.position.set(P.x,P.y,P.z);cam.rotation.set(P.pitch,P.yaw,0,"YXZ");cam.fov=65;cam.updateProjectionMatrix();
}
function battlefield(){
stage=new T.Group();sc.add(stage);const size=campaign?72:236;
const grid=new T.GridHelper(size,campaign?24:40,0xb6c3c9,0x5d8065);grid.position.y=.025;grid.material.transparent=true;grid.material.opacity=.25;stage.add(grid);
if(campaign){for(let i=0;i<2;i++){const zone=new T.Mesh(new T.PlaneGeometry(34,68),new T.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.1,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.set(i?19:-19,.015,0);stage.add(zone)}}
marker=new T.Mesh(new T.RingGeometry(.75,1,32),new T.MeshBasicMaterial({color:colors[0],side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;stage.add(marker);
}
function loadLevel(n){
level=Math.max(0,Math.min(BattleRules.levels.length-1,n));resetLayout=null;clearUnits();layout=campaign?BattleRules.levels[level].enemy.map(e=>({...e})):[];
layout.forEach(makeUnit);running=started=false;finished=null;team=0;erase=false;notice=campaign?"Place troops on the blue side, then start the battle.":"Choose a team and unit, then click the ground to place it.";overview();paint();
}
function start(m){
if(!BattleRules.isMode(m)||!DevAccess.unlocked){toast("Enter the developer code to unlock Custom mode.");return false}
Party.leave();Death.stop();corrReset();clearEnts();Fx.clear();clearKeys();
mode=m;grind=false;campaign=m==="battle_sim";active=true;joined=false;speed=1;pick=0;level=0;P.max=100;PU=PUbase();
rL=0;P.fz=0;P.dead=0;slot=0;knifeCD=0;nextShot=0;wave=0;wq=wn=0;placePlayer({x:0,z:28},0,0);
buildWorld("meadow",81261,{empty:true,custom:true});sc.fog=new T.Fog(0xb9d6d2,130,320);battlefield();
ui=document.createElement("section");ui.id="custom-battle-ui";ui.setAttribute("aria-label",campaign?"Battle Simulator controls":"Sandbox controls");document.body.appendChild(ui);
state="play";menuOpen=false;show("");$("hud").classList.remove("hid");document.body.classList.add("custom-battle");document.body.classList.remove("playing");Aim.release();
Mus.set("battle");loadLevel(0);return true;
}
function message(text){notice=text;paint()}
function add(x,z){
if(joined||campaign&&started)return;
if(erase){removeAt(x,z);return}
const id=BattleRules.troops[pick].id,err=BattleRules.placement(layout,id,team,x,z,campaign,level);
if(err){message(err);snd("err",.3);return}
const entry={id,team,x,z};layout.push(entry);makeUnit(entry);finished=null;notice="Placed "+BattleRules.troop(id).n+" for "+(team?"Red":"Blue")+".";snd("ui",.35);paint();
}
function removeAt(x,z){
if(campaign&&started)return;
const found=units.filter(u=>!campaign||u.team===0).sort((a,b)=>Math.hypot(a.g.position.x-x,a.g.position.z-z)-Math.hypot(b.g.position.x-x,b.g.position.z-z))[0];
if(!found||Math.hypot(found.g.position.x-x,found.g.position.z-z)>3){message("Click near a unit to remove it.");return}
layout=layout.filter(e=>e!==found.entry);units=units.filter(e=>e!==found);E=E.filter(e=>e!==found);HB.remove(found.bar);dispose(found.g);paint();
}
function reset(){
if(joined)returnToFlight();clearUnits();if(resetLayout)layout=resetLayout.map(e=>({...e}));resetLayout=null;layout.forEach(makeUnit);running=started=false;finished=null;notice="Formation restored. Edit your army, then start the battle.";paint();
}
function clear(){
if(campaign&&started)return;
const retained=campaign?layout.filter(e=>e.team===1):layout.filter(e=>e.team!==team);
resetLayout=null;clearUnits();layout=retained;layout.forEach(makeUnit);running=started=false;finished=null;paint();
}
function fight(){
if(finished){reset();return}
if(!alive(0).length||!alive(1).length){message("Place at least one unit on each team first.");return}
if(!started)resetLayout=layout.map(e=>({...e}));started=true;running=!running;notice=running?"Battle running.":"Battle paused. Press Continue battle to resume.";paint();
}
function sample(){
if(campaign)return;resetLayout=null;clearUnits();layout=[];for(let side=0;side<2;side++)for(let i=0;i<6;i++)layout.push({id:["brawler","shield","rifle","runner","spitter","brute"][i],team:side,x:side?16:-16,z:(i-2.5)*4});
layout.forEach(makeUnit);running=started=false;finished=null;notice="Two sample armies are ready. Add more units or start the battle.";overview();paint();
}
function join(side){
if(campaign||!started||finished){message("Start a Sandbox battle before joining a team.");return}
if(!joined)restoreCamera={x:P.x,y:P.y,z:P.z,yaw:P.yaw,pitch:P.pitch};
playerTeam=side;joined=true;running=true;clearKeys();slot=0;P.max=100;placePlayer({x:side?26:-26,z:18},side?Math.PI/2:-Math.PI/2,0);P.prot=2;
cam.fov=75;cam.updateProjectionMatrix();document.body.classList.add("playing","custom-joined");Aim.reset();Aim.request();notice="F returns to flight. Your team is "+(side?"Red":"Blue")+".";paint();
}
function returnToFlight(){
if(!joined)return;joined=false;Aim.release();clearKeys();P.dead=0;P.hp=100;P.fz=0;P.em=null;
if(restoreCamera)Object.assign(P,restoreCamera);else{P.y=24;P.pitch=-.7}
P.vx=P.vz=P.vy=0;document.body.classList.remove("playing","custom-joined");Scope.frame(cg(),false,65);paint();
}
function playerHurt(d,src){
if(!joined||!running||P.prot>0)return;P.hp=Math.max(0,P.hp-d);dmgFlash();snd("hurt",.45);
if(P.hp<=0){returnToFlight();message("You were defeated. Watch from above or join again.")}
}
function enemies(u){
const list=units.filter(v=>v.hp>0&&v.team!==u.team);
if(joined&&playerTeam!==u.team&&P.hp>0)list.push({player:true,team:playerTeam,hp:P.hp,g:{position:{x:P.x,y:P.y,z:P.z}},rad:.45});
return list;
}
function damage(u,amount,from,ranged=false,head=false){
if(!active||!running||u.hp<=0||from&&from.team===u.team)return;
if(u.player){playerHurt(amount,from?.g.position);return}
if(u.t.shield&&ranged&&from){const p=u.g.position,q=from.g.position,dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz)||1;if((dx*Math.sin(u.g.rotation.y)+dz*Math.cos(u.g.rotation.y))/d>.3)amount*=.25}
u.hp-=amount*(head?2:1);hurtFlash(u.g,true);u.hf=.12;
if(from){const dx=u.g.position.x-from.g.position.x,dz=u.g.position.z-from.g.position.z,l=Math.hypot(dx,dz)||1;u.vx+=dx/l*Math.min(8,amount/9)/(u.t.scale||1);u.vz+=dz/l*Math.min(8,amount/9)/(u.t.scale||1)}
if(u.hp<=0){
if(!campaign)layout=layout.filter(e=>e!==u.entry);
HB.remove(u.bar);units=units.filter(v=>v!==u);E=E.filter(v=>v!==u);
const p=from?.g.position||{x:u.g.position.x+1,z:u.g.position.z};bodies.push(deathInit(u.g,p.x,p.z,false,!u.t.human));
Fx.burst({x:u.g.position.x,y:1,z:u.g.position.z},colors[u.team],7,3,.08,2,12);
}
}
function playerDamage(u,d,head,pt){
if(!joined||!running||u.team===playerTeam)return;
damage(u,d,{team:playerTeam,g:{position:{x:P.x,y:P.y,z:P.z}}},slot===0,head);hitMark(head);snd(head?"head":"hit",.5);
if(pt)Fx.burst(pt,colors[u.team],4,3,.06,1,12);
}
function launch(u,target){
const a=u.g.position,b=target.g.position,origin=new T.Vector3(a.x,a.y+1.25*(u.t.scale||1),a.z),aim=new T.Vector3(b.x,b.y+(target.player?1:1.2)*(target.t?.scale||1),b.z),v=aim.sub(origin).normalize().multiplyScalar(u.t.id==="rifle"?36:22);
const mesh=new T.Mesh(new T.SphereGeometry(u.t.id==="rifle"?.08:.17,6,5),new T.MeshBasicMaterial({color:u.t.poison?0xb6ff6a:colors[u.team]}));mesh.position.copy(origin);sc.add(mesh);shots.push({mesh,v,owner:u,life:2.5});
if(u.t.human){u.g.userData.kick=1;setMuzzle(u.g,true);u.flash=.08}
}
function stepUnit(u,dt){
const p=u.g.position;u.cd-=dt;u.retarget-=dt;u.hf-=dt;if(u.hf<=0)hurtFlash(u.g,false);
if(u.flash>0){u.flash-=dt;if(u.flash<=0)setMuzzle(u.g,false)}
if(u.poison>0){u.poison-=dt;u.poisonTick-=dt;if(u.poisonTick<=0){u.poisonTick=.5;damage(u,4,u.poisonFrom,true);if(u.hp<=0)return}}
if(u.retarget<=0||!u.target||u.target.hp<=0||u.target.player&&!joined){u.retarget=.25;u.target=enemies(u).sort((a,b)=>Math.hypot(a.g.position.x-p.x,a.g.position.z-p.z)-Math.hypot(b.g.position.x-p.x,b.g.position.z-p.z))[0]}
const target=u.target;if(!target)return;if(target.player)target.g.position={x:P.x,y:P.y,z:P.z};
const q=target.g.position,dx=q.x-p.x,dz=q.z-p.z,dist=Math.hypot(dx,dz)||1,stop=u.t.reach+(target.rad||.5);
u.g.rotation.y=turnTo(u.g.rotation.y,Math.atan2(dx,dz),dt*7);
let move=dist>stop?1:u.t.ranged&&dist<7?-.55:0,vx=dx/dist*u.t.speed*move,vz=dz/dist*u.t.speed*move;
for(const other of units){if(other===u)continue;const ox=p.x-other.g.position.x,oz=p.z-other.g.position.z,d=Math.hypot(ox,oz),r=u.rad+other.rad;if(d>0&&d<r){vx+=ox/d*(r-d)*3;vz+=oz/d*(r-d)*3}}
p.x=clamp(p.x+(vx+u.vx)*dt,-117,117);p.z=clamp(p.z+(vz+u.vz)*dt,-117,117);u.vx*=Math.exp(-dt*7);u.vz*=Math.exp(-dt*7);
if(!campaign){u.entry.x=p.x;u.entry.z=p.z}
p.y=u.t.hover?u.t.hover+Math.sin(performance.now()*.002+u.ph)*.15:0;
if(u.t.human)poseHuman(u.g,dt,Math.abs(move)*.6,0,false);else poseMon(u.g,dt,dist<=stop);
if(dist<=stop&&u.cd<=0){u.cd=u.t.rate;
if(u.t.ranged)launch(u,target);
else{
u.g.userData.kick=1;
if(u.t.splash){for(const v of enemies(u))if(Math.hypot(v.g.position.x-p.x,v.g.position.z-p.z)<u.t.splash+(v.rad||.5))damage(v,u.t.damage,u);
Fx.burst({x:p.x,y:.5,z:p.z},u.t.bomb?0xffb347:colors[u.team],u.t.bomb?25:10,5,.12,3,16);
}else damage(target,u.t.damage,u);
if(u.t.bomb)damage(u,u.hp+1,null);
}}
}
function stepShots(dt){
for(let i=shots.length-1;i>=0;i--){const s=shots[i],a=s.mesh.position.clone(),b=a.clone().addScaledVector(s.v,dt),segment=new T.Line3(a,b),closest=new T.Vector3();s.life-=dt;let struck=null,best=Infinity;
for(const v of enemies(s.owner)){const p=v.g.position,center=new T.Vector3(p.x,p.y+(v.player?1:1.2)*(v.t?.scale||1),p.z);segment.closestPointToPoint(center,true,closest);const radius=(v.rad||.5)+.25;
if(closest.distanceTo(center)<radius&&a.distanceToSquared(closest)<best){best=a.distanceToSquared(closest);struck=v}}
s.mesh.position.copy(b);
if(struck){damage(struck,s.owner.t.damage,s.owner,true);if(s.owner.t.poison&&!struck.player&&struck.hp>0){struck.poison=3;struck.poisonTick=.5;struck.poisonFrom=s.owner}Fx.burst(b,colors[s.owner.team],4,2,.06,1,10)}
if(struck||s.life<=0||b.y<0){dispose(s.mesh);shots.splice(i,1)}
}
}
function checkResult(){
if(!started||finished)return;const result=BattleRules.result(alive(0).length+(joined&&playerTeam===0?1:0),alive(1).length+(joined&&playerTeam===1?1:0));
if(!result)return;finished=result;running=false;
notice=campaign?(result==="blue"?level===BattleRules.levels.length-1?"Campaign complete! You defeated every army.":"Victory! Try the next challenge.":result==="draw"?"Draw. Change your formation and try again.":"Defeat. Reset and try a different army."):(result==="draw"?"Draw.":(result==="blue"?"Blue":"Red")+" team wins. Reset or add reinforcements.");
if(joined)returnToFlight();snd(result==="blue"?"win":"lose",.6);paint();
}
function update(dt){
if(!active)return;if(!DevAccess.unlocked){quit();return}
ui.hidden=state!=="play";
if(P.fz>0){P.fz=Math.max(0,P.fz-dt);if(!P.fz)$("msg").textContent="";return}
const g=cg(),f=(K.KeyW?1:0)-(K.KeyS?1:0),s=(K.KeyD?1:0)-(K.KeyA?1:0),fast=K.ShiftLeft||K.ShiftRight;
if(joined){
Aim.frame(dt,scoped);if(K.ArrowLeft||K.KeyQ)P.yaw+=dt*2;if(K.ArrowRight||K.KeyE)P.yaw-=dt*2;
scoped=!!rmb&&slot===0;movePlayer(dt,{f,s,sprint:!!fast,jump:!!K.Space,crouch:!!K.ControlLeft});updateCamera(dt,{f,s});updateFov(dt,g,{f,sprint:fast});
VM.set(g,I(eq().s),curKn(),I(eq().p));VM.frame(dt,{dyaw:angDiff(lastYaw,P.yaw),dpitch:P.pitch-lastPitch,speed:Math.hypot(P.vx,P.vz),vy:P.vy,gr:P.gr,scoped,reload:A.rl>0?1-A.rl/g.rl:0,slot,hide:false,pull:0,knifeCD:0,charging:false,charge:0});lastYaw=P.yaw;lastPitch=P.pitch;
Scope.frame(g,scoped,cam.fov);if(firing&&g.a&&slot===0&&running)fire();if(A.rl>0){A.rl-=dt;if(A.rl<=0)A.mag=g.m}P.rk*=Math.exp(-dt*10);P.sp*=Math.exp(-dt*8);P.prot=Math.max(0,P.prot-dt);Aim.spread(4);
}else{
const v=fast?34:14,sn=Math.sin(P.yaw),cs=Math.cos(P.yaw),norm=Math.max(1,Math.hypot(f,s));
P.x=clamp(P.x+(-sn*f+cs*s)/norm*v*dt,-160,160);P.z=clamp(P.z+(-cs*f-sn*s)/norm*v*dt,-160,160);P.y=clamp(P.y+((K.Space?1:0)-(K.KeyC||K.ControlLeft?1:0))*v*dt,3,100);
if(K.KeyQ||K.ArrowLeft)P.yaw+=dt*1.6;if(K.KeyE||K.ArrowRight)P.yaw-=dt*1.6;
if(K.ArrowUp)P.pitch=clamp(P.pitch+dt,-1.5,1.3);if(K.ArrowDown)P.pitch=clamp(P.pitch-dt,-1.5,1.3);
cam.position.set(P.x,P.y,P.z);cam.rotation.set(P.pitch,P.yaw,0,"YXZ");
updateMarker();
}
if(running){const sim=dt*speed;for(const u of units.slice())if(u.hp>0)stepUnit(u,sim);stepShots(sim);for(let i=bodies.length-1;i>=0;i--)if(deathStep(bodies[i],sim)){dispose(bodies[i].g);bodies.splice(i,1)}checkResult()}
for(const u of units)u.bar.h.quaternion.copy(u.g.quaternion).invert().multiply(cam.quaternion);
hudTime-=dt;if(hudTime<=0){hudTime=.15;status()}
}
function updateMarker(){
marker.visible=false;hover=null;if(!pointer.seen||campaign&&started||drag)return;
cam.updateMatrixWorld();ray.setFromCamera(pointer,cam);if(!ray.ray.intersectPlane(ground,point))return;
hover={x:Math.round(point.x*2)/2,z:Math.round(point.z*2)/2};marker.position.set(hover.x,.06,hover.z);marker.visible=true;
const invalid=BattleRules.placement(layout,BattleRules.troops[pick].id,team,hover.x,hover.z,campaign,level);marker.material.color.setHex(erase?0xffce75:invalid?0xff394f:colors[team]);
}
function status(){
if(!ui)return;const blue=alive(0).length,red=alive(1).length;ui.querySelector("[data-cb-count]").textContent="Blue "+blue+"  ·  Red "+red;
ui.querySelector("[data-cb-budget]").textContent=campaign?"Budget "+(BattleRules.levels[level].budget-BattleRules.spent(layout))+" / "+BattleRules.levels[level].budget:"Free placement · "+units.length+" / 60 units";
ui.querySelector("[data-cb-health]").textContent=joined?"HP "+Math.ceil(P.hp)+" · "+(slot?"Knife":A.rl>0?"Reloading":gName()+" · "+A.mag):"Free flight";
}
const gName=()=>cg().n;
function paint(){
if(!ui)return;const t=BattleRules.troops[pick],locked=campaign&&started;
ui.innerHTML=`<div class="cb-top gl"><div><small>${campaign?"CHALLENGE "+(level+1)+" / "+BattleRules.levels.length:"DEVELOPER CUSTOM MODE"}</small><h2>${campaign?BattleRules.levels[level].n:"Sandbox"}</h2><p data-cb-count></p></div><div class="cb-actions"><button class="b" data-custom="overview">Overview</button><button class="b" data-custom="pause">Pause / settings</button><button class="b" data-custom="exit">Exit</button></div></div>
<div class="cb-panel gl"><div class="cb-budget" data-cb-budget></div>${campaign?`<p>${esc(BattleRules.levels[level].hint)}</p>`:`<div class="seg" aria-label="Placement team"><button class="b${team===0?" on":""}" data-custom="team" data-v="0">Blue team</button><button class="b${team===1?" on":""}" data-custom="team" data-v="1">Red team</button></div>`}
<div class="cb-actions"><button class="b p" data-custom="fight">${finished?"Reset battle":running?"Pause battle":started?"Continue battle":"Start battle"}</button><button class="b" data-custom="reset">Edit / reset</button>${finished==="blue"&&campaign&&level<BattleRules.levels.length-1?'<button class="b p" data-custom="next">Next challenge</button>':""}</div>
${!joined?`<div class="cb-actions"><button class="b${erase?" on":""}" data-custom="erase" ${locked?"disabled":""}>${erase?"Removing units":"Remove tool"}</button><button class="b" data-custom="clear" ${locked?"disabled":""}>Clear ${campaign?"army":team?"Red":"Blue"}</button>${!campaign?'<button class="b" data-custom="sample">Sample armies</button>':""}</div>`:""}
<div class="cb-actions"><button class="b" data-custom="speed">Speed: ${speed}×</button>${!campaign?(joined?'<button class="b" data-custom="fly">Return to flight · F</button>':'<button class="b" data-custom="join" data-v="0">Join Blue</button><button class="b" data-custom="join" data-v="1">Join Red</button>'):""}</div>
<p class="cb-notice" role="status">${esc(notice)}</p><small data-cb-health></small></div>
<div class="cb-bottom gl ${joined?"cb-hidden":""}"><div class="cb-selected"><b>${esc(t.n)} · ${campaign?t.cost+" budget":t.hp+" HP"}</b><span>${esc(t.tip)}</span></div><div class="cb-hotbar" role="toolbar" aria-label="Troop hotbar">${BattleRules.troops.map((u,i)=>`<button class="cb-slot${pick===i?" on":""}" data-custom="unit" data-v="${i}" aria-pressed="${pick===i}" ${locked?"disabled":""}><kbd>${i+1}</kbd>${gly(u.icon,22)}<b>${u.n}</b><small>${campaign?u.cost:u.hp+" HP"}</small></button>`).join("")}</div><p class="cb-help">Click ground: place · Right-drag: look · WASD: fly · Space/C: up/down · Shift: faster · 1–9: units</p></div>
${joined?'<div class="cb-joinhint gl">WASD move · Click fire · Right click aim · R reload · 1/2 gun/knife · F return to flight</div>':""}`;status();
}
function resumeCustom(){state="play";menuOpen=false;show("");$("hud").classList.remove("hid");ui.hidden=false;clearKeys();if(joined){document.body.classList.add("playing");Aim.request()}else document.body.classList.remove("playing")}
document.addEventListener("click",e=>{const b=e.target.closest?.("[data-custom]");if(!b||!active||b.disabled)return;const a=b.dataset.custom;
if(a==="unit"){pick=clamp(+b.dataset.v,0,BattleRules.troops.length-1);erase=false;paint()}
else if(a==="team"){team=+b.dataset.v;paint()}else if(a==="fight")fight();else if(a==="reset")reset();else if(a==="clear")clear();else if(a==="sample")sample();else if(a==="erase"){erase=!erase;paint()}
else if(a==="next"&&finished==="blue")loadLevel(level+1);else if(a==="join")join(+b.dataset.v);else if(a==="fly")returnToFlight();else if(a==="overview")overview();
else if(a==="speed"){speed=speed===1?.5:speed===.5?2:1;paint()}else if(a==="pause"){ui.hidden=true;pauseGame()}else if(a==="exit")quit();
});
addEventListener("keydown",e=>{
if(!active||state!=="play"||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)||e.metaKey||e.ctrlKey&&e.code!=="ControlLeft")return;
const known=/^(Key[WASDQECRFP]|Arrow(Up|Down|Left|Right)|Space|ControlLeft|ShiftLeft|ShiftRight|Escape|Tab|Digit[1-9]|KeyG|KeyM)$/.test(e.code);if(!known)return;
e.preventDefault();e.stopImmediatePropagation();K[e.code]=1;
if(e.repeat)return;
if(e.code==="Escape"||e.code==="KeyP"){ui.hidden=true;pauseGame();return}
if(e.code==="KeyF"){if(joined)returnToFlight();return}
if(/^Digit[1-9]$/.test(e.code)){if(!joined){pick=+e.code.slice(-1)-1;erase=false;paint()}else if(e.code==="Digit1"||e.code==="Digit2"){slot=+e.code.slice(-1)-1;VM.swap()}}
if(joined&&e.code==="KeyR")reload();
},true);
rd.domElement.addEventListener("pointermove",e=>{if(!active||joined)return;const r=rd.domElement.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2,seen:true};
if(drag){P.yaw-=(e.clientX-lastX)*.004;P.pitch=clamp(P.pitch-(e.clientY-lastY)*.004,-1.5,1.3)}lastX=e.clientX;lastY=e.clientY;});
rd.domElement.addEventListener("mousedown",e=>{if(!active||joined||state!=="play")return;e.preventDefault();e.stopImmediatePropagation();
if(e.button===2){drag=true;lastX=e.clientX;lastY=e.clientY}else if(e.button===0){const r=rd.domElement.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2,seen:true};updateMarker();if(hover)add(hover.x,hover.z)}
},true);
addEventListener("mouseup",()=>drag=false);
rd.domElement.addEventListener("wheel",e=>{if(!active||joined||state!=="play")return;e.preventDefault();e.stopImmediatePropagation();P.y=clamp(P.y+Math.sign(e.deltaY)*2,3,100)},{capture:true,passive:false});
return{start,stop,update,playerDamage,playerHurt,resume:resumeCustom,isMode:BattleRules.isMode,get active(){return active},get joined(){return joined},get canShoot(){return joined&&running},get playerTeam(){return playerTeam}};
})();
