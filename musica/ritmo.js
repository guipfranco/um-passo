// Ritmo: a trilha do Frenesi de ritmo (?fregra=ritmo). Lá menor, 112 bpm FIXO (andamento que acelera atrapalha acertar
// a batida). A música é do tamanho do combo: começa quase só com o bumbo, bem baixinho, e a cada acerto na batida o jogo
// manda a intensidade (o combo / 40) e ela ganha volume e instrumentos, um degrau por vez:
//   0  bumbo nos quatro tempos e um fundo de acordes quase inaudível (só para ouvir onde está o tempo)
//   1  chimbal no contratempo           2  baixo na fundamental
//   3  arpejo abafado                   4  palma nos tempos 2 e 4
//   5  arpejo abrindo e chimbal em semicolcheias
//   6  baixo em oitavas                 7  acordes curtos (stab) no contratempo
//   8  melodia                          9  chimbal aberto e caixa subindo a cada dois compassos
//   10 (combo 40 ou mais) arpejo uma oitava acima, prato e ruído subindo
// O volume também sobe (volume(I)): de uns 15% no começo até cheio. Errou a batida: o combo zera e a música volta ao
// começo (o motor fecha o filtro e reabre). As junções tocam DENTRO da música (toca() em eletronica.js: nota do acorde
// que está soando, encaixada na grade).
import { cria, escolhe } from './eletronica.js';

const AC = {
  Am: [[57, 60, 64, 69], 33], F: [[53, 57, 60, 65], 29], C: [[55, 60, 64, 67], 36], G: [[55, 59, 62, 67], 31],
  Em: [[55, 59, 64, 67], 40], Dm: [[57, 62, 65, 69], 38],
};
const SEQ_A = ['Am', 'F', 'C', 'G'];
const SEQ_B = [['F', 'G', 'Em', 'Am'], ['Dm', 'F', 'C', 'G'], ['F', 'C', 'G', 'Am']];
const ARP = [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 4, 2, 1, 3, 5, 3], [0, 4, 1, 5, 2, 6, 3, 7]];
const FRACO = [1, 3, 5, 7, 9, 11, 13, 15];
const SOBE = { 12: 0.35, 13: 0.45, 14: 0.6, 15: 0.8 };
const RIFF = [[0, 2, 3], [2, 2, 2], [4, 2, 1], [6, 2, 2], [8, 3, 3], [11, 3, 2], [14, 2, 1]];
const riff = ch => Object.fromEntries(RIFF.map(([st, d, i]) => [st, [ch[i] + 12, d]]));
const barra = nome => { const [ch, raiz] = AC[nome]; return { ch, raiz }; };
const secao = (seq, n, extra = {}) => Array.from({ length: n }, (_, i) => ({ ...barra(seq[i % seq.length]), ...extra }));

function arranjo(rnd, ciclo) {
  const a = secao(SEQ_A, 8, { arp: ciclo % 2 ? escolhe(rnd, ARP.slice(1)) : ARP[0] });
  const b = secao(escolhe(rnd, SEQ_B), 8, { arp: escolhe(rnd, ARP) });
  return [...a, ...b];
}
const junta = (a, b) => [...new Set([...(a || []), ...b])].sort((x, y) => x - y);
// o compasso com as camadas da intensidade I (degrau k de 0 a 10)
function camadas(B, I, n) {
  const k = Math.min(10, Math.floor(I * 10 + 1e-6)), c = { ...B };
  c.bumbo = [0, 4, 8, 12]; c.pad = 0.004 + 0.0011 * k;
  c.chimbal = k >= 1 ? [2, 6, 10, 14] : [];
  c.baixo = k >= 2 ? [0, 3, 6, 8, 11, 14] : [];
  c.arp = k >= 3 ? B.arp : null; c.arpLp = 900 + 260 * Math.max(0, k - 3); c.arpV = 0.018 + 0.0015 * k;
  c.palma = k >= 4 ? [4, 12] : [];
  if (k >= 5) c.chimbalFraco = FRACO;
  if (k >= 6) Object.assign(c, { baixo: [0, 2, 4, 6, 8, 10, 12, 14], baixoNotas: [0, 12, 0, 12, 0, 12, 0, 12], baixoDur: 0.14 });
  if (k >= 7) c.stab = [2, 6, 10, 14];
  if (k >= 8) { c.mel = riff(B.ch); c.melV = 0.024; }
  if (k >= 9) { c.aberto = [2, 10]; if (n % 2) c.rolo = SOBE; }
  if (k >= 10) { c.arpOit = 1; c.prato = 0.028; if (n % 2) c.sopro = 0.018; c.bumbo = junta(c.bumbo, [14]); c.stabV = 0.024; }
  return c;
}

export const { iniciarMusica, pararMusica, intensidade, acento, batida, toca } = cria({
  bpm: 112, arranjo, camadas,
  volume: I => 0.15 + 0.85 * Math.pow(I, 0.8),
  pad: 0.004, padLp: 900,
  arp: ARP[0], arpCada: 1, arpV: 0.02, arpLp: 900,
  baixo: [], baixoDur: 0.18, baixoV: 0.07,
  bumbo: [0, 4, 8, 12], bumboV: 0.13, chimbal: [], chimbalV: 0.03, palma: [], palmaV: 0.045,
  stabV: 0.02, melOnda: 'sawtooth', melLp: 2800,
});
