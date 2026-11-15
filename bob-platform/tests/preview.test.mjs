import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
const base=new URL("../public/",import.meta.url);
async function setup(){
 const content=await readFile(new URL("mock-api.js",base),"utf8");
 const pages=JSON.parse(await readFile(new URL("../data/screens.json",import.meta.url),"utf8"));
 const fetched=[];
 const win={
  fetch:async url=>{
   fetched.push(url);
   if(String(url).endsWith("/bob-platform/data/screens.json"))return new Response(JSON.stringify(pages),{status:200,headers:{"content-type":"application/json"}});
   throw new Error("Unexpected external network request: "+url);
  }
 };
 const ctx={window:win,self:{crypto:{randomUUID:()=>"demo-"+Math.random().toString(36).slice(2)}},location:{href:"https://raw.githack.com/a/repo/commit/bob-platform/public/preview.html"},Response,URL,Date,Math,JSON,Set,String};
 vm.runInNewContext(content,ctx,{filename:"mock-api.js"});
 const request=async(path,role="owner",body)=>{
  const r=await win.fetch(path,{method:body?"POST":"GET",headers:{"x-demo-role":role,"content-type":"application/json"},body:body?JSON.stringify(body):undefined});
  return {status:r.status,data:await r.json()};
 };
 return {request,fetched};
}
test("preview HTML includes mock API before front-end",async()=>{
 const html=await readFile(new URL("preview.html",base),"utf8");
 assert.ok(html.indexOf('src="./mock-api.js"')<html.indexOf('src="./app.js"'));
 assert.match(html,/معاينة تفاعلية/);
});
test("preview bootstraps without a live API or database",async()=>{
 const {request,fetched}=await setup();
 const s=await request("/api/status");
 assert.equal(s.status,200);assert.equal(s.data.database,"NOT_CONNECTED");
 const o=await request("/api/bootstrap");
 assert.equal(o.data.devices.length,2);
 assert.equal(fetched.length,0);
});
test("all 104 frozen-reference screens are available via static source",async()=>{
 const {request,fetched}=await setup();
 const s=await request("/api/screens");
 assert.equal(s.data.screens.length,104);
 assert.equal(fetched.length,1);
 assert.ok(String(fetched[0]).endsWith("data/screens.json"));
});
test("family mode exposes no device telemetry",async()=>{
 const {request}=await setup();
 const family=await request("/api/bootstrap","family");
 assert.equal(family.data.devices.length,0);
 assert.equal(family.data.commands.length,0);
 assert.ok(family.data.family);
 const cmd=await request("/api/commands","family",{deviceId:"dev-own-01",action:"STATUS_REFRESH"});
 assert.equal(cmd.status,403);
});
test("static demo rejects dangerous command and records allowed simulation as unconfirmed",async()=>{
 const {request}=await setup();
 const wipe=await request("/api/commands","owner",{deviceId:"dev-own-01",action:"WIPE"});
 assert.equal(wipe.status,403);assert.equal(wipe.data.code,"COMMAND_NOT_ALLOWLISTED");
 const allowed=await request("/api/commands","owner",{deviceId:"dev-own-01",action:"STATUS_REFRESH"});
 assert.equal(allowed.status,201);
 assert.equal(allowed.data.command.state,"RESULT_UNCONFIRMED");
 assert.equal(allowed.data.command.simulated,true);
});
test("preview controls allow creating a synthetic case and unsigned report",async()=>{
 const {request}=await setup();
 const inc=await request("/api/incidents","owner",{subject:"جهاز تجريبي مفقود"});
 assert.equal(inc.status,201);
 const report=await request("/api/reports/preview","owner",{incidentId:inc.data.incident.id});
 assert.equal(report.status,200);
 assert.equal(report.data.report.issued,false);
 assert.equal(report.data.report.official,false);
 assert.equal(report.data.report.signature,"NOT_SIGNED");
});
test("mock permission boundaries are per role",async()=>{
 const {request}=await setup();
 const a=await request("/api/admin/content","support",{title:"محتوى لا يسمح به"});
 assert.equal(a.status,403);
 const e=await request("/api/enterprise/policies","owner",{name:"سياسة لا تسمح"});
 assert.equal(e.status,403);
 const admin=await request("/api/admin/content","admin",{title:"مسودة تجريبية"});
 assert.equal(admin.status,201);
});
