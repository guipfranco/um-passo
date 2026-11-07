function setBanner(title,sub){ if(title!==null) $('#bTitle').innerHTML=enrich(title); $('#bSub').innerHTML=enrich(sub||''); }
function anim(id,name){ const el=els.get(id); if(!el) return; const f=el.firstChild; f.classList.remove(name); void f.offsetWidth; f.classList.add(name); }
function shake(level){ const c='shake'+Math.min(level,3); stage.classList.remove('shake1','shake2','shake3'); void stage.offsetWidth; stage.classList.add(c); }
function popup(big,small,cor){ const p=document.createElement('div'); p.className='popup'; p.style.setProperty('--pc',cor); if(big.length>9) p.style.fontSize=big.length>14?'30px':'38px'; p.innerHTML=`${big}<small>${small}</small>`; stage.appendChild(p); setTimeout(()=>p.remove(),1000); }
function sparks(t,cor){
  const cx=`calc(${t.x}*(var(--cell) + var(--gap)) + var(--gap) + var(--cell)*.7)`, cy=`calc(${t.y}*(var(--cell) + var(--gap)) + var(--gap) + var(--cell)*.35)`;
  for(let i=0;i<18;i++){
    const s=document.createElement('i'); s.className='spark'; s.style.background=cor; s.style.left=cx; s.style.top=cy;
    const a=Math.random()*6.28, d=40+Math.random()*90;
    s.animate([{transform:'translate(-4px,-4px)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) rotate(200deg)`,opacity:0}],{duration:700,easing:'cubic-bezier(.2,.8,.3,1)'});
    stage.appendChild(s); setTimeout(()=>s.remove(),700);
  }
}
let countTimer=null;
function countTo(v){
  const el=$('#dayTotal'); clearInterval(countTimer);
  el.classList.toggle('neg',v<0);
  let cur=S.shown??0; S.shown=v;
  if(S.skip){ el.textContent=fmt(v); return; }
  const dir=v>=cur?1:-1;
  countTimer=setInterval(()=>{ const step=Math.max(1,Math.ceil(Math.abs(v-cur)/6)); cur+=dir*step; if(dir>0?cur>=v:cur<=v){ cur=v; clearInterval(countTimer); } el.textContent=fmt(cur); },30);
}

