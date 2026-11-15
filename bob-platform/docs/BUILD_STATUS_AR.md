# حالة البناء في الفرع — 15 نوفمبر 2026
| الطبقة | حالة هذا التسليم | الدليل |
| --- | --- | --- |
| فتح فرع معزول | DONE | `feature/bob-platform-pre-db-20261115` |
| RTL responsive portal | IMPLEMENTED DEMO | `public/` |
| سجل 104 شاشة أم | REGISTERED | `data/screens.json` |
| سجل 35 Subflow | REGISTERED | `data/subflows.json` |
| Tenant/family boundary | DEMO-GUARDED | `src/domain.mjs` |
| Command preflight + explicit no-execution | DEMO-ONLY | `src/domain.mjs`, `src/server.mjs` |
| Cases, tickets, drafts, report preview | DEMO-ONLY | `src/server.mjs` |
| PostgreSQL schema | DRAFT ONLY | `schema/postgres.sql` |
| Database integration | NOT STARTED | no connection string, no migrations applied |
| Authentication / production roles | NOT IMPLEMENTED | role switch is simulated |
| Native Android / real devices | NOT IMPLEMENTED | mandatory platform testing remains |
| 104 full production views | NOT IMPLEMENTED | only selected interactive partial views |
| R2 trust / runtime qualification | NOT CLOSED | inherited frozen report: trust=false; runtime=NOT_RUN |
| CI validation | PENDING RUN RESULTS | `.github/workflows/bob-pre-db.yml` |

هذا الملف يفصل ما هو تنفيذ حقيقي داخل المعاينة عما لم يكتمل حتى لا تعتبر الأزرار دليلًا على صلاحية جهاز أو نجاح أمر.
