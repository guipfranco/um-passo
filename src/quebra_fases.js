// ===================== QUEBRA-CABEÇAS: MUNDOS E FASES =====================
// O modo Quebra-cabeças (em teste, só com ?quebra; código em quebra.js): nenhuma peça nova nasce, o pedido é só a ordem
// certa dos arrastos. Versão inicial: os 20 quebra-cabeças de quebracabecas.js em 6 mundos (a definitiva vem com 100+).
//
// QJ_MUNDOS: {nome, desc, tema, ico}
//   tema: 1 a 8, o céu do mundo (o mesmo tema dos mundos da Jornada)
//   ico:  desenho do mundo no mapa: planeta, estacao, rochas, orbita, nave, lixo, nebulosa, gaiola ou aura
//         (sem ico, sai da meta da primeira fase do mundo)
// QJ_FASES: no formato dos quebra-cabeças de quebracabecas.js, mais g (o mundo, contando do 0), nome e min
//   {g, nome, mapa, pecas, regras:{spawns:0}, obj, arrastos, estrelas, muretas?, carroPos?, presasPos?, alvosPos?,
//    terraPos?, char?, min}
//   mapa:     linhas do tabuleiro ('.' casa, 'B' estação, 'L' lixo espacial, '#' sem casa)
//   pecas:    [x, y, nível, cor?, tipo?] (cor 0 roxa, 1 verde, 2 das duas; tipo 'p' buraco negro, 'r' planeta comum)
//   obj:      a meta, como nas fases da Jornada (missoes.js); objs para várias
//   arrastos: limite (★ é cumprir dentro dele); min: menor solução achada pela busca
//   estrelas: [sobrando para ★★, sobrando para ★★★]; sem o campo: ★★ até min+3 e ★★★ até min+1 arrastos
//   char:     'passinho' (tudo anda uma casa por arrasto)
// Cores nas peças viram fase 'cores' e buraco negro vira fase 'picareta' sozinhos (quebra.js); fase:'...' força outra.
const QJ_MUNDOS = [
  {nome:'Primeiros passos', desc:'Nenhuma peça nova: cada arrasto conta.', tema:1, ico:'planeta'},
  {nome:'Estações e fluxos', desc:'O que não sai do lugar decide o caminho.', tema:2, ico:'estacao'},
  {nome:'Órbitas', desc:'Levar e formar o planeta certo na órbita.', tema:8, ico:'orbita'},
  {nome:'Lixo e naves', desc:'Rachar o lixo e encher a nave.', tema:5, ico:'nave'},
  {nome:'Nebulosas e presos', desc:'Juntar no lugar certo.', tema:4, ico:'nebulosa'},
  {nome:'Auras e Passinho', desc:'Cores, buraco negro e um passo de cada vez.', tema:6, ico:'aura'},
];
const QJ_FASES = [
  // 1 · Primeiros passos
  {g:0, nome:'Primeiro quebra-cabeça', mapa:['....','....','....','....'],pecas:[[0,0,3],[2,2,2],[3,3,2],[1,0,2],[0,1,2],[0,2,2],[2,3,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:9,estrelas:[2,4], min:4},
  {g:0, nome:'Cometa sem sobras', mapa:['....','....','....','....'],pecas:[[3,1,2],[2,1,2],[0,1,2],[3,2,3],[1,1,3],[3,0,1],[0,3,1],[3,3,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4], min:5},
  // 2 · Estações e fluxos
  {g:1, nome:'Entre duas estações', mapa:['.B..','..B.','....','....'],pecas:[[2,2,3],[3,3,2],[0,1,2],[3,0,2],[1,1,2],[3,1,2],[1,3,2],[2,3,2],[2,0,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4], min:5},
  {g:1, nome:'Fluxo no caminho', mapa:['....','....','....','....'],pecas:[[1,2,3],[0,3,2],[0,1,2],[1,0,2],[3,1,2],[1,3,2],[2,1,2],[2,0,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4],muretas:[['v',2,0],['h',0,0],['h',0,1]], min:5},
  {g:1, nome:'Três estações', mapa:['B...','...B','....','..B.'],pecas:[[1,3,3],[1,0,2],[0,2,3],[2,0,3],[2,1,1],[1,2,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4], min:6},
  {g:1, nome:'Estação e fluxos', mapa:['....','.B..','....','....'],pecas:[[2,1,3],[3,2,3],[2,3,2],[0,3,2],[1,0,2],[2,2,2],[0,1,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4],muretas:[['v',2,3],['v',1,2],['h',1,1],['h',3,0]], min:6},
  // 3 · Órbitas
  {g:2, nome:'Órbita certa', mapa:['....','....','....','....'],pecas:[[3,0,3],[2,2,3],[3,2,2],[0,3,1]],regras:{spawns:0},obj:{leve:4,n:1},arrastos:9,estrelas:[2,4],alvosPos:[[2,3]], min:4},
  {g:2, nome:'Formar na órbita', mapa:['....','....','....','....'],pecas:[[2,2,2],[0,3,1],[0,1,1],[3,0,1],[2,1,1],[1,2,1],[3,2,1]],regras:{spawns:0},obj:{alvo:4,n:1},arrastos:10,estrelas:[2,4],alvosPos:[[0,0]], min:5},
  {g:2, nome:'Órbita atrás da estação', mapa:['B...','..B.','....','....'],pecas:[[1,0,2],[3,2,2],[2,0,1],[1,3,1],[3,0,1],[2,3,1]],regras:{spawns:0},obj:{leve:4,n:1},arrastos:10,estrelas:[2,4],alvosPos:[[3,3]], min:5},
  // 4 · Lixo e naves
  {g:3, nome:'Dois lixos', mapa:['..L.','....','....','...L'],pecas:[[2,2,2],[3,2,2],[1,2,2],[0,0,1],[3,1,1]],regras:{spawns:0},obj:{rache:2},arrastos:10,estrelas:[2,4], min:5},
  {g:3, nome:'Nave no canto', mapa:['....','....','....','....'],pecas:[[2,3,2],[3,2,2],[3,1,1],[2,1,1],[0,0,1],[1,0,1],[1,3,2]],regras:{spawns:0},obj:{carrinho:4,n:1},arrastos:11,estrelas:[2,4],carroPos:[0,2], min:6},
  {g:3, nome:'Nave atrás do fluxo', mapa:['....','....','....','....'],pecas:[[2,2,3],[0,3,2],[1,2,1],[3,3,1],[3,2,1]],regras:{spawns:0},obj:{carrinho:4,n:1},arrastos:12,estrelas:[2,4],muretas:[['h',1,2],['v',2,0],['v',0,0]],carroPos:[0,0], min:7},
  // 5 · Nebulosas e presos
  {g:4, nome:'Três nebulosas', mapa:['....','....','....','....'],pecas:[[1,0,2],[2,1,2],[0,1,1],[3,3,1],[1,1,1],[2,3,1],[3,2,1],[3,0,1]],regras:{spawns:0},obj:{terra:3},arrastos:12,estrelas:[2,4],terraPos:[[0,3],[3,1],[2,0]], min:7},
  {g:4, nome:'Nebulosas e estações', mapa:['....','..B.','B...','....'],pecas:[[3,0,2],[3,1,2],[2,2,3],[2,3,2],[0,1,2],[3,3,2],[1,3,2]],regras:{spawns:0},obj:{terra:3},arrastos:13,estrelas:[2,4],terraPos:[[3,2],[0,3],[2,0]], min:8},
  {g:4, nome:'Planeta preso', mapa:['....','....','....','....'],pecas:[[0,0,4],[3,1,2]],regras:{spawns:0},obj:{solte:4,n:1},arrastos:11,estrelas:[2,4],presasPos:[[1,1]], min:6},
  // 6 · Auras e Passinho
  {g:5, nome:'Auras', mapa:['....','....','....','....'],pecas:[[2,0,2,1],[3,2,2,1],[1,1,3,1],[2,1,3,2],[2,2,2,0],[0,1,2,1],[0,3,2,1],[3,0,1,0]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4], min:6},
  {g:5, nome:'Auras entre fluxos', mapa:['....','....','....','....'],pecas:[[2,3,3,1],[2,2,2,1],[2,1,2,1],[1,1,2,2],[1,2,2,1],[0,1,2,2],[2,0,2,0],[1,0,1,1],[0,3,1,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4],muretas:[['v',2,2],['h',1,0]], min:6},
  {g:5, nome:'Buraco negro', mapa:['....','....','....','....'],pecas:[[1,3,3,null,'p'],[0,2,2,null,'r'],[1,2,1,null,'r'],[2,1,1,null,'r'],[2,3,1,null,'p'],[0,3,1,null,'p']],regras:{spawns:0},obj:{quebre:3,n:1},arrastos:11,estrelas:[2,4], min:6},
  {g:5, nome:'Passinho', mapa:['....','....','....','....'],pecas:[[2,1,3],[2,2,2],[0,0,1],[2,3,1]],regras:{spawns:0},obj:{forme:4,n:1},arrastos:12,estrelas:[2,4], char:'passinho', min:7},
  {g:5, nome:'Passinho e o preso', mapa:['....','....','....','....'],pecas:[[2,3,2],[0,0,1],[0,1,1],[3,2,2],[1,2,2],[0,2,1]],regras:{spawns:0},obj:{solte:4,n:1},arrastos:12,estrelas:[2,4],presasPos:[[3,1]], char:'passinho', min:7},
];
