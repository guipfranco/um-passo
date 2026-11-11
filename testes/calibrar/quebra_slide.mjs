// O slide() do jogo no Node: lê de src/jogo.js as funções que o movimento usa (sem copiar nada à mão) e as roda num
// contexto à parte, com W, H e S próprios. Usado por quebra_gera.mjs e quebra_mede.mjs.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import {fileURLToPath} from 'url'; import {createRequire} from 'module';
const AQUI=path.dirname(fileURLToPath(import.meta.url)), RAIZ=path.resolve(AQUI,'..','..');
const require=createRequire(import.meta.url);

function trecho(src, inicio){
  const i=src.indexOf(inicio); if(i<0) throw new Error('não achei em src/jogo.js: '+inicio);
  let d=0, j=i, viu=false;
  for(; j<src.length; j++){ const c=src[j];
    if(c==='{'||c==='('||c==='[') { d++; viu=true; }
    else if(c==='}'||c===')'||c===']'){ d--; if(d===0 && inicio.startsWith('function') && c==='}') return src.slice(i,j+1); }
    else if(c===';' && d===0 && !inicio.startsWith('function')) return src.slice(i,j+1); }
  throw new Error('fim não achado: '+inicio);
}
export function ambiente(){
  const src=fs.readFileSync(path.join(RAIZ,'src','jogo.js'),'utf8');
  const partes=['const inside','const DIRS','const edgeBetween','const corOk','const corJunta','function slideOne(','function slide('].map(p=>trecho(src,p));
  const codigo=`var W=4, H=4, S={walls:[],edges:[],char:'rola'};\n${partes.join('\n')}\n`+
    `globalThis.__env={slide:(t,dx,dy)=>slide(t,dx,dy), ajusta:(w,h,walls,edges,ch)=>{ W=w; H=h; S={walls,edges,char:ch}; }};`;
  const ctx=vm.createContext({}); vm.runInContext(codigo, ctx);
  return ctx.__env;
}
export const QM=require('./quebra_medidor.js');
export const medidor=()=>QM.QuebraMedidor(ambiente());
