// O Gabinete: música armorial (a "corte do sertão", à moda do Quinteto Armorial), toda sintetizada em Web Audio.
//
// Quatro camadas, uma por medidor (como no Reigns):
//   f (Família)  -> viola de dez cordas dedilhada: Karplus-Strong em buffer, cordas em pares (com oitava nos bordões)
//   o (Opinião)  -> pífano e rabeca revezando a melodia (pífano: taboca com sopro áspero; rabeca: arco rústico, vibrato largo)
//   j (Blindagem)-> zabumba de couro (baque + bacalhau), triângulo e caxixi, em baião lento
//   c (Caixa)    -> rabecão: arcadas curtas de baixo no desenho do baião
// Ré mixolídio (dó natural; às vezes o sol sustenido "nordestino" da quarta aumentada), 104 bpm,
// ciclo de 16 compassos (A = 8, B = 8) com três arranjos que se alternam (ciclo % 3).
// O volume de cada camada segue o medidor (50 = normal, 0 quase some, 100 alto). Em perigo (<=15 ou >=85)
// a camada desafina oscilando (LFO no detune de cada fonte, ~±20 a 40 cents).
//
// API:
//   iniciarMusica(ctx, destino)  niveis({ f, o, j, c })  pararMusica(fade = 1.5)  tensao(v)

const BPM = 104;
const TEMPO = 60 / BPM;          // uma semínima
const PASSO = TEMPO / 4;         // semicolcheia: a grade do agendador
const ANTECEDENCIA = 0.1;        // agenda 100 ms à frente
const INTERVALO_MS = 25;
const VOLUME_MUSICA = 0.46;      // fica atrás das falas e dos efeitos
const COMPASSOS = 16;

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const humano = () => (Math.random() - 0.5) * 0.008;
const ESCALA = new Set([0, 2, 4, 6, 7, 9, 11]);           // Ré mixolídio (as notas de Sol maior)
const acima = m => (ESCALA.has((m + 1) % 12) ? m + 1 : m + 2);
const abaixo = m => (ESCALA.has((m + 11) % 12) ? m - 1 : m - 2);

// ---------------------------------------------------------------- partitura
// A: D | C | D | Am | D | C | G | D      B: G | C | D | D | Em | C | G | D
// r = fundamental do rabecão, v = acorde da viola (registro médio)
const D = { r: 38, v: [62, 66, 69] }, C = { r: 36, v: [60, 64, 67] }, G = { r: 43, v: [59, 62, 67] };
const AM = { r: 45, v: [60, 64, 69] }, EM = { r: 40, v: [59, 64, 67] };
const HARMONIA = [D, C, D, AM, D, C, G, D, G, C, D, D, EM, C, G, D];

// [compasso, tempo, nota, duração em tempos]
const MELODIA = [
  // A: a entrada "de cortejo", pomposa, com o dó natural do mixolídio
  [0, 0, 81, 1.5], [0, 1.5, 78, 0.5], [0, 2, 81, 0.5], [0, 2.5, 83, 0.5], [0, 3, 84, 1],
  [1, 0, 83, 0.5], [1, 0.5, 81, 0.5], [1, 1, 79, 1], [1, 2, 76, 1], [1, 3, 72, 1],
  [2, 0, 74, 0.5], [2, 0.5, 78, 0.5], [2, 1, 81, 0.5], [2, 1.5, 80, 0.5], [2, 2, 81, 1.5], [2, 3.5, 78, 0.5],
  [3, 0, 76, 1], [3, 1, 81, 0.5], [3, 1.5, 79, 0.5], [3, 2, 76, 1], [3, 3, 72, 0.5], [3, 3.5, 76, 0.5],
  [4, 0, 74, 1.5], [4, 1.5, 78, 0.5], [4, 2, 81, 1], [4, 3, 86, 1],
  [5, 0, 84, 1.5], [5, 1.5, 83, 0.5], [5, 2, 84, 0.5], [5, 2.5, 83, 0.5], [5, 3, 79, 1],
  [6, 0, 83, 0.5], [6, 0.5, 81, 0.5], [6, 1, 79, 0.5], [6, 1.5, 78, 0.5], [6, 2, 79, 0.5], [6, 2.5, 76, 0.5], [6, 3, 72, 1],
  [7, 0, 76, 0.5], [7, 0.5, 72, 0.5], [7, 1, 74, 2.5],
  // B: o "romance", mais cantado, com a quarta aumentada (sol sustenido) puxando para o lá
  [8, 0, 79, 1], [8, 1, 83, 1], [8, 2, 86, 1.5], [8, 3.5, 84, 0.5],
  [9, 0, 83, 0.5], [9, 0.5, 84, 0.5], [9, 1, 83, 0.5], [9, 1.5, 81, 0.5], [9, 2, 79, 2],
  [10, 0, 78, 0.5], [10, 0.5, 80, 0.5], [10, 1, 81, 1], [10, 2, 78, 0.5], [10, 2.5, 76, 0.5], [10, 3, 74, 1],
  [11, 0, 72, 1], [11, 1, 74, 0.5], [11, 1.5, 76, 0.5], [11, 2, 78, 2],
  [12, 0, 79, 1.5], [12, 1.5, 76, 0.5], [12, 2, 79, 0.5], [12, 2.5, 83, 0.5], [12, 3, 81, 1],
  [13, 0, 79, 0.5], [13, 0.5, 76, 0.5], [13, 1, 72, 1], [13, 2, 76, 0.5], [13, 2.5, 79, 0.5], [13, 3, 84, 1],
  [14, 0, 83, 1], [14, 1, 81, 0.5], [14, 1.5, 79, 0.5], [14, 2, 78, 0.5], [14, 2.5, 79, 0.5], [14, 3, 81, 1],
  [15, 0, 84, 1], [15, 1, 81, 0.5], [15, 1.5, 76, 0.5], [15, 2, 74, 2],
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

// Corda de viola (aço) por Karplus-Strong, calculada uma vez por nota e guardada em buffer.
// Mesma receita do cravo, mas dedo/palheta mais no meio da corda e soando bem mais tempo.
const cacheCordas = new WeakMap();
function corda(ctx, m) {
  let mapa = cacheCordas.get(ctx);
  if (!mapa) { mapa = new Map(); cacheCordas.set(ctx, mapa); }
  let c = mapa.get(m);
  if (c) return c;
  const sr = ctx.sampleRate, f = mtof(m);
  const N = Math.max(2, Math.floor(sr / f - 0.5));
  const f0 = sr / (N + 0.5);
  const dur = m < 55 ? 2.8 : m < 72 ? 2.2 : 1.6;
  const len = Math.floor(sr * dur);
  const t60 = limitar(4.6 - (m - 48) * 0.07, 1.4, 4.6);
  const rho = Math.pow(0.001, 1 / (f0 * t60));
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  // excitação: ruído suavizado (polpa do dedo + palheta) com pente da posição de toque
  const w = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) { lp += 0.62 * ((Math.random() * 2 - 1) - lp); w[i] = lp; }
  const p = Math.max(1, Math.round(N * 0.19));
  for (let i = 0; i < N && i < len; i++) d[i] = w[i] - (i >= p ? 0.9 * w[i - p] : 0);
  // laço com filtro levemente assimétrico: aço guarda mais agudo que a corda do cravo
  for (let i = N; i < len; i++) d[i] = rho * (0.56 * d[i - N] + 0.44 * (i - N - 1 >= 0 ? d[i - N - 1] : 0));
  let x1 = 0, y1 = 0;
  for (let i = 0; i < len; i++) { const y = d[i] - x1 + 0.995 * y1; x1 = d[i]; y1 = y; d[i] = y; }
  const j0 = Math.floor(sr * 0.01), j1 = Math.min(len, Math.floor(sr * 0.06));
  let q = 0;
  for (let i = j0; i < j1; i++) q += d[i] * d[i];
  const rms = Math.sqrt(q / Math.max(1, j1 - j0));
  if (rms > 0) for (let i = 0; i < len; i++) d[i] = Math.tanh(d[i] * 0.3 / rms);
  const nf = Math.floor(sr * 0.03);
  for (let i = 0; i < nf; i++) d[len - 1 - i] *= i / nf;
  c = { buf, taxa: f / f0, dur };
  mapa.set(m, c);
  return c;
}

// capela caiada do sertão: menos cauda que o salão da corte, mais que a praça do piseiro
function impulso(ctx, dur = 1.7) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      const pre = t < 0.014 ? 0 : 1;
      lp += 0.34 * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * pre * Math.exp(-t * 3.6) * (1 - Math.exp(-t * 55));
    }
  }
  return b;
}

// ---------------------------------------------------------------- camadas
function criarCamada(ctx, s, { pan = 0, envio = 0.2, lfoHz = 0.4, filtros = [] }) {
  const nos = [];
  const novo = n => (nos.push(n), n);
  const entrada = novo(ctx.createGain());
  let ult = entrada;
  for (const fl of filtros) {
    const b = novo(ctx.createBiquadFilter());
    b.type = fl.tipo; b.frequency.value = fl.f; b.Q.value = fl.q ?? 0.7;
    if (fl.g != null) b.gain.value = fl.g;
    ult.connect(b); ult = b;
  }
  const vol = novo(ctx.createGain());
  vol.gain.value = 0;
  ult.connect(vol);
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

// vibrato por nota: abre o ganho do LFO compartilhado depois de um tempinho e solta quando a fonte acaba
function vibratoAtrasado(s, lfo, t, dur, cents, atraso, alvos, fonteFim, nos) {
  const ctx = s.ctx, vg = ctx.createGain();
  vg.gain.setValueAtTime(0, t);
  vg.gain.setValueAtTime(0, t + atraso);
  vg.gain.linearRampToValueAtTime(cents, t + Math.max(atraso + 0.05, Math.min(dur, atraso + 0.35)));
  lfo.connect(vg);
  for (const a of alvos) vg.connect(a);
  nos.push(vg);
  fonteFim.addEventListener('ended', () => { try { lfo.disconnect(vg); } catch (e) {} });
}

// ---------------------------------------------------------------- instrumentos
// viola de dez cordas: cada nota é um par de cordas; nos bordões o par leva uma corda oitavada
function viola(s, t, m, dur, vel = 1) {
  const ctx = s.ctx, cam = s.cam.f;
  const k = corda(ctx, m);
  const fontes = [], nos = [];
  const amp = ctx.createGain();
  const pico = 0.34 * vel;
  amp.gain.setValueAtTime(pico, t);
  amp.gain.setValueAtTime(pico, t + dur);
  amp.gain.setTargetAtTime(0, t + dur, 0.07);                     // a mão abafa devagar
  amp.connect(cam.entrada); nos.push(amp);
  const pares = [[m, 0, 1], [m, 7, 0.6]];
  if (m < 64) pares.push([m + 12, -4, 0.38]);                     // corda oitavada do bordão
  for (const [nota, det, g] of pares) {
    const kk = nota === m ? k : corda(ctx, nota);
    const src = ctx.createBufferSource();
    src.buffer = kk.buf; src.playbackRate.value = kk.taxa; src.detune.value = det;
    const gg = ctx.createGain(); gg.gain.value = g;
    src.connect(gg).connect(amp);
    const ff = Math.min(t + dur + 0.45, t + kk.dur / kk.taxa - 0.01);
    src.start(t, det ? 0.003 : 0); src.stop(ff);
    src._fim = ff;
    fontes.push(src); nos.push(src, gg);
  }
  fontes.sort((a, b) => a._fim - b._fim);                         // a que para por último dispara a limpeza
  // unha na corda
  const cl = ctx.createBufferSource(), cg = ctx.createGain();
  cl.buffer = s.ruido;
  cg.gain.setValueAtTime(0.05 * vel, t);
  cg.gain.setTargetAtTime(0, t, 0.005);
  cl.connect(cg).connect(s.perc.unha);
  cl.start(t, Math.random() * 1.5); cl.stop(t + 0.04);
  nos.push(cl, cg); fontes.unshift(cl);
  soltar(cam, nos, fontes);
}

// rasgado: o polegar desce (grave -> agudo) ou o indicador sobe (agudo -> grave)
function rasgado(s, t, notas, dur, vel = 0.6, sobe = false) {
  const ord = sobe ? [...notas].reverse() : notas;
  ord.forEach((m, i) => viola(s, t + i * 0.016, m, dur - i * 0.016, vel * (1 - i * 0.07)));
}

// pífano: taboca soprada; corpo oco (triângulo + seno), um fio de serra áspera, muito sopro e vibrato nervoso
function pifano(s, t, m, dur, vel = 1, trilo = 0) {
  const ctx = s.ctx, cam = s.cam.o, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), c = ctx.createOscillator();
  const bg = ctx.createGain(), cg = ctx.createGain(), clp = ctx.createBiquadFilter(), amp = ctx.createGain();
  a.type = 'triangle'; b.type = 'sine'; c.type = 'sawtooth';
  bg.gain.value = 0.55; cg.gain.value = 0.16;
  clp.type = 'lowpass'; clp.frequency.value = Math.min(f * 3.2, 7000); clp.Q.value = 0.6;
  const osc = [a, b, c];
  for (const o of osc) {
    o.frequency.setValueAtTime(f, t);
    o.detune.setValueAtTime(-32, t);                               // o pifeiro "chega" de baixo
    o.detune.linearRampToValueAtTime(0, t + 0.05);
  }
  if (trilo) {
    const fc = mtof(m + trilo);
    let x = t + 0.06, passo = 0.058, alto = true;
    const fimTr = t + dur * 0.75;
    while (x < fimTr) {
      for (const o of osc) o.frequency.setValueAtTime(alto ? fc : f, x);
      x += passo; alto = !alto; passo *= 1.035;
    }
    for (const o of osc) o.frequency.setValueAtTime(f, x);
  }
  const pico = 0.046 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico * 1.2, t + 0.025);
  amp.gain.setTargetAtTime(pico, t + 0.025, 0.05);
  amp.gain.setTargetAtTime(pico * 1.08, t + 0.2, 0.35);
  amp.gain.setValueAtTime(pico * 1.06, t + dur);
  amp.gain.setTargetAtTime(0, t + dur, 0.03);
  a.connect(amp); b.connect(bg).connect(amp); c.connect(clp).connect(cg).connect(amp); amp.connect(cam.entrada);
  // sopro: largo e presente o tempo todo (é isso que faz a taboca soar áspera)
  const sr = ctx.createBufferSource(), sf = ctx.createBiquadFilter(), sg = ctx.createGain();
  sr.buffer = s.ruido;
  sf.type = 'bandpass'; sf.frequency.value = Math.min(f * 1.8, 5000); sf.Q.value = 0.7;
  sg.gain.setValueAtTime(0, t);
  sg.gain.linearRampToValueAtTime(0.12 * vel, t + 0.01);
  sg.gain.setTargetAtTime(0.034 * vel, t + 0.01, 0.04);
  sg.gain.setValueAtTime(0.034 * vel, t + dur);
  sg.gain.setTargetAtTime(0, t + dur, 0.03);
  sr.connect(sf).connect(sg).connect(cam.entrada);
  const fim = t + dur + 0.25;
  sr.start(t, Math.random() * 1.6); sr.stop(fim);
  for (const o of osc) { o.start(t); o.stop(fim); }
  const nos = [a, b, c, bg, cg, clp, amp, sr, sf, sg];
  if (dur > 0.35 && !trilo) vibratoAtrasado(s, s.vibP, t, dur, 16, 0.16, osc.map(o => o.detune), c, nos);
  soltar(cam, nos, [sr, a, b, c]);
}

// pífano com apojatura de baixo (o enfeite típico de banda cabaçal)
function pifanoEnfeitado(s, t, m, dur, vel = 1) {
  const g = 0.065;
  pifano(s, t, abaixo(m), g, vel * 0.8);
  pifano(s, t + g, m, dur - g, vel);
}

// rabeca: duas serras levemente fora (afinação de feira), arco com chiado, escorregão de entrada e vibrato largo
function rabeca(s, t, m, dur, vel = 1, vib = 30) {
  const ctx = s.ctx, cam = s.cam.o, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), lp = ctx.createBiquadFilter(), amp = ctx.createGain();
  a.type = 'sawtooth'; b.type = 'sawtooth';
  a.frequency.value = b.frequency.value = f;
  const torto = (Math.random() - 0.5) * 12;                        // cada nota sai um tiquinho fora
  a.detune.setValueAtTime(torto - 45, t); a.detune.linearRampToValueAtTime(torto - 4, t + 0.07);
  b.detune.setValueAtTime(torto - 40, t); b.detune.linearRampToValueAtTime(torto + 5, t + 0.07);
  lp.type = 'lowpass'; lp.Q.value = 0.9;
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(4200, t + 0.06);
  lp.frequency.setTargetAtTime(3000, t + 0.06, 0.2);
  const pico = 0.04 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.06);
  amp.gain.setTargetAtTime(pico * 0.82, t + 0.06, 0.12);
  amp.gain.setTargetAtTime(pico * 0.95, t + 0.3, 0.4);            // a arcada cresce no meio da nota
  amp.gain.setValueAtTime(pico * 0.92, t + dur);
  amp.gain.setTargetAtTime(0, t + dur, 0.06);
  a.connect(lp); b.connect(lp); lp.connect(amp).connect(cam.entrada);
  // chiado do arco: breu no ataque e um fio de ruído o tempo todo
  const r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
  r.buffer = s.ruido; rf.type = 'bandpass'; rf.frequency.value = 2900; rf.Q.value = 0.9;
  rg.gain.setValueAtTime(0, t);
  rg.gain.linearRampToValueAtTime(0.05 * vel, t + 0.015);
  rg.gain.setTargetAtTime(0.011 * vel, t + 0.015, 0.05);
  rg.gain.setValueAtTime(0.011 * vel, t + dur);
  rg.gain.setTargetAtTime(0, t + dur, 0.05);
  r.connect(rf).connect(rg).connect(cam.entrada);
  const fim = t + dur + 0.4;
  r.start(t, Math.random() * 1.5); r.stop(fim);
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  const nos = [a, b, lp, amp, r, rf, rg];
  if (dur > 0.3) vibratoAtrasado(s, s.vibR, t, dur, vib, 0.14, [a.detune, b.detune], b, nos);
  soltar(cam, nos, [r, a, b]);
}

// rabecão: baixo de arco curto, escuro e com breu
function rabecao(s, t, m, dur, vel = 1) {
  const ctx = s.ctx, cam = s.cam.c, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), lp = ctx.createBiquadFilter(), amp = ctx.createGain();
  a.type = 'sawtooth'; b.type = 'triangle';
  a.frequency.value = b.frequency.value = f;
  a.detune.value = -4; b.detune.value = 3;
  lp.type = 'lowpass'; lp.Q.value = 1.2;
  lp.frequency.setValueAtTime(380, t);
  lp.frequency.exponentialRampToValueAtTime(1500, t + 0.035);
  lp.frequency.setTargetAtTime(700, t + 0.035, 0.12);
  const pico = 0.1 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.025);
  amp.gain.setTargetAtTime(pico * 0.55, t + 0.025, 0.14);
  amp.gain.setValueAtTime(pico * 0.55, t + dur);
  amp.gain.setTargetAtTime(0, t + dur, 0.05);
  a.connect(lp); b.connect(lp); lp.connect(amp).connect(cam.entrada);
  const r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
  r.buffer = s.ruido; rf.type = 'bandpass'; rf.frequency.value = 1800; rf.Q.value = 1.1;
  rg.gain.setValueAtTime(0, t);
  rg.gain.linearRampToValueAtTime(0.05 * vel, t + 0.01);
  rg.gain.setTargetAtTime(0, t + 0.01, 0.025);
  r.connect(rf).connect(rg).connect(cam.entrada);
  const fim = t + dur + 0.35;
  r.start(t, Math.random() * 1.5); r.stop(t + 0.15);
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  soltar(cam, [a, b, lp, amp, r, rf, rg], [r, a, b]);
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

// zabumba de couro: baque grave (seno que cai) + tapa na pele; "abafado" = a mão segura o couro
function zabumba(s, t, vel = 1, abafado = false) {
  const ctx = s.ctx;
  const o = ctx.createOscillator(), amp = ctx.createGain();
  o.frequency.setValueAtTime(abafado ? 140 : 125, t);
  o.frequency.exponentialRampToValueAtTime(abafado ? 90 : 66, t + 0.11);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.3 * vel, t + 0.004);
  amp.gain.setTargetAtTime(0, t + 0.004, abafado ? 0.04 : 0.13);
  o.connect(amp).connect(s.cam.j.entrada);
  o.start(t); o.stop(t + (abafado ? 0.3 : 0.8));
  soltar(s.cam.j, [o, amp], [o]);
  golpe(s, t, s.perc.couro, 0.16 * vel, 0.002, abafado ? 0.012 : 0.025);
}

// triângulo: três parciais inarmônicas; aberto (soa) ou abafado (curto)
function triangulo(s, t, aberto, vel) {
  const ctx = s.ctx, amp = ctx.createGain(), fontes = [];
  const pico = 0.013 * vel, queda = aberto ? 0.2 : 0.022;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.001);
  amp.gain.setTargetAtTime(0, t + 0.001, queda);
  for (const [fq, g] of [[3950, 1], [5690, 0.6], [8430, 0.4]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = fq; og.gain.value = g;
    o.connect(og).connect(amp);
    o.start(t); o.stop(t + 0.001 + queda * 6);
    fontes.push(o, og);
  }
  amp.connect(s.cam.j.entrada);
  soltar(s.cam.j, [...fontes, amp], fontes.filter(n => n.start));
}

// caxixi: as sementes batem no fundo e na tampa (dois choques bem juntos)
function caxixi(s, t, vel = 1) {
  golpe(s, t, s.perc.caxixi, 0.13 * vel, 0.006, 0.018, 0.9 + Math.random() * 0.2);
  golpe(s, t + 0.028, s.perc.caxixi, 0.09 * vel, 0.004, 0.022, 0.9 + Math.random() * 0.2);
}

// ---------------------------------------------------------------- arranjo de um compasso
// tipo 0: pífano canta o A, rabeca canta o B; viola ponteia em colcheias
// tipo 1: rabeca canta o A uma oitava abaixo (o pífano segura notas longas por cima), os dois em oitavas no B;
//         viola rasgando o baião; percussão magra no começo
// tipo 2: pífano enfeitado (apojaturas e trinados) no A sobre o bordão da rabeca; rabeca e pífano em uníssono no B,
//         viola em semicolcheias no B, rufos de zabumba nas cadências
function montarCompasso(s, ciclo, comp) {
  const ev = [];
  const add = (b, fn) => ev.push([b, fn]);
  const h = HARMONIA[comp];
  const tipo = ciclo % 3;
  const secaoB = comp >= 8;
  const cadencia = comp === 7 || comp === 15;
  const bordao = h.r + 12;                                         // nota grave da viola (bordão)

  // ---- viola
  const T = [bordao, h.v[0], h.v[1], h.v[2], h.v[0] + 12];
  if (cadencia) {
    add(0, t => rasgado(s, t, [bordao, ...h.v], TEMPO * 0.9, 0.6));
    add(1, t => viola(s, t, h.v[2], TEMPO * 0.9, 0.45));
    add(2, t => rasgado(s, t, [bordao, ...h.v, h.v[0] + 12], TEMPO * 2, 0.62));
  } else if (tipo === 1) {
    // baião rasgado: desce, sobe, desce | desce, sobe, sobe
    for (const [b, sobe, v] of [[0, false, 0.62], [0.75, true, 0.4], [1.5, false, 0.48], [2, false, 0.58], [2.75, true, 0.4], [3.5, true, 0.45]]) {
      add(b, t => rasgado(s, t, sobe ? h.v : [bordao, ...h.v], TEMPO * (b % 1 ? 0.6 : 0.7), v, sobe));
    }
  } else {
    const semi = tipo === 2 && secaoB;
    const fig = semi ? [0, 2, 3, 4, 1, 3, 2, 4, 0, 2, 3, 4, 1, 3, 2, 3] : [0, 2, 1, 3, 0, 2, 4, 3];
    const passoFig = semi ? 0.25 : 0.5;
    fig.forEach((i, k) => {
      const b = k * passoFig;
      const forte = semi ? k % 4 === 0 : k % 2 === 0;
      add(b, t => viola(s, t, T[i], passoFig * TEMPO * (i === 0 ? 3.6 : 1.8), (semi ? 0.36 : 0.46) * (forte ? 1 : 0.8)));
    });
  }

  // ---- melodia: quem canta neste compasso
  const notas = MELODIA.filter(n => n[0] === comp);
  const longa = d => d >= 1.5;
  const tocar = (inst, b, m, d, vel, enfeite) => add(b, t => {
    const dd = d * TEMPO * (d <= 0.5 ? 0.84 : 0.92);
    if (inst === 'pifano') {
      if (enfeite === 'trilo') pifano(s, t, m, dd, vel, acima(m) - m);
      else if (enfeite === 'apoj') pifanoEnfeitado(s, t, m, dd, vel);
      else pifano(s, t, m, dd, vel);
    } else rabeca(s, t, m, dd, vel);
  });
  for (const [, b, m, d] of notas) {
    if (tipo === 0) {
      tocar(secaoB ? 'rabeca' : 'pifano', b, m, d, 1);
    } else if (tipo === 1) {
      if (!secaoB) tocar('rabeca', b, m - 12, d, 1.15);
      else { tocar('pifano', b, m, d, 0.85); tocar('rabeca', b, m - 12, d, 0.8); }
    } else {
      if (!secaoB) {
        const enf = longa(d) ? 'trilo' : (d >= 1 && b % 1 === 0 ? 'apoj' : null);
        tocar('pifano', b, m, d, 1, enf);
      } else { tocar('rabeca', b, m, d, 0.8); tocar('pifano', b, m, d, 0.7); }
    }
  }
  // contracantos
  if (tipo === 1 && !secaoB && comp % 2 === 0) {
    add(0, t => pifano(s, t, h.v[2] + 12, TEMPO * 3.7, 0.5));       // o pífano segura a quinta por cima da rabeca
  }
  if (tipo === 2 && !secaoB) {                                       // bordão de rabeca em corda dupla (ré-lá)
    if (comp % 2 === 0) add(0, t => { rabeca(s, t, 62, TEMPO * 7.6, 0.4, 8); rabeca(s, t + 0.01, 69, TEMPO * 7.6, 0.32, 8); });
  }
  if (tipo === 0 && secaoB && comp % 2 === 1 && !cadencia) {        // o pífano responde o fim das frases da rabeca
    add(3, t => pifanoEnfeitado(s, t, h.v[2] + 12, TEMPO * 0.9, 0.55));
  }

  // ---- rabecão no desenho do baião (1, "a" do 1, 3, "a" do 3) com aproximação para o próximo acorde
  const prox = HARMONIA[(comp + 1) % COMPASSOS];
  let alvoR = prox.r; while (alvoR > h.r + 7) alvoR -= 12; while (alvoR < h.r - 5) alvoR += 12;
  const aprox = alvoR === h.r ? h.r + 7 : (ESCALA.has((alvoR - 2 + 120) % 12) ? alvoR - 2 : alvoR - 1);
  let baixo;
  if (cadencia) baixo = [[0, h.r, 0.7], [0.75, h.r, 1.1], [2, h.r + 7, 0.7], [2.75, h.r, 1.2]];
  else if (tipo === 1 && !secaoB && comp < 2) baixo = [[0, h.r, 1.8], [2, h.r + 7, 1.8]];
  else baixo = [[0, h.r, 0.7], [0.75, h.r + 7, 1.1], [2, h.r, 0.7], [2.75, aprox, 1.1]];
  for (const [b, m, d] of baixo) {
    const nota = m > 52 ? m - 12 : m < 33 ? m + 12 : m;
    add(b, t => rabecao(s, t, nota, d * TEMPO * 0.85, b % 2 === 0 ? 1 : 0.78));
  }

  // ---- percussão: baião leve
  const magro = tipo === 1 && !secaoB && comp < 4;
  for (const [b, v] of magro ? [[0, 0.9], [2, 0.75]] : [[0, 1], [0.75, 0.62], [2, 0.88], [2.75, 0.6]]) add(b, t => zabumba(s, t, v));
  if (!magro) for (const b of [1.5, 3.5]) add(b, t => zabumba(s, t, 0.35, true));
  if (!magro) for (const b of [1, 3]) add(b, t => golpe(s, t, s.perc.bacalhau, 0.13, 0.001, 0.018));
  if (cadencia && tipo !== 1) {
    const rufo = tipo === 2 ? [3, 3.25, 3.5, 3.75] : [3.5, 3.75];
    rufo.forEach((b, i) => add(b, t => zabumba(s, t, 0.35 + i * 0.13, i < rufo.length - 1)));
  }
  for (let k = 0; k < 16; k++) {
    const aberto = k % 4 === 2;
    if (magro && !aberto) continue;
    add(k / 4, t => triangulo(s, t, aberto, aberto ? 1 : (k % 2 ? 0.4 : 0.6)));
  }
  if (!magro) for (const b of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) add(b, t => caxixi(s, t, b % 1 ? 1 : 0.6));

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
  const molhado = novo(ctx.createGain()); molhado.gain.value = 0.72;
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
  s.mestre.gain.linearRampToValueAtTime(VOLUME_MUSICA, t0 + 1.8);

  s.cam = {
    f: criarCamada(ctx, s, { pan: -0.25, envio: 0.26, lfoHz: 0.37, filtros: [
      { tipo: 'highpass', f: 90, q: 0.6 }, { tipo: 'peaking', f: 240, q: 1, g: 2.5 },          // caixa de madeira
      { tipo: 'peaking', f: 2600, q: 1.2, g: 2 }, { tipo: 'lowpass', f: 8000, q: 0.5 }] }),
    o: criarCamada(ctx, s, { pan: 0.2, envio: 0.36, lfoHz: 0.43, filtros: [
      { tipo: 'highpass', f: 200, q: 0.6 }, { tipo: 'peaking', f: 520, q: 1.4, g: 3 },          // corpo da rabeca
      { tipo: 'peaking', f: 1550, q: 1.8, g: 4 }, { tipo: 'lowpass', f: 6500, q: 0.5 }] }),    // e o anasalado
    j: criarCamada(ctx, s, { pan: 0.08, envio: 0.16, lfoHz: 0.51 }),
    c: criarCamada(ctx, s, { pan: -0.02, envio: 0.12, lfoHz: 0.29, filtros: [
      { tipo: 'peaking', f: 180, q: 1, g: 3 }, { tipo: 'peaking', f: 700, q: 1.3, g: 2.5 }, { tipo: 'lowpass', f: 2200, q: 0.6 }] }),
  };

  // vibratos compartilhados: pífano nervoso (6,4 Hz), rabeca larga (5,2 Hz)
  const vp = novo(ctx.createOscillator()); vp.frequency.value = 6.4;
  s.vibP = novo(ctx.createGain()); s.vibP.gain.value = 1;
  vp.connect(s.vibP); vp.start(); s.osc.push(vp);
  const vr = novo(ctx.createOscillator()); vr.frequency.value = 5.2;
  s.vibR = novo(ctx.createGain()); s.vibR.gain.value = 1;
  vr.connect(s.vibR); vr.start(); s.osc.push(vr);

  // filtros fixos: cada golpe só cria fonte + ganho
  const filtro = (tipo, f, q, dest = s.cam.j.entrada) => { const b = novo(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
  s.perc = {
    couro: filtro('bandpass', 700, 1.1),       // tapa no couro da zabumba
    bacalhau: filtro('bandpass', 3400, 2.5),   // vareta por baixo da zabumba
    caxixi: filtro('highpass', 5200, 0.7),     // sementes
    unha: filtro('highpass', 3000, 0.7, s.cam.f.entrada),  // unha/palheta na viola (na camada da viola)
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
