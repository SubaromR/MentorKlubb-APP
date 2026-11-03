/* MentorKlubb Expedíció v1 – stabil, frissítéseken át megtartott adatkulcs.
   Kizárólag a MentorKlubb_Adattar.html stabil URL-jén fut. */
(()=>{'use strict';
const KEY='mentorklubb_expedicio_profile_v1';
const MAXLOG=90;
const costs={poll:{spark:7,relic:0},fifty:{spark:0,relic:1},terms:{spark:5,relic:0},steps:{spark:9,relic:0}};
const day=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateOf=s=>{const [y,m,d]=String(s||'').split('-').map(Number);return new Date(y,m-1,d,12)};
const daysBetween=(a,b)=>Math.round((dateOf(b)-dateOf(a))/86400000);
const monday=(date=new Date())=>{const d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);d.setDate(d.getDate()-(d.getDay()+6)%7);return day(d)};
const weekend=(now=new Date())=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),18);d.setDate(d.getDate()-((d.getDay()+2)%7)); // most recent Friday at 18
 if(now<d)d.setDate(d.getDate()-7); const end=new Date(d);end.setDate(end.getDate()+3);
 return {id:day(d), active:now>=d&&now<end,ends:end.getTime(),starts:d.getTime()};};
const fresh=()=>({schema:1,created:new Date().toISOString(),spark:60,relic:2,xp:0,level:1,levelXP:0,streak:0,bestStreak:0,lastVisit:'',totalVisits:0,tests:0,uniqueTests:0,successfulUnique:0,correct:0,answered:0,usedHelps:0,seen:{},daily:{id:'',tests:0,answered:0,correct:0,high:0,helps:0,claimed:[]},weekly:{id:'',tests:0,answered:0,correct:0,high:0,helps:0,days:[],claimed:[]},event:{id:'',tests:0,correct:0,claimed:[]},pendingChests:[],chestsOpened:0,collection:[],log:[]});
let state;
function safeLoad(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(!raw)return fresh();return validate(raw)}catch(e){return fresh()}}
function validate(p){if(!p||typeof p!=='object'||p.schema!==1)throw Error('Nem támogatott mentésverzió.');const def=fresh(),r={...def,...p};
 for(const k of ['spark','relic','xp','level','levelXP','streak','bestStreak','totalVisits','tests','uniqueTests','successfulUnique','correct','answered','usedHelps','chestsOpened']){if(!Number.isSafeInteger(r[k])||r[k]<0||r[k]>1e10)throw Error('Hibás mentett számadat: '+k)}
 if(r.level<1||!Array.isArray(r.pendingChests)||r.pendingChests.length>300||!Array.isArray(r.collection)||r.collection.length>300||!Array.isArray(r.log)||r.log.length>1000||!r.seen||typeof r.seen!=='object')throw Error('Hibás profiladatok.');
 for(const k of ['daily','weekly','event']){if(!r[k]||typeof r[k]!=='object'||!Array.isArray(r[k].claimed))throw Error('Hibás küldetésadat.');}
 r.log=r.log.slice(0,MAXLOG);r.collection=[...new Set(r.collection.filter(x=>typeof x==='string'))].slice(0,200);r.pendingChests=r.pendingChests.filter(x=>x&&['standard','rare'].includes(x.type)).slice(0,100);return r;}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function addLog(label){state.log.unshift({at:new Date().toISOString(),label:String(label).slice(0,160)});state.log=state.log.slice(0,MAXLOG)}
function badge(id){if(!state.collection.includes(id)){state.collection.push(id);addLog('Új gyűjthető relikvia: '+({pioneer:'Első felfedező',level3:'Bronz tudásszobor',level10:'Ezüst tudásszobor',level25:'Arany tudásszobor',streak7:'Hét nap fénye',tests10:'Tíz próba emlékműve',event:'Hétvégi expedíció'}[id]||id));return true}return false;}
function addXP(x){state.xp+=x;state.levelXP+=x;let levels=0;while(state.levelXP>=100+state.level*30&&levels<1000){state.levelXP-=100+state.level*30;state.level++;levels++;state.spark+=12+Math.min(state.level,30);if(state.level%5===0)state.relic++; if(state.level>=3)badge('level3');if(state.level>=10)badge('level10');if(state.level>=25)badge('level25');}
 return levels;}
function checkPeriods(){const today=day(),wk=monday(),ev=weekend();
 if(state.daily.id!==today)state.daily={id:today,tests:0,answered:0,correct:0,high:0,helps:0,claimed:[]};
 if(state.weekly.id!==wk)state.weekly={id:wk,tests:0,answered:0,correct:0,high:0,helps:0,days:[],claimed:[]};
 if(state.event.id!==ev.id)state.event={id:ev.id,tests:0,correct:0,claimed:[]};}
function visit(){checkPeriods();const today=day();if(state.lastVisit===today)return {first:false};const gap=state.lastVisit?daysBetween(state.lastVisit,today):99;
 state.streak=gap===1?state.streak+1:1;state.bestStreak=Math.max(state.bestStreak,state.streak);state.lastVisit=today;state.totalVisits++;
 const reward=10+Math.min(6,state.streak-1)*3;state.spark+=reward;
 const rare=state.streak%7===0?1:0;state.relic+=rare;
 if(state.streak>=7)badge('streak7');addLog('Napi belépés: +'+reward+' Szikra'+(rare?', +1 Relikvia':''));return {first:true,reward,rare};}
const QU={daily:[['one','Az első tudáspróba',p=>p.daily.tests,1,18,0],['questions','Fedezz fel 12 feladatot',p=>p.daily.answered,12,16,0],['accuracy','70% feletti eredmény',p=>p.daily.high,1,20,0],['help','Tudatos segítséghasználat',p=>p.daily.helps,1,12,0]], weekly:[['three','Három tanulási alkalom',p=>p.weekly.tests,3,42,1],['correct','40 helyes megoldás',p=>p.weekly.correct,40,55,0],['days','Tanulj két különböző napon',p=>p.weekly.days.length,2,32,1]],event:[['eventQuiz','Hétvégi dupla kihívás',p=>p.event.tests,2,40,1],['eventCorrect','18 helyes válasz',p=>p.event.correct,18,28,0]]};
function progress(){return {state,day:day(),week:monday(),weekend:weekend(),quests:Object.fromEntries(Object.entries(QU).map(([key,items])=>[key,items.map(([id,name,get,target,spark,relic])=>({id,name,progress:Math.min(target,get(state)),target,claimed:state[key].claimed.includes(id),spark,relic}))])),costs};}
function claim(scope,id){checkPeriods();if(!QU[scope])throw Error('Ismeretlen küldetés.');const item=QU[scope].find(x=>x[0]===id);if(!item)throw Error('Ismeretlen küldetés.');const [key,name,get,target,spark,relic]=item;if(scope==='event'&&!weekend().active)throw Error('Az esemény már nem aktív.');if(state[scope].claimed.includes(key))throw Error('A jutalmat már felvetted.');if(get(state)<target)throw Error('A küldetés még nem teljesült.');state[scope].claimed.push(key);state.spark+=spark;state.relic+=relic;if(scope==='event')badge('event');addLog('Küldetés teljesítve: '+name);return {name,spark,relic};}
function helpCost(key){const c=costs[key];if(!c)throw Error('Ismeretlen segítség.');if(state.spark<c.spark||state.relic<c.relic)throw Error(`Nincs elég ${state.relic<c.relic?'Relikviád':'Szikrád'} ehhez a segítséghez.`);state.spark-=c.spark;state.relic-=c.relic;state.usedHelps++;state.daily.helps++;state.weekly.helps++;addLog('Segítség: '+key+' (−'+(c.spark?c.spark+' Szikra':c.relic+' Relikvia')+')');return {cost:c};}
function quiz(d){checkPeriods();const {hash,total,score,answered}=d;
 if(typeof hash!=='string'||hash.length>100||!Number.isInteger(total)||total<1||total>50||!Number.isInteger(score)||score<0||score>total||!Number.isInteger(answered)||answered<0||answered>total)throw Error('Hibás ZH-eredmény.');
 const today=day(),prev=state.seen[hash],freshQuiz=!prev,replayed=!!prev&&prev.lastReward!==today;
 if(!freshQuiz&&!replayed){addLog('Ismételt ZH – mai második teljesítés, jutalom nélkül');return {reward:false,reason:'Ugyanez a feladatsor ma már adott jutalmat.'};}
 if(freshQuiz)state.seen[hash]={first:today,lastReward:today};else state.seen[hash].lastReward=today;
 const qualifies=answered>=Math.min(5,total),quality=score/total>=.5;
 let sparks=0,xp=0,chest=false;
 if(!qualifies){xp=freshQuiz?6:3;sparks=0;}
 else if(!freshQuiz){xp=10;sparks=6;}
 else{xp=25+score*3;sparks=18+score*2;if(!quality){xp=12;sparks=8;} else{state.successfulUnique++;state.pendingChests.push({id:Date.now()+'-'+state.tests,type:state.successfulUnique%5===0?'rare':'standard'});chest=true;}}
 state.spark+=sparks;const levels=addXP(xp);state.tests++;if(freshQuiz)state.uniqueTests++;
 state.correct+=score;state.answered+=answered;
 state.daily.tests++;state.daily.answered+=answered;state.daily.correct+=score;state.weekly.tests++;state.weekly.answered+=answered;state.weekly.correct+=score;
 if(score/total>=.7){state.daily.high++;state.weekly.high++;}
 if(!state.weekly.days.includes(today))state.weekly.days.push(today);
 if(weekend().active){state.event.tests++;state.event.correct+=score;}
 if(state.uniqueTests>=1)badge('pioneer');if(state.uniqueTests>=10)badge('tests10');
 addLog('ZH '+score+'/'+total+': +'+sparks+' Szikra, +'+xp+' XP'+(chest?', jutalomláda':''));
 return {reward:true,sparks,xp,levels,chest,first:freshQuiz};}
function openChest(){const chest=state.pendingChests.shift();if(!chest)throw Error('Nincs felnyitható láda.');state.chestsOpened++;const rare=chest.type==='rare';const spark=rare?25+(state.chestsOpened%4)*5:10+(state.chestsOpened%4)*4;
 const relic=rare?1:state.chestsOpened%6===0?1:0;state.spark+=spark;state.relic+=relic;addLog((rare?'Ritka':'Felfedező')+' láda: +'+spark+' Szikra'+(relic?', +'+relic+' Relikvia':''));return {spark,relic,type:chest.type};}
function restore(data){const test=validate(data);state=test;checkPeriods();addLog('Profil biztonsági mentésből visszaállítva');return {restored:true}}
const operations={status:()=>progress(),visit,help:helpCost,grade:quiz,claim:(a)=>claim(a.scope,a.id),chest:openChest,restore:(a)=>restore(a),backup:()=>({format:'MentorKlubb-Expedicio-Backup',version:1,created:new Date().toISOString(),profile:state})};
state=safeLoad();
// Android WebView: a rejtett iframe elindulása megbízhatatlan lehet.
// A tanulófelület ilyenkor közvetlenül használja ezt az adattármotort
// ugyanazon az origin-en, natív fájlmentéssel együtt.
function execute(op,payload){
 if(!Object.prototype.hasOwnProperty.call(operations,op))throw Error('Ismeretlen adattárművelet.');
 const result=operations[op](payload);
 if(op!=='status'&&op!=='backup')save();
 return {result,state:progress()};
}
window.MK_EXP_ENGINE={execute};
window.addEventListener('message',event=>{
 const d=event.data;
 if(!d||d.mkHub!==1||typeof d.id!=='number'||!Object.prototype.hasOwnProperty.call(operations,d.op))return;
 try{const r=execute(d.op,d.payload);event.source?.postMessage({mkHub:1,id:d.id,ok:true,...r},'*');}
 catch(err){event.source?.postMessage({mkHub:1,id:d.id,ok:false,error:String(err.message||err),state:progress()},'*');}
});
})();
