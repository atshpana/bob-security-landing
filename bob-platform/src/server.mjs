import http from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {randomUUID} from "node:crypto";
import {ROLES,COMMANDS,preflight,redactRole} from "./domain.mjs";
const root=resolve(fileURLToPath(new URL("../public/",import.meta.url)));
const screens=JSON.parse(await readFile(new URL("../data/screens.json",import.meta.url),"utf8"));
const stamp=()=>new Date().toISOString();
const capabilities=()=>({status:{state:"SUPPORTED",checkedAt:stamp()},alert:{state:"SUPPORTED",checkedAt:stamp()},recovery:{state:"SUPPORTED",checkedAt:stamp()}});
const state={
  devices:[
    {id:"dev-own-01",name:"هاتف Android الشخصي",kind:"personal",ownerId:"demo-owner",model:"Android • نموذج تجريبي",os:"Android 15",connection:"online",mode:"NORMAL",lastSeen:stamp(),capabilities:capabilities(),lastLocation:null},
    {id:"dev-own-02",name:"الهاتف الاحتياطي",kind:"personal",ownerId:"demo-owner",model:"Android • نموذج تجريبي",os:"Android 14",connection:"offline",mode:"UNKNOWN",lastSeen:"2026-11-10T08:10:00Z",capabilities:{},lastLocation:null},
    {id:"dev-ent-01",name:"جهاز الشركة 01",kind:"managed",tenantId:"demo-tenant",model:"Android Enterprise • تجريبي",os:"Android 14",connection:"online",mode:"COMPLIANT",lastSeen:stamp(),capabilities:capabilities(),lastLocation:null}
  ],
  incidents:[{id:"inc-demo-01",subject:"تنبيه تجريبي",ownerId:"demo-owner",state:"OPEN",createdAt:"2026-11-14T12:00:00Z",evidenceCount:0}],
  commands:[],tickets:[{id:"tic-demo-01",subject:"سؤال بخصوص حالة الاشتراك",status:"OPEN",ownerRole:"owner",createdAt:"2026-11-14T10:20:00Z"}],
  family:{plan:"Family (تجريبي)",seats:{total:5,used:2},members:[{name:"مالك الاشتراك",role:"manager",status:"ACTIVE"},{name:"عضو بالغ",role:"adult",status:"ACTIVE"}],invites:[]},
  enterprise:{name:"مؤسسة تجريبية",tenantId:"demo-tenant",enrollment:"NOT_CONFIGURED",amapi:"GATED",policies:[{id:"p-01",name:"إعدادات أساسية",state:"DRAFT"}]},
  adminUsers:[{id:"u-01",name:"حساب تجريبي",role:"owner",status:"DEMO"},{id:"u-02",name:"حساب مؤسسة تجريبية",role:"enterprise",status:"DEMO"}],
  audit:[],content:[{id:"c-01",title:"مرحبًا في BOB Security",state:"DRAFT"}],
  partner:{attribution:"DEMO_ONLY",codes:[],commissions:[],payouts:[]}
};
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
function write(res,status,data,type="application/json; charset=utf-8"){res.writeHead(status,{"Content-Type":type,"X-Content-Type-Options":"nosniff","Cache-Control":"no-store","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(typeof data==="string"?data:JSON.stringify(data));}
async function body(req){let text="";for await (const buf of req){text+=buf;if(text.length>16384)throw new Error("REQUEST_TOO_LARGE");}try{return JSON.parse(text||"{}");}catch{throw new Error("INVALID_JSON");}}
function role(req){const r=req.headers["x-demo-role"]||"owner";return ROLES.includes(r)?r:null;}
function fail(res,code,status=400){write(res,status,{ok:false,code});}
function audit(action,role,target){state.audit.unshift({id:randomUUID(),action,role,target:String(target??"").slice(0,80),at:stamp(),demo:true});state.audit=state.audit.slice(0,100);}
async function handler(req,res){
 let pathname;try{pathname=new URL(req.url,"http://localhost").pathname;}catch{return fail(res,"BAD_URL");}
 const r=role(req);
 if(pathname.startsWith("/api/")){
  if(!r)return fail(res,"ROLE_INVALID",403);
  if(req.method==="GET"&&pathname==="/api/status")return write(res,200,{ok:true,mode:"DEMO",database:"NOT_CONNECTED",deviceExecution:"DISABLED",externalPayments:"DISABLED",screens:screens.length});
  if(req.method==="GET"&&pathname==="/api/screens")return write(res,200,{screens});
  if(req.method==="GET"&&pathname==="/api/bootstrap")return write(res,200,{role:r,...redactRole(r,state)});
  if(req.method!=="POST")return fail(res,"METHOD_NOT_ALLOWED",405);
  let b;try{b=await body(req);}catch(e){return fail(res,e.message,400);}
  if(pathname==="/api/commands/preflight"){
   const d=state.devices.find(x=>x.id===b.deviceId);const p=preflight({role:r,device:d,action:b.action,subscription:r==="owner"?"personal":"managed"});return write(res,p.allowed?200:403,p);
  }
  if(pathname==="/api/commands"){
   const d=state.devices.find(x=>x.id===b.deviceId),p=preflight({role:r,device:d,action:b.action,subscription:r==="owner"?"personal":"managed"});
   if(!p.allowed)return fail(res,p.code,403);
   const cmd={id:randomUUID(),deviceId:d.id,action:b.action,state:"RESULT_UNCONFIRMED",role:r,createdAt:stamp(),simulated:true,evidence:null};
   state.commands.unshift(cmd);audit("DEMO_COMMAND_REQUEST",r,d.id);
   return write(res,201,{ok:true,command:cmd,notice:"لم يُرسل أي أمر لجهاز حقيقي؛ لا توجد نتيجة تنفيذ مثبتة."});
  }
  if(pathname==="/api/incidents"){
   if(!["owner","enterprise"].includes(r))return fail(res,"FORBIDDEN",403);
   const subject=String(b.subject??"").trim();if(subject.length<4||subject.length>120)return fail(res,"INVALID_SUBJECT");
   const item={id:randomUUID(),subject,state:"OPEN",ownerId:r==="owner"?"demo-owner":null,tenantId:r==="enterprise"?"demo-tenant":null,createdAt:stamp(),evidenceCount:0};
   state.incidents.unshift(item);audit("DEMO_INCIDENT_OPEN",r,item.id);return write(res,201,{ok:true,incident:item});
  }
  if(pathname==="/api/tickets"){
   if(!["owner","family"].includes(r))return fail(res,"FORBIDDEN",403);
   const subject=String(b.subject??"").trim();if(subject.length<5||subject.length>160)return fail(res,"INVALID_SUBJECT");
   const item={id:randomUUID(),subject,status:"OPEN",ownerRole:r,createdAt:stamp()};state.tickets.unshift(item);audit("DEMO_TICKET_OPEN",r,item.id);return write(res,201,{ok:true,ticket:item});
  }
  if(pathname==="/api/family/invites"){
   if(r!=="family")return fail(res,"FORBIDDEN",403);
   const email=String(b.email??"").trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180)return fail(res,"INVALID_EMAIL");
   if(state.family.seats.used+state.family.invites.length>=state.family.seats.total)return fail(res,"NO_AVAILABLE_SEATS");
   state.family.invites.unshift({id:randomUUID(),email,status:"DRAFT_NOT_SENT",createdAt:stamp()});audit("DEMO_FAMILY_INVITE_DRAFT",r,"redacted");return write(res,201,{ok:true,notice:"الدعوة مسودة، لم يُرسل بريد."});
  }
  if(pathname==="/api/enterprise/policies"){
   if(r!=="enterprise")return fail(res,"FORBIDDEN",403);
   const name=String(b.name??"").trim();if(name.length<3||name.length>100)return fail(res,"INVALID_NAME");
   const item={id:randomUUID(),name,state:"DRAFT"};state.enterprise.policies.unshift(item);audit("DEMO_POLICY_DRAFT",r,item.id);return write(res,201,{ok:true,policy:item});
  }
  if(pathname==="/api/admin/content"){
   if(r!=="admin")return fail(res,"FORBIDDEN",403);
   const title=String(b.title??"").trim();if(title.length<3||title.length>120)return fail(res,"INVALID_TITLE");
   const item={id:randomUUID(),title,state:"DRAFT"};state.content.unshift(item);audit("DEMO_CONTENT_DRAFT",r,item.id);return write(res,201,{ok:true,content:item});
  }
  if(pathname==="/api/reports/preview"){
   if(!["owner","enterprise"].includes(r))return fail(res,"FORBIDDEN",403);
   const incident=redactRole(r,state).incidents.find(x=>x.id===b.incidentId);if(!incident)return fail(res,"INCIDENT_NOT_AUTHORIZED",403);
   audit("DEMO_REPORT_PREVIEW",r,incident.id);return write(res,200,{ok:true,report:{id:"PREVIEW-"+incident.id,incidentId:incident.id,createdAt:stamp(),events:[],evidence:[],verificationId:null,signature:"NOT_SIGNED",official:false,issued:false,warning:"معاينة غير صالحة كدليل أو تقرير رسمي، لا توجد بيانات متحقق منها."}});
  }
  return fail(res,"NOT_FOUND",404);
 }
 if(req.method!=="GET")return fail(res,"METHOD_NOT_ALLOWED",405);
 let path=pathname==="/"?"/index.html":pathname;
 if(path.includes("..")||!/^\/[a-zA-Z0-9_./-]+$/.test(path))return fail(res,"BAD_PATH",400);
 if(!["/index.html","/styles.css","/app.js"].includes(path))return fail(res,"NOT_FOUND",404);
 try{const buf=await readFile(resolve(root,"."+path));return write(res,200,buf,MIME[extname(path)]||"application/octet-stream");}
 catch{return fail(res,"NOT_FOUND",404);}
}
const port=Number(process.env.PORT||4173);
const host="127.0.0.1"; // Never publicly expose unauthenticated DEMO endpoints
if(process.env.NODE_ENV!=="test")http.createServer((req,res)=>{handler(req,res).catch(()=>fail(res,"INTERNAL_ERROR",500));}).listen(port,host,()=>console.log("BOB demo (no DB) http://"+host+":"+port));
export {handler,state};
