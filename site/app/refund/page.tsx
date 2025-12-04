import Footer from '../components/Footer';

export const metadata = {
  title: 'Refund Policy — Code Guardian Studio',
  description: 'Refund Policy for Code Guardian Studio',
};

export default function Refund() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>Refund Policy</h1>
          <p className="subtitle">Last updated: December 4, 2025</p>
        </div>
      </section>

      <section>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2>1. 14-Day Money-Back Guarantee</h2>
          <p>
            We offer a <strong>14-day money-back guarantee</strong> for all Team subscriptions. If you're not satisfied
            with Code Guardian Studio, you can request a full refund within 14 days of your initial purchase.
          </p>

          <h3>Eligibility</h3>
          <ul>
            <li>First-time Team subscribers only</li>
            <li>Request must be made within 14 days of initial purchase date</li>
            <li>Applies to monthly and annual subscriptions</li>
            <li>Does not apply to renewals (only first payment)</li>
          </ul>

          <h2>2. How to Request a Refund</h2>
          <p>To request a refund, please contact us with:</p>
          <ol>
            <li>
              Email us at: <a href="mailto:hello@codeguardian.studio">hello@codeguardian.studio</a>
            </li>
            <li>Include your license key or email address used for purchase</li>
            <li>Briefly explain your reason for requesting a refund (optional, helps us improve)</li>
          </ol>
          <p>
            <strong>Processing time:</strong> Refunds are typically processed within 5-7 business days. You will receive
            a confirmation email once the refund is issued.
          </p>

          <h2>3. Subscription Cancellation</h2>
          <p>You can cancel your subscription at any time:</p>

          <h3>How to Cancel</h3>
          <ul>
            <li>
              Via Paddle: Log in to your Paddle account and manage your subscription
            </li>
            <li>
              Via Email: Contact <a href="mailto:hello@codeguardian.studio">hello@codeguardian.studio</a> with your
              license key
            </li>
          </ul>

          <h3>What Happens After Cancellation</h3>
          <ul>
            <li>Your license remains active until the end of the current billing period</li>
            <li>You will not be charged for the next billing cycle</li>
            <li>After the period ends, your license status will change to "cancelled"</li>
            <li>Team features will be disabled (reverts to Free Dev tier)</li>
            <li>Your data and settings are retained for 90 days in case you reactivate</li>
          </ul>

          <h3>No Partial Refunds</h3>
          <p>
            If you cancel mid-cycle, you will retain access to Team features until the end of the paid period, but{' '}
            <strong>no partial refunds</strong> are issued for unused time.
          </p>

          <h2>4. Enterprise Refunds</h2>
          <p>
            Enterprise plans have custom refund terms negotiated in your contract. Please refer to your Enterprise
            Agreement or contact your account manager.
          </p>

          <h2>5. Exceptions to Refund Policy</h2>
          <p>Refunds may NOT be granted in the following cases:</p>
          <ul>
            <li>
              <strong>Violation of Terms:</strong> If your account was suspended or terminated for violating our{' '}
              <a href="/terms">Terms of Service</a>
            </li>
            <li>
              <strong>Abuse of Service:</strong> Fraudulent activity, license key sharing, or excessive API usage
            </li>
            <li>
              <strong>Renewal Charges:</strong> Refunds only apply to initial purchases, not automatic renewals
            </li>
            <li>
              <strong>After 14 Days:</strong> Requests made after the 14-day guarantee window
            </li>
            <li>
              <strong>Chargebacks:</strong> If you file a chargeback, you forfeit your right to a refund and may be
              banned from the Service
            </li>
          </ul>

          <h2>6. Downgrading Plans</h2>
          <p>If you want to downgrade from Team to Free Dev:</p>
          <ul>
            <li>Cancel your Team subscription (follows cancellation policy above)</li>
            <li>You can continue using Team features until the end of the billing period</li>
            <li>After cancellation, you'll automatically revert to the Free Dev tier</li>
            <li>No refunds for unused Team time</li>
          </ul>

          <h2>7. Payment Failures</h2>
          <p>If your payment fails (expired card, insufficient funds, etc.):</p>
          <ul>
            <li>You will receive an email notification from Paddle</li>
            <li>You have 7 days to update your payment method</li>
            <li>If payment is not updated within 7 days, your license will be marked as "inactive"</li>
            <li>Team features will be disabled</li>
            <li>Your license can be reactivated by updating payment information</li>
          </ul>

          <h2>8. Chargebacks</h2>
          <p>
            <strong>Please contact us before filing a chargeback.</strong> Chargebacks have significant fees for small
            businesses and should be a last resort.
          </p>
          <p>If you file a chargeback:</p>
          <ul>
            <li>Your license will be immediately revoked</li>
            <li>You may be banned from creating future accounts</li>
            <li>We will dispute fraudulent chargebacks</li>
            <li>You forfeit your right to a refund through our normal process</li>
          </ul>
          <p>
            We're here to help! If there's an issue with your payment or service, please reach out to us first at{' '}
            <a href="mailto:hello@codeguardian.studio">hello@codeguardian.studio</a>.
          </p>

          <h2>9. Taxes and VAT</h2>
          <p>
            Paddle handles all tax calculations and compliance (VAT, GST, sales tax) automatically based on your
            location. Taxes are <strong>non-refundable</strong> as they have been remitted to tax authorities.
          </p>
          <p>If you are refunded:</p>
          <ul>
            <li>You will receive a refund for the base subscription price</li>
            <li>Taxes are handled by Paddle according to local tax laws</li>
            <li>In some jurisdictions, taxes may be refunded; in others, they may not</li>
          </ul>

          <h2>10. Free Dev Tier</h2>
          <p>
            The Free Dev tier is provided at no cost and has no refund policy, as there are no payments involved. You
            can use the Free Dev tier indefinitely at no charge.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Material changes will be communicated via email or
            through the Service. The updated policy will apply to purchases made after the effective date of the
            changes.
          </p>

          <h2>12. Contact Us</h2>
          <p>For refund requests or questions about this policy:</p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:hello@codeguardian.studio">hello@codeguardian.studio</a>
            </li>
            <li>
              <strong>Subject Line:</strong> "Refund Request - [Your License Key or Email]"
            </li>
          </ul>
          <p>We aim to respond to all refund requests within 1-2 business days.</p>

          <hr style={{ margin: '48px 0', opacity: 0.2 }} />

          <div
            className="feature-card"
            style={{
              background: 'rgba(88, 101, 242, 0.1)',
              border: '1px solid var(--primary)',
              textAlign: 'center',
            }}
          >
            <h3>💡 Try Risk-Free</h3>
            <p>
              Not sure if Code Guardian Studio is right for you? Try the <strong>Free Dev tier</strong> first to test
              basic features, then upgrade to Team when you're ready. The 14-day money-back guarantee means you can try
              Team features risk-free.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
