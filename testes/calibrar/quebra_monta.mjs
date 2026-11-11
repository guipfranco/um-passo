// Monta src/quebra_fases.js a partir dos candidatos do gerador (quebra_gera.mjs) e das fases da versão 1
// (quebra_v1.json), uma por vaga das receitas (quebra_receitas.mjs), seguindo a curva de cada vaga: menor solução na
// faixa, armadilha perto do alvo, guloso e girar recusados (fora das primeiras), cada mecânica e cada meta pesando
// (pesos/falhas em quebra_medidor.js), menor solução nunca descendo dentro do mundo, sem repetir material e meta no
// mundo, e sem duas seguidas com o mesmo pedido no mesmo tabuleiro.
//   node testes/calibrar/quebra_monta.mjs <pasta dos candidatos> [--escreve] [--tudo | --refaz]
// Sem --tudo, as fases já gravadas em src/quebra_fases.js ficam como estão; com --refaz (uma vez só), as vagas de
// REFAZER (quebra_nomes.mjs) são escolhidas de novo, sem repetir o tabuleiro que estava lá, e ORDEM troca vagas de lugar.
// Cada fase ganha um id estável (quebra_id.mjs) e o arquivo leva QJ_ANTIGA, a tabela da migração do progresso da
// versão 1 (src/quebra.js, qjMigra).
// Sem --escreve só mostra a escolha. Depois: node testes/calibrar/quebra_mede.mjs fases --json (medidas e soluções).
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url';
import {RECEITAS} from './quebra_receitas.mjs';
import {desenha, resumo} from './quebra_ver.mjs';
import {medidor} from './quebra_slide.mjs';
import {idFase} from './quebra_id.mjs';
import {formatoDe} from './quebra_formas.mjs';
const AQUI=path.dirname(fileURLToPath(import.meta.url)), RAIZ=path.resolve(AQUI,'..','..'), ARQ=path.join(RAIZ,'src','quebra_fases.js');
const pasta=process.argv[2]||'E:/tmp/qpool2', escreve=process.argv.includes('--escreve'), tudo=process.argv.includes('--tudo'), refaz=process.argv.includes('--refaz');
const nomes=await import('./quebra_nomes.mjs'), {NOMES, MUNDOS, TROCA={}, AJUSTES={}}=nomes, REFAZER=refaz?nomes.REFAZER||[]:[];
const M=medidor();
const V1=JSON.parse(fs.readFileSync(path.join(AQUI,'quebra_v1.json'),'utf8')).fases;
let atuais=null;
if(!tudo && fs.existsSync(ARQ)){ const c=vm.createContext({}); vm.runInContext(fs.readFileSync(ARQ,'utf8')+';globalThis.Q=QJ_FASES;',c); atuais=c.Q; }
const semExtras=q=>{ const f={...q}; for(const k of ['id','g','nome','arrastos','estrelas','min']) delete f[k]; return f; };
const pecasDe=f=>f.pecas.length+(f.presasPos?.length||0);
const meta=f=>JSON.stringify(f.objs||[f.obj]);
// repetida = o mesmo material, a mesma meta e o mesmo tabuleiro (o mesmo material num formato diferente é outra fase)
const material=f=>JSON.stringify([f.pecas.map(p=>p[2]+(p[3]!=null?'c'+p[3]:'')).sort(), meta(f), f.mapa.length+'x'+f.mapa[0].length+':'+(formatoDe(f.mapa)||'liso'), f.char||'rola']);
const tabuleiro=f=>`${f.mapa[0].length}x${f.mapa.length}:${formatoDe(f.mapa)||'liso'}${f.char==='passinho'?':passinho':''}`;
const gMax=rec=>rec.filtro.maxGuloso;
// nota: armadilha perto do alvo da vaga, guloso abaixo do teto, solução contraintuitiva, poucas peças
const nota=(c,rec)=>{ const m=c.m;
  return -4*Math.abs(m.arm-rec.armAlvo) - 3*Math.max(0,m.guloso-gMax(rec)) + .4*(m.exige?1:0) + .3*m.contra
    - .15*Math.max(0,pecasDe(c.f)-4) - .01*Math.min(m.sols,50) + (c.v1?.25:0) + (rec.spec.formato && c.formato ? .1 : 0); };
// as fases da versão 1 concorrem no mundo equivalente (o mundo 2, dos formatos, é novo)
const mundoNovo=g=>g===0?0:g+1;
const cacheV1=new Map();
function candV1(rec){
  // só na vaga do mesmo tipo: as mesmas metas, o mesmo jeito de jogar e a vaga sem formato pedido (as de formato são dos
  // tabuleiros novos)
  const tipo=f=>JSON.stringify([(f.objs||[f.obj]||f.metas).map(o=>Object.keys(o).filter(k=>k!=='n'&&k!=='pos'&&k!=='t').sort().join()).sort(), f.char||(f.passinho?'passinho':'rola')]);
  const tr=tipo({objs:[...(rec.spec.metas||[]), ...(rec.spec.proibido?[{proibido:1}]:[])], char:rec.spec.passinho?'passinho':'rola'});
  if(rec.spec.formato || rec.spec.formas) return [];
  return V1.filter(v=>mundoNovo(v.g)===rec.g && tipo(v.f)===tr).map(v=>{ if(!cacheV1.has(v.id)){ const f={...v.f}; for(const k of ['g','nome','arrastos','estrelas','min']) delete f[k];
      const m=M.analisa(f,{folga:4}); m.pesos=M.pesos(f,{L:m.min+4}); cacheV1.set(v.id,{rec:rec.id, g:rec.g, f, m, v1:v.n}); }
    return {...cacheV1.get(v.id), rec:rec.id}; });
}
const passa=(c,rec)=>{ const m=c.m, F=rec.filtro, [lo,hi]=rec.prof;
  if(m.min<lo || m.min>hi) return false;
  if(m.arm<F.minArm || m.arm>F.maxArm || m.guloso>F.maxGuloso || m.sols>F.maxSols) return false;
  const p=m.pesos||M.pesos(c.f,{L:m.min+4}); return M.falhas(p,{levar:F.levar, giroOk:F.giroOk, lugar:F.lugar}).length===0; };
const usados=new Set(), escolhidas=[];
const mostra=(rec,c,nova,folga)=>{ console.log(`${rec.id} ${c.v1?'(v1 fase '+c.v1+') ':''}${nova?'(NOVA) ':''}${folga?'(FOLGA) ':''}${NOMES[rec.id]||'?'} | alvo arm ${Math.round(rec.armAlvo*100)}% | ${resumo(c.m)} pecas ${pecasDe(c.f)} ${tabuleiro(c.f)} ${meta(c.f)}${c.f.char?' passinho':''}`);
  for(const l of desenha(c.f)) console.log('      '+l); };
// candidatos de uma vaga: os do gerador e os da versão 1 que passam no filtro dela; sem nenhum, com folga (armadilha
// ±25 pontos, guloso +0,15), avisado
function candidatos(rec){
  const arq=path.join(pasta, rec.id+'.json');
  const todos=[...(fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq,'utf8')) : []), ...candV1(rec)];
  for(const c of todos) c.formato=formatoDe(c.f.mapa);
  if(TROCA[rec.id]!=null) return {lista:todos.filter(x=>x.m.sol===TROCA[rec.id] || idFase(x.f)===TROCA[rec.id]), folga:false};
  let lista=todos.filter(x=>passa(x,rec));
  if(lista.length) return {lista, folga:false};
  const F=rec.filtro, rel={...rec, filtro:{...F, minArm:Math.max(0,F.minArm-.13), maxArm:F.maxArm+.13, maxGuloso:Math.min(1,F.maxGuloso+.15)}};
  return {lista:todos.filter(x=>passa(x,rel)), folga:true};
}
// a melhor sequência do mundo (programação dinâmica): soma das notas, min nunca descendo, duas seguidas sem o mesmo
// pedido no mesmo tabuleiro; repetição de fase ou de material no mundo é desfeita tirando o candidato e refazendo
function melhorMundo(recs){
  const C=recs.map(rec=>candidatos(rec)), proibidos=recs.map(()=>new Set());
  for(let volta=0; volta<200; volta++){
    const L=C.map((c,s)=>c.lista.filter(x=>!proibidos[s].has(idFase(x.f)) && !usados.has(idFase(x.f))));
    const best=[], pai=[];
    L.forEach((lista,s)=>{ best[s]=[]; pai[s]=[];
      lista.forEach((c,i)=>{ const n=nota(c,recs[s]);
        if(s===0){ best[s][i]=n; pai[s][i]=-1; return; }
        let mb=-Infinity, mp=-1;
        L[s-1].forEach((d,j)=>{ if(best[s-1][j]===-Infinity || d.m.min>c.m.min) return;
          if(meta(d.f)===meta(c.f) && tabuleiro(d.f)===tabuleiro(c.f)) return;
          if(idFase(d.f)===idFase(c.f)) return;
          if(best[s-1][j]>mb){ mb=best[s-1][j]; mp=j; } });
        best[s][i]= mp<0 ? -Infinity : mb+n; pai[s][i]=mp; }); });
    const s1=L.length-1; let i=-1, mb=-Infinity; best[s1].forEach((v,k)=>{ if(v>mb){ mb=v; i=k; } });
    if(i<0){ const vazia=L.findIndex(l=>!l.length);
      return {erro: (vazia>=0 ? `vaga ${recs[vazia].id} sem candidato` : 'nenhuma sequência com o min subindo')+' | por vaga (min dos candidatos): '+L.map((l,s)=>recs[s].id.slice(-3)+':'+[...new Set(l.map(c=>c.m.min))].sort((x,y)=>x-y).join('/')).join(' ')}; }
    const seq=[]; for(let s=s1;s>=0;s--){ seq.unshift(L[s][i]); i=pai[s][i]; }
    // repetições fora das vizinhas: tira o candidato de nota menor e refaz
    let rep=null; for(let a2=0;a2<seq.length && !rep;a2++) for(let b2=a2+1;b2<seq.length;b2++)
      if(idFase(seq[a2].f)===idFase(seq[b2].f) || material(seq[a2].f)===material(seq[b2].f)){ rep=nota(seq[a2],recs[a2])<nota(seq[b2],recs[b2])?a2:b2; break; }
    if(rep==null) return {seq, folga:C.map(c=>c.folga)};
    proibidos[rep].add(idFase(seq[rep].f));
  }
  return {erro:'repetições demais'};
}
for(let g=0; g<MUNDOS.length; g++){
  const recs=RECEITAS.filter(r=>r.g===g);
  const mantem=recs.map(rec=>{ const a=atuais?.[RECEITAS.indexOf(rec)]; return a && !REFAZER.includes(rec.id) ? a : null; });
  if(mantem.every(Boolean)){   // o mundo fica como está (com os ajustes)
    recs.forEach((rec,s)=>{ let f=semExtras(mantem[s]); if(AJUSTES[rec.id]) f=ajusta(f, AJUSTES[rec.id]);
      const c={rec:rec.id, g, f, m:M.analisa(f,{folga:4}), mantida:true}; usados.add(idFase(f)); escolhidas.push({rec,c});
      if(AJUSTES[rec.id]) mostra(rec,c,false,false); }); continue; }
  if(!mantem.some(Boolean)){   // o mundo todo é escolhido de novo
    const r=melhorMundo(recs);
    if(r.erro){ console.log(`mundo ${g+1}: ${r.erro}`); continue; }
    r.seq.forEach((c,s)=>{ usados.add(idFase(c.f)); escolhidas.push({rec:recs[s],c}); mostra(recs[s],c,false,r.folga[s]); }); continue; }
  // algumas vagas refeitas: cada uma entre as vizinhas que ficam (min entre a anterior e a próxima)
  let minAnt=0;
  recs.forEach((rec,j)=>{
    if(mantem[j]){ let f=semExtras(mantem[j]); if(AJUSTES[rec.id]) f=ajusta(f, AJUSTES[rec.id]);
      const c={rec:rec.id, g, f, m:M.analisa(f,{folga:4}), mantida:true}; minAnt=Math.max(minAnt,c.m.min); usados.add(idFase(f)); escolhidas.push({rec,c}); return; }
    const atual=atuais?.[RECEITAS.indexOf(rec)];
    let {lista, folga}=candidatos(rec);
    if(atual){ const fora=idFase(semExtras(atual)); lista=lista.filter(x=>idFase(x.f)!==fora); }
    let teto=99; for(const k of recs.keys()) if(k>j && mantem[k]){ teto=mantem[k].min; break; }
    const doMundo=escolhidas.filter(e=>e.rec.g===g).map(e=>e.c), ant=doMundo[doMundo.length-1];
    const mats=new Set([...doMundo, ...mantem.filter(Boolean).map(a=>({f:semExtras(a)}))].map(c=>material(c.f)));
    const ok=lista.filter(x=>!usados.has(idFase(x.f)) && x.m.min>=minAnt && x.m.min<=teto && !mats.has(material(x.f))
      && !(ant && meta(ant.f)===meta(x.f) && tabuleiro(ant.f)===tabuleiro(x.f)));
    const c=ok.sort((a,b)=>nota(b,rec)-nota(a,rec))[0];
    if(!c){ console.log(`${rec.id}: SEM CANDIDATO (min anterior ${minAnt}, teto ${teto})`); return; }
    minAnt=Math.max(minAnt,c.m.min); usados.add(idFase(c.f)); escolhidas.push({rec,c}); mostra(rec,c,true,folga);
  });
}
function ajusta(f, a){ const g={...f};
  if(a.buraco){ const [x,y]=a.buraco; g.mapa=f.mapa.map((r,j)=>j===y?r.slice(0,x)+'#'+r.slice(x+1):r); }
  if(a.tiraMureta){ g.muretas=(f.muretas||[]).filter(m=>m.join()!==a.tiraMureta.join()); if(!g.muretas.length) delete g.muretas; }
  if(a.tira) g.pecas=f.pecas.filter(p=>!(p[0]===a.tira[0]&&p[1]===a.tira[1]&&p[2]===a.tira[2]));
  if(a.semMeta){ const os=(f.objs||[f.obj]).filter(o=>!(a.semMeta in o)); delete g.obj; delete g.objs; if(os.length===1) g.obj=os[0]; else g.objs=os; }
  return g; }
if(refaz) for(const [a,b] of nomes.ORDEM||[]){ const ia=escolhidas.findIndex(e=>e.rec.id===a), ib=escolhidas.findIndex(e=>e.rec.id===b);
  const ca=escolhidas[ia].c; escolhidas[ia].c=escolhidas[ib].c; escolhidas[ib].c=ca; console.log(`trocadas de lugar: ${a} e ${b}`); }
if(escreve){
  if(escolhidas.length!==RECEITAS.length){ console.log(`não gravei: ${escolhidas.length} de ${RECEITAS.length} vagas`); process.exit(1); }
  const js=o=>JSON.stringify(o).replace(/"([a-zA-Z]+)":/g,'$1:').replace(/"/g,"'");
  const ids=escolhidas.map(({c})=>idFase(c.f));
  const linhas=escolhidas.map(({rec,c},i)=>{ const f=c.f;
    const o={id:ids[i], g:rec.g, nome:NOMES[rec.id]||rec.id, mapa:f.mapa, pecas:f.pecas, regras:{spawns:0}};
    if(f.objs) o.objs=f.objs; else o.obj=f.obj;
    o.arrastos=c.m.min+4;
    for(const k of ['muretas','carroPos','presasPos','alvosPos','terraPos','char','fase']) if(f[k]!=null) o[k]=f[k];
    o.min=c.m.min;
    return '  '+js(o)+','; });
  // migração: a fase da versão 1 que continua (mesmo id) vai para o número novo; a que saiu aponta (negativo) para o
  // ponto equivalente: o mesmo mundo, na mesma altura dele
  const porVaga=g=>escolhidas.map((e,i)=>({e,i})).filter(x=>x.e.rec.g===g).map(x=>x.i+1);
  const antiga=V1.map(v=>{ const k=ids.indexOf(v.id); if(k>=0) return k+1;
    const nv=porVaga(mundoNovo(v.g)), s=V1.filter(x=>x.g===v.g).findIndex(x=>x.n===v.n), tot=V1.filter(x=>x.g===v.g).length;
    return -nv[Math.min(nv.length-1, Math.floor(s*nv.length/tot))]; });
  let atual=-1; const corpo=[];
  escolhidas.forEach(({rec},i)=>{ if(rec.g!==atual){ atual=rec.g; corpo.push(`  // ${rec.g+1} · ${MUNDOS[rec.g].nome}`); } corpo.push(linhas[i]); });
  const txt=`// Jornada de quebra-cabeças: não nasce peça nova, então cada fase é sobre a ordem certa dos arrastos.
// Versão 2 (2026-11-12): 11 mundos de 10 fases. As 10 primeiras ensinam (menor solução de 2 a 6, quase sem armadilha);
// a armadilha (arrastos que parecem certos e não são) só passa de 40% lá pela fase 28; cada mundo estreia a mecânica sem
// armadilha, um degrau abaixo do fim do anterior, e o nível sobe de mundo para mundo. O mundo 2 é dos formatos de
// tabuleiro ('#': casa que não existe), que voltam em pelo menos um terço das fases dos outros mundos.
// Gerado por testes/calibrar/quebra_gera.mjs (receitas e curva em quebra_receitas.mjs, formatos em quebra_formas.mjs,
// escolha em quebra_monta.mjs, nomes em quebra_nomes.mjs); medidas e uma solução mínima de cada fase em
// testes/calibrar/quebra_medidas.json; conferido no jogo por testes/quebra_fases.html. arrastos = min + 4; as estrelas
// seguem a regra do modo (src/quebra.js). id: o mesmo enquanto a fase for a mesma (quebra_id.mjs); o progresso fica por
// número de fase, e a migração da versão 1 usa QJ_ANTIGA.
// Mesmo formato das fases de src/missoes.js (obj ou objs), mais id, g (mundo), nome e min. Mapa: '.' casa, '#' buraco,
// 'B' estação, 'L' lixo ('2' racha com duas junções). Peças: [x, y, nível, aura?].
const QJ_MUNDOS=[
${MUNDOS.map(m=>`  ${js(m)},`).join('\n')}
];
const QJ_FASES=[
${corpo.join('\n')}
];
// migração do progresso da versão 1 (110 fases em 10 mundos de 11, até 2026-11-11): QJ_ANTIGA[n-1] é a fase nova da
// fase n antiga. Positivo: a mesma fase (as estrelas vão junto). Negativo: a fase nova no ponto equivalente.
const QJ_ANTIGA=[${antiga.join(',')}];
`;
  fs.writeFileSync(ARQ, txt);
  console.log(`gravado src/quebra_fases.js (${escolhidas.length} fases; da versão 1 continuam ${antiga.filter(x=>x>0).length})`);
}
