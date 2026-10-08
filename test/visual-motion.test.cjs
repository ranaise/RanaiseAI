const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=name=>fs.readFileSync(path.resolve(__dirname,"..",name),"utf8");
const html=read("index.html");
const motion=read("src/motion.css");
const script=read("src/site.js");
test("illustrated story has descriptive, accurate beta scope",()=>{
 assert.match(html,/id="intelligence-flow"/);
 assert.match(html,/class="flow-canvas"/);
 assert.match(html,/Concept illustration/);
 assert.match(html,/external systems and automatic actions are not connected/);
});
test("animation styles include accessibility and responsive limits",()=>{
 assert.match(motion,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(motion,/@media\(max-width:780px\)/);
 assert.match(motion,/@media\(max-width:680px\)/);
 assert.match(script,/IntersectionObserver/);
 assert.match(script,/prefers-reduced-motion: reduce/);
});
test("illustrations never replace the functional booking CTA",()=>{
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
 assert.ok(links.filter(x=>x==="/request-demo.html").length>=5);
 assert.ok(fs.existsSync(path.resolve(__dirname,"../request-demo.html")));
 assert.match(html,/Book a demo/);
});
test("custom graphics exist in all feature cards",()=>{
 for(const art of ["art-context","art-analysis","art-review"]){
  assert.ok(html.includes('class="feature-art '+art+'"'),art);
  assert.ok(motion.includes("."+art),art);
 }
});
test("no broken homepage fragment targets",()=>{
 for(const [,target] of html.matchAll(/href="#([^"]+)"/g))
   assert.ok(html.includes('id="'+target+'"'),target);
});
