// ===================== DESENHO DAS PEDRINHAS (SVG) =====================
const TC = ['#7a5a3c','#e2cfa6','#d39b6a','#c0694a','#7d8aa0','#9a77c9','#5ec4d6','#e06a9a','#cfd8e8','#f0a830','#3fbf8f','#e04a5a','#4a4a66','#ffd84a','#5b3fa0'];
const TD = ['#5e4329','#c9b48a','#b57f52','#9c5136','#5f6b80','#7a59a8','#3e9fb2','#b84a78','#9aa6bb','#c47f12','#2a8f68','#a8303e','#2c2c44','#e0a91e','#3b2378'];
// cor de qualquer nível: além do 14, a cor continua girando
const rc = t => t<TC.length ? TC[t] : `hsl(${(t*53)%360} 62% 62%)`;
const rd = t => t<TD.length ? TD[t] : `hsl(${(t*53)%360} 55% 42%)`;
const INK = '#2e2219';
const MOOD = ['', ['sleep','sleep'], ['dot','o'], ['dot','smile'], ['proud','smile'], ['star','big'], ['star','big'], ['star','big'],
  ['happy','smile'], ['dot','smile'], ['star','big'], ['proud','big'], ['grump','big'], ['star','big'], ['happy','smile']];
const moodOf = t => MOOD[Math.min(t,14)];
function eyes(cx,cy,mood,s=1,gap=11,lx=0,ly=0){
  const L=cx-gap*s+lx, R=cx+gap*s+lx; cy+=ly;
  if(mood==='sleep') return `<path d="M${L-4*s} ${cy} q${4*s} ${3*s} ${8*s} 0 M${R-4*s} ${cy} q${4*s} ${3*s} ${8*s} 0" stroke="${INK}" stroke-width="${2.6*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='star') return [L,R].map(x=>`<path d="M${x} ${cy-6*s} l${1.8*s} ${4.2*s} ${4.2*s} ${1.8*s} -${4.2*s} ${1.8*s} -${1.8*s} ${4.2*s} -${1.8*s} -${4.2*s} -${4.2*s} -${1.8*s} ${4.2*s} -${1.8*s}z" fill="#fff" stroke="${INK}" stroke-width="${1.2*s}"/>`).join('');
  if(mood==='grump') return `<circle cx="${L}" cy="${cy}" r="${2.6*s}" fill="${INK}"/><circle cx="${R}" cy="${cy}" r="${2.6*s}" fill="${INK}"/><path d="M${L-5*s} ${cy-7*s} l${8*s} ${3*s} M${R+5*s} ${cy-7*s} l-${8*s} ${3*s}" stroke="${INK}" stroke-width="${2.4*s}" stroke-linecap="round"/>`;
  if(mood==='squeeze') return `<path d="M${L-4*s} ${cy-3*s} l${7*s} ${3*s} l-${7*s} ${3*s} M${R+4*s} ${cy-3*s} l-${7*s} ${3*s} l${7*s} ${3*s}" stroke="${INK}" stroke-width="${2.4*s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(mood==='happy') return `<path d="M${L-4*s} ${cy+1*s} q${4*s} -${6*s} ${8*s} 0 M${R-4*s} ${cy+1*s} q${4*s} -${6*s} ${8*s} 0" stroke="${INK}" stroke-width="${2.6*s}" fill="none" stroke-linecap="round"/>`;
  const b = mood==='proud' ? `<path d="M${L-4*s} ${cy-7*s} q${4*s} -${3*s} ${8*s} 0 M${R-4*s} ${cy-7*s} q${4*s} -${3*s} ${8*s} 0" stroke="${INK}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>` : '';
  return `<ellipse cx="${L}" cy="${cy}" rx="${2.8*s}" ry="${3.6*s}" fill="${INK}"/><ellipse cx="${R}" cy="${cy}" rx="${2.8*s}" ry="${3.6*s}" fill="${INK}"/>${b}`;
}
function mouth(cx,cy,mood,s=1){
  if(mood==='sleep') return `<path d="M${cx-3*s} ${cy} h${6*s}" stroke="${INK}" stroke-width="${2.4*s}" stroke-linecap="round"/>`;
  if(mood==='o') return `<ellipse cx="${cx}" cy="${cy}" rx="${2.6*s}" ry="${3.2*s}" fill="${INK}"/>`;
  if(mood==='grump') return `<path d="M${cx-5*s} ${cy+2*s} q${5*s} -${5*s} ${10*s} 0" stroke="${INK}" stroke-width="${2.4*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='puff') return `<path d="M${cx-4*s} ${cy} q${4*s} -${2*s} ${8*s} 0" stroke="${INK}" stroke-width="${2.4*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='open') return `<ellipse cx="${cx}" cy="${cy+2*s}" rx="${6*s}" ry="${5*s}" fill="${INK}"/><path d="M${cx-3*s} ${cy+5*s} q${3*s} ${2*s} ${6*s} 0" fill="#e5737b"/>`;
  if(mood==='wavy') return `<path d="M${cx-6*s} ${cy} q${1.5*s} -${2.5*s} ${3*s} 0 t${3*s} 0 t${3*s} 0 t${3*s} 0" stroke="${INK}" stroke-width="${2.2*s}" fill="none" stroke-linecap="round"/>`;
  const w = mood==='big' ? 7 : 5;
  return `<path d="M${cx-w*s} ${cy} q${w*s} ${(mood==='big'?8:6)*s} ${2*w*s} 0" stroke="${INK}" stroke-width="${2.4*s}" fill="${mood==='big'?INK:'none'}" stroke-linecap="round"/>`;
}
const blush = (cx,cy,s=1,gap=17,big=false) => `<ellipse cx="${cx-gap*s}" cy="${cy}" rx="${(big?6:4)*s}" ry="${(big?4:2.4)*s}" fill="#ff8a7a" opacity="${big?.75:.55}"/><ellipse cx="${cx+gap*s}" cy="${cy}" rx="${(big?6:4)*s}" ry="${(big?4:2.4)*s}" fill="#ff8a7a" opacity="${big?.75:.55}"/>`;
const crown = (cx,cy,s=1) => `<path d="M${cx-10*s} ${cy} l${3*s} -${10*s} ${4*s} ${6*s} ${3*s} -${9*s} ${3*s} ${9*s} ${4*s} -${6*s} ${3*s} ${10*s}z" fill="#f2b33d" stroke="${INK}" stroke-width="1.6"/>`;
const sparkle = (x,y,r,c='#fff') => `<path d="M${x} ${y-r} Q${x} ${y} ${x+r} ${y} Q${x} ${y} ${x} ${y+r} Q${x} ${y} ${x-r} ${y} Q${x} ${y} ${x} ${y-r}z" fill="${c}"/>`;
const sweat = (x,y) => `<path d="M${x} ${y} q-4 7 0 9 q4 -2 0 -9z" fill="#9fd4f0" stroke="${INK}" stroke-width="1.4"/>`;
function gemSvg(cx,cy,c,s=1){ return `<path d="M${cx-9*s} ${cy-3*s} l${4*s} -${6*s} h${10*s} l${4*s} ${6*s} l-${9*s} ${12*s}z" fill="${c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${cx-5*s} ${cy-9*s} l${2*s} ${6*s} M${cx+5*s} ${cy-9*s} l-${2*s} ${6*s} M${cx-9*s} ${cy-3*s} h${18*s}" stroke="${INK}" stroke-width="1" opacity=".5"/>${sparkle(cx+7*s,cy-11*s,4*s)}`; }
// cada minério com o formato com que costuma ser desenhado
function oreSvg(o,cx,cy,s=1){
  const P=(x,y)=>`${cx+x*s} ${cy+y*s}`, K=`stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"`;
  if(o===0) return clodSvg(cx,cy,s*1.05);
  if(o===2) return `<path d="M${P(-10,2)} L${P(-6,-8)} L${P(3,-10)} L${P(10,-3)} L${P(8,7)} L${P(-2,9)}Z" fill="#d9772e" ${K}/>
    <path d="M${P(-6,-8)} L${P(3,-10)} L${P(1,-1)}Z" fill="#f2a25c"/>
    <circle cx="${cx+5*s}" cy="${cy+3*s}" r="${2.2*s}" fill="#4fbf8f"/><circle cx="${cx-5*s}" cy="${cy+4*s}" r="${1.6*s}" fill="#4fbf8f"/>`;
  if(o===3) return `<path d="M${P(-12,6)} L${P(12,6)} L${P(9,-2)} L${P(-9,-2)}Z" fill="#7b848e" ${K}/>
    <path d="M${P(-9,-2)} L${P(9,-2)} L${P(6,-8)} L${P(-6,-8)}Z" fill="#aeb6bf" ${K}/>
    <path d="M${P(-5,-6)} h${7*s}" stroke="#fff" stroke-width="${1.4*s}" stroke-linecap="round" opacity=".7"/>`;
  if(o===4) return `<circle cx="${cx}" cy="${cy}" r="${10*s}" fill="#e9eef3" ${K}/>
    <circle cx="${cx}" cy="${cy}" r="${7*s}" fill="none" stroke="#b9c3cc" stroke-width="${1.4*s}"/>
    <path d="M${P(0,-4)} l${1.2*s} ${2.6*s} ${2.8*s} ${.4*s} -${2*s} ${2*s} ${.5*s} ${2.8*s} -${2.5*s} -${1.4*s} -${2.5*s} ${1.4*s} ${.5*s} -${2.8*s} -${2*s} -${2*s} ${2.8*s} -${.4*s}z" fill="#c7d0d8"/>
    ${sparkle(cx+8*s,cy-8*s,3.5*s)}`;
  if(o===5) return `<path d="M${P(-10,2)} Q${P(-12,-6)} ${P(-4,-8)} Q${P(0,-13)} ${P(5,-8)} Q${P(12,-7)} ${P(10,1)} Q${P(12,8)} ${P(3,9)} Q${P(-3,12)} ${P(-8,8)} Q${P(-13,7)} ${P(-10,2)}Z" fill="#f5c542" ${K}/>
    <ellipse cx="${cx-3*s}" cy="${cy-4*s}" rx="${3*s}" ry="${1.8*s}" fill="#fff3b0"/><circle cx="${cx+4*s}" cy="${cy+2*s}" r="${1.4*s}" fill="#e0a91e"/>
    ${sparkle(cx+9*s,cy-9*s,3.5*s)}`;
  if(o===1) return `<path d="M${P(-9,4)} L${P(-7,-5)} L${P(-1,-9)} L${P(6,-6)} L${P(10,2)} L${P(5,8)} L${P(-4,8)}Z" fill="#2f2c2a" ${K}/>
    <path d="M${P(-6,-4)} L${P(-1,-7)} L${P(1,-2)}Z M${P(4,-3)} L${P(7,1)} L${P(3,2)}Z" fill="#5a5550"/>`;
  if(o===6) return `<rect x="${cx-11*s}" y="${cy+3*s}" width="${22*s}" height="${7*s}" rx="${3*s}" fill="#8a7f72" ${K}/>
    <path d="M${P(-9,7)} L${P(-8,-1)} L${P(-6,-5)} L${P(-4,-1)} L${P(-4,7)}Z" fill="#9a6ad8" ${K}/>
    <path d="M${P(4,7)} L${P(4,-2)} L${P(7,-7)} L${P(9,-2)} L${P(9,7)}Z" fill="#9a6ad8" ${K}/>
    <path d="M${P(-3,6)} L${P(-3,-6)} L${P(0,-12)} L${P(3,-6)} L${P(3,6)}Z" fill="#b48ce8" ${K}/>
    <path d="M${P(0,-11)} L${P(0,5)}" stroke="#e3cffc" stroke-width="${1.2*s}"/>`;
  if(o===7) return gemSvg(cx,cy,'#6fe3ff',s);
  if(o===8) return `<path d="M${P(-8,-6)} L${P(-5,-9)} L${P(5,-9)} L${P(8,-6)} L${P(8,6)} L${P(5,9)} L${P(-5,9)} L${P(-8,6)}Z" fill="#2fbf6f" ${K}/>
    <rect x="${cx-5*s}" y="${cy-5*s}" width="${10*s}" height="${10*s}" fill="#7fe0a8" opacity=".7"/>${sparkle(cx+8*s,cy-9*s,3.5*s)}`;
  if(o===9) return `<ellipse cx="${cx}" cy="${cy}" rx="${9*s}" ry="${10.5*s}" fill="#e0384a" ${K}/>
    <ellipse cx="${cx}" cy="${cy}" rx="${5*s}" ry="${6*s}" fill="none" stroke="#ff8a96" stroke-width="${1.2*s}"/>
    <ellipse cx="${cx-3*s}" cy="${cy-5*s}" rx="${2.4*s}" ry="${1.5*s}" fill="#fff" opacity=".7"/>${sparkle(cx+8*s,cy-9*s,3.5*s)}`;
  if(o===10) return `<path d="M${P(0,-11)} Q${P(9,-1)} ${P(8,4)} Q${P(6,10)} ${P(0,10)} Q${P(-6,10)} ${P(-8,4)} Q${P(-9,-1)} ${P(0,-11)}Z" fill="#2f6fe0" ${K}/>
    <path d="M${P(-3,1)} Q${P(-3,-4)} ${P(0,-7)}" stroke="#9cc0ff" stroke-width="${1.6*s}" fill="none" stroke-linecap="round"/>${sparkle(cx+8*s,cy-8*s,3.5*s)}`;
  if(o===11) return `<ellipse cx="${cx}" cy="${cy}" rx="${10*s}" ry="${8*s}" fill="#dff6ff" ${K}/>
    <circle cx="${cx-4*s}" cy="${cy-2*s}" r="${2.6*s}" fill="#ff9ad5" opacity=".75"/><circle cx="${cx+3*s}" cy="${cy-3*s}" r="${2.2*s}" fill="#7fe0a8" opacity=".75"/>
    <circle cx="${cx+4*s}" cy="${cy+3*s}" r="${2.4*s}" fill="#a77bdf" opacity=".75"/><circle cx="${cx-2*s}" cy="${cy+3.5*s}" r="${2*s}" fill="#6fb8ff" opacity=".75"/>${sparkle(cx+9*s,cy-8*s,3.5*s)}`;
  if(o===12){ const pts=[...Array(10).keys()].map(i=>{ const a=-Math.PI/2+i*Math.PI/5, r=(i%2?4.6:11)*s; return `${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r}`; }).join(' L');
    return `<circle cx="${cx}" cy="${cy}" r="${13*s}" fill="#fff3b0" opacity=".45"/><path d="M${pts}Z" fill="#fff1a0" ${K}/>${sparkle(cx+9*s,cy-9*s,3.5*s)}`; }
  if(o===13) return `<circle cx="${cx}" cy="${cy}" r="${12*s}" fill="#ff5a3a" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${8.5*s}" fill="#e8432f" ${K}/>
    <ellipse cx="${cx}" cy="${cy}" rx="${13*s}" ry="${4*s}" fill="none" stroke="#f2b33d" stroke-width="${2*s}" transform="rotate(-20 ${cx} ${cy})"/>
    <circle cx="${cx-3*s}" cy="${cy-3*s}" r="${2.4*s}" fill="#ffd0b8"/>${sparkle(cx+9*s,cy-9*s,3.5*s)}`;
  return gemSvg(cx,cy,'#6fe3ff',s);
}
function clodSvg(cx,cy,s=1){ return `<path d="M${cx-9*s} ${cy+3*s} q-2 -8 5 -10 q4 -6 10 -2 q7 1 5 9 q1 7 -8 7 q-10 1 -12 -4z" fill="#7a5a3c" stroke="${INK}" stroke-width="1.8"/><circle cx="${cx-2*s}" cy="${cy-2*s}" r="${1.2*s}" fill="#5e4329"/><circle cx="${cx+4*s}" cy="${cy+3*s}" r="${1.4*s}" fill="#5e4329"/>`; }
function torraoInner(){
  if(espFig()) return lixoInner();
  return `<path d="M18 70 Q14 48 30 40 Q36 26 52 30 Q66 22 76 36 Q90 42 86 62 Q88 80 66 82 Q50 88 34 82 Q16 82 18 70z" fill="#7a5a3c" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="34" cy="50" r="2" fill="#5e4329"/><circle cx="70" cy="70" r="2.4" fill="#5e4329"/><circle cx="62" cy="40" r="1.6" fill="#5e4329"/><circle cx="26" cy="72" r="1.8" fill="#5e4329"/>
    <path d="M70 32 l5 -6 M76 38 l7 -2" stroke="#6b8f3a" stroke-width="2.4" stroke-linecap="round"/>
    ${eyes(52,58,'grump',.9,10)}${mouth(52,70,'grump',.8)}`;
}
// opt: {face:[olhos,boca], look:[dx,dy], blushBig, sweat}
// picareta: a cabeça tem a cor da rocha do mesmo nível (é o par que ela quebra)
function pickInner(t){
  if(espFig()) return buracoInner(Math.max(1,t));
  const k=Math.min(t,9), s=.78+k*.05, c=rc(t), d=rd(t);
  return `<ellipse cx="50" cy="88" rx="${24*s}" ry="4.5" fill="#0002"/>
    <g transform="translate(50 54) scale(${s}) rotate(-28)">
      <rect x="-5" y="-6" width="10" height="50" rx="5" fill="#a8743f" stroke="${INK}" stroke-width="2.6"/>
      <rect x="-2" y="2" width="3" height="36" rx="1.5" fill="#c99561"/>
      <path d="M-36 -2 Q0 -34 36 -2 L30 4 Q0 -20 -30 4Z" fill="${c}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M-26 -6 Q0 -26 26 -6" stroke="#fff" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>
      <path d="M-30 4 Q0 -20 30 4 L27 6 Q0 -14 -27 6Z" fill="${d}"/>
      <rect x="-8" y="-20" width="16" height="16" rx="4" fill="#6b625a" stroke="${INK}" stroke-width="2.4"/>
    </g>
    ${k>=5?sparkle(80,22,5):''}`;
}
const CORES = ['#a77bdf','#6fbf5a'];
function haloSvg(c){
  if(c===2) return `<path d="M50 16 A42 42 0 0 0 50 100Z" fill="${CORES[0]}" opacity=".6"/><path d="M50 16 A42 42 0 0 1 50 100Z" fill="${CORES[1]}" opacity=".6"/>`;
  return `<circle cx="50" cy="58" r="42" fill="${CORES[c]}" opacity=".6"/>`;
}
// Cada nível tem corpo, acessório e cara próprios (não só cor):
// 1 Cascalho, 2 Pedra, 3 Rocha (corpo de pedra) · 4 Rocha densa (capacete de mineiro) · 5 Geodo (cristais brotando)
// 6 Cristalino (corpo facetado, coroa) · 7 Geodo real (capa e coroa) · 8 Pedra lunar (esfera, lua, crateras)
// 9 Âmbar (gota translúcida com um bichinho preso) · 10 Esmeralda viva (gema octogonal com folhas)
// 11 Rubi real (coroa grande e bigode) · 12 Meteorito (em chamas, crateras) · 13 Estrela (corpo de estrela, raios)
// 14 Galáxia (disco em espiral, anel) · 15+ Galáxia com planetas em órbita (um a mais por nível)
function pedraInner(t, opt={}){
  if(t>0 && espFig()) return planetaInner(t, opt.cor);   // Clássico no espaço: a figura vira o planeta do nível
  const r=22+Math.min(t,7)*3, cy=58, s=.8+Math.min(t,9)*.05;
  const [em,mm] = opt.face || moodOf(t);
  const [lx,ly] = opt.look || [0,0];
  const C=rc(t), D=rd(t), K=`stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`;
  const X=(a)=>50+a*r, Y=(b)=>cy+b*r;
  let back='', body='', det='', head='', front='';

  // ---------- atrás do corpo ----------
  if(t===7) back += `<path d="M${X(-.8)} ${Y(-.3)} Q${X(-1.35)} ${Y(.9)} ${X(-.5)} ${Y(1.05)} L${X(.5)} ${Y(1.05)} Q${X(1.35)} ${Y(.9)} ${X(.8)} ${Y(-.3)}Z" fill="#b8323e" ${K}/>`;
  if(t===12) back += `<path d="M${X(.1)} ${Y(-.7)} Q${X(.9)} ${Y(-1.2)} ${X(1.25)} ${Y(-1.65)} Q${X(1.05)} ${Y(-.85)} ${X(.95)} ${Y(-.2)}Z" fill="#ff7a2a" ${K}/>
    <path d="M${X(-.45)} ${Y(-.75)} Q${X(.2)} ${Y(-1.45)} ${X(.65)} ${Y(-1.85)} Q${X(.55)} ${Y(-1.05)} ${X(.35)} ${Y(-.6)}Z" fill="#ffb03a" ${K}/>
    <path d="M${X(.05)} ${Y(-.75)} Q${X(.55)} ${Y(-1.1)} ${X(.8)} ${Y(-1.35)} Q${X(.7)} ${Y(-.85)} ${X(.6)} ${Y(-.5)}Z" fill="#ffe27a"/>`;
  if(t===13) back += [...Array(8).keys()].map(i=>{ const a=i*Math.PI/4+Math.PI/8, x1=50+Math.cos(a)*(r+2), y1=cy+Math.sin(a)*(r+2), x2=50+Math.cos(a)*(r+16), y2=cy+Math.sin(a)*(r+16); return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${C}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`; }).join('');
  if(t>=14) back += `<ellipse cx="50" cy="${cy}" rx="${r*1.45}" ry="${r*.42}" fill="none" stroke="#f2b33d" stroke-width="3" opacity=".85" transform="rotate(-18 50 ${cy})"/>`;
  if(t>=8 && t<=11) back += `<circle cx="50" cy="${cy}" r="${r+9}" fill="none" stroke="${C}" stroke-width="3" stroke-dasharray="4 6" opacity=".7"/>`;
  if(t>=10 && t!==13) back = `<circle cx="50" cy="${cy}" r="${r+14}" fill="${C}" opacity=".2"/>` + back;

  // ---------- corpo ----------
  const shade = `<path d="M${X(-.8)} ${Y(.3)} Q50 ${Y(.95)} ${X(.85)} ${Y(.25)} Q${X(.6)} ${Y(.8)} 50 ${Y(.8)} Q${X(-.75)} ${Y(.8)} ${X(-.8)} ${Y(.3)}z" fill="${D}"/>`;
  const shine = `<ellipse cx="${X(-.45)}" cy="${Y(-.55)}" rx="${r*.22}" ry="${r*.12}" fill="#fff" opacity=".45" transform="rotate(-25 ${X(-.45)} ${Y(-.55)})"/>`;
  const poly = pts => 'M'+pts.map(([a,b])=>`${X(a)} ${Y(b)}`).join(' L')+'Z';
  if(t===6){
    body = `<path d="${poly([[-1,-.15],[-.55,-.95],[.55,-.95],[1,-.15],[.7,.8],[-.7,.8]])}" fill="${C}" ${K}/>
      <path d="M${X(-.55)} ${Y(-.95)} L50 ${Y(-.2)} L${X(.55)} ${Y(-.95)} M${X(-1)} ${Y(-.15)} L50 ${Y(-.2)} L${X(1)} ${Y(-.15)} M50 ${Y(-.2)} L50 ${Y(.8)}" stroke="${D}" stroke-width="1.8" fill="none" opacity=".75"/>${shine}`;
  } else if(t===8){
    body = `<circle cx="50" cy="${cy}" r="${r*.92}" fill="${C}" ${K}/><path d="M${X(-.62)} ${Y(.55)} A${r*.92} ${r*.92} 0 0 0 ${X(.7)} ${Y(.55)}" fill="none" stroke="${D}" stroke-width="5" opacity=".55"/>${shine}`;
  } else if(t===9){
    body = `<path d="M50 ${Y(-1.15)} Q${X(1.05)} ${Y(-.1)} ${X(.9)} ${Y(.35)} Q${X(.7)} ${Y(.9)} 50 ${Y(.88)} Q${X(-.7)} ${Y(.9)} ${X(-.9)} ${Y(.35)} Q${X(-1.05)} ${Y(-.1)} 50 ${Y(-1.15)}Z" fill="${C}" fill-opacity=".85" ${K}/>${shine}`;
  } else if(t===10){
    body = `<path d="${poly([[-.55,-.95],[.55,-.95],[1,-.4],[1,.4],[.55,.85],[-.55,.85],[-1,.4],[-1,-.4]])}" fill="${C}" ${K}/>
      <path d="${poly([[-.4,-.65],[.4,-.65],[.7,-.3],[.7,.3],[.4,.6],[-.4,.6],[-.7,.3],[-.7,-.3]])}" fill="#fff" opacity=".13"/>${shine}`;
  } else if(t===13){
    const p=[...Array(10).keys()].map(i=>{ const a=-Math.PI/2+i*Math.PI/5, rr=(i%2?.58:1.15)*r; return `${50+Math.cos(a)*rr} ${cy+Math.sin(a)*rr}`; }).join(' L');
    body = `<path d="M${p}Z" fill="${C}" ${K}/>${shine}`;
  } else if(t>=14){
    body = `<circle cx="50" cy="${cy}" r="${r*.95}" fill="${C}" ${K}/>` +
      [0,1,2].map(i=>`<path d="M50 ${cy} q${r*.55} -${r*.12} ${r*.8} ${r*.5}" stroke="#d6c6ff" stroke-width="3.2" fill="none" opacity=".7" transform="rotate(${i*120+t*17} 50 ${cy})"/>`).join('') +
      [[-.5,-.35,2.4],[.5,-.45,1.8],[.25,.55,2],[-.55,.4,1.6],[.7,.15,1.5]].map(([a,b,rr])=>sparkle(X(a),Y(b),rr,'#fff')).join('');
  } else {
    body = `<path d="M${X(-1)} ${cy} Q${X(-1)} ${Y(-1.05)} 50 ${Y(-1)} Q${X(1.05)} ${Y(-.95)} ${X(1)} ${cy+2} Q${X(.9)} ${Y(.85)} 50 ${Y(.85)} Q${X(-1.02)} ${Y(.88)} ${X(-1)} ${cy}z" fill="${C}" ${K}/>${shade}${shine}`;
  }

  // ---------- detalhes no corpo ----------
  if(t===8 || t===12) det += `<circle cx="${X(.42)}" cy="${Y(.2)}" r="${r*.15}" fill="${D}" stroke="${INK}" stroke-width="1.2" opacity=".85"/><circle cx="${X(-.3)}" cy="${Y(.5)}" r="${r*.1}" fill="${D}" opacity=".85"/><circle cx="${X(.1)}" cy="${Y(.62)}" r="${r*.07}" fill="${D}" opacity=".85"/>`;
  if(t===9) det += `<g opacity=".8"><ellipse cx="${X(.42)}" cy="${Y(.42)}" rx="4.5" ry="2.8" fill="#5a3a12"/><path d="M${X(.42)-3} ${Y(.42)-1} l-3 -3 M${X(.42)} ${Y(.42)-2} l0 -4 M${X(.42)+3} ${Y(.42)-1} l3 -3 M${X(.42)-2} ${Y(.42)+2} l-3 3 M${X(.42)+2} ${Y(.42)+2} l3 3" stroke="#5a3a12" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="${X(.42)-1}" cy="${Y(.42)-3}" rx="3.5" ry="1.6" fill="#d8eaff" opacity=".8"/></g>
    <path d="M${X(.15)} ${Y(.86)} q-2 6 0 8 q2 -2 0 -8z" fill="${C}" ${K}/>`;
  if(t===5 || t===7) det += sparkle(X(.7),Y(-.8),5) + sparkle(X(-.9),Y(-.2),3.5);
  if(t===10) det += sparkle(X(.75),Y(-.75),4.5);

  // ---------- na cabeça ----------
  if(t===4) head += `<path d="M${X(-.92)} ${Y(-.42)} Q${X(-.9)} ${Y(-1.2)} 50 ${Y(-1.22)} Q${X(.9)} ${Y(-1.2)} ${X(.92)} ${Y(-.42)}Z" fill="#f2b33d" ${K}/>
    <path d="M${X(-1.08)} ${Y(-.42)} H${X(1.08)}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="50" cy="${Y(-.86)}" r="${r*.17}" fill="#fff3b0" ${K}/><circle cx="50" cy="${Y(-.86)}" r="${r*.07}" fill="#fff"/>`;
  if(t===5) head += [[-.38,.42],[0,.62],[.36,.38]].map(([a,h])=>`<path d="M${X(a)-5} ${Y(-.86)} L${X(a)} ${Y(-.86-h)} L${X(a)+5} ${Y(-.86)}Z" fill="#c9a6f2" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`).join('');
  if(t===6) head += crown(50,Y(-.92),1.1);
  if(t===7) head += crown(50,Y(-.98),1.25) + `<circle cx="50" cy="${Y(-1.18)}" r="2.6" fill="#6fe3ff" stroke="${INK}" stroke-width="1"/>`;
  if(t===8) head += `<path d="M${X(-.25)} ${Y(-1.32)} a${r*.36} ${r*.36} 0 1 0 ${r*.4} ${r*.48} a${r*.28} ${r*.28} 0 1 1 -${r*.4} -${r*.48}z" fill="#fff3b0" ${K}/>`;
  if(t===10) head += `<path d="M50 ${Y(-.95)} q-${r*.32} -${r*.42} -${r*.55} -${r*.05} q${r*.28} ${r*.2} ${r*.55} ${r*.05}z" fill="#3fbf6f" ${K}/><path d="M50 ${Y(-.95)} q${r*.32} -${r*.42} ${r*.55} -${r*.05} q-${r*.28} ${r*.2} -${r*.55} ${r*.05}z" fill="#5fd88a" ${K}/><path d="M50 ${Y(-.95)} v-${r*.25}" stroke="${INK}" stroke-width="2"/>`;
  if(t===11) head += crown(50,Y(-.92),1.7) + `<circle cx="50" cy="${Y(-1.22)}" r="3.6" fill="#e0384a" stroke="${INK}" stroke-width="1.2"/>`;
  if(t>=15) head += [...Array(Math.min(t-14,6)).keys()].map(i=>{ const a=i*2.4+t, x=50+Math.cos(a)*r*1.45, y=cy+Math.sin(a)*r*.42; return `<circle cx="${x}" cy="${y}" r="${3.6-i*.3}" fill="hsl(${(i*70+t*30)%360} 70% 62%)" stroke="${INK}" stroke-width="1"/>`; }).join('');

  // ---------- rara, cor, cara ----------
  let b = (opt.cor!=null ? haloSvg(opt.cor) : '') + back + `<ellipse cx="50" cy="${Y(.88)}" rx="${r*.8}" ry="5" fill="#0002"/>` + body + det + head;
  if(opt.rara) b += `<circle cx="50" cy="${cy}" r="${r+4}" fill="none" stroke="#f2b33d" stroke-width="3.5"/>` + sparkle(X(-.95),Y(-.75),4.5,'#ffe27a') + sparkle(X(.95),Y(.35),3.8,'#ffe27a') + sparkle(X(.2),Y(.9),3.2,'#ffe27a');
  if(opt.blushBig) b += blush(50,cy+5,s,15,true);
  else if(t>=3) b += blush(50,cy+4,s);
  b += eyes(50,cy-2,em,s,11,lx*2.5,ly*2.5) + mouth(50+lx*1.5,cy+9+ly*1.5,mm,s);
  if(t===11 && !opt.face) b += `<path d="M50 ${cy+5} q-5 -4 -12 1 q6 4 12 -1 q6 -4 12 1 q-7 4 -12 -1z" fill="#5a3a22" stroke="${INK}" stroke-width="1.2"/>`;
  if(opt.sweat) b += sweat(X(.75),Y(-.6));
  return b;
}
const svgOf = inner => `<svg viewBox="0 0 100 100">${inner}</svg>`;

