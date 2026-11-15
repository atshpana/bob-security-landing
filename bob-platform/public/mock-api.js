/* BOB Security: PUBLIC static preview adapter.
 * No API servers, accounts, devices, payments or databases are contacted.
 * All data below are synthetic and live in memory until page refresh.
 * Do not enter actual names/emails/private data into any demo form.
 */
(()=>{"use strict";
const originalFetch=window.fetch.bind(window);
const iso=()=>new Date().toISOString();
const id=()=>self.crypto?.randomUUID?.()||"demo-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const makeCaps=()=>({status:{state:"SUPPORTED",checkedAt:iso()},alert:{state:"SUPPORTED",checkedAt:iso()},recovery:{state:"SUPPORTED",checkedAt:iso()}});
const db={
 devices:[
  {id:"dev-own-01",name:"هاتف Android الشخصي",kind:"personal",ownerId:"demo-owner",model:"Android • نموذج تجريبي",os:"Android 15",connection:"online",mode:"NORMAL",lastSeen:iso(),capabilities:makeCaps(),lastLocation:null},
  {id:"dev-own-02",name:"الهاتف الاحتياطي",kind:"personal",ownerId:"demo-owner",model:"Android • نموذج تجريبي",os:"Android 14",connection:"offline",mode:"UNKNOWN",lastSeen:"2026-11-10T08:10:00Z",capabilities:{},lastLocation:null},
  {id:"dev-ent-01",name:"جهاز الشركة 01",kind:"managed",tenantId:"demo-tenant",model:"Android Enterprise • تجريبي",os:"Android 14",connection:"online",mode:"COMPLIANT",lastSeen:iso(),capabilities:makeCaps(),lastLocation:null}
 ],
 incidents:[{id:"inc-demo-01",subject:"تنبيه تجريبي",ownerId:"demo-owner",state:"OPEN",createdAt:iso(),evidenceCount:0}],
 commands:[],
 tickets:[{id:"tic-demo-01",subject:"سؤال بخصوص حالة الاشتراك",status:"OPEN",ownerRole:"owner",createdAt:iso()}],
 family:{plan:"Family (تجريبي)",seats:{total:5,used:2},members:[{name:"مالك الاشتراك",role:"manager",status:"ACTIVE"},{name:"عضو بالغ",role:"adult",status:"ACTIVE"}],invites:[]},
 enterprise:{name:"مؤسسة تجريبية",tenantId:"demo-tenant",enrollment:"NOT_CONFIGURED",amapi:"GATED",policies:[{id:"p-01",name:"إعدادات أساسية",state:"DRAFT"}]},
 adminUsers:[{id:"u-01",name:"حساب تجريبي",role:"owner",status:"DEMO"},{id:"u-02",name:"حساب مؤسسة تجريبية",role:"enterprise",status:"DEMO"}],
 audit:[],content:[{id:"c-01",title:"مرحبًا في BOB Security",state:"DRAFT"}],
 partner:{attribution:"DEMO_ONLY",codes:[],commissions:[],payouts:[]}
};
const allowedRoles=new Set(["owner","family","enterprise","admin","partner","support"]);
const cmdPolicy={STATUS_REFRESH:{capability:"status",entitlement:"public"},ALERT_TEST:{capability:"alert",entitlement:"public"},RECOVERY_START:{capability:"recovery",entitlement:"personal"}};
function owns(r,d){return d&&((r==="owner"&&d.ownerId==="demo-owner"&&d.kind==="personal")||(r==="enterprise"&&d.tenantId==="demo-tenant"&&d.kind==="managed"))}
function check(r,d,command){
 if(!allowedRoles.has(r))return {allowed:false,code:"ROLE_INVALID"};
 const c=cmdPolicy[command];if(!c)return {allowed:false,code:"COMMAND_NOT_ALLOWLISTED"};
 if(!owns(r,d))return {allowed:false,code:"TARGET_NOT_AUTHORIZED"};
 if(c.entitlement==="personal"&&r!=="owner")return {allowed:false,code:"ENTITLEMENT_MISSING"};
 const cap=d.capabilities?.[c.capability];if(!cap||cap.state!=="SUPPORTED")return {allowed:false,code:"CAPABILITY_UNAVAILABLE"};
 const ts=Date.parse(cap.checkedAt||"");if(!Number.isFinite(ts)||Math.abs(Date.now()-ts)>60_000)return {allowed:false,code:"CAPABILITY_STALE"};
 if(d.connection!=="online")return {allowed:false,code:"DEVICE_NOT_CONNECTED"};
 return {allowed:true,code:"PREFLIGHT_PASS_DEMO_ONLY",note:"فحص واجهة تجريبية فقط، لا يوجد تنفيذ على جهاز حقيقي."};
}
function response(obj,status=200){
 return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","X-BOB-Preview":"STATIC_DEMO_ONLY"}});
}
const error=(code,status=400)=>response({ok:false,code},status);
const ownIncidents=r=>db.incidents.filter(x=>r==="owner"?x.ownerId==="demo-owner":r==="enterprise"&&x.tenantId==="demo-tenant");
function bootstrap(r){
 const base={demo:true,live:false,devices:[],incidents:[],commands:[],tickets:[],family:null,enterprise:null,admin:null,partner:null,account:{displayName:"مستخدم تجريبي",plan:"Guard Personal",billing:"غير متصل",paymentProvider:"غير متصل"}};
 if(r==="owner"){base.devices=db.devices.filter(d=>owns(r,d));base.incidents=ownIncidents(r);base.commands=db.commands.filter(c=>c.role===r);base.tickets=db.tickets.filter(t=>t.ownerRole===r)}
 if(r==="family"){base.family=db.family;base.tickets=db.tickets.filter(t=>t.ownerRole==="family")}
 if(r==="enterprise"){base.devices=db.devices.filter(d=>owns(r,d));base.enterprise=db.enterprise;base.incidents=ownIncidents(r);base.commands=db.commands.filter(c=>c.role===r)}
 if(r==="admin"){base.admin={users:db.adminUsers,health:"DEMO / DB_NOT_CONNECTED",audit:db.audit,content:db.content}}
 if(r==="partner")base.partner=db.partner;
 if(r==="support")base.tickets=db.tickets.map(({id,subject,status,createdAt})=>({id,subject,status,createdAt}));
 return {role:r,...base};
}
function audit(action,r,target){
 db.audit.unshift({id:id(),action,role:r,target:String(target||"").slice(0,80),at:iso(),demo:true});
 db.audit=db.audit.slice(0,100);
}
let screensCache;
async function handle(url,opts={}){
 const r=opts.headers?.["x-demo-role"]||"owner";
 if(!allowedRoles.has(r))return error("ROLE_INVALID",403);
 const method=(opts.method||"GET").toUpperCase();
 if(method==="GET"&&url==="/api/status")return response({ok:true,mode:"STATIC_DEMO_ONLY",database:"NOT_CONNECTED",deviceExecution:"DISABLED",externalPayments:"DISABLED",screens:104});
 if(method==="GET"&&url==="/api/screens"){
  if(!screensCache){
   const source=new URL("../data/screens.json",location.href).href;
   const res=await originalFetch(source,{cache:"no-store"});
   if(!res.ok)throw new Error("SCREEN_REGISTRY_UNAVAILABLE");
   screensCache=await res.json();
  }
  return response({screens:screensCache});
 }
 if(method==="GET"&&url==="/api/bootstrap")return response(bootstrap(r));
 if(method!=="POST")return error("METHOD_NOT_ALLOWED",405);
 let b;try{b=JSON.parse(opts.body||"{}")}catch{return error("INVALID_JSON",400)}
 if(url==="/api/devices/preflight-refresh"){
  const d=db.devices.find(x=>x.id===b.deviceId);if(!owns(r,d))return error("TARGET_NOT_AUTHORIZED",403);
  d.capabilities=makeCaps();audit("DEMO_CAPABILITY_REFRESH",r,d.id);
  return response({ok:true,capabilities:d.capabilities,notice:"تم تحديث محاكاة القدرات فقط."});
 }
 if(url==="/api/commands/preflight"||url==="/api/commands"){
  const d=db.devices.find(x=>x.id===b.deviceId),p=check(r,d,b.action);
  if(url.endsWith("preflight"))return response(p,p.allowed?200:403);
  if(!p.allowed)return error(p.code,403);
  const c={id:id(),deviceId:d.id,action:b.action,state:"RESULT_UNCONFIRMED",role:r,createdAt:iso(),simulated:true,evidence:null};
  db.commands.unshift(c);audit("DEMO_COMMAND_REQUEST",r,d.id);
  return response({ok:true,command:c,notice:"تم تسجيل أمر وهمي فقط، ولم يُرسل إلى جهاز."},201);
 }
 if(url==="/api/incidents"){
  if(!["owner","enterprise"].includes(r))return error("FORBIDDEN",403);
  const subject=String(b.subject||"").trim();if(subject.length<4||subject.length>120)return error("INVALID_SUBJECT");
  const c={id:id(),subject,state:"OPEN",ownerId:r==="owner"?"demo-owner":null,tenantId:r==="enterprise"?"demo-tenant":null,createdAt:iso(),evidenceCount:0};
  db.incidents.unshift(c);audit("DEMO_INCIDENT_OPEN",r,c.id);return response({ok:true,incident:c},201);
 }
 if(url==="/api/tickets"){
  if(!["owner","family"].includes(r))return error("FORBIDDEN",403);
  const subject=String(b.subject||"").trim();if(subject.length<5||subject.length>160)return error("INVALID_SUBJECT");
  const c={id:id(),subject,status:"OPEN",ownerRole:r,createdAt:iso()};
  db.tickets.unshift(c);audit("DEMO_TICKET_OPEN",r,c.id);return response({ok:true,ticket:c},201);
 }
 if(url==="/api/family/invites"){
  if(r!=="family")return error("FORBIDDEN",403);
  const email=String(b.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180)return error("INVALID_EMAIL");
  if(db.family.seats.used+db.family.invites.length>=db.family.seats.total)return error("NO_AVAILABLE_SEATS");
  db.family.invites.unshift({id:id(),email,status:"DRAFT_NOT_SENT",createdAt:iso()});
  audit("DEMO_FAMILY_INVITE_DRAFT",r,"redacted");
  return response({ok:true,notice:"تم حفظ دعوة وهمية، ولم يُرسل بريد."},201);
 }
 if(url==="/api/enterprise/policies"){
  if(r!=="enterprise")return error("FORBIDDEN",403);
  const name=String(b.name||"").trim();if(name.length<3||name.length>100)return error("INVALID_NAME");
  const c={id:id(),name,state:"DRAFT"};db.enterprise.policies.unshift(c);
  audit("DEMO_POLICY_DRAFT",r,c.id);return response({ok:true,policy:c},201);
 }
 if(url==="/api/admin/content"){
  if(r!=="admin")return error("FORBIDDEN",403);
  const title=String(b.title||"").trim();if(title.length<3||title.length>120)return error("INVALID_TITLE");
  const c={id:id(),title,state:"DRAFT"};db.content.unshift(c);
  audit("DEMO_CONTENT_DRAFT",r,c.id);return response({ok:true,content:c},201);
 }
 if(url==="/api/reports/preview"){
  if(!["owner","enterprise"].includes(r))return error("FORBIDDEN",403);
  const incident=ownIncidents(r).find(x=>x.id===b.incidentId);if(!incident)return error("INCIDENT_NOT_AUTHORIZED",403);
  audit("DEMO_REPORT_PREVIEW",r,incident.id);
  return response({ok:true,report:{id:"PREVIEW-"+incident.id,incidentId:incident.id,createdAt:iso(),events:[],evidence:[],verificationId:null,signature:"NOT_SIGNED",official:false,issued:false,warning:"هذا التقرير غير رسمي ولا يثبت حادثًا أو تنفيذًا."}});
 }
 return error("NOT_FOUND",404);
}
window.fetch=(input,init={})=>{
 const path=typeof input==="string"?input:input?.url;
 return typeof path==="string"&&path.startsWith("/api/")?handle(path,init):originalFetch(input,init);
};
window.__BOB_PREVIEW__=Object.freeze({mode:"STATIC",databaseConnected:false,realDevices:false});
})();
