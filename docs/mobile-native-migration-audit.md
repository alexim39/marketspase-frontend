# MarketSpase Mobile-Native Migration Audit

Last updated: 2026-05-31

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
| Campaign index | Has device-aware wrapper | Campaign landing, creation, and details now have dedicated mobile/tablet experiences; other campaign workspaces can continue incrementally. |
| Transactions | Converted in this pass | Mobile/tablet now use a dedicated mobile component; desktop table remains untouched. |
| Wallet transfer | Converted in this pass | `/dashboard/transactions/transfer` now uses a device-aware wrapper; mobile/tablet users get a step-based transfer flow with balance hero, recipient search, quick amounts, review, and sticky confirmation. |
| Wallet withdrawal | Converted in this pass | `/dashboard/transactions/withdrawal` now uses a device-aware wrapper; mobile/tablet users get a balance-first payout wizard, bank and saved-account bottom sheets, amount preview, payout review, and sticky submit. |
| Wallet funding dialog | Converted in this pass | The shared wallet funding dialog now uses a device-aware wrapper; mobile/tablet users get a native top-up flow with balance hero, quick amounts, currency sheet, payment review, status state, and payment tips. |
| Promoter product discovery | Converted in this pass | `/dashboard/stores/products` now uses a dedicated mobile component with cards and bottom-sheet filters. |
| Promoter product detail | Converted in this pass | `/dashboard/stores/product/:productId` now uses a device-aware wrapper; mobile/tablet users get a gallery-first product promotion page with commission summary, unique-link actions, store trust signals, and sticky share controls. |
| Promoter store product shelf | Converted in this pass | `/dashboard/stores/store/:storeId/products` now uses a device-aware wrapper; mobile/tablet users get a native store shelf with store hero, search, category rail, product cards, filter/sort sheets, promotion-link copy, WhatsApp, and buy actions. |
| Storefront orders | Converted in this pass | `/dashboard/stores/orders` now uses mobile order cards and bottom-sheet release/review actions. |
| Campaign landing | Converted in this pass | `/dashboard/campaigns` now routes mobile/tablet users to dedicated marketer/promoter mobile landing wrappers. |
| Campaign creation | Converted in this pass | `/dashboard/campaigns/create` now uses a device-aware wrapper; mobile/tablet users get a native PPC setup wizard with sticky step progress, budget snapshot, child form reuse, and bottom launch actions. |
| Campaign details | Converted in this pass | `/dashboard/campaigns/:id` now uses a device-aware wrapper; mobile/tablet users get a media-first campaign control room with budget progress, KPI rail, quick actions, promotion cards, and activity timeline. |
| Campaign editing | Converted in this pass | `/dashboard/campaigns/edit/:id` now uses a device-aware wrapper; mobile/tablet users get a native section editor with campaign context, section rail, sticky save controls, and bottom-sheet discard prompts. |
| Campaign targeting | Converted in this pass | `/dashboard/campaigns/:id/targeting` now uses a device-aware wrapper; mobile/tablet users get a native location-targeting workspace with campaign context, selected-area summary, warning states, and sticky save actions. |
| Campaign collaboration | Converted in this pass | `/dashboard/campaigns/collaboration` now uses a device-aware wrapper; mobile/tablet users get a native collaboration workbench with home, threads, chat, starter cards, realtime conversation reuse, and compact composer. |
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
| Settings shell | Converted in this pass | `/dashboard/settings` now uses a native mobile/tablet shell with account snapshot, profile health, shortcut cards, horizontal settings tabs, recent activity, and WhatsApp channel action while preserving existing child settings routes. |
| Account settings | Converted in this pass | `/dashboard/settings/account` now uses a device-aware wrapper; mobile/tablet users get a profile-strength header, account summary cards, section cards, sticky mobile tabs, and one-at-a-time personal/professional/public identity forms. |
| System settings | Converted in this pass | `/dashboard/settings/system` now uses a device-aware wrapper; mobile/tablet users get a native preferences hub with notification/theme summary cards, section cards, sticky tabs, and one-at-a-time notification/theme controls. |
| Support settings | Converted in this pass | `/dashboard/settings/support` now uses a device-aware wrapper; mobile/tablet users get a native support center with WhatsApp quick actions, support summary cards, section cards, sticky tabs, and one-at-a-time contact/testimonial flows. |
| Ads preferences | Converted in this pass | `/dashboard/settings/ads/preferences` now uses a device-aware wrapper; mobile/tablet users get a native ad-control center with relevance scoring, location/interest toggles, category picker cards, guidance, and sticky save/discard actions. |
| Tutorials learning center | Converted in this pass | `/dashboard/tutorials/videos` now uses a device-aware wrapper; mobile/tablet users get a native learning feed with search, category rail, featured lesson, recently watched rail, bottom-sheet filters/sections, and lesson cards. |
| Public help center | Converted in this pass | `/resources/help-center` now uses a device-aware wrapper; mobile/tablet users get a native support hub with touch search, topic rail, guide cards, FAQ cards, contact sheets, and learning shortcuts. |
| Public about | Converted in this pass | `/resources/about` now uses a device-aware wrapper; mobile/tablet users get a native trust story with mission cards, platform proof, PPC-aligned workflow rows, feature sheets, and CTA actions. |
| Public success stories | Converted in this pass | `/resources/success-stories` now uses a device-aware wrapper; mobile/tablet users get a native proof feed with role filters, featured story, story detail sheets, impact cards, and industry insight sheets. |
| Public community | Converted in this pass | `/resources/community` now uses a device-aware wrapper; mobile/tablet users get a native community hub with group rails, discussion/tip/event/mentor tabs, detail sheets, and sign-in actions. |
| Public careers | Converted in this pass | `/resources/careers` now uses a device-aware wrapper; mobile/tablet users get a native hiring hub with benefit rails, culture rows, department filters, job cards, process sheets, and talent-pool CTAs. |
| Public marketer solution | Converted in this pass | `/resources/solutions/marketers` now uses a device-aware wrapper; mobile/tablet users get a PPC-aligned marketer guide with campaign flow cards, tracked-link feature sheets, use-case tabs, pricing details, and CTA actions. |
| Public promoter solution | Converted in this pass | `/resources/solutions/promoters` now uses a device-aware wrapper; mobile/tablet users get a PPC-aligned promoter guide with unique-link education, responsible sharing flow, account-health warnings, opportunity cards, and FAQ sheets. |
| Public features | Converted in this pass | `/resources/features` now uses a device-aware wrapper; mobile/tablet users get a native feature explorer with category rails, focused feature rows, workflow cards, pricing rail, and feature-detail sheets. |
| Public FAQ | Converted in this pass | `/resources/faqs` now uses a device-aware wrapper; mobile/tablet users get a native answer finder with search chips, topic rail, featured questions, answer sheets, helpful feedback, and support shortcuts. |
| Public contact | Converted in this pass | `/resources/contact` now uses a device-aware wrapper; mobile/tablet users get a native support flow with channel cards, step-based message form, urgent WhatsApp action, team cards, and FAQ sheet. |
| Public how it works | Converted in this pass | `/resources/how-it-works` now uses a device-aware wrapper; mobile/tablet users get a native onboarding explainer with role cards, process timeline, quick guides, trust-feature rail, demo sheet, and CTA strip. |
| Public benefits | Converted in this pass | `/resources/benefits` now uses a device-aware wrapper; mobile/tablet users get a native benefit picker with business/promoter/platform rails, focused benefit cards, detail sheets, and CTA actions. |
| Public legal shell | Converted in this pass | `/legal/*` now uses a device-aware parent shell; mobile/tablet users get a sticky legal top bar, Back to App action, and horizontal legal tabs while desktop keeps the side-menu shell. |
| Public cookies policy | Converted in this pass | `/legal/cookies` now uses a device-aware wrapper; mobile/tablet users get a native cookies explainer with topic cards, browser-control guidance, external cookie education, and legal shortcuts. |
| Public terms of service | Converted in this pass | `/legal/terms` now uses a device-aware wrapper; mobile/tablet users get a native terms reader with agreement topic cards, conduct rules, privacy shortcut, and contact actions. |
| Public privacy policy | Converted in this pass | `/legal/privacy` now uses a device-aware wrapper; mobile/tablet users get a native policy reader with summary cards, topic sheets, rights guidance, and contact actions. |
| AI assistant overview | Converted in this pass | `/dashboard/assistant/customer/overview` now uses a device-aware wrapper; mobile/tablet users get a native assistant control room with status toggle, KPI rail, setup sheet, test-reply sheet, quick actions, and conversation cards. |
| AI assistant FAQs | Converted in this pass | `/dashboard/assistant/customer/faqs` now uses a device-aware wrapper; mobile/tablet users get a native FAQ trainer with coverage score, search, category rail, FAQ cards, add/edit sheets, filter sheet, and delete confirmation sheet. |
| AI assistant conversations | Converted in this pass | `/dashboard/assistant/customer/conversations` now uses a device-aware wrapper; mobile/tablet users get a native chat inbox with KPI rail, search, filters, full-screen chat, sticky composer, quick actions, lead tagging, and action sheets. |
| AI assistant automation | Converted in this pass | `/dashboard/assistant/customer/automation` now uses a device-aware wrapper; mobile/tablet users get a native automation control center with AI status, setting summaries, section sheets, link management, and sticky save/reset actions. |
| AI assistant analytics | Converted in this pass | `/dashboard/assistant/customer/analytics` now uses a device-aware wrapper; mobile/tablet users get a native analytics view with sticky refresh, swipeable KPI cards, compact metric grid, mobile conversation chart, AI-vs-human mix, and conversion signal summaries. |
| AI assistant settings | Converted in this pass | `/dashboard/assistant/customer/settings` now uses a device-aware wrapper; mobile/tablet users get a native settings hub with setup health, section chips, WhatsApp cards, business binding, alert preferences, plan cards, Twilio credential form, and bottom-sheet removal confirmation. |
| Dashboard global search | Converted in this pass | `/dashboard/search` now uses a device-aware wrapper; mobile/tablet users get a native search surface with sticky header, large search input, entity rail, filter sheet, result cards, metric strips, export action, and mobile pagination. |
| Dashboard leaderboard | Converted in this pass | `/dashboard/leaderboard` now uses a device-aware wrapper; mobile/tablet users get a native rankings page with reward summary, champion card, podium rail, bottom-sheet filters, and profile-ready rank cards. |
| Dashboard gamification | Converted in this pass | `/dashboard/gamification` now uses a device-aware wrapper; mobile/tablet users get a native rewards journey with level progress, XP summary, milestone rails, action breakdown cards, recent wins, and activity feed. |
| Dashboard home | Converted in this pass | `/dashboard` now uses a device-aware wrapper; mobile/tablet users get a native home feed with greeting, KPI hero, quick actions, stat rail, reward shortcuts, community actions, wallet activity, trends, connections, learning, and bottom navigation. |
| Dashboard profile | Converted in this pass | `/dashboard/profile` and `/dashboard/profile/:id` now use a device-aware wrapper; mobile/tablet users get a native trust profile with cover hero, stat rail, section tabs, posts, network, badges, collaboration reputation, and sticky profile actions. |
| Daily check-in | Converted in this pass | The embedded dashboard streak prompt now uses a device-aware wrapper; mobile/tablet users get a compact bottom dock and bottom-sheet reward flow while desktop keeps the existing floating chip/modal. |
| Community discussion forum | Converted in this pass | `/dashboard/community/discussion` and its list/search/tag/category variants now use a device-aware wrapper; mobile/tablet users get a native forum entry with app bar, community stat rail, search, topic chips, insight sheets, compact pagination, and sticky compose action. |
| Community thread detail | Converted in this pass | `/dashboard/community/discussion/:threadId` now uses a device-aware wrapper; mobile/tablet users get a native thread reader with author card, engagement rail, media rail, poll voting, comments, and sticky reply/like/follow actions. |
| Community feed | Has mobile feed component | Social feed pattern already exists. |
| Community feed composer | Converted in this pass | `/dashboard/community/feeds/create` and `/dashboard/community/feeds/edit/:id` now use a device-aware wrapper; mobile/tablet users get a touch-first composer with source cards, media rail, advanced hashtag/challenge controls, preview sheet, and sticky publish action. |
| Public feed post viewer | Converted in this pass | `/feed/:postId` now uses a device-aware wrapper; mobile/tablet users get a native public post viewer with stable loading skeletons, post card, share actions, and sticky comment/open-app controls. |
| Public referral capture | Converted in this pass | `/ref/:username` now uses a device-aware wrapper; mobile/tablet users get a native invite confirmation flow with stable loading, referral outcome messaging, trust notes, and sticky signup actions. |
| Public campaign unavailable | Converted in this pass | `/campaigns/unavailable` now uses a device-aware wrapper; mobile/tablet users get a native recovery screen with reason-specific styling, safe redirect explanation, seller contact, and sticky next actions. |
| Get started onboarding | Converted in this pass | `/dashboard/get-started/onboarding` now uses a device-aware wrapper; mobile/tablet users get a native setup guide with role cards, checklist progress, video links, FAQ chips, and sticky next-step actions. |
| AI assistant shell | Converted in this pass | `/dashboard/assistant/customer/*` now uses a device-aware parent shell; mobile/tablet users get a native assistant app bar, section rail, bottom navigation, and safe-area content frame around existing assistant child pages. |
| Promoter landing | Has several mobile child components | Campaign cards and filters have mobile variants. |
| Marketer campaign landing | Has several mobile child components | Campaign stats, cards, and filters have mobile variants. |

## Priority Order

The migration should start with routes that are used often, affect money movement, or contain dense desktop tables.

| Priority | Route / Feature | Mobile goal |
| --- | --- | --- |
| P0 | `/dashboard/transactions` | Wallet balance first, transaction cards, thumb filters, summary FAB. Completed in this pass. |
| P0 | `/dashboard/transactions/transfer` | Mobile transfer wizard with wallet balance first, recipient search, amount shortcuts, review step, and sticky transfer action. Completed in this pass. |
| P0 | `/dashboard/transactions/withdrawal` | Mobile payout wizard with bank account resolution, quick amounts, fee/take-home preview, saved-account sheet, and review step. Completed in this pass. |
| P0 | Wallet funding dialog | Mobile funding flow with balance-first layout, amount shortcuts, currency selection sheet, payment review, and Paystack status state. Completed in this pass. |
| P0 | `/dashboard/stores/products` | Mobile product discovery cards, search chips, bottom-sheet filters, promotion/share/copy actions. Completed in this pass. |
| P0 | `/dashboard/stores/product/:productId` | Mobile product promotion detail with image-first layout, commission clarity, unique-link/WhatsApp/share actions, and store trust details. Completed in this pass. |
| P0 | `/dashboard/stores/store/:storeId/products` | Mobile store product shelf with store hero, product cards, category rail, filters, sort sheet, and promotion/share/buy actions. Completed in this pass. |
| P0 | `/dashboard/stores/orders` | Order cards grouped by status, buyer/promoter context, fulfillment quick actions. Completed in this pass. |
| P0 | `/dashboard/campaigns` | Campaign social cards, budget/progress summary, mobile action tray. Completed in this pass. |
| P1 | `/dashboard/campaigns/create` | Native campaign setup wizard with media/content first, wallet-aware budget snapshot, schedule, review, and sticky draft/launch actions. Completed in this pass. |
| P1 | `/dashboard/campaigns/:id` | Media-first campaign control room with budget top-up, pause/resume/activate, targeting, collaboration, mobile KPI rail, and promotion cards. Completed in this pass. |
| P1 | `/dashboard/campaigns/edit/:id` | Native campaign editor with section rail, child form reuse, sticky save/cancel actions, and mobile-safe discard prompts. Completed in this pass. |
| P1 | `/dashboard/campaigns/:id/targeting` | Native location-targeting workspace with selected-area visibility, warning state for empty enabled targeting, and one-handed save/cancel actions. Completed in this pass. |
| P1 | `/dashboard/campaigns/collaboration` | Mobile collaboration workbench with starter cards, conversation browser, chat stream, and sticky mobile composer. Completed in this pass. |
| P0 | `/dashboard/campaigns/promotions` | Promotion feed cards, proof/analytics actions, fraud status visibility. Completed in this pass. |
| P1 | `/dashboard/campaigns/analytics` | Mobile analytics cards and chart sections without desktop overflow. Completed in this pass. |
| P1 | `/dashboard/notifications` | Mobile notification center, selection/delete, filter sheet, and mute preferences. Completed in this pass. |
| P2 | `/dashboard/profile` and `/dashboard/profile/:id` | Native profile trust page with identity hero, stat rail, profile metrics, posts, network, badges, collaboration review actions, and sticky follow/edit controls. Completed in this pass. |
| P2 | `/dashboard/community/discussion` | Native community forum entry with topic chips, search, sort/filter sheets, pinned/trending insight rail, thread cards, and sticky discussion composer. Completed in this pass. |
| P2 | `/dashboard/community/discussion/:threadId` | Native forum thread reader with mobile media, poll, comments, and sticky engagement actions. Completed in this pass. |
| P2 | `/dashboard/community/feeds/create` and `/dashboard/community/feeds/edit/:id` | Native feed post composer with source selection, media rail, caption starters, optional challenge/hashtag settings, preview sheet, and sticky publish/update action. Completed in this pass. |
| P2 | `/feed/:postId` | Native public post viewer with one-handed close/share/comment/open-app actions and stable loading/error states. Completed in this pass. |
| P2 | `/ref/:username` | Native referral invite confirmation with stable loading, success/error messaging, trust guidance, and one-handed continue/help actions. Completed in this pass. |
| P2 | `/campaigns/unavailable` | Native campaign-link recovery screen with reason badges, safe redirect explanation, seller support, and sticky explore/help actions. Completed in this pass. |
| P2 | `/dashboard/get-started/onboarding` | Native setup guide with role-aware progress, step cards, video guide shortcuts, FAQ chips, and sticky next action. Completed in this pass. |
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
| P2 | `/dashboard/settings` | Grouped mobile settings shell with profile snapshot, quick section cards, horizontal tabs, activity, and support action. Completed in this pass. |
| P2 | `/dashboard/settings/account` | Mobile account profile hub with completion cues, quick section navigation, and mobile-tuned personal/professional/public identity forms. Completed in this pass. |
| P2 | `/dashboard/settings/system` | Mobile preferences hub with notification status, theme mode, contrast summary, sticky section navigation, and mobile-tuned notification/theme controls. Completed in this pass. |
| P2 | `/dashboard/settings/support` | Mobile support center with WhatsApp quick actions, contact support flow, testimonial state, sticky section navigation, and mobile-tuned child forms. Completed in this pass. |
| P2 | `/dashboard/settings/ads/preferences` | Mobile ad-control center with relevance score, local/interest matching controls, category cards, and one-handed save/discard actions. Completed in this pass. |
| P2 | `/dashboard/tutorials/videos` | Mobile learning feed with featured lesson, recently watched rail, lesson cards, filters, sections sheet, support, and role-switch CTA. Completed in this pass. |
| P2 | `/resources/careers` | Mobile hiring hub with benefit rail, culture summary, department chips, job cards, detail sheets, process timeline, internship CTA, and talent-pool mail action. Completed in this pass. |
| P2 | `/resources/solutions/marketers` | Mobile PPC marketer explainer with tracked-link feature rail, campaign flow cards, industry use-case tabs, transparent cost card, proof rail, FAQ sheets, and campaign/contact CTAs. Completed in this pass. |
| P2 | `/resources/solutions/promoters` | Mobile PPC promoter explainer with unique-link benefits, responsible promotion steps, account-health warnings, opportunity cards, quality rules, proof stories, and FAQ sheets. Completed in this pass. |
| P2 | `/dashboard/assistant/customer/overview` | Mobile assistant control room with status toggle, quick actions, setup/test sheets, KPI rail, and recent conversation cards. Completed in this pass. |
| P2 | `/dashboard/assistant/customer/*` shell | Native assistant parent shell with sticky mobile app bar, section rail, bottom navigation, socket reuse, and safe-area spacing. Completed in this pass. |
| P2 | `/dashboard/assistant/customer/faqs` | Mobile FAQ trainer with coverage score, search, category chips, FAQ cards, add/edit/filter/delete sheets. Completed in this pass. |
| P2 | `/dashboard/assistant/customer/conversations` | Mobile chat inbox with search, status filters, full-screen chat, quick actions, lead tagging, and sticky composer. Completed in this pass. |
| P2 | `/dashboard/assistant/customer/automation` | Mobile automation control center with AI toggle, reply style, escalation, sales links, response timing, and sticky save/reset. Completed in this pass. |
| P2 | `/resources/help-center` | Mobile support hub with search, topic rail, guide cards, FAQ sheets, and contact actions. Completed in this pass. |
| P2 | `/resources/about` | Mobile company/trust story with mission cards, platform proof, current PPC workflow, feature sheets, and CTA actions. Completed in this pass. |
| P2 | `/resources/success-stories` | Mobile proof feed with role category rail, featured result card, story detail sheets, impact cards, and industry insight cards. Completed in this pass. |
| P2 | `/resources/community` | Mobile community hub with group rail, hot discussion cards, success tips, events, mentor cards, benefit sheet, and sign-in actions. Completed in this pass. |
| P2 | `/resources/features` | Mobile feature explorer with marketer/promoter/platform category rail, active feature rows, workflow segment, transaction pricing, and feature-detail sheets. Completed in this pass. |
| P2 | `/resources/faqs` | Mobile answer finder with topic rail, featured questions, bottom-sheet answers, helpful feedback, and support shortcuts. Completed in this pass. |
| P2 | `/resources/contact` | Mobile support flow with direct channels, progressive message form, urgent support, team contact sheets, and FAQ shortcuts. Completed in this pass. |
| P2 | `/resources/how-it-works` | Mobile onboarding explainer with role selection, process timeline, marketer/promoter next-step guide, feature sheets, and demo video sheet. Completed in this pass. |
| P2 | `/resources/benefits` | Mobile benefit picker with audience segmentation, KPI summary, focused cards, complete benefit rows, and bottom-sheet detail. Completed in this pass. |
| P2 | `/legal/*` shell | Mobile legal top bar with Back to App action, sticky page tabs, and child route outlet while preserving the desktop side-menu legal shell. Completed in this pass. |
| P2 | `/legal/cookies` | Mobile cookies explainer with cookie purpose cards, browser-control guidance, related legal links, and external education. Completed in this pass. |
| P2 | `/legal/terms` | Mobile terms reader with agreement summaries, conduct rules, account/security obligations, privacy shortcut, and contact action. Completed in this pass. |
| P2 | `/legal/privacy` | Mobile legal reader with summary cards, readable policy topics, privacy rights sheet, and contact action. Completed in this pass. |
| P2 | Remaining resources, legal, remaining assistant child pages | Grouped mobile utility screens and readable content layouts. |

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

## Wallet Transfer Mobile UX Analysis

Purpose:
`/dashboard/transactions/transfer` lets users move available promoter balance into their marketer wallet for campaign/in-app use or send funds to another promoter.

Desktop behavior:
The desktop component uses Material cards, radio groups, form fields, recipient search, balance loading, transfer submission, snackbars, and a help dialog. It owns the balance loading, recipient search, amount validation, transfer payload, success reset, and balance refresh logic.

Mobile decisions:
The mobile route now wraps the existing desktop component and renders a dedicated transfer wizard for mobile/tablet. It leads with the available promoter balance, shows pending and marketer wallet balances as compact cards, then guides users through destination, recipient, amount, and review steps. Recipient search is card-based, quick amount chips make touch entry faster, and the final transfer action is sticky at the bottom for one-handed completion. The mobile help content uses a bottom sheet instead of a desktop dialog.

Performance:
The mobile component extends the existing transfer component and reuses the same service calls, reactive form, recipient search subscription, validation, submission, snackbars, and balance refresh behavior. Mobile does not render the desktop Material card/form layout, reducing DOM weight while keeping the financial logic in one place.

Accessibility:
The flow uses labelled headings, real buttons for transfer type, recipient rows, quick amounts, and sticky actions. The help content uses dialog semantics, inputs have labels, and touch targets are sized for mobile use.

## Wallet Withdrawal Mobile UX Analysis

Purpose:
`/dashboard/transactions/withdrawal` lets eligible users request payouts from available wallet balance into verified bank accounts, while preserving the existing currency, fee, wallet quote, saved account, and role rules.

Desktop behavior:
The desktop component uses Material cards, accordions, form fields, bank loading, saved accounts, wallet overview loading, currency switching, account resolution, quote preview, snackbar feedback, and the existing submission service.

Mobile decisions:
The mobile route now wraps the existing desktop component and renders a three-step payout wizard for mobile/tablet: Account, Amount, and Review. It leads with available balance, puts currency switching in compact chips, moves bank search and saved accounts into bottom sheets, adds quick amount chips, shows fee/take-home/NGN payout previews, and keeps the final submit action sticky for one-handed use. The existing marketer withdrawal restriction remains visible and enforced.

Performance:
The mobile component extends the existing withdrawal component and reuses the same service calls, reactive form, bank filtering, saved account loading, account resolution, quote calculation, validation, submission, and balance refresh behavior. Mobile avoids rendering the desktop accordion and Material form tree, keeping the default payout flow lighter on mobile devices.

Accessibility:
The flow uses labelled fields, real buttons for bank selection, saved accounts, quick amounts, step navigation, and submit actions. Bottom sheets use dialog semantics, payout details are repeated in a text review list, and the sticky actions remain reachable with touch-sized controls.

## Wallet Funding Mobile UX Analysis

Purpose:
The shared wallet funding dialog lets marketers add money for campaigns and marketplace actions through Paystack, with currency support, campaign shortfall guidance, wallet quote calculation, webhook polling, and wallet refresh after confirmation.

Desktop behavior:
The desktop dialog uses composed Material-style child components: balance card, quick amount selector, custom amount form, payment summary, payment method, processing state, payment status, and footer actions. It is opened from the dashboard quick action and campaign creation flow.

Mobile decisions:
The dialog now opens a device-aware wrapper. Desktop keeps the existing `WalletFundingComponent`; mobile/tablet users get `WalletFundingMobileComponent`, a compact native top-up flow with a balance hero, amount shortcuts, custom amount input, currency bottom sheet, payment review step, Paystack status state, payment tips sheet, and sticky action footer. This keeps the funding task focused on the two mobile questions that matter most: "How much am I adding?" and "What will I be charged?"

Performance:
The mobile component extends the existing funding component and reuses the same Paystack startup, webhook polling, currency config loading, quote refresh, campaign shortfall calculation, validation, wallet update, and campaign continuation behavior. It avoids rendering the desktop component tree on mobile and only creates currency/help sheets when opened.

Accessibility:
The mobile funding flow uses labelled controls, real buttons for amount/currency/payment actions, dialog semantics for bottom sheets, text-based payment summaries, and touch-sized sticky actions. The payment status state keeps references visible for support and recovery.

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

## Promoter Product Detail Mobile UX Analysis

Purpose:
Promoters use `/dashboard/stores/product/:productId` after discovering a product to inspect the offer, understand commission potential, copy their unique promotion link, and share the product through WhatsApp or native sharing.

Desktop behavior:
The desktop page combines a back bar, large product card, image gallery, product header, stats, action buttons, tabbed detail panels, commission sidebar, store card, and related products.

Mobile decisions:
The mobile page becomes image-first and promotion-first. It leads with the product visual, commission ribbon, stock/trust chips, price, potential earning card, KPI rail, and large thumb actions for copying the promotion link, sharing to WhatsApp, and native share. Secondary information moves into compact mobile sections for pitch, performance, store, and details. Related products become a horizontal rail.

Theme alignment:
The mobile SCSS imports `@use '../../../../../styles/variables' as vars;` and `@use '../../../../../styles/mixins' as mixins;`. It uses app tokens for background, surface, text, border, gradient, status colors, safe-area spacing, shadows, and breakpoints so light/dark theme updates flow through the existing CSS variables.

Performance:
The mobile component extends the existing promoter product detail component, reusing the same product loading, promotion creation, clipboard, WhatsApp, sharing, analytics, related-products, and retry logic. Desktop is not mounted on mobile/tablet, and the mobile view avoids tab/sidebar trees in favor of bounded cards and rails.

Accessibility:
Back, copy, share, image navigation, section tabs, related product cards, and sticky actions are real buttons or links. Loading uses polite status copy, error recovery is explicit, and primary controls are sized for one-handed mobile use.

## Promoter Store Product Shelf Mobile UX Analysis

Purpose:
Promoters use `/dashboard/stores/store/:storeId/products` to browse all published products from a selected storefront, compare commission, price, and stock, generate promotion links, share products on WhatsApp, and buy directly.

Desktop behavior:
The desktop page uses a store header, sticky filter sidebar, Material select sorting, product grid cards, paginator, and inline copy/share/buy actions.

Mobile decisions:
The mobile page becomes a native product shelf. It leads with a sticky top bar, compact store hero, summary rail, search, filter/sort action row, category rail, and product cards. Advanced price, commission, and stock filters move into a bottom sheet, while sorting moves into a separate bottom sheet. Product cards prioritize image, commission, discount, category, stock, price, and quick thumb actions.

Theme alignment:
The mobile SCSS imports `@use '../../../../../styles/variables' as vars;` and `@use '../../../../../styles/mixins' as mixins;`. It uses shared background, surface, border, text, gradient, status, spacing, radius, shadow, and breakpoint tokens so light and dark theme behavior stays aligned with the app design model.

Performance:
The mobile component extends the existing desktop component and reuses route loading, API filters, pagination, promotion creation, clipboard, WhatsApp, buy, and visit-store actions. The desktop sidebar/grid is not mounted on mobile/tablet, and filter/sort sheets only render when opened.

Accessibility:
Search, category chips, product actions, filter/sort sheets, pager, refresh, and retry controls are real buttons or inputs. Sheets use dialog semantics, touch controls are 48px where practical, and status/error states are clear.

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

## Settings Shell Mobile UX Analysis

Purpose:
`/dashboard/settings` is the entry point for account, system, support, and ad preference controls. It helps users understand their account state, move between settings sections, review recent activity, and reach help or training updates.

Desktop behavior:
The existing settings index uses a large gradient header, breadcrumb trail, Material sidenav, right-side quick settings panel, and a `router-outlet` for account/system/support child routes.

Mobile decisions:
The mobile shell keeps the same child routes and settings services but replaces the desktop header/sidenav with a native account control screen. It leads with profile identity, online state, profile completion, wallet context, and trust status. Account, System, Support, and Ad preferences become touch-friendly shortcut cards plus a horizontal tab rail. Recent activity and the WhatsApp channel action stay reachable below the selected settings content.

Performance:
The mobile shell is a small standalone component with `OnPush`, signal inputs, computed profile metrics, and a single child `router-outlet`. It avoids rendering the desktop sidenav/header on mobile/tablet and keeps the nested account/system/support implementation unchanged for safety.

Accessibility:
Settings navigation uses real links, the help and WhatsApp actions are labelled buttons, status uses text plus color, and touch targets are sized for mobile use. The child route content remains in the normal router flow.

## Account Settings Mobile UX Analysis

Purpose:
`/dashboard/settings/account` lets users update personal information, professional profile details, username/social links, and referral identity.

Desktop behavior:
The desktop account page uses a Material card with expansion panels that mount the personal, professional, and public identity forms together.

Mobile decisions:
The mobile page becomes an account profile hub. It shows a sticky account header, profile-strength progress, status/role/social summary cards, section cards, and a sticky three-tab selector. Only the selected form is mounted so the screen stays focused and lighter on mobile devices.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared surface, text, border, gradient, status, spacing, shadow, and breakpoint tokens so light and dark mode follow the app design system.

Performance:
The wrapper keeps desktop unchanged and renders the mobile shell only for mobile/tablet. The mobile shell reuses the existing child form components and only mounts the active form section to reduce DOM weight.

Accessibility:
Back navigation, section cards, sticky tabs, and child form controls are real buttons/links/inputs with mobile-sized touch targets. Loading state uses polite visible status, and progress is backed by readable text.

## System Settings Mobile UX Analysis

Purpose:
`/dashboard/settings/system` lets users control email notification delivery, theme mode, system-default behavior, and high contrast preferences.

Desktop behavior:
The desktop system page uses a Material card with tab/accordion presentation and mounts notification and theme settings together inside the desktop settings content area.

Mobile decisions:
The mobile page becomes a focused preferences hub. It leads with the current theme setup, shows notification/theme/contrast summary cards, then offers section cards and sticky tabs for Notifications and Theme. Only the active settings control is mounted so the page stays calm and lighter on small screens.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared background, surface, text, border, gradient, status, radius, shadow, spacing, and breakpoint tokens so light and dark mode remain consistent with the app design model.

Performance:
The wrapper keeps the existing desktop component unchanged and renders the mobile shell only for mobile/tablet. The mobile shell reuses `NotificationSettingsComponent` and `ThemeSettingsComponent`, keeping persistence logic in the existing services while avoiding the desktop tab/accordion tree on mobile.

Accessibility:
Back navigation, section cards, sticky tabs, toggles, and child controls are real controls with mobile-sized touch targets. Loading state uses polite visible status, and setting state is repeated as readable text instead of relying on color alone.

## Support Settings Mobile UX Analysis

Purpose:
`/dashboard/settings/support` lets users contact MarketSpase support, open WhatsApp help channels, and create or update their testimonial.

Desktop behavior:
The desktop support page uses a Material card with tabs for Contact Support and Testimonial. The contact form owns support-ticket submission and WhatsApp actions, while the testimonial child owns rating/edit/publish behavior fed by the parent testimonial request.

Mobile decisions:
The mobile page becomes a support center. It leads with the fastest support path, keeps WhatsApp live chat and channel actions directly reachable, shows response/live-chat/testimonial summary cards, then offers section cards and sticky tabs for Contact and Testimonial. Only the selected child flow is mounted so the mobile screen avoids stacking two large forms.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared background, surface, text, border, gradient, status, radius, shadow, spacing, and breakpoint tokens so light and dark mode stay in the MarketSpase design model.

Performance:
The wrapper keeps the existing desktop component unchanged and renders the mobile support center only for mobile/tablet. The mobile component extends the existing support state so testimonial loading and error handling remain in one place, while contact and testimonial child components keep their existing submit logic.

Accessibility:
Back navigation, WhatsApp actions, section cards, sticky tabs, support form controls, and testimonial controls are real interactive elements with mobile-sized targets. Loading state uses polite visible status, and testimonial/support state is repeated in readable text.

## Ads Preferences Mobile UX Analysis

Purpose:
`/dashboard/settings/ads/preferences` lets users control whether MarketSpase can use general location and category interests to make campaigns, store offers, and promotions more relevant.

Desktop behavior:
The desktop page uses wide Material cards with explanatory copy, slide toggles, category chips, desktop-only ad-type cards, and a bottom action area for saving or discarding changed preferences.

Mobile decisions:
The mobile page becomes a compact ad-control center. It leads with an ad relevance score, turns saved state/location/interests into small summary cards, keeps location and interest controls in thumb-sized panels, and replaces desktop chip density with a two-column category picker. Save and discard become sticky bottom actions only when changes exist.

Theme alignment:
The mobile SCSS imports `@use '../../../../../styles/variables' as vars;` and `@use '../../../../../styles/mixins' as mixins;`. It uses shared background, surface, text, border, gradient, status, radius, shadow, spacing, and transition tokens so light and dark mode stay aligned with the MarketSpase design model.

Performance:
The wrapper keeps the existing desktop component unchanged and renders the mobile component only for mobile/tablet. The mobile class extends the existing preference component so persistence, normalization, category limits, snackbars, and user refresh behavior stay centralized.

Accessibility:
Back navigation, toggles, category choices, save/discard actions, and profile guidance are real controls with mobile-sized targets. The score and status cards repeat state as text, while selected categories expose `aria-pressed` for screen readers.

## Tutorials Learning Center Mobile UX Analysis

Purpose:
`/dashboard/tutorials/videos` helps marketers and promoters learn the platform, watch role-specific lessons, continue recently watched videos, discover featured tutorials, share lessons, and switch role perspective when needed.

Desktop behavior:
The existing tutorials component uses a wide hero, desktop search/filter panel, featured grid, recent list, section grids, list/grid toggle, role-switch CTA, support CTA, and Material video dialog.

Mobile decisions:
The mobile version keeps the same tutorial loading, video dialog, share, local recently watched state, metrics, and role switching logic. The page becomes a mobile learning feed: sticky topbar, compact hero stats, search card, horizontal category rail, quick action controls, recommended lesson, recently watched rail, featured rail, lesson cards, load-more batching, and bottom sheets for filters and section summaries.

Performance:
The mobile component extends the existing tutorials class so API/service logic is not duplicated. It renders a capped lesson feed first, lazy-loads thumbnails, creates bottom-sheet content only when opened, and increases visible lessons on demand to keep DOM size friendly for lower-end devices.

Accessibility:
Search, filter, section, play, share, load-more, support, and role-switch actions use real controls with labels where needed. Bottom sheets use dialog semantics, videos retain image alt text, and touch targets are sized for mobile use.

## Public Help Center Mobile UX Analysis

Purpose:
`/resources/help-center` helps users find answers before and after onboarding. It covers account setup, campaigns, payments, verification, troubleshooting, contact support, and learning resources.

Desktop behavior:
The desktop help center uses a large marketing-style hero, Material search field, category grid, quick-help cards, featured articles, expansion-panel FAQs, contact cards, community section, and learning resources.

Mobile decisions:
The mobile version turns the page into a native support hub. Search is the first interaction, popular searches become thumb chips, categories become a horizontal topic rail, recommended guides become compact cards, FAQ answers open in bottom sheets, and support channels are shown as actionable contact cards. The design avoids stacking the entire desktop landing page and focuses on the mobile job: find the answer fast or reach support.

Performance:
The mobile component extends the existing help center class, reusing the same signals, category data, articles, FAQs, contact options, and search actions. It renders compact lists, opens heavier article/FAQ/contact detail only inside bottom sheets, and keeps the desktop component untouched.

Accessibility:
Search has a clear label, all chips/cards/sheet actions are real buttons or links, bottom sheets use dialog semantics with labelled close buttons, and mobile tap targets are sized for touch use.

## Public About Mobile UX Analysis

Purpose:
`/resources/about` helps first-time visitors understand what MarketSpase is, why the platform exists, and how its trust systems connect marketers, promoters, products, buyers, tracked links, and payouts.

Desktop behavior:
The desktop about page uses a large marketing hero, floating shapes, stat cards, mission/vision cards, feature grids, social proof, a multi-step workflow, and CTA content.

Mobile decisions:
The mobile version is a native trust story. The first screen explains the platform in plain language, stats become compact proof tiles, mission and vision become two focused cards, platform trust features move into a horizontal rail with bottom-sheet details, and the workflow copy is updated to the current PPC/tracked-link model instead of the old screenshot/download promotion model.

Performance:
The mobile component extends the existing about component, reusing the same hero statistics and feature data. Long mission, feature, and workflow explanations are created only inside bottom sheets, keeping the initial DOM small on mobile devices.

Accessibility:
Mission, feature, workflow, and CTA actions are real buttons or links. Bottom sheets use dialog semantics with labelled close buttons, proof metrics are text-readable, and touch targets are sized for mobile use.

## Public Success Stories Mobile UX Analysis

Purpose:
`/resources/success-stories` helps prospects trust MarketSpase by showing role-specific proof from marketers, promoters, and larger organizations. It needs to help mobile visitors quickly answer, "does this work for someone like me?"

Desktop behavior:
The desktop page uses a large hero, category cards, a featured story, story grids, video testimonial cards, results stats, industry cards, and CTA content. The existing category card click also selected `promoter` for every card.

Mobile decisions:
The mobile version becomes a proof feed. Users first see compact impact stats, then choose a role from a horizontal category rail, scan a featured story, and open story details in a bottom sheet. Result metrics are summarized in cards, industry detail moves into sheets, and text is cleaned for mobile where old currency encoding displayed incorrectly.

Performance:
The mobile component extends the existing success stories component and reuses the same story/category/filter state. It renders a capped story list first, avoids missing desktop image assets by using lightweight initials and metric cards, and creates story/industry/filter detail only when a sheet opens.

Accessibility:
Category cards, story cards, industry cards, CTA links, and sheet controls are semantic touch-sized controls. Bottom sheets use dialog semantics with labelled close buttons, and role/category state is visible in text, not color alone.

## Public Community Mobile UX Analysis

Purpose:
`/resources/community` introduces prospects and new users to the MarketSpase learning/community layer. It needs to show that marketers, promoters, store owners, and experts can learn together before signed-in forum features are available.

Desktop behavior:
The desktop community page uses a large hero, category cards, Material tabs for discussions/tips/events/mentors, benefit cards, testimonials, and CTA content. Actions open the existing sign-in dialog.

Mobile decisions:
The mobile version becomes a native community hub. Users first see proof stats and community groups, then switch between Hot, Tips, Events, and Mentors with a compact tab bar. Discussion, tip, and event details open in bottom sheets, while gated participation keeps using the existing sign-in dialog. Old currency mojibake is cleaned for mobile display.

Performance:
The mobile component extends the existing community component and reuses local data, dialog actions, event registration, tip reading, and join-community behavior. It renders capped lists per active section and creates detailed topic/tip/event/benefit content only when a sheet opens.

Accessibility:
Group cards, section tabs, content cards, CTA actions, and sheet controls are real buttons or links. Bottom sheets use dialog semantics with labelled close buttons, and state is represented through text plus active styles.

## Public Careers Mobile UX Analysis

Purpose:
`/resources/careers` helps prospective hires understand MarketSpase's product mission, open roles, benefits, culture, and application path. The mobile version needs to make role discovery and application intent fast for candidates reading on phones.

Desktop behavior:
The desktop careers page uses a large hero, stat cards, benefit grids, culture cards, department filters, full job cards, a hiring-process timeline, internship CTA, testimonials, and final careers CTA.

Mobile decisions:
The mobile version becomes a native hiring hub. The first screen explains the role of the company in social commerce, stats become compact proof tiles, benefits become a horizontal rail with detail sheets, culture becomes touch rows, departments become chips, and roles become focused job cards with a bottom-sheet detail view. Application CTAs stay visible in the hero, role cards, and final CTA, while the existing mailto application behavior remains unchanged.

Performance:
The mobile component extends the existing careers component and reuses the same benefits, culture, department, role-filtering, internship, and apply methods. Full responsibilities, requirements, benefits, and hiring-process copy are created only when a bottom sheet opens, keeping the mobile DOM smaller than the desktop page.

Accessibility:
Benefit cards, culture rows, department filters, job actions, process cards, and sheet controls are semantic touch-sized controls. Bottom sheets use dialog semantics with labelled close buttons, role metadata is readable as text, and active department state is represented through text plus active styling.

## Public Marketer Solution Mobile UX Analysis

Purpose:
`/resources/solutions/marketers` explains how marketers can use MarketSpase to fund campaigns, get promoters sharing unique links, and measure campaign or product performance. The mobile version needs to make the current PPC/tracked-link model clear without forcing users through the long desktop marketing page.

Desktop behavior:
The desktop marketer solution page uses a large hero, Facebook video embed, comparison cards, feature grid, step-by-step process, Material tabs for use cases, pricing cards, testimonials, FAQ blocks, and CTA content. Some desktop copy still references older WhatsApp status/proof language.

Mobile decisions:
The mobile page is intentionally framed around the current PPC system: campaign creation, budget funding, unique promoter links, click/conversion analytics, product promotion, and fraud visibility. Traditional-ad comparison is compressed into a single card, features become a horizontal rail with detail sheets, process steps become tappable cards, use cases become chips plus one focused card, and FAQs open in bottom sheets.

Performance:
The mobile component extends the existing marketer solution component so testimonial, pricing, use-case data, video URL preparation, and scroll behavior remain shared. The heavy desktop iframe is not rendered in the mobile view, and detailed feature/process/use-case/FAQ content is only shown inside bottom sheets.

Accessibility:
Hero CTAs, feature cards, process cards, use-case tabs, testimonial cards, FAQ rows, and sheet controls are semantic links or buttons. Bottom sheets use dialog semantics with labelled close buttons, and state is expressed through text and active styles instead of color alone.

## Public Promoter Solution Mobile UX Analysis

Purpose:
`/resources/solutions/promoters` explains how promoters earn on MarketSpase by sharing campaign and product links responsibly. The mobile version needs to teach the current PPC/tracked-link flow and make account-health consequences obvious.

Desktop behavior:
The desktop promoter solution page uses a large hero, Facebook video embed, benefit grid, five-step WhatsApp status/proof flow, earnings card, sample campaigns, testimonials, FAQ blocks, and CTA content. Some desktop copy still reflects the older proof/submission workflow.

Mobile decisions:
The mobile page is intentionally reframed around the current model: verify profile, choose campaigns or storefront products, use ready assets and captions, share a unique tracked link, monitor clicks/conversions, and protect account health. Account-health warning content appears near the top, benefits become a horizontal rail, process steps become cards, opportunities and quality rules become compact tappable rows, and FAQ answers open in bottom sheets.

Performance:
The mobile component extends the existing promoter solution component so the shared video URL setup and scroll behavior remain available, but it does not render the heavy desktop iframe. Detailed benefit, step, opportunity, quality, proof, and FAQ content is only rendered when a bottom sheet opens.

Accessibility:
Hero CTAs, benefit cards, process cards, opportunity rows, quality rows, proof cards, FAQ rows, and sheet controls are semantic links or buttons. Bottom sheets use dialog semantics with labelled close buttons, and risk/quality information is expressed through text plus color.

## Public Legal Shell Mobile UX Analysis

Purpose:
The `/legal/*` shell hosts the public legal pages and lets users move between Terms, Privacy, and Cookies while keeping a path back to the main app.

Desktop behavior:
The desktop `LegalComponent` uses a two-column layout with a left Material list menu and a content card containing the child route outlet. This remains the desktop behavior.

Mobile decisions:
The mobile shell replaces the collapsed desktop side menu with a sticky top bar, a clear Back to App action, and horizontal legal tabs. Child legal pages keep their own mobile readers, so the shell focuses only on navigation and route framing instead of wrapping content in another card.

Performance:
The parent route now renders either the existing desktop shell or the lightweight mobile shell through a device-aware wrapper. The mobile shell contains only static navigation data and a `router-outlet`, so it adds very little DOM or runtime cost.

Accessibility:
The Back to App action and legal tabs are semantic links with active route state. The tabs are touch-sized, horizontally scrollable on small screens, and labelled through the navigation landmark.

## Public Cookies Policy Mobile UX Analysis

Purpose:
`/legal/cookies` explains what cookies are, why MarketSpase may use them, how cookies support website analytics and preferences, how advertising cookies may behave, and how users can block or delete cookies from their browser.

Desktop behavior:
The desktop cookies component is a short legal document inside the legal shell. It includes breadcrumb navigation, a policy heading, explanatory paragraphs, and an external `All About Cookies` reference.

Mobile decisions:
The mobile page turns the short policy into a practical cookie explainer. It leads with what cookies do, gives quick stat cards, highlights browser control, and turns cookie subjects into tappable rows. Browser controls, external guidance, and related privacy/terms links move into touch-friendly cards and bottom sheets. This keeps the policy understandable on a phone without changing the desktop legal text.

Performance:
The mobile component uses local static data and signals for the active sheet. Detailed cookie topics and browser-control guidance are rendered only when opened, while the desktop document is not mounted for mobile/tablet users.

Accessibility:
Breadcrumb links, cookie topic rows, browser-control actions, external education links, and legal shortcuts use semantic links or buttons. Bottom sheets use dialog semantics with labelled close buttons, and controls meet mobile touch sizing.

## Public Terms Of Service Mobile UX Analysis

Purpose:
`/legal/terms` explains the rules for using MarketSpase, including user-submitted content, account security, prohibited conduct, website security, intellectual property, third-party links, disclaimers, liability limits, and contact paths.

Desktop behavior:
The desktop terms component is a long legal document rendered inside the existing legal shell. It keeps the complete agreement text, headings, paragraphs, lists, privacy link, and breadcrumb navigation.

Mobile decisions:
The mobile page becomes a practical terms reader. It leads with the binding-use message, last-updated and account-duty summary cards, then turns dense legal sections into tappable rows that open bottom sheets. The key conduct rules get their own sheet, and the privacy policy plus contact email are promoted into obvious touch actions. This avoids stacking a full desktop legal document on a small screen while preserving the desktop document for larger screens.

Performance:
The mobile component uses local static arrays and signals for the active bottom sheet. Detail content is only rendered when opened, and the existing desktop legal document is not mounted for mobile/tablet users.

Accessibility:
Breadcrumb links, topic rows, conduct controls, privacy links, contact links, and sheet close buttons are semantic controls. Bottom sheets use dialog semantics, controls meet mobile touch sizing, and risk/conduct states use text plus color.

## Public Privacy Policy Mobile UX Analysis

Purpose:
`/legal/privacy` gives users a clear explanation of how MarketSpase collects, uses, stores, protects, and discloses personal information, plus how users can contact the team about data rights.

Desktop behavior:
The desktop privacy component is a long legal document rendered inside the existing legal shell. The shell keeps the legal menu, and the privacy child renders full policy text, headings, lists, and breadcrumb navigation.

Mobile decisions:
The mobile page becomes a privacy reader instead of a long legal wall. It starts with a short plain-language policy summary, key status cards, and a trust statement that MarketSpase does not sell personal data. The legal topics become tappable rows that open bottom sheets, while user controls and contact information are promoted into their own mobile sections. This keeps the important legal intent visible without forcing small-screen users through the full document at once.

Performance:
The mobile component keeps static policy summary data in local arrays, uses signals for the active sheet, and only renders detailed topic content when a sheet is open. The desktop document remains untouched and is not rendered for mobile/tablet users through the wrapper.

Accessibility:
Breadcrumb links, policy rows, rights controls, contact links, and sheet close buttons are semantic controls. Bottom sheets use dialog semantics, close buttons are labelled, and the policy statements are text-based so meaning is not carried by color alone.

## Public Features Mobile UX Analysis

Purpose:
`/resources/features` helps prospects understand the product surface across marketer tools, promoter tools, and platform trust/automation features before they sign up.

Desktop behavior:
The desktop features page uses a large gradient hero, floating shapes, category cards, full feature grids, Material tabs for workflows, platform highlight grids, transaction pricing, and CTA content.

Mobile decisions:
The mobile page becomes a feature explorer. Users first pick a feature group from a horizontal rail, then scan active feature rows. Benefit bullet lists move into a bottom sheet, workflow tabs become a segmented mobile card, pricing becomes a compact rail, and CTA actions stay near the end. This keeps mobile attention on one feature group at a time instead of stacking the whole desktop page.

Performance:
The mobile component extends the existing features component and reuses the same feature categories, feature list, filtered feature signal, pricing tiers, and category switching logic. It renders only the active feature group and creates detailed feature bullets only when a sheet opens.

Accessibility:
Category cards, feature rows, workflow toggles, pricing content, CTA links, and sheet controls use real semantic controls. Bottom sheets use dialog semantics with labelled close buttons, and all primary controls meet mobile touch sizing.

## Public FAQ Mobile UX Analysis

Purpose:
`/resources/faqs` gives prospective and signed-in users quick answers about onboarding, promoter requirements, campaigns, payments, verification, and troubleshooting.

Desktop behavior:
The desktop FAQ page uses a large hero, category cards, popular questions, featured FAQ blocks, Material expansion panels for every category, and a support section.

Mobile decisions:
The mobile page becomes an answer finder rather than a long accordion page. Search and popular chips sit first, categories become a horizontal topic rail, popular questions are tappable rows, featured questions become swipeable cards, and answers open in bottom sheets with helpful/not-helpful actions. This keeps mobile reading focused and prevents users from scrolling through a very long desktop-style FAQ stack.

Performance:
The mobile component extends the existing FAQ component, reusing local FAQ/category/popular question data and existing feedback methods. It renders capped question lists, avoids Material expansion panels on mobile, and creates answer/support detail only when a bottom sheet is opened.

Accessibility:
Search has a label, category and question cards are real buttons, support destinations are links, answer sheets use dialog semantics with labelled close buttons, and all primary controls are touch-sized.

## Public Contact Mobile UX Analysis

Purpose:
`/resources/contact` lets prospects and existing users reach MarketSpase support for campaign, promoter, wallet, store, technical, billing, and partnership issues.

Desktop behavior:
The desktop contact page uses a large hero, contact method cards, a full Material form, sidebar benefit cards, team member cards, static FAQs, and CTA content.

Mobile decisions:
The mobile page is designed as a support flow instead of a long desktop landing page. Users first see urgent WhatsApp chat and Help Center actions, then choose a contact channel, pick an inquiry type, enter account details, describe the issue, and review before sending. Team members and support FAQs move into bottom sheets/cards so the main page stays focused on getting help quickly.

Performance:
The mobile component extends the existing contact component, reusing the same reactive form, contact methods, team data, WhatsApp action, email actions, and backend submission service. It avoids rendering the desktop Material form tree and only opens channel/team/FAQ detail when needed.

Accessibility:
The form uses labelled native inputs, step actions are real buttons, urgent support links are touch-sized, bottom sheets use dialog semantics with labelled close buttons, and review content is repeated in text before submission.

## Public How It Works Mobile UX Analysis

Purpose:
`/resources/how-it-works` explains the MarketSpase marketplace flow for prospects, marketers, and promoters. It needs to show what each side does, how campaigns move from setup to promotion, and why the system is trackable.

Desktop behavior:
The desktop page uses a large marketing hero, embedded Facebook demo, stat cards, role cards, process sections, Material tabs/steppers, feature highlights, and CTA content.

Mobile decisions:
The mobile version becomes a short native onboarding guide. The first screen answers what MarketSpase does, then users can tap role cards, a compact process timeline, and a segmented marketer/promoter guide. Deeper explanations, benefits, feature details, and the demo video move into bottom sheets so the page does not feel like a squeezed desktop landing page.

Performance:
The mobile component extends the existing how-it-works component and reuses the same role, process, feature, and demo URL data. It avoids the desktop tab/stepper tree on mobile, clips long process copy in cards, and creates detail/video content only when a sheet is opened.

Accessibility:
Role, step, feature, CTA, and sheet controls are real buttons or links. The detail sheets use dialog semantics with labelled close buttons, the demo iframe has a title, and touch targets are sized for mobile use.

## Public Benefits Mobile UX Analysis

Purpose:
`/resources/benefits` helps prospective marketers and promoters quickly understand why MarketSpase is valuable, what each side gets, and why the platform can be trusted.

Desktop behavior:
The desktop benefits page uses a large gradient hero, wide CTA buttons, stat blocks, repeated grid sections for businesses/promoters/platform, hover card effects, and a final CTA.

Mobile decisions:
The mobile page becomes a benefit picker. Users first choose the goal closest to them: business growth, promoter earnings, or platform trust. Top benefits are shown as compact cards, the full list becomes mobile rows, and deeper explanation opens in a bottom sheet. This reduces scrolling and helps non-technical users answer "what is in this for me?" quickly.

Performance:
The mobile component extends the existing benefits component and reuses the same benefit signals. It avoids the desktop grid/hover-heavy structure on mobile, renders only the active benefit category, and opens extra explanations only when requested.

Accessibility:
Audience cards, benefit cards, benefit rows, and CTA actions are real controls. Bottom sheets use dialog semantics with a labelled close button, and every mobile action has a touch-sized target.

## AI Assistant Overview Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/overview` helps marketers monitor the WhatsApp AI sales assistant, see whether it is active, check response performance, test a customer question, and jump into conversations, FAQs, automation, analytics, or settings.

Desktop behavior:
The desktop overview uses wide status cards, a test panel, KPI cards, recent conversation rows, onboarding steps, and quick actions. It owns the assistant settings load, stats load, conversation load, websocket refresh, AI toggle, and test reply behavior.

Mobile decisions:
The mobile view keeps the existing assistant data flow and mutations but presents the page as a native control room. It leads with assistant state and toggle, then a horizontal KPI rail, quick action tiles, setup bottom sheet, test-reply bottom sheet, and recent conversation cards. Dense desktop panels move out of the first screen so the marketer can quickly answer: "Is my assistant working, and what needs my attention?"

Performance:
The mobile component extends the existing overview component, so API calls, socket refresh, and mutation paths are not duplicated. It avoids Material card grids on mobile, creates bottom-sheet content only when opened, and renders a compact conversation list.

Accessibility:
The AI toggle is a labelled native control, quick actions are links or buttons, conversations are real links, loading uses an announced state, and the bottom sheets use dialog semantics with labelled close buttons and mobile-sized targets.

## AI Assistant Shell Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/*` provides the persistent navigation, route outlet, notification badge, and socket connection for the AI Sales Assistant area across overview, conversations, FAQs, automation, analytics, and settings.

Desktop behavior:
The desktop parent component uses a Material toolbar, top navigation, sidenav container, mobile breakpoint observer, router outlet, and socket connection tied to the current user. It owns the assistant nav model, unread badge state, sidenav toggle state, and socket connect/disconnect lifecycle.

Mobile decisions:
The mobile shell removes the desktop sidenav and replaces it with a native assistant frame: a sticky top app bar with Back to Dashboard and conversation notification entry, a horizontal section rail for quick scanning, a safe-area-aware content outlet, and a fixed bottom nav for thumb navigation. The child assistant pages remain unchanged and continue to render their own mobile views inside this shell.

Theme alignment:
The mobile stylesheet imports `@use '../../../styles/variables' as vars;` and `@use '../../../styles/mixins' as mixins;`. It uses dynamic surface, background, border, text, primary, shadow, safe-area, z-index, and transition tokens so light and dark themes follow the shared MarketSpase design model. The existing desktop shell stylesheet was also moved from `@import` to `@use`.

Performance:
The mobile shell extends the existing assistant parent so it reuses socket lifecycle, user resolution, nav data, and unread badge state. Mobile/tablet users do not mount the Material sidenav tree, reducing layout work around already-mobile child pages.

Accessibility:
Top-bar, section rail, notification, and bottom navigation controls are semantic links with labels, active states are visible through text/icon color and background, and all mobile navigation targets meet the 48px touch target rule.

## AI Assistant FAQs Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/faqs` lets marketers train the AI sales assistant with reusable questions and answers, organize answers by category and tags, search existing entries, edit incorrect answers, and remove stale information.

Desktop behavior:
The desktop FAQ component uses Material cards, form fields, category buttons, inline edit forms, and a browser confirm for delete. It owns the FAQ loading, search/category filtering, add, edit, save, and delete API calls.

Mobile decisions:
The mobile version treats FAQ management as a training workflow. It leads with a coverage score and FAQ count, then gives users search, horizontal category chips, compact FAQ cards, and a floating add button. Add, edit, advanced category filter, and delete confirmation move into bottom sheets so the main screen stays easy to scan.

Performance:
The mobile component extends the existing FAQ component, reusing the same signals, computed filters, and service calls. It initially renders eight FAQ cards and uses load-more batching to keep the DOM smaller on lower-end mobile devices.

Accessibility:
Search is a labelled native input, category filters and card actions are real buttons, destructive delete uses an explicit confirmation sheet, and all bottom sheets use dialog semantics with labelled close buttons and touch-sized controls.

## AI Assistant Conversations Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/conversations` is where marketers monitor WhatsApp customer chats, take over from AI, reply as a human, send storefront/payment links, resolve chats, escalate issues, and tag lead quality.

Desktop behavior:
The desktop component uses a two-column workspace with a conversation sidebar, Material search/select filters, inline chat tools, a scrollable message pane, and composer. It owns realtime socket updates, debounced search, conversation selection, message loading, optimistic send, takeover, resolve, escalate, quick actions, and lead tagging.

Mobile decisions:
The mobile version uses an inbox-first flow instead of squeezing the desktop two-column layout. Marketers see a compact KPI rail, search, status chips, and conversation cards. Selecting a chat opens a full-screen mobile chat with sticky topbar, quick action strip, scrollable messages, and sticky composer. Less frequent actions move into bottom sheets for filters, chat actions, and lead tagging.

Performance:
The mobile component extends the existing conversations component so realtime refresh, message loading, and mutation paths are reused. It renders either the inbox or the selected chat, avoiding the desktop sidebar and chat panel being visible at the same time on mobile.

Accessibility:
Filters, quick actions, back navigation, chat actions, lead tags, and send controls are real buttons or native inputs. The active chat has labelled controls, bottom sheets use dialog semantics, and touch targets are sized for one-handed use.

## AI Assistant Automation Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/automation` lets marketers control whether the AI replies, how it sounds, when it should hand chats to humans, which storefront/payment/product links it can send, and how fast it responds.

Desktop behavior:
The desktop component uses a wide settings grid with Material cards, slide toggles, selects, product-link rows, business-hour controls, and sticky save actions. It owns settings loading, merging defaults, change detection, reset, save, link management, escalation keyword parsing, and response timing updates.

Mobile decisions:
The mobile version presents automation as a compact control center. It leads with AI on/off state, KPI-like setting summaries, sample reply, and four tap targets: reply style, escalation rules, sales links, and response control. Each section opens in a bottom sheet so users can edit one task at a time. Unsaved changes surface in a sticky save/reset bar.

Performance:
The mobile component extends the existing automation component, reusing settings loading, update methods, save/reset, and product-link logic. It renders only summary controls on the main screen and creates the heavier edit controls inside bottom sheets.

Accessibility:
The AI toggle, section controls, reset/save actions, link management, and all form controls are real native inputs/buttons. Bottom sheets use dialog semantics, and destructive link removal is explicit and touch-sized.

## AI Assistant Analytics Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/analytics` helps marketers understand whether the AI assistant is saving response time, answering enough buyer messages, escalating the right chats, and creating buying signals.

Desktop behavior:
The desktop component uses a wide report layout with ROI cards, four Material metric cards, a seven-day bar chart, AI-vs-human activity bars, conversion signal rows, refresh, loading state, and error handling. It owns analytics loading, derived chart data, max-value calculations, and date formatting.

Mobile decisions:
The mobile version turns the report into a native performance feed. It leads with a sticky header and refresh action, then uses swipeable summary cards for sales influence, conversion rate, and escalation rate. Core message metrics become a 2-column card grid, while charts are simplified into compact mobile panels that keep the signal without forcing desktop table/chart density.

Performance:
The mobile component extends the existing analytics component, reusing the API call, loading state, computed chart data, chart scaling helpers, and error handling. The mobile template renders lightweight cards and CSS charts without adding a charting dependency.

Accessibility:
Refresh is a labelled icon button, loading uses polite status text, KPI sections have aria labels, and all mobile cards preserve readable text hierarchy with touch-safe spacing.

## AI Assistant Settings Mobile UX Analysis

Purpose:
`/dashboard/assistant/customer/settings` lets marketers connect WhatsApp numbers, choose the storefront the assistant represents, control assistant alerts, manage the subscription plan, and save Twilio WhatsApp credentials.

Desktop behavior:
The desktop component uses Material cards, a horizontal settings nav, reactive forms, slide toggles, plan cards, Twilio credential fields, and a browser confirmation before removing a WhatsApp number. It owns settings loading, connection mutations, business binding, notification preference saving, plan updates, and Twilio configuration.

Mobile decisions:
The mobile version is a settings hub rather than a squeezed form. It starts with setup health, then presents thumb-friendly section chips. Each section is focused: WhatsApp numbers become cards with status pills and AI toggles, business binding uses a native select, alerts are toggle rows, plans are stacked cards, and Twilio fields are grouped under a security note. Removing a number uses a bottom sheet instead of a browser confirm.

Performance:
The mobile component extends the existing settings component, reusing the same service calls, forms, validation, and mutation methods. The mobile route renders only one section at a time and uses native controls where possible to avoid heavy mobile DOM.

Accessibility:
Section navigation, add/remove, save, reconnect, and plan actions are real buttons with large touch targets. The removal confirmation uses dialog semantics, form fields have labels, and status is exposed through visible text plus icons.

## Dashboard Global Search Mobile UX Analysis

Purpose:
`/dashboard/search` lets authenticated users search across MarketSpase users, campaigns, promotions, products, and stores with role-aware visibility, facets, pagination, exports, and deep links into each result.

Desktop behavior:
The desktop component uses a hero section, Material search field, entity chips, Material selects for filters, region chips, a spotlight result, result grid cards, metrics, export, and paginator. It owns query-param synchronization, debounced search, filter route updates, pagination, result navigation, and CSV export.

Mobile decisions:
The mobile version becomes a search-first surface. It leads with a sticky header and large native search input, keeps entity filters in a horizontal rail, moves secondary filters into a bottom sheet, and renders every result as a touch-friendly card with status tags, metric strips, and a full-width open action. Pagination is simplified into previous/next controls.

Performance:
The mobile component extends the existing search page and reuses the same service, route synchronization, computed result state, export, metric formatting, and navigation methods. It avoids Material form fields and paginator on mobile, reducing DOM weight while preserving behavior.

Accessibility:
The search input is labelled, filters use a dialog-style bottom sheet, result actions are real buttons, pagination has an aria label, and all interactive controls meet mobile touch sizing.

## Dashboard Leaderboard Mobile UX Analysis

Purpose:
`/dashboard/leaderboard` helps users understand who is consistently checking in, earning points, and leading the current reward window.

Desktop behavior:
The desktop page uses a hero, summary grid, segmented controls, podium cards, and full ranking rows. It owns leaderboard loading, timeframe switching, metric switching, reward value display, and profile navigation.

Mobile decisions:
The mobile page starts with the user's own streak and withdrawable reward value because that is the most personal mobile question. First place becomes a large champion card, the rest of the podium becomes a horizontal rail, and the full ranking becomes compact profile-ready cards. Timeframe and metric controls move into a bottom sheet so the main screen stays focused on rankings.

Performance:
The mobile component extends the existing leaderboard component and reuses the same service, loading signals, computed entries, metric formatting, refresh behavior, and profile navigation. It avoids desktop grid/table patterns and renders lightweight native controls.

Accessibility:
Refresh, filter, profile, and close actions are real buttons with large touch targets. The filter sheet uses dialog semantics, rank cards have readable labels, and loading uses stable skeleton cards to avoid layout jumps.

## Dashboard Gamification Mobile UX Analysis

Purpose:
`/dashboard/gamification` helps users understand how their daily streaks, XP, badges, milestones, and qualifying marketplace actions build long-term engagement value.

Desktop behavior:
The desktop page uses a full journey dashboard with a header, refresh state, level hero, stat grid, milestone panels, action breakdown, celebrations, recent events, and unlocked milestones. It owns gamification loading, refresh, error handling, and all derived progress state.

Mobile decisions:
The mobile page becomes a reward journey. It puts level progress, XP, and reward signals first, then presents streak and points as swipeable stat cards. The next milestone gets a focused card, while milestone ladders, XP sources, recent wins, and activity become compact mobile sections. Leaderboard and refresh are elevated into thumb-friendly quick actions.

Performance:
The mobile component extends the existing gamification component and reuses the same service, state signals, computed summaries, refresh method, and loading/error behavior. It avoids heavy Material panels and renders only compact rails and cards.

Accessibility:
Refresh, leaderboard, retry, and section interactions are real labelled controls with mobile-sized touch targets. Progress has visible text in addition to visual bars, and loading uses stable skeleton cards to prevent misleading empty states.

## Dashboard Home Mobile UX Analysis

Purpose:
`/dashboard` is the user's daily command center. It brings together wallet momentum, campaigns or promotions, gamification, community activity, learning, trends, and relationship building.

Desktop behavior:
The desktop home composes many dashboard widgets: notification banners, dashboard header, community feed, performance metrics, quick stats, gamification spotlight, badge feed, recent activity, trending topics, suggested connections, learning, testimonials, mobile bottom navigation, and desktop floating post action. It owns profile, feed, forum, live activity, tutorial, notification, and follow state loading.

Mobile decisions:
The mobile page becomes a native home feed instead of a stacked desktop dashboard. It leads with a sticky greeting and notification badge, highlights the most important KPI, puts primary role actions within thumb reach, turns performance metrics into a horizontal stat rail, exposes gamification and leaderboard as shortcut cards, and keeps community, wallet activity, trends, connections, and learning as compact scan-first sections. The existing desktop child widgets are not forced into mobile; their business data is reused through the parent container state.

Performance:
The mobile component extends the existing dashboard container and reuses the same services, computed summaries, user-driven initialization, polling, follow actions, wallet navigation, campaign navigation, and community navigation. It avoids rendering the desktop widget tree on mobile, reducing DOM size on the highest-traffic dashboard route.

Accessibility:
Notifications, primary actions, section actions, connection follow buttons, course actions, activity rows, and bottom navigation are real controls with mobile-sized targets. KPI values use visible labels, and the mobile bottom nav has an explicit navigation label.

## Dashboard Profile Mobile UX Analysis

Purpose:
`/dashboard/profile` and `/dashboard/profile/:id` are the identity and trust pages for MarketSpase users. They show who a promoter or marketer is, their reputation signals, posts, followers, following, badges, collaboration reviews, and profile actions like follow, message, and edit.

Desktop behavior:
The desktop profile page uses a broad profile shell with cover media, profile metadata, tabbed content, feed cards, network lists, badges, collaboration reviews, and dialogs. It owns profile loading, feed loading, follow/unfollow, message navigation, followers/following pagination, badge loading, collaboration review actions, and flagging logic.

Mobile decisions:
The mobile profile becomes a native trust profile rather than a squeezed desktop layout. It leads with a cover hero, avatar, verification/role cues, headline, bio, and a compact stat rail. Profile sections become sticky thumb tabs for Overview, Posts, Network, and Badges. The Overview section surfaces location, profile completeness, trust score, campaign/product performance, collaboration reputation, and social links. Posts reuse the existing feed card component, while Network and Badges become compact cards. The primary follow/edit and message actions stay sticky at the bottom for one-handed use.

Theme alignment:
The mobile stylesheet imports the shared dynamic design system with `@use '../../../styles/variables' as vars;` and `@use '../../../styles/mixins' as mixins;`. It uses shared surface, border, text, status, spacing, radius, shadow, and gradient tokens so light and dark themes remain consistent with the rest of MarketSpase.

Performance:
The mobile component extends the existing profile component and reuses the same services, signals, computed values, pagination, feed handlers, collaboration review actions, and navigation. Mobile/tablet users do not render the desktop profile DOM, and the sectioned view keeps secondary content out of the initial visual path.

Accessibility:
Back, follow/edit, message, tabs, network refresh, social links, and sticky actions are real labelled controls with touch-sized targets. Section tabs expose pressed state, visual metrics also have text labels, and loading/error/empty states avoid misleading blank content.

## Daily Check-In Mobile UX Analysis

Purpose:
The embedded dashboard daily check-in prompt helps marketers and promoters keep a streak, complete the active-session requirement, understand point rewards, and withdraw matured reward points to the correct wallet.

Desktop behavior:
The existing desktop component renders a fixed floating chip and opens a centered modal with reward cards, progress bars, payout maturity, and wallet withdrawal. It owns no business rules directly; all session state, heartbeat pings, progress calculations, and withdrawals live in `DailyCheckInService`.

Mobile decisions:
The mobile version keeps the same service-driven business behavior but changes the presentation into a mobile-native bottom dock. The dock stays above the mobile dashboard navigation and opens a bottom sheet instead of a centered modal. The sheet leads with the current streak, reward state, today's reward, active-session progress, payout maturity, and one large wallet withdrawal action. This avoids the desktop modal feel and keeps the check-in reachable by thumb without interrupting the mobile home feed.

Performance:
The mobile component extends the existing daily check-in component and reuses the same signals, computed values, service calls, and withdrawal method. Mobile/tablet users do not render the desktop modal tree, and the loading state is a lightweight dock skeleton.

Accessibility:
The dock, close control, and withdrawal action are real labelled buttons with mobile-sized targets. The bottom sheet uses dialog semantics with `aria-modal`, has a labelled heading, respects reduced motion, and keeps visible text for all reward/progress values.

## Community Discussion Forum Mobile UX Analysis

Purpose:
`/dashboard/community/discussion` is the signed-in forum entry point where marketers, promoters, and store owners browse discussions, search for answers, filter by tags/categories, follow useful topics, and start new rich discussions.

Desktop behavior:
The desktop forum page uses a sticky toolbar, two-column layout, search/filter bar, topic chips, thread-list component, pagination, and a right sidebar with community stats, pinned discussions, trending topics, active users, and hot topics. It owns thread loading, search debounce, pagination, tag filtering, topic follow state, and create-thread dialog refresh.

Mobile decisions:
The mobile page is a native community feed entry rather than a compressed sidebar layout. It leads with a compact app bar and compose button, then shows a forum hero, swipeable community stats, a sticky touch search row, topic chips, hot pinned/trending cards, and the existing thread-list component so owner/admin thread actions remain available. Sidebar-only content moves into bottom sheets for filters and community insights. Pagination becomes a compact Previous/Page/Next strip, and the discussion composer stays available through a sticky bottom action.

Theme alignment:
The mobile stylesheet imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`, then builds on shared background, surface, text, border, spacing, radius, shadow, gradient, and status tokens. This keeps the light and dark theme behavior in the same design flow as the rest of the app.

Performance:
The mobile component extends the existing forum page and reuses the same forum service, debounce search, pagination, filter methods, follow-topic logic, create-thread refresh, and thread-list business actions. It avoids rendering the desktop sidebar and moves optional panels behind sheets, reducing initial mobile DOM weight.

Accessibility:
Search, sort, topic filters, insights, pagination, compose, and close controls are real buttons or labelled inputs with mobile-sized targets. Bottom sheets use dialog semantics, selected chips expose pressed state, and loading uses skeleton cards instead of an empty flash.

## Community Thread Detail Mobile UX Analysis

Purpose:
`/dashboard/community/discussion/:threadId` is where users read a full discussion, view media, vote in polls, like/follow the thread, and participate through comments.

Desktop behavior:
The desktop thread detail uses a Material card reader with back navigation, media grid, sanitized content, poll controls, tags, thread actions, comment form, and nested comment cards. It owns thread loading, optimistic thread likes, thread follows, poll option selection/submission, comment creation, comment likes, comment deletion, and profile navigation.

Mobile decisions:
The mobile page becomes a focused reading and reply experience. It leads with a sticky app bar, then presents the discussion category/time, title, author card, swipeable engagement rail, swipeable media rail, content, poll voting, and tag chips. Likes, follow state, and reply entry remain available in a bottom sticky action bar so users do not need to scroll back to the top. The comment form is styled as a native reply composer, and existing comment cards are reused to preserve moderation and owner actions.

Theme alignment:
The mobile stylesheet imports `@use '../../../../../../styles/variables' as vars;` and `@use '../../../../../../styles/mixins' as mixins;`. It uses the shared dynamic surface, text, border, gradient, spacing, radius, shadow, and primary RGB tokens so the reader behaves correctly in both light and dark themes.

Performance:
The mobile component extends the existing thread detail component and reuses its API calls, form state, poll logic, optimistic like behavior, follow handling, comment mutation paths, and profile navigation. The mobile template avoids rendering the desktop Material card tree and keeps large media in a horizontally scrollable rail.

Accessibility:
Back, reply, like, follow, poll options, poll submit, and retry controls are real buttons with touch-sized targets. Poll selection exposes pressed state, the reply textarea has an explicit label, and loading uses stable skeleton cards.

## Community Feed Composer Mobile UX Analysis

Purpose:
`/dashboard/community/feeds/create` and `/dashboard/community/feeds/edit/:id` let marketers create or update social feed posts from campaigns, storefront products, or manual creator stories while preserving media uploads, linked campaign/product assets, hashtags, challenge metadata, anonymous posting, comment controls, and external-sharing settings.

Desktop behavior:
The desktop composer uses a two-column form plus live preview. It owns route edit loading, campaign/store/product loading, source switching, local media object URLs, content counting, hashtag/challenge state, form validation, create `FormData`, edit payloads, snackbars, and feed navigation.

Mobile decisions:
The mobile composer is a thumb-first posting flow rather than a compressed desktop form. It starts with a sticky app bar and readiness summary, uses large source tabs, selected campaign/product cards, horizontal caption starter cards, a media upload drop area with swipeable media rail, and a collapsed advanced section for challenge, hashtags, and privacy/share options. The live preview becomes a bottom sheet, and publish/update stays in a sticky bottom bar so users can complete the post with one hand.

Theme alignment:
The mobile stylesheet imports `@use '../../../../../styles/variables' as vars;` and `@use '../../../../../styles/mixins' as mixins;`. It uses shared dynamic background, surface, text, border, primary RGB, gradient, spacing, shadow, radius, safe-area, and tablet breakpoint tokens so light and dark mode remain aligned with the MarketSpase design model.

Performance:
The mobile component extends the existing composer component and reuses the same service calls, route edit flow, validation, source selection, media cleanup, create/edit payloads, and preview model. Mobile/tablet users do not render the desktop two-column preview layout, and optional controls are kept behind a native details panel or bottom sheet.

Accessibility:
Back, source selection, media upload/removal, caption starters, hashtags, preview, and publish/update controls are real labelled buttons or form fields. The preview sheet uses dialog semantics, selected source tabs expose active state through styling and tab roles, and touch targets are sized for mobile use.

## Public Feed Post Viewer Mobile UX Analysis

Purpose:
`/feed/:postId` is the public deep-link surface for a shared MarketSpase community post. It must let signed-in and signed-out visitors read the post, copy/share it, open WhatsApp where available, sign in for protected actions, and return safely to the previous page or app flow.

Desktop behavior:
The desktop viewer uses a sticky header, centered feed-card shell, loading/error states, and the shared `FeedPostCardComponent`. It owns post loading, auth-gated like/save/comment actions, link copy, WhatsApp share, chat tracking, hashtag navigation, return-to handling, and fallback navigation.

Mobile decisions:
The mobile viewer is designed as a native social post screen. It starts with a compact sticky app bar, uses a stable loading card plus skeleton so the post area never flashes empty, shows a small community context card above the shared post card, and keeps WhatsApp, copy, and comment/open-app actions in a sticky bottom action bar. Signed-out users see an Open app action instead of a dead comment action.

Theme alignment:
The mobile stylesheet imports `@use '../../../../../styles/variables' as vars;` and `@use '../../../../../styles/mixins' as mixins;`. It uses dynamic background, surface, text, border, primary RGB, gradient, shadow, spacing, radius, safe-area, and tablet breakpoint tokens so light and dark themes follow the same MarketSpase design flow.

Performance:
The mobile component extends the existing public feed post component and reuses the same loading effect, feed service, post signal, share/comment/chat handlers, and navigation behavior. Mobile/tablet users do not render the desktop centered shell, and the skeleton is pure CSS with no extra data work.

Accessibility:
Close, copy, WhatsApp, comment, open-app, and error recovery actions are labelled real controls with mobile-sized targets. Loading state uses polite visible text, error state includes text plus an action, and post actions remain reachable without scrolling back to the top.

## Public Referral Capture Mobile UX Analysis

Purpose:
`/ref/:username` is the public referral entry point. It validates the referral code, stores the invite for signup through localStorage/cookie, shows success or failure, and then returns the visitor to the main app flow.

Desktop behavior:
The desktop component is an inline centered card. It owns route parameter reading, referral validation through `ProfileService`, referral storage, referral cleanup on failure, success/error state, and delayed home navigation.

Mobile decisions:
The mobile page is designed as a native invite confirmation screen rather than a small card on a gradient. It starts with a sticky top app bar, keeps the loading state stable with skeleton rows while the referral validates, presents success/error states as clear outcome cards, explains the three-step referral flow, and keeps Continue/Help actions pinned above the mobile safe area. This helps signed-out mobile visitors understand that the invite is being saved and avoids the feeling of a broken redirect page.

Theme alignment:
The mobile stylesheet imports `@use '../../../styles/variables' as vars;` and `@use '../../../styles/mixins' as mixins;`. It uses shared background, surface, text, divider, border, shadow, spacing, z-index, radius, safe-area, `--primary-rgb`, `--primary-color`, and `vars.$gradient-primary` tokens so light and dark mode stay aligned with the MarketSpase design model.

Performance:
The mobile component extends the existing referral capture component and reuses the same route, service call, referral storage, error cleanup, and redirect behavior. Mobile/tablet users do not mount the desktop card tree, and the skeleton uses CSS only.

Accessibility:
Back, continue, and help actions are real labelled controls with mobile-sized targets. Loading uses polite visible messaging, outcome state is text-first, and the sticky footer keeps the primary action reachable without scrolling.

## Public Campaign Unavailable Mobile UX Analysis

Purpose:
`/campaigns/unavailable` is the public recovery route used when a promotion or campaign tracking link can no longer accept traffic. It explains why the click was redirected, prevents a broken browser page, and gives visitors safe next actions.

Desktop behavior:
The desktop component renders a two-column explanatory page. It owns query parameter reading for campaign title, unavailable reason, and seller contact URL. It also maps reason codes into user-facing headline/body copy and validates contact links so only WhatsApp URLs are exposed.

Mobile decisions:
The mobile page becomes a native recovery screen rather than a stacked desktop explanation. It leads with a compact app bar and reason icon, then shows a large reason card with tone-specific styling for budget, expiry, review, invalid, or removed states. The campaign title and trust signals are separated into a summary card, the safe-redirect explanation becomes numbered mobile rows, seller contact appears only when the sanitized contact URL is present, and Explore/Get help actions stay sticky above the safe area.

Theme alignment:
The mobile stylesheet imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared background, surface, text, divider, border, shadow, spacing, radius, z-index, safe-area, `--primary-rgb`, `--primary-color`, and dynamic brand gradients so light and dark themes stay aligned with the MarketSpase design model.

Performance:
The mobile component extends the existing campaign unavailable component and reuses the same query parameter, reason mapping, contact URL sanitization, and public navigation behavior. Mobile/tablet users do not render the desktop two-column recovery shell.

Accessibility:
Back, explore, help, and seller-contact actions are real labelled links/buttons with mobile-sized targets. The reason status is repeated in text and icon form, and numbered recovery rows avoid relying on color alone.

## Get Started Onboarding Mobile UX Analysis

Purpose:
`/dashboard/get-started/onboarding` helps new and returning users understand the next concrete setup steps for their current MarketSpase role, especially marketers launching campaigns/stores and promoters learning how to earn responsibly.

Desktop behavior:
The desktop component renders a broad onboarding workspace with hero progress, role switching, role-specific step lists, proof guidance, Facebook video links, FAQ categories, and support actions. It owns profile loading through `DashboardService`, route/query handling, role-switch countdown state, step definitions, FAQ/category filtering, role toggling, and navigation to setup destinations.

Mobile decisions:
The mobile page becomes a native setup companion rather than a stacked desktop guide. It starts with a sticky app bar, user identity, role label, progress meter, and compact role cards. The current role's onboarding steps become touch-first checklist cards with clear status and a single action. Promoter quality rules are surfaced as short warning/tip cards, video guides use segmented role tabs, FAQs become chip-filtered rows, and the next incomplete step stays reachable in the sticky bottom action area.

Theme alignment:
The mobile stylesheet imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared surface, text, border, status, spacing, radius, shadow, z-index, safe-area, and dynamic brand tokens so light and dark themes follow the current MarketSpase design model.

Performance:
The mobile component extends the existing onboarding component and reuses the same profile load, role-switch flow, step definitions, FAQ content, video links, and navigation methods. Mobile/tablet users do not mount the full desktop section tree, and derived state uses computed signals for the visible steps, progress count, next step, and FAQ slice.

Accessibility:
Role switches, setup actions, video links, FAQ category chips, and sticky next-step actions are real buttons or links with readable labels. Progress is represented with text and bar width, not color alone, and mobile touch controls remain sized for one-handed use.

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

## Campaign Creation Mobile UX Analysis

Route:
`/dashboard/campaigns/create`

Purpose:
This page lets marketers create a PPC campaign by adding media/content, selecting a campaign goal, setting budget and targeting, choosing schedule, and reviewing before launch or draft save.

Desktop reference:
The desktop campaign creation page uses a wide sticky toolbar, a horizontal stepper, embedded child form cards, and final action buttons. It owns the core campaign forms, validation state, wallet funding dialog, media upload, draft save, create request, and navigation.

Mobile decisions:
The mobile view keeps the same campaign creation class behavior and child form components, but presents the flow as a native setup wizard. It leads with a compact app bar, sticky draft action, mobile progress card, horizontally scrollable step rail, current-task context card, wallet/budget/click snapshot on the budget step, and fixed bottom actions. This keeps the money-sensitive launch controls reachable by thumb while avoiding a stacked desktop toolbar/stepper on phones.

Performance:
The mobile component extends the existing campaign creation logic and only renders the active step surface. The desktop component remains untouched and is not mounted on mobile/tablet, reducing duplicated DOM and preserving the existing API/media upload behavior.

Accessibility:
Back, save, step, previous, next, and launch controls are real buttons with labels or aria labels. The progress card exposes the current step, submission progress uses `role="status"` with polite live updates, and sticky actions stay above the mobile safe area.

## Campaign Details Mobile UX Analysis

Route:
`/dashboard/campaigns/:id`

Purpose:
This page lets marketers monitor one campaign, review campaign media and setup, top up budget, pause/resume/activate, change targeting, open the collaboration room, inspect promoter activity, message promoters, and review the activity timeline.

Desktop reference:
The desktop page uses a wide gradient header, overview card, media/info two-column layout, KPI grid, promotions table with filters, and an activity log. It owns campaign loading, budget calculations, top-up, status changes, targeting navigation, collaboration navigation, media viewer, search/filter, promotion detail dialog, and promoter messaging.

Mobile decisions:
The mobile page becomes a campaign control room. It leads with a sticky title bar and media-first hero, then exposes the most important operational actions as thumb-sized quick action tiles. Budget health and PPC performance become a compact progress card and horizontal metric rail. The desktop promotions table is replaced with promoter activity cards, keeping tracked clicks, billable clicks, spend, last activity, detail view, and message actions easy to scan on a phone.

Performance:
The mobile component extends the existing campaign details logic and renders only the active mobile cards. Desktop remains unchanged and is not mounted for mobile/tablet users, while all API calls and mutations continue through the existing `CampaignDetailsService`.

Accessibility:
Back, edit, media, top-up, targeting, collaboration, status, filter, promotion detail, and messaging controls are real buttons or links. Loading uses a polite status region, search uses a labelled input wrapper, and the mobile cards avoid horizontal tables.

## Campaign Editing Mobile UX Analysis

Route:
`/dashboard/campaigns/edit/:id`

Purpose:
This page lets marketers safely update campaign basics, budget settings, schedule, promoter requirements, and then jump into the dedicated location-targeting workspace.

Desktop reference:
The desktop campaign edit page uses a wide header, stacked form cards, shared child form components, snackbar feedback, native date adapter imports, and the existing campaign edit service for loading and saving.

Mobile decisions:
The mobile page keeps the same campaign edit class behavior and child form components, but presents the form as a native section editor. It leads with campaign context and saved/unsaved state, uses a horizontal section rail for Basics, Budget, Schedule, Rules, and Targeting, and keeps the primary action sticky for one-handed editing. JavaScript confirm prompts are avoided in the mobile shell; unsaved navigation and targeting transitions use a bottom-sheet confirmation.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared surface, text, border, spacing, radius, shadow, z-index, and breakpoint tokens, plus CSS theme variables such as `--primary-color`, `--primary-rgb`, and `--gradient-primary` so light and dark mode follow the app design model.

Performance:
The mobile component extends the existing campaign edit component and only renders the active form section. Desktop stays untouched and is not mounted for mobile/tablet users, reducing form DOM weight while preserving the existing validators, patching, update payload, snackbars, and navigation behavior.

Accessibility:
Back, retry, section, targeting, discard, save, and navigation controls are real buttons. Loading uses `role="status"`, errors use `role="alert"`, bottom-sheet prompts use dialog semantics, and touch targets are kept at mobile-safe sizes.

## Campaign Collaboration Mobile UX Analysis

Route:
`/dashboard/campaigns/collaboration`

Purpose:
This page keeps marketers and promoters aligned through campaign rooms, promotion rooms, and direct messages without sending them out of the MarketSpase workflow.

Desktop reference:
The desktop collaboration page uses a large hero, KPI cards, starter grids, recent collaborator shortcuts, a two-column thread/chat workspace, realtime subscriptions, route query resolution, conversation loading, read tracking, and message sending.

Mobile decisions:
The mobile page becomes a native collaboration workbench with three focused views: Home, Threads, and Chat. Home prioritizes quick starters, recent people, and latest conversations. Threads provides search and filter chips in a scroll-friendly list. Chat renders a compact message stream with a mobile composer. Selecting a thread switches into Chat, while all API, realtime, route-query, mark-read, and send-message behavior stays inherited from the existing component.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. It uses shared theme tokens for surface, background, borders, typography, spacing, shadows, safe-area layout, and touch breakpoints, with `--primary-color`, `--primary-rgb`, and `--gradient-primary` for dynamic light/dark brand treatment.

Performance:
The mobile component reuses the existing collaboration service/realtime flows and renders bounded slices for home previews while keeping the full filtered thread list capped for mobile. Desktop is not mounted for mobile/tablet users, avoiding the large two-column desktop workspace on small devices.

Accessibility:
Home/thread/chat navigation uses real buttons, loading states use polite status regions, errors use alert semantics, chat can be reached from selected conversations, and all primary touch actions are sized for mobile use.

## Campaign Targeting Mobile UX Analysis

Route:
`/dashboard/campaigns/:id/targeting`

Purpose:
This page lets marketers decide whether a campaign should be open to broad promotion or restricted to selected geographic areas such as countries, cities, addresses, or places.

Desktop reference:
The desktop targeting page uses a desktop header component, a centered form card, the existing Google Places/manual location targeting component, and save/cancel actions. It owns campaign loading, location signals, enable-target state, deduplication, and the update request.

Mobile decisions:
The mobile page becomes a focused location workspace. It leads with a sticky mobile app bar and campaign context, shows the current targeting mode and selected-area count, surfaces a warning when targeting is enabled without any selected areas, previews selected locations as native cards, and keeps save/cancel actions fixed above the mobile safe area. The existing targeting child component is reused so Google Places/manual entry behavior stays consistent.

Theme alignment:
The mobile SCSS imports `@use '../../../../styles/variables' as vars;` and `@use '../../../../styles/mixins' as mixins;`. The layout uses shared background, surface, border, text, gradient, status, spacing, radius, shadow, breakpoint, and blur tokens so light and dark mode remain aligned with the app design model.

Performance:
The mobile component extends the existing targeting component and does not mount the desktop header/card tree on mobile/tablet. Computed signals provide the compact campaign title, selected-location count, preview slice, and warning state without extra subscriptions.

Accessibility:
Back, retry, clear, save, and cancel controls are real buttons with readable labels or aria labels. Loading uses `role="status"` with polite live updates, errors use `role="alert"`, sticky actions preserve touch-sized controls, and summary cards avoid horizontal overflow.

## Implementation Pattern Used

Files added:

```text
projects/platform/src/app/campaign/campaign-edit/index.ts
projects/platform/src/app/campaign/campaign-edit/mobile/campaign-edit-mobile.component.ts
projects/platform/src/app/campaign/campaign-edit/mobile/campaign-edit-mobile.component.html
projects/platform/src/app/campaign/campaign-edit/mobile/campaign-edit-mobile.component.scss
projects/platform/src/app/campaign/collaboration/index.ts
projects/platform/src/app/campaign/collaboration/mobile/campaign-collaboration-mobile.component.ts
projects/platform/src/app/campaign/collaboration/mobile/campaign-collaboration-mobile.component.html
projects/platform/src/app/campaign/collaboration/mobile/campaign-collaboration-mobile.component.scss
projects/platform/src/app/campaign/targeting/index.ts
projects/platform/src/app/campaign/targeting/mobile/campaign-targeting-mobile.component.ts
projects/platform/src/app/campaign/targeting/mobile/campaign-targeting-mobile.component.html
projects/platform/src/app/campaign/targeting/mobile/campaign-targeting-mobile.component.scss
projects/platform/src/app/campaign/campaign-details/index.ts
projects/platform/src/app/campaign/campaign-details/mobile/campaign-details-mobile.component.ts
projects/platform/src/app/campaign/campaign-details/mobile/campaign-details-mobile.component.html
projects/platform/src/app/campaign/campaign-details/mobile/campaign-details-mobile.component.scss
projects/platform/src/app/campaign/create/index.ts
projects/platform/src/app/campaign/create/mobile/create-campaign-mobile.component.ts
projects/platform/src/app/campaign/create/mobile/create-campaign-mobile.component.html
projects/platform/src/app/campaign/create/mobile/create-campaign-mobile.component.scss
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
projects/platform/src/app/store/promoter/product-detail/index.ts
projects/platform/src/app/store/promoter/product-detail/mobile/promoter-product-details-mobile.component.ts
projects/platform/src/app/store/promoter/product-detail/mobile/promoter-product-details-mobile.component.html
projects/platform/src/app/store/promoter/product-detail/mobile/promoter-product-details-mobile.component.scss
projects/platform/src/app/store/promoter/store-products-list/index.ts
projects/platform/src/app/store/promoter/store-products-list/mobile/store-products-list-mobile.component.ts
projects/platform/src/app/store/promoter/store-products-list/mobile/store-products-list-mobile.component.html
projects/platform/src/app/store/promoter/store-products-list/mobile/store-products-list-mobile.component.scss
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
projects/platform/src/app/settings/mobile/settings-mobile-index.component.ts
projects/platform/src/app/settings/mobile/settings-mobile-index.component.html
projects/platform/src/app/settings/mobile/settings-mobile-index.component.scss
projects/platform/src/app/settings/account/index.ts
projects/platform/src/app/settings/account/mobile/account-mobile.component.ts
projects/platform/src/app/settings/account/mobile/account-mobile.component.html
projects/platform/src/app/settings/account/mobile/account-mobile.component.scss
projects/platform/src/app/settings/system/index.ts
projects/platform/src/app/settings/system/mobile/system-setting-mobile.component.ts
projects/platform/src/app/settings/system/mobile/system-setting-mobile.component.html
projects/platform/src/app/settings/system/mobile/system-setting-mobile.component.scss
projects/platform/src/app/settings/support/index.ts
projects/platform/src/app/settings/support/mobile/support-mobile.component.ts
projects/platform/src/app/settings/support/mobile/support-mobile.component.html
projects/platform/src/app/settings/support/mobile/support-mobile.component.scss
projects/platform/src/app/tutorials/index.ts
projects/platform/src/app/tutorials/mobile/tutorials-mobile.component.ts
projects/platform/src/app/tutorials/mobile/tutorials-mobile.component.html
projects/platform/src/app/tutorials/mobile/tutorials-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/overview/index.ts
projects/platform/src/app/ai-assistant/pages/overview/mobile/overview-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/overview/mobile/overview-mobile.component.html
projects/platform/src/app/ai-assistant/pages/overview/mobile/overview-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/faqs/index.ts
projects/platform/src/app/ai-assistant/pages/faqs/mobile/faqs-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/faqs/mobile/faqs-mobile.component.html
projects/platform/src/app/ai-assistant/pages/faqs/mobile/faqs-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/conversations/index.ts
projects/platform/src/app/ai-assistant/pages/conversations/mobile/conversations-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/conversations/mobile/conversations-mobile.component.html
projects/platform/src/app/ai-assistant/pages/conversations/mobile/conversations-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/automation/index.ts
projects/platform/src/app/ai-assistant/pages/automation/mobile/automation-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/automation/mobile/automation-mobile.component.html
projects/platform/src/app/ai-assistant/pages/automation/mobile/automation-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/analytics/index.ts
projects/platform/src/app/ai-assistant/pages/analytics/mobile/analytics-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/analytics/mobile/analytics-mobile.component.html
projects/platform/src/app/ai-assistant/pages/analytics/mobile/analytics-mobile.component.scss
projects/platform/src/app/ai-assistant/pages/settings/index.ts
projects/platform/src/app/ai-assistant/pages/settings/mobile/settings-mobile.component.ts
projects/platform/src/app/ai-assistant/pages/settings/mobile/settings-mobile.component.html
projects/platform/src/app/ai-assistant/pages/settings/mobile/settings-mobile.component.scss
projects/platform/src/app/dashboard/search/index.ts
projects/platform/src/app/dashboard/search/mobile/global-search-mobile.component.ts
projects/platform/src/app/dashboard/search/mobile/global-search-mobile.component.html
projects/platform/src/app/dashboard/search/mobile/global-search-mobile.component.scss
projects/platform/src/app/dashboard/leaderboard/index.ts
projects/platform/src/app/dashboard/leaderboard/mobile/leaderboard-mobile.component.ts
projects/platform/src/app/dashboard/leaderboard/mobile/leaderboard-mobile.component.html
projects/platform/src/app/dashboard/leaderboard/mobile/leaderboard-mobile.component.scss
projects/platform/src/app/dashboard/gamification/index.ts
projects/platform/src/app/dashboard/gamification/mobile/gamification-mobile.component.ts
projects/platform/src/app/dashboard/gamification/mobile/gamification-mobile.component.html
projects/platform/src/app/dashboard/gamification/mobile/gamification-mobile.component.scss
projects/platform/src/app/dashboard/main-content/index.ts
projects/platform/src/app/dashboard/main-content/mobile/dashboard-main-mobile.component.ts
projects/platform/src/app/dashboard/main-content/mobile/dashboard-main-mobile.component.html
projects/platform/src/app/dashboard/main-content/mobile/dashboard-main-mobile.component.scss
projects/platform/src/app/dashboard/daily-check-in/index.ts
projects/platform/src/app/dashboard/daily-check-in/mobile/daily-check-in-mobile.component.ts
projects/platform/src/app/dashboard/daily-check-in/mobile/daily-check-in-mobile.component.html
projects/platform/src/app/dashboard/daily-check-in/mobile/daily-check-in-mobile.component.scss
projects/platform/src/app/wallet/transfer/index.ts
projects/platform/src/app/wallet/transfer/mobile/transfer-funds-mobile.component.ts
projects/platform/src/app/wallet/transfer/mobile/transfer-funds-mobile.component.html
projects/platform/src/app/wallet/transfer/mobile/transfer-funds-mobile.component.scss
projects/platform/src/app/wallet/withdrawal/index.ts
projects/platform/src/app/wallet/withdrawal/mobile/withdrawal-mobile.component.ts
projects/platform/src/app/wallet/withdrawal/mobile/withdrawal-mobile.component.html
projects/platform/src/app/wallet/withdrawal/mobile/withdrawal-mobile.component.scss
projects/platform/src/app/wallet/funding/index.ts
projects/platform/src/app/wallet/funding/mobile/wallet-funding-mobile.component.ts
projects/platform/src/app/wallet/funding/mobile/wallet-funding-mobile.component.html
projects/platform/src/app/wallet/funding/mobile/wallet-funding-mobile.component.scss
projects/platform/src/app/legal/index.ts
projects/platform/src/app/legal/mobile/legal-mobile-shell.component.ts
projects/platform/src/app/legal/mobile/legal-mobile-shell.component.html
projects/platform/src/app/legal/mobile/legal-mobile-shell.component.scss
projects/platform/src/app/legal/cookies/index.ts
projects/platform/src/app/legal/cookies/mobile/cookies-mobile.component.ts
projects/platform/src/app/legal/cookies/mobile/cookies-mobile.component.html
projects/platform/src/app/legal/cookies/mobile/cookies-mobile.component.scss
projects/platform/src/app/legal/terms/index.ts
projects/platform/src/app/legal/terms/mobile/terms-mobile.component.ts
projects/platform/src/app/legal/terms/mobile/terms-mobile.component.html
projects/platform/src/app/legal/terms/mobile/terms-mobile.component.scss
projects/platform/src/app/legal/privacy/index.ts
projects/platform/src/app/legal/privacy/mobile/privacy-mobile.component.ts
projects/platform/src/app/legal/privacy/mobile/privacy-mobile.component.html
projects/platform/src/app/legal/privacy/mobile/privacy-mobile.component.scss
projects/platform/src/app/community/feeds/create/index.ts
projects/platform/src/app/community/feeds/create/mobile/create-feed-mobile.component.ts
projects/platform/src/app/community/feeds/create/mobile/create-feed-mobile.component.html
projects/platform/src/app/community/feeds/create/mobile/create-feed-mobile.component.scss
projects/platform/src/app/community/feeds/public-feed-post/index.ts
projects/platform/src/app/community/feeds/public-feed-post/mobile/public-feed-post-mobile.component.ts
projects/platform/src/app/community/feeds/public-feed-post/mobile/public-feed-post-mobile.component.html
projects/platform/src/app/community/feeds/public-feed-post/mobile/public-feed-post-mobile.component.scss
projects/platform/src/app/referral/index.ts
projects/platform/src/app/referral/mobile/referral-capture-mobile.component.ts
projects/platform/src/app/referral/mobile/referral-capture-mobile.component.html
projects/platform/src/app/referral/mobile/referral-capture-mobile.component.scss
projects/platform/src/app/campaign/public-campaign-unavailable/index.ts
projects/platform/src/app/campaign/public-campaign-unavailable/mobile/public-campaign-unavailable-mobile.component.ts
projects/platform/src/app/campaign/public-campaign-unavailable/mobile/public-campaign-unavailable-mobile.component.html
projects/platform/src/app/campaign/public-campaign-unavailable/mobile/public-campaign-unavailable-mobile.component.scss
projects/platform/src/app/get-started/onboarding/index.ts
projects/platform/src/app/get-started/onboarding/mobile/get-started-mobile.component.ts
projects/platform/src/app/get-started/onboarding/mobile/get-started-mobile.component.html
projects/platform/src/app/get-started/onboarding/mobile/get-started-mobile.component.scss
projects/platform/src/app/ai-assistant/index.ts
projects/platform/src/app/ai-assistant/mobile/ai-assistant-mobile-shell.component.ts
projects/platform/src/app/ai-assistant/mobile/ai-assistant-mobile-shell.component.html
projects/platform/src/app/ai-assistant/mobile/ai-assistant-mobile-shell.component.scss
```

Files updated:

```text
projects/platform/src/app/transactions/index.ts
projects/platform/src/app/campaign/campaign.component.ts
projects/platform/src/app/campaign/campaign.routes.ts
projects/platform/src/app/store/index.ts
projects/platform/src/app/dashboard/dashboard.routes.ts
projects/platform/src/app/store/store.routes.ts
projects/platform/src/app/store/promoter/promoted-products/index.ts
projects/platform/src/app/ai-assistant/ai-assistant.routes.ts
projects/platform/src/app/ai-assistant/pages/faqs/faqs.component.ts
projects/platform/src/app/ai-assistant/pages/settings/settings.component.ts
projects/platform/src/app/app.routes.ts
projects/platform/src/app/dashboard/index.ts
projects/platform/src/app/dashboard/index.html
projects/platform/src/app/transactions/transactions.routes.ts
projects/platform/src/app/wallet/withdrawal/withdrawal.component.html
projects/platform/src/app/wallet/withdrawal/withdrawal.component.ts
projects/platform/src/app/dashboard/sidenav/sidenav.component.ts
projects/platform/src/app/campaign/create/create-campaign.component.ts
projects/platform/src/app/legal/legal.routes.ts
projects/platform/src/app/community/feeds/feeds.routes.ts
projects/platform/src/app/app.routes.ts
projects/platform/src/app/get-started/get-started.routes.ts
projects/platform/src/app/campaign/public-campaign-unavailable/desktop/public-campaign-unavailable.component.scss
projects/platform/src/app/ai-assistant/ai-assistant.routes.ts
projects/platform/src/app/ai-assistant/ai-assistant.component.scss
```

The desktop `TransactionComponent` is unchanged. The wrapper now renders `MobileTransactionsComponent` for mobile/tablet and the existing `TransactionComponent` for desktop.

The desktop `TransferFundsComponent` is unchanged. The transfer route now renders `TransferFundsMobileComponent` for mobile/tablet and keeps the existing desktop transfer workspace for desktop.

The desktop `WithdrawalComponent` keeps its existing payout workspace. Its bank interface is exported for mobile reuse, and its submit guard remains aligned with the marketer-withdrawal restriction. The withdrawal route now renders `WithdrawalMobileComponent` for mobile/tablet and keeps the existing desktop payout workspace for desktop.

The desktop `WalletFundingComponent` is unchanged. The funding dialog now opens `WalletFundingIndexComponent`, which renders `WalletFundingMobileComponent` for mobile/tablet and keeps the existing desktop funding component for desktop.

The desktop `PromoterProductsListComponent` is unchanged. The new product-list wrapper renders `MobilePromoterProductsListComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `PromoterProductDetailsComponent` is unchanged. The new promoter product-detail wrapper renders `PromoterProductDetailsMobileComponent` for mobile/tablet and keeps the existing desktop product detail workspace for desktop.

The desktop `StoreProductsListComponent` is unchanged. The new store product shelf wrapper forwards the `storeId` route param to both branches, renders `StoreProductsListMobileComponent` for mobile/tablet, and keeps the existing desktop store product grid for desktop.

The desktop `StorefrontOrdersComponent` is unchanged. The new orders wrapper renders `MobileStorefrontOrdersComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `MarketerLandingComponent` and `PromoterLandingComponent` are unchanged. The campaign role switcher now renders `MarketerLandingMobileComponent` or `PromoterLandingMobileComponent` for mobile/tablet and keeps the existing desktop components for desktop.

The desktop `PromotionComponent` is unchanged. The new promotion wrapper renders `PromotionMobileComponent` for mobile/tablet and keeps the existing desktop component for desktop.

The desktop `CampaignAnalyticsComponent` is unchanged. The new analytics wrapper renders `CampaignAnalyticsMobileComponent` for mobile/tablet and keeps the existing desktop analytics workspace for desktop.

The desktop `MarketerPromotedProductsAnalyticsComponent` is unchanged. The new promoted-products analytics wrapper renders `MarketerPromotedProductsAnalyticsMobileComponent` for mobile/tablet and keeps the existing desktop analytics workspace for desktop.

The desktop `StoreEmailSubscribersComponent` is unchanged. The new subscribers wrapper renders `StoreEmailSubscribersMobileComponent` for mobile/tablet and keeps the existing desktop subscribers table for desktop.

The desktop promoted-products page under `/dashboard/stores/promotions` is unchanged. Its mobile component now handles mobile/tablet users with native cards, filters, and release-request presentation.

The desktop `ReferralCaptureComponent` is unchanged. The public referral route now renders `ReferralCaptureMobileComponent` for mobile/tablet and keeps the existing centered referral card for desktop.

The desktop `PublicCampaignUnavailableComponent` is unchanged. The public campaign-unavailable route now renders `PublicCampaignUnavailableMobileComponent` for mobile/tablet and keeps the existing two-column recovery page for desktop.

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

The desktop settings shell in `SettingsIndexComponent` is unchanged for desktop. The settings index now renders `SettingsMobileIndexComponent` for mobile/tablet and keeps the existing Material sidenav shell for desktop.

The desktop `AccountComponent` is unchanged. The settings account route now renders `AccountMobileComponent` for mobile/tablet and keeps the existing expansion-panel account workspace for desktop.

The desktop `CreateFeedPageComponent` is unchanged. The feed create/edit routes now render `CreateFeedMobileComponent` for mobile/tablet through `CreateFeedIndexComponent`, while desktop keeps the existing two-column composer and live preview workspace.

The desktop `PublicFeedPostComponent` is unchanged. The public feed route now renders `PublicFeedPostMobileComponent` for mobile/tablet through `PublicFeedPostIndexComponent`, while desktop keeps the existing centered post viewer.

The desktop `SystemSettingComponent` is unchanged. The settings system route now renders `SystemSettingMobileComponent` for mobile/tablet and keeps the existing tab/accordion system workspace for desktop.

The desktop `SupportComponent` is unchanged. The settings support route now renders `SupportMobileComponent` for mobile/tablet and keeps the existing tabbed contact/testimonial workspace for desktop.

The desktop `TutorialsComponent` is unchanged. The tutorials route now renders `TutorialsMobileComponent` for mobile/tablet and keeps the existing desktop learning center for desktop.

The desktop `HelpCenterComponent` is unchanged for desktop. The resources help-center route now renders `HelpCenterMobileComponent` for mobile/tablet and keeps the existing desktop help landing page for desktop. The shared help-center search subscription now uses Angular destroy handling so the wrapper can be used safely across device switches.

The desktop `FeaturesComponent` is unchanged for desktop. The resources features route now renders `FeaturesMobileComponent` for mobile/tablet and keeps the existing full desktop feature landing page for desktop.

The desktop `FAQComponent` is unchanged for desktop. The resources FAQ route now renders `FAQMobileComponent` for mobile/tablet and keeps the existing desktop FAQ landing page for desktop. The shared FAQ search subscription now uses Angular destroy handling so the mobile answer finder can reuse the same local FAQ data safely.

The desktop `ContactComponent` is unchanged for desktop. The resources contact route now renders `ContactMobileComponent` for mobile/tablet and keeps the existing desktop contact landing page for desktop. The mobile contact flow reuses the same form group, `ContactService`, WhatsApp action, and team contact methods.

The desktop `HowItWorksComponent` is unchanged for desktop. The resources how-it-works route now renders `HowItWorksMobileComponent` for mobile/tablet and keeps the existing full desktop explainer for desktop.

The desktop `BenefitsComponent` is unchanged for desktop. The resources benefits route now renders `BenefitsMobileComponent` for mobile/tablet and keeps the existing full desktop benefits page for desktop.

The desktop `CareersComponent` is unchanged for desktop. The resources careers route now renders `CareersMobileComponent` for mobile/tablet and keeps the existing full desktop hiring page for desktop.

The desktop `ForMarketersComponent` is unchanged for desktop. The resources marketer solution route now renders `ForMarketersMobileComponent` for mobile/tablet and keeps the existing full desktop marketer guide for desktop.

The desktop `ForPromotersComponent` is unchanged for desktop. The resources promoter solution route now renders `ForPromotersMobileComponent` for mobile/tablet and keeps the existing full desktop promoter guide for desktop.

The desktop `LegalComponent` is unchanged for desktop. The legal parent route now renders `LegalMobileShellComponent` for mobile/tablet and keeps the existing side-menu legal shell for desktop.

The desktop `CookiesComponent` is unchanged for desktop. The legal cookies route now renders `CookiesMobileComponent` for mobile/tablet and keeps the existing full cookies policy document for desktop.

The desktop `TermsComponent` is unchanged for desktop. The legal terms route now renders `TermsMobileComponent` for mobile/tablet and keeps the existing full terms document for desktop.

The desktop `PrivacyComponent` is unchanged for desktop. The legal privacy route now renders `PrivacyMobileComponent` for mobile/tablet and keeps the existing full legal policy document for desktop.

The desktop AI assistant `OverviewComponent` is unchanged. The assistant overview route now renders `OverviewMobileComponent` for mobile/tablet and keeps the existing desktop control room for desktop.

The desktop `AiAssistantComponent` is unchanged as the desktop assistant shell. The assistant customer parent route now renders `AiAssistantMobileShellComponent` for mobile/tablet and keeps the existing toolbar/sidenav shell for desktop.

The desktop AI assistant `FaqsComponent` keeps the existing desktop UI and behavior. Its delete path now exposes a shared internal removal method so the mobile FAQ trainer can use a bottom-sheet confirmation instead of a browser confirm.

The desktop AI assistant `ConversationsComponent` is unchanged. The conversations route now renders `ConversationsMobileComponent` for mobile/tablet and keeps the existing two-column desktop chat workspace for desktop.

The desktop AI assistant `AutomationComponent` is unchanged. The automation route now renders `AutomationMobileComponent` for mobile/tablet and keeps the existing desktop automation settings grid for desktop.

The desktop AI assistant `AnalyticsComponent` is unchanged. The analytics route now renders `AnalyticsMobileComponent` for mobile/tablet and keeps the existing desktop analytics report for desktop.

The desktop AI assistant `SettingsComponent` keeps the existing desktop UI. Its WhatsApp removal path now exposes a shared internal removal method so the mobile settings hub can use a bottom-sheet confirmation instead of a browser confirm.

The desktop `GlobalSearchPageComponent` is unchanged. The dashboard search route now renders `GlobalSearchMobileComponent` for mobile/tablet and keeps the existing desktop search workspace for desktop.

The desktop `LeaderboardComponent` is unchanged. The dashboard leaderboard route now renders `LeaderboardMobileComponent` for mobile/tablet and keeps the existing desktop leaderboard workspace for desktop.

The desktop `GamificationComponent` is unchanged. The dashboard gamification route now renders `GamificationMobileComponent` for mobile/tablet and keeps the existing desktop rewards dashboard for desktop.

The desktop `DashboardMainContainer` is unchanged. The dashboard root route now renders `DashboardMainMobileComponent` for mobile/tablet and keeps the existing desktop home dashboard for desktop.

The desktop `DailyCheckInComponent` is unchanged. The dashboard shell now renders `DailyCheckInMobileComponent` for mobile/tablet and keeps the existing floating chip/modal for desktop.

The desktop `GetStartedComponent` is unchanged. The onboarding route now renders `GetStartedMobileComponent` for mobile/tablet and keeps the existing desktop onboarding workspace for desktop.

The desktop `CreateCampaignComponent` is unchanged. The campaign creation route now renders `CreateCampaignMobileComponent` for mobile/tablet and keeps the existing stepper workspace for desktop.

The desktop `CampaignDetailsComponent` is unchanged. The campaign details route now renders `CampaignDetailsMobileComponent` for mobile/tablet and keeps the existing desktop campaign detail workspace for desktop.

## Remaining Migration Notes

Product management is now covered for the core list/manage route, product creation flow, product editing flow, and product detail workspace. The marketer storefront dashboard, promoter store browsing, promoter store product shelf, store creation, store editing, storefront customer support, wallet transfer, wallet withdrawal, wallet funding, campaign creation, campaign details, settings shell, account settings, system settings, support settings, tutorials learning center, public help center, public about, public success stories, public community, public careers, public marketer solution, public promoter solution, public features, public FAQ, public contact, public how-it-works, public benefits, public legal shell, public cookies policy, public terms of service, public privacy policy, dashboard home, dashboard daily check-in, dashboard get-started onboarding, dashboard global search, dashboard leaderboard, dashboard gamification, AI assistant overview, AI assistant FAQs, AI assistant conversations, AI assistant automation, AI assistant analytics, and AI assistant settings are also covered. The next passes should focus on the remaining resources content and other dense desktop-first dashboard pages.
