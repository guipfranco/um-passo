// Receitas do gerador (quebra_gera.mjs), versão 2 (2026-11-12): 11 mundos de 10 fases.
// Cada vaga sorteia tabuleiros de um tipo (spec, o que QM.sorteia de quebra_medidor.js entende) e aceita os que caem
// na faixa de menor solução (prof) e de armadilha (minArm..maxArm, a média de arm1..arm3) e passam no filtro.
// A curva (pedido do Guilherme: "travei num dos primeiros, estão muito difíceis logo de começo"):
//   - as 10 primeiras fases ensinam: min de 2 a 6, armadilha de 0 a 20%, o guloso pode resolver as 3 primeiras (e girar
//     o tabuleiro pode resolver o mundo 1 inteiro; nos outros, só as 3 primeiras de cada mundo);
//   - a armadilha só passa de 40% lá pela fase 28;
//   - a primeira fase de cada mundo estreia a mecânica sem armadilha (até 10%), um degrau abaixo do fim do mundo
//     anterior; o nível geral sobe de mundo para mundo (ARM_S1, ARM_FIM, MIN_S1, MIN_FIM).
// Formatos de tabuleiro (quebra_formas.mjs): o mundo 2 é só deles, e eles aparecem em pelo menos um terço das fases
// dos outros mundos. (A versão 1, de 10 mundos de 11 fases, está no histórico do git.)
import {FORMAS} from './quebra_formas.mjs';
const R=[];
//                  1    2    3    4    5    6    7    8    9   10   11
const ARM_S1  =[ .03, .08, .12, .15, .18, .20, .22, .25, .27, .30, .32];   // armadilha da 2ª fase do mundo
const ARM_FIM =[ .18, .35, .50, .55, .60, .62, .66, .70, .72, .75, .80];   // e da última
const MIN_EST =[   2,   3,   3,   3,   3,   3,   3,   3,   3,   3,   3];   // menor solução da estreia
const MIN_S1  =[   2,   4,   4,   5,   5,   5,   6,   6,   6,   6,   7];
const MIN_FIM =[   6,   9,  10,  11,  12,  12,  13,  13,  14,  14,  15];
export function alvo(g,s){
  if(s===0) return {prof:[MIN_EST[g],MIN_EST[g]+1], arm:[0,.15], armAlvo:.03};
  const k=(s-1)/8, a=ARM_S1[g]+(ARM_FIM[g]-ARM_S1[g])*k, m=Math.round(MIN_S1[g]+(MIN_FIM[g]-MIN_S1[g])*k);
  return {prof:[Math.max(2,m-1), m+1], arm:[Math.max(0,a-.12), a+.12], armAlvo:a};
}
// o guloso (o arrasto que mais junta) pode cumprir as 3 primeiras do modo e as estreias; depois cada vez menos
const gulosoMax=(g,s)=> g===0 ? (s<3?1:.6) : [1,.7,.5,.4,.3,.3,.15,.15,.08,.08][s];
// girar o tabuleiro pode resolver o mundo 1 inteiro, as 5 primeiras dos formatos e as 3 primeiras dos outros mundos
const giroOk=(g,s)=> g===0 || (g===1 && s<5) || s<3;
const mundo=(g, vagas)=>vagas.forEach((spec,s)=>{ const a=alvo(g,s), {filtro={},prof,...sp}=spec;
  R.push({id:`m${g+1}v${String(s+1).padStart(2,'0')}`, g, vaga:s, prof:prof||a.prof, armAlvo:a.armAlvo,
    spec:{w:4,h:4,pecas:[3,6],...sp},
    filtro:{minArm:a.arm[0], maxArm:a.arm[1], maxGuloso:gulosoMax(g,s), maxSols:s<3?80:40, pesa:true, giroOk:giroOk(g,s),
      levar:(sp.metas||[]).some(o=>o.leve||o.carrinho) ? (s<3?1:2) : null, ...filtro}, quantos:spec.quantos||8}); });
const forme=(t,n=1)=>({metas:[{forme:t,n}], material:Array(n).fill(t)});
const F=nome=>({formas:FORMAS[nome].mapas, formato:nome});
const cor=(t,c,n=1)=>({metas:[{cor:c,t,n}], material:Array(n).fill({t,c})});
// 4x4 partido ao meio por buracos, com um lixo como única passagem
const PORTAS=[];
for(const c of [1,2]) for(let l=0;l<4;l++){
  const col=[0,1,2,3].map(y=>[0,1,2,3].map(x=>x===c?(y===l?'L':'#'):'.').join(''));
  PORTAS.push(col, [0,1,2,3].map(y=>[0,1,2,3].map(x=>col[x][y]).join(''))); }

// 1 · Juntar: só peças, tabuleiros abertos e pequenos; ensina juntar, a ordem e o "sem formar"
mundo(0,[
  {w:3,h:3, ...forme(3), pecas:[2,3]},
  {w:3,h:3, ...forme(4), pecas:[3,3]},
  {...forme(4), pecas:[3,4]},
  {...forme(3,2), pecas:[4,5]},
  {w:3,h:3, ...forme(4), pecas:[4,5]},
  {...forme(5), pecas:[4,5]},
  {...forme(4,2), pecas:[4,6]},
  {w:3,h:3, ...forme(5), pecas:[4,5]},
  {w:4,h:3, ...forme(5), pecas:[4,6]},
  {...forme(4,2), proibido:5, pecas:[5,6], iscas:[1,1], nivelIsca:[4,4]},
]);
// 2 · Formatos: o tabuleiro muda a ordem dos arrastos
mundo(1,[
  {...F('buraco4'), ...forme(4), pecas:[3,4]},
  {...F('faixa26'), ...forme(4), pecas:[3,5]},
  {...F('L4'), ...forme(5), pecas:[4,5]},
  {...F('anel4'), ...forme(4), pecas:[4,5]},
  {...F('faixa35'), ...forme(5), pecas:[4,6]},
  {...F('escada5'), ...forme(5), pecas:[4,6]},
  {...F('T4'), ...forme(5), pecas:[4,6]},
  {...F('corredor5'), ...forme(5), pecas:[4,6]},
  {...F('torto5'), ...forme(5), pecas:[5,6]},
  {w:5,h:5, buracos:5, formato:'faltando', ...forme(6), pecas:[5,7]},
]);
// 3 · Estações
mundo(2,[
  {blocos:1, ...forme(4), pecas:[3,3]},
  {w:3,h:3, blocos:1, ...forme(4), pecas:[3,5]},
  {...F('faixa26'), blocos:1, ...forme(4), pecas:[3,5]},
  {blocos:2, ...forme(5), pecas:[4,6]},
  {...F('L4'), blocos:1, ...forme(5), pecas:[4,6]},
  {w:5,h:5, blocos:3, metas:[{combo:1}], material:[3,3], pecas:[4,6]},
  {...F('rosca5'), blocos:2, ...forme(5), pecas:[4,6]},
  {blocos:2, ...forme(4,2), pecas:[4,6]},
  {...F('escada5'), blocos:2, ...forme(6), pecas:[5,7]},
  {blocos:2, ...forme(4,2), proibido:5, pecas:[5,6], iscas:[1,1], nivelIsca:[4,4]},
]);
// 4 · Fluxos de rochas
mundo(3,[
  {muretas:2, ...forme(4), pecas:[3,3]},
  {...F('faixa35'), muretas:2, ...forme(4), pecas:[3,5]},
  {muretas:3, ...forme(5), pecas:[4,5]},
  {...F('T4'), muretas:2, ...forme(5), pecas:[4,6]},
  {w:3,h:3, muretas:3, ...forme(5), pecas:[4,6]},
  {...F('U4'), muretas:2, ...forme(5), pecas:[4,6]},
  {w:5,h:5, muretas:5, ...forme(5), pecas:[4,6]},
  {muretas:4, blocos:1, metas:[{combo:1}], material:[3,3], pecas:[4,6], iscas:[0,1]},
  {...F('cruz5'), muretas:4, ...forme(6), pecas:[5,7]},
  {muretas:6, ...forme(6), pecas:[5,7]},
]);
// 5 · Órbitas (levar)
mundo(4,[
  {metas:[{leve:3,n:1}], material:[3], pecas:[2,3], iscas:[1,1], nivelIsca:[1,1]},
  {...F('faixa26'), metas:[{leve:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {blocos:1, metas:[{leve:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {...F('L4'), metas:[{leve:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {muretas:3, metas:[{leve:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {...F('rosca5'), metas:[{leve:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {metas:[{leve:3,n:1},{leve:4,n:1}], material:[3,4], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('escada5'), metas:[{leve:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {blocos:1, muretas:2, metas:[{leve:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {w:5,h:5, buracos:4, formato:'faltando', metas:[{leve:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
]);
// 6 · Naves
mundo(5,[
  // levar (órbita e nave): com a soma exata sobra uma peça só, que só para nos cantos; a Poeira de sobra é o batente
  {naveForaDoCanto:true, metas:[{carrinho:3,n:1}], material:[3], pecas:[2,3], iscas:[1,1], nivelIsca:[1,1]},
  {...F('faixa35'), naveForaDoCanto:true, metas:[{carrinho:4,n:1}], material:[4], pecas:[3,4], iscas:[1,1], nivelIsca:[1,1]},
  {blocos:1, naveForaDoCanto:true, metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {...F('U4'), metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {metas:[{carrinho:3,n:2}], material:[3,3], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('corredor5'), metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5], iscas:[1,1], nivelIsca:[1,1]},
  {metas:[{leve:3,n:1},{carrinho:4,n:1}], material:[3,4], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('T4'), metas:[{carrinho:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {muretas:3, metas:[{carrinho:5,n:1}], material:[5], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('torto5'), metas:[{carrinho:4,n:2}], material:[4,4], pecas:[5,7], iscas:[1,1], nivelIsca:[1,1]},
]);
// 7 · Lixo espacial (o Passinho estreia aqui)
mundo(6,[
  {lixos:1, metas:[{rache:1}], material:[2], pecas:[2,3], iscas:[0,1]},
  {lixos:2, metas:[{rache:2}], material:[2,2], pecas:[4,5]},
  {formas:PORTAS, formato:'porta', ...forme(3), pecas:[3,4]},
  {...F('L4'), lixos:1, metas:[{rache:1},{leve:3,n:1}], material:[3], pecas:[3,5], iscas:[0,1]},
  {lixos:1, lixoHp:2, metas:[{rache:1}], material:[3], pecas:[3,5], iscas:[0,1]},
  {passinho:true, lixos:2, metas:[{rache:2}], material:[2,2], pecas:[4,5], filtro:{maxSols:150}},
  {...F('anel4'), lixos:1, ...forme(4), pecas:[4,5]},
  {blocos:1, lixos:1, metas:[{rache:1},{carrinho:4,n:1}], material:[4], pecas:[4,5], iscas:[1,1], nivelIsca:[1,1]},
  {...F('faixa26'), lixos:2, metas:[{rache:2},{forme:4,n:1}], material:[4], pecas:[4,6]},
  {w:5,h:5, lixos:3, blocos:1, metas:[{rache:3}], material:[3,2], pecas:[5,7]},
]);
// 8 · Nebulosas
mundo(7,[
  {metas:[{terra:1}], material:[2], pecas:[2,3], iscas:[0,1]},
  {...F('faixa26'), metas:[{terra:2}], material:[3], pecas:[3,4], iscas:[0,1]},
  {w:3,h:3, metas:[{terra:2}], material:[3], pecas:[3,5], iscas:[0,1]},
  {...F('L4'), metas:[{terra:3}], material:[3,2], pecas:[4,6]},
  {muretas:2, metas:[{terra:2}], material:[3], pecas:[3,4]},
  {metas:[{terra:2},{leve:3,n:1}], material:[3], pecas:[4,5], iscas:[0,1]},
  {...F('escada5'), metas:[{terra:3}], material:[4], pecas:[4,6]},
  {passinho:true, metas:[{terra:2}], material:[3], pecas:[3,5], iscas:[0,1], filtro:{maxSols:150}},
  {...F('rosca5'), lixos:1, metas:[{terra:2},{rache:1}], material:[4], pecas:[4,6]},
  {metas:[{terra:3}], proibido:5, material:[4,4], pecas:[5,7]},
]);
// 9 · Órbitas, parte 2 (formar em cima)
mundo(8,[
  {metas:[{alvo:3,n:1}], material:[3], pecas:[2,4]},
  {w:3,h:3, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5]},
  {...F('T4'), metas:[{alvo:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {blocos:1, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {...F('escada5'), metas:[{alvo:4,n:1},{terra:1}], material:[4], pecas:[4,5]},
  {metas:[{leve:3,n:1},{alvo:4,n:1}], material:[3,4], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('corredor5'), metas:[{alvo:4,n:1}], material:[4], pecas:[4,5]},
  {passinho:true, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1], filtro:{maxSols:150}},
  {w:5,h:5, buracos:4, formato:'faltando', metas:[{alvo:5,n:1}], material:[5], pecas:[5,7]},
  {metas:[{alvo:4,n:2}], material:[4,4], pecas:[5,7]},
]);
// 10 · Planetas presos
mundo(9,[
  {metas:[{solte:3,n:1}], material:[3], pecas:[2,3]},
  {...F('faixa26'), metas:[{solte:3,n:1}], material:[3], pecas:[2,4]},
  {w:3,h:3, metas:[{solte:4,n:1}], material:[4], pecas:[3,4]},
  {...F('L4'), metas:[{solte:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{solte:3,n:1},{leve:4,n:1}], material:[3,4], pecas:[4,6], iscas:[1,1], nivelIsca:[1,1]},
  {...F('rosca5'), metas:[{solte:4,n:1}], material:[4], pecas:[4,6], iscas:[0,1]},
  {metas:[{solte:3,n:2}], material:[3,3], pecas:[4,6]},
  {passinho:true, metas:[{solte:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1], filtro:{maxSols:150}},
  {...F('escada5'), lixos:1, metas:[{solte:4,n:1},{rache:1}], material:[4], pecas:[4,6], iscas:[0,1]},
  {blocos:1, metas:[{solte:4,n:2}], material:[4,4], pecas:[5,7]},
]);
// 11 · Auras
mundo(10,[
  {cores:true, metas:[{forme:3,n:1}], material:[{t:3,c:0}], pecas:[2,3], iscas:[1,1], nivelIsca:[2,2]},
  {...F('faixa26'), cores:true, ...cor(4,0), pecas:[3,4], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, blocos:1, metas:[{combo:1}], material:[{t:3,c:0},{t:3,c:1}], pecas:[4,6], iscas:[0,1], nivelIsca:[1,2]},
  {...F('T4'), cores:true, ...cor(4,1), pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{leve:4,n:1}], material:[{t:4,c:0}], pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{alvo:4,n:1}], material:[{t:4,c:1}], mista:.35, pecas:[4,5], iscas:[1,2], nivelIsca:[2,3]},
  {...F('losango5'), cores:true, ...cor(5,0), pecas:[4,6], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{cor:0,t:4,n:1},{cor:1,t:4,n:1}], material:[{t:4,c:0},{t:4,c:1}], mista:.3, pecas:[5,7]},
  {cores:true, passinho:true, ...cor(4,1), pecas:[3,5], iscas:[1,2], nivelIsca:[2,3], filtro:{maxSols:150}},
  {w:5,h:5, buracos:4, formato:'faltando', cores:true, metas:[{cor:0,t:5,n:1},{terra:2}], material:[{t:5,c:0}], mista:.3, pecas:[5,6], iscas:[2,3], nivelIsca:[2,3]},
]);
export const RECEITAS=R;
