/**
 * Paddle Webhook Handler
 * POST /api/webhooks/paddle
 *
 * Handles Paddle events (subscription created, updated, cancelled, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Paddle sends webhooks as form-encoded data
    const contentType = request.headers.get('content-type');
    let payload: any;

    if (contentType?.includes('application/json')) {
      payload = await request.json();
    } else {
      // Form-encoded (Paddle default)
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const paddleVendorId = process.env.PADDLE_VENDOR_ID;
    const _paddlePublicKey = process.env.PADDLE_PUBLIC_KEY;

    if (!paddleVendorId) {
      return NextResponse.json(
        { error: 'Paddle not configured' },
        { status: 500 }
      );
    }

    // In real implementation, verify webhook signature and process event
    //
    // const { PaddleService } = await import('@/modules/license/paddle.service');
    // const { LicenseService } = await import('@/modules/license/license.service');
    //
    // const licenseService = new LicenseService();
    // const paddleService = new PaddleService(
    //   paddleVendorId,
    //   process.env.PADDLE_API_KEY,
    //   paddlePublicKey,
    //   licenseService
    // );
    //
    // const result = await paddleService.handleWebhook(payload);
    //
    // return NextResponse.json({
    //   received: true,
    //   handled: result.handled,
    // });

    // Mock response for development
    console.log('Paddle webhook received (mock):', {
      alert_name: payload.alert_name,
      subscription_id: payload.subscription_id,
      email: payload.email,
    });

    return NextResponse.json({
      received: true,
      handled: true,
    });
  } catch (error: any) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
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
