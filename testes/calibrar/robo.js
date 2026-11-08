// Robôs para medir e calibrar (rodam dentro do jogo: w.eval(ROBO)).
// ROBO.escolhe: joga como quem sabe 2048 (sobe alto). ROBO.escolheMeta: corre direto para as metas do Clássico.
// Táticas conhecidas do 2048 (as mesmas que quem joga bem usa):
//  - a maior no canto, e a fileira em ordem saindo dela ("cobra"): fileiras e colunas monotônicas;
//  - casas vazias valem muito (tabuleiro cheio não se recupera);
//  - juntas possíveis lado a lado valem;
//  - pedrinha alta solta pelo tabuleiro custa.
// Busca: expectimax (como a IA do nneonneo): olha o próximo arrasto, todas as casas onde pode nascer a
// pedrinha nova (Cascalho 90%, Pedra 10%) e o arrasto seguinte. Pesos da heurística do nneonneo/2048-ai.
// Além disso, corre atrás das metas do Clássico (casa marcada, terra, presa, carrinho...).
const ROBO = `
window.ROBO = (()=>{
  const PERDA=200000, MONO_P=4, MONO_W=47, SOMA_P=3.5, SOMA_W=11, JUNTA_W=700, VAZIO_W=270;
  // avalia uma linha (pedaço de fileira ou coluna sem parede no meio)
  function linha(a){
    if(a.length<2){ return a[0]===0 ? VAZIO_W : -SOMA_W*Math.pow(a[0],SOMA_P); }
    let soma=0, vaz=0, junta=0, ant=0, cont=0, esq=0, dir=0;
    for(let i=0;i<a.length;i++){ const r=a[i]; soma+=Math.pow(r,SOMA_P);
      if(r===0) vaz++; else { if(ant===r) cont++; else if(cont>0){ junta+=1+cont; cont=0; } ant=r; } }
    if(cont>0) junta+=1+cont;
    for(let i=1;i<a.length;i++){ if(a[i-1]>a[i]) esq+=Math.pow(a[i-1],MONO_P)-Math.pow(a[i],MONO_P); else dir+=Math.pow(a[i],MONO_P)-Math.pow(a[i-1],MONO_P); }
    return PERDA + VAZIO_W*vaz + JUNTA_W*junta - MONO_W*Math.min(esq,dir) - SOMA_W*soma;
  }
  const corte=(x,y,nx,ny)=>!inside(nx,ny) || edgeBetween(x,y,nx,ny);
  function heur(ts){
    const g=Array.from({length:H},()=>Array(W).fill(0));
    for(const w of S.walls) g[w.y][w.x]=-1;
    for(const t of ts) if(t.t>0) g[t.y][t.x]=t.t; else g[t.y][t.x]=-1;   // torrão e parede quebram a fileira
    let s=0;
    for(let y=0;y<H;y++){ let seg=[]; for(let x=0;x<W;x++){ if(g[y][x]<0){ if(seg.length) s+=linha(seg); seg=[]; continue; } seg.push(g[y][x]); if(corte(x,y,x+1,y)){ s+=linha(seg); seg=[]; } } if(seg.length) s+=linha(seg); }
    for(let x=0;x<W;x++){ let seg=[]; for(let y=0;y<H;y++){ if(g[y][x]<0){ if(seg.length) s+=linha(seg); seg=[]; continue; } seg.push(g[y][x]); if(corte(x,y,x,y+1)){ s+=linha(seg); seg=[]; } } if(seg.length) s+=linha(seg); }
    return s;
  }
  function vazias(ts){ const occ=new Set(ts.map(t=>t.x+','+t.y)), v=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!occ.has(x+','+y)&&!wallAt(x,y)) v.push([x,y]); return v; }
  function acaso(ts,prof){
    if(prof<=0) return heur(ts);
    let v=vazias(ts); if(!v.length) return heur(ts);
    if(v.length>6) v=v.sort(()=>Math.random()-.5).slice(0,6);
    let s=0; for(const [x,y] of v){ s+=.9*maxi([...ts,{id:'z',x,y,t:1}],prof)+.1*maxi([...ts,{id:'z',x,y,t:2}],prof); }
    return s/v.length;
  }
  function maxi(ts,prof){ let b=-Infinity; for(const [dx,dy] of DIRS){ const r=slide(ts,dx,dy); if(r.moved) b=Math.max(b,acaso(r.tiles,prof-1)); } return b===-Infinity ? heur(ts)-1e7 : b; }
  // quanto um arrasto adianta as metas do Clássico (0 fora do Clássico)
  function ganho(r,m){ if(!m) return 0; let g=0; const os=objsDe(m);
    for(const o of r.merges){
      if((S.alvos||[]).some(a=>!a.ok&&!a.leve&&a.x===o.x&&a.y===o.y&&o.t>=a.t)) g+=6;
      if(S.terra?.has(o.x+','+o.y)) g+=3;
      if(o.solta) g+=6;
      for(const ob of os){ if(ob.proibido && o.t>=ob.proibido) return -1e9;
        if((ob.forme&&o.t===ob.forme)||(ob.cor!=null&&o.t===ob.t&&o.c===ob.cor)) g+=4;
        if(ob.seq && S.seqI<ob.seq.length && o.t>=ob.seq[S.seqI]) g+=4; }
    }
    for(const b of r.breaks) for(const ob of os) if(ob.quebre && b.t>=ob.quebre) g+=5;
    if(r.merges.length>=2 && os.some(o=>o.combo)) g+=3;
    if(S.carro && r.tiles.some(t=>t.x===S.carro.x&&t.y===S.carro.y&&t.t>=S.carro.t&&t.k!=='p')) g+=6;
    const perto=(x,y,t)=>{ let d=9; for(const q of r.tiles) if(q.t>=t && q.k!=='p' && !q.presa) d=Math.min(d,Math.abs(q.x-x)+Math.abs(q.y-y)); return Math.max(0,2-d*.5); };
    for(const a of (S.alvos||[])) if(!a.ok){ if(a.leve && r.tiles.some(q=>q.x===a.x&&q.y===a.y&&q.t>=a.t&&q.k!=='p')) g+=6; g+=perto(a.x,a.y,a.leve?a.t:a.t-1); }
    if(S.carro) g+=perto(S.carro.x,S.carro.y,S.carro.t-1);
    for(const q of r.tiles) if(q.presa) g+=perto(q.x,q.y,q.t)*.8;
    return g; }
  // escolhe o arrasto: prof=2 olha este arrasto, onde nasce a próxima e o arrasto seguinte (3 quando apertado)
  function escolhe(ts,m,prof){ let best=null, bs=-Infinity;
    if(prof==null) prof = vazias(ts).length<=3 ? 3 : 2;   // tabuleiro apertado: pensa mais longe
    for(const [dx,dy] of DIRS){ const r=slide(ts,dx,dy); if(!r.moved) continue;
      const g=ganho(r,m); if(g<-1e8) continue;
      const v=acaso(r.tiles,prof-1)+g*4000;
      if(v>bs){ bs=v; best={dir:[dx,dy], r}; } }
    if(!best) for(const [dx,dy] of DIRS){ const r=slide(ts,dx,dy); if(r.moved){ best={dir:[dx,dy], r}; break; } }
    return best; }
  // robô "da meta": olha 2 lances com poucas amostras, pesa a cobra e corre direto para as metas.
  // Joga pior para subir alto, mas é melhor nas cores, na picareta e no Passinho (onde segurar o canto atrapalha).
  let peso={}, pesoWH='';
  function notaCobra(ts){
    if(pesoWH!==W+'x'+H){ const ord=[]; for(let y=H-1,k=0;y>=0;y--,k++){ const xs=[...Array(W).keys()]; if(k%2) xs.reverse(); for(const x of xs) ord.push([x,y]); }
      peso={}; ord.forEach(([x,y],i)=>peso[x+','+y]=Math.pow(2.2,(W*H-i))); pesoWH=W+'x'+H; }
    let s=0; for(const t of ts) s+=Math.pow(2,t.t)*(peso[t.x+','+t.y]||1); return s*(1+0.08*(W*H-ts.length)); }
  function melhorMeta(ts,prof,m){ let best=null, bs=-Infinity;
    for(const [dx,dy] of DIRS){ const r=slide(ts,dx,dy); if(!r.moved) continue;
      let sc;
      if(prof<=1) sc=notaCobra(r.tiles);
      else { const am=vazias(r.tiles).sort(()=>Math.random()-.5).slice(0,3); sc=0;
        for(const [x,y] of am){ const b=melhorMeta([...r.tiles,{id:'z',x,y,t:1}],prof-1,m); sc+= b ? b.sc : 0; }
        sc/=Math.max(1,am.length); }
      if(m){ const g=ganho(r,m); sc = g<0 ? -1e300 : sc*(1+0.6*g); }
      if(sc>bs){ bs=sc; best={dir:[dx,dy], r, sc}; } }
    return best; }
  const escolheMeta = (ts,m) => melhorMeta(ts,2,m);
  return {escolhe, escolheMeta, heur};
})();
`;
