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
  document.querySelectorAll(".mobile-nav .mobile-menu a").forEach(link=>{
    link.addEventListener("click",()=>{
      const details=link.closest(".mobile-nav");
      if(details)details.open=false;
    });
  });
  document.querySelectorAll(".mobile-nav").forEach(details=>{
    details.addEventListener("keydown",event=>{if(event.key==="Escape"){details.open=false;details.querySelector("summary")?.focus();}});
  });
  document.querySelectorAll("[data-year]").forEach(el=>{el.textContent=String(new Date().getFullYear());});
})();