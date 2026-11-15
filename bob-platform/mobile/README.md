# BOB Security Android — تطبيق Flutter + Kotlin

**المرجع المعتمد:** BOB 4.0 §§2.4، 3، 4، 9، 21.22، 22.1، 29.3.

## الموجود الآن
- واجهة عربية Flutter RTL للمعاينة، بدء الدخول التجريبي، لوحة الهاتف `M-10`، الاسترداد `M-13` بخمسة عقود حسية منفصلة وغير مفعّلة، الأسرة `M-22`، المؤسسة `M-23`، الخصوصية `M-21`، وعرض عقود بقية شاشات M01–M23.
- Kotlin MethodChannel لفحص `SDK_INT` فقط دون تشغيل كاميرا/ميكروفون/موقع.
- واجهة مهيأة لمدى 320dp+ بدون تمرير أفقي متعمد.
- نفس منتج BOB ومسارات `Production Base → Public → Personal → Managed`.

## التشغيل
1. ثبّت Flutter SDK وAndroid SDK.
2. داخل `bob-platform/mobile` نفذ `flutter create --platforms android --org com.bob --project-name bob_security .` لاستكمال ملفات Gradle وملفات المنصة القياسية، مع **عدم الكتابة فوق** ملفات Kotlin في المستودع.
3. تحقق أن `MainActivity.kt` يستدعي `BobCapabilityBridge.install`.
4. اضبط `minSdk=30` وفق CFG-PLAT-001 في `android/app/build.gradle.kts`؛ تحقق من targetSdk وفق أحدث سياسة قبل الإصدار.
5. نفذ `flutter pub get`، ثم `flutter test`، ثم `flutter run`.

## غير مكتمل
لا APK موقع، لا تسجيل دخول أو MySQL/Redis أو Android Device Policy أو AMAPI، ولا Firebase أو دفع Play ولا إصدار تقرير رسمي أو تنفيذ أجهزة. `RECEIVE_SMS` غير موجود في الحزمة العامة. لا تمكين حساسات قبل PoC والتفويض وExecution Recheck.

**الهوية:** شِعار BOB الأصلي محفوظ كأصل من الفرع؛ خطا Noto Sans Arabic وInter المعتمدان يحتاجان ملفات الأصول الرسمية للتضمين النهائي.
