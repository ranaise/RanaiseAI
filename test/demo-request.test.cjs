const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const handler=require("../api/demo-request.js");
function invoke(method,body={},headers={}){
 const req={method,body,headers:{"content-type":"application/json",host:"ranaise-ai-beta.vercel.app",...headers},socket:{remoteAddress:"127.0.0.1"}};
 const res={statusCode:200,headers:{},payload:null,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(val){this.payload=val;return this;}};
 return Promise.resolve(handler(req,res)).then(()=>res);
}
const valid={name:"Ranaise Tester",email:"person@example.org",company:"Example Team",role:"Founder / Owner",industry:"Technology / SaaS",companySize:"1–10",timeline:"Just exploring",tools:["Spreadsheets"],consent:true,elapsedMs:5000};
test("demo endpoint enforces POST",async()=>assert.equal((await invoke("GET")).statusCode,405));
test("demo endpoint rejects invalid email",async()=>assert.equal((await invoke("POST",{...valid,email:"invalid"})).statusCode,400));
test("demo endpoint rejects spam honeypot",async()=>assert.equal((await invoke("POST",{...valid,website:"https://spam.test"})).statusCode,400));
test("demo endpoint rejects cross-site browser submissions",async()=>assert.equal((await invoke("POST",valid,{origin:"https://not-ranaise.example"})).statusCode,403));
test("demo endpoint fails closed when mail delivery is not configured",async()=>{
 const existing=process.env.RESEND_API_KEY;
 delete process.env.RESEND_API_KEY;
 try{
  const response=await invoke("POST",valid);
  assert.equal(response.statusCode,503);
  assert.match(response.payload.error,/not configured/);
 }finally{if(existing)process.env.RESEND_API_KEY=existing;}
});
test("two-step form and honest fallback exist",()=>{
 const html=fs.readFileSync(path.join(__dirname,"../request-demo.html"),"utf8");
 const js=fs.readFileSync(path.join(__dirname,"../src/request-demo.js"),"utf8");
 assert.match(html,/data-step="1"/);assert.match(html,/data-step="2"/);
 assert.match(html,/id="form-error"/);assert.match(html,/id="email-fallback"/);
 assert.match(js,/mailto:founder@ranaise.site/);
});
