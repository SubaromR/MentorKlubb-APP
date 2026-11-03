/* MentorKlubb Aurora C · Kezdőlap v0.4.0
   Only view construction / navigation. Never mutates learning progress, currency or rewards.
   V0.3's existing script reference is reused, so no 3.4 MB HTML overwrite is required.
*/
(() => {
  'use strict';
  const EXP_URL = 'MentorKlubb_Expedicio.html';
  const EN_URL = 'Mentorklubb_Nyelvtanulas.html';
  const paths = {
    home: ['Kezdőlap','home','house'], materials: ['Anyagok','materials','layers'],
    tests: ['Tesztek','tests','check'], learning: ['Tanulás','learning','play']
  };
  const icons = {
    house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    layers:'<path d="m12 2 9 6-9 6-9-6 9-6ZM3 12l9 6 9-6M3 16l9 6 9-6"/>',
    check:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/>',
    play:'<path d="m8 4 13 8-13 8z"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
    chart:'<path d="M5 20V11m7 9V4m7 16v-8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    medal:'<circle cx="12" cy="14" r="5"/><path d="m8 2 4 7 4-7M8 2H4l4 8M16 2h4l-4 8"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2M2 12h3m14 0h3M4.9 19.1l2.2-2.2m9.8-9.8 2.2-2.2"/>',
    help:'<circle cx="12" cy="12" r="10"/><path d="M9.5 9a3 3 0 1 1 4 2.8c-1 .4-1.5 1-1.5 2.2M12 17h.01"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m12 12 8-8"/>',
    book:'<path d="M12 6c-4-3-7-3-10-2v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2Z"/><path d="M12 6v15"/>',
    spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    trophy:'<path d="M7 3h10v5a5 5 0 0 1-10 0V3ZM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    arrow:'<path d="m9 18 6-6-6-6"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.3-5 3-7 8-7s7.7 2 8 7"/>'
  };
  function i(name,attrs=''){return `<svg ${attrs} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.spark}</svg>`}
  const ENGLISH = `<span aria-hidden="true" class="aur-c-flag">🇬🇧</span>`;
  const sidebarItems = [
    ['home','Kezdőlap','house'],['materials','Anyagok','layers'],['tests','Tesztek','check'],
    ['learning','Tanulás','play'],['english','Angol','flag'],['expedition','Expedíció','compass'],
    ['stats','Statisztika','chart'],['calendar','Naptár','calendar'],['achievements','Eredmények','medal'],
    ['settings','Beállítások','settings'],['help','Súgó','help']
  ];
  function navIcon(name){return name==='flag'?ENGLISH:i(name)}
  function sidebarMarkup(){return `<aside class="aur-c-sidebar" aria-label="Oldalsó főmenü">
    <div class="aur-c-side-links">${sidebarItems.map(([id,label,icon],idx)=>`${idx===9?'<div class="aur-c-side-divider"></div>':''}<button type="button" class="aur-c-side-link ${id==='home'?'is-active':''}" data-aur-c-nav="${id}" aria-label="${label}"><span class="aur-c-side-icon">${navIcon(icon)}</span><span>${label}</span></button>`).join('')}</div>
    <div class="aur-c-side-art" aria-hidden="true"></div></aside>`}
  function homeMarkup(){return `<div class="aur-c-home" aria-label="MentorKlubb kezdőlap">
   <section class="aur-c-hero" aria-labelledby="home-title"><div class="aur-c-hero-copy"><span class="aur-c-kicker">SAJÁT TANULÁSI KÖZPONT</span><h2 id="home-title">MentorKlubb<br><em>Tanulási Központ</em></h2><p>Fedezd fel a tananyagokat, gyakorolj, tesztelj<br class="aur-c-desktop-only"> és kövesd a fejlődésed egy helyen.</p></div><div class="aur-c-hero-books" role="img" aria-label="Neonfényű tanulókönyvek"></div></section>
   <div class="aur-c-shortcuts" aria-label="Gyorsindítók">
    <button class="aur-c-tile aur-c-tile-materials" data-aur-c-nav="materials"><span>${i('book')}</span><strong>Tananyagok</strong></button>
    <button class="aur-c-tile aur-c-tile-practice" data-aur-c-nav="practice"><span>${i('target')}</span><strong>Gyakorlás</strong></button>
    <button class="aur-c-tile aur-c-tile-tests" data-aur-c-nav="tests"><span>${i('check')}</span><strong>Tesztek</strong></button>
    <button class="aur-c-tile aur-c-tile-english" data-aur-c-nav="english"><span class="aur-c-bigflag">🇬🇧</span><strong>Angol</strong></button>
    <button class="aur-c-tile aur-c-tile-expedition" data-aur-c-nav="expedition"><span>${i('trophy')}</span><strong>Expedíció</strong></button>
   </div>
   <div class="aur-c-bottom-panels">
    <section class="aur-c-panel" aria-label="Heti haladás"><div class="aur-c-panel-head"><div>${i('chart')}<h3>Heti haladás</h3></div><button type="button" data-aur-c-nav="stats" aria-label="Heti haladás részletei">Részletek ${i('arrow')}</button></div><p class="aur-c-demo-note">Látványadat · részletes követés később</p><div class="aur-c-weekbars" role="img" aria-label="Szemléltető heti oszlopdiagram, nem valós mért adatok"><div style="--height:31%"><b></b><small>H</small></div><div style="--height:53%"><b></b><small>K</small></div><div style="--height:43%"><b></b><small>Sze</small></div><div style="--height:76%"><b></b><small>Cs</small></div><div style="--height:23%" class="purple"><b></b><small>P</small></div><div style="--height:55%" class="purple"><b></b><small>Szo</small></div><div style="--height:68%" class="purple"><b></b><small>V</small></div></div></section>
    <section class="aur-c-panel" aria-label="Tanulási célom"><div class="aur-c-panel-head"><div>${i('target')}<h3>Tanulási célom</h3></div><button type="button" data-aur-c-nav="goals">Kezelés ${i('arrow')}</button></div><p class="aur-c-demo-note">Tervezett cél · szemléltető adat</p><div class="aur-c-goal-body"><strong>B2 angol szint elérése</strong><div class="aur-c-goal-row"><div class="aur-c-goal-track"><span style="width:58%"></span></div><b>58%</b></div><div class="aur-c-goal-tags"><span>${i('book')} 12 / 20 modul</span><span>${i('clock')} ~ 6 óra</span><span>${i('medal')} B2</span></div></div></section>
    <section class="aur-c-panel" aria-label="Következő teendő"><div class="aur-c-panel-head"><div>${i('calendar')}<h3>Következő teendő</h3></div><button type="button" data-aur-c-nav="calendar">Összes ${i('arrow')}</button></div><p class="aur-c-demo-note">Ajánlott példa · később személyre szabható</p><button class="aur-c-next" type="button" data-aur-c-nav="english"><span class="aur-c-next-play">${i('play')}</span><span><strong>Angol – Kiejtés: 3. lecke</strong><small>Tanulás megnyitása</small></span><span class="aur-c-next-arrow">${i('arrow')}</span></button></section>
   </div>
  </div>`}
  function openEnglish(){const old=document.getElementById('openEnglishBtn');if(old)old.click();else location.href=EN_URL}
  function switchPage(page){const old=document.querySelector(`.nav-button[data-page="${page}"]`);if(old)old.click()}
  function modal(title,body){const previous=document.getElementById('aur-c-modal');if(previous)previous.remove();const overlay=document.createElement('div');overlay.id='aur-c-modal';overlay.className='aur-c-modal-backdrop';overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="aur-c-dialog-title" class="aur-c-modal"><h2 id="aur-c-dialog-title"></h2><p></p><button type="button" class="aur-c-modal-close">Bezárás</button></section>`;overlay.querySelector('h2').textContent=title;overlay.querySelector('p').textContent=body;document.body.appendChild(overlay);const close=()=>overlay.remove();overlay.querySelector('button').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});overlay.querySelector('button').focus();const key=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',key)}};document.addEventListener('keydown',key,{once:true});}
  function handleNav(id){
   if(paths[id])return switchPage(id);
   if(id==='english'||id==='practice')return openEnglish();
   if(id==='expedition'||id==='achievements')return location.assign(EXP_URL);
   if(id==='stats')return modal('Statisztika','A heti haladás diagramja jelenleg látványadat. A részletes, mért tanulási statisztikákat egy későbbi fejlesztésben kapcsoljuk össze az eredményekkel.');
   if(id==='calendar')return modal('Tanulási naptár','A naptár helye elkészült, a feladatok és határidők kezelése egy későbbi kiadásban érkezik.');
   if(id==='goals')return modal('Tanulási célom','A B2-cél és a hozzá tartozó százalék még látványadat. A valódi célkövetést külön készítjük el.');
   if(id==='settings')return modal('Beállítások','A megjelenés jelenleg a kiválasztott Aurora C sötét témát használja. A részletes beállítások elkészítése későbbi lépés.');
   if(id==='help')return modal('Súgó','A bal oldali menüvel navigálhatsz. A Tananyagok, Tesztek, Tanulás, Angol és Expedíció meglévő oldalait már megnyithatod.');
  }
  function updateActive(){const current=document.querySelector('.page.active')?.id||'home';document.querySelectorAll('.aur-c-side-link').forEach(el=>{const active=el.dataset.aurCNav===current;el.classList.toggle('is-active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')})}
  function updateStatus(){let s;try{s=window.MK_EXP?.status()?.state}catch(_){s=null}
   const value=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v==null?'—':Number(v).toLocaleString('hu-HU')};
   value('aur-c-spark',s?.spark);value('aur-c-relic',s?.relic);value('aur-c-streak',s?.streak);
   if(s){try{sessionStorage.setItem('mk-shell-counters-display-v1',JSON.stringify({spark:s.spark,relic:s.relic,streak:s.streak}))}catch(_){}}
  }
  function mount(){if(!window.matchMedia('(min-width:1050px)').matches)return;const home=document.querySelector('.portal-home'),head=document.querySelector('.top-header');if(!home||!head||document.querySelector('.aur-c-home'))return;
   document.body.classList.add('aur-c-ready');
   const sidebar=document.createElement('div');sidebar.innerHTML=sidebarMarkup();document.body.appendChild(sidebar.firstElementChild);
   const status=document.createElement('div');status.className='aur-c-top-status';status.setAttribute('aria-label','Expedíció erőforrások');status.innerHTML=`<a href="${EXP_URL}" class="aur-c-count"><span class="aur-c-bolt">⚡</span><span><small>Szikra</small><b id="aur-c-spark">—</b></span></a><a href="${EXP_URL}" class="aur-c-count"><span class="aur-c-diamond">💎</span><span><small>Relikvia</small><b id="aur-c-relic">—</b></span></a><a href="${EXP_URL}" class="aur-c-count"><span class="aur-c-fire">🔥</span><span><b><span id="aur-c-streak">—</span> nap</b><small>napi sorozat</small></span></a><button class="aur-c-account" type="button" data-aur-c-nav="settings" aria-label="Beállítások">${i('user')}</button>`;head.append(status);
   home.innerHTML=homeMarkup();
   document.addEventListener('click',e=>{const nav=e.target.closest('[data-aur-c-nav]');if(nav){e.preventDefault();handleNav(nav.dataset.aurCNav)}});
   document.querySelectorAll('.nav-button').forEach(x=>x.addEventListener('click',()=>requestAnimationFrame(updateActive)));
   window.addEventListener('hashchange',updateActive);
   updateActive();updateStatus();window.setInterval(updateStatus,2600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
