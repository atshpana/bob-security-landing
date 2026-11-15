# Android application implementation scope — BOB 4.0

**Current status:** Native Android code, APK and Play deployment **NOT IMPLEMENTED**. `public/mobile.html` is an interactive UX prototype only.

## Required Android app tracks
- M-01–M-09: secure onboarding, login, device registration, consent, capability discovery, SIM/eSIM guidance and plan gating.
- M-10–M-21: personal dashboard, security mode, device and incident handling, evidence, subscriptions, privacy and verified account deletion.
- M-22: adult-only family membership/invites; no telemetry, remote control or location of adult members.
- M-23: role-scoped mobile enterprise management, functionally aligned with enterprise web dashboard, with official Android Enterprise provisioning.
- Remaining M-series screens and 35 subflows are governed by the frozen 104-screen registry and must be implemented without inventing new parent screens.

## Safety gates
- Native device capability engine must check OS/API level, runtime permissions, enrollment mode, device state, connectivity and entitlement.
- Server-side authorization plus **on-device execution recheck** are mandatory for sensitive actions.
- Return UNSUPPORTED / DEGRADED / NONCOMPLIANT when evidence is missing; never show success based on request acceptance.
- Do not bypass Android restrictions using Accessibility, background tracking or undocumented OEM interfaces.
- AMAPI/Android Device Policy only for eligible contracted enterprise enrollment, after external verification.
- Public and Personal must not inherit enterprise management privileges.

## Future Android architecture
Kotlin + Jetpack Compose UI, Android Keystore, WorkManager, Room encrypted storage as justified, Retrofit/OkHttp HTTPS API with token-bound identity, Play Billing only for verified personal entitlements, explicit consent and deletion flows. Implementation is gated on confirmed backend API contract and test devices.
