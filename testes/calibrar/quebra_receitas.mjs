// Receitas do gerador (quebra_gera.mjs): uma por vaga da Jornada de quebra-cabeças (10 mundos de 11 fases).
// Cada uma sorteia tabuleiros de um tipo (spec, o que QM.sorteia de quebra_medidor.js entende) e aceita os que caem na
// faixa de menor solução (prof) e passam no filtro da vaga. A dificuldade sobe dentro do mundo: a faixa de min vai de
// 3-5 a 13-16 e o filtro aperta (mais armadilha, guloso não cumpre). quebra_monta.mjs escolhe um candidato por vaga.
const R=[];
// faixa de min e filtro por vaga (0 a 10); o fim do mundo fica mais longo nos mundos de depois
const FAIXA=g=>[[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,14],[g<3?12:13,g<3?14:16]];
const FILTRO=(g,i)=> i<2 ? {maxGuloso:g===0?1:.6, maxSols:60}
  : i<4 ? {maxGuloso:.3, minArm:.1, maxSols:40}
  : i<7 ? {maxGuloso:.1, minArm:.2, maxSols:30}
  : i<9 ? {maxGuloso:.04, minArm:.3, maxSols:24}
  : {maxGuloso:.02, minArm:.38, maxSols:24};
const mundo=(g, vagas)=>vagas.forEach((spec,i)=>R.push({id:`m${g+1}v${String(i+1).padStart(2,'0')}`, g, vaga:i, prof:spec.prof||FAIXA(g)[i],
  spec:{w:4,h:4,pecas:[3,6],...spec}, filtro:{...FILTRO(g,i),...(spec.filtro||{})}, quantos:spec.quantos||8}));
const forme=(t,n=1)=>({metas:[{forme:t,n}], material:Array(n).fill(t)});

// 1 · Juntar: só peças (no fim, tabuleiros com buracos)
mundo(0,[
  {w:3,h:3, ...forme(4), pecas:[3,3], prof:[3,3]},
  {w:3,h:3, ...forme(4), pecas:[4,5]},
  {...forme(5), pecas:[4,6]},
  {...forme(4,2), pecas:[4,6]},
  {w:3,h:3, ...forme(5), pecas:[4,6]},
  {metas:[{forme:5,n:1},{combo:1}], material:[5], pecas:[5,7]},
  {...forme(4,2), proibido:5, pecas:[5,7]},
  {buracos:2, ...forme(5), pecas:[4,6], iscas:[0,2]},
  {w:4,h:3, ...forme(5), pecas:[5,7], prof:[10,12]},
  {...forme(6), pecas:[5,8]},
  {w:5,h:5, buracos:5, ...forme(6), pecas:[5,7]},
]);
// 2 · Estações: o bloco que não sai
mundo(1,[
  {blocos:1, ...forme(4), pecas:[3,4]},
  {w:3,h:3, blocos:1, ...forme(4), pecas:[3,5]},
  {blocos:2, ...forme(5), pecas:[4,6]},
  {w:5,h:5, blocos:3, ...forme(5), pecas:[4,6]},
  {blocos:2, ...forme(4,2), pecas:[4,6]},
  {blocos:3, ...forme(5), pecas:[4,6], iscas:[1,2]},
  {w:3,h:3, blocos:1, ...forme(5), pecas:[4,6]},
  {blocos:2, ...forme(4,2), proibido:5, pecas:[5,7]},
  {blocos:2, ...forme(6), pecas:[5,8]},
  {blocos:3, ...forme(5), pecas:[5,6], iscas:[1,2]},
  {blocos:4, ...forme(6), pecas:[5,7]},
]);
// 3 · Fluxos de rochas: muretas entre as casas
mundo(2,[
  {muretas:2, ...forme(4), pecas:[3,4]},
  {w:3,h:3, muretas:2, ...forme(4), pecas:[3,5]},
  {muretas:3, ...forme(5), pecas:[4,6]},
  {muretas:4, blocos:1, ...forme(5), pecas:[4,6]},
  {w:3,h:3, muretas:3, ...forme(5), pecas:[4,6]},
  {muretas:5, ...forme(4,2), pecas:[4,6]},
  {w:5,h:5, muretas:6, ...forme(5), pecas:[4,6]},
  {muretas:4, blocos:1, metas:[{combo:1}], material:[3,3], pecas:[4,6], iscas:[0,1]},
  {muretas:6, ...forme(6), pecas:[5,7]},
  {w:3,h:3, muretas:4, ...forme(5), pecas:[5,6]},
  {w:5,h:5, muretas:5, blocos:2, ...forme(6), pecas:[5,7]},
]);
// 4 · Órbitas: levar exatamente o planeta pedido até a órbita (misturado com estações e fluxos)
mundo(3,[
  {metas:[{leve:3,n:1}], material:[3], pecas:[2,3]},
  {w:3,h:3, metas:[{leve:4,n:1}], material:[4], pecas:[3,5]},
  {blocos:1, metas:[{leve:4,n:1}], material:[4], pecas:[3,5]},
  {muretas:3, metas:[{leve:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{leve:5,n:1}], material:[5], pecas:[4,6]},
  {w:3,h:3, muretas:2, metas:[{leve:4,n:1}], material:[4], pecas:[4,5]},
  {w:5,h:5, blocos:2, metas:[{leve:5,n:1}], material:[5], pecas:[4,6]},
  {metas:[{leve:3,n:1},{leve:4,n:1}], material:[3,4], pecas:[4,6]},
  {metas:[{leve:4,n:1}], proibido:5, material:[4], pecas:[4,6], iscas:[1,2], nivelIsca:[2,3]},
  {blocos:2, muretas:2, metas:[{leve:5,n:1}], material:[5], pecas:[4,6]},
  {w:5,h:5, buracos:3, muretas:3, metas:[{leve:5,n:1}], material:[5], pecas:[5,7]},
]);
// 5 · Naves: levar até a nave, que recolhe (com órbitas, estações e fluxos)
mundo(4,[
  {metas:[{carrinho:3,n:1}], material:[3], pecas:[2,3]},
  {w:3,h:3, metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5]},
  {blocos:1, metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5]},
  {muretas:3, metas:[{carrinho:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{carrinho:3,n:2}], material:[3,3], pecas:[4,6]},
  {metas:[{leve:3,n:1},{carrinho:4,n:1}], material:[3,4], pecas:[4,6]},
  {w:3,h:3, metas:[{carrinho:5,n:1}], material:[5], pecas:[4,6]},
  {blocos:2, metas:[{carrinho:5,n:1}], material:[5], pecas:[4,6]},
  {metas:[{carrinho:4,n:1}], proibido:5, material:[4], pecas:[4,6], iscas:[1,2], nivelIsca:[2,3]},
  {blocos:1, muretas:3, metas:[{carrinho:5,n:1}], material:[5], pecas:[4,6]},
  {muretas:3, metas:[{carrinho:4,n:2}], material:[4,4], pecas:[5,7], prof:[12,15], filtro:{minArm:.3}},
]);
// 6 · Lixo espacial: racha com junção ao lado (com naves, órbitas, fluxos; o Passinho estreia)
mundo(5,[
  {lixos:1, metas:[{rache:1}], material:[2], pecas:[2,3], iscas:[0,1]},
  {lixos:2, metas:[{rache:2}], material:[2,2], pecas:[4,5]},
  {w:3,h:3, lixos:1, metas:[{rache:1},{forme:4,n:1}], material:[4], pecas:[3,5]},
  {lixos:1, lixoHp:2, metas:[{rache:1}], material:[3], pecas:[3,5], iscas:[0,1]},
  {lixos:1, metas:[{rache:1},{leve:3,n:1}], material:[3], pecas:[3,5], iscas:[0,1]},
  {passinho:true, filtro:{maxSols:120}, lixos:2, metas:[{rache:2}], material:[2,2], pecas:[4,5]},
  {lixos:1, metas:[{rache:1},{carrinho:4,n:1}], material:[4], pecas:[4,6]},
  {lixos:2, muretas:3, metas:[{rache:2}], material:[3], pecas:[4,6], iscas:[0,1]},
  {w:5,h:5, lixos:3, blocos:1, metas:[{rache:3}], material:[3,2], pecas:[5,7]},
  {lixos:2, metas:[{rache:2},{forme:5,n:1}], material:[5], pecas:[5,7]},
  {lixos:2, lixoHp:[2,1], metas:[{rache:2},{carrinho:4,n:1}], material:[4], pecas:[4,6], iscas:[0,1]},
]);
// 7 · Nebulosas: desfazer a nuvem juntando em cima (com lixo, naves, órbitas, Passinho)
mundo(6,[
  {metas:[{terra:1}], material:[2], pecas:[2,3], iscas:[0,1]},
  {metas:[{terra:2}], material:[3], pecas:[3,4], iscas:[0,1]},
  {w:3,h:3, metas:[{terra:2}], material:[3], pecas:[3,5], iscas:[0,1]},
  {blocos:1, metas:[{terra:3}], material:[3,2], pecas:[4,6]},
  {metas:[{terra:2},{leve:3,n:1}], material:[3], pecas:[3,5], iscas:[0,2]},
  {muretas:3, metas:[{terra:3}], material:[4], pecas:[4,6]},
  {lixos:1, metas:[{terra:2},{rache:1}], material:[4], pecas:[4,6]},
  {passinho:true, filtro:{maxSols:120}, metas:[{terra:2}], material:[3], pecas:[3,5], iscas:[0,1]},
  {w:5,h:5, blocos:2, metas:[{terra:4}], material:[4,3], pecas:[5,7]},
  {metas:[{terra:2},{carrinho:4,n:1}], material:[4], pecas:[4,6]},
  {metas:[{terra:4}], proibido:5, material:[4,3], pecas:[5,7]},
]);
// 8 · Órbitas, parte 2: formar em cima da órbita (com nebulosa, lixo, a outra órbita, Passinho)
mundo(7,[
  {metas:[{alvo:3,n:1}], material:[3], pecas:[2,4]},
  {w:3,h:3, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5]},
  {blocos:1, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{alvo:4,n:1},{terra:1}], terraNaOrbita:true, material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{alvo:5,n:1}], material:[5], pecas:[4,6]},
  {metas:[{leve:3,n:1},{alvo:4,n:1}], material:[3,4], pecas:[4,6]},
  {muretas:3, metas:[{alvo:4,n:1}], material:[4], pecas:[4,6], iscas:[0,1]},
  {lixos:1, metas:[{alvo:4,n:1},{rache:1}], material:[4], pecas:[4,6], iscas:[0,1]},
  {passinho:true, filtro:{maxSols:120}, metas:[{alvo:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {w:5,h:5, blocos:2, metas:[{alvo:5,n:1}], material:[5], pecas:[5,7]},
  {metas:[{alvo:4,n:2}], material:[4,4], pecas:[5,7]},
]);
// 9 · Planetas presos: soltar juntando um igual com ele (com órbitas, nebulosa, lixo, Passinho)
mundo(8,[
  {metas:[{solte:3,n:1}], material:[3], pecas:[2,3]},
  {w:3,h:3, metas:[{solte:4,n:1}], material:[4], pecas:[3,4]},
  {blocos:1, metas:[{solte:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{solte:3,n:1},{leve:4,n:1}], material:[3,4], pecas:[4,6]},
  {muretas:3, metas:[{solte:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1]},
  {metas:[{solte:3,n:2}], material:[3,3], pecas:[4,6]},
  {metas:[{solte:4,n:1},{terra:2}], material:[4], pecas:[4,6]},
  {passinho:true, filtro:{maxSols:120, minArm:.2, maxGuloso:.1}, metas:[{solte:4,n:1}], material:[4], pecas:[3,5], iscas:[0,1], prof:[9,12]},
  {lixos:1, metas:[{solte:4,n:1},{rache:1}], material:[4], pecas:[4,6], iscas:[0,1]},
  {blocos:2, metas:[{solte:5,n:1}], material:[5], pecas:[4,6]},
  {blocos:1, metas:[{solte:4,n:2}], material:[4,4], pecas:[5,7], prof:[12,16]},
]);
// 10 · Auras: cada aura só junta com a sua cor (com tudo o que veio antes)
const cor=(t,c,n=1)=>({metas:[{cor:c,t,n}], material:Array(n).fill({t,c})});
mundo(9,[
  {cores:true, metas:[{forme:3,n:1}], material:[{t:3,c:0}], pecas:[2,3], iscas:[1,1], nivelIsca:[2,2]},
  {cores:true, ...cor(4,0), pecas:[3,4], iscas:[1,2], nivelIsca:[2,3]},
  {w:3,h:3, cores:true, ...cor(4,1), pecas:[3,5], iscas:[1,2], nivelIsca:[1,3]},
  {cores:true, blocos:1, ...cor(4,0), pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{alvo:4,n:1}], material:[{t:4,c:1}], pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{carrinho:4,n:1}], material:[{t:4,c:0}], pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, metas:[{cor:0,t:4,n:1},{cor:1,t:3,n:1}], material:[{t:4,c:0},{t:3,c:1}], pecas:[4,6], iscas:[0,1]},
  {cores:true, muretas:3, ...cor(5,1), pecas:[4,6], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, lixos:1, metas:[{rache:1},{cor:0,t:4,n:1}], material:[{t:4,c:0}], pecas:[4,6], iscas:[1,2], nivelIsca:[2,3]},
  {cores:true, passinho:true, filtro:{maxSols:120}, ...cor(4,1), pecas:[3,5], iscas:[1,2], nivelIsca:[2,3]},
  {w:5,h:5, cores:true, blocos:2, metas:[{cor:0,t:5,n:1},{terra:2}], material:[{t:5,c:0}], pecas:[5,7], iscas:[1,2], nivelIsca:[2,3]},
]);
export const RECEITAS=R;
