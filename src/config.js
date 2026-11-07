// ===================== CONFIG =====================
let W = 4, H = 4, N = 4;      // largura e altura do tabuleiro (N = maior lado)
const CFG = {
  energy: 40,                 // arrastos com energia; depois disso só nasce torrão
  torraoCusto: 2,             // cada torrão no tabuleiro no fim do dia custa isso
  days: 5,
  guardaMax: 15,              // energia que sobra fica guardada para o próximo dia de mina (até isso)
  pedraChance: 0.10,
  // calibrada por simulação (bot de canto pegando itens úteis): ~60% da renda mediana até a semana 4,
  // depois a cota passa a crescer mais rápido que a renda e a partida aperta lá pela semana 6 ou 7
  quota: w => [150, 450, 1400, 4000, 10000, 19000, 30000, 44000][w-1] ?? Math.round(44000*Math.pow(1.4,w-8)/100)*100,
  maxNivel: 3,                // itens sobem até o nível 3 (pegar de novo = subir de nível)
};
// preços e custo do torrão crescem com o andar
const escalaPreco = () => Math.pow(2,S.week-1);
const precoItem = (i,l) => Math.round(i.preco*.8*(1+l)*escalaPreco());
const custoTorrao = () => CFG.torraoCusto*S.week*(S.isFiscal&&S.fiscal.id==='rabugento'?2.5:1);
const pularItem = () => 5*Math.pow(3,S.week-1);
const CORO = [0,.05,.08,.1];
function lvDesc(id,L){
  const D = {
    peneira:  ['Cascalho cospe no mínimo cobre.','Cascalho e Pedra cospem no mínimo cobre.','Cascalho e Pedra cospem no mínimo ferro.'],
    vaquinha: [`+$${L} por pedrinha que cuspir algo.`],
    lupa:     [`A maior pedrinha cospe ×${1+L}.`],
    coroa:    [`Cresce +×${String(CORO[L]).replace('.',',')} no total do dia a cada Geodo ou maior formado.`],
    horaextra:[`+$${L} por arrasto sem energia.`],
    adubo:    [`Torrão ao lado de Rocha ou maior rende $${L} por andar em vez de custar.`],
    eco:      [`Pedrinha encostada em parede ou mureta cospe como +${L} ${L>1?'níveis':'nível'}.`],
    musgo:    [`Cada parede ou mureta com pedrinha encostada: +$${2*L} por andar.`],
    folego:   [`+${8*L} de energia em todo dia de mina.`],
    picareta: [`+${25*L}% de chance de nascer Pedra (nível 2).`],
    martelo:  [`Cada pedrinha sorteia ${1+L} vezes e cospe a melhor.`],
    cascalheira:[`Cada Cascalho no fim do dia: +$${L} por andar.`],
    pedreira: [`Cada Pedra no fim do dia: +$${2*L} por andar.`],
    rochedo:  [`Rocha e Rocha densa cospem ×${1+L}.`],
    regua:    [`Fileiras de pedrinhas iguais valem +×${String(.25*L).replace('.',',')} a mais cada.`],
  }[id];
  return D[Math.min(L,D.length)-1];
}
// cada semana é um andar mais fundo
const ANDARES = [
  {n:'Barro',     bd:'#e6d3b0', sl:'#dcc7a2'},
  {n:'Granito',   bd:'#dcd5c9', sl:'#cfc6b8'},
  {n:'Basalto',   bd:'#d3cad8', sl:'#c5bacb'},
  {n:'Quartzo',   bd:'#e6d1dc', sl:'#dabfcd'},
  {n:'Obsidiana', bd:'#cdd3dc', sl:'#bec6d1'},
];
const ROCKS = [
  {n:'Torrão'},
  {n:'Cascalho'}, {n:'Pedra'}, {n:'Rocha'}, {n:'Rocha densa'}, {n:'Geodo'}, {n:'Cristalino'}, {n:'Geodo real'},
  {n:'Pedra lunar'}, {n:'Âmbar'}, {n:'Esmeralda viva'}, {n:'Rubi real'}, {n:'Meteorito'}, {n:'Estrela'}, {n:'Galáxia'},
];
const ORES = [
  {n:'nada',                 p:0},
  {n:'carvão',               p:1,    c:'#4a4440'},
  {n:'cobre',                p:2,    c:'#e07b3c'},
  {n:'ferro',                p:5,    c:'#8b949e'},
  {n:'prata',                p:12,   c:'#eef2f6'},
  {n:'ouro',                 p:30,   c:'#f5c542'},
  {n:'ametista',             p:50,   c:'#a77bdf'},
  {n:'diamante',             p:90,   c:'#6fe3ff'},
  {n:'esmeralda',            p:150,  c:'#2fbf6f'},
  {n:'rubi',                 p:250,  c:'#e0384a'},
  {n:'safira',               p:400,  c:'#2f6fe0'},
  {n:'opala',                p:650,  c:'#bfe8ff'},
  {n:'fragmento de estrela', p:1000, c:'#fff1a0'},
  {n:'pedra filosofal',      p:2000, c:'#ff5a3a'},
];
// chance (%) de cada minério, na ordem acima, por nível de pedrinha
const DROPS = {
  1:[55,20,25],
  2:[30,15,40,15],
  3:[10,10,40,35,5],
  4:[0,0,25,45,25,5],
  5:[0,0,0,30,40,22,6,2],
  6:[0,0,0,0,35,40,12,10,3],
  7:[0,0,0,0,10,40,20,22,6,2],
  8:[0,0,0,0,0,30,25,25,12,6,2],
  9:[0,0,0,0,0,0,25,30,22,13,8,2],
  10:[0,0,0,0,0,0,0,25,25,22,15,10,3],
  11:[0,0,0,0,0,0,0,0,20,25,25,20,8,2],
  12:[0,0,0,0,0,0,0,0,0,20,25,30,20,5],
  13:[0,0,0,0,0,0,0,0,0,0,15,35,35,15],
  14:[0,0,0,0,0,0,0,0,0,0,0,20,45,35],
};
const RARA = 0.02;   // chance de uma pedrinha nascer rara (cospe como 2 níveis acima)
// nome de qualquer nível (acima do 14: Galáxia 2, Galáxia 3...)
const rockName = t => t<ROCKS.length ? ROCKS[t].n : `Galáxia ${t-ROCKS.length+2}`;
// acima do nível 14 o valor dobra a cada nível
const bonusNivel = t => t>14 ? Math.pow(2,t-14) : 1;

// itens de equipamento: sem limite, cada um só uma vez
const ITEMS = [
  {id:'peneira',   em:'🧺', nome:'Peneira fina',      est:'miudinha', preco:20, desc:'Cascalho nunca cospe nada: no mínimo, cobre.'},
  {id:'vaquinha',  em:'🐮', nome:'Vaquinha',          est:'miudinha', preco:25, desc:'+$1 para cada pedrinha que cuspir alguma coisa.'},
  {id:'lupa',      em:'🔍', nome:'Lupa de joalheiro', est:'gigante',  preco:30, desc:'A maior pedrinha do dia cospe ×3.'},
  {id:'coroa',     em:'👑', nome:'Coroa',             est:'gigante',  preco:35, desc:'Cresce: +×0,5 no total do dia para cada Geodo ou maior que você formar com ela.'},
  {id:'horaextra', em:'⏰', nome:'Hora extra',        est:'exausta',  preco:20, desc:'+$1 para cada arrasto feito depois de exausta.'},
  {id:'adubo',     em:'🌱', nome:'Adubo',             est:'exausta',  preco:20, desc:'Torrão encostado numa Rocha ou maior rende $1 em vez de custar.'},
  {id:'eco',       em:'🔔', nome:'Eco',               est:'parede',   preco:25, desc:'Pedrinha encostada numa parede cospe como se fosse 1 nível maior.'},
  {id:'musgo',     em:'🍀', nome:'Musgo',             est:'parede',   preco:20, desc:'+$2 para cada parede com pedrinha encostada no fim do dia.'},
  {id:'cascalheira',em:'🪣', nome:'Cascalheira',      est:'pedras',   preco:20, desc:''},
  {id:'pedreira',  em:'🏗️', nome:'Pedreira',          est:'pedras',   preco:25, desc:''},
  {id:'rochedo',   em:'🗿', nome:'Rochedo',           est:'pedras',   preco:30, desc:''},
  {id:'regua',     em:'📏', nome:'Régua',             est:'pedras',   preco:30, desc:''},
];
const EST_COR = {pedras:'#c48a1e', miudinha:'#6aa84f', gigante:'#7a59a8', exausta:'#c0603f', parede:'#5f6b80', 'básico':'#a08a74'};

// formatos de tabuleiro: '.' casa, '#' buraco (a casa não existe), 'B' bloco de parede.
// muretas: [d, x, y] com d 'v' (entre x,y e x+1,y) ou 'h' (entre x,y e x,y+1)
const FORMAS = [
  {id:'cruz',      nome:'Cruz',          n:6, mapa:['##..##','##..##','......','......','##..##','##..##'], muretas:[]},
  {id:'anel',      nome:'Anel',          n:5, mapa:['.....','.###.','.###.','.###.','.....'], muretas:[]},
  {id:'ampulheta', nome:'Ampulheta',     n:5, mapa:['.....','#...#','##.##','#...#','.....'], muretas:[]},
  {id:'escada',    nome:'Escada',        n:5, mapa:['...##','....#','.....','#....','##...'], muretas:[]},
  {id:'saloes',    nome:'Dois salões',   n:5, mapa:['.....','.....','##.##','.....','.....'], muretas:[]},
  {id:'pilares',   nome:'Pilares',       n:5, mapa:['.....','.B.B.','.....','.B.B.','.....'], muretas:[]},
  {id:'largo',     nome:'Túnel largo',   n:5, mapa:['#####','.....','.....','.....','#####'], muretas:[]},
  {id:'zigue',     nome:'Zigue-zague',   n:5, mapa:['.....','.....','.....','.....','.....'], muretas:[['h',0,0],['h',1,0],['h',2,0],['h',3,0],['h',1,2],['h',2,2],['h',3,2],['h',4,2]]},
  {id:'quartos',   nome:'Quatro quartos',n:4, mapa:['....','....','....','....'], muretas:[['v',1,0],['v',1,3],['h',0,1],['h',3,1]]},
  {id:'coracao',   nome:'Coração',       n:7, mapa:['#..#..#','.......','.......','.......','#.....#','##...##','###.###'], muretas:[]},
  {id:'ilhas',     nome:'Ilhas',         n:7, mapa:['...####','...####','....###','###.###','###....','####...','####...'], muretas:[]},
  {id:'rio',       nome:'Rio',           n:6, mapa:['...###','....##','#....#','##....','###...','####..'], muretas:[]},
  {id:'te',        nome:'T',             n:6, mapa:['......','......','##..##','##..##','##..##','##..##'], muretas:[['v',2,3],['v',2,5]]},
  {id:'masmorra',  nome:'Masmorra',      mapa:['......','......','......','##.###','##.###','.....#','.....#','.....#','###.##','###.##','......','......'], muretas:[]},
  {id:'serpente',  nome:'Serpente',      mapa:['.....','.....','###..','###..','.....','.....','..###','..###','.....','.....'], muretas:[]},
  {id:'torre',     nome:'Torre',         mapa:['...','...','...','...','...','...','...','...','...','...','...','...'], muretas:[['h',0,3],['h',2,7]]},
  {id:'janela',    nome:'Janela',        n:6, mapa:['......','.#..#.','......','......','.#..#.','......'], muretas:[['v',2,0],['v',2,5],['h',0,2],['h',5,2]]},
];
const fw = f => f.mapa[0].length, fh = f => f.mapa.length;
const formasTodas = () => [...FORMAS, ...JSON.parse(localStorage.mina_formas||'[]')];
// no jogo, só formatos que cabem bem na tela; os longos (masmorras) ficam no laboratório
const formasJogo = () => formasTodas().filter(f=>fw(f)<=8 && fh(f)<=8);
const acharForma = id => formasTodas().find(f=>f.id===id);

// lojinha: melhorias para sempre e coisas para o próximo dia (preço base no andar 1)
const UPGRADES = [
  {id:'folego',   em:'💨', nome:'Fôlego',   desc:l=>`+5 de energia por dia.`,              preco:l=>Math.round(12*Math.pow(1.5,l))},
  {id:'picareta', em:'⛏️', nome:'Picareta', desc:l=>`+12% de chance de nascer Pedra.`,              preco:l=>Math.round(15*Math.pow(1.6,l)), max:5},
  {id:'martelo',  em:'🔨', nome:'Martelo',  desc:l=>`Cada pedrinha sorteia +1 vez e cospe a melhor.`, preco:l=>Math.round(30*Math.pow(2,l)), max:3},
  {id:'balanca',  em:'⚖️', nome:'Balança',  desc:l=>`Todo minério vale +15%.`,             preco:l=>Math.round(20*Math.pow(1.6,l))},
  {id:'assovio',  em:'🎶', nome:'Assovio',  desc:l=>`Chama uma pedrinha sem mexer o tabuleiro: ${l}x por dia.`, preco:l=>Math.round(18*Math.pow(1.7,l)), max:3},
];
// ferramentas: ficam com você entre os dias até serem usadas
const FERRAMENTAS = [
  {id:'desfazer', em:'↶',  nome:'Desfazer', desc:'Volta o último arrasto.',            preco:6, dica:''},
  {id:'picao',    em:'⚒️', nome:'Picão',    desc:'Quebra um bloco de parede ou mureta.', preco:6, dica:'toque na parede ou mureta para quebrar'},
  {id:'escavar',  em:'🕳️', nome:'Escavar',  desc:'Transforma um buraco em casa.',       preco:8, dica:'toque num buraco para cavar'},
  {id:'dinamite', em:'🧨', nome:'Dinamite', desc:'Destrói uma pedrinha ou torrão.',      preco:5, dica:'toque na pedrinha para explodir'},
  {id:'luva',     em:'🧤', nome:'Luva',     desc:'Leva uma pedrinha para outra casa.',   preco:7, dica:'toque na pedrinha e depois na casa vazia'},
];
const CONSUMIVEIS = [
  {id:'cafe',  em:'☕', nome:'Café',           desc:'+10 de energia.',            preco:5},
  {id:'sorte', em:'🍀', nome:'Pedra da sorte', desc:'Começa com uma Rocha.',     preco:8},
  {id:'pa',    em:'🧹', nome:'Pá',             desc:'Até 3 torrões de graça.',     preco:4},
];

// caminhos do mapa (from = a partir de qual semana aparece)
const PATHS = {
  comum:          {em:'⛏️', nome:'Túnel',            desc:'Dia normal de mina.', mine:true, from:1},
  rico:           {em:'💎', nome:'Gruta rica',       desc:'Muito mais Pedra, mas -10 de energia.', mine:true, energy:-10, pedra:.4, from:1},
  galeria:        {em:'🧱', nome:'Galeria',          desc:'Parede e muretas no tabuleiro. Bom para Eco e Musgo.', mine:true, walls:1, edges:3, from:1},
  corredor:       {em:'🚧', nome:'Corredor',         desc:'Muitas muretas no tabuleiro.', mine:true, edges:6, from:2},
  estreita:       {em:'🚪', nome:'Galeria estreita', desc:'Tabuleiro 3x3, total do dia ×2.', mine:true, narrow:true, n:3, from:2},
  desmoronamento: {em:'🪨', nome:'Desmoronamento',   desc:'Começa com 3 torrões. No fim, escolha entre 4 itens.', mine:true, clods:3, picks:4, from:2},
  avalanche:      {nome:'Avalanche',  desc:'Sem energia, até travar. Nascem 2 pedrinhas por arrasto.', mine:true, semEnergia:true, spawns:2, torrao:.1, from:1},
  cores:          {nome:'Duas cores', desc:'Sem energia, até travar. Roxa só junta com roxa, verde com verde; a mista junta com as duas.', mine:true, semEnergia:true, cores:true, from:1},
  salao:          {nome:'Salão',      desc:'Sem energia, até travar. Tabuleiro 5x5, duas cores e 2 pedrinhas por arrasto.', mine:true, semEnergia:true, cores:true, spawns:2, n:5, from:2},
  caverna:        {nome:'Caverna', desc:'Tabuleiro com formato diferente.', mine:true, caverna:true, from:1},
  picareta:       {nome:'Picareta e rocha', desc:'Nascem rochas e picaretas. Picareta do mesmo nível quebra a rocha na hora. Rocha que sobra não rende.', mine:true, picareta:true, lab:true, from:99},
  fogueira:       {em:'🔥', nome:'Fogueira',         desc:'Descanso: +20 de energia no próximo dia de mina.', from:3},
};
const FISCAIS = [
  {id:'rabugento', em:'😤', nome:'Fiscal rabugento', desc:'Torrão custa ×2,5.'},
  {id:'miope',     em:'🧐', nome:'Fiscal míope',     desc:'Cascalho e Pedra cospem nada.'},
  {id:'apressado', em:'⏱️', nome:'Fiscal apressado', desc:'Energia base de 25 em vez de 40.'},
  {id:'paoduro',   em:'🤑', nome:'Fiscal pão-duro',  desc:'Nada multiplica o total do dia.'},
];

