// ===================== QUEBRA-CABEÇAS (modo em teste) =====================
// Uma jornada inteira só de quebra-cabeças: nenhuma peça nova nasce, o pedido é só a ordem certa dos arrastos.
// Mundos e fases em quebra_fases.js. O mapa, a entrada da fase, o jogo da fase e a gravação são os da Jornada
// (classico.js e espaco_jogo.js) com a jornada atual JA = QUEBRA: progresso em ptui_qj ({n: {e: estrelas, t: pontos,
// a: menor número de arrastos}}) e a fase pela metade em ptui_qj_save (com o começo da fase e a pilha do desfazer, S.qj).
// Na fase: desfazer sem limite (volta o arrasto contado) e recomeçar na hora (que também se desfaz, por isso sem
// confirmação), os dois sempre à vista no painel de cima; no teclado, Z (ou Backspace) e R. Acabaram os arrastos, não há
// saída ou formou o proibido: a fase não acaba, fica parada até desfazer ou recomeçar. Estrelas pelos arrastos: ★ dentro
// do limite, ★★ até min+3, ★★★ até min+1 (ou o campo estrelas da fase); sem meta de pontos. Música: a Órbita, a da Jornada.
// Só aparece com ?quebra no endereço (fica gravado no aparelho; ?quebra=0 esconde), no menu do espaço, abaixo do Clássico.
(()=>{ const m=location.search.match(/[?&]quebra(?:=(\d))?/); if(m) localStorage.ptui_quebra = m[1]==='0' ? '0' : '1'; })();
const quebraLigado = () => localStorage.ptui_quebra!=='0' && espacoLigado();   // oficial desde 2026-11-11: aparece para todos (?quebra=0 esconde)

// ---------- dados ----------
// completa as fases: nunca nasce peça, menor solução, limite, estrelas e a fase das cores ou do buraco negro (explicação)
QJ_FASES.forEach(m=>{
  m.regras={...(m.regras||{}), spawns:0};
  if(m.min==null) m.min=Math.max(1,(m.arrastos||10)-5);
  if(!m.arrastos) m.arrastos=m.min+5;
  if(!m.estrelas) m.estrelas=[Math.max(0,m.arrastos-m.min-3), Math.max(0,m.arrastos-m.min-1)];
  if(!m.fase){ const ps=m.pecas||[]; if(ps.some(p=>p[4]==='p')) m.fase='picareta'; else if(ps.some(p=>p[3]!=null)) m.fase='cores'; }
});
// desenho do mundo no mapa, quando o mundo não diz (icoMundoEsp): pela meta e pelo tabuleiro da primeira fase dele
function qjIcoDe(m){
  const o=metasDe(m)[0]||{};
  if(o.leve||o.alvo) return 'orbita'; if(o.carrinho) return 'nave'; if(o.rache) return 'lixo'; if(o.terra) return 'nebulosa'; if(o.solte) return 'gaiola';
  if(m.fase==='cores') return 'aura'; if((m.mapa||[]).some(l=>l.includes('B'))) return 'estacao'; if(m.muretas?.length) return 'rochas';
  return 'planeta';
}
QJ_MUNDOS.forEach((g,gi)=>{ g.tema=g.tema||1; g.fase=g.fase||'comum'; if(!g.ico){ const m=QJ_FASES.find(f=>f.g===gi); g.ico=m?qjIcoDe(m):'planeta'; } });
const QUEBRA = {id:'quebra', nome:'Quebra-cabeças', mundos:QJ_MUNDOS, fases:QJ_FASES, chave:'ptui_qj', salvo:'ptui_qj_save', quebra:true};
// textos da entrada da fase que mudam neste modo (explicaEsp): cada um aparece como NOVO só na fase em que estreia
const COMO_QJ = {
  modo:'Quebra-cabeça: nenhuma peça nova nasce, o tabuleiro é só este. Ache a ordem certa dos arrastos. ↶ desfaz o último arrasto e ↻ recomeça a fase, quantas vezes quiser.',
  passinho:'Passinho: tudo anda só uma casa por arrasto, como no Threes.',
  picareta:'Buraco negro: dois iguais se juntam num maior; quando encontra um planeta do mesmo nível, engole o planeta.',
};
// arrastos para ★, ★★ e ★★★; e a meta de perfeição (a menor solução), discreta, na entrada da fase
const qjTetos = m => [m.arrastos, m.arrastos-m.estrelas[0], m.arrastos-m.estrelas[1]];
// (e, discreto também, o custo da dica: a partida com dica vale até ★★; sv: a partida salva, se já usou)
const qjPerfeito = (m,b,sv) => `<div class="perf">melhor possível: <b>${m.min}</b> arrastos${b?.a!=null?` · seu melhor: ${b.a}`:''}<br>${sv?.qj?.dicas?'nesta partida você usou dica: vale até ★★':'com dica, a fase vale até ★★'}</div>`;
const qjAtual = () => { const r=MISS(QUEBRA); return (QJ_FASES.findIndex((m,i)=>!(r[i+1]?.e)) + 1) || QJ_FASES.length; };

// ---------- menu ----------
// botão logo abaixo do Clássico (só com ?quebra); com progresso, diz de onde continua
function qjMenu(on){
  let b=$('#mQj');
  if(!quebraLigado()){ if(b) b.style.display='none'; return; }
  if(!b){ b=document.createElement('button'); b.className='btn big'; b.id='mQj'; b.innerHTML='Quebra-cabeças<small></small>'; b.onclick=qjEntra; }
  $('#mInf').after(b); b.style.display = on ? '' : 'none';
  const est=Object.values(MISS(QUEBRA)).reduce((a,x)=>a+(x.e||0),0), tem=est>0 || !!localStorage[QUEBRA.salvo];
  b.querySelector('small').textContent = tem ? `fase ${qjSalva()||qjAtual()} · ${est} ${est===1?'estrela':'estrelas'}` : 'só a ordem certa dos arrastos';
  b.classList.toggle('comSub', tem);
}
const qjSalva = () => { const sv=JSON.parse(localStorage[QUEBRA.salvo]||'null'); return sv && QJ_FASES[sv.n-1] ? sv.n : 0; };
// abre o mapa já com a entrada da fase de onde parou (a que está pela metade, ou a primeira sem estrela)
function qjEntra(){ missoesLista(QUEBRA); missaoInfo(qjSalva()||qjAtual()); }

// ---------- na fase ----------
const qjFoto = () => JSON.parse(JSON.stringify(estadoFase()));
let qjVer=0;   // muda a cada arrasto, desfazer, recomeçar e fase nova (a dica em andamento desiste)
// chamado por missaoJoga: o começo da fase (para recomeçar) e a pilha do desfazer; continuando, os da fase salva
function qjComeca(sv){
  S.qj = sv?.qj || {ini:qjFoto(), pilha:[], trava:null, dicas:0};
  qjVer++; qjDicaLimpa(); document.body.classList.add('modoQj');
  if(S.qj.trava) setTimeout(()=>{ if(S.qj?.trava) qjTravou(S.qj.trava, true); });   // parou sem saída: continua parada
}
// antes de cada arrasto (move, jogo.js): o estado de agora vai para a pilha. Na memória, até 400 (cada recomeçar também
// empilha); no salvo, as 60 últimas, para gravar a cada arrasto continuar barato
function qjGuarda(){ qjVer++; qjDicaLimpa(); S.qj.pilha.push(qjFoto()); if(S.qj.pilha.length>400) S.qj.pilha.shift(); }
const qjSalvo = () => ({...S.qj, pilha:S.qj.pilha.slice(-60)});
const qjPode = () => !!S?.qj && S.phase==='mine' && !overlayOpen() && $('#scrGame').classList.contains('on');
// volta a um estado guardado. As peças que continuam (mesmo id) deslizam de volta para a casa de antes e só a que mudou
// de nível é redesenhada; as que tinham sumido (juntadas, recolhidas pela nave) voltam; o lixo é refeito (a vida dele)
function qjVolta(st){
  qjVer++; qjDicaLimpa();
  for(const k of CAMPOS_SAVE) if(st[k]!==undefined) S[k]=st[k];
  S.terra=new Set(st.terra||[]); S.qj.trava=null;
  const ids=new Set([...S.tiles, ...S.walls.filter(w=>!w.lixo), ...(S.edges||[])].map(o=>o.id));
  for(const [id,el] of els) if(!ids.has(id)){ el.remove(); els.delete(id); }
  render(); salvaFase(); SFX.arrastar();
}
function qjDesfaz(){
  if(!qjPode() || !S.qj.pilha.length) return;
  const falta=QJ_VOLTA;   // a dica mandou desfazer: o número no botão vai descontando
  qjVolta(S.qj.pilha.pop()); setBanner(null, metaLetreiro(faseM()));
  if(falta>1) qjMostraVolta(falta-1, true); else if(falta===1) setBanner(null, 'daqui tem saída · a lâmpada mostra o próximo');
}
// recomeçar vai para a pilha também: o desfazer volta para onde estava (nada se perde, então não pergunta)
function qjRecomeca(){
  if(!qjPode() || !(S.moves>0 || S.qj.trava)) return;
  S.qj.pilha.push(qjFoto()); qjVolta(JSON.parse(JSON.stringify(S.qj.ini)));
  setBanner(null, 'de volta ao começo · ↶ desfaz'); voltaMeta();
}
// sem saída (acabaram os arrastos, não cabe mais nada, formou o proibido): a fase fica parada e os botões chamam
// (quieto: ao continuar uma fase que já tinha parado assim)
function qjTravou(txt, quieto){
  S.qj.trava=txt; setBanner(null, `${txt} · ↶ desfaça`); salvaFase(); qjHud();
  if(quieto!==true) SFX.naoDeu();
}
function qjHud(){
  const d=$('#qjDesfaz'), r=$('#qjRecomeca'), p=$('#qjP'); if(!d || !S?.qj) return;
  const semD=!S.qj.pilha.length, semR=!(S.moves>0 || S.qj.trava), tr=!!S.qj.trava;
  if(d.disabled!==semD) d.disabled=semD; if(r.disabled!==semR) r.disabled=semR;
  if(p.classList.contains('chama')!==tr) p.classList.toggle('chama', tr);
}
$('#qjDesfaz').onclick=qjDesfaz; $('#qjRecomeca').onclick=qjRecomeca; $('#qjDica').onclick=qjDica;
addEventListener('keydown',e=>{ if(!S?.qj || e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea')) return;
  const k=e.key.toLowerCase(); if(k==='z'||k==='backspace'){ e.preventDefault(); qjDesfaz(); } else if(k==='r'){ e.preventDefault(); qjRecomeca(); }
  else if(k==='h'){ e.preventDefault(); qjDica(); } });


// ---------- dica ----------
// A lâmpada procura, a partir do estado de agora, a menor solução que cabe nos arrastos que sobram e mostra o próximo
// arrasto: uma seta acesa sobre o tabuleiro e as peças ensaiando o movimento. A busca é em largura, com o slide() do
// jogo e as metas conferidas pelo medidor das fases (testes/calibrar/quebra_medidor.js, montado no index.html pelo
// build.py; ele confere como contaMissao, recolheCarro, violou e cumpriu). Sem solução daqui: procura para trás na
// pilha do desfazer o estado mais recente que ainda tem (com os arrastos que sobravam nele) e diz quantos desfazer; se
// é o começo, ou nenhum deles tem, manda recomeçar.
// Não trava o jogo: anda em pedaços de 8 ms, com "pensando…" passados 150 ms, e para em 200 mil estados ou 8 s. O que
// descobre fica guardado para a fase: a menor solução de cada estado do caminho achado e, dos estados sem saída, com
// quantos arrastos sobrando (a dica seguinte, seguindo a anterior, sai na hora; a busca para trás pula o que já sabe).
// Custo: a partida com dica vale no máximo ★★ e sem "Perfeito!" (S.qj.dicas, salvo com a fase; recomeçar não apaga,
// começar a fase de novo apaga). Dicas sem limite. Na primeira, uma linha NOVO explica.
const QJ_DICA={pedaco:8, pensa:150, estados:200000, tempo:8000};
let QJM=null, QJ_D=null, qjPensando=null, QJ_VOLTA=0, QJ_ANIS=[];
// o medidor com o slide() do jogo: W, H e S trocados só durante cada pedaço da busca (qjBusca devolve os do jogo)
const qjMed = () => QJM || (QJM=QM.QuebraMedidor({slide:(t,dx,dy)=>slide(t,dx,dy), ajusta:(w,h,walls,edges,ch)=>{ W=w; H=h; S={walls,edges,char:ch}; }}));
function qjDicaFase(){ const m=faseM(); if(!QJ_D || QJ_D.m!==m) QJ_D={m, ctx:qjMed().contexto(m).ctx, sol:new Map(), morto:new Map()}; return QJ_D; }
// o estado do jogo (S, ou um da pilha do desfazer) no formato do medidor (o ini de contexto() em quebra_medidor.js)
function qjEstadoMed(o){
  const q=metasDe(faseM()).find(x=>x.quebre);
  return {ts:o.tiles.map(t=>({...t})), lx:(o.walls||[]).filter(w=>w.lixo).map(w=>({x:w.x,y:w.y,hp:w.hp})), tr:[...(o.terra||[])],
    al:(o.alvos||[]).map(a=>({...a})), ca:o.carro?{...o.carro}:null, max:o.maxForm||0,
    f:{feitas:{...(o.feitas||{})}, cores:{...(o.coresF||{})}, combos:o.combos||0, soltas:o.soltas||0, rach:o.rachados||0,
       quebras:q?(o.quebras||[]).filter(t=>t>=q.quebre).length:0}};
}
// busca em largura a partir de st0 com até R arrastos, em pedaços: passo(fim) trabalha até a hora fim e diz se acabou;
// o resultado fica em pronto: {d: tamanho da menor solução, di: primeiro arrasto, cam}, {d:null} sem solução, ou
// {estourou:true}
function qjBusca(D, st0, R){
  const M=qjMed(), ctx=D.ctx, k0=M.chave(ctx,st0), t0=performance.now();
  const c=D.sol.get(k0); if(c && c.d<=R) return {pronto:{d:c.d, di:c.di, guardada:true}};
  if(R<=0 || (D.morto.get(k0)??-1)>=R) return {pronto:{d:null}};
  const prof=new Map([[k0,0]]); let nivel=[{st:st0,k:k0,pai:null,di:-1}], prox=[], i=0, d=0;
  const B={pronto:null, passo(fim){
    const S0=S, W0=W, H0=H;
    try{ for(let n=0;;n++){
      if(i>=nivel.length){   // acabou a camada d: sem solução até aqui; sem mais camadas, nenhum estado visto tem saída
        d++; if(!prox.length || d>=R){ for(const [k,p] of prof) if((D.morto.get(k)??-1)<R-p) D.morto.set(k,R-p); B.pronto={d:null, estados:prof.size}; return true; }
        nivel=prox; prox=[]; i=0; }
      if((n&15)===15 && performance.now()>fim) return false;
      const no=nivel[i++];
      for(let di=0;di<4;di++){ const res=M.passo(ctx,no.st,di); if(!res || res.fim==='proibido') continue;
        if(res.fim==='venceu'){   // a menor solução: o caminho até aqui e este arrasto; cada estado dele fica guardado
          const cam=[di], nos=[no]; for(let q=no;q.pai;q=q.pai){ cam.unshift(q.di); nos.unshift(q.pai); }
          nos.forEach((q,j)=>D.sol.set(q.k,{d:cam.length-j, di:cam[j]}));
          B.pronto={d:cam.length, di:cam[0], cam, estados:prof.size}; return true; }
        if(d+1>=R) continue;
        const k=M.chave(ctx,res.ns); if(prof.has(k) || (D.morto.get(k)??-1)>=R-d-1) continue;
        prof.set(k,d+1); prox.push({st:res.ns,k,pai:no,di}); }
      no.st=null;
      if(prof.size>QJ_DICA.estados || performance.now()-t0>QJ_DICA.tempo){ B.pronto={estourou:true, estados:prof.size}; return true; }
    } } finally { S=S0; W=W0; H=H0; }
  }};
  return B;
}
// roda a busca em pedaços, um por tarefa (entre eles o jogo desenha os quadros e responde ao dedo); cancela se a
// partida mudar. A próxima tarefa vem por um MessageChannel: o setTimeout(0) seguido espera 4 ms ou mais a cada pedaço
const QJ_CANAL=new MessageChannel(), QJ_FILA=[];
QJ_CANAL.port1.onmessage=()=>{ const f=QJ_FILA.shift(); if(f) f(); };
const qjDepois = f => { QJ_FILA.push(f); QJ_CANAL.port2.postMessage(0); };
function qjRoda(D, st, R, ver){ return new Promise(ok=>{ const b=qjBusca(D,st,R); if(b.pronto) return ok(b.pronto);
  const vai=()=>{ if(qjVer!==ver || !S?.qj) return ok({cancelou:true}); if(b.passo(performance.now()+QJ_DICA.pedaco)) ok(b.pronto); else qjDepois(vai); }; vai(); }); }
async function qjDica(){
  if(!qjPode() || qjPensando) return;
  qjDicaLimpa();
  const D=qjDicaFase(), ver=qjVer, t0=performance.now(), bt=$('#qjDica');
  qjPensando=setTimeout(()=>{ bt.classList.add('pensa'); setBanner(null,'pensando…'); }, QJ_DICA.pensa);
  let r=null, volta=0, alvo=null, est=0;
  try{
    r=await qjRoda(D, qjEstadoMed(S), Math.max(0,S.energy), ver); est+=r.estados||0;
    if(r.d==null && !r.cancelou && !r.estourou){   // sem saída daqui: o estado mais recente da pilha que ainda tem
      // (o começo da fase, 0 arrastos, sempre tem: min cabe nos arrastos; não precisa procurar)
      const P=S.qj.pilha;
      for(let j=P.length-1;j>=0;j--){ const q=P[j].moves ? await qjRoda(D, qjEstadoMed(P[j]), P[j].energy, ver) : {d:faseM().min}; est+=q.estados||0;
        if(q.cancelou||q.estourou){ r=q; break; } if(q.d!=null){ volta=P.length-j; alvo=P[j]; break; } } }
  } finally { clearTimeout(qjPensando); qjPensando=null; bt.classList.remove('pensa'); }
  D.ultima={ms:Math.round(performance.now()-t0), estados:est};   // para medir (testes/quebra.html)
  if(r.cancelou || qjVer!==ver || !qjPode()){   // a partida mudou enquanto pensava: a dica desiste (e o letreiro volta)
    if(S?.qj && S.phase==='mine' && $('#bSub').textContent==='pensando…') setBanner(null, S.qj.trava ? `${S.qj.trava} · ↶ desfaça` : metaLetreiro(faseM()));
    return; }
  if(r.estourou){ setBanner(null,'a dica não achou a tempo · tente desfazer'); return; }
  S.qj.dicas=(S.qj.dicas||0)+1; salvaFase();
  if(r.d!=null) qjMostraSeta(r.di, r.d);
  else if(volta) qjMostraVolta(volta, false, !alvo.moves);   // voltando ao começo: desfazer tudo ou recomeçar, tanto faz
  else qjMostraRecomeca();   // nenhum estado da pilha tem saída (a pilha guarda os 400 últimos; o salvo, os 60)
  if(!localStorage.ptui_qj_dica){ localStorage.ptui_qj_dica='1'; qjAviso('<i>NOVO</i>A lâmpada mostra o próximo arrasto de uma solução que cabe nos arrastos que sobram. Com dica, a fase vale até ★★.', 'novo'); }
}
const QJ_NOME_DIR=['para a direita','para a esquerda','para baixo','para cima'], QJ_GIRO=[0,180,90,-90];
// a seta acesa no tabuleiro e o ensaio: as peças que o arrasto mexe vão um pouco na direção dele e voltam, duas vezes
function qjMostraSeta(di, d){
  const [dx,dy]=qjMed().DIRS[di], el=document.createElement('div');
  el.className='qjSeta'; el.dataset.di=di; el.innerHTML=`<svg viewBox="0 0 100 100" style="transform:rotate(${QJ_GIRO[di]}deg)"><path d="M16 50H78M54 24 80 50 54 76"/></svg>`;
  board.appendChild(el);
  setBanner(null, `dica: arraste ${QJ_NOME_DIR[di]} · ${d===1?'e pronto!':`faltam ${d}`}`);
  if(POUCO_MOV) return;
  const r=slide(S.tiles,dx,dy), vai=new Map([...r.tiles,...r.gone].map(t=>[t.id,t]));
  for(const t of S.tiles){ const q=vai.get(t.id), e=els.get(t.id); if(!q || !e || (q.x===t.x && q.y===t.y)) continue;
    const a=pos(t.x,t.y), b=pos(t.x+(q.x-t.x)*.4, t.y+(q.y-t.y)*.4);
    QJ_ANIS.push(e.animate([{transform:a},{transform:b,offset:.45},{transform:a}],{duration:1000,iterations:2,delay:200,easing:'ease-in-out'})); }
}
// sem saída daqui: o desfazer acende com quantos faltam (quieto: só o botão, descontando depois de um desfazer; tudo:
// a volta é até o começo, então o recomeçar acende também)
function qjMostraVolta(n, quieto, tudo){
  QJ_VOLTA=n; const b=$('#qjDesfaz'); b.classList.add('chama'); b.dataset.n=n;
  if(tudo && n>1) $('#qjRecomeca').classList.add('chama');
  setBanner(null, `sem saída daqui · desfaça ${n}`);
  if(!quieto) qjAviso(`Daqui não tem mais saída. Desfaça ${n===1?'o último arrasto':`${n} arrastos`}${tudo&&n>1?', ou recomece':''}.`);
}
function qjMostraRecomeca(){
  $('#qjRecomeca').classList.add('chama'); setBanner(null, 'sem saída daqui · recomece');
  qjAviso('Daqui não tem mais saída. Recomece a fase.');
}
// avisos logo embaixo do tabuleiro, sem cobrir as peças; se não couberem ali (tela baixa), no pé da tela. Somem no
// próximo arrasto. 'novo': a linha da primeira dica. (Medir aqui é uma vez por dica, não por quadro.)
function qjAviso(html, tipo=''){
  let c=document.querySelector('.qjAvisos'); if(!c){ c=document.createElement('div'); c.className='qjAvisos'; document.body.appendChild(c); }
  const el=document.createElement('div'); el.className='qjAviso '+tipo; el.innerHTML=html; c.appendChild(el);
  const b=board.getBoundingClientRect(), h=c.getBoundingClientRect().height, cabe=b.bottom+10+h<=innerHeight-6;
  c.style.top = cabe ? Math.round(b.bottom+10)+'px' : 'auto'; c.style.bottom = cabe ? 'auto' : '10px'; }
function qjDicaLimpa(){
  for(const a of QJ_ANIS) a.cancel(); QJ_ANIS=[]; QJ_VOLTA=0;
  document.querySelectorAll('.qjSeta,.qjAvisos').forEach(e=>e.remove());
  for(const b of [$('#qjDesfaz'), $('#qjRecomeca')]){ if(b.classList.contains('chama')) b.classList.remove('chama'); if(b.dataset.n) delete b.dataset.n; }
}

// ---------- vitória ----------
// (não cumprir não chega aqui: qjTravou). Os arrastos usados, as estrelas e, discreto, o melhor possível
function qjResultado(){
  const n=S.missao, m=faseM(), {e,rec}=gravaVitoria(), us=S.moves||0, dica=!!S.qj?.dicas, perf=us<=m.min && !dica, [,t2,t3]=qjTetos(m), tA=tAlvo(m);
  const falta = dica ? `★★★ sem dica, em até ${t3} arrastos` : e<3 ? `${e<2?`★★ em até ${t2} · `:''}★★★ em até ${t3} arrastos` : '';
  showOverlay(`${tA?'<canvas id="espRes"></canvas>':''}<h2>${dica?'Resolvido com dica':perf?'Perfeito!':'Resolvido!'}</h2>${estrelasHtml(e,'estr grande')}
    <p>Em <b>${us}</b> arrasto${us===1?'':'s'}${rec?' (seu recorde!)':''}</p>
    <p class="perf">${dica?`com dica, vale até ★★ · melhor possível: <b>${m.min}</b> arrastos`:perf?'a menor solução possível':`melhor possível: <b>${m.min}</b> arrastos`}</p>
    ${falta?`<p class="metas">${falta}</p>`:''}
    ${n<QJ_FASES.length?'<button class="btn g" id="mProx">Próxima fase</button>':'<p>Você resolveu todos os quebra-cabeças!</p>'}
    <button class="btn dim" id="mDeNovo">Jogar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
  if(tA) espPlanetaGrande($('#espRes'),tA,'vit');
  SFX.estrelas(e);
  if($('#mProx')) $('#mProx').onclick=()=>{ missoesLista(); missaoInfo(n+1); };
  $('#mDeNovo').onclick=()=>comecaFase(n, {}, qjResultado);
  $('#mLista').onclick=()=>missoesLista();
}

// ---------- migração do progresso (versão das fases em ptui_qj_v) ----------
// Versão 2 das fases (2026-11-12: 11 mundos de 10, curva mais suave). Roda uma vez: quem venceu fases da versão 1
// continua com acesso ao ponto equivalente da lista nova (QJ_ANTIGA, em quebra_fases.js: positivo = a mesma fase, que
// leva as estrelas; negativo = a fase nova no ponto equivalente). As fases novas antes desse ponto ficam vencidas com
// 1 estrela; a fase pela metade continua só se for a mesma fase. O que havia fica copiado em ptui_qj_v1 e ptui_qj_save_v1.
function qjMigra(){
  if(localStorage.ptui_qj_v==='2') return;
  try{
    const velho=JSON.parse(localStorage.ptui_qj||'{}'), novo={}, A=QJ_ANTIGA;
    let a=1; while(a<=A.length && velho[a]?.e>0) a++;   // a primeira antiga sem estrela: por onde a pessoa seguiria
    const ate = a>A.length ? QJ_FASES.length+1 : Math.abs(A[a-1]);
    for(const [n,b] of Object.entries(velho)) if(A[n-1]>0 && b?.e>0) novo[A[n-1]]=b;
    for(let k=1;k<ate;k++) if(!novo[k]) novo[k]={e:1,t:0};
    if(localStorage.ptui_qj!=null){ localStorage.ptui_qj_v1=localStorage.ptui_qj; localStorage.ptui_qj=JSON.stringify(novo); }
    const sv=JSON.parse(localStorage.ptui_qj_save||'null');
    if(sv){ localStorage.ptui_qj_save_v1=localStorage.ptui_qj_save;
      if(A[sv.n-1]>0){ sv.n=A[sv.n-1]; localStorage.ptui_qj_save=JSON.stringify(sv); } else localStorage.removeItem('ptui_qj_save'); }
  }catch(e){}
  localStorage.ptui_qj_v='2';
}
qjMigra();
