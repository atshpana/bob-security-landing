package com.bobsecurity.preview

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Native, offline, non-production BOB 4.0 preview.
 * No device-admin, location, camera, audio, SMS or accessibility privileges.
 * No real commands, no user data, no database.
 */
class MainActivity : Activity() {
 private lateinit var root: LinearLayout
 private var page = "M-10"
 private val pages = linkedMapOf(
  "M-10" to "لوحة الحماية الشخصية",
  "M-11" to "الحماية الطبيعية",
  "M-12" to "الاستعداد للتنبيه",
  "M-13" to "وضع الاسترداد",
  "M-14" to "الحماية السلبية",
  "M-15" to "فحص حالة الحماية",
  "M-16" to "نتيجة الفحص",
  "M-17" to "الاتصال بالخادم والأوامر",
  "M-18" to "الاشتراك والتجربة",
  "M-19" to "قفل واجهة BOB",
  "M-20" to "العمل في الخلفية",
  "M-21" to "الخصوصية والموافقات",
  "M-22" to "إدارة عضوية الأسرة",
  "M-23" to "إدارة المؤسسة"
 )
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); showPage() }
 private fun text(value: String, size: Float = 16f, bold: Boolean = false): TextView {
  return TextView(this).apply { text = value; textSize = size; setTextColor(Color.rgb(228,242,248)); gravity = Gravity.RIGHT; setPadding(14,13,14,13); if (bold) setTypeface(null,Typeface.BOLD) }
 }
 private fun line(value: String) { root.addView(text(value)) }
 private fun button(value: String, action: () -> Unit) {
  root.addView(Button(this).apply { text = value; setOnClickListener { action() } })
 }
 private fun showPage() {
  root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(18,18,18,32); setBackgroundColor(Color.rgb(8,19,37)) }
  val scroll = ScrollView(this); scroll.addView(root); setContentView(scroll)
  root.addView(text("BOB SECURITY • ANDROID PREVIEW",19f,true))
  line("تجربة محلية غير متصلة — لا تنفيذ لأوامر حقيقية ولا قاعدة بيانات")
  root.addView(text("${pages[page]} ($page)",24f,true))
  when(page) {
   "M-10" -> { line("◇ درع BOB | حالة الحماية: UNKNOWN"); line("صلاحيات الجهاز: لم تُفحص بعد"); line("الاتصال: لا يوجد خادم متصل"); line("الأوامر السريعة: غير مفعلة قبل التحقق من القدرة والتفويض") }
   "M-11" -> line("NORMAL غير مثبت: يلزم فحص القدرة والصلاحيات قبل إثبات الحالة.")
   "M-12" -> line("حالة التنبيه غير مفعلة في النسخة التجريبية.")
   "M-13" -> { line("وضع الاسترداد: غير متصل"); line("الصور الأمامية | غير متاح");line("الصور الخلفية | غير متاح");line("الفيديو الأمامي | غير متاح");line("الفيديو الخلفي | غير متاح");line("التسجيل الصوتي | غير متاح");line("كل قدرة تتطلب فحصًا جديدًا على الجهاز وموافقة صحيحة؛ لا تنفيذ عن بعد.") }
   "M-14" -> line("الحماية السلبية ليست حالة اشتراك؛ تشغيلها يحتاج قدرات فعلية.")
   "M-15" -> { line("فحص محدود: إصدار Android ${android.os.Build.VERSION.RELEASE}");line("فحص الأذونات والاتصال وPlay Integrity غير متصل في هذه النسخة.");button("عرض نتيجة الفحص") { page="M-16";showPage() } }
   "M-16" -> line("UNKNOWN / DEGRADED — لا دليل على اكتمال الفحص. لا يمكن الجزم بأن الهاتف خالٍ من التهديدات.")
   "M-17" -> line("Cloud: NOT_CONNECTED | Commands: DISABLED | نتيجة تنفيذ: غير مؤكدة")
   "M-18" -> line("Public / Guard Personal / Guard Managed — حالة الاستحقاق غير متاحة دون خادم.")
   "M-19" -> line("قفل واجهة BOB فقط، وليس قفل نظام Android. المصادقة الحقيقية غير مفعلة.")
   "M-20" -> line("لم يتم تفعيل أي خدمة خلفية أو طلب استثناءات بطارية.")
   "M-21" -> { line("الموافقة على جمع البيانات: غير ممنوحة");line("حذف الحساب: يتطلب تسجيل الدخول وإعادة التحقق وخادمًا موثوقًا؛ لا يوجد حساب حقيقي في هذه النسخة.") }
   "M-22" -> { line("سياق الأسرة: العضوية والدعوات والمقاعد والفوترة فقط.");line("لا عرض لموقع أو جهاز أو تنبيهات أو تقارير عضو بالغ آخر. لا أوامر جهاز.");line("إجراءات الدعوات والإزالة تتطلب تفويضًا خادميًا ومراجعة الهدف.") }
   "M-23" -> { line("سياق المؤسسة: لا مؤسسة موثقة أو دور فعال.");line("الأجهزة والسياسات وLost Mode والأوامر تتطلب عقدًا وصلاحية وتفويضًا خادميًا.");line("الأوامر الحساسة تتطلب مراجعة الهدف وإعادة مصادقة؛ التنفيذ معطل.") }
  }
  line("—— شاشات الهاتف وفق المرجع الأم ——")
  pages.forEach { (id,title) -> button("$id • $title") { page=id;showPage() } }
 }
}
