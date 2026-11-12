// Pulsar: a trilha do Clássico (o 4x4 sem fim), que pede mais ritmo. Da mesma família da Órbita, mais rápida e com batida reta.
// No Clássico a pessoa joga 10, 20 minutos seguidos, então a Pulsar anda em ciclos de 36 a 40 compassos (uns 80 s),
// e nenhum ciclo sai igual ao outro:
//   A (8 compassos): a Pulsar de sempre
//   A' (8): outro desenho de arpejo e de baixo, chimbal aberto
//   B (8): outra sequência de acordes, com melodia
//   respiro (4 ou 8): sem bumbo nem palma, baixo longo, arpejo em colcheias; no fim o chimbal e o bumbo voltam e o ruído sobe
//   volta (8): a sequência de sempre, com a melodia e chimbal em semicolcheias
// O sorteio de cada ciclo troca a sequência do B, os desenhos do arpejo e do baixo, a melodia, o tamanho do respiro e as
// viradas; a cada dois ciclos (uns 3 min) o tom muda (Si menor, Dó# menor, Lá menor ou Ré menor, voltando sempre a Si).
// Virada de bateria a cada 4 compassos, maior no fim de cada parte, e prato na entrada das partes.
// Só no começo há uma entrada de 4 compassos (arpejo abafado, depois baixo e chimbal, depois o bumbo).
import { cria, escolhe } from './eletronica.js';

const AC = {   // acorde (4 notas, do grave para o agudo) e raiz do baixo
  Bm: [[59, 62, 66, 71], 35], G: [[55, 59, 62, 67], 31], D: [[62, 66, 69, 74], 38], A: [[57, 61, 64, 69], 33],
  Em: [[55, 59, 64, 67], 40], 'F#': [[58, 61, 66, 70], 30], 'F#m': [[57, 61, 66, 69], 30], G7M: [[55, 59, 62, 66], 31],
};
const SEQ_A = ['Bm', 'G', 'D', 'A'];                                                    // a de sempre
const SEQ_B = [['G', 'A', 'F#m', 'Bm'], ['Em', 'G', 'D', 'A'], ['G', 'D', 'A', 'Bm'], ['G7M', 'A', 'F#', 'Bm']];
const SEQ_R = [['Bm', 'G'], ['G', 'Em'], ['Bm', 'G7M']];                                 // respiro: dois compassos em cada acorde
const ARP = [[0, 1, 2, 4, 2, 1, 3, 5], [0, 2, 1, 3, 2, 4, 3, 5], [4, 2, 0, 2, 5, 3, 1, 3], [0, 4, 1, 5, 2, 6, 3, 7], [0, 1, 2, 3, 4, 3, 2, 1]];
const BAIXO = [
  { baixo: [0, 3, 6, 8, 11, 14] },                                                       // o de sempre (3 + 3 + 2)
  { baixo: [0, 2, 4, 6, 8, 10, 12, 14], baixoNotas: [0, 12, 0, 12, 0, 12, 0, 12], baixoDur: 0.14 },   // oitavas
  { baixo: [0, 3, 6, 8, 11, 14], baixoNotas: [0, 0, 7, 0, 12, 7] },                      // com quinta e oitava
  { baixo: [0, 3, 6, 10, 12, 14], baixoNotas: [0, 12, 0, 0, 12, 7] },
];
const TONS = [0, 0, 2, -2, 3];   // deslocamento em semitons a partir de Si menor (o 0 pesa mais: volta para casa)
const FRACO = [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15];   // as semicolcheias que não são do chimbal de sempre
const SOBE = { 8: 0.25, 9: 0.3, 10: 0.35, 11: 0.4, 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 };

// melodia: frases de 2 compassos (pergunta e resposta), notas da pentatônica de Si menor que cabem no acorde
const PENTA = [11, 2, 4, 6, 9];
const PERGUNTA = [
  [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2]], [[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]],
  [[0, 6], [6, 2], [8, 6], [14, 2]], [[2, 2], [4, 2], [6, 4], [11, 1], [12, 4]], [[0, 3], [3, 5], [8, 3], [11, 5]],
];
const RESPOSTA = [[[0, 4], [4, 4], [8, 8]], [[0, 2], [2, 2], [4, 10]], [[0, 3], [3, 3], [6, 10]], [[4, 2], [6, 2], [8, 8]]];

const pc = m => ((m % 12) + 12) % 12;
const dobra = r => { while (r < 29) r += 12; while (r > 42) r -= 12; return r; };   // baixo sempre na mesma região
const barra = (nome, tr, extra) => { const [ch, r] = AC[nome]; return { ch: ch.map(m => m + tr), raiz: dobra(r + tr), nome, tr, ...extra }; };   // nome e tr: só para a página pulsar.html
const secao = (seq, n, tr, extra = {}) => Array.from({ length: n }, (_, i) => barra(seq[i % seq.length], tr, extra));

// notas que cabem no acorde: as dele e as da pentatônica que não ficam a meio tom de nenhuma delas
function cabem(ch, tr, baixo, alto) {
  const cs = ch.map(pc), ok = new Set(cs);
  for (const p of PENTA) { const q = pc(p + tr); if (cs.every(c => (q - c + 12) % 12 !== 1 && (c - q + 12) % 12 !== 1)) ok.add(q); }
  const notas = []; for (let m = baixo; m <= alto; m++) if (ok.has(pc(m))) notas.push(m);
  return { notas, doAcorde: notas.filter(m => cs.includes(pc(m))) };
}
const perto = (lista, alvo) => lista.reduce((a, b) => Math.abs(b - alvo) < Math.abs(a - alvo) ? b : a);

// pergunta: sobe e depois desce um pouco; resposta: desce para pousar (passos na escala, sem nota repetida)
// ip/ir escolhem o ritmo da pergunta e da resposta (a página pulsar.html); sem eles, sorteados
export function motivo(rnd, ip = null, ir = null) {
  const p = ip == null ? escolhe(rnd, PERGUNTA) : PERGUNTA[ip], r = ir == null ? escolhe(rnd, RESPOSTA) : RESPOSTA[ir], sobe = () => escolhe(rnd, [1, 1, 2]), desce = () => -escolhe(rnd, [1, 1, 2]);
  const passos = p.map((_, i) => i === 0 ? 0 : i <= p.length / 2 ? (rnd() < 0.8 ? sobe() : desce()) : (rnd() < 0.7 ? desce() : sobe()));
  r.forEach((_, i) => passos.push(i === 0 ? escolhe(rnd, [-1, 1, 2]) : rnd() < 0.75 ? desce() : sobe()));
  return { p, r, passos };
}
// escreve a melodia nos compassos (8): a mesma frase em cada par, adaptada aos acordes; a última termina na raiz.
// firme: nota longa (4 passos ou mais) também cai numa nota do acorde (sem isso, às vezes fica segurada fora dele)
function poeMelodia(cs, mot, tr, firme = false) {
  const centro = 74 + tr, baixo = centro - 9, alto = centro + 10;
  for (let par = 0; par < cs.length / 2; par++) {
    let m = null, k = 0;
    for (const [lado, ritmo] of [[0, mot.p], [1, mot.r]]) {
      const c = cs[par * 2 + lado], { notas, doAcorde } = cabem(c.ch, tr, baixo, alto); c.mel = {};
      ritmo.forEach(([st, dur], i) => {
        const ant = m, dir = Math.sign(mot.passos[k]) || 1;
        if (m === null) m = perto(doAcorde, centro + [0, 3, 0, -2][par % 4]);
        else {
          const i0 = notas.indexOf(perto(notas, m));
          let j = i0 + mot.passos[k]; if (j < 0 || j >= notas.length) j = i0 - mot.passos[k];   // bate na borda e volta
          m = notas[Math.max(0, Math.min(notas.length - 1, j))];
        }
        if (st === 0 || st === 8 || (firme && dur >= 4)) {   // nos tempos fortes, nota do acorde (sem repetir a anterior)
          m = perto(doAcorde, m);
          if (m === ant) m = doAcorde.find(x => dir > 0 ? x > m : false) ?? [...doAcorde].reverse().find(x => x < m) ?? m;
        }
        const ultima = par === cs.length / 2 - 1 && lado === 1 && i === ritmo.length - 1;
        if (ultima) m = perto(notas.filter(x => pc(x) === pc(c.raiz)), m);
        c.mel[st] = [m, dur]; k++;
      });
    }
  }
}

const viradaLeve = (rnd, c) => Object.assign(c, escolhe(rnd, [{ rolo: { 14: 0.5, 15: 0.7 } }, { bumbo: [0, 4, 8, 12, 14], rolo: { 15: 0.6 } }, { aberto: [14], rolo: { 15: 0.6 } }]));
const viradaGrande = (rnd, c) => Object.assign(c, escolhe(rnd, [
  { rolo: SOBE, palma: [4] },                                                       // caixa que cresce
  { corte: 12, rolo: { 14: 0.7, 15: 0.9 } },                                        // tudo para no último tempo
  { bumbo: [0, 4, 8, 10, 12, 14], rolo: { 12: 0.5, 13: 0.6, 14: 0.8, 15: 1 } },      // galope
]));

// Uma parte do ciclo com as escolhas dadas (o arranjo sorteia as escolhas; a página pulsar.html deixa a pessoa escolher):
//   o = { seq: nomes dos acordes, arp: índice em ARP (-1 = sem), bx: índice em BAIXO, mot: motivo da melodia (ou null),
//         firme (ver poeMelodia), n: compassos (o respiro tem 4 ou 8) }
export function montaParte(qual, o, tr, rnd) {
  const n = o.n || (qual === 'entrada' ? 4 : 8);
  const ext = {};
  if (o.arp != null) ext.arp = o.arp < 0 ? null : ARP[o.arp];
  if (o.bx != null && qual !== 'respiro') Object.assign(ext, { baixoNotas: null, baixoDur: 0.18 }, BAIXO[o.bx]);
  if (o.mot) ext.melV = 0.036;
  let cs;
  if (qual === 'entrada') {
    cs = secao(o.seq || SEQ_A, 4, tr, { ...ext, bumbo: [], palma: [], chimbal: [], baixo: [] });
    cs[0].arpLp = 700; cs[1].arpLp = 1000;
    Object.assign(cs[2], { arpLp: 1300, chimbal: [2, 6, 10, 14], baixo: BAIXO[0].baixo });
    Object.assign(cs[3], { chimbal: [2, 6, 10, 14], baixo: BAIXO[0].baixo, bumbo: [0, 4, 8, 12], sopro: 0.02, rolo: SOBE });
  } else if (qual === 'respiro') {
    const sr = o.seq || SEQ_R[0], seqR = sr.length === 2 ? [sr[0], sr[0], sr[1], sr[1]] : sr;
    cs = secao(seqR, n, tr, { bumbo: [], palma: [], chimbal: [], baixo: [0], baixoNotas: null, baixoDur: 1.6, baixoV: 0.055, pad: 0.017, padLp: 1500,
      arpCada: 2, arpDur: 0.32, arpOnda: 'triangle', arpV: 0.032, arpLp: 1200, ...ext });
    cs[0].prato = 0.02;
    Object.assign(cs[n - 2], { chimbal: [2, 6, 10, 14] });
    Object.assign(cs[n - 1], { chimbal: [2, 6, 10, 14], chimbalFraco: FRACO, bumbo: [0, 4, 8, 12], sopro: 0.022, rolo: SOBE });
  } else {
    cs = secao(o.seq || SEQ_A, n, tr, ext);
    if (qual !== "A'") cs[0].prato = qual === 'volta' ? 0.035 : 0.03;
    if (qual === "A'") cs.forEach((c, i) => { if (i % 2) c.aberto = [14]; });
    if (qual === 'volta') cs.forEach(c => { c.chimbalFraco = FRACO; });
    viradaLeve(rnd, cs[3]); (qual === 'A' ? viradaLeve : viradaGrande)(rnd, cs[7]);
  }
  if (o.mot) poeMelodia(cs, o.mot, tr, o.firme);
  cs.forEach((c, i) => { c.parte = qual; c.tamParte = n; c.j = i; });
  return cs;
}
export const OPCOES = { SEQ_A, SEQ_B, SEQ_R, ARP, BAIXO, PERGUNTA, RESPOSTA };

function arranjo(rnd, ciclo, estado) {
  if (ciclo === 0) estado.tr = 0;
  else if (ciclo % 2 === 0) estado.tr = escolhe(rnd, TONS.filter(t => t !== estado.tr));
  const tr = estado.tr, mot = motivo(rnd), out = [], i = lista => Math.floor(rnd() * lista.length);
  const arpL = 1 + i(ARP.slice(1)), arpV = i(ARP), bx1 = 1 + i(BAIXO.slice(1)), bx2 = i(BAIXO);
  if (ciclo === 0) out.push(...montaParte('entrada', {}, tr, rnd));
  out.push(...montaParte('A', {}, tr, rnd));
  out.push(...montaParte("A'", { arp: arpL, bx: bx1 }, tr, rnd));
  out.push(...montaParte('B', { seq: escolhe(rnd, SEQ_B), arp: i(ARP), mot }, tr, rnd));
  const nr = rnd() < 0.5 ? 4 : 8;
  out.push(...montaParte('respiro', { seq: escolhe(rnd, SEQ_R), n: nr }, tr, rnd));
  out.push(...montaParte('volta', { arp: arpV, bx: bx2, mot }, tr, rnd));
  out.forEach(c => { c.ciclo = ciclo; });
  return out;
}

// o que vale em todo compasso que não diz o contrário (exportado para a página pulsar.html desenhar)
export const PADRAO = {
  bpm: 112,
  pad: 0.011,
  arp: ARP[0], arpCada: 1, arpV: 0.024,
  ...BAIXO[0], baixoDur: 0.18, baixoV: 0.07,
  bumbo: [0, 4, 8, 12], bumboV: 0.13, chimbal: [2, 6, 10, 14], chimbalV: 0.03, palma: [4, 12], palmaV: 0.045,
};
export const { iniciarMusica, pararMusica } = cria({ ...PADRAO, arranjo });
