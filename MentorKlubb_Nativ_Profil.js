/* MentorKlubb natív profilmentés – tartós adatkulcs és időkorlátos indítás.
   Androidon a natív parancs hibája nem akadályozhatja az Expedíció felületének betöltését.
   Ha a natív fájl olvasása nem válaszol, nem írjuk felül látatlanul a meglévő natív mentést. */
(()=>{
 'use strict';
 const KEY='mentorklubb_expedicio_profile_v1';
 const invoke=window.__TAURI__?.core?.invoke;
 const originalSet=Storage.prototype.setItem;
 const valid=s=>{try{return JSON.parse(s)?.schema===1}catch{return false}};
 let nativeReady=false,chain=Promise.resolve();
 const persist=value=>{
   if(!invoke||!nativeReady||!valid(value))return;
   chain=chain.catch(()=>{}).then(()=>invoke('save_expedicio_profile',{data:value})).catch(err=>{
     console.warn('[MentorKlubb] Natív profilmentés sikertelen:',err);
     window.mkNativeProfileWarning='Natív profilmentés sikertelen: '+String(err);
   });
 };
 function bounded(promise,ms){
   return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('A natív profilbetöltés nem válaszolt '+ms+' ms alatt.')),ms))]);
 }
 window.mkNativeProfileReady=(async()=>{
   if(!invoke)return;
   try{
     const local=localStorage.getItem(KEY);
     const native=await bounded(invoke('load_expedicio_profile'),4500);
     // Csak ellenőrzött natív válasz után engedjük a fájlmódosítást.
     nativeReady=true;
     if(valid(local))persist(local);
     else if(valid(native))originalSet.call(localStorage,KEY,native);
   }catch(err){
     console.warn('[MentorKlubb] Natív profilbetöltés:',err);
     window.mkNativeProfileWarning=String(err?.message||err);
   }
   // A localStorage elsődleges a webes felületek között; a natív fájl külön biztonsági réteg.
   Storage.prototype.setItem=function(key,value){
     originalSet.call(this,key,value);
     if(this===localStorage&&key===KEY)persist(String(value));
   };
 })();
})();
