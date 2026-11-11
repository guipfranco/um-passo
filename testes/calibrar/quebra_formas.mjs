// Formatos de tabuleiro dos quebra-cabeças ('#' buraco: a casa não existe e as peças param na borda dele, como numa
// parede). Cada grupo traz as variações (giros e espelhos) e o que o formato muda na ordem dos arrastos: é isso que o
// gerador procura (quebra_receitas.mjs), e o filtro "buraco de enfeite" (pesos em quebra_medidor.js) recusa o tabuleiro
// em que tirar os buracos não muda a fase.
const gira=m=>{ const h=m.length, w=m[0].length; return Array.from({length:w},(_,x)=>Array.from({length:h},(_,y)=>m[h-1-y][x]).join('')); };
const espelha=m=>m.map(r=>[...r].reverse().join(''));
const variacoes=(m,{giros=true,espelho=false}={})=>{ const out=[]; let a=m;
  for(let i=0;i<(giros?4:1);i++){ out.push(a); if(espelho) out.push(espelha(a)); a=gira(a); }
  const vistos=new Set(); return out.filter(v=>{ const k=v.join('/'); if(vistos.has(k)) return false; vistos.add(k); return true; }); };

export const FORMAS={
  // um buraco numa casa do meio do 4x4: as peças que passam por ali param antes dele
  buraco4:{nome:'buraco no meio', muda:'um batente no meio do tabuleiro: duas peças da mesma linha só se encontram se nenhuma estiver atrás do buraco',
    mapas:variacoes(['....','.#..','....','....'])},
  // dois buracos em diagonal: a linha e a coluna de cada um ficam partidas
  buracos4:{nome:'dois buracos', muda:'duas linhas e duas colunas partidas: para juntar, a peça tem de dar a volta',
    mapas:variacoes(['....','.#..','..#.','....'])},
  // L: o 4x4 sem um canto 2x2. As duas pernas só se encontram pelo cotovelo
  L4:{nome:'L', muda:'as peças das duas pernas só se encontram pelo cotovelo; arrastar para o lado vazio prende uma perna',
    mapas:variacoes(['....','....','..##','..##'])},
  // T: barra de cima inteira e o pé de duas colunas
  T4:{nome:'T', muda:'o pé só fala com o meio da barra: as peças dos dois braços da barra ficam presas nas pontas',
    mapas:variacoes(['....','....','#..#','#..#'])},
  // U: duas torres ligadas embaixo
  U4:{nome:'U', muda:'as torres só se encontram embaixo: a peça de uma torre desce, atravessa e sobe na outra',
    mapas:variacoes(['.##.','.##.','....','....'])},
  // anel: o 4x4 sem o miolo. Nada atravessa o meio
  anel4:{nome:'anel', muda:'nada atravessa o meio: as peças dão a volta, e a ordem delas no anel decide quem encontra quem',
    mapas:[['....','.##.','.##.','....']]},
  // rosquinha: o 5x5 sem a casa do centro
  rosca5:{nome:'rosquinha', muda:'o centro vazio parte a linha e a coluna do meio: duas peças opostas não se juntam pelo centro',
    mapas:[['.....','.....','..#..','.....','.....']]},
  // escada: um canto cortado em degraus. Cada linha para num lugar diferente
  escada4:{nome:'escada', muda:'cada linha termina num degrau diferente: arrastar para a escada desalinha as peças, arrastar para longe alinha',
    mapas:variacoes(['..##','...#','....','....'],{espelho:true})},
  escada5:{nome:'escada', muda:'cada linha termina num degrau diferente: arrastar para a escada desalinha as peças, arrastar para longe alinha',
    mapas:variacoes(['..###','...##','....#','.....','.....'],{espelho:true})},
  // corredor em serpente: três faixas ligadas pelas pontas
  corredor5:{nome:'corredor', muda:'num corredor as peças não se ultrapassam: a ordem em que estão é a ordem em que se juntam',
    mapas:variacoes(['.....','####.','.....','.####','.....'],{espelho:true})},
  // cruz: o 5x5 sem os quatro cantos
  cruz5:{nome:'cruz', muda:'sem os cantos, nada fica preso num canto: as peças param nas pontas da cruz, fora do lugar',
    mapas:[['#...#','.....','.....','.....','#...#']]},
  // losango: só o miolo do 5x5
  losango5:{nome:'losango', muda:'as bordas em degrau fazem cada peça parar numa altura: a junção só sai com as peças na mesma faixa',
    mapas:[['##.##','#...#','.....','#...#','##.##']]},
  // faixas compridas: poucas linhas, a ordem ao longo da faixa manda
  faixa26:{nome:'faixa 2x6', muda:'duas linhas compridas: para cima e para baixo só troca a peça de linha, e na linha a ordem não muda',
    mapas:[['......','......']]},
  faixa25:{nome:'faixa 2x5', muda:'duas linhas compridas: para cima e para baixo só troca a peça de linha, e na linha a ordem não muda',
    mapas:[['.....','.....']]},
  faixa35:{nome:'faixa 3x5', muda:'três linhas compridas: a linha do meio é a única que encontra as duas outras',
    mapas:[['.....','.....','.....']]},
  // assimétricos: um canto mordido e um degrau do outro lado
  torto5:{nome:'torto', muda:'cada lado tem um batente diferente: o mesmo arrasto junta de um lado e separa do outro',
    mapas:[...variacoes(['...##','.....','.....','##...','##...'],{espelho:true}), ...variacoes(['#....','#....','.....','....#','..###'],{espelho:true})]},
};
// 5x5 com casas faltando ao acaso: spec {w:5, h:5, buracos:4..6} (o gerador sorteia onde)
export const FALTANDO={nome:'casas faltando', muda:'bolsos e becos: a peça que entra num bolso só sai por um lado'};
export const mapasDe=(...nomes)=>nomes.flatMap(n=>FORMAS[n].mapas);
// o formato de um mapa já pronto (para os nomes e o relatório): o grupo cujas variações contêm o mapa
export function formatoDe(mapa){ const k=mapa.map(r=>r.replace(/[^#]/g,'.')).join('/');
  for(const [id,f] of Object.entries(FORMAS)) if(f.mapas.some(m=>m.join('/')===k)) return id;
  if(mapa.some(r=>r.includes('#'))) return 'faltando';
  return null; }
