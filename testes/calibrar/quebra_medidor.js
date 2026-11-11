// Medidor (e sorteio) dos quebra-cabeças sem peça nascendo: a Jornada de quebra-cabeças (src/quebra_fases.js).
// Serve no navegador (quebra_gera.html e testes/quebra_fases.html, com o slide() do index.html) e no Node
// (quebra_gera.mjs, com o slide() lido de src/jogo.js). Quem chama dá o ambiente:
//   env.slide(tiles,dx,dy)               o slide() do jogo
//   env.ajusta(w,h,walls,edges,char)     põe W, H, S.walls, S.edges e S.char do jogo antes de cada slide
// As metas são conferidas como o jogo confere depois de cada arrasto (contaMissao, recolheCarro, violou e cumpriu em
// src/classico.js; montaPecasMissao para montar as peças da fase). Mudou a regra lá, mude aqui.
//
// Medidas de cada fase (analisa):
//   min     menor solução (em arrastos)
//   sols    quantas sequências de arrastos cumprem a fase com min arrastos
//   prim    quantos primeiros arrastos começam uma solução mínima (de 1 a 4)
//   arm1..3 armadilha: das sequências de 1, 2 e 3 arrastos, a fração depois da qual não dá mais para cumprir dentro do
//           limite (arrastos = min + folga). arm é a média das três.
//   fora1   fração dos primeiros arrastos que já perdem a solução mínima (as três estrelas)
//   contra  fração das soluções mínimas que têm um arrasto contraintuitivo (fora o último): juntar menos do que dava
//           (recusa) ou afastar duas iguais que juntariam, sem juntar nenhuma delas (separa). exige = todas têm.
//   guloso  fração das partidas de um jogador guloso que cumprem dentro do limite. Ele cumpre a fase se um arrasto
//           cumpre; senão escolhe o arrasto que mais avança as metas, depois o que mais junta, depois o maior
//           planeta formado; empate sorteado; não forma o planeta proibido se puder evitar.
//   acaso   fração das partidas ao acaso que cumprem dentro do limite
//   estados quantos estados a busca visitou
//   juncao  meta de uma peça (formar ou levar à nave): dos estados em que o par do nível de baixo acabou de se formar,
//           a fração em que a meta não sai no arrasto seguinte (falta ajeitar o par, ou ele se formou num lugar sem
//           saída). 0: onde quer que o par se forme, ele junta logo (a junção final vem de graça)
// E o que pesa na fase (pesos e falhas, mais abaixo): proibido alcançável, cada meta, cada mecânica e cada peça mudam
// o quebra-cabeça; quanto custa levar; se girar o tabuleiro resolve; a menor solução no Passinho.
(function(raiz){
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]], NOMES=['D','E','B','C'];   // direita, esquerda, baixo, cima

function QuebraMedidor(env){
  // ---------- a fase montada como no jogo (startDay + montaPecasMissao) ----------
  function contexto(f){
    const mapa=f.mapa, h=mapa.length, w=mapa[0].length, base=[], lx=[];
    mapa.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch==='#') base.push({x,y,v:true}); else if(ch==='B') base.push({x,y});
      else if(ch==='L'||ch==='2'||ch==='3') lx.push({x,y,hp:ch==='L'?1:+ch}); }));
    const edges=(f.muretas||[]).map(([d,x,y])=>({d,x,y}));
    const objs=f.objs||[f.obj], metas=objs.filter(o=>!o.proibido), proib=objs.find(o=>o.proibido)?.proibido||0;
    const ocup=(x,y)=>base.some(q=>q.x===x&&q.y===y)||lx.some(q=>q.x===x&&q.y===y);
    const ts=[]; let id=0, problemas=[];
    for(const [x,y,t,c,k] of f.pecas||[]){ if(ts.some(q=>q.x===x&&q.y===y)||ocup(x,y)){ problemas.push(`peça em ${x},${y} cai fora (casa ocupada)`); continue; }
      const q={id:'p'+(id++),x,y,t}; if(c!=null) q.c=c; if(k) q.k=k; ts.push(q); }
    const al=[]; let ca=null, presasTot=0, nPresa=0; const tr=[];
    for(const o of objs){
      const fixo=(lista,i)=>lista?.[i] ? {x:lista[i][0], y:lista[i][1]} : null;
      if(o.carrinho){ const c=fixo(f.carroPos&&[f.carroPos],0); if(!c) problemas.push('nave sem carroPos'); else ca={x:c.x,y:c.y,t:o.carrinho,n:0}; }
      if(o.alvo) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||f.alvosPos,i); if(!c) problemas.push('órbita sem posição'); else al.push({x:c.x,y:c.y,t:o.alvo,ok:false}); }
      if(o.leve) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||f.alvosPos,i); if(!c) problemas.push('órbita sem posição'); else al.push({x:c.x,y:c.y,t:o.leve,ok:false,leve:true}); }
      if(o.solte) for(let i=0;i<(o.n||1);i++){ const c=fixo(o.pos||f.presasPos,i); if(!c){ problemas.push('preso sem posição'); continue; }
        if(ts.some(q=>q.x===c.x&&q.y===c.y)) problemas.push(`peça na casa do preso ${c.x},${c.y} (o jogo a muda de lugar ao acaso)`);
        ts.push({id:'r'+(nPresa++),x:c.x,y:c.y,t:o.solte,presa:1}); presasTot++; }
    }
    for(const o of objs) if(o.terra) for(let i=0;i<o.terra;i++){ const q=(o.pos||f.terraPos)?.[i]; if(!q){ problemas.push('nebulosa sem posição'); continue; } const k=q[0]+','+q[1]; if(!tr.includes(k)) tr.push(k); }
    for(const a of al) if(a.leve && ts.some(q=>q.x===a.x&&q.y===a.y)) problemas.push(`peça começando na órbita de levar ${a.x},${a.y}`);
    for(const m of metas) if(!(m.forme||m.cor!=null||m.combo||m.alvo||m.leve||m.rache||m.terra||m.solte||m.carrinho||m.quebre)) problemas.push('meta que o medidor não conhece: '+JSON.stringify(m));
    const ctx={w,h,base,edges,char:f.char||'rola',metas,proib,terraTot:tr.length,presasTot,problemas,lx0:lx.length};
    const ini={ts, lx, tr, al, ca, f:{feitas:{},cores:{},combos:0,soltas:0,rach:0,quebras:0}, max:0};
    return {ctx, ini};
  }

  // ---------- um arrasto: slide do jogo + o que contaMissao e recolheCarro contam ----------
  function passo(ctx, st, di){
    const [dx,dy]=DIRS[di];
    env.ajusta(ctx.w, ctx.h, st.lx.length ? ctx.base.concat(st.lx.map((l,i)=>({x:l.x,y:l.y,lixo:true,hp:l.hp,id:'l'+i}))) : ctx.base, ctx.edges, ctx.char);
    const r=env.slide(st.ts,dx,dy); if(!r.moved) return null;
    const f={...st.f}; let lx=st.lx, al=st.al, tr=st.tr, max=st.max;
    // rachaLixo: cada junção numa casa vizinha tira 1 de vida
    if(lx.length && r.merges.length){ lx=lx.map(l=>({...l}));
      for(const o of r.merges) for(const l of lx) if(l.hp>0 && Math.abs(l.x-o.x)+Math.abs(l.y-o.y)===1) l.hp--;
      const foram=lx.filter(l=>l.hp<=0).length; if(foram){ f.rach+=foram; lx=lx.filter(l=>l.hp>0); } }
    if(r.merges.length){ f.feitas={...f.feitas}; f.cores={...f.cores}; if(al.length) al=al.map(a=>({...a}));
      for(const o of r.merges){
        f.feitas[o.t]=(f.feitas[o.t]||0)+1; if(o.c!=null) f.cores[o.t+':'+o.c]=(f.cores[o.t+':'+o.c]||0)+1;
        if(o.t>max) max=o.t;
        const a=al.find(a=>!a.ok && !a.leve && a.x===o.x && a.y===o.y && o.t>=a.t); if(a) a.ok=true;
        if(tr.length){ const k=o.x+','+o.y; if(tr.includes(k)) tr=tr.filter(q=>q!==k); }
        if(o.solta) f.soltas++;
      } }
    // levar: exatamente a peça pedida chegando andando (junção ali não vale; a que já estava na casa também não)
    if(al.some(a=>a.leve && !a.ok)){ if(al===st.al) al=al.map(a=>({...a})); const juntou=new Set(r.merges.map(o=>o.id));
      for(const a of al) if(a.leve && !a.ok){ const q=r.tiles.find(t=>t.x===a.x && t.y===a.y && t.k!=='p');
        if(q && q.t===a.t && !juntou.has(q.id) && q.id!==a.ocup) a.ok=true; a.ocup = q ? q.id : null; } }
    if(r.merges.length>=2) f.combos++;
    if(r.breaks.length && ctx.metas.some(o=>o.quebre)) f.quebras+=r.breaks.filter(b=>b.t>=ctx.metas.find(o=>o.quebre).quebre).length;
    // recolheCarro: a nave leva a peça do nível pedido (ou maior) parada nela
    let ts=r.tiles, ca=st.ca;
    if(ca){ const i=ts.findIndex(t=>t.x===ca.x && t.y===ca.y && t.t>=ca.t && t.k!=='p' && !t.presa); if(i>=0){ ts=ts.filter((_,j)=>j!==i); ca={...ca,n:ca.n+1}; } }
    for(const t of ts) if(t.solta) delete t.solta;   // a marca de solta vale uma vez (contaMissao)
    const ns={ts,lx,tr,al,ca,f,max};
    if(ctx.proib && max>=ctx.proib) return {ns,r,fim:'proibido'};   // violou vem antes de cumpriu, como em checaMissao
    if(cumpriu(ctx,ns)) return {ns,r,fim:'venceu'};
    return {ns,r,fim:null};
  }
  // progresso de cada meta como progObj (at, alvo)
  function prog(ctx, st, o){
    const f=st.f;
    if(o.forme) return [f.feitas[o.forme]||0, o.n];
    if(o.cor!=null) return [f.cores[o.t+':'+o.cor]||0, o.n];
    if(o.combo) return [f.combos, o.combo];
    if(o.alvo) return [st.al.filter(a=>a.ok&&!a.leve).length, st.al.filter(a=>!a.leve).length||o.n||1];
    if(o.leve) return [st.al.filter(a=>a.ok&&a.leve).length, st.al.filter(a=>a.leve).length||o.n||1];
    if(o.rache) return [f.rach, o.rache];
    if(o.terra) return [ctx.terraTot-st.tr.length, ctx.terraTot||o.terra];
    if(o.solte) return [f.soltas, ctx.presasTot||o.n||1];
    if(o.carrinho) return [st.ca?.n||0, o.n];
    if(o.quebre) return [f.quebras, o.n];
    return [0,1];
  }
  const cumpriu=(ctx,st)=>ctx.metas.every(o=>{ const [a,b]=prog(ctx,st,o); return a>=b; });
  const avanco=(ctx,st)=>ctx.metas.reduce((s,o)=>{ const [a,b]=prog(ctx,st,o); return s+Math.min(a,b)/b; },0);

  // chave do estado: peças, lixos, nebulosas, órbitas cumpridas, nave e o que as metas contam
  function chave(ctx, st){
    const w=ctx.w, p=[];
    for(const t of st.ts) p.push(String.fromCharCode(48+t.x+t.y*w)+String.fromCharCode(64+t.t)+(t.c??'')+(t.k||'')+(t.presa?'P':''));
    p.sort();
    let k=p.join(',');
    if(ctx.lx0) k+='|'+st.lx.map(l=>l.x+'.'+l.y+'.'+l.hp).join(',');
    if(ctx.terraTot) k+='|'+st.tr.join(';');
    if(st.al.length) k+='|'+st.al.map(a=>a.ok?1:0).join('');
    if(st.ca) k+='|'+st.ca.n;
    for(const o of ctx.metas){ if(o.forme||o.cor!=null||o.combo||o.solte||o.quebre){ const [a,b]=prog(ctx,st,o); k+='|'+Math.min(a,b); } }
    return k;
  }

  // ---------- menor solução, só (rápido: para no primeiro nível que cumpre) ----------
  function buscaMin(f, maxP=20, maxEst=400000, lista=0){
    const {ctx,ini}=contexto(f); if(ctx.problemas.length) return {problemas:ctx.problemas};
    let nivel=[{st:ini,pai:null,di:-1,vias:1,pais:[]}], visto=new Set([chave(ctx,ini)]);
    // as soluções mínimas, até 'lista' delas (cada estado lembra todos os pais da camada anterior)
    const listar=(fins)=>{ const out=[]; const anda=(no,suf)=>{ if(out.length>=lista) return; if(!no.pai){ out.push(suf); return; }
        for(const {no:p,di} of no.pais) anda(p, NOMES[di]+suf); };
      for(const {no,di} of fins) anda(no, NOMES[di]); return out; };
    const caminho=(no,di)=>{ const a=[NOMES[di]]; for(let q=no;q.pai;q=q.pai) a.unshift(NOMES[q.di]); return a.join(''); };
    for(let p=1;p<=maxP;p++){ const prox=[], nesta=new Map(), fins=[]; let sol=null, sols=0;
      for(const no of nivel) for(let di=0;di<4;di++){ const res=passo(ctx,no.st,di); if(!res) continue;
        if(res.fim==='venceu'){ sols+=no.vias; if(!sol) sol=caminho(no,di); if(lista) fins.push({no,di}); continue; }
        if(res.fim || sol) continue;
        const k=chave(ctx,res.ns); const ja=nesta.get(k); if(ja){ ja.vias+=no.vias; if(lista) ja.pais.push({no,di}); continue; }
        if(visto.has(k)) continue; visto.add(k); const nn={st:res.ns,pai:no,di,vias:no.vias,pais:lista?[{no,di}]:null}; nesta.set(k,nn); prox.push(nn); }
      if(sol) return {min:p, sols, estados:visto.size, sol, ...(lista?{lista:listar(fins)}:{})};
      if(visto.size>maxEst) return {estourou:true, estados:visto.size, ate:p};
      nivel=prox; if(!nivel.length) break; }
    return {min:null, estados:visto.size};
  }

  // ---------- análise completa: todos os estados até min + folga, distância até cumprir de cada um ----------
  function analisa(f, opt={}){
    const folga=opt.folga??4, maxMin=opt.maxMin??20, maxEst=opt.maxEst??1500000, semente=opt.semente??12345;
    const {ctx,ini}=contexto(f); if(ctx.problemas.length) return {problemas:ctx.problemas};
    const ids=new Map(), ed=[], dep=[], cntT=[];
    const um=ctx.metas.length===1 && (ctx.metas[0].forme||ctx.metas[0].carrinho) && (ctx.metas[0].n||1)===1 ? ctx.metas[0] : null;
    const T=um ? (um.forme||um.carrinho)-1 : 0, conta=st=>T ? st.ts.filter(t=>t.t===T).length : 0;
    ids.set(chave(ctx,ini),0); ed.push(-9,-9,-9,-9); dep.push(0); cntT.push(conta(ini));
    let camada=[{id:0,st:ini}], min=null, L=Infinity;
    for(let d=0; d<L && camada.length; d++){ const prox=[];
      for(const {id,st} of camada) for(let di=0;di<4;di++){ const res=passo(ctx,st,di);
        if(!res){ ed[id*4+di]=-1; continue; }
        if(res.fim==='venceu'){ ed[id*4+di]=-2; if(min==null){ min=d+1; L=min+folga; } continue; }
        if(res.fim){ ed[id*4+di]=-3; continue; }
        const k=chave(ctx,res.ns); let c=ids.get(k);
        if(c==null){ c=dep.length; ids.set(k,c); ed.push(-9,-9,-9,-9); dep.push(d+1); cntT.push(conta(res.ns)); prox.push({id:c,st:res.ns});
          if(c>maxEst) return {estourou:true, estados:c, ate:d+1, min}; }
        ed[id*4+di]=c; }
      if(min==null && d+1>=maxMin) return {min:null, estados:dep.length};
      camada=prox; }
    if(min==null) return {min:null, estados:dep.length};
    const N=dep.length, INF=1e9;
    // pais (para andar de trás para a frente) e distância até cumprir
    const cnt=new Int32Array(N+1); for(let s=0;s<N;s++) for(let di=0;di<4;di++){ const c=ed[s*4+di]; if(c>=0) cnt[c+1]++; }
    for(let i=0;i<N;i++) cnt[i+1]+=cnt[i];
    const par=new Int32Array(cnt[N]), pos=cnt.slice(0,N);
    for(let s=0;s<N;s++) for(let di=0;di<4;di++){ const c=ed[s*4+di]; if(c>=0) par[pos[c]++]=s; }
    const dist=new Int32Array(N).fill(INF), fila=[];
    for(let s=0;s<N;s++) for(let di=0;di<4;di++) if(ed[s*4+di]===-2){ dist[s]=1; fila.push(s); break; }
    for(let i=0;i<fila.length;i++){ const u=fila[i]; for(let j=cnt[u];j<cnt[u+1];j++){ const p=par[j]; if(dist[p]===INF){ dist[p]=dist[u]+1; fila.push(p); } } }
    // quantas soluções mínimas
    const vias=new Float64Array(N);
    for(const u of fila){ if(dist[u]===1){ for(let di=0;di<4;di++) if(ed[u*4+di]===-2) vias[u]++; }
      else for(let di=0;di<4;di++){ const c=ed[u*4+di]; if(c>=0 && dist[c]===dist[u]-1) vias[u]+=vias[c]; } }
    const bom=(s,di,resta)=>{ const c=ed[s*4+di]; return resta===1 ? c===-2 : c>=0 && dist[c]===resta-1; };
    let prim=0; for(let di=0;di<4;di++) if(bom(0,di,min)) prim++;
    // armadilhas nas sequências de 1 a 3 arrastos
    const arm=[], fora=[];
    for(let k=1;k<=3;k++){ let tot=0, morto=0, perde=0;
      const anda=(s,j)=>{ for(let di=0;di<4;di++){ const c=ed[s*4+di]; if(c===-1||c===-9) continue;
          if(c===-2) continue;                                 // já cumpriu: não é armadilha
          if(c===-3){ tot++; morto++; perde++; continue; }      // formou o proibido
          if(j<k){ let tem=false; for(let d2=0;d2<4;d2++){ const c2=ed[c*4+d2]; if(c2!==-1&&c2!==-9) tem=true; }
            if(tem){ anda(c,j+1); continue; } }
          tot++; if(dist[c]>L-j) morto++; if(dist[c]>min-j) perde++; } };
      anda(0,1); arm.push(tot?morto/tot:0); fora.push(tot?perde/tot:0); }
    // jogadores: guloso e ao acaso
    let sem=semente>>>0; const rnd=()=>{ sem=(sem+0x6D2B79F5)|0; let q=Math.imul(sem^sem>>>15,1|sem); q=q+Math.imul(q^q>>>7,61|q)^q; return ((q^q>>>14)>>>0)/4294967296; };
    const joga=(guloso)=>{ let st=ini;
      for(let j=0;j<L;j++){ const op=[]; for(let di=0;di<4;di++){ const res=passo(ctx,st,di); if(res) op.push(res); }
        if(!op.length) return false;
        if(op.some(o=>o.fim==='venceu')) return true;
        let cand=op.filter(o=>!o.fim); if(!cand.length) return false;
        if(guloso){ const av=avanco(ctx,st);
          const nota=o=>(avanco(ctx,o.ns)-av)*1e6 + o.r.merges.length*1e3 + Math.max(0,...o.r.merges.map(m=>m.t));
          const melhor=Math.max(...cand.map(nota)); cand=cand.filter(o=>nota(o)===melhor); }
        st=cand[Math.floor(rnd()*cand.length)].ns; }
      return false; };
    let gul=0; const NG=opt.rodadasGuloso??48; for(let i=0;i<NG;i++) gul+=joga(true);
    let aca=0; const NA=opt.rodadasAcaso??150; for(let i=0;i<NA;i++) aca+=joga(false);
    // soluções mínimas: uma para guardar e as contraintuitivas
    const sol=[]; { let s=0; for(let r=min;r>=1;r--){ let d=0; while(!bom(s,d,r)) d++; sol.push(NOMES[d]); if(r>1) s=ed[s*4+d]; } }
    const contra=contraintuitivo(ctx,ini,ed,dist,min,opt.maxSols??300);
    let juncao=null;
    if(T){ const novo=new Set();
      for(let s2=0;s2<N;s2++){ if(cntT[s2]>=2) continue; for(let di=0;di<4;di++){ const c=ed[s2*4+di]; if(c>=0 && cntT[c]>=2 && dep[c]<L) novo.add(c); } }
      let longe=0; for(const c of novo) if(dist[c]!==1) longe++;
      juncao = novo.size ? longe/novo.size : 0; }
    return {min, sols:vias[0], prim, arm1:arm[0], arm2:arm[1], arm3:arm[2], arm:(arm[0]+arm[1]+arm[2])/3, fora1:fora[0],
      contra:contra.contra, recusa:contra.recusa, separa:contra.separa, exige:contra.contra===1, guloso:gul/NG, acaso:aca/NA,
      estados:N, folga, sol:sol.join(''), juncao};
  }

  // pares prontos: duas peças que juntam uma com a outra em algum arrasto
  function prontos(ctx, st){
    const s=new Set();
    env.ajusta(ctx.w, ctx.h, st.lx.length ? ctx.base.concat(st.lx.map(l=>({x:l.x,y:l.y,lixo:true,hp:l.hp}))) : ctx.base, ctx.edges, ctx.char);
    for(const [dx,dy] of DIRS){ const r=env.slide(st.ts,dx,dy); if(!r.moved) continue;
      r.merges.forEach((o,i)=>{ const g=r.gone[i]; if(g) s.add([o.id,g.id].sort().join('~')); }); }
    return s;
  }
  function contraintuitivo(ctx, ini, ed, dist, min, maxSols){
    let n=0, cR=0, cS=0, cA=0;
    const anda=(s, st, resta, temR, temS)=>{
      if(n>=maxSols) return;
      if(resta===1){ n++; if(temR) cR++; if(temS) cS++; if(temR||temS) cA++; return; }
      const op=[]; for(let di=0;di<4;di++) op.push(passo(ctx,st,di));
      const maxJ=Math.max(0,...op.filter(o=>o && !o.fim).map(o=>o.r.merges.length));
      const pr=prontos(ctx,st);
      for(let di=0;di<4;di++){ const c=ed[s*4+di]; if(!(c>=0 && dist[c]===resta-1)) continue;
        const o=op[di], rec=o.r.merges.length<maxJ;
        const mexeu=new Set([...o.r.merges.map(m=>m.id), ...o.r.gone.map(g=>g.id)]), depois=prontos(ctx,o.ns), ids=new Set(o.ns.ts.map(t=>t.id));
        let sep=false; for(const p of pr){ const [a,b]=p.split('~'); if(!mexeu.has(a) && !mexeu.has(b) && ids.has(a) && ids.has(b) && !depois.has(p)) { sep=true; break; } }
        anda(c, o.ns, resta-1, temR||rec, temS||sep); } };
    anda(0, ini, min, false, false);
    return {contra:n?cA/n:0, recusa:n?cR/n:0, separa:n?cS/n:0, n};
  }

  // ---------- o que pesa na fase (pedido dos revisores) ----------
  // Cada coisa da fase tem de mudar o quebra-cabeça: tirando-a, a menor solução muda ou alguma solução mínima deixa de
  // valer (se todas as soluções mínimas continuam valendo sem ela, ela é de enfeite).
  //   proib      o planeta proibido: alcançável dentro do limite (alc) e, sem a proibição, a menor solução cai (pesa)
  //   metas      com mais de uma meta: sem cada uma, a menor solução cai (senão ela sai de graça)
  //   mec        estações (B), buracos (#), muretas, lixo que não é meta, auras: sem elas, min ou soluções mudam
  //   levar      órbita de levar e nave: quantos arrastos custa levar além de só formar o planeta pedido
  //   giro       padrões fixos (girar nos dois sentidos, três direções em ciclo, ou alternar dois lados) que cumprem
  //              com até min+1 arrastos (★★★ no modo Quebra-cabeças)
  //   lugar      órbita de formar: quantos arrastos custa formar ali além de formar em qualquer casa

  //   inuteis    peças que dá para tirar sem mudar min, sem invalidar solução mínima e sem baixar a armadilha (uma peça
  //              que só arma a armadilha conta: tirá-la deixa a fase mais fácil)
  //   passinho   menor solução jogando no Passinho, com o mesmo limite (null: não cumpre; o jogo oferece a medalha)
  function pesos(f, opt={}){
    const L=opt.L, base=buscaMin(f, L, 400000, 300); if(base.min==null) return {erro:'sem solução'};
    const {min, sols}=base, out={min, sols};
    const mede=g=>{ const b=buscaMin(g, L, 400000); return {g, min:b.min, estourou:!!b.estourou}; };
    const pesa=r=>r.estourou || r.min!==min || base.lista.some(s=>confere(r.g,s).cumpriu!==min);
    const objs=f.objs||[f.obj], metas=objs.filter(o=>!o.proibido), proib=objs.find(o=>o.proibido);
    const comObjs=os=>{ const g={...f}; delete g.obj; delete g.objs; if(os.length===1) g.obj=os[0]; else g.objs=os; return g; };
    if(proib){ const r=mede(comObjs(metas)); out.proib={min:r.min, pesa:r.min!=null && r.min<min};
      // alcançável: alguma sequência dentro do limite forma o proibido (a mesma fase com a meta de formar o proibido)
      const alc=buscaMin(comObjs([{forme:proib.proibido,n:1}]), L, 400000); out.proib.alc=alc.min!=null; }
    if(metas.length>1) out.metas=metas.map(o=>{ const r=mede(comObjs(objs.filter(x=>x!==o))); return {meta:Object.keys(o)[0], min:r.min, pesa:r.min==null||r.min<min}; });
    out.mec={};
    const troca=ch=>f.mapa.map(r=>r.split('').map(c=>c===ch?'.':c).join(''));
    if(f.mapa.some(r=>r.includes('B'))) out.mec.estacao=pesa(mede({...f, mapa:troca('B')}));
    if(f.mapa.some(r=>r.includes('#'))) out.mec.buraco=pesa(mede({...f, mapa:troca('#')}));
    if(f.muretas?.length) out.mec.mureta=pesa(mede({...f, muretas:[]}));
    // lixo que não é meta: pesa se, trocado por casa vazia e trocado por estação (que não racha), a fase muda
    if(f.mapa.some(r=>/[L23]/.test(r)) && !metas.some(o=>o.rache)){
      out.mec.lixo=pesa(mede({...f, mapa:f.mapa.map(r=>r.replace(/[L23]/g,'.'))}));
      out.mec.rachar=pesa(mede({...f, mapa:f.mapa.map(r=>r.replace(/[L23]/g,'B'))})); }
    if(f.pecas.some(p=>p[3]!=null)){ const semCor=metas.map(o=>o.cor!=null?{forme:o.t,n:o.n}:o);
      out.mec.aura=pesa(mede({...comObjs(proib?[...semCor,proib]:semCor), pecas:f.pecas.map(p=>[p[0],p[1],p[2]])})); }
    // levar: a mesma fase pedindo só formar o planeta (órbita e nave viram 'forme')
    const lv=metas.find(o=>o.leve||o.carrinho);
    if(metas.some(o=>o.alvo)){ const forme=metas.map(o=>o.alvo?{forme:o.alvo,n:o.n||1}:o);
      const r=mede(comObjs(proib?[...forme,proib]:forme)); out.lugar = r.min==null ? null : min-r.min; }
    if(lv){ const forme=metas.map(o=>o.leve?{forme:o.leve,n:o.n||1}:o.carrinho?{forme:o.carrinho,n:o.n}:o);
      const r=mede(comObjs(proib?[...forme,proib]:forme)); out.levar = r.min==null ? null : min-r.min; }
    // padrões fixos de arrastar (o arrasto que não mexe nada não conta, como no jogo)
    const {ctx,ini}=contexto(f), pad=[];
    const ciclos=[[3,1,2,0],[3,0,2,1],[0,2],[0,3],[1,2],[1,3]];
    for(const a of [0,1,2,3]) for(const b of [0,1,2,3]) for(const c of [0,1,2,3]) if(a!==b&&b!==c&&a!==c) ciclos.push([a,b,c]);
    for(const ciclo of ciclos) for(let o=0;o<ciclo.length;o++) pad.push(ciclo.map((_,i)=>ciclo[(i+o)%ciclo.length]));
    out.giro=[];
    for(const pd of pad){ let st=ini, usados=0, parado=0, ok=false;
      for(let i=0;usados<min+1 && parado<pd.length;i++){ const res=passo(ctx,st,pd[i%pd.length]); if(!res){ parado++; continue; } parado=0; usados++;
        if(res.fim==='venceu'){ ok=true; break; } if(res.fim) break; st=res.ns; }
      if(ok){ const nome=pd.map(d=>NOMES[d]).join(''); if(!out.giro.includes(nome)) out.giro.push(nome); } }
    // peças que não fazem nada
    out.inuteis=[]; let armBase=null;
    f.pecas.forEach((p,i)=>{ const g={...f, pecas:f.pecas.filter((_,j)=>j!==i)}, r=mede(g); if(pesa(r)) return;
      if(armBase==null) armBase=analisa(f,{folga:L-min, rodadasGuloso:8, rodadasAcaso:8, maxSols:20}).arm;
      const a=analisa(g,{folga:L-min, rodadasGuloso:8, rodadasAcaso:8, maxSols:20}).arm;
      if(a>=armBase-.05) out.inuteis.push(p.slice(0,3)); });
    if((f.char||'rola')!=='passinho'){ const b=buscaMin({...f, char:'passinho'}, L, 400000); out.passinho=b.min??null; }
    return out;
  }
  // o que falta para a fase passar no que os revisores pediram (lista vazia: passa)
  function falhas(p, opt={}){
    const a=[];
    if(p.erro) return [p.erro];
    if(p.proib && !(p.proib.alc && p.proib.pesa)) a.push('proibido de enfeite');
    for(const m of p.metas||[]) if(!m.pesa) a.push('meta de graça: '+m.meta);
    for(const [k,v] of Object.entries(p.mec||{})) if(!v) a.push(k+' de enfeite');
    if(opt.levar!=null && p.levar!=null && p.levar<opt.levar) a.push('levar custa '+p.levar);
    if(opt.lugar!=null && p.lugar!=null && p.lugar<opt.lugar) a.push('órbita de enfeite: formar ali custa '+p.lugar);

    if(!opt.giroOk && p.giro?.length) a.push('girar resolve: '+p.giro[0]);
    if(!opt.inuteisOk && p.inuteis?.length) a.push('peça que não faz nada: '+JSON.stringify(p.inuteis[0]));
    return a;
  }

  // repete uma solução ('DBEC...') e diz em que arrasto cumpriu (0 = não cumpriu)
  function confere(f, sol){
    const {ctx,ini}=contexto(f); if(ctx.problemas.length) return {problemas:ctx.problemas};
    let st=ini;
    for(let i=0;i<sol.length;i++){ const res=passo(ctx,st,NOMES.indexOf(sol[i])); if(!res) return {erro:`arrasto ${i+1} não mexe nada`};
      if(res.fim==='venceu') return {cumpriu:i+1}; if(res.fim) return {erro:`arrasto ${i+1}: ${res.fim}`}; st=res.ns; }
    return {cumpriu:0};
  }

  return {contexto, passo, chave, buscaMin, analisa, confere, cumpriu, prontos, pesos, falhas, DIRS, NOMES};
}

// ---------- sorteio de tabuleiros (para o gerador) ----------
// spec: {w,h, forma (ou formas: uma sorteada), buracos, blocos, muretas, lixos, lixoHp (número ou lista), cores, mista, passinho, proibido,
//        metas:[...] (as casas de órbita, nave, preso e nebulosa saem delas), terraNaOrbita, alvoNaPresa,
//        material:[níveis (ou {t,c}) partidos em pedaços de soma exata], pecas:[mín,máx], iscas:[mín,máx], nivelIsca:[mín,máx]}
// Devolve uma fase no formato de src/quebra_fases.js (sem nome, arrastos e estrelas).
function sorteia(spec, rnd=Math.random){
  const pega=a=>a[Math.floor(rnd()*a.length)], entre=([a,b])=>a+Math.floor(rnd()*(b-a+1));
  const forma=spec.formas ? pega(spec.formas) : spec.forma;   // o formato pronto manda no tamanho
  const w=forma?forma[0].length:spec.w, h=forma?forma.length:(spec.h||spec.w);
  const emb=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const mapa=Array.from({length:h},()=>Array(w).fill('.'));
  if(forma) forma.forEach((row,y)=>[...row].forEach((ch,x)=>{ mapa[y][x]=ch; }));
  const livres=()=>{ const o=[]; for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(mapa[y][x]==='.' && !usadas.has(x+','+y)) o.push([x,y]); return emb(o); };
  const usadas=new Set(), usa=f=>{ const c=livres().find(([x,y])=>!f||f(x,y)); if(c) usadas.add(c[0]+','+c[1]); return c; };
  for(let i=0;i<(spec.buracos||0);i++){ const c=usa(); if(c){ mapa[c[1]][c[0]]='#'; usadas.delete(c[0]+','+c[1]); } }
  for(let i=0;i<(spec.blocos||0);i++){ const c=usa(); if(c){ mapa[c[1]][c[0]]='B'; usadas.delete(c[0]+','+c[1]); } }
  for(let i=0;i<(spec.lixos||0);i++){ const c=usa(); const hp=Array.isArray(spec.lixoHp)?spec.lixoHp[i]??1:spec.lixoHp||1;
    if(c){ mapa[c[1]][c[0]]=hp>1?String(hp):'L'; usadas.delete(c[0]+','+c[1]); } }
  const vazia=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&mapa[y][x]==='.';
  const muretas=[];
  if(spec.muretas){ const todas=[]; for(let y=0;y<h;y++) for(let x=0;x<w-1;x++) if(vazia(x,y)&&vazia(x+1,y)) todas.push(['v',x,y]);
    for(let y=0;y<h-1;y++) for(let x=0;x<w;x++) if(vazia(x,y)&&vazia(x,y+1)) todas.push(['h',x,y]);
    muretas.push(...emb(todas).slice(0,spec.muretas)); }
  const borda=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!vazia(x+dx,y+dy)) || muretas.some(([d,mx,my])=>d==='v'?(my===y&&(mx===x||mx===x-1)):(mx===x&&(my===y||my===y-1)));
  const f={mapa:null, pecas:[], regras:{spawns:0}};
  const metas=spec.metas.map(o=>({...o}));
  // casas especiais
  const alvosPos=[], terraPos=[], presasPos=[]; let carroPos=null;
  for(const o of metas){
    if(o.carrinho){ const canto=(x,y)=>(x===0||x===w-1)&&(y===0||y===h-1);
      const c=usa(spec.naveNaBorda===false?null:spec.naveForaDoCanto?(x,y)=>borda(x,y)&&!canto(x,y):borda); if(!c) return null; carroPos=c; }
    if(o.alvo||o.leve){ const n=o.n||1; const ps=[]; for(let i=0;i<n;i++){ const c=(o.alvo && spec.alvoNaPresa && presasPos[i]) || usa(); if(!c) return null; ps.push(c); } if(metas.filter(m=>m.alvo||m.leve).length>1) o.pos=ps; else alvosPos.push(...ps); }
    if(o.solte){ for(let i=0;i<(o.n||1);i++){ const c=usa(); if(!c) return null; presasPos.push(c); } }
  }
  const terraN=metas.find(o=>o.terra)?.terra||0;
  // nebulosas: em casa vazia no começo; a órbita de formar pode estar coberta (spec.terraNaOrbita)
  for(let i=0;i<terraN;i++){ let c; if(i===0 && spec.terraNaOrbita && alvosPos.length) c=alvosPos[0]; else { c=usa(); if(!c) return null; } terraPos.push(c); }
  // peças: cada nível do material partido em pedaços (a soma é exata), mais as iscas
  let pecas=[]; const nP=entre(spec.pecas||[3,6]);
  for(const m of spec.material||[]) pecas.push({t:m.t??m, c:m.c});
  let guard=0; while(pecas.length<nP && guard++<50){ const cand=pecas.map((p,i)=>i).filter(i=>pecas[i].t>(spec.menor||1)); if(!cand.length) break;
    const i=pega(cand), p=pecas.splice(i,1)[0];
    let ca=p.c, cb=p.c; if(spec.cores && p.c!=null && p.c!==2 && rnd()<(spec.mista??.15)){ if(rnd()<.5) ca=2; else cb=2; }
    pecas.push({t:p.t-1,c:ca},{t:p.t-1,c:cb}); }
  const nI=entre(spec.iscas||[0,0]);
  for(let i=0;i<nI;i++) pecas.push({t:entre(spec.nivelIsca||[1,2]), c: spec.cores ? (rnd()<.1?2:rnd()<.5?0:1) : undefined});
  if(spec.cores) for(const p of pecas) if(p.c==null) p.c=rnd()<.5?0:1;
  for(const p of pecas){ const c=usa(); if(!c) return null; const a=[c[0],c[1],p.t]; if(p.c!=null) a.push(p.c); f.pecas.push(a); }
  f.mapa=mapa.map(r=>r.join(''));
  if(metas.length===1 && !spec.proibido) f.obj=metas[0]; else f.objs=spec.proibido ? [...metas,{proibido:spec.proibido}] : metas;
  if(muretas.length) f.muretas=muretas;
  if(carroPos) f.carroPos=carroPos;
  if(presasPos.length) f.presasPos=presasPos;
  if(alvosPos.length) f.alvosPos=alvosPos;
  if(terraPos.length) f.terraPos=terraPos;
  if(spec.passinho) f.char='passinho';
  if(spec.cores) f.fase='cores';
  return f;
}

const QM={QuebraMedidor, sorteia, DIRS, NOMES};
if(typeof module!=='undefined' && module.exports) module.exports=QM; else raiz.QM=QM;
})(typeof window!=='undefined'?window:globalThis);
