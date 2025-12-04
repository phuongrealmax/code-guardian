/**
 * Paddle Integration Service
 *
 * Handles Paddle checkout and webhook processing
 * Paddle is Merchant of Record - handles VAT/tax automatically
 */
import { LicenseService } from './license.service.js';
export interface PaddleCheckoutParams {
    tier: 'team' | 'enterprise';
    email?: string;
    successUrl: string;
    cancelUrl: string;
}
export interface PaddleWebhookEvent {
    alert_name: string;
    alert_id: string;
    [key: string]: any;
}
export declare class PaddleService {
    private paddleVendorId;
    private paddleApiKey;
    private paddlePublicKey;
    private licenseService;
    private productIds;
    constructor(vendorId?: string, apiKey?: string, publicKey?: string, licenseService?: LicenseService);
    /**
     * Get Paddle Checkout URL
     *
     * For Paddle, we use Hosted Checkouts which are pre-configured
     * in Paddle Dashboard. This returns the checkout URL.
     */
    getCheckoutUrl(params: PaddleCheckoutParams): string;
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
    handleWebhook(payload: any): Promise<{
        handled: boolean;
        license?: any;
    }>;
    /**
     * Handle subscription created
     */
    private handleSubscriptionCreated;
    /**
     * Handle subscription updated
     */
    private handleSubscriptionUpdated;
    /**
     * Handle subscription cancelled
     */
    private handleSubscriptionCancelled;
    /**
     * Handle payment failed
     */
    private handlePaymentFailed;
    /**
     * Map Paddle subscription status to license status
     */
    private mapPaddleStatus;
    /**
     * Send license email
     */
    private sendLicenseEmail;
    /**
     * Verify webhook signature (for production)
     */
    private verifyWebhookSignature;
    /**
     * Get Paddle product IDs
     */
    getProductIds(): {
        team: string;
    };
}
//# sourceMappingURL=paddle.service.d.ts.map