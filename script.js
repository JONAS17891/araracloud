const $=(s,r=document)=>r.querySelector(s);
const h=(t,c,x,a)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;if(a)for(const k in a)e.setAttribute(k,a[k]);return e};
const de=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
let goTo=y=>scrollTo(0,y);

// Scroll levemente mais lento e suave (só com mouse)
if(!reduce&&!matchMedia('(pointer:coarse)').matches){
 let cur=scrollY,tgt=cur,run=false;
 const max=()=>de.scrollHeight-innerHeight;
 const tick=()=>{cur+=(tgt-cur)*.085;if(Math.abs(tgt-cur)<.5){cur=tgt;run=false}scrollTo(0,cur);if(run)requestAnimationFrame(tick)};
 const go=()=>{if(!run){run=true;requestAnimationFrame(tick)}};
 addEventListener('wheel',e=>{
  if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  e.preventDefault();
  tgt=Math.max(0,Math.min(max(),tgt+(e.deltaMode===1?e.deltaY*32:e.deltaY)*.9));go();
 },{passive:false});
 addEventListener('scroll',()=>{if(!run)cur=tgt=scrollY});
 goTo=y=>{tgt=Math.max(0,Math.min(max(),y));go()};
}
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(!a)return;
 const t=a.getAttribute('href')==='#topo'?document.body:$(a.getAttribute('href'));if(!t)return;
 e.preventDefault();
 goTo(t===document.body?0:t.getBoundingClientRect().top+scrollY);
 if(reduce)scrollTo({top:t===document.body?0:t.offsetTop});
});

// Decolagem ao escolher plano
const launch=h('div','launch');launch.append(h('img',null,null,{src:'logo.png',alt:''}),h('p',null,''),h('i'));
document.body.append(launch);
addEventListener('pageshow',e=>{if(e.persisted){launch.classList.remove('on');document.querySelectorAll('.lift').forEach(x=>x.classList.remove('lift'))}});
function takeoff(e,btn,name){
 if(e.metaKey||e.ctrlKey||e.shiftKey||reduce)return;
 e.preventDefault();
 const r=btn.getBoundingClientRect();
 launch.style.setProperty('--x',r.left+r.width/2+'px');launch.style.setProperty('--y',r.top+r.height/2+'px');
 launch.querySelector('p').textContent='Decolando com o plano '+name+'…';
 btn.closest('.plan').classList.add('lift');
 requestAnimationFrame(()=>launch.classList.add('on'));
 setTimeout(()=>{location.href=btn.href},1900);
}


document.querySelectorAll('.plan .btn[data-plan]').forEach(b=>b.addEventListener('click',e=>takeoff(e,b,b.dataset.plan)));
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add('ready')));
