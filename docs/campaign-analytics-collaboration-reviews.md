# Campaign Analytics, Collaboration, and Review System

## Purpose

This is the frontend-facing companion note for the analytics, messaging, and collaboration review work.

The canonical backend architecture document lives at:

- `C:\Projects\marketspase-workspace\marketspase-api\docs\campaign-analytics-collaboration-reviews.md`

Use that document for:

- backend models
- route inventory
- aggregation logic
- socket and notification flow
- security constraints
- future conversion/impression tracking guidance

Use this note when working in the Angular platform or admin apps.

## Platform app

### Analytics dashboard

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\analytics\campaign-analytics.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\analytics\campaign-analytics.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\analytics\campaign-analytics.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.service.ts`

Route:

- `/dashboard/campaigns/analytics`

Navigation:

- marketer campaign menu
- promoter promotion menu

Current analytics UI features:

- date range filters
- campaign filter
- marketer-side promoter filter
- summary cards
- timeline visualization
- source breakdown
- device breakdown
- campaign table export
- promoter table export
- promotion table export
- quick jump into collaboration rooms

Important product note:

- the UI uses tracked visits instead of fake impression counters
- the UI uses real live PPC data instead of synthetic conversion counters

### Collaboration workspace

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.service.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\realtime-events.service.ts`

Route:

- `/dashboard/campaigns/collaboration`

Behavior:

- shared conversation list
- filters by room type
- direct conversations
- campaign rooms
- promotion rooms
- inline message composer
- unread counts
- realtime message append
- campaign analytics jump-off

### Profile review and messaging surface

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\profile-page.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\profile-page.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\profile-page.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\components\collaboration-review-dialog.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\components\review-flag-dialog.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\profile\services\profile.service.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\shared-services\src\lib\user.interface.ts`

What appears on profile now:

- collaboration rating summary
- review count
- published collaboration reviews
- leave review action when eligible
- flag review action
- direct message action into collaboration threads

## Admin app

### Collaboration review moderation

Files:

- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\users\reviews\user-review-moderation.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\users\reviews\user-review-moderation.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\users\reviews\user-review-moderation.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\users\reviews\user-review-moderation.service.ts`

Route:

- `/dashboard/users/reviews`

Shell wiring:

- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\users\user.routes.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\admin\src\app\dashboard\index.component.ts`

Capabilities:

- moderation queue
- status filters
- search
- flagged-only view
- detail panel
- publish
- hide
- remove
- restore
- moderation note capture
- admin response capture

## Shared frontend contracts

Primary shared frontend contract file:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\campaign\collaboration\collaboration.service.ts`

This file carries the frontend contract for:

- marketer analytics response
- promoter analytics response
- collaboration conversations
- collaboration messages
- review eligibility
- collaboration reviews

Profile-facing shared user additions:

- `collaborationRating`
- `collaborationRatingCount`
- `collaborationReviewCount`

## UI/UX guidance for future changes

1. Keep analytics on dynamic themed surfaces already used by the campaign and dashboard shell.
2. Treat the collaboration screen as a lightweight workbench, not a general social inbox.
3. Keep review UI tied to real collaboration history; do not open public review spam paths.
4. If new funnel metrics are added later, only show them once the backend captures them consistently.
5. If attachment support is expanded, keep the composer compact and avoid breaking the chat density.

## Future customization

### Add true conversion widgets later

When backend conversion tracking exists, extend:

- `AnalyticsSummary`
- `AnalyticsTimeSeriesRow`
- `CampaignBreakdownRow`
- `PromoterBreakdownRow`
- `PromotionBreakdownRow`

Recommended new fields:

- `conversions`
- `conversionRate`
- `conversionValue`

### Add richer collaboration presence later

Possible future UI upgrades:

- typing indicator
- online presence
- pinned messages
- attachment previews
- campaign milestone system notes

### Add stronger review moderation later

Possible future UI upgrades:

- reviewer history panel
- auto-flag explanation card
- moderator assignment state
- bulk moderation actions

## Verification

Verified during implementation:

- `npx.cmd tsc -p C:\Projects\marketspase-workspace\marketspase\projects\platform\tsconfig.app.json --noEmit`
- `npx.cmd ng build platform --configuration development`
- `npx.cmd tsc -p C:\Projects\marketspase-workspace\marketspase\projects\admin\tsconfig.app.json --noEmit`
- `npx.cmd ng build admin --configuration development`

Additional local browser verification:

- public routing behavior was checked in the in-app browser
- authenticated page-level browser QA is still recommended once a local or staging signed-in test session is available

