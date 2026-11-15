export const ROLES = Object.freeze(["owner","family","enterprise","admin","partner","support"]);
export const COMMANDS = Object.freeze({
  STATUS_REFRESH:{label:"طلب تحديث حالة الجهاز",entitlement:"public",capability:"status"},
  ALERT_TEST:{label:"اختبار تنبيه مرئي (تجريبي)",entitlement:"public",capability:"alert"},
  RECOVERY_START:{label:"طلب بدء الاسترداد (تجريبي)",entitlement:"personal",capability:"recovery"}
});
export const COMMAND_STATES=Object.freeze(["REQUESTED","PREFLIGHT_REJECTED","ACCEPTED_BY_SERVER","DISPATCH_PENDING","DELIVERED","EXECUTING","RESULT_UNCONFIRMED","EVIDENCE_CONFIRMED","FAILED"]);
export function ownsTarget(role,device){
  if(!device) return false;
  if(role==="owner") return device.ownerId==="demo-owner" && device.kind==="personal";
  if(role==="enterprise") return device.kind==="managed" && device.tenantId==="demo-tenant";
  return false; // family billing roles, staff, partners never inherit device command rights
}
export function preflight({role,device,action,subscription="public",now=Date.now()}){
  const policy=COMMANDS[action];
  if(!ROLES.includes(role)) return {allowed:false,code:"ROLE_INVALID"};
  if(!policy) return {allowed:false,code:"COMMAND_NOT_ALLOWLISTED"};
  if(!ownsTarget(role,device)) return {allowed:false,code:"TARGET_NOT_AUTHORIZED"};
  if(policy.entitlement==="personal" && subscription==="public") return {allowed:false,code:"ENTITLEMENT_MISSING"};
  const cap=device.capabilities?.[policy.capability];
  if(!cap || cap.state!=="SUPPORTED") return {allowed:false,code:"CAPABILITY_UNAVAILABLE"};
  const ts=Date.parse(cap.checkedAt??"");
  if(!Number.isFinite(ts) || Math.abs(now-ts)>60000) return {allowed:false,code:"CAPABILITY_STALE"};
  if(device.connection!=="online") return {allowed:false,code:"DEVICE_NOT_CONNECTED"};
  return {allowed:true,code:"PREFLIGHT_PASS_DEMO_ONLY",note:"يلزم تحقق جديد على الخادم وعلى الهاتف قبل أي تنفيذ حقيقي؛ هذه محاكاة فقط."};
}
export function acceptEvidence(current,evidence){
  if(!evidence || !evidence.verified || !evidence.source || !evidence.recordedAt) return {state:"RESULT_UNCONFIRMED",reason:"MISSING_VERIFIED_EVIDENCE"};
  if(current?.state==="EVIDENCE_CONFIRMED") return current;
  return {...current,state:"EVIDENCE_CONFIRMED",evidence};
}
export function redactRole(role,state){
 const base={demo:true,live:false,devices:[],incidents:[],commands:[],tickets:[],family:null,enterprise:null,admin:null,partner:null,account:{displayName:"مستخدم تجريبي",plan:"Guard Personal",billing:"غير متصل",paymentProvider:"غير متصل"}};
 if(role==="owner"){base.devices=state.devices.filter(x=>ownsTarget(role,x));base.incidents=state.incidents.filter(x=>x.ownerId==="demo-owner");base.commands=state.commands.filter(x=>x.role===role);base.tickets=state.tickets.filter(x=>x.ownerRole==="owner");}
 if(role==="family"){base.family=state.family;base.tickets=state.tickets.filter(x=>x.ownerRole==="family");} // No member device telemetry
 if(role==="enterprise"){base.devices=state.devices.filter(x=>ownsTarget(role,x));base.enterprise=state.enterprise;base.incidents=state.incidents.filter(x=>x.tenantId==="demo-tenant");base.commands=state.commands.filter(x=>x.role===role);}
 if(role==="admin"){base.admin={users:state.adminUsers,health:"DEMO / DB_NOT_CONNECTED",audit:state.audit,content:state.content};} // No device telemetry by default
 if(role==="partner"){base.partner=state.partner;} // No account device data
 if(role==="support"){base.tickets=state.tickets.map(({id,subject,status,createdAt})=>({id,subject,status,createdAt}));} // Minimum needed for routing
 return base;
}
