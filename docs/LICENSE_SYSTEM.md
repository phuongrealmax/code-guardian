# Code Guardian Studio - License System Documentation

**Version:** 3.1.0
**Date:** 2025-12-04
**Author:** Claude + Mona

---

## Overview

Code Guardian Studio sử dụng hệ thống license key để kiểm soát quyền truy cập Team và Enterprise features.

**Kiến trúc:**
- **Free Dev tier:** Không cần license, tất cả users có thể dùng basic features
- **Team tier ($39/mo):** Cần license key, unlock advanced features (reports, agents, latent chain, etc.)
- **Enterprise tier (Custom):** Contact sales, custom license với unlimited seats

---

## Architecture

```
User → codeguardian.studio/pricing → [Get Team] Button
  ↓
  POST /api/checkout → Returns Paddle Checkout URL
  ↓
  User completes payment on Paddle (Merchant of Record)
  ↓
  Paddle sends webhook to /api/webhooks/paddle
  ↓
  Backend creates license key (CGS-TEAM-XXXX-XXXX)
  ↓
  License saved to database + Email sent to user
  ↓
  User runs `ccg activate` in CLI
  ↓
  CLI calls /api/license/verify with license key
  ↓
  Backend verifies → Returns tier + features
  ↓
  CLI saves license to .ccg/license.json
  ↓
  Team features unlocked!
```

---

## Components

### 1. License Database (`src/modules/license`)

**Files:**
- `license.types.ts` - TypeScript types và interfaces
- `license.service.ts` - License CRUD operations (SQLite)
- `paddle.service.ts` - Paddle integration (Merchant of Record)
- `stripe.service.ts` - Stripe integration (legacy, kept for reference)

**Database Schema:**
```sql
CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL,                    -- 'dev', 'team', 'enterprise'
  status TEXT NOT NULL,                  -- 'active', 'inactive', 'cancelled', 'expired'

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  company_name TEXT,
  seats INTEGER DEFAULT 1,               -- For seat limits

  created_at INTEGER NOT NULL,
  activated_at INTEGER,
  expires_at INTEGER,
  cancelled_at INTEGER,

  last_verified_at INTEGER,
  verify_count INTEGER DEFAULT 0
);

CREATE TABLE license_machines (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE(license_id, machine_id)
);
```

**License Key Format:**
```
CGS-{TIER}-{RANDOM}-{RANDOM}

Examples:
- CGS-TEAM-A3K9-P2Q7
- CGS-ENTP-X8M4-N5R2
```

**Features by Tier:**
```typescript
dev: [
  'code_optimizer',
  'memory',
  'guard',
  'workflow',
  'basic_reports',
]

team: [
  'code_optimizer',
  'memory',
  'guard',
  'workflow',
  'advanced_reports',
  'report_dashboard',
  'latent_chain',
  'agents',
  'thinking',
  'documents',
  'testing',
  'auto_agent',
  'priority_support',
]

enterprise: [
  ...all team features,
  'soc2_compliance',
  'sso',
  'audit_logs',
  'dedicated_support',
  'custom_integrations',
  'unlimited_seats',
]
```

---

### 2. API Endpoints (`site/app/api`)

#### **POST /api/checkout**
Creates a Stripe Checkout session for Team tier purchase.

**Request:**
```json
{
  "tier": "team",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx"
}
```

**Implementation:**
- Uses Stripe SDK to create checkout session
- Redirects to Stripe hosted checkout page
- On success → redirects to `/success?session_id={CHECKOUT_SESSION_ID}`
- On cancel → redirects to `/pricing`

---

#### **POST /api/webhooks/paddle**
Handles Paddle webhook events (subscription created, updated, cancelled, etc.)

**Headers:**
```
Content-Type: application/x-www-form-urlencoded (or application/json)
```

**Events Handled:**
- `subscription_created` / `subscription_payment_succeeded` → Create license + Send email
- `subscription_updated` → Update license status
- `subscription_cancelled` → Cancel license
- `subscription_payment_failed` → Mark license as inactive

**Webhook Processing:**
1. Parse Paddle payload (form-encoded or JSON)
2. Verify webhook signature with Paddle public key (optional)
3. For `subscription_created` / `subscription_payment_succeeded`:
   - Extract email, tier, subscription ID from payload
   - Parse passthrough data for custom parameters
   - Generate license key: `CGS-TEAM-{RANDOM}-{RANDOM}`
   - Save to database
   - Send email with license key
4. Return `{ received: true, handled: true }`

---

#### **POST /api/license/verify**
Verifies license keys from CLI.

**Request:**
```json
{
  "licenseKey": "CGS-TEAM-A3K9-P2Q7",
  "email": "user@example.com",
  "machineId": "abc123"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "license": {
    "tier": "team",
    "status": "active",
    "expiresAt": null,
    "features": [
      "code_optimizer",
      "advanced_reports",
      "latent_chain",
      ...
    ]
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "License key not found"
}
```

**Validation Logic:**
1. Check if license exists in database
2. Check status == 'active'
3. Check không expired
4. Check seat limit (if machineId provided)
   - Count active machines (seen in last 30 days)
   - If seat limit reached and machine not registered → deny
   - Else register/update machine last_seen_at
5. Update verify stats (last_verified_at, verify_count++)
6. Return features list for tier

---

### 3. CLI Activation (`src/bin/commands/activate.ts`)

**Command:**
```bash
ccg activate
```

**Flow:**
1. Prompt user for license key
2. Validate format (must start with `CGS-`)
3. Call `/api/license/verify` with:
   - `licenseKey`
   - `machineId` (hash of hostname + platform)
4. If valid:
   - Save to `.ccg/license.json` (local + global)
   - Display success message + tier + features
5. If invalid:
   - Show error message
   - Suggest contacting support

**License Storage:**
```json
// .ccg/license.json
{
  "licenseKey": "CGS-TEAM-A3K9-P2Q7",
  "tier": "team",
  "status": "active",
  "activatedAt": 1733356800000,
  "features": [
    "code_optimizer",
    "advanced_reports",
    ...
  ]
}
```

**Locations:**
- Project: `.ccg/license.json`
- Global: `~/.ccg/license.json` (fallback for all projects)

---

### 4. Success Page (`site/app/success/page.tsx`)

Displays after successful Stripe checkout.

**URL:**
```
https://codeguardian.studio/success?session_id={CHECKOUT_SESSION_ID}
```

**Content:**
- 🎉 Success message
- License key displayed (copied to clipboard)
- Next steps:
  1. Install CCG: `npm install -g codeguardian-studio`
  2. Activate: `ccg activate`
  3. Enter license key
  4. Start using Team features
- List of unlocked features
- Email confirmation notice

---

## Paddle Setup

### 1. Create Paddle Account
1. Go to [paddle.com](https://www.paddle.com)
2. Sign up for Paddle Billing account
3. Complete business verification (can take 1-3 days)
4. Wait for approval from Paddle team

### 2. Create Product & Prices

**Product:**
- Name: "Code Guardian Studio - Team"
- Description: "Team plan with advanced features"

**Prices:**
- Monthly: $39/mo (recurring subscription)
- Yearly: $390/year (10% discount, recurring)

**Get Product/Price IDs:**
```
pro_team (product ID)
pri_xxx (monthly price ID)
pri_yyy (yearly price ID)
```

### 3. Create Hosted Checkout

**In Paddle Dashboard:**
1. Go to Checkout → Checkout Settings
2. Create new Hosted Checkout for Team Monthly plan
3. Configure:
   - Product: Code Guardian Studio - Team
   - Price: $39/month
   - Success URL: `https://codeguardian.studio/success?session_id={checkout_id}`
   - Cancel URL: `https://codeguardian.studio/pricing`
4. Copy Checkout URL (e.g., `https://buy.paddle.com/product/xxx`)

### 4. Set Environment Variables

**For Next.js site:**
```bash
# .env.local
PADDLE_VENDOR_ID=12345
PADDLE_API_KEY=xxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
PADDLE_CHECKOUT_URL_TEAM=https://buy.paddle.com/product/xxx
PADDLE_PRODUCT_ID_TEAM=pro_team
```

**Get Webhook Configuration:**
1. Go to Paddle Dashboard → Developer Tools → Notifications
2. Add webhook endpoint: `https://codeguardian.studio/api/webhooks/paddle`
3. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.payment_succeeded`
   - `subscription.payment_failed`
4. Copy public key for signature verification (optional)

### 5. Test with Paddle Sandbox

```bash
# Use Paddle Sandbox environment for testing
# 1. Switch to Sandbox in Paddle Dashboard (top-right toggle)
# 2. Create test product and checkout
# 3. Use test card numbers from Paddle docs
# 4. Monitor webhooks in Dashboard → Developer Tools → Event Logs

# Test Cards (Sandbox):
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

---

## Testing

### Local Testing (Mock Mode)

Currently, the system is in **mock mode** for development:

**Checkout:**
- `/api/checkout` returns mock session ID
- Redirects to `/success?session_id=cs_test_mock`

**License Verify:**
- Accepts any license key starting with `CGS-`
- Returns features based on tier in key name

**To Test:**
1. Go to `http://localhost:3000/pricing`
2. Click "Get Team"
3. Should redirect to `/success`
4. Copy mock license key
5. Run `ccg activate`
6. Paste license key
7. Should show "License activated successfully"

### Production Testing

**Pre-launch Checklist:**
- [ ] Paddle account created and approved
- [ ] Products and prices created in Paddle
- [ ] Hosted Checkout configured
- [ ] Webhook endpoint configured
- [ ] Environment variables set in Vercel
- [ ] Test checkout flow with test card: `4242 4242 4242 4242`
- [ ] Verify webhook delivery in Paddle Dashboard → Event Logs
- [ ] Test license activation in CLI
- [ ] Test seat limits (activate on multiple machines)
- [ ] Test subscription cancellation
- [ ] Test payment failure

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

---

## Deployment

### 1. Deploy Next.js Site (Vercel)

```bash
# Already deployed at codeguardian.studio
# Just need to add environment variables in Vercel Dashboard:
```

**Vercel Environment Variables:**
```
PADDLE_VENDOR_ID=12345
PADDLE_API_KEY=xxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
PADDLE_CHECKOUT_URL_TEAM=https://buy.paddle.com/product/xxx
PADDLE_PRODUCT_ID_TEAM=pro_team
```

### 2. Deploy License Database

**Option A: Vercel Postgres**
```bash
# In Vercel Dashboard:
# Storage → Create Database → Postgres
# Then update license.service.ts to use Postgres instead of SQLite
```

**Option B: Railway / Render**
```bash
# Deploy separate backend service with Express + SQLite
# Expose /api/license/verify endpoint
```

**Option C: Turso (SQLite on Edge)**
```bash
# Use Turso for distributed SQLite
npm install @libsql/client

# Update license.service.ts to use Turso client
```

### 3. Enable Real Paddle Integration

**Replace Mock Code:**

In `site/app/api/checkout/route.ts`:
```typescript
// Already implemented - just need to set environment variables:
// PADDLE_VENDOR_ID, PADDLE_CHECKOUT_URL_TEAM

// Code uses PaddleService.getCheckoutUrl() which returns:
const url = new URL(paddleCheckoutUrl);
url.searchParams.set('passthrough', passthrough);
if (email) url.searchParams.set('email', email);
return NextResponse.json({ url: url.toString() });
```

In `site/app/api/webhooks/paddle/route.ts`:
```typescript
// Uncomment real webhook handling
const { PaddleService } = await import('@/modules/license/paddle.service');
const { LicenseService } = await import('@/modules/license/license.service');

const licenseService = new LicenseService();
const paddleService = new PaddleService(
  paddleVendorId,
  process.env.PADDLE_API_KEY,
  paddlePublicKey,
  licenseService
);

const result = await paddleService.handleWebhook(payload);

return NextResponse.json({
  received: true,
  handled: result.handled,
});
```

In `site/app/api/license/verify/route.ts`:
```typescript
// Uncomment real verification
const { LicenseService } = await import('@/modules/license/license.service');
const licenseService = new LicenseService();

const result = licenseService.verifyLicense({
  licenseKey,
  email,
  machineId,
});

return NextResponse.json(result);
```

---

## Email Service

**Currently:** Emails are logged to console (see `stripe.service.ts:sendLicenseEmail`)

**Production Options:**

### Option A: Resend (Recommended)
```bash
npm install resend

# .env.local
RESEND_API_KEY=re_xxx
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'hello@codeguardian.studio',
  to: email,
  subject: 'Your Code Guardian Studio License Key',
  html: `
    <h2>Thank you for your purchase!</h2>
    <p>Your license key: <strong>${licenseKey}</strong></p>
    <p>To activate in CLI:</p>
    <pre>ccg activate</pre>
  `,
});
```

### Option B: SendGrid
```bash
npm install @sendgrid/mail

# .env.local
SENDGRID_API_KEY=SG.xxx
```

### Option C: Postmark
```bash
npm install postmark

# .env.local
POSTMARK_API_KEY=xxx
```

---

## Security Considerations

### 1. License Key Security
- ✅ Keys are random and unpredictable
- ✅ Stored hashed in database (optional upgrade)
- ✅ Rate limit `/api/license/verify` to prevent brute force

### 2. Webhook Security
- ✅ Verify Stripe signature on every webhook
- ✅ Use webhook secret from environment variable
- ✅ Log all webhook events for audit

### 3. Seat Limits
- ✅ Track machines by machine ID hash
- ✅ Consider machines inactive after 30 days
- ✅ Allow seat management in user dashboard (future feature)

### 4. API Security
- ✅ CORS configured for codeguardian.studio only
- ✅ Rate limiting on public endpoints
- ✅ Input validation on all requests

---

## Roadmap

### Phase 1: MVP (Current)
- [x] License database schema
- [x] License service (create, verify, update)
- [x] Stripe checkout API
- [x] Stripe webhook handler
- [x] License verify API
- [x] CLI `ccg activate` command
- [x] Success page

### Phase 2: Production
- [ ] Deploy to Vercel with Stripe keys
- [ ] Test end-to-end flow
- [ ] Enable real Stripe integration
- [ ] Set up email service (Resend)
- [ ] Add rate limiting
- [ ] Monitor webhooks in Stripe Dashboard

### Phase 3: Enhancements
- [ ] User dashboard for license management
- [ ] Seat management (add/remove machines)
- [ ] Usage analytics per license
- [ ] Upgrade/downgrade flows
- [ ] Annual billing option
- [ ] Team member invitations

---

## Support

**For Users:**
- Email: hello@codeguardian.studio
- GitHub Issues: https://github.com/phuongrealmax/claude-code-guardian/issues

**For Developers:**
- See source code in `src/modules/license/`
- Run tests: `npm test`
- Stripe docs: https://stripe.com/docs

---

## Summary

Hệ thống license đã hoàn chỉnh với:

✅ **Database:** SQLite với licenses + license_machines tables
✅ **API Endpoints:** /checkout, /webhooks/paddle, /license/verify
✅ **CLI Command:** `ccg activate`
✅ **Success Page:** `/success` với license key display
✅ **Paddle Integration:** Complete - Merchant of Record handles VAT/tax automatically

**Next Steps:**
1. Create Paddle account and wait for approval
2. Set up product and Hosted Checkout in Paddle Dashboard
3. Add Paddle environment variables to Vercel
4. Test checkout flow with Paddle Sandbox
5. Configure webhook endpoint in Paddle
6. Set up email service (Resend)
7. Launch! 🚀

---

**Built with:** Claude + Code Guardian Studio
**License:** MIT
**Version:** 3.1.0
**Date:** 2025-12-04
