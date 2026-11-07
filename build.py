# Monta o index.html a partir dos arquivos em src/.
# Uso: python build.py
import os
T = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src') + os.sep
rd = lambda f: open(T + f, encoding='utf-8').read()
cfg, svg, logic, helpers, sfx, css, autoupd = rd('config.js'), rd('svg.js'), rd('jogo.js'), rd('helpers.js'), rd('sfx.js'), rd('css.css'), rd('autoupd.html')
gi = rd('gi.js')
css = css.replace('width:calc(4*var(--cell) + 5*var(--gap));height:calc(4*var(--cell) + 5*var(--gap))', 'width:calc(var(--w,4)*var(--cell) + (var(--w,4) + 1)*var(--gap));height:calc(var(--h,4)*var(--cell) + (var(--h,4) + 1)*var(--gap))')
css = css.replace('touch-action:none;user-select:none;-webkit-user-select:none;overscroll-behavior:none;overflow:hidden}', 'user-select:none;-webkit-user-select:none;overscroll-behavior:none;overflow-x:hidden}\nbody.lock{overflow:hidden}\n#scrGame{touch-action:none}')

def sub(s, a, b):
    assert a in s, 'NAO ACHEI: ' + a[:70]
    return s.replace(a, b, 1)

cfg = sub(cfg, "    regua:    [`Fileiras de pedrinhas iguais valem +×${String(.25*L).replace('.',',')} a mais cada.`],",
               "    regua:    [`Fileira de 3 pedrinhas iguais: +×${String(.25*L).replace('.',',')}; de 4: +×${String(.5*L).replace('.',',')}.`],")


css_extra = r'''
#app{display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 8px;min-height:100vh}
#shell{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}
#shell.hidden{display:none}
.screen{display:none;flex-direction:column;align-items:center;gap:12px;width:100%;animation:fadein .25s}
.screen.on{display:flex}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}}
#scrMenu{min-height:92vh;justify-content:center;gap:14px}
.logo{display:flex;align-items:flex-end;justify-content:center;height:130px}
.logo svg{overflow:visible;animation:breathe 3s ease-in-out infinite;transform-origin:50% 90%}
.logo svg:nth-child(2){animation-delay:-1s}.logo svg:nth-child(3){animation-delay:-2s}.logo svg:nth-child(4){animation-delay:-.5s}
.title{font-size:84px;line-height:.9;letter-spacing:-1px;transform:rotate(-4deg);text-align:center;color:#7a5a44;text-shadow:0 4px 0 #d2b98e;font-weight:700}
.tagline{color:#a08a74;font-size:15px;text-align:center}
.menuBtns{display:flex;flex-direction:column;gap:14px;width:min(80vw,300px);margin-top:8px}
.btn.big{font-size:20px;padding:14px 22px}
.btn small{display:block;font-size:12px;font-weight:500;opacity:.85}
.menuFoot{display:flex;align-items:center;gap:10px;color:#a08a74;font-size:14px;margin-top:6px}
.mapBody{display:flex;flex-direction:column;gap:4px;position:relative;padding:12px 0 16px;background:var(--andar,#e6d3b0);border-radius:26px;box-shadow:inset 0 4px 0 #0001,0 6px 0 #d2b98e}
.mapBody::before{content:'';position:absolute;left:50%;top:36px;bottom:36px;border-left:4px dashed #7a5a4440;transform:translateX(-2px)}
.mrow{position:relative;display:flex;align-items:center;padding:6px 8px;min-height:92px}
.dlabel{position:absolute;left:12px;top:6px;font-size:12px;font-weight:700;color:#a08a74}
.nodes{flex:1;display:flex;justify-content:center;gap:12px;z-index:1}
.node{width:80px;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;font-family:'Fredoka';padding:0;color:#5a4636;cursor:pointer}
.node .ne{width:58px;height:58px;border-radius:50%;background:#f6ecd9;box-shadow:0 4px 0 #d2b98e;display:flex;align-items:center;justify-content:center;font-size:28px}
.node small{font-size:11px;font-weight:600;line-height:1.1;text-align:center}
.node.today .ne{background:#fff8e8;box-shadow:0 4px 0 #c48a1e,0 0 0 4px #f2b33d;animation:pulse 1.4s infinite}
@keyframes pulse{50%{box-shadow:0 4px 0 #c48a1e,0 0 0 9px #f2b33d55}}
.node.past .ne{background:#d8c4a0}
.node.fut{cursor:default}
.node.fut .ne{background:#00000012;box-shadow:none;color:#a08a74;font-size:20px;width:44px;height:44px}
.node.fiscal .ne{width:68px;height:68px;font-size:34px;background:#f3d0c4;box-shadow:0 4px 0 #c0603f}
.node.fiscal.today .ne{box-shadow:0 4px 0 #c0603f,0 0 0 4px #c0603f}
.node.fiscal.fut .ne{width:68px;height:68px;opacity:.7}
.mrow.done{opacity:.7}
.andarNome{font-size:22px;font-weight:700;color:#c48a1e;margin-top:-6px}
.bigEm{font-size:50px;text-align:center;line-height:1}
.statsBox{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.statsBox div{background:#efe1c6;border-radius:14px;padding:8px;text-align:center}
.statsBox b{display:block;font-size:20px}.statsBox span{font-size:12px;color:#a08a74}
.panel > .btn{width:100%}
#spot{position:fixed;z-index:58;border-radius:20px;box-shadow:0 0 0 4px #ffd98a,0 0 18px 6px #ffd98a99;pointer-events:none;transition:all .25s;animation:spotPulse 1.2s infinite}
#spot.dim{box-shadow:0 0 0 4px #ffd98a,0 0 0 9999px #3a2c2273}
#spot.hidden{display:none}
@keyframes spotPulse{50%{outline:3px solid #ffd98a88;outline-offset:6px}}
#coach{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:60;width:min(94vw,380px);background:#5a4636;color:#fff;border-radius:18px;padding:10px 12px;display:flex;gap:10px;align-items:center;box-shadow:0 6px 0 #3a2c22;animation:coachIn .25s}
@keyframes coachIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
#coach.hidden{display:none}
#coach[data-arrow=up]::before,#coach[data-arrow=down]::before{content:'';position:absolute;left:var(--ax,50%);margin-left:-11px;border:11px solid transparent}
#coach[data-arrow=up]::before{top:-21px;border-bottom-color:#5a4636}
#coach[data-arrow=down]::before{bottom:-21px;border-top-color:#5a4636}
#coach p{font-size:15px;line-height:1.3;margin:0}
#coach b{color:#ffd98a}
#coach .btn{margin-top:8px;padding:7px 18px;font-size:15px}
#coach .cav{flex:none;width:54px;height:54px}
#coach .cav svg{width:100%;height:100%;overflow:visible}
.ico{display:inline-block;width:1.35em;height:1.35em;vertical-align:-.35em;margin-right:2px;overflow:visible}
.ico.big{width:44px;height:44px;vertical-align:middle;margin:0}
.card.pc{cursor:default}
.card .nv{font-size:11px;font-weight:600;color:#a08a74}
.drops{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:3px}
.drop{white-space:nowrap;color:#5a4636;font-weight:600}
.banner span .ico{width:1.2em;height:1.2em}
.mapBody{position:relative;background:var(--andar,#e6d3b0);border-radius:26px;box-shadow:inset 0 4px 0 #0001,0 6px 0 #d2b98e;overflow:hidden}
.mapBody::before{display:none}
.mapBody svg.lines{position:absolute;inset:0;width:100%;height:100%}
.lines line{stroke-linecap:round;vector-effect:non-scaling-stroke}
.lines .idle{stroke:#7a5a4440;stroke-width:4;stroke-dasharray:1 9}
.lines .open{stroke:#e8a21e;stroke-width:6;stroke-dasharray:10 8;animation:march 1s linear infinite}
.lines .taken{stroke:#7a5a44;stroke-width:6}
@keyframes march{to{stroke-dashoffset:-18}}
.mnode{position:absolute;transform:translate(-50%,-50%);width:94px;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;padding:0;font-family:'Fredoka';color:#5a4636;z-index:1}
.disc,.discSm,.bigDisc{display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--nc);border:3px solid #2e2219;box-shadow:0 4px 0 #0003;flex:none}
.disc{width:54px;height:54px}.discSm{width:40px;height:40px;border-width:2px}.bigDisc{width:86px;height:86px;margin:0 auto}
.gi{width:62%;height:62%;fill:#fff}
.mnode small{font-size:11px;font-weight:700;line-height:1.05;text-align:center;background:#f6ecd9d9;border-radius:6px;padding:1px 5px}
.mnode.fut{opacity:.6}
.mnode.gone,.mnode.blocked{opacity:.28;filter:grayscale(.85)}
.mnode.taken .disc{box-shadow:0 0 0 4px #7a5a44}
.mnode.opt{cursor:pointer}
.mnode.opt .disc{animation:nodePulse 1.3s infinite}
@keyframes nodePulse{0%,100%{box-shadow:0 4px 0 #0003,0 0 0 4px #f2b33d}50%{box-shadow:0 4px 0 #0003,0 0 0 10px #f2b33d55}}
.mnode.fiscal .disc{width:66px;height:66px}
.mnode.entrada .disc{width:44px;height:44px}
.dl{position:absolute;left:6px;font-size:11px;font-weight:700;color:#a08a74;transform:translateY(-50%);z-index:0}
.linkBtn{border:0;background:none;color:#a08a74;font:600 13px 'Fredoka';text-decoration:underline;cursor:pointer}
.panel a{color:#c0603f}
.tile.willmerge::before{content:'';position:absolute;inset:6px;border-radius:50%;box-shadow:0 0 0 3px #ffd98a,0 0 16px 4px #ffd98acc;pointer-events:none;z-index:2}
.labRow{display:flex;gap:8px}
.labRow .card{justify-content:center;text-align:center}
.card.labOp.sel{background:#fff3cf;box-shadow:0 4px 0 #c48a1e,0 0 0 3px #f2b33d}
.labHist{font-size:13px;padding-left:16px;color:#7a5a44;line-height:1.35}
.ajustes{display:flex;flex-direction:column;gap:8px}
.ajuste{display:flex;flex-direction:column;gap:4px}
.ajuste > span{font-size:13px;font-weight:600;color:#7a5a44}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chipOp{border:0;border-radius:999px;padding:5px 12px;font:600 14px 'Fredoka';background:#efe1c6;color:#7a5a44;box-shadow:0 2px 0 #dcc6a0;cursor:pointer}
.chipOp.sel{background:#f2b33d;color:#4a3410;box-shadow:0 2px 0 #c48a1e}
.labTools{display:flex;flex-direction:column;gap:8px;background:#efe1c6;border-radius:18px;padding:10px;box-shadow:0 3px 0 #dcc6a0}
.labTools.hidden{display:none}
.ptRow{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px;align-items:center;scrollbar-width:none}
.ptRow::-webkit-scrollbar{display:none}
.ptRow>*{flex:none}
.pt{border:0;border-radius:999px;padding:6px 12px;font:600 14px 'Fredoka';background:#f6ecd9;color:#7a5a44;cursor:pointer;white-space:nowrap}
.pt.sel,.pb.sel{background:#f2b33d;color:#4a3410}
.pb{flex:none;width:42px;border:0;border-radius:12px;background:#f6ecd9;padding:2px;display:flex;flex-direction:column;align-items:center;cursor:pointer;font:600 11px 'Fredoka';color:#7a5a44}
.pb svg{width:34px;height:34px;overflow:visible}
.ptLbl{font-size:13px;font-weight:600;color:#a08a74}
.ptDica{font-size:12px;color:#a08a74;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.editando .hud{display:none}
.slot.void{background:#3a2c22 !important;box-shadow:inset 0 0 0 3px #2a1f18,inset 0 6px 10px #0006;border-radius:14px}
.formaSvg{display:block;margin:0 auto}
.ptNome{border:0;border-radius:999px;padding:6px 12px;font:600 14px 'Fredoka';background:#fff;color:#5a4636;width:150px}
#mineRow{flex-wrap:wrap;justify-content:center}
.ferrBar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.fb{border:0;border-radius:999px;padding:6px 12px;font:600 14px 'Fredoka';background:#efe1c6;color:#5a4636;box-shadow:0 3px 0 #dcc6a0;cursor:pointer}
.fb small{font-size:11px;color:#a08a74}
.fb.on{background:#f2b33d;color:#4a3410;box-shadow:0 3px 0 #c48a1e}
.fb:disabled{opacity:.4}
.tile.sel::after{content:'';position:absolute;inset:2px;border-radius:18px;border:4px solid #3f7fe0;pointer-events:none}
.recLine{text-align:center;font-size:15px;font-weight:600;color:#a08a74;min-height:18px}
.recLine b{color:#c48a1e}
.recAtual{font-size:13px;color:#7a5a44;text-align:center;background:#efe1c6;border-radius:12px;padding:6px 10px;margin:0}
.recAtual b{color:#c48a1e}
.recs li{margin-bottom:3px}
.btn.lab{background:#4f7f9a;box-shadow:0 5px 0 #34586b}
.labTop{display:flex;flex-direction:column;gap:8px}
.campo{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px dashed #e0cfae}
.campo > div{flex:1;min-width:0}
.campo b{display:block;font-size:15px;color:#5a4636}
.campo small{display:block;font-size:12px;color:#a08a74;line-height:1.25}
.labSel{font:600 14px 'Fredoka';color:#5a4636;background:#fff;border:2px solid #dcc6a0;border-radius:12px;padding:6px 8px;max-width:52%}
.sn{display:flex;gap:4px;flex:none}
.ajuda{font-size:13px;color:#a08a74;margin:0;text-align:left}
details.sec{background:#efe1c6;border-radius:16px;padding:0 12px;box-shadow:0 3px 0 #dcc6a0}
details.sec > summary{cursor:pointer;font-weight:700;font-size:17px;color:#7a5a44;padding:11px 0;list-style:none}
details.sec > summary::-webkit-details-marker{display:none}
details.sec > summary::after{content:'+';float:right;color:#c48a1e;font-size:20px;line-height:1}
details.sec[open] > summary::after{content:'−'}
.secBody{display:flex;flex-direction:column;gap:6px;padding-bottom:12px}
.secBody .card{background:#f6ecd9}
b.sub{font-size:13px;color:#c48a1e;text-transform:uppercase;letter-spacing:.04em;margin-top:6px}
.formaPrev{display:flex;justify-content:center}
.btn.lab2{background:#6d93a8;box-shadow:0 5px 0 #4a6c7f;font-size:16px;padding:11px 10px}
.acoes{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.edTxt{width:100%;border:2px solid #dcc6a0;border-radius:12px;font:12px monospace;padding:8px;box-sizing:border-box}
#app{min-height:100dvh}
.panel{max-height:100%}
body.rola #scrGame{touch-action:pan-y}
body.rola #stage{touch-action:none}
.panel h3{font-size:15px;color:#a08a74;margin:6px 0 -4px;text-transform:uppercase;letter-spacing:.04em}
.edge{position:absolute;z-index:4;background:#6b625a;border:2.5px solid #2e2219;border-radius:8px;box-shadow:0 3px 0 #0003}
.edge.v{width:12px;height:calc(var(--cell) - 10px);left:calc((var(--ex) + 1)*(var(--cell) + var(--gap)) + var(--gap)/2 - 6px);top:calc(var(--ey)*(var(--cell) + var(--gap)) + var(--gap) + 5px)}
.edge.h{height:12px;width:calc(var(--cell) - 10px);top:calc((var(--ey) + 1)*(var(--cell) + var(--gap)) + var(--gap)/2 - 6px);left:calc(var(--ex)*(var(--cell) + var(--gap)) + var(--gap) + 5px)}
'''

body = '''<div id="app">
  <section id="scrMenu" class="screen on">
    <div class="logo" id="logo"></div>
    <h1 class="title">Ptui!</h1>
    <p class="tagline">junte as pedrinhas e veja o que elas cospem</p>
    <div class="menuBtns">
      <button class="btn big lab" id="mLab">Laboratório<small>teste fases, formatos e itens</small></button>
      <div class="labRow"><button class="btn lab2" id="mEd" style="flex:1">Editor de níveis</button><button class="btn lab2" id="mCat" style="flex:1">Catálogo</button></div>
      <button class="btn b big" id="mContinue">Continuar</button>
      <button class="btn big" id="mNew">Novo jogo</button>
      <button class="btn dim big" id="mTut">Como jogar</button>
    </div>
    <div class="menuFoot"><span id="mBest"></span><button class="icon musBtn" id="mSound">♪</button><button class="linkBtn" id="mCred">créditos</button></div>
  </section>

  <div id="shell" class="hidden">
    <div class="hud wide">
      <div class="pill"><span class="ic en" id="enIc">⚡</span><div><b id="hEnergy"></b><small id="hEnergyMax"></small></div></div>
      <div class="pill"><span class="ic co">$</span><div><b id="hMoney"></b><small>dinheiro</small></div></div>
      <div class="pill"><span class="ic qu">!</span><div><b id="hQuota"></b><small id="hQuotaDay"></small></div></div>
    </div>
    <div class="top wide"><button class="icon" id="btnPause">☰</button><div class="banner"><div id="bTitle"></div><span id="bSub"></span></div><button class="icon musBtn" id="btnSound">♪</button></div>
    <div class="items wide" id="items"></div>
  </div>

  <section id="scrMap" class="screen"><div class="mapBody wide" id="mapBody"></div></section>

  <section id="scrGame" class="screen">
    <div class="stage" id="stage"><div id="board"></div></div>
    <div class="row wide" id="mineRow">
      <button class="btn dim" id="btnEdit" style="display:none">Editar</button>
      <button class="btn b" id="btnAssovio" style="display:none">Assovio</button>
      <button class="btn" id="btnEnd" style="margin:0 auto">Encerrar o dia</button>
    </div>
    <div class="ferrBar wide" id="ferrBar"></div>
    <div class="labTools wide hidden" id="labTools"></div>
    <div class="wide" id="revealRow" style="display:none;flex-direction:column;gap:12px">
      <div class="total"><span>Total do dia</span><b id="dayTotal">$0</b></div>
      <div class="calc" id="calc"></div>
      <div class="recLine" id="recLine"></div>
      <div class="row"><button class="btn dim" id="btnFast" style="flex:1">Rápido</button><button class="btn dim" id="btnSkip" style="flex:1">Pular</button><button class="btn g" id="btnSell" style="flex:2;display:none">Vender</button></div>
    </div>
  </section>
</div>
<div id="overlay" class="hidden"><div class="panel" id="panel"></div></div>
<div id="spot" class="hidden"></div>
<div id="coach" class="hidden"><div class="cav" id="coachAv"></div><div><p id="coachText"></p><button class="btn b" id="coachOk">Ok</button></div></div>
'''

ui = r'''// ===================== UI =====================
function showOverlay(html){ $('#panel').innerHTML=enrich(html); $('#overlay').classList.remove('hidden'); $('#panel').scrollTop=0; }
function hideOverlay(){ $('#overlay').classList.add('hidden'); $('#panel').innerHTML=''; }

// ===================== ENTRADA =====================
const KEYS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
addEventListener('keydown',e=>{ const k=KEYS[e.key.length===1?e.key.toLowerCase():e.key]; if(k){ e.preventDefault(); move(...k); } });
// Arrastar com prévia: as pedrinhas seguem o dedo até onde iriam; só confirma ao soltar.
// Dá para ir e voltar, testar outras direções e desistir (soltando perto do começo).
let touch=null, prev=null;
const PV_MIN=10, CONFIRMA=22;
const cellPx = () => board.querySelector('.slot')?.getBoundingClientRect().width || 80;
function clearPreview(voltar){
  document.querySelectorAll('.tile.willmerge').forEach(el=>el.classList.remove('willmerge'));
  if(S && S.tiles) for(const t of S.tiles){ const el=els.get(t.id); if(!el) continue; el.style.transition=''; if(voltar) el.style.transform=pos(t.x,t.y); }
  prev=null;
}
function previewDrag(dx,dy){
  const d=Math.max(Math.abs(dx),Math.abs(dy));
  if(d<PV_MIN){ if(prev) clearPreview(true); return; }
  const dir = Math.abs(dx)>Math.abs(dy) ? [Math.sign(dx),0] : [0,Math.sign(dy)], key=dir.join();
  if(!prev || prev.key!==key){
    if(prev) clearPreview(true);
    const r=slide(S.tiles,dir[0],dir[1]), tgt={};
    for(const t of r.tiles) tgt[t.id]=[t.x,t.y];
    for(const g of r.gone) tgt[g.id]=[g.x,g.y];
    prev={key, dir, r, tgt};
    for(const o of r.merges) els.get(o.id)?.classList.add('willmerge');
    for(const g of r.gone) els.get(g.id)?.classList.add('willmerge');
  }
  let p=Math.min(1,(d-PV_MIN)/(cellPx()*.9));
  for(const t of S.tiles){
    const el=els.get(t.id); if(!el) continue;
    const [tx,ty]=prev.tgt[t.id]||[t.x,t.y];
    // direção que não mexe nada: só uma resistência leve
    const ox = prev.r.moved ? (tx-t.x)*p : prev.dir[0]*p*.06, oy = prev.r.moved ? (ty-t.y)*p : prev.dir[1]*p*.06;
    el.style.transition='none';
    el.style.transform=`${pos(t.x,t.y)} translate(calc(${ox}*(var(--cell) + var(--gap))), calc(${oy}*(var(--cell) + var(--gap))))`;
  }
}
addEventListener('pointerdown',e=>{ if(overlayOpen()||e.target.closest('button')||!$('#scrGame').classList.contains('on')) return;
  if(document.body.classList.contains('rola') && !e.target.closest('#stage')) return; // fora do tabuleiro, o dedo rola a página
  touch={x:e.clientX,y:e.clientY}; prev=null; });
addEventListener('pointercancel',()=>{ if(touch){ touch=null; clearPreview(true); } });
addEventListener('pointermove',e=>{
  if(!touch || !S || S.phase!=='mine' || overlayOpen() || coachBlock || S.editando || S.ferrAtiva) return;
  previewDrag(e.clientX-touch.x, e.clientY-touch.y);
});
addEventListener('pointerup',e=>{
  if(!touch) return; const dx=e.clientX-touch.x, dy=e.clientY-touch.y; touch=null;
  const tinha=!!prev;
  if(S && S.ferrAtiva && S.phase==='mine'){ usarFerramenta(e.clientX,e.clientY); return; }
  if(S && S.editando && S.phase==='mine'){ if(PINCEL.tipo==='mureta'){ labMureta(e.clientX,e.clientY); return; } const c=labCelula(e.clientX,e.clientY); if(c) labPinta(...c); return; }
  if(Math.max(Math.abs(dx),Math.abs(dy))<CONFIRMA){
    clearPreview(true);
    // toque (sem arrastar) numa pedrinha: mostra o que ela é e o que pode cuspir
    const el=!tinha && e.target.closest && e.target.closest('.tile');
    if(el && S && S.phase==='mine'){ const t=S.tiles.find(x=>x.id===el.dataset.id); if(t) tileInfo(t); }
    return;
  }
  clearPreview(false);
  if(Math.abs(dx)>Math.abs(dy)) move(Math.sign(dx),0); else move(0,Math.sign(dy));
  if(S && S.phase==='mine') for(const t of S.tiles){ const el=els.get(t.id); if(el) el.style.transform=pos(t.x,t.y); }
});
addEventListener('pointercancel',()=>{ if(touch){ touch=null; clearPreview(true); } });
// Encerrar exige dois toques enquanto ainda há energia (evita toque sem querer)
let endArmed=null;
function resetEnd(){ clearTimeout(endArmed); endArmed=null; $('#btnEnd').textContent=S&&S.semEnergia?'Parar aqui':'Encerrar o dia'; $('#btnEnd').classList.remove('g'); }
$('#btnEnd').onclick=()=>{
  if(coachBlock) return;
  if(S.energy<=0 || endArmed){ resetEnd(); endDay(); return; }
  $('#btnEnd').textContent=S.semEnergia?'Confirmar?':`Confirmar? (sobra ${S.energy}⚡)`;
  $('#btnEnd').classList.add('g');
  endArmed=setTimeout(resetEnd,3000);
};
$('#btnSkip').onclick=()=>{ S.skip=true; };
$('#btnFast').onclick=()=>{ S.turbo=true; $('#btnFast').style.display='none'; };
$('#btnSell').onclick=sell;
$('#btnEdit').onclick=()=>labEditar(!S.editando);
$('#btnAssovio').onclick=assoviar;
$('#btnPause').onclick=pauseMenu;
document.querySelectorAll('.musBtn').forEach(b=>{ b.onclick=toggleMusic; b.style.opacity=music?1:.4; });
addEventListener('pointerdown',()=>{ if(AC&&AC.state==='suspended') AC.resume(); else if(!AC&&music){ ctxAudio(); trilha(musKey); } },{capture:true});
$('#mContinue').onclick=loadGame;
$('#mCred').onclick=credits;
$('#mLab').onclick=labPainel;
$('#mEd').onclick=editorLista;
$('#mCat').onclick=()=>catalogo(showMenu);
$('#mNew').onclick=newGameClick;
$('#mTut').onclick=()=>{
  if(localStorage.mina_save){
    showOverlay(`<h2>Fazer o tutorial?</h2><p>A partida salva será perdida.</p><button class="btn" id="btnYes">Fazer o tutorial</button><button class="btn dim" id="btnNo">Voltar</button>`);
    $('#btnYes').onclick=()=>{ hideOverlay(); localStorage.removeItem('mina_save'); startTutorial(); };
    $('#btnNo').onclick=hideOverlay;
  } else startTutorial();
};
// arte do menu e do treinador
$('#logo').innerHTML = [[1,58],[3,84],[5,120],[2,70]].map(([t,s])=>`<svg viewBox="0 0 100 100" style="width:${s}px;height:${s}px">${pedraInner(t)}</svg>`).join('');
$('#coachAv').innerHTML = svgOf(pedraInner(3,{face:['happy','big']}));

if(/[?&]lab\b/.test(location.search)) labPainel(); else showMenu();
'''

html = '''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#f6ecd9">
<title>Ptui!</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet">
''' + autoupd + '<style>' + css + css_extra + '''</style>
</head>
<body>
''' + body + '''
<script>
''' + cfg + gi + svg + logic + helpers + sfx + ui + '''</script>
</body>
</html>
'''
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html'), 'w', encoding='utf-8').write(html)
print('ok', len(html))
