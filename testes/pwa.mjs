// Testa o app instalável: servidor local, instalabilidade, service worker e abrir sem internet.
import {spawn} from 'child_process'; import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
// node testes/pwa.mjs  (sobe um servidor local na pasta acima do repositório e abre /<pasta do repo>/)
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), ACIMA=path.dirname(REPO), NOME=path.basename(REPO);
const EDGE=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(f=>fs.existsSync(f));
const TMP=process.env.TMP||ACIMA;
const srv=spawn('python',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:ACIMA,stdio:'ignore'});
const port=9400+Math.floor(Math.random()*400), perfil=path.join(TMP,'pwa'+port);
const p=spawn(EDGE,['--headless','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${perfil}`,'--window-size=390,844','about:blank'],{stdio:'ignore'});
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
let ws; for(let i=0;i<240&&!ws;i++){ try{ const l=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg=l.find(x=>x.type==='page'); if(pg) ws=pg.webSocketDebuggerUrl; }catch{} if(!ws) await dorme(250); }
const sock=new WebSocket(ws); await new Promise(r=>sock.onopen=r);
let id=0; const pend={}; sock.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&pend[m.id]){ pend[m.id](m); delete pend[m.id]; } if(m.method==='Runtime.exceptionThrown') console.log('ERRO',JSON.stringify(m.params.exceptionDetails).slice(0,300)); };
const cmd=(method,params={})=>new Promise(r=>{ const i=++id; pend[i]=r; sock.send(JSON.stringify({id:i,method,params})); });
const ev=async ex=>(await cmd('Runtime.evaluate',{expression:ex,returnByValue:true,awaitPromise:true})).result?.result?.value;
await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable');
const url=`http://localhost:8765/${NOME}/`;
await cmd('Page.navigate',{url}); await dorme(9000);
const man=await cmd('Page.getAppManifest'); console.log('manifesto:', man.result?.errors?.length?JSON.stringify(man.result.errors):'sem erros', '|', (man.result?.url||'').slice(-30));
const inst=await cmd('Page.getInstallabilityErrors'); console.log('instalável:', JSON.stringify(inst.result?.installabilityErrors||inst.result));
console.log('sw:', await ev(`navigator.serviceWorker.getRegistration().then(r=>r?(r.active?'ativo':'instalando')+' '+r.scope:'nenhum')`));
await dorme(2000);
console.log('cache:', await ev(`caches.keys().then(async ks=>{ const out=[]; for(const k of ks){ const c=await caches.open(k); out.push(k+':'+(await c.keys()).length); } return out.join(' '); })`));
// sem internet: recarrega
await cmd('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await cmd('Page.reload',{ignoreCache:false}); await dorme(7000);
console.log('sem internet:', await ev(`JSON.stringify({titulo:document.title, menu:!!document.querySelector('#scrMenu.on'), botoes:[...document.querySelectorAll('#scrMenu .btn')].filter(b=>b.offsetParent).map(b=>b.id).join(' ')})`));
await ev(`(()=>{ sound=false; music=false; missoesLista(QUEBRA); return 1; })()`); await dorme(1500);
console.log('quebra-cabeças sem internet:', await ev(`document.querySelectorAll('.mNo').length+' fases no mapa'`));
sock.close(); p.kill(); srv.kill(); process.exit(0);
