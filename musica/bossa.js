// O Gabinete: música de espera de repartição (bossa-lounge de elevador), toda sintetizada em Web Audio.
//
// Quatro camadas, uma por medidor (como no Reigns):
//   f (Família)  -> piano elétrico (FM simples, autopan de "suitcase")
//   o (Opinião)  -> cordas: pad de sawtooth desafinados + lowpass, e às vezes a melodia
//   j (Blindagem)-> metais curtos + vassourinha, aro, chocalho e bumbo macio
//   c (Caixa)    -> baixo redondo (seno + um pouco de triângulo, lowpass)
// O volume de cada camada segue o medidor (50 = normal, 0 quase some, 100 alto). Em perigo (<=15 ou >=85)
// a camada desafina oscilando (LFO no detune de cada fonte, ~±20 a 40 cents).
//
// API:
//   iniciarMusica(ctx, destino)  niveis({ f, o, j, c })  pararMusica(fade = 1.5)  tensao(v)

const BPM = 88;
const TEMPO = 60 / BPM;          // uma semínima
const PASSO = TEMPO / 4;         // semicolcheia: a grade do agendador
const ANTECEDENCIA = 0.1;        // agenda 100 ms à frente
const INTERVALO_MS = 25;
const VOLUME_MUSICA = 0.36;       // fica atrás das falas e dos efeitos

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const humano = () => (Math.random() - 0.5) * 0.008;

// ---------------------------------------------------------------- partitura
// 8 compassos em Dó maior: Cmaj9 | A7(b9) | Dm9 | G13 | Em7 A13 | Dm9 | Fm6 | G7sus4 G7(b9)
// v = voicing do piano (sem fundamental), r = fundamental do baixo, q = quinta/nota de passagem
const HARMONIA = [
  [{ b: 0, v: [52, 55, 59, 62], r: 36, q: 43 }],
  [{ b: 0, v: [55, 58, 61, 64], r: 33, q: 40 }],
  [{ b: 0, v: [53, 57, 60, 64], r: 38, q: 45 }],
  [{ b: 0, v: [53, 59, 64, 69], r: 43, q: 38 }],
  [{ b: 0, v: [55, 59, 62, 64], r: 40, q: 35 }, { b: 2, v: [55, 61, 64, 66], r: 45, q: 40 }],
  [{ b: 0, v: [53, 57, 60, 64], r: 38, q: 45 }],
  [{ b: 0, v: [56, 60, 62, 65], r: 41, q: 36 }],
  [{ b: 0, v: [53, 57, 60, 62], r: 43, q: 38 }, { b: 2, v: [53, 56, 59, 62], r: 43, q: 38 }],
];

// [compasso, tempo, nota, duração em tempos]
const MELODIA = [
  [0, 0, 67, 1.5], [0, 1.5, 76, 1], [0, 2.5, 74, 0.5], [0, 3, 71, 1],
  [1, 0, 73, 1.5], [1, 1.5, 70, 0.5], [1, 2, 69, 2],
  [2, 1, 69, 0.5], [2, 1.5, 72, 0.5], [2, 2, 76, 1.5], [2, 3.5, 74, 0.5],
  [3, 0, 74, 1.5], [3, 1.5, 71, 0.5], [3, 2, 69, 0.5], [3, 2.5, 67, 1.5],
  [4, 0, 67, 0.5], [4, 0.5, 71, 0.5], [4, 1, 74, 1], [4, 2, 73, 1.5],
  [5, 0, 76, 1.5], [5, 1.5, 74, 0.5], [5, 2, 72, 0.5], [5, 2.5, 69, 1.5],
  [6, 0, 68, 1.5], [6, 1.5, 72, 0.5], [6, 2, 74, 2],
  [7, 0, 72, 1], [7, 1, 71, 0.5], [7, 1.5, 67, 2.5],
];

// metais: [compasso, tempo, notas, duração em tempos, queda?]
const METAIS_SEMPRE = [
  [3, 2.5, [65, 71], 0.2], [3, 3, [65, 71], 0.45],
  [7, 3, [65, 71], 0.6, true],                       // o "fuén" brega antes de voltar ao começo
];
const METAIS_RESPOSTA = [                            // respondem a melodia nas pausas
  [2, 0, [65, 69], 0.2], [2, 0.5, [65, 69], 0.4],
  [4, 3.5, [64, 67], 0.35],
  [6, 3.5, [65, 68], 0.3],
];
const METAIS_GROOVE = [                              // ciclos sem melodia: os metais falam um pouco mais
  [0, 2.5, [64, 71], 0.2], [0, 3, [64, 71], 0.4],
  [1, 3.5, [61, 67], 0.3],
  [5, 2.5, [65, 72], 0.2], [5, 3, [64, 72], 0.45],
];

// ---------------------------------------------------------------- estado
let S = null;
const alvo = { f: 50, o: 50, j: 50, c: 50 };
let tensaoAlvo = 0;

function ganhoDoNivel(v) {
  v = limitar(+v || 0, 0, 100);
  if (v <= 50) return 0.06 + 0.94 * Math.pow(v / 50, 1.4);
  return 1 + 0.85 * ((v - 50) / 50);
}
// profundidade da desafinação em cents (o LFO soma ~1,15x isso no pico)
function centsDoNivel(v) {
  v = limitar(+v || 0, 0, 100);
  if (v <= 15) return 18 + 16 * (15 - v) / 15;
  if (v >= 85) return 18 + 16 * (v - 85) / 15;
  return 0;
}

const cacheRuido = new WeakMap();
function ruido(ctx) {
  let b = cacheRuido.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    cacheRuido.set(ctx, b);
  }
  return b;
}

function impulso(ctx, dur = 1.7) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      const pre = t < 0.012 ? 0 : 1;                              // pré-delay curto
      lp += 0.35 * ((Math.random() * 2 - 1) - lp);                 // tira o chiado de cima
      d[i] = lp * pre * Math.exp(-t * 3.4) * (1 - Math.exp(-t * 60));
    }
  }
  return b;
}

// ---------------------------------------------------------------- camadas
function criarCamada(ctx, s, { pan = 0, envio = 0.2, lfoHz = 0.4, filtro = null, autopan = 0 }) {
  const nos = [];
  const novo = n => (nos.push(n), n);
  let entrada;
  if (filtro) {
    entrada = novo(ctx.createBiquadFilter());
    entrada.type = 'lowpass'; entrada.frequency.value = filtro.f; entrada.Q.value = filtro.q ?? 0.5;
  } else entrada = novo(ctx.createGain());
  const vol = novo(ctx.createGain());
  vol.gain.value = 0;
  entrada.connect(vol);
  let saida = vol;
  const osc = [];
  if (ctx.createStereoPanner) {
    const p = novo(ctx.createStereoPanner());
    p.pan.value = pan;
    vol.connect(p); saida = p;
    if (autopan) {
      const l = novo(ctx.createOscillator()); l.frequency.value = 2.9;
      const lg = novo(ctx.createGain()); lg.gain.value = autopan;
      l.connect(lg).connect(p.pan); osc.push(l);
    }
  }
  saida.connect(s.barramento);
  const env = novo(ctx.createGain()); env.gain.value = envio;
  saida.connect(env).connect(s.reverb);

  // desafinação de perigo: dois LFOs somados (um lento que puxa, um rápido que "treme")
  const l1 = novo(ctx.createOscillator()); l1.frequency.value = lfoHz;
  const l2 = novo(ctx.createOscillator()); l2.frequency.value = 4.6 + Math.random() * 1.4;
  const g2 = novo(ctx.createGain()); g2.gain.value = 0.15;
  const prof = novo(ctx.createGain()); prof.gain.value = 0;
  l1.connect(prof); l2.connect(g2).connect(prof);
  osc.push(l1, l2);
  for (const o of osc) o.start();
  s.nos.push(...nos); s.osc.push(...osc);
  return { entrada, vol, prof };
}

// Liga as fontes ao LFO de desafinação da camada e limpa tudo quando a última terminar.
function soltar(camada, nos, fontes, extra = []) {
  for (const f of fontes) if (f.detune) camada.prof.connect(f.detune);
  for (const p of extra) camada.prof.connect(p);
  fontes[fontes.length - 1].onended = () => {
    for (const f of fontes) if (f.detune) { try { camada.prof.disconnect(f.detune); } catch (e) {} }
    for (const p of extra) { try { camada.prof.disconnect(p); } catch (e) {} }
    for (const n of nos) { try { n.disconnect(); } catch (e) {} }
  };
}

// ---------------------------------------------------------------- instrumentos
function rhodes(s, t, m, dur, vel = 1, lead = false) {
  const ctx = s.ctx, cam = s.cam.f, f = mtof(m);
  const car = ctx.createOscillator(), mod = ctx.createOscillator();
  const mg = ctx.createGain(), amp = ctx.createGain();
  car.frequency.value = f; mod.frequency.value = f;
  const brilho = Math.sqrt(Math.min(1, 330 / f));
  const idx = f * (lead ? 1.9 : 1.4) * vel * brilho;
  mg.gain.setValueAtTime(idx, t);
  mg.gain.setTargetAtTime(f * 0.22 * brilho, t, 0.13);
  const pico = (lead ? 0.14 : 0.075) * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.005);
  amp.gain.setTargetAtTime(pico * 0.3, t + 0.005, 0.7);
  amp.gain.setTargetAtTime(0, t + dur, 0.09);
  mod.connect(mg).connect(car.frequency);
  car.connect(amp).connect(cam.entrada);
  const fim = t + dur + 0.6;
  mod.start(t); car.start(t); mod.stop(fim); car.stop(fim);
  soltar(cam, [car, mod, mg, amp], [mod, car]);
}

function baixo(s, t, m, dur, vel = 1) {
  const ctx = s.ctx, cam = s.cam.c, f = mtof(m);
  const sen = ctx.createOscillator(), tri = ctx.createOscillator();
  const tg = ctx.createGain(), amp = ctx.createGain();
  sen.frequency.value = f; tri.type = 'triangle'; tri.frequency.value = f; tg.gain.value = 0.35;
  const pico = 0.17 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.012);
  amp.gain.setTargetAtTime(pico * 0.55, t + 0.012, 0.35);
  amp.gain.setTargetAtTime(0, t + dur, 0.05);
  sen.connect(amp); tri.connect(tg).connect(amp); amp.connect(cam.entrada);
  const fim = t + dur + 0.35;
  sen.start(t); tri.start(t); sen.stop(fim); tri.stop(fim);
  soltar(cam, [sen, tri, tg, amp], [sen, tri]);
}

function pad(s, t, notas, dur) {
  const ctx = s.ctx, cam = s.cam.o;
  for (const m of notas) {
    const a = ctx.createOscillator(), b = ctx.createOscillator(), amp = ctx.createGain();
    a.type = b.type = 'sawtooth';
    a.frequency.value = b.frequency.value = mtof(m);
    a.detune.value = -7 - Math.random() * 3; b.detune.value = 7 + Math.random() * 3;
    const pico = 0.038;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(pico, t + 0.45);
    amp.gain.setValueAtTime(pico, t + dur);
    amp.gain.setTargetAtTime(0, t + dur, 0.3);
    a.connect(amp); b.connect(amp); amp.connect(cam.entrada);
    const fim = t + dur + 1.6;
    a.start(t); b.start(t); a.stop(fim); b.stop(fim);
    soltar(cam, [a, b, amp], [a, b]);
  }
}

function cordaSolo(s, t, m, dur) {
  const ctx = s.ctx, cam = s.cam.o;
  const a = ctx.createOscillator(), b = ctx.createOscillator(), amp = ctx.createGain();
  a.type = b.type = 'sawtooth';
  a.frequency.value = b.frequency.value = mtof(m);
  a.detune.value = -5; b.detune.value = 5;
  const pico = 0.085;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.07);
  amp.gain.setValueAtTime(pico, t + dur);
  amp.gain.setTargetAtTime(0, t + dur, 0.12);
  a.connect(amp); b.connect(amp); amp.connect(cam.entrada);
  const fim = t + dur + 0.8;
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  s.vibrato.connect(a.detune); s.vibrato.connect(b.detune);
  soltar(cam, [a, b, amp], [a, b]);
  b.addEventListener('ended', () => { try { s.vibrato.disconnect(a.detune); s.vibrato.disconnect(b.detune); } catch (e) {} });
}

function metal(s, t, notas, dur, queda = false) {
  const ctx = s.ctx, cam = s.cam.j;
  for (const m of notas) {
    const a = ctx.createOscillator(), b = ctx.createOscillator();
    const lp = ctx.createBiquadFilter(), amp = ctx.createGain();
    a.type = b.type = 'sawtooth';
    a.frequency.value = b.frequency.value = mtof(m);
    // "scoop" na entrada; na queda, o bend para baixo no fim
    for (const [o, base] of [[a, -8], [b, 8]]) {
      o.detune.setValueAtTime(base - 55, t);
      o.detune.linearRampToValueAtTime(base, t + 0.06);
      if (queda) {
        o.detune.setValueAtTime(base, t + dur - 0.02);
        o.detune.linearRampToValueAtTime(base - 650, t + dur + 0.32);
      }
    }
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(320, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + 0.035);
    lp.frequency.setTargetAtTime(1100, t + 0.035, 0.09);
    const pico = 0.05;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(pico, t + 0.02);
    amp.gain.setTargetAtTime(pico * 0.7, t + 0.02, 0.12);
    amp.gain.setTargetAtTime(0, t + dur, queda ? 0.13 : 0.035);
    a.connect(lp); b.connect(lp); lp.connect(amp).connect(cam.entrada);
    const fim = t + dur + (queda ? 0.8 : 0.3);
    a.start(t); b.start(t); a.stop(fim); b.stop(fim);
    soltar(cam, [a, b, lp, amp], [a, b]);
  }
}

function golpe(s, t, filtro, pico, ataque, queda, taxa = 1) {
  const ctx = s.ctx;
  const src = ctx.createBufferSource(), amp = ctx.createGain();
  src.buffer = s.ruido; src.playbackRate.value = taxa;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + ataque);
  amp.gain.setTargetAtTime(0, t + ataque, queda);
  src.connect(amp).connect(filtro);
  src.start(t, Math.random() * 1.4);
  src.stop(t + ataque + queda * 6);
  soltar(s.cam.j, [src, amp], [src]);
}

function bumbo(s, t, vel) {
  const ctx = s.ctx;
  const o = ctx.createOscillator(), amp = ctx.createGain();
  o.frequency.setValueAtTime(115, t);
  o.frequency.exponentialRampToValueAtTime(47, t + 0.11);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.38 * vel, t + 0.004);
  amp.gain.setTargetAtTime(0, t + 0.004, 0.085);
  o.connect(amp).connect(s.cam.j.entrada);
  o.start(t); o.stop(t + 0.55);
  soltar(s.cam.j, [o, amp], [o]);
}

// ---------------------------------------------------------------- arranjo de um compasso
function montarCompasso(s, ciclo, comp) {
  const ev = [];
  const add = (b, fn) => ev.push([b, fn]);
  const acordes = HARMONIA[comp];
  const acordeEm = b => acordes.filter(a => a.b <= b).pop();
  const tipo = ciclo % 3;                // 0 = groove (sem melodia), 1 = melodia, 2 = melodia trocada + respostas
  const temMelodia = tipo !== 0;

  // piano: comping de bossa em dois compassos
  const ritmo = comp % 2 === 0 ? [[0, 1.2], [1.5, 0.4], [3, 0.8]] : [[1, 0.45], [2.5, 1.3]];
  const velComp = temMelodia ? 0.7 : 0.95;
  for (const [b, d] of ritmo) {
    const a = acordeEm(b);
    add(b, t => a.v.forEach((m, i) => rhodes(s, t + i * 0.007, m, d * TEMPO, velComp * (0.9 + Math.random() * 0.2))));
  }

  // cordas: pad
  acordes.forEach((a, i) => {
    const fimB = i + 1 < acordes.length ? acordes[i + 1].b : 4;
    add(a.b, t => pad(s, t, a.v.slice(1).map(m => m + 12), (fimB - a.b) * TEMPO));
  });

  // baixo
  const padraoBaixo = acordes.length === 1
    ? [[0, acordes[0].r, 1.45], [1.5, acordes[0].q, 0.45], [2, acordes[0].q, 1.45], [3.5, acordes[0].r, 0.45]]
    : [[0, acordes[0].r, 1.45], [1.5, acordes[0].q, 0.45], [2, acordes[1].r, 1.45], [3.5, acordes[1].q, 0.45]];
  for (const [b, m, d] of padraoBaixo) add(b, t => baixo(s, t, m, d * TEMPO, b % 1 ? 0.8 : 1));

  // melodia: no ciclo 1 o piano canta a primeira metade e as cordas a segunda; no ciclo 2, ao contrário
  if (temMelodia) {
    const pianoPrimeiro = tipo === 1;
    for (const [c, b, m, d] of MELODIA) {
      if (c !== comp) continue;
      const noPiano = (comp < 4) === pianoPrimeiro;
      add(b, t => noPiano ? rhodes(s, t, m + 12, d * TEMPO * 0.95, 1, true) : cordaSolo(s, t, m + 12, d * TEMPO * 0.92));
    }
  }

  // metais
  const metais = [...METAIS_SEMPRE, ...(tipo === 2 ? METAIS_RESPOSTA : []), ...(tipo === 0 ? METAIS_GROOVE : [])];
  for (const [c, b, notas, d, queda] of metais) if (c === comp) add(b, t => metal(s, t, notas, d * TEMPO, !!queda));

  // percussão
  const p = s.perc;
  for (const [b, v] of [[0, 1], [1.5, 0.45], [2, 0.85], [3.5, 0.45]]) add(b, t => bumbo(s, t, v));
  for (let b = 0; b < 4; b++) add(b, t => golpe(s, t, p.varre, 0.16, 0.13, 0.12, 0.9 + Math.random() * 0.2));
  for (const b of [1, 3]) add(b, t => golpe(s, t, p.tapa, 0.32, 0.004, 0.06));
  for (const b of (comp % 2 === 0 ? [0, 1.5, 3] : [1, 2.5])) add(b, t => golpe(s, t, p.aro, 0.55, 0.001, 0.018));
  for (let k = 0; k < 8; k++) add(k / 2, t => golpe(s, t, p.chocalho, k % 2 ? 0.13 : 0.07, 0.008, 0.03, 0.95 + Math.random() * 0.1));

  // agrupa por semicolcheia
  const baldes = Array.from({ length: 16 }, () => []);
  for (const [b, fn] of ev) baldes[Math.round(b * 4) % 16].push(fn);
  return baldes;
}

function agendarPasso(s, passo, t) {
  const compAbs = Math.floor(passo / 16), k = passo % 16;
  if (k === 0) s.baldes = montarCompasso(s, Math.floor(compAbs / 8), compAbs % 8);
  if (!s.baldes) return;
  for (const fn of s.baldes[k]) fn(Math.max(s.ctx.currentTime, t + humano()));
}

function tick(s) {
  const agora = s.ctx.currentTime;
  if (s.proxTempo < agora - 0.15) {
    // atrasou (aba em segundo plano, celular travou): pula para o próximo compasso em vez de despejar notas
    let p = s.proxPasso + Math.ceil((agora - s.proxTempo) / PASSO);
    p = Math.ceil(p / 16) * 16;
    s.proxTempo += (p - s.proxPasso) * PASSO; s.proxPasso = p;
  }
  const frente = (typeof document !== 'undefined' && document.hidden) ? 1.2 : ANTECEDENCIA;
  while (s.proxTempo < agora + frente) {
    agendarPasso(s, s.proxPasso, s.proxTempo);
    s.proxPasso++; s.proxTempo += PASSO;
  }
}

function aplicarNiveis(s, imediato) {
  const t = s.ctx.currentTime;
  for (const k of ['f', 'o', 'j', 'c']) {
    const cam = s.cam[k];
    const g = ganhoDoNivel(alvo[k]), d = centsDoNivel(alvo[k]);
    if (imediato) { cam.vol.gain.setValueAtTime(g, t); cam.prof.gain.setValueAtTime(d, t); }
    else { cam.vol.gain.setTargetAtTime(g, t, 0.2); cam.prof.gain.setTargetAtTime(d, t, 0.25); }
  }
}

function aplicarTensao(s, imediato) {
  const t = s.ctx.currentTime, v = tensaoAlvo;
  const f = 18000 * Math.pow(650 / 18000, v), g = 1 - 0.45 * v;
  if (imediato) { s.abafa.frequency.setValueAtTime(f, t); s.tens.gain.setValueAtTime(g, t); }
  else { s.abafa.frequency.setTargetAtTime(f, t, 0.25); s.tens.gain.setTargetAtTime(g, t, 0.25); }
}

function desmontar(s) {
  clearInterval(s.timer);
  for (const o of s.osc) { try { o.stop(); } catch (e) {} }
  for (const n of s.nos) { try { n.disconnect(); } catch (e) {} }
  s.nos.length = 0; s.osc.length = 0;
}

// ---------------------------------------------------------------- API
export function iniciarMusica(ctx, destino) {
  if (S) { const velho = S; S = null; encerrar(velho, 0.2); }
  const s = { ctx, nos: [], osc: [], ruido: ruido(ctx), baldes: null };
  const novo = n => (s.nos.push(n), n);

  // mestre: barramento + reverb -> abafador (tensão) -> ganho da tensão -> fade -> compressor -> destino
  s.barramento = novo(ctx.createGain());
  s.reverb = novo(ctx.createConvolver()); s.reverb.buffer = impulso(ctx);
  const molhado = novo(ctx.createGain()); molhado.gain.value = 0.8;
  s.abafa = novo(ctx.createBiquadFilter()); s.abafa.type = 'lowpass'; s.abafa.Q.value = 0.9;
  s.tens = novo(ctx.createGain());
  s.mestre = novo(ctx.createGain());
  const comp = novo(ctx.createDynamicsCompressor());
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  s.barramento.connect(s.abafa);
  s.reverb.connect(molhado).connect(s.abafa);
  s.abafa.connect(s.tens).connect(s.mestre).connect(comp).connect(destino);

  const t0 = ctx.currentTime;
  s.mestre.gain.setValueAtTime(0, t0);
  s.mestre.gain.linearRampToValueAtTime(VOLUME_MUSICA, t0 + 2);

  s.cam = {
    f: criarCamada(ctx, s, { pan: -0.15, envio: 0.28, lfoHz: 0.37, autopan: 0.35 }),
    o: criarCamada(ctx, s, { pan: 0.2, envio: 0.45, lfoHz: 0.43, filtro: { f: 2600, q: 0.4 } }),
    j: criarCamada(ctx, s, { pan: 0.08, envio: 0.16, lfoHz: 0.51 }),
    c: criarCamada(ctx, s, { pan: 0, envio: 0.05, lfoHz: 0.29, filtro: { f: 700, q: 0.6 } }),
  };

  // vibrato das cordas solo (fixo, ~8 cents, 5,2 Hz)
  const vl = novo(ctx.createOscillator()); vl.frequency.value = 5.2;
  s.vibrato = novo(ctx.createGain()); s.vibrato.gain.value = 8;
  vl.connect(s.vibrato); vl.start(); s.osc.push(vl);

  // filtros fixos da percussão: cada golpe só cria fonte + ganho
  const filtro = (tipo, f, q) => { const b = novo(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(s.cam.j.entrada); return b; };
  s.perc = {
    varre: filtro('bandpass', 3400, 0.6),     // vassourinha arrastando
    tapa: filtro('bandpass', 1900, 0.9),      // vassourinha batendo na caixa (2 e 4)
    aro: filtro('bandpass', 1750, 7),         // aro (clave da bossa)
    chocalho: filtro('highpass', 7500, 0.7),
  };

  aplicarNiveis(s, true);
  aplicarTensao(s, true);

  s.proxPasso = 0; s.proxTempo = t0 + 0.08;
  s.timer = setInterval(() => tick(s), INTERVALO_MS);
  tick(s);
  S = s;
}

export function niveis({ f, o, j, c } = {}) {
  const novos = { f, o, j, c };
  for (const k in novos) if (novos[k] != null && isFinite(novos[k])) alvo[k] = limitar(+novos[k], 0, 100);
  if (S) aplicarNiveis(S, false);
}

function encerrar(s, fade) {
  const t = s.ctx.currentTime, g = s.mestre.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0, t + Math.max(0.02, fade));
  return new Promise(res => setTimeout(() => { desmontar(s); res(); }, Math.max(0.02, fade) * 1000 + 700));
}

export function pararMusica(fade = 1.5) {
  if (!S) return Promise.resolve();
  const s = S; S = null;
  return encerrar(s, fade);
}

export function tensao(v) {
  tensaoAlvo = limitar(+v || 0, 0, 1);
  if (S) aplicarTensao(S, false);
}
