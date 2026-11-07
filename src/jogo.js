// ===================== ESTADO =====================
const $ = s => document.querySelector(s);
const board = $('#board'), stage = $('#stage');
const els = new Map();
let S = null, nextId = 1, sound = localStorage.mina_sound !== '0';
const rnd = n => Math.floor(Math.random()*n);
const pick = a => a[rnd(a.length)];
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const inside = (x,y) => x>=0 && y>=0 && x<W && y<H;
const pos = (x,y) => `translate(calc(${x}*(var(--cell) + var(--gap)) + var(--gap)), calc(${y}*(var(--cell) + var(--gap)) + var(--gap)))`;
const overlayOpen = () => !$('#overlay').classList.contains('hidden');
const sleep = ms => new Promise(r=>setTimeout(r, S.skip ? 0 : ms));
const lvl = id => S.lv[id]||0;
const has = id => lvl(id)>0;
const item = id => ITEMS.find(i=>i.id===id);
const andar = () => ANDARES[((S.tema||S.week)-1)%ANDARES.length];
const fiscalHoje = id => S.isFiscal && S.fiscal.id===id;
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const wallAt = (x,y) => S.walls.some(w=>w.x===x&&w.y===y);
const tileAt = (x,y) => S.tiles.find(t=>t.x===x&&t.y===y);
// mureta entre duas casas vizinhas (v: entre (x,y) e (x+1,y); h: entre (x,y) e (x,y+1))
const edgeBetween = (ax,ay,bx,by) => (S.edges||[]).some(e => ay===by && e.d==='v' && e.y===ay && e.x===Math.min(ax,bx) && Math.abs(ax-bx)===1
                                                    || ax===bx && e.d==='h' && e.x===ax && e.y===Math.min(ay,by) && Math.abs(ay-by)===1);

// tabuleiro de tamanho variável (4x4 normal, 5x5 no Salão)
function setupBoard(w,h=w){
  W=w; H=h; N=Math.max(w,h); board.querySelectorAll('.slot').forEach(e=>e.remove());
  // casa do maior tamanho que caiba na largura e em ~60% da altura da tela
  const vw=Math.min(innerWidth,440)-20, vh=Math.max(300, innerHeight*.6);
  const cel=Math.floor(Math.min(84, vw/(w*1.11+.11), vh/(h*1.11+.11)));
  board.style.setProperty('--w', w); board.style.setProperty('--h', h);
  board.style.setProperty('--cell', cel+'px'); board.style.setProperty('--gap', Math.max(2,Math.round(cel*.11))+'px');
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const c=document.createElement('div'); c.className='slot'; c.dataset.x=x; c.dataset.y=y; c.style.transform=pos(x,y); if(S) c.style.background=andar().sl; board.prepend(c); }
}
setupBoard(4);

// ===================== CABER NA TELA =====================
// O tabuleiro fica do maior tamanho que deixa a tela do jogo inteira à vista. Se nem com a casa mínima couber
// (tabuleiro muito alto, ou o editor aberto em tela pequena), a página passa a rolar: arrasta-se fora do tabuleiro.
const CEL_MIN_JOGO=14, CEL_MIN_EDITOR=26;
const vaoDe = c => Math.max(2,Math.round(c*.11));
const ladoDe = (n,c) => n*c + (n+1)*vaoDe(c);
const fimDoJogo = () => $('#scrGame').getBoundingClientRect().bottom + scrollY + 12;
function encaixa(redimensiona=true){
  document.body.classList.remove('rola');
  document.body.classList.toggle('editando', !!S?.editando && $('#scrGame').classList.contains('on'));
  if(!$('#scrGame').classList.contains('on')) return;
  if(redimensiona){
    const resto = fimDoJogo() - board.getBoundingClientRect().height;
    const largMax = Math.min(innerWidth,440)-20, altMax = innerHeight - resto - 2;
    const min = S?.editando ? CEL_MIN_EDITOR : CEL_MIN_JOGO;
    let c = 84;
    while(c>min && (ladoDe(W,c)>largMax || ladoDe(H,c)>altMax)) c--;
    while(c>10 && ladoDe(W,c)>largMax) c--;
    board.style.setProperty('--cell', c+'px'); board.style.setProperty('--gap', vaoDe(c)+'px');
  }
  document.body.classList.toggle('rola', fimDoJogo() > innerHeight+1);
  if(!$('#coach').classList.contains('hidden')) placeCoach();
}
// no fim do dia o resultado ocupa mais que os botões do dia: se não couber, a página desce até ele
function mostraFim(){
  encaixa(false);
  const sobra = Math.ceil(fimDoJogo() - innerHeight);
  if(sobra > scrollY+1) scrollTo({top:sobra, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
let encaixeAgendado=false;
function pedeEncaixe(redimensiona=true){
  if(encaixeAgendado) return; encaixeAgendado=true;
  requestAnimationFrame(()=>{ encaixeAgendado=false; encaixa(redimensiona && S?.phase==='mine'); });
}
addEventListener('resize', ()=>pedeEncaixe(S?.phase==='mine'));
// cores: 0 roxa, 1 verde, 2 mista (junta com as duas)
const corOk = (a,b) => a.c==null || b.c==null || a.c===b.c || a.c===2 || b.c===2;
const corJunta = (o,t) => o.c===2 ? t.c : o.c;

// ===================== ÍCONES NO TEXTO =====================
// Todo texto que cita uma pedrinha, o torrão, um minério ou a parede ganha o desenho ao lado.
const icoSvg = inner => `<svg class="ico" viewBox="0 0 100 100">${inner}</svg>`;
const icoRock = t => icoSvg(t===0 ? torraoInner() : pedraInner(t));
const icoOre  = o => icoSvg(oreSvg(o,50,52,2.6));
let GLOSS=null, GLOSS_RE=null, GLOSS_T=null;   // GLOSS_T: palavra -> nível da pedrinha (para pintar o nome)
function gloss(){
  if(GLOSS) return;
  GLOSS={}; GLOSS_T={};
  ROCKS.forEach((r,t)=>{ if(t>0) for(const w of [r.n, plural(r.n)]){ GLOSS[w]=icoRock(t); GLOSS_T[w]=t; } });
  for(const w of ['torrão','torrões','Torrão','Torrões']){ GLOSS[w]=icoRock(0); GLOSS_T[w]=0; }
  ORES.forEach((o,i)=>{ if(i){ GLOSS[o.n]=icoOre(i); GLOSS[o.n[0].toUpperCase()+o.n.slice(1)]=icoOre(i); } });
  for(const w of ['parede','paredes','Parede','Paredes']) GLOSS[w]=icoSvg(wallInner());
  for(const w of ['mureta','muretas','Mureta','Muretas']) GLOSS[w]=icoSvg('<rect x="42" y="8" width="16" height="84" rx="8" fill="#6b625a" stroke="'+INK+'" stroke-width="3"/>');
  const keys=Object.keys(GLOSS).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  GLOSS_RE=new RegExp(`(^|[^A-Za-zÀ-ÿ])(${keys.join('|')})(?![A-Za-zÀ-ÿ])`,'g');
}
// nome sem ícone (para títulos que já mostram o desenho grande): um caractere invisível quebra a busca
const noIco = w => w[0]+'⁠'+w.slice(1);
function enrich(html){
  gloss();
  return String(html).split(/(<[^>]+>)/).map(p=>p.startsWith('<')?p:p.replace(GLOSS_RE,(m,pre,w)=>pre+(w in GLOSS_T ? nomePedra(w,GLOSS_T[w]) : GLOSS[w]+w))).join('');
}
// nome de pedrinha no texto: ícone + nome em negrito, na cor da pedrinha, com um rótulo suave atrás
function nomePedra(w,t){
  return `<span class="nomeP" style="--c:${rd(t)};--f:${rc(t)}">${GLOSS[w]}<b>${noIco(w)}</b></span>`;
}

// o que cada pedrinha pode cuspir
function dropsHtml(t){
  const tb=DROPS[Math.min(t,14)];
  return tb.map((p,i)=>p?`<span class="drop">${p}% ${i?ORES[i].n:icoOre(0)+'nada'}</span>`:'').join('');
}
function pedraCard(t){
  if(t===0) return `<div class="card pc"><span class="em">${icoRock(0).replace('class="ico"','class="ico big"')}</span><div><b>${noIco('Torrão')}</b><span>Nasce sem energia. Não junta e custa no fim do dia.</span></div></div>`;
  return `<div class="card pc"><span class="em">${icoRock(t).replace('class="ico"','class="ico big"')}</span><div><b>${noIco(rockName(t))} <small class="nv">nível ${t}</small></b><span class="drops">${dropsHtml(t)}</span></div></div>`;
}
function tileInfo(t){
  if(!S || S.tut || overlayOpen()) return;
  const viz = (t.t>0 ? `<p>Com outra igual, vira ${rockName(t.t+1)}.</p>` : '') + (t.r ? `<p>Rara: cospe como ${rockName(t.t+2)}.</p>` : '') + (t.c!=null ? `<p>${['Roxa: junta com roxa ou mista.','Verde: junta com verde ou mista.','Mista: junta com qualquer cor.'][t.c]}</p>` : '');
  showOverlay(`<div class="cards">${pedraCard(t.t)}</div>${viz}<button class="btn b" id="btnOk">Ok</button>`);
  $('#btnOk').onclick=hideOverlay;
}
function pedrapedia(back){
  showOverlay(`<h2>Pedrinhas</h2><p>Duas iguais viram a próxima.</p>
    <div class="cards">${[...Array(14).keys()].map(i=>i+1).concat(0).map(pedraCard).join('')}</div>
    <p>Valores: ${ORES.slice(1).map(o=>`${o.n} $${o.p}`).join(' · ')}</p>
    <p>Pedrinha rara (contorno dourado): cospe como 2 níveis acima.</p>
    <button class="btn b" id="btnOk">Voltar</button>`);
  $('#btnOk').onclick=()=>{ hideOverlay(); back&&back(); };
}

// ===================== TELAS =====================
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on', s.id===id));
  $('#shell').classList.toggle('hidden', id==='scrMenu');
  document.body.classList.toggle('lock', id==='scrGame');
  document.body.classList.remove('semHud');
  scrollTo(0,0);
}

function freshState(){
  return {week:1, day:1, money:0, lv:{}, coroa:0, saved:0, bonus:0, gift:false, tiles:[], walls:[], phase:'map',
          energy:0, energyMax:0, char:null, hist:{}, trilha:{}, lane:null, mapa:null, fails:0, tut:null,
          stats:{days:0, best:0, maxT:0}, up:{}, amanha:{}, edges:[], ferr:{}};
}

// ===================== MENU =====================
function showMenu(){
  hideCoach(); hideOverlay(); show('scrMenu'); trilha('menu');
  const sv = localStorage.mina_save ? JSON.parse(localStorage.mina_save) : null;
  $('#mContinue').style.display = sv ? '' : 'none';
  if(sv) $('#mContinue').innerHTML = `Continuar a mineração<small>andar ${sv.week} · dia ${sv.day} · $${sv.money}</small>`;
  const best = +(localStorage.mina_best||0);
  $('#mBest').textContent = best ? `Recorde: andar ${best} (${ANDARES[(best-1)%ANDARES.length].n})` : '';
}
function credits(){
  showOverlay(`<h2>Créditos</h2><ul>
    <li><b>Jogo:</b> Guilherme Franco.</li>
    <li><b>Músicas:</b> trilhas do jogo O Gabinete, todas sintetizadas.</li>
    <li><b>Ícones do mapa:</b> Lorc e Delapouite, em <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, licença <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.</li>
    <li><b>Fonte:</b> Fredoka (SIL Open Font License).</li>
  </ul><button class="btn b" id="btnOk">Voltar</button>`);
  $('#btnOk').onclick=hideOverlay;
}
function newGameClick(){
  const go = () => { if(!localStorage.mina_tut) startTutorial(); else { S=freshState(); chooseChar(); } };
  if(localStorage.mina_save){
    showOverlay(`<h2>Começar de novo?</h2><p>A partida salva será perdida.</p><button class="btn" id="btnYes">Começar de novo</button><button class="btn dim" id="btnNo">Voltar</button>`);
    $('#btnYes').onclick=()=>{ hideOverlay(); localStorage.removeItem('mina_save'); go(); };
    $('#btnNo').onclick=hideOverlay;
  } else go();
}
function saveGame(){ if(S && !S.tut && !S.lab && !S.missao){ const {tiles,walls,edges,...rest}=S; localStorage.mina_save=JSON.stringify({...rest,tiles:[],walls:[],edges:[]}); } }
function loadGame(){ S={...freshState(), ...JSON.parse(localStorage.mina_save)}; applyAndar(); morning(true); }

const CHARS = {
  rola:     {em:'🌀', nome:'Rola',     desc:'Tudo desliza até bater, como no 2048.'},
  passinho: {em:'👣', nome:'Passinho', desc:'Tudo anda uma casa, como no Threes.'},
};
function chooseChar(){
  show('scrMenu');
  showOverlay(`<h2>Quem vai minerar?</h2>
    <div class="cards">${Object.entries(CHARS).map(([k,c])=>`<button class="card" data-char="${k}"><span class="em">${c.em}</span><div><b>${c.nome}</b><span>${c.desc}</span></div></button>`).join('')}</div>
    <button class="btn dim" id="btnNo">Voltar</button>`);
  document.querySelectorAll('[data-char]').forEach(b=>b.onclick=()=>{ S.char=b.dataset.char; hideOverlay(); startWeek(); });
  $('#btnNo').onclick=()=>{ hideOverlay(); showMenu(); };
}

// ===================== SEMANA E MAPA =====================
function applyAndar(){
  const a = andar();
  board.style.background = a.bd;
  document.querySelectorAll('.slot').forEach(s=>s.style.background=a.sl);
  document.body.style.setProperty('--andar', a.bd);
}
function startWeek(){
  S.day = 1; S.hist = {}; S.trilha = {}; S.lane = null;
  S.fiscal = FISCAIS[(S.week-1)%FISCAIS.length];
  S.mapa = gerarMapa();
  applyAndar();
  morning();
}
function clearBoard(){ for(const el of els.values()) el.remove(); els.clear(); S.tiles=[]; S.walls=[]; S.edges=[]; }

// ===================== MAPA DA SEMANA =====================
// 3 trilhas paralelas, 4 dias e o fiscal no topo. Cada lugar liga ao da mesma trilha no dia seguinte e,
// às vezes, ao da trilha vizinha: escolher um caminho importa, mas nem sempre é para sempre.
const LANES = 3;
const PESO = {caverna:2.6, comum:4, rico:2.2, galeria:2.2, corredor:2, estreita:1.6, desmoronamento:1.6, fogueira:1.3, avalanche:1.8, cores:1.8, salao:1.6};
const COR_NO = {comum:'#a0785a', rico:'#3e9fb2', galeria:'#6b625a', corredor:'#8a6a3a', estreita:'#7a59a8', desmoronamento:'#c0603f', fogueira:'#e0882a', fiscal:'#b8432f', entrada:'#5a4636', avalanche:'#8f5b34', cores:'#4f9a6a', salao:'#3e6f9f', caverna:'#6b5a8a'};
const giSvg = k => `<svg class="gi" viewBox="0 0 512 512">${(GI[k]||[]).map(d=>`<path d="${d}"/>`).join('')}</svg>`;
const disc = (k, cor, cls='disc') => `<span class="${cls}" style="--nc:${cor||COR_NO[k]||'#a0785a'}">${giSvg(k)}</span>`;
function gerarMapa(){
  const avail = Object.keys(PATHS).filter(k=>PATHS[k].from<=S.week && !PATHS[k].lab);
  const sorteia = evitar => {
    let ks = avail.filter(k=>!evitar.includes(k)); if(!ks.length) ks = avail;
    let r = Math.random()*ks.reduce((a,k)=>a+(PESO[k]||1),0);
    for(const k of ks){ if((r-=(PESO[k]||1))<0) return k; }
    return ks[0];
  };
  const tipos = [];
  for(let d=0; d<CFG.days-1; d++){ const row=[]; for(let l=0;l<LANES;l++) row.push(sorteia([...row, d?tipos[d-1][l]:null].filter(Boolean))); tipos.push(row); }
  const liga = [];
  for(let d=0; d<CFG.days-2; d++){
    const e = [...Array(LANES).keys()].map(l=>[l,l]);
    for(let l=0;l<LANES-1;l++) if(Math.random()<.38) e.push(Math.random()<.5?[l,l+1]:[l+1,l]);
    liga.push(e);
  }
  const forma = tipos.map(row=>row.map(k=>k==='caverna' ? pick(formasJogo()).id : null));
  return {tipos, liga, forma};
}
function opcoesHoje(){
  if(S.day>=CFG.days) return [];
  if(S.day===1 || S.lane==null) return [...Array(LANES).keys()];
  return [...new Set(S.mapa.liga[S.day-2].filter(([a])=>a===S.lane).map(([,b])=>b))];
}

function morning(resume=false){
  clearBoard(); S.phase='map'; S.isFiscal=false;
  if(!S.mapa){ S.mapa=gerarMapa(); S.trilha={}; S.lane=null; }
  show('scrMap'); trilha('mapa');
  setBanner(`Andar ${S.week}: ${andar().n}`, S.day===CFG.days ? 'dia do fiscal!' : `dia ${S.day} de ${CFG.days}`);
  render(); renderMap();
  if(S.tut===6){
    S.tut=7;
    const fim = ()=>{ S.tut=null; localStorage.mina_tut=1; saveGame(); };
    setTimeout(()=>coach('Seus <b>itens</b> ficam aqui; toque num para ver o que faz.', 'Entendi', ()=>{
      coach('Toda manhã, escolha <b>por onde cavar</b> seguindo as trilhas.', 'Entendi', ()=>{
        coach('No dia 5, o <b>fiscal</b> cobra a cota.', 'Entendi', ()=>{
          coach('Pague esta <b>cota</b> e desça de andar!', 'Bora!', fim, pillOf('#hQuota'));
        }, '.mnode.fiscal');
      }, '.mnode.opt');
    }, '#items'), 350);
    return;
  }
  saveGame();
  if(S.day===1 && !resume) weekIntro();
}

function fiscalCard(f){ return `<div class="card" style="cursor:default"><span class="em">${disc(f.id,COR_NO.fiscal,'discSm')}</span><div><b>${f.nome}</b><span>${f.desc}</span></div></div>`; }
function weekIntro(){
  const f=S.fiscal, novos=Object.keys(PATHS).filter(k=>PATHS[k].from===S.week && S.week>1);
  showOverlay(`${disc('entrada',null,'bigDisc')}<h2>Andar ${S.week}</h2><p class="andarNome">${andar().n}</p>
    <p>Cota: <b style="color:#c0603f">$${CFG.quota(S.week)}</b> no dia ${CFG.days}.</p>
    <div class="cards">${fiscalCard(f)}</div>
    ${novos.length?`<span class="novo">Caminho novo: ${novos.map(k=>PATHS[k].nome).join(', ')}</span>`:''}
    <button class="btn b" id="btnOk">Ver o mapa</button>`);
  $('#btnOk').onclick=hideOverlay;
}

const MX=[55,150,245], RH=92;
function renderMap(){
  const M=S.mapa, H=(CFG.days+1)*RH, Y=d=>H-(d+.5)*RH, opts=opcoesHoje();
  let lines='', nodes='';
  const line=(x1,y1,x2,y2,cls)=>{ lines+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`; };
  for(let l=0;l<LANES;l++) line(150,Y(0),MX[l],Y(1), S.trilha[1]===l?'taken':(S.day===1?'open':'idle'));
  for(let d=1; d<CFG.days-1; d++) for(const [a,b] of M.liga[d-1])
    line(MX[a],Y(d),MX[b],Y(d+1), S.trilha[d]===a&&S.trilha[d+1]===b ? 'taken' : (S.day===d+1&&S.lane===a ? 'open' : 'idle'));
  for(let l=0;l<LANES;l++) line(MX[l],Y(CFG.days-1),150,Y(CFG.days), S.trilha[CFG.days-1]===l ? (S.day===CFG.days?'open':'taken') : 'idle');
  const at=(x,y)=>`left:${x/3}%;top:${y}px`;
  nodes += `<div class="mnode entrada taken" style="${at(150,Y(0))}">${disc('entrada')}<small>entrada</small></div>`;
  for(let d=1; d<CFG.days; d++){
    nodes += `<span class="dl" style="top:${Y(d)}px">dia ${d}</span>`;
    for(let l=0;l<LANES;l++){
      const k=M.tipos[d-1][l];
      const st = d<S.day ? (S.trilha[d]===l?'taken':'gone') : d===S.day ? (opts.includes(l)?'opt':'blocked') : 'fut';
      const fm = k==='caverna' && M.forma ? acharForma(M.forma[d-1][l]) : null;
      nodes += `<button class="mnode ${st}" data-node="${d},${l}" style="${at(MX[l],Y(d))}" ${st==='opt'?'':'disabled'}>${disc(k)}<small>${fm?fm.nome:PATHS[k].nome}</small></button>`;
    }
  }
  const fst = S.day===CFG.days ? 'opt' : 'fut';
  nodes += `<span class="dl" style="top:${Y(CFG.days)}px">dia ${CFG.days}</span><button class="mnode fiscal ${fst}" data-node="fiscal" style="${at(150,Y(CFG.days))}" ${fst==='opt'?'':'disabled'}>${disc(S.fiscal.id,COR_NO.fiscal)}<small>Fiscal</small></button>`;
  $('#mapBody').style.height=H+'px';
  $('#mapBody').innerHTML=`<svg class="lines" viewBox="0 0 300 ${H}" preserveAspectRatio="none">${lines}</svg>${nodes}`;
  document.querySelectorAll('.mnode[data-node]').forEach(b=>b.onclick=()=>nodeInfo(b.dataset.node));
  setTimeout(()=>{ if(!S.tut) $('.mnode.opt')?.scrollIntoView({block:'center',behavior:'smooth'}); },60);
}

function nodeInfo(key){
  if(S.tut || overlayOpen()) return;
  if(key==='fiscal'){
    const f=S.fiscal, q=CFG.quota(S.week);
    showOverlay(`${disc(f.id,COR_NO.fiscal,'bigDisc')}<h2>Dia do fiscal</h2>
      <p>Cota: <b style="color:#c0603f">$${q}</b>. Você tem <b style="color:#c48a1e">$${S.money}</b>${S.money>=q?' (já dá!)':`, faltam $${q-S.money}`}.</p>
      <div class="cards">${fiscalCard(f)}</div>
      <p class="recAtual">${recTxt(RECS()[chaveJogo('fiscal')])}</p>
      <button class="btn" id="btnGo">Encarar o fiscal</button><button class="btn dim" id="btnNo">Voltar</button>`);
    $('#btnGo').onclick=()=>{ hideOverlay(); S.trilha[S.day]=S.lane; S.isFiscal=true; startDay(PATHS.comum); };
  } else {
    const [d,l]=key.split(',').map(Number), k=S.mapa.tipos[d-1][l], p=PATHS[k];
    const fm = k==='caverna' && S.mapa.forma ? acharForma(S.mapa.forma[d-1][l]) : null;
    showOverlay(`${fm?formaSvg(fm,150):disc(k,null,'bigDisc')}<h2>${fm?`${p.nome}: ${fm.nome}`:p.nome}</h2><p>${p.desc}</p>
      ${p.mine?`<p class="recAtual">${recTxt(RECS()[chaveJogo(k, fm?.id)])}</p>`:''}
      <button class="btn b" id="btnGo">${p.mine?'Cavar aqui':'Entrar'}</button><button class="btn dim" id="btnNo">Voltar</button>`);
    $('#btnGo').onclick=()=>{ hideOverlay(); choosePath(k,l); };
  }
  $('#btnNo').onclick=hideOverlay;
}

function choosePath(k, lane){
  const fid = k==='caverna' && S.mapa?.forma ? S.mapa.forma[S.day-1][lane] : null;
  const p = fid && acharForma(fid) ? {...PATHS[k], forma:acharForma(fid)} : PATHS[k]; S.path=p; S.hist[S.day]=k; S.trilha[S.day]=lane; S.lane=lane;
  if(p.mine) return startDay(p);
  if(k==='fogueira'){ S.bonus+=20; SFX.comprar(); toast(`${disc('fogueira',null,'bigDisc')}<p>Descansou! +20 de energia no próximo dia de mina.</p>`, ()=>openShop(nextDay)); }
}

function nextDay(){
  S.day++;
  if(S.day>CFG.days) return weekEnd();
  morning();
}

function toast(text, then){
  showOverlay(`<div style="font-size:17px;text-align:center">${text}</div><button class="btn b" id="btnOk">Seguir</button>`);
  $('#btnOk').onclick=()=>{ hideOverlay(); then&&then(); };
}

// ===================== DIA DE MINA =====================
function startDay(p, tutorial=false){
  clearBoard(); show('scrGame');
  S.path=p; S.phase='mine'; trilha(S.isFiscal?'fiscal':'mina'); S.tired=0; S.next=rollSpawn();
  const base = fiscalHoje('apressado') ? 25 : CFG.energy + (p.energy||0);
  const am = S.amanha||{}; S.amanha={}; S.pa = am.pa ? 3 : 0;
  S.semEnergia = !!p.semEnergia;
  const forma = p.forma || (p.caverna ? pick(formasJogo()) : null);
  S.forma = forma;
  setupBoard(forma ? fw(forma) : (p.w||p.n||4), forma ? fh(forma) : (p.h||p.n||4));
  if(S.semEnergia){ S.energy=999; S.energyMax=999; S.usedSaved=0; if(am.cafe) S.bonus+=10; }
  else {
    S.energy = tutorial ? 10 : base + 5*(S.up.folego||0) + S.saved + S.bonus + (am.cafe?10:0);
    S.energyMax = S.energy; S.usedSaved = tutorial ? 0 : S.saved+S.bonus; S.saved=0; S.bonus=0;
  }
  S.assovios = S.up.assovio||0; assovioBtn();
  $('#btnEdit').style.display = S.lab ? '' : 'none'; S.editando=false; $('#labTools').classList.add('hidden');
  humor();
  if(forma){
    forma.mapa.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch==='#') S.walls.push({x,y,v:true}); else if(ch==='B') S.walls.push({x,y}); }));
    S.edges = (forma.muretas||[]).map(([d,x,y])=>({d,x,y}));
  }
  if(p.walls){ const cells=shuffle([...Array(W*H).keys()].map(i=>({x:i%W,y:i/W|0})).filter(c=>!wallAt(c.x,c.y))); S.walls.push(...cells.slice(0,p.walls)); }
  S.walls.forEach((w,i)=>w.id='w'+i);
  if(p.edges){
    const all=[]; for(let y=0;y<H;y++) for(let x=0;x<W-1;x++) all.push({d:'v',x,y}); for(let y=0;y<H-1;y++) for(let x=0;x<W;x++) all.push({d:'h',x,y});
    S.edges = [...S.edges, ...shuffle(all.filter(e=>!wallAt(e.x,e.y) && !(e.d==='v'?wallAt(e.x+1,e.y):wallAt(e.x,e.y+1)) && !edgeBetween(e.x,e.y,e.d==='v'?e.x+1:e.x,e.d==='v'?e.y:e.y+1))).slice(0,p.edges)];
  }
  S.edges.forEach((e,i)=>e.id='e'+i);
  if(tutorial){
    S.tiles.push({id:'t'+(nextId++),x:0,y:1,t:1},{id:'t'+(nextId++),x:3,y:1,t:1}); S.next=1;
  } else {
    for(let i=0;i<(p.clods||0);i++) addTile(0);
    if(S.gift){ addTile(5); S.gift=false; }
    if(am.sorte) addTile(3);
    if(forma?.pecas?.length){ for(const [x,y,t,cc,k] of forma.pecas){ if(tileAt(x,y)||wallAt(x,y)) continue; const tl={id:'t'+(nextId++),x,y,t}; if(cc!=null) tl.c=cc; if(k) tl.k=k; S.tiles.push(tl); } }
    else { addTile(); addTile(); }
  }
  $('#mineRow').style.display=''; $('#revealRow').style.display='none';
  $('#btnEnd').classList.remove('hot'); resetEnd();
  setBanner(`Andar ${S.week} · dia ${S.day}`, S.isFiscal ? S.fiscal.nome : p.nome + (forma?`: ${forma.nome}`:'') + (S.usedSaved?` (+${S.usedSaved}⚡)`:''));
  render(); encaixa();
  if(tutorial) coach('Arraste <b>para o lado</b> para juntar as iguais. ↔', null, null, '#board');
}

function rollSpawn(){ return Math.random() < CFG.pedraChance + .12*(S.up?.picareta||0) + (S.path?.pedra||0) ? 2 : 1; }
function emptyCells(){ const out=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!tileAt(x,y) && !wallAt(x,y)) out.push({x,y}); return out; }
function addTile(t, dir){
  let free=emptyCells(); if(!free.length) return;
  if(dir && S.char==='passinho'){ const [dx,dy]=dir; const e=free.filter(c=>dx===1?c.x===0:dx===-1?c.x===W-1:dy===1?c.y===0:c.y===H-1); if(e.length) free=e; }
  const c=pick(free);
  if(t===undefined){
    if((S.energy<=0 && !S.missao) || (S.path?.torrao && Math.random()<S.path.torrao)) t=0;   // exausta (ou avalanche): torrão
    else { t=S.next; S.next=rollSpawn(); }
  }
  const tile={id:'t'+(nextId++), x:c.x, y:c.y, t};
  if(S.path?.picareta && t>0) tile.k = Math.random()<.5 ? 'p' : 'r';
  if(t>0 && tile.k!=='p' && Math.random() < (S.path?.rara ?? RARA)) tile.r=1;
  if(S.path?.cores && t>0) tile.c = Math.random()<.08 ? 2 : (Math.random()<.5 ? 0 : 1);
  S.tiles.push(tile);
}

// ===================== MOVIMENTO (2048 ou Threes, com paredes) =====================
function slideOne(tiles,dx,dy){
  const ts=tiles.map(t=>({...t,m:false}));
  const grid=Array.from({length:H},()=>Array(W).fill(null));
  for(const w of S.walls) grid[w.y][w.x]={wall:true};
  for(const t of ts) grid[t.y][t.x]=t;
  const ix=[...Array(W).keys()], iy=[...Array(H).keys()];
  const xs=dx===1?[...ix].reverse():ix, ys=dy===1?[...iy].reverse():iy;
  let moved=false; const merges=[], gone=[], breaks=[];
  for(const y of ys) for(const x of xs){
    const t=grid[y][x]; if(!t||t.wall) continue;
    const nx=x+dx, ny=y+dy; if(!inside(nx,ny) || edgeBetween(x,y,nx,ny)) continue;
    const o=grid[ny][nx];
    if(!o){ grid[y][x]=null; grid[ny][nx]=t; t.x=nx; t.y=ny; moved=true; }
    else if(!o.wall && !o.m && o.t===t.t && t.t>0 && corOk(o,t)){
      grid[y][x]=null; t.x=nx; t.y=ny; moved=true;
      if(o.k && t.k && o.k!==t.k){ grid[ny][nx]=null; gone.push(t,o); breaks.push({x:nx,y:ny,t:o.t,r:o.r||t.r}); }
      else { o.t++; o.c=corJunta(o,t); if(t.r) o.r=1; o.m=true; gone.push(t); merges.push(o); }
    }
  }
  return {tiles:ts.filter(t=>!gone.includes(t)).map(({m,...t})=>t), moved, merges, gone, breaks};
}
function slide(tiles,dx,dy){
  if(S.char==='passinho') return slideOne(tiles,dx,dy);
  const ts=tiles.map(t=>({...t,m:false}));
  const grid=Array.from({length:H},()=>Array(W).fill(null));
  for(const w of S.walls) grid[w.y][w.x]={wall:true};
  for(const t of ts) grid[t.y][t.x]=t;
  const ix=[...Array(W).keys()], iy=[...Array(H).keys()];
  const xs=dx===1?[...ix].reverse():ix, ys=dy===1?[...iy].reverse():iy;
  let moved=false; const merges=[], gone=[], breaks=[];
  for(const y of ys) for(const x of xs){
    const t=grid[y][x]; if(!t||t.wall) continue;
    let cx=x, cy=y, merged=false;
    while(true){
      const nx=cx+dx, ny=cy+dy; if(!inside(nx,ny) || edgeBetween(cx,cy,nx,ny)) break;
      const o=grid[ny][nx];
      if(!o){ grid[cy][cx]=null; grid[ny][nx]=t; cx=nx; cy=ny; continue; }
      if(!o.wall && !o.m && o.t===t.t && t.t>0 && corOk(o,t)){
        grid[cy][cx]=null; t.x=nx; t.y=ny; merged=true;
        if(o.k && t.k && o.k!==t.k){ grid[ny][nx]=null; gone.push(t,o); breaks.push({x:nx,y:ny,t:o.t,r:o.r||t.r}); }
        else { o.t++; o.c=corJunta(o,t); if(t.r) o.r=1; o.m=true; gone.push(t); merges.push(o); }
      }
      break;
    }
    if(merged){ moved=true; continue; }
    if(cx!==x||cy!==y){ t.x=cx; t.y=cy; moved=true; }
  }
  return {tiles:ts.filter(t=>!gone.includes(t)).map(({m,...t})=>t), moved, merges, gone, breaks};
}
const anyMove = () => DIRS.some(([dx,dy])=>slide(S.tiles,dx,dy).moved);

function move(dx,dy){
  if(!S || S.phase!=='mine' || overlayOpen() || coachBlock || S.editando || S.ferrAtiva || !$('#scrGame').classList.contains('on')) return;
  if(S.tut===1 && dy!==0){ coach('Para o <b>lado</b>! ↔', null, null, '#board'); return; }
  if(S.missao && !S.semEnergia && S.energy<=0) return; // acabaram os arrastos: a fase já vai terminar
  const r=slide(S.tiles,dx,dy);
  if(!r.moved) return;
  S.undoSnap = foto();
  for(const g of r.gone){ const el=els.get(g.id); els.delete(g.id); if(el){ el.style.zIndex=0; el.style.transform=pos(g.x,g.y); setTimeout(()=>el.remove(),120); } }
  for(const b of r.breaks) quebrar(b);
  S.tiles=r.tiles;
  if(S.missao) contaMissao(r);
  const wasTired = S.energy<=0;
  S.moves=(S.moves||0)+1;
  if(!S.semEnergia){ if(S.energy>0) S.energy--; else S.tired++; }
  humor();
  for(let i=0;i<(S.path.spawns||1);i++) addTile(undefined,[dx,dy]);
  render();
  SFX.arrastar();
  const tops=r.merges.map(o=>o.t).sort((a,b)=>b-a);
  if(tops.length){ SFX.fundir(tops[0]); if(tops.length>1) setTimeout(()=>SFX.fundir(tops[1]),45); S.stats.maxT=Math.max(S.stats.maxT,tops[0]); }
  if(S.missao) avisaMissao();
  else if(S.energy<=0) SFX.torraoCai(); else if(S.energy<=5) SFX.cansado();
  for(const o of r.merges) anim(o.id,'pop');
  if(has('coroa')){ const n=r.merges.filter(o=>o.t>=5).length; if(n){ const g=n*CORO[lvl('coroa')]; S.coroa+=g; renderItems(); fire('coroa','+×'+String(+g.toFixed(2)).replace('.',','),true); } }
  if(!wasTired && S.energy<=0 && !S.missao){
    setBanner(null,`Exausta! Só vem torrão`);
    $('#btnEnd').classList.add('hot');
  } else if(tops.length && tops[0]>=4) setBanner(null,`${rockName(tops[0])}!`);
  // tutorial
  if(S.tut===1 && tops.length){
    S.tut=2;
    const nova = els.get(r.merges[0].id);
    setTimeout(()=>coach('Juntou! Quanto <b>maior</b>, melhor o que ela guarda.', 'Entendi', ()=>{
      coach('Cada arrasto gasta <b>1 de energia</b>.', 'Bora', ()=>{
        S.tut=3; coach('Junte até a energia acabar!', null, null, pillOf('#hEnergy'));
      }, pillOf('#hEnergy'));
    }, nova), 350);
  } else if(S.tut===3 && S.energy<=0){
    S.tut=4; coach('Sem energia, só vem <b>torrão</b> 😠: toque para <b>encerrar o dia</b>.', null, null, '#btnEnd');
  }
  if(S.missao && !S.semEnergia && S.energy<=0){ setBanner(null,'acabaram os arrastos'); setTimeout(endDay,450); return; }
  if(!anyMove()){ setBanner(null,'não cabe mais nada'); setTimeout(endDay,450); }
}

// picareta encontrou a rocha do mesmo nível: extrai o minério na hora
function quebrar(b){
  const o=roll(b.t, b.r), ore=ORES[o], val=Math.round(ore.p*(1+.15*(S.up.balanca||0))*bonusNivel(b.t));
  S.extra=(S.extra||0)+val;
  const el=document.createElement('div'); el.className='tile'; el.style.transform=pos(b.x,b.y); el.style.zIndex=5;
  el.innerHTML=`<div class="face"><svg viewBox="0 0 100 100"><g class="spat">${oreSvg(o,50,50,1.6)}</g></svg></div><span class="price ${o?'':'zero'}">${o?'$'+val:'nada'}</span>`;
  board.appendChild(el); setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity=0; setTimeout(()=>el.remove(),400); }, 750);
  SFX.cuspe(); if(o>=1&&o<=3) SFX.comum(o>=3?2:1); if(o>=4){ SFX.raro(Math.min(6,o-1)); sparks(b,ore.c); shake(Math.min(3,o-3)); }
  setBanner(null, `extraído hoje: $${S.extra}`);
}

// Assovio: nasce uma pedrinha sem arrastar (passa a vez)
function assovioBtn(){
  const b=$('#btnAssovio'); if(!b) return;
  b.style.display = S && S.phase==='mine' && (S.up.assovio||0)>0 ? '' : 'none';
  b.textContent = `Assovio (${S.assovios>90?'∞':S.assovios})`; b.disabled = !S.assovios;
}
function assoviar(){
  if(!S || S.phase!=='mine' || overlayOpen() || coachBlock || S.editando || !S.assovios || !emptyCells().length) return;
  S.undoSnap = foto();
  if(S.assovios<90) S.assovios--;
  S.moves=(S.moves||0)+1;
  if(!S.semEnergia){ if(S.energy>0) S.energy--; else S.tired++; }
  humor(); addTile(); render(); assovioBtn();
  tone({f:880,to:1320,d:.12,v:.08,type:'triangle'}); tone({f:1320,to:1760,t:.13,d:.14,v:.07,type:'triangle'});
  if(!anyMove()){ setBanner(null,'não cabe mais nada'); setTimeout(endDay,450); }
}

// ===================== RECORDES =====================
// Pontuação de uma fase = quanto o dia rendeu. Recorde por fase:
// no laboratório, por combinação (fase, formato, energia, personagem e ajustes); no jogo, por caminho e formato.
const RECS = () => JSON.parse(localStorage.mina_recordes||'{}');
const chaveLab = () => 'lab|'+JSON.stringify({f:LAB.fase, e:LAB.energia, c:LAB.char, ...LAB.cfg, i:LAB.itens, u:LAB.ups});
function chaveJogo(k, forma){ return 'jogo|'+k+(forma?':'+forma:''); }
function chaveFase(){
  if(S.lab) return chaveLab();
  return chaveJogo(S.isFiscal ? 'fiscal' : (S.hist[S.day]||'?'), S.forma?.id);
}
function nomeLab(){
  const pre=presetDe(LAB.fase), g=LAB.cfg;
  const ajust = Object.keys(pre).some(k=>k!=='forma' && g[k]!==pre[k]) || g.ferr || (g.rara!=null && g.rara!==RARA);
  const nItens = Object.values(LAB.itens).filter(Boolean).length + Object.values(LAB.ups).filter(Boolean).length;
  const fm = g.forma ? acharForma(g.forma)?.nome : null;
  return `${PATHS[LAB.fase].nome}${fm?' · '+fm:''} · ${LAB.energia?'com':'sem'} energia · ${CHARS[LAB.char].nome}${ajust?' · ajustada':''}${nItens?` · ${nItens} itens`:''}`;
}
function nomeFase(){
  if(S.lab) return nomeLab();
  if(S.isFiscal) return 'Dia do fiscal';
  const k=S.hist[S.day]; return (PATHS[k]?.nome||k) + (S.forma?': '+S.forma.nome:'');
}
function recordeFim(){
  if(S.tut) return;
  if(S.missao) return missaoLinha();
  const k=chaveFase(), r=RECS(), ant=r[k];
  const novo = S.dayTotal>0 && (!ant || S.dayTotal>ant.total);
  if(novo){ r[k]={total:S.dayTotal, arrastos:S.moves||0, char:S.char, nome:nomeFase(), quando:Date.now()}; localStorage.mina_recordes=JSON.stringify(r); }
  $('#recLine').innerHTML = novo ? (ant ? `<b>Novo recorde!</b> antes: $${ant.total}` : '<b>Primeiro recorde desta fase!</b>') : ant ? `Recorde: $${ant.total}` : '';
  if(novo && ant){ popup('RECORDE!', '$'+S.dayTotal, '#f2b33d'); SFX.pagou(); }
}
const recTxt = e => e ? `Recorde: <b>$${e.total}</b> · ${e.arrastos} arrastos · ${CHARS[e.char]?.nome||''}` : 'Sem recorde ainda.';

// ===================== FERRAMENTAS =====================
const cp = a => a.map(o=>({...o}));
function foto(){ return {tiles:cp(S.tiles), walls:cp(S.walls), edges:cp(S.edges), energy:S.energy, tired:S.tired, moves:S.moves, extra:S.extra, coroa:S.coroa, assovios:S.assovios}; }
function redesenhaTudo(){ for(const el of els.values()) el.remove(); els.clear(); render(); }
function ferrBar(){
  const bar=$('#ferrBar'); if(!bar) return;
  if(!S || S.phase!=='mine' || S.editando){ bar.innerHTML=''; return; }
  bar.innerHTML = FERRAMENTAS.filter(f=>(S.ferr[f.id]||0)>0).map(f=>{ const n=S.ferr[f.id]; return `<button class="fb ${S.ferrAtiva===f.id?'on':''}" data-ferr="${f.id}" ${f.id==='desfazer'&&!S.undoSnap?'disabled':''}>${f.em} ${f.nome} <small>${n>90?'∞':n}</small></button>`; }).join('');
  bar.querySelectorAll('[data-ferr]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.ferr;
    if(id==='desfazer') return desfazer();
    S.ferrAtiva = S.ferrAtiva===id ? null : id; S.luvaSel=null;
    document.querySelectorAll('.tile.sel').forEach(el=>el.classList.remove('sel'));
    setBanner(null, S.ferrAtiva ? FERRAMENTAS.find(f=>f.id===id).dica : '');
    ferrBar();
  });
}
function gasta(id){ if((S.ferr[id]||0)<90) S.ferr[id]--; S.ferrAtiva=null; S.luvaSel=null; setBanner(null,''); SFX.item(false); }
function desfazer(){
  if(!S.undoSnap || !(S.ferr.desfazer>0)) return;
  Object.assign(S, S.undoSnap); S.undoSnap=null; gasta('desfazer');
  humor(); redesenhaTudo(); assovioBtn();
}
function usarFerramenta(cx,cy){
  const c=labCelula(cx,cy), id=S.ferrAtiva; if(!c) return;
  const [x,y]=c, t=tileAt(x,y), w=S.walls.find(v=>v.x===x&&v.y===y);
  const tira = (arr,o) => { els.get(o.id)?.remove(); els.delete(o.id); return arr.filter(v=>v!==o); };
  if(id==='picao'){
    if(w && !w.v){ S.walls=tira(S.walls,w); gasta(id); }
    else {
      const r=board.getBoundingClientRect(), cel=cellPx(), gap=(r.width-W*cel)/(W+1);
      const fx=(cx-r.left-gap/2)/(cel+gap)-x, fy=(cy-r.top-gap/2)/(cel+gap)-y;
      const lados=[[fx,'v',x-1,y],[1-fx,'v',x,y],[fy,'h',x,y-1],[1-fy,'h',x,y]].sort((a,b)=>a[0]-b[0]);
      const e=lados.map(([,d,ex,ey])=>S.edges.find(q=>q.d===d&&q.x===ex&&q.y===ey)).find(Boolean);
      if(e){ S.edges=tira(S.edges,e); gasta(id); }
    }
  } else if(id==='escavar'){
    if(w && w.v){ S.walls=S.walls.filter(v=>v!==w); gasta(id); }
  } else if(id==='dinamite'){
    if(t){ const el=els.get(t.id); els.delete(t.id); if(el){ el.firstChild.classList.add('crumble'); setTimeout(()=>el.remove(),450); } S.tiles=S.tiles.filter(v=>v!==t); SFX.esfarelar(); shake(1); gasta(id); }
  } else if(id==='luva'){
    if(t){ S.luvaSel=t.id; document.querySelectorAll('.tile.sel').forEach(el=>el.classList.remove('sel')); els.get(t.id)?.classList.add('sel'); return; }
    const sel=S.tiles.find(v=>v.id===S.luvaSel);
    if(sel && !w){ els.get(sel.id)?.classList.remove('sel'); sel.x=x; sel.y=y; gasta(id); }
  }
  render();
}

// ===================== FIM DO DIA: CUSPE + EQUIPAMENTO =====================
function roll(t, rara){
  const nv=Math.min(t+(rara?2:0),14);
  const once=()=>{ const tb=DROPS[nv]; let r=Math.random()*100; for(let i=0;i<tb.length;i++){ if((r-=tb[i])<0) return i; } return 0; };
  let b=once(); for(let i=0;i<(S.up.martelo||0);i++) b=Math.max(b,once()); return b;
}
function tag(t, text, cls){ const el=els.get(t.id); if(!el) return; const p=document.createElement('span'); p.className='price '+cls; p.textContent=text; el.appendChild(p); }
const adjWall = t => DIRS.some(([dx,dy])=>wallAt(t.x+dx,t.y+dy) || edgeBetween(t.x,t.y,t.x+dx,t.y+dy));
const adjBig = t => DIRS.some(([dx,dy])=>{ const o=tileAt(t.x+dx,t.y+dy); return o && o.t>=3; });
const fmtMult = m => '×'+(Math.round(m*100)/100).toString().replace('.',',');

// fileiras (só com a Régua): 3 ou mais pedrinhas iguais seguidas numa linha ou coluna
function fileiras(){
  const out=[], T=(x,y)=>{ const t=tileAt(x,y); return t&&t.t>0?t:null; };
  for(const horiz of [true,false]) for(let a=0;a<(horiz?H:W);a++){
    let run=[]; const L=horiz?W:H;
    for(let b=0;b<=L;b++){
      const t = b<L ? (horiz?T(b,a):T(a,b)) : null;
      if(t && run.length && run[0].t===t.t) run.push(t);
      else { if(run.length>=3) out.push(run); run = t?[t]:[]; }
    }
  }
  return out;
}
function showCalc(){
  const parts=[`<b>$${S.gain}</b>`];
  if(S.mult!==1) parts.push(fmtMult(S.mult).replace('×','× '));
  if(S.cost) parts.push(`<i>-$${S.cost}</i>`);
  $('#calc').innerHTML=parts.join(' ');
}

async function endDay(){
  if(S.phase!=='mine') return;
  if(S.tut===4 || S.tut===3){ S.tut=5; hideCoach(); }
  $('#btnAssovio').style.display='none';
  S.ferrAtiva=null; S.undoSnap=null;
  S.turbo=false; $('#btnFast').style.display='';
  S.phase='reveal'; S.skip=false; S.gain=S.extra||0; S.cost=0; S.mult=1; S.shown=0; S.found=[]; S.clods=0;
  const sobra = Math.max(0,S.energy);
  if(!S.semEnergia && !S.missao) S.saved = S.tut ? 0 : Math.min(CFG.guardaMax, sobra);
  $('#mineRow').style.display='none'; $('#revealRow').style.display='flex';
  $('#btnSkip').style.display=''; $('#btnSell').style.display='none'; requestAnimationFrame(mostraFim);
  $('#dayTotal').textContent='$0'; $('#dayTotal').classList.remove('neg'); showCalc(); $('#recLine').textContent='';
  setBanner(S.missao?`Fase ${S.missao}`:`Fim do dia ${S.day}`, S.saved ? `hora de cuspir! (+${S.saved}⚡ guardada)` : 'hora de cuspir!');
  render(); SFX.fimDia(); abaixar(true); await sleep(700);

  const custo = S.semEnergia ? 0 : custoTorrao();
  const maior = [...S.tiles].filter(t=>t.t>0).sort((a,b)=>b.t-a.t)[0];
  let cuspiram=0;
  const order=[...S.tiles].sort((a,b)=>a.t-b.t);
  const vel = Math.max(.2, Math.min(1, 10/Math.max(1,order.length)));
  const sl = ms => sleep(ms*vel*(S.turbo?.25:1));
  for(const t of order){
    const face=els.get(t.id)?.firstChild; if(!face) continue;
    face.classList.remove('idle');
    if(S.path.picareta && t.t>0){ face.classList.add('crumble'); tag(t,'nada','zero'); await sl(90); continue; }
    if(t.t===0){
      face.classList.add('wob'); await sl(200);
      face.classList.remove('wob'); face.classList.add('crumble'); SFX.esfarelar(); S.clods++;
      if(has('adubo') && adjBig(t)){ const v=lvl('adubo')*S.week; S.gain+=v; tag(t,'+$'+v,''); fire('adubo','+$'+v); }
      else if(!custo){ }
      else if(S.pa>0){ S.pa--; tag(t,'pá','zero'); }
      else { S.cost+=custo; tag(t,`-$${custo}`,'neg'); }
      showCalc(); countTo(Math.round(S.gain*S.mult)-S.cost); await sl(220);
      continue;
    }
    face.innerHTML=svgOf(pedraInner(t.t,{face:['squeeze','puff'],blushBig:true}));
    face.classList.add('wob');
    await sl(t.t>=5?850:t.t>=3?420:240);
    face.classList.remove('wob');
    let nivel=t.t;
    if(has('eco') && adjWall(t)){ nivel+=lvl('eco'); fire('eco','+'+lvl('eco')+' nível'); }
    let o=roll(nivel, t.r);
    { const L=lvl('peneira'); if(L && (t.t===1 || (t.t===2&&L>=2))){ const min=L>=3?3:2; if(o<min){ o=min; fire('peneira',ORES[min].n+'!'); } } }
    if(fiscalHoje('miope') && t.t<=2) o=0;
    t.ore=o; S.found.push(o);
    const ore=ORES[o];
    let val=Math.round(ore.p*(1+.15*(S.up.balanca||0))*bonusNivel(t.t));
    if(has('rochedo') && (t.t===3||t.t===4) && val>0){ val*=1+lvl('rochedo'); fire('rochedo','×'+(1+lvl('rochedo')),true); }
    if(has('lupa') && t===maior && val>0){ val*=1+lvl('lupa'); fire('lupa','×'+(1+lvl('lupa')),true); }
    if(o>0) cuspiram++;
    const body=`<g transform="translate(36 66) scale(.72) translate(-50 -58)">${pedraInner(t.t,o?{face:['happy','open']}:{face:['dot','wavy'],sweat:true})}</g>`;
    const spat=`<g class="spat">${oreSvg(o,70,34,1.25)}</g>`;
    face.innerHTML=svgOf(body+spat);
    SFX.cuspe();
    S.gain+=val; showCalc(); countTo(Math.round(S.gain*S.mult)-S.cost);
    tag(t, o?`$${val}`:'nada', o?'':'zero');
    if(!S.skip){
      if(o>=1 && o<=3) SFX.comum(o>=3?2:1);
      if(o>=4){
        shake(Math.min(3,o-3)); sparks(t, ore.c); popup(ore.n.toUpperCase()+'!', '+$'+val, ore.c); SFX.raro(Math.min(6,o-1));
        await sl(o>=5?1000:650);
      } else await sl(160);
    }
  }
  // bônus do equipamento, um de cada vez
  const bonus = [];
  if(has('vaquinha') && cuspiram) bonus.push(['vaquinha', cuspiram*lvl('vaquinha')]);
  if(has('horaextra') && S.tired) bonus.push(['horaextra', S.tired*lvl('horaextra')]);
  if(has('musgo')){ const occ=(x,y)=>{ const o=tileAt(x,y); return o && o.t>0; };
    const n=S.walls.filter(w=>DIRS.some(([dx,dy])=>occ(w.x+dx,w.y+dy))).length + S.edges.filter(e=>occ(e.x,e.y)||(e.d==='v'?occ(e.x+1,e.y):occ(e.x,e.y+1))).length;
    if(n) bonus.push(['musgo', 2*n*lvl('musgo')*S.week]); }
  if(has('cascalheira')){ const n=S.tiles.filter(t=>t.t===1).length; if(n) bonus.push(['cascalheira', n*lvl('cascalheira')*S.week]); }
  if(has('pedreira')){ const n=S.tiles.filter(t=>t.t===2).length; if(n) bonus.push(['pedreira', 2*n*lvl('pedreira')*S.week]); }
  for(const [id,v] of bonus){ await sl(380); S.gain+=v; fire(id,'+$'+v); showCalc(); countTo(Math.round(S.gain*S.mult)-S.cost); }
  // multiplicadores
  if(!fiscalHoje('paoduro')){
    if(has('regua')) for(const ln of fileiras()){
      await sl(350);
      const g=(ln.length>=4?.5:.25)*lvl('regua');
      S.mult+=g;
      ln.forEach(t=>els.get(t.id)?.classList.add('line'));
      popup(`Fileira de ${ROCKS[ln[0].t].n}!`, '+'+fmtMult(g), '#6aa84f');
      fire('regua','+'+fmtMult(g),true);
      showCalc(); countTo(Math.round(S.gain*S.mult)-S.cost);
      await sl(650);
    }
    const mults=[];
    if(S.path.narrow) mults.push([null,2]);
    if(has('coroa') && S.coroa) mults.push(['coroa', 1+S.coroa]);
    for(const [id,m] of mults){ await sl(450); S.mult*=m; if(id) fire(id,fmtMult(m),true); else popup('×2','galeria estreita','#7a59a8'); SFX.raro(3); showCalc(); countTo(Math.round(S.gain*S.mult)-S.cost); }
  }
  S.dayTotal = Math.round(S.gain*S.mult) - S.cost;
  S.skip=true; countTo(S.dayTotal); S.skip=false;
  setBanner(S.missao?`Fase ${S.missao}`:`Fim do dia ${S.day}`, S.dayTotal>0 ? `rendeu ${fmt(S.dayTotal)}` : S.dayTotal<0 ? 'a terra deu prejuízo...' : 'dia fraco...');
  $('#btnSkip').style.display='none'; $('#btnFast').style.display='none'; $('#btnSell').style.display='';
  mostraFim();
  $('#btnSell').textContent = S.dayTotal>=0 ? `Vender ${fmt(S.dayTotal)}` : `Pagar a limpeza (${fmt(S.dayTotal)})`;
  recordeFim();
  if(S.tut===5) coach('<b>Ptui!</b> Pedrinha cospe minério, torrão custa.', 'Legal!', ()=>{
    coach('Toque em <b>Vender</b> para embolsar!', null, null, '#revealRow');
  }, '#board');
}
const fmt = v => (v<0?'-$':'$')+Math.abs(v);

function sell(){
  abaixar(false);
  S.money=Math.max(0,S.money+S.dayTotal); S.stats.days++; S.stats.best=Math.max(S.stats.best,S.dayTotal); render();
  if(S.dayTotal>0) SFX.venda(); else SFX.esfarelar();
  if(S.missao) return missaoFim();
  if(S.lab) return labFim();
  if(S.isFiscal) return weekEnd();
  if(S.tut===5){ S.tut=6; coach('Escolha um <b>item</b> para render mais!', null, null, 'top'); }
  itemPick(S.path.picks||3, ()=>openShop(nextDay), 'Escolha um item');
}

// ===================== ITENS =====================
function itemCard(it, extra='', L=1){
  const up = L>1 ? ` <span class="est" style="background:#c48a1e">nível ${L}</span>` : '';
  return `<span class="em">${it.em}</span><div><b>${it.nome}</b><span>${lvDesc(it.id,L)}</span><span class="est" style="background:${EST_COR[it.est]}">${it.est}</span>${up}</div>${extra}`;
}
function itemPick(n, then, title){
  const pool = shuffle(ITEMS.filter(i=>lvl(i.id)<CFG.maxNivel)).slice(0,n);
  if(!pool.length){ return then(); }
  showOverlay(`<h2>${title}</h2><div class="cards">${pool.map(i=>`<button class="card" data-pick="${i.id}">${itemCard(i,'',lvl(i.id)+1)}</button>`).join('')}</div>
    ${S.tut?'':`<button class="btn dim" id="btnPass">Pular (+$${pularItem()})</button>`}`);
  document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{ S.lv[b.dataset.pick]=lvl(b.dataset.pick)+1; SFX.comprar(); hideOverlay(); renderItems(); then(); });
  if(!S.tut) $('#btnPass').onclick=()=>{ S.money+=pularItem(); hideOverlay(); render(); then(); };
}
let shopItens=[];
function openShop(then, first=true){
  if(first){ shopItens = shuffle(ITEMS.filter(i=>lvl(i.id)<CFG.maxNivel)).slice(0,2).map(i=>i.id); trilha('mercador'); }
  const esc=escalaPreco(), am=S.amanha||(S.amanha={});
  const preco = n => Math.max(1,Math.round(n*esc));
  const row = (attrs, em, nome, desc, pr, off, extra='') => `<button class="card" ${attrs} ${off?'disabled':''}><span class="em">${em}</span><div><b>${nome}</b><span>${desc}</span>${extra}</div><span class="pr">${pr}</span></button>`;
  const ups = UPGRADES.map(u=>{ const l=S.up[u.id]||0, max=u.max&&l>=u.max, pr=preco(u.preco(l));
    return row(`data-up="${u.id}"`, u.em, `${u.nome}${l?` <small class="nv">nível ${l}</small>`:''}`, u.desc(l+1), max?'máx':'$'+pr, max||S.money<pr); }).join('');
  const cons = CONSUMIVEIS.map(c=>{ const pr=preco(c.preco), tem=am[c.id];
    return row(`data-con="${c.id}"`, c.em, noIco(c.nome), c.desc, tem?'ok!':'$'+pr, tem||S.money<pr); }).join('');
  const its = shopItens.filter(id=>lvl(id)<CFG.maxNivel).map(item).map(i=>{ const pr=precoItem(i,lvl(i.id));
    return `<button class="card" data-buy="${i.id}" ${S.money<pr?'disabled':''}>${itemCard(i,`<span class="pr">$${pr}</span>`,lvl(i.id)+1)}</button>`; }).join('');
  const ferrs = FERRAMENTAS.map(f=>{ const pr=preco(f.preco), tem=S.ferr[f.id]||0; return row(`data-fer="${f.id}"`, f.em, `${f.nome}${tem?` <small class="nv">tem ${tem}</small>`:''}`, f.desc, '$'+pr, S.money<pr); }).join('');
  const renovar = preco(3);
  showOverlay(`<div class="bigEm">🏪</div><h2>Lojinha</h2>
    <p>Você tem <b style="color:#c48a1e">$${S.money}</b> · cota: <b style="color:#c0603f">$${CFG.quota(S.week)}</b> no dia ${CFG.days}</p>
    <h3>Melhorias (para sempre)</h3><div class="cards">${ups}</div>
    <h3>Para o próximo dia</h3><div class="cards">${cons}</div>
    <h3>Ferramentas (ficam com você)</h3><div class="cards">${ferrs}</div>
    <h3>Itens</h3><div class="cards">${its||'<p>Sem itens agora.</p>'}</div>
    <button class="btn dim" id="btnReroll" ${S.money<renovar?'disabled':''}>Renovar itens ($${renovar})</button>
    <button class="btn b" id="btnLeave">Seguir</button>`);
  const again = () => { SFX.comprar(); render(); renderItems(); openShop(then,false); };
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{ const u=UPGRADES.find(x=>x.id===b.dataset.up), l=S.up[u.id]||0, pr=preco(u.preco(l)); if(S.money<pr) return; S.money-=pr; S.up[u.id]=l+1; again(); });
  document.querySelectorAll('[data-fer]').forEach(b=>b.onclick=()=>{ const f=FERRAMENTAS.find(x=>x.id===b.dataset.fer), pr=preco(f.preco); if(S.money<pr) return; S.money-=pr; S.ferr[f.id]=(S.ferr[f.id]||0)+1; again(); });
  document.querySelectorAll('[data-con]').forEach(b=>b.onclick=()=>{ const c=CONSUMIVEIS.find(x=>x.id===b.dataset.con), pr=preco(c.preco); if(S.money<pr) return; S.money-=pr; am[c.id]=1; again(); });
  document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const i=item(b.dataset.buy), pr=precoItem(i,lvl(i.id)); if(S.money<pr) return; S.money-=pr; S.lv[i.id]=lvl(i.id)+1; again(); });
  $('#btnReroll').onclick=()=>{ if(S.money<renovar) return; S.money-=renovar; shopItens = shuffle(ITEMS.filter(i=>lvl(i.id)<CFG.maxNivel)).slice(0,2).map(i=>i.id); again(); };
  $('#btnLeave').onclick=()=>{ hideOverlay(); if(S.tut===6) hideCoach(); then(); };
  if(S.tut===6 && first) coach('Compre o que der na <b>lojinha</b> e toque em <b>Seguir</b>.', null, null, 'top');
}
let shopStock=[];
function showMerchant(first=true){
  if(first){ trilha('mercador'); }
  if(first) shopStock = shuffle(ITEMS.filter(i=>lvl(i.id)<CFG.maxNivel)).slice(0,4).map(i=>i.id);
  const stock = shopStock.filter(id=>lvl(id)<CFG.maxNivel).map(item);
  showOverlay(`<div class="bigEm">🛒</div><h2>Mercador</h2><p>Você tem <b style="color:#c48a1e">$${S.money}</b>. Cota da semana: <b style="color:#c0603f">$${CFG.quota(S.week)}</b>.</p>
    <div class="cards">${stock.map(i=>`<button class="card" data-buy="${i.id}" ${S.money<precoItem(i,lvl(i.id))?'disabled':''}>${itemCard(i,`<span class="pr">$${precoItem(i,lvl(i.id))}</span>`,lvl(i.id)+1)}</button>`).join('') || '<p>Acabou o estoque.</p>'}</div>
    <button class="btn b" id="btnLeave">Seguir viagem</button>`);
  document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const i=item(b.dataset.buy), pr=precoItem(i,lvl(i.id)); if(S.money<pr) return; S.money-=pr; S.lv[i.id]=lvl(i.id)+1; SFX.comprar(); render(); renderItems(); showMerchant(false); });
  $('#btnLeave').onclick=()=>{ hideOverlay(); nextDay(); };
}
function showItemInfo(id){
  if(S.phase==='reveal' || overlayOpen() || S.tut) return;
  const i=item(id);
  showOverlay(`<div class="cards"><div class="card" style="cursor:default">${itemCard(i,'',lvl(id))}</div></div>${id==='coroa'?`<p>Agora: ${fmtMult(1+S.coroa)}</p>`:''}<button class="btn b" id="btnOk">Ok</button>`);
  $('#btnOk').onclick=hideOverlay;
}
function fire(id, text, isMult){
  const c=document.querySelector(`.chip[data-item="${id}"]`); if(!c) return;
  c.classList.remove('fire'); void c.offsetWidth; c.classList.add('fire');
  const f=document.createElement('span'); f.className='chipfloat'+(isMult?' mult':''); f.textContent=text; c.appendChild(f); setTimeout(()=>f.remove(),1100);
  SFX.item(isMult);
}

// ===================== FIM DA SEMANA E DA PARTIDA =====================
function weekEnd(){
  const q=CFG.quota(S.week), paid=S.money>=q;
  if(paid){
    S.money-=q; S.fails=0; SFX.pagou();
    localStorage.mina_best = Math.max(+(localStorage.mina_best||0), S.week+1);
    showOverlay(`<div class="bigEm">🎉</div><h2 style="color:#6aa84f">Cota paga!</h2><p>Pagou $${q}, sobrou $${S.money}.</p>
      <p>Prêmio: um <b style="color:#7a59a8">Geodo</b> e um item extra.</p>
      <button class="btn b" id="btnWeek">Descer para o andar ${S.week+1}</button>`);
    $('#btnWeek').onclick=()=>{ hideOverlay(); S.week++; S.gift=true; itemPick(4, startWeek, 'Item de presente'); };
  } else {
    S.fails=(S.fails||0)+1; SFX.naoDeu();
    if(S.fails>=2) return gameOver(q);
    showOverlay(`<div class="bigEm">😰</div><h2 style="color:#c0603f">Não deu...</h2><p>Faltaram $${q-S.money} de $${q}.</p>
      <p>Você perde o dinheiro e repete o andar ${S.week}. <b>Última chance!</b></p>
      <button class="btn b" id="btnWeek">Tentar de novo</button>`);
    S.money=0;
    $('#btnWeek').onclick=()=>{ hideOverlay(); startWeek(); };
  }
}
function gameOver(q){
  localStorage.removeItem('mina_save'); trilha('fim');
  localStorage.mina_best = Math.max(+(localStorage.mina_best||0), S.week);
  const st=S.stats;
  showOverlay(`<div class="bigEm">🪦</div><h2>Fim da partida</h2><p>O fiscal não perdoou.</p>
    <div class="statsBox">
      <div><b>${S.week}</b><span>andar (${andar().n})</span></div>
      <div><b>${st.days}</b><span>dias minerados</span></div>
      <div><b>${st.maxT?rockName(st.maxT):'-'}</b><span>maior pedrinha</span></div>
      <div><b>$${st.best}</b><span>melhor dia</span></div>
    </div>
    <p>Recorde: andar ${localStorage.mina_best}</p>
    <button class="btn b" id="btnMenu">Voltar ao menu</button>`);
  $('#btnMenu').onclick=()=>{ hideOverlay(); showMenu(); };
}

// desenho pequeno de um formato (casas, buracos, blocos e muretas)
function formaSvg(f, px=120){
  const w=fw(f), h=fh(f), u=100/Math.max(w,h), ox=(100-w*u)/2, oy=(100-h*u)/2; let g='';
  f.mapa.forEach((row,y)=>[...row].forEach((ch,x)=>{
    if(ch==='#') return;
    g+=`<rect x="${ox+x*u+u*.08}" y="${oy+y*u+u*.08}" width="${u*.84}" height="${u*.84}" rx="${u*.2}" fill="${ch==='B'?'#6b625a':'#dcc7a2'}" stroke="#2e2219" stroke-width="${ch==='B'?1.4:0}"/>`;
  }));
  for(const [d,x,y] of (f.muretas||[])) g += d==='v' ? `<rect x="${ox+(x+1)*u-2}" y="${oy+y*u+u*.1}" width="4" height="${u*.8}" rx="2" fill="#f2b33d"/>` : `<rect x="${ox+x*u+u*.1}" y="${oy+(y+1)*u-2}" width="${u*.76}" height="4" rx="2" fill="#f2b33d"/>`;
  return `<svg class="formaSvg" viewBox="-3 -3 106 106" style="width:${px}px;height:${px}px"><rect x="-3" y="-3" width="106" height="106" rx="12" fill="#3a2c22"/>${g}</svg>`;
}

// ===================== LABORATÓRIO =====================
// Página de testes: escolhe a fase, ajusta os parâmetros, joga um dia isolado e compara. Dá para editar o tabuleiro.
const LAB_FASES = ['comum','caverna','rico','galeria','corredor','estreita','desmoronamento','avalanche','cores','salao','picareta'];
const presetDe = k => { const p=PATHS[k]; return {forma:null, w:p.n||4, h:p.n||4, energia:CFG.energy+(p.energy||0), spawns:p.spawns||1, torrao:p.torrao||0, pedra:p.pedra||0, cores:!!p.cores, picareta:!!p.picareta, walls:p.walls||0, edges:p.edges||0, clods:p.clods||0}; };
let LAB = JSON.parse(localStorage.mina_lab||'null') || {fase:'comum', energia:true, char:'rola', hist:[]};
if(!LAB.cfg) LAB.cfg = presetDe(LAB.fase);
if(LAB.cfg.w==null){ LAB.cfg.w=LAB.cfg.n||4; LAB.cfg.h=LAB.cfg.n||4; }
LAB.itens = LAB.itens || {}; LAB.ups = LAB.ups || {assovio:LAB.cfg.assovio||0}; LAB.abertos = LAB.abertos || {};
function labSalva(){ localStorage.mina_lab=JSON.stringify(LAB); }
const LAB_AJUSTES = [
  {k:'forma',   nome:'Formato',              ops:()=>[null,...formasTodas().map(f=>f.id)], fmt:v=>v?acharForma(v)?.nome||v:'quadrado'},
  {k:'w',       nome:'Largura',              ops:[3,4,5,6,7,8],        fmt:v=>v, sem:'forma'},
  {k:'h',       nome:'Altura',               ops:[3,4,5,6,7,8,10,12,16,20], fmt:v=>v, sem:'forma'},
  {k:'energia', nome:'Energia',              ops:[10,20,30,40,60,80],  fmt:v=>v, so:'energia'},
  {k:'spawns',  nome:'Pedrinhas por arrasto',ops:[1,2,3],              fmt:v=>v},
  {k:'torrao',  nome:'Torrão ao nascer',     ops:[0,.1,.2,.3],         fmt:v=>Math.round(v*100)+'%'},
  {k:'pedra',   nome:'Pedra a mais',         ops:[0,.2,.4,.6],         fmt:v=>'+'+Math.round(v*100)+'%'},
  {k:'cores',   nome:'Duas cores',           ops:[false,true],         fmt:v=>v?'sim':'não'},
  {k:'picareta',nome:'Picareta',             ops:[false,true],         fmt:v=>v?'sim':'não'},
  {k:'walls',   nome:'Paredes',              ops:[0,1,2,3,4],          fmt:v=>v},
  {k:'edges',   nome:'Muretas',              ops:[0,2,4,6,8],          fmt:v=>v},
  {k:'clods',   nome:'Torrões no começo',    ops:[0,3,6],              fmt:v=>v},
  {k:'assovio', nome:'Assovio por dia',      ops:[0,1,2,3,99],         fmt:v=>v>90?'∞':v},
  {k:'ferr',    nome:'Ferramentas',          ops:[0,99],               fmt:v=>v?'∞':'nenhuma'},
  {k:'rara',    nome:'Pedrinha rara',        ops:[0,.02,.1,.5],        fmt:v=>Math.round(v*100)+'%'},
];
function labPainel(){
  VEIO_DO_EDITOR=false; EDIT=null;
  hideCoach(); show('scrMap'); trilha('menu');
  S = {...freshState(), lab:true, char:LAB.char, week:1};
  S.fiscal=FISCAIS[0]; applyAndar(); clearBoard(); render();
  $('#mapBody').innerHTML=''; $('#mapBody').style.height='0px';
  setBanner('Laboratório','');
  const g=LAB.cfg;
  const selHtml=(attr,ops,val,fmt)=>`<select class="labSel" ${attr}>${ops.map(o=>`<option value='${JSON.stringify(o)}' ${JSON.stringify(o)===JSON.stringify(val)?'selected':''}>${fmt(o)}</option>`).join('')}</select>`;
  const campo=(nome,ctrl,ajuda='')=>`<div class="campo"><div><b>${nome}</b>${ajuda?`<small>${ajuda}</small>`:''}</div>${ctrl}</div>`;
  const cfgSel=(k,ops,fmt)=>selHtml(`data-cfg="${k}"`,ops,g[k],fmt);
  const sn=(k)=>`<div class="sn"><button class="chipOp ${!g[k]?'sel':''}" data-cfgv="${k}" data-v="false">não</button><button class="chipOp ${g[k]?'sel':''}" data-cfgv="${k}" data-v="true">sim</button></div>`;
  const pct=v=>Math.round(v*100)+'%';
  const sec=(id,titulo,html,valor='')=>`<details class="sec" data-sec="${id}" ${(LAB.abertos[id]??id==='tipo')?'open':''}><summary>${titulo}${valor?`<small class="secVal">${valor}</small>`:''}</summary><div class="secBody">${html}</div></details>`;
  const minhas = JSON.parse(localStorage.mina_formas||'[]');
  const recs = Object.entries(RECS()).sort((a,b)=>b[1].total-a[1].total).slice(0,12).map(([k,e])=>`<li>${k.startsWith('jogo|')?'<small class="nv">jogo</small> ':''}${e.nome}: <b>$${e.total}</b> <small>(${e.arrastos} arrastos, ${CHARS[e.char]?.nome||''})</small></li>`).join('');
  const hist = LAB.hist.slice(-8).reverse().map(h=>`<li><b>${PATHS[h.fase]?.nome||h.fase}</b> · ${h.energia?'com':'sem'} energia · ${CHARS[h.char].nome}: ${h.arrastos} arrastos, <b>$${h.total}</b></li>`).join('');

  const tabuleiro = campo('Formato', selHtml('data-cfg="forma"', [null,...formasTodas().map(f=>f.id)], g.forma, v=>v?acharForma(v)?.nome||v:'livre (largura x altura)'), 'Formatos prontos já têm buracos, paredes e muretas.')
    + (g.forma ? `<div class="formaPrev">${formaSvg(acharForma(g.forma)||{mapa:['.']},110)}</div>` :
       campo('Largura', cfgSel('w',[3,4,5,6,7,8],v=>v+' casas')) + campo('Altura', cfgSel('h',[3,4,5,6,7,8,10,12,16,20],v=>v+' casas')))
    + `<button class="btn g" id="labBuild">Construir nível (tela vazia ${g.w}x${g.h})</button>`
    + (minhas.length?`<b class="sub">Seus níveis</b><div class="cards">${minhas.map(f=>`<div class="card" style="cursor:default"><span class="em">${formaSvg(f,40)}</span><div><b>${f.nome}</b><span>${fw(f)}x${fh(f)}${f.pecas?.length?`, ${f.pecas.length} pedrinhas`:''}</span></div><button class="pt" data-delf="${f.id}">apagar</button></div>`).join('')}</div>`:'');
  const regras = campo('Energia', `<div class="sn"><button class="chipOp ${LAB.energia?'sel':''}" data-en="1">ligada</button><button class="chipOp ${!LAB.energia?'sel':''}" data-en="0">desligada</button></div>`, 'Ligada: cada arrasto gasta 1 e, sem energia, só nasce torrão. Desligada: joga até travar.')
    + (LAB.energia ? campo('Energia por dia', cfgSel('energia',[10,20,30,40,60,80],v=>v)) : '')
    + campo('Pedrinhas por arrasto', cfgSel('spawns',[1,2,3],v=>v), 'Quantas nascem a cada arrasto.')
    + campo('Torrão ao nascer', cfgSel('torrao',[0,.1,.2,.3],pct), 'Chance de a peça nova ser torrão.')
    + campo('Pedra a mais', cfgSel('pedra',[0,.2,.4,.6],v=>'+'+pct(v)), 'Chance extra de nascer Pedra em vez de Cascalho.')
    + campo('Pedrinha rara', cfgSel('rara',[0,.02,.1,.5],pct), 'Rara cospe como 2 níveis acima.')
    + campo('Duas cores', sn('cores'), 'Roxa só junta com roxa, verde com verde.')
    + campo('Picareta', sn('picareta'), 'Nascem picaretas, que quebram a pedrinha do mesmo nível.');
  const obst = campo('Paredes', cfgSel('walls',[0,1,2,3,4],v=>v), 'Blocos sorteados que ocupam casas.')
    + campo('Muretas', cfgSel('edges',[0,2,4,6,8],v=>v), 'Paredes finas sorteadas entre casas.')
    + campo('Torrões no começo', cfgSel('clods',[0,3,6],v=>v));
  const nivelSel=(attr,max,val,inf=false)=>selHtml(attr,[...Array(max+1).keys()].concat(inf?[99]:[]),val||0,v=>v>90?'∞':v?('nível '+v):'não');
  const itens = `<p class="ajuda">Escolha com o que o dia começa.</p><b class="sub">Itens</b>`
    + ITEMS.map(it=>campo(`${it.em} ${it.nome}`, nivelSel(`data-item="${it.id}"`,3,LAB.itens[it.id]), lvDesc(it.id,Math.max(1,LAB.itens[it.id]||1)))).join('')
    + `<b class="sub">Melhorias</b>`
    + UPGRADES.map(u=>campo(`${u.em} ${u.nome}`, nivelSel(`data-up="${u.id}"`,u.max||5,LAB.ups[u.id],u.id==='assovio'), u.desc(Math.max(1,LAB.ups[u.id]||1)))).join('')
    + `<b class="sub">Ferramentas</b>` + campo('Desfazer, picão, escavar, dinamite e luva', `<div class="sn"><button class="chipOp ${!g.ferr?'sel':''}" data-cfgv="ferr" data-v="0">não</button><button class="chipOp ${g.ferr?'sel':''}" data-cfgv="ferr" data-v="99">∞</button></div>`);

  const tipos = `<p class="ajuda">Escolher um tipo carrega as regras dele. Depois dá para mudar tudo nas seções abaixo.</p><div class="cards">`
    + LAB_FASES.map(k=>`<button class="card labOp ${LAB.fase===k?'sel':''}" data-fase="${k}"><span class="em">${disc(k,null,'discSm')}</span><div><b>${PATHS[k].nome}</b><span>${PATHS[k].como||PATHS[k].desc}</span>${k==='picareta'?regraPicareta():''}</div></button>`).join('') + '</div>';
  const quem = `<div class="cards">${Object.entries(CHARS).map(([k,c])=>`<button class="card labOp ${LAB.char===k?'sel':''}" data-char="${k}"><span class="em">${c.em}</span><div><b>${c.nome}</b><span>${COMO_CHAR[k]}</span></div></button>`).join('')}</div>`;
  showOverlay(`${disc('lab','#4f7f9a','bigDisc')}<h2>Laboratório</h2>
    <div class="labTop">
      <p class="recAtual">${nomeLab()}<br>${recTxt(RECS()[chaveLab()])}</p>
      <button class="btn b" id="labGo">Jogar</button>
    </div>
    ${sec('tipo','Tipo de jogo',tipos,PATHS[LAB.fase].nome)}
    ${sec('quem','Quem joga',quem,CHARS[LAB.char].nome)}
    ${sec('tab','Tabuleiro',tabuleiro,g.forma?acharForma(g.forma)?.nome||'':`${g.w}x${g.h}`)}
    ${sec('reg','Regras do dia',regras,LAB.energia?'com energia':'sem energia')}
    ${sec('obs','Obstáculos',obst)}
    ${sec('itens','Itens e melhorias',itens)}
    ${recs?sec('recs','Recordes',`<ol class="labHist recs">${recs}</ol><button class="pt" id="labRecZera">apagar recordes</button>`):''}
    ${hist?sec('hist','Últimos resultados',`<ul class="labHist">${hist}</ul>`):''}
    <button class="btn dim" id="labReset">Voltar às regras da fase</button>
    <div class="labRow"><button class="btn dim" id="labEd" style="flex:1">Editor de níveis</button><button class="btn dim" id="labCat" style="flex:1">Catálogo</button></div>
    <button class="btn dim" id="labMenu">Voltar ao menu</button>`);
  const redesenha = () => { labSalva(); const y=$('#panel').scrollTop; labPainel(); $('#panel').scrollTop=y; };
  document.querySelectorAll('[data-fase]').forEach(b=>b.onclick=()=>{ LAB.fase=b.dataset.fase; LAB.cfg={...presetDe(LAB.fase), rara:g.rara, ferr:g.ferr}; redesenha(); });
  document.querySelectorAll('[data-char]').forEach(b=>b.onclick=()=>{ LAB.char=b.dataset.char; redesenha(); });
  document.querySelectorAll('[data-cfg]').forEach(el=>el.onchange=()=>{ g[el.dataset.cfg]=JSON.parse(el.value); redesenha(); });
  document.querySelectorAll('[data-cfgv]').forEach(b=>b.onclick=()=>{ g[b.dataset.cfgv]=JSON.parse(b.dataset.v); redesenha(); });
  document.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>{ LAB.energia=b.dataset.en==='1'; redesenha(); });
  document.querySelectorAll('[data-item]').forEach(el=>el.onchange=()=>{ LAB.itens[el.dataset.item]=+el.value; redesenha(); });
  document.querySelectorAll('[data-up]').forEach(el=>el.onchange=()=>{ LAB.ups[el.dataset.up]=+el.value; redesenha(); });
  document.querySelectorAll('details.sec').forEach(d=>d.ontoggle=()=>{ LAB.abertos[d.dataset.sec]=d.open; labSalva(); });
  document.querySelectorAll('[data-delf]').forEach(b=>b.onclick=()=>{ const id=b.dataset.delf; localStorage.mina_formas=JSON.stringify(JSON.parse(localStorage.mina_formas||'[]').filter(f=>f.id!==id)); if(g.forma===id) g.forma=null; redesenha(); });
  $('#labReset').onclick=()=>{ LAB.cfg=presetDe(LAB.fase); redesenha(); };
  $('#labBuild').onclick=()=>{ g.forma=null; labSalva(); labJoga(); labConstruir(); };
  $('#labGo').onclick=labJoga;
  if($('#labRecZera')) $('#labRecZera').onclick=()=>{ localStorage.removeItem('mina_recordes'); redesenha(); };
  $('#labMenu').onclick=()=>{ hideOverlay(); showMenu(); };
  $('#labEd').onclick=editorLista;
  $('#labCat').onclick=()=>catalogo(labPainel);
}
// pedrinha + picareta do mesmo nível = minério na hora
function regraPicareta(){
  return `<div class="regraPic">${icoSvg(pedraInner(3))}<i>+</i>${icoSvg(pickInner(3))}<i>=</i>${icoOre(4)}<em>mesmo nível: quebra na hora</em></div>`;
}
const COMO_CHAR = {
  rola: 'Tudo desliza até bater, como no 2048. A peça nova nasce numa casa vazia qualquer.',
  passinho: 'Tudo anda só uma casa por arrasto, como no Threes. A peça nova entra pela borda oposta à direção do arrasto.',
};
function labJoga(){
  hideOverlay();
  S = {...freshState(), lab:true, char:LAB.char, week:1, moves:0, extra:0};
  S.fiscal=FISCAIS[0]; applyAndar();
  const base=PATHS[LAB.fase], g=LAB.cfg;
  for(const [k,v] of Object.entries(LAB.itens)) if(v) S.lv[k]=v;
  for(const [k,v] of Object.entries(LAB.ups)) if(v) S.up[k]=v;
  if(g.ferr) for(const f of FERRAMENTAS) S.ferr[f.id]=99;
  const p = {...base, forma:g.forma?acharForma(g.forma):null, caverna:!g.forma && !!base.caverna, w:g.w, h:g.h, energy:g.energia-CFG.energy, spawns:g.spawns, rara:g.rara??RARA, torrao:g.torrao, pedra:g.pedra, cores:g.cores, picareta:g.picareta, walls:g.walls, edges:g.edges, clods:g.clods, semEnergia:!LAB.energia};
  startDay(p);
  const rec=RECS()[chaveLab()];
  setBanner('Laboratório', `${base.nome} · ${LAB.energia?'com':'sem'} energia${rec?` · recorde $${rec.total}`:''}`);
  labFerramentas(); pedeEncaixe();
}
function labFim(){
  LAB.hist.push({fase:LAB.fase, energia:LAB.energia, char:LAB.char, cfg:{...LAB.cfg}, arrastos:S.moves||0, total:S.dayTotal});
  LAB.hist=LAB.hist.slice(-30); labSalva();
  labEditar(false);
  if(VEIO_DO_EDITOR) editorLista(); else labPainel();
}

// ---------- editor do tabuleiro ----------
let PINCEL = {tipo:'rocha', t:1, c:null};
function labFerramentas(){
  $('#btnEdit').style.display = S.lab ? '' : 'none';
  $('#labTools').classList.add('hidden'); S.editando=false; $('#btnEdit').textContent='Editar';
}
function labEditar(on){
  if(!S) return;
  S.editando=on; $('#labTools').classList.toggle('hidden',!on);
  if(!on && S.phase==='mine' && !S.tiles.length){ addTile(); addTile(); }
  $('#btnEdit').textContent = on ? 'Pronto' : 'Editar';
  if(on) labPaleta();
  render(); encaixa();
}
function labPaleta(){
  const sel = (cond) => cond ? 'sel' : '';
  const niveis = [...Array(16).keys()].map(i=>i+1).map(t=>`<button class="pb ${sel(PINCEL.tipo!=='torrao'&&PINCEL.tipo!=='parede'&&PINCEL.tipo!=='apagar'&&PINCEL.t===t)}" data-t="${t}" title="${rockName(t)}"><svg viewBox="0 0 100 100">${PINCEL.tipo==='pick'?pickInner(t):pedraInner(t)}</svg><small>${t}</small></button>`).join('');
  $('#labTools').innerHTML = `
    <div class="ptRow">
      <button class="pt ${sel(PINCEL.tipo==='casa')}" data-tipo="casa">Casa</button>
      <button class="pt ${sel(PINCEL.tipo==='rocha')}" data-tipo="rocha">Pedrinha</button>
      <button class="pt ${sel(PINCEL.tipo==='pick')}" data-tipo="pick">Picareta</button>
      <button class="pt ${sel(PINCEL.tipo==='torrao')}" data-tipo="torrao">Torrão</button>
      <button class="pt ${sel(PINCEL.tipo==='parede')}" data-tipo="parede">Parede</button>
      <button class="pt ${sel(PINCEL.tipo==='buraco')}" data-tipo="buraco">Buraco</button>
      <button class="pt ${sel(PINCEL.tipo==='mureta')}" data-tipo="mureta">Mureta</button>
      <button class="pt ${sel(PINCEL.tipo==='apagar')}" data-tipo="apagar">Apagar</button>
    </div>
    <div class="ptRow niveis">${niveis}</div>
    <div class="ptRow">
      <span class="ptLbl">Cor</span>
      ${[[null,'sem'],[0,'roxa'],[1,'verde'],[2,'mista']].map(([c,n])=>`<button class="pt ${sel(PINCEL.c===c)}" data-cor="${c}">${n}</button>`).join('')}
    </div>
    <div class="ptRow">
      <button class="pt" id="labLimpa">Limpar</button>
      <button class="pt" id="labTudoB">Tudo buraco</button>
      <button class="pt" id="labTudoC">Tudo casa</button>
      <button class="pt" id="labPecas">Sem pedrinhas</button>
      <button class="pt" id="labMaisE">+10 energia</button>
      <input class="ptNome" id="labNome" placeholder="nome do nível" value="${LABNOME}">
      <button class="pt" id="labSalvaF">${EDIT?.id?'Salvar':'Salvar nível'}</button>
      ${EDIT?.id?'<button class="pt" id="labSalvaNovo">Salvar como novo</button>':''}
      <button class="pt" id="labCopiaF">Copiar formato</button>
    </div>
    <p class="ptDica" id="ptDica">${PINCEL.tipo==='mureta'?'Toque na borda entre duas casas.':'Toque nas casas para pintar.'}</p>`;
  document.querySelectorAll('[data-tipo]').forEach(b=>b.onclick=()=>{ PINCEL.tipo=b.dataset.tipo; labPaleta(); });
  document.querySelectorAll('.pb').forEach(b=>b.onclick=()=>{ PINCEL.t=+b.dataset.t; if(!['rocha','pick'].includes(PINCEL.tipo)) PINCEL.tipo='rocha'; labPaleta(); });
  document.querySelectorAll('[data-cor]').forEach(b=>b.onclick=()=>{ const v=b.dataset.cor; PINCEL.c = v==='null' ? null : +v; labPaleta(); });
  $('#labLimpa').onclick=()=>{ for(const el of els.values()) el.remove(); els.clear(); S.tiles=[]; S.walls=[]; S.edges=[]; render(); };
  $('#labNome').oninput=e=>{ LABNOME=e.target.value; };
  $('#labTudoB').onclick=()=>{ labEnche(true); };
  $('#labTudoC').onclick=()=>{ labEnche(false); };
  $('#labPecas').onclick=()=>{ for(const t of S.tiles){ els.get(t.id)?.remove(); els.delete(t.id); } S.tiles=[]; render(); };
  $('#labSalvaF').onclick=()=>{
    const f=formaAtual(); const minhas=JSON.parse(localStorage.mina_formas||'[]');
    if(!f){ $('#ptDica').textContent='Pinte pelo menos uma casa.'; return; }
    f.nome=(LABNOME||'').trim()||'Meu nível '+(minhas.length+1); f.regras=regrasAtuais();
    const i = EDIT?.id ? minhas.findIndex(x=>x.id===EDIT.id) : -1;
    if(i>=0){ f.id=EDIT.id; minhas[i]=f; } else { f.id='meu'+Date.now(); minhas.push(f); if(EDIT) EDIT.id=f.id; }
    localStorage.mina_formas=JSON.stringify(minhas);
    labPaleta();
    $('#ptDica').textContent = i>=0 ? `"${f.nome}" atualizado.` : `Salvo: "${f.nome}".`;
  };
  if($('#labSalvaNovo')) $('#labSalvaNovo').onclick=()=>{ EDIT.id=null; $('#labSalvaF').click(); };
  $('#labCopiaF').onclick=()=>{
    const f=formaAtual(); if(f && LABNOME) f.nome=LABNOME; const txt=JSON.stringify(f);
    (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{ $('#ptDica').textContent='Copiado!'; }).catch(()=>{
      showOverlay(`<h2>Formato</h2><p class="ajuda">Copie o texto abaixo.</p><textarea class="edTxt" rows="7" readonly>${txt.replace(/</g,'&lt;')}</textarea><button class="btn b" id="btnOk">Fechar</button>`);
      $('#btnOk').onclick=hideOverlay; });
  };
  $('#labMaisE').onclick=()=>{ if(S.semEnergia) return; S.energy+=10; S.energyMax=Math.max(S.energyMax,S.energy); render(); };
}
let LABNOME='';
// constrói do zero: tela toda de buraco, pincel "Casa"
function labConstruir(){
  labEnche(true); for(const t of S.tiles){ els.get(t.id)?.remove(); els.delete(t.id); } S.tiles=[];
  PINCEL.tipo='casa'; labEditar(true);
  setBanner('Construtor', 'pinte as casas que existem');
}
function labEnche(buraco){
  for(const w of S.walls){ els.get(w.id)?.remove(); els.delete(w.id); }
  for(const e of S.edges){ els.get(e.id)?.remove(); els.delete(e.id); }
  S.walls=[]; S.edges=[];
  if(buraco){ for(const t of S.tiles){ els.get(t.id)?.remove(); els.delete(t.id); } S.tiles=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) S.walls.push({x,y,v:true,id:'w'+(nextId++)}); }
  render();
}
function labPinta(x,y){
  const velho=tileAt(x,y); if(velho){ S.tiles=S.tiles.filter(t=>t!==velho); els.get(velho.id)?.remove(); els.delete(velho.id); }
  const w=S.walls.find(v=>v.x===x&&v.y===y); if(w){ S.walls=S.walls.filter(v=>v!==w); els.get(w.id)?.remove(); els.delete(w.id); }
  if(PINCEL.tipo==='casa'){ render(); return; }
  if(PINCEL.tipo==='parede') S.walls.push({x,y,id:'w'+(nextId++)});
  else if(PINCEL.tipo==='buraco') S.walls.push({x,y,v:true,id:'w'+(nextId++)});
  else if(PINCEL.tipo==='torrao') S.tiles.push({id:'t'+(nextId++),x,y,t:0});
  else if(PINCEL.tipo!=='apagar'){ const t={id:'t'+(nextId++),x,y,t:PINCEL.t}; if(PINCEL.c!=null) t.c=PINCEL.c; if(PINCEL.tipo==='pick') t.k='p'; else if(S.path?.picareta) t.k='r'; S.tiles.push(t); }
  render();
}
// formato atual do tabuleiro do laboratório, no mesmo jeito dos FORMAS
function formaAtual(){
  const aberta=(x,y)=>!S.walls.some(v=>v.v&&v.x===x&&v.y===y);
  const xs=[],ys=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(aberta(x,y)){ xs.push(x); ys.push(y); }
  if(!xs.length) return null;
  // recorta no menor retângulo que contém as casas
  const x0=Math.min(...xs), y0=Math.min(...ys), w=Math.max(...xs)-x0+1, h=Math.max(...ys)-y0+1;
  const mapa=[...Array(h).keys()].map(y=>[...Array(w).keys()].map(x=>{ const X=x+x0, Y=y+y0; const w=S.walls.find(v=>v.x===X&&v.y===Y); return w?(w.v?'#':'B'):'.'; }).join(''));
  const muretas=S.edges.map(e=>[e.d,e.x-x0,e.y-y0]).filter(([d,x,y])=>x>=0&&y>=0&&x<w&&y<h);
  const pecas=S.tiles.map(t=>[t.x-x0,t.y-y0,t.t,t.c??null,t.k||null]).filter(([x,y])=>x>=0&&y>=0&&x<w&&y<h);
  return {mapa, muretas, pecas};
}
// mureta: acha a borda mais perto do toque e liga/desliga
function labMureta(cx,cy){
  const r=board.getBoundingClientRect(), cel=cellPx(), gap=(r.width-W*cel)/(W+1);
  const fx=(cx-r.left-gap/2)/(cel+gap), fy=(cy-r.top-gap/2)/(cel+gap), x=Math.floor(fx), y=Math.floor(fy), ox=fx-x, oy=fy-y;
  const lados=[[ox,'v',x-1,y],[1-ox,'v',x,y],[oy,'h',x,y-1],[1-oy,'h',x,y]].sort((a,b)=>a[0]-b[0]);
  const [,d,ex,ey]=lados[0];
  if(d==='v' && (ex<0||ex>=W-1||ey<0||ey>=H)) return; if(d==='h' && (ey<0||ey>=H-1||ex<0||ex>=W)) return;
  const ja=S.edges.find(e=>e.d===d&&e.x===ex&&e.y===ey);
  if(ja){ S.edges=S.edges.filter(e=>e!==ja); els.get(ja.id)?.remove(); els.delete(ja.id); }
  else S.edges.push({d,x:ex,y:ey,id:'e'+(nextId++)});
  render();
}
function labCelula(cx,cy){
  const r=board.getBoundingClientRect(), cel=cellPx(), gap=(r.width-W*cel)/(W+1);
  const x=Math.floor((cx-r.left-gap/2)/(cel+gap)), y=Math.floor((cy-r.top-gap/2)/(cel+gap));
  return inside(x,y) ? [x,y] : null;
}

// ===================== CLÁSSICO (FASES COM MISSÃO) =====================
// As fases e missões ficam em missoes.js. Estrelas guardadas em mina_missoes: {n: {e: estrelas, t: melhor total}}.
const MISS = () => JSON.parse(localStorage.mina_missoes||'{}');
const liberada = n => n===1 || (MISS()[n-1]?.e||0) > 0;
const faseDe = m => m.fase || (m.forma ? 'caverna' : MISSOES_GRUPOS[m.g].fase);
const charDe = m => m.char || MISSOES_GRUPOS[m.g].char || 'rola';
const corNome = c => ['roxa','verde','mista'][c];
const artigo = nome => /a$/.test(nome.split(' ')[0]) ? 'uma' : 'um';
const plural = nome => nome.split(' ').map(w=>/[aeiouáéíóú]$/i.test(w)?w+'s':/r$/.test(w)?w+'es':/l$/.test(w)?w.slice(0,-1)+'is':w).join(' ');
const qtd = (n,t) => n===1 ? `${artigo(rockName(t))} ${rockName(t)}` : `${n} ${plural(rockName(t))}`;
const estrelasHtml = (e, cls='estr') => `<span class="${cls}">${[1,2,3].map(i=>`<i class="${i<=e?'on':''}">★</i>`).join('')}</span>`;
function objetivoTxt(o){
  if(o.forme) return `Forme ${qtd(o.n,o.forme)}`;
  if(o.cor!=null) return `Forme ${qtd(o.n,o.t)} ${corNome(o.cor)}${o.n>1?'s':''}`;
  if(o.total) return `Renda $${o.total} no fim do dia`;
  if(o.quebre) return o.quebre<=1 ? `Quebre ${o.n} pedrinha${o.n>1?'s':''} com a picareta` : `Quebre ${qtd(o.n,o.quebre)} com a picareta`;
  if(o.extraia) return `Extraia $${o.extraia} com a picareta`;
  if(o.arrastos) return `Faça ${o.arrastos} arrastos sem travar`;
}
// quanto da missão já foi feito: {at, alvo, rot (rótulo curto), din (é dinheiro)}
function progresso(o){
  if(o.forme) return {at:S.feitas?.[o.forme]||0, alvo:o.n, rot:o.n>1?plural(rockName(o.forme)):rockName(o.forme)};
  if(o.cor!=null) return {at:S.coresF?.[o.t+':'+o.cor]||0, alvo:o.n, rot:`${rockName(o.t)} ${corNome(o.cor)}`};
  if(o.total) return {at:S.phase==='mine'?null:S.dayTotal, alvo:o.total, rot:'no fim do dia', din:true};
  if(o.quebre) return {at:(S.quebras||[]).filter(t=>t>=o.quebre).length, alvo:o.n, rot:'quebradas'};
  if(o.extraia) return {at:S.extra||0, alvo:o.extraia, rot:'extraído', din:true};
  if(o.arrastos) return {at:S.moves||0, alvo:o.arrastos, rot:'arrastos'};
}
const figSvg = (inner,cls='') => `<svg class="${cls}" viewBox="0 0 100 100">${inner}</svg>`;
const pedraCor = (t,c) => pedraInner(t, c!=null ? {cor:c} : {});
function figuraMissao(o){
  // cada peça com o nome embaixo (noIco: o nome não ganha outro ícone ao lado)
  const peca = (inner,nome,cls='',t=null) => `<div class="pecaN">${figSvg(inner,cls)}<small ${t!=null?`class="nomeT" style="--c:${rd(t)}"`:''}>${noIco(nome)}</small></div>`;
  const rec = (a,b,c) => `<div class="receita">${peca(...a)}<i>+</i>${peca(...b)}<i>=</i>${peca(...c)}</div>`;
  const nomeCor = (t,c) => rockName(t) + (c!=null ? ' '+corNome(c) : '');
  if(o.forme || o.cor!=null){ const t=o.forme||o.t, c=o.cor;
    return `<div class="figM"><div class="alvo">${peca(pedraCor(t,c),nomeCor(t,c),'fG',t)}<b>×${o.n}</b></div>${rec([pedraCor(t-1,c),nomeCor(t-1,c),'',t-1],[pedraCor(t-1,c),nomeCor(t-1,c),'',t-1],[pedraCor(t,c),nomeCor(t,c),'',t])}</div>`; }
  if(o.quebre){ const t=Math.max(1,o.quebre), nome = o.quebre<=1 ? 'pedrinha' : rockName(t);
    return `<div class="figM"><div class="alvo">${peca(pedraInner(t),nome,'fG',t)}<b>×${o.n}</b></div>${rec([pedraInner(t),nome,'',t],[pickInner(t),'picareta'],[oreSvg(4,50,52,2.6),'minério'])}</div>`; }
  if(o.extraia) return `<div class="figM"><div class="alvo">${peca(oreSvg(5,50,52,2.6),'minério','fG')}<b>$${o.extraia}</b></div>${rec([pedraInner(2),rockName(2),'',2],[pickInner(2),'picareta'],[oreSvg(3,50,52,2.6),'minério'])}</div>`;
  if(o.total) return `<div class="figM"><div class="alvo">${peca(oreSvg(5,50,52,2.6),'minério','fG')}<b>$${o.total}</b></div></div>`;
  if(o.arrastos) return `<div class="figM"><div class="alvo"><b>${o.arrastos}</b><span>arrastos</span></div></div>`;
  return '';
}
// ícone pequeno da missão, no painel de cima
function iconeMissao(o){
  if(o.forme || o.cor!=null) return figSvg(pedraCor(o.forme||o.t, o.cor));
  if(o.quebre) return figSvg(pickInner(Math.max(1,o.quebre)));
  if(o.extraia || o.total) return figSvg(oreSvg(5,50,52,2.6));
  return '';
}
const cumpriu = o => { const p=progresso(o); return p.at!=null && p.at>=p.alvo; };
const estrelasPor = (m,total) => 1 + (total>=m.estrelas[0]) + (total>=m.estrelas[1]);
// conta o que a missão pede, a cada arrasto
function contaMissao(r){
  for(const o of r.merges){ S.feitas[o.t]=(S.feitas[o.t]||0)+1; if(o.c!=null) S.coresF[o.t+':'+o.c]=(S.coresF[o.t+':'+o.c]||0)+1; }
  for(const b of r.breaks) S.quebras.push(b.t);
}
function avisaMissao(){
  const m=MISSOES[S.missao-1];
  if(S.avisou || m.obj.total || !cumpriu(m.obj)) return;
  S.avisou=true; popup('Missão cumprida!','continue para mais estrelas','#6aa84f'); SFX.pagou();
  setBanner(null, 'missão cumprida! continue para mais estrelas');
}
function hudMissao(){
  const m=MISSOES[S.missao-1], p=progresso(m.obj), ok=p.at!=null && p.at>=p.alvo;
  const fim = S.dayTotal!=null && S.phase!=='mine', pic = !!S.path?.picareta;
  $('#hMoney').textContent = fim ? '$'+S.dayTotal : pic ? '$'+(S.extra||0) : '$'+m.estrelas[1];
  $('#hMoneyLbl').textContent = fim ? 'rendeu' : pic ? 'extraído' : 'para ★★★';
  $('#hQuota').textContent = p.din ? (p.at==null ? '$'+p.alvo : `$${Math.min(p.at,p.alvo)}/${p.alvo}`) : `${Math.min(p.at,p.alvo)}/${p.alvo}`;
  $('#hQuotaDay').textContent = p.rot;
  const ic = ok ? '' : iconeMissao(m.obj);
  if(ic) $('#quIc').innerHTML = ic; else $('#quIc').textContent = ok ? '✓' : '★';
  $('#quIc').classList.toggle('ok', ok); $('#quIc').classList.toggle('fig', !!ic);
}
function regrasTxt(m){
  const fase=faseDe(m), fm=m.forma?acharForma(m.forma):null, n=PATHS[fase].n;
  const tam = fm ? `${fw(fm)}x${fh(fm)}` : `${m.w||n||4}x${m.h||m.w||n||4}`;
  return `${PATHS[fase].nome}${fm?': '+fm.nome:''} · ${tam} · ${m.arrastos?m.arrastos+' arrastos':'até travar'} · ${CHARS[charDe(m)].nome}`;
}
function missoesLista(){
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  show('scrMap'); trilha('menu'); document.body.classList.add('semHud');
  S = {...freshState(), missao:0, phase:'lista'}; S.fiscal=FISCAIS[0]; applyAndar(); clearBoard(); render();
  const r=MISS(), total=Object.values(r).reduce((a,x)=>a+(x.e||0),0);
  setBanner('Clássico', `${total} de ${MISSOES.length*3} estrelas`);
  const atual = (MISSOES.findIndex((m,i)=>!(r[i+1]?.e)) + 1) || MISSOES.length;
  const lado = ['center','flex-end','center','flex-start'];
  let html='';
  MISSOES_GRUPOS.forEach((g,gi)=>{
    html += `<div class="mGrupo">${disc(g.fase,null,'discSm')}<div><b>${g.nome}</b><span>${g.desc}</span></div></div>`;
    MISSOES.forEach((m,k)=>{ if(m.g!==gi) return; const n=k+1, lib=liberada(n);
      html += `<div class="mLinha" style="justify-content:${lado[n%4]}"><button class="mNo ${lib?'':'trava'} ${n===atual?'atual':''}" data-m="${n}" ${lib?'':'disabled'}>${n}${estrelasHtml(r[n]?.e||0)}</button></div>`; });
  });
  const mb=$('#mapBody'); mb.style.height='';
  mb.innerHTML = `<div class="mTrilha">${html}</div>`;
  // caminho ligando as fases
  const tr=mb.querySelector('.mTrilha'), base=tr.getBoundingClientRect();
  const pts=[...tr.querySelectorAll('.mNo')].map(b=>{ const q=b.getBoundingClientRect(); return `${Math.round(q.left+q.width/2-base.left)},${Math.round(q.top+q.height/2-base.top)}`; });
  tr.insertAdjacentHTML('afterbegin', `<svg class="mCaminho" width="${Math.round(base.width)}" height="${Math.round(base.height)}"><polyline points="${pts.join(' ')}"/></svg>`);
  tr.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>missaoInfo(+b.dataset.m));
  mb.querySelector('.mNo.atual')?.scrollIntoView({block:'center'});
}
function missaoInfo(n){
  const m=MISSOES[n-1], fase=faseDe(m), fm=m.forma?acharForma(m.forma):null, b=MISS()[n];
  const explica=[];
  if(fase!=='comum' || n===1) explica.push(PATHS[fase].como||PATHS[fase].desc);
  if(charDe(m)==='passinho') explica.push(COMO_CHAR.passinho);
  showOverlay(`${fm?formaSvg(fm,110):disc(fase,null,'bigDisc')}<h2>Fase ${n}</h2><p class="andarNome">${m.nome}</p>
    <div class="objetivo"><small>missão</small>${figuraMissao(m.obj)}${objetivoTxt(m.obj)}</div>
    <p class="ajuda">${regrasTxt(m)}</p>
    ${explica.map(t=>`<p class="ajuda">${t}</p>`).join('')}
    ${fase==='picareta'?regraPicareta():''}
    <p class="metas">★ missão · ★★ $${m.estrelas[0]} · ★★★ $${m.estrelas[1]}</p>
    ${b?`<p class="recAtual">Seu melhor: ${estrelasHtml(b.e)} · $${b.t}</p>`:''}
    <button class="btn g" id="mJoga">Jogar</button><button class="btn dim" id="mVolta">Voltar</button>`);
  $('#mJoga').onclick=()=>missaoJoga(n);
  $('#mVolta').onclick=hideOverlay;
}
function missaoJoga(n){
  const m=MISSOES[n-1], fase=faseDe(m), fm=m.forma?acharForma(m.forma):null;
  hideOverlay(); VEIO_DO_EDITOR=false;
  S = {...freshState(), missao:n, tema:MISSOES_GRUPOS[m.g].tema, char:charDe(m), moves:0, extra:0, feitas:{}, coresF:{}, quebras:[], dayTotal:null};
  S.fiscal=FISCAIS[0];
  for(const [k,v] of Object.entries(m.itens||{})) S.lv[k]=v;
  const p = {...PATHS[fase], ...(m.regras||{}), forma:fm, caverna:false, energy:m.arrastos?m.arrastos-CFG.energy:0, semEnergia:!m.arrastos};
  if(m.w){ p.w=m.w; p.h=m.h||m.w; }
  applyAndar(); startDay(p);
  setBanner(`Fase ${n}: ${m.nome}`, objetivoTxt(m.obj));
  pedeEncaixe();
}
// linha do resultado, no fim do dia
function missaoLinha(){
  const m=MISSOES[S.missao-1], ok=cumpriu(m.obj), p=progresso(m.obj);
  $('#recLine').innerHTML = ok ? `<b>Missão cumprida!</b> ${estrelasHtml(estrelasPor(m,S.dayTotal))}` : enrich(`Faltou: ${objetivoTxt(m.obj)} (${p.din?'$':''}${p.at}/${p.alvo})`);
  $('#btnSell').textContent = 'Continuar';
  render();
}
function missaoFim(){
  const n=S.missao, m=MISSOES[n-1], ok=cumpriu(m.obj), p=progresso(m.obj);
  if(!ok){
    SFX.naoDeu();
    showOverlay(`${disc(faseDe(m),null,'bigDisc')}<h2>Não deu</h2><p>${objetivoTxt(m.obj)}: ${p.din?'$':''}${p.at} de ${p.din?'$':''}${p.alvo}.</p>
      <button class="btn g" id="mDeNovo">Tentar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
  } else {
    const e=estrelasPor(m,S.dayTotal), r=MISS(), ant=r[n];
    r[n]={e:Math.max(e,ant?.e||0), t:Math.max(S.dayTotal,ant?.t||0)}; localStorage.mina_missoes=JSON.stringify(r);
    SFX.pagou();
    showOverlay(`<h2>Missão cumprida!</h2>${estrelasHtml(e,'estr grande')}
      <p>Rendeu <b>$${S.dayTotal}</b>.${e<3?` ${e<2?`★★ com $${m.estrelas[0]} · `:''}★★★ com $${m.estrelas[1]}`:''}</p>
      ${n<MISSOES.length?'<button class="btn g" id="mProx">Próxima fase</button>':'<p>Você terminou todas as fases!</p>'}
      <button class="btn dim" id="mDeNovo">Jogar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
    if($('#mProx')) $('#mProx').onclick=()=>{ missoesLista(); missaoInfo(n+1); };
  }
  $('#mDeNovo').onclick=()=>missaoJoga(n);
  $('#mLista').onclick=missoesLista;
}

// ===================== CATÁLOGO =====================
// Tudo que existe no jogo, montado a partir dos próprios dados (nunca fica desatualizado).
function catalogo(volta){
  const sec=(t,html)=>`<details class="sec"><summary>${t}</summary><div class="secBody">${html}</div></details>`;
  const card=(em,nome,desc,extra='')=>`<div class="card" style="cursor:default"><span class="em">${em}</span><div><b>${nome}</b><span>${desc}</span>${extra}</div></div>`;
  const big = svg => svg.replace('class="ico"','class="ico big"');
  const pedras=[...Array(14).keys()].map(i=>pedraCard(i+1)).join('') + pedraCard(0) + '<p class="ajuda">Acima do nível 14 a Galáxia ganha um planeta por nível e o valor do que ela cospe dobra.</p>';
  const minerios=ORES.slice(1).map((o,i)=>card(big(icoOre(i+1)), noIco(o.n[0].toUpperCase()+o.n.slice(1)), `$${o.p}`)).join('') + '<p class="ajuda">Pedrinha rara (contorno dourado) cospe como 2 níveis acima.</p>';
  const itens=ITEMS.map(i=>card(i.em,i.nome,[1,2,3].map(l=>`nível ${l}: ${lvDesc(i.id,l)}`).join('<br>'),`<span class="est" style="background:${EST_COR[i.est]}">${i.est}</span>`)).join('');
  const melh=UPGRADES.map(u=>card(u.em,u.nome,u.desc(1)+(u.max?` Até o nível ${u.max}.`:' Sem limite de nível.'))).join('');
  const ferr=FERRAMENTAS.map(f=>card(f.em,f.nome,f.desc)).join('');
  const cons=CONSUMIVEIS.map(c=>card(c.em,noIco(c.nome),c.desc)).join('');
  const caminhos=Object.entries(PATHS).map(([k,p])=>card(disc(k,null,'discSm'),p.nome,(p.como||p.desc)+(p.lab?' Só no laboratório.':p.from>1?` A partir do andar ${p.from}.`:''))).join('');
  const fiscais=FISCAIS.map(f=>card(disc(f.id,COR_NO.fiscal,'discSm'),f.nome,f.desc)).join('');
  const formas=formasTodas().map(f=>card(formaSvg(f,44),f.nome,`${fw(f)}x${fh(f)}${fw(f)>8||fh(f)>8?' · só no laboratório':''}`)).join('');
  const chars=Object.entries(CHARS).map(([k,c])=>card(c.em,c.nome,c.desc)).join('');
  const regras=`<ul>
    <li>Duas pedrinhas iguais viram a do nível seguinte.</li>
    <li>Cada arrasto gasta 1 de energia. Sem energia, só nasce torrão, que custa no fim do dia. A sobra fica guardada (até ${CFG.guardaMax}).</li>
    <li>No fim do dia cada pedrinha cospe um minério; os itens somam e multiplicam.</li>
    <li>A semana tem ${CFG.days} dias; no último o fiscal cobra a cota. Duas cotas perdidas seguidas encerram a partida.</li>
    <li>Paredes ocupam casas; muretas ficam entre casas; buracos são casas que não existem.</li>
  </ul>`;
  showOverlay(`<div class="bigEm">📖</div><h2>Catálogo</h2><p class="ajuda" style="text-align:center">Tudo que existe no jogo.</p>
    ${sec('Regras',regras)}${sec(`Pedrinhas (${14}+)`,pedras)}${sec(`Minérios (${ORES.length-1})`,minerios)}
    ${sec(`Itens (${ITEMS.length})`,itens)}${sec(`Melhorias da loja (${UPGRADES.length})`,melh)}
    ${sec(`Ferramentas (${FERRAMENTAS.length})`,ferr)}${sec(`Para o próximo dia (${CONSUMIVEIS.length})`,cons)}
    ${sec(`Caminhos do mapa (${Object.keys(PATHS).length})`,caminhos)}${sec(`Fiscais (${FISCAIS.length})`,fiscais)}
    ${sec(`Formatos de tabuleiro (${formasTodas().length})`,formas)}${sec('Personagens',chars)}
    <button class="btn b" id="btnOk">Voltar</button>`);
  $('#btnOk').onclick=()=>{ hideOverlay(); (volta||showMenu)(); };
}

// ===================== EDITOR DE NÍVEIS =====================
// Lista dos níveis, criar, editar um existente, testar, copiar, apagar, importar e exportar.
// Um nível é um formato (casas, buracos, blocos, muretas e pedrinhas iniciais) mais as regras com que foi salvo.
let EDIT = null;          // nível em edição: {id, nome} (id null = ainda não salvo)
let VEIO_DO_EDITOR = false;
const meusNiveis = () => JSON.parse(localStorage.mina_formas||'[]');
const salvaNiveis = l => localStorage.mina_formas = JSON.stringify(l);
function regrasAtuais(){ const {forma,walls,edges,...cfg}=LAB.cfg; return {fase:LAB.fase, energia:LAB.energia, cfg}; }
function editorLista(){
  hideCoach(); EDIT=null; VEIO_DO_EDITOR=false; show('scrMap'); trilha('menu');
  S = {...freshState(), lab:true, char:LAB.char, week:1}; S.fiscal=FISCAIS[0]; applyAndar(); clearBoard(); render();
  $('#mapBody').innerHTML=''; $('#mapBody').style.height='0px'; setBanner('Editor de níveis','');
  const minhas=meusNiveis();
  const linha=(f,meu)=>`<div class="card" style="cursor:default"><span class="em">${formaSvg(f,48)}</span><div><b>${f.nome}</b><span>${fw(f)}x${fh(f)}${f.pecas?.length?` · ${f.pecas.length} pedrinhas`:''}${f.regras?` · ${PATHS[f.regras.fase]?.nome||''}, ${f.regras.energia?'com':'sem'} energia`:''}</span>
    <div class="acoes"><button class="pt" data-testa="${f.id}">testar</button><button class="pt" data-edita="${f.id}">${meu?'editar':'copiar e editar'}</button>${meu?`<button class="pt" data-apaga="${f.id}">apagar</button>`:''}</div></div></div>`;
  const op=(a,b,v)=>[...Array(b-a+1).keys()].map(i=>a+i).map(n=>`<option value="${n}" ${n===v?'selected':''}>${n}</option>`).join('');
  showOverlay(`${disc('caverna',null,'bigDisc')}<h2>Editor de níveis</h2>
    <p class="ajuda" style="text-align:center">Seus níveis entram no laboratório e nas Cavernas do jogo (os de até 8x8).</p>
    <div class="campo"><div><b>Nível novo</b><small>largura x altura</small></div><select class="labSel" id="edW">${op(3,8,LAB.cfg.w)}</select><select class="labSel" id="edH">${[3,4,5,6,7,8,10,12,16,20].map(n=>`<option value="${n}" ${n===LAB.cfg.h?'selected':''}>${n}</option>`).join('')}</select></div>
    <button class="btn g" id="edNovo">Criar nível vazio</button>
    <button class="btn dim" id="edImport">Importar nível (colar texto)</button>
    <h3>Seus níveis</h3><div class="cards">${minhas.map(f=>linha(f,true)).join('')||'<p class="ajuda">Nenhum ainda.</p>'}</div>
    <h3>Níveis do jogo</h3><div class="cards">${FORMAS.map(f=>linha(f,false)).join('')}</div>
    <button class="btn dim" id="edMenu">Voltar ao menu</button>`);
  $('#edNovo').onclick=()=>{ LAB.cfg.w=+$('#edW').value; LAB.cfg.h=+$('#edH').value; LAB.cfg.forma=null; labSalva(); EDIT={id:null,nome:''}; LABNOME=''; VEIO_DO_EDITOR=true; labJoga(); labConstruir(); };
  $('#edImport').onclick=editorImporta;
  $('#edMenu').onclick=()=>{ hideOverlay(); showMenu(); };
  document.querySelectorAll('[data-testa]').forEach(b=>b.onclick=()=>editorTesta(b.dataset.testa));
  document.querySelectorAll('[data-edita]').forEach(b=>b.onclick=()=>editorEdita(b.dataset.edita));
  document.querySelectorAll('[data-apaga]').forEach(b=>b.onclick=()=>{ salvaNiveis(meusNiveis().filter(f=>f.id!==b.dataset.apaga)); editorLista(); });
}
function editorAplicaRegras(f){
  if(!f.regras) return;
  LAB.fase=f.regras.fase in PATHS ? f.regras.fase : LAB.fase; LAB.energia=!!f.regras.energia;
  LAB.cfg={...presetDe(LAB.fase), ...f.regras.cfg};
}
function editorTesta(id){
  const f=acharForma(id); if(!f) return;
  editorAplicaRegras(f); LAB.cfg.forma=id; LAB.cfg.walls=0; LAB.cfg.edges=0; labSalva();
  VEIO_DO_EDITOR=true; EDIT=null; labJoga();
}
function editorEdita(id){
  const f=acharForma(id); if(!f) return;
  const meu = meusNiveis().some(x=>x.id===id);
  editorAplicaRegras(f); LAB.cfg.forma=id; LAB.cfg.walls=0; LAB.cfg.edges=0; labSalva();
  EDIT={id: meu?id:null, nome: meu?f.nome:f.nome+' (cópia)'}; LABNOME=EDIT.nome; VEIO_DO_EDITOR=true;
  labJoga();
  // só as pedrinhas do nível (sem as sorteadas)
  for(const t of S.tiles){ els.get(t.id)?.remove(); els.delete(t.id); } S.tiles=[];
  for(const [x,y,t,c,k] of (f.pecas||[])){ const tl={id:'t'+(nextId++),x,y,t}; if(c!=null) tl.c=c; if(k) tl.k=k; S.tiles.push(tl); }
  PINCEL.tipo='casa'; labEditar(true);
  setBanner('Editor', EDIT.nome);
}
function editorImporta(){
  showOverlay(`<h2>Importar nível</h2><p class="ajuda">Cole o texto de um nível (do botão "Copiar formato").</p>
    <textarea id="edTxt" class="edTxt" rows="7"></textarea><p class="ajuda" id="edMsg"></p>
    <button class="btn b" id="edOk">Importar</button><button class="btn dim" id="edNo">Voltar</button>`);
  $('#edNo').onclick=editorLista;
  $('#edOk').onclick=()=>{
    try{
      const f=JSON.parse($('#edTxt').value);
      if(!Array.isArray(f.mapa) || !f.mapa.length || f.mapa.some(r=>typeof r!=='string' || r.length!==f.mapa[0].length || /[^.#B]/.test(r))) throw 0;
      f.id='meu'+Date.now(); f.nome=(f.nome||'Nível importado').slice(0,40); f.muretas=f.muretas||[]; f.pecas=f.pecas||[];
      const l=meusNiveis(); l.push(f); salvaNiveis(l); editorLista();
    }catch(e){ $('#edMsg').textContent='Texto inválido.'; }
  };
}

// ===================== TUTORIAL =====================
let coachBlock=false, coachTarget=null, coachTimer=null;
// alvo: seletor ou elemento que o balão explica ('top' = sem alvo, no alto)
function coach(html, okLabel, onOk, target){
  coachTarget = target==='top' ? 'top' : typeof target==='string' ? $(target) : (target||null);
  $('#coachText').innerHTML=enrich(html);
  const b=$('#coachOk');
  if(okLabel){ b.style.display=''; b.textContent=okLabel; coachBlock=true; b.onclick=()=>{ hideCoach(); onOk&&onOk(); }; }
  else { b.style.display='none'; coachBlock=false; }
  $('#spot').classList.toggle('dim', !!okLabel);
  if(coachTarget && coachTarget!=='top' && coachTarget.scrollIntoView) coachTarget.scrollIntoView({block:'center'});
  $('#coach').classList.remove('hidden');
  placeCoach(); clearInterval(coachTimer); coachTimer=setInterval(placeCoach,250);
}
function placeCoach(){
  const c=$('#coach'), sp=$('#spot'), t=coachTarget;
  if(c.classList.contains('hidden')){ sp.classList.add('hidden'); return; }
  c.style.top=''; c.style.bottom=''; c.dataset.arrow='';
  if(t==='top'){ sp.classList.add('hidden'); c.style.top='12px'; c.style.bottom='auto'; return; }
  if(!t || !t.isConnected){ sp.classList.add('hidden'); c.style.bottom='12px'; return; }
  const r=t.getBoundingClientRect(), pad=6;
  sp.classList.remove('hidden');
  Object.assign(sp.style,{left:(r.left-pad)+'px', top:(r.top-pad)+'px', width:(r.width+2*pad)+'px', height:(r.height+2*pad)+'px'});
  const h=c.offsetHeight, below=r.bottom+pad+14, above=r.top-pad-14-h;
  if(below+h < innerHeight-8){ c.style.top=below+'px'; c.style.bottom='auto'; c.dataset.arrow='up'; }
  else if(above>8){ c.style.top=above+'px'; c.style.bottom='auto'; c.dataset.arrow='down'; }
  else c.style.bottom='12px';
  const cl=c.getBoundingClientRect().left;
  c.style.setProperty('--ax', Math.min(Math.max(r.left+r.width/2-cl, 26), c.offsetWidth-26)+'px');
}
addEventListener('resize', placeCoach);
function hideCoach(){ $('#coach').classList.add('hidden'); $('#spot').classList.add('hidden'); coachBlock=false; coachTarget=null; clearInterval(coachTimer); }
const pillOf = id => $(id).closest('.pill');
function startTutorial(){
  S=freshState(); S.char='rola'; S.tut=1; S.fiscal=FISCAIS[0]; S.hist={1:'comum'};
  S.mapa=gerarMapa(); S.mapa.tipos[0][1]='comum'; S.trilha={1:1}; S.lane=1;
  applyAndar(); startDay(PATHS.comum, true);
}

// ===================== PAUSA =====================
function pauseMenu(){
  if(!S || S.phase==='reveal' || overlayOpen() || S.tut) return;
  if(S.lab && S.phase!=='mine') return labPainel();
  const inDay = S.phase==='mine';
  showOverlay(`<h2>Pausa</h2>
    <button class="btn b" id="pCont">Continuar</button>
    <button class="btn dim" id="pRules">Regras rápidas</button>
    <button class="btn dim" id="pPedras">Pedrinhas</button>
    <button class="btn dim" id="pMusic">${music?'Desligar a música':'Ligar a música'}</button>
    <button class="btn dim" id="pSound">${sound?'Desligar os efeitos':'Ligar os efeitos'}</button>
    <button class="btn" id="pExit">Sair para o menu</button>
    ${inDay?'<p style="font-size:13px">Sair agora recomeça o dia.</p>':''}`);
  $('#pCont').onclick=hideOverlay;
  $('#pRules').onclick=quickRules;
  $('#pPedras').onclick=()=>pedrapedia(pauseMenu);
  $('#pSound').onclick=()=>{ toggleSound(); hideOverlay(); pauseMenu(); };
  $('#pMusic').onclick=()=>{ toggleMusic(); hideOverlay(); pauseMenu(); };
  $('#pExit').onclick=()=>{ hideOverlay(); if(VEIO_DO_EDITOR) editorLista(); else if(S.missao) missoesLista(); else if(S.lab) labPainel(); else showMenu(); };
}
function quickRules(){
  showOverlay(`<h2>Regras rápidas</h2><ul>
    <li><b>Arraste</b>: duas iguais viram uma maior.</li>
    <li>Arrasto gasta 1 de <b>energia</b>; sem ela, só <b>torrão</b>, que custa. A sobra fica guardada (até ${CFG.guardaMax}).</li>
    <li>No fim do dia, as pedrinhas <b>cospem</b> minério.</li>
    <li>Dia ${CFG.days}: o <b>fiscal</b> cobra a cota. Falhou duas seguidas, acabou.</li>
  </ul><button class="btn b" id="btnOk">Voltar</button>`);
  $('#btnOk').onclick=()=>{ hideOverlay(); pauseMenu(); };
}
function toggleSound(){ sound=!sound; localStorage.mina_sound=sound?'1':'0'; document.querySelectorAll('.sndBtn').forEach(b=>b.style.opacity=sound?1:.4); }

// ===================== DESENHO =====================
function lookOf(t){
  if(t.t===0) return [0,0];
  if(S.editando) return [0,0];
  for(const [dx,dy] of DIRS) if(S.tiles.some(o=>o.x===t.x+dx&&o.y===t.y+dy&&o.t===t.t&&corOk(o,t))) return [dx,dy];
  return [0,0];
}
function wallInner(){
  return `<rect x="6" y="6" width="88" height="88" rx="16" fill="#6b625a" stroke="${INK}" stroke-width="2.4"/>
    <rect x="12" y="10" width="76" height="12" rx="6" fill="#80776e"/>
    <path d="M6 44 h28 l8 10 h52 M52 6 v22 l-8 12 M28 94 v-22 l10 -10 M72 54 v40" stroke="#4e4740" stroke-width="2.6" fill="none" stroke-linejoin="round"/>`;
}
function renderItems(){
  $('#items').innerHTML = Object.keys(S.lv).map(id=>{ const i=item(id), L=lvl(id); const badge = id==='coroa'&&S.coroa ? fmtMult(1+S.coroa) : L>1 ? 'nv '+L : ''; return `<button class="chip" data-item="${id}" style="--ec:${EST_COR[i.est]}" title="${i.nome}">${i.em}${badge?`<span class="lv">${badge}</span>`:''}</button>`; }).join('');
  document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>showItemInfo(c.dataset.item));
}
function render(){
  board.querySelectorAll('.slot').forEach(sl=>sl.classList.toggle('void', S.walls.some(w=>w.v && w.x==sl.dataset.x && w.y==sl.dataset.y)));
  for(const w of S.walls){
    if(w.v) continue;
    if(!els.has(w.id)){ const el=document.createElement('div'); el.className='tile'; el.style.transform=pos(w.x,w.y); el.innerHTML=`<div class="face">${svgOf(wallInner())}</div>`; board.appendChild(el); els.set(w.id,el); }
  }
  for(const e of (S.edges||[])){
    if(!els.has(e.id)){ const el=document.createElement('div'); el.className='edge '+e.d; el.style.setProperty('--ex',e.x); el.style.setProperty('--ey',e.y); board.appendChild(el); els.set(e.id,el); }
  }
  for(const t of S.tiles){
    let el=els.get(t.id);
    if(!el){
      el=document.createElement('div'); el.className='tile'; el.dataset.id=t.id;
      el.innerHTML='<div class="face idle spawn"></div>';
      el.style.transition='none'; el.style.transform=pos(t.x,t.y);
      board.appendChild(el); els.set(t.id,el);
      void el.offsetWidth; el.style.transition='';
      el.firstChild.addEventListener('animationend',e=>{ if(e.target===el.firstChild && e.animationName!=='crumble') el.firstChild.classList.remove(e.animationName); });
    }
    el.style.transform=pos(t.x,t.y);
    if(S.phase==='mine'){
      const look=lookOf(t), key=t.t+':'+look+':'+t.c+':'+t.k+':'+t.r;
      if(el.dataset.key!==key){ el.dataset.key=key; el.firstChild.innerHTML=svgOf(t.t===0?torraoInner():t.k==='p'?pickInner(t.t):pedraInner(t.t,{look,cor:t.c,rara:t.r})); }
    }
  }
  if(S.phase==='mine'){ const on=has('regua')?new Set(fileiras().flat().map(t=>t.id)):new Set(); for(const t of S.tiles) els.get(t.id)?.classList.toggle('line',on.has(t.id)); }
  const q=CFG.quota(S.week);
  $('#hQuota').textContent=S.lab?'lab':'$'+q;
  $('#hQuotaDay').textContent=S.lab?'sem cota':S.day===CFG.days?'cota hoje!':`cota em ${CFG.days-S.day+1} dias`;
  $('#hMoney').textContent='$'+S.money;
  $('#hEnergy').textContent=S.phase==='map' ? (S.saved+S.bonus?'+'+(S.saved+S.bonus):'·') : S.semEnergia ? '∞' : S.energy;
  $('#hEnergyMax').textContent=S.phase==='map' ? (S.saved+S.bonus?'guardada':'energia') : S.semEnergia ? 'até travar' : S.energy>0?`de ${S.energyMax}`:'exausta!';
  $('#enIc').classList.toggle('zero',S.phase==='mine'&&S.energy<=0);
  $('#hMoneyLbl').textContent='dinheiro'; $('#quIc').textContent='!'; $('#quIc').classList.remove('ok','fig');
  if(S.missao) hudMissao();
  renderItems(); ferrBar();
}

