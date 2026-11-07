// ===================== SOM =====================
// Estilo Threes: um som de arrasto e um som de fusão diferente para cada nível.
let AC=null, BUS=null, NB=null;
function ctxAudio(){
  try{
    if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); BUS=AC.createGain(); BUS.gain.value=.9; BUS.connect(AC.destination); }
    if(AC.state==='suspended') AC.resume();
    return AC;
  }catch(e){ return null; }
}
function ac(){ return sound ? ctxAudio() : null; }

// ===================== MÚSICA =====================
// Trilha por tela (todas sintetizadas, vindas do Gabinete). TRIM iguala o volume entre elas.
const TRILHA = {menu:'lofi-prorroga', mapa:'armorial', mina:'lofi-espera', fiscal:'lofi-segredo', mercador:'bossa', fim:'sofrencia-lofi'};
const TRIM = {'armorial':.55, 'bossa':.7, 'lofi-prorroga':.95, 'lofi-espera':.95, 'lofi-segredo':1, 'sofrencia-lofi':1.1};
let music = localStorage.mina_music !== '0', MUS=null, musName=null, musKey=null, musBus=null, musFila=Promise.resolve();
function trilha(k){ musKey=k; musFila=musFila.then(trocaMusica).catch(e=>console.warn(e)); }
async function trocaMusica(){
  const want = music && musKey ? TRILHA[musKey] : null;
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

