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
const freePlacement=level=>typeof level?.id==="string"&&level.id.startsWith("level-");
function placement(layout,id,team,x,z,campaign,level){
const t=troop(id),limit=campaign?34:115;
if(!t||![0,1].includes(team)||!Number.isFinite(x)||!Number.isFinite(z))return"Choose a valid unit and team.";
if(Math.abs(x)>limit||Math.abs(z)>limit)return"Place inside the marked battlefield.";
if(layout.length>=60)return"The field supports up to 60 units.";
if(campaign&&team!==0)return"Choose a blue troop for your army.";
if(campaign&&!freePlacement(level)&&x>-2)return"Place your army on the blue side of the field.";
if(campaign&&spent(layout)+t.cost>(typeof level==="object"?level:levels[level]).budget)return"Not enough budget. Remove a unit to refund its cost.";
if(layout.some(u=>Math.hypot(u.x-x,u.z-z)<(troop(u.id).scale||1)+(t.scale||1)))return"Leave a little space between units.";
return"";
}
function result(blue,red){return blue===0&&red===0?"draw":red===0?"blue":blue===0?"red":null}
return{troops,levels,troop,spent,placement,result,freePlacement,isMode:m=>m==="battle_sim"||m==="sandbox"||m==="battle_maker"};
})();

const CustomBattle=(()=>{
let active=false,joined=false,campaign=false,level=0,team=0,pick=0,running=false,started=false,finished=null;
let resetLayout=null,layout=[],units=[],bodies=[],shots=[],ui=null,stage=null,marker=null,hover=null,erase=false,drag=false,lastX=0,lastY=0,serial=0,notice="",hudTime=0;
let speed=1,playerTeam=0,restoreCamera=null,pointer={x:0,y:0,seen:false};
let scenery=null,landscape=0,placementGhost=null,ghostKey="",rangeRing=null,simTime=0,minimap=null,compact=false;
let maker=false,testing=false,draft=null,baseRevision=null,makerBusy=false,loadSerial=0,editorSession=0,publishNote="",publishCommit="";
let catalog=[];
const draftKey="arena_battle_maker_draft_v1";
const builtins=()=>BattleRules.levels.map((l,i)=>({...l,id:"builtin-"+i,map:BattleVisuals.maps[i%3].id}));
const currentLevel=()=>maker?draft:catalog[level];
const freePlacement=()=>campaign&&BattleRules.freePlacement(currentLevel());
const editing=()=>maker&&!testing;
const restricted=()=>maker&&!DevAccess.unlocked;
function freshDraft(){return{id:"level-"+crypto.randomUUID(),n:"Untitled battle",hint:"Choose your troops and defeat the red army.",budget:600,map:"vale",enemy:[],updatedAt:""}}
function saveDraft(){if(!maker||!draft)return;try{localStorage.setItem(draftKey,JSON.stringify({level:draft,revision:baseRevision}));return true}catch(e){publishNote="Draft could not save on this browser. Keep this page open until you publish.";return false}}
function rememberArmy(){if(!editing())return;draft.enemy=layout.filter(e=>e.team===1).map(e=>({...e}));saveDraft()}
function placementError(id,x,z){
 if(editing()){
  if(Math.abs(x)>34||Math.abs(z)>34)return"Place enemies anywhere inside the marked battlefield.";
  if(layout.length>=BattleLevelData.MAX_ENEMIES)return"Use at most 40 enemies, leaving room for the player's army.";
  return BattleRules.placement(layout,id,1,x,z,false,0);
 }
 return BattleRules.placement(layout,id,team,x,z,campaign,currentLevel());
}
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
const ray=new T.Raycaster();
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
if(!active)return;rememberArmy();loadSerial++;editorSession++;if(maker)BattleLevels.disconnect();active=false;maker=false;testing=false;joined=false;drag=false;clearUnits();dispose(stage);stage=marker=scenery=placementGhost=rangeRing=null;ghostKey="";minimap=null;ui?.remove();ui=null;layout=[];resetLayout=null;
WORLD.group?.children.forEach(o=>{if(o.geometry?.type==="PlaneGeometry"||o.geometry?.type==="CircleGeometry")o.visible=true});
document.body.classList.remove("custom-battle","custom-joined");clearKeys();
}
function makeUnit(entry){
const t=BattleRules.troop(entry.id),col=colors[entry.team];
const g=t.human?mkHuman({body:col,trim:0xe2e8f0,style:t.shield?"armor":null,gun:t.ranged?GB("g2"):null}):mkMon(t.k);
if(!t.human){g.userData.mats.forEach(m=>m.color.lerp(new T.Color(col),.45));if(t.scale)g.scale.multiplyScalar(t.scale)}
if(t.hover){g.userData.mats.forEach(m=>{m.transparent=true;m.opacity=.65;m.emissive.setHex(col);m.emissiveIntensity=.2})}
BattleVisuals.decorate(g,t,col);
const ring=new T.Mesh(new T.RingGeometry(.72,.9,24),new T.MeshBasicMaterial({color:col,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.045;ring.raycast=()=>{};g.add(ring);
const u={custom:true,id:++serial,entry,t,team:entry.team,g,hp:t.hp,hpMax:t.hp,cd:.25+rnd()*.4,retarget:0,target:null,hf:0,vx:0,vz:0,poison:0,poisonTick:0,ph:rnd()*6,rad:(t.scale||1)*.55};
g.position.set(entry.x,groundHeight(entry.x,entry.z)+(t.hover||0),entry.z);g.rotation.y=entry.team?-Math.PI/2:Math.PI/2;
u.bar=HB.make(g,2.9,()=>({hp:u.hp,max:u.hpMax,alive:u.hp>0,far:250}),{col:()=>col,base:.62});
bindOwner(g,u);sc.add(g);units.push(u);E.push(u);return u;
}
function overview(){
if(joined)returnToFlight();P.x=campaign?-32:-38;P.z=campaign?43:57;P.y=campaign?37:43;P.yaw=campaign?-.64:-.59;P.pitch=campaign?-.58:-.53;P.vx=P.vz=P.vy=0;
cam.position.set(P.x,P.y,P.z);cam.rotation.set(P.pitch,P.yaw,0,"YXZ");cam.fov=52;cam.updateProjectionMatrix();
}
function groundHeight(x,z){return scenery?scenery.height(x,z):0}
function battlefield(){
dispose(stage);placementGhost=rangeRing=null;ghostKey="";
scenery=BattleVisuals.create(campaign,landscape,freePlacement());stage=scenery.group;sc.add(stage);BattleVisuals.light(landscape);
WORLD.group.children.forEach(o=>{if(o.geometry?.type==="PlaneGeometry"||o.geometry?.type==="CircleGeometry")o.visible=false});
marker=new T.Mesh(new T.RingGeometry(.75,1,32),new T.MeshBasicMaterial({color:colors[0],side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;stage.add(marker);
}
function loadLevel(n){
level=Math.max(0,Math.min(catalog.length-1,n));resetLayout=null;simTime=0;clearUnits();if(campaign)landscape=Math.max(0,BattleVisuals.maps.findIndex(m=>m.id===currentLevel().map));battlefield();layout=campaign?currentLevel().enemy.map(e=>({...e})):[];
layout.forEach(makeUnit);running=started=false;finished=null;team=editing()?1:0;erase=false;notice=editing()?"Place red enemies anywhere inside the battlefield. Set a budget, then test and publish.":freePlacement()?"Place blue troops anywhere inside the battlefield within your budget, then start the battle.":campaign?"Place troops on the blue side, then start the battle.":"Choose a team and unit, then click the ground to place it.";overview();paint();
}
function start(m){
if(!BattleRules.isMode(m))return false;
if(m==="battle_maker"&&!DevAccess.unlocked){toast("Enter the developer code to unlock Battle Sim Maker.");return false}
Party.leave();Death.stop();corrReset();clearEnts();Fx.clear();clearKeys();
mode=m;grind=false;maker=m==="battle_maker";editorSession++;testing=false;makerBusy=false;publishNote="";publishCommit="";catalog=builtins();campaign=m!=="sandbox";active=true;joined=false;speed=1;pick=0;level=0;landscape=0;simTime=0;compact=false;pointer.seen=false;P.max=100;PU=PUbase();
if(maker){draft=freshDraft();baseRevision=null;try{const saved=JSON.parse(localStorage.getItem(draftKey));if(saved){draft=BattleLevelData.level(saved.level,{draft:true});baseRevision=typeof saved.revision==="string"?saved.revision:null}}catch(e){publishNote="The old draft could not be loaded. A new draft is ready."}}
rL=0;P.fz=0;P.dead=0;slot=0;knifeCD=0;nextShot=0;wave=0;wq=wn=0;placePlayer({x:0,z:28},0,0);
buildWorld("meadow",81261,{empty:true,custom:true});
ui=document.createElement("section");ui.id="custom-battle-ui";ui.setAttribute("aria-label",maker?"Battle Sim Maker controls":campaign?"Battle Simulator controls":"Sandbox controls");document.body.appendChild(ui);
state="play";menuOpen=false;show("");$("hud").classList.remove("hid");document.body.classList.add("custom-battle");document.body.classList.remove("playing");Aim.release();
Mus.set("battle");loadLevel(0);if(campaign&&!maker)refreshLevels();return true;
}
async function refreshLevels(){
 const serial=++loadSerial;
 try{
  const rows=await BattleLevels.loadPublic(true);if(!active||serial!==loadSerial)return;
  // Do not change an army or its budget while a battle is in progress.
  if(!maker&&started)return;
  const previous=currentLevel();catalog=[...builtins(),...rows];
  if(!maker){const index=catalog.findIndex(l=>l.id===previous.id);level=Math.max(0,index);if(index<0||JSON.stringify(previous)!==JSON.stringify(currentLevel())){loadLevel(level);return}}
  paint();
 }
 catch(e){if(active&&serial===loadSerial){notice=e.message;paint()}}
}
function testDraft(){
 if(!editing()||restricted()||makerBusy)return;
 try{rememberArmy();draft=BattleLevelData.level(draft);testing=true;loadLevel(0)}catch(e){message(e.message)}
}
function editDraft(){if(!maker||restricted()||makerBusy)return;testing=false;loadLevel(0)}
function setDraft(value,revision=null){if(restricted()||makerBusy)return;draft=BattleLevelData.level(value,{draft:true});baseRevision=revision;publishNote="";publishCommit="";testing=false;saveDraft();loadLevel(0)}
async function makerAction(action){
 if(!maker||restricted()||makerBusy)return;
 if(action==="maker-test")return testDraft();if(action==="maker-edit")return editDraft();
 if(action==="maker-new")return setDraft(freshDraft());
 if(action==="maker-disconnect"){BattleLevels.disconnect();publishNote="GitHub disconnected.";paint();return}
 if(!editing())return;
 const session=editorSession;loadSerial++;let credential="";
 if(action==="maker-connect"){const input=ui.querySelector("[data-maker-token]");credential=input.value;input.value=""}
 else if(action!=="maker-publish"&&action!=="maker-refresh")return;
 rememberArmy();const entry=JSON.parse(JSON.stringify(draft)),revision=baseRevision;
 makerBusy=true;publishNote=action==="maker-connect"?"Connecting to GitHub…":action==="maker-refresh"?"Loading published levels…":"Publishing level…";paint();
 try{
  if(action==="maker-connect"){const rows=await BattleLevels.connect(credential);if(!active||!maker||session!==editorSession)return;catalog=[...builtins(),...rows];publishNote="GitHub connected for this session. You can publish your level."}
  else if(action==="maker-refresh"){const rows=await BattleLevels.refreshDeveloper();if(!active||!maker||session!==editorSession)return;catalog=[...builtins(),...rows];publishNote="Published levels refreshed. Choose a level above to edit its latest version."}
  else{const result=await BattleLevels.publish(entry,revision);if(!active||!maker||session!==editorSession)return;draft=result.level;baseRevision=result.revision;saveDraft();publishNote=result.message;publishCommit=result.commit;const i=catalog.findIndex(l=>l.id===draft.id);if(i<0)catalog.push(draft);else catalog[i]=draft}
 }catch(e){if(active&&maker&&session===editorSession)publishNote=e.message}
 finally{credential="";if(active&&maker&&session===editorSession){makerBusy=false;paint()}}
}
function message(text){notice=text;paint()}
function add(x,z){
if(restricted()||makerBusy||joined||campaign&&started)return;
if(erase){removeAt(x,z);return}
const id=BattleRules.troops[pick].id,err=placementError(id,x,z);
if(err){message(err);snd("err",.3);return}
const entry={id,team,x,z};layout.push(entry);makeUnit(entry);rememberArmy();finished=null;notice="Placed "+BattleRules.troop(id).n+" for "+(team?"Red":"Blue")+".";snd("ui",.35);paint();
}
function removeAt(x,z){
if(campaign&&started)return;
const found=units.filter(u=>!campaign||editing()||u.team===0).sort((a,b)=>Math.hypot(a.g.position.x-x,a.g.position.z-z)-Math.hypot(b.g.position.x-x,b.g.position.z-z))[0];
if(!found||Math.hypot(found.g.position.x-x,found.g.position.z-z)>3){message("Click near a unit to remove it.");return}
layout=layout.filter(e=>e!==found.entry);units=units.filter(e=>e!==found);E=E.filter(e=>e!==found);HB.remove(found.bar);dispose(found.g);rememberArmy();paint();
}
function reset(){
if(joined)returnToFlight();clearUnits();if(resetLayout)layout=resetLayout.map(e=>({...e}));resetLayout=null;simTime=0;layout.forEach(makeUnit);running=started=false;finished=null;notice="Formation restored. Edit your army, then start the battle.";paint();
}
function clear(){
if(campaign&&started)return;
const retained=campaign&&!editing()?layout.filter(e=>e.team===1):layout.filter(e=>e.team!==team);
resetLayout=null;simTime=0;clearUnits();layout=retained;layout.forEach(makeUnit);rememberArmy();running=started=false;finished=null;paint();
}
function fight(){
if(editing())return testDraft();
if(finished){reset();return}
if(!alive(0).length||!alive(1).length){message("Place at least one unit on each team first.");return}
if(!started)resetLayout=layout.map(e=>({...e}));started=true;running=!running;notice=running?"Battle running.":"Battle paused. Press Continue battle to resume.";paint();
}
function sample(){
if(campaign)return;resetLayout=null;simTime=0;clearUnits();layout=[];for(let side=0;side<2;side++)for(let i=0;i<6;i++)layout.push({id:["brawler","shield","rifle","runner","spitter","brute"][i],team:side,x:side?16:-16,z:(i-2.5)*4});
layout.forEach(makeUnit);running=started=false;finished=null;notice="Two sample armies are ready. Add more units or start the battle.";overview();paint();
}
function join(side){
if(campaign||!started||finished){message("Start a Sandbox battle before joining a team.");return}
if(!joined)restoreCamera={x:P.x,y:P.y,z:P.z,yaw:P.yaw,pitch:P.pitch};
playerTeam=side;joined=true;running=true;clearKeys();slot=0;P.max=100;placePlayer({x:side?26:-26,z:18},side?Math.PI/2:-Math.PI/2,0);P.y=groundHeight(P.x,P.z);P.prot=2;
cam.fov=75;cam.updateProjectionMatrix();document.body.classList.add("playing","custom-joined");Aim.reset();Aim.request();notice="F returns to flight. Your team is "+(side?"Red":"Blue")+".";paint();
}
function returnToFlight(){
if(!joined)return;joined=false;Aim.release();clearKeys();P.dead=0;P.hp=100;P.fz=0;P.em=null;
if(restoreCamera)Object.assign(P,restoreCamera);else{P.y=24;P.pitch=-.7}
P.vx=P.vz=P.vy=0;document.body.classList.remove("playing","custom-joined");Scope.frame(cg(),false,52);paint();
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
Fx.burst({x:u.g.position.x,y:u.g.position.y+1,z:u.g.position.z},colors[u.team],7,3,.08,2,12);
}
}
function playerDamage(u,d,head,pt){
if(!joined||!running||u.team===playerTeam)return;
damage(u,d,{team:playerTeam,g:{position:{x:P.x,y:P.y,z:P.z}}},slot===0,head);hitMark(head);snd(head?"head":"hit",.5);
if(pt)Fx.burst(pt,colors[u.team],4,3,.06,1,12);
}
function launch(u,target){
const a=u.g.position,b=target.g.position,origin=new T.Vector3(a.x,a.y+1.25*(u.t.scale||1),a.z),aim=new T.Vector3(b.x,b.y+(target.player?1:1.2)*(target.t?.scale||1),b.z),v=aim.sub(origin).normalize().multiplyScalar(u.t.id==="rifle"?36:22);
const mesh=new T.Mesh(u.t.id==="rifle"?new T.CylinderGeometry(.055,.055,.95,5):new T.IcosahedronGeometry(.2,0),new T.MeshBasicMaterial({color:u.t.poison?0xb6ff6a:u.t.id==="rifle"?0xffe4a3:colors[u.team]}));if(u.t.id==="rifle")mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());mesh.position.copy(origin);sc.add(mesh);shots.push({mesh,v,owner:u,life:2.5});
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
p.y=groundHeight(p.x,p.z)+(u.t.hover?u.t.hover+Math.sin(performance.now()*.002+u.ph)*.15:0);
if(u.t.human)poseHuman(u.g,dt,Math.abs(move)*.6,0,false);else poseMon(u.g,dt,dist<=stop);
if(dist<=stop&&u.cd<=0){u.cd=u.t.rate;
if(u.t.ranged)launch(u,target);
else{
u.g.userData.kick=1;
if(u.t.splash){for(const v of enemies(u))if(Math.hypot(v.g.position.x-p.x,v.g.position.z-p.z)<u.t.splash+(v.rad||.5))damage(v,u.t.damage,u);
Fx.burst({x:p.x,y:p.y+.5,z:p.z},u.t.bomb?0xffb347:colors[u.team],u.t.bomb?25:10,5,.12,3,16);
}else damage(target,u.t.damage,u);
if(u.t.bomb)damage(u,u.hp+1,null);
}}
}
function stepShots(dt){
for(let i=shots.length-1;i>=0;i--){const s=shots[i],a=s.mesh.position.clone(),b=a.clone().addScaledVector(s.v,dt),segment=new T.Line3(a,b),closest=new T.Vector3();s.life-=dt;let struck=null,best=Infinity;
// Sample the short projectile segment before target tests, so raised ground blocks fire.
const length=a.distanceTo(b),steps=Math.max(1,Math.ceil(length/.5));let groundDistance=Infinity;
for(let n=1;n<=steps;n++){const f=n/steps,x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f,z=a.z+(b.z-a.z)*f;if(y<=groundHeight(x,z)){groundDistance=length*f;break}}
for(const v of enemies(s.owner)){const p=v.g.position,center=new T.Vector3(p.x,p.y+(v.player?1:1.2)*(v.t?.scale||1),p.z);segment.closestPointToPoint(center,true,closest);const radius=(v.rad||.5)+.25;
if(closest.distanceTo(center)<radius&&a.distanceToSquared(closest)<best&&a.distanceTo(closest)<groundDistance){best=a.distanceToSquared(closest);struck=v}}
s.mesh.position.copy(b);
if(struck){damage(struck,s.owner.t.damage,s.owner,true);if(s.owner.t.poison&&!struck.player&&struck.hp>0){struck.poison=3;struck.poisonTick=.5;struck.poisonFrom=s.owner}Fx.burst(b,colors[s.owner.team],4,2,.06,1,10)}
if(struck||s.life<=0||Number.isFinite(groundDistance)){dispose(s.mesh);shots.splice(i,1)}
}
}
function checkResult(){
if(!started||finished)return;const result=BattleRules.result(alive(0).length+(joined&&playerTeam===0?1:0),alive(1).length+(joined&&playerTeam===1?1:0));
if(!result)return;finished=result;running=false;
notice=campaign?(result==="blue"?maker?"Playtest won. Return to the editor to publish or adjust this level.":level===catalog.length-1?"All challenges complete!":"Victory! Try the next challenge.":result==="draw"?"Draw. Change your formation and try again.":"Defeat. Reset and try a different army."):(result==="draw"?"Draw.":(result==="blue"?"Blue":"Red")+" team wins. Reset or add reinforcements.");
if(joined)returnToFlight();snd(result==="blue"?"win":"lose",.6);paint();
}
function update(dt){
if(!active)return;if(restricted()){quit();return}
ui.hidden=state!=="play";
scenery?.frame(dt,!!reducedMotion?.matches);if(scenery)scenery.planning.visible=!running&&!joined;
if(joined){marker.visible=false;if(placementGhost)placementGhost.visible=false;if(rangeRing)rangeRing.visible=false}
if(P.fz>0){P.fz=Math.max(0,P.fz-dt);if(!P.fz)$("msg").textContent="";return}
const g=cg(),f=(K.KeyW?1:0)-(K.KeyS?1:0),s=(K.KeyD?1:0)-(K.KeyA?1:0),fast=K.ShiftLeft||K.ShiftRight;
if(joined){
Aim.frame(dt,scoped);if(K.ArrowLeft||K.KeyQ)P.yaw+=dt*2;if(K.ArrowRight||K.KeyE)P.yaw-=dt*2;
scoped=!!rmb&&slot===0;movePlayer(dt,{f,s,sprint:!!fast,jump:!!K.Space,crouch:!!K.ControlLeft});updateCamera(dt,{f,s});updateFov(dt,g,{f,sprint:fast});
VM.set(g,I(eq().s),curKn(),I(eq().p));VM.frame(dt,{dyaw:angDiff(lastYaw,P.yaw),dpitch:P.pitch-lastPitch,speed:Math.hypot(P.vx,P.vz),vy:P.vy,gr:P.gr,scoped,reload:A.rl>0?1-A.rl/g.rl:0,slot,hide:false,pull:0,knifeCD:0,charging:false,charge:0});lastYaw=P.yaw;lastPitch=P.pitch;
Scope.frame(g,scoped,cam.fov);if(firing&&g.a&&slot===0&&running)fire();if(A.rl>0){A.rl-=dt;if(A.rl<=0)A.mag=g.m}P.rk*=Math.exp(-dt*10);P.sp*=Math.exp(-dt*8);P.prot=Math.max(0,P.prot-dt);Aim.spread(4);
}else{
const v=fast?34:14,sn=Math.sin(P.yaw),cs=Math.cos(P.yaw),norm=Math.max(1,Math.hypot(f,s));
P.x=clamp(P.x+(-sn*f+cs*s)/norm*v*dt,-160,160);P.z=clamp(P.z+(-cs*f-sn*s)/norm*v*dt,-160,160);P.y=clamp(P.y+((K.Space?1:0)-(K.KeyC||K.ControlLeft?1:0))*v*dt,groundHeight(P.x,P.z)+3,100);
if(K.KeyQ||K.ArrowLeft)P.yaw+=dt*1.6;if(K.KeyE||K.ArrowRight)P.yaw-=dt*1.6;
if(K.ArrowUp)P.pitch=clamp(P.pitch+dt,-1.5,1.3);if(K.ArrowDown)P.pitch=clamp(P.pitch-dt,-1.5,1.3);
cam.position.set(P.x,P.y,P.z);cam.rotation.set(P.pitch,P.yaw,0,"YXZ");
updateMarker();
}
if(running){const sim=dt*speed;simTime+=sim;for(const u of units.slice())if(u.hp>0)stepUnit(u,sim);stepShots(sim);for(let i=bodies.length-1;i>=0;i--)if(deathStep(bodies[i],sim)){dispose(bodies[i].g);bodies.splice(i,1)}checkResult()}
else if(!reducedMotion?.matches)for(const u of units){if(u.t.human)poseHuman(u.g,dt,0,0,false);else poseMon(u.g,dt,false)}
for(const u of units)u.bar.h.quaternion.copy(u.g.quaternion).invert().multiply(cam.quaternion);
hudTime-=dt;if(hudTime<=0){hudTime=.15;status()}
}
function updateMarker(){
marker.visible=false;hover=null;if(placementGhost)placementGhost.visible=false;if(rangeRing)rangeRing.visible=false;
if(!pointer.seen||campaign&&started||makerBusy||drag||joined)return;
cam.updateMatrixWorld();scenery.surface.updateMatrixWorld();ray.setFromCamera(pointer,cam);const hit=ray.intersectObject(scenery.surface,false)[0];if(!hit)return;
hover={x:Math.round(hit.point.x*2)/2,z:Math.round(hit.point.z*2)/2};const y=groundHeight(hover.x,hover.z),t=BattleRules.troops[pick];
marker.position.set(hover.x,y+.07,hover.z);marker.scale.setScalar(t.scale||1);marker.visible=true;
const ringPoints=marker.geometry.attributes.position,ringScale=t.scale||1;
for(let i=0;i<ringPoints.count;i++)ringPoints.setZ(i,(groundHeight(hover.x+ringPoints.getX(i)*ringScale,hover.z-ringPoints.getY(i)*ringScale)-y)/ringScale);
ringPoints.needsUpdate=true;marker.geometry.computeBoundingSphere();
const invalid=placementError(t.id,hover.x,hover.z),color=erase?0xffce75:invalid?0xff394f:colors[team];marker.material.color.setHex(color);
if(erase)return;
const key=t.id+":"+team;
if(key!==ghostKey){
dispose(placementGhost);dispose(rangeRing);ghostKey=key;
placementGhost=t.human?mkHuman({body:colors[team],trim:0xe2e8f0}):mkMon(t.k);if(t.scale)placementGhost.scale.multiplyScalar(t.scale);BattleVisuals.decorate(placementGhost,t,colors[team]);
const ghostMat=new T.MeshBasicMaterial({color,transparent:true,opacity:.3,depthWrite:false});
const owned=new Set(placementGhost.userData.mats);
placementGhost.traverse(o=>{if(!o.isMesh&&!o.isSprite)return;if(o.isSprite||o.material===HURT){o.visible=false;return}if(o.material===BLOBM){o.visible=false;return}owned.add(o.material);o.material=ghostMat;o.castShadow=false;o.raycast=()=>{}});
owned.forEach(m=>{if(m!==HURT&&m!==BLOBM)m.dispose()});stage.add(placementGhost);
rangeRing=new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.from({length:64},()=>new T.Vector3())),new T.LineBasicMaterial({color:colors[team],transparent:true,opacity:.4,depthWrite:false}));stage.add(rangeRing);
}
placementGhost.position.set(hover.x,y+(t.hover||0),hover.z);placementGhost.rotation.y=team?-Math.PI/2:Math.PI/2;placementGhost.visible=true;
placementGhost.traverse(o=>{if(o.isMesh&&o.visible&&o.material!==HURT&&o.material!==BLOBM)o.material.color.setHex(color)});
if(!invalid){const points=rangeRing.geometry.attributes.position;for(let i=0;i<64;i++){const a=i/64*Math.PI*2,x=hover.x+Math.cos(a)*t.reach,z=hover.z+Math.sin(a)*t.reach;points.setXYZ(i,x,groundHeight(x,z)+.07,z)}points.needsUpdate=true;rangeRing.geometry.computeBoundingSphere();rangeRing.visible=true}
}
function status(){
if(!ui)return;const blue=alive(0).length,red=alive(1).length;
ui.querySelector("[data-cb-blue]").textContent=blue;ui.querySelector("[data-cb-red]").textContent=red;
const budget=editing()?40:campaign?currentLevel().budget:60,remaining=editing()?40-units.length:campaign?budget-BattleRules.spent(layout):60-units.length;
ui.querySelector("[data-cb-budget]").textContent=campaign&&!editing()?remaining.toLocaleString():units.length;
ui.querySelector("[data-cb-meter]").style.width=Math.max(0,remaining/budget*100)+"%";
ui.querySelector("[data-cb-health]").textContent=joined?"HP "+Math.ceil(P.hp)+" · "+(slot?"Knife":A.rl>0?"Reloading":gName()+" · "+A.mag):"CAMERA · FREE FLIGHT";
ui.querySelector("[data-cb-clock]").textContent=Math.floor(simTime/60).toString().padStart(2,"0")+":"+Math.floor(simTime%60).toString().padStart(2,"0");
const stateEl=ui.querySelector("[data-cb-state]");stateEl.textContent=editing()?"LEVEL EDITOR":finished?"COMPLETE":running?"LIVE BATTLE":started?"PAUSED":"DEPLOYMENT";stateEl.classList.toggle("live",running);
ui.querySelectorAll('[data-custom="unit"]').forEach(b=>{const unaffordable=campaign&&!editing()&&BattleRules.troops[+b.dataset.v].cost>remaining;b.classList.toggle("cb-unaffordable",unaffordable);b.title=unaffordable?"Not enough budget. Remove a unit for a refund.":BattleRules.troops[+b.dataset.v].tip});
drawMap();
}
const gName=()=>cg().n;
function drawMap(){
if(!minimap)return;const c=minimap.getContext("2d");if(!c)return;const w=160,bound=campaign?38:120,scale=w/(2*bound),px=x=>80+x*scale,pz=z=>80+z*scale;
c.clearRect(0,0,w,w);c.fillStyle="#213c41";c.fillRect(0,0,w,w);
for(let z=0;z<20;z++)for(let x=0;x<20;x++){const h=groundHeight((x/20*2-1)*bound,(z/20*2-1)*bound);c.fillStyle=`rgba(180,202,164,${.09+h*.035})`;c.fillRect(x*8,z*8,8,8)}
c.strokeStyle="#d8e4cd33";c.strokeRect(4,4,152,152);if(campaign&&!freePlacement()){c.strokeStyle="#e6e5ce44";c.beginPath();c.moveTo(80,4);c.lineTo(80,156);c.stroke()}
for(const u of units){c.fillStyle=hex[u.team];c.beginPath();c.arc(px(u.g.position.x),pz(u.g.position.z),u.t.id==="titan"?4:2.4,0,Math.PI*2);c.fill()}
c.save();c.translate(px(P.x),pz(P.z));c.rotate(-P.yaw);c.fillStyle="#fff0bd";c.beginPath();c.moveTo(0,-5);c.lineTo(-3,4);c.lineTo(3,4);c.closePath();c.fill();c.restore();
}
function makerPanel(){
if(!maker)return"";
if(testing)return'<div class="cb-maker"><b>Playtest</b><p>Spend the player budget and try to defeat your enemy army.</p><button class="b" data-custom="maker-edit">← Return to editor</button></div>';
const disabled=makerBusy?" disabled":"",connected=BattleLevels.connected;
const tokenLink="https://github.com/settings/personal-access-tokens/new?name=ArenaStrike+Level+Maker&target_name=BareBonesShooters&expires_in=30&contents=write";
return`<section class="cb-maker" aria-label="Level editor"><div class="cb-sectionhead"><b>LEVEL DETAILS</b><button class="b" data-custom="maker-new"${disabled}>New level</button></div>
<label>Level name<input data-maker-field="n" maxlength="60" value="${esc(draft.n)}"${disabled}></label>
<label>Player budget<input data-maker-field="budget" type="number" min="65" max="100000" step="1" value="${draft.budget}"${disabled}></label>
<label>Description<textarea data-maker-field="hint" maxlength="240" rows="2"${disabled}>${esc(draft.hint)}</textarea></label>
<label>Edit a published level<select data-maker-select${disabled}><option value="">${connected?"Choose a level…":"Connect GitHub below to load levels…"}</option>${catalog.filter(l=>!l.id.startsWith("builtin-")).map(l=>`<option value="${esc(l.id)}">${esc(l.n)}</option>`).join("")}</select></label>
<p class="cb-draft-note">Drafts save on this browser. Red enemies and blue player troops can be placed anywhere inside the battlefield.</p>
<details class="cb-publishing" ${connected||publishNote?"open":""}><summary>Publish to everyone</summary>
${connected?`<p>Connected to ${esc(BattleLevels.repository)}.</p><button class="b" data-custom="maker-disconnect"${disabled}>Disconnect GitHub</button><button class="b" data-custom="maker-refresh"${disabled}>Refresh published levels</button>`:`<p>Connect a fine-grained GitHub token for this repository with <b>Contents: read and write</b>. It stays only in this tab and is cleared when you exit the maker.</p><a href="${tokenLink}" target="_blank" rel="noopener noreferrer">Create token on GitHub ↗</a><small>Choose only ArenaStrike. If your organization requires approval, approve the token before publishing.</small><label>GitHub token<input data-maker-token type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="github_pat_…"${disabled}></label><button class="b" data-custom="maker-connect"${disabled}>Connect GitHub</button>`}
<button class="b p cb-publish" data-custom="maker-publish" ${!connected||makerBusy?"disabled":""}>${makerBusy?"Please wait…":baseRevision?"Publish update":"Publish level"}</button>
<small>Publishes to the game's main branch. Players get the level when GitHub Pages finishes deploying.</small>
<p role="status" class="cb-publish-status">${esc(publishNote)}</p>${publishCommit?`<a href="${publishCommit}" target="_blank" rel="noopener noreferrer">View published change ↗</a>`:""}</details></section>`;
}
function paint(){
if(!ui)return;const t=BattleRules.troops[pick],locked=campaign&&started||makerBusy,spec=BattleVisuals.maps[landscape],levelSpec=campaign?currentLevel():null,panelScroll=ui.querySelector(".cb-panel")?.scrollTop||0;
ui.classList.toggle("cb-compact",compact);ui.classList.toggle("cb-maker-mode",maker);ui.style.setProperty("--cb-team",hex[team]);
ui.innerHTML=`<header class="cb-top gl"><div class="cb-brand"><span class="cb-emblem">${gly(campaign?"sword":"spark",22)}</span><div><small>${maker?"BATTLE SIM MAKER · "+(testing?"PLAYTEST":"DEVELOPER"):campaign?"BATTLE SIMULATOR · "+(level+1)+" / "+catalog.length:"SANDBOX · CREATE YOUR BATTLE"}</small><h2>${campaign?esc(levelSpec.n):spec.n}</h2></div></div><div class="cb-score"><span class="cb-blue"><i></i>BLUE <b data-cb-blue>0</b></span><div><small data-cb-state></small><b data-cb-clock>00:00</b></div><span class="cb-red"><b data-cb-red>0</b> RED<i></i></span></div><nav class="cb-actions"><button class="b" data-custom="overview" title="Return camera to the battlefield">Overview</button><button class="b" data-custom="compact" aria-pressed="${compact}" title="Show or hide the tools and minimap">${compact?"Show tools":"Hide tools"}</button><button class="b" data-custom="pause" aria-label="Pause and settings">${gly("gear",16)}</button><button class="b" data-custom="exit">Exit</button></nav></header>
<aside class="cb-panel gl"><div class="cb-sectionhead"><small>${editing()?"ENEMY FORMATION":campaign?"YOUR WAR CHEST":"YOUR PLAYGROUND"}</small><span>${editing()?"RED ARMY":campaign?"BLUE ARMY":"NO BUDGET LIMIT"}</span></div><div class="cb-budget"><b data-cb-budget></b><span>${editing()?"enemies / 40":campaign?"remaining / "+levelSpec.budget:"units / 60"}</span></div><div class="cb-meter"><i data-cb-meter></i></div>
${campaign?`<p class="cb-objective">${esc(levelSpec.hint)}</p>`:`<div class="cb-teamseg" aria-label="Placement team"><button class="b cb-blue${team===0?" on":""}" data-custom="team" data-v="0" aria-pressed="${team===0}">Blue army</button><button class="b cb-red${team===1?" on":""}" data-custom="team" data-v="1" aria-pressed="${team===1}">Red army</button></div>`}
${campaign&&!maker?`<label class="cb-level-select">Challenge<select data-custom-select="level" ${started?"disabled":""}>${catalog.map((l,i)=>`<option value="${i}" ${i===level?"selected":""}>${i+1}. ${esc(l.n)}${l.id.startsWith("builtin-")?"":" · Published"}</option>`).join("")}</select></label><button class="b cb-refresh" data-custom="refresh-levels" ${started?"disabled":""}>Refresh levels</button>`:""}
<button class="b cb-fight" data-custom="fight" ${makerBusy?"disabled":""}>${editing()?"▶  Test level":finished?"Reset battle":running?"Ⅱ  Pause battle":started?"▶  Continue battle":"▶  Start battle"}</button>
${finished==="blue"&&campaign&&!maker&&level<catalog.length-1?'<button class="b cb-next" data-custom="next">Next challenge →</button>':""}
<div class="cb-actions cb-toolrow"><button class="b" data-custom="reset">Edit / reset</button><button class="b" data-custom="speed">${speed}× speed</button></div>
${!joined?`<div class="cb-actions cb-toolrow"><button class="b${erase?" on":""}" data-custom="erase" aria-pressed="${erase}" ${locked?"disabled":""}>${erase?"✓ Remove tool":"Remove tool"}</button><button class="b" data-custom="clear" ${locked?"disabled":""}>Clear ${editing()?"enemies":campaign?"army":team?"Red":"Blue"}</button></div>`:""}
${!campaign?`<div class="cb-actions cb-toolrow">${joined?'<button class="b" data-custom="fly">Return to flight · F</button>':`<button class="b" data-custom="join" data-v="0" ${!started||finished?"disabled":""}>Join Blue</button><button class="b" data-custom="join" data-v="1" ${!started||finished?"disabled":""}>Join Red</button>`}</div><button class="b cb-sample" data-custom="sample">Place sample armies</button>`:""}
<div class="cb-mapselect"><small>LANDSCAPE</small><div>${BattleVisuals.maps.map((m,i)=>`<button class="cb-mapchip${landscape===i?" on":""}" data-custom="map" data-v="${i}" aria-label="${m.n}" title="${m.n}" aria-pressed="${landscape===i}" ${started||makerBusy||campaign&&!editing()?"disabled":""}><i style="background:#${m.grass[1].toString(16)}"></i>${["Meadow","Canyon","Frost"][i]}</button>`).join("")}</div></div>
${makerPanel()}
<p class="cb-notice" role="status">${esc(notice)}</p><small class="cb-health" data-cb-health></small></aside>
<aside class="cb-minimap gl"><div><small>FIELD OVERVIEW</small><span>N ↑</span></div><canvas width="160" height="160" aria-label="Live map of terrain, armies and camera"></canvas><p>${esc(spec.n)}</p></aside>
<section class="cb-bottom gl ${joined?"cb-hidden":""}"><div class="cb-selected"><div><small>${erase?"REMOVE TOOL":"SELECTED UNIT"}</small><b>${esc(t.n)}</b><span>${t.hp} HP <i>·</i> ${t.damage} DMG <i>·</i> ${t.reach}m range</span></div><p>${esc(t.tip)}</p></div><div class="cb-hotbar" role="toolbar" aria-label="Troop hotbar">${BattleRules.troops.map((u,i)=>`<button class="cb-slot${pick===i?" on":""}" data-custom="unit" data-v="${i}" aria-label="${u.n}, ${campaign?u.cost+" budget":u.hp+" health"}" aria-pressed="${pick===i}" ${locked?"disabled":""}><kbd>${i+1}</kbd>${BattleVisuals.portrait(u.id,hex[team])}<b>${u.n}</b><small>${campaign?u.cost+" budget":u.hp+" HP"}</small></button>`).join("")}</div><p class="cb-help"><span><kbd>CLICK</kbd> Place troop</span><span><kbd>RMB</kbd> Look</span><span><kbd>WASD</kbd> Fly</span><span><kbd>SPACE / C</kbd> Up / down</span><span><kbd>SCROLL</kbd> Height</span><span><kbd>SHIFT</kbd> Faster</span></p></section>
${finished?`<div class="cb-result ${finished}"><small>BATTLE COMPLETE</small><h2>${finished==="draw"?"A draw":campaign?finished==="blue"?"Victory":"Defeat":(finished==="blue"?"Blue":"Red")+" army wins"}</h2><p>${maker?"Return to the editor to adjust or publish your level.":campaign&&finished==="blue"?level===catalog.length-1?"All challenges conquered.":"Your next challenge awaits.":"Reset your formation to play again."}</p></div>`:""}
${joined?'<div class="cb-joinhint gl">WASD move · Click fire · Right click aim · R reload · 1/2 gun/knife · F return to flight</div>':""}`;
minimap=ui.querySelector(".cb-minimap canvas");status();ui.querySelector(".cb-panel").scrollTop=panelScroll;
}
function resumeCustom(){state="play";menuOpen=false;show("");$("hud").classList.remove("hid");ui.hidden=false;clearKeys();if(joined){document.body.classList.add("playing");Aim.request()}else document.body.classList.remove("playing")}
document.addEventListener("click",e=>{const b=e.target.closest?.("[data-custom]");if(!b||!active||b.disabled||restricted())return;const a=b.dataset.custom;
if(a.startsWith("maker-")){makerAction(a);return}if(makerBusy&&a!=="exit"&&a!=="pause")return;
if(a==="unit"){pick=clamp(+b.dataset.v,0,BattleRules.troops.length-1);erase=false;paint()}
else if(a==="team"&&!campaign){team=+b.dataset.v;paint()}else if(a==="fight")fight();else if(a==="reset")reset();else if(a==="clear")clear();else if(a==="sample")sample();else if(a==="erase"){erase=!erase;paint()}
else if(a==="next"&&!maker&&finished==="blue")loadLevel(level+1);else if(a==="join")join(+b.dataset.v);else if(a==="fly")returnToFlight();else if(a==="overview")overview();
else if(a==="refresh-levels"&&!started)refreshLevels();
else if(a==="compact"){compact=!compact;paint()}
else if(a==="map"&&!started&&(!campaign||editing())){landscape=clamp(+b.dataset.v,0,BattleVisuals.maps.length-1);if(maker){draft.map=BattleVisuals.maps[landscape].id;saveDraft()}battlefield();for(const u of units)u.g.position.y=groundHeight(u.g.position.x,u.g.position.z)+(u.t.hover||0);notice="Landscape changed to "+BattleVisuals.maps[landscape].n+". Your formation is ready.";paint()}
else if(a==="speed"){speed=speed===1?.5:speed===.5?2:1;paint()}else if(a==="pause"){ui.hidden=true;pauseGame()}else if(a==="exit")quit();
});
function editField(input,report){
 if(!active||!editing()||restricted()||makerBusy)return;
 const field=input.dataset?.makerField;if(!["n","hint","budget"].includes(field))return;
 try{draft=BattleLevelData.level({...draft,[field]:field==="budget"?Number(input.value):input.value},{draft:true});saveDraft();ui.querySelector(".cb-brand h2").textContent=draft.n;ui.querySelector(".cb-objective").textContent=draft.hint;status()}catch(error){if(report){input.value=String(draft[field]);message(error.message)}}
}
document.addEventListener("input",e=>editField(e.target,false));
document.addEventListener("change",e=>{
if(!active||restricted()||makerBusy)return;const input=e.target;
if(input.matches?.('[data-custom-select="level"]')&&!started&&!maker){const n=Number(input.value);if(Number.isInteger(n)&&n>=0&&n<catalog.length)loadLevel(n)}
if(!editing())return;
if(input.matches?.('[data-maker-select]')){const chosen=catalog.find(l=>l.id===input.value&&!l.id.startsWith("builtin-"));if(chosen)setDraft(chosen,BattleLevelData.fingerprint(chosen));return}
editField(input,true);
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
rd.domElement.addEventListener("pointerleave",()=>{pointer.seen=false;if(marker)marker.visible=false;if(placementGhost)placementGhost.visible=false;if(rangeRing)rangeRing.visible=false});
rd.domElement.addEventListener("wheel",e=>{if(!active||joined||state!=="play")return;e.preventDefault();e.stopImmediatePropagation();P.y=clamp(P.y+Math.sign(e.deltaY)*2,3,100)},{capture:true,passive:false});
return{start,stop,update,playerDamage,playerHurt,groundHeight,rayGround:(...args)=>scenery?scenery.rayDistance(...args):args[6],resume:resumeCustom,isMode:BattleRules.isMode,get active(){return active},get joined(){return joined},get canShoot(){return joined&&running},get playerTeam(){return playerTeam}};
})();
