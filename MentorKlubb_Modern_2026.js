/* MentorKlubb Aurora 0.3: dark-first desktop. Purely visual; does not access rewards or learning progress. */
(()=>{'use strict';
 function init(){
   const stylesheet=document.getElementById('mk-modern-desktop-stylesheet');
   if(stylesheet)stylesheet.disabled=false;
   const oldButton=document.getElementById('mk-appearance-toggle');
   if(oldButton)oldButton.remove();
   document.documentElement.classList.add('mk-aurora-dark');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
