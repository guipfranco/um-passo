// O Gabinete: lo-fi jazz de fim de tarde ("prorroga 90 dias"), todo sintetizado em Web Audio.
//
// Lá menor, 80 bpm, swing de colcheia, ciclo de 16 compassos (A = 8, B = 8) com três rodadas que se alternam
// depois da abertura. Menos tenso que os outros lo-fi: a melancolia de quem espera o prazo vencer de novo.
// Som de fita: saturação leve, lowpass de 3,6 kHz, wow e flutter na afinação e chiado de vinil por baixo.
//
// Quatro camadas, uma por medidor (como no Reigns):
//   f (Família)  -> piano elétrico (FM, jeito de Rhodes): acordes de nona dedilhados, preguiçosos
//   o (Opinião)  -> flauta com sopro: melodia que entra no A e canta no B, vibrato que chega depois do ataque
//   j (Blindagem)-> bateria boom-bap empoeirada: bumbo, caixa atrasada, chimbal com swing, aro fantasma
//   c (Caixa)    -> baixo redondo (seno + triângulo, lowpass), notas curtas e uma ou outra ligadura
// O volume de cada camada segue o medidor (50 = normal, 0 quase some, 100 alto). Em perigo (<=15 ou >=85)
// a camada desafina oscilando (LFO no detune de cada fonte, ~±20 a 40 cents).
//
// API:
//   iniciarMusica(ctx, destino)  niveis({ f, o, j, c })  pararMusica(fade = 1.5)  tensao(v)

const BPM = 80;
const TEMPO = 60 / BPM;          // uma semínima
const PASSO = TEMPO / 4;         // semicolcheia: a grade do agendador
const SWING = 0.14 * TEMPO;      // o contratempo da colcheia chega atrasado
const SWING16 = 0.06 * TEMPO;    // e as semicolcheias de passagem, um pouco
const ANTECEDENCIA = 0.1;        // agenda 100 ms à frente
const INTERVALO_MS = 25;
const VOLUME_MUSICA = 0.27;      // ~-25 LUFS, no meio das outras músicas do jogo (-20 a -30)

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const humano = () => (Math.random() - 0.5) * 0.012;   // mais solto que as outras: lo-fi não é quantizado

// ---------------------------------------------------------------- partitura
// v = voicing do piano elétrico (sem fundamental), r = fundamental do baixo
// Am9 | D9 | Gmaj9 | Cmaj9 | Fmaj7(#11) | Bm7(b5) | E7(b9) | E7sus4 E7(b9)   (os dois blocos de 8 usam o mesmo laço)
const HARMONIA = [
  [{ b: 0, v: [55, 59, 60, 64], r: 45 }],
  [{ b: 0, v: [54, 57, 60, 64], r: 38 }],
  [{ b: 0, v: [54, 57, 59, 62], r: 43 }],
  [{ b: 0, v: [52, 55, 59, 62], r: 36 }],
  [{ b: 0, v: [53, 57, 59, 64], r: 41 }],
  [{ b: 0, v: [53, 57, 59, 62], r: 35 }],
  [{ b: 0, v: [53, 56, 59, 62], r: 40 }],
  [{ b: 0, v: [52, 57, 59, 62], r: 40 }, { b: 2, v: [53, 56, 59, 62], r: 40 }],
];

// melodias da flauta: [compasso, tempo, nota, duração em tempos]
const MELODIA_A = [
  [4, 0.5, 76, 0.5], [4, 1, 79, 1], [4, 2, 76, 1], [4, 3, 74, 1],
  [5, 0, 72, 1.5], [5, 1.5, 74, 0.5], [5, 2, 76, 2],
  [6, 0.5, 74, 0.5], [6, 1, 71, 1.5], [6, 2.5, 74, 1.5],
  [7, 0, 72, 2], [7, 2, 71, 2],
];
const MELODIA_B = [
  [8, 0, 84, 1.5], [8, 1.5, 83, 0.5], [8, 2, 79, 2],
  [9, 0.5, 78, 0.5], [9, 1, 81, 1], [9, 2, 76, 2],
  [10, 0, 74, 1], [10, 1, 78, 1], [10, 2, 81, 2],
  [11, 0, 83, 2], [11, 2, 79, 2],
  [12, 0.5, 81, 0.5], [12, 1, 83, 1], [12, 2, 76, 2],
  [13, 0, 77, 1], [13, 1, 74, 1], [13, 2, 71, 2],
  [14, 0, 80, 1.5], [14, 1.5, 77, 0.5], [14, 2, 74, 2],
  [15, 0, 76, 2], [15, 2, 71, 2],
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

// vinil: só o chiado (o "mar" da fita), sem os estalos (o Gui pediu, 23/10); laço de 7 s, estéreo
const cacheVinil = new WeakMap();
function vinil(ctx) {
  let b = cacheVinil.get(ctx);
  if (!b) {
    const sr = ctx.sampleRate, n = Math.floor(sr * 7);
    b = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) { lp += 0.08 * ((Math.random() * 2 - 1) - lp); d[i] = lp * 0.05; }
    }
    cacheVinil.set(ctx, b);
  }
  return b;
}

// quarto pequeno e abafado: cauda curta, agudos escuros
function impulso(ctx, dur = 1.4) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      lp += 0.22 * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * 3.6) * (1 - Math.exp(-t * 60));
    }
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
  const osc = [];
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

// Liga as fontes ao LFO de desafinação da camada (e ao wow da fita, nas que têm altura) e limpa tudo no fim.
function soltar(s, camada, nos, fontes, aoFim = null, fita = true) {
  for (const f of fontes) if (f.detune) { camada.prof.connect(f.detune); if (fita) s.wow.connect(f.detune); }
  fontes[fontes.length - 1].onended = () => {
    for (const f of fontes) if (f.detune) {
      try { camada.prof.disconnect(f.detune); } catch (e) {}
      if (fita) { try { s.wow.disconnect(f.detune); } catch (e) {} }
    }
    if (aoFim) aoFim();
    for (const n of nos) { try { n.disconnect(); } catch (e) {} }
  };
}

// ---------------------------------------------------------------- instrumentos
// Piano elétrico: FM de razão 1 com índice que "late" no ataque e assenta, mais o sino curto da palheta
function rhodes(s, t, m, dur, vel = 0.7) {
  const ctx = s.ctx, cam = s.cam.f, f = mtof(m);
  const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
  const sino = ctx.createOscillator(), sg = ctx.createGain(), amp = ctx.createGain();
  car.frequency.value = f; mod.frequency.value = f; sino.frequency.value = f * 4.02;
  mg.gain.setValueAtTime(f * (0.7 + 1.1 * vel), t);
  mg.gain.setTargetAtTime(f * 0.16, t, 0.09);
  mod.connect(mg).connect(car.frequency);
  const pico = 0.13 * vel;
  const tau = 1.6 * Math.pow(262 / f, 0.35);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.004);
  amp.gain.setTargetAtTime(pico * 0.5, t + 0.004, 0.22);
  amp.gain.setTargetAtTime(0, t + Math.min(0.3, dur), tau);
  amp.gain.setTargetAtTime(0, t + dur, 0.09);
  sg.gain.setValueAtTime(0, t);
  sg.gain.linearRampToValueAtTime(pico * 0.22, t + 0.002);
  sg.gain.setTargetAtTime(0, t + 0.002, 0.06);
  car.connect(amp); sino.connect(sg).connect(amp);
  amp.connect(cam.entrada);
  const fim = t + dur + 0.6;
  for (const o of [mod, sino, car]) { o.start(t); o.stop(fim); }
  soltar(s, cam, [car, mod, mg, sino, sg, amp], [mod, sino, car]);
}

// acorde dedilhado de baixo para cima, devagar, como quem toca de madrugada
function acorde(s, t, notas, dur, vel = 0.7) {
  notas.forEach((m, i) => {
    const atraso = i * 0.016 + Math.abs(humano());
    rhodes(s, t + atraso, m, Math.max(0.2, dur - atraso), vel * (0.85 + Math.random() * 0.15) * (i === notas.length - 1 ? 1.1 : 1));
  });
}

// Flauta: seno + um pouco de triângulo, sopro de ruído no ataque e vibrato que só entra depois de 0,3 s
function flauta(s, t, m, dur, vel = 0.8) {
  const ctx = s.ctx, cam = s.cam.o, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), gb = ctx.createGain(), amp = ctx.createGain(), vib = ctx.createGain();
  b.type = 'triangle';
  a.frequency.value = b.frequency.value = f;
  gb.gain.value = 0.25;
  vib.gain.setValueAtTime(0, t);
  vib.gain.setValueAtTime(0, t + Math.min(0.3, dur * 0.4));
  vib.gain.linearRampToValueAtTime(1, t + Math.min(0.7, dur * 0.8));
  s.vibratoSolo.connect(vib); vib.connect(a.detune); vib.connect(b.detune);
  const pico = 0.08 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.05);
  amp.gain.setTargetAtTime(pico * 0.82, t + 0.05, 0.2);
  amp.gain.setTargetAtTime(0, t + dur, 0.07);
  a.connect(amp); b.connect(gb).connect(amp); amp.connect(cam.entrada);
  // sopro: ruído em banda na altura da nota, só no ataque
  const so = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), gs = ctx.createGain();
  so.buffer = s.ruido; bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
  gs.gain.setValueAtTime(0, t);
  gs.gain.linearRampToValueAtTime(0.05 * vel, t + 0.02);
  gs.gain.setTargetAtTime(0.008 * vel, t + 0.02, 0.06);
  gs.gain.setTargetAtTime(0, t + dur, 0.05);
  so.connect(bp).connect(gs).connect(cam.entrada);
  const fim = t + dur + 0.5;
  so.start(t, Math.random() * 1.4); so.stop(fim);
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  soltar(s, cam, [a, b, gb, amp, vib, so, bp, gs], [so, b, a], () => { try { s.vibratoSolo.disconnect(vib); } catch (e) {} });
}

// Baixo redondo: seno + triângulo no lowpass; liga = nota de chegada (glissando no fim)
function baixo(s, t, m, dur, vel = 1, liga = null) {
  const ctx = s.ctx, cam = s.cam.c, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), gb = ctx.createGain(), lp = ctx.createBiquadFilter(), amp = ctx.createGain();
  b.type = 'triangle';
  for (const o of [a, b]) {
    o.frequency.setValueAtTime(f, t);
    if (liga != null) { o.frequency.setValueAtTime(f, t + dur * 0.55); o.frequency.exponentialRampToValueAtTime(mtof(liga), t + dur); }
  }
  gb.gain.value = 0.35;
  lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7;
  const pico = 0.1 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.008);
  amp.gain.setTargetAtTime(pico * 0.6, t + 0.008, 0.25);
  amp.gain.setTargetAtTime(0, t + dur, 0.05);
  a.connect(lp); b.connect(gb).connect(lp); lp.connect(amp).connect(cam.entrada);
  const fim = t + dur + 0.4;
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  soltar(s, cam, [a, b, gb, lp, amp], [b, a]);
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
  soltar(s, s.cam.j, [src, amp], [src], null, false);
}

// bumbo: seno que cai de 115 para 45 Hz, com o estalo do batedor
function bumbo(s, t, vel = 1) {
  const ctx = s.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(115, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.08);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28 * vel, t + 0.002);
  g.gain.setTargetAtTime(0, t + 0.002, 0.16);
  o.connect(g).connect(s.cam.j.entrada);
  o.start(t); o.stop(t + 1);
  soltar(s, s.cam.j, [o, g], [o], null, false);
  golpe(s, t, s.perc.batedor, 0.07 * vel, 0.0008, 0.004);
}

// caixa: ruído em banda + o corpo da pele; chega uns 14 ms atrasada, de propósito
function caixa(s, t, vel = 1) {
  const ctx = s.ctx, tt = t + 0.014, o = ctx.createOscillator(), g = ctx.createGain();
  golpe(s, tt, s.perc.caixa, 0.2 * vel, 0.001, 0.085);
  o.type = 'triangle';
  o.frequency.setValueAtTime(190, tt);
  o.frequency.exponentialRampToValueAtTime(165, tt + 0.06);
  g.gain.setValueAtTime(0, tt);
  g.gain.linearRampToValueAtTime(0.07 * vel, tt + 0.002);
  g.gain.setTargetAtTime(0, tt + 0.002, 0.05);
  o.connect(g).connect(s.cam.j.entrada);
  o.start(tt); o.stop(tt + 0.5);
  soltar(s, s.cam.j, [o, g], [o], null, false);
}

const chimbal = (s, t, vel = 1, aberto = false) => golpe(s, t, s.perc.chimbal, 0.06 * vel, 0.0008, aberto ? 0.11 : 0.02, 1.1);
const aro = (s, t, vel = 1) => golpe(s, t, s.perc.aro, 0.07 * vel, 0.0005, 0.012);

// ---------------------------------------------------------------- arranjo de um compasso
// rodada 0 = abertura (piano sozinho, depois o baixo e a bateria); depois 1, 2, 3 se revezam
// (≈ 48 s cada ciclo)
function montarCompasso(s, compAbs) {
  const ev = [];
  const add = (b, fn) => ev.push([b, fn]);
  const comp = compAbs % 16, secaoB = comp >= 8;
  const ciclo = Math.floor(compAbs / 16);
  const rod = ciclo === 0 ? 0 : 1 + ((ciclo - 1) % 3);
  const acordes = HARMONIA[comp % 8];
  const intro = rod === 0 && comp < 2;
  const pausa = rod === 3 && (comp === 12 || comp === 13);   // a bateria sai dois compassos, o piano segura

  // piano elétrico: o acorde no tempo 1 e, fora da abertura, uma antecipação no "e" do 3
  acordes.forEach((a, i) => {
    const fimB = i + 1 < acordes.length ? acordes[i + 1].b : 4;
    add(a.b, t => acorde(s, t, a.v, (fimB - a.b) * TEMPO * 0.96, intro ? 0.5 : 0.62));
  });
  if (!intro && acordes.length === 1 && (secaoB || rod === 2)) add(2.5, t => acorde(s, t, acordes[0].v.slice(1), TEMPO * 1.2, 0.4));

  // flauta: A da abertura e da rodada 2; B sempre, uma oitava abaixo na rodada 3
  const desce = rod === 3 ? -12 : 0;
  const melodias = [...(rod === 0 || rod === 2 ? MELODIA_A : []), ...MELODIA_B];
  for (const [c, b, m, d] of melodias) if (c === comp) add(b, t => flauta(s, t, m + desce, d * TEMPO * 0.94, rod === 3 ? 0.95 : 0.8));

  // baixo: fundamental, quinta no contratempo e uma ligadura para o próximo acorde no fim do compasso
  if (!intro) {
    const prox = HARMONIA[(comp + 1) % 8][0].r;
    const [a0, a1] = [acordes[0], acordes[1] || acordes[0]];
    add(0, t => baixo(s, t, a0.r, TEMPO * 1.3, 1));
    add(1.75, t => baixo(s, t, a0.r, TEMPO * 0.4, 0.7));
    add(2.5, t => baixo(s, t, a1.r + 7, TEMPO * 0.7, 0.8));
    if (comp % 2 === 1) add(3.5, t => baixo(s, t, a1.r + 12, TEMPO * 0.5, 0.7, prox + 12));
  }

  // bateria boom-bap (só chimbal e bumbo nos compassos 2 e 3 da abertura)
  if (!intro && !pausa) {
    const leve = rod === 0 && comp < 4;
    add(0, t => bumbo(s, t, 1));
    add(2.5, t => bumbo(s, t, 0.85));
    if (comp % 2 === 1) add(2.75, t => bumbo(s, t, 0.55));
    if (!leve) { add(1, t => caixa(s, t, 1)); add(3, t => caixa(s, t, 0.95)); }
    for (let k = 0; k < 8; k++) add(k / 2, t => chimbal(s, t, k % 2 ? 0.55 : 1, k === 7 && comp % 8 === 7));
    if (!leve) { add(1.75, t => aro(s, t, 0.5)); if (comp % 4 === 3) add(3.75, t => aro(s, t, 0.6)); }
  }
  if (pausa) for (let k = 0; k < 8; k++) add(k / 2, t => chimbal(s, t, k % 2 ? 0.3 : 0.5));
  // virada antes do refrão e no fim do ciclo: caixa fantasma em semicolcheias
  if ((comp === 7 || comp === 15) && rod !== 0) for (const b of [3, 3.25, 3.5, 3.75]) add(b, t => caixa(s, t, 0.25 + (b - 3) * 0.5));

  // agrupa por semicolcheia, com o swing no tempo de cada evento
  const baldes = Array.from({ length: 16 }, () => []);
  for (const [b, fn] of ev) {
    const q = b * 4, k = Math.floor(q + 1e-6), frac = (q - k) * PASSO;
    const resto = Math.round((b % 1) * 4);
    const atraso = resto === 2 ? SWING : resto % 2 === 1 ? SWING16 : 0;
    baldes[k % 16].push(t => fn(t + frac + atraso));
  }
  return baldes;
}

function agendarPasso(s, passo, t) {
  const compAbs = Math.floor(passo / 16), k = passo % 16;
  if (k === 0) s.baldes = montarCompasso(s, compAbs);
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

  // mestre: barramento + reverb -> fita (saturação + lowpass) -> abafador (tensão) -> ganho da tensão -> fade
  // -> compressor -> destino; o vinil entra antes do abafador
  s.barramento = novo(ctx.createGain());
  s.reverb = novo(ctx.createConvolver()); s.reverb.buffer = impulso(ctx);
  const molhado = novo(ctx.createGain()); molhado.gain.value = 0.6;
  const satura = novo(ctx.createWaveShaper()); satura.curve = curvaFita(); satura.oversample = '2x';
  const fita = novo(ctx.createBiquadFilter()); fita.type = 'lowpass'; fita.frequency.value = 3600; fita.Q.value = 0.5;
  const graves = novo(ctx.createBiquadFilter()); graves.type = 'highpass'; graves.frequency.value = 38; graves.Q.value = 0.6;
  s.abafa = novo(ctx.createBiquadFilter()); s.abafa.type = 'lowpass'; s.abafa.Q.value = 0.9;
  s.tens = novo(ctx.createGain());
  s.mestre = novo(ctx.createGain());
  const comp = novo(ctx.createDynamicsCompressor());
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.012; comp.release.value = 0.3;
  s.barramento.connect(satura);
  s.reverb.connect(molhado).connect(satura);
  satura.connect(fita).connect(graves).connect(s.abafa);
  s.abafa.connect(s.tens).connect(s.mestre).connect(comp).connect(destino);

  const disco = novo(ctx.createBufferSource()); disco.buffer = vinil(ctx); disco.loop = true;
  const gDisco = novo(ctx.createGain()); gDisco.gain.value = 0.55;
  const bpDisco = novo(ctx.createBiquadFilter()); bpDisco.type = 'bandpass'; bpDisco.frequency.value = 2400; bpDisco.Q.value = 0.4;
  disco.connect(bpDisco).connect(gDisco).connect(s.abafa);
  disco.start(); s.osc.push(disco);

  const t0 = ctx.currentTime;
  s.mestre.gain.setValueAtTime(0, t0);
  s.mestre.gain.linearRampToValueAtTime(VOLUME_MUSICA, t0 + 2);

  s.cam = {
    f: criarCamada(ctx, s, { pan: -0.15, envio: 0.3, lfoHz: 0.37 }),
    o: criarCamada(ctx, s, { pan: 0.25, envio: 0.45, lfoHz: 0.43, filtro: { f: 2600, q: 0.5 } }),
    j: criarCamada(ctx, s, { pan: 0.05, envio: 0.12, lfoHz: 0.51, filtro: { f: 6500, q: 0.4 } }),
    c: criarCamada(ctx, s, { pan: 0, envio: 0.04, lfoHz: 0.29 }),
  };

  // LFOs: wow (0,45 Hz, ~7 cents) e flutter (5,8 Hz, ~1,5 cent) da fita; vibrato da flauta (5,2 Hz, ~14 cents)
  const lfo = (hz, prof) => {
    const o = novo(ctx.createOscillator()); o.frequency.value = hz;
    const g = novo(ctx.createGain()); g.gain.value = prof;
    o.connect(g); o.start(); s.osc.push(o);
    return g;
  };
  s.wow = novo(ctx.createGain());
  lfo(0.45, 7).connect(s.wow);
  lfo(5.8, 1.5).connect(s.wow);
  s.vibratoSolo = lfo(5.2, 14);

  // filtros fixos da bateria: cada golpe só cria fonte + ganho
  const filtro = (tipo, f, q) => { const b = novo(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(s.cam.j.entrada); return b; };
  s.perc = {
    batedor: filtro('lowpass', 1500, 0.7),
    caixa: filtro('bandpass', 1900, 0.8),
    chimbal: filtro('highpass', 7200, 0.7),
    aro: filtro('bandpass', 3200, 6),
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
