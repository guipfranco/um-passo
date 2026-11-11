// Monta src/quebra_fases.js a partir dos candidatos do gerador (quebra_gera.mjs): um por vaga, com a dificuldade subindo
// dentro do mundo (min nunca menor que o da fase anterior), preferindo armadilha, solução contraintuitiva, poucas peças
// e guloso que não cumpre. Os quebra-cabeças antigos (ANTIGOS) concorrem à vaga indicada.
//   node testes/calibrar/quebra_monta.mjs <pasta dos candidatos> [--escreve] [--refaz] [--tudo]
// As fases já gravadas em src/quebra_fases.js ficam como estão. Com --refaz (uma vez só: depois de gravar, as vagas
// já foram refeitas), as vagas de REFAZER (quebra_nomes.mjs) são escolhidas de novo, sem repetir o tabuleiro que
// estava lá. --tudo escolhe todas outra vez.
// Sem --escreve só mostra a escolha. Depois: node testes/calibrar/quebra_mede.mjs fases --json (medidas e soluções).
// TROCA: vaga -> escolha manual: a solução mínima do candidato (como quebra_ver.mjs mostra) ou o antigo ('q3').
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url';
import {RECEITAS} from './quebra_receitas.mjs';
import {desenha, resumo} from './quebra_ver.mjs';
import {medidor} from './quebra_slide.mjs';
const AQUI=path.dirname(fileURLToPath(import.meta.url)), RAIZ=path.resolve(AQUI,'..','..');
const pasta=process.argv[2]||'E:/tmp/qpool', escreve=process.argv.includes('--escreve');
const nomes=await import('./quebra_nomes.mjs'), {NOMES, ANTIGOS, TROCA, MUNDOS, AJUSTES={}}=nomes;
const REFAZER=process.argv.includes('--refaz') ? nomes.REFAZER||[] : [];
const tudo=process.argv.includes('--tudo'), ARQ=path.join(RAIZ,'src','quebra_fases.js');
let atuais=null;
if(!tudo && fs.existsSync(ARQ)){ const c=vm.createContext({}); vm.runInContext(fs.readFileSync(ARQ,'utf8')+';globalThis.Q=QJ_FASES;',c); atuais=c.Q; }
const chaveFase=f=>JSON.stringify([f.mapa,f.pecas,f.muretas,f.carroPos,f.alvosPos,f.terraPos,f.presasPos,f.obj||f.objs,f.char]);
const semExtras=q=>{ const f={...q}; for(const k of ['g','nome','arrastos','estrelas','min']) delete f[k]; return f; };
// material e meta (para não repetir dentro do mundo): os níveis (e auras) das peças e as metas
const material=f=>JSON.stringify([f.pecas.map(p=>p[2]+(p[3]!=null?'c'+p[3]:'')).sort(), f.objs||[f.obj]]);
// ajustes numa fase que fica: tirar uma peça que não faz nada ({tira:[x,y,t]}) ou uma meta que sai de graça ({semMeta:'rache'})
function ajusta(f, a){
  const g={...f};
  if(a.tira) g.pecas=f.pecas.filter(p=>!(p[0]===a.tira[0]&&p[1]===a.tira[1]&&p[2]===a.tira[2]));
  if(a.semMeta){ const os=(f.objs||[f.obj]).filter(o=>!(a.semMeta in o)); delete g.obj; delete g.objs; if(os.length===1) g.obj=os[0]; else g.objs=os; }
  return g; }

const ctxQ=vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(RAIZ,'src','quebracabecas.js'),'utf8')+';globalThis.QC=QC;',ctxQ);
const M=medidor();
const pecasDe=f=>f.pecas.length+(f.presasPos?.length||0);
const nota=(c,vaga)=>{ const m=c.m;
  if(vaga===0) return -pecasDe(c.f) - m.sols*.01 + m.arm;   // estreia: simples
  return 2.5*m.arm + (m.exige?1:0) + .5*m.contra - 2*m.guloso - .5*m.acaso - .15*Math.max(0,pecasDe(c.f)-4) - .01*Math.min(m.sols,50) + (c.antigo?.4:0)
    - (vaga<4 ? .5*(m.min-RECEITAS.find(r=>r.id===c.rec).prof[0]) : 0); };   // no começo do mundo, subir devagar
const escolhidas=[];
for(let g=0; g<10; g++){
  let minAnt=0; const recs=RECEITAS.filter(r=>r.g===g);
  recs.forEach((rec,j)=>{
    const k=RECEITAS.indexOf(rec), atual=atuais?.[k];
    if(atual && !REFAZER.includes(rec.id)){   // fica como está (com o ajuste, se houver)
      let f=semExtras(atual); if(AJUSTES[rec.id]) f=ajusta(f, AJUSTES[rec.id]);
      const c={rec:rec.id, g, f, m:M.analisa(f,{folga:4}), mantida:true};
      if(AJUSTES[rec.id]) console.log(`${rec.id} (AJUSTE ${JSON.stringify(AJUSTES[rec.id])}) ${NOMES[rec.id]} | ${resumo(c.m)}${c.m.min!==atual.min?'  <<< o min mudou de '+atual.min:''}`);
      minAnt=Math.max(minAnt,c.m.min); escolhidas.push({rec,c}); return; }
    const arq=path.join(pasta, rec.id+'.json');
    let cands=fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq,'utf8')) : [];
    cands.sort((a,b)=>a.m.min-b.m.min||b.m.arm-a.m.arm);
    if(ANTIGOS[rec.id] && !rec.revisao){ const a=ANTIGOS[rec.id], q={...ctxQ.QC[a.qc], ...(a.extra||{})}; delete q.arrastos; delete q.estrelas;
      const m=M.analisa(q,{folga:4}); cands.push({rec:rec.id, g, f:q, m, antigo:a.qc}); }
    if(atual){ const fora=chaveFase(semExtras(atual)); cands=cands.filter(x=>chaveFase(x.f)!==fora); }   // a reprovada não volta
    // sem repetir material e meta de outra fase do mesmo mundo (as que ficam e as já escolhidas)
    const doMundo=new Set([...recs.map(r2=>atuais?.[RECEITAS.indexOf(r2)]).filter((a2,j2)=>a2 && j2!==j && !REFAZER.includes(recs[j2].id)).map(a2=>material(semExtras(a2))),
      ...escolhidas.filter(e=>e.rec.g===g).map(e=>material(e.c.f))]);
    cands=cands.filter(x=>!doMundo.has(material(x.f)));
    // teto: a próxima fase que fica (a curva não pode descer)
    let teto=99; for(const r2 of recs.slice(j+1)){ const a2=atuais?.[RECEITAS.indexOf(r2)]; if(a2 && !REFAZER.includes(r2.id)){ teto=a2.min; break; } }
    let c;
    if(TROCA[rec.id]!=null) c = cands.find(x=>x.antigo===TROCA[rec.id] || x.m.sol===TROCA[rec.id]);
    else { const ok=cands.filter(x=>x.m.min>=minAnt && x.m.min<=teto); const lista=(ok.length?ok:cands).slice().sort((a,b)=>nota(b,rec.vaga)-nota(a,rec.vaga)); c=lista[0]; }
    const ant=cands.find(x=>x.antigo); if(ant && c) console.log(`   antigo ${ant.antigo} na vaga ${rec.id}: nota ${nota(ant,rec.vaga).toFixed(2)} contra ${nota(c,rec.vaga).toFixed(2)} da escolhida | ${resumo(ant.m)} pecas ${pecasDe(ant.f)}`);
    if(!c){ console.log(`${rec.id}: SEM CANDIDATO`); return; }
    minAnt=Math.max(minAnt,c.m.min);
    escolhidas.push({rec, c});
    console.log(`${rec.id} ${atual?'(NOVA) ':''}${c.antigo?'(antigo '+c.antigo+') ':''}${NOMES[rec.id]||'?'} | ${resumo(c.m)} pecas ${pecasDe(c.f)} ${JSON.stringify(c.f.obj||c.f.objs)}${c.f.char?' passinho':''}${c.m.pesos?' levar '+c.m.pesos.levar+' passinho '+c.m.pesos.passinho:''}`);
    for(const l of desenha(c.f)) console.log('      '+l);
  });
}
if(escreve){
  const js=o=>JSON.stringify(o).replace(/"([a-zA-Z]+)":/g,'$1:').replace(/"/g,"'");
  const linhas=escolhidas.map(({rec,c})=>{ const f=c.f, nome=NOMES[rec.id]||rec.id;
    const o={g:rec.g, nome, mapa:f.mapa, pecas:f.pecas, regras:{spawns:0}};
    if(f.objs) o.objs=f.objs; else o.obj=f.obj;
    Object.assign(o,{arrastos:c.m.min+4, estrelas:[2,4]});
    for(const k of ['muretas','carroPos','presasPos','alvosPos','terraPos','char','fase']) if(f[k]!=null) o[k]=f[k];
    o.min=c.m.min;
    return '  '+js(o)+','; });
  let atual=-1; const corpo=[];
  escolhidas.forEach(({rec},i)=>{ if(rec.g!==atual){ atual=rec.g; corpo.push(`  // ${rec.g+1} · ${MUNDOS[rec.g].nome}`); } corpo.push(linhas[i]); });
  const txt=`// Jornada de quebra-cabeças: não nasce peça nova, então cada fase é sobre a ordem certa dos arrastos.
// 10 mundos que ensinam as mecânicas da Jornada aos poucos (e as misturam do mundo 4 em diante); dentro de cada mundo a
// menor solução (min) e a armadilha (arrastos que parecem certos e não são) sobem.
// Gerado por testes/calibrar/quebra_gera.mjs (receitas em quebra_receitas.mjs, escolha e nomes em quebra_monta.mjs e
// quebra_nomes.mjs); medidas e uma solução mínima de cada fase em testes/calibrar/quebra_medidas.json; conferido no
// jogo por testes/quebra_fases.html. arrastos = min + 4; estrelas: ★★★ só com a menor solução, ★★ com até 2 a mais.
// Mesmo formato das fases de src/missoes.js (obj ou objs), mais g (mundo), nome e min. Mapa: '.' casa, '#' buraco,
// 'B' estação, 'L' lixo ('2' racha com duas junções). Peças: [x, y, nível, aura?].
const QJ_MUNDOS=[
${MUNDOS.map(m=>`  ${js(m)},`).join('\n')}
];
const QJ_FASES=[
${corpo.join('\n')}
];
`;
  fs.writeFileSync(path.join(RAIZ,'src','quebra_fases.js'), txt);
  console.log(`gravado src/quebra_fases.js (${escolhidas.length} fases)`);
}
