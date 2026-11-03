/* MentorKlubb Aurora B — Anyagok / existing lessons are moved, not replaced.
   No writes to user profiles, quiz history or currency. */
(() => {
 'use strict';
 const labels = [
  {key:'english',title:'Angol',subtitle:'16 kidolgozott lecke · önálló gyakorlás',icon:'🇬🇧',category:'language',badge:'NYELVTANULÁS',count:'16 lecke'},
  {key:'course-statistics',title:'Statisztika',subtitle:'Leíró statisztika · 4 modul',icon:'Σ',category:'data',badge:'ADATELEMZÉS',count:'4 modul'},
  {key:'course-sql',title:'Haladó SQL',subtitle:'Adatfeldolgozás és elemzés',icon:'SQL',category:'data',badge:'ADATELEMZÉS',count:'16 lecke'},
  {key:'course-cv',title:'Önéletrajz',subtitle:'Álláskeresési és karrieralapok',icon:'CV',category:'career',badge:'KARRIER',count:'8 lecke'},
  {key:'course-interview',title:'Állásinterjú A–Z',subtitle:'Felkészülés a kiválasztásra',icon:'A–Z',category:'career',badge:'KARRIER',count:'8 lecke'}
 ];
 const englishNames=["Tárgyak · this / that · 1–16", "További tárgyak · állítás és tagadás · 17–27", "Tulajdonságpárok · állító és tagadó mondatok", "Foglalkozások · he / she · What’s … job?", "További foglalkozások · tagadás", "Külső tulajdonságok · Milyen?", "További tulajdonságok · tagadás", "Birtoklás · Kié? · ruhadarabok", "Színek · család · ruhadarabok", "Többes szám · színek", "Foglalkozások többes számban", "Foglalkozások · tagadó/állító válaszok", "Tárgyak + tulajdonságok többes számban", "Többes szám folytatás", "Tárgyak helye · Van-e?", "Helyek többes számban · Vannak-e?"];
 const svg=(path)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
 const glyph={layers:svg('<path d="m12 2 9 6-9 6-9-6 9-6ZM3 12l9 6 9-6M3 16l9 6 9-6"/>'),search:svg('<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>'),arrow:svg('<path d="m8 5 7 7-7 7"/>'),book:svg('<path d="M12 6C8 3 5 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2Z"/><path d="M12 6v15"/>'),play:svg('<path d="m8 4 12 8-12 8V4Z"/>')};
 const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let selected='english',category='all';
 const items=new Map();
 function mount(){
  const library=document.getElementById('materialsNoLesson');if(!library||library.querySelector('.aur-b-root'))return;
  const hubs=Array.from(library.querySelectorAll(':scope > .course-hub'));
  for(const el of hubs){const key=Array.from(el.classList).find(c=>c.startsWith('course-')&&c!=='course-hub');if(key)items.set(key,el)}
  const originalIntro=library.querySelector('.course-library-intro');if(originalIntro)originalIntro.hidden=true;
  library.innerHTML='';
  const root=document.createElement('div');root.className='aur-b-root';root.innerHTML=`
   <div class="aur-b-heading"><div><span class="aur-b-overline">TANANYAGTÁR · AURORA B</span><h2>${glyph.layers} Anyagok</h2><p>Tananyagok, kurzusok és gyakorlati modulok egy helyen — a saját tempódban.</p></div><div class="aur-b-head-count">5 <span>tanulási terület</span></div></div>
   <div class="aur-b-searchbar"><span>${glyph.search}</span><input type="search" aria-label="Keresés a tananyagok között" placeholder="Keresés tananyagban, modulban, leckében…" id="aur-b-search" autocomplete="off"><kbd>Ctrl + K</kbd></div>
   <div class="aur-b-filters" role="group" aria-label="Témakör szűrése">
    <button type="button" data-aur-b-filter="all" class="is-active">▦ &nbsp; Összes</button>
    <button type="button" data-aur-b-filter="language">◉ &nbsp; Nyelv</button>
    <button type="button" data-aur-b-filter="data">⌘ &nbsp; Adat & IT</button>
    <button type="button" data-aur-b-filter="career">▣ &nbsp; Karrier</button>
   </div>
   <div class="aur-b-workspace"><section class="aur-b-list-panel" aria-label="Tanulási területek"><div class="aur-b-list-title"><h3>Tananyagok</h3><span>5 témakör</span></div><div id="aur-b-course-list"></div><p class="aur-b-helpnote">Válassz egy témakört a modulok megnyitásához.</p></section>
    <section class="aur-b-detail-panel" aria-label="Kiválasztott kurzus"><div class="aur-b-feature"><div class="aur-b-feature-copy"><span id="aur-b-badge" class="aur-b-course-tag">NYELVTANULÁS</span><h3 id="aur-b-course-title">Angol</h3><p id="aur-b-course-subtitle"></p><div class="aur-b-facts"><span>${glyph.layers} <b id="aur-b-course-count">16 lecke</b></span><span class="aur-b-small-note">Valódi, meglévő tananyag</span></div><div class="aur-b-feature-actions"><button type="button" id="aur-b-continue" class="aur-b-primary">Folytatás ${glyph.play}</button><button type="button" id="aur-b-open-all" class="aur-b-secondary">Megnyitás ${glyph.arrow}</button></div></div><div class="aur-b-hero-art" aria-hidden="true"></div></div>
    <div class="aur-b-modules-head"><h3 id="aur-b-modules-title">Leckék és modulok</h3><span id="aur-b-modules-count"></span></div><div class="aur-b-module-scroller" id="aur-b-hub-stage"></div><div class="aur-b-empty" id="aur-b-noresults" hidden>Nem található ilyen tananyag vagy lecke.</div></section></div>
   <p class="aur-b-footnote">A kurzusok címei és leckéi a meglévő MentorKlubb-forrásból származnak. A teljesítési százalékokat nem találjuk ki.</p>`;
  library.appendChild(root);if(originalIntro){originalIntro.style.display='none';library.appendChild(originalIntro)}
  const stage=root.querySelector('#aur-b-hub-stage');hubs.forEach(h=>stage.appendChild(h));
  const list=root.querySelector('#aur-b-course-list');list.innerHTML=labels.map(item=>`<button type="button" class="aur-b-course-option" data-aur-b-select="${item.key}" data-aur-b-category="${item.category}"><span class="aur-b-course-icon">${esc(item.icon)}</span><span class="aur-b-course-info"><b>${esc(item.title)}</b><small>${esc(item.subtitle)}</small></span><span class="aur-b-course-arrow">${glyph.arrow}</span></button>`).join('');
  root.addEventListener('click',e=>{const b=e.target.closest('[data-aur-b-select]');if(b){setSelected(b.dataset.aurBSelect);return}const f=e.target.closest('[data-aur-b-filter]');if(f){category=f.dataset.aurBFilter;root.querySelectorAll('[data-aur-b-filter]').forEach(x=>x.classList.toggle('is-active',x===f));applyFilter();return}});
  root.querySelector('#aur-b-continue').addEventListener('click',openCourse);
  root.querySelector('#aur-b-open-all').addEventListener('click',openCourse);
  const search=root.querySelector('#aur-b-search');search.addEventListener('input',applyFilter);
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&document.querySelector('#materials.page.active')){e.preventDefault();search.focus();search.select()}});
  setSelected('english');
 }
 function setSelected(key){selected=key;const el=document.querySelector('.aur-b-root');if(!el)return;
  const data=labels.find(x=>x.key===key)||labels[0];el.dataset.selected=key;
  for(const b of el.querySelectorAll('[data-aur-b-select]')){b.classList.toggle('is-active',b.dataset.aurBSelect===key);b.setAttribute('aria-pressed',String(b.dataset.aurBSelect===key))}
  el.querySelector('#aur-b-course-title').textContent=data.title;
  el.querySelector('#aur-b-badge').textContent=data.badge;
  el.querySelector('#aur-b-course-subtitle').textContent=data.subtitle;
  el.querySelector('#aur-b-course-count').textContent=data.count;
  el.querySelector('#aur-b-modules-title').textContent=key==='english'?'Angol · 16 lecke':'Leckék és modulok';
  const hub=items.get(key);for(const [k,v] of items){v.classList.toggle('aur-b-is-selected',k===key);v.hidden=k!==key}
  const stage=el.querySelector('#aur-b-hub-stage');
  let english=stage.querySelector('.aur-b-english-list');
  if(!english){english=document.createElement('div');english.className='aur-b-english-list';english.innerHTML=Array.from({length:16},(_,i)=>`<a class="aur-b-english-lesson" href="Mentorklubb_Nyelvtanulas.html?lesson=${i+1}#course" aria-label="Angol ${i+1}. lecke megnyitása"><span class="aur-b-module-num">${String(i+1).padStart(2,'0')}</span><span><b>${i+1}. ${esc(englishNames[i])}</b><small>Angol · Denisz · Tananyag és gyakorlás</small></span><span>${glyph.arrow}</span></a>`).join('');stage.prepend(english)}
  english.hidden=key!=='english';el.querySelector('#aur-b-modules-count').textContent=data.count;
  applyFilter();
 }
 function norm(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('hu-HU')}
 function applyFilter(){const el=document.querySelector('.aur-b-root');if(!el)return;
  const q=norm(el.querySelector('#aur-b-search').value.trim());const eligible=labels.filter(x=>(category==='all'||x.category===category)&&(!q||norm(x.title+' '+x.subtitle+' '+(items.get(x.key)?.textContent||'')).includes(q)));
  for(const b of el.querySelectorAll('[data-aur-b-select]'))b.hidden=!eligible.some(x=>x.key===b.dataset.aurBSelect);
  if(eligible.length&&!eligible.some(x=>x.key===selected))setSelected(eligible[0].key);
  el.querySelector('#aur-b-noresults').hidden=!!eligible.length;
  el.querySelector('.aur-b-detail-panel').classList.toggle('aur-b-detail-hidden',!eligible.length);
 }
 function openCourse(){if(selected==='english'){location.href='Mentorklubb_Nyelvtanulas.html#course';return}
 const hub=items.get(selected);const first=hub?.querySelector('.catalog-lesson-link');if(first)first.click();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
