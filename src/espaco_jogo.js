
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
function espInicia(){ if(espIniciado) return; espIniciado=true; ESP.buildTextures(); preparaOcioso(); requestAnimationFrame(espLoop); }
// canvas centrado no elemento, kx por ky casas de tamanho; desenha(ctx, W, H, u, t), u = lado da casa em px do canvas
function espCanvas(host, kx, ky, desenha){
  let cv=host.querySelector(':scope > canvas.esp');
  if(!cv){ cv=document.createElement('canvas'); cv.className='esp'; host.appendChild(cv); }
  cv.style.setProperty('--kx',kx); cv.style.setProperty('--ky',ky); cv._kx=kx; cv._ky=ky; cv._d=desenha; cv._feito=false; cv._estatico=false; cv._passo=0; ESPC.add(cv); espInicia(); return cv;
}
// medidor de desempenho: abra o jogo com ?fps no endereço para ver quadros por segundo e quanto cada parte custa
const MEDE=/[?&]fps\b/.test(location.search);
let custoMedio=0, malhaVez=false, medidor=null, medAc={q:0,ceu:0,malha:0,pecas:0,gl:0,longos:0,t0:0,ult:0};
function mostraMedidor(ms,a,b,c,d){
  const A=medAc; A.q++; A.ceu+=a; A.malha+=b; A.pecas+=c; A.gl+=d; if(A.ult && ms-A.ult>25) A.longos++; A.ult=ms; if(!A.t0) A.t0=ms;
  if(ms-A.t0<1000) return;
  if(!medidor){ medidor=document.createElement('div'); medidor.style.cssText='position:fixed;left:4px;bottom:4px;z-index:99;font:600 11px monospace;color:#9fe9ff;background:rgba(0,0,0,.6);padding:3px 6px;border-radius:6px;pointer-events:none;white-space:pre'; document.body.appendChild(medidor); }
  const f=x=>(x/A.q).toFixed(1);
  medidor.textContent=`${Math.round(A.q*1000/(ms-A.t0))} fps · travadas ${A.longos}\ncéu ${f(A.ceu)} · malha ${f(A.malha)} · peças ${f(A.pecas)} · planetas ${f(A.gl)} ms`;
  medAc={q:0,ceu:0,malha:0,pecas:0,gl:0,longos:0,t0:ms,ult:ms};
}
function espLoop(ms){
  requestAnimationFrame(espLoop);
  const t=ms/1000, ceu=document.body.classList.contains('espaco'), p0=performance.now(); tQuadro=t; quadroN++;
  if(S && S.frenesi) try{ freQuadro(t); }catch(e){ console.warn('frenesi',e); anotaErro('frenesi',e); }   // corrente e luzes do Frenesi (frenesi.js)
  // cada camada num try: um erro numa delas não pode travar as outras nem deixar o céu num modo de desenho errado
  if(ceu) try{ ceuDesenha(t); }catch(e){ console.warn('céu',e); anotaErro('céu',e); }
  const p1=performance.now();
  // aparelho apertado (quadro passando de 9 ms em média): a malha passa a 30 quadros por segundo
  malhaVez=!malhaVez;
  const telaJogo=$('#scrGame').classList.contains('on');
  if(ceu && (custoMedio<9 || malhaVez) && document.body.classList.contains('modoCla') && telaJogo) try{ malhaQuadro(t); }catch(e){ console.warn('malha',e); anotaErro('malha',e); }
  const p2=performance.now();
  if(ESPC.size){
    const cel=(typeof cellPx==='function'?cellPx():80)*ESP.DPR;
    for(const cv of ESPC){
      if(!cv.isConnected){ ESPC.delete(cv); continue; }
      if(cv._fw && cv.offsetParent===null) continue;   // canvas fixo escondido (tela fechada): não desenha
      if(!cv._fw && !telaJogo) continue;   // peças do tabuleiro com a tela do jogo fechada (o Clássico deixa o tabuleiro montado ao ir ao menu)
      const W=cv._fw ? Math.round(cv._fw*ESP.DPR) : Math.max(8,Math.round(cel*cv._kx)), H=cv._fh ? Math.round(cv._fh*ESP.DPR) : Math.max(8,Math.round(cel*cv._ky));
      if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; cv._feito=false; }
      if(cv._estatico && cv._feito) continue;   // desenho que não muda com o tempo: o anterior continua valendo
      if(cv._passo && cv._feito && t-cv._tq<cv._passo) continue;   // a pedrinha só muda de quadro a cada _passo: até lá o desenho é o mesmo
      const c=cv.getContext('2d'); c.clearRect(0,0,W,H); cv._d(c,W,H,cv._fw?W:cel,t); cv._feito=true; cv._tq=t;
    }
  }
  const p3=performance.now();
  if(ceu && GLON) glQuadro(t);
  const p4=performance.now();
  if(S && S.frenesi) try{ frePinta(t); }catch(e){ console.warn('frenesi',e); anotaErro('frenesi',e); }   // barra, número e bordas do Frenesi
  const p5=performance.now();
  custoMedio=custoMedio*.95+(p5-p0)*.05;
  if(MEDE) mostraMedidor(ms,p1-p0+(p5-p4),p2-p1,p3-p2,p4-p3);   // o Frenesi conta junto com o céu
}
// ---------- botão voltar do celular ----------
// fora do menu há sempre uma entrada a mais no histórico (guardaVolta). Voltar: fecha a janela aberta; na lista de
// fases vai ao menu; dentro de uma fase abre o menu de pausa; no menu principal sai do jogo, como qualquer app.
function guardaVolta(){ if(!(history.state&&history.state.ptui)) history.pushState({ptui:1},''); }
addEventListener('popstate',()=>{
  const menu=$('#scrMenu').classList.contains('on');
  // no resultado (fase ou Clássico acabados) fechar só a janela deixaria o tabuleiro parado sem botão: volta como o "Ver fases" e o "Menu"
  if(overlayOpen() && !menu && S && S.phase==='fimM'){ missoesLista(); return; }
  if(overlayOpen() && !menu && S && S.phase==='fimI'){ showMenu(); return; }
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
function glCamada(){ let cv=document.getElementById('glPlan'); if(!cv){ cv=document.createElement('canvas'); cv.id='glPlan';
    // a placa de vídeo perdeu ou devolveu o contexto: decide de novo quem desenha os planetas e repinta as peças paradas
    // (sem contexto a camada fica escondida: o canvas perdido pode aparecer como um retângulo branco)
    const refaz=e=>{ GLON=null; glSujo=true; cv.style.display=e.type==='webglcontextlost'?'none':''; for(const c of ESPC) c._feito=false; };
    cv.addEventListener('webglcontextlost',refaz); cv.addEventListener('webglcontextrestored',refaz); }
  if(cv.parentElement!==board) board.prepend(cv); return cv; }
function glAtivo(){ if(GLON===null){ espInicia(); GLON = !/[?&]semgl\b/.test(location.search) && ESP.glPronto(glCamada()); } return GLON; }
// posição de cada peça no quadro, lida uma vez só: a malha e os planetas usam a mesma leitura
let quadroN=0, pecasQ=null, pecasN=-1;
function pecasNoQuadro(){
  if(pecasN===quadroN && pecasQ) return pecasQ;
  pecasN=quadroN; pecasQ=[];
  for(const el of board.querySelectorAll('.tile')){ if(!el._t||!el.firstChild) continue; const fr=el.firstChild.getBoundingClientRect(); if(fr.width) pecasQ.push({el,fr}); }
  return pecasQ;
}
// glSujo: a camada tem desenho (planetas, ou os discos do logo do menu). Sem planeta redondo e já limpa, não é limpa
// e redesenhada de novo a cada quadro
let glSujo=true;
function glQuadro(t){
  const cv=glCamada(), gr=cv.getBoundingClientRect(); if(!gr.width) return;
  const W=Math.round(gr.width*ESP.DPR), H=Math.round(gr.height*ESP.DPR); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; glSujo=true; }
  const sx=W/gr.width, lista=[];
  for(const {el,fr} of pecasNoQuadro()){ if(!el._gl) continue; const id=el.dataset.id||'x';
    if(el._vrId!==id){ el._vr=ESP.vrDe(id); el._vrId=id; }   // o jeito da peça (eixo, giro) é sorteado pelo id uma vez só
    lista.push({n:nomeNivelEsp(el._t.t), x:(fr.left+fr.width/2-gr.left)*sx, y:(fr.top+fr.height/2-gr.top)*sx, u:fr.width*sx, id, vr:el._vr}); }
  if(!lista.length && !glSujo) return;
  ESP.glDesenha(lista,t,ESP.ST.L); glSujo=lista.length>0;
}
// recorta o disco do planeta (desenhado embaixo, pela placa de vídeo) do que está no canvas da peça
function furaPlaneta(c,x,y,u,T){ const R=u*kNivel(T.t)*ESP.byName(nomeNivelEsp(T.t)).sp.rScale/2; c.save(); c.globalCompositeOperation='destination-out'; c.beginPath(); c.arc(x,y,R,0,7); c.fill(); c.restore(); }

// ícone do planeta no meio do texto (uma foto parada). A foto (ICO_URL) é feita antes, no tempo ocioso (preparaOcioso);
// se ainda não estiver pronta, sai na hora, como antes
const ICO_PL={}, ICO_URL={};
function icoPlaneta(t){ if(ICO_PL[t]) return ICO_PL[t]; espInicia();
  const u=ICO_URL[t]||(ICO_URL[t]=ESP.pecaImg(nomeNivelEsp(t),0,96).toDataURL());
  return ICO_PL[t]=`<img class="ico" alt="" src="${u}">`; }

// ---------- preparo no tempo ocioso ----------
// Texturas, ícones e fotos dos planetas são feitos antes de aparecerem: gerar na hora (uns 150 ms no celular) travava o
// arrasto em que o planeta nascia. A fila anda só no tempo ocioso, sem passar do prazo (ESP.filaOciosa), desde a abertura
// do jogo: primeiro o planeta do fundo (lista de fases e mundo atual), depois a meta da fase atual e os níveis na ordem
// em que nascem numa partida, e por fim os desenhos da lista de fases.
// a foto vira data URL sem pesar no quadro (toBlob codifica aos poucos); se alguém pedir antes, ela sai na hora
function guardaFoto(dic,k,cv){
  if(dic[k]) return;
  if(!cv.toBlob || typeof FileReader==='undefined'){ dic[k]=cv.toDataURL(); return; }
  cv.toBlob(b=>{ if(!b || dic[k]) return; const fr=new FileReader(); fr.onload=()=>{ if(!dic[k]) dic[k]=fr.result; }; fr.readAsDataURL(b); });
}
const PLANETA_FUNDO={gigante:'Júpiter', cinturao:'Lua', veu:'Saturno', nascer:'Marte'};
let FILA_OCIOSA=null, filaMax=0;
// a cada arrasto: o nível seguinte ao maior do tabuleiro (o próximo a nascer) passa para a frente da fila
function adiantaProximo(){
  if(!FILA_OCIOSA || !S || !S.tiles) return;
  let M=0; for(const k of S.tiles) if(k.t>M) M=k.t;
  if(M!==filaMax){ filaMax=M; FILA_OCIOSA.adianta(T=>T.nivel===M+1); }
}
function preparaOcioso(){
  const fila=[], texs=[], L=ESP.LADDER; let nv=0;   // nv: nível a que as próximas tarefas pertencem
  const textura=nome=>{ if(nome && !texs.includes(nome)){ texs.push(nome); fila.push({...ESP.texTarefa(nome), nivel:nv}); } };
  const texNivel=t=>{ const d=L[t-1]; if(d && d.kind==='sphere'){ textura(d.tex); textura(d.clouds); } };
  const inteira=f=>fila.push({inteira:true, nivel:nv, f:()=>{ f(); return true; }});
  // foto da peça em dois passos curtos (preparar a peça; pintar e guardar). A peça feita só para a foto é solta em
  // seguida (não fica ocupando memória)
  const foto=(t,sz,dic,k)=>{ const n=nomeNivelEsp(t); let tinha=true;
    inteira(()=>{ if(dic[k]) return; tinha=ESP.temPeca(n,sz); ESP.pecaPrepara(n,sz); });
    inteira(()=>{ if(!dic[k]) guardaFoto(dic,k,ESP.pecaImg(n,0,sz)); if(!tinha) ESP.soltaPeca(n,sz); }); };
  const niveis=new Set(), nivel=t=>{ if(niveis.has(t)) return; niveis.add(t); nv=t; texNivel(t); foto(t,96,ICO_URL,t); foto(t,160,URL_ESP,'p'+t); nv=0; };
  // o fundo da lista de fases e do Clássico (mundo 1) e o do mundo da próxima fase
  let prox=null;
  try{ prox=MISSOES[faseAtual()-1]; }catch(e){}
  textura('jupiter');
  try{ const mu=ESP.MUNDOS_ESP[(Math.max(1,mundoDe(prox).tema)-1)%ESP.MUNDOS_ESP.length], nome=PLANETA_FUNDO[mu.tipo]; if(nome) textura(ESP.byName(nome).tex); }catch(e){}
  // a meta da próxima fase (planeta grande e receita da janela da fase), depois a escada na ordem em que ela sobe
  try{ const tA=prox && tAlvo(prox); if(tA){ nivel(tA); if(tA>1) nivel(tA-1); } }catch(e){}
  // a camada dos planetas redondos (WebGL: contexto e programas) antes do primeiro planeta redondo nascer num arrasto
  for(let t=4;t<=L.length;t++){ if(L[t-1].kind==='sphere' && !niveis.has(-1)){ niveis.add(-1); inteira(()=>glAtivo()); } nivel(t); }
  for(let t=1;t<=3;t++) nivel(t);
  // desenhos da lista de fases (ícones dos mundos e das metas)
  for(const k of ['estacao','rochinha','nave','lixo']) inteira(()=>{ if(!URL_ESP[k]) guardaFoto(URL_ESP,k,ESP.objImg(k,160,0)); });
  for(const [k,f] of Object.entries(FOTOS_ESP)) inteira(()=>{ if(!URL_ESP[k]) guardaFoto(URL_ESP,k,fotoCanvas(f)); });
  FILA_OCIOSA=ESP.filaOciosa(fila);
}

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
    el._gl = redondo; c.canvas._estatico = redondo && T.c==null && !T.presa;   // só o brilho parado: não precisa redesenhar
    if(redondo){ if(temBrilho(T)) espBrilho(c,x,y,u,T.t); if(T.c!=null) espAura(c,x,y,u,tm,T.c); if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'back'); if(T.c!=null||T.presa||temBrilho(T)) furaPlaneta(c,x,y,u,T); if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'front'); return; }
    // só a pedrinha (sem aura, gaiola, lixo ou buraco): ela troca de quadro a 20 por segundo, o canvas acompanha
    c.canvas._passo = T.c==null && !T.presa && T.t>0 && T.k!=='p' ? ESP.PASSO_VAR : 0;
    if(temBrilho(T)) espBrilho(c,x,y,u,T.t);
    if(T.c!=null) espAura(c,x,y,u,tm,T.c);
    if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'back');
    if(T.t===0) ESP.SPR.lixo(c,x,y,u*.86,tm);
    else if(T.k==='p') ESP.SPR.buraco(c,x,y,u,tm,corNivel(T.t));
    else ESP.drawPecaVar(c,nomeNivelEsp(T.t),tm,x,y,u,el.dataset.id||'x');
    if(T.presa) ESP.SPR.gaiola(c,x,y,u,tm,'front'); });
}
// bloco (a peça que não sai): estação espacial
// lixo espacial que racha: o desenho do lixo, com rachaduras quando tem mais de 1 de vida
function espLixo(el,w){ el.innerHTML='<div class="face"></div>'; const fase=Math.random()*20, vira=Math.random()<.5;
  espCanvas(el.firstChild,1.1,1.1,(c,W,H,u,tm)=>{ if(vira){ c.save(); c.translate(W,0); c.scale(-1,1); } ESP.SPR.lixo(c,W/2,H/2,u*.9,tm+fase); if(vira) c.restore();
  if(w.hp>1){ c.save(); c.fillStyle='#ffd877'; c.font=`800 ${u*.26}px 'Exo 2',sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.shadowColor='#000'; c.shadowBlur=u*.06; c.fillText(w.hp,W/2+u*.28,H/2-u*.28); c.restore(); } }); }
function espParede(el){ el.innerHTML='<div class="face"></div>'; const fase=Math.random()*20, vira=Math.random()<.5;
  espCanvas(el.firstChild,1.1,1.1,(c,W,H,u,tm)=>{ if(vira){ c.save(); c.translate(W,0); c.scale(-1,1); } ESP.SPR.estacao(c,W/2,H/2,u,tm+fase); if(vira) c.restore(); }); }
// mureta: fluxo de rochas entre as duas casas
function espMureta(el,d){ const v=d==='v', fase=Math.random()*30;
  espCanvas(el, v?.62:1, v?1:.62, (c,W,H,u,tm)=> v ? ESP.SPR.rochas(c,[W/2,H*.03],[W/2,H*.97],tm+fase,u) : ESP.SPR.rochas(c,[W*.03,H/2],[W*.97,H/2],tm+fase,u)); }
// marcas do Clássico: casa marcada, casa de terra, carrinho
function espMarca(el,tipo,a){
  if(tipo==='alvo'){ const k=Math.max(1.1,kNivel(a.t)); espCanvas(el,k,k,(c,W,H,u,tm)=>{
      if(el.classList.contains('ok')){ c.save(); c.strokeStyle='#8fe3a0'; c.lineWidth=u*.035; c.shadowColor='#8fe3a0'; c.shadowBlur=u*.08; c.beginPath(); c.arc(W/2,H/2,u*.42,0,7); c.stroke(); c.restore(); }
      else ESP.SPR.alvo(c,W/2,H/2,u,tm,nomeNivelEsp(a.t)); }); }
  else if(tipo==='terra') espCanvas(el,1,1,(c,W,H,u,tm)=>ESP.SPR.neb(c,W/2,H/2,u,tm,(a.x*3+a.y)||0));
  else if(tipo==='carro') espCanvas(el,1.3,1.3,(c,W,H,u,tm)=>ESP.SPR.nave(c,W/2,H/2,u,tm,nomeNivelEsp(S.carro?S.carro.t:a.t)));
}

// ---------- o céu atrás de tudo ----------
// Fundo vivo (aprovado nos rascunhos fundo.html e malha.html em 2026-11-09):
// - a nebulosa se mexe, desenhada pela placa de vídeo nas duas cores do mundo (sem WebGL, volta o céu pintado);
// - estrelas e o planeta do mundo ficam em camadas que andam com a câmera: ela flutua e dá um tranco a cada arrasto;
// - de tempos em tempos passa algo ao longe (cometa, satélite, chuva de meteoros, nave);
// - cada junção acende uma névoa na cor do planeta formado; o anel só vem quando nasce o maior planeta da partida.
let ceu=null, ceuF=null, ceuT=0, tQuadro=0, nebT=-1;   // tQuadro: hora do último quadro (o mesmo relógio das animações)
// fundos já feitos (buildFundo pinta o planeta do mundo no processador e custa caro): o do menu e os dos últimos mundos
// ficam guardados, e ir e voltar entre menu e jogo não refaz nada. Mudança pequena de altura (a barra do navegador
// aparecendo e sumindo no celular, até 15%) usa o fundo que já existe; a largura mudou, ou a altura mudou muito, refaz.
const CEU_FUNDOS=new Map(), CEU_MAX=4;
function fundoCeu(w,h,chave,faz){
  let F=CEU_FUNDOS.get(chave);
  if(F && (F.w!==w || Math.abs(h-F.h)>F.h*.15)){ F.f.img.width=F.f.img.height=0; F=null; }
  if(!F) F={w,h,f:faz()};
  CEU_FUNDOS.delete(chave); CEU_FUNDOS.set(chave,F);   // o usado por último fica no fim (os mais velhos saem primeiro)
  for(const [k,G] of CEU_FUNDOS){ if(CEU_FUNDOS.size<=CEU_MAX) break; G.f.img.width=G.f.img.height=0; CEU_FUNDOS.delete(k); }
  return F;
}
const MARGEM_CEU=26, camE={x:0,y:0,vx:0,vy:0};
let brilhosE=[], aneisE=[], passE=[], proxPass=6, passI=0;
const NEB=(()=>{
  const cv=document.createElement('canvas'); cv.id='neb';
  const gl=!/[?&]semgl\b/.test(location.search) && cv.getContext('webgl',{antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if(!gl) return {ok:false};
  try{
    const fs=`precision mediump float;
    uniform vec2 res,off,pp;uniform float t,pu;uniform vec3 c1,c2,pc;
    float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
    void main(){vec2 su=(gl_FragCoord.xy-.5*res)/res.y,uv=su+off,p=uv*1.7;
      vec2 q=vec2(fbm(p+vec2(0.,t*.03)),fbm(p+vec2(5.2,1.3)-vec2(t*.02,0.)));
      vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.04),fbm(p+3.*q+vec2(8.3,2.8)-t*.035));
      float f=fbm(p+2.6*r),faixa=.35+.65*exp(-pow((uv.x*.7+uv.y*.75)/.55,2.)),neb=smoothstep(.25,.8,f)*faixa;
      vec3 col=vec3(.043,.039,.094);
      col=mix(col,c1*.85,neb*.9);
      col=mix(col,c2*.95,clamp(length(r)-.5,0.,1.)*neb);
      float poe=smoothstep(.48,.78,fbm(p*2.3+q*1.5-t*.01));col*=1.-.45*poe*(1.-neb*.5);
      col+=c2*.35*pow(neb,3.);
      float d=length(su-pp);col+=pc*pu*(.5*exp(-d*3.5)+.07);
      gl_FragColor=vec4(col,1.);}`;
    const U={};
    // compila o programa e prepara o retângulo (de novo quando a placa de vídeo devolve um contexto perdido)
    const prepara=()=>{
      const sh=(tp,src)=>{ const s=gl.createShader(tp); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}')); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr); gl.useProgram(pr);
      const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const lp=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
      for(const k of ['res','off','pp','t','pu','c1','c2','pc']) U[k]=gl.getUniformLocation(pr,k);
      gl.viewport(0,0,cv.width,cv.height); };
    prepara();
    const v=s=>s.split(',').map(x=>x/255);
    // desenha a nebulosa (em meia resolução) na camada própria, de w por h; off = deslocamento da câmera; pul = névoa da junção
    const N={ok:true, desenha(w,h,t,off,neb,pul){ if(!cv.isConnected) document.body.prepend(cv);
      const W=Math.max(8,Math.round(w*.5)), H=Math.max(8,Math.round(h*.5)); if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; gl.viewport(0,0,W,H); }
      gl.uniform2f(U.res,W,H); gl.uniform1f(U.t,t); gl.uniform2f(U.off,-off[0]/h,off[1]/h); gl.uniform3fv(U.c1,v(neb[0])); gl.uniform3fv(U.c2,v(neb[1]));
      gl.uniform1f(U.pu,pul?pul.k:0); gl.uniform3fv(U.pc,pul?v(pul.rgb):[0,0,0]); gl.uniform2f(U.pp,pul?(pul.x-w/2)/h:0,pul?(h/2-pul.y)/h:0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4); }};
    // contexto perdido (no Android acontece ao voltar do segundo plano): volta o céu pintado até o contexto voltar
    cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); N.ok=false; });
    cv.addEventListener('webglcontextrestored',()=>{ try{ prepara(); N.ok=true; }catch(e){ console.warn('nebulosa',e); } });
    return N;
  }catch(e){ console.warn('nebulosa',e); return {ok:false}; }
})();
function ceuDesenha(t){
  if(!ceu){ ceu=document.createElement('canvas'); ceu.id='ceu'; document.body.prepend(ceu); }
  // no menu, céu sem planeta de fundo: os planetas aparecem conforme a pessoa descobre (em volta do nome)
  const menu=!!document.getElementById('scrMenu')?.classList.contains('on'), jogo=!menu && !!(S&&(S.missao||S.infinito)&&S.phase!=='lista');
  const w=innerWidth, h=innerHeight, tema=Math.max(1,(S&&S.missao&&S.tema)||1), mu=ESP.MUNDOS_ESP[(tema-1)%ESP.MUNDOS_ESP.length], M=MARGEM_CEU;
  if(ceu.width!==w||ceu.height!==h){ ceu.width=w; ceu.height=h; }
  const F=fundoCeu(w,h,tema+(menu?':menu':'')+(NEB.ok?':viva':''),()=>ESP.buildFundo(w+2*M,h+2*M,mu,{jogo:true,planeta:!menu,semNebulosa:NEB.ok}));
  ceuF=F.f;
  const dt=Math.min(.05,Math.max(0,t-ceuT)); ceuT=t;
  camE.vx+=(-camE.x*32-camE.vx*7)*dt; camE.vy+=(-camE.y*32-camE.vy*7)*dt; camE.x+=camE.vx*dt; camE.y+=camE.vy*dt;
  const cx=camE.x+Math.sin(t*.21)*7, cy=camE.y+Math.cos(t*.17)*6, c=ceu.getContext('2d');
  c.setTransform(1,0,0,1,0,0); c.globalCompositeOperation='source-over'; c.globalAlpha=1;
  // a névoa mais forte do momento (junção ou recorde)
  let pul=null; for(const j of brilhosE){ const u=(t-j.t0)/1.1; if(u<1){ const k=(1-u)*(j.forte?.9:.45); if(!pul||k>pul.k) pul={k,x:j.x,y:j.y,rgb:j.rgb}; } }
  // no Frenesi a névoa das junções acende quase sem parar: a nebulosa fica a 30 quadros por segundo mesmo com ela (a 60, a
  // placa de vídeo do celular pintava a tela inteira do dobro de vezes durante o jogo rápido)
  if(NEB.ok && (t-nebT>=1/30 || (pul && !(jogo&&S.frenesi)))){ nebT=t; NEB.desenha(w,h,t,[cx*.12,cy*.12],jogo&&S.frenesi?freNeb(mu.neb,t):mu.neb,pul); }   // a nebulosa anda devagar: 30 quadros por segundo bastam; no Frenesi, nas cores do degrau
  c.clearRect(0,0,w,h);
  c.save();
  // fundo feito para outra altura (até 15%): centrado na tela; mais baixo que ela, cresce por igual (sem achatar o
  // planeta) até cobrir; mais alto, sobra um pouco em cima e embaixo
  if(F.h!==h){ const s=Math.max(1,h/F.h); c.translate(w/2,h/2); c.scale(s,s); c.translate(-w/2,-F.h/2); }
  c.translate(-M+cx*.3,-M+cy*.3); ESP.drawFundo(c,ceuF,t); c.restore();
  // no jogo, o que fica atrás do tabuleiro (a lua, o planeta do mundo, o cinturão de pedras) se apaga aos poucos: as
  // pedras do fundo pareciam peças e a lua atrapalhava ver a partida. A nebulosa (outra camada) e as estrelas de fora seguem.
  if(jogo){ const r=board.getBoundingClientRect(); if(r.width>20){ const a=r.width/2, b=r.height/2, R=Math.max(a,b)*1.9;
    c.save(); c.globalCompositeOperation='destination-out'; c.translate(r.left+a, r.top+b); c.scale(a/Math.max(a,b), b/Math.max(a,b));
    const g=c.createRadialGradient(0,0,R*.6,0,0,R); g.addColorStop(0,'rgba(0,0,0,.93)'); g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g; c.fillRect(-R,-R,2*R,2*R); c.restore(); } }
  if(jogo){ if(t>proxPass) novaPassagem(t,w,h); passagens(c,t,cx*.35,cy*.35); }
  c.save(); c.globalCompositeOperation='lighter';
  for(const j of aneisE){ const u=(t-j.t0)/1.6; if(u<0||u>1) continue; const R=Math.max(0,j.v*(t-j.t0)); c.lineWidth=(j.w||6)*(1-u)+1; c.strokeStyle=`rgba(${j.rgb},${((j.a||.22)*(1-u)).toFixed(3)})`; c.beginPath(); c.arc(j.x,j.y,R,0,7); c.stroke(); }
  c.restore();
  if(jogo && S.frenesi) freCeu(c,t);   // brilho e rastro das peças no Frenesi
  brilhosE=brilhosE.filter(j=>t-j.t0<1.2); aneisE=aneisE.filter(j=>t-j.t0<1.7);
}
// passagens ao longe: cometa, satélite piscando, chuva de meteoros e nave (uma por vez, a cada 6 a 10 s)
function novaPassagem(t,W,H){ const tipo=['cometa','satelite','chuva','nave'][passI++%4], r=Math.random;
  if(tipo==='cometa') passE.push({tipo,t0:t,dur:7,a:[W*1.15,H*(.06+.16*r())],b:[-W*.15,H*(.22+.2*r())]});
  if(tipo==='satelite') passE.push({tipo,t0:t,dur:14,a:[-W*.05,H*(.1+.3*r())],b:[W*1.05,H*(.05+.2*r())]});
  if(tipo==='chuva') passE.push({tipo,t0:t,dur:2.6,st:Array.from({length:7},(_,i)=>({d:i*.3+r()*.15,x:W*(.25+.75*r()),y:H*(.02+.3*r())}))});
  if(tipo==='nave') passE.push({tipo,t0:t,dur:9,a:[W*1.06,H*(.6+.15*r())],b:[-W*.06,H*(.45+.1*r())]});
  proxPass=t+6+4*r(); }
function passagens(c,t,ox,oy){ c.save(); c.translate(ox,oy); c.globalCompositeOperation='lighter'; const TAU=7;
  for(const e of passE){ const u=(t-e.t0)/e.dur; if(u<0||u>1) continue;
    if(e.tipo==='cometa'){ const x=e.a[0]+(e.b[0]-e.a[0])*u, y=e.a[1]+(e.b[1]-e.a[1])*u-Math.sin(u*Math.PI)*ceu.height*.04, vx=e.b[0]-e.a[0], vy=e.b[1]-e.a[1], L=Math.hypot(vx,vy), tx=-vx/L, ty=-vy/L, cl=150;
      for(const [w,a] of [[12,.1],[3,.6]]){ const g=c.createLinearGradient(x,y,x+tx*cl,y+ty*cl); g.addColorStop(0,`rgba(190,240,255,${a})`); g.addColorStop(1,'rgba(190,240,255,0)');
        c.strokeStyle=g; c.lineWidth=w; c.lineCap='round'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+tx*cl,y+ty*cl); c.stroke(); }
      const g=c.createRadialGradient(x,y,0,x,y,9); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(160,230,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,9,0,TAU); c.fill(); }
    if(e.tipo==='satelite'){ const x=e.a[0]+(e.b[0]-e.a[0])*u, y=e.a[1]+(e.b[1]-e.a[1])*u; c.fillStyle='rgba(235,240,255,.85)'; c.beginPath(); c.arc(x,y,1.3,0,TAU); c.fill();
      if((t*.9)%1<.12){ const g=c.createRadialGradient(x,y,0,x,y,5); g.addColorStop(0,'rgba(255,90,90,.95)'); g.addColorStop(1,'rgba(255,90,90,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,5,0,TAU); c.fill(); } }
    if(e.tipo==='chuva') for(const s of e.st){ const v=(t-e.t0-s.d)/.45; if(v<0||v>1) continue; const L=95, x=s.x-.75*L*v*1.6, y=s.y+.55*L*v*1.6, g=c.createLinearGradient(x,y,x+.75*L,y-.55*L);
      g.addColorStop(0,`rgba(255,255,255,${(.9*(1-v)).toFixed(2)})`); g.addColorStop(1,'rgba(255,255,255,0)'); c.strokeStyle=g; c.lineWidth=1.6; c.beginPath(); c.moveTo(x,y); c.lineTo(x+.75*L,y-.55*L); c.stroke(); }
    if(e.tipo==='nave'){ const x=e.a[0]+(e.b[0]-e.a[0])*u, y=e.a[1]+(e.b[1]-e.a[1])*u+Math.sin(t*2)*2, fl=.7+.3*Math.sin(t*31);
      const g=c.createRadialGradient(x+7,y,0,x+7,y,10*fl); g.addColorStop(0,'rgba(120,230,255,.9)'); g.addColorStop(1,'rgba(120,230,255,0)'); c.fillStyle=g; c.beginPath(); c.arc(x+7,y,10*fl,0,TAU); c.fill();
      c.globalCompositeOperation='source-over'; c.fillStyle='rgba(220,226,245,.95)'; c.beginPath(); c.moveTo(x-6,y); c.lineTo(x+5,y-3.4); c.lineTo(x+3,y); c.lineTo(x+5,y+3.4); c.closePath(); c.fill(); c.globalCompositeOperation='lighter'; } }
  c.restore(); passE=passE.filter(e=>t-e.t0<e.dur); }

// ---------- a malha da gravidade (dentro do tabuleiro, atrás das peças) ----------
// Rede na cor do mundo, com molinhas entre os pontos. Cada planeta afunda a rede conforme o peso (a Poeira quase nada,
// a Terra bastante, os gigantes entortam o tabuleiro) e o fundo do poço fica escuro. Cada junção faz a rede tremer de
// leve; quando nasce o maior planeta da partida, uma onda atravessa a rede toda.
const MSUB=4, MBORDA=1, massaE=t=>.12+(t/10)**2;   // MBORDA: quantas casas a malha passa para fora do tabuleiro, sumindo
let malhaCv=null, MN=null, ondasM=[], tremM=[];
function malhaCamada(){ if(!malhaCv){ malhaCv=document.createElement('canvas'); malhaCv.id='malhaCv'; } if(malhaCv.parentElement!==board) board.prepend(malhaCv); return malhaCv; }
// geometria em px do canvas da malha: D = densidade (no máximo 2: linha fina não precisa de mais), P = passo entre casas,
// g0 = onde começa a primeira linha dentro do tabuleiro, O = margem do canvas (uma casa para cada lado do tabuleiro)
// lida uma vez por quadro: dentro do arrasto (entre um quadro e outro) vale a do último quadro, sem obrigar o navegador a
// refazer o layout no meio do arrasto (o tabuleiro não muda de lugar nem de tamanho ali)
let GEO=null, GEOq=-1;
function geoTab(){ if(GEO && GEOq===quadroN) return GEO; GEOq=quadroN; return GEO=geoMede(); }
function geoMede(){ const r=board.getBoundingClientRect(), D=Math.min(2,ESP.DPR), cel=(typeof cellPx==='function'?cellPx():80), gap=(r.width-W*cel)/(W+1);
  return {r, D, P:(cel+gap)*D, g0:gap*D/2, O:cel*D, cel}; }
const casaOk=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!(S.walls||[]).some(w=>w.v&&w.x===x&&w.y===y);
function campoM(px,py,t,pocos,pa){ let dx=0,dy=0,h=0;
  for(const q of pocos){ const ex=px-q.x, ey=py-q.y, d2=ex*ex+ey*ey, sg=pa*(.32+.13*q.m); if(d2>sg*sg*16) continue;
    const d=Math.sqrt(d2)||1, A=Math.min(pa*.12*q.m,sg*.55), f=A*(d/sg)*Math.exp(.5-d2/(2*sg*sg));
    dx-=ex/d*f; dy-=ey/d*f; h+=q.m*Math.exp(-d2/(2*(sg*1.15)**2)); }
  let w=0;
  for(const o of ondasM){ const ex=px-o.x, ey=py-o.y, d=Math.hypot(ex,ey)||1, u=(d-pa*3.4*(t-o.t0))/(pa*.45), amp=o.a*Math.exp(-(t-o.t0)*1.1)*Math.exp(-u*u)*Math.sin(u*2.4);
    dx+=ex/d*amp; dy+=ey/d*amp; w+=Math.abs(amp)/pa; }
  for(const o of tremM){ const ex=px-o.x, ey=py-o.y, d=Math.hypot(ex,ey)||1, u=(d-pa*2.2*(t-o.t0))/(pa*.3), amp=o.a*Math.exp(-(t-o.t0)*3)*Math.exp(-u*u)*Math.sin(u*2.4);
    dx+=ex/d*amp; dy+=ey/d*amp; }
  const L=Math.hypot(dx,dy), cap=pa*.42; if(L>cap){ dx*=cap/L; dy*=cap/L; }
  return [dx,dy,h,w]; }
// quanto cada ponto da rede aparece: forte no meio do tabuleiro, mais fraco perto da borda, e sumindo aos poucos
// fora dele (e nas casas vazias do formato), para a malha se misturar ao céu
function presencaM(ci,cj,ok){
  let fora=9; for(const [x,y] of ok){ const ex=Math.max(x-ci,0,ci-(x+1)), ey=Math.max(y-cj,0,cj-(y+1)); fora=Math.min(fora,Math.hypot(ex,ey)); }
  if(fora>0) return .5*Math.max(0,1-fora/.9)**1.6;
  let dentro=Math.min(ci,W-ci,cj,H-cj);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!casaOk(x,y)){ const ex=Math.max(x-ci,0,ci-(x+1)), ey=Math.max(y-cj,0,cj-(y+1)); dentro=Math.min(dentro,Math.hypot(ex,ey)); }
  return .5+.5*Math.min(1,dentro/1.1);
}
let malhaT=0, malhaSelo='', malhaParada=false;
function malhaQuadro(t){
  const cv=malhaCamada(), g=geoTab(); if(!g.r.width||!S||!S.tiles) return;
  const Wp=Math.round((g.r.width+2*g.cel)*g.D), Hp=Math.round((g.r.height+2*g.cel)*g.D); let refaz=false;
  if(cv.width!==Wp||cv.height!==Hp){ cv.width=Wp; cv.height=Hp; refaz=true; }
  const NI=(W+2*MBORDA)*MSUB+1, NJ=(H+2*MBORDA)*MSUB+1, chave=W+'x'+H+':'+Wp+':'+Hp+':'+(S.walls||[]).filter(w=>w.v).map(w=>w.x+','+w.y).join(';');
  if(!MN||MN.chave!==chave){ MN={chave,nos:[]}; const ok=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(casaOk(x,y)) ok.push([x,y]);
    for(let j=0;j<NJ;j++) for(let i=0;i<NI;i++){ const rx=g.O+g.g0+(i-MBORDA*MSUB)*g.P/MSUB, ry=g.O+g.g0+(j-MBORDA*MSUB)*g.P/MSUB;
      MN.nos.push({i,j,rx,ry,x:rx,y:ry,vx:0,vy:0,h:0,w:0,f:presencaM(i/MSUB-MBORDA,j/MSUB-MBORDA,ok)}); }
    refaz=true; }
  if(S.espMax==null && S.tiles.length) S.espMax=Math.max(...S.tiles.map(k=>k.t));
  const dt=Math.min(.05,Math.max(0,t-malhaT)); malhaT=t;
  const pa=g.P, pocos=[];
  for(const {el,fr} of pecasNoQuadro()) pocos.push({x:(fr.left+fr.width/2-g.r.left)*g.D+g.O, y:(fr.top+fr.height/2-g.r.top)*g.D+g.O, m:massaE(el._t.t)});
  // nada mudou desde o último desenho (peças paradas, sem onda nem tremor, rede assentada): o desenho anterior vale
  const selo=pocos.map(q=>Math.round(q.x)+','+Math.round(q.y)+','+q.m.toFixed(2)).join(';')+(S.frenesi?'|'+freMalhaSelo(t):''), calmo=!ondasM.length && !tremM.length;
  if(!refaz && calmo && malhaParada && selo===malhaSelo) return;
  if(selo!==malhaSelo) malhaParada=false;
  malhaSelo=selo;
  let mexe=0;
  for(const n of MN.nos){ const [dx,dy,h,w]=campoM(n.rx,n.ry,t,pocos,pa); n.vx+=((n.rx+dx-n.x)*90-n.vx*11)*dt; n.vy+=((n.ry+dy-n.y)*90-n.vy*11)*dt; n.x+=n.vx*dt; n.y+=n.vy*dt; n.h=h; n.w=w;
    mexe=Math.max(mexe,Math.abs(n.vx)+Math.abs(n.vy)); }
  malhaParada = calmo && mexe<2;
  const c=cv.getContext('2d'); c.clearRect(0,0,Wp,Hp);
  // uma sombra suave atrás do tabuleiro (sem borda dura) e o fundo escuro de cada poço
  const bw=g.r.width*g.D, bh=g.r.height*g.D, cxB=g.O+bw/2, cyB=g.O+bh/2, Rb=Math.hypot(bw,bh)*.62, gb=c.createRadialGradient(cxB,cyB,Rb*.3,cxB,cyB,Rb);
  gb.addColorStop(0,'rgba(8,6,22,.3)'); gb.addColorStop(1,'rgba(8,6,22,0)'); c.fillStyle=gb; c.fillRect(0,0,Wp,Hp);
  for(const q of pocos){ const R=pa*(.38+.16*q.m), gr=c.createRadialGradient(q.x,q.y,0,q.x,q.y,R); gr.addColorStop(0,`rgba(0,0,0,${Math.min(.8,(.12+.12*q.m)*1.6).toFixed(3)})`); gr.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gr; c.fillRect(q.x-R,q.y-R,2*R,2*R); }
  // linhas na cor do mundo (clareada), bem transparentes; quanto mais fundo o poço, mais escura e fina a linha.
  // As linhas parecidas vão juntas num traço só (poucos traços por quadro em vez de centenas)
  const tema=Math.max(1,(S.missao&&S.tema)||1), no=(i,j)=>MN.nos[j*NI+i];
  let rgb=ESP.MUNDOS_ESP[(tema-1)%ESP.MUNDOS_ESP.length].neb[1].split(',').map(v=>Math.round(+v*.55+255*.45)).join(',');
  const ganho=S.frenesi?freMalhaGanho():1; if(S.frenesi) rgb=freMalhaCor(rgb);   // no Frenesi, na cor do degrau e mais acesa
  const potes=new Map();
  const seg=(a,b,maior)=>{ const f=(a.f+b.f)/2; if(f<.02) return; const h=(a.h+b.h)/2, w=(a.w+b.w)/2, fundo=Math.min(.85,h*.32), al=Math.min(1,((maior?.17:.065)*(1-fundo)+w*.6)*f*ganho);
    if(al<.008) return; const k=Math.round(al*60)+'|'+Math.max(1,Math.round((maior?1.2:.75)*(1-fundo*.5)*4)); let p=potes.get(k); if(!p) potes.set(k,p=[]); p.push(a.x,a.y,b.x,b.y); };
  for(let j=0;j<NJ;j++) for(let i=0;i<NI-1;i++) seg(no(i,j),no(i+1,j),j%MSUB===0);
  for(let i=0;i<NI;i++) for(let j=0;j<NJ-1;j++) seg(no(i,j),no(i,j+1),i%MSUB===0);
  c.lineCap='round';
  for(const [k,p] of potes){ const [a,wl]=k.split('|'); c.strokeStyle=`rgba(${rgb},${(a/60).toFixed(3)})`; c.lineWidth=wl/4*g.D; c.beginPath();
    for(let i=0;i<p.length;i+=4){ c.moveTo(p[i],p[i+1]); c.lineTo(p[i+2],p[i+3]); } c.stroke(); }
  ondasM=ondasM.filter(o=>t-o.t0<3); tremM=tremM.filter(o=>t-o.t0<1.2);
}
// chamado a cada arrasto que mexeu: tranco da câmera, névoa de cada junção, tremor da malha; recorde da partida: onda e anel
// no Frenesi as reações crescem com o degrau (fk de 0 a 1; com menos movimento, o tranco não cresce)
function espJogada(dx,dy,merges){
  const fk=freForca(), tr=190*(1+(POUCO_MOV?0:fk*1.4));
  camE.vx+=dx*tr; camE.vy+=dy*tr; adiantaProximo();
  if(!merges||!merges.length) return;
  const g=geoTab(), t=tQuadro||performance.now()/1000;
  for(const o of merges){
    const bx=g.g0+(o.x+.5)*g.P, by=g.g0+(o.y+.5)*g.P, sx=g.r.left+bx/g.D, sy=g.r.top+by/g.D, rgb=corNivelRgb(o.t), rec=S.espMax!=null && o.t>S.espMax;
    tremM.push({x:bx+g.O,y:by+g.O,t0:t,a:g.P*(.025+.004*o.t)*(1+fk*(POUCO_MOV?.5:2.2))});
    brilhosE.push({x:sx,y:sy,t0:t,rgb,forte:rec||fk>.45});
    if(rec){ S.espMax=o.t; ondasM.push({x:bx+g.O,y:by+g.O,t0:t,a:g.P*(.16+.012*o.t)}); aneisE.push({x:sx,y:sy,t0:t,v:g.P/g.D*3.4,rgb:'230,232,255'}); }
  }
}
const corNivelRgb=t=>{ const h=corNivel(t); return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(','); };
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
const fotoCanvas=f=>{ const cv=document.createElement('canvas'); cv.width=cv.height=160; f(cv.getContext('2d')); return cv; };
const fotoEsp=(k,f)=>URL_ESP[k]||(espInicia(),URL_ESP[k]=fotoCanvas(f).toDataURL());
// desenhos fixos dos ícones (os mesmos para fotoEsp e para o preparo no tempo ocioso)
const FOTOS_ESP={neb:c=>ESP.SPR.neb(c,80,80,170,2,3), orbita:c=>ESP.SPR.alvo(c,80,80,150,1,'Rocha')};
const buracoInner = t => `<image href="${fotoEsp('b'+t,c=>ESP.SPR.buraco(c,80,80,150,1.3,corNivel(t)))}" x="0" y="0" width="100" height="100"/>`;
const buracoVetor = t => `<ellipse cx="50" cy="56" rx="46" ry="13" fill="none" stroke="${corNivel(t)}" stroke-width="7" opacity=".85"/><circle cx="50" cy="56" r="21" fill="#000" stroke="#ffe6c8" stroke-width="3"/><path d="M4 56 A46 13 0 0 0 96 56" fill="none" stroke="${corNivel(t)}" stroke-width="7"/>`;
const lixoInner = () => `<image href="${urlObj('lixo')}" x="0" y="0" width="100" height="100"/>`;
const estacaoInner = () => `<image href="${urlObj('estacao')}" x="0" y="0" width="100" height="100"/>`;
const nebInner = () => `<image href="${fotoEsp('neb',FOTOS_ESP.neb)}" x="0" y="0" width="100" height="100"/>`;
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
  if(o.rache) return `<svg class="mPl" viewBox="0 0 100 100">${lixoInner()}</svg>`;
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
  rache:'Lixo espacial: um bloco fixo que racha e some quando acontece uma junção numa casa ao lado.',
  solte:'Gaiola de luz: o planeta preso não sai do lugar, mas aceita junção. Junte um igual nele para soltar.',
  carrinho:'Nave: o planeta do tamanho pedido, ou maior, que parar embaixo dela é recolhido.',
  combo:'Duas junções no mesmo arrasto contam uma vez.',
  seq:'Em ordem: cada planeta só conta depois do anterior.',
  proibido:'Se formar o planeta proibido, a fase acaba.',
};
const COMO_FASE_ESP = {
  cores:'Cada peça tem uma aura roxa ou verde: só junta com a mesma cor. A aura de duas cores junta com qualquer uma e fica da cor da outra.',
  picareta:'Nascem buracos negros: cada um engole o planeta da cor dele.',
};
const COMO_MAPA_ESP = {
  estacao:'Estação: ocupa uma casa e nunca sai do lugar. As peças batem nela e param.',
  rochas:'Fluxo de rochas: uma faixa de rochas entre duas casas. As peças param nela, como numa parede fina.',
};
function regrasEsp(m){
  const fase=faseDe(m), fm=formaDe(m), n=PATHS[fase].n, tam = fm ? `${fw(fm)}x${fh(fm)}` : `${m.w||n||4}x${m.h||m.w||n||4}`;
  return `${tam} · ${arrastosTxt(m)}${charDe(m)==='passinho'?' · Passinho':''}${m.regras?.spawns===0?' · não nasce peça nova':''}`;
}
function explicaEsp(m){
  const fase=faseDe(m), out=[];
  if(n1(m)) out.push('Arraste para juntar peças iguais: duas iguais viram a do nível seguinte.');
  if(COMO_FASE_ESP[fase]) out.push(COMO_FASE_ESP[fase]);
  // estação e fluxo de rochas também são novidades (textos de proposta.html): explicados na estreia, como as outras
  const fm=formaDe(m);
  if(m.regras?.walls || fm?.mapa?.some(l=>l.includes('B'))) out.push(COMO_MAPA_ESP.estacao);
  if(m.regras?.edges || fm?.muretas?.length) out.push(COMO_MAPA_ESP.rochas);
  if(charDe(m)==='passinho') out.push(COMO_CHAR.passinho);
  for(const o of objsDe(m)) for(const k of Object.keys(COMO_ESP)) if(o[k]!==undefined && !out.includes(COMO_ESP[k])) out.push(COMO_ESP[k]);
  if((m.mapa||[]).some(l=>/[L23]/.test(l)) || m.regras?.lixos){ if(!out.includes(COMO_ESP.rache)) out.push(COMO_ESP.rache); }
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
// menu como sistema solar acima do nome (rascunhos menu-planetas.html e menu-nome.html, 2026-11-09): o sistema gira em
// cima e o nome fica embaixo, livre, sem planeta passando por cima dele. Cada planeta já descoberto fica na sua órbita, na
// ordem real; as órbitas seguem a distância real em escala logarítmica, então as de fora ficam bem mais afastadas e os
// gigantes longe um do outro. Tamanho real comprimido (raiz quadrada do diâmetro), e tudo encolhe um pouco a cada
// gigante que aparece. A Lua gira em volta da Terra; o Sol fica no centro quando descoberto; o cinturão de pedras fica
// por fora, onde estaria o Cinturão de Kuiper, junto de Plutão.
const DIAM_KM={'Plutão':2377,'Lua':3474,'Mercúrio':4879,'Marte':6779,'Vênus':12104,'Terra':12742,'Netuno':49244,'Urano':50724,'Saturno':116460,'Júpiter':139820};
const DIST_UA={'Mercúrio':.39,'Vênus':.72,'Terra':1,'Marte':1.52,'Júpiter':5.2,'Saturno':9.54,'Urano':19.2,'Netuno':30.1,'Plutão':39.5};
const ORDEM_SOL=['Mercúrio','Vênus','Terra','Marte','Júpiter','Saturno','Urano','Netuno','Plutão'];
const raioOrb=n=>.16+.84*Math.log(DIST_UA[n]/.39)/Math.log(39.5/.39);   // de 0,16 (Mercúrio) a 1 (Plutão)
const nivelDe=n=>ESP.LADDER.findIndex(x=>x.n===n)+1;
// tamanho da caixa da peça: o corpo (Terra = 17, nenhum menor que 7) dividido pela parte da caixa que o corpo ocupa
const tamLogo=n=>{ const def=ESP.byName(n), rs=(def.sp&&def.sp.rScale)||1; return Math.max(7,17*Math.sqrt(DIAM_KM[n]/12742))/rs; };
const escalaLogo=d=>d>=16?.8:d>=14?.88:d>=12?1:1.15;   // tudo encolhe conforme aparecem os gigantes
// antes do Sol (pedido em 2026-11-10): os planetas descobertos giram em volta do nome, numa órbita só, espaçados por
// igual e alternando grandes e pequenos (os gigantes não se juntam de um lado); passam sempre atrás do nome, e o cinturão
// de pedras passa na frente embaixo. O sistema solar (espLogo) só aparece quando a pessoa forma o Sol: aí já descobriu
// todos os planetas, e eles entram de uma vez nas órbitas reais.
const solAceso=()=>DESC()>=nivelDe('Sol');
const altLogo=w=>Math.round(w*(solAceso()?.92:.74));
function espLogoAnel(c,W,H,u,t){
  const Q=Math.min(W/360, H/266), cx=W/2, cy=H*.5, rx=W/2-16*Q, ry=Math.min(82*Q, H/2-18*Q), tl=-.1, ct=Math.cos(tl), st=Math.sin(tl), d=DESC();
  const lugar=(a,f=1,dy=0)=>{ const x0=Math.cos(a)*rx*f, y0=Math.sin(a)*ry*f+dy*ry; return [cx+x0*ct-y0*st, cy+x0*st+y0*ct]; };
  // tamanho real bem comprimido (Terra = 15, Júpiter = 31, Plutão = 9), para nenhum dominar o desenho
  const tam=n=>{ const def=ESP.byName(n), rs=(def.sp&&def.sp.rScale)||1; return 15*Math.pow(DIAM_KM[n]/12742,.3)/rs; };
  const lista=ORDEM_SOL.filter(n=>nivelDe(n)<=d).sort((a,b)=>DIAM_KM[b]-DIAM_KM[a]), anel=[];
  for(let i=0,j=lista.length-1;i<=j;i++,j--){ anel.push(lista[i]); if(i!==j) anel.push(lista[j]); }   // grande, pequeno, grande...
  const corpos=anel.map((n,i)=>{ const a=t*.12+i*2*Math.PI/anel.length, [x,y]=lugar(a); return {n, sz:tam(n)*Q, x, y, z:Math.sin(a), esf:ESP.byName(n).kind==='sphere'}; });
  if(nivelDe('Lua')<=d){ const terra=corpos.find(b=>b.n==='Terra'), a=t*1.3, sz=tam('Lua')*Q;
    if(terra) corpos.push({n:'Lua', sz, x:terra.x+Math.cos(a)*14*Q, y:terra.y+Math.sin(a)*5*Q, z:terra.z+Math.sin(a)*.01, esf:true});
    else { const a2=t*.12+Math.PI, [x,y]=lugar(a2); corpos.push({n:'Lua', sz, x, y, z:Math.sin(a2), esf:true}); } }
  const esf=corpos.filter(b=>b.esf), gl=esf.length>0 && glAtivo() && ESP.discosGL(esf.map(b=>({n:b.n, sz:b.sz, t})));
  if(gl) glSujo=true;
  const pedras=cinto().map(p=>{ const a=p.a+t*.1*p.v, [x,y]=lugar(a,1.08+p.dr,p.dy); return {p,x,y,z:Math.sin(a)}; });
  const pedrasDe=(lado)=>{ for(const q of pedras){ if((q.z<0)!==(lado<0)) continue; const kk=.72+.4*(q.z+1)/2;
      c.globalAlpha=.5+.5*(q.z+1)/2; if(q.p.pedra) pedrinha(c,q.x,q.y,q.p.s*Q*kk,q.p,t); else { c.fillStyle=q.p.c; c.beginPath(); c.arc(q.x,q.y,q.p.s*Q*kk,0,7); c.fill(); } }
    c.globalAlpha=1; };
  pedrasDe(-1);
  corpos.slice().sort((a,b)=>a.z-b.z).forEach(b=>{ const esc=.76+.24*(b.z+1)/2;
    if(gl && b.esf) ESP.drawPecaGL(c,b.n,b.x,b.y,b.sz,esc); else ESP.drawPeca(c,b.n,t,b.x,b.y,b.sz,1,true,esc); });
  c.drawImage(nomeLogo(W,H,Q,cx,cy),0,0);
  pedrasDe(1);
}
function espLogo(c,W,H,u,t){
  if(!solAceso()) return espLogoAnel(c,W,H,u,t);
  const Q=Math.min(W/360, H/266), cx=W/2, nomeH=110*Q, ny=H-nomeH/2+2*Q, areaH=H-nomeH, scy=areaH/2+2*Q, d=DESC(), k=escalaLogo(d);
  const rx=W/2-14*Q, ry=Math.min(.34*rx, areaH/2-22*Q*k), tl=-.1, ct=Math.cos(tl), st=Math.sin(tl);
  const lugar=(a,f,dy=0)=>{ const x0=Math.cos(a)*rx*f, y0=Math.sin(a)*ry*f+dy*ry; return [cx+x0*ct-y0*st, scy+x0*st+y0*ct]; };
  const corpos=[], giro=n=>t*.16*Math.pow(raioOrb(n)+.15,-1.5);   // os de dentro giram mais rápido
  ORDEM_SOL.forEach((n,i)=>{ if(nivelDe(n)>d) return; const a=giro(n)+i*2.4, [x,y]=lugar(a,raioOrb(n));
    corpos.push({n, sz:tamLogo(n)*Q*k, x, y, z:Math.sin(a), esf:ESP.byName(n).kind==='sphere'}); });
  if(nivelDe('Lua')<=d){ const terra=corpos.find(b=>b.n==='Terra'), a=t*1.3, sz=tamLogo('Lua')*Q*k;
    if(terra) corpos.push({n:'Lua', sz, x:terra.x+Math.cos(a)*13*Q*k, y:terra.y+Math.sin(a)*5*Q*k, z:terra.z+Math.sin(a)*.01, esf:true});
    else { const a2=giro('Terra')+2*2.4, [x,y]=lugar(a2,raioOrb('Terra')); corpos.push({n:'Lua', sz, x, y, z:Math.sin(a2), esf:true}); } }
  if(d>=nivelDe('Sol')) corpos.push({n:'Sol', sz:80*Q*k/((ESP.byName('Sol').sp||{}).rScale||1), x:cx, y:scy, z:0, sol:true, esf:true});
  const esf=corpos.filter(b=>b.esf), gl=esf.length>0 && glAtivo() && ESP.discosGL(esf.map(b=>({n:b.n, sz:b.sz, t})));
  if(gl) glSujo=true;
  const pedras=cinto().map(p=>{ const a=p.a+t*.1*p.v, [x,y]=lugar(a,1+p.dr*.5,p.dy*.5); return {p,x,y,z:Math.sin(a)}; });
  const pedrasDe=(lado)=>{ for(const q of pedras){ if((q.z<0)!==(lado<0)) continue; const kk=(.72+.4*(q.z+1)/2)*k;
      c.globalAlpha=.5+.5*(q.z+1)/2; if(q.p.pedra) pedrinha(c,q.x,q.y,q.p.s*Q*kk,q.p,t); else { c.fillStyle=q.p.c; c.beginPath(); c.arc(q.x,q.y,q.p.s*Q*kk,0,7); c.fill(); } }
    c.globalAlpha=1; };
  // de trás para a frente: pedras de trás, planetas de trás, o Sol (z = 0), planetas da frente, pedras da frente; o nome por último, embaixo
  pedrasDe(-1);
  corpos.slice().sort((a,b)=>a.z-b.z).forEach(b=>{ const esc=b.sol?1:.78+.22*(b.z+1)/2;
    if(gl && b.esf) ESP.drawPecaGL(c,b.n,b.x,b.y,b.sz,esc); else ESP.drawPeca(c,b.n,t,b.x,b.y,b.sz,1,true,esc); });
  pedrasDe(1);
  c.drawImage(nomeLogo(W,H,Q,cx,H*.5),0,ny-H*.5);
}
// nome: 2048 grande e ASTROS embaixo, espaçado. Ele não se mexe: é pintado (com os dois brilhos) uma vez numa camada e só
// copiado a cada quadro; pinta de novo quando o tamanho muda ou quando uma fonte acaba de carregar
let NOME_CV=null, NOME_K='', FONTES_V=0;
document.fonts?.addEventListener?.('loadingdone',()=>FONTES_V++);
function nomeLogo(W,H,Q,cx,cy){
  const k=W+'x'+H+':'+FONTES_V+':'+(document.fonts?.status||'');
  if(NOME_CV && NOME_K===k) return NOME_CV;
  if(!NOME_CV) NOME_CV=document.createElement('canvas');
  NOME_CV.width=W; NOME_CV.height=H; NOME_K=k;
  const c=NOME_CV.getContext('2d');
  c.save(); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f4fbff';
  for(const [txt,px,dy,esp] of [['2048',78,-12,0],['ASTROS',27,40,.42]]){ c.font=`900 ${px*Q}px Orbitron, sans-serif`; if('letterSpacing' in c) c.letterSpacing=(esp*px*Q)+'px';
    c.shadowColor='rgba(110,230,255,.95)'; c.shadowBlur=26*Q; c.fillText(txt,cx+(esp*px*Q)/2,cy+dy*Q); c.shadowColor='rgba(230,100,255,.7)'; c.shadowBlur=10*Q; c.fillText(txt,cx+(esp*px*Q)/2,cy+dy*Q); }
  c.restore();
  return NOME_CV;
}
// o menu inteiro cabe na tela: o desenho do nome encolhe o quanto precisar (os botões ficam do tamanho certo para o dedo)
function ajustaMenu(){
  const menu=$('#scrMenu'), lg=$('#logoEsp'); if(!lg || !menu.classList.contains('on') || !document.body.classList.contains('espaco')) return;
  const vis=[...menu.children].filter(e=>e.offsetParent!==null); if(!vis.length) return;
  const alto=vis[vis.length-1].getBoundingClientRect().bottom-vis[0].getBoundingClientRect().top, resto=alto-lg.offsetHeight;
  const w=Math.min(360, innerWidth-16), h=Math.round(Math.max(110, Math.min(altLogo(w), innerHeight-28-resto)));
  if(Math.abs(h-(lg._fh||0))>1) espCanvasFixo(lg, w, h, espLogo);
}
addEventListener('resize', ()=>requestAnimationFrame(ajustaMenu));
let TAG_MINA=null;
function espMenu(){
  const on=espTela(), menu=$('#scrMenu'), tag=menu.querySelector('.tagline');
  if(TAG_MINA==null) TAG_MINA=tag.textContent;
  tag.textContent = on ? '' : TAG_MINA; tag.style.display = on ? 'none' : '';   // no espaço o menu fica sem frase embaixo do nome
  document.title = on ? '2048 Astros' : 'Ptui!';
  // no espaço: Jogar (sem progresso) ou Continuar (com progresso) e o Clássico (4x4 sem fim).
  // Começar do zero fica nas Opções ("Apagar o progresso"), para não competir com o Continuar.
  const tem=temProgresso(), r=MISS(), est=Object.values(r).reduce((a,x)=>a+(x.e||0),0);
  $('#mCla').innerHTML = on ? 'Jogar<small>a jornada, fase a fase</small>' : 'Clássico<small>uma missão em cada fase</small>';
  $('#mCla').onclick = missoesLista;
  $('#mCla').style.display = on && tem ? 'none' : '';
  if(!$('#mSegue')){ const b=document.createElement('button'); b.className='btn g big'; b.id='mSegue'; b.textContent='Continuar'; b.onclick=continuarEsp; $('#mCla').after(b); }
  $('#mSegue').style.display = on && tem ? '' : 'none'; $('#mSegue').classList.add('comSub');   // o Continuar sempre diz de onde continua
  if(on && tem) $('#mSegue').innerHTML = `Continuar<small>fase ${faseAtual()} · ${est} ${est===1?'estrela':'estrelas'}</small>`;
  if(!$('#mInf')){ const b=document.createElement('button'); b.className='btn b big'; b.id='mInf'; b.innerHTML='Clássico<small>4x4 sem fim, até não caber mais nada</small>'; b.onclick=()=>infinitoJoga({retoma:true}); $('#mCla').after(b); }
  // com partida do Clássico salva, o botão continua de onde parou e diz isso na linha de baixo
  { const inf=infSalvo(), sub=$('#mInf small'); if(sub.dataset.txt==null) sub.dataset.txt=sub.textContent;
    sub.textContent = inf ? `continuar · ${(inf.st.pontos||0).toLocaleString('pt-BR')} pontos` : sub.dataset.txt; $('#mInf').classList.toggle('comSub', !!inf); }
  // o Clássico vem depois do Novo jogo e do Continuar; o Frenesi (em teste, só com ?frenesi) logo abaixo dele
  $('#mSegue').after($('#mInf')); freMenu(on);
  // Como jogar: no espaço abre o do 2048 Astros; fora dele, o tutorial da mina
  const tut=$('#mTut'); if(tut.onclick!==comoJogarEsp) TUT_MINA=tut.onclick; tut.onclick = on ? comoJogarEsp : TUT_MINA;
  if(!$('#mOpc')){ const b=document.createElement('button'); b.className='btn dim big'; b.id='mOpc'; b.textContent='Opções'; b.onclick=espOpcoes; tut.after(b); }
  $('#mOpc').style.display = on ? '' : 'none';
  if(!on) return;
  if(document.fonts?.load){ document.fonts.load("900 40px Orbitron"); document.fonts.load("700 20px 'Exo 2'"); }
  let lg=$('#logoEsp');
  if(!lg){ lg=document.createElement('canvas'); lg.id='logoEsp'; menu.insertBefore(lg, menu.firstChild); }
  const w=Math.min(360, innerWidth-16); if(!lg._fh) espCanvasFixo(lg, w, altLogo(w), espLogo);
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
function novoJogoEsp(volta){
  if(!temProgresso()){ missoesLista(); return; }
  janelaMenu();
  showOverlay(`<h2>Começar do zero?</h2><p>Suas estrelas e as fases liberadas serão apagadas.</p>
    <button class="btn g" id="nZera">Começar do zero</button><button class="btn dim" id="nVolta">Voltar</button>`);
  $('#nZera').onclick=()=>{ localStorage.removeItem('mina_missoes'); localStorage.removeItem('mina_cla_save'); hideOverlay(); missoesLista(); };
  const sai = typeof volta==='function' ? volta : fechaJanelaMenu;
  $('#nVolta').onclick=sai; FORA=sai;
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
    <button class="btn dim" id="oSnd">Sons: ${sound?'ligados':'desligados'}</button>
    <button class="btn dim" id="oCred">Créditos</button>
    ${RELATO_URL?'<button class="btn dim" id="oRel">Relatar bug ou sugestão</button>':''}
    ${temProgresso()?'<button class="btn dim" id="oZera">Apagar o progresso</button>':''}
    <button class="btn b" id="oOk">Voltar</button>`);
  if($('#oRel')) $('#oRel').onclick=relatar;
  if($('#oZera')) $('#oZera').onclick=()=>novoJogoEsp(espOpcoes);
  $('#oMus').onclick=()=>{ toggleMusic(); espOpcoes(); };
  $('#oSnd').onclick=()=>{ toggleSound(); espOpcoes(); };
  $('#oCred').onclick=()=>{ showOverlay(`<h2>Créditos</h2><ul>
      <li><b>Jogo:</b> Guilherme Franco.</li>
      <li><b>Planetas, texturas e cenário:</b> gerados por código, inspirados em imagens da NASA e da ESA.</li>
      <li><b>Músicas e efeitos:</b> tocados na hora pelo próprio jogo, sem arquivo de áudio.</li>
      <li><b>Fontes:</b> Orbitron e Exo 2 (SIL Open Font License).</li>
    </ul><button class="btn b" id="oVolta">Voltar</button>`); $('#oVolta').onclick=espOpcoes; FORA=espOpcoes; };
  $('#oOk').onclick=fechaJanelaMenu; FORA=fechaJanelaMenu;
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
  $('#cjAnt').onclick=()=>{ if(p) comoJogarEsp(p-1); else fechaJanelaMenu(); }; FORA=fechaJanelaMenu;
  // Jogar faz o mesmo que o botão principal do menu: continua a Jornada ou, sem progresso, abre o mapa dela
  $('#cjProx').onclick=()=>{ if(p<ult) comoJogarEsp(p+1); else if(temProgresso()) continuarEsp(); else missoesLista(); };
}

// ---------- til na Orbitron ----------
// A Orbitron desenha o til como crase ("Missào", "Opçòes"). Nos textos em Orbitron, ã e õ vão num span .til, na Exo 2
// e no tamanho que iguala a altura das letras (CSS). Um observador pega tudo o que entra na página, sem caçar título.
const TIL_RE=/[ãõÃÕ]/;
function tilOrbitron(raiz){
  if(!raiz || !document.body.classList.contains('espaco')) return;
  const it=document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), nos=[];
  for(let n=it.nextNode(); n; n=it.nextNode()) if(TIL_RE.test(n.nodeValue) && !n.parentNode.classList?.contains('til')) nos.push(n);
  for(const n of nos){ const pai=n.parentNode;
    if(!/^["']?Orbitron/i.test(getComputedStyle(pai).fontFamily)) continue;
    const fr=document.createDocumentFragment();
    for(const p of n.nodeValue.split(/([ãõÃÕ])/)){ if(!p) continue;
      if(TIL_RE.test(p)){ const s=document.createElement('span'); s.className = p===p.toLowerCase() ? 'til' : 'til M'; s.textContent=p; fr.appendChild(s); }
      else fr.appendChild(document.createTextNode(p)); }
    pai.replaceChild(fr,n); }
}
new MutationObserver(rs=>{ for(const r of rs){
  if(r.type==='characterData'){ if(TIL_RE.test(r.target.nodeValue)) tilOrbitron(r.target.parentNode); continue; }
  for(const n of r.addedNodes) if(TIL_RE.test(n.textContent||'')) tilOrbitron(n.nodeType===3 ? n.parentNode : n); } })
  .observe(document.body, {childList:true, subtree:true, characterData:true});

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
  if(o.rache) return o.rache>1 ? `Rache ${o.rache} lixos espaciais` : 'Rache o lixo espacial';
  if(o.terra) return o.terra>1 ? `Desfaça a nebulosa de ${o.terra} casas` : 'Desfaça a nebulosa';
  if(o.carrinho) return `Leve ${qtd(o.n,o.carrinho)} até a nave`;
  return null;
}
function rotuloEsp(o){
  const varias=(o.n||1)>1;   // singular ou plural conforme a meta
  if(o.quebre) return 'engolidas'; if(o.alvo) return varias?'órbitas douradas':'órbita dourada'; if(o.leve) return varias?'nas órbitas douradas':'na órbita dourada'; if(o.carrinho) return 'na nave'; if(o.rache) return o.rache>1?'lixos rachados':'lixo rachado'; if(o.terra) return 'nebulosa desfeita';
  if(o.solte) return (artigo(rockName(o.solte))==='uma'?'solta':'solto')+(varias?'s':'');   // Rocha solta, Asteroide solto
  return null;
}
// ícone de cada mundo no cabeçalho da lista de fases
function icoMundoEsp(gi){
  const img = u => `<image href="${u}" x="4" y="4" width="92" height="92"/>`;
  const orbita = () => `<image href="${fotoEsp('orbita',FOTOS_ESP.orbita)}" x="0" y="0" width="100" height="100"/>`;
  const inner = [()=>planetaInner(1), estacaoInner, ()=>img(urlObj('rochinha')), orbita, ()=>img(urlObj('nave')), lixoInner, nebInner, orbita, gaiolaInner, ()=>planetaInner(6,0)][gi] || (()=>planetaInner(1));
  return `<svg class="espIco" viewBox="0 0 100 100">${inner()}</svg>`;
}

// ---------- relatar bug ou sugestão ----------
// O relato vai para a planilha do Guilherme ("2048 Stars · relatos"), por um script do Google publicado como app da web:
// a mensagem, onde no jogo, aparelho, versão, foto da tela, o estado da partida (para reproduzir o erro) e os erros
// recentes. A foto sai antes da janela abrir, com a tela do jeito que a pessoa estava vendo.
// Sem o endereço configurado (ou sem internet), a janela oferece copiar o relato.
const RELATO_URL = '';   // endereço do app da web (Apps Script "2048 Stars relatos")
const ERROS_RECENTES = [];
function anotaErro(onde, e){ ERROS_RECENTES.push(`${new Date().toISOString().slice(11,19)} ${onde}: ${(e&&(e.message||e))||e}`.slice(0,300)); if(ERROS_RECENTES.length>10) ERROS_RECENTES.shift(); }
addEventListener('error', e=>anotaErro(`${(e.filename||'').split('/').pop()}:${e.lineno}`, e.message));
addEventListener('unhandledrejection', e=>anotaErro('promessa', e.reason));
let H2C=null;   // biblioteca que fotografa a página, carregada só na hora de relatar
function carregaFoto(){ return H2C || (H2C=new Promise((ok,erro)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/html2canvas-pro@2.6.3/dist/html2canvas-pro.min.js';   // a versão mantida entende as cores novas do CSS
  s.onload=()=>{ const h=window.html2canvas; ok(typeof h==='function'?h:h&&(h.default||h.html2canvas)); }; s.onerror=()=>{ H2C=null; erro(new Error('sem a biblioteca da foto')); }; document.head.appendChild(s); })); }
async function fotoDaTela(){
  try{
    const h2c=await carregaFoto();
    // os planetas são da placa de vídeo: guarda o quadro agora, porque a foto copiaria essa camada em branco
    let gl=null; const cv=document.getElementById('glPlan');
    if(cv && GLON){ try{ quadroN++; glQuadro(tQuadro||performance.now()/1000); gl=cv.toDataURL('image/png'); }catch(e){} }
    const k=Math.min(1, 540/innerWidth);
    const img=await h2c(document.body,{backgroundColor:'#0b0a18', scale:k, logging:false, useCORS:true, x:scrollX, y:scrollY, width:innerWidth, height:innerHeight,
      onclone:doc=>{ const c2=doc.getElementById('glPlan'); if(!c2||!gl) return; const cs=getComputedStyle(cv), im=doc.createElement('img'); im.src=gl;
        im.style.cssText=`position:absolute;left:${cs.left};top:${cs.top};width:${cs.width};height:${cs.height};z-index:${cs.zIndex};pointer-events:none`; c2.replaceWith(im); }});
    return img.toDataURL('image/jpeg',.72);
  }catch(e){ anotaErro('foto', e); return null; }
}
function ondeNoJogo(){
  if(!S) return 'início';
  if(S.missao) return `Jornada, fase ${S.missao} (${nomeFaseCla(S.missao)})${S.phase&&S.phase!=='mine'?' · '+S.phase:''}`;
  if(S.infinito) return S.frenesi ? 'Frenesi' : 'Clássico';
  if(S.phase==='lista') return 'mapa da Jornada';
  if($('#scrMenu')?.classList.contains('on')) return 'menu';
  return S.lab ? 'Laboratório' : 'Mineração';
}
function estadoDaPartida(){
  if(!S || !(S.missao||S.infinito)) return '';
  const st={missao:S.missao, infinito:!!S.infinito, W, H, char:S.char, phase:S.phase, moves:S.moves, energy:S.energy, pontos:S.pontos, maxForm:S.maxForm, espMax:S.espMax,
    tiles:S.tiles, walls:S.walls, edges:S.edges, alvos:S.alvos, terra:[...(S.terra||[])], carro:S.carro, rachados:S.rachados, seqI:S.seqI, soltas:S.soltas};
  try{ return JSON.stringify(st,(k,v)=>v instanceof Set?[...v]:v).slice(0,40000); }catch(e){ return 'não deu para guardar: '+e.message; }
}
async function relatar(){
  hideOverlay();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));   // a tela sem a janela, para a foto
  const foto=await fotoDaTela();
  let tipo='bug';
  showOverlay(`<div class="relato">
    <h2>Relatar</h2>
    <div class="relTipo"><button class="btn b" data-t="bug">Bug</button><button class="btn dim" data-t="sugestão">Sugestão</button></div>
    <textarea id="relTexto" rows="5" maxlength="2000" placeholder="O que aconteceu? Ou o que você mudaria no jogo?"></textarea>
    ${foto?`<label class="relFoto"><input type="checkbox" id="relComFoto" checked><img src="${foto}" alt=""><span>Mandar a foto da tela</span></label>`:''}
    <p class="ajuda">Vai junto: onde você estava no jogo, o aparelho e a partida, para dar para ver exatamente o que aconteceu.</p>
    <p class="relAviso" id="relAviso"></p>
    <button class="btn g" id="relEnvia">${RELATO_URL?'Enviar':'Copiar o relato'}</button>
    <button class="btn dim" id="relVolta">Voltar</button></div>`);
  FORA=null;   // tocar fora não fecha: não pode perder o que a pessoa escreveu
  document.querySelectorAll('.relTipo .btn').forEach(b=>b.onclick=()=>{ tipo=b.dataset.t; document.querySelectorAll('.relTipo .btn').forEach(x=>x.className='btn '+(x===b?'b':'dim')); });
  $('#relVolta').onclick=hideOverlay;
  $('#relEnvia').onclick=async()=>{
    const texto=$('#relTexto').value.trim(), aviso=$('#relAviso');
    if(!texto){ aviso.textContent='Escreva uma frase contando o que foi.'; $('#relTexto').focus(); return; }
    const d={jogo:'2048 Stars', tipo, texto, onde:ondeNoJogo(), versao:typeof VERSAO!=='undefined'?VERSAO:'?',
      aparelho:`${navigator.userAgent} · tela ${innerWidth}x${innerHeight} @${devicePixelRatio} · webgl ${GLON?'sim':'não'}`,
      estado:estadoDaPartida(), erros:ERROS_RECENTES.join('\n'), foto:(foto && $('#relComFoto')?.checked)?foto:''};
    const b=$('#relEnvia'); b.disabled=true;
    if(!RELATO_URL){ const txt=`2048 Astros · ${tipo}\n${texto}\n\nOnde: ${d.onde}\nVersão: ${d.versao}\nAparelho: ${d.aparelho}`;
      try{ await navigator.clipboard.writeText(txt); aviso.textContent='Copiado. Agora é só colar na conversa com o Guilherme.'; }catch(e){ aviso.textContent='Não deu para copiar.'; } b.disabled=false; return; }
    b.textContent='Enviando…';
    try{ await fetch(RELATO_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)});
      showOverlay(`<h2>Obrigado!</h2><p>Chegou. Cada relato ajuda a deixar o jogo melhor.</p><button class="btn g" id="relOk">Voltar ao jogo</button>`); FORA=hideOverlay; $('#relOk').onclick=hideOverlay;
    }catch(e){ anotaErro('envio', e); b.disabled=false; b.textContent='Tentar de novo'; aviso.textContent='Não deu para enviar (sem internet?). Tente de novo daqui a pouco.'; }
  };
}

// ---------- entrada da fase (jeito A do rascunho entrada.html, escolhido em 2026-11-09) ----------
// Uma coluna com respiro: número e nome da fase, o planeta grande com o "×N", a meta numa linha, a receita em ícones,
// tamanho e arrastos em etiquetas, as estrelas em três caixinhas (as já ganhas acesas) e um botão só. O Voltar é o ✕
// (tocar fora também fecha). A explicação longa só aparece na fase em que a novidade estreia; nas outras ela fica
// guardada num "como funciona" que abre com um toque.
let ESTREIA=null;   // texto da explicação -> fase em que ela aparece pela primeira vez
function estreiaDe(txt){
  if(!ESTREIA){ ESTREIA=new Map(); MISSOES.forEach((m,i)=>{ for(const t of explicaEsp(m)) if(!ESTREIA.has(t)) ESTREIA.set(t,i+1); }); }
  return ESTREIA.get(txt)||0;
}
function entradaEsp(n){
  const m=MISSOES[n-1], b=MISS()[n], sv=faseSalva(n), ms=metasDe(m), proib=objsDe(m).find(o=>o.proibido), fase=faseDe(m), fm=formaDe(m), np=PATHS[fase].n;
  const um=ms.length===1 && !proib, o=ms[0], tA=tAlvo(m), qtd=um ? (o.n||o.terra||o.rache||o.solte||1) : 0;
  const tam=fm?`${fw(fm)}x${fh(fm)}`:`${m.w||np||4}x${m.h||m.w||np||4}`;
  const chips=[tam, m.livre?'sem limite de arrastos':arrastosTxt(m)];
  if(m.regras?.spawns===0) chips.push('quebra-cabeça'); if(charDe(m)==='passinho') chips.push('Passinho');
  const est = m.livre ? (()=>{ const [t2,t3]=tetoEst(m); return ['cumprir',`até ${t2} arrastos`,`até ${t3} arrastos`]; })()
                      : ['cumprir',`sobrando ${m.estrelas[0]}`,`sobrando ${m.estrelas[1]}`];
  const exp=explicaEsp(m), novas=exp.filter(t=>estreiaDe(t)===n), velhas=exp.filter(t=>estreiaDe(t)!==n);
  const metas = um ? `<div class="meta">${objetivoTxt(o)}</div>`
    : `<div class="metasL">${ms.map(x=>`<div>${iconeObj(x)}<span>${objetivoTxt(x)}</span></div>`).join('')}${proib?`<div class="proib">${iconeObj(proib)}<span>Não forme ${artigo(rockName(proib.proibido))} ${rockName(proib.proibido)}</span></div>`:''}</div>`;
  const receita = um && o.forme>=2 ? `<div class="rec">${icoPlaneta(o.forme-1)}<i>+</i>${icoPlaneta(o.forme-1)}<i>=</i>${icoPlaneta(o.forme)}</div>` : '';
  const passinho = b?.e && charDe(m)!=='passinho', ganhou=b?.e||0;
  showOverlay(`<div class="ent"><button class="fecha" id="mVolta" aria-label="Voltar">✕</button>
    <div class="num">FASE ${n}</div><h2>${noIco(nomeFaseCla(n))}${m.chefe?' · fim do mundo':''}</h2>
    ${tA?`<div class="pl"><canvas id="espInfo"></canvas>${um&&qtd>1&&!o.pontos?`<b class="xN">×${qtd}</b>`:''}</div>`:''}
    ${metas}${receita}
    <div class="chips">${chips.map(c=>`<span>${c}</span>`).join('')}</div>
    <div class="estr3">${est.map((t,i)=>`<div class="${i<ganhou?'ok':''}"><b>${'★'.repeat(i+1)}</b><small>${t}</small></div>`).join('')}</div>
    ${novas.map(t=>`<div class="novo"><i>NOVO</i>${t}</div>`).join('')}
    ${velhas.length?`<details class="lembra"><summary>como funciona</summary>${velhas.map(t=>`<p>${t}</p>`).join('')}</details>`:''}
    ${sv?`<button class="btn g" id="mCont">Continuar</button><button class="btn dim pequeno" id="mJoga">começar de novo</button>`:'<button class="btn g" id="mJoga">Jogar</button>'}
    ${passinho?`<button class="btn dim pequeno" id="mPass">${b.pm?'jogar de novo no Passinho':'jogar no Passinho (medalha)'}</button>`:''}
  </div>`);
  FORA=hideOverlay; $('#mVolta').onclick=hideOverlay;
  $('#mJoga').onclick=()=>comecaFase(n);   // pergunta antes se outra fase está pela metade
  if($('#mCont')) $('#mCont').onclick=()=>missaoJoga(n,{retoma:true});
  if($('#mPass')) $('#mPass').onclick=()=>comecaFase(n,{passinho:true});
  if(tA) espPlanetaGrande($('#espInfo'),tA,'info');
}
