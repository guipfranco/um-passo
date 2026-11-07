// ===================== CLÁSSICO: FASES COM MISSÃO =====================
// Cada fase tem uma missão e um limite de arrastos, e acaba assim que a missão é cumprida.
// Estrelas pelos arrastos que sobram: cumprir dá 1; sobrar estrelas[0] dá 2; sobrar estrelas[1] dá 3.
// Pontos como no 2048: juntar soma o valor da pedrinha nova (Cascalho 2, Pedra 4, Rocha 8...);
// quebrar com a picareta vale o dobro da pedrinha quebrada.
// Cada grupo apresenta uma mecânica nova.
//
// obj:  {forme:t, n}       forme n pedrinhas do nível t
//       {cor:c, t, n}      forme n pedrinhas do nível t na cor c (0 roxa, 1 verde)
//       {pontos:v}         faça v pontos
//       {quebre:t, n}      quebre com a picareta n pedrinhas do nível t ou maior
// opcionais: fase (tipo de jogo, padrão o do grupo), forma, w/h, char ('passinho'), itens {id: nível}, regras {...}
// Calibrar: python testes/calibrar.py
const MISSOES_GRUPOS = [
  {nome:'Túnel',    tema:1, fase:'comum',    desc:'O básico: junte as iguais.'},
  {nome:'Paredes',  tema:2, fase:'caverna',  desc:'Formatos com paredes, buracos e muretas.'},
  {nome:'Passinho', tema:3, fase:'comum',    char:'passinho', desc:'Tudo anda uma casa por vez.'},
  {nome:'Cores',    tema:4, fase:'cores',    desc:'Cada cor junta com a sua.'},
  {nome:'Picareta', tema:5, fase:'picareta', desc:'Quebre as pedrinhas com a picareta.'},
];
const MISSOES = [
  {g:0, nome:'Primeira Rocha',   arrastos:8,  obj:{forme:3, n:1},  estrelas:[3, 4]},
  {g:0, nome:'Três de uma vez',  arrastos:16, obj:{forme:3, n:3},  estrelas:[3, 5]},
  {g:0, nome:'Rocha densa',      arrastos:14, obj:{forme:4, n:1},  estrelas:[4, 6]},
  {g:0, nome:'Primeiros pontos', arrastos:25, obj:{pontos:120},    estrelas:[4, 7]},

  {g:1, nome:'Pilares',  forma:'pilares',  arrastos:16, obj:{forme:4, n:1}, estrelas:[4, 7]},
  {g:1, nome:'Corredor', fase:'corredor',  arrastos:18, obj:{forme:3, n:3}, estrelas:[3, 6]},
  {g:1, nome:'Anel',     forma:'anel',     arrastos:30, obj:{pontos:120},   estrelas:[4, 6]},
  {g:1, nome:'Coração',  forma:'coracao',  arrastos:30, obj:{forme:5, n:1}, estrelas:[3, 7]},

  {g:2, nome:'Um passo',      arrastos:11, obj:{forme:3, n:1},  estrelas:[3, 5]},
  {g:2, nome:'Passo a passo', arrastos:18, obj:{forme:3, n:3},  estrelas:[3, 5]},
  {g:2, nome:'Aperto',        fase:'estreita', arrastos:20, obj:{pontos:80}, estrelas:[2, 3]},
  {g:2, nome:'Cruz',          forma:'cruz', arrastos:35, obj:{forme:5, n:1}, estrelas:[5, 8]},

  {g:3, nome:'Roxa e verde', arrastos:20, obj:{forme:3, n:3},    estrelas:[4, 7]},
  {g:3, nome:'Avalanche',    fase:'avalanche', arrastos:11, obj:{forme:3, n:3}, estrelas:[2, 3]},
  {g:3, nome:'Toda roxa',    arrastos:30, obj:{cor:0, t:3, n:3}, estrelas:[6, 11]},
  {g:3, nome:'Salão',        fase:'salao', arrastos:32, obj:{forme:5, n:1},    estrelas:[5, 10]},

  {g:4, nome:'Primeira quebra',    arrastos:10, obj:{quebre:1, n:2}, estrelas:[4, 7]},
  {g:4, nome:'Pedra na picareta',  arrastos:25, obj:{quebre:2, n:2}, estrelas:[6, 11]},
  {g:4, nome:'Quebra a Rocha',     arrastos:45, obj:{quebre:3, n:1}, estrelas:[18, 28]},
  {g:4, nome:'Garimpo',  w:5, h:5, arrastos:38, obj:{pontos:90},     estrelas:[5, 9]},
];
