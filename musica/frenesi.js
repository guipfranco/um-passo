// Frenesi: a trilha do modo Frenesi (em teste, nome provisório). Da família da Pulsar, em Lá menor, batida reta, e com
// camadas que entram com a intensidade (0 a 1), que o jogo manda a cada degrau da corrente (intensidade() em eletronica.js):
//   ×1 (0): arpejo abafado, baixo, bumbo nos tempos 1 e 3, chimbal no contratempo
//   ×2: bumbo em todos os tempos            ×3: palma nos tempos 2 e 4
//   ×5: chimbal em semicolcheias e baixo em oitavas
//   ×8: acordes curtos de serra (stab) no contratempo e chimbal aberto
//   ×12: melodia de serra e caixa subindo a cada dois compassos
//   ×20 (1): arpejo uma oitava acima, prato em todo compasso, ruído subindo, galope no bumbo
// A cada degrau o filtro do arpejo abre mais e o andamento sobe (de 118 a 134 bpm, deslizando). Quando a corrente cai, o
// jogo manda intensidade 0: as camadas saem e o motor fecha e reabre o filtro geral (o "desligar").
// Arranjo em ciclos de 16 compassos (A e B, com viradas), sem respiro: quem decide a energia é a corrente.
import { cria, escolhe } from './eletronica.js';

const AC = {   // acorde (4 notas, do grave para o agudo) e raiz do baixo
  Am: [[57, 60, 64, 69], 33], F: [[53, 57, 60, 65], 29], C: [[55, 60, 64, 67], 36], G: [[55, 59, 62, 67], 31],
  Em: [[55, 59, 64, 67], 40], Dm: [[57, 62, 65, 69], 38],
};
const SEQ_A = ['Am', 'F', 'C', 'G'];
const SEQ_B = [['F', 'G', 'Em', 'Am'], ['Dm', 'F', 'C', 'G'], ['F', 'C', 'G', 'Am']];
const ARP = [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 4, 2, 1, 3, 5, 3], [4, 2, 0, 2, 5, 3, 1, 3], [0, 4, 1, 5, 2, 6, 3, 7]];
const FRACO = [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15];   // as semicolcheias que não são do chimbal de sempre
const OITAVAS = { baixo: [0, 2, 4, 6, 8, 10, 12, 14], baixoNotas: [0, 12, 0, 12, 0, 12, 0, 12], baixoDur: 0.14 };
const SOBE = { 8: 0.25, 9: 0.3, 10: 0.35, 11: 0.4, 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 };
// melodia das camadas altas: notas do próprio acorde, uma oitava acima ([passo, duração, índice no acorde])
const RIFF = [[0, 2, 3], [2, 2, 2], [4, 2, 1], [6, 2, 2], [8, 3, 3], [11, 3, 2], [14, 2, 1]];
const riff = ch => Object.fromEntries(RIFF.map(([st, d, i]) => [st, [ch[i] + 12, d]]));

const barra = (nome, extra) => { const [ch, raiz] = AC[nome]; return { ch, raiz, ...extra }; };
const secao = (seq, n, extra = {}) => Array.from({ length: n }, (_, i) => barra(seq[i % seq.length], extra));
const viradaLeve = (rnd, c) => Object.assign(c, escolhe(rnd, [{ rolo: { 14: 0.5, 15: 0.7 } }, { bumbo: [0, 4, 8, 12, 14], rolo: { 15: 0.6 } }, { aberto: [14], rolo: { 15: 0.6 } }]));
const viradaGrande = (rnd, c) => Object.assign(c, escolhe(rnd, [
  { rolo: SOBE, palma: [4] },
  { corte: 12, rolo: { 14: 0.7, 15: 0.9 } },
  { bumbo: [0, 4, 8, 10, 12, 14], rolo: { 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 } },
]));

function arranjo(rnd, ciclo) {
  const a = secao(SEQ_A, 8, { arp: ciclo % 2 ? escolhe(rnd, ARP.slice(1)) : ARP[0] });
  a[0].prato = 0.025; viradaLeve(rnd, a[3]); viradaGrande(rnd, a[7]);
  const b = secao(escolhe(rnd, SEQ_B), 8, { arp: escolhe(rnd, ARP) });
  b[0].prato = 0.025; viradaLeve(rnd, b[3]); viradaGrande(rnd, b[7]);
  return [...a, ...b];
}

const junta = (a, b) => [...new Set([...(a || []), ...b])].sort((x, y) => x - y);
// o compasso com as camadas da intensidade I (degrau k de 0 a 6); n = número do compasso
function camadas(B, I, n) {
  const k = Math.round(I * 6); if (!k) return B;
  const c = { ...B };
  c.arpLp = (B.arpLp || 1200) + 450 * k; c.arpV = B.arpV * (1 + 0.06 * k); c.pad = B.pad + 0.0015 * k;
  c.bumbo = junta(B.bumbo, [0, 4, 8, 12]);
  if (k >= 2) c.palma = junta(B.palma, [4, 12]);
  if (k >= 3) { c.chimbalFraco = FRACO; if (!B.baixoNotas) Object.assign(c, OITAVAS); }
  if (k >= 4) { c.stab = [2, 6, 10, 14]; c.aberto = junta(B.aberto, [2, 10]); }
  if (k >= 5) { c.mel = riff(B.ch); c.melV = 0.026; if (n % 2 && !B.rolo) c.rolo = { 12: 0.35, 13: 0.45, 14: 0.6, 15: 0.8 }; }
  if (k >= 6) { c.arpOit = 1; c.prato = Math.max(B.prato || 0, 0.03); if (n % 2) c.sopro = 0.02; c.bumbo = junta(c.bumbo, [14]); c.stabV = 0.026; }
  return c;
}

export const { iniciarMusica, pararMusica, intensidade, acento, batida } = cria({
  bpm: 118, tempo: I => 118 + 16 * I, arranjo, camadas,
  pad: 0.011,
  arp: ARP[0], arpCada: 1, arpV: 0.022, arpLp: 1200,
  baixo: [0, 3, 6, 8, 11, 14], baixoDur: 0.18, baixoV: 0.07,
  bumbo: [0, 8], bumboV: 0.13, chimbal: [2, 6, 10, 14], chimbalV: 0.03, palma: [], palmaV: 0.045,
  stabV: 0.02, melOnda: 'sawtooth', melLp: 2800,
});
