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
const FONTE=(px,peso=600)=>`${peso} ${px}px Fredoka, 'Trebuchet MS', sans-serif`;
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
    drawPeca(px,'Rocha de lava',t,c,c,pc.width*.9,1,true);});
  telaEl(tela,`<b style="font-size:30px">Fase 1</b><div><span class="pill">Primeira lava</span></div>`,'left:0;right:0;top:182px;text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center');
  const mc=telaCanvas(tela,36,264,318,186,Q),m=mc.getContext('2d');
  view(mc,t=>{const W=mc.width,H=mc.height;m.clearRect(0,0,W,H);m.fillStyle='rgba(255,255,255,.06)';m.strokeStyle='rgba(255,255,255,.1)';m.lineWidth=Q;rr(m,1,1,W-2,H-2,16*Q);m.fill();m.stroke();
    m.textAlign='center';m.textBaseline='middle';m.fillStyle='#f2b33d';m.font=FONTE(12*Q,700);m.fillText('MISSÃO',W/2,16*Q);
    drawPeca(m,'Rocha de lava',t,W/2-22*Q,66*Q,72*Q,1,true);m.fillStyle='#ece3f7';m.font=FONTE(30*Q,700);m.fillText('×1',W/2+40*Q,66*Q);
    m.font=FONTE(14*Q,600);m.fillText('Rocha de lava',W/2,108*Q);
    const rx=[W/2-90*Q,W/2,W/2+90*Q],nm=['Cristais','Cristais','Rocha de lava'];
    nm.forEach((n,i)=>{drawPeca(m,n,t,rx[i],144*Q,36*Q,1,true);m.fillStyle='#b9a9d9';m.font=FONTE(10*Q);m.fillText(n,rx[i],172*Q);});
    m.fillStyle='#ece3f7';m.font=FONTE(20*Q,700);m.fillText('+',W/2-45*Q,144*Q);m.fillText('=',W/2+45*Q,144*Q);});
  telaEl(tela,`<b style="font-size:21px">Forme uma Rocha de lava</b><div class="sub" style="font-size:14px">4x4 · 10 arrastos</div>
    <div style="font-size:14.5px;line-height:1.35;color:#ddd3ee">Arraste para juntar peças iguais: duas iguais viram a do nível seguinte.</div>
    <div class="sub" style="font-size:13px">★ cumprir · ★★ sobrando 5 · ★★★ sobrando 6</div>`,'left:34px;right:34px;top:464px;text-align:center;display:flex;flex-direction:column;gap:8px');
  telaEl(tela,'<div class="bt">Jogar</div><div class="bt vidro sm">Voltar</div>','left:36px;right:36px;top:660px;display:flex;flex-direction:column;gap:14px');}

// ---------- jogo: painel de cima, tabuleiro e fim de fase ----------
const JOGO_PECAS={jogo:[[0,0,'Poeira'],[3,1,'Cristais'],[1,3,'Poeira'],[2,2,'Cristais']],vitoria:[[0,0,'Poeira'],[1,1,'Rocha de lava'],[2,3,'Poeira']],derrota:[[0,0,'Poeira'],[3,0,'Cristais'],[1,1,'Cristais'],[2,2,'Poeira'],[0,3,'Poeira'],[3,3,'Cristais'],[1,2,'Poeira']]};
function telaJogo(host,modo){const {tela,Q}=telaFrame(host);telaFundo(tela,Q);
  const vidro='background:rgba(22,17,40,.72);border:1.5px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.35)';
  const arr=modo==='derrota'?0:modo==='vitoria'?36:10,pct=modo==='derrota'?0:modo==='vitoria'?90:100;
  telaEl(tela,`<div style="flex:1.7;${vidro};padding:7px 10px;display:flex;gap:8px;align-items:center"><div class="ic" style="width:34px;height:34px;background:#f2b33d;color:#3a2a08;font-size:18px;box-shadow:0 3px 0 #b07a14">➜</div>
      <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px">${arr}</b><span class="sub" style="font-size:11px">arrastos</span></div>
      <div class="barra"><i style="width:${pct}%"></i><s style="left:50%">★</s><s style="left:60%">★</s><s style="left:72%">★</s></div></div></div>
    <div style="flex:.75;${vidro};padding:6px;text-align:center"><div style="height:30px"></div><div class="sub" style="font-size:11px">${modo==='vitoria'?'1/1':'0/1'}</div></div>
    <div style="flex:.75;${vidro};padding:6px 10px"><b style="font-size:22px">0</b><div class="sub" style="font-size:11px">pontos</div></div>`,
    'left:10px;right:10px;top:14px;display:flex;gap:8px;height:62px');
  const mi=telaCanvas(tela,252,18,34,34,Q),mix_=mi.getContext('2d');view(mi,t=>{mix_.clearRect(0,0,mi.width,mi.height);drawPeca(mix_,'Rocha de lava',t,mi.width/2,mi.height/2,mi.width,1,true);});
  telaEl(tela,`<div class="ic vidro">☰</div><div style="flex:1;${vidro};text-align:center;padding:6px"><b style="font-size:18px">Fase 1: Primeira lava</b><div class="sub" style="font-size:13px">Forme uma Rocha de lava</div></div><div class="ic vidro">♪</div>`,
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
      drawPeca(px,'Rocha de lava',t,c,c,pc.width*.72,1,true);}
    else drawPeca(px,'Rocha de lava',t,c,c,pc.width*.62,.3,true);});
  if(modo==='vitoria'){
    telaEl(tela,'<b style="font-size:30px">Missão cumprida!</b>','left:0;right:0;top:392px;text-align:center');
    const sc=telaCanvas(tela,95,436,200,70,Q),sx=sc.getContext('2d');
    view(sc,t=>{sx.clearRect(0,0,sc.width,sc.height);const ph=t%5;for(let i=0;i<3;i++){const on=ph>.4+i*.45,k=on?Math.min(1,(ph-.4-i*.45)*5):0,s=1+.35*Math.max(0,1-k*1.2)*Math.sin(k*Math.PI);
      const x=(40+i*60)*Q,y=35*Q;estrela(sx,x,y,24*Q*(on?s:1),on?'#f2b33d':null,on?'#2e2219':'rgba(255,255,255,.25)',2.5*Q);}});
    telaEl(tela,`<div class="sub" style="font-size:15px;text-align:center">Sobraram <b style="color:#f3e9d7">36</b> arrastos · <b style="color:#f3e9d7">0</b> pontos</div>
      <div class="bt">Próxima fase</div><div class="bt vidro sm">Jogar de novo</div><div class="bt vidro sm">Ver fases</div>`,'left:38px;right:38px;top:520px;display:flex;flex-direction:column;gap:12px');}
  else{
    telaEl(tela,'<b style="font-size:30px">Não deu</b><div class="sub" style="font-size:15px;margin-top:6px">acabaram os arrastos</div>','left:0;right:0;top:396px;text-align:center');
    telaEl(tela,'Forme 3 <span class="pill">Rochas de lava</span>: 0 de 3','left:0;right:0;top:478px;text-align:center;font-size:16px;color:#ddd3ee');
    telaEl(tela,'<div class="bt">Tentar de novo</div><div class="bt vidro sm">Ver fases</div>','left:38px;right:38px;top:540px;display:flex;flex-direction:column;gap:12px');}}

// ---------- tamanhos: a escada inteira num tabuleiro ----------
function telaTamanhos(host){const W=Math.min(420,(host.clientWidth||330)-4),cols=6,rows=3,uu=W/cols,H=Math.round(uu*rows+uu*.5),cv=document.createElement('canvas');cv.style.borderRadius='14px';host.appendChild(cv);
  const ctx=disp(cv,W,H),F=buildFundo(cv.width,cv.height,MUNDOS_ESP[0],{planeta:false,seed:3}),u=uu*DPR,oy=u*.25;
  view(cv,t=>{drawFundo(ctx,F,t);const ord=LADDER.map((d,i)=>[d,i]);for(const [,i] of ord)SPR.orbita(ctx,(i%cols+.5)*u,oy+(Math.floor(i/cols)+.5)*u,u);
    ord.sort((A,B)=>(B[0].k||1)-(A[0].k||1)).forEach(([d,i])=>drawPeca(ctx,d.n,t,(i%cols+.5)*u,oy+(Math.floor(i/cols)+.5)*u,u));
    ctx.font=FONTE(10*DPR,700);ctx.textAlign='left';ctx.textBaseline='top';ord.forEach(([,i])=>{ctx.fillStyle='rgba(242,179,61,.9)';ctx.fillText(i+1,(i%cols)*u+4*DPR,oy+Math.floor(i/cols)*u+3*DPR);});});}
