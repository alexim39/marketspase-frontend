# Admin Deposit Management

## Purpose

The admin deposits page gives finance admins a dedicated view of money entering MarketSpase. It sits under:

- Admin route: `/dashboard/financial/deposits`
- API route: `GET /api/v1/financial/deposits`
- Export route: `POST /api/v1/financial/export/deposits`

The page is intentionally separate from withdrawals because deposits are a cash-in audit workflow. Withdrawals are cash-out operations and retain their existing approval/retry flow.

## Source of Truth

Deposits are not stored in a new collection. The current payment flow records successful wallet funding inside embedded user wallet transactions:

- `users.wallets.marketer.transactions[]`
- `users.wallets.promoter.transactions[]`

Deposit records are identified by:

```text
transaction.category = "deposit"
transaction.type = "credit"
```

This keeps the admin page aligned with the actual wallet ledger used by wallet balances and financial analytics.

## Backend Implementation

Primary files:

- `marketspase-api/src/apps/financial/services/financial-analytics.service.js`
- `marketspase-api/src/apps/financial/controllers/financial.controller.js`
- `marketspase-api/src/apps/financial/routes/financial.routes.js`

The backend uses the existing wallet transaction aggregation projection and extends it with:

- gateway
- settlement amount/currency
- exchange rate
- sanitized payment metadata

The admin response does not expose raw webhook payloads. It returns only finance-useful fields such as gateway, channel, reference, user, amount, status, and provider payment id.

## Query Parameters

`GET /api/v1/financial/deposits`

Supported filters:

- `page`: 1-based page number
- `limit`: page size, capped by the API
- `search`: user name, email, reference, gateway, currency, or description
- `status`: `successful`, `pending`, `processing`, `failed`, `abandoned`, `reversed`, or omitted for all
- `gateway`: `paystack`, `flutterwave`, `bank_transfer`, `system`, or omitted for all
- `currency`: base/native/settlement currency
- `walletType`: `marketer`, `promoter`, or omitted for all
- `fromDate`: ISO/date string
- `toDate`: ISO/date string

The response includes:

- `deposits`: paginated deposit rows
- `total`: filtered total
- `page`
- `limit`
- `summary`: filtered summary for KPI cards, gateway mix, currency mix, and trend

## Frontend Implementation

Primary files:

- `projects/admin/src/app/financial/deposits/deposits.component.ts`
- `projects/admin/src/app/financial/deposits/deposits.component.html`
- `projects/admin/src/app/financial/deposits/deposits.component.scss`
- `projects/admin/src/app/financial/financial.service.ts`
- `projects/admin/src/app/financial/financial.routes.ts`
- `projects/admin/src/app/financial/shared/finance-section-nav.component.ts`
- `projects/admin/src/app/dashboard/index.component.ts`

The component is standalone and lazy loaded. It uses:

- Signals for UI state
- Server-side pagination
- Debounced filters
- Native date inputs to avoid DateAdapter coupling
- CSV export from the API response
- Existing admin theme mixins and variables

## Security Notes

- The route is mounted under `FinancialRouter`, which already applies `authenticate` and `requireAdmin`.
- Raw gateway webhook payloads are not returned to the frontend.
- Search strings are regex-escaped before MongoDB aggregation matching.
- Page size is capped server-side to avoid accidental heavy requests.

## Performance Notes

- The backend uses Mongo aggregation over the existing embedded wallet transaction arrays.
- For larger production scale, consider moving wallet transactions into a dedicated transaction ledger collection while keeping embedded recent wallet transactions as a cache.
- If transaction volume grows beyond embedded-array comfort, create a migration that backfills:

```text
financial_transactions
  userId
  walletType
  type
  category
  status
  reference
  amount
  baseAmount
  currency
  gateway
  createdAt
```

Recommended indexes for that future ledger:

```text
{ category: 1, type: 1, status: 1, createdAt: -1 }
{ reference: 1 }
{ userId: 1, walletType: 1, createdAt: -1 }
{ gateway: 1, createdAt: -1 }
```

## Future Enhancements

- Add a deposit detail dialog with gateway verification status.
- Add webhook reconciliation queue for payments verified by gateway but not recorded locally.
- Add failed/abandoned deposit investigation notes.
- Add daily/weekly anomaly alerts for sudden drops or spikes in deposit volume.
