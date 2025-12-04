# Paddle Setup Checklist — Code Guardian Studio

**Version:** 3.1.0
**Date:** 2025-12-04
**Status:** ⏳ Awaiting User Action

---

## ✅ What's Already Done (Code Complete)

- [x] Paddle integration code implemented
- [x] Webhook handler created at `/api/webhooks/paddle`
- [x] Checkout API updated to return Paddle URL
- [x] License verification API ready
- [x] CLI `ccg activate` command working
- [x] Legal pages added: /terms, /privacy, /refund
- [x] Footer updated with legal links
- [x] Documentation complete

---

## 📋 Your Action Items (Paddle Dashboard)

### Step 1: Create Paddle Account
- [ ] Go to https://www.paddle.com
- [ ] Sign up for **Paddle Billing** account
- [ ] Complete business verification
- [ ] **Wait 1-3 days for approval** from Paddle team

---

### Step 2: Create Product
After account is approved:

- [ ] Go to **Catalog → Products**
- [ ] Click "Create Product"
- [ ] Product details:
  - Name: `Code Guardian Studio - Team`
  - Description: `Team plan with advanced features: advanced reports, agents, latent chain mode, testing suite, and priority support`
  - Type: **SaaS/Software**
- [ ] Save product

---

### Step 3: Create Price
- [ ] Go to your product → **Prices** tab
- [ ] Click "Add Price"
- [ ] Price details:
  - **Monthly Recurring**: $39/month
  - Currency: USD
  - Billing cycle: Monthly
  - Trial period: None (we offer 14-day refund instead)
- [ ] Optional: Add yearly price $390/year (10% discount)
- [ ] Save price
- [ ] **Copy Price ID** (e.g., `pri_xxx`) → will need for env vars

---

### Step 4: Create Hosted Checkout
- [ ] Go to **Checkout → Checkout Settings**
- [ ] Click "Create Checkout Link"
- [ ] Select product: **Code Guardian Studio - Team**
- [ ] Select price: **$39/month**
- [ ] Success URL: `https://codeguardian.studio/success?session_id={checkout_id}`
- [ ] Cancel URL: `https://codeguardian.studio/pricing`
- [ ] Allow customer to enter email: ✅ Yes
- [ ] Save and **copy Checkout URL** (e.g., `https://buy.paddle.com/product/xxx`)

---

### Step 5: Configure Webhook
- [ ] Go to **Developer Tools → Notifications**
- [ ] Click "Add Notification Destination"
- [ ] Webhook URL: `https://codeguardian.studio/api/webhooks/paddle`
- [ ] Select events to subscribe:
  - [x] `subscription.created`
  - [x] `subscription.updated`
  - [x] `subscription.cancelled`
  - [x] `subscription.payment_succeeded`
  - [x] `subscription.payment_failed`
- [ ] Save webhook
- [ ] **Copy Public Key** (for signature verification, optional)

---

### Step 6: Get API Credentials
- [ ] Go to **Developer Tools → Authentication**
- [ ] Create API key (if not already created)
- [ ] **Copy the following:**
  - Vendor ID (e.g., `12345`)
  - API Key (e.g., `xxx_live_xxx`)
  - Public Key (starts with `-----BEGIN PUBLIC KEY-----`)

---

### Step 7: Add to Vercel Environment Variables
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add the following variables:

```bash
PADDLE_VENDOR_ID=12345
PADDLE_API_KEY=xxx_live_xxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----
PADDLE_CHECKOUT_URL_TEAM=https://buy.paddle.com/product/xxx
PADDLE_PRODUCT_ID_TEAM=pro_team
```

- [ ] Click "Save"
- [ ] Trigger a new deployment in Vercel (or it will deploy automatically)

---

### Step 8: Test End-to-End Flow

#### Sandbox Testing (Recommended First)
- [ ] Switch to **Sandbox mode** in Paddle Dashboard (top-right toggle)
- [ ] Create test product + checkout in Sandbox
- [ ] Update Vercel env vars with Sandbox credentials (temporarily)
- [ ] Test checkout flow:
  - [ ] Go to https://codeguardian.studio/pricing
  - [ ] Click "Get Team"
  - [ ] Complete checkout with test card: `4242 4242 4242 4242`
  - [ ] Verify redirect to `/success` page
  - [ ] Check webhook delivery in Paddle → Event Logs
  - [ ] Verify license key generated
  - [ ] Test `ccg activate` in CLI
  - [ ] Confirm Team features unlocked

#### Production Testing
- [ ] Switch back to **Live mode** in Paddle Dashboard
- [ ] Update Vercel env vars with Live credentials
- [ ] Test with real payment (your own card)
- [ ] Verify entire flow works end-to-end

---

### Step 9: Email Service (Optional but Recommended)
Currently, license keys are logged to console. To send real emails:

- [ ] Sign up for Resend: https://resend.com
- [ ] Add domain verification for `codeguardian.studio`
- [ ] Get API key
- [ ] Add to Vercel env: `RESEND_API_KEY=re_xxx`
- [ ] Uncomment email code in `paddle.service.ts` → `sendLicenseEmail()`

---

## 🚀 Launch Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Webhook endpoint tested and verified
- [ ] Legal pages live (/terms, /privacy, /refund)
- [ ] End-to-end flow tested (Sandbox + Live)
- [ ] Email delivery working (or acceptable to use console logs temporarily)
- [ ] Support email monitoring: hello@codeguardian.studio
- [ ] GitHub Issues monitored for support requests

---

## 📞 Need Help?

**Paddle Support:**
- Dashboard: https://vendors.paddle.com
- Docs: https://developer.paddle.com
- Support: help@paddle.com

**Code Guardian Studio:**
- Email: hello@codeguardian.studio
- GitHub: https://github.com/phuongrealmax/claude-code-guardian/issues
- Docs: See [PADDLE_INTEGRATION.md](PADDLE_INTEGRATION.md)

---

## 📊 Monitoring After Launch

Keep an eye on:
- [ ] Paddle Dashboard → Event Logs (webhook delivery)
- [ ] Vercel Logs (API errors, webhook processing)
- [ ] Email deliverability (Resend dashboard if using)
- [ ] GitHub Issues (user support requests)
- [ ] License database (check for duplicates, errors)

---

**Next Step:** Create Paddle account and wait for approval! 🚀

---

**Built with:** Claude + Code Guardian Studio
**Version:** 3.1.0
**Commit:** bed600f
