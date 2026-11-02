"use strict";
// Public level data is static. Only a developer's in-memory GitHub credential can publish.
const BattleLevelData=(()=>{
const maps=["vale","mesa","frost"],MAX_LEVELS=120,MAX_ENEMIES=40;
function level(raw,{draft=false}={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Choose a valid level.");
 if(typeof raw.id!=="string"||!/^level-[a-zA-Z0-9-]{1,70}$/.test(raw.id))throw Error("This level has an invalid ID.");
 const n=typeof raw.n==="string"?raw.n.trim():"",hint=typeof raw.hint==="string"?raw.hint.trim():"";
 if(!n||n.length>60)throw Error("Give your level a name of 1–60 characters.");
 if(hint.length>240)throw Error("Keep the level description under 241 characters.");
 if(!Number.isInteger(raw.budget)||raw.budget<65||raw.budget>100000)throw Error("Player budget must be a whole number between 65 and 100,000.");
 if(!maps.includes(raw.map))throw Error("Choose a valid landscape.");
 if(!Array.isArray(raw.enemy)||raw.enemy.length>MAX_ENEMIES||(!draft&&!raw.enemy.length))throw Error("Place 1–40 enemies inside the battlefield before testing or publishing.");
 const enemy=[];
 for(const u of raw.enemy){
  const t=u&&BattleRules.troop(u.id);
  if(!t||u.team!==1||!Number.isFinite(u.x)||!Number.isFinite(u.z)||Math.abs(u.x)>34||Math.abs(u.z)>34)throw Error("Enemies must be valid red troops inside the battlefield.");
  if(enemy.some(v=>Math.hypot(v.x-u.x,v.z-u.z)<(BattleRules.troop(v.id).scale||1)+(t.scale||1)))throw Error("Leave a little space between enemy troops.");
  enemy.push({id:u.id,team:1,x:u.x,z:u.z});
 }
 return{id:raw.id,n,hint,budget:raw.budget,map:raw.map,enemy,updatedAt:typeof raw.updatedAt==="string"?raw.updatedAt.slice(0,40):""};
}
function catalog(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.levels)||raw.levels.length>MAX_LEVELS)throw Error("The published level file is invalid. No levels were overwritten.");
 const levels=raw.levels.map(v=>level(v)),ids=new Set();for(const l of levels){if(ids.has(l.id))throw Error("The published level file contains duplicate IDs.");ids.add(l.id)}
 return{version:1,levels};
}
const fingerprint=l=>l?JSON.stringify(level(l)):null;
function merge(raw,entry,base){
 const data=catalog(raw),next=level(entry),i=data.levels.findIndex(l=>l.id===next.id),old=i<0?null:data.levels[i];
 if(fingerprint(old)!==base)throw Error("This level changed on GitHub. Use Refresh published levels, then reopen its published version before updating it; your draft is still saved.");
 if(i<0){if(data.levels.length>=MAX_LEVELS)throw Error("The published collection is full (120 levels).");data.levels.push(next)}else data.levels[i]=next;
 return data;
}
return{level,catalog,fingerprint,merge,maps,MAX_ENEMIES};
})();

const BattleLevels=(()=>{
// These are public repository settings, never a password or access token.
const repository="BareBonesShooters/ArenaStrike",branch="main",file="js/battle-levels.json";
const api="https://api.github.com/repos/"+repository,contentURL=api+"/contents/"+file;
let token="",session=0,busy=false,connecting=false,publicRows=[],publicLoaded=false;
function requireDev(){if(!DevAccess.unlocked)throw Error("Unlock Custom Gamemodes first.")}
function assertSession(id){requireDev();if(!token||id!==session)throw Error("GitHub disconnected. Connect again before publishing.")}
async function request(url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{return await fetch(url,{...options,signal:controller.signal,credentials:"omit",redirect:"error"})}
 catch(e){throw Error(e.name==="AbortError"?"GitHub timed out. Your draft is saved; reconnect before retrying if a publish was already sent.":"Could not reach GitHub. Check your connection and try again.")}
 finally{clearTimeout(timer)}
}
function headers(value=token){return{Accept:"application/vnd.github+json",Authorization:"Bearer "+value,"X-GitHub-Api-Version":"2026-03-10"}}
function failure(status){
 if(status===401)return Error("GitHub rejected that token. Create a new token and connect again.");
 if(status===403)return Error("GitHub refused access. Check the token's Contents write permission, organization approval, or API rate limit.");
 if(status===409||status===422)return Error("GitHub could not commit this update. Another developer may have published, or main may require a pull request. Your draft is saved; reload the published level before retrying.");
 if(status===404)return Error("GitHub could not find this repository or branch with your token.");
 return Error("GitHub could not complete the request ("+status+"). Your draft is saved.");
}
const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0)));
const encode=s=>{const bytes=new TextEncoder().encode(s);let out="";for(const b of bytes)out+=String.fromCharCode(b);return btoa(out)};
async function remote(id){
 assertSession(id);const response=await request(contentURL+"?ref="+encodeURIComponent(branch),{headers:headers(),cache:"no-store"});assertSession(id);
 if(response.status===404)return{sha:null,data:{version:1,levels:[]}};
 if(!response.ok)throw failure(response.status);
 const body=await response.json();if(body.encoding!=="base64"||typeof body.content!=="string"||body.content.length>1400000||typeof body.sha!=="string")throw Error("The level file is too large or not a normal text file.");
 return{sha:body.sha,data:BattleLevelData.catalog(JSON.parse(decode(body.content)))};
}
async function connect(value){
 requireDev();if(busy||connecting)throw Error("Wait for the current GitHub request to finish.");
 value=String(value||"").trim();if(!/^github_pat_[A-Za-z0-9_]{20,250}$/.test(value))throw Error("Enter a fine-grained GitHub token (starts with github_pat_).");
 connecting=true;token="";const id=++session;
 try{
  const response=await request(api,{headers:headers(value),cache:"no-store"});requireDev();if(id!==session)throw Error("Connection cancelled.");
  if(!response.ok)throw failure(response.status);const repo=await response.json();
  if(repo.archived||repo.permissions?.push===false)throw Error("This GitHub account cannot publish to the game repository.");
  token=value;const latest=await remote(id);assertSession(id);return latest.data.levels.map(l=>BattleLevelData.level(l));
 }catch(e){if(id===session)token="";throw e}finally{connecting=false}
}
function disconnect(){session++;token=""}
async function refreshDeveloper(){
 requireDev();if(busy||connecting)throw Error("Wait for the current GitHub request to finish.");
 const id=session;busy=true;try{const latest=await remote(id);assertSession(id);return latest.data.levels.map(l=>BattleLevelData.level(l))}finally{busy=false}
}
async function publish(entry,base){
 requireDev();if(busy||connecting)throw Error("A GitHub request is already running.");if(!token)throw Error("Connect GitHub before publishing.");
 const next=BattleLevelData.level(entry),id=session;busy=true;
 try{
  const latest=await remote(id);next.updatedAt=new Date().toISOString();const data=BattleLevelData.merge(latest.data,next,base);assertSession(id);
  const body={message:"Publish Battle Simulator level: "+next.n,branch,content:encode(JSON.stringify(data,null,2)+"\n")};if(latest.sha)body.sha=latest.sha;
  const response=await request(contentURL,{method:"PUT",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!response.ok)throw failure(response.status);const result=await response.json();
  return{level:next,revision:BattleLevelData.fingerprint(next),commit:typeof result.commit?.sha==="string"&&/^[a-f0-9]{40}$/.test(result.commit.sha)?"https://github.com/"+repository+"/commit/"+result.commit.sha:"",message:"Published to GitHub. Players will see it after the site's deployment finishes."};
 }finally{busy=false}
}
async function loadPublic(force=false){
 if(publicLoaded&&!force)return publicRows.map(l=>BattleLevelData.level(l));
 const response=await request(new URL(file,document.baseURI).href,{cache:"no-store"});
 if(!response.ok)throw Error("Published levels could not load. The original challenges still work; use Refresh levels to retry.");
 const text=await response.text();if(text.length>1000000)throw Error("Published levels are too large to load.");
 const data=BattleLevelData.catalog(JSON.parse(text));publicRows=data.levels;publicLoaded=true;return publicRows.map(l=>BattleLevelData.level(l));
}
return{repository,branch,file,connect,disconnect,refreshDeveloper,publish,loadPublic,get connected(){if(!DevAccess.unlocked)disconnect();return!!token},get busy(){return busy||connecting}};
})();
