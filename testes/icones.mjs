// Gera os ícones do app com o motor do próprio jogo (Saturno sobre o céu). node icones.mjs
import {spawn} from 'child_process'; import fs from 'fs';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port=9400+Math.floor(Math.random()*400), perfil=`E:/tmp/edge/ico${port}`;
const p=spawn(EDGE,['--headless','--no-sandbox','--allow-file-access-from-files',`--remote-debugging-port=${port}`,`--user-data-dir=${perfil}`,'--window-size=600,600','about:blank'],{stdio:'ignore'});
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
let ws; for(let i=0;i<240&&!ws;i++){ try{ const l=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg=l.find(x=>x.type==='page'); if(pg) ws=pg.webSocketDebuggerUrl; }catch{} if(!ws) await dorme(250); }
const sock=new WebSocket(ws); await new Promise(r=>sock.onopen=r);
let id=0; const pend={}; sock.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&pend[m.id]){ pend[m.id](m); delete pend[m.id]; } };
const cmd=(method,params={})=>new Promise(r=>{ const i=++id; pend[i]=r; sock.send(JSON.stringify({id:i,method,params})); });
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable');
await cmd('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*']});
await cmd('Page.navigate',{url:'file:///E:/repos/um-passo/index.html'}); await dorme(7000);
const js=`(()=>{ sound=false; music=false;
  const faz=(S,k,fundo)=>{ const cv=document.createElement('canvas'); cv.width=cv.height=S; const c=cv.getContext('2d');
    if(fundo){ const g=c.createRadialGradient(S*.5,S*.42,0,S*.5,S*.5,S*.75); g.addColorStop(0,'#2a1d5c'); g.addColorStop(.55,'#130f2e'); g.addColorStop(1,'#0b0a18'); c.fillStyle=g; c.fillRect(0,0,S,S);
      let s=7; const r=()=>(s=(s*16807)%2147483647)/2147483647; for(let i=0;i<70;i++){ c.globalAlpha=.25+.6*r(); c.fillStyle='#fff'; c.beginPath(); c.arc(r()*S,r()*S,(.4+r()*1.2)*S/512,0,7); c.fill(); } c.globalAlpha=1;
      const h=c.createRadialGradient(S*.5,S*.5,0,S*.5,S*.5,S*.42); h.addColorStop(0,'rgba(232,199,122,.28)'); h.addColorStop(1,'rgba(232,199,122,0)'); c.fillStyle=h; c.fillRect(0,0,S,S); }
    ESP.drawPeca(c,'Saturno',2.2,S/2,S/2,S*k,1,true,1); return cv.toDataURL('image/png'); };
  return JSON.stringify({i512:faz(512,.92,true), i192:faz(192,.92,true), mask:faz(512,.74,true), apple:faz(180,.86,true)}); })()`;
const r=await cmd('Runtime.evaluate',{expression:js,returnByValue:true});
const o=JSON.parse(r.result.result.value);
const sai=(k,f)=>fs.writeFileSync('E:/repos/um-passo/icones/'+f,Buffer.from(o[k].split(',')[1],'base64'));
sai('i512','icone-512.png'); sai('i192','icone-192.png'); sai('mask','icone-mascara-512.png'); sai('apple','apple-touch-icon.png');
console.log('ícones ok'); sock.close(); p.kill(); process.exit(0);
