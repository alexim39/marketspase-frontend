# Global Search System

## Purpose

This document covers the frontend implementation of MarketSpase global search in the live platform app.

The feature adds:

- a persistent dashboard search bar on desktop and mobile
- live suggestions
- a full results workspace
- role-aware navigation into users, campaigns, promotions, products, and stores

## Frontend entry points

Main files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-bar.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-bar.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-bar.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-page.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-page.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search-page.component.scss`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search.service.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search.model.ts`

## Dashboard shell integration

The search bar is integrated into the shared dashboard shell so it is accessible from the main signed-in experience.

Patched shell files:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\sidenav\sidenav.component.ts`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\sidenav\sidenav.component.html`
- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\sidenav\sidenav.component.scss`

Behavior:

- desktop: centered prominent search bar in the dashboard header
- mobile: full-width search row directly below the top toolbar

This keeps search visible without disrupting campaign creation, funding, or community flows.

## Route

New route:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\dashboard.routes.ts`

Path:

- `/dashboard/search`

This route is query-param driven and responds to:

- `q`
- `type`
- `userType`
- `status`
- `region`
- `page`
- `limit`

## Search bar UX

### Component behavior

The global search bar:

- debounces input
- requests live suggestions after 2 characters
- shows a dropdown with top matches
- routes directly into the clicked result when possible
- falls back to the full results page when needed
- syncs its input from the current URL

### Suggestion UX

Each suggestion shows:

- entity icon or image
- title
- subtitle
- entity type label
- optional region

The final action in the dropdown routes to the full results page.

## Search results page UX

The results page is designed to match the app’s current dynamic dashboard style.

### Layout

- hero header
- filter panel
- loading and empty states
- spotlight top result
- responsive result grid
- paginator

### Filters

Supported filters:

- entity type
- user type
- status
- region

### Result presentation

Results are rendered with role-aware summaries:

- campaigns: budget, billable clicks, CPC
- promotions: earned amount, tracked clicks, billable clicks
- products: price, store, rating
- stores: category, views, sales
- users: role, rating, region

### Export

Users can export the currently visible page of results as CSV from the results workspace.

## API integration

The frontend service uses:

- `GET /api/v1/search`
- `GET /api/v1/search/suggestions`

Service file:

- `C:\Projects\marketspase-workspace\marketspase\projects\platform\src\app\dashboard\search\global-search.service.ts`

The service:

- builds query params
- keeps the frontend API surface small
- supports CSV export

## Navigation behavior

The backend returns a `navigationPath` for each result. The frontend uses that path directly so routing logic stays centralized server-side.

This means a promotion result can open differently for:

- the promoter who owns it
- the marketer tied to its campaign
- another authorized viewer

That keeps the UI simple and avoids duplicating role logic in multiple components.

## Security and privacy

The frontend does not decide what is visible. It only renders what the authenticated backend returns.

That means:

- restricted promotions do not appear unless allowed
- private marketer assets do not leak through client filtering
- user-facing search remains aligned with server authorization rules

## Regression safety

The search feature is intentionally isolated from existing business flows:

- it adds new routes rather than mutating campaign logic
- it uses read-only API queries for user search behavior
- it sits in the shared dashboard shell without rewriting existing pages

No existing funding, campaign creation, promotion, or wallet UI contract was replaced.

## Verification completed

Completed locally:

- `C:\Projects\marketspase-workspace\marketspase\node_modules\.bin\tsc.cmd -p C:\Projects\marketspase-workspace\marketspase\projects\platform\tsconfig.app.json --noEmit`
- `C:\Projects\marketspase-workspace\marketspase\node_modules\.bin\ng.cmd build platform --configuration development`

Build status:

- passed
- only pre-existing repo-wide Sass deprecation warnings remain

## Recommended staging QA

Before production deploy, validate these flows in a signed-in browser session:

1. marketer searches campaigns, products, and promoters
2. promoter searches campaigns, own promotions, stores, and products
3. filters work independently and together
4. pagination stays correct at multiple page sizes
5. export downloads the visible page correctly
6. hidden or unauthorized assets do not appear across role boundaries
7. header search works on:
   - dashboard home
   - campaigns
   - promotions
   - community
   - profile
   - store pages

## Future enhancements

Safe follow-up improvements:

- saved recent searches
- keyboard navigation in suggestion dropdown
- highlighted query fragments in result titles
- richer per-type filters
- dedicated admin search analytics
- search telemetry for most common queries and zero-result searches

## Customization notes

If new entity types are added later:

1. extend the backend index document builder
2. extend the frontend `GlobalSearchEntityType`
3. add result metrics and icon mapping
4. add filter copy if needed

If search relevance needs tuning later:

- prefer changing backend ranking weights first
- avoid changing frontend contracts unless a new data point is truly needed
