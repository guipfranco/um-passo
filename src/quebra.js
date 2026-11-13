// ===================== QUEBRA-CABEÇAS (modo em teste) =====================
// Uma jornada inteira só de quebra-cabeças: nenhuma peça nova nasce, o pedido é só a ordem certa dos arrastos.
// Mundos e fases em quebra_fases.js. O mapa, a entrada da fase, o jogo da fase e a gravação são os da Jornada
// (classico.js e espaco_jogo.js) com a jornada atual JA = QUEBRA: progresso em ptui_qj ({n: {e: estrelas, t: pontos,
// a: menor número de arrastos}}) e a fase pela metade em ptui_qj_save (com o começo da fase, S.qj).
// Na fase (desde 2026-11-13): sem desfazer; recomeçar e dica numa barra embaixo do tabuleiro, com o nome escrito; no
// teclado, R e H. Não há saída ou formou o proibido: a fase não acaba, fica parada até recomeçar.
// Estrelas (desde 2026-11-13): sem limite de arrastos (a fase nunca falha; resolver vale ★), ★★ até min+max(3, metade
// de min) e ★★★ até min+1, pelo modo livre da Jornada (m.livre, com os tetos direto em m.tetos). Sem meta de pontos.
// Música: a Órbita, a da Jornada.
// Só aparece com ?quebra no endereço (fica gravado no aparelho; ?quebra=0 esconde), no menu do espaço, abaixo do Clássico.
(()=>{ const m=location.search.match(/[?&]quebra(?:=(\d))?/); if(m) localStorage.ptui_quebra = m[1]==='0' ? '0' : '1'; })();
const quebraLigado = () => localStorage.ptui_quebra!=='0' && espacoLigado();   // oficial desde 2026-11-11: aparece para todos (?quebra=0 esconde)

// ---------- dados ----------
// completa as fases: nunca nasce peça, menor solução, limite, estrelas e a fase das cores ou do buraco negro (explicação)
QJ_FASES.forEach(m=>{
  m.regras={...(m.regras||{}), spawns:0};
  if(m.min==null) m.min=Math.max(1,(m.arrastos||10)-5);
  const t3=m.min+1, t2=m.min+Math.max(3, Math.ceil(m.min/2));
  m.livre=true; m.tetos=[t2,t3]; m.arrastos=t2; m.estrelas=[0, t2-t3];
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
  modo:'Quebra-cabeça: nenhuma peça nova nasce, o tabuleiro é só este. Ache a ordem certa dos arrastos: não tem limite, mas quanto menos, mais estrelas. Recomece quantas vezes quiser; a lâmpada dá 3 dicas por hora.',
  passinho:'Passinho: tudo anda só uma casa por arrasto, como no Threes.',
  picareta:'Buraco negro: dois iguais se juntam num maior; quando encontra um planeta do mesmo nível, engole o planeta.',
};
// arrastos para ★★ e ★★★ (★ é resolver); e a meta de perfeição (a menor solução), discreta, na entrada da fase
const qjTetos = m => [null, ...m.tetos];
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
// chamado por missaoJoga: o começo da fase (para recomeçar); continuando, o da fase salva (a pilha é do tempo do
// desfazer: fica vazia, para o salvo continuar no mesmo formato)
function qjComeca(sv){
  S.qj = sv?.qj || {ini:qjFoto(), pilha:[], trava:null, dicas:0}; S.qj.pilha=[];
  qjVer++; qjDicaLimpa(); qjDicaRotulo(); document.body.classList.add('modoQj');
  if(S.qj.trava) setTimeout(()=>{ if(S.qj?.trava) qjTravou(S.qj.trava, true); });   // parou sem saída: continua parada
}
// antes de cada arrasto (move, jogo.js): a dica em andamento desiste e a seta some
function qjGuarda(){ qjVer++; qjDicaLimpa(); }
const qjSalvo = () => ({...S.qj, pilha:[]});
const qjPode = () => !!S?.qj && S.phase==='mine' && !overlayOpen() && $('#scrGame').classList.contains('on');
// volta ao começo da fase. As peças que continuam (mesmo id) deslizam de volta para a casa de antes e só a que mudou
// de nível é redesenhada; as que tinham sumido (juntadas, recolhidas pela nave) voltam; o lixo é refeito (a vida dele)
function qjVolta(st){
  qjVer++; qjDicaLimpa();
  for(const k of CAMPOS_SAVE) if(st[k]!==undefined) S[k]=st[k];
  S.terra=new Set(st.terra||[]); S.qj.trava=null;
  const ids=new Set([...S.tiles, ...S.walls.filter(w=>!w.lixo), ...(S.edges||[])].map(o=>o.id));
  for(const [id,el] of els) if(!ids.has(id)){ el.remove(); els.delete(id); }
  render(); salvaFase(); SFX.arrastar();
}
// recomeçar: sem confirmação (a fase é curta e o botão diz o que faz)
function qjRecomeca(){
  if(!qjPode() || !(S.moves>0 || S.qj.trava)) return;
  qjVolta(JSON.parse(JSON.stringify(S.qj.ini)));
  setBanner(null, 'de volta ao começo'); voltaMeta();
}
// sem saída (acabaram os arrastos, não cabe mais nada, formou o proibido): a fase fica parada e o recomeçar chama
// (quieto: ao continuar uma fase que já tinha parado assim)
function qjTravou(txt, quieto){
  S.qj.trava=txt; setBanner(null, `${txt} · recomece`); salvaFase(); qjHud();
  if(quieto!==true) SFX.naoDeu();
}
function qjHud(){
  const r=$('#qjRecomeca'), p=$('#qjBar'); if(!r || !S?.qj) return;
  const semR=!(S.moves>0 || S.qj.trava), tr=!!S.qj.trava;
  if(r.disabled!==semR) r.disabled=semR;
  if(p.classList.contains('chama')!==tr) p.classList.toggle('chama', tr);
}
$('#qjRecomeca').onclick=qjRecomeca; $('#qjDica').onclick=qjDica;
addEventListener('keydown',e=>{ if(!S?.qj || e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea')) return;
  const k=e.key.toLowerCase(); if(k==='r'){ e.preventDefault(); qjRecomeca(); }
  else if(k==='h'){ e.preventDefault(); qjDica(); } });

// ---------- cota de dicas: 3 por hora ----------
// Janela corrida: cada dica dada guarda a hora em ptui_qj_dicas; valem as da última hora. Sem dica sobrando, o rótulo
// diz em quanto tempo volta a próxima. A dica só gasta quando mostra a seta (sem saída, "recomece" sai de graça).
const QJ_COTA={n:3, janela:3600e3};
function qjDicasUsadas(){ let a=[]; try{ a=JSON.parse(localStorage.ptui_qj_dicas||'[]'); }catch(e){}
  const t=Date.now(); return (Array.isArray(a)?a:[]).filter(x=>x>t-QJ_COTA.janela && x<=t+6e4).sort((x,y)=>x-y); }
const qjDicasTem = () => Math.max(0, QJ_COTA.n-qjDicasUsadas().length);
function qjDicaGasta(){ const a=qjDicasUsadas(); a.push(Date.now()); try{ localStorage.ptui_qj_dicas=JSON.stringify(a.slice(-QJ_COTA.n)); }catch(e){} qjDicaRotulo(); }
// minutos até a próxima voltar (com dica sobrando, 0)
function qjDicaEspera(){ const a=qjDicasUsadas(); if(a.length<QJ_COTA.n) return 0; return Math.max(1, Math.ceil((a[0]+QJ_COTA.janela-Date.now())/6e4)); }
function qjDicaRotulo(){
  const b=$('#qjDica'), s=$('#qjDicaN'); if(!b || !s) return;
  const n=qjDicasTem(), txt = n ? `${n} de ${QJ_COTA.n}` : `volta em ${qjDicaEspera()} min`;
  if(s.textContent!==txt) s.textContent=txt;
  if(b.classList.contains('zero')!==!n) b.classList.toggle('zero', !n);
}
setInterval(()=>{ if(document.body.classList.contains('modoQj')) qjDicaRotulo(); }, 20e3);
addEventListener('storage', e=>{ if(e.key==='ptui_qj_dicas') qjDicaRotulo(); });

// ---------- dica ----------
// A lâmpada procura, a partir do estado de agora, a menor solução e mostra o próximo
// arrasto: uma seta acesa sobre o tabuleiro e as peças ensaiando o movimento. A busca é em largura, com o slide() do
// jogo e as metas conferidas pelo medidor das fases (testes/calibrar/quebra_medidor.js, montado no index.html pelo
// build.py; ele confere como contaMissao, recolheCarro, violou e cumpriu). Sem solução daqui: manda recomeçar.
// Não trava o jogo: anda em pedaços de 8 ms, com "pensando…" passados 150 ms, e para em 200 mil estados ou 8 s. O que
// descobre fica guardado para a fase: a menor solução de cada estado do caminho achado e, dos estados sem saída, com
// quantos arrastos sobrando (a dica seguinte, seguindo a anterior, sai na hora).
// Custo: a partida com dica vale no máximo ★★ e sem "Perfeito!" (S.qj.dicas, salvo com a fase; recomeçar não apaga,
// começar a fase de novo apaga). 3 dicas por hora (a cota, acima). Na primeira, uma linha NOVO explica.
const QJ_DICA={pedaco:8, pensa:150, estados:200000, tempo:8000, fundo:99};   // fundo: sem limite de arrastos, até onde procurar
let QJM=null, QJ_D=null, qjPensando=null, QJ_ANIS=[];
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
  qjDicaLimpa(); qjDicaRotulo();
  if(S.qj.trava){ qjMostraRecomeca(); return; }   // já parou: não precisa procurar (de graça)
  if(!qjDicasTem()){ const m=qjDicaEspera(); qjAviso(`As dicas acabaram por agora: são ${QJ_COTA.n} por hora. A próxima volta em ${m} minuto${m===1?'':'s'}.`); SFX.naoDeu(); return; }
  const D=qjDicaFase(), ver=qjVer, t0=performance.now(), bt=$('#qjDica');
  qjPensando=setTimeout(()=>{ bt.classList.add('pensa'); setBanner(null,'pensando…'); }, QJ_DICA.pensa);
  let r=null;
  try{ r=await qjRoda(D, qjEstadoMed(S), QJ_DICA.fundo, ver); }
  finally { clearTimeout(qjPensando); qjPensando=null; bt.classList.remove('pensa'); }
  D.ultima={ms:Math.round(performance.now()-t0), estados:r.estados||0};   // para medir (testes/quebra.html)
  if(r.cancelou || qjVer!==ver || !qjPode()){   // a partida mudou enquanto pensava: a dica desiste (e o letreiro volta)
    if(S?.qj && S.phase==='mine' && $('#bSub').textContent==='pensando…') setBanner(null, S.qj.trava ? `${S.qj.trava} · recomece` : metaLetreiro(faseM()));
    return; }
  if(r.estourou){ setBanner(null,'a dica não achou a tempo · tente recomeçar'); return; }
  if(r.d==null){ qjMostraRecomeca(); return; }   // sem saída daqui: de graça, não gasta dica nem estrela
  S.qj.dicas=(S.qj.dicas||0)+1; salvaFase(); qjDicaGasta();
  qjMostraSeta(r.di, r.d);
  if(!localStorage.ptui_qj_dica){ localStorage.ptui_qj_dica='1'; qjAviso(`<i>NOVO</i>A lâmpada mostra o próximo arrasto da menor solução. São ${QJ_COTA.n} dicas por hora, e com dica a fase vale até ★★.`, 'novo'); }
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
  for(const a of QJ_ANIS) a.cancel(); QJ_ANIS=[];
  document.querySelectorAll('.qjSeta,.qjAvisos').forEach(e=>e.remove());
  const b=$('#qjRecomeca'); if(b.classList.contains('chama')) b.classList.remove('chama');
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

// ---------- migração do progresso (versão das fases em ptui_qj_v: '2' e depois '3') ----------
// Versão 2 das fases (2026-11-12: 11 mundos de 10, curva mais suave). Roda uma vez: quem venceu fases da versão 1
// continua com acesso ao ponto equivalente da lista nova (QJ_ANTIGA, em quebra_fases.js: positivo = a mesma fase, que
// leva as estrelas; negativo = a fase nova no ponto equivalente). As fases novas antes desse ponto ficam vencidas com
// 1 estrela; a fase pela metade continua só se for a mesma fase. O que havia fica copiado em ptui_qj_v1 e ptui_qj_save_v1.
function qjMigra(){
  if(localStorage.ptui_qj_v!=='2' && localStorage.ptui_qj_v!=='3') try{
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
  // versão 3 (2026-11-12): fases trocadas no lugar (QJ_TROCADAS: uma peça maior em vez de duas menores). As estrelas
  // ficam, pelo número; o "seu melhor" (a: menos arrastos) delas sai, porque era de outra fase (e podia ficar abaixo do
  // min novo); a fase pela metade numa delas recomeça (o tabuleiro ou a meta mudou), com cópia em ptui_qj_save_v2
  if(localStorage.ptui_qj_v!=='3') try{
    const r=JSON.parse(localStorage.ptui_qj||'{}'); let mudou=false;
    for(const n of QJ_TROCADAS) if(r[n]?.a!=null){ delete r[n].a; mudou=true; }
    if(mudou) localStorage.ptui_qj=JSON.stringify(r);
    const sv=JSON.parse(localStorage.ptui_qj_save||'null');
    if(sv && QJ_TROCADAS.includes(sv.n)){ localStorage.ptui_qj_save_v2=localStorage.ptui_qj_save; localStorage.removeItem('ptui_qj_save'); } }catch(e){}
  localStorage.ptui_qj_v='3';
}
qjMigra();
