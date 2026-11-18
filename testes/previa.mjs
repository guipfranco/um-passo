// Gera as imagens da prévia do link (1200x630) com o jogo de verdade: abre o index.html no Edge sem janela, monta um
// tabuleiro do Clássico, põe o logo por cima e fotografa. node testes/previa.mjs [E F D]
//   E: tabuleiro em jogo com o céu da galáxia (mundo 8) e o logo
//   E2, E3: o mesmo, com uma partida mais vazia e o Netuno como a maior peça (E3 também com a Terra)
//   F: tabuleiro em jogo com o céu dos pilares (mundo 4), o logo e a escada de corpos (Poeira → Galáxia)
//   D: a prévia publicada (Saturno gigante, desenhada em previa.html), refeita com a textura de hoje
// Saída: previas/E.jpg, previas/F.jpg, previas/D.jpg (a escolhida é copiada à mão para previa.jpg, a do og:image)
import {spawn} from 'child_process'; import fs from 'fs';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', RAIZ='E:/repos/um-passo';
const quais=process.argv.slice(2).length ? process.argv.slice(2) : ['E','E2','E3','F','D'];
// tabuleiros (t = degrau da escada + 1: 1 Poeira ... 11 Terra, 12 Netuno, 14 Saturno); 0 = casa vazia
const TAB={
  E:[[14,11,9,6],[12,10,7,3],[8,5,2,1],[4,0,1,0]],
  E2:[[12,8,4,1],[9,5,2,0],[3,1,0,0],[1,0,0,1]],
  E3:[[12,11,6,2],[7,3,1,0],[2,1,0,0],[0,0,0,1]],
};
const port=9400+Math.floor(Math.random()*400), perfil=`E:/tmp/edge/prev${port}`;
const p=spawn(EDGE,['--headless','--no-sandbox','--allow-file-access-from-files','--enable-unsafe-swiftshader',`--remote-debugging-port=${port}`,`--user-data-dir=${perfil}`,'--window-size=1200,630','about:blank'],{stdio:'ignore'});
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
let ws; for(let i=0;i<240&&!ws;i++){ try{ const l=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg=l.find(x=>x.type==='page'); if(pg) ws=pg.webSocketDebuggerUrl; }catch{} if(!ws) await dorme(250); }
const sock=new WebSocket(ws); await new Promise(r=>sock.onopen=r);
let id=0; const pend={}; sock.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&pend[m.id]){ pend[m.id](m); delete pend[m.id]; } };
const cmd=(method,params={})=>new Promise(r=>{ const i=++id; pend[i]=r; sock.send(JSON.stringify({id:i,method,params})); });
const avalia=async js=>{ const r=await cmd('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true}); if(r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0,400)); return r.result?.result?.value; };
await cmd('Page.enable'); await cmd('Runtime.enable');
await cmd('Emulation.setDeviceMetricsOverride',{width:1200,height:630,deviceScaleFactor:1,mobile:false});
fs.mkdirSync(RAIZ+'/previas',{recursive:true});
const foto=async(nome)=>{ const r=await cmd('Page.captureScreenshot',{format:'jpeg',quality:88,clip:{x:0,y:0,width:1200,height:630,scale:1}}); fs.writeFileSync(`${RAIZ}/previas/${nome}.jpg`,Buffer.from(r.result.data,'base64')); console.log('previas/'+nome+'.jpg'); };

// ---------- E e F: o jogo ----------
const MONTA=lv=>`(async()=>{
  const espera=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<100 && typeof infinitoJoga!=='function';i++) await espera(100);
  await document.fonts.ready; sound=false; music=false;
  infinitoJoga(); await espera(1500); try{ hideOverlay(); hideCoach(); }catch(e){}
  for(const el of board.querySelectorAll('.tile')) el.remove(); els.clear();   // as peças do começo da partida saem
  // tabuleiro: os maiores no canto, descendo até a poeira (t = degrau da escada + 1)
  const lv=${JSON.stringify(lv)}; let i=0; S.tiles=[];
  lv.forEach((row,y)=>row.forEach((t,x)=>{ if(t) S.tiles.push({id:'pv'+(i++),x,y,t}); })); render(); await espera(800);
  const st=document.createElement('style'); st.textContent=\`
    #scrGame .hud, #btnPause, .pill, #topBar, .topo, #mineRow, #revealRow, #coach, .coach {visibility:hidden !important}
    #scrGame{padding-left:520px !important;box-sizing:border-box} #stage{margin-top:26px}
    #pvLogo{position:fixed;left:70px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99;pointer-events:none;font-family:Orbitron,sans-serif;color:#f4fbff}
    #pvLogo b{font-weight:900;font-size:118px;line-height:1;letter-spacing:.02em;text-shadow:0 0 18px rgba(170,160,255,.9),0 0 46px rgba(120,110,255,.6)}
    #pvLogo i{font-style:normal;font-weight:700;font-size:40px;letter-spacing:.55em;margin:10px 0 0 .55em;text-shadow:0 0 14px rgba(170,160,255,.8)}
    #pvLogo small{margin-top:44px;font:700 25px 'Exo 2',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#9fe9ff;text-shadow:0 0 12px rgba(110,230,255,.6)}\`;
  document.head.appendChild(st);
  const d=document.createElement('div'); d.id='pvLogo'; document.body.appendChild(d);
  return 1; })()`;
const CEU=t=>`(async()=>{ S.missao=1; S.tema=${t}; dispatchEvent(new Event('resize')); await new Promise(r=>setTimeout(r,300)); try{ pedeEncaixe(); }catch(e){} await new Promise(r=>setTimeout(r,2600)); return 1; })()`;
const LOGO_FRASE=`(()=>{ document.getElementById('pvLogo').innerHTML='<b>2048</b><i>ASTROS</i><small>o 2048 no espaço</small>'; return 1; })()`;
const LOGO_ESCADA=`(()=>{ const d=document.getElementById('pvLogo');
  d.innerHTML='<b>2048</b><i>ASTROS</i><canvas id="pvEsc" width="1080" height="160" style="width:540px;height:80px;margin-top:40px"></canvas><small style="margin-top:12px">da poeira à galáxia</small>';
  const c=document.getElementById('pvEsc').getContext('2d'), ns=['Poeira','Rocha','Cometa','Lua','Terra','Saturno','Sol','Galáxia'], sz=[56,64,74,86,100,96,116,124];
  let x=6; ns.forEach((n,i)=>{ const w=n==='Saturno'?sz[i]*1.7:sz[i]; ESP.drawPeca(c,n,2.2,x+w/2,80,w,1,true,1); x+=w;
    if(i<ns.length-1){ c.fillStyle='rgba(159,233,255,.65)'; c.beginPath(); const ax=x+12; c.moveTo(ax-6,72); c.lineTo(ax+6,80); c.lineTo(ax-6,88); c.fill(); x+=24; } });
  return 1; })()`;
// cada imagem numa página nova (o tabuleiro e o estilo começam do zero)
for(const q of quais.filter(q=>q!=='D')){
  await cmd('Page.navigate',{url:'http://localhost:8765/index.html?mudo'}); await dorme(4000);
  await avalia(MONTA(TAB[q]||TAB.E));
  if(q==='F'){ await avalia(LOGO_ESCADA); await avalia(CEU(4)); } else { await avalia(LOGO_FRASE); await avalia(CEU(8)); }
  await foto(q);
}
// ---------- D: a de hoje, refeita ----------
if(quais.includes('D')){
  await cmd('Page.navigate',{url:'http://localhost:8765/previa.html?v='+Date.now()}); await dorme(3500);
  const url=await avalia(`(async()=>{ await document.fonts.ready; await new Promise(r=>setTimeout(r,800)); return document.getElementById('cvD0').toDataURL('image/jpeg',.88); })()`);
  fs.writeFileSync(`${RAIZ}/previas/D.jpg`,Buffer.from(url.split(',')[1],'base64')); console.log('previas/D.jpg');
}
sock.close(); p.kill(); process.exit(0);
