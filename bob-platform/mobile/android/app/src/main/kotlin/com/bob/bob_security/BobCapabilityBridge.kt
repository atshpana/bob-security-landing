package com.bob.bob_security

import android.os.Build
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * BOB 4.0 read-only capability probe.
 * No camera, microphone, location or persistent device identifier is accessed.
 * Execution Recheck requires independently approved Kotlin services and device PoC.
 */
object BobCapabilityBridge {
    private const val CHANNEL = "com.bob.security/capabilities"

    fun install(engine: FlutterEngine) {
        MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getRuntimeSnapshot" -> result.success(
                        mapOf(
                            "os" to "ANDROID",
                            "sdkInt" to Build.VERSION.SDK_INT,
                            "managementMode" to "UNKNOWN",
                            "deviceCapabilitiesVerified" to false,
                            "camera" to "UNKNOWN",
                            "microphone" to "UNKNOWN",
                            "location" to "UNKNOWN",
                            "executionEnabled" to false
                        )
                    )
                    else -> result.notImplemented()
                }
            }
    }
}
