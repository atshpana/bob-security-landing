# BOB 4.0 — حدود التسليم لكودكس: قواعد البيانات والنشر
## القرار المعتمد
كل البرمجة والمراجعة والاختبارات في فرع feature/bob-platform-pre-db-20261115، دون دمج أو نشر أو ربط قاعدة إنتاجية. كودكس مسؤول لاحقًا عن توصيل قاعدة البيانات، الأسرار، الدومين، وبناء الإصدار وتوزيعه بعد اكتمال الشيفرة والتحقق.
## مصدر الحقيقة
BOB_4_0_OWNER_APPROVED_FROZEN.docx وملفات CORE 6 R2 المعتمدة. لا تتعامل مع هذه الوثيقة بديلًا عن المرجع الأم.
## متطلبات قبل قبول handoff
1. تتبع 104 شاشات و35 تدفقًا فرعيًا مقابل سجلات الشاشات، مع دليل تشغيل واختبار لكل شاشة. مجرد وجود الاسم ليس تنفيذًا.
2. تطبيق Android أصلي بمسارات M-01..M-23 وواجهات Public/Guard Personal/Guard Managed حسب الدور والاستحقاق والقدرة؛ عدم اعتبار Android Enterprise متاحًا لمجرد تثبيت التطبيق.
3. واجهات ويب W وEN وAD وS والأدوار والبوابات التجارية وفق مرجع الشاشة والإطلاق؛ فصل الأسرة عن المؤسسة.
4. العقود HTTP/OpenAPI موثقة، DTO والتحقق من المدخلات، authn/authz، idempotency، audit، error codes، migrations، seeds اختبارات؛ لا أسرار في المستودع.
5. لكل أمر حساس preflight خادمي ثم recheck على الجهاز وقت التنفيذ، وتسجيل السبب والنتيجة؛ UNKNOWN/UNSUPPORTED/DEGRADED/NONCOMPLIANT عند تعذر الإثبات.
6. الأسرة للبالغين 18+، عضوية ومقاعد ودعوات وفوترة فقط؛ ممنوع مراقبة جهاز أو موقع عضو آخر أو تنفيذ أوامر عليه.
7. M-23 مؤسسة موثقة بعقد ودور وجهاز مؤهل، AMAPI وإدارة Android Enterprise عبر القنوات الرسمية فقط، فصل enterpriseId عن familyId.
8. حذف الحساب M-21.DELETE وW-08.DELETE مع إعادة تحقق، إبطال الجلسات، رقم طلب، الحالة والموعد؛ لا يعني مسح الهاتف.
9. Play Billing للأهلية ذات الصلة، سياسات الخصوصية، صلاحيات أقل قدر، إشعارات واضحة، اختبارات Play Console، اختبارات أجهزة حقيقية.
10. لا ادعاء بوجود حماية/استرداد/فحص أمني حقيقي قبل اختبار الجهاز والشبكة والخادم وGoogle Play.
## واجهة الربط المتوقعة (عقود لا تنفيذ إنتاجي)
- Identity: users, sessions, devices, device_capabilities, consents, entitlements.
- Security: incidents, incident_events, evidence, commands, command_preflights, command_executions, audit_events.
- Family: family_groups, family_memberships, invitations, seats, billing_links (no member device access).
- Enterprise: organizations, contracts, managed_enrollments, roles, policies, compliance, managed_commands.
- Operations: tickets, staff_roles, access_reviews, privacy_requests, subscriptions, payment_events.
- تفعيل RLS/authorization داخل الخدمة وعلى مستوى البيانات حيث ينطبق؛ tenant isolation.
## الاختبار والبوابات
- Unit + contract + integration with ephemeral test DB + device/emulator + Android Enterprise test enrollment + accessibility + privacy + penetration + billing sandbox.
- اختبارات رفض الأوامر دون موافقة/استحقاق/قدرة/إعادة مصادقة، وعدم تسرب بيانات بين المؤسسات.
- CI نجاح البناء وحده ليس قبولًا للإطلاق.
## حالة التنفيذ الحالية
تطبيق Kotlin الأولي يحتوي واجهات M-10..M-23 فقط ويعرض حالات غير متصلة؛ ليس تطبيقًا كاملًا. لا توجد شهادة اختبار APK أو اختبارات أجهزة حقيقية أو ربط قاعدة بيانات. يلزم استكمالها قبل تسليم الربط لكودكس.
