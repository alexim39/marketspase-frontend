# MarketSpase Mobile-Native Migration Audit

Last updated: 2026-05-30

## Objective

MarketSpase is moving from desktop-first responsive screens to dedicated mobile-native page experiences. The rule for new conversions is:

```text
feature/
  desktop/
    index.component.ts
  mobile/
    index.component.ts
  index.component.ts
```

The route-level `index.component.ts` should act as the device-aware wrapper. It should preserve desktop behavior while loading a mobile-first component for `mobile` and, where the tablet design is closer to phone than desktop, for `tablet`.

## Current Coverage Snapshot

Existing device-aware work already exists in these areas:

| Area | Current state | Notes |
| --- | --- | --- |
| Landing page | Has `desktop/` and `mobile/` branches | Good reference for the wrapper shape. |
| Dashboard shell | Has device checks | Mobile shell exists but still needs native page-level polishing across children. |
| Campaign index | Has device-aware wrapper | Child campaign pages still need separate mobile experiences. |
| Transactions | Converted in this pass | Mobile/tablet now use a dedicated mobile component; desktop table remains untouched. |
| Promoter product discovery | Converted in this pass | `/dashboard/stores/products` now uses a dedicated mobile component with cards and bottom-sheet filters. |
| Storefront orders | Converted in this pass | `/dashboard/stores/orders` now uses mobile order cards and bottom-sheet release/review actions. |
| Campaign landing | Converted in this pass | `/dashboard/campaigns` now routes mobile/tablet users to dedicated marketer/promoter mobile landing wrappers. |
| Promoter promotions | Converted in this pass | `/dashboard/campaigns/promotions` now uses a dedicated mobile promotion center and mobile tracked-link cards. |
| Campaign analytics | Converted in this pass | `/dashboard/campaigns/analytics` now uses a dedicated mobile/tablet analytics view with KPI cards, compact trend charts, and drilldown cards. |
| Marketer promoted-products analytics | Converted in this pass | `/dashboard/stores/promoted-products-analytics` now uses mobile/tablet KPI rails, compact trends, leader cards, product performance cards, and mobile breakdown dialogs. |
| Store email subscribers | Converted in this pass | `/dashboard/stores/subscribers` now uses mobile/tablet subscriber cards, native filters, copy/export actions, and compact page metrics. |
| Promoter store promotions | Upgraded in this pass | `/dashboard/stores/promotions` now uses a native mobile/tablet promotion control center with earnings summary, health filters, link cards, and release-status cards. |
| Notification center | Upgraded in this pass | `/dashboard/notifications` keeps shared realtime/cursor/delete logic while mobile/tablet now use bottom-sheet filters and mute preferences. |
| Public product details | Converted in this pass | `/product/:productId` and `/promote/:productId` now use a device-aware wrapper; mobile/tablet users get a gallery-first product page with sticky buy/promote/share actions and bottom-sheet checkout. |
| Public storefront landing | Converted in this pass | `/store/:storeLink` now uses a device-aware wrapper; mobile/tablet users get a native shop-feed with compact store hero, search, category rail, featured products, product cards, filters sheet, and sticky cart/contact actions. |
| Public cart checkout | Converted in this pass | `/cart` now uses a device-aware wrapper; mobile/tablet users get grouped cart cards, store chips, quantity controls, escrow trust messaging, sticky checkout, and a bottom-sheet delivery/payment form. |
| Marketer product management | Converted in this pass | `/dashboard/stores/:storeId/products` now uses a device-aware wrapper; mobile/tablet users get native inventory cards, stock/publishing filters, bulk publish/unpublish, and product action sheets. |
| Marketer product creation | Converted in this pass | `/dashboard/stores/:storeId/products/create` now uses a device-aware wrapper; mobile/tablet users get a native product creation wizard with photo rail, pricing/commission preview, delivery controls, SEO fields, review step, and sticky publish actions. |
| Marketer product editing | Converted in this pass | `/dashboard/stores/:storeId/products/edit/:productId` now uses a device-aware wrapper; mobile/tablet users get a focused update wizard that preserves existing product images, handles new image uploads/removals, updates pricing, stock, commission, delivery, SEO, visibility, and review state. |
| Marketer product detail | Converted in this pass | `/dashboard/stores/:storeId/products/:productId` now uses a device-aware wrapper; mobile/tablet users get a gallery-first product control page with KPI rail, management section sheets, copy/preview actions, and sticky edit controls. |
| Marketer store dashboard | Converted in this pass | `/dashboard/stores` now routes marketer mobile/tablet users to a native storefront control center with store switching, KPI rails, quick actions, inventory warnings, and top product cards. |
| Promoter store browser | Converted in this pass | `/dashboard/stores` now routes promoter mobile/tablet users to a native store discovery feed with search, category chips, bottom-sheet filters, premium storefront picks, product previews, follow actions, and pagination. |
| Marketer store creation | Converted in this pass | `/dashboard/stores/create` now uses a device-aware wrapper; mobile/tablet users get a native storefront setup wizard with brand basics, logo upload, contact review, trust tips, live preview, and sticky create actions. |
| Marketer store editing | Converted in this pass | `/dashboard/stores/edit/:id` now uses a device-aware wrapper; mobile/tablet users get a native storefront update wizard with identity editing, logo replacement/removal, review state, and sticky save actions. |
| Storefront customer support | Converted in this pass | `/dashboard/stores/support` now uses a device-aware wrapper; mobile/tablet users get a native Buyer CRM with KPI rail, customer cards, bottom-sheet filters, outreach composer, and customer detail sheet. |
| Community feed | Has mobile feed component | Social feed pattern already exists. |
| Promoter landing | Has several mobile child components | Campaign cards and filters have mobile variants. |
| Marketer campaign landing | Has several mobile child components | Campaign stats, cards, and filters have mobile variants. |

## Priority Order

The migration should start with routes that are used often, affect money movement, or contain dense desktop tables.

| Priority | Route / Feature | Mobile goal |
| --- | --- | --- |
| P0 | `/dashboard/transactions` | Wallet balance first, transaction cards, thumb filters, summary FAB. Completed in this pass. |
| P0 | `/dashboard/stores/products` | Mobile product discovery cards, search chips, bottom-sheet filters, promotion/share/copy actions. Completed in this pass. |
| P0 | `/dashboard/stores/orders` | Order cards grouped by status, buyer/promoter context, fulfillment quick actions. Completed in this pass. |
| P0 | `/dashboard/campaigns` | Campaign social cards, budget/progress summary, mobile action tray. Completed in this pass. |
| P0 | `/dashboard/campaigns/promotions` | Promotion feed cards, proof/analytics actions, fraud status visibility. Completed in this pass. |
| P1 | `/dashboard/campaigns/analytics` | Mobile analytics cards and chart sections without desktop overflow. Completed in this pass. |
| P1 | `/dashboard/notifications` | Mobile notification center, selection/delete, filter sheet, and mute preferences. Completed in this pass. |
| P1 | `/dashboard/stores/promoted-products-analytics` | Mobile KPI carousel, product/promoter drilldown cards, insight panels. Completed in this pass. |
| P1 | `/dashboard/stores/subscribers` | Subscriber cards, store filter sheet, export actions. Completed in this pass. |
| P1 | `/dashboard/stores/promotions` | Promoter store-promotion earnings, link health, affiliate sales, and release requests in mobile cards. Completed in this pass. |
| P1 | Storefront and product public pages | Product details, storefront landing, and public cart checkout completed in this pass with carousel-first/product-feed/cart-card layouts, sticky buy/promote/share/cart/contact/checkout actions, and mobile checkout sheets. |
| P2 | `/dashboard/stores/:storeId/products` | Marketer inventory cards, stock health, publish/unpublish controls, and product action sheets. Completed in this pass. |
| P2 | `/dashboard/stores/:storeId/products/create` | Mobile product creation wizard with progressive steps, photo management, commission preview, shipping/digital settings, and final review. Completed in this pass. |
| P2 | `/dashboard/stores/:storeId/products/edit/:productId` | Mobile product editing wizard with existing-image preservation, update review, pricing, stock, commission, delivery, and visibility controls. Completed in this pass. |
| P2 | `/dashboard/stores/:storeId/products/:productId` | Mobile product control page with gallery, KPI rail, stock/pricing/promotion sheets, public preview/copy, and sticky edit actions. Completed in this pass. |
| P2 | `/dashboard/stores` | Mobile storefront command center for marketers and mobile store discovery feed for promoters. Completed in this pass. |
| P2 | `/dashboard/stores/create` | Mobile storefront setup wizard with logo upload, brand description, contact confirmation, trust guidance, and preview. Completed in this pass. |
| P2 | `/dashboard/stores/edit/:id` | Mobile storefront update wizard with existing-logo preservation, logo replacement/removal, brand identity editing, review, and save controls. Completed in this pass. |
| P2 | `/dashboard/stores/support` | Mobile Buyer CRM cards, segment filters, bottom-sheet outreach composer, customer detail editing, order history, and export/copy actions. Completed in this pass. |
| P2 | Settings, assistant, resources, tutorials, legal | Grouped mobile settings and readable content layouts. |

## Component Conversion Checklist

For each route-level component:

1. Identify business purpose, primary user role, and critical action.
2. Keep existing desktop component stable.
3. Move mobile-specific UI into `mobile/index.component.ts`.
4. Keep data loading, permissions, and mutations in existing services/facades.
5. Replace tables with grouped cards, compact summaries, or drilldown sheets.
6. Keep touch targets at least `48px`.
7. Use `standalone: true`, `ChangeDetectionStrategy.OnPush`, signals, `inject()`, and modern `@if/@for` control flow.
8. Use mobile-native controls: horizontal chips, bottom sheets, sticky actions, cards, and floating action buttons.
9. Verify build and manually test mobile viewport.

## Transactions Mobile UX Analysis

Purpose:
Transactions helps marketers and promoters understand wallet movement, available balance, reserved funds, earnings/spend, and individual transaction status.

Desktop behavior:
The desktop component uses a toolbar, summary cards, Material tabs, form-field filters, and a Material table.

Mobile decisions:
The mobile page prioritizes wallet balance first, because this is the highest-value mobile question: "How much money do I have?" Secondary values are compact summary tiles. The table becomes transaction cards grouped by Today, Yesterday, and Earlier. Filters become horizontal thumb chips and segmented status buttons. The summary report is a floating action button so users can reach it without returning to the top.

Performance:
The component receives the same user signal as desktop, uses computed slices, renders only the first 20 filtered transactions, and reveals more on demand. This limits initial DOM size on low-end Android devices.

Accessibility:
The page has a labelled heading, labelled filter navigation, real buttons for all filters/actions, readable status text, and 48px-sized controls for touch use.

## Promoter Product Discovery Mobile UX Analysis

Purpose:
Promoters use `/dashboard/stores/products` to find products worth promoting, copy unique referral links, share products to WhatsApp, buy products, and inspect product details.

Desktop behavior:
The desktop page uses a large header, optional sidebar filters, grid/list switches, card grids, a desktop table, hover actions, and paginator controls.

Mobile decisions:
The mobile page puts discovery first: a compact summary, search, sort chips, quick category chips, and product cards. The product card prioritizes image, commission rate, stock state, price, store, and promotion performance. Actions are touch-first and explicit: copy link, share to status, share to chat, and buy. Advanced category selection moved into a bottom sheet so the main screen stays focused.

Performance:
The mobile component reuses the existing data/action logic, requests a smaller page size, keeps images lazy-loaded, avoids desktop tables, and renders only the current page of cards.

Accessibility:
Search, filter, pagination, and card actions are real labelled buttons. Touch controls are at least 48px where practical, and the filter panel uses a dialog role with modal semantics.

## Storefront Orders Mobile UX Analysis

Purpose:
Storefront Orders lets marketers, promoters, and admins track paid storefront orders, escrow state, commissions, delivery evidence, and release reviews.

Desktop behavior:
The desktop page renders a broad summary grid and full-width order cards with inline text areas for release/admin notes.

Mobile decisions:
The mobile page prioritizes the order count, escrow context, and immediate actions. Filters become thumb-friendly horizontal chips. Orders are grouped into action-focused sections such as Needs your action, Waiting for review, Pending admin review, Released orders, and Recent orders. Release request and admin review forms move into bottom sheets so the main feed stays scannable.

Performance:
The mobile component reuses the existing service calls and mutation methods, filters locally with computed signals, and avoids rendering text areas for every order until a bottom sheet is opened.

Accessibility:
Search, filters, refresh, release, and review actions are real buttons with 48px touch targets. Bottom sheets use dialog semantics and clear labels.

## Campaign Landing Mobile UX Analysis

Purpose:
`/dashboard/campaigns` is the shared campaign home for marketers and promoters. Marketers manage campaign spend, status, PPC performance, and top-up actions. Promoters discover campaigns, accept campaign work, and jump back to their active tracked links.

Desktop behavior:
The existing route delegates by role to the marketer or promoter landing component. Those desktop components already contain the business rules, service calls, mutation methods, and some reusable mobile cards/filters.

Mobile decisions:
The route-level role switcher now sends phone and tablet users to dedicated mobile presentation wrappers. The marketer mobile view prioritizes campaign count, budget/spend, billable clicks, status chips, search, and campaign cards with the existing action outputs. The promoter mobile view prioritizes pending earnings, active promotions, quick stats, mobile filters, and campaign accept cards. Both keep floating quick actions for the task users most often need on mobile.

Performance:
The mobile wrappers reuse the existing services and inherited signals instead of duplicating data flows. They avoid desktop tables, render card feeds, and keep heavy controls off the first screen.

Accessibility:
Top actions, filters, pagination, load more, and campaign actions are buttons with touch-friendly sizing. The mobile headings and labelled nav sections keep the page understandable for screen readers.

## Promoter Promotions Mobile UX Analysis

Purpose:
`/dashboard/campaigns/promotions` is where promoters manage accepted campaign links, copy tracked URLs, prepare captions, share to WhatsApp Status, download ad assets, message marketers, and review restricted or rejected promotions.

Desktop behavior:
The original component combines desktop and mobile checks in one template and renders full promotion cards with many inline actions.

Mobile decisions:
The route now uses a device-aware wrapper. Desktop keeps the existing `PromotionComponent`, while mobile/tablet users get `PromotionMobileComponent`. The mobile page prioritizes estimated earnings, billable clicks, active links, and quick filtering. The mobile card puts the tracked link, status, fraud pause alert, key click/earning metrics, and the core actions in thumb-friendly controls.

Performance:
The mobile component inherits existing pagination and data loading. It renders compact cards, lazy media previews, and load-more pagination instead of heavy desktop grids.

Accessibility:
Status filters, copy actions, WhatsApp sharing, asset download, details, and review actions are real buttons with labelled destinations and 48px touch targets where practical.

## Campaign Analytics Mobile UX Analysis

Purpose:
`/dashboard/campaigns/analytics` helps marketers and promoters understand PPC performance, billable clicks, conversions, revenue, conversion quality, device/source patterns, and campaign or promotion drilldowns.

Desktop behavior:
The desktop component renders a dense analytics workspace with filter forms, KPI summaries, charts, breakdown tables/cards, exports, campaign drilldowns, promoter drilldowns, and promotion drilldowns.

Mobile decisions:
The mobile page treats analytics as a quick decision surface. It leads with quality rate, generated time, range chips, and the most important KPIs in a horizontal card rail. Trends are shown as compact bars, while source/device patterns and drilldowns become stacked cards. Advanced actions such as export and full campaign/promotion review remain available but are presented as thumb-friendly buttons.

Performance:
The mobile component reuses the existing analytics data flow and computed summaries instead of duplicating queries. It slices the trend view to the latest seven records, avoids desktop tables, and keeps the first screen focused on high-signal data.

Accessibility:
Filters, refresh, export, campaign review, and promotion review are real labelled buttons or native form controls. KPI values are rendered as text, and mobile controls are sized for touch use.

## Marketer Promoted Products Analytics Mobile UX Analysis

Purpose:
`/dashboard/stores/promoted-products-analytics` gives marketers visibility into how storefront products perform through promoter-driven links, clicks, orders, revenue, commission, and product/promoter drilldowns.

Desktop behavior:
The desktop component uses wide filters, Material cards, trend charts, leader panels, a sortable product table, pagination, CSV export, and a product-promoter breakdown dialog.

Mobile decisions:
The mobile page prioritizes revenue, paid orders, active promoters, conversion rate, and action-worthy insights. Desktop tables become product cards with revenue, orders, clicks, conversion, pending/fulfilled/refunded context, top promoter chips, and direct product/detail actions. The dense trend chart becomes compact daily/weekly rows with touch-readable bars, and the breakdown dialog becomes a scrollable card list.

Performance:
The mobile component inherits the existing service calls, refresh loop, filters, pagination, export, and breakdown methods. It avoids rendering Material tables on mobile and keeps the trend view to the most recent seven points.

Accessibility:
Filters use native inputs/selects, all actions are buttons or links, controls are sized for touch, product card status is shown with text plus color, and KPI values remain readable as text.

## Store Email Subscribers Mobile UX Analysis

Purpose:
`/dashboard/stores/subscribers` helps marketers view storefront newsletter subscribers, filter by store/status/source/date, copy emails, open mailto outreach, and export visible records.

Desktop behavior:
The desktop component uses Material filters, datepickers, header actions, and a wide subscribers table with email, status, store, subscription date, source, device, and actions.

Mobile decisions:
The mobile page leads with total subscribers and visible-page summary metrics. Filters are native touch controls with status chips and a search action. The table becomes subscriber cards that prioritize email, subscription status, store, subscribed date, source, device, referrer, and copy/email actions.

Performance:
The mobile component inherits the existing loading, pagination, copy, export, and service integration. It avoids the desktop table and renders only the current server-paginated subscriber page.

Accessibility:
Search, filters, pagination, copy, email, refresh, and export actions are real buttons or links with touch-sized controls. Subscriber status is shown as text and color.

## Promoter Store Promotions Mobile UX Analysis

Purpose:
`/dashboard/stores/promotions` helps promoters monitor product referral links, copy/share those links, understand clicks and sales, and request admin review for commission release after fulfilled affiliate orders.

Desktop behavior:
The existing desktop component presents broad dashboard metrics, promotion performance, and affiliate order release workflow in a panel layout.

Mobile decisions:
The mobile page now behaves like a promotion control center. It leads with estimated earnings and active link count, then uses compact KPI tiles, thumb-friendly search, health filters, and promotion cards. Each card prioritizes image, store, link health, views, clicks, sales, earnings, click-through progress, and direct copy/share/view actions. Affiliate orders become release-status cards with filters for ready, review, and rejected states.

Performance:
The mobile component keeps the existing dashboard and order service calls, uses signals/computed filters, avoids desktop tables, and only renders proof textareas when a release action is actually available.

Accessibility:
Search, filters, refresh, copy, WhatsApp share, product view, and release actions are real labelled controls. Chips expose pressed state, values remain readable as text, and touch controls are sized for mobile use.

## Notification Center Mobile UX Analysis

Purpose:
`/dashboard/notifications` is the full notification center for campaign, payment, storefront, system, security, community, and gamification updates. It also supports selection, bulk delete, mark-as-read, cursor pagination, category muting, and realtime insertion/update events.

Desktop behavior:
The desktop component keeps a two-column workspace with Material filters, grouped notification rows, bulk actions, and a preferences panel.

Mobile decisions:
The mobile view keeps the existing shared business logic but moves filter and preference controls into bottom sheets so the notification feed remains the primary surface. Search stays visible because it is a frequent action, while status, category, priority, and mute preferences move into touch-friendly chip sheets. Selection, delete, refresh, mark-read, grouped feed cards, skeleton loading, and infinite scroll remain intact.

Performance:
The mobile component extends the existing notification center logic instead of duplicating websocket, cursor pagination, delete, and preference flows. The view avoids desktop form fields on mobile and uses lightweight native buttons/chips.

Accessibility:
Filter and preference sheets use dialog semantics, filters expose pressed state, notifications remain real buttons for open/select behavior, and destructive delete still uses the app confirmation dialog.

## Public Product Details Mobile UX Analysis

Purpose:
Public product details is the buyer and promoter landing page for product discovery, referral tracking, cart actions, direct checkout, store contact, product specifications, reviews, and related products.

Desktop behavior:
The desktop page uses a broad gallery/content layout, inline product forms, detailed sections, related products, and desktop-sized controls.

Mobile decisions:
The mobile page starts with a native app bar, image carousel, product trust/status badges, store identity, rating, price, promotion context, and quick copy/share/promote actions. Quantity, variants, cart feedback, and checkout stay close to the product decision. The checkout form moves into a bottom sheet so the sticky buy bar can remain available without overwhelming the product story.

Performance:
The mobile component reuses the existing product detail data flow and storefront actions. It lazy-loads product media, avoids desktop layout wrappers, keeps the first screen focused on high-signal product data, and only shows the checkout form when the buyer opens it.

Accessibility:
Gallery controls, sticky actions, copy/share/promote buttons, quantity controls, details tabs, and checkout controls are real buttons or form controls with mobile-sized touch targets and readable text labels.

## Public Storefront Landing Mobile UX Analysis

Purpose:
`/store/:storeLink` is the public mobile shop entrance for buyers and promoters. It needs to communicate trust quickly, let users search and filter products, contact the store, share the store, add products to cart, and move into product detail pages.

Desktop behavior:
The desktop storefront uses a large store header, wide controls, featured carousel, grid/list product views, pagination, footer, FABs, and a filter sidebar.

Mobile decisions:
The mobile version treats the page like a native commerce feed. It opens with a sticky app bar, visual store hero, verified/location/rating signals, quick save/contact/share/cart actions, compact stats, a persistent search row, category rail, featured product rail, card-based product feed, bottom-sheet filters, and sticky cart/contact navigation. Pagination becomes progressive "load more" so buyers do not lose their scroll position.

Performance:
The mobile component reuses the existing storefront data, cart, wishlist, search, filter, and share logic. It renders product cards instead of desktop grids/tables, lazy-loads images, slices visible products progressively, and avoids opening filter controls until requested.

Accessibility:
Primary actions are real buttons with labels, search uses a native input, sort uses a native select, filter controls use a modal dialog pattern, and sticky actions keep touch targets at mobile-friendly sizes.

## Public Cart Checkout Mobile UX Analysis

Purpose:
`/cart` is the public storefront checkout surface. It must let buyers review products, adjust quantities, preserve affiliate tracking, choose a store checkout group, provide delivery details, and pay through the existing Paystack flow.

Desktop behavior:
The desktop cart uses a broad hero, store-group cards, inline item rows, and a sticky checkout panel with Material form fields.

Mobile decisions:
The mobile cart is organized around store groups because checkout is intentionally one store at a time. Buyers see an escrow-protected hero, store chips when multiple stores exist, product cards with quantity controls, affiliate-sale labels, clear-store and checkout actions, a sticky checkout bar, and a bottom-sheet checkout form. The form uses native mobile inputs/selects for speed and better low-end Android behavior while preserving the same validation and checkout logic.

Performance:
The mobile component extends the existing cart component, so it reuses cart grouping, quantity updates, currency quotes, Paystack initiation, payment confirmation, and cart clearing. It avoids Material form-field overhead on the mobile presentation and renders only the active checkout sheet when needed.

Accessibility:
All quantity, remove, checkout, close, continue-shopping, and store-selection controls are real labelled buttons. Checkout uses native inputs with autocomplete hints, and the bottom sheet uses dialog semantics.

## Marketer Product Management Mobile UX Analysis

Purpose:
`/dashboard/stores/:storeId/products` is where marketers manage their storefront inventory, edit products, monitor stock, publish or unpublish products for promoter discovery, and delete stale products.

Desktop behavior:
The desktop product manager uses a large dashboard header, grid/list controls, Material tables, hover overlays, desktop filters, bulk actions, and paginator controls.

Mobile decisions:
The mobile version treats the screen as an inventory control center. It opens with a compact app bar, store inventory hero, horizontal KPI cards, persistent search, thumb-sized status/category chips, and product cards. Each card prioritizes image, active/published state, price, stock health, views, sales, clicks, conversion, commission, and direct view/edit/publish actions. Advanced filters and destructive actions move into bottom sheets to keep the feed scannable.

Performance:
The mobile route reuses the existing store-product data loader and the existing product management mutation methods. It avoids Material tables on mobile, renders only the active page of cards, lazy-loads images, and keeps bulk operations tied to the existing selection model.

Accessibility:
Navigation, search, filters, selection, publish, unpublish, edit, view, and delete are real controls with labelled actions. Bottom sheets use dialog semantics, and mobile controls are sized for touch use.

## Marketer Product Creation Mobile UX Analysis

Purpose:
`/dashboard/stores/:storeId/products/create` lets marketers add storefront products with images, category details, price, stock, promoter commission, shipping or digital delivery settings, SEO metadata, visibility, and final publishing.

Desktop behavior:
The desktop component uses a multi-step Material form and child sections for details, pricing, shipping, promotions, SEO, and review. It already owns the validated reactive form, image handling, and create-product submit logic.

Mobile decisions:
The mobile version keeps the existing form and submit path but redesigns the presentation as a native wizard. It leads with a compact app bar, progress summary, horizontal step rail, large touch fields, image preview rail, quick tag chips, commission preview, delivery mode controls, SEO/visibility controls, and a final review card. Cancel confirmation moves into a bottom sheet instead of using a browser confirm.

Performance:
The mobile component extends the existing product creation logic so the create API path, validation, image handling, and payload structure stay aligned with desktop. It avoids loading the desktop child form sections on mobile and renders only one step at a time to keep DOM size low.

Accessibility:
Steps, inputs, image controls, cancel confirmation, and publish actions use labelled native controls. The sticky action bar keeps primary navigation reachable by thumb, and the discard confirmation sheet uses dialog semantics.

## Marketer Product Editing Mobile UX Analysis

Purpose:
`/dashboard/stores/:storeId/products/edit/:productId` lets marketers safely update an existing product without losing current product history, existing media, promoter commission settings, stock state, SEO, visibility, or delivery configuration.

Desktop behavior:
The desktop edit component reuses the add-product child form sections and owns product loading, form population, existing-image tracking, removed-image tracking, and the `updateProduct` submit path.

Mobile decisions:
The mobile version keeps that same loading, form population, and update API behavior while presenting the edit task as a phone-first wizard. Existing images and newly selected images are shown in one rail, with saved images marked and removals tracked through the existing `removedImages` flow. The review step calls out removed saved photos before update so marketers do not accidentally delete media.

Performance:
The mobile edit component extends the existing edit logic and only changes presentation. It avoids loading the desktop child form sections on mobile, renders one step at a time, and reuses the product creation mobile styles with small edit-specific overrides to keep CSS and layout behavior consistent.

Accessibility:
The mobile edit flow uses labelled inputs, native selects, real buttons, dialog semantics for leave confirmation, and sticky thumb actions for back/continue/update. Existing-image removal and final update are explicit touch controls.

## Marketer Product Detail Mobile UX Analysis

Purpose:
`/dashboard/stores/:storeId/products/:productId` lets marketers inspect one storefront product, review pricing, inventory, delivery, SEO, variants, and promotion performance, then quickly edit, preview, copy the public link, or delete the product.

Desktop behavior:
The desktop component uses a broad management layout with breadcrumb header, large stats bar, image gallery, quick info cards, pricing sections, product details, specifications, variants table, shipping information, and menu-based actions.

Mobile decisions:
The mobile page is a gallery-first product control surface. It leads with the product image, live/stock status, price, and primary KPIs. Desktop side sections become touch-friendly management cards that open bottom sheets for overview, pricing, inventory, promotion, delivery, variants, and SEO. Edit, preview, copy link, and delete remain available through quick actions and a sticky action bar.

Performance:
The mobile component extends the existing product detail component so product loading, image viewer, edit navigation, delete confirmation, and permission-sensitive API paths remain unchanged. The mobile view avoids the desktop grid/table surface, renders compact cards by default, and only creates dense detail content when a bottom sheet is opened.

Accessibility:
The mobile page uses labelled navigation buttons, real links for public preview, real buttons for copy/edit/delete, dialog semantics for bottom sheets, text status labels in addition to color, and touch-sized sticky actions.

## Marketer Store Dashboard Mobile UX Analysis

Purpose:
`/dashboard/stores` is the marketer's storefront command center. It helps store owners select a store, understand storefront health, act on low stock, add products, preview the public store, and jump into orders, analytics, subscribers, and buyer CRM.

Desktop behavior:
The desktop route switches by user role and sends marketers into `MarketerStoreDashboardComponent`, which owns store loading, current-store selection, product loading, quick actions, filters, metrics, auto-refresh, and navigation. The desktop template still uses header/control-bar patterns and Material-heavy controls.

Mobile decisions:
The mobile version keeps that same dashboard logic but reshapes it as a native store management home. The first screen prioritizes store identity, verification/status, add-product and preview actions, KPI rail, revenue/product-health summary, low-stock warning, and quick action tiles. Store switching, product filters, action toggles, and stock attention move into bottom sheets so the main view stays scannable and thumb-friendly.

Performance:
The mobile component extends the existing dashboard class, preserving store/product service calls and mutations. It avoids rendering desktop control bars and child dashboard surfaces on mobile, keeps product preview to five records, and creates sheet content only when opened.

Accessibility:
Store switching, filtering, quick actions, product links, and sticky actions are real labelled controls. Status uses text plus icon, bottom sheets use dialog semantics, and the primary touch targets are sized for mobile use.

## Promoter Store Browser Mobile UX Analysis

Purpose:
`/dashboard/stores` is also the promoter's storefront discovery surface. It helps promoters find verified stores, compare available product volume, assess promoter traffic and commission potential, follow useful stores, open product lists, and preview public storefronts before choosing what to promote.

Desktop behavior:
The existing promoter branch renders a desktop store list with header, sidebar filters, content views, pagination, and store follow/product navigation. It owns store loading, filter state, search, pagination, sort, and follow mutations.

Mobile decisions:
The mobile version keeps the existing store-list logic but turns discovery into a feed. The first screen prioritizes search, category chips, total/verified/following counts, quick sort and insight controls, premium store picks, and store cards with product previews. Dense filters, sort choices, and top-store insights move into bottom sheets so promoters can browse with one hand without table or sidebar pressure.

Performance:
The mobile component extends the existing promoter store list class, preserving API calls, filter state, pagination, and follow behavior. It limits featured and product preview rails, lazy-loads store/product images, and only renders bottom-sheet content when requested.

Accessibility:
Search, filters, sorting, follow, product browsing, public store visits, pagination, and sheet close actions are real labelled controls. Store status uses text with icons, bottom sheets use dialog semantics, and thumb actions meet mobile touch sizing.

## Marketer Store Creation Mobile UX Analysis

Purpose:
`/dashboard/stores/create` lets marketers create a storefront, upload a required logo, define the store category and description, confirm WhatsApp contact details, and create the default storefront settings that later support products and promoter commissions.

Desktop behavior:
The desktop component uses a two-column Material form with store information, contact information, logo upload, preview, help tips, and submit overlay. It owns validation, logo upload/preview, default store settings, and the `createStore` submit path.

Mobile decisions:
The mobile view keeps the existing form, validation, logo handling, and submit behavior but presents setup as a native three-step wizard: Brand, Contact, and Review. Logo upload becomes a large touch target with initials fallback, help content becomes compact trust tips, and the preview becomes a mobile storefront card. Browser confirm is replaced with a bottom-sheet discard confirmation.

Performance:
The mobile component extends the existing create component and avoids Material form-field/card overhead on mobile. It renders only one step at a time, uses native inputs/selects, and keeps submit/loading feedback lightweight.

Accessibility:
All navigation, upload, remove-logo, cancel, continue, and create actions are real labelled controls with 48px touch targets. The leave confirmation uses dialog semantics and the loading state announces progress with readable text.

## Marketer Store Editing Mobile UX Analysis

Purpose:
`/dashboard/stores/edit/:id` lets marketers update an existing storefront name, category, description, and logo without breaking live store ownership, product associations, or promoter-facing storefront links.

Desktop behavior:
The desktop component uses a two-column Material edit form with store data loading, logo preview, file validation, optional logo replacement, logo removal, and the existing `updateStore` submit path.

Mobile decisions:
The mobile view keeps the existing load, validation, image preview, and update behavior but presents the task as a three-step wizard: Identity, Logo, and Review. Logo editing is explicit: keep the current logo, replace it with a new file, or remove it so the store falls back to initials. Browser confirm is replaced with a bottom-sheet discard confirmation.

Performance:
The mobile component extends the existing edit component, so it does not duplicate the API path or payload rules. It renders one step at a time, uses native inputs/selects, and reuses the store creation mobile CSS foundation with edit-specific overrides.

Accessibility:
The mobile edit flow uses labelled fields, native selects, real buttons, touch-sized upload/remove controls, loading announcements, and a dialog-style discard sheet. The sticky action bar keeps navigation and save actions reachable on one-handed mobile use.

## Storefront Customer Support Mobile UX Analysis

Purpose:
`/dashboard/stores/support` helps marketers review storefront buyers, understand customer value, track lifecycle/segment state, prepare email or SMS follow-ups, export buyer lists, and update internal CRM notes.

Desktop behavior:
The desktop component uses a wide Buyer CRM workspace with summary cards, Material filters, selection toolbar, customer cards, an outreach composer column, and a sticky customer detail panel with purchase history and metadata editing.

Mobile decisions:
The mobile view keeps the existing service calls, selection model, export, copy, email/SMS draft, and detail save behavior. It presents the CRM as a mobile app screen with a compact app bar, KPI rail, buyer cards, thumb filters, selected-audience toolbar, and pagination. Dense desktop side panels move into bottom sheets: advanced filters, outreach composer, and customer profile/order history.

Performance:
The mobile component extends the existing customer support component and renders only the active mobile surfaces instead of the full desktop two-column workspace. Detail and composer controls are created only when their sheets are open, keeping the default buyer feed lighter on low-end devices.

Accessibility:
Search, filters, selection, customer profile, email, SMS, copy, export, pagination, and save actions use labelled native controls or real buttons. Bottom sheets use dialog semantics, and touch controls are sized for mobile use.

## Implementation Pattern Used

Files added:

```text
projects/platform/src/app/transactions/mobile/index.component.ts
projects/platform/src/app/transactions/mobile/index.component.html
projects/platform/src/app/transactions/mobile/index.component.scss
projects/platform/src/app/marketer/marketing-landing/mobile/marketer-landing-mobile.component.ts
projects/platform/src/app/marketer/marketing-landing/mobile/marketer-landing-mobile.component.html
projects/platform/src/app/marketer/marketing-landing/mobile/marketer-landing-mobile.component.scss
projects/platform/src/app/promoter/promoter-landing/mobile/promoter-landing-mobile.component.ts
projects/platform/src/app/promoter/promoter-landing/mobile/promoter-landing-mobile.component.html
projects/platform/src/app/promoter/promoter-landing/mobile/promoter-landing-mobile.component.scss
projects/platform/src/app/promoter/promotion/index.ts
projects/platform/src/app/promoter/promotion/mobile/promotion-mobile.component.ts
projects/platform/src/app/promoter/promotion/mobile/promotion-mobile.component.html
projects/platform/src/app/promoter/promotion/mobile/promotion-mobile.component.scss
projects/platform/src/app/promoter/promotion/components/promotion-card/mobile/promotion-card-mobile.component.ts
projects/platform/src/app/promoter/promotion/components/promotion-card/mobile/promotion-card-mobile.component.html
projects/platform/src/app/promoter/promotion/components/promotion-card/mobile/promotion-card-mobile.component.scss
projects/platform/src/app/campaign/analytics/index.ts
projects/platform/src/app/campaign/analytics/mobile/campaign-analytics-mobile.component.ts
projects/platform/src/app/campaign/analytics/mobile/campaign-analytics-mobile.component.html
projects/platform/src/app/campaign/analytics/mobile/campaign-analytics-mobile.component.scss
projects/platform/src/app/store/marketer/promoted-products-analytics/index.ts
projects/platform/src/app/store/marketer/promoted-products-analytics/mobile/marketer-promoted-products-analytics-mobile.component.ts
projects/platform/src/app/store/marketer/promoted-products-analytics/mobile/marketer-promoted-products-analytics-mobile.component.html
projects/platform/src/app/store/marketer/promoted-products-analytics/mobile/marketer-promoted-products-analytics-mobile.component.scss
projects/platform/src/app/store/marketer/subscribers/index.ts
projects/platform/src/app/store/marketer/subscribers/mobile/store-subscribers-mobile.component.ts
projects/platform/src/app/store/marketer/subscribers/mobile/store-subscribers-mobile.component.html
projects/platform/src/app/store/marketer/subscribers/mobile/store-subscribers-mobile.component.scss
projects/platform/src/app/store/promoter/products-list/index.ts
projects/platform/src/app/store/promoter/products-list/mobile/index.component.ts
projects/platform/src/app/store/promoter/products-list/mobile/index.component.html
projects/platform/src/app/store/promoter/products-list/mobile/index.component.scss
projects/platform/src/app/store/orders/index.ts
projects/platform/src/app/store/orders/mobile/index.component.ts
projects/platform/src/app/store/orders/mobile/index.component.html
projects/platform/src/app/store/orders/mobile/index.component.scss
projects/platform/src/app/store/promoter/promoted-products/mobile/mobile-promoted-products.component.ts
projects/platform/src/app/store/promoter/promoted-products/mobile/mobile-promoted-products.component.html
projects/platform/src/app/store/promoter/promoted-products/mobile/mobile-promoted-products.component.scss
projects/platform/src/app/dashboard/notification/notification-center/mobile/index.component.ts
projects/platform/src/app/dashboard/notification/notification-center/mobile/index.component.html
projects/platform/src/app/dashboard/notification/notification-center/mobile/index.component.scss
projects/platform/src/app/storefront/product-details/main/index.ts
projects/platform/src/app/storefront/product-details/main/mobile/product-details-mobile.component.ts
projects/platform/src/app/storefront/product-details/main/mobile/product-details-mobile.component.html
projects/platform/src/app/storefront/product-details/main/mobile/product-details-mobile.component.scss
projects/platform/src/app/storefront/index.ts
projects/platform/src/app/storefront/mobile/storefront-mobile.component.ts
projects/platform/src/app/storefront/mobile/storefront-mobile.component.html
projects/platform/src/app/storefront/mobile/storefront-mobile.component.scss
projects/platform/src/app/storefront/cart/index.ts
projects/platform/src/app/storefront/cart/mobile/storefront-cart-mobile.component.ts
projects/platform/src/app/storefront/cart/mobile/storefront-cart-mobile.component.html
projects/platform/src/app/storefront/cart/mobile/storefront-cart-mobile.component.scss
projects/platform/src/app/store/marketer/products/product-list/index.ts
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-mobile.component.ts
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-mobile.component.html
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-mobile.component.scss
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-management-mobile.component.ts
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-management-mobile.component.html
projects/platform/src/app/store/marketer/products/product-list/mobile/marketer-product-list-management-mobile.component.scss
projects/platform/src/app/store/marketer/products/add-products/index.ts
projects/platform/src/app/store/marketer/products/add-products/mobile/add-product-mobile.component.ts
projects/platform/src/app/store/marketer/products/add-products/mobile/add-product-mobile.component.html
projects/platform/src/app/store/marketer/products/add-products/mobile/add-product-mobile.component.scss
projects/platform/src/app/store/marketer/products/edit-product/index.ts
projects/platform/src/app/store/marketer/products/edit-product/mobile/edit-product-mobile.component.ts
projects/platform/src/app/store/marketer/products/edit-product/mobile/edit-product-mobile.component.html
projects/platform/src/app/store/marketer/products/edit-product/mobile/edit-product-mobile.component.scss
projects/platform/src/app/store/marketer/products/product-detail/index.ts
projects/platform/src/app/store/marketer/products/product-detail/mobile/marketer-product-detail-mobile.component.ts
projects/platform/src/app/store/marketer/products/product-detail/mobile/marketer-product-detail-mobile.component.html
projects/platform/src/app/store/marketer/products/product-detail/mobile/marketer-product-detail-mobile.component.scss
projects/platform/src/app/store/marketer/dashboard/store-dashboard/mobile/store-dashboard-mobile.component.ts
projects/platform/src/app/store/marketer/dashboard/store-dashboard/mobile/store-dashboard-mobile.component.html
projects/platform/src/app/store/marketer/dashboard/store-dashboard/mobile/store-dashboard-mobile.component.scss
projects/platform/src/app/store/promoter/stores-list/mobile/promoter-stores-list-mobile.component.ts
projects/platform/src/app/store/promoter/stores-list/mobile/promoter-stores-list-mobile.component.html
projects/platform/src/app/store/promoter/stores-list/mobile/promoter-stores-list-mobile.component.scss
projects/platform/src/app/store/marketer/store-create/index.ts
projects/platform/src/app/store/marketer/store-create/mobile/store-create-mobile.component.ts
projects/platform/src/app/store/marketer/store-create/mobile/store-create-mobile.component.html
projects/platform/src/app/store/marketer/store-create/mobile/store-create-mobile.component.scss
projects/platform/src/app/store/marketer/edit-store/index.ts
projects/platform/src/app/store/marketer/edit-store/mobile/store-edit-mobile.component.ts
projects/platform/src/app/store/marketer/edit-store/mobile/store-edit-mobile.component.html
projects/platform/src/app/store/marketer/edit-store/mobile/store-edit-mobile.component.scss
projects/platform/src/app/store/marketer/customer-support/index.ts
projects/platform/src/app/store/marketer/customer-support/mobile/customer-support-mobile.component.ts
projects/platform/src/app/store/marketer/customer-support/mobile/customer-support-mobile.component.html
projects/platform/src/app/store/marketer/customer-support/mobile/customer-support-mobile.component.scss
```

Files updated:

```text
projects/platform/src/app/transactions/index.ts
projects/platform/src/app/campaign/campaign.component.ts
projects/platform/src/app/campaign/campaign.routes.ts
projects/platform/src/app/store/index.ts
projects/platform/src/app/store/store.routes.ts
projects/platform/src/app/store/promoter/promoted-products/index.ts
projects/platform/src/app/app.routes.ts
```

The desktop `TransactionComponent` is unchanged. The wrapper now renders `MobileTransactionsComponent` for mobile/tablet and the existing `TransactionComponent` for desktop.

The desktop `PromoterProductsListComponent` is unchanged. The new product-list wrapper renders `MobilePromoterProductsListComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `StorefrontOrdersComponent` is unchanged. The new orders wrapper renders `MobileStorefrontOrdersComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `MarketerLandingComponent` and `PromoterLandingComponent` are unchanged. The campaign role switcher now renders `MarketerLandingMobileComponent` or `PromoterLandingMobileComponent` for mobile/tablet and keeps the existing desktop components for desktop.

The desktop `PromotionComponent` is unchanged. The new promotion wrapper renders `PromotionMobileComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `CampaignAnalyticsComponent` is unchanged. The new analytics wrapper renders `CampaignAnalyticsMobileComponent` for mobile/tablet and keeps the existing desktop analytics workspace for desktop.

The desktop `MarketerPromotedProductsAnalyticsComponent` is unchanged. The new promoted-products analytics wrapper renders `MarketerPromotedProductsAnalyticsMobileComponent` for mobile/tablet and keeps the existing desktop analytics workspace for desktop.

The desktop `StoreEmailSubscribersComponent` is unchanged. The new subscribers wrapper renders `StoreEmailSubscribersMobileComponent` for mobile/tablet and keeps the existing desktop subscribers table for desktop.

The desktop promoted-products page under `/dashboard/stores/promotions` is unchanged. Its mobile component now handles mobile/tablet users with native cards, filters, and release-request presentation.

The desktop public `ProductDetailsComponent` is unchanged. The product details route wrapper now renders `MobileProductDetailsComponent` for mobile/tablet and keeps the existing desktop product page for desktop.

The desktop public `StorefrontComponent` is unchanged. The storefront route wrapper now renders `MobileStorefrontComponent` for mobile/tablet and keeps the existing desktop storefront for desktop.

The desktop public `StorefrontCartComponent` is unchanged. The cart route wrapper now renders `MobileStorefrontCartComponent` for mobile/tablet and keeps the existing desktop cart/checkout for desktop.

The desktop marketer `MarketerProductListComponent` and `MarketerProductListManagementComponent` are unchanged. The new product-list wrapper renders `MarketerProductListMobileComponent` for mobile/tablet and keeps the existing desktop product manager for desktop.

The desktop marketer `AddProductComponent` is unchanged. The new add-product wrapper renders `AddProductMobileComponent` for mobile/tablet and keeps the existing desktop product creation flow for desktop.

The desktop marketer `EditProductComponent` is unchanged. The new edit-product wrapper renders `EditProductMobileComponent` for mobile/tablet and keeps the existing desktop product editing flow for desktop.

The desktop marketer `MarketerProductDetailComponent` is unchanged. The new product-detail wrapper renders `MarketerProductDetailMobileComponent` for mobile/tablet and keeps the existing desktop product detail workspace for desktop.

The desktop marketer `MarketerStoreDashboardComponent` is unchanged. The store route now renders `MarketerStoreDashboardMobileComponent` for marketer mobile/tablet users and keeps the existing dashboard for desktop.

The desktop promoter `PromoterStoresListComponent` is unchanged. The store route now renders `PromoterStoresListMobileComponent` for promoter mobile/tablet users and keeps the existing store list for desktop.

The desktop marketer `StoreCreateComponent` is unchanged. The new store-create wrapper renders `StoreCreateMobileComponent` for mobile/tablet and keeps the existing desktop store creation flow for desktop.

The desktop marketer `StoreEditComponent` is unchanged. The new store-edit wrapper renders `StoreEditMobileComponent` for mobile/tablet and keeps the existing desktop store editing flow for desktop.

The desktop marketer `CustomerSupportComponent` is unchanged. The new customer-support wrapper renders `CustomerSupportMobileComponent` for mobile/tablet and keeps the existing desktop Buyer CRM for desktop.

## Remaining Migration Notes

Product management is now covered for the core list/manage route, product creation flow, product editing flow, and product detail workspace. The marketer storefront dashboard, promoter store browsing, store creation, store editing, and storefront customer support are also covered. The next passes should focus on settings, assistant/resources/tutorial content, legal pages, and other dense desktop-first dashboard pages.
