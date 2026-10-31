# Nova Digital — Digital Marketplace

A full-stack digital-goods marketplace built with Next.js App Router, MongoDB/Mongoose, JWT cookie sessions, Stripe Checkout (optional), customer wallet, manual bank transfer, digital inventory, automatic/manual fulfillment, customer rewards, coupons, notifications and support chat.

## What is included

- Public storefront with catalog search, categories, featured products, product pages and a persistent browser cart.
- Customer registration/sign-in, profile, order history, order detail pages, wallet balance and transaction history.
- Admin control center: products, categories, pricing, sale prices, descriptions, images, delivery modes, inventory codes, orders, customers, coupons, targeted rewards, notifications and store settings.
- Automatic fulfillment from private stock records; manual fulfillment for products handled by an administrator.
- Wallet payment with ledger entries, manual-transfer review, and optional card checkout using Stripe.
- In-app notifications for account creation, orders, payment, delivery, rewards and chat. The storefront refreshes notification counts periodically.
- Private customer/admin support conversations with message history and periodic refresh.
- Customer deletion is implemented as account deactivation plus identifier anonymization so existing financial/order records remain consistent.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS recommended)
- MongoDB database (MongoDB Atlas or a managed/self-hosted MongoDB instance)
- Stripe account/API keys only when card checkout is required

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Set `MONGODB_URI` and a random `JWT_SECRET` (at least 32 characters). Set `NEXT_PUBLIC_SITE_URL` and store details.

4. Create the first administrator:

   ```bash
   npm run seed:admin
   ```

   The seed command uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `ADMIN_NAME`. Use a unique password of at least 12 characters. It safely updates the matching admin account if run again.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`. Sign in with the admin account and open `/admin`.

## Add products and digital stock

1. Create one or more categories in **Admin → Categories**.
2. Add products in **Admin → Products**. Choose **Automatic code delivery** or **Manual delivery by admin**.
3. For automatic products, open **Admin → Digital inventory** and paste one deliverable code/account per line. Stock records are private and are never returned by the public product API.
4. For manual products, the admin confirms payment and enters the delivery details from the order screen.
5. Set public store instructions, currency and announcements in **Admin → Store settings**.

Treat imported codes and account credentials as secrets. Only administrators can inspect stock, and issued values are shown only to the purchaser and administrators on the order page.

## Payments

### Wallet
Administrators can credit or adjust customer wallets from **Admin → Customers**. Every adjustment is written to the wallet transaction ledger. Customers can pay with their available balance.

### Manual transfer
Enter the payment title and instructions in **Admin → Store settings**. Customers place a pending order and may provide a bank/transfer reference. The admin reviews the transfer and uses **Confirm manual payment** on the order; fulfillment then starts.

### Stripe card checkout (optional)
Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, then set `NEXT_PUBLIC_STRIPE_ENABLED=true`. Configure the Stripe webhook endpoint:

`https://YOUR_DOMAIN/api/webhooks/stripe`

Subscribe to `checkout.session.completed` and `checkout.session.expired`. Use Stripe test keys and test webhook events before enabling live payments. The order is not marked paid based on the browser return URL; payment confirmation comes from the signed webhook. Stripe refunds are requested from the admin order action when the Checkout Session payment intent is available.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs the secure HTTP-only session cookie |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Canonical site URL used for payment return URLs |
| `NEXT_PUBLIC_STORE_NAME` | No | Public store name fallback |
| `NEXT_PUBLIC_STORE_CURRENCY` | No | Default catalog currency (for example USD) |
| `ADMIN_EMAIL` | For seed | First administrator email |
| `ADMIN_PASSWORD` | For seed | First administrator password (12+ chars) |
| `ADMIN_NAME` | No | First administrator display name |
| `STRIPE_SECRET_KEY` | Optional | Enables Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional | Verifies Stripe webhooks |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Enables browser push notifications |
| `VAPID_PRIVATE_KEY` | Optional | Signs browser push messages |
| `VAPID_SUBJECT` | Optional | Contact URI for push service (for example mailto:support@example.com) |
| `NEXT_PUBLIC_STRIPE_ENABLED` | Optional | Shows the card payment option when set to true |

Never commit `.env.local`, database credentials, Stripe secrets or digital inventory.

## Build and quality checks

```bash
npm run build
npm run lint
```

The GitHub Actions workflow runs dependency installation and a production build on pushes and pull requests. It does not deploy to Vercel.

## Important operational notes

- Configure real payment credentials and a production MongoDB database before taking live payments.
- Add a persistent image/CDN provider before enabling direct image uploads; this version accepts image URLs in the admin product/category forms.
- In-app notifications and chat refresh while the customer/admin pages are open. Browser push is opt-in per customer and works after VAPID keys are configured. Email/SMS delivery is not wired to a provider in this version.
- The store uses one configured display currency. Configure Stripe-supported currency and product pricing consistently before enabling card checkout.
- Refunds for wallet orders return funds to the customer wallet. Stripe refunds are sent through Stripe. Manual-transfer refunds must be completed using the original transfer channel by the operator.
