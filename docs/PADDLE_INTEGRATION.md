# Paddle Integration - Code Guardian Studio

**Version:** 3.1.0
**Date:** 2025-12-04
**Status:** ✅ Code Complete - Awaiting Paddle Account Setup

---

## What's Done

### ✅ Backend Implementation

1. **PaddleService** (`src/modules/license/paddle.service.ts`)
   - Checkout URL generation with passthrough data
   - Webhook event handling (subscription_created, subscription_updated, subscription_cancelled, subscription_payment_failed)
   - License key generation on successful payment
   - Email sending (console logging for now, ready for Resend)
   - Webhook signature verification (optional, for production)

2. **API Routes**
   - `/api/checkout` - Returns Paddle Hosted Checkout URL
   - `/api/webhooks/paddle` - Handles Paddle webhook events
   - `/api/license/verify` - Verifies license keys from CLI

3. **Documentation**
   - Updated [LICENSE_SYSTEM.md](LICENSE_SYSTEM.md) with complete Paddle workflow
   - Created this integration guide

4. **TypeScript Build**
   - ✅ Compiled successfully
   - ✅ No errors
   - ✅ Ready for deployment

---

## What's Next

### 🔄 Paddle Dashboard Setup (User Action Required)

1. **Create Paddle Account**
   ```
   URL: https://www.paddle.com
   Type: Paddle Billing
   Wait: 1-3 days for approval
   ```

2. **Create Product**
   ```
   Product Name: Code Guardian Studio - Team
   Description: Team plan with advanced features
   ```

3. **Create Prices**
   ```
   Monthly: $39/month (recurring)
   Yearly: $390/year (10% discount, optional)
   ```

4. **Create Hosted Checkout**
   ```
   Dashboard → Checkout → Checkout Settings
   Product: Code Guardian Studio - Team
   Price: $39/month
   Success URL: https://codeguardian.studio/success?session_id={checkout_id}
   Cancel URL: https://codeguardian.studio/pricing
   ```

5. **Get Checkout URL**
   ```
   Example: https://buy.paddle.com/product/xxx
   Copy this URL for environment variables
   ```

6. **Configure Webhook**
   ```
   Dashboard → Developer Tools → Notifications
   Endpoint URL: https://codeguardian.studio/api/webhooks/paddle
   Events to subscribe:
   - subscription.created
   - subscription.updated
   - subscription.cancelled
   - subscription.payment_succeeded
   - subscription.payment_failed
   ```

7. **Get API Credentials**
   ```
   Dashboard → Developer Tools → Authentication
   - Vendor ID
   - API Key
   - Public Key (for signature verification)
   ```

---

## Environment Variables

Add these to Vercel:

```bash
# Paddle Configuration
PADDLE_VENDOR_ID=12345
PADDLE_API_KEY=xxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
PADDLE_CHECKOUT_URL_TEAM=https://buy.paddle.com/product/xxx
PADDLE_PRODUCT_ID_TEAM=pro_team
```

---

## Testing Checklist

### Sandbox Testing

- [ ] Switch to Paddle Sandbox mode
- [ ] Create test product and checkout
- [ ] Test checkout with card: 4242 4242 4242 4242
- [ ] Verify webhook delivery in Event Logs
- [ ] Check license key generation
- [ ] Test CLI activation with mock key

### Production Testing

- [ ] Paddle account approved
- [ ] Product created
- [ ] Hosted Checkout configured
- [ ] Webhook endpoint verified
- [ ] Environment variables set in Vercel
- [ ] End-to-end flow test with real payment
- [ ] Verify email delivery (after Resend setup)

---

## Key Differences: Paddle vs Stripe

| Feature | Stripe | Paddle |
|---------|--------|--------|
| **Type** | Payment processor | Merchant of Record |
| **VAT/Tax** | Manual configuration | Automatic global handling |
| **Checkout** | API-driven sessions | Pre-configured Hosted Checkout |
| **Webhook Format** | JSON with signature header | Form-encoded or JSON |
| **Signature Verification** | Required (webhook secret) | Optional (public key) |
| **Dashboard** | More technical | More business-oriented |
| **Pricing** | Pay-per-transaction | Percentage-based |

---

## Why Paddle?

1. **Merchant of Record** - Paddle handles VAT, tax, compliance automatically across 200+ countries
2. **Simplified Setup** - No need to register for tax in multiple jurisdictions
3. **Global Payments** - Built-in support for international customers
4. **Hosted Checkout** - No PCI compliance concerns
5. **Better for SaaS** - Designed specifically for software subscriptions

---

## Current Flow

```
User → /pricing
  ↓
Clicks "Get Team"
  ↓
POST /api/checkout → Returns Paddle Checkout URL
  ↓
Redirect to Paddle Hosted Checkout
  ↓
User enters card details on Paddle
  ↓
Paddle processes payment
  ↓
Paddle sends webhook to /api/webhooks/paddle
  ↓
Backend receives subscription_created event
  ↓
Extract email, subscription ID from payload
  ↓
Generate license key: CGS-TEAM-XXXX-XXXX
  ↓
Save to database
  ↓
Send email with license key (console log for now)
  ↓
Redirect user to /success?session_id=xxx
  ↓
User copies license key
  ↓
User runs: ccg activate
  ↓
CLI calls /api/license/verify
  ↓
Backend verifies license
  ↓
CLI saves to .ccg/license.json
  ↓
Team features unlocked! 🎉
```

---

## Email Service Setup

**Current:** Console logging
**Next:** Resend integration

```bash
npm install resend

# .env.local
RESEND_API_KEY=re_xxx
```

Update `paddle.service.ts` → `sendLicenseEmail()`:

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

---

## Troubleshooting

### Webhook Not Received

1. Check Paddle Dashboard → Event Logs
2. Verify webhook URL is correct
3. Test with Paddle Sandbox first
4. Check Vercel deployment logs

### License Key Not Generated

1. Check webhook payload in logs
2. Verify `subscription_created` event is subscribed
3. Check for errors in `/api/webhooks/paddle`

### CLI Activation Fails

1. Verify `/api/license/verify` is accessible
2. Check license key format (must start with CGS-)
3. Test with mock mode first

---

## Next Steps for Launch

1. **Paddle Account** - Wait for approval (1-3 days)
2. **Product Setup** - Create product and prices in Paddle Dashboard
3. **Checkout URL** - Get Hosted Checkout URL
4. **Webhook Config** - Set up webhook endpoint
5. **Environment Variables** - Add to Vercel
6. **Email Service** - Set up Resend
7. **Test End-to-End** - Complete flow with real payment
8. **Launch!** 🚀

---

**Built with:** Claude + Code Guardian Studio
**License:** MIT
**Version:** 3.1.0
**Commit:** f7ada99
