import 'package:flutter/services.dart';
/// Read-only official Android signal; returns UNKNOWN without native host.
class BobAndroidProbe {
 static const _channel=MethodChannel('com.bob.security/capabilities');
 static Future<Map<String,Object?>> snapshot() async {
  try {
   final result=await _channel.invokeMapMethod<String,Object?>('getRuntimeSnapshot');
   if(result!=null)return Map<String,Object?>.from(result);
  } on PlatformException { // not a guaranteed capability
  } on MissingPluginException { // web or Android bridge not registered
  }
  return {'os':'UNKNOWN','sdkInt':null,'executionEnabled':false,
          'managementMode':'UNKNOWN','camera':'UNKNOWN','microphone':'UNKNOWN'};
 }
}
