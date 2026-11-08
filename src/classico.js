// ===================== CLÁSSICO (FASES COM MISSÃO) =====================
// Mundos e fases em missoes.js; arrastos e estrelas calibrados em missoes_calib.js (python testes/calibrar.py).
// Cada fase tem uma ou mais metas e um limite de arrastos, e acaba quando todas as metas são cumpridas.
// Estrelas pelos arrastos que sobram; pontos como no 2048 (juntar soma o valor da pedrinha nova).
// Peças do Clássico: casa marcada (S.alvos), casa de terra (S.terra), pedrinha presa (tile.presa), carrinho (S.carro).
// Guardado em mina_missoes: {n: {e: estrelas, t: pontos, pm: medalha do Passinho}}; fase em andamento em mina_cla_save.
const MISS = () => JSON.parse(localStorage.mina_missoes||'{}');
const liberada = n => n===1 || (MISS()[n-1]?.e||0) > 0;
const mundoDe = m => MUNDOS[m.g];
const faseDe = m => m.fase || (m.forma||m.mapa ? 'caverna' : mundoDe(m).fase);
const charDe = m => m.char || mundoDe(m).char || 'rola';
const objsDe = m => m.objs || [m.obj];
const metasDe = m => objsDe(m).filter(o=>!o.proibido);
const corNome = c => ['roxa','verde','mista'][c];
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
  if(o.cor!=null) return `Forme ${qtd(o.n,o.t)} ${corNome(o.cor)}${o.n>1?'s':''}`;
  if(o.pontos) return `Faça ${o.pontos} pontos`;
  if(o.quebre) return o.quebre<=1 ? `Quebre ${o.n} pedrinha${o.n>1?'s':''} com a picareta` : `Quebre ${qtd(o.n,o.quebre)} com a picareta`;
  if(o.seq) return `Forme, nessa ordem: ${listaE(o.seq.map(t=>rockName(t)))}`;
  if(o.combo) return `Faça duas junções num arrasto só, ${o.combo} ${o.combo>1?'vezes':'vez'}`;
  if(o.alvo) return (o.n||1)>1 ? `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} em cada casa marcada` : `Forme ${artigo(rockName(o.alvo))} ${rockName(o.alvo)} na casa marcada`;
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
  if(o.alvo) return {at:(S.alvos||[]).filter(a=>a.ok).length, alvo:(S.alvos||[]).length||o.n||1};
  if(o.terra) return {at:(S.terraTot||0)-(S.terra?.size||0), alvo:S.terraTot||o.terra};
  if(o.solte) return {at:S.soltas||0, alvo:S.presasTot||o.n||1};
  if(o.carrinho) return {at:S.carro?.n||0, alvo:o.n};
  return {at:0, alvo:0};
}
const metaFeita = o => { const p=progObj(o); return p.at>=p.alvo; };
const cumpriu = m => metasDe(m).every(metaFeita);
const violou = m => objsDe(m).find(o=>o.proibido && (S.maxForm||0)>=o.proibido);
const estrelasPor = (m,sobra) => 1 + (sobra>=m.estrelas[0]) + (sobra>=m.estrelas[1]);

// conta o que as metas pedem e os pontos, a cada arrasto (sem mexer na tela: o robô de calibrar usa)
function contaMissao(r){
  for(const o of r.merges){
    S.feitas[o.t]=(S.feitas[o.t]||0)+1; if(o.c!=null) S.coresF[o.t+':'+o.c]=(S.coresF[o.t+':'+o.c]||0)+1;
    if(o.k!=='p') S.pontos+=VAL(o.t);
    S.maxForm=Math.max(S.maxForm||0,o.t);
    if(S.seqAlvo && S.seqI<S.seqAlvo.length && o.t>=S.seqAlvo[S.seqI]) S.seqI++;
    const a=(S.alvos||[]).find(a=>!a.ok && a.x===o.x && a.y===o.y && o.t>=a.t); if(a) a.ok=true;
    S.terra?.delete(o.x+','+o.y);
    if(o.solta){ S.soltas=(S.soltas||0)+1; delete o.solta; }
  }
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
  const f=(x,y,v)=>{ const el=document.createElement('div'); el.className='flut'; el.textContent='+'+v; el.style.transform=pos(x,y); board.appendChild(el); setTimeout(()=>el.remove(),950); };
  for(const o of r.merges) if(o.k!=='p') f(o.x,o.y,VAL(o.t));
  for(const b of r.breaks) f(b.x,b.y,2*VAL(b.t));
}
// depois de cada arrasto: cumpriu, formou o proibido, acabaram os arrastos ou travou
function checaMissao(){
  const m=MISSOES[S.missao-1];
  const est=S, acaba=(ok,txt,motivo)=>{ S.phase='fimM'; localStorage.removeItem('mina_cla_save'); setBanner(null,txt); if(ok) SFX.pagou();
    setTimeout(()=>{ if(S===est && S.phase==='fimM') missaoResultado(ok,motivo); }, ok?800:650); };   // só se ainda estiver nessa fase
  const v=violou(m); if(v) return acaba(false,'não podia!',`Você formou ${artigo(rockName(v.proibido))} ${rockName(v.proibido)}.`);
  if(cumpriu(m)) return acaba(true,'missão cumprida!');
  if(S.energy<=0) return acaba(false,'acabaram os arrastos','Acabaram os arrastos.');
  if(!anyMove()) return acaba(false,'não cabe mais nada','Não cabia mais nada no tabuleiro.');
  salvaFase();
}

// ---------- fase em andamento: salvar e continuar ----------
const CAMPOS_SAVE = ['tiles','walls','edges','alvos','terraTot','carro','energy','moves','pontos','feitas','coresF','quebras','seqI','combos','soltas','presasTot','maxForm','next'];
function salvaFase(){
  const st={}; for(const k of CAMPOS_SAVE) st[k]=S[k]; st.terra=[...(S.terra||[])];
  localStorage.mina_cla_save=JSON.stringify({n:S.missao, pass:!!S.medalha, st});
}
const faseSalva = n => { const sv=JSON.parse(localStorage.mina_cla_save||'null'); return sv && sv.n===n ? sv : null; };
function restauraFase(st){
  for(const el of els.values()) el.remove(); els.clear(); limpaMarcas();
  for(const k of CAMPOS_SAVE) if(st[k]!==undefined) S[k]=st[k];
  S.terra=new Set(st.terra||[]);
}

// ---------- peças do Clássico no tabuleiro ----------
// sorteadas a partir das metas: casa marcada, casa de terra, pedrinha presa e carrinho
function montaPecasMissao(m){
  S.alvos=[]; S.terra=new Set(); S.carro=null; S.presasTot=0; S.terraTot=0;
  const usados=new Set(S.tiles.map(t=>t.x+','+t.y));
  const livres=f=>{ const out=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!wallAt(x,y) && !usados.has(x+','+y) && (!f||f(x,y))) out.push({x,y}); return shuffle(out); };
  const pega=f=>{ const c=livres(f)[0]; if(c) usados.add(c.x+','+c.y); return c; };
  const borda=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!inside(x+dx,y+dy) || S.walls.some(w=>w.v && w.x===x+dx && w.y===y+dy));
  for(const o of objsDe(m)){
    const fixo=(lista,i)=>{ const q=lista?.[i]; if(!q) return null; usados.add(q[0]+','+q[1]); return {x:q[0],y:q[1]}; };   // posições fixas (quebra-cabeças)
    if(o.carrinho){ const c=fixo(m.carroPos&&[m.carroPos],0)||pega(borda); if(c) S.carro={x:c.x,y:c.y,t:o.carrinho,n:0}; }
    if(o.alvo) for(let i=0;i<(o.n||1);i++){ const c=fixo(m.alvosPos,i)||pega(); if(c) S.alvos.push({x:c.x,y:c.y,t:o.alvo,ok:false}); }
    if(o.solte) for(let i=0;i<(o.n||1);i++){ const c=fixo(m.presasPos,i)||pega(); if(c){ S.tiles.push({id:'t'+(nextId++),x:c.x,y:c.y,t:o.solte,presa:1}); S.presasTot++; } }
  }
  for(const o of objsDe(m)) if(o.terra){ const ocup=new Set(usados); usados.clear(); if(S.carro) usados.add(S.carro.x+','+S.carro.y);
    for(let i=0;i<o.terra;i++){ const c=pega(); if(c) S.terra.add(c.x+','+c.y); } S.terraTot=S.terra.size; for(const k of ocup) usados.add(k); }
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
  if(o.alvo) return figSvg(`<circle cx="50" cy="52" r="40" fill="none" stroke="#f2b33d" stroke-width="7" stroke-dasharray="11 7"/><g transform="translate(28 30) scale(.45)">${pedraInner(o.alvo)}</g>`);
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
  if(o.forme||o.cor!=null||o.quebre||o.alvo||o.solte||o.carrinho) return Array.from({length:n},()=>iconeObj(o));
  return null;
}
function rotulo(o){
  if(espFig()){ const e=rotuloEsp(o); if(e) return e; }
  if(o.forme) return o.n>1?plural(rockName(o.forme)):rockName(o.forme);
  if(o.cor!=null) return `${o.n>1?plural(rockName(o.t)):rockName(o.t)} ${corNome(o.cor)}${o.n>1?'s':''}`;
  if(o.quebre) return 'quebradas'; if(o.seq) return 'nessa ordem'; if(o.alvo) return 'casas marcadas';
  if(o.solte) return 'soltas'; if(o.carrinho) return 'no carrinho'; if(o.terra) return 'terra limpa';
  if(o.combo) return 'duas de uma vez'; if(o.pontos) return 'pontos'; return '';
}
function figuraMissao(m){
  const ms=metasDe(m), rest=objsDe(m).find(o=>o.proibido);
  if(ms.length===1 && !rest){
    const o=ms[0], sil=silhuetas(o);
    const peca = (inner,nome,t=null) => `<div class="pecaN">${figSvg(inner)}<small ${t!=null?`class="nomeT" style="--c:${rd(t)}"`:''}>${noIco(nome)}</small></div>`;
    const rec = (a,b,c) => `<div class="receita">${peca(...a)}<i>+</i>${peca(...b)}<i>=</i>${peca(...c)}</div>`;
    if(o.forme || o.cor!=null){ const t=o.forme||o.t, c=o.cor, nm=x=>rockName(x)+(c!=null?' '+corNome(c):'');
      return `<div class="figM"><div class="alvo"><div class="pecaN">${figSvg(pedraCor(t,c),'fG')}<small class="nomeT" style="--c:${rd(t)}">${noIco(nm(t))}</small></div><b>×${o.n}</b></div>${rec([pedraCor(t-1,c),nm(t-1),t-1],[pedraCor(t-1,c),nm(t-1),t-1],[pedraCor(t,c),nm(t),t])}</div>`; }
    if(o.quebre){ const t=Math.max(1,o.quebre), nome=o.quebre<=1?(espFig()?'peça':'pedrinha'):rockName(t);
      return `<div class="figM"><div class="alvo"><div class="pecaN">${figSvg(pedraInner(t),'fG')}<small class="nomeT" style="--c:${rd(t)}">${noIco(nome)}</small></div><b>×${o.n}</b></div>${rec([pedraInner(t),nome,t],[pickInner(t),espFig()?'buraco negro':'picareta'],espFig()?['<circle cx="50" cy="50" r="30" fill="none" stroke="#cfc6ff" stroke-width="5" stroke-dasharray="8 7"/>','engolido']:[oreSvg(4,50,52,2.6),'minério'])}</div>`; }
    if(o.pontos) return `<div class="figM"><div class="alvo"><b>${o.pontos}</b><span>pontos</span></div>${rec([pedraInner(2),rockName(2)+' 4',2],[pedraInner(2),rockName(2)+' 4',2],[pedraInner(3),rockName(3)+' +8',3])}</div>`;
    if(sil) return `<div class="figM"><div class="silF">${sil.map(s=>s.replace('<svg','<svg class="fM"')).join(o.seq?'<i>→</i>':'')}</div></div>`;
  }
  return `<div class="metasM">${objsDe(m).map(o=>`<div>${iconeObj(o).replace('<svg','<svg class="fP"')}<span>${objetivoTxt(o)}</span></div>`).join('')}</div>`;
}
const COMO_PECA = {
  alvo:'Casa marcada: forme a pedrinha pedida em cima dela (maior também vale).',
  terra:'Casa de terra: uma junção em cima limpa a terra.',
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
  const m=MISSOES[S.missao-1], tot=m.arrastos||999, sobra=Math.max(0,S.energy), [e2,e3]=m.estrelas||[0,0];
  $('#cArr').textContent=sobra;
  const tr=$('#cTr'); tr.style.width=Math.max(0,Math.min(1,sobra/tot)*100)+'%'; tr.style.background = sobra>=e3?'#6aa84f':sobra>=e2?'#f2b33d':'#c0603f';
  for(const [id,lim] of [['#cS3',e3],['#cS2',e2],['#cS1',0]]){ const st=$(id); st.style.left=(lim?lim/tot*100:3)+'%'; st.classList.toggle('off', lim>0 && sobra<lim); }
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
  return `${fm&&m.forma?fm.nome:PATHS[fase].nome} · ${tam} · ${m.arrastos||'?'} arrastos · ${CHARS[charDe(m)].nome}${quebra}`;
}
function formaDe(m){
  if(m.forma) return acharForma(m.forma);
  if(m.mapa) return {id:'fase-'+m.nome, nome:m.nome, mapa:m.mapa, muretas:m.muretas||[], pecas:m.pecas||[]};
  return null;
}
const pegada = `<svg class="pegada" viewBox="0 0 100 100"><ellipse cx="34" cy="58" rx="13" ry="20" fill="#7a5a44"/><ellipse cx="66" cy="42" rx="13" ry="20" fill="#7a5a44"/></svg>`;
function missoesLista(){
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  show('scrMap'); trilha('menu'); document.body.classList.add('semHud');
  S = {...freshState(), missao:0, phase:'lista'}; S.fiscal=FISCAIS[0]; applyAndar(); clearBoard(); render();
  const r=MISS(), total=Object.values(r).reduce((a,x)=>a+(x.e||0),0);
  setBanner(espFig()?'Jornada':'Clássico', `${total} de ${MISSOES.length*3} estrelas`);
  $('#btnPause').textContent='‹'; $('#btnPause').title='Voltar ao menu';
  const atual = (MISSOES.findIndex((m,i)=>!(r[i+1]?.e)) + 1) || MISSOES.length;
  const lado = ['center','flex-end','center','flex-start'], E=espFig();
  let html='';
  MUNDOS.forEach((g,gi)=>{
    html += `<div class="mGrupo">${E?icoMundoEsp(gi):disc(g.ico||g.fase,null,'discSm')}<div><b>${gi+1} · ${nomeMundoCla(gi)[0]}</b><span>${nomeMundoCla(gi)[1]}</span></div></div>`;
    MISSOES.forEach((m,k)=>{ if(m.g!==gi) return; const n=k+1, lib=liberada(n), sv=faseSalva(n);
      html += `<div class="mLinha" style="justify-content:${lado[n%4]}"><button class="mNo ${lib?'':'trava'} ${n===atual?'atual':''} ${m.chefe?'chefe':''}" data-m="${n}" ${lib?'':'disabled'}>${E?icoMetaEsp(m)+'<span class="mNum">'+n+'</span>':n}${estrelasHtml(r[n]?.e||0)}${r[n]?.pm?pegada:''}${sv?'<span class="emAndamento">…</span>':''}</button></div>`; });
  });
  const mb=$('#mapBody'); mb.style.height='';
  mb.innerHTML = `<div class="mTrilha">${html}</div>`;
  const tr=mb.querySelector('.mTrilha'), base=tr.getBoundingClientRect();
  const pts=[...tr.querySelectorAll('.mNo')].map(b=>{ const q=b.getBoundingClientRect(); return `${Math.round(q.left+q.width/2-base.left)},${Math.round(q.top+q.height/2-base.top)}`; });
  tr.insertAdjacentHTML('afterbegin', `<svg class="mCaminho" width="${Math.round(base.width)}" height="${Math.round(base.height)}"><polyline points="${pts.join(' ')}"/></svg>`);
  tr.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>missaoInfo(+b.dataset.m));
  if(E) espListaPlanetas(tr);
  espCenario();
  mb.querySelector('.mNo.atual')?.scrollIntoView({block:'center'});
}
function missaoInfo(n){
  const m=MISSOES[n-1], fase=faseDe(m), fm=formaDe(m), b=MISS()[n], sv=faseSalva(n);
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
    <p class="metas">★ cumprir · ★★ sobrando ${m.estrelas[0]} arrastos · ★★★ sobrando ${m.estrelas[1]}</p>
    ${b?`<p class="recAtual">Seu melhor: ${estrelasHtml(b.e)} · ${b.t} pontos${b.pm?' · medalha do Passinho':''}</p>`:''}
    ${sv?`<button class="btn g" id="mCont">Continuar (sobram ${sv.st.energy} arrastos)</button><button class="btn dim" id="mJoga">Começar de novo</button>`:'<button class="btn g" id="mJoga">Jogar</button>'}
    ${passinho?`<button class="btn dim" id="mPass">${b.pm?'Jogar de novo no Passinho':'Jogar no Passinho (medalha)'}</button>`:''}
    <button class="btn dim" id="mVolta">Voltar</button>`);
  if(tA) espPlanetaGrande($('#espInfo'),tA,'info');
  $('#mJoga').onclick=()=>missaoJoga(n);
  if($('#mCont')) $('#mCont').onclick=()=>missaoJoga(n,{retoma:true});
  if($('#mPass')) $('#mPass').onclick=()=>missaoJoga(n,{passinho:true});
  $('#mVolta').onclick=hideOverlay;
}
function missaoJoga(n, opt={}){
  const m=MISSOES[n-1], fase=faseDe(m), fm=formaDe(m);
  hideOverlay(); VEIO_DO_EDITOR=false;
  const sv = opt.retoma ? faseSalva(n) : null;
  if(!sv) localStorage.removeItem('mina_cla_save');
  const pass = !!(opt.passinho || sv?.pass);
  S = {...freshState(), missao:n, tema:mundoDe(m).tema, char: pass?'passinho':charDe(m), medalha: pass && charDe(m)!=='passinho',
       moves:0, extra:0, pontos:0, feitas:{}, coresF:{}, quebras:[], seqI:0, combos:0, soltas:0, maxForm:0};
  S.fiscal=FISCAIS[0];
  for(const [k,v] of Object.entries(m.itens||{})) S.lv[k]=v;
  const p = {...PATHS[fase], ...(m.regras||{}), forma:fm, caverna:false, energy:(m.arrastos||999)-CFG.energy, semEnergia:false};
  if(m.w){ p.w=m.w; p.h=m.h||m.w; }
  applyAndar(); startDay(p);
  limpaMarcas(); montaPecasMissao(m);
  if(sv) restauraFase(sv.st);
  document.body.classList.add('modoCla'); $('#btnPause').textContent='☰'; $('#btnPause').title=''; montaMissaoHud(m); render();
  setBanner(`Fase ${n}: ${nomeFaseCla(n)}${S.medalha?' · Passinho':''}`, metasDe(m).length>1 ? `${metasDe(m).length} metas` : objetivosTxt(m));
  pedeEncaixe();
}
function missaoResultado(ok, motivo){
  const n=S.missao, m=MISSOES[n-1], sobra=Math.max(0,S.energy);
  if(!ok){
    SFX.naoDeu();
    const falta=metasDe(m).filter(o=>!metaFeita(o)).map(o=>{ const p=progObj(o); return `${objetivoTxt(o)}: ${Math.min(p.at,p.alvo)} de ${p.alvo}`; });
    showOverlay(`${espFig()&&tAlvo(m)?'<canvas id="espRes"></canvas>':disc(faseDe(m),null,'bigDisc')}<h2>Não deu</h2><p>${motivo}</p>${falta.map(t=>`<p>${t}.</p>`).join('')}
      <button class="btn g" id="mDeNovo">Tentar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
  } else {
    const e=estrelasPor(m,sobra), r=MISS(), ant=r[n]||{}, rec=ant.t!=null && S.pontos>ant.t;
    r[n]={...ant, e:Math.max(e,ant.e||0), t:Math.max(S.pontos,ant.t||0)}; if(S.medalha) r[n].pm=true;
    localStorage.mina_missoes=JSON.stringify(r);
    showOverlay(`${espFig()&&tAlvo(m)?'<canvas id="espRes"></canvas>':''}<h2>${S.medalha?'Medalha do Passinho!':'Missão cumprida!'}</h2>${estrelasHtml(e,'estr grande')}
      <p>Sobraram <b>${sobra}</b> arrastos · <b>${S.pontos}</b> pontos${rec?' (recorde!)':''}</p>
      ${e<3?`<p class="metas">${e<2?`★★ sobrando ${m.estrelas[0]} · `:''}★★★ sobrando ${m.estrelas[1]}</p>`:''}
      ${n<MISSOES.length?'<button class="btn g" id="mProx">Próxima fase</button>':'<p>Você terminou todas as fases!</p>'}
      <button class="btn dim" id="mDeNovo">Jogar de novo</button><button class="btn dim" id="mLista">Ver fases</button>`);
    if($('#mProx')) $('#mProx').onclick=()=>{ missoesLista(); missaoInfo(n+1); };
  }
  if($('#espRes')) espPlanetaGrande($('#espRes'),tAlvo(m),ok?'vit':'der');
  $('#mDeNovo').onclick=()=>missaoJoga(n, S.medalha?{passinho:true}:{});
  $('#mLista').onclick=missoesLista;
}

// ===================== CLÁSSICO SEM FIM =====================
// Só o tabuleiro 4x4: junta até não caber mais nada. Sem metas e sem limite de arrastos; guarda o recorde de pontos.
// (No menu do espaço o modo de missões passa a se chamar Jornada e este é o Clássico.)
const REC_INF = () => +(localStorage.ptui_rec_inf||0);
function infinitoJoga(){
  hideOverlay(); hideCoach(); VEIO_DO_EDITOR=false;
  S = {...freshState(), infinito:true, missao:0, tema:1, char:'rola', moves:0, extra:0, pontos:0, feitas:{}, coresF:{}, quebras:[], seqI:0, combos:0, soltas:0, maxForm:0};
  S.fiscal=FISCAIS[0];
  applyAndar(); startDay({...PATHS.comum, forma:null, caverna:false, energy:999-CFG.energy, semEnergia:true, w:4, h:4});
  limpaMarcas(); document.body.classList.add('modoCla','modoInf'); $('#btnPause').textContent='☰';
  montaInfinitoHud(); render();
  setBanner('Clássico', 'junte até não caber mais nada'); pedeEncaixe();
}
function montaInfinitoHud(){ $('#cMis').innerHTML=`<div><b id="cRec">${REC_INF()}</b><small>recorde</small></div>`; $('#ptsP').style.display=''; }
function hudInfinito(){ $('#cArr').textContent=S.moves||0; $('#cPts').textContent=S.pontos||0; const r=$('#cRec'); if(r) r.textContent=Math.max(REC_INF(),S.pontos||0); }
function checaInfinito(){
  if(anyMove()) return;
  S.phase='fimI'; setBanner(null,'não cabe mais nada');
  const est=S; setTimeout(()=>{ if(S===est && S.phase==='fimI') infinitoFim(); },650);
}
function infinitoFim(){
  const rec=S.pontos>REC_INF(); if(rec) localStorage.ptui_rec_inf=S.pontos;
  const t=Math.max(1,S.maxForm||1), E=espFig();
  showOverlay(`${E?'<canvas id="espRes"></canvas>':''}<h2>Fim de jogo</h2><p>Maior peça: ${rockName(t)}</p>
    <p><b>${S.pontos}</b> pontos${rec?' (recorde!)':''} · <b>${S.moves}</b> arrastos</p>
    <button class="btn g" id="iDeNovo">Jogar de novo</button><button class="btn dim" id="iMenu">Menu</button>`);
  if(E) espPlanetaGrande($('#espRes'),t,'vit');
  $('#iDeNovo').onclick=infinitoJoga; $('#iMenu').onclick=()=>{ hideOverlay(); showMenu(); };
}
