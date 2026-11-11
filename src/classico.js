// ===================== CLÁSSICO (FASES COM MISSÃO) =====================
// Mundos e fases em missoes.js; arrastos e estrelas calibrados em missoes_calib.js (python testes/calibrar.py).
// Cada fase tem uma ou mais metas e um limite de arrastos, e acaba quando todas as metas são cumpridas.
// Estrelas pelos arrastos que sobram; pontos como no 2048 (juntar soma o valor da pedrinha nova).
// Peças do Clássico: casa marcada (S.alvos), casa de terra (S.terra), pedrinha presa (tile.presa), carrinho (S.carro).
// Guardado em mina_missoes: {n: {e: estrelas, t: pontos, pm: medalha do Passinho}}; fase em andamento em mina_cla_save.
// O Clássico sem fim guarda a partida em andamento à parte, em ptui_inf_save (ver infinitoJoga).
// Jornada 1 -> 2 (2026-11-08): mundos todos novos; o progresso antigo só fica guardado à parte (_v1)
if(localStorage.ptui_jornada!=='2' && localStorage.ptui_jornada!=='3'){
  for(const k of ['mina_missoes','mina_cla_save','ptui_partidas']) if(localStorage[k]!=null){ localStorage[k+'_v1']=localStorage[k]; localStorage.removeItem(k); }
  localStorage.ptui_jornada='2';
}
// Jornada 2 -> 3 (2026-11-10): 10 mundos de 8 fases em vez de 12. Roda uma vez (ptui_jornada vira '3'); o que havia
// fica copiado em mina_missoes_v2 e ptui_partidas_v2.
// J3_ANTIGA[n-1] = a fase da versão 2 que corresponde à fase n de hoje. Negativa quando a fase mudou de meta ou de
// tabuleiro: as estrelas vão para a fase nova, mas a fase pela metade e as partidas anotadas não.
const J3_ANTIGA = [
     1, -10,   5,  -6,   9,  -7,  11, -12,     -13,  20,  17, -19,  22, -18,  23,  24,
    25, -26,  29,  30,  31,  33,  35,  36,      37, -38,  41,  42,  44,  46,  47,  48,
    49, -50,  53, -55,  56,  54,  59,  60,      61, -62,  65,  67,  66,  68,  71,  72,
   -73, -74,  77,  80,  78,  79,  83,  84,      85, -86,  89,  90,  92,  91,  95,  96,
    97, -99, 101, 102, 105, 106, 107, 108,    -109,-110, 113, 114, 115, 117, 119, 120];
function migraJornada3(){
  const velho=JSON.parse(localStorage.mina_missoes||'{}'), novo={}, nova=o=>J3_ANTIGA.findIndex(v=>Math.abs(v)===o)+1;
  // onde a pessoa estava: a primeira fase antiga sem estrela. Ela continua na fase nova equivalente a essa (ou à
  // próxima antiga que continuou); as fases novas antes desse ponto ficam vencidas, com as estrelas da fase antiga
  // equivalente ou com 1 estrela. Estrelas de fases antigas vencidas vão para a fase nova equivalente, onde ela estiver.
  let a=1; while(a<=120 && velho[a]?.e>0) a++;
  let ate=J3_ANTIGA.length+1; for(let o=a; o<=120; o++){ const n=nova(o); if(n){ ate=n; break; } }
  J3_ANTIGA.forEach((v,i)=>{ const n=i+1, b=velho[Math.abs(v)];
    if(b?.e>0) novo[n]={...b}; else if(n<ate) novo[n]={e:1, t:0}; });
  if(localStorage.mina_missoes!=null) localStorage.mina_missoes_v2=localStorage.mina_missoes;
  localStorage.mina_missoes=JSON.stringify(novo);
  // fase pela metade: segue só se a fase continuou igual (com o número novo)
  const sv=JSON.parse(localStorage.mina_cla_save||'null');
  if(sv){ const n=J3_ANTIGA.indexOf(sv.n)+1; if(n){ sv.n=n; localStorage.mina_cla_save=JSON.stringify(sv); } else localStorage.removeItem('mina_cla_save'); }
  // partidas anotadas (Laboratório > Dados das partidas): renumeradas; as das fases que mudaram ou saíram ficam só na cópia
  if(localStorage.ptui_partidas){ localStorage.ptui_partidas_v2=localStorage.ptui_partidas;
    localStorage.ptui_partidas=JSON.stringify(JSON.parse(localStorage.ptui_partidas).map(p=>{ const n=J3_ANTIGA.indexOf(p[0])+1; return n ? [n,...p.slice(1)] : null; }).filter(Boolean)); }
}
if(localStorage.ptui_jornada==='2'){ try{ migraJornada3(); }catch(e){} localStorage.ptui_jornada='3'; }
// ---------- jornada atual ----------
// O mapa de mundos, a entrada da fase, o jogo da fase e o resultado servem à Jornada e ao modo Quebra-cabeças
// (quebra.js, em teste): cada um com os seus mundos, fases e chaves de armazenamento. JA é a jornada aberta (a do mapa
// ou da fase em jogo); quem entra pelo menu diz qual (missoesLista(JORNADA) ou missoesLista(QUEBRA)).
const JORNADA = {id:'jornada', nome:'Jornada', mundos:MUNDOS, fases:MISSOES, chave:'mina_missoes', salvo:'mina_cla_save'};
let JA = JORNADA;
const MISS = (j=JA) => JSON.parse(localStorage[j.chave]||'{}');
const faseM = () => JA.fases[S.missao-1];   // a fase em jogo
const liberada = n => n===1 || (MISS()[n-1]?.e||0) > 0;
const mundoDe = m => JA.mundos[m.g];
const faseDe = m => m.fase || (m.forma||m.mapa ? 'caverna' : mundoDe(m).fase);
const charDe = m => m.char || mundoDe(m).char || 'rola';
const objsDe = m => m.objs || [m.obj];
const metasDe = m => objsDe(m).filter(o=>!o.proibido);
// nome da cor concordando com a peça (Asteroide roxo, Rocha roxa)
const corNome = (c,t) => { const fem = t==null || artigo(rockName(t))==='uma'; return [fem?'roxa':'roxo','verde',fem?'mista':'misto'][c]; };
const artigo = nome => { const w=nome.split(' ')[0]; if(/^(Cometa|Planeta)$/.test(w)) return 'um'; if(/is$/.test(w)) return 'uns'; return /a$/.test(w) ? 'uma' : 'um'; };
// só as palavras antes de "de" vão para o plural (Rochas de gelo); ão vira ões
const plural = nome => { let para=false; return nome.split(' ').map(w=>{ if(para) return w; if(w==='de'){ para=true; return w; } return /ão$/.test(w)?w.slice(0,-2)+'ões':/[aeiouáéíóú]$/i.test(w)?w+'s':/r$/.test(w)?w+'es':/l$/.test(w)?w.slice(0,-1)+'is':w; }).join(' '); };
const qtd = (n,t) => n===1 ? `${artigo(rockName(t))} ${rockName(t)}` : `${n} ${plural(rockName(t))}`;
const estrelasHtml = (e, cls='estr') => `<span class="${cls}">${[1,2,3].map(i=>`<i class="${i<=e?'on':''}">★</i>`).join('')}</span>`;
const VAL = t => t>0 ? 2**t : 0;   // Cascalho 2, Pedra 4, Rocha 8, Rocha densa 16... (Rubi real = 2048)
const figSvg = (inner,cls='') => `<svg class="${cls}" viewBox="0 0 100 100">${inner}</svg>`;
const pedraCor = (t,c) => pedraInner(t, c!=null ? {cor:c} : {});
const listaE = a => a.length<2 ? a.join('') : a.slice(0,-1).join(', ')+' e '+a[a.length-1];

// ---------- metas ----------
function objetivoTxt(o){
  if(espFig()){ const e=objetivoEsp(o); if(e) return e; }
  if(o.forme) return `Forme ${qtd(o.n,o.forme)}`;
  if(o.cor!=null) return `Forme ${qtd(o.n,o.t)} ${corNome(o.cor,o.t)}${o.n>1?'s':''}`;
  if(o.pontos) return `Faça ${o.pontos} pontos`;
  if(o.quebre) return o.quebre<=1 ? `Quebre ${o.n} pedrinha${o.n>1?'s':''} com a picareta` : `Quebre ${qtd(o.n,o.quebre)} com a picareta`;
  if(o.seq) return `Forme, nessa ordem: ${listaE(o.seq.map(t=>rockName(t)))}`;
  if(o.combo) return `Faça duas junções num arrasto só, ${o.combo} ${o.combo>1?'vezes':'vez'}`;
  if(o.leve) return (o.n||1)>1 ? `Leve ${artigo(rockName(o.leve))} ${rockName(o.leve)} até cada casa marcada` : `Leve ${artigo(rockName(o.leve))} ${rockName(o.leve)} até a casa marcada`;
  if(o.alvo) return (o.n||1)>1 ? `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} em cada casa marcada` : `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} na casa marcada`;
  if(o.rache) return o.rache>1 ? `Rache ${o.rache} lixos espaciais` : 'Rache o lixo espacial';
  if(o.terra) return `Limpe a terra das ${o.terra} casas`;
  if(o.solte) return (o.n||1)>1 ? `Solte as ${o.n} ${plural(rockName(o.solte))} presas` : `Solte ${artigo(rockName(o.solte))==='uma'?'a':'o'} ${rockName(o.solte)} pres${artigo(rockName(o.solte))==='uma'?'a':'o'}`;
  if(o.carrinho) return `Coloque ${qtd(o.n,o.carrinho)} no carrinho`;
  if(o.proibido) return `sem formar ${artigo(rockName(o.proibido))} ${rockName(o.proibido)}`;
  return '';
}
const objetivosTxt = m => { const ms=metasDe(m).map(objetivoTxt), r=objsDe(m).find(o=>o.proibido); return listaE(ms)+(r?', '+objetivoTxt(r):''); };
// quanto de cada meta já foi feito
function progObj(o){
  if(o.forme) return {at:S.feitas?.[o.forme]||0, alvo:o.n};
  if(o.cor!=null) return {at:S.coresF?.[o.t+':'+o.cor]||0, alvo:o.n};
  if(o.pontos) return {at:S.pontos||0, alvo:o.pontos};
  if(o.quebre) return {at:(S.quebras||[]).filter(t=>t>=o.quebre).length, alvo:o.n};
  if(o.seq) return {at:S.seqI||0, alvo:o.seq.length};
  if(o.combo) return {at:S.combos||0, alvo:o.combo};
  if(o.alvo) return {at:(S.alvos||[]).filter(a=>a.ok&&!a.leve).length, alvo:(S.alvos||[]).filter(a=>!a.leve).length||o.n||1};
  if(o.leve) return {at:(S.alvos||[]).filter(a=>a.ok&&a.leve).length, alvo:(S.alvos||[]).filter(a=>a.leve).length||o.n||1};
  if(o.rache) return {at:S.rachados||0, alvo:o.rache};
  if(o.terra) return {at:(S.terraTot||0)-(S.terra?.size||0), alvo:S.terraTot||o.terra};
  if(o.solte) return {at:S.soltas||0, alvo:S.presasTot||o.n||1};
  if(o.carrinho) return {at:S.carro?.n||0, alvo:o.n};
  return {at:0, alvo:0};
}
const metaFeita = o => { const p=progObj(o); return p.at>=p.alvo; };
const cumpriu = m => metasDe(m).every(metaFeita);
const violou = m => objsDe(m).find(o=>o.proibido && (S.maxForm||0)>=o.proibido);
// fase livre (sem limite de arrastos): as estrelas vêm dos arrastos usados; tetoEst = máximo de arrastos para ★★ e para ★★★
// O ★★★ fica entre 75% e 88% do ★★: nem quase igual a ele, nem apertado demais (a calibragem sozinha dava os dois extremos).
const tetoEst = m => { const t2=m.arrastos-m.estrelas[0], t3=m.arrastos-m.estrelas[1];
  return [t2, Math.min(Math.round(t2*.88), Math.max(Math.round(t2*.75), t3))]; };
const estrelasPor = (m,sobra,usados) => m.livre ? 1 + (usados<=tetoEst(m)[0]) + (usados<=tetoEst(m)[1]) : 1 + (sobra>=m.estrelas[0]) + (sobra>=m.estrelas[1]);
const arrastosTxt = m => m.livre ? 'sem limite de arrastos' : `${m.arrastos||'?'} arrastos`;
const metasEstTxt = (m,e=1) => m.livre ? `${e<2?`★★ em até ${tetoEst(m)[0]} arrastos · `:''}★★★ em até ${tetoEst(m)[1]}`
                                     : `${e<2?`★★ sobrando ${m.estrelas[0]} arrastos · `:''}★★★ sobrando ${m.estrelas[1]}`;

// conta o que as metas pedem e os pontos, a cada arrasto (sem mexer na tela: o robô de calibrar usa)
// lixo espacial: bloco fixo; cada junção numa casa vizinha tira 1 de vida; sem vida, ele some e a casa fica livre
function rachaLixo(r){
  if(!S.walls.some(w=>w.hp)) return;
  let bateu=0; for(const o of r.merges) for(const w of S.walls) if(w.hp>0 && Math.abs(w.x-o.x)+Math.abs(w.y-o.y)===1){ w.hp--; bateu++; }
  if(bateu) SFX.racha();
  const foram=S.walls.filter(w=>w.lixo && w.hp<=0); if(!foram.length) return;
  S.walls=S.walls.filter(w=>!(w.lixo && w.hp<=0)); S.rachados=(S.rachados||0)+foram.length;
  for(const w of foram){ const el=els.get(w.id); if(el){ els.delete(w.id); el.classList.add('some'); setTimeout(()=>el.remove(),300); } }
}
function contaMissao(r){
  rachaLixo(r); const neb=S.terra?.size||0;
  for(const o of r.merges){
    S.feitas[o.t]=(S.feitas[o.t]||0)+1; if(o.c!=null) S.coresF[o.t+':'+o.c]=(S.coresF[o.t+':'+o.c]||0)+1;
    if(o.k!=='p') S.pontos+=VAL(o.t);
    S.maxForm=Math.max(S.maxForm||0,o.t);
    if(S.seqAlvo && S.seqI<S.seqAlvo.length && o.t>=S.seqAlvo[S.seqI]) S.seqI++;
    const a=(S.alvos||[]).find(a=>!a.ok && !a.leve && a.x===o.x && a.y===o.y && o.t>=a.t); if(a) a.ok=true;
    S.terra?.delete(o.x+','+o.y);
    if(o.solta){ S.soltas=(S.soltas||0)+1; delete o.solta; }
  }
  if((S.terra?.size||0)<neb) SFX.nebulosa();
  // casa de levar: vale só se exatamente a peça pedida CHEGAR andando. Junção em cima da casa não conta, nem quando a
  // peça formada ali fica parada nos arrastos seguintes (a.ocup lembra quem já estava na casa)
  { const juntou=new Set(r.merges.map(o=>o.id));
    for(const a of S.alvos||[]) if(a.leve && !a.ok){ const q=S.tiles.find(t=>t.x===a.x && t.y===a.y && t.k!=='p');
      if(q && q.t===a.t && !juntou.has(q.id) && q.id!==a.ocup) a.ok=true; a.ocup = q ? q.id : null; } }
  espDescobre(r);
  if(r.merges.length>=2) S.combos=(S.combos||0)+1;
  for(const b of r.breaks){ S.quebras.push(b.t); S.pontos+=2*VAL(b.t); }
}
// carrinho: pedrinha do tamanho pedido (ou maior) parada nele é recolhida
function recolheCarro(){
  const c=S.carro; if(!c) return null;
  const t=S.tiles.find(t=>t.x===c.x && t.y===c.y && t.t>=c.t && t.k!=='p' && !t.presa);
  if(!t) return null;
  S.tiles=S.tiles.filter(x=>x!==t); c.n++; return t;
}
function flutuaPontos(r){
  if(S.frenesi) return freFlutua(r);   // Frenesi: com o multiplicador (frenesi.js)
  if(S.qj) return;   // Quebra-cabeças: sem pontos na tela, o pedido é só a ordem dos arrastos
  const f=(x,y,v)=>{ const el=document.createElement('div'); el.className='flut'; el.textContent='+'+v; el.style.transform=pos(x,y); board.appendChild(el); setTimeout(()=>el.remove(),950); };
  for(const o of r.merges) if(o.k!=='p') f(o.x,o.y,VAL(o.t));
  for(const b of r.breaks) f(b.x,b.y,2*VAL(b.t));
}
// meta no letreiro da fase (a mesma da entrada)
const metaLetreiro = m => metasDe(m).length>1 ? `${metasDe(m).length} metas` : objetivosTxt(m);
// a comemoração de peça grande ("Asteroide!") toma o letreiro; 1,5 s depois da última a meta volta,
// só se a fase ainda estiver em jogo (no fim, "missão cumprida!" e afins ficam)
let voltaMetaT=0;
function voltaMeta(){ clearTimeout(voltaMetaT); const est=S;
  voltaMetaT=setTimeout(()=>{ if(S===est && S.missao && S.phase==='mine' && !S.qj?.trava) setBanner(null, metaLetreiro(faseM())); }, 1500); }
// depois de cada arrasto: cumpriu, formou o proibido, acabaram os arrastos ou travou
// (nos Quebra-cabeças não cumprir não acaba a fase: ela fica parada até desfazer ou recomeçar, qjTravou em quebra.js)
function checaMissao(){
  const m=faseM();
  const est=S, acaba=(ok,txt,motivo)=>{ if(!ok && JA.quebra) return qjTravou(txt,motivo);
    S.phase='fimM'; localStorage.removeItem(JA.salvo); if(!JA.quebra) anotaPartida(ok, motivo); if(ok) gravaVitoria(); setBanner(null,txt); if(ok) SFX.pagou();
    setTimeout(()=>{ if(S===est && S.phase==='fimM') missaoResultado(ok,motivo); }, ok?800:650); };   // só se ainda estiver nessa fase
  const v=violou(m); if(v) return acaba(false,'não podia!',`Você formou ${artigo(rockName(v.proibido))} ${rockName(v.proibido)}.`);
  if(cumpriu(m)) return acaba(true, JA.quebra?'resolvido!':'missão cumprida!');
  if(S.energy<=0) return acaba(false,'acabaram os arrastos','Acabaram os arrastos.');
  if(!anyMove()) return acaba(false,'não cabe mais nada','Não cabia mais nada no tabuleiro.');
  salvaFase();
}
// estrelas, pontos e medalha gravados no instante da vitória: sair pela pausa antes da tela de resultado não perde a fase.
// Uma vez por partida (S.res); a tela de resultado só mostra, e o "recorde" compara com o que havia antes desta vitória.
function gravaVitoria(){
  if(S.res) return S.res;
  const n=S.missao, m=faseM(), e=estrelasPor(m,Math.max(0,S.energy),S.moves||0), r=MISS(), ant=r[n]||{};
  S.res={e, rec: ant.t!=null && S.pontos>ant.t};
  r[n]={...ant, e:Math.max(e,ant.e||0), t:Math.max(S.pontos,ant.t||0)}; if(S.medalha) r[n].pm=true;
  if(JA.quebra){ S.res.rec = ant.a!=null && S.moves<ant.a; r[n].a=Math.min(S.moves, ant.a??Infinity); }   // quebra-cabeça: o recorde é o menor número de arrastos
  localStorage[JA.chave]=JSON.stringify(r);
  return S.res;
}

// ---------- partidas anotadas no próprio aparelho (nada sai dele): Laboratório > Dados das partidas ----------
// cada fim de fase: [fase, venceu (1/0), arrastos usados, arrastos que sobraram, Passinho (1/0), dia]; guarda as 1500 últimas
const PARTIDAS = () => JSON.parse(localStorage.ptui_partidas||'[]');
function anotaPartida(ok, motivo){
  try{ const a=PARTIDAS(); a.push([S.missao, ok?1:0, S.moves||0, Math.max(0,S.energy||0), S.medalha?1:0, new Date().toISOString().slice(0,10)]);
    localStorage.ptui_partidas=JSON.stringify(a.slice(-1500)); }catch(e){}
}
function dadosPartidas(volta){
  const a=PARTIDAS(), por={};
  for(const [n,ok,us] of a){ const p=por[n]||(por[n]={t:0,v:0,us:[]}); p.t++; if(ok){ p.v++; p.us.push(us); } }
  const med=v=>{ if(!v.length) return '-'; const s=[...v].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const linhas=Object.keys(por).map(Number).sort((x,y)=>x-y).map(n=>{ const p=por[n]; return `Fase ${n}: ${p.v} de ${p.t} vencidas, mediana ${med(p.us)} arrastos (limite ${MISSOES[n-1]?.arrastos??'?'})`; });
  const texto='2048 Astros, partidas da Jornada\n'+(linhas.join('\n')||'nenhuma partida ainda')+'\n\nbruto: '+JSON.stringify(a);
  showOverlay(`<h2>Dados das partidas</h2><p>Ficam só neste aparelho. Copie e mande por mensagem.</p>
    <textarea id="dpTxt" readonly style="width:100%;height:180px;font-size:12px"></textarea>
    <button class="btn b" id="dpCopia">Copiar</button><button class="btn dim" id="dpVolta">Voltar</button>`);
  $('#dpTxt').value=texto;
  $('#dpCopia').onclick=()=>{ const ok=()=>{ $('#dpCopia').textContent='Copiado!'; };
    if(navigator.clipboard) navigator.clipboard.writeText(texto).then(ok,()=>{ $('#dpTxt').select(); document.execCommand('copy'); ok(); });
    else { $('#dpTxt').select(); document.execCommand('copy'); ok(); } };
  $('#dpVolta').onclick=volta;
}

// ---------- fase em andamento: salvar e continuar ----------
const CAMPOS_SAVE = ['tiles','walls','edges','alvos','terraTot','carro','energy','moves','pontos','feitas','coresF','quebras','seqI','combos','soltas','presasTot','maxForm','next','rachados'];
const estadoFase = () => { const st={}; for(const k of CAMPOS_SAVE) st[k]=S[k]; st.terra=[...(S.terra||[])]; return st; };
// nos Quebra-cabeças vão junto o começo da fase e a pilha do desfazer (S.qj, quebra.js)
function salvaFase(){ localStorage[JA.salvo]=JSON.stringify({n:S.missao, pass:!!S.medalha, st:estadoFase(), ...(S.qj?{qj:qjSalvo()}:{})}); }
const faseSalva = n => { const sv=JSON.parse(localStorage[JA.salvo]||'null'); return sv && sv.n===n ? sv : null; };
function restauraFase(st){
  for(const el of els.values()) el.remove(); els.clear(); limpaMarcas();
  for(const k of CAMPOS_SAVE) if(st[k]!==undefined) S[k]=st[k];
  S.terra=new Set(st.terra||[]);
  // depois de reabrir o app o contador de peças volta a 1: segue depois das peças salvas, senão as novas repetem o id delas
  for(const t of S.tiles){ const k=+String(t.id).slice(1); if(k>=nextId) nextId=k+1; }
}

// ---------- peças do Clássico no tabuleiro ----------
// sorteadas a partir das metas: casa marcada, casa de terra, pedrinha presa e carrinho
function montaPecasMissao(m){
  S.alvos=[]; S.terra=new Set(); S.carro=null; S.presasTot=0; S.terraTot=0;
  const usados=new Set(S.tiles.map(t=>t.x+','+t.y));
  const livres=f=>{ const out=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!wallAt(x,y) && !usados.has(x+','+y) && (!f||f(x,y))) out.push({x,y}); return shuffle(out); };
  const pega=f=>{ const c=livres(f)[0]; if(c) usados.add(c.x+','+c.y); return c; };
  const borda=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!inside(x+dx,y+dy) || S.walls.some(w=>w.v && w.x===x+dx && w.y===y+dy));
  // peça sorteada que nasceu na casa fixa do planeta preso vai para outra casa livre (senão ficam duas na mesma casa)
  const tiraDaCasa=c=>{ const q=S.tiles.find(t=>t.x===c.x && t.y===c.y); if(!q) return; const l=livres()[0]; els.get(q.id)?.remove(); els.delete(q.id);
    if(l){ usados.add(l.x+','+l.y); q.x=l.x; q.y=l.y; } else S.tiles=S.tiles.filter(t=>t!==q); };
  for(const o of objsDe(m)){
    const fixo=(lista,i)=>{ const q=lista?.[i]; if(!q) return null; usados.add(q[0]+','+q[1]); return {x:q[0],y:q[1]}; };   // posições fixas (quebra-cabeças)
    if(o.carrinho){ const c=fixo(m.carroPos&&[m.carroPos],0)||pega(borda); if(c) S.carro={x:c.x,y:c.y,t:o.carrinho,n:0}; }
    if(o.alvo) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||m.alvosPos,i)||pega(); if(c) S.alvos.push({x:c.x,y:c.y,t:o.alvo,ok:false}); }
    if(o.leve) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||m.alvosPos,i)||pega(); if(c) S.alvos.push({x:c.x,y:c.y,t:o.leve,ok:false,leve:true}); }
    if(o.solte) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||m.presasPos,i)||pega(); if(c){ tiraDaCasa(c); S.tiles.push({id:'t'+(nextId++),x:c.x,y:c.y,t:o.solte,presa:1}); S.presasTot++; } }
  }
  for(const o of objsDe(m)) if(o.terra){ const ocup=new Set(usados); usados.clear(); if(S.carro) usados.add(S.carro.x+','+S.carro.y);
    for(let i=0;i<o.terra;i++){ const q=(o.pos||m.terraPos)?.[i], c=q?{x:q[0],y:q[1]}:pega(); if(c) S.terra.add(c.x+','+c.y); } S.terraTot=S.terra.size; for(const k of ocup) usados.add(k); }
  const sq=objsDe(m).find(o=>o.seq); S.seqAlvo=sq?sq.seq:null;
}
const svgAlvo = t => `<svg viewBox="0 0 100 100"><circle class="anel" cx="50" cy="52" r="41" fill="none" stroke-width="5" stroke-dasharray="11 7"/><g class="fantasma" transform="translate(30 31) scale(.42)">${pedraInner(t)}</g></svg>`;
function svgTerra(x,y){ if(espFig()) return figSvg(nebInner()); const r=cnRng(3001+x*71+y*313);
  return `<svg viewBox="0 0 100 100"><path d="${cnBolha(50,53,40,35,r,.2,9)}" fill="#8a6440"/><path d="${cnBolha(46,49,26,20,r,.25,8)}" fill="#9c7350"/>${[0,1,2,3].map(()=>`<circle cx="${cnF(24+r()*52)}" cy="${cnF(30+r()*40)}" r="${cnF(2+r()*2.5)}" fill="#6b4a2c"/>`).join('')}</svg>`; }
const svgCarro = t => espFig() ? figSvg(naveInner(t)) : `<svg viewBox="0 0 100 100"><rect x="9" y="17" width="82" height="68" rx="13" fill="#6d4a30" stroke="#8d969d" stroke-width="6"/><rect x="19" y="27" width="62" height="48" rx="8" fill="#3b2a1e"/><g class="fantasma" transform="translate(31 31) scale(.38)">${pedraInner(t)}</g></svg>`;
const svgCorrente = `<svg viewBox="0 0 100 100"><path d="M10 80 q40 24 80 0" stroke="#5f5258" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M10 80 q40 24 80 0" stroke="#a3969b" stroke-width="3" fill="none" stroke-dasharray="7 6"/><path d="M14 72 l-7 12 M86 72 l7 12 M32 88 l-3 10 M68 88 l3 10" stroke="#5f5258" stroke-width="6" stroke-linecap="round"/></svg>`;
const marcas = new Map();
function marcaEl(k, cls, x, y, html){
  let el=marcas.get(k);
  if(!el){ el=document.createElement('div'); el.className='marcaM '+cls; el.style.transform=pos(x,y); el.innerHTML=html; board.insertBefore(el, board.querySelector('.tile')); marcas.set(k,el); }
  return el;
}
function desenhaMarcas(){
  if(!S?.missao){ limpaMarcas(); return; }
  const vivos=new Set();
  const E=noEspaco(), esp=(m,tipo,a)=>{ if(E && !m._esp){ m._esp=1; espMarca(m,tipo,a); } return m; };
  for(const a of S.alvos||[]){ const k='a'+a.x+','+a.y; vivos.add(k); esp(marcaEl(k,'alvoM',a.x,a.y,E?'':svgAlvo(a.t)),'alvo',a).classList.toggle('ok',a.ok); }
  for(const c of S.terra||[]){ const k='t'+c; vivos.add(k); const [x,y]=c.split(',').map(Number); esp(marcaEl(k,'terraM',x,y,E?'':svgTerra(x,y)),'terra',{x,y}); }
  if(S.carro){ vivos.add('c'); esp(marcaEl('c','carroM',S.carro.x,S.carro.y,E?'':svgCarro(S.carro.t)),'carro',S.carro); }
  for(const [k,el] of marcas) if(!vivos.has(k)){ marcas.delete(k); if(k[0]==='t'){ el.classList.add('some'); setTimeout(()=>el.remove(),450); } else el.remove(); }
}
function limpaMarcas(){ for(const el of marcas.values()) el.remove(); marcas.clear(); }
function presaMarca(el,t){
  if(noEspaco()){ el.querySelector('.corrente')?.remove(); return; }   // no espaço a gaiola de luz é desenhada junto do planeta
  const tem=!!el.querySelector('.corrente');
  if(t.presa && !tem){ const c=document.createElement('div'); c.className='corrente'; c.innerHTML=svgCorrente; el.appendChild(c); }
  else if(!t.presa && tem){ const c=el.querySelector('.corrente'); c.classList.add('solta'); setTimeout(()=>c.remove(),400); }
}

// ---------- desenhos e textos das metas ----------
function iconeObj(o){
  if(o.forme) return figSvg(pedraInner(o.forme));
  if(o.cor!=null) return figSvg(pedraCor(o.t,o.cor));
  if(o.quebre) return figSvg(pedraInner(Math.max(1,o.quebre)));
  if(o.seq) return figSvg(pedraInner(o.seq[Math.min(S?.seqI||0,o.seq.length-1)]));
  if(o.leve) return iconeObj({alvo:o.leve});
  if(o.alvo) return figSvg(`<circle cx="50" cy="52" r="40" fill="none" stroke="#f2b33d" stroke-width="7" stroke-dasharray="11 7"/><g transform="translate(28 30) scale(.45)">${pedraInner(o.alvo)}</g>`);
  if(o.rache) return figSvg(espFig() ? lixoInner() : torraoInner());
  if(o.terra) return svgTerra(0,0).replace('<svg','<svg class=""');
  if(o.solte) return figSvg(pedraInner(o.solte)+(espFig()?gaiolaInner():svgCorrente.replace(/<\/?svg[^>]*>/g,'')));
  if(o.carrinho) return svgCarro(o.carrinho);
  if(o.combo) return figSvg(`<text x="50" y="66" text-anchor="middle" font-size="44" font-weight="700" fill="#c48a1e" font-family="Fredoka">2×</text>`);
  if(o.pontos) return figSvg(`<text x="50" y="64" text-anchor="middle" font-size="36" font-weight="700" fill="#c48a1e" font-family="Fredoka">pts</text>`);
  if(o.proibido) return figSvg(pedraInner(o.proibido)+`<circle cx="50" cy="50" r="42" fill="none" stroke="#c0603f" stroke-width="8"/><path d="M22 22 L78 78" stroke="#c0603f" stroke-width="8"/>`);
  return '';
}
// silhuetas no painel: uma por peça que falta (só quando é uma meta e são até 4)
function silhuetas(o){
  const p=progObj(o), n=p.alvo;
  if(n>4 || n<1) return null;
  if(o.seq) return o.seq.map(t=>figSvg(pedraInner(t)));
  if(o.forme||o.cor!=null||o.quebre||o.alvo||o.leve||o.solte||o.carrinho||o.rache) return Array.from({length:n},()=>iconeObj(o));
  return null;
}
function rotulo(o){
  if(espFig()){ const e=rotuloEsp(o); if(e) return e; }
  if(o.forme) return o.n>1?plural(rockName(o.forme)):rockName(o.forme);
  if(o.cor!=null) return `${o.n>1?plural(rockName(o.t)):rockName(o.t)} ${corNome(o.cor,o.t)}${o.n>1?'s':''}`;
  if(o.quebre) return 'quebradas'; if(o.seq) return 'nessa ordem'; if(o.alvo) return 'casas marcadas'; if(o.leve) return 'na casa marcada';
  if(o.solte){ const v=artigo(rockName(o.solte))==='uma'?'solta':'solto'; return (o.n||1)>1 ? v+'s' : v; }   // concorda com a peça: Rocha solta, Asteroides soltos
  if(o.carrinho) return 'no carrinho'; if(o.terra) return 'terra limpa'; if(o.rache) return 'lixo rachado';
  if(o.combo) return 'duas de uma vez'; if(o.pontos) return 'pontos'; return '';
}
function figuraMissao(m){
  const ms=metasDe(m), rest=objsDe(m).find(o=>o.proibido);
  if(ms.length===1 && !rest){
    const o=ms[0], sil=silhuetas(o);
    const peca = (inner,nome,t=null) => `<div class="pecaN">${figSvg(inner)}<small ${t!=null?`class="nomeT" style="--c:${rd(t)}"`:''}>${noIco(nome)}</small></div>`;
    const rec = (a,b,c) => `<div class="receita">${peca(...a)}<i>+</i>${peca(...b)}<i>=</i>${peca(...c)}</div>`;
    if(o.forme || o.cor!=null){ const t=o.forme||o.t, c=o.cor, nm=x=>rockName(x)+(c!=null?' '+corNome(c,x):'');
      return `<div class="figM"><div class="alvo"><div class="pecaN">${figSvg(pedraCor(t,c),'fG')}<small class="nomeT" style="--c:${rd(t)}">${noIco(nm(t))}</small></div><b>×${o.n}</b></div>${rec([pedraCor(t-1,c),nm(t-1),t-1],[pedraCor(t-1,c),nm(t-1),t-1],[pedraCor(t,c),nm(t),t])}</div>`; }
    if(o.quebre){ const t=Math.max(1,o.quebre), nome=o.quebre<=1?(espFig()?'peça':'pedrinha'):rockName(t);
      return `<div class="figM"><div class="alvo"><div class="pecaN">${figSvg(pedraInner(t),'fG')}<small class="nomeT" style="--c:${rd(t)}">${noIco(nome)}</small></div><b>×${o.n}</b></div>${rec([pedraInner(t),nome,t],[pickInner(t),espFig()?'buraco negro':'picareta'],espFig()?['<circle cx="50" cy="50" r="30" fill="none" stroke="#cfc6ff" stroke-width="5" stroke-dasharray="8 7"/>','engolido']:[oreSvg(4,50,52,2.6),'minério'])}</div>`; }
    if(o.pontos) return `<div class="figM"><div class="alvo"><b>${o.pontos}</b><span>pontos</span></div>${rec([pedraInner(2),rockName(2)+' 4',2],[pedraInner(2),rockName(2)+' 4',2],[pedraInner(3),rockName(3)+' +8',3])}</div>`;
    if(sil) return `<div class="figM"><div class="silF">${sil.map(s=>s.replace('<svg','<svg class="fM"')).join(o.seq?'<i>→</i>':'')}</div></div>`;
  }
  return `<div class="metasM">${objsDe(m).map(o=>`<div>${iconeObj(o).replace('<svg','<svg class="fP"')}<span>${objetivoTxt(o)}</span></div>`).join('')}</div>`;
}
const COMO_PECA = {
  alvo:'Casa marcada: forme a pedrinha pedida em cima dela, juntando ali (maior também vale).',
  leve:'Casa marcada: leve até ela exatamente a pedrinha pedida e pare em cima. Juntar em cima da casa não vale.',
  terra:'Casa de terra: uma junção em cima limpa a terra.',
  rache:'Torrão fixo: some quando acontece uma junção numa casa ao lado.',
  solte:'Pedrinha presa: não sai do lugar, mas aceita junção. Junte uma igual nela para soltar.',
  carrinho:'Carrinho: pedrinha do tamanho pedido, ou maior, que parar nele é recolhida.',
  combo:'Duas junções no mesmo arrasto contam uma vez.',
  seq:'Em ordem: cada pedrinha só conta depois da anterior.',
  proibido:'Se formar a pedrinha proibida, a fase acaba.',
};

// ---------- painel de cima ----------
function montaMissaoHud(m){
  const ms=metasDe(m), rest=objsDe(m).find(o=>o.proibido), sil=ms.length===1 && !rest ? silhuetas(ms[0]) : null;
  $('#cMis').innerHTML = sil ? `<div class="fila">${sil.map(s=>`<span>${s}</span>`).join('')}</div><small>${noIco(rotulo(ms[0]))}</small>`
    : `<div class="chipsM">${ms.map((o,i)=>`<span class="chipM" data-i="${i}">${iconeObj(o)}<b></b></span>`).join('')}${rest?`<span class="chipM proib">${iconeObj(rest)}</span>`:''}</div>`;
  $('#ptsP').style.display = ms.some(o=>o.pontos) || ms.length>1 || rest ? 'none' : '';
}
function hudMissao(){
  if(JA.quebra) qjHud();
  const m=faseM(), tot=m.arrastos||999, sobra=Math.max(0,S.energy), [e2,e3]=m.estrelas||[0,0];
  const rot=$('#cArr').nextElementSibling;
  if(m.livre){ const [t2,t3]=tetoEst(m), us=S.moves||0, tr=$('#cTr');
    $('#cArr').textContent=us; if(rot) rot.textContent='arrastos · sem limite';
    tr.style.width=Math.max(0,Math.min(1,(t2-us)/t2)*100)+'%'; tr.style.background = us<=t3?'#6aa84f':us<=t2?'#f2b33d':'#c0603f';
    const s3=$('#cS3'), s2=$('#cS2'), s1=$('#cS1'); s3.style.left=((t2-t3)/t2*100)+'%'; s3.classList.toggle('off', us>t3);
    s2.style.left='3%'; s2.classList.toggle('off', us>t2); s1.style.display='none';
  } else { if(rot) rot.textContent='arrastos'; $('#cS1').style.display='';
  $('#cArr').textContent=sobra;
  const tr=$('#cTr'); tr.style.width=Math.max(0,Math.min(1,sobra/tot)*100)+'%'; tr.style.background = sobra>=e3?'#6aa84f':sobra>=e2?'#f2b33d':'#c0603f';
  for(const [id,lim] of [['#cS3',e3],['#cS2',e2],['#cS1',0]]){ const st=$(id); st.style.left=(lim?lim/tot*100:3)+'%'; st.classList.toggle('off', lim>0 && sobra<lim); }
  }
  $('#cPts').textContent=S.pontos||0;
  const ms=metasDe(m), fila=$('#cMis .fila');
  if(fila){ const p=progObj(ms[0]); fila.querySelectorAll('span').forEach((e,i)=>e.classList.toggle('ok', i<p.at)); }
  else ms.forEach((o,i)=>{ const el=$(`#cMis .chipM[data-i="${i}"]`); if(!el) return; const p=progObj(o);
    el.querySelector('b').textContent = o.pontos ? `${Math.min(p.at,p.alvo)}/${p.alvo}` : `${Math.min(p.at,p.alvo)}/${p.alvo}`; el.classList.toggle('ok', p.at>=p.alvo); });
}

// ---------- telas ----------
function regrasTxt(m){
  const fase=faseDe(m), fm=formaDe(m), n=PATHS[fase].n;
  const tam = fm ? `${fw(fm)}x${fh(fm)}` : `${m.w||n||4}x${m.h||m.w||n||4}`;
  const quebra = (m.regras?.spawns===0) ? ' · não nasce pedrinha' : '';
  return `${fm&&m.forma?fm.nome:PATHS[fase].nome} · ${tam} · ${arrastosTxt(m)} · ${CHARS[charDe(m)].nome}${quebra}`;
}
function formaDe(m){
  if(m.forma) return acharForma(m.forma);
  if(m.mapa) return {id:'fase-'+m.nome, nome:m.nome, mapa:m.mapa, muretas:m.muretas||[], pecas:m.pecas||[]};
  return null;
}
const pegada = `<svg class="pegada" viewBox="0 0 100 100"><ellipse cx="34" cy="58" rx="13" ry="20" fill="#7a5a44"/><ellipse cx="66" cy="42" rx="13" ry="20" fill="#7a5a44"/></svg>`;
// j: a jornada a abrir (vindo do menu); sem ela, a que já estava aberta (voltar da fase, "Ver fases")
function missoesLista(j){
  if(j?.fases) JA=j;
  const FS=JA.fases;
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  show('scrMap'); trilha('menu'); document.body.classList.add('semHud');
  S = {...freshState(), missao:0, phase:'lista'}; S.fiscal=FISCAIS[0]; applyAndar(); clearBoard(); render();
  const r=MISS(), total=Object.values(r).reduce((a,x)=>a+(x.e||0),0);
  setBanner(espFig()?JA.nome:'Clássico', `${total} de ${FS.length*3} estrelas`);
  $('#btnPause').textContent='‹ Menu'; $('#btnPause').title='Voltar ao menu'; document.body.classList.add('naLista');
  const atual = (FS.findIndex((m,i)=>!(r[i+1]?.e)) + 1) || FS.length;
  const lado = ['center','flex-end','center','flex-start'], E=espFig();
  // no espaço o mapa mostra só até algumas fases depois da atual: dali para a frente ainda é segredo (e não se rola sem fim)
  const ATE = E ? Math.min(FS.length, atual+3) : FS.length;
  let html='';
  JA.mundos.forEach((g,gi)=>{
    const pri=FS.findIndex(m=>m.g===gi)+1; if(g.breve ? ATE<FS.length : pri>ATE) return;
    html += `<div class="mGrupo ${g.breve?'breve':''}">${E?icoMundoEsp(gi):disc(g.ico||g.fase,null,'discSm')}<div><b>${gi+1} · ${nomeMundoCla(gi)[0]}</b><span>${nomeMundoCla(gi)[1]}</span></div></div>`;
    if(g.breve){ html += `<div class="mBreve">Em construção</div>`; return; }
    FS.forEach((m,k)=>{ if(m.g!==gi || k+1>ATE) return; const n=k+1, lib=liberada(n), sv=faseSalva(n);
      html += `<div class="mLinha" style="justify-content:${lado[n%4]}"><button class="mNo ${lib?'':'trava'} ${n===atual?'atual':''} ${m.chefe?'chefe':''}" data-m="${n}" ${lib?'':'disabled'}>${E?icoMetaEsp(m)+'<span class="mNum">'+n+'</span>':n}${estrelasHtml(r[n]?.e||0)}${r[n]?.pm?pegada:''}${sv?'<span class="emAndamento">…</span>':''}</button></div>`; });
  });
  const mb=$('#mapBody'); mb.style.height='';
  mb.innerHTML = `<div class="mTrilha">${html}</div>${ATE<FS.length?'<div class="mFim"></div>':''}`;
  const tr=mb.querySelector('.mTrilha'), base=tr.getBoundingClientRect();
  const pts=[...tr.querySelectorAll('.mNo')].map(b=>{ const q=b.getBoundingClientRect(); return `${Math.round(q.left+q.width/2-base.left)},${Math.round(q.top+q.height/2-base.top)}`; });
  tr.insertAdjacentHTML('afterbegin', `<svg class="mCaminho" width="${Math.round(base.width)}" height="${Math.round(base.height)}"><polyline points="${pts.join(' ')}"/></svg>`);
  tr.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>missaoInfo(+b.dataset.m));
  if(E) espListaPlanetas(tr);
  espCenario();
  mb.querySelector('.mNo.atual')?.scrollIntoView({block:'center'});
}
function missaoInfo(n){
  if(espFig()) return entradaEsp(n);   // no espaço, a entrada nova (espaco_jogo.js)
  const m=JA.fases[n-1], fase=faseDe(m), fm=formaDe(m), b=MISS()[n], sv=faseSalva(n);
  const explica=[];
  if(fase!=='comum' && fase!=='caverna' || n===1) explica.push(PATHS[fase].como||PATHS[fase].desc);
  if(charDe(m)==='passinho') explica.push(COMO_CHAR.passinho);
  for(const o of objsDe(m)) for(const k of Object.keys(COMO_PECA)) if(o[k]!==undefined && !explica.includes(COMO_PECA[k])) explica.push(COMO_PECA[k]);
  if(m.regras?.spawns===0) explica.push('Quebra-cabeça: não nasce pedrinha nova. Pense antes de arrastar.');
  const passinho = b?.e && charDe(m)!=='passinho', E=espFig(), tA=E&&tAlvo(m);
  showOverlay(`${tA?'<canvas id="espInfo"></canvas>':fm?formaSvg(fm,110):disc(fase,null,'bigDisc')}<h2>Fase ${n}</h2><p class="andarNome">${nomeFaseCla(n)}${m.chefe?' · fim do mundo':''}</p>
    <div class="objetivo"><small>${objsDe(m).length>1?'metas':'missão'}</small>${figuraMissao(m)}${objsDe(m).length>1?'':objetivosTxt(m)}</div>
    <p class="ajuda">${E?regrasEsp(m):regrasTxt(m)}</p>
    ${(E?explicaEsp(m):explica).map(t=>`<p class="ajuda">${t}</p>`).join('')}
    ${fase==='picareta'&&!E?regraPicareta():''}
    ${m.livre?'<p class="ajuda">Sem limite de arrastos: a fase só acaba se o tabuleiro encher. Quanto menos arrastos, mais estrelas.</p>':''}
    <p class="metas">★ cumprir · ${metasEstTxt(m)}</p>
    ${b?`<p class="recAtual">Seu melhor: ${estrelasHtml(b.e)} · ${b.t} pontos${b.pm?' · medalha do Passinho':''}</p>`:''}
    ${sv?`<button class="btn g" id="mCont">Continuar (${m.livre?`${sv.st.moves||0} arrastos usados`:`sobram ${sv.st.energy} arrastos`})</button><button class="btn dim" id="mJoga">Começar de novo</button>`:'<button class="btn g" id="mJoga">Jogar</button>'}
    ${passinho?`<button class="btn dim" id="mPass">${b.pm?'Jogar de novo no Passinho':'Jogar no Passinho (medalha)'}</button>`:''}
    <button class="btn dim" id="mVolta">Voltar</button>`);
  if(tA) espPlanetaGrande($('#espInfo'),tA,'info');
  $('#mJoga').onclick=()=>comecaFase(n);
  if($('#mCont')) $('#mCont').onclick=()=>missaoJoga(n,{retoma:true});
  if($('#mPass')) $('#mPass').onclick=()=>comecaFase(n,{passinho:true});
  $('#mVolta').onclick=hideOverlay; FORA=hideOverlay;
}
// só há um lugar para fase pela metade: começar outra fase apaga a que estava salva, então pergunta antes.
// Começar de novo a própria fase salva não pergunta (o botão já diz isso). Voltar reabre a tela de onde veio.
function comecaFase(n, opt={}, volta=()=>missaoInfo(n)){
  const sv=JSON.parse(localStorage[JA.salvo]||'null');
  if(!sv || sv.n===n || !JA.fases[sv.n-1]) return missaoJoga(n,opt);
  showOverlay(`<h2>Começar a fase ${n}?</h2><p>A fase ${sv.n}, ${noIco(nomeFaseCla(sv.n))}, está pela metade e será perdida.</p>
    <button class="btn g" id="fSim">Começar</button><button class="btn dim" id="fNao">Voltar</button>`);
  $('#fSim').onclick=()=>missaoJoga(n,opt); $('#fNao').onclick=volta; FORA=volta;
}
function missaoJoga(n, opt={}){
  const m=JA.fases[n-1], fase=faseDe(m), fm=formaDe(m);
  hideOverlay(); VEIO_DO_EDITOR=false;
  const sv = opt.retoma ? faseSalva(n) : null;
  if(!sv) localStorage.removeItem(JA.salvo);
  const pass = !!(opt.passinho || sv?.pass);
  S = {...freshState(), missao:n, tema:mundoDe(m).tema, char: pass?'passinho':charDe(m), medalha: pass && charDe(m)!=='passinho',
       moves:0, extra:0, pontos:0, feitas:{}, coresF:{}, quebras:[], seqI:0, combos:0, soltas:0, maxForm:0, rachados:0};
  S.fiscal=FISCAIS[0];
  for(const [k,v] of Object.entries(m.itens||{})) S.lv[k]=v;
  const p = {...PATHS[fase], ...(m.regras||{}), forma:fm, caverna:false, energy:(m.arrastos||999)-CFG.energy, semEnergia:!!m.livre};
  if(m.w){ p.w=m.w; p.h=m.h||m.w; }
  if(JA.quebra) p.spawns=0;   // quebra-cabeça: nunca nasce peça nova
  applyAndar(); startDay(p);
  limpaMarcas(); montaPecasMissao(m);
  if(sv) restauraFase(sv.st);
  if(JA.quebra) qjComeca(sv);   // começo da fase e pilha do desfazer (quebra.js)
  document.body.classList.add('modoCla'); $('#btnPause').textContent='☰'; $('#btnPause').title=''; montaMissaoHud(m); render();
  // o nome da fase vai sem o ícone de peça (no título, "Primeira rocha" é nome, não a meta)
  setBanner(`Fase ${n}: ${noIco(nomeFaseCla(n))}${S.medalha?' · Passinho':''}`, metaLetreiro(m));
  pedeEncaixe();
}
function missaoResultado(ok, motivo){
  if(JA.quebra) return qjResultado();   // quebra-cabeça: só a vitória chega aqui (quebra.js)
  const n=S.missao, m=faseM(), sobra=Math.max(0,S.energy);
  if(!ok){
    SFX.naoDeu();
    const falta=metasDe(m).filter(o=>!metaFeita(o)).map(o=>{ const p=progObj(o); return `${objetivoTxt(o)}: ${Math.min(p.at,p.alvo)} de ${p.alvo}`; });
    showOverlay(`${espFig()&&tAlvo(m)?'<canvas id="espRes"></canvas>':disc(faseDe(m),null,'bigDisc')}<h2>Não deu</h2><p>${motivo}</p>${falta.map(t=>`<p>${t}.</p>`).join('')}
      <button class="btn g" id="mDeNovo">Tentar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
  } else {
    const {e,rec}=gravaVitoria();   // já gravado quando a fase foi cumprida
    showOverlay(`${espFig()&&tAlvo(m)?'<canvas id="espRes"></canvas>':''}<h2>${S.medalha?'Medalha do Passinho!':'Missão cumprida!'}</h2>${estrelasHtml(e,'estr grande')}
      <p>${m.livre?`Em <b>${S.moves||0}</b> arrasto${S.moves===1?'':'s'}`:sobra===1?'Sobrou <b>1</b> arrasto':`Sobraram <b>${sobra}</b> arrastos`} · <b>${S.pontos}</b> pontos${rec?' (recorde!)':''}</p>
      ${e<3?`<p class="metas">${metasEstTxt(m,e)}</p>`:''}
      ${n<JA.fases.length?'<button class="btn g" id="mProx">Próxima fase</button>':'<p>Você terminou todas as fases!</p>'}
      <button class="btn dim" id="mDeNovo">Jogar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
    if($('#mProx')) $('#mProx').onclick=()=>{ missoesLista(); missaoInfo(n+1); };
    SFX.estrelas(e);
  }
  if($('#espRes')) espPlanetaGrande($('#espRes'),tAlvo(m),ok?'vit':'der');
  $('#mDeNovo').onclick=()=>comecaFase(n, S.medalha?{passinho:true}:{}, ()=>missaoResultado(ok,motivo));
  $('#mLista').onclick=missoesLista;
}

// ===================== CLÁSSICO SEM FIM =====================
// Só o tabuleiro 4x4: junta até não caber mais nada. Sem metas e sem limite de arrastos; guarda o recorde de pontos.
// (No menu do espaço o modo de missões passa a se chamar Jornada e este é o Clássico.)
const REC_INF = () => +(localStorage.ptui_rec_inf||0);
// partida em andamento, gravada a cada arrasto (fechar o app não a perde); chave própria, a mina_cla_save é da Jornada
const infSalvo = () => JSON.parse(localStorage.ptui_inf_save||'null');
// {retoma:true}: continua a partida salva, se houver (botão do menu); sem isso começa uma nova e apaga a salva
function infinitoJoga(opt){
  const sv = opt?.retoma ? infSalvo() : null;
  if(!sv) localStorage.removeItem('ptui_inf_save');
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  // recAntes vem do salvo: o "recorde!" do fim compara com o recorde de antes desta partida, não de antes de continuar
  S = {...freshState(), infinito:true, missao:0, tema:1, char:'rola', moves:0, extra:0, pontos:0, feitas:{}, coresF:{}, quebras:[], seqI:0, combos:0, soltas:0, maxForm:0, rachados:0, recAntes:sv?sv.recAntes:REC_INF()};
  S.fiscal=FISCAIS[0];
  applyAndar(); startDay({...PATHS.comum, forma:null, caverna:false, energy:999-CFG.energy, semEnergia:true, w:4, h:4});
  limpaMarcas(); if(sv) restauraFase(sv.st);
  document.body.classList.add('modoCla','modoInf'); $('#btnPause').textContent='☰';
  montaInfinitoHud(); render();
  setBanner('Clássico', 'junte até não caber mais nada'); pedeEncaixe();
}
function montaInfinitoHud(){ $('#cMis').innerHTML=`<div><b id="cRec">${REC_INF()}</b><small>recorde</small></div>`; $('#ptsP').style.display=''; }
function hudInfinito(){ if(S.frenesi) return hudFrenesi(); $('#cArr').textContent=S.moves||0; $('#cPts').textContent=S.pontos||0; const r=$('#cRec'); if(r) r.textContent=Math.max(REC_INF(),S.pontos||0); }
function checaInfinito(){
  if(S.frenesi) return checaFrenesi();   // o Frenesi guarda à parte (frenesi.js)
  // o recorde fica guardado na hora: sair, recomeçar ou fechar o jogo no meio da partida não o perde
  if((S.pontos||0)>REC_INF()) localStorage.ptui_rec_inf=S.pontos;
  if(anyMove()){ localStorage.ptui_inf_save=JSON.stringify({recAntes:S.recAntes, st:estadoFase()}); return; }
  localStorage.removeItem('ptui_inf_save');   // fim de jogo: não há o que continuar
  S.phase='fimI'; setBanner(null,'não cabe mais nada');
  const est=S; setTimeout(()=>{ if(S===est && S.phase==='fimI') infinitoFim(); },650);
}
// Recomeçar pela pausa com pontos na partida: pergunta antes de perder a partida
function recomecaInfinito(){
  const joga = S.frenesi ? frenesiJoga : infinitoJoga;
  if(!(S.pontos>0)) return joga();
  const volta=()=>{ hideOverlay(); pauseMenu(); };
  showOverlay(`<h2>Recomeçar?</h2><p>A partida atual será perdida.</p>
    <button class="btn g" id="rSim">Recomeçar</button><button class="btn dim" id="rNao">Voltar</button>`);
  $('#rSim').onclick=()=>joga(); $('#rNao').onclick=volta; FORA=volta;
}
function infinitoFim(){
  const rec=S.pontos>S.recAntes; if(S.pontos>REC_INF()) localStorage.ptui_rec_inf=S.pontos;
  if(rec) SFX.pagou(); else SFX.naoDeu();
  const t=Math.max(1,S.maxForm||1), E=espFig();
  showOverlay(`${E?'<canvas id="espRes"></canvas>':''}<h2>Fim de jogo</h2><p>Maior peça: ${rockName(t)}</p>
    <p><b>${S.pontos}</b> pontos${rec?' (recorde!)':''} · <b>${S.moves}</b> arrastos</p>
    ${rec?'':`<p>Recorde: <b>${REC_INF()}</b> pontos</p>`}
    <button class="btn g" id="iDeNovo">Jogar de novo</button><button class="btn dim" id="iMenu">Menu</button>`);
  if(E) espPlanetaGrande($('#espRes'),t,'vit');
  $('#iDeNovo').onclick=()=>infinitoJoga(); $('#iMenu').onclick=()=>{ hideOverlay(); showMenu(); };
}
