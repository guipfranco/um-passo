// Mede quebra-cabeças no Node com o slide() de src/jogo.js e o medidor (quebra_medidor.js).
//   node testes/calibrar/quebra_mede.mjs qc              os 20 de src/quebracabecas.js (limite: menor + 4)
//   node testes/calibrar/quebra_mede.mjs fases [de-ate]  os de src/quebra_fases.js, conferindo min e a solução guardada
//   node testes/calibrar/quebra_mede.mjs fases --json    e grava testes/calibrar/quebra_medidas.json
// Em cada fase também o que pesa (pesos/falhas do medidor; "!!" marca o que falta: proibido ou meta de graça, mecânica
// de enfeite, levar barato, girar resolve, peça que não faz nada) e material repetido dentro do mundo.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url';
import {medidor} from './quebra_slide.mjs';
const AQUI=path.dirname(fileURLToPath(import.meta.url)), RAIZ=path.resolve(AQUI,'..','..');
const M=medidor();
const le=(arq,nomes)=>{ const ctx=vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(RAIZ,'src',arq),'utf8')+`\n;globalThis.__r={${nomes.map(n=>`${n}:typeof ${n}!=='undefined'?${n}:null`).join(',')}};`, ctx); return ctx.__r; };
const pct=v=>v==null?'  -':String(Math.round(v*100)).padStart(3)+'%';
const linha=(id,m)=>m.problemas?`${id}: PROBLEMA ${m.problemas.join('; ')}`:m.estourou?`${id}: estourou (${m.estados} estados até ${m.ate})`:m.min==null?`${id}: sem solução`:
  `${id.padEnd(5)} min ${String(m.min).padStart(2)} sols ${String(m.sols).padStart(5)} prim ${m.prim} arm ${pct(m.arm1)}${pct(m.arm2)}${pct(m.arm3)} fora1 ${pct(m.fora1)} contra ${pct(m.contra)} (rec ${pct(m.recusa)} sep ${pct(m.separa)}) guloso ${pct(m.guloso)} acaso ${pct(m.acaso)} estados ${m.estados} sol ${m.sol}`;
const modo=process.argv[2]||'qc';
if(modo==='qc'){
  const {QC}=le('quebracabecas.js',['QC']);
  for(const [id,q] of Object.entries(QC)){ const t0=Date.now(); const m=M.analisa(q,{folga:4}); console.log(linha(id,m), `${Date.now()-t0}ms`); }
} else {
  const {QJ_FASES,QJ_MUNDOS}=le('quebra_fases.js',['QJ_FASES','QJ_MUNDOS']);
  const fx=process.argv.find(a=>/^\d+-\d+$/.test(a)), [de,ate]=fx?fx.split('-').map(Number):[1,QJ_FASES.length];
  const ant=fs.existsSync(path.join(AQUI,'quebra_medidas.json')) ? JSON.parse(fs.readFileSync(path.join(AQUI,'quebra_medidas.json'),'utf8')) : null;
  const saida=[]; let erros=0, avisos=0;
  const material=f=>JSON.stringify([f.pecas.map(p=>p[2]+(p[3]!=null?'c'+p[3]:'')).sort(), (f.objs||[f.obj]).map(o=>Object.keys(o).join())]);
  for(let i=de-1;i<ate;i++){ const f=QJ_FASES[i], m=M.analisa(f,{folga:f.arrastos-f.min}), id=String(i+1);
    const vaga=QJ_FASES.slice(0,i).filter(q=>q.g===f.g).length, p=M.pesos(f,{L:f.arrastos});
    const fal=M.falhas(p,{levar:vaga>=3?2:null, giroOk:vaga<3});   // girar resolver só vale nas três primeiras do mundo
    // repetida: mesmo material e mesma meta que outra fase do mundo, ou que a fase anterior
    const meta=q=>JSON.stringify(q.objs||[q.obj]);
    const igual=QJ_FASES.findIndex((q,j)=>j!==i && q.g===f.g && material(q)===material(f) && meta(q)===meta(f)); if(igual>=0) fal.push('mesmo material e meta da fase '+(igual+1));
    const prob=[]; if(m.min!==f.min) prob.push(`min ${m.min} ≠ ${f.min}`); if(f.arrastos!==f.min+4) prob.push('arrastos ≠ min+4');
    const c=M.confere(f,m.sol||''); if(c.cumpriu!==m.min) prob.push('solução não confere');
    const g=ant?.fases?.[i]; if(g && g.sol){ const c2=M.confere(f,g.sol); if(c2.cumpriu!==f.min) prob.push('solução guardada não confere'); }
    erros+=prob.length>0;
    console.log(`${linha(id,m)} [${QJ_MUNDOS[f.g].nome}] ${f.nome}${prob.length?'  <<< '+prob.join(', '):''}${fal.length?'  !! '+fal.join('; '):''}`);
    avisos+=fal.length>0;
    saida.push({n:i+1, g:f.g, nome:f.nome, ...m, pesos:p, falhas:fal}); }
  // resumo por mundo
  const por={}; for(const s of saida){ (por[s.g]||(por[s.g]=[])).push(s); }
  for(const [g,a] of Object.entries(por)){ const med=k=>a.reduce((x,s)=>x+(s[k]||0),0)/a.length;
    console.log(`mundo ${+g+1} ${QJ_MUNDOS[g].nome}: ${a.length} fases, min ${a.map(s=>s.min).join(' ')} (média ${med('min').toFixed(1)}), arm média ${pct(med('arm'))}, guloso médio ${pct(med('guloso'))}, contra médio ${pct(med('contra'))}`); }
  if(process.argv.includes('--json')){
    const fases=saida.map(s=>({n:s.n, g:s.g, nome:s.nome, min:s.min, sols:s.sols, prim:s.prim, arm1:+s.arm1.toFixed(3), arm2:+s.arm2.toFixed(3), arm3:+s.arm3.toFixed(3),
      fora1:+s.fora1.toFixed(3), contra:+s.contra.toFixed(3), recusa:+s.recusa.toFixed(3), separa:+s.separa.toFixed(3), exige:s.exige, guloso:+s.guloso.toFixed(3), acaso:+s.acaso.toFixed(3), estados:s.estados, sol:s.sol,
      levar:s.pesos.levar, giro:s.pesos.giro, inuteis:s.pesos.inuteis.length, passinho:s.pesos.passinho, falhas:s.falhas}));
    fs.writeFileSync(path.join(AQUI,'quebra_medidas.json'), JSON.stringify({
      sobre:'Medidas das fases de src/quebra_fases.js (testes/calibrar/quebra_medidor.js; node testes/calibrar/quebra_mede.mjs fases --json). Direções: D direita, E esquerda, B baixo, C cima. arm1..3: fração das sequências de 1 a 3 arrastos sem saída dentro do limite (min+4); fora1: dos primeiros arrastos, os que perdem a solução mínima; contra: das soluções mínimas, as que têm arrasto contraintuitivo (recusa: juntar menos do que dava; separa: afastar duas iguais prontas); guloso e acaso: fração das partidas desses jogadores que cumprem dentro do limite; levar: arrastos que custa levar à órbita ou à nave além de só formar; giro: padrões fixos de arrastar que cumprem com min arrastos; inuteis: peças que dá para tirar sem mudar nada; passinho: menor solução no Passinho com o mesmo limite (null: não cumpre); falhas: o que o medidor aponta (vazio: nada).',
      fases}, null, 0).replace(/\},\{/g,'},\n{'));
    console.log('gravado quebra_medidas.json'); }
  if(avisos) console.log(`${avisos} fase(s) com aviso (!!)`);
  if(erros){ console.log(`${erros} fase(s) com problema`); process.exitCode=1; }
}
