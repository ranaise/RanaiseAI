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
test("all working data demo remains accessible separately",()=>{
 assert.match(read("workspace.html"),/id="workspace"/);
 assert.match(read("workspace.html"),/src="\/src\/app.js"/);
});
