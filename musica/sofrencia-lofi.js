// O Gabinete: a "Rachadinha do Coração" em versão lo-fi, toda sintetizada em Web Audio.
//
// A mesma partitura e os mesmos instrumentos da sofrência (sofrencia.js), mais devagar (88 bpm) e passados na
// fita: linha de atraso modulada no barramento (wow e flutter: a afinação balança como fita velha), saturação
// leve, lowpass de 3 kHz, mais reverb e o chiado contínuo da fita por baixo, sem estalos (pedido do Gui, 23/10).
//
// Quatro camadas, uma por medidor (como no Reigns):
//   f (Família)  -> acordeão: duas palhetas sawtooth desafinadas (musette) com tremolo; acordes, respostas
//                   chorosas nas pausas e, num dos arranjos, o solo
//   o (Opinião)  -> teclado lead "chorado": square + saw com portamento, vibrato largo que entra devagar nas
//                   notas longas e bend para baixo no fim da frase
//   j (Blindagem)-> zabumba eletrônica + bacalhau, chimbal, palmas e triângulo (batida contida)
//   c (Caixa)    -> baixo de piseiro (saw + sub, pluck com lowpass) com notas de passagem cromáticas
// O volume de cada camada segue o medidor (50 = normal, 0 quase some, 100 alto). Em perigo (<=15 ou >=85)
// a camada desafina oscilando (LFO no detune de cada fonte, ~±20 a 40 cents).
//
// Forma: Lá menor, 88 bpm (a original é 120), ciclo de 16 compassos (A = verso 8, B = refrão 8). Três arranjos se alternam
// (ciclo % 3): 0 = teclado canta, acordeão responde; 1 = acordeão faz o solo, teclado só chora as notas
// longas uma terça abaixo; 2 = verso em meio-tempo com o teclado uma oitava abaixo, refrão com o acordeão
// dobrando a melodia em terças (o dueto de sofrência) e palmas dobradas.
//
// API:
//   iniciarMusica(ctx, destino)  niveis({ f, o, j, c })  pararMusica(fade = 1.5)  tensao(v)

const BPM = 88;
const TEMPO = 60 / BPM;          // uma semínima
const PASSO = TEMPO / 4;         // semicolcheia: a grade do agendador
const ANTECEDENCIA = 0.1;        // agenda 100 ms à frente
const INTERVALO_MS = 25;
const VOLUME_MUSICA = 0.21;      // ~-25 LUFS, no meio das outras músicas do jogo (-20 a -30)
const COMPASSOS = 16;

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const humano = () => (Math.random() - 0.5) * 0.006;

// ---------------------------------------------------------------- partitura
// v = acorde do acordeão (tríade), r = fundamental do baixo, q = quinta
const Am = { v: [64, 69, 72], r: 45, q: 40 };
const F = { v: [65, 69, 72], r: 41, q: 48 };
const C = { v: [64, 67, 72], r: 36, q: 43 };
const G = { v: [62, 67, 71], r: 43, q: 38 };
const Dm = { v: [62, 65, 69], r: 38, q: 45 };
const E7 = { v: [62, 68, 71], r: 40, q: 47, e7: true };
const ac = (b, a) => ({ b, ...a });

// A (verso):  Am | F | C | G | Am | F | Dm E7 | Am
// B (refrão): F | G | C | Am | Dm | Am | E7 | Am
const HARMONIA = [
  [ac(0, Am)], [ac(0, F)], [ac(0, C)], [ac(0, G)],
  [ac(0, Am)], [ac(0, F)], [ac(0, Dm), ac(2, E7)], [ac(0, Am)],
  [ac(0, F)], [ac(0, G)], [ac(0, C)], [ac(0, Am)],
  [ac(0, Dm)], [ac(0, Am)], [ac(0, E7)], [ac(0, Am)],
];

// melodia: [compasso, tempo, nota, duração em tempos, efeito]  ('c' = chorada: vibrato largo + bend no fim;
// 'b' = entra escorregando de baixo, o "soluço")
const MELODIA = [
  // A: o lamento, frases que descem
  [0, 0.5, 76, 0.5], [0, 1, 76, 0.5], [0, 1.5, 77, 0.5], [0, 2, 76, 1], [0, 3, 74, 0.5], [0, 3.5, 72, 0.5],
  [1, 0, 72, 0.5], [1, 0.5, 74, 0.5], [1, 1, 72, 1], [1, 2, 69, 2, 'c'],
  [2, 0.5, 72, 0.5], [2, 1, 72, 0.5], [2, 1.5, 74, 0.5], [2, 2, 76, 1], [2, 3, 79, 0.5], [2, 3.5, 77, 0.5],
  [3, 0, 76, 1], [3, 1, 74, 0.5], [3, 1.5, 71, 2.5, 'c'],
  [4, 0.5, 76, 0.5], [4, 1, 79, 0.5], [4, 1.5, 81, 0.5], [4, 2, 81, 1, 'b'], [4, 3, 79, 0.5], [4, 3.5, 77, 0.5],
  [5, 0, 77, 0.5], [5, 0.5, 76, 0.5], [5, 1, 77, 1], [5, 2, 81, 2, 'c'],
  [6, 0, 74, 0.5], [6, 0.5, 76, 0.5], [6, 1, 77, 1], [6, 2, 80, 0.5], [6, 2.5, 77, 0.5], [6, 3, 76, 0.5], [6, 3.5, 74, 0.5],
  [7, 0, 72, 0.5], [7, 0.5, 71, 0.5], [7, 1, 69, 2.5, 'c'],
  // B: o refrão de sofrência, notas longas no agudo e o acordeão chorando nas pausas
  [8, 0, 81, 1.5, 'b'], [8, 1.5, 79, 0.5], [8, 2, 77, 1, 'c'],
  [9, 0, 79, 1.5, 'b'], [9, 1.5, 77, 0.5], [9, 2, 76, 1, 'c'],
  [10, 0, 76, 0.5], [10, 0.5, 77, 0.5], [10, 1, 79, 0.5], [10, 1.5, 84, 1.5, 'b'], [10, 3, 83, 0.5], [10, 3.5, 81, 0.5],
  [11, 0, 81, 3, 'c'],
  [12, 0, 74, 0.5], [12, 0.5, 77, 0.5], [12, 1, 81, 1], [12, 2, 79, 0.5], [12, 2.5, 77, 1.5, 'c'],
  [13, 0, 76, 0.5], [13, 0.5, 77, 0.5], [13, 1, 76, 0.5], [13, 1.5, 72, 0.5], [13, 2, 76, 2, 'c'],
  [14, 0, 83, 1.5, 'b'], [14, 1.5, 80, 0.5], [14, 2, 77, 0.5], [14, 2.5, 76, 0.5], [14, 3, 74, 0.5], [14, 3.5, 71, 0.5],
  [15, 0, 69, 3, 'c'],
];

// respostas do acordeão (suspiros que descem) nas pausas: [compasso, tempo, nota, duração]
const RESPOSTAS = [
  [1, 3, 64, 0.5], [1, 3.5, 65, 0.5],
  [3, 3, 62, 0.5], [3, 3.5, 64, 0.5],
  [5, 3, 69, 0.5], [5, 3.5, 67, 0.5],
  [7, 2.5, 76, 0.5], [7, 3, 74, 0.5], [7, 3.5, 72, 0.5],
  [8, 3, 77, 0.5], [8, 3.5, 76, 0.5],
  [9, 3, 74, 0.5], [9, 3.5, 72, 0.5],
  [11, 3, 72, 0.25], [11, 3.25, 71, 0.25], [11, 3.5, 69, 0.5],
  [15, 3, 76, 0.25], [15, 3.25, 77, 0.25], [15, 3.5, 80, 0.5],
];

// terça diatônica abaixo em Lá menor (com Sol# quando o acorde é E7)
const ESCALA = [9, 11, 0, 2, 4, 5, 7];
function tercaAbaixo(m, e7) {
  let pc = ((m % 12) + 12) % 12;
  if (pc === 8) pc = 7;
  const i = ESCALA.indexOf(pc);
  if (i < 0) return m - 3;
  let alvoPc = ESCALA[(i + 5) % 7];
  if (e7 && alvoPc === 7) alvoPc = 8;
  const d = ((((m % 12) + 12) % 12) - alvoPc + 12) % 12;
  return m - (d || 12);
}

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

// salão de forró: um pouco mais longo que o palanque do piseiro, para o choro "pendurar"
function impulso(ctx, dur = 1.5) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      const pre = t < 0.012 ? 0 : 1;
      lp += 0.35 * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * pre * Math.exp(-t * 3.6) * (1 - Math.exp(-t * 60));
    }
  }
  return b;
}

// chiado de fita: só o "mar", sem estalos; laço de 7 s, estéreo
const cacheChiado = new WeakMap();
function chiado(ctx) {
  let b = cacheChiado.get(ctx);
  if (!b) {
    const sr = ctx.sampleRate, n = Math.floor(sr * 7);
    b = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) { lp += 0.08 * ((Math.random() * 2 - 1) - lp); d[i] = lp * 0.05; }
    }
    cacheChiado.set(ctx, b);
  }
  return b;
}

// saturação de fita: tanh suave
function curvaFita(drive = 1.6) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * drive) / Math.tanh(drive); }
  return c;
}

// ---------------------------------------------------------------- camadas
function criarCamada(ctx, s, { pan = 0, envio = 0.2, lfoHz = 0.4, filtro = null }) {
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
  if (ctx.createStereoPanner) {
    const p = novo(ctx.createStereoPanner());
    p.pan.value = pan;
    vol.connect(p); saida = p;
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
  l1.start(); l2.start();
  s.nos.push(...nos); s.osc.push(l1, l2);
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
// teclado chorado: square + saw uma oitava acima; portamento da nota anterior; vibrato por nota que alarga
// devagar nas notas longas; 'c' cai ~1,5 semitom no fim (o "ai"); 'b' entra escorregando de um semitom abaixo
function teclado(s, t, m, dur, vel = 1, efeito = '') {
  const ctx = s.ctx, cam = s.cam.o, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), bg = ctx.createGain();
  const lp = ctx.createBiquadFilter(), amp = ctx.createGain(), vib = ctx.createGain();
  a.type = 'square'; b.type = 'sawtooth';
  const ant = s.ultimaLead;
  const liga = ant && t - ant.fim < 0.06 && Math.abs(ant.m - m) <= 7;
  const f0 = efeito === 'b' ? f * Math.pow(2, -1 / 12)
    : liga ? mtof(ant.m) : f * Math.pow(2, -0.6 / 12);
  const tau = efeito === 'b' ? 0.045 : liga ? 0.022 : 0.012;
  const chora = efeito === 'c' && dur > TEMPO * 0.9;
  const fimNota = t + dur;
  for (const [o, mult] of [[a, 1], [b, 2]]) {
    o.frequency.setValueAtTime(f0 * mult, t);
    o.frequency.setTargetAtTime(f * mult, t, tau);
    if (chora) {
      const ini = Math.max(t + 0.1, fimNota - Math.min(0.32, dur * 0.3));
      o.frequency.setValueAtTime(f * mult, ini);
      o.frequency.exponentialRampToValueAtTime(f * mult * Math.pow(2, -1.6 / 12), fimNota + 0.08);
    }
  }
  b.detune.value = 6; bg.gain.value = 0.22;
  // vibrato: estreito no ataque, largo (até ~45 cents) quando a nota se sustenta
  const largo = chora ? 42 : dur > TEMPO * 0.9 ? 26 : 12;
  vib.gain.setValueAtTime(6, t);
  vib.gain.linearRampToValueAtTime(largo, t + Math.min(dur * 0.7, 0.55));
  s.vibLfo.connect(vib); vib.connect(a.detune); vib.connect(b.detune);
  lp.type = 'lowpass'; lp.Q.value = 3;
  lp.frequency.setValueAtTime(4600, t);
  lp.frequency.setTargetAtTime(2300, t, 0.1);
  const pico = 0.11 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.01);
  amp.gain.setTargetAtTime(pico * 0.78, t + 0.01, 0.18);
  amp.gain.setValueAtTime(pico * 0.78, fimNota);
  amp.gain.setTargetAtTime(0, fimNota, chora ? 0.06 : 0.03);
  a.connect(lp); b.connect(bg).connect(lp); lp.connect(amp).connect(cam.entrada);
  const fim = fimNota + (chora ? 0.45 : 0.25);
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  soltar(cam, [a, b, bg, lp, amp, vib], [a, b]);
  b.addEventListener('ended', () => { try { s.vibLfo.disconnect(vib); } catch (e) {} });
  s.ultimaLead = { m, fim: fimNota };
}

// acordeão: duas palhetas sawtooth desafinadas (musette) + square uma oitava abaixo, peaking de "fole".
// "inchar" abre o fole devagar (crescendo do choro) em vez do ataque seco.
function acordeao(s, t, notas, dur, vel = 1, inchar = false) {
  const ctx = s.ctx, cam = s.cam.f;
  const pico = 0.085 * vel / Math.sqrt(notas.length);
  const at = inchar ? Math.min(0.12, dur * 0.4) : 0.015;
  for (const m of notas) {
    const f = mtof(m);
    const a = ctx.createOscillator(), b = ctx.createOscillator(), c = ctx.createOscillator();
    const cg = ctx.createGain(), amp = ctx.createGain();
    a.type = b.type = 'sawtooth'; c.type = 'square';
    a.frequency.value = b.frequency.value = f; c.frequency.value = f / 2;
    a.detune.value = -10; b.detune.value = 12; cg.gain.value = 0.35;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(pico, t + at);
    amp.gain.setTargetAtTime(pico * (inchar ? 0.9 : 0.8), t + at, inchar ? 0.4 : 0.1);
    amp.gain.setValueAtTime(pico * (inchar ? 0.9 : 0.8), t + dur);
    amp.gain.setTargetAtTime(0, t + dur, inchar ? 0.06 : 0.035);
    a.connect(amp); b.connect(amp); c.connect(cg).connect(amp); amp.connect(s.fole);
    const fim = t + dur + 0.4;
    for (const o of [a, b, c]) { o.start(t); o.stop(fim); }
    soltar(cam, [a, b, c, cg, amp], [a, b, c]);
  }
}

// baixo de piseiro: saw com lowpass que fecha (pluck) + sub em seno
function baixo(s, t, m, dur, vel = 1) {
  const ctx = s.ctx, cam = s.cam.c, f = mtof(m);
  const saw = ctx.createOscillator(), sub = ctx.createOscillator();
  const lp = ctx.createBiquadFilter(), sg = ctx.createGain(), amp = ctx.createGain();
  saw.type = 'sawtooth'; saw.frequency.value = f; sub.frequency.value = f; sg.gain.value = 0.8;
  lp.type = 'lowpass'; lp.Q.value = 4;
  lp.frequency.setValueAtTime(1400 * vel, t);
  lp.frequency.setTargetAtTime(250, t, 0.07);
  const pico = 0.13 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.006);
  amp.gain.setTargetAtTime(pico * 0.6, t + 0.006, 0.2);
  amp.gain.setTargetAtTime(0, t + dur, 0.03);
  saw.connect(lp).connect(amp); sub.connect(sg).connect(amp); amp.connect(cam.entrada);
  const fim = t + dur + 0.25;
  saw.start(t); sub.start(t); saw.stop(fim); sub.stop(fim);
  soltar(cam, [saw, sub, lp, sg, amp], [saw, sub]);
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

// zabumba: bumbo eletrônico de pisadinha (seno com queda de pitch) + estalo
function zabumba(s, t, vel) {
  const ctx = s.ctx;
  const o = ctx.createOscillator(), amp = ctx.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.34 * vel, t + 0.003);
  amp.gain.setTargetAtTime(0, t + 0.003, 0.1);
  o.connect(amp).connect(s.cam.j.entrada);
  o.start(t); o.stop(t + 0.6);
  soltar(s.cam.j, [o, amp], [o]);
  golpe(s, t, s.perc.estalo, 0.14 * vel, 0.001, 0.008);
}

// triângulo: três parciais inarmônicas; aberto (soa) ou abafado (curto)
function triangulo(s, t, aberto, vel) {
  const ctx = s.ctx, amp = ctx.createGain(), fontes = [];
  const pico = 0.016 * vel, queda = aberto ? 0.22 : 0.025;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.001);
  amp.gain.setTargetAtTime(0, t + 0.001, queda);
  for (const [fq, g] of [[4180, 1], [6020, 0.6], [8930, 0.4]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = fq; og.gain.value = g;
    o.connect(og).connect(amp);
    o.start(t); o.stop(t + 0.001 + queda * 6);
    fontes.push(o, og);
  }
  amp.connect(s.cam.j.entrada);
  soltar(s.cam.j, [...fontes, amp], fontes.filter(n => n.start));
}

function palma(s, t, vel = 1) {
  for (const [dt, v] of [[0, 0.5], [0.009, 0.6], [0.019, 1]]) golpe(s, t + dt, s.perc.palma, 0.22 * v * vel, 0.001, dt < 0.015 ? 0.006 : 0.05);
}

// ---------------------------------------------------------------- arranjo de um compasso
function montarCompasso(s, ciclo, comp) {
  const ev = [];
  const add = (b, fn) => ev.push([b, fn]);
  const acordes = HARMONIA[comp];
  const acordeEm = b => acordes.filter(a => a.b <= b).pop();
  const secaoB = comp >= 8;
  const tipo = ciclo % 3;      // 0 = teclado canta; 1 = acordeão sola; 2 = verso meio-tempo + refrão em dueto
  const primeiro = ciclo === 0 && comp < 2;   // entrada mais leve
  const meioTempo = tipo === 2 && !secaoB;
  const melodia = MELODIA.filter(n => n[0] === comp);

  // ---- acordeão (f)
  if (tipo === 1) {
    // solo: acorde sustentado baixinho por baixo, melodia no acordeão com fole que incha nas notas longas
    add(0, t => acordeao(s, t, acordes[0].v.map(m => m - 12), TEMPO * (acordes.length > 1 ? 1.9 : 3.9), 0.4, true));
    if (acordes.length > 1) add(2, t => acordeao(s, t, acordes[1].v.map(m => m - 12), TEMPO * 1.9, 0.4, true));
    for (const [, b, m, d] of melodia) add(b, t => acordeao(s, t, [m], d * TEMPO * 0.9, 1.35, d >= 1.5));
    for (const b of [0.5, 1.5, 2.5, 3.5]) add(b, t => acordeao(s, t, acordeEm(b).v, TEMPO * 0.25, 0.4));
  } else {
    if (meioTempo) {
      // verso em meio-tempo: acorde aberto no 1 e no "e" do 3, sustentado (o fole respira)
      add(0, t => acordeao(s, t, acordes[0].v, TEMPO * 1.6, 0.6, true));
      add(2.5, t => acordeao(s, t, acordeEm(2.5).v, TEMPO * 1.3, 0.55, true));
    } else {
      // "ta" nos contratempos (pisadinha), um pouco mais contido que o piseiro
      for (const b of [0.5, 1.5, 2.5, 3.5]) add(b, t => acordeao(s, t, acordeEm(b).v, TEMPO * 0.3, b === 2.5 ? 0.98 : 0.8));
    }
    // dueto do refrão: o acordeão canta uma terça abaixo do teclado
    if (tipo === 2 && secaoB) {
      for (const [, b, m, d] of melodia) {
        const e7 = acordeEm(b).e7;
        add(b, t => acordeao(s, t, [tercaAbaixo(m, e7)], d * TEMPO * 0.9, 0.85, d >= 1.5));
      }
    }
  }
  // respostas chorosas nas pausas (dobradas na oitava, fole inchando)
  if (tipo !== 1 || secaoB) {
    for (const [c, b, m, d] of RESPOSTAS) if (c === comp) add(b, t => acordeao(s, t, [m, m + 12], d * TEMPO * 0.92, 1.05, true));
  }

  // ---- baixo (c): fundamental, quinta e nota de passagem cromática para o próximo acorde
  const prox = HARMONIA[(comp + 1) % COMPASSOS][0];
  const [a0, a1] = [acordes[0], acordes[1] || acordes[0]];
  const ultimo = a1;
  const passagem = prox.r !== ultimo.r ? prox.r + (prox.r > ultimo.r ? -1 : 1) : ultimo.r + 12;
  let padraoBaixo;
  if (meioTempo) {
    padraoBaixo = [[0, a0.r, 1.4], [1.5, a0.q, 0.45], [2.5, a1.r, 0.9], [3.5, passagem, 0.45]];
  } else if (acordes.length === 1) {
    padraoBaixo = [[0, a0.r, 0.6], [1.5, a0.q, 0.4], [2, a0.r, 0.6], [3, a0.q, 0.4], [3.5, passagem, 0.4]];
  } else {
    padraoBaixo = [[0, a0.r, 0.6], [1, a0.q, 0.4], [1.5, a1.r - 1, 0.4], [2, a1.r, 0.6], [3, a1.q, 0.4], [3.5, passagem, 0.4]];
  }
  for (const [b, m, d] of padraoBaixo) add(b, t => baixo(s, t, m, d * TEMPO, b % 1 ? 0.8 : 1));

  // ---- teclado lead (o)
  if (!primeiro) {
    if (tipo === 1) {
      // o acordeão sola; o teclado só chora as notas longas, uma terça abaixo e mais baixinho
      for (const [, b, m, d, ef] of melodia) {
        if (d < 1.5) continue;
        const e7 = acordeEm(b).e7;
        add(b + 0.5, t => teclado(s, t, tercaAbaixo(m, e7), (d - 0.5) * TEMPO * 0.95, 0.65, 'c'));
      }
    } else {
      const desce = meioTempo ? -12 : 0;   // verso do arranjo 2: "voz de peito", uma oitava abaixo
      for (const [, b, m, d, ef] of melodia) {
        add(b, t => teclado(s, t, m + desce, d * TEMPO * (d <= 0.5 ? 0.86 : 0.94), meioTempo ? 1.1 : 1, ef || ''));
      }
    }
  }

  // ---- percussão (j): batida contida; meio-tempo no verso do arranjo 2
  const p = s.perc;
  const virada = comp === COMPASSOS - 1;
  if (meioTempo) {
    add(0, t => zabumba(s, t, 1)); add(2, t => zabumba(s, t, 0.8));
    add(3.5, t => zabumba(s, t, 0.45));
    add(2, t => palma(s, t, 0.8));
    for (let k = 0; k < 8; k++) add(k / 2, t => triangulo(s, t, k % 2 === 1, k % 2 ? 0.8 : 0.4));
    add(2.75, t => golpe(s, t, p.bacalhau, 0.14, 0.001, 0.02));
  } else {
    for (const [b, v] of [[0, 1], [1, 0.62], [2, 0.92], [3, 0.62]]) add(b, t => zabumba(s, t, v));
    if (comp % 2 === 1) add(1.75, t => zabumba(s, t, 0.4));
    if (virada) { add(3.5, t => zabumba(s, t, 0.65)); add(3.75, t => zabumba(s, t, 0.75)); }
    for (const b of [0.75, 2.75]) add(b, t => golpe(s, t, p.bacalhau, 0.15, 0.001, 0.02));
    // triângulo: colcheias no verso, semicolcheias no refrão
    if (secaoB) for (let k = 0; k < 16; k++) { const ab = k % 4 === 2; add(k / 4, t => triangulo(s, t, ab, ab ? 1 : (k % 2 ? 0.4 : 0.6))); }
    else for (let k = 0; k < 8; k++) add(k / 2, t => triangulo(s, t, k % 2 === 1, k % 2 ? 0.9 : 0.5));
    if (!primeiro) for (const b of [0.5, 1.5, 2.5, 3.5]) add(b, t => golpe(s, t, p.chimbal, 0.09, 0.001, 0.025, 0.95 + Math.random() * 0.1));
    if (secaoB || comp >= 4) {
      for (const b of [1, 3]) add(b, t => palma(s, t, 0.85));
      if (tipo === 2 && secaoB) { add(1.5, t => palma(s, t, 0.45)); add(3.5, t => palma(s, t, 0.5)); }
    }
    if (virada) for (const b of [3.25, 3.5, 3.75]) add(b, t => palma(s, t, 0.6));
  }

  // agrupa por semicolcheia
  const baldes = Array.from({ length: 16 }, () => []);
  for (const [b, fn] of ev) baldes[Math.round(b * 4) % 16].push(fn);
  return baldes;
}

function agendarPasso(s, passo, t) {
  const compAbs = Math.floor(passo / 16), k = passo % 16;
  if (k === 0) s.baldes = montarCompasso(s, Math.floor(compAbs / COMPASSOS), compAbs % COMPASSOS);
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
    s.ultimaLead = null;
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
  const s = { ctx, nos: [], osc: [], ruido: ruido(ctx), baldes: null, ultimaLead: null };
  const novo = n => (s.nos.push(n), n);

  // mestre: barramento + reverb -> fita (atraso modulado, saturação, lowpass) -> abafador (tensão) -> ganho da
  // tensão -> fade -> compressor -> destino; o chiado entra antes do abafador
  s.barramento = novo(ctx.createGain());
  s.reverb = novo(ctx.createConvolver()); s.reverb.buffer = impulso(ctx, 2.2);
  const molhado = novo(ctx.createGain()); molhado.gain.value = 1;
  // wow e flutter: o atraso de ~12 ms oscila 1,4 ms a 0,45 Hz (~7 cents) e 0,03 ms a 5,8 Hz
  const balanco = novo(ctx.createDelay(0.05)); balanco.delayTime.value = 0.012;
  for (const [hz, prof] of [[0.45, 0.0014], [5.8, 0.00003]]) {
    const o = novo(ctx.createOscillator()); o.frequency.value = hz;
    const g = novo(ctx.createGain()); g.gain.value = prof;
    o.connect(g).connect(balanco.delayTime); o.start(); s.osc.push(o);
  }
  const satura = novo(ctx.createWaveShaper()); satura.curve = curvaFita(); satura.oversample = '2x';
  const fita = novo(ctx.createBiquadFilter()); fita.type = 'lowpass'; fita.frequency.value = 3000; fita.Q.value = 0.5;
  s.abafa = novo(ctx.createBiquadFilter()); s.abafa.type = 'lowpass'; s.abafa.Q.value = 0.9;
  s.tens = novo(ctx.createGain());
  s.mestre = novo(ctx.createGain());
  const comp = novo(ctx.createDynamicsCompressor());
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  s.barramento.connect(balanco);
  s.reverb.connect(molhado).connect(balanco);
  balanco.connect(satura).connect(fita).connect(s.abafa);
  const fitaRoda = novo(ctx.createBufferSource()); fitaRoda.buffer = chiado(ctx); fitaRoda.loop = true;
  const gChiado = novo(ctx.createGain()); gChiado.gain.value = 0.55;
  const bpChiado = novo(ctx.createBiquadFilter()); bpChiado.type = 'bandpass'; bpChiado.frequency.value = 2400; bpChiado.Q.value = 0.4;
  fitaRoda.connect(bpChiado).connect(gChiado).connect(s.abafa);
  fitaRoda.start(); s.osc.push(fitaRoda);
  s.abafa.connect(s.tens).connect(s.mestre).connect(comp).connect(destino);

  const t0 = ctx.currentTime;
  s.mestre.gain.setValueAtTime(0, t0);
  s.mestre.gain.linearRampToValueAtTime(VOLUME_MUSICA, t0 + 1.5);

  s.cam = {
    f: criarCamada(ctx, s, { pan: -0.22, envio: 0.28, lfoHz: 0.37, filtro: { f: 3000, q: 0.5 } }),
    o: criarCamada(ctx, s, { pan: 0.12, envio: 0.36, lfoHz: 0.43 }),
    j: criarCamada(ctx, s, { pan: 0.05, envio: 0.1, lfoHz: 0.51 }),
    c: criarCamada(ctx, s, { pan: 0, envio: 0.03, lfoHz: 0.29, filtro: { f: 900, q: 0.6 } }),
  };

  // LFO do vibrato do teclado (5,4 Hz); cada nota tem o seu ganho de profundidade
  const vl = novo(ctx.createOscillator()); vl.frequency.value = 5.4;
  vl.start(); s.osc.push(vl);
  s.vibLfo = vl;

  // fole do acordeão: peaking largo + tremolo (5,2 Hz) antes da camada f
  const fb = novo(ctx.createBiquadFilter()); fb.type = 'peaking'; fb.frequency.value = 1300; fb.Q.value = 0.8; fb.gain.value = 5;
  const trem = novo(ctx.createGain()); trem.gain.value = 0.86;
  const tl = novo(ctx.createOscillator()); tl.frequency.value = 5.2;
  const tg = novo(ctx.createGain()); tg.gain.value = 0.14;
  tl.connect(tg).connect(trem.gain); tl.start(); s.osc.push(tl);
  fb.connect(trem).connect(s.cam.f.entrada);
  s.fole = fb;

  // filtros fixos da percussão: cada golpe só cria fonte + ganho
  const filtro = (tipo, f, q) => { const b = novo(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(s.cam.j.entrada); return b; };
  s.perc = {
    estalo: filtro('bandpass', 2300, 1.2),     // couro da zabumba
    bacalhau: filtro('bandpass', 3200, 3),     // vareta por baixo da zabumba
    chimbal: filtro('bandpass', 6000, 0.8),   // na fita o chimbal perde o brilho
    palma: filtro('bandpass', 1250, 1.1),
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
