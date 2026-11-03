/* MentorKlubb v0.5 — shared desktop chrome on separate pages.
   UI only. Reads cached view counters, never mutates Expedition profile. */
(()=>{'use strict';
const source = location.pathname.split('/').pop().toLowerCase();
const active=source.includes('nyelvtanulas')?'english':source.includes('expedicio')?'expedition':source.includes('ai_teszt')?'tests':'home';
const nav=[['home','Kezdőlap','⌂','index.html#home'],['materials','Anyagok','▱','index.html#materials'],['tests','Tesztek','☑','index.html#tests'],['learning','Tanulás','▷','index.html#learning'],['english','Angol','🇬🇧','Mentorklubb_Nyelvtanulas.html'],['expedition','Expedíció','◉','MentorKlubb_Expedicio.html'],['stats','Statisztika','▥','index.html#materials'],['calendar','Naptár','▣','index.html#home'],['achievements','Eredmények','♜','MentorKlubb_Expedicio.html'],['settings','Beállítások','⚙','index.html#home'],['help','Súgó','?','index.html#home']];
const key='mk-shell-counters-display-v1';
function mount(){if(document.querySelector('.aur-c-sidebar')||window.innerWidth<1050)return;
 document.body.classList.add('mk-shell-ready');
 const sidebar=document.createElement('aside');sidebar.className='aur-c-sidebar mk-standalone-sidebar';sidebar.setAttribute('aria-label','MentorKlubb bal oldali menü');sidebar.innerHTML='<div class="aur-c-side-links">'+nav.map(([id,label,icon,url],idx)=>`${idx===9?'<div class="aur-c-side-divider"></div>':''}<a class="aur-c-side-link ${active===id?'is-active':''}" ${active===id?'aria-current="page"':''} href="${url}"><span class="aur-c-side-icon">${icon}</span><span>${label}</span></a>`).join('')+'</div><div class="aur-c-side-art" aria-hidden="true"></div>';
 const header=document.createElement('header');header.className='mk-global-top';header.innerHTML=`<a class="mk-global-brand" href="index.html#home"><span class="mk-global-monogram">M</span><span><b>Mentor<span>Klubb</span></b><small>TANULÁSI KÖZPONT</small></span></a><nav class="mk-global-counters" aria-label="Expedíció erőforrások"><a href="MentorKlubb_Expedicio.html" class="mk-global-counter"><span>⚡</span><div><small>Szikra</small><b data-mk-counter="spark">—</b></div></a><a href="MentorKlubb_Expedicio.html" class="mk-global-counter"><span>💎</span><div><small>Relikvia</small><b data-mk-counter="relic">—</b></div></a><a href="MentorKlubb_Expedicio.html" class="mk-global-counter"><span>🔥</span><div><b><span data-mk-counter="streak">—</span> nap</b><small>napi sorozat</small></div></a><a class="mk-global-profile" href="index.html#home" title="MentorKlubb főoldal" aria-label="MentorKlubb főoldal">◉</a></nav>`;
 document.body.prepend(sidebar);document.body.prepend(header);
 function set(s){if(!s||typeof s!=='object')return;for(const field of ['spark','relic','streak']){const node=document.querySelector(`[data-mk-counter="${field}"]`);const v=Number(s[field]);if(node&&Number.isFinite(v)&&v>=0)node.textContent=v.toLocaleString('hu-HU');}
  try{sessionStorage.setItem(key,JSON.stringify({spark:s.spark,relic:s.relic,streak:s.streak}))}catch(e){} }
 try{set(JSON.parse(sessionStorage.getItem(key)||'null'))}catch(e){}
 function status(){let d;try{d=window.MK_EXP?.status()?.state}catch(e){}if(d)set(d)}
 status();setInterval(status,2600);
 if(active==='english'){
  const n=Number(new URLSearchParams(location.search).get('lesson'));
  if(Number.isInteger(n)&&n>=1&&n<=16){
   setTimeout(()=>{const b=document.querySelector('.drill-button[data-drill="'+n+'"]');if(b)b.click();},200);
  }
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
