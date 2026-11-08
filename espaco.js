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
function makeTex(fn){const g=mk(GW,GH),gx=g.getContext('2d'),gi=gx.createImageData(GW,GH),px=gi.data;
  for(let j=0;j<GH;j++){const lat=(.5-(j+.5)/GH)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
    for(let i=0;i<GW;i++){const lon=((i+.5)/GW-.5)*2*Math.PI;const c=fn(cl*Math.sin(lon),sl,cl*Math.cos(lon),lat,lon);const k=(j*GW+i)*4;
      px[k]=c[0];px[k+1]=c[1];px[k+2]=c[2];px[k+3]=c.length>3?c[3]:255;}}
  gx.putImageData(gi,0,0);const big=mk(TW,TH),bx=big.getContext('2d');bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality='high';bx.drawImage(g,0,0,TW,TH);
  return {px:bx.getImageData(0,0,TW,TH).data};}
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
  TEX.mercurio=makeTex((x,y,z)=>{let c=mix(C('#6f5d50'),C('#b99a7c'),smooth(.35,.65,fbm(x*3,y*3,z*3,4,92)));c=shadeC(c,craterShade(x,y,z,crH)*1.1);
    return mix(c,C('#f5e8d4'),clamp(rayShade(x,y,z,rays),0,.85));});
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
  bennu:(x,y,z)=>{const h=Math.sqrt(1-y*y),cone=1/(h/1.08+Math.abs(y)/.8);return .62*cone+.36+.14*(fbm(x*2.6,y*2.6,z*2.6,4,45)-.5)+dents(x,y,z,DB,.04);},
  cometa:(x,y,z)=>.74+.24*(2*x*x-1)+.28*(fbm(x*1.8,y*1.8,z*1.8,4,46)-.5),
  lava:(x,y,z)=>.86+.55*(fbm(x*1.3+4,y*1.3,z*1.3,4,48)-.5),
};
const COL={
  bennu:(x,y,z)=>{let c=mix(C('#56627a'),C('#93a0b8'),fbm(x*3,y*3,z*3,3,55));if(h3(x*25,y*25,z*25,6)>.93)c=mix(c,C('#b8c2d2'),.3);return c;},
  cometa:(x,y,z)=>{const n=fbm(x*2.5,y*2.5,z*2.5,3,56);let c=mix(C('#3f4656'),C('#66708a'),n);if(n>.6)c=mix(c,C('#e8f6ff'),.7);return c;},
  lava:(x,y,z)=>mix(C('#1f181e'),C('#40333b'),fbm(x*4,y*4,z*4,3,49)),
};
const EMIS={lava:(x,y,z)=>{const r=1-Math.abs(2*fbm(x*2.2,y*2.2,z*2.2,4,50)-1);return r>.955?(r>.985?C('#ffd66e'):C('#ff7a1e')):null;}};
const meshCache={};
function meshFor(key,sub){const k=key+sub;return meshCache[k]||(meshCache[k]=key==='cristal'?crystalGeom():blobGeom(SH[key],COL[key],sub,EMIS[key]));}
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
// regra: cada degrau com cor e silhueta próprias, para bater o olho no tabuleiro e saber o nível
const tumble=(w,s=0)=>t=>mmul(rotAxis(.3,1,.1,w*t+s),rotAxis(1,.2,0,w*.37*t+s*2));
const spinY=(per,tilt=.45)=>t=>mmul(rotAxis(1,0,.3,tilt),rotAxis(0,1,0,2*Math.PI*t/per));
function sparkles(o,S,t){for(let i=0;i<3;i++){const a=Math.max(0,Math.sin(t*2.3+i*2.1));if(a<.05)continue;const x=S*[.28,.7,.56][i],y=S*[.3,.36,.74][i],r=S*.065*a;
  o.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;o.beginPath();o.moveTo(x,y-r);o.quadraticCurveTo(x,y,x+r,y);o.quadraticCurveTo(x,y,x,y+r);o.quadraticCurveTo(x,y,x-r,y);o.quadraticCurveTo(x,y,x,y-r);o.fill();}}
function lavaGlow(o,S,t){const c=S/2,g=o.createRadialGradient(c,c,S*.18,c,c,S*.5);g.addColorStop(0,`rgba(255,120,30,${(.4+.14*Math.sin(t*2.2)).toFixed(2)})`);g.addColorStop(1,'rgba(255,90,20,0)');o.fillStyle=g;o.fillRect(0,0,S,S);}
const LADDER=[
  {n:'Poeira',src:'gerada',kind:'dust'},
  {n:'Cristal de gelo',src:'gerado',kind:'mesh',geom:'cristal',sub:0,scale:.84,amb:.48,rot:spinY(7,.35),post:sparkles},
  {n:'Rocha de lava',src:'gerada',kind:'mesh',geom:'lava',sub:3,scale:.8,rot:tumble(.7,6),pre:lavaGlow},
  {n:'Asteroide',src:'NASA · Bennu',kind:'mesh',geom:'bennu',sub:2,scale:.92,rot:spinY(6)},
  {n:'Cometa',src:'ESA · 67P',kind:'comet',geom:'cometa',sub:2,rot:tumble(.6,5)},
  {n:'Plutão',src:'NASA',kind:'sphere',tex:'pluto',sp:{rScale:.5,speed:.05,tilt:.3,pitch:.2}},
  {n:'Lua',src:'NASA',kind:'sphere',tex:'lua',sp:{rScale:.56,speed:.05,tilt:.1,pitch:.12}},
  {n:'Mercúrio',src:'Solar System Scope',kind:'sphere',tex:'mercurio',sp:{rScale:.6,speed:.05,tilt:.05,pitch:.1}},
  {n:'Marte',src:'NASA',kind:'sphere',tex:'marte',sp:{rScale:.66,speed:.06,tilt:.4,pitch:.25}},
  {n:'Vênus',src:'NASA',kind:'sphere',tex:'venus',atmo:[255,214,140],sp:{rScale:.7,speed:.04,tilt:.05,pitch:.1}},
  {n:'Terra',src:'NASA',kind:'sphere',tex:'terra',clouds:'nuvens',atmo:[120,190,255],sp:{rScale:.72,speed:.05,tilt:.41,pitch:.22}},
  {n:'Netuno',src:'NASA',kind:'sphere',tex:'netuno',atmo:[110,150,255],sp:{rScale:.76,speed:.08,tilt:.5,pitch:.2}},
  {n:'Urano',src:'Solar System Scope',kind:'sphere',tex:'urano',ring:RING_URA,atmo:[170,240,240],sp:{rScale:.48,speed:.07,tilt:1.5,pitch:.28}},
  {n:'Saturno',src:'NASA',kind:'sphere',tex:'saturno',ring:RING_SAT,sp:{rScale:.46,speed:.08,tilt:.38,pitch:.42}},
  {n:'Júpiter',src:'NASA',kind:'sphere',tex:'jupiter',sp:{rScale:.88,speed:.09,tilt:.05,pitch:.1}},
  {n:'Sol',src:'gerado',kind:'sphere',tex:'estrela',glow:true,outline:'#c47f12',sp:{rScale:.58,speed:.03,tilt:0,pitch:.1,emissive:true}},
  {n:'Supernova',src:'NASA · Cas A',kind:'supernova'},
  {n:'Galáxia',src:'gerada',kind:'galaxy'},
];
LADDER.forEach((d,i)=>d.seed=i+1);
const byName=n=>LADDER.find(d=>d.n===n);

function makePiece(def,S){
  const out=mk(S,S),o=out.getContext('2d'),P={def,S,out,userRot:null,userSpin:0};const k=def.kind;
  if(k==='sphere'){
    const body=new SphereBody(TEX[def.tex],{...def.sp,clouds:def.clouds?TEX[def.clouds]:null});body.prep(S);P.body=body;
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
    P.draw=(t,L,op={})=>{bx.clearRect(0,0,S,S);let M=op.M||def.rot(t);if(P.userRot)M=mmul(P.userRot,M);
      body.render(bx,S,M,L,{scale:def.scale||1,wire:op.wire,amb:def.amb});o.clearRect(0,0,S,S);if(def.pre)def.pre(o,S,t);
      if(op.outline!==false)outlineInto(o,bc,S,Math.max(1.6,S*.018),INK);else o.drawImage(bc,0,0);
      if(def.post)def.post(o,S,t);
      if(op.face)drawFace(o,S/2,S/2+(def.geom==='cristal'?S*.08:0),S/2*.86*(def.scale||1)*.8,t,def.seed);return out;};
  }else if(k==='comet'){
    const body=meshFor(def.geom,def.sub),bc=mk(S,S),bx=bc.getContext('2d'),r=rng(88);
    const parts=Array.from({length:130},()=>({ph:r(),lat:r()-.5,sp:.8+.4*r()}));
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);let dx=-L[0],dy=L[1];const dl=Math.hypot(dx,dy);if(dl<.15){dx=.7;dy=.7;}else{dx/=dl;dy/=dl;}
      const px=-dy,py=dx,cx=S/2-dx*S*.17,cy=S/2-dy*S*.17,far=S*.64;
      const g=o.createLinearGradient(cx,cy,cx+dx*far,cy+dy*far);g.addColorStop(0,'rgba(170,230,255,.5)');g.addColorStop(1,'rgba(170,230,255,0)');
      o.fillStyle=g;o.beginPath();o.moveTo(cx+px*S*.07,cy+py*S*.07);o.lineTo(cx+dx*far+px*S*.24,cy+dy*far+py*S*.24);o.lineTo(cx+dx*far-px*S*.24,cy+dy*far-py*S*.24);o.lineTo(cx-px*S*.07,cy-py*S*.07);o.closePath();o.fill();
      o.globalCompositeOperation='lighter';for(const p of parts){const u=(t*.3*p.sp+p.ph)%1,x=cx+dx*u*far+px*p.lat*u*S*.38,y=cy+dy*u*far+py*p.lat*u*S*.38;
        o.fillStyle=`rgba(200,240,255,${((1-u)*.75).toFixed(2)})`;const s=(1+u*2.4)*S/128;o.fillRect(x-s/2,y-s/2,s,s);}o.globalCompositeOperation='source-over';
      const cg=o.createRadialGradient(cx,cy,0,cx,cy,S*.22);cg.addColorStop(0,'rgba(210,245,255,.7)');cg.addColorStop(1,'rgba(210,245,255,0)');o.fillStyle=cg;o.beginPath();o.arc(cx,cy,S*.22,0,7);o.fill();
      bx.clearRect(0,0,S,S);let M=op.M||def.rot(t);if(P.userRot)M=mmul(P.userRot,M);body.render(bx,S,M,L,{scale:.5,dx:cx-S/2,dy:cy-S/2,wire:op.wire});
      if(op.outline!==false)outlineInto(o,bc,S,Math.max(1.4,S*.016),INK);else o.drawImage(bc,0,0);
      if(op.face)drawFace(o,cx,cy,S/2*.86*.5*.8,t,def.seed);return out;};
  }else if(k==='dust'){
    const r=rng(5),gr=Array.from({length:80},()=>({r:.12+.72*Math.sqrt(r()),th:r()*7,w:(.5+r())*.9,s:.012+.035*r()*r(),c:r()<.5?'#d9c49a':'#b39773'}));
    P.draw=(t,L,op={})=>{o.clearRect(0,0,S,S);const c=S/2,g=o.createRadialGradient(c,c,0,c,c,S*.45);g.addColorStop(0,'rgba(230,210,170,.22)');g.addColorStop(1,'rgba(230,210,170,0)');o.fillStyle=g;o.fillRect(0,0,S,S);
      const sorted=gr.map(p=>{const a=p.th+p.w*t/Math.sqrt(p.r);return {p,x:Math.cos(a)*p.r,y:Math.sin(a)*p.r*.45,z:Math.sin(a)};}).sort((a,b)=>a.z-b.z);
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
  return P;
}
function starGlow(o,c,R,t,S){const g=o.createRadialGradient(c,c,R*.8,c,c,S/2);g.addColorStop(0,'rgba(255,214,90,.75)');g.addColorStop(.45,'rgba(255,170,40,.25)');g.addColorStop(1,'rgba(255,150,30,0)');
  o.fillStyle=g;o.beginPath();o.arc(c,c,S/2,0,7);o.fill();o.save();o.translate(c,c);o.rotate(t*.15);o.fillStyle='rgba(255,230,140,.35)';
  for(let i=0;i<10;i++){o.rotate(Math.PI*2/10);const l=R*(1.45+.12*Math.sin(t*2+i*1.7));o.beginPath();o.moveTo(-R*.18,0);o.lineTo(0,-l);o.lineTo(R*.18,0);o.fill();}o.restore();}

// ===================== laço de animação (só desenha o que está na tela) =====================
const views=[];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.target._v)e.target._v.vis=e.isIntersecting;}),{rootMargin:'100px'});
function view(el,draw){const v={el,vis:true,draw};el._v=v;views.push(v);io.observe(el);return v;}
function paint(ctx,cv,src){ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(src,0,0,cv.width,cv.height);}


// ===================== tabuleiro no espaço: fundo e elementos =====================
const MUNDOS_ESP=[
  {n:'Entrada',neb:['107,79,216','208,106,214'],pl:'#3b2f7a'},{n:'Blocos',neb:['47,123,216','70,200,224'],pl:'#1f3f6e'},
  {n:'Muretas',neb:['38,179,138','63,208,192'],pl:'#17584a'},{n:'Terra',neb:['194,122,58','224,176,96'],pl:'#5a3420'},
  {n:'Carrinho',neb:['224,96,58','240,168,48'],pl:'#6a2a1a'},{n:'Cores',neb:['154,90,216','90,200,106'],pl:'#30305a'},
  {n:'Picareta',neb:['216,64,79','255,138,90'],pl:'#5a1a2a'},{n:'Passinho',neb:['224,106,154','138,122,255'],pl:'#4a2050'}];
function buildFundo(w,h,m,o={}){const D=DPR,g=mk(w,h),c=g.getContext('2d'),r=rng(o.seed||7);
  const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b0a18');bg.addColorStop(1,'#141026');c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.globalCompositeOperation='lighter';
  for(let i=0;i<34;i++){const t=r(),x=w*t+(r()-.5)*w*.35,y=h*(.15+.7*t)+(r()-.5)*h*.3,rad=Math.max(w,h)*(.1+.22*r()),col=m.neb[i%2],a=(.05+.1*r()).toFixed(3);
    const gr=c.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);c.fillStyle=gr;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
  c.globalCompositeOperation='source-over';
  for(let i=0;i<12;i++){const x=w*r(),y=h*r(),rad=Math.max(w,h)*(.06+.12*r()),gr=c.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(6,4,14,.4)');gr.addColorStop(1,'rgba(6,4,14,0)');c.fillStyle=gr;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
  const nst=Math.round(w*h/(D*D)/450);
  for(let i=0;i<nst;i++){const x=w*r(),y=h*r(),sz=(.4+1.3*r()*r())*D,cols=['255,255,255','190,215,255','255,236,200'];c.fillStyle=`rgba(${cols[(r()*3)|0]},${(.25+.65*r()).toFixed(2)})`;c.fillRect(x,y,sz,sz);}
  for(let i=0;i<Math.max(2,nst/40);i++){const x=w*r(),y=h*r(),l=(4+6*r())*D;c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=D*.8;c.beginPath();c.moveTo(x-l,y);c.lineTo(x+l,y);c.moveTo(x,y-l);c.lineTo(x,y+l);c.stroke();}
  if(o.planeta!==false){const px=w*1.1,py=h*1.12,pr=Math.min(w,h)*.4,pg=c.createRadialGradient(px-pr*.5,py-pr*.5,pr*.1,px,py,pr);pg.addColorStop(0,m.pl);pg.addColorStop(1,'#050409');
    c.fillStyle=pg;c.beginPath();c.arc(px,py,pr,0,7);c.fill();c.strokeStyle=`rgba(${m.neb[1]},.55)`;c.lineWidth=3*D;c.beginPath();c.arc(px,py,pr,Math.PI*1.02,Math.PI*1.48);c.stroke();}
  const tw=Array.from({length:Math.max(8,Math.round(nst/7))},()=>({x:w*r(),y:h*r(),f:.5+2*r(),p:r()*7}));
  return {img:g,tw};}
function drawFundo(c,F,t){c.drawImage(F.img,0,0);for(const s of F.tw){c.fillStyle=`rgba(255,255,255,${(.5+.5*Math.sin(t*s.f+s.p)).toFixed(2)})`;c.fillRect(s.x,s.y,1.6*DPR,1.6*DPR);}}
// peça desenhada numa casa (uma instância por nome e tamanho; o mesmo quadro é reaproveitado)
const pcache={};
function drawPeca(c,n,t,x,y,sz,a=1){sz=Math.max(8,Math.round(sz));const k=n+'|'+sz,P=pcache[k]||(pcache[k]=makePiece(byName(n),sz));
  if(P._t!==t||P._L!==ST.L||P._o!==ST.outline){P._img=P.draw(t,ST.L,{outline:ST.outline});P._t=t;P._L=ST.L;P._o=ST.outline;}
  c.globalAlpha=a;c.drawImage(P._img,x-sz/2,y-sz/2,sz,sz);c.globalAlpha=1;}
// os elementos do Clássico, no espaço. x,y = centro da casa; u = lado da casa (px do canvas)
const SPR={
  orbita(c,x,y,u){const g=c.createRadialGradient(x,y,0,x,y,u*.42);g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,u*.42,0,7);c.fill();
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1.2*DPR;c.stroke();},
  neb(c,x,y,u,t,sd=0){for(let i=0;i<6;i++){const a=t*.35+i*1.05+sd,px=x+Math.cos(a)*u*.12,py=y+Math.sin(a*1.3)*u*.1,g=c.createRadialGradient(px,py,0,px,py,u*.3);
      g.addColorStop(0,'rgba(84,56,46,.92)');g.addColorStop(1,'rgba(84,56,46,0)');c.fillStyle=g;c.beginPath();c.arc(px,py,u*.3,0,7);c.fill();}
    c.fillStyle='rgba(190,150,120,.5)';for(let i=0;i<7;i++){const a=t*.5+i*.9+sd;c.fillRect(x+Math.cos(a*1.7)*u*.28,y+Math.sin(a)*u*.24,u*.018,u*.018);}},
  alvo(c,x,y,u,t,n){c.save();c.strokeStyle='#f2b33d';c.lineWidth=u*.035;c.shadowColor='#f2b33d';c.shadowBlur=u*.08;c.setLineDash([u*.09,u*.06]);c.lineDashOffset=-t*u*.12;
    c.beginPath();c.arc(x,y,u*.42,0,7);c.stroke();c.restore();drawPeca(c,n,t,x,y,u*.95,.35);},
  aura(c,x,y,u,t,k){const col=['167,123,223','111,191,90'][k],g=c.createRadialGradient(x,y,u*.22,x,y,u*.5);
    g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(.6,`rgba(${col},${(.6+.15*Math.sin(t*3)).toFixed(2)})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,u*.5,0,7);c.fill();},
  gaiola(c,x,y,u,t){c.save();c.translate(x,y);c.rotate(t*.3);const R=u*.45;c.strokeStyle='rgba(160,232,255,.9)';c.lineWidth=u*.025;c.shadowColor='#7fe0ff';c.shadowBlur=u*.1;
    c.beginPath();for(let i=0;i<6;i++){const a=i/6*2*Math.PI;c.lineTo(Math.cos(a)*R,Math.sin(a)*R);}c.closePath();c.stroke();
    c.globalAlpha=.45;c.beginPath();for(let i=0;i<3;i++){const a=i/6*2*Math.PI;c.moveTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(-Math.cos(a)*R,-Math.sin(a)*R);}c.stroke();c.restore();},
  estacao(c,x,y,u,t){const s=u/100;c.save();c.translate(x,y);c.rotate(Math.sin(t*.5)*.06);c.lineJoin='round';
    for(const sx of [-1,1]){const x0=sx>0?14:-44;c.fillStyle='#2f5fa8';c.strokeStyle=INK;c.lineWidth=2.2*s;c.beginPath();c.rect(x0*s,-12*s,30*s,24*s);c.fill();c.stroke();
      c.strokeStyle='rgba(170,210,255,.55)';c.lineWidth=1*s;c.beginPath();for(let i=1;i<3;i++){c.moveTo((x0+i*10)*s,-12*s);c.lineTo((x0+i*10)*s,12*s);}c.moveTo(x0*s,0);c.lineTo((x0+30)*s,0);c.stroke();}
    c.fillStyle='#9aa3ad';c.fillRect(-16*s,-2.5*s,32*s,5*s);
    c.fillStyle='#d3d8df';c.strokeStyle=INK;c.lineWidth=2.6*s;c.beginPath();for(let i=0;i<8;i++){const a=i/8*2*Math.PI+Math.PI/8;c.lineTo(Math.cos(a)*17*s,Math.sin(a)*17*s);}c.closePath();c.fill();c.stroke();
    c.fillStyle='#7f8a96';c.beginPath();c.arc(0,0,7*s,0,7);c.fill();
    c.fillStyle=(t*1.4)%1<.5?'#ff5a5a':'#5a2222';c.beginPath();c.arc(0,-17*s,3.2*s,0,7);c.fill();c.restore();},
  lixo(c,x,y,u,t){const s=u/100;c.save();c.translate(x,y);c.rotate(t*.7);c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=2.2*s;
    c.fillStyle='#2f5fa8';c.beginPath();c.moveTo(10*s,-4*s);c.lineTo(34*s,-14*s);c.lineTo(38*s,2*s);c.lineTo(13*s,9*s);c.closePath();c.fill();c.stroke();
    c.fillStyle='#8a8f98';c.beginPath();c.moveTo(-15*s,-10*s);c.lineTo(8*s,-15*s);c.lineTo(15*s,6*s);c.lineTo(-5*s,15*s);c.lineTo(-17*s,4*s);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#5d636c';c.lineWidth=1.4*s;c.beginPath();c.moveTo(-9*s,-6*s);c.lineTo(4*s,-9*s);c.moveTo(-10*s,3*s);c.lineTo(6*s,0);c.stroke();
    c.strokeStyle=INK;c.lineWidth=2*s;c.beginPath();c.moveTo(-11*s,-8*s);c.lineTo(-24*s,-27*s);c.stroke();c.fillStyle='#f2b33d';c.beginPath();c.arc(-24*s,-27*s,3.2*s,0,7);c.fill();c.restore();
    for(let i=0;i<3;i++){const a=t*1.6+i*2.1;c.fillStyle='#b8bec8';c.beginPath();c.arc(x+Math.cos(a)*u*.36,y+Math.sin(a)*u*.2,u*.02,0,7);c.fill();}},
  nave(c,x,y,u,t,n){const s=u/100,yy=y+Math.sin(t*2)*2*s;c.save();c.translate(x-6*s,yy);c.lineJoin='round';
    const fl=10+5*Math.sin(t*23);c.fillStyle='rgba(255,170,60,.9)';c.beginPath();c.moveTo(-34*s,-7*s);c.lineTo((-34-fl)*s,0);c.lineTo(-34*s,7*s);c.fill();
    c.fillStyle='#ece6da';c.strokeStyle=INK;c.lineWidth=2.6*s;c.beginPath();c.moveTo(-34*s,-15*s);c.lineTo(18*s,-15*s);c.quadraticCurveTo(44*s,-13*s,46*s,0);c.quadraticCurveTo(44*s,13*s,18*s,15*s);c.lineTo(-34*s,15*s);c.closePath();c.fill();c.stroke();
    c.fillStyle='#f2b33d';c.fillRect(-32*s,7*s,48*s,4*s);
    c.fillStyle='#6fd6ea';c.beginPath();c.ellipse(32*s,-3*s,7*s,5*s,0,0,7);c.fill();c.stroke();
    c.fillStyle='#24222f';c.beginPath();c.arc(-8*s,-1*s,12*s,0,7);c.fill();c.stroke();c.restore();
    drawPeca(c,n,t,x-14*s,yy-1*s,u*.36,.6);},
  buraco(c,x,y,u,t,cor){const R=u*.15,col=hex(cor).join(',');c.save();c.translate(x,y);
    const g=c.createRadialGradient(0,0,R,0,0,R*3.1);g.addColorStop(0,`rgba(${col},.45)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(0,0,R*3.1,0,7);c.fill();
    c.rotate(-.35);const disco=(a0,a1)=>{for(let i=0;i<4;i++){const r=R*(1.55+i*.3);c.strokeStyle=`rgba(${col},${(.95-i*.18).toFixed(2)})`;c.lineWidth=R*.24;c.setLineDash([R*.7,R*.25]);c.lineDashOffset=-t*R*2*(1+i*.25);
      c.beginPath();c.ellipse(0,0,r,r*.3,0,a0,a1);c.stroke();}c.setLineDash([]);};
    disco(Math.PI,2*Math.PI);c.fillStyle='#000';c.beginPath();c.arc(0,0,R,0,7);c.fill();c.strokeStyle='rgba(255,230,200,.95)';c.lineWidth=R*.12;c.beginPath();c.arc(0,0,R*1.06,0,7);c.stroke();
    disco(0,Math.PI);c.restore();},
  campo(c,a,b,t,u){const f=(.7+.3*Math.sin(t*9)*Math.sin(t*3.7)).toFixed(2);c.save();c.lineCap='round';
    c.strokeStyle=`rgba(90,220,255,${(.28*f).toFixed(2)})`;c.lineWidth=u*.13;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
    c.strokeStyle=`rgba(190,245,255,${f})`;c.lineWidth=u*.035;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
    for(const q of [a,b]){c.fillStyle='#d9f6ff';c.strokeStyle=INK;c.lineWidth=u*.02;c.beginPath();c.arc(q[0],q[1],u*.045,0,7);c.fill();c.stroke();}c.restore();},
};
