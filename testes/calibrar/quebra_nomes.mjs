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
// vagas escolhidas de novo com --refaz (as outras ficam como estão em src/quebra_fases.js)
export const REFAZER=[];
// trocas de lugar entre vagas (com --refaz)
export const ORDEM=[];
// ajustes nas que ficam ({tira:[x,y,t]}: tirar uma peça; {semMeta:'rache'}: tirar uma meta)
export const AJUSTES={};
// as fases que vieram da versão 1 ficam com o nome de lá
export const NOMES={
  m1v01:'Juntar duas vezes', m1v02:'Um asteroide', m1v03:'Asteroide no 4x4', m1v04:'Duas rochas', m1v05:'Asteroide apertado',
  m1v06:'Um cometa', m1v07:'Dois asteroides', m1v08:'Cometa no aperto', m1v09:'Cometa deitado', m1v10:'Dois, sem cometa',
  m2v01:'Buraco no meio', m2v02:'Faixa comprida', m2v03:'Tabuleiro em L', m2v04:'Anel', m2v05:'Três faixas',
  m2v06:'Escada', m2v07:'Tabuleiro em T', m2v08:'Corredor', m2v09:'Tabuleiro torto', m2v10:'Casas faltando',
  m3v01:'Primeira estação', m3v02:'Estação na beirada', m3v03:'Estação na faixa', m3v04:'Duas estações', m3v05:'Estação no L',
  m3v06:'Junção dupla no salão', m3v07:'Rosquinha com estações', m3v08:'Par de asteroides', m3v09:'Plutão na escada', m3v10:'Não encoste no asteroide',
  m4v01:'Parar no fluxo', m4v02:'Fluxo na faixa', m4v03:'Fluxo apertado', m4v04:'Fluxo no T', m4v05:'Fluxos no 3x3',
  m4v06:'Fluxo no U', m4v07:'Cometa nos corredores', m4v08:'Junção dupla no fluxo', m4v09:'Cruz de fluxos', m4v10:'Plutão no fluxo',
  m5v01:'A órbita dourada', m5v02:'Órbita na faixa', m5v03:'Órbita apertada', m5v04:'Órbita no L', m5v05:'Órbita entre fluxos',
  m5v06:'Cometa na rosquinha', m5v07:'Levar duas', m5v08:'Órbita na escada', m5v09:'Órbita escondida', m5v10:'Viagem longa',
  m6v01:'A nave chegou', m6v02:'Nave na faixa', m6v03:'Nave na beirada', m6v04:'Nave no U', m6v05:'Duas rochas na nave',
  m6v06:'Nave no corredor', m6v07:'Dois destinos', m6v08:'Cometa na nave', m6v09:'Rota da nave', m6v10:'Dois asteroides a bordo',
  m7v01:'Rachar o lixo', m7v02:'Dois lixos', m7v03:'Lixo na passagem', m7v04:'Lixo e órbita', m7v05:'Lixo duro',
  m7v06:'Passinho no lixo', m7v07:'Porta de lixo duro', m7v08:'Lixo e nave', m7v09:'Lixos na faixa', m7v10:'Três lixos',
  m8v01:'Primeira nuvem', m8v02:'Nuvens na faixa', m8v03:'Poeira na nuvem', m8v04:'Nuvens no L', m8v05:'Nuvens e fluxos',
  m8v06:'Nuvem e órbita', m8v07:'Nuvens na escada', m8v08:'Passinho na nebulosa', m8v09:'Duas nuvens e um lixo', m8v10:'Nuvem sem cometa',
  m9v01:'Rocha na órbita', m9v02:'Asteroide na órbita', m9v03:'Formar no T', m9v04:'Formar o cometa', m9v05:'Formar na escada',
  m9v06:'Levar e formar', m9v07:'Formar no corredor', m9v08:'Passinho na órbita', m9v09:'Cometa entre buracos', m9v10:'Asteroide nas duas órbitas',
  m10v01:'Rocha presa', m10v02:'Preso na faixa', m10v03:'Preso no alto', m10v04:'Preso no L', m10v05:'Solta e leva',
  m10v06:'Preso na rosquinha', m10v07:'Duas rochas presas', m10v08:'Passinho e o preso', m10v09:'Soltar e rachar', m10v10:'Dois asteroides presos',
  m11v01:'Primeira aura', m11v02:'Asteroide roxo', m11v03:'Junção dupla de cor', m11v04:'Asteroide verde', m11v05:'Levar entre auras',
  m11v06:'A mista decide', m11v07:'Cometa roxo no losango', m11v08:'Uma de cada cor', m11v09:'Passinho com auras', m11v10:'Cometa roxo e as nuvens',
};
