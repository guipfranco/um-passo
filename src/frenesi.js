
// ===================== FRENESI (modo em teste; nome provisório) =====================
// O Clássico (4x4 sem fim, acaba quando enche) com corrente de junções rápidas. Cada arrasto que junta peças antes de a
// barra esvaziar soma na corrente (várias junções no mesmo arrasto somam mais); a corrente sobe o multiplicador por
// degraus (×1, ×2, ×3, ×5, ×8, ×12, ×20) e os pontos de cada junção são multiplicados. A cada degrau o jogo esquenta:
// nebulosa de outra cor pulsando na batida, malha mais acesa e tremendo, brilho e rastro nas peças, bordas da tela acesas,
// tranco maior, números maiores, e a trilha (musica/frenesi.js) ganha camadas. No ×20 (FRENESI) as cores giram.
// Se a barra esvaziar, a corrente cai e tudo desliga. Quanto mais alto o degrau, mais curta a janela; e a cada marco de
// pontos a velocidade sobe (a janela de todos os degraus encurta um pouco).
// Só aparece com ?frenesi no endereço (fica gravado no aparelho; ?frenesi=0 desliga), no menu do espaço, abaixo do Clássico.
// Guardado à parte do Clássico: ptui_rec_fre (pontos), ptui_fre_corr (maior corrente), ptui_fre_mult (maior multiplicador),
// a partida em andamento em ptui_fre_save, e ptui_fre_vi (já viu a explicação).
(()=>{ const m=location.search.match(/[?&]frenesi(?:=(\d))?/); if(m) localStorage.ptui_frenesi = m[1]==='0' ? '0' : '1'; })();
const frenesiLigado = () => localStorage.ptui_frenesi==='1' && espacoLigado();
// degraus: a partir de que corrente valem, o multiplicador, a cor das luzes, as duas cores da nebulosa e a janela
// (segundos que a barra leva para esvaziar depois de uma junção)
const DEGRAUS=[
  {min:0,  x:1,  cor:'#a9b8ff', jan:3.0},
  {min:4,  x:2,  cor:'#4fe3ff', jan:2.8, neb:['25,105,200','80,225,255']},
  {min:10, x:3,  cor:'#5dffa2', jan:2.6, neb:['15,140,90','110,255,170']},
  {min:18, x:5,  cor:'#ffd84a', jan:2.3, neb:['215,150,25','255,226,110']},
  {min:28, x:8,  cor:'#ff8f2e', jan:2.0, neb:['225,85,20','255,165,70']},
  {min:40, x:12, cor:'#ff4fc8', jan:1.8, neb:['170,20,125','255,90,210']},
  {min:56, x:20, cor:'#d9a8ff', jan:1.6},   // FRENESI: as cores giram
];
const TOPO=DEGRAUS.length-1;
const MARCOS=[2000,6000,15000,35000,80000,160000];   // pontos em que a velocidade sobe
const somaCorrente = n => 2*n-1;   // junções no mesmo arrasto: 1, 3, 5, 7
const degrauDe = c => { let k=0; while(k<TOPO && c>=DEGRAUS[k+1].min) k++; return k; };
const janelaDe = (k,vel) => DEGRAUS[k].jan*Math.max(.7, 1-.06*(vel-1));   // cada velocidade encurta 6% (até 30%)
const REC_FRE = () => +(localStorage.ptui_rec_fre||0);
const recFre = () => ({pts:REC_FRE(), corr:+(localStorage.ptui_fre_corr||0), mult:+(localStorage.ptui_fre_mult||1)});
const freSalvo = () => JSON.parse(localStorage.ptui_fre_save||'null');
const fmtN = n => String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');   // 12.345 (toLocaleString custava a cada quadro dos pontos rolando)
const POUCO_MOV = matchMedia('(prefers-reduced-motion: reduce)').matches;   // menos tremor, sem flash nem pulsação forte

// ---------- cores ----------
const rgbDe = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const COR_DEG = DEGRAUS.map(d=>rgbDe(d.cor));
function hslRgb(h,s,l){ h=((h%1)+1)%1; const f=n=>{ const k=(n+h*12)%12, a=s*Math.min(l,1-l); return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))); }; return [f(0),f(8),f(4)]; }
const mistura = (a,b,f) => a.map((v,i)=>v+(b[i]-v)*f);
const txtRgb = a => a.map(v=>Math.round(Math.max(0,v))).join(',');
const arcoIris = (t,d=0) => hslRgb(t*.12+d,.9,.62);

// estado só da tela (não vai para o salvo): degrau suavizado, cor atual, batida, rastros
const FV={t:0, k:0, cor:COR_DEG[0], bat:0, pulso:0, caiT:-9, sobeT:-9, rastros:[], mostra:0, mus:null, pouco:false, fila:[], grau:0};
// O que mexe na página na hora de subir ou cair de degrau (letreiro, classes, tranco, animações) não roda dentro do
// arrasto: vai para o fim do quadro seguinte (frePinta), quando o céu, a malha e as peças já leram as posições. Feito no
// meio do arrasto, cada mudança obrigava o navegador a recalcular estilo e layout ali mesmo, e o arrasto que subia de
// degrau custava mais que o dobro de um arrasto comum. O som sai na hora.
const depois = f => FV.fila.push(f);

// ---------- menu ----------
// botão abaixo do Clássico (só com ?frenesi); com partida salva, diz de onde continua
function freMenu(on){
  let b=$('#mFre');
  if(!frenesiLigado()){ if(b) b.style.display='none'; return; }
  if(!b){ b=document.createElement('button'); b.className='btn big'; b.id='mFre'; b.innerHTML='Frenesi<small>corrente de junções rápidas</small>'; b.onclick=freEntra; }
  $('#mInf').after(b); b.style.display = on ? '' : 'none';
  const sv=freSalvo(), sub=b.querySelector('small'); if(sub.dataset.txt==null) sub.dataset.txt=sub.textContent;
  sub.textContent = sv ? `continuar · ${fmtN(sv.st.pontos)} pontos` : sub.dataset.txt; b.classList.toggle('comSub', !!sv);
}
// na primeira vez, uma janela curta com as regras
function freEntra(){
  if(localStorage.ptui_fre_vi) return frenesiJoga({retoma:true});
  janelaMenu();
  showOverlay(`<h2>Frenesi</h2>
    <p>O Clássico com corrente: junte peças rápido, uma junção logo depois da outra.</p>
    <p>Cada junção antes de a barra esvaziar aumenta a corrente. A corrente sobe o multiplicador (×2, ×3, ×5, ×8, ×12 e ×20) e os pontos são multiplicados. Duas junções no mesmo arrasto valem mais.</p>
    <p>Se a barra esvaziar, a corrente cai e volta ao ×1. Quanto mais alto o degrau, menos tempo.</p>
    <button class="btn g" id="frJoga">Jogar</button><button class="btn dim" id="frVolta">Voltar</button>`);
  $('#frJoga').onclick=()=>{ localStorage.ptui_fre_vi='1'; frenesiJoga({retoma:true}); };
  $('#frVolta').onclick=fechaJanelaMenu; FORA=fechaJanelaMenu;
}

// ---------- partida ----------
// {retoma:true}: continua a partida salva, se houver; sem isso começa uma nova e apaga a salva
function frenesiJoga(opt){
  const sv = opt?.retoma ? freSalvo() : null;
  if(!sv) localStorage.removeItem('ptui_fre_save');
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  // infinito: tudo o que vale para o Clássico vale aqui (peças do espaço, painel, pausa); frenesi: o que muda
  S = {...freshState(), infinito:true, frenesi:true, missao:0, tema:1, char:'rola', moves:0, extra:0, pontos:0, feitas:{}, coresF:{}, quebras:[], seqI:0, combos:0, soltas:0, maxForm:0, rachados:0,
       recAntes: sv ? sv.recAntes : recFre()};
  const f=sv?.fre||{};
  S.fre={corr:0, deg:0, resta:0, jan:janelaDe(0,f.vel||1), maxCorr:f.maxCorr||0, maxMult:f.maxMult||1, vel:f.vel||1};
  S.fiscal=FISCAIS[0];
  applyAndar(); startDay({...PATHS.comum, forma:null, caverna:false, energy:999-CFG.energy, semEnergia:true, w:4, h:4});
  limpaMarcas(); if(sv) restauraFase(sv.st);
  document.body.classList.add('modoCla','modoInf','modoFre'); $('#btnPause').textContent='☰';
  freMontaTela(); FV.mostra=S.pontos||0; FV.rastros=[]; FV.k=0; FV.caiT=-9; FV.fila=[];
  montaFreHud(); render();
  setBanner('Frenesi', 'junte rápido'); pedeEncaixe();
  freVisual(0); freVisualPinta(0); freTexto(); freAquece();
  if(musName==='frenesi') MUS?.intensidade?.(0);
}
function freMontaTela(){
  if(!$('#freBar')){ const b=document.createElement('div'); b.id='freBar';
    b.innerHTML='<div id="freMult">×1</div><div id="freInfo"><div id="freLinha"><span id="freTxt"></span><span id="freVel"></span></div><div id="freTempo"><i></i></div></div>';
    $('#stage').insertBefore(b, board); }
  if(!$('#freBorda')){ const o=document.createElement('div'); o.id='freBorda'; o.innerHTML='<i></i><i></i><i></i>'; document.body.appendChild(o); }
}
function montaFreHud(){ $('#cMis').innerHTML=`<div><b id="cRec">${fmtN(REC_FRE())}</b><small>recorde</small></div>`; $('#ptsP').style.display=''; }
// chamado pelo render (hudInfinito): os pontos do painel sobem rolando (freQuadro), o recorde acompanha
function hudFrenesi(){
  $('#cArr').textContent=S.moves||0; const r=$('#cRec'); if(r) r.textContent=fmtN(Math.max(REC_FRE(),S.pontos||0));
  if(POUCO_MOV || (S.pontos||0)<FV.mostra) mostraPontos(S.pontos||0);
}
function mostraPontos(v){ FV.mostra=v; const el=$('#cPts'); if(!el) return; const s=fmtN(v); el.textContent=s; el.classList.toggle('longo', s.length>7); }

// cada arrasto que mexeu (move, depois de contaMissao): corrente, degrau, pontos multiplicados, velocidade
function freJogada(r){
  const F=S.fre, t=tQuadro||performance.now()/1000, js=r.merges.filter(o=>o.k!=='p'), n=js.length;
  freRastros(r,t);
  if(!n) return;
  const antes=F.deg;
  F.corr = (F.corr>0 ? F.corr : 0) + somaCorrente(n);
  F.deg = degrauDe(F.corr); F.jan = janelaDe(F.deg,F.vel); F.resta = F.jan;
  const m=DEGRAUS[F.deg].x, base=js.reduce((a,o)=>a+VAL(o.t),0);
  S.pontos += base*(m-1);   // contaMissao já somou a base
  F.maxCorr=Math.max(F.maxCorr,F.corr); F.maxMult=Math.max(F.maxMult,m);
  SFX.corrente(F.corr);
  if(F.deg>antes) freSobe(F.deg,t);
  while(F.vel<=MARCOS.length && S.pontos>=MARCOS[F.vel-1]){ F.vel++; F.jan=janelaDe(F.deg,F.vel); F.resta=F.jan; freAcelera(); }
  freTexto(); freBarra();
}
// números saltando de cada junção: o valor e o multiplicador, maiores e mais acesos a cada degrau
function freFlutua(r){
  const k=S.fre.deg, m=DEGRAUS[k].x, cor=k===TOPO?'#ff7ad9':DEGRAUS[k].cor;
  for(const o of r.merges){ if(o.k==='p') continue;
    const el=document.createElement('div'); el.className='flut fre'; el.style.transform=pos(o.x,o.y);
    el.style.setProperty('--fc',cor); el.style.setProperty('--fs',(.27+.028*k).toFixed(3));
    el.innerHTML=`+${fmtN(VAL(o.t))}${m>1?`<small>×${m}</small>`:''}`; board.appendChild(el); setTimeout(()=>el.remove(),1000); }
}
// depois de cada arrasto (no lugar do checaInfinito): recordes na hora, salvo, ou fim de jogo
function checaFrenesi(){
  const F=S.fre;
  if((S.pontos||0)>REC_FRE()) localStorage.ptui_rec_fre=S.pontos;
  if(F.maxCorr>+(localStorage.ptui_fre_corr||0)) localStorage.ptui_fre_corr=F.maxCorr;
  if(F.maxMult>+(localStorage.ptui_fre_mult||1)) localStorage.ptui_fre_mult=F.maxMult;
  if(anyMove()){ localStorage.ptui_fre_save=JSON.stringify({recAntes:S.recAntes, st:estadoFase(), fre:{maxCorr:F.maxCorr, maxMult:F.maxMult, vel:F.vel}}); return; }
  localStorage.removeItem('ptui_fre_save');
  S.phase='fimI'; setBanner(null,'não cabe mais nada');
  if(F.corr>0) freCai(tQuadro||performance.now()/1000, true);
  const est=S; setTimeout(()=>{ if(S===est && S.phase==='fimI') frenesiFim(); },650);
}
function frenesiFim(){
  const F=S.fre, A=S.recAntes||{pts:0,corr:0,mult:1}, rp=S.pontos>A.pts, rc=F.maxCorr>A.corr, rm=F.maxMult>A.mult;
  mostraPontos(S.pontos||0);
  if(rp||rc||rm) SFX.pagou(); else SFX.naoDeu();
  const t=Math.max(1,S.maxForm||1), R=recFre(), rec=b=>b?'<em>recorde!</em>':'';
  showOverlay(`<canvas id="espRes"></canvas><h2>Fim de jogo</h2>
    <div class="freRes"><div><b>${fmtN(S.pontos)}</b><small>pontos</small>${rec(rp)}</div><div><b>×${F.maxMult}</b><small>maior multiplicador</small>${rec(rm)}</div><div><b>${F.maxCorr}</b><small>maior corrente</small>${rec(rc)}</div></div>
    <p>Maior peça: ${rockName(t)} · velocidade ${F.vel} · ${S.moves} arrastos</p>
    ${rp&&rc&&rm?'':`<p class="freRecs">Seus recordes: ${fmtN(R.pts)} pontos · ×${R.mult} · corrente de ${R.corr}</p>`}
    <button class="btn g" id="iDeNovo">Jogar de novo</button><button class="btn dim" id="iMenu">Menu</button>`);
  espPlanetaGrande($('#espRes'),t,'vit');
  $('#iDeNovo').onclick=()=>frenesiJoga(); $('#iMenu').onclick=()=>{ hideOverlay(); showMenu(); };
}

// ---------- subir, cair, acelerar ----------
function freSobe(k,t){
  FV.sobeT=t; freVisual(k);
  if(k===TOPO) SFX.frenesi(); else SFX.degrau(k);
  if(musName==='frenesi') MUS?.acento?.(k===TOPO?1.5:1);
  depois(g=>{ freFlash(k===TOPO?'FRENESI!':'×'+DEGRAUS[k].x, k); if(!g.r.width) return;
  // anel saindo do tabuleiro (céu) e onda na malha
  aneisE.push({x:g.r.left+g.r.width/2, y:g.r.top+g.r.height/2, t0:tQuadro, v:g.r.width*(1.1+.1*k), rgb:txtRgb(COR_DEG[k]), a:.5, w:10});
  if(!POUCO_MOV){ ondasM.push({x:g.O+g.r.width*g.D/2, y:g.O+g.r.height*g.D/2, t0:tQuadro, a:g.P*(.1+.02*k)}); camE.vy-=90+25*k;
    // tranco do tabuleiro só para cima e para baixo: com zoom (como era), o tamanho medido das casas mudava a cada quadro
    // do soco e todos os canvas (peças, planetas, malha) eram refeitos do zero, uns 100 por quadro, travando ~60 ms
    $('#stage').animate?.([{transform:'translateY(0)'},{transform:`translateY(${-3-k}px)`},{transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
    $('#freMult')?.animate?.([{transform:'scale(1.8)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.2,1.6,.4,1)'}); } });
}
// a barra esvaziou: a corrente cai e tudo desliga (fim: o jogo acabou com a corrente acesa)
function freCai(t,fim){
  const F=S.fre, k=F.deg, c=F.corr, mult=DEGRAUS[k].x;
  F.corr=0; F.deg=0; F.resta=0; F.jan=janelaDe(0,F.vel);
  freVisual(0);   // (a barra zera junto)
  if(k>=1){ FV.caiT=t; SFX.cai(k);
    depois(g=>{ const ap=document.createElement('div'); ap.className='freApaga'; document.body.appendChild(ap); setTimeout(()=>ap.remove(),800);
      const bar=$('#freBar'); if(bar){ const q=document.createElement('div'); q.className='freCaiu'; q.textContent='×'+mult; bar.appendChild(q); setTimeout(()=>q.remove(),800); }
      if(!POUCO_MOV && g.r.width) ondasM.push({x:g.O+g.r.width*g.D/2, y:g.O+g.r.height*g.D/2, t0:tQuadro, a:-g.P*.09}); }); }
  freTexto(fim||k<1 ? null : `a corrente caiu · ${c}`);   // no ×1 a corrente curta cai sem alarde
}
function freAcelera(){ SFX.acelera(); const v=S.fre.vel, k=S.fre.deg; depois(()=>freFlash('velocidade '+v, k, 'vel')); }
// letreiro grande no meio do tabuleiro (degrau novo, FRENESI!, velocidade)
function freFlash(txt,k,cls=''){
  const st=$('#stage'); if(!st) return;
  const el=document.createElement('div'); el.className='freFlash '+cls+(k===TOPO&&!cls?' topo':''); el.textContent=txt;
  el.style.setProperty('--fc', DEGRAUS[k].cor); st.appendChild(el); setTimeout(()=>el.remove(),1300);
}
// cor do degrau no corpo da página (barra, número, bordas, etiquetas): muda só quando o degrau muda. O que pulsa
// (bordas, número, barra) anda por animações do próprio navegador, fora da linha principal do jogo: escrever estilo a
// cada quadro (como na primeira tentativa) refazia o layout e custava boa parte da folga do quadro.
// A classe vai no palco (barra e tabuleiro) e nas bordas; a cor (--fc), só na barra e nas bordas. Uma variável de cor
// herdada faz o navegador recalcular o estilo de tudo o que fica embaixo de onde ela muda: no body era a página inteira,
// no palco eram todas as peças (uns 9 ms no celular, bem no quadro do letreiro). As etiquetas acesas usam cores fixas.
function freVisual(k){
  FV.grau=k; if(musName==='frenesi') MUS?.intensidade?.(k/TOPO);
  FV.pedeVisual=true; freBarra();
}
function freVisualPinta(k){
  for(const el of [$('#stage'), $('#freBorda')]){ if(!el) continue; for(let i=0;i<=TOPO;i++) el.classList.toggle('fd'+i, i===k); }
  for(const el of [$('#freBar'), $('#freBorda')]) el?.style.setProperty('--fc', DEGRAUS[k].cor);
  const m=$('#freMult'); if(m) m.textContent='×'+DEGRAUS[k].x;
  const bo=$('#freBorda'); if(bo){ FV.borda = k ? Math.min(.8,.15+.1*k) : 0; bo.firstChild.style.opacity = k===TOPO ? .35 : FV.borda; }
}
// a barra do tempo esvazia sozinha (animação do navegador), da fração que falta até zero; pausa junto com o jogo
function freBarra(){ FV.pedeBarra=true; }
function freBarraPinta(){
  const i=$('#freTempo')?.firstChild, F=S?.fre; if(!i || !F) return;
  FV.barra?.cancel(); FV.barra=null;
  if(F.corr>0 && F.resta>0){ FV.barra=i.animate([{transform:`scaleX(${Math.min(1,F.resta/F.jan)})`},{transform:'scaleX(0)'}],{duration:F.resta*1000, fill:'forwards'});
    if(!FV.jogando) FV.barra.pause(); }
}
function freTexto(msg){
  const F=S.fre, el=$('#freTxt'); if(!el) return;
  if(msg){ el.textContent=msg; FV.msgAte=(tQuadro||0)+1.6; }
  else if(F.corr<=0) el.textContent = (tQuadro||0)<(FV.msgAte||0) ? el.textContent : 'junte rápido para acender';
  else if(F.deg===TOPO) el.textContent=`frenesi · corrente ${F.corr}`;
  else { const p=DEGRAUS[F.deg+1]; el.textContent=`corrente ${F.corr} · ×${p.x} em ${p.min-F.corr}`; }
  const v=$('#freVel'); if(v) v.textContent = F.vel>1 ? 'vel '+F.vel : '';
}
// rastro de luz atrás das peças que andaram (a partir do ×3); desenhado no céu (freCeu)
function freRastros(r,t){
  if(S.fre.deg<2 && FV.k<1.5) return;
  const ant=new Map((S.undoSnap?.tiles||[]).map(q=>[q.id,q])), g=geoTab(); if(!g.r.width) return;
  const tela=(x,y)=>[g.r.left+(g.g0+(x+.5)*g.P)/g.D, g.r.top+(g.g0+(y+.5)*g.P)/g.D];
  for(const q of [...S.tiles,...r.gone]){ const a=ant.get(q.id); if(!a || (a.x===q.x && a.y===q.y)) continue;
    FV.rastros.push({a:tela(a.x,a.y), b:tela(q.x,q.y), t0:t, cor:corNivelRgb(Math.max(1,q.t))}); }
}

// ---------- a cada quadro (espLoop) ----------
function freQuadro(t){
  if(!S || !S.frenesi || !S.fre) return;
  const F=S.fre, dt=Math.min(.1,Math.max(0,t-FV.t)); FV.t=t;
  const jogando = S.phase==='mine' && !overlayOpen() && $('#scrGame').classList.contains('on');
  FV.jogando=jogando;
  if(jogando && F.corr>0){ F.resta-=dt; if(F.resta<=0) freCai(t); }
  if(F.corr<=0 && FV.msgAte && t>FV.msgAte){ FV.msgAte=0; freTexto(); }
  // a música pode ter acabado de carregar: recebe o degrau atual
  if(musName==='frenesi' && MUS && FV.mus!==MUS){ FV.mus=MUS; MUS.intensidade?.(F.deg/TOPO); }
  // batida da música (ou um relógio de 120 bpm, sem música): as luzes pulsam no tempo
  const b = musName==='frenesi' && MUS?.batida ? MUS.batida() : null, fase = b ? b.fase : (t*2)%1;
  if(fase<FV.bat) freBatida(t);
  FV.bat=fase; FV.pulso=Math.pow(1-fase,3);
  // degrau suavizado: as cores vão mudando (sobem devagar, apagam rápido)
  FV.k += (F.deg-FV.k)*Math.min(1, dt*(F.deg<FV.k?6:3.5));
  const k0=Math.floor(FV.k), k1=Math.min(TOPO,k0+1);
  FV.cor = mistura(COR_DEG[k0], COR_DEG[k1], FV.k-k0); if(FV.k>TOPO-1) FV.cor=mistura(FV.cor, arcoIris(t), FV.k-(TOPO-1));
}
// o que muda na página a cada quadro: no fim do quadro (espLoop), depois que o céu, a malha e as peças já leram as
// posições, para não forçar o navegador a refazer o layout no meio do quadro
function frePinta(t){
  if(!S || !S.frenesi || !S.fre) return;
  const F=S.fre;
  // o que ficou pendente do arrasto (degrau novo, queda): primeiro a leitura do tabuleiro, depois as escritas
  if(FV.fila.length || FV.pedeVisual || FV.pedeBarra){ const g=geoTab();
    if(FV.pedeVisual){ FV.pedeVisual=false; freVisualPinta(FV.grau); }
    if(FV.pedeBarra){ FV.pedeBarra=false; freBarraPinta(); }
    for(const f of FV.fila.splice(0)) f(g); }
  // barra: pausa e volta com o jogo; vermelha piscando no fim
  const b=FV.barra; if(b){ if(FV.jogando && b.playState==='paused') b.play(); else if(!FV.jogando && b.playState==='running') b.pause(); }
  const tr=$('#freTempo'), pouco=F.corr>0 && F.resta<F.jan*.3; if(tr && tr._p!==pouco){ tr._p=pouco; tr.classList.toggle('pouco',pouco); }
  // pontos rolando até o total, 20 vezes por segundo (o número fica numa caixa de tamanho fixo: não mexe no resto da tela)
  const alvo=S.pontos||0; if(FV.mostra<alvo && t-(FV.ptsT||0)>.045){ FV.ptsT=t; mostraPontos(Math.min(alvo, FV.mostra+Math.max(1,Math.ceil((alvo-FV.mostra)*.3)))); }
}
// a cada tempo da música: a partir do ×8 a malha treme junto; no ×20 um anel sai do tabuleiro
function freBatida(t){
  const k=S.fre.deg; if(k<2 || POUCO_MOV || S.phase!=='mine') return;
  // o número e as bordas dão um pulo na batida (animação do navegador, uma por tempo; começa no fim do quadro)
  depois(()=>{ $('#freMult')?.animate([{scale:1.04+.025*k},{scale:1}],{duration:300,easing:'ease-out'});
    const bo=$('#freBorda'); if(bo && k<TOPO) bo.firstChild.animate([{opacity:Math.min(1,FV.borda+.12+.04*k)},{opacity:FV.borda}],{duration:380,easing:'ease-out'}); });
  if(k<4) return;
  const g=geoTab(); if(!g.r.width) return;
  tremM.push({x:g.O+g.r.width*g.D/2, y:g.O+g.r.height*g.D/2, t0:t, a:g.P*(.012+.008*(k-3))});
  if(k===TOPO && (FV.nBat=(FV.nBat||0)+1)%2) aneisE.push({x:g.r.left+g.r.width/2, y:g.r.top+g.r.height/2, t0:t, v:g.r.width*.9, rgb:txtRgb(arcoIris(t)), a:.3, w:5});   // um anel a cada dois tempos (círculos enormes custam)
}
// as duas cores da nebulosa (ceuDesenha): as do mundo no ×1, as do degrau acima, girando no ×20, pulsando na batida;
// logo depois da queda, cinza e escura por um instante
function freNeb(neb,t){
  const k=FV.k, cai=Math.max(0,1-(t-FV.caiT)/1.1);
  if(k<.02 && !cai) return neb;
  const deg=(i,j)=>{ if(i===0) return rgbDe0(neb[j]); if(i===TOPO) return j ? arcoIris(t,.33) : hslRgb(t*.12,.85,.42); return rgbDe0(DEGRAUS[i].neb[j]); };
  const k0=Math.floor(k), k1=Math.min(TOPO,k0+1), f=k-k0, luz=1+(POUCO_MOV?.04:.1+.05*k)*FV.pulso;
  return [0,1].map(j=>{ let c=mistura(deg(k0,j),deg(k1,j),f).map(v=>v*luz);
    if(cai){ const cinza=(c[0]+c[1]+c[2])/3*.45; c=c.map(v=>v+(cinza-v)*cai*.85); }
    return txtRgb(c); });
}
const rgbDe0 = s => s.split(',').map(Number);
// malha: a cor do mundo vai para a do degrau, mais acesa
function freMalhaCor(rgb){ const k=FV.k; if(k<.03) return rgb; return txtRgb(mistura(rgbDe0(rgb), FV.cor, Math.min(.85,.2+.11*k))); }
const freMalhaGanho = () => 1+.13*FV.k;
const freMalhaSelo = t => Math.round(FV.k*12)+(FV.k>TOPO-.5?':'+Math.round(t*6):'');
// brilho redondo de uma cor, pintado uma vez e só copiado (a cor vai em degraus de 16, o arco-íris em 24 tons)
const HALO=new Map();
function haloDe(rgb){
  const q=rgb.map(v=>Math.min(255,Math.round(v/16)*16)), k=q.join(','); let s=HALO.get(k); if(s) return s;
  s=document.createElement('canvas'); s.width=s.height=64; const c=s.getContext('2d'), g=c.createRadialGradient(32,32,5,32,32,32);
  g.addColorStop(0,`rgba(${k},1)`); g.addColorStop(.45,`rgba(${k},.45)`); g.addColorStop(1,`rgba(${k},0)`); c.fillStyle=g; c.fillRect(0,0,64,64);
  if(HALO.size>60) HALO.clear(); HALO.set(k,s); return s;
}
// faixa do rastro: transparente atrás, acesa na frente, com as pontas arredondadas (uma por cor de nível)
const RASTRO=new Map();
function rastroDe(cor){ let s=RASTRO.get(cor); if(s) return s; s=document.createElement('canvas'); s.width=96; s.height=16; const c=s.getContext('2d');
  const g=c.createLinearGradient(0,0,96,0); g.addColorStop(0,`rgba(${cor},0)`); g.addColorStop(.85,`rgba(${cor},1)`); g.addColorStop(1,`rgba(${cor},1)`);
  c.fillStyle=g; c.beginPath(); c.moveTo(0,8); c.lineTo(88,0); c.arc(88,8,8,-Math.PI/2,Math.PI/2); c.lineTo(0,8); c.fill(); RASTRO.set(cor,s); return s; }
// os brilhos de cada degrau e do arco-íris ficam prontos num momento livre, no começo da partida
function freAquece(){ (window.requestIdleCallback||setTimeout)(()=>{ for(const c of COR_DEG) haloDe(c); for(let h=0;h<24;h++) haloDe(hslRgb(h/24,.9,.62)); for(let t=1;t<=12;t++) rastroDe(corNivelRgb(t)); }); }
// no céu, atrás do tabuleiro: brilho na cor do degrau atrás de cada peça (pulsando) e os rastros
function freCeu(c,t){
  const k=FV.k; if(k<.05 && !FV.rastros.length) return;
  c.save(); c.globalCompositeOperation='lighter';
  const g=geoTab();
  // na troca de degrau, o brilho de um degrau some enquanto o do outro aparece (dois desenhos prontos), em vez de pintar um
  // brilho novo a cada cor do caminho (era um canvas novo a cada poucos quadros, bem na hora do letreiro)
  if(k>=.05){ const a=Math.min(.55,.1+.065*k)*(1+(POUCO_MOV?0:.6*FV.pulso)); let i=0;
    const arco=k>TOPO-.5, k0=Math.floor(k), f=k-k0, hb=Math.floor(t*.12*24), s0=haloDe(COR_DEG[k0]), s1=haloDe(COR_DEG[Math.min(TOPO,k0+1)]);
    for(const {el,fr} of pecasNoQuadro()){ const x=fr.left+fr.width/2, y=fr.top+fr.height/2, R=g.cel*(.58+.05*k)*Math.max(1,kNivel(el._t.t)*.75);
      if(arco){ c.globalAlpha=a; c.drawImage(haloDe(hslRgb((hb+i*2)/24,.9,.62)), x-R, y-R, 2*R, 2*R); }
      else{ if(f<.98){ c.globalAlpha=a*(1-f); c.drawImage(s0, x-R, y-R, 2*R, 2*R); } if(f>.02){ c.globalAlpha=a*f; c.drawImage(s1, x-R, y-R, 2*R, 2*R); } }
      i++; }
    c.globalAlpha=1; }
  // rastros: uma faixa pronta (cor do nível, apagando para trás) esticada e girada até o caminho da peça; criar um
  // degradê novo para cada rastro a cada quadro pesava justo nos quadros depois do arrasto
  const cel=g.cel;
  for(const r of FV.rastros){ const u=(t-r.t0)/.38; if(u<0||u>1) continue; const [x0,y0]=r.a, [x1,y1]=r.b, L=Math.hypot(x1-x0,y1-y0); if(L<1) continue;
    const w=cel*(.18+.04*Math.min(k,6))*(1-u*.6);
    c.globalAlpha=.75*(1-u); c.setTransform((x1-x0)/L,(y1-y0)/L,-(y1-y0)/L,(x1-x0)/L,x0,y0); c.drawImage(rastroDe(r.cor),0,-w/2,L+w/2,w); }
  c.setTransform(1,0,0,1,0,0); c.globalAlpha=1;
  FV.rastros=FV.rastros.filter(r=>t-r.t0<.38);
  c.restore();
}
// força das reações do fundo a cada arrasto (espJogada): 0 no ×1, 1 no ×20
const freForca = () => S && S.frenesi && S.fre ? S.fre.deg/TOPO : 0;
