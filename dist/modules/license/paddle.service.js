/**
 * Paddle Integration Service
 *
 * Handles Paddle checkout and webhook processing
 * Paddle is Merchant of Record - handles VAT/tax automatically
 */
import { LicenseService } from './license.service.js';
export class PaddleService {
    paddleVendorId;
    paddleApiKey;
    paddlePublicKey;
    licenseService;
    // Paddle Product IDs (will be set via env vars)
    productIds = {
        team: process.env.PADDLE_PRODUCT_ID_TEAM || 'pro_team',
    };
    constructor(vendorId, apiKey, publicKey, licenseService) {
        this.paddleVendorId = vendorId || process.env.PADDLE_VENDOR_ID || '';
        this.paddleApiKey = apiKey || process.env.PADDLE_API_KEY || '';
        this.paddlePublicKey = publicKey || process.env.PADDLE_PUBLIC_KEY || '';
        this.licenseService = licenseService || new LicenseService();
        if (!this.paddleVendorId) {
            console.warn('Paddle vendor ID not configured. License features will be disabled.');
        }
    }
    /**
     * Get Paddle Checkout URL
     *
     * For Paddle, we use Hosted Checkouts which are pre-configured
     * in Paddle Dashboard. This returns the checkout URL.
     */
    getCheckoutUrl(params) {
        if (!this.paddleVendorId) {
            throw new Error('Paddle not configured');
        }
        if (params.tier === 'enterprise') {
            // Enterprise redirects to contact sales
            return 'mailto:hello@codeguardian.studio?subject=Enterprise License Inquiry';
        }
        // For Team tier, use Paddle Hosted Checkout
        // In production, this will be replaced with actual Paddle checkout link
        // from Paddle Dashboard → Checkout → Hosted Checkouts
        const checkoutUrl = process.env.PADDLE_CHECKOUT_URL_TEAM ||
            'https://pay.paddle.com/checkout/PLACEHOLDER';
        // Paddle supports passthrough for custom data
        const passthrough = JSON.stringify({
            tier: params.tier,
            email: params.email,
            successUrl: params.successUrl,
            cancelUrl: params.cancelUrl,
        });
        // Append passthrough as query param
        const url = new URL(checkoutUrl);
        url.searchParams.set('passthrough', passthrough);
        if (params.email) {
            url.searchParams.set('email', params.email);
        }
        return url.toString();
    }
    /**
     * Handle Paddle webhook
     *
     * Paddle sends webhooks for various events:
     * - subscription_created
     * - subscription_updated
     * - subscription_cancelled
     * - subscription_payment_succeeded
     * - subscription_payment_failed
     */
    async handleWebhook(payload) {
        if (!this.paddleVendorId) {
            throw new Error('Paddle not configured');
        }
        // In production, verify webhook signature using Paddle public key
        // For now, we'll skip verification in dev mode
        const alertName = payload.alert_name;
        switch (alertName) {
            case 'subscription_created':
            case 'subscription_payment_succeeded':
                return await this.handleSubscriptionCreated(payload);
            case 'subscription_updated':
                return await this.handleSubscriptionUpdated(payload);
            case 'subscription_cancelled':
                return await this.handleSubscriptionCancelled(payload);
            case 'subscription_payment_failed':
                return await this.handlePaymentFailed(payload);
            default:
                console.log(`Unhandled Paddle webhook: ${alertName}`);
                return { handled: false };
        }
    }
    /**
     * Handle subscription created
     */
    async handleSubscriptionCreated(payload) {
        const email = payload.email;
        const subscriptionId = payload.subscription_id;
        const customerId = payload.user_id;
        // Parse passthrough data
        let tier = 'team';
        try {
            const passthrough = JSON.parse(payload.passthrough || '{}');
            tier = passthrough.tier || 'team';
        }
        catch (e) {
            console.warn('Failed to parse passthrough:', e);
        }
        if (!email) {
            console.error('No email found in Paddle webhook');
            return { handled: false };
        }
        // Check if license already exists for this subscription
        const existing = this.licenseService.getLicenseByStripeSubscription(subscriptionId);
        if (existing) {
            console.log(`License already exists for subscription: ${subscriptionId}`);
            return { handled: true, license: existing };
        }
        // Create license
        const licenseParams = {
            email,
            tier: tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            seats: tier === 'team' ? 5 : undefined,
        };
        const license = this.licenseService.createLicense(licenseParams);
        // Send email with license key
        await this.sendLicenseEmail(license.email, license.licenseKey);
        console.log(`License created: ${license.licenseKey} for ${email}`);
        return {
            handled: true,
            license,
        };
    }
    /**
     * Handle subscription updated
     */
    async handleSubscriptionUpdated(payload) {
        const subscriptionId = payload.subscription_id;
        const status = payload.status;
        const license = this.licenseService.getLicenseByStripeSubscription(subscriptionId);
        if (!license) {
            console.error(`License not found for subscription: ${subscriptionId}`);
            return { handled: false };
        }
        // Map Paddle status to license status
        const licenseStatus = this.mapPaddleStatus(status);
        this.licenseService.updateLicenseStatus(license.licenseKey, licenseStatus);
        console.log(`License ${license.licenseKey} status updated to ${licenseStatus}`);
        return { handled: true };
    }
    /**
     * Handle subscription cancelled
     */
    async handleSubscriptionCancelled(payload) {
        const subscriptionId = payload.subscription_id;
        const success = this.licenseService.cancelLicense(subscriptionId);
        if (success) {
            console.log(`License cancelled for subscription: ${subscriptionId}`);
        }
        return { handled: success };
    }
    /**
     * Handle payment failed
     */
    async handlePaymentFailed(payload) {
        const subscriptionId = payload.subscription_id;
        const email = payload.email;
        // Could send email notification to user
        console.log(`Payment failed for subscription: ${subscriptionId}, email: ${email}`);
        return { handled: true };
    }
    /**
     * Map Paddle subscription status to license status
     */
    mapPaddleStatus(paddleStatus) {
        switch (paddleStatus) {
            case 'active':
            case 'trialing':
                return 'active';
            case 'past_due':
                return 'inactive';
            case 'deleted':
            case 'paused':
                return 'cancelled';
            default:
                return 'inactive';
        }
    }
    /**
     * Send license email
     */
    async sendLicenseEmail(email, licenseKey) {
        // In real implementation, use email service (Resend, SendGrid, etc.)
        console.log(`
========================================
LICENSE EMAIL (Paddle)
To: ${email}
Subject: Your Code Guardian Studio License Key

Thank you for your purchase!

Your license key: ${licenseKey}

To activate in CLI:
ccg activate

Then enter your license key when prompted.

Need help? Reply to this email or visit:
https://codeguardian.studio/docs/activation

Best regards,
Code Guardian Studio Team
========================================
    `);
        /*
        // Real email implementation (example with Resend):
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
            <p>Then enter your license key when prompted.</p>
          `,
        });
        */
    }
    /**
     * Verify webhook signature (for production)
     */
    verifyWebhookSignature(payload, signature) {
        // In production, use Paddle public key to verify signature
        // See: https://developer.paddle.com/webhook-reference/verifying-webhooks
        /*
        const crypto = require('crypto');
    
        // Sort payload keys
        const keys = Object.keys(payload).sort();
    
        // Build query string
        const queryString = keys
          .filter(key => key !== 'p_signature')
          .map(key => `${key}=${payload[key]}`)
          .join('&');
    
        // Verify signature
        const verify = crypto.createVerify('sha1');
        verify.update(queryString);
        verify.end();
    
        return verify.verify(this.paddlePublicKey, signature, 'base64');
        */
        // Mock verification for development
        return true;
    }
    /**
     * Get Paddle product IDs
     */
    getProductIds() {
        return this.productIds;
    }
}
//# sourceMappingURL=paddle.service.js.map