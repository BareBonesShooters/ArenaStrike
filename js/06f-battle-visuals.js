"use strict";
// Original, procedural low-poly scenery. No downloaded art or extra runtime dependencies.
const BattleVisuals=(()=>{
const maps=[
  {id:"vale",n:"Meadow Railway",theme:"meadow",grass:[0x79ab69,0x88b977,0x9ac486],rock:0xb5a18a,leaf:[0x398369,0x63a57c,0xe6b88b],water:0x62bac5,sky:0xc7dfdf,sun:0xffe5b3},
  {id:"mesa",n:"Canyon Express",theme:"desert",grass:[0xd7ad72,0xe4bd86,0xeacb98],rock:0xb9694c,leaf:[0x638b64,0x94a16b,0xd0a568],water:0x63bfbb,sky:0xf1d7b2,sun:0xffd1a0},
  {id:"frost",n:"Frostfall Valley",theme:"frost",grass:[0xcddfe4,0xe0eaeb,0xf0f1e9],rock:0x788d9f,leaf:[0x356f78,0x609692,0xd9e5df],water:0x83c9dd,sky:0xd0dfeb,sun:0xffead0}
];
const sat=v=>Math.max(0,Math.min(1,v));
function profile(campaign,map,x,z){
  // Broad, connected ramps link three terraces; all of the placement area is walkable.
  const scale=campaign?1:3,xx=x/scale,zz=z/scale,high=map===1?5:3.6;
  const north=sat((-zz-12)/9)*high;
  const south=sat((zz-17)/9)*2.8;
  const corner=sat((Math.abs(xx)-20)/11)*sat((Math.abs(zz)-7)/12)*3;
  return Math.max(north,south)+corner;
}
function create(campaign,mapIndex=0,freePlacement=false){
  const spec=maps[mapIndex],group=new T.Group(),planning=new T.Group(),animated=[],trainCars=[],smoke=[];
  group.name="custom-diorama";group.add(planning);
  const random=mkRng(9107+mapIndex*619+(campaign?0:31)),range=(a,b)=>a+(b-a)*random();
  const extent=campaign?82:174,cell=campaign?2:4,count=Math.round(extent*2/cell),step=extent*2/count;
  const heights=new Float32Array((count+1)*(count+1)),verts=[],colors=[];
  const palette=spec.grass.map(c=>new T.Color(c)),cliff=new T.Color(spec.rock);
  const at=(i,j)=>heights[j*(count+1)+i];
  for(let j=0;j<=count;j++)for(let i=0;i<=count;i++)heights[j*(count+1)+i]=profile(campaign,mapIndex,-extent+i*step,-extent+j*step);
  function height(x,z){
    const gx=Math.max(0,Math.min(count-.00001,(x+extent)/step)),gz=Math.max(0,Math.min(count-.00001,(z+extent)/step));
    const i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
    return u+v<=1?at(i,j)+(at(i+1,j)-at(i,j))*u+(at(i,j+1)-at(i,j))*v:at(i+1,j+1)+(at(i,j+1)-at(i+1,j+1))*(1-u)+(at(i+1,j)-at(i+1,j+1))*(1-v);
  }
  const tri=(a,b,c)=>{
    const rise=Math.max(a[1],b[1],c[1])-Math.min(a[1],b[1],c[1]);
    const col=palette[Math.floor(random()*palette.length)].clone().multiplyScalar(range(.96,1.04));
    if(rise>.75)col.lerp(cliff,.34);
    for(const p of[a,b,c]){verts.push(...p);colors.push(col.r,col.g,col.b)}
  };
  for(let j=0;j<count;j++)for(let i=0;i<count;i++){
    const x=-extent+i*step,z=-extent+j*step,a=[x,at(i,j),z],b=[x+step,at(i+1,j),z],c=[x,at(i,j+1),z+step],d=[x+step,at(i+1,j+1),z+step];
    tri(a,c,b);tri(b,c,d);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(verts,3));geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const surface=new T.Mesh(geometry,new T.MeshLambertMaterial({vertexColors:true}));surface.receiveShadow=true;surface.name="walkable-terraces";group.add(surface);
  const solid=new Batch(),lit=new Batch();
  const part=(shape,x,y,z,sx,sy,sz,color,rotation=0,light=false,rx=0,rz=0)=>(light?lit:solid).add(U[shape],mt(x,y,z,sx,sy,sz,rotation,rx,rz),color,.8,1);
  const box=(x,y,z,w,h,d,c,ry=0)=>part("box",x,y,z,w,h,d,c,ry);
  // Layered island edges and a calm water horizon establish a miniature landscape.
  for(let edge=0;edge<4;edge++)for(let n=-extent;n<extent;n+=8){
    const x=edge<2?n+4:(edge===2?-extent:extent),z=edge<2?(edge===0?-extent:extent):n+4,h=height(x,z);
    box(x,(h-13)/2,z,edge<2?8.1:3,h+13,edge<2?3:8.1,spec.rock);
    box(x,-9,z,edge<2?8.2:3.3,2.5,edge<2?3.3:8.2,new T.Color(spec.rock).multiplyScalar(.78));
  }
  const water=new T.Mesh(new T.PlaneGeometry(1000,1000),new T.MeshPhongMaterial({color:spec.water,shininess:65,transparent:true,opacity:.88}));water.rotation.x=-Math.PI/2;water.position.y=-13.7;group.add(water);
  // Trees, boulders and flowers stay outside the usable placement square.
  const bound=campaign?37:119,trees=Math.round(110*Math.max(.3,LOD.props));
  function tree(x,z,size){
    const y=height(x,z),color=spec.leaf[Math.floor(random()*spec.leaf.length)];
    part("cyl",x,y+size*.42,z,size*.2,size*.84,size*.2,0x795b49);
    if(mapIndex===1){
      part("cyl",x,y+size*.95,z,size*.38,size*1.7,size*.38,color);
      box(x+size*.42,y+size*.9,z,size*.7,size*.18,size*.18,color);
      part("cyl",x+size*.7,y+size*1.13,z,size*.18,size*.65,size*.18,color);
    }else if(mapIndex===2||random()<.58){
      for(let k=0;k<3;k++)part("cone",x,y+size*(.9+k*.3),z,size*(1.45-k*.3),size*.95,size*(1.45-k*.3),color,range(0,6));
    }else{
      part("ico",x,y+size*1.1,z,size*1.6,size*1.55,size*1.4,color,range(0,6));
      part("ico",x+size*.48,y+size*.9,z+.3,size,size,size,spec.leaf[1]);
    }
  }
  for(let i=0;i<trees;i++){
    let x=range(-extent+6,extent-6),z=range(-extent+6,extent-6);
    if(Math.abs(x)<bound&&Math.abs(z)<bound){i--;continue}
    tree(x,z,range(2.5,5.5));
    if(i%3===0)part("ico",x+4,height(x+4,z),z,range(2,4),range(2,4),range(2,4),spec.rock,range(0,6));
  }
  for(let i=0;i<Math.round(260*Math.max(.25,LOD.props));i++){
    const x=range(-bound,bound),z=range(-bound,bound);if(Math.abs(x)<25&&Math.abs(z)<13)continue;
    const y=height(x,z),h=range(.15,.45);part("cone",x,y+h/2,z,.12,h,.12,spec.leaf[1]);
    if(i%4===0)part("ico",x,y+h,z,.22,.16,.22,i%8?0xf4dba2:0xe3a9ac);
  }
  // Chunky distant mesas and mountain silhouettes, clear of all troops.
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2,d=extent+range(30,65),x=Math.cos(a)*d,z=Math.sin(a)*d,h=range(22,57);
    part(mapIndex===1?"cyl":"cone",x,h/2-9,z,range(32,56),h,range(32,56),spec.rock,range(0,6));
    if(mapIndex===2)part("cone",x,h*.84-9,z,16,h*.32,16,0xe6edf0);
  }
  // An elevated railway circles the field. Its bridges and train are scenery,
  // deliberately beyond placement/player bounds so no invisible collision is needed.
  const rx=campaign?58:142,rz=campaign?51:138,corner=campaign?14:24,trackY=12;
  const curve=new T.CatmullRomCurve3([
    [-rx+corner,trackY,-rz],[rx-corner,trackY,-rz],[rx,trackY,-rz+corner],[rx,trackY,rz-corner],
    [rx-corner,trackY,rz],[-rx+corner,trackY,rz],[-rx,trackY,rz-corner],[-rx,trackY,-rz+corner]
  ].map(p=>new T.Vector3(...p)),true,"centripetal");
  const length=curve.getLength(),segments=Math.ceil(length/2.4);
  for(let i=0;i<segments;i++){
    const p=curve.getPointAt(i/segments),dir=curve.getTangentAt(i/segments),angle=Math.atan2(dir.x,dir.z),side=new T.Vector3(dir.z,0,-dir.x);
    box(p.x,trackY-.25,p.z,3.4,.5,length/segments+.12,0x90765e,angle);
    box(p.x,trackY+.03,p.z,3.1,.13,.4,0x554a42,angle);
    for(const sign of[-1,1])box(p.x+side.x*1.05*sign,trackY+.2,p.z+side.z*1.05*sign,.14,.2,length/segments+.2,0x465560,angle);
    if(i%5===0){const groundY=height(p.x,p.z);box(p.x,(trackY+groundY)/2-1,p.z,1.15,trackY-groundY-1,1.15,spec.rock);box(p.x,trackY-1,p.z,4.1,.8,1.8,spec.rock,angle)}
  }
  const wheels=[];
  function trainCar(i){
    const car=new T.Group();car.name=i?"freight-car":"locomotive";
    const mesh=(geo,color,x,y,z)=>{const m=new T.Mesh(geo,new T.MeshLambertMaterial({color}));m.position.set(x,y,z);m.castShadow=true;car.add(m);return m};
    mesh(new T.BoxGeometry(2.3,.4,4.9),0x354350,0,.65,0);
    for(const x of[-1.13,1.13])for(const z of[-1.55,1.55]){
      const w=mesh(new T.CylinderGeometry(.58,.58,.25,10),0x293b46,x,.55,z);w.rotation.z=Math.PI/2;wheels.push(w);
      const hub=mesh(new T.CylinderGeometry(.25,.25,.28,8),0xd7af70,x,.55,z);hub.rotation.z=Math.PI/2;w.add(hub);hub.position.set(0,0,0);hub.rotation.set(0,0,0);
    }
    if(!i){
      const boiler=mesh(new T.CylinderGeometry(.85,.85,2.9,10),0x274555,0,1.65,.8);boiler.rotation.x=Math.PI/2;
      mesh(new T.BoxGeometry(2,2.2,1.5),0xc56e51,0,1.9,-1.45);mesh(new T.BoxGeometry(2.5,.25,2),0x354653,0,3.1,-1.45);
      mesh(new T.BoxGeometry(1.45,.75,1.55),0xbedddd,0,2.2,-1.44);
      mesh(new T.CylinderGeometry(.32,.22,1.25,8),0x32414d,0,2.65,1.5);
      mesh(new T.CylinderGeometry(.38,.38,.2,8),0xffdc89,0,1.65,2.28).rotation.x=Math.PI/2;
    }else{
      mesh(new T.BoxGeometry(2.2,.8,4.3),[0,0xc18456,0x5c9893,0xc0a768][i],0,1.15,0);
      if(i===2)mesh(new T.CylinderGeometry(.85,.85,3.6,10),0xe7ba6e,0,2,0).rotation.x=Math.PI/2;
      else for(let n=0;n<3;n++)mesh(new T.IcosahedronGeometry(.75,0),i===1?0x384850:0xc6ad85,(n%2-.5)*.6,1.85,(n-1)*1.1);
    }
    group.add(car);trainCars.push(car);
  }
  for(let i=0;i<4;i++)trainCar(i);
  for(let i=0;i<9;i++){
    const m=new T.Mesh(new T.IcosahedronGeometry(.7,0),new T.MeshBasicMaterial({color:0xe8e7db,transparent:true,opacity:.5,depthWrite:false}));m.visible=false;group.add(m);smoke.push({m,age:i*.22});
  }
  // Small station, spinning windmill, and a flowing stream underneath the rail bridge.
  const stationX=campaign?34:108,stationZ=-rz-7,sy=height(stationX,stationZ);
  box(stationX,sy+1.8,stationZ,8,3.6,5,0xf1dfba);part("gab",stationX,sy+4.4,stationZ,9,2.4,6,mapIndex===2?0xd7e4e7:0xa75e4b);
  for(const x of[-2.4,0,2.4])box(stationX+x,sy+2,stationZ+2.53,1.1,1.3,.06,0x456676);
  const wx=-bound-9,wz=-bound+8,wy=height(wx,wz);
  part("cyl",wx,wy+3.5,wz,3.4,7,3.4,0xeee2c7);part("cone",wx,wy+8,wz,4.4,3,4.4,0x8e6a5c);
  const rotor=new T.Group();rotor.position.set(wx,wy+6,wz+2.05);group.add(rotor);
  for(let i=0;i<4;i++){
    const blade=new T.Mesh(new T.BoxGeometry(.65,4.5,.16),new T.MeshLambertMaterial({color:0xf4ead4}));
    const arm=new T.Group();arm.rotation.z=i*Math.PI/2;blade.position.y=2.4;arm.add(blade);rotor.add(arm);
  }
  const streamZ=-bound-5,stream=new T.Mesh(new T.PlaneGeometry(extent*1.6,4),new T.MeshBasicMaterial({color:spec.water,transparent:true,opacity:.9}));
  stream.rotation.x=-Math.PI/2;stream.position.set(0,height(0,streamZ)+.04,streamZ);group.add(stream);
  for(let i=0;i<12;i++){
    const ripple=new T.Mesh(new T.PlaneGeometry(range(1,3),.08),new T.MeshBasicMaterial({color:0xe5ffff,transparent:true,opacity:.35}));ripple.rotation.x=-Math.PI/2;
    ripple.position.set(range(-extent*.7,extent*.7),stream.position.y+.02,streamZ+range(-1.8,1.8));group.add(ripple);animated.push(ripple);
  }
  // Neutral pennants mark an unrestricted battlefield; preset challenges retain team sides.
  for(const side of[-1,1])for(const z of[-32,32]){
    const x=side*(campaign?36:117),zz=z*(campaign?1:3),y=height(x,zz),col=freePlacement?0xe1e9c5:side<0?0x58bed9:0xeb7b72;
    part("cyl",x,y+3,zz,.13,6,.13,0xf0dec1);
    const flag=new T.Mesh(new T.PlaneGeometry(2.6,1.5,5,1),new T.MeshLambertMaterial({color:col,side:T.DoubleSide}));flag.position.set(x+1.3,y+4.9,zz);flag.userData.flag=true;group.add(flag);animated.push(flag);
  }
  const solidMesh=solid.mesh(new T.MeshLambertMaterial({vertexColors:true}));solidMesh.castShadow=true;solidMesh.receiveShadow=true;group.add(solidMesh);
  if(lit.p.length)group.add(lit.mesh(new T.MeshBasicMaterial({vertexColors:true})));
  // Contoured planning lines follow the actual terrain rather than cutting through hills.
  const lines=[],limit=campaign?34:115,spacing=campaign?4:10;
  for(let n=-limit;n<=limit;n+=spacing)for(let d=-limit;d<limit;d+=2){
    lines.push(n,height(n,d)+.035,d,n,height(n,d+2)+.035,d+2);
    lines.push(d,height(d,n)+.035,n,d+2,height(d+2,n)+.035,n);
  }
  const lineGeo=new T.BufferGeometry();lineGeo.setAttribute("position",new T.Float32BufferAttribute(lines,3));
  const grid=new T.LineSegments(lineGeo,new T.LineBasicMaterial({color:0xf8f1d9,transparent:true,opacity:.16,depthWrite:false}));planning.add(grid);
  function boundary(x0,x1,z0,z1,col){
    const pts=[];for(let i=0;i<=120;i++){const t=i/30,side=Math.floor(t),f=t-side;let x,z;
      if(side===0){x=x0+(x1-x0)*f;z=z0}else if(side===1){x=x1;z=z0+(z1-z0)*f}else if(side===2){x=x1-(x1-x0)*f;z=z1}else{x=x0;z=z1-(z1-z0)*f}
      if(i===120){x=x0;z=z0}pts.push(new T.Vector3(x,height(x,z)+.09,z));
    }
    planning.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:col,transparent:true,opacity:.8})));
  }
  if(campaign&&!freePlacement){boundary(-34,-2,-34,34,0x72d4ed);boundary(2,34,-34,34,0xffa49a)}else boundary(-limit,limit,-limit,limit,0xe1e9c5);
  const ray=new T.Raycaster();let time=0;
  function frame(dt,reduced=false){
    if(!reduced)time+=dt;
    rotor.rotation.z=-time*.65;
    const t=(time*6/length+.12)%1;
    trainCars.forEach((car,i)=>{const u=(t-i*5.7/length+1)%1;car.position.copy(curve.getPointAt(u));const d=curve.getTangentAt(u);car.rotation.y=Math.atan2(d.x,d.z)});
    wheels.forEach(w=>w.rotation.y=time*10);
    for(const a of animated)if(a.userData.flag){const p=a.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(time*2.8+p.getX(i)*2.3)*.13*(p.getX(i)+1.3)/2.6);p.needsUpdate=true}else a.position.x=((a.position.x+extent*.75+dt*(reduced?0:1.5))%(extent*1.5))-extent*.75;
    if(!reduced){for(const puff of smoke){puff.age+=dt;if(puff.age>2){puff.age=0;puff.m.position.copy(trainCars[0].position);const d=curve.getTangentAt(t);puff.m.position.addScaledVector(d,1.5);puff.m.position.y+=3.3}puff.m.visible=puff.age>0;puff.m.position.y+=dt*1.6;puff.m.position.x+=dt*.5;puff.m.scale.setScalar(.5+puff.age*.6);puff.m.material.opacity=(1-puff.age/2)*.4}}
    else for(const puff of smoke)puff.m.visible=false;
  }
  function rayDistance(ox,oy,oz,dx,dy,dz,max){
    ray.set(new T.Vector3(ox,oy,oz),new T.Vector3(dx,dy,dz));ray.far=max;surface.updateMatrixWorld();return ray.intersectObject(surface,false)[0]?.distance??max;
  }
  frame(0,true);
  for(const puff of smoke){puff.m.position.copy(trainCars[0].position);puff.m.position.y+=3.3+puff.age*1.6}
  return{group,surface,height,frame,rayDistance,spec,planning};
}
function light(mapIndex){
  const spec=maps[mapIndex],th=THEMES[spec.theme];Sky.set(th);
  sc.background=new T.Color(spec.sky);sc.fog=new T.Fog(spec.sky,160,390);
  hemi.color.setHex(0xe6f2ff);hemi.groundColor.setHex(spec.rock);hemi.intensity=.83;
  sun.color.setHex(spec.sun);sun.intensity=.95;sun.position.set(-45,75,35);
  Sky.u.sunDir.value.copy(sun.position).normalize();Sky.u.sunCol.value.setHex(spec.sun);
}
function decorate(g,t,col){
  const u=g.userData,metal=new T.MeshLambertMaterial({color:0x3c5362}),team=new T.MeshLambertMaterial({color:col}),ivory=new T.MeshLambertMaterial({color:0xf3dfb8}),gold=new T.MeshLambertMaterial({color:0xd4a65f});
  u.mats.push(metal,team,ivory,gold);
  const add=(parent,geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
  const box=(p,w,h,d,m,x,y,z)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
  if(t.human){
    box(u.head,.42,.2,.4,metal,0,.21,0);box(u.head,.47,.06,.46,ivory,0,.13,0);
    box(u.torso,.58,.45,.1,metal,0,.03,.21);box(u.torso,.13,.34,.03,team,0,.05,.28);
    for(const s of[-1,1])box(g,.31,.2,.38,team,s*.37,1.58,0);
    if(t.id==="brawler"){
      const hand=u.arms[1].userData.el;box(hand,.12,.65,.12,gold,0,-.35,.12);
      box(hand,.22,.85,.07,ivory,0,-.95,.12);box(hand,.52,.1,.13,gold,0,-.52,.12);
    }
    if(t.shield){
      const shield=new T.Group();shield.position.set(-.39,1.05,.55);g.add(shield);
      box(shield,.92,1.22,.12,metal,0,0,0);box(shield,.77,1.06,.14,team,0,0,.05);
      box(shield,.14,.85,.03,ivory,0,0,.14);box(shield,.58,.13,.03,ivory,0,.05,.15);
    }
    if(t.ranged){box(u.torso,.42,.52,.25,metal,0,0,-.3);box(u.head,.27,.11,.1,gold,0,.02,.25)}
  }else{
    for(const s of[-1,1]){
      const shoulder=add(g,new T.IcosahedronGeometry(t.id==="runner"?.2:.36,0),metal,s*.58,1.55,0);
      if(t.id==="brute"||t.id==="titan")for(let i=0;i<2;i++)add(shoulder,new T.ConeGeometry(.12,.45,4),ivory,s*.12,.26,i*.2-.1);
    }
    if(t.id==="runner"){g.scale.z*=.8;box(u.head,.64,.12,.08,team,0,.22,.29)}
    if(t.id==="brute"||t.id==="titan"){
      box(u.torso,1.02,.62,.18,metal,0,.12,.38);box(u.torso,.2,.45,.05,gold,0,.15,.49);
      if(t.id==="titan")for(let i=-1;i<=1;i++)add(u.head,new T.ConeGeometry(.16,.6+(i===0?.2:0),4),gold,i*.25,.55,0);
    }
    if(t.poison||t.bomb){
      const glow=new T.MeshLambertMaterial({color:t.poison?0xc1ec83:0xffb45f,emissive:t.poison?0x578b27:0xc45413,emissiveIntensity:.5});glow.userData.em=t.poison?0x578b27:0xc45413;u.mats.push(glow);
      for(const s of[-1,1])add(u.torso,new T.CylinderGeometry(.25,.25,.8,8),glow,s*.34,.1,-.48);
      if(t.bomb)box(u.torso,.65,.5,.24,metal,0,.1,.43);
    }
    if(t.hover){
      const halo=add(g,new T.TorusGeometry(.62,.045,5,24),ivory,0,2.55,0);halo.rotation.x=Math.PI/2;
      u.legs.forEach(l=>l.visible=false);
      add(u.torso,new T.ConeGeometry(.58,1.15,7),team,0,-.55,0).rotation.z=Math.PI;
    }
  }
}
function portrait(id,color="#68c8e8"){
  const human=["brawler","shield","rifle"].includes(id),heavy=["brute","titan"].includes(id);
  const body=human?'<path d="M29 38 40 33 51 38 54 66H26Z"/>':'<path d="M22 36 40 30 58 36 64 66H16Z"/>';
  let detail='';
  if(id==="brawler")detail='<path d="M61 26 65 17 69 26 66 57H62Z" fill="#f3e6c5"/><path d="M56 48H73" stroke="#d6ac6a" stroke-width="4"/>';
  if(id==="shield")detail='<path d="M42 39 67 35 66 58 55 69 43 58Z" fill="#334f65" stroke="#e9d9b4" stroke-width="2"/><path d="M54 40V60M46 48H63" stroke="#e9d9b4" stroke-width="3"/>';
  if(id==="rifle")detail='<path d="m40 44 32-6 1 6-32 7Z" fill="#263b4c"/><path d="m53 44 3 12 6-1-4-13" fill="#d5b07a"/>';
  if(heavy)detail='<path d="m20 37-8-10 15 3M59 37l8-10-15 3" fill="#f3e6c5"/><path d="M27 39H53V54H27Z" fill="#344f62"/><path d="M37 40H43V53H37Z" fill="#d6ac6a"/>';
  if(id==="titan")detail+='<path d="m27 19-2-13 10 6 5-10 5 10 10-6-2 13Z" fill="#e8bd65"/>';
  if(id==="runner")detail='<path d="m21 29-7-13 14 7M59 29l7-13-14 7" fill="#eee1c0"/>';
  if(id==="spitter"||id==="bomber")detail=`<rect x="14" y="38" width="10" height="23" rx="4" fill="${id==="spitter"?"#c5e985":"#ffb45f"}"/><rect x="56" y="38" width="10" height="23" rx="4" fill="${id==="spitter"?"#c5e985":"#ffb45f"}"/>`;
  if(id==="ghost")detail='<ellipse cx="40" cy="11" rx="17" ry="4" fill="none" stroke="#f3e6c5" stroke-width="3"/><path d="m22 54-5 15 13-5 10 9 10-9 13 5-5-15" fill="currentColor" opacity=".65"/>';
  return`<svg class="cb-portrait" viewBox="0 0 80 80" aria-hidden="true" style="color:${color}"><ellipse cx="40" cy="71" rx="26" ry="5" fill="#122333" opacity=".28"/><g fill="currentColor">${body}<path d="M26 20 40 15 54 20 52 35 40 39 28 35Z"/></g><path d="M29 23H51V31H29Z" fill="#233b50"/><path d="M32 26H37M43 26H48" stroke="#f3e6c5" stroke-width="2"/>${human?'<path d="M25 21 29 13H51L55 21Z" fill="#d9d9ce"/>':""}${detail}</svg>`;
}
return{maps,profile,create,light,decorate,portrait};
})();
