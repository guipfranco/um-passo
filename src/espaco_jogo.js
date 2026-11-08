
// ===================== CLÁSSICO NO ESPAÇO =====================
// Liga com ?espaco no endereço (desliga com ?espaco=0); a escolha fica guardada no aparelho.
// Esta etapa troca o tabuleiro do Clássico: peças viram corpos celestes 3D, e bloco, mureta, terra, torrão,
// presa, carrinho, picareta e cores ganham os equivalentes do espaço. O motor é o src/espaco.js (objeto ESP).
(()=>{ const m=location.search.match(/[?&]espaco(?:=(\d))?/); if(m) localStorage.ptui_espaco = m[1]==='0' ? '0' : '1'; })();
function espacoLigado(){ return localStorage.ptui_espaco!=='0'; }
function noEspaco(){ return espacoLigado() && !!(typeof S!=='undefined' && S && (S.missao || S.infinito)); }
// nome do nível no espaço (null fora do Clássico no espaço)
function nomeEspaco(t){ if(!ESP || t<1 || !espFig()) return null; return nomeNivelEsp(t); }
function nomeNivelEsp(t){ const L=ESP.LADDER; return L[Math.max(1,Math.min(t,L.length))-1].n; }
const kNivel = t => t<1 ? 1 : ESP.kDe(nomeNivelEsp(t));
// cor de cada nível (para o disco do buraco negro, que engole o planeta da mesma cor)
const COR_NIVEL=['#d9c49a','#7fdcf0','#ff7a1e','#909cb2','#bfefff','#e9c3a0','#cfd3dc','#c0342a','#e0805a','#f2d08a','#43a0e6','#4f86ec','#9fdde4','#e8c98a','#d9a07a','#ffd84a','#c08aff','#9a77c9'];
const corNivel = t => COR_NIVEL[Math.max(1,Math.min(t,COR_NIVEL.length))-1];

// cada canvas do espaço no tabuleiro fica num conjunto e é redesenhado a cada quadro
const ESPC = new Set();
let espIniciado=false;
function espInicia(){ if(espIniciado) return; espIniciado=true; ESP.buildTextures(); ESP.preaquece(); requestAnimationFrame(espLoop); }
// canvas centrado no elemento, kx por ky casas de tamanho; desenha(ctx, W, H, u, t), u = lado da casa em px do canvas
function espCanvas(host, kx, ky, desenha){
  let cv=host.querySelector(':scope > canvas.esp');
  if(!cv){ cv=document.createElement('canvas'); cv.className='esp'; host.appendChild(cv); }
  cv.style.setProperty('--kx',kx); cv.style.setProperty('--ky',ky); cv._kx=kx; cv._ky=ky; cv._d=desenha; ESPC.add(cv); espInicia(); return cv;
}
function espLoop(ms){
  requestAnimationFrame(espLoop);
  const t=ms/1000, ceu=document.body.classList.contains('espaco');
  if(ceu) ceuDesenha(t);
  if(!ESPC.size) return;
  const cel=(typeof cellPx==='function'?cellPx():80)*ESP.DPR;
  for(const cv of ESPC){
    if(!cv.isConnected){ ESPC.delete(cv); continue; }
    if(cv._fw && cv.offsetParent===null) continue;   // canvas fixo escondido (tela fechada): não desenha
    const W=cv._fw ? Math.round(cv._fw*ESP.DPR) : Math.max(8,Math.round(cel*cv._kx)), H=cv._fh ? Math.round(cv._fh*ESP.DPR) : Math.max(8,Math.round(cel*cv._ky));
    if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
    const c=cv.getContext('2d'); c.clearRect(0,0,W,H); cv._d(c,W,H,cv._fw?W:cel,t);
  }
  if(ceu && GLON) glQuadro(t);
}
// ---------- botão voltar do celular ----------
// fora do menu há sempre uma entrada a mais no histórico (guardaVolta). Voltar: fecha a janela aberta; na lista de
// fases vai ao menu; dentro de uma fase abre o menu de pausa; no menu principal sai do jogo, como qualquer app.
function guardaVolta(){ if(!(history.state&&history.state.ptui)) history.pushState({ptui:1},''); }
addEventListener('popstate',()=>{
  const menu=$('#scrMenu').classList.contains('on');
  if(overlayOpen()){ hideOverlay(); if(!menu) guardaVolta(); return; }
  if(menu) return;
  if(S && S.phase==='lista'){ showMenu(); return; }
  if($('#scrGame').classList.contains('on') && S && S.phase==='mine'){ pauseMenu(); guardaVolta(); return; }
  showMenu();
});

// ---------- planetas redondos pela placa de vídeo (WebGL) ----------
// uma camada só, dentro do tabuleiro (com uma casa de folga em volta para os anéis e o brilho); se o aparelho
// não tiver WebGL, GLON fica falso e cada planeta volta a ser pintado no canvas da sua peça
let GLON=null;
function glCamada(){ let cv=document.getElementById('glPlan'); if(!cv){ cv=document.createElement('canvas'); cv.id='glPlan'; } if(cv.parentElement!==board) board.prepend(cv); return cv; }
function glAtivo(){ if(GLON===null){ espInicia(); GLON = !/[?&]semgl\b/.test(location.search) && ESP.glPronto(glCamada()); } return GLON; }
function glQuadro(t){
  const cv=glCamada(), gr=cv.getBoundingClientRect(); if(!gr.width) return;
  const W=Math.round(gr.width*ESP.DPR), H=Math.round(gr.height*ESP.DPR); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  const sx=W/gr.width, lista=[];
  for(const el of board.querySelectorAll('.tile')){ if(!el._gl||!el._t) continue; const fr=el.firstChild.getBoundingClientRect(); if(!fr.width) continue;
    lista.push({n:nomeNivelEsp(el._t.t), x:(fr.left+fr.width/2-gr.left)*sx, y:(fr.top+fr.height/2-gr.top)*sx, u:fr.width*sx, id:el.dataset.id||'x'}); }
  ESP.glDesenha(lista,t,ESP.ST.L);
}
// recorta o disco do planeta (desenhado embaixo, pela placa de vídeo) do que está no canvas da peça
function furaPlaneta(c,x,y,u,T){ const R=u*kNivel(T.t)*ESP.byName(nomeNivelEsp(T.t)).sp.rScale/2; c.save(); c.globalCompositeOperation='destination-out'; c.beginPath(); c.arc(x,y,R,0,7); c.fill(); c.restore(); }

// ícone do planeta no meio do texto (uma foto parada, guardada depois da primeira vez)
const ICO_PL={};
function icoPlaneta(t){ if(ICO_PL[t]) return ICO_PL[t]; espInicia(); return ICO_PL[t]=`<img class="ico" alt="" src="${ESP.pecaImg(nomeNivelEsp(t),0,96).toDataURL()}">`; }

// ---------- peças ----------
function espAura(c,x,y,u,t,cor){
  if(cor!==2){ ESP.SPR.aura(c,x,y,u,t,cor); return; }
  for(const [k,x0] of [[0,0],[1,x]]){ c.save(); c.beginPath(); c.rect(x0,0,x,c.canvas.height); c.clip(); ESP.SPR.aura(c,x,y,u,t,k); c.restore(); }
}
// brilho na cor do nível atrás das peças pequenas (até Plutão), para elas não sumirem no tabuleiro
function espBrilho(c,x,y,u,t){ const cor=corNivel(t), g=c.createRadialGradient(x,y,0,x,y,u*.46);
  g.addColorStop(0,cor+'70'); g.addColorStop(.55,cor+'26'); g.addColorStop(1,cor+'00'); c.fillStyle=g; c.beginPath(); c.arc(x,y,u*.46,0,7); c.fill(); }
const temBrilho = T => T.t>=1 && T.t<=6 && T.k!=='p' && T.c==null;
function espTile(el,t){
  el._t=t;
  const key=[t.t,t.c,t.k,t.presa?1:0].join(':'); if(el.dataset.ek===key) return; el.dataset.ek=key;
  const f=el.firstChild; f.querySelectorAll('svg').forEach(s=>s.remove());
  const k = t.t===0||t.k==='p' ? 1 : kNivel(t.t), kk = Math.max(1.15, k + (t.c!=null ? .1 : 0));
  el.style.zIndex = String(10 + Math.round((2 - Math.min(2,k))*10));   // os pequenos ficam por cima dos anéis dos grandes
  espCanvas(f, kk, kk, (c,W,H,u,tm)=>{ const T=el._t, x=W/2, y=H/2;
    // planeta redondo: vai pela placa de vídeo (camada embaixo); aqui só a aura e a gaiola, com o disco do planeta recortado
    const redondo = T.t>0 && T.k!=='p' && ESP.byName(nomeNivelEsp(T.t)).kind==='sphere' && glAtivo();
    el._gl = redondo;
    if(redondo){ if(temBrilho(T)) espBrilho(c,x,y,u,T.t); if(T.c!=null) espAura(c,x,y,u,tm,T.c); if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'back'); if(T.c!=null||T.presa||temBrilho(T)) furaPlaneta(c,x,y,u,T); if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'front'); return; }
    if(temBrilho(T)) espBrilho(c,x,y,u,T.t);
    if(T.c!=null) espAura(c,x,y,u,tm,T.c);
    if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'back');
    if(T.t===0) ESP.SPR.lixo(c,x,y,u*.86,tm);
    else if(T.k==='p') ESP.SPR.buraco(c,x,y,u,tm,corNivel(T.t));
    else ESP.drawPecaVar(c,nomeNivelEsp(T.t),tm,x,y,u,el.dataset.id||'x');
    if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'front'); });
}
// bloco (a peça que não sai): estação espacial
function espParede(el){ el.innerHTML='<div class="face"></div>'; espCanvas(el.firstChild,1.1,1.1,(c,W,H,u,tm)=>ESP.SPR.estacao(c,W/2,H/2,u,tm)); }
// mureta: fluxo de rochas entre as duas casas
function espMureta(el,d){ const v=d==='v';
  espCanvas(el, v?.62:1, v?1:.62, (c,W,H,u,tm)=> v ? ESP.SPR.rochas(c,[W/2,H*.03],[W/2,H*.97],tm,u) : ESP.SPR.rochas(c,[W*.03,H/2],[W*.97,H/2],tm,u)); }
// marcas do Clássico: casa marcada, casa de terra, carrinho
function espMarca(el,tipo,a){
  if(tipo==='alvo'){ const k=Math.max(1.1,kNivel(a.t)); espCanvas(el,k,k,(c,W,H,u,tm)=>{
      if(el.classList.contains('ok')){ c.save(); c.strokeStyle='#8fe3a0'; c.lineWidth=u*.035; c.shadowColor='#8fe3a0'; c.shadowBlur=u*.08; c.beginPath(); c.arc(W/2,H/2,u*.42,0,7); c.stroke(); c.restore(); }
      else ESP.SPR.alvo(c,W/2,H/2,u,tm,nomeNivelEsp(a.t)); }); }
  else if(tipo==='terra') espCanvas(el,1,1,(c,W,H,u,tm)=>ESP.SPR.neb(c,W/2,H/2,u,tm,(a.x*3+a.y)||0));
  else if(tipo==='carro') espCanvas(el,1.3,1.3,(c,W,H,u,tm)=>ESP.SPR.nave(c,W/2,H/2,u,tm,nomeNivelEsp(S.carro?S.carro.t:a.t)));
}

// ---------- o céu atrás de tudo ----------
let ceu=null, ceuF=null, ceuChave='';
function ceuDesenha(t){
  if(!ceu){ ceu=document.createElement('canvas'); ceu.id='ceu'; document.body.prepend(ceu); }
  // no menu, céu sem planeta de fundo: os planetas aparecem conforme a pessoa descobre (em volta do nome)
  const menu=!!document.getElementById('scrMenu')?.classList.contains('on');
  const w=innerWidth, h=innerHeight, tema=Math.max(1,(S&&S.missao&&S.tema)||1), chave=w+'x'+h+':'+tema+(menu?':menu':'');
  if(chave!==ceuChave){ ceuChave=chave; ceu.width=w; ceu.height=h; ceuF=ESP.buildFundo(w,h,ESP.MUNDOS_ESP[(tema-1)%ESP.MUNDOS_ESP.length],{jogo:true,planeta:!menu}); }
  ESP.drawFundo(ceu.getContext('2d'),ceuF,t);
}
// chamado no lugar do cenário da mina
function espCenario(){
  const on = espTela();
  document.body.classList.toggle('espaco', on); document.documentElement.classList.toggle('espaco', on);
  if(on){ $('#cenario').innerHTML=''; espInicia(); }
  return on;
}

// ---------- telas do Clássico no espaço: menu, lista de fases, informação, resultado ----------
// o espaço vale no menu, na lista de fases e dentro das fases do Clássico (a Mineração e o Laboratório seguem na mina)
function espTela(){
  if(!espacoLigado()) return false;
  if(document.getElementById('scrMenu')?.classList.contains('on')) return true;
  return espFig();
}
// as figuras de pedrinha viram planetas (metas, receitas, painel, lista)
function espFig(){ return espacoLigado() && typeof S!=='undefined' && !!S && !!(S.missao || S.infinito || S.phase==='lista'); }

// canvas de tamanho fixo (em px de tela), fora do tabuleiro
function espCanvasFixo(cv, w, h, desenha){
  cv.classList.add('espFix'); cv.style.width=w+'px'; cv.style.height=h+'px'; cv._fw=w; cv._fh=h; cv._d=desenha; ESPC.add(cv); espInicia(); return cv;
}

// fotos paradas para usar dentro dos SVG do jogo
const URL_ESP={};
const urlPlaneta = t => URL_ESP['p'+t] || (espInicia(), URL_ESP['p'+t]=ESP.pecaImg(nomeNivelEsp(t),0,160).toDataURL());
const urlObj = k => URL_ESP[k] || (espInicia(), URL_ESP[k]=ESP.objImg(k,160,0).toDataURL());
const CORES_AURA=['#a77bdf','#6fbf5a'];
function planetaInner(t,cor){
  let anel='';
  if(cor===0||cor===1) anel=`<circle cx="50" cy="50" r="47" fill="none" stroke="${CORES_AURA[cor]}" stroke-width="5" opacity=".85"/>`;
  else if(cor===2) anel=`<path d="M50 3 A47 47 0 0 0 50 97" fill="none" stroke="${CORES_AURA[0]}" stroke-width="5" opacity=".85"/><path d="M50 3 A47 47 0 0 1 50 97" fill="none" stroke="${CORES_AURA[1]}" stroke-width="5" opacity=".85"/>`;
  return `${anel}<image href="${urlPlaneta(t)}" x="0" y="0" width="100" height="100"/>`;
}
const fotoEsp=(k,f)=>URL_ESP[k]||(espInicia(),URL_ESP[k]=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=160;f(cv.getContext('2d'));return cv.toDataURL();})());
const buracoInner = t => `<image href="${fotoEsp('b'+t,c=>ESP.SPR.buraco(c,80,80,150,1.3,corNivel(t)))}" x="0" y="0" width="100" height="100"/>`;
const buracoVetor = t => `<ellipse cx="50" cy="56" rx="46" ry="13" fill="none" stroke="${corNivel(t)}" stroke-width="7" opacity=".85"/><circle cx="50" cy="56" r="21" fill="#000" stroke="#ffe6c8" stroke-width="3"/><path d="M4 56 A46 13 0 0 0 96 56" fill="none" stroke="${corNivel(t)}" stroke-width="7"/>`;
const lixoInner = () => `<image href="${urlObj('lixo')}" x="0" y="0" width="100" height="100"/>`;
const estacaoInner = () => `<image href="${urlObj('estacao')}" x="0" y="0" width="100" height="100"/>`;
const nebInner = () => `<image href="${fotoEsp('neb',c=>ESP.SPR.neb(c,80,80,170,2,3))}" x="0" y="0" width="100" height="100"/>`;
const nebVetor = () => `<defs><radialGradient id="nebEsp"><stop offset="0" stop-color="#5a3c30" stop-opacity=".95"/><stop offset="1" stop-color="#5a3c30" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="url(#nebEsp)"/><circle cx="34" cy="40" r="2" fill="#c49a78"/><circle cx="62" cy="58" r="2.4" fill="#c49a78"/><circle cx="56" cy="32" r="1.6" fill="#c49a78"/>`;
const naveInner = t => `<path d="M42 52 L58 52 L80 98 L20 98Z" fill="#8cebff" opacity=".35"/><image href="${urlPlaneta(t)}" x="33" y="62" width="34" height="34" opacity=".7"/><image href="${urlObj('nave')}" x="4" y="0" width="92" height="64"/>`;
const gaiolaInner = () => [0,60,120].map(a=>`<ellipse cx="50" cy="50" rx="47" ry="17" fill="none" stroke="#a6ecff" stroke-width="3" transform="rotate(${a-25} 50 50)"/>`).join('');
const ICO_PICARETA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 8.5C8 4.5 16 4.5 19.5 8.5"/><path d="M12 6.2L5.5 20"/></svg>';
const ICO_FRASCO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/></svg>';

// nível do planeta da meta principal de uma fase (null quando a meta não é um planeta)
function tAlvo(m){
  const o=metasDe(m)[0]||{};
  return o.forme || (o.cor!=null?o.t:0) || (o.quebre?Math.max(1,o.quebre):0) || (o.seq?o.seq[o.seq.length-1]:0) || o.alvo || o.leve || o.solte || o.carrinho || null;
}
function icoMetaEsp(m){
  const o=metasDe(m)[0]||{};
  if(o.pontos) return `<svg class="mPl" viewBox="0 0 100 100"><path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38Z" fill="#f2b33d" stroke="#2e2219" stroke-width="4" stroke-linejoin="round"/></svg>`;
  if(o.combo) return `<svg class="mPl" viewBox="0 0 100 100"><text x="50" y="64" text-anchor="middle" font-size="40" font-weight="700" fill="#ece3f7" font-family="Exo 2, sans-serif">2×</text></svg>`;
  if(o.terra) return `<svg class="mPl" viewBox="0 0 100 100">${nebInner()}</svg>`;
  const t=tAlvo(m); return t ? `<img class="mPl" data-t="${t}" alt="">` : '';
}
// a lista tem muitas fases: o planeta de cada uma só é gerado quando ela aparece na tela
let ioLista=null;
function espListaPlanetas(raiz){
  ioLista?.disconnect();
  ioLista=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return; const im=e.target; ioLista.unobserve(im);
    (window.requestIdleCallback||setTimeout)(()=>{ im.src=urlPlaneta(+im.dataset.t); }); }),{rootMargin:'200px'});
  raiz.querySelectorAll('img.mPl[data-t]').forEach(im=>ioLista.observe(im));
}

// textos do espaço para a janela da fase
const COMO_ESP = {
  alvo:'Órbita dourada: forme o planeta pedido em cima dela, juntando ali (maior também vale).',
  leve:'Órbita dourada: leve até ela exatamente o planeta pedido e pare em cima. Juntar em cima da órbita não vale.',
  terra:'Nebulosa escura: uma junção em cima desfaz a nuvem.',
  solte:'Gaiola de luz: o planeta preso não sai do lugar, mas aceita junção. Junte um igual nele para soltar.',
  carrinho:'Nave: o planeta do tamanho pedido, ou maior, que parar embaixo dela é recolhido.',
  combo:'Duas junções no mesmo arrasto contam uma vez.',
  seq:'Em ordem: cada planeta só conta depois do anterior.',
  proibido:'Se formar o planeta proibido, a fase acaba.',
};
const COMO_FASE_ESP = {
  cores:'Cada peça tem uma aura roxa ou verde: só junta com a mesma cor.',
  picareta:'Nascem buracos negros: cada um engole o planeta da cor dele.',
};
function regrasEsp(m){
  const fase=faseDe(m), fm=formaDe(m), n=PATHS[fase].n, tam = fm ? `${fw(fm)}x${fh(fm)}` : `${m.w||n||4}x${m.h||m.w||n||4}`;
  return `${tam} · ${arrastosTxt(m)}${charDe(m)==='passinho'?' · Passinho':''}${m.regras?.spawns===0?' · não nasce peça nova':''}`;
}
function explicaEsp(m){
  const fase=faseDe(m), out=[];
  if(n1(m)) out.push('Arraste para juntar peças iguais: duas iguais viram a do nível seguinte.');
  if(COMO_FASE_ESP[fase]) out.push(COMO_FASE_ESP[fase]);
  if(charDe(m)==='passinho') out.push(COMO_CHAR.passinho);
  for(const o of objsDe(m)) for(const k of Object.keys(COMO_ESP)) if(o[k]!==undefined && !out.includes(COMO_ESP[k])) out.push(COMO_ESP[k]);
  if(m.regras?.spawns===0) out.push('Quebra-cabeça: não nasce peça nova. Pense antes de arrastar.');
  return out;
}
const n1 = m => MISSOES.indexOf(m)===0;

// planeta grande nas janelas (fase, vitória, derrota)
function espPlanetaGrande(cv, t, modo){
  const r=ESP.LADDER.length, pt=Array.from({length:46},(_,i)=>({a:i*2.39996,v:.6+((i*37)%10)/10,f:((i*53)%100)/100}));
  const lado = innerHeight<600 ? 70 : innerHeight<720 ? 92 : 130;   // tela baixa: planeta menor, para a janela caber sem rolar
  espCanvasFixo(cv,lado,lado,(c,W,H,u,tm)=>{ const x=W/2,y=H/2, nome=nomeNivelEsp(t);
    if(modo==='vit'){ c.save(); c.globalCompositeOperation='lighter'; for(const p of pt){ const k=(tm*.45*p.v+p.f)%1, d=W*.5*(.35+.62*k), s=W*.012*(1+1.4*(1-k));
        c.fillStyle=`rgba(255,226,150,${((1-k)*.9).toFixed(2)})`; c.fillRect(x+Math.cos(p.a)*d-s/2,y+Math.sin(p.a)*d-s/2,s,s); } c.restore();
      ESP.drawPeca(c,nome,tm,x,y,W*.74,1,true); }
    else if(modo==='der'){ ESP.drawPeca(c,nome,tm,x,y,W*.7,.75,true); c.globalCompositeOperation='source-atop'; c.fillStyle='rgba(20,14,40,.45)'; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
    else{ const g=c.createRadialGradient(x,y,0,x,y,W/2); g.addColorStop(0,'rgba(255,255,255,.14)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,W,H); ESP.drawPeca(c,nome,tm,x,y,W*.86,1,true); } });
}

// ---------- menu ----------
// ---------- descobertas: o céu do menu mostra só o que a pessoa já formou ----------
// ptui_desc = maior nível já formado no espaço. Sem registro ainda, parte das fases já cumpridas.
function DESC(){
  if(localStorage.ptui_desc==null){ let mx=1; const r=MISS(); for(const k of Object.keys(r)){ const m=MISSOES[k-1]; const t=m&&r[k].e&&tAlvo(m); if(t>mx) mx=t; } localStorage.ptui_desc=mx; }
  return +localStorage.ptui_desc||1;
}
function espDescobre(r){ if(!espacoLigado()) return; let mx=0; for(const o of r.merges) if(o.t>mx) mx=o.t; if(mx>DESC()) localStorage.ptui_desc=Math.min(mx,ESP.LADDER.length); }

// cinturão de pedras em volta do nome (a Poeira, o 2): está lá desde o começo
let CINTO=null;
function cinto(){ if(CINTO) return CINTO; let s=12345;
  const r=()=>{ s=(s+0x6D2B79F5)|0; let q=Math.imul(s^s>>>15,1|s); q=q+Math.imul(q^q>>>7,61|q)^q; return ((q^q>>>14)>>>0)/4294967296; };
  const cores=['#8a7a68','#a8957c','#6f6355','#c9b08a','#d9c49a','#5d5248'];
  CINTO=Array.from({length:200},()=>{ const g=(r()+r()+r())/3-.5, pedra=r()<.13;
    return {a:r()*6.2832, dr:g*.34, dy:(r()-.5)*.12, s:pedra?2.4+2.4*r():.8+1.2*r(), pedra, c:cores[Math.floor(r()*cores.length)], v:.85+.3*r(),
      forma:Array.from({length:6},()=>.7+.3*r()), rot:r()*6.28, gira:(r()-.5)*1.4}; });
  return CINTO; }
function pedrinha(c,x,y,R,p,t){ c.save(); c.translate(x,y); c.rotate(p.rot+p.gira*t); c.beginPath();
  p.forma.forEach((k,i)=>{ const a=i/6*6.2832; i?c.lineTo(Math.cos(a)*R*k,Math.sin(a)*R*k):c.moveTo(Math.cos(a)*R*k,Math.sin(a)*R*k); }); c.closePath();
  c.fillStyle=p.c; c.fill(); c.fillStyle='rgba(255,240,215,.28)'; c.beginPath(); c.arc(-R*.25,-R*.25,R*.45,0,7); c.fill(); c.restore(); }
// tamanho de cada nível na órbita do menu (px numa tela de 360)
const TAM_ORB=[0,0,30,32,34,42,36,40,42,44,50,54,58,92,104,78,82,92,98];
function espLogo(c,W,H,u,t){
  const Q=Math.min(W/360, H/266), cx=W/2, cy=H*.5, rx=158*Q, ry=60*Q, tl=-.14, ct=Math.cos(tl), st=Math.sin(tl);
  const lugar=(a,f=1,dy=0)=>{ const x0=Math.cos(a)*rx*f, y0=Math.sin(a)*ry*f+dy*ry; return [cx+x0*ct-y0*st, cy+x0*st+y0*ct]; };
  // o que já foi descoberto, do Gelo para cima (no máximo os 6 maiores)
  const d=DESC(), niveis=[]; for(let k=d;k>=2&&niveis.length<6;k--) niveis.push(k);
  const corpos=niveis.map((k,i)=>{ const a=t*.22+i*2*Math.PI/niveis.length, [x,y]=lugar(a); return {n:nomeNivelEsp(k), sz:TAM_ORB[k]*Q, x, y, z:Math.sin(a)}; });
  const pedras=cinto().map(p=>{ const a=p.a+t*.1*p.v, [x,y]=lugar(a,1+p.dr,p.dy); return {p,x,y,z:Math.sin(a)}; });
  const poe=(lado)=>{ // lado<0: atrás do nome (metade de cima da órbita); lado>0: na frente (metade de baixo)
    for(const q of pedras){ if((q.z<0)!==(lado<0)) continue; const k=.72+.4*(q.z+1)/2;
      c.globalAlpha=.5+.5*(q.z+1)/2; if(q.p.pedra) pedrinha(c,q.x,q.y,q.p.s*Q*k,q.p,t); else { c.fillStyle=q.p.c; c.beginPath(); c.arc(q.x,q.y,q.p.s*Q*k,0,7); c.fill(); } }
    c.globalAlpha=1;
    corpos.filter(b=>(b.z<0)===(lado<0)).sort((a,b)=>a.z-b.z).forEach(b=>ESP.drawPeca(c,b.n,t,b.x,b.y,b.sz,1,true,.72+.28*(b.z+1)/2)); };
  poe(-1);
  // nome: 2048 grande e STARS embaixo, espaçado
  c.save(); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f4fbff';
  for(const [txt,px,dy,esp] of [['2048',78,-12,0],['STARS',27,40,.42]]){ c.font=`900 ${px*Q}px Orbitron, sans-serif`; if('letterSpacing' in c) c.letterSpacing=(esp*px*Q)+'px';
    c.shadowColor='rgba(110,230,255,.95)'; c.shadowBlur=26*Q; c.fillText(txt,cx+(esp*px*Q)/2,cy+dy*Q); c.shadowColor='rgba(230,100,255,.7)'; c.shadowBlur=10*Q; c.fillText(txt,cx+(esp*px*Q)/2,cy+dy*Q); }
  c.restore();
  poe(1);
}
// o menu inteiro cabe na tela: o desenho do nome encolhe o quanto precisar (os botões ficam do tamanho certo para o dedo)
function ajustaMenu(){
  const menu=$('#scrMenu'), lg=$('#logoEsp'); if(!lg || !menu.classList.contains('on') || !document.body.classList.contains('espaco')) return;
  const vis=[...menu.children].filter(e=>e.offsetParent!==null); if(!vis.length) return;
  const alto=vis[vis.length-1].getBoundingClientRect().bottom-vis[0].getBoundingClientRect().top, resto=alto-lg.offsetHeight;
  const w=Math.min(360, innerWidth-16), h=Math.round(Math.max(110, Math.min(w*.74, innerHeight-28-resto)));
  if(Math.abs(h-(lg._fh||0))>1) espCanvasFixo(lg, w, h, espLogo);
}
addEventListener('resize', ()=>requestAnimationFrame(ajustaMenu));
let TAG_MINA=null;
function espMenu(){
  const on=espTela(), menu=$('#scrMenu'), tag=menu.querySelector('.tagline');
  if(TAG_MINA==null) TAG_MINA=tag.textContent;
  tag.textContent = on ? 'junte poeira até virar galáxia' : TAG_MINA;
  document.title = on ? '2048 Stars' : 'Ptui!';
  // no espaço: Novo jogo (vai ao mapa), Continuar (só para quem já tem progresso) e Clássico (4x4 sem fim)
  $('#mCla').innerHTML = on ? 'Novo jogo<small>a jornada, fase a fase</small>' : 'Clássico<small>uma missão em cada fase</small>';
  $('#mCla').onclick = on ? novoJogoEsp : missoesLista;
  if(!$('#mSegue')){ const b=document.createElement('button'); b.className='btn b big'; b.id='mSegue'; b.textContent='Continuar'; b.onclick=continuarEsp; $('#mCla').after(b); }
  const tem=temProgresso(), r=MISS(), est=Object.values(r).reduce((a,x)=>a+(x.e||0),0);
  $('#mSegue').style.display = on && tem ? '' : 'none';
  if(on && tem) $('#mSegue').innerHTML = `Continuar<small>fase ${faseAtual()} · ${est} ${est===1?'estrela':'estrelas'}</small>`;
  if(!$('#mInf')){ const b=document.createElement('button'); b.className='btn b big'; b.id='mInf'; b.innerHTML='Clássico<small>4x4 sem fim, até não caber mais nada</small>'; b.onclick=infinitoJoga; $('#mCla').after(b); }
  // o Clássico vem depois do Novo jogo e do Continuar
  $('#mSegue').after($('#mInf'));
  // Como jogar: no espaço abre o do 2048 Stars; fora dele, o tutorial da mina
  const tut=$('#mTut'); if(tut.onclick!==comoJogarEsp) TUT_MINA=tut.onclick; tut.onclick = on ? comoJogarEsp : TUT_MINA;
  if(!$('#mOpc')){ const b=document.createElement('button'); b.className='btn dim big'; b.id='mOpc'; b.textContent='Opções'; b.onclick=espOpcoes; tut.after(b); }
  $('#mOpc').style.display = on ? '' : 'none';
  if(!on) return;
  if(document.fonts?.load){ document.fonts.load("900 40px Orbitron"); document.fonts.load("700 20px 'Exo 2'"); }
  let lg=$('#logoEsp');
  if(!lg){ lg=document.createElement('canvas'); lg.id='logoEsp'; menu.insertBefore(lg, menu.firstChild); }
  const w=Math.min(360, innerWidth-16); if(!lg._fh) espCanvasFixo(lg, w, Math.round(w*.74), espLogo);
  requestAnimationFrame(ajustaMenu); document.fonts?.ready?.then(()=>requestAnimationFrame(ajustaMenu));
  if(!$('#ovos')){
    const d=document.createElement('div'); d.id='ovos';
    d.innerHTML=`<button id="ovoMina" aria-label="Mineração">${ICO_PICARETA}</button><button id="ovoLab" aria-label="Laboratório">${ICO_FRASCO}</button>`;
    menu.appendChild(d);
    $('#ovoMina').onclick=()=>{ if(localStorage.mina_save) loadGame(); else newGameClick(); };
    $('#ovoLab').onclick=labPainel;
  }
}

// ---------- novo jogo e continuar ----------
const temProgresso = () => Object.keys(MISS()).length>0 || !!localStorage.mina_cla_save;
function faseAtual(){ const r=MISS(); return (MISSOES.findIndex((m,i)=>!(r[i+1]?.e)) + 1) || MISSOES.length; }
// sem progresso, vai direto ao mapa; com progresso, pergunta antes de apagar tudo
function novoJogoEsp(){
  if(!temProgresso()){ missoesLista(); return; }
  janelaMenu();
  showOverlay(`<h2>Começar do zero?</h2><p>Suas estrelas e as fases liberadas serão apagadas.</p>
    <button class="btn g" id="nZera">Começar do zero</button><button class="btn dim" id="nVolta">Voltar</button>`);
  $('#nZera').onclick=()=>{ localStorage.removeItem('mina_missoes'); localStorage.removeItem('mina_cla_save'); hideOverlay(); missoesLista(); };
  $('#nVolta').onclick=fechaJanelaMenu;
}
// fase pela metade: volta nela; senão abre o mapa já com a próxima fase
function continuarEsp(){
  const sv=JSON.parse(localStorage.mina_cla_save||'null');
  if(sv && MISSOES[sv.n-1]){ missoesLista(); missaoJoga(sv.n,{retoma:true}); return; }
  missoesLista(); missaoInfo(faseAtual());
}

// ---------- opções ----------
let TUT_MINA=null;
// janela aberta no menu principal: ganha uma entrada no histórico, para o voltar do celular fechar a janela e não sair do jogo
const noMenu = () => $('#scrMenu').classList.contains('on');
function janelaMenu(){ if(noMenu()) guardaVolta(); }
function fechaJanelaMenu(){ hideOverlay(); if(noMenu() && history.state && history.state.ptui) history.back(); }
function espOpcoes(){
  janelaMenu();
  showOverlay(`<h2>Opções</h2>
    <button class="btn dim" id="oMus">Música: ${music?'ligada':'desligada'}</button>
    <button class="btn dim" id="oSnd">Efeitos sonoros: ${sound?'ligados':'desligados'}</button>
    <button class="btn dim" id="oCred">Créditos</button>
    <button class="btn b" id="oOk">Voltar</button>`);
  $('#oMus').onclick=()=>{ toggleMusic(); espOpcoes(); };
  $('#oSnd').onclick=()=>{ toggleSound(); espOpcoes(); };
  $('#oCred').onclick=()=>{ showOverlay(`<h2>Créditos</h2><ul>
      <li><b>Jogo:</b> Guilherme Franco.</li>
      <li><b>Planetas, texturas e cenário:</b> gerados por código, inspirados em imagens da NASA e da ESA.</li>
      <li><b>Músicas:</b> trilhas do jogo O Gabinete, todas sintetizadas.</li>
      <li><b>Fontes:</b> Orbitron e Exo 2 (SIL Open Font License).</li>
    </ul><button class="btn b" id="oVolta">Voltar</button>`); $('#oVolta').onclick=espOpcoes; };
  $('#oOk').onclick=fechaJanelaMenu;
}

// ---------- como jogar ----------
// três telas: o arrasto (animado), a escada inteira e os dois modos
function cjCasa(c,x,y,pa){ c.beginPath(); c.arc(x,y,pa*.39,0,7); c.fillStyle='rgba(16,12,38,.55)'; c.fill(); c.lineWidth=Math.max(1,pa*.012); c.strokeStyle='rgba(190,170,255,.25)'; c.stroke(); }
const cjEase = k => k<=0?0:k>=1?1:k*k*(3-2*k);
function cjArrasto(c,W,H,u,t){
  const pa=W/4, cy=pa*.5, s=t%3.6, P1=nomeNivelEsp(1), P2=nomeNivelEsp(2), x=i=>(i+.5)*pa, uu=pa*.82;
  const fade = s>3.2 ? 1-(s-3.2)/.4 : s<.15 ? s/.15 : 1;
  for(let i=0;i<4;i++) cjCasa(c,x(i),cy,pa);
  // o dedo: um ponto aceso que corre da direita para a esquerda, em baixo
  if(s>.2 && s<1.15){ const k=cjEase((s-.2)/.8), fx=W*(.88-.76*k), fy=pa*1.12;
    const g=c.createLinearGradient(fx,0,Math.min(W,fx+pa*1.4),0); g.addColorStop(0,'rgba(110,230,255,.8)'); g.addColorStop(1,'rgba(110,230,255,0)');
    c.strokeStyle=g; c.lineWidth=pa*.07; c.lineCap='round'; c.beginPath(); c.moveTo(fx,fy); c.lineTo(Math.min(W*.9,fx+pa*1.4),fy); c.stroke();
    c.fillStyle='#bff4ff'; c.shadowColor='rgba(110,230,255,.95)'; c.shadowBlur=pa*.2; c.beginPath(); c.arc(fx,fy,pa*.08,0,7); c.fill(); c.shadowBlur=0; }
  const k=cjEase((s-.55)/.4);
  if(s<.95){ ESP.drawPeca(c,P1,t,x(1-k),cy,uu,fade); ESP.drawPeca(c,P1,t,x(3-3*k),cy,uu,fade); }
  else{ const p=s<1.3 ? 1+.35*Math.sin(Math.PI*(s-.95)/.35) : 1;
    if(s<1.4){ const r=(s-.95)/.45; c.strokeStyle=`rgba(191,244,255,${(1-r).toFixed(2)})`; c.lineWidth=pa*.04; c.beginPath(); c.arc(x(0),cy,pa*(.2+.3*r),0,7); c.stroke(); }
    ESP.drawPeca(c,P2,t,x(0),cy,uu,fade,false,p); }
  if(s>1.45) ESP.drawPeca(c,P1,t,x(3),cy,uu,fade,false,cjEase((s-1.45)/.3));
}
function cjEscada(c,W,H,u,t){
  const col=6, pa=W/col, ph=pa*1.36; c.textAlign='center'; c.textBaseline='middle';
  ESP.LADDER.forEach((d,i)=>{ const x=(i%col+.5)*pa, y=Math.floor(i/col)*ph+pa*.5;
    ESP.drawPeca(c,d.n,t,x,y,pa*.74,1,true);
    c.font=`800 ${pa*.15}px 'Exo 2',sans-serif`; c.fillStyle='#f2b33d'; c.fillText(String(2**(i+1)),x,y+pa*.5);
    c.font=`700 ${pa*(d.n.length>8?.13:.15)}px 'Exo 2',sans-serif`; c.fillStyle='#f1eefc'; c.fillText(d.n,x,y+pa*.69); });
}
function comoJogarEsp(p){
  if(typeof p!=='number') p=0;
  janelaMenu();
  const w=Math.min(300, innerWidth-90), ult=2;
  const telas=[
    `<h2>Como jogar</h2><canvas id="cjCv" class="cjCv"></canvas>
     <p>Arraste o dedo para qualquer lado, em qualquer lugar da tela: todas as peças deslizam juntas.</p>
     <p>Duas iguais que se encontram viram a próxima da escada. A cada arrasto nasce uma peça nova.</p>`,
    `<h2>A escada</h2><canvas id="cjCv" class="cjCv"></canvas>
     <p>Cada junção sobe um degrau. Quanto mais alto, mais pontos.</p>`,
    `<h2>Dois modos</h2>
     <p><b>Clássico:</b> o 4x4 sem fim. Junte até não caber mais nada e bata o seu recorde.</p>
     <p><b>Jornada:</b> fases com uma missão cada. Quanto menos arrastos você usar, mais estrelas. Algumas fases não têm limite de arrastos: só acabam se o tabuleiro encher. Cada novidade é explicada na fase em que aparece.</p>`,
  ];
  const pontos=telas.map((_,i)=>`<i class="${i===p?'on':''}"></i>`).join('');
  showOverlay(telas[p]+`<div class="cjDots">${pontos}</div><div class="cjNav">
    <button class="btn dim" id="cjAnt">${p?'‹ Voltar':'Fechar'}</button>
    <button class="btn b" id="cjProx">${p<ult?'Próximo ›':'Jogar'}</button></div>`);
  const cv=$('#cjCv');
  if(cv) espCanvasFixo(cv, w, p===0 ? Math.round(w/4*1.3) : Math.round(w/6*(1.36*2+1.36)), p===0 ? cjArrasto : cjEscada);
  $('#cjAnt').onclick=()=>{ if(p) comoJogarEsp(p-1); else fechaJanelaMenu(); };
  $('#cjProx').onclick=()=>{ if(p<ult) comoJogarEsp(p+1); else infinitoJoga(); };
}

// ---------- nomes do espaço (os nomes da mina continuam em missoes.js: os testes acham as fases por eles) ----------
const MUNDOS_NOME_ESP = MUNDOS.map(m=>[m.nome, m.desc]);
const FASES_NOME_ESP = {};   // a Jornada 2 já nasce com os nomes do espaço em missoes.js
// nome da fase e do mundo conforme o modo (mina ou espaço)
const nomeFaseCla = n => (espFig() && FASES_NOME_ESP[n]) || MISSOES[n-1].nome;
const nomeMundoCla = gi => espFig() ? MUNDOS_NOME_ESP[gi] : [MUNDOS[gi].nome, MUNDOS[gi].desc];
// textos das metas que mudam no espaço (null: usa o texto de sempre)
function objetivoEsp(o){
  if(o.quebre) return o.quebre<=1 ? `Engula ${o.n} peça${o.n>1?'s':''} com o buraco negro` : `Engula ${qtd(o.n,o.quebre)} com o buraco negro`;
  if(o.leve) return (o.n||1)>1 ? `Leve ${artigo(rockName(o.leve))} ${rockName(o.leve)} até cada órbita dourada` : `Leve ${artigo(rockName(o.leve))} ${rockName(o.leve)} até a órbita dourada`;
  if(o.alvo) return (o.n||1)>1 ? `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} em cada órbita dourada` : `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} na órbita dourada`;
  if(o.terra) return `Desfaça a nebulosa de ${o.terra} casas`;
  if(o.carrinho) return `Leve ${qtd(o.n,o.carrinho)} até a nave`;
  return null;
}
function rotuloEsp(o){
  if(o.quebre) return 'engolidas'; if(o.alvo) return 'órbitas douradas'; if(o.leve) return 'na órbita dourada'; if(o.carrinho) return 'na nave'; if(o.terra) return 'nebulosa desfeita';
  return null;
}
// ícone de cada mundo no cabeçalho da lista de fases
function icoMundoEsp(gi){
  const img = u => `<image href="${u}" x="4" y="4" width="92" height="92"/>`;
  const orbita = () => `<image href="${fotoEsp('orbita',c=>ESP.SPR.alvo(c,80,80,150,1,'Rocha'))}" x="0" y="0" width="100" height="100"/>`;
  const inner = [()=>planetaInner(1), estacaoInner, ()=>img(urlObj('rochinha')), orbita, ()=>img(urlObj('nave')), lixoInner, nebInner, orbita, gaiolaInner, ()=>planetaInner(6,0)][gi] || (()=>planetaInner(1));
  return `<svg class="espIco" viewBox="0 0 100 100">${inner()}</svg>`;
}
