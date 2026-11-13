
// ===================== FRENESI (modo em teste; nome provisório) =====================
// Rodadas contra o relógio. A partida começa num 3x3; cada rodada tem um relógio e uma meta de pontos (os pontos da
// rodada começam do zero, o tabuleiro continua de uma rodada para a outra). Bateu a meta, a rodada acaba na hora: o tempo
// que sobrou vira pontos (e, se sobrou bastante, uma carta a mais para escolher) e a pessoa escolhe 1 de 3 cartas
// (tabuleiro maior, mais tempo, corrente mais fácil, peças que valem mais, bônus que aparecem no tabuleiro...). Acabou
// o tempo sem a meta, ou o tabuleiro encheu: fim de partida. O recorde principal é a rodada alcançada.
// A corrente continua a ferramenta para as metas maiores: cada arrasto que junta peças antes de a barra esvaziar soma
// na corrente (várias junções no mesmo arrasto somam mais); a corrente sobe o multiplicador por degraus (×1, ×2, ×3,
// ×5, ×8, ×12, ×20) e os pontos de cada junção são multiplicados. A cada degrau o jogo esquenta (nebulosa, malha,
// brilho e rastro nas peças, bordas, letreiros, camadas da trilha musica/frenesi.js); se a barra esvaziar, tudo desliga.
// Só aparece com ?frenesi no endereço (fica gravado no aparelho; ?frenesi=0 desliga), no menu do espaço, abaixo do Clássico.
// Guardado à parte do Clássico: ptui_fre_rod (maior rodada), ptui_rec_fre (pontos), ptui_fre_corr (maior corrente),
// ptui_fre_mult (maior multiplicador), a partida em andamento em ptui_fre_save, e ptui_fre_vi2 (já viu a explicação).
(()=>{ const m=location.search.match(/[?&]frenesi(?:=(\d))?/); if(m) localStorage.ptui_frenesi = m[1]==='0' ? '0' : '1'; })();
const frenesiLigado = () => localStorage.ptui_frenesi!=='0' && espacoLigado();   // oficial desde 2026-11-11: aparece para todos (?frenesi=0 esconde)
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
const somaCorrente = n => 2*n-1;   // junções no mesmo arrasto: 1, 3, 5, 7
// as cartas mexem nos degraus (menos corrente para subir) e na janela (barra mais longa)
const carta = id => S?.rod?.cartas?.[id]||0;
const minDe = k => Math.ceil(DEGRAUS[k].min*Math.pow(.75,carta('degraus')));
const degrauDe = c => { let k=0; while(k<TOPO && c>=minDe(k+1)) k++; return k; };
const janelaDe = k => DEGRAUS[k].jan*(1+.3*carta('barra'));

// ---------- rodadas ----------
// meta da rodada n: começa baixa (o 3x3 enche rápido) e cresce ×2,2 a cada rodada (200, 440, 970, 2.130, 4.690...).
// Calibrada com o robô em três ritmos (12 partidas cada, cartas escolhidas por uma ordem fixa): um arrasto a cada 1,1 s
// passa das 2 primeiras e para na rodada 4 (2 a 6); a cada 0,7 s, na 6 (3 a 7); a cada 0,4 s, na 8 (7 a 9).
const FRE_REGRA={meta1:200, fator:2.2, tempo:60}, LADO_MAX=6;
const metaDe = n => Math.round(FRE_REGRA.meta1*Math.pow(FRE_REGRA.fator,n-1)/10)*10;
const tempoDe = () => FRE_REGRA.tempo+10*carta('tempo');
const recRod = () => +(localStorage.ptui_fre_rod||0);
const REC_FRE = () => +(localStorage.ptui_rec_fre||0);
const recFre = () => ({rod:recRod(), pts:REC_FRE(), corr:+(localStorage.ptui_fre_corr||0), mult:+(localStorage.ptui_fre_mult||1)});
const freSalvo = () => JSON.parse(localStorage.ptui_fre_save||'null');
const fmtN = n => String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');   // 12.345 (toLocaleString custava a cada quadro dos pontos rolando)
const fmtT = s => { s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
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
// O que mexe na página na hora de subir ou cair de degrau, de rodada ou de bônus (letreiro, classes, tranco, animações)
// não roda dentro do arrasto: vai para o fim do quadro seguinte (frePinta), quando o céu, a malha e as peças já leram as
// posições. Feito no meio do arrasto, cada mudança obrigava o navegador a recalcular estilo e layout ali mesmo. O som
// sai na hora.
const depois = f => { if(!window.FRE_SIM) FV.fila.push(f); };

// ---------- cartas ----------
// ícones em traço neon (SVG), os mesmos nas cartas e nos bônus do tabuleiro
const ICO_FRE={
  col:'<rect x="14" y="20" width="18" height="60" rx="3"/><rect x="38" y="20" width="18" height="60" rx="3"/><rect x="62" y="20" width="22" height="60" rx="3" class="novo"/><path d="M73 44v12M67 50h12" class="novo"/>',
  lin:'<rect x="20" y="14" width="60" height="18" rx="3"/><rect x="20" y="38" width="60" height="18" rx="3"/><rect x="20" y="62" width="60" height="22" rx="3" class="novo"/><path d="M50 67v12M44 73h12" class="novo"/>',
  tempo:'<circle cx="46" cy="54" r="30"/><path d="M46 36v18l12 8"/><path d="M80 18v16M72 26h16" class="novo"/>',
  barra:'<rect x="10" y="40" width="80" height="20" rx="10"/><rect x="14" y="44" width="62" height="12" rx="6" class="cheio"/>',
  largada:'<text x="50" y="64" text-anchor="middle" font-size="40" font-weight="900">×2</text><path d="M20 78h60"/>',
  degraus:'<path d="M14 84h18V66h18V48h18V30h18"/><path d="M76 20l10 10" class="novo"/>',
  valor:'',
  maior:'<circle cx="28" cy="62" r="10"/><circle cx="66" cy="48" r="22"/><path d="M40 60l10-5"/>',
  relogio:'<circle cx="50" cy="52" r="32"/><path d="M50 32v20l14 9"/><path d="M42 12h16"/>',
  supernova:'<path d="M50 10l8 28 28-8-20 20 20 20-28-8-8 28-8-28-28 8 20-20-20-20 28 8z"/><circle cx="50" cy="50" r="8" class="cheio"/>',
  buraco:'<ellipse cx="50" cy="52" rx="40" ry="13"/><circle cx="50" cy="52" r="17" class="escuro"/><path d="M10 52a40 13 0 0 0 80 0"/>',
  coringa:'<circle cx="50" cy="50" r="34" class="roxo"/><path d="M50 16a34 34 0 0 1 0 68" class="verde"/><path d="M50 34l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" class="cheio"/>',
};
const icoFre = (k,cls='') => `<svg class="icoFre ${cls}" viewBox="0 0 100 100">${ICO_FRE[k]}</svg>`;
// cada carta: nome curto, uma linha (n = nível que ela terá se for escolhida), se pode aparecer, e o que faz
const CARTAS={
  col:{nome:'+1 coluna', linha:()=>'o tabuleiro fica mais largo', pode:()=>W<LADO_MAX, espaco:1},
  lin:{nome:'+1 linha', linha:()=>'o tabuleiro fica mais alto', pode:()=>H<LADO_MAX, espaco:1},
  tempo:{nome:'+10 segundos', linha:n=>`cada rodada dura ${fmtT(FRE_REGRA.tempo+10*n)}`, pode:()=>carta('tempo')<4},
  barra:{nome:'Corrente longa', linha:n=>`a barra da corrente dura ${30*n}% mais`, pode:()=>carta('barra')<3},
  largada:{nome:'Largada', linha:n=>`cada rodada começa no ×${DEGRAUS[n].x}`, pode:()=>carta('largada')<3},
  degraus:{nome:'Degraus curtos', linha:n=>`cada degrau pede ${Math.round(100-100*Math.pow(.75,n))}% menos corrente`, pode:()=>carta('degraus')<3},
  valor:{nome:'', linha:()=>'', pode:()=>true},
  maior:{nome:'Nascem maiores', linha:n=>`${20*n}% das peças nascem um nível acima`, pode:()=>carta('maior')<3},
  relogio:{nome:'Relógios', linha:()=>'aparecem no tabuleiro: +5 s', pode:()=>carta('relogio')<3, bonus:1},
  supernova:{nome:'Supernovas', linha:()=>'aparecem: limpam as casas em volta', pode:()=>carta('supernova')<3, bonus:1},
  buraco:{nome:'Buracos negros', linha:()=>'aparecem: engolem a menor peça', pode:()=>carta('buraco')<3, bonus:1},
  coringa:{nome:'Coringas', linha:()=>'aparecem: a peça junta com qualquer outra', pode:()=>carta('coringa')<3, bonus:1},
};
// "um nível de peça vale ×2": o nível sorteado entre os que estão no tabuleiro (e o seguinte), do Gelo à Terra
function cartaValor(){
  const R=S.rod, tem=new Set(S.tiles.filter(t=>t.t>=2).map(t=>t.t)); let M=1; for(const t of S.tiles) if(t.t>M) M=t.t;
  const ops=[]; for(let t=2;t<=Math.min(11,M+1);t++) if((R.valor[t]||1)<4 && (tem.has(t)||t===M+1)) ops.push(t);
  if(!ops.length) return null; const t=ops[Math.floor(Math.random()*ops.length)];
  return {id:'valor', t, nome:`${noIco(rockName(t))} ×${(R.valor[t]||1)+1}`, linha:`pontos ×${(R.valor[t]||1)+1} ao formar ${artigo(rockName(t))} ${rockName(t)}`};
}
// oferta: n cartas diferentes; até o tabuleiro chegar ao 4x4, uma delas é sempre de espaço (o crescimento aparece cedo);
// com o tabuleiro travado, só espaço
function freOferta(n){
  const ops=Object.keys(CARTAS).filter(k=>k!=='valor' && CARTAS[k].pode()), esp=ops.filter(k=>CARTAS[k].espaco), out=[];
  const montar=k=>{ if(k==='valor') return cartaValor(); const c=CARTAS[k], nv=carta(k)+1; return {id:k, nome:c.nome, linha:c.linha(nv), nivel:nv}; };
  if(esp.length && (W*H<16 || !anyMove())) out.push(montar(esp[Math.floor(Math.random()*esp.length)]));
  if(!anyMove() && esp.length) return out;
  const bolsa=[...ops.filter(k=>!out.some(c=>c.id===k)), 'valor'];
  while(out.length<n && bolsa.length){ const peso=bolsa.map(k=>CARTAS[k].espaco?2:1), tot=peso.reduce((a,b)=>a+b,0); let r=Math.random()*tot, i=0; while(r>=peso[i]){ r-=peso[i]; i++; }
    const k=bolsa.splice(i,1)[0], c=montar(k); if(c) out.push(c); }
  return out;
}

// ---------- menu ----------
// botão abaixo do Clássico (só com ?frenesi); com partida salva, diz de onde continua
function freMenu(on){
  let b=$('#mFre');
  if(!frenesiLigado()){ if(b) b.style.display='none'; return; }
  if(!b){ b=document.createElement('button'); b.className='btn big'; b.id='mFre'; b.innerHTML='Frenesi<small>rodadas contra o relógio</small>'; b.onclick=freEntra; }
  $('#mInf').after(b); b.style.display = on ? '' : 'none';
  const sv=freSalvo(), sub=b.querySelector('small'); if(sub.dataset.txt==null) sub.dataset.txt=sub.textContent;
  sub.textContent = sv ? `continuar · rodada ${sv.rod?.n||1}` : sub.dataset.txt; b.classList.toggle('comSub', !!sv);
}
// na primeira vez, uma tela com as regras
function freEntra(){
  if(localStorage.ptui_fre_vi2) return frenesiJoga({retoma:true});
  janelaMenu();
  showOverlay(`<h2>Frenesi</h2>
    <p>Rodadas contra o relógio: faça a meta de pontos antes de o tempo acabar. O tabuleiro começa pequeno e continua de uma rodada para a outra.</p>
    <p>Junte rápido: cada junção logo depois da outra sobe a corrente, e a corrente multiplica os pontos (×2, ×3, ×5... até ×20).</p>
    <p>Bateu a meta: escolha uma carta (tabuleiro maior, mais tempo, bônus...). Acabou o tempo ou encheu o tabuleiro: fim.</p>
    <button class="btn g" id="frJoga">Jogar</button><button class="btn dim" id="frVolta">Voltar</button>`);
  $('#frJoga').onclick=()=>{ localStorage.ptui_fre_vi2='1'; frenesiJoga({retoma:true}); };
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
  S.fre={corr:0, deg:0, resta:0, jan:3, maxCorr:f.maxCorr||0, maxMult:f.maxMult||1};
  S.rod = sv?.rod ? {...sv.rod, bonus:[]} : {n:1, meta:metaDe(1), pts:0, resta:FRE_REGRA.tempo, cartas:{}, valor:{}, bonus:[], prox:{}, escolhas:[]};
  S.fiscal=FISCAIS[0];
  applyAndar(); startDay({...PATHS.comum, forma:null, caverna:false, energy:999-CFG.energy, semEnergia:true, w:sv?.w||3, h:sv?.h||3});
  limpaMarcas(); if(sv) restauraFase(sv.st);
  document.body.classList.add('modoCla','modoInf','modoFre'); $('#btnPause').textContent='☰';
  freMontaTela(); FV.mostra=S.rod.pts||0; FV.rastros=[]; FV.k=0; FV.caiT=-9; FV.fila=[]; FV.relS=-1; freTiraBonus(true);
  montaFreHud(); render();
  setBanner('Frenesi', 'rodadas'); pedeEncaixe();
  freVisual(0); freVisualPinta(0); freAquece();
  if(musName==='frenesi') MUS?.intensidade?.(0);
  if(S.rod.oferta){ S.phase='cartas'; freMostraCartas(); }   // fechou o jogo na escolha das cartas: volta nela
  else if(sv){ freHudRodada(); freTexto(); }                  // continua a rodada de onde parou
  else freRodadaComeca(true);
}
function freMontaTela(){
  if(!$('#freBar')){ const b=document.createElement('div'); b.id='freBar';
    b.innerHTML='<div id="freMult">×1</div><div id="freInfo"><div id="freLinha"><span id="freTxt"></span><span id="freVel"></span></div><div id="freTempo"><i></i></div></div>';
    $('#stage').insertBefore(b, board); }
  if(!$('#freBorda')){ const o=document.createElement('div'); o.id='freBorda'; o.innerHTML='<i></i><i></i><i></i>'; document.body.appendChild(o); }
  // painel de cima: relógio e rodada no lugar do recorde; pontos da rodada e meta (com a barrinha) no lugar dos pontos
  if(!$('#freMetaP')){ const p=document.createElement('div'); p.className='pill'; p.id='freMetaP';
    p.innerHTML='<div><b id="frePts">0</b><small id="freMetaTxt">meta</small><i id="freMetaBar"><i></i></i></div>'; $('#ptsP').after(p); }
}
function montaFreHud(){ $('#cMis').innerHTML=`<div class="freRel"><b id="freRelogio">1:00</b><small id="freRod">rodada 1</small></div>`; $('#ptsP').style.display=''; freHudRodada(); }
// rodada e meta no painel (muda só na troca de rodada)
function freHudRodada(){ const R=S.rod; const r=$('#freRod'); if(r) r.textContent='rodada '+R.n; const m=$('#freMetaTxt'); if(m) m.textContent='meta '+fmtN(R.meta); mostraPontos(R.pts||0); }
// chamado pelo render (hudInfinito): os pontos da rodada sobem rolando (frePinta)
function hudFrenesi(){
  $('#cArr').textContent=S.moves||0;
  if(POUCO_MOV || (S.rod.pts||0)<FV.mostra) mostraPontos(S.rod.pts||0);
}
function mostraPontos(v){ FV.mostra=v; const el=$('#frePts'); if(!el) return; const s=fmtN(v); el.textContent=s; el.classList.toggle('longo', s.length>6);
  const b=$('#freMetaBar'); if(b) b.firstChild.style.transform=`scaleX(${Math.min(1,v/Math.max(1,S.rod.meta)).toFixed(3)})`; }

// cada arrasto que mexeu (move, depois de contaMissao): corrente, degrau, pontos multiplicados, bônus, meta
function freJogada(r){
  const F=S.fre, R=S.rod, t=tQuadro||performance.now()/1000, js=r.merges.filter(o=>o.k!=='p'), n=js.length;
  freRastros(r,t);
  if(!n) return;
  const antes=F.deg;
  F.corr = (F.corr>0 ? F.corr : 0) + somaCorrente(n);
  F.deg = degrauDe(F.corr); F.jan = janelaDe(F.deg); F.resta = F.jan;
  const m=DEGRAUS[F.deg].x, simples=js.reduce((a,o)=>a+VAL(o.t),0), cheio=js.reduce((a,o)=>a+VAL(o.t)*(R.valor[o.t]||1),0)*m;
  S.pontos += cheio-simples; R.pts += cheio;   // contaMissao já somou o valor simples no total
  F.maxCorr=Math.max(F.maxCorr,F.corr); F.maxMult=Math.max(F.maxMult,m);
  SFX.corrente(F.corr);
  if(F.deg>antes) freSobe(F.deg,t);
  freColhe(js);
  if(R.pts>=R.meta) R.completa=true;
  freTexto(); freBarra();
}
// números saltando de cada junção: o valor e o multiplicador, maiores e mais acesos a cada degrau
function freFlutua(r){
  const k=S.fre.deg, m=DEGRAUS[k].x, cor=k===TOPO?'#ff7ad9':DEGRAUS[k].cor;
  for(const o of r.merges){ if(o.k==='p') continue; const v=S.rod.valor[o.t]||1;
    const el=document.createElement('div'); el.className='flut fre'; el.style.transform=pos(o.x,o.y);
    el.style.setProperty('--fc',cor); el.style.setProperty('--fs',(.27+.028*k).toFixed(3));
    el.innerHTML=`+${fmtN(VAL(o.t)*v)}${m>1?`<small>×${m}</small>`:''}`; board.appendChild(el); setTimeout(()=>el.remove(),1000); }
}
// depois de cada arrasto (no lugar do checaInfinito): recordes na hora, meta batida, salvo, ou fim de jogo
function checaFrenesi(){
  const F=S.fre, R=S.rod;
  freGuardaRecordes();
  // nascem maiores: a próxima peça pode vir um nível acima
  if(carta('maior') && S.next>0 && Math.random()<.2*carta('maior')) S.next++;
  if(R.completa){ freRodadaFim(); return; }
  if(anyMove()){ freSalva(); return; }
  freFim('não cabe mais nada');
}
function freGuardaRecordes(){ const F=S.fre;
  if((S.pontos||0)>REC_FRE()) localStorage.ptui_rec_fre=S.pontos;
  if(F.maxCorr>+(localStorage.ptui_fre_corr||0)) localStorage.ptui_fre_corr=F.maxCorr;
  if(F.maxMult>+(localStorage.ptui_fre_mult||1)) localStorage.ptui_fre_mult=F.maxMult;
  if(S.rod.n>recRod()) localStorage.ptui_fre_rod=S.rod.n; }
function freSalva(){ const R=S.rod;
  localStorage.ptui_fre_save=JSON.stringify({recAntes:S.recAntes, st:estadoFase(), w:W, h:H, fre:{maxCorr:S.fre.maxCorr, maxMult:S.fre.maxMult},
    rod:{n:R.n, meta:R.meta, pts:R.pts, resta:R.resta, cartas:R.cartas, valor:R.valor, prox:R.prox, escolhas:R.escolhas, oferta:R.oferta||null, sobra:R.sobra||0}}); }
// fim de partida: acabou o tempo ou encheu o tabuleiro
function freFim(motivo){
  localStorage.removeItem('ptui_fre_save');
  S.phase='fimI'; S.rod.motivo=motivo; setBanner(null,motivo);
  if(S.fre.corr>0) freCai(tQuadro||performance.now()/1000, true);
  freTiraBonus();
  const est=S; setTimeout(()=>{ if(S===est && S.phase==='fimI') frenesiFim(); },650);
}
function frenesiFim(){
  const F=S.fre, R=S.rod, A=S.recAntes||{rod:0,pts:0,corr:0,mult:1}, rr=R.n>(A.rod||0), rp=S.pontos>A.pts, rc=F.maxCorr>A.corr, rm=F.maxMult>A.mult;
  mostraPontos(R.pts||0);
  if(rr||rp) SFX.pagou(); else SFX.naoDeu();
  const t=Math.max(1,S.maxForm||1), Rc=recFre(), rec=b=>b?'<em>recorde!</em>':'';
  const cartas=Object.entries(R.cartas).filter(([k])=>k!=='valor').map(([k,n])=>`<span>${icoFre(k)}${n>1?`<b>${n}</b>`:''}</span>`).join('')
    + Object.entries(R.valor).map(([tv,x])=>`<span>${icoPlaneta(+tv)}<b>×${x}</b></span>`).join('');
  showOverlay(`<canvas id="espRes"></canvas><h2>Fim de jogo</h2><p class="freMotivo">${R.motivo==='acabou o tempo'?`Acabou o tempo na rodada ${R.n}`:`Não coube mais nada na rodada ${R.n}`}</p>
    <div class="freRes"><div class="rod"><b>${R.n}</b><small>rodada alcançada</small>${rec(rr)}</div><div><b>${fmtN(S.pontos)}</b><small>pontos</small>${rec(rp)}</div><div><b>×${F.maxMult}</b><small>maior multiplicador</small>${rec(rm)}</div><div><b>${F.maxCorr}</b><small>maior corrente</small>${rec(rc)}</div></div>
    ${cartas?`<div class="freCartasFim">${cartas}</div>`:''}
    <p>Tabuleiro ${W}x${H} · maior peça: ${rockName(t)}</p>
    ${rr&&rp?'':`<p class="freRecs">Seus recordes: rodada ${Rc.rod} · ${fmtN(Rc.pts)} pontos · ×${Rc.mult} · corrente de ${Rc.corr}</p>`}
    <button class="btn g" id="iDeNovo">Jogar de novo</button><button class="btn dim" id="iMenu">Menu</button>`);
  espPlanetaGrande($('#espRes'),t,'vit');
  $('#iDeNovo').onclick=()=>frenesiJoga(); $('#iMenu').onclick=()=>{ hideOverlay(); showMenu(); };
}

// ---------- rodada: começo, meta batida, cartas ----------
function freRodadaComeca(primeira){
  const R=S.rod, F=S.fre;
  R.completa=false; R.pts=0; R.resta=tempoDe(); R.meta=metaDe(R.n); R.oferta=null; R.bonus=[]; FV.relS=-1;
  // os bônus que a pessoa tem aparecem algumas vezes por rodada (o primeiro entre 4 e 9 s)
  R.prox={}; for(const k of Object.keys(CARTAS)) if(CARTAS[k].bonus && carta(k)) R.prox[k]=4+Math.random()*5;
  // largada: a rodada já começa num degrau, com a barra cheia
  const L=carta('largada'); F.corr=L?minDe(L):0; F.deg=L; F.jan=janelaDe(L); F.resta=L?F.jan:0;
  freVisual(L); freTexto(); freHudRodada();
  S.phase='mine'; freSalva(); freGuardaRecordes();
  if(!primeira || R.n>1) SFX.degrau(Math.min(6,R.n));
  depois(()=>freFlash('rodada '+R.n, Math.min(TOPO,R.n-1), 'rod', 'meta '+fmtN(R.meta)));
}
// meta batida: o arrasto termina, o tempo que sobrou vira pontos, e vêm as cartas
function freRodadaFim(){
  const R=S.rod, F=S.fre, sobra=Math.max(0,Math.ceil(R.resta)), extra=sobra*10*R.n;
  S.pontos+=extra; R.sobra=sobra; R.extra=extra; freGuardaRecordes();
  S.phase='cartas';
  F.corr=0; F.deg=0; F.resta=0; freVisual(0); freTiraBonus();
  R.oferta=freOferta(sobra>=20?4:3); freSalva();
  SFX.pagou();
  depois(()=>freFlash('rodada completa!', 3, 'rod', sobra?`sobraram ${sobra} s · +${fmtN(extra)}`:''));
  if(window.FRE_SIM) return;   // (simulação do robô: escolhe sem janela)
  const est=S; setTimeout(()=>{ if(S===est && S.phase==='cartas') freMostraCartas(); }, POUCO_MOV?600:1000);
}
function freMostraCartas(){
  const R=S.rod, of=R.oferta||[];
  const ico=c=>c.id==='valor'?`<span class="icoFre pl">${icoPlaneta(c.t)}</span>`:icoFre(c.id);
  showOverlay(`<div class="freCartas"><div class="num">RODADA ${R.n} COMPLETA</div>
    <p class="freSobra">${R.sobra?`sobraram ${R.sobra} s · +${fmtN(R.extra)} pontos${of.length>3?' · carta extra!':''}`:'no último segundo!'} · total ${fmtN(S.pontos)}</p>
    <h2>Escolha uma carta</h2>
    <div class="freMao n${of.length}">${of.map((c,i)=>`<button class="freCarta ${CARTAS[c.id]?.espaco?'esp':''}${CARTAS[c.id]?.bonus?' bon':''}" data-i="${i}">${ico(c)}<b>${noIco(c.nome)}</b><small>${c.linha}</small>${c.nivel>1&&!CARTAS[c.id]?.espaco?`<i>nível ${c.nivel}</i>`:''}</button>`).join('')}</div>
    <p class="freProx">próxima: rodada ${R.n+1} · meta ${fmtN(metaDe(R.n+1))}</p></div>`);
  FORA=null;
  document.querySelectorAll('.freCarta').forEach(b=>b.onclick=()=>freEscolhe(of[+b.dataset.i]));
}
// escolheu: aplica a carta; o tabuleiro que cresce é refeito ainda atrás da janela, e a rodada começa dois quadros depois
function freEscolhe(c){
  const R=S.rod; if(!c || S.phase!=='cartas') return;
  if(c.id==='valor') R.valor[c.t]=(R.valor[c.t]||1)+1; else R.cartas[c.id]=(R.cartas[c.id]||0)+1;
  R.escolhas.push(c.id==='valor'?'valor'+c.t:c.id); R.oferta=null;
  if(c.id==='col') freCresce(1,0); else if(c.id==='lin') freCresce(0,1);
  R.n++;
  const fim=()=>{ hideOverlay(); freRodadaComeca(); if(c.id==='col'||c.id==='lin') depois(()=>freFlash(c.nome, 2, 'vel')); };
  if(window.FRE_SIM) return fim();   // simulação do robô: sem quadros
  requestAnimationFrame(()=>requestAnimationFrame(fim));   // o tabuleiro novo é redesenhado atrás da janela
}
// tabuleiro maior: casas novas à direita ou embaixo; as peças ficam onde estão (a posição delas é relativa à casa)
function freCresce(dx,dy){
  const w=Math.min(LADO_MAX,W+dx), h=Math.min(LADO_MAX,H+dy); if(w===W && h===H) return;
  setupBoard(w,h); S.path={...S.path, w, h};
  if(window.FRE_SIM) return;
  render(); encaixa(true); SFX.nebulosa();
}

// ---------- relógio e bônus (o tempo de jogo: chamado a cada quadro, ou pela simulação) ----------
function freTempo(dt){
  const F=S.fre, R=S.rod; if(S.phase!=='mine') return;
  if(F.corr>0){ F.resta-=dt; if(F.resta<=0) freCai(tQuadro||0); }
  R.resta-=dt; if(R.resta<=0){ R.resta=0; freFim('acabou o tempo'); return; }
  // bônus: aparecem em casa vazia (no máximo 2 ao mesmo tempo) e somem depois de 12 s
  for(const k in R.prox){ R.prox[k]-=dt; if(R.prox[k]>0) continue; R.prox[k]=Math.max(6,15-3*(carta(k)-1))*(0.8+.4*Math.random());
    if(R.bonus.length>=2) continue; const vaz=emptyCells().filter(c=>!R.bonus.some(b=>b.x===c.x&&b.y===c.y)); if(!vaz.length) continue;
    const c=vaz[Math.floor(Math.random()*vaz.length)], b={id:'b'+(FV.bId=(FV.bId||0)+1), tipo:k, x:c.x, y:c.y, vida:12}; R.bonus.push(b); depois(()=>freBonusPoe(b)); }
  for(const b of R.bonus){ b.vida-=dt; if(b.vida<=0) depois(()=>freBonusTira(b)); }
  R.bonus=R.bonus.filter(b=>b.vida>0);
}
// pegar bônus: junção em cima da casa dele ou numa casa ao lado
function freColhe(js){
  const R=S.rod; if(!R.bonus.length) return;
  const pegos=R.bonus.filter(b=>js.some(o=>Math.abs(o.x-b.x)+Math.abs(o.y-b.y)<=1)); if(!pegos.length) return;
  R.bonus=R.bonus.filter(b=>!pegos.includes(b));
  const formados=new Set(js.map(o=>o.id)), tira=[];
  for(const b of pegos){ const o=js.find(o=>Math.abs(o.x-b.x)+Math.abs(o.y-b.y)<=1);
    if(b.tipo==='relogio'){ R.resta+=5; depois(()=>freFlash('+5 s', 1, 'vel')); }
    else if(b.tipo==='supernova'){   // limpa as casas em volta (menos as peças que acabaram de se formar); os pontos delas entram
      for(const q of S.tiles) if(!formados.has(q.id) && !tira.includes(q) && Math.abs(q.x-b.x)<=1 && Math.abs(q.y-b.y)<=1){ tira.push(q); const v=VAL(q.t)*DEGRAUS[S.fre.deg].x; S.pontos+=v; R.pts+=v; } }
    else if(b.tipo==='buraco'){   // engole a menor peça do tabuleiro
      const resto=S.tiles.filter(q=>!formados.has(q.id) && !tira.includes(q)); if(resto.length){ let mn=resto[0]; for(const q of resto) if(q.t<mn.t) mn=q; tira.push(mn); } }
    else if(b.tipo==='coringa' && o){ o.jk=1; o.c=2; }
    SFX.nebulosa(); if(b.tipo==='supernova') SFX.fundir(17);
    depois(()=>freBonusTira(b,true)); }
  if(tira.length){ S.tiles=S.tiles.filter(q=>!tira.includes(q)); if(R.pts>=R.meta) R.completa=true;
    if(!window.FRE_SIM) depois(()=>{ for(const q of tira){ const el=els.get(q.id); if(el){ els.delete(q.id); el.classList.add('some'); setTimeout(()=>el.remove(),320); } } }); }
}
// desenho dos bônus no tabuleiro (por baixo das peças)
function freBonusPoe(b){ if(window.FRE_SIM) return; const el=document.createElement('div'); el.className='freBonus '+b.tipo; el.dataset.b=b.id; el.style.transform=pos(b.x,b.y);
  el.innerHTML=icoFre(b.tipo); board.insertBefore(el, board.querySelector('.tile')); }
function freBonusTira(b,pego){ const el=board.querySelector(`.freBonus[data-b="${b.id}"]`); if(!el) return; el.classList.add(pego?'pego':'some'); setTimeout(()=>el.remove(),400); }
function freTiraBonus(agora){ if(S.rod) S.rod.bonus=[]; for(const el of board.querySelectorAll('.freBonus')) agora ? el.remove() : (el.classList.add('some'), setTimeout(()=>el.remove(),400)); }

// ---------- subir, cair ----------
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
  F.corr=0; F.deg=0; F.resta=0; F.jan=janelaDe(0);
  freVisual(0);   // (a barra zera junto)
  if(k>=1){ FV.caiT=t; SFX.cai(k);
    depois(g=>{ const ap=document.createElement('div'); ap.className='freApaga'; document.body.appendChild(ap); setTimeout(()=>ap.remove(),800);
      const bar=$('#freBar'); if(bar){ const q=document.createElement('div'); q.className='freCaiu'; q.textContent='×'+mult; bar.appendChild(q); setTimeout(()=>q.remove(),800); }
      if(!POUCO_MOV && g.r.width) ondasM.push({x:g.O+g.r.width*g.D/2, y:g.O+g.r.height*g.D/2, t0:tQuadro, a:-g.P*.09}); }); }
  freTexto(fim||k<1 ? null : `a corrente caiu · ${c}`);   // no ×1 a corrente curta cai sem alarde
}
// letreiro grande no meio do tabuleiro (degrau novo, FRENESI!, rodada nova, bônus), com uma linha embaixo se houver
function freFlash(txt,k,cls='',linha=''){
  const st=$('#stage'); if(!st || window.FRE_SIM) return;
  const el=document.createElement('div'); el.className='freFlash '+cls+(k===TOPO&&!cls?' topo':''); el.textContent=txt;
  if(linha){ const s=document.createElement('small'); s.textContent=linha; el.appendChild(s); }
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
  else { const p=DEGRAUS[F.deg+1]; el.textContent=`corrente ${F.corr} · ×${p.x} em ${minDe(F.deg+1)-F.corr}`; }
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
  if(jogando) freTempo(dt);   // corrente, relógio da rodada e bônus
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
  // pontos da rodada rolando, 20 vezes por segundo (o número fica numa caixa de tamanho fixo: não mexe no resto da tela)
  const alvo=S.rod.pts||0; if(FV.mostra<alvo && t-(FV.ptsT||0)>.045){ FV.ptsT=t; mostraPontos(Math.min(alvo, FV.mostra+Math.max(1,Math.ceil((alvo-FV.mostra)*.3)))); }
  // relógio da rodada: o texto só muda quando muda o segundo; nos últimos 10 s fica vermelho e pulsando
  const s=Math.ceil(S.rod.resta); if(s!==FV.relS){ FV.relS=s; const r=$('#freRelogio'); if(r){ r.textContent=fmtT(s); const p=S.phase==='mine'&&s<=10; if(r._p!==p){ r._p=p; r.classList.toggle('pouco',p); } } }
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
    for(const {el,fr} of pecasNoQuadro()){ const x=fr.left+fr.width/2, y=fr.top+fr.height/2, R=g.cel*(.58+.05*k)*Math.max(1,kTab(el._t.t)*.75);
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
