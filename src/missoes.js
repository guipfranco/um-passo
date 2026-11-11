// ===================== CLÁSSICO: MUNDOS E FASES =====================
// A Jornada (versão 3, de 2026-11-10; por que os mundos são estes, em proposta.html): cada mundo apresenta UM passo de
// uma mecânica, da mais simples para a mais complexa, e explora como ela interage com as que já foram aprendidas.
// 10 mundos de 8 fases. Receita de cada mundo:
//   1 estreia: só a novidade, fácil, pedindo 1
//   2 restrição: a novidade com uma regra que muda a decisão (sem formar uma peça, {proibido}; ou duas de uma vez,
//     {combo}, quando faz sentido). Nunca é só "mais um" da estreia.
//   3 quebra-cabeça: tabuleiro armado, sem peça nova nascendo (quebracabecas.js)
//   4-6 encontros: a novidade misturada com mecânicas dos mundos anteriores
//   7 segundo quebra-cabeça. O Passinho (jeito de jogar) entra aqui a partir do mundo 6: estreia no 6, treina no 8 e
//     vira quebra-cabeça no 9.
//   8 final do mundo
// Regras: uma novidade por fase; nenhuma meta de pontos; nenhuma fase repete a meta da anterior só mudando a quantidade.
// O mundo 1 não tem mecânica própria: juntar, a primeira restrição, quebra-cabeça, duas de uma vez, o 5x5 e o final.
// A primeira fase difícil é a 30 (Asteroide entre estações, no mundo 4); antes dela o robô casual cumpre quase sempre.
// Quem jogou a versão 2 (12 fases por mundo) teve o progresso levado uma vez para esta numeração (J3_ANTIGA, classico.js):
// mudar a ordem ou o número das fases pede outra migração.
// Mundos com breve:true ainda não têm fases (aparecem como "em construção" no mapa).
// Lixo espacial no mapa: 'L' racha com 1 junção numa casa ao lado ('2' e '3' pedem mais). Meta {rache:n}.
// Posições fixas: alvosPos, carroPos, presasPos, terraPos (da fase) ou pos (de cada meta, quando há duas metas de órbita).
//
// Metas (obj, ou objs para várias):
//   {forme:t, n}       forme n pedrinhas do nível t            {cor:c, t, n}   na cor c (0 roxa, 1 verde)
//   {pontos:v}         faça v pontos (fora da Jornada)         {quebre:t, n}   quebre com a picareta (nível t ou maior)
//   {seq:[t1,t2..]}    forme nessa ordem (cada um do nível pedido ou maior; por isso quase não muda a decisão)
//   {combo:n}          duas junções num arrasto, n vezes
//   {alvo:t, n}        forme o nível t nas n casas marcadas (a junção acontece em cima da casa)
//   {leve:t, n}        leve exatamente uma pedrinha do nível t até cada uma das n casas marcadas (chegando andando; junção ali não vale)    {terra:n}       limpe n casas de terra
//   {solte:t, n}       solte n pedrinhas presas do nível t     {carrinho:t, n} coloque n pedrinhas (nível t ou maior) no carrinho
//   {proibido:t}       sem formar o nível t (restrição): só muda a decisão se a fase pedir duas ou mais peças do nível de baixo
// livre:true = sem limite de arrastos: só acaba se o tabuleiro encher; as estrelas vêm dos arrastos usados.
// Mapa: w/h, forma (formato pronto), mapa/muretas/pecas (montado), regras {walls, edges, spawns...}, fase, char.
// Arrastos e estrelas: missoes_calib.js (python testes/calibrar.py). Quebra-cabeças: quebracabecas.js.
const MUNDOS = [
  {nome:'Entrada',           tema:1, fase:'comum', ico:'comum',          desc:'Juntar, formar e duas de uma vez.'},
  {nome:'Estações',          tema:2, fase:'comum', ico:'caverna',        desc:'O bloco que nunca sai do lugar.'},
  {nome:'Fluxos de rochas',  tema:3, fase:'comum', ico:'corredor',       desc:'Rochas entre as casas: as peças param nelas.'},
  {nome:'Órbitas',           tema:8, fase:'comum', ico:'comum',          desc:'Levar o planeta pedido até a órbita dourada.'},
  {nome:'Naves',             tema:5, fase:'comum', ico:'galeria',        desc:'Levar planetas até a nave, que os recolhe.'},
  {nome:'Lixo espacial',     tema:7, fase:'comum', ico:'desmoronamento', desc:'O lixo racha com uma junção ao lado.'},
  {nome:'Nebulosas',         tema:4, fase:'comum', ico:'desmoronamento', desc:'Desfazer a nuvem juntando em cima dela.'},
  {nome:'Órbitas, parte 2',  tema:8, fase:'comum', ico:'comum',          desc:'Formar o planeta em cima da órbita.'},
  {nome:'Planetas presos',   tema:4, fase:'comum', ico:'desmoronamento', desc:'Soltar o planeta preso juntando um igual com ele.'},
  {nome:'Auras',             tema:6, fase:'cores', ico:'cores',          desc:'Cada aura só junta com a sua cor.'},
];
const MISSOES = [
  // 1 · Entrada: juntar; a primeira restrição; duas de uma vez; o 5x5
  {g:0, nome:'Primeira rocha',            obj:{forme:3, n:1}},
  {g:0, nome:'Sem pressa',                objs:[{forme:3, n:3},{proibido:4}]},
  {g:0, nome:'Quebra-cabeça',             ...QC.q1},
  {g:0, nome:'Duas de uma vez',           obj:{combo:1}},
  {g:0, nome:'Primeiro cometa', w:5,      obj:{forme:5, n:1}},
  {g:0, nome:'Duas de uma vez, sem cometa', w:5, objs:[{combo:4},{proibido:5}]},
  {g:0, nome:'Quebra-cabeça do cometa',   ...QC.q9},
  {g:0, nome:'Fim da entrada', w:5, chefe:true, objs:[{forme:6, n:1},{combo:3}]},
  // 2 · Estações: o bloco que não sai
  {g:1, nome:'A estação que não sai', regras:{walls:1}, obj:{forme:4, n:1}},
  {g:1, nome:'Duas de uma vez nas estações', regras:{walls:2}, obj:{combo:3}},
  {g:1, nome:'Quebra-cabeça das estações', ...QC.q2},
  {g:1, nome:'Estação no meio',   mapa:['.....','.....','..B..','.....','.....'], objs:[{forme:4, n:3},{proibido:5}]},
  {g:1, nome:'Salão de estações', w:6, regras:{walls:5}, obj:{forme:5, n:2}},
  {g:1, nome:'Estação no canto',  mapa:['B....','.....','.....','.....','.....'], obj:{forme:6, n:1}},
  {g:1, nome:'Quebra-cabeça das estações, de novo', ...QC.q10},
  {g:1, livre:true, nome:'Fim das estações', w:7, regras:{walls:8}, chefe:true, obj:{forme:7, n:1}},
  // 3 · Fluxos de rochas: as peças param entre as casas
  {g:2, nome:'Primeiro fluxo',    regras:{edges:3}, obj:{forme:4, n:1}},
  {g:2, nome:'Fluxo no meio', mapa:['....','....','....','....'], muretas:[['v',1,0],['v',1,1],['v',1,2]], objs:[{forme:4, n:2},{proibido:5}]},
  {g:2, nome:'Quebra-cabeça dos fluxos', ...QC.q3},
  {g:2, nome:'Corredores', mapa:['.....','.B...','.....','...B.','.....'], muretas:[['v',1,2],['v',2,2],['h',2,0],['h',2,3]], obj:{forme:5, n:1}},
  {g:2, nome:'Duas de uma vez entre fluxos', w:5, regras:{edges:5}, obj:{combo:4}},
  {g:2, nome:'Labirinto curto', w:6, regras:{walls:3, edges:6}, obj:{forme:5, n:2}},
  {g:2, nome:'Quebra-cabeça dos fluxos, de novo', ...QC.q11},
  {g:2, livre:true, nome:'Fim dos fluxos', w:5, regras:{edges:4}, chefe:true, obj:{forme:7, n:1}},
  // 4 · Órbitas: levar exatamente o planeta pedido até a casa dourada
  {g:3, nome:'Primeira órbita', alvosPos:[[1,0]], obj:{leve:3, n:1}},
  {g:3, nome:'Órbita sem cometa', alvosPos:[[3,1]], objs:[{leve:4, n:1},{proibido:5}]},
  {g:3, nome:'Quebra-cabeça da órbita',    ...QC.q12},
  {g:3, nome:'Estação de batente', mapa:['....','..B.','....','....'], alvosPos:[[1,1]], obj:{leve:4, n:1}},
  {g:3, nome:'Órbita atrás do fluxo', mapa:['....','....','....','....'], muretas:[['v',2,3]], alvosPos:[[2,3]], obj:{leve:3, n:1}},
  {g:3, livre:true, nome:'Asteroide entre estações', mapa:['.....','.B...','.....','...B.','.....'], alvosPos:[[4,0]], obj:{leve:4, n:1}},
  {g:3, nome:'Quebra-cabeça da órbita, de novo', ...QC.q13},
  {g:3, livre:true, nome:'Fim das órbitas', w:5, chefe:true, obj:{leve:6, n:1}},
  // 5 · Naves: levar planetas até a nave, que os recolhe
  {g:4, nome:'Primeira nave',               obj:{carrinho:3, n:1}},
  {g:4, nome:'Nave de rochas',              objs:[{carrinho:3, n:2},{proibido:4}]},
  {g:4, nome:'Quebra-cabeça da nave',       ...QC.q5},
  {g:4, nome:'Nave na estação', mapa:['....','.B..','....','....'], carroPos:[2,1], obj:{carrinho:4, n:1}},
  {g:4, livre:true, nome:'Órbita e nave', w:5, alvosPos:[[0,4]], carroPos:[4,0], objs:[{leve:4, n:1},{carrinho:4, n:1}]},
  {g:4, livre:true, nome:'Nave atrás do fluxo', mapa:['....','....','....','....'], muretas:[['v',0,0]], carroPos:[0,0], obj:{carrinho:4, n:2}},
  {g:4, nome:'Quebra-cabeça da nave, de novo', ...QC.q14},
  {g:4, livre:true, nome:'Fim das naves', w:5, chefe:true, obj:{carrinho:6, n:1}},
  // 6 · Lixo espacial: bloco fixo que racha com uma junção ao lado
  {g:5, nome:'Primeiro lixo',     mapa:['....','.L..','....','....'], obj:{rache:1}},
  {g:5, nome:'Rachar sem asteroide', mapa:['L...','....','...L','....'], objs:[{rache:2},{proibido:4}]},
  {g:5, nome:'Quebra-cabeça do lixo', ...QC.q15},
  {g:5, nome:'Órbita atrás do lixo', mapa:['....','.L..','....','....'], alvosPos:[[0,1]], obj:{leve:3, n:1}},
  {g:5, nome:'Lixo e estação',    mapa:['.....','.BL..','.....','..LB.','.....'], obj:{rache:2}},
  {g:5, nome:'Caminho até a nave', mapa:['....','..L.','....','....'], carroPos:[3,1], obj:{carrinho:4, n:1}},
  {g:5, nome:'Primeiro Passinho', char:'passinho', obj:{forme:4, n:1}},
  {g:5, nome:'Fim do lixo', w:5,  chefe:true, mapa:['.....','.L.L.','..L..','.L.L.','.....'], objs:[{rache:5},{forme:6, n:1}]},
  // 7 · Nebulosas: desfazer a nuvem juntando em cima dela
  {g:6, nome:'Primeira nebulosa',          obj:{terra:1}},
  {g:6, nome:'Nebulosa sem cometa',        objs:[{terra:3},{proibido:5}]},
  {g:6, nome:'Quebra-cabeça da nebulosa',  ...QC.q16},
  {g:6, nome:'Órbita na nebulosa',  alvosPos:[[1,0]], terraPos:[[1,0]], objs:[{terra:1},{leve:3, n:1}]},
  {g:6, nome:'Nebulosa na estação', mapa:['.....','.B...','.....','...B.','.....'], terraPos:[[2,1],[1,2],[3,2],[2,3]], obj:{terra:4}},
  {g:6, livre:true, nome:'Nebulosa e lixo',     mapa:['.....','.L...','.....','...L.','.....'], terraPos:[[2,1],[1,2],[3,2],[2,3]], objs:[{terra:4},{rache:2}]},
  {g:6, nome:'Quebra-cabeça da nebulosa, de novo', ...QC.q17},
  {g:6, livre:true, nome:'Fim das nebulosas', w:5, chefe:true, objs:[{terra:8},{forme:6, n:1}]},
  // 8 · Órbitas, parte 2: a junção acontece em cima da órbita
  {g:7, nome:'Formar na órbita',     alvosPos:[[0,0]], obj:{alvo:3, n:1}},
  {g:7, nome:'Beirada sem asteroide', alvosPos:[[3,1]], objs:[{alvo:3, n:1},{proibido:4}]},
  {g:7, nome:'Quebra-cabeça de formar na órbita', ...QC.q18},
  {g:7, nome:'Órbita coberta',       alvosPos:[[0,0]], terraPos:[[0,0]], objs:[{alvo:4, n:1},{terra:1}]},
  {g:7, livre:true, nome:'Leva numa, forma na outra', w:5, objs:[{leve:3, n:1, pos:[[0,4]]},{alvo:4, n:1, pos:[[4,0]]}]},
  {g:7, nome:'Formar ao lado do lixo', mapa:['.L..','....','....','....'], alvosPos:[[0,0]], objs:[{alvo:4, n:1},{rache:1}]},
  {g:7, nome:'Passinho no 5x5', char:'passinho', w:5, obj:{forme:5, n:1}},
  {g:7, livre:true, nome:'Fim das órbitas, parte 2', w:5, chefe:true, alvosPos:[[0,0]], terraPos:[[1,1],[2,2],[3,3],[4,4]], objs:[{alvo:5, n:1},{terra:4}]},
  // 9 · Planetas presos: soltar juntando um igual com ele
  {g:8, nome:'Primeiro preso',        obj:{solte:3, n:1}},
  {g:8, nome:'Dois presos, sem cometa', w:5, objs:[{solte:3, n:2},{proibido:5}]},
  {g:8, nome:'Quebra-cabeça do preso', ...QC.q4},
  {g:8, nome:'Soltar e levar', w:5,   presasPos:[[2,2]], alvosPos:[[2,4]], objs:[{solte:3, n:1},{leve:4, n:1}]},
  {g:8, nome:'Preso atrás do lixo', mapa:['.....','.....','.L...','.....','.....'], muretas:[['h',0,1]], presasPos:[[0,2]], obj:{solte:4, n:1}},
  {g:8, nome:'Soltar formando na órbita', w:5, presasPos:[[0,0]], terraPos:[[0,0],[1,0],[0,1]], objs:[{solte:4, n:1},{alvo:5, n:1, pos:[[0,0]]},{terra:3}]},
  {g:8, nome:'Quebra-cabeça do preso no Passinho', ...QC.q19, char:'passinho'},
  {g:8, nome:'Fim dos presos', w:5, chefe:true, objs:[{solte:5, n:1},{forme:6, n:1}]},
  // 10 · Auras: cada aura só junta com a sua cor
  {g:9, nome:'Roxa e verde',          obj:{forme:3, n:1}},
  {g:9, nome:'Rochas roxas',          objs:[{cor:0, t:3, n:2},{proibido:4}]},
  {g:9, nome:'Quebra-cabeça das auras', fase:'cores', ...QC.q6},
  {g:9, nome:'Órbita com auras',      alvosPos:[[0,0]], obj:{alvo:3, n:1}},
  {g:9, nome:'Nave com auras',        carroPos:[3,1], obj:{carrinho:3, n:1}},
  {g:9, nome:'Lixo com auras', w:5, fase:'cores', mapa:['.....','.L...','.....','...L.','.....'], obj:{rache:2}},
  {g:9, nome:'Quebra-cabeça das auras, de novo', fase:'cores', ...QC.q20},
  {g:9, nome:'Fim das auras', w:6, chefe:true, obj:{forme:5, n:2}},
];
MISSOES.forEach(m=>{ m.estrelas=m.estrelas||[3,6]; });
