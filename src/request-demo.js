(() => {
  "use strict";
  const form=document.getElementById("demo-form");
  if(!form)return;
  const first=form.querySelector('[data-step="1"]');
  const second=form.querySelector('[data-step="2"]');
  const error=document.getElementById("form-error");
  const fallback=document.getElementById("email-fallback");
  const draft=document.getElementById("email-draft");
  const submit=document.getElementById("submit-demo");
  const startedAt=Date.now();
  const controls=step=>[...step.querySelectorAll("input, select, textarea")].filter(el=>el.id!=="website");
  function clearMessage(){error.hidden=true;error.textContent="";fallback.hidden=true;}
  function showStep(number){
    first.hidden=number!==1;
    second.hidden=number!==2;
    clearMessage();
    window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    const heading=form.querySelector('[data-step="'+number+'"] .access-stephead');
    heading?.setAttribute("tabindex","-1");
    heading?.focus({preventScroll:true});
  }
  function validate(step){
    for(const control of controls(step)){
      if(!control.checkValidity()){control.reportValidity();control.focus();return false;}
    }
    return true;
  }
  function values(){
    const fd=new FormData(form);
    return {
      name:String(fd.get("name")||"").trim(),
      email:String(fd.get("email")||"").trim(),
      company:String(fd.get("company")||"").trim(),
      whatsapp:String(fd.get("whatsapp")||"").trim(),
      role:String(fd.get("role")||"").trim(),
      industry:String(fd.get("industry")||"").trim(),
      companySize:String(fd.get("companySize")||"").trim(),
      annualRevenue:String(fd.get("annualRevenue")||"").trim(),
      tools:fd.getAll("tools").map(String).slice(0,12),
      timeline:String(fd.get("timeline")||"").trim(),
      challenge:String(fd.get("challenge")||"").trim(),
      consent:fd.get("consent")==="on",
      website:String(fd.get("website")||""),
      elapsedMs:Date.now()-startedAt
    };
  }
  function emailLink(data){
    const details=[
      ["Name",data.name],["Work email",data.email],["Organization",data.company],
      ["WhatsApp",data.whatsapp||"Not provided"],["Role",data.role],
      ["Industry",data.industry],["Team size",data.companySize],
      ["Annual revenue",data.annualRevenue||"Not provided"],
      ["Current tools",data.tools.join(", ")||"Not provided"],
      ["Timeline",data.timeline],["Requested workflow",data.challenge||"Not provided"]
    ];
    const subject="Ranaise demo inquiry — "+data.company;
    const body="Hello Ranaise team,\n\nI would like to request a demo.\n\n"+
      details.map(([key,val])=>key+": "+val).join("\n")+
      "\n\nI agree to be contacted about this request.\n";
    return "mailto:founder@ranaise.site?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
  }
  document.getElementById("next-step").addEventListener("click",()=>{
    if(validate(first))showStep(2);
  });
  document.getElementById("previous-step").addEventListener("click",()=>showStep(1));
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    clearMessage();
    if(!validate(first)){showStep(1);validate(first);return;}
    if(!validate(second))return;
    const data=values();
    if(!data.consent){error.textContent="Please agree to be contacted before requesting a demo.";error.hidden=false;return;}
    draft.href=emailLink(data);
    submit.disabled=true;
    const original=submit.innerHTML;
    submit.textContent="Sending request...";
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),11000);
      let response;
      try{
        response=await fetch("/api/demo-request",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify(data),signal:controller.signal
        });
      }finally{clearTimeout(timeout);}
      let result={};
      try{result=await response.json();}catch{}
      if(!response.ok)throw new Error(result.error||"We could not submit your request automatically.");
      form.hidden=true;
      document.getElementById("form-success").hidden=false;
    }catch(e){
      const backendUnavailable=/not configured|email delivery/i.test(String(e?.message||""));
      error.textContent=backendUnavailable?
        "Email delivery has not been connected to the website. Your details are still in this form and have not been sent.":
        "Your request could not be confirmed as sent. You can retry or send it directly by email.";
      error.hidden=false;
      fallback.hidden=false;
      error.scrollIntoView({behavior:"smooth",block:"nearest"});
    }finally{
      submit.disabled=false;
      submit.innerHTML=original;
    }
  });
})();