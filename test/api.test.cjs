const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/analyze.js');

const ENV_KEYS=['ANTHROPIC_API_KEY','BETA_ACCESS_CODE'];

async function withEnv(values,run){
  const previous=Object.fromEntries(ENV_KEYS.map(key=>[key,process.env[key]]));
  for(const key of ENV_KEYS){
    if(values[key]===undefined) delete process.env[key];
    else process.env[key]=values[key];
  }
  try{return await run();}
  finally{
    for(const key of ENV_KEYS){
      if(previous[key]===undefined) delete process.env[key];
      else process.env[key]=previous[key];
    }
  }
}

function response(){
  return {
    statusCode:200,
    headers:{},
    body:null,
    setHeader(name,value){this.headers[name]=value;},
    status(code){this.statusCode=code;return this;},
    json(value){this.body=value;return this;}
  };
}

test('Claude endpoint is unavailable without server credentials',async()=>{
  await withEnv({},async()=>{
    const res=response();
    await handler({method:'POST',headers:{},body:{}},res);
    assert.equal(res.statusCode,503);
    assert.match(res.body.error,/not configured/i);
    assert.equal(res.headers['Cache-Control'],'no-store');
  });
});

test('Claude endpoint rejects methods other than POST',async()=>{
  const res=response();
  await handler({method:'GET',headers:{},body:{}},res);
  assert.equal(res.statusCode,405);
  assert.equal(res.headers.Allow,'POST');
});

test('Claude endpoint requires the configured beta access code',async()=>{
  await withEnv({ANTHROPIC_API_KEY:'test-only-key',BETA_ACCESS_CODE:'test-beta-code-123'},async()=>{
    const res=response();
    await handler({method:'POST',headers:{'x-beta-code':'wrong-code'},body:{}},res);
    assert.equal(res.statusCode,403);
    assert.match(res.body.error,/invalid beta access code/i);
  });
});

test('Claude endpoint sanitizes metrics and returns a provider response',async t=>{
  const originalFetch=global.fetch;
  let providerRequest;
  t.after(()=>{global.fetch=originalFetch;});
  global.fetch=async(url,options)=>{
    providerRequest={url,options};
    return {ok:true,json:async()=>({content:[{type:'text',text:'Reported gross margin is 60%.'}]})};
  };
  await withEnv({ANTHROPIC_API_KEY:'test-only-key',BETA_ACCESS_CODE:'test-beta-code-123'},async()=>{
    const res=response();
    await handler({
      method:'POST',
      headers:{'x-beta-code':'test-beta-code-123'},
      body:{
        question:'What is the gross margin?',
        summary:{
          revenue:100,cost:40,orders:5,margin:60,rows:2,
          byChannel:[{name:'Online',revenue:90,cost:30,orders:4,ignored:'drop me'}],
          ignored:'drop me'
        }
      }
    },res);
    assert.equal(res.statusCode,200);
    assert.equal(res.body.answer,'Reported gross margin is 60%.');
  });
  assert.equal(providerRequest.url,'https://api.anthropic.com/v1/messages');
  const requestBody=JSON.parse(providerRequest.options.body);
  assert.equal(providerRequest.options.headers['x-api-key'],'test-only-key');
  assert.equal(requestBody.messages[0].content.includes('drop me'),false);
  assert.match(requestBody.messages[0].content,/What is the gross margin\?/);
});
