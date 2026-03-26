import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { IncomingHttpHeaders } from 'http';

// Use Stripe's recommended environment variable name
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const jwtSecret = process.env.WEBHOOK_JWT_SECRET as string;

// Add type for headers
type WebhookHeaders = IncomingHttpHeaders & {
  'x-hub-signature-256'?: string;
  'x-webhook-token'?: string;
};

function verifyJwt(token: string): boolean {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    // Add any additional validation if needed
    return true;
  } catch {
    return false;
  }
}

function verifyWebhook(payload: string, headers: WebhookHeaders): { valid: boolean, error?: string } {
  try {
    // Verify JWT token if provided
    if (headers['x-webhook-token'] && !verifyJwt(headers['x-webhook-token'])) {
      return { valid: false, error: 'Invalid JWT token' };
    }

    // Verify HMAC signature
    const signature = headers['x-hub-signature-256'];
    if (!signature) {
      return { valid: false, error: 'Missing signature header' };
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );

    return { valid: isValid };
  } catch (error) {
    console.error('Webhook verification error:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    if (!verifyWebhook(rawBody, headers)) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    // Process the event with logging
    console.log('Auth webhook received:', {
      type: payload.type,
      userId: payload.userId,
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
