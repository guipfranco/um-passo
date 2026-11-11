// Músicas eletrônicas do 2048 Astros, tocadas na hora pelo próprio aparelho (nada de arquivo de áudio).
// Mesma família da "Órbita" aprovada no rascunho som.html (2026-11-09): arpejo que gira, baixo, batida leve,
// acordes de fundo e eco. Interface igual à das outras trilhas: iniciarMusica(ctx, destino) e pararMusica(fade).
//
// Uma trilha pode ser fixa ou ter arranjo:
// - fixa (Estação): o cfg traz prog, raiz e os padrões, e todo compasso toca igual (só os acordes andam);
// - com arranjo (Órbita, Pulsar): cfg.arranjo(rnd, ciclo, estado) devolve os compassos de um ciclo, cada um só com
//   o que muda nele; o resto vem do cfg. O sorteio tem semente: cada vez que a trilha começa, uma semente nova.
//
// Campos de um compasso (todos opcionais, menos ch e raiz):
//   ch [4 notas MIDI], raiz (nota do baixo), pad (volume dos acordes de fundo, 0 = sem), padLp,
//   arp (desenho: índices nas notas do acorde, 4 a 7 = uma oitava acima; null = sem arpejo), arpCada, arpOnda, arpDur, arpV, arpLp,
//   baixo [passos], baixoNotas [intervalo em cada passo], baixoDur, baixoV, bumbo [passos], bumboV,
//   chimbal [passos], chimbalFraco [passos mais baixos], aberto [chimbal aberto], chimbalV, palma [passos], palmaV,
//   rolo {passo: força 0 a 1} (virada na caixa), corte (passo a partir do qual baixo e bateria param),
//   mel {passo: [nota, duração em passos]}, melV, melOnda, melLp, prato (volume do prato no tempo 1), sopro (volume do ruído
//   que sobe no compasso), stab [passos] (acorde curto de serras, para as camadas), stabV, stabLp, arpOit (arpejo N oitavas acima).
//
// Intensidade (o Frenesi): uma trilha com cfg.camadas(compasso, I, n) recebe a intensidade I (0 a 1) mandada pelo jogo
// (intensidade(v)) e devolve o compasso com as camadas que entram nela; vale já no passo seguinte, sem esperar o compasso
// acabar. Com cfg.tempo(I) o andamento também sobe, deslizando. Essas trilhas passam por um filtro geral e um compressor:
// quando a intensidade despenca (a corrente caiu), o filtro fecha e reabre (o "desligar"). acento() põe um prato no passo
// seguinte (degrau novo) e batida() diz onde a música está no tempo, para as luzes pulsarem junto.
// Trilha sem camadas (Estação, Órbita, Pulsar) toca exatamente como antes.

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// O eco (sala) é um só por contexto de áudio, feito na primeira trilha e reaproveitado pelas outras: gerar o ruído e
// entregá-lo ao convolver levava uns 130 ms no celular, e travava o jogo a cada troca de trilha (menu, fase, Clássico).
const SALAS = new WeakMap();
function sala(ctx, seg = 3.4) {
  let c = SALAS.get(ctx); if (c) return c;
  const n = Math.round(ctx.sampleRate * seg), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  c = ctx.createConvolver(); c.buffer = b; SALAS.set(ctx, c); return c;
}

// sorteio com semente (mulberry32): números entre 0 e 1, sempre os mesmos para a mesma semente
export function sorteio(semente) {
  let a = semente >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const escolhe = (rnd, lista) => lista[Math.floor(rnd() * lista.length)];

export function cria(cfg) {
  let E = null, I = 0;   // I: intensidade atual (0 a 1)
  // opc.semente fixa o sorteio (para medir e comparar); o jogo não passa nada
  function iniciarMusica(ctx, destino, opc = {}) {
    if (E) pararMusica(0.2);
    I = 0;
    const sai = ctx.createGain(); sai.gain.value = 0.0001; sai.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    // trilha com camadas: filtro geral (fecha quando a intensidade despenca) e compressor (as camadas somam volume)
    let mf = null;
    if (cfg.camadas) {
      mf = ctx.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 18000; mf.Q.value = 0.9;
      const cp = ctx.createDynamicsCompressor(); cp.threshold.value = -18; cp.knee.value = 8; cp.ratio.value = 3; cp.attack.value = 0.005; cp.release.value = 0.18;
      sai.connect(mf); mf.connect(cp); cp.connect(destino);
    } else sai.connect(destino);
    const rev = sala(ctx), rg = ctx.createGain(); rg.gain.value = 0.5; rev.connect(rg); rg.connect(sai);
    const dly = ctx.createDelay(1); dly.delayTime.value = 60 / cfg.bpm * 0.75;   // eco em colcheia pontuada
    const fb = ctx.createGain(), lp = ctx.createBiquadFilter(), dg = ctx.createGain(); fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 2400; dg.gain.value = 0.45;
    dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(dg); dg.connect(sai);
    const ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); { const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

    // Ganho que nasce fechado. O GainNode começa valendo 1, e o Chrome liga a fonte na amostra mais próxima de T mas só
    // aplica o envelope a partir da primeira amostra depois de T: quando T cai um fio acima de uma amostra (na Órbita,
    // a 100 bpm, toda nota cai em amostra redonda), a primeira amostra passava com ganho 1. No chiado (ruído no
    // passa-altas) isso dava um pico de até 0,8 no chimbal e na palma, mais alto que a música inteira: o estalo.
    const fechado = () => { const g = ctx.createGain(); g.gain.setValueAtTime(0, 0); return g; };
    const env = (g, T, a, v, d) => { g.gain.setValueAtTime(0.0001, T); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), T + a); g.gain.exponentialRampToValueAtTime(0.0001, T + a + d); };
    const saida = (g, o) => { let n = g; if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); n = p; }
      n.connect(sai); if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; n.connect(s); s.connect(rev); } if (o.dly) { const s = ctx.createGain(); s.gain.value = o.dly; n.connect(s); s.connect(dly); } };
    const tom = o => { const { T, f, to = null, type = 'sine', a = 0.005, d = 0.2, v = 0.1, lp = null, q = 0.7 } = o, os = ctx.createOscillator(), g = fechado();
      os.type = type; os.frequency.setValueAtTime(f, T); if (to) os.frequency.exponentialRampToValueAtTime(to, T + a + d);
      env(g, T, a, v, d); let n = os; if (lp) { const fl = ctx.createBiquadFilter(); fl.frequency.value = lp; fl.Q.value = q; os.connect(fl); n = fl; }
      n.connect(g); saida(g, o); os.start(T); os.stop(T + a + d + 0.1); };
    // ruído filtrado (chimbal, palma, prato); em laço para o prato, que é mais longo que o pedaço de ruído que sobra
    const chiado = o => { const { T, f, type = 'bandpass', d = 0.05, v = 0.03, q = 1 } = o, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = fechado();
      s.buffer = ruido; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(g, T, 0.002, v, d); s.connect(fl); fl.connect(g); saida(g, o); s.start(T, Math.random() * 0.5); s.stop(T + d + 0.1); };
    // ruído que sobe ao longo do compasso e some no tempo 1 do seguinte (anuncia a volta depois do respiro)
    const sopro = (T, dur, v) => { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = fechado();
      s.buffer = ruido; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(500, T); fl.frequency.exponentialRampToValueAtTime(7000, T + dur);
      g.gain.setValueAtTime(0.0001, T); g.gain.exponentialRampToValueAtTime(v, T + dur * 0.92); g.gain.linearRampToValueAtTime(0, T + dur);
      s.connect(fl); fl.connect(g); saida(g, { rev: 0.3 }); s.start(T, Math.random() * 0.5); s.stop(T + dur + 0.05); };
    const pad = (T, ms, dur, v, lpf) => { for (const m of ms) { const g = fechado(), fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.5;
        fl.frequency.setValueAtTime(lpf * 0.55, T); fl.frequency.linearRampToValueAtTime(lpf, T + dur * 0.5); fl.frequency.linearRampToValueAtTime(lpf * 0.55, T + dur);
        g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v, T + dur * 0.35); g.gain.setValueAtTime(v, T + dur * 0.6); g.gain.linearRampToValueAtTime(0, T + dur);
        for (const dt of [-8, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(fl); o.start(T); o.stop(T + dur + 0.1); }
        fl.connect(g); g.connect(sai); const s = ctx.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(rev); } };
    // acorde curto de serras desafinadas (camada do Frenesi), com o filtro fechando
    const stab = (T, ms, v, lpf) => { const g = fechado(), fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 1.4;
      fl.frequency.setValueAtTime(lpf, T); fl.frequency.exponentialRampToValueAtTime(lpf * 0.3, T + 0.16);
      env(g, T, 0.004, v, 0.17); fl.connect(g); saida(g, { rev: 0.25, dly: 0.12 });
      for (const m of ms) for (const dt of [-12, 12]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(fl); o.start(T); o.stop(T + 0.26); } };

    // compassos: fixos (a prog do cfg, em roda) ou vindos do arranjo, um ciclo por vez
    const rnd = sorteio(opc.semente ?? Math.floor(Math.random() * 4294967296)), estado = {};
    const fixo = cfg.prog ? cfg.prog.map((ch, i) => ({ ...cfg, ch, raiz: cfg.raiz[i] })) : null;
    let ciclo = 0, ini = 0, lista = [];
    const compasso = n => {
      if (!cfg.arranjo) return fixo[n % fixo.length];
      while (n >= ini + lista.length) { ini += lista.length; lista = cfg.arranjo(rnd, ciclo++, estado).map(c => ({ ...cfg, ...c })); }
      return lista[n - ini];
    };

    let bpm = cfg.tempo ? cfg.tempo(0) : cfg.bpm, P = 60 / bpm / 4, dlyBpm = cfg.bpm;   // P: semicolcheia
    const est = { acento: 0, marcas: [] };   // marcas: [hora, passo, semicolcheia] dos últimos passos (para a batida())
    let s = 0, prox = ctx.currentTime + 0.2, Bb = null, B = null, Iusado = -1;
    const passo = T => {
      const st = s % 16, n = Math.floor(s / 16);
      if (st === 0 || !Bb) { Bb = compasso(n); Iusado = -1; }
      if (Iusado !== I) { B = cfg.camadas ? cfg.camadas(Bb, I, n) : Bb; Iusado = I; }   // camadas da intensidade
      if (cfg.tempo) { bpm += (cfg.tempo(I) - bpm) * 0.06; P = 60 / bpm / 4;
        if (Math.abs(bpm - dlyBpm) > 0.5) { dlyBpm = bpm; dly.delayTime.setTargetAtTime(60 / bpm * 0.75, T, 0.4); } }
      est.marcas.push([T, s, P]); if (est.marcas.length > 40) est.marcas.shift();
      if (est.acento && st % 2 === 0) { chiado({ T, f: 5200, type: 'highpass', d: 1.3, v: 0.035 * est.acento, rev: 0.4 }); tom({ T, f: 140, to: 40, d: 0.3, v: 0.15 }); est.acento = 0; }
      const ch = B.ch;
      if (st === 0) {
        if (B.pad) pad(T, ch.map(m => m - 12), 16 * P * 1.1, B.pad, B.padLp || 1100);
        if (B.prato) chiado({ T, f: 5200, type: 'highpass', d: 1.1, v: B.prato, rev: 0.35 });
        if (B.sopro) sopro(T, 16 * P, B.sopro);
      }
      if (B.arp && st % B.arpCada === 0) { const k = (st / B.arpCada) % B.arp.length, idx = B.arp[k]; let m = ch[idx % 4] + 12 * Math.floor(idx / 4);
        if (B.arpOit) m += 12 * B.arpOit;
        tom({ T, f: mtof(m), type: B.arpOnda || 'square', a: 0.004, d: B.arpDur || 0.13, v: B.arpV, lp: (B.arpLp || 1500) + 800 * Math.sin(s / 40), q: 2, dly: 0.22, rev: 0.12, pan: Math.sin(s * 0.4) * 0.35 }); }
      const nm = B.mel && B.mel[st];
      if (nm) tom({ T, f: mtof(nm[0]), type: B.melOnda || 'triangle', a: 0.012, d: nm[1] * P * 0.9, v: B.melV, lp: B.melLp || 3600, dly: 0.3, rev: 0.22, pan: -0.15 });
      if (B.stab && B.stab.includes(st)) stab(T, ch, B.stabV || 0.02, B.stabLp || 2600);
      if (B.corte == null || st < B.corte) {
        const kb = B.baixo.indexOf(st);
        if (kb >= 0) tom({ T, f: mtof(B.raiz + (B.baixoNotas ? B.baixoNotas[kb] : 0)), type: 'sawtooth', a: 0.005, d: B.baixoDur || 0.26, v: B.baixoV, lp: 420 });
        if (B.bumbo.includes(st)) tom({ T, f: 130, to: 44, d: 0.22, v: B.bumboV });
        if (B.chimbal.includes(st)) chiado({ T, f: 8500, type: 'highpass', d: 0.03, v: B.chimbalV });
        else if (B.chimbalFraco && B.chimbalFraco.includes(st)) chiado({ T, f: 8500, type: 'highpass', d: 0.025, v: B.chimbalV * 0.45, pan: 0.2 });
        if (B.aberto && B.aberto.includes(st)) chiado({ T, f: 7000, type: 'highpass', d: 0.16, v: B.chimbalV * 0.7, pan: -0.2 });
        if (B.palma.includes(st)) chiado({ T, f: 1700, q: 0.8, d: 0.1, v: B.palmaV, rev: 0.25 });
      }
      const r = B.rolo && B.rolo[st];
      if (r) chiado({ T, f: 1900, q: 0.8, d: 0.06, v: B.palmaV * r, rev: 0.2 });
      s++; return T + P;
    };
    const id = setInterval(() => {
      const agora = ctx.currentTime;
      if (prox < agora - 0.15) {
        // atrasou (aba em segundo plano, celular travou): pula para o próximo compasso em vez de despejar notas
        let p = s + Math.ceil((agora - prox) / P); p = Math.ceil(p / 16) * 16;
        prox += (p - s) * P; s = p;
      }
      const frente = (typeof document !== 'undefined' && document.hidden) ? 1.2 : 0.3;   // em segundo plano o relógio só acorda 1 vez por segundo
      while (prox < agora + frente) prox = passo(prox);
    }, 40);
    E = { ctx, sai, rg, id, mf, est };
  }
  function pararMusica(fade = 1.5) {
    if (!E) return; const e = E; E = null; clearInterval(e.id);
    e.sai.gain.setTargetAtTime(0, e.ctx.currentTime, Math.max(0.05, fade / 3));
    setTimeout(() => { e.sai.disconnect(); e.rg.disconnect(); }, fade * 1000 + 3500);   // o eco é de todas: só esta saída dele sai
  }
  // intensidade de 0 a 1 (só as trilhas com camadas usam); caiu de repente: o filtro geral fecha e reabre
  function intensidade(v) {
    v = Math.max(0, Math.min(1, +v || 0));
    if (E && E.mf && v < I - 0.15) { const f = E.mf.frequency, T = E.ctx.currentTime;
      f.cancelScheduledValues(T); f.setValueAtTime(18000, T); f.exponentialRampToValueAtTime(240, T + 0.25); f.setValueAtTime(240, T + 0.4); f.exponentialRampToValueAtTime(18000, T + 1.6); }
    I = v;
  }
  function acento(v = 1) { if (E) E.est.acento = v; }
  // onde a música está agora: fase dentro do tempo (0 a 1), dentro do compasso, e o andamento
  function batida() {
    if (!E) return null; const m = E.est.marcas, agora = E.ctx.currentTime;
    for (let i = m.length - 1; i >= 0; i--) if (m[i][0] <= agora) { const [T, s, p] = m[i], d = (agora - T) / p;
      return { fase: (((s % 4) + d) / 4) % 1, compasso: (((s % 16) + d) / 16) % 1, bpm: 15 / p }; }
    return null;
  }
  return { iniciarMusica, pararMusica, intensidade, acento, batida };
}
