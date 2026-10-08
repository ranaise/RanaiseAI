(() => {
  "use strict";
  const menuToggle=document.querySelector("[data-menu-toggle]");
  const mobileMenu=document.querySelector("[data-mobile-menu]");
  if(menuToggle&&mobileMenu){
    menuToggle.addEventListener("click",()=>{
      const open=mobileMenu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded",String(open));
      menuToggle.setAttribute("aria-label",open?"Close menu":"Open menu");
    });
    mobileMenu.addEventListener("click",event=>{
      if(event.target.closest("a")){mobileMenu.classList.remove("is-open");menuToggle.setAttribute("aria-expanded","false");}
    });
  }
  document.querySelectorAll("[data-year]").forEach(el=>{el.textContent=String(new Date().getFullYear());});
})();