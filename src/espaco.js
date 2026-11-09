// Motor dos rascunhos do Ptui no espaço (planetas.html e opiniao.html).
// Tudo é gerado por código: texturas, malhas, fundo e os elementos do Clássico.
'use strict';
const INK='#2e2219';
const DPR=Math.min(window.devicePixelRatio||1,2);
// ===================== utilidades =====================
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const C=hex;
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function randDir(r){const z=r()*2-1,t=r()*Math.PI*2,q=Math.sqrt(1-z*z);return [q*Math.cos(t),z,q*Math.sin(t)];}
function h3(x,y,z,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1274126177)^Math.imul(s|0,1103515245);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vn(x,y,z,s){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
  const a=h3(X,Y,Z,s),b=h3(X+1,Y,Z,s),c=h3(X,Y+1,Z,s),d=h3(X+1,Y+1,Z,s),e=h3(X,Y,Z+1,s),f=h3(X+1,Y,Z+1,s),g=h3(X,Y+1,Z+1,s),k=h3(X+1,Y+1,Z+1,s);
  const ab=a+(b-a)*u,cd=c+(d-c)*u,ef=e+(f-e)*u,gk=g+(k-g)*u,l1=ab+(cd-ab)*v,l2=ef+(gk-ef)*v;return l1+(l2-l1)*w;}
function fbm(x,y,z,o,s){let a=.5,f=1,t=0,n=0;for(let i=0;i<o;i++){t+=a*vn(x*f+i*13.1,y*f,z*f,s+i*31);n+=a;a*=.5;f*=2.07;}return t/n;}
function rotAxis(x,y,z,a){const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;const c=Math.cos(a),s=Math.sin(a),k=1-c;
  return [c+x*x*k,x*y*k-z*s,x*z*k+y*s, y*x*k+z*s,c+y*y*k,y*z*k-x*s, z*x*k-y*s,z*y*k+x*s,c+z*z*k];}
function mmul(A,B){const R=new Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)R[i*3+j]=A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j];return R;}
const ID=[1,0,0,0,1,0,0,0,1];
function disp(el,w,h){el.width=Math.round(w*DPR);el.height=Math.round(h*DPR);el.style.width=w+'px';el.style.height=h+'px';return el.getContext('2d');}

// ===================== luz =====================
const ST={face:false,outline:true,L:null};
function lightFrom(deg){const a=deg*Math.PI/180,x=Math.cos(a)*.78,y=Math.sin(a)*.78,z=.62,l=Math.hypot(x,y,z);return [x/l,y/l,z/l];}
ST.L=lightFrom(135);
const L0=ST.L.slice();

// ===================== texturas (geradas, nas cores do jogo) =====================
const GW=256,GH=128,TW=512,TH=256,TEX={};
// a textura só é gerada quando um planeta precisa dela (gerar todas de uma vez travava a abertura)
function makeTex(fn){return {fn,_px:null,get px(){return this._px||(this._px=gerarTex(this.fn));}};}
// gera aos poucos, nos intervalos livres, as texturas que ainda não foram usadas
function preaquece(){const ks=Object.keys(TEX);let i=0;const passo=()=>{if(i>=ks.length)return;TEX[ks[i++]].px;(window.requestIdleCallback||setTimeout)(passo);};passo();}
function gerarTex(fn){const g=mk(GW,GH),gx=g.getContext('2d'),gi=gx.createImageData(GW,GH),px=gi.data;
  for(let j=0;j<GH;j++){const lat=(.5-(j+.5)/GH)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
    for(let i=0;i<GW;i++){const lon=((i+.5)/GW-.5)*2*Math.PI;const c=fn(cl*Math.sin(lon),sl,cl*Math.cos(lon),lat,lon);const k=(j*GW+i)*4;
      px[k]=c[0];px[k+1]=c[1];px[k+2]=c[2];px[k+3]=c.length>3?c[3]:255;}}
  gx.putImageData(gi,0,0);const big=mk(TW,TH),bx=big.getContext('2d');bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality='high';bx.drawImage(g,0,0,TW,TH);
  const dados=bx.getImageData(0,0,TW,TH).data;g.width=g.height=0;big.width=big.height=0;return dados;}
function craterField(seed,n,amin,amax){const r=rng(seed);return Array.from({length:n},()=>{const a=amin+(amax-amin)*r()*r();return {d:randDir(r),a,cut:Math.cos(a*1.35)};});}
function craterShade(x,y,z,cr){let m=0;for(const c of cr){const dt=x*c.d[0]+y*c.d[1]+z*c.d[2];if(dt<c.cut)continue;const q=Math.acos(Math.min(1,dt))/c.a;
  if(q<1)m-=.24*(1-q*q*.6);else m+=.2*(1-(q-1)/.35);}return m;}
const shadeC=(c,m)=>[c[0]*(1+m),c[1]*(1+m),c[2]*(1+m)];
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
const spot=(lon,lat,lon0,lat0,w,h)=>(wrapA(lon-lon0)/w)**2+((lat-lat0)/h)**2;
function rayField(seed,n){const r=rng(seed);return Array.from({length:n},()=>{const c=randDir(r);let u=[-c[2],0,c[0]];const l=Math.hypot(...u)||1;u=u.map(a=>a/l);
  const v=[c[1]*u[2]-c[2]*u[1],c[2]*u[0]-c[0]*u[2],c[0]*u[1]-c[1]*u[0]];return {c,u,v,s:(r()*1e6)|0};});}
function rayShade(x,y,z,rays){let m=0;for(const R of rays){const dt=x*R.c[0]+y*R.c[1]+z*R.c[2];if(dt<.9)continue;const ang=Math.acos(Math.min(1,dt)),q=ang/.45;
  const az=Math.atan2(x*R.v[0]+y*R.v[1]+z*R.v[2],x*R.u[0]+y*R.u[1]+z*R.u[2]),sec=Math.floor((az+Math.PI)/(2*Math.PI)*16);
  if(h3(sec,R.s,0,9)>.45)m+=.55*(1-q);if(ang<.05)m+=.4;}return m;}
function buildTextures(){
  const crM=craterField(11,18,.04,.16);
  TEX.marte=makeTex((x,y,z,lat)=>{const n=fbm(x*2.2+5,y*2.2,z*2.2,5,1);let c=mix(C('#a9483a'),C('#e8865c'),smooth(.38,.62,n));
    c=mix(c,C('#f4a878'),smooth(.6,.7,fbm(x*6,y*6,z*6,3,7))*.5);c=shadeC(c,craterShade(x,y,z,crM));
    if(Math.abs(lat)>1.2+.3*(n-.5))c=mix(c,[250,246,240],.92);return c;});
  const crL=craterField(23,46,.03,.2);
  TEX.lua=makeTex((x,y,z)=>{let c=mix(C('#b9bfcc'),C('#e6e9f0'),smooth(.35,.65,fbm(x*5,y*5,z*5,3,9)));
    c=mix(c,C('#7f8799'),smooth(.52,.6,fbm(x*1.6,y*1.6,z*1.6,5,3))*.85);return shadeC(c,craterShade(x,y,z,crL));});
  const crH=craterField(91,80,.02,.13),rays=rayField(93,5);
  TEX.mercurio=makeTex((x,y,z)=>{let c=mix(C('#5a0f10'),C('#c0342a'),smooth(.35,.65,fbm(x*3,y*3,z*3,4,92)));c=shadeC(c,craterShade(x,y,z,crH)*1.1);
    return mix(c,C('#ff9c74'),clamp(rayShade(x,y,z,rays),0,.8));});
  const crP=craterField(31,10,.03,.09);
  TEX.pluto=makeTex((x,y,z,lat)=>{const n=fbm(x*2,y*2,z*2,5,13);let c=mix(C('#d29d7c'),C('#f0d0b0'),smooth(.35,.6,n));
    const dark=smooth(.55,.15,Math.abs(lat+.1))*smooth(.45,.6,fbm(x*1.5+3,y*1.5,z*1.5,4,14));c=mix(c,C('#6a3122'),dark*.9);
    c=mix(c,C('#fff8ef'),smooth(.72,.8,y*.2+z*.98+.08*(fbm(x*4,y*4,z*4,3,15)-.5)));return shadeC(c,craterShade(x,y,z,crP)*.6);});
  TEX.venus=makeTex((x,y,z,lat)=>{const w=fbm(x*1.2,y*1.2,z*1.2,3,71),s=fbm(x*1.3+w*1.6,y*5,z*1.3,5,72);
    return shadeC(mix(C('#d39c4c'),C('#fcefc6'),smooth(.3,.7,s)),.08*Math.sin(lat*5+w*5));});
  TEX.terra=makeTex((x,y,z,lat)=>{const n=fbm(x*1.7+3,y*1.7,z*1.7,6,4);const ocean=mix(C('#2a68b8'),C('#43a0e6'),smooth(.25,.5,n));
    let land=mix(C('#4aa84f'),C('#86c96a'),fbm(x*5,y*5,z*5,3,5));
    land=mix(land,C('#dbb562'),smooth(.55,.68,fbm(x*3,y*3,z*3,3,8))*(1-smooth(.3,.7,Math.abs(lat))));
    let c=mix(ocean,land,smooth(.52,.555,n));if(Math.abs(lat)>1.18+.3*(n-.5))c=[245,248,252];return c;});
  TEX.nuvens=makeTex((x,y,z)=>{const a=smooth(.55,.7,fbm(x*2.6,y*4,z*2.6,5,12));return [255,255,255,a*235];});
  TEX.netuno=makeTex((x,y,z,lat,lon)=>{const w=fbm(x*2,y*2,z*2,4,81);let c=mix(C('#1f48b8'),C('#4f86ec'),smooth(-.6,.8,Math.sin(lat*7+(w-.5)*2)));
    c=mix(c,C('#122a70'),smooth(1,.4,spot(lon,lat,-.8,-.35,.32,.12)));
    c=mix(c,C('#eef6ff'),smooth(.66,.74,fbm(x*2,y*14,z*2,4,82))*.9);
    return mix(c,C('#f4f9ff'),smooth(1,.3,spot(lon,lat,-.45,-.2,.28,.045)));});
  TEX.urano=makeTex((x,y,z,lat)=>{let c=mix(C('#7fc8d4'),C('#bdeef0'),smooth(-.5,.8,Math.sin(lat*6+(fbm(x*2,y*2,z*2,3,83)-.5)*1.5)));
    if(lat>.9)c=mix(c,C('#e2fbfa'),smooth(.9,1.2,lat));return mix(c,C('#f4ffff'),smooth(.7,.76,fbm(x*3,y*12,z*3,4,84))*.85);});
  TEX.jupiter=makeTex((x,y,z,lat,lon)=>{const w=fbm(x*2,y*2,z*2,4,6);const b=Math.sin(lat*10+(w-.5)*3.2);
    let c=mix(C('#b56f45'),C('#f6e5c8'),smooth(-.35,.6,b));c=shadeC(c,(fbm(x*8,y*14,z*8,3,2)-.5)*.25);
    const e=spot(lon,lat,.9,-.36,.34,.13);c=mix(c,C('#f3d9c0'),smooth(1.6,1.1,e)*.6);return mix(c,C('#cf5536'),smooth(1,.45,e));});
  TEX.saturno=makeTex((x,y,z,lat,lon)=>{const w=fbm(x*2.2,y*2.2,z*2.2,4,3),b=Math.sin(lat*13+(w-.5)*2.6);let c=mix(C('#c99a52'),C('#f7e6b4'),b*.5+.5);
    c=shadeC(c,(fbm(x*6,y*12,z*6,3,8)-.5)*.3);
    c=mix(c,C('#fffaf0'),smooth(1,.3,spot(lon,lat,2.2,.5,.26,.09)));
    c=mix(c,C('#fff3dc'),smooth(1,.3,spot(lon,lat,-.6,.2,.16,.05)));
    const p=Math.PI/2-lat;if(p<.5){const a=((lon%(Math.PI/3))+Math.PI/3)%(Math.PI/3)-Math.PI/6,rh=.34*Math.cos(Math.PI/6)/Math.cos(a);c=mix(c,C('#7f93a6'),smooth(rh+.02,rh-.02,p));}
    if(lat<-1.1)c=mix(c,C('#b8a47c'),smooth(1.1,1.35,-lat));return c;});
  TEX.estrela=makeTex((x,y,z)=>mix(C('#ff9a1a'),C('#fff3a6'),smooth(.33,.72,fbm(x*7,y*7,z*7,4,21))));
}

// ===================== esfera (mapeamento esférico pixel a pixel) =====================
class SphereBody{
  constructor(tex,o={}){Object.assign(this,{tex,tilt:.35,pitch:.25,speed:.05,emissive:false,clouds:null,cloudSpeed:1.3,rScale:.86},o);this.userSpin=0;}
  prep(S){this.S=S;const R=this.R=S/2*this.rScale,cx=S/2,cy=S/2;const idx=[],row=[],col=[],nx=[],ny=[],nz=[];
    const ct=Math.cos(this.tilt),st=Math.sin(this.tilt),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
    for(let j=0;j<S;j++)for(let i=0;i<S;i++){const x=(i+.5-cx)/R,y=(cy-(j+.5))/R,q=x*x+y*y;if(q>1)continue;const z=Math.sqrt(1-q);
      const x1=x*ct+y*st,y1=-x*st+y*ct,y2=y1*cp+z*sp,z2=-y1*sp+z*cp;
      const lat=Math.asin(clamp(y2,-1,1)),lon=Math.atan2(x1,z2);
      idx.push(j*S+i);row.push(Math.min(TH-1,Math.floor((.5-lat/Math.PI)*TH))*TW);col.push((lon/(2*Math.PI)+.5)*TW);nx.push(x);ny.push(y);nz.push(z);}
    this.P={idx:Int32Array.from(idx),row:Int32Array.from(row),col:Float32Array.from(col),nx:Float32Array.from(nx),ny:Float32Array.from(ny),nz:Float32Array.from(nz)};
    if(!this.can||this.can.width!==S){this.can=mk(S,S);this.cx=this.can.getContext('2d');this.img=this.cx.createImageData(S,S);}}
  render(t,L,o={}){const {idx,row,col,nx,ny,nz}=this.P,tp=this.tex.px,d=this.img.data;d.fill(0);
    const off=(-this.speed*t+this.userSpin)*TW,cl=this.clouds?this.clouds.px:null,coff=(-this.speed*this.cloudSpeed*t+this.userSpin)*TW;
    const Lx=L[0],Ly=L[1],Lz=L[2],em=this.emissive,grid=o.grid;
    for(let k=0;k<idx.length;k++){let c=col[k]+off;c=((c%TW)+TW)%TW|0;const ti=(row[k]+c)*4;let r=tp[ti],g=tp[ti+1],b=tp[ti+2];
      if(cl){let c2=col[k]+coff;c2=((c2%TW)+TW)%TW|0;const ci=(row[k]+c2)*4,a=cl[ci+3]/255;r+=(255-r)*a;g+=(255-g)*a;b+=(255-b)*a;}
      if(grid&&(c%64<3||(row[k]/TW)%32<2.5)){r=r*.35+165;g=g*.35+165;b=b*.35+165;}
      let s;if(em)s=.72+.36*nz[k];else{const l=nx[k]*Lx+ny[k]*Ly+nz[k]*Lz;s=.26+.56*smooth(-.1,.14,l)+.2*smooth(.45,.95,l);const rim=1-nz[k];s+=.2*rim*rim*rim*smooth(0,.3,l);}
      const p=idx[k]*4;d[p]=r*s;d[p+1]=g*s;d[p+2]=b*s;d[p+3]=255;}
    this.cx.putImageData(this.img,0,0);return this.can;}
}
const RING_SAT={bands:[[1.28,1.46,'#c9ad76'],[1.48,1.78,'#ecd5a4'],[1.8,1.87,'#7d684a'],[1.89,2.02,'#dcc18c']],edges:[1.28,2.02],spokes:true};
const RING_URA={bands:[[1.5,1.56,'#8fb4c0'],[1.68,1.73,'#b7d4dc'],[1.86,1.95,'#d9eef2']],edges:null};
function drawRing(c,cx,cy,R,tilt,pitch,half,st,t){const b=Math.max(.02,Math.abs(Math.sin(pitch)));const back=half==='back',a0=back?Math.PI:0,a1=back?2*Math.PI:Math.PI;
  c.save();c.translate(cx,cy);c.rotate(-tilt);
  for(const [r0,r1,col] of st.bands){c.fillStyle=col;c.beginPath();c.ellipse(0,0,r1*R,r1*R*b,0,a0,a1,false);c.ellipse(0,0,r0*R,r0*R*b,0,a1,a0,true);c.closePath();c.fill();}
  if(st.spokes){c.fillStyle='rgba(80,58,30,.38)';for(let i=0;i<7;i++){const s=((i/7)*2*Math.PI+t*.35)%(2*Math.PI);if(back?s<=Math.PI:s>=Math.PI)continue;
    const s0=s-.07,s1=s+.07;c.beginPath();c.ellipse(0,0,1.77*R,1.77*R*b,0,s0,s1,false);c.ellipse(0,0,1.5*R,1.5*R*b,0,s1,s0,true);c.closePath();c.fill();}}
  if(st.edges){c.strokeStyle=INK;c.lineWidth=Math.max(1.6,R*.04);for(const r of st.edges){c.beginPath();c.ellipse(0,0,r*R,r*R*b,0,a0,a1);c.stroke();}}
  c.restore();}

// ===================== malha (cristal, lava, asteroide, cometa) =====================
function icosphere(n){const t=(1+Math.sqrt(5))/2;let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>{const l=Math.hypot(...v);return v.map(a=>a/l);});
  let F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let s=0;s<n;s++){const cache={};const mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!==undefined)return cache[k];const m=[(V[a][0]+V[b][0])/2,(V[a][1]+V[b][1])/2,(V[a][2]+V[b][2])/2];const l=Math.hypot(...m);V.push(m.map(x=>x/l));return cache[k]=V.length-1;};
    const F2=[];for(const [a,b,c] of F){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);F2.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}F=F2;}
  return {V,F};}
const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const triN=(V,a,b,c)=>cross3(sub3(V[b],V[a]),sub3(V[c],V[a])),triC=(V,a,b,c)=>[(V[a][0]+V[b][0]+V[c][0])/3,(V[a][1]+V[b][1]+V[c][1])/3,(V[a][2]+V[b][2]+V[c][2])/3];
function dentList(seed,n,amin,amax){const r=rng(seed);return Array.from({length:n},()=>{const a=amin+(amax-amin)*r();return {d:randDir(r),a,k:a/amax};});}
function dents(x,y,z,list,depth){let m=0;for(const c of list){const q=Math.acos(clamp(x*c.d[0]+y*c.d[1]+z*c.d[2],-1,1))/c.a;
  if(q<1)m-=depth*c.k*(1-q*q);else if(q<1.4)m+=depth*c.k*.35*(1-(q-1)/.4);}return m;}
const DB=dentList(63,8,.12,.25);
class MeshBody{
  constructor(V,F,Cs,E){this.V=Float32Array.from(V.flat());this.F=Uint16Array.from(F.flat());this.C=Cs;this.E=E;this.rmax=Math.max(...V.map(v=>Math.hypot(...v)));this.T=new Float32Array(this.V.length);}
  render(c,S,M,L,o){const V=this.V,T=this.T,F=this.F,n=V.length/3,amb=o.amb||.28;
    for(let i=0;i<n;i++){const x=V[i*3],y=V[i*3+1],z=V[i*3+2];T[i*3]=M[0]*x+M[1]*y+M[2]*z;T[i*3+1]=M[3]*x+M[4]*y+M[5]*z;T[i*3+2]=M[6]*x+M[7]*y+M[8]*z;}
    const sc=S/2*.86/this.rmax*(o.scale||1),cx=S/2+(o.dx||0),cy=S/2+(o.dy||0),vis=[],nf=F.length/3;
    for(let f=0;f<nf;f++){const A=F[f*3]*3,B=F[f*3+1]*3,Q=F[f*3+2]*3;const ux=T[B]-T[A],uy=T[B+1]-T[A+1],uz=T[B+2]-T[A+2],wx=T[Q]-T[A],wy=T[Q+1]-T[A+1],wz=T[Q+2]-T[A+2];
      const nz=ux*wy-uy*wx;if(nz<=0)continue;const nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,l=Math.hypot(nx,ny,nz);
      vis.push([T[A+2]+T[B+2]+T[Q+2],f,(nx*L[0]+ny*L[1]+nz*L[2])/l]);}
    vis.sort((p,q)=>p[0]-q[0]);c.lineJoin='round';
    for(const [,f,lam] of vis){const A=F[f*3]*3,B=F[f*3+1]*3,Q=F[f*3+2]*3,col=this.C[f];
      const s=this.E[f]?1:amb+(.78-amb)*smooth(-.05,.3,lam)+.27*smooth(.55,.95,lam);
      const st=`rgb(${col[0]*s|0},${col[1]*s|0},${col[2]*s|0})`;c.fillStyle=st;c.strokeStyle=o.wire?'rgba(255,236,190,.75)':st;c.lineWidth=o.wire?1:.9;
      c.beginPath();c.moveTo(cx+T[A]*sc,cy-T[A+1]*sc);c.lineTo(cx+T[B]*sc,cy-T[B+1]*sc);c.lineTo(cx+T[Q]*sc,cy-T[Q+1]*sc);c.closePath();c.fill();c.stroke();}}
}
// bolota deformada (lava, asteroide, núcleo do cometa)
function blobGeom(shape,color,sub,emis){const g=icosphere(sub);const V=g.V.map(v=>{const r=shape(v[0],v[1],v[2]);return [v[0]*r,v[1]*r,v[2]*r];});
  const F=[],Cs=[],E=[];for(let [a,b,c] of g.F){const m=triC(V,a,b,c);if(dot3(triN(V,a,b,c),m)<0){const s=b;b=c;c=s;}F.push([a,b,c]);
    const l=Math.hypot(...m),d=[m[0]/l,m[1]/l,m[2]/l],e=emis?emis(...d):null;E.push(!!e);Cs.push(e||color(...d));}
  return new MeshBody(V,F,Cs,E);}
// cacho de prismas hexagonais com ponta: o cristal
function crystalGeom(){const V=[],F=[],Cs=[],E=[],add=p=>(V.push(p),V.length-1),root=[0,-.55,0];
  const list=[[0,1,0,1.15,.24],[.6,.75,.25,.85,.2],[-.65,.7,-.1,.9,.19],[.15,.55,-.85,.72,.17],[-.3,.5,.8,.78,.18],[.75,.25,-.45,.55,.15],[-.8,.3,.5,.5,.14]];
  list.forEach(([dx,dy,dz,len,rad],k)=>{const l=Math.hypot(dx,dy,dz),a=[dx/l,dy/l,dz/l];let u=Math.abs(a[1])<.9?[-a[2],0,a[0]]:[0,a[2],-a[1]];const ul=Math.hypot(...u);u=u.map(x=>x/ul);const v=cross3(a,u);
    const P=(h,rr,th)=>[0,1,2].map(i=>root[i]+a[i]*h+(u[i]*Math.cos(th)+v[i]*Math.sin(th))*rr);
    const B=[],T=[];for(let i=0;i<6;i++){const th=i/6*2*Math.PI+k*.5;B.push(add(P(.05,rad*.8,th)));T.push(add(P(len,rad,th)));}
    const tip=add(P(len+rad*1.7,0,0)),bc=add(P(.05,0,0)),inner=P(len*.5,0,0);
    const face=(i0,i1,i2,col)=>{let tri=[i0,i1,i2];if(dot3(triN(V,...tri),sub3(triC(V,...tri),inner))<0)tri=[i0,i2,i1];F.push(tri);Cs.push(col);E.push(false);};
    for(let i=0;i<6;i++){const j=(i+1)%6,side=i%2?C('#5ccbe2'):C('#8ae2f2');face(B[i],B[j],T[j],side);face(B[i],T[j],T[i],side);face(T[i],T[j],tip,C('#d8faff'));face(B[j],B[i],bc,C('#3b9fbd'));}});
  const mn=[0,1,2].map(i=>Math.min(...V.map(p=>p[i]))),mx=[0,1,2].map(i=>Math.max(...V.map(p=>p[i]))),ctr=[0,1,2].map(i=>(mn[i]+mx[i])/2);
  V.forEach(p=>{for(let i=0;i<3;i++)p[i]-=ctr[i];});return new MeshBody(V,F,Cs,E);}
const SH={
  rochinha:(x,y,z)=>.8+.6*(fbm(x*1.6+1,y*1.6,z*1.6,3,61)-.5)+.12*x*x,
  bennu:(x,y,z)=>{const h=Math.sqrt(1-y*y),cone=1/(h/1.08+Math.abs(y)/.8);return .62*cone+.36+.14*(fbm(x*2.6,y*2.6,z*2.6,4,45)-.5)+dents(x,y,z,DB,.04);},
  cometa:(x,y,z)=>.74+.24*(2*x*x-1)+.28*(fbm(x*1.8,y*1.8,z*1.8,4,46)-.5),
  lava:(x,y,z)=>.86+.55*(fbm(x*1.3+4,y*1.3,z*1.3,4,48)-.5),
};
const COL={
  rochinha:(x,y,z)=>mix(C('#6f655e'),C('#ab9c8c'),fbm(x*3,y*3,z*3,2,62)),
  bennu:(x,y,z)=>{let c=mix(C('#56627a'),C('#93a0b8'),fbm(x*3,y*3,z*3,3,55));if(h3(x*25,y*25,z*25,6)>.93)c=mix(c,C('#b8c2d2'),.3);return c;},
  cometa:(x,y,z)=>{const n=fbm(x*2.5,y*2.5,z*2.5,3,56);let c=mix(C('#3f4656'),C('#66708a'),n);if(n>.6)c=mix(c,C('#e8f6ff'),.7);return c;},
  lava:(x,y,z)=>mix(C('#1f181e'),C('#40333b'),fbm(x*4,y*4,z*4,3,49)),
};
const EMIS={lava:(x,y,z)=>{const r=1-Math.abs(2*fbm(x*2.2,y*2.2,z*2.2,4,50)-1);return r>.955?(r>.985?C('#ffd66e'):C('#ff7a1e')):null;}};
// ===== geometria montada com peças simples (caixas, prismas, cones), para os objetos 3D =====
function Geo(){this.V=[];this.F=[];this.C=[];this.E=[];}
Geo.prototype.add=function(p){this.V.push(p);return this.V.length-1;};
Geo.prototype.tri=function(a,b,c,col,inner,em){let t=[a,b,c];if(dot3(triN(this.V,a,b,c),sub3(triC(this.V,a,b,c),inner))<0)t=[a,c,b];this.F.push(t);this.C.push(col);this.E.push(!!em);};
Geo.prototype.quad=function(a,b,c,d,col,inner,em){this.tri(a,b,c,col,inner,em);this.tri(a,c,d,col,inner,em);};
Geo.prototype.box=function(c,h,col,em,R){const P=[];for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){let o=[sx*h[0],sy*h[1],sz*h[2]];
    if(R)o=[R[0]*o[0]+R[1]*o[1]+R[2]*o[2],R[3]*o[0]+R[4]*o[1]+R[5]*o[2],R[6]*o[0]+R[7]*o[1]+R[8]*o[2]];P.push(this.add([c[0]+o[0],c[1]+o[1],c[2]+o[2]]));}
  [[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]].forEach((q,k)=>this.quad(P[q[0]],P[q[1]],P[q[2]],P[q[3]],typeof col==='function'?col(k):col,c,em));};
const basis=a=>{const l=Math.hypot(...a);a=a.map(v=>v/l);let u=Math.abs(a[1])<.9?cross3(a,[0,1,0]):cross3(a,[1,0,0]);const ul=Math.hypot(...u);u=u.map(v=>v/ul);return [a,u,cross3(a,u)];};
Geo.prototype.prism=function(c,axis,r,len,n,colSide,colCap,emCap){const [a,u,v]=basis(axis),ring=h=>Array.from({length:n},(_,i)=>{const th=i/n*2*Math.PI;return this.add([0,1,2].map(j=>c[j]+a[j]*h+(u[j]*Math.cos(th)+v[j]*Math.sin(th))*r));});
  const A=ring(-len/2),B=ring(len/2),ca=this.add(c.map((x,j)=>x-a[j]*len/2)),cb=this.add(c.map((x,j)=>x+a[j]*len/2));
  for(let i=0;i<n;i++){const j=(i+1)%n;this.quad(A[i],A[j],B[j],B[i],typeof colSide==='function'?colSide(i):colSide,c);this.tri(A[j],A[i],ca,colCap,c,emCap);this.tri(B[i],B[j],cb,colCap,c,emCap);}};
Geo.prototype.cone=function(c,axis,r,h,n,col){const [a,u,v]=basis(axis),R=Array.from({length:n},(_,i)=>{const th=i/n*2*Math.PI;return this.add([0,1,2].map(j=>c[j]+(u[j]*Math.cos(th)+v[j]*Math.sin(th))*r));});
  const tip=this.add(c.map((x,j)=>x+a[j]*h)),ctr=this.add(c.slice()),inner=c.map((x,j)=>x+a[j]*h*.3);
  for(let i=0;i<n;i++){const j=(i+1)%n;this.tri(R[i],R[j],tip,col,inner);this.tri(R[j],R[i],ctr,col,inner);}};
Geo.prototype.mesh=function(){return new MeshBody(this.V,this.F,this.C,this.E);};
// bloco: estação espacial
function estacaoGeom(){const g=new Geo(),gr=C('#cfd4db'),wh=C('#e8ebef');
  g.prism([0,0,0],[0,1,0],.26,.6,8,i=>i%2?gr:wh,C('#9aa3ad'));
  g.prism([0,.38,0],[0,1,0],.15,.16,8,C('#f2b33d'),C('#d49a2a'));
  g.prism([0,-.4,0],[0,1,0],.17,.2,8,C('#9aa3ad'),C('#7f8a96'));
  g.box([0,0,0],[.86,.03,.03],C('#8a939e'));
  for(const sx of[-1,1])for(let k=0;k<3;k++)g.box([sx*(.42+k*.16),0,0],[.07,.21,.012],k%2?C('#3a6cc0'):C('#2a56a0'));
  g.box([0,.5,0],[.025,.04,.025],C('#ff5a5a'),true);
  return g.mesh();}
// torrão: satélite quebrado (manta dourada, painel torto, antena)
function lixoGeom(){const g=new Geo();
  g.box([0,0,0],[.24,.2,.22],k=>[C('#d9ab45'),C('#c4932f'),C('#e6bd5c'),C('#b88528'),C('#d9ab45'),C('#c4932f')][k]);
  g.box([.52,.14,0],[.26,.012,.17],C('#2f5fa8'),false,rotAxis(0,0,1,.55));
  g.box([.27,.04,0],[.05,.022,.022],C('#8a8f98'));
  g.box([-.33,-.06,.08],[.09,.02,.02],C('#8a8f98'),false,rotAxis(0,1,0,.8));
  g.prism([-.05,.36,0],[0,1,0],.02,.32,5,C('#5d636c'),C('#5d636c'));
  g.prism([-.05,.55,0],[0,1,0],.1,.03,10,C('#eef0f3'),C('#cfd4db'));
  return g.mesh();}
// carrinho, opção A: nave
function naveGeom(){const g=new Geo();
  g.prism([0,0,0],[1,0,0],.17,.86,10,i=>i%2?C('#ece6da'):C('#d9d1c2'),C('#c9c1b2'));
  g.cone([.43,0,0],[1,0,0],.17,.3,10,C('#ece6da'));
  g.box([.26,.14,0],[.12,.045,.09],C('#6fd6ea'),true);
  g.box([-.08,-.02,0],[.2,.025,.5],C('#f2b33d'));
  g.box([-.34,.2,0],[.11,.13,.02],C('#f2b33d'));
  g.prism([-.49,0,0],[1,0,0],.12,.12,10,C('#5d636c'),C('#ff9a3c'),true);
  return g.mesh();}
// carrinho, opção B: portal (anel com luzes)
function portalGeom(){const g=new Geo(),R0=.78,r0=.15,N=28,Mn=8,idx=[];
  for(let i=0;i<N;i++){const a=i/N*2*Math.PI,ca=Math.cos(a),sa=Math.sin(a);idx.push([]);for(let j=0;j<Mn;j++){const b=j/Mn*2*Math.PI,rr=R0+r0*Math.cos(b);idx[i].push(g.add([rr*ca,rr*sa,r0*Math.sin(b)]));}}
  for(let i=0;i<N;i++){const i2=(i+1)%N,am=(i+.5)/N*2*Math.PI,ctr=[R0*Math.cos(am),R0*Math.sin(am),0];
    for(let j=0;j<Mn;j++){const j2=(j+1)%Mn,lit=i%4===0&&(j===0||j===Mn-1);g.quad(idx[i][j],idx[i2][j],idx[i2][j2],idx[i][j2],lit?C('#8ff0ff'):(j%2?C('#aeb6c0'):C('#d3d8df')),ctr,lit);}}
  return g.mesh();}
// pilar de poeira (fundo do mundo das Nebulosas): uma bolota alta e afinando para cima
function pilarGeom(sd){const g=icosphere(2);const V=g.V.map(v=>{const rr=.8+.55*(fbm(v[0]*1.6+sd,v[1]*1.6,v[2]*1.6,4,70+sd)-.5),tp=1-.45*Math.max(0,v[1]);return [v[0]*rr*.62*tp,v[1]*rr*1.9,v[2]*rr*.62*tp];});
  const F=[],Cs=[],E=[];for(let [a,b,c] of g.F){const m=triC(V,a,b,c);if(dot3(triN(V,a,b,c),m)<0){const s=b;b=c;c=s;}F.push([a,b,c]);
    const l=Math.hypot(...m),d=[m[0]/l,m[1]/l,m[2]/l];Cs.push(mix(C('#1c120f'),C('#5a3a28'),clamp(fbm(d[0]*3+sd,d[1]*3,d[2]*3,3,80+sd)*.8+(d[1]>.55?.3:0),0,1)));E.push(false);}
  return new MeshBody(V,F,Cs,E);}
const GEOMS={cristal:crystalGeom,estacao:estacaoGeom,lixo:lixoGeom,nave:naveGeom,portal:portalGeom,pilar0:()=>pilarGeom(0),pilar1:()=>pilarGeom(3),pilar2:()=>pilarGeom(7)};
const meshCache={};
function meshFor(key,sub){const k=key+sub;return meshCache[k]||(meshCache[k]=GEOMS[key]?GEOMS[key]():blobGeom(SH[key],COL[key],sub,EMIS[key]));}
const silCache={};
function outlineInto(dst,src,S,w,color){let sil=silCache[S];if(!sil)sil=silCache[S]=mk(S,S);const sc=sil.getContext('2d');
  sc.globalCompositeOperation='source-over';sc.clearRect(0,0,S,S);sc.drawImage(src,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle=color;sc.fillRect(0,0,S,S);sc.globalCompositeOperation='source-over';
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;dst.drawImage(sil,Math.cos(a)*w,Math.sin(a)*w);}dst.drawImage(src,0,0);}

// ===================== carinha (parada na frente, a superfície gira atrás) =====================
function drawFace(c,cx,cy,R,t,seed){const blink=((t+seed*1.73)%4.4)<.13,ex=R*.27,ey=cy-R*.02,er=R*.075;
  c.save();c.lineCap='round';c.lineWidth=Math.max(1.4,R*.05);c.strokeStyle=INK;
  c.fillStyle='rgba(255,138,122,.55)';for(const s of [-1,1]){c.beginPath();c.ellipse(cx+s*R*.47,cy+R*.2,R*.11,R*.065,0,0,7);c.fill();}
  for(const s of [-1,1]){const x=cx+s*ex;if(blink){c.beginPath();c.moveTo(x-er,ey);c.quadraticCurveTo(x,ey+er*.9,x+er,ey);c.stroke();}
    else{c.fillStyle=INK;c.beginPath();c.ellipse(x,ey,er,er*1.3,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+er*.35,ey-er*.45,er*.38,0,7);c.fill();}}
  c.beginPath();c.moveTo(cx-R*.13,cy+R*.2);c.quadraticCurveTo(cx,cy+R*.36,cx+R*.13,cy+R*.2);c.stroke();c.restore();}

// ===================== a escada =====================
// regra: cada degrau com cor e silhueta próprias, para bater o olho no tabuleiro e saber o nível.
// k = tamanho na casa: só cresce ao longo da escada (as cinco primeiras são miúdas e ganham um brilho no jogo)
const tumble=(w,s=0)=>t=>mmul(rotAxis(.3,1,.1,w*t+s),rotAxis(1,.2,0,w*.37*t+s*2));
const spinY=(per,tilt=.45)=>t=>mmul(rotAxis(1,0,.3,tilt),rotAxis(0,1,0,2*Math.PI*t/per));
function sparkles(o,S,t){for(let i=0;i<3;i++){const a=Math.max(0,Math.sin(t*2.3+i*2.1));if(a<.05)continue;const x=S*[.28,.7,.56][i],y=S*[.3,.36,.74][i],r=S*.065*a;
  o.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;o.beginPath();o.moveTo(x,y-r);o.quadraticCurveTo(x,y,x+r,y);o.quadraticCurveTo(x,y,x,y+r);o.quadraticCurveTo(x,y,x-r,y);o.quadraticCurveTo(x,y,x,y-r);o.fill();}}
function lavaGlow(o,S,t){const c=S/2,g=o.createRadialGradient(c,c,S*.18,c,c,S*.5);g.addColorStop(0,`rgba(255,120,30,${(.4+.14*Math.sin(t*2.2)).toFixed(2)})`);g.addColorStop(1,'rgba(255,90,20,0)');o.fillStyle=g;o.fillRect(0,0,S,S);}
const LADDER=[
  {n:'Poeira',src:'gerada',kind:'dust',k:.53},
  {n:'Gelo',src:'gerado',kind:'shards',k:.57},
  {n:'Rocha',src:'gerada',kind:'mesh',geom:'lava',sub:3,scale:.8,k:.49,rot:tumble(.7,6),pre:lavaGlow,cambalhota:true},
  {n:'Asteroide',src:'NASA · Bennu',kind:'mesh',geom:'bennu',sub:2,scale:.92,k:.46,rot:spinY(6),cambalhota:true},
  {n:'Cometa',src:'ESA · 67P',kind:'comet',geom:'cometa',sub:2,k:.63,rot:tumble(.6,5)},
  {n:'Plutão',src:'NASA',kind:'sphere',tex:'pluto',k:.44,sp:{rScale:.9,speed:.05,tilt:.3,pitch:.2}},
  {n:'Lua',src:'NASA',kind:'sphere',tex:'lua',k:.48,sp:{rScale:.9,speed:.05,tilt:.1,pitch:.12}},
  {n:'Mercúrio',src:'Solar System Scope',kind:'sphere',tex:'mercurio',atmo:[255,96,64],k:.59,sp:{rScale:.8,speed:.05,tilt:.05,pitch:.1}},
  {n:'Marte',src:'NASA',kind:'sphere',tex:'marte',k:.58,sp:{rScale:.9,speed:.06,tilt:.4,pitch:.25}},
  {n:'Vênus',src:'NASA',kind:'sphere',tex:'venus',atmo:[255,214,140],k:.78,sp:{rScale:.8,speed:.04,tilt:.05,pitch:.1}},
  {n:'Terra',src:'NASA',kind:'sphere',tex:'terra',clouds:'nuvens',atmo:[120,190,255],k:.84,sp:{rScale:.8,speed:.05,tilt:.41,pitch:.22}},
  {n:'Netuno',src:'NASA',kind:'sphere',tex:'netuno',atmo:[110,150,255],k:.95,sp:{rScale:.8,speed:.08,tilt:.5,pitch:.2}},
  {n:'Urano',src:'Solar System Scope',kind:'sphere',tex:'urano',ring:RING_URA,atmo:[170,240,240],k:1.66,sp:{rScale:.48,speed:.07,tilt:1.5,pitch:.28}},
  {n:'Saturno',src:'NASA',kind:'sphere',tex:'saturno',ring:RING_SAT,k:1.85,sp:{rScale:.46,speed:.08,tilt:.38,pitch:.42}},
  {n:'Júpiter',src:'NASA',kind:'sphere',tex:'jupiter',k:1.17,sp:{rScale:.9,speed:.09,tilt:.05,pitch:.1}},
  {n:'Sol',src:'gerado',kind:'sphere',tex:'estrela',glow:true,outline:'#c47f12',k:1.85,sp:{rScale:.58,speed:.03,tilt:0,pitch:.1,emissive:true}},
  {n:'Supernova',src:'NASA · Cas A',kind:'supernova',k:1.45},
  {n:'Galáxia',src:'gerada',kind:'galaxy',k:1.6},
];
LADDER.forEach((d,i)=>d.seed=i+1);
const byName=n=>LADDER.find(d=>d.n===n);

function makePiece(def,S,vr){
  const out=mk(S,S),o=out.getContext('2d'),P={def,S,out,userRot:null,userSpin:0};const k=def.kind;
  if(k==='sphere'){
    const sp={...def.sp};if(vr){sp.tilt=(sp.tilt||0)+vr.roll;sp.pitch=clamp((sp.pitch||0)+vr.pitch,-.85,.85);if(def.ring&&Math.abs(sp.pitch)<.24)sp.pitch=sp.pitch<0?-.24:.24;sp.speed=(sp.speed||.05)*vr.vel;P.userSpin=vr.fase;}
    const body=new SphereBody(TEX[def.tex],{...sp,clouds:def.clouds?TEX[def.clouds]:null});body.prep(S);P.body=body;
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const R=body.R,c=S/2;
      if(def.glow)starGlow(o,c,R,t,S);
      if(def.atmo){const a=def.atmo.join(','),g=o.createRadialGradient(c,c,R*.92,c,c,R*1.25);g.addColorStop(0,`rgba(${a},.55)`);g.addColorStop(1,`rgba(${a},0)`);o.fillStyle=g;o.beginPath();o.arc(c,c,R*1.25,0,7);o.fill();}
      if(def.ring)drawRing(o,c,c,R,body.tilt,body.pitch,'back',def.ring,t);
      body.userSpin=P.userSpin;o.drawImage(body.render(t,L,op),0,0);
      if(op.outline!==false){o.strokeStyle=def.outline||INK;o.lineWidth=Math.max(2,S*.024);o.beginPath();o.arc(c,c,R,0,7);o.stroke();}
      if(def.ring)drawRing(o,c,c,R,body.tilt,body.pitch,'front',def.ring,t);
      if(op.face)drawFace(o,c,c,R,t,def.seed);return out;};
  }else if(k==='mesh'){
    const body=meshFor(def.geom,def.sub),bc=mk(S,S),bx=bc.getContext('2d');P.body=body;
    P.draw=(t,L,op={})=>{bx.clearRect(0,0,S,S);const tt=vr?t*vr.vel+vr.dt:t;let M=op.M||(vr?mmul(vr.R0,def.cambalhota&&vr.a1?mmul(rotAxis(...vr.a1,vr.w1*tt),rotAxis(...vr.a2,vr.w2*tt)):def.rot(tt)):def.rot(t));if(P.userRot)M=mmul(P.userRot,M);
      body.render(bx,S,M,L,{scale:def.scale||1,wire:op.wire,amb:def.amb});o.clearRect(0,0,S,S);if(def.pre)def.pre(o,S,t);
      if(op.outline!==false)outlineInto(o,bc,S,Math.max(1.6,S*.018),INK);else o.drawImage(bc,0,0);
      if(def.post)def.post(o,S,t);
      if(op.face)drawFace(o,S/2,S/2+(def.geom==='cristal'?S*.08:0),S/2*.86*(def.scale||1)*.8,t,def.seed);return out;};
  }else if(k==='comet'){
    // cometa compacto (escolhido no rascunho angulos.html, 2026-11-09): núcleo girando num eixo próprio, uma cabeleira
    // de luz em volta e jatos curtos de gás saindo dele; sem a faixa de luz comprida, cabe todo na casa
    const body=meshFor(def.geom,def.sub),bc=mk(S,S),bx=bc.getContext('2d'),r=rng(9);
    const jatos=Array.from({length:40},()=>({ph:r(),sp:.18+.14*r(),lado:r()-.5,sz:.6+r()}));
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,ang=Math.atan2(L[1],L[0]),comp=S*.46;
      o.globalCompositeOperation='lighter';
      for(const p of jatos){const u=(t*p.sp*1.6+p.ph)%1,ja=ang+p.lado*1.6,x=c+Math.cos(ja)*u*comp,y=c+Math.sin(ja)*u*comp;
        o.fillStyle=`rgba(210,240,255,${((1-u)*.7).toFixed(3)})`;o.beginPath();o.arc(x,y,Math.max(.5,(1+u)*p.sz*S/107),0,7);o.fill();}
      const cr=S*.5,g=o.createRadialGradient(c,c,0,c,c,cr);g.addColorStop(0,'rgba(215,245,255,.55)');g.addColorStop(.45,'rgba(150,215,255,.18)');g.addColorStop(1,'rgba(150,215,255,0)');
      o.fillStyle=g;o.beginPath();o.arc(c,c,cr,0,7);o.fill();o.globalCompositeOperation='source-over';
      bx.clearRect(0,0,S,S);let M=op.M||(vr?mmul(vr.R0,def.rot(t*vr.vel+vr.dt)):def.rot(t));if(P.userRot)M=mmul(P.userRot,M);body.render(bx,S,M,L,{scale:.6,wire:op.wire});
      if(op.outline!==false)outlineInto(o,bc,S,Math.max(1.4,S*.016),INK);else o.drawImage(bc,0,0);return out;};
  }else if(k==='shards'){
    // nuvem de cristais pontudos girando, como a poeira
    const r=rng(21),BV=[[0,1.7,0],[0,-1.7,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]],BF=[[0,2,3],[0,3,4],[0,4,5],[0,5,2],[1,3,2],[1,4,3],[1,5,4],[1,2,5]].map(f=>{const [A,B,Q]=f.map(i=>BV[i]),n=cross3(sub3(B,A),sub3(Q,A)),m=[A[0]+B[0]+Q[0],A[1]+B[1]+Q[1],A[2]+B[2]+Q[2]];return dot3(n,m)<0?[f[0],f[2],f[1]]:f;});
    const sh=Array.from({length:26},()=>({r:.12+.74*Math.sqrt(r()),th:r()*7,w:(.5+r())*.8,s:.035+.06*r()*r(),ax:randDir(r),sp:.8+2*r(),ph:r()*7,col:r()<.5?C('#6fd3ea'):C('#b6f0fb'),dir:randDir(r)}));
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,g=o.createRadialGradient(c,c,0,c,c,S*.45);g.addColorStop(0,'rgba(140,225,250,.2)');g.addColorStop(1,'rgba(140,225,250,0)');o.fillStyle=g;o.fillRect(0,0,S,S);
      const ax=vr&&vr.eixo?vr.eixo:[.3,1,.2],Rn=rotAxis(...ax,t*.55*(vr?vr.vel:1)+(vr?vr.fase*6.283:0)),gira=d=>[Rn[0]*d[0]+Rn[1]*d[1]+Rn[2]*d[2],Rn[3]*d[0]+Rn[4]*d[1]+Rn[5]*d[2],Rn[6]*d[0]+Rn[7]*d[1]+Rn[8]*d[2]];
      const items=sh.map(p=>{const v=gira(p.dir);return {p,x:v[0]*p.r,y:-v[1]*p.r,z:v[2]*p.r};}).sort((a,b)=>a.z-b.z);
      o.lineJoin='round';
      for(const q of items){const p=q.p,M=rotAxis(...p.ax,t*p.sp+p.ph),sz=p.s*S*(1+.25*q.z),X0=c+q.x*S*.45,Y0=c+q.y*S*.45;
        const T=BV.map(v=>{const X=v[0]*.55,Y=v[1],Z=v[2]*.55;return [M[0]*X+M[1]*Y+M[2]*Z,M[3]*X+M[4]*Y+M[5]*Z,M[6]*X+M[7]*Y+M[8]*Z];});
        const fs=[];for(const f of BF){const [A,B,Q]=f.map(i=>T[i]),n=cross3(sub3(B,A),sub3(Q,A));if(n[2]<=0)continue;fs.push([A[2]+B[2]+Q[2],f,(n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/Math.hypot(...n)]);}
        fs.sort((a,b)=>a[0]-b[0]);
        for(const [,f,lam] of fs){const s=.45+.45*smooth(-.1,.4,lam)+.25*smooth(.6,.95,lam),col=p.col;o.fillStyle=`rgb(${col[0]*s|0},${col[1]*s|0},${col[2]*s|0})`;
          o.beginPath();f.forEach((i,j)=>{const v=T[i],X=X0+v[0]*sz,Y=Y0-v[1]*sz;j?o.lineTo(X,Y):o.moveTo(X,Y);});o.closePath();o.fill();
          if(op.outline!==false){o.strokeStyle=INK;o.lineWidth=Math.max(.7,S*.006);o.stroke();}}}
      sparkles(o,S,t);return out;};
  }else if(k==='dust'){
    const r=rng(5),gr=Array.from({length:80},()=>({r:.12+.72*Math.sqrt(r()),th:r()*7,w:(.5+r())*.9,s:.012+.035*r()*r(),c:r()<.5?'#d9c49a':'#b39773',dir:randDir(r)}));
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,g=o.createRadialGradient(c,c,0,c,c,S*.45);g.addColorStop(0,'rgba(230,210,170,.22)');g.addColorStop(1,'rgba(230,210,170,0)');o.fillStyle=g;o.fillRect(0,0,S,S);
      const ax=vr&&vr.eixo?vr.eixo:[.3,1,.2],Rn=rotAxis(...ax,t*.55*(vr?vr.vel:1)+(vr?vr.fase*6.283:0)),gira=d=>[Rn[0]*d[0]+Rn[1]*d[1]+Rn[2]*d[2],Rn[3]*d[0]+Rn[4]*d[1]+Rn[5]*d[2],Rn[6]*d[0]+Rn[7]*d[1]+Rn[8]*d[2]];
      const sorted=gr.map(p=>{const v=gira(p.dir);return {p,x:v[0]*p.r,y:-v[1]*p.r,z:v[2]*p.r};}).sort((a,b)=>a.z-b.z);
      for(const q of sorted){const s=q.p.s*S*(1+.3*q.z);o.globalAlpha=.65+.35*q.z;o.fillStyle=q.p.c;o.beginPath();o.arc(c+q.x*S*.45,c+q.y*S*.45,s,0,7);o.fill();
        if(op.outline!==false&&s>S*.022){o.strokeStyle=INK;o.lineWidth=1.2;o.stroke();}}o.globalAlpha=1;return out;};
  }else if(k==='supernova'){
    const r=rng(77),cols=['94,196,214','240,168,48','224,106,154','255,240,220','170,130,255'];
    const parts=Array.from({length:620},()=>{const d=randDir(r);return {d,rad:.55+.45*Math.sqrt(r()),len:.05+.1*r(),c:`rgba(${cols[(r()*cols.length)|0]},${(.35+.4*r()).toFixed(2)})`};});
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,g=o.createRadialGradient(c,c,0,c,c,S/2);g.addColorStop(0,'rgba(120,80,160,.35)');g.addColorStop(.7,'rgba(60,40,90,.15)');g.addColorStop(1,'rgba(60,40,90,0)');o.fillStyle=g;o.fillRect(0,0,S,S);
      const M=mmul(rotAxis(1,0,0,.5),rotAxis(0,1,0,t*.12)),pulse=1+.03*Math.sin(t*1.3),sc=S/2*.82*pulse;
      o.globalCompositeOperation='lighter';o.lineCap='round';o.lineWidth=Math.max(1,S*.012);
      for(const p of parts){const x=M[0]*p.d[0]+M[1]*p.d[1]+M[2]*p.d[2],y=M[3]*p.d[0]+M[4]*p.d[1]+M[5]*p.d[2],r0=p.rad*sc,r1=r0*(1+p.len);
        o.strokeStyle=p.c;o.beginPath();o.moveTo(c+x*r0,c-y*r0);o.lineTo(c+x*r1,c-y*r1);o.stroke();}
      const ng=o.createRadialGradient(c,c,0,c,c,S*.08);ng.addColorStop(0,'rgba(255,255,255,1)');ng.addColorStop(1,'rgba(160,220,255,0)');o.fillStyle=ng;o.beginPath();o.arc(c,c,S*.08,0,7);o.fill();
      o.globalCompositeOperation='source-over';return out;};
  }else if(k==='galaxy'){
    const r=rng(99),parts=Array.from({length:1100},(_,i)=>{const arm=i%2;let rr=Math.pow(r(),.55);const th=arm*Math.PI+rr*5.2+(r()-.5)*(.9*(1-rr)+.35);rr*=1+(r()-.5)*.12;
      let col;if(rr<.18)col='255,240,200';else if(r()<.08)col='255,140,190';else col=r()<.5?'150,170,255':'185,150,255';
      return {rr,th,y:(r()-.5)*.08*(1-rr*.7),s:.7+(r()<.1?1.4:r()*.8),c:`rgba(${col},${(.45+.45*r()).toFixed(2)})`};});
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,g=o.createRadialGradient(c,c,0,c,c,S*.3);g.addColorStop(0,'rgba(255,236,190,.9)');g.addColorStop(.35,'rgba(255,200,150,.25)');g.addColorStop(1,'rgba(255,200,150,0)');
      o.globalCompositeOperation='lighter';o.fillStyle=g;o.fillRect(0,0,S,S);const ang=t*.18,cr=Math.cos(-.45),sr=Math.sin(-.45),sc=S/2*.92,k=S/128;
      for(const p of parts){const X=p.rr*Math.cos(p.th+ang),Z=p.rr*Math.sin(p.th+ang)*.45+p.y,x=X*cr-Z*sr,y=X*sr+Z*cr,s=p.s*k;o.fillStyle=p.c;o.fillRect(c+x*sc-s/2,c+y*sc-s/2,s,s);}
      o.globalCompositeOperation='source-over';return out;};
  }
  if(vr&&k!=='sphere'&&k!=='mesh'){const d=P.draw;P.draw=(t,L,op)=>d(t+vr.dt,L,op);}
  return P;
}
function starGlow(o,c,R,t,S){const p=.94+.06*Math.sin(t*1.7),g=o.createRadialGradient(c,c,R*.8,c,c,S/2*p);
  g.addColorStop(0,'rgba(255,214,90,.75)');g.addColorStop(.45,'rgba(255,170,40,.25)');g.addColorStop(1,'rgba(255,150,30,0)');o.fillStyle=g;o.beginPath();o.arc(c,c,S/2,0,7);o.fill();}
// ===================== laço de animação (só desenha o que está na tela) =====================
const views=[];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.target._v)e.target._v.vis=e.isIntersecting;}),{rootMargin:'100px'});
function view(el,draw){const v={el,vis:true,draw};el._v=v;views.push(v);io.observe(el);return v;}
function paint(ctx,cv,src){ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(src,0,0,cv.width,cv.height);}


// ===================== tabuleiro no espaço: fundo e elementos =====================
// cada mundo tem cor e paisagem próprias
const MUNDOS_ESP=[
  {n:'Entrada',tipo:'gigante',neb:['107,79,216','208,106,214'],pl:'#3b2f7a'},
  {n:'Blocos',tipo:'cinturao',neb:['47,123,216','70,200,224'],pl:'#1f3f6e'},
  {n:'Muretas',tipo:'veu',neb:['38,179,138','63,208,192'],pl:'#17584a'},
  {n:'Terra',tipo:'pilares',neb:['194,122,58','224,176,96'],pl:'#5a3420'},
  {n:'Carrinho',tipo:'nascer',neb:['224,96,58','240,168,48'],pl:'#6a2a1a'},
  {n:'Cores',tipo:'aurora',neb:['154,90,216','90,200,106'],pl:'#30305a'},
  {n:'Picareta',tipo:'buraco',neb:['216,64,79','255,138,90'],pl:'#5a1a2a'},
  {n:'Passinho',tipo:'galaxia',neb:['224,106,154','138,122,255'],pl:'#4a2050'}];
const PAISAGEM={gigante:'planeta gigante no canto',cinturao:'cinturão de asteroides e uma lua',veu:'véu de nebulosa e um planeta com anéis',pilares:'pilares de poeira com estrelas nascendo',
  nascer:'sol nascendo atrás de um planeta',aurora:'aurora roxa e verde',buraco:'buraco negro ao longe',galaxia:'galáxia girando e estrelas cadentes'};
const BN_P=Array.from({length:240},(_,i)=>{const r=rng(500+i);return {rr:1.5+1.6*Math.pow(r(),1.4),a:r()*6.283,h:(r()-.5)*.08,s:.6+r()*.9};});
function bnDraw(c,x,y,R,t,col,tilt=-.3){c.save();c.translate(x,y);
  const g=c.createRadialGradient(0,0,R,0,0,R*3.4);g.addColorStop(0,`rgba(${col},.4)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(0,0,R*3.4,0,7);c.fill();
  c.rotate(tilt);const inc=.3,ci=Math.cos(inc),si=Math.sin(inc);
  const pts=BN_P.map(p=>{const a=p.a+t*1.6/Math.pow(p.rr,1.5),X=Math.cos(a)*p.rr*R,Z=Math.sin(a)*p.rr*R,Y=p.h*R;return {x:X,y:-(Y*ci-Z*si),z:Y*si+Z*ci,b:.55+.45*Math.cos(a),s:p.s};});
  const pinta=l=>{c.globalCompositeOperation='lighter';for(const p of l){const s=R*.1*p.s;c.fillStyle=`rgba(${col},${(.35+.55*p.b).toFixed(2)})`;c.fillRect(p.x-s/2,p.y-s/2,s,s);}c.globalCompositeOperation='source-over';};
  pinta(pts.filter(p=>p.z<0));
  c.strokeStyle=`rgba(${col},.5)`;c.lineWidth=R*.16;c.beginPath();c.ellipse(0,0,R*1.45,R*1.22,0,Math.PI*1.06,Math.PI*1.94);c.stroke();
  c.fillStyle='#000';c.beginPath();c.arc(0,0,R,0,7);c.fill();c.strokeStyle='rgba(255,236,210,.95)';c.lineWidth=R*.08;c.beginPath();c.arc(0,0,R*1.04,0,7);c.stroke();
  pinta(pts.filter(p=>p.z>=0));c.restore();}
function rockPoly(c,x,y,s,rot,k){c.beginPath();for(let i=0;i<6;i++){const a=rot+i/6*2*Math.PI,f=.7+.3*k[i%k.length];c.lineTo(x+Math.cos(a)*s*f,y+Math.sin(a)*s*f);}c.closePath();}
function buildFundo(w,h,m,o={}){const D=DPR,g=mk(w,h),c=g.getContext('2d'),r=rng(o.seed||7),big=Math.max(w,h),marco=o.planeta!==false,J=!!o.jogo;
  const sn=!!o.semNebulosa;   // semNebulosa: só estrelas, planeta e animação, em fundo transparente (a nebulosa vem da placa de vídeo)
  const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b0a18');bg.addColorStop(1,'#141026');if(!sn){c.fillStyle=bg;c.fillRect(0,0,w,h);}
  const blob=(x,y,rad,col,a)=>{if(sn)return;const gr=c.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);c.fillStyle=gr;c.fillRect(x-rad,y-rad,rad*2,rad*2);};
  c.globalCompositeOperation='lighter';
  if(m.tipo==='veu'){for(let i=0;i<14;i++)blob(w*r(),h*r(),big*(.1+.2*r()),m.neb[i%2],(.03+.05*r()).toFixed(3));
    c.lineCap='round';for(let i=0;i<80;i++){const x0=w*(r()*1.2-.1),y0=h*(r()*1.2-.1),ang=-.6+r()*.5,L=big*(.3+.5*r()),q=()=>(r()-.5)*big*.2;
      c.strokeStyle=`rgba(${m.neb[i%2]},${(.04+.09*r()).toFixed(3)})`;c.lineWidth=(1.5+9*r()*r())*D;c.beginPath();c.moveTo(x0,y0);
      c.bezierCurveTo(x0+Math.cos(ang)*L*.33+q(),y0+Math.sin(ang)*L*.33+q(),x0+Math.cos(ang)*L*.66+q(),y0+Math.sin(ang)*L*.66+q(),x0+Math.cos(ang)*L,y0+Math.sin(ang)*L);if(!sn)c.stroke();}}
  else for(let i=0;i<34;i++){const t=r();blob(w*t+(r()-.5)*w*.35,h*(.15+.7*t)+(r()-.5)*h*.3,big*(.1+.22*r()),m.neb[i%2],(.05+.1*r()).toFixed(3));}
  c.globalCompositeOperation='source-over';
  for(let i=0;i<12;i++){const x=w*r(),y=h*r(),rad=big*(.06+.12*r()),gr=c.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(6,4,14,.4)');gr.addColorStop(1,'rgba(6,4,14,0)');if(!sn){c.fillStyle=gr;c.fillRect(x-rad,y-rad,rad*2,rad*2);}}
  const nst=Math.round(w*h/(D*D)/450),cols=['255,255,255','190,215,255','255,236,200'];
  for(let i=0;i<nst;i++){const x=w*r(),y=h*r(),sz=(.4+1.3*r()*r())*D;c.fillStyle=`rgba(${cols[(r()*3)|0]},${(.25+.65*r()).toFixed(2)})`;c.fillRect(x,y,sz,sz);}
  // estrela mais forte: um ponto de luz redondo e suave (a cruz parecia mira)
  const glint=(x,y,l,a=.7)=>{const R=l*.55,g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.3,`rgba(225,236,255,${(a*.3).toFixed(2)})`);g.addColorStop(1,'rgba(225,236,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,R,0,7);c.fill();};
  for(let i=0;i<Math.max(2,nst/40);i++)glint(w*r(),h*r(),(4+6*r())*D);
  let anim=null;
  if(marco){const T=m.tipo;
    // astro 3D desenhado uma vez no fundo (sem contorno e um pouco apagado, para ficar atrás do tabuleiro)
    const L3=[-.55,.5,.67],astro=(nome,x,y,diam,a=.92)=>{const S0=Math.max(32,Math.min(720,Math.round(diam))),img=makePiece(byName(nome),S0).draw(3.7,L3,{outline:false});
      c.globalAlpha=a;c.drawImage(img,x-diam/2,y-diam/2,diam,diam);c.globalAlpha=1;};
    if(T==='gigante'){astro('Júpiter',w*1.04,h*1.08,Math.min(w,h)*1.05,.9);}
    else if(T==='cinturao'){const ax=-.1*w,ay=(J?1.02:.9)*h,bx=1.1*w,by=(J?.6:.1)*h,nl=Math.hypot(by-ay,bx-ax),nx=-(by-ay)/nl,ny=(bx-ax)/nl,TAM=[8,12,18,26].map(v=>Math.round(v*D));
      for(let i=0;i<220;i++){const s=r(),off=(r()-.5)*(r()+r())*big*.12,sz=(.6+1.4*r())*D;c.fillStyle=`rgba(170,160,150,${(.25+.4*r()).toFixed(2)})`;c.fillRect(ax+(bx-ax)*s+nx*off,ay+(by-ay)*s+ny*off,sz,sz);}
      for(let i=0;i<46;i++){const s=r(),off=(r()-.5)*(r()+r())*big*.1,sz=TAM[(r()*r()*4)|0],M=mmul(rotAxis(r()-.5,r()-.5,r()-.5,r()*6),rotAxis(0,1,0,r()*6));
        c.globalAlpha=.9;c.drawImage(objImg('rochinha',sz,0,M),ax+(bx-ax)*s+nx*off-sz/2,ay+(by-ay)*s+ny*off-sz/2);c.globalAlpha=1;}
      astro('Lua',w*.84,h*(J?.7:.12),big*.16);
      const rocks=Array.from({length:10},()=>({s:r(),off:(r()-.5)*big*.12,sz:TAM[2+((r()*2)|0)],sp:.006+.01*r(),ax:[r()-.5,r()-.5,r()-.5],w:.4+r()*.8,f:r()*6}));
      anim=(cx,t)=>{for(const k of rocks){const s=(k.s+t*k.sp)%1,x=ax+(bx-ax)*s+nx*k.off,y=ay+(by-ay)*s+ny*k.off;cx.drawImage(quadroObj('cint'+(k.sz%3),'rochinha',k.sz,k.f+t*k.w,32,TAU,rotRocha(k.sz%3)),x-k.sz/2,y-k.sz/2);}};}
    else if(T==='veu'){astro('Saturno',-w*.02,h*(J?.97:.07),big*(J?.6:.7),.9);}
    else if(T==='pilares'){const gl=c.createRadialGradient(w*.5,h*(J?.85:.6),0,w*.5,h*(J?.85:.6),big*.45);gl.addColorStop(0,`rgba(${m.neb[1]},.35)`);gl.addColorStop(1,`rgba(${m.neb[1]},0)`);c.fillStyle=gl;c.fillRect(0,0,w,h);
      for(const [xc,hh,k] of (J?[[.14,.26,0],[.5,.34,1],[.86,.22,2]]:[[.16,.38,0],[.5,.52,1],[.86,.34,2]])){const S0=Math.round(h*hh);
        c.drawImage(objImg('pilar'+k,S0,0,rotAxis(0,1,0,k*1.7+.4)),w*xc-S0/2,h-S0*.85);
        for(let i=0;i<2;i++){const sx=w*xc+(r()-.5)*S0*.14,sy=h-S0*.8+r()*S0*.12,sg=c.createRadialGradient(sx,sy,0,sx,sy,8*D);sg.addColorStop(0,'rgba(255,250,235,.95)');sg.addColorStop(1,'rgba(255,220,170,0)');
          c.fillStyle=sg;c.beginPath();c.arc(sx,sy,8*D,0,7);c.fill();glint(sx,sy,9*D,.8);}}}
    else if(T==='nascer'){const d=w*1.5,pcx=w*.5,pcy=h+d*.3,Rb=d*.9/2,sx=w*.24,sy=pcy-Math.sqrt(Math.max(0,Rb*Rb-(sx-pcx)**2));
      const sg=c.createRadialGradient(sx,sy,0,sx,sy,big*.42);sg.addColorStop(0,'rgba(255,236,190,.85)');sg.addColorStop(.15,'rgba(255,190,110,.45)');sg.addColorStop(1,'rgba(255,140,60,0)');c.fillStyle=sg;c.fillRect(0,0,w,h);
      c.fillStyle='rgba(255,250,235,.95)';c.beginPath();c.arc(sx,sy,7*D,0,7);c.fill();
      astro('Marte',pcx,pcy,d,1);
      c.strokeStyle=`rgba(${m.neb[1]},.75)`;c.lineWidth=4*D;c.beginPath();c.arc(pcx,pcy,Rb,Math.PI*1.15,Math.PI*1.85);c.stroke();
      anim=(cx,t)=>{const p=.8+.2*Math.sin(t*1.3);cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle=`rgba(255,230,190,${(.25*p).toFixed(2)})`;cx.beginPath();cx.ellipse(sx,sy,big*.32*p,2.2*D,0,0,7);cx.fill();
        for(const [k,rr,a] of [[.35,10,.12],[.6,6,.16],[.85,16,.08]]){const fx=sx+(w*.6-sx)*k,fy=sy+(h*.35-sy)*k;cx.fillStyle=`rgba(${m.neb[0]},${(a*p).toFixed(2)})`;cx.beginPath();cx.arc(fx,fy,rr*D,0,7);cx.fill();}cx.restore();};}
    else if(T==='aurora'){anim=(cx,t)=>{cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const col=m.neb[k%2],base=h*((J?.58:.18)+(J?.11:.2)*k),A=h*.05,hg=h*.22,pts=[];
      cx.beginPath();for(let i=0;i<=40;i++){const x=w*i/40,y=base+A*Math.sin(i*.35+t*.5+k*2)+A*.6*Math.sin(i*.12-t*.3+k);pts.push([x,y]);i?cx.lineTo(x,y):cx.moveTo(x,y);}
      for(let i=40;i>=0;i--)cx.lineTo(pts[i][0],pts[i][1]+hg);cx.closePath();const gr=cx.createLinearGradient(0,base-A,0,base+hg);gr.addColorStop(0,`rgba(${col},.32)`);gr.addColorStop(1,`rgba(${col},0)`);cx.fillStyle=gr;cx.fill();}cx.restore();};}
    else if(T==='buraco'){const bx=w*.8,by=h*(J?.82:.2),R=big*.035;anim=(cx,t)=>bnDraw(cx,bx,by,R,t,m.neb[1],-.25);}
    else if(T==='galaxia'){const gx=w*.3,gy=h*(J?.8:.2),gs=big*(J?.2:.24),pr=rng(31),gp=Array.from({length:700},(_,i)=>{const arm=i%2,rr=Math.pow(pr(),.55),th=arm*Math.PI+rr*5.2+(pr()-.5)*(.9*(1-rr)+.35);
        return {rr,th,c:rr<.18?'rgba(255,240,210,.8)':`rgba(${m.neb[i%2]},${(.35+.4*pr()).toFixed(2)})`};});
      anim=(cx,t)=>{cx.save();cx.globalCompositeOperation='lighter';const cg=cx.createRadialGradient(gx,gy,0,gx,gy,gs*.35);cg.addColorStop(0,'rgba(255,236,200,.6)');cg.addColorStop(1,'rgba(255,236,200,0)');cx.fillStyle=cg;cx.beginPath();cx.arc(gx,gy,gs*.35,0,7);cx.fill();
        const a=t*.06,cr=Math.cos(.5),sr=Math.sin(.5);for(const p of gp){const X=p.rr*Math.cos(p.th+a),Z=p.rr*Math.sin(p.th+a)*.4,x=X*cr-Z*sr,y=X*sr+Z*cr;cx.fillStyle=p.c;cx.fillRect(gx+x*gs,gy+y*gs,1.3*D,1.3*D);}
        const P=3.4,k=Math.floor(t/P),u=(t%P)/.7;if(u<1){const q=rng(k*97+5),x0=w*(.3+.7*q()),y0=h*(J?.55+.35*q():.5*q()),L=big*.25,dx=-.8,dy=.6,x=x0+dx*L*u,y=y0+dy*L*u,gr=cx.createLinearGradient(x,y,x-dx*L*.35,y-dy*L*.35);
          gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.strokeStyle=gr;cx.lineWidth=1.6*D;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-dx*L*.35,y-dy*L*.35);cx.stroke();}
        cx.restore();};}
  }
  const tw=Array.from({length:Math.max(8,Math.round(nst/7))},()=>({x:w*r(),y:h*r(),f:.5+2*r(),p:r()*7}));
  return {img:g,tw,anim};}
function drawFundo(c,F,t){c.drawImage(F.img,0,0);for(const s of F.tw){c.fillStyle=`rgba(255,255,255,${(.5+.5*Math.sin(t*s.f+s.p)).toFixed(2)})`;c.fillRect(s.x,s.y,1.6*DPR,1.6*DPR);}if(F.anim)F.anim(c,t);}
// peça desenhada numa casa (uma instância por nome e tamanho; o mesmo quadro é reaproveitado)
const pcache={};
const kDe=n=>byName(n).k||1;
// imagem da peça num tamanho fixo (o mesmo quadro é reaproveitado); para animar o tamanho, escale no drawImage
const PASSO=1/30;
function pecaImg(n,t,sz){sz=Math.max(8,Math.round(sz));const k=n+'|'+sz,P=pcache[k]||(pcache[k]=makePiece(byName(n),sz));
  if(P._t===undefined||Math.abs(t-P._t)>=PASSO||P._L!==ST.L||P._o!==ST.outline){P._img=P.draw(t,ST.L,{outline:ST.outline});P._t=t;P._L=ST.L;P._o=ST.outline;}return P._img;}
// u = lado da casa; a peça sai no tamanho do nível (k). fit = exatamente u. esc = escala extra só no desenho
function drawPeca(c,n,t,x,y,u,a=1,fit=false,esc=1){const sz=Math.max(8,Math.round(fit?u:u*kDe(n))),img=pecaImg(n,t,sz),d=sz*esc;
  c.globalAlpha=a;c.drawImage(img,x-d/2,y-d/2,d,d);c.globalAlpha=1;}
// cada peça do tabuleiro com o seu jeito: eixo inclinado de lado e para a frente, fase e velocidade próprias (sorteados pelo id)
const vcache=new Map();
function vrDe(id){let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}const r=rng(h>>>0);
  const v={roll:(r()-.5)*1.0,pitch:(r()-.5)*.6,fase:r(),vel:.75+.55*r(),dt:r()*40,R0:mmul(mmul(rotAxis(1,0,0,(r()-.5)*1.4),rotAxis(0,0,1,(r()-.5)*1.4)),rotAxis(0,1,0,r()*6.283))};
  // escolhido no rascunho angulos.html (2026-11-09): pedras dão cambalhota em dois eixos e as nuvens giram num eixo sorteado
  v.a1=randDir(r); v.a2=randDir(r); v.w1=.5+.5*r(); v.w2=.35+.5*r(); v.eixo=randDir(r); return v;}
// libera a memória dos canvases de uma peça que saiu do cache
const libera=P=>{P.out.width=P.out.height=0;if(P.body&&P.body.can)P.body.can.width=P.body.can.height=0;};
function drawPecaVar(c,n,t,x,y,u,id,a=1){const sz=Math.max(8,Math.round(u*kDe(n))),k=id+'|'+n+'|'+sz;let P=vcache.get(k);
  if(P){vcache.delete(k);vcache.set(k,P);}   // a mais usada por último fica no fim (as mais velhas saem primeiro)
  else{P=makePiece(byName(n),sz,vrDe(id));vcache.set(k,P);if(vcache.size>120){for(const [kk,PP] of vcache){if(vcache.size<=100)break;libera(PP);vcache.delete(kk);}}}
  if(P._t===undefined||Math.abs(t-P._t)>=PASSO_VAR||P._L!==ST.L||P._o!==ST.outline){P._img=P.draw(t,ST.L,{outline:ST.outline});P._t=t;P._L=ST.L;P._o=ST.outline;}
  c.globalAlpha=a;c.drawImage(P._img,x-sz/2,y-sz/2,sz,sz);c.globalAlpha=1;}
const PASSO_VAR=1/20;   // as pedrinhas do tabuleiro giram devagar: 20 desenhos por segundo bastam (alivia o processador do celular)
// objetos 3D do tabuleiro (fora da escada)
const OBJDEF={
  estacao:{kind:'mesh',geom:'estacao',scale:.95,rot:t=>mmul(rotAxis(1,0,.2,.42),rotAxis(0,1,0,t*.55))},
  lixo:{kind:'mesh',geom:'lixo',scale:.82,rot:t=>mmul(rotAxis(1,.3,0,.5),rotAxis(.25,1,.35,t*1.1))},
  rochinha:{kind:'mesh',geom:'rochinha',sub:1,scale:1,rot:tumble(1.5,1)},
  nave:{kind:'mesh',geom:'nave',scale:.95,rot:t=>mmul(rotAxis(1,0,0,.38),rotAxis(0,1,0,-.55+.3*Math.sin(t*.7)))},
  pilar0:{kind:'mesh',geom:'pilar0',sub:2,scale:.98,rot:()=>ID},pilar1:{kind:'mesh',geom:'pilar1',sub:2,scale:.98,rot:()=>ID},pilar2:{kind:'mesh',geom:'pilar2',sub:2,scale:.98,rot:()=>ID},
  portal:{kind:'mesh',geom:'portal',scale:.95,rot:t=>mmul(mmul(rotAxis(0,1,0,.45*Math.sin(t*.5)),rotAxis(1,0,0,.35)),rotAxis(0,0,1,t*.6))},
};
const ocache={};
// objetos que giram em ciclo são filmados uma vez (N quadros) e depois só tocados: quase não custam nada por quadro
const fcache={};
function quadroObj(filme,key,S,t,N,per,rot){const k=filme+'|'+S;let F=fcache[k];if(!F)F=fcache[k]=new Array(N);const i=Math.floor(((t%per+per)%per)/per*N)%N;
  if(!F[i]){const cv=mk(S,S);cv.getContext('2d').drawImage(objImg(key,S,0,rot(i/N*per)),0,0);F[i]=cv;}return F[i];}
const PER_EST=2*Math.PI/.55,PER_LIXO=2*Math.PI/1.1,PER_NAVE=2*Math.PI/.7,TAU=2*Math.PI;
const rotRocha=v=>a=>mmul(rotAxis(.3+v*.4,1,.2*v,a),rotAxis(1,.2,0,v*1.3));
function objImg(key,S,t,M){const k=key+'|'+S,P=ocache[k]||(ocache[k]=makePiece({...OBJDEF[key],seed:1},S));return P.draw(t,ST.L,{outline:ST.outline,M});}
// os elementos do Clássico, no espaço. x,y = centro da casa; u = lado da casa (px do canvas)
const SPR={
  orbita(c,x,y,u){const g=c.createRadialGradient(x,y,0,x,y,u*.42);g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,u*.42,0,7);c.fill();
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1.2*DPR;c.stroke();},
  neb(c,x,y,u,t,sd=0){for(let i=0;i<6;i++){const a=t*.35+i*1.05+sd,px=x+Math.cos(a)*u*.12,py=y+Math.sin(a*1.3)*u*.1,g=c.createRadialGradient(px,py,0,px,py,u*.3);
      g.addColorStop(0,'rgba(84,56,46,.92)');g.addColorStop(1,'rgba(84,56,46,0)');c.fillStyle=g;c.beginPath();c.arc(px,py,u*.3,0,7);c.fill();}
    c.fillStyle='rgba(190,150,120,.5)';for(let i=0;i<7;i++){const a=t*.5+i*.9+sd;c.fillRect(x+Math.cos(a*1.7)*u*.28,y+Math.sin(a)*u*.24,u*.018,u*.018);}},
  alvo(c,x,y,u,t,n){c.save();c.strokeStyle='#f2b33d';c.lineWidth=u*.035;c.shadowColor='#f2b33d';c.shadowBlur=u*.08;c.setLineDash([u*.09,u*.06]);c.lineDashOffset=-t*u*.12;
    c.beginPath();c.arc(x,y,u*.42,0,7);c.stroke();c.restore();drawPeca(c,n,t,x,y,u,.35);},
  aura(c,x,y,u,t,k){const col=['167,123,223','111,191,90'][k],g=c.createRadialGradient(x,y,u*.22,x,y,u*.5);
    g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(.6,`rgba(${col},${(.6+.15*Math.sin(t*3)).toFixed(2)})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,u*.5,0,7);c.fill();},
  // gaiola: 3 anéis de luz em 3D; chame com 'back' antes do planeta e 'front' depois
  gaiola(c,x,y,u,t,half){const R=u*.46,M=mmul(rotAxis(0,1,0,t*.5),rotAxis(1,0,0,.5)),back=half==='back';c.save();c.lineCap='round';c.lineJoin='round';
    for(const n0 of [[0,0,1],[1,0,.25],[.35,1,.2]]){const l=Math.hypot(...n0),n=[0,1,2].map(i=>(M[i*3]*n0[0]+M[i*3+1]*n0[1]+M[i*3+2]*n0[2])/l),[,a,b]=basis(n);
      const segs=[];let cur=null;for(let i=0;i<=64;i++){const th=i/64*2*Math.PI,p=[0,1,2].map(j=>(a[j]*Math.cos(th)+b[j]*Math.sin(th))*R),vis=back?p[2]<0:p[2]>=0;
        if(vis){if(!cur){cur=[];segs.push(cur);}cur.push([x+p[0],y-p[1]]);}else cur=null;}
      for(const [lw,st] of [[u*.07,`rgba(110,220,255,${back?.12:.25})`],[u*.022,`rgba(200,245,255,${back?.5:.95})`]]){c.strokeStyle=st;c.lineWidth=lw;
        for(const s of segs){if(s.length<2)continue;c.beginPath();s.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();}}}
    c.restore();},
  estacao(c,x,y,u,t){const S=Math.round(u);c.drawImage(quadroObj('estacao','estacao',S,t,60,PER_EST,OBJDEF.estacao.rot),x-S/2,y-S/2);},
  lixo(c,x,y,u,t){const S=Math.round(u);c.drawImage(quadroObj('lixo','lixo',S,t,48,PER_LIXO,OBJDEF.lixo.rot),x-S/2,y-S/2);
    for(let i=0;i<3;i++){const a=t*1.6+i*2.1;c.fillStyle='#b8bec8';c.beginPath();c.arc(x+Math.cos(a)*u*.38,y+Math.sin(a)*u*.2,u*.018,0,7);c.fill();}},
  // mureta: fluxo de rochas 3D de a até b
  rochas(c,a,b,t,u){const N=6,L=Math.hypot(b[0]-a[0],b[1]-a[1]),px=-(b[1]-a[1])/L,py=(b[0]-a[0])/L,S=Math.round(u*.3);
    c.save();c.lineCap='round';c.strokeStyle='rgba(200,180,150,.12)';c.lineWidth=u*.14;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore();
    for(let i=0;i<N;i++){const s=(t*.16+i/N)%1,wob=Math.sin(t*1.3+i*2)*u*.035,x=a[0]+(b[0]-a[0])*s+px*wob,y=a[1]+(b[1]-a[1])*s+py*wob,sz=S*(.6+.4*(((i*37)%10)/10));
      const v=i%3,img=quadroObj('rocha'+v,'rochinha',S,t*(1.2+i*.15)+i,32,TAU,rotRocha(v));
      c.globalAlpha=smooth(0,.12,s)*smooth(1,.88,s);c.drawImage(img,x-sz/2,y-sz/2,sz,sz);c.globalAlpha=1;}},
  // carrinho, opção A: nave 3D com raio trator
  nave(c,x,y,u,t,n){const S=Math.round(u*.78),sy=y-u*.2+Math.sin(t*2)*u*.015,top=sy+u*.06,bot=y+u*.4,g=c.createLinearGradient(0,top,0,bot);
    g.addColorStop(0,'rgba(140,235,255,.55)');g.addColorStop(1,'rgba(140,235,255,.04)');
    c.fillStyle=g;c.beginPath();c.moveTo(x-u*.06,top);c.lineTo(x+u*.06,top);c.lineTo(x+u*.27,bot);c.lineTo(x-u*.27,bot);c.closePath();c.fill();
    c.strokeStyle='rgba(200,250,255,.35)';c.lineWidth=u*.012;for(let i=0;i<3;i++){const k=(t*.7+i/3)%1,yy=top+(bot-top)*k,ww=u*(.06+.21*k);c.beginPath();c.moveTo(x-ww,yy);c.lineTo(x+ww,yy);c.stroke();}
    drawPeca(c,n,t,x,y+u*.2,u*.42,.6,true);c.drawImage(quadroObj('nave','nave',S,t,48,PER_NAVE,OBJDEF.nave.rot),x-S/2,sy-S/2);},
  // carrinho, opção B: portal 3D
  portal(c,x,y,u,t,n){const S=Math.round(u);c.save();c.translate(x,y);const g=c.createRadialGradient(0,0,0,0,0,u*.32);g.addColorStop(0,'rgba(170,240,255,.55)');g.addColorStop(1,'rgba(90,120,255,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,u*.32,0,7);c.fill();
    c.rotate(-t*1.2);c.strokeStyle='rgba(190,240,255,.45)';c.lineWidth=u*.012;for(let k=0;k<3;k++){c.beginPath();for(let i=0;i<=30;i++){const a=i/30*4+k*2.09,r=u*.02+u*.25*i/30;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();}c.restore();
    drawPeca(c,n,t,x,y,u*.4,.55,true);c.drawImage(objImg('portal',S,t),x-S/2,y-S/2);},
  buraco(c,x,y,u,t,cor){bnDraw(c,x,y,u*.15,t,hex(cor).join(','));},
};

// ===================== PLANETAS PELA PLACA DE VÍDEO (WebGL) =====================
// No jogo, os planetas redondos do tabuleiro são desenhados por shaders, todos numa camada só: cada pixel é
// calculado na placa de vídeo, e não mais ponto a ponto no processador. As contas são as mesmas do SphereBody
// (textura, inclinação do eixo, giro, luz em faixas, nuvens, atmosfera, brilho do Sol, contorno) e dos anéis.
const GLP={gl:null,cv:null,pe:null,pa:null,buf:null,tex:new Map(),falhou:false,der:false,perdido:false};
const GLS_V='attribute vec2 a;uniform vec2 c;uniform float h;uniform vec2 tela;uniform float raio;varying vec2 p;'+
  'void main(){vec2 q=c+a*h;gl_Position=vec4(q.x/tela.x*2.-1.,1.-q.y/tela.y*2.,0.,1.);p=vec2(a.x,-a.y)*h/raio;}';
const GLS_PREC='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
const GLS_ESFERA=GLS_PREC+'varying vec2 p;uniform sampler2D tx,nv;uniform float tilt,pitch,giro,giroN,emis,temNuv,atmoOn,glow,glowR,pxR,contW;uniform vec3 L,atmo,cont;'+
 'void main(){float r=length(p),aa=1.2/pxR;vec4 o=vec4(0.);'+
 'if(atmoOn>.5&&r<1.25){float a=.55*clamp(1.-(r-.92)/.33,0.,1.);o=vec4(atmo*a,a);}'+
 'if(glow>.5&&r<glowR){float k=clamp((r-.8)/(glowR-.8),0.,1.);vec3 gc=mix(vec3(1.,.84,.35),vec3(1.,.6,.12),k);float a=.75*pow(1.-k,1.6);o=vec4(gc*a,a);}'+
 'if(r<1.){float z=sqrt(max(0.,1.-r*r));vec3 n=vec3(p,z);float ct=cos(tilt),st=sin(tilt),cp=cos(pitch),sp=sin(pitch);'+
 'float x1=n.x*ct+n.y*st,y1=-n.x*st+n.y*ct,y2=y1*cp+n.z*sp,z2=-y1*sp+n.z*cp;float lat=asin(clamp(y2,-1.,1.)),lon=atan(x1,z2);'+
 'vec2 uv=vec2(lon/6.2831853+.5+giro,.5-lat/3.1415927);vec3 c=texture2D(tx,uv).rgb;'+
 'if(temNuv>.5){float na=texture2D(nv,vec2(uv.x-giro+giroN,uv.y)).a;c=mix(c,vec3(1.),na);}'+
 'float s;if(emis>.5)s=.72+.36*z;else{float l=dot(n,L);s=.26+.56*smoothstep(-.1,.14,l)+.2*smoothstep(.45,.95,l);float rim=1.-z;s+=.2*rim*rim*rim*smoothstep(0.,.3,l);}'+
 'c*=s;float e=contW/pxR;c=mix(c,cont,smoothstep(1.-e-aa,1.-e+aa*.5,r));float a=1.-smoothstep(1.-aa,1.,r);o=vec4(c*a,a)+o*(1.-a);}'+
 'gl_FragColor=o;}';
const GLS_ANEL=(der)=>(der?'#extension GL_OES_standard_derivatives : enable\n':'')+GLS_PREC+'varying vec2 p;uniform float tilt,pitch,lado,pxR,bordas;uniform vec4 b0,b1,b2,b3;uniform vec3 c0,c1,c2,c3,cont;'+
 'float banda(float r,vec4 b,float w){return b.z<.5?0.:smoothstep(b.x-w,b.x+w,r)*(1.-smoothstep(b.y-w,b.y+w,r));}'+
 'void main(){vec3 n=vec3(-cos(pitch)*sin(tilt),cos(pitch)*cos(tilt),sin(pitch));if(abs(n.z)<.02)discard;'+
 'float z=-(n.x*p.x+n.y*p.y)/n.z;if(z*lado<0.)discard;float r=length(vec3(p,z));'+
 (der?'float w=max(fwidth(r)*.7,.002);':'float w=1./pxR;')+
 'vec3 c=vec3(0.);float a=0.,k;k=banda(r,b0,w);c+=c0*k;a+=k;k=banda(r,b1,w);c+=c1*k;a+=k;k=banda(r,b2,w);c+=c2*k;a+=k;k=banda(r,b3,w);c+=c3*k;a+=k;'+
 'if(bordas>.5){float lw=w*2.4;float e=max(1.-smoothstep(lw*.5,lw,abs(r-b0.x)),1.-smoothstep(lw*.5,lw,abs(r-b3.y)));c=mix(c,cont,e);a=max(a,e);}'+
 'a=clamp(a,0.,1.);gl_FragColor=vec4(c*a,a);}';
function glCompila(gl,vs,fs){const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){const nm=gl.getActiveUniform(p,i).name;u[nm]=gl.getUniformLocation(p,nm);}return {p,u,a:gl.getAttribLocation(p,'a')};}
// prepara o WebGL no canvas (uma vez); devolve false se o aparelho não tiver
function glPronto(cv){
  if(GLP.falhou||GLP.perdido) return false; if(GLP.gl && GLP.cv===cv) return true;
  try{const gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});if(!gl)throw new Error('sem webgl');
    GLP.der=!!gl.getExtension('OES_standard_derivatives');
    GLP.pe=glCompila(gl,GLS_V,GLS_ESFERA);GLP.pa=glCompila(gl,GLS_V,GLS_ANEL(GLP.der));
    GLP.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,GLP.buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);GLP.gl=gl;GLP.cv=cv;GLP.tex=new Map();
    // contexto perdido (no Android acontece ao voltar do segundo plano): enquanto isso os planetas voltam ao desenho
    // antigo; quando a placa de vídeo devolve o contexto, a próxima chamada monta tudo de novo no mesmo canvas
    if(!cv._glOuve){cv._glOuve=true;
      cv.addEventListener('webglcontextlost',e=>{e.preventDefault();GLP.gl=null;GLP.perdido=true;});
      cv.addEventListener('webglcontextrestored',()=>{GLP.perdido=false;});}
    return true;}
  catch(e){GLP.falhou=true;console.warn('WebGL indisponível, planetas no desenho antigo:',e.message);return false;}}
function glTex(nome){const gl=GLP.gl;let t=GLP.tex.get(nome);if(t)return t;const px=TEX[nome].px;
  t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,TW,TH,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(px.buffer,px.byteOffset,px.byteLength));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);GLP.tex.set(nome,t);return t;}
const hex3=h=>hex(h).map(v=>v/255);
// lista: [{n, x, y, u, id}] com x, y, u em px do canvas (u = lado da casa); desenha os redondos, os maiores primeiro
function glDesenha(lista,t,L){
  const gl=GLP.gl,cv=GLP.cv;if(!gl)return false;gl.viewport(0,0,cv.width,cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER,GLP.buf);
  const usa=(P,c,h,R)=>{gl.useProgram(P.p);gl.enableVertexAttribArray(P.a);gl.vertexAttribPointer(P.a,2,gl.FLOAT,false,0,0);
    gl.uniform2f(P.u.c,c[0],c[1]);gl.uniform1f(P.u.h,h);gl.uniform2f(P.u.tela,cv.width,cv.height);gl.uniform1f(P.u.raio,R);gl.uniform1f(P.u.pxR,R);};
  const ord=lista.filter(it=>byName(it.n).kind==='sphere').sort((a,b)=>kDe(b.n)-kDe(a.n));
  for(const it of ord){const def=byName(it.n),sp=def.sp,vr=vrDe(it.id);
    let tilt=(sp.tilt||0)+vr.roll,pitch=clamp((sp.pitch||0)+vr.pitch,-.85,.85);if(def.ring&&Math.abs(pitch)<.24)pitch=pitch<0?-.24:.24;
    const S=it.u*kDe(it.n)*(it.esc||1),R=S/2*sp.rScale,vel=(sp.speed||.05)*vr.vel,c=[it.x,it.y];
    const anel=lado=>{const P=GLP.pa,B=def.ring.bands;usa(P,c,R*2.1,R);gl.uniform1f(P.u.tilt,tilt);gl.uniform1f(P.u.pitch,pitch);gl.uniform1f(P.u.lado,lado);
      gl.uniform1f(P.u.bordas,def.ring.edges?1:0);gl.uniform3fv(P.u.cont,hex3(INK));
      for(let i=0;i<4;i++){const b=B[i];gl.uniform4f(P.u['b'+i],b?b[0]:0,b?b[1]:0,b?1:0,0);gl.uniform3fv(P.u['c'+i],b?hex3(b[2]):[0,0,0]);}
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
    if(def.ring)anel(-1);
    const P=GLP.pe,h=R*(def.glow?1/sp.rScale:def.atmo?1.27:1.04);usa(P,c,h,R);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,glTex(def.tex));gl.uniform1i(P.u.tx,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,glTex(def.clouds||def.tex));gl.uniform1i(P.u.nv,1);
    gl.uniform1f(P.u.tilt,tilt);gl.uniform1f(P.u.pitch,pitch);gl.uniform1f(P.u.giro,-vel*t+vr.fase);gl.uniform1f(P.u.giroN,-vel*1.3*t+vr.fase);
    gl.uniform1f(P.u.emis,sp.emissive?1:0);gl.uniform1f(P.u.temNuv,def.clouds?1:0);gl.uniform1f(P.u.atmoOn,def.atmo?1:0);gl.uniform3fv(P.u.atmo,def.atmo?def.atmo.map(v=>v/255):[0,0,0]);
    gl.uniform1f(P.u.glow,def.glow?1:0);gl.uniform1f(P.u.glowR,1/sp.rScale);gl.uniform1f(P.u.contW,ST.outline?Math.max(1.6*DPR,R*.055):0);gl.uniform3fv(P.u.cont,hex3(def.outline||INK));
    gl.uniform3f(P.u.L,L[0],L[1],L[2]);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(def.ring)anel(1);}
  return true;}
