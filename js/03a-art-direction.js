"use strict";
// SCRAPYARD FIELD CLUB — one palette and shape vocabulary for every game mode.
// Geometry only: no model downloads, postprocessing passes, or gameplay changes.
const YardArt = (() => {
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const C = {ink:0x263d3c,iron:0x425d5b,paper:0xf4e5be,rust:0xcb613f,teal:0x478f8b,
    brass:0xd9ac56,leaf:0x91a96c,skin:0xe7b482,boot:0x293c39};
  // Bevels catch the sun without needing normal maps or a smooth high-poly surface.
  function bevel(w,h,d,cut=.045) {
    const b=Math.min(cut,w*.22,h*.22,d*.22),shape=new T.Shape();
    shape.moveTo(-w/2+b,-h/2+b);shape.lineTo(w/2-b,-h/2+b);
    shape.lineTo(w/2-b,h/2-b);shape.lineTo(-w/2+b,h/2-b);shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:d-2*b,bevelEnabled:true,bevelSegments:1,
      steps:1,bevelSize:b,bevelThickness:b,curveSegments:1});
    geo.translate(0,0,-d/2+b);geo.computeVertexNormals();return geo;
  }
  function material(c,mats) {const m=new T.MeshLambertMaterial({color:c,flatShading:true});if(mats)mats.push(m);return m;}
  function mesh(parent,geo,mat,x=0,y=0,z=0,hit,head=false) {
    const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.userData.head=head;
    parent.add(m);if(hit)hit.push(m);return m;
  }
  function box(p,w,h,d,m,x,y,z,hit,head){return mesh(p,bevel(w,h,d),m,x,y,z,hit,head);}
  function replaceGeometry(m,geo){m.geometry.dispose();m.geometry=geo;}
  // Merge static pieces on each moving bone. A crowded army should not pay a
  // draw call for every eye, cuff, bolt and tooth. Hit ownership follows the merge.
  function batchBones(g){
    const u=g.userData,oldHits=new Set(u.hit),removed=new Set(),newHits=[];
    const parents=[u.head,u.torso,...u.legs,...u.arms,...u.arms.map(a=>a.userData.el).filter(Boolean)];
    for(const parent of parents){
      const groups=new Map();
      for(const m of parent.children){
        if(!m.isMesh||!m.visible||m.material===HURT||Array.isArray(m.material))continue;
        const key=m.material.uuid+':'+!!m.userData.head;
        if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
      }
      for(const entries of groups.values()){
        if(entries.length<2)continue;
        const pos=[],norm=[],uv=[];let target=false;
        for(const m of entries){
          m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);
          pos.push(...geo.attributes.position.array);norm.push(...geo.attributes.normal.array);
          if(geo.attributes.uv)uv.push(...geo.attributes.uv.array);else for(let i=0;i<geo.attributes.position.count;i++)uv.push(0,0);
          geo.dispose();m.geometry.dispose();parent.remove(m);removed.add(m);target=target||oldHits.has(m);
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
        const m=mesh(parent,geo,entries[0].material,0,0,0,null,entries[0].userData.head);if(target)newHits.push(m);
      }
    }
    u.hit=u.hit.filter(m=>!removed.has(m)).concat(newHits);
  }
  function human(g,o) {
    const u=g.userData,head=u.head,torso=u.torso,skin=u.mats[2];
    skin.color.setHex(o.skin||C.skin);
    u.mats.forEach(m=>{m.flatShading=true;});
    u.mats[3].color.setHex(C.iron);u.mats[4].color.setHex(C.boot);
    const cream=material(C.paper,u.mats),dark=material(C.ink,u.mats),brass=material(C.brass,u.mats);
    replaceGeometry(torso.children[0],bevel(.52,.64,.32,.065));
    replaceGeometry(torso.children[1],bevel(.57,.15,.35,.03));
    replaceGeometry(head.children[0],bevel(.37,.36,.34,.06));
    replaceGeometry(head.children[1],bevel(.39,.12,.36,.04));
    // Two uneven eyes, a wedge nose and a crooked brow replace the blank visor.
    head.children[2].visible=false;head.children[3].visible=false;
    [-1,1].forEach(s=>{
      box(head,.105,s<0?.09:.08,.025,cream,s*.092,.025,.176);
      box(head,.036,.053,.025,dark,s*.088,.022,.192);
      const brow=box(head,.12,.027,.024,dark,s*.093,.092,.187);brow.rotation.z=s<0?.13:-.07;
      mesh(head,new T.CylinderGeometry(.045,.045,.035,6),skin,s*.191,-.025,0);
    });
    const nose=mesh(head,new T.ConeGeometry(.045,.09,4),skin,0,-.022,.211);nose.rotation.x=Math.PI/2;
    box(head,.08,.022,.018,dark,.024,-.112,.181);
    if(!o.style||o.style==="armor"){
      mesh(head,new T.CylinderGeometry(.22,.23,.12,6),cream,0,.19,0,u.hit,true);
      box(head,.33,.04,.16,cream,0,.145,.18,u.hit,true);
      box(head,.07,.13,.025,u.mats[0],.035,.2,.205);
    }
    // Work jacket, cross-body strap and a little brass club badge.
    const strap=box(torso,.072,.55,.022,dark,-.12,.01,.18);strap.rotation.z=-.27;
    box(torso,.17,.15,.05,u.mats[1],.125,-.10,.19);
    mesh(torso,new T.CylinderGeometry(.048,.048,.025,6),brass,.15,.18,.185).rotation.x=Math.PI/2;
    box(torso,.09,.06,.025,brass,0,-.282,.17);
    u.legs.forEach(l=>{
      replaceGeometry(l.children[0],bevel(.22,.78,.25,.035));
      replaceGeometry(l.children[1],bevel(.285,.18,.39,.045));
      l.children[1].position.set(0,-.81,.045);
      box(l,.29,.045,.39,brass,0,-.88,.045);
      box(l,.22,.12,.27,u.mats[0],0,-.42,0);
    });
    u.arms.forEach((a,i)=>{
      replaceGeometry(a.children[0],bevel(.19,UA,.19,.025));
      replaceGeometry(a.userData.el.children[0],bevel(.18,FA,.18,.025));
      box(a.userData.el,.205,.08,.205,cream,0,-FA+.06,0);
      if(!i)box(a,.25,.13,.26,brass,0,.025,0);
    });
    g.userData.artStyle="scrapyard";
    batchBones(g);
  }
  function monster(k) {
    const g=new T.Group(),hit=[],mats=[],pal=[0x789863,0x86779f,0xc46648];
    const body=material(pal[k],mats),ink=material(0x202d32,mats),bone=material(0xb6c4be,mats),
      trim=material(k===1?C.teal:C.brass,mats),iron=material(C.iron,mats);
    const rust=material(0xa95737,mats),lens=material(k===1?0x7edbd5:0xffcc68,mats);
    lens.emissive.setHex(k===1?0x266363:0x6b3a0c);lens.emissiveIntensity=.55;
    const add=(p,w,h,d,m,x,y,z,head=false)=>box(p,w,h,d,m,x,y,z,hit,head);
    const torso=new T.Group();torso.position.y=1.1;g.add(torso);
    const hd=new T.Group();hd.position.set(0,1.85,.15);g.add(hd);
    const legs=[limb(g,-.25,.7,0,.3,.7,.3,ink,hit),limb(g,.25,.7,0,.3,.7,.3,ink,hit)];
    const arms=[limb(g,-.6,1.55,0,.2,1.1,.2,body,hit),limb(g,.6,1.55,0,.2,1.1,.2,body,hit)];
    add(torso,k===1?.73:.92,1,.62,body,0,0,0);
    add(torso,k===1?.75:.95,.14,.65,iron,0,-.38,0);
    // Each family has a different face and silhouette, even without its color.
    if(k===0){ // Scavenger: a dented appliance shell with a salvaged camera eye.
      add(hd,.65,.48,.53,body,0,0,0,true);
      add(hd,.72,.085,.59,iron,0,.25,0,true);
      add(hd,.51,.13,.59,rust,0,-.205,.025,true);
      const eye=mesh(hd,new T.CylinderGeometry(.126,.126,.065,8),ink,-.14,.035,.29,hit,true);eye.rotation.x=Math.PI/2;
      mesh(hd,new T.CylinderGeometry(.084,.084,.068,8),lens,-.14,.035,.305).rotation.x=Math.PI/2;
      add(hd,.024,.04,.02,bone,-.16,.065,.35);
      const patch=add(hd,.19,.18,.055,rust,.16,.025,.285,true);patch.rotation.z=.17;
      add(hd,.055,.055,.03,bone,.15,.02,.32);
      const brow=add(hd,.2,.05,.055,iron,.15,.13,.285);brow.rotation.z=-.2;
      for(const s of[-1,1]){
        mesh(hd,new T.CylinderGeometry(.06,.06,.09,6),trim,s*.34,-.1,.18,hit,true).rotation.z=Math.PI/2;
        const aerial=add(hd,.035,s<0?.34:.19,.035,iron,s*.26,.38,-.08,true);aerial.rotation.z=s*.28;
      }
      add(torso,.44,.38,.045,iron,.08,.12,.335);
      for(let n=-1;n<=1;n++)add(torso,.29,.035,.03,ink,.08,.12+n*.085,.37);
    }else if(k===1){ // Scout: a security-camera head, antennae and a narrow servo frame.
      add(hd,.54,.44,.5,body,0,0,0,true);
      add(hd,.46,.21,.055,ink,0,.015,.28,true);
      const camera=mesh(hd,new T.CylinderGeometry(.12,.15,.17,8),iron,.035,.015,.33,hit,true);camera.rotation.x=Math.PI/2;
      mesh(hd,new T.CylinderGeometry(.085,.085,.025,8),lens,.035,.015,.43).rotation.x=Math.PI/2;
      add(hd,.25,.08,.07,rust,-.1,-.17,.285,true);
      for(const s of[-1,1]){
        const aerial=add(hd,.055,s<0?.48:.32,.045,iron,s*.22,.35,-.04,true);aerial.rotation.z=-s*.38;
        add(hd,.11,.06,.08,trim,s*.30,s<0?.57:.49,-.04);
      }
      add(torso,.78,.18,.65,trim,0,.4,0);
      const battery=add(torso,.24,.48,.2,rust,.26,.03,-.36);battery.rotation.z=-.12;
    }else{ // Boiler brute: heavy square jaw, rivets and twin exhausts.
      add(hd,.69,.5,.58,body,0,0,0,true);
      add(hd,.76,.15,.62,iron,0,.215,0,true);
      add(hd,.64,.18,.64,iron,0,-.19,.025,true);
      add(hd,.56,.13,.05,ink,0,.02,.31,true);
      for(const s of[-1,1]){
        add(hd,.15,.055,.035,lens,s*.15,.025,.345);
        mesh(hd,new T.CylinderGeometry(.065,.065,.08,6),trim,s*.37,.2,0,hit,true).rotation.z=Math.PI/2;
        mesh(torso,new T.CylinderGeometry(.1,.1,.65,6),iron,s*.31,.52,-.38,hit);
        mesh(torso,new T.CylinderGeometry(.14,.14,.09,6),trim,s*.31,.88,-.38,hit);
      }
      add(hd,.42,.09,.035,ink,0,-.16,.353);
      for(let n=-2;n<=2;n++)add(hd,.025,.09,.03,bone,n*.08,-.16,.38);
      add(torso,.82,.48,.07,iron,0,.10,.36);
      for(let i=-1;i<=1;i++){const stripe=add(torso,.1,.35,.025,trim,i*.18,.1,.41);stripe.rotation.z=-.3;}
    }
    legs.forEach((l,i)=>{
      replaceGeometry(l.children[0],bevel(.15,.7,.16));l.children[0].material=iron;
      mesh(l,new T.CylinderGeometry(.13,.13,.34,8),ink,0,-.31,0,hit).rotation.z=Math.PI/2;
      add(l,.25,.24,.11,i?rust:body,0,-.44,.12);
      add(l,.36,.16,.47,body,0,-.61,.09);
      add(l,.37,.05,.48,ink,0,-.68,.09);
    });
    arms.forEach((a,i)=>{
      replaceGeometry(a.children[0],bevel(.12,1.1,.14));a.children[0].material=iron;
      mesh(a,new T.CylinderGeometry(.14,.14,.24,8),ink,0,-.02,0,hit).rotation.z=Math.PI/2;
      mesh(a,new T.CylinderGeometry(.11,.11,.24,8),bone,0,-.55,0,hit).rotation.z=Math.PI/2;
      const plate=add(a,.28,.28,.31,i?rust:body,0,-.24,.04);plate.rotation.z=i?.13:-.11;
      add(a,k===2?.34:.28,.25,.3,i?iron:trim,0,-.91,0);
      for(const s of[-1,1]){const claw=add(a,.065,.19,.11,bone,s*.105,-1.1,.065);claw.rotation.z=-s*.2;add(a,.065,.06,.16,iron,s*.075,-1.19,.1);}
    });
    // Bolted mismatched repairs, a spare wheel, and two exposed insulated cables.
    const repair=add(torso,.3,.28,.055,rust,-.26,-.18,.345);repair.rotation.z=-.12;
    for(const x of[-.37,-.15])for(const y of[-.27,-.09])mesh(torso,new T.CylinderGeometry(.026,.026,.025,6),bone,x,y,.38).rotation.x=Math.PI/2;
    mesh(torso,new T.TorusGeometry(.23,.075,4,8),ink,-.17,0,-.4);
    mesh(torso,new T.CylinderGeometry(.12,.12,.14,6),iron,-.17,0,-.4).rotation.x=Math.PI/2;
    for(const s of[-1,1]){const curve=new T.CatmullRomCurve3([new T.Vector3(s*.34,.35,-.3),new T.Vector3(s*.48,.09,-.43),new T.Vector3(s*.3,-.28,-.35)]);mesh(torso,new T.TubeGeometry(curve,5,.035,4,false),s<0?trim:rust);}
    hurtBox(g,1.05,1.5,.75,0,.82,0,false,hit);hurtBox(hd,.78,.68,.66,0,0,0,true,hit);
    g.userData={legs,arms,torso,head:hd,hit,mats,ph:rnd()*6,sp:1,kick:0,artStyle:"scrapyard",family:k};
    batchBones(g);
    g.add(blobShadow(k===2?.85:.7));g.scale.setScalar(k===2?1.4:k===1?.95:1.05);return g;
  }
  function gun(grp,g) {
    // Side plates only. Optics, muzzle, grips and aim alignment stay unchanged.
    const brass=material(C.brass),paper=material(C.paper);
    for(const s of[-1,1]){
      mesh(grp,new T.BoxGeometry(.003,.047,Math.min(.10,g.l*.3)),brass,s*.047,-.004,g.l*.12);
      for(const z of[-.02,.02])mesh(grp,new T.BoxGeometry(.004,.012,.012),paper,s*.049,-.002,g.l*.12+z);
    }
  }
  const palettes={
    meadow:{sky:[0x7aadaf,0xb5cbc0,0xe1e3cb],fog:[0xd1d9c7,65,210],ground:["#828976","#89907a","#7b826e","#969780"],leaf:[0x507d65,0x688f69,0xb19e69,0x84a178],house:[0xc8cbb5,0xb8aa88,0x9cb6ac,0xbd8d70],roof:[0xb85c40,0x468582,0x455d58,0xb28c53]},
    sunset:{sky:[0x657d91,0xd6a08a,0xf4d4a4],fog:[0xe4c6a1,55,200],ground:["#a39d66","#a8a16d","#9c955f","#b0a674"],leaf:[0x6a8160,0xa09b58,0xc17f4b,0x72865c],house:[0xf0d3a3,0xd6b294,0xc1b4a1],roof:[0xaf5843,0x517875,0x74584d]},
    frost:{sky:[0x83a3b0,0xc3d5d4,0xf1e9cf],fog:[0xd8e3da,60,200],ground:["#e0e8d9","#e5ebdf","#dbe3d6","#e9eddf"],leaf:[0x477b77,0x60958b,0x426761],house:[0xe7d8b5,0xaac9c1,0xd1b294],roof:[0xb7664a,0x527d7b,0x6d8481]},
    desert:{sky:[0x79a3a8,0xc2ceba,0xf3d9ad],fog:[0xe9d6b3,65,210],ground:["#dcb783","#e1bd89","#d4ad7b","#e4c18f"],leaf:[0x75916b,0x99a36c,0x578171],house:[0xf0d3a4,0xdfb582,0xb2c3ab],roof:[0xb35d40,0x488682,0x856448]},
    autumn:{sky:[0x8ba8a2,0xcccfb3,0xf2deb5],fog:[0xe1d7b5,55,195],ground:["#b3a26d","#b8a773","#aa9964","#bbaa79"],leaf:[0xc37f44,0xcd9e51,0xa85d3c,0x889458],house:[0xefdab0,0xdbbd8e,0xb4c5b4],roof:[0xaf563e,0x527b70,0x72614d]},
    neon:{sky:[0x192f39,0x325455,0x78918a],fog:[0x3c625f,45,170],ground:["#415b50","#476156","#3c554a","#4d6659"],leaf:[0x5a9e8c,0x9ea86c,0x6b9e8e],house:[0x688b7c,0x8f9b80,0xb09573],roof:[0xa96846,0x3c7778,0x5b6e61]},
    toxic:{sky:[0x273b36,0x52634b,0xa3b176],fog:[0x6c805c,40,160],ground:["#68794c","#718153","#607245","#78885a"],leaf:[0xa7b76a,0x63866b,0xd0b66a],house:[0x83946d,0xabaa79,0x71927c],roof:[0x9e6b46,0x4b756c,0x61744c]}
  };
  for(const [key,p] of Object.entries(palettes)){
    const t=THEMES[key];t.sky=p.sky;t.fog=p.fog;t.cloud=0;t.cc=[.96,.94,.84];t.house=p.house;t.roof=p.roof;t.leaf=p.leaf;
    t.gr={base:p.ground[0],v:p.ground.slice(1),path:key==="frost"?"#bdcfc1":"#cfbb8e",edge:key==="frost"?"#a3b9ae":"#b3a078",plaza:key==="frost"?"#d8e0cd":"#e0cda4"};
    t.trim=C.iron;t.wall=key==="frost"?0x99afa4:0x9d9e7b;t.trunk=0x78654c;t.win=0xe6cf8e;t.lamp=0xf3d78e;
    t.sun={c:0xffe0a5,i:key==="neon"?.68:.92,d:[-.58,.72,.4]};t.hemi=[0xa9d2ce,0x7c7054,.77];
    t.mount=key==="frost"?[0x97b7b2,0xb6c8b7]:key==="desert"?[0xb18f6b,0xd4b38d]:[0x7b9d92,0xa8b8a0];
    t.crystal=0;t.snow=key==="frost"?1:0;t.flower=[0xe5bc67,0xcf7857,0xf2dfb1];
  }
  Object.assign(THEMES.ruin,{wall:0x728177,trim:0x425e57,win:0xe4c67f,lamp:0xf2c677,hemi:[0xb8caba,0x5a5541,.85],fog:[0x374c45,18,90]});
  THEMES.ruin.gr={base:"#7a8270",v:["#747d6b","#838a77"],path:"#8e927b",edge:"#566659",plaza:"#93967e"};
  // The starter work jacket sets the art direction; collectible outfits retain
  // their individual colors and IDs, including every saved/unlocked item.
  PS[0].c=C.teal;PS[0].t=C.paper;

  function house({P,L,w,d,h,th,ry}) {
    const put=(shape,lx,y,lz,sx,sy,sz,c,rz=0)=>{const p=L(lx,lz);P(shape,p[0],y,p[1],sx,sy,sz,c,ry,.9,null,0,rz);};
    // Painted corner posts, split shutters, an awning and a diamond workshop sign.
    for(const s of[-1,1]){
      put("box",s*(w/2-.12),h/2,d/2+.025,.18,h,.09,th.trim);
      put("box",s*w/4-.65,h*.62,d/2+.15,.23,1.02,.12,th.roof[1]);
      put("box",s*w/4+.65,h*.62,d/2+.15,.23,1.02,.12,th.roof[1]);
      put("box",s*w/4,h*.62,d/2+.145,.065,.78,.035,C.paper);
      put("box",s*w/4,h*.62,d/2+.15,.9,.065,.035,C.paper);
    }
    for(let i=0;i<5;i++)put("box",(i-2)*.3,2.17,d/2+.26,.3,.13,.62,i%2?C.paper:th.roof[0]);
    put("box",0,Math.min(h-.3,2.65),d/2+.13,.36,.36,.06,C.brass,Math.PI/4);
    put("box",0,Math.min(h-.3,2.65),d/2+.17,.16,.16,.035,C.ink,Math.PI/4);
    put("box",w/2+.09,h*.42,0,.12,h*.78,.14,C.iron);
    // Salvaged sheet metal siding, with mismatched repairs and corrugations.
    for(let n=-2;n<=2;n++)put("box",-w*.35,h*.3,n*d*.13,.13,h*.4,.055,n%2?C.rust:C.iron);
    put("box",-w*.35,h*.3,-d*.27,.14,.08,d*.6,C.brass);
    put("box",-w*.35,h*.12,-d*.27,.14,.08,d*.6,C.iron);
  }
  function junkyard(group,{extent=40,seed=1,height=()=>0,platforms=false}={}){
    // Large scrap sits outside the playable boundary. No new invisible obstacles.
    const rng=mkRng((seed^0x6bda2189)>>>0),batch=new Batch();
    const p=(geo,x,y,z,w,h,d,c,ry=0,rx=0,rz=0)=>batch.add(typeof geo==='string'?U[geo]:geo,mt(x,y,z,w,h,d,ry,rx,rz),c,.8,1);
    const tire=new T.TorusGeometry(.5,.18,4,10).toNonIndexed(),pipe=new T.CylinderGeometry(.5,.5,1,8,1,true).toNonIndexed();
    const count=platforms?12:10;
    for(let i=0;i<count;i++){
      const side=i%4,along=(rng()-.5)*extent*1.55,out=extent+(platforms?29:8)+rng()*5;
      const x=side<2?(side===0?-out:out):along,z=side<2?along:(side===2?-out:out),y=height(x,z);
      if(platforms)p('box',x,(y-13)/2,z,11,y+13,9,0x5d6455);
      // Crushed appliance shells and containers, stacked at untidy angles.
      for(let n=0;n<5;n++){
        const xx=x+(rng()-.5)*5,zz=z+(rng()-.5)*4,h=1.1+rng()*1.7,yy=y+h/2+(n>2?1.2:0),a=(rng()-.5)*.6;
        const col=[C.rust,C.teal,0xa2916d,0x798577,0x665c4b][n];
        p('box',xx,yy,zz,2.2,h,1.7,col,a,.04,(rng()-.5)*.13);
        p('box',xx,yy,zz+.86,1.6,h*.55,.08,0x324649,a);
        for(let rib=-1;rib<=1;rib++)p('box',xx+rib*.48,yy,zz+.92,.055,h*.7,.055,0xa7a78e,a);
      }
      for(let n=0;n<5;n++){const xx=x+3+(n%2)*.35,zz=z+(n%3)*.7;p(tire,xx,y+.3+Math.floor(n/2)*.35,zz,1.15,1.15,1.15,0x263536,rng(),Math.PI/2);}
      for(let n=0;n<3;n++){p(pipe,x-3,y+.45+n*.65,z+n*.2,1.1,3,1.1,n%2?0x8e674a:0x76847b,0,Math.PI/2);}
      if(i%3===0){
        // Bent salvage gantries and a hanging electromagnet silhouette.
        p('box',x-3,y+5,z,.55,10,.55,C.iron);p('box',x,y+9.8,z,6.5,.5,.6,C.rust,0,0,-.14);
        p('cyl',x+2,y+7,z,.06,4.6,.06,C.iron);p('cyl',x+2,y+4.5,z,1.5,.45,1.5,C.iron);
        p('box',x-3,y+.4,z,2,.8,2,C.brass);
      }
    }
    tire.dispose();pipe.dispose();
    const m=batch.mesh(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));m.name='salvage-yard';m.castShadow=true;m.receiveShadow=true;group.add(m);
  }
  function scatter(group,{extent=40,seed=1,theme="meadow",height=()=>0,clear=()=>true}={}){
    // A separate seed and two batched meshes: decoration never changes spawn RNG,
    // collision boxes, pathfinding, budgets, or the maker's placement bounds.
    const rand=mkRng((seed^0x47f92a31)>>>0),parts=new Batch(),positions=[],colors=[];
    const snow=theme==="frost",indoor=theme==="ruin",sand=theme==="desert";
    const earth=snow?[0xb6c6b8,0xc2cdbb]:sand?[0xbe9e73,0xc6a77d]:indoor?[0x606f5d,0x6e7761]:[0x8c9062,0x9c996d,0xb1a77b];
    const sheets=[0xe9e5cf,0xd9dfcc,0xd4bd91,0xa8c7ba];
    const density=Math.max(.25,LOD.props),clusters=Math.round(Math.min(2100,extent*extent*.16)*density);
    // Batch consumes triangle vertices, so indexed shapes must be expanded first.
    const color=new T.Color(),ring=new T.RingGeometry(.05,.105,6).toNonIndexed();ring.rotateX(-Math.PI/2);
    function triangle(a,b,c,col){color.setHex(col);for(const v of[a,b,c]){positions.push(...v);colors.push(color.r,color.g,color.b);}}
    function patch(x,z,r,col){
      const center=[x,height(x,z)+.014,z],points=[],n=5+Math.floor(rand()*3),angle=rand()*6.283;
      for(let j=0;j<n;j++){const a=angle+j/n*6.283,l=r*(.65+rand()*.35),px=x+Math.cos(a)*l,pz=z+Math.sin(a)*l*.65;points.push([px,height(px,pz)+.014,pz]);}
      for(let j=0;j<n;j++)triangle(center,points[(j+1)%n],points[j],col);
    }
    function paper(x,z){
      const w=.13+rand()*.15,d=w*(1.2+rand()*.55),a=rand()*6.283,c=Math.cos(a),s=Math.sin(a),col=sheets[Math.floor(rand()*sheets.length)];
      const at=(px,pz,lift=0)=>{const xx=x+px*c+pz*s,zz=z-px*s+pz*c;return[xx,height(xx,zz)+.024+lift,zz];};
      const p=[at(-w/2,-d/2),at(w/2,-d/2),at(w/2,d/2,.035),at(-w/2,d/2)];
      triangle(p[0],p[2],p[1],col);triangle(p[0],p[3],p[2],col);
      // A short printed stripe makes it read as a scrap of paper at close range.
      if(rand()>.38){const q=[at(-w*.28,-d*.1,.003),at(w*.28,-d*.1,.003),at(w*.28,-d*.035,.004),at(-w*.28,-d*.035,.004)];triangle(q[0],q[2],q[1],0x7f9d8e);triangle(q[0],q[3],q[2],0x7f9d8e);}
    }
    for(let i=0;i<clusters;i++){
      const x=(rand()-.5)*(extent*2-3),z=(rand()-.5)*(extent*2-3);
      if(!clear(x,z))continue;
      if(i%3===0)patch(x,z,.35+rand()*.8,earth[i%earth.length]);
      const kind=rand(),n=1+Math.floor(rand()*3);
      for(let j=0;j<n;j++){
        const px=x+(rand()-.5)*1.5,pz=z+(rand()-.5)*1.5,y=height(px,pz),a=rand()*6.283;
        if(!clear(px,pz))continue;
        if(kind<.55){paper(px,pz);}
        else if(kind<.72){ // Tiny stones, bright on one face.
          const r=.09+rand()*.14;parts.add(U.ico,mt(px,y+r*.25,pz,r*1.5,r*.7,r,a),snow?0xa4b6ad:0x9a9b80,.85,1);
        }else if(kind<.85){ // Offcuts of the same wood used in crates and station platforms.
          parts.add(U.box,mt(px,y+.025,pz,.06+rand()*.04,.045,.25+rand()*.3,a),i%2?0xa68c60:0x8a7855,.9,1);
        }else if(kind<.94){parts.add(ring,mt(px,y+.025,pz,1,1,1,a),C.iron,1,1);}
        else{ // Rusted corrugated offcuts, kept below step height.
          parts.add(U.box,mt(px,y+.025,pz,.36,.035,.5,a),i%2?0x819f89:0xa66845,.9,1);
          for(let r=-1;r<=1;r++){const off=r*.1;parts.add(U.box,mt(px+Math.cos(a)*off,y+.052,pz-Math.sin(a)*off,.025,.025,.48,a),C.iron,.9,1);}
        }
      }
    }
    ring.dispose();
    if(positions.length){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
      const m=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));m.name='yard-dirt-and-paper';m.receiveShadow=true;group.add(m);}
    if(parts.p.length){const m=parts.mesh(new T.MeshLambertMaterial({vertexColors:true}));m.name='yard-small-debris';m.receiveShadow=true;group.add(m);}
  }
  function world(group,key,seed,opt={}) {
    const batch=new Batch(),p=(shape,x,y,z,w,h,d,c,ry=0,rz=0)=>batch.add(U[shape],mt(x,y,z,w,h,d,ry,0,rz),c,.9,1);
    const rand=mkRng((seed^0x73a4e19)>>>0),th=THEMES[key],anim=[];
    group.userData.yard={anim};
    if(key==="ruin"){
      // A foundry rather than an anonymous black room: beam straps and pipework.
      for(const side of[-1,1])for(let n=-30;n<=30;n+=15){
        p("box",side*39,4.8,n,.38,.38,12,C.brass);
        p("box",side*38.85,3.5,n,.1,.6,1.4,C.rust);
      }
      const cv=document.createElement('canvas');cv.width=256;cv.height=160;const ctx=cv.getContext('2d');
      ctx.fillStyle='#e5cf9d';ctx.fillRect(0,0,256,160);ctx.fillStyle='#304d41';ctx.fillRect(8,8,240,144);ctx.fillStyle='#e5cf9d';
      ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('FOUNDRY',128,42);ctx.font='bold 69px sans-serif';ctx.fillText('07',128,112);
      ctx.fillStyle='#cd764e';for(let i=0;i<7;i++)ctx.fillRect(25+i*31,132,21,9);
      const map=new T.CanvasTexture(cv),sign=new T.MeshBasicMaterial({map});
      for(const side of[-1,1]){const m=new T.Mesh(new T.PlaneGeometry(4.6,2.875),sign);m.position.set(side*39.85,3.3,-6);m.rotation.y=-side*Math.PI/2;group.add(m);}
    }else if(!opt.level){
      // Broad polygon cloud silhouettes are batched into one draw call with the scenery.
      for(let i=0;i<9;i++){
        const a=i/9*Math.PI*2,x=Math.cos(a)*145,z=Math.sin(a)*145,y=44+rand()*18;
        p("ico",x,y,z,21,7,10,0xf2ead0,a);p("ico",x+8,y-1,z,17,5,9,0xe2e1c7,a);
      }
      if(!opt.custom&&!opt.parkour){
        // Landmark beyond the collision wall: a salvaged water tower and wind rotor.
        const x=-48,z=-25;
        for(const s of[-1,1])for(const q of[-1,1])p("box",x+s*2.8,5,z+q*2.8,.5,10,.5,C.iron);
        p("cyl",x,11.3,z,7.5,5.3,7.5,C.teal);p("cyl",x,11.3,z,7.6,.45,7.6,C.paper);
        p("cone",x,14.3,z,8.5,1.3,8.5,C.rust);p("cyl",x,8.5,z,8,.3,8,C.iron);
        p("box",x+5,7,z,.3,14,.3,C.iron);
        const rotor=new T.Group();rotor.position.set(x+5,13,z+.45);group.add(rotor);
        const rm=material(C.paper);
        for(let i=0;i<6;i++){
          const arm=new T.Group();arm.rotation.z=i*Math.PI/3;
          box(arm,.53,2.1,.09,rm,.12,1.45,0);rotor.add(arm);
        }
        anim.push(rotor);
        // Two-tone gate caps and flags identify the same club in every biome.
        for(const side of[-1,1]){
          p("box",side*14,4.2,-40,2,.32,2,C.rust);
          p("cyl",side*14,5.4,-40,.12,2.2,.12,C.iron);
          p("box",side*14+.7,6.1,-40,1.4,.8,.06,C.brass);
        }
      }
    }
    if(batch.p.length){const m=batch.mesh(material(0xffffff));m.material.vertexColors=true;m.castShadow=true;m.receiveShadow=true;group.add(m);}
    if(!opt.custom&&!opt.parkour&&!opt.level){scatter(group,{seed,theme:key,clear:(x,z)=>!blocked(x,z,.1,.2)});if(key!=="ruin")junkyard(group,{seed});}
  }
  function frame(dt){const y=WORLD.group?.userData.yard;if(y&&!reducedMotion.matches)for(const rotor of y.anim)rotor.rotation.z-=dt*.34;}
  return {C,bevel,human,monster,gun,house,world,scatter,junkyard,frame};
})();
