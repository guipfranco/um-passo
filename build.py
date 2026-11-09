# Monta o index.html a partir dos arquivos em src/.
# Uso: python build.py
import os
T = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src') + os.sep
rd = lambda f: open(T + f, encoding='utf-8').read()
missoes = rd('quebracabecas.js') + rd('missoes.js') + rd('missoes_calib.js')
classico = rd('classico.js')
# motor do espaço (o mesmo dos rascunhos) fechado num objeto, para os nomes dele não colidirem com os do jogo
espaco = ('var ESP=(()=>{' + rd('espaco.js') + '\nreturn {buildTextures,preaquece,makePiece,drawPeca,drawPecaVar,pecaImg,glPronto,glDesenha,buildFundo,drawFundo,SPR,LADDER,MUNDOS_ESP,byName,kDe,ST,objImg,DPR};\n})();\n'
          + rd('espaco_jogo.js'))
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
#app{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 8px;min-height:100vh}
#shell{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
#items:empty{display:none}
#shell.hidden{display:none}
.screen{display:none;flex-direction:column;align-items:center;gap:12px;width:100%;animation:fadein .25s}
.screen.on{display:flex}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.screen{animation:none}}
#scrMenu{min-height:92vh;justify-content:center;gap:14px}
/* Clássico no espaço (?espaco): céu, órbitas no lugar das casas e canvas das peças */
#ceu{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:none}
body.espaco #ceu{display:block}
html.espaco{background:#0b0a18}
body.espaco{background:transparent !important}
body.espaco #cenario{display:none}
body.espaco .slot svg{display:none}
body.espaco .slot::before{content:'';position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle,rgba(12,9,28,.62),rgba(12,9,28,.38) 72%);border:1.5px solid rgba(255,255,255,.14)}
body.espaco .slot.void::before{display:none}
body.espaco .tile .face{width:100% !important;height:100% !important;margin:0 !important;position:relative}
#glPlan{display:none;position:absolute;left:calc(-1*var(--cell));top:calc(-1*var(--cell));width:calc(100% + 2*var(--cell));height:calc(100% + 2*var(--cell));pointer-events:none;z-index:5}
body.espaco #glPlan{display:block}
canvas.esp{position:absolute;left:50%;top:50%;width:calc(var(--cell)*var(--kx));height:calc(var(--cell)*var(--ky));transform:translate(-50%,-50%);pointer-events:none}
body.espaco .edge{background:none;border:0;box-shadow:none}
body.espaco .etq{background:rgba(12,9,26,.84) !important;border:1px solid rgba(255,255,255,.2);color:#ece3f7;font-family:'Exo 2',sans-serif}
body.espaco .etq b{color:#f2b33d}
/* ---- Clássico no espaço: telas no estilo neon ---- */
body.espaco{color:#f3e9d7;font-family:'Exo 2',sans-serif}
body.espaco h2,body.espaco .banner #bTitle,body.espaco .pill b{font-family:Orbitron,'Exo 2',sans-serif;letter-spacing:.02em}
body.espaco .btn{font-family:'Exo 2',sans-serif !important;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:rgba(10,8,25,.55) !important;color:#ff8a7a !important;border:2px solid #ff8a7a !important;box-shadow:0 0 16px #ff8a7a55,inset 0 0 14px #ff8a7a2a !important;text-shadow:0 0 10px #ff8a7a;border-radius:14px !important}
body.espaco .btn.g{color:#ffd36e !important;border-color:#ffd36e !important;box-shadow:0 0 16px #ffd36e66,inset 0 0 14px #ffd36e33 !important;text-shadow:0 0 10px #ffd36e}
body.espaco .btn.b,body.espaco .btn.lab,body.espaco .btn.lab2{color:#6fe0ff !important;border-color:#6fe0ff !important;box-shadow:0 0 16px #6fe0ff55,inset 0 0 14px #6fe0ff2a !important;text-shadow:0 0 10px #6fe0ff}
body.espaco .btn.dim{color:#cfc6ff !important;border-color:#cfc6ff !important;box-shadow:0 0 12px #cfc6ff44,inset 0 0 10px #cfc6ff22 !important;text-shadow:0 0 8px #cfc6ff}
body.espaco .btn:active{transform:translateY(2px)}
body.espaco .btn small{display:block;text-transform:none;letter-spacing:0;font-weight:500;color:#d8e6f2 !important;text-shadow:none}
body.espaco #overlay{background:rgba(8,6,16,.6)}
body.espaco .panel{background:rgba(26,20,46,.96);border:1.5px solid rgba(255,255,255,.14);box-shadow:0 6px 0 rgba(0,0,0,.45);color:#f3e9d7}
body.espaco .panel h2{color:#f3eefc;font-size:26px}
body.espaco .panel p,body.espaco .ajuda,body.espaco .andarNome,body.espaco .metas,body.espaco .recAtual{color:#cfc4e6 !important;background:none !important}
body.espaco .andarNome{color:#ece3f7 !important;font-weight:600}
body.espaco .objetivo{background:rgba(255,255,255,.06);box-shadow:none;border:1px solid rgba(255,255,255,.1);color:#f3eefc}
body.espaco .objetivo small{color:#f2b33d}
body.espaco .objetivo .pecaN small,body.espaco .objetivo .alvo .pecaN small{color:#cfc4e6}
body.espaco .objetivo .pecaN small.nomeT{color:#f3eefc}
body.espaco .figM .alvo b{color:#f3eefc}
body.espaco .figM .receita{background:rgba(255,255,255,.04)}
body.espaco .figM .receita i{color:#cfc4e6}
body.espaco .estr i{color:rgba(255,255,255,.25)}
body.espaco .estr i.on{color:#ffd36e;text-shadow:0 0 10px #ffd36e}
body.espaco .pill,body.espaco .banner{background:rgba(22,17,40,.8) !important;border:1.5px solid rgba(255,255,255,.12);box-shadow:0 4px 0 rgba(0,0,0,.35) !important;color:#f3e9d7 !important}
body.espaco .pill small,body.espaco .banner span,body.espaco .silhP small{color:#b9a9d9 !important}
body.espaco .banner{font-size:16px}
body.espaco .banner #bTitle{font-family:'Exo 2',sans-serif !important;font-weight:700;font-size:17px;letter-spacing:.01em}
body.espaco .banner span{font-size:13px}
body.espaco .icon{background:rgba(10,8,25,.55) !important;color:#cfc6ff !important;border:2px solid #cfc6ff99 !important;box-shadow:0 0 10px #cfc6ff44 !important}
body.espaco .hudCla .ic.en{font-size:0;background:transparent !important;border:2px solid #ffd36e;box-shadow:0 0 10px #ffd36e66}
body.espaco .hudCla .ic.en::after{content:'➜';font-size:16px;color:#ffd36e;text-shadow:0 0 6px #ffd36e}
body.espaco .hudCla .tr{background:rgba(255,255,255,.12) !important;box-shadow:none !important}
body.espaco .hudCla .tr span{color:#fff3c4}
body.espaco .hudCla .tr span.off{color:rgba(255,255,255,.3)}
body.espaco .chipM b{color:#ece3f7}
body.espaco .nomeP b{color:color-mix(in srgb,var(--c) 45%,#ffffff) !important}
body.espaco .nomeP{background:color-mix(in srgb,var(--f) 22%,rgba(255,255,255,.06))}
body.espaco #coach{background:rgba(26,20,46,.96);border:1.5px solid rgba(255,255,255,.16);color:#f3e9d7}
body.espaco #coach p,body.espaco #coach b{color:#f3e9d7}
body.espaco #coach .cav{display:none}
canvas.espFix{display:block;margin:0 auto}
/* lista de fases: constelação */
body.espaco .mapBody{background:transparent !important;box-shadow:none !important}
body.espaco .mapBody::before{display:none}
body.espaco .mCaminho polyline{stroke:rgba(255,255,255,.35) !important;stroke-dasharray:2 8;stroke-linecap:round;stroke-width:2.5px !important}
body.espaco .mGrupo{background:rgba(22,17,40,.78);border:1.5px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.35);color:#f3e9d7}
body.espaco .mGrupo b{color:#f3eefc}
body.modoInf .hudCla .tr{display:none}
/* lista de fases: o botão do canto vira "‹ Menu" */
body.naLista #btnPause{width:auto;padding:0 14px;border-radius:999px;font-size:15px;white-space:nowrap}
/* Clássico sem fim: só o menu e a pontuação */
body.modoInf .hudCla .arrP,body.modoInf .hudCla .silhP,body.modoInf .top .banner,body.modoInf #btnSound{display:none !important}
body.modoInf #shell{flex-direction:row;justify-content:space-between;align-items:center}
body.modoInf #shell{width:min(94vw,440px);margin:0 auto}
body.modoInf .top{order:1;flex:none;width:auto !important;max-width:none !important}
body.modoInf .hudCla{order:2;flex:none !important;width:auto !important;max-width:none !important;margin:0 !important}
body.modoInf .hudCla #ptsP{flex:none;min-width:150px;text-align:center;justify-content:center}
body.modoInf .hudCla #ptsP b{font-size:30px}
body.espaco.modoCla #mineRow{display:none !important}
#mInf{display:none}
body.espaco #mInf{display:block}
.espIco{width:42px;height:42px;flex:none;display:block}
body.espaco .mGrupo span{color:#b9a9d9}
body.espaco .mNo{background:rgba(26,20,48,.9) !important;border:2px solid rgba(255,255,255,.22) !important;box-shadow:none !important;color:#f3eefc !important;overflow:visible}
body.espaco .mNo.atual{border-color:#ffd36e !important;box-shadow:0 0 0 4px rgba(242,179,61,.25),0 0 22px rgba(242,179,61,.6) !important}
body.espaco .mNo.trava .mPl{opacity:.3}
body.espaco .mNo.chefe{border-color:#ff8a7a !important;box-shadow:0 0 16px #ff8a7a55 !important}
body.espaco .mNo .mPl{position:absolute;left:12%;top:12%;width:76%;height:76%;object-fit:contain;pointer-events:none}
body.espaco .mNo .mNum{position:absolute;left:-7px;top:-7px;min-width:22px;height:22px;border-radius:999px;background:#f2b33d;color:#3a2a08;font:700 12px/22px 'Exo 2',sans-serif;border:1.5px solid #2e2219;text-align:center;padding:0 4px}
body.espaco .mNo.trava .mNum{background:#3a3352;color:#b9a9d9}
/* menu: só o Clássico e o Como jogar; Mineração e Laboratório viram dois ícones no rodapé */
#logoEsp,#ovos{display:none}
body.espaco #logoEsp{display:block}
body.espaco #logo,body.espaco .title,body.espaco #mNew,body.espaco #mLab,body.espaco .labRow,body.espaco #mContinue,body.espaco #mBest{display:none !important}
body.espaco .tagline{color:#8fe8ff;letter-spacing:.18em;text-transform:uppercase;font-size:13px}
body.espaco .menuFoot{color:#8fe8ff}
body.espaco .linkBtn{color:#8fe8ff}
body.espaco #ovos{display:flex;justify-content:center;gap:30px;margin-top:6px}
/* mapa da Jornada: mundos que ainda não têm fases */
.mGrupo.breve{opacity:.55}
.tile.some{transition:opacity .28s,scale .28s;opacity:0;scale:1.35}
.mBreve{align-self:center;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#9a91c9;border:1.5px dashed rgba(160,140,255,.35);border-radius:999px;padding:5px 14px;margin:2px 0 10px}
/* telas baixas: tudo cabe sem rolar (o nome do menu encolhe pelo ajustaMenu) */
@media (max-height:760px){
  body.espaco #scrMenu{gap:8px}
  body.espaco .menuBtns{gap:9px;margin-top:2px}
  body.espaco .btn.big{padding:9px 18px;font-size:17px}
  body.espaco .panel .btn{padding-top:9px;padding-bottom:9px}
}
@media (max-height:640px){
  body.espaco .btn.big{padding:6px 14px;font-size:15px}
  body.espaco .btn.big small{font-size:11px}
  body.espaco .menuBtns{gap:7px}
  body.espaco #scrMenu .tagline{display:none}
  body.espaco .panel .btn{padding-top:7px;padding-bottom:7px}
  body.espaco .panel h2{margin:2px 0;font-size:24px}
  body.espaco .panel{gap:6px}
  body.espaco .panel p{margin:2px 0}
  body.espaco .panel .objetivo{padding-top:6px;padding-bottom:6px}
}
/* menu do espaço: música e créditos moram em Opções */
body.espaco .menuFoot{display:none}
/* Como jogar do espaço */
.cjCv{display:block;margin:2px auto 6px}
.cjDots{display:flex;justify-content:center;gap:7px;margin:4px 0 2px}
.cjDots i{width:7px;height:7px;border-radius:50%;background:rgba(190,170,255,.3)}
.cjDots i.on{background:#6ee6ff;box-shadow:0 0 8px rgba(110,230,255,.8)}
.cjNav{display:flex;gap:8px}
.cjNav .btn{flex:1}
#ovos button{width:30px;height:30px;padding:4px;border:0;background:none;color:rgba(207,198,255,.42);filter:drop-shadow(0 0 4px rgba(207,198,255,.35));cursor:pointer}
#ovos svg{width:22px;height:22px;display:block}\n
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
.secVal{font-size:13px;font-weight:600;color:#a08a74;margin-left:8px}
.card .regraPic{display:flex;align-items:center;gap:6px;margin-top:8px}
.card .regraPic .ico{width:34px;height:34px;margin:0;flex:none}
.card .regraPic i{font-style:normal;font-weight:700;font-size:18px;color:#7a5a44}
.card .regraPic em{font-style:normal;font-size:12px;color:#a08a74;line-height:1.2}
body.semHud .hud{display:none}
#cenario{position:absolute;left:0;top:0;width:100%;z-index:0;pointer-events:none}
#cenario svg{display:block}
#app{position:relative;z-index:1}
body.jogo{background:var(--cenBg,#3a3136)}
body.jogo #board{background:transparent !important;box-shadow:none}
body.jogo .slot{background:none !important;box-shadow:none;border-radius:0}
.slot svg{position:absolute;left:-6%;top:-6%;width:112%;height:112%;overflow:visible;pointer-events:none}
.slot .base{fill:var(--base,#b39672);opacity:var(--baseOp,.3)}
.slot .brilho{fill:none;stroke:var(--brilho,#efe0c2);stroke-width:3;stroke-linecap:round;opacity:.35}
body.jogo .slot.void{background:none !important;box-shadow:none}
.slot.void .base{fill:var(--vazio,#3f3539);opacity:.9}
.slot.void .brilho{display:none}
body.jogo .banner{background:#f3e6cce6;border-radius:14px;padding:3px 8px;box-shadow:0 3px 0 #0002}
body.jogo #revealRow{background:#f3e6cce6;border-radius:18px;padding:8px;box-shadow:0 3px 0 #0002}
.hudCla{display:none}
body.modoCla .hud:not(.hudCla){display:none}
body:not(.semHud).modoCla .hudCla{display:flex}
.hudCla .arrP{flex:1.5}
.hudCla .arr{flex:1;min-width:0}
.hudCla .arr .linha{display:flex;align-items:baseline;justify-content:space-between}
.hudCla .tr{position:relative;height:8px;background:#e2cfae;border-radius:4px;margin-top:6px}
.hudCla .tr i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;transition:width .3s,background .3s}
.hudCla .tr span{position:absolute;top:-9px;transform:translateX(-50%);font-size:15px;line-height:1;color:#f2b33d;text-shadow:0 1px 0 #c48a1e;transition:color .3s}
.hudCla .tr span.off{color:#d9c7a6;text-shadow:none}
.hudCla .silhP{flex:none;flex-direction:column;justify-content:center;gap:2px;padding:5px 7px}
.silhP .fila{display:flex;gap:3px}
.silhP .fila span{width:28px;height:28px;border-radius:50%;background:#e9d9bb;display:flex;align-items:center;justify-content:center}
.silhP .fila svg{width:26px;height:26px;overflow:visible;filter:grayscale(1) brightness(1.2);opacity:.35;transition:filter .3s,opacity .3s}
.silhP .fila span.ok svg{filter:none;opacity:1;animation:popS .45s}
@keyframes popS{40%{transform:scale(1.4)}}
.silhP small,.silhP b{text-align:center}
.hudCla .ptsP{flex:.8}
#board .tile{z-index:2}
.marcaM{position:absolute;left:0;top:0;width:var(--cell);height:var(--cell);z-index:1;pointer-events:none}
.marcaM svg{width:100%;height:100%;overflow:visible}
.alvoM .anel{stroke:#f2b33d}
.alvoM .fantasma{opacity:.4}
.alvoM.ok .anel{stroke:#6aa84f;stroke-dasharray:none}
.alvoM.ok .fantasma{opacity:0}
.terraM.some{animation:terraSai .45s forwards}
@keyframes terraSai{to{opacity:0;scale:1.3}}
.carroM .fantasma{opacity:.45}
.corrente{position:absolute;inset:0;pointer-events:none;z-index:1}
.corrente svg{width:100%;height:100%;overflow:visible}
.corrente.solta{animation:soltaC .4s forwards}
@keyframes soltaC{to{opacity:0;translate:0 25%}}
.tile.recolhe{transition:transform .2s,opacity .3s,scale .3s;opacity:0;scale:.3}
.chipsM{display:flex;gap:4px}
.chipM{display:flex;flex-direction:column;align-items:center;min-width:32px}
.chipM svg{width:26px;height:26px;overflow:visible}
.chipM b{font-size:12px;line-height:1;color:#7a5a44}
.chipM.ok b{color:#6aa84f}
.metasM{display:flex;flex-direction:column;gap:6px;margin:6px 0 4px;text-align:left}
.metasM div{display:flex;align-items:center;gap:8px;font-size:16px}
.metasM svg.fP{width:36px;height:36px;flex:none;overflow:visible}
.silF{display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0 6px}
.silF svg.fM{width:54px;height:54px;overflow:visible}
.silF i{font-style:normal;font-weight:700;color:#a08a74}
.mNo .pegada{position:absolute;right:-6px;top:-6px;width:22px;height:22px;background:#f6ecd9;border-radius:50%;padding:3px;box-shadow:0 1px 0 #0003}
.mNo .emAndamento{position:absolute;left:-6px;top:-6px;background:#6d93a8;color:#fff;border-radius:999px;font-size:13px;line-height:1;padding:3px 6px}
.mNo.chefe{width:74px;height:74px;font-size:27px;background:#e0804a;box-shadow:0 5px 0 #a8552c;color:#fff}
body.modoCla .tile .face{width:84%;height:84%;margin:0 auto}
.etq{position:absolute;left:50%;bottom:-9%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;background:color-mix(in srgb,var(--c) 72%,#2e2219);color:#fff;border-radius:calc(var(--cell)*.12);padding:1px calc(var(--cell)*.07) 2px;line-height:1;pointer-events:none;white-space:nowrap;box-shadow:0 1px 0 #0003;z-index:2}
.etq{animation:etqIn .3s ease-out}
@keyframes etqIn{from{opacity:0;transform:translateX(-50%) scale(.6)}}
.etq b{font-size:calc(var(--cell)*.17);font-weight:700}
.etq small{font-size:calc(var(--cell)*.11);font-weight:600;opacity:.92;margin-top:1px}
.flut{position:absolute;left:0;top:0;width:var(--cell);height:var(--cell);display:flex;align-items:flex-start;justify-content:center;font:700 calc(var(--cell)*.28) 'Fredoka';color:#fff6d0;-webkit-text-stroke:1px #c48a1e;pointer-events:none;z-index:20;animation:flut .95s ease-out forwards}
@keyframes flut{0%{opacity:0;translate:0 10%}20%{opacity:1}100%{opacity:0;translate:0 -50%}}
#quIc.ok{background:#6aa84f}
#quIc.fig{background:#f6ecd9;box-shadow:inset 0 0 0 2px #e2cfae}
#quIc svg{width:30px;height:30px;overflow:visible}
.figM{display:flex;flex-direction:column;align-items:center;gap:4px;margin:4px 0 6px}
.figM .alvo{display:flex;align-items:center;gap:4px}
.figM .alvo b{font-size:30px;color:#7a5a44;line-height:1}
.figM .alvo span{font-size:15px;color:#a08a74}
.figM .fG{width:76px;height:76px;overflow:visible}
.figM .receita{display:flex;align-items:center;gap:4px;background:#f6ecd9;border-radius:14px;padding:4px 12px 3px}
.pecaN{display:flex;flex-direction:column;align-items:center;min-width:40px}
.objetivo .pecaN small{display:block;font-size:11px;font-weight:600;color:#a08a74;line-height:1.1;white-space:nowrap;text-transform:none;letter-spacing:0}
.objetivo .alvo .pecaN small{font-size:14px;color:#7a5a44}
#bTitle .ico{width:1.1em;height:1.1em}
.nomeP{display:inline !important;font-size:inherit !important;min-height:0 !important;line-height:inherit !important;vertical-align:baseline;white-space:nowrap;background:color-mix(in srgb,var(--f) 30%,transparent);border-radius:.6em;padding:.1em .42em .12em .2em;margin:0 .1em 0 .22em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.nomeP b{display:inline !important;font-size:inherit !important;font-weight:700;color:color-mix(in srgb,var(--c) 58%,#2e2219) !important}
.nomeP .ico{margin-right:.18em;vertical-align:-.22em}
.nomeP img.ico{width:1.2em;height:1.2em;vertical-align:-.28em}
.objetivo .pecaN small.nomeT{font-weight:700;color:color-mix(in srgb,var(--c) 58%,#2e2219)}
.figM .receita svg{width:34px;height:34px;overflow:visible}
.figM .receita i{font-style:normal;font-weight:700;font-size:16px;color:#a08a74}
.mTrilha{position:relative;display:flex;flex-direction:column;gap:2px;padding:6px 10px 14px}
.mCaminho{position:absolute;left:0;top:0;pointer-events:none}
.mCaminho polyline{fill:none;stroke:#7a5a4450;stroke-width:5;stroke-dasharray:1 11;stroke-linecap:round;stroke-linejoin:round}
.mGrupo{position:relative;z-index:1;display:flex;align-items:center;gap:10px;background:#f6ecd9;border-radius:16px;padding:8px 12px;box-shadow:0 3px 0 #dcc6a0;margin:10px 0 6px}
.mGrupo b{display:block;font-size:17px;color:#7a5a44}
.mGrupo span{display:block;font-size:13px;color:#a08a74;line-height:1.2}
.mLinha{display:flex;padding:0 12% 18px}
.mNo{position:relative;z-index:1;width:62px;height:62px;border-radius:50%;border:0;background:#f2b33d;box-shadow:0 5px 0 #c48a1e;font:700 24px 'Fredoka';color:#4a3410;cursor:pointer;padding:0}
.mNo.trava{background:#cdbb9c;box-shadow:0 5px 0 #a8977a;color:#8f7f66;cursor:default}
.mNo.atual{box-shadow:0 5px 0 #c48a1e,0 0 0 5px #fff;animation:pulsa 1.4s ease-in-out infinite}
@keyframes pulsa{50%{transform:scale(1.07)}}
.mNo .estr{position:absolute;left:50%;bottom:-17px;transform:translateX(-50%);font-size:14px;white-space:nowrap}
.estr i{font-style:normal;color:#cdbb9c}
.estr i.on{color:#f2b33d;text-shadow:0 1px 0 #c48a1e}
.estr.grande{display:block;text-align:center;font-size:52px;line-height:1}
.objetivo{background:#fff3cf;border-radius:14px;padding:8px 12px 10px;text-align:center;font-weight:700;font-size:20px;color:#7a5a44;box-shadow:0 3px 0 #e8cf8f}
.objetivo small{display:block;font-size:12px;font-weight:600;color:#c48a1e;text-transform:uppercase;letter-spacing:.5px}
.metas{font-size:13px !important}
.secBody{display:flex;flex-direction:column;gap:6px;padding-bottom:12px}
.secBody .card{background:#f6ecd9}
b.sub{font-size:13px;color:#c48a1e;text-transform:uppercase;letter-spacing:.04em;margin-top:6px}
.formaPrev{display:flex;justify-content:center}
.btn.lab2{background:#6d93a8;box-shadow:0 5px 0 #4a6c7f;font-size:16px;padding:11px 10px}
.acoes{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.edTxt{width:100%;border:2px solid #dcc6a0;border-radius:12px;font:12px monospace;padding:8px;box-sizing:border-box}
#app{min-height:100dvh}
.panel{max-height:100%}
/* dentro da fase o dedo arrasta as peças em qualquer lugar da tela (o navegador não rola nem cancela o gesto) */
body.lock:not(.rola){touch-action:none}
body.rola #scrGame{touch-action:pan-y}
body.rola #stage{touch-action:none}
.panel h3{font-size:15px;color:#a08a74;margin:6px 0 -4px;text-transform:uppercase;letter-spacing:.04em}
.edge{position:absolute;z-index:4;background:#6b625a;border:2.5px solid #2e2219;border-radius:8px;box-shadow:0 3px 0 #0003}
.edge.v{width:12px;height:calc(var(--cell) - 10px);left:calc((var(--ex) + 1)*(var(--cell) + var(--gap)) + var(--gap)/2 - 6px);top:calc(var(--ey)*(var(--cell) + var(--gap)) + var(--gap) + 5px)}
.edge.h{height:12px;width:calc(var(--cell) - 10px);top:calc((var(--ey) + 1)*(var(--cell) + var(--gap)) + var(--gap)/2 - 6px);left:calc(var(--ex)*(var(--cell) + var(--gap)) + var(--gap) + 5px)}
'''

body = '''<div id="cenario"></div>
<div id="app">
  <section id="scrMenu" class="screen on">
    <div class="logo" id="logo"></div>
    <h1 class="title">Ptui!</h1>
    <p class="tagline">junte as pedrinhas e veja o que elas cospem</p>
    <div class="menuBtns">
      <button class="btn g big" id="mCla">Clássico<small>uma missão em cada fase</small></button>
      <button class="btn b big" id="mContinue">Continuar</button>
      <button class="btn big" id="mNew">Mineração<small>desça andar por andar, com loja e itens</small></button>
      <button class="btn big lab" id="mLab">Laboratório<small>teste fases, formatos e itens</small></button>
      <div class="labRow"><button class="btn lab2" id="mEd" style="flex:1">Editor de níveis</button><button class="btn lab2" id="mCat" style="flex:1">Catálogo</button></div>
      <button class="btn dim big" id="mTut">Como jogar</button>
    </div>
    <div class="menuFoot"><span id="mBest"></span><button class="icon musBtn" id="mSound">♪</button><button class="linkBtn" id="mCred">créditos</button></div>
  </section>

  <div id="shell" class="hidden">
    <div class="hud wide">
      <div class="pill"><span class="ic en" id="enIc">⚡</span><div><b id="hEnergy"></b><small id="hEnergyMax"></small></div></div>
      <div class="pill"><span class="ic co">$</span><div><b id="hMoney"></b><small id="hMoneyLbl">dinheiro</small></div></div>
      <div class="pill"><span class="ic qu" id="quIc">!</span><div><b id="hQuota"></b><small id="hQuotaDay"></small></div></div>
    </div>
    <div class="hud wide hudCla">
      <div class="pill arrP"><span class="ic en">⚡</span><div class="arr"><div class="linha"><b id="cArr"></b><small>arrastos</small></div><div class="tr"><i id="cTr"></i><span id="cS3">★</span><span id="cS2">★</span><span id="cS1">★</span></div></div></div>
      <div class="pill silhP" id="cMis"></div>
      <div class="pill ptsP" id="ptsP"><div><b id="cPts">0</b><small>pontos</small></div></div>
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
  document.querySelectorAll('.tile.willmerge').forEach(el=>{ el.classList.remove('willmerge'); el.firstChild.style.transform=''; });
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
  // encosto: quanto mais arrasta, mais as duas se espicham na direção do arrasto
  const h=prev.dir[0]!==0;
  for(const o of [...prev.r.merges,...prev.r.gone]){ const f=els.get(o.id)?.firstChild; if(!f) continue;
    f.style.transformOrigin='50% 75%'; f.style.transform = h ? `scale(${1+.16*p},${1-.1*p})` : `scale(${1-.1*p},${1+.16*p})`; }
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
    // na Jornada e no Clássico tocar na peça não abre mais a ficha dela (só na Mineração e no Laboratório)
    if(el && S && S.phase==='mine' && !S.missao && !S.infinito){ const t=S.tiles.find(x=>x.id===el.dataset.id); if(t) tileInfo(t); }
    return;
  }
  clearPreview(false);
  if(Math.abs(dx)>Math.abs(dy)) move(Math.sign(dx),0); else move(0,Math.sign(dy));
  if(S && S.phase==='mine') for(const t of S.tiles){ const el=els.get(t.id); if(el) el.style.transform=pos(t.x,t.y); }
});
addEventListener('pointercancel',()=>{ if(touch){ touch=null; clearPreview(true); } });
// Encerrar exige dois toques enquanto ainda há energia (evita toque sem querer)
let endArmed=null;
function resetEnd(){ clearTimeout(endArmed); endArmed=null; $('#btnEnd').textContent=S&&(S.missao||S.infinito)?'Recomeçar':S&&S.semEnergia?'Parar aqui':'Encerrar o dia'; $('#btnEnd').classList.remove('g'); }
$('#btnEnd').onclick=()=>{
  if(coachBlock) return;
  if(S && S.infinito){ if(S.phase==='mine') infinitoJoga(); return; }
  if(S && S.missao){ if(S.phase==='mine') missaoJoga(S.missao); return; }
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
$('#mCla').onclick=missoesLista;
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
<meta name="theme-color" content="#0b0a18">
<title>2048 Stars</title>
<meta name="description" content="O 2048 no espaço: 96 fases e um modo sem fim. De graça, sem instalar.">
<!-- prévia do link (WhatsApp e afins); a imagem sai de previa.html, opção D -->
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="https://guipfranco.github.io/um-passo/">
<meta property="og:title" content="2048 Stars">
<meta property="og:description" content="O 2048 no espaço: 96 fases e um modo sem fim. De graça, sem instalar.">
<meta property="og:image" content="https://guipfranco.github.io/um-passo/previa.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="2048 Stars: o nome do jogo em neon ao lado de Saturno">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Exo+2:wght@500;600;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
''' + autoupd + '<style>' + css + css_extra + '''</style>
</head>
<body>
''' + body + '''
<script>
''' + cfg + missoes + gi + svg + logic + classico + espaco + helpers + sfx + ui + '''</script>
</body>
</html>
'''
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html'), 'w', encoding='utf-8').write(html)
print('ok', len(html))
