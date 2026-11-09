// Quebra-cabeças do Clássico: não nasce pedrinha nova, então cada um tem uma solução certa.
// Gerados e conferidos por busca: testes/calibrar/quebracabecas.html (arrastos = menor solução + 5; ★★★ até 1 a mais que a menor, ★★ até 3 a mais).
const QC = {
  q1: {mapa:['....','....','....','....'],pecas:[[0,0,3],[2,2,2],[3,3,2],[1,0,2],[0,1,2],[0,2,2],[2,3,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:9,estrelas:[2,4]},
  q2: {mapa:['.B..','..B.','....','....'],pecas:[[2,2,3],[3,3,2],[0,1,2],[3,0,2],[1,1,2],[3,1,2],[1,3,2],[2,3,2],[2,0,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4]},
  q3: {mapa:['....','....','....','....'],pecas:[[1,2,3],[0,3,2],[0,1,2],[1,0,2],[3,1,2],[1,3,2],[2,1,2],[2,0,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4],muretas:[['v',2,0],['h',0,0],['h',0,1]]},
  q4: {mapa:['....','....','....','....'],pecas:[[0,0,4],[3,1,2]],regras:{spawns:0},obj:{solte:4,n:1},arrastos:11,estrelas:[2,4],presasPos:[[1,1]]},
  q5: {mapa:['....','....','....','....'],pecas:[[2,3,2],[3,2,2],[3,1,1],[2,1,1],[0,0,1],[1,0,1],[1,3,2]],regras:{spawns:0},obj:{carrinho:4,n:1},arrastos:11,estrelas:[2,4],carroPos:[0,2]},
  q6: {mapa:['....','....','....','....'],pecas:[[2,0,2,1],[3,2,2,1],[1,1,3,1],[2,1,3,2],[2,2,2,0],[0,1,2,1],[0,3,2,1],[3,0,1,0]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4]},
  q7: {mapa:['....','....','....','....'],pecas:[[1,3,3,null,'p'],[0,2,2,null,'r'],[1,2,1,null,'r'],[2,1,1,null,'r'],[2,3,1,null,'p'],[0,3,1,null,'p']],regras:{spawns:0},obj:{quebre:3,n:1},arrastos:11,estrelas:[2,4]},
  q8: {mapa:['....','....','....','....'],pecas:[[2,1,3],[2,2,2],[0,0,1],[2,3,1]],regras:{spawns:0},obj:{forme:4,n:1},arrastos:12,estrelas:[2,4]},
  q9: {mapa:['....','....','....','....'],pecas:[[3,1,2],[2,1,2],[0,1,2],[3,2,3],[1,1,3],[3,0,1],[0,3,1],[3,3,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:10,estrelas:[2,4]},
  q10: {mapa:['B...','...B','....','..B.'],pecas:[[1,3,3],[1,0,2],[0,2,3],[2,0,3],[2,1,1],[1,2,1]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4]},
  q11: {mapa:['....','.B..','....','....'],pecas:[[2,1,3],[3,2,3],[2,3,2],[0,3,2],[1,0,2],[2,2,2],[0,1,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4],muretas:[['v',2,3],['v',1,2],['h',1,1],['h',3,0]]},
  q12: {mapa:['....','....','....','....'],pecas:[[3,0,3],[2,2,3],[3,2,2],[0,3,1]],regras:{spawns:0},obj:{leve:4,n:1},arrastos:9,estrelas:[2,4],alvosPos:[[2,3]]},
  q13: {mapa:['B...','..B.','....','....'],pecas:[[1,0,2],[3,2,2],[2,0,1],[1,3,1],[3,0,1],[2,3,1]],regras:{spawns:0},obj:{leve:4,n:1},arrastos:10,estrelas:[2,4],alvosPos:[[3,3]]},
  q14: {mapa:['....','....','....','....'],pecas:[[2,2,3],[0,3,2],[1,2,1],[3,3,1],[3,2,1]],regras:{spawns:0},obj:{carrinho:4,n:1},arrastos:12,estrelas:[2,4],muretas:[['h',1,2],['v',2,0],['v',0,0]],carroPos:[0,0]},
  q15: {mapa:['..L.','....','....','...L'],pecas:[[2,2,2],[3,2,2],[1,2,2],[0,0,1],[3,1,1]],regras:{spawns:0},obj:{rache:2},arrastos:10,estrelas:[2,4]},
  q16: {mapa:['....','....','....','....'],pecas:[[1,0,2],[2,1,2],[0,1,1],[3,3,1],[1,1,1],[2,3,1],[3,2,1],[3,0,1]],regras:{spawns:0},obj:{terra:3},arrastos:12,estrelas:[2,4],terraPos:[[0,3],[3,1],[2,0]]},
  q17: {mapa:['....','..B.','B...','....'],pecas:[[3,0,2],[3,1,2],[2,2,3],[2,3,2],[0,1,2],[3,3,2],[1,3,2]],regras:{spawns:0},obj:{terra:3},arrastos:13,estrelas:[2,4],terraPos:[[3,2],[0,3],[2,0]]},
  q18: {mapa:['....','....','....','....'],pecas:[[2,2,2],[0,3,1],[0,1,1],[3,0,1],[2,1,1],[1,2,1],[3,2,1]],regras:{spawns:0},obj:{alvo:4,n:1},arrastos:10,estrelas:[2,4],alvosPos:[[0,0]]},
  q19: {mapa:['....','....','....','....'],pecas:[[2,3,2],[0,0,1],[0,1,1],[3,2,2],[1,2,2],[0,2,1]],regras:{spawns:0},obj:{solte:4,n:1},arrastos:12,estrelas:[2,4],presasPos:[[3,1]]},
  q20: {mapa:['....','....','....','....'],pecas:[[2,3,3,1],[2,2,2,1],[2,1,2,1],[1,1,2,2],[1,2,2,1],[0,1,2,2],[2,0,2,0],[1,0,1,1],[0,3,1,2]],regras:{spawns:0},obj:{forme:5,n:1},arrastos:11,estrelas:[2,4],muretas:[['v',2,2],['h',1,0]]},
};
