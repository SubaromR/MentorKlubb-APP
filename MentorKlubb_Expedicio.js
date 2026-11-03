/* MentorKlubb Expedíció – minden oldalon ugyanazt a központi profilt használja. */
(()=>{'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let frame,ready,profile=null,serial=0,pending=new Map(),helpHandler=null,drawerOpen=false,processing=false,inlineEngine=false;
const isAndroid=/Android/i.test(navigator.userAgent);
if(isAndroid)document.documentElement.classList.add('mk-android');
function includeScript(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error('Nem tölthető be: '+src));document.head.appendChild(el);});}
async function setupInlineEngine(){
 // Az Android WebView bizonyos verziói leállítják a 0x0, láthatatlan iframe-et.
 // Közvetlenül az aktuális lapba töltjük az egyetlen, azonos üzleti logikájú motort.
 await includeScript('MentorKlubb_Nativ_Profil.js');
 await Promise.resolve(window.mkNativeProfileReady); // v0.1.2: időkorlátos natív profilolvasás
 await includeScript('MentorKlubb_Expedicio_Core.js');
 if(typeof window.MK_EXP_ENGINE?.execute!=='function')throw Error('A közvetlen adattár nem indult el.');
 inlineEngine=true;
}
function setupHub(){if(ready)return ready;
 if(isAndroid){ready=setupInlineEngine();return ready;}
 ready=new Promise((resolve,reject)=>{
  frame=document.createElement('iframe');frame.src='MentorKlubb_Adattar.html';frame.title='Központi MentorKlubb adattár';frame.setAttribute('aria-hidden','true');frame.style.cssText='width:0;height:0;border:0;position:absolute;left:-9999px;visibility:hidden';
  // A core script aszinkron indulhat natív profil-visszatöltés után.
  // Az iframe onload ezért nem elég: csak a tényleges 'ready' üzenet után küldünk kérést.
  const onReady=e=>{if(e.source===frame.contentWindow&&e.data?.mkHub===1&&e.data?.ready===true){window.removeEventListener('message',onReady);clearTimeout(tid);resolve();}};
  const tid=setTimeout(()=>{window.removeEventListener('message',onReady);reject(Error('A központi adattár nem indult el.'));},12000);
  window.addEventListener('message',onReady);
  frame.onerror=()=>{clearTimeout(tid);window.removeEventListener('message',onReady);reject(Error('Az adattár nem érhető el.'));};
  document.body.appendChild(frame);
 });return ready;}
window.addEventListener('message',e=>{if(!frame||e.source!==frame.contentWindow||!e.data||e.data.mkHub!==1)return;const req=pending.get(e.data.id);if(!req)return;pending.delete(e.data.id);clearTimeout(req.timer);if(e.data.state)profile=e.data.state;req[e.data.ok?'resolve':'reject'](e.data.ok?e.data:Error(e.data.error||'Adattárhiba'));});
async function transact(op,payload){
 await setupHub();
 if(inlineEngine){
   // Az Android-kliens ugyanazt a core motort hívja közvetlenül, iframe nélkül.
   const response=window.MK_EXP_ENGINE.execute(op,payload);
   profile=response.state;renderHUD();renderDashboard();
   return response.result;
 }
 const id=++serial;
 return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pending.delete(id);reject(Error('A központi adattár nem válaszol. Ne folytasd a tesztet, amíg az adatkapcsolat helyre nem áll.'));},10000);
   pending.set(id,{resolve,reject,timer});frame.contentWindow.postMessage({mkHub:1,id,op,payload},'*');
 }).then(r=>{renderHUD();renderDashboard();return r.result;});
}
function clock(ms){const n=Math.max(0,Math.floor((ms-Date.now())/1000)),h=Math.floor(n/3600),m=Math.floor(n%3600/60);return `${h} óra ${m} perc`;}
function notify(message,success=true){const old=$('mk-toast');if(old)old.remove();const el=document.createElement('div');el.id='mk-toast';el.className='mk-toast '+(success?'':'mk-error');el.textContent=message;document.body.appendChild(el);setTimeout(()=>{if(el.isConnected)el.remove();},5500);}
function renderHUD(){if(!profile)return;const s=profile.state;let el=$('mk-hud');if(!el){el=document.createElement('nav');el.id='mk-hud';el.className='mk-hud';el.setAttribute('aria-label','MentorKlubb Expedíció');document.body.appendChild(el);}
 el.innerHTML=`<a href="MentorKlubb_Expedicio.html" title="Expedíció – küldetések, jutalmak"><span class="mk-icon">✦</span><strong>Expedíció</strong><span class="mk-level">${s.level}. szint</span></a><span class="mk-coins" title="Szikrák">✧ <b>${s.spark}</b></span><span class="mk-coins mk-rare" title="Relikviák">◆ <b>${s.relic}</b></span><span class="mk-streak" title="Napi sorozat">🔥 ${s.streak}</span>`;}
function questSection(title,items,scope){const s=profile.state;return `<section class="mk-quest-category"><h3>${title}</h3><div class="mk-quest-list">${items.map(q=>{const pct=Math.min(100,Math.round(q.progress/q.target*100)),complete=q.progress>=q.target;return `<article class="mk-quest"><div class="mk-quest-main"><strong>${esc(q.name)}</strong><small>${q.progress}/${q.target} · ${q.spark?'✧ '+q.spark+' Szikra':''}${q.relic?' ◆ '+q.relic+' Relikvia':''}</small><div class="mk-meter"><span style="width:${pct}%"></span></div></div><button type="button" class="mk-claim" data-claim="${scope}:${q.id}" ${!complete||q.claimed||scope==='event'&&!profile.weekend.active?'disabled':''}>${q.claimed?'✓ Felvéve':complete?'Jutalom':'Folyamatban'}</button></article>`}).join('')}</div></section>`;}
const badges={pioneer:['🧭','Első felfedező','Az első új feladatsor'],level3:['🥉','Bronz tudásszobor','3. szint'],level10:['🥈','Ezüst tudásszobor','10. szint'],level25:['🥇','Arany tudásszobor','25. szint'],streak7:['🔥','Hét nap fénye','7 napos sorozat'],tests10:['🏛️','Tíz próba emlékműve','10 egyedi ZH'],event:['🏆','Hétvégi expedíció','Eseményjutalom']};
function renderDashboard(){const root=$('mk-dashboard');if(!root||!profile)return;const s=profile.state,need=100+s.level*30,lv=Math.round(s.levelXP/need*100),ev=profile.weekend;
 root.innerHTML=`<section class="mk-hero"><div><span class="mk-eyebrow">MENTORKLUBB · EXPEDÍCIÓ</span><h1>Tanulj. Fejlődj. <em>Gyűjts.</em></h1><p>Minden értelmes tudáspróba előrelépés. A segítségeket a megszerzett erőforrásokból aktiválhatod, a küldetések és a gyűjtemény hosszú távon fejlődnek.</p><div class="mk-hero-actions"><a class="mk-primary" href="MentorKlubb_AI_Teszt.html">AI-teszt indítása ↗</a><a class="mk-secondary" href="index.html">← Főoldal</a></div></div><div class="mk-hero-badge"><span>✦</span><small>TUDÁSÚT</small><strong>${s.level}. szint</strong></div></section>
 <section class="mk-stats"><div class="mk-stat"><span>✧ SZIKRA</span><strong>${s.spark}</strong><small>Gyakran szerezhető</small></div><div class="mk-stat"><span>◆ RELIKVIA</span><strong>${s.relic}</strong><small>Ritkább jutalom</small></div><div class="mk-stat"><span>🔥 SOROZAT</span><strong>${s.streak} nap</strong><small>Legjobb: ${s.bestStreak} nap</small></div><div class="mk-stat"><span>✓ VIZSGÁK</span><strong>${s.tests}</strong><small>${s.uniqueTests} új kérdéssor</small></div></section>
 <section class="mk-block mk-level-block"><div class="mk-block-header"><div><span class="mk-eyebrow">HOSSZÚ TÁVÚ FEJLŐDÉS</span><h2>A végtelen tudásút</h2></div><strong>${s.levelXP} / ${need} XP</strong></div><div class="mk-meter mk-big-meter"><span style="width:${lv}%"></span></div><p>Következő szint: +${12+Math.min(s.level+1,30)} Szikra. Minden 5. szint egy Relikviát is ad. Összes XP: ${s.xp}.</p></section>
 <div class="mk-dashboard-columns"><div class="mk-primary-stack"><section class="mk-block"><div class="mk-block-header"><div><span class="mk-eyebrow">KÜLDETÉSNAPLÓ</span><h2>Aktív küldetések</h2></div></div>${questSection('☀ Napi küldetések · napi váltás éjfélkor',profile.quests.daily,'daily')}${questSection('◈ Heti küldetések · hétfőnként újraindul',profile.quests.weekly,'weekly')}${questSection('⏳ Hétvégi esemény · '+(ev.active?'vége '+clock(ev.ends):'jelenleg nem aktív'),profile.quests.event,'event')}</section></div>
 <div class="mk-side-stack"><section class="mk-block mk-chest-block"><span class="mk-eyebrow">JUTALOMTEREM</span><h2>Felfedezőládák</h2><div class="mk-chest-graphic" aria-hidden="true">🧰</div><strong>${s.pendingChests.length} felnyitható láda</strong><p>Új, legalább 50%-os ZH után ládát kapsz. Minden ötödik sikeres új teszt különleges ládát ad.</p><button type="button" data-mk-chest class="mk-primary" ${s.pendingChests.length?'':'disabled'}>Láda felnyitása</button></section>
 <section class="mk-block"><span class="mk-eyebrow">GYŰJTEMÉNY</span><h2>Relikviatár</h2><div class="mk-badge-grid">${Object.entries(badges).map(([id,b])=>`<div class="mk-badge ${s.collection.includes(id)?'is-earned':'is-locked'}" title="${esc(b[2])}"><span>${b[0]}</span><strong>${esc(b[1])}</strong><small>${esc(b[2])}</small></div>`).join('')}</div></section></div></div>
 <section class="mk-block mk-backup"><div class="mk-block-header"><div><span class="mk-eyebrow">ADATBIZTONSÁG</span><h2>Profilmentés és visszaállítás</h2></div></div><p>A fejlődést az alkalmazás helyi adattárában tároljuk, és a natív kiadás külön adatfájlba is menti. <strong>A böngésző tárhelyének törlése, másik gép vagy mappa és böngészőváltás esetén biztonsági mentés kell.</strong> A ZIP frissítésénél ne nevezz át vagy helyezz át fájlokat, és frissítés előtt ments profilt.</p><div class="mk-hero-actions"><button type="button" data-mk-export class="mk-primary">↓ Profil biztonsági mentése (.json)</button><label class="mk-secondary mk-import-label">↑ Mentés visszatöltése<input id="mk-backup-import" type="file" accept=".json,application/json" hidden></label></div><small>A mentés a játékosprofilt tartalmazza, nem a korábbi külön tárolt ZH-eredmények teljes adatbázisát.</small></section>
 <section class="mk-block"><div class="mk-block-header"><div><span class="mk-eyebrow">UTOLSÓ TEVÉKENYSÉGEK</span><h2>Expedíciós napló</h2></div></div><div class="mk-log">${s.log.slice(0,12).map(x=>`<div><span>${esc(x.label)}</span><time>${new Date(x.at).toLocaleString('hu-HU')}</time></div>`).join('')||'<p>Az első látogatásnál indul a napló.</p>'}</div></section>`;
 root.querySelectorAll('[data-claim]').forEach(b=>b.onclick=async()=>{const [scope,id]=b.dataset.claim.split(':');try{const r=await transact('claim',{scope,id});notify(`Küldetés teljesítve! +${r.spark} Szikra${r.relic?', +'+r.relic+' Relikvia':''}`)}catch(e){notify(e.message,false)}});
 root.querySelector('[data-mk-chest]').onclick=async()=>{try{const r=await transact('chest');showChestReward(r)}catch(e){notify(e.message,false)}};
 root.querySelector('[data-mk-export]').onclick=exportBackup;
 root.querySelector('#mk-backup-import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>3_000_000){notify('A mentés túl nagy.',false);return;}try{const content=JSON.parse(await file.text());if(content.format!=='MentorKlubb-Expedicio-Backup'||content.version!==1||!content.profile)throw Error('Ez nem MentorKlubb Expedíció profilmentés.');if(!confirm('A visszaállítás felülírja a jelenlegi játékosprofilt. Előbb lementetted a mostani profilt?'))return;await transact('restore',content.profile);notify('A profil visszaállítása sikeres!')}catch(err){notify('A profil nem tölthető be: '+err.message,false)}};}
function showChestReward(r){const modal=document.createElement('div');modal.className='mk-reward-overlay';modal.innerHTML=`<div class="mk-reward-box" role="dialog" aria-modal="true" aria-labelledby="mkRewardTitle"><div class="mk-reward-icon">${r.type==='rare'?'💎':'🎁'}</div><span class="mk-eyebrow">FELFEDEZŐLÁDA FELNYITVA</span><h2 id="mkRewardTitle">Jutalmat szereztél!</h2><p class="mk-reward-amount">+${r.spark} ✧ Szikra ${r.relic?'és +'+r.relic+' ◆ Relikvia':''}</p><button type="button" class="mk-primary" id="mk-close-reward">Tovább a tanuláshoz</button></div>`;document.body.appendChild(modal);modal.querySelector('button').focus();modal.querySelector('button').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});}
function showPendingChest(){
 const modal=document.createElement('div');modal.className='mk-reward-overlay';
 modal.innerHTML='<div class="mk-reward-box" role="dialog" aria-modal="true" aria-labelledby="mkChestTitle"><div class="mk-reward-icon">🎁</div><span class="mk-eyebrow">ÚJ EXPEDÍCIÓS JUTALOM</span><h2 id="mkChestTitle">Felfedezőládát szereztél!</h2><p>A ládában Szikra és esetenként Relikvia vár. Most felnyitod, vagy későbbre tartogatod?</p><div class="mk-hero-actions" style="justify-content:center"><button type="button" class="mk-primary" id="mk-open-now">Láda felnyitása</button><button type="button" class="mk-secondary" id="mk-open-later">Később</button></div></div>';
 document.body.appendChild(modal);
 modal.querySelector('#mk-open-now').onclick=async()=>{try{const r=await transact('chest');modal.remove();showChestReward(r)}catch(e){notify(e.message,false)}};
 modal.querySelector('#mk-open-later').onclick=()=>modal.remove();
}
async function exportBackup(){try{const data=await transact('backup');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MentorKlubb_Expedicio_Profilmentes_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('A profilmentés letöltése elindult.')}catch(e){notify(e.message,false)}}
function setupHelpUI(){if($('mk-help-toggle'))return;const b=document.createElement('button');b.id='mk-help-toggle';b.className='mk-help-toggle';b.type='button';b.textContent='✦ Segítségek';b.hidden=true;b.onclick=()=>toggleDrawer(true);document.body.appendChild(b);
 const wrapper=document.createElement('div');wrapper.id='mk-help-overlay';wrapper.className='mk-help-overlay';wrapper.hidden=true;wrapper.innerHTML='<button type="button" class="mk-help-backdrop" aria-label="Segítségek bezárása"></button><aside class="mk-help-drawer" role="dialog" aria-modal="true" aria-label="Tanulási segítségek"><div class="mk-drawer-top"><div><span class="mk-eyebrow">EXPEDÍCIÓS ERŐFORRÁSOK</span><h2>Segítségtár</h2></div><button type="button" id="mk-help-close" aria-label="Bezárás">✕</button></div><p class="mk-drawer-summary" id="mk-help-balances"></p><div id="mk-help-content"></div><p class="mk-drawer-foot">A segítség végleges, aktiváláskor levonjuk az árát. A pontszámot nem csökkenti.</p></aside>';
 document.body.appendChild(wrapper);wrapper.querySelector('.mk-help-backdrop').onclick=()=>toggleDrawer(false);wrapper.querySelector('#mk-help-close').onclick=()=>toggleDrawer(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawerOpen)toggleDrawer(false)});}
function toggleDrawer(open){drawerOpen=open;const overlay=$('mk-help-overlay');if(!overlay)return;overlay.hidden=!open;document.body.classList.toggle('mk-drawer-open',open);if(open){$('mk-help-close').focus();renderHelpBalance()}}
function renderHelpBalance(){const b=$('mk-help-balances');if(b&&profile){b.textContent=`Egyenleged: ${profile.state.spark} ✧ Szikra · ${profile.state.relic} ◆ Relikvia`;}}
function mountHelp(html,handler){setupHelpUI();helpHandler=handler;const panel=$('mk-help-content');panel.innerHTML=html;const c=profile&&profile.costs||{poll:{spark:7},fifty:{relic:1},terms:{spark:5},steps:{spark:9}};
 panel.querySelectorAll('[data-help]').forEach(b=>{const key=b.dataset.help,price=c[key];if(price&&!b.disabled){const cost=document.createElement('span');cost.className='mk-help-price';cost.textContent=price.relic?`◆ ${price.relic} Relikvia`:`✧ ${price.spark} Szikra`;b.appendChild(cost);}b.onclick=()=>helpHandler&&helpHandler(key)});
 renderHelpBalance();$('mk-help-toggle').hidden=false;}
function hideHelp(){if($('mk-help-toggle'))$('mk-help-toggle').hidden=true;toggleDrawer(false);}
async function purchaseHelp(key){if(processing)return false;processing=true;try{if(!profile)throw Error('Nincs kapcsolat a profiloddal.');const c=profile.costs[key];if(!c)throw Error('Ismeretlen segítség.');if(!confirm(`Aktiválod a segítséget? Ár: ${c.relic?c.relic+' Relikvia':c.spark+' Szikra'}. A költség nem visszatéríthető.`))return false;
 await transact('help',key);notify('Segítség aktiválva, az árát levontuk.');renderHelpBalance();return true;}catch(e){notify(e.message,false);return false}finally{processing=false}}
function fingerprint(questions){const s=questions.map(q=>[q.stem,q.context,q.answer,...q.options].join('¦')).join('¶');let a=2166136261,b=0x85ebca6b;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,0x45d9f3b)}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')+':'+questions.length;}
async function recordQuiz(data){if(!profile)throw Error('Nem sikerült megnyitni a játékosprofilt.');const result=await transact('grade',{...data,hash:fingerprint(data.questions)});if(result.reward)notify(`✦ Tesztjutalom: +${result.sparks} Szikra, +${result.xp} XP${result.chest} · Új láda!':''}`);else notify(result.reason||'A teszt lezárult, új jutalom most nem jár.');if(result.chest)showPendingChest();return result;}
function showExpeditionError(error){
 console.error('[MentorKlubb Expedíció] Indítási hiba:',error);
 let el=$('mk-exp-status-error');
 if(!el){el=document.createElement('div');el.id='mk-exp-status-error';el.setAttribute('role','alert');el.style.cssText='position:fixed;bottom:90px;left:12px;right:12px;z-index:2000;max-width:610px;margin:auto;border-radius:14px;padding:14px 16px;background:#852f47;color:white;font:600 13px system-ui,sans-serif;box-shadow:0 12px 38px #16223a44';document.body.appendChild(el);}
 el.replaceChildren();
 const title=document.createElement('div');title.textContent='A Szikra-adattár még nem indult el.';title.style.fontWeight='800';
 const detail=document.createElement('div');detail.style.cssText='font-size:12px;margin:8px 0;overflow-wrap:anywhere';detail.textContent=String(error?.message||error);
 const retry=document.createElement('button');retry.type='button';retry.textContent='Újrapróbálás';retry.style.cssText='padding:8px 12px;border:0;border-radius:9px;color:#222;background:#fff;font-weight:bold';retry.onclick=()=>{ready=null;frame?.remove();frame=null;el.remove();init();};
 const link=document.createElement('a');link.href='MentorKlubb_Expedicio.html';link.textContent='  Expedíció megnyitása';link.style.cssText='color:#fff;margin-left:12px';
 el.append(title,detail,retry,link);
}
async function init(){try{setupHelpUI();await setupHub();const result=await transact('visit');$('mk-exp-status-error')?.remove();if(result.first)notify(`☀ Napi belépés: +${result.reward} Szikra${result.rare?', +1 Relikvia':''} · ${profile.state.streak}. nap`);setInterval(async()=>{try{await transact('status');}catch(e){}},60000);}catch(e){showExpeditionError(e);}}
window.MK_EXP={init,ready:()=>setupHub(),status:()=>profile,transact,mountHelp,hideHelp,purchaseHelp,recordQuiz,fingerprint,notify,toggleDrawer};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
