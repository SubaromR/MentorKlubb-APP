/* MentorKlubb Aurora – Tanulás B / Buborékok v0.7.0
 * Read-only learning view. Does not write rewards, tests, or learning progress.
 * Reuses the actual learning summaries from index.html and English lesson metadata.
 */
(() => {
 'use strict';
 const page=document.getElementById('learning');
 const original=document.getElementById('learningNoLesson');
 if(!page||!original||document.getElementById('aur-lrn-root'))return;
 const root=document.createElement('div');root.id='aur-lrn-root';root.className='aur-lrn-root';
 const topicMeta=[
  {id:'english',name:'Angol',short:'ANGOL',icon:'🇬🇧',color:'mint',subtitle:'16 kidolgozott lecke · modulbeosztás később'},
  {id:'statistics',name:'Statisztika',short:'Σ',icon:'∑',color:'cyan',subtitle:'4 modul · összefoglalók'},
  {id:'sql',name:'Haladó SQL',short:'SQL',icon:'▤',color:'blue',subtitle:'5 modul · 16 lecke'},
  {id:'cv',name:'Önéletrajz',short:'CV',icon:'▤',color:'purple',subtitle:'8 lecke · gyakorlati tudástár'},
  {id:'interview',name:'Állásinterjú A–Z',short:'A–Z',icon:'♧',color:'pink',subtitle:'8 lecke · felkészülés'},
  {id:'soon',name:'Hamarosan',short:'+',icon:'＋',color:'gray',subtitle:'Új témakörök érkeznek'}
 ];
 const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lessonNames={}; const byTopic={};
 const hubs=Array.from(original.querySelectorAll('.course-hub'));
 const findHub=name=>hubs.find(h=>h.classList.contains('course-'+name));
 const grab=(topic,hub)=>{
   const h=findHub(hub);return h?Array.from(h.querySelectorAll('.catalog-lesson-link')).map((b,i)=>{
    const id=b.dataset.lesson;const label=(b.querySelector('.course-tile-label')?.textContent||b.textContent||'').trim();
    const entry={id,label,index:i+1,topic};lessonNames[id]=label;return entry;
   }):[];
 };
 byTopic.cv=grab('cv','cv');byTopic.interview=grab('interview','interview');byTopic.sql=grab('sql','sql');byTopic.statistics=grab('statistics','statistics');
 let englishData=window.MK_AURORA_ENGLISH_DATA||{};
 const englishURL='Mentorklubb_Nyelvtanulas.html';
 const smallName=entry=>entry.label.replace(/^\d+(?:\.\d+)?\s*[.\-–]?\s*/,'').trim()||entry.label;
 const sourceId=entry=>{
  const n=Number((entry.id.match(/\d+$/)||[])[0]);
  const words=['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen'];
  if(entry.id.startsWith('lesson-'))return 'learningLesson'+words[n-1];
  if(entry.id.startsWith('interview-lesson-'))return 'learningInterviewLesson'+words[n-1];
  if(entry.id.startsWith('sql-lesson-'))return 'learningSqlLesson'+words[n-1];
  if(entry.id.startsWith('statistics-module-'))return 'learningStatisticsModule'+words[n-1];
  return null;
 };
 let state={view:'topics',topic:null,entry:null,prev:'topic',module:null};
 function groupLessons(topic){
  if(topic==='english')return [{name:'16 kidolgozott angollecke',note:'A modulok beosztása még nincs meghatározva',items:Array.from({length:16},(_,i)=>({id:'english-'+(i+1),label:englishData[String(i+1)]?.title||`${i+1}. angol gyakorlat`,index:i+1,topic:'english'}))}];
  if(topic==='statistics'){
   return byTopic.statistics.map((item,i)=>{
    const container=document.getElementById(sourceId(item));
    const items=[{...item,label:'Teljes modul – összefoglaló'}];
    if(container){
     Array.from(container.querySelectorAll(':scope > .learning-section')).forEach((sect,j)=>{
      const title=sect.querySelector('h3')?.textContent?.trim();
      if(title){items.push({id:item.id+'::'+j,label:title,index:j+1,topic:'statistics',sectionIndex:j});}
     });
    }
    return {name:`${i+1}. modul`,note:container?.querySelector('h2')?.textContent.trim()||'Rövid összefoglalók',items};
   });
  }
  if(topic==='sql'){
   const groups=[];
   byTopic.sql.forEach((entry)=>{
    const num=Number((entry.label.match(/^(\d+)\./)||[])[1])||1;
    let g=groups.find(x=>x.num===num);
    if(!g){g={num,name:`${num}. modul`,note:'A modul leckéi rövid összefoglalókban',items:[]};groups.push(g)}g.items.push(entry);
   });return groups;
  }
  const label=topic==='cv'?'Önéletrajz – alapmodul':'Állásinterjú – alapmodul';
  return [{name:label,note:'A témakör meglévő leckéi',items:byTopic[topic]||[]}];
 }
 function kicker(t){return `<div class="aur-lrn-kicker">${htmlEscape(t)}</div>`}
 function navline(back){return `<div class="aur-lrn-crumb"><button type="button" data-lrn-back="${back}" aria-label="Vissza a témakörökhöz">←</button><span>Tanulás</span><span class="aur-lrn-crumbsep">/</span><strong>${htmlEscape(topicMeta.find(t=>t.id===state.topic)?.name||'')}</strong></div>`}
 function renderTopics(){
  state={view:'topics',topic:null,entry:null,prev:'topic',module:null};
  root.innerHTML=`<div class="aur-lrn-stars" aria-hidden="true"></div><section class="aur-lrn-intro">${kicker('TANULÁSI KÖZPONT')}<h2>Fedezd fel a <em>tudást.</em></h2><p>Rövid, lényegre törő összefoglalók a tesztek előtt és után. Válassz egy témát!</p></section>
    <div class="aur-lrn-carousel-head"><div><h3>Témakörök</h3><span>Húzd a buborékokat balra vagy jobbra az egérrel</span></div><div class="aur-lrn-carousel-controls"><button type="button" data-lrn-slide="-1" aria-label="Előző témakörök">←</button><button type="button" data-lrn-slide="1" aria-label="Következő témakörök">→</button></div></div>
    <div class="aur-lrn-rail-shell"><div class="aur-lrn-orbit-ring" aria-hidden="true"></div><div class="aur-lrn-rail" id="aur-lrn-rail" aria-label="Húzható témakörök">${topicMeta.map((t,i)=>`<div class="aur-lrn-orb-cell"><button type="button" class="aur-lrn-orb aur-lrn-orb-${t.color} ${t.id==='soon'?'is-soon':''}" data-lrn-topic="${t.id}" aria-label="${htmlEscape(t.name)}${t.id==='soon'?', jelenleg nem elérhető':''}" ${t.id==='soon'?'disabled':''}><span class="aur-lrn-orb-halo"></span><span class="aur-lrn-orb-symbol">${t.icon}</span><strong>${htmlEscape(t.name)}</strong><small>${t.id==='soon'?'Új témák később':(t.id==='english'?'16 lecke':t.id==='sql'?'5 modul':t.id==='statistics'?'4 modul':'8 lecke')}</small></button></div>`).join('')}</div></div>
    <div class="aur-lrn-carousel-foot"><div class="aur-lrn-pips" aria-hidden="true"><span class="active"></span><span></span><span></span><span></span></div><p><span>✦</span> Tanulás, ismétlés, tudás – jutalmak és vizsgakötelezettség nélkül.</p></div>`;
  initRail();
 }
 function renderTopic(topic){
  const meta=topicMeta.find(x=>x.id===topic);if(!meta||topic==='soon')return;
  state={view:'topic',topic,entry:null,prev:'topics',module:null};
  const groups=groupLessons(topic);
  root.innerHTML=`<div class="aur-lrn-stars" aria-hidden="true"></div>${navline('topics')}<section class="aur-lrn-topic-heading"><div class="aur-lrn-topic-heading-icon aur-lrn-bg-${meta.color}">${meta.icon}</div><div>${kicker('LECKÉK ÉS MODULOK')}<h2>${htmlEscape(meta.name)}</h2><p>${htmlEscape(meta.subtitle)}. Kattints a leckebuborékra az összefoglaló megnyitásához.</p></div></section>
   <div class="aur-lrn-module-stack">${groups.map((g,j)=>`<details class="aur-lrn-module" ${j===0?'open':''}><summary><span class="aur-lrn-module-number">${String(j+1).padStart(2,'0')}</span><span><strong>${htmlEscape(g.name)}</strong><small>${htmlEscape(g.note)}</small></span><span class="aur-lrn-module-count">${g.items.length} ${topic==='statistics'?'összefoglaló':'lecke'}</span><span class="aur-lrn-module-chevron">⌄</span></summary><div class="aur-lrn-lessons">${g.items.map((l,i)=>`<button type="button" class="aur-lrn-lesson-orb aur-lrn-lesson-${meta.color}" data-lrn-entry="${htmlEscape(l.id)}" title="${htmlEscape(l.label)}"><span class="aur-lrn-lesson-num">${String(l.index).padStart(2,'0')}</span><span class="aur-lrn-lesson-label">${htmlEscape(smallName(l))}</span><span class="aur-lrn-lesson-arrow">→</span></button>`).join('')}</div></details>`).join('')}</div>`;
 }
 function findEntry(topic,id){return groupLessons(topic).flatMap(x=>x.items).find(x=>x.id===id)}
 function summaryData(source,entry){
  const quick=source.querySelector('.learning-lead')?.textContent?.trim() || source.querySelector('.learning-section-header p')?.textContent?.trim() || source.querySelector('p')?.textContent?.trim() || 'A fontos tudnivalók az alábbi részletes jegyzetben érhetők el.';
  const short=Array.from(source.querySelectorAll('.learning-summary-strip .summary-strip-card')).slice(0,3).map(x=>({head:x.querySelector('strong')?.textContent.trim()||'',text:x.querySelector('span')?.textContent.trim()||''}));
  const headers=Array.from(source.querySelectorAll('.learning-section > .learning-section-header h3, .learning-section > header h3')).slice(0,6).map(x=>x.textContent.trim());
  const bullets=Array.from(source.querySelectorAll('.objective-card strong, .learning-section li')).map(x=>x.textContent.trim()).filter(x=>x.length>=12&&x.length<170).slice(0,5);
  return {lead:quick,short,headers,bullets};
 }
 function renderEntry(topic,id){
  const meta=topicMeta.find(x=>x.id===topic);const entry=findEntry(topic,id);if(!meta||!entry)return;
  state={view:'entry',topic,entry:id,prev:'topic'};
  const english=topic==='english';let full=null,d,heading=smallName(entry);
  if(english){
   const n=Number(id.split('-').pop());const item=englishData[String(n)]||{};
   heading=`${n}. gyakorlat – ${item.title||'Angol'}`;
   d={lead:item.description||item.lead||'Az angol tananyag rövid áttekintése.',short:[],headers:[],bullets:[]};
  }else{
   let srcId=id,sub=null;if(id.includes('::')){[srcId,sub]=id.split('::');}
   let el=document.getElementById(sourceId({id:srcId}));
   if(sub!==null&&el)el=Array.from(el.querySelectorAll(':scope > .learning-section'))[Number(sub)];
   if(!el){renderTopic(topic);return}
   d=summaryData(el,entry);full=el;
  }
  root.innerHTML=`<div class="aur-lrn-stars" aria-hidden="true"></div>${navline('topic')}
   <section class="aur-lrn-reading"><div class="aur-lrn-reading-head"><span class="aur-lrn-reading-badge aur-lrn-bg-${meta.color}">${meta.icon}</span><div>${kicker('GYORS ÁTTEKINTÉS · NINCS JUTALOM')}<h2>${htmlEscape(heading)}</h2><p>${htmlEscape(meta.name)}</p></div></div>
    <div class="aur-lrn-reading-layout"><section class="aur-lrn-reading-card aur-lrn-reading-lead"><h3>✦ A lényeg röviden</h3><p>${htmlEscape(d.lead)}</p>${english&&englishData[id.split('-').pop()]?.lead?`<p>${htmlEscape(englishData[id.split('-').pop()].lead)}</p>`:''}</section>
    <section class="aur-lrn-reading-card"><h3>✓ Amit érdemes megjegyezni</h3>${english?englishMarkup(id):notesMarkup(d)}</section></div>
    ${full?`<details class="aur-lrn-full-note"><summary><span>📖</span><span><strong>Teljes tanulási összefoglaló és példák</strong><small>A meglévő MentorKlubb-tananyag, változtatás nélkül</small></span><span>⌄</span></summary><div class="aur-lrn-original"></div></details>`:`<div class="aur-lrn-english-link"><button type="button" data-lrn-open-english="${Number(id.split('-').pop())}">Részletes angollecke megnyitása ↗</button><span>Az eredeti angol tananyagban további képek és gyakorlati példák találhatók.</span></div>`}
    <div class="aur-lrn-reading-bottom"><button type="button" data-lrn-back="topic">← Vissza a leckékhez</button><span>Ez a nézet nem befolyásolja a teszt- és jutalmazási eredményeket.</span></div></section>`;
  if(full){
    const clone=full.cloneNode(true);clone.classList.remove('hidden');clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
    clone.querySelectorAll('.learning-toc').forEach(x=>x.remove());
    root.querySelector('.aur-lrn-original').append(clone);
  }
 }
 function notesMarkup(d){
  if(d.short.length)return `<div class="aur-lrn-recall-list">${d.short.map(x=>`<div class="aur-lrn-recall"><strong>${htmlEscape(x.head)}</strong><span>${htmlEscape(x.text)}</span></div>`).join('')}</div>`;
  const list=d.bullets.length?d.bullets:d.headers.length?d.headers:['Részletes tudnivalók és példák az alábbi jegyzetben'];
  return `<ul class="aur-lrn-read-bullets">${list.map(t=>`<li>${htmlEscape(t)}</li>`).join('')}</ul>`;
 }
 function englishMarkup(id){
  const entry=englishData[id.split('-').pop()]||{};
  let rows=(entry.patterns||[]).filter(x=>Array.isArray(x)&&x.length>=2).slice(0,4);
  return `<div class="aur-lrn-english-patterns">${rows.map(x=>`<div><strong>${htmlEscape(x[0])}</strong><span>${htmlEscape(x[1])}</span></div>`).join('')}</div>${entry.tip?`<p class="aur-lrn-english-tip">💡 ${htmlEscape(entry.tip)}</p>`:''}`;
 }
 function initRail(){
  const rail=root.querySelector('#aur-lrn-rail');if(!rail)return;
  let start=0,startScroll=0,drag=false,down=false,lastDrag=0;
  rail.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   down=true;drag=false;start=e.clientX;startScroll=rail.scrollLeft;rail.classList.add('is-dragging');
  });
  rail.addEventListener('pointermove',e=>{if(!down)return;const delta=e.clientX-start;if(Math.abs(delta)>7){if(!drag){drag=true;try{rail.setPointerCapture(e.pointerId)}catch(_){}}rail.scrollLeft=startScroll-delta;e.preventDefault()}});
  function end(){if(!down)return;down=false;rail.classList.remove('is-dragging');if(drag)lastDrag=Date.now();updatePips();}
  rail.addEventListener('pointerup',end);rail.addEventListener('pointercancel',end);rail.addEventListener('lostpointercapture',end);
  rail.addEventListener('click',e=>{if(Date.now()-lastDrag<250){e.preventDefault();e.stopPropagation()}},true);
  rail.addEventListener('scroll',updatePips,{passive:true});
  function updatePips(){const pips=root.querySelectorAll('.aur-lrn-pips span');let ratio=rail.scrollWidth>rail.clientWidth?rail.scrollLeft/(rail.scrollWidth-rail.clientWidth):0;const idx=Math.min(pips.length-1,Math.max(0,Math.round(ratio*(pips.length-1))));pips.forEach((e,i)=>e.classList.toggle('active',i===idx));}
  root.querySelectorAll('[data-lrn-slide]').forEach(btn=>btn.addEventListener('click',()=>{const cell=rail.querySelector('.aur-lrn-orb-cell');const width=(cell?.getBoundingClientRect().width||250)+22;rail.scrollBy({left:Number(btn.dataset.lrnSlide)*width,behavior:'smooth'})}));
 }
 root.addEventListener('click',e=>{
  const back=e.target.closest('[data-lrn-back]');if(back){back.dataset.lrnBack==='topics'?renderTopics():renderTopic(state.topic);return}
  const topic=e.target.closest('[data-lrn-topic]');if(topic){renderTopic(topic.dataset.lrnTopic);window.scrollTo({top:0,behavior:'instant'});return}
  const lesson=e.target.closest('[data-lrn-entry]');if(lesson){renderEntry(state.topic,lesson.dataset.lrnEntry);window.scrollTo({top:0,behavior:'instant'});return}
  const en=e.target.closest('[data-lrn-open-english]');if(en){try{sessionStorage.setItem('mk-aurora-learning-open-english',en.dataset.lrnOpenEnglish)}catch(_){} location.href=englishURL+'#course';}
 });
 page.append(root);page.classList.add('aur-lrn-ready');

 const deep=location.hash.match(/^#learning\/(.+)$/);if(deep){
  const id=decodeURIComponent(deep[1]);let cat=null;for(const [k,v] of Object.entries(byTopic)){if(v.find(x=>x.id===id)){cat=k;break;}}
  if(cat){renderEntry(cat,id)}else renderTopics();
 }else renderTopics();
 // Navigating to Tanulás from the shared menu should bring back the bubble landing page.
 document.addEventListener('click',e=>{const nav=e.target.closest('.aur-c-side-link[data-aur-c-nav="learning"],.nav-button[data-page="learning"]');if(nav&&nav.closest('#aur-lrn-root')===null)requestAnimationFrame(()=>{if(state.view!=='topics')renderTopics()})});
})();
