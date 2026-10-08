// Static local preview server; API functions are active only on Vercel.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
const root=process.cwd(), port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
createServer(async(req,res)=>{
  if((req.url||'').startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Claude API is not enabled in local preview.'}));return;}
  let url;
  try {url=decodeURIComponent((req.url||'/').split('?')[0]);} catch{res.writeHead(400);res.end('Bad request');return;}
  const path=resolve(root,'.'+(url==='/'?'/index.html':url));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  try {if(!(await stat(path)).isFile()) throw Error();const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404);res.end('Not found');}
}).listen(port,()=>console.log('Ranaise beta preview at http://localhost:'+port));
