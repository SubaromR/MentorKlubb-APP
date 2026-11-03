/* MentorKlubb – Aurora Tesztek v0.6
   UI-only progressive navigation. Does not mutate profiles, currency, XP or legacy quiz history.
   Existing legacy lesson buttons remain owned by the original test engine. */
(() => {
 'use strict';
 const rootId='aur6-tests';
 const names={
  english:{title:'Angol',eyebrow:'NYELVTANULÁS',icon:'🇬🇧',color:'cyan',description:'16 kidolgozott lecke. A modulbeosztást később határozzuk meg.',n:'16 lecke'},
  statistics:{title:'Statisztika',eyebrow:'ADATELEMZÉS',icon:'Σ',color:'mint',description:'4 meglévő modul – a részletes leckebontás kialakítás alatt.',n:'4 modul'},
  sql:{title:'Haladó SQL',eyebrow:'ADAT & IT',icon:'SQL',color:'purple',description:'16 lecketeszt 5 valódi modulban.',n:'5 modul · 16 lecke'},
  cv:{title:'Önéletrajz',eyebrow:'KARRIER',icon:'CV',color:'blue',description:'8 lecketeszt az álláskeresés és a pályázati anyagok témáiból.',n:'8 lecke'},
  interview:{title:'Állásinterjú A–Z',eyebrow:'KARRIER',icon:'A–Z',color:'violet',description:'8 lecketeszt és egy meglévő összegző kérdéssor.',n:'8 lecke'}
 };
 const enNames=['Tárgyak · this / that','További tárgyak és tagadás','Tulajdonságpárok','Foglalkozások · he / she','További foglalkozások','Külső tulajdonságok','További tulajdonságok','Birtoklás és ruhadarabok','Színek, család és ruhadarabok','Színek többes számban','Foglalkozások többes számban','Foglalkozások: tagadás és javítás','Tulajdonságok és ellentétek','Többes szám folytatása','Tárgyak helye','Helyek többes számban'];
 const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icons={star:'✦',book:'▤',lock:'♧',trophy:'🏆',arrow:'→'};
 const courseOrder=['english','statistics','sql','cv','interview'];
 let data={},selected=null,activeStep='lesson',moduleIndex=0;
 let view='categories',host,legacy;
 let messageTimer;
 const sqlModuleNames=['Alapok és lekérdezések','Adattisztítás és CASE','Csoportosítás és trendek','Window függvények','Power BI és vizualizáció'];
 function readSources(){
  const selectors={cv:'#test-suite-cv',interview:'#test-suite-interview',sql:'#test-suite-sql',statistics:'#test-suite-statistics'};
  for(const [key,sel] of Object.entries(selectors)){
   const suite=legacy.querySelector(sel);if(!suite)continue;
   let mods=[];
   if(key==='sql'){
     const children=Array.from(suite.children);let idx=-1;
     children.forEach(child=>{
       if(child.matches('.test-module-strip')){idx++;mods.push({title:sqlModuleNames[idx]||`Modul ${idx+1}`,lessons:[]});}
       if(child.matches('.test-path-grid')){
        if(idx<0){idx=0;mods.push({title:sqlModuleNames[0],lessons:[]});}
        mods[idx].lessons.push(...parseButtons(child));
       }
     });
   } else if(key==='statistics'){
     mods=Array.from(suite.querySelectorAll('.test-stat-module-card')).map((btn,i)=>({title:`Modul ${i+1}`,lessons:[],existingModule:btn,detail:btn.textContent.trim().replace(/\s+/g,' ')}));
   } else {
     mods=[{title:key==='cv'?'Önéletrajz – alapmodul':'Állásinterjú – alapmodul',lessons:parseButtons(suite)}];
   }
   data[key]={...names[key],mods};
  }
  data.english={...names.english,mods:[],lessons:enNames.map((title,i)=>({num:String(i+1).padStart(2,'0'),title,id:`english-${i+1}`,english:i+1}))};
 }
 function parseButtons(el){return Array.from(el.querySelectorAll('.test-path-item')).map(btn=>({id:btn.dataset.lesson,num:btn.querySelector('.test-path-no')?.textContent.trim()||'',title:btn.querySelector('.test-path-copy strong')?.textContent.trim()||btn.textContent.trim(),button:btn}));}
 function loadResults(){let a=[];try{a=JSON.parse(localStorage.getItem('mentor_knowledge_results_2026')||'[]');if(!Array.isArray(a))a=[];}catch(_e){}return a.filter(x=>x&&typeof x.title==='string'&&typeof x.total==='number'&&typeof x.score==='number');}
 function ring(percent,sub='haladás'){
  const known=Number.isFinite(percent),p=known?Math.max(0,Math.min(100,percent)):0;
  return `<div class="a6-ring" style="--ring:${p}%" aria-label="${known?`${p}%`:'Nincs mért érték'}"><span class="a6-ring-inner"><b>${known?`${p}%`:'—'}</b><small>${safe(sub)}</small></span></div>`;
 }
 function hint(text){let toast=host.querySelector('.a6-toast');if(!toast)return;toast.textContent=text;toast.hidden=false;clearTimeout(messageTimer);messageTimer=setTimeout(()=>toast.hidden=true,4400);}
 function stage(head,content){host.querySelector('#a6-space').innerHTML=head+content;host.querySelectorAll('button[data-a6]').forEach(btn=>btn.addEventListener('click',act));}
 function header(){
  const isPath=view==='path';
  const c=selected&&data[selected];
  const title=isPath?'Tanulási útvonal':(activeStep==='lesson'?'Lecketesztek':activeStep==='module'?'Modulzáró tesztek':'Témakörzáró vizsga');
  const desc=isPath?'Teljesítsd a lecketeszteket, majd a modul- és témakörzáró vizsgákat!':`Választott témakör: ${c?.title||''}. A meglévő tesztek és mentések változatlanok.`;
  return `<header class="a6-header a62-header"><div><div class="a6-kicker">TESZTEK / ${safe(c?.title||'TÉMAKÖR')}</div><div class="a62-heading"><span class="a62-head-icon" aria-hidden="true">▤</span><div><h2>${title}</h2><p>${safe(desc)}</p></div></div></div><div class="a6-head-trail"><button type="button" data-a6="${isPath?'back':'back-path'}">← ${isPath?'Témakörökhöz':'Tanulási útvonal'}</button></div></header>`;
 }
 function stageIcon(kind){
  if(kind==='lesson')return `<svg viewBox="0 0 90 90" fill="none" aria-hidden="true"><path d="M45 25C34 19 20 19 11 22V66c11-4 25-3 34 4V25Zm0 0c11-6 25-6 34-3V66c-11-4-25-3-34 4V25Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M45 25v45M19 33c8-2 15-1 20 2M51 35c6-3 13-4 20-2M19 45c8-2 15-1 20 2M51 47c6-3 13-4 20-2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  if(kind==='module')return `<svg viewBox="0 0 90 90" fill="none" aria-hidden="true"><path d="m45 12 32 17-32 17-32-17 32-17ZM13 43l32 17 32-17M13 57l32 17 32-17" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m45 46 32-17" stroke="currentColor" stroke-width="3"/></svg>`;
  return `<svg viewBox="0 0 90 90" fill="none" aria-hidden="true"><path d="m10 33 19 15 16-28 16 28 19-15-8 34H18L10 33ZM22 75h46" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="10" cy="29" r="4" fill="currentColor"/><circle cx="45" cy="17" r="4" fill="currentColor"/><circle cx="80" cy="29" r="4" fill="currentColor"/></svg>`;
 }
 function path(){
  view='path';const c=data[selected];if(!c)return categories();
  const total=c.lessons?.length||c.mods?.reduce((n,m)=>n+m.lessons.length,0)||0;
  const tile=(kind,number,title,description,stars,status)=>`<button type="button" class="a62-tile a62-${kind}" data-a6="step" data-step="${kind==='final'?'final':kind}" aria-label="${safe(title)} megtekintése"><span class="a62-status ${kind==='lesson'?'a62-unlocked':''}" aria-hidden="true">${kind==='lesson'?'↗':'🔒'}</span><span class="a62-graphic">${stageIcon(kind)}</span><strong>${title}</strong><span class="a62-tile-desc">${description}</span><span class="a62-stars" aria-label="${stars} csillagos nehézség">${'★'.repeat(stars)}<span>${'☆'.repeat(3-stars)}</span></span><span class="a62-tile-cta">${kind==='lesson'?'Tesztek megnyitása':'Részletek megtekintése'} →</span></button>`;
  const heading=header();
  stage(heading,`<div class="a62-path"><div class="a62-step-row">${tile('lesson',1,'Lecketesztek','Egyes leckék tudásellenőrzése',1)}<div class="a62-arrow a62-arrow-cyan" aria-hidden="true">➜</div>${tile('module',2,'Modulzáró teszt','A modul teljes anyagából',2)}<div class="a62-arrow a62-arrow-purple" aria-hidden="true">➜</div>${tile('final',3,'Témakörzáró teszt','Az összes modulból – a legnehezebb',3)}</div><section class="a62-bottom"><div class="a62-bottom-label"><span class="a62-small-icon">${safe(c.icon)}</span><div><b>Jelenlegi témakör: ${safe(c.title)}</b><small>${total?`${total} lecketeszt`:'A leckék beosztása előkészítés alatt'} · 70% / 75% / 80% sikerességi küszöbök</small></div></div><div class="a62-progress"><div><span>Teljes haladás</span><strong>—</strong></div><div class="a62-progress-track"><span style="width:0%"></span></div><small>A korábbi teszteredmények egységes összesítése után jelenik meg.</small></div></section><p class="a62-path-footnote">A modul- és témakörzáró vizsgák feloldási logikája még fejlesztés alatt áll. A kártyák megnyithatók, az elkészületlen vizsgák nem indíthatók.</p></div>`);
 }
 function list(){
  view='list';const c=data[selected];if(!c)return categories();
  const results=loadResults();const relevant=results.filter(x=>x.title.toLocaleLowerCase('hu-HU').includes(c.title.toLocaleLowerCase('hu-HU')));
  stage(header(),`<div class="a62-list-view"><section class="a6-body-panel" id="a6-current-panel"></section><aside class="a6-side-panel"><div class="a6-panel-heading"><h3>◷ Eredmény</h3><span>Mentett adatok</span></div>${relevant.length?relevant.slice(0,4).map(x=>`<div class="a6-mini-result"><b>${safe(x.title)}</b><span>${Math.round(100*x.score/Math.max(1,x.total))}%</span></div>`).join(''):'<p>Ehhez a témakörhöz még nincs egységesen mentett eredmény.</p>'}<div class="a6-review-guide"><b>Javasolt sikerességi küszöbök</b><span>Lecketeszt <strong>70%</strong></span><span>Modulzáró <strong>75%</strong></span><span>Témakörzáró <strong>80%</strong></span><small>A végleges feloldási és jutalmazási logika a következő fejlesztési szakasz.</small></div></aside></div>`);
  steps();
 }

 function boot(){
  const target=document.getElementById('testsNoLesson');if(!target||target.querySelector(`#${rootId}`))return;
  legacy=document.createElement('div');legacy.id='aur6-legacy-tests';legacy.hidden=true;
  Array.from(target.children).forEach(child=>legacy.appendChild(child));
  target.appendChild(legacy);
  host=document.createElement('div');host.id=rootId;host.className='a6-root';host.innerHTML='<div id="a6-space"></div><div class="a6-toast" role="status" aria-live="polite" hidden></div>';
  target.prepend(host);
  readSources();categories();
  window.addEventListener('pageshow',()=>{if(view==='list')list();else if(view==='path')path();else categories()});
 }
 function resultPanel(){const hist=loadResults();
  return `<section class="a6-results"><div class="a6-panel-heading"><h3>◷ Korábbi eredmények</h3><span>${hist.length?`${hist.length} mentett összegző`:'Nincs mentett összegző'}</span></div><div class="a6-result-list">${hist.length?hist.slice(0,3).map(x=>`<div class="a6-result"><span class="a6-result-icon">✓</span><div><b>${safe(x.title)}</b><small>${new Date(x.date).toLocaleDateString('hu-HU')} · ${x.score}/${x.total} pont</small></div><strong>${Math.round(100*x.score/Math.max(1,x.total))}%</strong></div>`).join(''):'<div class="a6-no-results">A régebbi lecketesztek nem mentettek minden eredményt egységesen. Az előzményeket később bekötjük ide.</div>'}</div></section>`;
 }
 function categories(){
  view='categories';selected=null;
  const infos={
   english:{art:'english',symbol:'🇬🇧',sub:'16 lecke · modulbeosztás később'},
   statistics:{art:'statistics',symbol:'Σ',sub:'4 modul · meglévő tesztek'},
   sql:{art:'sql',symbol:'▤',sub:'5 modul · 16 lecketeszt'},
   cv:{art:'cv',symbol:'▤',sub:'1 modul · 8 lecketeszt'},
   interview:{art:'interview',symbol:'♙',sub:'1 modul · 8 lecketeszt'}
  };
  const cards=courseOrder.map(key=>{const c=data[key],i=infos[key];if(!c)return '';
   return `<button type="button" class="a6-topic a61-topic a61-${key}" data-a6="course" data-id="${key}" aria-label="${safe(c.title)} vizsgaszintjeinek megnyitása">
    <span class="a61-symbol" aria-hidden="true">${i.symbol}</span>
    <span class="a61-copy"><strong>${safe(c.title)}</strong><small>${safe(i.sub)}</small></span>
    <img class="a61-illustration" src="Aurora_Test_Art_${i.art}.webp" alt="" loading="lazy" aria-hidden="true">
    <span class="a61-chevron" aria-hidden="true">›</span>
    <span class="a61-progress-track" aria-label="Nincs egységesen mért haladási adat"><span class="a61-progress-fill" style="width:0%"></span></span>
    <span class="a61-progress-value" title="A régi lecketesztek eredményeinek egységes összesítése még nem készült el">—</span>
   </button>`;
  }).join('');
  const stats=[['🏆','5','témakör'],['▱','11+','modul'],['▤','48','lecketeszt'],['★','—','összhaladás']];
  const statHTML=stats.map((x,k)=>`<div class="a61-stat a61-stat-${k}"><span class="a61-stat-icon">${x[0]}</span><span class="a61-stat-value">${x[1]}<small>${x[2]}</small></span></div>`).join('');
  stage('',`<div class="a61-landing">
    <section class="a61-overview-row" aria-label="Tesztközpont áttekintése">
      <div class="a61-overview-main"><div class="a61-kicker">TESZTEK</div>
        <div class="a61-overview-title"><span class="a61-check-symbol" aria-hidden="true">☑</span><div><h2>Tesztek</h2><p>Ellenőrizd a tudásod és haladj a következő szintre!</p></div></div>
        <div class="a61-stats" aria-label="Jelenlegi tananyag-adatok">${statHTML}</div>
      </div>
      <section class="a61-overview-side">${ring(NaN,'összhaladás')}<div class="a61-divider"></div><div class="a61-overview-copy"><h3>Teljes előrehaladás</h3><p>Végezd el a teszteket, szerezz eredményeket, és kövesd a fejlődésed!</p><small>Az összesített haladás az eredmények egységes mentése után jelenik meg.</small></div></section>
    </section>
    <div class="a61-grid" aria-label="Válassz témakört">${cards}</div>
    <details class="a61-extras"><summary>Korábbi eredmények és részletek <span>⌄</span></summary>${resultPanel()}<p>A modulzáró és témakörzáró tesztek a témakörkártyákra kattintva érhetők el, amikor elkészülnek.</p></details>
  </div>`);
 }
 function steps(){const panel=host.querySelector('#a6-current-panel');if(!panel)return;
  host.querySelectorAll('.a6-stage').forEach(el=>el.classList.toggle('is-selected',el.dataset.step===activeStep));
  const c=data[selected];const mods=c.mods||[];
  if(activeStep==='final'){
   panel.innerHTML=`<div class="a6-panel-heading"><h3>♕ Témakörzáró vizsga</h3><span>3. szint</span></div><div class="a6-locked"><div class="a6-big-icon">🔒</div><h4>Végső kihívás – ${safe(c.title)}</h4><p>Az összes modulzáró sikeres teljesítése után nyílik meg. A kérdések 5% könnyű, 25% közepes és 70% nehéz arányban szerepelnek.</p><span class="a6-warning">A kérdéssor és a végső jutalom még tervezés alatt áll.</span></div>`;return;
  }
  if(activeStep==='module'){
   panel.innerHTML=`<div class="a6-panel-heading"><h3>⬡ Modulzáró tesztek</h3><span>2. szint</span></div><p class="a6-section-lead">Ezeket csak az adott modul összes lecketesztjének sikeres teljesítése után lehet majd indítani.</p><div class="a6-module-grid">${mods.length?mods.map((m,i)=>`<div class="a6-module-card"><span>🔒 ${i+1}. modul</span><b>${safe(m.title)}</b><small>${m.lessons.length?`${m.lessons.length} lecketeszt`:'Leckebontás előkészítés alatt'}</small><em>Vizsga még nincs feloldva</em></div>`).join(''):`<div class="a6-locked a6-wide"><div class="a6-big-icon">▤</div><h4>Modulok kijelölése folyamatban</h4><p>Az Angol 16 meglévő leckéjét még nem osztottuk modulokra, így modulzárók sem jöttek létre.</p></div>`}</div><p class="a6-oldnote">A korábbi önálló összegzők nem kapnak automatikus feloldást vagy jutalmat.</p>`;return;
  }
  const hasLessons=selected==='english'||mods.some(m=>m.lessons.length);
  const list=selected==='english'?c.lessons:(mods[moduleIndex]?.lessons||[]);
  panel.innerHTML=`<div class="a6-panel-heading"><h3>▤ Lecketesztek</h3><span>${selected==='english'?'16 lecke':`${mods.reduce((a,m)=>a+m.lessons.length,0)} teszt`}</span></div><p class="a6-section-lead">Válassz leckét, majd indul a meglévő kérdéssor. A tesztek nem az Expedíció AI-generátorát használják.</p>${selected==='sql'?`<div class="a6-module-tabs">${mods.map((m,i)=>`<button type="button" data-a6="module" data-index="${i}" class="${moduleIndex===i?'current':''}">${i+1}. modul</button>`).join('')}</div>`:''}${selected==='statistics'?`<div class="a6-locked"><div class="a6-big-icon">▧</div><h4>A lecketesztek bontása még hátravan</h4><p>Jelenleg 4 közvetlenül megnyitható Statisztika-modulteszt létezik. Ezeket az átállás idejére itt külön, régi tesztként megtartjuk.</p></div><div class="a6-lesson-list">${mods.map((m,i)=>`<button class="a6-lesson-item" type="button" data-a6="legacy-stat" data-index="${i}"><span class="a6-lesson-no">M${i+1}</span><b>${safe(m.title)}</b><span class="a6-status">Régi teszt ↗</span></button>`).join('')}</div>`:`<div class="a6-lesson-list">${list.map((lesson,i)=>`<button class="a6-lesson-item" type="button" data-a6="lesson" data-id="${safe(lesson.id)}"><span class="a6-lesson-no">${safe(lesson.num||String(i+1).padStart(2,'0'))}</span><b>${safe(lesson.title)}</b><span class="a6-status">Indítás ↗</span></button>`).join('')}</div>${!hasLessons?'<p>Nincs elérhető lecketeszt.</p>':''}`}`;
  panel.querySelectorAll('button[data-a6]').forEach(btn=>btn.addEventListener('click',act));
 }
 function act(e){const btn=e.currentTarget;const type=btn.dataset.a6;
  if(type==='course'){selected=btn.dataset.id;activeStep='lesson';moduleIndex=0;path();return;}
  if(type==='back'){categories();return;}
  if(type==='step'){activeStep=btn.dataset.step;list();return;}
  if(type==='back-path'){path();return;}
  if(type==='module'){moduleIndex=Number(btn.dataset.index);steps();return;}
  if(type==='legacy-stat'){const b=data.statistics.mods[+btn.dataset.index]?.existingModule;if(b)b.click();return;}
  if(type==='lesson'){
   if(selected==='english'){
    // English lesson quizzes are part of the separate English module. This route selects the existing quiz tab, not an AI tool.
    const index=Number(btn.dataset.id.split('-')[1]);sessionStorage.setItem('mentor_a6_english_quiz_lesson',String(index));location.href='Mentorklubb_Nyelvtanulas.html#quiz';return;
   }
   const lesson=data[selected]?.mods.flatMap(x=>x.lessons).find(x=>x.id===btn.dataset.id);
   if(lesson?.button){lesson.button.click();return;}
   hint('Ez a teszt még nincs beillesztve a tananyagba.');
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
