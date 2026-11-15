
const ROLE_LABELS={owner:"مالك الجهاز",family:"مدير الأسرة",enterprise:"مدير المؤسسة",admin:"إدارة BOB",partner:"شريك التوزيع",support:"موظف الدعم"};
const NAV={
 overview:["نظرة عامة","◈"],devices:["أجهزتي","▣"],protection:["الأمان والحماية","⬡"],commands:["مركز الأوامر","⌁"],
 incidents:["الحوادث والاسترداد","◉"],evidence:["الأدلة والتقارير","▤"],family:["إدارة الأسرة","♧"],enterprise:["المؤسسة","▦"],
 account:["الحساب والفوترة","◫"],support:["الدعم الفني","◌"],admin:["الإدارة المركزية","▧"],partners:["الشركاء والعمولات","◇"],screens:["سجل 104 شاشة","▥"]
};
const ACCESS={
 owner:["overview","devices","protection","commands","incidents","evidence","account","support","screens"],
 family:["overview","family","account","support","screens"],
 enterprise:["overview","enterprise","devices","commands","incidents","evidence","screens"],
 admin:["overview","admin","screens"],
 partner:["overview","partners","screens"],
 support:["overview","support","screens"]
};
const COMMAND_ACTIONS={STATUS_REFRESH:"تحديث حالة الجهاز",ALERT_TEST:"تنبيه مرئي تجريبي",RECOVERY_START:"طلب بدء الاسترداد التجريبي"};
let role=localStorage.getItem("bob-demo-role")||"owner";
if(!ROLE_LABELS[role])role="owner";
let data=null,screens=[],preview=null,preflight=null,searchTerm="",groupFilter="all",selectedScreen=null,menuOpen=false,selectedDeviceId=null,selectedAction="STATUS_REFRESH",notice=null;
const root=document.getElementById("app");
const esc=v=>String(v===null||v===undefined?"—":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>{if(!v)return "غير متوفر";const d=new Date(v);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(d):esc(v)};
const pill=(x,t="dim")=>'<span class="badge '+t+'">'+esc(x)+'</span>';
const btn=(text,action,style="")=>'<button class="btn '+style+'" data-action="'+esc(action)+'">'+esc(text)+'</button>';
const cards=(list)=>'<div class="grid cols4">'+list.map(x=>'<div class="metric"><div class="mlabel">'+esc(x.label)+'</div><div class="mval">'+esc(x.value)+'</div><div class="mfoot">'+esc(x.foot||"بيانات تجريبية")+'</div></div>').join("")+'</div>';
const section=(name,body,extra="")=>'<section class="section"><div class="section-title"><h2>'+esc(name)+'</h2>'+extra+'</div>'+body+'</section>';
const empty=text=>'<div class="empty">'+esc(text)+'</div>';
const hint=(text,warning=false)=>'<div class="hint'+(warning?' warn':'')+'">'+esc(text)+'</div>';
const wrap=(title,subtitle,body)=>'<div class="heading"><div class="eyebrow">BOB SECURITY / '+esc(ROLE_LABELS[role])+'</div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div>'+body;
const dateNote='البيانات توضيحية، ولا توجد أجهزة أو مدفوعات أو خدمات خارجية متصلة.';
async function request(path,options={}){
 const r=await fetch(path,{...options,headers:{"Content-Type":"application/json","x-demo-role":role,...options.headers}});
 let j;try{j=await r.json();}catch{throw new Error("استجابة الخادم غير صالحة");}
 if(!r.ok)throw new Error(j.code||"REQUEST_FAILED");
 return j;
}
async function bootstrap(){
 const [d,s]=await Promise.all([request("/api/bootstrap"),request("/api/screens")]);
 data=d;screens=s.screens||[];if(selectedDeviceId && !(d.devices||[]).some(x=>x.id===selectedDeviceId))selectedDeviceId=null;
 if(!selectedDeviceId && d.devices?.length)selectedDeviceId=d.devices[0].id;
 render();
}
function toast(text,error=false){notice={text,error};renderToast();setTimeout(()=>{notice=null;renderToast()},5500)}
function renderToast(){document.querySelector(".toast")?.remove();if(notice){const el=document.createElement("div");el.className="toast"+(notice.error?" error":"");el.setAttribute("role","status");el.textContent=notice.text;document.body.append(el)}}
function currentRoute(){let route=location.hash.replace(/^#/,"")||"overview";if(!ACCESS[role].includes(route))route="overview";return route}
function renderNav(route){
 const names=ACCESS[role]||ACCESS.owner;
 return names.map((key,i)=>(i===0?'<div class="navgroup">مساحة العمل</div>':"")+'<a class="navlink'+(route===key?" active":"")+'" href="#'+key+'" data-route="'+key+'"><span class="navicon" aria-hidden="true">'+NAV[key][1]+'</span><span>'+NAV[key][0]+'</span></a>').join("");
}
function renderShell(route,content){
 root.innerHTML='<div class="shell'+(menuOpen?' menu-open':'')+'">'+
 '<div class="overlay" data-action="close-menu"></div>'+
 '<aside class="sidebar" aria-label="القائمة الجانبية"><div class="brand"><img class="brand-image" src="/bob-logo.jpeg" alt="الشعار الرسمي لـ BOB Security"><div><b>BOB</b><small>SECURITY CONTROL</small></div></div>'+
 renderNav(route)+'<div class="sidebar-foot">نموذج تطوير معزول عن الموقع المنشور.<div>'+pill("قاعدة البيانات غير متصلة","warn")+'</div><div>تعطيل تنفيذ الأوامر الفعلية</div></div></aside>'+
 '<div class="main"><header class="topbar"><div class="top-meta"><button class="side-toggle" data-action="toggle-menu" aria-label="فتح القائمة">☰</button><span class="topbar-title">لوحة عمليات BOB</span>'+pill("DEMO / PRE-DB","warn")+'</div>'+
 '<div class="top-meta"><label class="sr-only" for="role">الانتقال بين الأدوار التجريبية</label><select class="input role-select" id="role" aria-label="الدور التجريبي">'+Object.entries(ROLE_LABELS).map(([k,v])=>'<option value="'+k+'"'+(role===k?' selected':'')+'>'+esc(v)+'</option>').join("")+'</select></div></header>'+
 '<main id="main" class="content">'+content+'<div class="footer-note">BOB Security • نسخة تطوير تجريبية • لا توجد بيانات فعلية أو مزايا إنتاج مفعلة • عدم الاتصال بقاعدة بيانات</div></main></div></div>';
 renderToast();
}
function summary(){
 if(role==="owner"){
  return [{label:"الأجهزة المرتبطة",value:data.devices.length,foot:"من بيانات المعاينة"},{label:"أجهزة متصلة",value:data.devices.filter(x=>x.connection==="online").length},{label:"حوادث مسجلة",value:data.incidents.length},{label:"أوامر بنتيجة مثبتة",value:0,foot:"لا تنفيذ فعلي قبل التكامل"}];
 }
 if(role==="enterprise")return [{label:"أجهزة المؤسسة التجريبية",value:data.devices.length},{label:"حالة AMAPI",value:"مغلق",foot:"ينتظر أهلية المؤسسة"},{label:"السياسات",value:data.enterprise?.policies?.length||0},{label:"الحوادث",value:data.incidents.length}];
 if(role==="family")return [{label:"المقاعد المستخدمة",value:data.family.seats.used},{label:"إجمالي المقاعد",value:data.family.seats.total},{label:"الدعوات المسودة",value:data.family.invites.length},{label:"رؤية أجهزة البالغين",value:"محظورة",foot:"بموجب سياسة الخصوصية"}];
 if(role==="admin")return [{label:"حسابات تجريبية",value:data.admin.users.length},{label:"مسودات محتوى",value:data.admin.content.length},{label:"سجلات تدقيق",value:data.admin.audit.length},{label:"حالة النظام",value:"غير متصل"}];
 if(role==="partner")return [{label:"أكواد تجريبية",value:0},{label:"عمولات مستحقة",value:"—"},{label:"مدفوعات",value:"—"},{label:"مصدر الحقيقة",value:"غير متصل"}];
 return [{label:"التذاكر المتاحة",value:data.tickets.length},{label:"التحويل البشري",value:"تجريبي"},{label:"قواعد المعرفة",value:"قيد البناء"},{label:"ذكاء اصطناعي",value:"غير متصل"}];
}
function overview(){
 let quick=ACCESS[role].filter(x=>x!=="overview"&&x!=="screens").slice(0,4).map(key=>'<a href="#'+key+'" class="btn">'+esc(NAV[key][0])+' ←</a>').join("");
 let activity=role==="owner"?(data.incidents||[]).map(x=>row(x.subject,'حادث '+x.state,fmt(x.createdAt))).join("")||
 empty("لا توجد حوادث") :role==="admin"?(data.admin.audit||[]).slice(0,4).map(x=>row(x.action,x.role,fmt(x.at))).join("")||empty("لا توجد أحداث بعد"):empty("المعاينة لا تعرض بيانات إنتاجية.");
 return wrap("مركز الحماية والعمليات","لوحة موحدة تُظهر الحالة التي يمكن إثباتها، وليس وعودًا بتنفيذ غير متحقق.",
 '<div class="hero"><div class="hero-copy"><div class="eyebrow">ACTIVE DEFENSE • PRODUCT PREVIEW</div><h1>حماية واعية بكل صلاحية</h1><p>اعرف الحالة، تحقق من القدرة، نفذ فقط المسموح به، وتابع الدليل قبل اعتبار العملية ناجحة.</p><div class="actions">'+quick+'</div></div><div class="hero-shield"><img class="hero-approved-logo" src="/bob-logo.jpeg" alt="BOB Security"></div></div>'+
 section("المؤشرات",cards(summary()))+
 '<div class="grid cols2 section"><div class="panel"><div class="panel-header"><h2>النشاط الأخير</h2>'+pill("تجريبي")+'</div><div class="list">'+activity+'</div></div>'+
 '<div class="panel"><div class="panel-header"><h2>بوابات الإنتاج</h2>'+pill("غير مفعلة","warn")+'</div>'+
 kv("قاعدة البيانات","NOT_CONNECTED")+kv("تنفيذ الأوامر","DISABLED")+kv("المصادقة الحقيقية","NOT_CONFIGURED")+kv("Android Enterprise","GATED")+kv("الدفع والتقارير الرسمية","GATED")+'</div></div>'+
 section("حدود المعاينة",hint("هذه نسخة تطوير تفاعلية تختبر رحلات الاستخدام ومسارات البيانات. لا تملك صلاحية للوصول إلى جهاز حقيقي، ولا تُصدر تقريرًا موقعًا أو فاتورة أو أمرًا خارجيًا.",true)));
}
function kv(label,value){return '<div class="kv"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>'}
function row(title,description,tail="",action=""){return '<div class="list-row"><div><div class="title">'+esc(title)+'</div><div class="desc">'+esc(description)+'</div></div><div class="actions">'+(tail?pill(tail):"")+(action?btn("عرض",action):"")+'</div></div>'}
function devices(){
 const arr=data.devices||[];return wrap("الأجهزة وحالة القدرة","يُعرض آخر قياس معروف مع وقت القياس، ولا تُعتبر البيانات القديمة حالة لحظية.",
 arr.length?'<div class="grid cols2">'+arr.map(x=>'<article class="panel"><div class="panel-header"><h2>▣ '+esc(x.name)+'</h2>'+pill(x.connection==="online"?"متصل تجريبي":"غير متصل",x.connection==="online"?"good":"warn")+'</div>'+
 kv("المعرّف التجريبي",x.id)+kv("نوع الإدارة",x.kind==="managed"?"مؤسسي":"شخصي")+kv("النظام",x.os)+kv("الوضع",x.mode)+kv("آخر اتصال",fmt(x.lastSeen))+kv("آخر موقع","غير متوفر - لم يُجمع موقع")+
 '<div class="actions section"><a class="btn" href="#commands">مركز الأوامر</a><a class="btn" href="#incidents">فتح حادث تجريبي</a></div></article>').join("")+'</div>':empty("الدور الحالي لا يملك أجهزة ضمن النطاق المسموح")+
 section("فصل الصلاحيات",hint("مالك الأسرة لا يرى جهاز بالغ آخر. موظف الشركة أو الدعم لا يكتسب صلاحية التحكم في الأجهزة بصفة الدور فقط.")));
}
function protection(){
 const list=(data.devices||[]).map(d=>'<div class="panel"><h2>'+esc(d.name)+'</h2>'+kv("حالة الحماية",d.mode)+kv("حالة الاتصال",d.connection)+kv("آخر فحص صلاحية",d.capabilities?.status?.checkedAt?fmt(d.capabilities.status.checkedAt):"غير متوفر")+kv("نتيجة فحص البرامج الضارة","غير مدعوم: ليست مضاد فيروسات شامل")+'</div>').join("");
 return wrap("الحماية ومحرك القدرات","لا تظهر أي ميزة كقابلة للتنفيذ قبل توافر صلاحيتها وفحص حداثة النتيجة.",
 '<div class="grid cols2">'+list+'</div>'+
 section("عقود أوضاع الحماية",'<div class="grid cols3">'+["Security Normal","Alert Standby","Recovery","Pulse/Panic","Passive Protection","Mobile Cybersecurity"].map(x=>'<div class="tile"><h3>'+esc(x)+'</h3>'+pill("مسار منتج — غير مفعل")+'<p class="small muted">التشغيل الفعلي يستلزم بيئة Android واختبار القدرة والبوابات.</p></div>').join("")+'</div>')+
 section("قاعدة تشغيل الحساسات",hint("لا تُشغَّل الكاميرا أو الميكروفون من هذا النموذج. التمكين الأولي لا يضمن بدء الحساس، ويجب إعادة التحقق داخل الجهاز مباشرة قبل أي أثر.")));
}
function commands(){
 const arr=data.devices||[];
 if(!arr.length)return wrap("مركز الأوامر","لا توجد أجهزة مخولة لهذا الدور.",hint("لا تمنح العضوية العائلية أو صلاحية الدعم حق التحكم في أجهزة الآخرين.",true));
 const options=arr.map(d=>'<option value="'+esc(d.id)+'"'+(selectedDeviceId===d.id?" selected":"")+'>'+esc(d.name)+'</option>').join("");
 const commandOptions=Object.entries(COMMAND_ACTIONS).map(([k,v])=>'<option value="'+k+'"'+(selectedAction===k?" selected":"")+'>'+esc(v)+'</option>').join("");
 const list=(data.commands||[]).map(c=>row(COMMAND_ACTIONS[c.action]||c.action,"الجهاز: "+c.deviceId+" • لا تنفيذ فعلي",c.state+" • "+fmt(c.createdAt))).join("")||empty("لا توجد أوامر تجريبية بعد");
 return wrap("مركز الأوامر","تبدأ العملية بفحص قدرة حديث، وتتوقف عند محاكاة الطلب دون إرسال أمر لجهاز فعلي.",
 '<div class="grid cols2"><div class="panel"><h2>طلب أمر على جهاز مخول</h2><div class="field"><label for="cmd-device">الجهاز الهدف</label><select id="cmd-device">'+options+'</select></div><div class="field section"><label for="cmd-action">نوع الأمر</label><select id="cmd-action">'+commandOptions+'</select></div><div class="actions section">'+btn("تحديث فحص تجريبي","capability-refresh")+btn("فحص الصلاحية والقدرة","preflight","primary")+btn("تسجيل أمر تجريبي","command")+'</div><div class="section">'+(preflight?hint("نتيجة الفحص: "+preflight.code+" • "+(preflight.note||"لا يُسمح بالتنفيذ قبل استيفاء الشروط."),!preflight.allowed):hint("حدّد الجهاز والأمر ثم اطلب الفحص. التحقق لا يعني أن أي حساس بدأ."))+'</div></div>'+
 '<div class="panel"><h2>دورة حياة الأمر</h2>'+kv("1. فحص التفويض","مطلوب")+kv("2. فحص القدرة","مطلوب وحديث")+kv("3. مراجعة الهدف","مطلوبة")+kv("4. تنفيذ الهاتف","معطل في المعاينة")+kv("5. إثبات النتيجة","لا نجاح دون دليل")+kv("6. نتيجة غير مؤكدة","RESULT_UNCONFIRMED")+'</div></div>'+
 section("سجل الأوامر",'<div class="list">'+list+'</div>')+
 section("حدود الأوامر الحساسة",hint("أوامر المسح والقفل الإداري والكاميرا والصوت غير متاحة في المعاينة. المسح الجماعي المؤسسي يحتاج موافقة ثانية مستقلة، والأوامر غير قابلة للتنفيذ عبر واجهة الأسرة.",true)));
}
function incidents(){
 const ar=data.incidents||[];
 return wrap("الحوادث والاسترداد","تُنشأ حوادث تجريبية مستقلة بمرجع واضح؛ لا يجري جمع موقع أو وسائط تلقائيًا.",
 '<div class="grid cols2"><form id="incident-form" class="panel"><h2>فتح حادث جديد</h2><div class="field"><label for="inc-subject">وصف الحادث التجريبي</label><input id="inc-subject" class="input" name="subject" required minlength="4" maxlength="120" placeholder="مثل: فقدان هاتف - معاينة"></div><div class="actions section"><button class="btn primary" type="submit">إنشاء حادث تجريبي</button></div></form>'+
 '<div class="panel"><h2>دورة العمل</h2>'+kv("تسجيل الحادث","متاح تجريبيًا")+kv("تحديد الجهاز","مرتبط بصلاحية الحساب")+kv("الموقع","غير مجمع")+kv("الوسائط والأدلة","غير مجمعة")+kv("تقرير رسمي","غير مفعل")+'</div></div>'+
 section("الحوادث المسجلة",'<div class="list">'+(ar.map(x=>row(x.subject,"المعرف: "+x.id+" • أدلة: "+x.evidenceCount,x.state+" • "+fmt(x.createdAt))).join("")||empty("لا توجد حوادث"))+'</div>'));
}
function evidence(){
 const list=data.incidents||[];
 const opts=list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.subject)+' ('+esc(x.id.slice(0,12))+')</option>').join("");
 return wrap("الأدلة والتقارير الفنية","مسار E-01 إلى E-09 مفصول عن إصدار التقرير الفعلي والتحقق الخارجي.",
 '<div class="grid cols2"><div class="panel"><h2>معاينة تقرير حادث</h2><div class="field"><label for="incident-choice">اختر الحادث</label><select id="incident-choice">'+opts+'</select></div><div class="section actions">'+btn("إنشاء معاينة غير رسمية","report-preview","primary")+'</div><div class="section">'+hint("هذه معاينة بلا دليل أو توقيع أو رقم تحقق رسمي. لا تمثل تقريرًا معتمدًا.",true)+'</div></div><div class="panel"><h2>سلسلة الإثبات</h2>'+
 ["الموقع / آخر موقع","خط زمني موثق","ملفات الأدلة","بصمات SHA-256","سجل تقني","معاينة","إصدار / تصدير","حالة التوقيع","سلسلة الحيازة"].map((x,i)=>kv("E-"+String(i+1).padStart(2,"0")+" • "+x,"غير جاهز للإصدار")).join("")+'</div></div>'+
 (preview?section("معاينة التقرير",'<div class="panel"><h2>تقرير: '+esc(preview.id)+'</h2>'+kv("رقم الحادث",preview.incidentId)+kv("تاريخ المعاينة",fmt(preview.createdAt))+kv("حالة التوقيع",preview.signature)+kv("تم الإصدار؟","لا")+kv("قيمة الدليل","لا توجد أدلة متحقق منها")+'</div>'):""));
}
function family(){
 if(role!=="family")return wrap("إدارة الأسرة","محظورة على هذا الدور.",hint("هذه الصفحة لا تمنح التحكم في أجهزة أفراد الأسرة."));
 const f=data.family;
 return wrap("مساحة الأسرة","تقتصر على إدارة العضوية والدعوات والمقاعد والاشتراك، ولا تعرض أجهزة البالغين أو مواقعهم.",
 cards([{label:"المقاعد المستخدمة",value:f.seats.used},{label:"المقاعد الشاغرة",value:f.seats.total-f.seats.used-f.invites.length},{label:"الدعوات المسودة",value:f.invites.length},{label:"الاشتراك",value:"تجريبي"}])+
 '<div class="grid cols2 section"><div class="panel"><h2>الأعضاء</h2><div class="list">'+f.members.map(x=>row(x.name,x.role,x.status)).join("")+'</div></div>'+
 '<form id="invite-form" class="panel"><h2>إضافة دعوة</h2><div class="field"><label for="invite-email">بريد العضو المدعو</label><input id="invite-email" type="email" name="email" class="input" required placeholder="name@example.com"></div><p class="small muted">سيُحفظ نموذج دعوة تجريبي فقط، ولن تُرسل رسالة.</p><button type="submit" class="btn primary">حفظ مسودة دعوة</button></form></div>'+
 section("الدعوات",'<div class="list">'+(f.invites.map(x=>row(x.email,x.id,x.status)).join("")||empty("لا توجد دعوات"))+'</div>')+
 section("منع المراقبة الأسرية",hint("مدير الأسرة لا يمكنه الاطلاع على موقع أو صور أو تسجيلات أو حالة جهاز أي بالغ آخر، ولا يستطيع إصدار أوامر عليه.")));
}
function enterprise(){
 if(role!=="enterprise")return wrap("المؤسسة","غير مخولة",hint("تتطلب هذه الواجهة حسابًا مؤسسيًا معتمدًا."));
 const e=data.enterprise;
 return wrap("لوحة المؤسسة","إدارة الأسطول والسياسات ضمن Android Enterprise، بعد تحقق العقد والقدرة وAMAPI.",
 cards([{label:"الأجهزة المؤسسية",value:data.devices.length},{label:"سياسات مسودة",value:e.policies.length},{label:"أهلية AMAPI",value:"غير متحققة"},{label:"التسجيل المؤسسي",value:"غير مربوط"}])+
 '<div class="grid cols2 section"><div class="panel"><h2>الأجهزة المؤهلة تجريبيًا</h2><div class="list">'+data.devices.map(x=>row(x.name,x.os+" • "+x.mode,x.connection)).join("")+'</div></div>'+
 '<form id="policy-form" class="panel"><h2>إنشاء مسودة سياسة</h2><div class="field"><label for="policy-name">اسم السياسة</label><input id="policy-name" name="name" class="input" required minlength="3" maxlength="100" placeholder="سياسة تجريبية"></div><p class="small muted">لا تُطبَّق السياسة على أي جهاز.</p><button class="btn primary" type="submit">حفظ مسودة سياسة</button></form></div>'+
 section("سجل السياسات",'<div class="list">'+e.policies.map(x=>row(x.name,x.id,x.state)).join("")+'</div>')+
 section("المسح الإداري",hint("المسح محجوب. لا يوجد اتصال Android Management API أو عقد أو تأكيد ثانٍ للمسح الجماعي أو دليل نتيجة.",true)));
}
function account(){
 const a=data.account||{};
 return wrap("الحساب والاشتراكات","الحساب والجهاز والاستحقاق والفاتورة كيانات منفصلة، والمدفوعات الفعلية مغلقة.",
 '<div class="grid cols3">'+["BOB Public","Guard Personal","Guard Managed"].map((name,i)=>'<div class="panel"><h2>'+name+'</h2>'+pill(i===0?"مستوى مجاني":"مسار تجاري","dim")+'<p class="small muted">'+["الحساب والحالة والدعم ضمن الحدود المعلنة.","قدرات فردية إضافية مشروطة بالاشتراك والقدرة.","إدارة مؤسسية مشروطة بعقد رسمي وأهلية AMAPI."][i]+'</p>'+pill("لا يوجد دفع في المعاينة","warn")+'</div>').join("")+'</div>'+
 section("الحالة التجريبية",'<div class="panel">'+kv("اسم الحساب",a.displayName)+kv("الاشتراك المعروض",a.plan)+kv("الفوترة",a.billing)+kv("مزود الدفع",a.paymentProvider)+kv("المعاملات","غير متصلة")+'</div>'));
}
function support(){
 const tickets=data.tickets||[];
 const create=["owner","family"].includes(role);
 return wrap("الدعم الفني","تذكرة واحدة ومسار تصعيد واضح. لا توجد محادثة AI أو إرسال بريد خارجي في هذه النسخة.",
 (create?'<form id="ticket-form" class="panel"><h2>إنشاء تذكرة دعم تجريبية</h2><div class="form-row"><div class="field"><label for="ticket-subject">عنوان المشكلة</label><input id="ticket-subject" class="input" name="subject" minlength="5" maxlength="160" required placeholder="اكتب المشكلة باختصار"></div><button class="btn primary" type="submit">فتح تذكرة</button></div></form>':"")+
 section("التذاكر",'<div class="list">'+(tickets.map(x=>row(x.subject,"رقم: "+x.id,x.status)).join("")||empty("لا توجد تذاكر"))+'</div>')+
 section("حدود الدعم الذكي",hint("التصنيف الآلي والربط بنماذج الذكاء الاصطناعي والتصعيد الحقيقي لموظف لا يزال غير متصل. لا يمكن للدعم الاطلاع على محتوى جهاز المستخدم دون تفويض مستقل.")));
}
function admin(){
 if(role!=="admin")return wrap("الإدارة المركزية","الدور غير مخول.",hint("إدارة BOB لا تملك حق التحكم بالأجهزة تلقائيًا."));
 const a=data.admin;
 return wrap("الإدارة المركزية","مساحة منفصلة للموظفين والأدوار والمحتوى والفوترة والتدقيق وصحة النظام.",
 cards([{label:"حسابات تجريبية",value:a.users.length},{label:"مسودات محتوى",value:a.content.length},{label:"سجلات تدقيق",value:a.audit.length},{label:"قاعدة البيانات",value:"غير متصلة"}])+
 '<div class="grid cols2 section"><div class="panel"><h2>حسابات نموذجية</h2><div class="list">'+a.users.map(x=>row(x.name,"الدور: "+x.role,x.status)).join("")+'</div></div>'+
 '<form class="panel" id="content-form"><h2>منشئ المحتوى</h2><div class="field"><label for="content-title">عنوان مسودة المحتوى</label><input id="content-title" class="input" name="title" required minlength="3" maxlength="120" placeholder="اكتب عنوان المحتوى"></div><p class="small muted">مسودة داخل خادم التجربة؛ لا نشر ولا ربط n8n.</p><button class="btn primary" type="submit">حفظ مسودة</button></form></div>'+
 section("المحتوى",'<div class="list">'+a.content.map(x=>row(x.title,x.id,x.state)).join("")+'</div>')+
 section("سجل التدقيق",'<div class="panel table-scroll"><table><thead><tr><th>الحدث</th><th>الدور</th><th>الهدف</th><th>التاريخ</th></tr></thead><tbody>'+
 (a.audit.map(x=>'<tr><td>'+esc(x.action)+'</td><td>'+esc(x.role)+'</td><td>'+esc(x.target)+'</td><td>'+fmt(x.at)+'</td></tr>').join("")||'<tr><td colspan="4">لا توجد أحداث حتى الآن</td></tr>')+'</tbody></table></div>')+
 section("قيود الإدارة",hint("لا يوجد دخول مسؤول إنتاجي أو إدارة أدوار فعالة أو بيانات مدفوعات أو نشر محتوى في هذه النسخة. عمليات الإدارة الحساسة تحتاج مصادقة وفصل واجبات وسجلات تدقيق ثابتة.")));
}
function partners(){
 return wrap("الشركاء والتوزيع","مصدر الإسناد والعمولات والصرف مفصولة عن الزيارات والتثبيت.",
 cards([{label:"أكواد",value:"—"},{label:"عمولات مثبتة",value:"—"},{label:"كشوف صرف",value:"—"},{label:"مصدر الحقيقة",value:"غير متصل"}])+
 section("دورة إسناد الشريك",'<div class="grid cols3">'+["تعريف المصدر وتتبعه","التحقق من البيع المؤهل","تسوية العمولة والصرف"].map((x,i)=>'<div class="panel"><h2>0'+(i+1)+' • '+esc(x)+'</h2>'+pill("غير مفعّل","warn")+'<p class="small muted">لا ينتج استحقاق مالي من QR أو تثبيت التطبيق وحدهما.</p></div>').join("")+'</div>')+
 section("حماية المستحقات",hint("إنشاء العمولة والصرف يتطلب حدث استحقاق فعليًا ومستند إثبات وموافقات مالية؛ لا يتم احتساب أي مبالغ تجريبية على أنها دين مستحق.")));
}
function screenTiles(){
 const ss=screens.filter(x=>(groupFilter==="all"||x.group===groupFilter)&&(!searchTerm||(x.name+" "+x.id+" "+x.group).toLowerCase().includes(searchTerm.toLowerCase())));
 return '<div class="grid cols3">'+ss.map(x=>'<div class="screen-card"><div class="panel-header"><span class="screen-code">'+esc(x.id)+'</span>'+pill(x.implementation==="INTERACTIVE_DEMO"?"معاينة جزئية":"عقد واجهة فقط",x.implementation==="INTERACTIVE_DEMO"?"good":"dim")+'</div><strong>'+esc(x.name)+'</strong><div class="small muted">'+esc(x.group)+'</div></div>').join("")+'</div>'+(ss.length?"":empty("لا توجد شاشة مطابقة"));
}
function screenCatalog(){
 const groups=[...new Set(screens.map(x=>x.group))],count=screens.filter(x=>x.implementation==="INTERACTIVE_DEMO").length;
 return wrap("سجل الشاشات الرسمي","104 شاشات أم حاكمة من مرجع BOB 4.0؛ ظهور اسم الشاشة لا يعني اكتمال تنفيذها.",
 cards([{label:"الشاشات المعتمدة",value:screens.length},{label:"تدفقات فرعية مرجعية",value:35,foot:"ما زال تنفيذها قيد العمل"},{label:"شاشات بمعاينات جزئية",value:count},{label:"جاهزية الإنتاج",value:"مغلقة"}])+
 section("استعراض الشاشات",'<div class="panel"><div class="tools"><input class="input" id="screen-search" value="'+esc(searchTerm)+'" placeholder="ابحث بالاسم أو الرمز"><select id="screen-group"><option value="all">جميع المجموعات</option>'+groups.map(g=>'<option value="'+esc(g)+'"'+(g===groupFilter?" selected":"")+'>'+esc(g)+'</option>').join("")+'</select></div><p class="small muted">المعاينة الجزئية تعرض رحلة أو مكوّنًا مرتبطًا، وليست اعتمادًا للشاشة أو اختبارات الأجهزة.</p><div id="screen-list">'+screenTiles()+'</div></div>'));
}
function render(){
 if(!data){root.innerHTML='<div class="startup"><div class="shield-logo">B</div><h1>BOB Security</h1><p>تعذر الحصول على بيانات المعاينة حتى الآن.</p></div>';return;}
 const route=currentRoute();
 const views={overview,devices,protection,commands,incidents,evidence,family,enterprise,account,support,admin,partners,screens:screenCatalog};
 renderShell(route,(views[route]||overview)());
}
async function runAction(action){
 try{
  if(action==="toggle-menu"||action==="close-menu"){menuOpen=action==="toggle-menu"?!menuOpen:false;render();return;}
  if(action==="capability-refresh"){
   const d=document.getElementById("cmd-device");if(d)selectedDeviceId=d.value;
   const r=await request("/api/devices/preflight-refresh",{method:"POST",body:JSON.stringify({deviceId:selectedDeviceId})});
   preflight=null;await bootstrap();toast(r.notice);return;
  }
  if(action==="preflight"||action==="command"){
   const d=document.getElementById("cmd-device"),a=document.getElementById("cmd-action");
   if(d)selectedDeviceId=d.value;if(a)selectedAction=a.value;
   const payload=JSON.stringify({deviceId:selectedDeviceId,action:selectedAction});
   if(action==="preflight"){const res=await fetch("/api/commands/preflight",{method:"POST",headers:{"Content-Type":"application/json","x-demo-role":role},body:payload});preflight=await res.json();render();toast(preflight.allowed?"نجح الفحص التجريبي؛ لا يوجد تنفيذ فعلي.":"الفحص منع الطلب: "+preflight.code,!preflight.allowed);}
   else{const r=await request("/api/commands",{method:"POST",body:payload});await bootstrap();toast(r.notice);}
  }
  if(action==="report-preview"){
   const select=document.getElementById("incident-choice");if(!select?.value){toast("لا يوجد حادث لاختيار التقرير.",true);return;}
   const r=await request("/api/reports/preview",{method:"POST",body:JSON.stringify({incidentId:select.value})});preview=r.report;render();toast("تم إنشاء معاينة غير رسمية فقط.");
  }
 }catch(e){toast("تعذر تنفيذ العملية التجريبية: "+e.message,true)}
}
document.addEventListener("click",async e=>{
 const action=e.target.closest("[data-action]");if(action){e.preventDefault();await runAction(action.dataset.action);return;}
 if(e.target.closest("[data-route]")){menuOpen=false;setTimeout(render,0);}
});
document.addEventListener("change",async e=>{
 if(e.target.id==="role"){role=e.target.value;localStorage.setItem("bob-demo-role",role);location.hash="#overview";data=null;preflight=null;preview=null;selectedDeviceId=null;menuOpen=false;try{await bootstrap()}catch(err){toast(err.message,true)}}
 if(e.target.id==="cmd-device"){selectedDeviceId=e.target.value;preflight=null}
 if(e.target.id==="cmd-action"){selectedAction=e.target.value;preflight=null}
 if(e.target.id==="screen-group"){groupFilter=e.target.value;document.getElementById("screen-list").innerHTML=screenTiles()}
});
document.addEventListener("input",e=>{if(e.target.id==="screen-search"){searchTerm=e.target.value;document.getElementById("screen-list").innerHTML=screenTiles()}});
document.addEventListener("submit",async e=>{
 const endpoints={"incident-form":"/api/incidents","ticket-form":"/api/tickets","invite-form":"/api/family/invites","policy-form":"/api/enterprise/policies","content-form":"/api/admin/content"};
 if(!endpoints[e.target.id])return;e.preventDefault();
 const fields=Object.fromEntries(new FormData(e.target));try{const r=await request(endpoints[e.target.id],{method:"POST",body:JSON.stringify(fields)});await bootstrap();toast(r.notice||"تم حفظ العنصر التجريبي، دون إرسال أو نشر أو تطبيق فعلي.");}catch(err){toast(err.message,true)}
});
window.addEventListener("hashchange",()=>{menuOpen=false;if(data)render()});
bootstrap().catch(err=>{root.innerHTML='<div class="startup"><div class="brandmark">B</div><h1>تعذر فتح معاينة BOB</h1><p>شغّل الخادم المحلي بالأمر: npm start</p><p>'+esc(err.message)+'</p></div>'});
