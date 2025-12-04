/**
 * Paddle Checkout API
 * POST /api/checkout
 *
 * Returns Paddle Checkout URL for Team/Enterprise purchases
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, email } = body;

    if (!tier || !['team', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Enterprise redirects to contact sales
    if (tier === 'enterprise') {
      return NextResponse.json({
        url: 'mailto:hello@codeguardian.studio?subject=Enterprise License Inquiry',
      });
    }

    // For Team tier, return Paddle checkout URL
    const paddleVendorId = process.env.PADDLE_VENDOR_ID;
    const paddleCheckoutUrl = process.env.PADDLE_CHECKOUT_URL_TEAM;

    if (!paddleVendorId || !paddleCheckoutUrl) {
      return NextResponse.json(
        { error: 'Paddle not configured' },
        { status: 500 }
      );
    }

    // Build Paddle checkout URL with passthrough data
    const passthrough = JSON.stringify({
      tier: 'team',
      email: email,
      successUrl: `${request.nextUrl.origin}/success`,
      cancelUrl: `${request.nextUrl.origin}/pricing`,
    });

    const url = new URL(paddleCheckoutUrl);
    url.searchParams.set('passthrough', passthrough);
    if (email) {
      url.searchParams.set('email', email);
    }

    return NextResponse.json({
      url: url.toString(),
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
