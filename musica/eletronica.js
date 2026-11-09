// Músicas eletrônicas do 2048 Stars, tocadas na hora pelo próprio aparelho (nada de arquivo de áudio).
// Mesma família da "Órbita" aprovada no rascunho som.html (2026-11-09): arpejo que gira, baixo, batida leve,
// acordes de fundo e eco. Cada trilha (orbita.js, estacao.js, pulsar.js) só muda o tempo, os acordes e os padrões.
// Interface igual à das outras trilhas: iniciarMusica(ctx, destino) e pararMusica(fade).

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function sala(ctx, seg = 3.4) {
  const n = Math.round(ctx.sampleRate * seg), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  const c = ctx.createConvolver(); c.buffer = b; return c;
}

export function cria(cfg) {
  let E = null;
  function iniciarMusica(ctx, destino) {
    if (E) pararMusica(0.2);
    const sai = ctx.createGain(); sai.gain.value = 0.0001; sai.gain.setTargetAtTime(1, ctx.currentTime, 0.8); sai.connect(destino);
    const rev = sala(ctx), rg = ctx.createGain(); rg.gain.value = 0.5; rev.connect(rg); rg.connect(sai);
    const dly = ctx.createDelay(1); dly.delayTime.value = 60 / cfg.bpm * 0.75;   // eco em colcheia pontuada
    const fb = ctx.createGain(), lp = ctx.createBiquadFilter(), dg = ctx.createGain(); fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 2400; dg.gain.value = 0.45;
    dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(dg); dg.connect(sai);
    const ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); { const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

    const env = (g, T, a, v, d) => { g.gain.setValueAtTime(0.0001, T); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), T + a); g.gain.exponentialRampToValueAtTime(0.0001, T + a + d); };
    const saida = (g, o) => { let n = g; if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); n = p; }
      n.connect(sai); if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; n.connect(s); s.connect(rev); } if (o.dly) { const s = ctx.createGain(); s.gain.value = o.dly; n.connect(s); s.connect(dly); } };
    const tom = o => { const { T, f, to = null, type = 'sine', a = 0.005, d = 0.2, v = 0.1, lp = null, q = 0.7 } = o, os = ctx.createOscillator(), g = ctx.createGain();
      os.type = type; os.frequency.setValueAtTime(f, T); if (to) os.frequency.exponentialRampToValueAtTime(to, T + a + d);
      env(g, T, a, v, d); let n = os; if (lp) { const fl = ctx.createBiquadFilter(); fl.frequency.value = lp; fl.Q.value = q; os.connect(fl); n = fl; }
      n.connect(g); saida(g, o); os.start(T); os.stop(T + a + d + 0.1); };
    const chiado = o => { const { T, f, type = 'bandpass', d = 0.05, v = 0.03, q = 1 } = o, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = ruido; fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(g, T, 0.002, v, d); s.connect(fl); fl.connect(g); saida(g, o); s.start(T, Math.random() * 0.5); s.stop(T + d + 0.1); };
    const pad = (T, ms, dur, v, lpf) => { for (const m of ms) { const g = ctx.createGain(), fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.5;
        fl.frequency.setValueAtTime(lpf * 0.55, T); fl.frequency.linearRampToValueAtTime(lpf, T + dur * 0.5); fl.frequency.linearRampToValueAtTime(lpf * 0.55, T + dur);
        g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(v, T + dur * 0.35); g.gain.setValueAtTime(v, T + dur * 0.6); g.gain.linearRampToValueAtTime(0, T + dur);
        for (const dt of [-8, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(fl); o.start(T); o.stop(T + dur + 0.1); }
        fl.connect(g); g.connect(sai); const s = ctx.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(rev); } };

    const P = 60 / cfg.bpm / 4;   // semicolcheia
    let s = 0, prox = ctx.currentTime + 0.2;
    const passo = T => {
      const nc = cfg.prog.length, bar = Math.floor(s / 16) % nc, st = s % 16, ch = cfg.prog[bar];
      if (st === 0 && cfg.pad) pad(T, ch.map(m => m - 12), 16 * P * 1.1, cfg.pad, 1100);
      if (st % cfg.arpCada === 0) { const k = (st / cfg.arpCada) % cfg.arp.length, idx = cfg.arp[k], m = ch[idx % 4] + 12 * Math.floor(idx / 4);
        tom({ T, f: mtof(m), type: cfg.arpOnda || 'square', a: 0.004, d: cfg.arpDur || 0.13, v: cfg.arpV, lp: 1500 + 800 * Math.sin(s / 40), q: 2, dly: 0.22, rev: 0.12, pan: Math.sin(s * 0.4) * 0.35 }); }
      if (cfg.baixo.includes(st)) tom({ T, f: mtof(cfg.raiz[bar]), type: 'sawtooth', a: 0.005, d: cfg.baixoDur || 0.26, v: cfg.baixoV, lp: 420 });
      if (cfg.bumbo.includes(st)) tom({ T, f: 130, to: 44, d: 0.22, v: cfg.bumboV });
      if (cfg.chimbal.includes(st)) chiado({ T, f: 8500, type: 'highpass', d: 0.03, v: cfg.chimbalV });
      if (cfg.palma.includes(st)) chiado({ T, f: 1700, q: 0.8, d: 0.1, v: cfg.palmaV, rev: 0.25 });
      s++; return T + P;
    };
    const id = setInterval(() => { while (prox < ctx.currentTime + 0.3) prox = passo(prox); }, 40);
    E = { ctx, sai, id };
  }
  function pararMusica(fade = 1.5) {
    if (!E) return; const e = E; E = null; clearInterval(e.id);
    e.sai.gain.setTargetAtTime(0, e.ctx.currentTime, Math.max(0.05, fade / 3));
    setTimeout(() => e.sai.disconnect(), fade * 1000 + 3500);
  }
  return { iniciarMusica, pararMusica };
}
