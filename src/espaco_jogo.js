
// ===================== CLÁSSICO NO ESPAÇO =====================
// Liga com ?espaco no endereço (desliga com ?espaco=0); a escolha fica guardada no aparelho.
// Esta etapa troca o tabuleiro do Clássico: peças viram corpos celestes 3D, e bloco, mureta, terra, torrão,
// presa, carrinho, picareta e cores ganham os equivalentes do espaço. O motor é o src/espaco.js (objeto ESP).
(()=>{ const m=location.search.match(/[?&]espaco(?:=(\d))?/); if(m) localStorage.ptui_espaco = m[1]==='0' ? '0' : '1'; })();
function espacoLigado(){ return localStorage.ptui_espaco==='1'; }
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
}

// ícone do planeta no meio do texto (uma foto parada, guardada depois da primeira vez)
const ICO_PL={};
function icoPlaneta(t){ if(ICO_PL[t]) return ICO_PL[t]; espInicia(); return ICO_PL[t]=`<img class="ico" alt="" src="${ESP.pecaImg(nomeNivelEsp(t),0,96).toDataURL()}">`; }

// ---------- peças ----------
function espAura(c,x,y,u,t,cor){
  if(cor!==2){ ESP.SPR.aura(c,x,y,u,t,cor); return; }
  for(const [k,x0] of [[0,0],[1,x]]){ c.save(); c.beginPath(); c.rect(x0,0,x,c.canvas.height); c.clip(); ESP.SPR.aura(c,x,y,u,t,k); c.restore(); }
}
function espTile(el,t){
  el._t=t;
  const key=[t.t,t.c,t.k,t.presa?1:0].join(':'); if(el.dataset.ek===key) return; el.dataset.ek=key;
  const f=el.firstChild; f.querySelectorAll('svg').forEach(s=>s.remove());
  const k = t.t===0||t.k==='p' ? 1 : kNivel(t.t), kk = Math.max(1.15, k + (t.c!=null ? .1 : 0));
  el.style.zIndex = String(10 + Math.round((2 - Math.min(2,k))*10));   // os pequenos ficam por cima dos anéis dos grandes
  espCanvas(f, kk, kk, (c,W,H,u,tm)=>{ const T=el._t, x=W/2, y=H/2;
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
  const w=innerWidth, h=innerHeight, tema=Math.max(1,(S&&S.missao&&S.tema)||1), chave=w+'x'+h+':'+tema;
  if(chave!==ceuChave){ ceuChave=chave; ceu.width=w; ceu.height=h; ceuF=ESP.buildFundo(w,h,ESP.MUNDOS_ESP[(tema-1)%ESP.MUNDOS_ESP.length],{jogo:true}); }
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
  leve:'Órbita dourada: leve até ela um planeta do nível pedido (maior também vale). Basta parar em cima.',
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
  return `${tam} · ${m.arrastos||'?'} arrastos${charDe(m)==='passinho'?' · Passinho':''}${m.regras?.spawns===0?' · não nasce peça nova':''}`;
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
  espCanvasFixo(cv,130,130,(c,W,H,u,tm)=>{ const x=W/2,y=H/2, nome=nomeNivelEsp(t);
    if(modo==='vit'){ c.save(); c.globalCompositeOperation='lighter'; for(const p of pt){ const k=(tm*.45*p.v+p.f)%1, d=W*.5*(.35+.62*k), s=W*.012*(1+1.4*(1-k));
        c.fillStyle=`rgba(255,226,150,${((1-k)*.9).toFixed(2)})`; c.fillRect(x+Math.cos(p.a)*d-s/2,y+Math.sin(p.a)*d-s/2,s,s); } c.restore();
      ESP.drawPeca(c,nome,tm,x,y,W*.74,1,true); }
    else if(modo==='der'){ ESP.drawPeca(c,nome,tm,x,y,W*.7,.75,true); c.globalCompositeOperation='source-atop'; c.fillStyle='rgba(20,14,40,.45)'; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; }
    else{ const g=c.createRadialGradient(x,y,0,x,y,W/2); g.addColorStop(0,'rgba(255,255,255,.14)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,W,H); ESP.drawPeca(c,nome,tm,x,y,W*.86,1,true); } });
}

// ---------- menu ----------
const ORB_MENU=[['Lua',38],['Marte',44],['Saturno',104],['Terra',54],['Júpiter',72]];
function espLogo(c,W,H,t){
  const Q=W/360, cx=W/2, cy=H*.52, rx=158*Q, ry=46*Q, tl=-.14;
  const ps=ORB_MENU.map(([n,sz],i)=>{ const a=t*.28+i*2*Math.PI/ORB_MENU.length, x0=Math.cos(a)*rx, y0=Math.sin(a)*ry;
    return {n,sz,x:cx+x0*Math.cos(tl)-y0*Math.sin(tl),y:cy+x0*Math.sin(tl)+y0*Math.cos(tl),z:Math.sin(a)}; });
  c.save(); c.translate(cx,cy); c.rotate(tl); c.strokeStyle='rgba(255,255,255,.2)'; c.lineWidth=1.5*Q; c.setLineDash([6*Q,7*Q]); c.beginPath(); c.ellipse(0,0,rx,ry,0,0,7); c.stroke(); c.restore(); c.setLineDash([]);
  const pl=p=>ESP.drawPeca(c,p.n,t,p.x,p.y,p.sz*Q,1,true,.7+.3*(p.z+1)/2);
  ps.filter(p=>p.z<0).sort((a,b)=>a.z-b.z).forEach(pl);
  c.save(); c.font=`900 ${74*Q}px Orbitron, sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f4fbff';
  c.shadowColor='rgba(110,230,255,.95)'; c.shadowBlur=26*Q; c.fillText('PTUI!',cx,cy); c.shadowColor='rgba(230,100,255,.7)'; c.shadowBlur=10*Q; c.fillText('PTUI!',cx,cy); c.restore();
  ps.filter(p=>p.z>=0).sort((a,b)=>a.z-b.z).forEach(pl);
}
let TAG_MINA=null;
function espMenu(){
  const on=espTela(), menu=$('#scrMenu'), tag=menu.querySelector('.tagline');
  if(TAG_MINA==null) TAG_MINA=tag.textContent;
  tag.textContent = on ? 'junte poeira até virar galáxia' : TAG_MINA;
  // no espaço: Jornada (as missões) e Clássico (4x4 sem fim)
  $('#mCla').innerHTML = on ? 'Jornada<small>uma missão em cada fase</small>' : 'Clássico<small>uma missão em cada fase</small>';
  if(!$('#mInf')){ const b=document.createElement('button'); b.className='btn b big'; b.id='mInf'; b.innerHTML='Clássico<small>4x4 sem fim, até não caber mais nada</small>'; b.onclick=infinitoJoga; $('#mCla').after(b); }
  // no espaço o Clássico vem primeiro, depois a Jornada
  const inf=$('#mInf'); if(on) $('#mCla').before(inf); else $('#mCla').after(inf);
  if(!on) return;
  if(document.fonts?.load){ document.fonts.load("900 40px Orbitron"); document.fonts.load("700 20px 'Exo 2'"); }
  let lg=$('#logoEsp');
  if(!lg){ lg=document.createElement('canvas'); lg.id='logoEsp'; menu.insertBefore(lg, menu.firstChild); }
  const w=Math.min(360, innerWidth-16); espCanvasFixo(lg, w, Math.round(w*.7), espLogo);
  if(!$('#ovos')){
    const d=document.createElement('div'); d.id='ovos';
    d.innerHTML=`<button id="ovoMina" aria-label="Mineração">${ICO_PICARETA}</button><button id="ovoLab" aria-label="Laboratório">${ICO_FRASCO}</button>`;
    menu.appendChild(d);
    $('#ovoMina').onclick=()=>{ if(localStorage.mina_save) loadGame(); else newGameClick(); };
    $('#ovoLab').onclick=labPainel;
  }
}

// ---------- nomes do espaço (os nomes da mina continuam em missoes.js: os testes acham as fases por eles) ----------
const MUNDOS_NOME_ESP = [
  ['Entrada','Formar, pontos e as primeiras metas.'],
  ['Estações','A estação que não sai e os formatos.'],
  ['Rochas e vazios','Fluxos de rochas, formatos e órbitas douradas.'],
  ['Nebulosas','Nebulosas escuras, lixo espacial e planetas presos.'],
  ['Naves','Leve os planetas até a nave.'],
  ['Auras','Cada aura junta com a sua.'],
  ['Buracos negros','Os buracos negros engolem os planetas.'],
  ['Passinho','Tudo anda uma casa por vez.'],
];
const FASES_NOME_ESP = {
  1:'Primeira rocha', 2:'Três rochas', 3:'Primeiro asteroide', 10:'Primeiro cometa',
  13:'A estação que não sai', 14:'Duas estações', 17:'Estação no meio', 19:'Corredor de estações', 20:'Quebra-cabeça das estações', 24:'Salão das estações',
  26:'Primeira órbita dourada', 28:'Duas órbitas douradas', 32:'Quebra-cabeça das rochas', 36:'Fim das rochas',
  37:'Nebulosa leve', 38:'Mais nebulosa', 39:'Nebulosa e asteroides', 40:'Lixo espacial', 43:'Nebulosa no anel', 45:'Presa na nebulosa',
  46:'Tempestade de nebulosa', 47:'Plutão preso', 48:'Fim das nebulosas',
  49:'Primeira nave', 50:'Nave de asteroides', 51:'Nave e pontos', 52:'Nave na cruz', 53:'Nave e órbita', 54:'Nave na nebulosa', 55:'Nave cheia',
  56:'Quebra-cabeça da nave', 57:'Nave de Plutão', 58:'Nave e presa', 59:'Nave no coração', 60:'Fim das naves',
  61:'Aura roxa e verde', 62:'Toda roxa', 63:'Asteroide verde', 64:'Auras no 5x5', 65:'Roxa na órbita', 66:'Em ordem, com aura',
  68:'Quebra-cabeça das auras', 69:'Nebulosa colorida', 70:'Nave colorida', 71:'Plutão roxo', 72:'Fim das auras',
  73:'Primeiro buraco negro', 74:'Gelo no buraco negro', 75:'Engula a rocha', 76:'Pontos de buraco negro', 77:'Buraco negro e órbita',
  78:'Buraco negro e pontos', 79:'Quebra-cabeça do buraco negro', 80:'Asteroide engolido', 81:'Três rochas engolidas', 82:'Cometa engolido',
  83:'Buraco negro grande', 84:'Netuno',
  88:'Passinho na nebulosa', 89:'Passinho e estações', 91:'Passinho e nave', 96:'Fim da viagem',
};
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
  const inner = [()=>planetaInner(1), estacaoInner, ()=>img(urlObj('rochinha')), nebInner, ()=>img(urlObj('nave')), ()=>planetaInner(6,0), ()=>buracoInner(9),
    ()=>'<ellipse cx="34" cy="58" rx="13" ry="20" fill="#cfc6ff"/><ellipse cx="66" cy="42" rx="13" ry="20" fill="#cfc6ff"/>'][gi] || (()=>planetaInner(1));
  return `<svg class="espIco" viewBox="0 0 100 100">${inner()}</svg>`;
}
