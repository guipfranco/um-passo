// ===================== SOM =====================
// Estilo Threes: um som de arrasto e um som de fusão diferente para cada nível.
let AC=null, BUS=null, NB=null;
function ctxAudio(){
  try{
    if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); BUS=AC.createGain(); BUS.gain.value=.9; BUS.connect(AC.destination); }
    // parado ('suspended') ou, no iPhone, 'interrupted' (ligação, outro app tocando): volta. Escondido, fica parado (ver visibilitychange)
    if(AC.state!=='running' && AC.state!=='closed' && !document.hidden) AC.resume().catch(()=>{});
    return AC;
  }catch(e){ return null; }
}
function ac(){ return sound ? ctxAudio() : null; }
// jogo em segundo plano (trocou de app, bloqueou a tela, outra aba): o som para e volta quando o jogo reaparece
document.addEventListener('visibilitychange',()=>{ if(AC && AC.state!=='closed') (document.hidden ? AC.suspend() : AC.resume()).catch(()=>{}); });

// ===================== MÚSICA =====================
// Trilha por tela (todas sintetizadas, vindas do Gabinete). TRIM iguala o volume entre elas.
const TRILHA = {menu:'lofi-prorroga', mapa:'armorial', mina:'lofi-espera', fiscal:'lofi-segredo', mercador:'bossa', fim:'sofrencia-lofi'};
const TRIM = {'armorial':.55, 'bossa':.7, 'lofi-prorroga':.95, 'lofi-espera':.95, 'lofi-segredo':1, 'sofrencia-lofi':1.1, 'orbita':1.6, 'estacao':1.55, 'pulsar':1.45};   // as eletrônicas medidas contra o lo-fi
let music = localStorage.mina_music !== '0', MUS=null, musName=null, musKey=null, musBus=null, musFila=Promise.resolve();
function trilha(k){ musKey=k; musFila=musFila.then(trocaMusica).catch(e=>console.warn(e)); }
// no espaço (2048 Astros) as trilhas são eletrônicas: Estação no menu e na lista de fases, Órbita na Jornada, Pulsar no Clássico
function qualTrilha(k){
  if(typeof espacoLigado==='function' && espacoLigado()){
    if(k==='menu' && (S?.phase==='lista' || document.getElementById('scrMenu')?.classList.contains('on'))) return 'estacao';   // a troca roda depois que a tela já mudou
    if(k==='mina' && S && (S.missao||S.infinito)) return S.infinito ? 'pulsar' : 'orbita';
  }
  return TRILHA[k];
}
async function trocaMusica(){
  const want = music && musKey ? qualTrilha(musKey) : null;
  if(want===musName) return;
  if(MUS){ MUS.pararMusica(1.2); MUS=null; musName=null; }
  if(!want) return;
  const c=ctxAudio(); if(!c) return;
  const m = await import(`./musica/${want}.js`);
  musBus = c.createGain(); musBus.gain.value = TRIM[want]||1; musBus.connect(c.destination);
  m.iniciarMusica(c, musBus); MUS=m; musName=want;
  humor();
}
// a música acompanha o dia: a bateria some com o cansaço, e a fita desafina quando acaba a energia
function humor(){
  if(!MUS || musName!=='lofi-espera' || !S) return;
  const r = S.semEnergia ? Math.max(0, 1 - S.tiles.length/(W*H)) : Math.max(0, S.energy)/Math.max(1, S.energyMax);
  MUS.niveis({f:50, o:45, j:18+47*r, c:35+25*r});
  MUS.tensao(S.semEnergia ? (r<.2 ? .5 : 0) : S.energy<=0 ? .5 : 0);
}
function abaixar(on){
  if(!MUS || !musBus) return;
  musBus.gain.setTargetAtTime((TRIM[musName]||1)*(on?.4:1), AC.currentTime, .3);
  if(musName==='lofi-espera'){ if(on){ MUS.niveis({f:40,o:20,j:14,c:30}); MUS.tensao(0); } else humor(); }
}
function toggleMusic(){ music=!music; localStorage.mina_music=music?'1':'0'; document.querySelectorAll('.musBtn').forEach(b=>b.style.opacity=music?1:.4); trilha(musKey); }

function env(g,T,a,v,d){ g.gain.setValueAtTime(.0001,T); g.gain.exponentialRampToValueAtTime(v,T+a); g.gain.exponentialRampToValueAtTime(.0001,T+a+d); }
function tone({f=440,to=null,type='sine',t=0,a=.005,d=.15,v=.2,lp=null}={}){
  const c=ac(); if(!c) return; const T=c.currentTime+t, o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f,T); if(to) o.frequency.exponentialRampToValueAtTime(to,T+a+d);
  env(g,T,a,v,d); let n=o; if(lp){ const fl=c.createBiquadFilter(); fl.frequency.value=lp; o.connect(fl); n=fl; }
  n.connect(g); g.connect(BUS); o.start(T); o.stop(T+a+d+.05);
}
function noise({t=0,a=.002,d=.1,v=.2,type='bandpass',f=1000,to=null,q=1}={}){
  const c=ac(); if(!c) return;
  if(!NB){ NB=c.createBuffer(1,c.sampleRate,c.sampleRate); const d0=NB.getChannelData(0); for(let i=0;i<d0.length;i++) d0[i]=Math.random()*2-1; }
  const T=c.currentTime+t, s=c.createBufferSource(), fl=c.createBiquadFilter(), g=c.createGain();
  s.buffer=NB; fl.type=type; fl.frequency.setValueAtTime(f,T); if(to) fl.frequency.exponentialRampToValueAtTime(to,T+a+d); fl.Q.value=q;
  env(g,T,a,v,d); s.connect(fl); fl.connect(g); g.connect(BUS); s.start(T,Math.random()*.5); s.stop(T+a+d+.05);
}
function bell({f=880,t=0,d=1,v=.1,ratio=3.5,idx=2}={}){
  const c=ac(); if(!c) return; const T=c.currentTime+t, o=c.createOscillator(), m=c.createOscillator(), mg=c.createGain(), g=c.createGain();
  o.frequency.value=f; m.frequency.value=f*ratio; mg.gain.setValueAtTime(f*idx,T); mg.gain.exponentialRampToValueAtTime(1,T+d);
  m.connect(mg); mg.connect(o.frequency); env(g,T,.003,v,d); o.connect(g); g.connect(BUS);
  o.start(T); m.start(T); o.stop(T+d+.1); m.stop(T+d+.1);
}
const ESCALA=[0,2,4,7,9,12,14,16,19];
const SFX = {
  arrastar(){ const f=900+Math.random()*400; noise({f,to:f*2,d:.07,v:.045,q:.9}); },
  fundir(l){
    const f=392*Math.pow(2,ESCALA[Math.min(l,9)-1]/12);
    tone({f,d:.22,v:.17}); tone({f:f*2,d:.1,v:.05,type:'triangle'}); tone({f:f*4,d:.035,v:.04});
    if(l>=3) tone({f:f*.5,d:.25,v:.08});
    if(l>=4) bell({f:f*2,t:.02,d:.7,v:.06,idx:1.6});
    if(l>=5) [1.25,1.5,2].forEach((m,i)=>bell({f:f*2*m,t:.08+i*.06,d:.5,v:.045,idx:1.2}));
    if(l>=6){ tone({f:f*.25,to:f*.5,a:.05,d:.5,v:.1}); [1,1.5,2,3].forEach((m,i)=>bell({f:f*4*m,t:.25+i*.05,d:.6,v:.03,idx:.8})); }
  },
  cansado(){ tone({f:70,to:50,d:.12,v:.28}); tone({f:65,to:45,t:.18,d:.14,v:.22}); },
  torraoCai(){ tone({f:110,to:60,t:.05,d:.12,v:.22}); noise({t:.05,f:400,d:.1,v:.08,type:'lowpass'}); },
  esfarelar(){ for(let i=0;i<6;i++) noise({t:Math.random()*.12,f:500+Math.random()*900,d:.05,v:.08,type:'lowpass'}); tone({f:90,to:50,d:.12,v:.12}); },
  fimDia(){ [1568,1319,1175,1047,880,784].forEach((f,i)=>bell({f,t:i*.14,d:.7,v:.06,ratio:5,idx:.8})); },
  cuspe(){ tone({f:300,to:900,d:.07,v:.14,type:'triangle'}); noise({f:2500,to:5000,d:.06,v:.06,q:2}); tone({f:520,to:180,t:.1,d:.06,v:.07}); },
  comum(o){ const b=o<=1?988:1175; tone({f:b,t:.05,d:.06,v:.06,type:'square',lp:4000}); tone({f:b*1.335,t:.11,d:.18,v:.06,type:'square',lp:4000}); },
  raro(o){ const l=o-2, n=5+l*4; for(let i=0;i<n;i++) bell({f:1047*Math.pow(2,ESCALA[(n-i)%9]/12),t:.05+i*.055,d:.6,v:.05,idx:1.2}); tone({f:131*Math.pow(2,l/3),to:262*Math.pow(2,l/3),t:.05,d:.35,v:.1}); },
  venda(){ for(let i=0;i<10;i++){ const t=i*.06+Math.random()*.03; tone({f:1975+Math.random()*300,t,d:.05,v:.045,type:'square',lp:5000}); noise({t,f:7000,d:.03,v:.025,type:'highpass'}); } },
  comprar(){ tone({f:520,to:180,d:.06,v:.08}); bell({f:1568,t:.05,d:.5,v:.07,idx:1}); },
  pagou(){ [523,659,784,1047].forEach((f,i)=>tone({f,t:i*.09,d:.2,v:.07,type:'square',lp:3500})); [523,659,784].forEach(f=>tone({f,t:.4,d:.9,v:.05,type:'triangle'})); for(let i=0;i<8;i++) bell({f:2093*Math.pow(2,ESCALA[i%6]/12),t:.4+i*.05,d:.4,v:.035,idx:1}); },
  item(m){ if(m){ tone({f:330,to:660,d:.12,v:.1,type:'triangle'}); bell({f:1319,t:.06,d:.4,v:.06,idx:1}); } else { tone({f:880,to:1320,d:.06,v:.07,type:'triangle'}); } },
  naoDeu(){ [392,370,349,330].forEach((f,i)=>tone({f,to:i===3?260:null,t:i*.3,a:.02,d:i===3?.8:.26,v:.08,type:'sawtooth',lp:900})); },
};

// ===================== SONS DO ESPAÇO (2048 Astros) =====================
// Aprovados no rascunho som.html (2026-11-09). Cada corpo tem o seu material: as miúdas tilintam, os planetas soam
// como sinos, os gigantes são graves e longos, as estrelas explodem; dentro de cada família a nota sobe.
// Têm eco (sala grande) e um pouco de repetição (delay); a mina continua com os sons dela.
let SALA=null, ECO=null;
function salas(c){
  if(SALA) return;
  SALA=c.createConvolver(); const n=Math.round(c.sampleRate*3.2), b=c.createBuffer(2,n,c.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2); }
  SALA.buffer=b; const rg=c.createGain(); rg.gain.value=.5; SALA.connect(rg); rg.connect(BUS);
  ECO=c.createDelay(1); ECO.delayTime.value=.45; const fb=c.createGain(), lp=c.createBiquadFilter(); fb.gain.value=.36; lp.type='lowpass'; lp.frequency.value=2400;
  ECO.connect(lp); lp.connect(fb); fb.connect(ECO); const dg=c.createGain(); dg.gain.value=.45; lp.connect(dg); dg.connect(BUS);
}
function saidaE(c,g,o){ let n=g; if(o.pan && c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,o.pan)); g.connect(p); n=p; }
  n.connect(BUS); if(o.rev){ const s=c.createGain(); s.gain.value=o.rev; n.connect(s); s.connect(SALA); } if(o.dly){ const s=c.createGain(); s.gain.value=o.dly; n.connect(s); s.connect(ECO); } }
function tomE(o){ const c=ac(); if(!c) return; salas(c); const T=c.currentTime+(o.t||0), {f=440,to=null,type='sine',a=.005,d=.2,v=.1,lp=null,q=.7}=o, os=c.createOscillator(), g=c.createGain();
  os.type=type; os.frequency.setValueAtTime(f,T); if(to) os.frequency.exponentialRampToValueAtTime(to,T+a+d); if(o.det) os.detune.value=o.det;
  env(g,T,a,v,d); let n=os; if(lp){ const fl=c.createBiquadFilter(); fl.frequency.setValueAtTime(lp,T); if(o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo,T+a+d); fl.Q.value=q; os.connect(fl); n=fl; }
  n.connect(g); saidaE(c,g,o); os.start(T); os.stop(T+a+d+.1); }
function ruidoE(o){ const c=ac(); if(!c) return; salas(c);
  if(!NB){ NB=c.createBuffer(1,c.sampleRate,c.sampleRate); const d0=NB.getChannelData(0); for(let i=0;i<d0.length;i++) d0[i]=Math.random()*2-1; }
  const T=c.currentTime+(o.t||0), {a=.002,d=.1,v=.1,type='bandpass',f=1000,to=null,q=1}=o, s=c.createBufferSource(), fl=c.createBiquadFilter(), g=c.createGain();
  s.buffer=NB; fl.type=type; fl.frequency.setValueAtTime(f,T); if(to) fl.frequency.exponentialRampToValueAtTime(to,T+a+d); fl.Q.value=q;
  env(g,T,a,v,d); s.connect(fl); fl.connect(g); saidaE(c,g,o); s.start(T,Math.random()*.5); s.stop(T+a+d+.1); }
function sinoE(o){ const c=ac(); if(!c) return; salas(c); const T=c.currentTime+(o.t||0), {f=880,d=1,v=.1,ratio=3.5,idx=2}=o, cr=c.createOscillator(), m=c.createOscillator(), mg=c.createGain(), g=c.createGain();
  cr.frequency.value=f; m.frequency.value=f*ratio; mg.gain.setValueAtTime(f*idx,T); mg.gain.exponentialRampToValueAtTime(Math.max(1,f*.01),T+d);
  m.connect(mg); mg.connect(cr.frequency); env(g,T,.003,v,d); cr.connect(g); saidaE(c,g,o); cr.start(T); m.start(T); cr.stop(T+d+.1); m.stop(T+d+.1); }
const PENTA=[0,2,4,7,9];
const notaE=(oit,grau)=>{ const k=((grau%5)+5)%5, o=Math.floor(grau/5); return 293.66*Math.pow(2,oit+o+PENTA[k]/12); };   // pentatônica de Ré
const ladoE=()=>(Math.random()-.5)*.6;
const SONS_ESP={
  arrastar(){ const p=ladoE(); ruidoE({f:450,to:1700,a:.03,d:.16,v:.035,q:1.1,pan:p,rev:.12}); tomE({f:105,to:62,a:.008,d:.13,v:.025,pan:p}); },
  nasce(){ sinoE({t:.06,f:notaE(2,(Math.random()*5)|0),d:.35,v:.02,ratio:2,idx:.5,pan:(Math.random()-.5)*.9,rev:.45}); },
  fundir(l){ const p=ladoE();
    if(l<=5){   // miúdas: tilintam agudo, cada uma no seu material
      const f=notaE(1,l+2);
      if(l===1) for(let i=0;i<3;i++) sinoE({t:i*.035,f:f*(1+i*.5),d:.2,v:.06,ratio:3,idx:.6,pan:p,rev:.2});            // Poeira: brilho
      if(l===2) sinoE({f:f*2,d:.6,v:.1,ratio:2.76,idx:1.2,pan:p,rev:.35});                                             // Gelo: vidro
      if(l===3){ ruidoE({f:1500,d:.04,v:.18,q:6,pan:p}); tomE({f:f*.5,to:f*.38,d:.09,v:.16,type:'triangle',pan:p}); } // Rocha: claque
      if(l===4) sinoE({f,d:.5,v:.11,ratio:1.414,idx:2.2,pan:p,rev:.25});                                               // Asteroide: metal
      if(l===5){ ruidoE({f:1500,to:6500,d:.28,v:.07,q:1,pan:p,rev:.3}); for(let i=0;i<5;i++) sinoE({t:.05+i*.04,f:f*2*Math.pow(2,PENTA[i]/12),d:.35,v:.045,ratio:2,idx:.5,pan:p+i*.1,rev:.45}); } // Cometa
      tomE({f,d:.16,v:.1,pan:p});
    } else if(l<=11){   // planetas: sinos redondos com um grave por baixo
      const g=l-6, f=notaE(0,g+1);
      sinoE({f,d:1.1+g*.12,v:.11,ratio:2,idx:1.1,pan:p,rev:.45,dly:.12}); tomE({f:f/2,a:.01,d:.9+g*.1,v:.09,pan:p,rev:.2});
      if(l>=9) sinoE({t:.06,f:f*1.5,d:1,v:.04,ratio:2,idx:.7,pan:-p,rev:.5});
      if(l===11) [0,2,4].forEach((k,i)=>sinoE({t:.12+i*.07,f:notaE(1,k),d:1.3,v:.035,ratio:2,idx:.6,rev:.6}));
    } else if(l<=15){   // gigantes: graves, largos e longos (Saturno: o anel brilha em volta)
      const g=l-12, f=notaE(-1,g+1);
      tomE({f,a:.02,d:2.2,v:.13,type:'triangle',lp:900,rev:.5}); tomE({f,a:.02,d:2.2,v:.07,type:'sawtooth',lp:700,lpTo:180,rev:.4,det:7});
      sinoE({t:.05,f:f*4,d:1.8,v:.04,ratio:2,idx:.6,rev:.7,dly:.25});
      if(l===14) for(let i=0;i<9;i++) sinoE({t:.1+i*.05,f:notaE(2,i),d:.6,v:.024,ratio:2,idx:.5,pan:-.7+i*.17,rev:.5});
    } else if(l===16){   // Sol: um acorde quente que cresce
      [0,4,7,11,14].forEach((s,i)=>tomE({f:146.83*Math.pow(2,s/12),a:.35,d:2.6,v:.05,type:'triangle',lp:2200,rev:.6,pan:-.4+i*.2}));
      sinoE({t:.3,f:1174.7,d:2,v:.05,ratio:2,idx:.8,rev:.7,dly:.3});
    } else if(l===17){   // Supernova: estrondo e um rastro de faíscas
      tomE({f:90,to:28,d:1.4,v:.26}); ruidoE({f:1400,to:120,d:1.2,v:.2,type:'lowpass',rev:.4});
      for(let i=0;i<14;i++) sinoE({t:.15+i*.06+Math.random()*.04,f:notaE(2,(Math.random()*10)|0),d:.9,v:.03,ratio:2,idx:.7,pan:Math.random()*1.6-.8,rev:.6});
    } else {   // Galáxia: um coro enorme que gira
      [0,7,12,16,19,24].forEach((s,i)=>tomE({f:73.42*Math.pow(2,s/12),a:.8,d:4,v:.045,type:'sawtooth',lp:1400,rev:.7,pan:Math.sin(i)*.7,det:i%2?6:-6}));
      for(let i=0;i<16;i++) sinoE({t:.5+i*.09,f:notaE(1,i),d:1,v:.022,ratio:2,idx:.5,pan:Math.sin(i*.9)*.8,rev:.6});
    } },
  poucos(){ [0,.34].forEach((t,i)=>tomE({t,f:1318.5,d:.55,v:i?.025:.055,rev:.35})); },   // bipe de sonar
  racha(){ ruidoE({f:3200,d:.05,v:.1,type:'highpass'}); sinoE({f:520,ratio:3.73,idx:3,d:.32,v:.06}); tomE({f:150,to:60,d:.1,v:.09}); ruidoE({t:.03,f:800,d:.14,v:.05,q:3}); },
  nebulosa(){ ruidoE({f:2600,to:300,a:.05,d:.75,v:.06,q:.8,rev:.5}); sinoE({t:.1,f:notaE(2,4),d:.6,v:.02,ratio:2,idx:.4,rev:.6}); },
  estrelas(n){ for(let i=0;i<n;i++) sinoE({t:.25+i*.28,f:notaE(2,i*2),d:.9,v:.05,ratio:2,idx:.8,rev:.5,pan:-.3+i*.3}); },
  vitoria(){ for(let i=0;i<8;i++) sinoE({t:i*.075,f:notaE(1,i),d:.7,v:.045,ratio:2,idx:.7,rev:.45,pan:-.5+i*.14});
    [0,4,7,11,14].forEach((s,i)=>tomE({t:.6,f:293.66*Math.pow(2,s/12),a:.08,d:1.8,v:.04,type:'triangle',lp:3000,rev:.6,pan:-.4+i*.2}));
    ruidoE({t:.6,f:5000,to:9000,a:.2,d:1.2,v:.02,type:'highpass',rev:.6}); },
  derrota(){ tomE({f:392,to:98,a:.05,d:1.4,v:.08,type:'triangle',lp:1800,lpTo:200,rev:.4}); tomE({t:.15,f:294,to:73,a:.05,d:1.4,v:.06,type:'triangle',lp:1500,lpTo:150,rev:.4});
    ruidoE({f:700,to:90,d:1.2,v:.03,type:'lowpass'}); },
  botao(){ tomE({f:1100,to:1500,d:.045,v:.04}); },
};
// no espaço (fases da Jornada e Clássico) os sons de sempre viram os do espaço; a mina segue com os dela
const somEsp = () => typeof espacoLigado==='function' && espacoLigado() && typeof S!=='undefined' && !!S && !!(S.missao||S.infinito);
for(const [k,e] of [['arrastar','arrastar'],['fundir','fundir'],['pagou','vitoria'],['naoDeu','derrota']]){ const velho=SFX[k]; SFX[k]=(...a)=>somEsp()?SONS_ESP[e](...a):velho(...a); }
for(const k of ['nasce','poucos','racha','nebulosa','estrelas']) SFX[k]=(...a)=>{ if(somEsp()) SONS_ESP[k](...a); };
SFX.botao=()=>{ if(typeof espTela==='function' && espTela()) SONS_ESP.botao(); };

