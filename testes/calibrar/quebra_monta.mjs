// Monta src/quebra_fases.js a partir dos candidatos do gerador (quebra_gera.mjs): um por vaga, com a dificuldade subindo
// dentro do mundo (min nunca menor que o da fase anterior), preferindo armadilha, solução contraintuitiva, poucas peças
// e guloso que não cumpre. Os quebra-cabeças antigos aproveitados (ANTIGOS) entram na vaga indicada.
//   node testes/calibrar/quebra_monta.mjs <pasta dos candidatos> [--escreve]
// Sem --escreve só mostra a escolha. Depois: node testes/calibrar/quebra_mede.mjs fases --json (medidas e soluções).
// TROCA: vaga -> índice do candidato (na ordem de quebra_ver.mjs --ordem=min) quando a escolha automática não serve.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url';
import {RECEITAS} from './quebra_receitas.mjs';
import {desenha, resumo} from './quebra_ver.mjs';
import {medidor} from './quebra_slide.mjs';
const AQUI=path.dirname(fileURLToPath(import.meta.url)), RAIZ=path.resolve(AQUI,'..','..');
const pasta=process.argv[2]||'E:/tmp/qpool', escreve=process.argv.includes('--escreve');
const {NOMES, ANTIGOS, TROCA, MUNDOS}=await import('./quebra_nomes.mjs');

const ctxQ=vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(RAIZ,'src','quebracabecas.js'),'utf8')+';globalThis.QC=QC;',ctxQ);
const M=medidor();
const pecasDe=f=>f.pecas.length+(f.presasPos?.length||0);
const nota=(c,vaga)=>{ const m=c.m;
  if(vaga===0) return -pecasDe(c.f) - m.sols*.01 + m.arm;   // estreia: simples
  return 2.5*m.arm + (m.exige?1:0) + .5*m.contra - 2*m.guloso - .5*m.acaso - .15*Math.max(0,pecasDe(c.f)-4) - .01*Math.min(m.sols,50) + (c.antigo?.4:0)
    - (vaga<4 ? .5*(m.min-RECEITAS.find(r=>r.id===c.rec).prof[0]) : 0); };   // no começo do mundo, subir devagar
const escolhidas=[];
for(let g=0; g<10; g++){
  let minAnt=0;
  for(const rec of RECEITAS.filter(r=>r.g===g)){
    const arq=path.join(pasta, rec.id+'.json');
    let cands=fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq,'utf8')) : [];
    cands.sort((a,b)=>a.m.min-b.m.min||b.m.arm-a.m.arm);
    if(ANTIGOS[rec.id]){ const a=ANTIGOS[rec.id], q={...ctxQ.QC[a.qc], ...(a.extra||{})}; delete q.arrastos; delete q.estrelas;
      const m=M.analisa(q,{folga:4}); cands.push({rec:rec.id, g, f:q, m, antigo:a.qc}); }
    let c;
    if(TROCA[rec.id]!=null) c = typeof TROCA[rec.id]==='number' ? cands[TROCA[rec.id]] : cands.find(x=>x.antigo===TROCA[rec.id]);
    else { const ok=cands.filter(x=>x.m.min>=minAnt); const lista=(ok.length?ok:cands).slice().sort((a,b)=>nota(b,rec.vaga)-nota(a,rec.vaga)); c=lista[0]; }
    const ant=cands.find(x=>x.antigo); if(ant) console.log(`   antigo ${ant.antigo} na vaga ${rec.id}: nota ${nota(ant,rec.vaga).toFixed(2)} contra ${nota(c,rec.vaga).toFixed(2)} da escolhida | ${resumo(ant.m)} pecas ${pecasDe(ant.f)}`);
    if(!c){ console.log(`${rec.id}: SEM CANDIDATO`); continue; }
    minAnt=Math.max(minAnt,c.m.min);
    escolhidas.push({rec, c});
    console.log(`${rec.id} ${c.antigo?'(antigo '+c.antigo+') ':''}${NOMES[rec.id]||'?'} | ${resumo(c.m)} pecas ${pecasDe(c.f)} ${JSON.stringify(c.f.obj||c.f.objs)}${c.f.char?' passinho':''}`);
    for(const l of desenha(c.f)) console.log('      '+l);
  }
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
