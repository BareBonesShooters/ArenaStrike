// Account progress and device preferences have different lifetimes.
window.ArenaStorage=(()=>{
 let owner='guest';
 const deviceKeys=['sens','ssens','vol','mvol','gfx','auto','ac','scope'];
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 if(!read('arena_guest_v1'))write('arena_guest_v1',read('arena3dv2_device')||read('arena3dv2'));
 return{read,write,get owner(){return owner},set owner(v){owner=v||'guest'},get key(){return owner==='guest'?'arena_guest_v1':'arena_account_'+owner},load(){const data=read('arena_guest_v1')||{},device=read('arena_game_device');if(device){for(const k of deviceKeys)if(k in device)data[k]=device[k];if(typeof device.scopeToggle==='boolean')data.opt={...data.opt,scopeToggle:device.scopeToggle}}return data},save(data){const device={};for(const k of deviceKeys)if(k in data)device[k]=data[k];if(typeof data.opt?.scopeToggle==='boolean')device.scopeToggle=data.opt.scopeToggle;write('arena_game_device',device);write(this.key,data);if(owner==='guest'){write('arena3dv2_device',data);write('arena3dv2',data)}}};
})();
