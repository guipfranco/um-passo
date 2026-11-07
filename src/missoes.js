// ===================== CLÁSSICO: FASES COM MISSÃO =====================
// Cada fase tem uma missão (objetivo). Cumprir dá 1 estrela; o total do dia dá a 2ª e a 3ª.
// Cada grupo apresenta uma mecânica nova.
//
// obj:  {forme:t, n}       forme n pedrinhas do nível t
//       {cor:c, t, n}      forme n pedrinhas do nível t na cor c (0 roxa, 1 verde)
//       {total:v}          renda $v no fim do dia
//       {quebre:t, n}      quebre com a picareta n pedrinhas do nível t ou maior
//       {extraia:v}        extraia $v com a picareta
//       {arrastos:n}       faça n arrastos sem travar (fases sem energia)
// arrastos: limite de arrastos (sem isso, joga até travar)
// estrelas: [$ para 2 estrelas, $ para 3 estrelas]
// opcionais: fase (tipo de jogo, padrão o do grupo), forma, w/h, char ('passinho'), itens {id: nível}, regras {...}
const MISSOES_GRUPOS = [
  {nome:'Túnel',    tema:1, fase:'comum',    desc:'O básico: junte as iguais.'},
  {nome:'Paredes',  tema:2, fase:'caverna',  desc:'Formatos com paredes, buracos e muretas.'},
  {nome:'Passinho', tema:3, fase:'comum',    char:'passinho', desc:'Tudo anda uma casa por vez.'},
  {nome:'Cores',    tema:4, fase:'cores',    desc:'Sem energia, até travar. Cada cor junta com a sua.'},
  {nome:'Picareta', tema:5, fase:'picareta', desc:'Quebre as pedrinhas para tirar o minério na hora.'},
];
const MISSOES = [
  {g:0, nome:'Primeira Rocha',   arrastos:15, obj:{forme:3, n:1},  estrelas:[20, 35]},
  {g:0, nome:'Três de uma vez',  arrastos:16, obj:{forme:3, n:3},  estrelas:[22, 35]},
  {g:0, nome:'Rocha densa',      arrastos:20, obj:{forme:4, n:1},  estrelas:[30, 60]},
  {g:0, nome:'Dia cheio',        arrastos:25, obj:{total:25},      estrelas:[40, 65]},

  {g:1, nome:'Pilares',  forma:'pilares',  arrastos:20, obj:{forme:4, n:1}, estrelas:[28, 50]},
  {g:1, nome:'Corredor', fase:'corredor',  arrastos:20, obj:{forme:3, n:3}, estrelas:[24, 40]},
  {g:1, nome:'Anel',     forma:'anel',     arrastos:30, obj:{total:30},     estrelas:[42, 65]},
  {g:1, nome:'Coração',  forma:'coracao',  arrastos:30, obj:{forme:5, n:1}, estrelas:[45, 70]},

  {g:2, nome:'Um passo',      arrastos:20, obj:{forme:3, n:1}, estrelas:[24, 40]},
  {g:2, nome:'Passo a passo', arrastos:20, obj:{forme:3, n:3}, estrelas:[28, 50]},
  {g:2, nome:'Aperto',        fase:'estreita', arrastos:20, obj:{total:40}, estrelas:[60, 90]},
  {g:2, nome:'Cruz',          forma:'cruz', arrastos:35, obj:{forme:5, n:1}, estrelas:[50, 85]},

  {g:3, nome:'Roxa e verde', obj:{forme:3, n:3},       estrelas:[60, 100]},
  {g:3, nome:'Toda roxa',    obj:{cor:0, t:3, n:3},    estrelas:[60, 100]},
  {g:3, nome:'Avalanche',    fase:'avalanche', obj:{arrastos:20}, estrelas:[55, 100]},
  {g:3, nome:'Salão',        fase:'salao', obj:{forme:5, n:1},    estrelas:[100, 140]},

  {g:4, nome:'Primeira quebra',    arrastos:20, obj:{quebre:1, n:2}, estrelas:[7, 11]},
  {g:4, nome:'Pedra na picareta',  arrastos:25, obj:{quebre:2, n:2}, estrelas:[9, 13]},
  {g:4, nome:'Quebra a Rocha',     arrastos:40, obj:{quebre:3, n:1}, estrelas:[16, 22]},
  {g:4, nome:'Garimpo',  w:5, h:5, arrastos:45, obj:{extraia:20},    estrelas:[26, 35]},
];
