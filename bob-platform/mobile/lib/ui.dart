import 'package:flutter/material.dart';
import 'contracts.dart';
import 'capability_bridge.dart';

const navy=Color(0xFF061927), black=Color(0xFF04060B);
const petrol=Color(0xFF08374D), turq=Color(0xFF2C8DA0);
const cyan=Color(0xFF6BD7E3), mint=Color(0xFFDFF0EB);
const muted=Color(0xFFC2CDCC), gold=Color(0xFFEBDCAB);

class BobSecurityApp extends StatelessWidget{
 const BobSecurityApp({super.key});
 @override Widget build(BuildContext context)=>MaterialApp(
  debugShowCheckedModeBanner:false,
  title:'BOB Security',
  theme:ThemeData(
   useMaterial3:true,brightness:Brightness.dark,
   scaffoldBackgroundColor:navy,
   colorScheme:ColorScheme.fromSeed(seedColor:turq,brightness:Brightness.dark),
   appBarTheme:const AppBarTheme(backgroundColor:navy,foregroundColor:mint),
   inputDecorationTheme:const InputDecorationTheme(filled:true,fillColor:petrol)),
  home:const Directionality(textDirection:TextDirection.rtl,child:BobHome()),
 );
}
class BobHome extends StatefulWidget{
 const BobHome({super.key});
 @override State<BobHome> createState()=>_BobHomeState();
}
class _BobHomeState extends State<BobHome>{
 bool entered=false;
 BobRole role=BobRole.personal;
 String page='M-10';
 Map<String,Object?>? platformSnapshot;
 @override void initState(){super.initState();readPlatform();}
 Future<void> readPlatform() async{
   final result=await BobAndroidProbe.snapshot();
   if(mounted)setState(()=>platformSnapshot=result);
 }
 void open(String id){setState(()=>page=id);Navigator.of(context).maybePop();}
 Widget chip(String value)=>Container(
  padding:const EdgeInsets.symmetric(horizontal:10,vertical:5),
  decoration:BoxDecoration(border:Border.all(color:turq),borderRadius:BorderRadius.circular(40),color:petrol),
  child:Text(value,style:const TextStyle(color:mint,fontSize:11)));
 Widget warning(String message)=>Container(
  padding:const EdgeInsets.all(13),
  width:double.infinity,
  decoration:BoxDecoration(color:const Color(0xFF342C1D),border:Border.all(color:gold),borderRadius:BorderRadius.circular(11)),
  child:Text(message,style:const TextStyle(color:mint,fontSize:13,height:1.55)));
 Widget infoCard(String title,String text,{IconData icon=Icons.shield_outlined})=>Card(
   color:petrol,margin:const EdgeInsets.only(bottom:10),
   shape:RoundedRectangleBorder(borderRadius:BorderRadius.circular(14)),
   child:Padding(padding:const EdgeInsets.all(14),child:Row(
    crossAxisAlignment:CrossAxisAlignment.start,children:[
     Icon(icon,color:cyan,size:27),const SizedBox(width:12),
     Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
       Text(title,style:const TextStyle(fontSize:15,fontWeight:FontWeight.bold)),
       const SizedBox(height:5),
       Text(text,style:const TextStyle(color:muted,fontSize:13,height:1.5))
     ]))
   ])));
 Widget disabled(String text)=>Padding(padding:const EdgeInsets.symmetric(vertical:5),
   child:SizedBox(width:double.infinity,child:OutlinedButton.icon(
    icon:const Icon(Icons.lock_outline),onPressed:null,label:Text(text))));
 Widget welcome()=>Center(child:SingleChildScrollView(
  padding:const EdgeInsets.all(24),
  child:ConstrainedBox(constraints:const BoxConstraints(maxWidth:430),
   child:Column(mainAxisSize:MainAxisSize.min,children:[
    Container(width:112,height:112,decoration:BoxDecoration(
      gradient:const LinearGradient(colors:[turq,petrol]),borderRadius:BorderRadius.circular(27)),
      child:Image.asset('assets/bob_logo.jpeg',fit:BoxFit.contain)),
    const SizedBox(height:20),
    const Text('BOB Security',style:TextStyle(fontSize:26,fontWeight:FontWeight.w900)),
    const SizedBox(height:8),
    const Text('الدفاع النشط ضمن حدود أندرويد الرسمية',textAlign:TextAlign.center,
      style:TextStyle(color:muted,fontSize:14)),
    const SizedBox(height:24),
    warning('M-02: شاشة دخول تجريبية فقط. لا توجد هوية إنتاجية أو اتصال بقاعدة بيانات. لا تدخل معلومات شخصية.'),
    const SizedBox(height:18),
    SizedBox(width:double.infinity,child:FilledButton(
      onPressed:()=>setState(()=>entered=true),
      child:const Text('فتح نسخة المعاينة'))),
    const SizedBox(height:10),const Text('لا تنفذ هذه النسخة أي إجراء على جهازك',style:TextStyle(color:muted,fontSize:12))
   ]))));
 Widget drawer()=>Drawer(backgroundColor:navy,child:SafeArea(
  child:ListView(children:[
   const ListTile(title:Text('BOB Security',style:TextStyle(fontWeight:FontWeight.bold)),
     subtitle:Text('سجل 23 شاشة لتطبيق أندرويد')),
   const Divider(),
   for(final entry in mobileScreens.entries)
     ListTile(
       dense:true,selected:page==entry.key,
       title:Text(entry.key+' • '+entry.value,maxLines:2,overflow:TextOverflow.ellipsis),
       onTap:()=>open(entry.key)),
   const Divider(),
   ListTile(title:const Text('إنهاء المعاينة'),onTap:()=>setState(()=>entered=false))
  ])));
 Widget dashboard()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('هذا تطبيق Flutter قيد التطوير: البيانات افتراضية والحماية الحقيقية لم تُفعّل.'),
  const SizedBox(height:13),
  Container(padding:const EdgeInsets.all(27),
   decoration:BoxDecoration(borderRadius:BorderRadius.circular(22),color:petrol,border:Border.all(color:turq)),
   child:Column(children:[
     const Icon(Icons.shield_outlined,size:80,color:cyan),
     const SizedBox(height:9),
     const Text('حالة BOB',style:TextStyle(fontWeight:FontWeight.bold,fontSize:20)),
     const SizedBox(height:9),chip('UNKNOWN • DEMO'),
     const SizedBox(height:12),
     const Text('لم تُفحص حماية الهاتف الفعلية بعد',textAlign:TextAlign.center,style:TextStyle(color:muted))
   ])),
  const SizedBox(height:12),
  infoCard('الأمان الطبيعي','حماية الحساب والتطبيق والاتصال عندما تصبح الأدلة متاحة.',icon:Icons.verified_user_outlined),
  infoCard('التأهب','يعمل ضمن شروط الحدث والتصعيد المصرح بها.',icon:Icons.notifications_active_outlined),
  infoCard('الاسترداد','لا يتيح تنفيذًا بلا إذن ودليل وقدرة متحققة.',icon:Icons.location_searching_outlined),
  Row(children:[
   Expanded(child:OutlinedButton(onPressed:()=>setState(()=>page='M-11'),child:const Text('الأمان'))),
   const SizedBox(width:8),
   Expanded(child:OutlinedButton(onPressed:()=>setState(()=>page='M-13'),child:const Text('الاسترداد')))
  ])
 ]);
 Widget recovery()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('M-13: أوامر الحساسات الخمسة مستقلة ومقفولة. لا كاميرا، لا ميكروفون، ولا أوامر تنفيذية في هذه النسخة.'),
  const SizedBox(height:12),
  infoCard('دورة الاستجابة','تفويض + جهاز معروف + استحقاق + فحص حديث + إعادة فحص على Android + دليل نتيجة.'),
  const Padding(padding:EdgeInsets.symmetric(vertical:12),child:Text(
     'العقود الحسية المستقلة F-036',style:TextStyle(fontSize:17,fontWeight:FontWeight.bold))),
  for(final entry in sensoryRecoveryActions.entries)
   Card(color:petrol,child:ListTile(
     leading:const Icon(Icons.block,color:muted),
     title:Text(entry.value),
     subtitle:Text(entry.key+' • SENSOR_NOT_ARMED'),
     trailing:const Icon(Icons.lock_outline,color:gold))),
  const SizedBox(height:7),chip('RESULT_UNCONFIRMED • لا يوجد دليل')
 ]);
 Widget family()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('M-22: إدارة الأسرة تعني العضوية والمقاعد والاستحقاق والفوترة فقط. مراقبة بالغ آخر محظورة حتى داخل الأسرة.'),
  const SizedBox(height:12),
  infoCard('العضوية','عضوان بالغان توضيحيان. لا تُعرض أجهزة الآخرين أو مواقعهم.'),
  infoCard('المقاعد','2 من 5، مجرد بيانات وهمية.'),
  infoCard('أهلية العمر','CFG-AGE-002 غير مهيأة؛ دعوات الأسرة مغلقة.'),
  disabled('إرسال دعوة'),disabled('إزالة عضو'),disabled('إدارة الفوترة')
 ]);
 Widget enterprise()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('M-23: الواجهة المؤسسية لا تُتاح فعليًا إلا بعقد ودور مؤسسي موثق وجهاز Managed. هذه محاكاة.'),
  const SizedBox(height:12),
  infoCard('المؤسسة التجريبية','مؤسسة واحدة وجهاز وهمي، بلا Android Management API.'),
  infoCard('السياسات والأجهزة','العقود مع EN-01..EN-03 موحدة، ولا تتيح صلاحيات إضافية على الهاتف.'),
  infoCard('بوابة الإنتاج','EXT-AMAPI-001/002 + عقد مباشر + حصة معتمدة + فحص قدرة.'),
  disabled('تطبيق سياسة'),disabled('تفعيل Lost Mode'),disabled('المسح الإداري')
 ]);
 Widget scan()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('M-15 / M-16: الفحص ليس Antivirus شاملًا، ولا يضمن أن الجهاز خالٍ من المخاطر.'),
  const SizedBox(height:12),
  infoCard('إصدار النظام',platformSnapshot?['sdkInt']==null
      ?'UNKNOWN':('API '+platformSnapshot!['sdkInt'].toString())),
  infoCard('سلامة نسخة BOB','Play Integrity غير مفعّلة.'),
  infoCard('الحساسات والصلاحيات','لم تطلب المعاينة أذونات للموقع أو الكاميرا أو الميكروفون.'),
  infoCard('نتيجة الفحص','UNKNOWN: لا توجد قدرة إنتاجية متحققة.'),
  disabled('اعتبار الهاتف آمنًا بالكامل')
 ]);
 Widget privacy()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('M-21: لا يجري حفظ معلومات حساسة أو تفعيل مشاركة أو مراقبة في المعاينة.'),
  const SizedBox(height:12),
  infoCard('حذف الحساب','مسار مستقل يحتاج هوية وإعادة مصادقة وإبطال الاعتمادات وقاعدة بيانات مرتبطة.'),
  disabled('طلب حذف حقيقي'),
  infoCard('حقوق مستقلة','فصل الجهاز لا يمسح هاتفك. Unbind وReplacement وUnenrollment وWipe وDelete عمليات منفصلة.')
 ]);
 Widget other()=>Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
  warning('هذه الصفحة من سجل المرجع، لكنها عقد واجهة غير مكتمل. لن يُنفذ أي أثر حسّاس.'),
  const SizedBox(height:12),
  infoCard(mobileScreens[page]??'شاشة BOB',page+' • BOB 4.0 §21.44.1'),
  infoCard('حالة الاتصال','MySQL / Redis / API / Play Billing غير متصلة.'),
  disabled('إجراء إنتاجي')
 ]);
 Widget screenBody(){
   if(page=='M-10')return dashboard();
   if(page=='M-13')return recovery();
   if(page=='M-22')return family();
   if(page=='M-23')return enterprise();
   if(page=='M-15'||page=='M-16'||page=='M-04')return scan();
   if(page=='M-21')return privacy();
   return other();
 }
 @override Widget build(BuildContext context){
  if(!entered)return Scaffold(body:SafeArea(child:welcome()));
  return Scaffold(
   appBar:AppBar(
     title:Text(mobileScreens[page]??'BOB',maxLines:1,overflow:TextOverflow.ellipsis),
     actions:[Center(child:chip('PRE-DB')),const SizedBox(width:10)]),
   drawer:drawer(),
   body:SafeArea(child:ListView(padding:const EdgeInsets.fromLTRB(12,12,12,25),
      children:[screenBody()])),
   bottomNavigationBar:NavigationBar(
     selectedIndex:page=='M-10'?0:page=='M-11'?1:page=='M-13'?2:3,
     onDestinationSelected:(index)=>setState((){
       page=['M-10','M-11','M-13',role==BobRole.enterprise?'M-23':role==BobRole.family?'M-22':'M-21'][index];
     }),
     destinations:const [
       NavigationDestination(icon:Icon(Icons.home_outlined),label:'الرئيسية'),
       NavigationDestination(icon:Icon(Icons.shield_outlined),label:'الأمان'),
       NavigationDestination(icon:Icon(Icons.location_searching_outlined),label:'الاسترداد'),
       NavigationDestination(icon:Icon(Icons.person_outline),label:'الحساب')
     ]),
  );
 }
}