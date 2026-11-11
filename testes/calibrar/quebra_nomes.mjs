// Nomes das fases e dos mundos da Jornada de quebra-cabeças, os quebra-cabeças antigos aproveitados e as trocas
// manuais da escolha automática (usados por quebra_monta.mjs).
export const MUNDOS=[
  {nome:'Juntar',            desc:'Sem peça nova: a ordem das junções decide.',          tema:1},
  {nome:'Estações',          desc:'O bloco que não sai do lugar muda o caminho.',          tema:2},
  {nome:'Fluxos de rochas',  desc:'Rochas entre as casas: as peças param nelas.',          tema:3},
  {nome:'Órbitas',           desc:'Levar o planeta pedido até a órbita dourada.',          tema:8},
  {nome:'Naves',             desc:'Levar planetas até a nave, que os recolhe.',            tema:5},
  {nome:'Lixo espacial',     desc:'O lixo racha com uma junção ao lado.',                  tema:7},
  {nome:'Nebulosas',         desc:'Desfazer a nuvem juntando em cima dela.',               tema:4},
  {nome:'Órbitas, parte 2',  desc:'Formar o planeta em cima da órbita.',                   tema:8},
  {nome:'Planetas presos',   desc:'Soltar o planeta preso juntando um igual com ele.',     tema:4},
  {nome:'Auras',             desc:'Cada aura só junta com a sua cor.',                     tema:6},
];
// vaga -> quebra-cabeça de src/quebracabecas.js que concorre a ela com os sorteados (extra: o que a fase da Jornada
// acrescenta). q7 (buraco negro) e q8 (Passinho, fora da Jornada) não têm vaga: a Jornada de quebra-cabeças não tem picareta.
export const ANTIGOS={
  m1v02:{qc:'q1'}, m1v03:{qc:'q9'}, m2v03:{qc:'q2'}, m2v04:{qc:'q10'}, m3v03:{qc:'q3'}, m3v04:{qc:'q11'},
  m4v02:{qc:'q12'}, m4v03:{qc:'q13'}, m5v04:{qc:'q5'}, m5v05:{qc:'q14'}, m6v03:{qc:'q15'}, m7v05:{qc:'q16'}, m7v06:{qc:'q17'},
  m8v03:{qc:'q18'}, m9v04:{qc:'q4'}, m9v05:{qc:'q19', extra:{char:'passinho'}}, m10v03:{qc:'q20', extra:{fase:'cores'}}, m10v04:{qc:'q6', extra:{fase:'cores'}},
};
// vaga -> escolha manual: número = candidato (na ordem de quebra_ver.mjs: min, depois armadilha); texto = antigo.
// Ficaram 5 dos 20 antigos (q3, q5, q6, q16 e q17: armadilha alta, guloso não cumpre); os outros perderam para os
// sorteados por não terem armadilha nos primeiros arrastos (q1, q2, q4, q10, q11, q12, q14, q19), por o guloso cumprir
// (q13, q15, q18) ou por peças demais para o que pedem (q9, q20). q7 e q8 não têm vaga.
export const TROCA={m1v02:1, m3v03:'q3', m5v04:'q5', m7v05:'q16', m7v06:'q17', m10v04:'q6'};
export const NOMES={
  m1v01:'Primeira junção', m1v02:'Poeira primeiro', m1v03:'Primeiro cometa', m1v04:'Dois asteroides', m1v05:'Cometa no aperto',
  m1v06:'Duas de uma vez', m1v07:'Dois, sem cometa', m1v08:'Buracos no caminho', m1v09:'Tabuleiro deitado', m1v10:'Primeiro Plutão',
  m1v11:'Plutão entre buracos',
  m2v01:'Primeira estação', m2v02:'Estação na beirada', m2v03:'Duas estações', m2v04:'Cometa no salão', m2v05:'Par de asteroides',
  m2v06:'Três estações', m2v07:'Estação no 3x3', m2v08:'Sem cometa entre estações', m2v09:'Plutão entre estações',
  m2v10:'Labirinto de estações', m2v11:'Quatro estações',
  m3v01:'Primeiro fluxo', m3v02:'Fluxo apertado', m3v03:'Rochas no caminho', m3v04:'Fluxo e estação', m3v05:'Cometa entre rochas',
  m3v06:'Dois asteroides no fluxo', m3v07:'Corredores', m3v08:'Duas de uma vez no fluxo', m3v09:'Plutão no fluxo',
  m3v10:'Labirinto pequeno', m3v11:'Grande labirinto',
  m4v01:'Primeira órbita', m4v02:'Órbita no canto', m4v03:'Órbita e estação', m4v04:'Órbita atrás do fluxo', m4v05:'Cometa na órbita',
  m4v06:'Órbita fechada', m4v07:'Órbita longe', m4v08:'Duas órbitas', m4v09:'Órbita sem cometa', m4v10:'Cometa entre estações',
  m4v11:'Viagem longa',
  m5v01:'Primeira nave', m5v02:'Nave no canto', m5v03:'Nave ao lado da estação', m5v04:'Asteroide para a nave',
  m5v05:'Duas rochas na nave', m5v06:'Órbita e nave', m5v07:'Cometa na nave', m5v08:'Nave entre estações', m5v09:'Nave sem cometa',
  m5v10:'Rota da nave', m5v11:'Dois asteroides a bordo',
  m6v01:'Primeiro lixo', m6v02:'Dois lixos', m6v03:'Lixo e asteroide', m6v04:'Lixo duro', m6v05:'Lixo e órbita',
  m6v06:'Passinho no lixo', m6v07:'Lixo e nave', m6v08:'Lixo atrás do fluxo', m6v09:'Três lixos', m6v10:'Cometa entre lixos',
  m6v11:'Lixo no caminho da nave',
  m7v01:'Primeira nebulosa', m7v02:'Duas nebulosas', m7v03:'Poeira na nuvem', m7v04:'Nebulosa e estação', m7v05:'Três nuvens',
  m7v06:'Nuvens entre estações', m7v07:'Nebulosa e lixo', m7v08:'Passinho na nebulosa', m7v09:'Nebulosa grande',
  m7v10:'Nave na nebulosa', m7v11:'Nuvem sem cometa',
  m8v01:'Formar na órbita', m8v02:'Asteroide na órbita', m8v03:'Órbita ao lado da estação', m8v04:'Órbita na nuvem',
  m8v05:'Formar o cometa', m8v06:'Uma leva, outra forma', m8v07:'Órbita no fluxo', m8v08:'Formar perto do lixo',
  m8v09:'Passinho na órbita', m8v10:'Órbita distante', m8v11:'Duas órbitas para formar',
  m9v01:'Primeiro preso', m9v02:'Preso no alto', m9v03:'Preso e estação', m9v04:'Solta e leva', m9v05:'Preso atrás do fluxo',
  m9v06:'Dois presos', m9v07:'Preso na nebulosa', m9v08:'Passinho e o preso', m9v09:'Preso e lixo', m9v10:'Cometa preso',
  m9v11:'Dois asteroides presos',
  m10v01:'Primeira aura', m10v02:'Asteroide roxo', m10v03:'Asteroide verde', m10v04:'Cometa de qualquer cor',
  m10v05:'Órbita com auras', m10v06:'Nave com auras', m10v07:'Uma de cada cor', m10v08:'Cometa verde', m10v09:'Lixo com auras',
  m10v10:'Passinho com auras', m10v11:'Cometa roxo na nebulosa',
};
