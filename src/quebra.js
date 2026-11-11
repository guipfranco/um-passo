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
const quebraLigado = () => localStorage.ptui_quebra==='1' && espacoLigado();

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
const qjPerfeito = (m,b) => `<div class="perf">melhor possível: <b>${m.min}</b> arrastos${b?.a!=null?` · seu melhor: ${b.a}`:''}</div>`;
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
// chamado por missaoJoga: o começo da fase (para recomeçar) e a pilha do desfazer; continuando, os da fase salva
function qjComeca(sv){
  S.qj = sv?.qj || {ini:qjFoto(), pilha:[], trava:null};
  document.body.classList.add('modoQj');
  if(S.qj.trava) setTimeout(()=>{ if(S.qj?.trava) qjTravou(S.qj.trava, true); });   // parou sem saída: continua parada
}
// antes de cada arrasto (move, jogo.js): o estado de agora vai para a pilha. Na memória, até 400 (cada recomeçar também
// empilha); no salvo, as 60 últimas, para gravar a cada arrasto continuar barato
function qjGuarda(){ S.qj.pilha.push(qjFoto()); if(S.qj.pilha.length>400) S.qj.pilha.shift(); }
const qjSalvo = () => ({...S.qj, pilha:S.qj.pilha.slice(-60)});
const qjPode = () => !!S?.qj && S.phase==='mine' && !overlayOpen() && $('#scrGame').classList.contains('on');
// volta a um estado guardado. As peças que continuam (mesmo id) deslizam de volta para a casa de antes e só a que mudou
// de nível é redesenhada; as que tinham sumido (juntadas, recolhidas pela nave) voltam; o lixo é refeito (a vida dele)
function qjVolta(st){
  for(const k of CAMPOS_SAVE) if(st[k]!==undefined) S[k]=st[k];
  S.terra=new Set(st.terra||[]); S.qj.trava=null;
  const ids=new Set([...S.tiles, ...S.walls.filter(w=>!w.lixo), ...(S.edges||[])].map(o=>o.id));
  for(const [id,el] of els) if(!ids.has(id)){ el.remove(); els.delete(id); }
  render(); salvaFase(); SFX.arrastar();
}
function qjDesfaz(){
  if(!qjPode() || !S.qj.pilha.length) return;
  qjVolta(S.qj.pilha.pop()); setBanner(null, metaLetreiro(faseM()));
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
$('#qjDesfaz').onclick=qjDesfaz; $('#qjRecomeca').onclick=qjRecomeca;
addEventListener('keydown',e=>{ if(!S?.qj || e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea')) return;
  const k=e.key.toLowerCase(); if(k==='z'||k==='backspace'){ e.preventDefault(); qjDesfaz(); } else if(k==='r'){ e.preventDefault(); qjRecomeca(); } });

// ---------- vitória ----------
// (não cumprir não chega aqui: qjTravou). Os arrastos usados, as estrelas e, discreto, o melhor possível
function qjResultado(){
  const n=S.missao, m=faseM(), {e,rec}=gravaVitoria(), us=S.moves||0, perf=us<=m.min, [,t2,t3]=qjTetos(m), tA=tAlvo(m);
  const falta = e<3 ? `${e<2?`★★ em até ${t2} · `:''}★★★ em até ${t3} arrastos` : '';
  showOverlay(`${tA?'<canvas id="espRes"></canvas>':''}<h2>${perf?'Perfeito!':'Resolvido!'}</h2>${estrelasHtml(e,'estr grande')}
    <p>Em <b>${us}</b> arrasto${us===1?'':'s'}${rec?' (seu recorde!)':''}</p>
    <p class="perf">${perf?'a menor solução possível':`melhor possível: <b>${m.min}</b> arrastos`}</p>
    ${falta?`<p class="metas">${falta}</p>`:''}
    ${n<QJ_FASES.length?'<button class="btn g" id="mProx">Próxima fase</button>':'<p>Você resolveu todos os quebra-cabeças!</p>'}
    <button class="btn dim" id="mDeNovo">Jogar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
  if(tA) espPlanetaGrande($('#espRes'),tA,'vit');
  SFX.estrelas(e);
  if($('#mProx')) $('#mProx').onclick=()=>{ missoesLista(); missaoInfo(n+1); };
  $('#mDeNovo').onclick=()=>comecaFase(n, {}, qjResultado);
  $('#mLista').onclick=()=>missoesLista();
}
