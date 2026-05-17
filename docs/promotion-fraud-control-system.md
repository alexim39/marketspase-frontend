# Promotion Fraud Control System

## Purpose

This is the frontend-facing companion note for the promotion fraud-control implementation.

The canonical cross-stack architecture document lives at:

- `C:\Projects\marketspase-workspace\marketspase-api\docs\promotion-fraud-control-system.md`

Use that document for:

- loophole coverage
- backend enforcement flow
- fraud case lifecycle
- warning and suspension logic
- rollout and tuning guidance

Use this note when working specifically in the Angular admin or platform applications.

## Admin app integration

### Fraud monitor page

Primary files:

- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\promotion\promotion-fraud-monitor\promotion-fraud-monitor.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\promotion\promotion-fraud-monitor\promotion-fraud-monitor.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\promotion\promotion-fraud-monitor\promotion-fraud-monitor.component.scss`

Route:

- `/dashboard/promotions/fraud`

### Admin services and shell wiring

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\promotion\promotion.service.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\promotion\promotion.routes.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\dashboard.service.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\index.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\index.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\dashboard-main.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\dashboard-main.component.html`

The admin app now exposes:

- fraud pulse in the shell
- fraud summary in the dashboard
- dedicated case review and action workflows

## Platform app integration

### Promoter promotion list and card restrictions

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\components\promotion-card\promotion-card.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\components\promotion-card\promotion-card.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\components\promotion-card\promotion-card.component.scss`

Behavior:

- paused or blocked promotions show a visible fraud/review state
- copy/share/open actions are disabled for restricted links

### Promoter promotion details restrictions

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\promotion-details\promotion-detail.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\promotion-details\promotion-detail.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\promotion-details\promotion-detail.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\promoter\promotion\promotion-details\components\promotion-footer\promotion-footer.component.ts`

Behavior:

- restricted promotions show a warning banner
- footer actions reflect link availability

## Shared typings

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\shared-services\src\lib\promotion.interface.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\shared-services\src\lib\user.interface.ts`

These carry:

- promotion fraud status
- promoter fraud profile fields used by the admin monitor and restriction UI

## Developer notes

1. The platform should always treat `promotion.isActive === false` as the primary "link not usable" state.
2. The richer `fraudStatus` object should drive messaging, not permission by itself.
3. Admin actions should go through the fraud case action endpoint rather than mutating promotion state directly from the UI.
4. If a future promoter or admin view needs more fraud details, extend the shared interfaces first to keep the apps aligned.

## Verification

Verified with:

- `npx.cmd tsc -p C:\Projects\marketspase-workspace\marketspase\projects\admin\tsconfig.app.json --noEmit`
- `npx.cmd ng build admin --configuration development`
- `npx.cmd tsc -p C:\Projects\marketspase-workspace\marketspase\projects\platform\tsconfig.app.json --noEmit`
- `npx.cmd ng build platform --configuration development`
