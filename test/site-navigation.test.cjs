const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pages=["index.html","request-demo.html","privacy.html","workspace.html"];
const assets=["/src/styles.css","/src/site.css","/src/site.js","/src/app.js","/src/analysis.js","/src/request-demo.js","/assets/favicon.svg"];
test("every internal HTML link has a valid target",()=>{
 for(const page of pages){
  const html=read(page);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
   if(href.startsWith("#")){
    assert.ok(html.includes('id="'+href.slice(1)+'"'),page+" broken anchor "+href);
   }else if(href.startsWith("/")&&!href.startsWith("//")){
    const part=href.split("#")[0].split("?")[0];
    if(part==="/")continue;
    assert.ok(fs.existsSync(path.join(root,part.slice(1))),page+" broken link "+href);
   }
  }
 }
});
test("all homepage demo booking calls to action link to two-step form",()=>{
 const home=read("index.html");
 const bookLinks=[...home.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*Book a demo\b/gi)];
 assert.ok(bookLinks.length>=3,"expected multiple booking CTAs");
 assert.ok(bookLinks.every(x=>x[1]==="/request-demo.html"));
 assert.match(read("request-demo.html"),/data-step="1"/);
 assert.match(read("request-demo.html"),/data-step="2"/);
});
test("brand uses image and full name, not standalone r-dot",()=>{
 for(const page of ["index.html","request-demo.html","privacy.html"]){
  const html=read(page);
  assert.match(html,/src="\/assets\/favicon.svg"/);
  assert.match(html,/>Ranaise<\/span>/);
  assert.doesNotMatch(html,/class="brand-symbol"/);
 }
});
test("mobile navigation, keyboard support, and flexible booking panel are present",()=>{
 const css=read("src/styles.css");
 const js=read("src/site.js");
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/\.booking-panel\{flex-direction:column/);
 assert.match(js,/\.mobile-nav/);
 assert.match(js,/Escape/);
});
test("legacy workspace URL now forwards to the homepage beta tab",()=>{
 const legacy=read("workspace.html");
 assert.match(legacy,/http-equiv="refresh"/);
 assert.match(legacy,/url=\/#interactive-beta/);
 assert.match(read("index.html"),/id="workspace"/);
 assert.match(read("index.html"),/id="interactive-beta"/);
});


test("Interactive Beta sidebar has only consistent text labels",()=>{
 const home=read("index.html");
 const app=read("src/app.js");
 assert.match(home,/<button[^>]+data-view="overview"[^>]*>Overview<\/button>/);
 assert.match(home,/<button[^>]+data-view="ask"[^>]*>Ask an agent<\/button>/);
 assert.match(home,/<button[^>]+data-view="approvals"[^>]*>Approvals<\/button>/);
 assert.doesNotMatch(home,/id="approval-count"|Guided analysis · local beta/);
 assert.doesNotMatch(app,/approval-count/);
 assert.match(home,/chat-orb"><img src="\/assets\/favicon.svg"/);
});
test("navbar follows actual vertical section order across public pages",()=>{
 const expected=[
   ["How it works","#intelligence-flow"],
   ["Product","#platform"],
   ["Interactive Beta","#interactive-beta"],
   ["AI agents","#agents"]
 ];
 const site=read("index.html");
 for(const page of ["index.html","request-demo.html","privacy.html"]){
  const html=read(page);
  const nav=html.match(/<nav class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1]
    || html.match(/<nav class="main-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav,"navbar missing from "+page);
  let last=-1;
  for(const [label,target] of expected){
   const link=target[0]==="#"&&page!=="index.html"?"/"+target:target;
   const marker='href="'+link+'">'+label+"</a>";
   const at=nav.indexOf(marker);
   assert.ok(at>last,page+": "+label+" out of order or missing");
   last=at;
  }
 }
 for(const anchor of expected.map(x=>x[1].slice(1)))
  assert.ok(site.includes('id="'+anchor+'"'));
});
