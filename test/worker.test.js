import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const identity={access:{getIdentity:async()=>({email:'owner@example.com'})}};
const env={OWNER_EMAIL:'owner@example.com'};
test('all requests fail closed without verified Access identity',async()=>{let r=await worker.fetch(new Request('https://app.example/api/data'),env,{});assert.equal(r.status,403)});
test('a different signed-in user is denied',async()=>{let r=await worker.fetch(new Request('https://app.example/'),env,{access:{getIdentity:async()=>({email:'other@example.com'})}});assert.equal(r.status,403)});
test('owner can load dashboard',async()=>{let r=await worker.fetch(new Request('https://app.example/'),env,identity);assert.equal(r.status,200);assert.match(await r.text(),/girl math/i)});
test('cross-origin writes are rejected',async()=>{let r=await worker.fetch(new Request('https://app.example/api/sync',{method:'POST',headers:{origin:'https://evil.example'}}),env,identity);assert.equal(r.status,403)});

test('transaction history begins June 1 and Six 60 One defaults to groceries while respecting corrections',async()=>{
  const make=(id,date,name,primary)=>({transaction_id:id,date,name,amount:25,account_id:'card',personal_finance_category:{primary}});
  const records=[make('old','2026-05-31','Six 60 One','TRANSFER_OUT'),make('grocery','2026-06-01','SIX 60 ONE','TRANSFER_OUT'),make('future','2026-07-01','Six 60 One','GENERAL_MERCHANDISE'),make('override','2026-08-01','Six 60 One','TRANSFER_OUT'),make('other','2026-08-01','Other merchant','TRANSFER_OUT')];
  const mock={...env,DB:{prepare(query){return {async all(){if(query==='SELECT accounts FROM items')return {results:[{accounts:JSON.stringify([{account_id:'card',name:'Card',mask:'1234'}])}]};if(query==='SELECT raw FROM transactions')return {results:records.map(t=>({raw:JSON.stringify(t)}))};if(query==='SELECT * FROM overrides')return {results:[{id:'override',category:'Shopping',excluded:0}]};throw Error('Unexpected query')},async first(){return null}}}}};
  const response=await worker.fetch(new Request('https://app.example/api/data'),mock,identity);assert.equal(response.status,200);const d=await response.json();assert.deepEqual(d.transactions.map(t=>t.id),['grocery','future','override','other']);assert.equal(d.transactions[0].account_id,'card');assert.equal(d.accounts[0].mask,'1234');assert.deepEqual(d.transactions.map(t=>[t.category,t.excluded]),[['Groceries',false],['Groceries',false],['Shopping',false],['Transfer',true]]);
});
