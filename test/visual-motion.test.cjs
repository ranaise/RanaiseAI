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
 assert.match(html,/id="interactive-beta"/);
 assert.match(html,/id="experience-beta"/);
 assert.match(html,/CSV stays in your browser/);
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


test("the real guided beta is accessible inside homepage tabs",()=>{
 assert.match(html,/id="workspace"/);
 assert.match(html,/id="csv-upload"/);
 assert.match(html,/id="view-ask"/);
 assert.match(html,/id="view-approvals"/);
 assert.match(html,/src="\/src\/analysis.js"/);
 assert.match(html,/src="\/src\/app.js"/);
 assert.match(read("src/site.js"),/aria-selected/);
 assert.match(read("src/experience.css"),/experience-panel\[hidden\]/);
});
test("How it works targets an illustrative explanation",()=>{
 assert.match(html,/href="#intelligence-flow"/);
 assert.doesNotMatch(html,/href="#how-it-works"/);
});
test("removed technical marketing disclaimers stay removed",()=>{
 const forbidden=[
  "EARLY ACCESS · RANAISE AI",
  "Early-stage product. Guided analysis is available",
  "Concept illustration. The public beta",
  "Built with a human in the loop",
  "Independent early-stage software project",
  "Technical preview"
 ];
 for(const phrase of forbidden)assert.ok(!html.includes(phrase),phrase);
});
