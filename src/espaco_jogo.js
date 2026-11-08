
// ===================== CLÁSSICO NO ESPAÇO =====================
// Liga com ?espaco no endereço (desliga com ?espaco=0); a escolha fica guardada no aparelho.
// Esta etapa troca o tabuleiro do Clássico: peças viram corpos celestes 3D, e bloco, mureta, terra, torrão,
// presa, carrinho, picareta e cores ganham os equivalentes do espaço. O motor é o src/espaco.js (objeto ESP).
(()=>{ const m=location.search.match(/[?&]espaco(?:=(\d))?/); if(m) localStorage.ptui_espaco = m[1]==='0' ? '0' : '1'; })();
function espacoLigado(){ return localStorage.ptui_espaco==='1'; }
function noEspaco(){ return espacoLigado() && !!(typeof S!=='undefined' && S && S.missao); }
// nome do nível no espaço (null fora do Clássico no espaço)
function nomeEspaco(t){ if(!ESP || t<1 || !noEspaco()) return null; return nomeNivelEsp(t); }
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
    const W=Math.max(8,Math.round(cel*cv._kx)), H=Math.max(8,Math.round(cel*cv._ky));
    if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
    const c=cv.getContext('2d'); c.clearRect(0,0,W,H); cv._d(c,W,H,cel,t);
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
    else ESP.drawPeca(c,nomeNivelEsp(T.t),tm,x,y,u);
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
  const w=innerWidth, h=innerHeight, tema=Math.max(1,(S&&S.tema)||1), chave=w+'x'+h+':'+tema;
  if(chave!==ceuChave){ ceuChave=chave; ceu.width=w; ceu.height=h; ceuF=ESP.buildFundo(w,h,ESP.MUNDOS_ESP[(tema-1)%ESP.MUNDOS_ESP.length],{jogo:true}); }
  ESP.drawFundo(ceu.getContext('2d'),ceuF,t);
}
// chamado no lugar do cenário da mina
function espCenario(){
  const on = noEspaco() && $('#scrGame').classList.contains('on');
  document.body.classList.toggle('espaco', on); document.documentElement.classList.toggle('espaco', on);
  if(on){ $('#cenario').innerHTML=''; espInicia(); }
  return on;
}
