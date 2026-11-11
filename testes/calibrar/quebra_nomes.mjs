// Mundos e nomes das fases da Jornada de quebra-cabeças (versão 2, 11 mundos de 10), vagas a refazer e trocas manuais
// (usados por quebra_monta.mjs). Os nomes seguem a vaga (m<mundo>v<vaga>); a versão 1 está no histórico do git.
export const MUNDOS=[
  {nome:'Juntar',            desc:'Juntar planetas iguais, na ordem certa.',                tema:1},
  {nome:'Formatos',          desc:'Buracos, faixas e cantos: o tabuleiro muda a ordem.',   tema:6},
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
// vaga -> escolha manual (a solução mínima do candidato, como quebra_ver.mjs mostra, ou o id da fase)
export const TROCA={};
// vagas escolhidas de novo com --refaz (as outras ficam como estão em src/quebra_fases.js). Revisão de 2026-11-12, dois
// revisores: 13 reprovadas. Refeitas as fases 3 e 9 (o mesmo pedido da anterior), 14 (no anel, girar em volta resolvia: virou escada), 15 (faixa 3x5 era
// só um retângulo, e abria cinco cometas seguidos), 20 (min 10, mais longa que o fim do mundo 3), 22 (o mesmo pedido da
// 21), 82 e 84 (a órbita não pesava; na 84 girar dava ★★★), 96 (a rosquinha quase não pesava, repetia a 94) e 98 (o
// Passinho de respiro saía fora da curva). Ajustadas a 37, a 69 e a 70 (AJUSTES).
// (refeitas: m1v03 m1v09 m2v04 m2v05 m2v10 m3v02 m9v02 m9v04 m10v06 m10v08; depois a m9v04 de novo, porque a órbita dela
// ainda não pesava)
// 2026-11-12, uma peça maior em vez de duas menores (pedido do Guilherme): fases 4, 7, 9, 15, 28 e 60 com tabuleiro
// novo (no mesmo tabuleiro o min subia além da fase seguinte, ou a fase ficava trivial ou sem armadilha); 14, 22 e 55
// ficam com o tabuleiro e trocam só a meta (AJUSTES)
export const REFAZER=['m1v04','m1v07','m1v09','m2v05','m3v08','m6v10'];
// trocas de lugar entre vagas (com --refaz)
export const ORDEM=[];
// ajustes nas que ficam ({tira:[x,y,t]}: tirar uma peça; {semMeta:'rache'}: tirar uma meta; {tiraMureta:[d,x,y]}): a
// mureta ['v',0,1] da 37 era de enfeite; na 69 a meta de formar o asteroide saía quase de graça (só rachar já pede 12);
// na 70 o Gelo em (4,4) sobrava
// e, na segunda rodada: na 84 a estação fechava a casa (0,3), que ficava sem acesso: vira buraco (o jogo não muda; o
// desenho passa a mostrar o gancho)
export const AJUSTES={m4v07:{tiraMureta:['v',0,1]}, m7v09:{semMeta:'forme'}, m7v10:{tira:[4,4,2]}, m9v04:{buraco:[0,3]},
  m2v04:{metaNova:[{forme:4,n:1}]}, m3v02:{metaNova:[{forme:4,n:1}]}, m6v05:{metaNova:[{carrinho:4,n:1}]}};
// as fases que vieram da versão 1 ficam com o nome de lá, menos onde o revisor pediu outro
// fases trocadas na versão 3 (2026-11-12, uma peça maior em vez de duas menores): a fase pela metade numa delas recomeça
// (qjMigra em src/quebra.js, pela lista QJ_TROCADAS que quebra_monta.mjs escreve); as estrelas ficam, pelo número
export const TROCADAS={versao:'3', vagas:['m1v04','m1v07','m1v09','m2v04','m2v05','m3v02','m3v08','m6v05','m6v10']};
export const NOMES={
  m1v01:'Juntar duas vezes', m1v02:'Um asteroide', m1v03:'Duas num arrasto', m1v04:'Asteroide de poeira', m1v05:'Asteroide apertado',
  m1v06:'Um cometa', m1v07:'Cometa deitado', m1v08:'Cometa no aperto', m1v09:'Asteroide lotado', m1v10:'Asteroide de sobra',
  m2v01:'Buraco no meio', m2v02:'Faixa comprida', m2v03:'Tabuleiro em L', m2v04:'Degraus', m2v05:'Dois buracos',
  m2v06:'Escada', m2v07:'Tabuleiro em T', m2v08:'Serpentina', m2v09:'Tabuleiro torto', m2v10:'Casas faltando',
  m3v01:'Primeira estação', m3v02:'Estação na quina', m3v03:'Estação na faixa', m3v04:'Duas estações', m3v05:'Estação no L',
  m3v06:'Junção dupla no salão', m3v07:'Rosquinha com estações', m3v08:'Cometa entre estações', m3v09:'Plutão na escada', m3v10:'Não encoste no asteroide',
  m4v01:'Parar no fluxo', m4v02:'Fluxo na faixa', m4v03:'Fluxo apertado', m4v04:'Fluxo no T', m4v05:'Três fluxos',
  m4v06:'Fluxo no U', m4v07:'Cometa nos desvios', m4v08:'Junção dupla no fluxo', m4v09:'Cruz de fluxos', m4v10:'Plutão no fluxo',
  m5v01:'A órbita dourada', m5v02:'Órbita na faixa', m5v03:'Órbita apertada', m5v04:'Órbita no L', m5v05:'Órbita entre fluxos',
  m5v06:'Cometa na rosquinha', m5v07:'Levar duas', m5v08:'Órbita na escada', m5v09:'Órbita escondida', m5v10:'Viagem longa',
  m6v01:'A nave chegou', m6v02:'Nave na faixa', m6v03:'Nave na beirada', m6v04:'Nave no U', m6v05:'Asteroide na nave',
  m6v06:'Nave no corredor', m6v07:'Dois destinos', m6v08:'Cometa na nave', m6v09:'Rota da nave', m6v10:'Cometa a bordo',
  m7v01:'Rachar o lixo', m7v02:'Dois lixos', m7v03:'Lixo na passagem', m7v04:'Lixo e órbita', m7v05:'Lixo duro',
  m7v06:'Passinho no lixo', m7v07:'Porta de lixo duro', m7v08:'Lixo e nave', m7v09:'Lixos na faixa', m7v10:'Três lixos',
  m8v01:'Nuvem no canto', m8v02:'Nuvens na faixa', m8v03:'Poeira na nuvem', m8v04:'Nuvens no L', m8v05:'Nuvens e fluxos',
  m8v06:'Nuvem e órbita', m8v07:'Nuvens na escada', m8v08:'Passinho na nebulosa', m8v09:'Duas nuvens e um lixo', m8v10:'Três nuvens',
  m9v01:'Rocha na órbita', m9v02:'Órbita no bolso', m9v03:'Formar no T', m9v04:'Cometa no gancho', m9v05:'Formar na escada',
  m9v06:'Entrega e encaixe', m9v07:'Formar no corredor', m9v08:'Passinho na órbita', m9v09:'Cometa entre buracos', m9v10:'Duas órbitas',
  m10v01:'Rocha presa', m10v02:'Preso na faixa', m10v03:'Preso atrás da estação', m10v04:'Preso no L', m10v05:'Do preso à órbita',
  m10v06:'Preso na cruz', m10v07:'Duas rochas presas', m10v08:'Passinho e o preso', m10v09:'Soltar e rachar', m10v10:'Dois asteroides presos',
  m11v01:'Primeira aura', m11v02:'Asteroide roxo', m11v03:'Junção dupla de cor', m11v04:'Asteroide verde', m11v05:'Levar entre auras',
  m11v06:'A mista decide', m11v07:'Cometa roxo no losango', m11v08:'Uma de cada cor', m11v09:'Passinho com auras', m11v10:'Cometa roxo e as nuvens',
};
