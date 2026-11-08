// ===================== CLÁSSICO: MUNDOS E FASES =====================
// 8 mundos de 12 fases. Cada mundo traz uma novidade (quase sempre no mapa); as metas passam por todas as
// pedrinhas, sem ordem fixa; a última fase de cada mundo (chefe) pede uma pedrinha acima da do mundo anterior.
// O Passinho só vira regra no mundo 8, mas toda fase cumprida pode ser jogada de novo no Passinho (medalha).
//
// Metas (obj, ou objs para várias):
//   {forme:t, n}       forme n pedrinhas do nível t            {cor:c, t, n}   na cor c (0 roxa, 1 verde)
//   {pontos:v}         faça v pontos                           {quebre:t, n}   quebre com a picareta (nível t ou maior)
//   {seq:[t1,t2..]}    forme nessa ordem                       {combo:n}       duas junções num arrasto, n vezes
//   {alvo:t, n}        forme o nível t nas n casas marcadas (a junção acontece em cima da casa)
//   {leve:t, n}        leve uma pedrinha do nível t (ou maior) até cada uma das n casas marcadas (basta parar em cima)    {terra:n}       limpe n casas de terra
//   {solte:t, n}       solte n pedrinhas presas do nível t     {carrinho:t, n} coloque n pedrinhas (nível t ou maior) no carrinho
//   {proibido:t}       sem formar o nível t (restrição)
// Mapa: w/h, forma (formato pronto), mapa/muretas/pecas (montado), regras {walls, edges, spawns...}, fase, char.
// Arrastos e estrelas: missoes_calib.js (python testes/calibrar.py). Quebra-cabeças: quebracabecas.js.
const MUNDOS = [
  {nome:'Entrada',           tema:1, fase:'comum',    ico:'comum',          desc:'Formar, pontos e as primeiras metas.'},
  {nome:'Blocos',            tema:2, fase:'caverna',  ico:'caverna',        desc:'A peça que não sai e os formatos.'},
  {nome:'Muretas e buracos', tema:3, fase:'corredor', ico:'corredor',       desc:'Corredores, formatos e casas marcadas.'},
  {nome:'Terra',             tema:4, fase:'comum',    ico:'desmoronamento', desc:'Casas de terra, torrões e pedrinhas presas.'},
  {nome:'Carrinho',          tema:5, fase:'comum',    ico:'galeria',        desc:'Leve as pedrinhas até o carrinho.'},
  {nome:'Cores',             tema:6, fase:'cores',    ico:'cores',          desc:'Cada cor junta com a sua.'},
  {nome:'Picareta',          tema:7, fase:'picareta', ico:'picareta',       desc:'Quebre as pedrinhas com a picareta.'},
  {nome:'Passinho',          tema:8, fase:'comum',    ico:'estreita', char:'passinho', desc:'Tudo anda uma casa por vez.'},
];
const MISSOES = [
  // 1 · Entrada
  {g:0, nome:'Primeira Rocha',      obj:{forme:3, n:1}},
  {g:0, nome:'Três Rochas',         obj:{forme:3, n:3}},
  {g:0, nome:'Rocha densa',         obj:{forme:4, n:1}},
  {g:0, nome:'Primeiros pontos',    obj:{pontos:120}},
  {g:0, nome:'Mais espaço', w:5,    obj:{forme:4, n:2}},
  {g:0, nome:'Uma depois da outra', obj:{seq:[3,4,5]}},
  {g:0, nome:'Duas de uma vez',     obj:{combo:3}},
  {g:0, nome:'Pontos no 5x5', w:5,  obj:{pontos:250}},
  {g:0, nome:'Quebra-cabeça', ...QC.q1},
  {g:0, nome:'Primeiro Geodo', w:5, obj:{forme:5, n:1}},
  {g:0, nome:'Sem pressa',          objs:[{forme:4, n:3},{proibido:5}]},
  {g:0, nome:'Fim da entrada', w:5, chefe:true, objs:[{forme:6, n:1},{pontos:600}]},
  // 2 · Blocos
  {g:1, nome:'A peça que não sai', regras:{walls:1}, obj:{forme:3, n:2}},
  {g:1, nome:'Dois blocos',        regras:{walls:2}, obj:{forme:4, n:1}},
  {g:1, nome:'Pilares',   forma:'pilares',   obj:{forme:4, n:2}},
  {g:1, nome:'Cruz',      forma:'cruz',      obj:{pontos:200}},
  {g:1, nome:'Bloco no meio', mapa:['.....','.....','..B..','.....','.....'], obj:{forme:5, n:1}},
  {g:1, nome:'Anel',      forma:'anel',      obj:{forme:4, n:3}},
  {g:1, nome:'Corredor de blocos', mapa:['.....','.....','BB.BB','.....','.....'], obj:{forme:4, n:2}},
  {g:1, nome:'Quebra-cabeça dos blocos', ...QC.q2},
  {g:1, nome:'Coração',   forma:'coracao',   obj:{pontos:300}},
  {g:1, nome:'Ampulheta', forma:'ampulheta', objs:[{forme:5, n:1},{forme:4, n:4}]},
  {g:1, nome:'Labirinto curto', w:6, regras:{walls:6}, obj:{forme:5, n:2}},
  {g:1, nome:'Salão dos blocos', w:7, regras:{walls:8}, chefe:true, obj:{forme:7, n:1}},
  // 3 · Muretas e buracos
  {g:2, nome:'Corredor',                obj:{forme:4, n:1}},
  {g:2, nome:'Primeira casa marcada', fase:'comum', obj:{leve:3, n:1}},
  {g:2, nome:'Zigue-zague', forma:'zigue',    obj:{forme:5, n:1}},
  {g:2, nome:'Duas marcas', w:5, fase:'comum', obj:{alvo:3, n:2}},
  {g:2, nome:'Serpente',    forma:'serpente', obj:{pontos:250}},
  {g:2, nome:'Rio',         forma:'rio',      objs:[{alvo:4, n:1},{forme:5, n:1}]},
  {g:2, nome:'Escada',      forma:'escada',   obj:{combo:4}},
  {g:2, nome:'Quebra-cabeça das muretas', ...QC.q3},
  {g:2, nome:'Ilhas',       forma:'ilhas',    obj:{forme:6, n:1}},
  {g:2, nome:'Janela',      forma:'janela',   obj:{alvo:5, n:1}},
  {g:2, nome:'Quartos',     forma:'quartos',  objs:[{seq:[5,6]},{pontos:400}]},
  {g:2, nome:'Fim das muretas', w:5, regras:{edges:6}, chefe:true, obj:{forme:8, n:1}},
  // 4 · Terra
  {g:3, nome:'Terra fofa',               obj:{terra:4}},
  {g:3, nome:'Mais terra', w:5,          obj:{terra:8}},
  {g:3, nome:'Terra e Rocha densa',      objs:[{terra:5},{forme:4, n:2}]},
  {g:3, nome:'Torrões', fase:'desmoronamento', obj:{forme:5, n:1}},
  {g:3, nome:'Primeira presa',           obj:{solte:4, n:1}},
  {g:3, nome:'Duas presas', w:5,         obj:{solte:5, n:2}},
  {g:3, nome:'Terra no anel', forma:'anel', objs:[{terra:8},{pontos:300}]},
  {g:3, nome:'Quebra-cabeça da presa', ...QC.q4},
  {g:3, nome:'Presa na terra', w:5,      objs:[{solte:5, n:1},{terra:6}]},
  {g:3, nome:'Avalanche de terra', fase:'avalanche', w:5, obj:{terra:10}},
  {g:3, nome:'Cristalino preso', w:5,    objs:[{solte:6, n:1},{forme:8, n:1}]},
  {g:3, nome:'Fim da terra', w:5, chefe:true, objs:[{forme:9, n:1},{terra:6}]},
  // 5 · Carrinho
  {g:4, nome:'Primeiro carrinho',        obj:{carrinho:3, n:2}},
  {g:4, nome:'Carrinho de Rochas densas', obj:{carrinho:4, n:2}},
  {g:4, nome:'Carrinho e pontos',        objs:[{carrinho:4, n:1},{pontos:250}]},
  {g:4, nome:'Carrinho na cruz', forma:'cruz', obj:{carrinho:5, n:1}},
  {g:4, nome:'Carrinho e marca', w:5,    objs:[{carrinho:4, n:1},{alvo:4, n:1}]},
  {g:4, nome:'Carrinho com terra', w:5,  objs:[{carrinho:5, n:1},{terra:6}]},
  {g:4, nome:'Carrinho cheio', w:5,      obj:{carrinho:4, n:4}},
  {g:4, nome:'Quebra-cabeça do carrinho', ...QC.q5},
  {g:4, nome:'Carrinho de Cristalino', w:5, obj:{carrinho:6, n:1}},
  {g:4, nome:'Carrinho e presa', w:5,    objs:[{carrinho:5, n:1},{solte:5, n:1}]},
  {g:4, nome:'Carrinho no coração', forma:'coracao', obj:{carrinho:6, n:2}},
  {g:4, nome:'Fim do carrinho', w:5, chefe:true, obj:{forme:10, n:1}},
  // 6 · Cores
  {g:5, nome:'Roxa e verde',             obj:{forme:3, n:3}},
  {g:5, nome:'Toda roxa',                obj:{cor:0, t:3, n:2}},
  {g:5, nome:'Verde densa',              obj:{cor:1, t:4, n:1}},
  {g:5, nome:'Cores no 5x5', w:5,        obj:{pontos:300}},
  {g:5, nome:'Roxa marcada', w:5,        objs:[{alvo:4, n:1},{cor:0, t:4, n:1}]},
  {g:5, nome:'Uma de cada cor',          objs:[{cor:0, t:4, n:1},{cor:1, t:4, n:1}]},
  {g:5, nome:'Duas de uma vez', w:5,     obj:{combo:5}},
  {g:5, nome:'Quebra-cabeça das cores', ...QC.q6},
  {g:5, nome:'Terra colorida', w:5,      objs:[{terra:8},{cor:1, t:5, n:1}]},
  {g:5, nome:'Carrinho colorido', w:5,   obj:{carrinho:4, n:2}},
  {g:5, nome:'Cristalino roxo', w:5,     obj:{cor:0, t:6, n:1}},
  {g:5, nome:'Fim das cores', w:5, fase:'comum', chefe:true, obj:{forme:11, n:1}},
  // 7 · Picareta
  {g:6, nome:'Primeira quebra',          obj:{quebre:1, n:2}},
  {g:6, nome:'Pedra na picareta',        obj:{quebre:2, n:2}},
  {g:6, nome:'Quebra a Rocha',           obj:{quebre:3, n:1}},
  {g:6, nome:'Pontos de picareta',       obj:{pontos:200}},
  {g:6, nome:'Picareta e marca', w:5,    objs:[{quebre:3, n:1},{alvo:3, n:1}]},
  {g:6, nome:'Picareta e pontos', w:5,   objs:[{quebre:2, n:2},{pontos:150}]},
  {g:6, nome:'Quebra-cabeça da picareta', ...QC.q7},
  {g:6, nome:'Rocha densa quebrada', w:5, obj:{quebre:4, n:1}},
  {g:6, nome:'Três Rochas quebradas', w:5, obj:{quebre:3, n:3}},
  {g:6, nome:'Geodo quebrado', w:5,      obj:{quebre:5, n:1}},
  {g:6, nome:'Picareta grande', w:5,     obj:{pontos:600}},
  {g:6, nome:'Meteorito', w:5, fase:'comum', chefe:true, obj:{forme:12, n:1}},
  // 8 · Passinho
  {g:7, nome:'Um passo',                 obj:{forme:3, n:1}},
  {g:7, nome:'Passo a passo',            obj:{forme:4, n:1}},
  {g:7, nome:'Passinho marcado',         obj:{alvo:4, n:1}},
  {g:7, nome:'Passinho na terra',        obj:{terra:5}},
  {g:7, nome:'Passinho e blocos', w:5, regras:{walls:2}, obj:{forme:5, n:1}},
  {g:7, nome:'Passinho no anel', forma:'anel', obj:{pontos:200}},
  {g:7, nome:'Passinho e carrinho', w:5, obj:{carrinho:4, n:2}},
  {g:7, nome:'Quebra-cabeça do Passinho', ...QC.q8},
  {g:7, nome:'Passinho e presa', w:5,    obj:{solte:5, n:1}},
  {g:7, nome:'Passinho colorido', fase:'cores', w:5, obj:{forme:5, n:1}},
  {g:7, nome:'Passinho longo', w:5,      obj:{forme:7, n:1}},
  {g:7, nome:'Fim da mina', w:5, chefe:true, obj:{forme:10, n:1}},
];
MISSOES.forEach(m=>{ m.estrelas=m.estrelas||[3,6]; });
