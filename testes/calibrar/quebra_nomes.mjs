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
export const NOMES={};
