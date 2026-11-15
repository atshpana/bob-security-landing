// BOB 4.0 §21.44.1 — mobile registry. Catalogued, not all implemented.
const mobileScreens=<String,String>{
  'M-01':'بدء التشغيل الآمن',
  'M-02':'تسجيل الدخول',
  'M-03':'الإعداد / التسجيل',
  'M-04':'فحص قدرات الجهاز وسلامته',
  'M-05':'حالة SIM/eSIM والإرشاد',
  'M-06':'بدء التجربة / ربط الدفع',
  'M-07':'إقرار المستخدم وتأكيد العملية',
  'M-08':'الأمان الأساسي والصلاحيات',
  'M-09':'التحقق برمز لمرة واحدة',
  'M-10':'لوحة الهاتف الرئيسية',
  'M-11':'الحماية الطبيعية',
  'M-12':'وضع التأهب',
  'M-13':'وضع الاسترداد',
  'M-14':'الحماية السلبية',
  'M-15':'فحص الأمان قيد التشغيل',
  'M-16':'نتيجة فحص الأمان',
  'M-17':'اتصال السحابة / الأوامر',
  'M-18':'حالة التجربة / الاشتراك',
  'M-19':'قفل الوصول إلى التطبيق',
  'M-20':'استمرارية العمل في الخلفية',
  'M-21':'الخصوصية والموافقة',
  'M-22':'لوحة الأسرة: العضوية والدعوات والمقاعد والاستحقاق والفوترة وحقوق الانسحاب',
  'M-23':'لوحة الإدارة المؤسسية المحمولة',
};
const sensoryRecoveryActions=<String,String>{
'M-13.MPF':'3 صور أمامية','M-13.MPR':'3 صور خلفية','M-13.MVF':'20 ثانية فيديو أمامي','M-13.MVR':'20 ثانية فيديو خلفي','M-13.MA20':'20 ثانية تسجيل صوت'};

enum BobRole { personal, family, enterprise }
class BobPermissionRules {
  static const bool databaseConnected=false;
  static const bool realDeviceExecution=false;
  static const bool amapiEnabled=false;
  static const bool familyInvitesEnabled=false; // CFG-AGE-002 absent
  static bool mayViewOtherAdultDevice(BobRole role)=>false;
}
