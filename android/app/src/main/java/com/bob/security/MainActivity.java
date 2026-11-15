package com.bob.security;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.widget.*;
import java.util.*;
public class MainActivity extends Activity {
 private LinearLayout root;
 private TextView status;
 private final ArrayList<String> events = new ArrayList<>();
 @Override public void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState); showHome();}
 private void showHome(){
  root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(32,40,32,24);
  root.setBackgroundColor(Color.rgb(247,249,252));setContentView(root);
  TextView title=new TextView(this);title.setText("BOB Security");title.setTextSize(28);title.setTextColor(Color.rgb(18,35,66));root.addView(title);
  status=new TextView(this);status.setText("وضع تجريبي محلي — لا توجد حماية فعلية مفعلة");status.setTextSize(16);root.addView(status);
  button("الأجهزة",()->showSection("الأجهزة","لم يتم تسجيل أي جهاز. ربط الأجهزة يتطلب التحقق من الملكية."));
  button("التنبيهات",()->showSection("التنبيهات","لا توجد تنبيهات حقيقية. هذه نسخة اختبار."));
  button("سجل النشاط",()->showSection("سجل النشاط",events.isEmpty()?"لا توجد أحداث":String.join("\n",events)));
  button("الخصوصية",()->showSection("الخصوصية","لا تتم مشاركة الموقع أو تنفيذ أوامر عن بعد في هذه النسخة."));
  button("تسجيل حدث تجريبي",()->{events.add("حدث تجريبي "+new Date());status.setText("تم تسجيل حدث تجريبي محلي");});
 }
 private void button(String name,Runnable action){Button b=new Button(this);b.setText(name);root.addView(b);b.setOnClickListener(v->action.run());}
 private void showSection(String name,String body){root.removeAllViews();TextView t=new TextView(this);t.setText(name+"\n\n"+body);t.setTextSize(19);root.addView(t);button("العودة",this::showHome);}
}
