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
  // Progressive enhancement: the page remains readable with JS disabled.
  const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets=[
    ".hero-copy", ".flow-header", ".flow-canvas", ".section-head",
    ".feature", ".how-heading", ".workflow-steps li", ".agents-copy",
    ".agent-mini-grid > div", ".booking-panel", ".closing-wrap"
  ].join(",");
  if(!reducedMotion&&"IntersectionObserver" in window){
    const targets=[...document.querySelectorAll(revealTargets)];
    targets.forEach((node,i)=>{
      node.classList.add("reveal-target");
      node.style.setProperty("--reveal-delay",(i%4)*65+"ms");
    });
    const observer=new IntersectionObserver((entries)=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },{threshold:0.09,rootMargin:"0px 0px 30px 0px"});
    // Mark elements already onscreen as visible before animation begins.
    targets.forEach(node=>{
      const bounds=node.getBoundingClientRect();
      if(bounds.top<window.innerHeight&&bounds.bottom>0)node.classList.add("is-visible");
      else observer.observe(node);
    });
    document.body.classList.add("motion-enabled");
  }
  // Product overview and interactive workspace share a single page.
  const overviewTab=document.getElementById("overview-tab");
  const betaTab=document.getElementById("interactive-beta");
  const overviewPanel=document.getElementById("experience-overview");
  const betaPanel=document.getElementById("experience-beta");
  if(overviewTab&&betaTab&&overviewPanel&&betaPanel){
    const tabs=[overviewTab,betaTab];
    function activateBeta(selected){
      overviewPanel.hidden=selected;
      betaPanel.hidden=!selected;
      overviewTab.classList.toggle("is-active",!selected);
      betaTab.classList.toggle("is-active",selected);
      overviewTab.setAttribute("aria-selected",String(!selected));
      betaTab.setAttribute("aria-selected",String(selected));
      overviewTab.tabIndex=selected?-1:0;
      betaTab.tabIndex=selected?0:-1;
    }
    function syncFromHash(){
      if(window.location.hash==="#interactive-beta")activateBeta(true);
      else if(window.location.hash==="#platform")activateBeta(false);
    }
    overviewTab.addEventListener("click",()=>{
      activateBeta(false);
      history.replaceState(null,"","#platform");
    });
    betaTab.addEventListener("click",()=>{
      activateBeta(true);
      history.replaceState(null,"","#interactive-beta");
    });
    tabs.forEach((tab,index)=>tab.addEventListener("keydown",event=>{
      let next=null;
      if(event.key==="ArrowRight")next=tabs[(index+1)%tabs.length];
      if(event.key==="ArrowLeft")next=tabs[(index+tabs.length-1)%tabs.length];
      if(event.key==="Home")next=tabs[0];
      if(event.key==="End")next=tabs[tabs.length-1];
      if(!next)return;
      event.preventDefault();
      next.focus();
      next.click();
    }));
    window.addEventListener("hashchange",syncFromHash);
    syncFromHash();
  }
  document.querySelectorAll("[data-year]").forEach(el=>{el.textContent=String(new Date().getFullYear());});
})();