import React,{useEffect,useMemo,useState} from 'react';
import screens from '../../data/screens.json';
import subflows from '../../data/subflows.json';
import capabilities from '../../data/capabilities.json';
import product from '../../data/product-model.json';

const roles={
 public:{name:'زائر الموقع',links:['W-01','W-05','W-06','W-07','W-08']},
 owner:{name:'صاحب الجهاز',links:['D-01','D-03','D-04','D-05','D-12','A-01','A-03','A-06','E-06','M-10','M-13']},
 family:{name:'مدير الأسرة',links:['M-22','A-06','A-07']},
 enterprise:{name:'إدارة المؤسسة',links:['EN-01','EN-02','EN-03','M-23']},
 admin:{name:'إدارة BOB',links:['AD-02','AD-03','AD-04','AD-05','AD-08','AD-09','AD-10','AD-13','AD-14']},
 partner:{name:'الشريك',links:['P-01','P-02','P-04','P-05','P-06']},
 support:{name:'الدعم',links:['S-01','S-03','S-04','S-06','S-07','S-08']}
};
const byId=Object.fromEntries(screens.map(s=>[s.id,s]));
const fixtures={
 devices:[{id:'own-01',name:'هاتف أندرويد الشخصي',type:'PERSONAL',connection:'متصل في المحاكاة',system:'Android 15',lastSeen:'وهمي',owner:'owner'},
          {id:'own-02',name:'الهاتف الاحتياطي',type:'PERSONAL',connection:'غير متصل',system:'Android 14',lastSeen:'غير محدد',owner:'owner'},
          {id:'tenant-01',name:'جهاز المؤسسة 01',type:'MANAGED',connection:'متصل في المحاكاة',system:'Android 14',lastSeen:'وهمي',owner:'enterprise'}],
 modes:[{id:'normal',name:'الأمان',description:'حالة الاتصال والصلاحيات القابلة للفحص'},
        {id:'alert',name:'التأهب',description:'تصعيد مخول وفق الحدث والقدرة'},
        {id:'recovery',name:'الاسترداد',description:'ضمن حادث واستحقاق وصلاحيات واضحة'},
        {id:'pulse',name:'النبضة / الاستغاثة',description:'يبدأها المستخدم، وليست مراقبة دائمة'}]
};
const availableLabels={SUPPORTED:'مدعوم',STALE:'نتيجة قديمة',UNSUPPORTED:'غير مدعوم',NOT_CONNECTED:'غير متصل'};
function id(){return globalThis.crypto?.randomUUID?.()||'demo-'+Date.now()}
function Chip({children,warn=false}){return <span className={'mark'+(warn?' warning':'')}>{children}</span>}
function Note({children,warn=false}){return <div className={warn?'warning-line':'info-line'}>{children}</div>}
function Action({children,onClick,primary=false,disabled=false}){return <button type="button" onClick={onClick} disabled={disabled} className={primary?'primary':'secondary'}>{children}</button>}
function Field({label,children}){return <label className="field">{label}{children}</label>}
function Panel({title,children}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function StateRow({label,value}){return <div className="row"><small>{label}</small><span className="value">{value}</span></div>}
function Stat({label,value,foot}){return <div className="stat"><label>{label}</label><strong>{value}</strong><small>{foot||'بيانات توضيحية'}</small></div>}
function Sect({title,children}){return <section className="section"><h2>{title}</h2>{children}</section>}
const isManaged=(role)=>role==='enterprise';
const visibleDevices=role=>fixtures.devices.filter(x=>x.owner===role);
const shortSubflows=prefix=>subflows.filter(x=>x.parent===prefix);
function PublicSite({go}){
 return <>
 <div className="hero"><div><div className="eyebrow">BOB SECURITY • ACTIVE DEFENSE</div><h1>اعرف الحالة.<br/>تحرك ضمن الصلاحية.<br/><span className="accent">واحتفظ بالدليل.</span></h1><p>منظومة أندرويد واحدة تجمع التطبيق والحماية والاسترداد والحساب والأدلة ولوحات الويب. الوظائف تتدرج بحسب التفعيل الحقيقي، وليس مجرد عرضها.</p><div className="actions"><Action primary onClick={()=>go('M-10','owner')}>شاهد تطبيق الهاتف</Action><Action onClick={()=>go('D-01','owner')}>لوحة المستخدم</Action></div></div><img src="./logo.jpeg" alt="الشعار المعتمد لـ BOB Security"/></div>
 <Sect title="مسارات المنتج"><div className="grid three">
 <Panel title="BOB Public"><p>حساب موحد، حالة الهاتف، العثور المسموح، التنبيه الأساسي والدعم.</p><Chip>تحديث Public</Chip></Panel>
 <Panel title="Guard Personal"><p>ترقية داخل نفس الحساب، حماية واسترداد فردي وأوضاع وتقارير تخضع للاستحقاق والقدرة.</p><Chip warn>بوابات التشغيل مغلقة</Chip></Panel>
 <Panel title="Guard Managed"><p>إدارة مؤسسية على الأجهزة الرسمية المؤهلة فقط، بعقد وصلاحيات وسياسات AMAPI.</p><Chip warn>بوابة AMAPI لم تُغلق</Chip></Panel>
 </div></Sect>
 <Sect title="كيف تعمل المنظومة؟"><div className="grid four">{['حساب وجهاز معروفان','فحص فعلي للصلاحية','أمر مخول دون تحايل','نتيجة مثبتة أو غير مؤكدة'].map((s,i)=><div className="feature" key={s}><div className="eyebrow">0{i+1}</div><h3>{s}</h3><small>المسار مؤجل لحين إثبات القدرة وتشغيل التكامل.</small></div>)}</div></Sect>
 <Sect title="الخصوصية أولًا"><Note>لا مراقبة خفية للأفراد، ولا صلاحيات مؤسسية تُمنح بمجرد الاشتراك. الأسرة تُدار للمقاعد والعضوية والفواتير فقط؛ التقارير والأجهزة تخص أصحابها.</Note></Sect>
 </>;
}
function Dashboard({role,go}){
 const devices=visibleDevices(role);
 return <>
 <div className="grid four">
 <Stat label="أجهزة نطاقك" value={devices.length} foot="معرّفات وهمية"/>
 <Stat label="أجهزة متصلة" value={devices.filter(x=>x.connection.includes('متصل في')).length}/>
 <Stat label="نتائج تنفيذ مثبتة" value="0" foot="لا اتصال بجهاز فعلي"/>
 <Stat label="قاعدة البيانات" value="—" foot="لم تُربط بعد"/>
 </div>
 <Sect title="حالتك التشغيلية"><div className="grid two"><Panel title="أجهزتي">{devices.map(x=><div className="row" key={x.id}><div><strong>{x.name}</strong><small style={{display:'block'}}>{x.system}</small></div><Chip>{x.connection}</Chip></div>)}</Panel>
 <Panel title="مركز القرار"><StateRow label="Security Mode" value="DEMO / NOT_VERIFIED"/><StateRow label="Capability Preflight" value="مطلوب"/><StateRow label="Execution Recheck" value="على الهاتف عند التنفيذ"/><StateRow label="النتائج" value="RESULT_UNCONFIRMED"/><div className="actions"><Action onClick={()=>go('D-03')}>مركز الأوامر</Action><Action onClick={()=>go('E-06')}>الأدلة</Action></div></Panel></div></Sect>
 </>;
}
function CommandCenter({role}){
 const devices=visibleDevices(role);
 const [target,setTarget]=useState(devices[0]?.id||'');
 const [action,setAction]=useState('STATUS_REFRESH');
 const [decision,setDecision]=useState(null);
 const [log,setLog]=useState([]);
 const [when,setWhen]=useState(Date.now());
 const validDevice=devices.find(x=>x.id===target);
 const allowedActions={STATUS_REFRESH:'تحديث حالة تجريبي',ALERT_TEST:'تنبيه تجريبي',RECOVERY_START:'طلب بدء الاسترداد — محاكاة'};
 const check=()=>{
  if(!validDevice)return {ok:false,reason:'TARGET_NOT_AUTHORIZED'};
  if(!Object.keys(allowedActions).includes(action))return {ok:false,reason:'NOT_ALLOWLISTED'};
  if(action==='RECOVERY_START'&&role!=='owner')return {ok:false,reason:'ENTITLEMENT_MISSING'};
  if(validDevice.connection!=='متصل في المحاكاة')return {ok:false,reason:'DEVICE_OFFLINE'};
  if(Date.now()-when>60000)return {ok:false,reason:'CAPABILITY_STALE'};
  return {ok:true,reason:'PREFLIGHT_PASS_DEMO_ONLY'};
 };
 const run=()=>{const result=check();setDecision(result);if(!result.ok)return;setLog(x=>[{id:id(),target,action,status:'RESULT_UNCONFIRMED',demo:true},...x])};
 return <><Note warn>هنا لا تُرسل أوامر حقيقية. الزر المتاح لا يثبت قدرة Android. يجب التحقق الخادمي ثم إعادة الفحص داخل الهاتف قبل الأثر.</Note>
 <div className="grid two section"><Panel title="طلب أمر مخول ـ محاكاة"><div className="form">
 <Field label="الجهاز الهدف"><select value={target} onChange={e=>{setTarget(e.target.value);setDecision(null)}}>{devices.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
 <Field label="الأمر التجريبي"><select value={action} onChange={e=>{setAction(e.target.value);setDecision(null)}}>{Object.entries(allowedActions).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></Field>
 <div className="actions"><Action onClick={()=>{setWhen(Date.now());setDecision({ok:false,reason:'تم تحديث نموذج الفحص فقط'})}}>تحديث الفحص الوهمي</Action><Action onClick={()=>setDecision(check())}>Capability Preflight</Action><Action primary onClick={run} disabled={!target}>تسجيل محاكاة</Action></div>
 {decision&&<Note warn={!decision.ok}>{decision.reason}{decision.ok?' — لا يوجد تنفيذ فعلي':''}</Note>}</div></Panel>
 <Panel title="سلسلة الأمر"><StateRow label="التحقق من الهوية" value="بيانات وهمية"/><StateRow label="التفويض والهدف" value="Demo only"/><StateRow label="Idempotency / Audit" value="عقد غير متصل"/><StateRow label="إعادة فحص Android" value="لم تتم"/><StateRow label="دليل التنفيذ" value="غير متاح"/></Panel></div>
 <Sect title="السجل التجريبي"><div className="list">{log.length?log.map(x=><div className="entry" key={x.id}><strong>{x.action}</strong><div className="row"><small>{x.target}</small><Chip warn>{x.status}</Chip></div></div>):<Note>لم تُسجل محاكاة بعد.</Note>}</div></Sect>
 </>;
}
function Family(){
 return <><Note warn>الباقة العائلية داخل Guard Personal، وللبالغين فقط. سياسة السوق CFG-AGE-002 غير مهيأة، لذا الدعوات محظورة الآن؛ ولا يمكن عرض حالة هاتف أي عضو آخر.</Note>
 <div className="grid three section"><Stat label="مقاعد الباقة" value="5"/><Stat label="مقاعد مستخدمة" value="2"/><Stat label="أجهزة الآخرين المتاحة" value="0" foot="ممنوعة أصلًا"/></div>
 <Sect title="إدارة العضويات"><Panel title="عضويات نموذجية"><StateRow label="مالك الاشتراك" value="حساب تجريبي"/><StateRow label="عضو بالغ" value="عضوية فقط"/><StateRow label="إرسال دعوات جديدة" value={<Chip warn>مقفول حتى اعتماد الأهلية</Chip>}/><div className="actions"><Action disabled>دعوة عضو</Action><Action disabled>إزالة عضو</Action><Action disabled>إعادة إرسال دعوة</Action></div></Panel></Sect>
 </>;
}
function Enterprise({go}){
 const [policies,setPolicies]=useState([{name:'سياسة أساسية',status:'DRAFT_NOT_APPLIED'}]);
 const [name,setName]=useState('');
 return <><Note warn>هذه واجهة Managed تجريبية فقط. التفعيل والملفات المسجلة وأوامر AMAPI والمسح غير متاحة قبل EXT-AMAPI-001/002 وعقد العميل وحصة الأجهزة وإثبات القدرة.</Note>
 <div className="grid four section"><Stat label="أجهزة وهمية" value="1"/><Stat label="سياسات مسودة" value={policies.length}/><Stat label="تفعيل AMAPI" value="معطل"/><Stat label="أوامر إنتاج" value="0"/></div>
 <div className="grid two section"><Panel title="الأجهزة المستهدفة">{fixtures.devices.filter(x=>x.owner==='enterprise').map(x=><div className="entry" key={x.id}><strong>{x.name}</strong><small>{x.id} • Android Enterprise غير متصل</small></div>)}<div className="actions"><Action onClick={()=>go('M-23')}>معاينة إدارة الهاتف</Action></div></Panel>
 <Panel title="مسودة سياسة لا تُطبّق"><form className="form" onSubmit={e=>{e.preventDefault();if(name.trim().length<3)return;setPolicies(p=>[{name:name.trim(),status:'DRAFT_NOT_APPLIED'},...p]);setName('')}}><Field label="اسم المسودة"><input value={name} onChange={e=>setName(e.target.value)} minLength={3} maxLength={80} required placeholder="مثل: سياسة حماية الأجهزة"/></Field><button className="secondary">حفظ مسودة مؤقتة</button></form></Panel></div>
 <Sect title="السياسات"><div className="list">{policies.map((x,i)=><div className="entry" key={i}><div className="row"><strong>{x.name}</strong><Chip warn>{x.status}</Chip></div></div>)}</div></Sect>
 </>;
}
function Forensics(){
 return <div className="grid two"><Panel title="من الحادث إلى التقرير"><StateRow label="الموقع والخريطة" value="غير متصل"/><StateRow label="الخط الزمني" value="لا أدلة فعلية"/><StateRow label="SHA-256 / Manifest" value="لا ملف أصلي"/><StateRow label="رقم تحقق / QR" value="غير صادر"/><StateRow label="التوقيع القانوني" value="غير متصل"/><div className="actions"><Action disabled>إصدار رسمي</Action><Action disabled>تصدير الأدلة</Action></div></Panel><Panel title="معاينة غير رسمية"><Note warn>Preview/Issue/Export/Reissue إجراءات مستقلة. لا يمكن اعتبار تقرير بلا أدلة وبصمة وتوقيع/ختم عند اللزوم حجة فنية أو قضائية.</Note><div className="section"><Chip>NOT_SIGNED • NOT_ISSUED</Chip></div></Panel></div>;
}
function Account(){
 return <div className="grid two"><Panel title="حسابي وأجهزتي"><StateRow label="هوية الحساب" value="بيانات نموذجية"/><StateRow label="الاشتراك" value="غير متحقق"/><StateRow label="الفواتير" value="لا مزود دفع"/><StateRow label="استبدال الجهاز" value="يتطلب إعادة تفويض ومصدر الحقيقة"/><StateRow label="حذف الحساب" value="مسار منفصل عن مسح الهاتف"/></Panel><Panel title="حقوق صاحب البيانات"><Note warn>لا يمكن استقبال طلب حذف حساب حقيقي قبل وجود مصادقة وإبطال الجلسات وتسجيل الطلب وربط قواعد البيانات والمزودين.</Note><div className="actions"><Action disabled>تقديم طلب حذف فعلي</Action></div></Panel></div>;
}
function Support(){
 const [text,setText]=useState('');
 const [tickets,setTickets]=useState([]);
 return <div className="grid two"><Panel title="تذكرة دعم تجريبية"><form className="form" onSubmit={e=>{e.preventDefault();if(text.trim().length<5)return;setTickets(t=>[{id:id(),subject:text.trim(),state:'OPEN_DEMO'},...t]);setText('')}}><Field label="موضوع التذكرة"><input minLength={5} maxLength={120} required value={text} onChange={e=>setText(e.target.value)} placeholder="مشكلة تجريبية فقط"/></Field><button className="primary">إضافة تذكرة وهمية</button></form><div className="section list">{tickets.map(t=><div className="entry" key={t.id}><strong>{t.subject}</strong><small>{t.state}</small></div>)}</div></Panel><Panel title="الدعم بالذكاء الاصطناعي"><StateRow label="Support Orchestrator" value="PRODUCTION_GATED"/><StateRow label="Customer Service AI" value="غير متصل"/><StateRow label="Technical Support AI" value="غير متصل"/><StateRow label="Handoff to Human" value="عقد، لا إرسال فعلي"/><Note>المساعدة الآلية لا تملك أوامر أجهزة حساسة أو صلاحية تعديل حساب أو دفع.</Note></Panel></div>;
}
function Admin(){
 const [draft,setDraft]=useState(''); const [saved,setSaved]=useState([]);
 return <><div className="grid four"><Stat label="حسابات تجريبية" value="2"/><Stat label="سجلات فعلية" value="0"/><Stat label="فواتير فعلية" value="0"/><Stat label="صحة الإنتاج" value="غير متصل"/></div>
 <div className="grid two section"><Panel title="منشئ المحتوى / مسودات"><form className="form" onSubmit={e=>{e.preventDefault();if(draft.trim().length<3)return;setSaved(t=>[{id:id(),title:draft.trim()},...t]);setDraft('')}}><Field label="عنوان المسودة"><input minLength={3} maxLength={120} required value={draft} onChange={e=>setDraft(e.target.value)} placeholder="عنوان توضيحي"/></Field><button className="secondary">حفظ مسودة مؤقتة</button></form><div className="section list">{saved.map(x=><div className="entry" key={x.id}>{x.title} <Chip warn>NOT_PUBLISHED</Chip></div>)}</div></Panel><Panel title="فصل الواجبات"><StateRow label="المستخدمون" value="قائمة نموذجية"/><StateRow label="الأدوار والصلاحيات" value="غير مفعلة"/><StateRow label="المصادقة الإدارية" value="غير متصلة"/><StateRow label="العمولات والصرف" value="مغلق"/><StateRow label="الحارس السيبراني" value="DISABLED"/></Panel></div></>;
}
function Partners(){return <div className="grid two"><Panel title="العمولات والإسناد"><StateRow label="مصدر QR" value="لا يوجد فعلي"/><StateRow label="التحميل / التثبيت" value="ليس حدث استحقاق"/><StateRow label="بيع مؤهل" value="لا مزود متصل"/><StateRow label="عمولة مستحقة" value="0 فعليًا"/><StateRow label="الصرف" value="غير مفعّل"/></Panel><Panel title="قواعد الشريك"><Note warn>QR أو تثبيت التطبيق أو تجربة مجانية لا تثبت البيع. إنشاء العمولة يتطلب حدث شراء مؤهلًا ومراجعة واعتمادًا ماليًا مستقلًا.</Note></Panel></div>}
function MobilePreview({screen,go}){
 const family=screen==='M-22',managed=screen==='M-23',recovery=screen==='M-13';
 return <div className="two-col"><div><Note warn>هذا عرض تفاعلي لتجربة Flutter المزمعة داخل المتصفح، وليس APK ولا هاتفًا متصلًا.</Note><Sect title="عقود هذه الشاشة"><div className="list">{shortSubflows(screen).map(x=><div className="entry" key={x.id}><code>{x.id}</code><strong style={{display:'block'}}>{x.name}</strong><small>إنتاج مغلق حتى الاختبارات والبوابات</small></div>)}</div></Sect><div className="actions">{family?<Action onClick={()=>go('A-06','family')}>الباقة والفوترة</Action>:managed?<Action onClick={()=>go('EN-01','enterprise')}>لوحة المؤسسة</Action>:<Action onClick={()=>go('D-03','owner')}>مركز الأوامر</Action>}</div></div>
 <div className="phone"><div className="notch"/><div className="eyebrow">BOB SECURITY • FLUTTER CONTRACT</div><div className="sphere"><img src="./logo.jpeg" alt="شعار BOB"/></div><h2>{byId[screen]?.name||'BOB Mobile'}</h2><div className="section"><StateRow label="هوية الحساب" value="DEMO"/><StateRow label={managed?'المؤسسة':family?'المقاعد':'الجهاز'} value={managed?'مؤسسة وهمية':family?'2 / 5':'Android وهمي'}/><StateRow label="حالة الإنتاج" value={<Chip warn>مغلقة</Chip>}/></div><hr className="divider"/><div className="list">{(family?['العضوية','الدعوات محظورة','المقاعد','الفوترة']:managed?['الجرد','السياسات','التراخيص','الأوامر مغلقة']:recovery?['صور أمامية','صور خلفية','فيديو أمامي','فيديو خلفي','تسجيل صوت']:['الأمان','التأهب','الاسترداد','التقارير']).map(x=><div className="entry" key={x}><div className="row"><strong>{x}</strong><Chip warn>غير مفعل</Chip></div></div>)}</div></div>
 </div>;
}
function Catalog({go}){
 const [q,setQ]=useState(''); const [group,setGroup]=useState('all');
 const groups=[...new Set(screens.map(s=>s.group))];
 const filtered=useMemo(()=>screens.filter(s=>(group==='all'||s.group===group)&&(s.id+' '+s.name+' '+s.group).toLocaleLowerCase().includes(q.toLocaleLowerCase())),[group,q]);
 return <><div className="grid four"><Stat label="الشاشات الرئيسية" value={screens.length}/><Stat label="التدفقات الفرعية" value={subflows.length}/><Stat label="القدرات المخططة" value={capabilities.length}/><Stat label="بوابات الإنتاج" value="مغلقة"/></div>
 <Sect title="سجل الواجهات الحاكم"><div className="catalog-controls"><input aria-label="بحث الشاشات" placeholder="ابحث بالرمز أو اسم الشاشة" value={q} onChange={e=>setQ(e.target.value)}/><select aria-label="مجموعة الشاشات" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">كل المجموعات</option>{groups.map(g=><option value={g} key={g}>{g}</option>)}</select></div>
 <div className="grid three">{filtered.map(s=><button className="nav-button" key={s.id} onClick={()=>go(s.id)}><span><code>{s.id}</code> — {s.name}<small style={{display:'block'}}>عقد محفوظ • التنفيذ الكامل غير مكتمل</small></span><span>←</span></button>)}</div></Sect>
 <Sect title="القدرات الأربعون"><div className="grid three">{capabilities.map(c=><div className="entry" key={c.id}><div className="row"><code>{c.id}</code><Chip warn>NOT ENABLED</Chip></div><strong>{c.name}</strong><small>{c.scope}</small></div>)}</div></Sect></>;
}
function Generic({screen,go}){
 return <div className="grid two"><Panel title="عقد الشاشة"><StateRow label="المعرف الحاكم" value={<code>{screen.id}</code>}/><StateRow label="المجموعة" value={screen.group}/><StateRow label="الاسم المعتمد" value={screen.name}/><StateRow label="الحالة" value={<Chip warn>CONTRACT_ONLY / PRE-DB</Chip>}/><Note warn>هذه الشاشة مسجلة في المرجع، ولكن لم تُنفذ جميع أحداثها وعقود قبولها بعد. لا يعبر وجودها عن إتاحة إنتاجية.</Note></Panel><Panel title="التدفقات الفرعية">{shortSubflows(screen.id).length?shortSubflows(screen.id).map(s=><div className="entry" key={s.id}><code>{s.id}</code><strong style={{display:'block'}}>{s.name}</strong></div>):<p>لم يخصص لهذه الشاشة معرف Subflow حاكم في السجل.</p>}<div className="actions"><Action onClick={()=>go('CATALOG')}>سجل الشاشات بالكامل</Action></div></Panel></div>;
}
export function App(){
 const [role,setRole]=useState('public');
 const [route,setRoute]=useState(()=>decodeURIComponent(window.location.hash.replace('#',''))||'W-01');
 const [open,setOpen]=useState(false);
 useEffect(()=>{const f=()=>setRoute(decodeURIComponent(window.location.hash.replace('#',''))||'W-01');window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[]);
 const go=(id,nextRole)=>{if(nextRole)setRole(nextRole);setOpen(false);window.location.hash=id;setRoute(id);window.scrollTo({top:0,behavior:'instant'})};
 const chooseRole=value=>{setRole(value);go(roles[value].links[0])};
 const known=byId[route];const catalog=route==='CATALOG';
 const permitted=catalog||route==='W-01'||(known&&roles[role].links.includes(route));
 const title=catalog?'سجل المنظومة':known?.name||'BOB Security';
 function content(){
   if(!permitted)return <Panel title="صلاحيات العرض"><Note warn>هذه المساحة غير موجودة في دور المعاينة الحالي. تبديل الدور هنا تجربة واجهة وليس تسجيل دخول أو تفويضًا فعليًا.</Note><div className="actions"><Action onClick={()=>go(roles[role].links[0])}>العودة إلى مساحة الدور</Action></div></Panel>;
   if(catalog)return <Catalog go={go}/>;
   if(route==='W-01')return <PublicSite go={go}/>;
   if(['D-01','D-04','D-05','D-12','A-03'].includes(route))return <Dashboard role={role} go={go}/>;
   if(route==='D-03')return <CommandCenter key={role} role={role}/>;
   if(route==='M-22')return <Family/>;
   if(['EN-01','EN-02','EN-03'].includes(route))return <Enterprise go={go}/>;
   if(['M-10','M-13','M-23'].includes(route))return <MobilePreview screen={route} go={go}/>;
   if(route==='E-06')return <Forensics/>;
   if(['A-01','A-06','A-07','W-08'].includes(route))return <Account/>;
   if(['S-01','S-03','S-04','S-06','S-07','S-08','W-06'].includes(route))return <Support/>;
   if(route.startsWith('AD-'))return <Admin/>;
   if(route.startsWith('P-'))return <Partners/>;
   return <Generic screen={known} go={go}/>;
 }
 return <>
 <header className="head"><a href="#W-01" onClick={e=>{e.preventDefault();go('W-01')}} className="logo"><img src="./logo.jpeg" alt="شعار BOB Security"/><div><strong>BOB</strong><small>SECURITY</small></div></a><nav className="toplinks"><a href="#W-01" onClick={e=>{e.preventDefault();go('W-01')}}>الرئيسية</a><a href="#CATALOG" onClick={e=>{e.preventDefault();go('CATALOG')}}>خريطة المنظومة</a><a href="#M-10" onClick={e=>{e.preventDefault();go('M-10','owner')}}>معاينة الموبايل</a></nav><aside><Chip warn>PRE-DB • DEMO</Chip><select style={{maxWidth:176}} aria-label="دور العرض التجريبي" value={role} onChange={e=>chooseRole(e.target.value)}>{Object.entries(roles).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select><button className="secondary mobilemenu" aria-label="فتح القائمة" onClick={()=>setOpen(!open)}>☰</button></aside></header>
 <div className="portal"><aside className={'rail'+(open?' open':'')} aria-label="شاشات الدور"><small>مساحة: {roles[role].name}</small><div className="segment">الشاشات الرئيسية</div>{roles[role].links.map(k=><button className={'nav-button'+(route===k?' selected':'')} onClick={()=>go(k)} key={k}><span><code>{k}</code> {byId[k]?.name}</span><span>←</span></button>)}<div className="segment">تتبع المرجع</div><button className="nav-button" onClick={()=>go('CATALOG')}>104 شاشة / 35 تدفق / 40 قدرة ←</button><div className="section"><Note warn>لا يوجد توصيل فعلي بقواعد البيانات أو الأجهزة أو المدفوعات.</Note></div></aside>
 <main className="page"><div className="eyebrow">{catalog?'REGISTER':route} / BOB 4.0</div>{route!=='W-01'&&<><h1>{title}</h1><p className="subheading">مبنية على المرجع OWNER APPROVED FROZEN. جميع البيانات المُعروضة وهمية، وحدود الإنتاج مغلقة لحين إتمام التحقق.</p></>}{content()}<div className="footer">BOB Security • المرجع المعتمد BOB 4.0 • نسخة تطوير React • MySQL/Redis غير متصلين • Android غير متصل</div></main></div>
 </>;
}