// Órbita: a trilha das fases da Jornada (aprovada no rascunho som.html). Arpejo que gira, baixo, batida leve.
// Varia com moderação, em ciclos de 36 compassos (uns 86 s), sem mudar de tom nem ganhar melodia:
//   A (8 compassos): a Órbita de sempre
//   A' (8): outro desenho de arpejo e de baixo, chimbal aberto de vez em quando
//   B (8): outra sequência de acordes, com o arpejo e o baixo de sempre
//   A (8): a de sempre de novo
//   respiro (4): sem bumbo nem palma, baixo longo; no fim o ruído sobe e a caixa cresce
// O sorteio de cada ciclo troca o desenho do A', a sequência do B e as viradas (a cada 4 compassos).
import { cria, escolhe } from './eletronica.js';

const AC = {   // acorde (4 notas) e raiz do baixo
  D7M: [[62, 66, 69, 73], 38], Bm7: [[59, 62, 66, 69], 35], G7M: [[55, 59, 62, 66], 31], A6: [[57, 61, 64, 66], 33],
  Em7: [[55, 59, 62, 64], 40], A: [[57, 61, 64, 69], 33], 'F#m7': [[57, 61, 64, 66], 30],
};
const SEQ_A = ['D7M', 'Bm7', 'G7M', 'A6'];                               // a de sempre: Ré, Si menor, Sol, Lá
const SEQ_B = [['Bm7', 'G7M', 'Em7', 'A'], ['G7M', 'A6', 'F#m7', 'Bm7']];
const ARP = [[0, 1, 2, 3, 6, 7, 2, 1], [0, 1, 2, 3, 7, 6, 3, 2], [0, 2, 1, 3, 6, 4, 7, 5], [3, 2, 1, 0, 4, 5, 6, 7]];
const BAIXO = [{ baixo: [0, 4, 8, 10, 12, 14], baixoNotas: [0, 0, 0, 12, 0, 7] }, { baixo: [0, 4, 6, 8, 12, 14], baixoNotas: [0, 0, 12, 0, 0, 7] }];
const SOBE = { 8: 0.25, 9: 0.3, 10: 0.35, 11: 0.4, 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 };

const barra = (nome, extra) => { const [ch, raiz] = AC[nome]; return { ch, raiz, ...extra }; };
const secao = (seq, n, extra = {}) => Array.from({ length: n }, (_, i) => barra(seq[i % seq.length], extra));
const viradaLeve = (rnd, c) => Object.assign(c, escolhe(rnd, [{ rolo: { 14: 0.5, 15: 0.7 } }, { bumbo: [0, 8, 14] }, { aberto: [14], rolo: { 15: 0.6 } }]));
const viradaGrande = (rnd, c) => Object.assign(c, escolhe(rnd, [{ rolo: SOBE, palma: [4] }, { corte: 12, rolo: { 14: 0.7, 15: 0.9 } }]));

function arranjo(rnd, ciclo) {
  const a = secao(SEQ_A, 8); if (ciclo > 0) a[0].prato = 0.025; viradaLeve(rnd, a[3]); viradaLeve(rnd, a[7]);
  const a2 = secao(SEQ_A, 8, { arp: escolhe(rnd, ARP.slice(1)), ...escolhe(rnd, BAIXO) }); a2.forEach((c, i) => { if (i % 2) c.aberto = [14]; });
  viradaLeve(rnd, a2[3]); viradaGrande(rnd, a2[7]);
  const b = secao(escolhe(rnd, SEQ_B), 8); b[0].prato = 0.025; viradaLeve(rnd, b[3]); viradaGrande(rnd, b[7]);
  const a3 = secao(SEQ_A, 8); viradaLeve(rnd, a3[3]); Object.assign(a3[7], { corte: 12, rolo: { 14: 0.6, 15: 0.8 } });
  const r = secao(SEQ_A, 4, { bumbo: [], palma: [], chimbal: [14], baixo: [0], baixoDur: 1.2, baixoV: 0.06, pad: 0.016, padLp: 1400, arpV: 0.022, arpLp: 1000 });
  Object.assign(r[3], { chimbal: [2, 6, 10, 14], sopro: 0.018, rolo: SOBE });
  return [...a, ...a2, ...b, ...a3, ...r];
}

export const { iniciarMusica, pararMusica } = cria({
  bpm: 100, arranjo,
  pad: 0.012,
  arp: ARP[0], arpCada: 1, arpV: 0.026,
  baixo: [0, 4, 8, 12, 14], baixoV: 0.07,
  bumbo: [0, 8], bumboV: 0.14, chimbal: [2, 6, 10, 14], chimbalV: 0.028, palma: [4, 12], palmaV: 0.04,
});
