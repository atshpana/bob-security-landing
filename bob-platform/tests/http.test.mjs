import test,{after} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {handler} from "../src/server.mjs";
const server=createServer((req,res)=>handler(req,res));
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
after(()=>new Promise(resolve=>server.close(resolve)));
const base="http://127.0.0.1:"+server.address().port;
async function call(path,role="owner",body){
 const r=await fetch(base+path,{method:body?"POST":"GET",headers:{"x-demo-role":role,"content-type":"application/json"},body:body?JSON.stringify(body):undefined});
 const text=await r.text();return {status:r.status,type:r.headers.get("content-type"),data:(r.headers.get("content-type")||"").includes("application/json")?JSON.parse(text):text};
}
test("serves real static HTML and CSS",async()=>{
 const h=await call("/");assert.equal(h.status,200);assert.match(h.data,/BOB Security/);assert.match(h.type,/text\/html/);
 const c=await call("/styles.css");assert.equal(c.status,200);assert.match(c.data,/--turq/);assert.match(c.type,/text\/css/);
 const j=await call("/app.js");assert.equal(j.status,200);assert.match(j.data,/function render/);
});
test("screen inventory matches 104 canonical parents",async()=>{
 const r=await call("/api/screens");assert.equal(r.data.screens.length,104);
 assert.equal(new Set(r.data.screens.map(x=>x.id)).size,104);
 assert.ok(r.data.screens.find(x=>x.id==="M-22"));
 assert.ok(r.data.screens.find(x=>x.id==="M-23"));
});
test("family sees membership without adult device telemetry",async()=>{
 const x=await call("/api/bootstrap","family");assert.equal(x.status,200);
 assert.deepEqual(x.data.devices,[]);assert.ok(x.data.family);
 const command=await call("/api/commands","family",{deviceId:"dev-own-01",action:"STATUS_REFRESH"});
 assert.equal(command.status,403);
});
test("admin does not inherit remote command privileges",async()=>{
 const x=await call("/api/bootstrap","admin");assert.deepEqual(x.data.devices,[]);
 const y=await call("/api/commands","admin",{deviceId:"dev-own-01",action:"STATUS_REFRESH"});assert.equal(y.status,403);
});
test("unknown/unsafe commands are blocked",async()=>{
 const y=await call("/api/commands","owner",{deviceId:"dev-own-01",action:"WIPE"});assert.equal(y.status,403);
 assert.equal(y.data.code,"COMMAND_NOT_ALLOWLISTED");
});
test("demo command stays unconfirmed and never claims execution",async()=>{
 await call("/api/devices/preflight-refresh","owner",{deviceId:"dev-own-01"});
 const y=await call("/api/commands","owner",{deviceId:"dev-own-01",action:"STATUS_REFRESH"});
 assert.equal(y.status,201);assert.equal(y.data.command.state,"RESULT_UNCONFIRMED");
 assert.equal(y.data.command.simulated,true);assert.equal(y.data.command.evidence,null);
});
test("incident preview is unsigned, not issued",async()=>{
 const i=await call("/api/incidents","owner",{subject:"اختبار فقدان جهاز"});assert.equal(i.status,201);
 const p=await call("/api/reports/preview","owner",{incidentId:i.data.incident.id});
 assert.equal(p.data.report.issued,false);assert.equal(p.data.report.signature,"NOT_SIGNED");
});
test("staff cannot create production content without admin demo role",async()=>{
 const y=await call("/api/admin/content","support",{title:"أخبار تجريبية"});assert.equal(y.status,403);
});
