'use strict';
(function(){
const $ = id => document.getElementById(id);
const COURSES=window.MENTOR_AI_COURSES||[];
const HISTORY_KEY='mentorklubb_ai_tests_2026_v1';
let loaded=null, answers=[],pos=0,activeResult=null,history=readHistory();
let seed=0;
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeText(x,max=4000){return typeof x==='string' && x.trim().length>0 && x.length<=max;}
function readHistory(){try{const arr=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(arr)?arr.slice(0,12):[];}catch(e){return [];}}
function writeHistory(){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,12)));return true;}catch(e){alert('Az előzmények nem fértek el a böngésző tárhelyén. A teszt eredménye látszik, de tartós mentés nem történt.');return false;}}
const findCourse=()=>COURSES.find(c=>c.id===$('aiCourse').value)||COURSES[0];
const findModule=()=>findCourse().modules.find(m=>m.id===$('aiModule').value)||findCourse().modules[0];
const getSelectedParts=()=>{let m=findModule();return $('aiPart').value==='all'?m.parts:m.parts.filter(p=>p.id===$('aiPart').value);};
function fill(sel, options){sel.innerHTML='';options.forEach(opt=>{const el=document.createElement('option');el.value=String(opt.id);el.textContent=opt.title;sel.appendChild(el);});}
function updateModule(){const c=findCourse();fill($('aiModule'),c.modules);updateParts();}
function updateParts(){const m=findModule();fill($('aiPart'),[{id:'all',title:'Teljes modul – minden anyagrész'},...m.parts.map(p=>({id:p.id,title:p.title}))]);if(m.parts.length){$('aiPart').value=String(m.parts[0].id);}updateSource();}
function updateSource(){const parts=getSelectedParts(),chars=parts.reduce((n,p)=>n+p.text.length,0);const large=chars>100000;const src=$('sourceInfo');src.classList.toggle('warn',large);src.innerHTML='<strong>Felhasznált forrás:</strong> '+parts.length+' anyagrész · kb. '+chars.toLocaleString('hu-HU')+' karakter. '+(large?'A forrásanyag hosszú. Pontosabb AI-kérdésekhez válassz kevesebb anyagrészt vagy kisebb modult.':'A teljes kiválasztott anyag kerül a kérésfájlba.');}
function buildPrompt(){
const c=findCourse(),m=findModule(),parts=getSelectedParts(),count=Number($('aiCount').value),difficulty=$('aiDifficulty').value,focus=$('aiFocus').value;
const difficultyLabels={vegyes:'vegyes: kb. 25% könnyű, 50% közepes, 25% nehéz',alap:'könnyű: alapfogalmak alkalmazása egyszerű, új helyzetekben',kozepes:'közepes: több lépéses értelmezés és alkalmazás',nehez:'nehéz/kihívás: összetett, de egyértelmű gyakorlati problémák'};
const focusLabels={vegyes:'változatos készségek: gyakorlati alkalmazás, fogalmi összefüggések, adatelemzés, releváns számítások és hibakeresés',gyakorlat:'valósághű esettanulmányok, döntési helyzetek és problémamegoldás',osszefugges:'összefüggések, ok-okozat, következtetés és a módszerválasztás indoklása',szamitas:'adatok és képletek megértése, releváns számítások, eredmények értelmezése',hiba:'hibás következtetések, hibakeresés, téves módszerválasztás és javítás'};
const recent=history.flatMap(r=>(r.questions||[]).map(q=>q.stem)).slice(0,18);
const requestId='MK-'+Date.now().toString(36)+'-'+(++seed);
let prompt=`MENTORKLUBB – FORRÁSHŰ, GYAKORLATI AI-TESZT KÉRÉS\nKérésazonosító: ${requestId}\n\nSZEREPED\nTapasztalt, magyar nyelvű, tudásalkalmazást mérő vizsgafeladat-tervező vagy. Az alábbi MENTORKLUBB-forrásanyag alapján készíts teljesen új, élethelyzeteken alapuló, önmagukban megoldható kérdéseket.\n\nKIVÁLASZTOTT TANANYAG\nKurzus: ${c.title}\nModul: ${m.title}\nAnyagrész: ${parts.map(p=>p.title).join(' | ')}\nKérdésszám: PONTOSAN ${count}\nNehézség: ${difficultyLabels[difficulty]}\nFókusz: ${focusLabels[focus]}\n\nMINŐSÉGI SZABÁLYOK\n1. Kizárólag az itt csatolt anyag tényleges fogalmait, módszereit és összefüggéseit használd kiindulásként. Új, hétköznapi vagy szakmai példákkal, más adatokkal és új problémákkal bővítheted. Ha az új helyzet megoldásához fontos, a feltételeket a context mezőben add meg. Ne tulajdoníts a forrásnak olyasmit, ami nem szerepel benne.\n2. SOHA ne kérdezd, hogy „az előadásban”, „a videóban”, „az oktató szerint”, „melyik példát láttuk”. Az alkalmazható tudást kérdezd.\n3. A kérdések legalább 70%-a új, konkrét, önállóan értelmezhető gyakorlati helyzetet, döntést, adatsort vagy következtetést vizsgáljon. Ne csak definíciófelmondatás legyen.\n4. Pontosan négy, ugyanabba a kategóriába tartozó, hihető válaszlehetőség legyen; pontosan EGY helyes megoldás. Minden helytelen válasz legyen ésszerű, de bizonyíthatóan helytelen. Ne legyen két helyes állítás, két szinonima vagy két egyenértékű számérték. A jó válasz helyét változtasd.\n5. Változtasd a kind értékeket a következők között: choice, fill, drag, context. Mindegyik négyopciós egyválaszos. A drag típusnál az egyik felajánlott elemet kell az üres helyre választani. Nem kell order vagy többválaszos feladattípus.\n6. Statisztikai/számszaki kérdésnél számold újra a pontos eredményt, add meg az adatokat, mértékegységeket, kerekítési szabályokat. SQL-nél a pontos lekérdezést és annak logikáját ellenőrizd; írd le az adatstruktúrát, ha szükséges. Más témáknál szakmailag releváns élethelyzetet adj.\n7. Ha egy diagram, táblázat, adatsor vagy képlet a feladatmegértéshez hozzáad, a visual mezőben adjon meg valós, renderelhető ábrát a lent megadott szigorú séma szerint. A feladathoz szükséges információkat semmiképpen ne hagyd csak a magyarázatban. Képleteknél egységeket és jelöléseket magyarázz meg.\n8. Az explanation magyarul, a teszt leadásakor megjelenő értelmes, rövid indoklás legyen. Számolásnál számolási lépéssel; SQL-nél a lényegi feltétel indoklásával.\n9. Ha több alfejezetet választottam, kiegyensúlyozottan kérdezz belőlük. Minden kérdésben a lessonTitle az érintett anyagrész pontos címe legyen.\n10. Egy másik generáláskor új szituációkat és új számadatokat várunk. Ne ismételd a lent felsorolt korábbi kérdéseket. Ne csak a szereplő nevét vagy a számot változtasd meg.\n11. Soha ne kérj hiányzó ábrát, nem elérhető videót vagy nem szereplő kontextust; minden kérdés önállóan megoldható legyen.\n\nKIMENET – FONTOS\nEgy valódi, letölthető, UTF-8 kódolású .json FÁJLT készíts, például MentorKlubb_AI_ZH_${c.id}_${m.id}_${count}.json néven. A chatben NE másold ki a teljes JSON-t és NE használj markdown-kódfence-et. Ellenőrizd a parse-olhatóságot, a ${count} elemet, a négy eltérő opciót és az egyetlen helyes választ.\nA fájlban pontosan egy JSON objektum legyen: {"questions":[...]}. Minden questions elem kötelező mezői:\n- kind: "choice" | "fill" | "drag" | "context"\n- lessonTitle: string (a tananyag pontos címe)\n- difficulty: "könnyű" | "közepes" | "nehéz"\n- stem: a kérdés vagy utasítás magyarul\n- context: a szükséges élethelyzet, tények, feltételek, adatok magyarul\n- options: pontosan négy különböző szöveg (magyarul, szükség szerint SQL kóddal)\n- answer: karakterpontosan egyezzen az egyik options elemmel\n- explanation: szakmailag pontos, rövid magyar indoklás és szükség esetén számolás\n- visual: NEM kötelező, ha kell, akkor CSAK az alábbi séma egyike:\n  {"type":"table","title":"...","columns":["...","..."],"rows":[["...","..."],["...","..."]]}\n  {"type":"bar","title":"...","labels":["A","B"],"values":[12,18]}\n  {"type":"line","title":"...","labels":["1. hét","2. hét"],"values":[12,18]}\n  {"type":"formula","title":"...","expression":"..."}\nNe írj a visual mezőbe HTML-t, JavaScriptet, képlinket vagy base64-képet. Egyes vizuálok csak akkor legyenek, ha valóban hozzáadnak az ellenőrizhető megértéshez.\n\nVÉLETLENSZERŰSÉG / ELTÉRŐ KÉRDÉSEK\nKérésazonosító: ${requestId}; a korábbi mintáktól érdemben különböző helyzeteket tervezz.\n`;
if(recent.length)prompt+='\nKORÁBBI KÉRDÉSEK, AMELYEKET NE ISMÉTELJ:\n'+recent.map((s,i)=>`${i+1}. ${s}`).join('\n')+'\n';
prompt+='\n=== HITELes FORRÁSANYAG KEZDETE ===\n';
for(const p of parts){prompt+='\n### '+p.title+'\n'+p.text+'\n';}
prompt+='\n=== FORRÁSANYAG VÉGE ===\n\nUtolsó ellenőrzés: pontosan '+count+' darab új, gyakorlatias, egyetlen jó válasszal rendelkező, szakmailag helyes feladat. A kész, LETÖLTHETŐ .json FÁJLT add vissza, ne szöveges JSON-választ.\n';
return {prompt,c,m,parts,count};
}
function downloadText(text,name,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),600);}
async function copyPrompt(){const {prompt}=buildPrompt();try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(prompt);}else{const ta=document.createElement('textarea');ta.value=prompt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw Error('A böngésző letiltotta a másolást.');ta.remove();}$('copyStatus').textContent='A teljes prompt és a kiválasztott tananyag a vágólapra került. Illeszd be a ChatGPT-be.';}catch(e){$('copyStatus').textContent='A böngésző itt nem engedi a vágólap használatát. Használd a Kérésfájl letöltése gombot.';}}
function validateQuiz(obj){if(!obj||typeof obj!=='object'||!Array.isArray(obj.questions))throw Error('A fájlban questions tömbnek kell lennie.');if(obj.questions.length<1||obj.questions.length>50)throw Error('1–50 kérdést tartalmazhat a fájl.');const validKinds=['choice','fill','drag','context'];const q=obj.questions.map((raw,i)=>{if(!raw||!validKinds.includes(raw.kind))throw Error(`${i+1}. kérdés: érvénytelen kind.`);if(!safeText(raw.stem)||!safeText(raw.explanation)||!Array.isArray(raw.options)||raw.options.length!==4)throw Error(`${i+1}. kérdés: hiányzó szöveg, magyarázat vagy nem négy opció.`);if(raw.options.some(x=>!safeText(x))||new Set(raw.options).size!==4||!raw.options.includes(raw.answer))throw Error(`${i+1}. kérdés: nem pontosan egy helyes opció van.`);if(raw.context!==undefined&&typeof raw.context!=='string')throw Error(`${i+1}. kérdés: hibás context.`);if(raw.visual!==undefined&&raw.visual!==null){const v=raw.visual;if(!v||!['table','bar','line','formula'].includes(v.type))throw Error(`${i+1}. kérdés: ismeretlen vizualizációtípus.`);if(v.type==='table'){if(!Array.isArray(v.columns)||v.columns.length<1||v.columns.length>8||!Array.isArray(v.rows)||v.rows.length>35||v.rows.some(r=>!Array.isArray(r)||r.length!==v.columns.length))throw Error(`${i+1}. kérdés: hibás táblázat.`);}if(v.type==='bar'||v.type==='line'){if(!Array.isArray(v.labels)||!Array.isArray(v.values)||v.labels.length<2||v.labels.length>14||v.labels.length!==v.values.length||v.values.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw Error(`${i+1}. kérdés: hibás diagramadatok.`);}if(v.type==='formula'&&!safeText(v.expression,1000))throw Error(`${i+1}. kérdés: hiányzó képlet.`);}
return {kind:raw.kind,stem:raw.stem,context:raw.context||'',options:raw.options,answer:raw.answer,explanation:raw.explanation,lessonTitle:typeof raw.lessonTitle==='string'?raw.lessonTitle:'',difficulty:typeof raw.difficulty==='string'?raw.difficulty:'',visual:raw.visual||null};});if(new Set(q.map(x=>x.stem.trim().toLowerCase())).size!==q.length)throw Error('Két kérdés szövege azonos.');return q;}
function renderVisual(v){if(!v)return '';const title=safeText(v.title,160)?'<div class="tagline">'+escapeHtml(v.title)+'</div>':'';if(v.type==='formula')return '<div class="visual formula">'+title+'<div>'+escapeHtml(v.expression)+'</div></div>';if(v.type==='table'){let rows=v.rows.map(row=>'<tr>'+row.map(x=>'<td>'+escapeHtml(String(x).slice(0,200))+'</td>').join('')+'</tr>').join('');return '<div class="visual">'+title+'<table><thead><tr>'+v.columns.map(x=>'<th>'+escapeHtml(String(x).slice(0,100))+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>';}
const vals=v.values,labels=v.labels,n=vals.length,innerWidth=520,base=180,chartHeight=145;
const minVal=Math.min(0,...vals),maxVal=Math.max(0,...vals),range=Math.max(1e-8,maxVal-minVal);
const yVal=value=>base-(value-minVal)/range*chartHeight;
const zeroY=yVal(0);
let svg='';if(v.type==='bar'){let bw=Math.min(40,Math.floor(450/n-10)),step=460/n;vals.forEach((val,i)=>{let target=yVal(val),h=Math.abs(target-zeroY), x=48+(i+.5)*step-bw/2, y=Math.min(target,zeroY);svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="5" fill="#5270e7"/><text x="${x+bw/2}" y="${Math.max(10,target-6)}" text-anchor="middle" font-size="11" fill="#31476b">${escapeHtml(val)}</text><text x="${x+bw/2}" y="201" text-anchor="middle" font-size="10" fill="#516381">${escapeHtml(String(labels[i]).slice(0,17))}</text>`;});}
else{const step=450/(n-1),coords=vals.map((val,i)=>[48+i*step,yVal(val)]);svg+=`<polyline fill="none" stroke="#4767db" stroke-width="3" points="${coords.map(p=>p.join(',')).join(' ')}"/>`;coords.forEach((xy,i)=>svg+=`<circle cx="${xy[0]}" cy="${xy[1]}" r="5" fill="#4465df"/><text x="${xy[0]}" y="${Math.max(11,xy[1]-12)}" text-anchor="middle" font-size="11" fill="#31476b">${escapeHtml(vals[i])}</text><text x="${xy[0]}" y="201" text-anchor="middle" font-size="10" fill="#516381">${escapeHtml(String(labels[i]).slice(0,15))}</text>`);}

return `<div class="visual">${title}<svg viewBox="0 0 560 220" role="img" aria-label="${escapeHtml(v.title||'Diagram')}"><line x1="40" y1="${zeroY}" x2="520" y2="${zeroY}" stroke="#b9c9e0" stroke-width="1.4"/>${svg}</svg></div>`;}
// A segítségek teljes egészében a weboldalon működnek, a JSON-teszt sémáját nem bővítik.
let helpStates=[];
const HELP_NAMES={poll:'Válaszeloszlás',fifty:'50:50',terms:'Fogalomsegéd',steps:'Gondolkodási útmutató'};
const TERM_BANK=[
 ['súlyozott átlag','Súlyozott átlag: eltérő fontosságú adatoknál minden értéket a hozzá tartozó súllyal veszünk figyelembe.'],
 ['százalékpont','Százalékpont: két százalékérték különbségének mértékegysége; nem azonos a százalékos változással.'],
 ['relatív gyakoriság','Relatív gyakoriság: egy kategória előfordulásainak aránya az összes megfigyeléshez képest.'],
 ['szórás','Szórás: az adatok átlag körüli szóródásának mértéke, az eredeti mértékegységben.'],
 ['variancia','Variancia: az átlagtól vett eltérések négyzetes alapú átlaga; mértékegysége négyzetes.'],
 ['medián','Medián: a rendezett adatsor középső értékét jelöli; kiugró értékekre kevésbé érzékeny.'],
 ['kvartilis','Kvartilis: rendezett adatsor alapján meghatározott negyedpont, amely az adatok elhelyezkedését írja le.'],
 ['korreláció','Korreláció: két mennyiség együttjárásának irányát és erősségét jellemzi; önmagában nem igazol okságot.'],
 ['mintavétel','Mintavétel: egy nagyobb sokaságból adatok kiválasztása elemzéshez; a torzítás kockázatára figyelni kell.'],
 ['hisztogram','Hisztogram: számszerű adatok intervallumok szerinti gyakoriságát megjelenítő ábra.'],
 ['gyakoriság','Gyakoriság: az adott érték vagy kategória előfordulásainak száma.'],
 ['módusz','Módusz: egy adatsor leggyakrabban előforduló értéke vagy kategóriája.'],
 ['átlag','Átlag: a megfigyelt értékek összegét az értékek számához viszonyító mutató.'],
 ['százalék','Százalék: századrészben kifejezett arány; mindig ellenőrizd, mi a viszonyítási alap.'],
 ['arány','Arány: két mennyiség egymáshoz viszonyított nagysága, amelynek értelmezéséhez nevező kell.'],
 ['eloszlás','Eloszlás: megmutatja, hogyan helyezkednek el az adatok az értékek vagy kategóriák között.'],
 ['group by','GROUP BY: azonos csoportkulcsú sorokat összevonó SQL-záradék, jellemzően aggregáláshoz.'],
 ['having','HAVING: csoportosítás után, a csoportokra vonatkozó feltétellel szűr.'],
 ['where','WHERE: a lekérdezés sorait szűri az aggregálás előtt.'],
 ['inner join','INNER JOIN: csak az összekapcsolási feltételnek megfelelő sorpárokat tartja meg.'],
 ['left join','LEFT JOIN: a bal oldali tábla sorait akkor is megtartja, ha nincs hozzájuk jobb oldali pár.'],
 ['join','JOIN: két adatforrás sorait kapcsolja össze a megadott illesztési feltétellel.'],
 ['partition by','PARTITION BY: ablakfüggvényhez részhalmazokra osztja a sorokat anélkül, hogy összevonná őket.'],
 ['order by','ORDER BY: a kimeneti sorokat rendezheti; ablakfüggvényen belül a feldolgozási sorrendet is adhatja.'],
 ['row_number','ROW_NUMBER(): soronként egyedi sorszámot ad a meghatározott rendezés szerint.'],
 ['dense_rank','DENSE_RANK(): azonos értékek azonos rangot kapnak, a következő rangnál nincs kihagyás.'],
 ['rank','RANK(): azonos értékek azonos rangot kapnak, a következő rangnál lehet kihagyás.'],
 ['distinct','DISTINCT: a lekérdezés eredményében az ismétlődő sorokat eltávolítja a kijelölt oszlopok alapján.'],
 ['count','COUNT(): sorok vagy nem NULL értékek darabszámának meghatározására szolgáló aggregáló függvény.'],
 ['null','NULL: hiányzó vagy nem ismert adatot jelöl; nem azonos a nullával vagy az üres karakterlánccal.'],
 ['case','CASE: feltétel alapján különböző értékeket előállító SQL-kifejezés.'],
 ['cte','CTE: WITH-tel definiált, névvel hivatkozható átmeneti lekérdezési eredmény.'],
 ['index','Index: adatbázisban a keresést gyorsító adatszerkezet, amelynek karbantartási költsége is van.'],
 ['sql','SQL: relációs adatok lekérdezésére és kezelésére használt nyelv.'],
 ['star','STAR: helyzet (Situation), feladat (Task), cselekvés (Action), eredmény (Result) szerinti válaszfelépítés.'],
 ['ats','ATS: pályázatkezelő rendszer, amelyben az önéletrajz olvashatósága és szerkezete fontos.'],
 ['önéletrajz','Önéletrajz: a pozíció szempontjából lényeges tapasztalatok és készségek áttekinthető bemutatása.'],
 ['kompetencia','Kompetencia: feladatok elvégzéséhez szükséges tudás, készségek és viselkedés együttese.'],
 ['portfólió','Portfólió: konkrét munkák vagy projektek gyűjteménye, amellyel egy készség igazolható.'],
 ['bértárgyalás','Bértárgyalás: a juttatási feltételek egyeztetése, amelyet piaci és munkaköri adatokkal érdemes alátámasztani.'],
 ['interjú','Állásinterjú: kétirányú egyeztetés, ahol a munkához illeszkedő tapasztalatokat példákkal érdemes igazolni.'],
 ['eredmény','Eredmény: a tevékenység mérhető vagy megfigyelhető hatása; válaszd külön az elvégzett feladattól.']
];
function newHelpState(){return {poll:false,fifty:false,terms:false,steps:false,hidden:[],distribution:null,used:[]};}
function helpFor(index){if(!helpStates[index])helpStates[index]=newHelpState();return helpStates[index];}
function markHelp(h,key){if(!h.used.includes(key))h.used.push(key);}
function generateDistribution(q){
  // Szándékosan szimulált, akár tévedő 'közönségtipp' – nem statisztikai vagy AI-becslés.
  const correct=q.options.indexOf(q.answer),wrong=[0,1,2,3].filter(i=>i!==correct);
  const values=[0,0,0,0],favored=Math.random()<.7;
  const main= favored?43+Math.floor(Math.random()*10):31+Math.floor(Math.random()*7);
  values[correct]=main;
  const weight=wrong.map(()=>.55+Math.random());
  if(!favored)weight[Math.floor(Math.random()*3)]+=1.5;
  const sum=weight.reduce((a,b)=>a+b,0),rest=100-main;
  wrong.forEach((i,k)=>values[i]=Math.floor(rest*weight[k]/sum));
  const delta=100-values.reduce((a,b)=>a+b,0);values[wrong[0]]+=delta;
  return values;
}
function matchingTerms(q){
 const text=[q.stem,q.context,q.lessonTitle,q.visual&&q.visual.title,q.visual&&q.visual.expression].filter(Boolean).join(' ').toLocaleLowerCase('hu-HU');
 const found=[];
 for(const [term,definition] of TERM_BANK){if(text.includes(term)&&!found.some(x=>x[0].includes(term)||term.includes(x[0]))){found.push([term,definition]);}}
 return found.slice(0,3);
}
function learningSteps(q){
 const t=[q.stem,q.context,q.lessonTitle].join(' ').toLocaleLowerCase('hu-HU');
 let steps;
 if(/\bsql\b|\bselect\b|\bjoin\b|\bwhere\b|\bhaving\b|\bgroup by\b|\bpartition by\b|lekérdez|adatbázis|ablakfüggvény/.test(t)){
   steps=['Azonosítsd az elvárt kimenetet: mely sorok, oszlopok vagy csoportok kellenek?', 'Különítsd el a soronkénti műveletet az aggregálástól és az ablakszámítástól.', 'Ellenőrizd a feltételek helyét, a NULL-értékeket és egy egyszerű próbaadatot.'];
 }else if(/statiszt|szórás|medián|átlag|arány|százalék|valószínűség|kvartilis|gyakoriság|eloszlás|korreláció|minta|variancia|diagram|hisztogram/.test(t)||q.visual&&['bar','line','formula','table'].includes(q.visual.type)){
   steps=['Írd össze a megadott adatokat, mértékegységeket és a keresett mennyiséget.', 'Válaszd ki a célnak megfelelő mutatót vagy műveletet; külön ellenőrizd a viszonyítási alapot.', 'Becsüld meg a nagyságrendet, majd vesd össze a válaszokat és a kerekítést.'];
 }else if(/önéletrajz|\bcv\b|pályáz|tapasztalat|kompetencia|portfólió|ats/.test(t)){
   steps=['Azonosítsd a megpályázott szerepkört és az értékelt készséget.', 'A konkrét bizonyítékot vagy mérhető eredményt keresd, ne az általános állítást.', 'Ellenőrizd, melyik lehetőség releváns, hiteles és könnyen értelmezhető.'];
 }else if(/interjú|toborz|állásajánlat|hr|bértárgyal|visszajelzés|munkáltató/.test(t)){
   steps=['Mi a helyzet célja, és mi a szereplők szempontja?', 'Keress konkrét, tiszteletteljes és ellenőrizhető lépést vagy példát.', 'Zárd ki a túlzó, homályos és a helyzet feltételeit figyelmen kívül hagyó választ.'];
 }else{
   steps=['Fogalmazd meg egy mondatban, pontosan mit kell eldöntened.', 'Válaszd szét a feladat tényadatait a feltételezéseidtől.', 'Ellenőrizd mind a négy lehetőséget a megadott feltételek alapján.'];
 }
 if(/nem helyes|nem igaz|kivétel|melyik hibás|téves|nem megfelelő/.test(t))steps.unshift('Figyelj a tagadó kérdésre: itt a hibás vagy kivételes állítást keresed.');
 return steps.slice(0,4);
}
function renderHelp(q,h){
 const pill=(key,icon,name,desc)=>`<button type="button" class="help-btn ${h[key]?'help-active':''}" data-help="${key}" ${h[key]?'disabled':''} aria-pressed="${h[key]?'true':'false'}"><span class="help-icon" aria-hidden="true">${icon}</span><span><strong>${name}</strong><small>${h[key]?'Egyszer aktiválva, már nem vonható vissza':desc}</small></span>${h[key]?'<span class="help-check" aria-hidden="true">✓</span>':''}</button>`;
 let panel='';
 if(h.poll){panel+=`<div class="help-output" id="pollHelp"><strong>Játékos válaszeloszlás</strong><p>Ezek <b>szimulált tippek</b>, nem valódi szavazatok vagy megbízható valószínűségek. A legmagasabb érték is tévedhet.</p><div class="help-bars">${h.distribution.map((v,i)=>`<div class="help-bar-row ${h.hidden.includes(i)?'bar-muted':''}"><span>${String.fromCharCode(65+i)}</span><div class="help-track"><div style="width:${h.hidden.includes(i)?0:v}%"></div></div><b>${h.hidden.includes(i)?'kizárva':v+'%'}</b></div>`).join('')}</div></div>`;}
 if(h.fifty){panel+=`<div class="help-output help-output-green" id="fiftyHelp"><strong>50:50 segítség aktiválva</strong><p>Két biztosan hibás válasz rejtve marad ennél a kérdésnél. A két megmaradt opció közül neked kell döntened.</p></div>`;}
 if(h.terms){const terms=matchingTerms(q);panel+=`<div class="help-output" id="termsHelp"><strong>Fogalomsegéd</strong>${terms.length?`<dl class="help-definitions">${terms.map(([term,def])=>`<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(def)}</dd></div>`).join('')}</dl>`:'<p>Ehhez a kérdéshez nincs előre elkészített, egyező fogalom a helyi szótárban. Azonosítsd a feladat kulcsszavait, és nézd meg, melyik feltétel döntő.</p>'}<p class="help-disclaimer">Helyi fogalomtár: nem AI-válasz és nem ellenőrzött megoldás.</p></div>`;}
 if(h.steps){panel+=`<div class="help-output" id="stepsHelp"><strong>Gondolkodási útmutató</strong><ol class="help-steps">${learningSteps(q).map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ol><p class="help-disclaimer">Módszertani támpont, nem a kérdés konkrét megoldása.</p></div>`;}
 return `<section class="help-section" aria-label="Tanulási segítségek"><div class="help-heading"><div><strong>✦ Tanulási segítségek</strong><span>Használd, amikor elakadsz. A pontszámod nem csökken.</span></div><span class="help-usage">${h.used.length}/4 használva</span></div><div class="help-grid">${pill('poll','◔','Válaszeloszlás','Bizonytalan közönségtipp')}${pill('fifty','½','50:50','Két rossz válasz kiesik')}${pill('terms','Aa','Fogalomsegéd','Kapcsolódó fogalmak')}${pill('steps','↗','Gondolkodási lépések','Útmutató, nem megoldás')}</div>${panel?`<div class="help-panels" aria-live="polite">${panel}</div>`:''}</section>`;
}
async function triggerHelp(key){
 if(!loaded||!['poll','fifty','terms','steps'].includes(key))return;
 const q=loaded.questions[pos],h=helpFor(pos),current=pos;
 if(h[key])return; // Segítséget nem lehet kikapcsolni vagy visszavonni.
 if(key==='terms'&&!matchingTerms(q).length){window.MK_EXP?.notify('Nincs ehhez a kérdéshez megfelelő fogalom a helyi szótárban. A fogalomsegédért nem vontunk le Szikrát.',false);return;}
 if(!window.MK_EXP){alert('A fizetős segítségek adattára nem töltődött be.');return;}
 const paid=await window.MK_EXP.purchaseHelp(key);
 if(!paid)return;
 // Megerősítés közben megváltozott kérdés esetén is az eredeti kérdés kapja a segítséget.
 if(key==='fifty'){
   const right=q.options.indexOf(q.answer),wrong=[0,1,2,3].filter(i=>i!==right);
   wrong.splice(Math.floor(Math.random()*wrong.length),1);
   h.hidden=wrong;h.fifty=true;
   if(h.hidden.includes(answers[current]))answers[current]=null;
 }else if(key==='poll'){
   h.poll=true; if(!h.distribution)h.distribution=generateDistribution(q);
 }else{h[key]=true;}
 markHelp(h,key);renderCurrent();
}

function renderCurrent(){
 if(!loaded)return;
 const q=loaded.questions[pos],h=helpFor(pos);
 $('quizTitle').textContent=loaded.name||'AI-teszt';
 $('quizCounter').textContent=`${pos+1} / ${loaded.questions.length}`;
 $('progressBar').style.width=(answers.filter(x=>x!==null).length/loaded.questions.length*100)+'%';
 const options=q.options.map((option,i)=>h.hidden.includes(i)
  ? `<div class="option option-eliminated" aria-label="${String.fromCharCode(65+i)} válasz kizárva"><span class="letter">${String.fromCharCode(65+i)}</span><span>Ez a válasz kizárva (50:50)</span></div>`
  : `<button class="option ${answers[pos]===i?'chosen':''}" type="button" data-choice="${i}" aria-pressed="${answers[pos]===i?'true':'false'}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(option)}</span></button>`).join('');
 const html=`<div class="question-card"><span class="tagline">${escapeHtml(q.lessonTitle||'AI-teszt')} · ${escapeHtml(q.difficulty||q.kind)}</span><h3>${escapeHtml(q.stem)}</h3>${q.context?'<div class="question-context">'+escapeHtml(q.context)+'</div>':''}${renderVisual(q.visual)}<div class="option-list">${options}</div></div>`;
 $('questionArea').innerHTML=html;
 $('questionArea').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{answers[pos]=Number(b.dataset.choice);renderCurrent();}));
 window.MK_EXP?.mountHelp(renderHelp(q,h),triggerHelp);
 $('prevQuestion').disabled=pos===0;
 $('nextQuestion').classList.toggle('hidden',pos===loaded.questions.length-1);
 $('gradeExam').classList.toggle('hidden',pos!==loaded.questions.length-1);
 $('quizNumbers').innerHTML=loaded.questions.map((_,i)=>`<button type="button" class="num ${answers[i]!==null?'answered':''} ${i===pos?'current':''}" data-go="${i}" aria-label="${i+1}. kérdés">${i+1}</button>`).join('');
 $('quizNumbers').querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{pos=Number(b.dataset.go);renderCurrent();});
}
function showExam(){window.MK_EXP?.hideHelp();answers=Array(loaded.questions.length).fill(null);helpStates=loaded.questions.map(()=>newHelpState());pos=0;$('exam').classList.remove('hidden');$('results').classList.add('hidden');renderCurrent();$('exam').scrollIntoView({behavior:'smooth',block:'start'});}
async function grade(){
 if(!loaded||window._mkGrading)return;
 const missed=answers.filter(x=>x===null).length;
 if(missed&&!confirm(`Még ${missed} kérdésre nem válaszoltál. Így is leadod a tesztet?`))return;
 window._mkGrading=true;$('gradeExam').disabled=true;
 try{
  const score=loaded.questions.reduce((sum,q,i)=>sum+(answers[i]!==null&&q.options[answers[i]]===q.answer?1:0),0);
  const result={id:Date.now()+Math.random(),name:loaded.name,when:new Date().toLocaleString('hu-HU'),score,total:loaded.questions.length,answers:answers.slice(),questions:loaded.questions,helpUsed:helpStates.map(h=>(h.used||[]).slice())};
  history.unshift(result);history=history.slice(0,12);writeHistory();renderHistory();activeResult=result;renderResult(result);
  $('exam').classList.add('hidden');$('results').classList.remove('hidden');window.MK_EXP?.hideHelp();
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
  try{await window.MK_EXP?.recordQuiz({questions:loaded.questions,total:loaded.questions.length,score,answered:answers.filter(x=>x!==null).length});}
  catch(e){window.MK_EXP?.notify('A ZH kiértékelve, de az Expedíció jutalmát nem sikerült menteni: '+e.message,false)}
 }finally{window._mkGrading=false;$('gradeExam').disabled=false;}
}

function renderResult(r){const pct=Math.round(r.score/r.total*100);let html=`<div class="result-head"><div><span class="eyebrow dark">LEZÁRT TESZT · ${escapeHtml(r.when||'')}</span><h2>${escapeHtml(r.name||'AI-teszt')}</h2><p>${r.score} helyes válasz a(z) ${r.total} kérdésből.</p></div><strong class="result-percent">${pct}%</strong></div>`;r.questions.forEach((q,i)=>{const chosen=r.answers[i]!==null&&r.answers[i]!==undefined?q.options[r.answers[i]]:null;const good=chosen===q.answer;html+=`<article class="result-item"><span class="tagline">${i+1}. KÉRDÉS · ${escapeHtml(q.lessonTitle||'')}</span><h3>${escapeHtml(q.stem)}</h3>${q.context?'<p>'+escapeHtml(q.context)+'</p>':''}${renderVisual(q.visual)}<p class="${good?'correct':'incorrect'}">Saját válasz: ${escapeHtml(chosen??'Nincs válasz')}</p><p class="correct">Helyes megoldás: ${escapeHtml(q.answer)}</p><p>Magyarázat: ${escapeHtml(q.explanation)}</p>${r.helpUsed&&r.helpUsed[i]&&r.helpUsed[i].length?`<p class="help-result-note">Felhasznált segítségek: ${r.helpUsed[i].map(h=>escapeHtml(HELP_NAMES[h]||h)).join(', ')}</p>`:''}</article>`;});$('resultDetails').innerHTML=html;$('removeFromResult').disabled=!loaded;}
function renderHistory(){const list=$('historyList');if(!history.length){list.innerHTML='<p>Még nincs kiértékelt AI-teszt. Az első teszted után itt jelennek meg az előzmények.</p>';return;}list.innerHTML=history.map((r,i)=>`<div class="history-row"><div><strong>${escapeHtml(r.name||'AI-teszt')} · ${r.score}/${r.total} pont</strong><p>${escapeHtml(r.when||'')} · ${Math.round(100*r.score/r.total)}%</p></div><button class="secondary" type="button" data-reopen="${i}">Visszanézem</button></div>`).join('');list.querySelectorAll('[data-reopen]').forEach(b=>b.onclick=()=>{const r=history[Number(b.dataset.reopen)];if(r&&!Array.isArray(r.questions))return;activeResult=r;renderResult(r);$('exam').classList.add('hidden');window.MK_EXP?.hideHelp();$('results').classList.remove('hidden');$('results').scrollIntoView({behavior:'smooth'});});}
async function importFile(file){$('importStatus').className='import-status';$('startExam').disabled=true;loaded=null;$('removeExam').disabled=true;$('results').classList.add('hidden');$('exam').classList.add('hidden');if(!file)return;try{if(!file.name.toLowerCase().endsWith('.json'))throw Error('Csak .json kiterjesztésű tesztfájlt válassz.');if(file.size>1500000)throw Error('A tesztfájl túl nagy (legfeljebb 1,5 MB).');const txt=await file.text();const obj=JSON.parse(txt);const questions=validateQuiz(obj);loaded={name:file.name.replace(/\.json$/i,''),questions};$('importStatus').textContent=`Betöltve: ${file.name} · ${questions.length} érvényes kérdés. A helyes válaszokat csak a kiértékelés mutatja.`;$('importStatus').classList.add('ok');$('startExam').disabled=false;$('removeExam').disabled=false;}catch(e){$('importStatus').textContent='A fájl nem tölthető be: '+e.message;$('importStatus').classList.add('error');$('jsonInput').value='';}}
function removeFile(){window.MK_EXP?.hideHelp();loaded=null;answers=[];helpStates=[];pos=0;$('jsonInput').value='';$('startExam').disabled=true;$('removeExam').disabled=true;$('exam').classList.add('hidden');$('importStatus').textContent='A betöltött teszt eltávolítva. Az előzmények megmaradtak.';$('importStatus').className='import-status';$('removeFromResult').disabled=true;}
function init(){if(!COURSES.length){$('sourceInfo').textContent='Hiba: a tananyagadatok nem töltődtek be. Ellenőrizd, hogy az AI_Anyagok.js fájl a HTML mellett van-e.';return;}fill($('aiCourse'),COURSES);updateModule();$('aiCourse').onchange=updateModule;$('aiModule').onchange=updateParts;$('aiPart').onchange=updateSource;$('promptDownload').onclick=()=>{const {prompt,c,m,parts}=buildPrompt();downloadText(prompt,`MentorKlubb_AI_Keres_${c.id}_M${m.id}_${parts.length}resz.txt`,'text/plain;charset=utf-8');$('copyStatus').textContent='A tananyagot is tartalmazó kérésfájl letöltődött. Töltsd fel a ChatGPT-be, majd kérd a JSON-tesztfájlt.';};$('promptCopy').onclick=copyPrompt;$('jsonInput').onchange=e=>importFile(e.target.files[0]);$('startExam').onclick=showExam;$('removeExam').onclick=removeFile;$('prevQuestion').onclick=()=>{pos=Math.max(0,pos-1);renderCurrent();};$('nextQuestion').onclick=()=>{pos=Math.min(loaded.questions.length-1,pos+1);renderCurrent();};$('gradeExam').onclick=grade;$('backFromResult').onclick=()=>{$('results').classList.add('hidden');$('generator').scrollIntoView({behavior:'smooth'});};$('removeFromResult').onclick=removeFile;renderHistory();}
init();
})();
