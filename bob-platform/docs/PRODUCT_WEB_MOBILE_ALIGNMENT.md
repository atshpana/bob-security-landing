# BOB 4.0 — Product-aligned web and mobile pre-database implementation

## Product contract
One BOB Security product with one logical identity, one backend contract and differentiated permissions: Public, Guard Personal (including adult-only family administration), Guard Managed (eligible Android Enterprise devices only). No unapproved remote monitoring or unauthorized device control.

## Delivered browser surfaces
- `public/site.html`: responsive product website and entry to both previews.
- `public/preview.html`: interactive web role dashboards for owner, family, enterprise, admin, support, partner.
- `public/mobile.html`: interactive **mobile UX prototype**, responsive and standalone-browser installable; role switching between owner, family and enterprise; simulated devices, preflight, incidents and policy drafts.
- `public/mock-api.js`: memory-only synthetic demo API. No actual device execution, persistence, subscriptions or payments.
- `public/mobile.webmanifest`: mobile browser standalone presentation metadata.

## Native Android status
The mobile HTML prototype is **not a native Android APK** and does not claim Android APIs, notification permissions, Play Billing, AMAPI or real-time device protection. Native Android application implementation and on-device execution recheck remain a separate engineering milestone. Product requirements are documented in `docs/ANDROID_APP_SCOPE.md`.

## Next production milestones (not yet delivered)
1. Build native Android client with onboarding, authentication, device registration and capability checks, privacy/consent, M-21, M-22 and M-23.
2. Define verified backend identity, ownership, entitlements, audit, incident and device schemas with API tests.
3. Connect staging database only after schema and access-control review; production database remains disconnected by owner instruction.
4. Validate on physical Android devices and official Android Enterprise gates before enabling any real command, subscription or report issuance.

Source of truth: `BOB_4_0_OWNER_APPROVED_FROZEN.docx`, particularly product levels, privacy, family adult isolation, Android Enterprise and §21.44.1 104-screen registry. The existing registry is not evidence that every screen has been implemented.
