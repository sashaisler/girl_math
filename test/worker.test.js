import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const identity={access:{getIdentity:async()=>({email:'owner@example.com'})}};
const env={OWNER_EMAIL:'owner@example.com'};
test('all requests fail closed without verified Access identity',async()=>{let r=await worker.fetch(new Request('https://app.example/api/data'),env,{});assert.equal(r.status,403)});
test('a different signed-in user is denied',async()=>{let r=await worker.fetch(new Request('https://app.example/'),env,{access:{getIdentity:async()=>({email:'other@example.com'})}});assert.equal(r.status,403)});
test('owner can load dashboard',async()=>{let r=await worker.fetch(new Request('https://app.example/'),env,identity);assert.equal(r.status,200);assert.match(await r.text(),/girl math/i)});
test('cross-origin writes are rejected',async()=>{let r=await worker.fetch(new Request('https://app.example/api/sync',{method:'POST',headers:{origin:'https://evil.example'}}),env,identity);assert.equal(r.status,403)});
