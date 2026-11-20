// ===================== MELODIA (em teste) =====================
// Cada jogada toca a próxima nota de uma música em domínio público, como num Guitar Hero ao contrário: quem joga
// vai "tocando" a melodia arrasto por arrasto. A harmonia entra por baixo, macia, quando o acorde muda.
// Liga com ?melodia=<id> no endereço (só ?melodia = Júpiter); ?melodia=0 desliga. A escolha fica gravada no aparelho.
// ?melgat=junta faz a nota tocar na junção em vez do arrasto (também fica gravado; ?melgat=arrasto volta).
// Com a melodia ligada, a trilha de fundo das fases fica muda (ela brigaria de tom e de andamento com a melodia).
// As músicas ficam em src/melodias.js (MELODIAS); o rascunho para ouvir e escolher é melodia.html.
(()=>{ const m=location.search.match(/[?&]melodia(?:=([\w-]*))?/); if(m) localStorage.ptui_melodia = m[1]==='0' ? '' : (m[1]||'jupiter');
       const g=location.search.match(/[?&]melgat=(\w+)/); if(g) localStorage.ptui_melgat = g[1]==='junta' ? 'junta' : 'arrasto'; })();
const MEL = { s:null, i:0, voz:null, acorde:-1, toques:{} };
const melId = () => { try{ return localStorage.ptui_melodia||''; }catch(e){ return ''; } };
const melGat = () => { try{ return localStorage.ptui_melgat==='junta' ? 'junta' : 'arrasto'; }catch(e){ return 'arrasto'; } };
const melAtual = () => (typeof MELODIAS!=='undefined' && MELODIAS[melId()]) || null;
const melLigada = () => !!melAtual() && somEsp() && !(S?.frenesi && typeof FRE_X!=='undefined' && FRE_X.ritmo);   // no Frenesi de ritmo quem toca é a trilha
const midiF = m => 440*Math.pow(2,(m-69)/12);
// a música vira uma lista de toques: cada nota com a sua batida de início, a duração (a pausa seguinte soma na nota de
// antes, que fica soando) e o acorde que soa ali
function melToques(id){
  if(MEL.toques[id]) return MEL.toques[id];
  const mu=MELODIAS[id], ac=[]; let b=0;
  for(const [r,d,q] of mu.acordes){ ac.push({b, r, d, q}); b+=d; }
  const t=[]; b=0;
  for(const [m,d] of mu.notas){
    if(m==null){ if(t.length) t[t.length-1].d+=d; }
    else { let k=0; while(k+1<ac.length && ac[k+1].b<=b+1e-6) k++; t.push({m, d, b, k}); }
    b+=d;
  }
  return MEL.toques[id]={t, ac};
}
// a voz da melodia: um sino quente (FM, razão 2) no ataque e um corpo de triângulo que segura a nota até a próxima jogada
function melVoz(m, seg){
  const c=ac(); if(!c) return null; salas(c);
  const f=midiF(m), T=c.currentTime, dur=Math.max(.35, Math.min(2.4, seg)), v=.075;
  sinoE({f, d:Math.min(1.6, dur+.5), v:.06, ratio:2, idx:1.1, rev:.35, dly:.1});
  const o=c.createOscillator(), o2=c.createOscillator(), g2=c.createGain(), lp=c.createBiquadFilter(), g=c.createGain();
  o.type='triangle'; o.frequency.value=f; o2.type='sine'; o2.frequency.value=f*2; g2.gain.value=.25;
  lp.type='lowpass'; lp.frequency.value=2600; lp.Q.value=.5;
  g.gain.setValueAtTime(.0001,T); g.gain.exponentialRampToValueAtTime(v,T+.012); g.gain.exponentialRampToValueAtTime(v*.5,T+.3);
  g.gain.setTargetAtTime(.0001, T+dur, .25);   // sozinha, some depois do tempo da nota
  o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); saidaE(c,g,{rev:.3, dly:.08});
  o.start(T); o2.start(T); const fim=T+dur+2; o.stop(fim); o2.stop(fim);
  return { solta(){ try{ const t=c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(.0001, t, .07); o.stop(t+.6); o2.stop(t+.6); }catch(e){} } };
}
// o acorde por baixo: fundamental e quinta graves, macias, pelo tempo do acorde
function melBaixo(a, bpm){
  const seg=Math.max(.8, Math.min(5, a.d*60/bpm)), f=midiF(a.r<40 ? a.r+12 : a.r>52 ? a.r-12 : a.r);
  tomE({f, a:.06, d:seg, v:.055, type:'triangle', lp:700, rev:.3});
  tomE({f:f*1.5, a:.08, d:seg*.9, v:.022, type:'triangle', lp:900, rev:.35});
  tomE({f:f*(a.q==='m'?2.378:2.52), a:.1, d:seg*.8, v:.012, type:'sine', rev:.4});   // a terça bem baixinha, uma oitava acima
}
// toca a próxima nota (volta ao começo da música no fim e a cada partida nova)
function melToca(){
  const mu=melAtual(); if(!mu) return;
  const {t, ac:acs}=melToques(melId());
  if(MEL.s!==S || (S.moves|0)<=1){ MEL.s=S; MEL.i=0; MEL.acorde=-1; }
  if(MEL.i>=t.length){ MEL.i=0; MEL.acorde=-1; }
  const n=t[MEL.i++];
  MEL.voz?.solta(); MEL.voz=melVoz(n.m, n.d*60/mu.bpm);
  if(n.k!==MEL.acorde){ MEL.acorde=n.k; melBaixo(acs[n.k], mu.bpm); }
  melMostra(MEL.i, t.length, mu);
}
// na junção (com a nota no arrasto): um brilho com uma nota do acorde que está soando, uma ou duas oitavas acima
function melBrilho(l, seg){
  const mu=melAtual(); if(!mu) return; const {ac:acs}=melToques(melId()), a=acs[Math.max(0,MEL.acorde)]; if(!a) return;
  const iv=[0, a.q==='m'?3:4, 7], v=(seg?.4:1)*(l>=12?.05:l>=6?.04:.03), r=a.r%12+72;
  const k=l>=9?3:l>=4?2:1;
  for(let i=0;i<k;i++) sinoE({t:.04+i*.06, f:midiF(r+iv[(i+l)%3]), d:.7+l*.04, v, ratio:2, idx:.6, pan:ladoE(), rev:.45});
}
// um rótulo discreto com o nome da música e o ponto em que ela está
function melMostra(i, n, mu){
  let el=document.getElementById('melTag');
  if(!el){ el=document.createElement('div'); el.id='melTag';
    el.style.cssText='position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:50;pointer-events:none;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.02em;color:rgba(230,225,255,.75);background:rgba(20,16,40,.55);padding:5px 11px;border-radius:99px;transition:opacity .4s';
    document.body.appendChild(el); }
  el.textContent=`♪ ${mu.titulo} · ${i}/${n}`; el.style.opacity='1';
  clearTimeout(melMostra.t); melMostra.t=setTimeout(()=>{ el.style.opacity='0'; }, 2500);
}
// liga no lugar dos sons do arrasto e da junção; a trilha das fases fica muda
{ const arr=SFX.arrastar, fun=SFX.fundir;
  SFX.arrastar=(...a)=>{ if(!melLigada() || !S || !(S.moves>0)) return arr(...a); if(melGat()==='arrasto') melToca(); else arr(...a); };
  SFX.fundir=(l,seg,...a)=>{ if(!melLigada()) return fun(l,seg,...a); if(melGat()==='junta'){ if(!seg) melToca(); else melBrilho(l,seg); } else melBrilho(l,seg); };
  const q=qualTrilha; qualTrilha=k=>(k==='mina' && melAtual() && !(S?.frenesi && FRE_X.ritmo) && typeof espacoLigado==='function' && espacoLigado() && S && (S.missao||S.infinito)) ? null : q(k);
}
