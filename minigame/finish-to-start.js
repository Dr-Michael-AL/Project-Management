(()=>{
  'use strict';
  const canvas=document.getElementById('arcadeCanvas');
  const ctx=canvas.getContext('2d');
  const startButton=document.getElementById('arcadeStart');
  const stats=document.getElementById('arcadeStats');
  const avatarImage=new Image();
  avatarImage.src='assets/scientist-runner.png';
  const keys={};
  const levels=[
    {name:'Baseline Plan',speed:90,ceiling:44,platforms:[[0,420,300],[350,390,250],[650,350,290],[990,405,250],[1290,345,320],[1660,400,260],[1970,330,360]],pitfalls:[[530,374],[1170,389]]},
    {name:'Resource Pressure',speed:125,ceiling:62,platforms:[[0,420,230],[285,365,170],[505,415,190],[755,330,190],[1000,400,155],[1215,300,210],[1485,385,170],[1710,315,185],[1955,405,310]],pitfalls:[[390,349],[610,399],[1090,384],[1575,369],[1810,299]]},
    {name:'Critical Path',speed:160,ceiling:84,platforms:[[0,420,190],[250,350,140],[445,410,150],[655,300,160],[875,390,145],[1075,270,175],[1310,370,140],[1505,285,145],[1715,400,150],[1930,310,170],[2160,395,270]],pitfalls:[[325,334],[520,394],[740,284],[950,374],[1160,254],[1375,354],[1785,384],[2010,294]]},
    {name:'Race to Clinic',speed:205,ceiling:108,platforms:[[0,420,165],[225,335,125],[410,405,125],[600,275,140],[805,380,120],[995,245,145],[1200,355,120],[1385,260,125],[1580,395,120],[1770,290,125],[1965,390,120],[2150,300,130],[2340,410,270]],pitfalls:[[285,319],[465,389],[665,259],[860,364],[1060,229],[1255,339],[1640,379],[1830,274],[2025,374],[2210,284]]}
  ];
  let levelIndex=0,playing=false,paused=false,last=0,worldX=0,score=0,lives=3,player,platforms=[],milestones=[],pitfalls=[];
  function loadLevel(index,preserve=true){
    levelIndex=index;if(!preserve){score=0;lives=3;}worldX=0;
    player={x:115,y:350,w:34,h:48,vx:0,vy:0,onGround:false,invulnerable:0};
    const L=levels[index];
    platforms=L.platforms.map((p,i)=>({x:p[0],y:p[1],w:p[2],h:24,label:`TASK ${i+1}`}));
    milestones=platforms.slice(1).map(p=>({x:p.x+p.w*.58,y:p.y-35,collected:false}));
    pitfalls=L.pitfalls.map(p=>({x:p[0],y:p[1],w:24,h:22}));updateStats();
  }
  function updateStats(message=''){stats.innerHTML=`<span class="levelBadge">Level ${levelIndex+1}: ${levels[levelIndex].name}</span> Score ${score} · Lives ${lives}${message?` · ${message}`:''}`;}
  function loseLife(reason){if(player.invulnerable>0)return;lives--;if(lives<=0){playing=false;updateStats(`Run ended: ${reason}`);return;}worldX=0;player.x=115;player.y=350;player.vx=player.vy=0;player.invulnerable=1.3;updateStats(reason);}
  function completeLevel(){const survival=lives*100;score+=500+survival;if(levelIndex<levels.length-1){loadLevel(levelIndex+1,true);updateStats(`Next level · +${500+survival}`);}else{playing=false;updateStats(`All levels complete · +${500+survival}`);}}
  const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function update(dt){if(paused)return;const L=levels[levelIndex];player.invulnerable=Math.max(0,player.invulnerable-dt);player.vx=(keys.ArrowRight||keys.d?150:0)+(keys.ArrowLeft||keys.a?-120:0);if((keys.ArrowUp||keys.w||keys[' '])&&player.onGround){player.vy=-445;player.onGround=false;}player.vy+=930*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;worldX+=L.speed*dt;const ap={x:worldX+player.x,y:player.y,w:player.w,h:player.h};player.onGround=false;for(const p of platforms){const previousBottom=player.y+player.h-player.vy*dt;if(ap.x+player.w>p.x&&ap.x<p.x+p.w&&player.y+player.h>=p.y&&previousBottom<=p.y+6&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true;}}for(const pit of pitfalls)if(intersects(ap,pit))loseLife('Pitfall hit');for(const m of milestones)if(!m.collected&&Math.hypot(ap.x-m.x,player.y-m.y)<38){m.collected=true;score+=100;updateStats('Milestone collected');}if(player.y+player.h<L.ceiling)loseLife('Deadline ceiling hit');if(player.y>canvas.height+60)loseLife('Fell through schedule gap');const finish=platforms.at(-1).x+platforms.at(-1).w;if(ap.x>finish)completeLevel();}
  function diamond(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#ffd84a';ctx.strokeStyle='#fff1a0';ctx.lineWidth=2;ctx.shadowColor='#ffd84a';ctx.shadowBlur=10;ctx.fillRect(-9,-9,18,18);ctx.strokeRect(-9,-9,18,18);ctx.restore();}
  function pitfall(p){const sx=p.x-worldX;ctx.fillStyle='#ef6259';ctx.strokeStyle='#ffb0aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,p.y+p.h);ctx.lineTo(sx+p.w/2,p.y);ctx.lineTo(sx+p.w,p.y+p.h);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.fillText('!',sx+9,p.y+18);}
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#102b3a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#315361';for(let i=0;i<75;i++){const px=i*80-worldX%80;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,canvas.height);ctx.stroke();}const ceiling=levels[levelIndex].ceiling;ctx.fillStyle='#b74949';ctx.fillRect(0,0,canvas.width,ceiling);ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText('DEADLINE CEILING',12,Math.min(22,ceiling-6));ctx.font='12px sans-serif';for(const p of platforms){const sx=p.x-worldX;if(sx>-p.w&&sx<canvas.width){ctx.fillStyle='#208891';ctx.fillRect(sx,p.y,p.w,p.h);ctx.fillStyle='#fff';ctx.fillText(p.label,sx+8,p.y+17);}}pitfalls.forEach(pitfall);milestones.filter(m=>!m.collected).forEach(m=>diamond(m.x-worldX,m.y));if(player){ctx.globalAlpha=player.invulnerable>0&&Math.floor(player.invulnerable*10)%2===0?.35:1;if(avatarImage.complete&&avatarImage.naturalWidth)ctx.drawImage(avatarImage,player.x-8,player.y-12,56,68);else{ctx.fillStyle='#f0af3b';ctx.fillRect(player.x,player.y,player.w,player.h);}ctx.globalAlpha=1;}ctx.fillStyle='#dce8ea';ctx.fillText(`Level ${levelIndex+1}/4 · ${levels[levelIndex].name} · Speed ${levels[levelIndex].speed}`,15,canvas.height-16);}
  function loop(t){if(!playing)return;const dt=Math.min(.03,(t-last)/1000||.016);last=t;update(dt);draw();requestAnimationFrame(loop);}
  startButton.onclick=()=>{loadLevel(0,false);playing=true;paused=false;last=performance.now();requestAnimationFrame(loop);};
  addEventListener('keydown',e=>{keys[e.key]=true;if(e.key.toLowerCase()==='p'){paused=!paused;updateStats(paused?'Paused':'Resumed');}if([' ','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();});
  addEventListener('keyup',e=>keys[e.key]=false);loadLevel(0,false);draw();
})();
