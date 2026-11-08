// Maquetes das telas do Clássico no espaço (menu, fases, informação da fase, painel, vitória, derrota).
// Usa espaco.js. Cada tela é desenhada em 390x844 (tamanho de celular) e reduzida para caber no cartão.
'use strict';
const TELA_W=390,TELA_H=844;
function telaFrame(host){const W=Math.min(330,(host.clientWidth||330)-4),s=W/TELA_W,wrap=document.createElement('div');wrap.className='telaWrap';
  wrap.style.width=W+'px';wrap.style.height=Math.round(TELA_H*s)+'px';const tela=document.createElement('div');tela.className='tela';tela.style.transform=`scale(${s})`;
  wrap.appendChild(tela);host.appendChild(wrap);return {tela,Q:s*DPR};}
function telaCanvas(tela,x,y,w,h,Q){const c=document.createElement('canvas');c.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  c.width=Math.round(w*Q);c.height=Math.round(h*Q);tela.appendChild(c);return c;}
function telaEl(tela,html,css){const d=document.createElement('div');d.style.cssText='position:absolute;'+css;d.innerHTML=html;tela.appendChild(d);return d;}
function telaFundo(tela,Q,m=MUNDOS_ESP[0]){const bg=telaCanvas(tela,0,0,TELA_W,TELA_H,Q),bx=bg.getContext('2d'),F=buildFundo(bg.width,bg.height,m);view(bg,t=>drawFundo(bx,F,t));return bg;}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function estrela(c,x,y,r,fill,stroke,lw){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.lineJoin='round';c.stroke();}}
const FONTE=(px,peso=600)=>`${peso} ${px}px 'Exo 2', 'Trebuchet MS', sans-serif`;
// etiqueta embaixo da peça: valor em cima, nome embaixo
function etiqueta(c,x,y,val,nome,Q){c.save();c.font=FONTE(9.5*Q);const w=Math.max(c.measureText(nome).width,18*Q)+12*Q,h=27*Q;
  c.fillStyle='rgba(12,9,26,.8)';c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=Q;rr(c,x-w/2,y-h/2,w,h,8*Q);c.fill();c.stroke();
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f2b33d';c.font=FONTE(11.5*Q,700);c.fillText(String(val),x,y-6*Q);
  c.fillStyle='#ece3f7';c.font=FONTE(9.5*Q);c.fillText(nome,x,y+7*Q);c.restore();}
const VAL=n=>2**(LADDER.findIndex(d=>d.n===n)+1);

// ---------- menu inicial ----------
function telaMenu(host){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  const lg=telaCanvas(tela,0,30,TELA_W,330,Q),lx=lg.getContext('2d'),orb=[['Lua',38],['Marte',44],['Saturno',104],['Terra',54],['Júpiter',72]];
  view(lg,t=>{lx.clearRect(0,0,lg.width,lg.height);const cx=195*Q,cy=178*Q,rx=168*Q,ry=50*Q,tl=-.14;
    const ps=orb.map(([n,sz],i)=>{const a=t*.28+i*2*Math.PI/orb.length,x0=Math.cos(a)*rx,y0=Math.sin(a)*ry;
      return {n,sz,x:cx+x0*Math.cos(tl)-y0*Math.sin(tl),y:cy+x0*Math.sin(tl)+y0*Math.cos(tl),z:Math.sin(a)};});
    lx.save();lx.translate(cx,cy);lx.rotate(tl);lx.strokeStyle='rgba(255,255,255,.2)';lx.lineWidth=1.5*Q;lx.setLineDash([6*Q,7*Q]);lx.beginPath();lx.ellipse(0,0,rx,ry,0,0,7);lx.stroke();lx.restore();lx.setLineDash([]);
    const pl=p=>drawPeca(lx,p.n,t,p.x,p.y,p.sz*Q,1,true,.7+.3*(p.z+1)/2);
    ps.filter(p=>p.z<0).sort((a,b)=>a.z-b.z).forEach(pl);
    lx.save();lx.font=FONTE(116*Q,700);lx.textAlign='center';lx.textBaseline='middle';const g=lx.createLinearGradient(0,cy-55*Q,0,cy+55*Q);
    g.addColorStop(0,'#ffe27a');g.addColorStop(.55,'#f2a830');g.addColorStop(1,'#e0604a');lx.lineJoin='round';lx.lineWidth=13*Q;lx.strokeStyle='#2e2219';lx.strokeText('Ptui!',cx,cy);
    lx.shadowColor='rgba(255,200,90,.55)';lx.shadowBlur=20*Q;lx.fillStyle=g;lx.fillText('Ptui!',cx,cy);lx.restore();
    ps.filter(p=>p.z>=0).sort((a,b)=>a.z-b.z).forEach(pl);});
  telaEl(tela,'junte poeira até virar galáxia','left:0;right:0;top:368px;text-align:center;font-size:18px;color:#cdbfe8');
  telaEl(tela,`<div class="bt">Clássico<small>uma missão em cada fase</small></div><div class="bt coral">Mineração<small>desça andar por andar, com loja e itens</small></div>
    <div class="bt azul">Laboratório<small>teste fases, formatos e itens</small></div><div style="display:flex;gap:12px"><div class="bt vidro sm">Editor de níveis</div><div class="bt vidro sm">Catálogo</div></div>
    <div class="bt vidro sm">Como jogar</div>`,'left:34px;right:34px;top:414px;display:flex;flex-direction:column;gap:15px');
  telaEl(tela,'<div class="ic vidro">♪</div><u>créditos</u>','left:0;right:0;top:784px;display:flex;justify-content:center;align-items:center;gap:14px;color:#b9a9d9;font-size:15px');}

// ---------- lista de fases: constelação ----------
const MAPA_FASES=[{t:3,e:3},{t:3,e:2},{t:4},{pts:1},{t:4},{t:5},{combo:1},{pts:1}];
const MAPA_POS=[[262,70],[178,150],[104,232],[176,312],[272,384],[200,462],[112,536],[196,612]];
function telaMapa(host){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  telaEl(tela,`<div class="ic vidro">☰</div><div style="text-align:center"><b style="font-size:23px">Clássico</b><div class="sub" style="font-size:14px">5 de 288 estrelas</div></div><div class="ic vidro">♪</div>`,
    'left:14px;right:14px;top:16px;display:flex;justify-content:space-between;align-items:center');
  telaEl(tela,`<div style="width:44px"></div><div><b style="font-size:17px">1 · Entrada</b><div class="sub" style="font-size:13px">Formar, pontos e as primeiras metas</div></div>`,
    'left:16px;right:16px;top:84px;display:flex;gap:12px;align-items:center;padding:10px 14px;'+'background:rgba(22,17,40,.72);border:1.5px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.35)');
  const ic=telaCanvas(tela,28,92,48,48,Q),icx=ic.getContext('2d');view(ic,t=>{icx.clearRect(0,0,ic.width,ic.height);drawPeca(icx,'Poeira',t,ic.width/2,ic.height/2,ic.width,1,true);});
  const mp=telaCanvas(tela,0,170,TELA_W,674,Q),mx=mp.getContext('2d');
  view(mp,t=>{mx.clearRect(0,0,mp.width,mp.height);const P=MAPA_POS.map(([x,y])=>[x*Q,y*Q]),cur=2;
    mx.save();mx.strokeStyle='rgba(255,255,255,.35)';mx.lineWidth=2*Q;mx.setLineDash([2*Q,7*Q]);mx.lineCap='round';mx.beginPath();P.forEach((p,i)=>i?mx.lineTo(...p):mx.moveTo(...p));mx.stroke();mx.restore();
    P.forEach(([x,y],i)=>{const f=MAPA_FASES[i],done=i<cur,lock=i>cur,R=31*Q;
      if(i===cur){const pr=R+(5+3*Math.sin(t*3))*Q,g=mx.createRadialGradient(x,y,R*.8,x,y,pr+10*Q);g.addColorStop(0,'rgba(242,179,61,.55)');g.addColorStop(1,'rgba(242,179,61,0)');mx.fillStyle=g;mx.beginPath();mx.arc(x,y,pr+10*Q,0,7);mx.fill();}
      mx.fillStyle='rgba(26,20,48,.88)';mx.strokeStyle=i===cur?'#f2b33d':done?'rgba(242,179,61,.6)':'rgba(255,255,255,.22)';mx.lineWidth=(i===cur?3.5:2)*Q;mx.beginPath();mx.arc(x,y,R,0,7);mx.fill();mx.stroke();
      const a=lock?.3:1;
      if(f.t)drawPeca(mx,LADDER[f.t-1].n,t,x,y,46*Q,a,true);
      else if(f.pts){mx.globalAlpha=a;estrela(mx,x,y,17*Q,'#f2b33d','#2e2219',2*Q);mx.globalAlpha=1;}
      else{mx.globalAlpha=a;mx.fillStyle='#ece3f7';mx.font=FONTE(20*Q,700);mx.textAlign='center';mx.textBaseline='middle';mx.fillText('2×',x,y);mx.globalAlpha=1;}
      const bx=x-R*.78,by=y-R*.78;mx.fillStyle=lock?'#3a3352':'#f2b33d';mx.beginPath();mx.arc(bx,by,11*Q,0,7);mx.fill();mx.strokeStyle='#2e2219';mx.lineWidth=1.5*Q;mx.stroke();
      mx.fillStyle=lock?'#b9a9d9':'#3a2a08';mx.font=FONTE(12*Q,700);mx.textAlign='center';mx.textBaseline='middle';mx.fillText(i+1,bx,by+.5*Q);
      for(let k=0;k<3;k++){const sx=x+(k-1)*14*Q,sy=y+R+11*Q;if(done&&k<(f.e||0))estrela(mx,sx,sy,6.5*Q,'#f2b33d','#2e2219',1.2*Q);else estrela(mx,sx,sy,6.5*Q,null,'rgba(255,255,255,.3)',1.2*Q);}});});}

// ---------- informação da fase ----------
function telaInfo(host){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  telaEl(tela,'','inset:0;background:rgba(8,6,16,.6)');
  telaEl(tela,'','left:18px;right:18px;top:96px;bottom:44px;background:rgba(26,20,46,.94);border:1.5px solid rgba(255,255,255,.14);border-radius:24px;box-shadow:0 6px 0 rgba(0,0,0,.4)');
  const pc=telaCanvas(tela,115,20,160,160,Q),px=pc.getContext('2d');
  view(pc,t=>{px.clearRect(0,0,pc.width,pc.height);const c=pc.width/2,g=px.createRadialGradient(c,c,0,c,c,c);g.addColorStop(0,'rgba(255,140,60,.35)');g.addColorStop(1,'rgba(255,140,60,0)');px.fillStyle=g;px.fillRect(0,0,pc.width,pc.height);
    drawPeca(px,'Rocha',t,c,c,pc.width*.9,1,true);});
  telaEl(tela,`<b style="font-size:30px">Fase 1</b><div><span class="pill">Primeira rocha</span></div>`,'left:0;right:0;top:182px;text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center');
  const mc=telaCanvas(tela,36,264,318,186,Q),m=mc.getContext('2d');
  view(mc,t=>{const W=mc.width,H=mc.height;m.clearRect(0,0,W,H);m.fillStyle='rgba(255,255,255,.06)';m.strokeStyle='rgba(255,255,255,.1)';m.lineWidth=Q;rr(m,1,1,W-2,H-2,16*Q);m.fill();m.stroke();
    m.textAlign='center';m.textBaseline='middle';m.fillStyle='#f2b33d';m.font=FONTE(12*Q,700);m.fillText('MISSÃO',W/2,16*Q);
    drawPeca(m,'Rocha',t,W/2-22*Q,66*Q,72*Q,1,true);m.fillStyle='#ece3f7';m.font=FONTE(30*Q,700);m.fillText('×1',W/2+40*Q,66*Q);
    m.font=FONTE(14*Q,600);m.fillText('Rocha',W/2,108*Q);
    const rx=[W/2-90*Q,W/2,W/2+90*Q],nm=['Gelo','Gelo','Rocha'];
    nm.forEach((n,i)=>{drawPeca(m,n,t,rx[i],144*Q,36*Q,1,true);m.fillStyle='#b9a9d9';m.font=FONTE(10*Q);m.fillText(n,rx[i],172*Q);});
    m.fillStyle='#ece3f7';m.font=FONTE(20*Q,700);m.fillText('+',W/2-45*Q,144*Q);m.fillText('=',W/2+45*Q,144*Q);});
  telaEl(tela,`<b style="font-size:21px">Forme uma Rocha</b><div class="sub" style="font-size:14px">4x4 · 10 arrastos</div>
    <div style="font-size:14.5px;line-height:1.35;color:#ddd3ee">Arraste para juntar peças iguais: duas iguais viram a do nível seguinte.</div>
    <div class="sub" style="font-size:13px">★ cumprir · ★★ sobrando 5 · ★★★ sobrando 6</div>`,'left:34px;right:34px;top:464px;text-align:center;display:flex;flex-direction:column;gap:8px');
  telaEl(tela,'<div class="bt">Jogar</div><div class="bt vidro sm">Voltar</div>','left:36px;right:36px;top:660px;display:flex;flex-direction:column;gap:14px');}

// ---------- jogo: painel de cima, tabuleiro e fim de fase ----------
const JOGO_PECAS={jogo:[[0,0,'Poeira'],[3,1,'Gelo'],[1,3,'Poeira'],[2,2,'Gelo']],vitoria:[[0,0,'Poeira'],[1,1,'Rocha'],[2,3,'Poeira']],derrota:[[0,0,'Poeira'],[3,0,'Gelo'],[1,1,'Gelo'],[2,2,'Poeira'],[0,3,'Poeira'],[3,3,'Gelo'],[1,2,'Poeira']]};
function telaJogo(host,modo){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  const vidro='background:rgba(22,17,40,.72);border:1.5px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.35)';
  const arr=modo==='derrota'?0:modo==='vitoria'?36:10,pct=modo==='derrota'?0:modo==='vitoria'?90:100;
  telaEl(tela,`<div style="flex:1.7;${vidro};padding:7px 10px;display:flex;gap:8px;align-items:center"><div class="ic" style="width:34px;height:34px;border:2px solid #ffd36e;color:#ffd36e;font-size:17px;box-shadow:0 0 10px #ffd36e66;text-shadow:0 0 6px #ffd36e">➜</div>
      <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px">${arr}</b><span class="sub" style="font-size:11px">arrastos</span></div>
      <div class="barra"><i style="width:${pct}%"></i><s style="left:50%">★</s><s style="left:60%">★</s><s style="left:72%">★</s></div></div></div>
    <div style="flex:.75;${vidro};padding:6px;text-align:center"><div style="height:30px"></div><div class="sub" style="font-size:11px">${modo==='vitoria'?'1/1':'0/1'}</div></div>
    <div style="flex:.75;${vidro};padding:6px 10px"><b style="font-size:22px">0</b><div class="sub" style="font-size:11px">pontos</div></div>`,
    'left:10px;right:10px;top:14px;display:flex;gap:8px;height:62px');
  const mi=telaCanvas(tela,252,18,34,34,Q),mix_=mi.getContext('2d');view(mi,t=>{mix_.clearRect(0,0,mi.width,mi.height);drawPeca(mix_,'Rocha',t,mi.width/2,mi.height/2,mi.width,1,true);});
  telaEl(tela,`<div class="ic vidro">☰</div><div style="flex:1;${vidro};text-align:center;padding:6px"><b style="font-size:18px">Fase 1: Primeira rocha</b><div class="sub" style="font-size:13px">Forme uma Rocha</div></div><div class="ic vidro">♪</div>`,
    'left:10px;right:10px;top:88px;display:flex;gap:8px;align-items:center');
  const bd=telaCanvas(tela,10,160,370,370,Q),b=bd.getContext('2d'),u=bd.width/4,pecas=JOGO_PECAS[modo];
  view(bd,t=>{b.clearRect(0,0,bd.width,bd.height);for(let y=0;y<4;y++)for(let x=0;x<4;x++)SPR.orbita(b,(x+.5)*u,(y+.5)*u,u);
    [...pecas].sort((A,B)=>kDe(B[2])-kDe(A[2])).forEach(([x,y,n])=>drawPeca(b,n,t,(x+.5)*u,(y+.5)*u,u));
    pecas.forEach(([x,y,n])=>etiqueta(b,(x+.5)*u,(y+.5)*u+u*.38,VAL(n),n,Q));});
  if(modo==='jogo'){telaEl(tela,'<div class="bt coral sm" style="padding:10px 30px;flex:none">Recomeçar</div>','left:0;right:0;top:560px;display:flex;justify-content:center');return;}
  telaEl(tela,'','inset:0;background:rgba(8,6,16,.5)');
  telaEl(tela,'','left:20px;right:20px;top:360px;height:420px;background:rgba(26,20,46,.95);border:1.5px solid rgba(255,255,255,.14);border-radius:24px;box-shadow:0 6px 0 rgba(0,0,0,.4)');
  const pc=telaCanvas(tela,105,200,180,180,Q),px=pc.getContext('2d'),r=rng(5),pt=Array.from({length:46},()=>({a:r()*7,v:.6+r(),f:r()}));
  view(pc,t=>{px.clearRect(0,0,pc.width,pc.height);const c=pc.width/2;
    if(modo==='vitoria'){px.save();px.globalCompositeOperation='lighter';for(const p of pt){const k=((t*.45*p.v+p.f)%1),d=c*(.35+.62*k);px.fillStyle=`rgba(255,226,150,${((1-k)*.9).toFixed(2)})`;
        const s=(1.5+2*(1-k))*Q;px.fillRect(c+Math.cos(p.a)*d-s/2,c+Math.sin(p.a)*d-s/2,s,s);}px.restore();
      drawPeca(px,'Rocha',t,c,c,pc.width*.72,1,true);}
    else{drawPeca(px,'Rocha',t,c,c,pc.width*.62,.75,true);px.globalCompositeOperation='source-atop';px.fillStyle='rgba(20,14,40,.45)';px.fillRect(0,0,pc.width,pc.height);px.globalCompositeOperation='source-over';}});
  if(modo==='vitoria'){
    telaEl(tela,'<b style="font-size:23px">Missão cumprida!</b>','left:0;right:0;top:396px;text-align:center');
    const sc=telaCanvas(tela,95,436,200,70,Q),sx=sc.getContext('2d');
    view(sc,t=>{sx.clearRect(0,0,sc.width,sc.height);const ph=t%5;for(let i=0;i<3;i++){const on=ph>.4+i*.45,k=on?Math.min(1,(ph-.4-i*.45)*5):0,s=1+.35*Math.max(0,1-k*1.2)*Math.sin(k*Math.PI);
      const x=(40+i*60)*Q,y=35*Q;estrela(sx,x,y,24*Q*(on?s:1),on?'#f2b33d':null,on?'#2e2219':'rgba(255,255,255,.25)',2.5*Q);}});
    telaEl(tela,`<div class="sub" style="font-size:15px;text-align:center">Sobraram <b style="color:#f3e9d7">36</b> arrastos · <b style="color:#f3e9d7">0</b> pontos</div>
      <div class="bt">Próxima fase</div><div class="bt vidro sm">Jogar de novo</div><div class="bt vidro sm">Ver fases</div>`,'left:38px;right:38px;top:520px;display:flex;flex-direction:column;gap:12px');}
  else{
    telaEl(tela,'<b style="font-size:30px">Não deu</b><div class="sub" style="font-size:15px;margin-top:6px">acabaram os arrastos</div>','left:0;right:0;top:396px;text-align:center');
    const fr=telaEl(tela,'Forme 3 <span class="pill" style="vertical-align:baseline;margin:0 .2em;padding:.1em .45em .12em .2em"><canvas class="icoMeta" style="width:24px;height:24px;display:inline-block;vertical-align:-6px;margin-right:4px;border-radius:0"></canvas>Rochas</span>: 0 de 3','left:0;right:0;top:478px;text-align:center;font-size:16px;color:#ddd3ee');
    const mc=fr.querySelector('canvas');mc.width=Math.round(24*Q);mc.height=Math.round(24*Q);const mcx=mc.getContext('2d');
    view(mc,t=>{const w=mc.width;mcx.clearRect(0,0,w,w);drawPeca(mcx,'Rocha',t,w/2,w/2,w*1.15,1,true);});
    telaEl(tela,'<div class="bt">Tentar de novo</div><div class="bt vidro sm">Ver fases</div>','left:38px;right:38px;top:540px;display:flex;flex-direction:column;gap:12px');}}

// ---------- tamanhos: a escada inteira num tabuleiro ----------
function telaTamanhos(host){const W=Math.min(420,(host.clientWidth||330)-4),cols=6,rows=3,uu=W/cols,H=Math.round(uu*rows+uu*.5),cv=document.createElement('canvas');cv.style.borderRadius='14px';host.appendChild(cv);
  const ctx=disp(cv,W,H),F=buildFundo(cv.width,cv.height,MUNDOS_ESP[0],{planeta:false,seed:3}),u=uu*DPR,oy=u*.25;
  view(cv,t=>{drawFundo(ctx,F,t);const ord=LADDER.map((d,i)=>[d,i]);for(const [,i] of ord)SPR.orbita(ctx,(i%cols+.5)*u,oy+(Math.floor(i/cols)+.5)*u,u);
    ord.sort((A,B)=>(B[0].k||1)-(A[0].k||1)).forEach(([d,i])=>drawPeca(ctx,d.n,t,(i%cols+.5)*u,oy+(Math.floor(i/cols)+.5)*u,u));
    ctx.font=FONTE(10*DPR,700);ctx.textAlign='left';ctx.textBaseline='top';ord.forEach(([,i])=>{ctx.fillStyle='rgba(242,179,61,.9)';ctx.fillText(i+1,(i%cols)*u+4*DPR,oy+Math.floor(i/cols)*u+3*DPR);});});}

// ---------- menu inicial: 4 opções de fonte e botão ----------
const MENU_OPC={
  1:{nome:'Neon',titulo:"900 {px}px Orbitron, sans-serif",tx:'PTUI!',px:80,corpo:"'Exo 2', sans-serif"},
  2:{nome:'Arredondado moderno',titulo:"400 {px}px Righteous, sans-serif",tx:'Ptui!',px:112,corpo:"Nunito, sans-serif"},
  3:{nome:'Planetas como botões',titulo:"400 {px}px 'Russo One', sans-serif",tx:'PTUI!',px:84,corpo:"'Exo 2', sans-serif",semOrbita:true},
  4:{nome:'Painel de nave',titulo:"700 {px}px 'Chakra Petch', sans-serif",tx:'PTUI!',px:96,corpo:"'Chakra Petch', sans-serif"},
};
function logoOpc(lx,v,cx,cy,Q,t){const o=MENU_OPC[v],f=o.titulo.replace('{px}',o.px*Q);lx.save();lx.font=f;lx.textAlign='center';lx.textBaseline='middle';
  if(v===1){lx.fillStyle='#f4fbff';lx.shadowColor='rgba(110,230,255,.95)';lx.shadowBlur=26*Q;lx.fillText(o.tx,cx,cy);lx.shadowColor='rgba(230,100,255,.7)';lx.shadowBlur=10*Q;lx.fillText(o.tx,cx,cy);}
  else if(v===2){const g=lx.createLinearGradient(0,cy-55*Q,0,cy+55*Q);g.addColorStop(0,'#ffe07a');g.addColorStop(.5,'#ff8a4a');g.addColorStop(1,'#e0508a');lx.shadowColor='rgba(255,140,90,.55)';lx.shadowBlur=24*Q;lx.fillStyle=g;lx.fillText(o.tx,cx,cy);}
  else if(v===3){const g=lx.createLinearGradient(0,cy-45*Q,0,cy+45*Q);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#c8b8ff');lx.lineJoin='round';lx.lineWidth=9*Q;lx.strokeStyle='#1a1030';lx.strokeText(o.tx,cx,cy);
    lx.shadowColor='rgba(170,140,255,.6)';lx.shadowBlur=18*Q;lx.fillStyle=g;lx.fillText(o.tx,cx,cy);}
  else{lx.fillStyle='#ffd36e';lx.shadowColor='rgba(255,200,90,.5)';lx.shadowBlur=14*Q;lx.fillText(o.tx,cx,cy);lx.shadowBlur=0;const w=lx.measureText(o.tx).width/2+22*Q,h=48*Q,k=16*Q;
    lx.strokeStyle='rgba(120,230,255,.85)';lx.lineWidth=2.5*Q;lx.beginPath();for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=cx+sx*w,y=cy+sy*h;lx.moveTo(x,y-sy*k);lx.lineTo(x,y);lx.lineTo(x-sx*k,y);}lx.stroke();
    lx.font=`500 ${11*Q}px 'Chakra Petch', sans-serif`;lx.fillStyle='rgba(120,230,255,.85)';lx.fillText('SISTEMA · ONLINE'+(Math.floor(t*2)%2?' ▮':''),cx,cy+h+14*Q);}
  lx.restore();}
function telaMenuOpc(host,v){const o=MENU_OPC[v],{tela,Q}=telaFrame(host);telaFundo(tela,Q);
  if(document.fonts&&document.fonts.load)document.fonts.load(o.titulo.replace('{px}','40'));
  tela.style.fontFamily=o.corpo;
  const lg=telaCanvas(tela,0,30,TELA_W,330,Q),lx=lg.getContext('2d'),orb=[['Lua',38],['Marte',44],['Saturno',104],['Terra',54],['Júpiter',72]];
  view(lg,t=>{lx.clearRect(0,0,lg.width,lg.height);const cx=195*Q,cy=(v===3?150:178)*Q,rx=168*Q,ry=50*Q,tl=-.14;
    if(o.semOrbita){logoOpc(lx,v,cx,cy,Q,t);return;}
    const ps=orb.map(([n,sz],i)=>{const a=t*.28+i*2*Math.PI/orb.length,x0=Math.cos(a)*rx,y0=Math.sin(a)*ry;return {n,sz,x:cx+x0*Math.cos(tl)-y0*Math.sin(tl),y:cy+x0*Math.sin(tl)+y0*Math.cos(tl),z:Math.sin(a)};});
    lx.save();lx.translate(cx,cy);lx.rotate(tl);lx.strokeStyle='rgba(255,255,255,.2)';lx.lineWidth=1.5*Q;lx.setLineDash([6*Q,7*Q]);lx.beginPath();lx.ellipse(0,0,rx,ry,0,0,7);lx.stroke();lx.restore();lx.setLineDash([]);
    const pl=p=>drawPeca(lx,p.n,t,p.x,p.y,p.sz*Q,1,true,.7+.3*(p.z+1)/2);
    ps.filter(p=>p.z<0).sort((a,b)=>a.z-b.z).forEach(pl);logoOpc(lx,v,cx,cy,Q,t);ps.filter(p=>p.z>=0).sort((a,b)=>a.z-b.z).forEach(pl);});
  const frase='junte poeira até virar galáxia';
  if(v===1){telaEl(tela,frase,'left:0;right:0;top:362px;text-align:center;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#8fe8ff');
    const nb=(c,t,s)=>`<div style="border:2px solid ${c};border-radius:14px;padding:11px;text-align:center;background:rgba(10,8,25,.45);box-shadow:0 0 16px ${c}66,inset 0 0 14px ${c}33">
      <div style="font:700 20px 'Exo 2',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${c};text-shadow:0 0 10px ${c}">${t}</div>${s?`<div style="font:500 13px 'Exo 2',sans-serif;color:#d8e6f2;margin-top:2px">${s}</div>`:''}</div>`;
    telaEl(tela,nb('#ffd36e','Clássico','uma missão em cada fase')+nb('#ff8a7a','Mineração','desça andar por andar, com loja e itens')+nb('#6fe0ff','Laboratório','teste fases, formatos e itens')
      +`<div style="display:flex;gap:12px"><div style="flex:1">${nb('#cfc6ff','Editor')}</div><div style="flex:1">${nb('#cfc6ff','Catálogo')}</div></div>`+nb('#cfc6ff','Como jogar'),'left:34px;right:34px;top:404px;display:flex;flex-direction:column;gap:14px');
    telaEl(tela,'♪ &nbsp;·&nbsp; créditos',"left:0;right:0;top:792px;text-align:center;color:#8fe8ff;font:500 14px 'Exo 2',sans-serif;letter-spacing:.1em");}
  else if(v===2){telaEl(tela,frase,'left:0;right:0;top:364px;text-align:center;font:700 18px Nunito,sans-serif;color:#e6dcff');
    const pb=(g,t,s)=>`<div style="border-radius:999px;padding:13px 18px;text-align:center;background:linear-gradient(135deg,${g});box-shadow:0 8px 22px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35)">
      <div style="font:800 21px Nunito,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)">${t}</div>${s?`<div style="font:600 13px Nunito,sans-serif;color:#fff;opacity:.85">${s}</div>`:''}</div>`;
    const sb=t=>`<div style="flex:1;border-radius:999px;padding:11px;text-align:center;background:rgba(255,255,255,.12);font:800 17px Nunito,sans-serif;color:#f1ebff">${t}</div>`;
    telaEl(tela,pb('#ffcf5a,#ff8a3c','Clássico','uma missão em cada fase')+pb('#ff6a7a,#c43a7a','Mineração','desça andar por andar, com loja e itens')+pb('#5ab0ff,#6a5aff','Laboratório','teste fases, formatos e itens')
      +`<div style="display:flex;gap:12px">${sb('Editor de níveis')}${sb('Catálogo')}</div><div style="display:flex">${sb('Como jogar')}</div>`,'left:30px;right:30px;top:406px;display:flex;flex-direction:column;gap:14px');
    telaEl(tela,'♪ &nbsp; créditos','left:0;right:0;top:796px;text-align:center;color:#cdbfe8;font:700 15px Nunito,sans-serif');}
  else if(v===3){telaEl(tela,frase,"left:0;right:0;top:232px;text-align:center;font:600 16px 'Exo 2',sans-serif;letter-spacing:.06em;color:#cdbfe8");
    const pc=telaCanvas(tela,0,300,TELA_W,330,Q),px=pc.getContext('2d'),PL=[['Rocha',78,215,96],['Saturno',195,120,200],['Netuno',312,215,104]];
    view(pc,t=>{px.clearRect(0,0,pc.width,pc.height);px.save();px.strokeStyle='rgba(255,255,255,.16)';px.lineWidth=1.5*Q;px.setLineDash([5*Q,7*Q]);px.beginPath();px.ellipse(195*Q,190*Q,175*Q,60*Q,0,Math.PI*1.02,Math.PI*1.98);px.stroke();px.restore();
      PL.forEach(([n,x,y,s],i)=>{const by=Math.sin(t*1.4+i*2)*4*Q,g=px.createRadialGradient(x*Q,y*Q+by,0,x*Q,y*Q+by,s*.62*Q);g.addColorStop(0,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');px.fillStyle=g;px.beginPath();px.arc(x*Q,y*Q+by,s*.62*Q,0,7);px.fill();
        drawPeca(px,n,t,x*Q,y*Q+by,s*Q,1,true);});});
    const lb=(x,y,t,s,c)=>telaEl(tela,`<div style="font:700 ${c?22:17}px 'Exo 2',sans-serif;color:${c?'#ffd36e':'#f3e9d7'}">${t}</div><div style="font:500 12px 'Exo 2',sans-serif;color:#b9a9d9;line-height:1.2">${s}</div>`,`left:${x-75}px;width:150px;top:${y}px;text-align:center`);
    lb(195,486,'Clássico','uma missão em cada fase',1);lb(78,580,'Mineração','andar por andar');lb(312,580,'Laboratório','teste fases e itens');
    telaEl(tela,'Editor de níveis &nbsp;·&nbsp; Catálogo &nbsp;·&nbsp; Como jogar',"left:0;right:0;top:690px;text-align:center;font:600 15px 'Exo 2',sans-serif;color:#e6dcff");
    telaEl(tela,'♪ &nbsp;·&nbsp; créditos',"left:0;right:0;top:740px;text-align:center;font:500 14px 'Exo 2',sans-serif;color:#b9a9d9");}
  else{telaEl(tela,'&gt; '+frase,"left:0;right:0;top:376px;text-align:center;font:500 14px 'Chakra Petch',sans-serif;letter-spacing:.06em;color:#8fe8ff");
    const cut='clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)';
    const hb=(n,c,t,s)=>`<div style="${cut};background:linear-gradient(90deg,${c}33,rgba(14,12,30,.85));border-left:4px solid ${c};padding:10px 14px;display:flex;align-items:center;gap:12px">
      <div style="font:700 13px 'Chakra Petch',sans-serif;color:${c};opacity:.9">${n}</div><div style="flex:1"><div style="font:700 21px 'Chakra Petch',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#f3eefc">${t}</div>
      ${s?`<div style="font:500 12.5px 'Chakra Petch',sans-serif;color:#b9b0d8">${s}</div>`:''}</div><div style="font:700 18px 'Chakra Petch',sans-serif;color:${c}">›</div></div>`;
    telaEl(tela,hb('01','#ffd36e','Clássico','uma missão em cada fase')+hb('02','#ff8a7a','Mineração','desça andar por andar, com loja e itens')+hb('03','#6fe0ff','Laboratório','teste fases, formatos e itens')
      +`<div style="display:flex;gap:10px"><div style="flex:1">${hb('04','#b9a9ff','Editor')}</div><div style="flex:1">${hb('05','#b9a9ff','Catálogo')}</div></div>`+hb('06','#b9a9ff','Como jogar'),
      'left:26px;right:26px;top:412px;display:flex;flex-direction:column;gap:11px');
    telaEl(tela,'[ ♪ ] &nbsp; [ créditos ]',"left:0;right:0;top:796px;text-align:center;font:500 14px 'Chakra Petch',sans-serif;color:#8fe8ff;letter-spacing:.08em");}}

// ---------- menu final: neon, com Mineração e Laboratório escondidos em dois ícones (easter egg) ----------
const ICO_PICARETA='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 8.5C8 4.5 16 4.5 19.5 8.5"/><path d="M12 6.2L5.5 20"/></svg>';
const ICO_FRASCO='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/></svg>';
function telaMenuFinal(host){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  if(document.fonts&&document.fonts.load){document.fonts.load("900 40px Orbitron");document.fonts.load("700 20px 'Exo 2'");}
  const lg=telaCanvas(tela,0,40,TELA_W,330,Q),lx=lg.getContext('2d'),orb=[['Lua',38],['Marte',44],['Saturno',104],['Terra',54],['Júpiter',72]];
  view(lg,t=>{lx.clearRect(0,0,lg.width,lg.height);const cx=195*Q,cy=178*Q,rx=168*Q,ry=50*Q,tl=-.14;
    const ps=orb.map(([n,sz],i)=>{const a=t*.28+i*2*Math.PI/orb.length,x0=Math.cos(a)*rx,y0=Math.sin(a)*ry;return {n,sz,x:cx+x0*Math.cos(tl)-y0*Math.sin(tl),y:cy+x0*Math.sin(tl)+y0*Math.cos(tl),z:Math.sin(a)};});
    lx.save();lx.translate(cx,cy);lx.rotate(tl);lx.strokeStyle='rgba(255,255,255,.2)';lx.lineWidth=1.5*Q;lx.setLineDash([6*Q,7*Q]);lx.beginPath();lx.ellipse(0,0,rx,ry,0,0,7);lx.stroke();lx.restore();lx.setLineDash([]);
    const pl=p=>drawPeca(lx,p.n,t,p.x,p.y,p.sz*Q,1,true,.7+.3*(p.z+1)/2);
    ps.filter(p=>p.z<0).sort((a,b)=>a.z-b.z).forEach(pl);logoOpc(lx,1,cx,cy,Q,t);ps.filter(p=>p.z>=0).sort((a,b)=>a.z-b.z).forEach(pl);});
  telaEl(tela,'junte poeira até virar galáxia','left:0;right:0;top:384px;text-align:center;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#8fe8ff');
  telaEl(tela,'<div class="bt" style="font-size:24px;padding:16px">Clássico<small>uma missão em cada fase</small></div><div class="bt vidro sm">Como jogar</div>',
    'left:40px;right:40px;top:446px;display:flex;flex-direction:column;gap:18px');
  telaEl(tela,'♪ &nbsp;·&nbsp; créditos',"left:0;right:0;top:640px;text-align:center;color:#8fe8ff;font:500 14px 'Exo 2',sans-serif;letter-spacing:.1em");
  telaEl(tela,`<span title="Mineração">${ICO_PICARETA}</span><span title="Laboratório">${ICO_FRASCO}</span>`,
    'left:0;right:0;top:790px;display:flex;justify-content:center;gap:30px;color:rgba(207,198,255,.42);filter:drop-shadow(0 0 4px rgba(207,198,255,.35))');}
