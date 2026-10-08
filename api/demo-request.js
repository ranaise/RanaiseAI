// Early-access request intake for Vercel.
// Automatic email sending is disabled until RESEND_API_KEY and DEMO_SENDER_EMAIL
// are configured. Add production-grade CAPTCHA / durable rate limits before promotion.
const recent=new Map();
function text(value,max){return typeof value==="string"?value.trim().slice(0,max):"";}
function validEmail(str){return str.length<181&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);}
function json(res,status,data){res.setHeader("Cache-Control","no-store");return res.status(status).json(data);}
module.exports=async function handler(req,res){
  res.setHeader("Allow","POST");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed."});
  const origin=req.headers.origin;
  if(origin){
    try{if(new URL(origin).host!==req.headers.host)return json(res,403,{error:"Origin not allowed."});}
    catch{return json(res,403,{error:"Invalid origin."});}
  }
  if(!String(req.headers["content-type"]||"").startsWith("application/json"))
    return json(res,415,{error:"Expected JSON."});
  if(Number(req.headers["content-length"]||0)>10000)
    return json(res,413,{error:"Request too large."});
  let body=req.body;
  if(typeof body==="string"){
    if(body.length>10000)return json(res,413,{error:"Request too large."});
    try{body=JSON.parse(body);}catch{return json(res,400,{error:"Invalid JSON."});}
  }
  if(!body||typeof body!=="object"||Array.isArray(body))
    return json(res,400,{error:"Invalid request."});
  if(JSON.stringify(body).length>10000)return json(res,413,{error:"Request too large."});
  if(text(body.website,100))return json(res,400,{error:"Unable to accept request."});
  if(!body.consent||typeof body.elapsedMs!=="number"||body.elapsedMs<1700)
    return json(res,400,{error:"Please complete the form and consent before sending."});
  const payload={
    name:text(body.name,100),email:text(body.email,180),company:text(body.company,120),
    whatsapp:text(body.whatsapp,30),role:text(body.role,60),industry:text(body.industry,65),
    companySize:text(body.companySize,30),annualRevenue:text(body.annualRevenue,40),
    tools:Array.isArray(body.tools)?body.tools.slice(0,12).map(x=>text(x,40)):[],
    timeline:text(body.timeline,55),challenge:text(body.challenge,1200)
  };
  if(!payload.name||!validEmail(payload.email)||!payload.company||!payload.role||!payload.industry||!payload.companySize||!payload.timeline)
    return json(res,400,{error:"Please complete all required fields."});
  const apiKey=process.env.RESEND_API_KEY;
  const sender=process.env.DEMO_SENDER_EMAIL;
  const recipient=process.env.DEMO_NOTIFICATION_EMAIL||"founder@ranaise.site";
  if(!apiKey||!validEmail(String(sender||""))||!validEmail(recipient))
    return json(res,503,{error:"Automatic email delivery is not configured."});
  // In-memory throttling is instance-local; use an edge rate limiter and bot challenge
  // before enabling this service at production scale.
  const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim();
  const now=Date.now();
  const history=(recent.get(ip)||[]).filter(time=>now-time<3600000);
  if(history.length>=3)return json(res,429,{error:"Too many requests. Please try again later."});
  history.push(now);recent.set(ip,history);
  const lines=[
    "New Ranaise demo request","",
    ["Name",payload.name],["Work email",payload.email],["Organization",payload.company],
    ["WhatsApp",payload.whatsapp||"Not provided"],["Role",payload.role],
    ["Industry",payload.industry],["Team size",payload.companySize],
    ["Annual revenue",payload.annualRevenue||"Not provided"],
    ["Tools",payload.tools.join(", ")||"Not provided"],["Timeline",payload.timeline],
    ["Problem to solve",payload.challenge||"Not provided"]
  ].map(row=>Array.isArray(row)?row.join(": "):row).join("\n");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",signal:controller.signal,
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        from:sender,to:[recipient],reply_to:payload.email,
        subject:"New Ranaise demo inquiry: "+payload.company.slice(0,80),
        text:lines
      })
    });
    if(!response.ok){
      console.error("Demo delivery failed, status:",response.status);
      return json(res,502,{error:"Email delivery unavailable. Please use the email option."});
    }
    return json(res,200,{ok:true,message:"Request accepted for email delivery."});
  }catch(e){
    console.error("Demo delivery request failed:",e?.name||"Unknown");
    return json(res,503,{error:"Email delivery unavailable. Please use the email option."});
  }finally{clearTimeout(timer);}
};