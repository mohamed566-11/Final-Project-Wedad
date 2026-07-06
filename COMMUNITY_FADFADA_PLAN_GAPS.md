# Technical Review Report: COMMUNITY_FADFADA_PLAN.md

## 1. Plan Completeness

### Section 1: Needs Clarification

- Scope states one-level replies, but no enforceable rule is defined in validation or DB constraints.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 42)
  - COMMUNITY_FADFADA_PLAN.md (line 187)

### Section 2: Needs Clarification

- "Auth & Roles موجود" is true at high level, but community endpoints are not mapped to existing middleware/guard rules in this codebase.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 74)
  - Back-end/routes/patient.php (line 85)
  - Back-end/routes/doctor.php (line 71)
  - Back-end/routes/admin.php (line 46)

### Section 3: Needs Clarification

- Good table coverage, but enforceability gaps exist:
  - one-level reply limit not enforced
  - duplicate report rules missing
  - active suspension uniqueness missing
  - membership active-state mismatch
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 123)
  - COMMUNITY_FADFADA_PLAN.md (line 380)
  - COMMUNITY_FADFADA_PLAN.md (line 187)

### Section 4: Incomplete

- Many backend contracts are placeholders (resources/services/policies), and some conflict with current backend conventions/classes.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 602)
  - COMMUNITY_FADFADA_PLAN.md (line 707)
  - COMMUNITY_FADFADA_PLAN.md (line 958)
  - Back-end/app/Services/NotificationService.php (line 17)

### Section 5: Needs Clarification

- Frontend list is detailed, but data flow is incomplete for many screens (exact request/response, cache invalidation, pagination usage).
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1014)
  - COMMUNITY_FADFADA_PLAN.md (line 1111)
  - Front-End/src/services/articleService.ts (line 86)

### Section 6: Needs Clarification

- Privacy principles are stated, but operational controls are not concrete enough for coding (identity reveal logic, audit triggers, redaction rules).
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1312)
  - COMMUNITY_FADFADA_PLAN.md (line 1330)

### Section 7: Incomplete

- Internal contradiction: doctor posting is forbidden here, but allowed in permissions table.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1345)
  - COMMUNITY_FADFADA_PLAN.md (line 918)

### Section 8: Needs Clarification

- Admin permission names are proposed, but no mapping to current Permission enum/middleware integration.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1432)
  - Back-end/app/Enums/Permission.php (line 85)

### Section 9: Needs Clarification

- Security controls are concept-level only; implementation parameters are not concrete (thresholds, escalation flow, false positives).
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1450)
  - COMMUNITY_FADFADA_PLAN.md (line 1466)

### Section 10: Complete

- Timeline is clear as planning guidance.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1481)

### Section 11: Needs Clarification

- KPIs/SLAs listed without specifying measurement source/events.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1539)
  - COMMUNITY_FADFADA_PLAN.md (line 1546)

### Section 12: Needs Clarification

- Production-readiness section has assumptions not mapped to current stack artifacts (feature flags, Slack alerts, media URL strategy).
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1564)
  - COMMUNITY_FADFADA_PLAN.md (line 1616)

---

## 2. Database Conflicts

### Direct conflicts with existing migrations

1. No direct table-name collision found.

- No community tables currently exist.
- Evidence:
  - Back-end/database/migrations/0001_01_01_000001_create_users_table.php (line 14)
  - Back-end/database/migrations/0001_01_01_000016_create_doctors_table.php (line 11)

2. Column naming mismatch with existing media fields.

- Plan resources use profile_picture while current models/resources use image/image_url.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 588)
  - COMMUNITY_FADFADA_PLAN.md (line 640)
  - Back-end/app/Models/User.php (line 33)
  - Back-end/app/Http/Resources/Patient/PatientResource.php (line 43)
  - Back-end/app/Http/Resources/Doctor/DoctorResource.php (line 57)

### Missing indexes/constraints not specified in plan

1. community_circle_members lacks is_active but model logic depends on it.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 126)
  - COMMUNITY_FADFADA_PLAN.md (line 380)

2. No enforceable one-level reply constraint.

- parent_id recursion exists without depth rule.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 42)
  - COMMUNITY_FADFADA_PLAN.md (line 187)

3. No duplicate-report prevention constraint.

- Missing unique(reporter_user_id, reportable_type, reportable_id).
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 228)

4. No active-suspension uniqueness rule.

- Overlapping active suspensions for same user remain possible.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 289)

5. Missing moderation/feed support indexes.

- Not explicit for parent_id comments lookup, reportable + status filters, and saved-post listing patterns.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 200)
  - COMMUNITY_FADFADA_PLAN.md (line 250)
  - COMMUNITY_FADFADA_PLAN.md (line 267)

---

## 3. Backend Gaps

### Controllers/Routes/Middleware/Services mentioned but not fully defined

1. Community controllers listed without full request/response contracts.

- Missing exact payloads, status codes, and error schema per endpoint.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 745)
  - COMMUNITY_FADFADA_PLAN.md (line 770)
  - COMMUNITY_FADFADA_PLAN.md (line 779)

2. Middleware names proposed but not integrated into existing alias map.

- No community middleware aliases currently registered.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 932)
  - Back-end/bootstrap/app.php (line 52)

3. Permission integration missing.

- Proposed community.\* permissions not present in current enum.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1432)
  - Back-end/app/Enums/Permission.php (line 85)

4. Notification integration sample uses non-existing method.

- Plan uses sendToUser, but NotificationService exposes create and typed notify methods.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 958)
  - Back-end/app/Services/NotificationService.php (line 17)

5. Policy typing conflicts with doctor participation.

- Policy signatures are User-based while doctor APIs use separate guard/model.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 860)
  - COMMUNITY_FADFADA_PLAN.md (line 770)
  - Back-end/routes/doctor.php (line 37)

### Vague business logic

1. bad words + unsafe content has no concrete rulebook/thresholds.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 708)

2. Auto moderation flag scoring is undefined.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 724)

3. Feed ranking formula is not deterministic.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 733)

4. Anonymous alias generation policy is unspecified.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 709)

---

## 4. Frontend Gaps

1. Route strategy conflict with existing app conventions.

- Plan adds /community and /admin/community, while current app follows role-prefixed protected areas and has no community routes.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1171)
  - COMMUNITY_FADFADA_PLAN.md (line 1179)
  - Front-End/src/App.tsx (line 195)
  - Front-End/src/App.tsx (line 390)

2. Service signatures listed without explicit envelope contract.

- Existing frontend services consume status/message/data envelope.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1111)
  - Front-End/src/services/articleService.ts (line 86)

3. Admin navigation assumption mismatches actual implementation.

- Plan references config/adminNavigation.ts and adminSidebarNavItems, but current nav is inline in AdminLayout.tsx.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1392)
  - Front-End/src/components/admin/AdminLayout.tsx (line 52)

4. State management details missing for critical flows.

- No explicit query keys/invalidation/optimistic policy for react/save/comment/report.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1111)
  - COMMUNITY_FADFADA_PLAN.md (line 1156)

5. Infinite scroll backend contract not defined.

- useInfiniteQuery mentioned, but next-page derivation and pagination fields are unspecified.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1025)
  - COMMUNITY_FADFADA_PLAN.md (line 1165)

---

## 5. Integration Conflicts

1. Doctor identity model assumption is incorrect in snippets.

- Plan uses supervisorDoctor->user->name/profile_picture, while doctor is standalone auth model with direct name/image.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 639)
  - COMMUNITY_FADFADA_PLAN.md (line 640)
  - Back-end/database/migrations/0001_01_01_000016_create_doctors_table.php (line 13)
  - Back-end/app/Http/Resources/Doctor/DoctorResource.php (line 17)

2. Notification behavior assumption is partially incorrect.

- Plan assumes DB + Push via NotificationService sendToUser style. Current service primarily creates DB notifications (with optional email). Push flow is handled through NotificationController + PushSubscription.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 954)
  - COMMUNITY_FADFADA_PLAN.md (line 958)
  - Back-end/app/Services/NotificationService.php (line 17)
  - Back-end/app/Http/Controllers/Api/NotificationController.php (line 124)

3. Doctor middleware assumptions are incomplete.

- Most doctor functional APIs are guarded by DoctorVerified; plan does not define if community doctor endpoints follow same rule.
- Evidence:
  - Back-end/routes/doctor.php (line 71)
  - Back-end/app/Http/Middleware/CheckDoctorVerified.php (line 27)
  - COMMUNITY_FADFADA_PLAN.md (line 770)

4. Request validation convention alignment missing.

- Project standard is BaseRequest subclasses; plan does not map namespace/location for new community requests.
- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 827)
  - Back-end/app/Http/Requests/BaseRequest.php (line 9)
  - Back-end/app/Http/Requests/Patient/UpdateBasicInfoRequest.php (line 8)

---

## 6. Missing Definitions

1. unsafe content and bad words criteria

- COMMUNITY_FADFADA_PLAN.md (line 708)

2. moderation score thresholds and actions

- COMMUNITY_FADFADA_PLAN.md (line 724)

3. engagement rate/reports penalty formula

- COMMUNITY_FADFADA_PLAN.md (line 733)

4. alias generation rules

- COMMUNITY_FADFADA_PLAN.md (line 709)

5. moderation status transition matrix

- COMMUNITY_FADFADA_PLAN.md (line 228)

6. visibility behavior intersection between public/circle_only and private circles

- COMMUNITY_FADFADA_PLAN.md (line 157)

7. SLA measurement boundaries (start/stop/exclusions)

- COMMUNITY_FADFADA_PLAN.md (line 1424)
- COMMUNITY_FADFADA_PLAN.md (line 1575)

---

## 7. Top 5 Implementation Risks

1. Doctor role contradiction may break policy and route implementation.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 918)
  - COMMUNITY_FADFADA_PLAN.md (line 1345)

2. Identity field mismatch (profile_picture and doctor->user) can break resources at runtime.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 640)
  - Back-end/app/Http/Resources/Doctor/DoctorResource.php (line 57)

3. Undefined moderation/ranking logic will cause rework and inconsistent behavior.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 724)
  - COMMUNITY_FADFADA_PLAN.md (line 733)

4. Missing DB constraints for replies/reports/suspensions risks data integrity and abuse edge cases.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 187)
  - COMMUNITY_FADFADA_PLAN.md (line 228)
  - COMMUNITY_FADFADA_PLAN.md (line 289)

5. Frontend routing/navigation assumptions differ from current architecture and can cause integration churn.

- Evidence:
  - COMMUNITY_FADFADA_PLAN.md (line 1171)
  - COMMUNITY_FADFADA_PLAN.md (line 1395)
  - Front-End/src/App.tsx (line 195)
  - Front-End/src/components/admin/AdminLayout.tsx (line 52)

---

## 8. Questions That Must Be Answered Before Coding

1. Should doctor community endpoints require DoctorVerified, or only auth:doctor + DoctorStatus?
2. Final rule: can doctors create posts or only comments?
3. Should frontend community routes be global (/community) or role-scoped to align with existing structure?
4. What is the authoritative avatar field for community author payloads: image, image_url, or another field?
5. Should supervisor data come from doctors table directly or from doctor->user relation?
6. What exact moderation scoring model and thresholds trigger under_review, hide, and escalation?
7. How is one-level comment nesting enforced technically (validation only, DB guard, or both)?
8. Should duplicate reports by same reporter on same target be blocked?
9. Which exact admin permissions must be added to current Permission enum and role seeders?
10. Should NotificationService be extended for community-specific methods, or community use existing create pattern?
11. Is posting blocked by guidelines acceptance for all existing users, and how is backfill handled?
12. Should admin community navigation be integrated in AdminLayout nav or moved to a new config layer?
