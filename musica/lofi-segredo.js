// O Gabinete: lo-fi de madrugada, tenso ("segredo de justiça"), todo sintetizado em Web Audio.
//
// Ré menor com o Mi bemol do frígio (o bII que deixa tudo desconfiado), 64 bpm, quase sem swing, ciclo de
// 16 compassos (A = 8, B = 8) com três rodadas que se alternam depois da abertura. Som de fita: saturação leve,
// lowpass de 3 kHz, wow mais fundo que o normal (a fita parece cansada) e chiado de vinil.
//
// Quatro camadas, uma por medidor (como no Reigns):
//   f (Família)  -> piano elétrico (FM, jeito de Rhodes) escuro: acordes longos, quase sem ataque
//   o (Opinião)  -> caixinha de música na melodia + cordas abafadas que crescem no B
//   j (Blindagem)-> bateria em meio-tempo: bumbo de coração, aro no 3, chocalho baixinho
//   c (Caixa)    -> sub-baixo longo, uma nota por compasso, com ligadura no fim do laço
// O volume de cada camada segue o medidor (50 = normal, 0 quase some, 100 alto). Em perigo (<=15 ou >=85)
// a camada desafina oscilando (LFO no detune de cada fonte, ~±20 a 40 cents).
//
// API:
//   iniciarMusica(ctx, destino)  niveis({ f, o, j, c })  pararMusica(fade = 1.5)  tensao(v)

const BPM = 64;
const TEMPO = 60 / BPM;          // uma semínima
const PASSO = TEMPO / 4;         // semicolcheia: a grade do agendador
const SWING = 0.08 * TEMPO;      // um swing discreto: aqui a tensão vem do tempo arrastado, não do balanço
const SWING16 = 0.03 * TEMPO;
const ANTECEDENCIA = 0.1;        // agenda 100 ms à frente
const INTERVALO_MS = 25;
const VOLUME_MUSICA = 0.24;      // ~-25 LUFS, no meio das outras músicas do jogo (-20 a -30)

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const humano = () => (Math.random() - 0.5) * 0.012;

// ---------------------------------------------------------------- partitura
// v = voicing do piano elétrico (sem fundamental), r = fundamental do sub-baixo
// Dm(add9) | Dm(add9)/C | Bbmaj7(#11) | Ebmaj7(#11) | Dm(add9) | Gm9 | Ebmaj7(#11) | A7(b9)   (o laço serve aos dois blocos)
const HARMONIA = [
  [{ b: 0, v: [53, 57, 62, 64], r: 38 }],
  [{ b: 0, v: [53, 57, 62, 64], r: 36 }],
  [{ b: 0, v: [53, 57, 58, 64], r: 34 }],
  [{ b: 0, v: [55, 58, 62, 69], r: 39 }],
  [{ b: 0, v: [53, 57, 62, 64], r: 38 }],
  [{ b: 0, v: [53, 57, 58, 62], r: 43 }],
  [{ b: 0, v: [55, 58, 62, 69], r: 39 }],
  [{ b: 0, v: [55, 58, 61, 64], r: 33 }],
];

// melodias da caixinha: [compasso, tempo, nota, duração em tempos]
const MELODIA_A = [
  [4, 0, 74, 1], [4, 1, 77, 1], [4, 2, 76, 0.5], [4, 2.5, 74, 1.5],
  [5, 1, 72, 1], [5, 2, 69, 2],
  [6, 0, 70, 0.5], [6, 0.5, 74, 0.5], [6, 1, 77, 1], [6, 2, 75, 2],
  [7, 0, 73, 2], [7, 2, 76, 1], [7, 3, 70, 1],
];
const MELODIA_B = [
  [8, 0, 81, 1.5], [8, 1.5, 79, 0.5], [8, 2, 77, 2],
  [9, 0.5, 76, 0.5], [9, 1, 77, 1], [9, 2, 74, 2],
  [10, 0, 81, 1], [10, 1, 82, 1], [10, 2, 81, 2],
  [11, 0, 79, 1.5], [11, 1.5, 75, 0.5], [11, 2, 74, 2],
  [12, 0, 77, 1], [12, 1, 76, 1], [12, 2, 74, 2],
  [13, 0, 74, 1], [13, 1, 77, 1], [13, 2, 81, 2],
  [14, 0, 82, 1.5], [14, 1.5, 79, 0.5], [14, 2, 75, 2],
  [15, 0, 73, 1], [15, 1, 76, 1], [15, 2, 79, 1], [15, 3, 82, 1],
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

// sala média e escura: um pouco mais de cauda que o quarto do lo-fi de plantão
function impulso(ctx, dur = 2) {
  const n = Math.floor(ctx.sampleRate * dur);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      lp += 0.18 * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * 2.6) * (1 - Math.exp(-t * 50));
    }
  }
  return b;
}

// saturação de fita: tanh suave
function curvaFita(drive = 1.8) {
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
// Piano elétrico escuro: FM de razão 1 com pouco índice (sem o "latido"), ataque macio
function rhodes(s, t, m, dur, vel = 0.6) {
  const ctx = s.ctx, cam = s.cam.f, f = mtof(m);
  const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), amp = ctx.createGain();
  car.frequency.value = f; mod.frequency.value = f;
  mg.gain.setValueAtTime(f * (0.35 + 0.6 * vel), t);
  mg.gain.setTargetAtTime(f * 0.1, t, 0.15);
  mod.connect(mg).connect(car.frequency);
  const pico = 0.12 * vel;
  const tau = 2.2 * Math.pow(262 / f, 0.35);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.025);
  amp.gain.setTargetAtTime(pico * 0.6, t + 0.025, 0.4);
  amp.gain.setTargetAtTime(0, t + Math.min(0.5, dur), tau);
  amp.gain.setTargetAtTime(0, t + dur, 0.15);
  car.connect(amp).connect(cam.entrada);
  const fim = t + dur + 0.9;
  for (const o of [mod, car]) { o.start(t); o.stop(fim); }
  soltar(s, cam, [car, mod, mg, amp], [mod, car]);
}

function acorde(s, t, notas, dur, vel = 0.6) {
  notas.forEach((m, i) => {
    const atraso = i * 0.03 + Math.abs(humano());
    rhodes(s, t + atraso, m, Math.max(0.3, dur - atraso), vel * (0.85 + Math.random() * 0.15));
  });
}

// Caixinha de música: lâmina de metal (seno + parcial inarmônica ~3,98x que some logo), sem sustentação
function caixinha(s, t, m, dur, vel = 0.8) {
  const ctx = s.ctx, cam = s.cam.o, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), gb = ctx.createGain(), amp = ctx.createGain();
  a.frequency.value = f; b.frequency.value = f * 3.98;
  gb.gain.setValueAtTime(0, t);
  gb.gain.linearRampToValueAtTime(0.4, t + 0.001);
  gb.gain.setTargetAtTime(0, t + 0.001, 0.06);
  const pico = 0.1 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.002);
  amp.gain.setTargetAtTime(0, t + 0.002, 0.55);
  a.connect(amp); b.connect(gb).connect(amp); amp.connect(cam.entrada);
  const fim = t + Math.max(dur, 0.5) + 2.2;
  a.start(t); b.start(t); a.stop(fim); b.stop(fim);
  soltar(s, cam, [a, b, gb, amp], [b, a]);
}

// Cordas abafadas (pad): 3 sawtooth desafinadas por nota, ataque lento de arco, vibrato lento
function cordas(s, t, notas, dur, pico = 0.014) {
  const ctx = s.ctx, cam = s.cam.o;
  for (const m of notas) {
    const amp = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(1800, t + dur * 0.6);
    const nos = [amp, lp], fontes = [];
    for (const dt of [-9, 0, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt + (Math.random() - 0.5) * 3;
      o.connect(lp); s.vibrato.connect(o.detune);
      nos.push(o); fontes.push(o);
    }
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(pico, t + Math.min(1.6, dur * 0.5));
    amp.gain.setValueAtTime(pico, t + dur);
    amp.gain.setTargetAtTime(0, t + dur, 0.4);
    lp.connect(amp).connect(cam.entrada);
    const fim = t + dur + 2;
    for (const o of fontes) { o.start(t); o.stop(fim); }
    soltar(s, cam, nos, fontes, () => { for (const o of fontes) { try { s.vibrato.disconnect(o.detune); } catch (e) {} } });
  }
}

// Sub-baixo: quase só seno, lowpass baixo; liga = nota de chegada (glissando no fim)
function baixo(s, t, m, dur, vel = 1, liga = null) {
  const ctx = s.ctx, cam = s.cam.c, f = mtof(m);
  const a = ctx.createOscillator(), b = ctx.createOscillator(), gb = ctx.createGain(), lp = ctx.createBiquadFilter(), amp = ctx.createGain();
  b.type = 'triangle';
  for (const o of [a, b]) {
    o.frequency.setValueAtTime(f, t);
    if (liga != null) { o.frequency.setValueAtTime(f, t + dur * 0.7); o.frequency.exponentialRampToValueAtTime(mtof(liga), t + dur); }
  }
  gb.gain.value = 0.2;
  lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.7;
  const pico = 0.12 * vel;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pico, t + 0.05);
  amp.gain.setTargetAtTime(pico * 0.75, t + 0.05, 0.8);
  amp.gain.setTargetAtTime(0, t + dur, 0.12);
  a.connect(lp); b.connect(gb).connect(lp); lp.connect(amp).connect(cam.entrada);
  const fim = t + dur + 0.8;
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

// bumbo de coração: seno que cai de 70 para 40 Hz, sem estalo
function bumbo(s, t, vel = 1) {
  const ctx = s.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3 * vel, t + 0.006);
  g.gain.setTargetAtTime(0, t + 0.006, 0.13);
  o.connect(g).connect(s.cam.j.entrada);
  o.start(t); o.stop(t + 1);
  soltar(s, s.cam.j, [o, g], [o], null, false);
}

const aro = (s, t, vel = 1) => golpe(s, t + 0.01, s.perc.aro, 0.11 * vel, 0.0005, 0.016);
const chocalho = (s, t, vel = 1) => golpe(s, t, s.perc.chocalho, 0.03 * vel, 0.006, 0.025, 1.2);

// ---------------------------------------------------------------- arranjo de um compasso
// rodada 0 = abertura (piano e vinil, depois o sub e o coração); depois 1, 2, 3 se revezam (≈ 60 s cada ciclo)
function montarCompasso(s, compAbs) {
  const ev = [];
  const add = (b, fn) => ev.push([b, fn]);
  const comp = compAbs % 16, secaoB = comp >= 8;
  const ciclo = Math.floor(compAbs / 16);
  const rod = ciclo === 0 ? 0 : 1 + ((ciclo - 1) % 3);
  const a = HARMONIA[comp % 8][0];
  const intro = rod === 0 && comp < 2;
  const pausa = rod === 3 && (comp === 12 || comp === 13);

  // piano elétrico: um acorde longo por compasso; no B, de novo no 3, mais baixo
  add(0, t => acorde(s, t, a.v, TEMPO * (secaoB ? 1.95 : 3.9), intro ? 0.45 : 0.58));
  if (secaoB && !pausa) add(2, t => acorde(s, t, a.v.slice(1), TEMPO * 1.9, 0.4));

  // caixinha: A na abertura e na rodada 2; B sempre
  const melodias = [...(rod === 0 || rod === 2 ? MELODIA_A : []), ...MELODIA_B];
  for (const [c, b, m, d] of melodias) if (c === comp) add(b, t => caixinha(s, t, m, d * TEMPO, b % 1 ? 0.7 : 0.85));

  // cordas: crescem no B (e no A da rodada 2), as três notas de cima uma oitava acima
  if (secaoB || rod === 2) add(0, t => cordas(s, t, a.v.slice(1).map(m => m + 12), TEMPO * 3.95, rod === 3 ? 0.018 : 0.013));

  // sub-baixo: uma nota por compasso; no fim do laço, ligadura para a volta
  if (!intro) {
    const prox = HARMONIA[(comp + 1) % 8][0].r;
    add(0, t => baixo(s, t, a.r, TEMPO * 3.8, 1, comp % 8 === 7 ? prox : null));
  }

  // bateria em meio-tempo (na abertura, os compassos 2 e 3 só têm o coração)
  if (!intro && !pausa) {
    const leve = rod === 0 && comp < 4;
    if (secaoB) for (const [b, v] of [[0, 1], [0.375, 0.55], [2, 0.85], [2.375, 0.45]]) add(b, t => bumbo(s, t, v));
    else { add(0, t => bumbo(s, t, 1)); add(2.75, t => bumbo(s, t, 0.6)); }
    if (!leve) add(2, t => aro(s, t, 1));
    if (!leve) for (let k = 0; k < 8; k++) add(k / 2, t => chocalho(s, t, k % 2 ? 0.6 : 1));
  }
  // fim do ciclo nas rodadas ímpares: aro em semicolcheias, crescendo
  if (comp === 15 && rod % 2 === 1) for (let k = 0; k < 8; k++) add(2 + k / 4, t => aro(s, t, 0.25 + 0.6 * (k / 7)));

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
  const molhado = novo(ctx.createGain()); molhado.gain.value = 0.7;
  const satura = novo(ctx.createWaveShaper()); satura.curve = curvaFita(); satura.oversample = '2x';
  const fita = novo(ctx.createBiquadFilter()); fita.type = 'lowpass'; fita.frequency.value = 3000; fita.Q.value = 0.5;
  const graves = novo(ctx.createBiquadFilter()); graves.type = 'highpass'; graves.frequency.value = 32; graves.Q.value = 0.6;
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
  const bpDisco = novo(ctx.createBiquadFilter()); bpDisco.type = 'bandpass'; bpDisco.frequency.value = 2200; bpDisco.Q.value = 0.4;
  disco.connect(bpDisco).connect(gDisco).connect(s.abafa);
  disco.start(); s.osc.push(disco);

  const t0 = ctx.currentTime;
  s.mestre.gain.setValueAtTime(0, t0);
  s.mestre.gain.linearRampToValueAtTime(VOLUME_MUSICA, t0 + 2);

  s.cam = {
    f: criarCamada(ctx, s, { pan: -0.15, envio: 0.4, lfoHz: 0.37, filtro: { f: 2000, q: 0.5 } }),
    o: criarCamada(ctx, s, { pan: 0.25, envio: 0.55, lfoHz: 0.43, filtro: { f: 4200, q: 0.4 } }),
    j: criarCamada(ctx, s, { pan: 0.05, envio: 0.15, lfoHz: 0.51, filtro: { f: 5500, q: 0.4 } }),
    c: criarCamada(ctx, s, { pan: 0, envio: 0.03, lfoHz: 0.29 }),
  };

  // LFOs: wow fundo (0,35 Hz, ~11 cents) e flutter (6,2 Hz, ~2 cents) da fita; vibrato lento das cordas
  const lfo = (hz, prof) => {
    const o = novo(ctx.createOscillator()); o.frequency.value = hz;
    const g = novo(ctx.createGain()); g.gain.value = prof;
    o.connect(g); o.start(); s.osc.push(o);
    return g;
  };
  s.wow = novo(ctx.createGain());
  lfo(0.35, 11).connect(s.wow);
  lfo(6.2, 2).connect(s.wow);
  s.vibrato = lfo(4.1, 6);

  // filtros fixos da bateria: cada golpe só cria fonte + ganho
  const filtro = (tipo, f, q) => { const b = novo(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(s.cam.j.entrada); return b; };
  s.perc = {
    aro: filtro('bandpass', 2600, 5),
    chocalho: filtro('bandpass', 6500, 1.2),
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
