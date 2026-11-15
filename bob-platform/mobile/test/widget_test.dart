import 'package:flutter_test/flutter_test.dart';
import 'package:bob_security/ui.dart';
import 'package:bob_security/contracts.dart';

void main() {
  test('BOB mobile registry 23 screens',(){
    expect(mobileScreens.length,23);
    expect(mobileScreens.containsKey('M-22'),true);
    expect(mobileScreens.containsKey('M-23'),true);
    expect(sensoryRecoveryActions.length,5);
  });
  test('family privacy and all real commands fail closed',(){
    expect(BobPermissionRules.mayViewOtherAdultDevice(BobRole.family),false);
    expect(BobPermissionRules.familyInvitesEnabled,false);
    expect(BobPermissionRules.realDeviceExecution,false);
    expect(BobPermissionRules.databaseConnected,false);
    expect(BobPermissionRules.amapiEnabled,false);
  });
  testWidgets('demo login enters dashboard with unverified warning',(tester) async {
    await tester.pumpWidget(const BobSecurityApp());
    expect(find.text('BOB Security'),findsOneWidget);
    await tester.tap(find.text('فتح نسخة المعاينة'));
    await tester.pumpAndSettle();
    expect(find.text('حالة BOB'),findsOneWidget);
    expect(find.textContaining('لم تُفحص حماية الهاتف الفعلية'),findsOneWidget);
  });
  testWidgets('recovery shows sensor contract but does not enable action',(tester) async {
    await tester.pumpWidget(const BobSecurityApp());
    await tester.tap(find.text('فتح نسخة المعاينة'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('الاسترداد').last);
    await tester.pumpAndSettle();
    expect(find.textContaining('أوامر الحساسات الخمسة'),findsOneWidget);
    expect(find.textContaining('SENSOR_NOT_ARMED'),findsWidgets);
  });
}
