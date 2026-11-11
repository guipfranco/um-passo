// Gerador da Jornada de quebra-cabeças: sorteia tabuleiros pelas receitas de quebra_receitas.mjs, acha a menor solução
// (busca em largura com o slide() de src/jogo.js) e mede os que caem na faixa pedida (quebra_medidor.js).
// Guarda os aprovados em <pasta>/<receita>.json (candidatos; quebra_monta.mjs escolhe e monta src/quebra_fases.js).
//   node testes/calibrar/quebra_gera.mjs <pasta> [receitas separadas por vírgula | prefixo* | revisao] [segundos por receita]
// PARALELO=3 (padrão) processos ao mesmo tempo: a máquina é compartilhada. QUANTOS=n troca quantos candidatos por receita.
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import {medidor, QM} from './quebra_slide.mjs';
import {RECEITAS} from './quebra_receitas.mjs';
const ESTE=fileURLToPath(import.meta.url);

function mulberry(s){ return ()=>{ s=(s+0x6D2B79F5)|0; let q=Math.imul(s^s>>>15,1|s); q=q+Math.imul(q^q>>>7,61|q)^q; return ((q^q>>>14)>>>0)/4294967296; }; }
const chaveFase=f=>JSON.stringify([f.mapa,f.pecas,f.muretas,f.carroPos,f.alvosPos,f.terraPos,f.presasPos,f.obj||f.objs]);

function trabalha({rec, seg, semente, pasta}){
  const M=medidor(), rnd=mulberry(semente), fim=Date.now()+seg*1000, [lo,hi]=rec.prof, F=rec.filtro||{};
  const arq=path.join(pasta, rec.id+'.json');
  const achados=fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq,'utf8')) : [];
  const vistos=new Set(achados.map(a=>chaveFase(a.f)));
  let tent=0, naFaixa=0;
  while(Date.now()<fim && achados.length<(+process.env.QUANTOS||rec.quantos||12)){
    tent++;
    const f=QM.sorteia(rec.spec, rnd); if(!f) continue;
    const k=chaveFase(f); if(vistos.has(k)) continue; vistos.add(k);
    const b=M.buscaMin(f, hi, 250000); if(b.min==null || b.min<lo || b.min>hi) continue;
    naFaixa++;
    const m=M.analisa(f,{folga:4, maxEst:800000}); if(m.estourou || m.min==null) continue;
    if(F.maxSols!=null && m.sols>F.maxSols) continue;
    if(F.maxGuloso!=null && m.guloso>F.maxGuloso) continue;
    if(F.minArm!=null && m.arm<F.minArm) continue;
    if(F.minArm1!=null && m.arm1<F.minArm1) continue;
    if(F.exige && !m.exige) continue;
    if(F.maxAcaso!=null && m.acaso>F.maxAcaso) continue;
    if(F.pesa){ const p=M.pesos(f,{L:m.min+4}); if(M.falhas(p,{levar:F.levar??null, giroOk:!!F.giroOk}).length) continue; m.pesos=p; }
    achados.push({rec:rec.id, g:rec.g, f, m});
    fs.writeFileSync(arq, JSON.stringify(achados));
  }
  return {id:rec.id, tent, naFaixa, achados:achados.length};
}

if(isMainThread){
  const pasta=process.argv[2]||'E:/tmp/qpool'; fs.mkdirSync(pasta,{recursive:true});
  const filtro=process.argv[3], seg=+(process.argv[4]||60);
  // 'revisao' roda só as vagas refeitas na revisão
  const lista=RECEITAS.filter(r=>!filtro || (filtro==='revisao' ? r.revisao : filtro.split(',').some(p=>p.endsWith('*')?r.id.startsWith(p.slice(0,-1)):r.id===p)));
  const P=+(process.env.PARALELO||3); let prox=0, ativos=0; const t0=Date.now();
  await new Promise(fim=>{ const lanca=()=>{ while(ativos<P && prox<lista.length){ const rec=lista[prox++]; ativos++;
      const wk=new Worker(ESTE,{workerData:{rec, seg, semente:(Date.now()^(prox*7919))>>>0, pasta}});
      wk.on('message',r=>console.log(`${r.id}: ${r.achados} candidatos (${r.tent} sorteios, ${r.naFaixa} na faixa) ${Math.round((Date.now()-t0)/1000)}s`));
      wk.on('error',e=>console.log(rec.id+' ERRO '+e.stack));
      wk.on('exit',()=>{ ativos--; if(prox>=lista.length && !ativos) fim(); else lanca(); }); } };
    if(!lista.length) fim(); else lanca(); });
} else parentPort.postMessage(trabalha(workerData));
