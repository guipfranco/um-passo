// Mostra candidatos do gerador (ou fases prontas) em texto: tabuleiro e medidas.
//   node testes/calibrar/quebra_ver.mjs <pasta> [receita...] [--ordem=arm|min] [--top=N]
// Desenho: número = nível da peça (a = 10); letras depois do número: r roxa, v verde, m mista; * presa.
// Casas: # buraco, B estação, L lixo (L2: racha com duas junções), o órbita, n nave, ~ nebulosa. Muretas: | entre colunas, - entre linhas.
import fs from 'fs'; import path from 'path';
export function desenha(f){
  const h=f.mapa.length, w=f.mapa[0].length, lin=[];
  const objs=f.objs||[f.obj], al=[...(f.alvosPos||[])]; for(const o of objs) if(o.pos) al.push(...o.pos);
  const cel=(x,y)=>{ const ch=f.mapa[y][x]; if(ch!=='.') return (/[23]/.test(ch)?'L'+ch+' ':ch+'  ').slice(0,3);
    const p=(f.pecas||[]).find(q=>q[0]===x&&q[1]===y); const pr=(f.presasPos||[]).some(q=>q[0]===x&&q[1]===y);
    let s=''; if(p) s=p[2].toString(36)+(p[3]!=null?'rvm'[p[3]]:''); else if(pr) s=objs.find(o=>o.solte).solte.toString(36)+'*';
    let m=''; if(al.some(q=>q[0]===x&&q[1]===y)) m='o'; if(f.carroPos&&f.carroPos[0]===x&&f.carroPos[1]===y) m='n'; if((f.terraPos||[]).some(q=>q[0]===x&&q[1]===y)) m+='~';
    return (s||'.')+m+'   '; };
  const mv=(x,y)=>(f.muretas||[]).some(([d,a,b])=>d==='v'&&a===x&&b===y), mh=(x,y)=>(f.muretas||[]).some(([d,a,b])=>d==='h'&&a===x&&b===y);
  for(let y=0;y<h;y++){ let s=''; for(let x=0;x<w;x++) s+=cel(x,y).slice(0,3)+(mv(x,y)?'|':' '); lin.push(s);
    if(y<h-1){ let t=''; for(let x=0;x<w;x++) t+=(mh(x,y)?'---':'   ')+' '; if(t.trim()) lin.push(t); } }
  return lin;
}
const pct=v=>String(Math.round(v*100)).padStart(3)+'%';
export const resumo=m=>`min ${m.min} sols ${m.sols} prim ${m.prim} arm ${pct(m.arm1)}${pct(m.arm2)}${pct(m.arm3)} fora1 ${pct(m.fora1)} contra ${pct(m.contra)} (r${pct(m.recusa)} s${pct(m.separa)}) gul ${pct(m.guloso)} aca ${pct(m.acaso)} est ${m.estados} ${m.sol}`;
if(process.argv[1] && process.argv[1].endsWith('quebra_ver.mjs')){
  const [pasta,...resto]=process.argv.slice(2), recs=resto.filter(a=>!a.startsWith('--'));
  const ordem=(resto.find(a=>a.startsWith('--ordem='))||'--ordem=min').slice(8), top=+((resto.find(a=>a.startsWith('--top='))||'--top=99').slice(6));
  for(const arq of fs.readdirSync(pasta).filter(a=>a.endsWith('.json')).sort()){
    const id=arq.slice(0,-5); if(recs.length && !recs.some(p=>p.endsWith('*')?id.startsWith(p.slice(0,-1)):p===id)) continue;
    let c=JSON.parse(fs.readFileSync(path.join(pasta,arq),'utf8'));
    c.sort((a,b)=>ordem==='arm'?b.m.arm-a.m.arm:a.m.min-b.m.min||b.m.arm-a.m.arm);
    console.log(`===== ${id} (${c.length})`);
    c.slice(0,top).forEach((x,i)=>{ console.log(`[${id}#${i}] ${resumo(x.m)} pecas ${x.f.pecas.length} ${JSON.stringify(x.f.obj||x.f.objs)}${x.f.char?' '+x.f.char:''}`); for(const l of desenha(x.f)) console.log('    '+l); });
  }
}
