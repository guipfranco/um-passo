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
// vaga -> escolha manual: a solução mínima do candidato (como quebra_ver.mjs mostra) ou o antigo ('q3').
// Dos 20 antigos, 5 entraram na primeira montagem (q3, q5, q6, q16 e q17: armadilha alta, guloso não cumpre); os
// outros perderam para os sorteados por não terem armadilha nos primeiros arrastos (q1, q2, q4, q10, q11, q12, q14, q19),
// por o guloso cumprir (q13, q15, q18) ou por peças demais para o que pedem (q9, q20). q7 e q8 não têm vaga.
// Na revisão saíram q3 (8 peças para 5 arrastos, girar resolve), q16 (terceira "limpe 3 nebulosas" seguida, 8 peças) e
// q6 (girar resolve, guloso cumpre 25%): ficaram q5 e q17.
export const TROCA={m5v04:'q5', m7v06:'q17'};
// vagas escolhidas de novo (com --refaz; as outras ficam como estão em src/quebra_fases.js).
// 1ª rodada dos revisores: as 24 reprovadas (fases 2, 7, 12, 15, 19, 23, 25, 42, 44, 47, 51, 52, 53, 57, 62, 68, 71, 77,
// 81, 84, 102, 104, 106, 110) e 6 que um padrão fixo de girar o tabuleiro cumpria com três estrelas (16, 27, 31, 41, 60,
// 103): m1v02 m1v07 m2v01 m2v04 m2v05 m2v08 m3v01 m3v03 m3v05 m3v09 m4v08 m4v09 m4v11 m5v03 m5v07 m5v08 m5v09 m6v02
// m6v05 m6v07 m7v02 m7v05 m7v11 m8v04 m8v07 m10v03 m10v04 m10v05 m10v07 m10v11.
// 2ª rodada: a 57 (o lixo agia igual a uma estação: nunca precisava rachar) e a 81 (girar em três direções dava ★★★).
export const REFAZER=['m6v02','m8v04'];
// troca de lugar (com --refaz): a 2 nova saiu mais difícil que a 3 (pedido do revisor)
export const ORDEM=[['m1v02','m1v03']];
// ajustes nas que ficam: meta que saía de graça (fases 58 e 108: toda solução mínima já rachava o lixo; o lixo continua
// no caminho) e a Poeira da fase 37 que não mudava nada (nem a armadilha). A peça "sobrando" da fase 101 ficou: sem ela o
// min não muda, mas a armadilha some.
export const AJUSTES={m4v04:{tira:[3,0,1]}, m6v03:{semMeta:'rache'}, m10v09:{semMeta:'rache'}};
export const NOMES={
  m1v01:'Primeira junção', m1v02:'Cometa sem sobra', m1v03:'Duas rochas', m1v04:'Dois asteroides', m1v05:'Cometa no aperto',
  m1v06:'Cometa com junção dupla', m1v07:'Dois, sem cometa', m1v08:'Buracos no caminho', m1v09:'Cometa deitado', m1v10:'Primeiro Plutão',
  m1v11:'Plutão entre buracos',
  m2v01:'Primeira estação', m2v02:'Estação na beirada', m2v03:'Duas estações', m2v04:'Junção dupla no salão', m2v05:'Par de asteroides',
  m2v06:'Três estações', m2v07:'Estação no 3x3', m2v08:'Não encoste no asteroide', m2v09:'Plutão e as estações',
  m2v10:'Cometa cercado', m2v11:'Quatro estações',
  m3v01:'Parar no fluxo', m3v02:'Fluxo apertado', m3v03:'Cometa no fluxo', m3v04:'Fluxo e estação', m3v05:'Fluxos no 3x3',
  m3v06:'Dois asteroides no fluxo', m3v07:'Cometa nos corredores', m3v08:'Junção dupla no fluxo', m3v09:'Plutão no fluxo',
  m3v10:'Labirinto pequeno', m3v11:'Grande labirinto',
  m4v01:'A órbita dourada', m4v02:'Órbita apertada', m4v03:'Órbita e estação', m4v04:'Órbita no topo', m4v05:'Cometa na órbita',
  m4v06:'Órbita fechada', m4v07:'Órbita longe', m4v08:'Levar duas', m4v09:'Órbita escondida', m4v10:'Cometa entre estações',
  m4v11:'Viagem longa',
  m5v01:'A nave chegou', m5v02:'Nave no canto', m5v03:'Rocha para a nave', m5v04:'Asteroide para a nave',
  m5v05:'Duas rochas na nave', m5v06:'Dois destinos', m5v07:'Cometa na nave', m5v08:'Nave na beirada', m5v09:'Uma vai, outra fica',
  m5v10:'Rota da nave', m5v11:'Dois asteroides a bordo',
  m6v01:'Uma junção só', m6v02:'Lixo na passagem', m6v03:'Lixo e asteroide', m6v04:'Lixo duro', m6v05:'Lixo e órbita',
  m6v06:'Passinho no lixo', m6v07:'Lixo e nave', m6v08:'Lixos e fluxos', m6v09:'Três lixos', m6v10:'Cometa entre lixos',
  m6v11:'Dois lixos e a nave',
  m7v01:'Nuvem no canto', m7v02:'Nuvens e fluxos', m7v03:'Poeira na nuvem', m7v04:'Três nuvens e uma estação', m7v05:'Nuvem e órbita',
  m7v06:'Nuvens entre estações', m7v07:'Duas nuvens e um lixo', m7v08:'Passinho na nebulosa', m7v09:'Nebulosa grande',
  m7v10:'Nuvens antes da nave', m7v11:'Nuvem sem cometa',
  m8v01:'Rocha na órbita', m8v02:'Asteroide na órbita', m8v03:'Órbita ao lado da estação', m8v04:'Da nuvem para a órbita',
  m8v05:'Formar o cometa', m8v06:'Levar e formar', m8v07:'Formar entre fluxos', m8v08:'Rachar antes de formar',
  m8v09:'Passinho na órbita', m8v10:'Cometa no salão', m8v11:'Asteroide nas duas órbitas',
  m9v01:'Rocha presa', m9v02:'Preso no alto', m9v03:'Preso e estação', m9v04:'Solta e leva', m9v05:'Preso atrás do fluxo',
  m9v06:'Duas rochas presas', m9v07:'Nuvens sobre o preso', m9v08:'Passinho e o preso', m9v09:'Soltar e rachar', m9v10:'Cometa preso',
  m9v11:'Dois asteroides presos',
  m10v01:'Primeira aura', m10v02:'Asteroide roxo', m10v03:'Junção dupla de cor', m10v04:'Levar entre auras',
  m10v05:'A mista decide', m10v06:'Aura a bordo', m10v07:'Uma de cada cor', m10v08:'Cometa verde', m10v09:'Asteroide roxo e o lixo',
  m10v10:'Passinho com auras', m10v11:'Cometa roxo e as nuvens',
};
