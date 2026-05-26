# Promoted Products Analytics (Marketer)

This feature adds a marketer-facing analytics dashboard that connects:

1. Storefront products owned by the marketer
2. Promoter affiliate activity (views/clicks)
3. Storefront orders (paid/pending/fulfilled/refunded) and promoter commissions

The page is exposed in the platform app under:

`Dashboard -> Storefronts -> Promoted Products Analytics`

Route:

`/dashboard/stores/promoted-products-analytics`

## Backend (marketspase-api)

### Event Models

**AffiliateView**

Append-only event log for affiliate page views (used for time-series + unique viewers).

Location:

`src/apps/store/models/affiliate-view/*`

Fields (high level):

`promotionTracking`, `product`, `store`, `promoter`, `viewedAt`, `deviceType`, `source`, `referrer`, `ipHash`, `userAgent`, `status`

**AffiliateClick** already exists and is used for click time-series + unique clicks.

### Tracking

`trackProductView` now increments the `PromotionTracking.viewCount` and also writes an `AffiliateView` event (best-effort).

Location:

`src/apps/store/controllers/promotion/product-tracking.controller.js`

### Analytics Endpoints (marketer-scoped)

All endpoints below are mounted under the authenticated store router:

Base:

`/api/v1/stores/store/analytics/promoted-products`

1. **Overview (page + KPI + trends)**

`GET /overview`

Query params (all optional unless noted):

`rangeDays`, `startDate`, `endDate`, `storeId`, `category`, `productId`, `promoterId`, `search`, `page`, `limit`, `topLimit`, `timezone`

Response includes:

`summary`, `alerts`, `timeSeries.daily|weekly`, `topProducts`, `topPromoters`, `productsPage.rows`

2. **Product -> Promoter breakdown**

`GET /product-promoters`

Query params:

`productId` (required), `rangeDays`, `startDate`, `endDate`, `storeId`, `timezone`, `limit`

Response includes:

`rows[]` with promoter-level views/clicks/orders/revenue/commission.

3. **Autocomplete helpers**

`GET /options/products`

`GET /options/promoters`

Used for UI filters.

### Security

The overview and breakdown services resolve store ownership using:

1. Canonical Mongo user id owner match
2. Legacy UID owner match (Firebase UID string)
3. Migration edge case: any user records that share the same UID

This prevents a marketer from accessing analytics for stores they do not own.

## Frontend (marketspase platform app)

### Component

Location:

`projects/platform/src/app/store/marketer/promoted-products-analytics/*`

Key files:

1. `marketer-promoted-products-analytics.component.ts|html|scss`
2. `promoted-products-analytics.service.ts`

### UX Flow

1. Marketer opens the page from the Storefronts menu.
2. Page loads overview KPI + trends + top lists + promoted product table.
3. Marketer filters by date range/store/category/product/promoter/search.
4. Marketer opens **Details** on a product to see promoter-level breakdown.

### Refresh

The page automatically refreshes every 5 minutes and also refreshes on filter changes (debounced).

