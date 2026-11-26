import test from 'node:test';
import assert from 'node:assert/strict';
import {category,plan} from './src/planner.js';
import worker from './dist/server/index.js';

const profile={city:'Indore',household:'Family with children',commute:'Walk or cycle',filter:'No purifier',aqi:325,demo:true};
const ask=(body,env)=>worker.fetch(new Request('https://saans.test/api/ask',{method:'POST',body:JSON.stringify(body)}),env);

test('severe smog, sensitive household and scarce equipment alter the plan',()=>{
  assert.equal(category(325),'Hazardous');
  assert.match(plan(profile)[0].title,/indoors/);
  assert.match(plan(profile)[1].title,/smoke/);
  assert.match(plan(profile)[2].title,/Adjust/);
  assert.match(plan({...profile,aqi:45,filter:'HEPA purifier'})[2].title,/zero-tailpipe/);
  assert.match(plan({...profile,aqi:110,household:'Adults'})[0].title,/quieter/);
  assert.match(plan({...profile,aqi:110})[0].title,/indoors/);
});

test('invalid requests and the built-in guide',async()=>{
  assert.equal((await ask({question:'test'})).status,400);
  const result=await (await ask({...profile,question:'How can I manage school pickup?'})).json();
  assert.equal(result.mode,'guide');
  assert.match(result.answer,/school/);
  const page=await worker.fetch(new Request('https://saans.test/'));
  assert.equal(page.status,200);
  assert.match(await page.text(),/The winter air report/);
});

test('air provider and OpenAI response are parsed and AI failures fall back',async(t)=>{
  const mocked=t.mock.method(globalThis,'fetch',async (url,options)=>{
    if(url.startsWith('https://air-quality-api.open-meteo.com')) {
      const query=new URL(url).searchParams;
      assert.equal(query.get('hourly'),'us_aqi');
      if(query.get('timezone')==='auto') assert.equal(query.get('latitude'),'22.72');
      return Response.json({timezone:'Asia/Kolkata',current:{us_aqi:123,pm2_5:44,time:100000},hourly:{time:[99600,103600,107200,190000],us_aqi:[130,85,null,60]}});

    }
    assert.equal(options.headers.Authorization,'Bearer test-key');
    assert.match(JSON.parse(options.body).input,/Simulated scenario/);
    return Response.json({output:[{content:[{type:'output_text',text:'Example grounded response'}]}]});
  });
  const air=await worker.fetch(new Request('https://saans.test/api/air?city=Indore'));
  const estimated=await air.json();
  assert.equal(estimated.aqi,123);
  assert.deepEqual(estimated.hours,[{time:103600,aqi:85}]);
  const nearby=await worker.fetch(new Request('https://saans.test/api/air?city=Nearby&lat=22.72&lon=75.86'));
  assert.equal(nearby.status,200);
  const invalid=await worker.fetch(new Request('https://saans.test/api/air?city=Nearby&lat=200&lon=75.86'));
  assert.equal(invalid.status,400);
  const body={...profile,question:'What should I do about my commute?'};
  assert.equal((await (await ask(body,{OPENAI_API_KEY:'test-key'})).json()).mode,'ai');
  mocked.mock.mockImplementation(async()=>new Response('',{status:503}));
  assert.equal((await (await ask(body,{OPENAI_API_KEY:'test-key'})).json()).mode,'guide');
});

test('hero video supports browser range requests',async()=>{
  const request=new Request('https://saans.test/media/hero.mp4',{headers:{Range:'bytes=0-15'}});
  const response=await worker.fetch(request);
  assert.equal(response.status,206);
  assert.equal(response.headers.get('Content-Type'),'video/mp4');
  assert.equal((await response.arrayBuffer()).byteLength,16);
});
